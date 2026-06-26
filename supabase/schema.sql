-- Sociapi Society ERP Supabase schema
-- Run this in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.erp_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.erp_state enable row level security;

drop policy if exists "Authenticated users can read ERP state" on public.erp_state;
create policy "Authenticated users can read ERP state"
  on public.erp_state for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can write ERP state" on public.erp_state;
create policy "Authenticated users can write ERP state"
  on public.erp_state for all
  to authenticated
  using (true)
  with check (true);

-- Optional normalized tables for reporting and future migration.
create table if not exists public.members (
  id text primary key,
  auth_user_id uuid references auth.users(id) on delete set null,
  username text unique not null,
  member_id text unique not null,
  special_number text unique not null,
  name text not null,
  email text unique not null,
  phone text,
  role text not null,
  department text not null,
  position text not null,
  status text not null default 'Active',
  attendance numeric not null default 0,
  points integer not null default 0,
  performance_score numeric not null default 0,
  created_by text,
  created_at timestamptz not null default now(),
  last_login timestamptz
);

create table if not exists public.finance_entries (
  id text primary key,
  type text not null,
  amount numeric not null,
  description text not null,
  category text not null,
  event_id text,
  date timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id text primary key,
  actor_id text,
  actor_name text not null,
  action text not null,
  target text,
  category text not null,
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;
alter table public.finance_entries enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Authenticated read members" on public.members;
create policy "Authenticated read members"
  on public.members
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated write members" on public.members;
create policy "Authenticated write members"
  on public.members
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated read finance" on public.finance_entries;
create policy "Authenticated read finance"
  on public.finance_entries
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated write finance" on public.finance_entries;
create policy "Authenticated write finance"
  on public.finance_entries
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated read audit" on public.audit_logs;
create policy "Authenticated read audit"
  on public.audit_logs
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated write audit" on public.audit_logs;
create policy "Authenticated write audit"
  on public.audit_logs
  for all
  to authenticated
  using (true)
  with check (true);

insert into storage.buckets (id, name, public)
values ('sociapi-uploads', 'sociapi-uploads', true)
on conflict (id) do nothing;