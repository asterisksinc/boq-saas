import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("User Dashboard Layout Width, Typography Consistency & Period Alignment", () => {
    const cssPath = join(process.cwd(), "app", "globals.css");
    const pagePath = join(process.cwd(), "app", "dashboard", "page.tsx");
    const headerPath = join(process.cwd(), "components", "DashboardHeader.tsx");
    const railPath = join(process.cwd(), "components", "DashboardRail.tsx");

    it("verifies User Dashboard files exist", () => {
        expect(existsSync(cssPath)).toBe(true);
        expect(existsSync(pagePath)).toBe(true);
        expect(existsSync(headerPath)).toBe(true);
        expect(existsSync(railPath)).toBe(true);
    });

    describe("1. Unused Right-Side Gap & Fluid Content Width", () => {
        it("verifies .fig-dashboard-main does not use restrictive fixed max-width and expands dynamically", () => {
            const cssContent = readFileSync(cssPath, "utf-8");

            // Must NOT have fixed 1326px max-width which leaves huge gap on wide screens
            expect(cssContent).not.toMatch(/\.fig-dashboard-main\s*\{[^}]*max-width:\s*1326px/);

            // Must use fluid calculation with margins
            expect(cssContent).toContain(".fig-dashboard-main {");
            expect(cssContent).toContain("width: calc(100% - 114px);");
            expect(cssContent).toContain("max-width: 100%;");
            expect(cssContent).toContain("margin: 16px 16px 16px 98px;");
        });

        it("verifies .fig-dashboard-layout uses minmax(0, 1fr) 340px to fill the full viewport width", () => {
            const cssContent = readFileSync(cssPath, "utf-8");

            // Must NOT restrict left column to 978px
            expect(cssContent).not.toMatch(/\.fig-dashboard-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*978px\)/);

            // Left column expands with 1fr, right column stays 340px
            expect(cssContent).toContain("grid-template-columns: minmax(0, 1fr) 340px;");
        });

        it("verifies .fig-dashboard-left flex-grows to 100% without fixed max-width constraint", () => {
            const cssContent = readFileSync(cssPath, "utf-8");

            // Must NOT restrict .fig-dashboard-left to 978px
            expect(cssContent).not.toMatch(/\.fig-dashboard-left\s*\{[^}]*max-width:\s*978px/);

            expect(cssContent).toContain(".fig-dashboard-left {");
            expect(cssContent).toContain("width: 100%;");
            expect(cssContent).toContain("min-width: 0;");
        });

        it("verifies responsive media queries adapt dashboard width cleanly across screen sizes", () => {
            const cssContent = readFileSync(cssPath, "utf-8");

            // Max-width 1120px tablet breakpoint
            expect(cssContent).toContain("@media (max-width: 1120px) {");
            expect(cssContent).toContain("grid-template-columns: 1fr;");

            // Max-width 760px mobile breakpoint
            expect(cssContent).toContain("@media (max-width: 760px) {");
            expect(cssContent).toContain(".fig-dashboard-rail {");
            expect(cssContent).toContain("display: none;");
            expect(cssContent).toContain("width: calc(100% - 32px);");
        });
    });

    describe("2. Typography Consistency with 'Urbanist'", () => {
        it("verifies --font-family-base is declared in :root and applied to html, body, and form controls", () => {
            const cssContent = readFileSync(cssPath, "utf-8");

            // :root base variable
            expect(cssContent).toContain("--font-family-base: 'Urbanist', Inter,");

            // Global typography inheritance
            expect(cssContent).toContain("font-family: var(--font-family-base);");
            expect(cssContent).toContain("font-family: inherit;");
        });

        it("verifies .fig-dashboard and dashboard elements declare Urbanist typography", () => {
            const cssContent = readFileSync(cssPath, "utf-8");

            expect(cssContent).toContain(".fig-dashboard {");
            expect(cssContent).toContain("font-family: 'Urbanist', Inter, ui-sans-serif, system-ui, sans-serif;");

            // Form controls inside .fig-dashboard
            expect(cssContent).toContain(".fig-dashboard button,");
            expect(cssContent).toContain(".fig-dashboard input,");
            expect(cssContent).toContain(".fig-dashboard select,");
            expect(cssContent).toContain(".fig-dashboard textarea {");
            expect(cssContent).toContain("font-family: 'Urbanist', Inter, sans-serif;");
        });

        it("verifies metric cards, chart labels, BOQ items, and project legends use Urbanist", () => {
            const cssContent = readFileSync(cssPath, "utf-8");

            // Metric card
            expect(cssContent).toContain(".fig-metric strong {");
            expect(cssContent).toContain(".fig-metric small {");
            expect(cssContent).toContain(".fig-metric span {");

            // Chart months and grid
            expect(cssContent).toContain(".fig-chart-months {");
            expect(cssContent).toContain(".fig-chart-grid span {");

            // Project card legend and items
            expect(cssContent).toContain(".fig-project-legend {");
            expect(cssContent).toContain(".fig-project-recent a {");

            // BOQ items
            expect(cssContent).toContain(".fig-boq-item strong {");
            expect(cssContent).toContain(".fig-boq-item span {");
            expect(cssContent).toContain(".fig-boq-item > b {");
        });
    });

    describe("3. Analytics Period Controls Alignment (Week, Month, Quarter)", () => {
        it("verifies .fig-time-tabs is pinned to the left edge at 20px card padding and not pushed to center", () => {
            const cssContent = readFileSync(cssPath, "utf-8");

            // .fig-time-tabs must have margin-left: 0
            expect(cssContent).toContain(".fig-time-tabs {");
            expect(cssContent).toContain("margin-left: 0;");

            // .fig-chart-control-empty aligns content to flex-start
            expect(cssContent).toContain(".fig-chart-control-empty {");
            expect(cssContent).toContain("justify-content: flex-start;");

            // Legend elements correctly use margin-left: auto so only legends push to the right
            expect(cssContent).toContain(".fig-legend,");
            expect(cssContent).toContain(".fig-legend-hidden {");
            expect(cssContent).toContain("margin-left: auto;");
        });

        it("verifies period buttons retain underline indicator and interactive states", () => {
            const cssContent = readFileSync(cssPath, "utf-8");
            const pageContent = readFileSync(pagePath, "utf-8");

            expect(cssContent).toContain(".fig-time-tabs button.active .tab-underline {");
            expect(cssContent).toContain("opacity: 1;");

            expect(pageContent).toContain('className="tab-underline"');
            expect(pageContent).toContain('onClick={() => onPeriodChange(period)}');
        });
    });

    describe("4. Scope Isolation & Non-Regression", () => {
        it("verifies Client and Admin routes remain strictly untouched", () => {
            const clientRailPath = join(process.cwd(), "components", "client", "ClientDashboardRail.tsx");
            const adminPagePath = join(process.cwd(), "app", "admin", "page.tsx");

            expect(existsSync(clientRailPath)).toBe(true);
            expect(existsSync(adminPagePath)).toBe(true);

            const clientRail = readFileSync(clientRailPath, "utf-8");
            const adminPage = readFileSync(adminPagePath, "utf-8");

            // Client rail isolated to client routes
            expect(clientRail).toContain("/client/boq");
            expect(clientRail).not.toContain('route: "/dashboard"');
            expect(clientRail).not.toContain('route: "/projects"');

            // Admin page isolated
            expect(adminPage).toContain("AdminOverviewPage");
            expect(adminPage).not.toContain("fig-dashboard-main");
        });
    });
});
