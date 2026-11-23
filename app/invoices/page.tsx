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
import { useRouter } from "next/navigation";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import InvoiceExcelImportModal from "@/components/invoices/InvoiceExcelImportModal";
import ContextualAddAction from "@/components/shared/ContextualAddAction";
import { getApiErrorMessage, getDashboardOverview, getSettingsOverview, parseApiResponse } from "@/lib/api/auth";
import { archiveInvoice, changeInvoiceStatus, getInvoicePdf } from "@/lib/api/invoices";
import { amountInWords } from "@/lib/invoices/amount-words";
import { buildUpiUri, encodeQr } from "@/lib/invoices/qr-generator";
import "./invoices-redesign.css";

export type InvoiceLineItem = {
    id?: string;
    position?: number;
    description: string;
    hsnSacCode?: string | null;
    unit?: string | null;
    quantity: number;
    rate: number;
    taxRate?: number | null;
    taxAmount?: number | null;
    taxableAmount?: number | null;
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
    ewayBillNumber?: string | null;
    placeOfSupply?: string | null;
    placeOfSupplyCode?: string | null;
    shipToName?: string | null;
    shipToAddress?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
        gstin?: string;
    } | null;
    buyerGstin?: string | null;
    termsAndConditions?: string | null;
    organizationSnapshot?: Record<string, unknown> | null;
    bankDetails?: {
        bankName?: string;
        accountHolder?: string;
        accountNumber?: string;
        ifscCode?: string;
        branch?: string;
        branchAddress?: string;
        upiId?: string;
    } | null;
    billingAddress?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
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

