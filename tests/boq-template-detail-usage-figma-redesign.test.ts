import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("BOQ Template Detail → Usage Tab Figma Redesign Verification", () => {
  const cssPath = path.resolve(__dirname, "../app/boq-usage-redesign.css");
  const componentPath = path.resolve(
    __dirname,
    "../components/templates/boq/BoqTemplateUsage.tsx"
  );
  const pagePath = path.resolve(
    __dirname,
    "../app/templates/boq/[id]/page.tsx"
  );
  const layoutPath = path.resolve(__dirname, "../app/layout.tsx");
  const apiRoutePath = path.resolve(
    __dirname,
    "../app/api/v1/[...path]/route.ts"
  );
  const apiClientPath = path.resolve(__dirname, "../lib/api/boqs.ts");

  it("1. Verifies that all required files exist", () => {
    expect(fs.existsSync(cssPath)).toBe(true);
    expect(fs.existsSync(componentPath)).toBe(true);
    expect(fs.existsSync(pagePath)).toBe(true);
    expect(fs.existsSync(layoutPath)).toBe(true);
    expect(fs.existsSync(apiRoutePath)).toBe(true);
    expect(fs.existsSync(apiClientPath)).toBe(true);
  });

  it("2. Verifies root layout imports the BOQ usage redesign stylesheet", () => {
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    expect(layoutContent).toContain("./boq-usage-redesign.css");
  });

  it("3. Verifies page.tsx integrates BoqTemplateUsage for the Usage tab", () => {
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    expect(pageContent).toContain('import BoqTemplateUsage from "@/components/templates/boq/BoqTemplateUsage";');
    expect(pageContent).toContain('{activeTab === "Usage" && (');
    expect(pageContent).toContain("<BoqTemplateUsage");
  });

  it("4. Verifies CSS specifications for Usage Subheader & Search Toolbar (Frame 2147225198)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-usage-subheader");
    expect(css).toContain(".boq-usage-title");
    expect(css).toContain(".boq-usage-desc");
    expect(css).toContain(".boq-usage-search-box");
    expect(css).toContain("rgba(255, 255, 255, 0.36)");
    expect(css).toContain("backdrop-filter: blur(20.4px)");
    expect(css).toContain("width: 260px");
    expect(css).toContain("height: 46px");
    expect(css).toContain(".boq-usage-search-icon-box");
    expect(css).toContain("width: 36px");
    expect(css).toContain("height: 36px");
    expect(css).toContain(".boq-usage-date-btn");
    expect(css).toContain("width: 188px");
    expect(css).toContain(".boq-usage-filter-btn");
    expect(css).toContain("width: 102px");
    expect(css).toContain(".boq-usage-export-btn");
    expect(css).toContain("width: 141px");
  });

  it("5. Verifies CSS specifications for 4 Summary Metric KPI Cards (Frame 2147225138)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-usage-kpi-grid");
    expect(css).toContain(".boq-usage-kpi-card");
    expect(css).toContain("background: rgba(255, 255, 255, 0.6)");
    expect(css).toContain("height: 116px");
    expect(css).toContain("padding: 20px");
    expect(css).toContain(".boq-usage-kpi-label");
    expect(css).toContain(".boq-usage-kpi-val");
    expect(css).toContain(".boq-usage-kpi-sub");
  });

  it("6. Verifies CSS specifications for Main Table Panel & Header (Frame 2147225069 & Frame 57)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-usage-main-panel");
    expect(css).toContain("background: rgba(255, 255, 255, 0.6)");
    expect(css).toContain("width: 992.5px");
    expect(css).toContain("min-height: 495px");
    expect(css).toContain(".boq-usage-thead-row");
    expect(css).toContain("background: #E4ECFB"); // Header background
    expect(css).toContain("height: 36px");
    expect(css).toContain(".boq-usage-th-project");
    expect(css).toContain(".boq-usage-th-type");
    expect(css).toContain(".boq-usage-th-client");
    expect(css).toContain(".boq-usage-th-template-ver");
    expect(css).toContain(".boq-usage-th-rule-ver");
    expect(css).toContain(".boq-usage-th-status");
    expect(css).toContain(".boq-usage-th-owner");
    expect(css).toContain(".boq-usage-th-updated");
  });

  it("7. Verifies CSS specifications for Rows, Badges, Owner, and Pagination (Frame 59, 2147225166)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-usage-row");
    expect(css).toContain("height: 56px");
    expect(css).toContain("border-bottom: 1px solid #EBEBEB");
    expect(css).toContain(".boq-usage-badge.project");
    expect(css).toContain(".boq-usage-badge.estimate");
    expect(css).toContain(".boq-usage-badge.boq");
    expect(css).toContain(".boq-usage-badge.current");
    expect(css).toContain(".boq-usage-badge.older");
    expect(css).toContain(".boq-usage-badge.very-old");
    expect(css).toContain(".boq-usage-badge.active-status");
    expect(css).toContain(".boq-usage-owner-avatar");
    expect(css).toContain("width: 32px");
    expect(css).toContain("height: 32px");
    expect(css).toContain(".boq-usage-pagination");
    expect(css).toContain(".boq-usage-page-btn.active");
    expect(css).toContain("background: #E4ECFB");
    expect(css).toContain(".boq-usage-per-page-select");
  });

  it("8. Verifies CSS specifications for Right Secondary Panel (Frame 2147225291)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain(".boq-usage-side-panel");
    expect(css).toContain("width: 325.5px");
    expect(css).toContain(".boq-usage-adaptation-card");
    expect(css).toContain("min-height: 269px");
    expect(css).toContain(".boq-usage-donut-wrap");
    expect(css).toContain("width: 124px");
    expect(css).toContain("height: 124px");
    expect(css).toContain(".boq-usage-view-versions-link");
    expect(css).toContain("color: #2563EB");
    expect(css).toContain(".boq-usage-type-card");
    expect(css).toContain("min-height: 217px");
    expect(css).toContain(".boq-usage-type-bar-track");
    expect(css).toContain("width: 150px");
    expect(css).toContain("height: 8px");
  });

  it("9. Verifies component contains all required elements, columns, and Figma data rows", () => {
    const comp = fs.readFileSync(componentPath, "utf-8");
    expect(comp).toContain("Usage");
    expect(comp).toContain("Track projects, estimates, BOQs and quotations using this template.");
    expect(comp).toContain("Search usage by project…");
    expect(comp).toContain("Last 90 Days");
    expect(comp).toContain("Total Uses");
    expect(comp).toContain("Active Projects");
    expect(comp).toContain("Draft / Estimates");
    expect(comp).toContain("Approved BOQs");
    expect(comp).toContain("USAGE / PROJECT");
    expect(comp).toContain("TYPE");
    expect(comp).toContain("CLIENT");
    expect(comp).toContain("TEMPLATE VERSION");
    expect(comp).toContain("RULE VERSION");
    expect(comp).toContain("STATUS");
    expect(comp).toContain("OWNER");
    expect(comp).toContain("LAST UPDATED");
    expect(comp).toContain("Sharma Residence");
    expect(comp).toContain("PRJ-2026-0184");
    expect(comp).toContain("Kapoor Apartment");
    expect(comp).toContain("Mehta Residence Estimate");
    expect(comp).toContain("Varma Villa BOQ");
    expect(comp).toContain("Rao Residence");
    expect(comp).toContain("Version Adaptation");
    expect(comp).toContain("Usage by Type");
    expect(comp).toContain("View All Versions");
  });

  it("10. Verifies API client and route integration for BOQ template usage", () => {
    const apiClient = fs.readFileSync(apiClientPath, "utf-8");
    const apiRoute = fs.readFileSync(apiRoutePath, "utf-8");
    expect(apiClient).toContain("getBoqTemplateUsage");
    expect(apiRoute).toContain("boqTemplateUsageMatch");
    expect(apiRoute).toContain("getBoqTemplateUsage");
  });
});
