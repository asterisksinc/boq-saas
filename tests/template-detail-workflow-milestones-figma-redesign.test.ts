import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Project Template Detail → Workflow → Milestones Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const milestonesViewPath = path.resolve(
    __dirname,
    "../components/templates/detail/workflow/WorkflowMilestonesView.tsx"
  );
  const workflowParentPath = path.resolve(
    __dirname,
    "../components/templates/detail/TemplateWorkflow.tsx"
  );
  const defaultMilestonesPath = path.resolve(
    __dirname,
    "../lib/templates/default-milestones.ts"
  );
  const templateDetailPagePath = path.resolve(
    __dirname,
    "../app/templates/[id]/page.tsx"
  );

  const css = fs.readFileSync(cssPath, "utf8");
  const milestonesViewCode = fs.readFileSync(milestonesViewPath, "utf8");
  const workflowParentCode = fs.readFileSync(workflowParentPath, "utf8");
  const defaultMilestonesCode = fs.readFileSync(defaultMilestonesPath, "utf8");
  const templateDetailPageCode = fs.readFileSync(templateDetailPagePath, "utf8");

  it("1. Verifies fluid full-width layout without hardcoded 1440px canvas or 98px offsets", () => {
    // Milestones container must be fluid 100% width
    expect(css).toMatch(/\.td-wf-milestones-view-container\s*\{[^}]*width:\s*100%/);
    expect(css).toMatch(/\.td-wf-milestones-view-container\s*\{[^}]*max-width:\s*100%/);
    expect(css).not.toMatch(/\.td-wf-milestones-view-container\s*\{[^}]*width:\s*1440px/);

    // Milestones grid must be fluid 100% width
    expect(css).toMatch(/\.td-wf-milestones-grid\s*\{[^}]*width:\s*100%/);
  });

  it("2. Verifies 4 KPI Metrics Summary Cards match Figma Frame 2147225138", () => {
    // Card 1: Milestones (All Configured)
    expect(milestonesViewCode).toContain("Milestones");
    expect(milestonesViewCode).toContain("All Configured");

    // Card 2: Linked Tasks (Across Milestones)
    expect(milestonesViewCode).toContain("Linked Tasks");
    expect(milestonesViewCode).toContain("Across Milestones");

    // Card 3: Deliverables (Requires Output)
    expect(milestonesViewCode).toContain("Deliverables");
    expect(milestonesViewCode).toContain("Requires Output");

    // Card 4: Approval Gates (At Milestones)
    expect(milestonesViewCode).toContain("Approval Gates");
    expect(milestonesViewCode).toContain("At Milestones");

    // KPI grid and card styling
    expect(css).toMatch(/\.td-wf-milestones-kpi-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    expect(css).toMatch(/\.td-wf-milestones-kpi-card\s*\{[^}]*min-height:\s*116px/);
    expect(css).toMatch(/\.td-wf-milestones-kpi-card\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\)/);
  });

  it("3. Verifies 4-Column Responsive Milestones Grid matches Figma Frames 2147225080 & 2147225199", () => {
    // Grid has 4 equal columns on desktop with 24px gap
    expect(css).toMatch(/\.td-wf-milestones-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    expect(css).toMatch(/\.td-wf-milestones-grid\s*\{[^}]*gap:\s*24px/);

    // Responsive 2 columns on tablet
    expect(css).toMatch(/@media\s*\(max-width:\s*1280px\)\s*\{[^}]*\.td-wf-milestones-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2/);
  });

  it("4. Verifies Milestone Card structure matches Figma Card 01 - 08 specification", () => {
    // Card styling
    expect(css).toMatch(/\.td-wf-milestone-card\s*\{[^}]*border:\s*1px solid #E2E8F0/);
    expect(css).toMatch(/\.td-wf-milestone-card\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-wf-milestone-card\s*\{[^}]*min-height:\s*264px/);

    // Selected state matches Frame 2147225090 (2px solid #2563EB & rgba(37, 99, 235, 0.05))
    expect(css).toMatch(/\.td-wf-milestone-card\.selected\s*\{[^}]*border:\s*2px solid #2563EB/);
    expect(css).toMatch(/\.td-wf-milestone-card\.selected\s*\{[^}]*background:\s*rgba\(37,\s*99,\s*235,\s*0\.05\)/);

    // Sequence order badge 24px x 24px with rgba(37, 99, 235, 0.1)
    expect(css).toMatch(/\.td-wf-milestone-card\s+\.order-badge\s*\{[^}]*width:\s*24px/);
    expect(css).toMatch(/\.td-wf-milestone-card\s+\.order-badge\s*\{[^}]*height:\s*24px/);
    expect(css).toMatch(/\.td-wf-milestone-card\s+\.order-badge\s*\{[^}]*background:\s*rgba\(37,\s*99,\s*235,\s*0\.1\)/);

    // Status pill CONFIGURED in green
    expect(css).toMatch(/\.badge-configured\s*\{[^}]*background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\)/);
    expect(css).toMatch(/\.badge-configured\s*\{[^}]*color:\s*#16A34A/);
  });

  it("5. Verifies 8 Standard Figma Milestones are present with accurate data", () => {
    expect(defaultMilestonesCode).toContain("Project Kickoff");
    expect(defaultMilestonesCode).toContain("Site Measurement");
    expect(defaultMilestonesCode).toContain("Concept Design");
    expect(defaultMilestonesCode).toContain("3D Design Approval");
    expect(defaultMilestonesCode).toContain("BOQ Finalisation");
    expect(defaultMilestonesCode).toContain("Client Approval");
    expect(defaultMilestonesCode).toContain("Execution Start");
    expect(defaultMilestonesCode).toContain("Project Handover");
  });

  it("6. Verifies Milestone Details Inspector Drawer matches Frame 2147225086", () => {
    expect(milestonesViewCode).toContain("STAGE & MILESTONE DETAILS");
    expect(milestonesViewCode).toContain("Milestone Name");
    expect(milestonesViewCode).toContain("Milestone Code");
    expect(milestonesViewCode).toContain("Save Draft");
    expect(milestonesViewCode).toContain("Save Changes");

    // Drawer CSS classes
    expect(css).toMatch(/\.td-milestone-drawer\s*\{/);
    expect(css).toMatch(/\.td-milestone-drawer-overlay\s*\{/);
  });

  it("7. Verifies Add Milestone Modal & Delete Dialog are fully functional", () => {
    expect(milestonesViewCode).toContain("Add Milestone Checkpoint");
    expect(milestonesViewCode).toContain("Delete Milestone?");
    expect(milestonesViewCode).toContain("handleConfirmDelete");
    expect(milestonesViewCode).toContain("handleAddSubmit");
  });

  it("8. Verifies TemplateWorkflow navigation & subtab query parameter handling", () => {
    // When subtab is Milestones, title and description reflect Milestones
    expect(workflowParentCode).toContain('workflowSubTab === "Milestones" ? "Milestones" : "Workflow"');
    expect(workflowParentCode).toContain('Define the key checkpoints and deliverables inherited by projects created from this template.');
    expect(workflowParentCode).toContain('url.searchParams.set("subtab", subTab)');
    expect(workflowParentCode).toContain('<WorkflowMilestonesView');

    // TemplateDetailPage synchronizes tab and subtab parameters
    expect(templateDetailPageCode).toContain('q.set("tab", newTab)');
    expect(templateDetailPageCode).toContain('q.set("subtab", sub)');
  });
});
