-- 1. Drop the problematic trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the user manually (if not exists)
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  check_user_id uuid;
BEGIN
  -- Check if user exists
  SELECT id INTO check_user_id FROM auth.users WHERE email = 'test@gmail.com';
  
  IF check_user_id IS NULL THEN
    -- Create user
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
      'test@gmail.com',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Test User"}',
      now(),
      now(),
      '',
      ''
    );
    
    -- Manually create profile since trigger is gone
    INSERT INTO public.profiles (id, full_name, role, phone_number)
    VALUES (new_user_id, 'Test User', 'user', '1234567890');
    
  ELSE
    -- If user exists, just ensure profile exists
    INSERT INTO public.profiles (id, full_name, role, phone_number)
    VALUES (check_user_id, 'Test User', 'user', '1234567890')
    ON CONFLICT (id) DO NOTHING;
    
    -- Update password just in case
    UPDATE auth.users 
    SET encrypted_password = crypt('password123', gen_salt('bf'))
    WHERE id = check_user_id;
  END IF;
END $$;

-- 3. Re-enable the trigger (optional, but good for future signups)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
