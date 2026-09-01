import { describe, expect, it } from "vitest";
import { dashboardPeriod, demoDashboard, demoRecentBoqs, demoRecentProjects } from "../lib/domain/dashboard-demo";
import { readFileSync } from "node:fs";

describe("temporary dashboard demo backend", () => {
  it("supports week, month, and quarter chart periods with month as default", () => {
    expect(dashboardPeriod("week")).toBe("week");
    expect(dashboardPeriod("quarter")).toBe("quarter");
    expect(dashboardPeriod("invalid")).toBe("month");
    expect(demoDashboard("week", "INR").analytics?.series).toHaveLength(7);
    expect(demoDashboard("month", "INR").analytics?.series).toHaveLength(6);
    expect(demoDashboard("quarter", "INR").analytics?.series).toHaveLength(4);
  });

  it("marks every temporary response and supplies populated widgets", () => {
    const dashboard = demoDashboard("month", "INR");
    expect(dashboard.dataSource).toBe("hardcoded_demo");
    expect(dashboard.demoData).toBe(true);
    expect(dashboard.kpis.totalProjects).toBeGreaterThan(0);
    expect(dashboard.highlightedBoq.status).toBe("overdue");
    expect(demoRecentProjects.length).toBeGreaterThan(0);
    expect(demoRecentBoqs.length).toBeGreaterThan(0);
    expect(dashboard.unavailableSections).toEqual([]);
  });

  it("continues hiding demo financial values without financial permission", () => {
    const dashboard = demoDashboard("month", "INR", false);
    expect(dashboard.kpis.totalEstimatedValue).toBeNull();
    expect(dashboard.analytics).toBeNull();
    expect(dashboard.projectsAndBoqs.totalBoqValue).toBeNull();
  });

  it("keeps explicit replacement comments at both backend integration points", () => {
    const demoSource = readFileSync("lib/domain/dashboard-demo.ts", "utf8");
    const route = readFileSync("app/api/v1/[...path]/route.ts", "utf8");
    expect(demoSource).toContain("TODO(PROJECT_BOQ_BACKEND)");
    expect(route.match(/TODO\(PROJECT_BOQ_BACKEND\)/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
