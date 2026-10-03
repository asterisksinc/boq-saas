"use client";

import React, { useState } from "react";
import {
  Search,
  Edit3,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  GripVertical,
  CornerDownRight,
  X,
  Check,
} from "lucide-react";

export interface WorkflowTaskItem {
  id: string;
  name: string;
  assignee: string;
  duration: string;
  dependency: string;
  approval: "Yes" | "No";
}

export interface WorkflowStageItem {
  id: string;
  name: string;
  code: string;
  icon?: string;
  tasksCount: number;
  tasks?: WorkflowTaskItem[];
  status?: string;
  owner?: string;
  duration?: number;
  durationUnit?: string;
  description?: string;
  entryCondition?: string;
  exitCondition?: string;
}

interface WorkflowStagesViewProps {
  stages: WorkflowStageItem[];
  searchQuery?: string;
  onUpdateStages: (stages: WorkflowStageItem[]) => void;
  onSaveBackend?: () => Promise<void>;
  saving?: boolean;
  saveSuccess?: boolean;
  saveError?: string | null;
}

const defaultFallbackStage: WorkflowStageItem = {
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
};

export default function WorkflowStagesView({
  stages: propStages,
  searchQuery = "",
  onUpdateStages,
  onSaveBackend,
  saving = false,
  saveSuccess = false,
  saveError = null,
}: WorkflowStagesViewProps) {
  const stages = propStages && propStages.length > 0 ? propStages : [defaultFallbackStage];
  const [selectedStageId, setSelectedStageId] = useState("stg-des");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  const selectedStage =
    stages.find((s) => s.id === selectedStageId) || stages[0] || defaultFallbackStage;

  // Stage details inspector form state
  const [stageName, setStageName] = useState(selectedStage?.name || "Design");
  const [stageCode, setStageCode] = useState(selectedStage?.code || "STG-002");
  const [stageDesc, setStageDesc] = useState(
    selectedStage?.description ||
      "Create review and finalise the interior 2D/3D design package."
  );
  const [stageStatus, setStageStatus] = useState(selectedStage?.status || "Active");
  const [stageOwner, setStageOwner] = useState(
    selectedStage?.owner || "Design Manager"
  );
  const [duration, setDuration] = useState(selectedStage?.duration ?? 12);
  const [durationUnit, setDurationUnit] = useState(
    selectedStage?.durationUnit || "Business Days"
  );
  const [entryCondition, setEntryCondition] = useState(
    selectedStage?.entryCondition || "Discovery Sign Off Completed"
  );
  const [exitCondition, setExitCondition] = useState(
    selectedStage?.exitCondition || "Design Approval Received"
  );

  React.useEffect(() => {
    if (selectedStage) {
      setStageName(selectedStage.name || "");
      setStageCode(selectedStage.code || "");
      setStageDesc(selectedStage.description || "");
      setStageStatus(selectedStage.status || "Active");
      setStageOwner(selectedStage.owner || "Design Manager");
      setDuration(selectedStage.duration ?? 12);
      setDurationUnit(selectedStage.durationUnit || "Business Days");
      setEntryCondition(selectedStage.entryCondition || "");
      setExitCondition(selectedStage.exitCondition || "");
    }
  }, [selectedStage?.id]);

  const handleSelectStage = (stg: WorkflowStageItem) => {
    setSelectedStageId(stg.id);
    setStageName(stg.name);
    setStageCode(stg.code);
    setStageDesc(stg.description || "");
    setStageStatus(stg.status || "Active");
    setStageOwner(stg.owner || "Design Manager");
    setDuration(stg.duration ?? 12);
    setDurationUnit(stg.durationUnit || "Business Days");
    setEntryCondition(stg.entryCondition || "");
    setExitCondition(stg.exitCondition || "");
    setIsInspectorOpen(true);
  };

  const handleApplyFormChanges = () => {
    const updatedStages = stages.map((s) => {
      if (s.id === selectedStageId) {
        return {
          ...s,
          name: stageName,
          code: stageCode,
          description: stageDesc,
          status: stageStatus,
          owner: stageOwner,
          duration,
          durationUnit,
          entryCondition,
          exitCondition,
        };
      }
      return s;
    });

    onUpdateStages(updatedStages);
    if (onSaveBackend) {
      onSaveBackend();
    }
  };

  const filteredStages = stages.filter((s) =>
    searchQuery.trim()
      ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const tasksToRender =
    selectedStage?.tasks && selectedStage.tasks.length > 0
      ? selectedStage.tasks
      : [
          {
            id: "tsk-1",
            name: "Concept Design",
            assignee: "Lead Designer",
            duration: "3 Days",
            dependency: "Project Kickoff",
            approval: "No" as const,
          },
          {
            id: "tsk-2",
            name: "Client Review",
            assignee: "Project Manager",
            duration: "2 Days",
            dependency: "Concept Design",
            approval: "Yes" as const,
          },
          {
            id: "tsk-3",
            name: "Revisions",
            assignee: "Lead Designer",
            duration: "3 Days",
            dependency: "Client Review",
            approval: "No" as const,
          },
          {
            id: "tsk-4",
            name: "Final Design",
            assignee: "Lead Designer",
            duration: "2 Days",
            dependency: "Revisions",
            approval: "No" as const,
          },
          {
            id: "tsk-5",
            name: "Design Approval",
            assignee: "Client",
            duration: "2 Days",
            dependency: "Final Design",
            approval: "Yes" as const,
          },
        ];

  return (
    <div className="td-wf-stages-wrapper">
      {/* ── 4 KPI Summary Cards for Stages ────────────────────────── */}
      <div className="td-wf-kpi-grid">
        <div className="td-wf-kpi-card">
          <span className="label">Stages</span>
          <span className="val">07</span>
          <span className="sub">This quarter</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Tasks</span>
          <span className="val">48</span>
          <span className="sub">4 of 6 decided</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Milestones</span>
          <span className="val">06</span>
          <span className="sub">Per proposal</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Approvals</span>
          <span className="val">09</span>
          <span className="sub">1 expiring soon</span>
        </div>
      </div>

      {/* ── 3-Column Layout ───────────────────────────────────────── */}
      <div className="td-wf-content-grid">
        {/* Column 1: Left Workflow Outline Sidebar */}
        <aside className="td-wf-outline-sidebar">
          <div className="header">
            <div className="titles">
              <span className="title">WORKFLOW OUTLINE</span>
              <span className="meta">07 Stages · 48 Tasks</span>
            </div>
            <button type="button" className="search-btn" title="Search stages">
              <Search size={14} />
            </button>
          </div>

          <div className="stages-list">
            {filteredStages.map((stage) => {
              const isSelected = stage.id === selectedStageId;
              return (
                <div
                  key={stage.id}
                  className={`stage-row ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectStage(stage)}
                >
                  <div className="left">
                    <span className="icon">{stage.icon || "⚙"}</span>
                    <span className="name">{stage.name}</span>
                  </div>
                  <span className="tasks-badge">{stage.tasksCount} Tasks</span>
                </div>
              );
            })}
          </div>

          <div className="footer">
            <button type="button" className="add-stage-btn">
              <Plus size={15} />
              <span>Add Stage</span>
            </button>
          </div>
        </aside>

        {/* Column 2: Center Stage Tasks Table */}
        <section className="td-wf-center-section">
          <div className="td-wf-stage-header">
            <div className="title-col">
              <div className="name-row">
                <h3 className="stage-name">{selectedStage?.name || "Stage"} Stage</h3>
                <span className="td-status-pill status-pill-active">{selectedStage?.status || "ACTIVE"}</span>
              </div>
              <span className="stage-meta">
                {tasksToRender.length} Tasks · 3 Milestones · 3 Approvals
              </span>
            </div>

            <div className="stage-actions">
              <button type="button" className="td-icon-box-btn" title="Edit Stage">
                <Edit3 size={15} />
              </button>
              <button type="button" className="td-icon-box-btn" title="Add Task">
                <Plus size={15} />
              </button>
              <button type="button" className="td-icon-box-btn" title="More Options">
                <MoreHorizontal size={15} />
              </button>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="td-wf-table-wrap">
            <table className="td-wf-tasks-table">
              <thead>
                <tr>
                  <th style={{ width: "6%" }}>#</th>
                  <th style={{ width: "24%" }}>TASK NAME</th>
                  <th style={{ width: "22%" }}>OWNER / ASSIGNEE</th>
                  <th style={{ width: "16%" }}>DURATION</th>
                  <th style={{ width: "22%" }}>DEPENDENCY</th>
                  <th style={{ width: "10%" }}>APPROVAL</th>
                </tr>
              </thead>
              <tbody>
                {tasksToRender.map((task, idx) => (
                  <tr key={task.id || idx}>
                    <td>
                      <div className="num-cell">
                        <GripVertical size={13} className="grip" />
                        <span>{idx + 1}</span>
                      </div>
                    </td>
                    <td>
                      <span className="task-name">{task.name}</span>
                    </td>
                    <td>
                      <span className="assignee-txt">{task.assignee}</span>
                    </td>
                    <td>
                      <span className="duration-txt">{task.duration}</span>
                    </td>
                    <td>
                      <div className="dep-cell">
                        <CornerDownRight size={13} className="dep-icon" />
                        <span className="dep-txt">{task.dependency}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`approval-txt ${task.approval === "Yes" ? "yes" : "no"}`}
                      >
                        {task.approval}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination Bar */}
          <div className="target-table-pagination-row">
            <div className="target-table-total-count">Total Tasks: NA</div>

            <div className="target-table-page-nav" role="navigation" aria-label="Pagination">
              <button type="button" className="target-table-page-btn arrow" disabled>
                <ChevronLeft size={15} />
              </button>
              <button type="button" className="target-table-page-btn active">
                1
              </button>
              <button type="button" className="target-table-page-btn">
                2
              </button>
              <button type="button" className="target-table-page-btn">
                3
              </button>
              <button type="button" className="target-table-page-btn">
                4
              </button>
              <button type="button" className="target-table-page-btn">
                5
              </button>
              <button type="button" className="target-table-page-btn arrow">
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="target-table-page-size-wrap">
              <span className="target-table-page-size-label">Show per Page:</span>
              <div className="target-table-page-size-select-wrap">
                <select className="target-table-page-size-select" defaultValue={10}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown size={14} className="target-table-select-arrow" />
              </div>
            </div>
          </div>
        </section>

        {/* Column 3: Right Stage Details Inspector */}
        {isInspectorOpen && (
          <aside className="td-wf-inspector-panel">
            <div className="header">
              <span className="title">STAGE DETAILS</span>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsInspectorOpen(false)}
                aria-label="Close inspector"
              >
                <X size={15} />
              </button>
            </div>

            <div className="body">
              {saveSuccess && (
                <div className="td-inspector-alert success">
                  <Check size={14} />
                  <span>Stage updated in backend.</span>
                </div>
              )}
              {saveError && (
                <div className="td-inspector-alert error">
                  <span>{saveError}</span>
                </div>
              )}

              <div className="td-form-group">
                <label className="td-form-label">
                  Stage Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="td-form-input"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">
                  Stage Code <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="td-form-input"
                  value={stageCode}
                  onChange={(e) => setStageCode(e.target.value)}
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Description</label>
                <textarea
                  className="td-form-textarea"
                  rows={3}
                  value={stageDesc}
                  onChange={(e) => setStageDesc(e.target.value)}
                />
              </div>

              <div className="td-form-row-2">
                <div className="td-form-group">
                  <label className="td-form-label">
                    Stage Status <span className="req">*</span>
                  </label>
                  <div className="td-select-wrapper">
                    <select
                      className="td-form-select"
                      value={stageStatus}
                      onChange={(e) => setStageStatus(e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Draft">Draft</option>
                    </select>
                    <ChevronDown size={14} className="td-select-chevron" />
                  </div>
                </div>

                <div className="td-form-group">
                  <label className="td-form-label">
                    Stage Owner <span className="req">*</span>
                  </label>
                  <div className="td-select-wrapper">
                    <select
                      className="td-form-select"
                      value={stageOwner}
                      onChange={(e) => setStageOwner(e.target.value)}
                    >
                      <option value="Design Manager">Design Manager</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Lead Designer">Lead Designer</option>
                      <option value="Estimator">Estimator</option>
                    </select>
                    <ChevronDown size={14} className="td-select-chevron" />
                  </div>
                </div>
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Expected Duration</label>
                <div className="td-duration-row">
                  <input
                    type="number"
                    className="td-form-input num"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                  <div className="td-select-wrapper unit">
                    <select
                      className="td-form-select"
                      value={durationUnit}
                      onChange={(e) => setDurationUnit(e.target.value)}
                    >
                      <option value="Business Days">Business Days</option>
                      <option value="Calendar Days">Calendar Days</option>
                      <option value="Weeks">Weeks</option>
                    </select>
                    <ChevronDown size={14} className="td-select-chevron" />
                  </div>
                </div>
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Entry Condition</label>
                <input
                  type="text"
                  className="td-form-input"
                  value={entryCondition}
                  onChange={(e) => setEntryCondition(e.target.value)}
                  placeholder="e.g. Discovery Sign Off Completed"
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Exit Condition</label>
                <input
                  type="text"
                  className="td-form-input"
                  value={exitCondition}
                  onChange={(e) => setExitCondition(e.target.value)}
                  placeholder="e.g. Design Approval Received"
                />
              </div>
            </div>

            <div className="footer">
              <button
                type="button"
                className="td-btn-secondary-wf"
                onClick={handleApplyFormChanges}
              >
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                className="td-btn-primary-wf"
                onClick={handleApplyFormChanges}
                disabled={saving}
              >
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
