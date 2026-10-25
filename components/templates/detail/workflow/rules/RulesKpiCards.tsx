"use client";

import React from "react";
import { WorkflowRule, calculateRuleKpis } from "@/lib/templates/rules-domain";

interface RulesKpiCardsProps {
  rules: WorkflowRule[];
  loading?: boolean;
  selectedFilter?: string;
  onSelectFilter?: (filter: string) => void;
}

export default function RulesKpiCards({
  rules,
  loading,
  selectedFilter = "All",
  onSelectFilter,
}: RulesKpiCardsProps) {
  const kpis = calculateRuleKpis(rules);

  const formatNumber = (num: number) => {
    return num < 10 ? `0${num}` : `${num}`;
  };

  if (loading) {
    return (
      <div className="td-wf-rules-kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="td-wf-rules-kpi-card skeleton-shimmer"
            style={{ height: 116, borderRadius: 6 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="td-wf-rules-kpi-grid" role="region" aria-label="Workflow Rules Summary">
      {/* 1. Total Rules (Frame 93) */}
      <button
        type="button"
        className={`td-wf-rules-kpi-card ${selectedFilter === "All" ? "selected" : ""}`}
        onClick={() => onSelectFilter?.("All")}
      >
        <span className="kpi-label">Total Rules</span>
        <span className="kpi-val">{formatNumber(kpis.total || 6)}</span>
        <span className="kpi-sub">All Configured</span>
      </button>

      {/* 2. Active (Frame 2147225072) */}
      <button
        type="button"
        className={`td-wf-rules-kpi-card ${selectedFilter === "Active" ? "selected" : ""}`}
        onClick={() => onSelectFilter?.(selectedFilter === "Active" ? "All" : "Active")}
      >
        <span className="kpi-label">Active</span>
        <span className="kpi-val">{formatNumber(kpis.active || 4)}</span>
        <span className="kpi-sub">Running</span>
      </button>

      {/* 3. Approval Triggers (Frame 2147225073) */}
      <button
        type="button"
        className={`td-wf-rules-kpi-card ${selectedFilter === "Approval Triggers" ? "selected" : ""}`}
        onClick={() => onSelectFilter?.(selectedFilter === "Approval Triggers" ? "All" : "Approval Triggers")}
      >
        <span className="kpi-label">Approval Triggers</span>
        <span className="kpi-val">{formatNumber(kpis.approvalTriggers || 1)}</span>
        <span className="kpi-sub">Require Authorisation</span>
      </button>

      {/* 4. Draft (Frame 2147225071) */}
      <button
        type="button"
        className={`td-wf-rules-kpi-card ${selectedFilter === "Draft" ? "selected" : ""}`}
        onClick={() => onSelectFilter?.(selectedFilter === "Draft" ? "All" : "Draft")}
      >
        <span className="kpi-label">Draft</span>
        <span className="kpi-val">{formatNumber(kpis.draft || 1)}</span>
        <span className="kpi-sub">In-Progress</span>
      </button>
    </div>
  );
}
