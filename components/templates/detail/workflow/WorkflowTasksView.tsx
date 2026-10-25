"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  GripVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  Plus,
  Check,
  X,
  AlertCircle,
  Clock,
  Layers,
  User,
  Sparkles,
} from "lucide-react";
import type { MockWorkflowTask } from "@/lib/templates/types";
import type { WorkflowStageItem } from "./WorkflowStagesView";

interface WorkflowTasksViewProps {
  tasks?: MockWorkflowTask[];
  stages?: WorkflowStageItem[];
  searchQuery?: string;
  statusFilter?: string;
  onUpdateTasks?: (tasks: MockWorkflowTask[]) => void;
  onAddTaskClick?: () => void;
  onSaveBackend?: () => void;
  saving?: boolean;
  saveSuccess?: boolean;
  saveError?: string | null;
}

const DEFAULT_STAGES = [
  "01 Initiation",
  "02 Design",
  "03 Costing",
  "04 Approval",
  "05 Execution",
];

export default function WorkflowTasksView({
  tasks: propTasks,
  stages = [],
  searchQuery = "",
  statusFilter = "All",
  onUpdateTasks,
  onAddTaskClick,
  onSaveBackend,
  saving = false,
  saveSuccess = false,
  saveError = null,
}: WorkflowTasksViewProps) {
  // Local synchronized state for immediate UI updates
  const [tasks, setTasks] = useState<MockWorkflowTask[]>(propTasks || []);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dropdown popover IDs
  const [openCriticalityMenuId, setOpenCriticalityMenuId] = useState<string | null>(null);
  const [openStageMenuId, setOpenStageMenuId] = useState<string | null>(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Modals state
  const [editingTask, setEditingTask] = useState<MockWorkflowTask | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [formName, setFormName] = useState("");
  const [formStage, setFormStage] = useState("01 Initiation");
  const [formAssignee, setFormAssignee] = useState("Project Manager");
  const [formDuration, setFormDuration] = useState("2 Days");
  const [formDependency, setFormDependency] = useState("01");
  const [formCriticality, setFormCriticality] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "COMPLETED" | "DRAFT">("ACTIVE");

  // Sync if propTasks changes from parent/Supabase
  useEffect(() => {
    if (propTasks) {
      setTasks(propTasks);
    }
  }, [propTasks]);

  // Available stage names list
  const availableStages = useMemo(() => {
    if (stages && stages.length > 0) {
      return stages.map((s) => s.name);
    }
    return DEFAULT_STAGES;
  }, [stages]);

  // Close menus on outside click
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".td-relative-inline")) {
        setOpenCriticalityMenuId(null);
        setOpenStageMenuId(null);
        setOpenStatusMenuId(null);
        setOpenActionMenuId(null);
      }
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Filter tasks based on searchQuery and statusFilter
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Status filter
      if (statusFilter && statusFilter !== "All") {
        const tStatus = (t.status || "ACTIVE").toUpperCase();
        if (tStatus !== statusFilter.toUpperCase()) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (t.name || "").toLowerCase().includes(q);
        const matchesStage = (t.stage || "").toLowerCase().includes(q);
        const matchesAssignee = (t.assignee || t.assigneeRole || "").toLowerCase().includes(q);
        const matchesCriticality = (t.criticality || "").toLowerCase().includes(q);
        const matchesDependency = (t.dependency || "").toLowerCase().includes(q);
        const matchesDuration = (t.duration || "").toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesStage &&
          !matchesAssignee &&
          !matchesCriticality &&
          !matchesDependency &&
          !matchesDuration
        ) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter]);

  // Pagination calculation
  const totalCount = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  // KPI Metrics Calculations
  const totalTasks = tasks.length;
  const criticalTasks = tasks.filter(
    (t) => (t.criticality || "").toUpperCase() === "CRITICAL"
  ).length;

  const avgDuration = useMemo(() => {
    if (tasks.length === 0) return "0 Days";
    let totalDays = 0;
    let count = 0;
    tasks.forEach((t) => {
      const days = t.durationDays || parseFloat((t.duration || "").match(/(\d+(\.\d+)?)/)?.[1] || "0");
      if (days > 0) {
        totalDays += days;
        count++;
      }
    });
    if (count === 0) return "0 Days";
    const avg = totalDays / count;
    return `${avg % 1 === 0 ? avg.toFixed(0) : avg.toFixed(1)} Days`;
  }, [tasks]);

  // Inline update handlers
  const handleCriticalityChange = (taskId: string, newCrit: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, criticality: newCrit } : t));
    setTasks(updated);
    onUpdateTasks?.(updated);
    setOpenCriticalityMenuId(null);
  };

  const handleStageChange = (taskId: string, newStage: string) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, stage: newStage } : t));
    setTasks(updated);
    onUpdateTasks?.(updated);
    setOpenStageMenuId(null);
  };

  const handleStatusChange = (taskId: string, newStatus: "ACTIVE" | "COMPLETED" | "DRAFT") => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
    setTasks(updated);
    onUpdateTasks?.(updated);
    setOpenStatusMenuId(null);
  };

  const handleDuplicateTask = (task: MockWorkflowTask) => {
    const newTask: MockWorkflowTask = {
      ...task,
      id: `tsk-${Date.now()}`,
      code: `TSK-00${tasks.length + 1}`,
      name: `${task.name} (Copy)`,
      order: (task.order || tasks.length) + 1,
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    onUpdateTasks?.(updated);
    setOpenActionMenuId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    onUpdateTasks?.(updated);
    setDeletingTaskId(null);
    setOpenActionMenuId(null);
  };

  // Open Edit Modal
  const openEditModal = (task: MockWorkflowTask) => {
    setEditingTask(task);
    setFormName(task.name);
    setFormStage(task.stage || availableStages[0] || "01 Initiation");
    setFormAssignee(task.assignee || task.assigneeRole || "Project Manager");
    setFormDuration(task.duration || "2 Days");
    setFormDependency(task.dependency || "—");
    setFormCriticality((task.criticality?.toUpperCase() as any) || "MEDIUM");
    setFormStatus((task.status?.toUpperCase() as any) || "ACTIVE");
    setOpenActionMenuId(null);
  };

  const saveEditModal = () => {
    if (!editingTask || !formName.trim()) return;
    const durMatch = formDuration.match(/(\d+(\.\d+)?)/);
    const durationDays = durMatch ? parseFloat(durMatch[1]) : 1;

    const updated = tasks.map((t) =>
      t.id === editingTask.id
        ? {
            ...t,
            name: formName.trim(),
            stage: formStage,
            assignee: formAssignee.trim(),
            assigneeRole: formAssignee.trim(),
            duration: formDuration.trim().endsWith("Days") ? formDuration.trim() : `${formDuration.trim()} Days`,
            durationDays,
            dependency: formDependency.trim() || "—",
            criticality: formCriticality,
            status: formStatus,
          }
        : t
    );
    setTasks(updated);
    onUpdateTasks?.(updated);
    setEditingTask(null);
  };

  // Open Add Modal
  const openAddModal = () => {
    if (onAddTaskClick) {
      onAddTaskClick();
      return;
    }
    setFormName("");
    setFormStage(availableStages[0] || "01 Initiation");
    setFormAssignee("Project Manager");
    setFormDuration("2 Days");
    setFormDependency("01");
    setFormCriticality("MEDIUM");
    setFormStatus("ACTIVE");
    setIsAddModalOpen(true);
  };

  const saveAddModal = () => {
    if (!formName.trim()) return;
    const durMatch = formDuration.match(/(\d+(\.\d+)?)/);
    const durationDays = durMatch ? parseFloat(durMatch[1]) : 1;

    const newTask: MockWorkflowTask = {
      id: `tsk-${Date.now()}`,
      code: `TSK-00${tasks.length + 1}`,
      name: formName.trim(),
      stage: formStage,
      assignee: formAssignee.trim(),
      assigneeRole: formAssignee.trim(),
      duration: formDuration.trim().endsWith("Days") ? formDuration.trim() : `${formDuration.trim()} Days`,
      durationDays,
      dependency: formDependency.trim() || "—",
      criticality: formCriticality,
      status: formStatus,
      approval: "No",
      order: tasks.length + 1,
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    onUpdateTasks?.(updated);
    setIsAddModalOpen(false);
  };

  const getAssigneeInitials = (name?: string) => {
    if (!name) return "PM";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="td-wf-tasks-container">
      {/* ── 4 KPI Metrics Summary Cards (Figma Frame 2147225138) ──────── */}
      <div className="td-wf-kpi-grid">
        {/* Card 1: Total Tasks (Frame 93) */}
        <div className="td-wf-kpi-card">
          <span className="label">Total Tasks</span>
          <span className="val">{String(totalTasks).padStart(2, "0")}</span>
          <span className="sub">All Workflow Stages</span>
        </div>

        {/* Card 2: Critical Tasks (Frame 2147225072) */}
        <div className="td-wf-kpi-card">
          <span className="label">Critical Tasks</span>
          <span className="val">{String(criticalTasks).padStart(2, "0")}</span>
          <span className="sub">Requires Attention</span>
        </div>

        {/* Card 3: Avg. Duration (Frame 2147225073) */}
        <div className="td-wf-kpi-card">
          <span className="label">Avg. Duration</span>
          <span className="val">{avgDuration}</span>
          <span className="sub">Estimated Average</span>
        </div>

        {/* Card 4: Completion Rule (Frame 2147225071) */}
        <div className="td-wf-kpi-card">
          <span className="label">Completion Rule</span>
          <span className="val">All Tasks</span>
          <span className="sub">Must be Completed</span>
        </div>
      </div>

      {/* ── Backend Save Status Indicator ───────────────────────────── */}
      {saving && (
        <div className="td-alert-info">
          <Sparkles size={14} className="animate-spin" />
          <span>Syncing workflow tasks with Supabase...</span>
        </div>
      )}
      {saveSuccess && (
        <div className="td-alert-success">
          <Check size={14} />
          <span>Workflow tasks saved successfully to Supabase!</span>
        </div>
      )}
      {saveError && (
        <div className="td-alert-error">
          <AlertCircle size={14} />
          <span>{saveError}</span>
        </div>
      )}

      {/* ── Main Tasks Table Card Container (Figma Frame 2147225085 & 2147225072) ── */}
      <div className="td-wf-tasks-table-card">
        <div className="td-wf-table-responsive">
          <table className="td-wf-tasks-datatable">
            <thead>
              <tr>
                {/* 1. Drag indicator header (Frame 25) */}
                <th style={{ width: "32px", minWidth: "32px" }} className="center"></th>
                {/* 2. # Sequence header (Frame 26) */}
                <th style={{ width: "32px", minWidth: "32px" }} className="center">#</th>
                {/* 3. Task Name (Frame 5) */}
                <th style={{ width: "268px", minWidth: "220px" }}>TASK NAME</th>
                {/* 4. Stage (Frame 19) */}
                <th style={{ width: "146px", minWidth: "130px" }}>STAGE</th>
                {/* 5. Assignee (Frame 27) */}
                <th style={{ width: "183px", minWidth: "160px" }}>ASSIGNEE</th>
                {/* 6. Duration (Frame 21) */}
                <th style={{ width: "147px", minWidth: "110px" }}>DURATION</th>
                {/* 7. Dependency (Frame 11) */}
                <th style={{ width: "131px", minWidth: "100px" }} className="center">DEPENDENCY</th>
                {/* 8. Criticality (Frame 32) */}
                <th style={{ width: "145px", minWidth: "125px" }}>CRITICALITY</th>
                {/* 9. Status (Frame 33) */}
                <th style={{ width: "146px", minWidth: "120px" }}>STATUS</th>
                {/* 10. Actions Kebab (Frame 12) */}
                <th style={{ width: "64px", minWidth: "64px" }} className="center"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="td-tasks-empty-state">
                      <div className="empty-icon">
                        <Layers size={22} />
                      </div>
                      <h4 className="empty-title">
                        {searchQuery || (statusFilter && statusFilter !== "All")
                          ? "No matching tasks found"
                          : "No tasks configured"}
                      </h4>
                      <p className="empty-desc">
                        {searchQuery || (statusFilter && statusFilter !== "All")
                          ? "Try adjusting your search criteria or resetting filters."
                          : "Add tasks to define the step-by-step execution roadmap for this template."}
                      </p>
                      <button
                        type="button"
                        className="td-tasks-empty-btn"
                        onClick={openAddModal}
                      >
                        <Plus size={14} />
                        <span>Add Task</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  const isCriticalityOpen = openCriticalityMenuId === task.id;
                  const isStageOpen = openStageMenuId === task.id;
                  const isStatusOpen = openStatusMenuId === task.id;
                  const isActionOpen = openActionMenuId === task.id;

                  const currentCrit = (task.criticality || "MEDIUM").toUpperCase();
                  const currentStatus = (task.status || "ACTIVE").toUpperCase();
                  const assigneeDisplayName = task.assignee || task.assigneeRole || "Project Manager";

                  return (
                    <tr key={task.id || `task-${idx}`} className="td-wf-task-row">
                      {/* 1. Drag indicator handle */}
                      <td className="center">
                        <span className="grip-icon" title="Drag to reorder">
                          <GripVertical size={14} />
                        </span>
                      </td>

                      {/* 2. Sequence row number */}
                      <td className="center">
                        <span className="num-txt">{rowNumber}</span>
                      </td>

                      {/* 3. Task Name */}
                      <td>
                        <span
                          className="td-task-name-text"
                          onClick={() => openEditModal(task)}
                          style={{ cursor: "pointer" }}
                          title="Click to edit task"
                        >
                          {task.name}
                        </span>
                      </td>

                      {/* 4. Stage badge with click-to-change popover */}
                      <td>
                        <div className="td-relative-inline">
                          <button
                            type="button"
                            className="td-wf-stage-pill"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenStageMenuId(isStageOpen ? null : task.id);
                              setOpenCriticalityMenuId(null);
                              setOpenStatusMenuId(null);
                              setOpenActionMenuId(null);
                            }}
                            title="Click to change stage"
                          >
                            <span>{task.stage || availableStages[0] || "01 Initiation"}</span>
                            <ChevronDown size={11} className="chevron" />
                          </button>

                          {isStageOpen && (
                            <div className="td-wf-dropdown-popover">
                              {availableStages.map((stg) => (
                                <button
                                  key={stg}
                                  type="button"
                                  className={`td-wf-popover-item ${task.stage === stg ? "active" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStageChange(task.id, stg);
                                  }}
                                >
                                  <span>{stg}</span>
                                  {task.stage === stg && <Check size={12} />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Assignee with circular 24px avatar */}
                      <td>
                        <div className="td-assignee-cell">
                          <div
                            className="td-assignee-avatar"
                            title={assigneeDisplayName}
                          >
                            {getAssigneeInitials(assigneeDisplayName)}
                          </div>
                          <span className="td-assignee-name">{assigneeDisplayName}</span>
                        </div>
                      </td>

                      {/* 6. Duration */}
                      <td>
                        <span className="td-duration-text">
                          {task.duration || `${task.durationDays || 1} Days`}
                        </span>
                      </td>

                      {/* 7. Dependency */}
                      <td className="center">
                        <span className="td-dependency-text">
                          {task.dependency || "—"}
                        </span>
                      </td>

                      {/* 8. Criticality pill with exact Figma colors */}
                      <td>
                        <div className="td-relative-inline">
                          <button
                            type="button"
                            className={`td-criticality-pill ${currentCrit.toLowerCase()}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenCriticalityMenuId(isCriticalityOpen ? null : task.id);
                              setOpenStageMenuId(null);
                              setOpenStatusMenuId(null);
                              setOpenActionMenuId(null);
                            }}
                            title="Click to change criticality"
                          >
                            <span>{currentCrit}</span>
                            <ChevronDown size={11} className="chevron" />
                          </button>

                          {isCriticalityOpen && (
                            <div className="td-wf-dropdown-popover">
                              {(["MEDIUM", "HIGH", "CRITICAL", "LOW"] as const).map((crit) => (
                                <button
                                  key={crit}
                                  type="button"
                                  className={`td-wf-popover-item ${currentCrit === crit ? "active" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCriticalityChange(task.id, crit);
                                  }}
                                >
                                  <span className={`pill-sample ${crit.toLowerCase()}`}>{crit}</span>
                                  {currentCrit === crit && <Check size={12} />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 9. Status pill with click-to-change popover */}
                      <td>
                        <div className="td-relative-inline">
                          <button
                            type="button"
                            className={`td-status-pill-btn ${currentStatus.toLowerCase()}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenStatusMenuId(isStatusOpen ? null : task.id);
                              setOpenCriticalityMenuId(null);
                              setOpenStageMenuId(null);
                              setOpenActionMenuId(null);
                            }}
                            title="Click to change status"
                          >
                            <span>{currentStatus}</span>
                            <ChevronDown size={11} className="chevron" />
                          </button>

                          {isStatusOpen && (
                            <div className="td-wf-dropdown-popover">
                              {(["ACTIVE", "COMPLETED", "DRAFT"] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  className={`td-wf-popover-item ${currentStatus === st ? "active" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(task.id, st);
                                  }}
                                >
                                  <span className={`pill-sample ${st.toLowerCase()}`}>{st}</span>
                                  {currentStatus === st && <Check size={12} />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 10. Actions Kebab button & popover */}
                      <td className="center">
                        <div className="td-relative-inline">
                          <button
                            type="button"
                            className="td-kebab-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(isActionOpen ? null : task.id);
                              setOpenCriticalityMenuId(null);
                              setOpenStageMenuId(null);
                              setOpenStatusMenuId(null);
                            }}
                            title="Task actions"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {isActionOpen && (
                            <div className="td-wf-action-menu">
                              <button
                                type="button"
                                className="item"
                                onClick={() => openEditModal(task)}
                              >
                                <Edit2 size={13} />
                                <span>Edit Task</span>
                              </button>
                              <button
                                type="button"
                                className="item"
                                onClick={() => handleDuplicateTask(task)}
                              >
                                <Copy size={13} />
                                <span>Duplicate</span>
                              </button>
                              <button
                                type="button"
                                className="item danger"
                                onClick={() => setDeletingTaskId(task.id)}
                              >
                                <Trash2 size={13} />
                                <span>Delete Task</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer Row (Figma Frame 2147225166 & 2147225167) ── */}
        <div className="target-table-pagination-row">
          <div className="target-table-total-count">
            Total Tasks: {filteredTasks.length}
          </div>

          <div className="target-table-page-nav" role="navigation" aria-label="Pagination">
            <button
              type="button"
              className="target-table-page-btn arrow"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`target-table-page-btn ${currentPage === pageNum ? "active" : ""}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              className="target-table-page-btn arrow"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="target-table-page-size-wrap">
            <span className="target-table-page-size-label">Show per Page:</span>
            <div className="target-table-page-size-select-wrap">
              <select
                className="target-table-page-size-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown size={14} className="target-table-select-arrow" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Task Modal ─────────────────────────────────────────── */}
      {editingTask && (
        <div className="td-modal-overlay" onClick={() => setEditingTask(null)}>
          <div
            className="td-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px" }}
          >
            <div className="td-modal-header">
              <div className="title-wrap">
                <Edit2 size={16} className="title-icon" />
                <h3 className="title">Edit Task Details</h3>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setEditingTask(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="td-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="label">Task Name *</label>
                <input
                  type="text"
                  className="input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Client Briefing & Requirement"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="label">Stage</label>
                  <select
                    className="select"
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value)}
                  >
                    {availableStages.map((stg) => (
                      <option key={stg} value={stg}>
                        {stg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Assignee / Role</label>
                  <input
                    type="text"
                    className="input"
                    value={formAssignee}
                    onChange={(e) => setFormAssignee(e.target.value)}
                    placeholder="e.g. Project Manager"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="label">Duration (Days)</label>
                  <input
                    type="text"
                    className="input"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="e.g. 2 Days"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Predecessor / Dependency</label>
                  <input
                    type="text"
                    className="input"
                    value={formDependency}
                    onChange={(e) => setFormDependency(e.target.value)}
                    placeholder="e.g. 01 or —"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="label">Criticality</label>
                  <select
                    className="select"
                    value={formCriticality}
                    onChange={(e) => setFormCriticality(e.target.value as any)}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Status</label>
                  <select
                    className="select"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="td-modal-footer">
              <button
                type="button"
                className="td-btn-secondary"
                onClick={() => setEditingTask(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="td-btn-primary"
                onClick={saveEditModal}
                disabled={!formName.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Internal Add Task Modal Fallback ─────────────────────────── */}
      {isAddModalOpen && (
        <div className="td-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="td-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px" }}
          >
            <div className="td-modal-header">
              <div className="title-wrap">
                <Plus size={16} className="title-icon" />
                <h3 className="title">Add New Workflow Task</h3>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="td-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="label">Task Name *</label>
                <input
                  type="text"
                  className="input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Concept Development"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="label">Stage</label>
                  <select
                    className="select"
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value)}
                  >
                    {availableStages.map((stg) => (
                      <option key={stg} value={stg}>
                        {stg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Assignee / Role</label>
                  <input
                    type="text"
                    className="input"
                    value={formAssignee}
                    onChange={(e) => setFormAssignee(e.target.value)}
                    placeholder="e.g. Lead Designer"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="label">Duration (Days)</label>
                  <input
                    type="text"
                    className="input"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="e.g. 5 Days"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Predecessor / Dependency</label>
                  <input
                    type="text"
                    className="input"
                    value={formDependency}
                    onChange={(e) => setFormDependency(e.target.value)}
                    placeholder="e.g. 02 or —"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="label">Criticality</label>
                  <select
                    className="select"
                    value={formCriticality}
                    onChange={(e) => setFormCriticality(e.target.value as any)}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Status</label>
                  <select
                    className="select"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="td-modal-footer">
              <button
                type="button"
                className="td-btn-secondary"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="td-btn-primary"
                onClick={saveAddModal}
                disabled={!formName.trim()}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────── */}
      {deletingTaskId && (
        <div className="td-modal-overlay" onClick={() => setDeletingTaskId(null)}>
          <div
            className="td-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px" }}
          >
            <div className="td-modal-header">
              <div className="title-wrap">
                <Trash2 size={16} className="title-icon" style={{ color: "#DC2626" }} />
                <h3 className="title">Delete Task</h3>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setDeletingTaskId(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="td-modal-body">
              <p style={{ fontFamily: "Urbanist, sans-serif", fontSize: "14px", color: "#64748B", margin: 0 }}>
                Are you sure you want to remove this workflow task? This action cannot be undone.
              </p>
            </div>
            <div className="td-modal-footer">
              <button
                type="button"
                className="td-btn-secondary"
                onClick={() => setDeletingTaskId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="td-btn-danger"
                style={{
                  background: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0 16px",
                  height: "38px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
                onClick={() => handleDeleteTask(deletingTaskId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
