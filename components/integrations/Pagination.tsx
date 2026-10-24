"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (perPage: number) => void;
    totalLabel?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    totalLabel = "Total Leads"
}: Props) {
    if (totalItems === 0) return null;

    const safeTotalPages = Math.max(1, totalPages || 1);

    // Calculate a window of up to 5 page numbers (e.g. 1 2 3 4 5) matching Figma Frame 2147225165
    const windowSize = 5;
    let startPage = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let endPage = startPage + windowSize - 1;

    if (endPage > safeTotalPages) {
        endPage = safeTotalPages;
        startPage = Math.max(1, endPage - windowSize + 1);
    }

    const pages: number[] = [];
    for (let p = startPage; p <= endPage; p++) {
        pages.push(p);
    }

    return (
        <div className="custom-form-pagination intg-pagination">
            {/* Total Leads (Left) */}
            <div className="custom-form-pagination-total intg-pagination-total">
                {totalLabel}: <strong>{totalItems}</strong>
            </div>

            {/* Page Buttons (Center - Frame 2147225165) */}
            <div className="custom-form-pagination-controls intg-pagination-controls">
                <button
                    type="button"
                    className="custom-form-page-btn custom-form-page-arrow intg-pagination-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={18} />
                </button>

                {pages.map((p) => {
                    const isActive = p === currentPage;
                    return (
                        <button
                            key={p}
                            type="button"
                            className={`custom-form-page-btn ${isActive ? 'custom-form-page-btn-active' : ''}`}
                            onClick={() => onPageChange(p)}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {p}
                        </button>
                    );
                })}

                <button
                    type="button"
                    className="custom-form-page-btn custom-form-page-arrow intg-pagination-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= safeTotalPages}
                    aria-label="Next page"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Show per Page (Right - Frame 2147225167) */}
            <div className="custom-form-pagination-per-page intg-pagination-per-page">
                <span className="custom-form-per-page-label">Show per Page:</span>
                <div className="custom-form-select-wrap">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange?.(Number(e.target.value))}
                        className="custom-form-per-page-select intg-input intg-input-sm"
                        aria-label="Items per page"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                    <ChevronDown size={14} className="custom-form-select-arrow" />
                </div>
            </div>
        </div>
    );
}
