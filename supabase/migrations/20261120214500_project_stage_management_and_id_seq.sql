-- Migration: Project Stage Management Integration and Company-Specific Project ID Sequence
-- Supports tenant-aware AST-0000001 IDs, 8 default stages, and projects.current_stage_id FK.

-- 1. Add current_stage_id to public.projects
alter table if exists public.projects
  add column if not exists current_stage_id uuid references public.activity_stages(id) on delete set null;

create index if not exists projects_workspace_current_stage_idx
  on public.projects(workspace_id, current_stage_id)
  where archived_at is null;

-- 2. Create workspace_project_counters for atomic, tenant-independent sequence generation
create table if not exists public.workspace_project_counters (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  last_seq integer not null default 0 check (last_seq >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspace_project_counters enable row level security;
create policy workspace_project_counters_select on public.workspace_project_counters
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy workspace_project_counters_write on public.workspace_project_counters
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
grant select, insert, update on public.workspace_project_counters to authenticated;

-- 3. Function to generate next tenant-aware project code (e.g. AST-0000001)
create or replace function public.generate_tenant_project_code(p_workspace_id uuid)
returns text language plpgsql security definer set search_path = 'public' as $$
declare
  v_name text;
  v_clean text;
  v_prefix text;
  v_seq integer;
  v_code text;
begin
  -- Retrieve company/workspace name
  select name into v_name from public.workspaces where id = p_workspace_id;
  v_clean := regexp_replace(upper(coalesce(v_name, '')), '[^A-Z]', '', 'g');

  if length(v_clean) >= 3 then
    v_prefix := substring(v_clean from 1 for 3);
  elsif length(v_clean) > 0 then
    v_prefix := rpad(v_clean, 3, 'X');
  else
    v_prefix := 'PRJ';
  end if;

  -- Atomic increment of sequence
  insert into public.workspace_project_counters (workspace_id, last_seq, updated_at)
  values (p_workspace_id, 1, now())
  on conflict (workspace_id)
  do update set last_seq = workspace_project_counters.last_seq + 1, updated_at = now()
  returning last_seq into v_seq;

  v_code := v_prefix || '-' || lpad(v_seq::text, 7, '0');

  -- Ensure uniqueness against any existing manual / legacy project codes
  while exists (select 1 from public.projects where workspace_id = p_workspace_id and project_code = v_code) loop
    v_seq := v_seq + 1;
    update public.workspace_project_counters set last_seq = v_seq, updated_at = now() where workspace_id = p_workspace_id;
    v_code := v_prefix || '-' || lpad(v_seq::text, 7, '0');
  end loop;

  return v_code;
end;
$$;

-- 4. Function to ensure default stages exist for a workspace
create or replace function public.ensure_default_activity_stages(p_workspace_id uuid, p_user_id uuid default null)
returns void language plpgsql security definer set search_path = 'public' as $$
declare
  v_creator_id uuid;
begin
  if p_user_id is not null then
    v_creator_id := p_user_id;
  else
    select user_id into v_creator_id from public.workspace_memberships where workspace_id = p_workspace_id and status = 'active' limit 1;
  end if;

  if v_creator_id is null then
    return;
  end if;

  -- Only initialize if no stages currently exist for this workspace
  if not exists (select 1 from public.activity_stages where workspace_id = p_workspace_id) then
    insert into public.activity_stages (workspace_id, name, color, sort_order, terminal_type, created_by)
    values
      (p_workspace_id, 'REQUIREMENT STATED',   '#2563EB', 1, null,        v_creator_id),
      (p_workspace_id, 'ESTIMATE / BOQ SHARED', '#7C3AED', 2, null,        v_creator_id),
      (p_workspace_id, 'NEGOTIATIONS',          '#EA580C', 3, null,        v_creator_id),
      (p_workspace_id, 'DESIGN',                '#4F46E5', 4, null,        v_creator_id),
      (p_workspace_id, 'EXECUTIONS',            '#0891B2', 5, null,        v_creator_id),
      (p_workspace_id, 'PROJECT HANDOVER',      '#0D9488', 6, null,        v_creator_id),
      (p_workspace_id, 'WON',                   '#16A34A', 7, 'completed', v_creator_id),
      (p_workspace_id, 'LOST',                  '#DC2626', 8, 'lost',      v_creator_id);
  end if;
end;
$$;

-- 5. Seed default stages for existing workspaces without stages
do $$
declare
  ws record;
begin
  for ws in select id from public.workspaces loop
    perform public.ensure_default_activity_stages(ws.id);
  end loop;
end $$;

-- 6. Link existing projects without current_stage_id to matching stage
do $$
declare
  proj record;
  v_stage_id uuid;
begin
  for proj in select id, workspace_id, stage, workflow_stage from public.projects where current_stage_id is null loop
    select id into v_stage_id from public.activity_stages
    where workspace_id = proj.workspace_id
      and (
        upper(name) = upper(coalesce(proj.stage, ''))
        or (proj.workflow_stage = 'design_concept' and upper(name) = 'DESIGN')
        or (proj.workflow_stage = 'boq_approval' and upper(name) = 'ESTIMATE / BOQ SHARED')
        or (proj.workflow_stage = 'procurement' and upper(name) = 'EXECUTIONS')
        or (proj.workflow_stage = 'site_execution' and upper(name) = 'EXECUTIONS')
        or (upper(name) = 'REQUIREMENT STATED')
      )
    order by sort_order asc
    limit 1;

    if v_stage_id is not null then
      update public.projects set current_stage_id = v_stage_id where id = proj.id;
    end if;
  end loop;
end $$;
