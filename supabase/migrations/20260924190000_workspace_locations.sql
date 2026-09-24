-- Workspace Locations migration for Organization Settings
create table if not exists public.workspace_locations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  city text not null,
  state text not null,
  address text not null,
  is_default boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists workspace_locations_workspace_idx on public.workspace_locations(workspace_id, updated_at desc) where archived_at is null;

create trigger workspace_locations_touch before update on public.workspace_locations for each row execute function public.touch_updated_at();

alter table public.workspace_locations enable row level security;

create policy workspace_locations_select_member on public.workspace_locations
  for select to authenticated using (public.is_workspace_member(workspace_id) and archived_at is null);

create policy workspace_locations_insert_admin on public.workspace_locations
  for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner', 'admin') and created_by = (select auth.uid()));

create policy workspace_locations_update_admin on public.workspace_locations
  for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner', 'admin'))
  with check (public.current_workspace_role(workspace_id) in ('owner', 'admin'));

create policy workspace_locations_delete_admin on public.workspace_locations
  for delete to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner', 'admin'));

grant select, insert, update, delete on public.workspace_locations to authenticated;
