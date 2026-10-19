import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { formatMoney, formatFullCurrency } from "../lib/costing-format";

describe("Costing Analysis - Vendor Comparison Redesign (Figma CSS Accurate)", () => {
  const pagePath = join(process.cwd(), "app/costs/page.tsx");
  const tabPath = join(process.cwd(), "app/costs/components/AnalysisTab.tsx");
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
      expect(cssContent).toContain("#64748B"); // Secondary slate text
      expect(cssContent).toContain("#E4ECFB"); // Table header background
      expect(cssContent).toContain("#16A34A"); // Selected green
      expect(cssContent).toContain("#D97706"); // Amber star rating
      expect(cssContent).toContain("#EBEBEB"); // Row divider line
    });
  });

  describe("2. Top 5 KPI Cards and Subnav Integration", () => {
    it("renders top 5 KPI cards in exact Figma order with 4px progress tracks", () => {
      expect(tabContent).toContain('title="Total Budget"');
      expect(tabContent).toContain('title="Actual Cost"');
      expect(tabContent).toContain('title="Committed"');
      expect(tabContent).toContain('title="Forecast"');
      expect(tabContent).toContain('title="Variance"');
      expect(tabContent).toContain("costing-kpi-grid");
      expect(tabContent).toContain("costing-kpi-card");
    });

    it("renders 3 sub-navigation tabs with Vendor Comparison active state", () => {
      expect(tabContent).toContain('"Cost Overview"');
      expect(tabContent).toContain('"Vendor Comparison"');
      expect(tabContent).toContain('"Variance Analysis"');
      expect(tabContent).toContain('activeTab === "Vendor Comparison"');
      expect(cssContent).toContain(".costing-analysis-tab-btn.is-active");
    });
  });

  describe("3. Vendor Comparison Card Container (Frame 2147225071)", () => {
    it("renders costing-vendor-card container matching Figma auto layout and glass styling", () => {
      expect(tabContent).toContain('className="costing-vendor-card"');
      expect(cssContent).toContain(".costing-vendor-card {");
      expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6);");
      expect(cssContent).toContain("border-radius: 6px;");
      expect(cssContent).toContain("padding: 20px;");
      expect(cssContent).toContain("gap: 20px;");
    });
  });

  describe("4. Header Row & BOQ Item Selector (Frame 2147225151 & Frame 2147225103)", () => {
    it("renders left header title 'Items' and subtitle matching Frame 2147224969", () => {
      expect(tabContent).toContain('className="costing-vendor-header"');
      expect(tabContent).toContain('className="costing-vendor-header-left"');
      expect(tabContent).toContain('className="costing-vendor-header-title"');
      expect(tabContent).toContain(">Items<");
      expect(tabContent).toContain('className="costing-vendor-header-subtitle"');
      expect(cssContent).toContain(".costing-vendor-header-title");
      expect(cssContent).toContain(".costing-vendor-header-subtitle");
    });

    it("renders BOQ item dropdown with exact 289px x 46px styling and chevron icon (Frame 2147225103)", () => {
      expect(tabContent).toContain('className="costing-vendor-item-select-wrap"');
      expect(tabContent).toContain('className="costing-vendor-item-select"');
      expect(tabContent).toContain("ChevronDown");
      expect(cssContent).toContain(".costing-vendor-item-select-wrap {");
      expect(cssContent).toContain("width: 289px;");
      expect(cssContent).toContain("height: 46px;");
      expect(cssContent).toContain("background: #FFFFFF;");
      expect(cssContent).toContain("border: 1px solid #E2E8F0;");
      expect(cssContent).toContain("border-radius: 8px;");
    });

    it("populates dropdown dynamically from real BOQ items", () => {
      expect(tabContent).toContain("items.map(item => (");
      expect(tabContent).toContain("<option key={item.id} value={item.id}>");
      expect(tabContent).toContain("All Items");
    });
  });

  describe("5. Table Header Structure (Frame 57)", () => {
    it("renders table header with #E4ECFB background, 36px height, and 8px border-radius", () => {
      expect(tabContent).toContain('className="costing-vendor-table-header"');
      expect(cssContent).toContain(".costing-vendor-table-header {");
      expect(cssContent).toContain("background: #E4ECFB;");
      expect(cssContent).toContain("height: 36px;");
      expect(cssContent).toContain("border-radius: 8px;");
    });

    it("renders all 7 columns in exact Figma order with uppercase labels", () => {
      expect(tabContent).toContain('costing-col-check');
      expect(tabContent).toContain('costing-col-vendor');
      expect(tabContent).toContain(">VENDOR<");
      expect(tabContent).toContain('costing-col-quote');
      expect(tabContent).toContain(">QUOTE<");
      expect(tabContent).toContain('costing-col-lead');
      expect(tabContent).toContain(">LEAD TIME<");
      expect(tabContent).toContain('costing-col-rating');
      expect(tabContent).toContain(">RATING<");
      expect(tabContent).toContain('costing-col-status');
      expect(tabContent).toContain(">STATUS<");
      expect(tabContent).toContain('costing-col-action');
      expect(tabContent).toContain(">ACTION<");
    });

    it("applies uppercase Urbanist 600 14px #64748B typography to table headers", () => {
      expect(cssContent).toContain(".costing-vendor-th {");
      expect(cssContent).toContain("text-transform: uppercase;");
      expect(cssContent).toContain("color: #64748B;");
      expect(cssContent).toContain("font-weight: 600;");
      expect(cssContent).toContain("font-size: 14px;");
    });
  });

  describe("6. Table Rows and Cells (Frame 59, 83, 81)", () => {
    it("renders 56px height rows with #EBEBEB dividers", () => {
      expect(tabContent).toContain('className="costing-vendor-row');
      expect(tabContent).toContain('className="costing-vendor-row-divider"');
      expect(cssContent).toContain(".costing-vendor-row {");
      expect(cssContent).toContain("height: 56px;");
      expect(cssContent).toContain(".costing-vendor-row-divider {");
      expect(cssContent).toContain("background: #EBEBEB;");
      expect(cssContent).toContain("height: 1px;");
    });

    it("renders selection checkbox control with #16A34A green checkmark when selected", () => {
      expect(tabContent).toContain('costing-vendor-checkbox-btn');
      expect(tabContent).toContain('role="checkbox"');
      expect(tabContent).toContain('q.selected ? "is-checked" : ""');
      expect(cssContent).toContain(".costing-vendor-checkbox-btn {");
      expect(cssContent).toContain(".costing-vendor-checkbox-btn.is-checked {");
      expect(cssContent).toContain("background: #16A34A;");
      expect(cssContent).toContain("border-color: #16A34A;");
    });

    it("renders vendor name in Urbanist 500 14px #0F172A", () => {
      expect(tabContent).toContain('className="costing-vendor-name"');
      expect(cssContent).toContain(".costing-vendor-name {");
      expect(cssContent).toContain("font-weight: 500;");
      expect(cssContent).toContain("font-size: 14px;");
      expect(cssContent).toContain("color: #0F172A;");
    });

    it("formats quoted price in Indian currency (INR)", () => {
      expect(tabContent).toContain("formatFullCurrency(q.quote)");
      expect(formatFullCurrency(185000)).toBe("₹1,85,000");
      expect(formatFullCurrency(210000)).toBe("₹2,10,000");
      expect(formatFullCurrency(172000)).toBe("₹1,72,000");
    });

    it("renders lead time in days with fallback", () => {
      expect(tabContent).toContain('className="costing-vendor-lead-time"');
      expect(tabContent).toContain('q.lead_time_days ? `${q.lead_time_days} days` : "—"');
      expect(cssContent).toContain(".costing-vendor-lead-time {");
      expect(cssContent).toContain("color: #64748B;");
    });

    it("renders star icon with amber #D97706 rating score", () => {
      expect(tabContent).toContain('className="costing-vendor-rating"');
      expect(tabContent).toContain('className="costing-vendor-star-icon"');
      expect(cssContent).toContain(".costing-vendor-rating {");
      expect(cssContent).toContain("color: #D97706;");
      expect(cssContent).toContain(".costing-vendor-star-icon {");
      expect(cssContent).toContain("color: #D97706;");
      expect(cssContent).toContain("fill: #D97706;");
    });

    it("renders status badges with pill styling for SELECTED and QUOTED states", () => {
      expect(tabContent).toContain('costing-vendor-status-badge');
      expect(tabContent).toContain('q.selected ? "is-selected" : "is-quoted"');
      expect(tabContent).toContain('q.selected ? "SELECTED" : "QUOTED"');
      expect(cssContent).toContain(".costing-vendor-status-badge {");
      expect(cssContent).toContain("border-radius: 9999px;");
      expect(cssContent).toContain(".costing-vendor-status-badge.is-selected {");
      expect(cssContent).toContain("background: rgba(22, 163, 74, 0.12);");
      expect(cssContent).toContain("color: #16A34A;");
      expect(cssContent).toContain(".costing-vendor-status-badge.is-quoted {");
      expect(cssContent).toContain("background: rgba(100, 116, 139, 0.12);");
      expect(cssContent).toContain("color: #64748B;");
    });

    it("renders action button matching Buttons frame: 62px x 34px with #2563EB border", () => {
      expect(tabContent).toContain('costing-select-vendor-btn');
      expect(tabContent).toContain('costing-selected-action-pill');
      expect(cssContent).toContain(".costing-select-vendor-btn {");
      expect(cssContent).toContain("width: 62px;");
      expect(cssContent).toContain("height: 34px;");
      expect(cssContent).toContain("border: 1px solid #2563EB;");
      expect(cssContent).toContain("border-radius: 6px;");
      expect(cssContent).toContain("color: #2563EB;");
      expect(cssContent).toContain("font-size: 12px;");
    });
  });

  describe("7. Backend Mutation and Persistence Integration", () => {
    it("calls selectVendorQuote api function on user selection toggle", () => {
      expect(tabContent).toContain("selectVendorQuote(quoteId, select)");
      expect(tabContent).toContain("onRefresh()");
      expect(apiContent).toContain("export async function selectVendorQuote");
      expect(apiContent).toContain("/api/v1/costing/vendor-quotes/");
      expect(apiContent).toContain("/selection");
    });

    it("supports empty state with 'Add First Quote' button when no quotes exist", () => {
      expect(tabContent).toContain('costing-vendor-empty-card');
      expect(tabContent).toContain('costing-vendor-empty-title');
      expect(tabContent).toContain('costing-vendor-empty-desc');
      expect(tabContent).toContain("Add First Quote");
      expect(cssContent).toContain(".costing-vendor-empty-card {");
    });

    it("integrates AddVendorQuoteModal with pre-selected item from active dropdown", () => {
      expect(tabContent).toContain("<AddVendorQuoteModal");
      expect(tabContent).toContain("initialItemId={addQuoteInitialItemId}");
      expect(tabContent).toContain("onOpenAddModal={(itemId?: string) => {");
    });
  });
});
