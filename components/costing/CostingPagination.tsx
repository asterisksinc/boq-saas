"use client";

import React from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface CostingPaginationProps {
  total?: number;
  totalItems?: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  label?: string;
  pageSizeOptions?: number[];
  totalPages?: number;
}

export default function CostingPagination({
  total,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  label = "Items",
  pageSizeOptions = [10, 25, 50, 100],
  totalPages: propTotalPages,
}: CostingPaginationProps) {
  const effectiveTotal = total ?? totalItems ?? 0;
  const totalPages = propTotalPages ?? Math.max(1, Math.ceil(effectiveTotal / pageSize));

  // Generate page numbers with ellipses if many pages
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 20px",
        borderTop: "1px solid #e2e8f0",
        background: "#f8fafc",
        flexWrap: "wrap",
        gap: "12px",
        fontSize: "13px",
      }}
    >
      <div style={{ color: "#64748b", fontWeight: 500 }}>
        Total {label}: <strong style={{ color: "#1e293b" }}>{total}</strong>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            style={{
              padding: "5px 10px",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              background: "#ffffff",
              color: currentPage <= 1 ? "#cbd5e1" : "#64748b",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={14} />
          </button>

          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`dots-${idx}`} style={{ padding: "0 4px", color: "#94a3b8" }}>
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(Number(p))}
                style={{
                  padding: "5px 11px",
                  border: isCurrent ? "1px solid #2563eb" : "1px solid #e2e8f0",
                  borderRadius: "6px",
                  background: isCurrent ? "#eff6ff" : "#ffffff",
                  color: isCurrent ? "#2563eb" : "#64748b",
                  cursor: "pointer",
                  fontWeight: isCurrent ? 700 : 500,
                  fontSize: "13px",
                  transition: "all 0.15s ease",
                }}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            style={{
              padding: "5px 10px",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              background: "#ffffff",
              color: currentPage >= totalPages ? "#cbd5e1" : "#64748b",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {onPageSizeChange && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569" }}>
          <span>Show per Page:</span>
          <div style={{ position: "relative" }}>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                appearance: "none",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "5px 28px 5px 10px",
                fontSize: "13px",
                color: "#1e293b",
                fontWeight: 500,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              color="#64748b"
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
