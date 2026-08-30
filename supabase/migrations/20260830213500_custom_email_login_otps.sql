create table public.email_login_otps (
  email text primary key check (email = lower(trim(email))),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts smallint not null default 0 check (attempts between 0 and 5),
  last_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.email_login_otps enable row level security;
revoke all on public.email_login_otps from anon, authenticated;
grant all on public.email_login_otps to service_role;

create or replace function public.find_auth_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.find_auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.find_auth_user_id_by_email(text) to service_role;
