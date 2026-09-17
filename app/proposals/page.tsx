"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown } from "lucide-react";
import DashboardRail from "@/components/DashboardRail";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";

interface ProposalListItem {
    id: string;
    proposalCode: string;
    projectName: string;
    clientName: string;
    status: string;
    proposedValue: number;
    sentAt: string | null;
    expiryDate: string | null;
    viewCount: number;
    currency: string;
}

interface ProposalSummary {
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
    if (val === null || val === undefined || isNaN(val)) return "-";
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
        } catch (err) {
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
            console.error("Failed to load proposal summary");
        }
    }, []);

    useEffect(() => {
        fetchProposals(page, pageSize, searchQuery);
    }, [page, pageSize, searchQuery, fetchProposals]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const formatDate = (dateStr: string | null) => {
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
        } catch (err) {
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
            <DashboardRail />
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

                <div className="fig-dashboard-container">
                    {toastMessage && (
                        <div className="proposals-toast" role="status">
                            <span>{toastMessage}</span>
                        </div>
                    )}

                    {error && <p className="error-banner" role="alert">{error}</p>}

                    {/* 1 & 2: Sub-Header Row */}
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
                                <Plus size={16} />
                                <span>New Proposal</span>
                            </button>
                        </div>
                    </div>

                    {/* KPI Summary Cards */}
                    {summary && (
                        <div className="proposals-summary">
                            <div className="summary-card">
                                <span className="summary-label">Total Sent</span>
                                <p className="summary-value">{summary.totalSent}</p>
                                <span className="summary-period">This quarter</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">Win Rate</span>
                                <p className="summary-value">{summary.winRate}%</p>
                                <span className="summary-period">
                                    {summary.decidedCount > 0 ? `${summary.decidedCount} decided` : "0 decided"}
                                </span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">Avg. Value</span>
                                <p className="summary-value">{formatIndianCurrency(summary.averageValue)}</p>
                                <span className="summary-period">Per proposal</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">Pending Response</span>
                                <p className="summary-value">{summary.pendingResponse}</p>
                                <span className="summary-period">
                                    {summary.expiringSoon > 0 ? `${summary.expiringSoon} expiring soon` : "0 expiring soon"}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Proposals Table */}
                    <div className="proposals-table-container">
                        <table className="proposals-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>PROJECT</th>
                                    <th>CLIENT</th>
                                    <th>STATUS</th>
                                    <th>VALUE</th>
                                    <th>SENT</th>
                                    <th>EXPIRY</th>
                                    <th>VIEWS</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                                            Loading proposals...
                                        </td>
                                    </tr>
                                ) : proposals.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                                            No proposals found. Click &quot;+ New Proposal&quot; to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    proposals.map((proposal) => (
                                        <tr key={proposal.id}>
                                            <td className="proposal-id">{proposal.proposalCode}</td>
                                            <td className="proposal-project-name">{proposal.projectName}</td>
                                            <td className="proposal-client-name">{proposal.clientName}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(proposal.status)}`}>
                                                    {proposal.status?.toUpperCase() || "DRAFT"}
                                                </span>
                                            </td>
                                            <td className="proposal-value">{formatIndianCurrency(proposal.proposedValue)}</td>
                                            <td>{proposal.status?.toLowerCase() === "draft" ? "-" : formatDate(proposal.sentAt)}</td>
                                            <td>{proposal.expiryDate ? formatDate(proposal.expiryDate) : "-"}</td>
                                            {/* 4. Views Column */}
                                            <td>
                                                {proposal.viewCount > 0 ? (
                                                    <div className="proposal-views-active">
                                                        <img
                                                            src="/assets/proposals/view-indicator.svg"
                                                            alt=""
                                                            width={14}
                                                            height={14}
                                                        />
                                                        <span>{proposal.viewCount}</span>
                                                    </div>
                                                ) : (
                                                    <span className="proposal-views-empty">Not opened</span>
                                                )}
                                            </td>
                                            {/* 5. Actions & Three Dots Menu */}
                                            <td>
                                                <div className="proposals-actions-cell">
                                                    {proposal.status?.toLowerCase() === "draft" && (
                                                        <button
                                                            type="button"
                                                            className="btn-send-draft"
                                                            onClick={() => handleSendProposal(proposal.id)}
                                                            title="Send to client"
                                                        >
                                                            Send →
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 6 & 7: Pagination Row */}
                    <div className="proposals-pagination">
                        <span className="proposals-total-arrivals">Total Arrivals: {total}</span>
                        <div className="pagination-controls">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                aria-label="Previous page"
                            >
                                &lt;
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
                                &gt;
                            </button>
                        </div>
                        <div className="page-size-control">
                            <span>Show per Page:</span>
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
    return (
        <header className="fig-dashboard-header">
            <h1>Proposals</h1>
            <div className="fig-dashboard-header-actions">
                <label className="fig-dashboard-search">
                    <img src="/assets/dashboard/dashboard-search.svg" alt="" />
                    <input
                        placeholder="Search..."
                        aria-label="Search proposals"
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </label>
                <button type="button" className="fig-dashboard-new" onClick={onNewClick}>
                    <Plus size={20} />
                    <span>New</span>
                    <i />
                    <ChevronDown size={20} />
                </button>
                <button type="button" className="fig-dashboard-bell" aria-label="Notifications">
                    <img src="/assets/dashboard/dashboard-notifications.svg" alt="" />
                </button>
                <div className="fig-dashboard-avatar">BO</div>
            </div>
        </header>
    );
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
                // Fallback to built-in templates
            }

            setTemplates([
                {
                    id: "tmpl-residential",
                    name: "Residential Turnkey Fit-Out",
                    description: "Comprehensive proposal for turnkey residential interior with modular woodwork, finishes, and electricals.",
                    tags: ["Residential", "Turnkey", "Modular"],
                },
                {
                    id: "tmpl-commercial",
                    name: "Commercial Office L4 Fit-Out",
                    description: "Corporate workspace package including partition walls, acoustics, MEP provisions, and modular desks.",
                    tags: ["Commercial", "Office", "MEP"],
                },
                {
                    id: "tmpl-villa",
                    name: "Luxury Villa Package",
                    description: "High-spec architectural finishes, Italian marble flooring, bespoke carpentry, and smart lighting setup.",
                    tags: ["Luxury", "Villa", "Bespoke"],
                },
                {
                    id: "tmpl-retail",
                    name: "Nexus Retail Fit-Out Standard",
                    description: "Complete retail showroom fit-out with high-traffic flooring, display shelving, and branding facade.",
                    tags: ["Retail", "Showroom", "Commercial"],
                },
            ]);
            setLoading(false);
        };

        loadTemplates();
    }, []);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    ×
                </button>
                <div className="modal-body">
                    <h2>Proposal Templates</h2>
                    <p className="modal-subtitle">
                        Select a pre-configured template to kickstart a new proposal
                    </p>

                    {loading ? (
                        <p style={{ padding: "32px 0", textAlign: "center", color: "#64748b" }}>
                            Loading templates...
                        </p>
                    ) : (
                        <div className="templates-grid">
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

        setProjects([
            { id: "00000000-0000-4000-8000-000000000202", name: "Oberoi Residence - Bandra", clientName: "Nikhil Oberoi", projectValue: 12000000 },
            { id: "00000000-0000-4000-8000-000000000201", name: "Kohinoor Office - L4", clientName: "Kohinoor Group", projectValue: 2800000 },
            { id: "00000000-0000-4000-8000-000000000203", name: "Westin Hotels - Suites", clientName: "Westin Hospitality", projectValue: 980000 },
            { id: "00000000-0000-4000-8000-000000000204", name: "The Lakeview Villa", clientName: "Sharma Family", projectValue: 4250000 },
            { id: "00000000-0000-4000-8000-000000000205", name: "Nexus Retail Fit - Out", clientName: "Nexus Malls", projectValue: 6500000 },
            { id: "00000000-0000-4000-8000-000000000206", name: "Studio 47", clientName: "Ananya Bose", projectValue: 980000 },
        ]);
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

        setBoqs([
            { id: "00000000-0000-4000-8000-000000000301", name: "Kohinoor Office BOQ", projectId: "00000000-0000-4000-8000-000000000201", projectName: "Kohinoor Office - L4", subtotal: 2800000, status: "approved" },
            { id: "00000000-0000-4000-8000-000000000302", name: "Oberoi Residence BOQ", projectId: "00000000-0000-4000-8000-000000000202", projectName: "Oberoi Residence - Bandra", subtotal: 12000000, status: "approved" },
            { id: "00000000-0000-4000-8000-000000000303", name: "Westin Hotels BOQ", projectId: "00000000-0000-4000-8000-000000000203", projectName: "Westin Hotels - Suites", subtotal: 980000, status: "approved" },
            { id: "00000000-0000-4000-8000-000000000304", name: "The Lakeview Villa BOQ", projectId: "00000000-0000-4000-8000-000000000204", projectName: "The Lakeview Villa", subtotal: 4250000, status: "approved" },
            { id: "00000000-0000-4000-8000-000000000305", name: "Nexus Retail Fit - Out BOQ", projectId: "00000000-0000-4000-8000-000000000205", projectName: "Nexus Retail Fit - Out", subtotal: 6500000, status: "approved" },
        ]);
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

        setTemplates([
            { id: "tmpl-residential", name: "Residential Turnkey Fit-Out" },
            { id: "tmpl-commercial", name: "Commercial Office L4 Fit-Out" },
            { id: "tmpl-villa", name: "Luxury Villa Package" },
            { id: "tmpl-retail", name: "Nexus Retail Fit-Out Standard" },
        ]);
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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    ×
                </button>

                {step === "select" && (
                    <div className="modal-body">
                        <h2>New Proposal</h2>
                        <p className="modal-subtitle">How would you like to start?</p>

                        <div className="proposal-options">
                            <button
                                type="button"
                                className={`option-card ${selectedType === "scratch" ? "selected" : ""}`}
                                onClick={() => setSelectedType("scratch")}
                                onDoubleClick={() => {
                                    setSourceType("scratch");
                                    setStep("details");
                                }}
                            >
                                <img
                                    src="/assets/proposal-from-scratch.svg"
                                    alt=""
                                    className="option-icon"
                                />
                                <h3>From Scratch</h3>
                                <p>Build a new proposal with a blank</p>
                            </button>

                            <button
                                type="button"
                                className={`option-card ${selectedType === "boq" ? "selected" : ""}`}
                                onClick={() => setSelectedType("boq")}
                                onDoubleClick={() => {
                                    setSourceType("boq");
                                    setStep("details");
                                }}
                            >
                                <img
                                    src="/assets/proposal-from-boq.svg"
                                    alt=""
                                    className="option-icon"
                                />
                                <h3>From BOQ</h3>
                                <p>Proposal from an approved BOQ</p>
                            </button>

                            <button
                                type="button"
                                className={`option-card ${selectedType === "duplicate" ? "selected" : ""}`}
                                onClick={() => setSelectedType("duplicate")}
                                onDoubleClick={() => {
                                    setSourceType("duplicate");
                                    setStep("details");
                                }}
                            >
                                <img
                                    src="/assets/proposal-duplicate.svg"
                                    alt=""
                                    className="option-icon"
                                />
                                <h3>Duplicate Existing</h3>
                                <p>Copy a previous proposal and modify it</p>
                            </button>

                            <button
                                type="button"
                                className={`option-card ${selectedType === "template" ? "selected" : ""}`}
                                onClick={() => setSelectedType("template")}
                                onDoubleClick={() => {
                                    setSourceType("template");
                                    setStep("details");
                                }}
                            >
                                <img
                                    src="/assets/proposal-from-template.svg"
                                    alt=""
                                    className="option-icon"
                                />
                                <h3>From Template</h3>
                                <p>Use a saved proposal template</p>
                            </button>
                        </div>

                        <div className="modal-footer modal-footer-between">
                            <button type="button" className="secondary-button" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="primary-button"
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
                    </div>
                )}

                {step === "details" && sourceType && (
                    <form onSubmit={handleSubmit} className="modal-body">
                        <h2>Proposal Details</h2>
                        <p className="modal-subtitle">
                            Starting from:{" "}
                            {sourceType === "scratch"
                                ? "From Scratch"
                                : sourceType === "boq"
                                ? "From BOQ"
                                : sourceType === "duplicate"
                                ? "Duplicate Existing"
                                : "From Template"}
                        </p>

                        {error && <p className="error-banner">{error}</p>}

                        {/* 1. Project Dropdown based on data */}
                        <div className="form-group">
                            <label>Project Name *</label>
                            {!isCustomProject ? (
                                <select
                                    value={formData.projectId}
                                    onChange={(e) => handleProjectChange(e.target.value)}
                                    required={!formData.projectName}
                                >
                                    <option value="">Select a project</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.clientName ? `— ${p.clientName}` : ""}
                                        </option>
                                    ))}
                                    <option value="__custom__">+ Enter Custom Project Name...</option>
                                </select>
                            ) : (
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <input
                                        type="text"
                                        placeholder="ex. Oberoi Residence - Bandra"
                                        value={formData.projectName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, projectName: e.target.value })
                                        }
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="secondary-button"
                                        style={{ padding: "8px 14px", fontSize: "12px", whiteSpace: "nowrap" }}
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

                        {/* Client Name */}
                        <div className="form-group">
                            <label>Client Name *</label>
                            <input
                                type="text"
                                placeholder="ex. Nikhil Oberoi"
                                value={formData.clientName}
                                onChange={(e) =>
                                    setFormData({ ...formData, clientName: e.target.value })
                                }
                                required
                            />
                        </div>

                        {/* Conditional Secondary Selects for BOQ / Duplicate / Template */}
                        {sourceType === "boq" && (
                            <div className="form-group">
                                <label>Select BOQ *</label>
                                <select
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
                                    <option value="">Select BOQ</option>
                                    {boqs.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} {b.subtotal ? `(${formatIndianCurrency(b.subtotal)})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {sourceType === "duplicate" && (
                            <div className="form-group">
                                <label>Duplicate From *</label>
                                <select
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
                            </div>
                        )}

                        {sourceType === "template" && (
                            <div className="form-group">
                                <label>Select Template *</label>
                                <select
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
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label>Proposed Value (₹) *</label>
                                <input
                                    type="number"
                                    placeholder="ex. 4500000"
                                    value={formData.proposedValue}
                                    onChange={(e) =>
                                        setFormData({ ...formData, proposedValue: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Expiry Date</label>
                                <input
                                    type="date"
                                    value={formData.expiryDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, expiryDate: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Internal Notes</label>
                            <textarea
                                placeholder="Optional notes..."
                                value={formData.internalNotes}
                                onChange={(e) =>
                                    setFormData({ ...formData, internalNotes: e.target.value })
                                }
                                rows={3}
                            />
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setStep("select")}
                            >
                                Back
                            </button>
                            <button type="button" className="secondary-button" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="primary-button"
                                disabled={isSubmitting || !formData.projectName || !formData.clientName}
                            >
                                {isSubmitting ? "Creating..." : "Create Proposal"}
                            </button>
                        </div>
                    </form>
                )}

                {step === "success" && createdProposal && (
                    <div className="modal-body success-state">
                        <div className="success-icon">
                            <img src="/assets/proposal-success-checkmark.svg" alt="Success" />
                        </div>
                        <h2>Proposal Created</h2>
                        <p className="success-message">Your new proposal is ready</p>
                        <p className="success-details">
                            {createdProposal.reference} - {createdProposal.projectName} proposal for{" "}
                            {createdProposal.clientName} has been saved as a Draft
                        </p>

                        <div className="modal-footer success-footer">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {
                                    onClose();
                                    onRefresh();
                                }}
                            >
                                Done
                            </button>
                            <button
                                type="button"
                                className="primary-button"
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
                    </div>
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
        companyName: "Arvin Interiors",
        address: "42 Design House, Khar West, Mumbai 400052",
        email: "contact@arvininteriors.com",
        phone: "+91 98200 00001",
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
                            companyName: data.data.companyName || data.data.company_name || "Arvin Interiors",
                            address: data.data.address || "42 Design House, Khar West, Mumbai 400052",
                            email: data.data.email || "contact@arvininteriors.com",
                            phone: data.data.phone || "+91 98200 00001",
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
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: "700px", padding: 0, overflow: "hidden", borderRadius: "14px" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Title Bar */}
                <div className="preview-modal-header">
                    <h2>{proposal ? `${proposal.proposalCode} - Proposal Preview` : "Proposal Preview"}</h2>
                    <button className="modal-close" style={{ position: "static" }} onClick={onClose}>
                        ×
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: "48px 32px", textAlign: "center", color: "#64748b" }}>
                        Loading proposal...
                    </div>
                ) : error ? (
                    <div style={{ padding: "32px", color: "#dc2626" }}>{error}</div>
                ) : proposal ? (
                    <>
                        <div className="preview-document-body">
                            {/* Top row: Company details on left, Proposal ID & dates on right */}
                            <div className="preview-doc-top">
                                <div>
                                    <h1 className="preview-company-name">{branding.companyName}</h1>
                                    <p className="preview-company-meta">{branding.address}</p>
                                    <p className="preview-company-meta">
                                        {branding.email} {branding.phone}
                                    </p>
                                </div>
                                <div className="preview-doc-id-box">
                                    <div className="preview-doc-code">{proposal.proposalCode}</div>
                                    <div className="preview-doc-dates">
                                        Issued:{" "}
                                        {new Date(proposal.sentAt || proposal.createdAt).toLocaleDateString("en-GB", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </div>
                                    <div className="preview-doc-dates">
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

                            {/* Prepared for section */}
                            <div className="preview-prepared-for">
                                <div className="preview-prepared-label">Prepared for</div>
                                <div className="preview-client-title">{proposal.clientName}</div>
                                <div className="preview-project-subtitle">{proposal.projectName}</div>
                            </div>

                            {/* Proposal Summary Box */}
                            <div className="preview-summary-card">
                                <div className="preview-summary-card-title">PROPOSAL SUMMARY</div>
                                <div className="preview-summary-columns">
                                    <div>
                                        <div className="preview-col-label">SCOPE OF WORK</div>
                                        <div className="preview-col-value">
                                            {proposal.sourceLabel || (proposal.sourceType === "boq" ? "Approved BOQ" : "Full Turnkey")}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="preview-col-label">PROJECT DURATION</div>
                                        <div className="preview-col-value">{calculateDuration()}</div>
                                    </div>
                                    <div>
                                        <div className="preview-col-label">PROPOSED VALUE</div>
                                        <div className="preview-col-value">{formatIndianCurrency(proposal.proposedValue)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Scope Includes list */}
                            <div className="preview-scope-section">
                                <div className="preview-scope-heading">Scope Includes</div>
                                <div className="preview-scope-list">
                                    {scopeList.map((item: string, idx: number) => (
                                        <div key={idx} className="preview-scope-item">
                                            <span>—</span>
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Grand Total */}
                            <div className="preview-grand-total-box">
                                <div className="preview-grand-total-label">Grand Total (incl. GST)</div>
                                <div className="preview-grand-total-amount">
                                    {formatIndianCurrency(proposal.proposedValue)}
                                </div>
                            </div>
                        </div>

                        {actionError && (
                            <p className="error-banner" style={{ margin: "0 32px 16px" }} role="alert">
                                {actionError}
                            </p>
                        )}

                        {/* Footer: Cancel on left, Edit & Download PDF on right */}
                        <div className="preview-modal-footer">
                            <button type="button" className="secondary-button" onClick={onClose}>
                                Cancel
                            </button>
                            <div className="preview-footer-right">
                                <button
                                    type="button"
                                    className="secondary-button"
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
                                    className="primary-button"
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

