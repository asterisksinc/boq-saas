-- Add extended user profile and preference fields for My Profile page
alter table public.user_profiles
  add column if not exists job_title text,
  add column if not exists department text,
  add column if not exists phone text;

alter table public.user_preferences
  add column if not exists date_format text not null default 'DD/MM/YYYY',
  add column if not exists currency_display text not null default 'INR';

grant update (display_name, avatar_url, job_title, department, phone) on public.user_profiles to authenticated;
grant update (timezone, locale, date_format, currency_display) on public.user_preferences to authenticated;
