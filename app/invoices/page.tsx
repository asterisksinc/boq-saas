"use client";

import {
    ArrowLeft,
    Calendar,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Download,
    Edit3,
    Eye,
    FileText,
    Loader2,
    MoreHorizontal,
    Plus,
    Search,
    Send,
    Trash2,
    X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import InvoiceExcelImportModal from "@/components/invoices/InvoiceExcelImportModal";
import { getApiErrorMessage, getDashboardOverview, parseApiResponse } from "@/lib/api/auth";
import { archiveInvoice, changeInvoiceStatus, getInvoicePdf } from "@/lib/api/invoices";
import "./invoices-redesign.css";

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
        const formatted = cr % 1 === 0 ? cr.toString() : cr.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
        return `${sign}${symbol}${formatted}Cr`;
    }
    if (abs >= 100000) {
        const l = abs / 100000;
        const formatted = l % 1 === 0 ? l.toString() : l.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
        return `${sign}${symbol}${formatted}L`;
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
    const [showImportModal, setShowImportModal] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
    const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [orgName, setOrgName] = useState<string>("");

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Close action dropdown menu on outside click
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest(".cell-inv-actions-wrapper")) {
                setOpenMenuId(null);
            }
        };
        window.addEventListener("mousedown", handleOutsideClick);
        return () => window.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const sp = new URLSearchParams(window.location.search);
            if (sp.get("create") === "true" || sp.get("new") === "true") {
                setShowCreate(true);
            }
        }
    }, []);

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

    // Row action handlers
    async function handleDownloadPdf(inv: Invoice) {
        try {
            showToast(`Generating PDF for ${inv.invoiceNumber}...`);
            const blob = await getInvoicePdf(inv.id);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${inv.invoiceNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast(`PDF for ${inv.invoiceNumber} downloaded.`);
        } catch (err) {
            showToast(getApiErrorMessage(err));
        }
    }

    async function handleSendInvoice(inv: Invoice) {
        try {
            await changeInvoiceStatus(inv.id, "sent");
            showToast(`Invoice ${inv.invoiceNumber} marked as sent.`);
            void load(page?.page ?? 1, search, pageSize);
        } catch (err) {
            showToast(getApiErrorMessage(err));
        }
    }

    async function handleArchive(inv: Invoice) {
        if (!window.confirm(`Are you sure you want to archive invoice ${inv.invoiceNumber}?`)) {
            return;
        }
        try {
            await archiveInvoice(inv.id);
            showToast(`Invoice ${inv.invoiceNumber} archived successfully.`);
            void load(page?.page ?? 1, search, pageSize);
        } catch (err) {
            showToast(getApiErrorMessage(err));
        }
    }

    return (
        <main className="fig-dashboard invoices-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/invoices" />
            <div className="fig-dashboard-main">
                <DashboardHeader
                    title="Invoices"
                    onNew={() => setShowCreate(true)}
                    onSearch={(value) => {
                        setSearch(value);
                        void load(1, value, pageSize);
                    }}
                />

                {showCreate ? (
                    <div className="fig-dashboard-container invoices-main-container">
                        {toastMessage && (
                            <div className="invoices-toast" role="status">
                                <span>{toastMessage}</span>
                            </div>
                        )}
                        <CreateInvoiceView
                            currency={currency}
                            orgName={orgName}
                            onClose={() => setShowCreate(false)}
                            onCreated={() => {
                                setShowCreate(false);
                                showToast("Invoice created successfully.");
                                void load(1, search, pageSize);
                            }}
                        />
                    </div>
                ) : (
                    <div className="fig-dashboard-container invoices-main-container">
                        {toastMessage && (
                            <div className="invoices-toast" role="status">
                                <span>{toastMessage}</span>
                            </div>
                        )}

                        {error && (
                            <div className="invoices-error-banner" role="alert">
                                <span>{error}</span>
                                <button type="button" onClick={() => void load(page?.page ?? 1, search, pageSize)}>
                                    Try again
                                </button>
                            </div>
                        )}

                        {/* Invoices Sub-Header (Frame 2147225066) */}
                        <div className="invoices-sub-header">
                            <div className="invoices-title-group">
                                <h2>Invoices</h2>
                                <p>
                                    {loading && !page
                                        ? "Loading invoices..."
                                        : `${summary?.totalInvoices ?? page?.total ?? 0} Invoices | ${summary?.overdueCount ?? 0} overdue | ${formatCompact(summary?.outstanding ?? 0, currency)} outstanding`}
                                </p>
                            </div>
                            <div className="invoices-header-buttons">
                                <button
                                    type="button"
                                    className="btn-invoices-import"
                                    onClick={() => setShowImportModal(true)}
                                >
                                    Import
                                </button>
                                <button
                                    type="button"
                                    className="btn-invoices-new"
                                    onClick={() => setShowCreate(true)}
                                >
                                    <Plus size={20} color="#FFFFFF" />
                                    <span>New Invoices</span>
                                </button>
                            </div>
                        </div>

                        {/* KPI Summary Cards (Frame 2147225138) */}
                        <InvoiceSummary summary={summary} currency={currency} loading={loading} />

                        {/* Invoices Table Card (Frame 2147225067) */}
                        <div className="invoices-table-card">
                            {loading && !page ? (
                                <div className="invoices-loading-container">
                                    <Loader2 size={24} className="animate-spin" />
                                    <span>Loading invoices...</span>
                                </div>
                            ) : page && page.total === 0 && !search ? (
                                <InvoiceEmpty
                                    onCreate={() => setShowCreate(true)}
                                    onImport={() => setShowImportModal(true)}
                                />
                            ) : page && page.total === 0 && search ? (
                                <div className="invoices-empty-container">
                                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Search size={22} color="#2563EB" />
                                    </div>
                                    <h3>No invoices match &ldquo;{search}&rdquo;</h3>
                                    <p>Try searching by invoice number, project name, or client name.</p>
                                    <button
                                        type="button"
                                        className="btn-invoices-import"
                                        onClick={() => {
                                            setSearch("");
                                            void load(1, "", pageSize);
                                        }}
                                    >
                                        Clear Search
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="invoices-table-wrapper">
                                        <table className="invoices-table">
                                            <thead>
                                                <tr>
                                                    <th className="col-inv-id">ID</th>
                                                    <th className="col-inv-type">TYPE</th>
                                                    <th className="col-inv-project">PROJECT</th>
                                                    <th className="col-inv-client">CLIENT</th>
                                                    <th className="col-inv-milestone">MILESTONE</th>
                                                    <th className="col-inv-status">STATUS</th>
                                                    <th className="col-inv-amount">AMOUNT</th>
                                                    <th className="col-inv-issued">ISSUED</th>
                                                    <th className="col-inv-due">DUE</th>
                                                    <th className="col-inv-actions" aria-label="Actions" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {page?.items.map((invoice) => {
                                                    const typeClass = (invoice.type || "invoice").toLowerCase().replace(/_/g, "-");
                                                    const statusClass = (invoice.status || "draft").toLowerCase();
                                                    return (
                                                        <tr
                                                            key={invoice.id}
                                                            onClick={(e) => {
                                                                const target = e.target as HTMLElement;
                                                                if (target.closest(".cell-inv-actions-wrapper")) return;
                                                                setSelected(invoice);
                                                            }}
                                                        >
                                                            <td className="cell-inv-id">{invoice.invoiceNumber}</td>
                                                            <td>
                                                                <span className={`badge-pill-base badge-type-${typeClass}`}>
                                                                    {(invoice.type || "invoice").replace(/_/g, "-").toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="cell-inv-project" title={invoice.projectName || ""}>
                                                                    {invoice.projectName || "-"}
                                                                </span>
                                                            </td>
                                                            <td className="cell-inv-client">{invoice.clientName}</td>
                                                            <td className="cell-inv-milestone">{invoice.milestone || "-"}</td>
                                                            <td>
                                                                <span className={`badge-pill-base badge-status-${statusClass}`}>
                                                                    {(invoice.status || "draft").toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td className="cell-inv-amount">
                                                                {formatCompact(invoice.totalAmount, currency)}
                                                            </td>
                                                            <td className="cell-inv-date">{formatDate(invoice.issueDate)}</td>
                                                            <td className="cell-inv-date">{formatDate(invoice.dueDate)}</td>
                                                            <td>
                                                                <div className="cell-inv-actions-wrapper">
                                                                    <button
                                                                        type="button"
                                                                        className="btn-inv-row-more"
                                                                        aria-label={`Open menu for ${invoice.invoiceNumber}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenMenuId(openMenuId === invoice.id ? null : invoice.id);
                                                                        }}
                                                                    >
                                                                        <MoreHorizontal size={18} />
                                                                    </button>
                                                                    {openMenuId === invoice.id && (
                                                                        <div className="inv-action-dropdown" onClick={(e) => e.stopPropagation()}>
                                                                            <button
                                                                                type="button"
                                                                                className="inv-action-item"
                                                                                onClick={() => {
                                                                                    setOpenMenuId(null);
                                                                                    setSelected(invoice);
                                                                                }}
                                                                            >
                                                                                <Eye size={15} />
                                                                                <span>View Details</span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="inv-action-item"
                                                                                onClick={() => {
                                                                                    setOpenMenuId(null);
                                                                                    void handleDownloadPdf(invoice);
                                                                                }}
                                                                            >
                                                                                <Download size={15} />
                                                                                <span>Download PDF</span>
                                                                            </button>
                                                                            {["draft", "pending"].includes(invoice.status?.toLowerCase()) && (
                                                                                <button
                                                                                    type="button"
                                                                                    className="inv-action-item"
                                                                                    onClick={() => {
                                                                                        setOpenMenuId(null);
                                                                                        void handleSendInvoice(invoice);
                                                                                    }}
                                                                                >
                                                                                    <Send size={15} />
                                                                                    <span>Send to Client</span>
                                                                                </button>
                                                                            )}
                                                                            {invoice.status?.toLowerCase() !== "paid" &&
                                                                                invoice.status?.toLowerCase() !== "void" &&
                                                                                (invoice.outstanding > 0 || (invoice.totalPaid ?? 0) < invoice.totalAmount) && (
                                                                                    <button
                                                                                        type="button"
                                                                                        className="inv-action-item"
                                                                                        onClick={() => {
                                                                                            setOpenMenuId(null);
                                                                                            setPaymentInvoice(invoice);
                                                                                        }}
                                                                                    >
                                                                                        <CreditCard size={15} />
                                                                                        <span>Record Payment</span>
                                                                                    </button>
                                                                                )}
                                                                            {!["paid", "void"].includes(invoice.status?.toLowerCase()) && (
                                                                                <button
                                                                                    type="button"
                                                                                    className="inv-action-item"
                                                                                    onClick={() => {
                                                                                        setOpenMenuId(null);
                                                                                        setEditInvoice(invoice);
                                                                                    }}
                                                                                >
                                                                                    <Edit3 size={15} />
                                                                                    <span>Edit Invoice</span>
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                className="inv-action-item danger"
                                                                                onClick={() => {
                                                                                    setOpenMenuId(null);
                                                                                    void handleArchive(invoice);
                                                                                }}
                                                                            >
                                                                                <Trash2 size={15} />
                                                                                <span>Archive</span>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination (Frame 2147225166) */}
                                    <div className="invoices-pagination-bar">
                                        <p className="invoices-total-count">Total Invoices: {page?.total ?? 0}</p>
                                        <div className="invoices-page-controls">
                                            <button
                                                type="button"
                                                className="btn-inv-page"
                                                disabled={!page || page.page <= 1}
                                                onClick={() => void load((page?.page ?? 1) - 1, search, pageSize)}
                                                aria-label="Previous page"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            {pageNumbers.map((pNum) => (
                                                <button
                                                    key={pNum}
                                                    type="button"
                                                    className={`btn-inv-page ${pNum === page?.page ? "active" : ""}`}
                                                    onClick={() => void load(pNum, search, pageSize)}
                                                >
                                                    {pNum}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                className="btn-inv-page"
                                                disabled={!page || !page.hasMore}
                                                onClick={() => void load((page?.page ?? 1) + 1, search, pageSize)}
                                                aria-label="Next page"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                        <div className="invoices-per-page-container">
                                            <span className="invoices-per-page-label">Show per Page:</span>
                                            <select
                                                className="invoices-per-page-select"
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
                        </div>
                    </div>
                )}

                {/* Import Modal */}
                {showImportModal && (
                    <InvoiceExcelImportModal
                        isOpen={showImportModal}
                        onClose={() => setShowImportModal(false)}
                        onSuccess={() => {
                            showToast("Invoices imported successfully.");
                            void load(1, search, pageSize);
                        }}
                    />
                )}

                {/* Direct Record Payment Modal */}
                {paymentInvoice && (
                    <RecordPaymentModal
                        invoice={paymentInvoice}
                        currency={currency}
                        onClose={() => setPaymentInvoice(null)}
                        onSuccess={() => {
                            setPaymentInvoice(null);
                            showToast("Payment successfully recorded.");
                            void load(page?.page ?? 1, search, pageSize);
                        }}
                    />
                )}

                {/* Direct Edit Invoice Modal */}
                {editInvoice && (
                    <EditInvoiceModal
                        invoice={editInvoice}
                        onClose={() => setEditInvoice(null)}
                        onSuccess={() => {
                            setEditInvoice(null);
                            showToast("Invoice updated successfully.");
                            void load(page?.page ?? 1, search, pageSize);
                        }}
                    />
                )}

                {/* Invoice Preview Modal */}
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
    loading = false,
}: {
    summary: Summary | null;
    currency: string;
    loading?: boolean;
}) {
    const collectedPercentage = summary && summary.totalInvoiced > 0
        ? Math.round((summary.collected / summary.totalInvoiced) * 100)
        : 0;

    return (
        <div className="invoices-summary-row">
            {/* Card 1: Total Invoiced (Frame 93) */}
            <div className="invoices-kpi-card">
                <span className="invoices-kpi-label">Total Invoiced</span>
                <p className="invoices-kpi-value">
                    {summary ? formatCompact(summary.totalInvoiced, currency) : loading ? "—" : "₹0"}
                </p>
                <span className="invoices-kpi-period">This quarter</span>
            </div>

            {/* Card 2: Collected (Frame 2147225072) */}
            <div className="invoices-kpi-card">
                <span className="invoices-kpi-label">Collected</span>
                <p className="invoices-kpi-value">
                    {summary ? formatCompact(summary.collected, currency) : loading ? "—" : "₹0"}
                </p>
                <span className="invoices-kpi-period">
                    {summary ? `${collectedPercentage}% collected` : "0% collected"}
                </span>
            </div>

            {/* Card 3: Outstanding (Frame 2147225073) */}
            <div className="invoices-kpi-card">
                <span className="invoices-kpi-label">Outstanding</span>
                <p className="invoices-kpi-value">
                    {summary ? formatCompact(summary.outstanding, currency) : loading ? "—" : "₹0"}
                </p>
                <span className="invoices-kpi-period">
                    {summary && summary.totalInvoices > 0
                        ? `${summary.totalInvoices} invoice${summary.totalInvoices === 1 ? "" : "s"}`
                        : "0 invoices"}
                </span>
            </div>

            {/* Card 4: Overdue (Frame 2147225071) */}
            <div className="invoices-kpi-card">
                <span className="invoices-kpi-label">Overdue</span>
                <p className="invoices-kpi-value invoices-kpi-value-overdue">
                    {summary ? formatCompact(summary.overdue, currency) : loading ? "—" : "₹0"}
                </p>
                <span className="invoices-kpi-period">
                    {summary ? `${summary.overdueCount} invoice${summary.overdueCount === 1 ? "" : "s"}` : "0 invoices"}
                </span>
            </div>
        </div>
    );
}

function InvoiceEmpty({ onCreate, onImport }: { onCreate: () => void; onImport?: () => void }) {
    return (
        <div className="invoices-empty-container">
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={32} color="#2563EB" />
            </div>
            <h3>No invoices yet</h3>
            <p>
                Create your first invoice from a BOQ or import existing invoices to start managing project financials.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {onImport && (
                    <button type="button" className="btn-invoices-import" onClick={onImport}>
                        Import Invoices
                    </button>
                )}
                <button type="button" className="btn-invoices-new" onClick={onCreate}>
                    <Plus size={18} />
                    <span>New Invoices</span>
                </button>
            </div>
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
        <div className="invoice-preview-backdrop" onClick={onClose}>
            <aside
                className="invoice-preview-drawer"
                onClick={(event) => event.stopPropagation()}
                aria-label="Invoice Preview"
            >
                {/* Header (Frame 2147225093) */}
                <div className="invoice-preview-header">
                    <h3 className="invoice-preview-header-title">
                        {detail.invoiceNumber} — Invoice Preview
                    </h3>
                    <button
                        className="invoice-preview-close-btn"
                        type="button"
                        onClick={onClose}
                        aria-label="Close invoice preview"
                    >
                        <X size={20} />
                    </button>
                </div>

                {toast && (
                    <div className={`invoice-preview-toast ${toast.type}`}>
                        {toast.text}
                    </div>
                )}

                {/* White Paper Section (Frame 2147225027) */}
                <div className="invoice-preview-paper">
                    {/* Brand Header (Frame 2147225177) */}
                    <div className="invoice-preview-paper-header">
                        <div className="invoice-preview-brand-col">
                            <h2 className="invoice-preview-org-title">{orgName || "Not configured"}</h2>
                            <div className="invoice-preview-brand-meta">
                                <p>
                                    {detail.billingAddress
                                        ? [detail.billingAddress.line1, detail.billingAddress.city, detail.billingAddress.state]
                                              .filter(Boolean)
                                              .join(", ")
                                        : "Address not configured"}
                                </p>
                                {(detail as unknown as { gstNumber?: string; gstin?: string }).gstNumber ||
                                (detail as unknown as { gstNumber?: string; gstin?: string }).gstin ? (
                                    <p>
                                        GST:{" "}
                                        {(detail as unknown as { gstNumber?: string; gstin?: string }).gstNumber ||
                                            (detail as unknown as { gstNumber?: string; gstin?: string }).gstin}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                        <div className="invoice-preview-doc-meta">
                            <span className="invoice-preview-type-tag">
                                {detail.type.replace(/_/g, "-").toUpperCase()}
                            </span>
                            <h4 className="invoice-preview-id-code">{detail.invoiceNumber}</h4>
                            <span className={`invoice-preview-status-badge badge-status-${detail.status.toLowerCase()}`}>
                                {detail.status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Meta Card: BILLED TO & Dates (Frame 2147225180) */}
                    <div className="invoice-preview-meta-card">
                        <div className="invoice-preview-billed-to">
                            <span className="invoice-preview-meta-label">BILLED TO</span>
                            <strong className="invoice-preview-client-title">{detail.clientName}</strong>
                            <span className="invoice-preview-project-title">{detail.projectName || "General Fit-Out"}</span>
                        </div>
                        <div className="invoice-preview-dates-col">
                            <div className="invoice-preview-date-item">
                                <span className="date-lbl">Issue Date:</span>
                                <span className="date-val">{formatDate(detail.issueDate)}</span>
                            </div>
                            <div className="invoice-preview-date-item">
                                <span className="date-lbl">Due Date:</span>
                                <span className="date-val">{formatDate(detail.dueDate)}</span>
                            </div>
                            <div className="invoice-preview-date-item">
                                <span className="date-lbl">Milestone:</span>
                                <span className="date-val">{detail.milestone || "-"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table (Frame 2147225182 / Frame 57 / Frame 61) */}
                    <div className="invoice-preview-items-section">
                        <div className="invoice-preview-table-head">
                            <div className="invoice-preview-th-cell col-desc">DESCRIPTION</div>
                            <div className="invoice-preview-th-cell col-qty">QTY</div>
                            <div className="invoice-preview-th-cell col-rate">RATE</div>
                            <div className="invoice-preview-th-cell col-amount">AMOUNT</div>
                        </div>
                        <div className="invoice-preview-table-rows">
                            {items.map((item, idx) => {
                                const rowAmount = item.amount ?? (item.quantity * item.rate);
                                return (
                                    <div key={item.id || `${item.description}-${idx}`} className="invoice-preview-row-wrap">
                                        <div className="invoice-preview-table-row">
                                            <div className="invoice-preview-td-cell col-desc">{item.description}</div>
                                            <div className="invoice-preview-td-cell col-qty">{item.quantity}</div>
                                            <div className="invoice-preview-td-cell col-rate">
                                                {item.rate > 0 ? formatCompact(item.rate, currency) : "As agreed"}
                                            </div>
                                            <div className="invoice-preview-td-cell col-amount">{formatCompact(rowAmount, currency)}</div>
                                        </div>
                                        {idx < items.length - 1 && <hr className="invoice-preview-table-divider" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Totals Breakdown (Frame 2147225179) */}
                    <div className="invoice-preview-totals-box">
                        <div className="invoice-preview-total-row">
                            <span>Subtotal</span>
                            <strong>{formatCompact(subtotal, currency)}</strong>
                        </div>
                        <div className="invoice-preview-total-row">
                            <span>GST ({taxRate}%)</span>
                            <strong>{formatCompact(taxAmount, currency)}</strong>
                        </div>
                        <hr className="invoice-preview-totals-divider" />
                        <div className="invoice-preview-total-due-row">
                            <span>Total Due</span>
                            <strong>{formatCompact(totalDue, currency)}</strong>
                        </div>
                    </div>

                    {/* Bank Details & Payment Status Block (Frame 2147225183) */}
                    <div className="invoice-preview-bank-card">
                        <h5 className="invoice-preview-bank-title">Payment status</h5>
                        <div className="invoice-preview-bank-grid">
                            <div className="invoice-preview-bank-row">
                                <div className="invoice-preview-bank-field">
                                    <span className="invoice-preview-bank-lbl">Bank Name</span>
                                    <strong className="invoice-preview-bank-val">{detail.bankDetails?.bankName || "Not configured"}</strong>
                                </div>
                                <div className="invoice-preview-bank-field">
                                    <span className="invoice-preview-bank-lbl">Account Holder</span>
                                    <strong className="invoice-preview-bank-val">
                                        {detail.bankDetails?.accountHolder || orgName || "Not configured"}
                                    </strong>
                                </div>
                                <div className="invoice-preview-bank-field">
                                    <span className="invoice-preview-bank-lbl">Account Number</span>
                                    <strong className="invoice-preview-bank-val">
                                        {detail.bankDetails?.accountNumber || "Not configured"}
                                    </strong>
                                </div>
                            </div>
                            <div className="invoice-preview-bank-row">
                                <div className="invoice-preview-bank-field">
                                    <span className="invoice-preview-bank-lbl">IFSC Code</span>
                                    <strong className="invoice-preview-bank-val">{detail.bankDetails?.ifscCode || "Not configured"}</strong>
                                </div>
                                <div className="invoice-preview-bank-field">
                                    <span className="invoice-preview-bank-lbl">Branch</span>
                                    <strong className="invoice-preview-bank-val">{detail.bankDetails?.branch || "Not configured"}</strong>
                                </div>
                                <div className="invoice-preview-bank-field" style={{ opacity: 0 }}>
                                    <span className="invoice-preview-bank-lbl">—</span>
                                    <strong className="invoice-preview-bank-val">—</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4 Action Buttons Footer (Frame 2147225069) */}
                <div className="invoice-preview-footer-actions">
                    <button
                        type="button"
                        className="btn-inv-preview-action btn-inv-preview-white"
                        onClick={() => setShowEdit(true)}
                        disabled={detail.status === "paid" || detail.status === "void"}
                    >
                        <Edit3 size={15} />
                        <span>Edit</span>
                    </button>
                    <button
                        type="button"
                        className="btn-inv-preview-action btn-inv-preview-white"
                        onClick={() => void handleDownload()}
                        disabled={pdfLoading}
                    >
                        <Download size={15} />
                        <span>{pdfLoading ? "Preparing..." : "Download PDF"}</span>
                    </button>
                    <button
                        type="button"
                        className="btn-inv-preview-action btn-inv-preview-white"
                        onClick={() => void handleSendToClient()}
                        disabled={statusLoading || detail.status === "sent" || detail.status === "paid" || detail.status === "void"}
                    >
                        <Send size={15} />
                        <span>{detail.status === "sent" ? "Sent to Client" : statusLoading ? "Sending..." : "Send to Client"}</span>
                    </button>
                    <button
                        type="button"
                        className="btn-inv-preview-action btn-inv-preview-primary"
                        onClick={() => setShowPayment(true)}
                        disabled={detail.status === "paid" || detail.status === "void" || (detail.outstanding <= 0 && (detail.totalPaid ?? 0) >= detail.totalAmount)}
                    >
                        <Check size={15} />
                        <span>{detail.status === "paid" ? "Paid in Full" : "Record Payment"}</span>
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
            </aside>
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
    const [bankName, setBankName] = useState(invoice.bankDetails?.bankName || "");
    const [accountHolder, setAccountHolder] = useState(invoice.bankDetails?.accountHolder || "");
    const [accountNumber, setAccountNumber] = useState(invoice.bankDetails?.accountNumber || "");
    const [ifscCode, setIfscCode] = useState(invoice.bankDetails?.ifscCode || "");
    const [branch, setBranch] = useState(invoice.bankDetails?.branch || "");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Load full invoice details if items or bank details were not eagerly loaded
    useEffect(() => {
        let active = true;
        if (!invoice.items || invoice.items.length === 0) {
            fetch(`/api/v1/invoices/${invoice.id}`, { credentials: "include" })
                .then((res) => res.json())
                .then((payload) => {
                    if (!active) return;
                    const full = parseApiResponse<Invoice>(payload);
                    if (full?.items && full.items.length > 0) {
                        setItems(
                            full.items.map((it) => ({
                                description: it.description,
                                quantity: it.quantity,
                                rate: it.rate,
                            }))
                        );
                    }
                    if (full?.bankDetails) {
                        if (full.bankDetails.bankName) setBankName(full.bankDetails.bankName);
                        if (full.bankDetails.accountHolder) setAccountHolder(full.bankDetails.accountHolder);
                        if (full.bankDetails.accountNumber) setAccountNumber(full.bankDetails.accountNumber);
                        if (full.bankDetails.ifscCode) setIfscCode(full.bankDetails.ifscCode);
                        if (full.bankDetails.branch) setBranch(full.bankDetails.branch);
                    }
                })
                .catch(() => {});
        }
        return () => {
            active = false;
        };
    }, [invoice.id, invoice.items]);

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
        <div className="create-invoice-container">
            {/* Header Bar (Frame 2147225068) */}
            <div className="create-invoice-header">
                <div className="create-invoice-header-left">
                    <button
                        type="button"
                        className="btn-create-back"
                        onClick={onClose}
                        aria-label="Back to Invoices"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <h3 className="create-invoice-header-title">Create New Invoice</h3>
                </div>
                <div className="create-invoice-header-actions">
                    <button
                        type="button"
                        className="btn-create-action btn-create-cancel"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-create-action btn-create-draft"
                        onClick={() => void handleSave("draft")}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save as Draft"}
                    </button>
                    <button
                        type="button"
                        className="btn-create-action btn-create-submit"
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

            {/* Two-Column Layout (Frame 2147225223) */}
            <div className="create-invoice-layout">
                {/* Left Column (Frame 2147225221) */}
                <div className="create-invoice-col-form">
                    {/* Card 1: INVOICE DETAILS (Frame 2147225071) */}
                    <div className="create-invoice-section-card">
                        <h4 className="create-invoice-section-title">INVOICE DETAILS</h4>

                        <div className="create-invoice-inner-card">
                            <div className="create-field-group">
                                <label className="create-field-label">
                                    Select BOQ <span className="req-asterisk">*</span>
                                </label>

                                {/* Searchable Dropdown */}
                                <div className="create-boq-dropdown-wrapper" ref={dropdownRef}>
                                    <button
                                        type="button"
                                        className={`create-boq-trigger ${dropdownOpen ? "open" : ""}`}
                                        onClick={() => setDropdownOpen((prev) => !prev)}
                                    >
                                        <div className="create-boq-trigger-left">
                                            <Search size={20} color="#475569" />
                                            {displayBoqTitle ? (
                                                <span>{displayBoqTitle}</span>
                                            ) : (
                                                <span className="create-boq-trigger-placeholder">Select BOQ</span>
                                            )}
                                        </div>
                                        <ChevronDown size={20} color="#0F172A" />
                                    </button>

                                    {dropdownOpen && (
                                        <div className="create-boq-menu">
                                            <div className="create-boq-search-box">
                                                <Search size={14} color="#64748B" />
                                                <input
                                                    autoFocus
                                                    className="create-boq-search-input"
                                                    placeholder="Search BOQ or project..."
                                                    value={boqSearch}
                                                    onChange={(e) => setBoqSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>

                                            <div
                                                className={`create-boq-option ${!selectedBoq ? "active" : ""}`}
                                                onClick={() => void handleSelectBoq(null)}
                                            >
                                                <strong className="create-boq-option-title">Custom Invoice (No BOQ linked)</strong>
                                                <span className="create-boq-option-sub">Create direct manual invoice lines</span>
                                            </div>

                                            {boqLoading && (
                                                <div style={{ padding: 10, fontSize: 13, color: "#64748B", textAlign: "center" }}>
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
                                                    className={`create-boq-option ${selectedBoq?.id === b.id ? "active" : ""}`}
                                                    onClick={() => void handleSelectBoq(b)}
                                                >
                                                    <strong className="create-boq-option-title">BOQ #{b.boqNumber} — {b.projectName || "Project"}</strong>
                                                    <span className="create-boq-option-sub">
                                                        Amount: ₹{formatNumber(b.grandTotal || b.subtotal || 0)} • Status: {b.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dates Row (Frame 2147225454) */}
                            <div className="create-dates-row">
                                <div className="create-field-group">
                                    <label className="create-field-label">
                                        Issue Date <span className="req-asterisk">*</span>
                                    </label>
                                    <div className="create-date-box">
                                        <input
                                            type="date"
                                            className="create-date-native-input"
                                            value={issueDate}
                                            onChange={(e) => setIssueDate(e.target.value)}
                                        />
                                        <Calendar size={20} color="#0F172A" style={{ pointerEvents: "none", flexShrink: 0 }} />
                                    </div>
                                </div>
                                <div className="create-field-group">
                                    <label className="create-field-label">
                                        Due Date <span className="req-asterisk">*</span>
                                    </label>
                                    <div className="create-date-box">
                                        <input
                                            type="date"
                                            className="create-date-native-input"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                        />
                                        <Calendar size={20} color="#0F172A" style={{ pointerEvents: "none", flexShrink: 0 }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: ITEMS (Frame 2147225126) */}
                    <div className="create-invoice-section-card">
                        <h4 className="create-invoice-section-title">ITEMS</h4>

                        <div className="create-items-card-inner">
                            <div className="create-items-table-head">
                                <div className="create-items-th th-desc">DESCRIPTION</div>
                                <div className="create-items-th th-qty">QTY</div>
                                <div className="create-items-th th-rate">RATE</div>
                                <div className="create-items-th th-amount">AMOUNT</div>
                                <div className="create-items-th th-action" />
                            </div>

                            <div className="create-items-rows-container">
                                {items.map((it, idx) => {
                                    const rowAmount = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
                                    return (
                                        <div className="create-item-row-item" key={idx}>
                                            <div className="create-items-table-row">
                                                <div className="create-input-cell cell-desc">
                                                    <input
                                                        className="create-item-input"
                                                        placeholder="Enter Description"
                                                        value={it.description}
                                                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                                                    />
                                                </div>
                                                <div className="create-input-cell cell-qty">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        className="create-item-input"
                                                        style={{ textAlign: "center" }}
                                                        placeholder="0"
                                                        value={it.quantity === 0 ? "" : it.quantity}
                                                        onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="create-input-cell cell-rate">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step="any"
                                                        className="create-item-input"
                                                        style={{ textAlign: "right" }}
                                                        placeholder="0"
                                                        value={it.rate === 0 ? "" : it.rate}
                                                        onChange={(e) => updateItem(idx, "rate", Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="create-input-cell cell-amount">
                                                    ₹{formatNumber(rowAmount)}
                                                </div>
                                                <div className="create-input-cell cell-action">
                                                    <button
                                                        type="button"
                                                        className="btn-create-item-delete"
                                                        disabled={items.length <= 1}
                                                        onClick={() => removeItem(idx)}
                                                        aria-label="Remove item"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            {idx < items.length - 1 && <hr className="create-item-row-divider" />}
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                className="btn-create-add-item"
                                onClick={addItem}
                            >
                                Add Item
                            </button>
                        </div>
                    </div>

                    {/* Card 3: Additional Notes (Frame 2147225127) */}
                    <div className="create-invoice-section-card">
                        <h4 className="create-invoice-section-title">Additional Notes</h4>
                        <div className="create-invoice-inner-card">
                            <textarea
                                className="create-notes-textarea"
                                placeholder="Add any additional notes or payment instructions..."
                                value={additionalNotes}
                                onChange={(e) => setAdditionalNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Dynamic Preview (Frame 2147225071) */}
                <div className="create-invoice-col-preview">
                    <div className="create-preview-section-card">
                        <div className="create-preview-header-bar">
                            <h4 className="create-preview-title">INVOICE PREVIEW</h4>
                            <button
                                type="button"
                                className="btn-create-change-template"
                                onClick={cycleTemplate}
                                title="Click to switch template style"
                            >
                                Change Template
                            </button>
                        </div>

                        <div className={`create-preview-paper-card preview-template-${template}`}>
                            {/* Brand Header (Frame 2147225177) */}
                            <div className="invoice-preview-paper-header">
                                <div className="invoice-preview-brand-col">
                                    <h2 className="invoice-preview-org-title">{orgName || "Not configured"}</h2>
                                    <div className="invoice-preview-brand-meta">
                                        <p>Address not configured</p>
                                    </div>
                                </div>
                                <div className="invoice-preview-doc-meta">
                                    <span className="invoice-preview-type-tag">INVOICE</span>
                                    <h4 className="invoice-preview-id-code">INV-DRAFT</h4>
                                    <span className="invoice-preview-status-badge badge-status-draft">DRAFT</span>
                                </div>
                            </div>

                            {/* Meta Card: BILLED TO & Dates (Frame 2147225180) */}
                            <div className="invoice-preview-meta-card">
                                <div className="invoice-preview-billed-to">
                                    <span className="invoice-preview-meta-label">BILLED TO</span>
                                    <strong className="invoice-preview-client-title">{clientName || "Client Name"}</strong>
                                    <span className="invoice-preview-project-title">{projectName || "Interior Execution Project"}</span>
                                </div>
                                <div className="invoice-preview-dates-col">
                                    <div className="invoice-preview-date-item">
                                        <span className="date-lbl">Issue Date:</span>
                                        <span className="date-val">{formatDate(issueDate)}</span>
                                    </div>
                                    <div className="invoice-preview-date-item">
                                        <span className="date-lbl">Due Date:</span>
                                        <span className="date-val">{formatDate(dueDate)}</span>
                                    </div>
                                    <div className="invoice-preview-date-item">
                                        <span className="date-lbl">Milestone:</span>
                                        <span className="date-val">{milestone || "Execution Milestone"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div className="invoice-preview-items-section">
                                <div className="invoice-preview-table-head">
                                    <div className="invoice-preview-th-cell col-desc">DESCRIPTION</div>
                                    <div className="invoice-preview-th-cell col-qty">QTY</div>
                                    <div className="invoice-preview-th-cell col-rate">RATE</div>
                                    <div className="invoice-preview-th-cell col-amount">AMOUNT</div>
                                </div>
                                <div className="invoice-preview-table-rows">
                                    {items.map((it, idx) => {
                                        const rowAmt = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
                                        return (
                                            <div key={idx} className="invoice-preview-row-wrap">
                                                <div className="invoice-preview-table-row">
                                                    <div className="invoice-preview-td-cell col-desc">
                                                        {it.description.trim() || `(Item ${idx + 1})`}
                                                    </div>
                                                    <div className="invoice-preview-td-cell col-qty">{it.quantity || 1}</div>
                                                    <div className="invoice-preview-td-cell col-rate">
                                                        {it.rate > 0 ? formatCompact(it.rate, currency) : "₹0"}
                                                    </div>
                                                    <div className="invoice-preview-td-cell col-amount">
                                                        {formatCompact(rowAmt, currency)}
                                                    </div>
                                                </div>
                                                {idx < items.length - 1 && <hr className="invoice-preview-table-divider" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Totals Breakdown (Frame 2147225179 / Frame 2147225224) */}
                            <div className="create-preview-totals-box">
                                <div className="create-preview-total-row">
                                    <span>Subtotal</span>
                                    <strong>{formatCompact(subtotal, currency)}</strong>
                                </div>
                                <div className="create-preview-total-row">
                                    <span>GST ({taxRate}%)</span>
                                    <strong>{formatCompact(taxAmount, currency)}</strong>
                                </div>
                                <hr className="create-preview-totals-divider" />
                                <div className="create-preview-total-due-row">
                                    <span>Total Amount</span>
                                    <strong>{formatCompact(totalDue, currency)}</strong>
                                </div>
                            </div>

                            {/* Additional Notes Block if entered */}
                            {additionalNotes.trim() && (
                                <div style={{ marginTop: 16, padding: 14, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".05em" }}>
                                        Notes & Instructions
                                    </span>
                                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#334155", whiteSpace: "pre-wrap" }}>
                                        {additionalNotes}
                                    </p>
                                </div>
                            )}

                            {/* Bank Details & Payment Status Block */}
                            <div className="invoice-preview-bank-card" style={{ marginTop: 16 }}>
                                <h5 className="invoice-preview-bank-title">Payment status</h5>
                                <div className="invoice-preview-bank-grid">
                                    <div className="invoice-preview-bank-row">
                                        <div className="invoice-preview-bank-field">
                                            <span className="invoice-preview-bank-lbl">Bank Name</span>
                                            <strong className="invoice-preview-bank-val">Not configured</strong>
                                        </div>
                                        <div className="invoice-preview-bank-field">
                                            <span className="invoice-preview-bank-lbl">Account Holder</span>
                                            <strong className="invoice-preview-bank-val">{orgName || "Not configured"}</strong>
                                        </div>
                                        <div className="invoice-preview-bank-field">
                                            <span className="invoice-preview-bank-lbl">Account Number</span>
                                            <strong className="invoice-preview-bank-val">Not configured</strong>
                                        </div>
                                    </div>
                                    <div className="invoice-preview-bank-row">
                                        <div className="invoice-preview-bank-field">
                                            <span className="invoice-preview-bank-lbl">IFSC Code</span>
                                            <strong className="invoice-preview-bank-val">Not configured</strong>
                                        </div>
                                        <div className="invoice-preview-bank-field">
                                            <span className="invoice-preview-bank-lbl">Branch</span>
                                            <strong className="invoice-preview-bank-val">Not configured</strong>
                                        </div>
                                        <div className="invoice-preview-bank-field" style={{ opacity: 0 }}>
                                            <span className="invoice-preview-bank-lbl">—</span>
                                            <strong className="invoice-preview-bank-val">—</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
