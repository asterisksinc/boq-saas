"use client";

import React from "react";
import { Bookmark, ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import { SupportTicket, SupportTicketMessage } from "@/lib/api/auth";
import { formatDate, priorityConfig, statusConfig } from "./help-helpers";

export interface TicketDetailViewProps {
    ticket: SupportTicket;
    messages: SupportTicketMessage[];
    loadingMessages?: boolean;
    replyText: string;
    onReplyTextChange: (text: string) => void;
    onSendReply: () => void;
    sendingReply?: boolean;
    onUpdateStatus: (status: SupportTicket["status"]) => void;
    onResumeDraft?: (ticket: SupportTicket) => void;
    onBack: () => void;
}

export function TicketDetailView({
    ticket,
    messages,
    loadingMessages = false,
    replyText,
    onReplyTextChange,
    onSendReply,
    sendingReply = false,
    onUpdateStatus,
    onResumeDraft,
    onBack,
}: TicketDetailViewProps) {
    const priority = ticket.priority || "normal";
    const status = ticket.status || "open";
    const ticketNum = ticket.ticketNumber || ticket.ticket_number || ticket.id.slice(0, 8);
    const issueType = ticket.issueType || ticket.issue_type || "General";

    return (
        <div className="ticket-detail-view" style={{ maxWidth: "860px", margin: "0 auto", width: "100%" }}>
            <button
                type="button"
                className="help-back-btn"
                onClick={onBack}
            >
                <ChevronLeft size={16} /> Back to Support Tickets
            </button>

            <div
                style={{
                    background: "#FFFFFF",
                    borderRadius: "14px",
                    border: "1px solid #E2E8F0",
                    padding: "24px",
                    boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.06)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}
            >
                {ticket.status === "draft" && onResumeDraft && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 18px",
                            background: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            borderRadius: "10px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Bookmark size={18} color="#2563EB" />
                            <div>
                                <strong style={{ fontSize: "13.5px", color: "#1E40AF" }}>
                                    This ticket is currently saved as a draft.
                                </strong>
                                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#3B82F6" }}>
                                    You can resume the 7-step wizard to finish and submit your ticket.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="section-action-btn"
                            style={{ padding: "8px 16px", height: "36px", fontSize: "13px" }}
                            onClick={() => onResumeDraft(ticket)}
                        >
                            Resume Wizard <ChevronRight size={14} />
                        </button>
                    </div>
                )}

                <div className="ticket-header">
                    <div className="ticket-title">
                        <span className="ticket-number">{ticketNum}</span>
                        <h2>{ticket.subject}</h2>
                    </div>
                    <div className="ticket-badges">
                        <span
                            className="priority-badge"
                            style={{
                                background: priorityConfig[priority]?.bg,
                                color: priorityConfig[priority]?.color,
                            }}
                        >
                            {priorityConfig[priority]?.label || priority}
                        </span>
                        <span
                            className="status-badge"
                            style={{
                                background: statusConfig[status]?.bg,
                                color: statusConfig[status]?.color,
                            }}
                        >
                            {statusConfig[status]?.label || status}
                        </span>
                    </div>
                </div>

                <div className="ticket-meta">
                    <div>
                        <strong>Type:</strong> {issueType}
                    </div>
                    <div>
                        <strong>Created:</strong> {formatDate(ticket.createdAt || ticket.created_at)}
                    </div>
                    <div>
                        <strong>Updated:</strong> {formatDate(ticket.updatedAt || ticket.updated_at)}
                    </div>
                </div>

                <div className="ticket-description">
                    <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
                        Description
                    </h4>
                    <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>
                        {ticket.description}
                    </p>
                </div>

                {/* Status Update Buttons */}
                <div style={{ paddingTop: "14px", borderTop: "1px solid #F1F5F9" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748B", display: "block", marginBottom: "8px" }}>
                        Update Ticket Status:
                    </label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {(["open", "in_progress", "waiting_on_user", "resolved", "closed"] as const).map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={`status-btn ${ticket.status === s ? "active" : ""}`}
                                onClick={() => onUpdateStatus(s)}
                            >
                                {statusConfig[s]?.label || s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conversation Thread */}
                <div className="ticket-messages">
                    <h4 style={{ margin: "10px 0 4px", fontSize: "15px", fontWeight: "600", color: "#0F172A" }}>
                        Conversation History ({messages.length})
                    </h4>

                    {loadingMessages ? (
                        <div style={{ padding: "24px", textAlign: "center", color: "#64748B" }}>
                            <Loader2 size={20} className="spin" style={{ margin: "0 auto 8px", color: "#2563EB" }} />
                            <span>Loading messages...</span>
                        </div>
                    ) : (
                        <div className="messages-list">
                            {messages.map((msg) => (
                                <div key={msg.id} className="message">
                                    <div className="message-header">
                                        <span className="message-author">
                                            {(msg.authorId || msg.author_id || "User").slice(0, 8)}
                                        </span>
                                        <span className="message-time">
                                            {formatDate(msg.createdAt || msg.created_at)}
                                        </span>
                                    </div>
                                    <p>{msg.body}</p>
                                </div>
                            ))}
                            {messages.length === 0 && (
                                <p style={{ color: "#64748B", fontSize: "13px", padding: "16px 0", margin: 0 }}>
                                    No messages yet. Send a reply below.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Reply Box */}
                    <div className="reply-form" style={{ marginTop: "8px" }}>
                        <textarea
                            value={replyText}
                            onChange={(e) => onReplyTextChange(e.target.value)}
                            placeholder="Type your reply to our support team..."
                            rows={3}
                            className="reply-input"
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                className="btn-raise-ticket"
                                style={{ height: "42px", padding: "0 20px" }}
                                onClick={onSendReply}
                                disabled={sendingReply || !replyText.trim()}
                            >
                                {sendingReply ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                                <span>Send Reply</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TicketDetailView;
