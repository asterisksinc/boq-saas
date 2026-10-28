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
    CheckCircle2,
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
import "@/app/client/client-redesign.css";

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

function getStatusBadge(statusStr?: string) {
    const s = (statusStr || "").toLowerCase().replace(/[-_]/g, " ");
    if (s.includes("approved")) {
        return {
            className: "client-badge-success",
            statusKey: "approved",
            label: "APPROVED",
        };
    }
    if (s.includes("revision") || s.includes("changes")) {
        return {
            className: "client-badge-warning",
            statusKey: "revision-requested",
            label: "REVISION REQUESTED",
        };
    }
    if (s.includes("reject")) {
        return {
            className: "client-badge-danger",
            statusKey: "rejected",
            label: "REJECTED",
        };
    }
    if (s.includes("draft")) {
        return {
            className: "client-badge-pending",
            statusKey: "draft",
            label: "DRAFT",
        };
    }
    return {
        className: "client-badge-pending",
        statusKey: "yet-to-approve",
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

    // Room table search (Screen 2)
    const [roomSearch, setRoomSearch] = useState("");

    // Category items pagination (Screen 3)
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [itemPageIndex, setItemPageIndex] = useState(1);

    // Dropdown menu state
    const [activeDropdownCardId, setActiveDropdownCardId] = useState<string | null>(null);

    // Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewTargetBoq, setReviewTargetBoq] = useState<{
        id: string;
        boqNumber: string;
        version: string;
        totalAmount: number;
        projectName?: string;
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

    const handleOpenReviewModal = (boqItem?: { id: string; boqNumber: string; version: string; totalAmount: number; projectName?: string }) => {
        if (boqItem) {
            setReviewTargetBoq(boqItem);
        } else if (selectedBoq) {
            setReviewTargetBoq({
                id: selectedBoq.id,
                boqNumber: selectedBoq.boqNumber,
                version: selectedBoq.version,
                totalAmount: selectedBoq.grandTotal,
                projectName: selectedBoq.projectName,
            });
        }
        setActiveDropdownCardId(null);
        setReviewModalOpen(true);
    };

    const handleDecisionSuccess = async (_newStatus: string) => {
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
        <main className="client-redesign-shell">
            <div className="client-bg-glow" />

            {/* Left Nav Rail */}
            <ClientDashboardRail current="/client/boq" />

            <div className="client-main-area">
                {/* Global Dashboard Header */}
                <DashboardHeader
                    title="BOQ"
                    hideNew={true}
                    onSearch={(q) => {
                        setSearchQuery(q);
                        setPage(1);
                    }}
                />

                {detailLoading ? (
                    <div className="client-loading-card">
                        <Loader2 className="animate-spin" size={36} color="#2563EB" />
                        <span>Loading BOQ details...</span>
                    </div>
                ) : screen === "category_items" && selectedBoq && selectedRoom && selectedCategory ? (
                    /* ========================================================================= */
                    /* SCREEN 3: Room / Category / Item Details                                  */
                    /* ========================================================================= */
                    <section style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                        {/* Breadcrumbs (Frame 240) */}
                        <div className="client-boq-breadcrumbs">
                            <button
                                type="button"
                                onClick={handleBackToList}
                                className="client-boq-crumb-btn"
                            >
                                Bill of Quantities
                            </button>
                            <ChevronRight size={18} color="#64748B" />
                            <button
                                type="button"
                                onClick={handleBackToDetail}
                                className="client-boq-crumb-btn"
                            >
                                {selectedBoq.boqNumber}
                            </button>
                            <ChevronRight size={18} color="#64748B" />
                            <span className="client-boq-crumb-current">{selectedRoom.name}</span>
                        </div>

                        {/* Main 2-Column Room Detail Workspace (Frame 2147225085) */}
                        <div className="client-room-detail-workspace">
                            {/* Left Column: Room Category Sidebar (Frame 2147225071) */}
                            <aside className="client-room-category-sidebar">
                                <h2 className="client-room-sidebar-title">
                                    {selectedRoom.name}
                                </h2>

                                <hr className="client-room-sidebar-divider" />

                                <div className="client-room-category-list">
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
                                                className={`client-room-category-btn ${isActive ? "active" : ""}`}
                                            >
                                                <div className="client-room-category-left">
                                                    <Folder size={18} color={isActive ? "#2563EB" : "#64748B"} />
                                                    <span>{cat.name}</span>
                                                </div>
                                                <span className="client-room-category-chip">
                                                    Item {cat.items.length}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </aside>

                            {/* Right Column: Category Item Details (Frame 2147225072) */}
                            <div className="client-room-items-panel">
                                {/* Header Section (Frame 2147225198) */}
                                <div className="client-room-panel-header">
                                    <div className="client-room-title-group">
                                        <h1 className="client-room-category-heading">
                                            {selectedCategory.name}
                                        </h1>
                                        <p className="client-room-context-subtitle">
                                            {selectedRoom.name} • BOQ Section
                                        </p>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <button
                                            type="button"
                                            onClick={handleBackToDetail}
                                            className="client-boq-btn-export"
                                            style={{ height: "40px", padding: "0 14px", fontSize: "13px" }}
                                        >
                                            <ArrowLeft size={16} /> Back to Rooms
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => window.open(`/api/v1/client/boqs/${selectedBoq.id}/pdf`, "_blank")}
                                            className="client-boq-btn-export"
                                            style={{ height: "40px", padding: "0 14px", fontSize: "13px" }}
                                        >
                                            <FileDown size={16} /> Export PDF
                                        </button>
                                    </div>
                                </div>

                                <hr className="client-room-panel-divider" />

                                {/* Items Table Container */}
                                <div className="client-room-table-container">
                                    <table className="client-room-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: "32px", textAlign: "center" }} />
                                                <th style={{ width: "32px", textAlign: "center" }}>#</th>
                                                <th>ITEM</th>
                                                <th style={{ width: "80px" }}>UNIT</th>
                                                <th style={{ width: "60px", textAlign: "right" }}>QTY</th>
                                                <th style={{ width: "110px", textAlign: "right" }}>RATE (₹)</th>
                                                <th style={{ width: "100px", textAlign: "right" }}>WASTE (%)</th>
                                                <th style={{ width: "90px", textAlign: "right" }}>TAX (%)</th>
                                                <th style={{ width: "110px", textAlign: "right" }}>AMOUNT(₹)</th>
                                                <th style={{ width: "56px", textAlign: "center" }} />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>
                                                        No items found in this category.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedItems.map((item, idx) => {
                                                    const rowNum = (itemPageIndex - 1) * itemsPerPage + idx + 1;
                                                    return (
                                                        <tr key={item.id || idx}>
                                                            <td style={{ textAlign: "center", color: "#CBD5E1" }}>
                                                                <GripVertical size={16} color="#B8B9B9" />
                                                            </td>
                                                            <td style={{ textAlign: "center", color: "#64748B", fontSize: "14px" }}>
                                                                {rowNum}
                                                            </td>
                                                            <td>
                                                                <div className="client-room-item-name">
                                                                    {item.name}
                                                                </div>
                                                                {item.description && (
                                                                    <div className="client-room-item-desc">
                                                                        {item.description}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {item.unit || "Nos"}
                                                            </td>
                                                            <td style={{ textAlign: "right" }}>
                                                                {item.quantity}
                                                            </td>
                                                            <td style={{ textAlign: "right", fontWeight: 500, color: "#0F172A" }}>
                                                                {Number(item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                            <td style={{ textAlign: "right" }}>
                                                                {item.wastePercent != null ? `${item.wastePercent}%` : "0%"}
                                                            </td>
                                                            <td style={{ textAlign: "right" }}>
                                                                {item.taxPercent != null ? `${item.taxPercent}%` : "18%"}
                                                            </td>
                                                            <td className="client-room-table-amount">
                                                                {Number(item.amount).toLocaleString("en-IN")}
                                                            </td>
                                                            <td style={{ textAlign: "center" }}>
                                                                <button
                                                                    type="button"
                                                                    className="client-btn-icon"
                                                                    aria-label="Item actions"
                                                                >
                                                                    <MoreHorizontal size={16} color="#64748B" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Table Total Summary Bar (Frame 63) */}
                                <div className="client-room-table-total-bar">
                                    <div className="client-room-total-label">
                                        TOTAL ({totalCategoryItemsCount} ITEMS)
                                    </div>
                                    <div className="client-room-total-values">
                                        <span>Qty: {formatNumber(categoryTotalQty)}</span>
                                        <span>₹{formatNumber(categoryTotalAmount)}</span>
                                    </div>
                                </div>

                                {/* Pagination Bar (Frame 2147225166) */}
                                <div className="client-room-pagination-bar">
                                    <div className="client-room-pagination-count">
                                        Total Items: {totalCategoryItemsCount}
                                    </div>

                                    <div className="client-room-pagination-pages">
                                        <button
                                            type="button"
                                            className="client-room-page-btn"
                                            disabled={itemPageIndex <= 1}
                                            onClick={() => setItemPageIndex((p) => Math.max(1, p - 1))}
                                            aria-label="Previous Page"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>

                                        {Array.from({ length: totalCategoryPages }, (_, i) => i + 1).map((pNum) => (
                                            <button
                                                key={pNum}
                                                type="button"
                                                className={`client-room-page-btn ${pNum === itemPageIndex ? "active" : ""}`}
                                                onClick={() => setItemPageIndex(pNum)}
                                            >
                                                {pNum}
                                            </button>
                                        ))}

                                        <button
                                            type="button"
                                            className="client-room-page-btn"
                                            disabled={itemPageIndex >= totalCategoryPages}
                                            onClick={() => setItemPageIndex((p) => Math.min(totalCategoryPages, p + 1))}
                                            aria-label="Next Page"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>

                                    <div className="client-room-per-page">
                                        <span>Show per Page:</span>
                                        <select
                                            className="client-room-per-page-select"
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setItemPageIndex(1);
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
                    /* SCREEN 2: Individual BOQ Overview (Figma CSS Quick Mock Reference)         */
                    /* ========================================================================= */
                    <section style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                        {/* Breadcrumbs (Frame 240) */}
                        <div className="client-boq-breadcrumbs">
                            <button
                                type="button"
                                onClick={handleBackToList}
                                className="client-boq-crumb-btn"
                            >
                                Bill of Quantities
                            </button>
                            <ChevronRight size={18} color="#64748B" />
                            <span className="client-boq-crumb-current">{selectedBoq.boqNumber}</span>
                        </div>

                        {/* Top BOQ Identity & Action Row (Frame 2147225066) */}
                        <div className="client-boq-detail-header-row">
                            <div className="client-boq-detail-identity">
                                <button
                                    type="button"
                                    onClick={handleBackToList}
                                    className="client-boq-back-circle-btn"
                                    aria-label="Back to BOQ list"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="client-boq-detail-title-group">
                                    <div className="client-boq-detail-num-row">
                                        <h1 className="client-boq-detail-title">
                                            {selectedBoq.boqNumber}
                                        </h1>
                                        {(() => {
                                            const badge = getStatusBadge(selectedBoq.decisionStatus || selectedBoq.status);
                                            return (
                                                <span className={`client-boq-detail-status-pill ${badge.statusKey}`}>
                                                    {badge.label}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <p className="client-boq-detail-subtitle">
                                        {selectedBoq.projectName || "Project"} · {selectedBoq.version}
                                    </p>
                                </div>
                            </div>

                            {/* Top Right Actions (Frame 2147225069) */}
                            <div className="client-boq-detail-actions">
                                <button
                                    type="button"
                                    onClick={() => window.open(`/api/v1/client/boqs/${selectedBoq.id}/pdf`, "_blank")}
                                    className="client-boq-btn-export"
                                >
                                    <FileDown size={16} /> Export PDF
                                </button>

                                {(() => {
                                    const isApproved = (selectedBoq.decisionStatus || selectedBoq.status || "").toLowerCase().includes("approved");
                                    if (isApproved) {
                                        return (
                                            <button
                                                type="button"
                                                disabled
                                                className="client-boq-btn-approve approved"
                                                style={{ opacity: 0.7, cursor: "not-allowed" }}
                                                title="This BOQ has already been approved"
                                            >
                                                <CheckCircle2 size={16} /> Approved
                                            </button>
                                        );
                                    }
                                    return (
                                        <button
                                            type="button"
                                            onClick={() => handleOpenReviewModal()}
                                            className="client-boq-btn-approve"
                                        >
                                            Approve BOQ
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Main 2-Column Workspace (Frame 2147225084) */}
                        <div className="client-boq-detail-workspace">
                            {/* Left Column: Rooms Table (Frame 2147225085) */}
                            <div className="client-boq-detail-main-col">
                                {/* Subhead: Room Count & Glassmorphic Search (Frame 2147225066) */}
                                <div className="client-boq-detail-subhead">
                                    <div className="client-boq-room-count">
                                        {filteredRooms.length} Rooms
                                    </div>
                                    <div className="client-boq-detail-search-wrap">
                                        <div className="client-boq-detail-search-icon-box">
                                            <Search size={16} color="#475569" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={roomSearch}
                                            onChange={(e) => setRoomSearch(e.target.value)}
                                            className="client-boq-detail-search-input"
                                        />
                                    </div>
                                </div>

                                {/* Table Card Container (Frame 2147225072) */}
                                <div className="client-boq-detail-table-card">
                                    <div style={{ width: "100%", overflowX: "auto" }}>
                                        <table className="client-boq-room-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: "44px", textAlign: "center" }}>#</th>
                                                    <th style={{ width: "160px" }}>ROOM</th>
                                                    <th style={{ width: "110px" }}>CATEGORY</th>
                                                    <th style={{ width: "140px" }}>SPEC</th>
                                                    <th style={{ width: "64px" }}>UNIT</th>
                                                    <th style={{ width: "70px" }}>ITEMS</th>
                                                    <th style={{ width: "112px", textAlign: "right" }}>AMOUNT (₹)</th>
                                                    <th style={{ minWidth: "180px" }}>DESCRIPTION</th>
                                                    <th style={{ width: "64px", textAlign: "center" }} />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredRooms.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>
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
                                                        const roomDesc = room.description || (firstItem ? `${firstItem.name} with specifications` : "Standard room finish");

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
                                                            >
                                                                <td style={{ textAlign: "center", width: "44px" }}>
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="primary-text" style={{ width: "160px" }}>
                                                                    {room.name}
                                                                </td>
                                                                <td className="primary-text" style={{ width: "110px" }}>
                                                                    {room.categories.length}
                                                                </td>
                                                                <td style={{ width: "140px" }} title={specLabel}>
                                                                    {specLabel.length > 20 ? `${specLabel.slice(0, 20)}...` : specLabel}
                                                                </td>
                                                                <td style={{ width: "64px" }}>
                                                                    {unitLabel}
                                                                </td>
                                                                <td className="primary-text" style={{ width: "70px" }}>
                                                                    {roomItemsCount}
                                                                </td>
                                                                <td className="primary-text" style={{ textAlign: "right", width: "112px" }}>
                                                                    ₹{formatNumber(roomAmount)}
                                                                </td>
                                                                <td style={{ minWidth: "180px" }} title={roomDesc}>
                                                                    {roomDesc.length > 40 ? `${roomDesc.slice(0, 40)}...` : roomDesc}
                                                                </td>
                                                                <td style={{ textAlign: "center", width: "64px" }}>
                                                                    <MoreHorizontal size={18} color="#64748B" />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Financial Summary Panel (Frame 2147225071) */}
                            <div className="client-boq-summary-panel">
                                <h3 className="client-boq-summary-title">SUMMARY</h3>

                                <div className="client-boq-summary-divider" />

                                <div className="client-boq-summary-breakdown">
                                    <div className="client-boq-summary-row">
                                        <span className="label">Subtotal</span>
                                        <span className="val">{formatMoney(selectedBoq.subtotal)}</span>
                                    </div>
                                    <div className="client-boq-summary-row">
                                        <span className="label">Markup ({selectedBoq.markupPercent}%)</span>
                                        <span className="val">{formatMoney(selectedBoq.markupAmount)}</span>
                                    </div>
                                    <div className="client-boq-summary-row">
                                        <span className="label">GST ({selectedBoq.taxPercent}%)</span>
                                        <span className="val">{formatMoney(selectedBoq.taxAmount)}</span>
                                    </div>
                                </div>

                                <div className="client-boq-summary-divider" />

                                <div className="client-boq-summary-row grand-total">
                                    <span className="label">Grand Total</span>
                                    <span className="val">{formatMoney(selectedBoq.grandTotal)}</span>
                                </div>

                                {/* Metric Cards (Frame 2147225090) */}
                                <div className="client-boq-summary-metrics">
                                    <div className="client-boq-summary-metric-card">
                                        <div className="client-boq-summary-metric-label">Rooms Covered</div>
                                        <div className="client-boq-summary-metric-val">
                                            {selectedBoq.roomsCovered ?? selectedBoq.rooms.length}
                                        </div>
                                    </div>

                                    <div className="client-boq-summary-metric-card">
                                        <div className="client-boq-summary-metric-label">Items</div>
                                        <div className="client-boq-summary-metric-val">
                                            {selectedBoq.totalItems ??
                                                selectedBoq.rooms.reduce(
                                                    (acc, r) => acc + r.categories.reduce((cAcc, c) => cAcc + c.items.length, 0),
                                                    0
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : (
                    /* ========================================================================= */
                    /* SCREEN 1: Client BOQ Listing Overview (Figma CSS Quick Mock Reference)   */
                    /* ========================================================================= */
                    <section className="client-boq-section">
                        {/* Heading & Summary (Frame 2147225066 / Frame 2147224969) */}
                        <div className="client-boq-heading-row">
                            <div className="client-boq-heading-wrap">
                                <h1 className="client-boq-title">Bill of Quantities</h1>
                                <p className="client-boq-subtitle">
                                    {loading
                                        ? "Loading BOQs..."
                                        : `${total} ${total === 1 ? "BOQ" : "BOQs"} | ${pendingApprovals} pending approval`}
                                </p>
                            </div>
                        </div>

                        {/* Error state */}
                        {error && (
                            <div className="client-banner-error">
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                                <button type="button" onClick={loadBoqs}>
                                    Retry
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <div className="client-boq-grid" aria-label="Loading BOQs">
                                {[1, 2, 3].map((n) => (
                                    <div key={n} className="client-boq-card" style={{ opacity: 0.7 }}>
                                        <div className="client-boq-card-header">
                                            <div style={{ width: "90px", height: "18px", background: "#E2E8F0", borderRadius: "4px" }} />
                                            <div style={{ width: "80px", height: "18px", background: "#E2E8F0", borderRadius: "9999px" }} />
                                        </div>
                                        <div className="client-boq-details-panel">
                                            <div className="client-boq-meta-container">
                                                <div className="client-boq-meta-row">
                                                    <div className="client-boq-meta-cell">
                                                        <div style={{ width: "60px", height: "12px", background: "#F1F5F9", borderRadius: "3px" }} />
                                                        <div style={{ width: "80px", height: "14px", background: "#E2E8F0", borderRadius: "3px" }} />
                                                    </div>
                                                    <div className="client-boq-meta-cell">
                                                        <div style={{ width: "80px", height: "12px", background: "#F1F5F9", borderRadius: "3px" }} />
                                                        <div style={{ width: "70px", height: "14px", background: "#E2E8F0", borderRadius: "3px" }} />
                                                    </div>
                                                    <div className="client-boq-meta-cell">
                                                        <div style={{ width: "65px", height: "12px", background: "#F1F5F9", borderRadius: "3px" }} />
                                                        <div style={{ width: "75px", height: "14px", background: "#E2E8F0", borderRadius: "3px" }} />
                                                    </div>
                                                </div>
                                                <div className="client-boq-meta-row">
                                                    <div className="client-boq-meta-cell">
                                                        <div style={{ width: "50px", height: "12px", background: "#F1F5F9", borderRadius: "3px" }} />
                                                        <div style={{ width: "30px", height: "14px", background: "#E2E8F0", borderRadius: "3px" }} />
                                                    </div>
                                                    <div className="client-boq-meta-cell">
                                                        <div style={{ width: "45px", height: "12px", background: "#F1F5F9", borderRadius: "3px" }} />
                                                        <div style={{ width: "25px", height: "14px", background: "#E2E8F0", borderRadius: "3px" }} />
                                                    </div>
                                                    <div className="client-boq-meta-cell">
                                                        <div style={{ width: "40px", height: "12px", background: "#F1F5F9", borderRadius: "3px" }} />
                                                        <div style={{ width: "35px", height: "14px", background: "#E2E8F0", borderRadius: "3px" }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="client-boq-divider" />
                                            <div className="client-boq-progress-section">
                                                <div style={{ width: "50px", height: "12px", background: "#F1F5F9", borderRadius: "3px" }} />
                                                <div className="client-boq-progress-row">
                                                    <div className="client-boq-progress-track" style={{ background: "#E2E8F0" }} />
                                                    <div style={{ width: "30px", height: "14px", background: "#F1F5F9", borderRadius: "3px" }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : boqs.length === 0 ? (
                            searchQuery ? (
                                <div className="client-empty-card">
                                    <AlertCircle size={40} color="#94A3B8" style={{ margin: "0 auto 8px auto" }} />
                                    <div className="client-empty-title">No matching BOQs</div>
                                    <p className="client-empty-desc">
                                        No Bill of Quantities matched &ldquo;{searchQuery}&rdquo;. Try another search term or clear the filter.
                                    </p>
                                    <button
                                        type="button"
                                        className="client-btn-secondary client-btn-compact"
                                        onClick={() => setSearchQuery("")}
                                        style={{ marginTop: "12px" }}
                                    >
                                        Clear Search
                                    </button>
                                </div>
                            ) : (
                                <div className="client-empty-card">
                                    <CheckCircle2 size={40} color="#94A3B8" style={{ margin: "0 auto 8px auto" }} />
                                    <div className="client-empty-title">No BOQs available</div>
                                    <p className="client-empty-desc">
                                        You do not currently have any BOQs assigned or shared for review.
                                    </p>
                                </div>
                            )
                        ) : (
                            /* Responsive 3-Column Grid of BOQ Cards (Frame 2147225083) */
                            <div className="client-boq-grid">
                                {boqs.map((item) => {
                                    const badge = getStatusBadge(item.decisionStatus || item.status);
                                    const progressVal = Math.min(
                                        100,
                                        Math.max(0, item.progress ?? (badge.label === "APPROVED" ? 100 : 68))
                                    );

                                    return (
                                        <div
                                            key={item.id}
                                            className="client-boq-card"
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => openBoqDetail(item.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    openBoqDetail(item.id);
                                                }
                                            }}
                                            aria-label={`BOQ ${item.boqNumber}, status ${badge.label}`}
                                        >
                                            {/* Card Top Row: BOQ Identifier, Status Pill, Three-dot Menu (Frame 2147225073) */}
                                            <div className="client-boq-card-header">
                                                <h2 className="client-boq-card-id">{item.boqNumber}</h2>

                                                <div className="client-boq-card-actions">
                                                    <span className={`client-boq-status-pill ${badge.statusKey}`}>
                                                        {badge.label}
                                                    </span>

                                                    {/* Three-dot Action Menu */}
                                                    <div
                                                        style={{ position: "relative" }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="client-boq-dot-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveDropdownCardId(
                                                                    activeDropdownCardId === item.id ? null : item.id
                                                                );
                                                            }}
                                                            aria-label="BOQ options"
                                                            title="Options"
                                                        >
                                                            <MoreHorizontal size={18} />
                                                        </button>

                                                        {activeDropdownCardId === item.id && (
                                                            <div className="client-menu-popover">
                                                                <button
                                                                    type="button"
                                                                    className="client-menu-item"
                                                                    onClick={() => {
                                                                        setActiveDropdownCardId(null);
                                                                        openBoqDetail(item.id);
                                                                    }}
                                                                >
                                                                    View BOQ
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="client-menu-item"
                                                                    onClick={() => {
                                                                        setActiveDropdownCardId(null);
                                                                        window.open(`/api/v1/client/boqs/${item.id}/pdf`, "_blank");
                                                                    }}
                                                                >
                                                                    Export PDF
                                                                </button>
                                                                {badge.label !== "APPROVED" && (
                                                                    <button
                                                                        type="button"
                                                                        className="client-menu-item"
                                                                        style={{ color: "#2563EB", fontWeight: 600 }}
                                                                        onClick={() => {
                                                                            setActiveDropdownCardId(null);
                                                                            handleOpenReviewModal({
                                                                                id: item.id,
                                                                                boqNumber: item.boqNumber,
                                                                                version: item.version,
                                                                                totalAmount: item.grandTotal,
                                                                            });
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

                                            {/* Inner Details White Panel (Frame 2147225077) */}
                                            <div className="client-boq-details-panel">
                                                <div className="client-boq-meta-container">
                                                    {/* Row 1: Issued by, Estimated Value, Issued Date (Frame 2147225075) */}
                                                    <div className="client-boq-meta-row">
                                                        <div className="client-boq-meta-cell">
                                                            <span className="client-boq-meta-label">Issued by</span>
                                                            <span className="client-boq-meta-val" title={item.issuedBy || "Nikhil Oberoi"}>
                                                                {item.issuedBy || "Nikhil Oberoi"}
                                                            </span>
                                                        </div>
                                                        <div className="client-boq-meta-cell">
                                                            <span className="client-boq-meta-label">Estimated Value</span>
                                                            <span
                                                                className="client-boq-meta-val"
                                                                title={
                                                                    item.estimatedAreaValue ||
                                                                    (item.grandTotal ? formatMoney(item.grandTotal) : "3,200 sqft")
                                                                }
                                                            >
                                                                {item.estimatedAreaValue ||
                                                                    (item.grandTotal ? formatMoney(item.grandTotal) : "3,200 sqft")}
                                                            </span>
                                                        </div>
                                                        <div className="client-boq-meta-cell">
                                                            <span className="client-boq-meta-label">Issued Date</span>
                                                            <span className="client-boq-meta-val" title={item.date || "04 Sep 2026"}>
                                                                {item.date || "04 Sep 2026"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Row 2: Version, Rooms, Items (Frame 2147225076) */}
                                                    <div className="client-boq-meta-row">
                                                        <div className="client-boq-meta-cell">
                                                            <span className="client-boq-meta-label">Version</span>
                                                            <span className="client-boq-meta-val">{item.version || "v7"}</span>
                                                        </div>
                                                        <div className="client-boq-meta-cell">
                                                            <span className="client-boq-meta-label">Rooms</span>
                                                            <span className="client-boq-meta-val">{item.roomsCount ?? "8"}</span>
                                                        </div>
                                                        <div className="client-boq-meta-cell">
                                                            <span className="client-boq-meta-label">Items</span>
                                                            <span className="client-boq-meta-val">{item.itemsCount ?? "142"}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Divider Line (Rectangle 40) */}
                                                <hr className="client-boq-divider" />

                                                {/* Progress Section (Frame 2147225075) */}
                                                <div className="client-boq-progress-section">
                                                    <span className="client-boq-progress-label">Progress</span>
                                                    <div className="client-boq-progress-row">
                                                        <div
                                                            className="client-boq-progress-track"
                                                            role="progressbar"
                                                            aria-valuenow={progressVal}
                                                            aria-valuemin={0}
                                                            aria-valuemax={100}
                                                            aria-label={`Progress: ${progressVal}%`}
                                                        >
                                                            <div
                                                                className="client-boq-progress-fill"
                                                                style={{ width: `${progressVal}%` }}
                                                            />
                                                        </div>
                                                        <span className="client-boq-progress-text">{progressVal}%</span>
                                                    </div>
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

            {/* Review BOQ Modal */}
            {reviewTargetBoq && (
                <ReviewBoqModal
                    isOpen={reviewModalOpen}
                    onClose={() => setReviewModalOpen(false)}
                    boqId={reviewTargetBoq.id}
                    boqNumber={reviewTargetBoq.boqNumber}
                    version={reviewTargetBoq.version}
                    totalAmount={reviewTargetBoq.totalAmount}
                    projectName={reviewTargetBoq.projectName}
                    onSuccess={handleDecisionSuccess}
                />
            )}
        </main>
    );
}
