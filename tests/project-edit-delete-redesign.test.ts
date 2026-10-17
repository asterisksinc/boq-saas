import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("User Dashboard → Edit Project & Delete Project Modals Redesign (Figma Specifications)", () => {
  const pageSource = readFileSync("app/projects/page.tsx", "utf8");
  const cssSource = readFileSync("app/globals.css", "utf8");

  describe("Edit Project Modal (Figma Frame 2147225092 / 2147225027)", () => {
    it("renders outer modal shell with 590px max-width, rgba(255,255,255,0.6), and 16px radius", () => {
      expect(pageSource).toContain("project-modal project-edit-modal");
      expect(cssSource).toContain(".project-modal.project-edit-modal");
      expect(cssSource).toContain("width: min(590px, calc(100vw - 32px))");
      expect(cssSource).toContain("background: rgba(255, 255, 255, 0.6)");
      expect(cssSource).toContain("border-radius: 16px");
      expect(cssSource).toContain("backdrop-filter: blur(10px)");
      expect(cssSource).toContain("padding: 16px");
    });

    it("renders header Frame 2147225093 with Edit Project title, dynamic project code, and close button", () => {
      expect(pageSource).toContain("project-edit-header");
      expect(pageSource).toContain("Edit Project");
      expect(pageSource).toContain("project-edit-code");
      expect(pageSource).toContain("project-edit-close-btn");
      expect(pageSource).toContain('aria-label="Close modal"');

      expect(cssSource).toContain(".project-edit-header");
      expect(cssSource).toContain(".project-edit-title");
      expect(cssSource).toContain("font-size: 18px");
      expect(cssSource).toContain("font-weight: 600");
      expect(cssSource).toContain("color: #0F172A");
      expect(cssSource).toContain(".project-edit-code");
      expect(cssSource).toContain("color: #64748B");
      expect(cssSource).toContain(".project-edit-close-btn");
    });

    it("renders inner white panel Frame 2147225027 with 14px radius and 16px padding", () => {
      expect(pageSource).toContain("project-edit-panel");
      expect(cssSource).toContain(".project-edit-panel");
      expect(cssSource).toContain("background: #FFFFFF");
      expect(cssSource).toContain("border-radius: 14px");
      expect(cssSource).toContain("padding: 16px");
    });

    it("renders two-column input grid with 16px gap and 48px input height", () => {
      expect(pageSource).toContain("project-edit-grid");
      expect(cssSource).toContain(".project-edit-grid");
      expect(cssSource).toContain("grid-template-columns: 1fr 1fr");
      expect(cssSource).toContain("gap: 16px");

      expect(cssSource).toContain(".project-edit-input");
      expect(cssSource).toContain(".project-edit-select");
      expect(cssSource).toContain("height: 48px");
      expect(cssSource).toContain("border: 1px solid #E2E8F0");
      expect(cssSource).toContain("border-radius: 8px");
      expect(cssSource).toContain("padding: 14px 16px");
    });

    it("renders required labels with Inter 14px 500 #0F172A and red asterisk #DC2626", () => {
      expect(pageSource).toContain("project-edit-label");
      expect(pageSource).toContain("project-edit-required");
      expect(cssSource).toContain(".project-edit-label");
      expect(cssSource).toContain("color: #0F172A");
      expect(cssSource).toContain(".project-edit-required");
      expect(cssSource).toContain("color: #DC2626");
    });

    it("contains all editable fields: Name, Client, Type, Designer, Budget, Area, Location, Contact, Dates, Status, Description", () => {
      expect(pageSource).toContain("Project Name");
      expect(pageSource).toContain("Client Name");
      expect(pageSource).toContain("Project Type");
      expect(pageSource).toContain("Assigned Designer");
      expect(pageSource).toContain("Budget (₹)");
      expect(pageSource).toContain("Area (sqft)");
      expect(pageSource).toContain("Location");
      expect(pageSource).toContain("Client Contact");
      expect(pageSource).toContain("Start Date");
      expect(pageSource).toContain("Target Completion");
      expect(pageSource).toContain("Project Status");
      expect(pageSource).toContain("Project Scope / Description");
    });

    it("renders footer Frame 2147225069 with Cancel button, Configure Rooms action, and Save Changes button", () => {
      expect(pageSource).toContain("project-edit-footer");
      expect(pageSource).toContain("project-edit-cancel-btn");
      expect(pageSource).toContain("Cancel");
      expect(pageSource).toContain("project-edit-rooms-btn");
      expect(pageSource).toContain("Configure Rooms in Wizard →");
      expect(pageSource).toContain("project-edit-save-btn");
      expect(pageSource).toContain("Save Changes");

      expect(cssSource).toContain(".project-edit-footer");
      expect(cssSource).toContain(".project-edit-cancel-btn");
      expect(cssSource).toContain("border: 1px solid #E2E8F0");
      expect(cssSource).toContain("color: #0F172A");
      expect(cssSource).toContain(".project-edit-save-btn");
      expect(cssSource).toContain("background: #2563EB");
      expect(cssSource).toContain("color: #FFFFFF");
      expect(cssSource).toContain("height: 46px");
      expect(cssSource).toContain("border-radius: 6px");
    });

    it("preserves API PATCH endpoint, validation, loading states, and notification triggers", () => {
      expect(pageSource).toContain("fetch(`/api/v1/projects/${project.id}`");
      expect(pageSource).toContain('method: "PATCH"');
      expect(pageSource).toContain("Project details updated successfully.");
      expect(pageSource).toContain("Saving…");
    });
  });

  describe("Delete Project Confirmation Modal (Figma Frame 2147225092 / 2147225027)", () => {
    it("renders outer modal shell with 384px max-width, rgba(255,255,255,0.6), and 16px radius", () => {
      expect(pageSource).toContain("project-modal project-delete-modal");
      expect(cssSource).toContain(".project-modal.project-delete-modal");
      expect(cssSource).toContain("width: min(384px, calc(100vw - 32px))");
      expect(cssSource).toContain("background: rgba(255, 255, 255, 0.6)");
      expect(cssSource).toContain("border-radius: 16px");
      expect(cssSource).toContain("padding: 16px");
    });

    it("renders inner white card Frame 2147225027 with 14px radius and centered column layout", () => {
      expect(pageSource).toContain("project-delete-panel");
      expect(cssSource).toContain(".project-delete-panel");
      expect(cssSource).toContain("background: #FFFFFF");
      expect(cssSource).toContain("border-radius: 14px");
      expect(cssSource).toContain("padding: 24px 16px");
      expect(cssSource).toContain("align-items: center");
      expect(cssSource).toContain("text-align: center");
    });

    it("renders circular icon badge Frame 2147225105 with 68px diameter, #FEF2F2 background, and 28px red icon", () => {
      expect(pageSource).toContain("project-delete-icon-badge");
      expect(pageSource).toContain("project-delete-icon");
      expect(cssSource).toContain(".project-delete-icon-badge");
      expect(cssSource).toContain("width: 68px");
      expect(cssSource).toContain("height: 68px");
      expect(cssSource).toContain("background: #FEF2F2");
      expect(cssSource).toContain("border-radius: 100px");
      expect(cssSource).toContain(".project-delete-icon");
      expect(cssSource).toContain("width: 28px");
      expect(cssSource).toContain("height: 28px");
      expect(cssSource).toContain("color: #EF4444");
    });

    it("renders Delete Project title and exact Figma warning copy with dynamic project name", () => {
      expect(pageSource).toContain("project-delete-title");
      expect(pageSource).toContain("Delete Project");
      expect(pageSource).toContain("project-delete-desc");
      expect(pageSource).toContain("and all associated BOQs and data will be permanently removed. This cannot be undone.");

      expect(cssSource).toContain(".project-delete-title");
      expect(cssSource).toContain("font-size: 18px");
      expect(cssSource).toContain("font-weight: 600");
      expect(cssSource).toContain("color: #0F172A");
      expect(cssSource).toContain(".project-delete-desc");
      expect(cssSource).toContain("font-size: 14px");
      expect(cssSource).toContain("line-height: 140%");
      expect(cssSource).toContain("color: #64748B");
    });

    it("renders footer buttons Frame 2147225069 with exact Figma labels: 'No, Keep It,' and 'Yes, Delete!'", () => {
      expect(pageSource).toContain("project-delete-footer");
      expect(pageSource).toContain("project-delete-cancel-btn");
      expect(pageSource).toContain("No, Keep It,");
      expect(pageSource).toContain("project-delete-confirm-btn");
      expect(pageSource).toContain("Yes, Delete!");

      expect(cssSource).toContain(".project-delete-footer");
      expect(cssSource).toContain(".project-delete-cancel-btn");
      expect(cssSource).toContain("background: #FFFFFF");
      expect(cssSource).toContain("border: 1px solid #E2E8F0");
      expect(cssSource).toContain("color: #0F172A");

      expect(cssSource).toContain(".project-delete-confirm-btn");
      expect(cssSource).toContain("background: #EF4444");
      expect(cssSource).toContain("color: #FFFFFF");
    });

    it("preserves DELETE API integration, loading states, error retention, and dismissal", () => {
      expect(pageSource).toContain("fetch(`/api/v1/projects/${remove.id}`");
      expect(pageSource).toContain('method: "DELETE"');
      expect(pageSource).toContain("Project deleted.");
      expect(pageSource).toContain("Deleting…");
      expect(pageSource).toContain("project-delete-error");
    });
  });
});
