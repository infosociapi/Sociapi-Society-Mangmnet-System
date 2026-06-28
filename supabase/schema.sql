-- Sociapi Society ERP - Production Supabase PostgreSQL schema
-- Run this entire file in the Supabase SQL Editor.
-- IMPORTANT: This resets old incompatible text-ID ERP tables before recreating
-- the production UUID schema. Back up data first if this is a live database.

create extension if not exists "pgcrypto";

-- Drop old/non-production schemas that used text primary keys.
-- CASCADE removes old incompatible foreign keys and RLS policies cleanly.
drop table if exists public.task_submissions cascade;
drop table if exists public.task_assignees cascade;
drop table if exists public.tasks cascade;
drop table if exists public.attendance cascade;
drop table if exists public.event_files cascade;
drop table if exists public.finance_entries cascade;
drop table if exists public.outreach cascade;
drop table if exists public.hr_applications cascade;
drop table if exists public.notifications cascade;
drop table if exists public.chat cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.events cascade;
drop table if exists public.members cascade;
drop table if exists public.departments cascade;
drop table if exists public.erp_state cascade;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  lead_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  username text not null unique,
  member_id text not null unique,
  special_number text not null unique,
  name text not null,
  email text not null unique,
  phone text,
  profile_photo_url text,
  role text not null default 'General Member',
  department_id uuid references public.departments(id) on delete set null,
  position text not null default 'Member',
  join_date date not null default current_date,
  attendance numeric not null default 0,
  points integer not null default 0,
  performance_score numeric not null default 0,
  status text not null default 'Active',
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login timestamptz,
  constraint members_status_check check (status in ('Active', 'Inactive', 'On Leave', 'Suspended'))
);

alter table public.departments drop constraint if exists departments_lead_id_fkey;
alter table public.departments add constraint departments_lead_id_fkey foreign key (lead_id) references public.members(id) on delete set null;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  event_date timestamptz not null,
  venue text not null default '',
  capacity integer not null default 0,
  registered integer not null default 0,
  attended integer not null default 0,
  status text not null default 'Upcoming',
  budget numeric not null default 0,
  expense numeric not null default 0,
  income numeric not null default 0,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_status_check check (status in ('Upcoming', 'Ongoing', 'Completed', 'Archived'))
);

create table if not exists public.event_files (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null default '',
  file_kind text not null default 'photo',
  uploaded_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint event_files_kind_check check (file_kind in ('photo', 'document'))
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  method text not null default 'QR',
  status text not null default 'Present',
  scanned_by uuid references public.members(id) on delete set null,
  attendance_date date not null default current_date,
  created_at timestamptz not null default now(),
  constraint attendance_method_check check (method in ('Manual', 'QR', 'Event')),
  constraint attendance_status_check check (status in ('Present', 'Absent', 'Late', 'Excused')),
  constraint attendance_unique_scan unique (member_id, event_id, attendance_date)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  deadline timestamptz not null,
  priority text not null default 'Medium',
  status text not null default 'Assigned',
  created_by uuid references public.members(id) on delete set null,
  remarks text,
  review_notes text,
  approved_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_priority_check check (priority in ('Low', 'Medium', 'High', 'Critical')),
  constraint tasks_status_check check (status in ('Assigned', 'In Progress', 'Submitted', 'Under Review', 'Approved', 'Completed', 'Overdue'))
);

create table if not exists public.task_assignees (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, member_id)
);

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  file_name text,
  file_url text,
  file_type text,
  comments text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.members(id) on delete set null,
  review_comments text
);

create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  amount numeric not null,
  description text not null,
  category text not null,
  event_id uuid references public.events(id) on delete set null,
  entry_date timestamptz not null default now(),
  reference text,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_type_check check (type in ('Donation', 'Membership Fee', 'Sponsorship', 'Expense', 'Other Income'))
);

-- If the table already exists, add the new column safely.
alter table public.finance_entries add column if not exists reference text;

