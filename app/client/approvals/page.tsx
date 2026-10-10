"use client";

import { useCallback, useEffect, useState } from "react";
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    FileText,
    MessageSquare,
    Send,
    Loader2,
    RefreshCw,
    Search,
    Paperclip,
    ExternalLink,
    HelpCircle,
    ShieldAlert,
} from "lucide-react";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import {
    listClientApprovals,
    submitClientApprovalDecision,
    addClientApprovalComment,
    listClientProjects,
    type ClientApprovalItem,
    type ClientProjectDetails,
} from "@/lib/api/client";

function formatDate(dateStr?: string | null) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export default function ClientApprovalsPage() {
    const [approvals, setApprovals] = useState<ClientApprovalItem[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [decidedCount, setDecidedCount] = useState(0);
    const [projects, setProjects] = useState<ClientProjectDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");

    // Active approval for detail / review modal
    const [activeApproval, setActiveApproval] = useState<ClientApprovalItem | null>(null);
    const [decisionLoading, setDecisionLoading] = useState(false);
    const [decisionError, setDecisionError] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<"approved" | "rejected" | "changes_required" | null>(null);
    const [commentText, setCommentText] = useState("");
    const [newCommentBody, setNewCommentBody] = useState("");
    const [commentSubmitting, setCommentSubmitting] = useState(false);

    const loadProjects = useCallback(async () => {
        try {
            const res = await listClientProjects();
            setProjects(res.items || []);
        } catch {
            // Ignore error
        }
    }, []);

    const loadApprovals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listClientApprovals({
                projectId: selectedProjectId || undefined,
            });
            setApprovals(res.items || []);
            setPendingCount(res.pendingCount || 0);
            setDecidedCount(res.decidedCount || 0);
        } catch (err: any) {
            setError(err.message || "Failed to load approval requests.");
        } finally {
            setLoading(false);
        }
    }, [selectedProjectId]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    useEffect(() => {
        loadApprovals();
    }, [loadApprovals]);

    const handleConfirmDecision = async () => {
        if (!activeApproval || !confirmAction) return;
        setDecisionLoading(true);
        setDecisionError(null);
        try {
            await submitClientApprovalDecision(activeApproval.id, confirmAction, commentText || undefined);
            setConfirmAction(null);
            setCommentText("");
            setActiveApproval(null);
            await loadApprovals();
        } catch (err: any) {
            setDecisionError(err.message || "Failed to submit decision.");
        } finally {
            setDecisionLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!activeApproval || !newCommentBody.trim() || activeApproval.id.startsWith("prop-")) return;
        setCommentSubmitting(true);
        try {
            const newComment = await addClientApprovalComment(activeApproval.id, newCommentBody.trim());
            setActiveApproval({
                ...activeApproval,
                comments: [...activeApproval.comments, newComment],
            });
            setNewCommentBody("");
        } catch (err: any) {
            alert(err.message || "Could not add comment.");
        } finally {
            setCommentSubmitting(false);
        }
    };

    const filteredApprovals = approvals.filter((item) => {
        const matchesSearch =
            !searchQuery ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStatus = true;
        if (statusFilter === "PENDING") {
            matchesStatus = ["draft", "sent", "in_review", "pending"].includes(item.status);
        } else if (statusFilter === "APPROVED") {
            matchesStatus = item.status === "approved";
        } else if (statusFilter === "REJECTED") {
            matchesStatus = item.status === "rejected" || item.status === "changes_required";
        }

        return matchesSearch && matchesStatus;
    });

    return (
        <main className="fig-dashboard">
            <div className="fig-dashboard-glow" />

            <ClientDashboardRail current="/client/approvals" />

            <div className="fig-dashboard-main">
                <DashboardHeader
                    title="Approvals"
                    hideNew={true}
                    onSearch={(q) => setSearchQuery(q)}
                />

                <section style={{ padding: "24px 32px" }}>
                    {/* Header */}
                    <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                Approval Requests
                            </h2>
                            <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>
                                Review and authorize project stages, variations, proposals, and milestones
                            </p>
                        </div>

                        {/* Badges */}
                        <div style={{ display: "flex", gap: "10px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: "#fffbeb",
                                    border: "1px solid #fef3c7",
                                    borderRadius: "8px",
                                    padding: "6px 12px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#b45309",
                                }}
                            >
                                <Clock size={15} /> {pendingCount} Pending Action
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                    borderRadius: "8px",
                                    padding: "6px 12px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#15803d",
                                }}
                            >
                                <CheckCircle2 size={15} /> {decidedCount} Decided
                            </div>
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
                        {/* Status tabs */}
                        <div style={{ display: "flex", gap: "8px" }}>
                            {[
                                { key: "ALL", label: "All Requests" },
                                { key: "PENDING", label: `Pending (${pendingCount})` },
                                { key: "APPROVED", label: "Approved" },
                                { key: "REJECTED", label: "Rejected / Changes" },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setStatusFilter(tab.key)}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        border: statusFilter === tab.key ? "1px solid #2563eb" : "1px solid #e2e8f0",
                                        backgroundColor: statusFilter === tab.key ? "#eff6ff" : "#ffffff",
                                        color: statusFilter === tab.key ? "#2563eb" : "#64748b",
                                        cursor: "pointer",
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Project selector */}
                        {projects.length > 1 && (
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
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

                    {/* Error State */}
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

                    {/* Approvals Table */}
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            overflow: "hidden",
                        }}
                    >
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>REQUEST</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>PROJECT</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>SUBMITTED</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>DUE DATE</th>
                                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>STATUS</th>
                                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px" }}>
                                            <Loader2 className="animate-spin" size={32} color="#2563EB" style={{ margin: "0 auto 8px auto" }} />
                                            <div style={{ color: "#64748b", fontSize: "14px" }}>Loading approval requests...</div>
                                        </td>
                                    </tr>
                                ) : filteredApprovals.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: "center", padding: "56px 16px" }}>
                                            <div style={{ maxWidth: "360px", margin: "0 auto" }}>
                                                <CheckCircle2 size={40} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
                                                <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>
                                                    No Approvals Pending
                                                </h4>
                                                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                                    {searchQuery || statusFilter !== "ALL"
                                                        ? "No approval requests match your active filter criteria."
                                                        : "You are all caught up! No items currently require your authorization."}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApprovals.map((appr) => {
                                        const isPending = ["draft", "sent", "in_review", "pending"].includes(appr.status);
                                        return (
                                            <tr
                                                key={appr.id}
                                                onClick={() => setActiveApproval(appr)}
                                                style={{ cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                                            >
                                                <td style={{ padding: "14px 16px" }}>
                                                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{appr.title}</div>
                                                    {appr.description && (
                                                        <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px", maxWidth: "420px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                            {appr.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: "14px 16px", fontWeight: 500, color: "#334155" }}>
                                                    {appr.projectName}
                                                </td>
                                                <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>
                                                    {formatDate(appr.requestedAt)}
                                                </td>
                                                <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>
                                                    {formatDate(appr.dueDate)}
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                                    <span
                                                        style={{
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            padding: "4px 10px",
                                                            borderRadius: "999px",
                                                            backgroundColor:
                                                                appr.status === "approved"
                                                                    ? "#dcfce7"
                                                                    : isPending
                                                                    ? "#fef9c3"
                                                                    : "#fee2e2",
                                                            color:
                                                                appr.status === "approved"
                                                                    ? "#15803d"
                                                                    : isPending
                                                                    ? "#854d0e"
                                                                    : "#b91c1c",
                                                            textTransform: "capitalize",
                                                        }}
                                                    >
                                                        {appr.status.replace("_", " ")}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveApproval(appr)}
                                                        style={{
                                                            padding: "6px 14px",
                                                            borderRadius: "6px",
                                                            border: isPending ? "none" : "1px solid #cbd5e1",
                                                            background: isPending ? "#2563eb" : "#ffffff",
                                                            color: isPending ? "#ffffff" : "#334155",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {isPending ? "Review & Act" : "View History"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Approval Detail & Decision Modal */}
            {activeApproval && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 60,
                        padding: "20px",
                    }}
                >
                    <div
                        style={{
                            maxWidth: "680px",
                            width: "100%",
                            maxHeight: "90vh",
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: "20px 24px",
                                borderBottom: "1px solid #e2e8f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                    {activeApproval.title}
                                </h3>
                                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                                    Project: <strong>{activeApproval.projectName}</strong>
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    backgroundColor:
                                        activeApproval.status === "approved"
                                            ? "#dcfce7"
                                            : ["draft", "sent", "in_review", "pending"].includes(activeApproval.status)
                                            ? "#fef9c3"
                                            : "#fee2e2",
                                    color:
                                        activeApproval.status === "approved"
                                            ? "#15803d"
                                            : ["draft", "sent", "in_review", "pending"].includes(activeApproval.status)
                                            ? "#854d0e"
                                            : "#b91c1c",
                                    textTransform: "capitalize",
                                }}
                            >
                                {activeApproval.status.replace("_", " ")}
                            </span>
                        </div>

                        {/* Content */}
                        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                            {decisionError && (
                                <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
                                    {decisionError}
                                </div>
                            )}

                            {/* Description block */}
                            <div style={{ marginBottom: "20px" }}>
                                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>
                                    Details &amp; Context
                                </h4>
                                <div
                                    style={{
                                        padding: "14px",
                                        background: "#f8fafc",
                                        borderRadius: "8px",
                                        border: "1px solid #e2e8f0",
                                        fontSize: "14px",
                                        color: "#334155",
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {activeApproval.description || "No specific instructions provided."}
                                </div>
                            </div>

                            {/* Meta info */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                                <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "12px", color: "#64748b" }}>Date Requested</div>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                        {formatDate(activeApproval.requestedAt)}
                                    </div>
                                </div>
                                <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "12px", color: "#64748b" }}>Due Date</div>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                        {formatDate(activeApproval.dueDate)}
                                    </div>
                                </div>
                            </div>

                            {/* Attachments */}
                            {activeApproval.attachments && activeApproval.attachments.length > 0 && (
                                <div style={{ marginBottom: "20px" }}>
                                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "8px" }}>
                                        Attached Documents
                                    </h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {activeApproval.attachments.map((att, idx) => (
                                            <a
                                                key={idx}
                                                href={att.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "10px",
                                                    padding: "10px 14px",
                                                    background: "#f8fafc",
                                                    borderRadius: "8px",
                                                    border: "1px solid #cbd5e1",
                                                    textDecoration: "none",
                                                    color: "#2563eb",
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <Paperclip size={16} />
                                                <span>{att.name}</span>
                                                <ExternalLink size={14} style={{ marginLeft: "auto" }} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Confirmation Banner for Consequential Decision */}
                            {confirmAction && (
                                <div
                                    style={{
                                        background: confirmAction === "approved" ? "#f0fdf4" : "#fef2f2",
                                        border: confirmAction === "approved" ? "1px solid #bbf7d0" : "1px solid #fecaca",
                                        borderRadius: "10px",
                                        padding: "16px",
                                        marginBottom: "20px",
                                    }}
                                >
                                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: confirmAction === "approved" ? "#166534" : "#b91c1c", margin: "0 0 6px 0" }}>
                                        Confirm Your Decision: {confirmAction.replace("_", " ").toUpperCase()}
                                    </h4>
                                    <p style={{ fontSize: "13px", color: confirmAction === "approved" ? "#15803d" : "#b91c1c", margin: "0 0 12px 0" }}>
                                        This action will record your formal decision on the audit trail.
                                    </p>

                                    <textarea
                                        rows={2}
                                        placeholder="Add an optional comment or explanation with your decision..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "13px",
                                            boxSizing: "border-box",
                                            marginBottom: "12px",
                                            outline: "none",
                                        }}
                                    />

                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            type="button"
                                            disabled={decisionLoading}
                                            onClick={handleConfirmDecision}
                                            style={{
                                                padding: "8px 16px",
                                                borderRadius: "6px",
                                                border: "none",
                                                backgroundColor: confirmAction === "approved" ? "#16a34a" : "#dc2626",
                                                color: "#ffffff",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                cursor: decisionLoading ? "not-allowed" : "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px",
                                            }}
                                        >
                                            {decisionLoading && <Loader2 className="animate-spin" size={14} />}
                                            Confirm &amp; Submit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmAction(null)}
                                            style={{
                                                padding: "8px 14px",
                                                borderRadius: "6px",
                                                border: "1px solid #cbd5e1",
                                                backgroundColor: "#ffffff",
                                                color: "#475569",
                                                fontSize: "13px",
                                                fontWeight: 500,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Discussion & Comments */}
                            <div>
                                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "8px" }}>
                                    Discussion History ({activeApproval.comments.length})
                                </h4>
                                {activeApproval.comments.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                                        {activeApproval.comments.map((c) => (
                                            <div
                                                key={c.id}
                                                style={{
                                                    padding: "10px 14px",
                                                    background: "#f8fafc",
                                                    borderRadius: "8px",
                                                    border: "1px solid #e2e8f0",
                                                    fontSize: "13px",
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>
                                                    <span>Author: {c.author_id ? "Team Member" : "System"}</span>
                                                    <span>{formatDate(c.created_at)}</span>
                                                </div>
                                                <div style={{ color: "#1e293b" }}>{c.body}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "16px" }}>
                                        No comments recorded yet.
                                    </div>
                                )}

                                {!activeApproval.id.startsWith("prop-") && (
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <input
                                            type="text"
                                            placeholder="Ask a clarification question or add note..."
                                            value={newCommentBody}
                                            onChange={(e) => setNewCommentBody(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                                            style={{
                                                flex: 1,
                                                padding: "8px 12px",
                                                borderRadius: "6px",
                                                border: "1px solid #cbd5e1",
                                                fontSize: "13px",
                                                outline: "none",
                                            }}
                                        />
                                        <button
                                            type="button"
                                            disabled={commentSubmitting || !newCommentBody.trim()}
                                            onClick={handleAddComment}
                                            style={{
                                                padding: "8px 14px",
                                                borderRadius: "6px",
                                                border: "none",
                                                backgroundColor: "#2563eb",
                                                color: "#ffffff",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                cursor: commentSubmitting || !newCommentBody.trim() ? "not-allowed" : "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "4px",
                                            }}
                                        >
                                            <Send size={14} /> Send
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div
                            style={{
                                padding: "16px 24px",
                                borderTop: "1px solid #e2e8f0",
                                display: "flex",
                                justifyContent: "space-between",
                                background: "#f8fafc",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveApproval(null);
                                    setConfirmAction(null);
                                }}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    background: "#ffffff",
                                    color: "#475569",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                }}
                            >
                                Close
                            </button>

                            {["draft", "sent", "in_review", "pending"].includes(activeApproval.status) && !confirmAction && (
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmAction("changes_required")}
                                        style={{
                                            padding: "8px 14px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            background: "#ffffff",
                                            color: "#d97706",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Request Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmAction("rejected")}
                                        style={{
                                            padding: "8px 14px",
                                            borderRadius: "8px",
                                            border: "none",
                                            background: "#ef4444",
                                            color: "#ffffff",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmAction("approved")}
                                        style={{
                                            padding: "8px 18px",
                                            borderRadius: "8px",
                                            border: "none",
                                            background: "#16a34a",
                                            color: "#ffffff",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <CheckCircle2 size={15} /> Approve
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
