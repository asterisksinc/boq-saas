-- Authenticated user modules: billing, settings, activities and help/support.

create table public.subscription_plans (
  code text primary key, name text not null, description text not null, monthly_price numeric(18,2), currency text not null default 'INR',
  limits jsonb not null default '{}' check (jsonb_typeof(limits)='object'), features jsonb not null default '{}' check (jsonb_typeof(features)='object'), sort_order integer not null default 0, active boolean not null default true
);
alter table public.subscription_plans enable row level security;
create policy subscription_plans_read on public.subscription_plans for select to authenticated using (active);
grant select on public.subscription_plans to authenticated;

create table public.workspace_subscriptions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  plan_code text not null references public.subscription_plans(code), status text not null default 'trial' check (status in ('trial','active','past_due','suspended','cancelled_at_period_end','cancelled')),
  billing_frequency text not null default 'monthly' check (billing_frequency in ('monthly','annual')), billing_contact text,
  seats_used integer not null default 1 check (seats_used >= 0), period_start date, period_end date, trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false, last_payment_error text, next_retry_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.workspace_payment_methods (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand text not null, last4 text not null check (last4 ~ '^[0-9]{4}$'), expiry_month integer check (expiry_month between 1 and 12), expiry_year integer,
  is_default boolean not null default true, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.subscription_invoices (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_number text not null, amount numeric(18,2) not null check (amount >= 0), tax_amount numeric(18,2) not null default 0,
  currency text not null default 'INR', status text not null check (status in ('draft','open','paid','failed','void')),
  issued_at timestamptz not null default now(), due_at timestamptz, paid_at timestamptz, unique(workspace_id, invoice_number)
);
create table public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  branding jsonb not null default '{}', boq_costing jsonb not null default '{}', integrations jsonb not null default '{}',
  notifications jsonb not null default '{}', security jsonb not null default '{}', advanced jsonb not null default '{}',
  updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now()
);

create table public.activity_stages (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, color text, sort_order integer not null default 0, terminal_type text check (terminal_type in ('completed','lost')),
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,name), unique(id,workspace_id)
);
create table public.activity_tasks (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.activity_stages(id) on delete set null, name text not null, description text, assigned_to uuid, owner_id uuid,
  due_date date, priority text not null default 'medium' check(priority in ('low','medium','high','critical')),
  status text not null default 'not_started' check(status in ('not_started','in_progress','blocked','completed','cancelled')),
  attachments jsonb not null default '[]' check(jsonb_typeof(attachments)='array'), created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(stage_id,workspace_id) references public.activity_stages(id,workspace_id)
);
create table public.activity_approvals (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.activity_stages(id) on delete set null, name text not null, description text, approver_id uuid, approver_name text,
  due_date date, status text not null default 'draft' check(status in ('draft','sent','in_review','approved','changes_required','rejected','cancelled')),
  attachments jsonb not null default '[]' check(jsonb_typeof(attachments)='array'), requested_by uuid not null references auth.users(id), requested_at timestamptz,
  decided_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(stage_id,workspace_id) references public.activity_stages(id,workspace_id)
);
create table public.activity_comments (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_type text not null check(entity_type in ('task','approval')), entity_id uuid not null, body text not null,
  attachments jsonb not null default '[]' check(jsonb_typeof(attachments)='array'), author_id uuid not null references auth.users(id), created_at timestamptz not null default now()
);

