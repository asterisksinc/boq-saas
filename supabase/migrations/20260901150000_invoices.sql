-- Internal User invoice management. Auth personas are intentionally unchanged.
-- client_id/project_id are soft references until their domain tables ship;
-- snapshots preserve the commercial document as issued.

create or replace function public.role_permissions(p_role text)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'canCreateProject', p_role in ('owner','admin','member'),
    'canCreateBoq', p_role in ('owner','admin','member'),
    'canViewFinancials', p_role in ('owner','admin'),
    'canApprove', p_role in ('owner','admin'),
    'canExport', p_role in ('owner','admin','member'),
    'canCreateProposal', p_role in ('owner','admin','member'),
    'canManageDocuments', p_role in ('owner','admin','member'),
    'canArchiveProposal', p_role in ('owner','admin'),
    'canDeleteDocuments', p_role in ('owner','admin'),
    'canCreateInvoice', p_role in ('owner','admin','member'),
    'canRecordPayment', p_role in ('owner','admin','member'),
    'canDeleteInvoice', p_role in ('owner','admin')
  );
$$;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_sequence bigint generated always as identity,
  invoice_code text generated always as (
    case document_type when 'invoice' then 'INV-' when 'pro_forma' then 'PF-' else 'QT-' end
    || lpad(invoice_sequence::text, 4, '0')
  ) stored,
  manual_number text,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_type text not null check (document_type in ('invoice','pro_forma','quote')),
  client_id uuid,
  client_name text not null check (char_length(client_name) between 1 and 200),
  billing_address jsonb not null,
  project_id uuid,
  project_name text not null check (char_length(project_name) between 1 and 200),
  issue_date date not null,
  due_date date not null check (due_date >= issue_date),
  milestone text not null check (char_length(milestone) between 1 and 200),
  reference text,
  additional_notes text,
  bank_details jsonb,
  tax_rate numeric(7,4) not null default 18 check (tax_rate between 0 and 100),
  subtotal numeric(18,2) not null check (subtotal >= 0),
  tax_amount numeric(18,2) not null check (tax_amount >= 0),
  total_amount numeric(18,2) not null check (total_amount >= 0),
  total_paid numeric(18,2) not null default 0 check (total_paid >= 0 and total_paid <= total_amount),
  currency varchar(3) not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'draft' check (status in ('draft','pending','sent','accepted','partial','paid','void')),
  sent_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (workspace_id, invoice_code),
  unique (id, workspace_id)
);

create unique index invoices_manual_number_idx on public.invoices(workspace_id, lower(manual_number)) where manual_number is not null and archived_at is null;

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null,
  workspace_id uuid not null,
  position integer not null check (position > 0),
  description text not null check (char_length(description) between 1 and 500),
  quantity numeric(18,4) not null check (quantity > 0),
  rate numeric(18,2) not null check (rate >= 0),
  amount numeric(18,2) generated always as (round(quantity * rate, 2)) stored,
  created_at timestamptz not null default now(),
  foreign key (invoice_id, workspace_id) references public.invoices(id, workspace_id) on delete cascade,
  unique (invoice_id, position)
);

create table public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null,
  workspace_id uuid not null,
  amount numeric(18,2) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  method text not null check (method in ('cash','bank_transfer','card','upi','cheque','other')),
  reference text,
  notes text,
  recorded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (invoice_id, workspace_id) references public.invoices(id, workspace_id) on delete cascade
);

create index invoices_workspace_updated_idx on public.invoices(workspace_id, updated_at desc) where archived_at is null;
create index invoices_workspace_status_due_idx on public.invoices(workspace_id, status, due_date) where archived_at is null;
create index invoices_workspace_client_idx on public.invoices(workspace_id, client_id) where client_id is not null and archived_at is null;
create index invoice_items_invoice_idx on public.invoice_items(invoice_id, position);
create index invoice_payments_invoice_paid_idx on public.invoice_payments(invoice_id, paid_at desc);

create trigger invoices_touch before update on public.invoices for each row execute function public.touch_updated_at();

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_payments enable row level security;

create policy invoices_select_member on public.invoices for select to authenticated using (public.is_workspace_member(workspace_id));
create policy invoices_insert_editor on public.invoices for insert to authenticated
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy invoices_update_editor on public.invoices for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin','member'))
  with check (public.current_workspace_role(workspace_id) in ('owner','admin','member') and updated_by = (select auth.uid()) and archived_at is null);
create policy invoices_archive_admin on public.invoices for update to authenticated
  using (public.current_workspace_role(workspace_id) in ('owner','admin'))
  with check (public.current_workspace_role(workspace_id) in ('owner','admin') and updated_by = (select auth.uid()));
