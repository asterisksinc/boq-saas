"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Folder, Layers, Tag, Plus, Search, RefreshCw, Copy, Trash2, Edit } from "lucide-react";
import { getCostingCategoryDetail, getCostingItems, deleteCostingItem } from "@/lib/api/costing";
import type { CostingCategoryBackend, CostingCategoryDetail as CostingCategoryDetailType, CostingItemBackend } from "@/lib/types";
import AddItemModal from "./AddItemModal";
import RateStatusDropdown from "@/components/costing/RateStatusDropdown";
import CostingMoreMenu from "@/components/costing/CostingMoreMenu";
import CostingFilterPopover from "@/components/costing/CostingFilterPopover";
import CostingPagination from "@/components/costing/CostingPagination";
import CostingExcelImportModal from "@/components/costing/CostingExcelImportModal";

type SubCatTab = "Overview" | "Items" | "Pricing Defaults" | "Activity";

interface SubCategoryDetailProps {
    subCategory: CostingCategoryBackend;
    parentCategory: CostingCategoryBackend | CostingCategoryDetailType;
    onBack: () => void;
    onDeleteSuccess?: () => void;
}

export default function SubCategoryDetail({
    subCategory,
    parentCategory,
    onBack,
    onDeleteSuccess
}: SubCategoryDetailProps) {
    const [activeTab, setActiveTab] = useState<SubCatTab>("Overview");
    const [detail, setDetail] = useState<CostingCategoryDetailType | null>(null);
    const [items, setItems] = useState<CostingItemBackend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Toolbar states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modals
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [detailRes, itemsRes] = await Promise.all([
                getCostingCategoryDetail(subCategory.id).catch(() => null),
                getCostingItems({ categoryId: subCategory.id, pageSize: 100 })
            ]);
            if (detailRes) setDetail(detailRes);
            setItems(itemsRes.items || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load sub-category details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [subCategory.id]);

    const activeSub = detail || subCategory;

    // Filter items
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch =
                !searchQuery ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus =
                statusFilter === "all" ||
                (item.rate_status || "active").toLowerCase() === statusFilter.toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [items, searchQuery, statusFilter]);

    // Paginate
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredItems.slice(start, start + pageSize);
    }, [filteredItems, currentPage, pageSize]);

    // Formatter helpers
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

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            await deleteCostingItem(itemId);
            setItems((prev) => prev.filter((i) => i.id !== itemId));
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete item");
        }
    };

    const tabs: SubCatTab[] = ["Overview", "Items", "Pricing Defaults", "Activity"];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Back navigation button */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                    type="button"
                    onClick={onBack}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0
                    }}
                    className="hover:underline"
                >
                    <ArrowLeft size={16} /> Back to {parentCategory.name}
                </button>
            </div>

            {/* Header info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                            {activeSub.name}
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
                            {activeSub.status || "ACTIVE"}
                        </span>
                        {activeSub.code && (
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
                                {activeSub.code}
                            </span>
                        )}
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#eff6ff",
                                color: "#2563eb",
                                padding: "3px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 500
                            }}
                        >
                            <Folder size={12} /> Parent: {parentCategory.name}
                        </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "6px 0 0 0" }}>
                        Sub-category under {parentCategory.name} &bull; Created on {formatDate(activeSub.created_at)}
                    </p>
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
                        <RefreshCw size={15} /> Retry
                    </button>
                </div>
            )}

            {/* Dynamic KPI Summary Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
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
                        {items.length}
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

                {/* 2. Used in BOQs */}
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
                        {detail?.usedInBoqs ?? 0}
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

                {/* 3. Used in Projects */}
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
                        {detail?.usedInProjects ?? 0}
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
                    gap: "16px"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        background: "#fff",
                        padding: "4px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
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
                                fontSize: "14px"
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Actions when on Items tab: Search, Filter, Import Excel, + New Item */}
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
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ border: "none", outline: "none", padding: "8px", fontSize: "13px", width: "160px" }}
                            />
                        </label>
                        <CostingFilterPopover
                            currentStatus={statusFilter}
                            onApply={({ status }) => setStatusFilter(status)}
                            onReset={() => setStatusFilter("all")}
                        />
                        <button
                            type="button"
                            onClick={() => setIsImportOpen(true)}
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
                            onClick={() => setIsAddItemOpen(true)}
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

            {/* Sub-Tabs Content */}
            <div>
                {activeTab === "Overview" && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1.4fr 1fr 1fr",
                            gap: "20px"
                        }}
                    >
                        {/* Sub-Category Information Card */}
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
                                SUB-CATEGORY INFORMATION
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Sub-Category Name</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>{activeSub.name}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Sub-Category Code</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>{activeSub.code || "-"}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Parent Category</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 500 }}>{parentCategory.name}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Default Unit</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 500 }}>{activeSub.default_unit || parentCategory.default_unit || "Nos"}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Created On</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 500 }}>{formatDate(activeSub.created_at)}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Updated On</div>
                                    <div style={{ color: "#111827", fontSize: "14px", fontWeight: 500 }}>{formatDate(activeSub.updated_at || activeSub.created_at)}</div>
                                </div>
                            </div>
                        </div>

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
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px" }}>
                                    <Folder size={15} color="#94a3b8" />
                                    <span>{parentCategory.name}</span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        color: "#2563eb",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        paddingLeft: "16px"
                                    }}
                                >
                                    <Layers size={16} color="#2563eb" />
                                    <span>{activeSub.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Defaults Card */}
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
                                PRICING DEFAULTS
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "#6b7280", fontSize: "13px" }}>Default Markup</span>
                                    <span style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>
                                        {activeSub.default_markup_percent ?? parentCategory.default_markup_percent ?? 20}%
                                    </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "#6b7280", fontSize: "13px" }}>Default Tax</span>
                                    <span style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>
                                        GST {activeSub.default_tax_percent ?? parentCategory.default_tax_percent ?? 18}%
                                    </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "#6b7280", fontSize: "13px" }}>Default Wastage</span>
                                    <span style={{ color: "#111827", fontSize: "14px", fontWeight: 600 }}>
                                        {activeSub.default_waste_percent ?? parentCategory.default_waste_percent ?? 5}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                                No items under {activeSub.name} yet.
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
                                                                setItems((prev) =>
                                                                    prev.map((i) => (i.id === item.id ? { ...i, rate_status: newStatus } : i))
                                                                );
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: "14px 16px", color: "#64748b" }}>{formatDate(item.updated_at)}</td>
                                                    <td style={{ padding: "14px 16px" }}>
                                                        <CostingMoreMenu
                                                            entityName="Item"
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
                                currentPage={currentPage}
                                totalPages={Math.max(1, Math.ceil(filteredItems.length / pageSize))}
                                totalItems={filteredItems.length}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(newSize) => {
                                    setPageSize(newSize);
                                    setCurrentPage(1);
                                }}
                            />
                        )}
                    </div>
                )}

                {activeTab === "Pricing Defaults" && (
                    <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px" }}>
                        <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600, color: "#111827" }}>
                            Pricing Rules & Overrides for {activeSub.name}
                        </h4>
                        <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6" }}>
                            Inherited from parent category: <strong>{parentCategory.name}</strong>.
                            Items under this sub-category apply a baseline markup of {activeSub.default_markup_percent ?? parentCategory.default_markup_percent ?? 20}% and GST rate of {activeSub.default_tax_percent ?? parentCategory.default_tax_percent ?? 18}%.
                        </p>
                    </div>
                )}

                {activeTab === "Activity" && (
                    <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px" }}>
                        <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600, color: "#111827" }}>
                            Activity Log
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "13px" }}>Sub-Category Registered</div>
                                    <div style={{ color: "#64748b", fontSize: "12px" }}>Created under {parentCategory.name}</div>
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "12px" }}>{formatDate(activeSub.created_at)}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Item Modal */}
            <AddItemModal
                isOpen={isAddItemOpen}
                onClose={() => setIsAddItemOpen(false)}
                onSuccess={() => {
                    void loadData();
                }}
            />

            {/* Excel Import Modal */}
            <CostingExcelImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onSuccess={() => {
                    void loadData();
                }}
            />
        </div>
    );
}
