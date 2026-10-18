import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Costing Category Detail & Overview Redesign (Figma CSS Accurate & Gap-Free)", () => {
  const detailPath = join(process.cwd(), "app/costs/components/CategoryDetail.tsx");
  const cssPath = join(process.cwd(), "app/costs/costing-redesign.css");
  const modalPath = join(process.cwd(), "app/costs/components/NewCategoryModal.tsx");

  const detailContent = readFileSync(detailPath, "utf-8");
  const cssContent = readFileSync(cssPath, "utf-8");
  const modalContent = readFileSync(modalPath, "utf-8");

  describe("Gap Elimination & Shell Architecture", () => {
    it("ensures costing-category-detail-shell is 100% width with no fixed 1326px/1440px or left offsets", () => {
      expect(cssContent).toContain(".costing-category-detail-shell");
      expect(cssContent).toMatch(/\.costing-category-detail-shell\s*\{[^}]*width:\s*100%;/);
      expect(cssContent).toMatch(/\.costing-category-detail-shell\s*\{[^}]*max-width:\s*100%;/);
      expect(cssContent).toMatch(/\.costing-category-detail-shell\s*\{[^}]*min-width:\s*0;/);
      expect(cssContent).not.toMatch(/\.costing-category-detail-shell\s*\{[^}]*width:\s*1326px;/);
      expect(cssContent).not.toMatch(/\.costing-category-detail-shell\s*\{[^}]*width:\s*1440px;/);
      expect(cssContent).not.toMatch(/\.costing-category-detail-shell\s*\{[^}]*left:\s*98px;/);
      expect(detailContent).toContain('className="costing-category-detail-shell"');
    });

    it("renders back navigation button matching Frame 2147225070 with Urbanist 16px 500 #475569", () => {
      expect(cssContent).toContain(".costing-back-link");
      expect(cssContent).toMatch(/\.costing-back-link\s*\{[^}]*font-family:\s*'Urbanist'/);
      expect(cssContent).toMatch(/\.costing-back-link\s*\{[^}]*font-size:\s*16px;/);
      expect(cssContent).toMatch(/\.costing-back-link\s*\{[^}]*font-weight:\s*500;/);
      expect(cssContent).toMatch(/\.costing-back-link\s*\{[^}]*color:\s*#475569;/);
      expect(detailContent).toContain('className="costing-back-link"');
      expect(detailContent).toContain("Back to Categories");
    });
  });

  describe("Category Detail Header Row (Frame 2147225066)", () => {
    it("displays category name, folder icon, active status pill, and description", () => {
      expect(cssContent).toContain(".costing-detail-header-row");
      expect(cssContent).toContain(".costing-detail-title-group");
      expect(cssContent).toContain(".costing-detail-name-row");
      expect(cssContent).toContain(".costing-detail-title");
      expect(cssContent).toContain(".costing-detail-description");
      expect(detailContent).toContain('className="costing-detail-header-row"');
      expect(detailContent).toContain('className="costing-detail-title"');
      expect(detailContent).toContain('className="costing-detail-description"');
      expect(detailContent).toContain('className={`costing-status-pill');
    });

    it("renders action buttons for Duplicate and Edit Category matching Frame 2147225064 and 2147225065", () => {
      expect(cssContent).toContain(".costing-detail-actions");
      expect(cssContent).toContain(".costing-detail-action-btn");
      expect(cssContent).toMatch(/\.costing-detail-action-btn\s*\{[^}]*padding:\s*14px 20px;/);
      expect(cssContent).toMatch(/\.costing-detail-action-btn\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
      expect(cssContent).toMatch(/\.costing-detail-action-btn\s*\{[^}]*border-radius:\s*6px;/);
      expect(detailContent).toContain("handleDuplicateCategory");
      expect(detailContent).toContain("setIsEditCategoryOpen(true)");
      expect(detailContent).toContain("Duplicate");
      expect(detailContent).toContain("Edit Category");
    });
  });

  describe("Dynamic 4 Metric Summary Cards (Frame 2147225138)", () => {
    it("implements responsive 4-column metric grid with exact card styling", () => {
      expect(cssContent).toContain(".costing-detail-metrics-grid");
      expect(cssContent).toMatch(/\.costing-detail-metrics-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/);
      expect(cssContent).toContain(".costing-metric-card");
      expect(cssContent).toMatch(/\.costing-metric-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
      expect(cssContent).toMatch(/\.costing-metric-card\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
      expect(cssContent).toMatch(/\.costing-metric-card\s*\{[^}]*border-radius:\s*6px;/);
      expect(cssContent).toContain(".costing-metric-label");
      expect(cssContent).toContain(".costing-metric-value");
      expect(cssContent).toContain(".costing-metric-link");
    });

    it("renders dynamic counts and navigation links for Items, Sub-Categories, Used in BOQs, and Used in Projects", () => {
      expect(detailContent).toContain('className="costing-detail-metrics-grid"');
      expect(detailContent).toContain("itemsCount");
      expect(detailContent).toContain("subCategoriesCount");
      expect(detailContent).toContain("usedInBoqsCount");
      expect(detailContent).toContain("usedInProjectsCount");
      expect(detailContent).toContain("View Items →");
      expect(detailContent).toContain("View Sub-Categories →");
      expect(detailContent).toContain("View BOQs →");
      expect(detailContent).toContain("View Projects →");
    });
  });

  describe("Sub-Tabs Bar (Frame 2147225076)", () => {
    it("renders 5 sub-tabs with #EFF6FF active pill and #2563EB font", () => {
      expect(cssContent).toContain(".costing-subtabs-bar");
      expect(cssContent).toContain(".costing-subtabs-list");
      expect(cssContent).toContain(".costing-subtab-btn");
      expect(cssContent).toMatch(/\.costing-subtab-btn\.is-active\s*\{[^}]*background:\s*#EFF6FF;/);
      expect(cssContent).toMatch(/\.costing-subtab-btn\.is-active\s*\{[^}]*color:\s*#2563EB;/);
      expect(detailContent).toContain('tabs: SubTab[] = ["Overview", "Sub Categories", "Items", "Pricing Defaults", "Activity"]');
      expect(detailContent).toContain('className={`costing-subtab-btn ${activeTab === tab ? "is-active" : ""}`}');
    });
  });

  describe("Overview 3-Column Layout (Frame 2147225128)", () => {
    it("implements responsive 3-column grid for Category Information, Hierarchy & Pricing, and Recent Activity", () => {
      expect(cssContent).toContain(".costing-overview-main-grid");
      expect(cssContent).toMatch(/\.costing-overview-main-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.85fr\)\s*minmax\(260px,\s*1fr\)\s*minmax\(280px,\s*1\.05fr\);/);
      expect(detailContent).toContain('className="costing-overview-main-grid"');
    });

    it("renders Column 1 with Category Information in 2-column key-value grid and white card shadow", () => {
      expect(cssContent).toContain(".costing-overview-panel-card");
      expect(cssContent).toContain(".costing-overview-panel-title");
      expect(cssContent).toContain(".costing-overview-inner-card");
      expect(cssContent).toMatch(/\.costing-overview-inner-card\s*\{[^}]*box-shadow:\s*0px 0px 6px rgba\(0,\s*0,\s*0,\s*0\.06\);/);
      expect(cssContent).toMatch(/\.costing-overview-inner-card\s*\{[^}]*border-radius:\s*14px;/);
      expect(cssContent).toContain(".costing-kv-grid");
      expect(cssContent).toContain(".costing-kv-item");
      expect(cssContent).toContain(".costing-kv-label");
      expect(cssContent).toContain(".costing-kv-value");
      expect(detailContent).toContain("CATEGORY INFORMATION");
      expect(detailContent).toContain("Category Name");
      expect(detailContent).toContain("Category Code");
      expect(detailContent).toContain("Parent Category");
      expect(detailContent).toContain("Default Unit");
      expect(detailContent).toContain("Created On");
      expect(detailContent).toContain("Created By");
      expect(detailContent).toContain("Updated On");
      expect(detailContent).toContain("Updated By");
      expect(detailContent).toContain("Description");
    });

    it("renders Column 2 with HIERARCHY and PRICING DETAILS stacked cards", () => {
      expect(detailContent).toContain("HIERARCHY");
      expect(detailContent).toContain("PRICING DETAILS");
      expect(detailContent).toContain("Default Markup");
      expect(detailContent).toContain("Default Tax");
      expect(detailContent).toContain("Default Wastage");
      expect(detailContent).toContain("Cost Code");
      expect(cssContent).toContain(".costing-pricing-row");
    });

    it("renders Column 3 with RECENT ACTIVITY list, avatars, and divider lines", () => {
      expect(detailContent).toContain("RECENT ACTIVITY");
      expect(cssContent).toContain(".costing-activity-list");
      expect(cssContent).toContain(".costing-activity-row");
      expect(cssContent).toContain(".costing-activity-avatar");
      expect(cssContent).toContain(".costing-activity-title");
      expect(cssContent).toContain(".costing-activity-details");
      expect(cssContent).toContain(".costing-activity-time");
      expect(cssContent).toContain(".costing-activity-divider");
      expect(detailContent).toContain('className="costing-activity-divider"');
    });
  });

  describe("Dynamic API Binding & Full Mutation Support", () => {
    it("fetches dynamic category detail via getCostingCategoryDetail", () => {
      expect(detailContent).toContain("getCostingCategoryDetail");
      expect(detailContent).toContain("loadDetail");
    });

    it("supports categoryToEdit in NewCategoryModal for updating category details", () => {
      expect(detailContent).toContain("categoryToEdit={activeCat}");
      expect(modalContent).toContain("categoryToEdit");
      expect(modalContent).toContain("updateCostingCategory");
    });
  });
});
