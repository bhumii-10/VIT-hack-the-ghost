-- ==============================================
-- 🚨 EMERGENCY FIX: CLEAN RESET OF USER & TRIGGERS
-- ==============================================

-- 1. DISABLE AUTOMATION (The likely cause of the 500 error)
-- We drop the trigger so it doesn't fire when we try to do things.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- 2. CLEANUP EXISTING USER (To remove any corrupted state)
-- Delete from profiles first to avoid foreign key errors
DELETE FROM public.profiles 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'test@gmail.com');

-- Delete from auth.users
DELETE FROM auth.users 
WHERE email = 'test@gmail.com';

-- 3. CREATE USER MANUALLY (Safe Mode)
-- We insert a fresh user with a known password.
INSERT INTO auth.users (
    instance_id,
    id,
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
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@gmail.com',
    crypt('password123', gen_salt('bf')), -- Password: password123
    now(), -- Auto-confirm email
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Test User"}',
    now(),
    now(),
    '',
    ''
);

-- 4. CREATE PROFILE MANUALLY
-- We align this with the user we just created.
INSERT INTO public.profiles (id, full_name, role, phone_number)
SELECT id, 'Test User', 'user', '1234567890'
FROM auth.users 
WHERE email = 'test@gmail.com';

-- 5. VERIFY
SELECT email, id, role FROM auth.users WHERE email = 'test@gmail.com';
