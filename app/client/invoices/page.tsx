"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ArrowLeft,
    ChevronRight,
    Download,
    Eye,
    FileDown,
    FileText,
    Receipt,
    Search,
    AlertCircle,
    Loader2,
    RefreshCw,
    CreditCard,
    CheckCircle2,
    Clock,
    X,
} from "lucide-react";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import {
    listClientInvoices,
    getClientInvoice,
    listClientProjects,
    type ClientInvoiceListItem,
    type ClientInvoiceDetail,
    type ClientProjectDetails,
} from "@/lib/api/client";

function formatMoney(amount: number, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateStr?: string) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export default function ClientInvoicesPage() {
    const [invoices, setInvoices] = useState<ClientInvoiceListItem[]>([]);
    const [summary, setSummary] = useState({ totalInvoiced: 0, collected: 0, outstanding: 0, totalCount: 0 });
    const [projects, setProjects] = useState<ClientProjectDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Detail view
    const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoiceDetail | null>(null);

    // Filters and pagination
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const loadProjects = useCallback(async () => {
        try {
            const res = await listClientProjects();
            setProjects(res.items || []);
        } catch {
            // Ignore error
        }
    }, []);

    const loadInvoices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listClientInvoices({
                page,
                pageSize,
                status: statusFilter !== "ALL" ? statusFilter : undefined,
                search: searchQuery || undefined,
                projectId: selectedProjectId || undefined,
            });
            setInvoices(res.items);
            setSummary(res.summary);
            setTotal(res.total);
        } catch (err: any) {
            setError(err.message || "Failed to load invoices.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, statusFilter, searchQuery, selectedProjectId]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    useEffect(() => {
        loadInvoices();
    }, [loadInvoices]);

    const openInvoiceDetail = async (invoiceId: string) => {
        setDetailLoading(true);
        setError(null);
        try {
            const detail = await getClientInvoice(invoiceId);
            setSelectedInvoice(detail);
        } catch (err: any) {
            setError(err.message || "Failed to load invoice details.");
        } finally {
            setDetailLoading(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <main className="fig-dashboard">
            <div className="fig-dashboard-glow" />

            <ClientDashboardRail current="/client/invoices" />

            <div className="fig-dashboard-main">
                <DashboardHeader
                    title="Invoices"
                    hideNew={true}
                    onSearch={(q) => {
                        setSearchQuery(q);
                        setPage(1);
                    }}
                />

                <section style={{ padding: "24px 32px" }}>
                    {/* Header */}
                    <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                Invoices &amp; Payments
                            </h2>
                            <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>
                                View issued billing statements, payment receipts, and balance due
                            </p>
                        </div>
                    </div>

                    {/* Summary KPI Cards */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "16px",
                            marginBottom: "24px",
                        }}
                    >
                        <div
                            style={{
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                padding: "20px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                            }}
                        >
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                                Total Invoiced
                            </div>
                            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "6px" }}>
                                {formatMoney(summary.totalInvoiced)}
                            </div>
                            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                                {summary.totalCount} {summary.totalCount === 1 ? "invoice issued" : "invoices issued"}
                            </div>
                        </div>

                        <div
                            style={{
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                padding: "20px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                            }}
                        >
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#166534", textTransform: "uppercase" }}>
                                Total Paid
                            </div>
                            <div style={{ fontSize: "24px", fontWeight: 800, color: "#16a34a", marginTop: "6px" }}>
                                {formatMoney(summary.collected)}
                            </div>
                            <div style={{ fontSize: "12px", color: "#16a34a", marginTop: "4px" }}>
                                Confirmed received
                            </div>
                        </div>

                        <div
                            style={{
                                background: summary.outstanding > 0 ? "#fffbeb" : "#ffffff",
                                border: summary.outstanding > 0 ? "1px solid #fef3c7" : "1px solid #e2e8f0",
                                borderRadius: "12px",
                                padding: "20px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                            }}
                        >
                            <div style={{ fontSize: "12px", fontWeight: 600, color: summary.outstanding > 0 ? "#b45309" : "#64748b", textTransform: "uppercase" }}>
                                Outstanding Balance
                            </div>
                            <div style={{ fontSize: "24px", fontWeight: 800, color: summary.outstanding > 0 ? "#d97706" : "#0f172a", marginTop: "6px" }}>
                                {formatMoney(summary.outstanding)}
                            </div>
                            <div style={{ fontSize: "12px", color: summary.outstanding > 0 ? "#d97706" : "#94a3b8", marginTop: "4px" }}>
                                {summary.outstanding > 0 ? "Pending payment" : "Fully settled"}
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
                        {/* Status Filter Tabs */}
                        <div style={{ display: "flex", gap: "8px" }}>
                            {["ALL", "PENDING", "PAID", "PARTIAL", "DRAFT"].map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(st);
                                        setPage(1);
                                    }}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        border: statusFilter === st ? "1px solid #2563eb" : "1px solid #e2e8f0",
                                        backgroundColor: statusFilter === st ? "#eff6ff" : "#ffffff",
                                        color: statusFilter === st ? "#2563eb" : "#64748b",
                                        cursor: "pointer",
                                    }}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>

                        {/* Project selector */}
                        {projects.length > 1 && (
                            <select
                                value={selectedProjectId}
                                onChange={(e) => {
                                    setSelectedProjectId(e.target.value);
                                    setPage(1);
                                }}
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
                                <option value="">All Projects</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Error Banner */}
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
                                onClick={loadInvoices}
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

                    {/* Invoices Table */}
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
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>INVOICE #</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>PROJECT</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>ISSUE DATE</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>DUE DATE</th>
                                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>TOTAL</th>
                                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>PAID</th>
                                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>BALANCE</th>
                                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>STATUS</th>
                                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: "center", padding: "48px 16px" }}>
                                            <Loader2 className="animate-spin" size={32} color="#2563EB" style={{ margin: "0 auto 8px auto" }} />
                                            <div style={{ color: "#64748b", fontSize: "14px" }}>Loading your invoices...</div>
                                        </td>
                                    </tr>
                                ) : invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: "center", padding: "56px 16px" }}>
                                            <div style={{ maxWidth: "360px", margin: "0 auto" }}>
                                                <Receipt size={40} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
                                                <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>
                                                    No Invoices Found
                                                </h4>
                                                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                                    {searchQuery || statusFilter !== "ALL"
                                                        ? "No invoices match the selected filter criteria."
                                                        : "No invoices have been issued for your project yet."}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((inv) => (
                                        <tr
                                            key={inv.id}
                                            onClick={() => openInvoiceDetail(inv.id)}
                                            style={{ cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                                        >
                                            <td style={{ padding: "14px 16px", fontWeight: 600, color: "#2563eb" }}>
                                                {inv.invoiceNumber}
                                            </td>
                                            <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0f172a" }}>
                                                {inv.projectName}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>
                                                {formatDate(inv.issueDate)}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>
                                                {formatDate(inv.dueDate)}
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                                                {formatMoney(inv.totalAmount, inv.currency)}
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "right", color: "#16a34a", fontWeight: 600 }}>
                                                {formatMoney(inv.totalPaid, inv.currency)}
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "right", color: inv.outstanding > 0 ? "#d97706" : "#475569", fontWeight: 700 }}>
                                                {formatMoney(inv.outstanding, inv.currency)}
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                                <span
                                                    style={{
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        padding: "4px 10px",
                                                        borderRadius: "999px",
                                                        backgroundColor:
                                                            inv.status === "paid"
                                                                ? "#dcfce7"
                                                                : inv.status === "partial"
                                                                ? "#fef9c3"
                                                                : inv.status === "sent" || inv.status === "pending"
                                                                ? "#eff6ff"
                                                                : "#f1f5f9",
                                                        color:
                                                            inv.status === "paid"
                                                                ? "#15803d"
                                                                : inv.status === "partial"
                                                                ? "#854d0e"
                                                                : inv.status === "sent" || inv.status === "pending"
                                                                ? "#1d4ed8"
                                                                : "#475569",
                                                        textTransform: "capitalize",
                                                    }}
                                                >
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                                <div style={{ display: "inline-flex", gap: "6px" }}>
                                                    <button
                                                        type="button"
                                                        title="View Invoice Details"
                                                        onClick={() => openInvoiceDetail(inv.id)}
                                                        style={{
                                                            background: "#f1f5f9",
                                                            border: "none",
                                                            borderRadius: "6px",
                                                            padding: "6px 10px",
                                                            cursor: "pointer",
                                                            color: "#334155",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                        }}
                                                    >
                                                        <Eye size={13} /> View
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Download PDF"
                                                        onClick={() => window.open(`/api/v1/client/invoices/${inv.id}/pdf`, "_blank")}
                                                        style={{
                                                            background: "#f1f5f9",
                                                            border: "none",
                                                            borderRadius: "6px",
                                                            padding: "6px",
                                                            cursor: "pointer",
                                                            color: "#334155",
                                                        }}
                                                    >
                                                        <FileDown size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "13px", color: "#64748b" }}>
                                Total: {total} {total === 1 ? "invoice" : "invoices"}
                            </span>
                            <div style={{ display: "flex", gap: "4px" }}>
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: page <= 1 ? "not-allowed" : "pointer" }}
                                >
                                    ‹
                                </button>
                                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPage(p)}
                                        style={{
                                            padding: "4px 10px",
                                            borderRadius: "6px",
                                            border: page === p ? "1px solid #2563eb" : "1px solid #cbd5e1",
                                            background: page === p ? "#2563eb" : "#ffffff",
                                            color: page === p ? "#ffffff" : "#334155",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: page >= totalPages ? "not-allowed" : "pointer" }}
                                >
                                    ›
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Invoice Detail Modal */}
            {selectedInvoice && (
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
                            maxWidth: "760px",
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
                        {/* Modal Header */}
                        <div
                            style={{
                                padding: "20px 24px",
                                borderBottom: "1px solid #e2e8f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "10px",
                                        backgroundColor: "#eff6ff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#2563eb",
                                    }}
                                >
                                    <Receipt size={22} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                        {selectedInvoice.invoiceNumber}
                                    </h3>
                                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                                        Project: {selectedInvoice.projectName}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => window.open(`/api/v1/client/invoices/${selectedInvoice.id}/pdf`, "_blank")}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "8px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        background: "#ffffff",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#334155",
                                        cursor: "pointer",
                                    }}
                                >
                                    <FileDown size={14} color="#2563eb" /> Download PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedInvoice(null)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "#94a3b8",
                                        padding: "4px",
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                            {/* Summary row */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                                    gap: "12px",
                                    marginBottom: "24px",
                                    background: "#f8fafc",
                                    borderRadius: "10px",
                                    padding: "16px",
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: "12px", color: "#64748b" }}>Issue Date</div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                        {formatDate(selectedInvoice.issueDate)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "12px", color: "#64748b" }}>Due Date</div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                        {formatDate(selectedInvoice.dueDate)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "12px", color: "#64748b" }}>Status</div>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#2563eb", marginTop: "2px", textTransform: "capitalize" }}>
                                        {selectedInvoice.status}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "12px", color: "#64748b" }}>Milestone</div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                        {selectedInvoice.milestone || "General"}
                                    </div>
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
                                Line Items
                            </h4>
                            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", color: "#64748b" }}>DESCRIPTION</th>
                                            <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "12px", color: "#64748b", width: "80px" }}>QTY</th>
                                            <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "12px", color: "#64748b", width: "110px" }}>RATE</th>
                                            <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "12px", color: "#64748b", width: "120px" }}>AMOUNT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                                            selectedInvoice.items.map((item, idx) => (
                                                <tr key={item.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                    <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 500, color: "#0f172a" }}>
                                                        {item.description}
                                                    </td>
                                                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "13px", color: "#475569" }}>
                                                        {item.quantity}
                                                    </td>
                                                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "13px", color: "#475569" }}>
                                                        {item.rate.toLocaleString("en-IN")}
                                                    </td>
                                                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                                        {(item.amount ?? item.quantity * item.rate).toLocaleString("en-IN")}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} style={{ padding: "16px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                                                    Standard billing fee
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals Summary */}
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
                                <div style={{ width: "280px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b" }}>
                                        <span>Subtotal:</span>
                                        <span style={{ fontWeight: 600, color: "#0f172a" }}>
                                            {formatMoney(selectedInvoice.subtotal, selectedInvoice.currency)}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b" }}>
                                        <span>Tax ({selectedInvoice.taxRate}%):</span>
                                        <span style={{ fontWeight: 600, color: "#0f172a" }}>
                                            {formatMoney(selectedInvoice.taxAmount, selectedInvoice.currency)}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "15px",
                                            fontWeight: 700,
                                            color: "#0f172a",
                                            borderTop: "1px solid #e2e8f0",
                                            paddingTop: "8px",
                                        }}
                                    >
                                        <span>Total:</span>
                                        <span>{formatMoney(selectedInvoice.totalAmount, selectedInvoice.currency)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#16a34a" }}>
                                        <span>Total Paid:</span>
                                        <span style={{ fontWeight: 600 }}>
                                            {formatMoney(selectedInvoice.totalPaid, selectedInvoice.currency)}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            color: selectedInvoice.outstanding > 0 ? "#d97706" : "#16a34a",
                                            borderTop: "1px solid #e2e8f0",
                                            paddingTop: "6px",
                                        }}
                                    >
                                        <span>Outstanding:</span>
                                        <span>{formatMoney(selectedInvoice.outstanding, selectedInvoice.currency)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Details / Instructions */}
                            {selectedInvoice.bankDetails && (
                                <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0" }}>
                                    <h5 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>
                                        Bank Transfer Instructions
                                    </h5>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px", color: "#475569" }}>
                                        {selectedInvoice.bankDetails.bankName && (
                                            <div>Bank: <strong>{selectedInvoice.bankDetails.bankName}</strong></div>
                                        )}
                                        {selectedInvoice.bankDetails.accountHolder && (
                                            <div>Account Holder: <strong>{selectedInvoice.bankDetails.accountHolder}</strong></div>
                                        )}
                                        {selectedInvoice.bankDetails.accountNumber && (
                                            <div>Account #: <strong>{selectedInvoice.bankDetails.accountNumber}</strong></div>
                                        )}
                                        {selectedInvoice.bankDetails.ifscCode && (
                                            <div>IFSC: <strong>{selectedInvoice.bankDetails.ifscCode}</strong></div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div
                            style={{
                                padding: "16px 24px",
                                borderTop: "1px solid #e2e8f0",
                                display: "flex",
                                justifyContent: "flex-end",
                                background: "#f8fafc",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setSelectedInvoice(null)}
                                style={{
                                    padding: "8px 18px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    background: "#ffffff",
                                    color: "#334155",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
