import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

describe("User Dashboard → Projects Module: Grid, List & Kanban Views with Backend Persistence", () => {
  const pageSource = readFileSync("app/projects/page.tsx", "utf8");
  const cssSource = readFileSync("app/globals.css", "utf8");
  const routeSource = readFileSync("app/api/v1/[...path]/route.ts", "utf8");
  const validationSource = readFileSync("lib/api/validation.ts", "utf8");

  describe("1. View Switcher & 3-View Support (Grid, List, Board)", () => {
    it("supports grid, list, and board in view state", () => {
      expect(pageSource).toMatch(/view.*"list"\s*\|\s*"grid"\s*\|\s*"board"/);
    });

    it("renders all 3 view buttons with accessible aria labels and titles", () => {
      expect(pageSource).toContain('aria-label="Grid view"');
      expect(pageSource).toContain('title="Grid view"');
      expect(pageSource).toContain('aria-label="List view"');
      expect(pageSource).toContain('title="List view"');
      expect(pageSource).toContain('aria-label="Board view"');
      expect(pageSource).toContain('title="Board view"');
    });

    it("includes view switcher SVG icons and active state styling", () => {
      expect(pageSource).toContain("/assets/projects/view-grid.svg");
      expect(pageSource).toContain("/assets/projects/view-list.svg");
      expect(pageSource).toContain("/assets/projects/view-board.svg");
      expect(existsSync("public/assets/projects/view-board.svg")).toBe(true);
      expect(cssSource).toContain(".view-switch button.active");
    });

    it("allows 'board' option in preferencesPatchSchema", () => {
      expect(validationSource).toContain('projectView: z.enum(["table", "card", "board"]).optional()');
      expect(validationSource).toContain('project_view: z.enum(["table", "card", "board"]).optional()');
    });

    it("synchronizes the same filtered projects list across all three views", () => {
      expect(pageSource).toContain("<Grid\n                projects={projects}");
      expect(pageSource).toContain("<Board\n                projects={projects}");
      expect(pageSource).toContain("<Table\n                projects={projects}");
    });
  });

  describe("2. Kanban / Board View Structure & Figma Specifications", () => {
    it("defines the 4 required workflow stages: DESIGN CONCEPT, BOQ APPROVAL, PROCUREMENT, SITE EXECUTION", () => {
      expect(pageSource).toContain('"DESIGN CONCEPT"');
      expect(pageSource).toContain('"BOQ APPROVAL"');
      expect(pageSource).toContain('"PROCUREMENT"');
      expect(pageSource).toContain('"SITE EXECUTION"');
      expect(pageSource).toContain("WORKFLOW_STAGES");
    });

    it("categorizes projects into workflow columns using getProjectStageKey", () => {
      expect(pageSource).toContain("function getProjectStageKey");
      expect(pageSource).toContain("design_concept");
      expect(pageSource).toContain("boq_approval");
      expect(pageSource).toContain("procurement");
      expect(pageSource).toContain("site_execution");
    });

    it("styles Kanban board container matching Figma Frame 2147225556", () => {
      expect(cssSource).toContain(".projects-kanban-board");
      expect(cssSource).toContain("display: flex");
      expect(cssSource).toContain("flex-direction: row");
      expect(cssSource).toContain("gap: 16px");
      expect(cssSource).toContain("min-height: 651px");
    });

    it("styles Kanban columns matching Figma Frame 2147225078 with 340px width and glass background", () => {
      expect(cssSource).toContain(".kanban-column");
      expect(cssSource).toContain("width: 340px");
      expect(cssSource).toContain("background: rgba(255, 255, 255, 0.6)");
      expect(cssSource).toContain("border-radius: 6px");
      expect(cssSource).toContain("padding: 12px");
    });

    it("renders column headers with stage title, counter badge, and divider", () => {
      expect(pageSource).toContain("kanban-column-header");
      expect(pageSource).toContain("kanban-column-title");
      expect(pageSource).toContain("kanban-column-badge");
      expect(pageSource).toContain("kanban-column-divider");
      expect(cssSource).toContain(".kanban-column-title");
      expect(cssSource).toContain(".kanban-column-badge");
    });
  });

  describe("3. Project Card Design (Figma Frame 2147225077)", () => {
    it("renders Kanban card with ID, status, name, client, tags, progress, and designer", () => {
      expect(pageSource).toContain("kanban-card-top");
      expect(pageSource).toContain("kanban-card-id");
      expect(pageSource).toContain("kanban-card-status");
      expect(pageSource).toContain("kanban-card-name");
      expect(pageSource).toContain("kanban-card-client-location");
      expect(pageSource).toContain("kanban-card-meta-row");
      expect(pageSource).toContain("kanban-card-pill");
      expect(pageSource).toContain("kanban-card-boqs");
      expect(pageSource).toContain("kanban-card-progress-section");
      expect(pageSource).toContain("kanban-card-progress-track");
      expect(pageSource).toContain("kanban-card-progress-fill");
      expect(pageSource).toContain("kanban-card-progress-pct");
      expect(pageSource).toContain("kanban-card-bottom");
      expect(pageSource).toContain("kanban-card-designer-label");
      expect(pageSource).toContain("kanban-card-designer-val");
    });

    it("styles Kanban card with white background, subtle shadow, and 8px border-radius", () => {
      expect(cssSource).toContain(".kanban-card");
      expect(cssSource).toContain("background: #FFFFFF");
      expect(cssSource).toContain("box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.06)");
      expect(cssSource).toContain("border-radius: 8px");
    });

    it("highlights project ID in primary blue #2563EB", () => {
      expect(cssSource).toContain(".kanban-card-id");
      expect(cssSource).toContain("color: #2563EB");
    });

    it("styles progress bar with 8px height and rounded track", () => {
      expect(cssSource).toContain(".kanban-card-progress-track");
      expect(cssSource).toContain("height: 8px");
      expect(cssSource).toContain("border-radius: 100px");
      expect(cssSource).toContain(".kanban-card-progress-fill");
    });
  });

  describe("4. Drag-and-Drop Implementation & Visual Feedback", () => {
    it("enables draggable attribute on project cards", () => {
      expect(pageSource).toContain("draggable={true}");
      expect(pageSource).toContain("onDragStart");
      expect(pageSource).toContain("onDragEnd");
    });

    it("attaches drag-over, drag-leave, and drop handlers on column targets", () => {
      expect(pageSource).toContain("onDragOver");
      expect(pageSource).toContain("onDragLeave");
      expect(pageSource).toContain("onDrop");
    });

    it("styles visual feedback classes: .is-dragging and .drag-over", () => {
      expect(cssSource).toContain(".kanban-card.is-dragging");
      expect(cssSource).toContain("opacity: 0.45");
      expect(cssSource).toContain(".kanban-column.drag-over");
      expect(cssSource).toContain("border: 1.5px dashed #2563EB");
    });

    it("provides menu action fallback for moving stages on touch or mobile devices", () => {
      expect(pageSource).toContain("MOVE TO STAGE");
      expect(pageSource).toContain("onMoveWorkflow");
    });
  });

  describe("5. Backend Integration, Persistence & Validation", () => {
    it("provides dedicated PATCH /api/v1/projects/:projectId/workflow endpoint in route.ts", () => {
      expect(routeSource).toContain("projectWorkflowMatch");
      expect(routeSource).toMatch(/projects.*workflow/);
      expect(routeSource).toContain("changeProjectWorkflow");
    });

    it("validates workflow update requests with projectWorkflowSchema", () => {
      expect(validationSource).toContain("export const projectWorkflowSchema");
      expect(routeSource).toContain("projectWorkflowSchema");
    });

    it("normalizes workflow stages to prevent invalid state persistence", () => {
      expect(routeSource).toContain("function normalizeWorkflowStage");
      expect(routeSource).toContain("boq_approval");
      expect(routeSource).toContain("procurement");
      expect(routeSource).toContain("site_execution");
      expect(routeSource).toContain("design_concept");
    });

    it("persists stage and workflowStage into project metadata and returns in projectDto", () => {
      expect(routeSource).toContain('stage: (metadata.stage as string)');
      expect(routeSource).toContain('workflowStage: (metadata.workflowStage as string)');
    });

    it("implements optimistic updates with rollback snapshots in moveProjectWorkflow", () => {
      expect(pageSource).toContain("moveProjectWorkflow");
      expect(pageSource).toContain("rollbackSnapshot");
      expect(pageSource).toContain("Changes reverted");
    });

    it("includes migration file for projects workflow stage schema documentation", () => {
      expect(existsSync("supabase/migrations/20261106210000_project_workflow_stage.sql")).toBe(true);
      const migration = readFileSync("supabase/migrations/20261106210000_project_workflow_stage.sql", "utf8");
      expect(migration).toContain("workflow_stage");
      expect(migration).toContain("public.projects");
    });
  });

  describe("6. Strict User Dashboard Isolation (Zero Modification of Admin/Client)", () => {
    it("verifies git diff does not touch any Admin or Client files", () => {
      const gitDiffFiles = execSync("git diff --name-only", { cwd: "E:/boq-saas-chandu/boq-saas", encoding: "utf8" });
      const changedFiles = gitDiffFiles.split("\n").map((f) => f.trim()).filter(Boolean);

      changedFiles.forEach((file) => {
        expect(file).not.toMatch(/^app\/admin\//);
        expect(file).not.toMatch(/^app\/client\//);
        expect(file).not.toMatch(/^components\/admin\//);
        expect(file).not.toMatch(/^components\/client\//);
      });
    });
  });
});
