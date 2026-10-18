import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Costing Library Redesign (Figma CSS Accurate)", () => {
  const pagePath = join(process.cwd(), "app/costs/page.tsx");
  const tabPath = join(process.cwd(), "app/costs/components/LibraryTab.tsx");
  const cssPath = join(process.cwd(), "app/costs/costing-redesign.css");
  const paginationPath = join(process.cwd(), "components/costing/CostingPagination.tsx");
  const rateDropdownPath = join(process.cwd(), "components/costing/RateStatusDropdown.tsx");
  const moreMenuPath = join(process.cwd(), "components/costing/CostingMoreMenu.tsx");
  const addModalPath = join(process.cwd(), "app/costs/components/AddItemModal.tsx");

  const pageContent = readFileSync(pagePath, "utf-8");
  const tabContent = readFileSync(tabPath, "utf-8");
  const cssContent = readFileSync(cssPath, "utf-8");
  const paginationContent = readFileSync(paginationPath, "utf-8");
  const rateDropdownContent = readFileSync(rateDropdownPath, "utf-8");
  const moreMenuContent = readFileSync(moreMenuPath, "utf-8");
  const addModalContent = readFileSync(addModalPath, "utf-8");

  describe("Figma Design Tokens & Typography", () => {
    it("inherits dashboard parent shell with DashboardRail and DashboardHeader", () => {
      expect(pageContent).toContain("<DashboardRail");
      expect(pageContent).toContain("<DashboardHeader title=\"Costing\"");
      expect(pageContent).toContain("fig-dashboard");
    });

    it("imports and applies the scoped costing-redesign stylesheet", () => {
      expect(pageContent).toContain('import "./costing-redesign.css"');
      expect(cssContent).toContain(".costing-page-shell");
      expect(cssContent).toContain(".costing-bg-gradient-overlay");
    });

    it("defines exact Figma colors and fonts", () => {
      expect(cssContent).toContain("#2563EB"); // Primary blue
      expect(cssContent).toContain("#0F172A"); // Primary text
      expect(cssContent).toContain("#64748B"); // Secondary text
      expect(cssContent).toContain("#E4ECFB"); // Header background
      expect(cssContent).toContain("#EFF6FF"); // Selected tab background
      expect(cssContent).toContain("#EBEBEB"); // Divider
      expect(cssContent).toContain("#16A34A"); // Success green
      expect(cssContent).toContain("Urbanist"); // Base font
    });
  });

  describe("Page Heading & Import Excel Action", () => {
    it("renders Costing Library title and exact subtitle", () => {
      expect(pageContent).toContain("Costing Library");
      expect(pageContent).toContain("Budget control | Vendor comparison | Variance analysis");
    });

    it("renders the Import Excel button connected to modal", () => {
      expect(pageContent).toContain("Import Excel");
      expect(pageContent).toContain("setIsExcelImportOpen(true)");
      expect(pageContent).toContain("<CostingExcelImportModal");
    });
  });

  describe("Navigation Tabs", () => {
    it("renders all 6 tabs in correct order", () => {
      for (const tab of ["Library", "Categories", "Analysis", "Scenarios", "Margins", "Settings"]) {
        expect(pageContent).toContain(`"${tab}"`);
      }
    });

    it("preserves active tab switching and child component views", () => {
      expect(pageContent).toContain("activeTab === \"Library\"");
      expect(pageContent).toContain("activeTab === \"Categories\"");
      expect(pageContent).toContain("activeTab === \"Analysis\"");
      expect(pageContent).toContain("activeTab === \"Scenarios\"");
      expect(pageContent).toContain("activeTab === \"Margins\"");
      expect(pageContent).toContain("activeTab === \"Settings\"");
    });
  });

  describe("Library Toolbar & Search", () => {
    it("renders glassmorphic search input and New Item button", () => {
      expect(tabContent).toContain("Search category by name…");
      expect(tabContent).toContain("costing-search-box");
      expect(tabContent).toContain("costing-search-icon-tile");
      expect(tabContent).toContain("New Item");
      expect(tabContent).toContain("costing-new-item-btn");
      expect(tabContent).toContain("<CostingFilterPopover");
    });
  });

  describe("Costing Table & Columns", () => {
    it("renders all 11 columns in Figma reference order", () => {
      const columns = [
        "ITEM",
        "TYPE",
        "CATEGORY",
        "UNIT",
        "BASE COST (₹)",
        "SELLING RATE (₹)",
        "MARGIN",
        "PREFERRED VENDOR",
        "RATE STATUS",
        "UPDATED",
      ];
      for (const col of columns) {
        expect(tabContent).toContain(col);
      }
    });

    it("implements Figma cell layout structures", () => {
      expect(tabContent).toContain("costing-item-cell");
      expect(tabContent).toContain("costing-item-thumb");
      expect(tabContent).toContain("costing-type-pill");
      expect(tabContent).toContain("costing-category-stack");
      expect(tabContent).toContain("costing-vendor-cell");
      expect(tabContent).toContain("costing-vendor-avatar");
    });

    it("displays dynamic backend values without hardcoded data", () => {
      expect(tabContent).toContain("getCostingItems");
      expect(tabContent).toContain("formatMoney(base)");
      expect(tabContent).toContain("formatMoney(selling)");
      expect(tabContent).toContain("marginVal.toFixed(2)");
      expect(tabContent).toContain("formatDate");
    });
  });

  describe("Item Actions & CRUD Operations", () => {
    it("integrates Edit Item into AddItemModal and CostingMoreMenu", () => {
      expect(tabContent).toContain("handleEditItem");
      expect(tabContent).toContain("itemToEdit={editingItem}");
      expect(addModalContent).toContain("itemToEdit");
      expect(addModalContent).toContain("updateCostingItem");
      expect(addModalContent).toContain("Save Changes");
    });

    it("integrates Duplicate and Delete operations with backend API", () => {
      expect(tabContent).toContain("handleDuplicateItem");
      expect(tabContent).toContain("handleDeleteItem");
      expect(tabContent).toContain("duplicateCostingItem");
      expect(tabContent).toContain("deleteCostingItem");
    });

    it("renders Figma Frame 90 dropdown styling with Edit, Duplicate, and Delete Item", () => {
      expect(moreMenuContent).toContain("Edit Item");
      expect(moreMenuContent).toContain("Duplicate Item");
      expect(moreMenuContent).toContain("Delete Item");
      expect(moreMenuContent).toContain("#DC2626");
      expect(moreMenuContent).toContain("166px");
    });
  });

  describe("Rate Status & Pagination", () => {
    it("renders Figma Frame 2147225014 rate status pill badge", () => {
      expect(rateDropdownContent).toContain("APPROVED");
      expect(rateDropdownContent).toContain("DRAFT");
      expect(rateDropdownContent).toContain("EXPIRED");
      expect(rateDropdownContent).toContain("9999px");
    });

    it("renders Figma Frame 2147225166 pagination bar with Total Items and Show per Page", () => {
      expect(paginationContent).toContain("costing-pagination-bar");
      expect(paginationContent).toContain("Total");
      expect(paginationContent).toContain("Show per Page:");
      expect(paginationContent).toContain("costing-page-btn");
      expect(paginationContent).toContain("costing-page-size-select");
    });
  });
});
