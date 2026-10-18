import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Costing Categories → Category Detail → Sub Categories Redesign (Figma Accurate & Gap-Free)", () => {
  const pagePath = join(process.cwd(), "app/costs/page.tsx");
  const categoriesTabPath = join(process.cwd(), "app/costs/components/CategoriesTab.tsx");
  const detailPath = join(process.cwd(), "app/costs/components/CategoryDetail.tsx");
  const cssPath = join(process.cwd(), "app/costs/costing-redesign.css");
  const filterPopoverPath = join(process.cwd(), "components/costing/CostingFilterPopover.tsx");

  const pageContent = readFileSync(pagePath, "utf-8");
  const categoriesTabContent = readFileSync(categoriesTabPath, "utf-8");
  const detailContent = readFileSync(detailPath, "utf-8");
  const cssContent = readFileSync(cssPath, "utf-8");
  const filterPopoverContent = readFileSync(filterPopoverPath, "utf-8");

  describe("Requirement 1: Section 1 (Costing Library Header + Tabs) Exclusion in Detail View", () => {
    it("omits .costing-heading-row and .costing-tabs-toolbar-row when isCategoryDetailActive is true", () => {
      expect(pageContent).toContain("isCategoryDetailActive");
      expect(pageContent).toMatch(/\{!isCategoryDetailActive\s*&&\s*\(\s*<>[\s\S]*?costing-heading-row[\s\S]*?costing-tabs-toolbar-row/);
    });

    it("resets isCategoryDetailActive on tab change to guarantee clean navigation", () => {
      expect(pageContent).toContain("setIsCategoryDetailActive(false)");
    });

    it("synchronizes CategoriesTab active detail selection with onDetailViewChange", () => {
      expect(categoriesTabContent).toContain("onDetailViewChange");
      expect(categoriesTabContent).toContain("onDetailViewChange?.(Boolean(activeDetailCategory))");
    });
  });

  describe("Requirement 2: Background Contrast & Atmosphere (#F1F5F9, No Heavy Blue Wash)", () => {
    it("uses costing-dashboard class on main container and does not use boq-dashboard", () => {
      expect(pageContent).toContain('className="fig-dashboard costing-dashboard"');
      expect(pageContent).not.toMatch(/className="[^"]*boq-dashboard[^"]*"/);
    });

    it("sets .fig-dashboard.costing-dashboard background to #F1F5F9 in costing-redesign.css", () => {
      expect(cssContent).toContain(".fig-dashboard.costing-dashboard");
      expect(cssContent).toMatch(/\.fig-dashboard\.costing-dashboard\s*\{[^}]*background:\s*#F1F5F9\s*!important;/);
    });

    it("maintains subtle atmospheric top glow gradient", () => {
      expect(pageContent).toContain("costing-bg-gradient-overlay");
      expect(cssContent).toContain(".costing-dashboard .fig-dashboard-glow");
    });
  });

  describe("Requirement 3: Sub Categories Tab & Toolbar Specification (Frame 75, Frame 76, Frame 2147224972-4)", () => {
    it("supports initialTab prop in CategoryDetail and active Sub Categories tab highlighting", () => {
      expect(detailContent).toContain("initialTab?: SubTab");
      expect(detailContent).toContain('const [activeTab, setActiveTab] = useState<SubTab>(initialTab');
      expect(cssContent).toMatch(/\.costing-subtab-btn\.is-active\s*\{[^}]*background:\s*#EFF6FF;/);
      expect(cssContent).toMatch(/\.costing-subtab-btn\.is-active\s*\{[^}]*color:\s*#2563EB;/);
    });

    it("renders search box with icon tile, 46px height, search input, and clear button", () => {
      expect(detailContent).toContain('placeholder="Search sub-category..."');
      expect(detailContent).toContain('className="costing-search-icon-tile"');
      expect(detailContent).toContain('className="costing-search-input"');
      expect(detailContent).toContain('aria-label="Search sub-categories"');
      expect(detailContent).toContain('aria-label="Clear sub-category search"');
      expect(cssContent).toMatch(/\.costing-search-box\s*\{[^}]*height:\s*46px;/);
      expect(cssContent).toMatch(/\.costing-search-icon-tile\s*\{[^}]*width:\s*36px;\s*height:\s*36px;/);
    });

    it("renders CostingFilterPopover with showLabel={true} and Filter text", () => {
      expect(detailContent).toMatch(/<CostingFilterPopover[\s\S]*?currentStatus=\{subCatStatus\}[\s\S]*?showLabel=\{true\}/);
      expect(filterPopoverContent).toContain("showLabel = false");
      expect(filterPopoverContent).toContain("{showLabel && <span>Filter</span>}");
      expect(filterPopoverContent).toContain("SlidersHorizontal");
    });

    it("renders 46px height Import Excel button and + Sub-Category button", () => {
      expect(detailContent).toMatch(/<button[^>]*onClick=\{\(\)\s*=>\s*setIsExcelImportOpen\(true\)\}[^>]*className="costing-import-excel-btn"/);
      expect(detailContent).toMatch(/<button[^>]*onClick=\{\(\)\s*=>\s*setIsSubCategoryModalOpen\(true\)\}[^>]*className="costing-new-item-btn"/);
      expect(detailContent).toContain("Sub-Category");
      expect(cssContent).toMatch(/\.costing-import-excel-btn\s*\{[^}]*height:\s*46px;/);
      expect(cssContent).toMatch(/\.costing-new-item-btn[\s\S]*?\{[^}]*height:\s*46px;/);
      expect(cssContent).toMatch(/\.costing-new-item-btn[\s\S]*?\{[^}]*background:\s*#2563EB;/);
    });
  });

  describe("Requirement 4: Sub Categories Table Specifications (Frame 2147225069)", () => {
    it("renders 36px #E4ECFB header with SUB-CATEGORY CODE matching Figma column spec", () => {
      expect(cssContent).toMatch(/\.costing-categories-th-row\s*\{[^}]*height:\s*36px;/);
      expect(cssContent).toMatch(/\.costing-categories-th-row\s*\{[^}]*background:\s*#E4ECFB;/);
      expect(detailContent).toContain("SUB-CATEGORY NAME");
      expect(detailContent).toContain("SUB-CATEGORY CODE");
      expect(detailContent).toContain("ITEMS");
      expect(detailContent).toContain("USED IN BOQS");
      expect(detailContent).toContain("USED IN PROJECTS");
      expect(detailContent).toContain("STATUS");
      expect(detailContent).toContain("UPDATED");
    });

    it("renders 56px table rows with #EBEBEB borders, hover states, status pills, and action menu", () => {
      expect(cssContent).toMatch(/\.costing-categories-tr\s*\{[^}]*height:\s*56px;/);
      expect(cssContent).toMatch(/\.costing-categories-tr\s*\{[^}]*border-bottom:\s*1px solid #EBEBEB;/);
      expect(detailContent).toContain('className="costing-categories-tr"');
      expect(detailContent).toContain('className={`costing-status-pill');
      expect(detailContent).toContain('<CostingMoreMenu');
      expect(detailContent).toContain('entityName="Sub-Category"');
    });

    it("configures CostingPagination with label='Sub Categories' for exact Total Sub Categories display", () => {
      expect(detailContent).toContain('label="Sub Categories"');
    });
  });

  describe("Requirement 5: 100% Dynamic Backend Integration & CRUD Operations", () => {
    it("connects to real dynamic subcategories from detail.subCategories", () => {
      expect(detailContent).toContain("getCostingCategoryDetail");
      expect(detailContent).toContain("subCategoriesList = detail?.subCategories || []");
      expect(detailContent).toContain("filteredSubCategories");
      expect(detailContent).toContain("paginatedSubCategories");
    });

    it("implements sub-category deletion, duplication, modal creation, and Excel import", () => {
      expect(detailContent).toContain("deleteCostingCategory");
      expect(detailContent).toContain("duplicateCostingCategory");
      expect(detailContent).toContain("<NewSubCategoryModal");
      expect(detailContent).toContain("<CostingExcelImportModal");
    });
  });
});
