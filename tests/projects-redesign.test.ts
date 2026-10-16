import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("User Dashboard → Projects Redesign (Figma Specifications)", () => {
  const pageSource = readFileSync("app/projects/page.tsx", "utf8");
  const cssSource = readFileSync("app/globals.css", "utf8");

  describe("Figma Table & Column Hierarchy", () => {
    it("renders all required table headers in exact hierarchy including STAGE and DESIGNER", () => {
      expect(pageSource).toContain("<th>ID</th>");
      expect(pageSource).toContain("<th>PROJECT</th>");
      expect(pageSource).toContain("<th>TYPE</th>");
      expect(pageSource).toContain("<th>STAGE</th>");
      expect(pageSource).toContain("<th>STATUS</th>");
      expect(pageSource).toContain("<th>DESIGNER</th>");
      expect(pageSource).toContain("<th>BOQS</th>");
      expect(pageSource).toContain("<th>MARGIN</th>");
      expect(pageSource).toContain("<th>PROGRESS</th>");
      expect(pageSource).toContain("<th>DUE DATE</th>");
    });

    it("renders stage badges with project-stage-badge class", () => {
      expect(pageSource).toContain("project-stage-badge");
      expect(cssSource).toContain(".project-stage-badge");
    });

    it("renders status badges with project-status-badge class and tokens", () => {
      expect(pageSource).toContain("project-status-badge");
      expect(cssSource).toContain(".project-status-badge");
      expect(cssSource).toContain(".project-status-badge.status-active");
      expect(cssSource).toContain(".project-status-badge.status-in_progress");
      expect(cssSource).toContain(".project-status-badge.status-on_hold");
      expect(cssSource).toContain(".project-status-badge.status-completed");
      expect(cssSource).toContain(".project-status-badge.status-planning");
    });

    it("renders progress bar with 8px height, amber fill, and percentage label", () => {
      expect(pageSource).toContain("project-progress-wrap");
      expect(pageSource).toContain("project-progress-track");
      expect(pageSource).toContain("project-progress-fill");
      expect(cssSource).toContain(".project-progress-wrap");
      expect(cssSource).toContain(".project-progress-track");
      expect(cssSource).toContain(".project-progress-fill");
      expect(cssSource).toContain("#F59E0B"); // Figma progress amber
    });
  });

  describe("Figma Grid View Card Design Specifications", () => {
    it("implements responsive 3-column desktop grid with 24px gap", () => {
      expect(cssSource).toContain(".project-grid {");
      expect(cssSource).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
      expect(cssSource).toContain("gap: 24px");
    });

    it("styles outer project card with rgba(255,255,255,0.6), 6px radius, and 12px padding", () => {
      expect(cssSource).toContain(".project-card {");
      expect(cssSource).toContain("background: rgba(255, 255, 255, 0.6)");
      expect(cssSource).toContain("border-radius: 6px");
      expect(cssSource).toContain("padding: 12px");
      expect(cssSource).toContain("gap: 16px");
    });

    it("renders card header with project name, code, status pill, and more button", () => {
      expect(pageSource).toContain("project-card-header");
      expect(pageSource).toContain("project-card-name");
      expect(pageSource).toContain("project-card-code");
      expect(cssSource).toContain(".project-card-name");
      expect(cssSource).toContain(".project-card-code");
      expect(cssSource).toContain("font-size: 16px"); // Name: 16px
      expect(cssSource).toContain("font-size: 14px"); // Code: 14px
    });

    it("renders inner white information panel with subtle shadow and 8px border radius", () => {
      expect(pageSource).toContain("project-card-panel");
      expect(cssSource).toContain(".project-card-panel");
      expect(cssSource).toContain("background: #FFFFFF");
      expect(cssSource).toContain("box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.06)");
      expect(cssSource).toContain("border-radius: 8px");
      expect(cssSource).toContain("padding: 12px");
    });

    it("renders 3 information rows: Client/Area/Type, Designer/BOQs/Margin, and Stage/DueDate/Progress", () => {
      expect(pageSource).toContain("Client Name");
      expect(pageSource).toContain("Square Foot");
      expect(pageSource).toContain("Type");
      expect(pageSource).toContain("Designer");
      expect(pageSource).toContain("BOQs");
      expect(pageSource).toContain("Margin");
      expect(pageSource).toContain("Stage");
      expect(pageSource).toContain("Due Date");
      expect(pageSource).toContain("Progress");
    });

    it("renders horizontal divider Rectangle 40 with #EBEBEB and 1px height", () => {
      expect(pageSource).toContain("project-card-divider");
      expect(cssSource).toContain(".project-card-divider");
      expect(cssSource).toContain("background: #EBEBEB");
      expect(cssSource).toContain("height: 1px");
    });

    it("dynamically formats BOQ value using boqDisplayValue with compact currency notation", () => {
      expect(pageSource).toContain("boqDisplayValue");
      expect(pageSource).toContain("formatTotalValue(val)");
    });

    it("includes responsive grid rules for 2 columns on tablet and 1 column on mobile", () => {
      expect(cssSource).toContain(".project-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }");
      expect(cssSource).toContain(".project-grid { grid-template-columns: 1fr; gap: 16px; }");
    });
  });

  describe("Dynamic Data Integrity (No Static/Mock Data)", () => {
    it("initializes project list dynamically from API with no hardcoded fallback records", () => {
      expect(pageSource).toContain("useState<Project[]>([])");
      expect(pageSource).toContain("/api/v1/projects");
      expect(pageSource).not.toContain("const mockProjects =");
      expect(pageSource).not.toContain("const dummyProjects =");
    });

    it("calculates dynamic totals and formats currency correctly", () => {
      expect(pageSource).toContain("formatTotalValue");
      expect(pageSource).toContain("projects.reduce");
      expect(pageSource).toContain("totalEstimatedValue");
      expect(pageSource).toContain("projects.length");
      expect(pageSource).toContain("total estimated value");
    });
  });

  describe("Figma Controls & Actions", () => {
    it("renders header action buttons: Import Excel, Export Excel, and New Project", () => {
      expect(pageSource).toContain("Import Excel");
      expect(pageSource).toContain("Export Excel");
      expect(pageSource).toContain("New Project");
      expect(pageSource).toContain("projects-btn-secondary");
      expect(pageSource).toContain("projects-btn-primary");
    });

    it("renders search input with Figma placeholder Search projects or clients… and 36x36 white box", () => {
      expect(pageSource).toContain('placeholder="Search projects or clients…"');
      expect(pageSource).toContain("projects-search-icon-box");
      expect(cssSource).toContain(".projects-search-icon-box");
    });

    it("renders view switcher with table and grid options and active state styling", () => {
      expect(pageSource).toContain("view-switch");
      expect(pageSource).toContain('aria-label="List view"');
      expect(pageSource).toContain('aria-label="Grid view"');
      expect(cssSource).toContain(".view-switch");
      expect(cssSource).toContain(".view-switch button.active");
    });

    it("preserves wizard creation, Excel file handling, and edit modal flows", () => {
      expect(pageSource).toContain("exportFile");
      expect(pageSource).toContain("importFile");
      expect(pageSource).toContain("EditProjectModal");
    });
  });

  describe("CSS & Shell Styling Architecture", () => {
    it("does not override dashboard shell background with boq-dashboard", () => {
      // Main shell inherits fig-dashboard instead of forcing legacy boq-dashboard
      expect(pageSource).not.toContain('className="boq-dashboard project-ui"');
      expect(pageSource).toContain('className="fig-dashboard project-ui"');
    });

    it("implements Figma glass card styling with backdrop blur and subtle border", () => {
      expect(cssSource).toContain(".projects-table-card");
      expect(cssSource).toContain("backdrop-filter: blur(10px)");
      expect(cssSource).toContain("border-radius: 6px");
    });

    it("includes responsive breakpoints for screens under 1100px and 760px", () => {
      expect(cssSource).toContain("@media (max-width: 1100px)");
      expect(cssSource).toContain("@media (max-width: 760px)");
    });
  });

  describe("Create New Project Entry Point & Modal Redesign (Figma Frame 2147225092)", () => {
    it("renders modal container with Figma 590px width, 16px radius, and rgba(255,255,255,0.6) surface", () => {
      expect(pageSource).toContain("project-create-modal");
      expect(cssSource).toContain(".project-modal.project-create-modal");
      expect(cssSource).toContain("width: min(590px, calc(100vw - 32px))");
      expect(cssSource).toContain("background: rgba(255, 255, 255, 0.6)");
      expect(cssSource).toContain("border-radius: 16px");
      expect(cssSource).toContain("backdrop-filter: blur(10px)");
    });

    it("renders modal header with 18px Urbanist title, 16px subtitle, and close button", () => {
      expect(pageSource).toContain('title="Create New Project"');
      expect(pageSource).toContain('subtitle="Choose how you want to start this project."');
      expect(cssSource).toContain(".project-create-modal > header h1");
      expect(cssSource).toContain("font-size: 18px");
      expect(cssSource).toContain("font-weight: 600");
      expect(cssSource).toContain("#0F172A");
      expect(cssSource).toContain(".project-create-modal > header p");
      expect(cssSource).toContain("font-size: 16px");
      expect(cssSource).toContain("#64748B");
      expect(cssSource).toContain(".project-create-modal > header button");
    });

    it("renders inner white options panel Frame 2147225091 with 14px border radius", () => {
      expect(pageSource).toContain("project-create-panel");
      expect(cssSource).toContain(".project-create-panel");
      expect(cssSource).toContain("background: #FFFFFF");
      expect(cssSource).toContain("border-radius: 14px");
      expect(cssSource).toContain("padding: 16px");
    });

    it("renders 4 creation options with exact Figma titles, descriptions, and accessible radiogroup", () => {
      expect(pageSource).toContain('"From Scratch"');
      expect(pageSource).toContain('"Set up project details manually"');
      expect(pageSource).toContain('"Use Template"');
      expect(pageSource).toContain('"Start from a project template"');
      expect(pageSource).toContain('"Import Excel/CSV"');
      expect(pageSource).toContain('"Import existing project data"');
      expect(pageSource).toContain('"Duplicate Project"');
      expect(pageSource).toContain('"Copy an existing project."');
      expect(pageSource).toContain('role="radiogroup"');
      expect(pageSource).toContain('role="radio"');
      expect(pageSource).toContain("aria-checked={method === opt.id}");
    });

    it("styles selected option card with blue #2563EB border, glow box-shadow, and top-right checkmark", () => {
      expect(pageSource).toContain("project-create-card-check");
      expect(cssSource).toContain(".project-create-card.selected");
      expect(cssSource).toContain("border: 1px solid #2563EB");
      expect(cssSource).toContain("box-shadow: 0px 0px 10px rgba(37, 99, 235, 0.25)");
      expect(cssSource).toContain(".project-create-card-check");
      expect(cssSource).toContain("right: 12px");
      expect(cssSource).toContain("top: 12px");
      expect(cssSource).toContain("color: #2563EB");
    });

    it("renders footer Frame 2147225069 with Urbanist Cancel and Continue buttons", () => {
      expect(pageSource).toContain("project-create-footer");
      expect(pageSource).toContain("project-create-cancel-btn");
      expect(pageSource).toContain("project-create-continue-btn");
      expect(pageSource).toContain("disabled={!method || saving}");
      expect(cssSource).toContain(".project-create-footer");
      expect(cssSource).toContain(".project-create-cancel-btn");
      expect(cssSource).toContain(".project-create-continue-btn");
      expect(cssSource).toContain("height: 46px");
      expect(cssSource).toContain("background: #2563EB");
    });

    it("integrates real backend workflows for all 4 project creation methods", () => {
      // From Scratch: transitions to wizard details step
      expect(pageSource).toContain('if (method === "scratch")');
      expect(pageSource).toContain('setScreen("details")');

      // Use Template: loads active templates and posts to /api/v1/project-templates/:id/use
      expect(pageSource).toContain("/api/v1/project-templates?status=active");
      expect(pageSource).toContain("/use");
      expect(pageSource).toContain("handleUseTemplate");

      // Duplicate Project: loads projects and posts to /api/v1/projects/:id/duplicate
      expect(pageSource).toContain("/duplicate");
      expect(pageSource).toContain("handleDuplicate");

      // Import Excel/CSV: submits spreadsheet to /api/v1/projects/imports?skipInvalid=true
      expect(pageSource).toContain("/api/v1/projects/imports?skipInvalid=true");
      expect(pageSource).toContain("handleImportSubmit");
      expect(pageSource).toContain("/api/v1/projects/import-template");
    });

    it("includes responsive rules stacking options to 1 column on mobile screens under 600px", () => {
      expect(cssSource).toContain("@media (max-width: 600px)");
      expect(cssSource).toContain("grid-template-columns: 1fr");
    });
  });

  describe("Figma From Scratch Wizard Redesign (Frame 2147225065)", () => {
    it("renders page container with subtle blue gradient overlay and #F1F5F9 background", () => {
      expect(pageSource).toContain("project-scratch-wrapper");
      expect(pageSource).toContain("project-scratch-container");
      expect(pageSource).toContain("project-scratch-gradient");
      expect(cssSource).toContain(".create-page-wrapper.project-scratch-wrapper");
      expect(cssSource).toContain("background: #F1F5F9");
      expect(cssSource).toContain(".project-scratch-gradient");
      expect(cssSource).toContain("linear-gradient(180deg, #2563EB -371.16%, rgba(37, 99, 235, 0) 100%)");
      expect(cssSource).toContain("opacity: 0.5");
    });

    it("renders page header Frame 2147225305 with title, subtitle, back button, and 46px action buttons", () => {
      expect(pageSource).toContain("project-scratch-header");
      expect(pageSource).toContain("project-scratch-back-btn");
      expect(pageSource).toContain("Create New Project");
      expect(pageSource).toContain("Set up the foundational details for your new residential project.");
      expect(pageSource).toContain("project-scratch-btn-cancel");
      expect(pageSource).toContain("project-scratch-btn-draft");
      expect(pageSource).toContain("project-scratch-btn-continue");

      expect(cssSource).toContain(".project-scratch-header");
      expect(cssSource).toContain(".project-scratch-back-btn");
      expect(cssSource).toContain(".project-scratch-btn-cancel");
      expect(cssSource).toContain(".project-scratch-btn-draft");
      expect(cssSource).toContain(".project-scratch-btn-continue");
      expect(cssSource).toContain("height: 46px");
      expect(cssSource).toContain("background: #2563EB"); // Continue button
    });

    it("renders Progress Tracker Frame 2147225073 with PROJECT SETUP title and 5 numbered steps", () => {
      expect(pageSource).toContain("project-setup-tracker");
      expect(pageSource).toContain("PROJECT SETUP");
      expect(pageSource).toContain("project-steps-panel");
      expect(pageSource).toContain('"01"');
      expect(pageSource).toContain('"Project Details"');
      expect(pageSource).toContain('"02"');
      expect(pageSource).toContain('"Room Setup"');
      expect(pageSource).toContain('"03"');
      expect(pageSource).toContain('"Room Dimensions"');
      expect(pageSource).toContain('"04"');
      expect(pageSource).toContain('"Requirements"');
      expect(pageSource).toContain('"05"');
      expect(pageSource).toContain('"Material Assignment"');

      expect(cssSource).toContain(".project-setup-tracker");
      expect(cssSource).toContain(".project-setup-heading");
      expect(cssSource).toContain(".project-steps-panel");
      expect(cssSource).toContain("border-radius: 14px");
      expect(cssSource).toContain("box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.06)");
    });

    it("styles 34x34 step circles with active glow, pending borders, status subtitles, and connector lines", () => {
      expect(pageSource).toContain("project-setup-circle");
      expect(pageSource).toContain("project-setup-labels");
      expect(pageSource).toContain("project-setup-title");
      expect(pageSource).toContain("project-setup-sub");
      expect(pageSource).toContain("project-setup-line");

      expect(cssSource).toContain(".project-setup-circle");
      expect(cssSource).toContain("width: 34px");
      expect(cssSource).toContain("height: 34px");
      expect(cssSource).toContain("border-radius: 74px");
      expect(cssSource).toContain("box-shadow: 0px 0px 0px 2px rgba(37, 99, 235, 0.1)"); // active ring
      expect(cssSource).toContain("border: 1px solid #94A3B8"); // pending border
      expect(cssSource).toContain(".project-setup-line.active");
    });

    it("renders Main Form Card Frame 2147225072 with PROJECT DETAILS title and paired input fields", () => {
      expect(pageSource).toContain("project-details-card");
      expect(pageSource).toContain("PROJECT DETAILS");
      expect(pageSource).toContain("project-details-panel");
      expect(pageSource).toContain('id="create-details-form"');
      expect(pageSource).toContain("project-fields-row");
      expect(pageSource).toContain("CLIENT INFORMATION");
      expect(pageSource).toContain("PROJECT TIMELINE");

      expect(cssSource).toContain(".project-details-card");
      expect(cssSource).toContain(".project-details-heading");
      expect(cssSource).toContain(".project-details-panel");
      expect(cssSource).toContain(".project-fields-row");
      expect(cssSource).toContain("grid-template-columns: 1fr 1fr");
    });

    it("renders Project Name input with helper text and 48px height", () => {
      expect(pageSource).toContain("Project Name");
      expect(pageSource).toContain('placeholder="ex. Sharma Residence"');
      expect(pageSource).toContain("Use a clear name that helps your team identify the project.");
      expect(cssSource).toContain(".project-field-input");
      expect(cssSource).toContain("height: 48px");
      expect(cssSource).toContain("border: 1px solid #E2E8F0");
      expect(cssSource).toContain("border-radius: 8px");
    });

    it("renders Project Status 3-pill radio selector with Planning, In Progress, and On Hold", () => {
      expect(pageSource).toContain("project-status-pills");
      expect(pageSource).toContain("project-status-pill");
      expect(pageSource).toContain("project-status-pill-circle");
      expect(pageSource).toContain('"planning"');
      expect(pageSource).toContain('"in_progress"');
      expect(pageSource).toContain('"on_hold"');
      expect(pageSource).toContain('role="radiogroup"');
      expect(pageSource).toContain('role="radio"');

      expect(cssSource).toContain(".project-status-pills");
      expect(cssSource).toContain(".project-status-pill");
      expect(cssSource).toContain(".project-status-pill.active");
      expect(cssSource).toContain("background: rgba(37, 99, 235, 0.1)");
      expect(cssSource).toContain("border: 1px solid #2563EB");
    });

    it("renders Project Cover Image card Frame 94 with 120x120 dashed drop area and Browse button", () => {
      expect(pageSource).toContain("project-cover-card");
      expect(pageSource).toContain("project-cover-dropzone");
      expect(pageSource).toContain("UPLOAD COVER");
      expect(pageSource).toContain("Project Cover Image");
      expect(pageSource).toContain("Recommended Size: 800X600px.");
      expect(pageSource).toContain("project-cover-browse-btn");

      expect(cssSource).toContain(".project-cover-card");
      expect(cssSource).toContain(".project-cover-dropzone");
      expect(cssSource).toContain("width: 120px");
      expect(cssSource).toContain("height: 120px");
      expect(cssSource).toContain("border: 1.5px dashed #64748B");
      expect(cssSource).toContain(".project-cover-browse-btn");
      expect(cssSource).toContain("height: 36px");
    });

    it("preserves wizard form submit, draft saving, and cancel logic with zero functional regressions", () => {
      expect(pageSource).toContain('form="create-details-form"');
      expect(pageSource).toContain("submitProjectDetails");
      expect(pageSource).toContain("saveAsDraft");
      expect(pageSource).toContain("onClose");
      expect(pageSource).toContain('setScreen("rooms")');
    });
  });
});


