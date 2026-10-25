import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Templates - Project Templates - Template Detail - Workflow - Approvals - View Approval Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const approvalsViewPath = path.resolve(
    __dirname,
    "../components/templates/detail/workflow/WorkflowApprovalsView.tsx"
  );
  const defaultApprovalsPath = path.resolve(
    __dirname,
    "../lib/templates/default-approvals.ts"
  );
  const directRoute1Path = path.resolve(
    __dirname,
    "../app/templates/[id]/workflow/approvals/[approvalId]/page.tsx"
  );
  const directRoute2Path = path.resolve(
    __dirname,
    "../app/templates/project-templates/[id]/workflow/approvals/[approvalId]/page.tsx"
  );

  const css = fs.readFileSync(cssPath, "utf8");
  const approvalsViewCode = fs.readFileSync(approvalsViewPath, "utf8");
  const defaultApprovalsCode = fs.readFileSync(defaultApprovalsPath, "utf8");
  const directRoute1Code = fs.readFileSync(directRoute1Path, "utf8");
  const directRoute2Code = fs.readFileSync(directRoute2Path, "utf8");

  it("1. Verifies Split Layout (Frame 2147225224) and responsive container structure", () => {
    // Split row container
    expect(css).toMatch(/\.td-wf-approvals-split-row\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.td-wf-approvals-split-row\s*\{[^}]*gap:\s*24px/);
    expect(css).toMatch(/\.td-wf-approvals-split-row\.with-inspector\s+\.td-wf-approvals-table-card\s*\{[^}]*flex:\s*1\s+1\s+0%/);

    // Responsive collapse under 1100px
    expect(css).toMatch(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.td-wf-approvals-split-row\s*\{[^}]*flex-direction:\s*column/);
    expect(css).toMatch(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.td-wf-view-approval-panel\s*\{[^}]*width:\s*100%/);
  });

  it("2. Verifies View Approval Inspector Side Panel (Frame 2147225086) styling tokens", () => {
    expect(css).toMatch(/\.td-wf-view-approval-panel\s*\{[^}]*width:\s*310px/);
    expect(css).toMatch(/\.td-wf-view-approval-panel\s*\{[^}]*padding:\s*20px/);
    expect(css).toMatch(/\.td-wf-view-approval-panel\s*\{[^}]*gap:\s*24px/);
    expect(css).toMatch(/\.td-wf-view-approval-panel\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.td-wf-view-approval-panel\s*\{[^}]*border-radius:\s*6px/);
  });

  it("3. Verifies Header & Typography (Frame 2147225209)", () => {
    // Title in uppercase, font Urbanist, 14px, 600, color #64748B
    expect(css).toMatch(/\.view-apr-title\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.view-apr-title\s*\{[^}]*font-weight:\s*600/);
    expect(css).toMatch(/\.view-apr-title\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.view-apr-title\s*\{[^}]*color:\s*#64748B/);
    expect(css).toMatch(/\.view-apr-title\s*\{[^}]*text-transform:\s*uppercase/);

    // Metadata font Urbanist, 14px, 400, color #64748B
    expect(css).toMatch(/\.view-apr-meta\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.view-apr-meta\s*\{[^}]*font-weight:\s*400/);
    expect(css).toMatch(/\.view-apr-meta\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.view-apr-meta\s*\{[^}]*color:\s*#64748B/);

    // Close button
    expect(approvalsViewCode).toContain("view-apr-close-btn");
    expect(approvalsViewCode).toContain("handleCloseInspector");
  });

  it("4. Verifies Description & Divider lines (Rectangles 75, 76, 77)", () => {
    expect(css).toMatch(/\.view-apr-desc\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.view-apr-desc\s*\{[^}]*font-size:\s*12px/);
    expect(css).toMatch(/\.view-apr-desc\s*\{[^}]*color:\s*#64748B/);

    // Dividers: 1px height, background #EBEBEB
    expect(css).toMatch(/\.view-apr-divider\s*\{[^}]*height:\s*1px/);
    expect(css).toMatch(/\.view-apr-divider\s*\{[^}]*background:\s*#EBEBEB/);

    // Ensure 3 dividers exist in panel JSX
    const dividerMatches = (approvalsViewCode.match(/view-apr-divider/g) || []).length;
    expect(dividerMatches).toBeGreaterThanOrEqual(3);
  });

  it("5. Verifies Field Rows match Figma Frames (Status, Trigger, Mode, Stages, SLA, Created By, Last Updated)", () => {
    expect(approvalsViewCode).toContain("view-apr-field-row");
    expect(approvalsViewCode).toContain("Status");
    expect(approvalsViewCode).toContain("Trigger");
    expect(approvalsViewCode).toContain("Approval Mode");
    expect(approvalsViewCode).toContain("Stages");
    expect(approvalsViewCode).toContain("SLA");
    expect(approvalsViewCode).toContain("Created By");
    expect(approvalsViewCode).toContain("Last Updated");

    // CSS field row styles
    expect(css).toMatch(/\.view-apr-field-row\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.view-apr-field-row\s*\{[^}]*justify-content:\s*space-between/);
    expect(css).toMatch(/\.view-apr-field-row \.field-lbl\s*\{[^}]*color:\s*#64748B/);
    expect(css).toMatch(/\.view-apr-field-row \.val-main\s*\{[^}]*color:\s*#0F172A/);
    expect(css).toMatch(/\.view-apr-field-row \.val-sub\s*\{[^}]*color:\s*#64748B/);
  });

  it("6. Verifies View Flow Button (Frame 2147225189)", () => {
    // Button styling: 49px height, white background, shadow 0px 0px 6px rgba(0,0,0,0.06), radius 6px
    expect(css).toMatch(/\.view-apr-btn-view-flow\s*\{[^}]*height:\s*49px/);
    expect(css).toMatch(/\.view-apr-btn-view-flow\s*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(/\.view-apr-btn-view-flow\s*\{[^}]*box-shadow:\s*0px\s*0px\s*6px\s*rgba\(0,\s*0,\s*0,\s*0\.06\)/);
    expect(css).toMatch(/\.view-apr-btn-view-flow\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.view-apr-btn-view-flow span\s*\{[^}]*color:\s*#0F172A/);
    expect(css).toMatch(/\.view-apr-btn-view-flow span\s*\{[^}]*font-weight:\s*600/);

    // JSX button with click handler to open flow diagram
    expect(approvalsViewCode).toContain("view-apr-btn-view-flow");
    expect(approvalsViewCode).toContain("setIsViewFlowModalOpen(true)");
    expect(approvalsViewCode).toContain("View Flow");
  });

  it("7. Verifies Interactive View Flow Diagram Modal", () => {
    expect(approvalsViewCode).toContain("view-flow-diagram-modal");
    expect(approvalsViewCode).toContain("flow-stepper-track");
    expect(approvalsViewCode).toContain("flow-stepper-node");
    expect(approvalsViewCode).toContain("trigger-node");
    expect(approvalsViewCode).toContain("stage-node");
    expect(approvalsViewCode).toContain("approved-node");
    expect(approvalsViewCode).toContain("flow-step-connector");

    // Modal CSS
    expect(css).toMatch(/\.view-flow-diagram-modal\s*\{[^}]*max-width:\s*860px/);
    expect(css).toMatch(/\.flow-step-connector\s*\{[^}]*width:\s*2px/);
    expect(css).toMatch(/\.flow-step-connector\s*\{[^}]*background:\s*#CBD5E1/);
  });

  it("8. Verifies Default Data contains exact Figma values", () => {
    expect(defaultApprovalsCode).toContain("APR-TPL-001");
    expect(defaultApprovalsCode).toContain("Design Concept Approval");
    expect(defaultApprovalsCode).toContain("v2.1");
    expect(defaultApprovalsCode).toContain("Approval required before design process from concept to development to execution planning.");
    expect(defaultApprovalsCode).toContain("04 Aug 2026");
    expect(defaultApprovalsCode).toContain("12 Aug 2026");
    expect(defaultApprovalsCode).toContain("Admin User");
    expect(defaultApprovalsCode).toContain("2 Business Days");
  });

  it("9. Verifies Direct URL Synchronization & Redirect Routes for [approvalId]", () => {
    // Reads query parameters ?flow= or ?approvalId=
    expect(approvalsViewCode).toContain('searchParams?.get("flow") || searchParams?.get("approvalId")');

    // Direct route handlers redirect to template workflow with flow query param
    expect(directRoute1Code).toContain("redirect(`/templates/${id}?tab=Workflow&subtab=Approvals&flow=${approvalId}`)");
    expect(directRoute2Code).toContain("redirect(`/templates/${id}?tab=Workflow&subtab=Approvals&flow=${approvalId}`)");
  });
});
