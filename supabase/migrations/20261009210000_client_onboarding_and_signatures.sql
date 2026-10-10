-- ============================================================================
-- Client Onboarding State and Document Signatures
-- Scoped to projects, workspaces, and authenticated clients
-- ============================================================================

-- Table to track client onboarding progress per project and user
create table if not exists public.client_onboarding (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_email text not null check (char_length(client_email) between 3 and 254),
  current_step text not null default 'welcome' check (current_step in ('welcome', 'documents', 'dashboard')),
  completed_steps text[] not null default '{}',
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index if not exists client_onboarding_workspace_idx on public.client_onboarding(workspace_id);
create index if not exists client_onboarding_project_idx on public.client_onboarding(project_id);
create index if not exists client_onboarding_user_idx on public.client_onboarding(user_id);

alter table public.client_onboarding enable row level security;

-- Client can view and update their own onboarding records
create policy client_onboarding_select_self on public.client_onboarding
  for select to authenticated using (
    user_id = (select auth.uid()) or public.is_workspace_member(workspace_id)
  );

create policy client_onboarding_insert_self on public.client_onboarding
  for insert to authenticated with check (
    user_id = (select auth.uid()) or public.is_workspace_member(workspace_id)
  );

create policy client_onboarding_update_self on public.client_onboarding
  for update to authenticated using (
    user_id = (select auth.uid()) or public.is_workspace_member(workspace_id)
  ) with check (
    user_id = (select auth.uid()) or public.is_workspace_member(workspace_id)
  );

grant select, insert, update on public.client_onboarding to authenticated;

drop trigger if exists client_onboarding_touch on public.client_onboarding;
create trigger client_onboarding_touch before update on public.client_onboarding
  for each row execute function public.touch_updated_at();

-- Table to store e-signatures on client project documents
create table if not exists public.client_document_signatures (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id text not null,
  document_title text not null check (char_length(document_title) between 1 and 255),
  document_reference text not null check (char_length(document_reference) between 1 and 100),
  document_type text not null default 'proposal' check (document_type in ('proposal', 'contract', 'document')),
  signer_name text not null check (char_length(signer_name) between 1 and 160),
  signer_email text not null check (char_length(signer_email) between 3 and 254),
  signature_data jsonb not null default '{}'::jsonb,
  status text not null default 'signed' check (status in ('pending', 'signed', 'rejected')),
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (project_id, user_id, document_id)
);

create index if not exists client_signatures_workspace_idx on public.client_document_signatures(workspace_id);
create index if not exists client_signatures_project_idx on public.client_document_signatures(project_id);
create index if not exists client_signatures_user_idx on public.client_document_signatures(user_id);
create index if not exists client_signatures_doc_idx on public.client_document_signatures(document_id);

alter table public.client_document_signatures enable row level security;

create policy client_signatures_select on public.client_document_signatures
  for select to authenticated using (
    user_id = (select auth.uid()) or public.is_workspace_member(workspace_id)
  );

create policy client_signatures_insert on public.client_document_signatures
  for insert to authenticated with check (
    user_id = (select auth.uid()) or public.is_workspace_member(workspace_id)
  );

create policy client_signatures_update on public.client_document_signatures
  for update to authenticated using (
    user_id = (select auth.uid()) or public.is_workspace_member(workspace_id)
  ) with check (
    user_id = (select auth.uid()) or public.is_workspace_member(workspace_id)
  );

grant select, insert, update on public.client_document_signatures to authenticated;
