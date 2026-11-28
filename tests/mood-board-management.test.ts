import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  INITIAL_MOOD_BOARDS,
  MOCK_PROJECTS,
  MOCK_CLIENTS,
} from "../lib/mood-boards/mock-data";
import {
  formatRelativeDate,
  filterMoodBoards,
  generateId,
} from "../lib/mood-boards/helpers";
import {
  loadMoodBoards,
  saveMoodBoards,
  addMoodBoard,
  updateMoodBoard,
  deleteMoodBoard,
  duplicateMoodBoard,
  archiveMoodBoard,
  STORAGE_KEY,
} from "../lib/mood-boards/storage";
import { LocalMoodBoardRepository } from "../lib/mood-boards/repository";
import { MoodBoardFilterState } from "../lib/mood-boards/types";

describe("Mood Board Management — Architecture, Navigation & Figma Design Verification", () => {
  const root = process.cwd();
  const railPath = join(root, "components", "DashboardRail.tsx");
  const iconPath = join(root, "public", "assets", "dashboard", "dashboard-moodboards.svg");
  const listingPagePath = join(root, "app", "mood-boards", "page.tsx");
  const detailPagePath = join(root, "app", "mood-boards", "[id]", "page.tsx");
  const cssPath = join(root, "app", "mood-boards", "mood-boards.css");

  it("1. Verifies core file structure exists", () => {
    expect(existsSync(railPath)).toBe(true);
    expect(existsSync(iconPath)).toBe(true);
    expect(existsSync(listingPagePath)).toBe(true);
    expect(existsSync(detailPagePath)).toBe(true);
    expect(existsSync(cssPath)).toBe(true);
  });

  describe("2. Navigation Integration (Section 3)", () => {
    it("verifies Mood Boards is placed immediately after Projects and before Bill of Quantities", () => {
      const railContent = readFileSync(railPath, "utf-8");
      expect(railContent).toContain('route: "/mood-boards"');
      expect(railContent).toContain('icon: "nav-moodboards"');
      // Figma "Side menu" (2760:120) labels this item "Moodboards".
      expect(railContent).toContain('label: "Moodboards"');

      // Check sequence
      const projectsIndex = railContent.indexOf('route: "/projects"');
      const moodBoardsIndex = railContent.indexOf('route: "/mood-boards"');
      const boqsIndex = railContent.indexOf('route: "/boqs"');

      expect(projectsIndex).toBeGreaterThan(-1);
      expect(moodBoardsIndex).toBeGreaterThan(projectsIndex);
      expect(boqsIndex).toBeGreaterThan(moodBoardsIndex);
    });

    it("verifies dashboard-moodboards.svg exists and matches navigation icon conventions", () => {
      const svg = readFileSync(iconPath, "utf-8");
      expect(svg).toContain('width="20"');
      expect(svg).toContain('height="20"');
      expect(svg).toContain('viewBox="0 0 20 20"');
      expect(svg).toContain('fill="#475569"');
    });

    it("verifies admin dashboard navigation is completely untouched", () => {
      const adminPath = join(root, "components", "admin", "AdminUI.tsx");
      if (existsSync(adminPath)) {
        const adminContent = readFileSync(adminPath, "utf-8");
        expect(adminContent).not.toContain('route: "/mood-boards"');
      }
    });
  });

  describe("3. Figma Visual Styling Specifications (Section 15)", () => {
    it("verifies CSS contains required design tokens, background, and translucent surfaces", () => {
      const css = readFileSync(cssPath, "utf-8");
      expect(css).toContain("--mb-bg: #F1F5F9");
      expect(css).toContain("--mb-primary: #2563EB");
      expect(css).toContain("--mb-heading: #0F172A");
      expect(css).toContain("--mb-secondary: #64748B");
      expect(css).toContain("--mb-header-cell: #E4ECFB");
      expect(css).toContain("--mb-divider: #EBEBEB");

      // Ambient top gradient
      expect(css).toContain("linear-gradient(180deg, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0))");

      // Table surface
      expect(css).toContain(".mood-board-table-surface");
      expect(css).toContain("backdrop-filter");

      // Buttons
      expect(css).toContain(".mb-btn-primary");
      expect(css).toContain(".mb-btn-secondary");

      // Search box styling
      expect(css).toContain(".mb-search-box");
      expect(css).toContain(".mb-search-icon-wrap");

      // Status pill styling
      expect(css).toContain(".mb-status-pill");
      expect(css).toContain(".mb-status-completed");
      expect(css).toContain(".mb-status-in-progress");
      expect(css).toContain(".mb-status-draft");
      expect(css).toContain(".mb-status-archived");
    });
  });

  describe("4. Mock Data Layer & Helpers", () => {
    it("verifies realistic mock projects and clients are populated", () => {
      expect(MOCK_PROJECTS.length).toBeGreaterThanOrEqual(10);
      expect(MOCK_CLIENTS.length).toBeGreaterThanOrEqual(10);

      const nikhil = MOCK_PROJECTS.find((p) => p.name === "Nikhil Oberoi");
      expect(nikhil).toBeDefined();
      expect(nikhil?.defaultClientName).toBe("Mehta Residence");
      expect(nikhil?.defaultClientSubtitle).toBe("Commercial");
    });

    it("verifies initial mood boards include all 4 statuses and realistic image counts", () => {
      expect(INITIAL_MOOD_BOARDS.length).toBeGreaterThanOrEqual(10);

      const statuses = new Set(INITIAL_MOOD_BOARDS.map((b) => b.status));
      expect(statuses.has("COMPLETED")).toBe(true);
      expect(statuses.has("IN_PROGRESS")).toBe(true);
      expect(statuses.has("DRAFT")).toBe(true);
      expect(statuses.has("ARCHIVED")).toBe(true);

      const modernMinimalist = INITIAL_MOOD_BOARDS.find((b) => b.name === "Modern Minimalist Living");
      expect(modernMinimalist).toBeDefined();
      expect(modernMinimalist?.images.length).toBe(12);
      expect(modernMinimalist?.createdBy).toBe("Jenny Wilson");
    });

    it("verifies relative date formatting function", () => {
      const now = new Date();
      expect(formatRelativeDate(now.toISOString())).toBe("Today");

      const yesterday = new Date(Date.now() - 86400000);
      expect(formatRelativeDate(yesterday.toISOString())).toBe("1 day ago");

      const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
      expect(formatRelativeDate(threeDaysAgo.toISOString())).toBe("3 days ago");

      const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
      expect(formatRelativeDate(oneWeekAgo.toISOString())).toBe("1 week ago");
    });
  });

  describe("5. Search and Multi-Criteria Filtering (Sections 10 & 11)", () => {
    it("filters case-insensitively by Mood Board name", () => {
      const filters: MoodBoardFilterState = {
        status: "ALL",
        projectId: "ALL",
        clientId: "ALL",
        createdBy: "ALL",
        search: "scandinavian",
      };
      const results = filterMoodBoards(INITIAL_MOOD_BOARDS, filters);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Scandinavian Kitchen Concept");
    });

    it("filters case-insensitively by Project name", () => {
      const filters: MoodBoardFilterState = {
        status: "ALL",
        projectId: "ALL",
        clientId: "ALL",
        createdBy: "ALL",
        search: "nikhil oberoi",
      };
      const results = filterMoodBoards(INITIAL_MOOD_BOARDS, filters);
      expect(results.length).toBe(1);
      expect(results[0].projectName).toBe("Nikhil Oberoi");
    });

    it("filters case-insensitively by Client name", () => {
      const filters: MoodBoardFilterState = {
        status: "ALL",
        projectId: "ALL",
        clientId: "ALL",
        createdBy: "ALL",
        search: "sharma developers",
      };
      const results = filterMoodBoards(INITIAL_MOOD_BOARDS, filters);
      expect(results.length).toBe(1);
      expect(results[0].clientName).toBe("Sharma Developers");
    });

    it("combines search query with Status filter", () => {
      const filters: MoodBoardFilterState = {
        status: "COMPLETED",
        projectId: "ALL",
        clientId: "ALL",
        createdBy: "ALL",
        search: "living",
      };
      const results = filterMoodBoards(INITIAL_MOOD_BOARDS, filters);
      expect(results.length).toBe(1);
      expect(results[0].status).toBe("COMPLETED");
      expect(results[0].name).toContain("Living");
    });

    it("combines filters by Created By and Status", () => {
      const filters: MoodBoardFilterState = {
        status: "COMPLETED",
        projectId: "ALL",
        clientId: "ALL",
        createdBy: "Jenny Wilson",
        search: "",
      };
      const results = filterMoodBoards(INITIAL_MOOD_BOARDS, filters);
      results.forEach((r) => {
        expect(r.status).toBe("COMPLETED");
        expect(r.createdBy).toBe("Jenny Wilson");
      });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("6. Repository and Storage CRUD operations (Section 18)", () => {
    const repo = new LocalMoodBoardRepository();

    it("getAll returns initial boards in SSR or default storage", async () => {
      const all = await repo.getAll();
      expect(all.length).toBeGreaterThanOrEqual(10);
    });

    it("creates a new mood board and prepends to the collection", async () => {
      const created = await repo.create({
        name: "Test Penthouse Concept",
        projectId: "proj-2",
        clientId: "client-2",
        description: "Testing repository create",
        status: "DRAFT",
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe("Test Penthouse Concept");
      expect(created.projectName).toBe("Skyline Penthouse");
      expect(created.clientName).toBe("Sharma Developers");

      const fetched = await repo.getById(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.name).toBe("Test Penthouse Concept");
    });

    it("updates an existing mood board", async () => {
      const all = await repo.getAll();
      const first = all[0];

      const updated = await repo.update(first.id, {
        name: "Updated Concept Name",
        status: "COMPLETED",
      });

      expect(updated.name).toBe("Updated Concept Name");
      expect(updated.status).toBe("COMPLETED");
    });

    it("duplicates a mood board", async () => {
      const all = await repo.getAll();
      const first = all[0];

      const duplicated = await repo.duplicate(first.id);
      expect(duplicated.name).toContain("(Copy)");
      expect(duplicated.id).not.toBe(first.id);
      expect(duplicated.status).toBe("DRAFT");
    });

    it("archives and deletes a mood board", async () => {
      const created = await repo.create({
        name: "To Be Deleted",
        projectId: "proj-1",
        clientId: "client-1",
      });

      const archived = await repo.archive(created.id);
      expect(archived.status).toBe("ARCHIVED");

      await repo.delete(created.id);
      const afterDelete = await repo.getById(created.id);
      expect(afterDelete).toBeNull();
    });
  });

  describe("7. Component Architecture Verification (Section 14)", () => {
    it("verifies all required components are exported and importable", () => {
      const compDir = join(root, "components", "mood-boards");
      const requiredComponents = [
        "MoodBoardsPage.tsx",
        "MoodBoardToolbar.tsx",
        "MoodBoardTable.tsx",
        "MoodBoardGrid.tsx",
        "MoodBoardCard.tsx",
        "MoodBoardStatusBadge.tsx",
        "MoodBoardActionsMenu.tsx",
        "CreateMoodBoardModal.tsx",
        "EditMoodBoardModal.tsx",
        "MoodBoardFilterPopover.tsx",
        "MoodBoardPagination.tsx",
        "MoodBoardDetail.tsx",
        "MoodBoardImageGrid.tsx",
        "MoodBoardImageUploader.tsx",
        "MoodBoardEmptyState.tsx",
        "MoodBoardImportDialog.tsx",
        "DeleteConfirmDialog.tsx",
      ];

      for (const comp of requiredComponents) {
        expect(existsSync(join(compDir, comp))).toBe(true);
      }
    });

    it("uses viewport-positioned portals for mood board more menus", () => {
      const actionsMenuContent = readFileSync(
        join(root, "components", "mood-boards", "MoodBoardActionsMenu.tsx"),
        "utf-8"
      );
      const detailContent = readFileSync(
        join(root, "components", "mood-boards", "MoodBoardDetail.tsx"),
        "utf-8"
      );
      const cssContent = readFileSync(cssPath, "utf-8");

      expect(actionsMenuContent).toContain("createPortal");
      expect(actionsMenuContent).toContain("document.body");
      expect(detailContent).toContain("createPortal");
      expect(detailContent).toContain("mb-dropdown-menu-fixed");
      expect(cssContent).toContain(".mb-dropdown-menu-fixed");
      expect(cssContent).toContain("position: fixed");
      expect(cssContent).toContain("z-index: 12000");
    });
  });
});
