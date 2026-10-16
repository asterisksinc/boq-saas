import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Project Workspace Tab Redesign (Figma CSS Accurate)", () => {
  const pagePath = join(process.cwd(), "app/projects/[id]/page.tsx");
  const cssPath = join(process.cwd(), "app/project-overview.css");

  const pageContent = readFileSync(pagePath, "utf-8");
  const cssContent = readFileSync(cssPath, "utf-8");

  describe("1. Figma CSS Styling & Layout Tokens", () => {
    it("defines the .po-workspace-* container and translucent 5-summary KPI panel", () => {
      expect(cssContent).toContain(".po-workspace-container");
      expect(cssContent).toContain(".po-workspace-summary-panel");
      expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6)");
      expect(cssContent).toContain(".po-workspace-kpi-grid");
      expect(cssContent).toContain("grid-template-columns: repeat(5, 1fr)");
    });

    it("defines KPI summary card styles with 14px radius, 32px values, 12px labels, and #D90606 alert color", () => {
      expect(cssContent).toContain(".po-workspace-kpi-card");
      expect(cssContent).toContain("border-radius: 14px");
      expect(cssContent).toContain("box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.06)");
      expect(cssContent).toContain(".po-workspace-kpi-label");
      expect(cssContent).toContain("font-size: 12px");
      expect(cssContent).toContain(".po-workspace-kpi-value");
      expect(cssContent).toContain("font-size: 32px");
      expect(cssContent).toContain(".po-workspace-kpi-value.danger");
      expect(cssContent).toContain("#D90606");
    });

    it("defines two-column main layout with 16px gap and translucent panel containers", () => {
      expect(cssContent).toContain(".po-workspace-main-columns");
      expect(cssContent).toContain("gap: 16px");
      expect(cssContent).toContain(".po-workspace-stages-panel");
      expect(cssContent).toContain(".po-workspace-tasks-panel");
      expect(cssContent).toContain(".po-workspace-panel-title");
    });

    it("defines STAGES panel styles with 12px status dots, completed strikethrough, and status badges", () => {
      expect(cssContent).toContain(".po-stage-card");
      expect(cssContent).toContain(".po-stage-dot");
      expect(cssContent).toContain(".po-stage-dot.done");
      expect(cssContent).toContain("#16A34A");
      expect(cssContent).toContain(".po-stage-dot.in-progress");
      expect(cssContent).toContain("#A37D16");
      expect(cssContent).toContain(".po-stage-dot.upcoming");
      expect(cssContent).toContain("#ECEEF1");

      expect(cssContent).toContain(".po-stage-name.is-completed");
      expect(cssContent).toContain("text-decoration-line: line-through");

      expect(cssContent).toContain(".po-stage-badge.done");
      expect(cssContent).toContain("rgba(22, 163, 74, 0.12)");
      expect(cssContent).toContain(".po-stage-badge.in-progress");
      expect(cssContent).toContain("rgba(163, 125, 22, 0.12)");
      expect(cssContent).toContain(".po-stage-badge.upcoming");
      expect(cssContent).toContain("rgba(100, 116, 139, 0.12)");
      expect(cssContent).toContain(".po-stage-date");
    });

    it("defines OPEN TASKS header controls including segmented filter group and + Add Task button", () => {
      expect(cssContent).toContain(".po-workspace-tasks-header");
      expect(cssContent).toContain(".po-workspace-filter-group");
      expect(cssContent).toContain(".po-workspace-filter-btn");
      expect(cssContent).toContain(".po-workspace-filter-btn.is-active");
      expect(cssContent).toContain("background: #EFF6FF");
      expect(cssContent).toContain("color: #2563EB");

      expect(cssContent).toContain(".po-workspace-add-task-btn");
      expect(cssContent).toContain("background: #2563EB");
      expect(cssContent).toContain("border-radius: 6px");
    });

    it("defines Task Card styling with check button, metadata items, priority badges, and overdue alert", () => {
      expect(cssContent).toContain(".po-task-card");
      expect(cssContent).toContain(".po-task-card.is-overdue");
      expect(cssContent).toContain("border-left: 3px solid #DC2626");
      expect(cssContent).toContain(".po-task-check-btn");
      expect(cssContent).toContain(".po-task-check-btn.is-completed");
      expect(cssContent).toContain(".po-task-title");
      expect(cssContent).toContain(".po-task-meta-row");
      expect(cssContent).toContain(".po-task-meta-label");
      expect(cssContent).toContain(".po-task-meta-val");
      expect(cssContent).toContain(".po-task-meta-val.is-overdue");
      expect(cssContent).toContain(".po-task-priority-badge.high");
      expect(cssContent).toContain(".po-task-priority-badge.normal");
      expect(cssContent).toContain(".po-task-priority-badge.low");
    });

    it("defines responsive media queries for tablet, mobile, and desktop layouts", () => {
      expect(cssContent).toContain("@media (max-width: 1200px)");
      expect(cssContent).toContain("@media (max-width: 1024px)");
      expect(cssContent).toContain("@media (max-width: 768px)");
      expect(cssContent).toContain("@media (max-width: 480px)");
    });
  });

  describe("2. Project Workspace Component (app/projects/[id]/page.tsx)", () => {
    const workSlice = pageContent.slice(
      pageContent.indexOf("function Work"),
      pageContent.indexOf("function Docs")
    );

    it("renders the 5 dynamic summary KPI cards in the summary panel", () => {
      expect(workSlice).toContain("po-workspace-summary-panel");
      expect(workSlice).toContain("po-workspace-kpi-grid");
      expect(workSlice).toContain("Current Phase");
      expect(workSlice).toContain("Overall Progress");
      expect(workSlice).toContain("Next Stage");
      expect(workSlice).toContain("Overdue Tasks");
      expect(workSlice).toContain("Open Issues");
    });

    it("dynamically calculates summary cards from project, stage order, and tasks", () => {
      expect(workSlice).toContain("currentPhase");
      expect(workSlice).toContain("p.progress || 0");
      expect(workSlice).toContain("nextPhase");
      expect(workSlice).toContain("overdueTasks.length");
      expect(workSlice).toContain("blockedTasks.length");
    });

    it("renders the STAGES panel with dynamic stages and status indicators", () => {
      expect(workSlice).toContain("po-workspace-stages-panel");
      expect(workSlice).toContain("STAGES");
      expect(workSlice).toContain("activeStagesList");
      expect(workSlice).toContain("getStageVisualState");
      expect(workSlice).toContain("po-stage-card");
      expect(workSlice).toContain("po-stage-dot");
      expect(workSlice).toContain("po-stage-badge");
      expect(workSlice).toContain("po-stage-date");
    });

    it("renders OPEN TASKS heading and all 4 mandatory controls (All, Overdue, High, + Add Task)", () => {
      expect(workSlice).toContain("OPEN TASKS");
      expect(workSlice).toContain('taskFilter === "all"');
      expect(workSlice).toContain('taskFilter === "overdue"');
      expect(workSlice).toContain('taskFilter === "high"');
      expect(workSlice).toContain("+ Add Task");
      expect(workSlice).toContain("setNewTaskOpen(true)");
    });

    it("implements mutually exclusive filtering for All, Overdue, and High", () => {
      expect(workSlice).toContain('onClick={() => setTaskFilter("all")}');
      expect(workSlice).toContain('onClick={() => setTaskFilter("overdue")}');
      expect(workSlice).toContain('onClick={() => setTaskFilter("high")}');
      expect(workSlice).toContain("isTaskOverdue");
      expect(workSlice).toContain("isTaskHigh");
    });

    it("renders rich task cards with completion check toggle, metadata, and priority badges", () => {
      expect(workSlice).toContain("po-task-card");
      expect(workSlice).toContain("toggleTask");
      expect(workSlice).toContain("po-task-check-btn");
      expect(workSlice).toContain("Owner:");
      expect(workSlice).toContain("Due:");
      expect(workSlice).toContain("getPriorityBadge");
      expect(workSlice).toContain("po-task-priority-badge");
      expect(workSlice).toContain("handleDeleteTask");
    });

    it("persists task creation to /api/v1/activities/tasks with project association", () => {
      expect(workSlice).toContain('fetch("/api/v1/activities/tasks"');
      expect(workSlice).toContain("projectId: p.id");
      expect(workSlice).toContain("newTaskTitle.trim()");
      expect(workSlice).toContain("newTaskStage");
      expect(workSlice).toContain("newTaskPriority");
    });

    it("persists task completion toggle to /api/v1/activities/tasks/[taskId] via PATCH", () => {
      expect(workSlice).toContain("/api/v1/activities/tasks/");
      expect(workSlice).toContain('method: "PATCH"');
      expect(workSlice).toContain("nextStatus");
    });

    it("renders empty states for stages and tasks", () => {
      expect(workSlice).toContain("po-workspace-empty");
      expect(workSlice).toContain("No Overdue Tasks");
      expect(workSlice).toContain("No High Priority Tasks");
      expect(workSlice).toContain("No Open Tasks");
    });
  });

  describe("3. Architecture & User Dashboard Scoping", () => {
    it("does not modify or bleed into Admin or Client Dashboards", () => {
      const clientRailPath = join(process.cwd(), "components/client/ClientDashboardRail.tsx");
      const clientRail = readFileSync(clientRailPath, "utf-8");
      expect(clientRail).not.toContain("Project Workspace");
      expect(clientRail).not.toContain("po-workspace-summary-panel");

      const adminUIPath = join(process.cwd(), "components/admin/AdminUI.tsx");
      const adminUI = readFileSync(adminUIPath, "utf-8");
      expect(adminUI).not.toContain("po-workspace-stages-panel");
    });

    it("preserves active Project Workspace tab styling on User Dashboard", () => {
      expect(pageContent).toContain('tab === "Project Workspace" && <Work p={p} b={boqs} showToast={showToast} />');
      expect(cssContent).toContain(".po-tab-btn.is-active");
    });
  });
});
