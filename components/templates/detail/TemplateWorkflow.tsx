"use client";

import React, { useState } from "react";
import {
  Search,
  Edit3,
  SlidersHorizontal,
  Plus,
  ChevronDown,
} from "lucide-react";
import { updateTemplateSection } from "@/lib/api/templates";
import type {
  MockWorkflowTask,
  MockMilestone,
  MockApprovalFlow,
  MockWorkflowRule,
} from "@/lib/templates/mock-data";

import WorkflowStagesView, {
  WorkflowStageItem,
} from "./workflow/WorkflowStagesView";
import WorkflowTasksView from "./workflow/WorkflowTasksView";
import WorkflowMilestonesView from "./workflow/WorkflowMilestonesView";
import WorkflowApprovalsView from "./workflow/WorkflowApprovalsView";
import WorkflowRulesView from "./workflow/WorkflowRulesView";
import WorkflowAddModal from "./workflow/WorkflowAddModal";

interface TemplateWorkflowProps {
  templateId: string;
  templateName?: string;
  initialWorkflow?: any;
  initialSubTab?: "Stages" | "Tasks" | "Milestones" | "Approvals" | "Rules";
  onUpdate?: () => void;
}

const defaultStages: WorkflowStageItem[] = [
  {
    id: "stg-disc",
    name: "Discovery",
    code: "STG-001",
    icon: "🛆",
    tasksCount: 4,
    status: "Completed",
    owner: "Project Manager",
    duration: 5,
    durationUnit: "Business Days",
    description: "Initial client intake, measurement and concept brief alignment.",
    entryCondition: "Project Contract Signed",
    exitCondition: "Discovery Sign Off Completed",
  },
  {
    id: "stg-des",
    name: "Design",
    code: "STG-002",
    icon: "✎",
    tasksCount: 6,
    status: "Active",
    owner: "Design Manager",
    duration: 12,
    durationUnit: "Business Days",
    description: "Create review and finalise the interior 2D/3D design package.",
    entryCondition: "Discovery Sign Off Completed",
    exitCondition: "Design Approval Received",
  },
  {
    id: "stg-cost",
    name: "Costing",
    code: "STG-003",
    icon: "₹",
    tasksCount: 4,
    status: "Draft",
    owner: "Estimator",
    duration: 6,
    durationUnit: "Business Days",
    description: "BOQ rate compilation, material sourcing and markup calculation.",
    entryCondition: "Design Approval Received",
    exitCondition: "BOQ Approved by Client",
  },
  {
    id: "stg-appr",
    name: "Approval",
    code: "STG-004",
    icon: "📅",
    tasksCount: 4,
    status: "Draft",
    owner: "Account Lead",
    duration: 4,
    durationUnit: "Business Days",
    description: "Final client milestone sign-off and advance payment clearing.",
    entryCondition: "BOQ Approved by Client",
    exitCondition: "Advance Cleared",
  },
  {
    id: "stg-exec",
    name: "Execution",
    code: "STG-005",
    icon: "⚙",
    tasksCount: 16,
    status: "Draft",
    owner: "Site Supervisor",
    duration: 45,
    durationUnit: "Business Days",
    description: "Civil, carpentry, electrical and finish installation on site.",
    entryCondition: "Site Handover Received",
    exitCondition: "Quality Audit Passed",
  },
  {
    id: "stg-hand",
    name: "Handover",
    code: "STG-006",
    icon: "🤝",
    tasksCount: 4,
    status: "Draft",
    owner: "Project Manager",
    duration: 5,
    durationUnit: "Business Days",
    description: "Deep cleaning, snag rectification and key handover to client.",
    entryCondition: "Quality Audit Passed",
    exitCondition: "Handover Signoff Received",
  },
  {
    id: "stg-clos",
    name: "Closure",
    code: "STG-007",
    icon: "📋",
    tasksCount: 4,
    status: "Draft",
    owner: "Operations Lead",
    duration: 3,
    durationUnit: "Business Days",
    description: "Warranty certificate issuance and final billing reconciliation.",
    entryCondition: "Handover Signoff Received",
    exitCondition: "Project Closed in ERP",
  },
];

