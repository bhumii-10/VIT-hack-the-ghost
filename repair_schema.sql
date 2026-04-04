-- =========================================================
-- 🛠️ SAFE SCHEMA REPAIR & UPDATE SCRIPT
-- =========================================================
-- This script fixes the schema errors WITHOUT Deleting data.
-- It ensures tables exist and fixes the Authentication Trigger.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. SAFE ENUM CREATION (Only creates if missing)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'volunteer', 'agency');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_status') THEN
        CREATE TYPE incident_status AS ENUM ('pending', 'verified', 'dispatched', 'resolved', 'closed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_severity') THEN
        CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;
END $$;

-- 3. TABLES (Create if not exists to match your schema)

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role user_role DEFAULT 'user'::user_role,
  avatar_url text,
  phone_number text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  is_broadcasting boolean DEFAULT false,
  last_latitude double precision,
  last_longitude double precision,
  last_location_accuracy double precision,
  last_location_timestamp timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  micro_zone_id text,
  floor_level integer DEFAULT 0,
  precise_latitude double precision,
  precise_longitude double precision,
  location_accuracy double precision,
  last_synced_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid REFERENCES public.profiles(id),
  title text NOT NULL,
  description text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  severity incident_severity DEFAULT 'medium'::incident_severity,
  status incident_status DEFAULT 'pending'::incident_status,
  type text,
  image_url text,
  ai_analysis jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  responder_id uuid REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.incident_rooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id uuid UNIQUE REFERENCES public.incidents(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.incident_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid REFERENCES public.incident_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL,
  total_quantity integer DEFAULT 0,
  available_quantity integer DEFAULT 0,
  agency_id uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.resource_allocations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id uuid REFERENCES public.incidents(id),
  resource_id uuid REFERENCES public.resources(id),
  quantity integer DEFAULT 1,
  allocated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  released_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id uuid REFERENCES public.incidents(id),
  assignee_id uuid REFERENCES public.profiles(id),
  title text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES public.profiles(id),
  subscription jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.location_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  zone_id text,
  timestamp timestamp with time zone DEFAULT now(),
  is_offline_sync boolean DEFAULT false
);

-- 4. 🚨 FIX THE TRIGGER (The cause of your 500 Error) 🚨
-- We replace the trigger with a robust version that handles existing users without crashing via 'ON CONFLICT DO NOTHING'

-- Drop potentially broken trigger/function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create Robust Function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone_number)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
    'user',
    COALESCE(new.raw_user_meta_data->>'phone_number', '')  
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. PERMISSIONS (Fixes RLS/Permission Denied Errors)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Allow everything for now (Hackathon mode) to ensure frontend works
CREATE POLICY "Enable all for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for incidents" ON public.incidents FOR ALL USING (true) WITH CHECK (true);
-- (Repeat for duplicate errors avoidance)
DROP POLICY IF EXISTS "Enable all for profiles" ON public.profiles;
CREATE POLICY "Enable all for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Grant usage just in case
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

