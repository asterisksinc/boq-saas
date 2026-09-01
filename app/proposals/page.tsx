"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown } from "lucide-react";
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

export default function ProposalsPage() {
    const [proposals, setProposals] = useState<ProposalListItem[]>([]);
    const [summary, setSummary] = useState<ProposalSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<ProposalListItem | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const fetchProposals = useCallback(async (pageNum: number) => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/v1/proposals?page=${pageNum}&pageSize=20`, {
                credentials: "include",
            });
            const payload = await response.json();
            if (!response.ok) {
                setError(getApiErrorMessage(payload));
                return;
            }
            const result = parseApiResponse<PagedResponse<ProposalListItem>>(payload);
            setProposals(result.items);
            setTotal(result.total);
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
        fetchProposals(page);
        fetchSummary();
    }, [page, fetchProposals, fetchSummary]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: proposals[0]?.currency || "INR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
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

    return (
        <main className="fig-dashboard">
            <div className="fig-dashboard-glow" />
            <ProposalsRail />
            <div className="fig-dashboard-main">
                <ProposalsHeader onNewClick={() => setShowNewModal(true)} />
                <div className="fig-dashboard-container">

                    {error && <p className="error-banner" role="alert">{error}</p>}

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
                                <span className="summary-period">{summary.decidedCount} decided</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">Avg. Value</span>
                                <p className="summary-value">{formatCurrency(summary.averageValue)}</p>
                                <span className="summary-period">Per proposal</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">Pending Response</span>
                                <p className="summary-value">{summary.pendingResponse}</p>
                                <span className="summary-period">{summary.expiringSoon} expiring soon</span>
                            </div>
                        </div>
                    )}

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
                                        <td colSpan={9} style={{ textAlign: "center", padding: "20px" }}>
                                            Loading proposals...
                                        </td>
                                    </tr>
                                ) : proposals.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: "center", padding: "20px" }}>
                                            No proposals yet. Create one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    proposals.map((proposal) => (
                                        <tr key={proposal.id}>
                                            <td className="proposal-id">{proposal.proposalCode}</td>
                                            <td>{proposal.projectName}</td>
                                            <td>{proposal.clientName}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusColor(proposal.status)}`}>
                                                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="proposal-value">{formatCurrency(proposal.proposedValue)}</td>
                                            <td>{formatDate(proposal.sentAt)}</td>
                                            <td>{formatDate(proposal.expiryDate)}</td>
                                            <td className="proposal-views">
                                                <span className="view-indicator">● {proposal.viewCount}</span>
                                            </td>
                                            <td>
                                                <button
                                                    className="action-button"
                                                    onClick={() => {
                                                        setSelectedProposal(proposal);
                                                        setShowPreviewModal(true);
                                                    }}
                                                >
                                                    Preview
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {proposals.length > 0 && (
                        <div className="proposals-pagination">
                            <span>Total Proposals: {total}</span>
                            <div className="pagination-controls">
                                <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                                    ←
                                </button>
                                {Array.from({ length: Math.max(1, Math.ceil(total / 20)) }, (_, index) => index + 1).map((p) => (
                                    <button
                                        key={p}
                                        className={page === p ? "active" : ""}
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button disabled={!((page * 20) < total)} onClick={() => setPage(page + 1)}>→</button>
                            </div>
                            <div className="page-size-control">
                                <span>Show per Page:</span>
                                <select defaultValue="10">
                                    <option>10</option>
                                    <option>20</option>
                                    <option>50</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {showNewModal && (
                    <NewProposalModal
                        onClose={() => setShowNewModal(false)}
                        onRefresh={() => fetchProposals(page)}
                    />
                )}

                {showPreviewModal && selectedProposal && (
                    <ProposalPreviewModal
                        proposalId={selectedProposal.id}
                        onClose={() => {
                            setShowPreviewModal(false);
                            setSelectedProposal(null);
                        }}
                    />
                )}
            </div>
        </main>
    );
}

function ProposalsRail() {
    const router = useRouter();
    const menuIcons = ["dashboard-overview-active", "dashboard-projects", "dashboard-boqs", "dashboard-costs", "dashboard-workspace", "dashboard-estimates", "dashboard-purchase-orders", "dashboard-analytics", "dashboard-reports", "dashboard-integrations", "dashboard-billing"];
    const menuRoutes = ["/dashboard", "/projects", "/boqs", "/costs", "/workspace", "/proposals", "/invoices", "/analytics", "/documents", "/integrations", "/billing"];
    return <aside className="fig-dashboard-rail" aria-label="Dashboard navigation">
        <div className="fig-dashboard-logo"><span><img src="/assets/boq-logo-small.svg" alt="BOQ" /></span></div>
        <nav className="fig-dashboard-menu">{menuIcons.map((icon, index) => <button key={icon} className={index === 5 ? "is-current" : ""} type="button" aria-label={`Navigation item ${index + 1}`} onClick={() => router.push(menuRoutes[index])}><img src={`/assets/dashboard/${icon}.svg`} alt="" /></button>)}</nav>
        <div className="fig-dashboard-tools"><button type="button" aria-label="Help"><img src="/assets/dashboard/dashboard-help.svg" alt="" /></button><button type="button" aria-label="Settings"><img src="/assets/dashboard/dashboard-settings.svg" alt="" /></button></div>
    </aside>;
}

function ProposalsHeader({ onNewClick }: { onNewClick: () => void }) {
    return <header className="fig-dashboard-header"><h1>Proposals</h1><div className="fig-dashboard-header-actions">
        <label className="fig-dashboard-search"><img src="/assets/dashboard/dashboard-search.svg" alt="" /><input placeholder="Search..." aria-label="Search proposals" /></label>
        <button type="button" className="fig-dashboard-new" onClick={onNewClick}><Plus size={20} /><span>New</span><i /><ChevronDown size={20} /></button>
        <button type="button" className="fig-dashboard-bell" aria-label="Notifications"><img src="/assets/dashboard/dashboard-notifications.svg" alt="" /></button><div className="fig-dashboard-avatar">BO</div>
    </div></header>;
}

function NewProposalModal({
    onClose,
    onRefresh,
}: {
    onClose: () => void;
    onRefresh: () => void;
}) {
    const [step, setStep] = useState<"select" | "details" | "success">("select");
    const [sourceType, setSourceType] = useState<
        "scratch" | "boq" | "duplicate" | "template"
        | null
    >(null);
    const [formData, setFormData] = useState({
        projectName: "",
        clientName: "",
        proposedValue: "",
        expiryDate: "",
        internalNotes: "",
        sourceId: "",
    });
    const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
    const [boqs, setBoqs] = useState<Array<{ id: string; name: string }>>([]);
    const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
    const [duplicateProposals, setDuplicateProposals] = useState<
        Array<{ id: string; reference: string; projectName: string }>
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
        if (step === "details") {
            // Load relevant data based on source type
            if (sourceType === "boq") {
                // Load BOQs
                loadBoqs();
            } else if (sourceType === "duplicate") {
                // Load existing proposals
                loadProposals();
            } else if (sourceType === "template") {
                // Load templates
                loadTemplates();
            }
            // Always load projects
            loadProjects();
        }
    }, [step, sourceType]);

    const loadProjects = async () => {
        try {
            const response = await fetch("/api/v1/dashboard/recent-projects?pageSize=100", {
                credentials: "include",
            });
            if (response.ok) {
                const result = parseApiResponse<{ items?: any[] }>(await response.json());
                setProjects(
                    result.items?.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                    })) || []
                );
            }
        } catch (err) {
            console.error("Failed to load projects");
        }
    };

    const loadBoqs = async () => {
        try {
            const response = await fetch("/api/v1/dashboard/recent-boqs?pageSize=100", {
                credentials: "include",
            });
            if (response.ok) {
                const result = parseApiResponse<{ items?: any[] }>(await response.json());
                setBoqs(
                    result.items?.map((b: any) => ({
                        id: b.id,
                        name: `${b.projectName} - BOQ`,
                    })) || []
                );
            }
        } catch (err) {
            console.error("Failed to load BOQs");
        }
    };

    const loadTemplates = async () => {
        try {
            // Load saved proposal templates - this would need a backend endpoint
            setTemplates([]);
        } catch (err) {
            console.error("Failed to load templates");
        }
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
                    })) || []
                );
            }
        } catch (err) {
            console.error("Failed to load proposals");
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
                proposedValue: parseFloat(formData.proposedValue),
                expiryDate: formData.expiryDate || null,
                internalNotes: formData.internalNotes || null,
            };

            if (sourceType !== "scratch") {
                requestBody.sourceId = formData.sourceId;
            }

            const response = await fetch("/api/v1/proposals", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const responsePayload = await response.json();
            const result = parseApiResponse<{ id: string; proposalCode: string; projectName: string; clientName: string }>(responsePayload);

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
        } catch (err) {
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
                                className="option-card"
                                onClick={() => {
                                    setSourceType("scratch");
                                    setStep("details");
                                }}
                            >
                                <img
                                    src="/assets/proposal-from-scratch.svg"
                                    alt="From Scratch"
                                    className="option-icon"
                                />
                                <h3>From Scratch</h3>
                                <p>Build a new proposal with a blank slate</p>
                            </button>

                            <button
                                className="option-card"
                                onClick={() => {
                                    setSourceType("boq");
                                    setStep("details");
                                }}
                            >
                                <img
                                    src="/assets/proposal-from-boq.svg"
                                    alt="From BOQ"
                                    className="option-icon"
                                />
                                <h3>From BOQ</h3>
                                <p>Proposal from an approved BOQ</p>
                            </button>

                            <button
                                className="option-card"
                                onClick={() => {
                                    setSourceType("duplicate");
                                    setStep("details");
                                }}
                            >
                                <img
                                    src="/assets/proposal-duplicate.svg"
                                    alt="Duplicate Existing"
                                    className="option-icon"
                                />
                                <h3>Duplicate Existing</h3>
                                <p>Copy a previous proposal and modify it</p>
                            </button>

                            <button
                                className="option-card"
                                onClick={() => {
                                    setSourceType("template");
                                    setStep("details");
                                }}
                            >
                                <img
                                    src="/assets/proposal-from-template.svg"
                                    alt="From Template"
                                    className="option-icon"
                                />
                                <h3>From Template</h3>
                                <p>Use a saved proposal template</p>
                            </button>
                        </div>

                        <div className="modal-footer">
                            <button className="secondary-button" onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {step === "details" && sourceType && (
                    <form onSubmit={handleSubmit} className="modal-body">
                        <h2>Proposal Details</h2>
                        <p className="modal-subtitle">
                            Starting from: {sourceType === "scratch" ? "From Scratch" :
                                sourceType === "boq" ? "From BOQ" :
                                    sourceType === "duplicate" ? "Duplicate Existing" :
                                        "From Template"}
                        </p>

                        {error && <p className="error-banner">{error}</p>}

                        <div className="form-group">
                            <label>Project *</label>
                            <select
                                value={formData.projectName}
                                onChange={(e) =>
                                    setFormData({ ...formData, projectName: e.target.value })
                                }
                                required
                            >
                                <option value="">Select project</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.name}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Client Name *</label>
                            <input
                                type="text"
                                placeholder="ex. John Doe"
                                value={formData.clientName}
                                onChange={(e) =>
                                    setFormData({ ...formData, clientName: e.target.value })
                                }
                                required
                            />
                        </div>

                        {sourceType === "boq" && (
                            <div className="form-group">
                                <label>Select BOQ *</label>
                                <select
                                    value={formData.sourceId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, sourceId: e.target.value })
                                    }
                                    required
                                >
                                    <option value="">Select BOQ</option>
                                    {boqs.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
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
                                    onChange={(e) =>
                                        setFormData({ ...formData, sourceId: e.target.value })
                                    }
                                    required
                                >
                                    <option value="">Select proposal</option>
                                    {duplicateProposals.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.reference} - {p.projectName}
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
                                    onChange={(e) =>
                                        setFormData({ ...formData, sourceId: e.target.value })
                                    }
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
                                    placeholder="ex. 45,00,000"
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
                                rows={4}
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
                                className="secondary-button"
                                onClick={() => onClose()}
                            >
                                Edit Proposal
                            </button>
                            <button
                                type="button"
                                className="primary-button"
                                onClick={async () => {
                                    if (!createdProposal) return;
                                    setIsSubmitting(true);
                                    setError("");
                                    try {
                                        const response = await fetch(`/api/v1/proposals/${createdProposal.id}/status`, {
                                            method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ status: "sent" }),
                                        });
                                        const payload = await response.json();
                                        if (!response.ok) throw new Error(getApiErrorMessage(payload));
                                        onClose();
                                        onRefresh();
                                    } catch (sendError) {
                                        setError(getApiErrorMessage(sendError));
                                    } finally { setIsSubmitting(false); }
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
                    const viewResponse = await fetch(`/api/v1/proposals/${proposalId}/view`, { method: "POST", credentials: "include" });
                    if (viewResponse.ok) {
                        const viewData = parseApiResponse<{ viewCount: number }>(await viewResponse.json());
                        setProposal((current: any) => current ? { ...current, viewCount: viewData.viewCount } : current);
                    }
                } else {
                    setError(getApiErrorMessage(payload));
                }
            } catch (err) {
                setError("Failed to load proposal");
            } finally {
                setLoading(false);
            }
        };

        fetchProposal();
    }, [proposalId]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    ×
                </button>

                {loading ? (
                    <div className="modal-body">Loading proposal...</div>
                ) : error ? (
                    <div className="modal-body error-banner">{error}</div>
                ) : proposal ? (
                    <div className="modal-body proposal-preview">
                        <div className="preview-header">
                            <div>
                                <h1>{proposal.projectName}</h1>
                                <p className="preview-id">{proposal.proposalCode}</p>
                            </div>
                            <div className="preview-meta">
                                <p>
                                    <strong>Sent:</strong> {proposal.sentAt ? new Date(proposal.sentAt).toLocaleDateString() : "-"}
                                </p>
                                <p>
                                    <strong>Expiry:</strong>{" "}
                                    {proposal.expiryDate
                                        ? new Date(proposal.expiryDate).toLocaleDateString()
                                        : "-"}
                                </p>
                            </div>
                        </div>

                        <div className="preview-section">
                            <h3>Prepared for</h3>
                            <p>{proposal.clientName}</p>
                        </div>

                        <div className="preview-section">
                            <h3>Proposal Summary</h3>
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <span className="summary-label">Scope of Work</span>
                                    <p>{proposal.projectName}</p>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Proposed Value</span>
                                    <p>
                                        {new Intl.NumberFormat("en-IN", {
                                            style: "currency",
                                            currency: proposal.currency || "INR",
                                        }).format(proposal.proposedValue)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="preview-footer">
                            <button className="secondary-button" disabled={actionLoading} onClick={async () => {
                                const value = window.prompt("Proposed value", String(proposal.proposedValue));
                                if (value === null) return;
                                const proposedValue = Number(value);
                                if (!Number.isFinite(proposedValue) || proposedValue < 0) { setActionError("Enter a valid proposed value."); return; }
                                setActionLoading(true); setActionError("");
                                try {
                                    const response = await fetch(`/api/v1/proposals/${proposalId}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proposedValue }) });
                                    const payload = await response.json();
                                    if (!response.ok) throw new Error(getApiErrorMessage(payload));
                                    setProposal(parseApiResponse<any>(payload));
                                } catch (editError) { setActionError(getApiErrorMessage(editError)); } finally { setActionLoading(false); }
                            }}>Edit Value</button>
                            <button className="secondary-button" onClick={onClose}>
                                Cancel
                            </button>
                            {actionError && <p className="error-banner" role="alert">{actionError}</p>}
                            <button className="primary-button" disabled={actionLoading} onClick={async () => {
                                setActionLoading(true); setActionError("");
                                try {
                                    const response = await fetch(`/api/v1/proposals/${proposalId}/pdf`, { credentials: "include" });
                                    if (!response.ok) throw new Error(getApiErrorMessage(await response.json()));
                                    const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a");
                                    link.href = url; link.download = `${proposal.proposalCode}.pdf`; link.click(); URL.revokeObjectURL(url);
                                } catch (downloadError) { setActionError(getApiErrorMessage(downloadError)); } finally { setActionLoading(false); }
                            }}>{actionLoading ? "Preparing..." : "Download PDF"}</button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
