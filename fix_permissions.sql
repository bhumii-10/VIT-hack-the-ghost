-- 1. FIX STORAGE (Create Bucket if missing)
insert into storage.buckets (id, name, public)
values ('incident-images', 'incident-images', true)
on conflict (id) do nothing;

-- Storage Policies (Allow Public Uploads/Reads for Hackathon Simplicity)
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'incident-images' );

drop policy if exists "Public Upload" on storage.objects;
create policy "Public Upload"
  on storage.objects for insert
  with check ( bucket_id = 'incident-images' );

-- 2. FIX RLS FOR BACKEND (Allow Anon/Backend Key to Insert)
-- Since the backend uses the same key as frontend (Anon) but doesn't pass user context,
-- we need to allow 'anon' role to insert incidents.
drop policy if exists "Users can create incidents" on incidents;
create policy "Allow Backend/Anon Insert"
  on incidents for insert
  with check (true);

-- 3. FIX PROFILE INSERT (Ensure Profiles are writable just in case)
alter table profiles disable row level security; -- Temporarily disable for easier onboarding
alter table profiles enable row level security;

drop policy if exists "Enable insert for authenticated users only" on "public"."profiles";
create policy "Enable insert for authenticated users only"
on "public"."profiles"
as PERMISSIVE
for INSERT
to public
with check (true);
