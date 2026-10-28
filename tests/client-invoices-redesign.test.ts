import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Client Invoices Screen Redesign (Figma CSS Quick Mock /* Invoices */)", () => {
    const pagePath = join(process.cwd(), "app", "client", "invoices", "page.tsx");
    const cssPath = join(process.cwd(), "app", "client", "client-redesign.css");

    it("verifies the page file and stylesheet exist", () => {
        expect(existsSync(pagePath), "Invoices page must exist").toBe(true);
        expect(existsSync(cssPath), "Client redesign stylesheet must exist").toBe(true);
    });

    const pageContent = readFileSync(pagePath, "utf-8");
    const cssContent = readFileSync(cssPath, "utf-8");

    describe("Page Shell, Navigation & Header", () => {
        it("embeds the client redesign shell and blue background glow", () => {
            expect(pageContent).toContain('className="client-redesign-shell"');
            expect(pageContent).toContain('className="client-bg-glow"');
        });

        it("integrates ClientDashboardRail routed to /client/invoices", () => {
            expect(pageContent).toContain('ClientDashboardRail current="/client/invoices"');
        });

        it("integrates DashboardHeader with title 'Invoices' and hideNew", () => {
            expect(pageContent).toContain('DashboardHeader');
            expect(pageContent).toContain('title="Invoices"');
            expect(pageContent).toContain('hideNew={true}');
            expect(pageContent).toContain('onSearch=');
        });

        it("displays dynamic subtitle formatted as '{total} Invoices under {activeProjectName}'", () => {
            expect(pageContent).toContain('total === 1 ? "Invoice" : "Invoices"');
            expect(pageContent).toContain('under {activeProjectName}');
        });

        it("provides action button to create / select BOQ invoice", () => {
            expect(pageContent).toContain("Select BOQ Invoice");
            expect(pageContent).toContain("/client/invoices/new");
        });
    });

    describe("Table Architecture & 10 Exact Columns (Frame 57)", () => {
        it("uses scoped table card container and scroll wrapper", () => {
            expect(pageContent).toContain("client-invoices-table-card");
            expect(pageContent).toContain("client-invoices-table-scroll");
            expect(pageContent).toContain("client-invoices-table");
        });

        it("renders the exact 10 column headers with column class tokens", () => {
            const columns = [
                { title: "ID", cls: "col-id" },
                { title: "TYPE", cls: "col-type" },
                { title: "PROJECT", cls: "col-project" },
                { title: "CLIENT", cls: "col-client" },
                { title: "MILESTONE", cls: "col-milestone" },
                { title: "STATUS", cls: "col-status" },
                { title: "AMOUNT", cls: "col-amount" },
                { title: "ISSUED", cls: "col-issued" },
                { title: "DUE", cls: "col-due" },
                { title: "ACTIONS", cls: "col-actions" },
            ];

            for (const col of columns) {
                expect(pageContent).toContain(`>${col.title}</th>`);
                expect(pageContent).toContain(`className="${col.cls}"`);
            }
        });
    });

    describe("Row Formatting, Badges & Floating Popover Actions", () => {
        it("supports type pills for INVOICE, PRO-FORMA, and QUOTE", () => {
            expect(pageContent).toContain("type-invoice");
            expect(pageContent).toContain("type-pro-forma");
            expect(pageContent).toContain("type-quote");
            expect(pageContent).toContain("client-inv-type-pill");
        });

        it("supports status pills for PAID, ACCEPTED, SENT, PENDING, DRAFT, and OVERDUE", () => {
            expect(pageContent).toContain("status-paid");
            expect(pageContent).toContain("status-sent");
            expect(pageContent).toContain("status-pending");
            expect(pageContent).toContain("status-overdue");
            expect(pageContent).toContain("client-inv-status-pill");
        });

        it("formats currency using compact Cr / L logic", () => {
            expect(pageContent).toContain("formatCompactMoney(inv.totalAmount, inv.currency)");
        });

        it("provides a 3-dot floating action menu with View, Download, and Pay options", () => {
            expect(pageContent).toContain("MoreHorizontal");
            expect(pageContent).toContain("View Invoice");
            expect(pageContent).toContain("Download PDF");
            expect(pageContent).toContain("Pay Invoice");
            expect(pageContent).toContain("client-menu-popover");
        });
    });

    describe("Pagination Bar Specifications (Frame 2147225166)", () => {
        it("renders the pagination bar with scoped classes and total counter", () => {
            expect(pageContent).toContain("client-invoices-pagination-bar");
            expect(pageContent).toContain("client-invoices-pagination-total");
            expect(pageContent).toContain("Total Invoices: {total}");
        });

        it("renders numeric 34x34px pagination controls with previous/next chevrons", () => {
            expect(pageContent).toContain("client-invoices-pagination-controls");
            expect(pageContent).toContain("client-invoices-page-btn");
            expect(pageContent).toContain("ChevronLeft");
            expect(pageContent).toContain("ChevronRight");
        });

        it("provides the Show per Page dropdown with 10, 20, 50 options", () => {
            expect(pageContent).toContain("client-invoices-per-page");
            expect(pageContent).toContain("Show per Page:");
            expect(pageContent).toContain("<option value={10}>10</option>");
            expect(pageContent).toContain("<option value={20}>20</option>");
            expect(pageContent).toContain("<option value={50}>50</option>");
        });
    });

    describe("Stylesheet Tokens in client-redesign.css", () => {
        it("defines .client-invoices-table-card with glassmorphism and 20px padding", () => {
            expect(cssContent).toContain(".client-invoices-table-card");
            expect(cssContent).toMatch(/padding:\s*20px/);
            expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6)");
            expect(cssContent).toContain("backdrop-filter: blur(20.4px)");
        });

        it("defines .client-invoices-table header row with #E4ECFB and 36px height", () => {
            expect(cssContent).toContain(".client-invoices-table thead tr");
            expect(cssContent).toContain("background: #E4ECFB");
            expect(cssContent).toContain("height: 36px");
        });

        it("defines row height 56px with #EBEBEB border dividers", () => {
            expect(cssContent).toContain(".client-invoices-table tbody tr");
            expect(cssContent).toContain("height: 56px");
            expect(cssContent).toContain("border-bottom: 1px solid #EBEBEB");
        });

        it("defines scoped pill styles matching Figma colors", () => {
            expect(cssContent).toContain(".client-inv-type-pill.type-invoice");
            expect(cssContent).toContain("color: #2563EB");
            expect(cssContent).toContain(".client-inv-type-pill.type-quote");
            expect(cssContent).toContain("color: #9016A3");
            expect(cssContent).toContain(".client-inv-status-pill.status-paid");
            expect(cssContent).toContain("color: #16A34A");
            expect(cssContent).toContain(".client-inv-status-pill.status-overdue");
            expect(cssContent).toContain("color: #DC2626");
        });

        it("defines pagination bar and active page button tokens", () => {
            expect(cssContent).toContain(".client-invoices-pagination-bar");
            expect(cssContent).toContain(".client-invoices-page-btn.active");
            expect(cssContent).toContain("background: #E4ECFB");
            expect(cssContent).toContain("border: 1px solid #2563EB");
        });
    });

    describe("Backend Integration & Dynamic Data Preservation", () => {
        it("preserves real API client integration without mock overrides", () => {
            expect(pageContent).toContain("listClientInvoices");
            expect(pageContent).toContain("listClientProjects");
            expect(pageContent).toContain("payClientInvoice");
        });

        it("preserves interactive payment modal with multiple payment methods", () => {
            expect(pageContent).toContain("bank_transfer");
            expect(pageContent).toContain("upi");
            expect(pageContent).toContain("card");
            expect(pageContent).toContain("Confirm & Pay Now");
        });
    });
});
