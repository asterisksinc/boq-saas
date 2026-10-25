import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Templates - Project Templates - Template Detail - Usage Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/templates-overview.css");
  const templateUsagePath = path.resolve(
    __dirname,
    "../components/templates/detail/TemplateUsage.tsx"
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
    "../app/templates/[id]/usage/page.tsx"
  );
  const directRoute2Path = path.resolve(
    __dirname,
    "../app/templates/project-templates/[id]/usage/page.tsx"
  );

  const css = fs.readFileSync(cssPath, "utf8");
  const templateUsageCode = fs.readFileSync(templateUsagePath, "utf8");
  const apiRouteCode = fs.readFileSync(apiRoutePath, "utf8");
  const apiClientCode = fs.readFileSync(apiClientPath, "utf8");
  const pageCode = fs.readFileSync(pagePath, "utf8");
  const directRoute1Code = fs.readFileSync(directRoute1Path, "utf8");
  const directRoute2Code = fs.readFileSync(directRoute2Path, "utf8");

  it("1. Verifies Section Header & Toolbar (Figma Frame 2147225198)", () => {
    // Header layout
    expect(css).toMatch(/\.td-usage-header-row\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.td-usage-title\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.td-usage-title\s*\{[^}]*font-size:\s*18px/);
    expect(css).toMatch(/\.td-usage-title\s*\{[^}]*font-weight:\s*600/);
    expect(css).toMatch(/\.td-usage-title\s*\{[^}]*color:\s*#0F172A/);

    // Search Box (Frame 76)
    expect(css).toMatch(/\.td-usage-search-box\s*\{[^}]*width:\s*260px/);
    expect(css).toMatch(/\.td-usage-search-box\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-usage-search-box\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\)/);
    expect(css).toMatch(/\.td-usage-search-box\s*\{[^}]*border-radius:\s*8px/);

    // Toolbar buttons (Date, Filter, Export)
    expect(css).toMatch(/\.td-usage-date-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-usage-date-btn\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-usage-filter-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-usage-filter-btn\s*\{[^}]*border-radius:\s*6px/);
    expect(css).toMatch(/\.td-usage-export-btn\s*\{[^}]*height:\s*46px/);
    expect(css).toMatch(/\.td-usage-export-btn\s*\{[^}]*border-radius:\s*6px/);

    // Toolbar JSX elements
    expect(templateUsageCode).toContain("td-usage-search-box");
    expect(templateUsageCode).toContain("td-usage-date-btn");
    expect(templateUsageCode).toContain("td-usage-filter-btn");
    expect(templateUsageCode).toContain("td-usage-export-btn");
  });

  it("2. Verifies Top 4 KPI Summary Cards (Figma Frame 2147225138)", () => {
    // 4-column KPI grid
    expect(css).toMatch(/\.td-usage-kpi-row\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
    expect(css).toMatch(/\.td-usage-kpi-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.td-usage-kpi-card\s*\{[^}]*border-radius:\s*6px/);

    // Values typography
    expect(css).toMatch(/\.td-usage-kpi-val\s*\{[^}]*font-family:\s*'Urbanist'/);
    expect(css).toMatch(/\.td-usage-kpi-val\s*\{[^}]*font-size:\s*24px/);
    expect(css).toMatch(/\.td-usage-kpi-val\s*\{[^}]*font-weight:\s*400/);
    expect(css).toMatch(/\.td-usage-kpi-val\s*\{[^}]*color:\s*#0F172A/);

    // Labels & subtext present in JSX
    expect(templateUsageCode).toContain("Projects Created");
    expect(templateUsageCode).toContain("Active Projects");
    expect(templateUsageCode).toContain("Completed Projects");
    expect(templateUsageCode).toContain("Versions Used");
    expect(templateUsageCode).toContain("td-usage-kpi-sub");
  });

  it("3. Verifies Middle Row 1: Health, Modifications, and Reusability Gauge (Figma Frame 2147225199)", () => {
    // Grid container
    expect(css).toMatch(/\.td-usage-middle-row\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/);
    expect(css).toMatch(/\.td-usage-card-h147\s*\{[^}]*min-height:\s*147px/);
    expect(css).toMatch(/\.td-usage-card\s*\{[^}]*border-radius:\s*6px/);

    // Health Score elements
    expect(templateUsageCode).toContain("Template Usage Health");
    expect(templateUsageCode).toContain("/100");
    expect(templateUsageCode).toContain("td-usage-health-track");
    expect(templateUsageCode).toContain("td-usage-health-fill");

    // Post-Creation Modifications elements
    expect(templateUsageCode).toContain("Post-Creation Modification");
    expect(templateUsageCode).toContain("Used as-is");
    expect(templateUsageCode).toContain("Minor Modifications");
    expect(templateUsageCode).toContain("Major Modifications");

    // Reusability Score Gauge
    expect(templateUsageCode).toContain("Reusability Score");
    expect(templateUsageCode).toContain("td-usage-gauge-container");
    expect(templateUsageCode).toContain("viewBox=");
  });

  it("4. Verifies Middle Row 2: Trend Bar Chart, Status Donut Chart, and Version Adoption (Figma Frame 2147225200)", () => {
    // Grid container
    expect(css).toMatch(/\.td-usage-charts-row\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/);
    expect(css).toMatch(/\.td-usage-card-h256\s*\{[^}]*min-height:\s*256px/);

    // Template Usage Trend Bar Chart
    expect(templateUsageCode).toContain("Template Usage Trend");
    expect(templateUsageCode).toContain("td-usage-bar");
    expect(templateUsageCode).toContain("td-usage-bar-col");

    // Project Status Donut Chart ("Version Adaptation" in Figma)
    expect(templateUsageCode).toContain("Version Adaptation");
    expect(templateUsageCode).toContain("Active");
    expect(templateUsageCode).toContain("Completed");
    expect(templateUsageCode).toContain("On-Hold");
    expect(templateUsageCode).toContain("Cancelled");

    // Version Adoption with older version alert
    expect(templateUsageCode).toContain("Version Adoption");
    expect(templateUsageCode).toContain("td-usage-version-alert");
    expect(templateUsageCode).toContain("Active projects are on older version templates");
  });

  it("5. Verifies Projects Created Table Card & Header (Figma Frame 2147225085 & Frame 57)", () => {
    // Table card styling
    expect(css).toMatch(/\.td-usage-table-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/\.td-usage-table-card\s*\{[^}]*border-radius:\s*6px/);

    // Table Header (#E4ECFB, 36px height, uppercase)
    expect(css).toMatch(/\.td-usage-table\s+thead\s+tr\s*\{[^}]*background:\s*#E4ECFB/);
    expect(css).toMatch(/\.td-usage-table\s+thead\s+tr\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/\.td-usage-table\s+th\s*\{[^}]*color:\s*#64748B/);
    expect(css).toMatch(/\.td-usage-table\s+th\s*\{[^}]*text-transform:\s*uppercase/);

    // All 11 columns declared in JSX
    expect(templateUsageCode).toContain("PROJECT");
    expect(templateUsageCode).toContain("TRIGGER");
    expect(templateUsageCode).toContain("OWNER");
    expect(templateUsageCode).toContain("CREATED ON");
    expect(templateUsageCode).toContain("TEMPLATE VERSION");
    expect(templateUsageCode).toContain("STATUS");
    expect(templateUsageCode).toContain("PROGRESS");
    expect(templateUsageCode).toContain("LAST UPDATED");
    expect(templateUsageCode).toContain("USAGE SOURCE");
    expect(templateUsageCode).toContain("MODIFICATIONS");
  });

  it("6. Verifies Table Rows, Badges, and Pill Typography (Figma Frames 59, 83, 81, 82, 84, 85)", () => {
    // Row height 56px and border #EBEBEB
    expect(css).toMatch(/\.td-usage-table\s+tbody\s+tr\s*\{[^}]*height:\s*56px/);
    expect(css).toMatch(/\.td-usage-table\s+tbody\s+tr\s*\{[^}]*border-bottom:\s*1px\s+solid\s+#EBEBEB/);

    // Version pill badge
    expect(css).toMatch(/\.td-usage-pill-version\s*\{[^}]*border-radius:\s*9999px/);

    // Status pill badge
    expect(css).toMatch(/\.td-usage-pill-status\s*\{[^}]*border-radius:\s*9999px/);

    // Modification pill badge
    expect(css).toMatch(/\.td-usage-pill-mod\s*\{[^}]*border-radius:\s*9999px/);

    // Owner Avatar
    expect(css).toMatch(/\.td-usage-owner-avatar\s*\{[^}]*border-radius:\s*50%/);
  });

  it("7. Verifies Bottom Pagination (Figma Frame 2147225166)", () => {
    expect(css).toMatch(/\.td-usage-pagination-row\s*\{[^}]*display:\s*flex/);
    expect(templateUsageCode).toContain("Total Projects:");
    expect(templateUsageCode).toContain("Show per Page:");
    expect(templateUsageCode).toContain("td-usage-pagination-btn");
  });

  it("8. Verifies Backend Route & Client API Dynamic Aggregation", () => {
    // API route computes real statistical distributions
    expect(apiRouteCode).toContain("projectTemplateHistory");
    expect(apiRouteCode).toContain("healthScore");
    expect(apiRouteCode).toContain("reusabilityScore");
    expect(apiRouteCode).toContain("postCreationModifications");
    expect(apiRouteCode).toContain("statusDistribution");
    expect(apiRouteCode).toContain("versionAdoption");
    expect(apiRouteCode).toContain("monthlyTrends");
    expect(apiRouteCode).toContain("exportFormat === \"csv\"");

    // Client API types & function
    expect(apiClientCode).toContain("export interface TemplateUsageFilterParams");
    expect(apiClientCode).toContain("export interface TemplateUsageRecord");
    expect(apiClientCode).toContain("export interface TemplateUsageStats");
    expect(apiClientCode).toContain("export interface TemplateUsageResponse");
    expect(apiClientCode).toContain("getTemplateUsage(");

    // Parent page passes template props & use handler
    expect(pageCode).toContain("templateName={template.name}");
    expect(pageCode).toContain("templateCode={template.templateCode}");
    expect(pageCode).toContain("currentVersion={template.version}");
    expect(pageCode).toContain("onUseTemplate={handleUseTemplate}");
  });

  it("9. Verifies Direct Routes Redirect to ?tab=Usage", () => {
    expect(directRoute1Code).toContain("redirect(`/templates/${id}?tab=Usage`)");
    expect(directRoute2Code).toContain("redirect(`/templates/${id}?tab=Usage`)");
  });
});
