import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Costing Categories → Category Detail → Pricing Defaults & Activity Redesign (Figma Accurate & Gap-Free)", () => {
  const detailPath = join(process.cwd(), "app/costs/components/CategoryDetail.tsx");
  const cssPath = join(process.cwd(), "app/costs/costing-redesign.css");
  const pagePath = join(process.cwd(), "app/costs/page.tsx");

  const detailContent = readFileSync(detailPath, "utf-8");
  const cssContent = readFileSync(cssPath, "utf-8");
  const pageContent = readFileSync(pagePath, "utf-8");

  describe("Shared Dashboard Shell & Section 1 Absence", () => {
    it("ensures parent Costing Library header row and main tabs are omitted in detail view", () => {
      expect(pageContent).toContain("isCategoryDetailActive");
      expect(pageContent).toMatch(/\{!isCategoryDetailActive\s*&&\s*\(\s*<>[\s\S]*?costing-heading-row/);
    });

    it("verifies clean background #F1F5F9 without blue wash", () => {
      expect(pageContent).toContain('className="fig-dashboard costing-dashboard"');
      expect(cssContent).toMatch(/\.fig-dashboard\.costing-dashboard\s*\{[^}]*background:\s*#F1F5F9\s*!important;/);
    });

    it("renders shared 4 metric cards across all sub-tabs", () => {
      expect(detailContent).toContain('className="costing-detail-metrics-grid"');
      expect(detailContent).toContain("itemsCount");
      expect(detailContent).toContain("subCategoriesCount");
      expect(detailContent).toContain("usedInBoqsCount");
      expect(detailContent).toContain("usedInProjectsCount");
    });
  });

  describe("Part A: Category Pricing Defaults Redesign (Frame 2147225128)", () => {
    it("implements responsive 2-column grid layout with 320px sidebar", () => {
      expect(cssContent).toContain(".costing-pricing-defaults-grid");
      expect(cssContent).toMatch(/\.costing-pricing-defaults-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*320px;/);
      expect(cssContent).toContain(".costing-pricing-panel");
      expect(cssContent).toContain(".costing-pricing-inner-card");
      expect(cssContent).toMatch(/\.costing-pricing-inner-card\s*\{[^}]*box-shadow:\s*0px 0px 6px rgba\(0,\s*0,\s*0,\s*0\.06\);/);
      expect(cssContent).toMatch(/\.costing-pricing-inner-card\s*\{[^}]*border-radius:\s*14px;/);
      expect(detailContent).toContain('className="costing-pricing-defaults-grid"');
      expect(detailContent).toContain('className="costing-pricing-panel"');
    });

    it("renders all 10 required dynamic pricing fields in 5 rows of 2 columns", () => {
      expect(detailContent).toContain("Default Markup");
      expect(detailContent).toContain("Default Tax");
      expect(detailContent).toContain("Default Wastage");
      expect(detailContent).toContain("Default Unit");
      expect(detailContent).toContain("Transportation Included");
      expect(detailContent).toContain("Labour Included");
      expect(detailContent).toContain("Markup Type");
      expect(detailContent).toContain("Tax Applied On");
      expect(detailContent).toContain("Cost Code");
      expect(detailContent).toContain("Rate Effected From");

      // Dynamic bindings
      expect(detailContent).toContain("activeCat.default_markup_percent");
      expect(detailContent).toContain("activeCat.default_tax_percent");
      expect(detailContent).toContain("activeCat.default_waste_percent");
      expect(detailContent).toContain("activeCat.default_unit");
      expect(detailContent).toContain("activeCat.transport_included");
      expect(detailContent).toContain("activeCat.labour_included");
      expect(detailContent).toContain("activeCat.code");
    });

    it("renders INHERITED FROM sidebar section with Parent Category and Organisation Defaults", () => {
      expect(cssContent).toContain(".costing-pricing-sidebar");
      expect(cssContent).toContain(".costing-pricing-side-card");
      expect(detailContent).toContain("INHERITED FROM");
      expect(detailContent).toContain("Parent Category");
      expect(detailContent).toContain("Organisation Defaults");
      expect(detailContent).toContain("activeCat.parentName");
    });

    it("renders LAST UPDATED sidebar section with UPDATED ON and UPDATED BY", () => {
      expect(detailContent).toContain("LAST UPDATED");
      expect(detailContent).toContain("UPDATED ON");
      expect(detailContent).toContain("UPDATED BY");
    });

    it("provides Edit Defaults button to trigger category editing modal", () => {
      expect(detailContent).toContain("Edit Defaults");
      expect(detailContent).toContain("setIsEditCategoryOpen(true)");
    });
  });

  describe("Part B: Category Activity Redesign (Frame 2147225069)", () => {
    it("renders activity table with exact 36px #E4ECFB header row and 4 uppercase columns", () => {
      expect(cssContent).toContain(".costing-activity-table-card");
      expect(cssContent).toContain(".costing-activity-table");
      expect(cssContent).toMatch(/\.costing-activity-th-row\s*\{[^}]*height:\s*36px;/);
      expect(cssContent).toMatch(/\.costing-activity-th-row\s*\{[^}]*background:\s*#E4ECFB;/);
      expect(detailContent).toContain('className="costing-activity-table"');
      expect(detailContent).toContain("ACTION");
      expect(detailContent).toContain("DETAILS");
      expect(detailContent).toContain("BY");
      expect(detailContent).toContain("DATE");
    });

    it("renders 56px table rows with #EBEBEB borders and exact column styling", () => {
      expect(cssContent).toMatch(/\.costing-activity-tr\s*\{[^}]*height:\s*56px;/);
      expect(cssContent).toMatch(/\.costing-activity-tr\s*\{[^}]*border-bottom:\s*1px solid #EBEBEB;/);
      expect(cssContent).toContain(".costing-activity-td.td-action");
      expect(cssContent).toContain(".costing-activity-td.td-details");
      expect(cssContent).toContain(".costing-activity-td.td-by");
      expect(cssContent).toContain(".costing-activity-td.td-date");
      expect(detailContent).toContain('className="costing-activity-tr"');
    });

    it("uses dynamic category activities with formatted date and time", () => {
      expect(detailContent).toContain("formatDateTime");
      expect(detailContent).toContain("dynamicActivities");
      expect(detailContent).toContain("paginatedActivities");
    });

    it("integrates CostingPagination with label='Activity' for Total Activity display", () => {
      expect(detailContent).toMatch(/<CostingPagination[\s\S]*?label="Activity"/);
    });
  });
});
