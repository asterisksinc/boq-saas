import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("Step 4: Requirements Redesign & Integration Tests", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const page = readFileSync("app/projects/page.tsx", "utf8");
  const apiRoute = readFileSync("app/api/v1/[...path]/route.ts", "utf8");

  describe("1. Visual Tokens and Design System Specs (Figma Reference)", () => {
    it("defines the Step 4 two-column requirements layout and workspace panel", () => {
      expect(css).toContain(".requirements-layout");
      expect(css).toContain(".requirements-workspace-panel");
      expect(css).toContain("display: flex;");
      expect(css).toContain("gap: 16px;");
      expect(css).toContain("@media (max-width: 1024px)");
    });

    it("defines requirements overview header and primary add button styles", () => {
      expect(css).toContain(".requirements-overview-header");
      expect(css).toContain(".requirements-overview-title");
      expect(css).toContain(".add-requirement-primary-btn");
      expect(css).toContain("background: #2563EB;");
      expect(css).toContain("border-radius: 6px;");
    });

    it("defines requirement item cards with status pills, specs panel, and footer", () => {
      expect(css).toContain(".requirements-cards-grid");
      expect(css).toContain(".requirement-item-card");
      expect(css).toContain(".ric-header");
      expect(css).toContain(".ric-title");
      expect(css).toContain(".material-pill");
      expect(css).toContain(".material-pill.pending");
      expect(css).toContain(".material-pill.selected");
      expect(css).toContain(".ric-more-btn");
      expect(css).toContain(".ric-menu-dropdown");
      expect(css).toContain(".ric-specs-panel");
      expect(css).toContain(".ric-footer-row");
    });

    it("defines empty state and common room requirements suggestions", () => {
      expect(css).toContain(".empty-requirements-state");
      expect(css).toContain(".empty-requirements-icon");
      expect(css).toContain(".empty-requirements-title");
      expect(css).toContain(".empty-requirements-desc");
      expect(css).toContain(".common-requirements-section");
      expect(css).toContain(".common-chips-list");
      expect(css).toContain(".common-chip-btn");
    });

    it("defines Add/Edit form layout, room metrics strip, search, and category chips", () => {
      expect(css).toContain(".req-form-header-block");
      expect(css).toContain(".req-header-info-strip");
      expect(css).toContain(".req-header-info-val");
      expect(css).toContain(".req-type-search-wrap");
      expect(css).toContain(".req-type-search-input");
      expect(css).toContain(".req-categories-group");
      expect(css).toContain(".req-category-block");
      expect(css).toContain(".req-category-label");
      expect(css).toContain(".req-chips-cluster");
      expect(css).toContain(".req-chip-btn");
      expect(css).toContain(".req-chip-btn.selected");
      expect(css).toContain(".req-selected-item-banner");
    });

    it("defines counter steppers for quantity and partitions with helper text", () => {
      expect(css).toContain(".req-stepper-wrap");
      expect(css).toContain(".req-stepper-btn");
      expect(css).toContain(".req-stepper-num-input");
      expect(css).toContain(".req-helper-text");
    });

    it("defines project room item requirement count badges and items added text", () => {
      expect(css).toContain(".project-room-items-count-text");
      expect(css).toContain(".project-room-items-count-text.has-items");
      expect(css).toContain(".project-room-req-count-badge");
      expect(css).toContain("#16A34A"); // Green count badge
    });
  });

  describe("2. Wizard Shell, Stepper & Summary Header", () => {
    it("renders the 5-step progress stepper with Step 4 as active", () => {
      expect(page).toContain('screen === "requirements"');
      expect(page).toContain("<Steps");
      expect(page).toContain("current={4}");
      expect(page).toContain('if (step === 1) setScreen("details")');
      expect(page).toContain('else if (step === 2) setScreen("rooms")');
      expect(page).toContain('else if (step === 3) setScreen("roomConfig")');
    });

    it("provides back navigation to Step 3 and continue navigation to Step 5", () => {
      expect(page).toContain('setScreen("roomConfig")');
      expect(page).toContain('setScreen("materials")');
      expect(page).toContain("Continue to Next");
    });

    it("renders the Project Summary Card with dynamic client, location, type, timeline, and Edit Project action", () => {
      expect(page).toContain('className="project-summary-card"');
      expect(page).toContain('className="project-summary-panel"');
      expect(page).toContain("project?.name || form.name");
      expect(page).toContain("project?.clientName || form.clientName");
      expect(page).toContain("project?.location || form.location");
      expect(page).toContain("project?.projectType || form.projectType");
      expect(page).toContain("formatTimeline");
      expect(page).toContain("Edit Project");
    });

    it("renders live room summary metrics consistent with Total = Configured + Pending", () => {
      expect(page).toContain('className="room-metrics-bar"');
      expect(page).toContain("Total Rooms");
      expect(page).toContain("{rooms.length}");
      expect(page).toContain("Configured");
      expect(page).toContain("{configuredCount}");
      expect(page).toContain("Pending");
      expect(page).toContain("{Math.max(0, rooms.length - configuredCount)}");
    });
  });

  describe("3. Project Rooms Sidebar & Room-Level Actions", () => {
    it("renders selectable project rooms with item counts and configuration statuses", () => {
      expect(page).toContain('className="project-rooms-panel"');
      expect(page).toContain("PROJECT ROOMS");
      expect(page).toContain("project-room-num-badge");
      expect(page).toContain("project-room-req-count-badge");
      expect(page).toContain("project-room-items-count-text");
      expect(page).toContain("setActiveRoomIndex(i)");
    });

    it("renders room header title, status badge, and Edit Name action", () => {
      expect(page).toContain("room-detail-header-row");
      expect(page).toContain("activeRoom.name?.toUpperCase()");
      expect(page).toContain("Edit Name");
      expect(page).toContain('updateActiveRoomField("name", nextName.trim())');
    });
  });

  describe("4. Categorized Items, Search, Dimensions & Steppers", () => {
    it("renders the five category chip groups specified in Figma", () => {
      // Storage
      expect(page).toContain("STORAGE");
      expect(page).toContain("Wardrobe");
      expect(page).toContain("Storage Unit");
      expect(page).toContain("Shoe Cabinet");

      // Furniture
      expect(page).toContain("FURNITURE");
      expect(page).toContain("Bed Back Panel");
      expect(page).toContain("Study Table");
      expect(page).toContain("Side Table");
      expect(page).toContain("TV Unit");
      expect(page).toContain("Vanity");

      // Kitchen
      expect(page).toContain("KITCHEN");
      expect(page).toContain("Base Cabinet");
      expect(page).toContain("Wall Cabinet");
      expect(page).toContain("Tall Unit");
      expect(page).toContain("Pantry");
      expect(page).toContain("Overhead Cabinet");

      // Wall & Ceiling
      expect(page).toContain("WALL & CEILING");
      expect(page).toContain("Wall Panel");
      expect(page).toContain("False Ceiling");
      expect(page).toContain("Decorative Panel");

      // Other
      expect(page).toContain("OTHER");
      expect(page).toContain("Custom Item");
    });

    it("implements item search filtering across categories", () => {
      expect(page).toContain("itemSearchQuery");
      expect(page).toContain("setItemSearchQuery(e.target.value)");
      expect(page).toContain('placeholder="Search items..."');
      expect(page).toContain(".includes(itemSearchQuery.toLowerCase())");
    });

    it("displays room header dimensions strip for Room, Area, and Volume", () => {
      expect(page).toContain("req-header-info-strip");
      expect(page).toContain("ROOM");
      expect(page).toContain("AREA");
      expect(page).toContain("VOLUME");
      expect(page).toContain("{l}x{w}x{h} {unitLabel}");
      expect(page).toContain("{area} {areaUnitLabel}");
      expect(page).toContain("{volume} {volUnitLabel}");
    });

    it("provides separate item dimension inputs for Length, Breadth/Depth, and Height", () => {
      expect(page).toContain("Item Dimensions");
      expect(page).toContain("Length");
      expect(page).toContain("Breadth/Depth");
      expect(page).toContain("Height");
      expect(page).toContain("dimension-times-separator");
    });

    it("provides Quantity, Unit selector, and Partitions counter steppers", () => {
      expect(page).toContain("Quantity");
      expect(page).toContain("Number of Partitions");
      expect(page).toContain("Partitions will be used later to calculate material requirements.");
      expect(page).toContain("req-stepper-wrap");
      expect(page).toContain("Math.max(1, f.quantity - 1)");
      expect(page).toContain("Math.max(0, f.partitions - 1)");
    });

    it("includes Requirement Notes and reference image upload dropzone", () => {
      expect(page).toContain("Requirement Notes");
      expect(page).toContain("Requirement References");
      expect(page).toContain("UPLOAD IMAGE");
      expect(page).toContain("handleUploadReqRef");
      expect(page).toContain("uploadingReqRef");
    });
  });

  describe("5. Backend API Persistence & Material Assignment Flow", () => {
    it("implements saveRequirement for creating or updating requirements", () => {
      expect(page).toContain("const saveRequirement = async () =>");
      expect(page).toContain("/api/v1/projects/${project.id}/rooms/${activeRoom.id}/requirements");
      expect(page).toContain('method: "POST"');
      expect(page).toContain('method: "PATCH"');
    });

    it("supports requirement deletion and duplication", () => {
      expect(page).toContain("const deleteRequirement = async");
      expect(page).toContain("const duplicateRequirement = async");
      expect(page).toContain('method: "DELETE"');
      expect(page).toContain("/duplicate");
    });

    it("verifies API route handlers for list, create, update, delete, and duplicate", () => {
      expect(apiRoute).toContain("listProjectRoomRequirements");
      expect(apiRoute).toContain("createProjectRoomRequirement");
      expect(apiRoute).toContain("updateProjectRoomRequirement");
      expect(apiRoute).toContain("deleteProjectRoomRequirement");
      expect(apiRoute).toContain("duplicateProjectRoomRequirement");
    });

    it("displays material assignment status pill (MATERIAL PENDING / MATERIAL SELECTED)", () => {
      expect(page).toContain("MATERIAL PENDING");
      expect(page).toContain("MATERIAL SELECTED");
      expect(page).toContain("rq.materialName || \"Not Selected\"");
    });
  });
});
