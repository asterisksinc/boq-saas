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
        <main className="fig-dashboard" style={{ background: "#edf2f9" }}>
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

                <section style={{ padding: "28px 36px" }}>
                    {/* Page Title & Subtitle matching Reference 1 */}
                    <div style={{ marginBottom: "22px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                                Invoices
                            </h2>
                            <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>
                                {total} {total === 1 ? "Invoice" : "Invoices"} under {activeProjectName}
                            </p>
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                type="button"
                                onClick={() => router.push("/client/invoices/new")}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    background: "#2563eb",
                                    color: "#ffffff",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    border: "none",
                                    cursor: "pointer",
                                    boxShadow: "0 1px 2px rgba(37, 99, 235, 0.2)",
                                }}
                            >
                                <Plus size={15} /> Select BOQ Invoice
                            </button>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div
                            style={{
                                padding: "14px 18px",
                                borderRadius: "8px",
                                backgroundColor: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#b91c1c",
                                marginBottom: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: "13px",
                            }}
                        >
                            <span>{error}</span>
                            <button
                                type="button"
                                onClick={loadInvoices}
                                style={{
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

                    {/* Invoices Table Container matching Reference 1 */}
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            overflow: "visible",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        }}
                    >
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ background: "#edf2fa", borderBottom: "1px solid #e2e8f0" }}>
                                    <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em" }}>ID</th>
                                    <th style={{ padding: "14px 14px", fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em" }}>TYPE</th>
                                    <th style={{ padding: "14px 16px", fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em" }}>PROJECT</th>
                                    <th style={{ padding: "14px 16px", fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em" }}>CLIENT</th>
                                    <th style={{ padding: "14px 16px", fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em" }}>MILESTONE</th>
                                    <th style={{ padding: "14px 14px", fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em" }}>STATUS</th>
                                    <th style={{ padding: "14px 16px", fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em" }}>AMOUNT</th>
                                    <th style={{ padding: "14px 16px", fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em" }}>ISSUED</th>
                                    <th style={{ padding: "14px 16px", fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em" }}>DUE</th>
                                    <th style={{ padding: "14px 16px", fontSize: "11px", fontWeight: 700, color: "#64748b", width: "48px" }} />
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} style={{ textAlign: "center", padding: "56px 16px" }}>
                                            <Loader2 className="animate-spin" size={32} color="#2563EB" style={{ margin: "0 auto 8px auto" }} />
                                            <div style={{ color: "#64748b", fontSize: "14px" }}>Loading invoices...</div>
                                        </td>
                                    </tr>
                                ) : invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} style={{ textAlign: "center", padding: "64px 16px" }}>
                                            <div style={{ maxWidth: "360px", margin: "0 auto" }}>
                                                <Receipt size={42} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
                                                <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>
                                                    No Invoices Found
                                                </h4>
                                                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
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
                                                return { label: "PRO-FORMA", bg: "#f1f5f9", color: "#475569" };
                                            }
                                            if (docType === "quote") {
                                                return { label: "QUOTE", bg: "#fae8ff", color: "#9333ea" };
                                            }
                                            return { label: "INVOICE", bg: "#e0edff", color: "#2563eb" };
                                        })();

                                        const statusBadge = (() => {
                                            const st = (inv.status || "pending").toLowerCase();
                                            if (st === "paid" || st === "accepted") {
                                                return { label: st.toUpperCase(), bg: "#dcfce7", color: "#16a34a" };
                                            }
                                            if (st === "sent") {
                                                return { label: "SENT", bg: "#e0edff", color: "#2563eb" };
                                            }
                                            if (st === "pending") {
                                                return { label: "PENDING", bg: "#f1f5f9", color: "#64748b" };
                                            }
                                            if (st === "overdue") {
                                                return { label: "OVERDUE", bg: "#fee2e2", color: "#dc2626" };
                                            }
                                            return { label: st.toUpperCase(), bg: "#f1f5f9", color: "#64748b" };
                                        })();

                                        const isMenuOpen = activeMenuId === inv.id;

                                        return (
                                            <tr
                                                key={inv.id}
                                                onClick={() => router.push(`/client/invoices/${inv.id}`)}
                                                style={{
                                                    cursor: "pointer",
                                                    borderBottom: "1px solid #f1f5f9",
                                                    transition: "background 0.15s ease",
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                            >
                                                {/* ID */}
                                                <td style={{ padding: "14px 18px", fontSize: "13px", fontWeight: 500, color: "#64748b" }}>
                                                    {inv.invoiceNumber}
                                                </td>

                                                {/* TYPE */}
                                                <td style={{ padding: "14px 14px" }}>
                                                    <span
                                                        style={{
                                                            fontSize: "11px",
                                                            fontWeight: 600,
                                                            padding: "3px 9px",
                                                            borderRadius: "999px",
                                                            backgroundColor: typeBadge.bg,
                                                            color: typeBadge.color,
                                                            letterSpacing: "0.02em",
                                                        }}
                                                    >
                                                        {typeBadge.label}
                                                    </span>
                                                </td>

                                                {/* PROJECT */}
                                                <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                                                    {inv.projectName}
                                                </td>

                                                {/* CLIENT */}
                                                <td style={{ padding: "14px 16px", fontSize: "13px", color: "#475569" }}>
                                                    {inv.clientName}
                                                </td>

                                                {/* MILESTONE */}
                                                <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>
                                                    {inv.milestone || "—"}
                                                </td>

                                                {/* STATUS */}
                                                <td style={{ padding: "14px 14px" }}>
                                                    <span
                                                        style={{
                                                            fontSize: "11px",
                                                            fontWeight: 600,
                                                            padding: "3px 9px",
                                                            borderRadius: "999px",
                                                            backgroundColor: statusBadge.bg,
                                                            color: statusBadge.color,
                                                            letterSpacing: "0.02em",
                                                        }}
                                                    >
                                                        {statusBadge.label}
                                                    </span>
                                                </td>

                                                {/* AMOUNT */}
                                                <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                                                    {formatCompactMoney(inv.totalAmount, inv.currency)}
                                                </td>

                                                {/* ISSUED */}
                                                <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>
                                                    {formatDate(inv.issueDate)}
                                                </td>

                                                {/* DUE */}
                                                <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>
                                                    {formatDate(inv.dueDate)}
                                                </td>

                                                {/* ACTIONS */}
                                                <td
                                                    style={{ padding: "14px 16px", position: "relative", textAlign: "right" }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        aria-label="Actions"
                                                        onClick={() => setActiveMenuId(isMenuOpen ? null : inv.id)}
                                                        style={{
                                                            background: "transparent",
                                                            border: "none",
                                                            color: "#94a3b8",
                                                            cursor: "pointer",
                                                            padding: "4px 6px",
                                                            borderRadius: "4px",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>

                                                    {/* Floating Action Menu matching Reference 1 */}
                                                    {isMenuOpen && (
                                                        <div
                                                            ref={menuRef}
                                                            style={{
                                                                position: "absolute",
                                                                top: "38px",
                                                                right: "16px",
                                                                width: "160px",
                                                                background: "#ffffff",
                                                                borderRadius: "8px",
                                                                border: "1px solid #e2e8f0",
                                                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                                                zIndex: 30,
                                                                padding: "4px 0",
                                                                textAlign: "left",
                                                            }}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setActiveMenuId(null);
                                                                    router.push(`/client/invoices/${inv.id}`);
                                                                }}
                                                                style={{
                                                                    width: "100%",
                                                                    padding: "8px 14px",
                                                                    fontSize: "13px",
                                                                    fontWeight: 500,
                                                                    color: "#334155",
                                                                    background: "none",
                                                                    border: "none",
                                                                    textAlign: "left",
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "8px",
                                                                }}
                                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                                            >
                                                                <Eye size={14} color="#64748b" /> View Invoice
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setActiveMenuId(null);
                                                                    window.open(`/api/v1/client/invoices/${inv.id}/pdf`, "_blank");
                                                                }}
                                                                style={{
                                                                    width: "100%",
                                                                    padding: "8px 14px",
                                                                    fontSize: "13px",
                                                                    fontWeight: 500,
                                                                    color: "#334155",
                                                                    background: "none",
                                                                    border: "none",
                                                                    textAlign: "left",
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "8px",
                                                                }}
                                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                                            >
                                                                <Download size={14} color="#64748b" /> Download PDF
                                                            </button>

                                                            {inv.status !== "paid" && (inv.outstanding > 0 || !inv.totalPaid) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        setPayingInvoice(inv);
                                                                    }}
                                                                    style={{
                                                                        width: "100%",
                                                                        padding: "8px 14px",
                                                                        fontSize: "13px",
                                                                        fontWeight: 600,
                                                                        color: "#2563eb",
                                                                        background: "none",
                                                                        border: "none",
                                                                        textAlign: "left",
                                                                        cursor: "pointer",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "8px",
                                                                        borderTop: "1px solid #f1f5f9",
                                                                    }}
                                                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#eff6ff")}
                                                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                                                >
                                                                    <CreditCard size={14} color="#2563eb" /> Pay Invoice
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

                    {/* Pagination Bar matching Reference 1 */}
                    <div
                        style={{
                            marginTop: "20px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "13px",
                            color: "#64748b",
                            flexWrap: "wrap",
                            gap: "12px",
                        }}
                    >
                        {/* Total invoices */}
                        <div style={{ fontWeight: 500 }}>
                            Total Invoices: {total}
                        </div>

                        {/* Numeric Page Controls */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                aria-label="Previous page"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "6px",
                                    border: "1px solid #e2e8f0",
                                    background: "#ffffff",
                                    color: page <= 1 ? "#cbd5e1" : "#475569",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: page <= 1 ? "not-allowed" : "pointer",
                                }}
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
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "6px",
                                            border: isActive ? "1px solid #2563eb" : "1px solid #e2e8f0",
                                            background: isActive ? "#ffffff" : "#ffffff",
                                            color: isActive ? "#2563eb" : "#475569",
                                            fontWeight: isActive ? 700 : 500,
                                            boxShadow: isActive ? "0 0 0 1px #2563eb" : "none",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {pNum}
                                    </button>
                                );
                            })}

                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                aria-label="Next page"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "6px",
                                    border: "1px solid #e2e8f0",
                                    background: "#ffffff",
                                    color: page >= totalPages ? "#cbd5e1" : "#475569",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                                }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {/* Show Per Page */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>Show per Page:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                                style={{
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #e2e8f0",
                                    background: "#ffffff",
                                    fontSize: "13px",
                                    color: "#334155",
                                    outline: "none",
                                    cursor: "pointer",
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </section>
            </div>

            {/* Pay Invoice Modal */}
            {payingInvoice && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.4)",
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
                            maxWidth: "460px",
                            width: "100%",
                            backgroundColor: "#ffffff",
                            borderRadius: "14px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                            padding: "24px",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                Pay Invoice {payingInvoice.invoiceNumber}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setPayingInvoice(null)}
                                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>Project</div>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                {payingInvoice.projectName}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "13px", color: "#64748b" }}>Amount Due:</span>
                                <span style={{ fontSize: "16px", fontWeight: 700, color: "#2563eb" }}>
                                    {formatCompactMoney(payingInvoice.outstanding || payingInvoice.totalAmount, payingInvoice.currency)}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "8px" }}>
                                Select Payment Method
                            </label>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {[
                                    { key: "bank_transfer", label: "Bank Transfer (NEFT / RTGS / IMPS)" },
                                    { key: "upi", label: "Instant UPI / QR" },
                                    { key: "card", label: "Debit / Credit Card" },
                                ].map((m) => (
                                    <label
                                        key={m.key}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            padding: "10px 14px",
                                            borderRadius: "8px",
                                            border: paymentMethod === m.key ? "1px solid #2563eb" : "1px solid #e2e8f0",
                                            background: paymentMethod === m.key ? "#eff6ff" : "#ffffff",
                                            cursor: "pointer",
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            color: paymentMethod === m.key ? "#1d4ed8" : "#334155",
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={paymentMethod === m.key}
                                            onChange={() => setPaymentMethod(m.key as any)}
                                        />
                                        <span>{m.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {paymentSuccess ? (
                            <div style={{ padding: "12px", background: "#f0fdf4", color: "#15803d", borderRadius: "8px", textAlign: "center", fontWeight: 600, fontSize: "14px" }}>
                                ✓ Payment Confirmed &amp; Recorded!
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => setPayingInvoice(null)}
                                    style={{
                                        flex: 1,
                                        padding: "10px 16px",
                                        borderRadius: "8px",
                                        border: "1px solid #e2e8f0",
                                        background: "#ffffff",
                                        color: "#475569",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={paymentSubmitting}
                                    onClick={handleConfirmPayment}
                                    style={{
                                        flex: 2,
                                        padding: "10px 16px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: "#2563eb",
                                        color: "#ffffff",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: paymentSubmitting ? "not-allowed" : "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "6px",
                                    }}
                                >
                                    {paymentSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                    Confirm Payment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
