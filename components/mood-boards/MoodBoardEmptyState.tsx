"use client";

import React from "react";
import { Images, Plus, RotateCcw } from "lucide-react";

interface MoodBoardEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
  onCreateNew?: () => void;
}

export default function MoodBoardEmptyState({
  isFiltered,
  onResetFilters,
  onCreateNew,
}: MoodBoardEmptyStateProps) {
  return (
    <div className="mb-empty-state">
      <div className="mb-empty-icon">
        <Images size={32} />
      </div>
      <h3 className="mb-empty-title">
        {isFiltered ? "No matching mood boards found" : "No mood boards yet"}
      </h3>
      <p className="mb-empty-desc">
        {isFiltered
          ? "Try adjusting your search query or clear your active filters to see all mood boards."
          : "Create your first interior design mood board to organize concept imagery, materials, and palettes."}
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        {isFiltered && onResetFilters ? (
          <button
            type="button"
            className="mb-btn mb-btn-secondary"
            onClick={onResetFilters}
          >
            <RotateCcw size={16} />
            <span>Reset Filters</span>
          </button>
        ) : null}
        {onCreateNew ? (
          <button
            type="button"
            className="mb-btn mb-btn-primary"
            onClick={onCreateNew}
          >
            <Plus size={16} />
            <span>New Mood Board</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
