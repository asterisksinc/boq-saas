-- Phase 6 (incremental): workspace-scoped proposals and document management.
-- Project/BOQ/template UUIDs intentionally remain soft references until those
-- deferred domain tables exist. Snapshot labels keep current APIs useful.

create or replace function public.role_permissions(p_role text)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'canCreateProject', p_role in ('owner','admin','member'),
    'canCreateBoq', p_role in ('owner','admin','member'),
    'canViewFinancials', p_role in ('owner','admin'),
    'canApprove', p_role in ('owner','admin'),
    'canExport', p_role in ('owner','admin','member'),
    'canCreateProposal', p_role in ('owner','admin','member'),
    'canManageDocuments', p_role in ('owner','admin','member'),
    'canArchiveProposal', p_role in ('owner','admin'),
    'canDeleteDocuments', p_role in ('owner','admin')
  );
$$;

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  proposal_number bigint generated always as identity,
  proposal_code text generated always as ('PROP-' || lpad(proposal_number::text, 4, '0')) stored,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid,
  project_name text not null check (char_length(project_name) between 1 and 200),
  client_name text not null check (char_length(client_name) between 1 and 200),
  source_type text not null default 'scratch' check (source_type in ('scratch','boq','duplicate','template')),
  source_id uuid,
  source_label text,
  proposed_value numeric(18,2) not null check (proposed_value >= 0),
  currency varchar(3) not null check (currency ~ '^[A-Z]{3}$'),
  expiry_date date,
  internal_notes text check (internal_notes is null or char_length(internal_notes) <= 5000),
  scope_items text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','sent','approved','revisions','won','lost')),
  view_count integer not null default 0 check (view_count >= 0),
  sent_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (workspace_id, proposal_code),
  unique (id, workspace_id)
);

create table public.document_folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  parent_id uuid,
  name text not null check (char_length(name) between 1 and 160),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (parent_id, workspace_id) references public.document_folders(id, workspace_id) on delete cascade
);

create unique index document_folders_unique_name_idx
  on public.document_folders (workspace_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  folder_id uuid not null,
  proposal_id uuid references public.proposals(id) on delete set null,
  project_id uuid,
  project_name text,
  name text not null check (char_length(name) between 1 and 255),
  storage_path text not null unique,
  mime_type text not null check (char_length(mime_type) between 1 and 160),
  size_bytes bigint not null check (size_bytes between 1 and 26214400),
  checksum_sha256 text,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (folder_id, workspace_id) references public.document_folders(id, workspace_id) on delete cascade
);

create or replace function public.enforce_document_proposal_workspace()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.proposal_id is not null and not exists (
    select 1 from public.proposals p where p.id = new.proposal_id and p.workspace_id = new.workspace_id
  ) then
    raise exception 'proposal must belong to the document workspace';
  end if;
  return new;
end;
$$;

create trigger documents_proposal_workspace
  before insert or update of proposal_id on public.documents
  for each row execute function public.enforce_document_proposal_workspace();

create index proposals_workspace_updated_idx on public.proposals(workspace_id, updated_at desc) where archived_at is null;
create index proposals_workspace_status_idx on public.proposals(workspace_id, status) where archived_at is null;
create index proposals_workspace_expiry_idx on public.proposals(workspace_id, expiry_date) where archived_at is null;
create index document_folders_workspace_parent_idx on public.document_folders(workspace_id, parent_id, updated_at desc);
create index documents_workspace_folder_idx on public.documents(workspace_id, folder_id, updated_at desc);
create index documents_workspace_project_idx on public.documents(workspace_id, project_id) where project_id is not null;

create or replace function public.seed_default_document_folders()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'active' and new.role = 'owner' then
    insert into public.document_folders(workspace_id, name, created_by, updated_by)
    select new.workspace_id, folder_name, new.user_id, new.user_id
    from unnest(array['Projects','BOQ Files','Proposals','Invoices','Vendor Quotes','Drawings']) as folder_name
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger seed_document_folders_after_membership
  after insert on public.workspace_memberships for each row execute function public.seed_default_document_folders();

-- Add the same defaults to workspaces that predate this migration.
insert into public.document_folders(workspace_id, name, created_by, updated_by)
select membership.workspace_id, folder_name, membership.user_id, membership.user_id
from (
  select distinct on (workspace_id) workspace_id, user_id
  from public.workspace_memberships
  where status = 'active'
  order by workspace_id, joined_at
) membership
cross join unnest(array['Projects','BOQ Files','Proposals','Invoices','Vendor Quotes','Drawings']) as folder_name
on conflict do nothing;

create trigger proposals_touch before update on public.proposals for each row execute function public.touch_updated_at();
create trigger document_folders_touch before update on public.document_folders for each row execute function public.touch_updated_at();
create trigger documents_touch before update on public.documents for each row execute function public.touch_updated_at();

alter table public.proposals enable row level security;
alter table public.document_folders enable row level security;
alter table public.documents enable row level security;

create policy proposals_select_member on public.proposals for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy proposals_insert_editor on public.proposals for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy proposals_update_editor on public.proposals for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin','member'))
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and updated_by = (select auth.uid()) and archived_at is null);
create policy proposals_archive_admin on public.proposals for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin'))
  with check (public.current_workspace_role(workspace_id) in ('owner','admin') and updated_by = (select auth.uid()));

create or replace function public.record_proposal_view(p_proposal_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  update public.proposals p set view_count = p.view_count + 1
  where p.id = p_proposal_id and p.archived_at is null and public.is_workspace_member(p.workspace_id)
  returning p.view_count into v_count;
  if v_count is null then raise exception 'proposal not found'; end if;
  return v_count;
end;
$$;

revoke all on function public.record_proposal_view(uuid) from public;
grant execute on function public.record_proposal_view(uuid) to authenticated;

create policy folders_select_member on public.document_folders for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy folders_insert_editor on public.document_folders for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy folders_update_editor on public.document_folders for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin','member'))
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and updated_by = (select auth.uid()));
create policy folders_delete_admin on public.document_folders for delete to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin'));

create policy documents_select_member on public.documents for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy documents_insert_editor on public.documents for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and uploaded_by = (select auth.uid()));
create policy documents_update_editor on public.documents for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin','member'))
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member'));
create policy documents_delete_admin on public.documents for delete to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin'));

-- Private object storage. The first path segment is always the workspace UUID.
insert into storage.buckets (id, name, public, file_size_limit)
values ('workspace-documents', 'workspace-documents', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create policy workspace_documents_read on storage.objects for select to authenticated
  using (bucket_id = 'workspace-documents' and public.is_workspace_member(((storage.foldername(name))[1])::uuid));
create policy workspace_documents_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'workspace-documents' and public.current_workspace_role(((storage.foldername(name))[1])::uuid) in ('owner','admin','member'));
create policy workspace_documents_delete on storage.objects for delete to authenticated
  using (bucket_id = 'workspace-documents' and public.current_workspace_role(((storage.foldername(name))[1])::uuid) in ('owner','admin'));

revoke all on public.proposals, public.document_folders, public.documents from anon, authenticated;
grant select, insert on public.proposals to authenticated;
grant update (project_id, project_name, client_name, proposed_value, expiry_date, internal_notes, scope_items, status, sent_at, archived_at, updated_by) on public.proposals to authenticated;
grant select, insert, delete on public.document_folders to authenticated;
grant update (parent_id, name, updated_by) on public.document_folders to authenticated;
grant select, insert, delete on public.documents to authenticated;
grant update (folder_id, project_id, project_name, name) on public.documents to authenticated;
