"use client";

import React from "react";
import { WorkflowRule, calculateRuleKpis } from "@/lib/templates/rules-domain";

interface RulesKpiCardsProps {
  rules: WorkflowRule[];
  loading?: boolean;
}

export default function RulesKpiCards({ rules, loading }: RulesKpiCardsProps) {
  const kpis = calculateRuleKpis(rules);

  const formatNumber = (num: number) => {
    return num < 10 ? `0${num}` : `${num}`;
  };

  if (loading) {
    return (
      <div className="td-wf-kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="td-wf-kpi-card skeleton-shimmer" style={{ height: 92, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="td-wf-kpi-grid">
      {/* 1. Total Rules */}
      <div className="td-wf-kpi-card">
        <span className="label">Total Rules</span>
        <span className="val">{formatNumber(kpis.total)}</span>
        <span className="sub">All Configured</span>
      </div>

      {/* 2. Active */}
      <div className="td-wf-kpi-card">
        <span className="label">Active</span>
        <span className="val">{formatNumber(kpis.active)}</span>
        <span className="sub">Running</span>
      </div>

      {/* 3. Approval Triggers */}
      <div className="td-wf-kpi-card">
        <span className="label">Approval Triggers</span>
        <span className="val">{formatNumber(kpis.approvalTriggers)}</span>
        <span className="sub">Require Authorisation</span>
      </div>

      {/* 4. Draft */}
      <div className="td-wf-kpi-card">
        <span className="label">Draft</span>
        <span className="val">{formatNumber(kpis.draft)}</span>
        <span className="sub">In-Progress</span>
      </div>
    </div>
  );
}