create table public.help_categories (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null, description text not null, sort_order integer not null default 0, active boolean not null default true
);
create table public.help_articles (
  id uuid primary key default gen_random_uuid(), category_id uuid not null references public.help_categories(id) on delete cascade,
  slug text not null unique, title text not null, summary text not null, content jsonb not null default '{}', read_minutes integer not null default 4,
  helpful_yes integer not null default 0, helpful_no integer not null default 0, popular boolean not null default false, updated_at timestamptz not null default now(), active boolean not null default true
);
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  ticket_number text not null, issue_type text not null, subject text not null, description text not null,
  priority text not null default 'normal' check(priority in ('low','normal','high','urgent')), status text not null default 'draft' check(status in ('draft','open','in_progress','waiting_on_user','resolved','closed')),
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,ticket_number), unique(id,workspace_id)
);
create table public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, ticket_id uuid not null,
  body text not null, attachments jsonb not null default '[]', author_id uuid not null references auth.users(id), created_at timestamptz not null default now(),
  foreign key(ticket_id,workspace_id) references public.support_tickets(id,workspace_id) on delete cascade
);

create index activity_tasks_workspace_due_idx on public.activity_tasks(workspace_id,due_date,status);
create index activity_approvals_workspace_due_idx on public.activity_approvals(workspace_id,due_date,status);
create index support_tickets_workspace_updated_idx on public.support_tickets(workspace_id,updated_at desc);

create trigger workspace_subscriptions_touch before update on public.workspace_subscriptions for each row execute function public.touch_updated_at();
create trigger workspace_payment_methods_touch before update on public.workspace_payment_methods for each row execute function public.touch_updated_at();
create trigger workspace_settings_touch before update on public.workspace_settings for each row execute function public.touch_updated_at();
create trigger activity_stages_touch before update on public.activity_stages for each row execute function public.touch_updated_at();
create trigger activity_tasks_touch before update on public.activity_tasks for each row execute function public.touch_updated_at();
create trigger activity_approvals_touch before update on public.activity_approvals for each row execute function public.touch_updated_at();
create trigger support_tickets_touch before update on public.support_tickets for each row execute function public.touch_updated_at();

