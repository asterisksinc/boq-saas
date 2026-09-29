"use client";

import React from "react";
import { X, Check } from "lucide-react";

export interface TemplateFilterState {
  businessType: string;
  status: string;
  region: string;
}

interface TemplateFilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  filters: TemplateFilterState;
  onChange: (filters: TemplateFilterState) => void;
  onReset: () => void;
}

export default function TemplateFilterPopover({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
}: TemplateFilterPopoverProps) {
  if (!isOpen) return null;

  const businessTypes = [
    "All",
    "Residential",
    "Commercial",
    "Hospitality",
    "Retail",
    "Healthcare",
    "Educational",
    "Industrial",
  ];

  const statuses = [
    { label: "All", value: "All" },
    { label: "Active", value: "active" },
    { label: "Draft", value: "draft" },
    { label: "Needs Review", value: "needs_review" },
  ];

  const regions = [
    "All",
    "Global",
    "North America",
    "Europe",
    "Middle East",
    "India",
    "Asia Pacific",
  ];

  return (
    <div className="template-filter-dropdown" onClick={e => e.stopPropagation()}>
      <div className="tfd-header">
        <span className="tfd-title">Filter Templates</span>
        <button type="button" className="tfd-close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className="tfd-body">
        <div className="tfd-group">
          <label className="tfd-label">Business Type</label>
          <div className="tfd-options">
            {businessTypes.map(bt => {
              const active = (bt === "All" && !filters.businessType) || filters.businessType === bt;
              return (
                <button
                  key={bt}
                  type="button"
                  className={`tfd-chip ${active ? "active" : ""}`}
                  onClick={() => onChange({ ...filters, businessType: bt === "All" ? "" : bt })}
                >
                  {active && <Check size={12} />}
                  <span>{bt}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="tfd-group">
          <label className="tfd-label">Status</label>
          <div className="tfd-options">
            {statuses.map(st => {
              const active = (st.value === "All" && !filters.status) || filters.status === st.value;
              return (
                <button
                  key={st.value}
                  type="button"
                  className={`tfd-chip ${active ? "active" : ""}`}
                  onClick={() => onChange({ ...filters, status: st.value === "All" ? "" : st.value })}
                >
                  {active && <Check size={12} />}
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="tfd-group">
          <label className="tfd-label">Region</label>
          <select
            className="tfd-select"
            value={filters.region}
            onChange={e => onChange({ ...filters, region: e.target.value })}
          >
            {regions.map(r => (
              <option key={r} value={r === "All" ? "" : r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="tfd-footer">
        <button type="button" className="tfd-reset" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="tfd-apply" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
