import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Project Template Detail → Workflow → Approvals Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const approvalsViewPath = path.resolve(
    __dirname,
    "../components/templates/detail/workflow/WorkflowApprovalsView.tsx"
  );
  const workflowParentPath = path.resolve(
    __dirname,
    "../components/templates/detail/TemplateWorkflow.tsx"
  );
  const defaultApprovalsPath = path.resolve(
    __dirname,
    "../lib/templates/default-approvals.ts"
  );
  const redirectRoute1Path = path.resolve(
    __dirname,
    "../app/templates/[id]/workflow/approvals/page.tsx"
  );
  const redirectRoute2Path = path.resolve(
    __dirname,
    "../app/templates/project-templates/[id]/workflow/approvals/page.tsx"
  );

  const css = fs.readFileSync(cssPath, "utf8");
  const approvalsViewCode = fs.readFileSync(approvalsViewPath, "utf8");
  const workflowParentCode = fs.readFileSync(workflowParentPath, "utf8");
  const defaultApprovalsCode = fs.readFileSync(defaultApprovalsPath, "utf8");
  const redirectRoute1Code = fs.readFileSync(redirectRoute1Path, "utf8");
  const redirectRoute2Code = fs.readFileSync(redirectRoute2Path, "utf8");

  it("1. Verifies fluid container layout without rigid wrappers", () => {
    expect(css).toMatch(/\.td-wf-approvals-container\s*\{[^}]*width:\s*100%/);
    expect(css).toMatch(/\.td-wf-approvals-table-card\s*\{[^}]*width:\s*100%/);
    expect(css).toMatch(/\.td-approval-preview-section-figma\s*\{[^}]*width:\s*100%/);
  });

  it("2. Verifies 4 Approval Summary Cards match Figma Frame 2147225138", () => {
    // Card 1: Approval Flows (All Configured)
    expect(approvalsViewCode).toContain("Approval Flows");
    expect(approvalsViewCode).toContain("All Configured");

    // Card 2: Active (Ready to Use)
    expect(approvalsViewCode).toContain("Active");
    expect(approvalsViewCode).toContain("Ready to Use");

    // Card 3: Draft (In-Progress)
    expect(approvalsViewCode).toContain("Draft");
    expect(approvalsViewCode).toContain("In-Progress");

    // Card 4: Needs Attention (Config Issues)
    expect(approvalsViewCode).toContain("Needs Attention");
    expect(approvalsViewCode).toContain("Config Issues");

    // KPI grid and card styling in CSS
    expect(css).toMatch(/\.td-wf-approvals-kpi-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
    expect(css).toMatch(/\.td-wf-approvals-kpi-card\s*\{[^}]*height:\s*116px/);
    expect(css).toMatch(/\.td-wf-approvals-kpi-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
  });

  it("3. Verifies 10-Column Approval Flows Table matches Figma Frame 2147225085", () => {
    // 10 Column Headers
    expect(approvalsViewCode).toContain("FLOW NAME");
    expect(approvalsViewCode).toContain("TRIGGER");
    expect(approvalsViewCode).toContain("STAGES");
    expect(approvalsViewCode).toContain("APPROVERS");
    expect(approvalsViewCode).toContain("SLA");
    expect(approvalsViewCode).toContain("STATUS");
    expect(approvalsViewCode).toContain("LAST UPDATED");

    // Table header background #E4ECFB and height 36px
    expect(css).toMatch(/\.td-wf-approvals-datatable thead tr\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.td-wf-approvals-datatable thead tr\s*\{[^}]*height:\s*36px/);

    // Row height 56px and divider
    expect(css).toMatch(/\.td-wf-approvals-datatable tbody tr\s*\{[^}]*height:\s*56px/);

    // Approver avatar badges (Ellipse 22 - 32px colored circles)
    expect(css).toMatch(/\.td-approver-avatar-bubble\s*\{[^}]*width:\s*32px/);
    expect(css).toMatch(/\.td-approver-avatar-bubble\s*\{[^}]*height:\s*32px/);
    expect(css).toMatch(/\.td-approver-avatar-bubble\.red\s*\{[^}]*color:\s*#DC2626/);
    expect(css).toMatch(/\.td-approver-avatar-bubble\.green\s*\{[^}]*color:\s*#16A34A/);
    expect(css).toMatch(/\.td-approver-avatar-bubble\.blue\s*\{[^}]*color:\s*#2563EB/);

    // Status pill
    expect(css).toMatch(/\.td-figma-status-pill\.status-active\s*\{[^}]*color:\s*#16A34A/);
    expect(css).toMatch(/\.td-figma-status-pill\.status-draft\s*\{[^}]*color:\s*#CA8A04/);
    expect(css).toMatch(/\.td-figma-status-pill\.status-attention\s*\{[^}]*color:\s*#DC2626/);
  });

  it("4. Verifies Pagination footer matches Figma Frame 2147225165", () => {
    expect(approvalsViewCode).toContain("Total Approvals:");
    expect(approvalsViewCode).toContain("Show per Page:");
    expect(approvalsViewCode).toContain("target-table-pagination-row");
    expect(approvalsViewCode).toContain("target-table-page-btn");
  });

  it("5. Verifies Approval Flow Preview matches Figma Frame 2147225199", () => {
    expect(approvalsViewCode).toContain("Approval Flow Preview");
    expect(approvalsViewCode).toContain("TRIGGER");
    expect(approvalsViewCode).toContain("on Approval");

    // Preview grid & cards
    expect(css).toMatch(/\.td-approval-preview-section-figma\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.preview-steps-grid-figma\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
    expect(css).toMatch(/\.preview-step-card-figma\s*\{[^}]*border-radius:\s*14px/);
    expect(css).toMatch(/\.preview-step-card-figma\s*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(/\.preview-step-card-figma \.step-title-figma\s*\{[^}]*font-size:\s*28px/);
  });

  it("6. Verifies Standard 6 Figma Approval Flows in default-approvals.ts", () => {
    expect(defaultApprovalsCode).toContain("APR-TPL-001");
    expect(defaultApprovalsCode).toContain("Design Concept Approval");

    expect(defaultApprovalsCode).toContain("APR-TPL-002");
    expect(defaultApprovalsCode).toContain("BOQ Approval");

    expect(defaultApprovalsCode).toContain("APR-TPL-003");
    expect(defaultApprovalsCode).toContain("Material Approval");

    expect(defaultApprovalsCode).toContain("APR-TPL-004");
    expect(defaultApprovalsCode).toContain("Final Design Approval");

    expect(defaultApprovalsCode).toContain("APR-TPL-005");
    expect(defaultApprovalsCode).toContain("Budget Approval");

    expect(defaultApprovalsCode).toContain("APR-TPL-006");
    expect(defaultApprovalsCode).toContain("Change Request Approval");
  });

  it("7. Verifies Direct Redirect Routes exist for Approvals subtab", () => {
    expect(redirectRoute1Code).toContain("redirect(`/templates/${id}?tab=Workflow&subtab=Approvals`)");
    expect(redirectRoute2Code).toContain("redirect(`/templates/${id}?tab=Workflow&subtab=Approvals`)");
  });

  it("8. Verifies TemplateWorkflow toolbar handles Approvals dynamically", () => {
    expect(workflowParentCode).toContain('workflowSubTab === "Approvals"');
    expect(workflowParentCode).toContain("Configure the approval flows inherited by projects created from this template.");
    expect(workflowParentCode).toContain("Search approvals…");
    expect(workflowParentCode).toContain("Add Approval Flow");
  });
});