create policy invoice_items_select_member on public.invoice_items for select to authenticated using (public.is_workspace_member(workspace_id));
create policy invoice_payments_select_member on public.invoice_payments for select to authenticated using (public.is_workspace_member(workspace_id));

create or replace function public.save_invoice(p_invoice jsonb, p_items jsonb, p_invoice_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_workspace_id uuid;
  v_role text;
  v_currency varchar(3);
  v_invoice_id uuid;
  v_subtotal numeric(18,2);
  v_tax_rate numeric(7,4);
  v_tax numeric(18,2);
  v_total numeric(18,2);
begin
  select m.workspace_id, m.role, w.currency into v_workspace_id, v_role, v_currency
  from public.workspace_memberships m join public.workspaces w on w.id = m.workspace_id
  where m.user_id = v_user_id and m.status = 'active' and w.status = 'active'
  order by m.joined_at limit 1;
  if v_workspace_id is null then raise exception 'workspace membership required'; end if;
  if v_role not in ('owner','admin','member') then raise exception 'invoice write forbidden'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 200 then raise exception 'invoice items required'; end if;

  select round(sum((item ->> 'quantity')::numeric * (item ->> 'rate')::numeric), 2)
  into v_subtotal from jsonb_array_elements(p_items) item;
  v_tax_rate := (p_invoice ->> 'taxRate')::numeric;
  if v_subtotal < 0 or v_tax_rate < 0 or v_tax_rate > 100 then raise exception 'invalid invoice totals'; end if;
  v_tax := round(v_subtotal * v_tax_rate / 100, 2);
  v_total := v_subtotal + v_tax;

  if p_invoice_id is null then
    insert into public.invoices(
      workspace_id, document_type, manual_number, client_id, client_name, billing_address,
      project_id, project_name, issue_date, due_date, milestone, reference, additional_notes, bank_details,
      tax_rate, subtotal, tax_amount, total_amount, currency, status, created_by, updated_by
    ) values (
      v_workspace_id, p_invoice ->> 'type', nullif(p_invoice ->> 'invoiceNumber',''), nullif(p_invoice ->> 'clientId','')::uuid,
      p_invoice ->> 'clientName', p_invoice -> 'billingAddress', nullif(p_invoice ->> 'projectId','')::uuid,
      p_invoice ->> 'projectName', (p_invoice ->> 'issueDate')::date, (p_invoice ->> 'dueDate')::date,
      p_invoice ->> 'milestone', nullif(p_invoice ->> 'reference',''), nullif(p_invoice ->> 'additionalNotes',''), p_invoice -> 'bankDetails',
      v_tax_rate, v_subtotal, v_tax, v_total, v_currency, p_invoice ->> 'status', v_user_id, v_user_id
    ) returning id into v_invoice_id;
  else
    select i.id into v_invoice_id from public.invoices i
    where i.id = p_invoice_id and i.workspace_id = v_workspace_id and i.archived_at is null for update;
    if v_invoice_id is null then raise exception 'invoice not found'; end if;
    if exists (select 1 from public.invoices i where i.id = v_invoice_id and i.status in ('paid','void')) then raise exception 'locked invoice cannot be edited'; end if;
    if exists (select 1 from public.invoices i where i.id = v_invoice_id and i.total_paid > v_total) then raise exception 'total cannot be below recorded payments'; end if;
    if exists (select 1 from public.invoices i where i.id = v_invoice_id and i.total_paid > 0 and i.document_type <> (p_invoice ->> 'type')) then raise exception 'document type cannot change after payment'; end if;
    update public.invoices set
      document_type = p_invoice ->> 'type', manual_number = nullif(p_invoice ->> 'invoiceNumber',''),
      client_id = nullif(p_invoice ->> 'clientId','')::uuid, client_name = p_invoice ->> 'clientName', billing_address = p_invoice -> 'billingAddress',
      project_id = nullif(p_invoice ->> 'projectId','')::uuid, project_name = p_invoice ->> 'projectName',
      issue_date = (p_invoice ->> 'issueDate')::date, due_date = (p_invoice ->> 'dueDate')::date,
      milestone = p_invoice ->> 'milestone', reference = nullif(p_invoice ->> 'reference',''), additional_notes = nullif(p_invoice ->> 'additionalNotes',''),
      bank_details = p_invoice -> 'bankDetails',
      tax_rate = v_tax_rate, subtotal = v_subtotal, tax_amount = v_tax, total_amount = v_total,
      status = p_invoice ->> 'status', updated_by = v_user_id
    where id = v_invoice_id;
    delete from public.invoice_items where invoice_id = v_invoice_id;
  end if;

  insert into public.invoice_items(invoice_id, workspace_id, position, description, quantity, rate)
  select v_invoice_id, v_workspace_id, ordinal::integer, item ->> 'description', (item ->> 'quantity')::numeric, (item ->> 'rate')::numeric
  from jsonb_array_elements(p_items) with ordinality as rows(item, ordinal);
  return v_invoice_id;
end;
$$;

create or replace function public.record_invoice_payment(p_invoice_id uuid, p_payment jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_workspace_id uuid;
  v_role text;
  v_total numeric(18,2);
  v_paid numeric(18,2);
  v_amount numeric(18,2) := (p_payment ->> 'amount')::numeric;
  v_payment_id uuid;
begin
  select i.workspace_id, public.current_workspace_role(i.workspace_id), i.total_amount, i.total_paid
  into v_workspace_id, v_role, v_total, v_paid
  from public.invoices i where i.id = p_invoice_id and i.archived_at is null and i.document_type = 'invoice' for update;
  if v_workspace_id is null or not public.is_workspace_member(v_workspace_id) then raise exception 'invoice not found'; end if;
  if v_role not in ('owner','admin','member') then raise exception 'payment write forbidden'; end if;
  if v_amount <= 0 or v_paid + v_amount > v_total then raise exception 'payment exceeds outstanding amount'; end if;
  insert into public.invoice_payments(invoice_id, workspace_id, amount, paid_at, method, reference, notes, recorded_by)
  values (p_invoice_id, v_workspace_id, v_amount, coalesce((p_payment ->> 'paidAt')::timestamptz, now()), p_payment ->> 'method',
    nullif(p_payment ->> 'reference',''), nullif(p_payment ->> 'notes',''), v_user_id)
  returning id into v_payment_id;
  update public.invoices set total_paid = v_paid + v_amount,
    status = case when v_paid + v_amount = v_total then 'paid' else 'partial' end,
    updated_by = v_user_id where id = p_invoice_id;
  return v_payment_id;
end;
$$;

create or replace function public.set_invoice_status(p_invoice_id uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_workspace_id uuid;
  v_role text;
  v_current text;
  v_paid numeric(18,2);
begin
  if p_status not in ('draft','pending','sent','accepted','void') then raise exception 'invalid invoice status'; end if;
  select i.workspace_id, public.current_workspace_role(i.workspace_id), i.status, i.total_paid
  into v_workspace_id, v_role, v_current, v_paid
  from public.invoices i where i.id = p_invoice_id and i.archived_at is null for update;
  if v_workspace_id is null or not public.is_workspace_member(v_workspace_id) then raise exception 'invoice not found'; end if;
  if v_role not in ('owner','admin','member') then raise exception 'invoice status forbidden'; end if;
  if p_status = 'void' and v_role not in ('owner','admin') then raise exception 'invoice void forbidden'; end if;
  if v_current = 'paid' then raise exception 'paid invoice is locked'; end if;
  if v_paid > 0 and p_status <> 'void' then raise exception 'payment-controlled status cannot be changed'; end if;
  update public.invoices set status = p_status, sent_at = case when p_status = 'sent' then coalesce(sent_at, now()) else sent_at end,
    updated_by = v_user_id where id = p_invoice_id;
end;
$$;

create or replace function public.archive_invoice(p_invoice_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_workspace_id uuid;
  v_role text;
  v_paid numeric(18,2);
begin
  select i.workspace_id, public.current_workspace_role(i.workspace_id), i.total_paid
  into v_workspace_id, v_role, v_paid
  from public.invoices i where i.id = p_invoice_id and i.archived_at is null for update;
  if v_workspace_id is null or not public.is_workspace_member(v_workspace_id) then raise exception 'invoice not found'; end if;
  if v_role not in ('owner','admin') then raise exception 'invoice archive forbidden'; end if;
  if v_paid > 0 then raise exception 'invoice with payments cannot be archived'; end if;
  update public.invoices set archived_at = now(), updated_by = v_user_id where id = p_invoice_id;
end;
$$;

revoke all on function public.save_invoice(jsonb,jsonb,uuid) from public;
revoke all on function public.record_invoice_payment(uuid,jsonb) from public;
revoke all on function public.set_invoice_status(uuid,text) from public;
revoke all on function public.archive_invoice(uuid) from public;
grant execute on function public.save_invoice(jsonb,jsonb,uuid) to authenticated;
grant execute on function public.record_invoice_payment(uuid,jsonb) to authenticated;
grant execute on function public.set_invoice_status(uuid,text) to authenticated;
grant execute on function public.archive_invoice(uuid) to authenticated;

revoke all on public.invoices, public.invoice_items, public.invoice_payments from anon, authenticated;
grant select on public.invoices, public.invoice_items, public.invoice_payments to authenticated;
