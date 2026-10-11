"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    ChevronRight,
    Search,
    MoreHorizontal,
    Folder,
    GripVertical,
    FileDown,
    Loader2,
    AlertCircle,
    ChevronLeft,
} from "lucide-react";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import ReviewBoqModal from "@/components/client/ReviewBoqModal";
import {
    listClientBoqs,
    getClientBoq,
    type ClientBoqListItem,
    type ClientBoqDetail,
    type ClientBoqRoom,
    type ClientBoqCategory,
} from "@/lib/api/client";

function formatMoney(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(value);
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-IN").format(value);
}

function getStatusBadgeStyle(statusStr?: string) {
    const s = (statusStr || "").toLowerCase().replace(/[-_]/g, " ");
    if (s.includes("approved")) {
        return {
            bg: "#dcfce7",
            color: "#15803d",
            label: "APPROVED",
        };
    }
    if (s.includes("revision") || s.includes("changes")) {
        return {
            bg: "#fef3c7",
            color: "#b45309",
            label: "REVISION REQUESTED",
        };
    }
    if (s.includes("reject")) {
        return {
            bg: "#fee2e2",
            color: "#dc2626",
            label: "REJECTED",
        };
    }
    return {
        bg: "#cbd5e1",
        color: "#334155",
        label: "YET TO APPROVE",
    };
}

