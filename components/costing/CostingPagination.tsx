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
  pageSizeOptions = [10, 20, 50, 100],
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
    <div className="costing-pagination-bar" aria-label="Pagination">
      <div className="costing-pagination-total">
        Total {label}: <span>{effectiveTotal}</span>
      </div>

      {totalPages > 1 ? (
        <div className="costing-pagination-pages">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="costing-page-btn"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} color={currentPage <= 1 ? "#94A3B8" : "#64748B"} />
          </button>

          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`dots-${idx}`}
                  style={{
                    padding: "0 4px",
                    color: "#94A3B8",
                    fontFamily: "'Urbanist', sans-serif",
                    fontWeight: 600,
                  }}
                >
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
                className={`costing-page-btn ${isCurrent ? "is-active" : ""}`}
                aria-label={`Page ${p}`}
                aria-current={isCurrent ? "page" : undefined}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="costing-page-btn"
            aria-label="Next page"
          >
            <ChevronRight size={16} color={currentPage >= totalPages ? "#94A3B8" : "#0F172A"} />
          </button>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {onPageSizeChange && (
        <div className="costing-page-size-wrap">
          <span className="costing-page-size-label">Show per Page:</span>
          <div className="costing-page-size-select-box">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="costing-page-size-select"
              aria-label="Items per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              color="#64748B"
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
