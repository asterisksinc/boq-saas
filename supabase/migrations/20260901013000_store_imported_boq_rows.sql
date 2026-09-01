alter table public.boq_imports add column if not exists rows jsonb not null default '[]'::jsonb;
