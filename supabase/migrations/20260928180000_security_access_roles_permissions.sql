-- ============================================================================
-- Security & Access: Dynamic Workspace Roles, Permissions & Role Permissions
-- ============================================================================

-- 1. Relax role check on workspace_memberships to allow dynamic custom roles
alter table public.workspace_memberships
  drop constraint if exists workspace_memberships_role_check;

-- 2. Extend user_profiles with first_name and last_name
alter table public.user_profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

-- 3. Workspace Roles Table
create table if not exists public.workspace_roles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  is_system boolean not null default false,
  system_fallback text not null default 'member' check (system_fallback in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

-- Add role_id reference to workspace_memberships
alter table public.workspace_memberships
  add column if not exists role_id uuid references public.workspace_roles(id) on delete set null;

-- 4. Permission Definitions Registry Table
create table if not exists public.permission_definitions (
  id text primary key,
  category text not null,
  name text not null,
  description text,
  sort_order integer not null default 0
);

-- 5. Workspace Role Permissions Table
create table if not exists public.workspace_role_permissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  role_id uuid not null references public.workspace_roles(id) on delete cascade,
  permission_id text not null references public.permission_definitions(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role_id, permission_id)
);

-- Indexes for performance
create index if not exists workspace_roles_workspace_idx on public.workspace_roles(workspace_id);
create index if not exists workspace_role_permissions_role_idx on public.workspace_role_permissions(role_id);
create index if not exists workspace_role_permissions_workspace_idx on public.workspace_role_permissions(workspace_id);
create index if not exists permission_definitions_category_idx on public.permission_definitions(category, sort_order);

-- Triggers for updated_at
create trigger workspace_roles_touch before update on public.workspace_roles for each row execute function public.touch_updated_at();
create trigger workspace_role_permissions_touch before update on public.workspace_role_permissions for each row execute function public.touch_updated_at();

-- 6. Enable RLS
alter table public.workspace_roles enable row level security;
alter table public.permission_definitions enable row level security;
alter table public.workspace_role_permissions enable row level security;

-- Policies for workspace_roles
create policy workspace_roles_select on public.workspace_roles
  for select to authenticated using (public.is_workspace_member(workspace_id));

create policy workspace_roles_insert on public.workspace_roles
  for insert to authenticated with check (public.current_workspace_role(workspace_id) in ('owner', 'admin'));

create policy workspace_roles_update on public.workspace_roles
  for update to authenticated using (public.current_workspace_role(workspace_id) in ('owner', 'admin'))
  with check (public.current_workspace_role(workspace_id) in ('owner', 'admin'));

create policy workspace_roles_delete on public.workspace_roles
  for delete to authenticated using (public.current_workspace_role(workspace_id) in ('owner', 'admin') and not is_system);

-- Policies for permission_definitions (read-only for authenticated users)
create policy permission_definitions_select on public.permission_definitions
  for select to authenticated using (true);

-- Policies for workspace_role_permissions
create policy workspace_role_permissions_select on public.workspace_role_permissions
  for select to authenticated using (public.is_workspace_member(workspace_id));

create policy workspace_role_permissions_insert on public.workspace_role_permissions
  for insert to authenticated with check (public.current_workspace_role(workspace_id) in ('owner', 'admin'));

create policy workspace_role_permissions_update on public.workspace_role_permissions
  for update to authenticated using (public.current_workspace_role(workspace_id) in ('owner', 'admin'))
  with check (public.current_workspace_role(workspace_id) in ('owner', 'admin'));

create policy workspace_role_permissions_delete on public.workspace_role_permissions
  for delete to authenticated using (public.current_workspace_role(workspace_id) in ('owner', 'admin'));

grant select, insert, update, delete on public.workspace_roles to authenticated;
grant select on public.permission_definitions to authenticated;
grant select, insert, update, delete on public.workspace_role_permissions to authenticated;

