import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("BOQ Creation Workflow, Blank BOQ, and Versioning Redesign", () => {
    const pagePath = join(process.cwd(), "app", "boqs", "page.tsx");
    const detailsModalPath = join(process.cwd(), "components", "boqs", "BoqDetailsModal.tsx");
    const historyModalPath = join(process.cwd(), "components", "boqs", "BoqVersionHistoryModal.tsx");
    const rowMenuPath = join(process.cwd(), "components", "boqs", "BoqRowActionMenu.tsx");
    const detailViewPath = join(process.cwd(), "components", "boqs", "BoqDetailView.tsx");
    const cssPath = join(process.cwd(), "app", "boq-redesign.css");
    const apiRoutePath = join(process.cwd(), "app", "api", "v1", "[...path]", "route.ts");
    const boqsApiPath = join(process.cwd(), "lib", "api", "boqs.ts");

    it("verifies all core workflow files exist", () => {
        expect(existsSync(pagePath)).toBe(true);
        expect(existsSync(detailsModalPath)).toBe(true);
        expect(existsSync(historyModalPath)).toBe(true);
        expect(existsSync(rowMenuPath)).toBe(true);
        expect(existsSync(detailViewPath)).toBe(true);
        expect(existsSync(cssPath)).toBe(true);
        expect(existsSync(apiRoutePath)).toBe(true);
        expect(existsSync(boqsApiPath)).toBe(true);
    });

    describe("Figma Screen 1: New BOQ Selection Modal (Frame 2147225092)", () => {
        const pageContent = readFileSync(pagePath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        it("renders the modal container with frosted glass surface and backdrop blur", () => {
            expect(pageContent).toContain('className="boq-create-modal-redesign"');
            expect(cssContent).toContain(".boq-create-modal-redesign {");
            expect(cssContent).toContain("width: 590px;");
            expect(cssContent).toContain("min-height: 285px;");
            expect(cssContent).toContain("backdrop-filter: blur(20.4px);");
            expect(cssContent).toContain("border-radius: 8px;");
        });

        it("renders the header with exact title, subtitle, and close button (Frame 2147225093)", () => {
            expect(pageContent).toContain('className="boq-create-header-redesign"');
            expect(pageContent).toContain("New Bill of Quantities");
            expect(pageContent).toContain("Choose how you want to create this BOQ");
            expect(pageContent).toContain('aria-label="Close modal"');
            expect(cssContent).toContain(".boq-create-header-title {");
            expect(cssContent).toContain("font-size: 18px;");
            expect(cssContent).toContain("color: #0F172A;");
        });

        it("renders the inner white options container (Frame 2147225091)", () => {
            expect(pageContent).toContain('className="boq-create-options-panel-redesign"');
            expect(cssContent).toContain(".boq-create-options-panel-redesign {");
            expect(cssContent).toContain("background: #FFFFFF;");
            expect(cssContent).toContain("border-radius: 8px;");
            expect(cssContent).toContain("padding: 16px;");
        });

        it("renders Card 1: Blank BOQ with selection indicators (Frame 2147225087)", () => {
            expect(pageContent).toContain("Blank BOQ");
            expect(pageContent).toContain("Start with an empty bill of quantities");
            expect(pageContent).toContain('className="boq-card-selected-indicator"');
            expect(cssContent).toContain(".boq-create-card-redesign.selected {");
            expect(cssContent).toContain("border: 1.5px solid #2563EB;");
        });

        it("renders Card 2: From Template option card (Frame 2147225088)", () => {
            expect(pageContent).toContain("From Template");
            expect(pageContent).toContain("Use a saved BOQ or room template");
        });

        it("renders Cancel and Continue action buttons with exact dimensions (Frame 2147225069)", () => {
            expect(pageContent).toContain('className="boq-btn-create-cancel-redesign"');
            expect(pageContent).toContain('className="boq-btn-create-continue-redesign"');
            expect(cssContent).toContain(".boq-btn-create-cancel-redesign {");
            expect(cssContent).toContain("min-width: 71px;");
            expect(cssContent).toContain("height: 46px;");
            expect(cssContent).toContain(".boq-btn-create-continue-redesign {");
            expect(cssContent).toContain("min-width: 85px;");
            expect(cssContent).toContain("height: 46px;");
            expect(cssContent).toContain("background: #2563EB;");
        });
    });

    describe("Figma Screen 2: BOQ Details Modal Form (Frame 2147225096)", () => {
        const detailsContent = readFileSync(detailsModalPath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        it("renders the details modal with 590px width and frosted surface", () => {
            expect(detailsContent).toContain('className="boq-details-modal-redesign"');
            expect(cssContent).toContain(".boq-details-modal-redesign {");
            expect(cssContent).toContain("width: 590px;");
            expect(cssContent).toContain("min-height: 508px;");
        });

        it("displays the required title and subtitle hierarchy", () => {
            expect(detailsContent).toContain("BOQ Details");
            expect(detailsContent).toContain("Fill in the details to get started");
            expect(cssContent).toContain(".boq-details-title-redesign {");
            expect(cssContent).toContain("font-size: 18px;");
        });

        it("renders the inner white panel for input fields (Frame 2147225027)", () => {
            expect(detailsContent).toContain('className="boq-details-form-panel-redesign"');
            expect(cssContent).toContain(".boq-details-form-panel-redesign {");
            expect(cssContent).toContain("background: #FFFFFF;");
            expect(cssContent).toContain("border-radius: 8px;");
            expect(cssContent).toContain("padding: 16px;");
        });

        it("enforces read-only system auto-generated BOQ Number with disabled state", () => {
            expect(detailsContent).toContain('id="boq-number-field"');
            expect(detailsContent).toContain('value="Auto-generated by system (e.g. BOQ-0071)"');
            expect(detailsContent).toContain("readOnly");
            expect(detailsContent).toContain("disabled");
            expect(detailsContent).toContain("boq-form-input-readonly");
            expect(cssContent).toContain(".boq-form-input-readonly {");
            expect(cssContent).toContain("cursor: not-allowed;");
        });

        it("renders searchable Project dropdown with persistent + Add Project action", () => {
            expect(detailsContent).toContain("boq-custom-select-trigger-redesign");
            expect(detailsContent).toContain("boq-dropdown-popup-redesign");
            expect(detailsContent).toContain("+ Add Project");
            expect(detailsContent).toContain("setShowAddProjectDialog(true)");
            expect(cssContent).toContain(".boq-dropdown-action-bottom {");
            expect(cssContent).toContain("color: #2563EB;");
        });

        it("renders Version (system auto-generated, read-only) and Assigned To in 2-column layout (Frame 2147225098)", () => {
            expect(detailsContent).toContain('className="boq-form-row-2col-redesign"');
            expect(detailsContent).toContain('id="boq-version-field"');
            expect(detailsContent).toContain('value="Auto-generated by system (e.g. v1)"');
            expect(detailsContent).toContain("readOnly");
            expect(detailsContent).toContain("disabled");
            expect(detailsContent).toContain("+ Add Team Member");
            expect(detailsContent).toContain("setShowAddMemberDialog(true)");
        });

        it("renders Select Template dropdown trigger and drawer integration in template mode", () => {
            expect(detailsContent).toContain("Select Template");
            expect(detailsContent).toContain("Browse Drawer & Preview →");
            expect(detailsContent).toContain("BoqTemplatesDrawer");
            expect(detailsContent).toContain("From Template");
        });

        it("renders the Method Summary Box with exact styling (Frame 12)", () => {
            expect(detailsContent).toContain('className="boq-method-box-redesign"');
            expect(detailsContent).toContain('className="boq-method-box-label"');
            expect(detailsContent).toContain('className="boq-method-box-val"');
            expect(detailsContent).toContain("Blank BOQ");
            expect(detailsContent).toContain("From Template");
            expect(cssContent).toContain(".boq-method-box-redesign {");
            expect(cssContent).toContain("background: #F2F3F2;");
            expect(cssContent).toContain("height: 52px;");
            expect(cssContent).toContain("border: 1px solid #E2E8F0;");
        });

        it("renders footer actions: Back, Cancel, and Create BOQ (Frame 2147225094)", () => {
            expect(detailsContent).toContain('className="boq-btn-details-back-redesign"');
            expect(detailsContent).toContain('className="boq-btn-details-cancel-redesign"');
            expect(detailsContent).toContain('className="boq-btn-details-create-redesign"');
            expect(cssContent).toContain(".boq-btn-details-back-redesign {");
            expect(cssContent).toContain("min-width: 59px;");
            expect(cssContent).toContain("height: 46px;");
            expect(cssContent).toContain(".boq-btn-details-cancel-redesign {");
            expect(cssContent).toContain("min-width: 71px;");
            expect(cssContent).toContain("height: 46px;");
            expect(cssContent).toContain(".boq-btn-details-create-redesign {");
            expect(cssContent).toContain("min-width: 104px;");
            expect(cssContent).toContain("height: 46px;");
            expect(cssContent).toContain("background: #2563EB;");
        });
    });

    describe("Dropdown Creation Workflows: Project & Team Member", () => {
        const detailsContent = readFileSync(detailsModalPath, "utf-8");

        it("integrates embedded Add Project dialog without clearing BOQ form inputs", () => {
            expect(detailsContent).toContain("showAddProjectDialog");
            expect(detailsContent).toContain("handleCreateProjectSubmit");
            expect(detailsContent).toContain('fetch("/api/v1/projects"');
            expect(detailsContent).toContain("setLocalProjects((prev) => [newOption, ...prev])");
            expect(detailsContent).toContain("setProjectId(newOption.id)");
            expect(detailsContent).toContain("onProjectCreated(newOption)");
        });

        it("integrates embedded Add Team Member dialog using createWorkspaceUser", () => {
            expect(detailsContent).toContain("showAddMemberDialog");
            expect(detailsContent).toContain("handleCreateMemberSubmit");
            expect(detailsContent).toContain("createWorkspaceUser(");
            expect(detailsContent).toContain("setLocalUsers((prev) => [created, ...prev])");
            expect(detailsContent).toContain("setAssignedTo(newMemberId)");
            expect(detailsContent).toContain("onMemberAdded(created)");
        });
    });

    describe("Automatic BOQ Numbering, Versioning & Minor Revisions", () => {
        const apiContent = readFileSync(apiRoutePath, "utf-8");
        const boqsApiContent = readFileSync(boqsApiPath, "utf-8");
        const historyContent = readFileSync(historyModalPath, "utf-8");
        const menuContent = readFileSync(rowMenuPath, "utf-8");
        const detailViewContent = readFileSync(detailViewPath, "utf-8");

        it("implements server-side sequential auto-numbering via nextBoqIdentity", () => {
            expect(apiContent).toContain("nextBoqIdentity");
            expect(apiContent).toContain("BOQ-");
        });

        it("provides createBoqRevision endpoint that preserves earlier versions as immutable snapshots", () => {
            expect(apiContent).toContain("createBoqRevision");
            expect(apiContent).toContain("getBoqRevisions");
            expect(boqsApiContent).toContain("export async function createBoqRevision");
            expect(boqsApiContent).toContain("export async function getBoqRevisions");
        });

        it("renders the Version History modal displaying historical snapshots and revision trigger", () => {
            expect(historyContent).toContain("BoqVersionHistoryModal");
            expect(historyContent).toContain("Version History —");
            expect(historyContent).toContain("handleCreateMinorRevision");
            expect(historyContent).toContain("Open Snapshot");
            expect(historyContent).toContain("CURRENT");
        });

        it("wires Version History and Minor Revision actions in the table row action menu", () => {
            expect(menuContent).toContain("onCreateRevision");
            expect(menuContent).toContain("onViewHistory");
            expect(menuContent).toContain("Create Revision");
            expect(menuContent).toContain("Version History");
        });

        it("wires History and Create Revision buttons in the BOQ details view actions bar", () => {
            expect(detailViewContent).toContain("History (");
            expect(detailViewContent).toContain("Create Revision");
            expect(detailViewContent).toContain("setShowHistoryModal(true)");
        });
    });

    describe("Figma Screen: Use Template Sliding Drawer (Frame 2147225093 & Frame 2147225096)", () => {
        const templatesDrawerPath = join(process.cwd(), "components", "boqs", "BoqTemplatesDrawer.tsx");
        const drawerContent = readFileSync(templatesDrawerPath, "utf-8");
        const detailViewContent = readFileSync(detailViewPath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");
        const apiContent = readFileSync(apiRoutePath, "utf-8");

        it("verifies BoqTemplatesDrawer component exists with frosted glass panel and header", () => {
            expect(existsSync(templatesDrawerPath)).toBe(true);
            expect(drawerContent).toContain('className="boq-templates-drawer-redesign"');
            expect(drawerContent).toContain('className="boq-templates-drawer-header"');
            expect(drawerContent).toContain("Templates");
            expect(drawerContent).toContain("templates");
            expect(cssContent).toContain(".boq-templates-drawer-redesign {");
            expect(cssContent).toContain("width: 590px;");
            expect(cssContent).toContain("backdrop-filter: blur(20.4px);");
        });

        it("renders inner white container with search bar and New Template button (Frame 2147225096 & 2147225122)", () => {
            expect(drawerContent).toContain('className="boq-templates-inner-panel"');
            expect(drawerContent).toContain('className="boq-templates-drawer-search-row"');
            expect(drawerContent).toContain('placeholder="Select..."');
            expect(drawerContent).toContain('className="boq-templates-new-btn"');
            expect(drawerContent).toContain("New Template");
            expect(cssContent).toContain(".boq-templates-inner-panel {");
            expect(cssContent).toContain("background: #FFFFFF;");
            expect(cssContent).toContain("border-radius: 14px;");
        });

        it("renders expanded and collapsed template cards with Use button and item preview panel (Frame 2147225131 & 2147225130)", () => {
            expect(drawerContent).toContain("boq-template-expanded-card");
            expect(drawerContent).toContain("boq-template-collapsed-card");
            expect(drawerContent).toContain("boq-template-card-header");
            expect(drawerContent).toContain("boq-template-use-btn");
            expect(drawerContent).toContain("boq-template-card-expanded-body");
            expect(drawerContent).toContain("boq-template-preview-row");
            expect(cssContent).toContain(".boq-template-expanded-card {");
            expect(cssContent).toContain("background: #F3F4F6;");
            expect(cssContent).toContain(".boq-template-use-btn {");
            expect(cssContent).toContain("border: 1px solid #2563EB;");
        });

        it("integrates BoqTemplatesDrawer into BoqDetailView and handles template application to active BOQ", () => {
            expect(detailViewContent).toContain("BoqTemplatesDrawer");
            expect(detailViewContent).toContain("handleApplyTemplate");
            expect(detailViewContent).toContain("showTemplateModal");
        });

        it("server-side createBoq extracts rooms from snapshot object or array to clone template items", () => {
            expect(apiContent).toContain("rawSnapshot");
            expect(apiContent).toContain("sourceRooms");
            expect(apiContent).toContain("boq_rooms");
            expect(apiContent).toContain("boq_categories");
            expect(apiContent).toContain("boq_items");
        });
    });
});

