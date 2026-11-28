-- Standard project stages (Kanban columns):
-- Enquiry, Site Visit & Briefing, Concept & Estimate, BOQ & Proposal, Client Review, Agreement & Advance,
-- Design Finalisation, Procurement & Production, Site Execution, Quality & Handover, Project Completed,
-- On Hold, Lost, Cancelled.
--
-- 1. New workspaces are seeded with the standard list.
-- 2. Workspaces still on the previous default list are upgraded in place: old stages are renamed
--    (ids kept, so every project stays linked) and the missing stages are added.
--    Workspaces with any custom-named stage are left untouched.

create or replace function public.ensure_default_activity_stages(p_workspace_id uuid, p_user_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator_id uuid;
begin
  if p_user_id is not null then
    v_creator_id := p_user_id;
  else
    select user_id into v_creator_id from public.workspace_memberships where workspace_id = p_workspace_id and status = 'active' limit 1;
  end if;

  if v_creator_id is null then
    return;
  end if;

  if not exists (select 1 from public.activity_stages where workspace_id = p_workspace_id) then
    insert into public.activity_stages (workspace_id, name, color, sort_order, terminal_type, created_by)
    values
      (p_workspace_id, 'Enquiry',                  '#2563EB',  1, null,        v_creator_id),
      (p_workspace_id, 'Site Visit & Briefing',    '#0EA5E9',  2, null,        v_creator_id),
      (p_workspace_id, 'Concept & Estimate',       '#7C3AED',  3, null,        v_creator_id),
      (p_workspace_id, 'BOQ & Proposal',           '#9333EA',  4, null,        v_creator_id),
      (p_workspace_id, 'Client Review',            '#EA580C',  5, null,        v_creator_id),
      (p_workspace_id, 'Agreement & Advance',      '#D97706',  6, null,        v_creator_id),
      (p_workspace_id, 'Design Finalisation',      '#4F46E5',  7, null,        v_creator_id),
      (p_workspace_id, 'Procurement & Production', '#0891B2',  8, null,        v_creator_id),
      (p_workspace_id, 'Site Execution',           '#0D9488',  9, null,        v_creator_id),
      (p_workspace_id, 'Quality & Handover',       '#059669', 10, null,        v_creator_id),
      (p_workspace_id, 'Project Completed',        '#16A34A', 11, 'completed', v_creator_id),
      (p_workspace_id, 'On Hold',                  '#64748B', 12, null,        v_creator_id),
      (p_workspace_id, 'Lost',                     '#DC2626', 13, 'lost',      v_creator_id),
      (p_workspace_id, 'Cancelled',                '#991B1B', 14, 'lost',      v_creator_id);
  end if;
end;
$$;

do $$
declare
  ws record;
  v_creator uuid;
begin
  create temporary table _std_stages (name text primary key, color text, sort_order int, terminal_type text, old_name text) on commit drop;
  insert into _std_stages values
    ('Enquiry',                  '#2563EB',  1, null,        'REQUIREMENT STATED'),
    ('Site Visit & Briefing',    '#0EA5E9',  2, null,        null),
    ('Concept & Estimate',       '#7C3AED',  3, null,        null),
    ('BOQ & Proposal',           '#9333EA',  4, null,        'ESTIMATE / BOQ SHARED'),
    ('Client Review',            '#EA580C',  5, null,        'NEGOTIATIONS'),
    ('Agreement & Advance',      '#D97706',  6, null,        null),
    ('Design Finalisation',      '#4F46E5',  7, null,        'DESIGN'),
    ('Procurement & Production', '#0891B2',  8, null,        null),
    ('Site Execution',           '#0D9488',  9, null,        'EXECUTIONS'),
    ('Quality & Handover',       '#059669', 10, null,        'PROJECT HANDOVER'),
    ('Project Completed',        '#16A34A', 11, 'completed', 'WON'),
    ('On Hold',                  '#64748B', 12, null,        null),
    ('Lost',                     '#DC2626', 13, 'lost',      'LOST'),
    ('Cancelled',                '#991B1B', 14, 'lost',      null);

  for ws in
    select distinct s.workspace_id
      from public.activity_stages s
     where not exists (
       select 1 from public.activity_stages c
        where c.workspace_id = s.workspace_id
          and not exists (
            select 1 from _std_stages t
             where upper(c.name) = upper(t.name) or upper(c.name) = t.old_name
          )
     )
  loop
    -- Rename the previous defaults in place (ids, and so project links, are kept).
    update public.activity_stages a
       set name = t.name, color = t.color, sort_order = t.sort_order, terminal_type = t.terminal_type
      from _std_stages t
     where a.workspace_id = ws.workspace_id
       and t.old_name is not null
       and upper(a.name) = t.old_name
       and not exists (select 1 from public.activity_stages x where x.workspace_id = ws.workspace_id and upper(x.name) = upper(t.name));

    -- Projects that also carry the stage as text follow the rename.
    update public.projects p
       set stage = t.name
      from _std_stages t
     where p.workspace_id = ws.workspace_id
       and t.old_name is not null
       and upper(coalesce(p.stage, '')) = t.old_name;

    select created_by into v_creator from public.activity_stages where workspace_id = ws.workspace_id limit 1;

    -- Add the stages the workspace doesn't have yet.
    insert into public.activity_stages (workspace_id, name, color, sort_order, terminal_type, created_by)
    select ws.workspace_id, t.name, t.color, t.sort_order, t.terminal_type, v_creator
      from _std_stages t
     where not exists (select 1 from public.activity_stages x where x.workspace_id = ws.workspace_id and upper(x.name) = upper(t.name));

    -- Put every standard stage in the standard order.
    update public.activity_stages a
       set sort_order = t.sort_order
      from _std_stages t
     where a.workspace_id = ws.workspace_id and upper(a.name) = upper(t.name);
  end loop;
end $$;
