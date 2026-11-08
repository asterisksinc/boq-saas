-- Migration: Add workflow_stage column to public.projects with safe default
-- Supports Kanban Board View and workflow progression inside the User Dashboard.

alter table if exists public.projects
  add column if not exists workflow_stage text default 'design_concept',
  add column if not exists stage text default 'Design Concept';

create index if not exists projects_workspace_workflow_stage_idx
  on public.projects(workspace_id, workflow_stage)
  where archived_at is null;
