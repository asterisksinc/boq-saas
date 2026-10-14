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
        <main className="fig-dashboard" style={{ background: "#edf2f9" }}>
            <div className="fig-dashboard-glow" />

            <ClientDashboardRail current="/client/invoices" />

            <div className="fig-dashboard-main">
                <DashboardHeader title="Invoices" hideNew={true} />

                <section style={{ padding: "28px 36px" }}>
                    {/* Top sub-bar matching Reference 2 */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "24px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <button
                                type="button"
                                onClick={() => router.push("/client/invoices")}
                                aria-label="Go back to invoices list"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    background: "#ffffff",
                                    color: "#0f172a",
                                    cursor: "pointer",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                }}
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                {invoiceCodeDisplay}
                            </h2>
                        </div>

                        <button
                            type="button"
                            disabled={submitting || !selectedBoq}
                            onClick={handleCreateAndInitiatePay}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "9px 20px",
                                borderRadius: "8px",
                                border: "none",
                                background: selectedBoq ? "#2563eb" : "#94a3b8",
                                color: "#ffffff",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: selectedBoq && !submitting ? "pointer" : "not-allowed",
                                boxShadow: selectedBoq ? "0 1px 2px rgba(37, 99, 235, 0.2)" : "none",
                                transition: "all 0.15s ease",
                            }}
                        >
                            {submitting && <Loader2 className="animate-spin" size={16} />}
                            Pay Invoice
                        </button>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div
                            style={{
                                padding: "12px 16px",
                                borderRadius: "8px",
                                backgroundColor: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#b91c1c",
                                marginBottom: "20px",
                                fontSize: "13px",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* 2-Column Layout matching Reference 2 */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "24px",
                            alignItems: "start",
                        }}
                    >
                        {/* LEFT COLUMN: INVOICE INFORMATION */}
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    marginBottom: "12px",
                                }}
                            >
                                INVOICE INFORMATION
                            </div>

                            <div
                                style={{
                                    background: "#ffffff",
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    padding: "24px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                }}
                            >
                                {/* Select BOQ */}
                                <div style={{ marginBottom: "20px", position: "relative" }}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            color: "#0f172a",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        Select BOQ <span style={{ color: "#ef4444" }}>*</span>
                                    </label>

                                    {/* Dropdown trigger */}
                                    <div
                                        onClick={() => setBoqDropdownOpen(!boqDropdownOpen)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "10px 14px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            background: "#ffffff",
                                            cursor: "pointer",
                                            transition: "border-color 0.15s ease",
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
                                            style={{
                                                position: "absolute",
                                                top: "calc(100% + 4px)",
                                                left: 0,
                                                right: 0,
                                                background: "#ffffff",
                                                borderRadius: "8px",
                                                border: "1px solid #cbd5e1",
                                                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                                                zIndex: 30,
                                                maxHeight: "260px",
                                                overflowY: "auto",
                                            }}
                                        >
                                            <div style={{ padding: "8px", borderBottom: "1px solid #f1f5f9" }}>
                                                <input
                                                    type="text"
                                                    placeholder="Search by BOQ number or project..."
                                                    value={boqSearchQuery}
                                                    onChange={(e) => setBoqSearchQuery(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        width: "100%",
                                                        padding: "6px 10px",
                                                        fontSize: "13px",
                                                        border: "1px solid #e2e8f0",
                                                        borderRadius: "6px",
                                                        outline: "none",
                                                        boxSizing: "border-box",
                                                    }}
                                                />
                                            </div>

                                            {loadingBoqs ? (
                                                <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                                                    <Loader2 className="animate-spin" size={18} style={{ margin: "0 auto 6px auto" }} />
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
                                                            background: selectedBoq?.id === b.id ? "#eff6ff" : "#ffffff",
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
                                                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                                            {formatCompactMoney(b.grandTotal)}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Issue Date & Due Date columns */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                color: "#0f172a",
                                                marginBottom: "8px",
                                            }}
                                        >
                                            Issue Date <span style={{ color: "#ef4444" }}>*</span>
                                        </label>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "9px 12px",
                                                borderRadius: "8px",
                                                border: "1px solid #cbd5e1",
                                                background: "#ffffff",
                                                gap: "8px",
                                            }}
                                        >
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
                                                }}
                                            />
                                            <Calendar size={16} color="#64748b" style={{ flexShrink: 0, pointerEvents: "none" }} />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                color: "#0f172a",
                                                marginBottom: "8px",
                                            }}
                                        >
                                            Due Date <span style={{ color: "#ef4444" }}>*</span>
                                        </label>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "9px 12px",
                                                borderRadius: "8px",
                                                border: "1px solid #cbd5e1",
                                                background: "#ffffff",
                                                gap: "8px",
                                            }}
                                        >
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
                                                }}
                                            />
                                            <Calendar size={16} color="#64748b" style={{ flexShrink: 0, pointerEvents: "none" }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: INVOICE PREVIEW */}
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    marginBottom: "12px",
                                }}
                            >
                                INVOICE PREVIEW
                            </div>

                            <div
                                style={{
                                    background: "#ffffff",
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0",
                                    padding: "24px",
                                    minHeight: "440px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                {loadingDetail ? (
                                    <div style={{ margin: "auto", textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                                        <Loader2 className="animate-spin" size={28} color="#2563eb" style={{ margin: "0 auto 10px auto" }} />
                                        <div style={{ fontSize: "14px", fontWeight: 500 }}>Generating invoice preview...</div>
                                    </div>
                                ) : !selectedBoq ? (
                                    // Clean empty state matching Reference 2
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
                                                background: "#f1f5f9",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                margin: "0 auto 14px auto",
                                                color: "#94a3b8",
                                            }}
                                        >
                                            <FileText size={28} />
                                        </div>
                                        <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#475569", margin: "0 0 6px 0" }}>
                                            No BOQ Selected
                                        </h4>
                                        <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, maxWidth: "260px" }}>
                                            Select a BOQ and set dates on the left to preview your invoice here.
                                        </p>
                                    </div>
                                ) : (
                                    // Populated live preview
                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                        {/* Invoice header */}
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                paddingBottom: "16px",
                                                borderBottom: "1px solid #f1f5f9",
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                                    TAX INVOICE (DRAFT)
                                                </div>
                                                <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                                                    {invoiceCodeDisplay}
                                                </div>
                                                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                                                    Ref BOQ: <strong>{selectedBoq.boqNumber}</strong>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: "12px", color: "#64748b" }}>Total Payable</div>
                                                <div style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
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
                                                background: "#f8fafc",
                                                borderRadius: "8px",
                                                padding: "12px 14px",
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Project</div>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                                    {selectedBoq.projectName}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Issue Date</div>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                                    {formatDate(issueDate)}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Due Date</div>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                                    {formatDate(dueDate)}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Status</div>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#b45309", marginTop: "2px" }}>
                                                    Pending Payment
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items preview table */}
                                        <div style={{ overflowX: "auto" }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                                <thead>
                                                    <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                                        <th style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 600, fontSize: "11px" }}>ITEM</th>
                                                        <th style={{ textAlign: "center", padding: "8px 10px", color: "#64748b", fontWeight: 600, fontSize: "11px" }}>QTY</th>
                                                        <th style={{ textAlign: "right", padding: "8px 10px", color: "#64748b", fontWeight: 600, fontSize: "11px" }}>RATE</th>
                                                        <th style={{ textAlign: "right", padding: "8px 10px", color: "#64748b", fontWeight: 600, fontSize: "11px" }}>AMOUNT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {previewItems.slice(0, 6).map((item, idx) => (
                                                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                            <td style={{ padding: "8px 10px", color: "#0f172a", fontWeight: 500 }}>
                                                                {item.description}
                                                            </td>
                                                            <td style={{ padding: "8px 10px", textAlign: "center", color: "#64748b" }}>
                                                                {item.quantity} {item.unit}
                                                            </td>
                                                            <td style={{ padding: "8px 10px", textAlign: "right", color: "#64748b" }}>
                                                                {formatCompactMoney(item.rate)}
                                                            </td>
                                                            <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
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
                                                            <td style={{ padding: "8px 10px", color: "#0f172a" }}>
                                                                Full BOQ Execution Milestone
                                                            </td>
                                                            <td style={{ padding: "8px 10px", textAlign: "center", color: "#64748b" }}>1</td>
                                                            <td style={{ padding: "8px 10px", textAlign: "right", color: "#64748b" }}>
                                                                {formatCompactMoney(previewSubtotal)}
                                                            </td>
                                                            <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                                                                {formatCompactMoney(previewSubtotal)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Totals */}
                                        <div
                                            style={{
                                                marginLeft: "auto",
                                                width: "240px",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "6px",
                                                paddingTop: "12px",
                                                borderTop: "1px solid #e2e8f0",
                                                fontSize: "13px",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                                                <span>Subtotal</span>
                                                <span style={{ fontWeight: 500, color: "#0f172a" }}>{formatFullMoney(previewSubtotal)}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                                                <span>Tax (GST 18%)</span>
                                                <span style={{ fontWeight: 500, color: "#0f172a" }}>{formatFullMoney(previewTax)}</span>
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    fontSize: "14px",
                                                    fontWeight: 700,
                                                    color: "#0f172a",
                                                    paddingTop: "6px",
                                                    borderTop: "1px solid #e2e8f0",
                                                }}
                                            >
                                                <span>Total Amount</span>
                                                <span style={{ color: "#2563eb" }}>{formatFullMoney(previewTotal)}</span>
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
                            maxWidth: "480px",
                            width: "100%",
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                padding: "20px 24px",
                                borderBottom: "1px solid #e2e8f0",
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
                                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
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
                                    <h4 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0" }}>
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
                                            background: "#f8fafc",
                                            borderRadius: "10px",
                                            padding: "16px",
                                            marginBottom: "20px",
                                            border: "1px solid #e2e8f0",
                                        }}
                                    >
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>Total Amount to Pay</div>
                                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                                            {formatFullMoney(createdInvoiceTotal)}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: "20px" }}>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "8px", textTransform: "uppercase" }}>
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
                                                        border: paymentMethod === method.id ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                                                        backgroundColor: paymentMethod === method.id ? "#eff6ff" : "#ffffff",
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
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            borderRadius: "8px",
                                            border: "none",
                                            backgroundColor: "#2563eb",
                                            color: "#ffffff",
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            cursor: paySubmitting ? "not-allowed" : "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            boxShadow: "0 2px 4px rgba(37, 99, 235, 0.25)",
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
                                        style={{
                                            width: "100%",
                                            marginTop: "8px",
                                            padding: "10px",
                                            borderRadius: "8px",
                                            border: "1px solid #e2e8f0",
                                            backgroundColor: "#ffffff",
                                            color: "#64748b",
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            cursor: "pointer",
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
