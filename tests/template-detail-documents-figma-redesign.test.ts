import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Templates - Project Templates - Template Detail - Documents Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const templateDocumentsPath = path.resolve(
    __dirname,
    "../components/templates/detail/TemplateDocuments.tsx"
  );
  const defaultDocsPath = path.resolve(
    __dirname,
    "../lib/templates/default-documents.ts"
  );
  const directRoute1Path = path.resolve(
    __dirname,
    "../app/templates/[id]/documents/page.tsx"
  );
  const directRoute2Path = path.resolve(
    __dirname,
    "../app/templates/project-templates/[id]/documents/page.tsx"
  );

  const css = fs.readFileSync(cssPath, "utf8");
  const templateDocsCode = fs.readFileSync(templateDocumentsPath, "utf8");
  const defaultDocsCode = fs.readFileSync(defaultDocsPath, "utf8");
  const directRoute1Code = fs.readFileSync(directRoute1Path, "utf8");
  const directRoute2Code = fs.readFileSync(directRoute2Path, "utf8");

  it("1. Verifies Section Header & Toolbar (Figma Frame 2147225198)", () => {
    // Header layout
    expect(css).toMatch(/\.td-doc-header-row\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.td-doc-heading\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.td-doc-heading\s*\{[^}]*font-size:\s*24px/);
    expect(css).toMatch(/\.td-doc-heading\s*\{[^}]*font-weight:\s*600/);

    expect(css).toMatch(/\.td-doc-count-sub\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.td-doc-count-sub\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.td-doc-count-sub\s*\{[^}]*color:\s*#64748B/);

    // Search Box (Frame 76)
    expect(css).toMatch(/\.td-doc-search-box\s*\{[^}]*width:\s*260px/);
    expect(css).toMatch(/\.td-doc-search-box\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-doc-search-box\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\)/);
    expect(css).toMatch(/\.td-doc-search-box\s*\{[^}]*border-radius:\s*8px/);

    // Buttons (Frame 2147225194)
    expect(css).toMatch(/\.td-doc-filter-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-doc-filter-btn\s*\{[^}]*border:\s*1px\s+solid\s+#E2E8F0/);
    expect(css).toMatch(/\.td-doc-filter-btn\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-doc-upload-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-doc-upload-btn\s*\{[^}]*background:\s*#2563EB/);
  });

  it("2. Verifies Main Table Card & Header (Figma Frame 2147225199 & Frame 57)", () => {
    // Table card
    expect(css).toMatch(/\.td-doc-table-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.td-doc-table-card\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-doc-table-card\s*\{[^}]*padding:\s*20px/);

    // Table Header (Frame 57: #E4ECFB, 36px height)
    expect(css).toMatch(/\.td-doc-table\s+thead\s+tr\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.td-doc-table\s+thead\s+tr\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/\.td-doc-table\s+th\s*\{[^}]*color:\s*#64748B/);
    expect(css).toMatch(/\.td-doc-table\s+th\s*\{[^}]*text-transform:\s*uppercase/);

    // Columns present in JSX
    expect(templateDocsCode).toContain("NAME");
    expect(templateDocsCode).toContain("CATEGORY");
    expect(templateDocsCode).toContain("SIZE");
    expect(templateDocsCode).toContain("DATE");
  });

  it("3. Verifies Table Rows & Cell Typography (Figma Frames 59, 83, 81, 82, 84, 85)", () => {
    // Row height 56px and border #EBEBEB
    expect(css).toMatch(/\.td-doc-table\s+tbody\s+tr\s*\{[^}]*height:\s*56px/);
    expect(css).toMatch(/\.td-doc-table\s+tbody\s+tr\s*\{[^}]*border-bottom:\s*1px\s+solid\s+#EBEBEB/);

    // Name text
    expect(css).toMatch(/\.td-doc-name-text\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.td-doc-name-text\s*\{[^}]*font-weight:\s*500/);
    expect(css).toMatch(/\.td-doc-name-text\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.td-doc-name-text\s*\{[^}]*color:\s*#0F172A/);

    // Category badge (Frame 2147225014)
    expect(css).toMatch(/\.td-doc-category-badge\s*\{[^}]*background:\s*rgba\(100,\s*116,\s*139,\s*0\.12\)/);
    expect(css).toMatch(/\.td-doc-category-badge\s*\{[^}]*border-radius:\s*9999px/);
    expect(css).toMatch(/\.td-doc-category-badge\s*\{[^}]*color:\s*#64748B/);

    // Size & Date typography
    expect(css).toMatch(/\.td-doc-size-text\s*\{[^}]*color:\s*#64748B/);
    expect(css).toMatch(/\.td-doc-date-text\s*\{[^}]*color:\s*#64748B/);
  });

  it("4. Verifies Bottom Pagination (Figma Frame 2147225166)", () => {
    expect(templateDocsCode).toContain("target-table-pagination-row");
    expect(templateDocsCode).toContain("Total Documents:");
    expect(templateDocsCode).toContain("Show per Page:");
  });

  it("5. Verifies Default Documents align with Figma specification", () => {
    expect(defaultDocsCode).toContain("BOQ v7 Final — Kohinoor L4.pdf");
    expect(defaultDocsCode).toContain("Floor Plan — Level 4.dwg");
    expect(defaultDocsCode).toContain("Material Cost Matrix Aug 2024.xlsx");
    expect(defaultDocsCode).toContain("Client Proposal FINAL.pdf");
    expect(defaultDocsCode).toContain("Vendor Quotes — Stone World.xlsx");
    expect(defaultDocsCode).toContain("Site Progress Photos — Aug.jpg");
    expect(defaultDocsCode).toContain("2.4 MB");
    expect(defaultDocsCode).toContain("18.7 MB");
  });

  it("6. Verifies Document Upload, Preview, Edit, Download, and Delete interactions", () => {
    expect(templateDocsCode).toContain("handleFileSelect");
    expect(templateDocsCode).toContain("handleSaveUpload");
    expect(templateDocsCode).toContain("handleDeleteDocument");
    expect(templateDocsCode).toContain("handleDownloadDocument");
    expect(templateDocsCode).toContain("handleSaveEdit");
    expect(templateDocsCode).toContain("previewDoc");
    expect(templateDocsCode).toContain("isUploadModalOpen");
    expect(templateDocsCode).toContain("updateTemplateDocuments");
  });

  it("7. Verifies Direct Routes", () => {
    expect(directRoute1Code).toContain("redirect(`/templates/${id}?tab=Documents`)");
    expect(directRoute2Code).toContain("redirect(`/templates/${id}?tab=Documents`)");
  });
});
