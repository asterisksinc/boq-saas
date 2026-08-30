-- BOQ Design Arena — Phase 1 development seed
--
-- DEV / TEST ONLY. Never apply this file to production.
-- Supabase runs this file after migrations during `supabase db reset`.
--
-- Most auth.users rows below are deterministic placeholder identities so public
-- tables can be seeded with realistic ownership and tenant relationships. The
-- diptishgohane04@gmail.com fixture also receives an auth.identities row and is
-- intended for email-OTP login testing; no seed password is stored.

begin;

-- ---------------------------------------------------------------------------
-- 1. Placeholder Auth users
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'fixture-owner-a@seed.invalid',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Aarav Owner","company_name":"Arena Design Studio"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'fixture-member-a@seed.invalid',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Meera Member","company_name":"Temporary Member Workspace"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'fixture-viewer-a@seed.invalid',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Vihaan Viewer","company_name":"Temporary Viewer Workspace"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-8444-444444444444',
    'authenticated',
    'authenticated',
    'fixture-owner-b@seed.invalid',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Isha Owner","company_name":"Second Tenant Studio"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-4555-8555-555555555555',
    'authenticated',
    'authenticated',
    'diptishgohane04@gmail.com',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Diptish Gohane","company_name":"Arena Design Studio"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do update
set
  instance_id = excluded.instance_id,
  aud = excluded.aud,
  role = excluded.role,
  email = excluded.email,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data;

-- A proper email identity lets GoTrue locate this confirmed user when
-- signInWithOtp is called with shouldCreateUser=false.
insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '55555555-5555-4555-8555-555555555555',
  '55555555-5555-4555-8555-555555555555',
  '55555555-5555-4555-8555-555555555555',
  '{"sub":"55555555-5555-4555-8555-555555555555","email":"diptishgohane04@gmail.com","email_verified":true}'::jsonb,
  'email',
  now(),
  now(),
  now()
)
on conflict (provider_id, provider) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = excluded.updated_at;

-- The signup trigger creates a temporary default workspace for every newly
-- inserted user. The deterministic workspaces below make repeated seeds stable.

insert into public.workspaces (id, name, status, currency, timezone, country)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Arena Design Studio',
    'active',
    'INR',
    'Asia/Kolkata',
    'India'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Second Tenant Studio',
    'active',
    'USD',
    'America/New_York',
    'United States'
  )
on conflict (id) do update
set
  name = excluded.name,
  status = excluded.status,
  currency = excluded.currency,
  timezone = excluded.timezone,
  country = excluded.country;

-- ---------------------------------------------------------------------------
-- 2. Memberships and tenant-isolation fixtures
-- ---------------------------------------------------------------------------

insert into public.workspace_memberships (id, workspace_id, user_id, role, status, joined_at)
values
  (
    'a1111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'owner',
    'active',
    now() - interval '90 days'
  ),
  (
    'a2222222-2222-4222-8222-222222222222',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'member',
    'active',
    now() - interval '60 days'
  ),
  (
    'a3333333-3333-4333-8333-333333333333',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '33333333-3333-4333-8333-333333333333',
    'viewer',
    'active',
    now() - interval '30 days'
  ),
  (
    'b4444444-4444-4444-8444-444444444444',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '44444444-4444-4444-8444-444444444444',
    'owner',
    'active',
    now() - interval '45 days'
  ),
  (
    'a5555555-5555-4555-8555-555555555555',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '55555555-5555-4555-8555-555555555555',
    'owner',
    'active',
    now()
  )
on conflict (workspace_id, user_id) do update
set
  role = excluded.role,
  status = excluded.status,
  joined_at = excluded.joined_at;

-- Remove only auto-created workspaces belonging to these fixtures. The two
-- deterministic workspaces and every non-seed workspace remain untouched.
delete from public.workspaces workspace
where workspace.id not in (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
)
and exists (
  select 1
  from public.workspace_memberships membership
  where membership.workspace_id = workspace.id
    and membership.user_id in (
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444',
      '55555555-5555-4555-8555-555555555555'
    )
);

-- ---------------------------------------------------------------------------
-- 3. User profiles and preferences
-- ---------------------------------------------------------------------------

insert into public.user_profiles (user_id, display_name, avatar_url)
values
  ('11111111-1111-4111-8111-111111111111', 'Aarav Owner', null),
  ('22222222-2222-4222-8222-222222222222', 'Meera Member', null),
  ('33333333-3333-4333-8333-333333333333', 'Vihaan Viewer', null),
  ('44444444-4444-4444-8444-444444444444', 'Isha Owner', null),
  ('55555555-5555-4555-8555-555555555555', 'Diptish Gohane', null)
on conflict (user_id) do update
set
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url;

insert into public.user_preferences (user_id, timezone, locale)
values
  ('11111111-1111-4111-8111-111111111111', 'Asia/Kolkata', 'en-IN'),
  ('22222222-2222-4222-8222-222222222222', 'Asia/Kolkata', 'en-IN'),
  ('33333333-3333-4333-8333-333333333333', 'Asia/Kolkata', 'en-IN'),
  ('44444444-4444-4444-8444-444444444444', 'America/New_York', 'en-US'),
  ('55555555-5555-4555-8555-555555555555', 'Asia/Kolkata', 'en-IN')
