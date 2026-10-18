import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Costing Categories Redesign (Figma CSS Accurate & Gap-Free)", () => {
  const pagePath = join(process.cwd(), "app/costs/page.tsx");
  const tabPath = join(process.cwd(), "app/costs/components/CategoriesTab.tsx");
  const cssPath = join(process.cwd(), "app/costs/costing-redesign.css");
  const modalPath = join(process.cwd(), "app/costs/components/NewCategoryModal.tsx");
  const paginationPath = join(process.cwd(), "components/costing/CostingPagination.tsx");

  const pageContent = readFileSync(pagePath, "utf-8");
  const tabContent = readFileSync(tabPath, "utf-8");
  const cssContent = readFileSync(cssPath, "utf-8");
  const modalContent = readFileSync(modalPath, "utf-8");
  const paginationContent = readFileSync(paginationPath, "utf-8");

  describe("Gap Elimination & Layout Boundary Inheritance", () => {
    it("ensures costing-page-shell does NOT have fixed max-width: 1326px or centering margin auto", () => {
      // Must not constrain container to 1326px with auto margins that created left/right gaps
      expect(cssContent).not.toMatch(/\.costing-page-shell\s*\{[^}]*max-width:\s*1326px;/);
      expect(cssContent).not.toMatch(/\.costing-page-shell\s*\{[^}]*margin:\s*0 auto;/);
      expect(cssContent).toMatch(/\.costing-page-shell\s*\{[^}]*width:\s*100%;/);
      expect(cssContent).toMatch(/\.costing-page-shell\s*\{[^}]*max-width:\s*100%;/);
      expect(cssContent).toMatch(/\.costing-page-shell\s*\{[^}]*min-width:\s*0;/);
    });

    it("verifies costing-page-shell in page.tsx does not introduce redundant horizontal padding", () => {
      expect(pageContent).not.toContain('padding: "24px 32px"');
      expect(pageContent).toContain('className="costing-page-shell"');
    });

    it("inherits parent dashboard shell with DashboardRail, DashboardHeader, and glow", () => {
      expect(pageContent).toContain("<DashboardRail");
      expect(pageContent).toContain('<DashboardHeader title="Costing"');
      expect(pageContent).toContain("fig-dashboard");
      expect(pageContent).toContain("costing-bg-gradient-overlay");
    });
  });

  describe("Two-Panel Categories Workspace (Frame 2147225084)", () => {
    it("implements flexible grid layout with 310px left panel and responsive minmax right panel", () => {
      expect(cssContent).toContain(".costing-categories-workspace");
      expect(cssContent).toContain("grid-template-columns: 310px minmax(0, 1fr);");
      expect(cssContent).toContain("gap: 8px;");
      expect(tabContent).toContain('className="costing-categories-workspace"');
    });

    it("supports responsive collapse on smaller screens", () => {
      expect(cssContent).toMatch(/@media\s*\(max-width:\s*1024px\)\s*\{[^}]*\.costing-categories-workspace\s*\{[^}]*grid-template-columns:\s*1fr;/);
    });
  });

  describe("Left Panel: Category Structure Card & Tree (Frame 2147225071)", () => {
    it("renders the 310px card with exact background, border, and border-radius", () => {
      expect(cssContent).toContain(".costing-categories-tree-card");
      expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6);");
      expect(cssContent).toContain("border: 1px solid #E2E8F0;");
      expect(cssContent).toContain("border-radius: 6px;");
      expect(tabContent).toContain('className="costing-categories-tree-card"');
    });

    it("displays uppercase CATEGORY STRUCTURE title and dynamic counts", () => {
      expect(tabContent).toContain("CATEGORY STRUCTURE");
      expect(tabContent).toContain("Sections •");
      expect(tabContent).toContain("Items");
      expect(cssContent).toContain(".costing-categories-tree-title");
      expect(cssContent).toContain(".costing-categories-tree-subtitle");
    });

    it("provides tree search tile button (Frame 76 / 70) and divider (Rectangle 72)", () => {
      expect(cssContent).toContain(".costing-categories-tree-search-btn");
      expect(cssContent).toContain(".costing-categories-tree-search-inner");
      expect(cssContent).toContain(".costing-categories-tree-divider");
      expect(tabContent).toContain('className="costing-categories-tree-search-btn"');
      expect(tabContent).toContain('className="costing-categories-tree-divider"');
    });

    it("renders tree nodes with expandable arrow, folder icon, item count badge, and subcategory indentation", () => {
      expect(cssContent).toContain(".costing-categories-tree-row");
      expect(cssContent).toContain(".costing-categories-tree-arrow-btn");
      expect(cssContent).toContain(".costing-categories-tree-badge");
      expect(cssContent).toContain(".costing-categories-tree-subrow");
      expect(tabContent).toContain("costing-categories-tree-row");
      expect(tabContent).toContain("costing-categories-tree-subrow");
      expect(tabContent).toContain("costing-categories-tree-badge");
    });
  });

  describe("Right Panel: Categories Table & Columns (Frame 2147225072 & Frame 57)", () => {
    it("renders right table card and responsive horizontal scroll wrapper", () => {
      expect(cssContent).toContain(".costing-categories-table-card");
      expect(cssContent).toContain(".costing-categories-table-scroll");
      expect(cssContent).toContain(".costing-categories-table");
      expect(tabContent).toContain('className="costing-categories-table-card"');
      expect(tabContent).toContain('className="costing-categories-table-scroll"');
      expect(tabContent).toContain('className="costing-categories-table"');
    });

    it("implements all 11 columns matching Figma specification", () => {
      expect(tabContent).toContain("CATEGORY");
      expect(tabContent).toContain("CODE");
      expect(tabContent).toContain("PARENT CATEGORY");
      expect(tabContent).toContain("SUB-CATEGORIES");
      expect(tabContent).toContain("ITEMS");
      expect(tabContent).toContain("DEFAULT MARKUP");
      expect(tabContent).toContain("TAX");
      expect(tabContent).toContain("STATUS");
      expect(tabContent).toContain("UPDATED");
      expect(tabContent).toContain("ACTIONS");
    });

    it("styles header row with #E4ECFB background and 36px height", () => {
      expect(cssContent).toContain(".costing-categories-th-row");
      expect(cssContent).toContain("background: #E4ECFB;");
      expect(cssContent).toContain("height: 36px;");
      expect(cssContent).toContain(".costing-categories-th");
    });

    it("styles table rows with 56px height, divider, and hover states", () => {
      expect(cssContent).toContain(".costing-categories-tr");
      expect(cssContent).toContain("height: 56px;");
      expect(cssContent).toContain("border-bottom: 1px solid #EBEBEB;");
      expect(tabContent).toContain('className={`costing-categories-tr');
    });

    it("renders active status badge with #16A34A green pill", () => {
      expect(cssContent).toContain(".costing-status-pill");
      expect(cssContent).toContain("color: #16A34A;");
      expect(cssContent).toContain("background: rgba(22, 163, 74, 0.12);");
      expect(cssContent).toContain("border-radius: 9999px;");
      expect(tabContent).toContain('className={`costing-status-pill');
    });
  });

  describe("Pagination & CRUD Dynamic Capabilities", () => {
    it("renders CostingPagination with label='Categories' matching Frame 2147225166", () => {
      expect(tabContent).toContain("<CostingPagination");
      expect(tabContent).toContain('label="Categories"');
      expect(paginationContent).toContain("Total {label}:");
    });

    it("connects dynamic backend API methods for load, delete, duplicate, and update", () => {
      expect(tabContent).toContain("getCostingCategories");
      expect(tabContent).toContain("deleteCostingCategory");
      expect(tabContent).toContain("duplicateCostingCategory");
      expect(modalContent).toContain("updateCostingCategory");
      expect(modalContent).toContain("createCostingCategory");
    });

    it("supports categoryToEdit in NewCategoryModal for full CRUD editing", () => {
      expect(modalContent).toContain("categoryToEdit");
      expect(modalContent).toContain('categoryToEdit ? "Edit Category" : "New Category"');
      expect(modalContent).toContain('categoryToEdit ? "Save Changes" : "Create Category"');
    });
  });
});
