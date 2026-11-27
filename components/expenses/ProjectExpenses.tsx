"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, FileText, Plus } from "lucide-react";
import { EmptyState, Pagination, RowMenu, downloadBlob } from "@/components/leads/LeadUi";
import { ExpenseDrawer, type ProjectOption } from "@/components/expenses/ExpenseDrawer";
import {
    EXPENSE_CATEGORIES, PAYMENT_METHODS, deleteExpense, exportExpenses, formatINR, label, listExpenses,
    projectExpenseKpis, projectExpenseTotal, type Expense,
} from "@/lib/expenses/store";

const fmtDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/**
 * Project detail → Expenses tab (Figma "Expenses"). The KPI cards follow the agreed formulas:
 *  Amount Received from Client = total received on the project's invoices
 *  Total Expenses              = sum of all expenses on the project
 *  Project Balance             = amount received - total expenses
 *  Outstanding Balance         = invoiced to the client and still pending
 */
export function ProjectExpenses({
    project, received, outstanding, invoiced, notify,
}: {
    project: ProjectOption;
    received: number;
    outstanding: number;
    invoiced: number;
    notify: (message: string) => void;
}) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [result, setResult] = useState<ReturnType<typeof listExpenses>>({ items: [], total: 0, totals: { amount: 0, tax: 0 } });
    const [spent, setSpent] = useState(0);
    const [drawer, setDrawer] = useState<{ open: boolean; expense: Expense | null }>({ open: false, expense: null });
    const [exporting, setExporting] = useState(false);

    const load = useCallback(() => {
        const next = listExpenses({ projectId: project.value, page, pageSize });
        if (!next.items.length && page > 1 && next.total) { setPage(1); return; }
        setResult(next);
        setSpent(projectExpenseTotal(project.value));
    }, [project.value, page, pageSize]);

    useEffect(() => { load(); }, [load]);

    const kpi = projectExpenseKpis({ received, outstanding, expenses: spent });

    const remove = (e: Expense) => {
        if (!window.confirm(`Delete ${e.code} (${formatINR(e.totalAmount)})? This can't be undone.`)) return;
        deleteExpense(e.id);
        notify(`${e.code} deleted.`);
        load();
    };

    const doExport = async () => {
        setExporting(true);
        try {
            downloadBlob(await exportExpenses({ projectId: project.value }), `expenses-${project.label.replace(/[^\w-]+/g, "-")}.xlsx`);
        } catch (err) {
            notify(err instanceof Error ? err.message : "Export failed.");
        } finally {
            setExporting(false);
        }
    };

    const openNew = () => setDrawer({ open: true, expense: null });
    const count = result.total;

    return (
        <div className="leads-page pe-tab">
            <div className="pe-kpis">
                <article className="pe-kpi">
                    <span className="pe-kpi-label">Amount Received from Client</span>
                    <strong className="pe-kpi-value is-green">{formatINR(kpi.received)}</strong>
                    <span className="pe-kpi-sub">Total received on invoices</span>
                </article>
                <article className="pe-kpi">
                    <span className="pe-kpi-label">Total Expenses</span>
                    <strong className="pe-kpi-value">{formatINR(kpi.expenses)}</strong>
                    <span className="pe-kpi-sub">{count} expense{count === 1 ? "" : "s"} on this project</span>
                </article>
                <article className="pe-kpi">
                    <span className="pe-kpi-label">Project Balance</span>
                    <strong className={`pe-kpi-value ${kpi.balance < 0 ? "is-red" : "is-blue"}`}>
                        {kpi.balance < 0 ? `−${formatINR(-kpi.balance)}` : formatINR(kpi.balance)}
                    </strong>
                    <span className="pe-kpi-sub">{kpi.balance < 0 ? "Expenses exceed amount received" : "Received minus expenses"}</span>
                </article>
                <article className="pe-kpi">
                    <span className="pe-kpi-label">Outstanding Balance</span>
                    <strong className={`pe-kpi-value ${kpi.outstanding > 0 ? "is-amber" : ""}`}>{formatINR(kpi.outstanding)}</strong>
                    <span className="pe-kpi-sub">Pending of {formatINR(invoiced)} invoiced</span>
                </article>
            </div>

            <header className="pe-head">
                <h3>{count} Expense{count === 1 ? "" : "s"} for this project</h3>
                <div className="pe-head-actions">
                    <button type="button" className="ld-btn" onClick={doExport} disabled={exporting || !count}>{exporting ? "Exporting…" : "Export"}</button>
                    <button type="button" className="ld-btn ld-btn--primary" onClick={openNew}><Plus size={18} /> New Expense</button>
                </div>
            </header>

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
                            {result.items.length ? (
                                result.items.map((e) => (
                                    <tr key={e.id} onClick={() => setDrawer({ open: true, expense: e })}>
                                        <td className="ld-muted">{e.code}</td>
                                        <td>
                                            <span className="ld-two-line">
                                                <strong>{e.projectName ?? project.label}</strong>
                                                <span>{e.projectType || project.projectType || "Project"}</span>
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
                                            compact
                                            title="No Expenses found"
                                            text="Record what this project costs, with receipts, to track its balance."
                                            action={<button type="button" className="tes-btn" onClick={openNew}><Plus size={20} strokeWidth={2.5} /> New Expense</button>}
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {count > 0 ? (
                    <Pagination page={page} pageSize={pageSize} total={count} label="Total Expenses" onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
                ) : null}
            </section>

            {/* Portalled: the dashboard main area is its own stacking context, so a fixed drawer inside it sits under the rail. */}
            {drawer.open && typeof document !== "undefined" ? createPortal(<div className="leads-page expenses-page">
            <ExpenseDrawer
                open={drawer.open}
                expense={drawer.expense}
                projects={[project]}
                fixedProject={project}
                onClose={() => setDrawer({ open: false, expense: null })}
                onSaved={(e, created) => {
                    setDrawer({ open: false, expense: null });
                    notify(created ? `${e.code} added · ${formatINR(e.totalAmount)}` : `${e.code} updated.`);
                    load();
                }}
            />
            </div>, document.body) : null}
        </div>
    );
}
