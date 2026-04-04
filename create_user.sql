-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  user_email text := 'test@gmail.com';
  user_password text := 'password123';
BEGIN
  -- 1. Insert into auth.users (Supabase Auth System)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')), -- Hashes password safely
    now(), -- Auto-confirms email
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Test User"}',
    now(),
    now(),
    '',
    ''
  );

  -- 2. Insert into public.profiles (Your App's Profile Table)
  INSERT INTO public.profiles (
    id,
    full_name,
    role, -- Uses default 'user'::user_role
    phone_number,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'Test User',
    'user', -- Explicitly setting role
    '1234567890',
    now(),
    now()
  );
  
  RAISE NOTICE 'User created successfully! Email: %, Password: %', user_email, user_password;
END $$;
