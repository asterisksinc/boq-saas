-- Keep project progress integer-compatible with public.projects.progress (smallint).
alter table if exists public.projects
  alter column progress type integer
  using least(100, greatest(0, round(coalesce(progress, 0))))::integer;

-- Ensure optional project fields used by project imports and responses exist.
alter table if exists public.projects
  add column if not exists cover_image text,
  add column if not exists metadata jsonb,
  add column if not exists stage text,
  add column if not exists workflow_stage text;
