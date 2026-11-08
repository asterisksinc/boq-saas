import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("User Dashboard → Activities → Stages: Dynamic Kanban Board with Backend Drag-and-Drop", () => {
    const pagePath = path.join(process.cwd(), "app/activities/page.tsx");
    const cssPath = path.join(process.cwd(), "app/activities/activities-redesign.css");
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    describe("1. Board Layout & Figma Visual Structure", () => {
        it("renders the outer glassmorphism frame with horizontal board scrolling", () => {
            expect(pageContent).toContain('className="activities-stages-outer-frame"');
            expect(pageContent).toContain('className="activities-stages-board"');
            expect(cssContent).toContain(".activities-stages-outer-frame");
            expect(cssContent).toContain("overflow-x: auto");
            expect(cssContent).toContain(".activities-stages-board");
            expect(cssContent).toContain("min-width: min-content");
        });

        it("renders dynamic stage columns with 317px width and flex layout", () => {
            expect(pageContent).toContain('className="activities-stage-column"');
            expect(cssContent).toContain(".activities-stage-column");
            expect(cssContent).toContain("width: 317px");
            expect(cssContent).toContain("display: flex");
        });
    });

    describe("2. Dynamic Stage Summary Header Cards", () => {
        it("renders summary card with dynamic title, project count, and action controls", () => {
            expect(pageContent).toContain('className="activities-stage-summary-card"');
            expect(pageContent).toContain('className="activities-stage-summary-meta"');
            expect(pageContent).toContain('className="activities-stage-summary-title"');
            expect(pageContent).toContain('className="activities-stage-summary-count"');
            expect(pageContent).toContain('className="activities-stage-summary-actions"');
            expect(pageContent).toContain('className="activities-stage-icon-btn"');
        });

        it("calculates pluralized project count text dynamically per stage", () => {
            expect(pageContent).toContain('const countText = `${stageProjects.length} ${stageProjects.length === 1 ? "Project" : "Projects"}`');
        });

        it("provides + Add Task and ... stage menu with Edit and Delete options", () => {
            expect(pageContent).toContain('title={`Add task to ${stage.name}`}');
            expect(pageContent).toContain('className="activities-stage-menu"');
            expect(pageContent).toContain("Edit Stage");
            expect(pageContent).toContain("Delete Stage");
        });
    });

    describe("3. Kanban Project Cards & Information Hierarchy", () => {
        it("renders project card with Figma rounded card style and hover lift", () => {
            expect(pageContent).toContain('className="activities-project-card"');
            expect(cssContent).toContain(".activities-project-card");
            expect(cssContent).toContain("background: rgba(255, 255, 255, 0.8)");
            expect(cssContent).toContain("border-radius: 6px");
            expect(cssContent).toContain("padding: 12px");
        });

        it("displays Project Code and Due Date in top row", () => {
            expect(pageContent).toContain('className="activities-card-top-row"');
            expect(pageContent).toContain('className="activities-card-project-code"');
            expect(pageContent).toContain('className="activities-card-due-date"');
            expect(pageContent).toContain("Due {dueText}");
        });

        it("displays Project Name, Client Name, and Currency Project Value in mid row", () => {
            expect(pageContent).toContain('className="activities-card-mid-row"');
            expect(pageContent).toContain('className="activities-card-titles-col"');
            expect(pageContent).toContain('className="activities-card-project-name"');
            expect(pageContent).toContain('className="activities-card-client-name"');
            expect(pageContent).toContain('className="activities-card-amount"');
            expect(pageContent).toContain("money(budgetVal)");
        });

        it("renders conditional alert badges for overdue tasks and pending approvals", () => {
            expect(pageContent).toContain('className="activities-card-badges-row"');
            expect(pageContent).toContain('className="activities-card-badge overdue"');
            expect(pageContent).toContain('className="activities-card-badge pending"');
        });

        it("renders divider and footer with Assignee Initials Avatar and Card Menu", () => {
            expect(pageContent).toContain('className="activities-card-divider"');
            expect(pageContent).toContain('className="activities-card-footer"');
            expect(pageContent).toContain('className="activities-card-avatar"');
            expect(pageContent).toContain('className="activities-card-assignee-name"');
            expect(pageContent).toContain('className="activities-card-menu-btn"');
        });

        it("provides Move to Stage fallback in project action menu for accessibility", () => {
            expect(pageContent).toContain("MOVE TO STAGE");
            expect(pageContent).toContain("moveProjectToStage(proj, targetStage)");
        });
    });

    describe("4. Drag-and-Drop Implementation & Visual Indicators", () => {
        it("marks project card as draggable with grab cursor and drag events", () => {
            expect(pageContent).toContain("draggable={true}");
            expect(pageContent).toContain("onDragStart=");
            expect(pageContent).toContain("onDragEnd=");
            expect(cssContent).toContain("cursor: grab");
            expect(cssContent).toContain("cursor: grabbing");
        });

        it("applies dragging visual styles with reduced opacity and dashed border", () => {
            expect(pageContent).toContain('data-dragging={draggedProjectId === proj.id ? "true" : "false"}');
            expect(cssContent).toContain(".activities-project-card[data-dragging=\"true\"]");
            expect(cssContent).toContain("opacity: 0.45");
            expect(cssContent).toContain("border: 2px dashed #2563EB");
        });

        it("makes column body a drop target with onDragOver, onDragLeave, and onDrop", () => {
            expect(pageContent).toContain("onDragOver=");
            expect(pageContent).toContain("onDragLeave=");
            expect(pageContent).toContain("onDrop=");
            expect(pageContent).toContain('data-drag-over={dragOverStageId === stage.id ? "true" : "false"}');
            expect(cssContent).toContain(".activities-stage-column-body[data-drag-over=\"true\"]");
            expect(cssContent).toContain("background: #E4ECFB");
            expect(cssContent).toContain("outline: 2px dashed #2563EB");
        });

        it("keeps empty stages droppable with clean empty placeholder", () => {
            expect(pageContent).toContain('className="activities-stage-column-empty"');
            expect(pageContent).toContain("No projects in this stage");
        });
    });

    describe("5. Deterministic Single-Stage Mapping & Backend Persistence", () => {
        it("maps each project to exactly one stage without card duplication across columns", () => {
            expect(pageContent).toContain("getProjectStageId");
            expect(pageContent).toContain("getProjectStageId(p, stages) === stage.id");
        });

        it("updates project state optimistically when moving between stages", () => {
            expect(pageContent).toContain("setProjects(prev => prev.map(p => {");
            expect(pageContent).toContain("tags: newTags");
            expect(pageContent).toContain("workflowStage: targetStage.id");
        });

        it("synchronizes workflow stage endpoint /api/v1/projects/:id/workflow", () => {
            expect(pageContent).toContain("fetch(`/api/v1/projects/${project.id}/workflow`");
            expect(pageContent).toContain('stageId: targetStage.id');
            expect(pageContent).toContain("if (!wfRes.ok)");
            expect(pageContent).not.toContain('fetch(`/api/v1/projects/${project.id}`,');
        });

        it("implements state rollback on backend API failure with notice toast", () => {
            expect(pageContent).toContain("setProjects(previousProjects)");
            expect(pageContent).toContain('setNotice("Failed to move project. Reverting changes.")');
        });
    });

    describe("6. Dashboard Isolation & Regression Prevention", () => {
        it("does not modify admin dashboard files or components", () => {
            expect(fs.existsSync(path.join(process.cwd(), "app/admin"))).toBe(true);
            expect(fs.existsSync(path.join(process.cwd(), "app/client"))).toBe(true);
        });

        it("preserves Activities navigation between Stages, Tasks, and Approvals", () => {
            expect(pageContent).toContain('onClick={() => setActiveTab("stages")}');
            expect(pageContent).toContain('onClick={() => setActiveTab("tasks")}');
            expect(pageContent).toContain('onClick={() => setActiveTab("approvals")}');
        });
    });
});
