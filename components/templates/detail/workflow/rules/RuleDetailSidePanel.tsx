"use client";

import React, { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { WorkflowRule, formatConditionExpression } from "@/lib/templates/rules-domain";

interface RuleDetailSidePanelProps {
  rule: WorkflowRule;
  onClose: () => void;
  onEditRule: (rule: WorkflowRule) => void;
  onOpenFlowDiagram?: (rule: WorkflowRule) => void;
}

export default function RuleDetailSidePanel({
  rule,
  onClose,
  onEditRule,
  onOpenFlowDiagram,
}: RuleDetailSidePanelProps) {
  const [activeTab, setActiveTab] = useState<"Overview" | "Conditions" | "Actions">("Overview");

  const conditionFormula = formatConditionExpression(rule.conditions);
  const statusUpper = (rule.status || "ACTIVE").toUpperCase();

  const approvalFlowTitle = rule.approval?.flowName
    ? `${rule.approval.flowName} (${rule.approval.version || "v2.2"})`
    : rule.actions.find((a) => a.type === "requestApproval")?.target || "Finance Approval (v2.2)";

  const approvalStepsDesc = rule.approval?.stepsCount
    ? `${rule.approval.stepsCount} Approval Steps`
    : rule.actions.some((a) => a.type === "requestApproval")
    ? "2 Approval Steps"
    : "Standard Step";

  const handleFlowButtonClick = () => {
    if (onOpenFlowDiagram) {
      onOpenFlowDiagram(rule);
    } else {
      onEditRule(rule);
    }
  };

  return (
    <aside className="td-wf-view-rule-panel" aria-label="Rule Details Inspector">
      {/* ── 1. Header (Frame 2147225139) ─────────────────────────────────── */}
      <div className="view-rule-header">
        <div className="view-rule-title-meta">
          <h3 className="view-rule-title">{rule.name}</h3>
          <span className="view-rule-meta">
            {rule.code} · {rule.category} · {rule.version || "v2.1"}
          </span>
        </div>

        <button
          type="button"
          className="view-rule-close-btn"
          onClick={onClose}
          title="Close Inspector"
          aria-label="Close Inspector"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── 2. Description (Frame 2147225086) ────────────────────────────── */}
      <p className="view-rule-desc">
        {rule.description ||
          "Automatically evaluate conditions and trigger operational actions for projects created from this template."}
      </p>

      {/* ── Optional Detail Sub-Tabs ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          width: "100%",
          gap: "4px",
          background: "rgba(241, 245, 249, 0.7)",
          padding: "3px",
          borderRadius: "6px",
        }}
      >
        {(["Overview", "Conditions", "Actions"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "4px 8px",
              fontSize: "12px",
              fontWeight: activeTab === tab ? 600 : 500,
              color: activeTab === tab ? "#2563EB" : "#64748B",
              background: activeTab === tab ? "#FFFFFF" : "transparent",
              border: "none",
              borderRadius: "4px",
              boxShadow: activeTab === tab ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Divider 1 ────────────────────────────────────────────────────── */}
      <hr className="view-rule-divider" />

      {/* ── Tab: Overview (Figma Frame 2147225141 & 2147225142) ─────────── */}
      {activeTab === "Overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
          {/* Status */}
          <div className="view-rule-field-row">
            <span className="field-lbl">Status</span>
            <div className="field-val-col">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: statusUpper === "ACTIVE" ? "rgba(22, 163, 74, 0.1)" : "rgba(100, 116, 139, 0.1)",
                  color: statusUpper === "ACTIVE" ? "#16A34A" : "#64748B",
                  textTransform: "uppercase",
                }}
              >
                {statusUpper}
              </span>
            </div>
          </div>

          {/* Conditions */}
          <div className="view-rule-field-row">
            <span className="field-lbl">Conditions</span>
            <div className="field-val-col">
              <span className="val-main" style={{ color: "#2563EB" }}>
                {conditionFormula || "Budget > ₹50,00,000"}
              </span>
            </div>
          </div>

          {/* Trigger */}
          <div className="view-rule-field-row">
            <span className="field-lbl">Trigger</span>
            <div className="field-val-col">
              <span className="val-main">{rule.trigger.event || "Project Created"}</span>
              <span className="val-sub">{rule.trigger.timing || rule.trigger.evaluate || "Immediately"}</span>
            </div>
          </div>

          {/* Approval Flow */}
          <div className="view-rule-field-row">
            <span className="field-lbl">Approval Flow</span>
            <div className="field-val-col">
              <span className="val-main">{approvalFlowTitle}</span>
              <span className="val-sub">{approvalStepsDesc}</span>
            </div>
          </div>

          {/* Priority */}
          <div className="view-rule-field-row">
            <span className="field-lbl">Priority</span>
            <div className="field-val-col">
              <span className="val-main">{rule.priority || "CRITICAL"}</span>
            </div>
          </div>

          {/* Executed */}
          <div className="view-rule-field-row">
            <span className="field-lbl">Executed</span>
            <div className="field-val-col">
              <span className="val-main">{rule.executedCount ?? 12} Times</span>
            </div>
          </div>

          {/* Last Triggered */}
          <div className="view-rule-field-row">
            <span className="field-lbl">Last Triggered</span>
            <div className="field-val-col">
              <span className="val-main">{rule.lastTriggered || "12 Aug 2026"}</span>
            </div>
          </div>

          {/* Divider 2 */}
          <hr className="view-rule-divider" />

          {/* Created By */}
          <div className="view-rule-field-row">
            <span className="field-lbl">Created By</span>
            <div className="field-val-col">
              <span className="val-main">{rule.createdBy || "Admin User"}</span>
              <span className="val-sub">{rule.createdDate || "04 Aug 2026"}</span>
            </div>
          </div>

          {/* Last Updated */}
          <div className="view-rule-field-row">
            <span className="field-lbl">Last Updated</span>
            <div className="field-val-col">
              <span className="val-main">by {rule.lastUpdatedBy || rule.createdBy || "Admin User"}</span>
              <span className="val-sub">{rule.lastUpdated || "12 Aug 2026"}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Conditions Breakdown ─────────────────────────────────────── */}
      {activeTab === "Conditions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
            Conjunction: {rule.conditions.conjunction}
          </div>
          {rule.conditions.conditions.map((cond, idx) => (
            <div
              key={cond.id || idx}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "6px",
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{cond.field}</div>
              <div style={{ fontSize: 12, color: "#2563EB" }}>
                {cond.operator}{" "}
                {typeof cond.value === "number" && cond.field.toLowerCase().includes("value")
                  ? `₹${cond.value.toLocaleString("en-IN")}`
                  : String(cond.value)}
              </div>
            </div>
          ))}
          <div
            style={{
              fontSize: 12,
              color: "#475569",
              background: "#F8FAFC",
              padding: "8px",
              borderRadius: "4px",
              borderLeft: "3px solid #2563EB",
            }}
          >
            Formula: {conditionFormula}
          </div>
        </div>
      )}

      {/* ── Tab: Actions Breakdown ────────────────────────────────────────── */}
      {activeTab === "Actions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
          {rule.actions.map((act, idx) => (
            <div
              key={act.id || idx}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "6px",
                padding: "10px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#EFF6FF",
                  color: "#2563EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{act.title}</div>
                {act.target && (
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{act.target}</div>
                )}
              </div>
              {act.badge && (
                <span className="td-rule-status-pill" style={{ fontSize: 11 }}>
                  {act.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Divider 3 ────────────────────────────────────────────────────── */}
      <hr className="view-rule-divider" />

      {/* ── Bottom Action Button (Frame 2147225189) ───────────────────────── */}
      <button
        type="button"
        className="view-rule-btn-flow"
        onClick={handleFlowButtonClick}
        title="View Rule Execution Flow"
      >
        <span>View Rule Flow</span>
      </button>
    </aside>
  );
}
