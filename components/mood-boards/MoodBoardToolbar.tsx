"use client";

import React from "react";
import { Search, Filter, LayoutGrid, List, X } from "lucide-react";

interface MoodBoardToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilterCount: number;
  onToggleFilter: () => void;
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
}

export default function MoodBoardToolbar({
  searchQuery,
  onSearchChange,
  activeFilterCount,
  onToggleFilter,
  viewMode,
  onViewModeChange,
}: MoodBoardToolbarProps) {
  return (
    <div className="mb-toolbar-row">
      <div className="mb-toolbar-left">
        {/* Search Field (Frame 76 + Frame 70) */}
        <div className="mb-search-box">
          <div className="mb-search-icon-wrap" aria-hidden="true">
            <Search size={16} />
          </div>
          <input
            type="text"
            className="mb-search-input"
            placeholder="Search mood boards, projects or clients..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search mood boards, projects or clients"
          />
          {searchQuery && (
            <button
              type="button"
              className="mb-search-clear"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          type="button"
          className={`mb-filter-btn ${activeFilterCount > 0 ? "has-filters" : ""}`}
          onClick={onToggleFilter}
          aria-label="Open filter popover"
          aria-expanded={activeFilterCount > 0}
        >
          <Filter size={18} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="mb-filter-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* View Selector Controls */}
      <div className="mb-view-selector" role="group" aria-label="View mode">
        <button
          type="button"
          className={`mb-view-btn ${viewMode === "list" ? "is-active" : ""}`}
          onClick={() => onViewModeChange("list")}
          title="List view"
          aria-label="List view"
          aria-pressed={viewMode === "list"}
        >
          <List size={18} />
        </button>
        <button
          type="button"
          className={`mb-view-btn ${viewMode === "grid" ? "is-active" : ""}`}
          onClick={() => onViewModeChange("grid")}
          title="Grid view"
          aria-label="Grid view"
          aria-pressed={viewMode === "grid"}
        >
          <LayoutGrid size={18} />
        </button>
      </div>
    </div>
  );
}
