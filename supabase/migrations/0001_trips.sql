-- Saved trips for signed-in users. Each trip is stored whole as JSON;
-- the planner merges by updated_at, newest wins.
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

create table if not exists public.trips (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists trips_user_id_idx on public.trips (user_id);

alter table public.trips enable row level security;

-- Everyone can only see and change their own trips.
create policy "Users read their own trips" on public.trips
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users add their own trips" on public.trips
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Users update their own trips" on public.trips
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users delete their own trips" on public.trips
  for delete to authenticated using ((select auth.uid()) = user_id);
