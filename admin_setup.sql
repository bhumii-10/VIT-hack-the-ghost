
-- Create Admin User in Supabase
-- Run these commands in your Supabase SQL Editor

-- 1. Insert into auth.users table
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change_token_new,
    recovery_token
) VALUES (
    'ef50a392-82c9-4d18-9c21-630b2d45b8cd',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@sankatsaathi.com',
    crypt('SankatSaathi@2024', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "System Administrator", "role": "admin"}',
    false,
    '',
    '',
    ''
);

-- 2. Insert into profiles table
INSERT INTO profiles (
    id,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    'ef50a392-82c9-4d18-9c21-630b2d45b8cd',
    'System Administrator',
    'admin',
    NOW(),
    NOW()
);

-- 3. Verify the admin user was created
SELECT 
    u.id,
    u.email,
    p.full_name,
    p.role,
    u.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@sankatsaathi.com';
