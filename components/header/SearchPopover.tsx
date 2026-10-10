"use client";

import { useEffect, useState, useRef } from "react";
import { Search, ArrowUpRight, Folder, FileText, Receipt, Loader2 } from "lucide-react";
import { searchDashboard, DashboardSearchResultItem } from "@/lib/api/auth";

interface SearchPopoverProps {
    isOpen: boolean;
    query: string;
    onClose: () => void;
    onSelectQuery: (q: string) => void;
    onNavigate: (url: string) => void;
}

const STORAGE_KEY = "boq_recent_searches";

export default function SearchPopover({
    isOpen,
    query,
    onClose,
    onSelectQuery,
    onNavigate,
}: SearchPopoverProps) {
    const [recents, setRecents] = useState<string[]>([]);
    const [results, setResults] = useState<DashboardSearchResultItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const popoverRef = useRef<HTMLDivElement>(null);
    const searchRequestRef = useRef(0);

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    const validRecents = parsed.filter(
                        (item): item is string => typeof item === "string" && item.trim().length > 0
                    );
                    if (validRecents.length > 0) {
                        setRecents(validRecents.slice(0, 8));
                        return;
                    }
                }
                if (Array.isArray(parsed) && parsed.length > 0) {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch {
            // fallback
        }
        setRecents([]);
    }, []);

    // Save recent search
    const saveRecent = (term: string) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        try {
            const updated = [trimmed, ...recents.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
            setRecents(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
            // ignore
        }
    };

    // Clear recents
    const handleClearRecents = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRecents([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
    };

    // Debounced search when query changes
    useEffect(() => {
        if (!isOpen) return;
        const trimmed = query.trim();
        if (!trimmed) {
            searchRequestRef.current += 1;
            setResults([]);
            setLoading(false);
            setSearchError(null);
            setSelectedIndex(-1);
            return;
        }

        const requestId = ++searchRequestRef.current;
        let isCurrent = true;
        setLoading(true);
        setSearchError(null);
        setSelectedIndex(-1);
        const timer = setTimeout(async () => {
            try {
                const res = await searchDashboard(trimmed);
                if (isCurrent && requestId === searchRequestRef.current) {
                    setResults(res.items || []);
                    setLoading(false);
                }
            } catch (error) {
                if (isCurrent && requestId === searchRequestRef.current) {
                    setResults([]);
                    setLoading(false);
                    setSearchError(
                        error instanceof Error ? error.message : "Search could not be completed."
                    );
                }
            }
        }, 220);

        return () => {
            isCurrent = false;
            clearTimeout(timer);
        };
    }, [query, isOpen]);

    // Keyboard navigation (ArrowDown, ArrowUp, Enter)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const itemsLength = query.trim() ? results.length : recents.length;
            if (itemsLength === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1 >= itemsLength ? 0 : prev + 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev <= 0 ? itemsLength - 1 : prev - 1));
            } else if (e.key === "Enter" && selectedIndex >= 0) {
                e.preventDefault();
                if (query.trim()) {
                    const selected = results[selectedIndex];
                    if (selected) {
                        saveRecent(selected.title);
                        onNavigate(selected.url);
                        onClose();
                    }
                } else {
                    const term = recents[selectedIndex];
                    if (term) {
                        onSelectQuery(term);
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, query, results, recents, selectedIndex, onNavigate, onClose, onSelectQuery]);

    if (!isOpen) return null;

    const isSearching = Boolean(query.trim());

    return (
        <div
            ref={popoverRef}
            className="fig-dashboard-search-popover"
            role="dialog"
            aria-label="Search results"
            onClick={(e) => e.stopPropagation()}
        >
            {!isSearching ? (
                // Recents View
                <div>
                    <div className="fig-search-popover-header">
                        <span className="fig-search-heading">RECENT</span>
                        {recents.length > 0 && (
                            <button
                                type="button"
                                className="fig-search-clear-btn"
                                onClick={handleClearRecents}
                            >
                                CLEAR
                            </button>
                        )}
                    </div>
                    {recents.length === 0 ? (
                        <div className="fig-search-empty">No recent searches yet.</div>
                    ) : (
                        <ul className="fig-search-list">
                            {recents.map((item, idx) => (
                                <li
                                    key={item + idx}
                                    className={`fig-search-item ${selectedIndex === idx ? "is-selected" : ""}`}
                                    onClick={() => {
                                        onSelectQuery(item);
                                    }}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                >
                                    <Search size={15} className="fig-search-item-icon" />
                                    <span className="fig-search-item-text">{item}</span>
                                    <ArrowUpRight size={15} className="fig-search-item-arrow" />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                // Live Results View
                <div>
                    <div className="fig-search-popover-header">
                        <span className="fig-search-heading">
                            {loading ? "SEARCHING..." : `RESULTS (${results.length})`}
                        </span>
                        {loading && <Loader2 size={13} className="fig-search-spinner" />}
                    </div>

                    {searchError ? (
                        <div className="fig-search-empty" role="alert">
                            {searchError}
                        </div>
                    ) : loading && results.length === 0 ? (
                        <div className="fig-search-loading">
                            <Loader2 size={18} className="fig-search-spinner" />
                            <span>Searching projects, BOQs, and invoices...</span>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="fig-search-empty">
                            No results found for &ldquo;{query}&rdquo;
                        </div>
                    ) : (
                        <ul className="fig-search-list">
                            {results.map((item, idx) => (
                                <li
                                    key={item.id + idx}
                                    className={`fig-search-item ${selectedIndex === idx ? "is-selected" : ""}`}
                                    onClick={() => {
                                        saveRecent(item.title);
                                        onNavigate(item.url);
                                        onClose();
                                    }}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                >
                                    <span className="fig-search-type-icon">
                                        {item.type === "project" && <Folder size={15} />}
                                        {item.type === "boq" && <FileText size={15} />}
                                        {item.type === "invoice" && <Receipt size={15} />}
                                    </span>
                                    <div className="fig-search-item-content">
                                        <div className="fig-search-item-title">{item.title}</div>
                                        {item.subtitle && (
                                            <div className="fig-search-item-subtitle">{item.subtitle}</div>
                                        )}
                                    </div>
                                    {item.status && (
                                        <span className={`fig-search-badge fig-search-badge-${item.status.toLowerCase()}`}>
                                            {item.status}
                                        </span>
                                    )}
                                    <ArrowUpRight size={15} className="fig-search-item-arrow" />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
