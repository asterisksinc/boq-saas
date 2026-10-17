import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Project Workspace: Activity Log, Invite Client & Manage Client Access Redesign", () => {
  const pagePath = path.join(process.cwd(), "app/projects/[id]/page.tsx");
  const globalsCssPath = path.join(process.cwd(), "app/globals.css");
  const routePath = path.join(process.cwd(), "app/api/v1/[...path]/route.ts");

  const pageContent = fs.readFileSync(pagePath, "utf-8");
  const cssContent = fs.readFileSync(globalsCssPath, "utf-8");
  const routeContent = fs.readFileSync(routePath, "utf-8");

  describe("1. Activity Log Component & Styling (Figma Frames 2147225071 & 2147225028)", () => {
    it("renders outer glassmorphism container (.workspace-activity-container) with 6px radius and 20px padding", () => {
      expect(pageContent).toContain('className="workspace-activity-container"');
      expect(cssContent).toContain(".workspace-activity-container");
      expect(cssContent).toContain("rgba(255, 255, 255, 0.6)");
      expect(cssContent).toContain("border-radius: 6px");
      expect(cssContent).toContain("padding: 20px");
    });

    it("renders inner activity card (.workspace-activity-card) with 14px radius, #FFFFFF background, and shadow", () => {
      expect(pageContent).toContain('className="workspace-activity-card"');
      expect(cssContent).toContain(".workspace-activity-card");
      expect(cssContent).toContain("border-radius: 14px");
      expect(cssContent).toContain("background: #FFFFFF");
      expect(cssContent).toContain("box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.06)");
    });

    it("structures each activity row with 32px user avatar (Ellipse 21) and initials", () => {
      expect(pageContent).toContain("workspace-activity-row");
      expect(pageContent).toContain("workspace-activity-avatar");
      expect(cssContent).toContain(".workspace-activity-avatar");
      expect(cssContent).toContain("width: 32px");
      expect(cssContent).toContain("height: 32px");
      expect(cssContent).toContain("border-radius: 50%");
    });

    it("renders Line 1 with author name (Urbanist 14px 500 #0F172A), action verb (Urbanist 12px 500 #64748B), and target entity (Urbanist 14px 600 #0F172A)", () => {
      expect(pageContent).toContain("workspace-activity-line1");
      expect(pageContent).toContain("workspace-activity-author");
      expect(pageContent).toContain("workspace-activity-verb");
      expect(pageContent).toContain("workspace-activity-target");
      expect(cssContent).toContain(".workspace-activity-author");
      expect(cssContent).toContain(".workspace-activity-verb");
      expect(cssContent).toContain(".workspace-activity-target");
      expect(cssContent).toContain("color: #0F172A");
      expect(cssContent).toContain("color: #64748B");
    });

    it("renders Line 2 with relative timestamp (Urbanist 12px 500 #64748B), dot separator, and category tag", () => {
      expect(pageContent).toContain("workspace-activity-line2");
      expect(pageContent).toContain("workspace-activity-time");
      expect(pageContent).toContain("workspace-activity-dot");
      expect(pageContent).toContain("workspace-activity-category");
      expect(cssContent).toContain(".workspace-activity-time");
      expect(cssContent).toContain(".workspace-activity-category");
    });

    it("includes #EBEBEB divider (Rectangle 71) between activity rows", () => {
      expect(pageContent).toContain("workspace-activity-divider");
      expect(cssContent).toContain(".workspace-activity-divider");
      expect(cssContent).toContain("background: #EBEBEB");
      expect(cssContent).toContain("height: 1px");
    });

    it("provides responsive category filter pills with active state", () => {
      expect(pageContent).toContain("workspace-activity-filters");
      expect(pageContent).toContain("workspace-activity-filter-btn");
      expect(cssContent).toContain(".workspace-activity-filter-btn.active");
      expect(cssContent).toContain("color: #2563EB");
    });
  });

  describe("2. Invite Client Modal Redesign (Figma Frames 2147225093 & 2147225027)", () => {
    it("implements frosted backdrop and 590px modal card (.workspace-client-modal-card)", () => {
      expect(pageContent).toContain("workspace-client-modal-backdrop");
      expect(pageContent).toContain("workspace-client-modal-card");
      expect(cssContent).toContain(".workspace-client-modal-card");
      expect(cssContent).toContain("width: 590px");
      expect(cssContent).toContain("border-radius: 16px");
      expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6)");
    });

    it("renders project metadata banner (Frame 2147225360) with project ID and name", () => {
      expect(pageContent).toContain("workspace-client-meta-banner");
      expect(pageContent).toContain("workspace-client-meta-label");
      expect(pageContent).toContain("workspace-client-meta-value");
      expect(pageContent).toContain(">ID<");
      expect(pageContent).toContain(">PROJECT<");
      expect(cssContent).toContain(".workspace-client-meta-banner");
      expect(cssContent).toContain("background: rgba(226, 232, 240, 0.2)");
      expect(cssContent).toContain("border: 1px solid #E2E8F0");
    });

    it("renders 2-column input grid for Client Name and Client Email (48px height, 8px radius)", () => {
      expect(pageContent).toContain("workspace-client-form-grid");
      expect(pageContent).toContain("Client Name");
      expect(pageContent).toContain("Client Email");
      expect(cssContent).toContain(".workspace-client-form-grid");
      expect(cssContent).toContain(".workspace-client-input");
      expect(cssContent).toContain("height: 48px");
      expect(cssContent).toContain("border-radius: 8px");
    });

    it("renders full-width Personal Message textarea with 116px minimum height", () => {
      expect(pageContent).toContain("Personal Message");
      expect(pageContent).toContain("workspace-client-textarea");
      expect(pageContent).toContain("Add notes for your client...");
      expect(cssContent).toContain(".workspace-client-textarea");
      expect(cssContent).toContain("min-height: 116px");
    });

    it("renders Cancel button and primary Send Invitation button (#2563EB)", () => {
      expect(pageContent).toContain("workspace-client-btn-cancel");
      expect(pageContent).toContain("workspace-client-btn-primary");
      expect(pageContent).toContain("Send Invitation");
      expect(cssContent).toContain(".workspace-client-btn-primary");
      expect(cssContent).toContain("background: #2563EB");
      expect(cssContent).toContain("border-radius: 6px");
    });
  });

  describe("3. Manage Client Access Modal Redesign (Figma Frame 2147225569)", () => {
    it("renders Manage Client Access title and subtitle", () => {
      expect(pageContent).toContain("Manage Client Access");
      expect(pageContent).toContain("Configure client viewing privileges for this shared project dashboard.");
    });

    it("renders destructive Revoke Access action with #D90606 styling and trash icon", () => {
      expect(pageContent).toContain("workspace-client-btn-revoke");
      expect(pageContent).toContain("Revoke Access");
      expect(cssContent).toContain(".workspace-client-btn-revoke");
      expect(cssContent).toContain("color: #D90606");
    });

    it("renders Save & Send Updates primary button (#2563EB) in footer action group", () => {
      expect(pageContent).toContain("workspace-client-footer-actions");
      expect(pageContent).toContain("Save & Send Updates");
    });

    it("exports ManageClientAccessModal component for direct access", () => {
      expect(pageContent).toContain("function ManageClientAccessModal");
    });
  });

  describe("4. Backend API Integration & Revocation Handler", () => {
    it("defines DELETE method dispatching for projects/:id/client-invite", () => {
      expect(routeContent).toContain('if (projectClientInviteMatch && request.method === "DELETE") return revokeProjectClientInvite');
    });

    it("implements revokeProjectClientInvite with database update, settings synchronization, and audit logging", () => {
      expect(routeContent).toContain("async function revokeProjectClientInvite");
      expect(routeContent).toContain('status: "revoked"');
      expect(routeContent).toContain("project.client_access_revoked");
      expect(routeContent).toContain("Client access has been revoked successfully.");
    });
  });
});
