-- Add missing columns to profiles table for location tracking and SOS broadcasting
alter table public.profiles 
add column if not exists last_latitude float,
add column if not exists last_longitude float,
add column if not exists is_broadcasting boolean default false;

-- Ensure RLS allows users to update their own location
drop policy if exists "Users can update their own location" on public.profiles;
create policy "Users can update their own location"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);
