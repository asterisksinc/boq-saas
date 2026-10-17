import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Documents Workspace Redesign — Figma Reference 1 (Root View) Parity", () => {
  const projectPagePath = join(process.cwd(), "app", "projects", "[id]", "page.tsx");
  const cssPath = join(process.cwd(), "app", "globals.css");

  it("verifies project page exists and contains redesigned Docs component", () => {
    expect(existsSync(projectPagePath)).toBe(true);
    const content = readFileSync(projectPagePath, "utf-8");
    expect(content).toContain("function Docs(");
    expect(content).toContain('tab === "Documents"');
    expect(content).toContain("workspace-doc-container");
  });

  it("verifies root toolbar matches Figma Reference 1 (Title, Search, View Toggle, Upload, New Folder)", () => {
    const content = readFileSync(projectPagePath, "utf-8");
    expect(content).toContain('className="workspace-doc-title"');
    expect(content).toContain(">Documents</h3>");
    expect(content).toContain('className="workspace-doc-search"');
    expect(content).toContain('placeholder="Search..."');
    expect(content).toContain('className="workspace-doc-view-toggle"');
    expect(content).toContain('title="List View"');
    expect(content).toContain('title="Grid View"');
    expect(content).toContain('className="workspace-doc-btn-upload"');
    expect(content).toContain('className="workspace-doc-btn-new"');
    expect(content).toContain("New Folder");
  });

  it("verifies folder table headers match Figma Reference 1: NAME, ITEMS, SIZE, LAST MODIFIED", () => {
    const content = readFileSync(projectPagePath, "utf-8");
    expect(content).toContain("workspace-doc-table-head");
    expect(content).toContain("<div>NAME</div>");
    expect(content).toContain("<div>ITEMS</div>");
    expect(content).toContain("<div>SIZE</div>");
    expect(content).toContain("<div>LAST MODIFIED</div>");
  });

  it("verifies circular #E4ECFB badge with #2563EB folder icon is rendered for folders", () => {
    const content = readFileSync(projectPagePath, "utf-8");
    expect(content).toContain('className="workspace-doc-icon-folder"');

    const css = readFileSync(cssPath, "utf-8");
    expect(css).toContain(".workspace-doc-icon-folder");
    expect(css).toContain("background: #E4ECFB");
    expect(css).toContain("color: #2563EB");
  });

  it("verifies folder 3-dots More menu provides Open Folder, Excel export, PDF export, and Delete Folder", () => {
    const content = readFileSync(projectPagePath, "utf-8");
    expect(content).toContain("Open Folder");
    expect(content).toContain("Download Approved Files — Excel (.xlsx)");
    expect(content).toContain("Download Approved Files — PDF (.pdf)");
    expect(content).toContain("Delete Folder");
  });

  it("verifies root empty state message matches design specification", () => {
    const content = readFileSync(projectPagePath, "utf-8");
    expect(content).toContain("No folders yet. Click New Folder to organise project files.");
  });
});

describe("Documents Workspace Redesign — Figma Reference 2 (Opened Folder View) Parity", () => {
  const projectPagePath = join(process.cwd(), "app", "projects", "[id]", "page.tsx");
  const cssPath = join(process.cwd(), "app", "globals.css");

  it("verifies breadcrumb navigation: Documents › [FolderName] with back link", () => {
    const content = readFileSync(projectPagePath, "utf-8");
    expect(content).toContain("workspace-doc-breadcrumbs");
    expect(content).toContain("workspace-doc-breadcrumb-link");
    expect(content).toContain("workspace-doc-breadcrumb-sep");
    expect(content).toContain("workspace-doc-breadcrumb-current");
    expect(content).toContain("{folder.name}");
  });

  it("verifies selected folder summary card contains 40x40 #2563EB badge, items & size, last modified, and export actions", () => {
    const content = readFileSync(projectPagePath, "utf-8");
    expect(content).toContain("workspace-doc-summary-card");
    expect(content).toContain("workspace-doc-summary-badge");
    expect(content).toContain("workspace-doc-summary-name");
    expect(content).toContain("workspace-doc-summary-meta");
    expect(content).toContain("workspace-doc-summary-date");
    expect(content).toContain("Export Excel");
    expect(content).toContain("Export PDF");

    const css = readFileSync(cssPath, "utf-8");
    expect(css).toContain(".workspace-doc-summary-card");
    expect(css).toContain("min-height: 82px");
    expect(css).toContain("border: 1px solid #2563EB");
    expect(css).toContain("border-radius: 12px");
    expect(css).toContain(".workspace-doc-summary-badge");
    expect(css).toContain("background: #2563EB");
  });

  it("verifies document table headers match Figma Reference 2: NAME, PROJECT, SIZE, MODIFIED", () => {
    const content = readFileSync(projectPagePath, "utf-8");
    expect(content).toContain('workspace-doc-table-head doc-mode');
    expect(content).toContain("<div>PROJECT</div>");
    expect(content).toContain("<div>MODIFIED</div>");
  });

  it("verifies document file icon badge uses #F2F3F2 background with #64748B file icon", () => {
    const content = readFileSync(projectPagePath, "utf-8");
    expect(content).toContain('className="workspace-doc-icon-file"');

    const css = readFileSync(cssPath, "utf-8");
    expect(css).toContain(".workspace-doc-icon-file");
    expect(css).toContain("background: #F2F3F2");
    expect(css).toContain("color: #64748B");
  });

  it("verifies document row displays Approved badge and 3-dots menu with View and Delete", () => {
    const content = readFileSync(projectPagePath, "utf-8");
    expect(content).toContain("workspace-doc-approved-badge");
    expect(content).toContain("Approved");
    expect(content).toContain("<Eye");
    expect(content).toContain("View");
    expect(content).toContain("Download");
    expect(content).toContain("Delete");
    expect(content).toContain("/api/v1/documents/");
  });

  it("verifies folder empty state message matches Rule A: 'No approved files in this folder yet.'", () => {
    const content = readFileSync(projectPagePath, "utf-8");
    expect(content).toContain("No approved files in this folder yet.");
  });
});

