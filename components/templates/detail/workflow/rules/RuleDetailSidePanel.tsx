"use client";

import React, { useState } from "react";
import { X, CheckCircle, Zap, Shield, Clock, User, ArrowRight } from "lucide-react";
import { WorkflowRule, formatConditionExpression } from "@/lib/templates/rules-domain";

interface RuleDetailSidePanelProps {
  rule: WorkflowRule;
  onClose: () => void;
  onEditRule: (rule: WorkflowRule) => void;
}

export default function RuleDetailSidePanel({
  rule,
  onClose,
  onEditRule,
}: RuleDetailSidePanelProps) {
  const [activeTab, setActiveTab] = useState<"Overview" | "Conditions" | "Actions">("Overview");

  const conditionFormula = formatConditionExpression(rule.conditions);
  const statusUpper = (rule.status || "ACTIVE").toUpperCase();
  const statusClass =
    statusUpper === "ACTIVE"
      ? "status-pill-active"
      : statusUpper === "DRAFT"
      ? "status-pill-draft"
      : "status-pill-inactive";

  const approvalFlowTitle = rule.approval?.flowName
    ? `${rule.approval.flowName} (${rule.approval.version || "v2.2"})`
    : rule.actions.find((a) => a.type === "requestApproval")?.target || "None Required";

  const approvalStepsDesc = rule.approval?.stepsCount
    ? `${rule.approval.stepsCount} Approval Steps`
    : rule.actions.some((a) => a.type === "requestApproval")
    ? "Approval Required"
    : "No approval steps";

  return (
    <div className="td-rule-side-panel">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="td-rsp-header">
        <div className="td-rsp-title-wrap">
          <h3 className="td-rsp-title">{rule.name.toUpperCase()}</h3>
          <p className="td-rsp-subtitle">
            {rule.code} · {rule.category} · {rule.version || "v1.0"}
          </p>
        </div>

        <button
          type="button"
          className="td-rsp-close-btn"
          onClick={onClose}
          title="Close Details"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Description ───────────────────────────────────────────── */}
      <p className="td-rsp-desc">
        {rule.description || "Automatically evaluate conditions and trigger operational actions for projects created from this template."}
      </p>

      {/* ── Navigation Tabs ───────────────────────────────────────── */}
      <div className="td-rsp-tabs" role="tablist">
        {(["Overview", "Conditions", "Actions"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`td-rsp-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab View: Overview ────────────────────────────────────── */}
      {activeTab === "Overview" && (
        <div className="td-rsp-overview-grid">
          {/* Status */}
          <div className="td-rsp-field">
            <span className="td-rsp-label">Status</span>
            <div>
              <span className={`td-status-pill ${statusClass}`}>{statusUpper}</span>
            </div>
          </div>

          {/* Conditions */}
          <div className="td-rsp-field">
            <span className="td-rsp-label">Conditions</span>
            <span className="td-rsp-val-bold text-accent">
              {conditionFormula || "None defined"}
            </span>
          </div>

          {/* Trigger */}
          <div className="td-rsp-field">
            <span className="td-rsp-label">Trigger</span>
            <div>
              <div className="td-rsp-val-bold">{rule.trigger.event}</div>
              <div className="td-rsp-val-sub">
                {rule.trigger.timing || rule.trigger.evaluate || "Immediately"}
              </div>
            </div>
          </div>

          {/* Approval Flow */}
          <div className="td-rsp-field">
            <span className="td-rsp-label">Approval Flow</span>
            <div>
              <div className="td-rsp-val-bold">{approvalFlowTitle}</div>
              <div className="td-rsp-val-sub">{approvalStepsDesc}</div>
            </div>
          </div>

          {/* Priority */}
          <div className="td-rsp-field">
            <span className="td-rsp-label">Priority</span>
            <span className="td-rsp-val-bold">{rule.priority}</span>
          </div>

          {/* Executed */}
          <div className="td-rsp-field">
            <span className="td-rsp-label">Executed</span>
            <span className="td-rsp-val-bold">{rule.executedCount ?? 0} Times</span>
          </div>

          {/* Last Triggered */}
          <div className="td-rsp-field">
            <span className="td-rsp-label">Last Triggered</span>
            <span className="td-rsp-val-bold">{rule.lastTriggered || "—"}</span>
          </div>

          {/* Created By */}
          <div className="td-rsp-field">
            <span className="td-rsp-label">Created By</span>
            <div>
              <div className="td-rsp-val-bold">{rule.createdBy || "Admin User"}</div>
              <div className="td-rsp-val-sub">{rule.createdDate || "04 Aug 2026"}</div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="td-rsp-field">
            <span className="td-rsp-label">Last Updated</span>
            <div>
              <div className="td-rsp-val-bold">
                by {rule.lastUpdatedBy || rule.createdBy || "Admin User"}
              </div>
              <div className="td-rsp-val-sub">{rule.lastUpdated || "12 Aug 2026"}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab View: Conditions ──────────────────────────────────── */}
      {activeTab === "Conditions" && (
        <div className="td-rsp-conditions-view">
          <div className="td-rsp-cond-header">
            <span className="label">Evaluation Logic:</span>
            <span className="badge">{rule.conditions.conjunction} Criteria</span>
          </div>

          <div className="td-rsp-cond-list">
            {rule.conditions.conditions.map((cond, idx) => (
              <div key={cond.id || idx} className="td-rsp-cond-card">
                <div className="field-tag">{cond.field}</div>
                <div className="op-tag">{cond.operator}</div>
                <div className="val-tag">
                  {typeof cond.value === "number" && cond.field.toLowerCase().includes("value")
                    ? `₹${cond.value.toLocaleString("en-IN")}`
                    : String(cond.value)}
                </div>
              </div>
            ))}

            {rule.conditions.groups?.map((group, gi) => (
              <div key={group.id || gi} className="td-rsp-group-card">
                <div className="group-header">
                  <span>OR Group ({group.conjunction})</span>
                </div>
                {group.conditions.map((gc, gci) => (
                  <div key={gc.id || gci} className="td-rsp-cond-card nested">
                    <div className="field-tag">{gc.field}</div>
                    <div className="op-tag">{gc.operator}</div>
                    <div className="val-tag">{String(gc.value)}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="td-rsp-cond-summary-box">
            <span className="label">Summary:</span>
            <p className="formula">{conditionFormula}</p>
          </div>
        </div>
      )}

      {/* ── Tab View: Actions ─────────────────────────────────────── */}
      {activeTab === "Actions" && (
        <div className="td-rsp-actions-view">
          <div className="td-rsp-actions-list">
            {rule.actions.map((action, idx) => (
              <div key={action.id || idx} className="td-rsp-action-card">
                <div className="num-badge">{idx + 1}</div>
                <div className="info">
                  <div className="title">{action.title}</div>
                  {action.target && <div className="target">{action.target}</div>}
                </div>
                {action.badge && (
                  <span className="type-badge">{action.badge}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom Action Button ──────────────────────────────────── */}
      <div className="td-rsp-footer">
        <button
          type="button"
          className="td-rsp-flow-btn"
          onClick={() => onEditRule(rule)}
        >
          <span>View Rule Flow</span>
          <ArrowRight size={14} style={{ marginLeft: 6 }} />
        </button>
      </div>
    </div>
  );
}
