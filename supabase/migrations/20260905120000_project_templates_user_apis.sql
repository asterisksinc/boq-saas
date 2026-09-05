-- Authenticated user-facing project template library.
-- Template content is versioned as immutable JSON snapshots while the current
-- draft remains directly editable. Every record is workspace scoped by RLS.

create sequence if not exists public.project_template_code_seq;

create table public.project_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  template_code text not null default ('TEM-' || lpad(nextval('public.project_template_code_seq')::text, 6, '0')),
  name text not null check (char_length(name) between 1 and 160),
  description text,
  business_type text not null,
  project_type text not null,
  team text,
  region text,
  visibility text not null default 'workspace' check (visibility in ('workspace','private')),
  image_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','active','needs_review','archived')),
  current_version integer not null default 0 check (current_version >= 0),
  structure jsonb not null default '{}'::jsonb check (jsonb_typeof(structure) = 'object'),
  costing_boq jsonb not null default '{}'::jsonb check (jsonb_typeof(costing_boq) = 'object'),
  workflow jsonb not null default '{}'::jsonb check (jsonb_typeof(workflow) = 'object'),
  documents jsonb not null default '[]'::jsonb check (jsonb_typeof(documents) = 'array'),
  use_count integer not null default 0 check (use_count >= 0),
  last_used_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, template_code),
  unique(id, workspace_id)
);

create table public.project_template_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  template_id uuid not null,
  version integer not null check (version > 0),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  change_note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (template_id, workspace_id) references public.project_templates(id, workspace_id) on delete cascade,
  unique(template_id, version)
);

create table public.project_template_usage (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  template_id uuid not null,
  template_version integer not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  project_id uuid not null references public.projects(id) on delete cascade,
  used_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (template_id, workspace_id) references public.project_templates(id, workspace_id) on delete restrict,
  unique(project_id)
);

alter table public.projects
  add column if not exists source_template_id uuid,
  add column if not exists source_template_version integer;
alter table public.projects add constraint projects_source_template_fk
  foreign key (source_template_id) references public.project_templates(id) on delete set null;

create index project_templates_workspace_updated_idx on public.project_templates(workspace_id, updated_at desc) where archived_at is null;
create index project_template_versions_template_idx on public.project_template_versions(template_id, version desc);
create index project_template_usage_template_idx on public.project_template_usage(template_id, created_at desc);

create trigger project_templates_touch before update on public.project_templates for each row execute function public.touch_updated_at();

do $$ declare t text; begin
  foreach t in array array['project_templates','project_template_versions','project_template_usage'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))', t || '_select_member', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.current_workspace_role(workspace_id) in (''owner'',''admin''))', t || '_delete_admin', t);
  end loop;
end $$;

create policy project_templates_insert_writer on public.project_templates for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy project_templates_update_writer on public.project_templates for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin','member'))
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and updated_by = (select auth.uid()));
create policy project_template_versions_insert_writer on public.project_template_versions for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and created_by = (select auth.uid()));
create policy project_template_usage_insert_writer on public.project_template_usage for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and used_by = (select auth.uid()));

grant select,insert,update,delete on public.project_templates to authenticated;
grant select,insert,delete on public.project_template_versions, public.project_template_usage to authenticated;

grant usage, select on sequence public.project_template_code_seq to authenticated;

create or replace function public.use_project_template(
  p_workspace_id uuid, p_template_id uuid, p_name text, p_client_name text,
  p_location text default null, p_start_date date default null, p_target_completion_date date default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_template public.project_templates; v_project_id uuid; v_snapshot jsonb;
begin
  if public.current_workspace_role(p_workspace_id) not in ('owner','admin','member') then
    raise exception 'template use is not permitted';
  end if;
  select * into v_template from public.project_templates
    where id = p_template_id and workspace_id = p_workspace_id and status = 'active' and archived_at is null for update;
  if not found then raise exception 'active template not found'; end if;
  insert into public.projects(workspace_id,name,client_name,project_type,status,location,start_date,target_completion_date,
    source_template_id,source_template_version,created_by)
  values(p_workspace_id,p_name,p_client_name,v_template.project_type,'planning',p_location,p_start_date,p_target_completion_date,
    v_template.id,v_template.current_version,(select auth.uid())) returning id into v_project_id;
  v_snapshot := jsonb_build_object(
    'templateId', v_template.id, 'templateCode', v_template.template_code, 'version', v_template.current_version,
    'name', v_template.name, 'businessType', v_template.business_type, 'projectType', v_template.project_type,
    'structure', v_template.structure, 'costingBoq', v_template.costing_boq,
    'workflow', v_template.workflow, 'documents', v_template.documents
  );
  insert into public.project_template_usage(workspace_id,template_id,template_version,snapshot,project_id,used_by)
  values(p_workspace_id,v_template.id,v_template.current_version,v_snapshot,v_project_id,(select auth.uid()));
  update public.project_templates set use_count = use_count + 1, last_used_at = now(), updated_by = (select auth.uid())
    where id = v_template.id;
  return jsonb_build_object('projectId', v_project_id, 'templateId', v_template.id,
    'templateVersion', v_template.current_version, 'snapshot', v_snapshot);
end;
$$;
grant execute on function public.use_project_template(uuid,uuid,text,text,text,date,date) to authenticated;

create or replace function public.get_permissions(p_role text)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'canManageOrganization', p_role in ('owner','admin'), 'canManageMembers', p_role in ('owner','admin'),
    'canCreateProject', p_role in ('owner','admin','member'), 'canCreateBoq', p_role in ('owner','admin','member'),
    'canManageBoq', p_role in ('owner','admin','member'), 'canManageCosting', p_role in ('owner','admin','member'),
    'canViewFinancials', p_role in ('owner','admin'), 'canViewReports', p_role in ('owner','admin'),
    'canExportReports', p_role in ('owner','admin'), 'canApprove', p_role in ('owner','admin'),
    'canExport', p_role in ('owner','admin','member'), 'canCreateProposal', p_role in ('owner','admin','member'),
    'canManageDocuments', p_role in ('owner','admin','member'), 'canArchiveProposal', p_role in ('owner','admin'),
    'canDeleteDocuments', p_role in ('owner','admin'), 'canCreateInvoice', p_role in ('owner','admin','member'),
    'canRecordPayment', p_role in ('owner','admin','member'), 'canDeleteInvoice', p_role in ('owner','admin'),
    'canCreateTemplate', p_role in ('owner','admin','member'), 'canEditTemplate', p_role in ('owner','admin','member'),
    'canArchiveTemplate', p_role in ('owner','admin'), 'canUseTemplate', p_role in ('owner','admin','member')
  );
$$;

-- get_current_context() calls role_permissions; keep both permission helpers in sync.
create or replace function public.role_permissions(p_role text)
returns jsonb language sql immutable set search_path = '' as $$
  select public.get_permissions(p_role);
$$;
revoke all on function public.get_permissions(text) from public;
grant execute on function public.get_permissions(text) to authenticated;
grant execute on function public.role_permissions(text) to authenticated;
