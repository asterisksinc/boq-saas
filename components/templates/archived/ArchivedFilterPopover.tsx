"use client";

import React, { useEffect, useRef } from "react";
import { X, Check, RotateCcw } from "lucide-react";

export interface ArchivedFilterState {
  category: string;
  type: string;
  sort: string;
}

interface ArchivedFilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  filters: ArchivedFilterState;
  onChange: (filters: ArchivedFilterState) => void;
  onReset: () => void;
}

export default function ArchivedFilterPopover({
  isOpen,
  onClose,
  categories,
  filters,
  onChange,
  onReset,
}: ArchivedFilterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "PROJECT TEMPLATE", label: "Project Templates" },
    { value: "BOQ TEMPLATE", label: "BOQ Templates" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest Archived First" },
    { value: "oldest", label: "Oldest Archived First" },
    { value: "name", label: "Template Name (A-Z)" },
    { value: "usage", label: "Most Used in Projects" },
  ];

  const uniqueCategories = Array.from(new Set(["all", ...categories]));

  return (
    <div
      ref={popoverRef}
      className="archived-filter-popover"
      role="dialog"
      aria-modal="true"
      aria-label="Filter archived templates"
    >
      <div className="archived-filter-header">
        <h3 className="archived-filter-title">Filter Archived</h3>
        <button
          type="button"
          className="archived-filter-close-btn"
          onClick={onClose}
          aria-label="Close filters"
        >
          <X size={16} />
        </button>
      </div>

      <div className="archived-filter-body">
        {/* Template Type Filter */}
        <div className="archived-filter-group">
          <label className="archived-filter-label">Template Type</label>
          <div className="archived-filter-chip-row">
            {typeOptions.map((opt) => {
              const active = (filters.type || "all") === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`archived-filter-chip ${active ? "active" : ""}`}
                  onClick={() => onChange({ ...filters, type: opt.value })}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter */}
        <div className="archived-filter-group">
          <label className="archived-filter-label" htmlFor="archived-filter-category-select">Category</label>
          <select
            id="archived-filter-category-select"
            className="archived-filter-select"
            value={filters.category || "all"}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
          >
            <option value="all">All Categories</option>
            {uniqueCategories
              .filter((c) => c !== "all")
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className="archived-filter-group">
          <label className="archived-filter-label" htmlFor="archived-filter-sort-select">Sort By</label>
          <select
            id="archived-filter-sort-select"
            className="archived-filter-select"
            value={filters.sort || "newest"}
            onChange={(e) => onChange({ ...filters, sort: e.target.value })}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="archived-filter-footer">
        <button
          type="button"
          className="archived-filter-btn-reset"
          onClick={() => {
            onReset();
          }}
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="archived-filter-btn-apply"
          onClick={onClose}
        >
          <Check size={14} />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
}
