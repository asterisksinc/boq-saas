export type RuleCategory =
  | "All Rules"
  | "Project"
  | "Tasks"
  | "Milestones"
  | "Approvals"
  | "Costing"
  | "Documents"
  | "Clients";

export type RulePriority = "Critical" | "High" | "Medium" | "Low";

export type RuleStatus = "ACTIVE" | "DRAFT" | "INACTIVE";

export type TriggerFrequency = "once_per_event" | "once_per_project" | "every_time_met";

export interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string | number;
}

export interface RuleConditionGroup {
  id: string;
  conjunction: "ALL" | "ANY";
  conditions: RuleCondition[];
  groups?: RuleConditionGroup[];
}

export interface RuleAction {
  id: string;
  type: "requestApproval" | "sendNotification" | "createTask" | "changeStatus" | "blockActivation" | "custom";
  title: string;
  target?: string;
  badge?: string;
  badgeColor?: string;
  config?: Record<string, any>;
}

export interface RuleException {
  id: string;
  type: string;
  value: string;
  description?: string;
}

export interface WorkflowRule {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: "Commercial" | "Project" | "Tasks" | "Milestones" | "Approvals" | "Costing" | "Documents" | "Clients";
  priority: RulePriority;
  status: RuleStatus;
  version?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  owner?: string;
  allowOverride?: boolean;
  overridePolicy?: string;

  trigger: {
    event: string;
    evaluate: string;
    frequency: TriggerFrequency;
    timing?: string;
  };

  conditions: {
    conjunction: "ALL" | "ANY";
    conditions: RuleCondition[];
    groups?: RuleConditionGroup[];
    summary?: string;
  };

  actions: RuleAction[];

  approval?: {
    flowName?: string;
    flowCode?: string;
    version?: string;
    stepsCount?: number;
    mode?: "sequential" | "parallel";
    slaDays?: number;
  };

  exceptions?: RuleException[];

  // Execution tracking stats
  executedCount?: number;
  lastTriggered?: string;
  createdBy?: string;
  createdDate?: string;
  createdAt?: string;
  lastUpdated?: string;
  lastUpdatedBy?: string;
  updatedAt?: string;
}

export interface SimulationResult {
  matched: boolean;
  summary: string;
  conditionResults: {
    field: string;
    operator: string;
    expected: any;
    actual: any;
    passed: boolean;
  }[];
  executedActions: RuleAction[];
}

// ── Default realistic rules (matching reference designs) ─────────────────