describe("Documents Workspace Redesign — Mandatory Business Rules Enforcement", () => {
  const projectPagePath = join(process.cwd(), "app", "projects", "[id]", "page.tsx");
  const routePath = join(process.cwd(), "app", "api", "v1", "[...path]", "route.ts");

  it("Rule A: ensures folder open fetch passes approvedOnly=true and projectId", () => {
    const content = readFileSync(projectPagePath, "utf-8");
    expect(content).toContain("approvedOnly=true");
    expect(content).toContain("/api/v1/documents?folderId=");
    expect(content).toContain("projectId=");
  });

  it("Rule A: ensures backend listDocuments checks approvedOnly parameter and resolves authoritative approvals", () => {
    const content = readFileSync(routePath, "utf-8");
    expect(content).toContain('request.nextUrl.searchParams.get("approvedOnly") === "true"');
    expect(content).toContain("resolveApprovedFolderData(");
    expect(content).toContain("documentDto(row: Record<string, unknown>, isApproved?: boolean)");
    expect(content).toContain('approvalStatus: approved ? "approved" : "pending"');
  });

  it("Rule B: ensures backend routes exist for Excel & PDF export and Document Approval", () => {
    const content = readFileSync(routePath, "utf-8");
    expect(content).toContain("exportFolderExcel(");
    expect(content).toContain("exportFolderPdf(");
    expect(content).toContain("approveDocument(");

    // Route dispatcher regex matches
    expect(content).toContain("folderExportExcelMatch");
    expect(content).toContain("folderExportPdfMatch");
    expect(content).toContain("documentApproveMatch");
    expect(content).toContain("exportFolderExcel(request, supabase, id, folderExportExcelMatch[1])");
    expect(content).toContain("exportFolderPdf(request, supabase, id, folderExportPdfMatch[1])");
    expect(content).toContain("approveDocument(supabase, id, documentApproveMatch[1])");
  });

  it("Rule B: ensures server-side export returns 404 when no approved files exist", () => {
    const content = readFileSync(routePath, "utf-8");
    expect(content).toContain("No approved files available in this folder to export.");
    expect(content).toContain('fail("NOT_FOUND", "No approved files available in this folder to export.", 404, id)');
  });

  it("Rule B: ensures Excel export sets .xlsx mime type and PDF export sets application/pdf", () => {
    const content = readFileSync(routePath, "utf-8");
    expect(content).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(content).toContain("application/pdf");
    expect(content).toContain("XLSX.write(workbook, { type: \"buffer\", bookType: \"xlsx\" })");
  });

  it("Rule C: ensures Client Documents and other project tabs remain unaffected", () => {
    const clientDocPath = join(process.cwd(), "app", "client", "documents", "page.tsx");
    expect(existsSync(clientDocPath)).toBe(true);

    const projectContent = readFileSync(projectPagePath, "utf-8");
    expect(projectContent).toContain('tab === "Overview"');
    expect(projectContent).toContain('tab === "Project Details"');
    expect(projectContent).toContain('tab === "BOQs"');
    expect(projectContent).toContain('tab === "Costing"');
    expect(projectContent).toContain('tab === "Project Workspace"');
    expect(projectContent).toContain('tab === "Payments"');
    expect(projectContent).toContain('tab === "Activity Log"');
  });
});

