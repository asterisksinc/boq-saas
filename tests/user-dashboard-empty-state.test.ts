import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("User Dashboard Figma Empty State & Architecture", () => {
    const pagePath = join(process.cwd(), "app", "dashboard", "page.tsx");
    const headerPath = join(process.cwd(), "components", "DashboardHeader.tsx");
    const railPath = join(process.cwd(), "components", "DashboardRail.tsx");
    const cssPath = join(process.cwd(), "app", "globals.css");

    it("verifies User Dashboard files exist", () => {
        expect(existsSync(pagePath)).toBe(true);
        expect(existsSync(headerPath)).toBe(true);
        expect(existsSync(railPath)).toBe(true);
        expect(existsSync(cssPath)).toBe(true);
    });

    it("verifies Urbanist font import in globals.css", () => {
        const cssContent = readFileSync(cssPath, "utf-8");
        expect(cssContent).toContain("family=Urbanist");
        expect(cssContent).toContain("--fig-ink: #0f172a;");
        expect(cssContent).toContain("--fig-muted: #64748b;");
    });

    it("verifies DashboardRail matches Figma navigation specifications", () => {
        const railContent = readFileSync(railPath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        // Rail structure
        expect(railContent).toContain("fig-dashboard-rail");
        expect(railContent).toContain("fig-dashboard-logo");
        expect(railContent).toContain("fig-dashboard-menu");
        expect(railContent).toContain("fig-dashboard-tools");

        // Dimensions in CSS
        expect(cssContent).toContain(".fig-dashboard-rail {");
        expect(cssContent).toContain("width: 66px;");
        expect(cssContent).toContain(".fig-dashboard-logo {");
        expect(cssContent).toContain("height: 66px;");
        expect(cssContent).toContain(".fig-dashboard-tools {");
        expect(cssContent).toContain("height: 120px;");
    });

    it("verifies DashboardHeader matches Figma top toolbar specifications", () => {
        const headerContent = readFileSync(headerPath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        // Header height & title typography (Frame 76)
        expect(cssContent).toContain(".fig-dashboard-header {");
        expect(cssContent).toContain("height: 66px;");
        expect(cssContent).toContain(".fig-dashboard-header h1 {");
        expect(cssContent).toContain("font-size: 18px;");

        // Search container (Frame 76 + Frame 70)
        expect(headerContent).toContain("fig-dashboard-search");
        expect(cssContent).toContain(".fig-dashboard-search {");
        expect(cssContent).toContain("width: 260px;");
        expect(cssContent).toContain("height: 46px;");
        expect(cssContent).toContain("backdrop-filter: blur(20.4px);");
        expect(cssContent).toContain(".fig-dashboard-search img {");
        expect(cssContent).toContain("width: 36px;");
        expect(cssContent).toContain("height: 36px;");

        // New split action button (Frame 2147224972)
        expect(headerContent).toContain("fig-dashboard-new-main");
        expect(headerContent).toContain("fig-dashboard-new-chevron");
        expect(cssContent).toContain(".fig-dashboard-new {");
        expect(cssContent).toContain("width: 130px;");
        expect(cssContent).toContain("height: 46px;");
        expect(cssContent).toContain("width: 83px;");
        expect(cssContent).toContain("width: 46px;");

        // Bell & Avatar (46x46 controls)
        expect(cssContent).toContain(".fig-dashboard-bell,");
        expect(cssContent).toContain(".fig-dashboard-avatar {");
        expect(cssContent).toContain("width: 46px;");
        expect(cssContent).toContain("height: 46px;");
    });

    it("verifies Analytics panel supports both Figma empty state and populated state", () => {
        const pageContent = readFileSync(pagePath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        // Empty state components and text
        expect(pageContent).toContain("AnalyticsEmptyIllustration");
        expect(pageContent).toContain("fig-analytics-empty-status");
        expect(pageContent).toContain("No data to display yet");
        expect(pageContent).toContain("fig-chart-control-empty");
        expect(pageContent).toContain("fig-time-tabs");
        expect(pageContent).toContain("No analytics data yet");
        expect(pageContent).toContain("Once you create projects, your analytics and insights will appear here.");

        // Empty state CSS layout matching Frame 93
        expect(cssContent).toContain(".fig-analytics {");
        expect(cssContent).toContain("height: 471px;");
        expect(cssContent).toContain(".fig-analytics-empty-status {");
        expect(cssContent).toContain("height: 54px;");
        expect(cssContent).toContain(".fig-time-tabs {");
        expect(cssContent).toContain(".fig-legend-hidden {");
        expect(cssContent).toContain("opacity: 0;");
        expect(cssContent).toContain(".fig-empty-analytics {");
        expect(cssContent).toContain("height: 224px;");

        // Empty illustration matching Frame 2147225441
        expect(cssContent).toContain(".fig-analytics-illustration {");
        expect(cssContent).toContain(".fig-ambient-pill");
        expect(cssContent).toContain(".fig-illustration-card {");
        expect(cssContent).toContain(".fig-illustration-badge {");
        expect(cssContent).toContain(".fig-illustration-svg {");

        // Populated state preserved
        expect(pageContent).toContain("fig-metrics");
        expect(pageContent).toContain("DynamicChart");
    });

    it("verifies Projects & BOQ empty state and populated state logic", () => {
        const pageContent = readFileSync(pagePath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        // Empty state content
        expect(pageContent).toContain("No projects or BOQ yet");
        expect(pageContent).toContain("Create your first project or BOQ to see the overview here.");

        // Card styling matching Frame 2147225000
        expect(cssContent).toContain(".fig-projects-card {");
        expect(cssContent).toContain("height: 299px;");
        expect(cssContent).toContain(".fig-empty-card .fig-empty-icon-wrap {");
        expect(cssContent).toContain("width: 32px;");
        expect(cssContent).toContain("height: 32px;");

        // Populated state preserved
        expect(pageContent).toContain("fig-project-legend");
        expect(pageContent).toContain("fig-project-recent");
    });

    it("verifies BOQ summary panel empty state and arrow opacity logic", () => {
        const pageContent = readFileSync(pagePath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        // Empty state content
        expect(pageContent).toContain("No BOQ available");
        expect(pageContent).toContain("You haven't created any BOQs yet.");
        expect(pageContent).toContain('fig-boq-arrows ${hasContent ? "" : "is-empty"}');

        // Card styling matching Frame 95
        expect(cssContent).toContain(".fig-boq-card {");
        expect(cssContent).toContain("height: 145.5px;");
        expect(cssContent).toContain(".fig-boq-arrows.is-empty {");
        expect(cssContent).toContain("opacity: 0;");
    });

    it("verifies Quick Actions panel includes all 4 functional tiles", () => {
        const pageContent = readFileSync(pagePath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        // 4 actions
        expect(pageContent).toContain('label: "Create BOQ"');
        expect(pageContent).toContain('path: "/boqs"');
        expect(pageContent).toContain('label: "Import Excel"');
        expect(pageContent).toContain('label: "Invite Team"');
        expect(pageContent).toContain('path: "/settings?tab=security"');
        expect(pageContent).toContain('label: "Generate Rep."');
        expect(pageContent).toContain('path: "/analytics"');

        // Layout matching Frame 100 & Frame 2147225017
        expect(cssContent).toContain(".fig-quick-actions {");
        expect(cssContent).toContain("height: 145.5px;");
        expect(cssContent).toContain(".fig-quick-actions button {");
        expect(cssContent).toContain("height: 72.5px;");
        expect(cssContent).toContain("background: rgba(37, 99, 235, 0.12);");
    });

    it("verifies Right-Side Decorative Panel features all 4 blurred ellipses including purple glow", () => {
        const pageContent = readFileSync(pagePath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        // Markup includes span, i, b, em
        expect(pageContent).toContain('<aside className="fig-dashboard-art" aria-hidden="true"><span /><i /><b /><em /></aside>');

        // Art panel dimensions matching Frame 78
        expect(cssContent).toContain(".fig-dashboard-art {");
        expect(cssContent).toContain("min-height: 778px;");
        expect(cssContent).toContain("height: 778px;");

        // Ellipse 14 purple glow
        expect(cssContent).toContain(".fig-dashboard-art em {");
        expect(cssContent).toContain("width: 172px;");
        expect(cssContent).toContain("height: 172px;");
        expect(cssContent).toContain("background: #a855f7;");
        expect(cssContent).toContain("filter: blur(100px);");
    });

    it("verifies scope isolation: does not modify Client or Admin dashboards", () => {
        const clientRailPath = join(process.cwd(), "components", "client", "ClientDashboardRail.tsx");
        const adminPagePath = join(process.cwd(), "app", "admin", "page.tsx");

        expect(existsSync(clientRailPath)).toBe(true);
        expect(existsSync(adminPagePath)).toBe(true);

        const clientRail = readFileSync(clientRailPath, "utf-8");
        const adminPage = readFileSync(adminPagePath, "utf-8");

        // Client rail is isolated to client navigation
        expect(clientRail).toContain("/client/boq");
        expect(clientRail).not.toContain('route: "/dashboard"');
        expect(clientRail).not.toContain('route: "/projects"');
        expect(clientRail).not.toContain('route: "/costs"');

        // Admin page is isolated to AdminUI
        expect(adminPage).toContain("AdminOverviewPage");
    });

    it("verifies Issue 1: KPI summary row is hidden when there is no analytics data and does not depend on draft BOQs", () => {
        const pageContent = readFileSync(pagePath, "utf-8");

        // hasAnalytics must NOT check hasBoqs (draft BOQs belong only to the BOQ card)
        expect(pageContent).not.toMatch(/hasAnalytics\s*=\s*overview\s*\?\s*\(\s*hasProjects\s*\|\|\s*hasBoqs/);

        // hasAnalytics must check actual project existence, series, or non-zero financial metrics
        expect(pageContent).toContain("overview.kpis.totalProjects > 0");
        expect(pageContent).toContain("overview.costOverview?.series");

        // KPI row (.fig-metrics) is only rendered when hasContent is true
        expect(pageContent).toContain('{hasContent ? (');
        expect(pageContent).toContain('<div className="fig-metrics">');

        // When hasContent is false, empty status is rendered without reserved KPI card space
        expect(pageContent).toContain('<div className="fig-analytics-empty-status">');
    });

    it("verifies Issue 2: Actual / Estimated legend is hidden in empty state and conditional on chart data", () => {
        const pageContent = readFileSync(pagePath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        // Empty state uses fig-legend-hidden with aria-hidden
        expect(pageContent).toContain('<div className="fig-legend-hidden" aria-hidden="true">');
        expect(cssContent).toContain(".fig-legend-hidden {");
        expect(cssContent).toContain("opacity: 0;");
        expect(cssContent).toContain("visibility: hidden;");

        // Populated state legend is conditional on chartData
        expect(pageContent).toContain("{chartData ? (");
        expect(pageContent).toContain('<div className="fig-legend" aria-label="Chart legend">');
    });

    it("verifies Issue 3: Week, Month, Quarter controls have proper spacing, underline, and functional API query", () => {
        const pageContent = readFileSync(pagePath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");
        const authPath = join(process.cwd(), "lib", "api", "auth.ts");
        const authContent = readFileSync(authPath, "utf-8");
        const routePath = join(process.cwd(), "app", "api", "v1", "[...path]", "route.ts");
        const routeContent = readFileSync(routePath, "utf-8");

        // Controls are wrapped in fig-time-tabs with gap
        expect(cssContent).toContain(".fig-time-tabs {");
        expect(cssContent).toContain("gap: 16px;");

        // Active state and underline
        expect(cssContent).toContain(".fig-time-tabs button.active");
        expect(cssContent).toContain("color: #0f172a;");
        expect(cssContent).toContain(".fig-time-tabs button.active .tab-underline {");
        expect(cssContent).toContain("opacity: 1;");

        // Hover and focus-visible states
        expect(cssContent).toContain(".fig-time-tabs button:hover,");
        expect(cssContent).toContain(".fig-time-tabs button:focus-visible,");

        // Month active by default
        expect(pageContent).toContain('const [activePeriod, setActivePeriod] = useState<DashboardPeriod>("month");');

        // Functional period switching wired to API query
        expect(pageContent).toContain("handlePeriodChange");
        expect(pageContent).toContain("getDashboardOverview(period)");

        // Client API accepts period
        expect(authContent).toContain("export async function getDashboardOverview(period?: string)");
        expect(authContent).toContain('?period=${encodeURIComponent(period)}');

        // Backend route handles period query parameter
        expect(routeContent).toContain('request.nextUrl.searchParams.get("period")');
        expect(routeContent).toContain('period === "week"');
        expect(routeContent).toContain('period === "month"');
        expect(routeContent).toContain('period === "quarter"');
    });
});
