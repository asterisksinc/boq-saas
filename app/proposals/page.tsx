"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ChevronLeft, ChevronRight, ArrowRight, X, Calendar } from "lucide-react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";
import "./proposals-redesign.css";

interface ProposalListItem {
    id: string;
    proposalCode: string;
    projectId?: string | null;
    projectName: string;
    clientName: string;
    status: string;
    proposedValue: number;
    sentAt: string | null;
    expiryDate: string | null;
    viewCount: number;
    currency: string;
    createdAt?: string;
    updatedAt?: string;
}

interface ProposalSummary {
    total: number;
    totalSent: number;
    winRate: number;
    averageValue: number;
    pendingResponse: number;
    decidedCount: number;
    expiringSoon: number;
}

interface PagedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
}

function formatIndianCurrency(val: number): string {
    if (val === null || val === undefined || isNaN(val)) return "—";
    if (val >= 10000000) {
        const cr = val / 10000000;
        const formatted = cr % 1 === 0 ? cr.toString() : cr.toFixed(1).replace(/\.0$/, "");
        return `₹${formatted}Cr`;
    }
    if (val >= 100000) {
        const lk = val / 100000;
        const formatted = lk % 1 === 0 ? lk.toString() : lk.toFixed(1).replace(/\.0$/, "");
        return `₹${formatted}L`;
    }
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(val);
}

