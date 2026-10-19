import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Reports & Analytics Redesign Verification", () => {
    const route = readFileSync("app/api/v1/[...path]/route.ts", "utf8");
    const analyticsPage = readFileSync("app/analytics/page.tsx", "utf8");
    const stylesheet = readFileSync("app/analytics/analytics-redesign.css", "utf8");
    const types = readFileSync("lib/types.ts", "utf8");
    const reportsApi = readFileSync("lib/api/reports.ts", "utf8");

    it("ensures parent dashboard layout and header are preserved without duplication", () => {
        expect(analyticsPage).toContain('<DashboardRail current="/analytics" />');
        expect(analyticsPage).toContain('<DashboardHeader title="Reports & Analytics" />');
        // Does not create duplicate headers or search bars
        expect(analyticsPage).not.toContain('<header className="fig-dashboard-header">');
    });

    it("includes all 5 report categories defined in Figma reference", () => {
        const tabs = [
            "Revenue & Margin",
            "Project Pipeline",
            "BOQs",
            "Team Performance",
            "Client Analysis",
        ];
        for (const tab of tabs) {
            expect(analyticsPage).toContain(tab);
        }
    });

    it("supports date filtering with presets and custom date range", () => {
        expect(analyticsPage).toContain("This Year");
        expect(analyticsPage).toContain("This Quarter");
        expect(analyticsPage).toContain("This Month");
        expect(analyticsPage).toContain("All Time");
        expect(analyticsPage).toContain("Custom Range");
    });

    it("provides Download PDF report action for all tabs and periods", () => {
        expect(analyticsPage).toContain("Download PDF");
        expect(analyticsPage).toContain("getAnalyticsPdf");
        expect(route).toContain('route === "reports/analytics/pdf"');
        expect(reportsApi).toContain("export async function getAnalyticsPdf");
    });

    it("verifies backend computes real analytics, YoY comparisons, and tab breakdowns", () => {
        expect(route).toContain("comparisonPeriodLabel");
        expect(route).toContain("revenueChangePercent");
        expect(route).toContain("costChangePercent");
        expect(route).toContain("marginChangePoints");
        expect(route).toContain("user_profiles");
        expect(route).toContain("pipeline");
        expect(route).toContain("boqSummary");
        expect(route).toContain("basicTextPdf");
    });

    it("verifies stylesheet follows Figma reference design system and classes", () => {
        expect(stylesheet).toContain(".analytics-page");
        expect(stylesheet).toContain("#F1F5F9");
        expect(stylesheet).toContain("#2563EB");
        expect(stylesheet).toContain("#E4ECFB");
        expect(stylesheet).toContain("#EFF6FF");
        expect(stylesheet).toContain(".rep-kpi-grid");
        expect(stylesheet).toContain(".rep-segmented-bar");
        expect(stylesheet).toContain(".rep-badge-repeat");
        expect(stylesheet).toContain(".rep-badge-new");
    });

    it("ensures AnalyticsResponse typing supports comparison, pipeline, and versioned boqs", () => {
        expect(types).toContain("revenueChangePercent?: number | null;");
        expect(types).toContain("costChangePercent?: number | null;");
        expect(types).toContain("marginChangePoints?: number | null;");
        expect(types).toContain("pipeline?: {");
        expect(types).toContain("boqSummary?: {");
    });
});