export default function TemplateWorkflow({
  templateId,
  templateName = "Project Template",
  initialWorkflow,
  initialSubTab,
  onUpdate,
}: TemplateWorkflowProps) {
  // Active sub-tab state (Rules active by default when accessing workflow rules)
  const [workflowSubTab, setWorkflowSubTab] = useState<
    "Stages" | "Tasks" | "Milestones" | "Approvals" | "Rules"
  >(initialSubTab || "Rules");

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Sub-items data collections
  const [stages, setStages] = useState<WorkflowStageItem[]>(
    initialWorkflow?.stages && Array.isArray(initialWorkflow.stages) && initialWorkflow.stages.length > 0
      ? initialWorkflow.stages
      : []
  );
  const [tasks, setTasks] = useState<MockWorkflowTask[]>(
    initialWorkflow?.tasks && Array.isArray(initialWorkflow.tasks) && initialWorkflow.tasks.length > 0
      ? initialWorkflow.tasks
      : []
  );
  const [milestones, setMilestones] = useState<MockMilestone[]>(
    initialWorkflow?.milestones && Array.isArray(initialWorkflow.milestones) && initialWorkflow.milestones.length > 0
      ? initialWorkflow.milestones
      : []
  );
  const [approvals, setApprovals] = useState<MockApprovalFlow[]>(
    initialWorkflow?.approvals && Array.isArray(initialWorkflow.approvals) && initialWorkflow.approvals.length > 0
      ? initialWorkflow.approvals
      : []
  );
  const [rules, setRules] = useState<MockWorkflowRule[]>(
    initialWorkflow?.rules && Array.isArray(initialWorkflow.rules) && initialWorkflow.rules.length > 0
      ? initialWorkflow.rules
      : []
  );

  React.useEffect(() => {
    if (initialWorkflow?.stages && Array.isArray(initialWorkflow.stages) && initialWorkflow.stages.length > 0) {
      setStages(initialWorkflow.stages);
    }
    if (initialWorkflow?.tasks && Array.isArray(initialWorkflow.tasks) && initialWorkflow.tasks.length > 0) {
      setTasks(initialWorkflow.tasks);
    }
    if (initialWorkflow?.milestones && Array.isArray(initialWorkflow.milestones) && initialWorkflow.milestones.length > 0) {
      setMilestones(initialWorkflow.milestones);
    }
    if (initialWorkflow?.approvals && Array.isArray(initialWorkflow.approvals) && initialWorkflow.approvals.length > 0) {
      setApprovals(initialWorkflow.approvals);
    }
    if (initialWorkflow?.rules && Array.isArray(initialWorkflow.rules) && initialWorkflow.rules.length > 0) {
      setRules(initialWorkflow.rules);
    }
  }, [initialWorkflow]);

  // Backend saving state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Persist workflow changes to backend API
  const handleSaveToBackend = async (partialData: Record<string, any>) => {
    try {
      setSaving(true);
      setSaveError(null);

      await updateTemplateSection(templateId, "workflow", {
        data: {
          stages,
          tasks,
          milestones,
          approvals,
          rules,
          ...partialData,
        },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onUpdate?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save workflow";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Add handlers
  const handleAddTask = (newTask: MockWorkflowTask) => {
    const updated = [newTask, ...tasks];
    setTasks(updated);
    handleSaveToBackend({ tasks: updated });
  };

  const handleAddMilestone = (newMs: MockMilestone) => {
    const updated = [...milestones, newMs];
    setMilestones(updated);
    handleSaveToBackend({ milestones: updated });
  };

  const handleAddApproval = (newApr: MockApprovalFlow) => {
    const updated = [newApr, ...approvals];
    setApprovals(updated);
    handleSaveToBackend({ approvals: updated });
  };

  const handleAddRule = (newRule: MockWorkflowRule) => {
    const updated = [newRule, ...rules];
    setRules(updated);
    handleSaveToBackend({ rules: updated });
  };

  const handleAddStage = (newStage: WorkflowStageItem) => {
    const updated = [...stages, newStage];
    setStages(updated);
    handleSaveToBackend({ stages: updated });
  };

  // Get modal default type based on current active subtab
  const getDefaultAddType = () => {
    switch (workflowSubTab) {
      case "Tasks":
        return "Task";
      case "Milestones":
        return "Milestone";
      case "Approvals":
        return "Approval";
      case "Rules":
        return "Rule";
      case "Stages":
      default:
        return "Stage";
    }
  };

  return (
    <div className="td-workflow-container">
      {/* ── Top Header Row ────────────────────────────────────────── */}
      <div className="td-workflow-top-bar">
        <div className="td-workflow-title-block">
          <h2 className="title">Workflow</h2>
          <p className="desc">
            Define the operational process inherited by projects created from this template.
          </p>
        </div>

        <div className="td-workflow-controls">
          <div className="td-workflow-search-box">
            <Search size={14} className="icon" />
            <input
              type="text"
              placeholder="Search workflow..."
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="td-wf-btn-icon"
            title="Edit Workflow"
            onClick={() => handleSaveToBackend({})}
          >
            <Edit3 size={15} />
          </button>

          <button
            type="button"
            className="td-wf-btn-filter"
            title="Filter Workflow"
          >
            <SlidersHorizontal size={14} />
            <span>Filter</span>
          </button>

          <div className="td-relative-inline">
            <button
              type="button"
              className="td-wf-btn-add"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={15} />
              <span>Add</span>
              <ChevronDown
                size={14}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddMenuOpen(!isAddMenuOpen);
                }}
              />
            </button>

            {isAddMenuOpen && (
              <div className="td-wf-add-dropdown-menu">
                <button
                  type="button"
                  className="item"
                  onClick={() => {
                    setWorkflowSubTab("Tasks");
                    setIsAddModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                >
                  Add Task
                </button>
                <button
                  type="button"
                  className="item"
                  onClick={() => {
                    setWorkflowSubTab("Milestones");
                    setIsAddModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                >
                  Add Milestone
                </button>
                <button
                  type="button"
                  className="item"
                  onClick={() => {
                    setWorkflowSubTab("Approvals");
                    setIsAddModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                >
                  Add Approval Flow
                </button>
                <button
                  type="button"
                  className="item"
                  onClick={() => {
                    setWorkflowSubTab("Rules");
                    setIsAddModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                >
                  Add Rule
                </button>
                <button
                  type="button"
                  className="item"
                  onClick={() => {
                    setWorkflowSubTab("Stages");
                    setIsAddModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                >
                  Add Stage
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Workflow Sub-Tabs ─────────────────────────────────────── */}
      <div className="td-workflow-subtabs">
        {(["Stages", "Tasks", "Milestones", "Approvals", "Rules"] as const).map(
          (subTab) => (
            <button
              key={subTab}
              type="button"
              className={`td-wf-subtab ${workflowSubTab === subTab ? "active" : ""}`}
              onClick={() => setWorkflowSubTab(subTab)}
            >
              {subTab}
            </button>
          )
        )}
      </div>

      {/* ── Active Sub-View Render ─────────────────────────────────── */}
      {workflowSubTab === "Stages" && (
        <WorkflowStagesView
          stages={stages}
          searchQuery={searchQuery}
          onUpdateStages={(updated) => {
            setStages(updated);
            handleSaveToBackend({ stages: updated });
          }}
          onSaveBackend={() => handleSaveToBackend({ stages })}
          saving={saving}
          saveSuccess={saveSuccess}
          saveError={saveError}
        />
      )}

      {workflowSubTab === "Tasks" && (
        <WorkflowTasksView
          tasks={tasks}
          searchQuery={searchQuery}
          onUpdateTasks={(updated) => {
            setTasks(updated);
            handleSaveToBackend({ tasks: updated });
          }}
          onAddTaskClick={() => setIsAddModalOpen(true)}
        />
      )}

      {workflowSubTab === "Milestones" && (
        <WorkflowMilestonesView
          milestones={milestones}
          searchQuery={searchQuery}
          onUpdateMilestones={(updated) => {
            setMilestones(updated);
            handleSaveToBackend({ milestones: updated });
          }}
          onAddMilestoneClick={() => setIsAddModalOpen(true)}
        />
      )}

      {workflowSubTab === "Approvals" && (
        <WorkflowApprovalsView
          approvals={approvals}
          searchQuery={searchQuery}
          onUpdateApprovals={(updated) => {
            setApprovals(updated);
            handleSaveToBackend({ approvals: updated });
          }}
          onAddApprovalClick={() => setIsAddModalOpen(true)}
        />
      )}

      {workflowSubTab === "Rules" && (
        <WorkflowRulesView
          rules={rules}
          templateId={templateId}
          templateName={templateName}
          searchQuery={searchQuery}
          availableApprovals={approvals.map((a: any) => ({ code: a.code || a.id, name: a.name }))}
          onUpdateRules={(updated) => {
            setRules(updated as any);
            handleSaveToBackend({ rules: updated });
          }}
          onAddRuleClick={() => setIsAddModalOpen(true)}
          isAddModalOpen={isAddModalOpen && workflowSubTab === "Rules"}
          onCloseAddModal={() => setIsAddModalOpen(false)}
        />
      )}

      {/* ── Add Item Modal (for Tasks, Milestones, Approvals, Stages) ─ */}
      {isAddModalOpen && workflowSubTab !== "Rules" && (
        <WorkflowAddModal
          isOpen={isAddModalOpen}
          defaultType={getDefaultAddType()}
          onClose={() => setIsAddModalOpen(false)}
          onAddTask={handleAddTask}
          onAddMilestone={handleAddMilestone}
          onAddApproval={handleAddApproval}
          onAddRule={handleAddRule}
          onAddStage={handleAddStage}
        />
      )}
    </div>
  );
}
