"use client";

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (perPage: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange
}: Props) {
    if (totalItems === 0) return null;

    return (
        <div className="intg-pagination">
            <div className="intg-pagination-total">
                Total: <strong>{totalItems}</strong>
            </div>
            
            <div className="intg-pagination-controls">
                <button 
                    className="intg-pagination-btn" 
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="intg-pagination-pages">
                    {currentPage} / {totalPages || 1}
                </span>
                <button 
                    className="intg-pagination-btn" 
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
            
            <div className="intg-pagination-per-page">
                Show per Page:{' '}
                <select 
                    value={itemsPerPage} 
                    onChange={e => onItemsPerPageChange?.(Number(e.target.value))}
                    className="intg-input intg-input-sm"
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                </select>
            </div>
        </div>
    );
}
