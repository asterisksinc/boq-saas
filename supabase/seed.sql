-- BOQ Design Arena — Phase 1 development seed
--
-- DEV / TEST ONLY. Never apply this file to production.
-- Supabase runs this file after migrations during `supabase db reset`.
--
-- Most auth.users rows below are deterministic placeholder identities so public
-- tables can be seeded with realistic ownership and tenant relationships. The
-- diptishgohane04@gmail.com fixture also receives an auth.identities row and is
-- intended for full login/API testing. Its DEV-ONLY password is documented at
-- the bottom of this file; the existing backend still requires the emailed OTP.

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
    'diptishgohane04+member@gmail.com',
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

-- DEV / TEST ONLY known passwords. Supabase Auth uses these bcrypt hashes,
-- while the application keeps its normal password + OTP login flow unchanged.
update auth.users
set encrypted_password = case id
      when '22222222-2222-4222-8222-222222222222'::uuid then crypt('BoqUser#2026!', gen_salt('bf'))
      when '55555555-5555-4555-8555-555555555555'::uuid then crypt('BoqDemo#2026!', gen_salt('bf'))
    end,
    updated_at = now()
where id in (
  '22222222-2222-4222-8222-222222222222',
  '55555555-5555-4555-8555-555555555555'
);

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
values
(
  '55555555-5555-4555-8555-555555555555',
  '55555555-5555-4555-8555-555555555555',
  '55555555-5555-4555-8555-555555555555',
  '{"sub":"55555555-5555-4555-8555-555555555555","email":"diptishgohane04@gmail.com","email_verified":true}'::jsonb,
  'email', now(), now(), now()
),
(
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-222222222222',
  '{"sub":"22222222-2222-4222-8222-222222222222","email":"diptishgohane04+member@gmail.com","email_verified":true}'::jsonb,
  'email', now(), now(), now()
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
-- 6. Full demo-owner business data
-- ---------------------------------------------------------------------------

insert into public.projects (
  id, project_code, workspace_id, name, client_name, client_contact,
  client_email, project_type, status, location, description, area_sqft,
  project_value, approved_budget, start_date, target_completion_date,
  assigned_designer_id, tags, progress, created_by, created_at, updated_at
)
values
  ('70000000-0000-4000-8000-000000000001', 'PRJ-DEMO-001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Oberoi Residence — Bandra West', 'Nikhil Oberoi', '+91 98765 43210', 'nikhil.oberoi@example.com', 'Residential', 'in_progress', 'Block C, Linking Road, Bandra West, Mumbai 400050', '4-bedroom luxury residential interior with turnkey FF&E scope.', 3200, 4800000, 4250000, '2026-06-12', '2026-09-12', '22222222-2222-4222-8222-222222222222', array['Luxury','Turnkey'], 68, '55555555-5555-4555-8555-555555555555', now() - interval '80 days', now() - interval '2 hours'),
  ('70000000-0000-4000-8000-000000000002', 'PRJ-DEMO-002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Kohinoor Office — Level 4', 'Kohinoor Group', '+91 98200 11111', 'facilities@kohinoor.example', 'Commercial', 'active', 'BKC, Mumbai', 'Corporate office fit-out and workplace furniture.', 12400, 12500000, 11000000, '2026-07-01', '2026-11-30', '22222222-2222-4222-8222-222222222222', array['Commercial','Office'], 42, '55555555-5555-4555-8555-555555555555', now() - interval '62 days', now() - interval '1 day'),
  ('70000000-0000-4000-8000-000000000003', 'PRJ-DEMO-003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'The Lakeview Villa — Lavasa', 'Sharma Family', '+91 98100 22222', 'sharma.family@example.com', 'Residential', 'on_hold', 'Lavasa, Maharashtra', 'Holiday villa renovation and interiors.', 5100, 7500000, 6800000, '2026-05-20', '2026-10-20', '22222222-2222-4222-8222-222222222222', array['Villa','Renovation'], 35, '55555555-5555-4555-8555-555555555555', now() - interval '100 days', now() - interval '5 days'),
  ('70000000-0000-4000-8000-000000000004', 'PRJ-DEMO-004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Nexus Retail Fit-Out — Pune', 'Nexus Malls Pvt. Ltd.', '+91 97600 33333', 'projects@nexus.example', 'Retail', 'completed', 'Pune, Maharashtra', 'Retail shell fit-out completed for handover.', 6800, 9200000, 8700000, '2026-02-01', '2026-07-15', '22222222-2222-4222-8222-222222222222', array['Retail','Fit-out'], 100, '55555555-5555-4555-8555-555555555555', now() - interval '180 days', now() - interval '15 days'),
  ('70000000-0000-4000-8000-000000000005', 'PRJ-DEMO-005', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Studio 47 — Interior Redo', 'Ananya Bose', '+91 99000 44444', 'ananya.bose@example.com', 'Studio', 'planning', 'Indiranagar, Bengaluru', 'Compact studio redesign and storage optimization.', 850, 1200000, 980000, '2026-09-15', '2026-11-30', '22222222-2222-4222-8222-222222222222', array['Studio','Compact'], 10, '55555555-5555-4555-8555-555555555555', now() - interval '12 days', now() - interval '6 hours')
on conflict (id) do update set
  project_code = excluded.project_code, workspace_id = excluded.workspace_id,
  name = excluded.name, client_name = excluded.client_name,
  client_contact = excluded.client_contact, client_email = excluded.client_email,
  project_type = excluded.project_type, status = excluded.status,
  location = excluded.location, description = excluded.description,
  area_sqft = excluded.area_sqft, project_value = excluded.project_value,
  approved_budget = excluded.approved_budget, start_date = excluded.start_date,
  target_completion_date = excluded.target_completion_date,
  assigned_designer_id = excluded.assigned_designer_id, tags = excluded.tags,
  progress = excluded.progress, created_by = excluded.created_by,
  updated_at = excluded.updated_at;

insert into public.project_rooms (
  id, workspace_id, project_id, name, room_type, length, width, height,
  unit, notes, sort_order, created_by
)
values
  ('72000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '70000000-0000-4000-8000-000000000001', 'Master Bedroom', 'Master Bedroom', 12, 14, 10, 'ft', 'Wardrobe and bed-back requirements configured.', 1, '55555555-5555-4555-8555-555555555555'),
  ('72000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '70000000-0000-4000-8000-000000000001', 'Bedroom 02', 'Bedroom', 11, 12, 10, 'ft', 'Guest bedroom.', 2, '55555555-5555-4555-8555-555555555555'),
  ('72000000-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '70000000-0000-4000-8000-000000000001', 'Living Room', 'Living Room', 18, 22, 10, 'ft', 'Main family and entertaining area.', 3, '55555555-5555-4555-8555-555555555555'),
  ('72000000-0000-4000-8000-000000000004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '70000000-0000-4000-8000-000000000001', 'Dining Room', 'Dining Room', 12, 14, 10, 'ft', null, 4, '55555555-5555-4555-8555-555555555555'),
  ('72000000-0000-4000-8000-000000000005', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '70000000-0000-4000-8000-000000000001', 'Kitchen', 'Kitchen', 10, 14, 10, 'ft', 'Modular kitchen scope.', 5, '55555555-5555-4555-8555-555555555555')
on conflict (id) do update set
  name = excluded.name, room_type = excluded.room_type, length = excluded.length,
  width = excluded.width, height = excluded.height, unit = excluded.unit,
  notes = excluded.notes, sort_order = excluded.sort_order;

insert into public.boq_imports (
  id, workspace_id, project_id, file_name, file_type, row_count,
  columns, rows, created_by, created_at
)
values (
  '73000000-0000-4000-8000-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '70000000-0000-4000-8000-000000000001',
  'Oberoi Residence BOQ v3.xlsx', 'xlsx', 4,
  '["Room","Category","Description","Quantity","Unit","Rate","Amount"]'::jsonb,
  '[["Master Bedroom","Furniture","Wardrobe",1,"nos",850000,850000],["Master Bedroom","Furniture","Bed Back Panel",1,"nos",240000,240000],["Living Room","Furniture","TV Unit",1,"nos",320000,320000],["Kitchen","Modular Kitchen","Base and wall cabinets",1,"lot",1150000,1150000]]'::jsonb,
  '55555555-5555-4555-8555-555555555555', now() - interval '3 days'
)
on conflict (id) do update set
  project_id = excluded.project_id, file_name = excluded.file_name,
  row_count = excluded.row_count, columns = excluded.columns, rows = excluded.rows;

insert into public.project_imports (
  id, workspace_id, file_name, file_type, total_rows, imported_rows,
  skipped_rows, status, errors, created_by, created_at
)
values (
  '74000000-0000-4000-8000-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'demo-project-import.xlsx', 'xlsx', 5, 5, 0, 'completed', '[]'::jsonb,
  '55555555-5555-4555-8555-555555555555', now() - interval '12 days'
)
on conflict (id) do update set
  total_rows = excluded.total_rows, imported_rows = excluded.imported_rows,
  skipped_rows = excluded.skipped_rows, status = excluded.status,
  errors = excluded.errors;

insert into public.proposals (
  id, workspace_id, project_id, project_name, client_name, source_type,
  source_id, source_label, proposed_value, currency, expiry_date,
  internal_notes, scope_items, status, view_count, sent_at,
  created_by, updated_by, created_at, updated_at
)
values
  ('75000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '70000000-0000-4000-8000-000000000001', 'Oberoi Residence — Bandra West', 'Nikhil Oberoi', 'boq', '73000000-0000-4000-8000-000000000001', 'Oberoi Residence BOQ v3.xlsx', 3950000, 'INR', '2026-09-30', 'Includes approved BOQ scope and project management.', array['Design and detailing','Furniture and joinery','Site coordination'], 'approved', 4, now() - interval '20 days', '55555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', now() - interval '25 days', now() - interval '2 days'),
  ('75000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '70000000-0000-4000-8000-000000000002', 'Kohinoor Office — Level 4', 'Kohinoor Group', 'scratch', null, null, 11200000, 'INR', '2026-09-20', 'Commercial proposal awaiting final client feedback.', array['Workplace design','Civil and MEP coordination','Furniture supply'], 'sent', 2, now() - interval '4 days', '55555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', now() - interval '8 days', now() - interval '1 day')
on conflict (id) do update set
  project_id = excluded.project_id, project_name = excluded.project_name,
  client_name = excluded.client_name, proposed_value = excluded.proposed_value,
  expiry_date = excluded.expiry_date, internal_notes = excluded.internal_notes,
  scope_items = excluded.scope_items, status = excluded.status,
  view_count = excluded.view_count, sent_at = excluded.sent_at,
  updated_by = excluded.updated_by, updated_at = excluded.updated_at;

insert into public.invoices (
  id, manual_number, workspace_id, document_type, client_name,
  billing_address, project_id, project_name, issue_date, due_date,
  milestone, reference, additional_notes, bank_details, tax_rate,
  subtotal, tax_amount, total_amount, total_paid, currency, status,
  sent_at, created_by, updated_by, created_at, updated_at
)
values (
  '76000000-0000-4000-8000-000000000001', 'INV-DEMO-001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'invoice', 'Nikhil Oberoi',
  '{"line1":"Block C, Linking Road","line2":"Bandra West","city":"Mumbai","state":"Maharashtra","pincode":"400050"}'::jsonb,
  '70000000-0000-4000-8000-000000000001', 'Oberoi Residence — Bandra West',
  '2026-08-24', '2026-09-10', 'Milestone 2 — BOQ Approval', 'PO-DEMO-001',
  'Demo invoice with a partial payment.',
  '{"bankName":"Demo Bank","accountHolder":"Arena Design Studio","accountNumber":"0000000001","ifscCode":"DEMO0000001","branch":"Mumbai"}'::jsonb,
  18, 260000, 46800, 306800, 100000, 'INR', 'partial', now() - interval '8 days',
  '55555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555',
  now() - interval '9 days', now() - interval '1 day'
)
on conflict (id) do update set
  manual_number = excluded.manual_number, client_name = excluded.client_name,
  billing_address = excluded.billing_address, project_id = excluded.project_id,
  project_name = excluded.project_name, issue_date = excluded.issue_date,
  due_date = excluded.due_date, milestone = excluded.milestone,
  subtotal = excluded.subtotal, tax_amount = excluded.tax_amount,
  total_amount = excluded.total_amount, total_paid = excluded.total_paid,
  status = excluded.status, updated_at = excluded.updated_at;

insert into public.invoice_items (
  id, invoice_id, workspace_id, position, description, quantity, rate
)
values
  ('77000000-0000-4000-8000-000000000001', '76000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1, 'Interior Design Services — Stage 2', 1, 220000),
  ('77000000-0000-4000-8000-000000000002', '76000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 2, 'Project Management', 1, 40000)
on conflict (id) do update set
  position = excluded.position, description = excluded.description,
  quantity = excluded.quantity, rate = excluded.rate;

insert into public.invoice_payments (
  id, invoice_id, workspace_id, amount, paid_at, method,
  reference, notes, recorded_by, created_at
)
values (
  '78000000-0000-4000-8000-000000000001',
  '76000000-0000-4000-8000-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 100000,
  now() - interval '2 days', 'bank_transfer', 'UTR-DEMO-10001',
  'Seeded partial payment', '55555555-5555-4555-8555-555555555555',
  now() - interval '2 days'
)
on conflict (id) do update set
  amount = excluded.amount, paid_at = excluded.paid_at,
  method = excluded.method, reference = excluded.reference,
  notes = excluded.notes;

-- ---------------------------------------------------------------------------
-- 7. Notification fixtures
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
  ),
  (
    '90000000-0000-4000-8000-000000000006',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '55555555-5555-4555-8555-555555555555',
    'project_action',
    'Oberoi Residence has pending BOQ approval and payment actions',
    'high',
    'project',
    '70000000-0000-4000-8000-000000000001',
    null,
    now() - interval '15 minutes'
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
-- 8. Idempotent audit fixtures
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
--   DEV demo owner email:    diptishgohane04@gmail.com
--   DEV demo owner password: BoqDemo#2026!
--   DEV demo user email:     diptishgohane04+member@gmail.com
--   DEV demo user password:  BoqUser#2026!
--   DEV demo user role:      member
--   Login: submit email/password, then submit the 6-digit OTP sent by Gmail
--   Notifications: unread/read, multiple priorities, both tenants
--   Onboarding: completed and resumable examples
--   Business data: 5 projects, rooms, Project/BOQ imports, proposals,
--                  one partially paid invoice, items, and payment history
--
-- Local apply command: supabase db reset
-- Hosted DEV: apply every migration first, then run this whole seed in SQL Editor.
-- Never install known demo credentials in production.