do $$ declare t text; begin
  foreach t in array array['workspace_subscriptions','workspace_payment_methods','subscription_invoices','workspace_settings','activity_stages','activity_tasks','activity_approvals','activity_comments','support_tickets','support_ticket_messages'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy %I on public.%I for select to authenticated using(public.is_workspace_member(workspace_id))',t||'_select_member',t);
    execute format('create policy %I on public.%I for insert to authenticated with check(public.current_workspace_role(workspace_id) in (''owner'',''admin'',''member''))',t||'_insert_member',t);
    execute format('create policy %I on public.%I for update to authenticated using(public.current_workspace_role(workspace_id) in (''owner'',''admin'',''member'')) with check(public.current_workspace_role(workspace_id) in (''owner'',''admin'',''member''))',t||'_update_member',t);
    execute format('create policy %I on public.%I for delete to authenticated using(public.current_workspace_role(workspace_id) in (''owner'',''admin''))',t||'_delete_admin',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['workspace_subscriptions','workspace_payment_methods','subscription_invoices','workspace_settings'] loop
    execute format('drop policy %I on public.%I',t||'_insert_member',t);
    execute format('drop policy %I on public.%I',t||'_update_member',t);
    execute format('create policy %I on public.%I for insert to authenticated with check(public.current_workspace_role(workspace_id) in (''owner'',''admin''))',t||'_insert_admin',t);
    execute format('create policy %I on public.%I for update to authenticated using(public.current_workspace_role(workspace_id) in (''owner'',''admin'')) with check(public.current_workspace_role(workspace_id) in (''owner'',''admin''))',t||'_update_admin',t);
  end loop;
end $$;

drop policy workspace_payment_methods_insert_admin on public.workspace_payment_methods;
create policy workspace_payment_methods_insert_admin on public.workspace_payment_methods for insert to authenticated
  with check(public.current_workspace_role(workspace_id) in ('owner','admin') and created_by=(select auth.uid()));
drop policy workspace_settings_insert_admin on public.workspace_settings;
create policy workspace_settings_insert_admin on public.workspace_settings for insert to authenticated
  with check(public.current_workspace_role(workspace_id) in ('owner','admin') and updated_by=(select auth.uid()));
drop policy workspace_settings_update_admin on public.workspace_settings;
create policy workspace_settings_update_admin on public.workspace_settings for update to authenticated
  using(public.current_workspace_role(workspace_id) in ('owner','admin')) with check(public.current_workspace_role(workspace_id) in ('owner','admin') and updated_by=(select auth.uid()));

drop policy activity_tasks_insert_member on public.activity_tasks;
create policy activity_tasks_insert_member on public.activity_tasks for insert to authenticated
  with check(public.current_workspace_role(workspace_id) in ('owner','admin','member') and created_by=(select auth.uid()));
drop policy activity_approvals_insert_member on public.activity_approvals;
create policy activity_approvals_insert_member on public.activity_approvals for insert to authenticated
  with check(public.current_workspace_role(workspace_id) in ('owner','admin','member') and requested_by=(select auth.uid()));
drop policy activity_comments_insert_member on public.activity_comments;
create policy activity_comments_insert_member on public.activity_comments for insert to authenticated
  with check(public.current_workspace_role(workspace_id) in ('owner','admin','member') and author_id=(select auth.uid()));
drop policy support_tickets_insert_member on public.support_tickets;
create policy support_tickets_insert_member on public.support_tickets for insert to authenticated
  with check(public.current_workspace_role(workspace_id) in ('owner','admin','member') and created_by=(select auth.uid()));
drop policy support_ticket_messages_insert_member on public.support_ticket_messages;
create policy support_ticket_messages_insert_member on public.support_ticket_messages for insert to authenticated
  with check(public.current_workspace_role(workspace_id) in ('owner','admin','member') and author_id=(select auth.uid()));

alter table public.help_categories enable row level security;
alter table public.help_articles enable row level security;
create policy help_categories_read on public.help_categories for select to authenticated using(active);
create policy help_articles_read on public.help_articles for select to authenticated using(active);
grant select on public.help_categories,public.help_articles to authenticated;

-- Keep the permissions returned by auth/me and onboarding context aligned with
-- these authenticated user-facing modules.
create or replace function public.get_permissions(p_role text)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'canManageOrganization', p_role in ('owner','admin'), 'canManageMembers', p_role in ('owner','admin'),
    'canCreateProject', p_role in ('owner','admin','member'), 'canCreateBoq', p_role in ('owner','admin','member'),
    'canManageBoq', p_role in ('owner','admin','member'), 'canManageCosting', p_role in ('owner','admin','member'),
    'canViewFinancials', p_role in ('owner','admin'), 'canViewReports', p_role in ('owner','admin'),
    'canExportReports', p_role in ('owner','admin'), 'canApprove', p_role in ('owner','admin'),
    'canExport', p_role in ('owner','admin','member'), 'canCreateProposal', p_role in ('owner','admin','member'),
    'canManageDocuments', p_role in ('owner','admin','member'), 'canArchiveProposal', p_role in ('owner','admin'),
    'canDeleteDocuments', p_role in ('owner','admin'), 'canCreateInvoice', p_role in ('owner','admin','member'),
    'canRecordPayment', p_role in ('owner','admin','member'), 'canDeleteInvoice', p_role in ('owner','admin'),
    'canCreateTemplate', p_role in ('owner','admin','member'), 'canEditTemplate', p_role in ('owner','admin','member'),
    'canArchiveTemplate', p_role in ('owner','admin'), 'canUseTemplate', p_role in ('owner','admin','member'),
    'canManageBilling', p_role in ('owner','admin'), 'canManageSettings', p_role in ('owner','admin'),
    'canManageActivities', p_role in ('owner','admin','member'), 'canUseSupport', p_role in ('owner','admin','member')
  );
$$;
create or replace function public.role_permissions(p_role text)
returns jsonb language sql immutable set search_path = '' as $$
  select public.get_permissions(p_role);
$$;
revoke all on function public.get_permissions(text) from public;
grant execute on function public.get_permissions(text) to authenticated;
grant execute on function public.role_permissions(text) to authenticated;