describe("Documents Workspace Redesign — CSS Specification & Tokens", () => {
  const cssPath = join(process.cwd(), "app", "globals.css");
  const css = readFileSync(cssPath, "utf-8");

  it("verifies 56px row height matching Figma specifications", () => {
    expect(css).toContain(".workspace-doc-table-row");
    expect(css).toContain("height: 56px");
  });

  it("verifies floating dropdown menu styles (156px min-width, 16px radius, #FFFFFF, shadow)", () => {
    expect(css).toContain(".workspace-doc-dropdown");
    expect(css).toContain("min-width: 156px");
    expect(css).toContain("background: #FFFFFF");
    expect(css).toContain("border-radius: 16px");
    expect(css).toContain("z-index: 60");
    expect(css).toContain("box-shadow: 0px 16px 32px -12px rgba(14, 18, 27, 0.1)");
  });

  it("verifies table header pills with #E4ECFB background and 56px rows with #EBEBEB divider", () => {
    expect(css).toContain(".workspace-doc-table-head > div");
    expect(css).toContain("background: #E4ECFB");
    expect(css).toContain("height: 36px");
    expect(css).toContain("border-radius: 4px");
    expect(css).toContain(".workspace-doc-table-row");
    expect(css).toContain("border-bottom: 1px solid #EBEBEB");
  });

  it("verifies grid view layout and card styling", () => {
    expect(css).toContain(".workspace-doc-grid");
    expect(css).toContain(".workspace-doc-grid-card");
    expect(css).toContain("grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))");
  });

  it("verifies responsive media queries for mobile/tablet breakpoints", () => {
    expect(css).toContain("@media (max-width: 900px)");
    expect(css).toContain(".workspace-doc-table-head");
    expect(css).toContain(".workspace-doc-table-row");
  });
});

describe("Documents Workspace Redesign — Figma Frame 2147225093 (New Folder Modal) Parity", () => {
  const projectPagePath = join(process.cwd(), "app", "projects", "[id]", "page.tsx");
  const cssPath = join(process.cwd(), "app", "globals.css");
  const content = readFileSync(projectPagePath, "utf-8");
  const css = readFileSync(cssPath, "utf-8");

  it("verifies New Folder Modal structure with backdrop blur, 400px card, and Urbanist 18px title", () => {
    expect(content).toContain('newFolder &&');
    expect(content).toContain('workspace-doc-modal-backdrop');
    expect(content).toContain('workspace-doc-modal-card');
    expect(content).toContain('workspace-doc-modal-header');
    expect(content).toContain('workspace-doc-modal-title');
    expect(content).toContain('>New Folder</h3>');
    expect(content).toContain('workspace-doc-modal-close');

    expect(css).toContain(".workspace-doc-modal-backdrop");
    expect(css).toContain("background: rgba(0, 0, 0, 0.2)");
    expect(css).toContain("backdrop-filter: blur(7px)");
    expect(css).toContain(".workspace-doc-modal-card");
    expect(css).toContain("width: 400px");
    expect(css).toContain("border-radius: 16px");
    expect(css).toContain("background: rgba(255, 255, 255, 0.6)");
  });

  it("verifies inner panel with 368px width, 14px radius, Folder Name * label, and 48px input", () => {
    expect(content).toContain('workspace-doc-modal-panel');
    expect(content).toContain('workspace-doc-modal-label');
    expect(content).toContain('Folder Name');
    expect(content).toContain('placeholder="ex. Projects"');
    expect(content).toContain('workspace-doc-modal-input');

    expect(css).toContain(".workspace-doc-modal-panel");
    expect(css).toContain("background: #FFFFFF");
    expect(css).toContain("border-radius: 14px");
    expect(css).toContain(".workspace-doc-modal-input");
    expect(css).toContain("height: 48px");
    expect(css).toContain("border: 1px solid #E2E8F0");
    expect(css).toContain("border-radius: 8px");
  });

  it("verifies New Folder modal footer with Cancel (71x46px) and Create Folder (113x46px #2563EB)", () => {
    expect(content).toContain('workspace-doc-modal-footer');
    expect(content).toContain('workspace-doc-btn-cancel');
    expect(content).toContain('Cancel');
    expect(content).toContain('workspace-doc-btn-submit');
    expect(content).toContain('Create Folder');

    expect(css).toContain(".workspace-doc-btn-cancel");
    expect(css).toContain("height: 46px");
    expect(css).toContain("min-width: 71px");
    expect(css).toContain("background: #FFFFFF");
    expect(css).toContain(".workspace-doc-btn-submit");
    expect(css).toContain("height: 46px");
    expect(css).toContain("min-width: 113px");
    expect(css).toContain("background: #2563EB");
  });
});

