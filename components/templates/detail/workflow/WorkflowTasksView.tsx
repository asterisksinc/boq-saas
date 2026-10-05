"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import type { MockWorkflowTask } from "@/lib/templates/types";

interface WorkflowTasksViewProps {
  tasks?: MockWorkflowTask[];
  searchQuery?: string;
  onUpdateTasks?: (tasks: MockWorkflowTask[]) => void;
  onAddTaskClick?: () => void;
}

export default function WorkflowTasksView({
  tasks: propTasks,
  searchQuery = "",
  onUpdateTasks,
  onAddTaskClick,
}: WorkflowTasksViewProps) {
  const [tasks, setTasks] = useState<MockWorkflowTask[]>(
    propTasks || []
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openCriticalityMenuId, setOpenCriticalityMenuId] = useState<string | null>(null);
  const [openStageMenuId, setOpenStageMenuId] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Sync if propTasks changes
  React.useEffect(() => {
    if (propTasks && propTasks.length > 0) {
      setTasks(propTasks);
    }
  }, [propTasks]);

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.stage || "").toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        (t.criticality || "").toLowerCase().includes(q) ||
        t.dependency.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  // Pagination calculation
  const totalCount = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  // Inline update handlers
  const handleCriticalityChange = (taskId: string, newCriticality: "MEDIUM" | "HIGH" | "CRITICAL") => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, criticality: newCriticality } : t));
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

  const handleDuplicateTask = (task: MockWorkflowTask) => {
    const newTask: MockWorkflowTask = {
      ...task,
      id: `tsk-${Date.now()}`,
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
    setOpenActionMenuId(null);
  };

  const getAssigneeInitials = (name: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="td-wf-tasks-container">
      {/* ── 4 KPI Summary Cards (Reference 1 & 2) ─────────────────── */}
      <div className="td-wf-kpi-grid">
        <div className="td-wf-kpi-card">
          <span className="label">Total Tasks</span>
          <span className="val">48</span>
          <span className="sub">All Workflow Stages</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Critical Tasks</span>
          <span className="val">09</span>
          <span className="sub">Requires Attention</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Avg. Duration</span>
          <span className="val">8.4 Days</span>
          <span className="sub">Estimated Average</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Completion Rule</span>
          <span className="val">All Tasks</span>
          <span className="sub">Must be Completed</span>
        </div>
      </div>

      {/* ── Tasks Table ───────────────────────────────────────────── */}
      <div className="td-wf-table-card">
        <div className="td-wf-table-responsive">
          <table className="td-wf-tasks-datatable">
            <thead>
              <tr>
                <th style={{ width: "4%" }} className="center">#</th>
                <th style={{ width: "24%" }}>TASK NAME</th>
                <th style={{ width: "16%" }}>STAGE</th>
                <th style={{ width: "16%" }}>ASSIGNEE</th>
                <th style={{ width: "11%" }}>DURATION</th>
                <th style={{ width: "10%" }}>DEPENDENCY</th>
                <th style={{ width: "11%" }}>CRITICALITY</th>
                <th style={{ width: "8%" }}>STATUS</th>
                <th style={{ width: "4%" }} className="center"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="td-table-empty-row">
                    No tasks match the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  const isCriticalityOpen = openCriticalityMenuId === task.id;
                  const isStageOpen = openStageMenuId === task.id;
                  const isActionOpen = openActionMenuId === task.id;

                  return (
                    <tr key={task.id} className="td-wf-task-row">
                      {/* Column 1: Grip and Row Number */}
                      <td>
                        <div className="td-num-cell">
                          <GripVertical size={13} className="grip-icon" />
                          <span className="num-txt">{rowNumber}</span>
                        </div>
                      </td>

                      {/* Column 2: Task Name */}
                      <td>
                        <span className="td-task-name-text">{task.name}</span>
                      </td>

                      {/* Column 3: Stage Badge Dropdown */}
                      <td>
                        <div className="td-relative-inline">
                          <button
                            type="button"
                            className="td-wf-stage-pill"
                            onClick={() => {
                              setOpenStageMenuId(isStageOpen ? null : task.id);
                              setOpenCriticalityMenuId(null);
                              setOpenActionMenuId(null);
                            }}
                            title="Click to change stage"
                          >
                            <span>{task.stage || "01 Initiation"}</span>
                            <ChevronDown size={12} className="chevron" />
                          </button>

                          {isStageOpen && (
                            <div className="td-wf-dropdown-popover">
                              {["01 Initiation", "02 Design", "03 Costing", "04 Approval", "05 Execution"].map(
                                (stg) => (
                                  <button
                                    key={stg}
                                    type="button"
                                    className={`td-wf-popover-item ${task.stage === stg ? "active" : ""}`}
                                    onClick={() => handleStageChange(task.id, stg)}
                                  >
                                    <span>{stg}</span>
                                    {task.stage === stg && <Check size={12} />}
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Assignee with Avatar Circle */}
                      <td>
                        <div className="td-assignee-cell">
                          <div className="td-assignee-avatar" title={task.assignee}>
                            {getAssigneeInitials(task.assignee)}
                          </div>
                          <span className="td-assignee-name">{task.assignee}</span>
                        </div>
                      </td>

                      {/* Column 5: Duration */}
                      <td>
                        <span className="td-duration-text">{task.duration}</span>
                      </td>

                      {/* Column 6: Dependency */}
                      <td>
                        <span className="td-dependency-text">{task.dependency || "—"}</span>
                      </td>

                      {/* Column 7: Criticality Badge */}
                      <td>
                        <div className="td-relative-inline">
                          <button
                            type="button"
                            className={`td-criticality-pill ${(task.criticality || "MEDIUM").toLowerCase()}`}
                            onClick={() => {
                              setOpenCriticalityMenuId(isCriticalityOpen ? null : task.id);
                              setOpenStageMenuId(null);
                              setOpenActionMenuId(null);
                            }}
                            title="Click to change criticality"
                          >
                            <span>{task.criticality || "MEDIUM"}</span>
                            <ChevronDown size={12} className="chevron" />
                          </button>

                          {isCriticalityOpen && (
                            <div className="td-wf-dropdown-popover">
                              {(["MEDIUM", "HIGH", "CRITICAL"] as const).map((crit) => (
                                <button
                                  key={crit}
                                  type="button"
                                  className={`td-wf-popover-item ${task.criticality === crit ? "active" : ""}`}
                                  onClick={() => handleCriticalityChange(task.id, crit)}
                                >
                                  <span className={`pill-sample ${crit.toLowerCase()}`}>{crit}</span>
                                  {task.criticality === crit && <Check size={12} />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 8: Status Badge */}
                      <td>
                        <span className="td-status-pill status-pill-active">
                          {task.status || "ACTIVE"}
                        </span>
                      </td>

                      {/* Column 9: Row Actions Menu */}
                      <td className="center">
                        <div className="td-relative-inline">
                          <button
                            type="button"
                            className="td-kebab-btn"
                            onClick={() => {
                              setOpenActionMenuId(isActionOpen ? null : task.id);
                              setOpenCriticalityMenuId(null);
                              setOpenStageMenuId(null);
                            }}
                            title="Task actions"
                          >
                            <MoreHorizontal size={15} />
                          </button>

                          {isActionOpen && (
                            <div className="td-wf-action-menu">
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
                                onClick={() => handleDeleteTask(task.id)}
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

        {/* ── Pagination Footer matching reference ──────────────────── */}
        <div className="target-table-pagination-row">
          <div className="target-table-total-count">
            Total Tasks: NA
          </div>

          <div className="target-table-page-nav" role="navigation" aria-label="Pagination">
            <button
              type="button"
              className="target-table-page-btn arrow"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={15} />
            </button>

            {[1, 2, 3, 4, 5].map((pageNum) => (
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
              onClick={() => setCurrentPage((p) => Math.min(5, p + 1))}
              disabled={currentPage === 5}
            >
              <ChevronRight size={15} />
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
              </select>
              <ChevronDown size={14} className="target-table-select-arrow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
