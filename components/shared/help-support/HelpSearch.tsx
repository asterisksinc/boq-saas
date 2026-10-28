"use client";

import React from "react";
import { Search, Loader2, X } from "lucide-react";

export interface HelpSearchProps {
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
    onSubmit?: () => void;
    loading?: boolean;
    placeholder?: string;
    className?: string;
}

export function HelpSearch({
    value,
    onChange,
    onClear,
    onSubmit,
    loading = false,
    placeholder = "Search questions, features, error messages, or topics",
    className = "",
}: HelpSearchProps) {
    return (
        <div className={`help-search-container ${className}`.trim()}>
            <div className="help-global-search">
                <Search size={20} className="search-icon" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && onSubmit) {
                            onSubmit();
                        }
                    }}
                    placeholder={placeholder}
                    aria-label={placeholder}
                />
                {loading && value.trim() !== "" && (
                    <Loader2 size={16} className="spin" style={{ color: "#2563EB", marginRight: "4px" }} />
                )}
                {value && (
                    <button
                        type="button"
                        className="clear-btn"
                        onClick={onClear ? onClear : () => onChange("")}
                        aria-label="Clear search"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}

export default HelpSearch;
