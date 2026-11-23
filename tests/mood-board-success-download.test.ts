import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  sanitizeFilename,
  exportMoodBoardToPdf,
  downloadMoodBoardPdf,
} from "../lib/mood-boards/export-service";
import {
  MOCK_PROJECTS,
  MOCK_LEADS,
  createInitialCategories,
} from "../lib/mood-boards/mock-data";
import { moodBoardRepository } from "../lib/mood-boards/repository";
import { addMoodBoard, loadMoodBoards } from "../lib/mood-boards/storage";
import { MoodBoard } from "../lib/mood-boards/types";

describe("Mood Board Creation Success & Download Experience — Figma Spec Verification", () => {
  const root = process.cwd();
  const modalCompPath = join(root, "components", "mood-boards", "MoodBoardSuccessModal.tsx");
  const exportServicePath = join(root, "lib", "mood-boards", "export-service.ts");
  const listingPagePath = join(root, "components", "mood-boards", "MoodBoardsPage.tsx");
  const editorCompPath = join(root, "components", "mood-boards", "editor", "CreateMoodBoardEditor.tsx");
  const cssPath = join(root, "app", "mood-boards", "mood-boards.css");
  const dashboardMoodBoardsPagePath = join(root, "app", "dashboard", "mood-boards", "page.tsx");

  const sampleBoard: MoodBoard = {
    id: "mb-test-success-01",
    name: "Modern Minimalist Living",
    description: "Serene living room interior design concept with premium warm oak finishes.",
    projectId: "proj-1",
    projectName: "Mehta Residence",
    clientId: "client-1",
    clientName: "John Doe",
    clientSubtitle: "Commercial Project",
    boqReference: "BOQ-0029",
    leadId: "lead-1",
    leadName: "Jenny Wilson",
    mode: "blank",
    categories: createInitialCategories(),
    images: [
      {
        id: "img-1",
        name: "Oak Texture Spec.jpg",
        previewUrl: "data:image/svg+xml;utf8,<svg></svg>",
      },
      {
        id: "img-2",
        name: "Linen Fabric Swatch.png",
        previewUrl: "data:image/svg+xml;utf8,<svg></svg>",
      },
    ],
    status: "DRAFT",
    createdBy: "Jenny Wilson",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe("1. File Architecture & Component Presence", () => {
    it("verifies MoodBoardSuccessModal component file exists", () => {
      expect(existsSync(modalCompPath)).toBe(true);
    });

    it("verifies export-service.ts exists", () => {
      expect(existsSync(exportServicePath)).toBe(true);
    });

    it("verifies app/dashboard/mood-boards/page.tsx route alias exists", () => {
      expect(existsSync(dashboardMoodBoardsPagePath)).toBe(true);
    });
  });

  describe("2. PDF Export Service (Section 11 Verification)", () => {
    it("sanitizes mood board title to valid, clean filenames", () => {
      expect(sanitizeFilename("Modern Minimalist Living")).toBe("Modern-Minimalist-Living-Moodboard.pdf");
      expect(sanitizeFilename("  3BHK Luxury Penthouse @ Bandra #1!  ")).toBe("3BHK-Luxury-Penthouse-Bandra-1-Moodboard.pdf");
      expect(sanitizeFilename("")).toBe("Moodboard-Moodboard.pdf");
    });

    it("generates standards-compliant PDF 1.4 byte content with valid header and trailer", () => {
      const result = exportMoodBoardToPdf(sampleBoard);
      expect(result.filename).toBe("Modern-Minimalist-Living-Moodboard.pdf");
      expect(result.pdfBytes.length).toBeGreaterThan(500);
      expect(result.pdfString).toContain("%PDF-1.4");
      expect(result.pdfString).toContain("%%EOF");
      expect(result.pdfString).toContain("xref");
      expect(result.pdfString).toContain("trailer");
      expect(result.pdfString).toContain("/Type /Catalog");
      expect(result.pdfString).toContain("/Type /Pages");
      expect(result.pageCount).toBeGreaterThanOrEqual(1);
    });

    it("embeds mood board metadata accurately inside the generated PDF document", () => {
      const result = exportMoodBoardToPdf(sampleBoard);
      expect(result.pdfString).toContain("Modern Minimalist Living");
      expect(result.pdfString).toContain("John Doe");
      expect(result.pdfString).toContain("Mehta Residence");
      expect(result.pdfString).toContain("BOQ-0029");
      expect(result.pdfString).toContain("Entrance");
      expect(result.pdfString).toContain("Master Bedroom");
    });

    it("supports multi-page pagination when categories or items increase", () => {
      const largeCategories = [
        ...createInitialCategories(),
        ...createInitialCategories().map((c, i) => ({
          ...c,
          id: `cat-extra-${i}`,
          name: `Extra Wing Room ${i + 1}`,
        })),
      ];
      const largeBoard: MoodBoard = {
        ...sampleBoard,
        categories: largeCategories,
      };

      const result = exportMoodBoardToPdf(largeBoard);
      expect(result.pageCount).toBeGreaterThan(1);
      expect(result.pdfString).toContain(`Page 1 of ${result.pageCount}`);
      expect(result.pdfString).toContain(`Page ${result.pageCount} of ${result.pageCount}`);
    });

    it("triggers downloadMoodBoardPdf and returns success object", async () => {
      const res = await downloadMoodBoardPdf(sampleBoard);
      expect(res.success).toBe(true);
      expect(res.filename).toBe("Modern-Minimalist-Living-Moodboard.pdf");
      expect(res.size).toBeGreaterThan(500);
      expect(res.pageCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("3. Success Modal Layout & Typography (Figma Spec /* Mood Board - Completed + DOwnload */)", () => {
    const modalContent = readFileSync(modalCompPath, "utf-8");
    const cssContent = readFileSync(cssPath, "utf-8");

    it("matches Modal Overlay (Rectangle 69) styling", () => {
      expect(cssContent).toContain(".mb-success-modal-overlay");
      expect(cssContent).toContain("rgba(0, 0, 0, 0.2)");
      expect(cssContent).toContain("backdrop-filter: blur(7px)");
    });

    it("matches Main Modal Container (Frame 2147225094) dimensions and background", () => {
      expect(cssContent).toContain(".mb-success-modal-container");
      expect(cssContent).toContain("width: 590px");
      expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6)");
      expect(cssContent).toContain("border-radius: 16px");
      expect(modalContent).toContain("mb-success-modal-container");
    });

    it("matches Modal Header (Frame 2147225093) title, subtitle, and close button", () => {
      expect(modalContent).toContain("Create New Mood Board");
      expect(modalContent).toContain("Choose how you want to start this project.");
      expect(cssContent).toContain(".mb-success-modal-title");
      expect(cssContent).toContain("font-size: 18px");
      expect(cssContent).toContain("font-weight: 600");
      expect(cssContent).toContain("color: #0F172A");
      expect(cssContent).toContain(".mb-success-modal-subtitle");
      expect(cssContent).toContain("font-size: 16px");
      expect(cssContent).toContain("font-weight: 500");
      expect(cssContent).toContain("color: #64748B");
      expect(modalContent).toContain("mb-success-close-btn");
    });

    it("matches Green Success Icon (Frame 2147225039 & Frame 2147225038)", () => {
      expect(cssContent).toContain(".mb-success-circle-outer");
      expect(cssContent).toContain("width: 82px");
      expect(cssContent).toContain("height: 82px");
      expect(cssContent).toContain("border: 2px solid rgba(34, 197, 94, 0.3)");

      expect(cssContent).toContain(".mb-success-circle-inner");
      expect(cssContent).toContain("width: 68px");
      expect(cssContent).toContain("height: 68px");
      expect(cssContent).toContain("background: rgba(34, 197, 94, 0.2)");
      expect(cssContent).toContain("border: 2px solid #22C55E");

      expect(modalContent).toContain("mb-success-check-svg");
    });

    it("matches Success Headings (Frame 2147225034)", () => {
      expect(modalContent).toContain("Mood Board Created Successfully!");
      expect(modalContent).toContain("Your moodboard is ready");
      expect(cssContent).toContain(".mb-success-heading");
      expect(cssContent).toContain("font-size: 20px");
      expect(cssContent).toContain("font-weight: 600");
      expect(cssContent).toContain("color: #0F172A");
      expect(cssContent).toContain(".mb-success-message");
      expect(cssContent).toContain("font-size: 16px");
      expect(cssContent).toContain("font-weight: 500");
      expect(cssContent).toContain("color: #475569");
    });

    it("matches Information Card (Frame 2147225027 nested) with dynamic fields", () => {
      expect(cssContent).toContain(".mb-success-info-card");
      expect(cssContent).toContain("background: #F2F3F2");
      expect(cssContent).toContain("border-radius: 20px");
      expect(cssContent).toContain("border: 1px solid #E2E8F0");

      // Verifies field labels
      expect(modalContent).toContain("Client Name");
      expect(modalContent).toContain("BOQ");
      expect(modalContent).toContain("Project");
      expect(modalContent).toContain("Categories");
      expect(modalContent).toContain("Images");

      // Verifies dynamic bindings
      expect(modalContent).toContain("{clientName}");
      expect(modalContent).toContain("{boqReference}");
      expect(modalContent).toContain("{projectName}");
      expect(modalContent).toContain("{categoriesCount}");
      expect(modalContent).toContain("{totalImagesCount}");

      // Verifies separators
      expect(cssContent).toContain(".mb-info-vert-sep");
      expect(cssContent).toContain(".mb-info-horiz-sep");
    });

    it("matches Footer Actions (Frame 2147225069) Back and Download buttons", () => {
      expect(cssContent).toContain(".mb-success-footer");
      expect(cssContent).toContain(".mb-btn-success-back");
      expect(cssContent).toContain("min-width: 59px");
      expect(cssContent).toContain("background: #FFFFFF");
      expect(cssContent).toContain("border: 1px solid #E2E8F0");

      expect(cssContent).toContain(".mb-btn-success-download");
      expect(cssContent).toContain("min-width: 169px");
      expect(cssContent).toContain("background: #2563EB");
      expect(cssContent).toContain("color: #FFFFFF");

      expect(modalContent).toContain("Download Moodboard");
      expect(modalContent).toContain("Back");
    });
  });

  describe("4. End-to-End Creation Flow & URL Query Integration", () => {
    const editorContent = readFileSync(editorCompPath, "utf-8");
    const listingContent = readFileSync(listingPagePath, "utf-8");

    it("verifies CreateMoodBoardEditor navigates to /mood-boards?created={created.id}", () => {
      expect(editorContent).toContain("/mood-boards?created=");
    });

    it("verifies MoodBoardsPage uses useSearchParams to detect created query parameter", () => {
      expect(listingContent).toContain("useSearchParams");
      expect(listingContent).toContain('searchParams.get("created")');
    });

    it("verifies MoodBoardsPage binds created mood board to MoodBoardSuccessModal", () => {
      expect(listingContent).toContain("<MoodBoardSuccessModal");
      expect(listingContent).toContain("isOpen={Boolean(successBoard)}");
      expect(listingContent).toContain("moodBoard={successBoard}");
    });

    it("verifies closing the modal cleans up the query parameter without removing the record", () => {
      expect(listingContent).toContain('router.replace("/mood-boards")');
    });

    it("verifies repository preserves boqReference and metadata during creation", async () => {
      const created = await moodBoardRepository.create({
        name: "Nordic Haven Concept",
        projectId: "proj-1",
        projectName: "Nikhil Oberoi",
        clientId: "client-1",
        clientName: "Mehta Residence",
        boqReference: "BOQ-0029",
        description: "Scandi minimalist retreat",
        mode: "blank",
        categories: createInitialCategories(),
        images: [],
        status: "DRAFT",
        createdBy: "Jenny Wilson",
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe("Nordic Haven Concept");
      expect(created.boqReference).toBe("BOQ-0029");
      expect(created.categories?.length).toBe(5);

      const retrieved = await moodBoardRepository.getById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.boqReference).toBe("BOQ-0029");
      expect(retrieved?.projectName).toBe("Nikhil Oberoi");
    });
  });
});
