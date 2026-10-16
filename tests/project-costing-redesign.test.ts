import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Project Costing Tab Redesign (Figma CSS Accurate)", () => {
  const pagePath = join(process.cwd(), "app/projects/[id]/page.tsx");
  const cssPath = join(process.cwd(), "app/project-overview.css");

  const pageContent = readFileSync(pagePath, "utf-8");
  const cssContent = readFileSync(cssPath, "utf-8");

  describe("Figma CSS Styling & Layout Tokens", () => {
    it("defines the .po-costing-* CSS classes for container, summary, and section panels", () => {
      expect(cssContent).toContain(".po-costing-container");
      expect(cssContent).toContain(".po-costing-summary-panel");
      expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6)");
      expect(cssContent).toContain(".po-costing-kpi-grid");
      expect(cssContent).toContain("grid-template-columns: repeat(4, 1fr)");
    });

    it("defines KPI card styles with 14px radius, 32px values, and 12px captions", () => {
      expect(cssContent).toContain(".po-costing-kpi-card");
      expect(cssContent).toContain("border-radius: 14px");
      expect(cssContent).toContain(".po-costing-kpi-label");
      expect(cssContent).toContain(".po-costing-kpi-value");
      expect(cssContent).toContain("font-size: 32px");
      expect(cssContent).toContain(".po-costing-kpi-caption");
    });

    it("defines Category-Wise Cost header and Export Report button styling", () => {
      expect(cssContent).toContain(".po-costing-section-header");
      expect(cssContent).toContain(".po-costing-section-title");
      expect(cssContent).toContain("text-transform: uppercase");
      expect(cssContent).toContain(".po-costing-export-btn");
      expect(cssContent).toContain("border: 1px solid #E2E8F0");
      expect(cssContent).toContain("height: 46px");
    });

    it("defines 6-column comparison table with #E4ECFB header and 56px rows", () => {
      expect(cssContent).toContain(".po-costing-table-header");
      expect(cssContent).toContain("background: #E4ECFB");
      expect(cssContent).toContain(".po-costing-table-row");
      expect(cssContent).toContain("height: 56px");
      expect(cssContent).toContain(".po-costing-row-divider");
      expect(cssContent).toContain("background: #EBEBEB");
    });

    it("defines status pill badges for ON TRACK, OVER BUDGET, and AT RISK", () => {
      expect(cssContent).toContain(".po-costing-badge-on-track");
      expect(cssContent).toContain("rgba(22, 163, 74, 0.12)");
      expect(cssContent).toContain("#16A34A");

      expect(cssContent).toContain(".po-costing-badge-over-budget");
      expect(cssContent).toContain("rgba(217, 119, 6, 0.12)");
      expect(cssContent).toContain("#D97706");

      expect(cssContent).toContain(".po-costing-badge-at-risk");
    });
  });

  describe("Costing Component (app/projects/[id]/page.tsx)", () => {
    it("renders the 8 KPI metrics in 2 rows of 4 cards with proper labels and captions", () => {
      // Row 1
      expect(pageContent).toContain("Approved Budget");
      expect(pageContent).toContain("Cost ceiling");

      expect(pageContent).toContain("Actual Cost");
      expect(pageContent).toContain("% of budget");

      expect(pageContent).toContain("Committed Cost");
      expect(pageContent).toContain("POs raised");

      expect(pageContent).toContain("Gross Margin");
      expect(pageContent).toContain("Target: 35%");

      // Row 2
      expect(pageContent).toContain("Approved BOQ Value");
      expect(pageContent).toContain("Available Budget");
      expect(pageContent).toContain("Vendor Cost");
      expect(pageContent).toContain("Labour Cost");
    });

    it("renders the CATEGORY-WISE COST section and preserves Category-wise Cost Breakdown test contract", () => {
      expect(pageContent).toContain("CATEGORY-WISE COST");
      expect(pageContent).toContain("Category-wise Cost Breakdown");
      expect(pageContent).toContain("Export Report");
    });

    it("renders all 6 comparison table column headers", () => {
      const costingSlice = pageContent.slice(
        pageContent.indexOf("function Costing"),
        pageContent.indexOf("function Work")
      );
      expect(costingSlice).toContain("Category");
      expect(costingSlice).toContain("Estimated");
      expect(costingSlice).toContain("Actual");
      expect(costingSlice).toContain("Committed");
      expect(costingSlice).toContain("Variance");
      expect(costingSlice).toContain("Status");
    });

    it("renders status badges dynamically based on variance and status", () => {
      expect(pageContent).toContain("po-costing-badge-over-budget");
      expect(pageContent).toContain("po-costing-badge-on-track");
      expect(pageContent).toContain("OVER BUDGET");
      expect(pageContent).toContain("ON TRACK");
    });

    it("dynamically calculates metrics from project and backend analysis without hardcoding", () => {
      const costingSlice = pageContent.slice(
        pageContent.indexOf("function Costing"),
        pageContent.indexOf("function Work")
      );

      // Calculations are dynamic
      expect(costingSlice).toContain("Number(p.approvedBudget || summary?.totalBudget || p.projectValue || 0)");
      expect(costingSlice).toContain("approvedBudget - actualCost - committedCost");
      expect(costingSlice).toContain("((approvedBudget - actualCost) / approvedBudget) * 100");
      expect(costingSlice).toContain("formatCompactMoney(vendorCost)");
      expect(costingSlice).toContain("formatCompactMoney(labourCost)");
    });

    it("implements multi-sheet Excel export for Category Summary and Line Items", () => {
      const costingSlice = pageContent.slice(
        pageContent.indexOf("function Costing"),
        pageContent.indexOf("function Work")
      );

      expect(costingSlice).toContain("handleExportReport");
      expect(costingSlice).toContain("XLSX.utils.book_new()");
      expect(costingSlice).toContain("Category Summary");
      expect(costingSlice).toContain("Costing Items");
      expect(costingSlice).toContain("XLSX.writeFile");
    });

    it("preserves item-level breakdown with search, category filtering, and View In BOQ", () => {
      const costingSlice = pageContent.slice(
        pageContent.indexOf("function Costing"),
        pageContent.indexOf("function Work")
      );

      expect(costingSlice).toContain("Costing Items");
      expect(costingSlice).toContain("Search items…");
      expect(costingSlice).toContain("All Categories");
      expect(costingSlice).toContain("View In BOQ");
      expect(costingSlice).toContain("/api/v1/costing/items?projectId=");
      expect(costingSlice).toContain("getCostingAnalysis({ projectId: p.id })");
    });

    it("verifies user dashboard scoping: does not bleed into client or admin dashboard", () => {
      const railPath = join(process.cwd(), "components/client/ClientDashboardRail.tsx");
      const railContent = readFileSync(railPath, "utf-8");
      // Costing tab is user-only
      expect(railContent).not.toContain("Costing");
      expect(railContent).not.toContain("po-costing-container");
    });
  });
});
