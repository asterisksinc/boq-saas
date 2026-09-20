-- Speeds project workspace payment/invoice tabs that call
-- GET /api/v1/invoices?projectId=...
create index if not exists invoices_workspace_project_updated_idx
  on public.invoices(workspace_id, project_id, updated_at desc)
  where project_id is not null and archived_at is null;
