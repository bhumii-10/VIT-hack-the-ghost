create table if not exists public.push_subscriptions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid unique, -- References public.profiles(id)
    subscription jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure the foreign key points to PROFILES specifically so that PostgREST can join them
do $$ 
begin 
    alter table public.push_subscriptions drop constraint if exists push_subscriptions_user_id_fkey;
    alter table public.push_subscriptions add constraint push_subscriptions_user_id_fkey 
        foreign key (user_id) references public.profiles(id) on delete cascade;
end $$;

-- Ensure UNIQUE constraint if table was created without it previously
do $$ 
begin 
    if not exists (select 1 from pg_constraint where conname = 'push_subscriptions_user_id_key') then
        alter table public.push_subscriptions add constraint push_subscriptions_user_id_key unique (user_id);
    end if;
end $$;

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Policies (Drop first to avoid "already exists" errors)
-- Since the backend uses the anon/authenticated key WITHOUT a user JWT, 
-- we allow all access for now to ensure the system works locally.
drop policy if exists "Users can manage their own subscriptions" on public.push_subscriptions;
create policy "Allow all access to subscriptions"
    on public.push_subscriptions
    for all
    using (true)
    with check (true);

drop policy if exists "Service role can read all subscriptions" on public.push_subscriptions;
-- (Redundant now, but keeping for reference)
create policy "Service role can read all subscriptions"
    on public.push_subscriptions
    for select
    using (true);
