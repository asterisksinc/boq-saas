-- Keep project create/list/update compatible with environments that were
-- provisioned before the project cover field was introduced.
alter table if exists public.projects
  add column if not exists cover_image text;
