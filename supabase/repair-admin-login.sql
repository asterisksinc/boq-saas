-- Repair the seeded admin account in Supabase SQL Editor.
-- DEV / QA ONLY. Change the email/password before using outside local QA.

begin;

create extension if not exists pgcrypto;

-- Supabase Auth expects these token fields to be empty strings, not NULL.
-- Direct SQL inserts commonly leave them NULL and cause password login to
-- fail with: `Database error querying schema`.
do $$
declare
  v_column_name text;
begin
  foreach v_column_name in array array[
    'confirmation_token',
    'recovery_token',
    'email_change_token_current',
    'email_change_token_new',
    'phone_change_token',
    'reauthentication_token'
  ] loop
    if exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'auth' and c.table_name = 'users' and c.column_name = v_column_name
    ) then
      execute format('update auth.users set %I = coalesce(%I, '''')', v_column_name, v_column_name);
    end if;
  end loop;
end $$;

do $$
declare
  admin_id uuid;
begin
  select id into admin_id from auth.users where lower(email) = 'admin@boq.com' limit 1;
  if admin_id is null then
    admin_id := '90000000-0000-4000-8000-000000000001';
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated', 'admin@boq.com',
      crypt('Admin@12345', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"role":"admin","otp_bypass":true}'::jsonb,
      '{"display_name":"BOQ Platform Admin","company_name":"Arena Design Studio"}'::jsonb, now(), now()
    );
  else
    update auth.users set
      encrypted_password = crypt('Admin@12345', gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin","otp_bypass":true}'::jsonb,
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"display_name":"BOQ Platform Admin","company_name":"Arena Design Studio"}'::jsonb,
      banned_until = null, deleted_at = null, updated_at = now()
    where id = admin_id;
  end if;

  insert into auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  values (gen_random_uuid(), admin_id::text, admin_id, jsonb_build_object('sub', admin_id::text, 'email', 'admin@boq.com', 'email_verified', true), 'email', now(), now(), now())
  on conflict (provider_id, provider) do update set user_id = excluded.user_id, identity_data = excluded.identity_data, updated_at = now();

  insert into public.user_profiles (user_id, display_name)
  values (admin_id, 'BOQ Platform Admin')
  on conflict (user_id) do update set display_name = excluded.display_name, updated_at = now();

  insert into public.workspace_memberships (workspace_id, user_id, role, status)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', admin_id, 'owner', 'active')
  on conflict (workspace_id, user_id) do update set role = 'owner', status = 'active';
end $$;

commit;

-- Verify the account after running:
-- select id, email, email_confirmed_at, deleted_at from auth.users where email = 'admin@boq.com';
