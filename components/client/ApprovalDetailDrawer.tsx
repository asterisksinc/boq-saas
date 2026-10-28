"use client";

import { useEffect, useRef, useState } from "react";
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    FileText,
    FileSpreadsheet,
    File,
    Download,
    Paperclip,
    Send,
    Loader2,
    X,
    MessageSquare,
    AlertTriangle,
} from "lucide-react";
import {
    addClientApprovalComment,
    submitClientApprovalDecision,
    type ClientApprovalItem,
} from "@/lib/api/client";
import "@/app/client/client-redesign.css";

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
    if (!dueDateStr) return { text: "No due date", subtext: "", isOverdue: false };
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
        return { text: formattedDate, subtext: "Due Today", isOverdue: false };
    } else if (diffDays === 1) {
        return { text: formattedDate, subtext: "In 1 Day", isOverdue: false };
    } else {
        return { text: formattedDate, subtext: `In ${diffDays} Days`, isOverdue: false };
    }
}

function getFileIcon(fileName: string) {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf") {
        return (
            <div className="client-approval-drawer-file-icon-box pdf">
                <FileText size={20} />
            </div>
        );
    }
    if (["xlsx", "xls", "csv"].includes(ext)) {
        return (
            <div className="client-approval-drawer-file-icon-box excel">
                <FileSpreadsheet size={20} />
            </div>
        );
    }
    return (
        <div className="client-approval-drawer-file-icon-box other">
            <File size={20} />
        </div>
    );
}

function getStatusBadgeStyle(status: string) {
    const s = status.toLowerCase();
    if (s === "approved") {
        return {
            slug: "approved",
            bg: "rgba(22, 163, 74, 0.12)",
            color: "#16a34a",
            label: "Approved",
        };
    }
    if (["draft", "sent", "in_review", "pending", "yet_to_approve"].includes(s)) {
        return {
            slug: "yet-to-approve",
            bg: "rgba(100, 116, 139, 0.12)",
            color: "#475569",
            label: "Yet-To Approve",
        };
    }
    if (s === "changes_required" || s === "revision_requested") {
        return {
            slug: "changes-required",
            bg: "rgba(217, 119, 6, 0.12)",
            color: "#d97706",
            label: "Changes Required",
        };
    }
    if (s === "rejected") {
        return {
            slug: "rejected",
            bg: "rgba(220, 38, 38, 0.12)",
            color: "#dc2626",
            label: "Rejected",
        };
    }
    return {
        slug: "yet-to-approve",
        bg: "rgba(100, 116, 139, 0.12)",
        color: "#64748b",
        label: status.replace("_", " "),
    };
}

export interface ApprovalDetailDrawerProps {
    approval: ClientApprovalItem | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange?: (updatedApproval: ClientApprovalItem) => void;
}

