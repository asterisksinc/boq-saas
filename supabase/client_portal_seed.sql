-- Client portal demo fixtures. Run after `supabase db reset` or after all migrations.
-- DEV / TEST ONLY. Passwords below are intentionally non-production.

begin;

insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
('00000000-0000-0000-0000-000000000000','66666666-6666-4666-8666-666666666666','authenticated','authenticated','client.arjun@example.test',now(),crypt('Client#2026A!',gen_salt('bf')),'{"provider":"email","providers":["email"],"role":"client"}'::jsonb,'{"role":"client","display_name":"Arjun Mehta","company_name":"Riverside Developments"}'::jsonb,now(),now()),
('00000000-0000-0000-0000-000000000000','77777777-7777-4777-8777-777777777777','authenticated','authenticated','client.priya@example.test',now(),crypt('Client#2026B!',gen_salt('bf')),'{"provider":"email","providers":["email"],"role":"client"}'::jsonb,'{"role":"client","display_name":"Priya Shah","company_name":"Kohinoor Group"}'::jsonb,now(),now()),
('00000000-0000-0000-0000-000000000000','88888888-8888-4888-8888-888888888888','authenticated','authenticated','client.rohan@example.test',now(),crypt('Client#2026C!',gen_salt('bf')),'{"provider":"email","providers":["email"],"role":"client"}'::jsonb,'{"role":"client","display_name":"Rohan Kulkarni","company_name":"Sharma Family"}'::jsonb,now(),now())
on conflict (id) do update set
  email = excluded.email, email_confirmed_at = excluded.email_confirmed_at,
  encrypted_password = excluded.encrypted_password,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data, updated_at = now();

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
('66666666-6666-4666-8666-666666666666','66666666-6666-4666-8666-666666666666','66666666-6666-4666-8666-666666666666','{"sub":"66666666-6666-4666-8666-666666666666","email":"client.arjun@example.test","email_verified":true}'::jsonb,'email',now(),now(),now()),
('77777777-7777-4777-8777-777777777777','77777777-7777-4777-8777-777777777777','77777777-7777-4777-8777-777777777777','{"sub":"77777777-7777-4777-8777-777777777777","email":"client.priya@example.test","email_verified":true}'::jsonb,'email',now(),now(),now()),
('88888888-8888-4888-8888-888888888888','88888888-8888-4888-8888-888888888888','88888888-8888-4888-8888-888888888888','{"sub":"88888888-8888-4888-8888-888888888888","email":"client.rohan@example.test","email_verified":true}'::jsonb,'email',now(),now(),now())
on conflict (provider_id, provider) do update set user_id = excluded.user_id, identity_data = excluded.identity_data, updated_at = now();

insert into public.user_profiles (user_id, display_name)
values
('66666666-6666-4666-8666-666666666666','Arjun Mehta'),
('77777777-7777-4777-8777-777777777777','Priya Shah'),
('88888888-8888-4888-8888-888888888888','Rohan Kulkarni')
on conflict (user_id) do update set display_name = excluded.display_name;

insert into public.workspaces (id, name, status, currency, timezone, country)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Client Demo Workspace','active','INR','Asia/Kolkata','India')
on conflict (id) do update set name = excluded.name, status = excluded.status, currency = excluded.currency;

