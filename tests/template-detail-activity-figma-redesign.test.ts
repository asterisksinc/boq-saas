import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Templates - Project Templates - Template Detail - Activity Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const templateActivityPath = path.resolve(
    __dirname,
    "../components/templates/detail/TemplateActivity.tsx"
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
    "../app/templates/[id]/activity/page.tsx"
  );
  const directRoute2Path = path.resolve(
    __dirname,
    "../app/templates/project-templates/[id]/activity/page.tsx"
  );

  const css = fs.readFileSync(cssPath, "utf8");
  const templateActivityCode = fs.readFileSync(templateActivityPath, "utf8");
  const apiRouteCode = fs.readFileSync(apiRoutePath, "utf8");
  const apiClientCode = fs.readFileSync(apiClientPath, "utf8");
  const pageCode = fs.readFileSync(pagePath, "utf8");
  const directRoute1Code = fs.readFileSync(directRoute1Path, "utf8");
  const directRoute2Code = fs.readFileSync(directRoute2Path, "utf8");

  it("1. Verifies Section Header & Frosted Toolbar (Figma Frame 2147225198 & 76)", () => {
    // Header title and subtitle
    expect(css).toMatch(/\.td-act-title\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.td-act-title\s*\{[^}]*font-size:\s*18px/);
    expect(css).toMatch(/\.td-act-title\s*\{[^}]*color:\s*#0F172A/);

    expect(css).toMatch(/\.td-act-subtitle\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.td-act-subtitle\s*\{[^}]*color:\s*#64748B/);

    // Frosted search input
    expect(css).toMatch(/\.td-act-search-box\s*\{[^}]*width:\s*260px/);
    expect(css).toMatch(/\.td-act-search-box\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-act-search-box\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.36\)/);
    expect(css).toMatch(/\.td-act-search-box\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\)/);

    // Search icon box (36x36 white box)
    expect(css).toMatch(/\.td-act-search-icon-box\s*\{[^}]*width:\s*36px/);
    expect(css).toMatch(/\.td-act-search-icon-box\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/\.td-act-search-icon-box\s*\{[^}]*background:\s*#FFFFFF/);

    // Toolbar buttons
    expect(css).toMatch(/\.td-act-toolbar-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-act-toolbar-btn\s*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(/\.td-act-toolbar-btn\s*\{[^}]*border:\s*1px solid #E2E8F0/);

    // Verify elements in Component JSX
    expect(templateActivityCode).toContain("Activity");
    expect(templateActivityCode).toContain("Track changes actions, approvals, publishing events, and usage activity");
    expect(templateActivityCode).toContain("Search activity...");
    expect(templateActivityCode).toContain("Filter");
    expect(templateActivityCode).toContain("Date");
    expect(templateActivityCode).toContain("Export");
  });

  it("2. Verifies 4 Summary KPI Cards (Figma Frame 2147225138)", () => {
    // 4 Column Grid
    expect(css).toMatch(/\.td-act-kpi-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
    expect(css).toMatch(/\.td-act-kpi-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.td-act-kpi-card\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-act-kpi-card\s*\{[^}]*padding:\s*20px/);

    // KPI Typography
    expect(css).toMatch(/\.td-act-kpi-label\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.td-act-kpi-label\s*\{[^}]*color:\s*#64748B/);
    expect(css).toMatch(/\.td-act-kpi-value\s*\{[^}]*font-size:\s*24px/);
    expect(css).toMatch(/\.td-act-kpi-value\s*\{[^}]*color:\s*#0F172A/);
    expect(css).toMatch(/\.td-act-kpi-subtext\s*\{[^}]*font-size:\s*12px/);

    // The 4 KPI cards in JSX
    expect(templateActivityCode).toContain("Total Events");
    expect(templateActivityCode).toContain("All Time");
    expect(templateActivityCode).toContain("Changes This Week");
    expect(templateActivityCode).toContain("Last 7 Days");
    expect(templateActivityCode).toContain("Contributors");
    expect(templateActivityCode).toContain("Unique Users");
    expect(templateActivityCode).toContain("Published Changes");
    expect(templateActivityCode).toContain("Last 30 Days");
  });

  it("3. Verifies Filter Tabs Segmented Control & Sort Dropdown (Figma Frame 2147225241)", () => {
    // Segmented control styling
    expect(css).toMatch(/\.td-act-segmented-control\s*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(/\.td-act-segmented-control\s*\{[^}]*border:\s*1px solid #E2E8F0/);
    expect(css).toMatch(/\.td-act-seg-btn\.active\s*\{[^}]*background:\s*#EFF6FF/);
    expect(css).toMatch(/\.td-act-seg-btn\.active\s*\{[^}]*color:\s*#2563EB/);

    // Sort button
    expect(css).toMatch(/\.td-act-sort-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-act-sort-btn\s*\{[^}]*border:\s*1px solid #E2E8F0/);

    // Category Tabs in JSX
    expect(templateActivityCode).toContain("activity-tab-${tab.id}");
    expect(templateActivityCode).toContain("Changes");
    expect(templateActivityCode).toContain("Publishing");
    expect(templateActivityCode).toContain("Usage");
    expect(templateActivityCode).toContain("Access");
    expect(templateActivityCode).toContain("System");
    expect(templateActivityCode).toContain("Newest First");
    expect(templateActivityCode).toContain("Oldest First");
  });

  it("4. Verifies Date-Grouped Timeline List & Dividers (Figma Frame 57 & 2147225085)", () => {
    // Outer timeline card
    expect(css).toMatch(/\.td-act-timeline-container\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.td-act-timeline-container\s*\{[^}]*border-radius:\s*6px/);

    // Date Section Divider (Frame 57, #E4ECFB, 36px height)
    expect(css).toMatch(/\.td-act-group-header\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.td-act-group-header\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/\.td-act-group-header\s*\{[^}]*color:\s*#64748B/);
    expect(css).toMatch(/\.td-act-group-header\s*\{[^}]*text-transform:\s*uppercase/);

    // Track dot & vertical line
    expect(css).toMatch(/\.td-act-track-dot\s*\{[^}]*width:\s*14px/);
    expect(css).toMatch(/\.td-act-track-dot\s*\{[^}]*height:\s*14px/);
    expect(css).toMatch(/\.td-act-track-dot\.green\s*\{[^}]*background:\s*#DCFCE7/);
    expect(css).toMatch(/\.td-act-track-dot\.amber\s*\{[^}]*background:\s*#FEF3C7/);
    expect(css).toMatch(/\.td-act-track-dot\.blue\s*\{[^}]*background:\s*#EFF6FF/);

    // Row layout & typography
    expect(css).toMatch(/\.td-act-col-time\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.td-act-event-title\s*\{[^}]*font-weight:\s*600/);
    expect(css).toMatch(/\.td-act-event-link\s*\{[^}]*color:\s*#2563EB/);
    expect(css).toMatch(/\.td-act-scope-pill\s*\{[^}]*border-radius:\s*9999px/);

    // Diff Box for costing changes
    expect(css).toMatch(/\.td-act-diff-box\s*\{[^}]*border:\s*1px solid #E2E8F0/);
    expect(css).toMatch(/\.td-act-diff-val\s*\{[^}]*font-weight:\s*600/);
  });

  it("5. Verifies Screen 2: Activity Details Side Panel (Figma Frame 2147225086)", () => {
    // 310px width side panel
    expect(css).toMatch(/\.td-act-side-panel\s*\{[^}]*width:\s*310px/);
    expect(css).toMatch(/\.td-act-side-panel\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.65\)/);
    expect(css).toMatch(/\.td-act-side-panel\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-act-side-panel\s*\{[^}]*padding:\s*20px/);

    // Status pill
    expect(css).toMatch(/\.td-act-status-pill\s*\{[^}]*border-radius:\s*9999px/);
    expect(css).toMatch(/\.td-act-status-pill\.success\s*\{[^}]*background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\)/);
    expect(css).toMatch(/\.td-act-status-pill\.success\s*\{[^}]*color:\s*#16A34A/);

    // Action transition 3-column grid
    expect(css).toMatch(/\.td-act-transition-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/);
    expect(css).toMatch(/\.td-act-trans-label\s*\{[^}]*font-size:\s*10px/);

    // Changes included card (Frame 2147225027)
    expect(css).toMatch(/\.td-act-changes-card\s*\{[^}]*border-radius:\s*14px/);
    expect(css).toMatch(/\.td-act-changes-card\s*\{[^}]*box-shadow:\s*0px 0px 6px rgba\(0,\s*0,\s*0,\s*0\.06\)/);
    expect(css).toMatch(/\.td-act-change-icon-wrap\s*\{[^}]*background:\s*#EFF6FF/);

    // JSX elements inside Side Panel
    expect(templateActivityCode).toContain("td-act-side-panel");
    expect(templateActivityCode).toContain("Activity Details");
    expect(templateActivityCode).toContain("close-side-panel-btn");
    expect(templateActivityCode).toContain("td-act-transition-grid");
    expect(templateActivityCode).toContain("Changes Included");
    expect(templateActivityCode).toContain("Reason");
    expect(templateActivityCode).toContain("Version");
    expect(templateActivityCode).toContain("View Version");
  });

  it("6. Verifies Backend Route & Real Database Querying via audit_logs", () => {
    // Route handler matches template activity endpoint
    expect(apiRouteCode).toContain("projectTemplateActivityMatch");
    expect(apiRouteCode).toContain("resource === \"activity\"");
    expect(apiRouteCode).toContain("supabase.from(\"audit_logs\")");
    expect(apiRouteCode).toContain("entity_type\", \"project_template\"");
    expect(apiRouteCode).toContain("totalEvents");
    expect(apiRouteCode).toContain("changesThisWeek");
    expect(apiRouteCode).toContain("contributors");
    expect(apiRouteCode).toContain("publishedChanges");
    expect(apiRouteCode).toContain("exportFormat === \"csv\"");
  });

  it("7. Verifies Client API Types & getTemplateActivity Method", () => {
    expect(apiClientCode).toContain("export interface TemplateActivityRecord");
    expect(apiClientCode).toContain("export interface TemplateActivityGroup");
    expect(apiClientCode).toContain("export interface TemplateActivityStats");
    expect(apiClientCode).toContain("export interface TemplateActivityFilterParams");
    expect(apiClientCode).toContain("export interface TemplateActivityResponse");
    expect(apiClientCode).toContain("export async function getTemplateActivity(");
    expect(apiClientCode).toContain("/activity");
  });

  it("8. Verifies Direct Routes Redirect to ?tab=Activity", () => {
    expect(directRoute1Code).toContain("redirect(`/templates/${id}?tab=Activity`)");
    expect(directRoute2Code).toContain("redirect(`/templates/${id}?tab=Activity`)");
  });

  it("9. Verifies Parent Page Integration and Tab Switching", () => {
    expect(pageCode).toContain("import TemplateActivity from \"@/components/templates/detail/TemplateActivity\"");
    expect(pageCode).toContain("activeTab === \"Activity\"");
    expect(pageCode).toContain("<TemplateActivity templateId={template.id} />");
  });
});
