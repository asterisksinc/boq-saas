"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    ChevronRight,
    Download,
    Eye,
    FileDown,
    FileSpreadsheet,
    Loader2,
    RefreshCw,
    Search,
    AlertCircle,
    FileText,
} from "lucide-react";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import {
    listClientBoqs,
    getClientBoq,
    listClientProjects,
    type ClientBoqListItem,
    type ClientBoqDetail,
    type ClientProjectDetails,
} from "@/lib/api/client";

function formatMoney(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

export default function ClientBoqPage() {
    const [screen, setScreen] = useState<"list" | "detail">("list");
    const [boqs, setBoqs] = useState<ClientBoqListItem[]>([]);
    const [selectedBoq, setSelectedBoq] = useState<ClientBoqDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters and pagination
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [projects, setProjects] = useState<ClientProjectDetails[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [pendingApprovals, setPendingApprovals] = useState(0);

    // Detail search
    const [detailItemSearch, setDetailItemSearch] = useState("");

    const loadProjects = useCallback(async () => {
        try {
            const res = await listClientProjects();
            setProjects(res.items || []);
        } catch {
            // Ignore error
        }
    }, []);

    const loadBoqs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listClientBoqs({
                page,
                pageSize,
                search: searchQuery || undefined,
                status: statusFilter !== "ALL" ? statusFilter : undefined,
                projectId: selectedProjectId || undefined,
            });
            setBoqs(res.items);
            setTotal(res.total);
            setPendingApprovals(res.pendingApprovals);
        } catch (err: any) {
            setError(err.message || "Failed to load BOQs.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchQuery, statusFilter, selectedProjectId]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    useEffect(() => {
        loadBoqs();
    }, [loadBoqs]);

    const openBoqDetail = async (boqId: string) => {
        setDetailLoading(true);
        setError(null);
        try {
            const detail = await getClientBoq(boqId);
            setSelectedBoq(detail);
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
        setDetailItemSearch("");
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Filter rooms & items in detail view
    const filteredRooms = useMemo(() => {
        if (!selectedBoq?.rooms) return [];
        if (!detailItemSearch.trim()) return selectedBoq.rooms;
        const q = detailItemSearch.toLowerCase();
        return selectedBoq.rooms
            .map((room) => {
                const roomMatches = room.name.toLowerCase().includes(q);
                const matchedCategories = room.categories
                    .map((cat) => {
                        const catMatches = cat.name.toLowerCase().includes(q);
                        const matchedItems = cat.items.filter(
                            (it) =>
                                it.name.toLowerCase().includes(q) ||
                                (it.description && it.description.toLowerCase().includes(q))
                        );
                        if (catMatches || matchedItems.length > 0) {
                            return { ...cat, items: catMatches ? cat.items : matchedItems };
                        }
                        return null;
                    })
                    .filter(Boolean) as typeof room.categories;

                if (roomMatches || matchedCategories.length > 0) {
                    return { ...room, categories: roomMatches ? room.categories : matchedCategories };
                }
                return null;
            })
            .filter(Boolean) as typeof selectedBoq.rooms;
    }, [selectedBoq, detailItemSearch]);

    return (
        <main className="fig-dashboard boq-dashboard">
            <div className="fig-dashboard-glow" />

            <ClientDashboardRail current="/client/boq" />

            <div className="fig-dashboard-main">
                <DashboardHeader
                    title="Bill of Quantities"
                    hideNew={true}
                    onSearch={(q) => {
                        setSearchQuery(q);
                        setPage(1);
                    }}
                />

                {detailLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                        <Loader2 className="animate-spin" size={36} color="#2563EB" />
                    </div>
                ) : screen === "detail" && selectedBoq ? (
                    <section className="boq-detail-shell" style={{ padding: "24px 32px" }}>
                        {/* Breadcrumb navigation */}
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
                                    color: "#2563eb",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    padding: 0,
                                }}
                            >
                                Bill of Quantities
                            </button>
                            <ChevronRight size={15} />
                            <span style={{ color: "#0f172a", fontWeight: 600 }}>{selectedBoq.boqNumber}</span>

                            <button
                                type="button"
                                onClick={handleBackToList}
                                style={{
                                    marginLeft: "auto",
                                    background: "#f1f5f9",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "6px",
                                    padding: "6px 12px",
                                    color: "#334155",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <ArrowLeft size={14} /> Back to List
                            </button>
                        </div>

                        {/* BOQ Header Details */}
                        <div
                            style={{
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                padding: "24px",
                                marginBottom: "24px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                flexWrap: "wrap",
                                gap: "16px",
                            }}
                        >
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                    <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                        {selectedBoq.boqNumber}
                                    </h2>
                                    <span
                                        className={`boq-status-pill ${selectedBoq.status.toLowerCase().replace(/\s/g, "-")}`}
                                        style={{ fontSize: "12px" }}
                                    >
                                        {selectedBoq.status}
                                    </span>
                                    <span
                                        style={{
                                            background: "#f1f5f9",
                                            color: "#475569",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            padding: "3px 8px",
                                            borderRadius: "6px",
                                        }}
                                    >
                                        {selectedBoq.version}
                                    </span>
                                </div>
                                <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                                    Project: <strong style={{ color: "#0f172a" }}>{selectedBoq.projectName}</strong>
                                    {selectedBoq.projectCode && ` (${selectedBoq.projectCode})`}
                                    {selectedBoq.clientName && ` • Client: ${selectedBoq.clientName}`}
                                </p>
                            </div>

                            {/* Export Actions */}
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => window.open(`/api/v1/client/boqs/${selectedBoq.id}/pdf`, "_blank")}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        background: "#ffffff",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "8px",
                                        padding: "8px 14px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#334155",
                                        cursor: "pointer",
                                    }}
                                >
                                    <FileDown size={15} color="#2563eb" /> Export PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.open(`/api/v1/client/boqs/${selectedBoq.id}/excel`, "_blank")}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        background: "#ffffff",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "8px",
                                        padding: "8px 14px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#334155",
                                        cursor: "pointer",
                                    }}
                                >
                                    <FileSpreadsheet size={15} color="#16a34a" /> Export Excel
                                </button>
                            </div>
                        </div>

                        {/* Financial summary banner */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: "16px",
                                marginBottom: "24px",
                            }}
                        >
                            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                                    Subtotal (Items)
                                </div>
                                <div style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                                    {formatMoney(selectedBoq.subtotal)}
                                </div>
                            </div>
                            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                                    Markup ({selectedBoq.markupPercent}%)
                                </div>
                                <div style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                                    {formatMoney(selectedBoq.markupAmount)}
                                </div>
                            </div>
                            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                                    Tax / GST ({selectedBoq.taxPercent}%)
                                </div>
                                <div style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                                    {formatMoney(selectedBoq.taxAmount)}
                                </div>
                            </div>
                            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "16px" }}>
                                <div style={{ fontSize: "12px", color: "#166534", fontWeight: 600, textTransform: "uppercase" }}>
                                    Grand Total
                                </div>
                                <div style={{ fontSize: "22px", fontWeight: 800, color: "#15803d", marginTop: "4px" }}>
                                    {formatMoney(selectedBoq.grandTotal)}
                                </div>
                            </div>
                        </div>

                        {/* Search within items */}
                        <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    background: "#ffffff",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    padding: "6px 12px",
                                    width: "320px",
                                }}
                            >
                                <Search size={16} color="#94a3b8" style={{ marginRight: "8px" }} />
                                <input
                                    type="text"
                                    placeholder="Search rooms or items..."
                                    value={detailItemSearch}
                                    onChange={(e) => setDetailItemSearch(e.target.value)}
                                    style={{ border: "none", outline: "none", width: "100%", fontSize: "14px" }}
                                />
                            </div>
                            <span style={{ fontSize: "13px", color: "#64748b" }}>
                                {filteredRooms.length} {filteredRooms.length === 1 ? "Room" : "Rooms"} displayed
                            </span>
                        </div>

                        {/* Rooms and items breakdown */}
                        {filteredRooms.length === 0 ? (
                            <div
                                style={{
                                    background: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "12px",
                                    padding: "48px 24px",
                                    textAlign: "center",
                                }}
                            >
                                <FileSpreadsheet size={40} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
                                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a" }}>No items found</h3>
                                <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>
                                    {detailItemSearch ? "No items matching your search query." : "This BOQ does not contain any room specifications."}
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {filteredRooms.map((room) => (
                                    <div
                                        key={room.id}
                                        style={{
                                            background: "#ffffff",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "12px",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: "14px 20px",
                                                background: "#f8fafc",
                                                borderBottom: "1px solid #e2e8f0",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                                {room.name}
                                            </h3>
                                            {room.description && (
                                                <span style={{ fontSize: "13px", color: "#64748b" }}>{room.description}</span>
                                            )}
                                        </div>

                                        <table className="boq-room-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: "40px", textAlign: "center" }}>#</th>
                                                    <th style={{ width: "140px" }}>CATEGORY</th>
                                                    <th>ITEM & SPECIFICATION</th>
                                                    <th style={{ width: "80px" }}>UNIT</th>
                                                    <th style={{ width: "80px", textAlign: "right" }}>QTY</th>
                                                    <th style={{ width: "120px", textAlign: "right" }}>RATE (₹)</th>
                                                    <th style={{ width: "130px", textAlign: "right" }}>AMOUNT (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {room.categories.flatMap((cat) =>
                                                    cat.items.map((it, idx) => (
                                                        <tr key={it.id || `${cat.id}-${idx}`}>
                                                            <td style={{ textAlign: "center", color: "#64748b" }}>{idx + 1}</td>
                                                            <td style={{ fontWeight: 600, color: "#334155" }}>{cat.name}</td>
                                                            <td>
                                                                <div style={{ fontWeight: 600, color: "#0f172a" }}>{it.name}</div>
                                                                {it.description && (
                                                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                                                        {it.description}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td style={{ color: "#475569" }}>{it.unit}</td>
                                                            <td style={{ textAlign: "right", fontWeight: 600 }}>{it.quantity}</td>
                                                            <td style={{ textAlign: "right" }}>{it.rate.toLocaleString("en-IN")}</td>
                                                            <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                                                                {it.amount.toLocaleString("en-IN")}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    /* BOQ List View */
                    <section className="boq-page-shell" style={{ padding: "24px 32px" }}>
                        {/* Title Row */}
                        <div className="boq-page-header-row" style={{ marginBottom: "20px" }}>
                            <div className="boq-page-title-block">
                                <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                    Bill of Quantities
                                </h2>
                                <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>
                                    {total} {total === 1 ? "BOQ" : "BOQs"} • {pendingApprovals} Pending Review
                                </p>
                            </div>
                        </div>

                        {/* Filter Bar */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "12px",
                                marginBottom: "20px",
                            }}
                        >
                            {/* Filter tabs */}
                            <div style={{ display: "flex", gap: "8px" }}>
                                {["ALL", "APPROVED", "IN REVIEW", "DRAFT"].map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter(st);
                                            setPage(1);
                                        }}
                                        style={{
                                            padding: "6px 14px",
                                            borderRadius: "6px",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            border: statusFilter === st ? "1px solid #2563eb" : "1px solid #e2e8f0",
                                            backgroundColor: statusFilter === st ? "#eff6ff" : "#ffffff",
                                            color: statusFilter === st ? "#2563eb" : "#64748b",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>

                            {/* Project selector dropdown */}
                            {projects.length > 1 && (
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => {
                                        setSelectedProjectId(e.target.value);
                                        setPage(1);
                                    }}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        backgroundColor: "#ffffff",
                                        color: "#334155",
                                        outline: "none",
                                    }}
                                >
                                    <option value="">All Assigned Projects</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Error state */}
                        {error && (
                            <div
                                style={{
                                    padding: "16px",
                                    borderRadius: "8px",
                                    backgroundColor: "#fef2f2",
                                    border: "1px solid #fecaca",
                                    color: "#b91c1c",
                                    marginBottom: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <AlertCircle size={18} />
                                <span>{error}</span>
                                <button
                                    type="button"
                                    onClick={loadBoqs}
                                    style={{
                                        marginLeft: "auto",
                                        background: "none",
                                        border: "none",
                                        color: "#b91c1c",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                    }}
                                >
                                    <RefreshCw size={14} /> Retry
                                </button>
                            </div>
                        )}

                        {/* BOQ List Table */}
                        <div className="boq-table-card" style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                            <table className="boq-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>BOQ #</th>
                                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>PROJECT</th>
                                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>VERSION</th>
                                        <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>ROOMS</th>
                                        <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>ITEMS</th>
                                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>ESTIMATED TOTAL</th>
                                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>DATE</th>
                                        <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>STATUS</th>
                                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={9} style={{ textAlign: "center", padding: "48px 16px" }}>
                                                <Loader2 className="animate-spin" size={32} color="#2563EB" style={{ margin: "0 auto 8px auto" }} />
                                                <div style={{ color: "#64748b", fontSize: "14px" }}>Loading your Bills of Quantities...</div>
                                            </td>
                                        </tr>
                                    ) : boqs.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} style={{ textAlign: "center", padding: "56px 16px" }}>
                                                <div style={{ maxWidth: "360px", margin: "0 auto" }}>
                                                    <FileSpreadsheet size={40} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
                                                    <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>
                                                        No Bills of Quantities Available
                                                    </h4>
                                                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                                        {searchQuery || statusFilter !== "ALL"
                                                            ? "No BOQs match your current filter criteria."
                                                            : "Your project team has not yet published a BOQ for your review."}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        boqs.map((boq) => (
                                            <tr
                                                key={boq.id}
                                                className="boq-row"
                                                onClick={() => openBoqDetail(boq.id)}
                                                style={{ cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                                            >
                                                <td style={{ padding: "14px 16px", fontWeight: 600, color: "#2563eb" }}>
                                                    {boq.boqNumber}
                                                </td>
                                                <td style={{ padding: "14px 16px" }}>
                                                    <strong style={{ color: "#0f172a", fontWeight: 600 }}>{boq.projectName}</strong>
                                                </td>
                                                <td style={{ padding: "14px 16px", color: "#475569" }}>{boq.version}</td>
                                                <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>
                                                    {boq.roomsCount}
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>
                                                    {boq.itemsCount}
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                                                    {formatMoney(boq.grandTotal || boq.estimatedValue)}
                                                </td>
                                                <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>
                                                    {boq.date}
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                                    <span className={`boq-status-pill ${boq.status.toLowerCase().replace(/\s/g, "-")}`}>
                                                        {boq.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                                    <div style={{ display: "inline-flex", gap: "6px" }}>
                                                        <button
                                                            type="button"
                                                            title="View BOQ details"
                                                            onClick={() => openBoqDetail(boq.id)}
                                                            style={{
                                                                background: "#f1f5f9",
                                                                border: "none",
                                                                borderRadius: "6px",
                                                                padding: "6px",
                                                                cursor: "pointer",
                                                                color: "#334155",
                                                            }}
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Download PDF"
                                                            onClick={() => window.open(`/api/v1/client/boqs/${boq.id}/pdf`, "_blank")}
                                                            style={{
                                                                background: "#f1f5f9",
                                                                border: "none",
                                                                borderRadius: "6px",
                                                                padding: "6px",
                                                                cursor: "pointer",
                                                                color: "#334155",
                                                            }}
                                                        >
                                                            <FileDown size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Download Excel"
                                                            onClick={() => window.open(`/api/v1/client/boqs/${boq.id}/excel`, "_blank")}
                                                            style={{
                                                                background: "#f1f5f9",
                                                                border: "none",
                                                                borderRadius: "6px",
                                                                padding: "6px",
                                                                cursor: "pointer",
                                                                color: "#334155",
                                                            }}
                                                        >
                                                            <FileSpreadsheet size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="boq-footer-row" style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span className="boq-footer-total" style={{ fontSize: "13px", color: "#64748b" }}>
                                    Total: {total} {total === 1 ? "record" : "records"}
                                </span>
                                <div className="boq-pagination" style={{ display: "flex", gap: "4px" }}>
                                    <button
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: page <= 1 ? "not-allowed" : "pointer" }}
                                    >
                                        ‹
                                    </button>
                                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPage(p)}
                                            style={{
                                                padding: "4px 10px",
                                                borderRadius: "6px",
                                                border: page === p ? "1px solid #2563eb" : "1px solid #cbd5e1",
                                                background: page === p ? "#2563eb" : "#ffffff",
                                                color: page === p ? "#ffffff" : "#334155",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                            }}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: page >= totalPages ? "not-allowed" : "pointer" }}
                                    >
                                        ›
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
}
