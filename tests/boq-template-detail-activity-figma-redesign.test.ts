import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Templates - Project Templates - BOQ Template - Template Detail - Activity Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/boq-activity-redesign.css");
  const activityComponentPath = path.resolve(
    __dirname,
    "../components/templates/boq/BoqTemplateActivity.tsx"
  );
  const boqPagePath = path.resolve(
    __dirname,
    "../app/templates/boq/[id]/page.tsx"
  );
  const apiRoutePath = path.resolve(
    __dirname,
    "../app/api/v1/[...path]/route.ts"
  );
  const boqsApiPath = path.resolve(
    __dirname,
    "../lib/api/boqs.ts"
  );
  const layoutPath = path.resolve(
    __dirname,
    "../app/layout.tsx"
  );

  const css = fs.readFileSync(cssPath, "utf8");
  const activityComponentCode = fs.readFileSync(activityComponentPath, "utf8");
  const boqPageCode = fs.readFileSync(boqPagePath, "utf8");
  const apiRouteCode = fs.readFileSync(apiRoutePath, "utf8");
  const boqsApiCode = fs.readFileSync(boqsApiPath, "utf8");
  const layoutCode = fs.readFileSync(layoutPath, "utf8");

  it("1. Verifies Section Header & Frosted Toolbar (Figma Frame 2147225198 & 76)", () => {
    // Header title and subtitle
    expect(css).toMatch(/\.boq-act-title\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.boq-act-title\s*\{[^}]*font-size:\s*18px/);
    expect(css).toMatch(/\.boq-act-title\s*\{[^}]*color:\s*#0F172A/);

    expect(css).toMatch(/\.boq-act-subtitle\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.boq-act-subtitle\s*\{[^}]*color:\s*#64748B/);

    // Frosted search input
    expect(css).toMatch(/\.boq-act-search-box\s*\{[^}]*width:\s*260px/);
    expect(css).toMatch(/\.boq-act-search-box\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.boq-act-search-box\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.36\)/);
    expect(css).toMatch(/\.boq-act-search-box\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\)/);

    // Search icon box (36x36 white box)
    expect(css).toMatch(/\.boq-act-search-icon-box\s*\{[^}]*width:\s*36px/);
    expect(css).toMatch(/\.boq-act-search-icon-box\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/\.boq-act-search-icon-box\s*\{[^}]*background:\s*#FFFFFF/);

    // Toolbar buttons
    expect(css).toMatch(/\.boq-act-toolbar-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.boq-act-toolbar-btn\s*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(/\.boq-act-toolbar-btn\s*\{[^}]*border:\s*1px solid #E2E8F0/);

    // Verify elements in Component JSX
    expect(activityComponentCode).toContain("Activity");
    expect(activityComponentCode).toContain("Track changes actions, approvals, publishing events, and usage activity");
    expect(activityComponentCode).toContain("Search activity...");
    expect(activityComponentCode).toContain("Filter");
    expect(activityComponentCode).toContain("Date");
    expect(activityComponentCode).toContain("Export");
  });

  it("2. Verifies 4 Summary KPI Cards (Figma Frame 2147225138)", () => {
    // 4 Column Grid
    expect(css).toMatch(/\.boq-act-kpi-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
    expect(css).toMatch(/\.boq-act-kpi-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.boq-act-kpi-card\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.boq-act-kpi-card\s*\{[^}]*padding:\s*20px/);

    // KPI Typography
    expect(css).toMatch(/\.boq-act-kpi-label\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.boq-act-kpi-label\s*\{[^}]*color:\s*#64748B/);
    expect(css).toMatch(/\.boq-act-kpi-value\s*\{[^}]*font-size:\s*24px/);
    expect(css).toMatch(/\.boq-act-kpi-value\s*\{[^}]*color:\s*#0F172A/);
    expect(css).toMatch(/\.boq-act-kpi-subtext\s*\{[^}]*font-size:\s*12px/);

    // The 4 KPI cards in JSX
    expect(activityComponentCode).toContain("Total Events");
    expect(activityComponentCode).toContain("All Time");
    expect(activityComponentCode).toContain("Changes This Week");
    expect(activityComponentCode).toContain("Last 7 Days");
    expect(activityComponentCode).toContain("Contributors");
    expect(activityComponentCode).toContain("Unique Users");
    expect(activityComponentCode).toContain("Published Changes");
    expect(activityComponentCode).toContain("Last 30 Days");
  });

  it("3. Verifies Filter Tabs Segmented Control & Sort Dropdown (Figma Frame 2147225241)", () => {
    // Segmented control styling
    expect(css).toMatch(/\.boq-act-segmented-control\s*\{[^}]*background:\s*#FFFFFF/);
    expect(css).toMatch(/\.boq-act-segmented-control\s*\{[^}]*border:\s*1px solid #E2E8F0/);
    expect(css).toMatch(/\.boq-act-seg-btn\.active\s*\{[^}]*background:\s*#EFF6FF/);
    expect(css).toMatch(/\.boq-act-seg-btn\.active\s*\{[^}]*color:\s*#2563EB/);

    // Sort button
    expect(css).toMatch(/\.boq-act-sort-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.boq-act-sort-btn\s*\{[^}]*border:\s*1px solid #E2E8F0/);

    // Category Tabs in JSX
    expect(activityComponentCode).toContain("boq-activity-tab-${tab.id}");
    expect(activityComponentCode).toContain("Changes");
    expect(activityComponentCode).toContain("Publishing");
    expect(activityComponentCode).toContain("Usage");
    expect(activityComponentCode).toContain("Access");
    expect(activityComponentCode).toContain("System");
    expect(activityComponentCode).toContain("Newest First");
    expect(activityComponentCode).toContain("Oldest First");
  });

  it("4. Verifies Date-Grouped Timeline List & Dividers (Figma Frame 57 & 59, 60, 61, 62)", () => {
    // Outer timeline card
    expect(css).toMatch(/\.boq-act-timeline-container\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.boq-act-timeline-container\s*\{[^}]*border-radius:\s*6px/);

    // Date Section Divider (Frame 57, #E4ECFB, 36px height)
    expect(css).toMatch(/\.boq-act-group-header\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.boq-act-group-header\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/\.boq-act-group-header\s*\{[^}]*color:\s*#64748B/);
    expect(css).toMatch(/\.boq-act-group-header\s*\{[^}]*text-transform:\s*uppercase/);

    // Track dot & colors
    expect(css).toMatch(/\.boq-act-track-dot\s*\{[^}]*width:\s*14px/);
    expect(css).toMatch(/\.boq-act-track-dot\s*\{[^}]*height:\s*14px/);
    expect(css).toMatch(/\.boq-act-track-dot\.green\s*\{[^}]*background:\s*#DCFCE7/);
    expect(css).toMatch(/\.boq-act-track-dot\.amber\s*\{[^}]*background:\s*#FEF3C7/);
    expect(css).toMatch(/\.boq-act-track-dot\.blue\s*\{[^}]*background:\s*#EFF6FF/);

    // Row layout & typography
    expect(css).toMatch(/\.boq-act-col-time\s*\{[^}]*font-size:\s*14px/);
    expect(css).toMatch(/\.boq-act-event-title\s*\{[^}]*font-weight:\s*600/);
    expect(css).toMatch(/\.boq-act-event-link\s*\{[^}]*color:\s*#2563EB/);
    expect(css).toMatch(/\.boq-act-scope-pill\s*\{[^}]*border-radius:\s*9999px/);

    // Diff Box for costing changes
    expect(css).toMatch(/\.boq-act-diff-box\s*\{[^}]*border:\s*1px solid #E2E8F0/);
    expect(css).toMatch(/\.boq-act-diff-val\s*\{[^}]*font-weight:\s*600/);
  });

  it("5. Verifies Screen 2: Activity Details Side Panel (Figma Frame 2147225086)", () => {
    // 310px width side panel
    expect(css).toMatch(/\.boq-act-side-panel\s*\{[^}]*width:\s*310px/);
    expect(css).toMatch(/\.boq-act-side-panel\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.65\)/);
    expect(css).toMatch(/\.boq-act-side-panel\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.boq-act-side-panel\s*\{[^}]*padding:\s*20px/);

    // Status pill
    expect(css).toMatch(/\.boq-act-status-pill\s*\{[^}]*border-radius:\s*9999px/);
    expect(css).toMatch(/\.boq-act-status-pill\.success\s*\{[^}]*background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\)/);
    expect(css).toMatch(/\.boq-act-status-pill\.success\s*\{[^}]*color:\s*#16A34A/);

    // Action transition 3-column grid
    expect(css).toMatch(/\.boq-act-transition-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/);
    expect(css).toMatch(/\.boq-act-trans-label\s*\{[^}]*font-size:\s*10px/);

    // Changes included card (Frame 2147225027)
    expect(css).toMatch(/\.boq-act-changes-card\s*\{[^}]*border-radius:\s*14px/);
    expect(css).toMatch(/\.boq-act-changes-card\s*\{[^}]*box-shadow:\s*0px 0px 6px rgba\(0,\s*0,\s*0,\s*0\.06\)/);
    expect(css).toMatch(/\.boq-act-change-icon-wrap\s*\{[^}]*background:\s*#EFF6FF/);

    // JSX elements inside Side Panel
    expect(activityComponentCode).toContain("boq-act-side-panel");
    expect(activityComponentCode).toContain("Activity Details");
    expect(activityComponentCode).toContain("boq-close-side-panel-btn");
    expect(activityComponentCode).toContain("boq-act-transition-grid");
    expect(activityComponentCode).toContain("Changes Included");
    expect(activityComponentCode).toContain("Reason");
    expect(activityComponentCode).toContain("Version");
    expect(activityComponentCode).toContain("View Version");
  });

  it("6. Verifies Backend Route & Real Database Querying for BOQ Template Activity", () => {
    // Route matching
    expect(apiRouteCode).toContain("boqTemplateActivityMatch");
    expect(apiRouteCode).toMatch(/boq-templates.*activity/);
    expect(apiRouteCode).toContain("getBoqTemplateActivity");
    expect(apiRouteCode).toContain("totalEvents");
    expect(apiRouteCode).toContain("changesThisWeek");
    expect(apiRouteCode).toContain("contributors");
    expect(apiRouteCode).toContain("publishedChanges");
    expect(apiRouteCode).toContain('exportFormat === "csv"');
  });

  it("7. Verifies Client API Methods in lib/api/boqs.ts", () => {
    expect(boqsApiCode).toContain("export async function getBoqTemplateActivity(");
    expect(boqsApiCode).toContain("/api/v1/boq-templates/");
    expect(boqsApiCode).toContain("/activity");
  });

  it("8. Verifies Parent Page Integration and Tab Navigation in BOQ Template Detail", () => {
    expect(boqPageCode).toContain('import BoqTemplateActivity from "@/components/templates/boq/BoqTemplateActivity"');
    expect(boqPageCode).toContain('activeTab === "Activity"');
    expect(boqPageCode).toContain("<BoqTemplateActivity");
    expect(boqPageCode).toContain('onNavigateTab={(tab) => handleTabChange(tab)}');
  });

  it("9. Verifies Global Stylesheet Registration in Root Layout", () => {
    expect(layoutCode).toContain('import "./boq-activity-redesign.css";');
  });
});
