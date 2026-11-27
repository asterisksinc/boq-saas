"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { CalendarDays, CloudUpload, Download, Eye, FileText, Trash2 } from "lucide-react";
import { Drawer, Field, SelectInput } from "@/components/leads/LeadUi";
import { getSettingsOverview } from "@/lib/api/auth";
import {
    EXPENSE_CATEGORIES, EXPENSE_TYPES, PAYMENT_METHODS, RECEIPT_MAX_BYTES, RECEIPT_TYPES, TAX_RATES,
    computeAmounts, createExpense, formatINR, label, updateExpense, validateExpense,
    type Expense, type ExpenseCategory, type ExpenseInput, type ExpenseReceipt, type ExpenseType, type PaymentMethod,
} from "@/lib/expenses/store";

export interface ProjectOption {
    value: string;
    label: string;
    projectType: string | null;
}

type FormState = {
    type: ExpenseType | "";
    date: string;
    baseAmount: string;
    taxApplicable: boolean;
    taxRate: string;
    category: ExpenseCategory | "";
    projectId: string;
    paymentMethod: PaymentMethod | "";
    reference: string;
    receipt: ExpenseReceipt | null;
};

const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const blank = (): FormState => ({
    type: "project", date: today(), baseAmount: "", taxApplicable: false, taxRate: "18", category: "materials",
    projectId: "", paymentMethod: "bank_transfer", reference: "", receipt: null,
});

const fromExpense = (e: Expense): FormState => ({
    type: e.type, date: e.date, baseAmount: String(e.baseAmount), taxApplicable: e.taxApplicable, taxRate: String(e.taxRate ?? 18),
    category: e.category, projectId: e.projectId ?? "", paymentMethod: e.paymentMethod, reference: e.reference ?? "", receipt: e.receipt,
});

const fmtDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtStamp = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("en-GB", { hour12: false })}`;
};

let creatorRequest: Promise<string | null> | null = null;
/** Display name of the signed-in user, fetched once and used as "Created by". */
const currentUserName = () =>
    (creatorRequest ??= getSettingsOverview()
        .then((o) => o?.profile?.displayName?.trim() || o?.profile?.email?.split("@")[0] || null)
        .catch(() => null));

const readFile = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The file couldn't be read."));
    reader.readAsDataURL(file);
});

/**
 * Figma "Expenses - New Expense" / "Expenses - View Expense". Opening an existing expense shows it read-only with
 * "Edit Expense"; editing turns the same form on and saves with "Save Changes".
 */
export function ExpenseDrawer({
    open, expense, projects, onClose, onSaved, fixedProject,
}: {
    open: boolean; expense: Expense | null; projects: ProjectOption[];
    onClose: () => void; onSaved: (expense: Expense, created: boolean) => void;
    /** Opened from a project's Expenses tab: new expenses are linked to this project. */
    fixedProject?: ProjectOption | null;
}) {
    const [form, setForm] = useState<FormState>(blank);
    const [editing, setEditing] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [over, setOver] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        setForm(expense ? fromExpense(expense) : { ...blank(), projectId: fixedProject?.value ?? "" });
        setEditing(!expense);
        setErrors({});
        setFormError(null);
        if (!expense) void currentUserName();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, expense]);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((e) => ({ ...e, [key]: "" }));
    };

    const attach = async (file: File | undefined) => {
        if (!file) return;
        if (!RECEIPT_TYPES.includes(file.type)) return setErrors((e) => ({ ...e, receipt: "Upload a PNG, JPG, WebP or PDF." }));
        if (file.size > RECEIPT_MAX_BYTES) return setErrors((e) => ({ ...e, receipt: "Receipts must be 2 MB or smaller." }));
        try {
            set("receipt", { name: file.name, type: file.type, size: file.size, url: await readFile(file) });
        } catch (err) {
            setErrors((e) => ({ ...e, receipt: err instanceof Error ? err.message : "Upload failed." }));
        }
    };

    const base = Number(form.baseAmount);
    const amounts = computeAmounts(Number.isFinite(base) ? base : 0, form.taxApplicable, Number(form.taxRate) || null);
    const options = fixedProject && !projects.some((p) => p.value === fixedProject.value) ? [fixedProject, ...projects] : projects;
    const project = options.find((p) => p.value === form.projectId) ?? null;

    const toInput = (): ExpenseInput => ({
        type: form.type as ExpenseType,
        date: form.date,
        baseAmount: Number(form.baseAmount),
        taxApplicable: form.taxApplicable,
        taxRate: form.taxApplicable ? Number(form.taxRate) || null : null,
        category: form.category as ExpenseCategory,
        projectId: form.type === "project" ? form.projectId || null : null,
        projectName: form.type === "project" ? project?.label ?? expense?.projectName ?? null : null,
        projectType: form.type === "project" ? project?.projectType ?? expense?.projectType ?? null : null,
        paymentMethod: form.paymentMethod as PaymentMethod,
        reference: form.reference.trim() || null,
        receipt: form.receipt,
    });

    const submit = async () => {
        if (!editing) { setEditing(true); return; }
        const input = { ...toInput(), createdBy: expense ? undefined : await currentUserName() };
        const next = validateExpense({ ...input, baseAmount: form.baseAmount.trim() === "" ? NaN : input.baseAmount });
        setErrors(next);
        if (Object.values(next).some(Boolean)) return;
        try {
            const saved = expense ? updateExpense(expense.id, input) : createExpense(input);
            onSaved(saved, !expense);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "The expense couldn't be saved.");
        }
    };

    const ro = !editing;
    const drop = (e: DragEvent) => {
        e.preventDefault();
        setOver(false);
        if (!ro) void attach(e.dataTransfer.files[0]);
    };

    if (expense && !editing) {
        return <ExpensePreview expense={expense} open={open} onClose={onClose} onEdit={() => setEditing(true)} />;
    }

    return (
        <Drawer
            className="ex-drawer"
            title={expense ? `Edit ${expense.code}` : "Add Expense"}
            open={open}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="ld-btn" onClick={onClose}>Cancel</button>
                    <button type="button" className="ld-btn ld-btn--primary" onClick={() => void submit()}>
                        {expense ? "Save Changes" : "Add Expense"}
                    </button>
                </>
            }
        >
            {formError ? <p className="ld-form-error" role="alert">{formError}</p> : null}
            <div className="ex-row">
                <Field label="Expense Type" required error={errors.type}>
                    <SelectInput value={form.type} onChange={(v) => set("type", v as ExpenseType)} options={EXPENSE_TYPES} disabled={ro} />
                </Field>
                <Field label="Expense Date" required error={errors.date}>
                    <span className="ex-date">
                        <input type="date" value={form.date} max={today()} onChange={(e) => set("date", e.target.value)} disabled={ro} />
                        <CalendarDays size={18} aria-hidden="true" />
                    </span>
                </Field>
            </div>
            <Field label="Base Amount (INR)" required error={errors.baseAmount}>
                <input
                    inputMode="decimal"
                    value={form.baseAmount}
                    onChange={(e) => set("baseAmount", e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))}
                    placeholder="0.00"
                    disabled={ro}
                />
            </Field>
            <label className="ex-check">
                <input type="checkbox" checked={form.taxApplicable} onChange={(e) => set("taxApplicable", e.target.checked)} disabled={ro} />
                Tax Applicable
            </label>
            {form.taxApplicable ? (
                <div className="ex-row">
                    <Field label="GST Rate" required error={errors.taxRate}>
                        <SelectInput value={form.taxRate} onChange={(v) => set("taxRate", v)} options={TAX_RATES.map((r) => ({ value: String(r), label: `${r}%` }))} disabled={ro} />
                    </Field>
                    <div className="ex-tax-summary" aria-live="polite">
                        <span>Tax {formatINR(amounts.taxAmount)}</span>
                        <strong>Total {formatINR(amounts.totalAmount)}</strong>
                    </div>
                </div>
            ) : null}
            <Field label="Category" error={errors.category}>
                <SelectInput value={form.category} onChange={(v) => set("category", v as ExpenseCategory)} options={EXPENSE_CATEGORIES} disabled={ro} />
            </Field>
            {form.type === "project" ? (
                <Field label="Link to Project" required error={errors.projectId}>
                    <SelectInput
                        value={form.projectId}
                        onChange={(v) => set("projectId", v)}
                        placeholder={projects.length ? "Project" : "No projects yet"}
                        options={form.projectId && !project && expense?.projectName ? [...options, { value: form.projectId, label: expense.projectName, projectType: null }] : options}
                        disabled={ro || Boolean(fixedProject && !expense)}
                    />
                </Field>
            ) : null}
            <Field label="Payment Method" error={errors.paymentMethod}>
                <SelectInput value={form.paymentMethod} onChange={(v) => set("paymentMethod", v as PaymentMethod)} options={PAYMENT_METHODS} disabled={ro} />
            </Field>
            <Field label="Reference Number (Optional)" error={errors.reference}>
                <input value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="Enter Reference Number" maxLength={80} disabled={ro} />
            </Field>
            <Field label="Receipt / Supporting Documents" error={errors.receipt} group>
                {form.receipt ? (
                    <div className="ex-receipt">
                        <FileText size={20} aria-hidden="true" />
                        <a href={form.receipt.url} target="_blank" rel="noreferrer" download={form.receipt.name}>{form.receipt.name}</a>
                        <span>{Math.max(1, Math.round(form.receipt.size / 1024))} KB</span>
                        {!ro ? <button type="button" className="ld-btn" onClick={() => set("receipt", null)} aria-label="Remove receipt"><Trash2 size={16} /></button> : null}
                    </div>
                ) : (
                    <div
                        className={`ld-dropzone${over ? " is-over" : ""}${ro ? " is-disabled" : ""}`}
                        role="button"
                        tabIndex={ro ? -1 : 0}
                        aria-disabled={ro}
                        onClick={() => !ro && fileInput.current?.click()}
                        onKeyDown={(e) => !ro && (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); if (!ro) setOver(true); }}
                        onDragLeave={() => setOver(false)}
                        onDrop={drop}
                    >
                        <span className="ld-dropzone-icon"><CloudUpload size={22} /></span>
                        <span className="ld-dropzone-text">{ro ? "No receipt attached" : "Drag & Drop Your File Here"}</span>
                        {!ro ? <span className="ld-dropzone-hint">PNG, JPG, WebP or PDF · up to 2 MB</span> : null}
                        <input ref={fileInput} type="file" accept={RECEIPT_TYPES.join(",")} hidden onChange={(e) => { void attach(e.target.files?.[0]); e.target.value = ""; }} />
                    </div>
                )}
            </Field>
        </Drawer>
    );
}

/** Figma "Expenses - View Expense": read-only preview with totals, details, attachment and audit history. */
function ExpensePreview({ expense: e, open, onClose, onEdit }: { expense: Expense; open: boolean; onClose: () => void; onEdit: () => void }) {
    const details: Array<[string, string]> = [
        ["Project", e.projectName ?? "Office / Overhead"],
        ["Expense Type", label(EXPENSE_TYPES, e.type)],
        ["Category", label(EXPENSE_CATEGORIES, e.category)],
        ["Payment Method", label(PAYMENT_METHODS, e.paymentMethod)],
        ["GST", e.taxApplicable && e.taxRate ? `${e.taxRate}%` : "No Tax"],
        ["Payment Reference", e.reference || "Not Specified"],
    ];
    const history = [
        { at: e.createdAt, text: `Expense created${e.createdBy ? ` by ${e.createdBy}` : ""}` },
        ...(e.updatedAt && e.updatedAt !== e.createdAt ? [{ at: e.updatedAt, text: "Expense updated" }] : []),
    ].sort((a, b) => b.at.localeCompare(a.at));
    const sizeKb = e.receipt ? Math.max(1, Math.round(e.receipt.size / 1024)) : 0;
    return (
        <Drawer
            className="ex-drawer ex-drawer--preview"
            title={`${e.code} — Expenses Preview`}
            open={open}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="ld-btn" onClick={onClose}>Close</button>
                    <button type="button" className="ld-btn ld-btn--primary" onClick={onEdit}>Edit Expense</button>
                </>
            }
        >
            <header className="ex-pv-head">
                <div>
                    <h3>{label(EXPENSE_CATEGORIES, e.category)}{e.projectName ? ` — ${e.projectName}` : ""}</h3>
                    <p>{e.createdBy ? `Created by ${e.createdBy}` : `Recorded ${fmtDay(e.createdAt.slice(0, 10))}`}</p>
                </div>
                <span className="ex-pv-date">{fmtDay(e.date)}</span>
            </header>
            <section className="ex-pv-total">
                <span>Total Expense</span>
                <strong>{formatINR(e.totalAmount)}</strong>
                <span>{e.taxAmount ? `Base ${formatINR(e.baseAmount)} + tax ${formatINR(e.taxAmount)}` : `Base ${formatINR(e.baseAmount)} · No tax`}</span>
            </section>
            <dl className="ex-pv-grid">
                {details.map(([k, v]) => (
                    <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                ))}
            </dl>
            <section className="ex-pv-section">
                <h4>Attachments</h4>
                {e.receipt ? (
                    <div className="ex-pv-file">
                        <span className="ex-pv-file-icon"><FileText size={20} aria-hidden="true" /></span>
                        <span className="ex-pv-file-text">
                            <strong>{e.receipt.name}</strong>
                            <small>Receipt · {sizeKb} KB</small>
                        </span>
                        <a href={e.receipt.url} download={e.receipt.name} aria-label={`Download ${e.receipt.name}`}><Download size={20} /></a>
                        <a href={e.receipt.url} target="_blank" rel="noreferrer" aria-label={`Open ${e.receipt.name}`}><Eye size={20} /></a>
                    </div>
                ) : (
                    <p className="ex-pv-empty">No receipt attached. Edit the expense to upload one.</p>
                )}
            </section>
            <section className="ex-pv-section">
                <h4>Approval Timeline &amp; Audit History</h4>
                <ol className="ex-pv-timeline">
                    {history.map((h) => (
                        <li key={h.at + h.text}><strong>{fmtStamp(h.at)}</strong><span>{h.text}</span></li>
                    ))}
                </ol>
            </section>
        </Drawer>
    );
}
