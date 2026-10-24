import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";

describe("User Dashboard → Custom Form Details & Captured Leads Figma Redesign", () => {
    const pageCode = readFileSync("app/integrations/[id]/forms/[formId]/page.tsx", "utf8");
    const paginationCode = readFileSync("components/integrations/Pagination.tsx", "utf8");
    const cssCode = readFileSync("app/integrations/integrations.css", "utf8");

    describe("1. Parent Layout Compliance & Elimination of Right-Side Gap", () => {
        it("verifies Custom Form page renders inside existing DashboardRail and DashboardHeader without duplicate chrome", () => {
            expect(pageCode).toContain('<DashboardRail current="/integrations"');
            expect(pageCode).toContain('<DashboardHeader title="Integrations"');
            expect(pageCode).toContain('className="fig-dashboard"');
            expect(pageCode).not.toContain('boq-dashboard');
            expect(pageCode).toContain('className="fig-dashboard-glow"');
            expect(pageCode).toContain('className="fig-dashboard-main"');
        });

        it("verifies Custom Form page imports integrations.css for Figma design tokens", () => {
            expect(pageCode).toContain("import '../../../integrations.css';");
        });

        it("ensures custom-form-page fills parent dashboard width with width: 100% and max-width: 100%", () => {
            expect(cssCode).toContain(".custom-form-page {");
            expect(cssCode).toContain("width: 100%;");
            expect(cssCode).toContain("max-width: 100%;");
            expect(cssCode).toContain("min-width: 0;");
            expect(cssCode).toContain("box-sizing: border-box;");
        });

        it("ensures outer section cards and inner panels expand to full available container width without fixed width", () => {
            expect(cssCode).toContain(".custom-form-leads-panel {");
            expect(cssCode).toContain("background: rgba(255, 255, 255, 0.6);");
            expect(cssCode).toContain("backdrop-filter: blur(20.4px);");
            expect(cssCode).toContain("border-radius: 6px;");
            expect(cssCode).toContain("padding: 20px;");
        });
    });

    describe("2. Back Navigation & Form Details Header (Frames 2147225070 & 2147225066)", () => {
        it("renders back button with ChevronLeft and 'Back' label matching Figma Frame 2147225070", () => {
            expect(pageCode).toContain('className="custom-form-back-btn intg-detail-back-btn"');
            expect(pageCode).toContain("<ChevronLeft size={20}");
            expect(pageCode).toContain("<span>Back</span>");

            expect(cssCode).toContain(".custom-form-back-btn {");
            expect(cssCode).toContain("color: #475569;");
            expect(cssCode).toContain("font-size: 16px;");
            expect(cssCode).toContain("font-weight: 500;");
        });

        it("renders custom form title (24px 500 #0F172A) and status badge", () => {
            expect(pageCode).toContain("custom-form-title");
            expect(pageCode).toContain("custom-form-status-badge");
            expect(pageCode).toContain("form.name");

            expect(cssCode).toContain(".custom-form-title {");
            expect(cssCode).toContain("font-size: 24px;");
            expect(cssCode).toContain("font-weight: 500;");
            expect(cssCode).toContain("color: #0F172A;");

            expect(cssCode).toContain(".custom-form-status-active {");
            expect(cssCode).toContain("background: rgba(22, 163, 74, 0.12);");
            expect(cssCode).toContain("color: #16A34A;");

            expect(cssCode).toContain(".custom-form-status-paused {");
            expect(cssCode).toContain("background: rgba(217, 119, 6, 0.12);");
            expect(cssCode).toContain("color: #D97706;");
        });

        it("renders webhook URL row with copy action and feedback (Frame 2147225491)", () => {
            expect(pageCode).toContain("custom-form-webhook-row");
            expect(pageCode).toContain("custom-form-webhook-url");
            expect(pageCode).toContain("custom-form-copy-btn");
            expect(pageCode).toContain("handleCopyWebhook");
            expect(pageCode).toContain("custom-form-copied-feedback");

            expect(cssCode).toContain(".custom-form-webhook-url {");
            expect(cssCode).toContain("font-size: 14px;");
            expect(cssCode).toContain("font-weight: 500;");
            expect(cssCode).toContain("color: #64748B;");
        });

        it("renders sync indicator (Frame 2147225428) with 8px dot and relative timestamp", () => {
            expect(pageCode).toContain("custom-form-sync-indicator");
            expect(pageCode).toContain("custom-form-sync-dot");
            expect(pageCode).toContain("Last synced");

            expect(cssCode).toContain(".custom-form-sync-dot {");
            expect(cssCode).toContain("width: 8px;");
            expect(cssCode).toContain("height: 8px;");
            expect(cssCode).toContain("background: #16A34A;");
        });

        it("renders Pause/Resume Form toggle button and External Link button", () => {
            expect(pageCode).toContain("custom-form-btn-white");
            expect(pageCode).toContain("Pause Form");
            expect(pageCode).toContain("Resume Form");
            expect(pageCode).toContain("handlePauseResume");
            expect(pageCode).toContain("custom-form-ext-btn");

            expect(cssCode).toContain(".custom-form-btn-white {");
            expect(cssCode).toContain("height: 46px;");
            expect(cssCode).toContain("background: #FFFFFF;");
            expect(cssCode).toContain("border-radius: 6px;");
            expect(cssCode).toContain("color: #0F172A;");

            expect(cssCode).toContain(".custom-form-ext-btn {");
            expect(cssCode).toContain("width: 48px;");
            expect(cssCode).toContain("height: 46px;");
            expect(cssCode).toContain("background: #FFFFFF;");
            expect(cssCode).toContain("border-radius: 6px;");
        });
    });

    describe("3. Captured Leads Panel Toolbar (Frame 2147225489)", () => {
        it("renders Captured Leads heading in 14px 600 #0F172A", () => {
            expect(pageCode).toContain("custom-form-leads-title");
            expect(pageCode).toContain("Captured Leads");

            expect(cssCode).toContain(".custom-form-leads-title {");
            expect(cssCode).toContain("font-size: 14px;");
            expect(cssCode).toContain("font-weight: 600;");
            expect(cssCode).toContain("color: #0F172A;");
        });

        it("renders search box with 260px width, frosted glass surface and white icon box (Frame 76 & 70)", () => {
            expect(pageCode).toContain("custom-form-search-box");
            expect(pageCode).toContain("custom-form-search-icon-box");
            expect(pageCode).toContain("Search leads by name…");

            expect(cssCode).toContain(".custom-form-search-box {");
            expect(cssCode).toContain("width: 260px;");
            expect(cssCode).toContain("height: 46px;");
            expect(cssCode).toContain("background: rgba(255, 255, 255, 0.36);");
            expect(cssCode).toContain("border: 1px solid rgba(255, 255, 255, 0.32);");
            expect(cssCode).toContain("border-radius: 8px;");

            expect(cssCode).toContain(".custom-form-search-icon-box {");
            expect(cssCode).toContain("width: 36px;");
            expect(cssCode).toContain("height: 36px;");
            expect(cssCode).toContain("background: #FFFFFF;");
            expect(cssCode).toContain("border-radius: 6px;");
        });

        it("renders Export Excel button wired to export API", () => {
            expect(pageCode).toContain("custom-form-export-btn");
            expect(pageCode).toContain("Export Excel");
            expect(pageCode).toContain("handleExport");

            expect(cssCode).toContain(".custom-form-export-btn {");
            expect(cssCode).toContain("height: 46px;");
            expect(cssCode).toContain("background: #FFFFFF;");
            expect(cssCode).toContain("border-radius: 6px;");
            expect(cssCode).toContain("color: #0F172A;");
        });
    });

    describe("4. Captured Leads Table (Device Management_iOS & Frame 57)", () => {
        it("renders horizontally scrollable container with custom-form-table", () => {
            expect(pageCode).toContain("custom-form-table-wrap");
            expect(pageCode).toContain("custom-form-table");

            expect(cssCode).toContain(".custom-form-table-wrap {");
            expect(cssCode).toContain("overflow-x: auto;");
        });

        it("renders table header row with #E4ECFB background and uppercase text (Frame 57)", () => {
            expect(pageCode).toContain("custom-form-th-row");
            expect(pageCode).toContain("custom-form-th");
            expect(pageCode).toContain("TIMESTAMP");

            expect(cssCode).toContain(".custom-form-th-row {");
            expect(cssCode).toContain("height: 36px;");
            expect(cssCode).toContain("background: #E4ECFB;");

            expect(cssCode).toContain(".custom-form-th {");
            expect(cssCode).toContain("text-transform: uppercase;");
            expect(cssCode).toContain("color: #64748B;");
            expect(cssCode).toContain("font-size: 14px;");
            expect(cssCode).toContain("font-weight: 600;");
        });

        it("renders data rows with 56px height, 1px divider, and exact Figma timestamp format DD/MM/YYYY • HH:MM:SS", () => {
            expect(pageCode).toContain("custom-form-tr");
            expect(pageCode).toContain("custom-form-td-id");
            expect(pageCode).toContain("custom-form-td-field");
            expect(pageCode).toContain("custom-form-td-time");
            expect(pageCode).toContain("formatLeadTimestamp");

            expect(cssCode).toContain(".custom-form-tr {");
            expect(cssCode).toContain("height: 56px;");

            expect(cssCode).toContain(".custom-form-td {");
            expect(cssCode).toContain("border-bottom: 1px solid #EBEBEB;");
        });

        it("handles empty and search-empty states gracefully", () => {
            expect(pageCode).toContain("No leads captured yet.");
            expect(pageCode).toContain("Clear Search");
            expect(cssCode).toContain(".custom-form-empty-leads {");
        });
    });

    describe("5. Pagination Component (Frame 2147225166)", () => {
        it("renders total leads count on the left: Total Leads: {total}", () => {
            expect(paginationCode).toContain("custom-form-pagination-total");
            expect(paginationCode).toContain("Total Leads");

            expect(cssCode).toContain(".custom-form-pagination-total {");
            expect(cssCode).toContain("font-size: 14px;");
            expect(cssCode).toContain("font-weight: 600;");
            expect(cssCode).toContain("color: #0F172A;");
        });

        it("renders 34x34px pagination buttons with active page in #E4ECFB and #2563EB border (Frame 2147225165)", () => {
            expect(paginationCode).toContain("custom-form-page-btn");
            expect(paginationCode).toContain("custom-form-page-btn-active");
            expect(paginationCode).toContain("<ChevronLeft");
            expect(paginationCode).toContain("<ChevronRight");

            expect(cssCode).toContain(".custom-form-page-btn {");
            expect(cssCode).toContain("width: 34px;");
            expect(cssCode).toContain("height: 34px;");
            expect(cssCode).toContain("border: 1px solid #EBEBEB;");
            expect(cssCode).toContain("border-radius: 6px;");

            expect(cssCode).toContain(".custom-form-page-btn-active {");
            expect(cssCode).toContain("background: #E4ECFB;");
            expect(cssCode).toContain("border: 1px solid #2563EB;");
            expect(cssCode).toContain("color: #2563EB;");
        });

        it("renders Show per Page selector with 10, 25, 50 options (Frame 2147225167)", () => {
            expect(paginationCode).toContain("Show per Page:");
            expect(paginationCode).toContain("custom-form-per-page-select");
            expect(paginationCode).toContain("<option value={10}>10</option>");
            expect(paginationCode).toContain("<option value={25}>25</option>");
            expect(paginationCode).toContain("<option value={50}>50</option>");

            expect(cssCode).toContain(".custom-form-per-page-select {");
            expect(cssCode).toContain("height: 34px;");
            expect(cssCode).toContain("border: 1px solid #EBEBEB;");
            expect(cssCode).toContain("border-radius: 6px;");
        });
    });

    describe("6. Authoritative Dynamic Data Integration", () => {
        it("wires form details, leads loading, search, export, and status toggles to integrationsApi", () => {
            expect(pageCode).toContain("integrationsApi.getForm(formId)");
            expect(pageCode).toContain("integrationsApi.listFormLeads(formId");
            expect(pageCode).toContain("integrationsApi.pauseForm(formId)");
            expect(pageCode).toContain("integrationsApi.resumeForm(formId)");
            expect(pageCode).toContain("integrationsApi.exportFormLeads(formId)");
        });

        it("verifies dynamic table columns based on form fields schema", () => {
            expect(pageCode).toContain("dynamicFields.map");
            expect(pageCode).toContain("field.name.toUpperCase()");
            expect(pageCode).toContain("getFieldValue");
        });
    });

    describe("7. Responsive Design", () => {
        it("verifies responsive media queries for tablet and mobile in stylesheet", () => {
            expect(cssCode).toContain("@media (max-width: 1024px)");
            expect(cssCode).toContain("@media (max-width: 640px)");
        });
    });
});
