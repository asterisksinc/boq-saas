"use client";

import React, { useState } from "react";
import {
  GripVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Copy,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  Plus,
} from "lucide-react";
import {
  WorkflowRule,
  formatActionSummary,
} from "@/lib/templates/rules-domain";

interface RulesDataTableProps {
  rules: WorkflowRule[];
  selectedRuleId: string | null;
  onSelectRule: (rule: WorkflowRule) => void;
  onEditRule: (rule: WorkflowRule) => void;
  onDuplicateRule: (rule: WorkflowRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onToggleStatus: (ruleId: string) => void;
  onCreateRuleClick: () => void;
}

export default function RulesDataTable({
  rules,
  selectedRuleId,
  onSelectRule,
  onEditRule,
  onDuplicateRule,
  onDeleteRule,
  onToggleStatus,
  onCreateRuleClick,
}: RulesDataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);

  const totalCount = rules.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Auto-adjust page if rules shrink
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginatedRules = rules.slice(startIdx, startIdx + pageSize);

  const getPriorityBadgeClass = (priority: string) => {
    const pri = (priority || "").toUpperCase();
    if (pri === "CRITICAL") return "td-pri-critical";
    if (pri === "HIGH") return "td-pri-high";
    if (pri === "LOW") return "td-pri-low";
    return "td-pri-medium";
  };

  const getStatusPill = (rule: WorkflowRule) => {
    // If the rule has an approval action or specific status badge
    const approvalAction = rule.actions.find(
      (a) => a.type === "requestApproval" || a.badge?.toLowerCase().includes("approval")
    );
    if (approvalAction && approvalAction.badge) {
      return (
        <span className="td-status-approval-pill">
          {approvalAction.badge}
        </span>
      );
    }
    if (rule.actions.length > 0 && rule.actions[0].badge && rule.actions[0].badge !== "Action") {
      return (
        <span className="td-status-approval-pill">
          {rule.actions[0].badge}
        </span>
      );
    }
    return <span className="td-status-dash">—</span>;
  };

  return (
    <div className="td-wf-table-card">
      <div className="td-wf-table-responsive">
        <table className="td-wf-tasks-datatable td-rules-table">
          <thead>
            <tr>
              <th style={{ width: "4%" }} className="center">#</th>
              <th style={{ width: "26%" }}>RULE NAME</th>
              <th style={{ width: "20%" }}>TRIGGER</th>
              <th style={{ width: "24%" }}>ACTION</th>
              <th style={{ width: "16%" }}>STATUS</th>
              <th style={{ width: "10%" }}>PRIORITY</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRules.length === 0 ? (
              <tr>
                <td colSpan={6} className="td-table-empty-row">
                  <div className="td-empty-rules-state">
                    <p className="empty-title">No workflow rules configured</p>
                    <p className="empty-desc">
                      Create your first workflow rule to automate actions for projects created from this template.
                    </p>
                    <button
                      type="button"
                      className="td-btn-create-rule-empty"
                      onClick={onCreateRuleClick}
                    >
                      <Plus size={14} />
                      <span>+ Create Rule</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRules.map((rule, idx) => {
                const rowNumber = startIdx + idx + 1;
                const isSelected = selectedRuleId === rule.id;
                const isKebabOpen = openKebabId === rule.id;
                const actionInfo = formatActionSummary(rule.actions);
                const triggerTiming = rule.trigger.timing || rule.trigger.evaluate || "Immediately";

                return (
                  <tr
                    key={rule.id}
                    className={`td-wf-task-row td-rule-row ${isSelected ? "selected-row" : ""}`}
                    onClick={() => onSelectRule(rule)}
                  >
                    {/* Column 1: Grip and Number */}
                    <td>
                      <div className="td-num-cell">
                        <GripVertical size={13} className="grip-icon" />
                        <span className="num-txt">{rowNumber}</span>
                      </div>
                    </td>

                    {/* Column 2: Name + Code */}
                    <td>
                      <div className="td-flow-name-cell">
                        <span className="primary-title">{rule.name}</span>
                        <span className="sub-code">{rule.code}</span>
                      </div>
                    </td>

                    {/* Column 3: Trigger */}
                    <td>
                      <div className="td-rule-trigger-cell-stacked">
                        <span className="primary-trigger">{rule.trigger.event}</span>
                        <span className="sub-trigger">{triggerTiming}</span>
                      </div>
                    </td>

                    {/* Column 4: Action */}
                    <td>
                      <div className="td-rule-action-cell-stacked">
                        <span className="primary-action">{actionInfo.primary}</span>
                        {actionInfo.moreCount > 0 ? (
                          <span className="sub-more-actions">
                            + {actionInfo.moreCount} more action{actionInfo.moreCount > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="sub-more-actions single">—</span>
                        )}
                      </div>
                    </td>

                    {/* Column 5: Status */}
                    <td>{getStatusPill(rule)}</td>

                    {/* Column 6: Priority + Kebab / Chevron */}
                    <td>
                      <div className="td-priority-cell-wrap">
                        <span className={`td-pri-badge ${getPriorityBadgeClass(rule.priority)}`}>
                          {(rule.priority || "MEDIUM").toUpperCase()}
                        </span>

                        <div className="td-relative-inline" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="td-kebab-btn"
                            title="Rule Actions"
                            onClick={() => setOpenKebabId(isKebabOpen ? null : rule.id)}
                          >
                            <ChevronDown size={14} className="chevron-icon" />
                          </button>

                          {isKebabOpen && (
                            <div className="td-wf-action-menu">
                              <button
                                type="button"
                                className="item"
                                onClick={() => {
                                  onSelectRule(rule);
                                  setOpenKebabId(null);
                                }}
                              >
                                <Eye size={13} />
                                <span>View Details</span>
                              </button>
                              <button
                                type="button"
                                className="item"
                                onClick={() => {
                                  onEditRule(rule);
                                  setOpenKebabId(null);
                                }}
                              >
                                <Edit3 size={13} />
                                <span>Edit Rule</span>
                              </button>
                              <button
                                type="button"
                                className="item"
                                onClick={() => {
                                  onDuplicateRule(rule);
                                  setOpenKebabId(null);
                                }}
                              >
                                <Copy size={13} />
                                <span>Duplicate</span>
                              </button>
                              <button
                                type="button"
                                className="item"
                                onClick={() => {
                                  onToggleStatus(rule.id);
                                  setOpenKebabId(null);
                                }}
                              >
                                <CheckCircle size={13} />
                                <span>
                                  {rule.status === "ACTIVE" ? "Deactivate" : "Activate"}
                                </span>
                              </button>
                              <button
                                type="button"
                                className="item danger"
                                onClick={() => {
                                  onDeleteRule(rule.id);
                                  setOpenKebabId(null);
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Delete Rule</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Bottom Pagination Bar ─────────────────────────────────── */}
      <div className="target-table-pagination-row">
        <div className="target-table-total-count">
          Total Rules: {totalCount}
        </div>

        <div className="target-table-page-nav" role="navigation" aria-label="Pagination">
          <button
            type="button"
            className="target-table-page-btn arrow"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            <ChevronLeft size={15} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              className={`target-table-page-btn ${safePage === pageNum ? "active" : ""}`}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            className="target-table-page-btn arrow"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
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
  );
}