create table if not exists public.outreach (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  contact_name text not null default '',
  type text not null,
  email text,
  phone text,
  stage text not null default 'Lead',
  notes text not null default '',
  last_contact timestamptz,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outreach_type_check check (type in ('Company', 'Sponsor', 'NGO', 'University')),
  constraint outreach_stage_check check (stage in ('Lead', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Partnership'))
);

create table if not exists public.hr_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  position text not null,
  stage text not null default 'Applied',
  applied_at timestamptz not null default now(),
  interview_at timestamptz,
  notes text not null default '',
  score numeric,
  decision text,
  created_by uuid references public.members(id) on delete set null,
  constraint hr_stage_check check (stage in ('Applied', 'Screening', 'Interview', 'Evaluation', 'Onboarding', 'Rejected', 'Hired'))
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  title text not null,
  body text not null,
  channel text not null default 'In-App',
  type text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_channel_check check (channel in ('WhatsApp', 'Email', 'In-App')),
  constraint notifications_type_check check (type in ('info', 'warning', 'success', 'alert'))
);

create table if not exists public.chat (
  id uuid primary key default gen_random_uuid(),
  from_member_id uuid not null references public.members(id) on delete cascade,
  to_member_id uuid references public.members(id) on delete cascade,
  team text,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.members(id) on delete set null,
  actor_name text not null,
  action text not null,
  target uuid,
  category text not null,
  created_at timestamptz not null default now()
);

alter table public.departments enable row level security;
alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.event_files enable row level security;
alter table public.attendance enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_submissions enable row level security;
alter table public.finance_entries enable row level security;
alter table public.outreach enable row level security;
alter table public.hr_applications enable row level security;
alter table public.notifications enable row level security;
alter table public.chat enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Authenticated read departments" on public.departments;
create policy "Authenticated read departments" on public.departments for select to authenticated using (true);
drop policy if exists "Authenticated write departments" on public.departments;
create policy "Authenticated write departments" on public.departments for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated read members" on public.members;
create policy "Authenticated read members" on public.members for select to authenticated using (true);
drop policy if exists "Authenticated write members" on public.members;
create policy "Authenticated write members" on public.members for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated read events" on public.events;
create policy "Authenticated read events" on public.events for select to authenticated using (true);
drop policy if exists "Authenticated write events" on public.events;
create policy "Authenticated write events" on public.events for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated read event files" on public.event_files;
create policy "Authenticated read event files" on public.event_files for select to authenticated using (true);
drop policy if exists "Authenticated write event files" on public.event_files;
create policy "Authenticated write event files" on public.event_files for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated read attendance" on public.attendance;
create policy "Authenticated read attendance" on public.attendance for select to authenticated using (true);
drop policy if exists "Authenticated write attendance" on public.attendance;
create policy "Authenticated write attendance" on public.attendance for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated read tasks" on public.tasks;
create policy "Authenticated read tasks" on public.tasks for select to authenticated using (true);
drop policy if exists "Authenticated write tasks" on public.tasks;
create policy "Authenticated write tasks" on public.tasks for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated read task assignees" on public.task_assignees;
create policy "Authenticated read task assignees" on public.task_assignees for select to authenticated using (true);
drop policy if exists "Authenticated write task assignees" on public.task_assignees;
create policy "Authenticated write task assignees" on public.task_assignees for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated read task submissions" on public.task_submissions;
create policy "Authenticated read task submissions" on public.task_submissions for select to authenticated using (true);
drop policy if exists "Authenticated write task submissions" on public.task_submissions;
create policy "Authenticated write task submissions" on public.task_submissions for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated read finance" on public.finance_entries;
create policy "Authenticated read finance" on public.finance_entries for select to authenticated using (true);
drop policy if exists "Authenticated write finance" on public.finance_entries;
create policy "Authenticated write finance" on public.finance_entries for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated read outreach" on public.outreach;
create policy "Authenticated read outreach" on public.outreach for select to authenticated using (true);
drop policy if exists "Authenticated write outreach" on public.outreach;
create policy "Authenticated write outreach" on public.outreach for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated read hr applications" on public.hr_applications;
create policy "Authenticated read hr applications" on public.hr_applications for select to authenticated using (true);
drop policy if exists "Authenticated write hr applications" on public.hr_applications;
create policy "Authenticated write hr applications" on public.hr_applications for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated read notifications" on public.notifications;
create policy "Authenticated read notifications" on public.notifications for select to authenticated using (true);
drop policy if exists "Authenticated write notifications" on public.notifications;
create policy "Authenticated write notifications" on public.notifications for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated read chat" on public.chat;
create policy "Authenticated read chat" on public.chat for select to authenticated using (true);
drop policy if exists "Authenticated write chat" on public.chat;
create policy "Authenticated write chat" on public.chat for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated read audit" on public.audit_logs;
create policy "Authenticated read audit" on public.audit_logs for select to authenticated using (true);
drop policy if exists "Authenticated write audit" on public.audit_logs;
create policy "Authenticated write audit" on public.audit_logs for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('sociapi-uploads', 'sociapi-uploads', true)
on conflict (id) do nothing;