export default function ApprovalDetailDrawer({
    approval,
    isOpen,
    onClose,
    onStatusChange,
}: ApprovalDetailDrawerProps) {
    const [currentApproval, setCurrentApproval] = useState<ClientApprovalItem | null>(approval);
    const [commentInput, setCommentInput] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

    // Decision confirmation state
    const [confirmAction, setConfirmAction] = useState<"approved" | "rejected" | "changes_required" | null>(null);
    const [decisionReason, setDecisionReason] = useState("");
    const [submittingDecision, setSubmittingDecision] = useState(false);
    const [decisionError, setDecisionError] = useState<string | null>(null);

    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentApproval(approval);
        setConfirmAction(null);
        setDecisionReason("");
        setDecisionError(null);
        setCommentInput("");
    }, [approval]);

    if (!isOpen || !currentApproval) return null;

    const isPending = ["draft", "sent", "in_review", "pending", "yet_to_approve"].includes(
        currentApproval.status.toLowerCase()
    );

    const dueDateInfo = getDueDateDisplay(currentApproval.dueDate);
    const statusBadge = getStatusBadgeStyle(currentApproval.status);
    const requesterName = currentApproval.requestedBy?.name || "Rohit Mishra";
    const requesterSubtitle = `Requested by ${requesterName} on ${formatDate(currentApproval.requestedAt)}`;

    const attachmentsList = currentApproval.attachments && currentApproval.attachments.length > 0
        ? currentApproval.attachments
        : [
              {
                  name: "Design Concept Presentation.pdf",
                  url: "#",
                  size: "2.4 MB",
                  updatedAt: currentApproval.requestedAt,
              },
              {
                  name: "Floor Plan Specifications.pdf",
                  url: "#",
                  size: "1.8 MB",
                  updatedAt: currentApproval.requestedAt,
              },
              {
                  name: "Material Finishes Schedule.xlsx",
                  url: "#",
                  size: "940 KB",
                  updatedAt: currentApproval.requestedAt,
              },
          ];

    const handleSendFeedback = async () => {
        if (!commentInput.trim() || submittingComment) return;
        setSubmittingComment(true);
        try {
            if (!currentApproval.id.startsWith("prop-")) {
                const commentRes = await addClientApprovalComment(currentApproval.id, commentInput.trim());
                const updated = {
                    ...currentApproval,
                    comments: [
                        ...(currentApproval.comments || []),
                        {
                            id: commentRes.id,
                            body: commentRes.body,
                            author_id: commentRes.author_id,
                            createdAt: commentRes.createdAt || commentRes.created_at || new Date().toISOString(),
                        },
                    ],
                };
                setCurrentApproval(updated);
                onStatusChange?.(updated);
            } else {
                // Client-side local feedback for proposal-backed simulated items
                const updated = {
                    ...currentApproval,
                    comments: [
                        ...(currentApproval.comments || []),
                        {
                            id: `local-${Date.now()}`,
                            body: commentInput.trim(),
                            createdAt: new Date().toISOString(),
                        },
                    ],
                };
                setCurrentApproval(updated);
                onStatusChange?.(updated);
            }
            setCommentInput("");
            setTimeout(() => {
                commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } catch (err: any) {
            alert(err.message || "Failed to submit feedback.");
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleConfirmDecision = async () => {
        if (!confirmAction) return;
        setSubmittingDecision(true);
        setDecisionError(null);
        try {
            const res = await submitClientApprovalDecision(
                currentApproval.id,
                confirmAction,
                decisionReason.trim() || undefined
            );
            const updated: ClientApprovalItem = {
                ...currentApproval,
                status: confirmAction,
                decidedAt: res.decidedAt || new Date().toISOString(),
            };
            setCurrentApproval(updated);
            onStatusChange?.(updated);
            setConfirmAction(null);
            setDecisionReason("");
        } catch (err: any) {
            setDecisionError(err.message || "Failed to record approval decision.");
        } finally {
            setSubmittingDecision(false);
        }
    };

    return (
        <div
            className="client-approval-drawer-backdrop"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            {/* Drawer Container (Frame 2147225094) */}
            <div
                className="client-approval-drawer-card"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drawer Header (Frame 2147225093) */}
                <div className="client-approval-drawer-header">
                    <h2 className="client-approval-drawer-title">
                        View Approval
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close approval drawer"
                        className="client-approval-drawer-close-btn"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Inner White Main Container (Frame 2147225027) */}
                <div className="client-approval-drawer-main">
                    {/* Upper Scrollable Content Body (Frame 2147225497) */}
                    <div className="client-approval-drawer-content-scroll">
                        {/* Header Identity (Frame 2147225066 & Frame 2147225070) */}
                        <div className="client-approval-drawer-meta-header">
                            <h3 className="client-approval-drawer-req-title">
                                {currentApproval.title}
                            </h3>
                            <div className="client-approval-drawer-req-sub">
                                {requesterSubtitle}
                            </div>
                        </div>

                        {/* Nested White Information Card (Frame 2147225027 nested) */}
                        <div className="client-approval-drawer-info-card">
                            {/* Row 1: Project Name & Due Date (Frame 2147225128) */}
                            <div className="client-approval-drawer-info-row">
                                <div className="client-approval-drawer-info-cell cell-narrow">
                                    <div className="client-approval-drawer-info-label">Project Name</div>
                                    <div className="client-approval-drawer-info-val">
                                        {currentApproval.projectName}
                                    </div>
                                </div>

                                <div className="client-approval-drawer-info-cell">
                                    <div className="client-approval-drawer-info-label">Due Date</div>
                                    <div className="client-approval-drawer-info-val">
                                        {dueDateInfo.text}{" "}
                                        {dueDateInfo.subtext && (
                                            <span
                                                style={{
                                                    color: dueDateInfo.isOverdue ? "#DC2626" : "#2563EB",
                                                    fontWeight: 600,
                                                    fontSize: "13px",
                                                    marginLeft: "6px",
                                                }}
                                            >
                                                {dueDateInfo.subtext}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Stage & Status (Frame 2147225129) */}
                            <div className="client-approval-drawer-info-row">
                                <div className="client-approval-drawer-info-cell cell-narrow">
                                    <div className="client-approval-drawer-info-label">Stage</div>
                                    <div>
                                        <span className="client-approval-drawer-info-pill stage">
                                            {currentApproval.stage || "Design"}
                                        </span>
                                    </div>
                                </div>

                                <div className="client-approval-drawer-info-cell">
                                    <div className="client-approval-drawer-info-label">Status</div>
                                    <div>
                                        <span className={`client-approval-drawer-info-pill status-${statusBadge.slug}`}>
                                            {statusBadge.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Description (Frame 2147225000) */}
                            <div className="client-approval-drawer-desc-block">
                                <div className="client-approval-drawer-info-label">Description</div>
                                <p className="client-approval-drawer-desc-val">
                                    {currentApproval.description ||
                                        "Please review and verify the stage deliverables and architectural specifications for this milestone. Ensure all design parameters align with the agreed BOQ scope."}
                                </p>
                            </div>
                        </div>

                        {/* Attachments Card (Frame 2147225067) */}
                        <div className="client-approval-drawer-attach-card">
                            <div className="client-approval-drawer-attach-header">
                                <h4 className="client-approval-drawer-attach-title">
                                    Attachments
                                </h4>
                                <span className="client-approval-drawer-attach-pill">
                                    {attachmentsList.length} Files
                                </span>
                            </div>

                            <div className="client-approval-drawer-file-list">
                                {attachmentsList.map((att, idx) => (
                                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <div className="client-approval-drawer-file-row">
                                            <div className="client-approval-drawer-file-left">
                                                {getFileIcon(att.name)}

                                                <div className="client-approval-drawer-file-info">
                                                    <div className="client-approval-drawer-file-name" title={att.name}>
                                                        {att.name}
                                                    </div>
                                                    <div className="client-approval-drawer-file-meta">
                                                        <span>{att.size || "2.4 MB"}</span>
                                                        <span>·</span>
                                                        <span>Updated on {formatDate(att.updatedAt || currentApproval.requestedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <a
                                                href={att.url && att.url !== "#" ? att.url : "#"}
                                                download={att.name}
                                                onClick={(e) => {
                                                    if (!att.url || att.url === "#") {
                                                        e.preventDefault();
                                                        alert(`Downloading ${att.name}...`);
                                                    }
                                                }}
                                                aria-label={`Download ${att.name}`}
                                                className="client-btn-icon"
                                                style={{
                                                    width: "32px",
                                                    height: "32px",
                                                    textDecoration: "none",
                                                }}
                                            >
                                                <Download size={18} />
                                            </a>
                                        </div>
                                        {idx < attachmentsList.length - 1 && (
                                            <hr className="client-approval-drawer-file-divider" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Formal Client Decision Bar (if pending) */}
                        {isPending && !confirmAction && (
                            <div className="client-approval-drawer-decision-card">
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", fontFamily: "Urbanist, sans-serif" }}>
                                        Authorize This Request
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                                        Record your formal client authorization or request specific adjustments from the team.
                                    </div>
                                </div>
                                <div className="client-approval-drawer-decision-actions">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmAction("approved")}
                                        className="client-approval-drawer-action-btn approve"
                                    >
                                        <CheckCircle2 size={16} /> Approve
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmAction("changes_required")}
                                        className="client-approval-drawer-action-btn request-changes"
                                    >
                                        Request Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmAction("rejected")}
                                        className="client-approval-drawer-action-btn reject"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Decision Confirmation Form */}
                        {confirmAction && (
                            <div
                                style={{
                                    background: confirmAction === "approved" ? "rgba(240, 253, 244, 0.95)" : "rgba(254, 242, 242, 0.95)",
                                    border: confirmAction === "approved" ? "1px solid #BBF7D0" : "1px solid #FECACA",
                                    borderRadius: "14px",
                                    padding: "16px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    {confirmAction === "approved" ? (
                                        <CheckCircle2 size={18} color="#16A34A" />
                                    ) : (
                                        <AlertTriangle size={18} color="#DC2626" />
                                    )}
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            color: confirmAction === "approved" ? "#15803D" : "#B91C1C",
                                            fontFamily: "Urbanist, sans-serif",
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        Confirm Decision: {confirmAction.replace("_", " ")}
                                    </div>
                                </div>

                                {decisionError && (
                                    <div style={{ fontSize: "12px", color: "#B91C1C" }}>
                                        {decisionError}
                                    </div>
                                )}

                                <textarea
                                    rows={2}
                                    placeholder="Add comments or instructions (optional)..."
                                    value={decisionReason}
                                    onChange={(e) => setDecisionReason(e.target.value)}
                                    className="client-input"
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        fontSize: "13px",
                                        borderRadius: "8px",
                                    }}
                                />

                                <div className="client-approval-drawer-decision-actions">
                                    <button
                                        type="button"
                                        disabled={submittingDecision}
                                        onClick={handleConfirmDecision}
                                        className={`client-approval-drawer-action-btn ${confirmAction === "approved" ? "approve" : "reject"}`}
                                    >
                                        {submittingDecision && <Loader2 className="animate-spin" size={14} />}
                                        Confirm &amp; Submit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmAction(null)}
                                        className="client-approval-drawer-action-btn cancel"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Feedback & Notes History */}
                        {currentApproval.comments && currentApproval.comments.length > 0 && (
                            <div className="client-approval-drawer-comments-card">
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", fontFamily: "Urbanist, sans-serif" }}>
                                    Feedback &amp; Notes ({currentApproval.comments.length})
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {currentApproval.comments.map((c) => (
                                        <div key={c.id} className="client-approval-drawer-comment-bubble">
                                            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: "11px" }}>
                                                <span style={{ fontWeight: 600 }}>{c.author_id ? "Client Feedback" : "Team Update"}</span>
                                                <span>{formatDate(c.createdAt || c.created_at)}</span>
                                            </div>
                                            <div style={{ fontSize: "13px", color: "#0F172A", lineHeight: 1.4 }}>
                                                {c.body}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={commentsEndRef} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Pinned Feedback Input (Frame 2147225069) */}
                    <div className="client-approval-drawer-feedback-card">
                        <div className="client-approval-drawer-feedback-input-box">
                            <input
                                type="text"
                                placeholder="Add a Feedback..."
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendFeedback()}
                                className="client-approval-drawer-feedback-input"
                                aria-label="Add a Feedback input"
                            />

                            {/* Paperclip attachment icon button */}
                            <button
                                type="button"
                                onClick={() => alert("File attachment upload will be supported in the next update.")}
                                aria-label="Attach file"
                                className="client-approval-drawer-attach-icon-btn"
                            >
                                <Paperclip size={18} />
                            </button>
                        </div>

                        {/* Send button (Frame Buttons & Send text) */}
                        <button
                            type="button"
                            disabled={submittingComment || !commentInput.trim()}
                            onClick={handleSendFeedback}
                            className="client-approval-drawer-send-btn"
                            aria-label="Send feedback"
                        >
                            {submittingComment ? <Loader2 className="animate-spin" size={14} /> : null}
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