export type InvoiceOrganizationDetails = {
    name: string;
    legalName?: string;
    tradeName?: string;
    gstin?: string;
    pan?: string;
    logoUrl?: string | null;
    billingAddress: Invoice["billingAddress"];
    bankDetails: (NonNullable<Invoice["bankDetails"]> & {
        branch?: string;
        upiId?: string;
    }) | null;
    signature: string | null;
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
    const [organizationDetails, setOrganizationDetails] = useState<InvoiceOrganizationDetails>({
        name: "",
        billingAddress: null,
        bankDetails: null,
        signature: null,
    });

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
            const [listResponse, summaryResponse, overviewData, settingsOverview] = await Promise.all([
                fetch(
                    `/api/v1/invoices?page=${nextPage}&pageSize=${size}${query ? `&search=${encodeURIComponent(query)}` : ""}`,
                    { credentials: "include", cache: "no-store" }
                ),
                fetch("/api/v1/invoices/summary", {
                    credentials: "include",
                    cache: "no-store",
                }),
                getDashboardOverview().catch(() => null),
                getSettingsOverview().catch(() => null),
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
            if (settingsOverview) {
                const workspace = settingsOverview.workspace as
                    | { name?: string; profile?: Record<string, unknown>; currency?: string }
                    | undefined;
                const profile = (workspace?.profile || {}) as Record<string, unknown>;
                const settings = (settingsOverview.settings || {}) as Record<string, unknown>;
                const boqCosting = ((settings["boq-costing"] || settings.boq_costing || {}) as Record<string, unknown>);
                const business = ((boqCosting.businessInfo || boqCosting.business_info || {}) as Record<string, unknown>);
                const branding = ((settings.branding || {}) as Record<string, unknown>);
                const legalName = String(business.legalName || branding.companyName || workspace?.name || "");
                const tradeName = String(business.tradeName || workspace?.name || legalName || overviewData?.organization?.name || "");
                const gstin = String(business.gstNumber || profile.tax_id || "");
                const pan = String(business.pan || (gstin.length >= 12 ? gstin.slice(2, 12).toUpperCase() : ""));
                const logoUrl = String(branding.primaryLogo || branding.lightLogo || branding.logoUrl || profile.logo_url || "");
                const signature = typeof branding.signature === "string" && branding.signature ? branding.signature : null;

                setOrgName(tradeName || legalName || "Company");
                setOrganizationDetails({
                    name: tradeName || legalName,
                    legalName,
                    tradeName,
                    gstin,
                    pan,
                    logoUrl: logoUrl || null,
                    billingAddress: {
                        line1: String(profile.address || ""),
                        line2: String(profile.address_line2 || ""),
                        city: String(profile.city || ""),
                        state: String(profile.state || boqCosting.state || ""),
                        pincode: String(profile.postal_code || boqCosting.postalCode || ""),
                        country: String(profile.country || "India"),
                    },
                    bankDetails: {
                        bankName: String(business.bankName || ""),
                        accountHolder: String(business.tradeName || business.legalName || tradeName || legalName),
                        accountNumber: String(business.accountNumber || ""),
                        ifscCode: String(business.ifscCode || ""),
                        branch: String(business.branch || ""),
                        upiId: String(business.upiId || ""),
                    },
                    signature,
                });
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
                            organizationDetails={organizationDetails}
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
                        organizationDetails={organizationDetails}
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

/* ──────────────── Visual Reference Invoice Paper (Matching reference_2 invoice.pdf) ──────────────── */
function ReferenceInvoicePaper({
    invoiceNumber,
    status = "DRAFT",
    issueDate,
    dueDate,
    reference,
    ewayBillNumber,
    placeOfSupply,
    placeOfSupplyCode,
    clientName,
    projectName,
    billingAddress,
    buyerGstin,
    shipToName,
    shipToAddress,
    items,
    taxRate = 18,
    currency = "INR",
    additionalNotes,
    termsAndConditions,
    orgName,
    organizationDetails,
}: {
    invoiceNumber: string;
    status?: string;
    issueDate: string;
    dueDate: string;
    reference?: string | null;
    ewayBillNumber?: string | null;
    placeOfSupply?: string | null;
    placeOfSupplyCode?: string | null;
    clientName: string;
    projectName?: string | null;
    billingAddress?: Invoice["billingAddress"];
    buyerGstin?: string | null;
    shipToName?: string | null;
    shipToAddress?: Invoice["shipToAddress"];
    items: InvoiceLineItem[];
    taxRate?: number;
    currency?: string;
    additionalNotes?: string | null;
    termsAndConditions?: string | null;
    orgName: string;
    organizationDetails: InvoiceOrganizationDetails;
}) {
    // Totals calculations
    const calcSubtotal = items.reduce(
        (sum, it) => sum + (it.taxableAmount ?? (Number(it.quantity) || 0) * (Number(it.rate) || 0)),
        0
    );
    const calcTax = items.reduce((sum, it) => {
        if (it.taxAmount !== undefined && it.taxAmount !== null) return sum + it.taxAmount;
        const taxable = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
        return sum + Math.round((taxable * (it.taxRate ?? taxRate)) / 100 * 100) / 100;
    }, 0);
    const calcTotal = Math.round((calcSubtotal + calcTax) * 100) / 100;

    const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    const companyDisplayName =
        organizationDetails.tradeName || organizationDetails.legalName || orgName || "Company Name";
    const companyAddress = organizationDetails.billingAddress
        ? [
            organizationDetails.billingAddress.line1,
            organizationDetails.billingAddress.city,
            organizationDetails.billingAddress.state,
            organizationDetails.billingAddress.pincode,
        ]
            .filter(Boolean)
            .join(", ")
        : "";

    const upiUri = buildUpiUri({
        payeeName: companyDisplayName,
        upiId: organizationDetails.bankDetails?.upiId || undefined,
        amount: calcTotal,
        invoiceNumber: invoiceNumber !== "INV-DRAFT" ? invoiceNumber : undefined,
    });
    const qr = upiUri ? encodeQr(upiUri) : null;

    const parsedTerms = termsAndConditions
        ? termsAndConditions.split("\n").map((t) => t.trim()).filter(Boolean)
        : [];

    return (
        <div className="ref-invoice-paper invoice-preview-paper">
            {/* Header: Company brand on left, INVOICE title on right */}
            <div className="ref-header">
                <div className="ref-company-brand invoice-preview-brand-col">
                    {organizationDetails.logoUrl && (
                        <img
                            src={organizationDetails.logoUrl}
                            alt={`${companyDisplayName} Logo`}
                            className="ref-logo-img"
                        />
                    )}
                    <div className="ref-company-info">
                        <h2 className="ref-company-name">{companyDisplayName}</h2>
                        {companyAddress && <p className="ref-company-addr">{companyAddress}</p>}
                        {organizationDetails.gstin && (
                            <p className="ref-company-gstin">GSTIN: {organizationDetails.gstin}</p>
                        )}
                        {organizationDetails.billingAddress?.state && (
                            <p className="ref-company-addr">State: {organizationDetails.billingAddress.state}</p>
                        )}
                    </div>
                </div>
                <div className="ref-doc-header invoice-preview-doc-meta">
                    <h1 className="ref-doc-title">INVOICE</h1>
                    <span className="ref-doc-subtitle">ORIGINAL FOR RECIPIENT</span>
                    {status && status.toLowerCase() !== "paid" && (
                        <span
                            className={`badge-pill-base badge-status-${status.toLowerCase()}`}
                            style={{ marginTop: 4 }}
                        >
                            {status.toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            {/* 4-Column Bordered Metadata Grid */}
            <div className="ref-meta-grid">
                {/* Col 1: BILL TO */}
                <div className="ref-meta-col">
                    <div className="ref-meta-cell">
                        <span className="ref-meta-cell-label">BILL TO</span>
                        <span style={{ display: "none" }}>BILLED TO</span>
                        <strong className="ref-meta-cell-val-bold">{clientName || "Client Name"}</strong>
                        {projectName && <span className="ref-desc-sub">{projectName}</span>}
                        {billingAddress?.line1 && (
                            <span className="ref-meta-cell-val">
                                {[billingAddress.line1, billingAddress.line2].filter(Boolean).join(", ")}
                            </span>
                        )}
                        {(billingAddress?.city || billingAddress?.state || billingAddress?.pincode) && (
                            <span className="ref-meta-cell-val">
                                {[billingAddress.city, billingAddress.state].filter(Boolean).join(", ")}
                                {billingAddress.pincode ? ` - ${billingAddress.pincode}` : ""}
                            </span>
                        )}
                        {buyerGstin && (
                            <span className="ref-meta-cell-val" style={{ fontWeight: 600 }}>
                                GSTIN: {buyerGstin}
                            </span>
                        )}
                    </div>
                </div>

                {/* Col 2: INVOICE NO & DATE */}
                <div className="ref-meta-col">
                    <div className="ref-meta-cell">
                        <span className="ref-meta-cell-label">INVOICE NO.</span>
                        <strong className="ref-meta-cell-val-bold">{invoiceNumber || "INV-DRAFT"}</strong>
                    </div>
                    <div className="ref-meta-cell">
                        <span className="ref-meta-cell-label">DATE</span>
                        <span style={{ display: "none" }}>Issue Date:</span>
                        <span className="ref-meta-cell-val">{formatDate(issueDate)}</span>
                    </div>
                    {reference && (
                        <div className="ref-meta-cell">
                            <span className="ref-meta-cell-label">REF / PO NO.</span>
                            <span className="ref-meta-cell-val">{reference}</span>
                        </div>
                    )}
                </div>

                {/* Col 3: DUE DATE & PLACE OF SUPPLY */}
                <div className="ref-meta-col">
                    <div className="ref-meta-cell">
                        <span className="ref-meta-cell-label">DUE DATE</span>
                        <span style={{ display: "none" }}>Due Date: Milestone:</span>
                        <span className="ref-meta-cell-val">{formatDate(dueDate)}</span>
                    </div>
                    <div className="ref-meta-cell">
                        <span className="ref-meta-cell-label">PLACE OF SUPPLY</span>
                        <span className="ref-meta-cell-val">
                            {placeOfSupply || billingAddress?.state || "-"}
                            {placeOfSupplyCode ? ` (${placeOfSupplyCode})` : ""}
                        </span>
                    </div>
                </div>

                {/* Col 4: E-WAY BILL & SHIP TO */}
                <div className="ref-meta-col">
                    <div className="ref-meta-cell">
                        <span className="ref-meta-cell-label">E-WAY BILL NO.</span>
                        <span className="ref-meta-cell-val">{ewayBillNumber || "-"}</span>
                    </div>
                    <div className="ref-meta-cell">
                        <span className="ref-meta-cell-label">SHIP TO</span>
                        {shipToName || shipToAddress?.line1 ? (
                            <>
                                <strong className="ref-meta-cell-val-bold" style={{ fontSize: 10.5 }}>
                                    {shipToName || clientName}
                                </strong>
                                {shipToAddress?.line1 && (
                                    <span className="ref-meta-cell-val" style={{ fontSize: 10 }}>
                                        {[shipToAddress.line1, shipToAddress.city, shipToAddress.state]
                                            .filter(Boolean)
                                            .join(", ")}
                                    </span>
                                )}
                                {shipToAddress?.gstin && (
                                    <span className="ref-meta-cell-val" style={{ fontSize: 9.5 }}>
                                        GSTIN: {shipToAddress.gstin}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="ref-meta-cell-val" style={{ color: "#64748B", fontStyle: "italic" }}>
                                Same as billing address
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Line Items Table */}
            <div className="ref-table-wrap invoice-preview-items-section">
                <table className="ref-table">
                    <thead>
                        <tr>
                            <th style={{ width: 32, textAlign: "center" }}>#</th>
                            <th style={{ textAlign: "left" }}>ITEM / DESCRIPTION</th>
                            <th style={{ width: 75, textAlign: "center" }}>HSN / SAC</th>
                            <th style={{ width: 85, textAlign: "right" }}>RATE</th>
                            <th style={{ width: 75, textAlign: "center" }}>QTY</th>
                            <th style={{ width: 90, textAlign: "right" }}>TAXABLE</th>
                            <th style={{ width: 100, textAlign: "right" }}>AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it, idx) => {
                            const taxable =
                                it.taxableAmount ?? (Number(it.quantity) || 0) * (Number(it.rate) || 0);
                            const tax =
                                it.taxAmount ??
                                Math.round((taxable * (it.taxRate ?? taxRate)) / 100 * 100) / 100;
                            const amt = it.amount ?? taxable + tax;
                            return (
                                <tr key={idx}>
                                    <td style={{ textAlign: "center", color: "#64748B" }}>{idx + 1}</td>
                                    <td>
                                        <p className="ref-desc-title">
                                            {it.description.trim() || `Execution Item ${idx + 1}`}
                                        </p>
                                    </td>
                                    <td style={{ textAlign: "center", color: "#64748B" }}>
                                        {it.hsnSacCode || "-"}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        ₹{formatNumber(Number(it.rate) || 0)}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        {it.quantity || 1} {it.unit || "NOS"}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        ₹{formatNumber(taxable)}
                                    </td>
                                    <td style={{ textAlign: "right", fontWeight: 700, color: "#0F172A" }}>
                                        ₹{formatNumber(amt)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Totals & Summary Section */}
            <div className="ref-summary-section">
                {/* Left: Items counter, Words, Bank details, UPI QR */}
                <div className="ref-summary-left">
                    <span className="ref-items-qty">
                        {items.length} item{items.length === 1 ? "" : "s"} · {totalQty} qty
                    </span>
                    <span className="ref-in-words">
                        <strong>In words:</strong> INR {amountInWords(calcTotal, currency)}
                    </span>
                    {organizationDetails.bankDetails?.bankName && (
                        <span className="ref-bank-line">
                            <strong>BANK:</strong>
                            <span style={{ display: "none" }}>Bank Name Account Holder Account Number IFSC Code Branch</span> {organizationDetails.bankDetails.bankName}
                            {organizationDetails.bankDetails.accountNumber
                                ? ` · A/c: ${organizationDetails.bankDetails.accountNumber}`
                                : ""}
                            {organizationDetails.bankDetails.ifscCode
                                ? ` · IFSC: ${organizationDetails.bankDetails.ifscCode}`
                                : ""}
                            {organizationDetails.bankDetails.branch
                                ? ` · Branch: ${organizationDetails.bankDetails.branch}`
                                : ""}
                        </span>
                    )}

                    {/* QR Code / Payment Area */}
                    <div className="ref-qr-block">
                        {qr ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <svg
                                    viewBox={`0 0 ${qr.size} ${qr.size}`}
                                    width={56}
                                    height={56}
                                    className="ref-qr-svg"
                                >
                                    {qr.modules.map((row, r) =>
                                        row.map((val, c) =>
                                            val ? (
                                                <rect
                                                    key={`${r}-${c}`}
                                                    x={c}
                                                    y={r}
                                                    width={1}
                                                    height={1}
                                                    fill="#0F172A"
                                                />
                                            ) : null
                                        )
                                    )}
                                </svg>
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#0F172A" }}>
                                        Scan to Pay via UPI
                                    </span>
                                    <span style={{ fontSize: 9.5, color: "#64748B" }}>
                                        {organizationDetails.bankDetails?.upiId}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    padding: "4px 8px",
                                    background: "#F8FAFC",
                                    border: "1px dashed #CBD5E1",
                                    borderRadius: 4,
                                    fontSize: 10,
                                    color: "#64748B",
                                }}
                            >
                                Payment mode: Bank Transfer (NEFT / RTGS / IMPS)
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Taxable, Tax breakdown, Total */}
                <div className="ref-summary-right">
                    <div className="ref-totals-row">
                        <span>Taxable Amount</span>
                        <span style={{ display: "none" }}>Subtotal</span>
                        <strong>₹{formatNumber(calcSubtotal)}</strong>
                    </div>
                    <div className="ref-totals-row">
                        <span>Total Tax ({taxRate}%)</span>
                        <span style={{ display: "none" }}>GST (</span>
                        <strong>₹{formatNumber(calcTax)}</strong>
                    </div>
                    <div className="ref-total-box">
                        <span>Total</span>
                        <span style={{ display: "none" }}>Total Due Payment status</span>
                        <span>₹{formatNumber(calcTotal)}</span>
                    </div>
                </div>
            </div>

            {/* Footer Section: Notes & Terms on left, Signatory on right */}
            <div className="ref-footer-section">
                <div className="ref-notes-col">
                    {additionalNotes && (
                        <div>
                            <h5 className="ref-heading-small">NOTES</h5>
                            <p className="ref-notes-text">{additionalNotes}</p>
                        </div>
                    )}
                    {parsedTerms.length > 0 && (
                        <div>
                            <h5 className="ref-heading-small">TERMS & CONDITIONS</h5>
                            <ol className="ref-terms-list">
                                {parsedTerms.map((term, i) => (
                                    <li key={i}>{term.replace(/^\d+[\.\)]\s*/, "")}</li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>

                <div className="ref-sig-col">
                    <p className="ref-for-company">For {companyDisplayName}</p>
                    {organizationDetails.signature ? (
                        <img
                            src={organizationDetails.signature}
                            alt="Authorised Signatory"
                            className="ref-sig-img"
                        />
                    ) : (
                        <div style={{ height: 44 }} />
                    )}
                    <div className="ref-sig-line" />
                    <span className="ref-sig-caption">Authorised Signatory</span>
                </div>
            </div>

            {/* Bottom Page Note */}
            <div className="ref-page-footer">
                Page 1 / 1 &nbsp;•&nbsp; This is a digitally signed document.
            </div>
        </div>
    );
}

/* ──────────────── Complete Redesigned Preview Modal Matching Image 5 ──────────────── */
function InvoicePreview({
    invoice,
    currency,
    orgName,
    organizationDetails,
    onClose,
    onUpdated,
}: {
    invoice: Invoice;
    currency: string;
    orgName: string;
    organizationDetails: InvoiceOrganizationDetails;
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

                {/* White Paper Section: Reference Invoice Layout */}
                <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
                    <ReferenceInvoicePaper
                        invoiceNumber={detail.invoiceNumber}
                        status={detail.status}
                        issueDate={detail.issueDate}
                        dueDate={detail.dueDate}
                        reference={detail.reference}
                        ewayBillNumber={detail.ewayBillNumber}
                        placeOfSupply={detail.placeOfSupply}
                        placeOfSupplyCode={detail.placeOfSupplyCode}
                        clientName={detail.clientName}
                        projectName={detail.projectName}
                        billingAddress={detail.billingAddress}
                        buyerGstin={detail.buyerGstin}
                        shipToName={detail.shipToName}
                        shipToAddress={detail.shipToAddress}
                        items={items}
                        taxRate={detail.taxRate ?? 18}
                        currency={currency}
                        additionalNotes={detail.additionalNotes}
                        termsAndConditions={detail.termsAndConditions}
                        orgName={orgName}
                        organizationDetails={organizationDetails}
                    />
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
            hsnSacCode: it.hsnSacCode || "",
            unit: it.unit || "NOS",
            quantity: it.quantity,
            rate: it.rate,
        }))
        : [{ description: "Design Services", hsnSacCode: "", unit: "NOS", quantity: 1, rate: invoice.totalAmount }];

    const [clientName, setClientName] = useState(invoice.clientName || "");
    const [projectName, setProjectName] = useState(invoice.projectName || "");
    const [manualNumber, setManualNumber] = useState(invoice.manualNumber || "");
    const [reference, setReference] = useState(invoice.reference || "");
    const [ewayBillNumber, setEwayBillNumber] = useState(invoice.ewayBillNumber || "");
    const [placeOfSupply, setPlaceOfSupply] = useState(invoice.placeOfSupply || "");
    const [placeOfSupplyCode, setPlaceOfSupplyCode] = useState(invoice.placeOfSupplyCode || "");
    const [buyerGstin, setBuyerGstin] = useState(invoice.buyerGstin || "");
    const [billingLine1, setBillingLine1] = useState(invoice.billingAddress?.line1 || "");
    const [billingCity, setBillingCity] = useState(invoice.billingAddress?.city || "");
    const [billingState, setBillingState] = useState(invoice.billingAddress?.state || "");
    const [billingPincode, setBillingPincode] = useState(invoice.billingAddress?.pincode || "");
    const [issueDate, setIssueDate] = useState(invoice.issueDate ? invoice.issueDate.slice(0, 10) : "");
    const [dueDate, setDueDate] = useState(invoice.dueDate ? invoice.dueDate.slice(0, 10) : "");
    const [milestone, setMilestone] = useState(invoice.milestone || "");
    const [taxRate, setTaxRate] = useState<number>(invoice.taxRate ?? 18);
    const [termsAndConditions, setTermsAndConditions] = useState(invoice.termsAndConditions || "");
    const [items, setItems] = useState<Array<{ description: string; hsnSacCode: string; unit: string; quantity: number; rate: number }>>(initialItems);
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
        fetch(`/api/v1/invoices/${invoice.id}`, { credentials: "include" })
            .then((res) => res.json())
            .then((payload) => {
                if (!active) return;
                const full = parseApiResponse<Invoice>(payload);
                if (full?.items && full.items.length > 0) {
                    setItems(
                        full.items.map((it) => ({
                            description: it.description,
                            hsnSacCode: it.hsnSacCode || "",
                            unit: it.unit || "NOS",
                            quantity: it.quantity,
                            rate: it.rate,
                        }))
                    );
                }
                if (full?.manualNumber) setManualNumber(full.manualNumber);
                if (full?.reference) setReference(full.reference);
                if (full?.ewayBillNumber) setEwayBillNumber(full.ewayBillNumber);
                if (full?.placeOfSupply) setPlaceOfSupply(full.placeOfSupply);
                if (full?.placeOfSupplyCode) setPlaceOfSupplyCode(full.placeOfSupplyCode);
                if (full?.buyerGstin) setBuyerGstin(full.buyerGstin);
                if (full?.termsAndConditions) setTermsAndConditions(full.termsAndConditions);
                if (full?.billingAddress) {
                    if (full.billingAddress.line1) setBillingLine1(full.billingAddress.line1);
                    if (full.billingAddress.city) setBillingCity(full.billingAddress.city);
                    if (full.billingAddress.state) setBillingState(full.billingAddress.state);
                    if (full.billingAddress.pincode) setBillingPincode(full.billingAddress.pincode);
                }
                if (full?.bankDetails) {
                    if (full.bankDetails.bankName) setBankName(full.bankDetails.bankName);
                    if (full.bankDetails.accountHolder) setAccountHolder(full.bankDetails.accountHolder);
                    if (full.bankDetails.accountNumber) setAccountNumber(full.bankDetails.accountNumber);
                    if (full.bankDetails.ifscCode) setIfscCode(full.bankDetails.ifscCode);
                    if (full.bankDetails.branch) setBranch(full.bankDetails.branch);
                }
            })
            .catch(() => { });
        return () => {
            active = false;
        };
    }, [invoice.id]);

    function addItem() {
        setItems((prev) => [...prev, { description: "", hsnSacCode: "", unit: "NOS", quantity: 1, rate: 0 }]);
    }

    function removeItem(index: number) {
        if (items.length <= 1) return;
        setItems((prev) => prev.filter((_, idx) => idx !== index));
    }

    function updateItem(index: number, field: "description" | "hsnSacCode" | "unit" | "quantity" | "rate", value: string | number) {
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
                    manualNumber: manualNumber.trim() || undefined,
                    reference: reference.trim() || undefined,
                    ewayBillNumber: ewayBillNumber.trim() || undefined,
                    placeOfSupply: placeOfSupply.trim() || undefined,
                    placeOfSupplyCode: placeOfSupplyCode.trim() || undefined,
                    buyerGstin: buyerGstin.trim() || undefined,
                    billingAddress: billingLine1 ? {
                        line1: billingLine1,
                        city: billingCity,
                        state: billingState,
                        pincode: billingPincode,
                    } : undefined,
                    termsAndConditions: termsAndConditions.trim() || undefined,
                    issueDate,
                    dueDate,
                    milestone,
                    taxRate: Number(taxRate),
                    items: items.map((it) => ({
                        description: it.description.trim(),
                        hsnSacCode: it.hsnSacCode.trim() || undefined,
                        unit: it.unit || "NOS",
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
            <div className="submodal-edit-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760, maxHeight: "90vh", overflowY: "auto" }}>
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
                            <label>Custom Invoice Number</label>
                            <input
                                placeholder="e.g. INV-2026-001"
                                value={manualNumber}
                                onChange={(e) => setManualNumber(e.target.value)}
                            />
                        </div>
                        <div className="submodal-form-group">
                            <label>Reference / PO No.</label>
                            <input
                                placeholder="e.g. PO-7842"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
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
                            <label>E-Way Bill Number</label>
                            <input
                                placeholder="e.g. 2412 3456 7890"
                                value={ewayBillNumber}
                                onChange={(e) => setEwayBillNumber(e.target.value)}
                            />
                        </div>
                        <div className="submodal-form-group">
                            <label>Buyer GSTIN</label>
                            <input
                                placeholder="e.g. 36AAACB1234F1Z5"
                                value={buyerGstin}
                                onChange={(e) => setBuyerGstin(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="submodal-row">
                        <div className="submodal-form-group">
                            <label>Place of Supply (State)</label>
                            <input
                                placeholder="e.g. Telangana"
                                value={placeOfSupply}
                                onChange={(e) => setPlaceOfSupply(e.target.value)}
                            />
                        </div>
                        <div className="submodal-form-group">
                            <label>State Code</label>
                            <input
                                placeholder="e.g. 36"
                                value={placeOfSupplyCode}
                                onChange={(e) => setPlaceOfSupplyCode(e.target.value)}
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
                                    <th style={{ width: 90 }}>HSN/SAC</th>
                                    <th style={{ width: 80 }}>Unit</th>
                                    <th style={{ width: 70 }}>Qty</th>
                                    <th style={{ width: 100 }}>Rate</th>
                                    <th style={{ width: 36 }} />
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
                                                placeholder="HSN/SAC"
                                                value={it.hsnSacCode}
                                                onChange={(e) => updateItem(idx, "hsnSacCode", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                placeholder="Unit (NOS)"
                                                value={it.unit}
                                                onChange={(e) => updateItem(idx, "unit", e.target.value)}
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

                    <div style={{ marginTop: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Terms & Conditions</label>
                        <textarea
                            rows={3}
                            placeholder="Numbered terms and conditions..."
                            value={termsAndConditions}
                            onChange={(e) => setTermsAndConditions(e.target.value)}
                            style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                        />
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

const STATE_GST_CODES: Record<string, string> = {
    "telangana": "36",
    "andhra pradesh": "37",
    "maharashtra": "27",
    "karnataka": "29",
    "tamil nadu": "33",
    "delhi": "07",
    "gujarat": "24",
    "uttar pradesh": "09",
    "haryana": "06",
    "west bengal": "19",
    "kerala": "32",
    "rajasthan": "08",
    "madhya pradesh": "23",
    "bihar": "10",
    "punjab": "03",
    "odisha": "21",
    "assam": "18",
    "jharkhand": "20",
    "chhattisgarh": "22",
    "uttarakhand": "05",
    "goa": "30",
    "himachal pradesh": "02",
    "jammu and kashmir": "01",
    "chandigarh": "04",
    "puducherry": "34",
};

type CreateLineItem = {
    description: string;
    hsnSacCode: string;
    unit: string;
    quantity: number;
    rate: number;
    taxRate: number;
};

function CreateInvoiceView({
    currency,
    orgName,
    organizationDetails,
    onClose,
    onCreated,
}: {
    currency: string;
    orgName: string;
    organizationDetails: InvoiceOrganizationDetails;
    onClose: () => void;
    onCreated: () => void;
}) {
    const router = useRouter();
    const [boqs, setBoqs] = useState<BoqOption[]>([]);
    const [projectsMap, setProjectsMap] = useState<Map<string, string>>(new Map());
    const [selectedBoq, setSelectedBoq] = useState<BoqOption | null>(null);
    const [boqLoading, setBoqLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [boqSearch, setBoqSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Form states - Identification & Dates
    const todayIso = new Date().toISOString().slice(0, 10);
    const defaultDueIso = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

    const [isManualNumber, setIsManualNumber] = useState(false);
    const [manualNumber, setManualNumber] = useState("");
    const [reference, setReference] = useState("");
    const [ewayBillNumber, setEwayBillNumber] = useState("");
    const [issueDate, setIssueDate] = useState(todayIso);
    const [dueDate, setDueDate] = useState(defaultDueIso);

    // Place of Supply
    const defaultState = organizationDetails.billingAddress?.state || "Telangana";
    const defaultStateCode = STATE_GST_CODES[defaultState.toLowerCase().trim()] || "36";
    const [placeOfSupply, setPlaceOfSupply] = useState(defaultState);
    const [placeOfSupplyCode, setPlaceOfSupplyCode] = useState(defaultStateCode);

    // Buyer / Bill To details
    const [clientName, setClientName] = useState("");
    const [projectName, setProjectName] = useState("");
    const [milestone, setMilestone] = useState("Execution Milestone");
    const [billingAddress, setBillingAddress] = useState({
        line1: "",
        line2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
    });
    const [buyerGstin, setBuyerGstin] = useState("");

    // Ship To details
    const [sameAsBilling, setSameAsBilling] = useState(true);
    const [shipToName, setShipToName] = useState("");
    const [shipToAddress, setShipToAddress] = useState({
        line1: "",
        line2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        gstin: "",
    });

    // Items
    const [items, setItems] = useState<CreateLineItem[]>([
        { description: "", hsnSacCode: "", unit: "NOS", quantity: 1, rate: 0, taxRate: 18 },
    ]);

    // Notes and Terms
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [termsAndConditions, setTermsAndConditions] = useState(
        "1. Payment is due within 15 days of invoice issue date.\n2. Interest @ 18% p.a. will be charged on overdue payments.\n3. Goods once sold will not be taken back or exchanged."
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Auto-update placeOfSupplyCode when placeOfSupply changes if matched in state map
    function handlePlaceOfSupplyChange(stateName: string) {
        setPlaceOfSupply(stateName);
        const code = STATE_GST_CODES[stateName.toLowerCase().trim()];
        if (code) {
            setPlaceOfSupplyCode(code);
        }
    }

    // Auto-fill state code from buyer GSTIN prefix if place of supply code is still default/empty
    function handleBuyerGstinChange(gstin: string) {
        setBuyerGstin(gstin);
        const prefix = gstin.trim().slice(0, 2);
        if (/^\d{2}$/.test(prefix)) {
            // Find state matching this code
            const foundState = Object.entries(STATE_GST_CODES).find(([, code]) => code === prefix);
            if (foundState) {
                const capitalized = foundState[0].charAt(0).toUpperCase() + foundState[0].slice(1);
                setPlaceOfSupply(capitalized);
                setPlaceOfSupplyCode(prefix);
            }
        }
    }

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
            setItems([{ description: "", hsnSacCode: "", unit: "NOS", quantity: 1, rate: 0, taxRate: 18 }]);
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
                                unit?: string;
                                hsnCode?: string;
                            }>;
                        }>;
                    }>;
                }>(detailPayload);

                const extracted: CreateLineItem[] = [];
                detail?.rooms?.forEach((r) => {
                    r.categories?.forEach((c) => {
                        c.items?.forEach((it) => {
                            extracted.push({
                                description: `${r.name ? `${r.name} - ` : ""}${it.name || it.description || "Work Item"}`,
                                hsnSacCode: it.hsnCode || "",
                                unit: it.unit || "NOS",
                                quantity: Number(it.quantity) > 0 ? Number(it.quantity) : 1,
                                rate: Number(it.rate) >= 0 ? Number(it.rate) : 0,
                                taxRate: 18,
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
                hsnSacCode: "",
                unit: "LOT",
                quantity: 1,
                rate: boq.grandTotal || boq.subtotal || 0,
                taxRate: 18,
            },
        ]);
    }

    // Row handlers
    function updateItem<K extends keyof CreateLineItem>(index: number, field: K, value: CreateLineItem[K]) {
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
        setItems((prev) => [...prev, { description: "", hsnSacCode: "", unit: "NOS", quantity: 1, rate: 0, taxRate: 18 }]);
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
                .map((it, idx) => {
                    const qty = Math.max(1, Number(it.quantity) || 1);
                    const rate = Math.max(0, Number(it.rate) || 0);
                    const tRate = Number(it.taxRate ?? 18);
                    const taxable = Math.round(qty * rate * 100) / 100;
                    const tax = Math.round((taxable * tRate) / 100 * 100) / 100;
                    return {
                        description: it.description.trim() || `Execution Item ${idx + 1}`,
                        hsnSacCode: it.hsnSacCode.trim() || undefined,
                        unit: it.unit.trim() || "NOS",
                        quantity: qty,
                        rate,
                        taxRate: tRate,
                        taxableAmount: taxable,
                        taxAmount: tax,
                    };
                })
                .filter((it) => it.description.length > 0);

            if (cleanItems.length === 0) {
                cleanItems.push({
                    description: "Execution as agreed",
                    hsnSacCode: undefined,
                    unit: "NOS",
                    quantity: 1,
                    rate: 0,
                    taxRate: 18,
                    taxableAmount: 0,
                    taxAmount: 0,
                });
            }

            // Ship To logic: if sameAsBilling is true, ship to matches billing address
            const resolvedShipToName = !sameAsBilling && shipToName.trim()
                ? shipToName.trim()
                : sameAsBilling
                    ? finalClient
                    : undefined;

            const resolvedShipToAddress = !sameAsBilling && shipToAddress.line1.trim()
                ? {
                    line1: shipToAddress.line1.trim(),
                    line2: shipToAddress.line2.trim() || undefined,
                    city: shipToAddress.city.trim() || undefined,
                    state: shipToAddress.state.trim() || undefined,
                    pincode: shipToAddress.pincode.trim() || undefined,
                    country: shipToAddress.country.trim() || "India",
                    gstin: shipToAddress.gstin.trim() || undefined,
                }
                : sameAsBilling && billingAddress.line1.trim()
                    ? {
                        line1: billingAddress.line1.trim(),
                        line2: billingAddress.line2.trim() || undefined,
                        city: billingAddress.city.trim() || undefined,
                        state: billingAddress.state.trim() || undefined,
                        pincode: billingAddress.pincode.trim() || undefined,
                        country: billingAddress.country.trim() || "India",
                        gstin: buyerGstin.trim() || undefined,
                    }
                    : undefined;

            const response = await fetch("/api/v1/invoices", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "invoice",
                    clientName: finalClient,
                    projectName: finalProject,
                    projectId: selectedBoq?.projectId || undefined,
                    invoiceNumber: isManualNumber && manualNumber.trim() ? manualNumber.trim() : undefined,
                    reference: reference.trim() || undefined,
                    ewayBillNumber: ewayBillNumber.trim() || undefined,
                    issueDate: finalIssue,
                    dueDate: finalDue,
                    milestone: finalMilestone,
                    placeOfSupply: placeOfSupply.trim() || undefined,
                    placeOfSupplyCode: placeOfSupplyCode.trim() || undefined,
                    buyerGstin: buyerGstin.trim() || undefined,
                    billingAddress: billingAddress.line1.trim()
                        ? {
                            line1: billingAddress.line1.trim(),
                            line2: billingAddress.line2.trim() || undefined,
                            city: billingAddress.city.trim() || undefined,
                            state: billingAddress.state.trim() || undefined,
                            pincode: billingAddress.pincode.trim() || undefined,
                            country: billingAddress.country.trim() || "India",
                        }
                        : undefined,
                    shipToName: resolvedShipToName,
                    shipToAddress: resolvedShipToAddress,
                    taxRate: 18,
                    additionalNotes: additionalNotes.trim() || undefined,
                    termsAndConditions: termsAndConditions.trim() || undefined,
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

    return (
        <div className="create-invoice-container">
            {/* Header Bar */}
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

            {/* Two-Column Layout */}
            <div className="create-invoice-layout">
                {/* Left Column: Form Sections */}
                <div className="create-invoice-col-form">
                    {/* Card 1: INVOICE DETAILS */}
                    <div className="create-invoice-section-card">
                        <h4 className="create-invoice-section-title">INVOICE DETAILS</h4>

                        <div className="create-invoice-inner-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {/* Auto-Loaded Branding and Bank Details from Settings Badge */}
                            <div className="settings-loaded-badge">
                                <div>
                                    <div className="settings-loaded-badge-title">
                                        <Check size={14} /> Organization Branding &amp; Bank Details Auto-Linked
                                    </div>
                                    <div className="settings-loaded-badge-meta">
                                        <strong>{organizationDetails.tradeName || organizationDetails.legalName || orgName}</strong>
                                        {organizationDetails.gstin ? ` • GSTIN: ${organizationDetails.gstin}` : ""}
                                        {organizationDetails.bankDetails?.bankName ? ` • Bank: ${organizationDetails.bankDetails.bankName}` : ""}
                                        {organizationDetails.logoUrl ? " • Logo attached" : ""}
                                        {organizationDetails.signature ? " • Signature attached" : ""}
                                    </div>
                                </div>
                                <span style={{ fontSize: 11, color: "#166534", background: "#DCFCE7", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                                    From Settings
                                </span>
                            </div>

                            {/* Subsection A: Invoice Identification & Dates */}
                            <div className="form-subsection">
                                <h5 className="form-subsection-title">Invoice Information &amp; Dates</h5>

                                <div className="create-field-group">
                                    <label className="create-field-label">
                                        Select BOQ <span className="req-asterisk">*</span>
                                    </label>
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
                                                <ContextualAddAction
                                                    entity="BOQ"
                                                    onClick={() => router.push("/boqs?create=true&returnTo=%2Finvoices")}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Invoice Number with Custom Number toggle */}
                                <div className="form-row-2">
                                    <div className="create-field-group">
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <label className="create-field-label">Invoice Number</label>
                                            <button
                                                type="button"
                                                onClick={() => setIsManualNumber(!isManualNumber)}
                                                style={{ background: "none", border: "none", color: "#2563EB", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 10 }}
                                            >
                                                {isManualNumber ? "Use Auto Number" : "Custom Number"}
                                            </button>
                                        </div>
                                        {isManualNumber ? (
                                            <input
                                                className="create-text-input"
                                                placeholder="e.g. INV-2026-001"
                                                value={manualNumber}
                                                onChange={(e) => setManualNumber(e.target.value)}
                                            />
                                        ) : (
                                            <input
                                                className="create-text-input"
                                                readOnly
                                                value="INV-DRAFT (Generated on save)"
                                            />
                                        )}
                                    </div>
                                    <div className="create-field-group">
                                        <label className="create-field-label">Reference / PO Number</label>
                                        <input
                                            className="create-text-input"
                                            placeholder="e.g. PO-2026-881"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Issue Date & Due Date */}
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

                                {/* E-Way Bill Number */}
                                <div className="create-field-group">
                                    <label className="create-field-label">E-Way Bill Number (Optional)</label>
                                    <input
                                        className="create-text-input"
                                        placeholder="e.g. 2412 8901 2345"
                                        value={ewayBillNumber}
                                        onChange={(e) => setEwayBillNumber(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Subsection B: Buyer / Bill To Information */}
                            <div className="form-subsection">
                                <h5 className="form-subsection-title">Buyer / Bill To Information</h5>

                                <div className="form-row-2">
                                    <div className="create-field-group">
                                        <label className="create-field-label">
                                            Client Name <span className="req-asterisk">*</span>
                                        </label>
                                        <input
                                            required
                                            className="create-text-input"
                                            placeholder="Client or company name"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                        />
                                    </div>
                                    <div className="create-field-group">
                                        <label className="create-field-label">Buyer GSTIN</label>
                                        <input
                                            className="create-text-input"
                                            placeholder="e.g. 36AAACB1234F1Z5"
                                            value={buyerGstin}
                                            onChange={(e) => handleBuyerGstinChange(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="create-field-group">
                                    <label className="create-field-label">Billing Address Line 1</label>
                                    <input
                                        className="create-text-input"
                                        placeholder="Street address, building, suite"
                                        value={billingAddress.line1}
                                        onChange={(e) => setBillingAddress({ ...billingAddress, line1: e.target.value })}
                                    />
                                </div>

                                <div className="create-field-group">
                                    <label className="create-field-label">Billing Address Line 2</label>
                                    <input
                                        className="create-text-input"
                                        placeholder="Area, landmark (optional)"
                                        value={billingAddress.line2}
                                        onChange={(e) => setBillingAddress({ ...billingAddress, line2: e.target.value })}
                                    />
                                </div>

                                <div className="form-row-3">
                                    <div className="create-field-group">
                                        <label className="create-field-label">City</label>
                                        <input
                                            className="create-text-input"
                                            placeholder="City"
                                            value={billingAddress.city}
                                            onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="create-field-group">
                                        <label className="create-field-label">State</label>
                                        <input
                                            className="create-text-input"
                                            placeholder="State"
                                            value={billingAddress.state}
                                            onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                                        />
                                    </div>
                                    <div className="create-field-group">
                                        <label className="create-field-label">PIN Code</label>
                                        <input
                                            className="create-text-input"
                                            placeholder="PIN Code"
                                            value={billingAddress.pincode}
                                            onChange={(e) => setBillingAddress({ ...billingAddress, pincode: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Subsection C: Ship To Details */}
                            <div className="form-subsection">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h5 className="form-subsection-title">Shipping Details (Ship To)</h5>
                                    <label className="create-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={sameAsBilling}
                                            onChange={(e) => setSameAsBilling(e.target.checked)}
                                        />
                                        Same as Billing Address
                                    </label>
                                </div>

                                {!sameAsBilling && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}>
                                        <div className="form-row-2">
                                            <div className="create-field-group">
                                                <label className="create-field-label">Recipient / Company Name</label>
                                                <input
                                                    className="create-text-input"
                                                    placeholder="Recipient name"
                                                    value={shipToName}
                                                    onChange={(e) => setShipToName(e.target.value)}
                                                />
                                            </div>
                                            <div className="create-field-group">
                                                <label className="create-field-label">Shipping GSTIN</label>
                                                <input
                                                    className="create-text-input"
                                                    placeholder="GSTIN if applicable"
                                                    value={shipToAddress.gstin}
                                                    onChange={(e) => setShipToAddress({ ...shipToAddress, gstin: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="create-field-group">
                                            <label className="create-field-label">Ship To Address Line 1</label>
                                            <input
                                                className="create-text-input"
                                                placeholder="Street address"
                                                value={shipToAddress.line1}
                                                onChange={(e) => setShipToAddress({ ...shipToAddress, line1: e.target.value })}
                                            />
                                        </div>

                                        <div className="form-row-3">
                                            <div className="create-field-group">
                                                <label className="create-field-label">City</label>
                                                <input
                                                    className="create-text-input"
                                                    placeholder="City"
                                                    value={shipToAddress.city}
                                                    onChange={(e) => setShipToAddress({ ...shipToAddress, city: e.target.value })}
                                                />
                                            </div>
                                            <div className="create-field-group">
                                                <label className="create-field-label">State</label>
                                                <input
                                                    className="create-text-input"
                                                    placeholder="State"
                                                    value={shipToAddress.state}
                                                    onChange={(e) => setShipToAddress({ ...shipToAddress, state: e.target.value })}
                                                />
                                            </div>
                                            <div className="create-field-group">
                                                <label className="create-field-label">PIN Code</label>
                                                <input
                                                    className="create-text-input"
                                                    placeholder="PIN Code"
                                                    value={shipToAddress.pincode}
                                                    onChange={(e) => setShipToAddress({ ...shipToAddress, pincode: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Subsection D: Place of Supply */}
                            <div className="form-subsection">
                                <h5 className="form-subsection-title">Place of Supply</h5>
                                <div className="form-row-2">
                                    <div className="create-field-group">
                                        <label className="create-field-label">Place of Supply State</label>
                                        <input
                                            className="create-text-input"
                                            placeholder="e.g. Telangana"
                                            value={placeOfSupply}
                                            onChange={(e) => handlePlaceOfSupplyChange(e.target.value)}
                                        />
                                    </div>
                                    <div className="create-field-group">
                                        <label className="create-field-label">State Code (GST)</label>
                                        <input
                                            className="create-text-input"
                                            placeholder="e.g. 36"
                                            value={placeOfSupplyCode}
                                            onChange={(e) => setPlaceOfSupplyCode(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <span style={{ fontSize: 11, color: "#64748B" }}>
                                    Will display as: <strong>{placeOfSupply || "State"}{placeOfSupplyCode ? ` (${placeOfSupplyCode})` : ""}</strong> on invoice.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: ITEMS */}
                    <div className="create-invoice-section-card">
                        <h4 className="create-invoice-section-title">ITEMS</h4>

                        <div className="create-items-card-inner">
                            <div className="create-items-table-head-extended">
                                <div className="create-items-th" style={{ width: 30, textAlign: "center", flexShrink: 0 }}>#</div>
                                <div className="create-items-th" style={{ flex: 1, paddingLeft: 8 }}>DESCRIPTION</div>
                                <div className="create-items-th th-hsn">HSN/SAC</div>
                                <div className="create-items-th th-unit">UNIT</div>
                                <div className="create-items-th" style={{ width: 65, textAlign: "center", flexShrink: 0 }}>QTY</div>
                                <div className="create-items-th" style={{ width: 85, textAlign: "right", flexShrink: 0 }}>RATE</div>
                                <div className="create-items-th th-tax">TAX %</div>
                                <div className="create-items-th" style={{ width: 90, textAlign: "right", flexShrink: 0 }}>AMOUNT</div>
                                <div className="create-items-th" style={{ width: 36, flexShrink: 0 }} />
                            </div>

                            <div className="create-items-rows-container">
                                {items.map((it, idx) => {
                                    const taxable = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
                                    const tax = Math.round((taxable * (it.taxRate ?? 18)) / 100 * 100) / 100;
                                    const rowAmount = taxable + tax;
                                    return (
                                        <div className="create-item-row-item" key={idx}>
                                            <div className="create-items-table-row" style={{ alignItems: "center" }}>
                                                <div style={{ width: 30, textAlign: "center", fontSize: 12, color: "#64748B", flexShrink: 0 }}>
                                                    {idx + 1}
                                                </div>
                                                <div className="create-input-cell cell-desc" style={{ flex: 1 }}>
                                                    <input
                                                        className="create-item-input"
                                                        placeholder="Enter Description"
                                                        value={it.description}
                                                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                                                    />
                                                </div>
                                                <div className="create-input-cell cell-hsn">
                                                    <input
                                                        className="create-item-input"
                                                        style={{ textAlign: "center" }}
                                                        placeholder="HSN/SAC"
                                                        value={it.hsnSacCode}
                                                        onChange={(e) => updateItem(idx, "hsnSacCode", e.target.value)}
                                                    />
                                                </div>
                                                <div className="create-input-cell cell-unit">
                                                    <select
                                                        className="create-item-input"
                                                        value={it.unit || "NOS"}
                                                        onChange={(e) => updateItem(idx, "unit", e.target.value)}
                                                        style={{ padding: "0 4px", fontSize: 11 }}
                                                    >
                                                        <option value="NOS">NOS</option>
                                                        <option value="SQFT">SQFT</option>
                                                        <option value="KG">KG</option>
                                                        <option value="HOURS">HOURS</option>
                                                        <option value="SET">SET</option>
                                                        <option value="LOT">LOT</option>
                                                        <option value="RFT">RFT</option>
                                                        <option value="CUM">CUM</option>
                                                        <option value="OTHERS">OTHERS</option>
                                                    </select>
                                                </div>
                                                <div className="create-input-cell" style={{ width: 65, flexShrink: 0 }}>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        className="create-item-input"
                                                        style={{ textAlign: "center" }}
                                                        placeholder="1"
                                                        value={it.quantity === 0 ? "" : it.quantity}
                                                        onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="create-input-cell" style={{ width: 85, flexShrink: 0 }}>
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
                                                <div className="create-input-cell cell-tax">
                                                    <select
                                                        className="create-item-input"
                                                        value={it.taxRate ?? 18}
                                                        onChange={(e) => updateItem(idx, "taxRate", Number(e.target.value))}
                                                        style={{ padding: "0 4px", fontSize: 11, textAlign: "center" }}
                                                    >
                                                        <option value={0}>0%</option>
                                                        <option value={5}>5%</option>
                                                        <option value={12}>12%</option>
                                                        <option value={18}>18%</option>
                                                        <option value={28}>28%</option>
                                                    </select>
                                                </div>
                                                <div className="create-input-cell" style={{ width: 90, textAlign: "right", fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
                                                    ₹{formatNumber(rowAmount)}
                                                </div>
                                                <div className="create-input-cell" style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                                                    <button
                                                        type="button"
                                                        className="btn-create-item-delete"
                                                        disabled={items.length <= 1}
                                                        onClick={() => removeItem(idx)}
                                                        aria-label="Remove item"
                                                    >
                                                        <Trash2 size={16} />
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
                                <Plus size={16} /> Add Item
                            </button>
                        </div>
                    </div>

                    {/* Card 3: Additional Notes */}
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

                    {/* Card 4: Terms & Conditions */}
                    <div className="create-invoice-section-card">
                        <h4 className="create-invoice-section-title">Terms &amp; Conditions</h4>
                        <div className="create-invoice-inner-card">
                            <textarea
                                className="create-notes-textarea"
                                placeholder="Enter numbered terms and conditions (one per line)..."
                                value={termsAndConditions}
                                onChange={(e) => setTermsAndConditions(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Dynamic Preview Matching reference_2 invoice.pdf */}
                <div className="create-invoice-col-preview">
                    <div className="create-preview-section-card">
                        <div className="create-preview-header-bar">
                            <h4 className="create-preview-title">INVOICE PREVIEW</h4>
                            <button type="button" className="btn-create-change-template" style={{ display: "none" }}>Change Template</button>
                            <span style={{ display: "none" }}>Total Amount</span>
                            <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
                                Live Preview
                            </span>
                        </div>

                        <ReferenceInvoicePaper
                            invoiceNumber={isManualNumber && manualNumber.trim() ? manualNumber.trim() : "INV-DRAFT"}
                            status="draft"
                            issueDate={issueDate}
                            dueDate={dueDate}
                            reference={reference}
                            ewayBillNumber={ewayBillNumber}
                            placeOfSupply={placeOfSupply}
                            placeOfSupplyCode={placeOfSupplyCode}
                            clientName={clientName || "Client Name"}
                            projectName={projectName}
                            billingAddress={billingAddress.line1.trim() ? billingAddress : null}
                            buyerGstin={buyerGstin}
                            shipToName={!sameAsBilling ? shipToName : clientName}
                            shipToAddress={!sameAsBilling ? (shipToAddress.line1.trim() ? shipToAddress : null) : (billingAddress.line1.trim() ? { ...billingAddress, gstin: buyerGstin } : null)}
                            items={items.map((it) => {
                                const qty = Number(it.quantity) || 1;
                                const rate = Number(it.rate) || 0;
                                const taxable = Math.round(qty * rate * 100) / 100;
                                const tax = Math.round((taxable * (it.taxRate ?? 18)) / 100 * 100) / 100;
                                return {
                                    description: it.description,
                                    hsnSacCode: it.hsnSacCode,
                                    unit: it.unit,
                                    quantity: qty,
                                    rate,
                                    taxRate: it.taxRate,
                                    taxableAmount: taxable,
                                    taxAmount: tax,
                                    amount: Math.round((taxable + tax) * 100) / 100,
                                };
                            })}
                            taxRate={18}
                            currency={currency}
                            additionalNotes={additionalNotes}
                            termsAndConditions={termsAndConditions}
                            orgName={orgName}
                            organizationDetails={organizationDetails}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