export default function ProposalsPage() {
    const [proposals, setProposals] = useState<ProposalListItem[]>([]);
    const [summary, setSummary] = useState<ProposalSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [showNewModal, setShowNewModal] = useState(false);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [selectedTemplateForNew, setSelectedTemplateForNew] = useState<any>(null);
    const [selectedProposal, setSelectedProposal] = useState<ProposalListItem | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Close action dropdown menu on outside click
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest(".actions-menu-wrapper")) {
                setOpenMenuId(null);
            }
        };
        window.addEventListener("mousedown", handleOutsideClick);
        return () => window.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const fetchProposals = useCallback(async (pageNum: number, limit: number, search = "") => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({
                page: String(pageNum),
                pageSize: String(limit),
            });
            if (search.trim()) {
                params.set("search", search.trim());
            }
            const response = await fetch(`/api/v1/proposals?${params.toString()}`, {
                credentials: "include",
            });
            const payload = await response.json();
            if (!response.ok) {
                setError(getApiErrorMessage(payload));
                return;
            }
            const result = parseApiResponse<PagedResponse<ProposalListItem>>(payload);
            setProposals(result.items || []);
            setTotal(result.total ?? 0);
        } catch {
            setError("Failed to load proposals");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSummary = useCallback(async () => {
        try {
            const response = await fetch("/api/v1/proposals/summary", {
                credentials: "include",
            });
            const result = parseApiResponse<ProposalSummary>(await response.json());
            if (response.ok) {
                setSummary(result);
            }
        } catch (err) {
            console.error("Failed to load proposal summary", err);
        }
    }, []);

    useEffect(() => {
        fetchProposals(page, pageSize, searchQuery);
    }, [page, pageSize, searchQuery, fetchProposals]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "-";
        return d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case "sent":
                return "sent-status";
            case "approved":
                return "approved-status";
            case "draft":
                return "draft-status";
            case "revisions":
                return "revisions-status";
            case "won":
                return "won-status";
            case "lost":
                return "lost-status";
            default:
                return "draft-status";
        }
    };

    // Actions Handlers
    const handleSendProposal = async (proposalId: string) => {
        try {
            const response = await fetch(`/api/v1/proposals/${proposalId}/status`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "sent" }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(getApiErrorMessage(payload));
            showToast("Proposal sent to client successfully!");
            fetchProposals(page, pageSize, searchQuery);
            fetchSummary();
        } catch (err) {
            showToast(getApiErrorMessage(err));
        }
    };

    const handleDuplicateProposal = async (proposal: ProposalListItem) => {
        setOpenMenuId(null);
        try {
            const response = await fetch("/api/v1/proposals", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceType: "duplicate",
                    sourceId: proposal.id,
                    projectName: `${proposal.projectName} (Copy)`,
                    clientName: proposal.clientName,
                    proposedValue: proposal.proposedValue,
                    expiryDate: proposal.expiryDate || null,
                }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(getApiErrorMessage(payload));
            showToast("Proposal duplicated successfully as Draft!");
            fetchProposals(page, pageSize, searchQuery);
            fetchSummary();
        } catch (err) {
            showToast(getApiErrorMessage(err));
        }
    };

    const handleDownloadPdf = async (proposal: ProposalListItem) => {
        setOpenMenuId(null);
        try {
            showToast("Generating PDF download...");
            const response = await fetch(`/api/v1/proposals/${proposal.id}/pdf`, {
                credentials: "include",
            });
            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(payload));
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${proposal.proposalCode || "proposal"}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("PDF downloaded successfully!");
        } catch (err) {
            showToast(getApiErrorMessage(err));
        }
    };

    const handleSendReminder = async (proposal: ProposalListItem) => {
        setOpenMenuId(null);
        try {
            const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
            const note = `Reminder sent on ${dateStr}`;
            await fetch(`/api/v1/proposals/${proposal.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ internalNotes: note }),
            });
            showToast(`Reminder sent to ${proposal.clientName} for ${proposal.proposalCode}!`);
        } catch {
            showToast(`Reminder logged for ${proposal.clientName}`);
        }
    };

    const handleUpdateStatus = async (proposalId: string, newStatus: "won" | "lost" | "approved" | "revisions") => {
        setOpenMenuId(null);
        try {
            const response = await fetch(`/api/v1/proposals/${proposalId}/status`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(getApiErrorMessage(payload));
            showToast(`Proposal marked as ${newStatus.toUpperCase()}!`);
            fetchProposals(page, pageSize, searchQuery);
            fetchSummary();
        } catch (err) {
            showToast(getApiErrorMessage(err));
        }
    };

    return (
        <main className="fig-dashboard">
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/proposals" />
            <div className="fig-dashboard-main">
                <ProposalsHeader
                    onNewClick={() => {
                        setSelectedTemplateForNew(null);
                        setShowNewModal(true);
                    }}
                    onSearchChange={(val) => {
                        setSearchQuery(val);
                        setPage(1);
                    }}
                />

                <div className="fig-dashboard-container proposals-main-container">
                    {toastMessage && (
                        <div className="proposals-toast" role="status">
                            <span>{toastMessage}</span>
                        </div>
                    )}

                    {error && (
                        <div className="proposals-error-banner" role="alert">
                            <span>{error}</span>
                            <button type="button" onClick={() => fetchProposals(page, pageSize, searchQuery)}>
                                Retry
                            </button>
                        </div>
                    )}

                    {/* 1 & 2: Sub-Header Row (Frame 2147225066) */}
                    <div className="proposals-sub-header">
                        <div className="proposals-title-group">
                            <h2>Proposals</h2>
                            <p>
                                {total} {total === 1 ? "proposal" : "proposals"} | {summary?.pendingResponse ?? 0} awaiting response
                            </p>
                        </div>
                        <div className="proposals-header-buttons">
                            <button
                                type="button"
                                className="btn-templates"
                                onClick={() => setShowTemplatesModal(true)}
                            >
                                Templates
                            </button>
                            <button
                                type="button"
                                className="btn-new-proposal"
                                onClick={() => {
                                    setSelectedTemplateForNew(null);
                                    setShowNewModal(true);
                                }}
                            >
                                <Plus size={20} color="#FFFFFF" />
                                <span>New Proposal</span>
                            </button>
                        </div>
                    </div>

                    {/* KPI Summary Cards (Frame 2147225138) */}
                    <div className="proposals-summary-row">
                        <div className="proposals-kpi-card">
                            <span className="proposals-kpi-label">Total Sent</span>
                            <p className="proposals-kpi-value">{summary ? summary.totalSent : (loading ? "—" : 0)}</p>
                            <span className="proposals-kpi-period">This quarter</span>
                        </div>
                        <div className="proposals-kpi-card">
                            <span className="proposals-kpi-label">Win Rate</span>
                            <p className="proposals-kpi-value">{summary ? `${summary.winRate}%` : (loading ? "—" : "0%")}</p>
                            <span className="proposals-kpi-period">
                                {summary && summary.decidedCount > 0
                                    ? `${summary.decidedCount} of ${summary.total || total} decided`
                                    : "0 decided"}
                            </span>
                        </div>
                        <div className="proposals-kpi-card">
                            <span className="proposals-kpi-label">Avg. Value</span>
                            <p className="proposals-kpi-value">
                                {summary ? formatIndianCurrency(summary.averageValue) : (loading ? "—" : "₹0")}
                            </p>
                            <span className="proposals-kpi-period">Per proposal</span>
                        </div>
                        <div className="proposals-kpi-card">
                            <span className="proposals-kpi-label">Pending Response</span>
                            <p className="proposals-kpi-value">{summary ? summary.pendingResponse : (loading ? "—" : 0)}</p>
                            <span className="proposals-kpi-period">
                                {summary && summary.expiringSoon > 0
                                    ? `${summary.expiringSoon} expiring soon`
                                    : "0 expiring soon"}
                            </span>
                        </div>
                    </div>

                    {/* Proposals Table (Frame 2147225139) */}
                    <div className="proposals-table-container">
                        <div className="proposals-table-wrapper">
                            <table className="proposals-table">
                                <thead>
                                    <tr>
                                        <th className="col-th-id">ID</th>
                                        <th className="col-th-project">PROJECT</th>
                                        <th className="col-th-client">CLIENT</th>
                                        <th className="col-th-status">STATUS</th>
                                        <th className="col-th-value">VALUE</th>
                                        <th className="col-th-sent">SENT</th>
                                        <th className="col-th-expiry">EXPIRY</th>
                                        <th className="col-th-views">VIEWS</th>
                                        <th className="col-th-date">DATE</th>
                                        <th className="col-th-actions" aria-label="Actions"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={10} className="proposals-table-loading">
                                                Loading proposals...
                                            </td>
                                        </tr>
                                    ) : proposals.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="proposals-table-empty">
                                                <h3>No proposals found</h3>
                                                <p>Get started by creating your first proposal or selecting a template.</p>
                                                <button
                                                    type="button"
                                                    className="btn-new-proposal"
                                                    style={{ margin: "0 auto", display: "inline-flex" }}
                                                    onClick={() => setShowNewModal(true)}
                                                >
                                                    <Plus size={18} />
                                                    <span>New Proposal</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        proposals.map((proposal) => {
                                            const isDraft = proposal.status?.toLowerCase() === "draft";
                                            return (
                                                <tr key={proposal.id}>
                                                    <td className="cell-id">{proposal.proposalCode || `PROP-${proposal.id.slice(0, 4)}`}</td>
                                                    <td className="cell-project">
                                                        <span className="cell-project-text" title={proposal.projectName}>
                                                            {proposal.projectName}
                                                        </span>
                                                    </td>
                                                    <td className="cell-client">{proposal.clientName}</td>
                                                    <td className="cell-status">
                                                        <span className={`status-badge ${getStatusClass(proposal.status)}`}>
                                                            {proposal.status?.toUpperCase() || "DRAFT"}
                                                        </span>
                                                    </td>
                                                    <td className="cell-value">{formatIndianCurrency(proposal.proposedValue)}</td>
                                                    <td className="cell-sent">{isDraft ? "-" : formatDate(proposal.sentAt)}</td>
                                                    <td className="cell-expiry">{proposal.expiryDate ? formatDate(proposal.expiryDate) : "-"}</td>
                                                    <td className="cell-views">
                                                        {proposal.viewCount > 0 ? (
                                                            <div className="proposal-views-active">
                                                                <div className="view-indicator-dot">
                                                                    <div className="view-indicator-inner" />
                                                                </div>
                                                                <span className="view-count-number">{proposal.viewCount}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="proposal-views-empty">Not opened</span>
                                                        )}
                                                    </td>
                                                    <td className="cell-date">
                                                        {formatDate(proposal.createdAt || proposal.sentAt)}
                                                    </td>
                                                    <td className="cell-actions">
                                                        <div className="proposals-actions-cell">
                                                            {isDraft && (
                                                                <button
                                                                    type="button"
                                                                    className="btn-send-draft"
                                                                    onClick={() => handleSendProposal(proposal.id)}
                                                                    title="Send proposal to client"
                                                                >
                                                                    <span>Send</span>
                                                                    <ArrowRight size={14} />
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="btn-preview"
                                                                onClick={() => {
                                                                    setSelectedProposal(proposal);
                                                                    setShowPreviewModal(true);
                                                                }}
                                                            >
                                                                Preview
                                                            </button>
                                                            <div className="actions-menu-wrapper">
                                                                <button
                                                                    type="button"
                                                                    className="btn-row-more"
                                                                    aria-label="More actions"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setOpenMenuId(openMenuId === proposal.id ? null : proposal.id);
                                                                    }}
                                                                >
                                                                    •••
                                                                </button>
                                                                {openMenuId === proposal.id && (
                                                                    <div
                                                                        className="proposals-dropdown-menu"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            className="proposals-dropdown-item"
                                                                            onClick={() => {
                                                                                setOpenMenuId(null);
                                                                                setSelectedProposal(proposal);
                                                                                setShowPreviewModal(true);
                                                                            }}
                                                                        >
                                                                            <img src="/assets/proposals/preview.svg" alt="" width={20} height={20} />
                                                                            <span>Preview</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="proposals-dropdown-item"
                                                                            onClick={() => handleDuplicateProposal(proposal)}
                                                                        >
                                                                            <img src="/assets/proposals/duplicate.svg" alt="" width={20} height={20} />
                                                                            <span>Duplicate</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="proposals-dropdown-item"
                                                                            onClick={() => handleDownloadPdf(proposal)}
                                                                        >
                                                                            <img src="/assets/proposals/download-pdf.svg" alt="" width={20} height={20} />
                                                                            <span>Download PDF</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="proposals-dropdown-item"
                                                                            onClick={() => handleSendReminder(proposal)}
                                                                        >
                                                                            <img src="/assets/proposals/send-reminder.svg" alt="" width={20} height={20} />
                                                                            <span>Send Reminder</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="proposals-dropdown-item"
                                                                            onClick={() => handleUpdateStatus(proposal.id, "won")}
                                                                        >
                                                                            <img src="/assets/proposals/mark-won.svg" alt="" width={20} height={20} />
                                                                            <span>Mark as Won</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="proposals-dropdown-item"
                                                                            onClick={() => handleUpdateStatus(proposal.id, "lost")}
                                                                        >
                                                                            <img src="/assets/proposals/mark-lost.svg" alt="" width={20} height={20} />
                                                                            <span>Mark as Lost</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 6 & 7: Pagination Row (Frame 2147225166) */}
                        <div className="proposals-pagination">
                            <span className="proposals-total-arrivals">Total Arrivals: {total}</span>
                            <div className="pagination-controls">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                {Array.from(
                                    { length: Math.max(1, Math.ceil(total / pageSize)) },
                                    (_, index) => index + 1
                                ).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        className={page === p ? "active" : ""}
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    disabled={page >= Math.ceil(total / pageSize) || total === 0}
                                    onClick={() => setPage((p) => p + 1)}
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                            <div className="page-size-control">
                                <span className="page-size-label">Show per Page:</span>
                                <div className="page-size-select-box">
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {showNewModal && (
                    <NewProposalModal
                        initialTemplate={selectedTemplateForNew}
                        onClose={() => {
                            setShowNewModal(false);
                            setSelectedTemplateForNew(null);
                        }}
                        onRefresh={() => {
                            fetchProposals(page, pageSize, searchQuery);
                            fetchSummary();
                        }}
                    />
                )}

                {showTemplatesModal && (
                    <ProposalTemplatesModal
                        onClose={() => setShowTemplatesModal(false)}
                        onSelectTemplate={(tmpl) => {
                            setShowTemplatesModal(false);
                            setSelectedTemplateForNew(tmpl);
                            setShowNewModal(true);
                        }}
                    />
                )}

                {showPreviewModal && selectedProposal && (
                    <ProposalPreviewModal
                        proposalId={selectedProposal.id}
                        onClose={() => {
                            setShowPreviewModal(false);
                            setSelectedProposal(null);
                            fetchProposals(page, pageSize, searchQuery);
                        }}
                    />
                )}
            </div>
        </main>
    );
}

function ProposalsHeader({
    onNewClick,
    onSearchChange,
}: {
    onNewClick: () => void;
    onSearchChange: (search: string) => void;
}) {
    return <DashboardHeader title="Proposals" onNew={onNewClick} onSearch={onSearchChange} />;
}

function ProposalTemplatesModal({
    onClose,
    onSelectTemplate,
}: {
    onClose: () => void;
    onSelectTemplate: (template: any) => void;
}) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const res = await fetch("/api/v1/project-templates", { credentials: "include" });
                if (res.ok) {
                    const payload = await res.json();
                    const result = parseApiResponse<{ items?: any[] }>(payload);
                    if (result.items && result.items.length > 0) {
                        setTemplates(result.items);
                        setLoading(false);
                        return;
                    }
                }
            } catch {
                // The modal displays its empty state when the API is unavailable.
                setTemplates([]);
            }
            setLoading(false);
        };

        loadTemplates();
    }, []);

    return (
        <div className="proposal-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="proposal-modal-card" style={{ maxWidth: "780px" }} onClick={(e) => e.stopPropagation()}>
                <div className="proposal-modal-header">
                    <div className="proposal-modal-title-group">
                        <h2 className="proposal-modal-title">Proposal Templates</h2>
                        <p className="proposal-modal-subtitle">
                            Select a pre-configured template to kickstart a new proposal
                        </p>
                    </div>
                    <button
                        type="button"
                        className="proposal-modal-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="proposal-modal-inner-card" style={{ maxHeight: "70vh", overflowY: "auto", width: "100%" }}>
                    {loading ? (
                        <p style={{ padding: "32px 0", textAlign: "center", color: "#64748b", margin: 0, width: "100%" }}>
                            Loading templates...
                        </p>
                    ) : (
                        <div className="templates-grid" style={{ width: "100%" }}>
                            {templates.map((tmpl) => (
                                <div key={tmpl.id} className="template-card">
                                    <div>
                                        <h3 className="template-card-title">{tmpl.name}</h3>
                                        <p className="template-card-desc">{tmpl.description}</p>
                                    </div>
                                    <div className="template-card-meta">
                                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                            {(tmpl.tags || ["Template"]).map((tag: string) => (
                                                <span key={tag} className="template-tag">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            className="template-use-btn"
                                            onClick={() => onSelectTemplate(tmpl)}
                                        >
                                            Use Template
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="proposal-modal-footer" style={{ justifyContent: "flex-end" }}>
                    <button type="button" className="proposal-btn-cancel" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}


function NewProposalModal({
    initialTemplate,
    onClose,
    onRefresh,
}: {
    initialTemplate?: any;
    onClose: () => void;
    onRefresh: () => void;
}) {
    const [step, setStep] = useState<"select" | "details" | "success">(
        initialTemplate ? "details" : "select"
    );
    const [selectedType, setSelectedType] = useState<
        "scratch" | "boq" | "duplicate" | "template" | null
    >(initialTemplate ? "template" : "scratch");
    const [sourceType, setSourceType] = useState<
        "scratch" | "boq" | "duplicate" | "template" | null
    >(initialTemplate ? "template" : null);

    const [isCustomProject, setIsCustomProject] = useState(false);
    const [formData, setFormData] = useState({
        projectId: "",
        projectName: initialTemplate ? `${initialTemplate.name} Proposal` : "",
        clientName: "",
        proposedValue: initialTemplate ? "2500000" : "",
        expiryDate: "",
        internalNotes: initialTemplate ? `Generated from template: ${initialTemplate.name}` : "",
        sourceId: initialTemplate ? initialTemplate.id : "",
    });

    const [projects, setProjects] = useState<
        Array<{ id: string; name: string; clientName?: string; projectValue?: number }>
    >([]);
    const [boqs, setBoqs] = useState<
        Array<{ id: string; name: string; projectId?: string; projectName?: string; subtotal?: number; status?: string }>
    >([]);
    const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
    const [duplicateProposals, setDuplicateProposals] = useState<
        Array<{ id: string; reference: string; projectName: string; clientName?: string; proposedValue?: number }>
    >([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [createdProposal, setCreatedProposal] = useState<{
        id: string;
        reference: string;
        projectName: string;
        clientName: string;
    } | null>(null);

    useEffect(() => {
        // Load projects immediately so the dropdown is ready
        loadProjects();
    }, []);

    useEffect(() => {
        if (step === "details") {
            if (sourceType === "boq") {
                loadBoqs();
            } else if (sourceType === "duplicate") {
                loadProposals();
            } else if (sourceType === "template") {
                loadTemplates();
            }
            loadProjects();
        }
    }, [step, sourceType]);

    const loadProjects = async () => {
        try {
            const response = await fetch("/api/v1/projects?pageSize=100", {
                credentials: "include",
            });
            if (response.ok) {
                const result = parseApiResponse<{ items?: any[] }>(await response.json());
                if (result.items && result.items.length > 0) {
                    setProjects(
                        result.items.map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            clientName: p.clientName || p.client_name || "",
                            projectValue: p.projectValue || p.project_value || 0,
                        }))
                    );
                    return;
                }
            }
        } catch {
            // Fallback to recent-projects
        }

        try {
            const resp2 = await fetch("/api/v1/dashboard/recent-projects?pageSize=100", {
                credentials: "include",
            });
            if (resp2.ok) {
                const result2 = parseApiResponse<{ items?: any[] }>(await resp2.json());
                if (result2.items && result2.items.length > 0) {
                    setProjects(
                        result2.items.map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            clientName: p.clientName || p.client_name || "",
                            projectValue: p.value || p.projectValue || 0,
                        }))
                    );
                    return;
                }
            }
        } catch {
            // Fallback
        }

        setProjects([]);
    };

    const loadBoqs = async () => {
        try {
            const response = await fetch("/api/v1/boqs?pageSize=100", {
                credentials: "include",
            });
            if (response.ok) {
                const result = parseApiResponse<{ items?: any[] }>(await response.json());
                if (result.items && result.items.length > 0) {
                    setBoqs(
                        result.items.map((b: any) => ({
                            id: b.id,
                            name: b.projectName ? `${b.projectName} - BOQ v${b.version || 1}` : `BOQ #${b.boqNumber || b.id.slice(0, 8)}`,
                            projectId: b.projectId || b.project_id || "",
                            projectName: b.projectName || "",
                            subtotal: b.subtotal || 0,
                            status: b.status || "",
                        }))
                    );
                    return;
                }
            }
        } catch {
            // Fallback
        }

        try {
            const resp2 = await fetch("/api/v1/dashboard/recent-boqs?pageSize=100", {
                credentials: "include",
            });
            if (resp2.ok) {
                const result2 = parseApiResponse<{ items?: any[] }>(await resp2.json());
                if (result2.items && result2.items.length > 0) {
                    setBoqs(
                        result2.items.map((b: any) => ({
                            id: b.id,
                            name: `${b.projectName} - BOQ`,
                            projectId: b.projectId || "",
                            projectName: b.projectName || "",
                            subtotal: b.value || b.subtotal || 0,
                            status: b.status || "approved",
                        }))
                    );
                    return;
                }
            }
        } catch {
            // Fallback
        }

        setBoqs([]);
    };

    const loadTemplates = async () => {
        try {
            const response = await fetch("/api/v1/project-templates", {
                credentials: "include",
            });
            if (response.ok) {
                const result = parseApiResponse<{ items?: any[] }>(await response.json());
                if (result.items && result.items.length > 0) {
                    setTemplates(result.items.map((t: any) => ({ id: t.id, name: t.name })));
                    return;
                }
            }
        } catch {
            // Fallback
        }

        setTemplates([]);
    };

    const loadProposals = async () => {
        try {
            const response = await fetch("/api/v1/proposals?pageSize=100", {
                credentials: "include",
            });
            if (response.ok) {
                const result = parseApiResponse<{ items?: any[] }>(await response.json());
                setDuplicateProposals(
                    result.items?.map((p: any) => ({
                        id: p.id,
                        reference: p.proposalCode,
                        projectName: p.projectName,
                        clientName: p.clientName,
                        proposedValue: p.proposedValue,
                    })) || []
                );
            }
        } catch {
            // Fallback
        }
    };

    const handleProjectChange = (projectIdVal: string) => {
        if (projectIdVal === "__custom__") {
            setIsCustomProject(true);
            setFormData((prev) => ({
                ...prev,
                projectId: "",
                projectName: "",
            }));
            return;
        }

        setIsCustomProject(false);
        const proj = projects.find((p) => p.id === projectIdVal);
        if (proj) {
            setFormData((prev) => ({
                ...prev,
                projectId: proj.id,
                projectName: proj.name,
                clientName: proj.clientName || prev.clientName,
                proposedValue: prev.proposedValue || (proj.projectValue ? String(proj.projectValue) : prev.proposedValue),
            }));

            // If in BOQ mode, check if there's a BOQ matching this project
            if (sourceType === "boq") {
                const matchingBoq = boqs.find((b) => b.projectId === proj.id || b.projectName === proj.name);
                if (matchingBoq) {
                    setFormData((prev) => ({
                        ...prev,
                        sourceId: matchingBoq.id,
                        proposedValue: matchingBoq.subtotal ? String(matchingBoq.subtotal) : prev.proposedValue,
                    }));
                }
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                projectId: "",
                projectName: "",
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const requestBody: any = {
                sourceType,
                projectName: formData.projectName,
                clientName: formData.clientName,
                proposedValue: parseFloat(formData.proposedValue) || 0,
                expiryDate: formData.expiryDate || null,
                internalNotes: formData.internalNotes || null,
            };

            if (formData.projectId) {
                requestBody.projectId = formData.projectId;
            }

            if (sourceType !== "scratch" && formData.sourceId) {
                requestBody.sourceId = formData.sourceId;
            }

            const response = await fetch("/api/v1/proposals", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const responsePayload = await response.json();
            const result = parseApiResponse<{
                id: string;
                proposalCode: string;
                projectName: string;
                clientName: string;
            }>(responsePayload);

            if (!response.ok) {
                setError(getApiErrorMessage(responsePayload));
                return;
            }

            setCreatedProposal({
                id: result.id,
                reference: result.proposalCode,
                projectName: result.projectName,
                clientName: result.clientName,
            });
            setStep("success");
        } catch {
            setError("Failed to create proposal");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="proposal-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="proposal-modal-card" onClick={(e) => e.stopPropagation()}>
                {step === "select" && (
                    <>
                        {/* Modal Header (Frame 2147225093) */}
                        <div className="proposal-modal-header">
                            <div className="proposal-modal-title-group">
                                <h2 className="proposal-modal-title">New Proposal</h2>
                                <p className="proposal-modal-subtitle">How would you like to start?</p>
                            </div>
                            <button
                                type="button"
                                className="proposal-modal-close-btn"
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* White inner container (Frame 2147225091) */}
                        <div className="proposal-modal-inner-card">
                            <div className="proposal-options-grid">
                                <button
                                    type="button"
                                    className={`proposal-option-card ${selectedType === "scratch" ? "selected" : ""}`}
                                    onClick={() => setSelectedType("scratch")}
                                    onDoubleClick={() => {
                                        setSourceType("scratch");
                                        setStep("details");
                                    }}
                                >
                                    <div className="proposal-option-icon">
                                        <img
                                            src="/assets/proposal-from-scratch.svg"
                                            alt=""
                                            width={20}
                                            height={20}
                                        />
                                    </div>
                                    <div className="proposal-option-text">
                                        <h3 className="proposal-option-title">From Scratch</h3>
                                        <p className="proposal-option-desc">Build a new proposal with a blank</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`proposal-option-card ${selectedType === "boq" ? "selected" : ""}`}
                                    onClick={() => setSelectedType("boq")}
                                    onDoubleClick={() => {
                                        setSourceType("boq");
                                        setStep("details");
                                    }}
                                >
                                    <div className="proposal-option-icon">
                                        <img
                                            src="/assets/proposal-from-boq.svg"
                                            alt=""
                                            width={20}
                                            height={20}
                                        />
                                    </div>
                                    <div className="proposal-option-text">
                                        <h3 className="proposal-option-title">From BOQ</h3>
                                        <p className="proposal-option-desc">Proposal from an approved BOQ</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`proposal-option-card ${selectedType === "duplicate" ? "selected" : ""}`}
                                    onClick={() => setSelectedType("duplicate")}
                                    onDoubleClick={() => {
                                        setSourceType("duplicate");
                                        setStep("details");
                                    }}
                                >
                                    <div className="proposal-option-icon">
                                        <img
                                            src="/assets/proposal-duplicate.svg"
                                            alt=""
                                            width={20}
                                            height={20}
                                        />
                                    </div>
                                    <div className="proposal-option-text">
                                        <h3 className="proposal-option-title">Duplicate Existing</h3>
                                        <p className="proposal-option-desc">Copy a previous proposal and modify it</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`proposal-option-card ${selectedType === "template" ? "selected" : ""}`}
                                    onClick={() => setSelectedType("template")}
                                    onDoubleClick={() => {
                                        setSourceType("template");
                                        setStep("details");
                                    }}
                                >
                                    <div className="proposal-option-icon">
                                        <img
                                            src="/assets/proposal-from-template.svg"
                                            alt=""
                                            width={20}
                                            height={20}
                                        />
                                    </div>
                                    <div className="proposal-option-text">
                                        <h3 className="proposal-option-title">From Template</h3>
                                        <p className="proposal-option-desc">Use a saved proposal template</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Step 1 Footer (Frame 2147225069) */}
                        <div className="proposal-modal-footer">
                            <button type="button" className="proposal-btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="proposal-btn-continue"
                                disabled={!selectedType}
                                onClick={() => {
                                    if (selectedType) {
                                        setSourceType(selectedType);
                                        setStep("details");
                                    }
                                }}
                            >
                                Continue
                            </button>
                        </div>
                    </>
                )}

                {step === "details" && sourceType && (
                    <>
                        {/* Modal Header (Frame 2147225093) */}
                        <div className="proposal-modal-header">
                            <div className="proposal-modal-title-group">
                                <h2 className="proposal-modal-title">Proposal Details</h2>
                                <p className="proposal-modal-subtitle">
                                    Starting from:{" "}
                                    {sourceType === "scratch"
                                        ? "From Scratch"
                                        : sourceType === "boq"
                                        ? "From BOQ"
                                        : sourceType === "duplicate"
                                        ? "Duplicate Existing"
                                        : "From Template"}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="proposal-modal-close-btn"
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Inner White Card (Frame 2147225027) */}
                        <form id="proposal-create-form" onSubmit={handleSubmit} className="proposal-modal-inner-card">
                            {error && <p className="proposals-error-banner" role="alert">{error}</p>}

                            {/* 1. Project Dropdown based on data */}
                            <div className="proposal-form-field">
                                <div className="proposal-form-label-row">
                                    <span className="proposal-form-label">Project</span>
                                    <span className="proposal-form-required">*</span>
                                </div>
                                {!isCustomProject ? (
                                    <div className="proposal-form-control-box">
                                        <select
                                            className="proposal-form-select"
                                            value={formData.projectId}
                                            onChange={(e) => handleProjectChange(e.target.value)}
                                            required={!formData.projectName}
                                        >
                                            <option value="">Select project</option>
                                            {projects.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} {p.clientName ? `— ${p.clientName}` : ""}
                                                </option>
                                            ))}
                                            <option value="__custom__">+ Enter Custom Project Name...</option>
                                        </select>
                                        <ChevronDown size={18} className="proposal-form-icon-right" />
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                                        <div className="proposal-form-control-box" style={{ flex: 1 }}>
                                            <input
                                                type="text"
                                                className="proposal-form-input"
                                                placeholder="ex. Oberoi Residence - Bandra"
                                                value={formData.projectName}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, projectName: e.target.value })
                                                }
                                                required
                                                autoFocus
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="proposal-btn-cancel"
                                            style={{ width: "auto", padding: "0 14px", fontSize: "13px", whiteSpace: "nowrap" }}
                                            onClick={() => {
                                                setIsCustomProject(false);
                                                if (projects.length > 0) {
                                                    handleProjectChange(projects[0].id);
                                                }
                                            }}
                                        >
                                            Choose from List
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 2. Client Name */}
                            <div className="proposal-form-field">
                                <div className="proposal-form-label-row">
                                    <span className="proposal-form-label">Client Name</span>
                                    <span className="proposal-form-required">*</span>
                                </div>
                                <div className="proposal-form-control-box">
                                    <input
                                        type="text"
                                        className="proposal-form-input"
                                        placeholder="ex. John Doe"
                                        value={formData.clientName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, clientName: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            {/* Conditional Secondary Selects for BOQ / Duplicate / Template */}
                            {sourceType === "boq" && (
                                <div className="proposal-form-field">
                                    <div className="proposal-form-label-row">
                                        <span className="proposal-form-label">Select Approved BOQ</span>
                                        <span className="proposal-form-required">*</span>
                                    </div>
                                    <div className="proposal-form-control-box">
                                        <select
                                            className="proposal-form-select"
                                            value={formData.sourceId}
                                            onChange={(e) => {
                                                const boqId = e.target.value;
                                                const selectedBoq = boqs.find((b) => b.id === boqId);
                                                if (selectedBoq) {
                                                    const matchingProj = projects.find(
                                                        (p) => p.id === selectedBoq.projectId || p.name === selectedBoq.projectName
                                                    );
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        sourceId: selectedBoq.id,
                                                        projectId: matchingProj ? matchingProj.id : prev.projectId,
                                                        projectName: matchingProj ? matchingProj.name : (selectedBoq.projectName || prev.projectName),
                                                        clientName: matchingProj?.clientName || prev.clientName,
                                                        proposedValue: selectedBoq.subtotal ? String(selectedBoq.subtotal) : prev.proposedValue,
                                                    }));
                                                } else {
                                                    setFormData((prev) => ({ ...prev, sourceId: "" }));
                                                }
                                            }}
                                            required
                                        >
                                            <option value="">Select approved BOQ</option>
                                            {boqs.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name} {b.subtotal ? `(${formatIndianCurrency(b.subtotal)})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={18} className="proposal-form-icon-right" />
                                    </div>
                                </div>
                            )}

                            {sourceType === "duplicate" && (
                                <div className="proposal-form-field">
                                    <div className="proposal-form-label-row">
                                        <span className="proposal-form-label">Duplicate From</span>
                                        <span className="proposal-form-required">*</span>
                                    </div>
                                    <div className="proposal-form-control-box">
                                        <select
                                            className="proposal-form-select"
                                            value={formData.sourceId}
                                            onChange={(e) => {
                                                const propId = e.target.value;
                                                const p = duplicateProposals.find((item) => item.id === propId);
                                                if (p) {
                                                    const matchingProj = projects.find((proj) => proj.name === p.projectName);
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        sourceId: p.id,
                                                        projectId: matchingProj ? matchingProj.id : prev.projectId,
                                                        projectName: p.projectName || prev.projectName,
                                                        clientName: p.clientName || prev.clientName,
                                                        proposedValue: p.proposedValue ? String(p.proposedValue) : prev.proposedValue,
                                                        internalNotes: `Duplicated from ${p.reference}`,
                                                    }));
                                                } else {
                                                    setFormData((prev) => ({ ...prev, sourceId: "" }));
                                                }
                                            }}
                                            required
                                        >
                                            <option value="">Select proposal to duplicate</option>
                                            {duplicateProposals.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.reference} - {p.projectName} {p.clientName ? `(${p.clientName})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={18} className="proposal-form-icon-right" />
                                    </div>
                                </div>
                            )}

                            {sourceType === "template" && (
                                <div className="proposal-form-field">
                                    <div className="proposal-form-label-row">
                                        <span className="proposal-form-label">Select Template</span>
                                        <span className="proposal-form-required">*</span>
                                    </div>
                                    <div className="proposal-form-control-box">
                                        <select
                                            className="proposal-form-select"
                                            value={formData.sourceId}
                                            onChange={(e) => {
                                                const tmplId = e.target.value;
                                                const t = templates.find((item) => item.id === tmplId);
                                                if (t) {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        sourceId: t.id,
                                                        internalNotes: `Created from template: ${t.name}`,
                                                    }));
                                                } else {
                                                    setFormData((prev) => ({ ...prev, sourceId: "" }));
                                                }
                                            }}
                                            required
                                        >
                                            <option value="">Select template</option>
                                            {templates.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={18} className="proposal-form-icon-right" />
                                    </div>
                                </div>
                            )}

                            {/* 2-Column Row: Proposed Value & Expiry Date */}
                            <div className="proposal-form-row-2col">
                                <div className="proposal-form-col">
                                    <div className="proposal-form-label-row">
                                        <span className="proposal-form-label">Proposed Value (₹)</span>
                                        <span className="proposal-form-required">*</span>
                                    </div>
                                    <div className="proposal-form-control-box">
                                        <input
                                            type="number"
                                            className="proposal-form-input"
                                            placeholder="ex. 45,00,000"
                                            value={formData.proposedValue}
                                            onChange={(e) =>
                                                setFormData({ ...formData, proposedValue: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="proposal-form-col">
                                    <div className="proposal-form-label-row">
                                        <span className="proposal-form-label">Expiry Date</span>
                                    </div>
                                    <div className="proposal-form-control-box">
                                        <input
                                            type="date"
                                            className="proposal-form-input"
                                            placeholder="dd-mm-yyyy"
                                            value={formData.expiryDate}
                                            onChange={(e) =>
                                                setFormData({ ...formData, expiryDate: e.target.value })
                                            }
                                        />
                                        <Calendar size={18} className="proposal-form-icon-right" />
                                    </div>
                                </div>
                            </div>

                            {/* Internal Notes */}
                            <div className="proposal-form-field">
                                <div className="proposal-form-label-row">
                                    <span className="proposal-form-label">Internal Notes</span>
                                </div>
                                <div className="proposal-form-control-box-textarea">
                                    <textarea
                                        className="proposal-form-textarea"
                                        placeholder="Optional notes..."
                                        value={formData.internalNotes}
                                        onChange={(e) =>
                                            setFormData({ ...formData, internalNotes: e.target.value })
                                        }
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </form>

                        {/* Step 2 Footer (Frame 2147225095) sitting directly on outer translucent surface */}
                        <div className="proposal-modal-footer-details">
                            <button
                                type="button"
                                className="proposal-btn-back"
                                onClick={() => setStep("select")}
                            >
                                Back
                            </button>
                            <div className="proposal-footer-right-group">
                                <button type="button" className="proposal-btn-cancel" onClick={onClose}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="proposal-create-form"
                                    className="proposal-btn-create"
                                    disabled={isSubmitting || !formData.projectName || !formData.clientName}
                                >
                                    {isSubmitting ? "Creating..." : "Create Proposal"}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {step === "success" && createdProposal && (
                    <>
                        <div className="proposal-modal-header">
                            <div className="proposal-modal-title-group">
                                <h2 className="proposal-modal-title">Proposal Created</h2>
                                <p className="proposal-modal-subtitle">Your new proposal is ready</p>
                            </div>
                            <button
                                type="button"
                                className="proposal-modal-close-btn"
                                onClick={() => {
                                    onClose();
                                    onRefresh();
                                }}
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="proposal-modal-inner-card proposal-success-card">
                            <div className="proposal-success-icon-badge">
                                <img src="/assets/proposal-success-checkmark.svg" alt="Success" width={32} height={32} />
                            </div>
                            <h3 className="proposal-success-title">{createdProposal.reference}</h3>
                            <p className="proposal-success-subtitle">
                                {createdProposal.projectName} proposal for {createdProposal.clientName} has been saved as a Draft
                            </p>
                            <div className="proposal-success-detail-box">
                                You can now review the proposal in preview mode or dispatch it directly to the client.
                            </div>
                        </div>

                        <div className="proposal-modal-footer" style={{ marginTop: "16px", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                className="proposal-btn-cancel"
                                style={{ width: "80px" }}
                                onClick={() => {
                                    onClose();
                                    onRefresh();
                                }}
                            >
                                Done
                            </button>
                            <button
                                type="button"
                                className="proposal-btn-create"
                                style={{ width: "auto" }}
                                onClick={async () => {
                                    if (!createdProposal) return;
                                    setIsSubmitting(true);
                                    setError("");
                                    try {
                                        const response = await fetch(
                                            `/api/v1/proposals/${createdProposal.id}/status`,
                                            {
                                                method: "POST",
                                                credentials: "include",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ status: "sent" }),
                                            }
                                        );
                                        const payload = await response.json();
                                        if (!response.ok) throw new Error(getApiErrorMessage(payload));
                                        onClose();
                                        onRefresh();
                                    } catch (sendError) {
                                        setError(getApiErrorMessage(sendError));
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                            >
                                {isSubmitting ? "Sending..." : "Send to Client"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}



function ProposalPreviewModal({
    proposalId,
    onClose,
}: {
    proposalId: string;
    onClose: () => void;
}) {
    const [proposal, setProposal] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [branding, setBranding] = useState<{
        companyName: string;
        address: string;
        email: string;
        phone: string;
    }>({
        companyName: "",
        address: "",
        email: "",
        phone: "",
    });

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const res = await fetch("/api/v1/settings/branding", { credentials: "include" });
                if (res.ok) {
                    const payload = await res.json();
                    const data = parseApiResponse<any>(payload);
                    if (data?.data) {
                        setBranding({
                            companyName: data.data.companyName || data.data.company_name || "",
                            address: data.data.address || "",
                            email: data.data.email || "",
                            phone: data.data.phone || "",
                        });
                    }
                }
            } catch {
                // Keep default branding
            }
        };
        fetchBranding();
    }, []);

    useEffect(() => {
        const fetchProposal = async () => {
            try {
                const response = await fetch(`/api/v1/proposals/${proposalId}`, {
                    credentials: "include",
                });
                const payload = await response.json();
                if (response.ok) {
                    const data = parseApiResponse<any>(payload);
                    setProposal(data);
                    const viewResponse = await fetch(`/api/v1/proposals/${proposalId}/view`, {
                        method: "POST",
                        credentials: "include",
                    });
                    if (viewResponse.ok) {
                        const viewData = parseApiResponse<{ viewCount: number }>(await viewResponse.json());
                        setProposal((current: any) =>
                            current ? { ...current, viewCount: viewData.viewCount } : current
                        );
                    }
                } else {
                    setError(getApiErrorMessage(payload));
                }
            } catch {
                setError("Failed to load proposal");
            } finally {
                setLoading(false);
            }
        };

        fetchProposal();
    }, [proposalId]);

    const calculateDuration = () => {
        if (!proposal) return "3 Months";
        if (proposal.expiryDate && (proposal.sentAt || proposal.createdAt)) {
            const start = new Date(proposal.sentAt || proposal.createdAt).getTime();
            const end = new Date(proposal.expiryDate).getTime();
            const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
                const months = Math.max(1, Math.round(diffDays / 30));
                return `${months} ${months === 1 ? "Month" : "Months"}`;
            }
        }
        return "3 Months";
    };

    const defaultScopeItems = [
        "Interior design and space planning",
        "Furniture procurement and installation",
        "Civil, electrical, and plumbing works",
        "Modular furniture kitchen and wardrobes",
        "Project management and site supervision",
    ];

    const scopeList = proposal?.scopeItems && proposal.scopeItems.length > 0
        ? proposal.scopeItems
        : defaultScopeItems;

    return (
        <div className="proposal-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div
                className="proposal-modal-card proposal-preview-card"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Title Bar (Frame 2147225093) */}
                <div className="proposal-modal-header">
                    <div className="proposal-modal-title-group">
                        <h2 className="proposal-modal-title">
                            {proposal ? `${proposal.proposalCode} - Proposal Preview` : "Proposal Preview"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        className="proposal-modal-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: "48px 32px", textAlign: "center", color: "#64748B", width: "100%", fontFamily: "'Urbanist', sans-serif" }}>
                        Loading proposal...
                    </div>
                ) : error ? (
                    <div style={{ padding: "32px", color: "#DC2626", width: "100%", fontFamily: "'Urbanist', sans-serif" }}>{error}</div>
                ) : proposal ? (
                    <>
                        {/* Inner White Container (Frame 2147225096) */}
                        <div className="proposal-modal-inner-card proposal-preview-inner-card">
                            {/* Top row: Company details on left, Proposal ID & dates on right (Frame 2147225153) */}
                            <div className="preview-company-row">
                                <div className="preview-company-info">
                                    <h1 className="preview-company-title">{branding.companyName || "Arvin Interiors"}</h1>
                                    <p className="preview-company-details">
                                        {[
                                            branding.address || "42 Design House, Khar West, Mumbai 400052",
                                            branding.email || "contact@arvininteriors.com",
                                            branding.phone || "+91 98200 00001",
                                        ].filter(Boolean).join(" ")}
                                    </p>
                                </div>
                                <div className="preview-proposal-code-box">
                                    <div className="preview-proposal-code-title">{proposal.proposalCode}</div>
                                    <div className="preview-proposal-dates">
                                        <div className="preview-proposal-date-line">
                                            Issued:{" "}
                                            {new Date(proposal.sentAt || proposal.createdAt).toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </div>
                                        <div className="preview-proposal-date-line">
                                            Expiry:{" "}
                                            {proposal.expiryDate
                                                ? new Date(proposal.expiryDate).toLocaleDateString("en-GB", {
                                                      day: "numeric",
                                                      month: "short",
                                                      year: "numeric",
                                                  })
                                                : "—"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Divider Line (Rectangle 78) */}
                            <div className="preview-divider-line" />

                            {/* Prepared for section (Frame 2147225154) */}
                            <div className="preview-prepared-for-section">
                                <div className="preview-prepared-for-label">Prepared for</div>
                                <div className="preview-client-project-group">
                                    <div className="preview-client-heading">{proposal.clientName}</div>
                                    <div className="preview-project-subheading">{proposal.projectName}</div>
                                </div>
                            </div>

                            {/* Proposal Summary Box (Frame 12) */}
                            <div className="preview-summary-box">
                                <div className="preview-summary-box-title">PROPOSAL SUMMARY</div>
                                <div className="preview-divider-line" />
                                <div className="preview-summary-box-row">
                                    <div className="preview-summary-box-col">
                                        <div className="preview-summary-box-col-label">SCOPE OF WORK</div>
                                        <div className="preview-summary-box-col-value">
                                            {proposal.sourceLabel || (proposal.sourceType === "boq" ? "Approved BOQ" : "Full Turnkey")}
                                        </div>
                                    </div>
                                    <div className="preview-summary-vdivider" />
                                    <div className="preview-summary-box-col">
                                        <div className="preview-summary-box-col-label">PROJECT DURATION</div>
                                        <div className="preview-summary-box-col-value">{calculateDuration()}</div>
                                    </div>
                                    <div className="preview-summary-vdivider" />
                                    <div className="preview-summary-box-col">
                                        <div className="preview-summary-box-col-label">PROPOSED VALUE</div>
                                        <div className="preview-summary-box-col-value">{formatIndianCurrency(proposal.proposedValue)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Scope Includes list (Frame 2147225155) */}
                            <div className="preview-scope-block">
                                <div className="preview-scope-title">Scope Includes</div>
                                <div className="preview-scope-items-container">
                                    {scopeList.map((item: string, idx: number) => (
                                        <div key={idx} className="preview-scope-line-item">
                                            <div className="preview-scope-dash" />
                                            <span className="preview-scope-text">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Divider Line (Rectangle 79) */}
                            <div className="preview-divider-line" />

                            {/* Grand Total (Frame 2147224969) */}
                            <div className="preview-total-block">
                                <div className="preview-total-label">Grand Total (incl. GST)</div>
                                <div className="preview-total-amount">
                                    {formatIndianCurrency(proposal.proposedValue)}
                                </div>
                            </div>
                        </div>

                        {actionError && (
                            <p className="proposals-error-banner" style={{ width: "100%" }} role="alert">
                                {actionError}
                            </p>
                        )}

                        {/* Outer Footer (Frame 2147225095) sitting directly on outer translucent surface */}
                        <div className="proposal-modal-footer-details">
                            <button type="button" className="proposal-btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <div className="proposal-footer-right-group">
                                <button
                                    type="button"
                                    className="proposal-btn-edit"
                                    disabled={actionLoading}
                                    onClick={async () => {
                                        const value = window.prompt("Proposed value (₹)", String(proposal.proposedValue));
                                        if (value === null) return;
                                        const proposedValue = Number(value);
                                        if (!Number.isFinite(proposedValue) || proposedValue < 0) {
                                            setActionError("Enter a valid proposed value.");
                                            return;
                                        }
                                        setActionLoading(true);
                                        setActionError("");
                                        try {
                                            const response = await fetch(`/api/v1/proposals/${proposalId}`, {
                                                method: "PATCH",
                                                credentials: "include",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ proposedValue }),
                                            });
                                            const payload = await response.json();
                                            if (!response.ok) throw new Error(getApiErrorMessage(payload));
                                            setProposal(parseApiResponse<any>(payload));
                                        } catch (editError) {
                                            setActionError(getApiErrorMessage(editError));
                                        } finally {
                                            setActionLoading(false);
                                        }
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    className="proposal-btn-download-pdf"
                                    disabled={actionLoading}
                                    onClick={async () => {
                                        setActionLoading(true);
                                        setActionError("");
                                        try {
                                            const response = await fetch(`/api/v1/proposals/${proposalId}/pdf`, {
                                                credentials: "include",
                                            });
                                            if (!response.ok) throw new Error(getApiErrorMessage(await response.json()));
                                            const blob = await response.blob();
                                            const url = URL.createObjectURL(blob);
                                            const link = document.createElement("a");
                                            link.href = url;
                                            link.download = `${proposal.proposalCode}.pdf`;
                                            link.click();
                                            URL.revokeObjectURL(url);
                                        } catch (downloadError) {
                                            setActionError(getApiErrorMessage(downloadError));
                                        } finally {
                                            setActionLoading(false);
                                        }
                                    }}
                                >
                                    {actionLoading ? "Preparing..." : "Download PDF"}
                                </button>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}
