-- =============================================
-- 🛠️ FIX: RESTORE MISSING PROFILES 🛠️
-- =============================================

-- This script finds all users who are logged in (exist in auth.users)
-- but are missing their 'profile' in the public database.
-- It automatically creates a profile for them.

insert into public.profiles (id, full_name, role)
select 
    id, 
    -- Use name from metadata, or fallback to "User", or just empty
    coalesce(raw_user_meta_data->>'full_name', 'System User'),
    'user'
from auth.users
where id not in (select id from public.profiles);

-- Confirm it worked
select count(*) as "Profiles Restored" from public.profiles;