on conflict (user_id) do update
set
  timezone = excluded.timezone,
  locale = excluded.locale;

-- ---------------------------------------------------------------------------
-- 4. Workspace company profiles
-- ---------------------------------------------------------------------------

insert into public.workspace_profiles (
  workspace_id,
  logo_url,
  website,
  business_email,
  phone,
  address,
  tax_id
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    null,
    'https://arena-design.example',
    'hello@arena-design.example',
    '+91 712 555 0100',
    'Civil Lines, Nagpur, Maharashtra',
    '27AAAAA0000A1Z5'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    null,
    'https://second-tenant.example',
    'hello@second-tenant.example',
    '+1 212 555 0100',
    'New York, NY',
    'US-SEED-TAX-01'
  )
on conflict (workspace_id) do update
set
  logo_url = excluded.logo_url,
  website = excluded.website,
  business_email = excluded.business_email,
  phone = excluded.phone,
  address = excluded.address,
  tax_id = excluded.tax_id;

-- ---------------------------------------------------------------------------
-- 5. Resumable onboarding states
-- ---------------------------------------------------------------------------

insert into public.onboarding_progress (
  workspace_id,
  user_id,
  current_step,
  completed_steps,
  skipped_steps,
  status
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'complete',
    array['account_created', 'company_setup'],
    array['project_setup', 'boq_setup'],
    'completed'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'workspace_tour',
    array['account_created'],
    array[]::text[],
    'in_progress'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '33333333-3333-4333-8333-333333333333',
    'workspace_tour',
    array['account_created'],
    array['company_setup'],
    'in_progress'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '44444444-4444-4444-8444-444444444444',
    'company_setup',
    array['account_created'],
    array[]::text[],
    'in_progress'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '55555555-5555-4555-8555-555555555555',
    'company_setup',
    array['account_created'],
    array[]::text[],
    'in_progress'
  )
on conflict (workspace_id, user_id) do update
set
  current_step = excluded.current_step,
  completed_steps = excluded.completed_steps,
  skipped_steps = excluded.skipped_steps,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- 6. Notification fixtures
-- ---------------------------------------------------------------------------

insert into public.notifications (
  id,
  workspace_id,
  recipient_user_id,
  type,
  title,
  priority,
  target_type,
  target_id,
  read_at,
  created_at
)
values
  (
    '90000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'workspace_ready',
    'Your Arena Design Studio workspace is ready',
    'normal',
    'workspace',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    null,
    now() - interval '10 minutes'
  ),
  (
    '90000000-0000-4000-8000-000000000002',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'onboarding_complete',
    'Company setup completed',
    'low',
    'workspace',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    now() - interval '1 day',
    now() - interval '2 days'
  ),
  (
    '90000000-0000-4000-8000-000000000003',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'welcome',
    'Welcome to Arena Design Studio',
    'normal',
    'workspace',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    null,
    now() - interval '30 minutes'
  ),
  (
    '90000000-0000-4000-8000-000000000004',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '33333333-3333-4333-8333-333333333333',
    'access_notice',
    'Your workspace access is view only',
    'high',
    'workspace',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    null,
    now() - interval '20 minutes'
  ),
  (
    '90000000-0000-4000-8000-000000000005',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '44444444-4444-4444-8444-444444444444',
    'company_setup_pending',
    'Complete your company setup',
    'urgent',
    'workspace',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    null,
    now() - interval '5 minutes'
  )
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  recipient_user_id = excluded.recipient_user_id,
  type = excluded.type,
  title = excluded.title,
  priority = excluded.priority,
  target_type = excluded.target_type,
  target_id = excluded.target_id,
  read_at = excluded.read_at;

-- ---------------------------------------------------------------------------
-- 7. Idempotent audit fixtures
-- ---------------------------------------------------------------------------

insert into public.audit_logs (
  workspace_id,
  actor_user_id,
  action,
  entity_type,
  entity_id,
  metadata,
  request_id,
  created_at
)
select
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  'seed.workspace.ready',
  'workspace',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '{"source":"supabase/seed.sql"}'::jsonb,
  'seed:phase1:workspace-a',
  now() - interval '2 days'
where not exists (
  select 1 from public.audit_logs where request_id = 'seed:phase1:workspace-a'
);

insert into public.audit_logs (
  workspace_id,
  actor_user_id,
  action,
  entity_type,
  entity_id,
  metadata,
  request_id,
  created_at
)
select
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '44444444-4444-4444-8444-444444444444',
  'seed.workspace.ready',
  'workspace',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '{"source":"supabase/seed.sql"}'::jsonb,
  'seed:phase1:workspace-b',
  now() - interval '1 day'
where not exists (
  select 1 from public.audit_logs where request_id = 'seed:phase1:workspace-b'
);

commit;

-- Seed summary:
--   Workspace A: owners (including diptishgohane04@gmail.com) + member + viewer,
--                INR / Asia-Kolkata
--   Workspace B: separate owner, USD / America-New_York
--   OTP login fixture: diptishgohane04@gmail.com (confirmed email identity)
--   Notifications: unread/read, multiple priorities, both tenants
--   Onboarding: completed and resumable examples
--   Projects/BOQs/Costs/Approvals: not seeded because those tables are deferred