describe("Documents Workspace Redesign — Figma Frame 2147225094 (Upload Files Modal) Parity", () => {
  const projectPagePath = join(process.cwd(), "app", "projects", "[id]", "page.tsx");
  const cssPath = join(process.cwd(), "app", "globals.css");
  const content = readFileSync(projectPagePath, "utf-8");
  const css = readFileSync(cssPath, "utf-8");

  it("verifies Upload Files Modal structure with 400px card and Urbanist 18px title", () => {
    expect(content).toContain('upload &&');
    expect(content).toContain('>Upload Files</h3>');
    expect(content).toContain('workspace-doc-modal-select');
    expect(content).toContain('Upload to');
  });

  it("verifies Frame 58 Drop Zone (336x140px, #F2F3F2, dashed border, 42px badge)", () => {
    expect(content).toContain('workspace-doc-dropzone');
    expect(content).toContain('workspace-doc-dropzone-badge');
    expect(content).toContain('Drop files here');
    expect(content).toContain('or click to browse your computer');

    expect(css).toContain(".workspace-doc-dropzone");
    expect(css).toContain("background: #F2F3F2");
    expect(css).toContain("border: 1px dashed #E2E8F0");
    expect(css).toContain("border-radius: 12px");
    expect(css).toContain(".workspace-doc-dropzone-badge");
    expect(css).toContain("width: 42px");
    expect(css).toContain("height: 42px");
    expect(css).toContain("background: #E2E4E2");
  });

  it("verifies Save & Upload button (122x46px #2563EB with disabled opacity 0.6)", () => {
    expect(content).toContain('Save & Upload');
    expect(content).toContain('disabled={!stagedFile');
    expect(css).toContain(".workspace-doc-btn-submit:disabled");
    expect(css).toContain("opacity: 0.6");
  });
});

describe("Documents Workspace Redesign — Figma Frame 2147225027 (Delete Confirmation Modals) Parity", () => {
  const projectPagePath = join(process.cwd(), "app", "projects", "[id]", "page.tsx");
  const cssPath = join(process.cwd(), "app", "globals.css");
  const content = readFileSync(projectPagePath, "utf-8");
  const css = readFileSync(cssPath, "utf-8");

  it("verifies Delete File Modal with 68px circular red danger badge (#FEF2F2 / #EF4444)", () => {
    expect(content).toContain('fileToDelete &&');
    expect(content).toContain('workspace-doc-delete-badge');
    expect(content).toContain('Delete File?');
    expect(content).toContain('This file will be permanently deleted');
    expect(content).toContain('This action cannot be undone.');

    expect(css).toContain(".workspace-doc-delete-badge");
    expect(css).toContain("width: 68px");
    expect(css).toContain("height: 68px");
    expect(css).toContain("background: #FEF2F2");
    expect(css).toContain("color: #EF4444");
  });

  it("verifies 336x70px file summary card with 40px #F2F3F2 file badge and size", () => {
    expect(content).toContain('workspace-doc-delete-file-card');
    expect(content).toContain('workspace-doc-delete-file-badge');

    expect(css).toContain(".workspace-doc-delete-file-card");
    expect(css).toContain("height: 70px");
    expect(css).toContain("background: #FFFFFF");
    expect(css).toContain("border: 1px solid #EBEBEB");
    expect(css).toContain("border-radius: 12px");
    expect(css).toContain(".workspace-doc-delete-file-badge");
    expect(css).toContain("width: 40px");
    expect(css).toContain("height: 40px");
    expect(css).toContain("background: #F2F3F2");
  });

  it("verifies checkbox confirmation 'I understand this action cannot be undone'", () => {
    expect(content).toContain('workspace-doc-checkbox-wrap');
    expect(content).toContain('I understand this action cannot be undone');
    expect(css).toContain(".workspace-doc-checkbox-wrap");
  });

  it("verifies action buttons 'No, Keep It,' and 'Yes, Delete!' with danger styling", () => {
    expect(content).toContain('No, Keep It,');
    expect(content).toContain('Yes, Delete!');
    expect(content).toContain('workspace-doc-btn-danger');

    expect(css).toContain(".workspace-doc-btn-danger");
    expect(css).toContain("background: #EF4444");
    expect(css).toContain("color: #FFFFFF");
    expect(css).toContain("height: 46px");
  });

  it("verifies Delete Folder Modal parity with matching danger badge and folder summary card", () => {
    expect(content).toContain('folderToDelete &&');
    expect(content).toContain('Delete Folder?');
    expect(content).toContain('This folder and its contents will be permanently deleted');
    expect(content).toContain('confirmDeleteFolder');
  });
});
