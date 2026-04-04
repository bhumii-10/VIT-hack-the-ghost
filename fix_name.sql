-- ==========================================
-- 🛠️ FIX: SYNC NAME FROM SIGNUP DATA 🛠️
-- ==========================================

-- This script forces your profile name to match the name you used during Sign Up.
-- It copies 'full_name' from the Auth system (auth.users) to the Public Profile.

update public.profiles
set full_name = coalesce(auth.users.raw_user_meta_data->>'full_name', auth.users.email)
from auth.users
where public.profiles.id = auth.users.id;

-- Show the result to confirm
select id, full_name, role from public.profiles;
