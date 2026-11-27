/**
 * Expenses (Sales & Finance). Figma "User Design" → Expenses, Expenses - New Expense, Expenses - View Expense.
 *
 * Browser-only store, the same approach the Vendor Marketplace uses until a backend table exists. Each expense is a
 * company cost, optionally linked to a project, with GST handled as base amount + tax. Planned REST contract:
 *   GET    /api/v1/expenses?search&category&paymentMethod&projectId&receipt&page&pageSize
 *   POST   /api/v1/expenses                 ExpenseInput -> Expense
 *   PATCH  /api/v1/expenses/:id             Partial<ExpenseInput> -> Expense
 *   DELETE /api/v1/expenses/:id
 *   GET    /api/v1/expenses/export          xlsx
 */

export const EXPENSE_TYPES = [
    { value: "project", label: "Project Expense" },
    { value: "office", label: "Office / Overhead Expense" },
] as const;

export const EXPENSE_CATEGORIES = [
    { value: "materials", label: "Materials" },
    { value: "furniture", label: "Furniture" },
    { value: "travel", label: "Travel & Transport" },
    { value: "office", label: "Office Expenses" },
    { value: "site", label: "Site Expenses" },
    { value: "professional", label: "Professional Fees" },
    { value: "labour", label: "Labour" },
    { value: "other", label: "Other" },
] as const;

export const PAYMENT_METHODS = [
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "upi", label: "UPI" },
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "cheque", label: "Cheque" },
] as const;

/** GST slabs offered when "Tax Applicable" is ticked. */
export const TAX_RATES = [5, 12, 18, 28] as const;

export type ExpenseType = (typeof EXPENSE_TYPES)[number]["value"];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

export interface ExpenseReceipt {
    name: string;
    type: string;
    size: number;
    /** data: URL kept with the expense until receipts move to storage. */
    url: string;
}

export interface Expense {
    id: string;
    code: string;
    type: ExpenseType;
    date: string; // yyyy-mm-dd
    baseAmount: number;
    taxApplicable: boolean;
    taxRate: number | null;
    taxAmount: number;
    totalAmount: number;
    category: ExpenseCategory;
    projectId: string | null;
    projectName: string | null;
    projectType: string | null;
    paymentMethod: PaymentMethod;
    reference: string | null;
    receipt: ExpenseReceipt | null;
    /** Display name of the person who recorded it, when known. */
    createdBy?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ExpenseInput {
    type: ExpenseType;
    date: string;
    baseAmount: number;
    taxApplicable: boolean;
    taxRate: number | null;
    category: ExpenseCategory;
    projectId: string | null;
    projectName: string | null;
    projectType: string | null;
    paymentMethod: PaymentMethod;
    reference: string | null;
    receipt: ExpenseReceipt | null;
    createdBy?: string | null;
}

export interface ExpenseFilters {
    search?: string;
    category?: string;
    paymentMethod?: string;
    projectId?: string;
    receipt?: "" | "attached" | "missing";
}

export const RECEIPT_MAX_BYTES = 2 * 1024 * 1024;
export const RECEIPT_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

const STORAGE_KEY = "boq-saas:expenses:v1";

export const label = <T extends ReadonlyArray<{ value: string; label: string }>>(list: T, value: string | null | undefined) =>
    list.find((x) => x.value === value)?.label ?? (value || "—");

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Tax and total from the base amount. Tax is base x rate when "Tax Applicable" is ticked. */
export function computeAmounts(baseAmount: number, taxApplicable: boolean, taxRate: number | null) {
    const base = round2(baseAmount);
    const tax = taxApplicable && taxRate ? round2((base * taxRate) / 100) : 0;
    return { baseAmount: base, taxAmount: tax, totalAmount: round2(base + tax) };
}

/** Returns field errors; an empty object means the input is valid. */
export function validateExpense(input: Partial<ExpenseInput>, today = new Date()): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!input.type) errors.type = "Choose an expense type.";
    if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) errors.date = "Choose the expense date.";
    else if (input.date > new Date(today.getTime() + 864e5).toISOString().slice(0, 10)) errors.date = "The date can't be in the future.";
    if (!Number.isFinite(input.baseAmount) || (input.baseAmount ?? 0) <= 0) errors.baseAmount = "Enter an amount greater than 0.";
    else if ((input.baseAmount ?? 0) > 1e11) errors.baseAmount = "That amount is too large.";
    if (input.taxApplicable && !input.taxRate) errors.taxRate = "Choose the GST rate.";
    if (!input.category) errors.category = "Choose a category.";
    if (input.type === "project" && !input.projectId) errors.projectId = "Link this expense to a project.";
    if (!input.paymentMethod) errors.paymentMethod = "Choose how it was paid.";
    if (input.reference && input.reference.length > 80) errors.reference = "Keep the reference under 80 characters.";
    return errors;
}

let cache: Expense[] | null = null;

function read(): Expense[] {
    if (cache) return cache;
    if (typeof window === "undefined") return (cache = []);
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        cache = raw ? (JSON.parse(raw) as Expense[]) : [];
    } catch {
        cache = [];
    }
    return cache;
}

function write(list: Expense[]) {
    cache = list;
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
        throw new Error("The expense couldn't be saved. The receipt may be too large for this browser; try a smaller file.");
    }
}

