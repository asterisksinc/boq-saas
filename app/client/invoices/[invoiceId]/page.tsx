"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    Download,
    Loader2,
    Receipt,
    X,
} from "lucide-react";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import "@/app/client/client-redesign.css";
import {
    getClientInvoice,
    payClientInvoice,
    type ClientInvoiceDetail,
} from "@/lib/api/client";

function formatMoney(amount?: number, currency = "INR") {
    if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatCompact(value?: number, currency = "INR"): string {
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
    return `${sign}${symbol}${new Intl.NumberFormat("en-IN").format(abs)}`;
}

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

export default function ClientInvoiceDetailPage({
    params,
}: {
    params: Promise<{ invoiceId: string }>;
}) {
    const resolvedParams = use(params);
    const invoiceId = resolvedParams.invoiceId;
    const router = useRouter();

    const [invoice, setInvoice] = useState<ClientInvoiceDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Payment state
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "upi" | "card">("bank_transfer");
    const [paySubmitting, setPaySubmitting] = useState(false);
    const [paySuccess, setPaySuccess] = useState(false);

    const loadInvoice = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getClientInvoice(invoiceId);
            setInvoice(data);
        } catch (err: any) {
            setError(err.message || "Failed to load invoice details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInvoice();
    }, [invoiceId]);

    const handleConfirmPayment = async () => {
        if (!invoice) return;
        setPaySubmitting(true);
        try {
            const paymentAmount = invoice.outstanding || invoice.totalAmount;
            await payClientInvoice(invoice.id, {
                amount: paymentAmount,
                method: paymentMethod,
                reference: `ONLINE-${Date.now().toString(36).toUpperCase()}`,
                notes: `Client payment confirmation via ${paymentMethod}`,
            });
            setPaySuccess(true);
            setTimeout(() => {
                setPaySuccess(false);
                setPayModalOpen(false);
                loadInvoice();
            }, 1200);
        } catch (err: any) {
            alert(err.message || "Could not complete payment.");
        } finally {
            setPaySubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="client-redesign-shell">
                <div className="client-bg-glow" />
                <ClientDashboardRail current="/client/invoices" />
                <div className="client-main-area">
                    <DashboardHeader title="Invoices" hideNew={true} />
                    <div style={{ textAlign: "center", padding: "100px 20px" }}>
                        <Loader2 className="animate-spin" size={36} color="#2563EB" style={{ margin: "0 auto 12px auto" }} />
                        <div style={{ color: "#64748b", fontSize: "14px", fontFamily: "Urbanist, sans-serif" }}>Loading invoice details...</div>
                    </div>
                </div>
            </main>
        );
    }

    if (error || !invoice) {
        return (
            <main className="client-redesign-shell">
                <div className="client-bg-glow" />
                <ClientDashboardRail current="/client/invoices" />
                <div className="client-main-area">
                    <DashboardHeader title="Invoices" hideNew={true} />
                    <div className="client-surface-card" style={{ maxWidth: "500px", margin: "60px auto", padding: "32px", textAlign: "center" }}>
                        <Receipt size={40} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
                        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "6px", fontFamily: "Urbanist, sans-serif" }}>
                            Invoice Not Found
                        </h3>
                        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
                            {error || "The requested invoice could not be located or you lack permissions to view it."}
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push("/client/invoices")}
                            className="client-btn-primary client-btn-compact"
                        >
                            Return to Invoices
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const isPaid = invoice.status === "paid" || invoice.outstanding <= 0;
    const isPayable = !isPaid && invoice.status !== "void";

    const billingAddressText = invoice.billingAddress
        ? [
              invoice.billingAddress.line1,
              invoice.billingAddress.line2,
              invoice.billingAddress.city,
              invoice.billingAddress.state,
              invoice.billingAddress.pincode,
          ]
              .filter(Boolean)
              .join(", ")
        : "14 Palm Grove Road, Bengaluru, Karnataka 560001";

    return (
        <main className="client-redesign-shell">
            <div className="client-bg-glow" />

            <ClientDashboardRail current="/client/invoices" />

            <div className="client-main-area">
                <DashboardHeader title="Invoices" hideNew={true} />

                <div className="client-content-workspace">
                    {/* Top Sub-Bar matching Frame 2147225068 */}
                    <div className="client-invoice-header-row">
                        <div className="client-invoice-header-left">
                            <button
                                type="button"
                                onClick={() => router.push("/client/invoices")}
                                aria-label="Back to Invoices"
                                className="client-btn-icon"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <h2 className="client-invoice-header-code">
                                {invoice.invoiceNumber}
                            </h2>
                        </div>

                        {isPayable && (
                            <button
                                type="button"
                                onClick={() => setPayModalOpen(true)}
                                className="client-invoice-pay-btn"
                            >
                                Pay Invoice
                            </button>
                        )}
                    </div>

                    {/* Main Two-Column Layout (Frame 2147225223) */}
                    <div className="client-invoice-detail-grid">
                        {/* Left Column: 5 Detail Cards (Frame 2147225457, ~843px) */}
                        <div className="client-invoice-detail-column">
                            {/* Card 1: INVOICE INFORMATION (Frame 2147225222) */}
                            <div className="client-invoice-panel-card">
                                <h3 className="client-invoice-section-heading">INVOICE INFORMATION</h3>
                                <div className="client-invoice-inner-card">
                                    <div className="client-invoice-info-grid-4">
                                        <div className="client-invoice-kv-item">
                                            <span className="client-invoice-kv-label">Invoice Number</span>
                                            <span className="client-invoice-kv-value">{invoice.invoiceNumber}</span>
                                        </div>
                                        <div className="client-invoice-kv-item">
                                            <span className="client-invoice-kv-label">Issue Date</span>
                                            <span className="client-invoice-kv-value">{formatDate(invoice.issueDate)}</span>
                                        </div>
                                        <div className="client-invoice-kv-item">
                                            <span className="client-invoice-kv-label">Due Date</span>
                                            <span className="client-invoice-kv-value">{formatDate(invoice.dueDate)}</span>
                                        </div>
                                        <div className="client-invoice-kv-item">
                                            <span className="client-invoice-kv-label">Status</span>
                                            <span className={`client-invoice-status-pill ${isPaid ? "paid" : "pending"}`}>
                                                {isPaid ? "PAID" : "PAYMENT PENDING"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: BILL TO (Frame 2147225071) */}
                            <div className="client-invoice-panel-card">
                                <h3 className="client-invoice-section-heading">BILL TO</h3>
                                <div className="client-invoice-inner-card">
                                    <div className="client-invoice-info-grid-2">
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            <div className="client-invoice-kv-item">
                                                <span className="client-invoice-kv-label">Client Name</span>
                                                <span className="client-invoice-kv-value">{invoice.clientName}</span>
                                            </div>
                                            <div className="client-invoice-kv-item">
                                                <span className="client-invoice-kv-label">Email</span>
                                                <span className="client-invoice-kv-value" style={{ fontWeight: 500, color: "#334155" }}>
                                                    {invoice.clientEmail || "arjun@riverside.dev"}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            <div className="client-invoice-kv-item">
                                                <span className="client-invoice-kv-label">Company</span>
                                                <span className="client-invoice-kv-value">{invoice.companyName || "Riverside Developments"}</span>
                                            </div>
                                            <div className="client-invoice-kv-item">
                                                <span className="client-invoice-kv-label">Billing Address</span>
                                                <span className="client-invoice-kv-value" style={{ fontWeight: 400, color: "#475569", lineHeight: 1.5 }}>
                                                    {billingAddressText}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: PROJECT DETAILS (Frame 2147225223) */}
                            <div className="client-invoice-panel-card">
                                <h3 className="client-invoice-section-heading">PROJECT DETAILS</h3>
                                <div className="client-invoice-inner-card">
                                    <div className="client-invoice-info-grid-2">
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            <div className="client-invoice-kv-item">
                                                <span className="client-invoice-kv-label">Project</span>
                                                <span className="client-invoice-kv-value">{invoice.projectName}</span>
                                            </div>
                                            <div className="client-invoice-kv-item">
                                                <span className="client-invoice-kv-label">Related BOQ</span>
                                                <div>
                                                    <Link href="/client/boq" className="client-invoice-kv-link">
                                                        {invoice.relatedBoqNumber || "BOQ-0071"}
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            <div className="client-invoice-kv-item">
                                                <span className="client-invoice-kv-label">Project code</span>
                                                <span className="client-invoice-kv-value">{invoice.projectCode || "PRJ-0091"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: INVOICE ITEMS (Frame 2147225224) */}
                            <div className="client-invoice-panel-card">
                                <h3 className="client-invoice-section-heading">INVOICE ITEMS</h3>
                                <div className="client-invoice-inner-card" style={{ padding: "12px" }}>
                                    <div className="client-invoice-table-wrap">
                                        <table className="client-invoice-detail-table">
                                            <thead className="client-invoice-detail-thead">
                                                <tr>
                                                    <th className="client-invoice-detail-th" style={{ textAlign: "left" }}>DESCRIPTION</th>
                                                    <th className="client-invoice-detail-th" style={{ textAlign: "center", width: "54px" }}>QTY</th>
                                                    <th className="client-invoice-detail-th" style={{ textAlign: "right", width: "96px" }}>RATE</th>
                                                    <th className="client-invoice-detail-th" style={{ textAlign: "right", width: "84px" }}>AMOUNT</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoice.items && invoice.items.length > 0 ? (
                                                    invoice.items.map((item, idx) => (
                                                        <tr key={item.id || idx} className="client-invoice-detail-tr">
                                                            <td className="client-invoice-detail-td client-invoice-detail-td-desc">
                                                                {item.description}
                                                            </td>
                                                            <td className="client-invoice-detail-td client-invoice-detail-td-qty">
                                                                {item.quantity}
                                                            </td>
                                                            <td className="client-invoice-detail-td client-invoice-detail-td-rate">
                                                                {item.rate > 0 ? formatCompact(item.rate, invoice.currency) : "As agreed"}
                                                            </td>
                                                            <td className="client-invoice-detail-td client-invoice-detail-td-amount">
                                                                {formatCompact(item.amount || item.quantity * item.rate, invoice.currency)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr className="client-invoice-detail-tr">
                                                        <td className="client-invoice-detail-td client-invoice-detail-td-desc">
                                                            Standard fit-out services
                                                        </td>
                                                        <td className="client-invoice-detail-td client-invoice-detail-td-qty">1</td>
                                                        <td className="client-invoice-detail-td client-invoice-detail-td-rate">As agreed</td>
                                                        <td className="client-invoice-detail-td client-invoice-detail-td-amount">
                                                            {formatCompact(invoice.totalAmount, invoice.currency)}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Card 5: TERMS & CONDITIONS (Frame 2147225225) */}
                            <div className="client-invoice-panel-card">
                                <h3 className="client-invoice-section-heading">TERMS &amp; CONDITIONS</h3>
                                <div className="client-invoice-inner-card">
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                                        <div className="client-invoice-terms-block">
                                            <h4 className="client-invoice-terms-subtitle">Payment Terms</h4>
                                            <ul className="client-invoice-terms-list">
                                                <li>Payment is due within 15 days from the invoice issue date.</li>
                                                <li>100% payment due upon invoice issuance.</li>
                                            </ul>
                                        </div>
                                        <div className="client-invoice-terms-block">
                                            <h4 className="client-invoice-terms-subtitle">Payment Conditions</h4>
                                            <ul className="client-invoice-terms-list">
                                                <li>Payment must be made by the invoice due date.</li>
                                                <li>Applicable taxes are included as specified in the invoice.</li>
                                                <li>Payment will be considered complete after successful receipt of funds.</li>
                                                <li>Any discrepancy regarding the invoice should be raised with the project team.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: INVOICE SUMMARY (Frame 2147225071, ~467px) */}
                        <div className="client-invoice-panel-card" style={{ position: "sticky", top: "16px" }}>
                            <h3 className="client-invoice-section-heading">INVOICE SUMMARY</h3>
                            <div className="client-invoice-inner-card">
                                <div className="client-invoice-summary-box" style={{ marginTop: 0, paddingTop: 0 }}>
                                    <div className="client-invoice-summary-row">
                                        <span className="client-invoice-summary-label">Subtotal</span>
                                        <span className="client-invoice-summary-val">
                                            {formatMoney(invoice.subtotal, invoice.currency)}
                                        </span>
                                    </div>
                                    <div className="client-invoice-summary-row">
                                        <span className="client-invoice-summary-label">Discount</span>
                                        <span className="client-invoice-summary-val">₹0</span>
                                    </div>
                                    <div className="client-invoice-summary-row">
                                        <span className="client-invoice-summary-label">Tax / GST</span>
                                        <span className="client-invoice-summary-val">
                                            {formatMoney(invoice.taxAmount, invoice.currency)}
                                        </span>
                                    </div>
                                    <div className="client-invoice-summary-divider" />
                                    <div className="client-invoice-summary-row">
                                        <span className="client-invoice-summary-total-label">Grand Total</span>
                                        <span className="client-invoice-summary-total-val" style={{ fontSize: "16px" }}>
                                            {formatMoney(invoice.totalAmount, invoice.currency)}
                                        </span>
                                    </div>
                                </div>

                                {/* Highlighted Payment Status Card (Frame 2147225183) */}
                                <div className="client-invoice-payment-status-card">
                                    <div className="client-invoice-payment-status-row">
                                        <span className="client-invoice-kv-label" style={{ fontWeight: 600, textTransform: "uppercase" }}>
                                            PAYMENT STATUS
                                        </span>
                                        <span className={`client-invoice-status-pill ${isPaid ? "paid" : "pending"}`}>
                                            {isPaid ? "PAID" : "PAYMENT PENDING"}
                                        </span>
                                    </div>
                                    <div className="client-invoice-payment-status-row">
                                        <span className="client-invoice-kv-label">Amount Due</span>
                                        <span className="client-invoice-kv-value" style={{ fontWeight: 700 }}>
                                            {formatMoney(invoice.outstanding, invoice.currency)}
                                        </span>
                                    </div>
                                    <div className="client-invoice-payment-status-row">
                                        <span className="client-invoice-kv-label">Due Date</span>
                                        <span className="client-invoice-kv-value" style={{ fontWeight: 500, fontSize: "13px" }}>
                                            {formatDate(invoice.dueDate)}
                                        </span>
                                    </div>
                                </div>

                                {/* Primary Payment Action Button */}
                                {isPayable ? (
                                    <button
                                        type="button"
                                        onClick={() => setPayModalOpen(true)}
                                        className="client-invoice-pay-btn"
                                        style={{ width: "100%", justifyContent: "center" }}
                                    >
                                        Pay Invoice
                                    </button>
                                ) : (
                                    <div className="client-invoice-paid-badge">
                                        <CheckCircle2 size={16} /> Paid in Full
                                    </div>
                                )}

                                {/* Secondary Action: Download PDF */}
                                <button
                                    type="button"
                                    onClick={() => window.open(`/api/v1/client/invoices/${invoice.id}/pdf`, "_blank")}
                                    className="client-btn-secondary"
                                    style={{
                                        width: "100%",
                                        height: "42px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "6px",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                    }}
                                >
                                    <Download size={14} /> Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pay Invoice Modal */}
            {payModalOpen && (
                <div className="client-modal-backdrop">
                    <div className="client-modal-card" style={{ maxWidth: "480px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid rgba(226, 232, 240, 0.8)" }}>
                            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "Urbanist, sans-serif" }}>
                                Pay Invoice {invoice.invoiceNumber}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setPayModalOpen(false)}
                                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: "14px", background: "rgba(248, 250, 252, 0.8)", borderRadius: "8px", border: "1px solid rgba(226, 232, 240, 0.8)", marginBottom: "18px" }}>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>Project</div>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                {invoice.projectName}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(226, 232, 240, 0.8)" }}>
                                <span style={{ fontSize: "13px", color: "#64748b" }}>Outstanding Balance:</span>
                                <span style={{ fontSize: "17px", fontWeight: 700, color: "#2563eb", fontFamily: "Urbanist, sans-serif" }}>
                                    {formatMoney(invoice.outstanding, invoice.currency)}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "8px" }}>
                                Payment Method
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
                                            border: paymentMethod === m.key ? "1.5px solid #2563eb" : "1px solid rgba(226, 232, 240, 0.8)",
                                            background: paymentMethod === m.key ? "#eff6ff" : "rgba(255, 255, 255, 0.8)",
                                            cursor: "pointer",
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            color: paymentMethod === m.key ? "#1d4ed8" : "#334155",
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethodDetail"
                                            checked={paymentMethod === m.key}
                                            onChange={() => setPaymentMethod(m.key as any)}
                                            style={{ accentColor: "#2563eb" }}
                                        />
                                        <span>{m.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === "bank_transfer" && invoice.bankDetails && (
                            <div style={{ background: "rgba(248, 250, 252, 0.8)", borderRadius: "8px", border: "1px solid rgba(226, 232, 240, 0.8)", padding: "12px", marginBottom: "18px", fontSize: "12px", color: "#475569" }}>
                                <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>Design Studio Beneficiary Account</div>
                                <div>Bank: <strong>{invoice.bankDetails.bankName || "HDFC Bank"}</strong></div>
                                <div>Account #: <strong>{invoice.bankDetails.accountNumber || "50200084920194"}</strong></div>
                                <div>IFSC Code: <strong>{invoice.bankDetails.ifscCode || "HDFC0001234"}</strong></div>
                            </div>
                        )}

                        {paySuccess ? (
                            <div style={{ padding: "12px", background: "#f0fdf4", color: "#15803d", borderRadius: "8px", textAlign: "center", fontWeight: 600, fontSize: "14px" }}>
                                ✓ Payment Confirmed &amp; Recorded in Database!
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => setPayModalOpen(false)}
                                    className="client-btn-secondary"
                                    style={{ flex: 1, padding: "10px 16px" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={paySubmitting}
                                    onClick={handleConfirmPayment}
                                    className="client-btn-primary"
                                    style={{
                                        flex: 2,
                                        padding: "10px 16px",
                                        cursor: paySubmitting ? "not-allowed" : "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "6px",
                                    }}
                                >
                                    {paySubmitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
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
