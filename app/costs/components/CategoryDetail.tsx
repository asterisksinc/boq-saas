"use client";

import { ArrowLeft, ChevronDown, ChevronLeft, Filter, MoreHorizontal, Plus, Search, Folder, RefreshCw, Layers, ExternalLink, Calendar, User, Tag, Copy, Trash2, Edit, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
    getCostingCategoryDetail,
    deleteCostingCategory,
    duplicateCostingCategory,
    deleteCostingItem,
    duplicateCostingItem
} from "@/lib/api/costing";
import type { CostingCategoryBackend, CostingCategoryDetail as CostingCategoryDetailType, CostingItemBackend } from "@/lib/types";
import NewCategoryModal from "./NewCategoryModal";
import NewSubCategoryModal from "./NewSubCategoryModal";
import SubCategoryDetail from "./SubCategoryDetail";
import AddItemModal from "./AddItemModal";
import RateStatusDropdown from "@/components/costing/RateStatusDropdown";
import CostingMoreMenu from "@/components/costing/CostingMoreMenu";
import CostingFilterPopover from "@/components/costing/CostingFilterPopover";
import CostingPagination from "@/components/costing/CostingPagination";
import CostingExcelImportModal from "@/components/costing/CostingExcelImportModal";

type SubTab = "Overview" | "Sub Categories" | "Items" | "Pricing Defaults" | "Activity";

interface CategoryDetailProps {
    category: CostingCategoryBackend;
    onBack: () => void;
    allCategories?: CostingCategoryBackend[];
    initialTab?: SubTab;
}

