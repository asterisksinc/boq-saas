-- User BOQ, Costing, and Reports & Analytics domains.
-- All monetary values use fixed precision and every row is workspace scoped.

create sequence if not exists public.boq_code_seq;

create table public.boqs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete restrict,
  boq_number text not null,
  version text not null default 'v1',
  assigned_to uuid,
  source_method text not null default 'blank' check (source_method in ('blank','template')),
  source_template_id uuid,
  status text not null default 'draft' check (status in ('draft','in_review','approved','archived')),
  markup_percent numeric(7,4) not null default 0 check (markup_percent between 0 and 100),
  tax_percent numeric(7,4) not null default 18 check (tax_percent between 0 and 100),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique(workspace_id, boq_number, version), unique(id, workspace_id)
);

create table public.boq_rooms (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, boq_id uuid not null,
  name text not null, description text, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (boq_id, workspace_id) references public.boqs(id, workspace_id) on delete cascade,
  unique(boq_id, name), unique(id, workspace_id)
);

create table public.boq_categories (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, boq_id uuid not null, room_id uuid not null,
  name text not null, description text, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (boq_id, workspace_id) references public.boqs(id, workspace_id) on delete cascade,
  foreign key (room_id, workspace_id) references public.boq_rooms(id, workspace_id) on delete cascade,
  unique(room_id, name), unique(id, workspace_id)
);

create table public.boq_items (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, boq_id uuid not null, room_id uuid not null, category_id uuid not null,
  name text not null, description text, unit text not null, quantity numeric(18,4) not null check (quantity > 0),
  rate numeric(18,2) not null check (rate >= 0), waste_percent numeric(7,4) not null default 0 check (waste_percent between 0 and 100),
  tax_percent numeric(7,4) not null default 18 check (tax_percent between 0 and 100), sort_order integer not null default 0,
  amount numeric(18,2) generated always as (round(quantity * rate * (1 + waste_percent / 100) * (1 + tax_percent / 100), 2)) stored,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (boq_id, workspace_id) references public.boqs(id, workspace_id) on delete cascade,
  foreign key (room_id, workspace_id) references public.boq_rooms(id, workspace_id) on delete cascade,
  foreign key (category_id, workspace_id) references public.boq_categories(id, workspace_id) on delete cascade
);

create table public.boq_templates (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, description text, tags text[] not null default '{}', snapshot jsonb not null default '[]', use_count integer not null default 0,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id, name)
);

create table public.costing_categories (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  parent_id uuid, name text not null, code text not null,
  default_unit text not null, default_tax_percent numeric(7,4) not null default 18 check (default_tax_percent between 0 and 100),
  default_markup_percent numeric(7,4) not null default 0 check (default_markup_percent between 0 and 100),
  default_waste_percent numeric(7,4) not null default 0 check (default_waste_percent between 0 and 100), transport_included boolean not null default false, labour_included boolean not null default false,
  description text, status text not null default 'active' check (status in ('draft','active','inactive')),
  created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id, code), unique(id, workspace_id)
);

alter table public.costing_categories add constraint costing_categories_parent_workspace_fk
  foreign key (parent_id, workspace_id) references public.costing_categories(id, workspace_id) on delete restrict;

alter table public.boqs add constraint boqs_template_fk
  foreign key (source_template_id) references public.boq_templates(id) on delete set null;

create table public.costing_items (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, category_id uuid not null,
  name text not null, code text not null, unit text not null, base_cost numeric(18,2) not null check (base_cost >= 0),
  selling_rate numeric(18,2) not null check (selling_rate >= 0), preferred_vendor text, spec text,
  rate_status text not null default 'draft' check (rate_status in ('draft','active','expired')), image_url text,
  created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  foreign key (category_id, workspace_id) references public.costing_categories(id, workspace_id) on delete restrict,
  unique(workspace_id, code), unique(id, workspace_id)
);

create table public.vendor_quotes (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, item_id uuid not null,
  vendor_name text not null, quote numeric(18,2) not null check (quote >= 0), lead_time_days integer not null check (lead_time_days >= 0),
  rating numeric(3,2) check (rating between 0 and 5), selected boolean not null default false,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (item_id, workspace_id) references public.costing_items(id, workspace_id) on delete cascade
);

create table public.costing_scenarios (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, boq_id uuid not null,
  name text not null, description text, scenario_type text not null default 'full_cost' check (scenario_type in ('full_cost','value_engineering','vendor_switch','custom')),
  adjustments jsonb not null default '[]', status text not null default 'active' check (status in ('draft','active','archived')),
  created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  foreign key (boq_id, workspace_id) references public.boqs(id, workspace_id) on delete cascade
);

create index boqs_workspace_updated_idx on public.boqs(workspace_id, updated_at desc) where archived_at is null;
create index boq_items_boq_idx on public.boq_items(boq_id, room_id, category_id, sort_order);
create index costing_items_workspace_idx on public.costing_items(workspace_id, updated_at desc) where archived_at is null;
create index scenarios_workspace_idx on public.costing_scenarios(workspace_id, updated_at desc) where archived_at is null;

do $$ declare t text; begin
  foreach t in array array['boqs','boq_rooms','boq_categories','boq_items','boq_templates','costing_categories','costing_items','vendor_quotes','costing_scenarios'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))', t || '_select_member', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.current_workspace_role(workspace_id) in (''owner'',''admin'',''member''))', t || '_insert_writer', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.current_workspace_role(workspace_id) in (''owner'',''admin'',''member'')) with check (public.current_workspace_role(workspace_id) in (''owner'',''admin'',''member''))', t || '_update_writer', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.current_workspace_role(workspace_id) in (''owner'',''admin''))', t || '_delete_admin', t);
    execute format('grant select,insert,update,delete on public.%I to authenticated', t);
  end loop;
end $$;

create trigger boqs_touch before update on public.boqs for each row execute function public.touch_updated_at();
create trigger boq_rooms_touch before update on public.boq_rooms for each row execute function public.touch_updated_at();
create trigger boq_categories_touch before update on public.boq_categories for each row execute function public.touch_updated_at();
create trigger boq_items_touch before update on public.boq_items for each row execute function public.touch_updated_at();
create trigger boq_templates_touch before update on public.boq_templates for each row execute function public.touch_updated_at();
create trigger costing_categories_touch before update on public.costing_categories for each row execute function public.touch_updated_at();
create trigger costing_items_touch before update on public.costing_items for each row execute function public.touch_updated_at();
create trigger vendor_quotes_touch before update on public.vendor_quotes for each row execute function public.touch_updated_at();
create trigger costing_scenarios_touch before update on public.costing_scenarios for each row execute function public.touch_updated_at();

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
    'canRecordPayment', p_role in ('owner','admin','member'), 'canDeleteInvoice', p_role in ('owner','admin')
  );
$$;
