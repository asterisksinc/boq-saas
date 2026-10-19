import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { formatScenarioVariance, formatScenarioDate, formatFullCurrency } from "../lib/costing-format";

describe("Costing Scenarios Redesign (Figma CSS Accurate)", () => {
  const pagePath = join(process.cwd(), "app/costs/page.tsx");
  const tabPath = join(process.cwd(), "app/costs/components/ScenariosTab.tsx");
  const cssPath = join(process.cwd(), "app/costs/costing-redesign.css");
  const costingApiPath = join(process.cwd(), "lib/api/costing.ts");

  const pageContent = readFileSync(pagePath, "utf-8");
  const tabContent = readFileSync(tabPath, "utf-8");
  const cssContent = readFileSync(cssPath, "utf-8");
  const apiContent = readFileSync(costingApiPath, "utf-8");

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
      expect(cssContent).toContain("#64748B"); // Slate label text
      expect(cssContent).toContain("#E4ECFB"); // Table header background
      expect(cssContent).toContain("#16A34A"); // Margin and favorable variance green
      expect(cssContent).toContain("#EF4444"); // Unfavorable variance red
      expect(cssContent).toContain("#EBEBEB"); // Row divider line
    });
  });

  describe("2. Navigation Toolbar & Frame 109 Filter Popover", () => {
    it("renders module navigation tabs including Scenarios in page.tsx", () => {
      expect(pageContent).toContain('"Scenarios"');
      expect(pageContent).toContain('activeTab === "Scenarios"');
    });

    it("renders Frame 109 Filter button via CostingFilterPopover with showLabel={true}", () => {
      expect(pageContent).toContain("<CostingFilterPopover");
      expect(pageContent).toContain('title="Filter Scenarios"');
      expect(pageContent).toContain("showLabel={true}");
      expect(pageContent).toContain('label: "Active"');
      expect(pageContent).toContain('label: "Quoted"');
      expect(pageContent).toContain('label: "Applied"');
      expect(pageContent).toContain('label: "Draft"');
    });

    it("renders New Scenario button in the top action group", () => {
      expect(pageContent).toContain("New Scenario");
      expect(pageContent).toContain("setIsNewScenarioOpen(true)");
    });
  });

  describe("3. Main Scenarios Container Card (Frame 2147225072)", () => {
    it("renders costing-scenarios-card container matching Figma auto layout and glass styling", () => {
      expect(tabContent).toContain('className="costing-scenarios-card"');
      expect(cssContent).toContain(".costing-scenarios-card {");
      expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6);");
      expect(cssContent).toContain("border-radius: 6px;");
      expect(cssContent).toContain("padding: 20px;");
      expect(cssContent).toContain("gap: 12px;");
      expect(cssContent).toContain("backdrop-filter: blur(10px);");
    });

    it("renders horizontal table scroll wrapper with min-width: 1240px", () => {
      expect(tabContent).toContain('className="costing-scenarios-table-wrapper"');
      expect(tabContent).toContain('className="costing-scenarios-table"');
      expect(cssContent).toContain(".costing-scenarios-table-wrapper");
      expect(cssContent).toContain(".costing-scenarios-table {");
      expect(cssContent).toContain("min-width: 1240px;");
    });
  });

  describe("4. Scenarios Table Header (Frame 57) & 11 Column Order", () => {
    it("renders header row with 36px height, #E4ECFB background, and 8px border-radius", () => {
      expect(tabContent).toContain('className="costing-scenarios-table-header"');
      expect(cssContent).toContain(".costing-scenarios-table-header {");
      expect(cssContent).toContain("height: 36px;");
      expect(cssContent).toContain("background: #E4ECFB;");
      expect(cssContent).toContain("border-radius: 8px;");
    });

    it("renders 11 table headers in exact Figma order with specified column widths", () => {
      // 1. Checkbox
      expect(tabContent).toContain("costing-col-sc-check");
      expect(cssContent).toContain(".costing-col-sc-check {");
      expect(cssContent).toContain("width: 40px;");

      // 2. SCENARIO
      expect(tabContent).toContain("costing-col-sc-name");
      expect(tabContent).toContain(">SCENARIO</th>");
      expect(cssContent).toContain(".costing-col-sc-name {");
      expect(cssContent).toContain("width: 241px;");

      // 3. BASELINE
      expect(tabContent).toContain("costing-col-sc-baseline");
      expect(tabContent).toContain(">BASELINE</th>");
      expect(cssContent).toContain(".costing-col-sc-baseline {");
      expect(cssContent).toContain("width: 165px;");

      // 4. TYPE
      expect(tabContent).toContain("costing-col-sc-type");
      expect(tabContent).toContain(">TYPE</th>");
      expect(cssContent).toContain(".costing-col-sc-type {");
      expect(cssContent).toContain("width: 88px;");

      // 5. TOTAL COST (₹)
      expect(tabContent).toContain("costing-col-sc-cost");
      expect(tabContent).toContain(">TOTAL COST (₹)</th>");
      expect(cssContent).toContain(".costing-col-sc-cost {");
      expect(cssContent).toContain("width: 129px;");

      // 6. SELLING VALUE (₹)
      expect(tabContent).toContain("costing-col-sc-selling");
      expect(tabContent).toContain(">SELLING VALUE (₹)</th>");
      expect(cssContent).toContain(".costing-col-sc-selling {");
      expect(cssContent).toContain("width: 153px;");

      // 7. MARGIN
      expect(tabContent).toContain("costing-col-sc-margin");
      expect(tabContent).toContain(">MARGIN</th>");
      expect(cssContent).toContain(".costing-col-sc-margin {");
      expect(cssContent).toContain("width: 88px;");

      // 8. VARIANCE
      expect(tabContent).toContain("costing-col-sc-variance");
      expect(tabContent).toContain(">VARIANCE</th>");
      expect(cssContent).toContain(".costing-col-sc-variance {");
      expect(cssContent).toContain("width: 112px;");

      // 9. STATUS
      expect(tabContent).toContain("costing-col-sc-status");
      expect(tabContent).toContain(">STATUS</th>");
      expect(cssContent).toContain(".costing-col-sc-status {");
      expect(cssContent).toContain("width: 91px;");

      // 10. UPDATED ON
      expect(tabContent).toContain("costing-col-sc-updated");
      expect(tabContent).toContain(">UPDATED ON</th>");
      expect(cssContent).toContain(".costing-col-sc-updated {");
      expect(cssContent).toContain("width: 125px;");

      // 11. Actions
      expect(tabContent).toContain("costing-col-sc-actions");
      expect(cssContent).toContain(".costing-col-sc-actions {");
      expect(cssContent).toContain("width: 64px;");
    });
  });

  describe("5. Table Rows, Dividers, Badges, and Dimensions", () => {
    it("renders rows with 56px height and #EBEBEB horizontal dividers", () => {
      expect(cssContent).toContain(".costing-scenarios-row {");
      expect(cssContent).toContain("height: 56px;");
      expect(cssContent).toContain(".costing-scenarios-td {");
      expect(cssContent).toContain("border-bottom: 1px solid #EBEBEB;");
    });

    it("renders checkbox button with 20px x 20px dimensions, rounded 4px and #2563EB checked state", () => {
      expect(cssContent).toContain(".costing-scenarios-checkbox-btn {");
      expect(cssContent).toContain("width: 20px;");
      expect(cssContent).toContain("height: 20px;");
      expect(cssContent).toContain("border-radius: 4px;");
      expect(cssContent).toContain(".costing-scenarios-checkbox-btn.is-checked {");
      expect(cssContent).toContain("background: #2563EB;");
    });

    it("renders scenario type badge with subtle slate background", () => {
      expect(tabContent).toContain("costing-sc-type-badge");
      expect(cssContent).toContain(".costing-sc-type-badge {");
      expect(cssContent).toContain("background: rgba(100, 116, 139, 0.12);");
      expect(cssContent).toContain("border-radius: 4px;");
    });

    it("renders status badges with proper pill background and color styles", () => {
      expect(tabContent).toContain("costing-sc-status-badge");
      expect(cssContent).toContain(".costing-sc-status-badge.status-active");
      expect(cssContent).toContain("background: #ECFDF5;");
      expect(cssContent).toContain("color: #16A34A;");
      expect(cssContent).toContain(".costing-sc-status-badge.status-applied");
      expect(cssContent).toContain(".costing-sc-status-badge.status-quoted");
      expect(cssContent).toContain("background: #EFF6FF;");
      expect(cssContent).toContain("color: #2563EB;");
      expect(cssContent).toContain(".costing-sc-status-badge.status-draft");
      expect(cssContent).toContain("background: #F1F5F9;");
      expect(cssContent).toContain("color: #64748B;");
    });

    it("renders row action menu with CostingMoreMenu", () => {
      expect(tabContent).toContain('<CostingMoreMenu');
      expect(tabContent).toContain('entityName="Scenario"');
      expect(tabContent).toContain("onDuplicate");
      expect(tabContent).toContain("onDelete");
    });
  });

  describe("6. Formatters & Value Transformations", () => {
    it("formats full currency correctly with Indian numbering system", () => {
      expect(formatFullCurrency(185000)).toBe("₹1,85,000");
      expect(formatFullCurrency(2250000)).toBe("₹22,50,000");
      expect(formatFullCurrency(0)).toBe("₹0");
    });

    it("formats variance matching Figma spec (e.g. ₹12.1L (-9.3%) and ₹0 (0.0%))", () => {
      expect(formatScenarioVariance(0, 0)).toBe("₹0 (0.0%)");
      expect(formatScenarioVariance(-1210000, -9.3)).toBe("₹12.1L (-9.3%)");
      expect(formatScenarioVariance(500000, 4.2)).toBe("+₹5.0L (+4.2%)");
    });

    it("formats scenario date and time cleanly", () => {
      const formatted = formatScenarioDate("2026-08-24T10:23:00Z");
      expect(formatted).toContain("24 Aug 2026");
      expect(formatScenarioDate(null)).toBe("-");
    });
  });

  describe("7. Dynamic Backend Integration & Mutability", () => {
    it("imports and connects real backend API endpoints", () => {
      expect(tabContent).toContain("getCostingScenarios");
      expect(tabContent).toContain("createCostingScenario");
      expect(tabContent).toContain("duplicateCostingScenario");
      expect(tabContent).toContain("deleteCostingScenario");
    });

    it("includes modal form for creating new scenarios with baseline and type options", () => {
      expect(tabContent).toContain("New Costing Scenario");
      expect(tabContent).toContain("BOQ Baseline");
      expect(tabContent).toContain("Scenario Type");
      expect(tabContent).toContain("handleCreateScenario");
    });

    it("integrates CostingPagination at the bottom of the table card", () => {
      expect(tabContent).toContain("<CostingPagination");
      expect(tabContent).toContain("currentPage={currentPage}");
      expect(tabContent).toContain("totalPages=");
    });
  });
});
