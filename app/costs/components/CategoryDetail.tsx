"use client";

import { ArrowLeft, ChevronDown, ChevronLeft, Filter, MoreHorizontal, Plus, Search, Folder, RefreshCw, Layers, ExternalLink, Calendar, User, Tag, Copy, Trash2, Edit } from "lucide-react";
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
}

export default function CategoryDetail({ category, onBack, allCategories = [] }: CategoryDetailProps) {
    const [activeTab, setActiveTab] = useState<SubTab>("Overview");
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
        if (activeCat.default_markup_percent !== null && activeCat.default_markup_percent !== undefined) {
            list.push({
                id: `act-markup-${activeCat.id}`,
                action: "Markup Updated",
                details: `Default Markup Changed to ${activeCat.default_markup_percent}%`,
                by: "Admin",
                date: activeCat.updated_at || activeCat.created_at
            });
        }
        for (const sub of subCategoriesList) {
            list.push({
                id: `act-sub-${sub.id}`,
                action: "Sub Category Added",
                details: `Sub category "${sub.name}" added`,
                by: "Admin",
                date: sub.created_at || sub.updated_at || activeCat.updated_at
            });
        }
        for (const itm of itemsList) {
            list.push({
                id: `act-item-${itm.id}`,
                action: "Item Added",
                details: `Item "${itm.name}" added`,
                by: "Admin",
                date: itm.created_at || itm.updated_at || activeCat.updated_at
            });
        }
        list.push({
            id: `act-created-${activeCat.id}`,
            action: "Category Created",
            details: `Category "${activeCat.name}" registered`,
            by: "Admin",
            date: activeCat.created_at
        });
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [detail?.activityLog, activeCat, subCategoriesList, itemsList]);

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
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Top Back Navigation & Action Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <button
                        type="button"
                        onClick={onBack}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "transparent",
                            border: "none",
                            color: "#2563eb",
                            fontWeight: 600,
                            fontSize: "14px",
                            cursor: "pointer",
                            padding: 0
                        }}
                        className="hover:underline"
                    >
                        <ArrowLeft size={16} /> Back to Categories
                    </button>
                    <div style={{ width: "1px", height: "16px", background: "#e2e8f0" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: 0 }}>
                            {activeCat.name}
                        </h2>
                        <span
                            style={{
                                background: "#ecfdf5",
                                color: "#10b981",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 600,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase"
                            }}
                        >
                            {activeCat.status || "ACTIVE"}
                        </span>
                        {activeCat.code && (
                            <span
                                style={{
                                    background: "#f1f5f9",
                                    color: "#475569",
                                    padding: "3px 8px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 500
                                }}
                            >
                                {activeCat.code}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
                    <button
                        type="button"
                        onClick={handleDuplicateCategory}
                        style={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            padding: "8px 18px",
                            borderRadius: "8px",
                            fontWeight: 500,
                            fontSize: "14px",
                            cursor: "pointer",
                            color: "#1f2937",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                        }}
                        className="hover:bg-slate-50"
                    >
                        Duplicate
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsEditCategoryOpen(true)}
                        style={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            padding: "8px 18px",
                            borderRadius: "8px",
                            fontWeight: 500,
                            fontSize: "14px",
                            cursor: "pointer",
                            color: "#1f2937",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                        }}
                        className="hover:bg-slate-50"
                    >
                        Edit Category
                    </button>
                </div>
            </div>

            {error && (
                <div
                    style={{
                        padding: "14px 16px",
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
                        onClick={loadDetail}
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
                        <RefreshCw size={15} /> Retry
                    </button>
                </div>
            )}

            {/* Dynamic Summary Cards matching Image 1 */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "16px"
                }}
            >
                {/* 1. Items */}
                <div
                    style={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                    }}
                >
                    <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Items</div>
                    <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
                        {itemsCount}
                    </div>
                    <button
                        type="button"
                        onClick={() => setActiveTab("Items")}
                        style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            color: "#2563eb",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        View Items &rarr;
                    </button>
                </div>

                {/* 2. Sub-Categories */}
                <div
                    style={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                    }}
                >
                    <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Sub-Categories</div>
                    <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
                        {subCategoriesCount}
                    </div>
                    <button
                        type="button"
                        onClick={() => setActiveTab("Sub Categories")}
                        style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            color: "#2563eb",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        View Sub-Categories &rarr;
                    </button>
                </div>

                {/* 3. Used in BOQs */}
                <div
                    style={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                    }}
                >
                    <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Used in BOQs</div>
                    <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
                        {usedInBoqsCount}
                    </div>
                    <a
                        href="/boqs"
                        style={{
                            color: "#2563eb",
                            fontSize: "13px",
                            fontWeight: 600,
                            textDecoration: "none"
                        }}
                    >
                        View BOQs &rarr;
                    </a>
                </div>

                {/* 4. Used in Projects */}
                <div
                    style={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                    }}
                >
                    <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Used in Projects</div>
                    <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
                        {usedInProjectsCount}
                    </div>
                    <a
                        href="/projects"
                        style={{
                            color: "#2563eb",
                            fontSize: "13px",
                            fontWeight: 600,
                            textDecoration: "none"
                        }}
                    >
                        View Projects &rarr;
                    </a>
                </div>
            </div>

            {/* Sub-Tabs Row */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                    marginTop: "8px"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        background: "#fff",
                        padding: "4px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        overflowX: "auto"
                    }}
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: "8px 22px",
                                background: activeTab === tab ? "#eff6ff" : "transparent",
                                color: activeTab === tab ? "#2563eb" : "#64748b",
                                fontWeight: activeTab === tab ? 600 : 500,
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "14px",
                                whiteSpace: "nowrap"
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Sub Categories toolbar: Search, Filter, Import Excel, + Sub-Category */}
                {activeTab === "Sub Categories" && (
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                padding: "0 10px"
                            }}
                        >
                            <Search size={15} color="#6b7280" />
                            <input
                                placeholder="Search sub-category..."
                                value={subCatSearch}
                                onChange={(e) => setSubCatSearch(e.target.value)}
                                style={{ border: "none", outline: "none", padding: "8px", fontSize: "13px", width: "160px" }}
                            />
                        </label>
                        <CostingFilterPopover
                            currentStatus={subCatStatus}
                            onApply={({ status }) => setSubCatStatus(status)}
                            onReset={() => setSubCatStatus("all")}
                        />
                        <button
                            type="button"
                            onClick={() => setIsExcelImportOpen(true)}
                            style={{
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                padding: "8px 14px",
                                borderRadius: "8px",
                                fontWeight: 500,
                                fontSize: "13px",
                                cursor: "pointer",
                                color: "#374151"
                            }}
                        >
                            Import Excel
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsSubCategoryModalOpen(true)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "#2563eb",
                                color: "#fff",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                fontWeight: 600,
                                fontSize: "13px",
                                cursor: "pointer"
                            }}
                        >
                            <Plus size={15} /> Sub-Category
                        </button>
                    </div>
                )}

                {/* Items toolbar: Search, Filter, Import Excel, + New Item */}
                {activeTab === "Items" && (
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                padding: "0 10px"
                            }}
                        >
                            <Search size={15} color="#6b7280" />
                            <input
                                placeholder="Search items..."
                                value={itemSearch}
                                onChange={(e) => setItemSearch(e.target.value)}
                                style={{ border: "none", outline: "none", padding: "8px", fontSize: "13px", width: "160px" }}
                            />
                        </label>
                        <CostingFilterPopover
                            currentStatus={itemStatus}
                            onApply={({ status }) => setItemStatus(status)}
                            onReset={() => setItemStatus("all")}
                        />
                        <button
                            type="button"
                            onClick={() => setIsExcelImportOpen(true)}
                            style={{
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                padding: "8px 14px",
                                borderRadius: "8px",
                                fontWeight: 500,
                                fontSize: "13px",
                                cursor: "pointer",
                                color: "#374151"
                            }}
                        >
                            Import Excel
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsItemModalOpen(true)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "#2563eb",
                                color: "#fff",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                fontWeight: 600,
                                fontSize: "13px",
                                cursor: "pointer"
                            }}
                        >
                            <Plus size={15} /> New Item
                        </button>
                    </div>
                )}
            </div>

            {/* Sub-Tabs Content Area */}
            <div>
                {/* 1. Overview Tab */}
                {activeTab === "Overview" && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1.4fr 1fr 1fr",
                            gap: "20px",
                            alignItems: "stretch"
                        }}
                    >
                        {/* Category Information */}
                        <div
                            style={{
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "12px",
                                padding: "24px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                            }}
                        >
                            <div
                                style={{
                                    color: "#6b7280",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    letterSpacing: "0.05em",
                                    marginBottom: "20px",
                                    textTransform: "uppercase"
                                }}
                            >
                                CATEGORY INFORMATION
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Category Name</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>{activeCat.name}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Category Code</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>{activeCat.code || "-"}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Parent Category</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 500 }}>
                                        {activeCat.parentName || (activeCat.parent_id ? allCategories.find((c) => c.id === activeCat.parent_id)?.name : null) || "-"}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Default Unit</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 500 }}>{activeCat.default_unit || "Nos"}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Created On</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 500 }}>{formatDate(activeCat.created_at)}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Updated On</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 500 }}>{formatDate(activeCat.updated_at)}</div>
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Description</div>
                                    <div style={{ color: "#374151", fontSize: "14px", lineHeight: "1.5" }}>
                                        {activeCat.description || "Category for organizing items, rates, and margins."}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hierarchy Card + Pricing Details Card */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* Hierarchy Card */}
                            <div
                                style={{
                                    background: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "12px",
                                    padding: "20px 24px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                                }}
                            >
                                <div
                                    style={{
                                        color: "#6b7280",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        letterSpacing: "0.05em",
                                        marginBottom: "16px",
                                        textTransform: "uppercase"
                                    }}
                                >
                                    HIERARCHY
                                </div>
                                <div
                                    style={{
                                        padding: "16px",
                                        background: "#f8fafc",
                                        borderRadius: "8px",
                                        border: "1px solid #e2e8f0",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "10px"
                                    }}
                                >
                                    {activeCat.parentName ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px" }}>
                                            <Folder size={15} color="#94a3b8" />
                                            <span>{activeCat.parentName}</span>
                                        </div>
                                    ) : null}

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            color: "#2563eb",
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            paddingLeft: activeCat.parentName ? "16px" : "0"
                                        }}
                                    >
                                        <Folder size={16} color="#2563eb" />
                                        <span>{activeCat.name}</span>
                                    </div>

                                    {subCategoriesList.length > 0 && (
                                        <div style={{ paddingLeft: activeCat.parentName ? "32px" : "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                            {subCategoriesList.slice(0, 3).map((s) => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => setActiveSubCategory(s)}
                                                    style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", cursor: "pointer" }}
                                                    className="hover:text-blue-600"
                                                >
                                                    <Layers size={13} color="#94a3b8" />
                                                    <span>{s.name}</span>
                                                </div>
                                            ))}
                                            {subCategoriesList.length > 3 && (
                                                <div style={{ color: "#94a3b8", fontSize: "11px", paddingLeft: "18px" }}>
                                                    + {subCategoriesList.length - 3} more sub-categories
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pricing Details Card */}
                            <div
                                style={{
                                    background: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "12px",
                                    padding: "20px 24px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                                }}
                            >
                                <div
                                    style={{
                                        color: "#6b7280",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        letterSpacing: "0.05em",
                                        marginBottom: "16px",
                                        textTransform: "uppercase"
                                    }}
                                >
                                    PRICING DETAILS
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ color: "#6b7280", fontSize: "13px" }}>Default Markup</span>
                                        <span style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>
                                            {activeCat.default_markup_percent !== null && activeCat.default_markup_percent !== undefined
                                                ? `${activeCat.default_markup_percent}%`
                                                : "20%"}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ color: "#6b7280", fontSize: "13px" }}>Default Tax</span>
                                        <span style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>
                                            {activeCat.default_tax_percent !== null && activeCat.default_tax_percent !== undefined
                                                ? `GST ${activeCat.default_tax_percent}%`
                                                : "GST 18%"}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ color: "#6b7280", fontSize: "13px" }}>Default Wastage</span>
                                        <span style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>
                                            {activeCat.default_waste_percent !== null && activeCat.default_waste_percent !== undefined
                                                ? `${activeCat.default_waste_percent}%`
                                                : "5%"}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ color: "#6b7280", fontSize: "13px" }}>Cost Code</span>
                                        <span style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>{activeCat.code || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Recent Activity */}
                        <div
                            style={{
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "12px",
                                padding: "24px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                display: "flex",
                                flexDirection: "column"
                            }}
                        >
                            <div
                                style={{
                                    color: "#6b7280",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    letterSpacing: "0.05em",
                                    marginBottom: "20px",
                                    textTransform: "uppercase"
                                }}
                            >
                                RECENT ACTIVITY
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {dynamicActivities.slice(0, 5).map((act) => (
                                    <div key={act.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                        <div
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                background: "#f1f5f9",
                                                borderRadius: "50%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#64748b",
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                flexShrink: 0
                                            }}
                                        >
                                            {act.action[0]}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{act.action}</div>
                                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                                                {act.details}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontSize: "11px", color: "#9ca3af" }}>{formatDate(act.date)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Sub Categories Tab */}
                {activeTab === "Sub Categories" && (
                    <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px", minWidth: "900px" }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>SUB-CATEGORY NAME</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>SUB-CATEGORY CODE</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em", textAlign: "center" }}>ITEMS</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em", textAlign: "center" }}>USED IN BOQS</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em", textAlign: "center" }}>USED IN PROJECTS</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>STATUS</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>UPDATED</th>
                                        <th style={{ padding: "14px 16px", width: "48px" }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedSubCategories.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
                                                No sub-categories found under {activeCat.name}.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedSubCategories.map((sub) => (
                                            <tr key={sub.id} style={{ borderBottom: "1px solid #f1f5f9" }} className="hover:bg-slate-50">
                                                <td style={{ padding: "14px 16px", color: "#111827", fontWeight: 600 }}>
                                                    <div
                                                        onClick={() => setActiveSubCategory(sub)}
                                                        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                                                        className="hover:text-blue-600"
                                                    >
                                                        <Folder size={15} color="#475569" />
                                                        <span>{sub.name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "14px 16px", color: "#64748b" }}>{sub.code || "-"}</td>
                                                <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 600, color: "#111827" }}>
                                                    {sub.itemsCount ?? sub.items ?? 0}
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>
                                                    {sub.usedInBoqs ?? 0}
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>
                                                    {sub.usedInProjects ?? 0}
                                                </td>
                                                <td style={{ padding: "14px 16px" }}>
                                                    <span
                                                        style={{
                                                            background: "#ecfdf5",
                                                            color: "#10b981",
                                                            padding: "3px 8px",
                                                            borderRadius: "12px",
                                                            fontSize: "11px",
                                                            fontWeight: 600,
                                                            letterSpacing: "0.02em",
                                                            textTransform: "uppercase"
                                                        }}
                                                    >
                                                        {sub.status || "ACTIVE"}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "14px 16px", color: "#64748b" }}>{formatDate(sub.updated_at || sub.created_at)}</td>
                                                <td style={{ padding: "14px 16px" }}>
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
                            />
                        )}
                    </div>
                )}

                {/* 3. Items Tab */}
                {activeTab === "Items" && (
                    <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px", minWidth: "950px" }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>ITEM</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>CODE</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>UNIT</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>BASE COST (₹)</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>SELLING RATE (₹)</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>MARGIN</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>PREFERRED VENDOR</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>RATE STATUS</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>UPDATED</th>
                                        <th style={{ padding: "14px 16px", width: "48px" }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
                                                No items under {activeCat.name} yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedItems.map((item) => {
                                            const base = Number(item.base_cost ?? item.baseCost ?? 0);
                                            const sell = Number(item.selling_rate ?? item.sellingRate ?? 0);
                                            const margin = sell > 0 ? Math.round(((sell - base) * 100) / sell) : 0;

                                            return (
                                                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }} className="hover:bg-slate-50">
                                                    <td style={{ padding: "14px 16px" }}>
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
                                                                        background: "#f1f5f9",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        color: "#94a3b8"
                                                                    }}
                                                                >
                                                                    <Tag size={15} />
                                                                </div>
                                                            )}
                                                            <span style={{ fontWeight: 600, color: "#111827" }}>{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "14px 16px", color: "#64748b" }}>{item.code || "-"}</td>
                                                    <td style={{ padding: "14px 16px", color: "#475569" }}>{item.unit || "Nos"}</td>
                                                    <td style={{ padding: "14px 16px", color: "#111827", fontWeight: 500 }}>
                                                        ₹{formatMoney(base)}
                                                    </td>
                                                    <td style={{ padding: "14px 16px", color: "#111827", fontWeight: 600 }}>
                                                        ₹{formatMoney(sell)}
                                                    </td>
                                                    <td style={{ padding: "14px 16px", color: margin >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                                                        {margin}%
                                                    </td>
                                                    <td style={{ padding: "14px 16px", color: "#475569" }}>
                                                        {item.preferred_vendor || item.preferredVendor || "-"}
                                                    </td>
                                                    <td style={{ padding: "14px 16px" }}>
                                                        <RateStatusDropdown
                                                            itemId={item.id}
                                                            currentStatus={item.rate_status || "active"}
                                                            onStatusChange={(newStatus) => {
                                                                void loadDetail();
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: "14px 16px", color: "#64748b" }}>{formatDate(item.updated_at || item.created_at)}</td>
                                                    <td style={{ padding: "14px 16px" }}>
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
                            />
                        )}
                    </div>
                )}

                {/* 4. Pricing Defaults Tab */}
                {activeTab === "Pricing Defaults" && (
                    <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px" }}>
                        <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600, color: "#111827" }}>
                            Pricing Defaults for {activeCat.name}
                        </h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>Default Markup</div>
                                <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
                                    {activeCat.default_markup_percent ?? 20}%
                                </div>
                            </div>
                            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>Default Tax (GST)</div>
                                <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
                                    {activeCat.default_tax_percent ?? 18}%
                                </div>
                            </div>
                            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>Default Wastage</div>
                                <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
                                    {activeCat.default_waste_percent ?? 5}%
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. Activity Tab */}
                {activeTab === "Activity" && (
                    <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px" }}>
                        <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600, color: "#111827" }}>
                            Activity History
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {dynamicActivities.map((act) => (
                                <div key={act.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "13px" }}>{act.action}</div>
                                        <div style={{ color: "#64748b", fontSize: "12px" }}>{act.details}</div>
                                    </div>
                                    <div style={{ color: "#94a3b8", fontSize: "12px" }}>{formatDate(act.date)}</div>
                                </div>
                            ))}
                        </div>
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
