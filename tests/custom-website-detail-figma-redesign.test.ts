import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";

describe("User Dashboard → Custom Website Integration Detail Figma Redesign", () => {
    const pageCode = readFileSync("app/integrations/[id]/page.tsx", "utf8");
    const detailCode = readFileSync("components/integrations/IntegrationDetail.tsx", "utf8");
    const leadDashboardCode = readFileSync("components/integrations/LeadDashboard.tsx", "utf8");
    const analyticsCode = readFileSync("components/integrations/IntegrationAnalytics.tsx", "utf8");
    const formsTableCode = readFileSync("components/integrations/FormLeadsTable.tsx", "utf8");
    const recentTableCode = readFileSync("components/integrations/RecentLeadFormsTable.tsx", "utf8");
    const cssCode = readFileSync("app/integrations/integrations.css", "utf8");
    const globalsCssCode = readFileSync("app/globals.css", "utf8");
    const routeCode = readFileSync("app/api/v1/[...path]/route.ts", "utf8");

    describe("1. Parent Layout Compliance & Single Source of Truth", () => {
        it("verifies detail page renders inside existing DashboardRail and DashboardHeader without duplicate chrome", () => {
            expect(pageCode).toContain("<DashboardRail current=\"/integrations\"");
            expect(pageCode).toContain("<DashboardHeader title=\"Integrations\"");
            expect(pageCode).toContain("className=\"fig-dashboard\"");
            expect(pageCode).not.toContain("boq-dashboard");
            expect(pageCode).toContain("className=\"fig-dashboard-glow\"");
            expect(pageCode).toContain("className=\"fig-dashboard-main\"");
        });

        it("verifies detail page imports integrations.css for Figma styling", () => {
            expect(pageCode).toContain("import '../integrations.css'");
        });

        it("verifies globals.css does not contain restrictive legacy max-width: 1200px or padding: 24px overrides", () => {
            expect(globalsCssCode).not.toContain(".intg-detail-page {\r\n    padding: 24px;\r\n    max-width: 1200px;");
            expect(globalsCssCode).not.toContain(".intg-detail-page {\n    padding: 24px;\n    max-width: 1200px;");
        });

        it("verifies master detail container has width: 100%, max-width: 100%, Urbanist font, and 16px gap", () => {
            expect(cssCode).toContain(".intg-detail-page {");
            expect(cssCode).toContain("width: 100%;");
            expect(cssCode).toContain("max-width: 100%;");
            expect(cssCode).toContain("gap: 16px;");
            expect(cssCode).toContain("font-family: 'Urbanist'");
        });
    });

    describe("2. Figma Navigation & Identity Header (Frames 2147225070 & 2147225066)", () => {
        it("verifies Figma Back button with ArrowLeft and 'Back' text navigating to /integrations", () => {
            expect(detailCode).toContain("className=\"intg-detail-back-btn\"");
            expect(detailCode).toContain("<ArrowLeft size={16} />");
            expect(detailCode).toContain("<span>Back</span>");
            expect(detailCode).toContain("router.push('/integrations')");

            expect(cssCode).toContain(".intg-detail-back-btn {");
            expect(cssCode).toContain("color: #475569;");
            expect(cssCode).toContain("font-size: 16px;");
            expect(cssCode).toContain("font-weight: 500;");
        });

        it("verifies Custom Website 54x54px white icon tile with authentic SVG logo", () => {
            expect(detailCode).toContain("className=\"intg-detail-icon-wrap\"");
            expect(existsSync("public/assets/integrations/custom-website.svg")).toBe(true);

            expect(cssCode).toContain(".intg-detail-icon-wrap {");
            expect(cssCode).toContain("width: 54px;");
            expect(cssCode).toContain("height: 54px;");
            expect(cssCode).toContain("background: #FFFFFF;");
            expect(cssCode).toContain("border-radius: 8px;");
            expect(cssCode).toContain("padding: 14px;");
        });

        it("verifies Custom Website Form title (24px 500 #0F172A) and Connected status badge", () => {
            expect(detailCode).toContain("Custom Website Form");
            expect(detailCode).toContain("intg-detail-status-pill");

            expect(cssCode).toContain(".intg-detail-title {");
            expect(cssCode).toContain("font-size: 24px;");
            expect(cssCode).toContain("font-weight: 500;");
            expect(cssCode).toContain("color: #0F172A;");

            expect(cssCode).toContain(".intg-detail-status-pill {");
            expect(cssCode).toContain("border-radius: 9999px;");
            expect(cssCode).toContain("font-size: 12px;");
            expect(cssCode).toContain(".intg-detail-status-connected {");
            expect(cssCode).toContain("background: rgba(22, 163, 74, 0.12);");
            expect(cssCode).toContain("color: #16A34A;");
        });

        it("verifies subtitle matches Figma description for custom website", () => {
            expect(detailCode).toContain("Receive new leads using webhooks from your custom website to your BOQ SaaS Account");
            expect(cssCode).toContain(".intg-detail-subtitle {");
            expect(cssCode).toContain("font-size: 16px;");
            expect(cssCode).toContain("color: #64748B;");
        });

        it("verifies dynamic last-sync indicator with 8px dot and relative timestamp", () => {
            expect(detailCode).toContain("intg-detail-sync-status");
            expect(detailCode).toContain("intg-detail-sync-dot");
            expect(detailCode).toContain("Last synced");

            expect(cssCode).toContain(".intg-detail-sync-dot {");
            expect(cssCode).toContain("width: 8px;");
            expect(cssCode).toContain("height: 8px;");
            expect(cssCode).toContain("border-radius: 50%;");
            expect(cssCode).toContain(".intg-detail-sync-connected {");
            expect(cssCode).toContain("background: #16A34A;");
        });

        it("verifies 163x46px Pause Integration button with toggle action to resume", () => {
            expect(detailCode).toContain("className=\"intg-detail-btn-pause\"");
            expect(detailCode).toContain("Pause Integration");
            expect(detailCode).toContain("Resume Integration");
            expect(detailCode).toContain("handlePauseResume");

            expect(cssCode).toContain(".intg-detail-btn-pause {");
            expect(cssCode).toContain("height: 46px;");
            expect(cssCode).toContain("min-width: 163px;");
            expect(cssCode).toContain("background: #FFFFFF;");
            expect(cssCode).toContain("border-radius: 6px;");
            expect(cssCode).toContain("color: #0F172A;");
            expect(cssCode).toContain("font-weight: 600;");
        });

        it("verifies 169x46px New Custom Form primary button matching Frame 2147225069", () => {
            expect(detailCode).toContain("intg-new-form-btn");
            expect(detailCode).toContain("New Custom Form");
            expect(detailCode).toContain("setShowNewFormModal(true)");

            expect(cssCode).toContain(".intg-detail-btn-primary,");
            expect(cssCode).toContain(".intg-new-form-btn {");
            expect(cssCode).toContain("height: 46px;");
            expect(cssCode).toContain("min-width: 169px;");
            expect(cssCode).toContain("background: #2563EB;");
            expect(cssCode).toContain("border-radius: 6px;");
            expect(cssCode).toContain("color: #FFFFFF;");
        });
    });

    describe("3. Four Summary Metric Cards (Frame 2147225138)", () => {
        it("verifies 4-column responsive grid with 8px gap and 120px height frosted cards", () => {
            expect(leadDashboardCode).toContain("intg-detail-summary-grid");
            expect(cssCode).toContain(".intg-detail-summary-grid {");
            expect(cssCode).toContain("grid-template-columns: repeat(4, minmax(0, 1fr));");
            expect(cssCode).toContain("gap: 8px;");

            expect(cssCode).toContain(".intg-detail-kpi-card {");
            expect(cssCode).toContain("min-height: 120px;");
            expect(cssCode).toContain("height: 120px;");
            expect(cssCode).toContain("background: rgba(255, 255, 255, 0.6);");
            expect(cssCode).toContain("backdrop-filter: blur(20.4px);");
            expect(cssCode).toContain("border-radius: 6px;");
            expect(cssCode).toContain("padding: 20px;");
        });

        it("verifies Card 1: Lead Forms with Active pill badge", () => {
            expect(leadDashboardCode).toContain("Lead Forms");
            expect(leadDashboardCode).toContain("intg-detail-kpi-value");
            expect(leadDashboardCode).toContain("leadForms");
            expect(leadDashboardCode).toContain("Active");
        });

        it("verifies Card 2: Leads (This Month) with vs last month comparison", () => {
            expect(leadDashboardCode).toContain("Leads (This Month)");
            expect(leadDashboardCode).toContain("leadsThisMonth");
            expect(leadDashboardCode).toContain("leadsThisMonthChange");
            expect(leadDashboardCode).toContain("vs last month");
        });

        it("verifies Card 3: Leads Today with vs yesterday comparison", () => {
            expect(leadDashboardCode).toContain("Leads Today");
            expect(leadDashboardCode).toContain("leadsToday");
            expect(leadDashboardCode).toContain("leadsTodayChange");
            expect(leadDashboardCode).toContain("vs yesterday");
        });

        it("verifies Card 4: Failed Deliveries with comparison", () => {
            expect(leadDashboardCode).toContain("Failed Deliveries");
            expect(leadDashboardCode).toContain("failedDeliveries");
            expect(leadDashboardCode).toContain("failedDeliveriesChange");
        });
    });

    describe("4. Analytics Row: Responsive CSS Grid & Alignment (Frame 2147224997)", () => {
        it("verifies analytics row container uses responsive CSS grid with 8px gap and 335px height", () => {
            expect(cssCode).toContain(".intg-analytics-row {");
            expect(cssCode).toContain("display: grid;");
            expect(cssCode).toContain("grid-template-columns: minmax(0, 2.14fr) minmax(0, 1fr);");
            expect(cssCode).toContain("height: 335px;");
            expect(cssCode).toContain("gap: 8px;");
        });

        it("verifies chart cards use frosted translucent background rgba(255, 255, 255, 0.6) and blur 20.4px", () => {
            expect(cssCode).toContain(".intg-chart-card {");
            expect(cssCode).toContain("background: rgba(255, 255, 255, 0.6);");
            expect(cssCode).toContain("backdrop-filter: blur(20.4px);");
            expect(cssCode).toContain("border-radius: 6px;");
            expect(cssCode).toContain("height: 335px;");
            expect(cssCode).toContain("padding: 20px;");
        });

        it("verifies Leads Over Time card with 111x38px period dropdown", () => {
            expect(analyticsCode).toContain("Leads Over Time");
            expect(analyticsCode).toContain("intg-period-select");
            expect(analyticsCode).toContain("This Week");
            expect(analyticsCode).toContain("This Month");
            expect(analyticsCode).toContain("This Quarter");

            expect(cssCode).toContain(".intg-select-wrapper {");
            expect(cssCode).toContain("width: 111px;");
            expect(cssCode).toContain("height: 38px;");
            expect(cssCode).toContain("border: 1px solid #E2E8F0;");
            expect(cssCode).toContain("border-radius: 8px;");
        });

        it("verifies SVG Line/Area chart with #2563EB gradient fill and dashed gridlines", () => {
            expect(analyticsCode).toContain("leadAreaGradient");
            expect(analyticsCode).toContain("#2563EB");
            expect(analyticsCode).toContain("strokeDasharray=\"4 4\"");

            expect(cssCode).toContain(".intg-svg-chart {");
            expect(cssCode).toContain(".intg-chart-dot {");
        });

        it("verifies Lead Source Breakdown card with 160x160px Donut chart and fluid legend", () => {
            expect(analyticsCode).toContain("Lead Source Breakdown");
            expect(analyticsCode).toContain("intg-donut-svg");
            expect(analyticsCode).toContain("Total Leads");

            expect(cssCode).toContain(".intg-donut-card {");
            expect(cssCode).toContain(".intg-donut-svg-wrap {");
            expect(cssCode).toContain("width: 160px;");
            expect(cssCode).toContain("height: 160px;");

            expect(cssCode).toContain(".intg-donut-legend {");
            expect(cssCode).toContain("max-width: 240px;");
            expect(cssCode).toContain("flex: 1;");
        });
    });

    describe("5. Recent Lead Forms Table (Frame 2147225140)", () => {
        it("verifies table header matching Figma Frame 57 (#E4ECFB background, 36px height, 8px radius)", () => {
            expect(formsTableCode).toContain("intg-figma-header-row");
            expect(recentTableCode).toContain("intg-figma-header-row");

            expect(cssCode).toContain(".intg-figma-header-row {");
            expect(cssCode).toContain("background: #E4ECFB;");
            expect(cssCode).toContain("height: 36px;");

            expect(cssCode).toContain(".intg-th {");
            expect(cssCode).toContain("text-transform: uppercase;");
            expect(cssCode).toContain("color: #64748B;");
        });

        it("verifies FORM NAME column header label specified in Custom Website Figma", () => {
            expect(formsTableCode).toContain("FORM NAME");
            expect(recentTableCode).toContain("FORM NAME");
            expect(cssCode).toContain(".intg-th-form-name");
            expect(cssCode).toContain(".intg-td-form-name");
        });

        it("verifies 56px row height with #EBEBEB divider and #2563EB View Leads action", () => {
            expect(formsTableCode).toContain("View Leads");
            expect(recentTableCode).toContain("View Leads");

            expect(cssCode).toContain(".intg-figma-row {");
            expect(cssCode).toContain("height: 56px;");
            expect(cssCode).toContain(".intg-td {");
            expect(cssCode).toContain("border-bottom: 1px solid #EBEBEB;");

            expect(cssCode).toContain(".intg-link-action {");
            expect(cssCode).toContain("color: #2563EB;");
        });

        it("verifies ACTIVE and PAUSED status pill styling", () => {
            expect(formsTableCode).toContain("intg-pill-status");
            expect(formsTableCode).toContain("intg-pill-active");
            expect(formsTableCode).toContain("intg-pill-paused");

            expect(cssCode).toContain(".intg-pill-active {");
            expect(cssCode).toContain("background: rgba(22, 163, 74, 0.12);");
            expect(cssCode).toContain("color: #16A34A;");

            expect(cssCode).toContain(".intg-pill-paused {");
            expect(cssCode).toContain("background: rgba(217, 119, 6, 0.12);");
            expect(cssCode).toContain("color: #D97706;");
        });
    });

    describe("6. Backend Integration & Dynamic Data Flow", () => {
        it("verifies route handler supports integrations API routes", () => {
            expect(routeCode).toContain("intMatch = route.match(/^integrations\\/([a-zA-Z0-9_-]+)$/i)");
            expect(routeCode).toContain("intAnalyticsMatch = route.match(/^integrations\\/([a-zA-Z0-9_-]+)\\/analytics$/i)");
            expect(routeCode).toContain("intFormsMatch = route.match(/^integrations\\/([a-zA-Z0-9_-]+)\\/forms$/i)");
            expect(routeCode).toContain("intPauseMatch = route.match(/^integrations\\/([a-zA-Z0-9_-]+)\\/pause$/i)");
            expect(routeCode).toContain("intResumeMatch = route.match(/^integrations\\/([a-zA-Z0-9_-]+)\\/resume$/i)");
        });

        it("verifies integrationAnalytics parses period query parameter and aggregates dynamic metrics", () => {
            expect(routeCode).toContain("const period = url.searchParams.get(\"period\")");
            expect(routeCode).toContain("leadsOverTime");
            expect(routeCode).toContain("leadSourceBreakdown");
        });
    });

    describe("7. Responsive Layout Rules", () => {
        it("verifies responsive styles for tablet (1024px) and mobile (640px) screens", () => {
            expect(cssCode).toContain("@media (max-width: 1024px)");
            expect(cssCode).toContain("@media (max-width: 640px)");
            expect(cssCode).toContain(".intg-analytics-row {");
            expect(cssCode).toContain(".intg-detail-summary-grid {");
        });
    });
});
