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
    // Normalize to midnight
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
            <div
                style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#fef2f2",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <FileText size={20} />
            </div>
        );
    }
    if (["xlsx", "xls", "csv"].includes(ext)) {
        return (
            <div
                style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#f0fdf4",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <FileSpreadsheet size={20} />
            </div>
        );
    }
    return (
        <div
            style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#f1f5f9",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
            }}
        >
            <File size={20} />
        </div>
    );
}

function getStatusBadgeStyle(status: string) {
    const s = status.toLowerCase();
    if (s === "approved") {
        return {
            bg: "#dcfce7",
            color: "#16a34a",
            label: "Approved",
        };
    }
    if (["draft", "sent", "in_review", "pending", "yet_to_approve"].includes(s)) {
        return {
            bg: "#f1f5f9",
            color: "#475569",
            label: "Yet-To Approve",
        };
    }
    if (s === "changes_required" || s === "revision_requested") {
        return {
            bg: "#fef3c7",
            color: "#b45309",
            label: "Changes Required",
        };
    }
    if (s === "rejected") {
        return {
            bg: "#fee2e2",
            color: "#dc2626",
            label: "Rejected",
        };
    }
    return {
        bg: "#f1f5f9",
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
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.4)",
                backdropFilter: "blur(3px)",
                zIndex: 60,
                display: "flex",
                justifyContent: "flex-end",
            }}
            onClick={onClose}
        >
            {/* Drawer Container matching Reference 5 */}
            <div
                style={{
                    width: "100%",
                    maxWidth: "620px",
                    height: "100%",
                    backgroundColor: "#ffffff",
                    boxShadow: "-10px 0 25px -5px rgba(0, 0, 0, 0.15)",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drawer Header */}
                <div
                    style={{
                        padding: "20px 28px",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "#ffffff",
                    }}
                >
                    <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        View Approval
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close approval drawer"
                        style={{
                            background: "none",
                            border: "none",
                            padding: "6px",
                            cursor: "pointer",
                            color: "#64748b",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background-color 0.15s ease",
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content Body */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "24px 28px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "24px",
                    }}
                >
                    {/* Main Approval Card matching Reference 5 */}
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            padding: "24px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        }}
                    >
                        {/* Title & Requester */}
                        <div>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                {currentApproval.title}
                            </h3>
                            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                                {requesterSubtitle}
                            </div>
                        </div>

                        {/* Metadata 2x2 Grid */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "20px",
                                marginTop: "24px",
                                paddingBottom: "24px",
                                borderBottom: "1px solid #f1f5f9",
                            }}
                        >
                            <div>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>Project Name</div>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "4px" }}>
                                    {currentApproval.projectName}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>Due Date</div>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "4px" }}>
                                    {dueDateInfo.text}{" "}
                                    {dueDateInfo.subtext && (
                                        <span
                                            style={{
                                                color: dueDateInfo.isOverdue ? "#dc2626" : "#2563eb",
                                                fontWeight: 500,
                                                fontSize: "13px",
                                                marginLeft: "4px",
                                            }}
                                        >
                                            {dueDateInfo.subtext}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>Stage</div>
                                <div style={{ marginTop: "6px" }}>
                                    <span
                                        style={{
                                            display: "inline-block",
                                            padding: "3px 10px",
                                            borderRadius: "999px",
                                            backgroundColor: "#e0f2fe",
                                            color: "#0369a1",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        {currentApproval.stage || "Design"}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>Status</div>
                                <div style={{ marginTop: "6px" }}>
                                    <span
                                        style={{
                                            display: "inline-block",
                                            padding: "3px 10px",
                                            borderRadius: "999px",
                                            backgroundColor: statusBadge.bg,
                                            color: statusBadge.color,
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        {statusBadge.label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div style={{ marginTop: "20px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "8px" }}>
                                Description
                            </div>
                            <p
                                style={{
                                    fontSize: "13px",
                                    lineHeight: 1.6,
                                    color: "#334155",
                                    margin: 0,
                                }}
                            >
                                {currentApproval.description ||
                                    "Please review and verify the stage deliverables and architectural specifications for this milestone. Ensure all design parameters align with the agreed BOQ scope."}
                            </p>
                        </div>
                    </div>

                    {/* Attachments Section matching Reference 5 */}
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "12px",
                            }}
                        >
                            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                Attachments
                            </h4>
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    padding: "2px 8px",
                                    borderRadius: "999px",
                                    background: "#f1f5f9",
                                    color: "#64748b",
                                }}
                            >
                                {attachmentsList.length} Files
                            </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {attachmentsList.map((att, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "12px 16px",
                                        borderRadius: "10px",
                                        border: "1px solid #e2e8f0",
                                        background: "#ffffff",
                                        gap: "14px",
                                        transition: "border-color 0.15s ease",
                                    }}
                                >
                                    {getFileIcon(att.name)}

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                color: "#0f172a",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {att.name}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                            {att.size || "2.4 MB"} · Updated on {formatDate(att.updatedAt || currentApproval.requestedAt)}
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
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "6px",
                                            color: "#475569",
                                            background: "#f8fafc",
                                            border: "1px solid #e2e8f0",
                                            cursor: "pointer",
                                            textDecoration: "none",
                                        }}
                                    >
                                        <Download size={15} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Formal Client Decision Bar (if pending) */}
                    {isPending && !confirmAction && (
                        <div
                            style={{
                                background: "#f8fafc",
                                borderRadius: "10px",
                                border: "1px solid #e2e8f0",
                                padding: "16px",
                            }}
                        >
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>
                                Authorize This Request
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>
                                Record your formal client authorization or request specific adjustments from the team.
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setConfirmAction("approved")}
                                    style={{
                                        flex: 1,
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "none",
                                        background: "#16a34a",
                                        color: "#ffffff",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "6px",
                                    }}
                                >
                                    <CheckCircle2 size={15} /> Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmAction("changes_required")}
                                    style={{
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        background: "#ffffff",
                                        color: "#b45309",
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
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #fecaca",
                                        background: "#ffffff",
                                        color: "#dc2626",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Decision Confirmation Modal banner */}
                    {confirmAction && (
                        <div
                            style={{
                                background: confirmAction === "approved" ? "#f0fdf4" : "#fef2f2",
                                border: confirmAction === "approved" ? "1px solid #bbf7d0" : "1px solid #fecaca",
                                borderRadius: "10px",
                                padding: "16px",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                {confirmAction === "approved" ? (
                                    <CheckCircle2 size={16} color="#16a34a" />
                                ) : (
                                    <AlertTriangle size={16} color="#dc2626" />
                                )}
                                <div
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        color: confirmAction === "approved" ? "#15803d" : "#b91c1c",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Confirm Decision: {confirmAction.replace("_", " ")}
                                </div>
                            </div>

                            {decisionError && (
                                <div style={{ fontSize: "12px", color: "#b91c1c", marginBottom: "8px" }}>
                                    {decisionError}
                                </div>
                            )}

                            <textarea
                                rows={2}
                                placeholder="Add comments or instructions (optional)..."
                                value={decisionReason}
                                onChange={(e) => setDecisionReason(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "13px",
                                    boxSizing: "border-box",
                                    marginBottom: "12px",
                                    outline: "none",
                                    background: "#ffffff",
                                }}
                            />

                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    type="button"
                                    disabled={submittingDecision}
                                    onClick={handleConfirmDecision}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: "6px",
                                        border: "none",
                                        background: confirmAction === "approved" ? "#16a34a" : "#dc2626",
                                        color: "#ffffff",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: submittingDecision ? "not-allowed" : "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                    }}
                                >
                                    {submittingDecision && <Loader2 className="animate-spin" size={14} />}
                                    Confirm &amp; Submit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmAction(null)}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        background: "#ffffff",
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

                    {/* Feedback & Discussion History */}
                    {currentApproval.comments && currentApproval.comments.length > 0 && (
                        <div>
                            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "10px" }}>
                                Feedback &amp; Notes ({currentApproval.comments.length})
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {currentApproval.comments.map((c) => (
                                    <div
                                        key={c.id}
                                        style={{
                                            padding: "10px 14px",
                                            background: "#f8fafc",
                                            borderRadius: "8px",
                                            border: "1px solid #e2e8f0",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>
                                            <span>{c.author_id ? "Client Feedback" : "Team Update"}</span>
                                            <span>{formatDate(c.createdAt || c.created_at)}</span>
                                        </div>
                                        <div style={{ fontSize: "13px", color: "#0f172a", lineHeight: 1.5 }}>
                                            {c.body}
                                        </div>
                                    </div>
                                ))}
                                <div ref={commentsEndRef} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Pinned Feedback Input matching Reference 5 */}
                <div
                    style={{
                        padding: "16px 28px",
                        borderTop: "1px solid #e2e8f0",
                        backgroundColor: "#ffffff",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            padding: "6px 8px 6px 14px",
                            backgroundColor: "#ffffff",
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Add a Feedback..."
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendFeedback()}
                            style={{
                                flex: 1,
                                border: "none",
                                outline: "none",
                                fontSize: "13px",
                                color: "#0f172a",
                                background: "transparent",
                            }}
                        />

                        {/* Paperclip attachment icon button */}
                        <button
                            type="button"
                            onClick={() => alert("File attachment upload will be supported in the next update.")}
                            aria-label="Attach file"
                            style={{
                                background: "none",
                                border: "none",
                                padding: "6px",
                                color: "#64748b",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Paperclip size={18} />
                        </button>

                        {/* Blue Send button */}
                        <button
                            type="button"
                            disabled={submittingComment || !commentInput.trim()}
                            onClick={handleSendFeedback}
                            style={{
                                padding: "8px 18px",
                                borderRadius: "8px",
                                border: "none",
                                background: commentInput.trim() ? "#2563eb" : "#94a3b8",
                                color: "#ffffff",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: commentInput.trim() && !submittingComment ? "pointer" : "not-allowed",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "background-color 0.15s ease",
                            }}
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
