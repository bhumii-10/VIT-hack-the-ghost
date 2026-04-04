-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  -- 1. Check if user already exists
  existing_user_id uuid;
  new_user_id uuid := gen_random_uuid();
  user_email text := 'test@gmail.com';
  user_password text := 'password123';
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = user_email;

  IF existing_user_id IS NOT NULL THEN
    -- User exists, update password
    UPDATE auth.users
    SET encrypted_password = crypt(user_password, gen_salt('bf'))
    WHERE id = existing_user_id;
    
    RAISE NOTICE 'User % already exists. Password updated.', user_email;
  ELSE
    -- User does not exist, create new one
    INSERT INTO auth.users (
      id,
      instance_id,
      role,
      aud,
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
      crypt(user_password, gen_salt('bf')),
      now(), -- Auto-confirms email
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Test User"}',
      now(),
      now(),
      '',
      ''
    );
    
    -- NOTE: The 'on_auth_user_created' trigger will likely create the profile automatically.
    -- We can verify/update the profile just in case.
    
    INSERT INTO public.profiles (id, full_name, role, phone_number, created_at, updated_at)
    VALUES (new_user_id, 'Test User', 'user', '1234567890', now(), now())
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        phone_number = EXCLUDED.phone_number;

    RAISE NOTICE 'New user created successfully! Email: %, Password: %', user_email, user_password;
  END IF;
END $$;
