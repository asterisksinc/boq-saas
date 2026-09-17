"use client";

import { useState, useEffect, useMemo } from "react";
import {
    ChevronRight,
    ChevronDown,
    Folder,
    GripVertical,
    Search,
    SlidersHorizontal,
    Plus,
    RefreshCw,
    ChevronLeft
} from "lucide-react";
import { getCostingCategories } from "@/lib/api/costing";
import type { CostingCategoryBackend } from "@/lib/types";
import NewCategoryModal from "./NewCategoryModal";
import CategoryDetail from "./CategoryDetail";

interface CategoriesTabProps {
    searchQuery?: string;
    isNewCategoryOpen?: boolean;
    setIsNewCategoryOpen?: (open: boolean) => void;
    onDetailViewChange?: (isDetail: boolean) => void;
}

export default function CategoriesTab({
    searchQuery = "",
    isNewCategoryOpen,
    setIsNewCategoryOpen,
    onDetailViewChange
}: CategoriesTabProps) {
    const [categories, setCategories] = useState<CostingCategoryBackend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal state (internal or controlled)
    const [internalModalOpen, setInternalModalOpen] = useState(false);
    const showModal = isNewCategoryOpen !== undefined ? isNewCategoryOpen : internalModalOpen;
    const setShowModal = setIsNewCategoryOpen || setInternalModalOpen;

    // Parent ID to pre-populate when clicking '+' on a tree item
    const [modalParentId, setModalParentId] = useState<string | null>(null);

    // Tree state
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
    const [treeSearch, setTreeSearch] = useState("");
    const [showTreeSearchInput, setShowTreeSearchInput] = useState(false);

    // Table state
    const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [tableSearch, setTableSearch] = useState("");

    // Category detail view state
    const [activeDetailCategory, setActiveDetailCategory] = useState<CostingCategoryBackend | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            // Load all categories for complete structure tree and table
            const res = await getCostingCategories({ pageSize: 100 });
            setCategories(res.items || []);
            // Auto expand top categories initially
            const rootIds = (res.items || []).filter((c) => !c.parent_id).map((c) => c.id);
            setExpandedIds(new Set(rootIds.slice(0, 3)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    // Toggle expand/collapse of tree node
    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Tree items grouping
    const rootCategories = useMemo(() => {
        return categories.filter((c) => !c.parent_id);
    }, [categories]);

    const childrenMap = useMemo(() => {
        const map = new Map<string, CostingCategoryBackend[]>();
        for (const cat of categories) {
            if (cat.parent_id) {
                const list = map.get(cat.parent_id) || [];
                list.push(cat);
                map.set(cat.parent_id, list);
            }
        }
        return map;
    }, [categories]);

    // Summary counts
    const totalSections = rootCategories.length;
    const totalItems = useMemo(() => {
        return categories.reduce((sum, c) => sum + (c.itemCount || c.items || 0), 0);
    }, [categories]);

    // Filter categories for the table based on tree selection and search queries
    const effectiveSearch = (searchQuery || tableSearch).trim().toLowerCase();

    const filteredCategories = useMemo(() => {
        let list = categories;

        // Tree filter:
        if (selectedTreeId) {
            // If user selected a root category, show that category and its direct children
            const isRoot = rootCategories.some((r) => r.id === selectedTreeId);
            if (isRoot) {
                const childIds = new Set((childrenMap.get(selectedTreeId) || []).map((c) => c.id));
                list = list.filter((c) => c.id === selectedTreeId || childIds.has(c.id));
            } else {
                // If user selected a subcategory, show only that subcategory
                list = list.filter((c) => c.id === selectedTreeId);
            }
        }

        // Search query filter:
        if (effectiveSearch) {
            list = list.filter(
                (c) =>
                    c.name.toLowerCase().includes(effectiveSearch) ||
                    (c.code && c.code.toLowerCase().includes(effectiveSearch)) ||
                    (c.parentName && c.parentName.toLowerCase().includes(effectiveSearch))
            );
        }

        return list;
    }, [categories, selectedTreeId, rootCategories, childrenMap, effectiveSearch]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
    const paginatedCategories = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCategories.slice(start, start + pageSize);
    }, [filteredCategories, currentPage, pageSize]);

    // Select all rows handler
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedRowIds(new Set(paginatedCategories.map((c) => c.id)));
        } else {
            setSelectedRowIds(new Set());
        }
    };

    const handleSelectRow = (id: string) => {
        setSelectedRowIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "05 Nov 2024";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "05 Nov 2024";
            return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        } catch {
            return "05 Nov 2024";
        }
    };

    const openCreateWithParent = (parentId: string | null, e: React.MouseEvent) => {
        e.stopPropagation();
        setModalParentId(parentId);
        setShowModal(true);
    };

    // If active detail category is opened
    if (activeDetailCategory) {
        return (
            <CategoryDetail
                category={activeDetailCategory}
                onBack={() => {
                    setActiveDetailCategory(null);
                    onDetailViewChange?.(false);
                }}
                allCategories={categories}
            />
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {error && (
                <div
                    style={{
                        padding: "16px",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        borderRadius: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid #fecaca"
                    }}
                >
                    <span>{error}</span>
                    <button
                        onClick={loadData}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#b91c1c",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontWeight: 600
                        }}
                    >
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            )}

            {/* Split Layout: Left Sidebar (Tree) + Right Main Panel (Table) */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "300px 1fr",
                    gap: "24px",
                    alignItems: "flex-start"
                }}
            >
                {/* ── Left Sidebar: Category Structure Tree ── */}
                <div
                    style={{
                        background: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        overflow: "hidden"
                    }}
                >
                    {/* Tree Header */}
                    <div
                        style={{
                            padding: "18px 20px 14px 20px",
                            borderBottom: "1px solid #f1f5f9",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start"
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    letterSpacing: "0.05em",
                                    color: "#6b7280",
                                    textTransform: "uppercase"
                                }}
                            >
                                CATEGORY STRUCTURE
                            </div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#9ca3af",
                                    marginTop: "4px"
                                }}
                            >
                                {totalSections} Sections · {totalItems} Items
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowTreeSearchInput(!showTreeSearchInput)}
                            style={{
                                background: showTreeSearchInput ? "#eff6ff" : "transparent",
                                border: "1px solid",
                                borderColor: showTreeSearchInput ? "#bfdbfe" : "#e5e7eb",
                                borderRadius: "6px",
                                padding: "6px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: showTreeSearchInput ? "#2563eb" : "#6b7280"
                            }}
                            title="Search Structure"
                        >
                            <Search size={15} />
                        </button>
                    </div>

                    {showTreeSearchInput && (
                        <div style={{ padding: "8px 16px", borderBottom: "1px solid #f1f5f9" }}>
                            <input
                                type="text"
                                value={treeSearch}
                                onChange={(e) => setTreeSearch(e.target.value)}
                                placeholder="Filter sections..."
                                style={{
                                    width: "100%",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #d1d5db",
                                    fontSize: "12px",
                                    outline: "none",
                                    boxSizing: "border-box"
                                }}
                                autoFocus
                            />
                        </div>
                    )}

                    {/* "All Categories" Reset Button */}
                    <div style={{ padding: "10px 14px 4px 14px" }}>
                        <div
                            onClick={() => setSelectedTreeId(null)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "8px 10px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: 600,
                                background: selectedTreeId === null ? "#eff6ff" : "transparent",
                                color: selectedTreeId === null ? "#2563eb" : "#4b5563",
                                transition: "background 0.15s ease"
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Folder size={15} color={selectedTreeId === null ? "#2563eb" : "#64748b"} />
                                <span>All Categories</span>
                            </div>
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    background: selectedTreeId === null ? "#dbeafe" : "#f3f4f6",
                                    color: selectedTreeId === null ? "#2563eb" : "#6b7280",
                                    padding: "2px 7px",
                                    borderRadius: "10px"
                                }}
                            >
                                {categories.length}
                            </span>
                        </div>
                    </div>

                    {/* Tree List */}
                    <div style={{ padding: "4px 14px 16px 14px", maxHeight: "680px", overflowY: "auto" }}>
                        {loading ? (
                            <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                                Loading structure...
                            </div>
                        ) : rootCategories.length === 0 ? (
                            <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                                No categories found
                            </div>
                        ) : (
                            rootCategories
                                .filter((root) => !treeSearch || root.name.toLowerCase().includes(treeSearch.toLowerCase()))
                                .map((root) => {
                                    const isExpanded = expandedIds.has(root.id);
                                    const isSelected = selectedTreeId === root.id;
                                    const children = childrenMap.get(root.id) || [];
                                    const rootItemCount = (root.itemCount ?? root.items ?? 0) + children.reduce((s, c) => s + (c.itemCount ?? c.items ?? 0), 0);

                                    return (
                                        <div key={root.id} style={{ marginBottom: "2px" }}>
                                            {/* Root Category Row */}
                                            <div
                                                onClick={() => setSelectedTreeId(root.id)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    padding: "8px 8px",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                    background: isSelected ? "#eff6ff" : "transparent",
                                                    color: isSelected ? "#2563eb" : "#1f2937",
                                                    transition: "background 0.15s ease"
                                                }}
                                                className="group hover:bg-slate-50"
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                                                    <span
                                                        onClick={(e) => toggleExpand(root.id, e)}
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            width: "18px",
                                                            height: "18px",
                                                            color: isSelected ? "#2563eb" : "#6b7280"
                                                        }}
                                                    >
                                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </span>
                                                    <Folder
                                                        size={15}
                                                        color={isSelected ? "#2563eb" : "#64748b"}
                                                        style={{ flexShrink: 0 }}
                                                    />
                                                    <span
                                                        style={{
                                                            fontSize: "13px",
                                                            fontWeight: isSelected ? 600 : 500,
                                                            whiteSpace: "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis"
                                                        }}
                                                    >
                                                        {root.name}
                                                    </span>
                                                </div>

                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                                    {isExpanded && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => openCreateWithParent(root.id, e)}
                                                            title={`Add subcategory to ${root.name}`}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                padding: "2px",
                                                                cursor: "pointer",
                                                                color: "#6b7280",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                borderRadius: "4px"
                                                            }}
                                                        >
                                                            <Plus size={13} />
                                                        </button>
                                                    )}
                                                    <span
                                                        style={{
                                                            fontSize: "11px",
                                                            fontWeight: 600,
                                                            background: isSelected ? "#dbeafe" : "#f3f4f6",
                                                            color: isSelected ? "#2563eb" : "#6b7280",
                                                            padding: "2px 7px",
                                                            borderRadius: "10px",
                                                            minWidth: "16px",
                                                            textAlign: "center"
                                                        }}
                                                    >
                                                        {rootItemCount}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Subcategories (Expanded) */}
                                            {isExpanded && children.length > 0 && (
                                                <div style={{ paddingLeft: "24px", marginTop: "2px" }}>
                                                    {children.map((child) => {
                                                        const isChildSelected = selectedTreeId === child.id;
                                                        const childCount = child.itemCount ?? child.items ?? 0;

                                                        return (
                                                            <div
                                                                key={child.id}
                                                                onClick={() => setSelectedTreeId(child.id)}
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    padding: "6px 8px",
                                                                    borderRadius: "6px",
                                                                    cursor: "pointer",
                                                                    background: isChildSelected ? "#eff6ff" : "transparent",
                                                                    color: isChildSelected ? "#2563eb" : "#4b5563",
                                                                    transition: "background 0.15s ease",
                                                                    marginBottom: "2px"
                                                                }}
                                                                className="hover:bg-slate-50"
                                                            >
                                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                                                                    <GripVertical
                                                                        size={13}
                                                                        color={isChildSelected ? "#3b82f6" : "#9ca3af"}
                                                                        style={{ flexShrink: 0 }}
                                                                    />
                                                                    <Folder
                                                                        size={14}
                                                                        color={isChildSelected ? "#2563eb" : "#64748b"}
                                                                        style={{ flexShrink: 0 }}
                                                                    />
                                                                    <span
                                                                        style={{
                                                                            fontSize: "12px",
                                                                            fontWeight: isChildSelected ? 600 : 400,
                                                                            whiteSpace: "nowrap",
                                                                            overflow: "hidden",
                                                                            textOverflow: "ellipsis"
                                                                        }}
                                                                    >
                                                                        {child.name}
                                                                    </span>
                                                                </div>

                                                                <span
                                                                    style={{
                                                                        fontSize: "11px",
                                                                        fontWeight: 600,
                                                                        background: isChildSelected ? "#dbeafe" : "#f3f4f6",
                                                                        color: isChildSelected ? "#2563eb" : "#6b7280",
                                                                        padding: "1px 6px",
                                                                        borderRadius: "8px",
                                                                        flexShrink: 0
                                                                    }}
                                                                >
                                                                    {childCount}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>

                {/* ── Right Main Panel: Categories Data Table ── */}
                <div
                    style={{
                        background: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column"
                    }}
                >
                    {/* Table Container with Horizontal Scrolling */}
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                textAlign: "left",
                                fontSize: "13px",
                                minWidth: "980px"
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background: "#f8fafc",
                                        color: "#64748b",
                                        borderBottom: "1px solid #e2e8f0"
                                    }}
                                >
                                    <th style={{ padding: "14px 16px", width: "36px" }}>
                                        <input
                                            type="checkbox"
                                            checked={
                                                paginatedCategories.length > 0 &&
                                                paginatedCategories.every((c) => selectedRowIds.has(c.id))
                                            }
                                            onChange={handleSelectAll}
                                            style={{ cursor: "pointer", borderRadius: "4px" }}
                                        />
                                    </th>
                                    <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                            <Folder size={14} color="#64748b" />
                                            <span>CATEGORY</span>
                                        </div>
                                    </th>
                                    <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>
                                        CODE
                                    </th>
                                    <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>
                                        PARENT CATEGORY
                                    </th>
                                    <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em", textAlign: "center" }}>
                                        SUB-CATEGORIES
                                    </th>
                                    <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em", textAlign: "center" }}>
                                        ITEMS
                                    </th>
                                    <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>
                                        DEFAULT MARKUP
                                    </th>
                                    <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>
                                        TAX
                                    </th>
                                    <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>
                                        STATUS
                                    </th>
                                    <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>
                                        UPDATED
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                                            Loading categories...
                                        </td>
                                    </tr>
                                ) : paginatedCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                                            No categories match your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCategories.map((cat) => {
                                        const isChecked = selectedRowIds.has(cat.id);
                                        const parentName = cat.parentName || (cat.parent_id ? categories.find((c) => c.id === cat.parent_id)?.name : null);
                                        const subCatCount = cat.subCategoryCount ?? cat.subCategories ?? 0;
                                        const itemCount = cat.itemCount ?? cat.items ?? 0;
                                        const markup = cat.default_markup_percent !== null && cat.default_markup_percent !== undefined ? `${cat.default_markup_percent}%` : "20%";
                                        const tax = cat.default_tax_percent !== null && cat.default_tax_percent !== undefined ? `GST ${cat.default_tax_percent}%` : "GST 18%";

                                        return (
                                            <tr
                                                key={cat.id}
                                                style={{
                                                    borderBottom: "1px solid #f1f5f9",
                                                    backgroundColor: isChecked ? "#f8fafc" : "transparent",
                                                    transition: "background 0.15s ease"
                                                }}
                                                className="hover:bg-slate-50"
                                            >
                                                {/* Checkbox */}
                                                <td style={{ padding: "14px 16px" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => handleSelectRow(cat.id)}
                                                        style={{ cursor: "pointer", borderRadius: "4px" }}
                                                    />
                                                </td>

                                                {/* Category Name with Folder Icon */}
                                                <td style={{ padding: "14px 16px" }}>
                                                    <div
                                                        onClick={() => {
                                                            setActiveDetailCategory(cat);
                                                            onDetailViewChange?.(true);
                                                        }}
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "10px",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        <Folder size={17} color="#475569" style={{ flexShrink: 0 }} />
                                                        <span
                                                            style={{
                                                                fontWeight: 600,
                                                                color: "#1e293b",
                                                                fontSize: "14px"
                                                            }}
                                                        >
                                                            {cat.name}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Code */}
                                                <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>
                                                    {cat.code || "-"}
                                                </td>

                                                {/* Parent Category */}
                                                <td style={{ padding: "14px 16px", color: parentName ? "#475569" : "#9ca3af", fontSize: "13px" }}>
                                                    {parentName || "-"}
                                                </td>

                                                {/* Sub-Categories Count */}
                                                <td style={{ padding: "14px 16px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                                                    {subCatCount > 0 ? subCatCount : "-"}
                                                </td>

                                                {/* Items Count */}
                                                <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 600, color: "#1e293b", fontSize: "13px" }}>
                                                    {itemCount}
                                                </td>

                                                {/* Default Markup */}
                                                <td style={{ padding: "14px 16px", color: "#475569", fontSize: "13px" }}>
                                                    {markup}
                                                </td>

                                                {/* Tax */}
                                                <td style={{ padding: "14px 16px", color: "#475569", fontSize: "13px" }}>
                                                    {tax}
                                                </td>

                                                {/* Status Badge */}
                                                <td style={{ padding: "14px 16px" }}>
                                                    <span
                                                        style={{
                                                            background: "#ecfdf5",
                                                            color: "#10b981",
                                                            padding: "3px 8px",
                                                            borderRadius: "12px",
                                                            fontSize: "11px",
                                                            fontWeight: 600,
                                                            letterSpacing: "0.04em",
                                                            textTransform: "uppercase"
                                                        }}
                                                    >
                                                        {cat.status || "ACTIVE"}
                                                    </span>
                                                </td>

                                                {/* Updated */}
                                                <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>
                                                    {formatDate(cat.updated_at)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer: Total Count + Pagination Controls */}
                    <div
                        style={{
                            padding: "16px 20px",
                            borderTop: "1px solid #e2e8f0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#ffffff"
                        }}
                    >
                        {/* Total Count */}
                        <div style={{ fontSize: "13px", color: "#475569", fontWeight: 500 }}>
                            Total Categories: {filteredCategories.length}
                        </div>

                        {/* Page Numbers */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "6px",
                                    border: "1px solid #e2e8f0",
                                    background: "#fff",
                                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                    color: currentPage === 1 ? "#cbd5e1" : "#475569"
                                }}
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "6px",
                                        border: currentPage === page ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                                        background: currentPage === page ? "#eff6ff" : "#ffffff",
                                        color: currentPage === page ? "#2563eb" : "#475569",
                                        fontWeight: currentPage === page ? 600 : 500,
                                        fontSize: "13px",
                                        cursor: "pointer"
                                    }}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "6px",
                                    border: "1px solid #e2e8f0",
                                    background: "#fff",
                                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                    color: currentPage === totalPages ? "#cbd5e1" : "#475569"
                                }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {/* Page Size Selector */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#475569" }}>
                            <span>Show per Page:</span>
                            <div style={{ position: "relative" }}>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        padding: "6px 28px 6px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #e2e8f0",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        color: "#1e293b",
                                        background: "#fff",
                                        appearance: "none",
                                        cursor: "pointer"
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <ChevronDown
                                    size={14}
                                    color="#64748b"
                                    style={{
                                        position: "absolute",
                                        right: "8px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        pointerEvents: "none"
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Category Modal Dialog */}
            <NewCategoryModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setModalParentId(null);
                }}
                onSuccess={() => {
                    void loadData();
                }}
                categories={categories}
                initialParentId={modalParentId}
            />
        </div>
    );
}
