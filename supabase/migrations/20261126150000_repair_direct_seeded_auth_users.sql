-- Direct SQL inserts into auth.users bypass GoTrue defaults. Older seeded
-- accounts can therefore contain NULL token fields and fail password login
-- with "Database error querying schema".
do $$
declare
  v_column_name text;
begin
  foreach v_column_name in array array[
    'confirmation_token','recovery_token','email_change',
    'email_change_token_current','email_change_token_new','phone_change',
    'phone_change_token','reauthentication_token'
  ] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'auth' and table_name = 'users'
        and column_name = v_column_name
    ) then
      execute format('update auth.users set %I = coalesce(%I, '''')', v_column_name, v_column_name);
    end if;
  end loop;
end $$;

-- Keep the development admin usable after a direct seed.
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now()),
    banned_until = null,
    deleted_at = null,
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('otp_bypass', true)
where lower(email) in (
  'admin@boq.com', 'designer@boq.com', 'sales@boq.com', 'manager@boq.com',
  'demo@boq.com', 'diptishgohane04@gmail.com',
  'diptishgohane04+member@gmail.com'
);