-- 7. Update current_workspace_role function to support fallback from custom roles
create or replace function public.current_workspace_role(p_workspace_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(r.system_fallback, case when m.role in ('owner', 'admin', 'member', 'viewer') then m.role else 'member' end)
  from public.workspace_memberships m
  left join public.workspace_roles r on (r.id = m.role_id or (r.workspace_id = m.workspace_id and lower(r.name) = lower(m.role)))
  where m.workspace_id = p_workspace_id and m.user_id = (select auth.uid()) and m.status = 'active'
  limit 1;
$$;

-- 8. Seed Permission Definitions Registry (matching Reference Design 3)
insert into public.permission_definitions (id, category, name, description, sort_order) values
  -- DASHBOARD Category
  ('dashboard.count_summary', 'DASHBOARD', 'Count Summary', 'View top-level KPI counts', 10),
  ('dashboard.follow_up_summary', 'DASHBOARD', 'Follow Up Summary', 'View pending follow-up counts and alerts', 20),
  ('dashboard.prospect_status_summary', 'DASHBOARD', 'Prospect Status Summary', 'View conversion and prospect pipeline', 30),
  ('dashboard.design_details_summary', 'DASHBOARD', 'Design Details Summary', 'View summary of design requirements', 40),
  ('dashboard.project_type_summary', 'DASHBOARD', 'Project Type Summary', 'View project distribution by category', 50),
  ('dashboard.milestone_summary', 'DASHBOARD', 'Milestone Summary', 'View upcoming project milestones', 60),
  ('dashboard.design_status_summary', 'DASHBOARD', 'Design Status Summary', 'Track design progress status across rooms', 70),
  ('dashboard.project_status_summary', 'DASHBOARD', 'Project Status Summary', 'Track project execution status', 80),
  ('dashboard.service_summary', 'DASHBOARD', 'Service Summary', 'View service and support metrics', 90),

  -- ENQUIRY Category
  ('enquiry.add_enquiry', 'ENQUIRY', 'Add Enquiry', 'Create new customer enquiry records', 110),
  ('enquiry.edit_enquiry', 'ENQUIRY', 'Edit Enquiry', 'Update and modify enquiry details', 120),
  ('enquiry.bulk_upload', 'ENQUIRY', 'Bulk Upload', 'Import multiple leads or enquiries via spreadsheet', 130),
  ('enquiry.delete_enquiry', 'ENQUIRY', 'Delete Enquiry', 'Archive or delete enquiry entries', 140),
  ('enquiry.show_all_enquiries', 'ENQUIRY', 'Show All Enquiries', 'View enquiries across all team members', 150),
  ('enquiry.enquiry_filter', 'ENQUIRY', 'Enquiry Filter', 'Apply advanced query filters on lead queues', 160),

  -- PROJECTS Category
  ('projects.view_projects', 'PROJECTS', 'View Projects', 'Browse project workspace records', 210),
  ('projects.create_project', 'PROJECTS', 'Create Project', 'Initialize new project specifications', 220),
  ('projects.edit_project', 'PROJECTS', 'Edit Project', 'Modify project parameters and details', 230),
  ('projects.delete_project', 'PROJECTS', 'Delete Project', 'Archive or remove project records', 240),
  ('projects.export_projects', 'PROJECTS', 'Export Projects', 'Export project data to Excel or PDF', 250),

  -- BOQ & COSTING Category
  ('boq.view_boq', 'BOQ & COSTING', 'View BOQ', 'Inspect Bill of Quantities breakdown', 310),
  ('boq.create_boq', 'BOQ & COSTING', 'Create BOQ', 'Generate new BOQ worksheets', 320),
  ('boq.edit_boq', 'BOQ & COSTING', 'Edit BOQ', 'Update rates, dimensions, and line items', 330),
  ('boq.approve_boq', 'BOQ & COSTING', 'Approve BOQ', 'Sign off and freeze finalized BOQs', 340),
  ('costing.manage_costing', 'BOQ & COSTING', 'Manage Costing', 'Adjust margins, vendor quotes, and cost bases', 350),

  -- PROPOSALS & INVOICES Category
  ('proposals.create_proposal', 'PROPOSALS & INVOICES', 'Create Proposal', 'Draft client proposals and quotes', 410),
  ('proposals.archive_proposal', 'PROPOSALS & INVOICES', 'Archive Proposal', 'Archive completed or expired proposals', 420),
  ('invoices.create_invoice', 'PROPOSALS & INVOICES', 'Create Invoice', 'Issue tax invoices and billing notices', 430),
  ('invoices.record_payment', 'PROPOSALS & INVOICES', 'Record Payment', 'Log received payments and settlements', 440)
on conflict (id) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

-- 9. Function to initialize default roles and permissions for any workspace
create or replace function public.initialize_workspace_roles(p_workspace_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_role_sales_eng uuid;
  v_role_designer uuid;
  v_role_coord uuid;
  v_role_tech uuid;
  v_role_pm uuid;
  v_role_owner uuid;
  v_role_admin uuid;
begin
  -- 1. Insert standard roles if not already present
  insert into public.workspace_roles (workspace_id, name, description, is_system, system_fallback)
  values (p_workspace_id, 'Sales Engineer', 'Handles sales, quotes, and customer inquiries', false, 'member')
  on conflict (workspace_id, name) do update set updated_at = now()
  returning id into v_role_sales_eng;

  insert into public.workspace_roles (workspace_id, name, description, is_system, system_fallback)
  values (p_workspace_id, 'Designer', 'Drafts design concepts and specifications', false, 'member')
  on conflict (workspace_id, name) do update set updated_at = now()
  returning id into v_role_designer;

  insert into public.workspace_roles (workspace_id, name, description, is_system, system_fallback)
  values (p_workspace_id, 'Project Coordinator', 'Coordinates project milestones and tasks', false, 'member')
  on conflict (workspace_id, name) do update set updated_at = now()
  returning id into v_role_coord;

  insert into public.workspace_roles (workspace_id, name, description, is_system, system_fallback)
  values (p_workspace_id, 'Technician', 'Conducts site visits and technical inspections', false, 'member')
  on conflict (workspace_id, name) do update set updated_at = now()
  returning id into v_role_tech;

  insert into public.workspace_roles (workspace_id, name, description, is_system, system_fallback)
  values (p_workspace_id, 'Project Manager', 'Oversees project delivery and team activities', false, 'member')
  on conflict (workspace_id, name) do update set updated_at = now()
  returning id into v_role_pm;

  insert into public.workspace_roles (workspace_id, name, description, is_system, system_fallback)
  values (p_workspace_id, 'Owner', 'Full access and ownership of the workspace', true, 'owner')
  on conflict (workspace_id, name) do update set updated_at = now()
  returning id into v_role_owner;

  insert into public.workspace_roles (workspace_id, name, description, is_system, system_fallback)
  values (p_workspace_id, 'Admin', 'Administrative access across all modules', true, 'admin')
  on conflict (workspace_id, name) do update set updated_at = now()
  returning id into v_role_admin;

  -- 2. Populate reference matrix permissions (matching Design 3)
  -- Sales Engineer
  insert into public.workspace_role_permissions (workspace_id, role_id, permission_id, enabled) values
    (p_workspace_id, v_role_sales_eng, 'dashboard.count_summary', true),
    (p_workspace_id, v_role_sales_eng, 'dashboard.prospect_status_summary', true),
    (p_workspace_id, v_role_sales_eng, 'dashboard.design_details_summary', true),
    (p_workspace_id, v_role_sales_eng, 'dashboard.project_type_summary', true),
    (p_workspace_id, v_role_sales_eng, 'dashboard.design_status_summary', true),
    (p_workspace_id, v_role_sales_eng, 'dashboard.project_status_summary', true),
    (p_workspace_id, v_role_sales_eng, 'enquiry.add_enquiry', true),
    (p_workspace_id, v_role_sales_eng, 'enquiry.delete_enquiry', true),
    (p_workspace_id, v_role_sales_eng, 'enquiry.show_all_enquiries', true)
  on conflict (role_id, permission_id) do update set enabled = excluded.enabled;

  -- Designer
  insert into public.workspace_role_permissions (workspace_id, role_id, permission_id, enabled) values
    (p_workspace_id, v_role_designer, 'dashboard.follow_up_summary', true),
    (p_workspace_id, v_role_designer, 'dashboard.milestone_summary', true),
    (p_workspace_id, v_role_designer, 'dashboard.project_status_summary', true),
    (p_workspace_id, v_role_designer, 'dashboard.service_summary', true),
    (p_workspace_id, v_role_designer, 'enquiry.edit_enquiry', true),
    (p_workspace_id, v_role_designer, 'enquiry.bulk_upload', true),
    (p_workspace_id, v_role_designer, 'enquiry.delete_enquiry', true),
    (p_workspace_id, v_role_designer, 'enquiry.enquiry_filter', true)
  on conflict (role_id, permission_id) do update set enabled = excluded.enabled;

  -- Project Coordinator
  insert into public.workspace_role_permissions (workspace_id, role_id, permission_id, enabled) values
    (p_workspace_id, v_role_coord, 'dashboard.follow_up_summary', true),
    (p_workspace_id, v_role_coord, 'dashboard.prospect_status_summary', true),
    (p_workspace_id, v_role_coord, 'dashboard.design_details_summary', true),
    (p_workspace_id, v_role_coord, 'dashboard.project_status_summary', true),
    (p_workspace_id, v_role_coord, 'enquiry.bulk_upload', true)
  on conflict (role_id, permission_id) do update set enabled = excluded.enabled;

  -- Technician
  insert into public.workspace_role_permissions (workspace_id, role_id, permission_id, enabled) values
    (p_workspace_id, v_role_tech, 'dashboard.follow_up_summary', true),
    (p_workspace_id, v_role_tech, 'dashboard.design_details_summary', true),
    (p_workspace_id, v_role_tech, 'dashboard.milestone_summary', true),
    (p_workspace_id, v_role_tech, 'dashboard.design_status_summary', true),
    (p_workspace_id, v_role_tech, 'enquiry.edit_enquiry', true),
    (p_workspace_id, v_role_tech, 'enquiry.show_all_enquiries', true)
  on conflict (role_id, permission_id) do update set enabled = excluded.enabled;

  -- Owner & Admin get all permissions enabled
  insert into public.workspace_role_permissions (workspace_id, role_id, permission_id, enabled)
  select p_workspace_id, v_role_owner, id, true from public.permission_definitions
  on conflict (role_id, permission_id) do update set enabled = true;

  insert into public.workspace_role_permissions (workspace_id, role_id, permission_id, enabled)
  select p_workspace_id, v_role_admin, id, true from public.permission_definitions
  on conflict (role_id, permission_id) do update set enabled = true;
end;
$$;

-- Initialize default roles for all existing workspaces
do $$
declare
  w record;
begin
  for w in select id from public.workspaces loop
    perform public.initialize_workspace_roles(w.id);
  end loop;
end $$;
