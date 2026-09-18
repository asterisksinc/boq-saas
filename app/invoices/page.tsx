"use client";

import {
    ArrowLeft,
    Calendar,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Edit3,
    Plus,
    Search,
    Send,
    Trash2,
    X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import DashboardRail from "@/components/DashboardRail";
import { getApiErrorMessage, getDashboardOverview, parseApiResponse } from "@/lib/api/auth";

export type InvoiceLineItem = {
    id?: string;
    position?: number;
    description: string;
    quantity: number;
    rate: number;
    amount?: number;
};

export type InvoicePayment = {
    id: string;
    amount: number;
    paidAt: string;
    method: string | null;
    reference: string | null;
    notes: string | null;
    createdAt?: string;
};

export type Invoice = {
    id: string;
    invoiceNumber: string;
    manualNumber?: string | null;
    systemCode?: string;
    type: string;
    projectName: string | null;
    clientName: string;
    milestone: string | null;
    status: string;
    storedStatus?: string;
    taxRate?: number;
    subtotal?: number;
    taxAmount?: number;
    totalAmount: number;
    totalPaid?: number;
    outstanding: number;
    currency: string;
    issueDate: string;
    dueDate: string;
    reference?: string | null;
    additionalNotes?: string | null;
    bankDetails?: {
        bankName?: string;
        accountHolder?: string;
        accountNumber?: string;
        ifscCode?: string;
        branch?: string;
        branchAddress?: string;
    } | null;
    billingAddress?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        pincode?: string;
    } | null;
    items?: InvoiceLineItem[];
    payments?: InvoicePayment[];
    sentAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
};

