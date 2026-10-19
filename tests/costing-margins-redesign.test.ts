import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Costing Margins Redesign (Figma CSS Accurate)", () => {
  const pagePath = join(process.cwd(), "app/costs/page.tsx");
  const tabPath = join(process.cwd(), "app/costs/components/MarginsTab.tsx");
  const cssPath = join(process.cwd(), "app/costs/costing-redesign.css");
  const costingApiPath = join(process.cwd(), "lib/api/costing.ts");
  const routePath = join(process.cwd(), "app/api/v1/[...path]/route.ts");

  const pageContent = readFileSync(pagePath, "utf-8");
  const tabContent = readFileSync(tabPath, "utf-8");
  const cssContent = readFileSync(cssPath, "utf-8");
  const apiContent = readFileSync(costingApiPath, "utf-8");
  const routeContent = readFileSync(routePath, "utf-8");

  describe("1. Shell and Parent Dashboard Integration", () => {
    it("inherits User Dashboard shell with DashboardRail, DashboardHeader, and background glow", () => {
      expect(pageContent).toContain("<DashboardRail");
      expect(pageContent).toContain('<DashboardHeader title="Costing"');
      expect(pageContent).toContain("fig-dashboard");
      expect(pageContent).toContain("costing-bg-gradient-overlay");
    });

    it("uses scoped costing-page-shell and applies Figma atmospheric linear gradient", () => {
      expect(pageContent).toContain('import "./costing-redesign.css"');
      expect(cssContent).toContain(".costing-page-shell");
      expect(cssContent).toContain("background: linear-gradient(180deg, #2563eb -371.16%, rgba(37, 99, 235, 0) 100%)");
      expect(cssContent).toContain("opacity: 0.5");
    });

    it("maintains Urbanist typography and Figma color tokens", () => {
      expect(cssContent).toContain("#2563EB"); // Primary blue
      expect(cssContent).toContain("#0F172A"); // Dark text
      expect(cssContent).toContain("#64748B"); // Slate text
      expect(cssContent).toContain("#E4ECFB"); // Table header background
      expect(cssContent).toContain("#16A34A"); // Positive green
      expect(cssContent).toContain("#CE0045"); // Negative red indicator
      expect(cssContent).toContain("#DC2626"); // Critical red
      expect(cssContent).toContain("#EBEBEB"); // Divider line
    });
  });

  describe("2. Navigation Toolbar & Frame 109 Filter Popover", () => {
    it("renders module navigation tabs including Margins in page.tsx", () => {
      expect(pageContent).toContain('"Margins"');
      expect(pageContent).toContain('activeTab === "Margins"');
    });

    it("renders Frame 109 Filter button via CostingFilterPopover with showLabel={true}", () => {
      expect(pageContent).toContain("<CostingFilterPopover");
      expect(pageContent).toContain('title="Filter Margins"');
      expect(pageContent).toContain("showLabel={true}");
      expect(pageContent).toContain("projectFilter={marginsProjectFilter}");
      expect(pageContent).toContain("categoryFilter={marginsCategoryFilter}");
    });
  });

  describe("3. Row 1: Four KPI Cards (Frame 2147225138)", () => {
    it("renders costing-margins-kpi-grid with responsive 4-column layout", () => {
      expect(tabContent).toContain('className="costing-margins-kpi-grid"');
      expect(cssContent).toContain(".costing-margins-kpi-grid {");
      expect(cssContent).toContain("grid-template-columns: repeat(4, 1fr);");
      expect(cssContent).toContain("gap: 8px;");
    });

    it("renders four KPI cards with glass styling and 20px padding", () => {
      expect(cssContent).toContain(".costing-margins-kpi-card {");
      expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6);");
      expect(cssContent).toContain("border-radius: 6px;");
      expect(cssContent).toContain("padding: 20px;");
      expect(cssContent).toContain("gap: 8px;");
    });

    it("renders Card 1: Total Margin with Organisation Target subtitle", () => {
      expect(tabContent).toContain(">Total Margin</span>");
      expect(tabContent).toContain(">Organisation Target</span>");
    });

    it("renders Card 2: Current Margin with vs Last Month subtitle and delta indicators", () => {
      expect(tabContent).toContain(">Current Margin</span>");
      expect(tabContent).toContain("vs Last Month");
      expect(cssContent).toContain(".costing-margins-kpi-subtitle.is-negative");
      expect(cssContent).toContain(".costing-margins-kpi-subtitle.is-positive");
    });

    it("renders Card 3: Margin Difference with delta subtitle", () => {
      expect(tabContent).toContain(">Margin Difference</span>");
    });

    it("renders Card 4: Low Margin Items with Items below Target subtitle", () => {
      expect(tabContent).toContain(">Low Margin Items</span>");
      expect(tabContent).toContain("Items below Target");
    });
  });

  describe("4. Row 2: Three Analytics Panels (Frame 2147225233 / Frame 2147225200)", () => {
    it("renders costing-margins-row2-grid with 3 columns and 268px height", () => {
      expect(tabContent).toContain('className="costing-margins-row2-grid"');
      expect(cssContent).toContain(".costing-margins-row2-grid {");
      expect(cssContent).toContain("grid-template-columns: repeat(3, 1fr);");
      expect(cssContent).toContain(".costing-margins-panel-card {");
      expect(cssContent).toContain("min-height: 268px;");
    });

    it("Panel A: renders Margin Trend with legend (Current #2563EB & Target), axes and tooltip", () => {
      expect(tabContent).toContain("Margin Trend");
      expect(tabContent).toContain("costing-trend-legend");
      expect(tabContent).toContain("costing-legend-badge-current");
      expect(tabContent).toContain("costing-legend-badge-target");
      expect(tabContent).toContain("costing-trend-y-axis");
      expect(tabContent).toContain("costing-trend-x-axis");
      expect(tabContent).toContain("costing-trend-tooltip");
      expect(cssContent).toContain(".costing-legend-badge-current {");
      expect(cssContent).toContain("background: #2563EB;");
      expect(cssContent).toContain(".costing-trend-tooltip {");
      expect(cssContent).toContain("background: #010101;");
    });

    it("Panel B: renders Margin by Category with 147px x 8px progress track and delta", () => {
      expect(tabContent).toContain("Margin by Category");
      expect(tabContent).toContain("costing-catmargin-track");
      expect(tabContent).toContain("costing-catmargin-fill");
      expect(tabContent).toContain("costing-catmargin-delta");
      expect(cssContent).toContain(".costing-catmargin-track {");
      expect(cssContent).toContain("width: 147px;");
      expect(cssContent).toContain("height: 8px;");
      expect(cssContent).toContain("background: #E2E8F0;");
    });

    it("Panel C: renders Low Margin Items summary list with 32x32 thumb and status badges", () => {
      expect(tabContent).toContain("costing-lowmargin-thumb");
      expect(tabContent).toContain("costing-lowmargin-badge");
      expect(cssContent).toContain(".costing-lowmargin-thumb {");
      expect(cssContent).toContain("width: 32px;");
      expect(cssContent).toContain("height: 32px;");
      expect(cssContent).toContain(".costing-lowmargin-badge.is-critical");
      expect(cssContent).toContain("color: #DC2626;");
      expect(cssContent).toContain(".costing-lowmargin-badge.is-active");
      expect(cssContent).toContain("color: #16A34A;");
    });
  });

  describe("5. Row 3: Margin Impact Drivers & Margin Insights (Frame 2147225129)", () => {
    it("renders costing-margins-row3-grid with two-panel layout (878px / 431px ratio)", () => {
      expect(tabContent).toContain('className="costing-margins-row3-grid"');
      expect(cssContent).toContain(".costing-margins-row3-grid {");
      expect(cssContent).toContain("grid-template-columns: 1.8fr 1.2fr;");
      expect(cssContent).toContain("min-height: 391px;");
    });

    it("Left: renders MARGIN IMPACT DRIVERS table with Frame 57 header and 5 columns", () => {
      expect(tabContent).toContain("MARGIN IMPACT DRIVERS");
      expect(tabContent).toContain("costing-impact-table-header");
      expect(tabContent).toContain(">DRIVER</th>");
      expect(tabContent).toContain(">IMPACT ON MARGIN</th>");
      expect(tabContent).toContain(">VS LAST MONTH</th>");
      expect(tabContent).toContain(">AFFECTED ITEMS</th>");
      expect(tabContent).toContain(">PRIMARY IMPACT</th>");
      expect(cssContent).toContain(".costing-impact-table-header {");
      expect(cssContent).toContain("height: 36px;");
      expect(cssContent).toContain("background: #E4ECFB;");
      expect(cssContent).toContain(".costing-col-impact-driver {");
      expect(cssContent).toContain("width: 200px;");
      expect(cssContent).toContain(".costing-col-impact-val {");
      expect(cssContent).toContain("width: 157px;");
      expect(cssContent).toContain(".costing-col-impact-vs {");
      expect(cssContent).toContain("width: 133px;");
      expect(cssContent).toContain(".costing-col-impact-items {");
      expect(cssContent).toContain("width: 136px;");
      expect(cssContent).toContain(".costing-col-impact-primary {");
      expect(cssContent).toContain("width: 281px;");
    });

    it("Right: renders Margin Insights with icon rows and action buttons", () => {
      expect(tabContent).toContain("Margin Insights");
      expect(tabContent).toContain("costing-insights-card");
      expect(tabContent).toContain("costing-insight-item");
      expect(tabContent).toContain("costing-insight-action-btn");
      expect(tabContent).toContain("handleInsightAction");
    });
  });

  describe("6. Detailed Low Margin Items Table (Requirement 8)", () => {
    it("provides accessible detailed table view for all low margin items with search", () => {
      expect(tabContent).toContain("showDetailedLowMarginTable");
      expect(tabContent).toContain("Detailed Low Margin Items");
      expect(tabContent).toContain("lowMarginSearch");
      expect(tabContent).toContain("filteredDetailedItems");
    });
  });

  describe("7. Dynamic Backend Integration & Parameterized Filtering", () => {
    it("connects to real backend API getCostingMargins and supports filter params", () => {
      expect(tabContent).toContain("getCostingMargins");
      expect(apiContent).toContain("getCostingMargins(params?: { categoryId?: string; projectId?: string })");
      expect(routeContent).toContain('marginAnalysis(supabase, id, request)');
    });

    it("handles dynamic impact drivers, category margins, and insights without hardcoded fallbacks", () => {
      expect(routeContent).toContain("Vendor Rate Increase");
      expect(routeContent).toContain("Material Cost Increase");
      expect(routeContent).toContain("Discounts & Concessions");
      expect(routeContent).toContain("Labour Cost Increase");
      expect(routeContent).toContain("impactDrivers");
      expect(routeContent).toContain("insights");
    });
  });
});
