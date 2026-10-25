import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function parseEnv(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return env;
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
      env[key] = val;
    }
  }
  return env;
}

describe("Project Template Detail → Workflow → Tasks Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const tasksViewPath = path.resolve(
    __dirname,
    "../components/templates/detail/workflow/WorkflowTasksView.tsx"
  );
  const workflowParentPath = path.resolve(
    __dirname,
    "../components/templates/detail/TemplateWorkflow.tsx"
  );
  const typesPath = path.resolve(__dirname, "../lib/templates/types.ts");

  const css = fs.readFileSync(cssPath, "utf8");
  const tasksViewCode = fs.readFileSync(tasksViewPath, "utf8");
  const workflowParentCode = fs.readFileSync(workflowParentPath, "utf8");
  const typesCode = fs.readFileSync(typesPath, "utf8");

  it("1. Verifies fluid full-width layout without hardcoded 1440px canvas or 98px offsets", () => {
    // Workflow container must be fluid 100% width
    expect(css).toMatch(/\.td-wf-tasks-container\s*\{[^}]*width:\s*100%/);
    expect(css).toMatch(/\.td-wf-tasks-container\s*\{[^}]*max-width:\s*100%/);
    expect(css).not.toMatch(/\.td-wf-tasks-container\s*\{[^}]*width:\s*1440px/);

    // Table card container must be fluid 100% width
    expect(css).toMatch(/\.td-wf-tasks-table-card\s*\{[^}]*width:\s*100%/);
  });

  it("2. Verifies 4 KPI Metrics Summary Cards match Figma Frame 2147225138", () => {
    // Card 1: Total Tasks (Frame 93)
    expect(tasksViewCode).toContain("Total Tasks");
    expect(tasksViewCode).toContain("All Workflow Stages");

    // Card 2: Critical Tasks (Frame 2147225072)
    expect(tasksViewCode).toContain("Critical Tasks");
    expect(tasksViewCode).toContain("Requires Attention");

    // Card 3: Avg. Duration (Frame 2147225073)
    expect(tasksViewCode).toContain("Avg. Duration");
    expect(tasksViewCode).toContain("Estimated Average");

    // Card 4: Completion Rule (Frame 2147225071)
    expect(tasksViewCode).toContain("Completion Rule");
    expect(tasksViewCode).toContain("All Tasks");
    expect(tasksViewCode).toContain("Must be Completed");

    // KPI grid and card styling
    expect(css).toMatch(/\.td-wf-kpi-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    expect(css).toMatch(/\.td-wf-kpi-card\s*\{[^}]*min-height:\s*116px/);
    expect(css).toMatch(/\.td-wf-kpi-card\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\)/);
  });

  it("3. Verifies Main Tasks Table matches 10-column Figma specification", () => {
    // Table card container backdrop blur & styling
    expect(css).toMatch(/\.td-wf-tasks-table-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.td-wf-tasks-table-card\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\)/);

    // Table header background #E4ECFB & 36px height
    expect(css).toMatch(/\.td-wf-tasks-datatable\s+thead\s+tr\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.td-wf-tasks-datatable\s+thead\s+tr\s*\{[^}]*height:\s*36px/);

    // Table header columns in tasksViewCode
    expect(tasksViewCode).toContain("TASK NAME");
    expect(tasksViewCode).toContain("STAGE");
    expect(tasksViewCode).toContain("ASSIGNEE");
    expect(tasksViewCode).toContain("DURATION");
    expect(tasksViewCode).toContain("DEPENDENCY");
    expect(tasksViewCode).toContain("CRITICALITY");
    expect(tasksViewCode).toContain("STATUS");

    // Table rows 56px height & border-bottom #EBEBEB
    expect(css).toMatch(/\.td-wf-tasks-datatable\s+tbody\s+tr\s*\{[^}]*height:\s*56px/);
    expect(css).toMatch(/\.td-wf-tasks-datatable\s+tbody\s+tr\s*\{[^}]*border-bottom:\s*1px\s+solid\s+#EBEBEB/);
  });

  it("4. Verifies Badge styling: Stage, Assignee Avatar, Criticality, and Status pills", () => {
    // Stage pill: rgba(37, 99, 235, 0.12), #2563EB
    expect(css).toMatch(/\.td-wf-stage-pill\s*\{[^}]*background:\s*rgba\(37,\s*99,\s*235,\s*0\.12\)/);
    expect(css).toMatch(/\.td-wf-stage-pill\s*\{[^}]*color:\s*#2563EB/);

    // Assignee avatar 24px circular
    expect(css).toMatch(/\.td-assignee-avatar\s*\{[^}]*width:\s*24px/);
    expect(css).toMatch(/\.td-assignee-avatar\s*\{[^}]*height:\s*24px/);
    expect(css).toMatch(/\.td-assignee-avatar\s*\{[^}]*border-radius:\s*50%/);

    // Criticality badge colors: MEDIUM #FAB000, HIGH #DC2626, CRITICAL #FF0033
    expect(css).toMatch(/\.td-criticality-pill\.medium\s*\{[^}]*color:\s*#FAB000/);
    expect(css).toMatch(/\.td-criticality-pill\.high\s*\{[^}]*color:\s*#DC2626/);
    expect(css).toMatch(/\.td-criticality-pill\.critical\s*\{[^}]*color:\s*#FF0033/);

    // Status badge colors: ACTIVE #16A34A, COMPLETED #2563EB, DRAFT #D97706
    expect(css).toMatch(/\.td-status-pill-btn\.active\s*\{[^}]*color:\s*#16A34A/);
    expect(css).toMatch(/\.td-status-pill-btn\.completed\s*\{[^}]*color:\s*#2563EB/);
    expect(css).toMatch(/\.td-status-pill-btn\.draft\s*\{[^}]*color:\s*#D97706/);
  });

  it("5. Verifies Pagination Row matches Figma Frame 2147225166 & 2147225167", () => {
    // Total count label
    expect(tasksViewCode).toContain("Total Tasks: {filteredTasks.length}");

    // Pagination buttons: 34px x 34px, active #E4ECFB with #2563EB border
    expect(css).toMatch(/\.target-table-page-btn\s*\{[^}]*min-width:\s*34px/);
    expect(css).toMatch(/\.target-table-page-btn\s*\{[^}]*height:\s*34px/);
    expect(css).toMatch(/\.target-table-page-btn\.active\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.target-table-page-btn\.active\s*\{[^}]*border-color:\s*#2563EB/);
    expect(css).toMatch(/\.target-table-page-btn\.active\s*\{[^}]*color:\s*#2563EB/);

    // Show per Page label and dropdown
    expect(tasksViewCode).toContain("Show per Page:");
    expect(tasksViewCode).toContain("target-table-page-size-select");
  });

  it("6. Verifies Task Actions, Modals, and Inline Popovers", () => {
    // Action menu items: Edit Task, Duplicate, Delete Task
    expect(tasksViewCode).toContain("Edit Task");
    expect(tasksViewCode).toContain("Duplicate");
    expect(tasksViewCode).toContain("Delete Task");

    // Modals: Edit Task, Add Task, Delete confirmation
    expect(tasksViewCode).toContain("Edit Task Details");
    expect(tasksViewCode).toContain("Add New Workflow Task");
    expect(tasksViewCode).toContain("Delete Task");

    // Parent TemplateWorkflow passes stages, statusFilter, onUpdateTasks to WorkflowTasksView
    expect(workflowParentCode).toContain("WorkflowTasksView");
    expect(workflowParentCode).toContain("tasks={tasks}");
    expect(workflowParentCode).toContain("stages={stages}");
    expect(workflowParentCode).toContain("statusFilter={statusFilter}");
  });

  it("7. Verifies Supabase dynamic data contract for workflow tasks", async () => {
    const env = parseEnv(path.resolve(__dirname, "../.env.local"));
    const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
    const supabaseKey = env["SUPABASE_SECRET_KEY"] || env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

    expect(supabaseUrl).toBeTruthy();
    expect(supabaseKey).toBeTruthy();

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: template, error } = await supabase
      .from("project_templates")
      .select("id, name, workflow")
      .eq("name", "Premium 3BHK Residential")
      .single();

    expect(error).toBeNull();
    expect(template).toBeTruthy();
    expect(template?.workflow).toBeDefined();

    const tasks = (template as any).workflow?.tasks;
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);

    // Verify properties on first task
    const firstTask = tasks[0];
    expect(firstTask.name).toBe("Client Briefing & Requirement");
    expect(firstTask.code).toBe("TSK-001");
    expect(firstTask.criticality).toBeDefined();
  });
});
