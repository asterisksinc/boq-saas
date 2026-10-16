import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("Step 5: Material Assignment Redesign & Integration Tests", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const page = readFileSync("app/projects/page.tsx", "utf8");
  const apiRoute = readFileSync("app/api/v1/[...path]/route.ts", "utf8");

  describe("1. Visual Tokens and Design System Specs (Figma Reference)", () => {
    it("defines the Step 5 two-column material assignment layout and workspace panel", () => {
      expect(css).toContain(".material-assignment-layout");
      expect(css).toContain(".material-rooms-panel");
      expect(css).toContain(".material-workspace-panel");
      expect(css).toContain("display: flex;");
      expect(css).toContain("gap: 16px;");
      expect(css).toContain("@media (max-width: 1024px)");
    });

    it("defines the project rooms card and room groups in left panel", () => {
      expect(css).toContain(".material-rooms-title");
      expect(css).toContain(".material-rooms-card");
      expect(css).toContain(".material-room-group");
      expect(css).toContain(".material-room-group-heading");
      expect(css).toContain(".material-room-group-divider");
      expect(css).toContain("background: #E2E8F0;");
    });

    it("defines requirement row cards with active glow and status badges", () => {
      expect(css).toContain(".material-requirement-row-card");
      expect(css).toContain(".material-requirement-row-card.active");
      expect(css).toContain("border: 1px solid #2563EB;");
      expect(css).toContain("box-shadow: 0px 0px 0px 2px rgba(37, 99, 235, 0.1);");
      expect(css).toContain(".mr-card-top");
      expect(css).toContain(".mr-card-title");
      expect(css).toContain(".mr-card-badge");
      expect(css).toContain(".mr-card-badge.selected");
      expect(css).toContain(".mr-card-badge.pending");
      expect(css).toContain(".mr-card-bottom");
      expect(css).toContain(".mr-card-mat-name");
      expect(css).toContain(".mr-card-no-mat");
    });

    it("defines the upper 6-column requirement summary card", () => {
      expect(css).toContain(".material-requirement-summary-card");
      expect(css).toContain("grid-template-columns: repeat(6, 1fr);");
      expect(css).toContain(".mr-summary-col");
      expect(css).toContain(".mr-summary-label");
      expect(css).toContain(".mr-summary-value");
      expect(css).toContain("@media (max-width: 900px)");
    });

    it("defines material catalog search wrap and input matching Figma dimensions", () => {
      expect(css).toContain(".material-catalog-container");
      expect(css).toContain(".material-catalog-search-wrap");
      expect(css).toContain("height: 46px;");
      expect(css).toContain("border: 1px solid #E2E8F0;");
      expect(css).toContain("border-radius: 8px;");
      expect(css).toContain(".material-catalog-search-input");
    });

    it("defines 3-column material catalog cards grid and responsive reflows", () => {
      expect(css).toContain(".material-catalog-grid");
      expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr));");
      expect(css).toContain("@media (max-width: 1200px)");
      expect(css).toContain("@media (max-width: 680px)");
    });

    it("defines material catalog card styling, selection halo, and stock badges", () => {
      expect(css).toContain(".material-catalog-card");
      expect(css).toContain(".material-catalog-card.selected");
      expect(css).toContain("border-width: 4px 1px 1px 1px;");
      expect(css).toContain("border-color: #2563EB;");
      expect(css).toContain("box-shadow: 0px 0px 0px 3px rgba(37, 99, 235, 0.1);");
      expect(css).toContain(".material-card-thumbnail");
      expect(css).toContain(".material-stock-badge");
      expect(css).toContain(".material-stock-badge.in-stock");
      expect(css).toContain(".material-stock-badge.low-stock");
      expect(css).toContain(".material-stock-badge.out-of-stock");
      expect(css).toContain(".material-card-selected-icon");
    });

    it("defines material card spec box with category, thickness, finish, price, and brand", () => {
      expect(css).toContain(".material-card-spec-box");
      expect(css).toContain(".material-spec-row");
      expect(css).toContain(".material-spec-col");
      expect(css).toContain(".material-spec-label");
      expect(css).toContain(".material-spec-val");
      expect(css).toContain(".material-spec-footer");
      expect(css).toContain(".material-spec-stock");
      expect(css).toContain(".material-spec-brand");
    });

    it("defines card action buttons with primary Select/Selected and icon buttons", () => {
      expect(css).toContain(".material-card-actions");
      expect(css).toContain(".material-card-select-btn");
      expect(css).toContain(".material-card-select-btn.selected");
      expect(css).toContain(".material-card-btn-check");
      expect(css).toContain(".material-card-icon-btn");
    });

    it("defines empty state when no materials match search", () => {
      expect(css).toContain(".empty-materials-state");
      expect(css).toContain(".empty-materials-icon");
      expect(css).toContain(".empty-materials-title");
      expect(css).toContain(".empty-materials-desc");
    });
  });

  describe("2. Wizard Shell, 5-Step Stepper & Summary Header", () => {
    it("renders the 5-step progress stepper with Step 5 (Material Assignment) as active", () => {
      expect(page).toContain('screen === "materials"');
      expect(page).toContain("<Steps");
      expect(page).toContain("current={5}");
      expect(page).toContain('if (step === 1) setScreen("details")');
      expect(page).toContain('else if (step === 2) setScreen("rooms")');
      expect(page).toContain('else if (step === 3) setScreen("roomConfig")');
      expect(page).toContain('else if (step === 4) setScreen("requirements")');
    });

    it("provides back navigation to Step 4 and Continue to BOQ as the primary final action", () => {
      expect(page).toContain('setScreen("requirements")');
      expect(page).toContain("Continue to BOQ");
      expect(page).toContain("onClick={createBoqAndFinish}");
      expect(page).toContain("disabled={saving}");
    });

    it("renders live room summary metrics consistent with Material Assignment criteria", () => {
      expect(page).toContain('className="room-metrics-bar"');
      expect(page).toContain("Total Rooms");
      expect(page).toContain("{rooms.length}");
      expect(page).toContain("Configured");
      expect(page).toContain("{configuredMaterialsRoomsCount}");
      expect(page).toContain("Pending");
      expect(page).toContain("{Math.max(0, rooms.length - configuredMaterialsRoomsCount)}");
    });

    it("computes configuredMaterialsRoomsCount dynamically based on requirements having materials assigned", () => {
      expect(page).toContain("const configuredMaterialsRoomsCount = useMemo(");
      expect(page).toContain("Boolean(rq.materialId || rq.materialStatus === \"SELECTED\" || rq.materialName)");
    });
  });

  describe("3. Project Rooms Sidebar & Requirements Grouping", () => {
    it("renders selectable project rooms grouped by uppercase room name", () => {
      expect(page).toContain('className="material-rooms-panel"');
      expect(page).toContain("PROJECT ROOMS");
      expect(page).toContain('className="material-rooms-card"');
      expect(page).toContain("material-room-group-heading");
      expect(page).toContain("rm.name?.toUpperCase()");
      expect(page).toContain("material-room-group-divider");
    });

    it("renders requirement cards with dynamic SELECTED / PENDING badges and assigned material names", () => {
      expect(page).toContain("material-requirement-row-card");
      expect(page).toContain("mr-card-badge");
      expect(page).toContain('{isAssigned ? "SELECTED" : "PENDING"}');
      expect(page).toContain("mr-card-mat-name");
      expect(page).toContain("No material selected");
      expect(page).toContain("setActiveMaterialReqId(rq.id)");
    });
  });

  describe("4. Right Workspace: 6-Column Requirement Summary & Search", () => {
    it("renders the 6-column requirement summary card for the active requirement", () => {
      expect(page).toContain("material-requirement-summary-card");
      expect(page).toContain("curItem && curRoom");
      expect(page).toContain("curItem.name");
      expect(page).toContain("curRoom.name");
      expect(page).toContain("curItem.category || \"Storage\"");
      expect(page).toContain("curItem.partitions || 0");
    });

    it("renders the material search field with placeholder and clear action", () => {
      expect(page).toContain("material-catalog-search-wrap");
      expect(page).toContain('placeholder="Search materials by name, code, brand..."');
      expect(page).toContain("value={materialSearch}");
      expect(page).toContain("setMaterialSearch(e.target.value)");
      expect(page).toContain('setMaterialSearch("")');
    });

    it("filters materials by name, category, brand, and code", () => {
      expect(page).toContain("m.name?.toLowerCase().includes(q)");
      expect(page).toContain("m.categoryName?.toLowerCase().includes(q)");
      expect(page).toContain("m.brand?.toLowerCase().includes(q)");
      expect(page).toContain("m.code?.toLowerCase().includes(q)");
    });
  });

  describe("5. Material Catalog Cards & Dynamic Specification Data", () => {
    it("renders the 3-column material catalog cards with thumbnail, stock badge, and specs", () => {
      expect(page).toContain("material-catalog-grid");
      expect(page).toContain("material-catalog-card");
      expect(page).toContain("material-card-thumbnail");
      expect(page).toContain("material-stock-badge");
      expect(page).toContain("material-card-spec-box");
      expect(page).toContain("material-spec-footer");
      expect(page).toContain("Available");
    });

    it("supports instant material assignment and toggle button state", () => {
      expect(page).toContain("material-card-select-btn");
      expect(page).toContain('{isAssigned ? "Selected" : "Select"}');
      expect(page).toContain("assignMaterialToRequirement(mat)");
      expect(page).toContain("setSelectedMaterialForAssign(mat)");
    });

    it("provides Info button to view full specifications in modal and Refresh button", () => {
      expect(page).toContain("material-card-icon-btn");
      expect(page).toContain("setShowAssignModal(true)");
      expect(page).toContain("View Material Specifications");
      expect(page).toContain("Refresh or Re-assign Material");
    });
  });

  describe("6. Backend Integration, Persistence & BOQ Generation", () => {
    it("assigns materials via backend API endpoint and performs optimistic updates", () => {
      expect(page).toContain("/api/v1/projects/${project.id}/rooms/${room.id}/requirements/${req.id}/material");
      expect(apiRoute).toContain("assignProjectRoomRequirementMaterial");
      expect(apiRoute).toContain("projectRoomReqMatMatch");
    });

    it("creates BOQ and finalizes project via createBoqAndFinish", () => {
      expect(page).toContain("createBoqAndFinish");
      expect(page).toContain('fetch("/api/v1/boqs"');
      expect(page).toContain('method: "scratch"');
      expect(page).toContain('setScreen("success")');
    });

    it("provides cancel confirmation modal to prevent accidental work loss", () => {
      expect(page).toContain("showCancelConfirm");
      expect(page).toContain("Discard Changes?");
      expect(page).toContain("Discard & Exit");
    });
  });
});
