"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Edit3,
  SlidersHorizontal,
  Plus,
  ChevronDown,
  X,
  Filter,
} from "lucide-react";
import { updateTemplateSection } from "@/lib/api/templates";
import type {
  MockWorkflowTask,
  MockMilestone,
  MockApprovalFlow,
  MockWorkflowRule,
} from "@/lib/templates/types";

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

export default function TemplateWorkflow({
  templateId,
  templateName = "Project Template",
  initialWorkflow,
  initialSubTab,
  onUpdate,
}: TemplateWorkflowProps) {
  // Active sub-tab state (Stages active by default)
  const [workflowSubTab, setWorkflowSubTab] = useState<
    "Stages" | "Tasks" | "Milestones" | "Approvals" | "Rules"
  >(initialSubTab || "Stages");

  const handleSubTabChange = (
    subTab: "Stages" | "Tasks" | "Milestones" | "Approvals" | "Rules"
  ) => {
    setWorkflowSubTab(subTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "Workflow");
      url.searchParams.set("subtab", subTab);
      window.history.replaceState(null, "", url.toString());
    }
  };

  useEffect(() => {
    if (initialSubTab) {
      setWorkflowSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Filter state & popover
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("All");

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

  useEffect(() => {
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
      {/* ── Top Header Row (Figma Frame 2147225198 & 2147225069) ──── */}
      <div className="td-workflow-top-bar">
        <div className="td-workflow-title-block">
          <h2 className="title">
            {workflowSubTab === "Approvals"
              ? "Approvals"
              : workflowSubTab === "Milestones" ? "Milestones" : "Workflow"}
          </h2>
          <p className="desc">
            {workflowSubTab === "Milestones"
              ? "Define the key checkpoints and deliverables inherited by projects created from this template."
              : workflowSubTab === "Approvals"
              ? "Configure the approval flows inherited by projects created from this template."
              : "Define the operational process inherited by projects created from this template."}
          </p>
        </div>

        <div className="td-workflow-controls">
          <div className="td-workflow-search-box">
            <div className="icon-wrap">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder={
                workflowSubTab === "Milestones"
                  ? "Search milestones…"
                  : workflowSubTab === "Approvals"
                  ? "Search approvals…"
                  : "Search workflow…"
              }
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="td-wf-btn-icon"
            title="Edit Workflow"
            onClick={() => handleSaveToBackend({})}
          >
            <Edit3 size={16} />
          </button>

          <div className="td-relative-inline">
            <button
              type="button"
              className={`td-wf-btn-filter ${statusFilter !== "All" ? "active-filter" : ""}`}
              title="Filter Workflow"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <SlidersHorizontal size={14} />
              <span>{statusFilter !== "All" ? `Filter: ${statusFilter}` : "Filter"}</span>
            </button>

            {isFilterOpen && (
              <div className="td-wf-filter-popover">
                <div className="filter-header">
                  <span>Filter by Status</span>
                  <button
                    type="button"
                    className="close-filter-btn"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    <X size={13} />
                  </button>
                </div>
                <div className="filter-options">
                  {["All", "Configured", "Active", "Draft", "Needs Attention"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`filter-opt ${statusFilter === st ? "active" : ""}`}
                      onClick={() => {
                        setStatusFilter(st);
                        setIsFilterOpen(false);
                      }}
                    >
                      <span>{st}</span>
                      {statusFilter === st && <span className="check">✓</span>}
                    </button>
                  ))}
                </div>
                {statusFilter !== "All" && (
                  <div className="filter-footer">
                    <button
                      type="button"
                      className="clear-all-filter-btn"
                      onClick={() => {
                        setStatusFilter("All");
                        setIsFilterOpen(false);
                      }}
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="td-relative-inline">
            <button
              type="button"
              className="td-wf-btn-add"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={15} />
              <span>
                {workflowSubTab === "Milestones"
                  ? "Add Milestone"
                  : workflowSubTab === "Approvals"
                  ? "Add Approval Flow"
                  : "Add"}
              </span>
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
                    handleSubTabChange("Stages");
                    setIsAddModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                >
                  Add Stage
                </button>
                <button
                  type="button"
                  className="item"
                  onClick={() => {
                    handleSubTabChange("Tasks");
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
                    handleSubTabChange("Milestones");
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
                    handleSubTabChange("Approvals");
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
                    handleSubTabChange("Rules");
                    setIsAddModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                >
                  Add Rule
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Workflow Sub-Tabs (Figma Frame 2147225196) ───────────── */}
      <div className="td-workflow-subtabs">
        {(["Stages", "Tasks", "Milestones", "Approvals", "Rules"] as const).map(
          (subTab) => (
            <button
              key={subTab}
              type="button"
              className={`td-wf-subtab ${workflowSubTab === subTab ? "active" : ""}`}
              onClick={() => handleSubTabChange(subTab)}
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
          allTasks={tasks}
          allMilestones={milestones}
          allApprovals={approvals}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onUpdateStages={(updated) => {
            setStages(updated);
            handleSaveToBackend({ stages: updated });
          }}
          onUpdateTasks={(updated) => {
            setTasks(updated);
            handleSaveToBackend({ tasks: updated });
          }}
          onSaveBackend={() => handleSaveToBackend({ stages, tasks })}
          saving={saving}
          saveSuccess={saveSuccess}
          saveError={saveError}
        />
      )}

      {workflowSubTab === "Tasks" && (
        <WorkflowTasksView
          tasks={tasks}
          stages={stages}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onUpdateTasks={(updated) => {
            setTasks(updated);
            handleSaveToBackend({ tasks: updated });
          }}
          onAddTaskClick={() => setIsAddModalOpen(true)}
          onSaveBackend={() => handleSaveToBackend({ tasks })}
          saving={saving}
          saveSuccess={saveSuccess}
          saveError={saveError}
        />
      )}

      {workflowSubTab === "Milestones" && (
        <WorkflowMilestonesView
          templateId={templateId}
          templateName={templateName}
          milestones={milestones}
          stages={stages}
          tasks={tasks}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onUpdateMilestones={(updated) => {
            setMilestones(updated);
            handleSaveToBackend({ milestones: updated });
          }}
          onAddMilestoneClick={() => setIsAddModalOpen(true)}
          saving={saving}
          saveSuccess={saveSuccess}
          saveError={saveError}
        />
      )}

      {workflowSubTab === "Approvals" && (
        <WorkflowApprovalsView
          templateId={templateId}
          templateName={templateName}
          approvals={approvals}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onUpdateApprovals={(updated) => {
            setApprovals(updated);
            handleSaveToBackend({ approvals: updated });
          }}
          onAddApprovalClick={() => setIsAddModalOpen(true)}
          saving={saving}
          saveSuccess={saveSuccess}
          saveError={saveError}
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
