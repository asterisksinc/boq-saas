"use client";

import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Plus,
    Search,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";

type Invoice = {
    id: string;
    invoiceNumber: string;
    type: string;
    projectName: string | null;
    clientName: string;
    milestone: string | null;
    status: string;
    totalAmount: number;
    issueDate: string;
    dueDate: string;
    currency: string;
    outstanding: number;
    items?: Array<{ description: string; quantity: number; rate: number; amount: number }>;
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

import DashboardRail from "@/components/DashboardRail";

async function apiJson<T>(url: string, init?: RequestInit) {
    const response = await fetch(url, {
        ...init,
        credentials: "include",
        cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getApiErrorMessage(payload));
    return parseApiResponse<T>(payload);
}

export default function InvoicesPage() {
    const [page, setPage] = useState<Page | null>(null);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<Invoice | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    async function load(nextPage = 1, query = search) {
        setLoading(true);
        setError("");
        try {
            const [listResponse, summaryResponse] = await Promise.all([
                fetch(
                    `/api/v1/invoices?page=${nextPage}&pageSize=10${query ? `&search=${encodeURIComponent(query)}` : ""}`,
                    { credentials: "include", cache: "no-store" },
                ),
                fetch("/api/v1/invoices/summary", {
                    credentials: "include",
                    cache: "no-store",
                }),
            ]);
            const listPayload = await listResponse.json();
            const summaryPayload = await summaryResponse.json();
            if (!listResponse.ok) throw new Error(getApiErrorMessage(listPayload));
            if (!summaryResponse.ok)
                throw new Error(getApiErrorMessage(summaryPayload));
            setPage(parseApiResponse<Page>(listPayload));
            setSummary(parseApiResponse<Summary>(summaryPayload));
        } catch (loadError) {
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        void load();
    }, []);
    const currency = summary?.currency || page?.items[0]?.currency || "INR";
    const money = (value: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(value);
    const date = (value: string | null) =>
        value
            ? new Date(value).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
            : "-";

    return (
        <main className="fig-dashboard invoices-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail />
            <div className="fig-dashboard-main">
                <header className="fig-dashboard-header">
                    <h1>Invoices</h1>
                    <div className="fig-dashboard-header-actions">
                        <label className="fig-dashboard-search">
                            <Search size={17} />
                            <input
                                value={search}
                                placeholder="Search..."
                                aria-label="Search invoices"
                                onChange={(event) => setSearch(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") void load(1);
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
                <section className="invoice-content">
                    <div className="invoice-title-row">
                        <div>
                            <h2>Invoices</h2>
                            <p>
                                {loading
                                    ? "Loading invoices..."
                                    : `${page?.total ?? 0} invoices${summary?.overdueCount ? ` | ${summary.overdueCount} overdue` : ""}`}
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
                                <Plus size={17} /> New Invoice
                            </button>
                        </div>
                    </div>
                    {error ? (
                        <div className="invoice-error" role="alert">
                            <strong>Couldn&apos;t load invoices</strong>
                            <span>{error}</span>
                            <button type="button" onClick={() => void load()}>
                                Try again
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="invoice-loading" />
                    ) : page && page.total === 0 ? (
                        <InvoiceEmpty onCreate={() => setShowCreate(true)} />
                    ) : page ? (
                        <>
                            <InvoiceSummary summary={summary} money={money} />
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
                                        {page.items.map((invoice) => (
                                            <tr key={invoice.id} onClick={() => setSelected(invoice)}>
                                                <td>{invoice.invoiceNumber}</td>
                                                <td>
                                                    <span className="invoice-type">
                                                        {invoice.type
                                                            .replace("pro_forma", "PRO-FORMA")
                                                            .toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="invoice-project">
                                                    {invoice.projectName || "-"}
                                                </td>
                                                <td>{invoice.clientName}</td>
                                                <td>{invoice.milestone || "-"}</td>
                                                <td>
                                                    <span className={`invoice-status ${invoice.status}`}>
                                                        {invoice.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="invoice-amount">
                                                    {money(invoice.totalAmount)}
                                                </td>
                                                <td>{date(invoice.issueDate)}</td>
                                                <td>{date(invoice.dueDate)}</td>
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="invoice-pagination">
                                <span>{page.total} invoices</span>
                                <div>
                                    <button
                                        disabled={page.page === 1}
                                        onClick={() => void load(page.page - 1)}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <strong>{page.page}</strong>
                                    <button
                                        disabled={!page.hasMore}
                                        onClick={() => void load(page.page + 1)}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : null}
                </section>
                {selected && (
                    <InvoicePreview
                        invoice={selected}
                        money={money}
                        onClose={() => setSelected(null)}
                    />
                )}
                {showCreate && (
                    <CreateInvoice
                        onClose={() => setShowCreate(false)}
                        onCreated={() => {
                            setShowCreate(false);
                            void load();
                        }}
                    />
                )}
            </div>
        </main>
    );
}

function InvoiceSummary({
    summary,
    money,
}: {
    summary: Summary | null;
    money: (value: number) => string;
}) {
    if (!summary) return null;
    return (
        <div className="invoice-summary">
            <div>
                <span>Total Invoiced</span>
                <strong>{money(summary.totalInvoiced)}</strong>
                <small>This quarter</small>
            </div>
            <div>
                <span>Collected</span>
                <strong>{money(summary.collected)}</strong>
                <small>
                    {summary.totalInvoiced
                        ? Math.round((summary.collected / summary.totalInvoiced) * 100)
                        : 0}
                    % collected
                </small>
            </div>
            <div>
                <span>Outstanding</span>
                <strong>{money(summary.outstanding)}</strong>
                <small>{summary.totalInvoices} invoices</small>
            </div>
            <div>
                <span>Overdue</span>
                <strong className="overdue-value">{money(summary.overdue)}</strong>
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
function InvoicePreview({
    invoice,
    money,
    onClose,
}: {
    invoice: Invoice;
    money: (value: number) => string;
    onClose: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const [detail, setDetail] = useState<Invoice>(invoice);
    useEffect(() => {
        void apiJson<Invoice>(`/api/v1/invoices/${invoice.id}`)
            .then((result) => setDetail(result))
            .catch(() => undefined);
    }, [invoice.id]);
    async function download() {
        setBusy(true);
        const response = await fetch(`/api/v1/invoices/${invoice.id}/pdf`, {
            credentials: "include",
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${invoice.invoiceNumber}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        setBusy(false);
    }
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
                    <X />
                </button>
                <div className="preview-topline">
                    <span>{invoice.invoiceNumber} - Invoice Preview</span>
                    <b>{detail.status.toUpperCase()}</b>
                </div>
                <div className="preview-paper">
                    <div className="preview-brand">
                        <div>
                            <h2>{detail.clientName}</h2>
                            <p>{detail.projectName || "Invoice"}</p>
                        </div>
                        <strong>{detail.invoiceNumber}</strong>
                    </div>
                    <div className="preview-details">
                        <span>
                            BILLED TO<strong>{detail.clientName}</strong>
                        </span>
                        <span>
                            Issue Date
                            <strong>
                                {detail.issueDate
                                    ? new Date(detail.issueDate).toLocaleDateString()
                                    : "-"}
                            </strong>
                        </span>
                        <span>
                            Due Date
                            <strong>
                                {detail.dueDate
                                    ? new Date(detail.dueDate).toLocaleDateString()
                                    : "-"}
                            </strong>
                        </span>
                    </div>
                    {detail.items?.length ? (
                        <div className="invoice-preview-items">
                            {detail.items.map((item) => (
                                <div key={`${item.description}-${item.quantity}`}>
                                    <span>{item.description}</span>
                                    <strong>{money(item.amount)}</strong>
                                </div>
                            ))}
                        </div>
                    ) : null}
                    <div className="preview-total">
                        <span>Total Due</span>
                        <strong>{money(detail.totalAmount)}</strong>
                    </div>
                </div>
                <footer>
                    <button type="button" className="invoice-ghost" onClick={onClose}>
                        Close
                    </button>
                    <button
                        type="button"
                        className="invoice-ghost"
                        onClick={() => void download()}
                        disabled={busy}
                    >
                        <Download size={16} /> {busy ? "Preparing..." : "Download PDF"}
                    </button>
                </footer>
            </section>
        </div>
    );
}
function CreateInvoice({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: () => void;
}) {
    const [form, setForm] = useState({
        clientName: "",
        projectName: "",
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: "",
        milestone: "",
        description: "",
        rate: "",
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            const response = await fetch("/api/v1/invoices", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "invoice",
                    clientName: form.clientName,
                    billingAddress: {
                        line1: "Not provided",
                        city: "Not provided",
                        state: "Not provided",
                        pincode: "000000",
                    },
                    projectName: form.projectName,
                    issueDate: form.issueDate,
                    dueDate: form.dueDate,
                    milestone: form.milestone,
                    taxRate: 18,
                    items: [
                        {
                            description: form.description,
                            quantity: 1,
                            rate: Number(form.rate),
                        },
                    ],
                    status: "draft",
                }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(getApiErrorMessage(payload));
            onCreated();
        } catch (submitError) {
            setError(getApiErrorMessage(submitError));
        } finally {
            setSaving(false);
        }
    }
    const update = (key: keyof typeof form, value: string) =>
        setForm((current) => ({ ...current, [key]: value }));
    return (
        <div className="invoice-modal-backdrop" onClick={onClose}>
            <form
                className="invoice-create"
                onSubmit={submit}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="invoice-create-header">
                    <div>
                        <span>NEW INVOICE</span>
                        <h2>Create New Invoice</h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close">
                        <X />
                    </button>
                </div>
                {error && <p className="invoice-form-error">{error}</p>}
                <label>
                    Client name
                    <input
                        required
                        value={form.clientName}
                        onChange={(event) => update("clientName", event.target.value)}
                        placeholder="e.g. Kohinoor Group"
                    />
                </label>
                <label>
                    Project name
                    <input
                        required
                        value={form.projectName}
                        onChange={(event) => update("projectName", event.target.value)}
                        placeholder="e.g. Kohinoor Office - L4"
                    />
                </label>
                <div className="invoice-form-row">
                    <label>
                        Issue date
                        <input
                            required
                            type="date"
                            value={form.issueDate}
                            onChange={(event) => update("issueDate", event.target.value)}
                        />
                    </label>
                    <label>
                        Due date
                        <input
                            required
                            type="date"
                            value={form.dueDate}
                            onChange={(event) => update("dueDate", event.target.value)}
                        />
                    </label>
                </div>
                <label>
                    Milestone
                    <input
                        required
                        value={form.milestone}
                        onChange={(event) => update("milestone", event.target.value)}
                        placeholder="Design Stage - 30%"
                    />
                </label>
                <label>
                    Item description
                    <input
                        required
                        value={form.description}
                        onChange={(event) => update("description", event.target.value)}
                        placeholder="Interior design services"
                    />
                </label>
                <label>
                    Amount
                    <input
                        required
                        min="0.01"
                        step="0.01"
                        type="number"
                        value={form.rate}
                        onChange={(event) => update("rate", event.target.value)}
                        placeholder="0"
                    />
                </label>
                <footer>
                    <button type="button" className="invoice-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="invoice-primary" disabled={saving}>
                        {saving ? "Creating..." : "Create Invoice"}
                    </button>
                </footer>
            </form>
        </div>
    );
}
