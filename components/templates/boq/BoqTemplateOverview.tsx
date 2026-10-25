"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Info,
  Sliders,
  Percent,
  Landmark,
  Layers,
  Building,
  FileText,
  Edit3,
} from "lucide-react";

export type BoqTemplateDetailData = {
  id: string;
  templateCode: string;
  name: string;
  description: string;
  category: string;
  projectType: string;
  status: string;
  version: string;
  usedIn: string;
  tags: string[];
  useCount: number;
  sections: number;
  categories: number;
  items: number;
  costMapping: number;
  indicativeBaseCost: string;
  baseCostAmount: number;
  readiness: number;
  updatedAt: string;
  commercialSummary?: {
    material: { amount: number; percent: number };
    labour: { amount: number; percent: number };
    transport: { amount: number; percent: number };
    other: { amount: number; percent: number };
    indicativeCost: number;
  };
  commercialDefaults: {
    currency: string;
    taxProfile: string;
    taxPercent: number;
    defaultWastage: number;
    defaultMarkup: number;
    rounding: string;
  };
  costingHealth: {
    mapped: number;
    outdated: number;
    reviewRequired: number;
    missing: number;
    rateFreshness: { current: number; reviewSoon: number; outdated: number };
  };
  usageDependencies: {
    projectTemplatesCount: number;
    activeProjectsCount: number;
    draftTemplatesCount: number;
    dependencies: { name: string; status: string }[];
  };
  attentionRequired: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  versionGovernance: {
    version: string;
    status: string;
    publishedDate: string;
    changes: { type: string; text: string }[];
  };
  recentActivity: {
    action: string;
    date: string;
    detail: string;
    type: string;
  }[];
  rooms?: any[];
};

interface BoqTemplateOverviewProps {
  template: BoqTemplateDetailData;
  onNavigateTab: (tab: string) => void;
  onNotice?: (msg: string) => void;
}

