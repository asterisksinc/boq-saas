export type DashboardPeriod = "week" | "month" | "quarter";

// TODO(PROJECT_BOQ_BACKEND): Replace every value in this file with scoped
// aggregates from Projects, BOQs, Costing, Approvals, and Deliverables tables.
// Authentication, workspace context, permissions, and notifications remain real.

const charts: Record<DashboardPeriod, Array<{ label: string; estimated: number; actual: number }>> = {
  week: [
    { label: "Mon", estimated: 3200000, actual: 3000000 },
    { label: "Tue", estimated: 3800000, actual: 3500000 },
    { label: "Wed", estimated: 4400000, actual: 4100000 },
    { label: "Thu", estimated: 4600000, actual: 4300000 },
    { label: "Fri", estimated: 3900000, actual: 3700000 },
    { label: "Sat", estimated: 4300000, actual: 4000000 },
    { label: "Sun", estimated: 5100000, actual: 4700000 },
  ],
  month: [
    { label: "Mar", estimated: 3800000, actual: 3500000 },
    { label: "Apr", estimated: 5200000, actual: 4700000 },
    { label: "May", estimated: 5900000, actual: 5400000 },
    { label: "Jun", estimated: 4400000, actual: 4200000 },
    { label: "Jul", estimated: 5200000, actual: 4800000 },
    { label: "Aug", estimated: 7600000, actual: 6900000 },
  ],
  quarter: [
    { label: "Q1", estimated: 11800000, actual: 10900000 },
    { label: "Q2", estimated: 15300000, actual: 14100000 },
    { label: "Q3", estimated: 17600000, actual: 15800000 },
    { label: "Q4", estimated: 20100000, actual: 18200000 },
  ],
};

export const demoRecentProjects = [
  { id: "00000000-0000-4000-8000-000000000201", name: "Kohinoor Office - L4", clientName: "Kohinoor Group", status: "in_progress", location: "Mumbai", updatedAt: "2026-08-31T10:30:00Z" },
  { id: "00000000-0000-4000-8000-000000000202", name: "Oberoi Residence - Bandra", clientName: "Nikhil Oberoi", status: "planning", location: "Bandra", updatedAt: "2026-08-30T08:15:00Z" },
  { id: "00000000-0000-4000-8000-000000000203", name: "Westin Hotels - Suites", clientName: "Westin Hospitality", status: "in_progress", location: "Pune", updatedAt: "2026-08-28T12:00:00Z" },
];

export const demoRecentBoqs = [
  { id: "00000000-0000-4000-8000-000000000301", boqCode: "BOQ-0089", title: "Kohinoor Office BOQ", projectName: "Kohinoor Office - L4", status: "overdue", value: 1840000, currency: "INR", dueDate: "2026-08-21", updatedAt: "2026-08-31T09:00:00Z" },
  { id: "00000000-0000-4000-8000-000000000302", boqCode: "BOQ-0088", title: "Residence Interior BOQ", projectName: "Oberoi Residence - Bandra", status: "draft", value: 4250000, currency: "INR", dueDate: "2026-09-08", updatedAt: "2026-08-30T11:00:00Z" },
  { id: "00000000-0000-4000-8000-000000000303", boqCode: "BOQ-0087", title: "Suite Renovation BOQ", projectName: "Westin Hotels - Suites", status: "approved", value: 980000, currency: "INR", dueDate: "2026-09-15", updatedAt: "2026-08-27T15:45:00Z" },
];

export const demoPendingActions = [
  { id: "00000000-0000-4000-8000-000000000401", title: "Approve Kohinoor Office BOQ", priority: "high", targetType: "boq", targetId: demoRecentBoqs[0].id, dueDate: "2026-09-02" },
  { id: "00000000-0000-4000-8000-000000000402", title: "Review Oberoi proposal revision", priority: "normal", targetType: "proposal", targetId: "00000000-0000-4000-8000-000000000101", dueDate: "2026-09-04" },
];

export const demoUpcomingDeliverables = [
  { id: "00000000-0000-4000-8000-000000000501", title: "Kohinoor design package", projectName: "Kohinoor Office - L4", status: "in_progress", dueDate: "2026-09-05" },
  { id: "00000000-0000-4000-8000-000000000502", title: "Oberoi material schedule", projectName: "Oberoi Residence - Bandra", status: "not_started", dueDate: "2026-09-10" },
];

export function demoDashboard(period: DashboardPeriod, currency: string, canViewFinancials = true) {
  return {
    dataSource: "hardcoded_demo" as const,
    demoData: true,
    period,
    kpis: {
      totalProjects: 48,
      activeProjects: 12,
      draftBoqs: 9,
      pendingApprovals: 4,
      totalEstimatedValue: canViewFinancials ? 24_000_000 : null,
      actualCost: canViewFinancials ? 18_240_000 : null,
      grossMargin: canViewFinancials ? 5_760_000 : null,
      grossMarginPercent: canViewFinancials ? 24 : null,
    },
    analytics: canViewFinancials ? { currency, series: charts[period] } : null,
    costOverview: canViewFinancials ? { currency, series: charts[period] } : null,
    projectsAndBoqs: {
      projects: { total: 48, inProgress: 18, planning: 10, onHold: 6, completed: 14 },
      totalBoqValue: canViewFinancials ? 12_300_000 : null,
      boqCompletionPercent: 83,
    },
    highlightedBoq: demoRecentBoqs[0],
    boqActivity: [
      { id: "00000000-0000-4000-8000-000000000601", action: "revised", boqId: demoRecentBoqs[0].id, title: demoRecentBoqs[0].title, occurredAt: "2026-08-31T09:00:00Z" },
      { id: "00000000-0000-4000-8000-000000000602", action: "approved", boqId: demoRecentBoqs[2].id, title: demoRecentBoqs[2].title, occurredAt: "2026-08-27T15:45:00Z" },
    ],
    recentProjects: demoRecentProjects,
    recentBoqs: demoRecentBoqs,
    pendingActions: demoPendingActions,
    upcomingDeliverables: demoUpcomingDeliverables,
    demoSections: ["kpis", "analytics", "projectsAndBoqs", "highlightedBoq", "boqActivity", "recentProjects", "recentBoqs", "pendingActions", "upcomingDeliverables"],
    unavailableSections: [],
  };
}

export function dashboardPeriod(value: string | null): DashboardPeriod {
  return value === "week" || value === "quarter" ? value : "month";
}
