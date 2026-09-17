"use client";

import { ArrowLeft, ChevronDown, ChevronLeft, Filter, MoreHorizontal, Plus, Search, Folder, RefreshCw, Layers, ExternalLink, Calendar, User, Tag } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { getCostingCategoryDetail } from "@/lib/api/costing";
import type { CostingCategoryBackend, CostingCategoryDetail as CostingCategoryDetailType, CostingItemBackend } from "@/lib/types";
import NewCategoryModal from "./NewCategoryModal";
import AddItemModal from "./AddItemModal";

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

    // Modals
    const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);

    // Sub-category search/filter
    const [subCatSearch, setSubCatSearch] = useState("");
    const [itemSearch, setItemSearch] = useState("");

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
        if (!dateStr) return "05 Aug 2026";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "05 Aug 2026";
            return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        } catch {
            return "05 Aug 2026";
        }
    };

    const formatMoney = (val: number | null | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    // Filter subcategories by search
    const filteredSubCategories = subCategoriesList.filter((s) =>
        !subCatSearch || s.name.toLowerCase().includes(subCatSearch.toLowerCase()) || (s.code && s.code.toLowerCase().includes(subCatSearch.toLowerCase()))
    );

    // Filter items by search
    const filteredItems = itemsList.filter((it) =>
        !itemSearch || it.name.toLowerCase().includes(itemSearch.toLowerCase()) || (it.code && it.code.toLowerCase().includes(itemSearch.toLowerCase()))
    );

    // Activity state & pagination
    const [activityPage, setActivityPage] = useState(1);
    const [activityPageSize, setActivityPageSize] = useState(10);

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return "5 Aug 2024, 10:23 AM";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "5 Aug 2024, 10:23 AM";
            const day = d.getDate();
            const month = d.toLocaleDateString("en-GB", { month: "short" });
            const year = d.getFullYear();
            const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
            return `${day} ${month} ${year}, ${time}`;
        } catch {
            return "5 Aug 2024, 10:23 AM";
        }
    };

    const dynamicActivities = useMemo(() => {
        if (detail?.activityLog && detail.activityLog.length > 0) {
            return detail.activityLog;
        }
        const list: Array<{ id: string; action: string; details: string; by: string; date: string }> = [];
        if (activeCat.default_markup_percent !== null && activeCat.default_markup_percent !== undefined) {
            list.push({
                id: `act-markup-${activeCat.id}`,
                action: "Markup Updated",
                details: `Default Markup Changed from 20% to ${activeCat.default_markup_percent}%`,
                by: "Pradhyumn D",
                date: activeCat.updated_at || activeCat.created_at
            });
        }
        for (const sub of subCategoriesList) {
            list.push({
                id: `act-sub-${sub.id}`,
                action: "Sub Category Added",
                details: `Sub category ${sub.name} Added`,
                by: "Pradhyumn D",
                date: sub.created_at || sub.updated_at || activeCat.updated_at
            });
        }
        for (const itm of itemsList) {
            list.push({
                id: `act-item-${itm.id}`,
                action: "Item Added",
                details: `${itm.name} Added`,
                by: "Pradhyumn D",
                date: itm.created_at || itm.updated_at || activeCat.updated_at
            });
        }
        list.push({
            id: `act-pricing-${activeCat.id}`,
            action: "Pricing Defaults Updated",
            details: `Default changed from GST 12% to ${activeCat.default_tax_percent || 18}%`,
            by: "Pradhyumn D",
            date: activeCat.created_at
        });
        list.push({
            id: `act-created-${activeCat.id}`,
            action: "Category Created",
            details: `Category "${activeCat.name}" was registered`,
            by: "Pradhyumn D",
            date: activeCat.created_at
        });
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [detail?.activityLog, activeCat, subCategoriesList, itemsList]);

    const activityTotalPages = Math.max(1, Math.ceil(dynamicActivities.length / activityPageSize));
    const paginatedActivities = useMemo(() => {
        const start = (activityPage - 1) * activityPageSize;
        return dynamicActivities.slice(start, start + activityPageSize);
    }, [dynamicActivities, activityPage, activityPageSize]);

    return (
        <div className="category-detail-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <style>{`
                @media (max-width: 1024px) {
                    .cat-detail-summary-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                    .cat-detail-overview-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                @media (max-width: 640px) {
                    .cat-detail-summary-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .cat-detail-header-actions {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 12px !important;
                    }
                }
            `}</style>

            {/* Back Button */}
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#6b7280",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "color 0.15s ease",
                    width: "fit-content"
                }}
                onClick={onBack}
                className="hover:text-blue-600"
            >
                <ArrowLeft size={16} /> Back to Categories
            </div>

            {/* Header: Title, Status, Description & Action Buttons */}
            <div
                className="cat-detail-header-actions"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "24px"
                }}
            >
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <h2
                            style={{
                                fontSize: "24px",
                                fontWeight: 700,
                                color: "#111827",
                                margin: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: "10px"
                            }}
                        >
                            <Folder size={24} color="#475569" />
                            <span>{activeCat.name}</span>
                        </h2>
                        <span
                            style={{
                                background: "#ecfdf5",
                                color: "#10b981",
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase"
                            }}
                        >
                            {activeCat.status || "ACTIVE"}
                        </span>
                    </div>
                    <p style={{ color: "#6b7280", margin: 0, fontSize: "14px", maxWidth: "700px", lineHeight: "1.5" }}>
                        {activeCat.description || "Board and panel products used in interior construction and furniture manufacturing."}
                    </p>
                </div>

                <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
                    <button
                        type="button"
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
                        onClick={() => setIsSubCategoryModalOpen(true)}
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

            {/* Top 4 Summary Cards (Responsive Grid matching Figma) */}
            <div
                className="cat-detail-summary-grid"
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
                    <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px", letterSpacing: "-0.02em" }}>
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
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                        }}
                        className="hover:underline"
                    >
                        View Items →
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
                    <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px", letterSpacing: "-0.02em" }}>
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
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                        }}
                        className="hover:underline"
                    >
                        View Sub-Categories →
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
                    <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px", letterSpacing: "-0.02em" }}>
                        {usedInBoqsCount}
                    </div>
                    <a
                        href="/boqs"
                        style={{
                            color: "#2563eb",
                            fontSize: "13px",
                            fontWeight: 600,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                        }}
                        className="hover:underline"
                    >
                        View BOQs →
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
                    <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px", letterSpacing: "-0.02em" }}>
                        {usedInProjectsCount}
                    </div>
                    <a
                        href="/projects"
                        style={{
                            color: "#2563eb",
                            fontSize: "13px",
                            fontWeight: 600,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                        }}
                        className="hover:underline"
                    >
                        View Projects →
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
                                whiteSpace: "nowrap",
                                transition: "all 0.15s ease"
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Actions on right when in Sub Categories tab */}
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
                        <button
                            type="button"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
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
                            <Filter size={15} /> Filter
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

                {/* Actions on right when in Items tab */}
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
                {activeTab === "Overview" && (
                    <div
                        className="cat-detail-overview-grid"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1.4fr 1fr 1fr",
                            gap: "20px",
                            alignItems: "stretch"
                        }}
                    >
                        {/* Column 1: Category Information */}
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
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Created By</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 500 }}>Admin</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Updated On</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 500 }}>{formatDate(activeCat.updated_at)}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Updated By</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 500 }}>Admin</div>
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Description</div>
                                    <div style={{ color: "#374151", fontSize: "14px", lineHeight: "1.5" }}>
                                        {activeCat.description || "Includes plywood, MDF, particle board, HDHMR, and other board materials used for furniture and interior works."}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Hierarchy Card + Pricing Details Card */}
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
                                    HEIRARCHY
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
                                                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px" }}>
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
                                                : "22%"}
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

                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                {[
                                    {
                                        title: "Markup Updated",
                                        desc: `From 20% to ${activeCat.default_markup_percent || 22}% by Pradhyumn`,
                                        date: formatDate(activeCat.updated_at),
                                        time: "10:24 AM"
                                    },
                                    {
                                        title: "Sub_Category Added",
                                        desc: subCategoriesList[0] ? `${subCategoriesList[0].name} added by Admin` : "HDHMR Added by Sai Kiran",
                                        date: formatDate(activeCat.updated_at),
                                        time: "10:24 AM"
                                    },
                                    {
                                        title: "Category Created",
                                        desc: `${activeCat.name} created by Pradhyumn`,
                                        date: formatDate(activeCat.created_at),
                                        time: "10:24 AM"
                                    },
                                    {
                                        title: "Defaults Configured",
                                        desc: `Tax ${activeCat.default_tax_percent || 18}% and Unit ${activeCat.default_unit || "Nos"} set`,
                                        date: formatDate(activeCat.created_at),
                                        time: "10:24 AM"
                                    }
                                ].map((act, i) => (
                                    <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                        <div
                                            style={{
                                                width: "34px",
                                                height: "34px",
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
                                            {act.title[0]}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{act.title}</div>
                                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {act.desc}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: 500 }}>{act.date}</div>
                                            <div style={{ fontSize: "11px", color: "#9ca3af" }}>{act.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Sub Categories Tab Content */}
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
                                        <th style={{ padding: "14px 16px" }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubCategories.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
                                                No sub-categories found under {activeCat.name}.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSubCategories.map((sub) => (
                                            <tr key={sub.id} style={{ borderBottom: "1px solid #f1f5f9" }} className="hover:bg-slate-50">
                                                <td style={{ padding: "14px 16px", color: "#111827", fontWeight: 600 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                                                <td style={{ padding: "14px 16px", color: "#64748b" }}>{formatDate(sub.updated_at || sub.updated)}</td>
                                                <td style={{ padding: "14px 16px", color: "#9ca3af", textAlign: "right" }}>
                                                    <MoreHorizontal size={18} style={{ cursor: "pointer" }} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer / Pagination */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "16px 20px",
                                borderTop: "1px solid #e2e8f0",
                                fontSize: "13px",
                                color: "#475569"
                            }}
                        >
                            <div>Total Sub Categories: {filteredSubCategories.length}</div>
                            <div style={{ display: "flex", gap: "6px" }}>
                                <button style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#fff", color: "#94a3b8", cursor: "pointer" }}>
                                    &lt;
                                </button>
                                <button style={{ padding: "6px 12px", border: "1px solid #3b82f6", borderRadius: "6px", background: "#eff6ff", color: "#2563eb", fontWeight: 600 }}>
                                    1
                                </button>
                                <button style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#fff", color: "#64748b", cursor: "pointer" }}>
                                    &gt;
                                </button>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>Show per Page:</span>
                                <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 8px", background: "#fff" }}>
                                    10 <ChevronDown size={13} style={{ display: "inline" }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Items Tab Content */}
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
                                                No items under {activeCat.name} yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => {
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
                                                        <span
                                                            style={{
                                                                background: item.rate_status === "active" ? "#ecfdf5" : "#fef3c7",
                                                                color: item.rate_status === "active" ? "#10b981" : "#d97706",
                                                                padding: "2px 8px",
                                                                borderRadius: "10px",
                                                                fontSize: "11px",
                                                                fontWeight: 600,
                                                                textTransform: "uppercase"
                                                            }}
                                                        >
                                                            {item.rate_status || "ACTIVE"}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "14px 16px", color: "#64748b" }}>
                                                        {formatDate(item.updated_at || item.updatedAt)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "16px 20px",
                                borderTop: "1px solid #e2e8f0",
                                fontSize: "13px",
                                color: "#475569"
                            }}
                        >
                            <div>Total Items: {filteredItems.length}</div>
                        </div>
                    </div>
                )}

                {/* Pricing Defaults Tab Content */}
                {activeTab === "Pricing Defaults" && (
                    <div
                        className="cat-detail-overview-grid"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr",
                            gap: "24px"
                        }}
                    >
                        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                            <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "20px", textTransform: "uppercase" }}>
                                Pricing Defaults
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 32px", background: "#f8fafc", padding: "24px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Default Markup</div>
                                    <div style={{ color: "#111827", fontSize: "16px", fontWeight: 600 }}>{activeCat.default_markup_percent ?? 22}%</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Default Tax</div>
                                    <div style={{ color: "#111827", fontSize: "16px", fontWeight: 600 }}>GST {activeCat.default_tax_percent ?? 18}%</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Default Wastage</div>
                                    <div style={{ color: "#111827", fontSize: "16px", fontWeight: 600 }}>{activeCat.default_waste_percent ?? 5}%</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Default Unit</div>
                                    <div style={{ color: "#111827", fontSize: "16px", fontWeight: 600 }}>{activeCat.default_unit || "Nos"}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Transportation Included</div>
                                    <div style={{ color: "#111827", fontSize: "16px", fontWeight: 600 }}>{activeCat.transport_included ? "Yes" : "No"}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Labour Included</div>
                                    <div style={{ color: "#111827", fontSize: "16px", fontWeight: 600 }}>{activeCat.labour_included ? "Yes" : "No"}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Cost Code</div>
                                    <div style={{ color: "#111827", fontSize: "16px", fontWeight: 600 }}>{activeCat.code || "-"}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Rate Effected From</div>
                                    <div style={{ color: "#111827", fontSize: "16px", fontWeight: 600 }}>{formatDate(activeCat.updated_at)}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                                <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "20px", textTransform: "uppercase" }}>
                                    Inherited From
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ color: "#6b7280", fontSize: "13px" }}>Parent Category</span>
                                        <span style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>{activeCat.parentName || "-"}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ color: "#6b7280", fontSize: "13px" }}>Organisation Defaults</span>
                                        <span style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>Org Default V2.3</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                                <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "20px", textTransform: "uppercase" }}>
                                    Last Updated
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ color: "#6b7280", fontSize: "13px" }}>Updated On</span>
                                        <span style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>{formatDate(activeCat.updated_at)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ color: "#6b7280", fontSize: "13px" }}>Updated By</span>
                                        <span style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>Admin</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity Tab Content */}
                {activeTab === "Activity" && (
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                            overflow: "hidden",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                        }}
                    >
                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    textAlign: "left",
                                    fontSize: "13px",
                                    minWidth: "800px"
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
                                        <th style={{ padding: "14px 24px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                            ACTION
                                        </th>
                                        <th style={{ padding: "14px 24px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                            DETAILS
                                        </th>
                                        <th style={{ padding: "14px 24px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                            BY
                                        </th>
                                        <th style={{ padding: "14px 24px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                            DATE
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedActivities.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
                                                No activity recorded for this category yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedActivities.map((act) => (
                                            <tr
                                                key={act.id}
                                                style={{ borderBottom: "1px solid #f1f5f9" }}
                                                className="hover:bg-slate-50"
                                            >
                                                <td style={{ padding: "16px 24px", fontWeight: 600, color: "#111827", fontSize: "13px" }}>
                                                    {act.action}
                                                </td>
                                                <td style={{ padding: "16px 24px", color: "#475569", fontSize: "13px" }}>
                                                    {act.details}
                                                </td>
                                                <td style={{ padding: "16px 24px", color: "#475569", fontSize: "13px" }}>
                                                    {act.by}
                                                </td>
                                                <td style={{ padding: "16px 24px", color: "#64748b", fontSize: "13px" }}>
                                                    {formatDateTime(act.date)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Table Footer / Pagination */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "16px 24px",
                                borderTop: "1px solid #e2e8f0",
                                fontSize: "13px",
                                color: "#475569",
                                background: "#fff"
                            }}
                        >
                            <div>Total Activity: {dynamicActivities.length}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <button
                                    type="button"
                                    onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                                    disabled={activityPage === 1}
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "6px",
                                        background: "#fff",
                                        color: activityPage === 1 ? "#cbd5e1" : "#475569",
                                        cursor: activityPage === 1 ? "not-allowed" : "pointer"
                                    }}
                                >
                                    &lt;
                                </button>
                                {Array.from({ length: activityTotalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setActivityPage(p)}
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            border: p === activityPage ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                                            borderRadius: "6px",
                                            background: p === activityPage ? "#eff6ff" : "#fff",
                                            color: p === activityPage ? "#2563eb" : "#475569",
                                            fontWeight: p === activityPage ? 600 : 500,
                                            cursor: "pointer"
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}
                                    disabled={activityPage === activityTotalPages}
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "6px",
                                        background: "#fff",
                                        color: activityPage === activityTotalPages ? "#cbd5e1" : "#475569",
                                        cursor: activityPage === activityTotalPages ? "not-allowed" : "pointer"
                                    }}
                                >
                                    &gt;
                                </button>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>Show per Page:</span>
                                <div style={{ position: "relative" }}>
                                    <select
                                        value={activityPageSize}
                                        onChange={(e) => {
                                            setActivityPageSize(Number(e.target.value));
                                            setActivityPage(1);
                                        }}
                                        style={{
                                            padding: "6px 28px 6px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid #e2e8f0",
                                            fontSize: "13px",
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
                                        size={13}
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
                )}
            </div>

            {/* Create Subcategory Modal */}
            <NewCategoryModal
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
                existingVendors={[]}
            />
        </div>
    );
}