export default function BoqTemplateOverview({
  template,
  onNavigateTab,
  onNotice,
}: BoqTemplateOverviewProps) {
  // Commercial breakdown calculations
  const commSummary = template.commercialSummary || {
    material: { amount: Math.round((template.baseCostAmount || 2860000) * 0.75), percent: 75 },
    labour: { amount: Math.round((template.baseCostAmount || 2860000) * 0.169), percent: 16.9 },
    transport: { amount: Math.round((template.baseCostAmount || 2860000) * 0.034), percent: 3.4 },
    other: { amount: Math.round((template.baseCostAmount || 2860000) * 0.047), percent: 4.7 },
    indicativeCost: template.baseCostAmount || 2860000,
  };

  const matPct = commSummary.material?.percent ?? 75;
  const labPct = commSummary.labour?.percent ?? 16.9;
  const traPct = commSummary.transport?.percent ?? 3.4;
  const othPct = commSummary.other?.percent ?? 4.7;

  // Donut chart offsets (circumference = 100, r = 15.9155)
  const matOffset = 0;
  const labOffset = -matPct;
  const traOffset = -(matPct + labPct);
  const othOffset = -(matPct + labPct + traPct);

  // Coverage counts
  const totalItems = template.items || 186;
  const missingItems = template.costingHealth?.missing || 0;
  const validUnitsCount = Math.max(0, totalItems - missingItems);
  const validUnitsPct = totalItems > 0 ? Math.round((validUnitsCount / totalItems) * 100) : 100;

  // Items with quantity rules
  const reviewCount = template.costingHealth?.reviewRequired || 0;
  const qtyRulesCount = Math.max(1, totalItems - reviewCount);
  const qtyRulesPct = totalItems > 0 ? Math.round((qtyRulesCount / totalItems) * 100) : 95;

  // Readiness gauge
  const readiness = template.readiness ?? 94;

  const padNum = (n: number | undefined | null) => {
    if (n === undefined || n === null) return "00";
    return n < 10 && n >= 0 ? `0${n}` : `${n}`;
  };

  return (
    <div className="boq-overview-container">
      {/* =========================================================================
          ROW 1: 4 SUMMARY KPI CARDS (Figma Frame 2147225138)
         ========================================================================= */}
      <div className="boq-overview-kpi-grid">
        {/* KPI 1: Sections */}
        <div className="boq-overview-card boq-overview-kpi-card">
          <span className="boq-overview-kpi-label">Sections</span>
          <div className="boq-overview-kpi-value">{template.sections}</div>
          <span className="boq-overview-kpi-sub">Organised Structure</span>
        </div>

        {/* KPI 2: Line Items */}
        <div className="boq-overview-card boq-overview-kpi-card">
          <span className="boq-overview-kpi-label">Line Items</span>
          <div className="boq-overview-kpi-value">{template.items}</div>
          <span className="boq-overview-kpi-sub">Total Items</span>
        </div>

        {/* KPI 3: Indicative Base Cost */}
        <div className="boq-overview-card boq-overview-kpi-card">
          <span className="boq-overview-kpi-label">Indicative Base Cost</span>
          <div className="boq-overview-kpi-value green">{template.indicativeBaseCost}</div>
          <span className="boq-overview-kpi-sub">Current Library Rates</span>
        </div>

        {/* KPI 4: Rate Mapping */}
        <div className="boq-overview-card boq-overview-kpi-card">
          <span className="boq-overview-kpi-label">Rate Mapping</span>
          <div className="boq-overview-kpi-value blue">{template.costMapping}%</div>
          <span className="boq-overview-kpi-sub">Mapped to Library</span>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: BOQ Readiness, Commercial Summary, Commercial Defaults (Figma Frame 2147225199)
         ========================================================================= */}
      <div className="boq-overview-row-3col">
        {/* Card 1: BOQ Readiness */}
        <div className="boq-overview-card boq-card-readiness">
          <div className="boq-overview-card-head">
            <h3 className="boq-overview-card-title">BOQ Readiness</h3>
          </div>

          <div className="boq-readiness-body">
            {/* Left: Gauge & Status */}
            <div className="boq-readiness-gauge-col">
              <div className="boq-readiness-gauge-wrap">
                <svg
                  viewBox="0 0 36 36"
                  className="boq-readiness-svg"
                  role="img"
                  aria-label={`BOQ readiness score: ${readiness}%`}
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="3.6"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="3.6"
                    strokeDasharray={`${readiness} ${100 - readiness}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="boq-readiness-gauge-score">{readiness}%</div>
              </div>
              <div className="boq-readiness-status-text">
                {readiness >= 90
                  ? "Ready with minor warnings."
                  : readiness >= 70
                  ? "Ready with warnings."
                  : "Requires review before release."}
              </div>
            </div>

            {/* Right: Validation Checklist */}
            <div className="boq-readiness-checks-col">
              <div className="boq-readiness-check-item">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" color="#16A34A" />
                <span>Structure Complete</span>
              </div>
              <div className="boq-readiness-check-item">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" color="#16A34A" />
                <span>{template.sections}/{template.sections} Sections Configured</span>
              </div>
              <div className="boq-readiness-check-item">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" color="#16A34A" />
                <span>Units Configured</span>
              </div>
              <div className="boq-readiness-check-item">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" color="#16A34A" />
                <span>Commercial Defaults Configured</span>
              </div>
              <div className="boq-readiness-check-item">
                <AlertTriangle size={16} className="text-amber-500 shrink-0" color="#FAB000" />
                <span>{template.costingHealth?.reviewRequired || 5} Automated Role references</span>
              </div>
              <div className="boq-readiness-check-item">
                <AlertTriangle size={16} className="text-amber-500 shrink-0" color="#FAB000" />
                <span>{template.costingHealth?.outdated || 3} items require review</span>
              </div>

              {/* View Validation Action */}
              <button
                type="button"
                className="boq-readiness-validation-link"
                onClick={() => {
                  onNavigateTab("Rules");
                  if (onNotice) onNotice("Navigating to Template Validation & Rules.");
                }}
              >
                View Validation →
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Commercial Summary */}
        <div className="boq-overview-card boq-card-commercial">
          <div className="boq-overview-card-head">
            <h3 className="boq-overview-card-title">Commercial Summary</h3>
            <button
              type="button"
              className="boq-overview-card-link"
              onClick={() => onNavigateTab("Costing")}
            >
              View Costing →
            </button>
          </div>

          <div className="boq-commercial-summary-body">
            {/* Left: Base Cost & Breakdown */}
            <div className="boq-commercial-breakdown">
              <div>
                <span className="boq-commercial-base-label">Base Cost</span>
                <div className="boq-commercial-base-val">
                  ₹{commSummary.indicativeCost.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="boq-commercial-divider" />

              {/* Material */}
              <div className="boq-commercial-row">
                <div className="boq-commercial-row-left">
                  <div className="boq-commercial-sq" style={{ background: "#2563EB" }} />
                  <span className="boq-commercial-cat-name">Material</span>
                </div>
                <span className="boq-commercial-cat-amount">
                  ₹{commSummary.material.amount.toLocaleString("en-IN")} ({matPct}%)
                </span>
              </div>

              {/* Labour */}
              <div className="boq-commercial-row">
                <div className="boq-commercial-row-left">
                  <div className="boq-commercial-sq" style={{ background: "#16A34A" }} />
                  <span className="boq-commercial-cat-name">Labour</span>
                </div>
                <span className="boq-commercial-cat-amount">
                  ₹{commSummary.labour.amount.toLocaleString("en-IN")} ({labPct}%)
                </span>
              </div>

              {/* Transport */}
              <div className="boq-commercial-row">
                <div className="boq-commercial-row-left">
                  <div className="boq-commercial-sq" style={{ background: "#7F7DFC" }} />
                  <span className="boq-commercial-cat-name">Transport</span>
                </div>
                <span className="boq-commercial-cat-amount">
                  ₹{commSummary.transport.amount.toLocaleString("en-IN")} ({traPct}%)
                </span>
              </div>

              {/* Other */}
              <div className="boq-commercial-row">
                <div className="boq-commercial-row-left">
                  <div className="boq-commercial-sq" style={{ background: "#FAB000" }} />
                  <span className="boq-commercial-cat-name">Other</span>
                </div>
                <span className="boq-commercial-cat-amount">
                  ₹{commSummary.other.amount.toLocaleString("en-IN")} ({othPct}%)
                </span>
              </div>

              <div className="boq-commercial-divider" />

              {/* Indicative Cost Total */}
              <div className="boq-commercial-row">
                <span className="boq-commercial-total-label">Indicative Cost</span>
                <span className="boq-commercial-total-val">
                  ₹{commSummary.indicativeCost.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Right: SVG Donut Chart */}
            <div className="boq-commercial-donut-col">
              <svg
                viewBox="0 0 36 36"
                className="boq-commercial-donut-svg"
                role="img"
                aria-label="Cost breakdown chart: Material, Labour, Transport, Other"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="5"
                  strokeDasharray={`${matPct} ${100 - matPct}`}
                  strokeDashoffset={matOffset}
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="5"
                  strokeDasharray={`${labPct} ${100 - labPct}`}
                  strokeDashoffset={labOffset}
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#7F7DFC"
                  strokeWidth="5"
                  strokeDasharray={`${traPct} ${100 - traPct}`}
                  strokeDashoffset={traOffset}
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#FAB000"
                  strokeWidth="5"
                  strokeDasharray={`${othPct} ${100 - othPct}`}
                  strokeDashoffset={othOffset}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: Commercial Defaults */}
        <div className="boq-overview-card boq-card-defaults">
          <div className="boq-overview-card-head">
            <h3 className="boq-overview-card-title">Commercial Defaults</h3>
            <button
              type="button"
              className="boq-overview-card-link"
              onClick={() => onNavigateTab("Rules")}
            >
              View Rules →
            </button>
          </div>

          <div className="boq-defaults-2col-wrap">
            {/* Column 1 */}
            <div className="boq-defaults-col">
              {/* Currency */}
              <div className="boq-default-item-wrap">
                <div className="boq-default-pill-icon blue">₹</div>
                <div className="boq-default-text">
                  <span className="boq-default-name">Currency</span>
                  <span className="boq-default-val">{template.commercialDefaults?.currency || "INR (₹)"}</span>
                </div>
              </div>

              {/* Tax Profile */}
              <div className="boq-default-item-wrap">
                <div className="boq-default-pill-icon purple">
                  <Landmark size={20} />
                </div>
                <div className="boq-default-text">
                  <span className="boq-default-name">Tax Profile</span>
                  <span className="boq-default-val">{template.commercialDefaults?.taxProfile || "Default GST Profile"}</span>
                </div>
              </div>

              {/* Tax */}
              <div className="boq-default-item-wrap">
                <div className="boq-default-pill-icon green">
                  <Percent size={18} />
                </div>
                <div className="boq-default-text">
                  <span className="boq-default-name">Tax</span>
                  <span className="boq-default-val">{template.commercialDefaults?.taxPercent || 18}%</span>
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="boq-defaults-col">
              {/* Default Wastage */}
              <div className="boq-default-item-wrap">
                <div className="boq-default-pill-icon amber">
                  <RotateCcw size={18} />
                </div>
                <div className="boq-default-text">
                  <span className="boq-default-name">Default Wastage</span>
                  <span className="boq-default-val">{template.commercialDefaults?.defaultWastage || 5}%</span>
                </div>
              </div>

              {/* Default Markup */}
              <div className="boq-default-item-wrap">
                <div className="boq-default-pill-icon blue">
                  <Edit3 size={18} />
                </div>
                <div className="boq-default-text">
                  <span className="boq-default-name">Default Markup</span>
                  <span className="boq-default-val">{template.commercialDefaults?.defaultMarkup || 12}%</span>
                </div>
              </div>

              {/* Rounding */}
              <div className="boq-default-item-wrap">
                <div className="boq-default-pill-icon purple">
                  <Sliders size={18} />
                </div>
                <div className="boq-default-text">
                  <span className="boq-default-name">Rounding</span>
                  <span className="boq-default-val">{template.commercialDefaults?.rounding || "Nearest ₹1"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: BOQ Structure & Coverage, Costing Health, Usage & Dependencies (Figma Frame 2147225200)
         ========================================================================= */}
      <div className="boq-overview-row-3col">
        {/* Card 1: BOQ Structure & Coverage */}
        <div className="boq-overview-card boq-card-structure">
          <div className="boq-overview-card-head">
            <h3 className="boq-overview-card-title">BOQ Structure & Coverage</h3>
            <button
              type="button"
              className="boq-overview-card-link"
              onClick={() => onNavigateTab("BOQ Structure")}
            >
              View Structure →
            </button>
          </div>

          {/* 3 Metrics with vertical dividers */}
          <div className="boq-coverage-stats-row">
            <div className="boq-coverage-stat-col">
              <div className="boq-coverage-stat-num">{template.sections}</div>
              <span className="boq-coverage-stat-lbl">Sections</span>
            </div>

            <div className="boq-coverage-vdivider" />

            <div className="boq-coverage-stat-col">
              <div className="boq-coverage-stat-num">{template.categories}</div>
              <span className="boq-coverage-stat-lbl">Categories</span>
            </div>

            <div className="boq-coverage-vdivider" />

            <div className="boq-coverage-stat-col">
              <div className="boq-coverage-stat-num">{template.items}</div>
              <span className="boq-coverage-stat-lbl">Line Items</span>
            </div>
          </div>

          {/* 3 Progress Bars */}
          <div className="boq-coverage-bars-list">
            <div className="boq-coverage-bar-item">
              <div className="boq-coverage-bar-label-row">
                <span className="boq-coverage-bar-title">Sections Configured</span>
                <span className="boq-coverage-bar-ratio">{template.sections} / {template.sections}</span>
              </div>
              <div className="boq-coverage-progress-track">
                <div className="boq-coverage-progress-fill" style={{ width: "100%" }} />
              </div>
            </div>

            <div className="boq-coverage-bar-item">
              <div className="boq-coverage-bar-label-row">
                <span className="boq-coverage-bar-title">Items with valid units</span>
                <span className="boq-coverage-bar-ratio">{validUnitsCount} / {totalItems}</span>
              </div>
              <div className="boq-coverage-progress-track">
                <div className="boq-coverage-progress-fill" style={{ width: `${validUnitsPct}%` }} />
              </div>
            </div>

            <div className="boq-coverage-bar-item">
              <div className="boq-coverage-bar-label-row">
                <span className="boq-coverage-bar-title">Items with quantity rules</span>
                <span className="boq-coverage-bar-ratio">{qtyRulesCount} / {totalItems}</span>
              </div>
              <div className="boq-coverage-progress-track">
                <div className="boq-coverage-progress-fill" style={{ width: `${qtyRulesPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Costing Health */}
        <div className="boq-overview-card boq-card-health">
          <div className="boq-overview-card-head">
            <h3 className="boq-overview-card-title">Costing Health</h3>
            <button
              type="button"
              className="boq-overview-card-link"
              onClick={() => onNavigateTab("Costing")}
            >
              Review Costing →
            </button>
          </div>

          <div className="boq-health-columns">
            {/* Left: Mapping Status */}
            <div className="boq-health-col">
              {/* Mapped */}
              <div className="boq-health-row-item">
                <div className="boq-health-badge-group">
                  <div className="boq-health-sq blue" />
                  <span className="boq-health-num">{template.costingHealth?.mapped ?? 175}</span>
                </div>
                <div className="boq-health-row-content">
                  <span className="boq-health-label">Mapped</span>
                  <span className="boq-health-sub">Current mappings active</span>
                </div>
              </div>

              {/* Outdated */}
              <div className="boq-health-row-item">
                <div className="boq-health-badge-group">
                  <div className="boq-health-sq amber" />
                  <span className="boq-health-num">{padNum(template.costingHealth?.outdated ?? 3)}</span>
                </div>
                <div className="boq-health-row-content">
                  <span className="boq-health-label">Outdated</span>
                  <span className="boq-health-sub">Rate references outdated</span>
                </div>
              </div>

              {/* Review Required */}
              <div className="boq-health-row-item">
                <div className="boq-health-badge-group">
                  <div className="boq-health-sq amber" />
                  <span className="boq-health-num">{padNum(template.costingHealth?.reviewRequired ?? 8)}</span>
                </div>
                <div className="boq-health-row-content">
                  <span className="boq-health-label">Review Required</span>
                  <span className="boq-health-sub">Mapping requires review</span>
                </div>
              </div>

              {/* Missing */}
              <div className="boq-health-row-item">
                <div className="boq-health-badge-group">
                  <div className="boq-health-sq red" />
                  <span className="boq-health-num">{padNum(template.costingHealth?.missing ?? 0)}</span>
                </div>
                <div className="boq-health-row-content">
                  <span className="boq-health-label">Missing</span>
                  <span className="boq-health-sub">No Costing Reference</span>
                </div>
              </div>
            </div>

            {/* Right: Rate Freshness */}
            <div className="boq-health-col">
              <span className="boq-health-col-title">Rate Freshness</span>

              {/* Current */}
              <div className="boq-health-row-item">
                <div className="boq-health-badge-group">
                  <div className="boq-health-sq blue" />
                  <span className="boq-health-num">{template.costingHealth?.rateFreshness?.current ?? 168}</span>
                </div>
                <div className="boq-health-row-content">
                  <span className="boq-health-label">Current</span>
                  <span className="boq-health-sub">Rates Updated</span>
                </div>
              </div>

              {/* Review Soon */}
              <div className="boq-health-row-item">
                <div className="boq-health-badge-group">
                  <div className="boq-health-sq amber" />
                  <span className="boq-health-num">{padNum(template.costingHealth?.rateFreshness?.reviewSoon ?? 10)}</span>
                </div>
                <div className="boq-health-row-content">
                  <span className="boq-health-label">Review Soon</span>
                  <span className="boq-health-sub">Approaching Review</span>
                </div>
              </div>

              {/* Outdated */}
              <div className="boq-health-row-item">
                <div className="boq-health-badge-group">
                  <div className="boq-health-sq red" />
                  <span className="boq-health-num">{padNum(template.costingHealth?.rateFreshness?.outdated ?? 8)}</span>
                </div>
                <div className="boq-health-row-content">
                  <span className="boq-health-label">Outdated</span>
                  <span className="boq-health-sub">Require Update</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Usage & Dependencies */}
        <div className="boq-overview-card boq-card-usage">
          <div className="boq-overview-card-head">
            <h3 className="boq-overview-card-title">Usage & Dependencies</h3>
            <button
              type="button"
              className="boq-overview-card-link"
              onClick={() => onNavigateTab("Usage")}
            >
              View Usage →
            </button>
          </div>

          <div className="boq-usage-dep-body">
            <div className="boq-usage-dep-split">
              {/* Left stats */}
              <div className="boq-usage-counts-col">
                <div className="boq-usage-count-item">
                  <div className="boq-usage-count-icon blue">
                    <Layers size={18} />
                  </div>
                  <div className="boq-usage-count-text">
                    <span className="boq-usage-count-num">{template.usageDependencies?.projectTemplatesCount ?? 12}</span>
                    <span className="boq-usage-count-sub">Project Templates</span>
                  </div>
                </div>

                <div className="boq-usage-count-item">
                  <div className="boq-usage-count-icon purple">
                    <Building size={18} />
                  </div>
                  <div className="boq-usage-count-text">
                    <span className="boq-usage-count-num">{template.usageDependencies?.activeProjectsCount ?? 38}</span>
                    <span className="boq-usage-count-sub">Active Projects</span>
                  </div>
                </div>

                <div className="boq-usage-count-item">
                  <div className="boq-usage-count-icon green">
                    <FileText size={18} />
                  </div>
                  <div className="boq-usage-count-text">
                    <span className="boq-usage-count-num">{padNum(template.usageDependencies?.draftTemplatesCount ?? 4)}</span>
                    <span className="boq-usage-count-sub">Draft Templates</span>
                  </div>
                </div>
              </div>

              {/* Right dependencies */}
              <div className="boq-dependencies-col">
                <span className="boq-dependencies-col-title">Dependencies</span>
                {(template.usageDependencies?.dependencies || [
                  { name: "Interior Standard Library", status: "Active" },
                  { name: "Default GST Profile", status: `${template.commercialDefaults?.taxPercent || 18}%` },
                  { name: "Interior Measurement Standard", status: "Active" },
                ]).map((dep, idx) => (
                  <div key={idx} className="boq-dep-item">
                    <div className="boq-dep-sq" />
                    <div className="boq-dep-info">
                      <span className="boq-dep-name">{dep.name}</span>
                      <span className="boq-dep-status">{dep.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning Banner (Component 5) */}
            <div className="boq-usage-warning-banner">
              <span className="boq-usage-warning-text">
                This BOQ Template is actively used by {template.usageDependencies?.projectTemplatesCount ?? 12} Project Templates and {template.usageDependencies?.activeProjectsCount ?? 38} Projects. Changes will create a new version.
              </span>
              <Info size={18} className="boq-usage-warning-icon" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 4: Attention Required, Version Governance, Recent Activity (Figma Frame 2147225201)
         ========================================================================= */}
      <div className="boq-overview-row-3col">
        {/* Card 1: Attention Required */}
        <div className="boq-overview-card boq-card-attention">
          <div className="boq-overview-card-head">
            <h3 className="boq-overview-card-title">Attention Required</h3>
            <span className="boq-attention-badge">
              {padNum(template.attentionRequired?.total ?? 8)} Issues
            </span>
          </div>

          <div className="boq-attention-cols">
            {/* Critical */}
            <div className="boq-attention-col-item">
              <span className="boq-attention-col-label critical">CRITICAL</span>
              <div className="boq-attention-col-count-row">
                <span className="boq-attention-col-num">
                  {padNum(template.attentionRequired?.critical ?? 1)}
                </span>
                <span className="boq-attention-col-sub">Missing Cost References</span>
              </div>
            </div>

            {/* Warning */}
            <div className="boq-attention-col-item">
              <span className="boq-attention-col-label warning">WARNING</span>
              <div className="boq-attention-col-count-row">
                <span className="boq-attention-col-num">
                  {padNum(template.attentionRequired?.warning ?? 5)}
                </span>
                <span className="boq-attention-col-sub">Outdated rate References</span>
              </div>
            </div>

            {/* Info */}
            <div className="boq-attention-col-item">
              <span className="boq-attention-col-label info">INFO</span>
              <div className="boq-attention-col-count-row">
                <span className="boq-attention-col-num">
                  {padNum(template.attentionRequired?.info ?? 1)}
                </span>
                <span className="boq-attention-col-sub">Deprecated Item</span>
              </div>
            </div>
          </div>

          <div className="boq-attention-bottom-link-row">
            <button
              type="button"
              className="boq-overview-card-link"
              onClick={() => {
                if (onNotice) onNotice("Reviewing all template issues.");
                onNavigateTab("Costing");
              }}
            >
              Review All Issues →
            </button>
          </div>
        </div>

        {/* Card 2: Version Governance */}
        <div className="boq-overview-card boq-card-version">
          <div className="boq-overview-card-head">
            <h3 className="boq-overview-card-title">Version Governance</h3>
            <button
              type="button"
              className="boq-overview-card-link"
              onClick={() => onNavigateTab("Versions")}
            >
              View Versions →
            </button>
          </div>

          <div className="boq-version-gov-body">
            {/* Left */}
            <div className="boq-version-left-col">
              <div className="boq-version-number">{template.versionGovernance?.version || "v2.4"}</div>
              <span className="boq-version-status-pill">{template.versionGovernance?.status || "Current • Active"}</span>
              <div className="boq-version-published-box">
                <span className="boq-version-pub-label">Published</span>
                <span className="boq-version-pub-date">{template.versionGovernance?.publishedDate || "08 Aug 2026"}</span>
              </div>
            </div>

            <div className="boq-version-vdivider" />

            {/* Right */}
            <div className="boq-version-right-col">
              <span className="boq-version-changes-title">Changes since v2.3</span>
              <div className="boq-version-changes-list">
                {(template.versionGovernance?.changes || [
                  { type: "add", text: "+4 Items Added" },
                  { type: "add", text: "+1 Sections Added" },
                  { type: "update", text: "-7 Rate mappings updated" },
                  { type: "remove", text: "-1 Deprecated item removed" },
                ]).map((change, idx) => {
                  const parts = change.text.split(" ");
                  const tag = parts[0] || "";
                  const desc = parts.slice(1).join(" ") || change.text;
                  return (
                    <div key={idx} className="boq-version-change-row">
                      <span className="boq-version-change-tag">{tag}</span>
                      <span className="boq-version-change-text">{desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Recent Activity */}
        <div className="boq-overview-card boq-card-activity">
          <div className="boq-overview-card-head">
            <h3 className="boq-overview-card-title">Recent Activity</h3>
            <button
              type="button"
              className="boq-overview-card-link"
              onClick={() => onNavigateTab("Activity")}
            >
              View Activity →
            </button>
          </div>

          <div className="boq-activity-timeline">
            {/* Event 1: Published */}
            <div className="boq-activity-item">
              <div className="boq-activity-indicator">
                <div className="boq-activity-ring green" />
                <div className="boq-activity-dot green" />
              </div>
              <div className="boq-activity-content">
                <div className="boq-activity-title-line">
                  <span className="boq-activity-action">Published</span>
                  <span className="boq-activity-date">06 Aug 2026</span>
                  <span className="boq-activity-time">14:32</span>
                </div>
                <span className="boq-activity-detail">Pradhyumn Published v3.2</span>
              </div>
            </div>

            <div className="boq-activity-divider" />

            {/* Event 2: Approved */}
            <div className="boq-activity-item">
              <div className="boq-activity-indicator">
                <div className="boq-activity-ring purple" />
                <div className="boq-activity-dot purple" />
              </div>
              <div className="boq-activity-content">
                <div className="boq-activity-title-line">
                  <span className="boq-activity-action">Approved</span>
                  <span className="boq-activity-date">06 Aug 2026</span>
                  <span className="boq-activity-time">14:11</span>
                </div>
                <span className="boq-activity-detail">Version approved for publishing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
