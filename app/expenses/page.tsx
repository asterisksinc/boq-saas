"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, FileText, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import { EmptyState, Pagination, RowMenu, SelectInput, Toast, downloadBlob } from "@/components/leads/LeadUi";
import { ExpenseDrawer, type ProjectOption } from "@/components/expenses/ExpenseDrawer";
import {
    EXPENSE_CATEGORIES, PAYMENT_METHODS, deleteExpense, exportExpenses, formatINR, label, listExpenses,
    type Expense, type ExpenseFilters,
} from "@/lib/expenses/store";
import "../leads/leads.css";
import "./expenses.css";

const fmtDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

type Filters = Required<Pick<ExpenseFilters, "category" | "paymentMethod" | "projectId">> & { receipt: "" | "attached" | "missing" };
const NO_FILTERS: Filters = { category: "", paymentMethod: "", projectId: "", receipt: "" };

function ExpensesPageInner() {
    const params = useSearchParams();
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [filters, setFilters] = useState<Filters>(NO_FILTERS);
    const [filterOpen, setFilterOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [result, setResult] = useState<ReturnType<typeof listExpenses>>({ items: [], total: 0, totals: { amount: 0, tax: 0 } });
    const [ready, setReady] = useState(false);
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [drawer, setDrawer] = useState<{ open: boolean; expense: Expense | null }>({ open: false, expense: null });
    const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
    const [exporting, setExporting] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (params.get("create") === "true") setDrawer({ open: true, expense: null });
        fetch("/api/v1/projects?pageSize=100", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then((b) => {
                const items = (b?.data?.items ?? []) as Array<{ id: string; name: string; projectType?: string | null; projectCode?: string | null }>;
                setProjects(items.map((p) => ({ value: p.id, label: p.name, projectType: p.projectType ?? null })));
            })
            .catch(() => undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(search.trim()), 250);
        return () => window.clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (!filterOpen) return;
        const close = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setFilterOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [filterOpen]);

    const query: ExpenseFilters = useMemo(() => ({ search: debounced, ...filters }), [debounced, filters]);

    const load = useCallback(() => {
        const next = listExpenses({ ...query, page, pageSize });
        if (!next.items.length && page > 1 && next.total) { setPage(1); return; }
        setResult(next);
        setReady(true);
    }, [query, page, pageSize]);

    useEffect(() => { load(); }, [load]);

    const notify = (message: string, tone: "success" | "error" = "success") => setToast({ message, tone });
    const activeFilters = Object.values(filters).filter(Boolean).length;
    const setFilter = (key: keyof Filters, value: string) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };

    const remove = (e: Expense) => {
        if (!window.confirm(`Delete ${e.code} (${formatINR(e.totalAmount)})? This can't be undone.`)) return;
        deleteExpense(e.id);
        notify(`${e.code} deleted.`);
        load();
    };

    const doExport = async () => {
        setExporting(true);
        try {
            downloadBlob(await exportExpenses(query), `expenses-${new Date().toISOString().slice(0, 10)}.xlsx`);
        } catch (err) {
            notify(err instanceof Error ? err.message : "Export failed.", "error");
        } finally {
            setExporting(false);
        }
    };

    const openNew = () => setDrawer({ open: true, expense: null });
    const filtered = Boolean(debounced || activeFilters);

    return (
        <main className="fig-dashboard leads-page expenses-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/expenses" />
            <div className="fig-dashboard-main">
                <DashboardHeader title="Expenses" onNew={openNew} />

                <section className="ld-head">
                    <div>
                        <h2>Expenses</h2>
                        <p>Every expense accounted for and every project in control.</p>
                    </div>
                    <div className="ld-head-actions">
                        <label className="ld-search ex-search">
                            <span className="ld-search-icon"><Search size={16} /></span>
                            <input
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Search expense by amount, project…"
                                aria-label="Search expenses"
                            />
                            {search ? <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={14} /></button> : null}
                        </label>
                        <div className="ld-filter" ref={filterRef}>
                            <button type="button" className={`ld-btn ld-btn--filter${activeFilters ? " is-active" : ""}`} aria-expanded={filterOpen} onClick={() => setFilterOpen((v) => !v)}>
                                <SlidersHorizontal size={18} /> Filter{activeFilters ? ` (${activeFilters})` : ""}
                            </button>
                            {filterOpen ? (
                                <div className="ld-filter-pop" role="dialog" aria-label="Filter expenses">
                                    <label><span>Category</span><SelectInput value={filters.category} onChange={(v) => setFilter("category", v)} placeholder="All categories" options={EXPENSE_CATEGORIES} /></label>
                                    <label><span>Project</span><SelectInput value={filters.projectId} onChange={(v) => setFilter("projectId", v)} placeholder="All projects" options={projects} /></label>
                                    <label><span>Payment method</span><SelectInput value={filters.paymentMethod} onChange={(v) => setFilter("paymentMethod", v)} placeholder="Any method" options={PAYMENT_METHODS} /></label>
                                    <label><span>Receipt</span><SelectInput value={filters.receipt} onChange={(v) => setFilter("receipt", v)} placeholder="Any" options={[{ value: "attached", label: "Attached" }, { value: "missing", label: "Missing" }]} /></label>
                                    <button type="button" className="ld-link" onClick={() => { setFilters(NO_FILTERS); setPage(1); }}>Clear filters</button>
                                </div>
                            ) : null}
                        </div>
                        <button type="button" className="ld-btn" onClick={doExport} disabled={exporting || !result.total}>{exporting ? "Exporting…" : "Export"}</button>
                        <button type="button" className="ld-btn ld-btn--primary" onClick={openNew}><Plus size={18} /> New Expense</button>
                    </div>
                </section>

                <section className="ld-card ld-table-card">
                    <div className="ld-table-scroll">
                        <table className="ld-table ex-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Project</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Receipt</th>
                                    <th>Date</th>
                                    <th aria-label="Actions" />
                                </tr>
                            </thead>
                            <tbody>
                                {!ready ? (
                                    Array.from({ length: 5 }, (_, i) => <tr key={i} className="ld-skeleton-row"><td colSpan={7}><span /></td></tr>)
                                ) : result.items.length ? (
                                    result.items.map((e) => (
                                        <tr key={e.id} onClick={() => setDrawer({ open: true, expense: e })}>
                                            <td className="ld-muted">{e.code}</td>
                                            <td>
                                                <span className="ld-two-line">
                                                    <strong>{e.projectName ?? "Office / Overhead"}</strong>
                                                    <span>{e.projectName ? e.projectType || "Project" : "Not linked to a project"}</span>
                                                </span>
                                            </td>
                                            <td><span className="ex-cat">{label(EXPENSE_CATEGORIES, e.category)}</span></td>
                                            <td>
                                                <span className="ld-two-line">
                                                    <strong>{formatINR(e.totalAmount)}</strong>
                                                    <span>{e.taxAmount ? `incl. ${formatINR(e.taxAmount)} tax` : "No Tax"} · {label(PAYMENT_METHODS, e.paymentMethod)}</span>
                                                </span>
                                            </td>
                                            <td>
                                                {e.receipt
                                                    ? <span className="ex-receipt-state"><FileText size={16} aria-hidden="true" /> Attached</span>
                                                    : <span className="ex-receipt-state is-missing"><AlertCircle size={16} aria-hidden="true" /> Missing</span>}
                                            </td>
                                            <td className="ld-muted">{fmtDate(e.date)}</td>
                                            <td className="ld-col-menu">
                                                <RowMenu
                                                    label={`Actions for ${e.code}`}
                                                    actions={[
                                                        { label: "View Expense", onSelect: () => setDrawer({ open: true, expense: e }) },
                                                        { label: "Delete Expense", onSelect: () => remove(e), danger: true },
                                                    ]}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState
                                                title="No Expenses found"
                                                text={filtered ? "Try a different search or clear the filters." : "Record your first expense and attach the receipt."}
                                                action={filtered ? undefined : <button type="button" className="tes-btn" onClick={openNew}><Plus size={20} strokeWidth={2.5} /> New Expense</button>}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {result.total > 0 ? (
                        <Pagination page={page} pageSize={pageSize} total={result.total} label="Total Expenses" onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
                    ) : null}
                </section>
            </div>

            <ExpenseDrawer
                open={drawer.open}
                expense={drawer.expense}
                projects={projects}
                onClose={() => setDrawer({ open: false, expense: null })}
                onSaved={(e, created) => {
                    setDrawer({ open: false, expense: null });
                    notify(created ? `${e.code} added · ${formatINR(e.totalAmount)}` : `${e.code} updated.`);
                    load();
                }}
            />
            <Toast message={toast?.message ?? null} tone={toast?.tone} onDone={() => setToast(null)} />
        </main>
    );
}

export default function ExpensesPage() {
    return (
        <Suspense fallback={null}>
            <ExpensesPageInner />
        </Suspense>
    );
}
