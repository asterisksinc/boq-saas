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

describe("Project Template Detail → Workflow → Stages Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const stagesViewPath = path.resolve(
    __dirname,
    "../components/templates/detail/workflow/WorkflowStagesView.tsx"
  );
  const workflowParentPath = path.resolve(
    __dirname,
    "../components/templates/detail/TemplateWorkflow.tsx"
  );
  const detailPagePath = path.resolve(
    __dirname,
    "../app/templates/[id]/page.tsx"
  );

  const css = fs.readFileSync(cssPath, "utf8");
  const stagesViewCode = fs.readFileSync(stagesViewPath, "utf8");
  const workflowParentCode = fs.readFileSync(workflowParentPath, "utf8");
  const detailPageCode = fs.readFileSync(detailPagePath, "utf8");

  it("1. Verifies fluid 3-column / 2-column grid layout and eliminates right-side whitespace", () => {
    // Workflow container must be fluid 100% width without hardcoded fixed canvas
    expect(css).toMatch(/\.td-workflow-container\s*\{[^}]*width:\s*100%/);
    expect(css).toMatch(/\.td-workflow-container\s*\{[^}]*max-width:\s*100%/);
    expect(css).not.toMatch(/\.td-workflow-container\s*\{[^}]*width:\s*1440px/);

    // Responsive 3-column content grid: outline sidebar, center table, and inspector
    expect(css).toMatch(
      /\.td-wf-content-grid\s*\{[^}]*grid-template-columns:\s*minmax\(260px,\s*310px\)\s*minmax\(0,\s*1fr\)\s*minmax\(280px,\s*320px\)/
    );

    // Collapsed inspector 2-column grid
    expect(css).toMatch(
      /\.td-wf-content-grid\.inspector-closed\s*\{[^}]*grid-template-columns:\s*minmax\(260px,\s*310px\)\s*minmax\(0,\s*1fr\)/
    );
  });

  it("2. Verifies Workflow Top Bar and Action Controls match Figma Frame 2147225198 & 2147225069", () => {
    // Title & description in TemplateWorkflow
    expect(workflowParentCode).toContain("Workflow");
    expect(workflowParentCode).toContain(
      "Define the operational process inherited by projects created from this template."
    );

    // Search workflow box
    expect(workflowParentCode).toContain("td-workflow-search-box");
    expect(workflowParentCode).toContain("Search workflow…");

    // Action buttons: Edit, Filter with popover, Add with dropdown
    expect(workflowParentCode).toContain("td-wf-btn-icon");
    expect(workflowParentCode).toContain("td-wf-btn-filter");
    expect(workflowParentCode).toContain("td-wf-btn-add");
    expect(workflowParentCode).toContain("td-wf-filter-popover");
    expect(workflowParentCode).toContain("td-wf-add-dropdown-menu");

    // CSS dimensions for controls
    expect(css).toMatch(/\.td-workflow-search-box\s*\{[^}]*width:\s*260px/);
    expect(css).toMatch(/\.td-workflow-search-box\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-wf-btn-add\s*\{[^}]*background:\s*#2563EB/);
    expect(css).toMatch(/\.td-wf-btn-add\s*\{[^}]*height:\s*46px/);
  });

  it("3. Verifies Workflow Sub-tabs Navigation (Stages, Tasks, Milestones, Approvals, Rules)", () => {
    // All 5 subtabs defined in TemplateWorkflow
    expect(workflowParentCode).toContain('"Stages"');
    expect(workflowParentCode).toContain('"Tasks"');
    expect(workflowParentCode).toContain('"Milestones"');
    expect(workflowParentCode).toContain('"Approvals"');
    expect(workflowParentCode).toContain('"Rules"');

    // Active bottom border indicator in CSS
    expect(css).toMatch(/\.td-wf-subtab\.active::after\s*\{[^}]*background:\s*#2563EB/);
    expect(css).toMatch(/\.td-wf-subtab\.active::after\s*\{[^}]*height:\s*3px/);
  });

  it("4. Verifies 4 KPI Summary Cards matching Figma Frame 2147225138", () => {
    // KPI grid and cards present in WorkflowStagesView
    expect(stagesViewCode).toContain("td-wf-kpi-grid");
    expect(stagesViewCode).toContain("td-wf-kpi-card");

    // 4 cards labels and subtext
    expect(stagesViewCode).toContain("Stages");
    expect(stagesViewCode).toContain("Tasks");
    expect(stagesViewCode).toContain("Milestones");
    expect(stagesViewCode).toContain("Approvals");
    expect(stagesViewCode).toContain("This quarter");
    expect(stagesViewCode).toContain("4 of 6 decided");
    expect(stagesViewCode).toContain("Per proposal");
    expect(stagesViewCode).toContain("1 expiring soon");

    // CSS styling: 4-column grid with glassmorphism
    expect(css).toMatch(/\.td-wf-kpi-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    expect(css).toMatch(/\.td-wf-kpi-card\s*\{[^}]*min-height:\s*116px/);
    expect(css).toMatch(/\.td-wf-kpi-card\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\)/);
  });

  it("5. Verifies Left Column: Workflow Outline Sidebar (Figma Frame 2147225071)", () => {
    // Sidebar structure
    expect(stagesViewCode).toContain("td-wf-outline-sidebar");
    expect(stagesViewCode).toContain("WORKFLOW OUTLINE");
    expect(stagesViewCode).toContain("add-stage-btn");
    expect(stagesViewCode).toContain("Add Stage");

    // Dynamic stage list items
    expect(stagesViewCode).toContain("stage-row");
    expect(stagesViewCode).toContain("tasks-badge");
    expect(stagesViewCode).toContain("getStageIcon");

    // Selected stage styling in CSS
    expect(css).toMatch(/\.td-wf-outline-sidebar\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\)/);
    expect(css).toMatch(/\.td-wf-outline-sidebar\s*\.stage-row\.selected\s*\{[^}]*background:\s*#EFF6FF/);
    expect(css).toMatch(/\.td-wf-outline-sidebar\s*\.stage-row\.selected\s*\{[^}]*color:\s*#2563EB/);
  });

  it("6. Verifies Center Column: Tasks Table (10 Columns, #E4ECFB Header, 56px Rows)", () => {
    // Tasks table in WorkflowStagesView
    expect(stagesViewCode).toContain("td-wf-tasks-table");
    expect(stagesViewCode).toContain("TASK NAME");
    expect(stagesViewCode).toContain("OWNER / ASSIGNEE");
    expect(stagesViewCode).toContain("DURATION");
    expect(stagesViewCode).toContain("DEPENDENCY");
    expect(stagesViewCode).toContain("APPROVAL");
    expect(stagesViewCode).toContain("SLA");
    expect(stagesViewCode).toContain("RATE STATUS");

    // Table header background #E4ECFB & 36px height in CSS
    expect(css).toMatch(/\.td-wf-tasks-table\s*thead\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.td-wf-tasks-table\s*thead\s*\{[^}]*height:\s*36px/);

    // Table body rows: 56px height
    expect(css).toMatch(/\.td-wf-tasks-table\s*tbody\s*tr\s*\{[^}]*height:\s*56px/);
    expect(css).toMatch(/\.td-wf-tasks-table\s*tbody\s*tr\s*\{[^}]*border-bottom:\s*1px\s*solid\s*#EBEBEB/);

    // Pagination row
    expect(stagesViewCode).toContain("target-table-pagination-row");
    expect(stagesViewCode).toContain("Total Tasks:");
    expect(stagesViewCode).toContain("Show per Page:");
  });

  it("7. Verifies Right Column: Stage Details Inspector & Modals (Figma Frame 2147225086)", () => {
    // Inspector structure
    expect(stagesViewCode).toContain("td-wf-inspector-panel");
    expect(stagesViewCode).toContain("STAGE DETAILS");
    expect(stagesViewCode).toContain("Stage Name");
    expect(stagesViewCode).toContain("Stage Code");
    expect(stagesViewCode).toContain("Stage Status");
    expect(stagesViewCode).toContain("Stage Owner");
    expect(stagesViewCode).toContain("Expected Duration");
    expect(stagesViewCode).toContain("Entry Condition");
    expect(stagesViewCode).toContain("Exit Condition");

    // Action buttons
    expect(stagesViewCode).toContain("td-btn-secondary-wf");
    expect(stagesViewCode).toContain("td-btn-primary-wf");
    expect(stagesViewCode).toContain("Save Draft");
    expect(stagesViewCode).toContain("Save Changes");

    // Close button & collapsed behavior
    expect(stagesViewCode).toContain("setIsInspectorOpen(false)");

    // Add / Edit Task Modal & Add Stage Modal
    expect(stagesViewCode).toContain("isTaskModalOpen");
    expect(stagesViewCode).toContain("isAddStageModalOpen");
  });

  it("8. Verifies Live Database Data Contract with Supabase Template Workflow", async () => {
    const env = parseEnv(path.resolve(__dirname, "../.env.local"));
    const supabaseUrl =
      env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      env.SUPABASE_SECRET_KEY ||
      env.SUPABASE_SERVICE_ROLE_KEY ||
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(supabaseKey).toBeDefined();

    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data, error } = await supabase
      .from("project_templates")
      .select("id, name, workflow")
      .eq("id", "e1000000-0000-4000-8000-000000000001")
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.name).toBe("Premium 3BHK Residential");
    expect(data!.workflow).toBeDefined();
    expect(Array.isArray(data!.workflow.stages)).toBe(true);
    expect(data!.workflow.stages.length).toBe(7);

    // Verify stage codes and names match Figma
    const stageNames = data!.workflow.stages.map((s: any) => s.name);
    expect(stageNames).toContain("Discovery");
    expect(stageNames).toContain("Design");
    expect(stageNames).toContain("Costing");
    expect(stageNames).toContain("Approval");
    expect(stageNames).toContain("Execution");
    expect(stageNames).toContain("Handover");
    expect(stageNames).toContain("Closure");

    console.log(
      `Live Supabase Verified: 7 Workflow Stages in template "${data!.name}"`
    );
  });
});
