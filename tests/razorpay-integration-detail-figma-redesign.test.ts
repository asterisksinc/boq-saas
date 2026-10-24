import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Razorpay Integration Details Page Figma Redesign Test Suite", () => {
    const cssPath = path.resolve(__dirname, "../app/integrations/integrations.css");
    const paymentDashboardPath = path.resolve(__dirname, "../components/integrations/PaymentDashboard.tsx");
    const paymentBarChartPath = path.resolve(__dirname, "../components/integrations/PaymentBarChart.tsx");
    const paymentStatusDonutPath = path.resolve(__dirname, "../components/integrations/PaymentStatusDonut.tsx");
    const transactionsTablePath = path.resolve(__dirname, "../components/integrations/TransactionsTable.tsx");
    const integrationDetailPath = path.resolve(__dirname, "../components/integrations/IntegrationDetail.tsx");
    const routeApiPath = path.resolve(__dirname, "../app/api/v1/[...path]/route.ts");

    const cssContent = fs.readFileSync(cssPath, "utf-8");
    const paymentDashboardCode = fs.readFileSync(paymentDashboardPath, "utf-8");
    const paymentBarChartCode = fs.readFileSync(paymentBarChartPath, "utf-8");
    const paymentStatusDonutCode = fs.readFileSync(paymentStatusDonutPath, "utf-8");
    const transactionsTableCode = fs.readFileSync(transactionsTablePath, "utf-8");
    const integrationDetailCode = fs.readFileSync(integrationDetailPath, "utf-8");
    const routeApiCode = fs.readFileSync(routeApiPath, "utf-8");

    describe("1. Layout, Width Boundary & Whitespace Elimination", () => {
        it("verifies razorpay integration page uses fluid 100% width and box-sizing to eliminate right-side whitespace", () => {
            expect(cssContent).toContain(".razorpay-integration-page");
            expect(cssContent).toMatch(/\.razorpay-integration-page\s*\{[^}]*width:\s*100%/);
            expect(cssContent).toMatch(/\.razorpay-integration-page\s*\{[^}]*max-width:\s*100%/);
            expect(cssContent).toMatch(/\.razorpay-integration-page\s*\{[^}]*box-sizing:\s*border-box/);
        });

        it("verifies IntegrationDetail applies razorpay-integration-page class and data-provider attribute", () => {
            expect(integrationDetailCode).toContain("razorpay-integration-page");
            expect(integrationDetailCode).toContain("data-provider={integration.provider}");
        });

        it("verifies content wrapper fills width with min-width: 0 and uniform vertical gap of 16px", () => {
            expect(cssContent).toContain(".razorpay-integration-page__content");
            expect(cssContent).toMatch(/\.razorpay-integration-page__content\s*\{[^}]*gap:\s*16px/);
            expect(cssContent).toMatch(/\.razorpay-integration-page__content\s*\{[^}]*min-width:\s*0/);
        });
    });

    describe("2. Integration Header & Actions (Figma Frame 2147225066)", () => {
        it("renders back button with ArrowLeft icon, Urbanist 500 font, and #475569 color", () => {
            expect(integrationDetailCode).toContain("intg-detail-back-btn");
            expect(integrationDetailCode).toContain("<ArrowLeft");
            expect(cssContent).toMatch(/\.intg-detail-back-btn\s*\{[^}]*color:\s*#475569/);
            expect(cssContent).toMatch(/\.intg-detail-back-btn\s*\{[^}]*font-family:\s*'Urbanist'/);
        });

        it("renders 52x52px white icon wrap with 8px radius and 24x24px icon inside", () => {
            expect(cssContent).toMatch(/\.razorpay-integration-page\s+\.intg-detail-icon-wrap\s*\{[^}]*width:\s*52px/);
            expect(cssContent).toMatch(/\.razorpay-integration-page\s+\.intg-detail-icon-wrap\s*\{[^}]*height:\s*52px/);
            expect(cssContent).toMatch(/\.intg-detail-icon-wrap\s*\{[^}]*background:\s*#FFFFFF/);
            expect(cssContent).toMatch(/\.intg-detail-icon-wrap\s*\{[^}]*border-radius:\s*8px/);
            expect(cssContent).toMatch(/\.razorpay-integration-page\s+\.intg-detail-icon-img\s*\{[^}]*width:\s*24px/);
            expect(cssContent).toMatch(/\.razorpay-integration-page\s+\.intg-detail-icon-img\s*\{[^}]*height:\s*24px/);
        });

        it("renders Razorpay title, Connected status badge, and Figma description", () => {
            expect(integrationDetailCode).toContain("Razorpay Integration");
            expect(integrationDetailCode).toContain("Start receiving payments from your clients on the invoices created.");
            expect(cssContent).toMatch(/\.intg-detail-title\s*\{[^}]*font-size:\s*24px/);
            expect(cssContent).toMatch(/\.intg-detail-title\s*\{[^}]*color:\s*#0F172A/);
            expect(cssContent).toMatch(/\.intg-detail-status-connected\s*\{[^}]*background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\)/);
            expect(cssContent).toMatch(/\.intg-detail-status-connected\s*\{[^}]*color:\s*#16A34A/);
        });

        it("renders sync status and Pause / Resume integration actions with mutation handlers", () => {
            expect(integrationDetailCode).toContain("Last synced");
            expect(integrationDetailCode).toContain("Pause Integration");
            expect(integrationDetailCode).toContain("Resume Integration");
            expect(integrationDetailCode).toContain("handlePauseResume");
            expect(integrationDetailCode).toContain("handleDisconnect");
        });
    });

    describe("3. Four KPI Summary Cards (Figma Frame 2147225138)", () => {
        it("defines a 4-column grid on desktop with consistent 8px gap", () => {
            expect(cssContent).toContain(".razorpay-kpi-grid");
            expect(cssContent).toMatch(/\.razorpay-kpi-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
            expect(cssContent).toMatch(/\.razorpay-kpi-grid\s*\{[^}]*gap:\s*8px/);
        });

        it("styles each KPI card with 120px height, 20px padding, frosted surface and 6px radius", () => {
            expect(cssContent).toContain(".razorpay-kpi-card");
            expect(cssContent).toMatch(/\.razorpay-kpi-card\s*\{[^}]*height:\s*120px/);
            expect(cssContent).toMatch(/\.razorpay-kpi-card\s*\{[^}]*padding:\s*20px/);
            expect(cssContent).toMatch(/\.razorpay-kpi-card\s*\{[^}]*border-radius:\s*6px/);
            expect(cssContent).toMatch(/\.razorpay-kpi-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
        });

        it("renders all four KPI categories: Account Received, Amount Due, Total Pending, Failed Payments", () => {
            expect(paymentDashboardCode).toContain("Account Received");
            expect(paymentDashboardCode).toContain("Amount Due");
            expect(paymentDashboardCode).toContain("Total Pending");
            expect(paymentDashboardCode).toContain("Failed Payments");
            expect(cssContent).toMatch(/\.razorpay-kpi-label\s*\{[^}]*font-size:\s*14px/);
            expect(cssContent).toMatch(/\.razorpay-kpi-label\s*\{[^}]*color:\s*#64748B/);
            expect(cssContent).toMatch(/\.razorpay-kpi-value\s*\{[^}]*font-size:\s*24px/);
            expect(cssContent).toMatch(/\.razorpay-kpi-value\s*\{[^}]*color:\s*#0F172A/);
        });

        it("renders dynamic period-over-period comparison trends with vs last month subtitle", () => {
            expect(paymentDashboardCode).toContain("vs last month");
            expect(paymentDashboardCode).toContain("renderDelta");
            expect(cssContent).toContain(".razorpay-kpi-delta.trend-green");
            expect(cssContent).toContain(".razorpay-kpi-delta.trend-amber");
            expect(cssContent).toContain(".razorpay-kpi-delta.trend-blue");
            expect(cssContent).toContain(".razorpay-kpi-delta.trend-red");
        });
    });

    describe("4. Analytics Row: Payment Overview & Payment by Status (Figma Frame 2147224997)", () => {
        it("defines 2-column analytics row container with 8px gap and minmax ratio matching Figma", () => {
            expect(cssContent).toContain(".razorpay-analytics-row");
            expect(cssContent).toMatch(/\.razorpay-analytics-row\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*2\.14fr\)\s*minmax\(0,\s*1fr\)/);
            expect(cssContent).toMatch(/\.razorpay-analytics-row\s*\{[^}]*gap:\s*8px/);
        });

        it("styles both chart cards with frosted surface, 20px padding, and 335px minimum height", () => {
            expect(cssContent).toContain(".razorpay-chart-card");
            expect(cssContent).toMatch(/\.razorpay-chart-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
            expect(cssContent).toMatch(/\.razorpay-chart-card\s*\{[^}]*border-radius:\s*6px/);
            expect(cssContent).toMatch(/\.razorpay-chart-card\s*\{[^}]*min-height:\s*335px/);
            expect(cssContent).toMatch(/\.razorpay-chart-card\s*\{[^}]*padding:\s*20px/);
        });

        it("renders working date filter dropdown in Payment Overview (Frame 2147225103)", () => {
            expect(paymentBarChartCode).toContain("Payment Overview");
            expect(paymentBarChartCode).toContain("PERIOD_OPTIONS");
            expect(paymentBarChartCode).toContain("This Week");
            expect(paymentBarChartCode).toContain("This Month");
            expect(paymentBarChartCode).toContain("Last 6 Months");
            expect(paymentBarChartCode).toContain("This Year");
            expect(cssContent).toMatch(/\.razorpay-dropdown-btn\s*\{[^}]*border:\s*1px\s*solid\s*#E2E8F0/);
            expect(cssContent).toMatch(/\.razorpay-dropdown-btn\s*\{[^}]*border-radius:\s*8px/);
        });

        it("renders chart legend matching Figma swatch colors: Green #16A34A, Amber #FAB000, Blue #2563EB", () => {
            expect(paymentBarChartCode).toContain("Amount Received");
            expect(paymentBarChartCode).toContain("Amount Due");
            expect(paymentBarChartCode).toContain("Total Pending");
            expect(cssContent).toMatch(/\.swatch-green\s*\{[^}]*background:\s*#16A34A/);
            expect(cssContent).toMatch(/\.swatch-amber\s*\{[^}]*background:\s*#FAB000/);
            expect(cssContent).toMatch(/\.swatch-blue\s*\{[^}]*background:\s*#2563EB/);
        });

        it("renders dynamic multi-bar chart with Y-axis scale, #E7E7E7 grid lines, and grouped bars", () => {
            expect(paymentBarChartCode).toContain("razorpay-y-axis");
            expect(paymentBarChartCode).toContain("razorpay-grid-lines");
            expect(paymentBarChartCode).toContain("razorpay-bar-group");
            expect(paymentBarChartCode).toContain("bar-green");
            expect(paymentBarChartCode).toContain("bar-amber");
            expect(paymentBarChartCode).toContain("bar-blue");
            expect(cssContent).toMatch(/\.razorpay-grid-line\s*\{[^}]*background:\s*#E7E7E7/);
            expect(cssContent).toMatch(/\.razorpay-bar\s*\{[^}]*border-radius:\s*2px\s*2px\s*0\s*0/);
        });

        it("renders SVG Donut chart for Payment by Status with dynamic arc computation and center count (Frame 98 & 2147225436)", () => {
            expect(paymentStatusDonutCode).toContain("Payment by Status");
            expect(paymentStatusDonutCode).toContain("razorpay-donut-svg");
            expect(paymentStatusDonutCode).toContain("razorpay-donut-center");
            expect(paymentStatusDonutCode).toContain("razorpay-donut-count");
            expect(paymentStatusDonutCode).toContain("Transactions");
            expect(cssContent).toMatch(/\.razorpay-donut-count\s*\{[^}]*font-size:\s*16px/);
            expect(cssContent).toMatch(/\.razorpay-donut-count\s*\{[^}]*color:\s*#0F172A/);
        });

        it("renders Payment by Status legend with Successful #24A967, Pending #FD9536, and Failed #DC2626 counts and percentages (Frame 92)", () => {
            expect(paymentStatusDonutCode).toContain("Successful");
            expect(paymentStatusDonutCode).toContain("Pending");
            expect(paymentStatusDonutCode).toContain("Failed");
            expect(cssContent).toMatch(/\.dot-successful\s*\{[^}]*background:\s*#24A967/);
            expect(cssContent).toMatch(/\.dot-pending\s*\{[^}]*background:\s*#FD9536/);
            expect(cssContent).toMatch(/\.dot-failed\s*\{[^}]*background:\s*#DC2626/);
        });
    });

    describe("5. Recent Transactions Table Panel (Figma Frame 2147225140)", () => {
        it("renders Recent Transactions header with View All Transactions link to /invoices", () => {
            expect(transactionsTableCode).toContain("Recent Transactions");
            expect(transactionsTableCode).toContain("View All Transactions");
            expect(transactionsTableCode).toContain('href="/invoices"');
            expect(cssContent).toMatch(/\.razorpay-view-all-link\s*\{[^}]*color:\s*#2563EB/);
        });

        it("renders table header matching Figma Frame 57 with #E4ECFB background, 36px height, and uppercase titles", () => {
            expect(transactionsTableCode).toContain("th-id");
            expect(transactionsTableCode).toContain("th-project");
            expect(transactionsTableCode).toContain("th-boq");
            expect(transactionsTableCode).toContain("th-invoice");
            expect(transactionsTableCode).toContain("th-amount");
            expect(transactionsTableCode).toContain("th-client");
            expect(transactionsTableCode).toContain("th-method");
            expect(transactionsTableCode).toContain("th-timestamp");
            expect(transactionsTableCode).toContain("th-status");
            expect(cssContent).toMatch(/\.razorpay-table thead tr\s*\{[^}]*background:\s*#E4ECFB/);
            expect(cssContent).toMatch(/\.razorpay-table thead tr\s*\{[^}]*height:\s*36px/);
            expect(cssContent).toMatch(/\.razorpay-table th\s*\{[^}]*text-transform:\s*uppercase/);
            expect(cssContent).toMatch(/\.razorpay-table th\s*\{[^}]*color:\s*#64748B/);
        });

        it("renders table rows with 56px height and #EBEBEB divider", () => {
            expect(cssContent).toMatch(/\.razorpay-table-row\s*\{[^}]*height:\s*56px/);
            expect(cssContent).toMatch(/\.razorpay-table-row\s*\{[^}]*border-bottom:\s*1px\s*solid\s*#EBEBEB/);
        });

        it("renders Method badges (Card, UPI, Net Banking, Wallet) with dedicated Figma color themes", () => {
            expect(transactionsTableCode).toContain("methodLabels");
            expect(transactionsTableCode).toContain("method-card");
            expect(transactionsTableCode).toContain("method-upi");
            expect(transactionsTableCode).toContain("method-netbanking");
            expect(transactionsTableCode).toContain("method-wallet");
            expect(cssContent).toMatch(/\.method-card\s*\{[^}]*color:\s*#2563EB/);
            expect(cssContent).toMatch(/\.method-upi\s*\{[^}]*color:\s*#533AFD/);
            expect(cssContent).toMatch(/\.method-netbanking\s*\{[^}]*color:\s*#D97706/);
            expect(cssContent).toMatch(/\.method-wallet\s*\{[^}]*color:\s*#16A34A/);
        });

        it("renders Status chips (SUCCESS, PENDING, FAILED) matching Figma badges", () => {
            expect(transactionsTableCode).toContain("chip-successful");
            expect(transactionsTableCode).toContain("chip-pending");
            expect(transactionsTableCode).toContain("chip-failed");
            expect(cssContent).toMatch(/\.chip-successful\s*\{[^}]*color:\s*#16A34A/);
            expect(cssContent).toMatch(/\.chip-pending\s*\{[^}]*color:\s*#D97706/);
            expect(cssContent).toMatch(/\.chip-failed\s*\{[^}]*color:\s*#DC2626/);
        });

        it("renders 2-line timestamp with 14px 500 date and 12px 400 time", () => {
            expect(transactionsTableCode).toContain("timestamp-stack");
            expect(transactionsTableCode).toContain("timestamp-date");
            expect(transactionsTableCode).toContain("timestamp-time");
            expect(cssContent).toMatch(/\.timestamp-date\s*\{[^}]*color:\s*#0F172A/);
            expect(cssContent).toMatch(/\.timestamp-time\s*\{[^}]*color:\s*#64748B/);
        });

        it("integrates Pagination with Total Transactions label and items per page selector", () => {
            expect(transactionsTableCode).toContain('totalLabel="Total Transactions"');
            expect(transactionsTableCode).toContain("<Pagination");
        });
    });

    describe("6. Backend Integration & Dynamic Data Contract", () => {
        it("verifies backend paymentAnalytics endpoint accepts period parameter and computes time buckets", () => {
            expect(routeApiCode).toContain('async function paymentAnalytics');
            expect(routeApiCode).toContain('period = request?.nextUrl?.searchParams?.get("period") || "week"');
            expect(routeApiCode).toContain('statusBreakdown');
            expect(routeApiCode).toContain('paymentOverview');
        });

        it("verifies PaymentDashboard triggers loadSummary and loadAnalytics dynamically", () => {
            expect(paymentDashboardCode).toContain("integrationsApi.paymentSummary");
            expect(paymentDashboardCode).toContain("integrationsApi.paymentAnalytics");
            expect(paymentDashboardCode).toContain("loadAnalytics(period)");
        });

        it("verifies TransactionsTable queries backend transactions API with page and pageSize", () => {
            expect(transactionsTableCode).toContain("integrationsApi.transactions");
            expect(transactionsTableCode).toContain("{ page, pageSize }");
        });
    });

    describe("7. Responsive Design", () => {
        it("collapses KPI grid to 2 columns and analytics row to 1 column at <= 1100px", () => {
            expect(cssContent).toContain("@media (max-width: 1100px)");
            expect(cssContent).toMatch(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.razorpay-kpi-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
            expect(cssContent).toMatch(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.razorpay-analytics-row\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
        });

        it("collapses KPI grid to 1 column at <= 600px", () => {
            expect(cssContent).toContain("@media (max-width: 600px)");
            expect(cssContent).toMatch(/@media\s*\(max-width:\s*600px\)[\s\S]*?\.razorpay-kpi-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
        });
    });
});
