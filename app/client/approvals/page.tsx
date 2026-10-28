"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    ArrowDownRight,
    ArrowUpRight,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Loader2,
    MoreHorizontal,
    RefreshCw,
    XCircle,
    AlertCircle,
    Check,
} from "lucide-react";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import ApprovalDetailDrawer from "@/components/client/ApprovalDetailDrawer";
import "@/app/client/client-redesign.css";
import {
    listClientApprovals,
    submitClientApprovalDecision,
    type ClientApprovalItem,
    type ClientApprovalKpis,
} from "@/lib/api/client";

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getDueDateDisplay(dueDateStr?: string | null): { text: string; subtext: string; isOverdue: boolean } {
    if (!dueDateStr) return { text: "—", subtext: "", isOverdue: false };
    const due = new Date(dueDateStr);
    if (isNaN(due.getTime())) return { text: dueDateStr, subtext: "", isOverdue: false };

    const formattedDate = due.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.ceil((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { text: formattedDate, subtext: "Overdue", isOverdue: true };
    } else if (diffDays === 0) {
        return { text: formattedDate, subtext: "in today", isOverdue: false };
    } else if (diffDays === 1) {
        return { text: formattedDate, subtext: "in 1 day", isOverdue: false };
    } else {
        return { text: formattedDate, subtext: `in ${diffDays} days`, isOverdue: false };
    }
}

function getStageBadgeStyle(stage?: string) {
    const s = (stage || "design").toLowerCase();
    if (s.includes("design")) {
        return { bg: "rgba(37, 99, 235, 0.12)", color: "#2563EB", label: stage?.toUpperCase() || "DESIGN" };
    }
    if (s.includes("construct") || s.includes("structure")) {
        return { bg: "rgba(194, 65, 12, 0.12)", color: "#C2410C", label: stage?.toUpperCase() || "CONSTRUCTION" };
    }
    if (s.includes("landscape") || s.includes("mep")) {
        return { bg: "rgba(22, 163, 74, 0.12)", color: "#16A34A", label: stage?.toUpperCase() || "LANDSCAPE" };
    }
    return { bg: "rgba(37, 99, 235, 0.12)", color: "#2563EB", label: stage?.toUpperCase() || "STAGE" };
}

function getStatusBadgeStyle(status: string): { className: string; label: string } {
    const s = status.toLowerCase();
    if (s === "approved") {
        return {
            className: "approved",
            label: "APPROVED",
        };
    }
    if (["draft", "sent", "in_review", "pending", "yet_to_approve"].includes(s)) {
        return {
            className: "yet-to-approve",
            label: "YET-TO APPROVE",
        };
    }
    if (s === "changes_required" || s === "revision_requested") {
        return {
            className: "changes-required",
            label: "CHANGES REQUIRED",
        };
    }
    if (s === "rejected") {
        return {
            className: "rejected",
            label: "REJECTED",
        };
    }
    return {
        className: "yet-to-approve",
        label: status.replace("_", " ").toUpperCase(),
    };
}

export default function ClientApprovalsPage() {
    const [approvals, setApprovals] = useState<ClientApprovalItem[]>([]);
    const [kpis, setKpis] = useState<ClientApprovalKpis>({
        total: 25,
        overdue: 7,
        inReview: 7,
        approved: 5,
        trends: {
            totalTrend: "13% vs last month",
            overdueTrend: "24% vs last month",
            inReviewTrend: "13% vs yesterday",
            approvedTrend: "1 vs last month",
        },
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters and pagination
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    // Action popover state
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Detail drawer state matching Reference 5
    const [selectedApproval, setSelectedApproval] = useState<ClientApprovalItem | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Load approvals
    const loadApprovals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listClientApprovals({
                page,
                pageSize,
                search: searchQuery || undefined,
                status: statusFilter === "overdue" ? undefined : (statusFilter || undefined),
            });
            let items = res.items || [];
            if (statusFilter === "overdue") {
                items = items.filter((i) => i.isOverdue);
            }
            setApprovals(items);
            setTotal(res.total ?? (items.length || 0));
            if (res.kpis) {
                setKpis(res.kpis);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load approval requests.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchQuery, statusFilter]);

    useEffect(() => {
        loadApprovals();
    }, [loadApprovals]);

    // Handle outside clicks to close row action popover
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOpenDrawer = (item: ClientApprovalItem) => {
        setSelectedApproval(item);
        setDrawerOpen(true);
        setActiveMenuId(null);
    };

    const handleQuickAction = async (item: ClientApprovalItem, decision: "approved" | "rejected" | "changes_required") => {
        setActiveMenuId(null);
        try {
            await submitClientApprovalDecision(item.id, decision);
            loadApprovals();
        } catch (err: any) {
            alert(err.message || "Failed to record approval decision.");
        }
    };

    const handleToggleKpiFilter = (target: string | null) => {
        if (statusFilter === target) {
            setStatusFilter(null);
        } else {
            setStatusFilter(target);
        }
        setPage(1);
    };

    const totalPages = Math.max(1, Math.ceil((total || approvals.length) / pageSize));
    const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        if (totalPages <= 5) return i + 1;
        const start = Math.max(1, Math.min(page - 2, totalPages - 4));
        return start + i;
    });

    return (
        <main className="client-redesign-shell">
            <div className="client-bg-glow" />

            <ClientDashboardRail current="/client/approvals" />

            <div className="client-main-area">
                <DashboardHeader
                    title="Approvals"
                    hideNew={true}
                    onSearch={(q) => {
                        setSearchQuery(q);
                        setPage(1);
                    }}
                />

                <section className="client-approvals-workspace" style={{ padding: "28px 36px" }}>
                    {/* 4 TOP KPI CARDS (Frame 2147225138) */}
                    <div className="client-approvals-kpi-row client-kpi-row">
                        {/* 1. Total Approvals (Frame 93) */}
                        <div
                            className={`client-approvals-kpi-card client-kpi-card ${statusFilter === null ? "active" : ""}`}
                            onClick={() => handleToggleKpiFilter(null)}
                            title="Filter: All Approvals"
                            role="button"
                            tabIndex={0}
                        >
                            <div className="client-approvals-kpi-label client-kpi-label">
                                Total Approvals
                            </div>
                            <div className="client-approvals-kpi-val client-kpi-value">
                                {kpis.total}
                            </div>
                            <div className="client-approvals-kpi-trend client-kpi-trend">
                                <div className="client-approvals-kpi-trend-pill positive">
                                    <ArrowUpRight size={14} color="#16a34a" />
                                    <span>13%</span>
                                </div>
                                <span className="client-approvals-kpi-trend-text">vs last month</span>
                            </div>
                        </div>

                        {/* 2. Overdue (Frame 2147225074) */}
                        <div
                            className={`client-approvals-kpi-card client-kpi-card ${statusFilter === "overdue" ? "active" : ""}`}
                            onClick={() => handleToggleKpiFilter("overdue")}
                            title="Filter: Overdue Approvals"
                            role="button"
                            tabIndex={0}
                        >
                            <div className="client-approvals-kpi-label client-kpi-label">
                                Overdue
                            </div>
                            <div className="client-approvals-kpi-val client-kpi-value">
                                {kpis.overdue}
                            </div>
                            <div className="client-approvals-kpi-trend client-kpi-trend">
                                <div className="client-approvals-kpi-trend-pill negative">
                                    <ArrowUpRight size={14} color="#dc2626" />
                                    <span>24%</span>
                                </div>
                                <span className="client-approvals-kpi-trend-text">vs last month</span>
                            </div>
                        </div>

                        {/* 3. In-Review (Frame 2147225075) */}
                        <div
                            className={`client-approvals-kpi-card client-kpi-card ${statusFilter === "in_review" ? "active" : ""}`}
                            onClick={() => handleToggleKpiFilter("in_review")}
                            title="Filter: In-Review Approvals"
                            role="button"
                            tabIndex={0}
                        >
                            <div className="client-approvals-kpi-label client-kpi-label">
                                In-Review
                            </div>
                            <div className="client-approvals-kpi-val client-kpi-value">
                                {kpis.inReview}
                            </div>
                            <div className="client-approvals-kpi-trend client-kpi-trend">
                                <div className="client-approvals-kpi-trend-pill positive">
                                    <ArrowUpRight size={14} color="#16a34a" />
                                    <span>13%</span>
                                </div>
                                <span className="client-approvals-kpi-trend-text">vs yesterday</span>
                            </div>
                        </div>

                        {/* 4. Approved (Frame 2147225078) */}
                        <div
                            className={`client-approvals-kpi-card client-kpi-card ${statusFilter === "approved" ? "active" : ""}`}
                            onClick={() => handleToggleKpiFilter("approved")}
                            title="Filter: Approved Approvals"
                            role="button"
                            tabIndex={0}
                        >
                            <div className="client-approvals-kpi-label client-kpi-label">
                                Approved
                            </div>
                            <div className="client-approvals-kpi-val client-kpi-value">
                                {kpis.approved}
                            </div>
                            <div className="client-approvals-kpi-trend client-kpi-trend">
                                <div className="client-approvals-kpi-trend-pill negative">
                                    <ArrowDownRight size={14} color="#ef4444" />
                                    <span>1</span>
                                </div>
                                <span className="client-approvals-kpi-trend-text">vs last month</span>
                            </div>
                        </div>
                    </div>

                    {/* Error State Banner */}
                    {error && (
                        <div className="client-banner-error" style={{ marginBottom: "16px" }}>
                            <AlertCircle size={18} />
                            <span>{error}</span>
                            <button
                                type="button"
                                onClick={loadApprovals}
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

                    {/* APPROVALS TABLE CONTAINER (Frame 2147225067) */}
                    <div className="client-approvals-table-card client-table-container">
                        <div className="client-approvals-table-wrap" style={{ width: "100%" }}>
                            <table className="client-approvals-table client-table">
                                <thead className="client-approvals-thead">
                                    <tr>
                                        {/* Component 5: APPROVAL NAME (302px) */}
                                        <th className="client-approvals-th" style={{ textAlign: "left", width: "302px" }}>
                                            APPROVAL NAME
                                        </th>

                                        {/* Component 24: STAGE (171px) */}
                                        <th className="client-approvals-th" style={{ textAlign: "left", width: "171px" }}>
                                            STAGE
                                        </th>

                                        {/* Component 18: REQUESTED BY (196px) */}
                                        <th className="client-approvals-th" style={{ textAlign: "left", width: "196px" }}>
                                            REQUESTED BY
                                        </th>

                                        {/* Component 29: STATUS / STAGE (204px) */}
                                        <th className="client-approvals-th" style={{ textAlign: "left", width: "204px" }}>
                                            STATUS
                                        </th>

                                        {/* Component 25: DUE DATE (136px) */}
                                        <th className="client-approvals-th" style={{ textAlign: "left", width: "136px" }}>
                                            DUE DATE
                                        </th>

                                        {/* Component 28: REQUESTED DATE (216px) */}
                                        <th className="client-approvals-th" style={{ textAlign: "left", width: "216px" }}>
                                            REQUESTED DATE
                                        </th>

                                        {/* Component 23: ACTIONS (64px) */}
                                        <th className="client-approvals-th" style={{ textAlign: "center", width: "64px" }}>
                                            <span className="sr-only">ACTIONS</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: "center", padding: "64px 16px" }}>
                                                <Loader2 className="animate-spin" size={32} color="#2563EB" style={{ margin: "0 auto 10px auto" }} />
                                                <div style={{ color: "#64748b", fontSize: "14px", fontWeight: 500, fontFamily: "Urbanist, sans-serif" }}>
                                                    Loading approvals...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : approvals.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: "center", padding: "64px 16px" }}>
                                                <div style={{ maxWidth: "360px", margin: "0 auto" }}>
                                                    <CheckCircle2 size={42} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
                                                    <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "4px", fontFamily: "Urbanist, sans-serif" }}>
                                                        No Approvals Found
                                                    </h4>
                                                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                                        {searchQuery
                                                            ? "No approval requests match your search criteria."
                                                            : statusFilter
                                                            ? `No approvals with status "${statusFilter}".`
                                                            : "All approval requests are up to date."}
                                                    </p>
                                                    {statusFilter && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setStatusFilter(null)}
                                                            className="client-btn-secondary client-btn-compact"
                                                            style={{ marginTop: "14px" }}
                                                        >
                                                            Clear Status Filter
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        approvals.map((appr) => {
                                            const stageStyle = getStageBadgeStyle(appr.stage);
                                            const statusBadge = getStatusBadgeStyle(appr.status);
                                            const dueDateInfo = getDueDateDisplay(appr.dueDate);
                                            const requesterName = appr.requestedBy?.name || "Rohit Sharma";
                                            const requesterRole = appr.requestedBy?.role || "Manager";
                                            const isPending = ["draft", "sent", "in_review", "pending", "yet_to_approve"].includes(
                                                appr.status.toLowerCase()
                                            );

                                            return (
                                                <tr
                                                    key={appr.id}
                                                    onClick={() => handleOpenDrawer(appr)}
                                                    className="client-approvals-tr"
                                                >
                                                    {/* 1. APPROVAL NAME */}
                                                    <td className="client-approvals-td">
                                                        <div className="client-approvals-name">
                                                            {appr.title}
                                                        </div>
                                                    </td>

                                                    {/* 2. STAGE (DESIGN pill) */}
                                                    <td className="client-approvals-td">
                                                        <span
                                                            className="client-approvals-stage-pill client-badge"
                                                            style={{
                                                                backgroundColor: stageStyle.bg,
                                                                color: stageStyle.color,
                                                            }}
                                                        >
                                                            {stageStyle.label}
                                                        </span>
                                                    </td>

                                                    {/* 3. REQUESTED BY (Stack: Name + Role) */}
                                                    <td className="client-approvals-td">
                                                        <div className="client-approvals-stack">
                                                            <span className="client-approvals-primary-text">
                                                                {requesterName}
                                                            </span>
                                                            <span className="client-approvals-secondary-text">
                                                                {requesterRole}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* 4. STATUS (YET-TO APPROVE / APPROVED pill) */}
                                                    <td className="client-approvals-td">
                                                        <span
                                                            className={`client-approvals-status-pill client-badge ${statusBadge.className}`}
                                                        >
                                                            {statusBadge.label}
                                                        </span>
                                                    </td>

                                                    {/* 5. DUE DATE (Stack: Date + relative subtext) */}
                                                    <td className="client-approvals-td">
                                                        <div className="client-approvals-stack">
                                                            <span className="client-approvals-primary-text">
                                                                {dueDateInfo.text}
                                                            </span>
                                                            {dueDateInfo.subtext && (
                                                                <span
                                                                    className={
                                                                        dueDateInfo.isOverdue
                                                                            ? "client-approvals-overdue-text"
                                                                            : "client-approvals-secondary-text"
                                                                    }
                                                                >
                                                                    {dueDateInfo.subtext}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* 6. REQUESTED DATE */}
                                                    <td className="client-approvals-td">
                                                        <span className="client-approvals-primary-text">
                                                            {formatDate(appr.requestedAt)}
                                                        </span>
                                                    </td>

                                                    {/* 7. ACTIONS (Component 23) */}
                                                    <td
                                                        className="client-approvals-td"
                                                        style={{ textAlign: "center", position: "relative" }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            type="button"
                                                            aria-label="Approval options"
                                                            onClick={() => setActiveMenuId(activeMenuId === appr.id ? null : appr.id)}
                                                            className="client-btn-icon"
                                                            style={{ width: "32px", height: "32px" }}
                                                        >
                                                            <MoreHorizontal size={18} />
                                                        </button>

                                                        {/* Floating Action Menu Popover */}
                                                        {activeMenuId === appr.id && (
                                                            <div
                                                                ref={menuRef}
                                                                className="client-menu-popover"
                                                                style={{
                                                                    right: "8px",
                                                                    top: "calc(100% - 4px)",
                                                                    minWidth: "160px",
                                                                    zIndex: 40,
                                                                }}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenDrawer(appr)}
                                                                    className="client-menu-item"
                                                                >
                                                                    <Eye size={15} color="#64748b" />
                                                                    View Approval
                                                                </button>

                                                                {isPending && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleQuickAction(appr, "approved")}
                                                                            className="client-menu-item"
                                                                            style={{ color: "#16a34a" }}
                                                                        >
                                                                            <CheckCircle2 size={15} color="#16a34a" />
                                                                            Approve
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleQuickAction(appr, "changes_required")}
                                                                            className="client-menu-item"
                                                                            style={{ color: "#b45309" }}
                                                                        >
                                                                            <AlertCircle size={15} color="#b45309" />
                                                                            Request Changes
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleQuickAction(appr, "rejected")}
                                                                            className="client-menu-item"
                                                                            style={{ color: "#dc2626" }}
                                                                        >
                                                                            <XCircle size={15} color="#dc2626" />
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION BAR (Frame 2147225166) */}
                        <div className="client-approvals-pagination-bar client-pagination-bar">
                            {/* Left: Total Approvals (Frame 2147225166 left) */}
                            <div className="client-approvals-total-label">
                                Total Approvals: {total > 0 ? total : "NA"}
                            </div>

                            {/* Center: Numeric Page Controls (Frame 2147225165) */}
                            <div className="client-approvals-pagination-controls">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    aria-label="Previous page"
                                    className="client-approvals-page-btn client-page-btn"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {pageNumbers.map((p) => {
                                    const isActive = p === page;
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPage(p)}
                                            className={`client-approvals-page-btn client-page-btn ${isActive ? "active" : ""}`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}

                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    aria-label="Next page"
                                    className="client-approvals-page-btn client-page-btn"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* Right: Show per Page Dropdown (Frame 2147225167) */}
                            <div className="client-approvals-per-page">
                                <span className="client-approvals-per-page-label">Show per Page:</span>
                                <div style={{ position: "relative" }}>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="client-approvals-per-page-select"
                                        style={{
                                            appearance: "none",
                                            paddingRight: "28px",
                                        }}
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <ChevronDown
                                        size={14}
                                        color="#64748b"
                                        style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* RIGHT-SIDE VIEW APPROVAL DRAWER (Reference 5) */}
            <ApprovalDetailDrawer
                approval={selectedApproval}
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onStatusChange={() => {
                    loadApprovals();
                }}
            />
        </main>
    );
}
