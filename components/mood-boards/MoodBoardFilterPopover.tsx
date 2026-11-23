"use client";

import React, { useRef, useEffect } from "react";
import { X, Check } from "lucide-react";
import { MoodBoardFilterState } from "@/lib/mood-boards/types";
import { MOCK_PROJECTS, MOCK_CLIENTS, MOCK_CREATORS } from "@/lib/mood-boards/mock-data";

interface MoodBoardFilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  filters: MoodBoardFilterState;
  onApply: (newFilters: MoodBoardFilterState) => void;
  onReset: () => void;
}

export default function MoodBoardFilterPopover({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
}: MoodBoardFilterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [draftFilters, setDraftFilters] = React.useState<MoodBoardFilterState>(filters);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

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

  const statuses = [
    { label: "All Statuses", value: "ALL" },
    { label: "Draft", value: "DRAFT" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Archived", value: "ARCHIVED" },
  ];

  return (
    <div className="mb-filter-popover" ref={popoverRef} role="dialog" aria-label="Filter mood boards">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="mb-filter-title">Filters</span>
        <button
          type="button"
          onClick={onClose}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}
          aria-label="Close filters"
        >
          <X size={16} />
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-filter-section">
        <label className="mb-form-label">Status</label>
        <div className="mb-filter-options">
          {statuses.map((st) => {
            const isActive = draftFilters.status === st.value;
            return (
              <button
                key={st.value}
                type="button"
                className={`mb-filter-chip ${isActive ? "active" : ""}`}
                onClick={() => setDraftFilters({ ...draftFilters, status: st.value })}
              >
                {isActive && <Check size={12} style={{ marginRight: 4, display: "inline" }} />}
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Project Filter */}
      <div className="mb-filter-section">
        <label htmlFor="mb-filter-project" className="mb-form-label">
          Project
        </label>
        <select
          id="mb-filter-project"
          className="mb-form-select"
          value={draftFilters.projectId}
          onChange={(e) => setDraftFilters({ ...draftFilters, projectId: e.target.value })}
        >
          <option value="ALL">All Projects</option>
          {MOCK_PROJECTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Client Filter */}
      <div className="mb-filter-section">
        <label htmlFor="mb-filter-client" className="mb-form-label">
          Client
        </label>
        <select
          id="mb-filter-client"
          className="mb-form-select"
          value={draftFilters.clientId}
          onChange={(e) => setDraftFilters({ ...draftFilters, clientId: e.target.value })}
        >
          <option value="ALL">All Clients</option>
          {MOCK_CLIENTS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.subtitle ? `(${c.subtitle})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Created By Filter */}
      <div className="mb-filter-section">
        <label htmlFor="mb-filter-creator" className="mb-form-label">
          Created By
        </label>
        <select
          id="mb-filter-creator"
          className="mb-form-select"
          value={draftFilters.createdBy}
          onChange={(e) => setDraftFilters({ ...draftFilters, createdBy: e.target.value })}
        >
          <option value="ALL">All Team Members</option>
          {MOCK_CREATORS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* Footer Buttons */}
      <div className="mb-filter-actions">
        <button
          type="button"
          className="mb-btn mb-btn-secondary"
          style={{ height: 36, padding: "0 12px", fontSize: 13 }}
          onClick={() => {
            onReset();
            onClose();
          }}
        >
          Clear All
        </button>
        <button
          type="button"
          className="mb-btn mb-btn-primary"
          style={{ height: 36, padding: "0 16px", fontSize: 13 }}
          onClick={() => {
            onApply(draftFilters);
            onClose();
          }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
