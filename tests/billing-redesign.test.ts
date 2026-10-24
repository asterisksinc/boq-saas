import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

describe("User Dashboard → Billing Redesign (Figma CSS Alignment)", () => {
    const pagePath = "app/billing/page.tsx";
    const cssPath = "app/billing/billing-redesign.css";

    it("verifies the required billing page and stylesheet files exist", () => {
        expect(existsSync(pagePath)).toBe(true);
        expect(existsSync(cssPath)).toBe(true);
    });

    it("matches Figma visual foundation tokens in billing-redesign.css", () => {
        const css = readFileSync(cssPath, "utf8");

        // Primary colors and backgrounds
        expect(css).toContain("#F1F5F9"); // Main canvas background
        expect(css).toContain("#2563EB"); // Primary blue
        expect(css).toContain("#0F172A"); // Primary dark text
        expect(css).toContain("#64748B"); // Secondary muted text
        expect(css).toContain("#E4ECFB"); // Light blue accent icon background
        expect(css).toContain("#E2E8F0"); // Border color
        expect(css).toContain("#EBEBEB"); // Divider color
        expect(css).toContain("#2A344C"); // Dark card divider

        // Typography
        expect(css).toContain("'Urbanist'");

        // Figma specific gradients and opacities
        expect(css).toContain("linear-gradient(180deg, #2563EB -371.16%, rgba(37, 99, 235, 0) 100%)");
        expect(css).toContain("rgba(255, 255, 255, 0.6)");
        expect(css).toContain("0px 0px 6px rgba(0, 0, 0, 0.06)");

        // Standard dimensions
        expect(css).toContain("height: 46px"); // Button height
        expect(css).toContain("border-radius: 6px"); // Button & outer radius
        expect(css).toContain("border-radius: 14px"); // Inner card radius
        expect(css).toContain("padding: 20px"); // Outer section padding
        expect(css).toContain("max-width: 1326px"); // Reference content width
    });

    it("preserves parent User Dashboard layout without duplicate global header components", () => {
        const page = readFileSync(pagePath, "utf8");

        // Imports stylesheet
        expect(page).toContain('import "./billing-redesign.css";');

        // Preserves parent dashboard shell
        expect(page).toContain("<DashboardRail");
        expect(page).toContain("<DashboardHeader");

        // Does not duplicate search bars or notifications in page body
        expect(page).not.toContain('<input placeholder="Search..."');
        expect(page).not.toContain("fig-dashboard-search");
    });

    it("renders page title and header actions matching Frame 2147225066", () => {
        const page = readFileSync(pagePath, "utf8");

        expect(page).toContain('<h1 className="billing-page-h1">Billing</h1>');
        expect(page).toContain(
            "Manage your plan, usage, billing details, and subscription lifecycle."
        );
        expect(page).toContain("Update Payment Method");
        expect(page).toContain("Manage Plan");
    });

    it("renders BILLING DETAIL section matching Frame 2147225073", () => {
        const page = readFileSync(pagePath, "utf8");

        expect(page).toContain("BILLING DETAIL");
        expect(page).toContain("Billing Account");
        expect(page).toContain("Plan Owner");
        expect(page).toContain("Billing Contact");
    });

    it("renders 3-column Subscription Overview matching Frame 2147225464", () => {
        const page = readFileSync(pagePath, "utf8");

        // Current Plan
        expect(page).toContain("CURRENT PLAN");
        expect(page).toContain("Plan Price");
        expect(page).toContain("Renewal");
        expect(page).toContain("Seats");
        expect(page).toContain("Payment Method");

        // Next Charge
        expect(page).toContain("NEXT CHARGE");
        expect(page).toContain("Including applicable tax");
        expect(page).toContain("Renews on");
        expect(page).toContain("View Details");
        expect(page).toContain("View Renewal Information");

        // Subscription Status (Dark card)
        expect(page).toContain("SUBSCRIPTION STATUS");
        expect(page).toContain("billing-status-dark-card");
        expect(page).toContain("Billing Frequency");
        expect(page).toContain("Billing is scoped to");
    });

    it("renders USAGE SNAPSHOT section matching Frame 2147225074", () => {
        const page = readFileSync(pagePath, "utf8");

        expect(page).toContain("USAGE SNAPSHOT");
        expect(page).toContain("Review Usage");
        expect(page).toContain("Team Members");
        expect(page).toContain("Projects");
        expect(page).toContain("BOQs");
        expect(page).toContain("Storage");
        expect(page).toContain("Leads");
        expect(page).toContain("Dynamic Usage Data");
    });

    it("renders Bottom Row with Payment Method, Billing Contact, and Platform Invoices", () => {
        const page = readFileSync(pagePath, "utf8");

        // Payment Method card
        expect(page).toContain("Active default method");
        expect(page).toContain("DEFAULT");

        // Billing Contact card
        expect(page).toContain("Receives invoices and billing notices");
        expect(page).toContain("Edit Contact");

        // Recent Invoices card (Platform subscription invoices, not project invoices)
        expect(page).toContain("Recent Billing Invoices");
        expect(page).toContain("Platform subscription invoices, not project invoices.");
        expect(page).toContain("View All");
        expect(page).toContain("Download");
        expect(page).toContain("View Invoice");
    });

    it("integrates with authoritative backend APIs and provides functional modals", () => {
        const page = readFileSync(pagePath, "utf8");

        expect(page).toContain("getBillingOverview");
        expect(page).toContain("getDashboardOverview");
        expect(page).toContain("updateBillingContact");
        expect(page).toContain("updatePaymentMethod");
        expect(page).toContain("PaymentEditModal");
        expect(page).toContain("ContactEditModal");
        expect(page).toContain("UpcomingChargeModal");
        expect(page).toContain("RenewalInfoModal");
        expect(page).toContain("AllInvoicesModal");
        expect(page).toContain("InvoiceDetailModal");
    });
});
