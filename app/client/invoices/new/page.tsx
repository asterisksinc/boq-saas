"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    CreditCard,
    FileText,
    Loader2,
    Receipt,
    Search,
    X,
} from "lucide-react";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import "@/app/client/client-redesign.css";
import {
    createClientInvoice,
    getClientBoq,
    listClientBoqs,
    payClientInvoice,
    type ClientBoqDetail,
    type ClientBoqListItem,
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

function formatFullMoney(amount?: number, currency = "INR") {
    if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(amount);
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

export default function ClientCreateInvoicePage() {
    const router = useRouter();

    // Data state
    const [boqs, setBoqs] = useState<ClientBoqListItem[]>([]);
    const [loadingBoqs, setLoadingBoqs] = useState(true);
    const [selectedBoq, setSelectedBoq] = useState<ClientBoqListItem | null>(null);
    const [boqDetail, setBoqDetail] = useState<ClientBoqDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Form inputs
    const [boqDropdownOpen, setBoqDropdownOpen] = useState(false);
    const [boqSearchQuery, setBoqSearchQuery] = useState("");
    const [issueDate, setIssueDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split("T")[0];
    });

    // Submission & payment state
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);
    const [createdInvoiceNumber, setCreatedInvoiceNumber] = useState<string | null>(null);
    const [createdInvoiceTotal, setCreatedInvoiceTotal] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "upi" | "card">("bank_transfer");
    const [paySubmitting, setPaySubmitting] = useState(false);
    const [paySuccess, setPaySuccess] = useState(false);

    // Load BOQs
    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoadingBoqs(true);
            try {
                const res = await listClientBoqs({ pageSize: 50 });
                if (mounted) {
                    setBoqs(res.items || []);
                }
            } catch (err: any) {
                if (mounted) setError(err.message || "Failed to load BOQs.");
            } finally {
                if (mounted) setLoadingBoqs(false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, []);

    // Load BOQ details when selected
    const handleSelectBoq = async (item: ClientBoqListItem) => {
        setSelectedBoq(item);
        setBoqDropdownOpen(false);
        setLoadingDetail(true);
        setError(null);
        try {
            const detail = await getClientBoq(item.id);
            setBoqDetail(detail);
        } catch (err: any) {
            console.error("Failed to load BOQ details:", err);
            // Fallback: keep selectedBoq
        } finally {
            setLoadingDetail(false);
        }
    };

    // Filter BOQs for dropdown
    const filteredBoqs = boqs.filter(
        (b) =>
            b.boqNumber.toLowerCase().includes(boqSearchQuery.toLowerCase()) ||
            b.projectName.toLowerCase().includes(boqSearchQuery.toLowerCase())
    );

    // Flatten BOQ items for live preview
    const previewItems = boqDetail?.rooms.flatMap((r) =>
        r.categories.flatMap((c) =>
            c.items.map((i) => ({
                description: `${r.name ? `${r.name} - ` : ""}${i.name}`,
                quantity: i.quantity || 1,
                unit: i.unit || "nos",
                rate: i.rate || 0,
                amount: i.amount || (i.quantity || 1) * (i.rate || 0),
            }))
        )
    ) || [];

    const previewSubtotal = boqDetail?.subtotal || selectedBoq?.subtotal || selectedBoq?.grandTotal || 0;
    const previewTax = boqDetail?.taxAmount || Math.round(previewSubtotal * 0.18);
    const previewTotal = boqDetail?.grandTotal || selectedBoq?.grandTotal || previewSubtotal + previewTax;

    const handleCreateAndInitiatePay = async () => {
        if (!selectedBoq) {
            setError("Please select a BOQ first to generate the invoice.");
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            const res = await createClientInvoice({
                boqId: selectedBoq.id,
                issueDate,
                dueDate,
                milestone: `BOQ ${selectedBoq.boqNumber} Milestone`,
            });
            setCreatedInvoiceId(res.id);
            setCreatedInvoiceNumber(res.invoiceNumber);
            setCreatedInvoiceTotal(res.totalAmount);
            setPayModalOpen(true);
        } catch (err: any) {
            setError(err.message || "Failed to create invoice from selected BOQ.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!createdInvoiceId) return;
        setPaySubmitting(true);
        try {
            await payClientInvoice(createdInvoiceId, {
                amount: createdInvoiceTotal,
                method: paymentMethod,
                reference: `${paymentMethod.toUpperCase()}-TXN-${Date.now().toString().slice(-6)}`,
                notes: `Client online settlement for ${createdInvoiceNumber}`,
            });
            setPaySuccess(true);
            setTimeout(() => {
                setPayModalOpen(false);
                router.push(`/client/invoices/${createdInvoiceId}`);
            }, 1200);
        } catch (err: any) {
            alert(err.message || "Payment execution failed.");
            setPaySubmitting(false);
        }
    };

    const invoiceCodeDisplay = createdInvoiceNumber || (selectedBoq ? `INV-0091` : "INV-0091");

    return (
        <main className="client-redesign-shell">
            <div className="client-bg-glow" />

            <ClientDashboardRail current="/client/invoices" />

            <div className="client-main-area">
                <DashboardHeader title="Invoices" hideNew={true} />

                <section style={{ padding: "28px 36px" }}>
                    {/* Top sub-bar matching Frame 2147225068 */}
                    <div className="client-invoice-header-row" style={{ marginBottom: "24px" }}>
                        <div className="client-invoice-header-left">
                            <button
                                type="button"
                                onClick={() => router.push("/client/invoices")}
                                aria-label="Go back to invoices list"
                                className="client-btn-icon"
                                style={{ width: "38px", height: "38px" }}
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <h2 className="client-invoice-header-code">
                                {invoiceCodeDisplay}
                            </h2>
                        </div>

                        <div className="client-invoice-header-actions">
                            <button
                                type="button"
                                disabled={submitting || !selectedBoq}
                                onClick={handleCreateAndInitiatePay}
                                className="client-invoice-pay-btn"
                                style={{
                                    opacity: selectedBoq && !submitting ? 1 : 0.6,
                                    cursor: selectedBoq && !submitting ? "pointer" : "not-allowed",
                                }}
                            >
                                {submitting && <Loader2 className="animate-spin" size={16} />}
                                Pay Invoice
                            </button>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="client-banner-error" style={{ marginBottom: "20px" }}>
                            {error}
                        </div>
                    )}

                    {/* 2-Column Layout matching Frame 2147225223 */}
                    <div className="client-invoice-grid">
                        {/* LEFT COLUMN: INVOICE INFORMATION matching Frame 2147225221 */}
                        <div className="client-invoice-panel-card">
                            <h3 className="client-invoice-section-heading">
                                INVOICE INFORMATION
                            </h3>

                            <div className="client-invoice-inner-card">
                                {/* Select BOQ */}
                                <div className="client-invoice-field-group" style={{ position: "relative" }}>
                                    <label className="client-invoice-field-label">
                                        Select BOQ <span className="client-invoice-field-required">*</span>
                                    </label>

                                    {/* Dropdown trigger matching Frame 12 */}
                                    <div
                                        onClick={() => setBoqDropdownOpen(!boqDropdownOpen)}
                                        className="client-invoice-input-control"
                                        style={{
                                            justifyContent: "space-between",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                                            <Search size={16} color="#94a3b8" />
                                            {selectedBoq ? (
                                                <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {selectedBoq.boqNumber} - {selectedBoq.projectName} ({formatCompactMoney(selectedBoq.grandTotal)})
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: "14px", color: "#94a3b8" }}>
                                                    Select BOQ
                                                </span>
                                            )}
                                        </div>
                                        <ChevronDown size={16} color="#64748b" style={{ transform: boqDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
                                    </div>

                                    {/* Dropdown list */}
                                    {boqDropdownOpen && (
                                        <div
                                            className="client-surface-card"
                                            style={{
                                                position: "absolute",
                                                top: "calc(100% + 4px)",
                                                left: 0,
                                                right: 0,
                                                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.12)",
                                                zIndex: 30,
                                                maxHeight: "260px",
                                                overflowY: "auto",
                                                borderRadius: "8px",
                                            }}
                                        >
                                            <div style={{ padding: "8px", borderBottom: "1px solid #f1f5f9" }}>
                                                <input
                                                    type="text"
                                                    placeholder="Search by BOQ number or project..."
                                                    value={boqSearchQuery}
                                                    onChange={(e) => setBoqSearchQuery(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="client-input"
                                                    style={{ width: "100%", padding: "7px 10px", fontSize: "13px" }}
                                                />
                                            </div>

                                            {loadingBoqs ? (
                                                <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                                                    <Loader2 className="animate-spin" size={18} style={{ margin: "0 auto 6px auto", color: "#2563EB" }} />
                                                    Loading BOQs...
                                                </div>
                                            ) : filteredBoqs.length === 0 ? (
                                                <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                                                    No matching BOQs found
                                                </div>
                                            ) : (
                                                filteredBoqs.map((b) => (
                                                    <div
                                                        key={b.id}
                                                        onClick={() => handleSelectBoq(b)}
                                                        style={{
                                                            padding: "10px 14px",
                                                            borderBottom: "1px solid #f8fafc",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            background: selectedBoq?.id === b.id ? "#eff6ff" : "transparent",
                                                            transition: "background 0.15s ease",
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                                                                {b.boqNumber} - {b.projectName}
                                                            </div>
                                                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                                                Status: {b.status} · {b.itemsCount || 0} items
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb" }}>
                                                            {formatCompactMoney(b.grandTotal)}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Issue Date & Due Date columns matching Frame 2147225454 */}
                                <div className="client-invoice-date-row">
                                    <div className="client-invoice-field-group">
                                        <label className="client-invoice-field-label">
                                            Issue Date <span className="client-invoice-field-required">*</span>
                                        </label>
                                        <div className="client-invoice-input-control">
                                            <input
                                                type="date"
                                                value={issueDate}
                                                onChange={(e) => setIssueDate(e.target.value)}
                                                style={{
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: "13px",
                                                    color: "#0f172a",
                                                    width: "100%",
                                                    background: "transparent",
                                                    cursor: "pointer",
                                                    fontFamily: "Urbanist, sans-serif",
                                                }}
                                            />
                                            <Calendar size={16} color="#64748b" style={{ flexShrink: 0, pointerEvents: "none" }} />
                                        </div>
                                    </div>

                                    <div className="client-invoice-field-group">
                                        <label className="client-invoice-field-label">
                                            Due Date <span className="client-invoice-field-required">*</span>
                                        </label>
                                        <div className="client-invoice-input-control">
                                            <input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                style={{
                                                    border: "none",
                                                    outline: "none",
                                                    fontSize: "13px",
                                                    color: "#0f172a",
                                                    width: "100%",
                                                    background: "transparent",
                                                    cursor: "pointer",
                                                    fontFamily: "Urbanist, sans-serif",
                                                }}
                                            />
                                            <Calendar size={16} color="#64748b" style={{ flexShrink: 0, pointerEvents: "none" }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: INVOICE PREVIEW matching Frame 2147225071 */}
                        <div className="client-invoice-panel-card">
                            <h3 className="client-invoice-section-heading">
                                INVOICE PREVIEW
                            </h3>

                            <div className="client-invoice-inner-card" style={{ minHeight: "440px" }}>
                                {loadingDetail ? (
                                    <div style={{ margin: "auto", textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                                        <Loader2 className="animate-spin" size={28} color="#2563eb" style={{ margin: "0 auto 10px auto" }} />
                                        <div style={{ fontSize: "14px", fontWeight: 500 }}>Generating invoice preview...</div>
                                    </div>
                                ) : !selectedBoq ? (
                                    // Clean empty state
                                    <div
                                        style={{
                                            margin: "auto",
                                            textAlign: "center",
                                            padding: "60px 20px",
                                            color: "#94a3b8",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "56px",
                                                height: "56px",
                                                borderRadius: "12px",
                                                background: "rgba(241, 245, 249, 0.8)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                margin: "0 auto 14px auto",
                                                color: "#94a3b8",
                                            }}
                                        >
                                            <FileText size={28} />
                                        </div>
                                        <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#334155", margin: "0 0 6px 0", fontFamily: "Urbanist, sans-serif" }}>
                                            No BOQ Selected
                                        </h4>
                                        <p style={{ fontSize: "13px", color: "#64748b", margin: 0, maxWidth: "260px" }}>
                                            Select a BOQ and set dates on the left to preview your invoice here.
                                        </p>
                                    </div>
                                ) : (
                                    // Populated live preview
                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
                                        {/* Invoice header */}
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                paddingBottom: "16px",
                                                borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                                    TAX INVOICE (DRAFT)
                                                </div>
                                                <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginTop: "4px", fontFamily: "Urbanist, sans-serif" }}>
                                                    {invoiceCodeDisplay}
                                                </div>
                                                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                                                    Ref BOQ: <strong>{selectedBoq.boqNumber}</strong>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: "12px", color: "#64748b" }}>Total Payable</div>
                                                <div style={{ fontSize: "22px", fontWeight: 700, color: "#2563eb", marginTop: "2px", fontFamily: "Urbanist, sans-serif" }}>
                                                    {formatFullMoney(previewTotal)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meta grid */}
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "12px",
                                                background: "rgba(248, 250, 252, 0.8)",
                                                borderRadius: "8px",
                                                padding: "12px 14px",
                                                border: "1px solid rgba(226, 232, 240, 0.6)",
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Project</div>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                                    {selectedBoq.projectName}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Issue Date</div>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                                    {formatDate(issueDate)}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Due Date</div>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                                    {formatDate(dueDate)}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Status</div>
                                                <div style={{ fontSize: "13px", fontWeight: 700, color: "#b45309", marginTop: "2px" }}>
                                                    Pending Payment
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items preview table */}
                                        <div className="client-table-container" style={{ borderRadius: "8px" }}>
                                            <table className="client-table" style={{ fontSize: "13px" }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ textAlign: "left" }}>ITEM</th>
                                                        <th style={{ textAlign: "center" }}>QTY</th>
                                                        <th style={{ textAlign: "right" }}>RATE</th>
                                                        <th style={{ textAlign: "right" }}>AMOUNT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {previewItems.slice(0, 6).map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td style={{ color: "#0f172a", fontWeight: 500 }}>
                                                                {item.description}
                                                            </td>
                                                            <td style={{ textAlign: "center", color: "#64748b" }}>
                                                                {item.quantity} {item.unit}
                                                            </td>
                                                            <td style={{ textAlign: "right", color: "#64748b" }}>
                                                                {formatCompactMoney(item.rate)}
                                                            </td>
                                                            <td style={{ textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                                                                {formatCompactMoney(item.amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {previewItems.length > 6 && (
                                                        <tr>
                                                            <td colSpan={4} style={{ padding: "8px 10px", fontSize: "12px", color: "#64748b", fontStyle: "italic", textAlign: "center" }}>
                                                                + {previewItems.length - 6} additional line items from BOQ...
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {previewItems.length === 0 && (
                                                        <tr>
                                                            <td style={{ color: "#0f172a" }}>
                                                                Full BOQ Execution Milestone
                                                            </td>
                                                            <td style={{ textAlign: "center", color: "#64748b" }}>1</td>
                                                            <td style={{ textAlign: "right", color: "#64748b" }}>
                                                                {formatCompactMoney(previewSubtotal)}
                                                            </td>
                                                            <td style={{ textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                                                                {formatCompactMoney(previewSubtotal)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Financial Summary Hierarchy matching Frame 2147225151, 2147225152, Rectangle 30, 2147225153 */}
                                        <div className="client-invoice-summary-box">
                                            <div className="client-invoice-summary-row">
                                                <span className="client-invoice-summary-label">Subtotal</span>
                                                <span className="client-invoice-summary-val">{formatFullMoney(previewSubtotal)}</span>
                                            </div>
                                            <div className="client-invoice-summary-row">
                                                <span className="client-invoice-summary-label">GST (18%)</span>
                                                <span className="client-invoice-summary-val">{formatFullMoney(previewTax)}</span>
                                            </div>
                                            <hr className="client-invoice-summary-divider" />
                                            <div className="client-invoice-summary-row">
                                                <span className="client-invoice-summary-total-label">Total Amount</span>
                                                <span className="client-invoice-summary-total-val">{formatFullMoney(previewTotal)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* PAYMENT CONFIRMATION MODAL */}
            {payModalOpen && createdInvoiceId && (
                <div className="client-modal-backdrop">
                    <div className="client-modal-card" style={{ maxWidth: "480px" }}>
                        <div
                            style={{
                                padding: "20px 24px",
                                borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "8px",
                                        background: "#eff6ff",
                                        color: "#2563eb",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Receipt size={18} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "Urbanist, sans-serif" }}>
                                        Complete Payment
                                    </h3>
                                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                                        Invoice {createdInvoiceNumber} created successfully
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setPayModalOpen(false);
                                    router.push(`/client/invoices/${createdInvoiceId}`);
                                }}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: "24px" }}>
                            {paySuccess ? (
                                <div style={{ textAlign: "center", padding: "24px 0" }}>
                                    <CheckCircle2 size={48} color="#16a34a" style={{ margin: "0 auto 12px auto" }} />
                                    <h4 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0", fontFamily: "Urbanist, sans-serif" }}>
                                        Payment Successful!
                                    </h4>
                                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                        Receipt confirmed for {formatFullMoney(createdInvoiceTotal)}. Redirecting...
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div
                                        style={{
                                            background: "rgba(248, 250, 252, 0.8)",
                                            borderRadius: "10px",
                                            padding: "16px",
                                            marginBottom: "20px",
                                            border: "1px solid rgba(226, 232, 240, 0.8)",
                                        }}
                                    >
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>Total Amount to Pay</div>
                                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "4px", fontFamily: "Urbanist, sans-serif" }}>
                                            {formatFullMoney(createdInvoiceTotal)}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: "20px" }}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "8px", textTransform: "uppercase" }}>
                                            Select Payment Channel
                                        </label>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {[
                                                { id: "bank_transfer", label: "Direct Bank Transfer (NEFT/RTGS)", note: "Instant reconciliation via virtual account" },
                                                { id: "upi", label: "Instant UPI / QR", note: "Google Pay, PhonePe, Paytm, BHIM" },
                                                { id: "card", label: "Corporate Credit / Debit Card", note: "Visa, Mastercard, RuPay" },
                                            ].map((method) => (
                                                <label
                                                    key={method.id}
                                                    onClick={() => setPaymentMethod(method.id as any)}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "12px",
                                                        padding: "12px 14px",
                                                        borderRadius: "8px",
                                                        border: paymentMethod === method.id ? "1.5px solid #2563eb" : "1px solid rgba(226, 232, 240, 0.8)",
                                                        backgroundColor: paymentMethod === method.id ? "#eff6ff" : "rgba(255, 255, 255, 0.8)",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="payment_method"
                                                        checked={paymentMethod === method.id}
                                                        onChange={() => {}}
                                                        style={{ accentColor: "#2563eb" }}
                                                    />
                                                    <div>
                                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{method.label}</div>
                                                        <div style={{ fontSize: "11px", color: "#64748b" }}>{method.note}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={paySubmitting}
                                        onClick={handleConfirmPayment}
                                        className="client-btn-primary"
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            cursor: paySubmitting ? "not-allowed" : "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        {paySubmitting ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}
                                        Pay {formatFullMoney(createdInvoiceTotal)}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPayModalOpen(false);
                                            router.push(`/client/invoices/${createdInvoiceId}`);
                                        }}
                                        className="client-btn-secondary"
                                        style={{
                                            width: "100%",
                                            marginTop: "8px",
                                            padding: "10px",
                                            fontSize: "13px",
                                            fontWeight: 500,
                                        }}
                                    >
                                        Skip and View Invoice
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
