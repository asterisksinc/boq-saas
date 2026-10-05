export interface MockItem {
  id: string;
  name: string;
  code: string;
  type: string;
  unit: string;
  quantity?: number;
  baseCost: number;
  sellingRate: number;
  rate?: number;
  wastePercent?: number;
  taxPercent?: number;
  amount?: number;
  rateStatus?: "MAPPED" | "OUTDATED" | "MISSING";
  description?: string;
}

export interface MockSection {
  id: string;
  name: string;
  code?: string;
  description?: string;
  itemsCount?: number;
  totalValue?: number;
  items: MockItem[];
}

export interface MockArea {
  id: string;
  name: string;
  type: string;
  dimensions: string;
  code?: string;
  description?: string;
  includedByDefault?: boolean;
  allowRename?: boolean;
  requiredArea?: boolean;
  sections: MockSection[];
}

export interface MockWorkflowTask {
  id: string;
  name: string;
  stage?: string;
  assignee: string;
  assigneeRole?: string;
  duration: string;
  dependency: string;
  criticality?: "MEDIUM" | "HIGH" | "CRITICAL";
  status?: "ACTIVE" | "COMPLETED" | "DRAFT";
  approval?: "Yes" | "No";
  order?: number;
}

export interface MockMilestone {
  id: string;
  code: string;
  orderNumber: string;
  name: string;
  subtitle: string;
  description?: string;
  category: string;
  ownerRole: string;
  duration: string;
  durationDays: number;
  tasksCount: number;
  deliverablesCount: number;
  approvalType: string;
  status: "CONFIGURED" | "DRAFT" | "PENDING";
  startRule?: string;
  completionRule?: string;
  linkedTasks?: number;
  linkedDeliverables?: number;
  linkedApprovals?: string;
  linkedDependencies?: number;
  nextMilestoneTitle?: string;
  nextMilestoneCode?: string;
}

export interface MockApprover {
  label: string;
  role: string;
  color: "red" | "green" | "blue" | "amber" | "gray";
}

export interface MockApprovalStepPreview {
  badge?: string;
  header?: string;
  title: string;
  subtitle: string;
}

export interface MockApprovalFlow {
  id: string;
  code: string;
  name: string;
  category: string;
  version: string;
  description: string;
  triggerTitle: string;
  triggerDescription: string;
  stagesCount: number;
  mode: "Sequential" | "Parallel";
  sla: string;
  status: "ACTIVE" | "DRAFT" | "NEEDS ATTENTION";
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
  lastUpdatedBy: string;
  approvers: MockApprover[];
  previewSteps: MockApprovalStepPreview[];
}

export interface MockWorkflowRule {
  id: string;
  code: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  stage: string;
  status: "ACTIVE" | "INACTIVE";
  lastModified: string;
}
