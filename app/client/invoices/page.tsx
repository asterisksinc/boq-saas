"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Download,
    Eye,
    FileDown,
    Loader2,
    MoreHorizontal,
    Plus,
    Receipt,
    RefreshCw,
    X,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import {
    listClientInvoices,
    listClientProjects,
    payClientInvoice,
    type ClientInvoiceListItem,
    type ClientProjectDetails,
} from "@/lib/api/client";
import "@/app/client/client-redesign.css";

function formatCompactMoney(value: number, currency = "INR"): string {
    if (value === null || value === undefined || isNaN(value)) return "₹0";
    const symbol = currency === "INR" ? "₹" : `${currency} `;
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (abs >= 10000000) {
        const cr = abs / 10000000;
        return `${sign}${symbol}${cr >= 10 ? cr.toFixed(1) : cr.toFixed(2).replace(/\.?0+$/, "")}Cr`;
    }
    if (abs >= 100000) {
        const l = abs / 100000;
        return `${sign}${symbol}${l >= 10 ? l.toFixed(1) : l.toFixed(2).replace(/\.?0+$/, "")}L`;
    }
    return `${sign}${symbol}${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(abs)}`;
}

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function ClientInvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<ClientInvoiceListItem[]>([]);
    const [projects, setProjects] = useState<ClientProjectDetails[]>([]);
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

    // Payment modal state
    const [payingInvoice, setPayingInvoice] = useState<ClientInvoiceListItem | null>(null);
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "upi" | "card">("bank_transfer");

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
                search: searchQuery || undefined,
            });
            setInvoices(res.items || []);
            setTotal(res.total || 0);
        } catch (err: any) {
            setError(err.message || "Failed to load invoices.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchQuery]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    useEffect(() => {
        loadInvoices();
    }, [loadInvoices]);

    // Close action menu on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleConfirmPayment = async () => {
        if (!payingInvoice) return;
        setPaymentSubmitting(true);
        try {
            await payClientInvoice(payingInvoice.id, {
                amount: payingInvoice.outstanding || payingInvoice.totalAmount,
                method: paymentMethod,
                reference: `ONLINE-${Date.now().toString(36).toUpperCase()}`,
                notes: `Paid via Client Portal (${paymentMethod})`,
            });
            setPaymentSuccess(true);
            setTimeout(() => {
                setPayingInvoice(null);
                setPaymentSuccess(false);
                loadInvoices();
            }, 1200);
        } catch (err: any) {
            alert(err.message || "Payment could not be completed.");
        } finally {
            setPaymentSubmitting(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        if (totalPages <= 5) return i + 1;
        const start = Math.max(1, Math.min(page - 2, totalPages - 4));
        return start + i;
    });

    const activeProjectName = projects[0]?.name || "your projects";

    return (
        <main className="client-redesign-shell">
            <div className="client-bg-glow" />

            <ClientDashboardRail current="/client/invoices" />

            <div className="client-main-area">
                <DashboardHeader
                    title="Invoices"
                    hideNew={true}
                    onSearch={(q) => {
                        setSearchQuery(q);
                        setPage(1);
                    }}
                />

                <section style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
                    {/* Page Title & Subtitle matching Reference 1 */}
                    <div className="client-page-header-row">
                        <div className="client-title-group">
                            <h1 className="client-page-title" style={{ fontSize: "20px" }}>
                                Invoices
                            </h1>
                            <p className="client-page-subtitle">
                                {total} {total === 1 ? "Invoice" : "Invoices"} under {activeProjectName}
                            </p>
                        </div>

                        <div className="client-header-actions">
                            <button
                                type="button"
                                onClick={() => router.push("/client/invoices/new")}
                                className="client-btn-primary client-btn-compact"
                            >
                                <Plus size={15} /> Select BOQ Invoice
                            </button>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="client-banner-error">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                            <button type="button" onClick={loadInvoices}>
                                <RefreshCw size={14} style={{ marginRight: "4px" }} /> Retry
                            </button>
                        </div>
                    )}

                    {/* Invoices Table Container matching Reference 1 & Frame 2147225067 */}
                    <div className="client-table-container client-invoices-table-card">
                        <div className="client-table-scroll client-invoices-table-scroll">
                            <table className="client-table client-invoices-table">
                                <thead>
                                    <tr>
                                        <th className="col-id">ID</th>
                                        <th className="col-type">TYPE</th>
                                        <th className="col-project">PROJECT</th>
                                        <th className="col-client">CLIENT</th>
                                        <th className="col-milestone">MILESTONE</th>
                                        <th className="col-status">STATUS</th>
                                        <th className="col-amount">AMOUNT</th>
                                        <th className="col-issued">ISSUED</th>
                                        <th className="col-due">DUE</th>
                                        <th className="col-actions">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={10} style={{ textAlign: "center", padding: "56px 16px" }}>
                                                <div className="client-loading-card" style={{ padding: "20px" }}>
                                                    <Loader2 className="animate-spin" size={32} color="#2563EB" />
                                                    <span>Loading invoices...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} style={{ textAlign: "center", padding: "64px 16px" }}>
                                                <div className="client-empty-card" style={{ border: "none" }}>
                                                    <Receipt size={42} color="#94A3B8" style={{ margin: "0 auto 12px auto" }} />
                                                    <h4 className="client-empty-title">
                                                        No Invoices Found
                                                    </h4>
                                                    <p className="client-empty-desc">
                                                        {searchQuery
                                                            ? "No invoices match the search query."
                                                            : "No commercial statements have been issued for your project yet."}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((inv) => {
                                            const typeBadge = (() => {
                                                const docType = (inv.documentType || "invoice").toLowerCase();
                                                if (docType === "pro_forma" || docType === "pro-forma") {
                                                    return { label: "PRO-FORMA", className: "client-badge-pending type-pro-forma" };
                                                }
                                                if (docType === "quote") {
                                                    return { label: "QUOTE", className: "client-badge-purple type-quote" };
                                                }
                                                return { label: "INVOICE", className: "client-badge-info type-invoice" };
                                            })();

                                            const statusBadge = (() => {
                                                const st = (inv.status || "pending").toLowerCase();
                                                if (st === "paid" || st === "accepted") {
                                                    return {
                                                        label: st.toUpperCase(),
                                                        className: st === "paid" ? "client-badge-success status-paid" : "client-badge-success status-accepted",
                                                    };
                                                }
                                                if (st === "sent") {
                                                    return { label: "SENT", className: "client-badge-info status-sent" };
                                                }
                                                if (st === "pending" || st === "draft") {
                                                    return {
                                                        label: st.toUpperCase(),
                                                        className: st === "draft" ? "client-badge-pending status-draft" : "client-badge-pending status-pending",
                                                    };
                                                }
                                                if (st === "overdue") {
                                                    return { label: "OVERDUE", className: "client-badge-danger status-overdue" };
                                                }
                                                return { label: st.toUpperCase(), className: "client-badge-pending status-pending" };
                                            })();

                                            const isMenuOpen = activeMenuId === inv.id;

                                            return (
                                                <tr
                                                    key={inv.id}
                                                    onClick={() => router.push(`/client/invoices/${inv.id}`)}
                                                >
                                                    {/* ID */}
                                                    <td className="muted-cell col-id">
                                                        {inv.invoiceNumber}
                                                    </td>

                                                    {/* TYPE */}
                                                    <td className="col-type">
                                                        <span className={`client-badge client-inv-type-pill ${typeBadge.className}`}>
                                                            {typeBadge.label}
                                                        </span>
                                                    </td>

                                                    {/* PROJECT */}
                                                    <td className="bold-cell col-project">
                                                        {inv.projectName}
                                                    </td>

                                                    {/* CLIENT */}
                                                    <td className="col-client">
                                                        {inv.clientName}
                                                    </td>

                                                    {/* MILESTONE */}
                                                    <td className="muted-cell col-milestone">
                                                        {inv.milestone || "—"}
                                                    </td>

                                                    {/* STATUS */}
                                                    <td className="col-status">
                                                        <span className={`client-badge client-inv-status-pill ${statusBadge.className}`}>
                                                            {statusBadge.label}
                                                        </span>
                                                    </td>

                                                    {/* AMOUNT */}
                                                    <td className="bold-cell col-amount">
                                                        {formatCompactMoney(inv.totalAmount, inv.currency)}
                                                    </td>

                                                    {/* ISSUED */}
                                                    <td className="muted-cell col-issued">
                                                        {formatDate(inv.issueDate)}
                                                    </td>

                                                    {/* DUE */}
                                                    <td className="muted-cell col-due">
                                                        {formatDate(inv.dueDate)}
                                                    </td>

                                                    {/* ACTIONS */}
                                                    <td
                                                        className="actions-cell col-actions"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="client-btn-icon"
                                                            aria-label="Actions"
                                                            onClick={() => setActiveMenuId(isMenuOpen ? null : inv.id)}
                                                        >
                                                            <MoreHorizontal size={18} />
                                                        </button>

                                                        {/* Floating Action Menu matching Reference 1 */}
                                                        {isMenuOpen && (
                                                            <div ref={menuRef} className="client-menu-popover" style={{ width: "160px" }}>
                                                                <button
                                                                    type="button"
                                                                    className="client-menu-item"
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        router.push(`/client/invoices/${inv.id}`);
                                                                    }}
                                                                >
                                                                    <Eye size={14} color="#64748B" /> View Invoice
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="client-menu-item"
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        window.open(`/api/v1/client/invoices/${inv.id}/pdf`, "_blank");
                                                                    }}
                                                                >
                                                                    <Download size={14} color="#64748B" /> Download PDF
                                                                </button>

                                                                {inv.status !== "paid" && (inv.outstanding > 0 || !inv.totalPaid) && (
                                                                    <button
                                                                        type="button"
                                                                        className="client-menu-item"
                                                                        style={{ color: "#2563EB", fontWeight: 600, borderTop: "1px solid #F1F5F9" }}
                                                                        onClick={() => {
                                                                            setActiveMenuId(null);
                                                                            setPayingInvoice(inv);
                                                                        }}
                                                                    >
                                                                        <CreditCard size={14} color="#2563EB" /> Pay Invoice
                                                                    </button>
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

                        {/* Pagination Bar matching Reference 1 & Frame 2147225166 */}
                        <div className="client-pagination-bar client-invoices-pagination-bar">
                            {/* Total invoices */}
                            <div className="client-invoices-pagination-total">
                                Total Invoices: {total}
                            </div>

                            {/* Numeric Page Controls */}
                            <div className="client-pagination-controls client-invoices-pagination-controls">
                                <button
                                    type="button"
                                    className="client-page-btn client-invoices-page-btn"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {pageNumbers.map((pNum) => {
                                    const isActive = pNum === page;
                                    return (
                                        <button
                                            key={pNum}
                                            type="button"
                                            onClick={() => setPage(pNum)}
                                            className={`client-page-btn client-invoices-page-btn ${isActive ? "active" : ""}`}
                                        >
                                            {pNum}
                                        </button>
                                    );
                                })}

                                <button
                                    type="button"
                                    className="client-page-btn client-invoices-page-btn"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* Show Per Page */}
                            <div className="client-invoices-per-page">
                                <span>Show per Page:</span>
                                <select
                                    className="client-input"
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
                </section>
            </div>

            {/* Pay Invoice Modal */}
            {payingInvoice && (
                <div className="client-modal-backdrop" onClick={() => !paymentSubmitting && setPayingInvoice(null)}>
                    <div className="client-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#0F172A" }}>
                                    Pay Invoice {payingInvoice.invoiceNumber}
                                </h3>
                                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748B" }}>
                                    {payingInvoice.projectName} · Due: {formatDate(payingInvoice.dueDate)}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="client-btn-icon"
                                onClick={() => setPayingInvoice(null)}
                                disabled={paymentSubmitting}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {paymentSuccess ? (
                            <div style={{ padding: "32px 16px", textAlign: "center" }}>
                                <CheckCircle2 size={48} color="#16A34A" style={{ margin: "0 auto 12px auto" }} />
                                <h4 style={{ fontSize: "17px", fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0" }}>
                                    Payment Successful!
                                </h4>
                                <p style={{ fontSize: "14px", color: "#64748B", margin: 0 }}>
                                    Your payment for {formatCompactMoney(payingInvoice.outstanding || payingInvoice.totalAmount, payingInvoice.currency)} has been recorded.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div
                                    style={{
                                        padding: "16px",
                                        borderRadius: "6px",
                                        backgroundColor: "#F8FAFC",
                                        border: "1px solid #E2E8F0",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <span style={{ fontSize: "14px", color: "#64748B" }}>Amount to Pay</span>
                                    <span style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A" }}>
                                        {formatCompactMoney(payingInvoice.outstanding || payingInvoice.totalAmount, payingInvoice.currency)}
                                    </span>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#0F172A", marginBottom: "8px" }}>
                                        Select Payment Method
                                    </label>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                                        {[
                                            { id: "bank_transfer", label: "NEFT / RTGS" },
                                            { id: "upi", label: "UPI" },
                                            { id: "card", label: "Credit Card" },
                                        ].map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setPaymentMethod(m.id as any)}
                                                style={{
                                                    padding: "12px 10px",
                                                    borderRadius: "6px",
                                                    border: paymentMethod === m.id ? "1.5px solid #2563EB" : "1px solid #E2E8F0",
                                                    backgroundColor: paymentMethod === m.id ? "#EFF6FF" : "#FFFFFF",
                                                    color: paymentMethod === m.id ? "#2563EB" : "#334155",
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    transition: "all 0.15s ease",
                                                }}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                                    <button
                                        type="button"
                                        className="client-btn-secondary"
                                        onClick={() => setPayingInvoice(null)}
                                        disabled={paymentSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="client-btn-primary"
                                        onClick={handleConfirmPayment}
                                        disabled={paymentSubmitting}
                                    >
                                        {paymentSubmitting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <span>Confirm & Pay Now</span>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
