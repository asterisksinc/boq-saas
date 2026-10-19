import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Costing Modals & Drawer Redesign (Figma CSS Accurate)", () => {
  const cssPath = join(process.cwd(), "app/costs/costing-redesign.css");
  const addItemModalPath = join(process.cwd(), "app/costs/components/AddItemModal.tsx");
  const newCategoryModalPath = join(process.cwd(), "app/costs/components/NewCategoryModal.tsx");
  const newSubCategoryModalPath = join(process.cwd(), "app/costs/components/NewSubCategoryModal.tsx");
  const pagePath = join(process.cwd(), "app/costs/page.tsx");
  const libraryTabPath = join(process.cwd(), "app/costs/components/LibraryTab.tsx");

  const cssContent = readFileSync(cssPath, "utf-8");
  const addItemContent = readFileSync(addItemModalPath, "utf-8");
  const newCategoryContent = readFileSync(newCategoryModalPath, "utf-8");
  const newSubCategoryContent = readFileSync(newSubCategoryModalPath, "utf-8");
  const pageContent = readFileSync(pagePath, "utf-8");
  const libraryTabContent = readFileSync(libraryTabPath, "utf-8");

  describe("Add Item Drawer (Figma Frame 2147225094 - 460px Right-Docked)", () => {
    it("defines the exact translucent backdrop overlay and right alignment", () => {
      expect(cssContent).toContain(".costing-drawer-overlay");
      expect(cssContent).toMatch(/\.costing-drawer-overlay\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.1\);/);
      expect(cssContent).toMatch(/\.costing-drawer-overlay\s*\{[^}]*backdrop-filter:\s*blur\(2px\);/);
      expect(cssContent).toMatch(/\.costing-drawer-overlay\s*\{[^}]*justify-content:\s*flex-end;/);
    });

    it("defines the exact 460px drawer dimensions, glassmorphic background and blur", () => {
      expect(cssContent).toContain(".costing-add-item-drawer");
      expect(cssContent).toMatch(/\.costing-add-item-drawer\s*\{[^}]*width:\s*460px;/);
      expect(cssContent).toMatch(/\.costing-add-item-drawer\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.60?\);/);
      expect(cssContent).toMatch(/\.costing-add-item-drawer\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\);/);
      expect(cssContent).toMatch(/\.costing-add-item-drawer\s*\{[^}]*border-radius:\s*16px;/);
      expect(cssContent).toMatch(/\.costing-add-item-drawer\s*\{[^}]*padding:\s*16px;/);
    });

    it("defines the header with Urbanist font and close button", () => {
      expect(cssContent).toContain(".costing-drawer-header");
      expect(cssContent).toContain(".costing-drawer-title");
      expect(cssContent).toMatch(/\.costing-drawer-title\s*\{[^}]*font-family:\s*'Urbanist'/);
      expect(cssContent).toMatch(/\.costing-drawer-title\s*\{[^}]*font-weight:\s*600;/);
      expect(cssContent).toMatch(/\.costing-drawer-title\s*\{[^}]*font-size:\s*18px;/);
      expect(cssContent).toMatch(/\.costing-drawer-title\s*\{[^}]*color:\s*#0F172A;/);
      expect(cssContent).toContain(".costing-drawer-close-btn");
    });

    it("defines the white inner card containing the 8 form rows", () => {
      expect(cssContent).toContain(".costing-drawer-inner-card");
      expect(cssContent).toMatch(/\.costing-drawer-inner-card\s*\{[^}]*background:\s*#FFFFFF;/);
      expect(cssContent).toMatch(/\.costing-drawer-inner-card\s*\{[^}]*border-radius:\s*14px;/);
      expect(cssContent).toMatch(/\.costing-drawer-inner-card\s*\{[^}]*padding:\s*16px;/);
    });

    it("defines drag-and-drop file upload zone with 62x62px tile and primary blue border/tint", () => {
      expect(cssContent).toContain(".costing-form-upload-zone");
      expect(cssContent).toContain(".costing-form-upload-icon-tile");
      expect(cssContent).toMatch(/\.costing-form-upload-icon-tile\s*\{[^}]*width:\s*62px;/);
      expect(cssContent).toMatch(/\.costing-form-upload-icon-tile\s*\{[^}]*height:\s*62px;/);
      expect(cssContent).toMatch(/\.costing-form-upload-icon-tile\s*\{[^}]*background:\s*rgba\(37,\s*99,\s*235,\s*0\.1\);/);
      expect(cssContent).toMatch(/\.costing-form-upload-icon-tile\s*\{[^}]*border:\s*1px solid #2563EB;/);
      expect(cssContent).toMatch(/\.costing-form-upload-icon-tile\s*\{[^}]*border-radius:\s*8px;/);
      expect(cssContent).toContain(".costing-form-upload-text");
    });

    it("defines 2-column layout and 85px textarea per Figma", () => {
      expect(cssContent).toContain(".costing-form-row-2col");
      expect(cssContent).toMatch(/\.costing-form-row-2col\s*\{[^}]*gap:\s*16px;/);
      expect(cssContent).toContain(".costing-form-textarea");
      expect(cssContent).toMatch(/\.costing-form-textarea\s*\{[^}]*height:\s*85px;/);
    });

    it("defines exact Figma footer button specifications", () => {
      expect(cssContent).toContain(".costing-drawer-footer");
      expect(cssContent).toContain(".costing-drawer-cancel-btn");
      expect(cssContent).toMatch(/\.costing-drawer-cancel-btn\s*\{[^}]*width:\s*71px;/);
      expect(cssContent).toMatch(/\.costing-drawer-cancel-btn\s*\{[^}]*height:\s*46px;/);
      expect(cssContent).toMatch(/\.costing-drawer-cancel-btn\s*\{[^}]*background:\s*#FFFFFF;/);
      expect(cssContent).toMatch(/\.costing-drawer-cancel-btn\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
      expect(cssContent).toMatch(/\.costing-drawer-cancel-btn\s*\{[^}]*color:\s*#0F172A;/);

      expect(cssContent).toContain(".costing-drawer-add-btn");
      expect(cssContent).toMatch(/\.costing-drawer-add-btn\s*\{[^}]*height:\s*46px;/);
      expect(cssContent).toMatch(/\.costing-drawer-add-btn\s*\{[^}]*background:\s*#2563EB;/);
      expect(cssContent).toMatch(/\.costing-drawer-add-btn\s*\{[^}]*color:\s*#FFFFFF;/);
    });

    it("implements all Figma classes and preserves complete functionality in AddItemModal.tsx", () => {
      expect(addItemContent).toContain("costing-drawer-overlay");
      expect(addItemContent).toContain("costing-add-item-drawer");
      expect(addItemContent).toContain("costing-drawer-header");
      expect(addItemContent).toContain("costing-drawer-title");
      expect(addItemContent).toContain("costing-drawer-inner-card");
      expect(addItemContent).toContain("costing-drawer-footer");
      expect(addItemContent).toContain("costing-drawer-cancel-btn");
      expect(addItemContent).toContain("costing-drawer-add-btn");
      expect(addItemContent).toContain("costing-form-upload-zone");
      expect(addItemContent).toContain("costing-form-upload-icon-tile");

      // Functionality preservation
      expect(addItemContent).toContain("createCostingItem");
      expect(addItemContent).toContain("updateCostingItem");
      expect(addItemContent).toContain("uploadCostingImage");
      expect(addItemContent).toContain("itemToEdit");
      expect(addItemContent).toContain("Save Changes");
      expect(addItemContent).toContain("Add");
      expect(addItemContent).toContain("Drag & Drop Your File Here");
      expect(addItemContent).toContain("Selling Rate");
      expect(addItemContent).toContain("Spec / Finish");
      expect(addItemContent).toContain("Rate Status");
    });
  });

  describe("New Category Modal (Figma Frame 2147225094 - 590px Centered)", () => {
    it("defines centered modal overlay and 590px container", () => {
      expect(cssContent).toContain(".costing-modal-overlay-centered");
      expect(cssContent).toMatch(/\.costing-modal-overlay-centered\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.1\);/);
      expect(cssContent).toMatch(/\.costing-modal-overlay-centered\s*\{[^}]*backdrop-filter:\s*blur\(2px\);/);

      expect(cssContent).toContain(".costing-new-category-modal");
      expect(cssContent).toMatch(/\.costing-new-category-modal\s*\{[^}]*width:\s*590px;/);
      expect(cssContent).toMatch(/\.costing-new-category-modal\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.60?\);/);
      expect(cssContent).toMatch(/\.costing-new-category-modal\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\);/);
      expect(cssContent).toMatch(/\.costing-new-category-modal\s*\{[^}]*border-radius:\s*16px;/);
      expect(cssContent).toMatch(/\.costing-new-category-modal\s*\{[^}]*padding:\s*16px;/);
    });

    it("defines header with title stack and subtitle", () => {
      expect(cssContent).toContain(".costing-modal-header");
      expect(cssContent).toContain(".costing-modal-title-stack");
      expect(cssContent).toContain(".costing-modal-title");
      expect(cssContent).toContain(".costing-modal-subtitle");
      expect(cssContent).toMatch(/\.costing-modal-subtitle\s*\{[^}]*font-size:\s*16px;/);
      expect(cssContent).toMatch(/\.costing-modal-subtitle\s*\{[^}]*color:\s*#64748B;/);
    });

    it("defines white inner card and modal footer buttons", () => {
      expect(cssContent).toContain(".costing-modal-inner-card");
      expect(cssContent).toMatch(/\.costing-modal-inner-card\s*\{[^}]*background:\s*#FFFFFF;/);
      expect(cssContent).toMatch(/\.costing-modal-inner-card\s*\{[^}]*border-radius:\s*14px;/);

      expect(cssContent).toContain(".costing-modal-footer");
      expect(cssContent).toContain(".costing-modal-cancel-btn");
      expect(cssContent).toMatch(/\.costing-modal-cancel-btn\s*\{[^}]*width:\s*71px;/);
      expect(cssContent).toMatch(/\.costing-modal-cancel-btn\s*\{[^}]*height:\s*46px;/);

      expect(cssContent).toContain(".costing-modal-submit-btn");
      expect(cssContent).toMatch(/\.costing-modal-submit-btn\s*\{[^}]*height:\s*46px;/);
      expect(cssContent).toMatch(/\.costing-modal-submit-btn\s*\{[^}]*background:\s*#2563EB;/);
    });

    it("implements all Figma classes and preserves CRUD functionality in NewCategoryModal.tsx", () => {
      expect(newCategoryContent).toContain("costing-modal-overlay-centered");
      expect(newCategoryContent).toContain("costing-new-category-modal");
      expect(newCategoryContent).toContain("costing-modal-header");
      expect(newCategoryContent).toContain("costing-modal-title-stack");
      expect(newCategoryContent).toContain("costing-modal-title");
      expect(newCategoryContent).toContain("costing-modal-subtitle");
      expect(newCategoryContent).toContain("costing-modal-inner-card");
      expect(newCategoryContent).toContain("costing-modal-footer");
      expect(newCategoryContent).toContain("costing-modal-cancel-btn");
      expect(newCategoryContent).toContain("costing-modal-submit-btn");

      // Functionality & Content
      expect(newCategoryContent).toContain("Starting from: From Scratch");
      expect(newCategoryContent).toContain("Category Title");
      expect(newCategoryContent).toContain("createCostingCategory");
      expect(newCategoryContent).toContain("updateCostingCategory");
      expect(newCategoryContent).toContain("categoryToEdit");
      expect(newCategoryContent).toContain("Create Category");
      expect(newCategoryContent).toContain("Save Changes");
    });
  });

  describe("SubCategory Modal Clean Syntax & Alignment", () => {
    it("verifies clean return statement in NewSubCategoryModal.tsx without duplicate syntax", () => {
      // Must not contain duplicate return (
      expect(newSubCategoryContent).not.toMatch(/return\s*\(\s*return\s*\(/);
      expect(newSubCategoryContent).toContain("costing-modal-overlay-centered");
      expect(newSubCategoryContent).toContain("costing-new-category-modal");
      expect(newSubCategoryContent).toContain("costing-modal-inner-card");
      expect(newSubCategoryContent).toContain("createCostingCategory");
    });
  });

  describe("Double Mounting Prevention in Costing Page", () => {
    it("renders AddItemModal inside LibraryTab and guards page.tsx global modal against duplicate render", () => {
      // LibraryTab renders AddItemModal
      expect(libraryTabContent).toContain("<AddItemModal");

      // page.tsx must only render AddItemModal when NOT on Library tab
      expect(pageContent).toContain('activeTab !== "Library" && (');
      expect(pageContent).toContain("<AddItemModal");
    });
  });
});
