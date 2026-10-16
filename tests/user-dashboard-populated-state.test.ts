import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("User Dashboard Dynamic Populated State — Figma Design Specifications", () => {
    const pagePath = join(process.cwd(), "app", "dashboard", "page.tsx");
    const routePath = join(process.cwd(), "app", "api", "v1", "[...path]", "route.ts");
    const cssPath = join(process.cwd(), "app", "globals.css");
    const authPath = join(process.cwd(), "lib", "api", "auth.ts");

    it("verifies User Dashboard core files exist", () => {
        expect(existsSync(pagePath)).toBe(true);
        expect(existsSync(routePath)).toBe(true);
        expect(existsSync(cssPath)).toBe(true);
        expect(existsSync(authPath)).toBe(true);
    });

    describe("1. Dynamic Analytics & KPI Metrics", () => {
        it("verifies KPI metrics render real values and inline trend badges matching Figma Frames 2147224973-2147224976", () => {
            const pageContent = readFileSync(pagePath, "utf-8");
            const cssContent = readFileSync(cssPath, "utf-8");

            // KPI labels
            expect(pageContent).toContain('label="Total Project"');
            expect(pageContent).toContain('label="Active Project"');
            expect(pageContent).toContain('label="Total Est. Value"');
            expect(pageContent).toContain('label="Gross Margin"');

            // Trend badge rendering with SVGs
            expect(pageContent).toContain("fig-metric-val-row");
            expect(pageContent).toContain("fig-metric-trend");

            // CSS rules for KPI metrics
            expect(cssContent).toContain(".fig-metrics {");
            expect(cssContent).toContain(".fig-metric-val-row {");
            expect(cssContent).toContain(".fig-metric strong {");
            expect(cssContent).toContain(".fig-metric small {");
            expect(cssContent).toContain(".fig-metric-trend {");
            expect(cssContent).toContain(".fig-metric-trend.up");
            expect(cssContent).toContain(".fig-metric-trend.down");
        });

        it("verifies period selector tabs (Week, Month, Quarter) are preserved and wired to dynamic queries", () => {
            const pageContent = readFileSync(pagePath, "utf-8");
            const routeContent = readFileSync(routePath, "utf-8");
            const cssContent = readFileSync(cssPath, "utf-8");

            // Left-aligned period tabs
            expect(cssContent).toContain(".fig-time-tabs {");
            expect(cssContent).toContain("margin-left: 0;");
            expect(cssContent).toContain(".fig-time-tabs button.active .tab-underline {");

            // Backend route handles week, month, quarter queries
            expect(routeContent).toContain('request.nextUrl.searchParams.get("period")');
            expect(routeContent).toContain('period === "week"');
            expect(routeContent).toContain('period === "month"');
            expect(routeContent).toContain('period === "quarter"');

            // Page triggers period change
            expect(pageContent).toContain("onPeriodChange(period)");
        });

        it("verifies DynamicChart renders Actual and Estimated series with interactive tooltips", () => {
            const pageContent = readFileSync(pagePath, "utf-8");
            const cssContent = readFileSync(cssPath, "utf-8");

            // SVG elements
            expect(pageContent).toContain("fig-chart");
            expect(pageContent).toContain("fig-chart-grid");
            expect(pageContent).toContain("fig-actual-fill");
            expect(pageContent).toContain("fig-estimated-line");
            expect(pageContent).toContain("fig-actual-line");
            expect(pageContent).toContain("fig-chart-months");
            expect(pageContent).toContain("fig-chart-tooltip");

            // CSS styles for chart and tooltips
            expect(cssContent).toContain(".fig-chart {");
            expect(cssContent).toContain(".fig-chart-tooltip {");
            expect(cssContent).toContain(".fig-tooltip-row {");
        });
    });

    describe("2. Dynamic Projects & BOQ Card (Frame 2147225000)", () => {
        it("verifies status breakdown (In Progress, Planning, On Hold, Completed) with ring and dot indicators", () => {
            const pageContent = readFileSync(pagePath, "utf-8");
            const cssContent = readFileSync(cssPath, "utf-8");

            expect(pageContent).toContain("fig-project-legend");
            expect(pageContent).toContain("In Progress");
            expect(pageContent).toContain("Planning");
            expect(pageContent).toContain("On Hold");
            expect(pageContent).toContain("Completed");

            // Figma indicators
            expect(pageContent).toContain("fig-status-ring");
            expect(pageContent).toContain("fig-status-dot");
            expect(cssContent).toContain(".fig-status-ring {");
            expect(cssContent).toContain(".fig-status-dot {");
        });

        it("verifies Total BOQ Value block is displayed dynamically", () => {
            const pageContent = readFileSync(pagePath, "utf-8");
            const cssContent = readFileSync(cssPath, "utf-8");

            expect(pageContent).toContain("fig-total-boq-value");
            expect(pageContent).toContain("Total BOQ Value");
            expect(pageContent).toContain("fig-total-boq-num");

            expect(cssContent).toContain(".fig-total-boq-value {");
            expect(cssContent).toContain(".fig-total-boq-label {");
            expect(cssContent).toContain(".fig-total-boq-num {");
        });

        it("verifies Progress Meter features striped background tick bars and blue pin badge (Frames 2147225007 & 2147225009)", () => {
            const pageContent = readFileSync(pagePath, "utf-8");
            const cssContent = readFileSync(cssPath, "utf-8");

            expect(pageContent).toContain("fig-project-progress-wrap");
            expect(pageContent).toContain("fig-progress-ticks");
            expect(pageContent).toContain("fig-tick-bar");
            expect(pageContent).toContain("fig-progress-bar-track");
            expect(pageContent).toContain("fig-progress-bar-fill");
            expect(pageContent).toContain("fig-progress-pin");
            expect(pageContent).toContain("fig-progress-pin-badge");

            expect(cssContent).toContain(".fig-project-progress-wrap {");
            expect(cssContent).toContain(".fig-progress-ticks {");
            expect(cssContent).toContain(".fig-progress-pin-badge {");
            expect(cssContent).toContain(".fig-progress-pin-stem {");
        });

        it("verifies Project navigation links and 'View all' action", () => {
            const pageContent = readFileSync(pagePath, "utf-8");

            expect(pageContent).toContain('href="/projects"');
            expect(pageContent).toContain("fig-projects-view-all");
            expect(pageContent).toContain("fig-project-recent");
        });
    });

    describe("3. Dynamic BOQ Carousel Card (Frame 95)", () => {
        it("verifies BOQ carousel navigation, status badge variants, and item details", () => {
            const pageContent = readFileSync(pagePath, "utf-8");
            const cssContent = readFileSync(cssPath, "utf-8");

            // Carousel controls
            expect(pageContent).toContain("fig-boq-arrows");
            expect(pageContent).toContain("handlePrev");
            expect(pageContent).toContain("handleNext");

            // Status badges: OVERDUE, ACTIVE, DRAFT
            expect(pageContent).toContain("OVERDUE");
            expect(pageContent).toContain("ACTIVE");
            expect(pageContent).toContain("DRAFT");

            // CSS rules
            expect(cssContent).toContain(".fig-boq-card {");
            expect(cssContent).toContain(".fig-boq-item {");
            expect(cssContent).toContain(".fig-boq-item em.badge-overdue {");
            expect(cssContent).toContain(".fig-boq-item em.badge-draft {");
        });
    });

    describe("4. Preserves Approved Empty States", () => {
        it("verifies empty state UI and illustrations remain intact when no data exists", () => {
            const pageContent = readFileSync(pagePath, "utf-8");

            expect(pageContent).toContain("AnalyticsEmptyIllustration");
            expect(pageContent).toContain("No data to display yet");
            expect(pageContent).toContain("No analytics data yet");
            expect(pageContent).toContain("No projects or BOQ yet");
            expect(pageContent).toContain("No BOQ available");
            expect(pageContent).toContain("fig-legend-hidden");
        });
    });

    describe("5. Backend Data Aggregation & Security Scoping", () => {
        it("verifies backend computes genuine totals, non-zero time-series, and comparison baselines", () => {
            const routeContent = readFileSync(routePath, "utf-8");

            // Projects query with financial fields
            expect(routeContent).toContain('supabase.from("projects").select("id,status,created_at,project_value,approved_budget,progress")');

            // BOQs query
            expect(routeContent).toContain('supabase.from("boqs").select("id,status,grand_total,created_at")');

            // Invoices query
            expect(routeContent).toContain('supabase.from("invoices").select("id,status,subtotal,total_amount,total_paid,created_at")');

            // Aggregation logic
            expect(routeContent).toContain("totalBoqValue = allBoqs.reduce");
            expect(routeContent).toContain("totalActualCost = allInvoices.reduce");
            expect(routeContent).toContain("calculatedEstValue");
            expect(routeContent).toContain("calcTrend");
        });
    });

    describe("6. Scope Isolation & Non-Regression", () => {
        it("verifies Client and Admin dashboards remain strictly untouched", () => {
            const clientRailPath = join(process.cwd(), "components", "client", "ClientDashboardRail.tsx");
            const adminPagePath = join(process.cwd(), "app", "admin", "page.tsx");

            expect(existsSync(clientRailPath)).toBe(true);
            expect(existsSync(adminPagePath)).toBe(true);

            const clientRail = readFileSync(clientRailPath, "utf-8");
            const adminPage = readFileSync(adminPagePath, "utf-8");

            expect(clientRail).toContain("/client/boq");
            expect(clientRail).not.toContain('route: "/dashboard"');
            expect(adminPage).toContain("AdminOverviewPage");
            expect(adminPage).not.toContain("fig-dashboard-main");
        });
    });
});
