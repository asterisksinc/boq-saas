"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, RefreshCw, Search, SlidersHorizontal, Tag } from "lucide-react";
import { getCostingItems, deleteCostingItem, duplicateCostingItem } from "@/lib/api/costing";
import type { CostingItemBackend } from "@/lib/types";
import AddItemModal from "./AddItemModal";
import RateStatusDropdown from "@/components/costing/RateStatusDropdown";
import CostingMoreMenu from "@/components/costing/CostingMoreMenu";
import CostingFilterPopover from "@/components/costing/CostingFilterPopover";
import CostingPagination from "@/components/costing/CostingPagination";
import CostingExcelImportModal from "@/components/costing/CostingExcelImportModal";

interface LibraryTabProps {
    isAddOpen?: boolean;
    setIsAddOpen?: (open: boolean) => void;
}

export default function LibraryTab({ isAddOpen, setIsAddOpen }: LibraryTabProps) {
    const [internalAddOpen, setInternalAddOpen] = useState(false);
    const showAddModal = isAddOpen !== undefined ? isAddOpen : internalAddOpen;
    const setShowAddModal = setIsAddOpen || setInternalAddOpen;

    const [isImportOpen, setIsImportOpen] = useState(false);
    const [items, setItems] = useState<CostingItemBackend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filter & Pagination states
    const [searchQuery, setSearchQuery] = useState("");
    const [rateStatusFilter, setRateStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getCostingItems({
                page: 1,
                pageSize: 200,
                search: searchQuery.trim() || undefined,
                rateStatus: rateStatusFilter !== "all" ? rateStatusFilter : undefined
            });
            setItems(res.items || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load items");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [rateStatusFilter]);

    // Client-side search & status filtering for responsive responsiveness
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch =
                !searchQuery ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.preferred_vendor && item.preferred_vendor.toLowerCase().includes(searchQuery.toLowerCase()));

            const currentStatus = (item.rate_status || item.rateStatus || "active").toLowerCase();
            const matchesStatus = rateStatusFilter === "all" || currentStatus === rateStatusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [items, searchQuery, rateStatusFilter]);

    // Paginate
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredItems.slice(start, start + pageSize);
    }, [filteredItems, currentPage, pageSize]);

    const formatMoney = (val: number | null | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
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

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            await deleteCostingItem(itemId);
            setItems((prev) => prev.filter((i) => i.id !== itemId));
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete item");
        }
    };

    const handleDuplicateItem = async (itemId: string) => {
        try {
            await duplicateCostingItem(itemId);
            await loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to duplicate item");
        }
    };

    const existingVendors = Array.from(
        new Set(
            items
                .map((i) => i.preferredVendor || i.vendor || i.preferred_vendor)
                .filter(Boolean) as string[]
        )
    );

    return (
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Toolbar: Search, Filter, Import Excel, + New Item */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            padding: "0 12px"
                        }}
                    >
                        <Search size={16} color="#6b7280" />
                        <input
                            placeholder="Search item, code, vendor..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={{ border: "none", outline: "none", padding: "8px", fontSize: "14px", width: "240px" }}
                        />
                    </label>
                    <CostingFilterPopover
                        currentStatus={rateStatusFilter}
                        onApply={({ status }) => {
                            setRateStatusFilter(status);
                            setCurrentPage(1);
                        }}
                        onReset={() => {
                            setRateStatusFilter("all");
                            setCurrentPage(1);
                        }}
                    />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={() => setIsImportOpen(true)}
                        style={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            padding: "8px 16px",
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
                        onClick={() => setShowAddModal(true)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            padding: "8px 18px",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "13px",
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(37,99,235,0.2)"
                        }}
                    >
                        <Plus size={16} /> New Item
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: "16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #fecaca" }}>
                    <span>{error}</span>
                    <button onClick={loadData} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            )}

            {/* Table Container */}
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px", minWidth: "980px" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>ITEM</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>CATEGORY</th>
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
                            {loading ? (
                                <tr>
                                    <td colSpan={10} style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                                        <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 8px", display: "block", color: "#3b82f6" }} />
                                        Loading items...
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={10} style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
                                        <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>No items found</div>
                                        <p style={{ margin: "0 0 16px 0", fontSize: "13.5px", color: "#94a3b8" }}>
                                            {searchQuery || rateStatusFilter !== "all" ? "No items match your filters." : "Get started by adding items or importing from Excel."}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(true)}
                                            style={{
                                                background: "#2563eb",
                                                color: "#ffffff",
                                                border: "none",
                                                padding: "9px 20px",
                                                borderRadius: "8px",
                                                fontWeight: 600,
                                                fontSize: "13.5px",
                                                cursor: "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}
                                        >
                                            <Plus size={16} /> Add Your First Item
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((item) => {
                                    const base = Number(item.baseCost ?? item.base_cost ?? 0);
                                    const selling = Number(item.sellingRate ?? item.selling_rate ?? 0);
                                    const marginVal = selling > 0 ? ((selling - base) / selling) * 100 : 0;
                                    const vendorName = item.preferredVendor || item.vendor || item.preferred_vendor || "-";
                                    const itemImage = item.imageUrl || item.image_url;

                                    return (
                                        <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }} className="hover:bg-gray-50">
                                            {/* Item */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    {itemImage ? (
                                                        <img
                                                            src={itemImage}
                                                            alt=""
                                                            style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: "36px", height: "36px", background: "#eff6ff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", fontWeight: 700, fontSize: "13px" }}>
                                                            {item.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>{item.name}</div>
                                                        <div style={{ color: "#94a3b8", fontSize: "12px" }}>{item.code || "-"}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td style={{ padding: "14px 16px", color: "#334155" }}>
                                                {item.category || item.category_id || "-"}
                                            </td>

                                            {/* Unit */}
                                            <td style={{ padding: "14px 16px", color: "#475569" }}>{item.unit || "Nos"}</td>

                                            {/* Base Cost */}
                                            <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 500 }}>{formatMoney(base)}</td>

                                            {/* Selling Rate */}
                                            <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 500 }}>{formatMoney(selling)}</td>

                                            {/* Margin */}
                                            <td style={{ padding: "14px 16px", color: marginVal >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                                                {marginVal.toFixed(1)}%
                                            </td>

                                            {/* Vendor */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                                                    {vendorName !== "-" && (
                                                        <div style={{ width: "22px", height: "22px", background: "#e2e8f0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                                                            {vendorName.slice(0, 1).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span>{vendorName}</span>
                                                </div>
                                            </td>

                                            {/* Rate Status Dropdown */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <RateStatusDropdown
                                                    itemId={item.id}
                                                    currentStatus={item.rate_status || item.rateStatus || "active"}
                                                    onStatusChange={(newStatus) => {
                                                        setItems((prev) =>
                                                            prev.map((i) => (i.id === item.id ? { ...i, rate_status: newStatus, rateStatus: newStatus } : i))
                                                        );
                                                    }}
                                                />
                                            </td>

                                            {/* Updated */}
                                            <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>
                                                {formatDate(item.updated_at || item.updatedAt)}
                                            </td>

                                            {/* Action More Menu */}
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

                {/* Pagination */}
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

            {/* Add Item Modal */}
            <AddItemModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    void loadData();
                }}
                existingVendors={existingVendors}
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
