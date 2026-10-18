"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { getCostingItems, deleteCostingItem, duplicateCostingItem, getCostingCategories } from "@/lib/api/costing";
import type { CostingItemBackend, CostingCategoryBackend } from "@/lib/types";
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
    const [categories, setCategories] = useState<CostingCategoryBackend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Edit Item state
    const [editingItem, setEditingItem] = useState<CostingItemBackend | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Filter & Pagination states
    const [searchQuery, setSearchQuery] = useState("");
    const [rateStatusFilter, setRateStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [itemsRes, catsRes] = await Promise.all([
                getCostingItems({
                    page: 1,
                    pageSize: 500,
                    rateStatus: rateStatusFilter !== "all" ? rateStatusFilter : undefined,
                }),
                getCostingCategories({ pageSize: 100 }).catch(() => ({ items: [] })),
            ]);
            setItems(itemsRes.items || []);
            setCategories(catsRes.items || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load costing items");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [rateStatusFilter]);

    // Fast client-side search & status & category filtering
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch =
                !query ||
                item.name.toLowerCase().includes(query) ||
                (item.code && item.code.toLowerCase().includes(query)) ||
                (item.category && item.category.toLowerCase().includes(query)) ||
                (item.preferred_vendor && item.preferred_vendor.toLowerCase().includes(query)) ||
                (item.preferredVendor && item.preferredVendor.toLowerCase().includes(query)) ||
                (item.vendor && item.vendor.toLowerCase().includes(query));

            const currentStatus = (item.rate_status || item.rateStatus || "active").toLowerCase();
            const matchesStatus =
                rateStatusFilter === "all" ||
                currentStatus === rateStatusFilter.toLowerCase() ||
                (rateStatusFilter === "active" && currentStatus === "approved");

            const matchesCategory =
                categoryFilter === "all" ||
                item.category_id === categoryFilter ||
                (item.category && item.category.toLowerCase().includes(categoryFilter.toLowerCase()));

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [items, searchQuery, rateStatusFilter, categoryFilter]);

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
            return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        } catch {
            return "-";
        }
    };

    // Category hierarchy parser for two-line Figma cell
    const parseCategory = (item: CostingItemBackend) => {
        const catStr = item.category || item.categoryName;
        if (catStr && catStr.includes(" > ")) {
            const [parent, sub] = catStr.split(" > ");
            return { primary: parent.trim(), sub: `> ${sub.trim()}` };
        }
        if (catStr) {
            return { primary: catStr, sub: null };
        }
        if (item.category_id) {
            const found = categories.find((c) => c.id === item.category_id);
            if (found) {
                if (found.parent_id) {
                    const parent = categories.find((c) => c.id === found.parent_id);
                    return { primary: parent?.name || found.name, sub: `> ${found.name}` };
                }
                return { primary: found.name, sub: null };
            }
        }
        return { primary: "-", sub: null };
    };

    // Real Item Type badge text
    const getItemType = (item: CostingItemBackend) => {
        const rawType = (item as unknown as Record<string, unknown>).type;
        if (rawType && typeof rawType === "string") return rawType.toUpperCase();
        const code = (item.code || "").toUpperCase();
        if (code.startsWith("LAB")) return "LABOUR";
        if (code.startsWith("TRP")) return "TRANSPORT";
        if (code.startsWith("ELE")) return "ELECTRICAL";
        if (code.startsWith("FUR")) return "FURNITURE";
        if (code.startsWith("MAT")) return "MATERIAL";
        const status = (item.rate_status || item.rateStatus || "active").toUpperCase();
        return status === "ACTIVE" ? "APPROVED" : status;
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Are you sure you want to delete this costing item?")) return;
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

    const handleEditItem = (item: CostingItemBackend) => {
        setEditingItem(item);
        setIsEditOpen(true);
    };

    const existingVendors = Array.from(
        new Set(
            items
                .map((i) => i.preferredVendor || i.vendor || i.preferred_vendor)
                .filter(Boolean) as string[]
        )
    );

    const categoryFilterOptions = categories.map((c) => ({
        label: c.name,
        value: c.id,
    }));

    return (
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
            {/* Toolbar: Search, Filter, + New Item (Frame 110) */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "280px", maxWidth: "600px" }}>
                    {/* Glassmorphic Search Box matching Figma Frame 76 */}
                    <div className="costing-search-box">
                        <div className="costing-search-icon-tile">
                            <Search size={16} color="#475569" />
                        </div>
                        <input
                            placeholder="Search category by name…"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="costing-search-input"
                            aria-label="Search costing items"
                        />
                    </div>

                    {/* Filter Button matching Figma */}
                    <CostingFilterPopover
                        currentStatus={rateStatusFilter}
                        categoryFilter={categoryFilter}
                        categoryOptions={categoryFilterOptions}
                        onApply={({ status, category }) => {
                            setRateStatusFilter(status);
                            if (category) setCategoryFilter(category);
                            setCurrentPage(1);
                        }}
                        onReset={() => {
                            setRateStatusFilter("all");
                            setCategoryFilter("all");
                            setCurrentPage(1);
                        }}
                    />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="costing-new-item-btn"
                    >
                        <Plus size={18} /> New Item
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: "14px 18px", background: "#FEF2F2", color: "#B91C1C", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #FECACA", fontSize: "14px", fontFamily: "'Urbanist', sans-serif" }}>
                    <span>{error}</span>
                    <button onClick={loadData} style={{ background: "none", border: "none", color: "#B91C1C", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                        <RefreshCw size={14} /> Retry
                    </button>
                </div>
            )}

            {/* Table Container (Frame 2147225069) */}
            <div className="costing-table-card">
                <div className="costing-table-wrap">
                    <table className="costing-table">
                        <thead>
                            <tr>
                                <th className="costing-th" style={{ width: "216px" }}>ITEM</th>
                                <th className="costing-th" style={{ width: "100px" }}>TYPE</th>
                                <th className="costing-th" style={{ width: "114px" }}>CATEGORY</th>
                                <th className="costing-th" style={{ width: "75px" }}>UNIT</th>
                                <th className="costing-th align-center" style={{ width: "129px" }}>BASE COST (₹)</th>
                                <th className="costing-th align-center" style={{ width: "141px" }}>SELLING RATE (₹)</th>
                                <th className="costing-th" style={{ width: "84px" }}>MARGIN</th>
                                <th className="costing-th" style={{ width: "153px" }}>PREFERRED VENDOR</th>
                                <th className="costing-th" style={{ width: "115px" }}>RATE STATUS</th>
                                <th className="costing-th" style={{ width: "100px" }}>UPDATED</th>
                                <th className="costing-th align-center" style={{ width: "64px" }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: "center", padding: "48px", color: "#64748B", fontFamily: "'Urbanist', sans-serif" }}>
                                        <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 10px", display: "block", color: "#2563EB" }} />
                                        Loading costing library...
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: "center", padding: "48px 24px", color: "#64748B", fontFamily: "'Urbanist', sans-serif" }}>
                                        <div style={{ fontSize: "16px", fontWeight: 600, color: "#0F172A", marginBottom: "6px" }}>No items found</div>
                                        <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#64748B" }}>
                                            {searchQuery || rateStatusFilter !== "all" || categoryFilter !== "all"
                                                ? "No items match your active search or filters."
                                                : "Get started by adding items or importing from Excel."}
                                        </p>
                                        {searchQuery || rateStatusFilter !== "all" || categoryFilter !== "all" ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery("");
                                                    setRateStatusFilter("all");
                                                    setCategoryFilter("all");
                                                    setCurrentPage(1);
                                                }}
                                                className="costing-import-excel-btn"
                                                style={{ display: "inline-flex", margin: "0 auto" }}
                                            >
                                                Clear Filters
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setShowAddModal(true)}
                                                className="costing-new-item-btn"
                                                style={{ display: "inline-flex", margin: "0 auto" }}
                                            >
                                                <Plus size={16} /> Add Your First Item
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((item) => {
                                    const base = Number(item.baseCost ?? item.base_cost ?? 0);
                                    const selling = Number(item.sellingRate ?? item.selling_rate ?? 0);
                                    const marginVal = selling > 0 ? ((selling - base) / selling) * 100 : 0;
                                    const vendorName = item.preferredVendor || item.vendor || item.preferred_vendor;
                                    const itemImage = item.imageUrl || item.image_url;
                                    const catInfo = parseCategory(item);
                                    const typeName = getItemType(item);

                                    return (
                                        <tr key={item.id} className="costing-tr">
                                            {/* Column 1: Item */}
                                            <td className="costing-td">
                                                <div className="costing-item-cell">
                                                    {itemImage ? (
                                                        <img
                                                            src={itemImage}
                                                            alt=""
                                                            className="costing-item-thumb"
                                                        />
                                                    ) : (
                                                        <div className="costing-item-thumb">
                                                            {item.name ? item.name.slice(0, 2).toUpperCase() : "IT"}
                                                        </div>
                                                    )}
                                                    <div className="costing-item-text-stack">
                                                        <div className="costing-item-name">{item.name}</div>
                                                        <div className="costing-item-code">{item.code || "-"}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 2: Type */}
                                            <td className="costing-td">
                                                <span
                                                    className="costing-type-pill"
                                                    style={
                                                        typeName === "DRAFT" || typeName === "PENDING"
                                                            ? { background: "rgba(100, 116, 139, 0.12)", color: "#64748B" }
                                                            : typeName === "EXPIRED"
                                                            ? { background: "rgba(220, 38, 38, 0.12)", color: "#DC2626" }
                                                            : undefined
                                                    }
                                                >
                                                    {typeName}
                                                </span>
                                            </td>

                                            {/* Column 3: Category */}
                                            <td className="costing-td">
                                                <div className="costing-category-stack">
                                                    <div className="costing-category-primary">{catInfo.primary}</div>
                                                    {catInfo.sub && (
                                                        <div className="costing-category-sub">{catInfo.sub}</div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Column 4: Unit */}
                                            <td className="costing-td">
                                                <span className="costing-unit-text">{item.unit || "Nos"}</span>
                                            </td>

                                            {/* Column 5: Base Cost (₹) */}
                                            <td className="costing-td align-center">
                                                <span className="costing-price-text">{formatMoney(base)}</span>
                                            </td>

                                            {/* Column 6: Selling Rate (₹) */}
                                            <td className="costing-td align-center">
                                                <span className="costing-price-text">{formatMoney(selling)}</span>
                                            </td>

                                            {/* Column 7: Margin */}
                                            <td className="costing-td">
                                                <span className={`costing-margin-text ${marginVal < 0 ? "is-negative" : ""}`}>
                                                    {marginVal.toFixed(2)}%
                                                </span>
                                            </td>

                                            {/* Column 8: Preferred Vendor */}
                                            <td className="costing-td">
                                                {vendorName ? (
                                                    <div className="costing-vendor-cell">
                                                        <div className="costing-vendor-avatar">
                                                            {vendorName.slice(0, 1).toUpperCase()}
                                                        </div>
                                                        <span className="costing-vendor-name">{vendorName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="costing-vendor-name">-</span>
                                                )}
                                            </td>

                                            {/* Column 9: Rate Status */}
                                            <td className="costing-td">
                                                <RateStatusDropdown
                                                    itemId={item.id}
                                                    currentStatus={item.rate_status || item.rateStatus || "active"}
                                                    onStatusChange={(newStatus) => {
                                                        setItems((prev) =>
                                                            prev.map((i) =>
                                                                i.id === item.id
                                                                    ? { ...i, rate_status: newStatus, rateStatus: newStatus }
                                                                    : i
                                                            )
                                                        );
                                                    }}
                                                />
                                            </td>

                                            {/* Column 10: Updated */}
                                            <td className="costing-td">
                                                <span className="costing-updated-text">
                                                    {formatDate(item.updated_at || item.updatedAt)}
                                                </span>
                                            </td>

                                            {/* Column 11: Actions */}
                                            <td className="costing-td align-center">
                                                <CostingMoreMenu
                                                    entityName="Item"
                                                    onEdit={() => handleEditItem(item)}
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

                {/* Pagination (Frame 2147225166) */}
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
            </div>

            {/* Add Item Modal */}
            <AddItemModal
                isOpen={showAddModal}
                itemToEdit={null}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    setShowAddModal(false);
                    void loadData();
                }}
                existingVendors={existingVendors}
            />

            {/* Edit Item Modal */}
            <AddItemModal
                isOpen={isEditOpen}
                itemToEdit={editingItem}
                onClose={() => {
                    setIsEditOpen(false);
                    setEditingItem(null);
                }}
                onSuccess={() => {
                    setIsEditOpen(false);
                    setEditingItem(null);
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
