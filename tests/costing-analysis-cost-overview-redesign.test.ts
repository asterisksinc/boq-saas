import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { formatMoney } from "../lib/costing-format";

describe("Costing Analysis - Cost Overview Redesign (Figma CSS Accurate)", () => {
  const pagePath = join(process.cwd(), "app/costs/page.tsx");
  const tabPath = join(process.cwd(), "app/costs/components/AnalysisTab.tsx");
  const cssPath = join(process.cwd(), "app/costs/costing-redesign.css");
  const filterPopoverPath = join(process.cwd(), "components/costing/CostingFilterPopover.tsx");

  const pageContent = readFileSync(pagePath, "utf-8");
  const tabContent = readFileSync(tabPath, "utf-8");
  const cssContent = readFileSync(cssPath, "utf-8");
  const filterPopoverContent = readFileSync(filterPopoverPath, "utf-8");

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

    it("maintains consistent Urbanist font and Figma color tokens", () => {
      expect(cssContent).toContain("#2563EB"); // Primary blue
      expect(cssContent).toContain("#0F172A"); // Dark text
      expect(cssContent).toContain("#64748B"); // Secondary slate text
      expect(cssContent).toContain("#E4ECFB"); // Track background
      expect(cssContent).toContain("#EFF6FF"); // Active blue tint
      expect(cssContent).toContain("Urbanist"); // Primary font
    });
  });

  describe("2. Page Heading and Actions (Frame 2147225066 & Frame 2147225069)", () => {
    it("renders Costing Library title and supporting description", () => {
      expect(pageContent).toContain("Costing Library");
      expect(pageContent).toContain("Budget control | Vendor comparison | Variance analysis");
      expect(pageContent).toContain("costing-main-heading");
      expect(pageContent).toContain("costing-subheading");
    });

    it("renders Import Excel and New Item actions", () => {
      expect(pageContent).toContain("Import Excel");
      expect(pageContent).toContain("costing-import-excel-btn");
      expect(pageContent).toContain("New Item");
      expect(pageContent).toContain("costing-new-item-btn");
      expect(pageContent).toContain("<AddItemModal");
      expect(pageContent).toContain("<CostingExcelImportModal");
    });
  });

  describe("3. Costing Module Navigation & Filter Button (Frame 2147225076 & Frame 109)", () => {
    it("renders all 6 module navigation tabs with Analysis support", () => {
      for (const tab of ["Library", "Categories", "Analysis", "Scenarios", "Margins", "Settings"]) {
        expect(pageContent).toContain(`"${tab}"`);
      }
      expect(pageContent).toContain('activeTab === "Analysis"');
    });

    it("renders Filter button in toolbar row when on Analysis tab matching Frame 109", () => {
      expect(pageContent).toContain("<CostingFilterPopover");
      expect(pageContent).toContain('showLabel={true}');
      expect(pageContent).toContain('title="Filter Analysis"');
      expect(filterPopoverContent).toContain("projectFilter");
      expect(filterPopoverContent).toContain("onProjectChange");
      expect(filterPopoverContent).toContain("Project");
    });
  });

  describe("4. Costing 5 KPI Cards (Frame 2147225138)", () => {
    it("renders all 5 KPI cards in exact Figma order with correct classes", () => {
      expect(tabContent).toContain('title="Total Budget"');
      expect(tabContent).toContain('title="Actual Cost"');
      expect(tabContent).toContain('title="Committed"');
      expect(tabContent).toContain('title="Forecast"');
      expect(tabContent).toContain('title="Variance"');
      expect(tabContent).toContain("costing-kpi-grid");
      expect(tabContent).toContain("costing-kpi-card");
      expect(tabContent).toContain("costing-kpi-title");
      expect(tabContent).toContain("costing-kpi-value");
      expect(tabContent).toContain("costing-kpi-track");
      expect(tabContent).toContain("costing-kpi-fill");
    });

    it("defines 4px slim progress indicator and 114px card height in CSS", () => {
      expect(cssContent).toContain(".costing-kpi-card");
      expect(cssContent).toContain("min-height: 114px;");
      expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6);");
      expect(cssContent).toContain("border-radius: 6px;");
      expect(cssContent).toContain("padding: 20px;");
      expect(cssContent).toContain(".costing-kpi-track");
      expect(cssContent).toContain("height: 4px;");
      expect(cssContent).toContain("background: #E4ECFB;");
      expect(cssContent).toContain(".costing-kpi-fill");
      expect(cssContent).toContain("background: #2563EB;");
    });
  });

  describe("5. Analysis Sub-Navigation (Frame 2147224980)", () => {
    it("renders Cost Overview, Vendor Comparison, and Variance Analysis tabs", () => {
      expect(tabContent).toContain('"Cost Overview"');
      expect(tabContent).toContain('"Vendor Comparison"');
      expect(tabContent).toContain('"Variance Analysis"');
      expect(tabContent).toContain("costing-analysis-subnav");
      expect(tabContent).toContain("costing-analysis-tab-btn");
    });

    it("applies 1px solid #D7DFEA border-bottom and 2px #0F172A active underline in CSS", () => {
      expect(cssContent).toContain(".costing-analysis-subnav");
      expect(cssContent).toContain("border-bottom: 1px solid #D7DFEA;");
      expect(cssContent).toContain(".costing-analysis-tab-btn.is-active::after");
      expect(cssContent).toContain("background: #0F172A;");
      expect(cssContent).toContain("height: 2px;");
    });
  });

  describe("6. Budget vs Actual by Category Chart (Frame 93 & Frame 2147225140)", () => {
    it("renders heading, dynamic project subtitle, and legend lines", () => {
      expect(tabContent).toContain("Budget vs Actual by Category");
      expect(tabContent).toContain("costing-overview-chart-header");
      expect(tabContent).toContain("costing-overview-chart-title");
      expect(tabContent).toContain("costing-overview-chart-subtitle");
      expect(tabContent).toContain("costing-legend-item is-budget");
      expect(tabContent).toContain("costing-legend-item is-actual");
      expect(tabContent).toContain("Budget");
      expect(tabContent).toContain("Actual");
    });

    it("renders 5 dashed horizontal gridlines and grouped vertical bars with rounded top corners", () => {
      expect(tabContent).toContain("costing-chart-gridlines");
      expect(tabContent).toContain("costing-gridline-dash");
      expect(tabContent).toContain("costing-chart-bars-wrap");
      expect(tabContent).toContain("costing-bar is-budget");
      expect(tabContent).toContain("costing-bar is-actual");
      expect(tabContent).toContain("costing-chart-tooltip");
      expect(cssContent).toContain(".costing-bar");
      expect(cssContent).toContain("border-radius: 4px 4px 0px 0px;");
      expect(cssContent).toContain(".costing-bar.is-budget");
      expect(cssContent).toContain("background: #DAE0E6;");
      expect(cssContent).toContain(".costing-bar.is-actual");
      expect(cssContent).toContain("background: #2563EB;");
    });
  });

  describe("7. Budget Utilization Panel (Frame 2147225000)", () => {
    it("renders Budget Utilization title, category names, percentages, and 6px progress bars", () => {
      expect(tabContent).toContain("Budget Utilization");
      expect(tabContent).toContain("costing-overview-utilization-card");
      expect(tabContent).toContain("costing-utilization-title");
      expect(tabContent).toContain("costing-utilization-name");
      expect(tabContent).toContain("costing-utilization-pct");
      expect(tabContent).toContain("costing-utilization-track");
      expect(tabContent).toContain("costing-utilization-fill");
    });

    it("defines 6px height with 9999px fully rounded ends in CSS", () => {
      expect(cssContent).toContain(".costing-utilization-track");
      expect(cssContent).toContain("height: 6px;");
      expect(cssContent).toContain("background: #E4ECFB;");
      expect(cssContent).toContain("border-radius: 9999px;");
      expect(cssContent).toContain(".costing-utilization-fill");
      expect(cssContent).toContain("background: #2563EB;");
      expect(cssContent).toContain("border-radius: 9999px;");
    });
  });

  describe("8. Markup & Tax Summary Card (Frame 2147225000)", () => {
    it("renders Base Cost, Markup, GST, 1px divider, and Client Price rows", () => {
      expect(tabContent).toContain("Markup & Tax");
      expect(tabContent).toContain("costing-overview-markup-card");
      expect(tabContent).toContain("Base Cost");
      expect(tabContent).toContain("Markup (");
      expect(tabContent).toContain("GST (");
      expect(tabContent).toContain("costing-markup-divider");
      expect(tabContent).toContain("Client Price");
    });

    it("defines 1px divider (#DCE1E6) and 16px client price typography in CSS", () => {
      expect(cssContent).toContain(".costing-markup-divider");
      expect(cssContent).toContain("background: #DCE1E6;");
      expect(cssContent).toContain("height: 1px;");
      expect(cssContent).toContain(".costing-markup-total-label");
      expect(cssContent).toContain("font-size: 16px;");
      expect(cssContent).toContain(".costing-markup-total-val");
      expect(cssContent).toContain("font-size: 16px;");
    });
  });

  describe("9. Financial Currency Formatting", () => {
    it("formats amounts accurately in INR Lakhs matching Figma reference", () => {
      expect(formatMoney(4250000)).toBe("₹42.5L");
      expect(formatMoney(2890000)).toBe("₹28.9L");
      expect(formatMoney(3200000)).toBe("₹32.0L");
      expect(formatMoney(4100000)).toBe("₹41.0L");
      expect(formatMoney(-150000)).toBe("-₹1.5L");
      expect(formatMoney(520000)).toBe("₹5.2L");
      expect(formatMoney(610000)).toBe("₹6.1L");
      expect(formatMoney(4020000)).toBe("₹40.2L");
    });

    it("formats Y-axis ticks with Lakh abbreviations and ₹0L", () => {
      expect(formatMoney(1800000, true)).toBe("₹18L");
      expect(formatMoney(1350000, true)).toBe("₹13.5L");
      expect(formatMoney(900000, true)).toBe("₹9L");
      expect(formatMoney(450000, true)).toBe("₹4.5L");
      expect(formatMoney(0, true)).toBe("₹0L");
    });
  });
});
