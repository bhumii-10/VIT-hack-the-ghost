-- 1. Sync any missing profiles from auth.users to public.profiles
-- This fixes the "Key is not present in table profiles" error (23503)
insert into public.profiles (id, full_name, role)
select id, raw_user_meta_data->>'full_name', 'user'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;

-- 2. Verify that your current user has a profile
-- Run this and check if you see your email/ID
select * from public.profiles;
