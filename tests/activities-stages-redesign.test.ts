import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("User Dashboard → Activities → Stages & New Stage Redesign", () => {
    const pagePath = path.join(process.cwd(), "app/activities/page.tsx");
    const cssPath = path.join(process.cwd(), "app/activities/activities-redesign.css");
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    describe("1. Dashboard Parent Layout & Global Structure", () => {
        it("inherits User Dashboard shell with DashboardRail and DashboardHeader", () => {
            expect(pageContent).toContain('className="fig-dashboard boq-dashboard activities-page"');
            expect(pageContent).toContain("<DashboardRail />");
            expect(pageContent).toContain('<DashboardHeader title="Activities"');
            expect(pageContent).toContain('import "./activities-redesign.css";');
        });

        it("uses Urbanist font and consistent palette tokens in CSS", () => {
            expect(cssContent).toContain("'Urbanist'");
            expect(cssContent).toContain("#2563EB"); // Primary blue
            expect(cssContent).toContain("#0F172A"); // Dark text
            expect(cssContent).toContain("#64748B"); // Muted text
            expect(cssContent).toContain("#E2E8F0"); // Border
            expect(cssContent).toContain("#EEF2F6"); // Column bg
        });
    });

    describe("2. Activities Navigation Tabs (Figma Segmented Control)", () => {
        it("renders white segmented tabs pill with 6px border radius and 1px #E2E8F0 border", () => {
            expect(pageContent).toContain('className="activities-tabs-pill"');
            expect(cssContent).toContain(".activities-tabs-pill");
            expect(cssContent).toContain("border: 1px solid #E2E8F0");
            expect(cssContent).toContain("border-radius: 6px");
        });

        it("renders Stages, Tasks, and Approvals tabs with active indicator", () => {
            expect(pageContent).toContain("Stages");
            expect(pageContent).toContain("Tasks");
            expect(pageContent).toContain("Approvals");
            expect(cssContent).toContain(".activities-tab-item.active");
            expect(cssContent).toContain("background: #EFF6FF");
            expect(cssContent).toContain("color: #2563EB");
        });
    });

    describe("3. Activities Toolbar Controls (Figma Frame 110 & Frame 76)", () => {
        it("renders stage search input with frosted background and search icon box", () => {
            expect(pageContent).toContain('className="activities-stage-search"');
            expect(pageContent).toContain('className="activities-search-icon-box"');
            expect(pageContent).toContain('placeholder="Search stage by name…"');
            expect(cssContent).toContain(".activities-stage-search");
            expect(cssContent).toContain("background: rgba(255, 255, 255, 0.36)");
            expect(cssContent).toContain("backdrop-filter: blur(20.4px)");
            expect(cssContent).toContain(".activities-search-icon-box");
            expect(cssContent).toContain("background: #FFFFFF");
            expect(cssContent).toContain("border-radius: 6px");
        });

        it("renders stage filter button with custom SVG icon and functional popover", () => {
            expect(pageContent).toContain('className={`activities-stage-filter-btn');
            expect(pageContent).toContain('className="activities-stage-filter-popover"');
            expect(cssContent).toContain(".activities-stage-filter-btn");
            expect(cssContent).toContain("width: 46px");
            expect(cssContent).toContain("height: 46px");
            expect(cssContent).toContain("border-radius: 6px");
        });

        it("renders primary '+ New Stage' button with #2563EB background and 6px radius", () => {
            expect(pageContent).toContain('className="activities-new-stage-btn"');
            expect(pageContent).toContain("New Stage");
            expect(cssContent).toContain(".activities-new-stage-btn");
            expect(cssContent).toContain("background: #2563EB");
            expect(cssContent).toContain("border-radius: 6px");
            expect(cssContent).toContain("height: 46px");
            expect(cssContent).toContain("color: #FFFFFF");
        });
    });

    describe("4. Stages Outer Frame & Summary Cards (Figma Frame 93 & Frame 2147225077)", () => {
        it("renders outer glassmorphism frame with 6px border radius and 20px padding", () => {
            expect(pageContent).toContain('className="activities-stages-outer-frame"');
            expect(cssContent).toContain(".activities-stages-outer-frame");
            expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6)");
            expect(cssContent).toContain("border-radius: 6px");
            expect(cssContent).toContain("padding: 20px");
        });

        it("renders stage summary header card with 82px height and project count", () => {
            expect(pageContent).toContain('className="activities-stage-summary-card"');
            expect(pageContent).toContain('className="activities-stage-summary-title"');
            expect(pageContent).toContain('className="activities-stage-summary-count"');
            expect(cssContent).toContain(".activities-stage-summary-card");
            expect(cssContent).toContain("height: 82px");
            expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6)");
            expect(cssContent).toContain("border-radius: 6px");
        });

        it("includes action buttons on stage summary card (+ Add Task and ... Options)", () => {
            expect(pageContent).toContain('className="activities-stage-summary-actions"');
            expect(pageContent).toContain('className="activities-stage-icon-btn"');
            expect(pageContent).toContain('className="activities-stage-menu"');
            expect(pageContent).toContain("Edit Stage");
            expect(pageContent).toContain("Delete Stage");
        });
    });

    describe("5. Stage Column Body & Project Cards (Figma Frame 2147225083 & Frame 2147225088)", () => {
        it("renders stage column body with #EEF2F6 background and 6px border radius", () => {
            expect(pageContent).toContain('className="activities-stage-column-body"');
            expect(cssContent).toContain(".activities-stage-column-body");
            expect(cssContent).toContain("background: #EEF2F6");
            expect(cssContent).toContain("border-radius: 6px");
        });

        it("renders project card with rgba(255, 255, 255, 0.8) surface, 6px radius, and 12px padding", () => {
            expect(pageContent).toContain('className="activities-project-card"');
            expect(cssContent).toContain(".activities-project-card");
            expect(cssContent).toContain("background: rgba(255, 255, 255, 0.8)");
            expect(cssContent).toContain("border-radius: 6px");
            expect(cssContent).toContain("padding: 12px");
        });

        it("renders project card header with project code and due date", () => {
            expect(pageContent).toContain('className="activities-card-top-row"');
            expect(pageContent).toContain('className="activities-card-project-code"');
            expect(pageContent).toContain('className="activities-card-due-date"');
            expect(cssContent).toContain(".activities-card-top-row");
            expect(cssContent).toContain(".activities-card-project-code");
            expect(cssContent).toContain(".activities-card-due-date");
        });

        it("renders project name, client name, and currency-formatted project value", () => {
            expect(pageContent).toContain('className="activities-card-mid-row"');
            expect(pageContent).toContain('className="activities-card-project-name"');
            expect(pageContent).toContain('className="activities-card-client-name"');
            expect(pageContent).toContain('className="activities-card-amount"');
            expect(cssContent).toContain(".activities-card-amount");
            expect(cssContent).toContain("font-size: 16px");
            expect(cssContent).toContain("font-weight: 500");
        });

        it("renders overdue and pending approval alert badges with exact Figma colors", () => {
            expect(pageContent).toContain('className="activities-card-badge overdue"');
            expect(pageContent).toContain('className="activities-card-badge pending"');
            expect(cssContent).toContain(".activities-card-badge.overdue");
            expect(cssContent).toContain("background: rgba(220, 38, 38, 0.12)");
            expect(cssContent).toContain("color: #DC2626");
            expect(cssContent).toContain(".activities-card-badge.pending");
            expect(cssContent).toContain("background: rgba(217, 119, 6, 0.12)");
            expect(cssContent).toContain("color: #D97706");
        });

        it("renders divider and assignee avatar with initials circle and options menu", () => {
            expect(pageContent).toContain('className="activities-card-divider"');
            expect(pageContent).toContain('className="activities-card-footer"');
            expect(pageContent).toContain('className="activities-card-avatar"');
            expect(pageContent).toContain('className="activities-card-assignee-name"');
            expect(pageContent).toContain('className="activities-card-menu-btn"');
            expect(cssContent).toContain(".activities-card-avatar");
            expect(cssContent).toContain("width: 26px");
            expect(cssContent).toContain("height: 26px");
            expect(cssContent).toContain("background: #EFF6FF");
            expect(cssContent).toContain("color: #2563EB");
            expect(cssContent).toContain(".activities-card-divider");
            expect(cssContent).toContain("background: #EBEBEB");
        });
    });

    describe("6. Add New Stage Modal (Figma Activities - Stages - New Stage)", () => {
        it("renders centered modal with blurred backdrop (rgba(0, 0, 0, 0.25) and blur(4.25px))", () => {
            expect(pageContent).toContain('className="activities-modal-backdrop"');
            expect(cssContent).toContain(".activities-modal-backdrop");
            expect(cssContent).toContain("background: rgba(0, 0, 0, 0.25)");
            expect(cssContent).toContain("backdrop-filter: blur(4.25px)");
        });

        it("renders modal container with 400px width, 16px radius, and frosted glass surface", () => {
            expect(pageContent).toContain('className="activities-stage-modal-container"');
            expect(cssContent).toContain(".activities-stage-modal-container");
            expect(cssContent).toContain("width: 400px");
            expect(cssContent).toContain("border-radius: 16px");
            expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6)");
            expect(cssContent).toContain("backdrop-filter: blur(16px)");
        });

        it("renders header row with title and accessible close button", () => {
            expect(pageContent).toContain('className="activities-modal-header-row"');
            expect(pageContent).toContain('className="activities-modal-title"');
            expect(pageContent).toContain('className="activities-modal-close-btn"');
            expect(cssContent).toContain(".activities-modal-title");
            expect(cssContent).toContain("font-size: 18px");
            expect(cssContent).toContain("font-weight: 600");
        });

        it("renders inner white card (Frame 2147225091) with 14px radius and #FFFFFF background", () => {
            expect(pageContent).toContain('className="activities-modal-inner-card"');
            expect(cssContent).toContain(".activities-modal-inner-card");
            expect(cssContent).toContain("background: #FFFFFF");
            expect(cssContent).toContain("border-radius: 14px");
            expect(cssContent).toContain("padding: 16px");
        });

        it("renders Stage Name field with placeholder 'ex. Concept Design' and required asterisk", () => {
            expect(pageContent).toContain('className="activities-modal-label"');
            expect(pageContent).toContain("Stage Name");
            expect(pageContent).toContain('className="activities-modal-req">*</span>');
            expect(pageContent).toContain('className={`activities-modal-input');
            expect(pageContent).toContain('placeholder="ex. Concept Design"');
            expect(cssContent).toContain(".activities-modal-input");
            expect(cssContent).toContain("height: 48px");
            expect(cssContent).toContain("border: 1px solid #E2E8F0");
            expect(cssContent).toContain("border-radius: 8px");
        });

        it("renders Cancel and Save Stage action buttons with exact styling", () => {
            expect(pageContent).toContain('className="activities-modal-actions-row"');
            expect(pageContent).toContain('className="activities-modal-cancel-btn"');
            expect(pageContent).toContain('className="activities-modal-save-btn"');
            expect(cssContent).toContain(".activities-modal-cancel-btn");
            expect(cssContent).toContain("background: #FFFFFF");
            expect(cssContent).toContain("border: 1px solid #E2E8F0");
            expect(cssContent).toContain("border-radius: 6px");
            expect(cssContent).toContain(".activities-modal-save-btn");
            expect(cssContent).toContain("background: #2563EB");
            expect(cssContent).toContain("border-radius: 6px");
            expect(cssContent).toContain("color: #FFFFFF");
        });
    });

    describe("7. Validation, State Management & Backend Integration", () => {
        it("validates empty/whitespace stage name and prevents submission", () => {
            expect(pageContent).toContain("stageForm.name.trim()");
            expect(pageContent).toContain('setStageError("Stage name is required.")');
        });

        it("enforces case-insensitive duplicate name check before API call", () => {
            expect(pageContent).toContain("s.name.trim().toLowerCase() === trimmedName.toLowerCase()");
            expect(pageContent).toContain('setStageError("A stage with this name already exists.")');
        });

        it("tracks isSubmittingStage state to disable submit button and prevent double submission", () => {
            expect(pageContent).toContain("isSubmittingStage");
            expect(pageContent).toContain("setIsSubmittingStage(true)");
            expect(pageContent).toContain("setIsSubmittingStage(false)");
            expect(pageContent).toContain("disabled={isSubmittingStage || !stageForm.name.trim()}");
        });

        it("calls createActivityStage and updateActivityStage APIs and reloads stages", () => {
            expect(pageContent).toContain("createActivityStage");
            expect(pageContent).toContain("updateActivityStage");
            expect(pageContent).toContain("await loadStages()");
        });

        it("supports Escape key dismissal of the New Stage modal", () => {
            expect(pageContent).toContain('e.key === "Escape"');
            expect(pageContent).toContain("setCreateStage(false)");
        });

        it("renders loading skeletons, empty state, and search empty state", () => {
            expect(pageContent).toContain('className="activities-skeleton-card"');
            expect(pageContent).toContain('className="activities-skeleton-column"');
            expect(pageContent).toContain('className="activities-empty-state-card"');
            expect(pageContent).toContain("No stages yet");
            expect(pageContent).toContain("No stages match your search");
            expect(pageContent).toContain("Clear search & filters");
        });

        it("renders toast feedback notification with dismiss button", () => {
            expect(pageContent).toContain('className="activities-toast"');
            expect(pageContent).toContain('className="activities-toast-close"');
            expect(cssContent).toContain(".activities-toast");
            expect(cssContent).toContain("background: #0F172A");
            expect(cssContent).toContain("color: #FFFFFF");
        });
    });
});