export default function CategoryDetail({ category, onBack, allCategories = [], initialTab = "Overview" }: CategoryDetailProps) {
    const [activeTab, setActiveTab] = useState<SubTab>(initialTab);
    const [detail, setDetail] = useState<CostingCategoryDetailType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Active Sub-Category drilldown state
    const [activeSubCategory, setActiveSubCategory] = useState<CostingCategoryBackend | null>(null);

    // Modals
    const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
    const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);

    // Sub-category search/filter & pagination
    const [subCatSearch, setSubCatSearch] = useState("");
    const [subCatStatus, setSubCatStatus] = useState("all");
    const [subCatPage, setSubCatPage] = useState(1);
    const [subCatPageSize, setSubCatPageSize] = useState(10);

    // Item search/filter & pagination
    const [itemSearch, setItemSearch] = useState("");
    const [itemStatus, setItemStatus] = useState("all");
    const [itemPage, setItemPage] = useState(1);
    const [itemPageSize, setItemPageSize] = useState(10);

    // Load full dynamic detail from API
    const loadDetail = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getCostingCategoryDetail(category.id);
            setDetail(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load category details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadDetail();
    }, [category.id]);

    const activeCat = detail || category;
    const subCategoriesList = detail?.subCategories || [];
    const itemsList: CostingItemBackend[] = detail?.items || detail?.itemsList || [];

    // Dynamic metrics
    const itemsCount = detail?.itemCount ?? detail?.items?.length ?? category.itemCount ?? category.items ?? 0;
    const subCategoriesCount = detail?.subCategoriesCount ?? subCategoriesList.length ?? category.subCategoryCount ?? category.subCategories ?? 0;
    const usedInBoqsCount = detail?.usedInBoqs ?? 0;
    const usedInProjectsCount = detail?.usedInProjects ?? 0;

    const tabs: SubTab[] = ["Overview", "Sub Categories", "Items", "Pricing Defaults", "Activity"];

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

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "-";
            const datePart = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
            return `${datePart}, ${timePart}`;
        } catch {
            return "-";
        }
    };

    const formatMoney = (val: number | null | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    // Filter subcategories by search and status
    const filteredSubCategories = useMemo(() => {
        return subCategoriesList.filter((s) => {
            const matchesSearch =
                !subCatSearch ||
                s.name.toLowerCase().includes(subCatSearch.toLowerCase()) ||
                (s.code && s.code.toLowerCase().includes(subCatSearch.toLowerCase()));
            const matchesStatus =
                subCatStatus === "all" || (s.status || "ACTIVE").toLowerCase() === subCatStatus.toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [subCategoriesList, subCatSearch, subCatStatus]);

    const paginatedSubCategories = useMemo(() => {
        const start = (subCatPage - 1) * subCatPageSize;
        return filteredSubCategories.slice(start, start + subCatPageSize);
    }, [filteredSubCategories, subCatPage, subCatPageSize]);

    // Filter items by search and status
    const filteredItems = useMemo(() => {
        return itemsList.filter((it) => {
            const matchesSearch =
                !itemSearch ||
                it.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
                (it.code && it.code.toLowerCase().includes(itemSearch.toLowerCase()));
            const matchesStatus =
                itemStatus === "all" || (it.rate_status || "active").toLowerCase() === itemStatus.toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [itemsList, itemSearch, itemStatus]);

    const paginatedItems = useMemo(() => {
        const start = (itemPage - 1) * itemPageSize;
        return filteredItems.slice(start, start + itemPageSize);
    }, [filteredItems, itemPage, itemPageSize]);

    // Activity state & pagination
    const [activityPage, setActivityPage] = useState(1);
    const [activityPageSize, setActivityPageSize] = useState(10);

    const dynamicActivities = useMemo(() => {
        if (detail?.activityLog && detail.activityLog.length > 0) {
            return detail.activityLog;
        }
        const list: Array<{ id: string; action: string; details: string; by: string; date: string }> = [];
        const author = (activeCat as any).updated_by_name || (activeCat as any).created_by_name || "Admin";
        if (activeCat.default_markup_percent !== null && activeCat.default_markup_percent !== undefined) {
            list.push({
                id: `act-markup-${activeCat.id}`,
                action: "Markup Updated",
                details: `Default Markup Changed to ${activeCat.default_markup_percent}%`,
                by: author,
                date: activeCat.updated_at || activeCat.created_at
            });
        }
        for (const sub of subCategoriesList) {
            list.push({
                id: `act-sub-${sub.id}`,
                action: "Sub Category Added",
                details: `Sub category ${sub.name} Added`,
                by: author,
                date: sub.created_at || sub.updated_at || activeCat.updated_at
            });
        }
        for (const itm of itemsList) {
            list.push({
                id: `act-item-${itm.id}`,
                action: "Item Added",
                details: `${itm.name} Added`,
                by: author,
                date: itm.created_at || itm.updated_at || activeCat.updated_at
            });
        }
        list.push({
            id: `act-pricing-${activeCat.id}`,
            action: "Pricing Defaults Updated",
            details: `Default changed to GST ${activeCat.default_tax_percent || 18}%`,
            by: author,
            date: activeCat.created_at
        });
        list.push({
            id: `act-created-${activeCat.id}`,
            action: "Category Created",
            details: `Category "${activeCat.name}" was registered`,
            by: author,
            date: activeCat.created_at
        });
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [detail?.activityLog, activeCat, subCategoriesList, itemsList]);

    const paginatedActivities = useMemo(() => {
        const start = (activityPage - 1) * activityPageSize;
        return dynamicActivities.slice(start, start + activityPageSize);
    }, [dynamicActivities, activityPage, activityPageSize]);

    // Handlers for deleting/duplicating
    const handleDeleteSubCategory = async (subId: string) => {
        if (!confirm("Are you sure you want to delete this sub-category?")) return;
        try {
            await deleteCostingCategory(subId);
            await loadDetail();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete sub-category");
        }
    };

    const handleDuplicateSubCategory = async (subId: string) => {
        try {
            await duplicateCostingCategory(subId);
            await loadDetail();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to duplicate sub-category");
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            await deleteCostingItem(itemId);
            await loadDetail();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete item");
        }
    };

    const handleDuplicateItem = async (itemId: string) => {
        try {
            await duplicateCostingItem(itemId);
            await loadDetail();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to duplicate item");
        }
    };

    const handleDuplicateCategory = async () => {
        try {
            await duplicateCostingCategory(activeCat.id);
            alert("Category duplicated successfully");
            onBack();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to duplicate category");
        }
    };

    // If viewing a Sub-Category detail
    if (activeSubCategory) {
        return (
            <SubCategoryDetail
                subCategory={activeSubCategory}
                parentCategory={activeCat}
                onBack={() => setActiveSubCategory(null)}
                onDeleteSuccess={() => {
                    setActiveSubCategory(null);
                    void loadDetail();
                }}
            />
        );
    }

    return (
        <div className="costing-category-detail-shell">
            {/* Top Back Navigation Link (Frame 2147225070) */}
            <button
                type="button"
                className="costing-back-link"
                onClick={onBack}
            >
                <ChevronLeft size={18} />
                <span>Back to Categories</span>
            </button>

            {/* Category Detail Header Row (Frame 2147225066) */}
            <div className="costing-detail-header-row">
                <div className="costing-detail-title-group">
                    <div className="costing-detail-name-row">
                        <Folder size={24} color="#0F172A" />
                        <h2 className="costing-detail-title">{activeCat.name}</h2>
                        <span className={`costing-status-pill ${activeCat.status?.toUpperCase() === "INACTIVE" ? "inactive" : ""}`}>
                            {activeCat.status || "ACTIVE"}
                        </span>
                        {activeCat.code && (
                            <span className="costing-categories-tree-badge">
                                {activeCat.code}
                            </span>
                        )}
                    </div>
                    <p className="costing-detail-description">
                        {activeCat.description || "Category for organizing items, rates, and margins."}
                    </p>
                </div>

                <div className="costing-detail-actions">
                    <button
                        type="button"
                        className="costing-detail-action-btn"
                        onClick={handleDuplicateCategory}
                    >
                        <Copy size={16} />
                        <span>Duplicate</span>
                    </button>
                    <button
                        type="button"
                        className="costing-detail-action-btn"
                        onClick={() => setIsEditCategoryOpen(true)}
                    >
                        <Edit size={16} />
                        <span>Edit Category</span>
                    </button>
                </div>
            </div>

            {error && (
                <div
                    style={{
                        padding: "14px 16px",
                        background: "#FEF2F2",
                        color: "#B91C1C",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid #FECACA",
                        fontFamily: "Urbanist"
                    }}
                >
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={loadDetail}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#B91C1C",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontWeight: 600,
                            fontFamily: "Urbanist"
                        }}
                    >
                        <RefreshCw size={15} /> Retry
                    </button>
                </div>
            )}

            {/* Dynamic Summary Cards (Frame 2147225138) */}
            <div className="costing-detail-metrics-grid">
                {/* 1. Items */}
                <div className="costing-metric-card">
                    <span className="costing-metric-label">Items</span>
                    <span className="costing-metric-value">{itemsCount}</span>
                    <button
                        type="button"
                        className="costing-metric-link"
                        onClick={() => setActiveTab("Items")}
                    >
                        View Items →
                    </button>
                </div>

                {/* 2. Sub-Categories */}
                <div className="costing-metric-card">
                    <span className="costing-metric-label">Sub-Categories</span>
                    <span className="costing-metric-value">{subCategoriesCount}</span>
                    <button
                        type="button"
                        className="costing-metric-link"
                        onClick={() => setActiveTab("Sub Categories")}
                    >
                        View Sub-Categories →
                    </button>
                </div>

                {/* 3. Used in BOQs */}
                <div className="costing-metric-card">
                    <span className="costing-metric-label">Used in BOQs</span>
                    <span className="costing-metric-value">{usedInBoqsCount}</span>
                    <a
                        href="/boqs"
                        className="costing-metric-link"
                    >
                        View BOQs →
                    </a>
                </div>

                {/* 4. Used in Projects */}
                <div className="costing-metric-card">
                    <span className="costing-metric-label">Used in Projects</span>
                    <span className="costing-metric-value">{usedInProjectsCount}</span>
                    <a
                        href="/projects"
                        className="costing-metric-link"
                    >
                        View Projects →
                    </a>
                </div>
            </div>

            {/* Sub-Tabs Toolbar Row (Frame 2147225076) */}
            <div className="costing-subtabs-bar">
                <div className="costing-subtabs-list">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            className={`costing-subtab-btn ${activeTab === tab ? "is-active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Sub Categories toolbar: Search, Filter, Import Excel, + Sub-Category */}
                {activeTab === "Sub Categories" && (
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <div className="costing-search-box" style={{ width: "260px" }}>
                            <div className="costing-search-icon-tile">
                                <Search size={16} color="#475569" />
                            </div>
                            <input
                                placeholder="Search sub-category..."
                                value={subCatSearch}
                                onChange={(e) => {
                                    setSubCatSearch(e.target.value);
                                    setSubCatPage(1);
                                }}
                                className="costing-search-input"
                                aria-label="Search sub-categories"
                            />
                            {subCatSearch && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSubCatSearch("");
                                        setSubCatPage(1);
                                    }}
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#94A3B8" }}
                                    aria-label="Clear sub-category search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <CostingFilterPopover
                            currentStatus={subCatStatus}
                            onApply={({ status }) => {
                                setSubCatStatus(status);
                                setSubCatPage(1);
                            }}
                            onReset={() => {
                                setSubCatStatus("all");
                                setSubCatPage(1);
                            }}
                            showLabel={true}
                        />
                        <button
                            type="button"
                            onClick={() => setIsExcelImportOpen(true)}
                            className="costing-import-excel-btn"
                        >
                            Import Excel
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsSubCategoryModalOpen(true)}
                            className="costing-new-item-btn"
                        >
                            <Plus size={18} /> Sub-Category
                        </button>
                    </div>
                )}

                {/* Items toolbar: Search, Filter, Import Excel, + New Item */}
                {activeTab === "Items" && (
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <div className="costing-search-box" style={{ width: "260px" }}>
                            <div className="costing-search-icon-tile">
                                <Search size={16} color="#475569" />
                            </div>
                            <input
                                placeholder="Search items..."
                                value={itemSearch}
                                onChange={(e) => {
                                    setItemSearch(e.target.value);
                                    setItemPage(1);
                                }}
                                className="costing-search-input"
                                aria-label="Search items"
                            />
                            {itemSearch && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setItemSearch("");
                                        setItemPage(1);
                                    }}
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#94A3B8" }}
                                    aria-label="Clear items search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <CostingFilterPopover
                            currentStatus={itemStatus}
                            onApply={({ status }) => {
                                setItemStatus(status);
                                setItemPage(1);
                            }}
                            onReset={() => {
                                setItemStatus("all");
                                setItemPage(1);
                            }}
                            showLabel={true}
                        />
                        <button
                            type="button"
                            onClick={() => setIsExcelImportOpen(true)}
                            className="costing-import-excel-btn"
                        >
                            Import Excel
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsItemModalOpen(true)}
                            className="costing-new-item-btn"
                        >
                            <Plus size={18} /> New Item
                        </button>
                    </div>
                )}
            </div>

            {/* Sub-Tabs Content Area */}
            <div>
                {/* 1. Overview Tab (Figma Frame 2147225128: 3-Column Grid) */}
                {activeTab === "Overview" && (
                    <div className="costing-overview-main-grid">
                        {/* Column 1: Category Information (Frame 2147225071) */}
                        <div className="costing-overview-panel-card">
                            <h3 className="costing-overview-panel-title">CATEGORY INFORMATION</h3>
                            <div className="costing-overview-inner-card">
                                <div className="costing-kv-grid">
                                    <div className="costing-kv-item">
                                        <span className="costing-kv-label">Category Name</span>
                                        <span className="costing-kv-value">{activeCat.name}</span>
                                    </div>
                                    <div className="costing-kv-item">
                                        <span className="costing-kv-label">Category Code</span>
                                        <span className="costing-kv-value">{activeCat.code || "-"}</span>
                                    </div>
                                    <div className="costing-kv-item">
                                        <span className="costing-kv-label">Parent Category</span>
                                        <span className="costing-kv-value">
                                            {activeCat.parentName || (activeCat.parent_id ? allCategories.find((c) => c.id === activeCat.parent_id)?.name : null) || "-"}
                                        </span>
                                    </div>
                                    <div className="costing-kv-item">
                                        <span className="costing-kv-label">Default Unit</span>
                                        <span className="costing-kv-value">{activeCat.default_unit || "Nos"}</span>
                                    </div>
                                    <div className="costing-kv-item">
                                        <span className="costing-kv-label">Created On</span>
                                        <span className="costing-kv-value">{formatDate(activeCat.created_at)}</span>
                                    </div>
                                    <div className="costing-kv-item">
                                        <span className="costing-kv-label">Created By</span>
                                        <span className="costing-kv-value">{(activeCat as any).created_by || "Admin"}</span>
                                    </div>
                                    <div className="costing-kv-item">
                                        <span className="costing-kv-label">Updated On</span>
                                        <span className="costing-kv-value">{formatDate(activeCat.updated_at || activeCat.created_at)}</span>
                                    </div>
                                    <div className="costing-kv-item">
                                        <span className="costing-kv-label">Updated By</span>
                                        <span className="costing-kv-value">{(activeCat as any).updated_by || "Admin"}</span>
                                    </div>
                                    <div className="costing-kv-item" style={{ gridColumn: "1 / -1" }}>
                                        <span className="costing-kv-label">Description</span>
                                        <span className="costing-kv-value" style={{ lineHeight: "1.4" }}>
                                            {activeCat.description || "Category for organizing items, rates, and margins."}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Hierarchy & Pricing Details */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
                            {/* Hierarchy Card */}
                            <div className="costing-overview-panel-card">
                                <h3 className="costing-overview-panel-title">HIERARCHY</h3>
                                <div className="costing-overview-inner-card">
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                                        {activeCat.parentName && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748B", fontSize: "13px", fontFamily: "Urbanist" }}>
                                                <Folder size={16} color="#94A3B8" />
                                                <span>{activeCat.parentName}</span>
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                color: "#2563EB",
                                                fontSize: "14px",
                                                fontWeight: 600,
                                                fontFamily: "Urbanist",
                                                paddingLeft: activeCat.parentName ? "16px" : "0"
                                            }}
                                        >
                                            <Folder size={18} color="#2563EB" />
                                            <span>{activeCat.name}</span>
                                            <span className="costing-categories-tree-badge" style={{ marginLeft: "auto" }}>
                                                {itemsCount} items
                                            </span>
                                        </div>
                                        {subCategoriesList.length > 0 && (
                                            <div
                                                style={{
                                                    paddingLeft: activeCat.parentName ? "32px" : "16px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "8px"
                                                }}
                                            >
                                                {subCategoriesList.slice(0, 4).map((s) => (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => setActiveSubCategory(s)}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            gap: "8px",
                                                            color: "#475569",
                                                            fontSize: "13px",
                                                            fontFamily: "Urbanist",
                                                            cursor: "pointer",
                                                            padding: "4px 8px",
                                                            borderRadius: "4px"
                                                        }}
                                                        className="hover:bg-slate-50 hover:text-blue-600"
                                                    >
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <Layers size={14} color="#94A3B8" />
                                                            <span>{s.name}</span>
                                                        </div>
                                                        <span style={{ fontSize: "12px", color: "#64748B" }}>
                                                            {s.itemsCount ?? s.items ?? 0}
                                                        </span>
                                                    </div>
                                                ))}
                                                {subCategoriesList.length > 4 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab("Sub Categories")}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            padding: "4px 8px",
                                                            color: "#2563EB",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            textAlign: "left",
                                                            cursor: "pointer",
                                                            fontFamily: "Urbanist"
                                                        }}
                                                    >
                                                        + {subCategoriesList.length - 4} more sub-categories →
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Details Card */}
                            <div className="costing-overview-panel-card">
                                <h3 className="costing-overview-panel-title">PRICING DETAILS</h3>
                                <div className="costing-overview-inner-card">
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                                        <div className="costing-pricing-row">
                                            <span className="costing-kv-label" style={{ fontSize: "14px" }}>Default Markup</span>
                                            <span className="costing-kv-value" style={{ fontWeight: 600 }}>
                                                {activeCat.default_markup_percent !== null && activeCat.default_markup_percent !== undefined
                                                    ? `${activeCat.default_markup_percent}%`
                                                    : "20%"}
                                            </span>
                                        </div>
                                        <hr className="costing-activity-divider" />
                                        <div className="costing-pricing-row">
                                            <span className="costing-kv-label" style={{ fontSize: "14px" }}>Default Tax</span>
                                            <span className="costing-kv-value" style={{ fontWeight: 600 }}>
                                                {activeCat.default_tax_percent !== null && activeCat.default_tax_percent !== undefined
                                                    ? `GST ${activeCat.default_tax_percent}%`
                                                    : "GST 18%"}
                                            </span>
                                        </div>
                                        <hr className="costing-activity-divider" />
                                        <div className="costing-pricing-row">
                                            <span className="costing-kv-label" style={{ fontSize: "14px" }}>Default Wastage</span>
                                            <span className="costing-kv-value" style={{ fontWeight: 600 }}>
                                                {activeCat.default_waste_percent !== null && activeCat.default_waste_percent !== undefined
                                                    ? `${activeCat.default_waste_percent}%`
                                                    : "5%"}
                                            </span>
                                        </div>
                                        <hr className="costing-activity-divider" />
                                        <div className="costing-pricing-row">
                                            <span className="costing-kv-label" style={{ fontSize: "14px" }}>Cost Code</span>
                                            <span className="costing-kv-value" style={{ fontWeight: 600 }}>
                                                {activeCat.code || "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Recent Activity (Frame 2147225071) */}
                        <div className="costing-overview-panel-card">
                            <h3 className="costing-overview-panel-title">RECENT ACTIVITY</h3>
                            <div className="costing-overview-inner-card">
                                <div className="costing-activity-list">
                                    {dynamicActivities.slice(0, 5).map((act, idx) => (
                                        <div key={act.id} style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                                            <div className="costing-activity-row">
                                                <div className="costing-activity-left">
                                                    <div className="costing-activity-avatar">
                                                        {(act.by || "AD").slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="costing-activity-info">
                                                        <span className="costing-activity-title">{act.action}</span>
                                                        <span className="costing-activity-details">{act.details}</span>
                                                    </div>
                                                </div>
                                                <span className="costing-activity-time">
                                                    {formatDate(act.date)}
                                                </span>
                                            </div>
                                            {idx < Math.min(dynamicActivities.length, 5) - 1 && (
                                                <hr className="costing-activity-divider" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Sub Categories Tab */}
                {activeTab === "Sub Categories" && (
                    <div className="costing-categories-table-card">
                        <div className="costing-categories-table-scroll">
                            <table className="costing-categories-table">
                                <thead>
                                    <tr className="costing-categories-th-row">
                                        <th className="costing-categories-th" style={{ borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px" }}>SUB-CATEGORY NAME</th>
                                        <th className="costing-categories-th">SUB-CATEGORY CODE</th>
                                        <th className="costing-categories-th" style={{ textAlign: "center" }}>ITEMS</th>
                                        <th className="costing-categories-th" style={{ textAlign: "center" }}>USED IN BOQS</th>
                                        <th className="costing-categories-th" style={{ textAlign: "center" }}>USED IN PROJECTS</th>
                                        <th className="costing-categories-th">STATUS</th>
                                        <th className="costing-categories-th">UPDATED</th>
                                        <th className="costing-categories-th" style={{ width: "48px", borderTopRightRadius: "8px", borderBottomRightRadius: "8px" }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedSubCategories.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#64748B", fontFamily: "Urbanist" }}>
                                                No sub-categories found under {activeCat.name}.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedSubCategories.map((sub) => (
                                            <tr key={sub.id} className="costing-categories-tr">
                                                <td className="costing-categories-td td-name">
                                                    <div
                                                        onClick={() => setActiveSubCategory(sub)}
                                                        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                                                        className="hover:text-blue-600"
                                                    >
                                                        <Folder size={15} color="#475569" />
                                                        <span>{sub.name}</span>
                                                    </div>
                                                </td>
                                                <td className="costing-categories-td">{sub.code || "-"}</td>
                                                <td className="costing-categories-td" style={{ textAlign: "center", fontWeight: 600, color: "#0F172A" }}>
                                                    {sub.itemsCount ?? sub.items ?? 0}
                                                </td>
                                                <td className="costing-categories-td" style={{ textAlign: "center" }}>
                                                    {sub.usedInBoqs ?? 0}
                                                </td>
                                                <td className="costing-categories-td" style={{ textAlign: "center" }}>
                                                    {sub.usedInProjects ?? 0}
                                                </td>
                                                <td className="costing-categories-td">
                                                    <span className={`costing-status-pill ${sub.status?.toUpperCase() === "INACTIVE" ? "inactive" : ""}`}>
                                                        {sub.status || "ACTIVE"}
                                                    </span>
                                                </td>
                                                <td className="costing-categories-td">{formatDate(sub.updated_at || sub.created_at)}</td>
                                                <td className="costing-categories-td">
                                                    <CostingMoreMenu
                                                        entityName="Sub-Category"
                                                        onView={() => setActiveSubCategory(sub)}
                                                        onDuplicate={() => handleDuplicateSubCategory(sub.id)}
                                                        onDelete={() => handleDeleteSubCategory(sub.id)}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {filteredSubCategories.length > 0 && (
                            <CostingPagination
                                currentPage={subCatPage}
                                totalPages={Math.max(1, Math.ceil(filteredSubCategories.length / subCatPageSize))}
                                totalItems={filteredSubCategories.length}
                                pageSize={subCatPageSize}
                                onPageChange={setSubCatPage}
                                onPageSizeChange={(newSize) => {
                                    setSubCatPageSize(newSize);
                                    setSubCatPage(1);
                                }}
                                label="Sub Categories"
                            />
                        )}
                    </div>
                )}

                {/* 3. Items Tab */}
                {activeTab === "Items" && (
                    <div className="costing-categories-table-card">
                        <div className="costing-categories-table-scroll">
                            <table className="costing-categories-table">
                                <thead>
                                    <tr className="costing-categories-th-row">
                                        <th className="costing-categories-th" style={{ borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px" }}>ITEM</th>
                                        <th className="costing-categories-th">CODE</th>
                                        <th className="costing-categories-th">UNIT</th>
                                        <th className="costing-categories-th" style={{ textAlign: "right" }}>BASE COST (₹)</th>
                                        <th className="costing-categories-th" style={{ textAlign: "right" }}>SELLING RATE (₹)</th>
                                        <th className="costing-categories-th" style={{ textAlign: "center" }}>MARGIN</th>
                                        <th className="costing-categories-th">PREFERRED VENDOR</th>
                                        <th className="costing-categories-th">RATE STATUS</th>
                                        <th className="costing-categories-th">UPDATED</th>
                                        <th className="costing-categories-th" style={{ width: "48px", borderTopRightRadius: "8px", borderBottomRightRadius: "8px" }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "#64748B", fontFamily: "Urbanist" }}>
                                                No items under {activeCat.name} yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedItems.map((item) => {
                                            const base = Number(item.base_cost ?? item.baseCost ?? 0);
                                            const sell = Number(item.selling_rate ?? item.sellingRate ?? 0);
                                            const margin = sell > 0 ? Math.round(((sell - base) * 100) / sell) : 0;

                                            return (
                                                <tr key={item.id} className="costing-categories-tr">
                                                    <td className="costing-categories-td td-name">
                                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                            {item.image_url ? (
                                                                <img
                                                                    src={item.image_url}
                                                                    alt=""
                                                                    style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "cover" }}
                                                                />
                                                            ) : (
                                                                <div
                                                                    style={{
                                                                        width: "32px",
                                                                        height: "32px",
                                                                        borderRadius: "6px",
                                                                        background: "#F1F5F9",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        color: "#94A3B8"
                                                                    }}
                                                                >
                                                                    <Tag size={15} />
                                                                </div>
                                                            )}
                                                            <span style={{ fontWeight: 600, color: "#0F172A" }}>{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="costing-categories-td">{item.code || "-"}</td>
                                                    <td className="costing-categories-td">{item.unit || "Nos"}</td>
                                                    <td className="costing-categories-td" style={{ textAlign: "right", fontWeight: 500, color: "#0F172A" }}>
                                                        ₹{formatMoney(base)}
                                                    </td>
                                                    <td className="costing-categories-td" style={{ textAlign: "right", fontWeight: 600, color: "#0F172A" }}>
                                                        ₹{formatMoney(sell)}
                                                    </td>
                                                    <td className="costing-categories-td" style={{ textAlign: "center" }}>
                                                        <span className={`costing-margin-text ${margin < 0 ? "is-negative" : ""}`}>
                                                            {margin}%
                                                        </span>
                                                    </td>
                                                    <td className="costing-categories-td">
                                                        {item.preferred_vendor || item.preferredVendor || "-"}
                                                    </td>
                                                    <td className="costing-categories-td">
                                                        <RateStatusDropdown
                                                            itemId={item.id}
                                                            currentStatus={item.rate_status || "active"}
                                                            onStatusChange={(_newStatus) => {
                                                                void loadDetail();
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="costing-categories-td">{formatDate(item.updated_at || item.created_at)}</td>
                                                    <td className="costing-categories-td">
                                                        <CostingMoreMenu
                                                            entityName="Item"
                                                            onDuplicate={() => handleDuplicateItem(item.id)}
                                                            onDelete={() => handleDeleteItem(item.id)}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {filteredItems.length > 0 && (
                            <CostingPagination
                                currentPage={itemPage}
                                totalPages={Math.max(1, Math.ceil(filteredItems.length / itemPageSize))}
                                totalItems={filteredItems.length}
                                pageSize={itemPageSize}
                                onPageChange={setItemPage}
                                onPageSizeChange={(newSize) => {
                                    setItemPageSize(newSize);
                                    setItemPage(1);
                                }}
                                label="Items"
                            />
                        )}
                    </div>
                )}

                {/* 4. Pricing Defaults Tab (Figma Frame 2147225128) */}
                {activeTab === "Pricing Defaults" && (
                    <div className="costing-pricing-defaults-grid">
                        {/* Left Column: PRICING DEFAULTS (Frame 2147225071) */}
                        <div className="costing-pricing-panel">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                <h3 className="costing-pricing-panel-title">PRICING DEFAULTS</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsEditCategoryOpen(true)}
                                    className="costing-detail-action-btn"
                                    style={{ padding: "8px 14px", height: "36px", fontSize: "13px" }}
                                >
                                    <Edit size={14} />
                                    <span>Edit Defaults</span>
                                </button>
                            </div>
                            <div className="costing-pricing-inner-card">
                                {/* Row 1: Default Markup & Default Tax */}
                                <div className="costing-pricing-row-2col">
                                    <div className="costing-pricing-field">
                                        <span className="costing-pricing-label">Default Markup</span>
                                        <span className="costing-pricing-val">
                                            {activeCat.default_markup_percent !== null && activeCat.default_markup_percent !== undefined
                                                ? `${activeCat.default_markup_percent}%`
                                                : "20%"}
                                        </span>
                                    </div>
                                    <div className="costing-pricing-field">
                                        <span className="costing-pricing-label">Default Tax</span>
                                        <span className="costing-pricing-val">
                                            {activeCat.default_tax_percent !== null && activeCat.default_tax_percent !== undefined
                                                ? `GST ${activeCat.default_tax_percent}%`
                                                : "GST 18%"}
                                        </span>
                                    </div>
                                </div>

                                {/* Row 2: Default Wastage & Default Unit */}
                                <div className="costing-pricing-row-2col">
                                    <div className="costing-pricing-field">
                                        <span className="costing-pricing-label">Default Wastage</span>
                                        <span className="costing-pricing-val">
                                            {activeCat.default_waste_percent !== null && activeCat.default_waste_percent !== undefined
                                                ? `${activeCat.default_waste_percent}%`
                                                : "5%"}
                                        </span>
                                    </div>
                                    <div className="costing-pricing-field">
                                        <span className="costing-pricing-label">Default Unit</span>
                                        <span className="costing-pricing-val">
                                            {activeCat.default_unit || "Nos"}
                                        </span>
                                    </div>
                                </div>

                                {/* Row 3: Transportation Included & Labour Included */}
                                <div className="costing-pricing-row-2col">
                                    <div className="costing-pricing-field">
                                        <span className="costing-pricing-label">Transportation Included</span>
                                        <span className="costing-pricing-val">
                                            {activeCat.transport_included ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    <div className="costing-pricing-field">
                                        <span className="costing-pricing-label">Labour Included</span>
                                        <span className="costing-pricing-val">
                                            {activeCat.labour_included ? "Yes" : "No"}
                                        </span>
                                    </div>
                                </div>

                                {/* Row 4: Markup Type & Tax Applied On */}
                                <div className="costing-pricing-row-2col">
                                    <div className="costing-pricing-field">
                                        <span className="costing-pricing-label">Markup Type</span>
                                        <span className="costing-pricing-val">
                                            {(activeCat as any).markup_type || "Percentage"}
                                        </span>
                                    </div>
                                    <div className="costing-pricing-field">
                                        <span className="costing-pricing-label">Tax Applied On</span>
                                        <span className="costing-pricing-val">
                                            {(activeCat as any).tax_applied_on || "Selling Price"}
                                        </span>
                                    </div>
                                </div>

                                {/* Row 5: Cost Code & Rate Effected From */}
                                <div className="costing-pricing-row-2col">
                                    <div className="costing-pricing-field">
                                        <span className="costing-pricing-label">Cost Code</span>
                                        <span className="costing-pricing-val">
                                            {activeCat.code || "-"}
                                        </span>
                                    </div>
                                    <div className="costing-pricing-field">
                                        <span className="costing-pricing-label">Rate Effected From</span>
                                        <span className="costing-pricing-val">
                                            {formatDate(activeCat.updated_at || activeCat.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: INHERITED FROM & LAST UPDATED (Frame 2147225074) */}
                        <div className="costing-pricing-sidebar">
                            {/* Section 1: INHERITED FROM */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                                <h3 className="costing-pricing-panel-title">INHERITED FROM</h3>
                                <div className="costing-pricing-side-card">
                                    <div className="costing-pricing-side-row">
                                        <span className="costing-pricing-label">Parent Category</span>
                                        <span className="costing-pricing-val" style={{ fontWeight: 600 }}>
                                            {activeCat.parentName || (activeCat.parent_id ? allCategories.find((c) => c.id === activeCat.parent_id)?.name : null) || "None (Root Category)"}
                                        </span>
                                    </div>
                                    <div className="costing-pricing-side-row">
                                        <span className="costing-pricing-label">Organisation Defaults</span>
                                        <span className="costing-pricing-val" style={{ fontWeight: 600 }}>
                                            {(activeCat as any).org_default_name || "Org Default V2.3"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: LAST UPDATED */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                                <h3 className="costing-pricing-panel-title">LAST UPDATED</h3>
                                <div className="costing-pricing-side-card">
                                    <div className="costing-pricing-side-row">
                                        <span className="costing-pricing-label">UPDATED ON</span>
                                        <span className="costing-pricing-val">
                                            {formatDate(activeCat.updated_at || activeCat.created_at)}
                                        </span>
                                    </div>
                                    <div className="costing-pricing-side-row">
                                        <span className="costing-pricing-label">UPDATED BY</span>
                                        <span className="costing-pricing-val">
                                            {(activeCat as any).updated_by_name || (activeCat as any).updated_by || "Admin"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. Activity Tab (Figma Frame 2147225069) */}
                {activeTab === "Activity" && (
                    <div className="costing-activity-table-card">
                        <div className="costing-activity-table-scroll">
                            <table className="costing-activity-table">
                                <thead>
                                    <tr className="costing-activity-th-row">
                                        <th className="costing-activity-th" style={{ width: "25%", borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px" }}>
                                            ACTION
                                        </th>
                                        <th className="costing-activity-th" style={{ width: "40%" }}>
                                            DETAILS
                                        </th>
                                        <th className="costing-activity-th" style={{ width: "15%" }}>
                                            BY
                                        </th>
                                        <th className="costing-activity-th" style={{ width: "20%", borderTopRightRadius: "8px", borderBottomRightRadius: "8px" }}>
                                            DATE
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedActivities.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ padding: "48px", textAlign: "center", color: "#64748B", fontFamily: "Urbanist" }}>
                                                No activity recorded for {activeCat.name} yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedActivities.map((act) => (
                                            <tr key={act.id} className="costing-activity-tr">
                                                <td className="costing-activity-td td-action">
                                                    {act.action}
                                                </td>
                                                <td className="costing-activity-td td-details">
                                                    {act.details}
                                                </td>
                                                <td className="costing-activity-td td-by">
                                                    {act.by || "Admin"}
                                                </td>
                                                <td className="costing-activity-td td-date">
                                                    {formatDateTime(act.date)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {dynamicActivities.length > 0 && (
                            <CostingPagination
                                currentPage={activityPage}
                                totalPages={Math.max(1, Math.ceil(dynamicActivities.length / activityPageSize))}
                                totalItems={dynamicActivities.length}
                                pageSize={activityPageSize}
                                onPageChange={setActivityPage}
                                onPageSizeChange={(newSize) => {
                                    setActivityPageSize(newSize);
                                    setActivityPage(1);
                                }}
                                label="Activity"
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Create / Edit Category Modal */}
            <NewCategoryModal
                isOpen={isEditCategoryOpen}
                onClose={() => setIsEditCategoryOpen(false)}
                onSuccess={() => {
                    void loadDetail();
                }}
                categories={allCategories.length ? allCategories : [category]}
                categoryToEdit={activeCat}
            />

            {/* Create Subcategory Modal (Uses dedicated NewSubCategoryModal with 3 fields!) */}
            <NewSubCategoryModal
                isOpen={isSubCategoryModalOpen}
                onClose={() => setIsSubCategoryModalOpen(false)}
                onSuccess={() => {
                    void loadDetail();
                }}
                categories={allCategories.length ? allCategories : [category]}
                initialParentId={category.id}
            />

            {/* Add Item Modal */}
            <AddItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onSuccess={() => {
                    void loadDetail();
                }}
            />

            {/* Excel Import Modal */}
            <CostingExcelImportModal
                isOpen={isExcelImportOpen}
                onClose={() => setIsExcelImportOpen(false)}
                onSuccess={() => {
                    void loadDetail();
                }}
            />
        </div>
    );
}
