"use client";

import React from "react";
import { Copy, Edit3, Play } from "lucide-react";

export type DetailTabType =
  | "Overview"
  | "Structure"
  | "Costing & BOQ"
  | "Workflow"
  | "Documents"
  | "Usage"
  | "Versions"
  | "Activity";

export const DETAIL_TABS: DetailTabType[] = [
  "Overview",
  "Structure",
  "Costing & BOQ",
  "Workflow",
  "Documents",
  "Usage",
  "Versions",
  "Activity",
];

interface TemplateDetailTabsProps {
  activeTab: DetailTabType;
  onChangeTab: (tab: DetailTabType) => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onUseTemplate: () => void;
}

export default function TemplateDetailTabs({
  activeTab,
  onChangeTab,
  onDuplicate,
  onEdit,
  onUseTemplate,
}: TemplateDetailTabsProps) {
  return (
    <div className="td-tabs-bar-row">
      <nav className="td-tabs-pill-nav" role="tablist" aria-label="Template Detail Tabs">
        {DETAIL_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`td-tab-pill-btn ${isActive ? "active" : ""}`}
              onClick={() => onChangeTab(tab)}
            >
              {tab}
            </button>
          );
        })}
      </nav>

      <div className="td-tabs-actions">
        <button
          type="button"
          className="td-icon-action-btn"
          title="Duplicate template"
          aria-label="Duplicate template"
          onClick={onDuplicate}
        >
          <Copy size={16} />
        </button>

        <button
          type="button"
          className="td-icon-action-btn"
          title="Edit template"
          aria-label="Edit template"
          onClick={onEdit}
        >
          <Edit3 size={16} />
        </button>

        <button
          type="button"
          className="td-primary-use-btn"
          onClick={onUseTemplate}
        >
          <span>Use Template</span>
        </button>
      </div>
    </div>
  );
}
