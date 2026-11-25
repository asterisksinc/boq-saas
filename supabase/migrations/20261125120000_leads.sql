-- Leads module: workspace-scoped sales pipeline with call logs and notes.
-- Matches Figma "User Design" → Leads (list, kanban, detail, call logs, notes).

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  lead_number bigint generated always as identity,
  lead_code text generated always as ('Lead-' || lpad(lead_number::text, 7, '0')) stored,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2000000),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 40),
  location text check (location is null or char_length(location) <= 200),
  project_id uuid references public.projects(id) on delete set null,
  source text not null default 'other'
    check (source in ('meta_ads','google_ads','custom_website','referral','walk_in','other')),
  stage text not null default 'new'
    check (stage in ('new','contacted','interested','qualified','unqualified','lost','won','churned')),
  assigned_to uuid references auth.users(id) on delete set null,
  last_contacted_at timestamptz,
  sort_order double precision not null default 0,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (id, workspace_id)
);

create table public.lead_call_logs (
  id uuid primary key default gen_random_uuid(),
  call_number bigint generated always as identity,
  call_code text generated always as (lpad(call_number::text, 5, '0')) stored,
  workspace_id uuid not null,
  lead_id uuid not null,
  title text not null check (char_length(title) between 1 and 200),
  call_type text not null default 'outbound' check (call_type in ('inbound','outbound')),
  status text not null check (status in ('connected','no_answer','busy','voicemail','scheduled')),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 0 and 1440),
  notes text check (notes is null or char_length(notes) <= 10000),
  called_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (lead_id, workspace_id) references public.leads(id, workspace_id) on delete cascade
);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  note_number bigint generated always as identity,
  note_code text generated always as (lpad(note_number::text, 4, '0')) stored,
  workspace_id uuid not null,
  lead_id uuid not null,
  title text not null check (char_length(title) between 1 and 200),
  body text check (body is null or char_length(body) <= 20000),
  note_type text not null default 'general'
    check (note_type in ('general','meeting','follow_up','boq','project','invoice')),
  visibility text not null default 'team' check (visibility in ('private','team')),
  boq_id uuid,
  project_id uuid,
  invoice_id uuid,
  attachments jsonb not null default '[]' check (jsonb_typeof(attachments) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (lead_id, workspace_id) references public.leads(id, workspace_id) on delete cascade
);

create index leads_workspace_updated_idx on public.leads(workspace_id, updated_at desc) where archived_at is null;
create index leads_workspace_stage_idx on public.leads(workspace_id, stage, sort_order) where archived_at is null;
create index leads_workspace_project_idx on public.leads(workspace_id, project_id) where project_id is not null;
create index lead_call_logs_lead_idx on public.lead_call_logs(lead_id, called_at desc);
create index lead_notes_lead_idx on public.lead_notes(lead_id, created_at desc);

create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();
create trigger lead_call_logs_touch before update on public.lead_call_logs for each row execute function public.touch_updated_at();
create trigger lead_notes_touch before update on public.lead_notes for each row execute function public.touch_updated_at();

-- Logging a call bumps the lead's "last contacted" timestamp.
create or replace function public.bump_lead_last_contacted()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.leads
     set last_contacted_at = greatest(coalesce(last_contacted_at, new.called_at), new.called_at)
   where id = new.lead_id and workspace_id = new.workspace_id;
  return new;
end;
$$;

create trigger lead_call_logs_bump_contact
  after insert on public.lead_call_logs for each row execute function public.bump_lead_last_contacted();

alter table public.leads enable row level security;
alter table public.lead_call_logs enable row level security;
alter table public.lead_notes enable row level security;

create policy leads_select_member on public.leads for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy leads_insert_editor on public.leads for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member')
    and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy leads_update_editor on public.leads for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin','member'))
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and updated_by = (select auth.uid()));

create policy lead_call_logs_select_member on public.lead_call_logs for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy lead_call_logs_insert_editor on public.lead_call_logs for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and created_by = (select auth.uid()));
create policy lead_call_logs_update_editor on public.lead_call_logs for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin','member'))
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member'));
create policy lead_call_logs_delete_editor on public.lead_call_logs for delete to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin','member'));

-- Private notes are only visible to their author.
create policy lead_notes_select_member on public.lead_notes for select to authenticated
  using (public.is_workspace_member(workspace_id) and (visibility = 'team' or created_by = (select auth.uid())));
create policy lead_notes_insert_editor on public.lead_notes for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and created_by = (select auth.uid()));
create policy lead_notes_update_editor on public.lead_notes for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin','member') and (visibility = 'team' or created_by = (select auth.uid())))
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member'));
create policy lead_notes_delete_editor on public.lead_notes for delete to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin','member') and (visibility = 'team' or created_by = (select auth.uid())));

grant select, insert, update on public.leads to authenticated;
grant select, insert, update, delete on public.lead_call_logs, public.lead_notes to authenticated;
