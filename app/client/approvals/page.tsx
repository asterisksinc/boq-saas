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
        return { bg: "#eff6ff", color: "#2563eb", label: stage?.toUpperCase() || "DESIGN" };
    }
    if (s.includes("construct") || s.includes("structure")) {
        return { bg: "#fff7ed", color: "#c2410c", label: stage?.toUpperCase() || "CONSTRUCTION" };
    }
    if (s.includes("landscape") || s.includes("mep")) {
        return { bg: "#f0fdf4", color: "#16a34a", label: stage?.toUpperCase() || "LANDSCAPE" };
    }
    return { bg: "#f1f5f9", color: "#475569", label: stage?.toUpperCase() || "STAGE" };
}

function getStatusBadgeStyle(status: string) {
    const s = status.toLowerCase();
    if (s === "approved") {
        return {
            bg: "#dcfce7",
            color: "#16a34a",
            label: "APPROVED",
        };
    }
    if (["draft", "sent", "in_review", "pending", "yet_to_approve"].includes(s)) {
        return {
            bg: "#f1f5f9",
            color: "#475569",
            label: "YET-TO APPROVE",
        };
    }
    if (s === "changes_required" || s === "revision_requested") {
        return {
            bg: "#fef3c7",
            color: "#b45309",
            label: "CHANGES REQUIRED",
        };
    }
    if (s === "rejected") {
        return {
            bg: "#fee2e2",
            color: "#dc2626",
            label: "REJECTED",
        };
    }
    return {
        bg: "#f1f5f9",
        color: "#64748b",
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
            });
            setApprovals(res.items || []);
            setTotal(res.total ?? (res.items?.length || 0));
            if (res.kpis) {
                setKpis(res.kpis);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load approval requests.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchQuery]);

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

    const totalPages = Math.max(1, Math.ceil((total || approvals.length) / pageSize));
    const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        if (totalPages <= 5) return i + 1;
        const start = Math.max(1, Math.min(page - 2, totalPages - 4));
        return start + i;
    });

    return (
        <main className="fig-dashboard" style={{ background: "#edf2f9" }}>
            <div className="fig-dashboard-glow" />

            <ClientDashboardRail current="/client/approvals" />

            <div className="fig-dashboard-main">
                <DashboardHeader
                    title="Approvals"
                    hideNew={true}
                    onSearch={(q) => {
                        setSearchQuery(q);
                        setPage(1);
                    }}
                />

                <section style={{ padding: "28px 36px" }}>
                    {/* 4 TOP KPI CARDS matching Reference 4 */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                            gap: "20px",
                            marginBottom: "28px",
                        }}
                    >
                        {/* 1. Total Approvals */}
                        <div
                            style={{
                                background: "#ffffff",
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0",
                                padding: "20px 24px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                            }}
                        >
                            <div style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>
                                Total Approvals
                            </div>
                            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", margin: "6px 0 8px 0" }}>
                                {kpis.total}
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: "#16a34a",
                                }}
                            >
                                <ArrowUpRight size={14} />
                                <span>{kpis.trends?.totalTrend || "13% vs last month"}</span>
                            </div>
                        </div>

                        {/* 2. Overdue */}
                        <div
                            style={{
                                background: "#ffffff",
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0",
                                padding: "20px 24px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                            }}
                        >
                            <div style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>
                                Overdue
                            </div>
                            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", margin: "6px 0 8px 0" }}>
                                {kpis.overdue}
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: "#dc2626",
                                }}
                            >
                                <ArrowUpRight size={14} />
                                <span>{kpis.trends?.overdueTrend || "24% vs last month"}</span>
                            </div>
                        </div>

                        {/* 3. In-Review */}
                        <div
                            style={{
                                background: "#ffffff",
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0",
                                padding: "20px 24px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                            }}
                        >
                            <div style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>
                                In-Review
                            </div>
                            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", margin: "6px 0 8px 0" }}>
                                {kpis.inReview}
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: "#16a34a",
                                }}
                            >
                                <ArrowUpRight size={14} />
                                <span>{kpis.trends?.inReviewTrend || "13% vs yesterday"}</span>
                            </div>
                        </div>

                        {/* 4. Approved */}
                        <div
                            style={{
                                background: "#ffffff",
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0",
                                padding: "20px 24px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                            }}
                        >
                            <div style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>
                                Approved
                            </div>
                            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", margin: "6px 0 8px 0" }}>
                                {kpis.approved}
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: "#dc2626",
                                }}
                            >
                                <ArrowDownRight size={14} />
                                <span>{kpis.trends?.approvedTrend || "1 vs last month"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Error State */}
                    {error && (
                        <div
                            style={{
                                padding: "14px 18px",
                                borderRadius: "8px",
                                backgroundColor: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#b91c1c",
                                marginBottom: "20px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                fontSize: "13px",
                            }}
                        >
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

                    {/* APPROVALS TABLE matching Reference 4 */}
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                            overflow: "visible",
                        }}
                    >
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "#edf2f7", borderBottom: "1px solid #e2e8f0" }}>
                                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.04em" }}>
                                        APPROVAL NAME
                                    </th>
                                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.04em" }}>
                                        STAGE
                                    </th>
                                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.04em" }}>
                                        REQUESTED BY
                                    </th>
                                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.04em" }}>
                                        STAGE
                                    </th>
                                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.04em" }}>
                                        DUE DATE
                                    </th>
                                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.04em" }}>
                                        REQUESTED DATE
                                    </th>
                                    <th style={{ padding: "14px 20px", textAlign: "right", fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.04em" }}>
                                        <span className="sr-only">ACTIONS</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "60px 16px" }}>
                                            <Loader2 className="animate-spin" size={32} color="#2563EB" style={{ margin: "0 auto 10px auto" }} />
                                            <div style={{ color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
                                                Loading approvals...
                                            </div>
                                        </td>
                                    </tr>
                                ) : approvals.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "64px 16px" }}>
                                            <div style={{ maxWidth: "360px", margin: "0 auto" }}>
                                                <CheckCircle2 size={42} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
                                                <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>
                                                    No Approvals Found
                                                </h4>
                                                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                                    {searchQuery ? "No approval requests match your search criteria." : "All approval requests are up to date."}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    approvals.map((appr) => {
                                        const stageStyle = getStageBadgeStyle(appr.stage);
                                        const statusStyle = getStatusBadgeStyle(appr.status);
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
                                                style={{
                                                    cursor: "pointer",
                                                    borderBottom: "1px solid #f1f5f9",
                                                    transition: "background-color 0.1s ease",
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                            >
                                                {/* APPROVAL NAME */}
                                                <td style={{ padding: "16px 20px" }}>
                                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                                                        {appr.title}
                                                    </div>
                                                </td>

                                                {/* STAGE (Design pill) */}
                                                <td style={{ padding: "16px 16px" }}>
                                                    <span
                                                        style={{
                                                            display: "inline-block",
                                                            padding: "3px 10px",
                                                            borderRadius: "999px",
                                                            backgroundColor: stageStyle.bg,
                                                            color: stageStyle.color,
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                            letterSpacing: "0.04em",
                                                        }}
                                                    >
                                                        {stageStyle.label}
                                                    </span>
                                                </td>

                                                {/* REQUESTED BY */}
                                                <td style={{ padding: "16px 16px" }}>
                                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                                                        {requesterName}
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", marginTop: "1px" }}>
                                                        {requesterRole}
                                                    </div>
                                                </td>

                                                {/* STAGE / STATUS (Pill e.g. YET-TO APPROVE / APPROVED) */}
                                                <td style={{ padding: "16px 16px" }}>
                                                    <span
                                                        style={{
                                                            display: "inline-block",
                                                            padding: "3px 10px",
                                                            borderRadius: "999px",
                                                            backgroundColor: statusStyle.bg,
                                                            color: statusStyle.color,
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                            letterSpacing: "0.04em",
                                                        }}
                                                    >
                                                        {statusStyle.label}
                                                    </span>
                                                </td>

                                                {/* DUE DATE */}
                                                <td style={{ padding: "16px 16px" }}>
                                                    <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: 500 }}>
                                                        {dueDateInfo.text}
                                                    </div>
                                                    {dueDateInfo.subtext && (
                                                        <div
                                                            style={{
                                                                fontSize: "12px",
                                                                color: dueDateInfo.isOverdue ? "#dc2626" : "#64748b",
                                                                fontWeight: dueDateInfo.isOverdue ? 600 : 400,
                                                                marginTop: "1px",
                                                            }}
                                                        >
                                                            {dueDateInfo.subtext}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* REQUESTED DATE */}
                                                <td style={{ padding: "16px 16px", fontSize: "13px", color: "#0f172a" }}>
                                                    {formatDate(appr.requestedAt)}
                                                </td>

                                                {/* ACTIONS */}
                                                <td
                                                    style={{ padding: "16px 20px", textAlign: "right", position: "relative" }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        aria-label="Approval options"
                                                        onClick={() => setActiveMenuId(activeMenuId === appr.id ? null : appr.id)}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "#64748b",
                                                            cursor: "pointer",
                                                            padding: "6px",
                                                            borderRadius: "6px",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>

                                                    {/* Floating Action Menu Popover matching Reference 1 & 4 */}
                                                    {activeMenuId === appr.id && (
                                                        <div
                                                            ref={menuRef}
                                                            style={{
                                                                position: "absolute",
                                                                right: "20px",
                                                                top: "calc(100% - 6px)",
                                                                backgroundColor: "#ffffff",
                                                                borderRadius: "8px",
                                                                border: "1px solid #e2e8f0",
                                                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
                                                                zIndex: 40,
                                                                minWidth: "160px",
                                                                padding: "4px 0",
                                                                textAlign: "left",
                                                            }}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenDrawer(appr)}
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "8px",
                                                                    width: "100%",
                                                                    padding: "8px 14px",
                                                                    background: "none",
                                                                    border: "none",
                                                                    fontSize: "13px",
                                                                    color: "#0f172a",
                                                                    cursor: "pointer",
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                <Eye size={15} color="#64748b" />
                                                                View Approval
                                                            </button>

                                                            {isPending && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuickAction(appr, "approved")}
                                                                        style={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: "8px",
                                                                            width: "100%",
                                                                            padding: "8px 14px",
                                                                            background: "none",
                                                                            border: "none",
                                                                            fontSize: "13px",
                                                                            color: "#16a34a",
                                                                            cursor: "pointer",
                                                                            fontWeight: 500,
                                                                        }}
                                                                    >
                                                                        <CheckCircle2 size={15} color="#16a34a" />
                                                                        Approve
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuickAction(appr, "changes_required")}
                                                                        style={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: "8px",
                                                                            width: "100%",
                                                                            padding: "8px 14px",
                                                                            background: "none",
                                                                            border: "none",
                                                                            fontSize: "13px",
                                                                            color: "#b45309",
                                                                            cursor: "pointer",
                                                                            fontWeight: 500,
                                                                        }}
                                                                    >
                                                                        <AlertCircle size={15} color="#b45309" />
                                                                        Request Changes
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuickAction(appr, "rejected")}
                                                                        style={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: "8px",
                                                                            width: "100%",
                                                                            padding: "8px 14px",
                                                                            background: "none",
                                                                            border: "none",
                                                                            fontSize: "13px",
                                                                            color: "#dc2626",
                                                                            cursor: "pointer",
                                                                            fontWeight: 500,
                                                                        }}
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

                    {/* PAGINATION BAR matching Reference 4 */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: "24px",
                            padding: "0 4px",
                        }}
                    >
                        {/* Total Approvals */}
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                            Total Approvals: {total > 0 ? total : "NA"}
                        </div>

                        {/* Numeric Page Controls */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                aria-label="Previous page"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    background: "#ffffff",
                                    color: page <= 1 ? "#cbd5e1" : "#475569",
                                    cursor: page <= 1 ? "not-allowed" : "pointer",
                                }}
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
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "6px",
                                            border: isActive ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                                            background: "#ffffff",
                                            color: isActive ? "#2563eb" : "#475569",
                                            fontSize: "13px",
                                            fontWeight: isActive ? 700 : 500,
                                            cursor: "pointer",
                                        }}
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
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    background: "#ffffff",
                                    color: page >= totalPages ? "#cbd5e1" : "#475569",
                                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                                }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {/* Show per Page */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "13px", color: "#64748b" }}>Show per Page:</span>
                            <div style={{ position: "relative" }}>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    style={{
                                        appearance: "none",
                                        padding: "6px 28px 6px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        background: "#ffffff",
                                        fontSize: "13px",
                                        color: "#0f172a",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        outline: "none",
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
                </section>
            </div>

            {/* RIGHT-SIDE VIEW APPROVAL DRAWER matching Reference 5 */}
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
