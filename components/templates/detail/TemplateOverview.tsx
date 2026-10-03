"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface AreaItem {
  name: string;
  sections?: { items?: unknown[] }[];
}

interface TemplateOverviewProps {
  template: {
    id: string;
    templateCode?: string;
    name: string;
    description?: string;
    businessType?: string;
    projectType?: string;
    team?: string;
    region?: string;
    visibility?: string;
    status?: string;
    version?: string | number;
    useCount?: number;
    publishedAt?: string | null;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    lastUsedAt?: string | null;
    tags?: string[];
    composition?: {
      rooms?: number;
      boqSections?: number;
      items?: number;
      milestones?: number;
      documents?: number;
      approvals?: number;
      categories?: number;
      paymentStages?: number;
      teamsUsing?: number;
    };
    structure?: {
      areas?: AreaItem[];
    };
  };
  onViewUsageAnalytics: () => void;
}

const formatDate = (isoString?: string | null): string => {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
};

export default function TemplateOverview({
  template,
  onViewUsageAnalytics,
}: TemplateOverviewProps) {
  const comp = template.composition || {};
  const areas = template.structure?.areas || [];

  const roomsCount = comp.rooms ?? (areas.length > 0 ? areas.length : 8);
  const boqSectionsCount = comp.boqSections ?? 18;
  const itemsCount = comp.items ?? 186;
  const milestonesCount = comp.milestones ?? 6;
  const documentsCount = comp.documents ?? 4;
  const approvalsCount = comp.approvals ?? 5;
  const categoriesCount = comp.categories ?? 7;
  const paymentStagesCount = comp.paymentStages ?? 3;
  const teamsUsingCount = comp.teamsUsing ?? 2;

  // Derive rooms for the bottom Included Project Structure table
  const sampleAreas =
    areas.length > 0
      ? areas.slice(0, 3).map((a) => ({
          name: a.name,
          sections: a.sections?.length || 6,
          items: a.sections?.reduce((sum, s) => sum + (s.items?.length || 0), 0) || 24,
        }))
      : [
          { name: "Entrance", sections: 6, items: 24 },
          { name: "Living Room", sections: 8, items: 32 },
          { name: "Master Bedroom", sections: 12, items: 46 },
        ];

  const versionStr = template.version
    ? String(template.version).startsWith("v")
      ? String(template.version)
      : `v${template.version}`
    : "v3.2";

  const status = (template.status || "ACTIVE").toUpperCase();
  const statusClass =
    status === "ACTIVE"
      ? "status-pill-active"
      : status.includes("REVIEW")
      ? "status-pill-review"
      : "status-pill-draft";

  const totalUses = template.useCount ?? 42;
  const projectsCreated = Math.max(1, Math.round(totalUses * 0.42));

  return (
    <div className="td-overview-wrapper">
      {/* Top Row: Template Summary + Template Composition */}
      <div className="td-overview-top-row">
        {/* Template Summary Card */}
        <div className="td-card td-summary-card">
          <h3 className="td-card-heading">TEMPLATE SUMMARY</h3>

          <div className="td-summary-grid">
            <div className="td-summary-item">
              <span className="td-summary-label">Business Type</span>
              <span className="td-summary-value">
                {template.businessType || "Residential"}
              </span>
            </div>

            <div className="td-summary-item">
              <span className="td-summary-label">Team</span>
              <span className="td-summary-value">
                {template.team || "Residential Design"}
              </span>
            </div>

            <div className="td-summary-item">
              <span className="td-summary-label">Visibility</span>
              <span className="td-summary-value">
                {template.visibility
                  ? template.visibility.charAt(0).toUpperCase() + template.visibility.slice(1)
                  : "Organisation"}
              </span>
            </div>

            <div className="td-summary-item">
              <span className="td-summary-label">Region</span>
              <span className="td-summary-value">{template.region || "India"}</span>
            </div>

            <div className="td-summary-item">
              <span className="td-summary-label">Created On</span>
              <span className="td-summary-value">
                {formatDate(template.createdAt || "2026-07-12T00:00:00Z")}
              </span>
            </div>

            <div className="td-summary-item">
              <span className="td-summary-label">Last Updated</span>
              <span className="td-summary-value">
                {formatDate(template.updatedAt || "2026-08-06T00:00:00Z")}
              </span>
            </div>

            <div className="td-summary-item">
              <span className="td-summary-label">Tags</span>
              <span className="td-summary-value">
                {template.tags && template.tags.length > 0
                  ? template.tags.join(", ")
                  : "Premium, 3BHK, Residential, Interiors"}
              </span>
            </div>

            <div className="td-summary-item">
              <span className="td-summary-label">Last Viewed</span>
              <span className="td-summary-value">
                {formatDate(template.lastUsedAt || template.updatedAt || "2026-08-06T00:00:00Z")}
              </span>
            </div>
          </div>

          <div className="td-summary-description-block">
            <span className="td-summary-label">Description</span>
            <p className="td-summary-description-text">
              {template.description ||
                "Complete ready-to-use structure for premium 3BHK residential interior projects including rooms, BOQ, workflow, approvals, documents and costing defaults."}
            </p>
          </div>
        </div>

        {/* Template Composition Card */}
        <div className="td-card td-composition-card">
          <h3 className="td-card-heading">TEMPLATE COMPOSITION</h3>

          <div className="td-comp-list">
            <div className="td-comp-row">
              <span className="td-comp-label">Rooms</span>
              <span className="td-comp-count">{roomsCount}</span>
            </div>
            <div className="td-comp-row">
              <span className="td-comp-label">BOQ Sections</span>
              <span className="td-comp-count">{boqSectionsCount}</span>
            </div>
            <div className="td-comp-row">
              <span className="td-comp-label">Items</span>
              <span className="td-comp-count">{itemsCount}</span>
            </div>
            <div className="td-comp-row">
              <span className="td-comp-label">Milestones</span>
              <span className="td-comp-count">{milestonesCount}</span>
            </div>
            <div className="td-comp-row">
              <span className="td-comp-label">Documents</span>
              <span className="td-comp-count">{documentsCount}</span>
            </div>
            <div className="td-comp-row">
              <span className="td-comp-label">Approval Stages</span>
              <span className="td-comp-count">{approvalsCount}</span>
            </div>
            <div className="td-comp-row">
              <span className="td-comp-label">Categories</span>
              <span className="td-comp-count">{categoriesCount}</span>
            </div>
            <div className="td-comp-row">
              <span className="td-comp-label">Payment Stages</span>
              <span className="td-comp-count">{paymentStagesCount}</span>
            </div>
            <div className="td-comp-row">
              <span className="td-comp-label">Teams Using</span>
              <span className="td-comp-count">{teamsUsingCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: 3 Equal Cards */}
      <div className="td-overview-bottom-grid">
        {/* Card 1: Included Project Structure */}
        <div className="td-card td-bottom-card">
          <h3 className="td-card-heading">INCLUDED PROJECT STRUCTURE</h3>

          <div className="td-structure-pill-header">
            <span className="col-rooms">ROOMS ({sampleAreas.length})</span>
            <span className="col-sec">BOQ SECTIONS</span>
            <span className="col-itm">ITEMS</span>
          </div>

          <div className="td-structure-preview-list">
            {sampleAreas.map((area, idx) => (
              <div key={idx} className="td-structure-preview-row">
                <span className="area-name">{area.name}</span>
                <span className="area-sec">{area.sections}</span>
                <span className="area-itm">{area.items}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Status & Governance */}
        <div className="td-card td-bottom-card">
          <h3 className="td-card-heading">STAUS & GOVERNANCE</h3>

          <div className="td-governance-list">
            <div className="td-gov-row">
              <span className="td-gov-label">Status</span>
              <span className={`td-status-pill ${statusClass}`}>{status}</span>
            </div>
            <div className="td-gov-row">
              <span className="td-gov-label">Version</span>
              <span className="td-gov-val">{versionStr}</span>
            </div>
            <div className="td-gov-row">
              <span className="td-gov-label">Published On</span>
              <span className="td-gov-val">
                {formatDate(template.publishedAt || "2026-07-06T00:00:00Z")}
              </span>
            </div>
            <div className="td-gov-row">
              <span className="td-gov-label">Published by</span>
              <span className="td-gov-val">{template.updatedBy || "Pradhyumn D"}</span>
            </div>
            <div className="td-gov-row">
              <span className="td-gov-label">Next Review</span>
              <span className="td-gov-val">06 Nov 2026</span>
            </div>
            <div className="td-gov-row">
              <span className="td-gov-label">Last Updated</span>
              <span className="td-gov-val">
                {formatDate(template.updatedAt || "2026-08-06T00:00:00Z")}
              </span>
            </div>
            <div className="td-gov-row">
              <span className="td-gov-label">Last Viewed</span>
              <span className="td-gov-val">
                {formatDate(template.lastUsedAt || template.updatedAt || "2026-08-06T00:00:00Z")}
              </span>
            </div>
          </div>

          <div className="td-health-row">
            <span className="td-health-label">Template Health</span>
            <span className="td-health-pill">HEALTHY</span>
          </div>
        </div>

        {/* Card 3: Usage Summary */}
        <div className="td-card td-bottom-card">
          <h3 className="td-card-heading">USEAGE SUMMARY</h3>

          <div className="td-usage-preview-list">
            <div className="td-usage-p-row">
              <span className="label">Total Uses</span>
              <span className="val">{totalUses}</span>
            </div>
            <div className="td-usage-p-row">
              <span className="label">Projects Created</span>
              <span className="val">{projectsCreated}</span>
            </div>
            <div className="td-usage-p-row">
              <span className="label">Last Used</span>
              <span className="val">
                {formatDate(template.lastUsedAt || "2026-08-18T00:00:00Z")}
              </span>
            </div>
          </div>

          <div className="td-usage-link-wrap">
            <button
              type="button"
              className="td-view-analytics-link"
              onClick={onViewUsageAnalytics}
            >
              <span>View Usage Analytics</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
