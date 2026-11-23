"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MoodBoardPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function MoodBoardPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: MoodBoardPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Generate page numbers
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="mb-pagination-footer">
      {/* Total Count */}
      <div className="mb-total-count">
        Total Moodboards: {totalItems}
      </div>

      {/* Page controls */}
      <div className="mb-page-controls" aria-label="Pagination">
        <button
          type="button"
          className="mb-page-btn"
          aria-label="Previous page"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`mb-page-btn ${p === safeCurrentPage ? "is-active" : ""}`}
            aria-current={p === safeCurrentPage ? "page" : undefined}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          className="mb-page-btn"
          aria-label="Next page"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Show per page */}
      <div className="mb-per-page-select">
        <label htmlFor="mb-page-size-select" className="mb-per-page-label">
          Show per Page:
        </label>
        <select
          id="mb-page-size-select"
          className="mb-per-page-dropdown"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>
  );
}
