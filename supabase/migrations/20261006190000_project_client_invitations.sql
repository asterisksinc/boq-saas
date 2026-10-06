-- ============================================================================
-- Client Invitations scoped to projects and workspaces
-- ============================================================================

create table if not exists public.project_client_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254),
  client_name text not null check (char_length(client_name) between 1 and 160),
  role text not null default 'client',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  token text not null unique,
  message text,
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_client_invitations_workspace_idx on public.project_client_invitations(workspace_id);
create index if not exists project_client_invitations_project_idx on public.project_client_invitations(project_id, status);
create index if not exists project_client_invitations_email_idx on public.project_client_invitations(email);
create index if not exists project_client_invitations_token_idx on public.project_client_invitations(token);

alter table public.project_client_invitations enable row level security;

create policy project_client_invitations_select on public.project_client_invitations
  for select to authenticated using (public.is_workspace_member(workspace_id));

create policy project_client_invitations_insert on public.project_client_invitations
  for insert to authenticated with check (public.is_workspace_member(workspace_id));

create policy project_client_invitations_update on public.project_client_invitations
  for update to authenticated using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy project_client_invitations_delete on public.project_client_invitations
  for delete to authenticated using (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.project_client_invitations to authenticated;

drop trigger if exists project_client_invitations_touch on public.project_client_invitations;
create trigger project_client_invitations_touch before update on public.project_client_invitations
  for each row execute function public.touch_updated_at();
