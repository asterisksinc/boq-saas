alter table public.workspace_profiles
  add column if not exists state text,
  add column if not exists postal_code text;

grant update (
  name,
  currency,
  timezone,
  country
) on public.workspaces to authenticated;

grant update (
  website,
  business_email,
  phone,
  address,
  state,
  postal_code,
  tax_id
) on public.workspace_profiles to authenticated;
