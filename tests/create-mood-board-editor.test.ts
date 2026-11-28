import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  MOCK_PROJECTS,
  MOCK_CLIENTS,
  MOCK_LEADS,
} from "../lib/mood-boards/mock-data";
import {
  saveDraftMoodBoard,
  loadDraftMoodBoard,
  clearDraftMoodBoard,
  loadMoodBoards,
  addMoodBoard,
} from "../lib/mood-boards/storage";
import { moodBoardRepository } from "../lib/mood-boards/repository";
import { LAYOUT_TEMPLATES } from "../lib/mood-boards/templates-data";

describe("Redesigned Moodboard Creation Workflow — Category-Based Image Collection Verification", () => {
  const root = process.cwd();
  const editorCompPath = join(root, "components", "mood-boards", "editor", "CreateMoodBoardEditor.tsx");
  const actionBarPath = join(root, "components", "mood-boards", "editor", "MoodBoardActionBar.tsx");
  const basicDetailsPath = join(root, "components", "mood-boards", "editor", "MoodBoardBasicDetails.tsx");
  const categoriesPath = join(root, "components", "mood-boards", "editor", "MoodBoardCategories.tsx");
  const previewPath = join(root, "components", "mood-boards", "editor", "MoodBoardPreview.tsx");
  const templateSelectorPath = join(root, "components", "mood-boards", "editor", "MoodBoardTemplateSelector.tsx");
  const fullscreenModalPath = join(root, "components", "mood-boards", "editor", "MoodBoardFullscreenModal.tsx");
  const reviewStepPath = join(root, "components", "mood-boards", "editor", "MoodBoardReviewStep.tsx");
  const completeStepPath = join(root, "components", "mood-boards", "editor", "MoodBoardCompleteStep.tsx");
  const unsavedPath = join(root, "components", "mood-boards", "editor", "UnsavedChangesDialog.tsx");
  const addCategoryModalPath = join(root, "components", "mood-boards", "editor", "AddCategoryModal.tsx");
  const editTitleModalPath = join(root, "components", "mood-boards", "editor", "EditImageTitleModal.tsx");
  const newPagePath = join(root, "app", "mood-boards", "new", "page.tsx");
  const dashboardNewPagePath = join(root, "app", "dashboard", "mood-boards", "new", "page.tsx");
  const cssPath = join(root, "app", "mood-boards", "mood-boards.css");

  describe("1. Component File Structure Verification", () => {
    it("verifies all modular editor components exist for the redesigned workflow", () => {
      expect(existsSync(editorCompPath)).toBe(true);
      expect(existsSync(actionBarPath)).toBe(true);
      expect(existsSync(basicDetailsPath)).toBe(true);
      expect(existsSync(categoriesPath)).toBe(true);
      expect(existsSync(previewPath)).toBe(true);
      expect(existsSync(templateSelectorPath)).toBe(true);
      expect(existsSync(fullscreenModalPath)).toBe(true);
      expect(existsSync(reviewStepPath)).toBe(true);
      expect(existsSync(completeStepPath)).toBe(true);
      expect(existsSync(unsavedPath)).toBe(true);
      expect(existsSync(addCategoryModalPath)).toBe(true);
      expect(existsSync(editTitleModalPath)).toBe(true);
      expect(existsSync(newPagePath)).toBe(true);
      expect(existsSync(dashboardNewPagePath)).toBe(true);
      expect(existsSync(cssPath)).toBe(true);
    });
  });

  describe("2. Header & 3-Step Workflow Progress Indicator (Section 3)", () => {
    const actionBarContent = readFileSync(actionBarPath, "utf-8");
    const cssContent = readFileSync(cssPath, "utf-8");

    it("verifies title, breadcrumb, and back button exist", () => {
      expect(actionBarContent).toContain("Create Moodboard");
      expect(actionBarContent).toContain("ArrowLeft");
      expect(actionBarContent).toContain("onBack");
      expect(actionBarContent).toContain("mb-page-section-title");
      expect(actionBarContent).toContain("mb-page-navigation-row");
    });

    it("verifies three-step workflow indicator: Add Content -> Review -> Complete", () => {
      expect(actionBarContent).toContain("Add Content");
      expect(actionBarContent).toContain("Review");
      expect(actionBarContent).toContain("Complete");
      expect(actionBarContent).toContain("mb-workflow-stepper");
      expect(actionBarContent).toContain("mb-step-indicator");
    });

    it("verifies Cancel, Save as Draft, Continue to Review, and Create Mood Board actions exist", () => {
      expect(actionBarContent).toContain("Cancel");
      expect(actionBarContent).toContain("Save as Draft");
      expect(actionBarContent).toContain("Continue to Review");
      expect(actionBarContent).toContain("Create Mood Board");
    });

    it("verifies Action Bar and Stepper CSS tokens match design system", () => {
      expect(cssContent).toContain(".mb-action-bar-frame");
      expect(cssContent).toContain(".mb-workflow-stepper");
      expect(cssContent).toContain(".mb-step-indicator");
      expect(cssContent).toContain(".mb-action-btn-draft");
      expect(cssContent).toContain(".mb-action-btn-create");
      expect(cssContent).toContain("background: #2563EB");
    });

    it("fits the editor to the dashboard tab and keeps the header flush and aligned", () => {
      expect(cssContent).toMatch(/\.mood-boards-page \.moodboard-create-container[\s\S]*?width:\s*100%;/);
      expect(cssContent).toMatch(/\.mood-boards-page \.moodboard-create-container[\s\S]*?margin:\s*0;/);
      expect(cssContent).toContain(".mood-boards-page .mb-action-bar-left");
      expect(cssContent).toContain(".mood-boards-page .mb-action-bar-back-btn");
      expect(cssContent).toContain("margin-top: 0;");
      expect(cssContent).toContain("height: 34px;");
      expect(cssContent).toContain("grid-template-columns: repeat(4, minmax(0, 1fr));");
      expect(cssContent).toContain("max-height: calc(100vh - 32px);");
      expect(cssContent).toContain(".mood-boards-page .mb-action-bar-right");
      expect(cssContent).toContain(".mood-boards-page .mb-page-section-title");
      expect(cssContent).toContain("grid-template-columns: 68px minmax(0, 1fr);");
      expect(cssContent).toContain(".mood-boards-page .mb-action-bar-top-right");
      expect(cssContent).toContain("grid-template-columns: minmax(320px, 1fr) minmax(520px, auto)");
      expect(cssContent).toContain("grid-template-rows: 28px 46px;");
      expect(cssContent).toContain("grid-template-columns: minmax(0, 0.677fr) minmax(0, 1fr);");
      expect(cssContent).toContain("flex: 0 0 104px;");
    });
  });

  describe("3. Basic Details Section Verification (Section 4)", () => {
    const detailsContent = readFileSync(basicDetailsPath, "utf-8");

    it("contains Moodboard Name * with red asterisk and placeholder", () => {
      expect(detailsContent).toContain("Moodboard Name");
      expect(detailsContent).toContain("mb-required-star");
      expect(detailsContent).toContain("Enter moodboard name");
    });

    it("contains Project * dropdown populated with MOCK_PROJECTS", () => {
      expect(detailsContent).toContain("Select Project");
      expect(detailsContent).toContain("MOCK_PROJECTS");
      expect(MOCK_PROJECTS.length).toBeGreaterThan(0);
    });

    it("contains Client * dropdown populated with project clients and MOCK_CLIENTS", () => {
      expect(detailsContent).toContain("Select Client");
      expect(detailsContent).toContain("MOCK_CLIENTS");
      expect(MOCK_CLIENTS.length).toBeGreaterThan(0);
    });

    it("contains Description textarea with concept guidance placeholder", () => {
      expect(detailsContent).toContain("textarea");
      expect(detailsContent).toContain("Describe the concept, theme, or design direction.");
    });

    it("uses a clean two-column layout for Project and Client, and full width for Name and Description", () => {
      expect(detailsContent).toContain("mb-two-col-row");
    });
  });

  describe("4. Categories Management & Accordion Verification (Section 5)", () => {
    const categoriesContent = readFileSync(categoriesPath, "utf-8");
    const addCatContent = readFileSync(addCategoryModalPath, "utf-8");
    const cssContent = readFileSync(cssPath, "utf-8");

    it("contains Categories title, count badge, and Add Category button", () => {
      expect(categoriesContent).toContain("Categories");
      expect(categoriesContent).toContain("mb-categories-total-badge");
      expect(categoriesContent).toContain("Add Category");
      expect(categoriesContent).toContain("onAddCategory");
    });

    it("contains AddCategoryModal with required Category Name and optional Description", () => {
      expect(addCatContent).toContain("Category Name");
      expect(addCatContent).toContain("mb-required-star");
      expect(addCatContent).toContain("Category Description");
      expect(addCatContent).toContain("Create Category");
    });

    it("supports category operations: rename, delete with confirmation, and drag-and-drop reordering", () => {
      expect(categoriesContent).toContain("onRenameCategory");
      expect(categoriesContent).toContain("onDeleteCategory");
      expect(categoriesContent).toContain("onReorderCategories");
      expect(categoriesContent).toContain("GripVertical");
      expect(categoriesContent).toContain("handleDeleteCategoryPrompt");
    });

    it("displays category accordions with image count badge and expand/collapse", () => {
      expect(categoriesContent).toContain("mb-category-accordion-card");
      expect(categoriesContent).toContain("mb-category-accordion-header");
      expect(categoriesContent).toContain("mb-cat-image-count-tag");
      expect(categoriesContent).toContain("onToggleExpand");
    });

    it("verifies categories CSS styling in mood-boards.css", () => {
      expect(cssContent).toContain(".mb-categories-management");
      expect(cssContent).toContain(".mb-category-accordion-card");
      expect(cssContent).toContain(".mb-btn-add-category");
    });
  });

  describe("5. Image Upload Inside Categories & 3-Column Image Cards (Section 6)", () => {
    const categoriesContent = readFileSync(categoriesPath, "utf-8");
    const editTitleContent = readFileSync(editTitleModalPath, "utf-8");
    const cssContent = readFileSync(cssPath, "utf-8");

    it("provides empty category dropzone with upload icon and browse button", () => {
      expect(categoriesContent).toContain("Upload images to this category");
      expect(categoriesContent).toContain("Drag and drop or browse files");
      expect(categoriesContent).toContain("Add Images");
      expect(categoriesContent).toContain("UploadCloud");
    });

    it("renders uploaded images in a three-column grid with image thumbnail and title", () => {
      expect(categoriesContent).toContain("mb-category-images-grid");
      expect(categoriesContent).toContain("mb-image-card");
      expect(categoriesContent).toContain("mb-image-thumb");
      expect(categoriesContent).toContain("mb-image-title-text");
    });

    it("provides remove button in the top-right corner and title edit option", () => {
      expect(categoriesContent).toContain("mb-img-remove-btn");
      expect(categoriesContent).toContain("onRemoveImageFromCategory");
      expect(categoriesContent).toContain("onUpdateImageTitle");
      expect(categoriesContent).toContain("EditImageTitleModal");
    });

    it("contains EditImageTitleModal for editing individual image titles", () => {
      expect(editTitleContent).toContain("Edit Image Title");
      expect(editTitleContent).toContain("Save Title");
      expect(editTitleContent).toContain("onSaveTitle");
    });

    it("verifies 3-column grid CSS definition in mood-boards.css", () => {
      expect(cssContent).toContain(".mb-category-images-grid");
      expect(cssContent).toContain("grid-template-columns: repeat(3, 1fr)");
      expect(cssContent).toContain(".mb-image-card");
      expect(cssContent).toContain(".mb-img-remove-btn");
    });
  });

  describe("6. Choose Template & Live Moodboard Preview (Section 7 & 8)", () => {
    const previewContent = readFileSync(previewPath, "utf-8");
    const selectorContent = readFileSync(templateSelectorPath, "utf-8");
    const fullscreenContent = readFileSync(fullscreenModalPath, "utf-8");
    const cssContent = readFileSync(cssPath, "utf-8");

    it("defines the 6 required layout templates: Grid 4x4, Collage, Modern, Minimal, Magazine, Split", () => {
      expect(LAYOUT_TEMPLATES.length).toBe(6);
      const ids = LAYOUT_TEMPLATES.map((t) => t.id);
      expect(ids).toContain("grid-4x4");
      expect(ids).toContain("collage");
      expect(ids).toContain("modern");
      expect(ids).toContain("minimal");
      expect(ids).toContain("magazine");
      expect(ids).toContain("split");
    });

    it("renders Choose Template bar with layout mini-diagrams and selected checkmark", () => {
      expect(selectorContent).toContain("Choose Template");
      expect(selectorContent).toContain("renderLayoutDiagram");
      expect(selectorContent).toContain("mb-tpl-selected-badge");
      expect(selectorContent).toContain("onSelectTemplate");
    });

    it("renders live preview canvas with active category, project, moodboard title, and distinct layouts", () => {
      expect(previewContent).toContain("mb-preview-canvas-card");
      expect(previewContent).toContain("mb-active-cat-name");
      expect(previewContent).toContain("mb-preview-proj-name");
      expect(previewContent).toContain("mb-preview-board-name");
      expect(previewContent).toContain("layout-grid-4x4");
      expect(previewContent).toContain("layout-collage");
      expect(previewContent).toContain("layout-modern");
      expect(previewContent).toContain("layout-minimal");
      expect(previewContent).toContain("layout-magazine");
      expect(previewContent).toContain("layout-split");
    });

    it("provides category navigation controls below the preview canvas", () => {
      expect(previewContent).toContain("mb-preview-category-pagination");
      expect(previewContent).toContain("mb-page-nav-btn prev");
      expect(previewContent).toContain("mb-page-nav-btn next");
      expect(previewContent).toContain("mb-pagination-counter-group");
    });

    it("provides Fullscreen button and Fullscreen overlay modal with category switcher", () => {
      expect(previewContent).toContain("mb-btn-fullscreen");
      expect(previewContent).toContain("MoodBoardFullscreenModal");
      expect(fullscreenContent).toContain("mb-fullscreen-overlay");
      expect(fullscreenContent).toContain("Fullscreen Preview");
      expect(fullscreenContent).toContain("mb-fullscreen-close-btn");
    });

    it("verifies template layouts and preview canvas CSS styling", () => {
      expect(cssContent).toContain(".mb-choose-template-section");
      expect(cssContent).toContain(".mb-preview-canvas-card");
      expect(cssContent).toContain(".layout-grid-4x4");
      expect(cssContent).toContain(".layout-collage");
      expect(cssContent).toContain(".layout-modern");
      expect(cssContent).toContain(".layout-minimal");
      expect(cssContent).toContain(".layout-magazine");
      expect(cssContent).toContain(".layout-split");
      expect(cssContent).toContain(".mb-fullscreen-overlay");
    });
  });

  describe("7. Removal of Item-Based and Costing Functionality (Section 1)", () => {
    const editorContent = readFileSync(editorCompPath, "utf-8");
    const previewContent = readFileSync(previewPath, "utf-8");
    const categoriesContent = readFileSync(categoriesPath, "utf-8");

    it("ensures NO financial calculations or BOQ pricing exist in the moodboard creation workflow", () => {
      // CreateMoodBoardEditor must not calculate or display Subtotal, GST, or Total Amount
      expect(editorContent).not.toContain("subtotal =");
      expect(editorContent).not.toContain("gst =");
      expect(editorContent).not.toContain("totalAmount =");

      // Preview canvas must not display Subtotal, GST, or Total Amount
      expect(previewContent).not.toContain("Subtotal");
      expect(previewContent).not.toContain("GST (18%)");
      expect(previewContent).not.toContain("Total Amount");

      // No "+ Add Sample Swatch" in preview
      expect(previewContent).not.toContain("Add Sample Swatch");

      // No item table rendering in CreateMoodBoardEditor active UI
      expect(editorContent).not.toContain("<MoodBoardItems");
    });
  });

  describe("8. Review and Complete Workflow Verification (Section 12)", () => {
    const reviewContent = readFileSync(reviewStepPath, "utf-8");
    const completeContent = readFileSync(completeStepPath, "utf-8");

    it("verifies Step 2: Review displays complete moodboard, category tabs, and validation status", () => {
      expect(reviewContent).toContain("Step 2: Review");
      expect(reviewContent).toContain("mb-review-category-tabs-row");
      expect(reviewContent).toContain("mb-review-canvas-wrapper");
      expect(reviewContent).toContain("Back to Add Content");
      expect(reviewContent).toContain("Create Moodboard");
    });

    it("verifies Step 3: Complete displays success confirmation, summary, and action links", () => {
      expect(completeContent).toContain("Step 3: Complete");
      expect(completeContent).toContain("Moodboard Created Successfully!");
      expect(completeContent).toContain("View Moodboard");
      expect(completeContent).toContain("Back to Moodboards");
      expect(completeContent).toContain("Create Another Moodboard");
    });
  });

  describe("9. Draft Storage & Persistence (Section 10)", () => {
    it("can save, load, and clear working category-based drafts in localStorage", () => {
      const mockDraft = {
        name: "Artisan Modern Penthouse",
        projectId: "proj-1",
        clientId: "client-1",
        description: "Category based visual inspiration draft",
        selectedTemplate: "collage",
        categories: [
          {
            id: "cat-1",
            name: "Bedroom Suite",
            images: [
              {
                id: "img-1",
                name: "Bed Headboard",
                title: "Bed Headboard",
                previewUrl: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
              },
            ],
          },
        ],
        step: 1,
      };

      saveDraftMoodBoard(mockDraft);
      const loaded = loadDraftMoodBoard();
      expect(loaded).toBeDefined();
      expect(loaded?.name).toBe("Artisan Modern Penthouse");
      expect(loaded?.selectedTemplate).toBe("collage");
      expect(loaded?.categories?.length).toBe(1);
      expect(loaded?.categories[0].images[0].title).toBe("Bed Headboard");

      clearDraftMoodBoard();
      const afterClear = loadDraftMoodBoard();
      expect(afterClear).toBeNull();
    });

    it("repository create persists category collection, selected template, and metadata", async () => {
      const created = await moodBoardRepository.create({
        name: "Coastal Contemporary Villa",
        projectId: "proj-2",
        projectName: "Skyline Penthouse",
        clientId: "client-2",
        clientName: "Sharma Developers",
        description: "Full visual moodboard concept",
        mode: "blank",
        selectedTemplate: "modern",
        categories: [
          {
            id: "cat-living",
            name: "Living Room",
            images: [
              {
                id: "img-liv-1",
                name: "Modular Bouclé Sofa",
                title: "Modular Bouclé Sofa",
                previewUrl: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
              },
            ],
          },
        ],
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe("Coastal Contemporary Villa");
      expect(created.selectedTemplate).toBe("modern");
      expect(created.categories?.length).toBe(1);
      expect(created.categories![0].images![0].title).toBe("Modular Bouclé Sofa");

      const fetched = await moodBoardRepository.getById(created.id);
      expect(fetched).toBeDefined();
      expect(fetched?.name).toBe("Coastal Contemporary Villa");
      expect(fetched?.selectedTemplate).toBe("modern");
    });
  });

  describe("10. Unsaved Changes & Dialog (Section 4 & 13)", () => {
    const unsavedContent = readFileSync(unsavedPath, "utf-8");

    it("contains Unsaved Changes dialog with Leave Without Saving and Keep Editing", () => {
      expect(unsavedContent).toContain("Unsaved Changes");
      expect(unsavedContent).toContain("Keep Editing");
      expect(unsavedContent).toContain("Leave Without Saving");
      expect(unsavedContent).toContain("Save Draft & Leave");
    });
  });
});
