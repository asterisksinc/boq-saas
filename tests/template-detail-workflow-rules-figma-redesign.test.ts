import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Templates - Project Templates - Template Detail - Workflow - Rules & View Rule Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const kpiCardsPath = path.resolve(
    __dirname,
    "../components/templates/detail/workflow/rules/RulesKpiCards.tsx"
  );
  const catTabsPath = path.resolve(
    __dirname,
    "../components/templates/detail/workflow/rules/RuleCategoryTabs.tsx"
  );
  const dataTablePath = path.resolve(
    __dirname,
    "../components/templates/detail/workflow/rules/RulesDataTable.tsx"
  );
  const sidePanelPath = path.resolve(
    __dirname,
    "../components/templates/detail/workflow/rules/RuleDetailSidePanel.tsx"
  );
  const workflowRulesViewPath = path.resolve(
    __dirname,
    "../components/templates/detail/workflow/WorkflowRulesView.tsx"
  );
  const rulesDomainPath = path.resolve(
    __dirname,
    "../lib/templates/rules-domain.ts"
  );
  const directRoute1Path = path.resolve(
    __dirname,
    "../app/templates/[id]/workflow/rules/page.tsx"
  );
  const directRoute2Path = path.resolve(
    __dirname,
    "../app/templates/[id]/workflow/rules/[ruleId]/page.tsx"
  );
  const directRoute3Path = path.resolve(
    __dirname,
    "../app/templates/project-templates/[id]/workflow/rules/page.tsx"
  );
  const directRoute4Path = path.resolve(
    __dirname,
    "../app/templates/project-templates/[id]/workflow/rules/[ruleId]/page.tsx"
  );

  const css = fs.readFileSync(cssPath, "utf8");
  const kpiCardsCode = fs.readFileSync(kpiCardsPath, "utf8");
  const catTabsCode = fs.readFileSync(catTabsPath, "utf8");
  const dataTableCode = fs.readFileSync(dataTablePath, "utf8");
  const sidePanelCode = fs.readFileSync(sidePanelPath, "utf8");
  const workflowRulesViewCode = fs.readFileSync(workflowRulesViewPath, "utf8");
  const rulesDomainCode = fs.readFileSync(rulesDomainPath, "utf8");
  const directRoute1Code = fs.readFileSync(directRoute1Path, "utf8");
  const directRoute2Code = fs.readFileSync(directRoute2Path, "utf8");
  const directRoute3Code = fs.readFileSync(directRoute3Path, "utf8");
  const directRoute4Code = fs.readFileSync(directRoute4Path, "utf8");

  it("1. Verifies 4 KPI Summary Cards (Figma Frame 2147225138)", () => {
    // Grid CSS class
    expect(css).toMatch(/\.td-wf-rules-kpi-grid\s*\{[^}]*display:\s*grid/);
    expect(css).toMatch(/\.td-wf-rules-kpi-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
    expect(css).toMatch(/\.td-wf-rules-kpi-grid\s*\{[^}]*gap:\s*8px/);

    // Card styling
    expect(css).toMatch(/\.td-wf-rules-kpi-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.td-wf-rules-kpi-card\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-wf-rules-kpi-card\s*\{[^}]*height:\s*116px/);

    // Labels & Subtitles
    expect(kpiCardsCode).toContain("Total Rules");
    expect(kpiCardsCode).toContain("All Configured");
    expect(kpiCardsCode).toContain("Active");
    expect(kpiCardsCode).toContain("Running");
    expect(kpiCardsCode).toContain("Approval Triggers");
    expect(kpiCardsCode).toContain("Require Authorisation");
    expect(kpiCardsCode).toContain("Draft");
    expect(kpiCardsCode).toContain("In-Progress");
  });

  it("2. Verifies 8-Category Filter Bar (Figma Frame Buttons)", () => {
    // Filter Bar CSS
    expect(css).toMatch(/\.td-rule-cat-bar\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.td-rule-cat-bar\s*\{[^}]*gap:\s*6px/);

    // Active button styling
    expect(css).toMatch(/\.td-rule-cat-btn\.active\s*\{[^}]*background:\s*#EFF6FF/);
    expect(css).toMatch(/\.td-rule-cat-btn\.active\s+\.cat-btn-label\s*\{[^}]*color:\s*#2563EB/);
    expect(css).toMatch(/\.td-rule-cat-btn\.active\s+\.cat-btn-badge\s*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(/\.td-rule-cat-btn\.active\s+\.cat-btn-badge\s*\{[^}]*color:\s*#2563EB/);

    // Categories in component
    expect(catTabsCode).toContain("All Rules");
    expect(catTabsCode).toContain("Project");
    expect(catTabsCode).toContain("Tasks");
    expect(catTabsCode).toContain("Milestones");
    expect(catTabsCode).toContain("Approvals");
    expect(catTabsCode).toContain("Costing");
    expect(catTabsCode).toContain("Documents");
    expect(catTabsCode).toContain("Clients");
  });

  it("3. Verifies 10-Column Rules Data Table (Figma Frame 2147225085 & Frame 57)", () => {
    // Header styling
    expect(css).toMatch(/\.td-wf-rules-datatable\s+thead\s+tr\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.td-wf-rules-datatable\s+thead\s+tr\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/\.td-wf-rules-datatable\s+th\s*\{[^}]*color:\s*#64748B/);

    // Row styling
    expect(css).toMatch(/\.td-wf-rules-datatable\s+tbody\s+tr\s*\{[^}]*height:\s*56px/);
    expect(css).toMatch(/\.td-wf-rules-datatable\s+tbody\s+tr\s*\{[^}]*border-bottom:\s*1px\s+solid\s+#EBEBEB/);

    // Table Columns in JSX
    expect(dataTableCode).toContain("RULE NAME");
    expect(dataTableCode).toContain("TRIGGER");
    expect(dataTableCode).toContain("ACTION");
    expect(dataTableCode).toContain("STATUS");
    expect(dataTableCode).toContain("PRIORITY");
    expect(dataTableCode).toContain("EXECUTED");
    expect(dataTableCode).toContain("LAST UPDATED");

    // Status pill & dash
    expect(css).toMatch(/\.td-rule-status-pill\s*\{[^}]*background:\s*rgba\(83,\s*58,\s*253,\s*0\.1\)/);
    expect(css).toMatch(/\.td-rule-status-pill\s*\{[^}]*color:\s*#533AFD/);
    expect(css).toMatch(/\.td-rule-status-dash\s*\{[^}]*color:\s*#64748B/);

    // Priority pill styles
    expect(css).toMatch(/\.td-rule-priority-pill\.pri-critical/);
    expect(css).toMatch(/\.td-rule-priority-pill\.pri-high/);
    expect(css).toMatch(/\.td-rule-priority-pill\.pri-medium/);

    // Pagination elements
    expect(dataTableCode).toContain("target-table-pagination-row");
    expect(dataTableCode).toContain("Total Rules:");
    expect(dataTableCode).toContain("Show per Page:");
  });

  it("4. Verifies Split Layout (Figma Frame 2147225227)", () => {
    expect(css).toMatch(/\.td-wf-rules-split-row\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.td-wf-rules-split-row\s*\{[^}]*gap:\s*24px/);
    expect(css).toMatch(/\.td-wf-rules-split-row\.with-inspector\s+\.td-wf-rules-table-card\s*\{[^}]*flex:\s*1\s+1\s+0%/);

    // Responsive collapse
    expect(css).toMatch(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.td-wf-rules-split-row\s*\{[^}]*flex-direction:\s*column/);
    expect(css).toMatch(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.td-wf-view-rule-panel\s*\{[^}]*width:\s*100%/);
  });

  it("5. Verifies View Rule Side Inspector Panel (Figma Frame 2147225086 & Frame 2147225189)", () => {
    expect(css).toMatch(/\.td-wf-view-rule-panel\s*\{[^}]*width:\s*310px/);
    expect(css).toMatch(/\.td-wf-view-rule-panel\s*\{[^}]*padding:\s*20px/);
    expect(css).toMatch(/\.td-wf-view-rule-panel\s*\{[^}]*gap:\s*24px/);
    expect(css).toMatch(/\.td-wf-view-rule-panel\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.td-wf-view-rule-panel\s*\{[^}]*border-radius:\s*6px/);

    // Header typography
    expect(css).toMatch(/\.view-rule-title\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.view-rule-title\s*\{[^}]*font-weight:\s*600/);
    expect(css).toMatch(/\.view-rule-title\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.view-rule-title\s*\{[^}]*color:\s*#64748B/);
    expect(css).toMatch(/\.view-rule-title\s*\{[^}]*text-transform:\s*uppercase/);

    // Description & Dividers
    expect(css).toMatch(/\.view-rule-desc\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.view-rule-desc\s*\{[^}]*font-size:\s*12px/);
    expect(css).toMatch(/\.view-rule-divider\s*\{[^}]*height:\s*1px/);
    expect(css).toMatch(/\.view-rule-divider\s*\{[^}]*background:\s*#EBEBEB/);

    // 3 Dividers in side panel JSX
    const dividerCount = (sidePanelCode.match(/view-rule-divider/g) || []).length;
    expect(dividerCount).toBeGreaterThanOrEqual(3);

    // Field Rows
    expect(sidePanelCode).toContain("Status");
    expect(sidePanelCode).toContain("Conditions");
    expect(sidePanelCode).toContain("Trigger");
    expect(sidePanelCode).toContain("Approval Flow");
    expect(sidePanelCode).toContain("Priority");
    expect(sidePanelCode).toContain("Executed");
    expect(sidePanelCode).toContain("Last Triggered");
    expect(sidePanelCode).toContain("Created By");
    expect(sidePanelCode).toContain("Last Updated");

    // View Rule Flow button
    expect(css).toMatch(/\.view-rule-btn-flow\s*\{[^}]*height:\s*49px/);
    expect(css).toMatch(/\.view-rule-btn-flow\s*\{[^}]*background:\s*#FFFFFF/);
    expect(sidePanelCode).toContain("view-rule-btn-flow");
    expect(sidePanelCode).toContain("View Rule Flow");
  });

  it("6. Verifies Interactive Flow Diagram Modal and URL synchronization", () => {
    expect(workflowRulesViewCode).toContain("view-rule-diagram-modal");
    expect(workflowRulesViewCode).toContain("Rule Execution Flow");
    expect(workflowRulesViewCode).toContain("updateUrlRuleParam");
    expect(workflowRulesViewCode).toContain("searchParams.get(\"rule\")");
  });

  it("7. Verifies Direct Route Handlers", () => {
    // /templates/[id]/workflow/rules -> /templates/${id}?tab=Workflow&subtab=Rules
    expect(directRoute1Code).toContain("redirect(`/templates/${id}?tab=Workflow&subtab=Rules`)");

    // /templates/[id]/workflow/rules/[ruleId] -> /templates/${id}?tab=Workflow&subtab=Rules&rule=${ruleId}
    expect(directRoute2Code).toContain("redirect(`/templates/${id}?tab=Workflow&subtab=Rules&rule=${ruleId}`)");

    // /templates/project-templates/[id]/workflow/rules
    expect(directRoute3Code).toContain("redirect(`/templates/${id}?tab=Workflow&subtab=Rules`)");

    // /templates/project-templates/[id]/workflow/rules/[ruleId]
    expect(directRoute4Code).toContain("redirect(`/templates/${id}?tab=Workflow&subtab=Rules&rule=${ruleId}`)");
  });

  it("8. Verifies Default Workflow Rules align with Figma counts and codes", () => {
    expect(rulesDomainCode).toContain("RUL-018");
    expect(rulesDomainCode).toContain("High Value Project Approval");
    expect(rulesDomainCode).toContain("12 Aug 2026");
  });
});