export const DEFAULT_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: "rul-018",
    code: "RUL-018",
    name: "High Value Project Approval",
    description: "Automatically require financial approval for projects whose estimated value exceeds the defined commercial threshold.",
    category: "Project",
    priority: "Critical",
    status: "ACTIVE",
    version: "v2.1",
    effectiveFrom: "2026-08-18",
    owner: "Admin User",
    allowOverride: true,
    trigger: {
      event: "Project Created",
      evaluate: "Immediately",
      frequency: "once_per_event",
      timing: "Immediately",
    },
    conditions: {
      conjunction: "ALL",
      conditions: [
        { id: "c1", field: "estimatedProjectValue", operator: "is greater than", value: 1000000 },
        { id: "c2", field: "projectType", operator: "equals", value: "Residential" },
      ],
      groups: [
        {
          id: "g1",
          conjunction: "ALL",
          conditions: [
            { id: "c3", field: "clientType", operator: "equals", value: "Enterprise" },
            { id: "c4", field: "projectRegion", operator: "equals", value: "Hyderabad" },
          ],
        },
      ],
      summary: "(Estimated Project Value > ₹10,00,000 AND Project Type = Residential) OR (Client Type = Enterprise AND Project Region = Hyderabad)",
    },
    actions: [
      { id: "a1", type: "requestApproval", title: "Request Approval", target: "High Value Project Approval", badge: "Finance Approval" },
      { id: "a2", type: "sendNotification", title: "Send Notification", target: "Project Manager", badge: "Notification" },
      { id: "a3", type: "createTask", title: "Create Task", target: "Commercial Review Task", badge: "Task" },
      { id: "a4", type: "changeStatus", title: "Change Project Status", target: "Awaiting Approval", badge: "Status" },
    ],
    approval: {
      flowName: "Finance Approval",
      flowCode: "APR-TPL-002",
      version: "v2.2",
      stepsCount: 2,
      mode: "sequential",
      slaDays: 2,
    },
    executedCount: 12,
    lastTriggered: "18 Aug · 12:39 AM",
    createdBy: "Admin User",
    createdDate: "04 Aug 2026",
    lastUpdated: "12 Aug 2026",
    lastUpdatedBy: "Admin User",
  },
  {
    id: "rul-023",
    code: "RUL-023",
    name: "Low Margin Alert",
    description: "Triggers notifications and requires finance approval whenever estimated margins fall below commercial threshold.",
    category: "Costing",
    priority: "High",
    status: "ACTIVE",
    version: "v1.4",
    effectiveFrom: "2026-08-10",
    owner: "Finance Lead",
    allowOverride: false,
    trigger: {
      event: "Margin Changed",
      evaluate: "Every Time",
      frequency: "every_time_met",
      timing: "Every Time",
    },
    conditions: {
      conjunction: "ALL",
      conditions: [
        { id: "c21", field: "marginPercent", operator: "is less than", value: 15 },
      ],
      summary: "Margin Percent < 15%",
    },
    actions: [
      { id: "a21", type: "requestApproval", title: "Request Approval", target: "Finance Approval", badge: "Finance Approval" },
      { id: "a22", type: "sendNotification", title: "Send Notification", target: "Costing Lead", badge: "Notification" },
    ],
    approval: {
      flowName: "Finance Approval",
      flowCode: "APR-TPL-002",
      version: "v2.0",
      stepsCount: 2,
      mode: "sequential",
      slaDays: 1,
    },
    executedCount: 8,
    lastTriggered: "15 Aug · 03:15 PM",
    createdBy: "Admin User",
    createdDate: "06 Aug 2026",
    lastUpdated: "10 Aug 2026",
    lastUpdatedBy: "Finance Lead",
  },
  {
    id: "rul-012",
    code: "RUL-012",
    name: "Design Complete → Start to Production",
    description: "Automatically creates execution tasks and routes commercial approval when design milestone sign-off is achieved.",
    category: "Milestones",
    priority: "Critical",
    status: "ACTIVE",
    version: "v1.8",
    effectiveFrom: "2026-07-28",
    owner: "Design Lead",
    allowOverride: true,
    trigger: {
      event: "Milestone Completed",
      evaluate: "Immediately",
      frequency: "once_per_event",
      timing: "Design Approval",
    },
    conditions: {
      conjunction: "ALL",
      conditions: [
        { id: "c31", field: "milestoneName", operator: "equals", value: "Design Approval" },
      ],
      summary: "Milestone = 'Design Approval' Completed",
    },
    actions: [
      { id: "a31", type: "createTask", title: "Create Tasks", target: "Production Kickoff Checklist", badge: "Task" },
      { id: "a32", type: "requestApproval", title: "Commercial Approval", target: "Commercial Review", badge: "Commercial Approval" },
    ],
    approval: {
      flowName: "Commercial Approval",
      flowCode: "APR-TPL-001",
      version: "v1.5",
      stepsCount: 3,
      mode: "sequential",
      slaDays: 2,
    },
    executedCount: 19,
    lastTriggered: "17 Aug · 11:20 AM",
    createdBy: "Pradhyumn D",
    createdDate: "20 Jul 2026",
    lastUpdated: "05 Aug 2026",
    lastUpdatedBy: "Design Lead",
  },
  {
    id: "rul-032",
    code: "RUL-032",
    name: "Contract Signed → Activate Project",
    description: "Transitions project status from planning to active upon verified client agreement signing.",
    category: "Documents",
    priority: "Medium",
    status: "ACTIVE",
    version: "v1.2",
    effectiveFrom: "2026-08-01",
    owner: "Account Lead",
    allowOverride: false,
    trigger: {
      event: "Document Signed",
      evaluate: "Immediately",
      frequency: "once_per_event",
      timing: "Contract",
    },
    conditions: {
      conjunction: "ALL",
      conditions: [
        { id: "c41", field: "documentSigned", operator: "equals", value: "Contract" },
      ],
      summary: "Document Signed = 'Contract'",
    },
    actions: [
      { id: "a41", type: "changeStatus", title: "Change Project Status", target: "Active", badge: "Status" },
      { id: "a42", type: "sendNotification", title: "Send Notification", target: "Site Team", badge: "Notification" },
    ],
    executedCount: 14,
    lastTriggered: "16 Aug · 04:45 PM",
    createdBy: "Admin User",
    createdDate: "01 Aug 2026",
    lastUpdated: "08 Aug 2026",
    lastUpdatedBy: "Account Lead",
  },
  {
    id: "rul-011",
    code: "RUL-011",
    name: "Budget Over-run Warning",
    description: "Alerts management and site supervisor when actual costs exceed 110% of planned BOQ.",
    category: "Costing",
    priority: "Medium",
    status: "DRAFT",
    version: "v1.0",
    effectiveFrom: "2026-08-15",
    owner: "Estimator",
    allowOverride: true,
    trigger: {
      event: "Budget Changed",
      evaluate: "When > 110%",
      frequency: "every_time_met",
      timing: "> 110%",
    },
    conditions: {
      conjunction: "ALL",
      conditions: [
        { id: "c51", field: "budgetVariance", operator: "is greater than", value: 10 },
      ],
      summary: "Budget Variance > 10%",
    },
    actions: [
      { id: "a51", type: "sendNotification", title: "Send Notification", target: "Project Manager & Estimator", badge: "Notification" },
      { id: "a52", type: "createTask", title: "Budget Audit Task", target: "Variance Reconciliation", badge: "Task" },
    ],
    executedCount: 0,
    lastTriggered: "—",
    createdBy: "Estimator",
    createdDate: "12 Aug 2026",
    lastUpdated: "15 Aug 2026",
    lastUpdatedBy: "Estimator",
  },
  {
    id: "rul-008",
    code: "RUL-008",
    name: "Missing Documents Block",
    description: "Prevents project activation if required statutory or layout documents have not been uploaded.",
    category: "Documents",
    priority: "High",
    status: "ACTIVE",
    version: "v2.0",
    effectiveFrom: "2026-07-15",
    owner: "Operations Lead",
    allowOverride: false,
    trigger: {
      event: "Before Project Activation",
      evaluate: "Immediately",
      frequency: "once_per_event",
      timing: "Immediately",
    },
    conditions: {
      conjunction: "ALL",
      conditions: [
        { id: "c61", field: "documentSigned", operator: "equals", value: "Site Photos" },
      ],
      summary: "Required Mandatory Documents Missing",
    },
    actions: [
      { id: "a61", type: "blockActivation", title: "Block Activation", target: "Commercial Block", badge: "Commercial Approval" },
      { id: "a62", type: "sendNotification", title: "Send Notification", target: "Design Lead", badge: "Notification" },
      { id: "a63", type: "createTask", title: "Upload Mandatory Documents", target: "Compliance Team", badge: "Task" },
    ],
    approval: {
      flowName: "Commercial Approval",
      flowCode: "APR-TPL-001",
      version: "v1.2",
      stepsCount: 2,
      mode: "sequential",
      slaDays: 1,
    },
    executedCount: 6,
    lastTriggered: "14 Aug · 09:12 AM",
    createdBy: "Admin User",
    createdDate: "15 Jul 2026",
    lastUpdated: "02 Aug 2026",
    lastUpdatedBy: "Operations Lead",
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────

export const RULE_CATEGORIES: RuleCategory[] = [
  "All Rules",
  "Project",
  "Tasks",
  "Milestones",
  "Approvals",
  "Costing",
  "Documents",
  "Clients",
];

export const SUPPORTED_FIELDS: { key: string; label: string; type: "currency" | "number" | "select" | "text"; options?: string[] }[] = [
  { key: "estimatedProjectValue", label: "Estimated Project Value", type: "currency" },
  { key: "projectType", label: "Project Type", type: "select", options: ["Residential", "Commercial", "Villa", "Retail", "Hospitality"] },
  { key: "clientType", label: "Client Type", type: "select", options: ["Enterprise", "Individual", "Corporate", "Government"] },
  { key: "projectRegion", label: "Project Region", type: "select", options: ["Hyderabad", "Bangalore", "Mumbai", "Delhi NCR", "Chennai", "Pune"] },
  { key: "marginPercent", label: "Margin Percent (%)", type: "number" },
  { key: "budgetVariance", label: "Budget Variance (%)", type: "number" },
  { key: "documentSigned", label: "Document Signed", type: "select", options: ["Contract", "Client Proposal", "Work Order", "Site Photos"] },
  { key: "milestoneName", label: "Milestone Completed", type: "select", options: ["Design Approval", "Concept Design", "BOQ Finalisation", "Site Measurement", "Client Approval"] },
  { key: "taskStatus", label: "Task Status", type: "select", options: ["Completed", "In Progress", "Blocked"] },
];

export const SUPPORTED_OPERATORS = [
  { key: "is greater than", label: "is greater than", symbol: ">" },
  { key: "is less than", label: "is less than", symbol: "<" },
  { key: "equals", label: "equals", symbol: "=" },
  { key: "does not equal", label: "does not equal", symbol: "!=" },
  { key: "is greater than or equal", label: "is greater than or equal to", symbol: ">=" },
  { key: "is less than or equal", label: "is less than or equal to", symbol: "<=" },
  { key: "contains", label: "contains", symbol: "contains" },
];

export const TRIGGER_EVENTS = [
  "Project Created",
  "Margin Changed",
  "Milestone Completed",
  "Document Signed",
  "Budget Changed",
  "Before Project Activation",
  "Task Completed",
  "Stage Changed",
];

export const EVALUATION_OPTIONS = [
  "Immediately",
  "Every Time",
  "On Schedule",
  "After Delay",
  "When > 110%",
];

export function normalizeRule(raw: any, index: number = 0): WorkflowRule {
  if (!raw) return DEFAULT_WORKFLOW_RULES[0];

  const id = raw.id || `rul-${Date.now()}-${index}`;
  const code = raw.code || `RUL-${String(index + 1).padStart(3, "0")}`;
  const name = raw.name || "Untitled Rule";

  // Normalize trigger
  let triggerObj = {
    event: "Project Created",
    evaluate: "Immediately",
    frequency: "once_per_event" as TriggerFrequency,
    timing: "Immediately",
  };
  if (typeof raw.trigger === "string") {
    triggerObj.event = raw.trigger;
    triggerObj.timing = raw.triggerTiming || "Immediately";
  } else if (raw.trigger && typeof raw.trigger === "object") {
    triggerObj = {
      event: raw.trigger.event || "Project Created",
      evaluate: raw.trigger.evaluate || "Immediately",
      frequency: raw.trigger.frequency || "once_per_event",
      timing: raw.trigger.timing || raw.trigger.evaluate || "Immediately",
    };
  }

  // Normalize category
  let category = raw.category || raw.stage || "Project";
  if (!["Project", "Tasks", "Milestones", "Approvals", "Costing", "Documents", "Clients"].includes(category)) {
    if (category.toLowerCase().includes("cost")) category = "Costing";
    else if (category.toLowerCase().includes("task")) category = "Tasks";
    else if (category.toLowerCase().includes("milestone")) category = "Milestones";
    else if (category.toLowerCase().includes("appr")) category = "Approvals";
    else if (category.toLowerCase().includes("doc")) category = "Documents";
    else if (category.toLowerCase().includes("client")) category = "Clients";
    else category = "Project";
  }

  // Normalize priority
  let priority: RulePriority = "Medium";
  const rawPri = String(raw.priority || "").toLowerCase();
  if (rawPri.includes("crit")) priority = "Critical";
  else if (rawPri.includes("high")) priority = "High";
  else if (rawPri.includes("low")) priority = "Low";
  else priority = "Medium";

  // Normalize status
  let status: RuleStatus = "ACTIVE";
  const rawStatus = String(raw.status || "").toUpperCase();
  if (rawStatus === "DRAFT") status = "DRAFT";
  else if (rawStatus === "INACTIVE") status = "INACTIVE";
  else status = "ACTIVE";

  // Normalize conditions
  let conditionsObj: WorkflowRule["conditions"] = {
    conjunction: "ALL",
    conditions: [],
    groups: [],
    summary: "",
  };

  if (raw.conditions && typeof raw.conditions === "object") {
    if (Array.isArray(raw.conditions.all)) {
      conditionsObj.conjunction = "ALL";
      conditionsObj.conditions = raw.conditions.all.map((c: any, ci: number) => ({
        id: c.id || `c-${ci}`,
        field: c.field || "estimatedProjectValue",
        operator: c.operator === "greaterThan" ? "is greater than" : c.operator === "lessThan" ? "is less than" : c.operator || "equals",
        value: c.value ?? "",
      }));
    } else if (Array.isArray(raw.conditions.conditions)) {
      conditionsObj.conjunction = raw.conditions.conjunction || "ALL";
      conditionsObj.conditions = raw.conditions.conditions;
      conditionsObj.groups = raw.conditions.groups || [];
    }
  } else if (typeof raw.condition === "string") {
    conditionsObj.summary = raw.condition;
    conditionsObj.conditions = [
      { id: "c1", field: "Rule Condition", operator: "matches", value: raw.condition },
    ];
  }

  // Normalize actions
  let actionsArr: RuleAction[] = [];
  if (Array.isArray(raw.actions) && raw.actions.length > 0) {
    actionsArr = raw.actions.map((a: any, ai: number) => {
      if (typeof a === "string") {
        return {
          id: `a-${ai}`,
          type: "custom",
          title: a,
          target: a,
          badge: a.includes("Approval") ? "Finance Approval" : "Action",
        };
      }
      const actionType = a.type || "custom";
      let title = a.title || "Action";
      let badge = a.badge || "Action";
      let target = a.target || a.approvalCode || a.role || "";

      if (actionType === "requestApproval") {
        title = "Request Approval";
        badge = "Finance Approval";
      } else if (actionType === "sendNotification") {
        title = "Send Notification";
        badge = "Notification";
      } else if (actionType === "createTask") {
        title = "Create Task";
        badge = "Task";
      } else if (actionType === "changeStatus") {
        title = "Change Project Status";
        badge = "Status";
      } else if (actionType === "blockActivation") {
        title = "Block Activation";
        badge = "Commercial Approval";
      }

      return {
        id: a.id || `a-${ai}`,
        type: actionType,
        title,
        target,
        badge,
        config: a.config || {},
      };
    });
  } else if (typeof raw.action === "string") {
    actionsArr = [
      {
        id: "a-0",
        type: raw.action.includes("Approval") ? "requestApproval" : "custom",
        title: raw.action,
        target: raw.action,
        badge: raw.action.includes("Approval") ? "Finance Approval" : "Action",
      },
    ];
  }

  // Summary calculation
  const summary = conditionsObj.summary || formatConditionExpression(conditionsObj);

  return {
    id,
    code,
    name,
    description: raw.description || `Rule ${code}: ${name}`,
    category: category as any,
    priority,
    status,
    version: raw.version || "v1.0",
    effectiveFrom: raw.effectiveFrom || "2026-08-01",
    effectiveUntil: raw.effectiveUntil || undefined,
    owner: raw.owner || "Admin User",
    allowOverride: raw.allowOverride ?? true,
    overridePolicy: raw.overridePolicy || undefined,
    trigger: triggerObj,
    conditions: {
      ...conditionsObj,
      summary,
    },
    actions: actionsArr,
    approval: raw.approval || {
      flowName: actionsArr.find((a) => a.type === "requestApproval")?.badge || "Finance Approval",
      flowCode: "APR-TPL-002",
      version: "v2.0",
      stepsCount: 2,
      mode: "sequential",
      slaDays: 2,
    },
    exceptions: raw.exceptions || [],
    executedCount: raw.executedCount ?? (status === "ACTIVE" ? 12 : 0),
    lastTriggered: raw.lastTriggered || (status === "ACTIVE" ? "18 Aug · 12:39 AM" : "—"),
    createdBy: raw.createdBy || "Admin User",
    createdDate: raw.createdDate || "04 Aug 2026",
    lastUpdated: raw.lastUpdated || "12 Aug 2026",
    lastUpdatedBy: raw.lastUpdatedBy || "Admin User",
  };
}

export function formatConditionExpression(conditionsObj: WorkflowRule["conditions"]): string {
  if (!conditionsObj) return "";
  if (conditionsObj.summary) return conditionsObj.summary;

  const formatCondition = (c: RuleCondition) => {
    const fieldDef = SUPPORTED_FIELDS.find((f) => f.key === c.field);
    const fieldLabel = fieldDef ? fieldDef.label : c.field;
    let valStr = String(c.value);
    if (fieldDef?.type === "currency" && !isNaN(Number(c.value))) {
      valStr = `₹${Number(c.value).toLocaleString("en-IN")}`;
    }
    const op = c.operator === "is greater than" ? ">" : c.operator === "is less than" ? "<" : c.operator === "equals" ? "=" : c.operator;
    return `${fieldLabel} ${op} ${valStr}`;
  };

  const mainConj = conditionsObj.conjunction === "ANY" ? " OR " : " AND ";
  const parts: string[] = [];

  if (conditionsObj.conditions && conditionsObj.conditions.length > 0) {
    const condStr = conditionsObj.conditions.map(formatCondition).join(mainConj);
    parts.push(conditionsObj.conditions.length > 1 ? `(${condStr})` : condStr);
  }

  if (conditionsObj.groups && conditionsObj.groups.length > 0) {
    conditionsObj.groups.forEach((g) => {
      const gConj = g.conjunction === "ANY" ? " OR " : " AND ";
      const gStr = g.conditions.map(formatCondition).join(gConj);
      parts.push(`(${gStr})`);
    });
  }

  return parts.join(" OR ");
}

export function formatActionSummary(actions: RuleAction[]): { primary: string; moreCount: number; badge?: string } {
  if (!actions || actions.length === 0) return { primary: "No actions", moreCount: 0 };
  const first = actions[0];
  const primary = first.title;
  const moreCount = Math.max(0, actions.length - 1);
  return {
    primary,
    moreCount,
    badge: first.badge,
  };
}

export function formatTriggerSummary(trigger: WorkflowRule["trigger"]): { event: string; timing: string } {
  if (!trigger) return { event: "Project Created", timing: "Immediately" };
  return {
    event: trigger.event || "Project Created",
    timing: trigger.timing || trigger.evaluate || "Immediately",
  };
}

export function formatLivePreview(rule: Partial<WorkflowRule>): { when: string; ifText: string; thenList: string[] } {
  const when = rule.trigger?.event
    ? `${rule.trigger.event.toLowerCase().replace("project created", "Project is created").replace("margin changed", "Margin changes")}`
    : "Event occurs";

  const ifText = rule.conditions ? formatConditionExpression(rule.conditions as any) : "Conditions are evaluated";

  const thenList = (rule.actions && rule.actions.length > 0)
    ? rule.actions.map((a) => {
        if (a.type === "requestApproval") return `Request approval using ${a.target || "Approval Flow"}`;
        if (a.type === "sendNotification") return `Send notification to ${a.target || "Stakeholder"}`;
        if (a.type === "createTask") return `Create task: ${a.target || "Workflow Task"}`;
        if (a.type === "changeStatus") return `Change project status to ${a.target || "Active"}`;
        if (a.type === "blockActivation") return `Block activation: ${a.target || "Documents Required"}`;
        return a.title;
      })
    : ["Execute workflow steps"];

  return { when, ifText, thenList };
}

export function calculateRuleKpis(rules: WorkflowRule[]) {
  const total = rules.length;
  const active = rules.filter((r) => r.status === "ACTIVE").length;
  const draft = rules.filter((r) => r.status === "DRAFT").length;
  const approvalTriggers = rules.filter((r) =>
    r.actions.some((a) => a.type === "requestApproval" || a.badge?.toLowerCase().includes("approval"))
  ).length;

  return {
    total,
    active,
    draft,
    approvalTriggers,
  };
}

export function calculateCategoryCounts(rules: WorkflowRule[]) {
  const counts: Record<string, number> = {
    "All Rules": rules.length,
    Project: 0,
    Tasks: 0,
    Milestones: 0,
    Approvals: 0,
    Costing: 0,
    Documents: 0,
    Clients: 0,
  };

  rules.forEach((r) => {
    const cat = r.category || "Project";
    if (cat in counts) {
      counts[cat]++;
    } else {
      counts["Project"]++;
    }
  });

  return counts;
}

export function simulateRule(rule: WorkflowRule, payload: Record<string, any>): SimulationResult {
  const conditionResults: SimulationResult["conditionResults"] = [];

  const evalSingle = (c: RuleCondition) => {
    const actual = payload[c.field];
    let passed = false;
    const op = c.operator;
    const expected = c.value;

    if (op === "is greater than") passed = Number(actual) > Number(expected);
    else if (op === "is less than") passed = Number(actual) < Number(expected);
    else if (op === "is greater than or equal") passed = Number(actual) >= Number(expected);
    else if (op === "is less than or equal") passed = Number(actual) <= Number(expected);
    else if (op === "equals") passed = String(actual).toLowerCase() === String(expected).toLowerCase();
    else if (op === "does not equal") passed = String(actual).toLowerCase() !== String(expected).toLowerCase();
    else if (op === "contains") passed = String(actual).toLowerCase().includes(String(expected).toLowerCase());
    else passed = Boolean(actual);

    conditionResults.push({
      field: c.field,
      operator: c.operator,
      expected: c.value,
      actual: actual !== undefined ? actual : "(empty)",
      passed,
    });
    return passed;
  };

  // Evaluate root group
  const rootPassed = rule.conditions.conditions.length === 0
    ? true
    : rule.conditions.conjunction === "ANY"
    ? rule.conditions.conditions.some(evalSingle)
    : rule.conditions.conditions.every(evalSingle);

  // Evaluate nested groups (OR combined)
  let groupsPassed = false;
  if (rule.conditions.groups && rule.conditions.groups.length > 0) {
    groupsPassed = rule.conditions.groups.some((g) => {
      return g.conjunction === "ANY" ? g.conditions.some(evalSingle) : g.conditions.every(evalSingle);
    });
  }

  const overallMatched = rootPassed || groupsPassed;

  return {
    matched: overallMatched,
    summary: overallMatched
      ? "All required criteria met. Rule actions triggered successfully."
      : "Condition criteria not satisfied. Rule execution halted.",
    conditionResults,
    executedActions: overallMatched ? rule.actions : [],
  };
}
