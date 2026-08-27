create extension if not exists pgcrypto;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  currency varchar(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'Asia/Kolkata',
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 120),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Asia/Kolkata',
  locale text not null default 'en-IN',
  updated_at timestamptz not null default now()
);

create table public.workspace_profiles (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  logo_url text,
  website text,
  business_email text,
  phone text,
  address text,
  tax_id text,
  updated_at timestamptz not null default now()
);

create table public.onboarding_progress (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_step text not null default 'company_setup',
  completed_steps text[] not null default '{}',
  skipped_steps text[] not null default '{}',
  status text not null default 'in_progress' check (status in ('not_started', 'in_progress', 'completed')),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  target_type text,
  target_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  workspace_id uuid references public.workspaces(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  request_id text,
  created_at timestamptz not null default now()
);

create index workspace_memberships_user_status_idx on public.workspace_memberships(user_id, status);
create index workspace_memberships_workspace_status_idx on public.workspace_memberships(workspace_id, status);
create index notifications_recipient_read_idx on public.notifications(recipient_user_id, read_at, created_at desc);
create index notifications_workspace_created_idx on public.notifications(workspace_id, created_at desc);
create index audit_logs_workspace_created_idx on public.audit_logs(workspace_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger workspaces_touch before update on public.workspaces for each row execute function public.touch_updated_at();
create trigger user_profiles_touch before update on public.user_profiles for each row execute function public.touch_updated_at();
create trigger user_preferences_touch before update on public.user_preferences for each row execute function public.touch_updated_at();
create trigger workspace_profiles_touch before update on public.workspace_profiles for each row execute function public.touch_updated_at();
create trigger onboarding_progress_touch before update on public.onboarding_progress for each row execute function public.touch_updated_at();

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_memberships m
    where m.workspace_id = p_workspace_id and m.user_id = (select auth.uid()) and m.status = 'active'
  );
$$;

create or replace function public.current_workspace_role(p_workspace_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select m.role from public.workspace_memberships m
  where m.workspace_id = p_workspace_id and m.user_id = (select auth.uid()) and m.status = 'active'
  limit 1;
$$;

create or replace function public.role_permissions(p_role text)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'canCreateProject', p_role in ('owner','admin','member'),
    'canCreateBoq', p_role in ('owner','admin','member'),
    'canViewFinancials', p_role in ('owner','admin'),
    'canApprove', p_role in ('owner','admin'),
    'canExport', p_role in ('owner','admin','member')
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.workspace_profiles enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy workspaces_select_member on public.workspaces for select to authenticated using (public.is_workspace_member(id));
create policy workspaces_update_admin on public.workspaces for update to authenticated
  using (public.current_workspace_role(id) in ('owner','admin')) with check (public.current_workspace_role(id) in ('owner','admin'));
create policy memberships_select_same_workspace on public.workspace_memberships for select to authenticated using (public.is_workspace_member(workspace_id));
create policy profiles_select_self on public.user_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy profiles_update_self on public.user_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy preferences_select_self on public.user_preferences for select to authenticated using (user_id = (select auth.uid()));
create policy preferences_update_self on public.user_preferences for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy workspace_profiles_select_member on public.workspace_profiles for select to authenticated using (public.is_workspace_member(workspace_id));
create policy workspace_profiles_update_admin on public.workspace_profiles for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin')) with check (public.current_workspace_role(workspace_id) in ('owner','admin'));
create policy onboarding_select_self on public.onboarding_progress for select to authenticated using (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));
create policy onboarding_update_self on public.onboarding_progress for update to authenticated
  using (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  with check (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));
create policy notifications_select_recipient on public.notifications for select to authenticated
  using (recipient_user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));
