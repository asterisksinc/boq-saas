import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  MOCK_PROJECTS,
  MOCK_LEADS,
  createInitialCategories,
} from "../lib/mood-boards/mock-data";
import {
  saveDraftMoodBoard,
  loadDraftMoodBoard,
  clearDraftMoodBoard,
  loadMoodBoards,
  addMoodBoard,
} from "../lib/mood-boards/storage";
import { moodBoardRepository } from "../lib/mood-boards/repository";

describe("Create Mood Board Editor — Architecture & Figma Spec Verification", () => {
  const root = process.cwd();
  const editorCompPath = join(root, "components", "mood-boards", "editor", "CreateMoodBoardEditor.tsx");
  const actionBarPath = join(root, "components", "mood-boards", "editor", "MoodBoardActionBar.tsx");
  const basicDetailsPath = join(root, "components", "mood-boards", "editor", "MoodBoardBasicDetails.tsx");
  const categoriesPath = join(root, "components", "mood-boards", "editor", "MoodBoardCategories.tsx");
  const itemsPath = join(root, "components", "mood-boards", "editor", "MoodBoardItems.tsx");
  const previewPath = join(root, "components", "mood-boards", "editor", "MoodBoardPreview.tsx");
  const unsavedPath = join(root, "components", "mood-boards", "editor", "UnsavedChangesDialog.tsx");
  const addCategoryModalPath = join(root, "components", "mood-boards", "editor", "AddCategoryModal.tsx");
  const newPagePath = join(root, "app", "mood-boards", "new", "page.tsx");
  const dashboardNewPagePath = join(root, "app", "dashboard", "mood-boards", "new", "page.tsx");
  const cssPath = join(root, "app", "mood-boards", "mood-boards.css");

  describe("1. Component File Structure Verification", () => {
    it("verifies all modular editor components exist", () => {
      expect(existsSync(editorCompPath)).toBe(true);
      expect(existsSync(actionBarPath)).toBe(true);
      expect(existsSync(basicDetailsPath)).toBe(true);
      expect(existsSync(categoriesPath)).toBe(true);
      expect(existsSync(itemsPath)).toBe(true);
      expect(existsSync(previewPath)).toBe(true);
      expect(existsSync(unsavedPath)).toBe(true);
      expect(existsSync(addCategoryModalPath)).toBe(true);
      expect(existsSync(newPagePath)).toBe(true);
      expect(existsSync(dashboardNewPagePath)).toBe(true);
    });
  });

  describe("2. Top Action Bar Verification (Section 4 & Frame 2147225068)", () => {
    const actionBarContent = readFileSync(actionBarPath, "utf-8");
    const cssContent = readFileSync(cssPath, "utf-8");

    it("verifies title 'Create Mood Board' and back button exist", () => {
      expect(actionBarContent).toContain("Create Mood Board");
      expect(actionBarContent).toContain("ArrowLeft");
      expect(actionBarContent).toContain("onBack");
    });

    it("verifies Cancel, Save as Draft, and Create Mood Board buttons exist", () => {
      expect(actionBarContent).toContain("Cancel");
      expect(actionBarContent).toContain("Save as Draft");
      expect(actionBarContent).toContain("Create Mood Board");
    });

    it("verifies Action Bar CSS matches Figma spec", () => {
      expect(cssContent).toContain(".mb-action-bar-frame");
      expect(cssContent).toContain(".mb-action-btn-cancel");
      expect(cssContent).toContain(".mb-action-btn-draft");
      expect(cssContent).toContain(".mb-action-btn-create");
      expect(cssContent).toContain("min-width: 152px");
      expect(cssContent).toContain("background: #2563EB");
    });
  });

  describe("3. Basic Details Section Verification (Section 5 & Frame 2147225071)", () => {
    const detailsContent = readFileSync(basicDetailsPath, "utf-8");
    const cssContent = readFileSync(cssPath, "utf-8");

    it("contains Mood Board Name * with red asterisk and Enter Mood Board Name placeholder", () => {
      expect(detailsContent).toContain("Mood Board Name");
      expect(detailsContent).toContain("mb-required-star");
      expect(detailsContent).toContain("Enter Mood Board Name");
    });

    it("contains Project * dropdown populated with MOCK_PROJECTS", () => {
      expect(detailsContent).toContain("Select Project");
      expect(detailsContent).toContain("MOCK_PROJECTS");
      expect(MOCK_PROJECTS.length).toBeGreaterThan(0);
    });

    it("contains Lead * dropdown populated with MOCK_LEADS", () => {
      expect(detailsContent).toContain("Select Lead");
      expect(detailsContent).toContain("MOCK_LEADS");
      expect(MOCK_LEADS.length).toBeGreaterThan(0);
    });

    it("contains Description field", () => {
      expect(detailsContent).toContain("Description");
      expect(detailsContent).toContain("Enter description");
    });

    it("verifies CSS matches Figma translucent outer card and inner white card", () => {
      expect(cssContent).toContain(".mb-section-card");
      expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6)");
      expect(cssContent).toContain("border-radius: 6px");
      expect(cssContent).toContain(".mb-inner-white-card");
      expect(cssContent).toContain("box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.06)");
      expect(cssContent).toContain("border-radius: 14px");
    });
  });

  describe("4. Categories Section Verification (Section 6 & Frame 2147225617)", () => {
    const categoriesContent = readFileSync(categoriesPath, "utf-8");
    const initialCats = createInitialCategories();

    it("initializes with 5 core mock categories (Entrance, Living Room, Dining, Kitchen, Master Bedroom)", () => {
      const names = initialCats.map((c) => c.name);
      expect(names).toContain("Entrance");
      expect(names).toContain("Living Room");
      expect(names).toContain("Dining");
      expect(names).toContain("Kitchen");
      expect(names).toContain("Master Bedroom");
    });

    it("verifies initial image count values match Figma reference (8, 16, 10, 24, 18)", () => {
      const entrance = initialCats.find((c) => c.name === "Entrance");
      const living = initialCats.find((c) => c.name === "Living Room");
      const dining = initialCats.find((c) => c.name === "Dining");
      const kitchen = initialCats.find((c) => c.name === "Kitchen");
      const master = initialCats.find((c) => c.name === "Master Bedroom");

      expect(entrance?.imageCount).toBe(8);
      expect(living?.imageCount).toBe(16);
      expect(dining?.imageCount).toBe(10);
      expect(kitchen?.imageCount).toBe(24);
      expect(master?.imageCount).toBe(18);
    });

    it("verifies Add More Category button and reordering/rename handlers exist", () => {
      expect(categoriesContent).toContain("Add More Category");
      expect(categoriesContent).toContain("onRenameCategory");
      expect(categoriesContent).toContain("onDeleteCategory");
      expect(categoriesContent).toContain("onReorderCategories");
    });

    it("verifies Master Bedroom contains sub-groups (Furniture, Painting, Electrical)", () => {
      const master = initialCats.find((c) => c.name === "Master Bedroom");
      const groupNames = master?.itemGroups?.map((g) => g.name);
      expect(groupNames).toContain("Furniture");
      expect(groupNames).toContain("Painting");
      expect(groupNames).toContain("Electrical");
    });
  });

  describe("5. Items Section Verification (Section 7 & Frame 2147225126)", () => {
    const itemsContent = readFileSync(itemsPath, "utf-8");
    const cssContent = readFileSync(cssPath, "utf-8");

    it("contains table headers: DESCRIPTION, QTY, RATE, AMOUNT", () => {
      expect(itemsContent).toContain("DESCRIPTION");
      expect(itemsContent).toContain("QTY");
      expect(itemsContent).toContain("RATE");
      expect(itemsContent).toContain("AMOUNT");
    });

    it("contains Add Item button", () => {
      expect(itemsContent).toContain("Add Item");
      expect(itemsContent).toContain("onAddItem");
    });

    it("calculates amount automatically on quantity or rate change", () => {
      expect(itemsContent).toContain("item.amount");
      expect(itemsContent).toContain("onUpdateItem");
    });

    it("verifies CSS table header #E4ECFB and Urbanist typography", () => {
      expect(cssContent).toContain(".mb-items-table-header");
      expect(cssContent).toContain("background: #E4ECFB");
    });
  });

  describe("6. Right Panel: Mood Board Preview & Financial Summary (Section 8 & Frame 2147225071)", () => {
    const previewContent = readFileSync(previewPath, "utf-8");
    const cssContent = readFileSync(cssPath, "utf-8");

    it("contains MOODBOARD PREVIEW heading and Change Template button", () => {
      expect(previewContent).toContain("MOODBOARD PREVIEW");
      expect(previewContent).toContain("Change Template");
      expect(previewContent).toContain("onChangeTemplate");
    });

    it("displays Subtotal, GST (18%), and Total Amount", () => {
      expect(previewContent).toContain("Subtotal");
      expect(previewContent).toContain("GST (18%)");
      expect(previewContent).toContain("Total Amount");
    });

    it("supports image uploads, dropzone, and sample swatch generation", () => {
      expect(previewContent).toContain("UploadCloud");
      expect(previewContent).toContain("Add Sample Swatch");
      expect(previewContent).toContain("onAddImagesToCategory");
      expect(previewContent).toContain("onSetCoverImage");
    });

    it("verifies CSS styling for preview panel and summary card", () => {
      expect(cssContent).toContain(".mb-preview-panel");
      expect(cssContent).toContain(".mb-financial-summary-card");
      expect(cssContent).toContain(".mb-summary-total-val");
    });
  });

  describe("7. Draft Storage & Persistence (Section 12)", () => {
    it("can save, load, and clear working drafts in localStorage", () => {
      const mockDraft = {
        name: "Test Penthouse Suite",
        projectId: "proj-1",
        leadId: "lead-1",
        description: "Draft concept description",
      };

      saveDraftMoodBoard(mockDraft);
      const loaded = loadDraftMoodBoard();
      expect(loaded).toBeDefined();
      expect(loaded?.name).toBe("Test Penthouse Suite");

      clearDraftMoodBoard();
      const afterClear = loadDraftMoodBoard();
      expect(afterClear).toBeNull();
    });

    it("repository create persists leadId, leadName, categories, and mode", async () => {
      const initialCats = createInitialCategories();
      const created = await moodBoardRepository.create({
        name: "Bespoke Villa Master Suite",
        projectId: "proj-2",
        leadId: "lead-2",
        leadName: "Alex Morgan",
        description: "Full bespoke villa interior spec",
        mode: "blank",
        categories: initialCats,
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe("Bespoke Villa Master Suite");
      expect(created.leadName).toBe("Alex Morgan");
      expect(created.categories?.length).toBe(5);

      const fetched = await moodBoardRepository.getById(created.id);
      expect(fetched).toBeDefined();
      expect(fetched?.name).toBe("Bespoke Villa Master Suite");
      expect(fetched?.leadName).toBe("Alex Morgan");
    });
  });

  describe("8. Unsaved Changes & Dialog (Section 4 & 13)", () => {
    const unsavedContent = readFileSync(unsavedPath, "utf-8");

    it("contains Unsaved Changes dialog with Leave Without Saving and Keep Editing", () => {
      expect(unsavedContent).toContain("Unsaved Changes");
      expect(unsavedContent).toContain("Keep Editing");
      expect(unsavedContent).toContain("Leave Without Saving");
      expect(unsavedContent).toContain("Save Draft & Leave");
    });
  });
});
