"use client";

import React from "react";
import { X } from "lucide-react";

export interface BoqFilterState {
  status: string[];
  projectType: string[];
  category: string;
  mapping: string[];
  usedIn: string;
}

export const emptyBoqFilters: BoqFilterState = {
  status: [],
  projectType: [],
  category: "all",
  mapping: [],
  usedIn: "all",
};

export const initialBoqFilters: BoqFilterState = {
  status: [],
  projectType: [],
  category: "all",
  mapping: [],
  usedIn: "all",
};

interface BoqTemplateFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: BoqFilterState;
  onFilterChange: (newFilters: BoqFilterState) => void;
  onApply: () => void;
  onClear: () => void;
  appliedCount: number;
}

export default function BoqTemplateFilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onApply,
  onClear,
  appliedCount,
}: BoqTemplateFilterDrawerProps) {
  if (!isOpen) return null;

  const toggleArrayFilter = (field: "status" | "projectType" | "mapping", val: string) => {
    const list = [...filters[field]];
    const idx = list.indexOf(val);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(val);
    }
    onFilterChange({ ...filters, [field]: list });
  };

  return (
    <aside className="boq-filter-sidebar" aria-label="Filter BOQ Templates">
      {/* Header: Frame 2147225209 */}
      <div className="boq-filter-sidebar-header">
        <h4 className="boq-filter-sidebar-title">FILTER</h4>
        <button
          type="button"
          className="boq-filter-sidebar-close"
          onClick={onClose}
          aria-label="Close filter panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Template Status */}
      <div className="boq-filter-sidebar-section">
        <span className="boq-filter-sidebar-label">Template Status</span>
        <div className="boq-filter-sidebar-list">
          {[
            { label: "Active", val: "active" },
            { label: "Draft", val: "draft" },
            { label: "Published", val: "published" },
            { label: "Archived", val: "archived" },
          ].map((item) => (
            <label key={item.val} className="boq-filter-sidebar-cb">
              <input
                type="checkbox"
                checked={filters.status.includes(item.val)}
                onChange={() => toggleArrayFilter("status", item.val)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Project Type */}
      <div className="boq-filter-sidebar-section">
        <span className="boq-filter-sidebar-label">Project Type</span>
        <div className="boq-filter-sidebar-list">
          {[
            { label: "Residential", val: "Residential" },
            { label: "Commercial", val: "Commercial" },
            { label: "Hospitality", val: "Hospitality" },
            { label: "Office", val: "Office" },
            { label: "Retail", val: "Retail" },
          ].map((item) => (
            <label key={item.val} className="boq-filter-sidebar-cb">
              <input
                type="checkbox"
                checked={filters.projectType.includes(item.val)}
                onChange={() => toggleArrayFilter("projectType", item.val)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="boq-filter-sidebar-section">
        <span className="boq-filter-sidebar-label">Category</span>
        <select
          className="boq-filter-sidebar-select"
          value={filters.category}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
          aria-label="Filter by Category"
        >
          <option value="all">All Categories</option>
          <option value="INTERIOR">Interior</option>
          <option value="KITCHEN">Kitchen</option>
          <option value="ELECTRICAL">Electrical</option>
          <option value="Flooring">Flooring</option>
          <option value="Plumbing">Plumbing</option>
          <option value="Painting">Painting</option>
          <option value="Commercial">Commercial</option>
        </select>
      </div>

      {/* Cost Mapping */}
      <div className="boq-filter-sidebar-section">
        <span className="boq-filter-sidebar-label">Cost Mapping</span>
        <div className="boq-filter-sidebar-list">
          {[
            { label: "Fully Mapped (≥ 90%)", val: "fully_mapped" },
            { label: "Partially Mapped (70–89%)", val: "partially_mapped" },
            { label: "Unmapped (< 70%)", val: "unmapped" },
            { label: "Need Review", val: "need_review" },
          ].map((item) => (
            <label key={item.val} className="boq-filter-sidebar-cb">
              <input
                type="checkbox"
                checked={filters.mapping.includes(item.val)}
                onChange={() => toggleArrayFilter("mapping", item.val)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Used In */}
      <div className="boq-filter-sidebar-section">
        <span className="boq-filter-sidebar-label">Used In</span>
        <select
          className="boq-filter-sidebar-select"
          value={filters.usedIn}
          onChange={(e) => onFilterChange({ ...filters, usedIn: e.target.value })}
          aria-label="Filter by Usage"
        >
          <option value="all">All Usages</option>
          <option value="10+">10+ Templates / Projects</option>
          <option value="6-10">6-10 Templates</option>
          <option value="1-5">1-5 Templates</option>
          <option value="unused">Unused</option>
        </select>
      </div>

      {/* Footer */}
      <div className="boq-filter-sidebar-footer">
        <div className="boq-filter-sidebar-actions">
          <button
            type="button"
            className="boq-filter-sidebar-btn-clear"
            onClick={onClear}
          >
            Clear All
          </button>
          <button
            type="button"
            className="boq-filter-sidebar-btn-apply"
            onClick={onApply}
          >
            Apply Filters
          </button>
        </div>
        <div className="boq-filter-sidebar-summary">
          {appliedCount} {appliedCount === 1 ? "filter" : "filters"} applied
        </div>
      </div>
    </aside>
  );
}
