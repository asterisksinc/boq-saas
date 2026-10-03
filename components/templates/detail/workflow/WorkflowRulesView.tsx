"use client";

import React, { useState, useMemo } from "react";
import {
  GripVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Copy,
  Trash2,
  Check,
  Zap,
} from "lucide-react";
import { MockWorkflowRule, mockWorkflowRules } from "@/lib/templates/mock-data";

interface WorkflowRulesViewProps {
  rules?: MockWorkflowRule[];
  searchQuery?: string;
  onUpdateRules?: (rules: MockWorkflowRule[]) => void;
  onAddRuleClick?: () => void;
}

export default function WorkflowRulesView({
  rules: propRules,
  searchQuery = "",
  onUpdateRules,
  onAddRuleClick,
}: WorkflowRulesViewProps) {
  const [rules, setRules] = useState<MockWorkflowRule[]>(
    propRules && propRules.length > 0 ? propRules : mockWorkflowRules
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Sync prop changes
  React.useEffect(() => {
    if (propRules && propRules.length > 0) {
      setRules(propRules);
    }
  }, [propRules]);

  // Filter based on search query
  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) return rules;
    const q = searchQuery.toLowerCase();
    return rules.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.trigger.toLowerCase().includes(q) ||
        r.condition.toLowerCase().includes(q) ||
        r.stage.toLowerCase().includes(q)
    );
  }, [rules, searchQuery]);

  const totalCount = filteredRules.length;
  const paginatedRules = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRules.slice(start, start + pageSize);
  }, [filteredRules, currentPage, pageSize]);

  const handleToggleStatus = (ruleId: string) => {
    const updated = rules.map((r) =>
      r.id === ruleId
        ? { ...r, status: (r.status === "ACTIVE" ? "INACTIVE" : "ACTIVE") as "ACTIVE" | "INACTIVE" }
        : r
    );
    setRules(updated);
    onUpdateRules?.(updated);
  };

  const handleDuplicateRule = (rule: MockWorkflowRule) => {
    const newRule: MockWorkflowRule = {
      ...rule,
      id: `rul-${Date.now()}`,
      name: `${rule.name} (Copy)`,
      code: `RUL-00${rules.length + 1}`,
    };
    const updated = [...rules, newRule];
    setRules(updated);
    onUpdateRules?.(updated);
    setOpenActionMenuId(null);
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    setRules(updated);
    onUpdateRules?.(updated);
    setOpenActionMenuId(null);
  };

  return (
    <div className="td-wf-rules-container">
      {/* ── 4 KPI Summary Cards ────────────────────────────────────── */}
      <div className="td-wf-kpi-grid">
        <div className="td-wf-kpi-card">
          <span className="label">Total Rules</span>
          <span className="val">05</span>
          <span className="sub">Across All Stages</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Active Rules</span>
          <span className="val">04</span>
          <span className="sub">Enforced on Projects</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Automations</span>
          <span className="val">03</span>
          <span className="sub">Auto-triggered</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Exceptions</span>
          <span className="val">01</span>
          <span className="sub">Manual Overrides</span>
        </div>
      </div>

      {/* ── Rules Table ───────────────────────────────────────────── */}
      <div className="td-wf-table-card">
        <div className="td-wf-table-responsive">
          <table className="td-wf-tasks-datatable">
            <thead>
              <tr>
                <th style={{ width: "4%" }} className="center">#</th>
                <th style={{ width: "22%" }}>RULE NAME</th>
                <th style={{ width: "18%" }}>TRIGGER</th>
                <th style={{ width: "18%" }}>CONDITION</th>
                <th style={{ width: "18%" }}>ACTION</th>
                <th style={{ width: "10%" }}>STAGE</th>
                <th style={{ width: "6%" }}>STATUS</th>
                <th style={{ width: "4%" }} className="center"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedRules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="td-table-empty-row">
                    No workflow rules found.
                  </td>
                </tr>
              ) : (
                paginatedRules.map((rule, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  const isActionOpen = openActionMenuId === rule.id;

                  return (
                    <tr key={rule.id} className="td-wf-task-row">
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
                        <div className="td-rule-trigger-cell">
                          <Zap size={13} className="zap-icon" />
                          <span>{rule.trigger}</span>
                        </div>
                      </td>

                      {/* Column 4: Condition */}
                      <td>
                        <span className="td-rule-condition-txt">{rule.condition}</span>
                      </td>

                      {/* Column 5: Action */}
                      <td>
                        <span className="td-rule-action-txt">{rule.action}</span>
                      </td>

                      {/* Column 6: Stage */}
                      <td>
                        <span className="td-wf-stage-pill static">{rule.stage}</span>
                      </td>

                      {/* Column 7: Status */}
                      <td>
                        <button
                          type="button"
                          className={`td-status-pill cursor-pointer ${
                            rule.status === "ACTIVE"
                              ? "status-pill-active"
                              : "status-pill-draft"
                          }`}
                          onClick={() => handleToggleStatus(rule.id)}
                          title="Click to toggle status"
                        >
                          {rule.status}
                        </button>
                      </td>

                      {/* Column 8: Kebab Action */}
                      <td className="center">
                        <div className="td-relative-inline">
                          <button
                            type="button"
                            className="td-kebab-btn"
                            onClick={() =>
                              setOpenActionMenuId(isActionOpen ? null : rule.id)
                            }
                            title="Rule actions"
                          >
                            <MoreHorizontal size={15} />
                          </button>

                          {isActionOpen && (
                            <div className="td-wf-action-menu">
                              <button
                                type="button"
                                className="item"
                                onClick={() => handleDuplicateRule(rule)}
                              >
                                <Copy size={13} />
                                <span>Duplicate</span>
                              </button>
                              <button
                                type="button"
                                className="item danger"
                                onClick={() => handleDeleteRule(rule.id)}
                              >
                                <Trash2 size={13} />
                                <span>Delete Rule</span>
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

        {/* Bottom Pagination Bar */}
        <div className="target-table-pagination-row">
          <div className="target-table-total-count">Total Rules: NA</div>

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
