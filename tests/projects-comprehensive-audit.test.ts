import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  projectCreateSchema,
  projectPatchSchema,
  projectRoomCreateSchema,
  paymentCreateSchema,
} from "../lib/api/validation";

describe("Projects Comprehensive Audit & Implementation Tests", () => {
  const wizardPage = readFileSync("app/projects/page.tsx", "utf8");
  const projectPage = readFileSync("app/projects/[id]/page.tsx", "utf8");
  const routeApi = readFileSync("app/api/v1/[...path]/route.ts", "utf8");

  describe("Phase 2 — Create Project: Room Dimensions, Requirements & Cover Image", () => {
    it("verifies Step 3 Room Dimensions includes Room References upload card", () => {
      expect(wizardPage).toContain("ROOM REFERENCES");
      expect(wizardPage).toContain("Upload room reference image");
      expect(wizardPage).toContain("handleUploadRoomRef");
      expect(wizardPage).toContain("referenceImageUrl");
      expect(wizardPage).toContain("Replace");
      expect(wizardPage).toContain("Remove");
    });

    it("verifies Step 3 dynamic measurements enforces non-negative values", () => {
      expect(wizardPage).toContain("Math.max(0, Number(e.target.value))");
      expect(wizardPage).toContain("const area = l * w;");
      expect(wizardPage).toContain("const volume = l * w * h;");
    });

    it("verifies Step 4 Requirements includes Requirement References image upload", () => {
      expect(wizardPage).toContain("Requirement References");
      expect(wizardPage).toContain("handleUploadReqRef");
      expect(wizardPage).toContain("uploadingReqRef");
    });

    it("verifies Project Cover Image is wired in Step 1 to storage upload", () => {
      expect(wizardPage).toContain("/api/v1/projects/upload-image");
      expect(wizardPage).toContain("coverImage: coverUrl");
      expect(wizardPage).toContain("imageUrl: coverUrl");
    });

    it("validates paymentCreateSchema supports receiptUrl and milestone fields", () => {
      const parsed = paymentCreateSchema.parse({
        amount: 50000,
        method: "bank_transfer",
        reference: "UTR-83921",
        receiptUrl: "https://storage.example.com/receipt.pdf",
        milestone: "Advance Booking (20%)",
        notes: "RTGS confirmed",
      });
      expect(parsed.receiptUrl).toBe("https://storage.example.com/receipt.pdf");
      expect(parsed.milestone).toBe("Advance Booking (20%)");
    });
  });

  describe("Phase 3 & 4 — Project Overview and Project Details", () => {
    it("verifies header action button order is strictly preserved", () => {
      const reviewIdx = projectPage.indexOf("Review Pending Actions");
      const inviteIdx = projectPage.indexOf("Send Invite to Client");
      const editIdx = projectPage.indexOf("Edit Project");
      expect(reviewIdx).toBeGreaterThan(-1);
      expect(inviteIdx).toBeGreaterThan(reviewIdx);
      expect(editIdx).toBeGreaterThan(inviteIdx);
    });

    it("verifies Project Overview evaluates 5 health dimensions", () => {
      expect(projectPage).toContain("budgetHealth");
      expect(projectPage).toContain("boqHealth");
      expect(projectPage).toContain("timelineHealth");
      expect(projectPage).toContain("paymentsHealth");
      expect(projectPage).toContain("procurementHealth");
      expect(projectPage).toContain("Project Health");
      expect(projectPage).toContain("Next Actions for this Project");
    });

    it("verifies Project Details renders the 6 two-column cards matching reference design", () => {
      expect(projectPage).toContain('title="Project Identity"');
      expect(projectPage).toContain('title="Location"');
      expect(projectPage).toContain('title="Client Information"');
      expect(projectPage).toContain('title="Timeline & Schedule"');
      expect(projectPage).toContain('title="Commercial Information"');
      expect(projectPage).toContain('title="Ownership & Team"');
      expect(projectPage).toContain("Edit Details");
    });

    it("verifies EditProjectModal persists extended metadata fields", () => {
      expect(projectPage).toContain("propertyName");
      expect(projectPage).toContain("siteAccessNotes");
      expect(projectPage).toContain("billingContact");
      expect(projectPage).toContain("communicationPreference");
      expect(projectPage).toContain("actualStartDate");
      expect(projectPage).toContain("taxConfiguration");
      expect(projectPage).toContain("targetMargin");
      expect(projectPage).toContain("paymentTerms");
      expect(projectPage).toContain("contractReference");
      expect(projectPage).toContain("projectManager");
      expect(projectPage).toContain("leadDesigner");
      expect(projectPage).toContain("estimator");
      expect(projectPage).toContain("procurementOwner");
      expect(projectPage).toContain("financeOwner");
    });
  });

  describe("Phase 5 & 6 — Costing Integration and Project Workspace", () => {
    it("verifies Costing tab accepts project and boqs, loads project-scoped analysis & items", () => {
      expect(projectPage).toContain("<Costing p={p} b={boqs} />");
      expect(projectPage).toContain("/api/v1/costing/items?projectId=");
      expect(projectPage).toContain("getCostingAnalysis({ projectId: p.id })");
      expect(projectPage).toContain("Category-wise Cost Breakdown");
      expect(projectPage).toContain("Costing Items");
    });

    it("verifies Project Workspace displays 5 KPI cards with red highlight and STAGES/TASKS cards", () => {
      expect(projectPage).toContain("Current Phase");
      expect(projectPage).toContain("Overall Progress");
      expect(projectPage).toContain("Next Stage");
      expect(projectPage).toContain("Overdue Tasks");
      expect(projectPage).toContain("Open Issues / Tasks");
      expect(projectPage).toContain("STAGES");
      expect(projectPage).toContain("OPEN TASKS");
      expect(projectPage).toContain("Overdue by");
      expect(projectPage).toContain("Add Workspace Task");
    });
  });

  describe("Phase 7, 8 & 9 — Documents, Payments, and Activity Log", () => {
    it("verifies Documents toolbar button order: New Folder -> Upload -> View Toggles", () => {
      const docHeader = projectPage.slice(projectPage.indexOf('className="documents"'));
      const newFolderIdx = docHeader.indexOf("New Folder");
      const uploadIdx = docHeader.indexOf("Upload");
      const listIdx = docHeader.indexOf("List View");
      const gridIdx = docHeader.indexOf("Grid View");

      expect(newFolderIdx).toBeGreaterThan(-1);
      expect(uploadIdx).toBeGreaterThan(newFolderIdx);
      expect(listIdx).toBeGreaterThan(uploadIdx);
      expect(gridIdx).toBeGreaterThan(listIdx);
    });

    it("verifies PaymentDetailsDrawer slide panel renders transaction details and timeline", () => {
      expect(projectPage).toContain("PaymentDetailsDrawer");
      expect(projectPage).toContain("TRANSACTION RECORD");
      expect(projectPage).toContain("Transaction Metadata");
      expect(projectPage).toContain("Payment Timeline");
      expect(projectPage).toContain("Payment Receipt");
    });

    it("verifies RecordPaymentModal includes 2-column layout with receipt upload and notes", () => {
      expect(projectPage).toContain("RecordPaymentModal");
      expect(projectPage).toContain("Payment For (Milestone)");
      expect(projectPage).toContain("Linked Invoice *");
      expect(projectPage).toContain("Amount Received (₹) *");
      expect(projectPage).toContain("Reference / Cheque / UTR ID");
      expect(projectPage).toContain("Payment Date *");
      expect(projectPage).toContain("Payment Time");
      expect(projectPage).toContain("Receipt / Proof of Payment");
      expect(projectPage).toContain("Notes / Remarks");
    });

    it("verifies Activity Log connects to project activities endpoint with category filters", () => {
      expect(projectPage).toContain("/api/v1/projects/${encodeURIComponent(pId)}/activities");
      expect(projectPage).toContain("Project Activity Log");
      expect(routeApi).toContain("getProjectActivities");
    });
  });
});
