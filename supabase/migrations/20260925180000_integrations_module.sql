-- 1. integrations - Track which integrations are connected for each workspace
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (provider in ('meta_lead_ads','google_ads','custom_website','whatsapp','email','razorpay')),
  name text not null,
  status text not null default 'not_connected' check (status in ('not_connected','connecting','connected','paused','error')),
  config jsonb not null default '{}',
  connected_at timestamptz,
  last_synced_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, provider)
);

-- 2. integration_forms - Custom website lead capture forms  
create table public.integration_forms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  public_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  campaign_id uuid,
  campaign_name text,
  status text not null default 'active' check (status in ('active','paused','archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id, workspace_id)
);

-- 3. integration_form_fields - Form field definitions
create table public.integration_form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.integration_forms(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  field_type text not null check (field_type in ('short_answer','long_answer','dropdown','checkbox','link')),
  required boolean not null default false,
  position integer not null default 0,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. integration_leads - Captured leads
create table public.integration_leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  form_id uuid references public.integration_forms(id) on delete set null,
  campaign_id uuid,
  source_provider text not null,
  payload jsonb not null default '{}',
  status text not null default 'delivered' check (status in ('delivered','failed','pending')),
  error_message text,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_integrations_workspace_id on public.integrations(workspace_id);
create index idx_integrations_provider on public.integrations(provider);
create index idx_integration_forms_workspace_id on public.integration_forms(workspace_id);
create index idx_integration_forms_integration_id on public.integration_forms(integration_id);
create index idx_integration_forms_public_token on public.integration_forms(public_token);
create index idx_integration_form_fields_form_id on public.integration_form_fields(form_id);
create index idx_integration_leads_workspace_id on public.integration_leads(workspace_id);
create index idx_integration_leads_integration_id on public.integration_leads(integration_id);
create index idx_integration_leads_form_id on public.integration_leads(form_id);
create index idx_integration_leads_created_at on public.integration_leads(created_at);
create index idx_integration_leads_status on public.integration_leads(status);

-- Triggers for updated_at
create trigger touch_integrations_updated_at before update on public.integrations for each row execute procedure public.touch_updated_at();
create trigger touch_integration_forms_updated_at before update on public.integration_forms for each row execute procedure public.touch_updated_at();
create trigger touch_integration_form_fields_updated_at before update on public.integration_form_fields for each row execute procedure public.touch_updated_at();

-- Enable RLS
alter table public.integrations enable row level security;
alter table public.integration_forms enable row level security;
alter table public.integration_form_fields enable row level security;
alter table public.integration_leads enable row level security;

-- Policies for integrations
create policy "Users can view integrations in their workspaces" on public.integrations
  for select using (public.is_workspace_member(workspace_id));
create policy "Admins can manage integrations" on public.integrations
  for all using (
    public.is_workspace_member(workspace_id) and 
    public.current_workspace_role(workspace_id) in ('owner', 'admin')
  );

-- Policies for integration_forms
create policy "Users can view integration_forms in their workspaces" on public.integration_forms
  for select using (public.is_workspace_member(workspace_id));
create policy "Admins can manage integration_forms" on public.integration_forms
  for all using (
    public.is_workspace_member(workspace_id) and 
    public.current_workspace_role(workspace_id) in ('owner', 'admin')
  );

-- Policies for integration_form_fields
create policy "Users can view integration_form_fields in their workspaces" on public.integration_form_fields
  for select using (
    exists (
      select 1 from public.integration_forms f
      where f.id = form_id and public.is_workspace_member(f.workspace_id)
    )
  );
create policy "Admins can manage integration_form_fields" on public.integration_form_fields
  for all using (
    exists (
      select 1 from public.integration_forms f
      where f.id = form_id and public.is_workspace_member(f.workspace_id) and public.current_workspace_role(f.workspace_id) in ('owner', 'admin')
    )
  );

-- Policies for integration_leads
create policy "Users can view integration_leads in their workspaces" on public.integration_leads
  for select using (public.is_workspace_member(workspace_id));
create policy "Admins can manage integration_leads" on public.integration_leads
  for all using (
    public.is_workspace_member(workspace_id) and 
    public.current_workspace_role(workspace_id) in ('owner', 'admin')
  );

-- Grant privileges
grant select, insert, update, delete on public.integrations to authenticated;
grant select, insert, update, delete on public.integration_forms to authenticated;
grant select, insert, update, delete on public.integration_form_fields to authenticated;
grant select, insert, update, delete on public.integration_leads to authenticated;

grant select on public.integrations to anon;
grant select on public.integration_forms to anon;
grant select on public.integration_form_fields to anon;
grant select on public.integration_leads to anon;

-- Add 'canManageIntegrations' to the role permissions
-- Must match the existing function signature: get_permissions(p_role text) returns jsonb
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
    'canManageActivities', p_role in ('owner','admin','member'), 'canUseSupport', p_role in ('owner','admin','member'),
    'canManageIntegrations', p_role in ('owner','admin')
  );
$$;
create or replace function public.role_permissions(p_role text)
returns jsonb language sql immutable set search_path = '' as $$
  select public.get_permissions(p_role);
$$;
