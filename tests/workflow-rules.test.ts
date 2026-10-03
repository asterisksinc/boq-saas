import { describe, expect, it } from "vitest";
import {
  DEFAULT_WORKFLOW_RULES,
  calculateCategoryCounts,
  calculateRuleKpis,
  formatActionSummary,
  formatConditionExpression,
  formatLivePreview,
  normalizeRule,
  simulateRule,
  WorkflowRule,
} from "../lib/templates/rules-domain";

describe("Workflow Rules Domain & Evaluation", () => {
  it("normalizes legacy or minimal rule objects safely", () => {
    const raw = {
      id: "test-1",
      name: "Minimal Rule",
      trigger: "Project Created",
      action: "Send Notification",
    };
    const normalized = normalizeRule(raw, 0);

    expect(normalized.id).toBe("test-1");
    expect(normalized.code).toBe("RUL-001");
    expect(normalized.category).toBe("Project");
    expect(normalized.status).toBe("ACTIVE");
    expect(normalized.priority).toBe("Medium");
    expect(normalized.actions.length).toBe(1);
    expect(normalized.conditions.conditions.length).toBe(0);
  });

  it("calculates accurate KPI metrics from rules list", () => {
    const rules: WorkflowRule[] = [
      {
        id: "1",
        code: "RUL-001",
        name: "Active Approval",
        description: "",
        category: "Approvals",
        trigger: { event: "Stage Completed", evaluate: "Immediately", frequency: "once_per_event", timing: "Immediately" },
        conditions: { conjunction: "ALL", conditions: [] },
        actions: [{ id: "a1", type: "requestApproval", title: "Request Approval", target: "Finance", badge: "Finance Approval" }],
        status: "ACTIVE",
        priority: "Critical",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-02",
      },
      {
        id: "2",
        code: "RUL-002",
        name: "Draft Project Rule",
        description: "",
        category: "Project",
        trigger: { event: "Project Created", evaluate: "Immediately", frequency: "once_per_event", timing: "Immediately" },
        conditions: { conjunction: "ALL", conditions: [] },
        actions: [{ id: "a2", type: "sendNotification", title: "Email Client", target: "Client", badge: "Notification" }],
        status: "DRAFT",
        priority: "High",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-02",
      },
      {
        id: "3",
        code: "RUL-003",
        name: "Active Task Alert",
        description: "",
        category: "Tasks",
        trigger: { event: "Task Overdue", evaluate: "After Delay", frequency: "once_per_event", timing: "After 2 Hours" },
        conditions: { conjunction: "ALL", conditions: [] },
        actions: [{ id: "a3", type: "createTask", title: "Flag High Risk", target: "Admin", badge: "Task" }],
        status: "ACTIVE",
        priority: "Medium",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-02",
      },
    ];

    const kpis = calculateRuleKpis(rules);
    expect(kpis.total).toBe(3);
    expect(kpis.active).toBe(2);
    expect(kpis.approvalTriggers).toBe(1);
    expect(kpis.draft).toBe(1);
  });

  it("calculates category breakdown accurately", () => {
    const categories = calculateCategoryCounts(DEFAULT_WORKFLOW_RULES);
    expect(categories["All Rules"]).toBe(DEFAULT_WORKFLOW_RULES.length);
    expect(categories["Project"]).toBeGreaterThanOrEqual(1);
    expect(categories["Costing"]).toBeGreaterThanOrEqual(1);
    expect(categories["Milestones"]).toBeGreaterThanOrEqual(1);
    expect(categories["Documents"]).toBeGreaterThanOrEqual(1);
  });

  it("formats conditions, actions, and live previews correctly", () => {
    const rule = DEFAULT_WORKFLOW_RULES[0]; // High Value Project Approval
    const condStr = formatConditionExpression(rule.conditions);
    expect(condStr).toContain("Estimated Project Value > ₹10,00,000");

    const actionSummary = formatActionSummary(rule.actions);
    expect(actionSummary.primary).toBe("Request Approval");
    expect(actionSummary.moreCount).toBe(3);
    expect(actionSummary.badge).toBe("Finance Approval");

    const preview = formatLivePreview(rule);
    expect(preview.when).toContain("Project is created");
    expect(preview.ifText).toContain("Estimated Project Value > ₹10,00,000");
    expect(preview.thenList.length).toBe(4);
  });

  it("simulates rule condition evaluation with pass and fail results", () => {
    const rule = DEFAULT_WORKFLOW_RULES[0]; // estimatedProjectValue > 1000000 AND projectType == Residential

    // Test Passing Scenario
    const passResult = simulateRule(rule, {
      estimatedProjectValue: 1500000,
      projectType: "Residential",
      clientType: "Enterprise",
      projectRegion: "Hyderabad",
    });

    expect(passResult.matched).toBe(true);
    expect(passResult.executedActions.length).toBe(4);
    expect(passResult.conditionResults.every((t) => t.passed)).toBe(true);

    // Test Failing Scenario (Value too low)
    const failResult = simulateRule(rule, {
      estimatedProjectValue: 500000,
      projectType: "Commercial",
      clientType: "Retail",
      projectRegion: "Bangalore",
    });

    expect(failResult.matched).toBe(false);
    expect(failResult.executedActions.length).toBe(0);
    expect(failResult.conditionResults.some((t) => !t.passed)).toBe(true);
  });
});
