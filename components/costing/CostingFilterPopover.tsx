"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, X, Check } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

interface CostingFilterPopoverProps {
  statusFilter?: string;
  currentStatus?: string;
  onStatusChange?: (status: string) => void;
  onApply?: (filters: { status: string; category?: string; project?: string }) => void;
  statusOptions?: FilterOption[];
  categoryFilter?: string;
  categoryOptions?: FilterOption[];
  onCategoryChange?: (categoryId: string) => void;
  projectFilter?: string;
  projectOptions?: FilterOption[];
  onProjectChange?: (projectId: string) => void;
  onReset?: () => void;
  title?: string;
  showLabel?: boolean;
}

const DEFAULT_STATUS_OPTIONS: FilterOption[] = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Draft", value: "draft" },
  { label: "Expired", value: "expired" },
];

export default function CostingFilterPopover({
  statusFilter,
  currentStatus,
  onStatusChange,
  onApply,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  categoryFilter = "all",
  onCategoryChange,
  categoryOptions = [],
  projectFilter = "all",
  onProjectChange,
  projectOptions = [],
  onReset,
  title = "Filter Records",
  showLabel = false,
}: CostingFilterPopoverProps) {
  const effectiveStatus = (currentStatus ?? statusFilter ?? "all").toLowerCase();
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const activeCount =
    (effectiveStatus && effectiveStatus !== "all" ? 1 : 0) +
    (categoryFilter && categoryFilter !== "all" ? 1 : 0) +
    (projectFilter && projectFilter !== "all" ? 1 : 0);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 240;
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 12) {
        left = window.innerWidth - popoverWidth - 12;
      }
      setPos({
        top: rect.bottom + window.scrollY + 6,
        left: Math.max(12, left),
      });
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange) onStatusChange("all");
    if (onCategoryChange) onCategoryChange("all");
    if (onProjectChange) onProjectChange("all");
    if (onApply) onApply({ status: "all", category: "all", project: "all" });
    if (onReset) onReset();
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={showLabel ? "costing-filter-btn" : "costing-filter-icon-btn"}
        style={{
          boxSizing: "border-box",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          width: showLabel ? "auto" : "46px",
          padding: showLabel ? "13px 20px" : "0",
          height: "46px",
          background: activeCount > 0 ? "#EFF6FF" : "#FFFFFF",
          border: `1px solid ${activeCount > 0 ? "#2563EB" : "#E2E8F0"}`,
          borderRadius: "6px",
          cursor: "pointer",
          position: "relative",
          outline: "none",
          transition: "all 0.15s ease",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: "14px",
          color: activeCount > 0 ? "#2563EB" : "#0F172A",
        }}
        title="Filter"
        aria-label="Filter"
      >
        <SlidersHorizontal size={18} color={activeCount > 0 ? "#2563EB" : "#0F172A"} />
        {showLabel && <span>Filter</span>}
        {activeCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#2563EB",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: 700,
              padding: "1px 5px",
              borderRadius: "10px",
              lineHeight: 1.2,
            }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {isOpen &&
        pos &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "absolute",
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              zIndex: 99999,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
              padding: "16px",
              width: "250px",
              animation: "fadeIn 0.1s ease-out",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "8px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{title}</span>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Status Filter */}
            {(onStatusChange || onApply) && (
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#64748b",
                    marginBottom: "6px",
                  }}
                >
                  Rate Status
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {statusOptions.map((opt) => {
                    const isSelected = opt.value.toLowerCase() === effectiveStatus;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStatusChange) onStatusChange(opt.value);
                          if (onApply) onApply({ status: opt.value, category: categoryFilter });
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          border: "none",
                          background: isSelected ? "#eff6ff" : "transparent",
                          color: isSelected ? "#2563eb" : "#334155",
                          fontSize: "12.5px",
                          fontWeight: isSelected ? 600 : 400,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check size={14} color="#2563eb" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Project Filter if options provided */}
            {onProjectChange && projectOptions.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#64748b",
                    marginBottom: "6px",
                  }}
                >
                  Project
                </label>
                <select
                  value={projectFilter}
                  onChange={(e) => {
                    onProjectChange(e.target.value);
                    if (onApply) onApply({ status: effectiveStatus, category: categoryFilter, project: e.target.value });
                  }}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "12.5px",
                    color: "#1e293b",
                    outline: "none",
                    background: "#ffffff",
                  }}
                >
                  <option value="all">All Projects</option>
                  {projectOptions.map((p: FilterOption) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Filter if options provided */}
            {onCategoryChange && categoryOptions.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#64748b",
                    marginBottom: "6px",
                  }}
                >
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    onCategoryChange(e.target.value);
                    if (onApply) onApply({ status: effectiveStatus, category: e.target.value, project: projectFilter });
                  }}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "12.5px",
                    color: "#1e293b",
                    outline: "none",
                    background: "#ffffff",
                  }}
                >
                  <option value="all">All Categories</option>
                  {categoryOptions.map((c: FilterOption) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
