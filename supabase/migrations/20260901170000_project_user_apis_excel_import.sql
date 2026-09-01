-- User-facing Projects module and backend spreadsheet import support.
-- This migration intentionally bootstraps the two legacy Project/BOQ tables
-- when 20260901011500 was not applied. The Phase 1 workspace/auth migration is
-- still a prerequisite because tenancy must never be invented here.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  client_name text not null check (char_length(client_name) between 1 and 160),
  project_type text not null check (char_length(project_type) between 1 and 80),
  status text not null default 'planning' check (status in ('active', 'planning', 'in_progress', 'on_hold', 'completed')),
  location text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.boq_imports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  file_name text not null check (char_length(file_name) between 1 and 255),
  file_type text not null check (file_type in ('csv', 'xlsx', 'xls')),
  row_count integer not null check (row_count >= 0),
  columns jsonb not null default '[]'::jsonb,
  rows jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.boq_imports add column if not exists rows jsonb not null default '[]'::jsonb;

create sequence if not exists public.project_code_seq;

alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects drop constraint if exists projects_area_check;
alter table public.projects drop constraint if exists projects_value_check;
alter table public.projects drop constraint if exists projects_budget_check;
alter table public.projects drop constraint if exists projects_progress_check;
alter table public.projects drop constraint if exists projects_dates_check;
alter table public.projects
  add column if not exists project_code text not null default ('PRJ-' || lpad(nextval('public.project_code_seq')::text, 6, '0')),
  add column if not exists client_contact text,
  add column if not exists client_email text,
  add column if not exists description text,
  add column if not exists area_sqft numeric(14,2),
  add column if not exists project_value numeric(18,2),
  add column if not exists approved_budget numeric(18,2),
  add column if not exists start_date date,
  add column if not exists target_completion_date date,
  add column if not exists assigned_designer_id uuid,
  add column if not exists tags text[] not null default '{}',
  add column if not exists progress smallint not null default 0,
  add column if not exists archived_at timestamptz,
  add constraint projects_status_check check (status in ('active', 'planning', 'in_progress', 'on_hold', 'completed')),
  add constraint projects_area_check check (area_sqft is null or area_sqft > 0),
  add constraint projects_value_check check (project_value is null or project_value >= 0),
  add constraint projects_budget_check check (approved_budget is null or approved_budget >= 0),
  add constraint projects_progress_check check (progress between 0 and 100),
  add constraint projects_dates_check check (start_date is null or target_completion_date is null or target_completion_date >= start_date);

create unique index if not exists projects_workspace_code_uidx on public.projects(workspace_id, project_code);
create index if not exists projects_workspace_status_idx on public.projects(workspace_id, status) where archived_at is null;
create index if not exists projects_workspace_name_idx on public.projects(workspace_id, lower(name)) where archived_at is null;
create index if not exists boq_imports_workspace_created_idx on public.boq_imports(workspace_id, created_at desc);

create table if not exists public.project_rooms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  room_type text not null check (char_length(room_type) between 1 and 80),
  length numeric(12,2) check (length is null or length > 0),
  width numeric(12,2) check (width is null or width > 0),
  height numeric(12,2) check (height is null or height > 0),
  unit text not null default 'ft' check (unit in ('ft', 'm')),
  notes text,
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, name)
);

create table if not exists public.project_imports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 255),
  file_type text not null check (file_type in ('csv', 'xlsx', 'xls')),
  total_rows integer not null check (total_rows >= 0),
  imported_rows integer not null default 0 check (imported_rows >= 0),
  skipped_rows integer not null default 0 check (skipped_rows >= 0),
  status text not null default 'completed' check (status in ('completed', 'failed')),
  errors jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists project_rooms_project_sort_idx on public.project_rooms(project_id, sort_order, created_at);
create index if not exists project_imports_workspace_created_idx on public.project_imports(workspace_id, created_at desc);
drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
drop trigger if exists project_rooms_touch on public.project_rooms;
create trigger project_rooms_touch before update on public.project_rooms for each row execute function public.touch_updated_at();

alter table public.projects enable row level security;
alter table public.boq_imports enable row level security;
alter table public.project_rooms enable row level security;
alter table public.project_imports enable row level security;

drop policy if exists projects_select_member on public.projects;
create policy projects_select_member on public.projects for select to authenticated using (public.is_workspace_member(workspace_id));
drop policy if exists projects_insert_member on public.projects;
drop policy if exists projects_insert_writer on public.projects;
create policy projects_insert_writer on public.projects for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and created_by = (select auth.uid()));
drop policy if exists projects_update_writer on public.projects;
create policy projects_update_writer on public.projects for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin','member'))
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member'));
drop policy if exists projects_delete_admin on public.projects;
create policy projects_delete_admin on public.projects for delete to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin'));

drop policy if exists project_rooms_select_member on public.project_rooms;
create policy project_rooms_select_member on public.project_rooms for select to authenticated using (public.is_workspace_member(workspace_id));
drop policy if exists project_rooms_insert_writer on public.project_rooms;
create policy project_rooms_insert_writer on public.project_rooms for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and created_by = (select auth.uid()));
drop policy if exists project_rooms_update_writer on public.project_rooms;
create policy project_rooms_update_writer on public.project_rooms for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin','member'))
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member'));
drop policy if exists project_rooms_delete_writer on public.project_rooms;
create policy project_rooms_delete_writer on public.project_rooms for delete to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin','member'));

drop policy if exists project_imports_select_member on public.project_imports;
create policy project_imports_select_member on public.project_imports for select to authenticated using (public.is_workspace_member(workspace_id));
drop policy if exists project_imports_insert_writer on public.project_imports;
create policy project_imports_insert_writer on public.project_imports for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and created_by = (select auth.uid()));

drop policy if exists boq_imports_insert_member on public.boq_imports;
drop policy if exists boq_imports_insert_writer on public.boq_imports;
create policy boq_imports_insert_writer on public.boq_imports for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and created_by = (select auth.uid()));
drop policy if exists boq_imports_select_member on public.boq_imports;
create policy boq_imports_select_member on public.boq_imports for select to authenticated using (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.projects, public.project_rooms to authenticated;
grant select, insert on public.project_imports to authenticated;
grant usage, select on sequence public.project_code_seq to authenticated;
