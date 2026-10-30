-- Client portal backend support.
-- This migration is additive: it does not alter existing user-role tables or UI.

create table if not exists public.client_project_access (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_status text not null default 'active' check (access_status in ('active','revoked')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (project_id, user_id)
);

create index if not exists client_project_access_user_idx
  on public.client_project_access(user_id, access_status);
create index if not exists client_project_access_project_idx
  on public.client_project_access(project_id, access_status);

alter table public.client_project_access enable row level security;

drop policy if exists client_project_access_select_self on public.client_project_access;
create policy client_project_access_select_self on public.client_project_access
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_workspace_member(workspace_id));

grant select on public.client_project_access to authenticated;

-- Makes repeated client payment submissions safe when the frontend retries.
alter table public.invoice_payments
  add column if not exists idempotency_key text;

create unique index if not exists invoice_payments_idempotency_idx
  on public.invoice_payments(invoice_id, idempotency_key)
  where idempotency_key is not null;

comment on table public.client_project_access is
  'Explicit client-to-project access map. Client APIs must only expose active rows.';
comment on column public.invoice_payments.idempotency_key is
  'Optional client-generated retry key for client invoice payment submissions.';
