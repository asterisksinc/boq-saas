"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    Download,
    FileDown,
    Loader2,
    Receipt,
    RefreshCw,
    X,
} from "lucide-react";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
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
            <main className="fig-dashboard" style={{ background: "#edf2f9" }}>
                <div className="fig-dashboard-glow" />
                <ClientDashboardRail current="/client/invoices" />
                <div className="fig-dashboard-main">
                    <DashboardHeader title="Invoices" hideNew={true} />
                    <div style={{ textAlign: "center", padding: "100px 20px" }}>
                        <Loader2 className="animate-spin" size={36} color="#2563EB" style={{ margin: "0 auto 12px auto" }} />
                        <div style={{ color: "#64748b", fontSize: "14px" }}>Loading invoice details...</div>
                    </div>
                </div>
            </main>
        );
    }

    if (error || !invoice) {
        return (
            <main className="fig-dashboard" style={{ background: "#edf2f9" }}>
                <div className="fig-dashboard-glow" />
                <ClientDashboardRail current="/client/invoices" />
                <div className="fig-dashboard-main">
                    <DashboardHeader title="Invoices" hideNew={true} />
                    <div style={{ maxWidth: "500px", margin: "60px auto", padding: "32px", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                        <Receipt size={40} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
                        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                            Invoice Not Found
                        </h3>
                        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
                            {error || "The requested invoice could not be located or you lack permissions to view it."}
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push("/client/invoices")}
                            style={{
                                padding: "8px 18px",
                                borderRadius: "8px",
                                background: "#2563eb",
                                color: "#ffffff",
                                fontSize: "13px",
                                fontWeight: 600,
                                border: "none",
                                cursor: "pointer",
                            }}
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
        <main className="fig-dashboard" style={{ background: "#edf2f9" }}>
            <div className="fig-dashboard-glow" />

            <ClientDashboardRail current="/client/invoices" />

            <div className="fig-dashboard-main">
                <DashboardHeader title="Invoices" hideNew={true} />

                <section style={{ padding: "24px 36px" }}>
                    {/* Top Navigation Row matching Reference 3 */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "24px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button
                                type="button"
                                onClick={() => router.push("/client/invoices")}
                                aria-label="Back to Invoices"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "4px",
                                    color: "#0f172a",
                                    fontSize: "18px",
                                    fontWeight: 700,
                                }}
                            >
                                <ArrowLeft size={18} />
                                <span>{invoice.invoiceNumber}</span>
                            </button>
                        </div>

                        {isPayable && (
                            <button
                                type="button"
                                onClick={() => setPayModalOpen(true)}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "9px 20px",
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
                                Pay Invoice
                            </button>
                        )}
                    </div>

                    {/* Two-Column Layout matching Reference 3 */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 360px",
                            gap: "24px",
                            alignItems: "start",
                        }}
                    >
                        {/* Left Column: Invoice Details */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* Card 1: INVOICE INFORMATION */}
                            <div
                                style={{
                                    background: "#ffffff",
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    padding: "20px 24px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                }}
                            >
                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "16px" }}>
                                    INVOICE INFORMATION
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Invoice Number</div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{invoice.invoiceNumber}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Issue Date</div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{formatDate(invoice.issueDate)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Due Date</div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{formatDate(invoice.dueDate)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Status</div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: isPaid ? "#16a34a" : "#d97706" }}>
                                            {isPaid ? "Paid in Full" : "Payment Pending"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: BILL TO */}
                            <div
                                style={{
                                    background: "#ffffff",
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    padding: "20px 24px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                }}
                            >
                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "16px" }}>
                                    BILL TO
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Client Name</div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "12px" }}>
                                            {invoice.clientName}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Email</div>
                                        <div style={{ fontSize: "14px", color: "#334155" }}>
                                            {invoice.clientEmail || "arjun@riverside.dev"}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Company</div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "12px" }}>
                                            {invoice.companyName || "Riverside Developments"}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Billing Address</div>
                                        <div style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>
                                            {billingAddressText}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: PROJECT DETAILS */}
                            <div
                                style={{
                                    background: "#ffffff",
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    padding: "20px 24px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                }}
                            >
                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "16px" }}>
                                    PROJECT DETAILS
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Project</div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "12px" }}>
                                            {invoice.projectName}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Related BOQ</div>
                                        <div>
                                            <Link
                                                href="/client/boq"
                                                style={{ fontSize: "14px", fontWeight: 600, color: "#2563eb", textDecoration: "none" }}
                                            >
                                                {invoice.relatedBoqNumber || "BOQ-0071"}
                                            </Link>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Project code</div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                                            {invoice.projectCode || "PRJ-0091"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: INVOICE ITEMS */}
                            <div
                                style={{
                                    background: "#ffffff",
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    padding: "20px 24px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                }}
                            >
                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "16px" }}>
                                    INVOICE ITEMS
                                </div>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                            <th style={{ padding: "10px 0", fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em" }}>DESCRIPTION</th>
                                            <th style={{ padding: "10px 12px", fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em", textAlign: "center", width: "60px" }}>QTY</th>
                                            <th style={{ padding: "10px 12px", fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em", textAlign: "right", width: "110px" }}>RATE</th>
                                            <th style={{ padding: "10px 0", fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em", textAlign: "right", width: "110px" }}>AMOUNT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items && invoice.items.length > 0 ? (
                                            invoice.items.map((item, idx) => (
                                                <tr key={item.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                    <td style={{ padding: "14px 0", fontSize: "13px", color: "#334155" }}>
                                                        {item.description}
                                                    </td>
                                                    <td style={{ padding: "14px 12px", fontSize: "13px", color: "#64748b", textAlign: "center" }}>
                                                        {item.quantity}
                                                    </td>
                                                    <td style={{ padding: "14px 12px", fontSize: "13px", color: "#64748b", textAlign: "right" }}>
                                                        {item.rate > 0 ? formatCompact(item.rate, invoice.currency) : "As agreed"}
                                                    </td>
                                                    <td style={{ padding: "14px 0", fontSize: "13px", fontWeight: 600, color: "#0f172a", textAlign: "right" }}>
                                                        {formatCompact(item.amount || item.quantity * item.rate, invoice.currency)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td style={{ padding: "14px 0", fontSize: "13px", color: "#334155" }}>Standard fit-out services</td>
                                                <td style={{ padding: "14px 12px", fontSize: "13px", color: "#64748b", textAlign: "center" }}>1</td>
                                                <td style={{ padding: "14px 12px", fontSize: "13px", color: "#64748b", textAlign: "right" }}>As agreed</td>
                                                <td style={{ padding: "14px 0", fontSize: "13px", fontWeight: 600, color: "#0f172a", textAlign: "right" }}>
                                                    {formatCompact(invoice.totalAmount, invoice.currency)}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Card 5: TERMS & CONDITIONS matching Reference 3 */}
                            <div
                                style={{
                                    background: "#ffffff",
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    padding: "20px 24px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                }}
                            >
                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "16px" }}>
                                    TERMS &amp; CONDITIONS
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    <div>
                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "6px" }}>
                                            Payment Terms
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>
                                            <li>Payment is due within 15 days from the invoice issue date.</li>
                                            <li>100% payment due upon invoice issuance.</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "6px" }}>
                                            Payment Conditions
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>
                                            <li>Payment must be made by the invoice due date.</li>
                                            <li>Applicable taxes are included as specified in the invoice.</li>
                                            <li>Payment will be considered complete after successful receipt of funds.</li>
                                            <li>Any discrepancy regarding the invoice should be raised with the project team.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: INVOICE SUMMARY matching Reference 3 */}
                        <div
                            style={{
                                background: "#ffffff",
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0",
                                padding: "20px 24px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                position: "sticky",
                                top: "20px",
                            }}
                        >
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "20px" }}>
                                INVOICE SUMMARY
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b" }}>
                                    <span>Subtotal</span>
                                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                                        {formatMoney(invoice.subtotal, invoice.currency)}
                                    </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b" }}>
                                    <span>Discount</span>
                                    <span style={{ fontWeight: 600, color: "#0f172a" }}>₹0</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b" }}>
                                    <span>Tax / GST</span>
                                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                                        {formatMoney(invoice.taxAmount, invoice.currency)}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "15px",
                                        fontWeight: 700,
                                        color: "#2563eb",
                                        borderTop: "1px solid #e2e8f0",
                                        paddingTop: "12px",
                                        marginTop: "4px",
                                    }}
                                >
                                    <span>Grand Total</span>
                                    <span>{formatMoney(invoice.totalAmount, invoice.currency)}</span>
                                </div>
                            </div>

                            {/* Inner Highlight Card */}
                            <div
                                style={{
                                    background: "#f8fafc",
                                    borderRadius: "10px",
                                    border: "1px solid #e2e8f0",
                                    padding: "16px",
                                    marginBottom: "16px",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                                        PAYMENT STATUS
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            padding: "3px 9px",
                                            borderRadius: "999px",
                                            backgroundColor: isPaid ? "#dcfce7" : "#fef3c7",
                                            color: isPaid ? "#16a34a" : "#b45309",
                                        }}
                                    >
                                        {isPaid ? "PAID" : "PAYMENT PENDING"}
                                    </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>
                                    <span>Amount Due</span>
                                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                                        {formatMoney(invoice.outstanding, invoice.currency)}
                                    </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b" }}>
                                    <span>Due Date</span>
                                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                                        {formatDate(invoice.dueDate)}
                                    </span>
                                </div>
                            </div>

                            {/* Primary Payment Action matching Reference 3 */}
                            {isPayable ? (
                                <button
                                    type="button"
                                    onClick={() => setPayModalOpen(true)}
                                    style={{
                                        width: "100%",
                                        padding: "11px 0",
                                        borderRadius: "8px",
                                        background: "#2563eb",
                                        color: "#ffffff",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        border: "none",
                                        cursor: "pointer",
                                        boxShadow: "0 1px 2px rgba(37, 99, 235, 0.2)",
                                        marginBottom: "8px",
                                    }}
                                >
                                    Pay Invoice
                                </button>
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        padding: "10px 0",
                                        borderRadius: "8px",
                                        background: "#f0fdf4",
                                        color: "#16a34a",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        textAlign: "center",
                                        border: "1px solid #bbf7d0",
                                        marginBottom: "8px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "6px",
                                    }}
                                >
                                    <CheckCircle2 size={16} /> Paid in Full
                                </div>
                            )}

                            {/* Download PDF Secondary Action */}
                            <button
                                type="button"
                                onClick={() => window.open(`/api/v1/client/invoices/${invoice.id}/pdf`, "_blank")}
                                style={{
                                    width: "100%",
                                    padding: "9px 0",
                                    borderRadius: "8px",
                                    background: "#ffffff",
                                    color: "#475569",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    border: "1px solid #e2e8f0",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                }}
                            >
                                <Download size={14} /> Download PDF
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Pay Invoice Modal */}
            {payModalOpen && (
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
                            maxWidth: "480px",
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

                        <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>Project</div>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                {invoice.projectName}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "13px", color: "#64748b" }}>Outstanding Balance:</span>
                                <span style={{ fontSize: "16px", fontWeight: 700, color: "#2563eb" }}>
                                    {formatMoney(invoice.outstanding, invoice.currency)}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "8px" }}>
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
                                            name="paymentMethodDetail"
                                            checked={paymentMethod === m.key}
                                            onChange={() => setPaymentMethod(m.key as any)}
                                        />
                                        <span>{m.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === "bank_transfer" && invoice.bankDetails && (
                            <div style={{ background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "12px", marginBottom: "18px", fontSize: "12px", color: "#475569" }}>
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
                                    disabled={paySubmitting}
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
