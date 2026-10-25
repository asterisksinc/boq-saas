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
  Flag,
} from "lucide-react";
import {
  WorkflowRule,
  RulePriority,
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
  onUpdatePriority?: (ruleId: string, priority: RulePriority) => void;
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
  onUpdatePriority,
  onCreateRuleClick,
}: RulesDataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);
  const [openPriorityId, setOpenPriorityId] = useState<string | null>(null);

  const totalCount = rules.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Auto-adjust page if rules shrink
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginatedRules = rules.slice(startIdx, startIdx + pageSize);

  const getPriorityClass = (priority: string) => {
    const pri = (priority || "").toUpperCase();
    if (pri === "CRITICAL") return "pri-critical";
    if (pri === "HIGH") return "pri-high";
    if (pri === "LOW") return "pri-low";
    return "pri-medium";
  };

  const getStatusBadge = (rule: WorkflowRule) => {
    // Check if the rule has an approval flow / badge
    const approvalAction = rule.actions.find(
      (a) => a.type === "requestApproval" || a.badge?.toLowerCase().includes("approval")
    );
    if (approvalAction && approvalAction.badge) {
      return <span className="td-rule-status-pill">{approvalAction.badge}</span>;
    }
    if (rule.approval?.flowName) {
      return <span className="td-rule-status-pill">{rule.approval.flowName}</span>;
    }
    if (rule.actions.length > 0 && rule.actions[0].badge && rule.actions[0].badge !== "Action") {
      return <span className="td-rule-status-pill">{rule.actions[0].badge}</span>;
    }
    return <span className="td-rule-status-dash">—</span>;
  };

  const formatDate = (isoOrStr?: string | null) => {
    if (!isoOrStr) return "12 Aug 2026";
    try {
      const d = new Date(isoOrStr);
      if (isNaN(d.getTime())) return String(isoOrStr);
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return String(isoOrStr);
    }
  };

  return (
    <div className="td-wf-rules-table-wrapper" style={{ width: "100%", overflowX: "auto" }}>
      <table className="td-wf-rules-datatable" role="table">
        <thead>
          <tr role="row">
            {/* 1. Grip */}
            <th style={{ width: "32px", padding: "8px 4px 8px 12px" }}></th>
            {/* 2. # */}
            <th className="center" style={{ width: "32px", padding: "8px 8px" }}>#</th>
            {/* 3. RULE NAME */}
            <th style={{ width: "269px" }}>RULE NAME</th>
            {/* 4. TRIGGER */}
            <th style={{ width: "191px" }}>TRIGGER</th>
            {/* 5. ACTION */}
            <th style={{ width: "180px" }}>ACTION</th>
            {/* 6. STATUS */}
            <th style={{ width: "155px" }}>STATUS</th>
            {/* 7. PRIORITY */}
            <th style={{ width: "138px" }}>PRIORITY</th>
            {/* 8. EXECUTED */}
            <th className="center" style={{ width: "89px" }}>EXECUTED</th>
            {/* 9. LAST UPDATED */}
            <th className="center" style={{ width: "139px" }}>LAST UPDATED</th>
            {/* 10. ACTIONS */}
            <th className="center" style={{ width: "64px" }}></th>
          </tr>
        </thead>
        <tbody>
          {paginatedRules.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ textAlign: "center", padding: "48px 20px" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 600, color: "#0F172A" }}>
                  No workflow rules configured
                </p>
                <p style={{ margin: "0 0 20px 0", fontSize: 14, color: "#64748B" }}>
                  Create your first workflow rule to automate actions for projects created from this template.
                </p>
                <button
                  type="button"
                  className="td-rule-cat-btn active"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: "0 auto", cursor: "pointer" }}
                  onClick={onCreateRuleClick}
                >
                  <Plus size={14} />
                  <span>+ Create Rule</span>
                </button>
              </td>
            </tr>
          ) : (
            paginatedRules.map((rule, idx) => {
              const rowNumber = startIdx + idx + 1;
              const isSelected = selectedRuleId === rule.id;
              const isKebabOpen = openKebabId === rule.id;
              const isPriorityOpen = openPriorityId === rule.id;
              const actionInfo = formatActionSummary(rule.actions);
              const triggerTiming = rule.trigger.timing || rule.trigger.evaluate || "Immediately";

              return (
                <tr
                  key={rule.id}
                  className={`td-rule-row ${isSelected ? "selected-row" : ""}`}
                  onClick={() => onSelectRule(rule)}
                >
                  {/* Column 1: Grip drag icon */}
                  <td style={{ width: "32px", padding: "8px 4px 8px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#B8B9B9", cursor: "grab" }}>
                      <GripVertical size={14} />
                    </div>
                  </td>

                  {/* Column 2: # */}
                  <td className="center" style={{ width: "32px", padding: "8px 8px" }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#64748B" }}>
                      {String(rowNumber).padStart(2, "0")}
                    </span>
                  </td>

                  {/* Column 3: RULE NAME */}
                  <td>
                    <div className="td-rule-name-cell">
                      <span className="rule-title">{rule.name}</span>
                      <span className="rule-code">{rule.code}</span>
                    </div>
                  </td>

                  {/* Column 4: TRIGGER */}
                  <td>
                    <div className="td-rule-trigger-cell">
                      <span className="trigger-event">{rule.trigger.event}</span>
                      <span className="trigger-timing">{triggerTiming}</span>
                    </div>
                  </td>

                  {/* Column 5: ACTION */}
                  <td>
                    <div className="td-rule-action-cell">
                      <span className="action-main">{actionInfo.primary}</span>
                      {actionInfo.moreCount > 0 ? (
                        <span className="action-more">
                          + {actionInfo.moreCount} more action{actionInfo.moreCount > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="action-more">—</span>
                      )}
                    </div>
                  </td>

                  {/* Column 6: STATUS */}
                  <td>{getStatusBadge(rule)}</td>

                  {/* Column 7: PRIORITY */}
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <button
                        type="button"
                        className={`td-rule-priority-pill ${getPriorityClass(rule.priority)}`}
                        style={{
                          border: "none",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                        onClick={() => setOpenPriorityId(isPriorityOpen ? null : rule.id)}
                        title="Click to change priority"
                      >
                        <Flag size={11} style={{ fill: "currentColor" }} />
                        <span>{(rule.priority || "MEDIUM").toUpperCase()}</span>
                        <ChevronDown size={10} style={{ opacity: 0.7 }} />
                      </button>

                      {isPriorityOpen && (
                        <div
                          style={{
                            position: "absolute",
                            top: 26,
                            left: 0,
                            zIndex: 40,
                            background: "#FFFFFF",
                            borderRadius: 6,
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                            minWidth: 110,
                            padding: "4px 0",
                          }}
                        >
                          {(["Critical", "High", "Medium", "Low"] as RulePriority[]).map((pri) => (
                            <button
                              key={pri}
                              type="button"
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "6px 12px",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                              onClick={() => {
                                onUpdatePriority?.(rule.id, pri);
                                setOpenPriorityId(null);
                              }}
                            >
                              <span
                                className={`td-rule-priority-pill ${getPriorityClass(pri)}`}
                                style={{ fontSize: 11, padding: "2px 6px" }}
                              >
                                <Flag size={9} style={{ fill: "currentColor" }} />
                                {pri.toUpperCase()}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Column 8: EXECUTED */}
                  <td className="center">
                    <span className="td-rule-executed-cell">
                      {rule.executedCount ?? 0}
                    </span>
                  </td>

                  {/* Column 9: LAST UPDATED */}
                  <td className="center">
                    <span className="td-rule-updated-cell">
                      {formatDate(rule.lastUpdated || rule.updatedAt)}
                    </span>
                  </td>

                  {/* Column 10: KEBAB ACTIONS */}
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <button
                        type="button"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#64748B",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                          borderRadius: 4,
                        }}
                        title="Rule Actions"
                        onClick={() => setOpenKebabId(isKebabOpen ? null : rule.id)}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {isKebabOpen && (
                        <div
                          style={{
                            position: "absolute",
                            top: 28,
                            right: 0,
                            zIndex: 50,
                            background: "#FFFFFF",
                            borderRadius: 6,
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                            minWidth: 150,
                            padding: "6px 0",
                          }}
                        >
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 12px",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              fontSize: 13,
                              color: "#0F172A",
                              textAlign: "left",
                            }}
                            onClick={() => {
                              onSelectRule(rule);
                              setOpenKebabId(null);
                            }}
                          >
                            <Eye size={13} color="#64748B" />
                            <span>View Details</span>
                          </button>
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 12px",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              fontSize: 13,
                              color: "#0F172A",
                              textAlign: "left",
                            }}
                            onClick={() => {
                              onEditRule(rule);
                              setOpenKebabId(null);
                            }}
                          >
                            <Edit3 size={13} color="#64748B" />
                            <span>Edit Rule</span>
                          </button>
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 12px",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              fontSize: 13,
                              color: "#0F172A",
                              textAlign: "left",
                            }}
                            onClick={() => {
                              onDuplicateRule(rule);
                              setOpenKebabId(null);
                            }}
                          >
                            <Copy size={13} color="#64748B" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 12px",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              fontSize: 13,
                              color: "#0F172A",
                              textAlign: "left",
                            }}
                            onClick={() => {
                              onToggleStatus(rule.id);
                              setOpenKebabId(null);
                            }}
                          >
                            <CheckCircle size={13} color="#64748B" />
                            <span>
                              {rule.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            </span>
                          </button>
                          <hr style={{ border: "none", borderTop: "1px solid #EBEBEB", margin: "4px 0" }} />
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 12px",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              fontSize: 13,
                              color: "#DC2626",
                              textAlign: "left",
                            }}
                            onClick={() => {
                              onDeleteRule(rule.id);
                              setOpenKebabId(null);
                            }}
                          >
                            <Trash2 size={13} color="#DC2626" />
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

      {/* ── Bottom Pagination Bar (Figma Frame 2147225166) ────────────────── */}
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
            aria-label="Previous Page"
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
            aria-label="Next Page"
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
