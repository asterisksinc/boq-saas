-- Projects metadata and room references support
-- Backward-compatible: adds optional metadata jsonb to public.projects
alter table if exists public.projects
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Ensure cover_image column exists on public.projects
alter table if exists public.projects
  add column if not exists cover_image text;