export default function ClientBoqPage() {
    // Screen flow: "list" -> "detail" (room overview) -> "category_items" (room items by category)
    const [screen, setScreen] = useState<"list" | "detail" | "category_items">("list");
    const [boqs, setBoqs] = useState<ClientBoqListItem[]>([]);
    const [selectedBoq, setSelectedBoq] = useState<ClientBoqDetail | null>(null);
    const [selectedRoomIndex, setSelectedRoomIndex] = useState<number>(0);
    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number>(0);

    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // List filters
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(12);
    const [total, setTotal] = useState(0);
    const [pendingApprovals, setPendingApprovals] = useState(0);

    // Room table search (Screenshot 2)
    const [roomSearch, setRoomSearch] = useState("");

    // Category items pagination (Screenshot 3)
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [itemPageIndex, setItemPageIndex] = useState(1);

    // Dropdown menu state
    const [activeDropdownCardId, setActiveDropdownCardId] = useState<string | null>(null);

    // Review Modal State (Screenshots 4-7)
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewTargetBoq, setReviewTargetBoq] = useState<{
        id: string;
        boqNumber: string;
        version: string;
        totalAmount: number;
    } | null>(null);

    const loadBoqs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listClientBoqs({
                page,
                pageSize,
                search: searchQuery || undefined,
            });
            setBoqs(res.items);
            setTotal(res.total);
            setPendingApprovals(res.pendingApprovals);
        } catch (err: any) {
            setError(err.message || "Failed to load BOQs.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchQuery]);

    useEffect(() => {
        loadBoqs();
    }, [loadBoqs]);

    // Close card dropdown on window click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdownCardId(null);
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    const openBoqDetail = async (boqId: string) => {
        setDetailLoading(true);
        setError(null);
        try {
            const detail = await getClientBoq(boqId);
            setSelectedBoq(detail);
            setSelectedRoomIndex(0);
            setSelectedCategoryIndex(0);
            setItemPageIndex(1);
            setScreen("detail");
        } catch (err: any) {
            setError(err.message || "Failed to load BOQ details.");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleBackToList = () => {
        setScreen("list");
        setSelectedBoq(null);
        setRoomSearch("");
        setSelectedRoomIndex(0);
        setSelectedCategoryIndex(0);
    };

    const handleBackToDetail = () => {
        setScreen("detail");
    };

    const handleOpenReviewModal = (boqItem?: { id: string; boqNumber: string; version: string; totalAmount: number }) => {
        if (boqItem) {
            setReviewTargetBoq(boqItem);
        } else if (selectedBoq) {
            setReviewTargetBoq({
                id: selectedBoq.id,
                boqNumber: selectedBoq.boqNumber,
                version: selectedBoq.version,
                totalAmount: selectedBoq.grandTotal,
            });
        }
        setReviewModalOpen(true);
    };

    const handleDecisionSuccess = async (newStatus: string) => {
        // Refresh list
        loadBoqs();
        // If viewing detail, reload selectedBoq
        if (selectedBoq && reviewTargetBoq && selectedBoq.id === reviewTargetBoq.id) {
            try {
                const refreshed = await getClientBoq(selectedBoq.id);
                setSelectedBoq(refreshed);
            } catch {
                // Ignore error
            }
        }
    };

    // Current room and category for Screen 3
    const selectedRoom: ClientBoqRoom | undefined = selectedBoq?.rooms?.[selectedRoomIndex];
    const selectedCategory: ClientBoqCategory | undefined = selectedRoom?.categories?.[selectedCategoryIndex];

    // Filtered rooms for Screen 2
    const filteredRooms = useMemo(() => {
        if (!selectedBoq?.rooms) return [];
        if (!roomSearch.trim()) return selectedBoq.rooms;
        const q = roomSearch.toLowerCase();
        return selectedBoq.rooms.filter(
            (r) =>
                r.name.toLowerCase().includes(q) ||
                (r.description && r.description.toLowerCase().includes(q)) ||
                r.categories.some((c) => c.name.toLowerCase().includes(q))
        );
    }, [selectedBoq, roomSearch]);

    // Paginated category items for Screen 3
    const allCategoryItems = selectedCategory?.items || [];
    const totalCategoryItemsCount = allCategoryItems.length;
    const totalCategoryPages = Math.max(1, Math.ceil(totalCategoryItemsCount / itemsPerPage));
    const paginatedItems = useMemo(() => {
        const start = (itemPageIndex - 1) * itemsPerPage;
        return allCategoryItems.slice(start, start + itemsPerPage);
    }, [allCategoryItems, itemPageIndex, itemsPerPage]);

    // Category summary totals for Screen 3
    const categoryTotalQty = useMemo(() => {
        return allCategoryItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    }, [allCategoryItems]);

    const categoryTotalAmount = useMemo(() => {
        return allCategoryItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    }, [allCategoryItems]);

    return (
        <main className="fig-dashboard boq-dashboard" style={{ backgroundColor: "#e9edf5", minHeight: "100vh" }}>
            <div className="fig-dashboard-glow" />

            {/* Left Nav Rail */}
            <ClientDashboardRail current="/client/boq" />

            <div className="fig-dashboard-main" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                {/* Header matching Screenshot 1-3 */}
                <DashboardHeader
                    title="BOQ"
                    hideNew={true}
                    onSearch={(q) => {
                        setSearchQuery(q);
                        setPage(1);
                    }}
                />

                {detailLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                        <Loader2 className="animate-spin" size={40} color="#2563EB" />
                    </div>
                ) : screen === "category_items" && selectedBoq && selectedRoom && selectedCategory ? (
                    /* ========================================================================= */
                    /* SCREEN 3: Room / Category / Item Details (Screenshot 3)                    */
                    /* ========================================================================= */
                    <section style={{ padding: "20px 32px 40px 32px", flex: 1 }}>
                        {/* Breadcrumbs: Bill of Quantities > BOQ-0071 > Master Bedroom */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "20px",
                                fontSize: "14px",
                                color: "#64748b",
                            }}
                        >
                            <button
                                type="button"
                                onClick={handleBackToList}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#64748b",
                                    cursor: "pointer",
                                    padding: 0,
                                    fontSize: "14px",
                                }}
                            >
                                Bill of Quantities
                            </button>
                            <ChevronRight size={14} color="#94a3b8" />
                            <button
                                type="button"
                                onClick={handleBackToDetail}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#64748b",
                                    cursor: "pointer",
                                    padding: 0,
                                    fontSize: "14px",
                                }}
                            >
                                {selectedBoq.boqNumber}
                            </button>
                            <ChevronRight size={14} color="#94a3b8" />
                            <span style={{ color: "#0f172a", fontWeight: 700 }}>{selectedRoom.name}</span>
                        </div>

                        {/* 2-Column Layout */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "240px 1fr",
                                gap: "20px",
                                alignItems: "start",
                            }}
                        >
                            {/* Left Panel: Category Navigation */}
                            <div
                                style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "14px",
                                    border: "1px solid #e2e8f0",
                                    padding: "20px 16px",
                                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                                }}
                            >
                                <h3
                                    style={{
                                        margin: "0 0 16px 0",
                                        fontSize: "15px",
                                        fontWeight: 700,
                                        color: "#0f172a",
                                        paddingBottom: "12px",
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    {selectedRoom.name}
                                </h3>

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {selectedRoom.categories.map((cat, idx) => {
                                        const isActive = idx === selectedCategoryIndex;
                                        return (
                                            <button
                                                key={cat.id || idx}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCategoryIndex(idx);
                                                    setItemPageIndex(1);
                                                }}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    padding: "10px 12px",
                                                    borderRadius: "8px",
                                                    border: "none",
                                                    backgroundColor: isActive ? "#eff6ff" : "transparent",
                                                    color: isActive ? "#2563eb" : "#334155",
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                    width: "100%",
                                                    transition: "background 0.15s ease",
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <Folder size={16} color={isActive ? "#2563eb" : "#94a3b8"} />
                                                    <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 500 }}>
                                                        {cat.name}
                                                    </span>
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: "11px",
                                                        padding: "2px 8px",
                                                        borderRadius: "999px",
                                                        backgroundColor: isActive ? "#dbeafe" : "#f1f5f9",
                                                        color: isActive ? "#1e40af" : "#64748b",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Item {cat.items.length}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Panel: Items Table */}
                            <div
                                style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "14px",
                                    border: "1px solid #e2e8f0",
                                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                {/* Header */}
                                <div style={{ padding: "20px 24px 16px 24px" }}>
                                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
                                        {selectedCategory.name}
                                    </h2>
                                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                                        {selectedRoom.name} · BOQ Section
                                    </p>
                                </div>

                                {/* Table */}
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#eaf0f9", borderBottom: "1px solid #dbeafe" }}>
                                                <th style={{ width: "32px", padding: "12px 8px", textAlign: "center" }}></th>
                                                <th style={{ width: "40px", padding: "12px 10px", textAlign: "center", fontSize: "12px", color: "#475569", fontWeight: 600 }}>#</th>
                                                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#475569", fontWeight: 600 }}>ITEM</th>
                                                <th style={{ width: "80px", padding: "12px 12px", textAlign: "left", fontSize: "12px", color: "#475569", fontWeight: 600 }}>UNIT</th>
                                                <th style={{ width: "70px", padding: "12px 12px", textAlign: "right", fontSize: "12px", color: "#475569", fontWeight: 600 }}>QTY</th>
                                                <th style={{ width: "110px", padding: "12px 12px", textAlign: "right", fontSize: "12px", color: "#475569", fontWeight: 600 }}>RATE (₹)</th>
                                                <th style={{ width: "90px", padding: "12px 12px", textAlign: "right", fontSize: "12px", color: "#475569", fontWeight: 600 }}>WASTE (%)</th>
                                                <th style={{ width: "80px", padding: "12px 12px", textAlign: "right", fontSize: "12px", color: "#475569", fontWeight: 600 }}>TAX (%)</th>
                                                <th style={{ width: "120px", padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "#475569", fontWeight: 600 }}>AMOUNT(₹)</th>
                                                <th style={{ width: "40px", padding: "12px 8px", textAlign: "center" }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={10} style={{ padding: "36px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                                                        No items found in this category.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedItems.map((item, idx) => {
                                                    const rowNum = (itemPageIndex - 1) * itemsPerPage + idx + 1;
                                                    return (
                                                        <tr
                                                            key={item.id || idx}
                                                            style={{
                                                                borderBottom: "1px solid #f1f5f9",
                                                                transition: "background 0.15s ease",
                                                            }}
                                                        >
                                                            <td style={{ textAlign: "center", padding: "14px 4px", color: "#cbd5e1" }}>
                                                                <GripVertical size={14} />
                                                            </td>
                                                            <td style={{ textAlign: "center", padding: "14px 10px", fontSize: "13px", color: "#64748b" }}>
                                                                {rowNum}
                                                            </td>
                                                            <td style={{ padding: "14px 16px" }}>
                                                                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                                                                    {item.name}
                                                                </div>
                                                                {item.description && (
                                                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                                                        {item.description}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: "14px 12px", fontSize: "13px", color: "#64748b" }}>
                                                                {item.unit || "Nos"}
                                                            </td>
                                                            <td style={{ padding: "14px 12px", textAlign: "right", fontSize: "13px", color: "#0f172a", fontWeight: 500 }}>
                                                                {item.quantity}
                                                            </td>
                                                            <td style={{ padding: "14px 12px", textAlign: "right", fontSize: "13px", color: "#0f172a", fontWeight: 600 }}>
                                                                {Number(item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                            <td style={{ padding: "14px 12px", textAlign: "right", fontSize: "13px", color: "#64748b" }}>
                                                                {item.wastePercent != null ? `${item.wastePercent}%` : "0%"}
                                                            </td>
                                                            <td style={{ padding: "14px 12px", textAlign: "right", fontSize: "13px", color: "#64748b" }}>
                                                                {item.taxPercent != null ? `${item.taxPercent}%` : "18%"}
                                                            </td>
                                                            <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "13px", color: "#16a34a", fontWeight: 600 }}>
                                                                {Number(item.amount).toLocaleString("en-IN")}
                                                            </td>
                                                            <td style={{ textAlign: "center", padding: "14px 8px", color: "#94a3b8" }}>
                                                                <button
                                                                    type="button"
                                                                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
                                                                >
                                                                    <MoreHorizontal size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Table Footer Summary Row */}
                                <div
                                    style={{
                                        backgroundColor: "#eff6ff",
                                        padding: "14px 24px",
                                        display: "grid",
                                        gridTemplateColumns: "1fr 140px 180px",
                                        alignItems: "center",
                                        borderTop: "1px solid #dbeafe",
                                    }}
                                >
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e3a8a", textTransform: "uppercase" }}>
                                        TOTAL ({totalCategoryItemsCount} ITEMS)
                                    </div>
                                    <div style={{ textAlign: "right", fontSize: "13px", fontWeight: 700, color: "#1e3a8a" }}>
                                        {formatNumber(categoryTotalQty)}
                                    </div>
                                    <div style={{ textAlign: "right", fontSize: "14px", fontWeight: 700, color: "#1e3a8a" }}>
                                        ₹{formatNumber(categoryTotalAmount)}
                                    </div>
                                </div>

                                {/* Pagination and Page size */}
                                <div
                                    style={{
                                        padding: "16px 24px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        borderTop: "1px solid #f1f5f9",
                                        fontSize: "13px",
                                        color: "#64748b",
                                    }}
                                >
                                    <div>Total Items: {totalCategoryItemsCount}</div>

                                    {/* Pagination Controls */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <button
                                            type="button"
                                            disabled={itemPageIndex <= 1}
                                            onClick={() => setItemPageIndex((p) => Math.max(1, p - 1))}
                                            style={{
                                                padding: "4px 8px",
                                                borderRadius: "6px",
                                                border: "1px solid #e2e8f0",
                                                background: "#ffffff",
                                                cursor: itemPageIndex <= 1 ? "not-allowed" : "pointer",
                                                opacity: itemPageIndex <= 1 ? 0.5 : 1,
                                            }}
                                        >
                                            <ChevronLeft size={14} />
                                        </button>

                                        {Array.from({ length: totalCategoryPages }, (_, i) => i + 1).map((pNum) => (
                                            <button
                                                key={pNum}
                                                type="button"
                                                onClick={() => setItemPageIndex(pNum)}
                                                style={{
                                                    width: "28px",
                                                    height: "28px",
                                                    borderRadius: "6px",
                                                    border: pNum === itemPageIndex ? "1px solid #2563eb" : "1px solid #e2e8f0",
                                                    backgroundColor: pNum === itemPageIndex ? "#eff6ff" : "#ffffff",
                                                    color: pNum === itemPageIndex ? "#2563eb" : "#334155",
                                                    fontWeight: pNum === itemPageIndex ? 700 : 500,
                                                    fontSize: "12px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {pNum}
                                            </button>
                                        ))}

                                        <button
                                            type="button"
                                            disabled={itemPageIndex >= totalCategoryPages}
                                            onClick={() => setItemPageIndex((p) => Math.min(totalCategoryPages, p + 1))}
                                            style={{
                                                padding: "4px 8px",
                                                borderRadius: "6px",
                                                border: "1px solid #e2e8f0",
                                                background: "#ffffff",
                                                cursor: itemPageIndex >= totalCategoryPages ? "not-allowed" : "pointer",
                                                opacity: itemPageIndex >= totalCategoryPages ? 0.5 : 1,
                                            }}
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>

                                    {/* Show per page */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span>Show per Page:</span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setItemPageIndex(1);
                                            }}
                                            style={{
                                                padding: "4px 8px",
                                                borderRadius: "6px",
                                                border: "1px solid #cbd5e1",
                                                fontSize: "12px",
                                                color: "#334155",
                                                outline: "none",
                                                background: "#ffffff",
                                            }}
                                        >
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : screen === "detail" && selectedBoq ? (
                    /* ========================================================================= */
                    /* SCREEN 2: Individual BOQ Overview (Screenshot 2)                          */
                    /* ========================================================================= */
                    <section style={{ padding: "20px 32px 40px 32px", flex: 1 }}>
                        {/* Breadcrumbs */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "16px",
                                fontSize: "14px",
                                color: "#64748b",
                            }}
                        >
                            <button
                                type="button"
                                onClick={handleBackToList}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#64748b",
                                    cursor: "pointer",
                                    padding: 0,
                                    fontSize: "14px",
                                }}
                            >
                                Bill of Quantities
                            </button>
                            <ChevronRight size={14} color="#94a3b8" />
                            <span style={{ color: "#0f172a", fontWeight: 700 }}>{selectedBoq.boqNumber}</span>
                        </div>

                        {/* Top BOQ Header Card */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "24px",
                                flexWrap: "wrap",
                                gap: "16px",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                                <button
                                    type="button"
                                    onClick={handleBackToList}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "4px",
                                        color: "#0f172a",
                                        display: "flex",
                                        alignItems: "center",
                                        marginTop: "4px",
                                    }}
                                >
                                    <ArrowLeft size={22} />
                                </button>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>
                                            {selectedBoq.boqNumber}
                                        </h1>
                                        {(() => {
                                            const badge = getStatusBadgeStyle(selectedBoq.decisionStatus || selectedBoq.status);
                                            return (
                                                <span
                                                    style={{
                                                        padding: "4px 10px",
                                                        borderRadius: "999px",
                                                        backgroundColor: badge.bg,
                                                        color: badge.color,
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        letterSpacing: "0.04em",
                                                    }}
                                                >
                                                    {badge.label}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                                        {selectedBoq.projectName} - {selectedBoq.version}
                                    </div>
                                </div>
                            </div>

                            {/* Top Right Actions */}
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => window.open(`/api/v1/client/boqs/${selectedBoq.id}/pdf`, "_blank")}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "8px",
                                        padding: "8px 16px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#334155",
                                        cursor: "pointer",
                                    }}
                                >
                                    <FileDown size={15} /> Export PDF
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleOpenReviewModal()}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        backgroundColor: "#2563eb",
                                        border: "none",
                                        borderRadius: "8px",
                                        padding: "8px 18px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#ffffff",
                                        cursor: "pointer",
                                    }}
                                >
                                    Approve BOQ
                                </button>
                            </div>
                        </div>

                        {/* Main Grid: Left Rooms Table & Right Summary Panel */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 340px",
                                gap: "24px",
                                alignItems: "start",
                            }}
                        >
                            {/* Left Rooms Table Container */}
                            <div
                                style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "14px",
                                    border: "1px solid #e2e8f0",
                                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                                    overflow: "hidden",
                                }}
                            >
                                {/* Header with Room count and Search */}
                                <div
                                    style={{
                                        padding: "16px 20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                                        {selectedBoq.rooms.length} Rooms
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            backgroundColor: "#f8fafc",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "8px",
                                            padding: "6px 12px",
                                            width: "220px",
                                        }}
                                    >
                                        <Search size={15} color="#94a3b8" style={{ marginRight: "8px" }} />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={roomSearch}
                                            onChange={(e) => setRoomSearch(e.target.value)}
                                            style={{
                                                border: "none",
                                                outline: "none",
                                                backgroundColor: "transparent",
                                                width: "100%",
                                                fontSize: "13px",
                                                color: "#0f172a",
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Rooms Table */}
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#eaf0f9", borderBottom: "1px solid #dbeafe" }}>
                                                <th style={{ width: "40px", padding: "12px 10px", textAlign: "center", fontSize: "12px", color: "#475569", fontWeight: 600 }}>#</th>
                                                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#475569", fontWeight: 600 }}>ROOM</th>
                                                <th style={{ width: "80px", padding: "12px 12px", textAlign: "center", fontSize: "12px", color: "#475569", fontWeight: 600 }}>CATEGORY</th>
                                                <th style={{ width: "130px", padding: "12px 12px", textAlign: "left", fontSize: "12px", color: "#475569", fontWeight: 600 }}>SPEC</th>
                                                <th style={{ width: "70px", padding: "12px 12px", textAlign: "left", fontSize: "12px", color: "#475569", fontWeight: 600 }}>UNIT</th>
                                                <th style={{ width: "70px", padding: "12px 12px", textAlign: "center", fontSize: "12px", color: "#475569", fontWeight: 600 }}>ITEMS</th>
                                                <th style={{ width: "120px", padding: "12px 12px", textAlign: "right", fontSize: "12px", color: "#475569", fontWeight: 600 }}>AMOUNT (₹)</th>
                                                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#475569", fontWeight: 600 }}>DESCRIPTION</th>
                                                <th style={{ width: "40px", padding: "12px 8px", textAlign: "center" }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRooms.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                                                        No rooms match your search.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredRooms.map((room, idx) => {
                                                    const roomItemsCount = room.categories.reduce((acc, c) => acc + c.items.length, 0);
                                                    const roomAmount = room.categories.reduce(
                                                        (acc, c) => acc + c.items.reduce((iAcc, it) => iAcc + (Number(it.amount) || 0), 0),
                                                        0
                                                    );
                                                    const firstItem = room.categories[0]?.items[0];
                                                    const specLabel = firstItem?.description || room.description || "Custom specifications";
                                                    const unitLabel = firstItem?.unit || "No";

                                                    return (
                                                        <tr
                                                            key={room.id || idx}
                                                            onClick={() => {
                                                                const actualIndex = selectedBoq.rooms.findIndex((r) => r.id === room.id);
                                                                setSelectedRoomIndex(actualIndex >= 0 ? actualIndex : idx);
                                                                setSelectedCategoryIndex(0);
                                                                setItemPageIndex(1);
                                                                setScreen("category_items");
                                                            }}
                                                            style={{
                                                                borderBottom: "1px solid #f1f5f9",
                                                                cursor: "pointer",
                                                                transition: "background 0.15s ease",
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = "#f8faff";
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = "transparent";
                                                            }}
                                                        >
                                                            <td style={{ textAlign: "center", padding: "16px 10px", fontSize: "13px", color: "#64748b" }}>
                                                                {idx + 1}
                                                            </td>
                                                            <td style={{ padding: "16px", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                                                                {room.name}
                                                            </td>
                                                            <td style={{ textAlign: "center", padding: "16px 12px", fontSize: "13px", color: "#334155" }}>
                                                                {room.categories.length}
                                                            </td>
                                                            <td style={{ padding: "16px 12px", fontSize: "13px", color: "#64748b" }}>
                                                                {specLabel.length > 20 ? `${specLabel.slice(0, 20)}...` : specLabel}
                                                            </td>
                                                            <td style={{ padding: "16px 12px", fontSize: "13px", color: "#64748b" }}>
                                                                {unitLabel}
                                                            </td>
                                                            <td style={{ textAlign: "center", padding: "16px 12px", fontSize: "13px", color: "#334155" }}>
                                                                {roomItemsCount}
                                                            </td>
                                                            <td style={{ textAlign: "right", padding: "16px 12px", fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                                                                ₹{formatNumber(roomAmount)}
                                                            </td>
                                                            <td style={{ padding: "16px", fontSize: "13px", color: "#64748b" }}>
                                                                {room.description || (firstItem ? `${firstItem.name} with specifications` : "Standard room finish")}
                                                            </td>
                                                            <td style={{ textAlign: "center", padding: "16px 8px", color: "#94a3b8" }}>
                                                                <MoreHorizontal size={16} />
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right Summary Panel (Screenshot 2) */}
                            <div
                                style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "14px",
                                    border: "1px solid #e2e8f0",
                                    padding: "24px",
                                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#64748b",
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    SUMMARY
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                                        <span>Subtotal</span>
                                        <span style={{ color: "#0f172a", fontWeight: 600 }}>{formatMoney(selectedBoq.subtotal)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                                        <span>Markup ({selectedBoq.markupPercent}%)</span>
                                        <span style={{ color: "#0f172a", fontWeight: 600 }}>{formatMoney(selectedBoq.markupAmount)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                                        <span>GST ({selectedBoq.taxPercent}%)</span>
                                        <span style={{ color: "#0f172a", fontWeight: 600 }}>{formatMoney(selectedBoq.taxAmount)}</span>
                                    </div>

                                    <div style={{ borderTop: "1px solid #f1f5f9", margin: "6px 0" }} />

                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 700 }}>
                                        <span style={{ color: "#0f172a" }}>Grand Total</span>
                                        <span style={{ color: "#0f172a" }}>{formatMoney(selectedBoq.grandTotal)}</span>
                                    </div>
                                </div>

                                {/* Metric Box 1: Rooms Covered */}
                                <div
                                    style={{
                                        backgroundColor: "#f8fafc",
                                        borderRadius: "10px",
                                        padding: "16px 20px",
                                        border: "1px solid #f1f5f9",
                                        marginTop: "8px",
                                    }}
                                >
                                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Rooms Covered</div>
                                    <div style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                                        {selectedBoq.roomsCovered ?? selectedBoq.rooms.length}
                                    </div>
                                </div>

                                {/* Metric Box 2: Total Items */}
                                <div
                                    style={{
                                        backgroundColor: "#f8fafc",
                                        borderRadius: "10px",
                                        padding: "16px 20px",
                                        border: "1px solid #f1f5f9",
                                    }}
                                >
                                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Items</div>
                                    <div style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                                        {selectedBoq.totalItems ??
                                            selectedBoq.rooms.reduce(
                                                (acc, r) => acc + r.categories.reduce((cAcc, c) => cAcc + c.items.length, 0),
                                                0
                                            )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : (
                    /* ========================================================================= */
                    /* SCREEN 1: Client BOQ Listing Overview (Screenshot 1)                      */
                    /* ========================================================================= */
                    <section style={{ padding: "24px 32px 48px 32px", flex: 1 }}>
                        {/* Title and summary header matching Screenshot 1 */}
                        <div style={{ marginBottom: "24px" }}>
                            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>
                                Bill of Quantities
                            </h1>
                            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
                                {total} BOQs | {pendingApprovals} pending approval
                            </p>
                        </div>

                        {/* Error state */}
                        {error && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "14px 18px",
                                    backgroundColor: "#fef2f2",
                                    border: "1px solid #fecaca",
                                    borderRadius: "10px",
                                    color: "#b91c1c",
                                    fontSize: "14px",
                                    marginBottom: "20px",
                                }}
                            >
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        {loading ? (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
                                <Loader2 className="animate-spin" size={36} color="#2563EB" />
                            </div>
                        ) : boqs.length === 0 ? (
                            <div
                                style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "14px",
                                    border: "1px solid #e2e8f0",
                                    padding: "60px 24px",
                                    textAlign: "center",
                                }}
                            >
                                <p style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                                    No BOQs available
                                </p>
                                <p style={{ fontSize: "14px", color: "#64748b", margin: "6px 0 0 0" }}>
                                    You do not currently have any BOQs assigned or shared for review.
                                </p>
                            </div>
                        ) : (
                            /* Responsive 3-Column Grid of BOQ Cards */
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                                    gap: "20px",
                                }}
                            >
                                {boqs.map((item) => {
                                    const badge = getStatusBadgeStyle(item.decisionStatus || item.status);
                                    const progressVal = item.progress ?? 68;

                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                backgroundColor: "#ffffff",
                                                borderRadius: "14px",
                                                border: "1px solid #e2e8f0",
                                                padding: "20px 22px",
                                                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "18px",
                                                position: "relative",
                                                cursor: "pointer",
                                                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                                            }}
                                            onClick={() => openBoqDetail(item.id)}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = "0 6px 16px -2px rgba(0, 0, 0, 0.08)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = "0 1px 3px 0 rgba(0, 0, 0, 0.05)";
                                            }}
                                        >
                                            {/* Card Top Row: BOQ Number, Status Pill, Three-dot Menu */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                                                    {item.boqNumber}
                                                </div>

                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span
                                                        style={{
                                                            padding: "3px 9px",
                                                            borderRadius: "999px",
                                                            backgroundColor: badge.bg,
                                                            color: badge.color,
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                            letterSpacing: "0.04em",
                                                        }}
                                                    >
                                                        {badge.label}
                                                    </span>

                                                    {/* Three-dot Action Menu */}
                                                    <div
                                                        style={{ position: "relative" }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveDropdownCardId(
                                                                    activeDropdownCardId === item.id ? null : item.id
                                                                );
                                                            }}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                color: "#94a3b8",
                                                                cursor: "pointer",
                                                                padding: "4px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <MoreHorizontal size={18} />
                                                        </button>

                                                        {activeDropdownCardId === item.id && (
                                                            <div
                                                                style={{
                                                                    position: "absolute",
                                                                    right: 0,
                                                                    top: "26px",
                                                                    backgroundColor: "#ffffff",
                                                                    border: "1px solid #e2e8f0",
                                                                    borderRadius: "10px",
                                                                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                                                                    zIndex: 50,
                                                                    minWidth: "150px",
                                                                    padding: "6px 0",
                                                                }}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setActiveDropdownCardId(null);
                                                                        openBoqDetail(item.id);
                                                                    }}
                                                                    style={{
                                                                        width: "100%",
                                                                        textAlign: "left",
                                                                        padding: "8px 14px",
                                                                        background: "none",
                                                                        border: "none",
                                                                        fontSize: "13px",
                                                                        color: "#334155",
                                                                        cursor: "pointer",
                                                                    }}
                                                                >
                                                                    View BOQ
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setActiveDropdownCardId(null);
                                                                        window.open(`/api/v1/client/boqs/${item.id}/pdf`, "_blank");
                                                                    }}
                                                                    style={{
                                                                        width: "100%",
                                                                        textAlign: "left",
                                                                        padding: "8px 14px",
                                                                        background: "none",
                                                                        border: "none",
                                                                        fontSize: "13px",
                                                                        color: "#334155",
                                                                        cursor: "pointer",
                                                                    }}
                                                                >
                                                                    Export PDF
                                                                </button>
                                                                {badge.label !== "APPROVED" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setActiveDropdownCardId(null);
                                                                            handleOpenReviewModal({
                                                                                id: item.id,
                                                                                boqNumber: item.boqNumber,
                                                                                version: item.version,
                                                                                totalAmount: item.grandTotal,
                                                                            });
                                                                        }}
                                                                        style={{
                                                                            width: "100%",
                                                                            textAlign: "left",
                                                                            padding: "8px 14px",
                                                                            background: "none",
                                                                            border: "none",
                                                                            fontSize: "13px",
                                                                            color: "#2563eb",
                                                                            fontWeight: 600,
                                                                            cursor: "pointer",
                                                                        }}
                                                                    >
                                                                        Review BOQ
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Metadata 2x3 Grid (Screenshot 1) */}
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "1.2fr 1fr 1fr",
                                                    rowGap: "14px",
                                                    columnGap: "12px",
                                                }}
                                            >
                                                {/* Row 1 */}
                                                <div>
                                                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                                                        Issued by
                                                    </div>
                                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                                        {item.issuedBy || "Nikhil Oberoi"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                                                        Estimated Value
                                                    </div>
                                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                                        {item.estimatedAreaValue || "3.200 sqft"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                                                        Issued Date
                                                    </div>
                                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                                        {item.date || "04 Sep 2026"}
                                                    </div>
                                                </div>

                                                {/* Row 2 */}
                                                <div>
                                                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                                                        Version
                                                    </div>
                                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                                        {item.version}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                                                        Rooms
                                                    </div>
                                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                                        {item.roomsCount}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                                                        Items
                                                    </div>
                                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                                        {item.itemsCount}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Row */}
                                            <div>
                                                <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500, marginBottom: "6px" }}>
                                                    Progress
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div
                                                        style={{
                                                            flex: 1,
                                                            height: "6px",
                                                            borderRadius: "999px",
                                                            backgroundColor: "#f1f5f9",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: `${progressVal}%`,
                                                                height: "100%",
                                                                backgroundColor: "#f97316",
                                                                borderRadius: "999px",
                                                            }}
                                                        />
                                                    </div>
                                                    <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500, minWidth: "28px" }}>
                                                        {progressVal}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}
            </div>

            {/* Review BOQ Modal (Screenshots 4-7) */}
            {reviewTargetBoq && (
                <ReviewBoqModal
                    isOpen={reviewModalOpen}
                    onClose={() => setReviewModalOpen(false)}
                    boqId={reviewTargetBoq.id}
                    boqNumber={reviewTargetBoq.boqNumber}
                    version={reviewTargetBoq.version}
                    totalAmount={reviewTargetBoq.totalAmount}
                    onSuccess={handleDecisionSuccess}
                />
            )}
        </main>
    );
}