create policy notifications_update_recipient on public.notifications for update to authenticated
  using (recipient_user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  with check (recipient_user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_workspace_id uuid;
  v_name text;
begin
  v_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''), split_part(new.email, '@', 1) || '''s Workspace');
  insert into public.workspaces(name) values (v_name) returning id into v_workspace_id;
  insert into public.workspace_memberships(workspace_id, user_id, role) values (v_workspace_id, new.id, 'owner');
  insert into public.user_profiles(user_id, display_name) values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''));
  insert into public.user_preferences(user_id) values (new.id);
  insert into public.workspace_profiles(workspace_id, business_email) values (v_workspace_id, new.email);
  insert into public.onboarding_progress(workspace_id, user_id) values (v_workspace_id, new.id);
  insert into public.audit_logs(workspace_id, actor_user_id, action) values (v_workspace_id, new.id, 'auth.registered');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.get_current_context()
returns jsonb language sql stable security definer set search_path = '' as $$
  with selected as (
    select m.workspace_id, m.role, m.status as membership_status
    from public.workspace_memberships m
    join public.workspaces w on w.id = m.workspace_id
    where m.user_id = (select auth.uid()) and m.status = 'active' and w.status = 'active'
    order by m.joined_at asc limit 1
  )
  select jsonb_build_object(
    'user', jsonb_build_object('id', u.id, 'email', u.email, 'emailVerified', u.email_confirmed_at is not null, 'status', case when u.banned_until is not null and u.banned_until > now() then 'suspended' else 'active' end),
    'profile', to_jsonb(p),
    'preferences', to_jsonb(up),
    'workspace', jsonb_build_object('id', w.id, 'name', w.name, 'status', w.status, 'currency', w.currency, 'timezone', w.timezone, 'country', w.country, 'profile', to_jsonb(wp)),
    'membership', jsonb_build_object('role', s.role, 'status', s.membership_status),
    'permissions', public.role_permissions(s.role),
    'onboarding', to_jsonb(op)
  )
  from auth.users u
  join selected s on true
  join public.workspaces w on w.id = s.workspace_id
  left join public.user_profiles p on p.user_id = u.id
  left join public.user_preferences up on up.user_id = u.id
  left join public.workspace_profiles wp on wp.workspace_id = w.id
  left join public.onboarding_progress op on op.workspace_id = w.id and op.user_id = u.id
  where u.id = (select auth.uid());
$$;

create or replace function public.write_audit(p_action text, p_request_id text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_workspace_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  select m.workspace_id into v_workspace_id from public.workspace_memberships m
  where m.user_id = v_user_id and m.status = 'active' order by m.joined_at limit 1;
  insert into public.audit_logs(workspace_id, actor_user_id, action, request_id)
  values (v_workspace_id, v_user_id, p_action, p_request_id);
end;
$$;

create or replace function public.update_onboarding(p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_workspace_id uuid;
  v_role text;
  v_company jsonb := coalesce(p_patch -> 'company', '{}'::jsonb);
  v_result jsonb;
begin
  select m.workspace_id, m.role into v_workspace_id, v_role from public.workspace_memberships m
  where m.user_id = v_user_id and m.status = 'active' order by m.joined_at limit 1;
  if v_workspace_id is null then raise exception 'workspace membership required'; end if;
  if p_patch ? 'company' and v_role not in ('owner','admin') then raise exception 'company update forbidden'; end if;

  update public.onboarding_progress set
    current_step = case when p_patch ? 'currentStep' then p_patch ->> 'currentStep' else current_step end,
    completed_steps = case when p_patch ? 'completedSteps' then array(select jsonb_array_elements_text(p_patch -> 'completedSteps')) else completed_steps end,
    skipped_steps = case when p_patch ? 'skippedSteps' then array(select jsonb_array_elements_text(p_patch -> 'skippedSteps')) else skipped_steps end,
    status = case when p_patch ->> 'currentStep' = 'complete' then 'completed' else 'in_progress' end
  where workspace_id = v_workspace_id and user_id = v_user_id;

  if p_patch ? 'company' then
    update public.workspaces set
      name = case when v_company ? 'name' then v_company ->> 'name' else name end,
      currency = case when v_company ? 'currency' then v_company ->> 'currency' else currency end,
      timezone = case when v_company ? 'timezone' then v_company ->> 'timezone' else timezone end,
      country = case when v_company ? 'country' then v_company ->> 'country' else country end
    where id = v_workspace_id;
    update public.workspace_profiles set
      logo_url = case when v_company ? 'logoUrl' then v_company ->> 'logoUrl' else logo_url end,
      website = case when v_company ? 'website' then v_company ->> 'website' else website end,
      business_email = case when v_company ? 'businessEmail' then v_company ->> 'businessEmail' else business_email end,
      phone = case when v_company ? 'phone' then v_company ->> 'phone' else phone end,
      address = case when v_company ? 'address' then v_company ->> 'address' else address end,
      tax_id = case when v_company ? 'taxId' then v_company ->> 'taxId' else tax_id end
    where workspace_id = v_workspace_id;
  end if;

  select public.get_current_context() -> 'onboarding' into v_result;
  return v_result;
end;
$$;

create or replace function public.get_dashboard_overview()
returns jsonb language sql stable security definer set search_path = '' as $$
  with selected as (
    select m.workspace_id, m.role from public.workspace_memberships m
    join public.workspaces w on w.id = m.workspace_id
    where m.user_id = (select auth.uid()) and m.status = 'active' and w.status = 'active'
    order by m.joined_at limit 1
  ), notices as (
    select coalesce(count(*) filter (where n.read_at is null), 0) as unread_count,
      coalesce(jsonb_agg(jsonb_build_object('id', n.id, 'type', n.type, 'title', n.title, 'priority', n.priority, 'targetType', n.target_type, 'targetId', n.target_id, 'readAt', n.read_at, 'createdAt', n.created_at) order by n.created_at desc) filter (where n.id is not null), '[]'::jsonb) as items
    from (
      select notification.* from public.notifications notification
      join selected s on s.workspace_id = notification.workspace_id
      where notification.recipient_user_id = (select auth.uid())
      order by notification.created_at desc limit 10
    ) n
  )
  select jsonb_build_object(
    'scope', jsonb_build_object('workspaceId', w.id, 'currency', w.currency, 'timezone', w.timezone, 'generatedAt', now()),
    'kpis', jsonb_build_object('totalProjects', 0, 'activeProjects', 0, 'draftBoqs', 0, 'pendingApprovals', 0,
      'totalEstimatedValue', case when s.role in ('owner','admin') then to_jsonb(0::numeric) else 'null'::jsonb end,
      'actualCost', case when s.role in ('owner','admin') then to_jsonb(0::numeric) else 'null'::jsonb end,
      'grossMargin', case when s.role in ('owner','admin') then to_jsonb(0::numeric) else 'null'::jsonb end),
    'organization', jsonb_build_object('id', w.id, 'name', w.name, 'status', w.status, 'country', w.country),
    'costOverview', case when s.role in ('owner','admin') then jsonb_build_object('currency', w.currency, 'series', '[]'::jsonb) else 'null'::jsonb end,
    'boqActivity', '[]'::jsonb, 'recentProjects', '[]'::jsonb, 'recentBoqs', '[]'::jsonb,
    'pendingActions', '[]'::jsonb, 'upcomingDeliverables', '[]'::jsonb,
    'notifications', jsonb_build_object('unreadCount', n.unread_count, 'items', n.items),
    'permissions', public.role_permissions(s.role),
    'unavailableSections', jsonb_build_array(
      jsonb_build_object('section', 'projects', 'reason', 'DOMAIN_DEFERRED'),
      jsonb_build_object('section', 'boqs', 'reason', 'DOMAIN_DEFERRED'),
      jsonb_build_object('section', 'costs', 'reason', 'DOMAIN_DEFERRED'),
      jsonb_build_object('section', 'approvals', 'reason', 'DOMAIN_DEFERRED')
    )
  ) from selected s join public.workspaces w on w.id = s.workspace_id cross join notices n;
$$;

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.current_workspace_role(uuid) from public;
revoke all on function public.role_permissions(text) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.current_workspace_role(uuid) to authenticated;
grant execute on function public.role_permissions(text) to authenticated;
grant execute on function public.get_current_context() to authenticated;
grant execute on function public.write_audit(text,text) to authenticated;
grant execute on function public.update_onboarding(jsonb) to authenticated;
grant execute on function public.get_dashboard_overview() to authenticated;

-- PostgREST least privilege: RPCs own company/onboarding writes; direct clients
-- can only read RLS-visible rows and update explicitly allowlisted columns.
revoke all on public.workspaces, public.workspace_memberships, public.user_profiles,
  public.user_preferences, public.workspace_profiles, public.onboarding_progress,
  public.notifications, public.audit_logs from anon, authenticated;
grant select on public.workspaces, public.workspace_memberships, public.user_profiles,
  public.user_preferences, public.workspace_profiles, public.onboarding_progress,
  public.notifications to authenticated;
grant update (display_name) on public.user_profiles to authenticated;
grant update (timezone, locale) on public.user_preferences to authenticated;
grant update (read_at) on public.notifications to authenticated;
