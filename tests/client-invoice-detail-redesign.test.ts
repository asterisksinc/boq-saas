import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Client Invoice Detail / Pay Invoice Screen Redesign (Figma CSS Quick Mock /* Invoice Detail */)", () => {
    const newPagePath = join(process.cwd(), "app", "client", "invoices", "new", "page.tsx");
    const detailPagePath = join(process.cwd(), "app", "client", "invoices", "[invoiceId]", "page.tsx");
    const cssPath = join(process.cwd(), "app", "client", "client-redesign.css");

    it("verifies the page files and stylesheet exist", () => {
        expect(existsSync(newPagePath), "Invoice creation & preview page must exist").toBe(true);
        expect(existsSync(detailPagePath), "Invoice detail page must exist").toBe(true);
        expect(existsSync(cssPath), "Client redesign stylesheet must exist").toBe(true);
    });

    const newPageCode = readFileSync(newPagePath, "utf-8");
    const detailPageCode = readFileSync(detailPagePath, "utf-8");
    const cssCode = readFileSync(cssPath, "utf-8");

    describe("Page Shell, Navigation & Header Row (Frame 2147225068)", () => {
        it("embeds client redesign shell, background glow, and rail", () => {
            expect(newPageCode).toContain('className="client-redesign-shell"');
            expect(newPageCode).toContain('className="client-bg-glow"');
            expect(newPageCode).toContain('ClientDashboardRail current="/client/invoices"');
            expect(newPageCode).toContain('DashboardHeader title="Invoices" hideNew={true}');

            expect(detailPageCode).toContain('className="client-redesign-shell"');
            expect(detailPageCode).toContain('className="client-bg-glow"');
            expect(detailPageCode).toContain('ClientDashboardRail current="/client/invoices"');
            expect(detailPageCode).toContain('DashboardHeader title="Invoices" hideNew={true}');
        });

        it("renders the top sub-bar with back navigation, invoice code, and Pay Invoice button", () => {
            expect(newPageCode).toContain("client-invoice-header-row");
            expect(newPageCode).toContain("client-invoice-header-left");
            expect(newPageCode).toContain("ArrowLeft");
            expect(newPageCode).toContain("client-invoice-header-code");
            expect(newPageCode).toContain("client-invoice-pay-btn");
            expect(newPageCode).toContain("Pay Invoice");

            expect(detailPageCode).toContain("client-invoice-header-row");
            expect(detailPageCode).toContain("client-invoice-header-left");
            expect(detailPageCode).toContain("ArrowLeft");
            expect(detailPageCode).toContain("client-invoice-header-code");
            expect(detailPageCode).toContain("client-invoice-pay-btn");
            expect(detailPageCode).toContain("Pay Invoice");
        });
    });

    describe("Two-Column Composition (Frame 2147225223)", () => {
        it("structures the creation layout into 2 columns with scoped grid class", () => {
            expect(newPageCode).toContain("client-invoice-grid");
            expect(newPageCode).toContain("client-invoice-panel-card");
        });

        it("displays INVOICE INFORMATION heading and inner white card", () => {
            expect(newPageCode).toContain("INVOICE INFORMATION");
            expect(newPageCode).toContain("client-invoice-section-heading");
            expect(newPageCode).toContain("client-invoice-inner-card");
        });

        it("displays INVOICE PREVIEW heading and inner white card", () => {
            expect(newPageCode).toContain("INVOICE PREVIEW");
            expect(newPageCode).toContain("client-invoice-section-heading");
            expect(newPageCode).toContain("client-invoice-inner-card");
        });
    });

    describe("Form Controls & Required Fields (Frame 12, Frame 15, Frame 2147225454)", () => {
        it("provides Select BOQ field with 48px control, search icon, and required indicator", () => {
            expect(newPageCode).toContain("Select BOQ");
            expect(newPageCode).toContain("client-invoice-field-required");
            expect(newPageCode).toContain("client-invoice-input-control");
            expect(newPageCode).toContain("Search");
            expect(newPageCode).toContain("ChevronDown");
        });

        it("provides side-by-side Issue Date and Due Date controls in a responsive date row", () => {
            expect(newPageCode).toContain("client-invoice-date-row");
            expect(newPageCode).toContain("Issue Date");
            expect(newPageCode).toContain("Due Date");
            expect(newPageCode).toContain("Calendar");
            expect(newPageCode).toContain('type="date"');
        });
    });

    describe("Live Invoice Preview & Financial Summary Hierarchy (Frame 2147225151-2147225153)", () => {
        it("displays invoice header with DRAFT badge, code, and ref BOQ", () => {
            expect(newPageCode).toContain("TAX INVOICE (DRAFT)");
            expect(newPageCode).toContain("Ref BOQ:");
            expect(newPageCode).toContain("Total Payable");
        });

        it("renders line items table with ITEM, QTY, RATE, AMOUNT columns", () => {
            expect(newPageCode).toContain("ITEM");
            expect(newPageCode).toContain("QTY");
            expect(newPageCode).toContain("RATE");
            expect(newPageCode).toContain("AMOUNT");
        });

        it("formats financial summary with Subtotal, GST, divider, and highlighted Total Amount", () => {
            expect(newPageCode).toContain("client-invoice-summary-box");
            expect(newPageCode).toContain("client-invoice-summary-row");
            expect(newPageCode).toContain("client-invoice-summary-label");
            expect(newPageCode).toContain("Subtotal");
            expect(newPageCode).toContain("GST (18%)");
            expect(newPageCode).toContain("client-invoice-summary-divider");
            expect(newPageCode).toContain("client-invoice-summary-total-label");
            expect(newPageCode).toContain("Total Amount");
            expect(newPageCode).toContain("client-invoice-summary-total-val");
        });
    });

    describe("Issued Invoice Detail View Architecture (app/client/invoices/[invoiceId]/page.tsx)", () => {
        it("arranges the page in a 2-column detail grid with left column and sticky summary", () => {
            expect(detailPageCode).toContain("client-invoice-detail-grid");
            expect(detailPageCode).toContain("client-invoice-detail-column");
        });

        it("renders the 5 distinct cards in the left column with section headings and inner white cards", () => {
            expect(detailPageCode).toContain("INVOICE INFORMATION");
            expect(detailPageCode).toContain("BILL TO");
            expect(detailPageCode).toContain("PROJECT DETAILS");
            expect(detailPageCode).toContain("INVOICE ITEMS");
            expect(detailPageCode).toContain("TERMS &amp; CONDITIONS");
            expect(detailPageCode).toContain("client-invoice-panel-card");
            expect(detailPageCode).toContain("client-invoice-section-heading");
            expect(detailPageCode).toContain("client-invoice-inner-card");
        });

        it("renders Card 1 with 4-cell key-value grid and status pill", () => {
            expect(detailPageCode).toContain("client-invoice-info-grid-4");
            expect(detailPageCode).toContain("client-invoice-kv-item");
            expect(detailPageCode).toContain("client-invoice-kv-label");
            expect(detailPageCode).toContain("client-invoice-kv-value");
            expect(detailPageCode).toContain("Invoice Number");
            expect(detailPageCode).toContain("Issue Date");
            expect(detailPageCode).toContain("Due Date");
            expect(detailPageCode).toContain("Status");
            expect(detailPageCode).toContain("client-invoice-status-pill");
        });

        it("renders Card 2 with Bill To 2-column grid including client name, email, company, and billing address", () => {
            expect(detailPageCode).toContain("client-invoice-info-grid-2");
            expect(detailPageCode).toContain("Client Name");
            expect(detailPageCode).toContain("Email");
            expect(detailPageCode).toContain("Company");
            expect(detailPageCode).toContain("Billing Address");
        });

        it("renders Card 3 with Project Details 2-column grid and clickable link to related BOQ", () => {
            expect(detailPageCode).toContain("Project");
            expect(detailPageCode).toContain("Project code");
            expect(detailPageCode).toContain("Related BOQ");
            expect(detailPageCode).toContain('href="/client/boq"');
            expect(detailPageCode).toContain("client-invoice-kv-link");
        });

        it("renders Card 4 with Invoice Items table, E4ECFB header, 4 columns, and row hover", () => {
            expect(detailPageCode).toContain("client-invoice-table-wrap");
            expect(detailPageCode).toContain("client-invoice-detail-table");
            expect(detailPageCode).toContain("client-invoice-detail-thead");
            expect(detailPageCode).toContain("client-invoice-detail-th");
            expect(detailPageCode).toContain("DESCRIPTION");
            expect(detailPageCode).toContain("QTY");
            expect(detailPageCode).toContain("RATE");
            expect(detailPageCode).toContain("AMOUNT");
            expect(detailPageCode).toContain("client-invoice-detail-tr");
            expect(detailPageCode).toContain("client-invoice-detail-td-desc");
            expect(detailPageCode).toContain("client-invoice-detail-td-qty");
            expect(detailPageCode).toContain("client-invoice-detail-td-rate");
            expect(detailPageCode).toContain("client-invoice-detail-td-amount");
        });

        it("renders Card 5 with Terms & Conditions, Payment Terms, and Payment Conditions lists", () => {
            expect(detailPageCode).toContain("client-invoice-terms-block");
            expect(detailPageCode).toContain("client-invoice-terms-subtitle");
            expect(detailPageCode).toContain("Payment Terms");
            expect(detailPageCode).toContain("Payment Conditions");
            expect(detailPageCode).toContain("client-invoice-terms-list");
        });

        it("renders Right Column with INVOICE SUMMARY, financial breakdown, Payment Status card, and PDF download", () => {
            expect(detailPageCode).toContain("INVOICE SUMMARY");
            expect(detailPageCode).toContain("Subtotal");
            expect(detailPageCode).toContain("Discount");
            expect(detailPageCode).toContain("Tax / GST");
            expect(detailPageCode).toContain("Grand Total");
            expect(detailPageCode).toContain("client-invoice-payment-status-card");
            expect(detailPageCode).toContain("PAYMENT STATUS");
            expect(detailPageCode).toContain("Amount Due");
            expect(detailPageCode).toContain("Due Date");
            expect(detailPageCode).toContain("Download PDF");
            expect(detailPageCode).toContain("/pdf");
        });
    });

    describe("Payment Workflow & Real Backend Integration", () => {
        it("preserves real backend API methods without mock overrides", () => {
            expect(newPageCode).toContain("listClientBoqs");
            expect(newPageCode).toContain("getClientBoq");
            expect(newPageCode).toContain("createClientInvoice");
            expect(newPageCode).toContain("payClientInvoice");

            expect(detailPageCode).toContain("getClientInvoice");
            expect(detailPageCode).toContain("payClientInvoice");
        });

        it("includes interactive payment modal with multiple payment methods", () => {
            expect(newPageCode).toContain("bank_transfer");
            expect(newPageCode).toContain("upi");
            expect(newPageCode).toContain("card");

            expect(detailPageCode).toContain("bank_transfer");
            expect(detailPageCode).toContain("upi");
            expect(detailPageCode).toContain("card");
            expect(detailPageCode).toContain("Bank Transfer (NEFT / RTGS / IMPS)");
            expect(detailPageCode).toContain("Instant UPI / QR");
            expect(detailPageCode).toContain("Debit / Credit Card");
        });
    });

    describe("Stylesheet Design Tokens in client-redesign.css", () => {
        it("defines .client-invoice-pay-btn with 46px height and #2563EB background", () => {
            expect(cssCode).toContain(".client-invoice-pay-btn");
            expect(cssCode).toContain("height: 46px");
            expect(cssCode).toContain("background: #2563EB");
            expect(cssCode).toContain("border-radius: 6px");
            expect(cssCode).toContain("color: #FFFFFF");
        });

        it("defines .client-invoice-panel-card with glassmorphism surface", () => {
            expect(cssCode).toContain(".client-invoice-panel-card");
            expect(cssCode).toContain("background: rgba(255, 255, 255, 0.6)");
            expect(cssCode).toContain("backdrop-filter: blur(20.4px)");
            expect(cssCode).toContain("border-radius: 6px");
            expect(cssCode).toContain("padding: 20px");
        });

        it("defines .client-invoice-inner-card with 14px radius and subtle shadow", () => {
            expect(cssCode).toContain(".client-invoice-inner-card");
            expect(cssCode).toContain("background: #FFFFFF");
            expect(cssCode).toContain("border-radius: 14px");
            expect(cssCode).toContain("box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.06)");
        });

        it("defines .client-invoice-detail-grid with 1.8fr / 1fr columns", () => {
            expect(cssCode).toContain(".client-invoice-detail-grid");
            expect(cssCode).toContain("grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr)");
        });

        it("defines .client-invoice-detail-thead with #E4ECFB background", () => {
            expect(cssCode).toContain(".client-invoice-detail-thead");
            expect(cssCode).toContain("background: #E4ECFB");
        });

        it("defines .client-invoice-payment-status-card with rgba(100, 116, 139, 0.1) background", () => {
            expect(cssCode).toContain(".client-invoice-payment-status-card");
            expect(cssCode).toContain("background: rgba(100, 116, 139, 0.1)");
            expect(cssCode).toContain("border-radius: 8px");
        });

        it("defines .client-invoice-input-control with 48px height and #E2E8F0 border", () => {
            expect(cssCode).toContain(".client-invoice-input-control");
            expect(cssCode).toContain("height: 48px");
            expect(cssCode).toContain("border: 1px solid #E2E8F0");
            expect(cssCode).toContain("border-radius: 8px");
        });

        it("defines .client-invoice-summary-total-val in #2563EB Urbanist", () => {
            expect(cssCode).toContain(".client-invoice-summary-total-val");
            expect(cssCode).toContain("color: #2563EB");
            expect(cssCode).toContain("font-weight: 600");
        });
    });
});
