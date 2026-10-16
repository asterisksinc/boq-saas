import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Create Project from Scratch - Step 2: Room Setup Redesign", () => {
  const pagePath = path.resolve(__dirname, "../app/projects/page.tsx");
  const cssPath = path.resolve(__dirname, "../app/globals.css");

  const pageContent = fs.readFileSync(pagePath, "utf-8");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  describe("Figma Visual Alignment & CSS Tokens", () => {
    it("defines the primary color, font tokens, and light table header in globals.css", () => {
      expect(cssContent).toContain("#2563EB"); // Primary blue
      expect(cssContent).toContain("#0F172A"); // Main dark text
      expect(cssContent).toContain("#64748B"); // Secondary text
      expect(cssContent).toContain("#E2E8F0"); // Border color
      expect(cssContent).toContain("#E4ECFB"); // Light table header background
      expect(cssContent).toContain("Urbanist"); // Heading and metadata font
      expect(cssContent).toContain("Inter"); // Form and table font
    });

    it("has the gradient background overlay matching Figma Rectangle 14", () => {
      expect(cssContent).toContain("linear-gradient(180deg, #2563EB -371.16%, rgba(37, 99, 235, 0) 100%)");
      expect(cssContent).toContain(".project-scratch-gradient");
    });

    it("defines the Project Summary card styles matching Figma Frame 2147225306", () => {
      expect(cssContent).toContain(".project-summary-card");
      expect(cssContent).toContain(".project-summary-panel");
      expect(cssContent).toContain(".project-summary-icon");
      expect(cssContent).toContain(".project-summary-status");
      expect(cssContent).toContain(".project-summary-divider");
      expect(cssContent).toContain(".project-summary-meta-group");
      expect(cssContent).toContain(".project-summary-edit-btn");
    });

    it("defines the Room Setup Main card styles matching Figma Frame 2147225072", () => {
      expect(cssContent).toContain(".room-setup-card-wrapper");
      expect(cssContent).toContain(".room-setup-main-panel");
      expect(cssContent).toContain(".room-count-wrapper");
      expect(cssContent).toContain(".room-stepper-btn");
      expect(cssContent).toContain(".room-count-display");
      expect(cssContent).toContain(".room-count-summary");
      expect(cssContent).toContain(".room-count-helper");
      expect(cssContent).toContain(".room-setup-divider");
    });

    it("defines the Room List and Table styles matching Figma Frame 2147225325 and Device Management_iOS", () => {
      expect(cssContent).toContain(".room-list-header-row");
      expect(cssContent).toContain(".room-quick-add-btn");
      expect(cssContent).toContain(".room-search-box");
      expect(cssContent).toContain(".room-filter-box");
      expect(cssContent).toContain(".room-table-container");
      expect(cssContent).toContain(".room-table-header-row");
      expect(cssContent).toContain(".room-table-row");
      expect(cssContent).toContain(".room-name-input");
      expect(cssContent).toContain(".room-type-select-box");
      expect(cssContent).toContain(".room-status-badge");
      expect(cssContent).toContain(".room-delete-btn");
    });
  });

  describe("Step 2 Component Architecture & State in page.tsx", () => {
    it("renders inside the parent dashboard layout without duplicating DashboardHeader or DashboardRail", () => {
      expect(pageContent).toContain("<DashboardRail />");
      expect(pageContent).toContain("<DashboardHeader");
      expect(pageContent).toContain('<main className="fig-dashboard project-ui">');
    });

    it("uses the project-scratch-wrapper and container shell for Step 2", () => {
      expect(pageContent).toContain('if (screen === "rooms") {');
      expect(pageContent).toContain('className="create-page-wrapper project-scratch-wrapper"');
      expect(pageContent).toContain('className="project-scratch-container"');
      expect(pageContent).toContain('className="project-scratch-gradient"');
    });

    it("implements the Wizard Progress Indicator with Step 2 as current and clickable previous steps", () => {
      expect(pageContent).toContain("<Steps");
      expect(pageContent).toContain("current={2}");
      expect(pageContent).toContain('if (step === 1) setScreen("details")');
    });

    it("renders the Project Summary Card with dynamic client, location, type, timeline, and Edit Project action", () => {
      expect(pageContent).toContain('className="project-summary-card"');
      expect(pageContent).toContain('className="project-summary-panel"');
      expect(pageContent).toContain('className="project-summary-icon"');
      expect(pageContent).toContain("project?.name || form.name");
      expect(pageContent).toContain("project?.clientName || form.clientName");
      expect(pageContent).toContain("project?.location || form.location");
      expect(pageContent).toContain("project?.projectType || form.projectType");
      expect(pageContent).toContain("formatTimeline");
      expect(pageContent).toContain('onClick={() => setScreen("details")}');
      expect(pageContent).toContain("Edit Project");
    });

    it("provides the Number of Rooms stepper controls with increment, decrement, and direct input", () => {
      expect(pageContent).toContain("handleDecrementRoom");
      expect(pageContent).toContain("handleAddRoom");
      expect(pageContent).toContain("handleDirectCountChange");
      expect(pageContent).toContain("Number of Rooms");
      expect(pageContent).toContain("will be created for this project.");
    });

    it("implements the Room List Header with Quick Add button", () => {
      expect(pageContent).toContain("ROOM LIST");
      expect(pageContent).toContain("Give each room a clear name so it can be identified throughout the BOQ workflow.");
      expect(pageContent).toContain("Quick Add");
    });

    it("implements search and category filter for rooms", () => {
      expect(pageContent).toContain("Search Rooms");
      expect(pageContent).toContain("roomSearch");
      expect(pageContent).toContain("roomCategoryFilter");
      expect(pageContent).toContain("filteredRoomRows");
    });

    it("renders room table columns with index, editable name, room type selector, status badge, and delete button", () => {
      expect(pageContent).toContain('className="room-table-container"');
      expect(pageContent).toContain('className="room-table-header-row"');
      expect(pageContent).toContain("ROOM NAME");
      expect(pageContent).toContain("ROOM TYPE");
      expect(pageContent).toContain("STATUS");
      expect(pageContent).toContain("room-name-input");
      expect(pageContent).toContain("room-type-select");
      expect(pageContent).toContain("room-status-badge");
      expect(pageContent).toContain("confirmDeleteRoom");
    });

    it("validates required room names and persists data before continuing to Step 3", () => {
      expect(pageContent).toContain("continueFromRoomSetup");
      expect(pageContent).toContain('setScreen("roomConfig")');
      expect(pageContent).toContain("Please provide a room name for room #");
    });

    it("includes confirmation dialogs when deleting populated rooms or discarding changes", () => {
      expect(pageContent).toContain("showRoomDeleteModal");
      expect(pageContent).toContain("Remove Room?");
      expect(pageContent).toContain("showCancelConfirm");
      expect(pageContent).toContain("Discard Changes?");
    });
  });
});
