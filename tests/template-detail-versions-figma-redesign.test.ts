import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Templates - Project Templates - Template Detail - Versions Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const templateVersionsPath = path.resolve(
    __dirname,
    "../components/templates/detail/TemplateVersions.tsx"
  );
  const apiRoutePath = path.resolve(
    __dirname,
    "../app/api/v1/[...path]/route.ts"
  );
  const apiClientPath = path.resolve(
    __dirname,
    "../lib/api/templates.ts"
  );
  const pagePath = path.resolve(
    __dirname,
    "../app/templates/[id]/page.tsx"
  );
  const directRoute1Path = path.resolve(
    __dirname,
    "../app/templates/[id]/versions/page.tsx"
  );
  const directRoute2Path = path.resolve(
    __dirname,
    "../app/templates/project-templates/[id]/versions/page.tsx"
  );

  const css = fs.readFileSync(cssPath, "utf8");
  const templateVersionsCode = fs.readFileSync(templateVersionsPath, "utf8");
  const apiRouteCode = fs.readFileSync(apiRoutePath, "utf8");
  const apiClientCode = fs.readFileSync(apiClientPath, "utf8");
  const pageCode = fs.readFileSync(pagePath, "utf8");
  const directRoute1Code = fs.readFileSync(directRoute1Path, "utf8");
  const directRoute2Code = fs.readFileSync(directRoute2Path, "utf8");

  it("1. Verifies Section Header & Toolbar (Figma Frame 2147225198)", () => {
    // Header layout
    expect(css).toMatch(/\.td-ver-header-row\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.td-ver-title\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.td-ver-title\s*\{[^}]*font-size:\s*18px/);
    expect(css).toMatch(/\.td-ver-title\s*\{[^}]*font-weight:\s*600/);
    expect(css).toMatch(/\.td-ver-title\s*\{[^}]*color:\s*#0F172A/);

    expect(css).toMatch(/\.td-ver-subtitle\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.td-ver-subtitle\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.td-ver-subtitle\s*\{[^}]*color:\s*#64748B/);

    // Search Box (Frame 76)
    expect(css).toMatch(/\.td-ver-search-box\s*\{[^}]*width:\s*260px/);
    expect(css).toMatch(/\.td-ver-search-box\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-ver-search-box\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\)/);
    expect(css).toMatch(/\.td-ver-search-box\s*\{[^}]*border-radius:\s*8px/);

    // Toolbar buttons (Filter, New Version, More)
    expect(css).toMatch(/\.td-ver-filter-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-ver-filter-btn\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-ver-new-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-ver-new-btn\s*\{[^}]*background:\s*#2563EB/);
    expect(css).toMatch(/\.td-ver-new-btn\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-ver-more-btn\s*\{[^}]*width:\s*48px/);
    expect(css).toMatch(/\.td-ver-more-btn\s*\{[^}]*height:\s*46px/);

    // Toolbar JSX elements
    expect(templateVersionsCode).toContain("td-ver-search-box");
    expect(templateVersionsCode).toContain("td-ver-filter-btn");
    expect(templateVersionsCode).toContain("td-ver-new-btn");
    expect(templateVersionsCode).toContain("td-ver-more-btn");
    expect(templateVersionsCode).toContain("Search versions…");
    expect(templateVersionsCode).toContain("New Version");
  });

  it("2. Verifies Top 4 KPI Summary Cards (Figma Frame 2147225138)", () => {
    // 4-column KPI grid
    expect(css).toMatch(/\.td-ver-kpi-row\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
    expect(css).toMatch(/\.td-ver-kpi-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.td-ver-kpi-card\s*\{[^}]*border-radius:\s*6px/);

    // Values typography
    expect(css).toMatch(/\.td-ver-kpi-val\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.td-ver-kpi-val\s*\{[^}]*font-size:\s*24px/);
    expect(css).toMatch(/\.td-ver-kpi-val\s*\{[^}]*font-weight:\s*400/);
    expect(css).toMatch(/\.td-ver-kpi-val\s*\{[^}]*color:\s*#0F172A/);

    // Labels & subtext present in JSX
    expect(templateVersionsCode).toContain("Total Versions");
    expect(templateVersionsCode).toContain("Current Version");
    expect(templateVersionsCode).toContain("Active Draft");
    expect(templateVersionsCode).toContain("Projects Usding");
    expect(templateVersionsCode).toContain("Published");
    expect(templateVersionsCode).toContain("This Template");
  });

  it("3. Verifies Filter Tabs Bar & My Changes Checkbox (Figma Frame 2147225239)", () => {
    // Segmented control styling
    expect(css).toMatch(/\.td-ver-segmented-control\s*\{[^}]*width:\s*567px/);
    expect(css).toMatch(/\.td-ver-segmented-control\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-ver-segmented-control\s*\{[^}]*border-radius:\s*6px/);

    // Tab buttons & active state
    expect(css).toMatch(/\.td-ver-seg-btn\.active\s*\{[^}]*background:\s*#EFF6FF/);
    expect(css).toMatch(/\.td-ver-seg-btn\.active\s*\{[^}]*color:\s*#2563EB/);

    // My Changes Checkbox
    expect(css).toMatch(/\.td-ver-mychanges-label\s*\{[^}]*display:\s*flex/);
    expect(templateVersionsCode).toContain("All Versions");
    expect(templateVersionsCode).toContain("Published");
    expect(templateVersionsCode).toContain("Drafts");
    expect(templateVersionsCode).toContain("Archived");
    expect(templateVersionsCode).toContain("My Changes");
  });

  it("4. Verifies Versions Table Card & Header (Figma Frame 2147225085 & Frame 57)", () => {
    // Table card styling
    expect(css).toMatch(/\.td-ver-table-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.td-ver-table-card\s*\{[^}]*border-radius:\s*6px/);

    // Inner table container
    expect(css).toMatch(/\.td-ver-table-container\s*\{[^}]*background:\s*#F9FBFD/);
    expect(css).toMatch(/\.td-ver-table-container\s*\{[^}]*border-radius:\s*8px/);

    // Table Header (#E4ECFB, 36px height, uppercase)
    expect(css).toMatch(/\.td-ver-table\s+thead\s+tr\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.td-ver-table\s+thead\s+tr\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/\.td-ver-table\s+th\s*\{[^}]*color:\s*#64748B/);
    expect(css).toMatch(/\.td-ver-table\s+th\s*\{[^}]*text-transform:\s*uppercase/);

    // All 10 columns declared in JSX
    expect(templateVersionsCode).toContain("VERSION");
    expect(templateVersionsCode).toContain("STATUS");
    expect(templateVersionsCode).toContain("CHANGE SUMMARY");
    expect(templateVersionsCode).toContain("CREATED BY");
    expect(templateVersionsCode).toContain("PUBLISHED BY");
    expect(templateVersionsCode).toContain("CREATED");
    expect(templateVersionsCode).toContain("PUBLISHED");
    expect(templateVersionsCode).toContain("PROJECTS");
    expect(templateVersionsCode).toContain("CHANGES");
    expect(templateVersionsCode).toContain("ACTIONS");
  });

  it("5. Verifies Table Rows, Selected Row, Badges, and Pill Typography (Figma Frames 59, 60, etc.)", () => {
    // Row height 56px and border #EBEBEB
    expect(css).toMatch(/\.td-ver-table\s+tbody\s+tr\s*\{[^}]*height:\s*56px/);
    expect(css).toMatch(/\.td-ver-table\s+tbody\s+tr\s*\{[^}]*border-bottom:\s*1px\s+solid\s+#EBEBEB/);

    // Selected row highlight (Frame 60 in Figma Screen 2)
    expect(css).toMatch(/\.td-ver-table\s+tbody\s+tr\.selected\s*\{[^}]*background:\s*rgba\(37,\s*99,\s*235,\s*0\.05\)/);
    expect(css).toMatch(/\.td-ver-table\s+tbody\s+tr\.selected\s*\{[^}]*border-radius:\s*8px/);

    // Status pill badge
    expect(css).toMatch(/\.td-ver-pill-status\s*\{[^}]*border-radius:\s*9999px/);

    // Impact pill badge
    expect(css).toMatch(/\.td-ver-pill-impact\s*\{[^}]*border-radius:\s*9999px/);

    // Author Avatar
    expect(css).toMatch(/\.td-ver-author-avatar\s*\{[^}]*border-radius:\s*50%/);
  });

  it("6. Verifies Version Selected Detail Side Panel (Figma Screen 2: Version Selected Detail)", () => {
    // Layout split
    expect(css).toMatch(/\.td-ver-layout-row\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.td-ver-table-col\s*\{[^}]*flex:\s*1/);

    // Side panel container
    expect(css).toMatch(/\.td-ver-side-panel\s*\{[^}]*width:\s*320px/);
    expect(css).toMatch(/\.td-ver-side-panel\s*\{[^}]*border-radius:\s*12px/);
    expect(css).toMatch(/\.td-ver-side-panel\s*\{[^}]*background:\s*#FFFFFF/);

    // Side panel components in JSX
    expect(templateVersionsCode).toContain("td-ver-side-panel");
    expect(templateVersionsCode).toContain("td-ver-side-version-badge");
    expect(templateVersionsCode).toContain("Change Summary");
    expect(templateVersionsCode).toContain("td-ver-side-meta-grid");
    expect(templateVersionsCode).toContain("td-ver-side-stats-row");
    expect(templateVersionsCode).toContain("Configuration Snapshot");
    expect(templateVersionsCode).toContain("Use This Version");
    expect(templateVersionsCode).toContain("Compare Revisions");
  });

  it("7. Verifies Bottom Pagination (Figma Frame 2147225166)", () => {
    expect(css).toMatch(/\.td-ver-pagination-row\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.td-ver-pagination-btn\.active\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.td-ver-pagination-btn\.active\s*\{[^}]*color:\s*#2563EB/);

    expect(templateVersionsCode).toContain("Total Versions:");
    expect(templateVersionsCode).toContain("Show per Page:");
    expect(templateVersionsCode).toContain("td-ver-pagination-btn");
  });

  it("8. Verifies Backend Route & Client API Dynamic Version Management", () => {
    // API route computes stats and supports search & filters
    expect(apiRouteCode).toContain("resource === \"versions\"");
    expect(apiRouteCode).toContain("totalVersions");
    expect(apiRouteCode).toContain("publishedCount");
    expect(apiRouteCode).toContain("currentVersion");
    expect(apiRouteCode).toContain("activeDraft");
    expect(apiRouteCode).toContain("projectsUsing");
    expect(apiRouteCode).toContain("createProjectTemplateVersion");

    // Client API types & functions
    expect(apiClientCode).toContain("export interface TemplateVersionRecord");
    expect(apiClientCode).toContain("export interface TemplateVersionStats");
    expect(apiClientCode).toContain("export interface TemplateVersionsResponse");
    expect(apiClientCode).toContain("export interface TemplateVersionFilterParams");
    expect(apiClientCode).toContain("getTemplateVersions(");
    expect(apiClientCode).toContain("createTemplateVersion(");

    // Parent page passes props
    expect(pageCode).toContain("activeTab === \"Versions\"");
    expect(pageCode).toContain("templateName={template.name}");
    expect(pageCode).toContain("templateCode={template.templateCode}");
    expect(pageCode).toContain("onUseTemplate={handleUseTemplate}");
  });

  it("9. Verifies Direct Routes Redirect to ?tab=Versions", () => {
    expect(directRoute1Code).toContain("redirect(`/templates/${id}?tab=Versions`)");
    expect(directRoute2Code).toContain("redirect(`/templates/${id}?tab=Versions`)");
  });
});
