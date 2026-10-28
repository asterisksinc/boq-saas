"use client";

import React from "react";
import { ChevronLeft, Plus, RefreshCw, Ticket, AlertCircle } from "lucide-react";
import { SupportTicket } from "@/lib/api/auth";
import { formatDate, priorityConfig, statusConfig } from "./help-helpers";
import { HelpSkeleton } from "./HelpSkeletons";

export interface TicketsTableViewProps {
    tickets: SupportTicket[];
    loading?: boolean;
    error?: string | null;
    ticketFilter: string;
    onFilterChange: (status: string) => void;
    onBack: () => void;
    onSelectTicket: (ticket: SupportTicket) => void;
    onOpenNewTicket: () => void;
    onRetry?: () => void;
}

export function TicketsTableView({
    tickets,
    loading = false,
    error,
    ticketFilter,
    onFilterChange,
    onBack,
    onSelectTicket,
    onOpenNewTicket,
    onRetry,
}: TicketsTableViewProps) {
    const filteredTickets = ticketFilter === "all"
        ? tickets
        : tickets.filter((t) => t.status === ticketFilter);

    return (
        <div className="help-section">
            <button
                type="button"
                className="help-back-btn"
                onClick={onBack}
            >
                <ChevronLeft size={16} /> Back to Help Center
            </button>

            <div className="tickets-header">
                <div>
                    <h2>Support Tickets</h2>
                    <p style={{ color: "#64748B", fontSize: "14px", margin: "4px 0 0", fontFamily: "Urbanist" }}>
                        Track and manage your requests to our support team.
                    </p>
                </div>
                <button
                    type="button"
                    className="btn-raise-ticket"
                    onClick={onOpenNewTicket}
                >
                    <Plus size={18} /> Raise a Ticket
                </button>
            </div>

            {/* Status Filter Pills */}
            <div className="category-pills">
                {["all", "open", "in_progress", "waiting_on_user", "resolved", "closed"].map((s) => (
                    <button
                        key={s}
                        type="button"
                        className={`category-pill ${ticketFilter === s ? "active" : ""}`}
                        onClick={() => onFilterChange(s)}
                    >
                        {s === "all" ? `All Tickets (${tickets.length})` : `${statusConfig[s]?.label || s} (${tickets.filter((t) => t.status === s).length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <HelpSkeleton />
            ) : error ? (
                <div className="empty-state" style={{ width: "100%", padding: "40px 20px" }}>
                    <AlertCircle size={44} style={{ color: "#EF4444" }} />
                    <h3 style={{ fontFamily: "Urbanist", fontWeight: 600, fontSize: "18px", color: "#0F172A", margin: "12px 0 6px" }}>
                        Couldn&apos;t load tickets
                    </h3>
                    <p style={{ fontFamily: "Urbanist", fontSize: "14px", color: "#64748B", margin: "0 0 16px" }}>{error}</p>
                    {onRetry && (
                        <button
                            type="button"
                            className="btn-view-ticket"
                            onClick={onRetry}
                        >
                            <RefreshCw size={14} /> Retry
                        </button>
                    )}
                </div>
            ) : filteredTickets.length === 0 ? (
                <div className="empty-state" style={{ width: "100%", padding: "48px 20px" }}>
                    <Ticket size={48} style={{ color: "#64748B", opacity: 0.6 }} />
                    <h3 style={{ fontFamily: "Urbanist", fontWeight: 600, fontSize: "18px", color: "#0F172A", margin: "12px 0 6px" }}>
                        No tickets found
                    </h3>
                    <p style={{ fontFamily: "Urbanist", fontSize: "14px", color: "#64748B", margin: "0 0 20px", maxWidth: "420px" }}>
                        {ticketFilter === "all"
                            ? "You haven't created any support tickets yet."
                            : `No tickets with status "${statusConfig[ticketFilter]?.label || ticketFilter}".`}
                    </p>
                    <button
                        type="button"
                        className="btn-raise-ticket"
                        onClick={onOpenNewTicket}
                    >
                        <Plus size={16} /> Create Support Ticket
                    </button>
                </div>
            ) : (
                <div className="tickets-table-wrap">
                    <table className="tickets-table">
                        <thead>
                            <tr>
                                <th>Ticket #</th>
                                <th>Subject</th>
                                <th>Issue Type</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.map((ticket) => {
                                const priority = ticket.priority || "normal";
                                const status = ticket.status || "open";
                                const ticketNum = ticket.ticketNumber || ticket.ticket_number || ticket.id.slice(0, 8);
                                const issueType = ticket.issueType || ticket.issue_type || "General";
                                const updated = ticket.updatedAt || ticket.updated_at;

                                return (
                                    <tr
                                        key={ticket.id}
                                        onClick={() => onSelectTicket(ticket)}
                                    >
                                        <td>
                                            <span className="ticket-number">{ticketNum}</span>
                                        </td>
                                        <td style={{ fontWeight: "600", color: "#0F172A" }}>{ticket.subject}</td>
                                        <td style={{ color: "#475569" }}>{issueType}</td>
                                        <td>
                                            <span
                                                className="priority-badge"
                                                style={{
                                                    background: priorityConfig[priority]?.bg,
                                                    color: priorityConfig[priority]?.color,
                                                }}
                                            >
                                                {priorityConfig[priority]?.label || priority}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className="status-badge"
                                                style={{
                                                    background: statusConfig[status]?.bg,
                                                    color: statusConfig[status]?.color,
                                                }}
                                            >
                                                {statusConfig[status]?.label || status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: "12px", color: "#64748B" }}>
                                            {formatDate(updated)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default TicketsTableView;
