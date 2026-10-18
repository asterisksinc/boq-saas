"use client";

import { useState, useEffect, useMemo } from "react";
import {
    ChevronRight,
    ChevronDown,
    Folder,
    GripVertical,
    Search,
    Plus,
    RefreshCw
} from "lucide-react";
import { getCostingCategories, deleteCostingCategory, duplicateCostingCategory } from "@/lib/api/costing";
import type { CostingCategoryBackend } from "@/lib/types";
import NewCategoryModal from "./NewCategoryModal";
import CategoryDetail from "./CategoryDetail";
import CostingMoreMenu from "@/components/costing/CostingMoreMenu";
import CostingPagination from "@/components/costing/CostingPagination";

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
    const [categoryToEdit, setCategoryToEdit] = useState<CostingCategoryBackend | null>(null);

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
            setExpandedIds(new Set(rootIds.slice(0, 4)));
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

    // Filter tree root nodes by treeSearch
    const filteredRoots = useMemo(() => {
        if (!treeSearch.trim()) return rootCategories;
        const q = treeSearch.trim().toLowerCase();
        return rootCategories.filter((root) => {
            if (root.name.toLowerCase().includes(q)) return true;
            if (root.code && root.code.toLowerCase().includes(q)) return true;
            const children = childrenMap.get(root.id) || [];
            return children.some((c) => c.name.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q)));
        });
    }, [rootCategories, childrenMap, treeSearch]);

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
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "-";
            return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        } catch {
            return "-";
        }
    };

    const openCreateWithParent = (parentId: string | null, e: React.MouseEvent) => {
        e.stopPropagation();
        setCategoryToEdit(null);
        setModalParentId(parentId);
        setShowModal(true);
    };

    const handleEditCategory = (cat: CostingCategoryBackend) => {
        setCategoryToEdit(cat);
        setModalParentId(cat.parent_id || null);
        setShowModal(true);
    };

    useEffect(() => {
        onDetailViewChange?.(Boolean(activeDetailCategory));
    }, [activeDetailCategory, onDetailViewChange]);

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
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            {error && (
                <div
                    style={{
                        padding: "16px",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid #fecaca"
                    }}
                >
                    <span>{error}</span>
                    <button
                        type="button"
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

            {/* Two-Panel Workspace: Left Category Structure Tree + Right Categories Table (Frame 2147225084) */}
            <div className="costing-categories-workspace">
                {/* ── Left Panel: Category Structure Card (Frame 2147225071) ── */}
                <div className="costing-categories-tree-card">
                    {/* Header: Title + Dynamic Counts + Search Button (Frame 2147225199) */}
                    <div className="costing-categories-tree-header">
                        <div className="costing-categories-tree-title-group">
                            <h3 className="costing-categories-tree-title">CATEGORY STRUCTURE</h3>
                            <span className="costing-categories-tree-subtitle">
                                {totalSections} Sections • {totalItems} Items
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowTreeSearchInput(!showTreeSearchInput)}
                            className="costing-categories-tree-search-btn"
                            title="Filter Category Structure"
                            aria-label="Filter category structure"
                        >
                            <div className="costing-categories-tree-search-inner">
                                <Search size={16} color="#475569" />
                            </div>
                        </button>
                    </div>

                    {/* Expandable Tree Search Input */}
                    {showTreeSearchInput && (
                        <div className="costing-categories-tree-search-input-box">
                            <input
                                type="text"
                                value={treeSearch}
                                onChange={(e) => setTreeSearch(e.target.value)}
                                placeholder="Search sections..."
                                className="costing-categories-tree-search-input"
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Divider (Rectangle 72) */}
                    <hr className="costing-categories-tree-divider" />

                    {/* "All Categories" Reset Row */}
                    <div
                        onClick={() => setSelectedTreeId(null)}
                        className={`costing-categories-tree-row ${selectedTreeId === null ? "is-active" : ""}`}
                        style={{ width: "100%", boxSizing: "border-box" }}
                        role="button"
                        tabIndex={0}
                        aria-label="View all categories"
                    >
                        <div className="costing-categories-tree-row-left">
                            <Folder size={18} color={selectedTreeId === null ? "#2563EB" : "#475569"} />
                            <span className="costing-categories-tree-label">All Categories</span>
                        </div>
                        <span className="costing-categories-tree-badge">{categories.length}</span>
                    </div>

                    {/* Tree List (Frame 2147225181) */}
                    <div className="costing-categories-tree-list">
                        {loading ? (
                            <div style={{ padding: "20px", textAlign: "center", color: "#64748B", fontSize: "14px" }}>
                                Loading structure...
                            </div>
                        ) : filteredRoots.length === 0 ? (
                            <div style={{ padding: "20px", textAlign: "center", color: "#64748B", fontSize: "14px" }}>
                                No categories found
                            </div>
                        ) : (
                            filteredRoots.map((root) => {
                                const isExpanded = expandedIds.has(root.id);
                                const isSelected = selectedTreeId === root.id;
                                const children = childrenMap.get(root.id) || [];
                                const rootItemCount = (root.itemCount ?? root.items ?? 0) + children.reduce((s, c) => s + (c.itemCount ?? c.items ?? 0), 0);

                                return (
                                    <div key={root.id} className="costing-categories-tree-node">
                                        {/* Root Category Row (Frame 2147225184) */}
                                        <div
                                            onClick={() => setSelectedTreeId(root.id)}
                                            className={`costing-categories-tree-row ${isSelected ? "is-active" : ""}`}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className="costing-categories-tree-row-left">
                                                <button
                                                    type="button"
                                                    onClick={(e) => toggleExpand(root.id, e)}
                                                    className="costing-categories-tree-arrow-btn"
                                                    aria-label={isExpanded ? "Collapse" : "Expand"}
                                                >
                                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                </button>
                                                <Folder size={18} color={isSelected ? "#2563EB" : "#1C1B1F"} />
                                                <span className="costing-categories-tree-label" title={root.name}>
                                                    {root.name}
                                                </span>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => openCreateWithParent(root.id, e)}
                                                    title={`Add subcategory to ${root.name}`}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        padding: "2px",
                                                        cursor: "pointer",
                                                        color: isSelected ? "#2563EB" : "#64748B",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        borderRadius: "4px"
                                                    }}
                                                    aria-label={`Add subcategory to ${root.name}`}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                                <span className="costing-categories-tree-badge">{rootItemCount}</span>
                                            </div>
                                        </div>

                                        {/* Subcategories (Frame 2147225180, Frame 2147225171) */}
                                        {isExpanded && children.length > 0 && (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                {children.map((child) => {
                                                    const isChildSelected = selectedTreeId === child.id;
                                                    const childCount = child.itemCount ?? child.items ?? 0;

                                                    return (
                                                        <div
                                                            key={child.id}
                                                            onClick={() => setSelectedTreeId(child.id)}
                                                            className={`costing-categories-tree-subrow ${isChildSelected ? "is-active" : ""}`}
                                                            role="button"
                                                            tabIndex={0}
                                                        >
                                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                                                                <GripVertical size={14} color="#94A3B8" style={{ flexShrink: 0 }} />
                                                                <Folder size={16} color={isChildSelected ? "#2563EB" : "#475569"} style={{ flexShrink: 0 }} />
                                                                <span className="costing-categories-tree-label" title={child.name}>
                                                                    {child.name}
                                                                </span>
                                                            </div>
                                                            <span className="costing-categories-tree-badge">{childCount}</span>
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

                {/* ── Right Panel: Categories Table Card (Frame 2147225072) ── */}
                <div className="costing-categories-table-card">
                    {/* Responsive Horizontal Scroll Container */}
                    <div className="costing-categories-table-scroll">
                        <table className="costing-categories-table">
                            <thead>
                                <tr className="costing-categories-th-row">
                                    <th className="costing-categories-th th-cb">
                                        <input
                                            type="checkbox"
                                            checked={
                                                paginatedCategories.length > 0 &&
                                                paginatedCategories.every((c) => selectedRowIds.has(c.id))
                                            }
                                            onChange={handleSelectAll}
                                            style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#2563EB" }}
                                            aria-label="Select all categories"
                                        />
                                    </th>
                                    <th className="costing-categories-th" style={{ width: "113px" }}>
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                            <Folder size={16} color="#64748B" />
                                            <span>CATEGORY</span>
                                        </div>
                                    </th>
                                    <th className="costing-categories-th" style={{ width: "86px" }}>CODE</th>
                                    <th className="costing-categories-th" style={{ width: "150px" }}>PARENT CATEGORY</th>
                                    <th className="costing-categories-th" style={{ width: "141px" }}>SUB-CATEGORIES</th>
                                    <th className="costing-categories-th" style={{ width: "88px" }}>ITEMS</th>
                                    <th className="costing-categories-th" style={{ width: "140px" }}>DEFAULT MARKUP</th>
                                    <th className="costing-categories-th" style={{ width: "94px" }}>TAX</th>
                                    <th className="costing-categories-th" style={{ width: "90px" }}>STATUS</th>
                                    <th className="costing-categories-th" style={{ width: "150px" }}>UPDATED</th>
                                    <th className="costing-categories-th th-actions">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                                            Loading categories...
                                        </td>
                                    </tr>
                                ) : paginatedCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
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
                                        const isInactive = cat.status === "INACTIVE";

                                        return (
                                            <tr
                                                key={cat.id}
                                                className={`costing-categories-tr ${isChecked ? "is-selected" : ""}`}
                                            >
                                                {/* Checkbox */}
                                                <td className="costing-categories-td td-cb">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => handleSelectRow(cat.id)}
                                                        style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#2563EB" }}
                                                        aria-label={`Select category ${cat.name}`}
                                                    />
                                                </td>

                                                {/* Category Name with Folder Icon */}
                                                <td className="costing-categories-td td-name">
                                                    <div
                                                        onClick={() => {
                                                            setActiveDetailCategory(cat);
                                                            onDetailViewChange?.(true);
                                                        }}
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            cursor: "pointer"
                                                        }}
                                                        title="Click to view category details"
                                                        role="button"
                                                        tabIndex={0}
                                                    >
                                                        <Folder size={18} color="#0F172A" style={{ flexShrink: 0 }} />
                                                        <span style={{ fontWeight: 500, color: "#0F172A" }}>{cat.name}</span>
                                                    </div>
                                                </td>

                                                {/* Code */}
                                                <td className="costing-categories-td">{cat.code || "-"}</td>

                                                {/* Parent Category */}
                                                <td className="costing-categories-td">{parentName || "-"}</td>

                                                {/* Sub-Categories Count */}
                                                <td className="costing-categories-td">{subCatCount > 0 ? subCatCount : "-"}</td>

                                                {/* Items Count */}
                                                <td className="costing-categories-td td-items">{itemCount}</td>

                                                {/* Default Markup */}
                                                <td className="costing-categories-td">{markup}</td>

                                                {/* Tax */}
                                                <td className="costing-categories-td">{tax}</td>

                                                {/* Status Pill Badge */}
                                                <td className="costing-categories-td">
                                                    <span className={`costing-status-pill ${isInactive ? "inactive" : ""}`}>
                                                        {cat.status || "ACTIVE"}
                                                    </span>
                                                </td>

                                                {/* Updated */}
                                                <td className="costing-categories-td">{formatDate(cat.updated_at)}</td>

                                                {/* Action Menu */}
                                                <td className="costing-categories-td" style={{ textAlign: "center" }}>
                                                    <CostingMoreMenu
                                                        entityName="Category"
                                                        onView={() => {
                                                            setActiveDetailCategory(cat);
                                                            onDetailViewChange?.(true);
                                                        }}
                                                        onEdit={() => handleEditCategory(cat)}
                                                        onDuplicate={async () => {
                                                            try {
                                                                await duplicateCostingCategory(cat.id);
                                                                await loadData();
                                                            } catch (err) {
                                                                alert(err instanceof Error ? err.message : "Failed to duplicate category");
                                                            }
                                                        }}
                                                        onDelete={async () => {
                                                            if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
                                                            try {
                                                                await deleteCostingCategory(cat.id);
                                                                setCategories((prev) => prev.filter((c) => c.id !== cat.id));
                                                            } catch (err) {
                                                                alert(err instanceof Error ? err.message : "Failed to delete category");
                                                            }
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer: CostingPagination (Frame 2147225166) */}
                    <CostingPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredCategories.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setCurrentPage(1);
                        }}
                        label="Categories"
                    />
                </div>
            </div>

            {/* New / Edit Category Modal Dialog */}
            <NewCategoryModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setModalParentId(null);
                    setCategoryToEdit(null);
                }}
                onSuccess={() => {
                    void loadData();
                }}
                categories={categories}
                initialParentId={modalParentId}
                categoryToEdit={categoryToEdit}
            />
        </div>
    );
}
