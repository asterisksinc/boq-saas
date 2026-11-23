-- Upgrade Invoices and Invoice Items for Reference Invoice Redesign
-- Forward-only migration adding missing invoice and line-item fields and updating save_invoice function

-- 1. Extend public.invoices with reference invoice fields
alter table public.invoices
  add column if not exists eway_bill_number text,
  add column if not exists place_of_supply text,
  add column if not exists place_of_supply_code text,
  add column if not exists ship_to_name text,
  add column if not exists ship_to_address jsonb,
  add column if not exists buyer_gstin text,
  add column if not exists terms_and_conditions text,
  add column if not exists organization_snapshot jsonb;

-- 2. Extend public.invoice_items with HSN/SAC, Unit, and tax columns
alter table public.invoice_items
  add column if not exists hsn_sac_code text,
  add column if not exists unit text default 'NOS',
  add column if not exists tax_rate numeric(7,4),
  add column if not exists tax_amount numeric(18,2),
  add column if not exists taxable_amount numeric(18,2);

-- 3. Replace save_invoice function to handle new fields and item-level tax calculations safely
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
  v_has_item_taxes boolean := false;
begin
  select m.workspace_id, m.role, w.currency into v_workspace_id, v_role, v_currency
  from public.workspace_memberships m join public.workspaces w on w.id = m.workspace_id
  where m.user_id = v_user_id and m.status = 'active' and w.status = 'active'
  order by m.joined_at limit 1;

  if v_workspace_id is null then raise exception 'workspace membership required'; end if;
  if v_role not in ('owner','admin','member') then raise exception 'invoice write forbidden'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 200 then raise exception 'invoice items required'; end if;

  -- Calculate subtotal (sum of quantity * rate)
  select round(sum((item ->> 'quantity')::numeric * (item ->> 'rate')::numeric), 2)
  into v_subtotal from jsonb_array_elements(p_items) item;

  v_tax_rate := coalesce((p_invoice ->> 'taxRate')::numeric, 18);
  if v_subtotal < 0 or v_tax_rate < 0 or v_tax_rate > 100 then raise exception 'invalid invoice totals'; end if;

  -- Check if any item specifies its own tax rate or tax amount
  select exists(
    select 1 from jsonb_array_elements(p_items) item
    where item ? 'taxRate' or item ? 'taxAmount'
  ) into v_has_item_taxes;

  if v_has_item_taxes then
    select round(sum(
      coalesce(
        (item ->> 'taxAmount')::numeric,
        round(((item ->> 'quantity')::numeric * (item ->> 'rate')::numeric) * coalesce((item ->> 'taxRate')::numeric, v_tax_rate) / 100, 2)
      )
    ), 2)
    into v_tax from jsonb_array_elements(p_items) item;
  else
    v_tax := round(v_subtotal * v_tax_rate / 100, 2);
  end if;

  v_total := v_subtotal + v_tax;

  if p_invoice_id is null then
    insert into public.invoices(
      workspace_id, document_type, manual_number, client_id, client_name, billing_address,
      project_id, project_name, issue_date, due_date, milestone, reference, additional_notes, bank_details,
      tax_rate, subtotal, tax_amount, total_amount, currency, status,
      eway_bill_number, place_of_supply, place_of_supply_code, ship_to_name, ship_to_address,
      buyer_gstin, terms_and_conditions, organization_snapshot,
      created_by, updated_by
    ) values (
      v_workspace_id, p_invoice ->> 'type', nullif(p_invoice ->> 'invoiceNumber',''), nullif(p_invoice ->> 'clientId','')::uuid,
      p_invoice ->> 'clientName', p_invoice -> 'billingAddress', nullif(p_invoice ->> 'projectId','')::uuid,
      p_invoice ->> 'projectName', (p_invoice ->> 'issueDate')::date, (p_invoice ->> 'dueDate')::date,
      p_invoice ->> 'milestone', nullif(p_invoice ->> 'reference',''), nullif(p_invoice ->> 'additionalNotes',''), p_invoice -> 'bankDetails',
      v_tax_rate, v_subtotal, v_tax, v_total, v_currency, p_invoice ->> 'status',
      nullif(p_invoice ->> 'ewayBillNumber', ''), nullif(p_invoice ->> 'placeOfSupply', ''), nullif(p_invoice ->> 'placeOfSupplyCode', ''),
      nullif(p_invoice ->> 'shipToName', ''), p_invoice -> 'shipToAddress',
      nullif(p_invoice ->> 'buyerGstin', ''), nullif(p_invoice ->> 'termsAndConditions', ''), p_invoice -> 'organizationSnapshot',
      v_user_id, v_user_id
    ) returning id into v_invoice_id;
  else
    select i.id into v_invoice_id from public.invoices i
    where i.id = p_invoice_id and i.workspace_id = v_workspace_id and i.archived_at is null for update;
    if v_invoice_id is null then raise exception 'invoice not found'; end if;
    if exists (select 1 from public.invoices i where i.id = v_invoice_id and i.status in ('paid','void')) then raise exception 'locked invoice cannot be edited'; end if;
    if exists (select 1 from public.invoices i where i.id = v_invoice_id and i.total_paid > v_total) then raise exception 'total cannot be below recorded payments'; end if;
    if exists (select 1 from public.invoices i where i.id = v_invoice_id and i.total_paid > 0 and i.document_type <> (p_invoice ->> 'type')) then raise exception 'document type cannot change after payment'; end if;

    update public.invoices set
      document_type = p_invoice ->> 'type',
      manual_number = nullif(p_invoice ->> 'invoiceNumber',''),
      client_id = nullif(p_invoice ->> 'clientId','')::uuid,
      client_name = p_invoice ->> 'clientName',
      billing_address = p_invoice -> 'billingAddress',
      project_id = nullif(p_invoice ->> 'projectId','')::uuid,
      project_name = p_invoice ->> 'projectName',
      issue_date = (p_invoice ->> 'issueDate')::date,
      due_date = (p_invoice ->> 'dueDate')::date,
      milestone = p_invoice ->> 'milestone',
      reference = nullif(p_invoice ->> 'reference',''),
      additional_notes = nullif(p_invoice ->> 'additionalNotes',''),
      bank_details = p_invoice -> 'bankDetails',
      tax_rate = v_tax_rate,
      subtotal = v_subtotal,
      tax_amount = v_tax,
      total_amount = v_total,
      status = p_invoice ->> 'status',
      eway_bill_number = nullif(p_invoice ->> 'ewayBillNumber', ''),
      place_of_supply = nullif(p_invoice ->> 'placeOfSupply', ''),
      place_of_supply_code = nullif(p_invoice ->> 'placeOfSupplyCode', ''),
      ship_to_name = nullif(p_invoice ->> 'shipToName', ''),
      ship_to_address = p_invoice -> 'shipToAddress',
      buyer_gstin = nullif(p_invoice ->> 'buyerGstin', ''),
      terms_and_conditions = nullif(p_invoice ->> 'termsAndConditions', ''),
      organization_snapshot = coalesce(p_invoice -> 'organizationSnapshot', organization_snapshot),
      updated_by = v_user_id
    where id = v_invoice_id;

    delete from public.invoice_items where invoice_id = v_invoice_id;
  end if;

  insert into public.invoice_items(
    invoice_id, workspace_id, position, description, quantity, rate,
    hsn_sac_code, unit, tax_rate, tax_amount, taxable_amount
  )
  select
    v_invoice_id,
    v_workspace_id,
    ordinal::integer,
    item ->> 'description',
    (item ->> 'quantity')::numeric,
    (item ->> 'rate')::numeric,
    nullif(item ->> 'hsnSacCode', ''),
    coalesce(nullif(item ->> 'unit', ''), 'NOS'),
    coalesce((item ->> 'taxRate')::numeric, v_tax_rate),
    round(coalesce(
      (item ->> 'taxAmount')::numeric,
      ((item ->> 'quantity')::numeric * (item ->> 'rate')::numeric * coalesce((item ->> 'taxRate')::numeric, v_tax_rate) / 100)
    ), 2),
    round((item ->> 'quantity')::numeric * (item ->> 'rate')::numeric, 2)
  from jsonb_array_elements(p_items) with ordinality as rows(item, ordinal);

  return v_invoice_id;
end;
$$;

revoke all on function public.save_invoice(jsonb,jsonb,uuid) from public;
grant execute on function public.save_invoice(jsonb,jsonb,uuid) to authenticated;
