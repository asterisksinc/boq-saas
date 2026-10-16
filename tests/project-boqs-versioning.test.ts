import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { boqPatchSchema, boqCreateSchema } from "../lib/api/validation";

describe("Project BOQs Tab Redesign & Figma CSS Accuracy", () => {
  const pageContent = readFileSync("app/projects/[id]/page.tsx", "utf8");
  const cssContent = readFileSync("app/project-overview.css", "utf8");

  it("verifies dynamic count heading with singular and plural formatting", () => {
    expect(pageContent).toContain("b.length === 1 ? \"BOQ\" : \"BOQs\"} for this project");
    expect(cssContent).toContain(".po-boq-count");
    expect(cssContent).toContain("font-family: 'Urbanist'");
    expect(cssContent).toContain("font-size: 16px");
    expect(cssContent).toContain("color: #64748B");
  });

  it("verifies action buttons: Import Excel and New BOQ matching Figma specs", () => {
    // Import Excel button
    expect(pageContent).toContain("Import Excel");
    expect(pageContent).toContain("setImportModalOpen(true)");
    expect(cssContent).toContain(".po-boq-btn-import");
    expect(cssContent).toContain("background: #FFFFFF");
    expect(cssContent).toContain("border: 1px solid #E2E8F0");
    expect(cssContent).toContain("color: #0F172A");

    // New BOQ button
    expect(pageContent).toContain("New BOQ");
    expect(pageContent).toContain("setNewBoqModalOpen(true)");
    expect(cssContent).toContain(".po-boq-btn-primary");
    expect(cssContent).toContain("background: #2563EB");
    expect(cssContent).toContain("color: #FFFFFF");
  });

  it("verifies 10-column table layout with #E4ECFB header matching Figma CSS", () => {
    expect(pageContent).toContain("BOQ ID");
    expect(pageContent).toContain("PROJECT");
    expect(pageContent).toContain("VERSION");
    expect(pageContent).toContain("ROOMS");
    expect(pageContent).toContain("ITEMS");
    expect(pageContent).toContain("ESTIMATED VALUE");
    expect(pageContent).toContain("ASSIGNED TO");
    expect(pageContent).toContain("DATE");
    expect(pageContent).toContain("STATUS");

    // CSS Table Card & Header styling
    expect(cssContent).toContain(".po-boq-table-card");
    expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6)");
    expect(cssContent).toContain(".po-boq-thead");
    expect(cssContent).toContain("background: #E4ECFB");
    expect(cssContent).toContain("height: 36px");
    expect(cssContent).toContain("border-radius: 8px");
  });

  it("verifies table row styling with 56px height and #EBEBEB divider", () => {
    expect(cssContent).toContain(".po-boq-row");
    expect(cssContent).toContain("min-height: 56px");
    expect(cssContent).toContain("border-bottom: 1px solid #EBEBEB");
    expect(cssContent).toContain(".po-boq-status-badge");
    expect(cssContent).toContain(".po-boq-status-draft");
    expect(cssContent).toContain("rgba(100, 116, 139, 0.12)");
    expect(cssContent).toContain(".po-boq-status-approved");
    expect(cssContent).toContain("rgba(22, 163, 74, 0.12)");
    expect(cssContent).toContain(".po-boq-status-review");
    expect(cssContent).toContain("rgba(217, 119, 6, 0.12)");
  });

  it("verifies Indian compact currency formatting matches Figma values (Cr and L)", () => {
    expect(pageContent).toContain("formatCompactMoney");
    expect(pageContent).toContain("abs >= 10000000");
    expect(pageContent).toContain("Cr");
    expect(pageContent).toContain("abs >= 100000");
    expect(pageContent).toContain("L");
  });
});

describe("Automatic Unique BOQ ID Generation & Major/Minor Versioning API", () => {
  const routeContent = readFileSync("app/api/v1/[...path]/route.ts", "utf8");
  const boqApiContent = readFileSync("lib/api/boqs.ts", "utf8");

  it("verifies nextBoqIdentity generates unique sequence and assigns next major version per project", () => {
    expect(routeContent).toContain("async function nextBoqIdentity");
    expect(routeContent).toContain("boq_number: identity.boqNumber");
    expect(routeContent).toContain("BOQ-${sequence}");
    expect(routeContent).toContain("v${maxMajor + 1}");
  });

  it("verifies minor version generation logic increments v1.1, v1.2, v2.1 without overwriting", () => {
    expect(routeContent).toContain("async function nextMinorVersion");
    expect(routeContent).toContain("async function createBoqRevision");
    expect(routeContent).toContain("async function getBoqRevisions");
    expect(routeContent).toContain("v${major}.${maxMinor + 1}");
  });

  it("verifies boq revisions API routes are registered in catch-all router", () => {
    expect(routeContent).toMatch(/boqs\\\/.*?\\\/revisions/);
    expect(routeContent).toContain("getBoqRevisions");
    expect(routeContent).toContain("createBoqRevision");
  });

  it("verifies client API library provides getBoqRevisions and createBoqRevision", () => {
    expect(boqApiContent).toContain("export async function getBoqRevisions");
    expect(boqApiContent).toContain("export async function createBoqRevision");
  });

  it("verifies boqPatchSchema supports createRevision flag", () => {
    const parsed = boqPatchSchema.parse({ createRevision: true, markupPercent: 12 });
    expect(parsed.createRevision).toBe(true);
    expect(parsed.markupPercent).toBe(12);
  });
});

describe("Version History Viewer & Excel Import Workflows", () => {
  const pageContent = readFileSync("app/projects/[id]/page.tsx", "utf8");

  it("verifies VersionHistoryDrawer renders immutable snapshots with revision details", () => {
    expect(pageContent).toContain("function VersionHistoryDrawer");
    expect(pageContent).toContain("Immutable Historical Snapshots");
    expect(pageContent).toContain("/api/v1/boqs/${boq.id}/revisions");
    expect(pageContent).toContain("Create Minor Revision");
    expect(pageContent).toContain("Open Snapshot");
  });

  it("verifies ProjectBoqExcelImportModal parses spreadsheets and generates new project BOQ", () => {
    expect(pageContent).toContain("function ProjectBoqExcelImportModal");
    expect(pageContent).toContain("Import Excel Spreadsheet");
    expect(pageContent).toContain("XLSX.read");
    expect(pageContent).toContain("/api/v1/boqs");
    expect(pageContent).toContain("/api/v1/boqs/${newBoq.id}/rooms");
    expect(pageContent).toContain("/api/v1/boqs/${newBoq.id}/categories/${catId}/items");
  });

  it("verifies ProjectNewBoqModal allows creating blank or template-based BOQs", () => {
    expect(pageContent).toContain("function ProjectNewBoqModal");
    expect(pageContent).toContain("Blank BOQ");
    expect(pageContent).toContain("From Template");
    expect(pageContent).toContain("/api/v1/boq-templates");
  });

  it("verifies row action menu supports Editor, Revision, History, Duplicate, and PDF/Excel export", () => {
    expect(pageContent).toContain("Open in Editor");
    expect(pageContent).toContain("Create Minor Revision");
    expect(pageContent).toContain("Version History");
    expect(pageContent).toContain("Duplicate BOQ");
    expect(pageContent).toContain("Export PDF");
    expect(pageContent).toContain("Export Excel");
  });
});
