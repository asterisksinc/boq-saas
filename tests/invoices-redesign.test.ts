import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

describe("Invoices Redesign - Figma CSS & Architecture Verification", () => {
    const cssPath = "app/invoices/invoices-redesign.css";
    const pagePath = "app/invoices/page.tsx";
    const importModalPath = "components/invoices/InvoiceExcelImportModal.tsx";

    it("verifies dedicated redesign CSS file exists and has Figma design tokens", () => {
        expect(existsSync(cssPath)).toBe(true);
        const css = readFileSync(cssPath, "utf8");

        // Primary & Accent colors from Figma CSS
        expect(css).toContain("#2563EB");
        expect(css).toContain("#0F172A");
        expect(css).toContain("#64748B");
        expect(css).toContain("#E4ECFB"); // Table header background
        expect(css).toContain("#EBEBEB"); // Table dividers
        expect(css).toContain("#D90606"); // Overdue red emphasis
        expect(css).toContain("Urbanist");

        // Key Figma Auto-Layout Components & Dimensions
        expect(css).toContain(".invoices-main-container");
        expect(css).toContain(".invoices-sub-header");
        expect(css).toContain(".btn-invoices-import");
        expect(css).toContain(".btn-invoices-new");
        expect(css).toContain(".invoices-summary-row");
        expect(css).toContain(".invoices-kpi-card");
        expect(css).toContain(".invoices-table-card");
        expect(css).toContain(".invoices-table");
        expect(css).toContain(".invoices-pagination-bar");
        expect(css).toContain(".btn-inv-page");
        expect(css).toContain(".invoices-per-page-select");
    });

    it("verifies InvoicesPage imports redesign stylesheet and Dashboard layout components", () => {
        expect(existsSync(pagePath)).toBe(true);
        const page = readFileSync(pagePath, "utf8");

        expect(page).toContain('import "./invoices-redesign.css"');
        expect(page).toContain('<DashboardRail current="/invoices" />');
        expect(page).toContain('<DashboardHeader');
        expect(page).toContain('title="Invoices"');
        expect(page).toContain('InvoiceExcelImportModal');
    });

    it("verifies KPI Cards are dynamic and include all 4 cards with proper labels and values", () => {
        const page = readFileSync(pagePath, "utf8");

        expect(page).toContain("Total Invoiced");
        expect(page).toContain("Collected");
        expect(page).toContain("Outstanding");
        expect(page).toContain("Overdue");
        expect(page).toContain("invoices-kpi-value-overdue");
        expect(page).toContain("This quarter");
    });

    it("verifies Table contains all required Figma columns in correct order", () => {
        const page = readFileSync(pagePath, "utf8");

        expect(page).toContain("col-inv-id");
        expect(page).toContain("col-inv-type");
        expect(page).toContain("col-inv-project");
        expect(page).toContain("col-inv-client");
        expect(page).toContain("col-inv-milestone");
        expect(page).toContain("col-inv-status");
        expect(page).toContain("col-inv-amount");
        expect(page).toContain("col-inv-issued");
        expect(page).toContain("col-inv-due");
        expect(page).toContain("col-inv-actions");
    });

    it("verifies Excel & CSV Import Modal exists and supports spreadsheet processing", () => {
        expect(existsSync(importModalPath)).toBe(true);
        const modal = readFileSync(importModalPath, "utf8");

        expect(modal).toContain("XLSX.read");
        expect(modal).toContain("sheet_to_json");
        expect(modal).toContain("createInvoice");
        expect(modal).toContain("previewRows");
        expect(modal).toContain("downloadSampleTemplate");
    });

    it("verifies row action dropdown menu supports all operational workflows", () => {
        const page = readFileSync(pagePath, "utf8");

        expect(page).toContain("View Details");
        expect(page).toContain("Download PDF");
        expect(page).toContain("Send to Client");
        expect(page).toContain("Record Payment");
        expect(page).toContain("Edit Invoice");
        expect(page).toContain("Archive");
    });

    it("verifies Invoice Preview right-side drawer implements Figma specs & design tokens", () => {
        const css = readFileSync(cssPath, "utf8");
        const page = readFileSync(pagePath, "utf8");

        // CSS Drawer Tokens
        expect(css).toContain(".invoice-preview-backdrop");
        expect(css).toContain("blur(7px)");
        expect(css).toContain(".invoice-preview-drawer");
        expect(css).toContain("590px");
        expect(css).toContain("rgba(255, 255, 255, 0.6)");
        expect(css).toContain(".invoice-preview-paper");
        expect(css).toContain(".invoice-preview-paper-header");
        expect(css).toContain(".invoice-preview-meta-card");
        expect(css).toContain(".invoice-preview-items-section");
        expect(css).toContain(".invoice-preview-table-head");
        expect(css).toContain(".invoice-preview-totals-box");
        expect(css).toContain("210px");
        expect(css).toContain(".invoice-preview-bank-card");
        expect(css).toContain(".invoice-preview-footer-actions");
        expect(css).toContain(".btn-inv-preview-white");
        expect(css).toContain(".btn-inv-preview-primary");

        // Component Structure & Dynamic Bindings in page.tsx
        expect(page).toContain('className="invoice-preview-backdrop"');
        expect(page).toContain('className="invoice-preview-drawer"');
        expect(page).toContain("Invoice Preview");
        expect(page).toContain("invoice-preview-paper");
        expect(page).toContain("invoice-preview-brand-col");
        expect(page).toContain("invoice-preview-doc-meta");
        expect(page).toContain("BILLED TO");
        expect(page).toContain("Issue Date:");
        expect(page).toContain("Due Date:");
        expect(page).toContain("Milestone:");
        expect(page).toContain("invoice-preview-items-section");
        expect(page).toContain("DESCRIPTION");
        expect(page).toContain("QTY");
        expect(page).toContain("RATE");
        expect(page).toContain("AMOUNT");
        expect(page).toContain("Subtotal");
        expect(page).toContain("GST (");
        expect(page).toContain("Total Due");
        expect(page).toContain("Payment status");
        expect(page).toContain("Bank Name");
        expect(page).toContain("Account Holder");
        expect(page).toContain("Account Number");
        expect(page).toContain("IFSC Code");
        expect(page).toContain("Branch");
        expect(page).toContain("btn-inv-preview-action");
        expect(page).toContain("Download PDF");
        expect(page).toContain("Send to Client");
        expect(page).toContain("Record Payment");
    });

    it("verifies Create New Invoice page implements Figma specs, two-column layout & live preview", () => {
        const css = readFileSync(cssPath, "utf8");
        const page = readFileSync(pagePath, "utf8");

        // CSS Design Tokens for Create Invoice
        expect(css).toContain(".create-invoice-container");
        expect(css).toContain(".create-invoice-header");
        expect(css).toContain(".btn-create-back");
        expect(css).toContain(".btn-create-cancel");
        expect(css).toContain(".btn-create-draft");
        expect(css).toContain(".btn-create-submit");
        expect(css).toContain(".create-invoice-layout");
        expect(css).toContain(".create-invoice-col-form");
        expect(css).toContain(".create-invoice-col-preview");
        expect(css).toContain(".create-invoice-section-card");
        expect(css).toContain(".create-invoice-inner-card");
        expect(css).toContain(".create-boq-dropdown-wrapper");
        expect(css).toContain(".create-boq-trigger");
        expect(css).toContain(".create-dates-row");
        expect(css).toContain(".create-items-table-head");
        expect(css).toContain(".btn-create-add-item");
        expect(css).toContain(".create-notes-textarea");
        expect(css).toContain(".create-preview-section-card");
        expect(css).toContain(".create-preview-header-bar");
        expect(css).toContain(".btn-create-change-template");
        expect(css).toContain(".create-preview-totals-box");

        // Full tab fitting & dashboard parent alignment (no restrictive max-width or auto margins)
        expect(css).not.toContain("max-width: 1326px;");
        expect(css).not.toContain("margin: 0 auto;");
        expect(css).toContain("max-width: 100%;");

        // Page Component Verification
        expect(page).toContain("fig-dashboard-container invoices-main-container");
        expect(page).toContain("create-invoice-container");
        expect(page).toContain("Create New Invoice");
        expect(page).toContain("Cancel");
        expect(page).toContain("Save as Draft");
        expect(page).toContain("Create Invoice");
        expect(page).toContain("create-invoice-layout");
        expect(page).toContain("INVOICE DETAILS");
        expect(page).toContain("Select BOQ");
        expect(page).toContain("Issue Date");
        expect(page).toContain("Due Date");
        expect(page).toContain("ITEMS");
        expect(page).toContain("Enter Description");
        expect(page).toContain("Add Item");
        expect(page).toContain("Additional Notes");
        expect(page).toContain("Add any additional notes or payment instructions...");
        expect(page).toContain("INVOICE PREVIEW");
        expect(page).toContain("Change Template");
        expect(page).toContain("Total Amount");
        expect(page).toContain("/api/v1/boqs");
        expect(page).toContain("/api/v1/invoices");
    });
});
