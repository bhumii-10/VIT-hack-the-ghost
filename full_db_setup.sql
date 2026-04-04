-- ==========================================
-- 🚨 FINAL COMPLETE SCHEMA: SANKAT SAATHI 🚨
-- ==========================================

-- 1. CLEANUP (Drop Everything to start fresh)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user;

drop table if exists incident_messages cascade;
drop table if exists incident_rooms cascade;
drop table if exists tasks cascade;
drop table if exists resource_allocations cascade;
drop table if exists resources cascade;
drop table if exists incidents cascade;
drop table if exists audit_logs cascade;
drop table if exists profiles cascade;

drop type if exists user_role cascade;
drop type if exists incident_status cascade;
drop type if exists incident_severity cascade;

-- 2. ENUMS & EXTENSIONS
create extension if not exists "uuid-ossp";

create type user_role as enum ('user', 'volunteer', 'agency');
create type incident_status as enum ('pending', 'verified', 'dispatched', 'resolved', 'closed');
create type incident_severity as enum ('low', 'medium', 'high', 'critical');

-- 3. TABLES

-- PROFILES
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role user_role default 'user',
  avatar_url text,
  phone_number text,
  last_latitude float,
  last_longitude float,
  is_broadcasting boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- INCIDENTS
create table incidents (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references profiles(id),
  title text not null,
  description text,
  latitude float not null,
  longitude float not null,
  severity incident_severity default 'medium',
  status incident_status default 'pending',
  type text,
  image_url text,
  ai_analysis jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- CHAT SYSTEM
create table incident_rooms (
  id uuid default uuid_generate_v4() primary key,
  incident_id uuid references incidents(id) on delete cascade unique,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table incident_messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references incident_rooms(id) on delete cascade,
  sender_id uuid references profiles(id),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RESOURCES & LOGISTICS
create table resources (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null, -- 'ambulance', 'fire_truck', etc.
  total_quantity int default 0,
  available_quantity int default 0,
  agency_id uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table resource_allocations (
  id uuid default uuid_generate_v4() primary key,
  incident_id uuid references incidents(id),
  resource_id uuid references resources(id),
  quantity int default 1,
  allocated_at timestamp with time zone default timezone('utc'::text, now()),
  released_at timestamp with time zone
);

create table tasks (
  id uuid default uuid_generate_v4() primary key,
  incident_id uuid references incidents(id),
  assignee_id uuid references profiles(id),
  title text not null,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- AUDIT
create table audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. SECURITY (RLS) - Permissive for Hackathon Speed

-- PROFILES
alter table profiles enable row level security;
create policy "Public profiles" on profiles for all using (true);
create policy "Users can update their own location" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- INCIDENTS
alter table incidents enable row level security;
create policy "Public Incidents" on incidents for all using (true);

-- MESSAGES
alter table incident_messages enable row level security;
create policy "Public Messages" on incident_messages for all using (true);
alter table incident_rooms enable row level security;
create policy "Public Rooms" on incident_rooms for all using (true);

-- RESOURCES / TASKS
alter table resources enable row level security;
create policy "Public Resources" on resources for all using (true);

alter table resource_allocations enable row level security;
create policy "Public Allocations" on resource_allocations for all using (true);

alter table tasks enable row level security;
create policy "Public Tasks" on tasks for all using (true);

-- 5. STORAGE (Bucket Fix)
insert into storage.buckets (id, name, public) values ('incident-images', 'incident-images', true)
on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'incident-images' );

drop policy if exists "Public Upload" on storage.objects;
create policy "Public Upload" on storage.objects for insert with check ( bucket_id = 'incident-images' );

-- 6. TRIGGERS (Automation)

-- Auto-create Profile on Signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql;

-- Re-attach trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created 
  after insert on auth.users 
  for each row execute procedure public.handle_new_user();

-- Auto-create Chat Room on Incident
create or replace function public.handle_new_incident() 
returns trigger as $$
begin
  insert into incident_rooms (incident_id) values (new.id)
  on conflict (incident_id) do nothing;
  return new;
end;
$$ language plpgsql;

create trigger on_incident_created
  after insert on incidents
  for each row execute procedure public.handle_new_incident();

-- ⚠️ NOTE FOR NEW DATABASE: 
-- Since this is a new DB, 'auth.users' is empty. 
-- You MUST Sign Up a new user in the app to create your first profile.
-- No manual 'insert into profiles' is included to prevent errors.
