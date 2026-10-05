"use client";

import React, { useState, useMemo } from "react";
import {
  GripVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Check,
  Plus,
  Copy,
  Trash2,
  ExternalLink,
} from "lucide-react";
import type {
  MockApprovalFlow,
  MockApprover,
} from "@/lib/templates/types";

interface WorkflowApprovalsViewProps {
  approvals?: MockApprovalFlow[];
  searchQuery?: string;
  onUpdateApprovals?: (approvals: MockApprovalFlow[]) => void;
  onAddApprovalClick?: () => void;
}

export default function WorkflowApprovalsView({
  approvals: propApprovals,
  searchQuery = "",
  onUpdateApprovals,
  onAddApprovalClick,
}: WorkflowApprovalsViewProps) {
  const [approvals, setApprovals] = useState<MockApprovalFlow[]>(
    propApprovals && Array.isArray(propApprovals) && propApprovals.length > 0
      ? propApprovals
      : []
  );

  const [selectedFlowId, setSelectedFlowId] = useState<string>("apr-1");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Sync prop changes
  React.useEffect(() => {
    if (propApprovals && propApprovals.length > 0) {
      setApprovals(propApprovals);
    }
  }, [propApprovals]);

  // Filter based on search query
  const filteredApprovals = useMemo(() => {
    if (!searchQuery.trim()) return approvals;
    const q = searchQuery.toLowerCase();
    return approvals.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.triggerTitle.toLowerCase().includes(q) ||
        a.triggerDescription.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
    );
  }, [approvals, searchQuery]);

  const totalCount = filteredApprovals.length;
  const paginatedApprovals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApprovals.slice(start, start + pageSize);
  }, [filteredApprovals, currentPage, pageSize]);

  const selectedFlow =
    approvals.find((a) => a.id === selectedFlowId) || approvals[0];

  const handleRowClick = (flow: MockApprovalFlow) => {
    setSelectedFlowId(flow.id);
    setIsInspectorOpen(true);
  };

  const handleDuplicateFlow = (flow: MockApprovalFlow) => {
    const newFlow: MockApprovalFlow = {
      ...flow,
      id: `apr-${Date.now()}`,
      name: `${flow.name} (Copy)`,
      code: `APR-TPL-00${approvals.length + 1}`,
      status: "DRAFT",
    };
    const updated = [...approvals, newFlow];
    setApprovals(updated);
    onUpdateApprovals?.(updated);
    setSelectedFlowId(newFlow.id);
    setOpenActionMenuId(null);
  };

  const handleDeleteFlow = (id: string) => {
    const updated = approvals.filter((a) => a.id !== id);
    setApprovals(updated);
    onUpdateApprovals?.(updated);
    if (selectedFlowId === id && updated.length > 0) {
      setSelectedFlowId(updated[0].id);
    }
    setOpenActionMenuId(null);
  };

  const renderApproverBubble = (approver: MockApprover, key: string | number) => {
    return (
      <span
        key={key}
        className={`td-approver-bubble ${approver.color}`}
        title={`${approver.label} (${approver.role})`}
      >
        {approver.label}
      </span>
    );
  };

  return (
    <div className="td-wf-approvals-container">
      {/* ── 4 KPI Summary Cards (Reference 4 & 5) ─────────────────── */}
      <div className="td-wf-kpi-grid">
        <div className="td-wf-kpi-card">
          <span className="label">Approval Flows</span>
          <span className="val">06</span>
          <span className="sub">All Configured</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Active</span>
          <span className="val">04</span>
          <span className="sub">Ready to Use</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Draft</span>
          <span className="val">01</span>
          <span className="sub">In-Progress</span>
        </div>

        <div className="td-wf-kpi-card">
          <span className="label">Needs Attention</span>
          <span className="val">01</span>
          <span className="sub">Config Issues</span>
        </div>
      </div>

      {/* ── Main Area: Table (+ Optional Inspector) ───────────────── */}
      <div className={`td-wf-approvals-split ${isInspectorOpen ? "with-inspector" : ""}`}>
        {/* Approvals Table Card */}
        <div className="td-wf-approvals-table-card">
          <div className="td-wf-table-responsive">
            <table className="td-wf-approvals-datatable">
              <thead>
                <tr>
                  <th style={{ width: "4%" }} className="center">#</th>
                  <th style={{ width: isInspectorOpen ? "22%" : "20%" }}>FLOW NAME</th>
                  <th style={{ width: isInspectorOpen ? "22%" : "20%" }}>TRIGGER</th>
                  <th style={{ width: "10%" }}>STAGES</th>
                  <th style={{ width: "16%" }}>APPROVERS</th>
                  <th style={{ width: "12%" }}>SLA</th>
                  {!isInspectorOpen && <th style={{ width: "9%" }}>STATUS</th>}
                  {!isInspectorOpen && <th style={{ width: "12%" }}>LAST UPDATED</th>}
                  <th style={{ width: "4%" }} className="center"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={isInspectorOpen ? 7 : 9} className="td-table-empty-row">
                      No approval flows found.
                    </td>
                  </tr>
                ) : (
                  paginatedApprovals.map((flow, idx) => {
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                    const isSelected = selectedFlow?.id === flow.id;
                    const isActionOpen = openActionMenuId === flow.id;

                    return (
                      <tr
                        key={flow.id}
                        className={`td-wf-approval-row ${isSelected ? "selected-row" : ""}`}
                        onClick={() => handleRowClick(flow)}
                      >
                        {/* Column 1: Grip and Number */}
                        <td>
                          <div className="td-num-cell">
                            <GripVertical size={13} className="grip-icon" />
                            <span className="num-txt">{rowNumber}</span>
                          </div>
                        </td>

                        {/* Column 2: Flow Name + Code */}
                        <td>
                          <div className="td-flow-name-cell">
                            <span className="primary-title">{flow.name}</span>
                            <span className="sub-code">{flow.code}</span>
                          </div>
                        </td>

                        {/* Column 3: Trigger + Subtitle */}
                        <td>
                          <div className="td-flow-trigger-cell">
                            <span className="primary-trigger">{flow.triggerTitle}</span>
                            <span className="sub-trigger">{flow.triggerDescription}</span>
                          </div>
                        </td>

                        {/* Column 4: Stages Count + Mode */}
                        <td>
                          <div className="td-flow-stages-cell">
                            <span className="stages-count">{flow.stagesCount}</span>
                            <span className="stages-mode">{flow.mode}</span>
                          </div>
                        </td>

                        {/* Column 5: Approvers Avatar Stack */}
                        <td>
                          <div className="td-approvers-stack">
                            {flow.approvers.map((appr, aIdx) =>
                              renderApproverBubble(appr, aIdx)
                            )}
                            <span className="td-approver-bubble add-bubble">+</span>
                          </div>
                        </td>

                        {/* Column 6: SLA */}
                        <td>
                          <span className="td-sla-text">{flow.sla}</span>
                        </td>

                        {/* Column 7: Status (visible when inspector closed) */}
                        {!isInspectorOpen && (
                          <td>
                            <span
                              className={`td-status-pill ${
                                flow.status === "ACTIVE"
                                  ? "status-pill-active"
                                  : "status-pill-draft"
                              }`}
                            >
                              {flow.status}
                            </span>
                          </td>
                        )}

                        {/* Column 8: Last Updated (visible when inspector closed) */}
                        {!isInspectorOpen && (
                          <td>
                            <div className="td-updated-cell">
                              <span className="date-txt">{flow.lastUpdated}</span>
                              <span className="by-txt">by {flow.lastUpdatedBy}</span>
                            </div>
                          </td>
                        )}

                        {/* Column 9: Kebab Action */}
                        <td className="center" onClick={(e) => e.stopPropagation()}>
                          <div className="td-relative-inline">
                            <button
                              type="button"
                              className="td-kebab-btn"
                              onClick={() =>
                                setOpenActionMenuId(isActionOpen ? null : flow.id)
                              }
                              title="Flow actions"
                            >
                              <MoreHorizontal size={15} />
                            </button>

                            {isActionOpen && (
                              <div className="td-wf-action-menu">
                                <button
                                  type="button"
                                  className="item"
                                  onClick={() => handleDuplicateFlow(flow)}
                                >
                                  <Copy size={13} />
                                  <span>Duplicate</span>
                                </button>
                                <button
                                  type="button"
                                  className="item danger"
                                  onClick={() => handleDeleteFlow(flow.id)}
                                >
                                  <Trash2 size={13} />
                                  <span>Delete Flow</span>
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
            <div className="target-table-total-count">Total Approvals: NA</div>

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

        {/* Right Inspector Panel (Reference 5) ────────────────────── */}
        {isInspectorOpen && selectedFlow && (
          <aside className="td-approval-inspector">
            <div className="insp-head">
              <div className="title-block">
                <h4 className="flow-title">{selectedFlow.name.toUpperCase()}</h4>
                <span className="flow-meta">
                  {selectedFlow.code} · {selectedFlow.category} · {selectedFlow.version}
                </span>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsInspectorOpen(false)}
                aria-label="Close Inspector"
              >
                <X size={15} />
              </button>
            </div>

            <p className="insp-description">{selectedFlow.description}</p>

            <div className="insp-rows-list">
              <div className="insp-row">
                <span className="lbl">Status</span>
                <span
                  className={`td-status-pill ${
                    selectedFlow.status === "ACTIVE"
                      ? "status-pill-active"
                      : "status-pill-draft"
                  }`}
                >
                  {selectedFlow.status}
                </span>
              </div>

              <div className="insp-row">
                <span className="lbl">Trigger</span>
                <div className="val-col">
                  <span className="val-main">{selectedFlow.triggerTitle}</span>
                  <span className="val-sub">{selectedFlow.triggerDescription}</span>
                </div>
              </div>

              <div className="insp-row">
                <span className="lbl">Approval Mode</span>
                <span className="val-main">{selectedFlow.mode}</span>
              </div>

              <div className="insp-row">
                <span className="lbl">Stages</span>
                <span className="val-main">{selectedFlow.stagesCount}</span>
              </div>

              <div className="insp-row">
                <span className="lbl">SLA</span>
                <span className="val-main">{selectedFlow.sla}</span>
              </div>

              <div className="insp-row">
                <span className="lbl">Created By</span>
                <div className="val-col">
                  <span className="val-main">{selectedFlow.createdBy}</span>
                  <span className="val-sub">{selectedFlow.createdAt}</span>
                </div>
              </div>

              <div className="insp-row">
                <span className="lbl">Last Updated</span>
                <div className="val-col">
                  <span className="val-main">by {selectedFlow.lastUpdatedBy}</span>
                  <span className="val-sub">{selectedFlow.lastUpdated}</span>
                </div>
              </div>
            </div>

            <div className="insp-foot">
              <button type="button" className="btn-view-flow">
                View Flow
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Bottom Section: Approval Flow Preview (Reference 4 & 5) ─ */}
      <div className="td-approval-preview-section">
        <h4 className="preview-heading">Approval Flow Preview</h4>

        <div className="preview-steps-grid">
          {selectedFlow.previewSteps.map((step, sIdx) => (
            <div key={sIdx} className="preview-step-card">
              {step.header && <span className="step-tag-header">{step.header}</span>}
              {step.badge && <span className="step-tag-badge">{step.badge}</span>}
              <h5 className="step-title">{step.title}</h5>
              <p className="step-subtitle">{step.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