function nextCode(list: Expense[]) {
    const max = list.reduce((m, e) => Math.max(m, Number(e.code.replace(/\D/g, "")) || 0), 0);
    return `EXP-${String(max + 1).padStart(4, "0")}`;
}

function uid() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `exp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function matches(e: Expense, f: ExpenseFilters) {
    if (f.category && e.category !== f.category) return false;
    if (f.paymentMethod && e.paymentMethod !== f.paymentMethod) return false;
    if (f.projectId && e.projectId !== f.projectId) return false;
    if (f.receipt === "attached" && !e.receipt) return false;
    if (f.receipt === "missing" && e.receipt) return false;
    const q = f.search?.trim().toLowerCase();
    if (q) {
        const hay = [
            e.code, e.projectName, label(EXPENSE_CATEGORIES, e.category), label(PAYMENT_METHODS, e.paymentMethod), e.reference,
            String(e.totalAmount), String(e.baseAmount), e.totalAmount.toLocaleString("en-IN"),
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q.replace(/[₹,\s]/g, "")) && !hay.includes(q)) return false;
    }
    return true;
}

const sorted = (list: Expense[]) => [...list].sort((a, b) => (b.date === a.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));

export function listExpenses(filters: ExpenseFilters & { page?: number; pageSize?: number } = {}) {
    const all = sorted(read().filter((e) => matches(e, filters)));
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 10));
    const page = Math.max(1, filters.page ?? 1);
    return {
        items: all.slice((page - 1) * pageSize, page * pageSize),
        total: all.length,
        totals: all.reduce((t, e) => ({ amount: round2(t.amount + e.totalAmount), tax: round2(t.tax + e.taxAmount) }), { amount: 0, tax: 0 }),
    };
}

export function getExpense(id: string) {
    return read().find((e) => e.id === id) ?? null;
}

function build(input: ExpenseInput, base?: Expense): Expense {
    const errors = validateExpense(input);
    const first = Object.values(errors)[0];
    if (first) throw new Error(first);
    const now = new Date().toISOString();
    const amounts = computeAmounts(input.baseAmount, input.taxApplicable, input.taxApplicable ? input.taxRate : null);
    const project = input.type === "project";
    return {
        id: base?.id ?? uid(),
        code: base?.code ?? nextCode(read()),
        type: input.type,
        date: input.date,
        ...amounts,
        taxApplicable: input.taxApplicable,
        taxRate: input.taxApplicable ? input.taxRate : null,
        category: input.category,
        projectId: project ? input.projectId : null,
        projectName: project ? input.projectName : null,
        projectType: project ? input.projectType : null,
        paymentMethod: input.paymentMethod,
        reference: input.reference?.trim() || null,
        receipt: input.receipt,
        createdBy: base ? base.createdBy ?? null : input.createdBy ?? null,
        createdAt: base?.createdAt ?? now,
        updatedAt: now,
    };
}

export function createExpense(input: ExpenseInput): Expense {
    const expense = build(input);
    write([expense, ...read()]);
    return expense;
}

export function updateExpense(id: string, input: ExpenseInput): Expense {
    const list = read();
    const current = list.find((e) => e.id === id);
    if (!current) throw new Error("This expense no longer exists.");
    const next = build(input, current);
    write(list.map((e) => (e.id === id ? next : e)));
    return next;
}

export function deleteExpense(id: string) {
    write(read().filter((e) => e.id !== id));
}

export async function exportExpenses(filters: ExpenseFilters): Promise<Blob> {
    const XLSX = await import("xlsx");
    const rows = sorted(read().filter((e) => matches(e, filters))).map((e) => ({
        ID: e.code,
        Date: e.date,
        Type: label(EXPENSE_TYPES, e.type),
        Project: e.projectName ?? "",
        Category: label(EXPENSE_CATEGORIES, e.category),
        "Base Amount (INR)": e.baseAmount,
        "GST %": e.taxRate ?? "",
        "Tax (INR)": e.taxAmount,
        "Total (INR)": e.totalAmount,
        "Payment Method": label(PAYMENT_METHODS, e.paymentMethod),
        Reference: e.reference ?? "",
        Receipt: e.receipt ? "Attached" : "Missing",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ ID: "", Date: "", Type: "", Project: "", Category: "" }]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Expenses");
    const data = XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    return new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/** Sum of every expense linked to a project (base + tax). */
export function projectExpenseTotal(projectId: string) {
    return round2(read().filter((e) => e.projectId === projectId).reduce((t, e) => t + e.totalAmount, 0));
}

/**
 * Project expense KPIs.
 *  Amount received   = total the client has paid against the project's invoices
 *  Total expenses    = sum of all expenses on the project
 *  Project balance   = amount received - total expenses
 *  Outstanding       = invoiced to the client but not yet paid
 */
export function projectExpenseKpis(input: { received: number; outstanding: number; expenses: number }) {
    const received = round2(input.received || 0);
    const expenses = round2(input.expenses || 0);
    return { received, expenses, balance: round2(received - expenses), outstanding: round2(input.outstanding || 0) };
}

export function formatINR(n: number) {
    return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/** Test hook. */
export function __resetExpenses() {
    cache = null;
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}
