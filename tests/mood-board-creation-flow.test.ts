import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  MOCK_MOOD_BOARD_TEMPLATES,
  MOCK_PROJECTS,
  MOCK_CLIENTS,
} from "../lib/mood-boards/mock-data";
import { moodBoardRepository } from "../lib/mood-boards/repository";

describe("Mood Board Creation Flow & Figma Specification Verification", () => {
  const root = process.cwd();
  const newModalPath = join(root, "components", "mood-boards", "NewMoodBoardModal.tsx");
  const newPagePath = join(root, "app", "mood-boards", "new", "page.tsx");
  const editorPath = join(root, "components", "mood-boards", "NewMoodBoardEditor.tsx");
  const templateSelectionPath = join(root, "components", "mood-boards", "MoodBoardTemplateSelection.tsx");
  const cssPath = join(root, "app", "mood-boards", "mood-boards.css");
  const moodBoardsPagePath = join(root, "components", "mood-boards", "MoodBoardsPage.tsx");

  describe("1. File Structure Verification", () => {
    it("verifies all creation flow files exist", () => {
      expect(existsSync(newModalPath)).toBe(true);
      expect(existsSync(newPagePath)).toBe(true);
      expect(existsSync(editorPath)).toBe(true);
      expect(existsSync(templateSelectionPath)).toBe(true);
      expect(existsSync(cssPath)).toBe(true);
    });
  });

  describe("2. Figma CSS Spec Exactness (Mood Board - New)", () => {
    const css = readFileSync(cssPath, "utf-8");

    it("verifies modal overlay (Rectangle 69) matches Figma backdrop-filter: blur(7px)", () => {
      expect(css).toContain(".new-mb-overlay");
      expect(css).toContain("background: rgba(0, 0, 0, 0.2)");
      expect(css).toContain("backdrop-filter: blur(7px)");
    });

    it("verifies modal container (Frame 2147225092) matches Figma 590px width and translucent blur background", () => {
      expect(css).toContain(".new-mb-modal-container");
      expect(css).toContain("width: min(590px, calc(100vw - 32px))");
      expect(css).toContain("background: rgba(255, 255, 255, 0.6)");
      expect(css).toContain("backdrop-filter: blur(14px)");
      expect(css).toContain("border-radius: 16px");
    });

    it("verifies header typography matches Figma Urbanist 18px 600 and 16px 500", () => {
      expect(css).toContain(".new-mb-title");
      expect(css).toContain("font-size: 18px");
      expect(css).toContain("color: #0F172A");

      expect(css).toContain(".new-mb-subtitle");
      expect(css).toContain("font-size: 16px");
      expect(css).toContain("color: #64748B");
    });

    it("verifies options frame (Frame 2147225091) background #FFFFFF and border-radius 14px", () => {
      expect(css).toContain(".new-mb-options-frame");
      expect(css).toContain("background: #FFFFFF");
      expect(css).toContain("border-radius: 14px");
    });

    it("verifies Option 1 selected state matches Figma border 1px solid #2563EB and 0px 0px 10px rgba(37, 99, 235, 0.25)", () => {
      expect(css).toContain(".new-mb-option-card.selected");
      expect(css).toContain("border: 1px solid #2563EB");
      expect(css).toContain("box-shadow: 0px 0px 10px rgba(37, 99, 235, 0.25)");
    });

    it("verifies Option 2 unselected state has border: 1px solid #E2E8F0", () => {
      expect(css).toContain(".new-mb-option-card");
      expect(css).toContain("border: 1px solid #E2E8F0");
    });

    it("verifies footer buttons (Frame 2147225069) Cancel (#FFFFFF / #0F172A) and Continue (#2563EB / #FFFFFF)", () => {
      expect(css).toContain(".new-mb-btn-cancel");
      expect(css).toContain("background: #FFFFFF");
      expect(css).toContain("color: #0F172A");

      expect(css).toContain(".new-mb-btn-continue");
      expect(css).toContain("background: #2563EB");
      expect(css).toContain("color: #FFFFFF");
    });
  });

  describe("3. NewMoodBoardModal Component Verification", () => {
    const modalContent = readFileSync(newModalPath, "utf-8");

    it("contains title 'New Mood Board' and subtitle 'Choose how you want to create this Mood Board'", () => {
      expect(modalContent).toContain("New Mood Board");
      expect(modalContent).toContain("Choose how you want to create this Mood Board");
    });

    it("contains Option 1 'Blank Mood Board' with 'Start with an empty canvas.'", () => {
      expect(modalContent).toContain("Blank Mood Board");
      expect(modalContent).toContain("Start with an empty canvas.");
    });

    it("contains Option 2 'From Template' with 'Use a saved moodboard template.'", () => {
      expect(modalContent).toContain("From Template");
      expect(modalContent).toContain("Use a saved moodboard template.");
    });

    it("defaults to 'blank' mode", () => {
      expect(modalContent).toContain('useState<CreationMode>("blank")');
    });

    it("supports keyboard Escape key to close modal", () => {
      expect(modalContent).toContain('e.key === "Escape"');
      expect(modalContent).toContain("onClose()");
    });

    it("supports keyboard Enter/Space to select radio cards", () => {
      expect(modalContent).toContain('e.key === " " || e.key === "Enter"');
    });

    it("passes chosen mode to onContinue handler", () => {
      expect(modalContent).toContain("onContinue(selectedMode)");
    });
  });

  describe("4. Mock Templates Data & Repository Verification", () => {
    it("has 6 realistic templates across categories", () => {
      expect(MOCK_MOOD_BOARD_TEMPLATES.length).toBeGreaterThanOrEqual(6);

      const categories = MOCK_MOOD_BOARD_TEMPLATES.map((t) => t.category);
      expect(categories).toContain("Residential");
      expect(categories).toContain("Luxury");
      expect(categories).toContain("Commercial");
      expect(categories).toContain("Hospitality");
    });

    it("each template has name, description, tags, coverImage, and images collection", () => {
      MOCK_MOOD_BOARD_TEMPLATES.forEach((tpl) => {
        expect(tpl.id).toBeDefined();
        expect(tpl.name.length).toBeGreaterThan(0);
        expect(tpl.description.length).toBeGreaterThan(10);
        expect(tpl.tags.length).toBeGreaterThan(0);
        expect(tpl.coverImage).toBeDefined();
        expect(tpl.images.length).toBeGreaterThanOrEqual(4);
      });
    });

    it("moodBoardRepository.getTemplates() returns mock templates", async () => {
      const templates = await moodBoardRepository.getTemplates?.();
      expect(templates).toBeDefined();
      expect(templates?.length).toBe(MOCK_MOOD_BOARD_TEMPLATES.length);
    });
  });

  describe("5. Creation Page & Navigation Integration", () => {
    it("verifies MoodBoardsPage imports and renders NewMoodBoardModal", () => {
      const pageContent = readFileSync(moodBoardsPagePath, "utf-8");
      expect(pageContent).toContain("NewMoodBoardModal");
      expect(pageContent).toContain('router.push(`/mood-boards/new?mode=${mode}`)');
    });

    it("verifies app/mood-boards/new/page.tsx handles blank and template query params", () => {
      const newPageContent = readFileSync(newPagePath, "utf-8");
      expect(newPageContent).toContain('searchParams.get("mode")');
      expect(newPageContent).toContain("MoodBoardTemplateSelection");
      expect(newPageContent).toContain("CreateMoodBoardEditor");
      expect(newPageContent).toContain("DashboardRail");
    });

    it("verifies NewMoodBoardEditor has project, client, image upload, and live preview", () => {
      const editorContent = readFileSync(editorPath, "utf-8");
      expect(editorContent).toContain("Mood Board Name");
      expect(editorContent).toContain("Project");
      expect(editorContent).toContain("Client");
      expect(editorContent).toContain("Dashboard Card Preview");
      expect(editorContent).toContain("Create Mood Board");
      expect(editorContent).toContain("Save as Draft");
    });
  });
});
