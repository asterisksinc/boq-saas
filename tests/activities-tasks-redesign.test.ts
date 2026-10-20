import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("User Dashboard → Activities → Tasks & Add Task Drawer Redesign", () => {
    const pagePath = path.join(process.cwd(), "app/activities/page.tsx");
    const cssPath = path.join(process.cwd(), "app/activities/activities-redesign.css");
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    describe("1. Tasks Navigation & Search Toolbar (Figma Frame 110 & Frame 76)", () => {
        it("renders Tasks tab in segmented control with active selection support", () => {
            expect(pageContent).toContain('className={`activities-tab-item ${activeTab === "tasks" ? "active" : ""}`}');
            expect(pageContent).toContain('onClick={() => setActiveTab("tasks")}');
            expect(cssContent).toContain(".activities-tab-item.active");
        });

        it("renders frosted search bar for tasks with 36px white icon box", () => {
            expect(pageContent).toContain('className="activities-stage-search activities-task-search"');
            expect(pageContent).toContain('className="activities-search-icon-box"');
            expect(pageContent).toContain('placeholder="Search task by name..."');
        });

        it("renders task status and priority filters popover", () => {
            expect(pageContent).toContain('className={`activities-stage-filter-btn ${taskFilterOpen');
            expect(pageContent).toContain("Task Status");
            expect(pageContent).toContain("Priority");
        });

        it("renders primary New Task button matching Figma Frame 2147224972", () => {
            expect(pageContent).toContain('className="activities-new-stage-btn activities-new-task-btn"');
            expect(pageContent).toContain("<span>New Task</span>");
            expect(pageContent).toContain("setCreateTask(true)");
        });
    });

    describe("2. Tasks KPI Grid (Figma Frame 2147225138)", () => {
        it("defines KPI grid container with 4 columns and 8px gap", () => {
            expect(pageContent).toContain('className="activities-tasks-kpi-grid tasks-kpi-grid"');
            expect(cssContent).toContain(".activities-tasks-kpi-grid");
            expect(cssContent).toContain("grid-template-columns: repeat(4, 1fr)");
            expect(cssContent).toContain("gap: 8px");
        });

        it("renders 4 frosted KPI cards (Total Tasks, Overdue, In-Progress, Completed)", () => {
            expect(pageContent).toContain("Total Tasks");
            expect(pageContent).toContain("Overdue");
            expect(pageContent).toContain("In-Progress");
            expect(pageContent).toContain("Completed");
            expect(cssContent).toContain(".activities-tasks-kpi-card");
            expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6)");
            expect(cssContent).toContain("border-radius: 6px");
            expect(cssContent).toContain("padding: 20px");
        });

        it("binds dynamic KPI numbers to backend stats", () => {
            expect(pageContent).toContain("{kpiStats.total}");
            expect(pageContent).toContain("{kpiStats.overdue}");
            expect(pageContent).toContain("{kpiStats.inProgress}");
            expect(pageContent).toContain("{kpiStats.completed}");
        });

        it("styles KPI titles (Urbanist 14px 500 #64748B) and values (Urbanist 24px 500 #0F172A)", () => {
            expect(cssContent).toContain(".activities-tasks-kpi-title");
            expect(cssContent).toContain("font-size: 14px");
            expect(cssContent).toContain("color: #64748B");
            expect(cssContent).toContain(".activities-tasks-kpi-value");
            expect(cssContent).toContain("font-size: 24px");
            expect(cssContent).toContain("color: #0F172A");
        });

        it("styles KPI trend indicators (+2 Added Yesterday, 24% vs last month, etc.)", () => {
            expect(cssContent).toContain(".activities-tasks-kpi-trend");
            expect(cssContent).toContain(".activities-tasks-kpi-trend.positive");
            expect(cssContent).toContain("color: #16A34A");
            expect(cssContent).toContain(".activities-tasks-kpi-trend.negative");
            expect(cssContent).toContain("color: #EF4444");
        });
    });

    describe("3. Tasks Table Outer Container (Figma Frame 2147225072)", () => {
        it("renders frosted glass container with 6px border-radius and 20px padding", () => {
            expect(pageContent).toContain('className="activities-tasks-table-frame tasks-table-card"');
            expect(cssContent).toContain(".activities-tasks-table-frame");
            expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6)");
            expect(cssContent).toContain("border-radius: 6px");
            expect(cssContent).toContain("padding: 20px");
        });

        it("renders table header matching Figma Frame 57 with #E4ECFB background and 36px height", () => {
            expect(cssContent).toContain(".activities-tasks-table thead tr");
            expect(cssContent).toContain("background: #E4ECFB");
            expect(cssContent).toContain("height: 36px");
            expect(cssContent).toContain(".activities-tasks-table th");
            expect(cssContent).toContain("text-transform: uppercase");
            expect(cssContent).toContain("color: #64748B");
        });

        it("includes all 9 data column headers specified in Figma", () => {
            expect(pageContent).toContain("<th style={{ width: \"234px\" }}>TASK</th>");
            expect(pageContent).toContain("<th style={{ width: \"175px\" }}>PROJECT</th>");
            expect(pageContent).toContain("<th style={{ width: \"115px\" }}>STAGE</th>");
            expect(pageContent).toContain("<th style={{ width: \"175px\" }}>ASSIGNED TO</th>");
            expect(pageContent).toContain("<th style={{ width: \"148px\" }}>DUE DATE</th>");
            expect(pageContent).toContain("<th style={{ width: \"84px\" }}>PRIORITY</th>");
            expect(pageContent).toContain("<th style={{ width: \"122px\" }}>STATUS</th>");
            expect(pageContent).toContain("<th style={{ width: \"130px\" }}>UPDATED</th>");
        });
    });

    describe("4. Tasks Table Rows & Cells (Figma Frame 59 & 61)", () => {
        it("renders rows with 56px height and #EBEBEB divider", () => {
            expect(cssContent).toContain(".activities-tasks-table tbody tr");
            expect(cssContent).toContain("height: 56px");
            expect(cssContent).toContain("border-bottom: 1px solid #EBEBEB");
        });

        it("renders Figma custom 20x20 checkbox with #E2E8F0 border and 4px radius", () => {
            expect(pageContent).toContain('className="activities-task-checkbox tasks-checkbox"');
            expect(cssContent).toContain(".activities-task-checkbox");
            expect(cssContent).toContain("width: 20px");
            expect(cssContent).toContain("height: 20px");
            expect(cssContent).toContain("border: 1px solid #E2E8F0");
            expect(cssContent).toContain("border-radius: 4px");
        });

        it("renders Task cell with title and description", () => {
            expect(pageContent).toContain('className="activities-task-content-cell task-content-cell"');
            expect(pageContent).toContain('className="activities-task-title task-title"');
            expect(cssContent).toContain(".activities-task-title");
            expect(cssContent).toContain("color: #0F172A");
            expect(cssContent).toContain(".activities-task-desc");
            expect(cssContent).toContain("color: #64748B");
        });

        it("renders Project cell with name and code", () => {
            expect(pageContent).toContain('className="activities-task-project-cell task-project-cell"');
            expect(pageContent).toContain('className="activities-task-project-name task-project-name"');
            expect(pageContent).toContain('className="activities-task-project-code task-project-code"');
        });

        it("renders Stage pill with uppercase styling and rounded borders", () => {
            expect(pageContent).toContain('className="activities-task-stage-pill task-stage-pill"');
            expect(cssContent).toContain(".activities-task-stage-pill");
            expect(cssContent).toContain("border-radius: 9999px");
            expect(cssContent).toContain("text-transform: uppercase");
        });

        it("renders Assigned To avatar with initials and name", () => {
            expect(pageContent).toContain('className="activities-task-assignee-cell task-assignee-cell"');
            expect(pageContent).toContain('className="activities-task-assignee-avatar task-assignee-avatar"');
            expect(pageContent).toContain('className="activities-task-assignee-name task-assignee-name"');
        });

        it("renders Due Date with dynamic overdue / remaining days subtext", () => {
            expect(pageContent).toContain('className="activities-task-due-cell task-due-cell"');
            expect(pageContent).toContain('className="activities-task-due-date task-due-date"');
            expect(pageContent).toContain('className={`activities-task-due-subtext task-due-subtext ${dueInfo.className}`}');
            expect(cssContent).toContain(".activities-task-due-subtext.positive");
            expect(cssContent).toContain(".activities-task-due-subtext.negative");
        });

        it("renders Priority pills with Figma color palettes (High, Medium, Low)", () => {
            expect(cssContent).toContain(".activities-task-priority-pill.high");
            expect(cssContent).toContain("background: rgba(220, 38, 38, 0.1)");
            expect(cssContent).toContain("color: #DC2626");
            expect(cssContent).toContain(".activities-task-priority-pill.medium");
            expect(cssContent).toContain("background: rgba(37, 99, 235, 0.12)");
            expect(cssContent).toContain("color: #2563EB");
            expect(cssContent).toContain(".activities-task-priority-pill.low");
            expect(cssContent).toContain("color: #FAB000");
        });

        it("renders Status pills with Figma color palettes (In-Progress, Not Started, Completed)", () => {
            expect(cssContent).toContain(".activities-task-status-pill.in_progress");
            expect(cssContent).toContain("background: rgba(37, 99, 235, 0.12)");
            expect(cssContent).toContain("color: #2563EB");
            expect(cssContent).toContain(".activities-task-status-pill.not_started");
            expect(cssContent).toContain("background: rgba(100, 116, 139, 0.12)");
            expect(cssContent).toContain("color: #475569");
            expect(cssContent).toContain(".activities-task-status-pill.completed");
            expect(cssContent).toContain("background: rgba(22, 163, 74, 0.12)");
            expect(cssContent).toContain("color: #16A34A");
        });

        it("renders row action button with MoreHorizontal menu", () => {
            expect(pageContent).toContain('className="activities-task-action-btn stage-action-btn"');
            expect(pageContent).toContain("View Task");
            expect(pageContent).toContain("Edit Task");
            expect(pageContent).toContain("Delete Task");
        });
    });

    describe("5. Tasks Pagination Footer (Figma Frame 2147225166)", () => {
        it("renders footer container with Total Tasks count (Urbanist 14px 600 #0F172A)", () => {
            expect(pageContent).toContain('className="activities-tasks-pagination-bar tasks-table-footer"');
            expect(pageContent).toContain('className="activities-tasks-total-text"');
            expect(pageContent).toContain("Total Tasks: {filteredTasks.length}");
            expect(cssContent).toContain(".activities-tasks-total-text");
            expect(cssContent).toContain("font-weight: 600");
            expect(cssContent).toContain("color: #0F172A");
        });

        it("renders 34x34px pagination buttons with active highlight matching Figma Component 16", () => {
            expect(pageContent).toContain('className="activities-tasks-pages-wrap tasks-pagination"');
            expect(pageContent).toContain('className={`activities-tasks-page-btn tasks-page-btn ${pageNum === taskPage ? "active" : ""}`}');
            expect(cssContent).toContain(".activities-tasks-page-btn");
            expect(cssContent).toContain("width: 34px");
            expect(cssContent).toContain("height: 34px");
            expect(cssContent).toContain("border: 1px solid #EBEBEB");
            expect(cssContent).toContain(".activities-tasks-page-btn.active");
            expect(cssContent).toContain("background: #E4ECFB");
            expect(cssContent).toContain("border: 1px solid #2563EB");
            expect(cssContent).toContain("color: #2563EB");
        });

        it("renders Show per Page selector matching Figma Frame 2147225167", () => {
            expect(pageContent).toContain('className="activities-tasks-page-size-wrap tasks-page-size"');
            expect(pageContent).toContain("Show per Page:");
            expect(pageContent).toContain('className="activities-tasks-page-size-select"');
            expect(cssContent).toContain(".activities-tasks-page-size-select");
            expect(cssContent).toContain("height: 34px");
            expect(cssContent).toContain("border: 1px solid #EBEBEB");
        });
    });

    describe("6. Add New Task Drawer (Figma Frame 2147225094)", () => {
        it("renders 460px sliding drawer with frosted glass surface and 16px radius", () => {
            expect(pageContent).toContain('className="activities-task-drawer-backdrop activity-task-drawer-backdrop"');
            expect(pageContent).toContain('className="activities-task-drawer activity-task-drawer"');
            expect(cssContent).toContain(".activities-task-drawer");
            expect(cssContent).toContain("width: 460px");
            expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6)");
            expect(cssContent).toContain("border-radius: 16px");
            expect(cssContent).toContain("backdrop-filter: blur(20.4px)");
        });

        it("renders drawer header with title and close button", () => {
            expect(pageContent).toContain('className="activities-task-drawer-header activity-task-drawer-header"');
            expect(pageContent).toContain('className="activities-task-drawer-title"');
            expect(pageContent).toContain('{taskDetail ? "Edit Task" : "Add Task"}');
            expect(pageContent).toContain('className="activities-task-drawer-close activity-task-drawer-close"');
        });

        it("renders inner white card (Figma Frame 2147225027) with 14px radius and 16px padding", () => {
            expect(pageContent).toContain('className="activities-task-drawer-card activity-task-drawer-body"');
            expect(cssContent).toContain(".activities-task-drawer-card");
            expect(cssContent).toContain("background: #FFFFFF");
            expect(cssContent).toContain("border-radius: 14px");
            expect(cssContent).toContain("padding: 16px");
        });

        it("renders required field indicators with red asterisk (*)", () => {
            expect(pageContent).toContain('className="activities-task-asterisk"');
            expect(cssContent).toContain(".activities-task-asterisk");
            expect(cssContent).toContain("color: #DC2626");
        });

        it("renders 48px height inputs matching Figma Frame 12", () => {
            expect(pageContent).toContain('className="activities-task-input"');
            expect(pageContent).toContain('className="activities-task-select"');
            expect(cssContent).toContain(".activities-task-input");
            expect(cssContent).toContain("height: 48px");
            expect(cssContent).toContain("border: 1px solid #E2E8F0");
            expect(cssContent).toContain("border-radius: 8px");
        });

        it("renders 2-column layout for Due Date & Owner, and Priority & Status", () => {
            expect(pageContent).toContain('className="activities-task-two-col activity-task-row"');
            expect(cssContent).toContain(".activities-task-two-col");
            expect(cssContent).toContain("grid-template-columns: 1fr 1fr");
        });

        it("renders Drag & Drop attachment zone with blue icon box (Figma Frame 2147225048)", () => {
            expect(pageContent).toContain('className={`activities-task-dropzone activity-task-dropzone');
            expect(pageContent).toContain('className="activities-task-dropzone-icon-box"');
            expect(pageContent).toContain("Drag & Drop Your File Here");
            expect(cssContent).toContain(".activities-task-dropzone");
            expect(cssContent).toContain("height: 130px");
            expect(cssContent).toContain("border-radius: 12px");
            expect(cssContent).toContain(".activities-task-dropzone-icon-box");
            expect(cssContent).toContain("width: 62px");
            expect(cssContent).toContain("height: 62px");
            expect(cssContent).toContain("background: rgba(37, 99, 235, 0.1)");
            expect(cssContent).toContain("border: 1px solid #2563EB");
        });

        it("renders drawer footer with Cancel (white) and Create Task (blue) buttons (Figma Frame 2147225069)", () => {
            expect(pageContent).toContain('className="activities-task-drawer-footer activity-task-drawer-footer"');
            expect(pageContent).toContain('className="activities-task-btn-cancel activity-task-btn-cancel"');
            expect(pageContent).toContain('className="activities-task-btn-submit activity-task-btn-submit"');
            expect(cssContent).toContain(".activities-task-btn-cancel");
            expect(cssContent).toContain("background: #FFFFFF");
            expect(cssContent).toContain("color: #0F172A");
            expect(cssContent).toContain(".activities-task-btn-submit");
            expect(cssContent).toContain("background: #2563EB");
            expect(cssContent).toContain("color: #FFFFFF");
        });
    });

    describe("7. Task Detail Drawer", () => {
        it("renders View Task drawer with frosted glass surface", () => {
            expect(pageContent).toContain('className="view-task-drawer-backdrop"');
            expect(pageContent).toContain('className="view-task-drawer"');
            expect(cssContent).toContain(".view-task-drawer");
            expect(cssContent).toContain("border-radius: 16px");
        });

        it("renders metadata grid with Project Name, Project ID, Stage, and Due Date", () => {
            expect(pageContent).toContain("Project Name");
            expect(pageContent).toContain("Project ID");
            expect(pageContent).toContain("Stage");
            expect(pageContent).toContain("Due Date");
            expect(pageContent).toContain("Assigned To");
            expect(pageContent).toContain("Owner");
        });

        it("renders Attachments and Activity stream", () => {
            expect(pageContent).toContain('className="view-task-attachments-section"');
            expect(pageContent).toContain('className="view-task-activity-card"');
            expect(pageContent).toContain("Activity");
        });
    });
});
