import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Project Workspace: Payments Tab Redesign (Figma CSS Parity)", () => {
  const pagePath = path.join(process.cwd(), "app/projects/[id]/page.tsx");
  const globalsCssPath = path.join(process.cwd(), "app/globals.css");

  const pageContent = fs.readFileSync(pagePath, "utf-8");
  const cssContent = fs.readFileSync(globalsCssPath, "utf-8");

  describe("Workspace Tabs & Active States", () => {
    it("defines active tab state with #EFF6FF background and #2563EB text", () => {
      expect(cssContent).toContain(".workspace-tabs .po-tab-btn.is-active");
      expect(cssContent).toContain("#EFF6FF");
      expect(cssContent).toContain("#2563EB");
    });

    it("defines workspace tabs font family as Urbanist and weight 600", () => {
      expect(cssContent).toContain("font-family: 'Urbanist'");
      expect(cssContent).toContain(".workspace-tabs .po-tab-btn");
      expect(cssContent).toContain("font-weight: 600");
    });

    it("verifies Payments tab is listed in project tabs array", () => {
      expect(pageContent).toContain('"Payments"');
      expect(pageContent).toContain('tab === "Payments" && <Payments');
    });
  });

  describe("Summary Metrics Cards (Frame 2147225071)", () => {
    it("includes workspace-payment-metrics-container with glassmorphism backdrop", () => {
      expect(cssContent).toContain(".workspace-payment-metrics-container");
      expect(cssContent).toContain("rgba(255, 255, 255, 0.6)");
      expect(cssContent).toContain("backdrop-filter: blur(20.4px)");
      expect(pageContent).toContain("workspace-payment-metrics-container");
    });

    it("renders 4 metric cards: Contract Value, Invoiced, Paid, Outstanding", () => {
      expect(pageContent).toContain("Contract Value");
      expect(pageContent).toContain("Total Project Budget");
      expect(pageContent).toContain("Invoiced");
      expect(pageContent).toContain("% of contract");
      expect(pageContent).toContain("Paid");
      expect(pageContent).toContain("Outstanding");
      expect(pageContent).toContain("Overdue");
      expect(pageContent).toContain("All current");
    });

    it("styles Paid metric with #16A34A and Outstanding with #D90606", () => {
      expect(cssContent).toContain(".workspace-payment-metric-value.paid");
      expect(cssContent).toContain("#16A34A");
      expect(cssContent).toContain(".workspace-payment-metric-value.outstanding");
      expect(cssContent).toContain("#D90606");
      expect(cssContent).toContain(".workspace-payment-metric-sub.overdue");
    });

    it("defines metric card shadow and rounded radius 14px", () => {
      expect(cssContent).toContain(".workspace-payment-metric-card");
      expect(cssContent).toContain("border-radius: 14px");
      expect(cssContent).toContain("box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.06)");
    });
  });

  describe("Payment Schedule Container & Header (Frame 2147225072 / 2147225065)", () => {
    it("renders PAYMENT SCHEDULE header title with letter-spacing and uppercase", () => {
      expect(pageContent).toContain("PAYMENT SCHEDULE");
      expect(cssContent).toContain(".workspace-payment-schedule-title");
      expect(cssContent).toContain("text-transform: uppercase");
      expect(cssContent).toContain("letter-spacing: 0.05em");
    });

    it("includes Simulate Client Payment button with 46px height and #FFFFFF style", () => {
      expect(pageContent).toContain("Simulate Client Payment");
      expect(cssContent).toContain(".workspace-payment-btn-simulate");
      expect(cssContent).toContain("height: 46px");
      expect(cssContent).toContain("background: #FFFFFF");
      expect(cssContent).toContain("border: 1px solid #E2E8F0");
    });

    it("includes Record Payment button with 46px height and #2563EB style", () => {
      expect(pageContent).toContain("Record Payment");
      expect(cssContent).toContain(".workspace-payment-btn-record");
      expect(cssContent).toContain("height: 46px");
      expect(cssContent).toContain("background: #2563EB");
      expect(cssContent).toContain("color: #FFFFFF");
    });
  });

  describe("Inner Table Panel & Columns (Frame 93 & Frame 57)", () => {
    it("defines table panel with 14px border radius and 20px padding", () => {
      expect(cssContent).toContain(".workspace-payment-table-panel");
      expect(cssContent).toContain("border-radius: 14px");
      expect(cssContent).toContain("box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.06)");
      expect(cssContent).toContain("padding: 20px");
    });

    it("renders column headers with neutral #F8FAFC background and readable text", () => {
      expect(cssContent).toContain(".workspace-payment-table-head");
      expect(cssContent).toContain("background: #F8FAFC");
      expect(cssContent).toContain("color: #475569");
      expect(cssContent).toContain("text-transform: uppercase");

      expect(pageContent).toContain(">STAGE<");
      expect(pageContent).toContain(">TRANSACTION DATE<");
      expect(pageContent).toContain(">DUE DATE<");
      expect(pageContent).toContain(">AMOUNT<");
      expect(pageContent).toContain(">INVOICED<");
      expect(pageContent).toContain(">PAID<");
      expect(pageContent).toContain(">STATUS<");
    });

    it("enforces table row height of 56px and border-bottom #EBEBEB", () => {
      expect(cssContent).toContain(".workspace-payment-table-row");
      expect(cssContent).toContain("height: 56px");
      expect(cssContent).toContain("border-bottom: 1px solid #EBEBEB");
    });

    it("renders stage column with 8px #2563EB indicator dot", () => {
      expect(cssContent).toContain(".workspace-payment-stage-dot");
      expect(cssContent).toContain("background: #2563EB");
      expect(cssContent).toContain("border-radius: 50%");
      expect(pageContent).toContain("workspace-payment-stage-dot");
      expect(pageContent).toContain("Client Dashboard");
      expect(pageContent).toContain("Manual Entry");
    });

    it("renders invoice link with underline blue style or No in red", () => {
      expect(cssContent).toContain(".workspace-payment-invoice-link");
      expect(cssContent).toContain("color: #2563EB");
      expect(cssContent).toContain("text-decoration: underline");
      expect(cssContent).toContain(".workspace-payment-invoice-no");
      expect(cssContent).toContain("color: #D90606");
      expect(pageContent).toContain("workspace-payment-invoice-link");
      expect(pageContent).toContain("workspace-payment-invoice-no");
    });

    it("supports status badge pills: PAID, OVERDUE, PARTIAL, UPCOMING", () => {
      expect(cssContent).toContain(".workspace-payment-badge.paid");
      expect(cssContent).toContain(".workspace-payment-badge.overdue");
      expect(cssContent).toContain(".workspace-payment-badge.partial");
      expect(cssContent).toContain(".workspace-payment-badge.upcoming");
      expect(pageContent).toContain("workspace-payment-badge");
    });

    it("provides 3-dots action dropdown menu with View Details, Record Payment, and Download PDF", () => {
      expect(pageContent).toContain("workspace-payment-action-btn");
      expect(pageContent).toContain("workspace-payment-menu-dropdown");
      expect(pageContent).toContain("View Transaction Details");
      expect(pageContent).toContain("Record Payment");
      expect(pageContent).toContain("Download Invoice PDF");
      expect(cssContent).toContain(".workspace-payment-menu-dropdown");
    });

    it("retains empty state message for zero invoices", () => {
      expect(pageContent).toContain(
        "No invoices or payment records are linked to this project. Click Record Payment to add a transaction."
      );
    });
  });

  describe("Simulate Client Payment Modal", () => {
    it("defines SimulatePaymentModal with invoice selection, amount, method, and reference", () => {
      expect(pageContent).toContain("function SimulatePaymentModal");
      expect(pageContent).toContain("Simulate Client Payment");
      expect(pageContent).toContain("Select Invoice / Milestone *");
      expect(pageContent).toContain("Amount to Pay (₹) *");
      expect(pageContent).toContain("Payment Method");
      expect(pageContent).toContain("Simulated Reference ID");
      expect(pageContent).toContain("Simulate Payment");
    });

    it("integrates recordPayment API on simulation submission", () => {
      expect(pageContent).toContain("await recordPayment(invoiceId,");
      expect(pageContent).toContain("Simulated online client payment from project dashboard");
    });
  });

  describe("Comprehensive Audit Preservations", () => {
    it("preserves PaymentDetailsDrawer and its required transaction strings", () => {
      expect(pageContent).toContain("function PaymentDetailsDrawer");
      expect(pageContent).toContain("TRANSACTION RECORD");
      expect(pageContent).toContain("Transaction Metadata");
      expect(pageContent).toContain("Payment Timeline");
      expect(pageContent).toContain("Payment Receipt");
    });

    it("preserves RecordPaymentModal and all tested input labels", () => {
      expect(pageContent).toContain("function RecordPaymentModal");
      expect(pageContent).toContain("Payment For (Milestone)");
      expect(pageContent).toContain("Linked Invoice *");
      expect(pageContent).toContain("Amount Received (₹) *");
      expect(pageContent).toContain("Reference / Cheque / UTR ID");
      expect(pageContent).toContain("Payment Date *");
      expect(pageContent).toContain("Payment Time");
      expect(pageContent).toContain("Receipt / Proof of Payment");
      expect(pageContent).toContain("Notes / Remarks");
    });
  });
});
