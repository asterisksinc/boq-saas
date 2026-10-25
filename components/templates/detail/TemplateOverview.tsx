"use client";

import React from "react";

interface AreaItem {
  name: string;
  sections?: { items?: unknown[]; itemsCount?: number }[];
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
    createdBy?: string;
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
      stages?: number;
      categories?: number;
      paymentStages?: number;
      teamsUsing?: number;
    };
    structure?: {
      areas?: AreaItem[];
    };
    costingBoq?: {
      sections?: unknown[];
      items?: unknown[];
      categories?: unknown[];
    };
    workflow?: {
      stages?: unknown[];
      tasks?: unknown[];
      milestones?: unknown[];
      approvals?: unknown[];
    };
    documents?: unknown[];
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
  const areas = Array.isArray(template.structure?.areas) ? template.structure.areas : [];

  const roomsCount = comp.rooms ?? areas.length;
  const boqSectionsCount = comp.boqSections ?? (Array.isArray(template.costingBoq?.sections) ? template.costingBoq.sections.length : 0);
  const itemsCount = comp.items ?? (Array.isArray(template.costingBoq?.items) ? template.costingBoq.items.length : 0);
  const milestonesCount = comp.milestones ?? (Array.isArray(template.workflow?.milestones) ? template.workflow.milestones.length : 0);
  const documentsCount = comp.documents ?? (Array.isArray(template.documents) ? template.documents.length : 0);
  const approvalsCount = comp.approvals ?? (Array.isArray(template.workflow?.approvals) ? template.workflow.approvals.length : 0);
  const categoriesCount = comp.categories ?? (Array.isArray(template.costingBoq?.categories) ? template.costingBoq.categories.length : 0);
  const paymentStagesCount = comp.paymentStages ?? (Array.isArray(template.workflow?.stages) ? template.workflow.stages.length : (comp.stages ?? 0));
  const teamsUsingCount = comp.teamsUsing ?? (template.useCount && template.useCount > 0 ? 1 : 0);

  // Derive rooms for Included Project Structure
  const displayAreas = areas.map((a) => {
    const secCount = a.sections?.length || 0;
    const itmCount = a.sections?.reduce(
      (sum, s) => sum + (Array.isArray(s.items) ? s.items.length : (s.itemsCount || 0)),
      0
    ) || 0;
    return {
      name: a.name,
      sections: secCount,
      items: itmCount,
    };
  });

  const versionVal = template.version;
  const versionStr = versionVal
    ? String(versionVal).startsWith("v")
      ? String(versionVal)
      : `v${versionVal}`
    : "v1.0";

  const status = (template.status || "ACTIVE").toUpperCase();
  const statusClass =
    status === "ACTIVE"
      ? "status-pill-active"
      : status.includes("REVIEW")
      ? "status-pill-review"
      : "status-pill-draft";

  const totalUses = template.useCount ?? 0;
  const projectsCreated = template.useCount ?? 0;

  const nextReviewDate = template.updatedAt
    ? new Date(new Date(template.updatedAt).getTime() + 90 * 86400000).toISOString()
    : null;

  return (
    <div className="td-overview-wrapper">
      {/* ── Middle Section: Frame 2147225128 (Template Summary + Template Composition) ── */}
      <div className="td-overview-top-row">
        {/* Left Panel: Frame 2147225071: TEMPLATE SUMMARY */}
        <section className="td-outer-panel td-summary-outer" aria-labelledby="template-summary-heading">
          <div className="td-panel-header-row">
            <h3 id="template-summary-heading" className="td-panel-heading">
              TEMPLATE SUMMARY
            </h3>
          </div>

          <div className="td-inner-card td-summary-inner">
            <div className="td-summary-grid">
              <div className="td-summary-item">
                <span className="td-summary-label">Business Type</span>
                <span className="td-summary-value">{template.businessType || "Residential"}</span>
              </div>

              <div className="td-summary-item">
                <span className="td-summary-label">Team</span>
                <span className="td-summary-value">{template.team || "Residential Design"}</span>
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
                <span className="td-summary-value">{formatDate(template.createdAt)}</span>
              </div>

              <div className="td-summary-item">
                <span className="td-summary-label">Last Updated</span>
                <span className="td-summary-value">{formatDate(template.updatedAt)}</span>
              </div>

              <div className="td-summary-item">
                <span className="td-summary-label">Tags</span>
                <span className="td-summary-value">
                  {template.tags && template.tags.length > 0 ? template.tags.join(", ") : "—"}
                </span>
              </div>

              <div className="td-summary-item">
                <span className="td-summary-label">Last Viewed</span>
                <span className="td-summary-value">
                  {formatDate(template.lastUsedAt || template.updatedAt)}
                </span>
              </div>
            </div>

            <div className="td-summary-desc-block">
              <span className="td-summary-label">Description</span>
              <p className="td-summary-desc-text">
                {template.description || "No description provided for this template."}
              </p>
            </div>
          </div>
        </section>

        {/* Right Panel: Frame 2147225075: TEMPLATE COMPOSITION */}
        <section className="td-outer-panel td-comp-outer" aria-labelledby="template-composition-heading">
          <div className="td-panel-header-row">
            <h3 id="template-composition-heading" className="td-panel-heading">
              TEMPLATE COMPOSITION
            </h3>
          </div>

          <div className="td-inner-card td-comp-inner">
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
        </section>
      </div>

      {/* ── Bottom Section: Frame 2147225129 (3 Equal Panels) ── */}
      <div className="td-overview-bottom-grid">
        {/* Panel 1: Frame 2147225075: INCLUDED PROJECT STRUCTURE */}
        <section className="td-outer-panel td-structure-outer" aria-labelledby="template-structure-heading">
          <div className="td-panel-header-row">
            <h3 id="template-structure-heading" className="td-panel-heading">
              INCLUDED PROJECT STRUCTURE
            </h3>
          </div>

          <div className="td-inner-card td-structure-inner">
            <div className="td-structure-table-wrap">
              {/* Frame 57: Table Header */}
              <div className="td-structure-table-header">
                <span className="col-rooms">ROOMS ({roomsCount})</span>
                <span className="col-sec">BOQ SECTIONS</span>
                <span className="col-itm">ITEMS</span>
              </div>

              {/* Data Rows: Frame 61 / Frame 59 */}
              <div className="td-structure-table-body">
                {displayAreas.length > 0 ? (
                  displayAreas.map((area, idx) => (
                    <div key={idx} className="td-structure-table-row">
                      <span className="area-name" title={area.name}>
                        {area.name}
                      </span>
                      <span className="area-sec">{area.sections}</span>
                      <span className="area-itm">{area.items}</span>
                    </div>
                  ))
                ) : (
                  <div className="td-structure-empty-state">
                    No rooms configured for this template.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Panel 2: Frame 2147225078: STATUS & GOVERNANCE */}
        <section className="td-outer-panel td-gov-outer" aria-labelledby="template-governance-heading">
          <div className="td-panel-header-row">
            <h3 id="template-governance-heading" className="td-panel-heading">
              STATUS &amp; GOVERNANCE
            </h3>
          </div>

          <div className="td-inner-card td-gov-inner">
            <div className="td-gov-list">
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
                  {formatDate(template.publishedAt || template.createdAt)}
                </span>
              </div>
              <div className="td-gov-row">
                <span className="td-gov-label">Published by</span>
                <span className="td-gov-val">{template.updatedBy || template.createdBy || "Admin"}</span>
              </div>
              <div className="td-gov-row">
                <span className="td-gov-label">Next Review</span>
                <span className="td-gov-val">{formatDate(nextReviewDate)}</span>
              </div>
              <div className="td-gov-row">
                <span className="td-gov-label">Last Updated</span>
                <span className="td-gov-val">{formatDate(template.updatedAt)}</span>
              </div>
              <div className="td-gov-row">
                <span className="td-gov-label">Last Viewed</span>
                <span className="td-gov-val">
                  {formatDate(template.lastUsedAt || template.updatedAt)}
                </span>
              </div>
            </div>

            {/* Rectangle 71: Divider */}
            <div className="td-divider-line" />

            {/* Frame 2147225110: Health Row */}
            <div className="td-health-row">
              <span className="td-health-label">Template Health</span>
              <span className="td-health-pill">HEALTHY</span>
            </div>
          </div>
        </section>

        {/* Panel 3: Frame 2147225077: USAGE SUMMARY */}
        <section className="td-outer-panel td-usage-outer" aria-labelledby="template-usage-heading">
          <div className="td-panel-header-row">
            <h3 id="template-usage-heading" className="td-panel-heading">
              USAGE SUMMARY
            </h3>
          </div>

          <div className="td-inner-card td-usage-inner">
            <div className="td-usage-list">
              <div className="td-usage-row">
                <span className="td-usage-label">Total Uses</span>
                <span className="td-usage-val">{totalUses}</span>
              </div>
              <div className="td-usage-row">
                <span className="td-usage-label">Projects Created</span>
                <span className="td-usage-val">{projectsCreated}</span>
              </div>
              <div className="td-usage-row">
                <span className="td-usage-label">Last Used</span>
                <span className="td-usage-val">{formatDate(template.lastUsedAt)}</span>
              </div>
            </div>

            {/* Rectangle 71: Divider */}
            <div className="td-divider-line" />

            {/* Frame 2147225110: View Usage Analytics link */}
            <button
              type="button"
              className="td-view-analytics-btn"
              onClick={onViewUsageAnalytics}
            >
              <span>View Usage Analytics</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