type Page = {
    items: Invoice[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
};

type Summary = {
    totalInvoices: number;
    totalInvoiced: number;
    collected: number;
    outstanding: number;
    overdue: number;
    overdueCount: number;
    currency: string;
};

function formatNumber(value: number): string {
    return new Intl.NumberFormat("en-IN").format(value);
}

function formatCompact(value: number, currency = "INR"): string {
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
    return `${sign}${symbol}${formatNumber(abs)}`;
}

function formatDate(value: string | null | undefined): string {
    if (!value) return "-";
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function InvoicesPage() {
    const [page, setPage] = useState<Page | null>(null);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<Invoice | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [orgName, setOrgName] = useState<string>("Arvin Interiors");

    const load = useCallback(async (nextPage = 1, query = search, size = pageSize) => {
        setLoading(true);
        setError("");
        try {
            const [listResponse, summaryResponse, overviewData] = await Promise.all([
                fetch(
                    `/api/v1/invoices?page=${nextPage}&pageSize=${size}${query ? `&search=${encodeURIComponent(query)}` : ""}`,
                    { credentials: "include", cache: "no-store" }
                ),
                fetch("/api/v1/invoices/summary", {
                    credentials: "include",
                    cache: "no-store",
                }),
                getDashboardOverview().catch(() => null),
            ]);

            const listPayload = await listResponse.json();
            const summaryPayload = await summaryResponse.json();

            if (!listResponse.ok) throw new Error(getApiErrorMessage(listPayload));
            if (!summaryResponse.ok) throw new Error(getApiErrorMessage(summaryPayload));

            setPage(parseApiResponse<Page>(listPayload));
            setSummary(parseApiResponse<Summary>(summaryPayload));
            if (overviewData?.organization?.name) {
                setOrgName(overviewData.organization.name);
            }
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, [search, pageSize]);

    const isFirstMount = useRef(true);
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            void load(1, "", pageSize);
            return;
        }
        const timer = setTimeout(() => {
            void load(1, search, pageSize);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, pageSize, load]);

    const currency = summary?.currency || page?.items[0]?.currency || "INR";
    const totalPages = page ? Math.max(1, Math.ceil(page.total / pageSize)) : 1;
    const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        if (totalPages <= 5) return i + 1;
        const start = Math.max(1, Math.min(page ? page.page - 2 : 1, totalPages - 4));
        return start + i;
    });

    return (
        <main className="fig-dashboard invoices-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail />
            <div className="fig-dashboard-main">
                {/* Unified Dashboard Header with Search Bar */}
                <header className="fig-dashboard-header">
                    <h1>Invoices</h1>
                    <div className="fig-dashboard-header-actions">
                        <label className="fig-dashboard-search">
                            <img src="/assets/dashboard/dashboard-search.svg" alt="" />
                            <input
                                value={search}
                                placeholder="Search..."
                                aria-label="Search"
                                onChange={(event) => setSearch(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") void load(1, search, pageSize);
                                }}
                            />
                        </label>
                        <button
                            className="fig-dashboard-new"
                            type="button"
                            onClick={() => setShowCreate(true)}
                        >
                            <Plus size={20} />
                            <span>New</span>
                            <i />
                            <ChevronDown size={20} />
                        </button>
                        <button
                            className="fig-dashboard-bell"
                            type="button"
                            aria-label="Notifications"
                        >
                            <img src="/assets/dashboard/dashboard-notifications.svg" alt="" />
                        </button>
                        <div className="fig-dashboard-avatar">BO</div>
                    </div>
                </header>

                {showCreate ? (
                    <CreateInvoiceView
                        currency={currency}
                        orgName={orgName}
                        onClose={() => setShowCreate(false)}
                        onCreated={() => {
                            setShowCreate(false);
                            void load(1, search, pageSize);
                        }}
                    />
                ) : (
                    <section className="invoice-content">
                        {/* Dynamic Title Row */}
                        <div className="invoice-title-row">
                            <div>
                                <h2>Invoices</h2>
                                <p>
                                    {loading
                                        ? "Loading invoices..."
                                        : `${summary?.totalInvoices ?? page?.total ?? 0} Invoices | ${summary?.overdueCount ?? 0} overdue | ${formatCompact(summary?.outstanding ?? 0, currency)} outstanding`}
                                </p>
                            </div>
                            <div className="invoice-actions">
                                <button type="button" className="invoice-ghost">
                                    Import
                                </button>
                                <button
                                    type="button"
                                    className="invoice-primary"
                                    onClick={() => setShowCreate(true)}
                                >
                                    <Plus size={17} /> New Invoices
                                </button>
                            </div>
                        </div>

                        {error ? (
                            <div className="invoice-error" role="alert">
                                <strong>Couldn&apos;t load invoices</strong>
                                <span>{error}</span>
                                <button type="button" onClick={() => void load(1, search, pageSize)}>
                                    Try again
                                </button>
                            </div>
                        ) : loading && !page ? (
                            <div className="invoice-loading" />
                        ) : page && page.total === 0 && !search ? (
                            <InvoiceEmpty onCreate={() => setShowCreate(true)} />
                        ) : (
                            <>
                                {/* KPI Metrics Cards Matching Figma Design */}
                                <InvoiceSummary summary={summary} currency={currency} />

                                {/* Invoices Table */}
                                <div className="invoice-table-wrap">
                                    <table className="invoice-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>TYPE</th>
                                                <th>PROJECT</th>
                                                <th>CLIENT</th>
                                                <th>MILESTONE</th>
                                                <th>STATUS</th>
                                                <th>AMOUNT</th>
                                                <th>ISSUED</th>
                                                <th>DUE</th>
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {page?.items.map((invoice) => {
                                                const typeClass = invoice.type.toLowerCase().replace(/_/g, "-");
                                                const statusClass = invoice.status.toLowerCase();
                                                return (
                                                    <tr key={invoice.id} onClick={() => setSelected(invoice)}>
                                                        <td>{invoice.invoiceNumber}</td>
                                                        <td>
                                                            <span className={`invoice-type ${typeClass}`}>
                                                                {invoice.type.replace(/_/g, "-").toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="invoice-project">
                                                            {invoice.projectName || "-"}
                                                        </td>
                                                        <td>{invoice.clientName}</td>
                                                        <td>{invoice.milestone || "-"}</td>
                                                        <td>
                                                            <span className={`invoice-status ${statusClass}`}>
                                                                {invoice.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="invoice-amount">
                                                            {formatCompact(invoice.totalAmount, currency)}
                                                        </td>
                                                        <td>{formatDate(invoice.issueDate)}</td>
                                                        <td>{formatDate(invoice.dueDate)}</td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="invoice-more"
                                                                aria-label={`Open ${invoice.invoiceNumber}`}
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    setSelected(invoice);
                                                                }}
                                                            >
                                                                •••
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination and Show Per Page */}
                                <div className="invoice-pagination">
                                    <span>Total Invoices: {page?.total ?? 0}</span>
                                    <div>
                                        <button
                                            disabled={!page || page.page <= 1}
                                            onClick={() => void load((page?.page ?? 1) - 1, search, pageSize)}
                                            aria-label="Previous page"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        {pageNumbers.map((pNum) => (
                                            <strong
                                                key={pNum}
                                                style={{
                                                    cursor: "pointer",
                                                    background: pNum === page?.page ? "#2563eb" : "#fff",
                                                    color: pNum === page?.page ? "#fff" : "var(--fig-muted)",
                                                    borderColor: pNum === page?.page ? "#2563eb" : "#dbe3f0",
                                                }}
                                                onClick={() => void load(pNum, search, pageSize)}
                                            >
                                                {pNum}
                                            </strong>
                                        ))}
                                        <button
                                            disabled={!page || !page.hasMore}
                                            onClick={() => void load((page?.page ?? 1) + 1, search, pageSize)}
                                            aria-label="Next page"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                    <div className="invoice-per-page">
                                        <span>Show per Page:</span>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => {
                                                const s = Number(e.target.value);
                                                setPageSize(s);
                                                void load(1, search, s);
                                            }}
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                )}

                {/* Redesigned Invoice Preview Modal (Image 5) */}
                {selected && (
                    <InvoicePreview
                        invoice={selected}
                        currency={currency}
                        orgName={orgName}
                        onClose={() => setSelected(null)}
                        onUpdated={() => {
                            void load(page?.page ?? 1, search, pageSize);
                        }}
                    />
                )}
            </div>
        </main>
    );
}

function InvoiceSummary({
    summary,
    currency,
}: {
    summary: Summary | null;
    currency: string;
}) {
    if (!summary) return null;
    const collectedPercentage = summary.totalInvoiced
        ? Math.round((summary.collected / summary.totalInvoiced) * 100)
        : 0;

    return (
        <div className="invoice-summary">
            <div>
                <span>Total Invoiced</span>
                <strong>{formatCompact(summary.totalInvoiced, currency)}</strong>
                <small>This quarter</small>
            </div>
            <div>
                <span>Collected</span>
                <strong>{formatCompact(summary.collected, currency)}</strong>
                <small>{collectedPercentage}% collected</small>
            </div>
            <div>
                <span>Outstanding</span>
                <strong>{formatCompact(summary.outstanding, currency)}</strong>
                <small>{summary.totalInvoices} invoices</small>
            </div>
            <div>
                <span>Overdue</span>
                <strong className="overdue-value">{formatCompact(summary.overdue, currency)}</strong>
                <small>
                    {summary.overdueCount} invoice{summary.overdueCount === 1 ? "" : "s"}
                </small>
            </div>
        </div>
    );
}

function InvoiceEmpty({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="invoice-empty">
            <img src="/assets/invoice-empty-state.svg" alt="" />
            <h3>No invoices yet</h3>
            <p>
                Create your first invoice to start managing
                <br />
                your project quantities and estimates.
            </p>
            <button type="button" className="invoice-primary" onClick={onCreate}>
                <Plus size={17} /> New Invoice
            </button>
        </div>
    );
}

/* ──────────────── Complete Redesigned Preview Modal Matching Image 5 ──────────────── */
function InvoicePreview({
    invoice,
    currency,
    orgName,
    onClose,
    onUpdated,
}: {
    invoice: Invoice;
    currency: string;
    orgName: string;
    onClose: () => void;
    onUpdated: () => void;
}) {
    const [detail, setDetail] = useState<Invoice>(invoice);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showEdit, setShowEdit] = useState(false);
    const [showPayment, setShowPayment] = useState(false);

    const fetchDetail = useCallback(async () => {
        try {
            const res = await fetch(`/api/v1/invoices/${invoice.id}`, {
                credentials: "include",
                cache: "no-store",
            });
            const payload = await res.json();
            if (res.ok) {
                setDetail(parseApiResponse<Invoice>(payload));
            }
        } catch {
            // Fall back to prop
        }
    }, [invoice.id]);

    useEffect(() => {
        void fetchDetail();
    }, [fetchDetail]);

    // Download PDF Action
    async function handleDownload() {
        setPdfLoading(true);
        setToast(null);
        try {
            const response = await fetch(`/api/v1/invoices/${detail.id}/pdf`, {
                credentials: "include",
            });
            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(payload) || "Could not generate PDF.");
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${detail.invoiceNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setToast({ type: "success", text: "PDF downloaded successfully." });
        } catch (downloadError) {
            setToast({ type: "error", text: getApiErrorMessage(downloadError) });
        } finally {
            setPdfLoading(false);
        }
    }

    // Send to Client Action
    async function handleSendToClient() {
        setStatusLoading(true);
        setToast(null);
        try {
            const response = await fetch(`/api/v1/invoices/${detail.id}/status`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "sent" }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(getApiErrorMessage(payload));
            const updated = parseApiResponse<Invoice>(payload);
            setDetail((prev) => ({ ...prev, ...updated, status: "sent" }));
            setToast({ type: "success", text: `Invoice ${detail.invoiceNumber} marked as sent to client.` });
            onUpdated();
        } catch (sendError) {
            setToast({ type: "error", text: getApiErrorMessage(sendError) });
        } finally {
            setStatusLoading(false);
        }
    }

    // Calculations
    const items = detail.items && detail.items.length > 0
        ? detail.items
        : [{ description: "Services as agreed", quantity: 1, rate: detail.totalAmount, amount: detail.totalAmount }];

    const subtotal = detail.subtotal ?? items.reduce((acc, it) => acc + (it.amount ?? it.quantity * it.rate), 0);
    const taxRate = detail.taxRate ?? 18;
    const taxAmount = detail.taxAmount ?? Math.round((subtotal * taxRate) / 100);
    const totalDue = detail.totalAmount || (subtotal + taxAmount);

    return (
        <div className="invoice-modal-backdrop" onClick={onClose}>
            <section
                className="invoice-preview"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    className="invoice-close"
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                {/* Top Title Line */}
                <div className="preview-topline">
                    <span>{detail.invoiceNumber} — Invoice Preview</span>
                </div>

                {toast && (
                    <div className={`preview-toast ${toast.type}`}>
                        {toast.text}
                    </div>
                )}

                {/* White Paper Section */}
                <div className="preview-paper">
                    {/* Brand Header */}
                    <div className="preview-brand-header">
                        <div className="brand-info">
                            <h2>{orgName || "Arvin Interiors"}</h2>
                            <p>42 Design House, Khar West, Mumbai</p>
                            <p>GST: 27AABCA1234Z1Z9</p>
                        </div>
                        <div className="brand-doc-meta">
                            <span className="doc-type-label">
                                {detail.type.replace(/_/g, "-").toUpperCase()}
                            </span>
                            <div className="invoice-code">{detail.invoiceNumber}</div>
                            <span className={`status-badge ${detail.status.toLowerCase()}`}>
                                {detail.status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Meta Card: BILLED TO & Dates */}
                    <div className="preview-meta-card">
                        <div className="meta-billed-to">
                            <span className="meta-label">BILLED TO</span>
                            <strong className="client-name">{detail.clientName}</strong>
                            <span className="project-name">{detail.projectName || "General Fit-Out"}</span>
                        </div>
                        <div className="meta-dates-grid">
                            <span className="date-lbl">Issue Date:</span>
                            <span className="date-val">{formatDate(detail.issueDate)}</span>
                            <span className="date-lbl">Due Date:</span>
                            <span className="date-val">{formatDate(detail.dueDate)}</span>
                            <span className="date-lbl">Milestone:</span>
                            <span className="date-val">{detail.milestone || "-"}</span>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <table className="preview-items-table">
                        <thead>
                            <tr>
                                <th>DESCRIPTION</th>
                                <th className="col-qty">QTY</th>
                                <th className="col-rate">RATE</th>
                                <th className="col-amount">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => {
                                const rowAmount = item.amount ?? (item.quantity * item.rate);
                                return (
                                    <tr key={item.id || `${item.description}-${idx}`}>
                                        <td className="col-desc">{item.description}</td>
                                        <td className="col-qty">{item.quantity}</td>
                                        <td className="col-rate">
                                            {item.rate > 0 ? formatCompact(item.rate, currency) : "As agreed"}
                                        </td>
                                        <td className="col-amount">{formatCompact(rowAmount, currency)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Totals Breakdown */}
                    <div className="preview-totals">
                        <div className="total-row">
                            <span>Subtotal</span>
                            <strong>{formatCompact(subtotal, currency)}</strong>
                        </div>
                        <div className="total-row">
                            <span>GST ({taxRate}%)</span>
                            <strong>{formatCompact(taxAmount, currency)}</strong>
                        </div>
                        <div className="total-due-row">
                            <span>Total Due</span>
                            <strong>{formatCompact(totalDue, currency)}</strong>
                        </div>
                    </div>

                    {/* Bank Details & Payment Status Block */}
                    <div className="preview-bank-details">
                        <div className="bank-header">Payment status</div>
                        <div className="bank-grid">
                            <div className="bank-item">
                                <span className="b-lbl">Bank Name</span>
                                <strong className="b-val">{detail.bankDetails?.bankName || "HDFC Bank"}</strong>
                                <span className="b-lbl" style={{ marginTop: 8 }}>IFSC Code</span>
                                <strong className="b-val">{detail.bankDetails?.ifscCode || "HDFC0001234"}</strong>
                            </div>
                            <div className="bank-item">
                                <span className="b-lbl">Account Holder</span>
                                <strong className="b-val">
                                    {detail.bankDetails?.accountHolder || orgName || "Arvin Interiors LLP"}
                                </strong>
                                <span className="b-lbl" style={{ marginTop: 8 }}>Branch</span>
                                <strong className="b-val">{detail.bankDetails?.branch || "Branch Address"}</strong>
                            </div>
                            <div className="bank-item">
                                <span className="b-lbl">Account Number</span>
                                <strong className="b-val" style={{ fontSize: 13 }}>
                                    {detail.bankDetails?.accountNumber || "50100123456789"}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4 Action Buttons Footer */}
                <div className="preview-footer-actions">
                    <button
                        type="button"
                        className="btn-action-ghost"
                        onClick={() => setShowEdit(true)}
                        disabled={detail.status === "paid" || detail.status === "void"}
                    >
                        <Edit3 size={15} /> Edit
                    </button>
                    <button
                        type="button"
                        className="btn-action-ghost"
                        onClick={() => void handleDownload()}
                        disabled={pdfLoading}
                    >
                        <Download size={15} /> {pdfLoading ? "Preparing..." : "Download PDF"}
                    </button>
                    <button
                        type="button"
                        className="btn-action-ghost"
                        onClick={() => void handleSendToClient()}
                        disabled={statusLoading || detail.status === "sent" || detail.status === "paid" || detail.status === "void"}
                    >
                        <Send size={15} /> {detail.status === "sent" ? "Sent to Client" : statusLoading ? "Sending..." : "Send to Client"}
                    </button>
                    <button
                        type="button"
                        className="btn-action-primary"
                        onClick={() => setShowPayment(true)}
                        disabled={detail.status === "paid" || detail.status === "void" || (detail.outstanding <= 0 && (detail.totalPaid ?? 0) >= detail.totalAmount)}
                    >
                        <Check size={15} /> {detail.status === "paid" ? "Paid in Full" : "Record Payment"}
                    </button>
                </div>

                {/* Submodal 1: Record Payment Modal */}
                {showPayment && (
                    <RecordPaymentModal
                        invoice={detail}
                        currency={currency}
                        onClose={() => setShowPayment(false)}
                        onSuccess={() => {
                            setShowPayment(false);
                            setToast({ type: "success", text: "Payment successfully recorded!" });
                            void fetchDetail();
                            onUpdated();
                        }}
                    />
                )}

                {/* Submodal 2: Edit Invoice Modal */}
                {showEdit && (
                    <EditInvoiceModal
                        invoice={detail}
                        onClose={() => setShowEdit(false)}
                        onSuccess={() => {
                            setShowEdit(false);
                            setToast({ type: "success", text: "Invoice updated successfully!" });
                            void fetchDetail();
                            onUpdated();
                        }}
                    />
                )}
            </section>
        </div>
    );
}

/* ──────────────── Record Payment Modal ──────────────── */
function RecordPaymentModal({
    invoice,
    currency,
    onClose,
    onSuccess,
}: {
    invoice: Invoice;
    currency: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const outstanding = invoice.outstanding ?? Math.max(0, invoice.totalAmount - (invoice.totalPaid ?? 0));
    const [amount, setAmount] = useState<string>(String(outstanding));
    const [paidAt, setPaidAt] = useState<string>(new Date().toISOString().slice(0, 10));
    const [method, setMethod] = useState<string>("bank_transfer");
    const [reference, setReference] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const numAmount = Number(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                throw new Error("Please enter a valid positive payment amount.");
            }
            if (numAmount > outstanding) {
                throw new Error(`Amount exceeds outstanding balance (${formatCompact(outstanding, currency)}).`);
            }

            const res = await fetch(`/api/v1/invoices/${invoice.id}/payments`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: numAmount,
                    paidAt: new Date(paidAt).toISOString(),
                    method,
                    reference: reference.trim() || undefined,
                    notes: notes.trim() || undefined,
                }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(getApiErrorMessage(payload));
            onSuccess();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="submodal-backdrop" onClick={onClose}>
            <div className="submodal-card" onClick={(e) => e.stopPropagation()}>
                <div className="submodal-header">
                    <h3>Record Payment</h3>
                    <button type="button" className="invoice-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "#f1f5f9", borderRadius: 8, fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Invoice: </span>
                    <strong>{invoice.invoiceNumber}</strong>
                    <span style={{ marginLeft: 16, color: "#64748b" }}>Outstanding: </span>
                    <strong style={{ color: "#2563eb" }}>{formatCompact(outstanding, currency)}</strong>
                </div>

                {error && <div className="preview-toast error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="submodal-form-group">
                        <label>Payment Amount ({currency}) *</label>
                        <input
                            required
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={outstanding}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="submodal-row">
                        <div className="submodal-form-group">
                            <label>Payment Date *</label>
                            <input
                                required
                                type="date"
                                value={paidAt}
                                onChange={(e) => setPaidAt(e.target.value)}
                            />
                        </div>
                        <div className="submodal-form-group">
                            <label>Payment Method *</label>
                            <select value={method} onChange={(e) => setMethod(e.target.value)}>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="upi">UPI</option>
                                <option value="card">Card</option>
                                <option value="cash">Cash</option>
                                <option value="cheque">Cheque</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="submodal-form-group">
                        <label>Reference Number (UTR / Cheque No / Txn ID)</label>
                        <input
                            type="text"
                            placeholder="e.g. UTR12345678"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                        />
                    </div>

                    <div className="submodal-form-group">
                        <label>Notes (Optional)</label>
                        <textarea
                            rows={2}
                            placeholder="Payment receipt note..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="submodal-footer">
                        <button type="button" className="btn-action-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-action-primary" disabled={saving}>
                            {saving ? "Recording..." : "Record Payment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ──────────────── Edit Invoice Modal ──────────────── */
function EditInvoiceModal({
    invoice,
    onClose,
    onSuccess,
}: {
    invoice: Invoice;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const initialItems = invoice.items && invoice.items.length > 0
        ? invoice.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            rate: it.rate,
        }))
        : [{ description: "Design Services", quantity: 1, rate: invoice.totalAmount }];

    const [clientName, setClientName] = useState(invoice.clientName || "");
    const [projectName, setProjectName] = useState(invoice.projectName || "");
    const [issueDate, setIssueDate] = useState(invoice.issueDate ? invoice.issueDate.slice(0, 10) : "");
    const [dueDate, setDueDate] = useState(invoice.dueDate ? invoice.dueDate.slice(0, 10) : "");
    const [milestone, setMilestone] = useState(invoice.milestone || "");
    const [taxRate, setTaxRate] = useState<number>(invoice.taxRate ?? 18);
    const [items, setItems] = useState<Array<{ description: string; quantity: number; rate: number }>>(initialItems);
    const [bankName, setBankName] = useState(invoice.bankDetails?.bankName || "HDFC Bank");
    const [accountHolder, setAccountHolder] = useState(invoice.bankDetails?.accountHolder || "Arvin Interiors LLP");
    const [accountNumber, setAccountNumber] = useState(invoice.bankDetails?.accountNumber || "50100123456789");
    const [ifscCode, setIfscCode] = useState(invoice.bankDetails?.ifscCode || "HDFC0001234");
    const [branch, setBranch] = useState(invoice.bankDetails?.branch || "Branch Address");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    function addItem() {
        setItems((prev) => [...prev, { description: "", quantity: 1, rate: 0 }]);
    }

    function removeItem(index: number) {
        if (items.length <= 1) return;
        setItems((prev) => prev.filter((_, idx) => idx !== index));
    }

    function updateItem(index: number, field: "description" | "quantity" | "rate", value: string | number) {
        setItems((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            if (dueDate < issueDate) {
                throw new Error("Due date cannot be before issue date.");
            }
            if (items.some((it) => !it.description.trim() || Number(it.rate) < 0 || Number(it.quantity) <= 0)) {
                throw new Error("Please ensure all line items have valid descriptions, positive quantities, and rates.");
            }

            const res = await fetch(`/api/v1/invoices/${invoice.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientName,
                    projectName,
                    issueDate,
                    dueDate,
                    milestone,
                    taxRate: Number(taxRate),
                    items: items.map((it) => ({
                        description: it.description.trim(),
                        quantity: Number(it.quantity),
                        rate: Number(it.rate),
                    })),
                    bankDetails: {
                        bankName,
                        accountHolder,
                        accountNumber,
                        ifscCode,
                        branch,
                    },
                }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(getApiErrorMessage(payload));
            onSuccess();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="submodal-backdrop" onClick={onClose}>
            <div className="submodal-edit-card" onClick={(e) => e.stopPropagation()}>
                <div className="submodal-header">
                    <h3>Edit Invoice {invoice.invoiceNumber}</h3>
                    <button type="button" className="invoice-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {error && <div className="preview-toast error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="submodal-row">
                        <div className="submodal-form-group">
                            <label>Client Name *</label>
                            <input
                                required
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                            />
                        </div>
                        <div className="submodal-form-group">
                            <label>Project Name *</label>
                            <input
                                required
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="submodal-row">
                        <div className="submodal-form-group">
                            <label>Issue Date *</label>
                            <input
                                required
                                type="date"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                            />
                        </div>
                        <div className="submodal-form-group">
                            <label>Due Date *</label>
                            <input
                                required
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="submodal-row">
                        <div className="submodal-form-group">
                            <label>Milestone *</label>
                            <input
                                required
                                value={milestone}
                                onChange={(e) => setMilestone(e.target.value)}
                            />
                        </div>
                        <div className="submodal-form-group">
                            <label>Tax Rate (%) *</label>
                            <input
                                required
                                type="number"
                                min={0}
                                max={100}
                                value={taxRate}
                                onChange={(e) => setTaxRate(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Line Items</label>
                        <table className="edit-items-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th style={{ width: 80 }}>Qty</th>
                                    <th style={{ width: 120 }}>Rate</th>
                                    <th style={{ width: 40 }} />
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <input
                                                required
                                                placeholder="Item description"
                                                value={it.description}
                                                onChange={(e) => updateItem(idx, "description", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                required
                                                type="number"
                                                min={1}
                                                value={it.quantity}
                                                onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                required
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={it.rate}
                                                onChange={(e) => updateItem(idx, "rate", Number(e.target.value))}
                                            />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn-remove-row"
                                                disabled={items.length <= 1}
                                                onClick={() => removeItem(idx)}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" className="btn-add-item" onClick={addItem}>
                            <Plus size={14} /> Add Line Item
                        </button>
                    </div>

                    <div style={{ marginTop: 18, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Bank Details</label>
                        <div className="submodal-row" style={{ marginTop: 8 }}>
                            <div className="submodal-form-group">
                                <label>Bank Name</label>
                                <input value={bankName} onChange={(e) => setBankName(e.target.value)} />
                            </div>
                            <div className="submodal-form-group">
                                <label>Account Holder</label>
                                <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
                            </div>
                        </div>
                        <div className="submodal-row">
                            <div className="submodal-form-group">
                                <label>Account Number</label>
                                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                            </div>
                            <div className="submodal-form-group">
                                <label>IFSC Code</label>
                                <input value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} />
                            </div>
                        </div>
                        <div className="submodal-form-group">
                            <label>Branch</label>
                            <input value={branch} onChange={(e) => setBranch(e.target.value)} />
                        </div>
                    </div>

                    <div className="submodal-footer">
                        <button type="button" className="btn-action-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-action-primary" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
type BoqOption = {
    id: string;
    boqNumber: string;
    projectId: string | null;
    projectName: string | null;
    grandTotal: number;
    subtotal: number;
    status: string;
};

function CreateInvoiceView({
    currency,
    orgName,
    onClose,
    onCreated,
}: {
    currency: string;
    orgName: string;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [boqs, setBoqs] = useState<BoqOption[]>([]);
    const [projectsMap, setProjectsMap] = useState<Map<string, string>>(new Map());
    const [selectedBoq, setSelectedBoq] = useState<BoqOption | null>(null);
    const [boqLoading, setBoqLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [boqSearch, setBoqSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Form states
    const todayIso = new Date().toISOString().slice(0, 10);
    const defaultDueIso = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

    const [clientName, setClientName] = useState("");
    const [projectName, setProjectName] = useState("");
    const [issueDate, setIssueDate] = useState(todayIso);
    const [dueDate, setDueDate] = useState(defaultDueIso);
    const [milestone, setMilestone] = useState("Execution Milestone");
    const [items, setItems] = useState<Array<{ description: string; quantity: number; rate: number }>>([
        { description: "", quantity: 1, rate: 0 },
    ]);
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [template, setTemplate] = useState<"modern" | "minimal" | "classic">("modern");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Load available BOQs & projects on mount
    useEffect(() => {
        let active = true;
        async function loadBoqs() {
            setBoqLoading(true);
            try {
                const [boqRes, projRes] = await Promise.all([
                    fetch("/api/v1/boqs?pageSize=100", { credentials: "include" }),
                    fetch("/api/v1/projects?pageSize=100", { credentials: "include" }),
                ]);

                if (!active) return;

                const pMap = new Map<string, string>();
                if (projRes.ok) {
                    const projPayload = await projRes.json();
                    const projData = parseApiResponse<{ items?: Array<{ id: string; name?: string; clientName?: string }> }>(projPayload);
                    projData?.items?.forEach((p) => {
                        if (p.id && p.clientName) pMap.set(p.id, p.clientName);
                    });
                    setProjectsMap(pMap);
                }

                if (boqRes.ok) {
                    const boqPayload = await boqRes.json();
                    const boqData = parseApiResponse<{ items?: BoqOption[] }>(boqPayload);
                    if (boqData?.items && boqData.items.length > 0) {
                        setBoqs(boqData.items);
                    }
                }
            } catch {
                // Silent catch
            } finally {
                if (active) setBoqLoading(false);
            }
        }
        void loadBoqs();
        return () => {
            active = false;
        };
    }, []);

    // Handler when selecting a BOQ
    async function handleSelectBoq(boq: BoqOption | null) {
        setSelectedBoq(boq);
        setDropdownOpen(false);

        if (!boq) {
            // Custom without BOQ
            setClientName("Client Name");
            setProjectName("Interior Fit-Out");
            setMilestone("Initial Milestone");
            setItems([{ description: "", quantity: 1, rate: 0 }]);
            return;
        }

        const resolvedClient = (boq.projectId && projectsMap.get(boq.projectId)) || `${boq.projectName || "Client"}`;
        const resolvedProject = boq.projectName || `BOQ Project ${boq.boqNumber}`;
        setClientName(resolvedClient);
        setProjectName(resolvedProject);
        setMilestone(`BOQ #${boq.boqNumber} Execution`);

        // Fetch BOQ line items
        try {
            const detailRes = await fetch(`/api/v1/boqs/${boq.id}`, { credentials: "include" });
            if (detailRes.ok) {
                const detailPayload = await detailRes.json();
                const detail = parseApiResponse<{
                    rooms?: Array<{
                        name?: string;
                        categories?: Array<{
                            items?: Array<{
                                name?: string;
                                description?: string;
                                quantity?: number;
                                rate?: number;
                            }>;
                        }>;
                    }>;
                }>(detailPayload);

                const extracted: Array<{ description: string; quantity: number; rate: number }> = [];
                detail?.rooms?.forEach((r) => {
                    r.categories?.forEach((c) => {
                        c.items?.forEach((it) => {
                            extracted.push({
                                description: `${r.name ? `${r.name} - ` : ""}${it.name || it.description || "Work Item"}`,
                                quantity: Number(it.quantity) > 0 ? Number(it.quantity) : 1,
                                rate: Number(it.rate) >= 0 ? Number(it.rate) : 0,
                            });
                        });
                    });
                });

                if (extracted.length > 0) {
                    setItems(extracted);
                    return;
                }
            }
        } catch {
            // Fall through to default item
        }

        // Fallback item with grandTotal
        setItems([
            {
                description: `${resolvedProject} - As per BOQ #${boq.boqNumber}`,
                quantity: 1,
                rate: boq.grandTotal || boq.subtotal || 0,
            },
        ]);
    }

    // Row handlers
    function updateItem(index: number, field: "description" | "quantity" | "rate", value: string | number) {
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;
                return { ...item, [field]: value };
            })
        );
    }

    function removeItem(index: number) {
        if (items.length <= 1) return;
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    function addItem() {
        setItems((prev) => [...prev, { description: "", quantity: 1, rate: 0 }]);
    }

    // Save action
    async function handleSave(status: "draft" | "pending") {
        setSaving(true);
        setError("");
        try {
            const finalClient = clientName.trim() || (selectedBoq?.projectName ? `${selectedBoq.projectName} Client` : "Client Name");
            const finalProject = projectName.trim() || (selectedBoq?.projectName || "Interior Execution");
            const finalMilestone = milestone.trim() || "Execution Milestone";
            const finalIssue = issueDate || todayIso;
            let finalDue = dueDate || finalIssue;
            if (finalDue < finalIssue) {
                finalDue = finalIssue;
            }

            const cleanItems = items
                .map((it, idx) => ({
                    description: it.description.trim() || `Execution Item ${idx + 1}`,
                    quantity: Math.max(1, Number(it.quantity) || 1),
                    rate: Math.max(0, Number(it.rate) || 0),
                }))
                .filter((it) => it.description.length > 0);

            if (cleanItems.length === 0) {
                cleanItems.push({
                    description: "Execution as agreed",
                    quantity: 1,
                    rate: 0,
                });
            }

            const response = await fetch("/api/v1/invoices", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "invoice",
                    clientName: finalClient,
                    projectName: finalProject,
                    projectId: selectedBoq?.projectId || undefined,
                    billingAddress: {
                        line1: "42 Client Address",
                        city: "Mumbai",
                        state: "Maharashtra",
                        pincode: "400052",
                    },
                    issueDate: finalIssue,
                    dueDate: finalDue,
                    milestone: finalMilestone,
                    taxRate: 18,
                    additionalNotes: additionalNotes.trim() || undefined,
                    items: cleanItems,
                    status,
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(getApiErrorMessage(payload) || "Invoice creation failed.");
            }

            onCreated();
        } catch (submitErr) {
            setError(getApiErrorMessage(submitErr));
        } finally {
            setSaving(false);
        }
    }

    // Calculations
    const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);
    const taxRate = 18;
    const taxAmount = Math.round((subtotal * taxRate) / 100);
    const totalDue = subtotal + taxAmount;

    // Filtered BOQs for dropdown search
    const filteredBoqs = boqs.filter((b) => {
        if (!boqSearch.trim()) return true;
        const q = boqSearch.toLowerCase();
        return (
            b.boqNumber?.toLowerCase().includes(q) ||
            b.projectName?.toLowerCase().includes(q)
        );
    });

    const displayBoqTitle = selectedBoq
        ? `BOQ #${selectedBoq.boqNumber} — ${selectedBoq.projectName || "Project"}`
        : "";

    function cycleTemplate() {
        setTemplate((prev) => (prev === "modern" ? "minimal" : prev === "minimal" ? "classic" : "modern"));
    }

    return (
        <div className="create-invoice-wrapper">
            {/* Sub-header Bar with Back arrow & Action Buttons */}
            <div className="create-invoice-subbar">
                <button
                    type="button"
                    className="create-back-btn"
                    onClick={onClose}
                    aria-label="Back to Invoices"
                >
                    <ArrowLeft size={20} />
                    <span>Create New Invoice</span>
                </button>
                <div className="create-subbar-actions">
                    <button
                        type="button"
                        className="btn-create-cancel"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-create-draft"
                        onClick={() => void handleSave("draft")}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save as Draft"}
                    </button>
                    <button
                        type="button"
                        className="btn-create-submit"
                        onClick={() => void handleSave("pending")}
                        disabled={saving}
                    >
                        {saving ? "Creating..." : "Create Invoice"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="create-form-error-banner" role="alert">
                    {error}
                </div>
            )}

            {/* Two-Column Grid */}
            <div className="create-invoice-grid">
                {/* Left Column */}
                <div className="create-col-left">
                    {/* Card 1: INVOICE DETAILS */}
                    <div className="create-card">
                        <h4 className="create-card-title">INVOICE DETAILS</h4>

                        <label className="create-field-label">
                            Select BOQ <span className="req-star">*</span>
                        </label>

                        {/* Searchable Dropdown */}
                        <div className="boq-dropdown-container" ref={dropdownRef}>
                            <button
                                type="button"
                                className={`boq-dropdown-trigger ${dropdownOpen ? "open" : ""}`}
                                onClick={() => setDropdownOpen((prev) => !prev)}
                            >
                                <div className="boq-dropdown-left">
                                    <Search size={16} color="#94a3b8" />
                                    {displayBoqTitle ? (
                                        <span>{displayBoqTitle}</span>
                                    ) : (
                                        <span className="placeholder">Select BOQ</span>
                                    )}
                                </div>
                                <ChevronDown size={18} color="#64748b" />
                            </button>

                            {dropdownOpen && (
                                <div className="boq-dropdown-menu">
                                    <div className="boq-dropdown-search-box">
                                        <Search size={14} color="#94a3b8" />
                                        <input
                                            autoFocus
                                            placeholder="Search BOQ or project..."
                                            value={boqSearch}
                                            onChange={(e) => setBoqSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>

                                    <div
                                        className={`boq-dropdown-item ${!selectedBoq ? "active" : ""}`}
                                        onClick={() => void handleSelectBoq(null)}
                                    >
                                        <strong>Custom Invoice (No BOQ linked)</strong>
                                        <span className="item-sub">Create direct manual invoice lines</span>
                                    </div>

                                    {boqLoading && (
                                        <div style={{ padding: 10, fontSize: 13, color: "#64748b", textAlign: "center" }}>
                                            Loading BOQs...
                                        </div>
                                    )}

                                    {!boqLoading && filteredBoqs.length === 0 && (
                                        <div style={{ padding: 10, fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
                                            No BOQs found
                                        </div>
                                    )}

                                    {filteredBoqs.map((b) => (
                                        <div
                                            key={b.id}
                                            className={`boq-dropdown-item ${selectedBoq?.id === b.id ? "active" : ""}`}
                                            onClick={() => void handleSelectBoq(b)}
                                        >
                                            <strong>BOQ #{b.boqNumber} — {b.projectName || "Project"}</strong>
                                            <span className="item-sub">
                                                Amount: ₹{formatNumber(b.grandTotal || b.subtotal || 0)} • Status: {b.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Dates Row */}
                        <div className="create-dates-row">
                            <div>
                                <label className="create-field-label">
                                    Issue Date <span className="req-star">*</span>
                                </label>
                                <div className="create-date-wrap">
                                    <input
                                        type="date"
                                        className="create-date-input"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                    />
                                    <Calendar size={16} className="create-date-icon" />
                                </div>
                            </div>
                            <div>
                                <label className="create-field-label">
                                    Due Date <span className="req-star">*</span>
                                </label>
                                <div className="create-date-wrap">
                                    <input
                                        type="date"
                                        className="create-date-input"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                    <Calendar size={16} className="create-date-icon" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: ITEMS */}
                    <div className="create-card">
                        <h4 className="create-card-title">ITEMS</h4>

                        <div className="create-items-table">
                            <div className="create-items-head">
                                <div className="item-col-desc">DESCRIPTION</div>
                                <div className="item-col-qty">QTY</div>
                                <div className="item-col-rate">RATE</div>
                                <div className="item-col-amount">AMOUNT</div>
                                <div className="item-col-action" />
                            </div>

                            {items.map((it, idx) => {
                                const rowAmount = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
                                return (
                                    <div className="create-items-row" key={idx}>
                                        <div className="item-col-desc">
                                            <input
                                                placeholder="Enter Description"
                                                value={it.description}
                                                onChange={(e) => updateItem(idx, "description", e.target.value)}
                                            />
                                        </div>
                                        <div className="item-col-qty">
                                            <input
                                                type="number"
                                                min={1}
                                                placeholder="0"
                                                value={it.quantity === 0 ? "" : it.quantity}
                                                onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="item-col-rate">
                                            <input
                                                type="number"
                                                min={0}
                                                step="any"
                                                placeholder="0"
                                                value={it.rate === 0 ? "" : it.rate}
                                                onChange={(e) => updateItem(idx, "rate", Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="item-col-amount">
                                            {formatNumber(rowAmount)}
                                        </div>
                                        <div className="item-col-action">
                                            <button
                                                type="button"
                                                className="btn-item-delete"
                                                disabled={items.length <= 1}
                                                onClick={() => removeItem(idx)}
                                                aria-label="Remove item"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            <button
                                type="button"
                                className="btn-add-item-full"
                                onClick={addItem}
                            >
                                Add Item
                            </button>
                        </div>
                    </div>

                    {/* Card 3: Additional Notes */}
                    <div className="create-card">
                        <label className="create-field-label">Additional Notes</label>
                        <textarea
                            className="create-notes-textarea"
                            placeholder="Add any additional notes or payment instructions..."
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Right Column: Dynamic Preview */}
                <div className="create-col-right">
                    <div className="create-preview-topbar">
                        <h4>INVOICE PREVIEW</h4>
                        <button
                            type="button"
                            className="btn-change-template"
                            onClick={cycleTemplate}
                            title="Click to switch template style"
                        >
                            Change Template ({template.charAt(0).toUpperCase() + template.slice(1)})
                        </button>
                    </div>

                    <div className={`create-preview-card preview-template-${template}`}>
                        {/* Brand Header */}
                        <div className="preview-brand-header">
                            <div className="brand-info">
                                <h2>{orgName || "Arvin Interiors"}</h2>
                                <p>42 Design House, Khar West, Mumbai</p>
                                <p>GST: 27AABCA1234Z1Z9</p>
                            </div>
                            <div className="brand-doc-meta">
                                <span className="doc-type-label">INVOICE</span>
                                <div className="invoice-code">INV-DRAFT</div>
                                <span className="status-badge draft">DRAFT</span>
                            </div>
                        </div>

                        {/* Meta Card: BILLED TO & Dates */}
                        <div className="preview-meta-card">
                            <div className="meta-billed-to">
                                <span className="meta-label">BILLED TO</span>
                                <strong className="client-name">{clientName || "Client Name"}</strong>
                                <span className="project-name">{projectName || "Interior Execution Project"}</span>
                            </div>
                            <div className="meta-dates-grid">
                                <span className="date-lbl">Issue Date:</span>
                                <span className="date-val">{formatDate(issueDate)}</span>
                                <span className="date-lbl">Due Date:</span>
                                <span className="date-val">{formatDate(dueDate)}</span>
                                <span className="date-lbl">Milestone:</span>
                                <span className="date-val">{milestone || "Execution Milestone"}</span>
                            </div>
                        </div>

                        {/* Line Items Table */}
                        <table className="preview-items-table" style={{ marginTop: 22 }}>
                            <thead>
                                <tr>
                                    <th>DESCRIPTION</th>
                                    <th className="col-qty">QTY</th>
                                    <th className="col-rate">RATE</th>
                                    <th className="col-amount">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it, idx) => {
                                    const rowAmt = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
                                    return (
                                        <tr key={idx}>
                                            <td className="col-desc">
                                                {it.description.trim() || `(Item ${idx + 1})`}
                                            </td>
                                            <td className="col-qty">{it.quantity || 1}</td>
                                            <td className="col-rate">
                                                {it.rate > 0 ? formatCompact(it.rate, currency) : "₹0"}
                                            </td>
                                            <td className="col-amount">{formatCompact(rowAmt, currency)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Totals Breakdown */}
                        <div className="preview-totals">
                            <div className="total-row">
                                <span>Subtotal</span>
                                <strong>{formatCompact(subtotal, currency)}</strong>
                            </div>
                            <div className="total-row">
                                <span>GST ({taxRate}%)</span>
                                <strong>{formatCompact(taxAmount, currency)}</strong>
                            </div>
                            <div className="total-due-row">
                                <span>Total Due</span>
                                <strong>{formatCompact(totalDue, currency)}</strong>
                            </div>
                        </div>

                        {/* Additional Notes Block if entered */}
                        {additionalNotes.trim() && (
                            <div style={{ marginTop: 18, padding: 14, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>
                                    Notes & Instructions
                                </span>
                                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#334155", whiteSpace: "pre-wrap" }}>
                                    {additionalNotes}
                                </p>
                            </div>
                        )}

                        {/* Bank Details & Payment Status Block */}
                        <div className="preview-bank-details" style={{ marginTop: 20 }}>
                            <div className="bank-header">Payment details</div>
                            <div className="bank-grid">
                                <div className="bank-item">
                                    <span className="b-lbl">Bank Name</span>
                                    <strong className="b-val">HDFC Bank</strong>
                                    <span className="b-lbl" style={{ marginTop: 8 }}>IFSC Code</span>
                                    <strong className="b-val">HDFC0001234</strong>
                                </div>
                                <div className="bank-item">
                                    <span className="b-lbl">Account Holder</span>
                                    <strong className="b-val">
                                        {orgName || "Arvin Interiors LLP"}
                                    </strong>
                                    <span className="b-lbl" style={{ marginTop: 8 }}>Branch</span>
                                    <strong className="b-val">Khar West, Mumbai</strong>
                                </div>
                                <div className="bank-item">
                                    <span className="b-lbl">Account Number</span>
                                    <strong className="b-val" style={{ fontSize: 13 }}>
                                        50100123456789
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
