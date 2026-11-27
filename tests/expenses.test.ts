import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
    __resetExpenses, computeAmounts, createExpense, deleteExpense, exportExpenses, listExpenses, updateExpense, validateExpense,
    type ExpenseInput,
} from "../lib/expenses/store";

const input = (over: Partial<ExpenseInput> = {}): ExpenseInput => ({
    type: "project", date: "2026-08-02", baseAmount: 84590, taxApplicable: true, taxRate: 18, category: "materials",
    projectId: "p1", projectName: "Oberoi Residence - Bandra", projectType: "Residential", paymentMethod: "cash",
    reference: null, receipt: null, ...over,
});

describe("Expenses (Sales & Finance)", () => {
    beforeEach(() => __resetExpenses());

    it("adds GST on top of the base amount", () => {
        expect(computeAmounts(84590, true, 18)).toEqual({ baseAmount: 84590, taxAmount: 15226.2, totalAmount: 99816.2 });
        expect(computeAmounts(99790, false, 18)).toEqual({ baseAmount: 99790, taxAmount: 0, totalAmount: 99790 });
    });

    it("validates required fields like the Figma form", () => {
        const errors = validateExpense({ type: "project", date: "", baseAmount: 0, taxApplicable: true, taxRate: null, category: undefined, projectId: null, paymentMethod: undefined }, new Date("2026-11-27"));
        expect(Object.keys(errors).sort()).toEqual(["baseAmount", "category", "date", "paymentMethod", "projectId", "taxRate"]);
        expect(validateExpense(input({ date: "2027-01-01" }), new Date("2026-11-27")).date).toMatch(/future/);
        // Office / overhead expenses don't need a project.
        expect(validateExpense(input({ type: "office", projectId: null }), new Date("2026-11-27"))).toEqual({});
    });

    it("numbers expenses EXP-0001 upwards, lists newest first and searches by amount or project", () => {
        const a = createExpense(input({ date: "2026-08-01" }));
        const b = createExpense(input({ date: "2026-08-03", type: "office", projectId: "x", projectName: "ignored", category: "office", taxApplicable: false, baseAmount: 1200 }));
        expect([a.code, b.code]).toEqual(["EXP-0001", "EXP-0002"]);
        expect(b.projectId).toBeNull();
        expect(b.projectName).toBeNull();
        expect(listExpenses().items.map((e) => e.code)).toEqual(["EXP-0002", "EXP-0001"]);
        expect(listExpenses({ search: "99816" }).items.map((e) => e.code)).toEqual(["EXP-0001"]);
        expect(listExpenses({ search: "oberoi" }).total).toBe(1);
        expect(listExpenses({ receipt: "missing" }).total).toBe(2);
        expect(listExpenses().totals).toEqual({ amount: 101016.2, tax: 15226.2 });
    });

    it("edits keep the code and recompute tax; delete removes the expense", () => {
        const a = createExpense(input());
        const edited = updateExpense(a.id, input({ taxRate: 5 }));
        expect(edited.code).toBe(a.code);
        expect(edited.taxAmount).toBe(4229.5);
        expect(() => updateExpense(a.id, input({ baseAmount: -1 }))).toThrow(/greater than 0/);
        deleteExpense(a.id);
        expect(listExpenses().total).toBe(0);
    });

    it("exports to Excel", async () => {
        createExpense(input());
        const blob = await exportExpenses({});
        expect(blob.size).toBeGreaterThan(1000);
    });

    it("sits in Sales & Finance after Invoices and in the New menu", () => {
        const rail = readFileSync("components/DashboardRail.tsx", "utf8");
        expect(rail).toMatch(/"\/invoices"[^\n]*\n\s*\{ route: "\/expenses", icon: "nav-expenses", label: "Expenses" \}/);
        expect(readFileSync("components/header/NewMenuPopover.tsx", "utf8")).toContain('router.push("/expenses?create=true")');
        const page = readFileSync("app/expenses/page.tsx", "utf8");
        for (const text of ["Every expense accounted for and every project in control.", "Search expense by amount, project", "New Expense", "Total Expenses"]) expect(page).toContain(text);
        const drawer = readFileSync("components/expenses/ExpenseDrawer.tsx", "utf8");
        for (const text of ["Expense Type", "Expense Date", "Base Amount (INR)", "Tax Applicable", "Link to Project", "Payment Method", "Reference Number (Optional)", "Receipt / Supporting Documents", "Edit Expense", "Add Expense"]) expect(drawer).toContain(text);
    });
});
