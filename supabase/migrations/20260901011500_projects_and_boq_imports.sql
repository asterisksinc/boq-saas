create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  client_name text not null check (char_length(client_name) between 1 and 160),
  project_type text not null check (char_length(project_type) between 1 and 80),
  status text not null check (status in ('active', 'on_hold', 'planning')),
  location text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.boq_imports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  file_name text not null check (char_length(file_name) between 1 and 255),
  file_type text not null check (file_type in ('csv', 'xlsx', 'xls')),
  row_count integer not null check (row_count >= 0),
  columns jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index projects_workspace_created_idx on public.projects(workspace_id, created_at desc);
create index boq_imports_workspace_created_idx on public.boq_imports(workspace_id, created_at desc);
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();

alter table public.projects enable row level security;
alter table public.boq_imports enable row level security;
create policy projects_select_member on public.projects for select to authenticated using (public.is_workspace_member(workspace_id));
create policy projects_insert_member on public.projects for insert to authenticated with check (public.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
create policy boq_imports_select_member on public.boq_imports for select to authenticated using (public.is_workspace_member(workspace_id));
create policy boq_imports_insert_member on public.boq_imports for insert to authenticated with check (public.is_workspace_member(workspace_id) and created_by = (select auth.uid()));
grant select, insert on public.projects, public.boq_imports to authenticated;

create or replace function public.get_dashboard_overview()
returns jsonb language sql stable security definer set search_path = '' as $$
  with selected as (
    select m.workspace_id, m.role from public.workspace_memberships m
    join public.workspaces w on w.id = m.workspace_id
    where m.user_id = (select auth.uid()) and m.status = 'active' and w.status = 'active'
    order by m.joined_at limit 1
  ), project_data as (
    select p.* from public.projects p join selected s on s.workspace_id = p.workspace_id
  ), import_data as (
    select b.* from public.boq_imports b join selected s on s.workspace_id = b.workspace_id
  ), notices as (
    select coalesce(count(*) filter (where n.read_at is null), 0) as unread_count,
      coalesce(jsonb_agg(jsonb_build_object('id', n.id, 'type', n.type, 'title', n.title, 'priority', n.priority, 'targetType', n.target_type, 'targetId', n.target_id, 'readAt', n.read_at, 'createdAt', n.created_at) order by n.created_at desc) filter (where n.id is not null), '[]'::jsonb) as items
    from public.notifications n join selected s on s.workspace_id = n.workspace_id
    where n.recipient_user_id = (select auth.uid())
  )
  select jsonb_build_object(
    'scope', jsonb_build_object('workspaceId', w.id, 'currency', w.currency, 'timezone', w.timezone, 'generatedAt', now()),
    'kpis', jsonb_build_object('totalProjects', (select count(*) from project_data), 'activeProjects', (select count(*) from project_data where status = 'active'), 'draftBoqs', (select count(*) from import_data), 'pendingApprovals', 0, 'totalEstimatedValue', case when s.role in ('owner','admin') then to_jsonb(0::numeric) else 'null'::jsonb end, 'actualCost', case when s.role in ('owner','admin') then to_jsonb(0::numeric) else 'null'::jsonb end, 'grossMargin', case when s.role in ('owner','admin') then to_jsonb(0::numeric) else 'null'::jsonb end),
    'organization', jsonb_build_object('id', w.id, 'name', w.name, 'status', w.status, 'country', w.country),
    'costOverview', case when s.role in ('owner','admin') then jsonb_build_object('currency', w.currency, 'series', '[]'::jsonb) else 'null'::jsonb end,
    'boqActivity', '[]'::jsonb,
    'recentProjects', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'subtitle', client_name, 'status', status, 'createdAt', created_at) order by created_at desc) from (select * from project_data order by created_at desc limit 5) r), '[]'::jsonb),
    'recentBoqs', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', file_name, 'subtitle', 'Imported BOQ', 'status', 'active', 'createdAt', created_at) order by created_at desc) from (select * from import_data order by created_at desc limit 5) r), '[]'::jsonb),
    'pendingActions', '[]'::jsonb, 'upcomingDeliverables', '[]'::jsonb,
    'notifications', jsonb_build_object('unreadCount', n.unread_count, 'items', n.items),
    'permissions', public.role_permissions(s.role),
    'unavailableSections', jsonb_build_array(jsonb_build_object('section', 'costs', 'reason', 'DOMAIN_DEFERRED'), jsonb_build_object('section', 'approvals', 'reason', 'DOMAIN_DEFERRED'))
  ) from selected s join public.workspaces w on w.id = s.workspace_id cross join notices n;
$$;
