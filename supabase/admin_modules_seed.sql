-- BOQ SaaS admin + Leads + Moodboards seed
-- DEV / QA ONLY. Apply migrations first, then run this file with the Supabase
-- service role or `supabase db reset`. It is intentionally idempotent.

begin;

create extension if not exists pgcrypto;

-- Normalize Auth token columns after direct seed inserts. GoTrue expects empty
-- strings instead of NULL for these fields.
do $$
declare
  v_column_name text;
begin
  foreach v_column_name in array array['confirmation_token','recovery_token','email_change_token_current','email_change_token_new','phone_change_token','reauthentication_token'] loop
    if exists (select 1 from information_schema.columns c where c.table_schema = 'auth' and c.table_name = 'users' and c.column_name = v_column_name) then
      execute format('update auth.users set %I = coalesce(%I, '''')', v_column_name, v_column_name);
    end if;
  end loop;
end $$;

-- Keep this seed runnable when the optional security/access migration has not
-- been applied yet. The official migration uses the same compatible shape and
-- will add its policies, permissions, and membership role_id column later.
create table if not exists public.workspace_roles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  is_system boolean not null default false,
  system_fallback text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);
alter table public.workspace_roles enable row level security;
grant select, insert, update, delete on public.workspace_roles to authenticated;
drop policy if exists workspace_roles_seed_select on public.workspace_roles;
create policy workspace_roles_seed_select on public.workspace_roles for select to authenticated using (public.is_workspace_member(workspace_id));
drop policy if exists workspace_roles_seed_write on public.workspace_roles;
create policy workspace_roles_seed_write on public.workspace_roles for all to authenticated using (public.current_workspace_role(workspace_id) in ('owner','admin')) with check (public.current_workspace_role(workspace_id) in ('owner','admin'));

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_code text not null, name text not null, avatar_url text, email text, phone text, location text,
  project_id uuid references public.projects(id) on delete set null, source text not null default 'other',
  stage text not null default 'new', assigned_to uuid references auth.users(id) on delete set null,
  last_contacted_at timestamptz, sort_order integer not null default 0, archived_at timestamptz,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (workspace_id, lead_code)
);
create table if not exists public.lead_call_logs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade, code text not null, title text not null,
  call_type text not null default 'outbound', status text not null default 'connected', duration_minutes integer,
  notes text, called_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (workspace_id, code)
);
create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade, code text not null, title text not null, body text,
  note_type text not null default 'general', visibility text not null default 'team', project_id uuid references public.projects(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null, attachments jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (workspace_id, code)
);
create table if not exists public.mood_boards (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, project_id uuid references public.projects(id) on delete set null, lead_id uuid references public.leads(id) on delete set null,
  description text, status text not null default 'DRAFT', mode text not null default 'blank', categories jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb, cover_image text, created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['leads','lead_call_logs','lead_notes','mood_boards'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists %I_select_seed on public.%I', t, t);
    execute format('create policy %I_select_seed on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))', t, t);
    execute format('drop policy if exists %I_write_seed on public.%I', t, t);
    execute format('create policy %I_write_seed on public.%I for all to authenticated using (public.current_workspace_role(workspace_id) in (''owner'',''admin'',''member'')) with check (public.current_workspace_role(workspace_id) in (''owner'',''admin'',''member''))', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Auth users and the admin workspace
-- ---------------------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'admin@boq.com', crypt('Admin@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"admin","otp_bypass":true}'::jsonb, '{"display_name":"BOQ Platform Admin","company_name":"Arena Design Studio"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'designer@boq.com', crypt('Designer@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"otp_bypass":true}'::jsonb, '{"display_name":"Aarav Designer","company_name":"Arena Design Studio"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'sales@boq.com', crypt('Sales@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"otp_bypass":true}'::jsonb, '{"display_name":"Meera Sales","company_name":"Arena Design Studio"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'manager@boq.com', crypt('Manager@12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"otp_bypass":true}'::jsonb, '{"display_name":"Kabir Manager","company_name":"Arena Design Studio"}'::jsonb, now(), now())
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
select id, id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now(), now()
from auth.users
where id in ('90000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000002','90000000-0000-4000-8000-000000000003','90000000-0000-4000-8000-000000000004')
on conflict (provider_id, provider) do update set identity_data = excluded.identity_data, updated_at = now();

insert into public.workspaces (id, name, status, currency, timezone, country)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Arena Design Studio', 'active', 'INR', 'Asia/Kolkata', 'India')
on conflict (id) do update set name = excluded.name, status = excluded.status, updated_at = now();

insert into public.user_profiles (user_id, display_name)
values
  ('90000000-0000-4000-8000-000000000001','BOQ Platform Admin'),
  ('90000000-0000-4000-8000-000000000002','Aarav Designer'),
  ('90000000-0000-4000-8000-000000000003','Meera Sales'),
  ('90000000-0000-4000-8000-000000000004','Kabir Manager')
on conflict (user_id) do update set display_name = excluded.display_name, updated_at = now();

insert into public.user_preferences (user_id, timezone, locale)
select id, 'Asia/Kolkata', 'en-IN' from auth.users
where id in ('90000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000002','90000000-0000-4000-8000-000000000003','90000000-0000-4000-8000-000000000004')
on conflict (user_id) do update set timezone = excluded.timezone, locale = excluded.locale, updated_at = now();

insert into public.workspace_memberships (workspace_id, user_id, role, status)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000001','owner','active'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000002','member','active'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000003','admin','active'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000004','member','active')
on conflict (workspace_id, user_id) do update set role = excluded.role, status = excluded.status;

insert into public.onboarding_progress (workspace_id, user_id, current_step, completed_steps, skipped_steps, status)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000001','complete',array['account_created','company_setup','project_setup','boq_setup'],array[]::text[],'completed')
on conflict (workspace_id, user_id) do update set current_step = excluded.current_step, completed_steps = excluded.completed_steps, skipped_steps = excluded.skipped_steps, status = excluded.status;

-- ---------------------------------------------------------------------------
-- Admin roles, plans, subscription, and workspace settings
-- ---------------------------------------------------------------------------
insert into public.workspace_roles (id, workspace_id, name, description, is_system, system_fallback)
values
  ('91000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Platform Admin','Full access to workspace administration and all modules.',true,'admin'),
  ('91000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Designer','Create and maintain design deliverables.',false,'member'),
  ('91000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Sales','Manage leads, calls, and client follow-up.',false,'member'),
  ('91000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Project Manager','Manage projects, rooms, BOQs, and approvals.',false,'admin')
on conflict (id) do update set name = excluded.name, description = excluded.description, system_fallback = excluded.system_fallback, updated_at = now();

insert into public.subscription_plans (code, name, description, monthly_price, currency, sort_order, active, limits, features)
values
  ('starter','Starter','For small design teams.',4999,'INR',1,true,'{"users":5,"projects":20}'::jsonb,'{"reports":"basic","support":"standard"}'::jsonb),
  ('professional','Professional','For growing construction teams.',9999,'INR',2,true,'{"users":20,"projects":100}'::jsonb,'{"reports":"full","support":"priority"}'::jsonb),
  ('business','Business','For organizations that need scale.',18000,'INR',3,true,'{"users":50,"projects":null}'::jsonb,'{"reports":"advanced","support":"priority"}'::jsonb),
  ('enterprise','Enterprise','Custom requirements at scale.',null,'INR',4,true,'{"users":null,"projects":null}'::jsonb,'{"support":"dedicated"}'::jsonb)
on conflict (code) do update set name = excluded.name, description = excluded.description, monthly_price = excluded.monthly_price, limits = excluded.limits, features = excluded.features, active = excluded.active;

insert into public.workspace_subscriptions (workspace_id, plan_code, status, billing_frequency, billing_contact, seats_used, period_start, period_end)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','professional','active','monthly','admin@boq.com',4,'2026-11-01','2026-12-01')
on conflict (workspace_id) do update set plan_code = excluded.plan_code, status = excluded.status, seats_used = excluded.seats_used, billing_contact = excluded.billing_contact, updated_at = now();

insert into public.workspace_settings (workspace_id, branding, security, updated_by)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"companyName":"Arena Design Studio","primaryColor":"#2563EB"}'::jsonb,'{"twoFactorEnabled":true}'::jsonb,'90000000-0000-4000-8000-000000000001')
on conflict (workspace_id) do update set branding = excluded.branding, security = excluded.security, updated_by = excluded.updated_by, updated_at = now();

-- ---------------------------------------------------------------------------
-- Projects, rooms, Leads, Call Logs, Notes, and Moodboards
-- ---------------------------------------------------------------------------
insert into public.projects (id, workspace_id, project_code, name, client_name, project_type, status, progress, location, project_value, approved_budget, created_by)
values
  ('92000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','PRJ-ADMIN-001','Mehta Residence — Bandra','Mehta Family','Residential','in_progress',68,'Mumbai, Maharashtra',4800000,4250000,'90000000-0000-4000-8000-000000000001'),
  ('92000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','PRJ-ADMIN-002','Kohinoor Office — Level 4','Kohinoor Group','Commercial','active',42,'Pune, Maharashtra',12500000,11000000,'90000000-0000-4000-8000-000000000001'),
  ('92000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','PRJ-ADMIN-003','Lakeview Villa — Lavasa','Sharma Family','Residential','planning',18,'Lavasa, Maharashtra',7500000,6800000,'90000000-0000-4000-8000-000000000001')
on conflict (id) do update set name = excluded.name, client_name = excluded.client_name, status = excluded.status, progress = excluded.progress, updated_at = now();

insert into public.project_rooms (id, workspace_id, project_id, name, room_type, length, width, height, unit, sort_order, created_by)
values
  ('93000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','92000000-0000-4000-8000-000000000001','Master Bedroom','Bedroom',14,12,10,'ft',1,'90000000-0000-4000-8000-000000000001'),
  ('93000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','92000000-0000-4000-8000-000000000001','Living Room','Living Room',22,18,10,'ft',2,'90000000-0000-4000-8000-000000000001')
on conflict (id) do update set name = excluded.name, length = excluded.length, width = excluded.width, height = excluded.height, updated_at = now();

insert into public.leads (id, workspace_id, lead_code, name, email, phone, location, project_id, source, stage, assigned_to, created_by, sort_order)
values
  ('94000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','LEAD-ADMIN-001','Rohan Mehta','rohan.mehta@example.com','+91 9876543210','Mumbai, Maharashtra','92000000-0000-4000-8000-000000000001','referral','qualified','90000000-0000-4000-8000-000000000003','90000000-0000-4000-8000-000000000001',1),
  ('94000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','LEAD-ADMIN-002','Priya Shah','priya.shah@example.com','+91 9876543211','Pune, Maharashtra','92000000-0000-4000-8000-000000000002','custom_website','contacted','90000000-0000-4000-8000-000000000003','90000000-0000-4000-8000-000000000001',2),
  ('94000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','LEAD-ADMIN-003','Nikhil Oberoi','nikhil.oberoi@example.com','+91 9876543212','Bandra West, Mumbai',null,'google_ads','new','90000000-0000-4000-8000-000000000003','90000000-0000-4000-8000-000000000001',3),
  ('94000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','LEAD-ADMIN-004','Ananya Bose','ananya.bose@example.com','+91 9876543213','Indiranagar, Bengaluru','92000000-0000-4000-8000-000000000003','meta_ads','interested','90000000-0000-4000-8000-000000000002','90000000-0000-4000-8000-000000000001',4)
on conflict (id) do update set name = excluded.name, email = excluded.email, phone = excluded.phone, stage = excluded.stage, project_id = excluded.project_id, assigned_to = excluded.assigned_to, updated_at = now();

insert into public.lead_call_logs (id, workspace_id, lead_id, code, title, call_type, status, duration_minutes, notes, called_at, created_by)
values
  ('95000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','94000000-0000-4000-8000-000000000001','CALL-ADMIN-001','Initial discovery call','outbound','connected',28,'Discussed scope, style direction, and tentative timeline.',now(),'90000000-0000-4000-8000-000000000003'),
  ('95000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','94000000-0000-4000-8000-000000000002','CALL-ADMIN-002','Follow-up call','inbound','scheduled',null,'Client will share floor plan before next call.',now() + interval '1 day','90000000-0000-4000-8000-000000000001')
on conflict (id) do update set title = excluded.title, status = excluded.status, notes = excluded.notes, updated_at = now();

insert into public.lead_notes (id, workspace_id, lead_id, code, title, body, note_type, visibility, project_id, attachments, created_by)
values
  ('96000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','94000000-0000-4000-8000-000000000001','NOTE-ADMIN-001','Preferred design direction','Warm contemporary with natural stone, oak, and concealed storage.','preference','team','92000000-0000-4000-8000-000000000001','[]'::jsonb,'90000000-0000-4000-8000-000000000001'),
  ('96000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','94000000-0000-4000-8000-000000000003','NOTE-ADMIN-002','Needs site visit','Schedule a site measurement after the first consultation.','follow_up','team',null,'[]'::jsonb,'90000000-0000-4000-8000-000000000003')
on conflict (id) do update set title = excluded.title, body = excluded.body, note_type = excluded.note_type, updated_at = now();

insert into public.mood_boards (id, workspace_id, name, description, project_id, lead_id, mode, status, categories, images, created_by)
values
  ('97000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Mehta Residence — Warm Contemporary','Reference direction for the residence concept.','92000000-0000-4000-8000-000000000001','94000000-0000-4000-8000-000000000001','template','IN_PROGRESS','[{"id":"living","name":"Living Room","color":"#2563EB"},{"id":"materials","name":"Materials","color":"#F59E0B"}]'::jsonb,'[]'::jsonb,'90000000-0000-4000-8000-000000000001'),
  ('97000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Kohinoor Office — Modern Minimal','Office palette and furniture references.','92000000-0000-4000-8000-000000000002','94000000-0000-4000-8000-000000000002','blank','COMPLETED','[{"id":"workspace","name":"Workspace","color":"#16A34A"}]'::jsonb,'[]'::jsonb,'90000000-0000-4000-8000-000000000002')
on conflict (id) do update set name = excluded.name, description = excluded.description, status = excluded.status, categories = excluded.categories, updated_at = now();

commit;

-- Login credentials:
-- admin@boq.com / Admin@12345
-- designer@boq.com / Designer@12345
-- sales@boq.com / Sales@12345
-- manager@boq.com / Manager@12345
