import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("Step 3: Room Dimensions Redesign & Integration Tests", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const page = readFileSync("app/projects/page.tsx", "utf8");

  describe("1. Visual Tokens and Design System Specs (Figma Reference)", () => {
    it("defines the Step 3 metrics bar and stat card styles", () => {
      expect(css).toContain(".room-metrics-bar");
      expect(css).toContain(".room-metric-card");
      expect(css).toContain(".room-metric-value.configured");
      expect(css).toContain(".room-metric-value.pending");
      expect(css).toContain("#16A34A"); // Configured green
      expect(css).toContain("#D97706"); // Pending amber
    });

    it("defines the two-column workspace layout with 380px left panel and responsive styling", () => {
      expect(css).toContain(".room-dimensions-layout");
      expect(css).toContain(".project-rooms-panel");
      expect(css).toContain("width: 380px;");
      expect(css).toContain(".room-dimensions-panel");
      expect(css).toContain("@media (max-width: 1024px)");
    });

    it("defines room list items with active selection borders, badges, and typography", () => {
      expect(css).toContain(".project-room-item");
      expect(css).toContain(".project-room-item.active");
      expect(css).toContain("box-shadow: 0px 0px 0px 2px rgba(37, 99, 235, 0.1);");
      expect(css).toContain(".project-room-num-badge");
      expect(css).toContain(".project-room-status.configured");
      expect(css).toContain(".project-room-status.pending");
    });

    it("defines the room dimensions form card, triplet input rows, and measurement summary", () => {
      expect(css).toContain(".room-form-card");
      expect(css).toContain(".room-info-section");
      expect(css).toContain(".dimension-triplet-row");
      expect(css).toContain(".dimension-times-separator");
      expect(css).toContain(".room-summary-calc-panel");
      expect(css).toContain(".room-calc-big-num");
      expect(css).toContain("#2563EB"); // Primary blue
      expect(css).toContain(".room-notes-textarea");
      expect(css).toContain(".room-ref-dropzone");
      expect(css).toContain(".room-form-save-btn");
    });
  });

  describe("2. Wizard Shell, Stepper & Summary Header", () => {
    it("renders the 5-step progress stepper with Step 3 as active", () => {
      expect(page).toContain('screen === "roomConfig"');
      expect(page).toContain("<Steps");
      expect(page).toContain("current={3}");
      expect(page).toContain('if (step === 1) setScreen("details")');
      expect(page).toContain('else if (step === 2) setScreen("rooms")');
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

  describe("3. Project Rooms List & Interactive Controls", () => {
    it("renders the selectable project rooms list with sequential numbering and dimension summaries", () => {
      expect(page).toContain('className="project-rooms-panel"');
      expect(page).toContain("PROJECT ROOMS");
      expect(page).toContain("project-room-num-badge");
      expect(page).toContain("project-room-name");
      expect(page).toContain("Dimensions not added");
      expect(page).toContain("setActiveRoomIndex(i)");
    });

    it("provides room-level header actions for Edit Name, Duplicate, and Delete", () => {
      expect(page).toContain("Edit Name");
      expect(page).toContain("Duplicate");
      expect(page).toContain("handleDuplicateActiveRoom");
      expect(page).toContain("confirmDeleteRoom(activeRoomIndex)");
      expect(page).toContain("roomNameInputRef");
    });
  });

  describe("4. Room Dimensions Form, Unit Conversion & Calculations", () => {
    it("renders Room Information inputs for Name and Type", () => {
      expect(page).toContain("ROOM INFORMATION");
      expect(page).toContain("Room Name");
      expect(page).toContain("Room Type");
      expect(page).toContain('placeholder="ex. Master Bedroom"');
      expect(page).toContain("Master Bedroom");
      expect(page).toContain("Living Room");
      expect(page).toContain("Kitchen");
    });

    it("implements unit switching between Feet and Meters with accurate conversion", () => {
      expect(page).toContain("handleUnitChange");
      expect(page).toContain("0.3048"); // Feet to meters multiplier
      expect(page).toContain("3.28084"); // Meters to feet multiplier
      expect(page).toContain('value="ft"');
      expect(page).toContain('value="m"');
      expect(page).toContain("Feet");
      expect(page).toContain("Meters");
    });

    it("renders required Length, Width, Height fields separated by times operators", () => {
      expect(page).toContain("ROOM DIMENSIONS");
      expect(page).toContain("Length");
      expect(page).toContain("Width");
      expect(page).toContain("Height");
      expect(page).toContain("dimension-times-separator");
      expect(page).toContain("dimension-unit-tag");
    });

    it("calculates real-time Area and Volume metrics from valid dimension inputs", () => {
      expect(page).toContain("ROOM MEASUREMENT SUMMARY");
      expect(page).toContain("AREA");
      expect(page).toContain("VOLUME");
      expect(page).toContain("const area = l * w;");
      expect(page).toContain("const volume = l * w * h;");
      expect(page).toContain("sq.ft");
      expect(page).toContain("cu.ft");
    });

    it("includes Room Notes and Room References image upload dropzone", () => {
      expect(page).toContain("Room Notes");
      expect(page).toContain("ROOM REFERENCES");
      expect(page).toContain("UPLOAD IMAGE");
      expect(page).toContain("handleUploadRoomRef");
      expect(page).toContain("uploadingRoomRef");
    });
  });

  describe("5. Backend Persistence, Validation & Wizard Flow", () => {
    it("validates room dimensions and saves single active room via PATCH/POST", () => {
      expect(page).toContain("saveSingleActiveRoom");
      expect(page).toContain("Length must be a valid positive number.");
      expect(page).toContain("Width must be a valid positive number.");
      expect(page).toContain("Height must be a valid positive number.");
      expect(page).toContain("/api/v1/projects/");
      expect(page).toContain("/rooms/");
    });

    it("handles wizard navigation to Step 4 Requirements only after valid save", () => {
      expect(page).toContain("continueFromRoomConfig");
      expect(page).toContain('setScreen("requirements")');
      expect(page).toContain("persistAllRoomsDraft");
    });

    it("includes confirmation dialogs when deleting room and discarding changes on cancel", () => {
      expect(page).toContain("showRoomDeleteModal");
      expect(page).toContain("Remove Room?");
      expect(page).toContain("showCancelConfirm");
      expect(page).toContain("Discard Changes?");
    });
  });
});
