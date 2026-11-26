-- Admin relationship/design modules. These tables are workspace-scoped and are
-- intentionally outside the client portal namespace.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_code text not null,
  name text not null check (char_length(name) between 1 and 160),
  avatar_url text,
  email text,
  phone text,
  location text,
  project_id uuid references public.projects(id) on delete set null,
  source text not null default 'other' check (source in ('meta_ads','google_ads','custom_website','referral','walk_in','other')),
  stage text not null default 'new' check (stage in ('new','contacted','interested','qualified','unqualified','lost','won','churned')),
  assigned_to uuid references auth.users(id) on delete set null,
  last_contacted_at timestamptz,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, lead_code)
);

create index if not exists leads_workspace_updated_idx on public.leads(workspace_id, updated_at desc) where archived_at is null;
create index if not exists leads_workspace_stage_idx on public.leads(workspace_id, stage) where archived_at is null;

create table if not exists public.lead_call_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  code text not null,
  title text not null,
  call_type text not null default 'outbound' check (call_type in ('inbound','outbound')),
  status text not null default 'connected' check (status in ('connected','no_answer','busy','voicemail','scheduled')),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  notes text,
  called_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  code text not null,
  title text not null,
  body text,
  note_type text not null default 'general',
  visibility text not null default 'team' check (visibility in ('private','team')),
  project_id uuid references public.projects(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  attachments jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create table if not exists public.mood_boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  project_id uuid references public.projects(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  description text,
  status text not null default 'DRAFT' check (status in ('DRAFT','IN_PROGRESS','COMPLETED','ARCHIVED')),
  mode text not null default 'blank' check (mode in ('blank','template')),
  categories jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  cover_image text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mood_boards_workspace_updated_idx on public.mood_boards(workspace_id, updated_at desc);

do $$
declare t text;
begin
  foreach t in array array['leads','lead_call_logs','lead_notes','mood_boards'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I_select_member on public.%I', t, t);
    execute format('create policy %I_select_member on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))', t, t);
    execute format('drop policy if exists %I_insert_writer on public.%I', t, t);
    execute format('create policy %I_insert_writer on public.%I for insert to authenticated with check (public.current_workspace_role(workspace_id) in (''owner'',''admin'',''member'') and created_by = (select auth.uid()))', t, t);
    execute format('drop policy if exists %I_update_writer on public.%I', t, t);
    execute format('create policy %I_update_writer on public.%I for update to authenticated using (public.current_workspace_role(workspace_id) in (''owner'',''admin'',''member''))', t, t);
    execute format('drop policy if exists %I_delete_writer on public.%I', t, t);
    execute format('create policy %I_delete_writer on public.%I for delete to authenticated using (public.current_workspace_role(workspace_id) in (''owner'',''admin'',''member''))', t, t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();
drop trigger if exists lead_call_logs_touch on public.lead_call_logs;
create trigger lead_call_logs_touch before update on public.lead_call_logs for each row execute function public.touch_updated_at();
drop trigger if exists lead_notes_touch on public.lead_notes;
create trigger lead_notes_touch before update on public.lead_notes for each row execute function public.touch_updated_at();
drop trigger if exists mood_boards_touch on public.mood_boards;
create trigger mood_boards_touch before update on public.mood_boards for each row execute function public.touch_updated_at();