-- The client fixtures may be run independently of the larger demo seed.
-- Create the referenced projects first so invitation/project foreign keys exist.
insert into public.projects (
  id, project_code, workspace_id, name, client_name, client_contact, client_email,
  project_type, status, location, description, area_sqft, project_value,
  approved_budget, start_date, target_completion_date, tags, progress, created_by
)
values
('70000000-0000-4000-8000-000000000001','PRJ-CLIENT-001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Riverside Office Renovation','Arjun Mehta','+91 98765 10001','client.arjun@example.test','Commercial','in_progress','Bandra West, Mumbai','Client portal demo project for BOQ, proposals, invoices and documents.',3200,4800000,4250000,'2026-06-12','2026-12-15',array['Client Demo','Commercial'],68,'66666666-6666-4666-8666-666666666666'),
('70000000-0000-4000-8000-000000000002','PRJ-CLIENT-002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Kohinoor Office Fit-Out','Priya Shah','+91 98765 10002','client.priya@example.test','Commercial','active','BKC, Mumbai','Client portal demo project for proposal and invoice review.',12400,12500000,11000000,'2026-07-01','2026-11-30',array['Client Demo','Office'],42,'77777777-7777-4777-8777-777777777777'),
('70000000-0000-4000-8000-000000000003','PRJ-CLIENT-003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Lakeview Villa Renovation','Rohan Kulkarni','+91 98765 10003','client.rohan@example.test','Residential','on_hold','Lavasa, Maharashtra','Client portal demo project for document and approval flows.',5100,7500000,6800000,'2026-05-20','2026-10-20',array['Client Demo','Villa'],35,'88888888-8888-4888-8888-888888888888')
on conflict (id) do update set
  project_code = excluded.project_code,
  name = excluded.name,
  client_name = excluded.client_name,
  client_contact = excluded.client_contact,
  client_email = excluded.client_email,
  project_type = excluded.project_type,
  status = excluded.status,
  location = excluded.location,
  description = excluded.description,
  area_sqft = excluded.area_sqft,
  project_value = excluded.project_value,
  approved_budget = excluded.approved_budget,
  start_date = excluded.start_date,
  target_completion_date = excluded.target_completion_date,
  tags = excluded.tags,
  progress = excluded.progress;

insert into public.project_client_invitations
  (id, workspace_id, project_id, email, client_name, role, status, token, message, invited_by, expires_at, accepted_at)
values
('91000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','70000000-0000-4000-8000-000000000001','client.arjun@example.test','Arjun Mehta','client','accepted','demo-client-arjun-2026','Demo client access',null,now()+interval '365 days',now()),
('91000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','70000000-0000-4000-8000-000000000002','client.priya@example.test','Priya Shah','client','accepted','demo-client-priya-2026','Demo client access',null,now()+interval '365 days',now()),
('91000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','70000000-0000-4000-8000-000000000003','client.rohan@example.test','Rohan Kulkarni','client','accepted','demo-client-rohan-2026','Demo client access',null,now()+interval '365 days',now())
on conflict (id) do update set status='accepted', expires_at=excluded.expires_at, accepted_at=excluded.accepted_at;

insert into public.client_project_access (workspace_id, project_id, user_id, access_status, granted_by)
values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','70000000-0000-4000-8000-000000000001','66666666-6666-4666-8666-666666666666','active',null),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','70000000-0000-4000-8000-000000000002','77777777-7777-4777-8777-777777777777','active',null),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','70000000-0000-4000-8000-000000000003','88888888-8888-4888-8888-888888888888','active',null)
on conflict (project_id, user_id) do update set access_status='active', revoked_at=null;

-- Compatibility fallback for databases where the onboarding migration was not
-- applied yet. The canonical schema remains in the client onboarding migration.
create table if not exists public.client_onboarding (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_email text not null,
  current_step text not null default 'welcome' check (current_step in ('welcome','documents','dashboard')),
  completed_steps text[] not null default '{}',
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

insert into public.client_onboarding (workspace_id, project_id, user_id, client_email, current_step, completed_steps, status)
values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','70000000-0000-4000-8000-000000000001','66666666-6666-4666-8666-666666666666','client.arjun@example.test','dashboard',array['welcome','documents'],'completed'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','70000000-0000-4000-8000-000000000002','77777777-7777-4777-8777-777777777777','client.priya@example.test','dashboard',array['welcome','documents'],'completed'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','70000000-0000-4000-8000-000000000003','88888888-8888-4888-8888-888888888888','client.rohan@example.test','welcome',array[]::text[],'in_progress')
on conflict (project_id, user_id) do update set current_step=excluded.current_step, completed_steps=excluded.completed_steps, status=excluded.status;

commit;
