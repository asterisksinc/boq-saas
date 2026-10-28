import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Client BOQ Page — Figma CSS Quick Mock Redesign Verification", () => {
    const pagePath = join(process.cwd(), "app", "client", "boq", "page.tsx");
    const cssPath = join(process.cwd(), "app", "client", "client-redesign.css");
    const reviewModalPath = join(process.cwd(), "components", "client", "ReviewBoqModal.tsx");

    it("verifies the Client BOQ page and Review Modal files exist and are intact", () => {
        expect(existsSync(pagePath)).toBe(true);
        expect(existsSync(cssPath)).toBe(true);
        expect(existsSync(reviewModalPath)).toBe(true);
    });

    it("verifies the page shell and header match the User Dashboard design reference", () => {
        const code = readFileSync(pagePath, "utf-8");

        // Uses client redesign shell and background glow
        expect(code).toContain('className="client-redesign-shell"');
        expect(code).toContain('className="client-bg-glow"');

        // Vertical navigation rail with current="/client/boq"
        expect(code).toContain('<ClientDashboardRail current="/client/boq"');

        // Global dashboard header with title="BOQ" and hideNew={true}
        expect(code).toContain('<DashboardHeader');
        expect(code).toContain('title="BOQ"');
        expect(code).toContain("hideNew={true}");
    });

    it("verifies section heading and dynamic BOQ count & approval summary", () => {
        const code = readFileSync(pagePath, "utf-8");

        // Section Title: "Bill of Quantities"
        expect(code).toContain("Bill of Quantities");
        expect(code).toContain('className="client-boq-title"');

        // Summary format: e.g. "5 BOQs | 4 pending approval"
        expect(code).toContain('className="client-boq-subtitle"');
        expect(code).toContain("pending approval");
        expect(code).toContain("total === 1 ?");
    });

    it("verifies the card composition matches the Figma CSS Quick Mock structure", () => {
        const code = readFileSync(pagePath, "utf-8");

        // Outer Card Container (Frame 2147225078)
        expect(code).toContain('className="client-boq-card"');

        // Header Row with BOQ ID and Status Pill (Frame 2147225073)
        expect(code).toContain('className="client-boq-card-header"');
        expect(code).toContain('className="client-boq-card-id"');
        expect(code).toContain('className="client-boq-card-actions"');
        expect(code).toContain("client-boq-status-pill");

        // Three-dot action button
        expect(code).toContain('className="client-boq-dot-btn"');
        expect(code).toContain("MoreHorizontal");

        // Inner Details Panel (Frame 2147225077)
        expect(code).toContain('className="client-boq-details-panel"');
        expect(code).toContain('className="client-boq-meta-container"');

        // Metadata 2x3 Grid (Frames 2147225075 & 2147225076)
        expect(code).toContain("Issued by");
        expect(code).toContain("Estimated Value");
        expect(code).toContain("Issued Date");
        expect(code).toContain("Version");
        expect(code).toContain("Rooms");
        expect(code).toContain("Items");

        // Divider Line (Rectangle 40)
        expect(code).toContain('className="client-boq-divider"');

        // Progress Section with Progress Bar and Percentage (Frame 2147225075 / 2147225082)
        expect(code).toContain('className="client-boq-progress-section"');
        expect(code).toContain('className="client-boq-progress-label"');
        expect(code).toContain('className="client-boq-progress-row"');
        expect(code).toContain('className="client-boq-progress-track"');
        expect(code).toContain('className="client-boq-progress-fill"');
        expect(code).toContain('className="client-boq-progress-text"');
    });

    it("verifies responsive 3-column grid and design tokens in CSS", () => {
        const css = readFileSync(cssPath, "utf-8");

        // 3-column desktop grid with responsive breakpoints
        expect(css).toContain(".client-boq-grid");
        expect(css).toContain("repeat(3, minmax(0, 1fr))");
        expect(css).toContain("@media (max-width: 1200px)");
        expect(css).toContain("repeat(2, minmax(0, 1fr))");
        expect(css).toContain("@media (max-width: 768px)");

        // Card styling matching Frame 2147225078
        expect(css).toContain(".client-boq-card");
        expect(css).toContain("rgba(255, 255, 255, 0.6)");
        expect(css).toContain("border-radius: 6px");

        // Inner details panel matching Frame 2147225077
        expect(css).toContain(".client-boq-details-panel");
        expect(css).toContain("background: #FFFFFF");
        expect(css).toContain("box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.06)");
        expect(css).toContain("border-radius: 8px");

        // Amber progress fill matching Rectangle 68
        expect(css).toContain(".client-boq-progress-fill");
        expect(css).toContain("background: #F59E0B");

        // Status pills matching Frame 2147225014 & 2147225015
        expect(css).toContain(".client-boq-status-pill.approved");
        expect(css).toContain("rgba(22, 163, 74, 0.12)");
        expect(css).toContain("#16A34A");

        expect(css).toContain(".client-boq-status-pill.yet-to-approve");
        expect(css).toContain("rgba(100, 116, 139, 0.12)");
        expect(css).toContain("#64748B");
    });

    it("verifies card interactions and overflow menu options", () => {
        const code = readFileSync(pagePath, "utf-8");

        // Clicking card navigates to BOQ details (Screen 2: Room overview)
        expect(code).toContain("openBoqDetail(item.id)");

        // Three-dot menu popover contains expected actions
        expect(code).toContain("View BOQ");
        expect(code).toContain("Export PDF");
        expect(code).toContain("Review BOQ");
        expect(code).toContain("ReviewBoqModal");
    });

    it("verifies state handling: loading skeleton, empty state, and search no-results state", () => {
        const code = readFileSync(pagePath, "utf-8");

        // Loading state
        expect(code).toContain('aria-label="Loading BOQs"');

        // Empty state vs No search results
        expect(code).toContain("No BOQs available");
        expect(code).toContain("No matching BOQs");
        expect(code).toContain("Clear Search");
    });

    it("verifies Screen 2 (BOQ Detail) layout and components match the Figma CSS Quick Mock", () => {
        const code = readFileSync(pagePath, "utf-8");
        const css = readFileSync(cssPath, "utf-8");

        // Breadcrumbs (Frame 240)
        expect(code).toContain('className="client-boq-breadcrumbs"');
        expect(code).toContain('className="client-boq-crumb-btn"');
        expect(code).toContain('className="client-boq-crumb-current"');
        expect(css).toContain(".client-boq-breadcrumbs");
        expect(css).toContain(".client-boq-crumb-btn");

        // Identity & Header Row (Frame 2147225066)
        expect(code).toContain('className="client-boq-detail-header-row"');
        expect(code).toContain('className="client-boq-detail-identity"');
        expect(code).toContain('className="client-boq-back-circle-btn"');
        expect(code).toContain('className="client-boq-detail-title-group"');
        expect(code).toContain('className="client-boq-detail-title"');
        expect(code).toContain("client-boq-detail-status-pill");
        expect(code).toContain('className="client-boq-detail-subtitle"');

        // Top Actions (Frame 2147225069)
        expect(code).toContain('className="client-boq-detail-actions"');
        expect(code).toContain('className="client-boq-btn-export"');
        expect(code).toContain('className="client-boq-btn-approve"');
        expect(code).toContain("Export PDF");
        expect(code).toContain("Approve BOQ");

        // 2-Column Detail Workspace (Frame 2147225084)
        expect(code).toContain('className="client-boq-detail-workspace"');
        expect(css).toContain(".client-boq-detail-workspace");
        expect(css).toContain("grid-template-columns: minmax(0, 1fr) 310px");

        // Left Main Column & Subhead (Frames 2147225085 & 2147225066)
        expect(code).toContain('className="client-boq-detail-main-col"');
        expect(code).toContain('className="client-boq-detail-subhead"');
        expect(code).toContain('className="client-boq-room-count"');
        expect(code).toContain('className="client-boq-detail-search-wrap"');
        expect(code).toContain('className="client-boq-detail-search-icon-box"');
        expect(code).toContain('className="client-boq-detail-search-input"');
        expect(css).toContain(".client-boq-detail-search-wrap");
        expect(css).toContain("backdrop-filter: blur(20.4px)");

        // Table Card Container & #E4ECFB Header (Frames 2147225072 & 57)
        expect(code).toContain('className="client-boq-detail-table-card"');
        expect(code).toContain('className="client-boq-room-table"');
        expect(css).toContain(".client-boq-room-table thead tr");
        expect(css).toContain("background: #E4ECFB");
        expect(css).toContain("border-radius: 8px");

        // Table Column Headers matching Figma Mock
        expect(code).toContain("#</th>");
        expect(code).toContain("ROOM</th>");
        expect(code).toContain("CATEGORY</th>");
        expect(code).toContain("SPEC</th>");
        expect(code).toContain("UNIT</th>");
        expect(code).toContain("ITEMS</th>");
        expect(code).toContain("AMOUNT (₹)</th>");
        expect(code).toContain("DESCRIPTION</th>");

        // Right Financial Summary Panel (Frame 2147225071)
        expect(code).toContain('className="client-boq-summary-panel"');
        expect(code).toContain('className="client-boq-summary-title"');
        expect(code).toContain("SUMMARY");
        expect(code).toContain('className="client-boq-summary-divider"');
        expect(code).toContain('className="client-boq-summary-breakdown"');
        expect(code).toContain("Subtotal");
        expect(code).toContain("Markup (");
        expect(code).toContain("GST (");
        expect(code).toContain("Grand Total");
        expect(css).toContain(".client-boq-summary-panel");
        expect(css).toContain("background: rgba(255, 255, 255, 0.6)");
        expect(css).toContain("border-radius: 6px");

        // Two Metric Cards (Frames 2147225090, 2147225089, 2147225087)
        expect(code).toContain('className="client-boq-summary-metrics"');
        expect(code).toContain('className="client-boq-summary-metric-card"');
        expect(code).toContain('className="client-boq-summary-metric-label"');
        expect(code).toContain('className="client-boq-summary-metric-val"');
        expect(code).toContain("Rooms Covered");
        expect(code).toContain("Items");
        expect(css).toContain(".client-boq-summary-metric-card");
        expect(css).toContain("background: #F2F3F2");
        expect(css).toContain("border: 1px solid #E2E8F0");
    });

    it("verifies Screen 3 (Room Detail / Master Bedroom mock) layout and components match the Figma CSS Quick Mock", () => {
        const code = readFileSync(pagePath, "utf-8");
        const css = readFileSync(cssPath, "utf-8");

        // Breadcrumbs (Frame 240)
        expect(code).toContain('className="client-boq-breadcrumbs"');
        expect(code).toContain("selectedRoom.name");

        // 2-Column Room Detail Workspace (310px sidebar + flex items panel)
        expect(code).toContain('className="client-room-detail-workspace"');
        expect(css).toContain(".client-room-detail-workspace");
        expect(css).toContain("grid-template-columns: 310px minmax(0, 1fr)");

        // Left Category Sidebar (Frame 2147225071)
        expect(code).toContain('className="client-room-category-sidebar"');
        expect(code).toContain('className="client-room-sidebar-title"');
        expect(code).toContain('className="client-room-sidebar-divider"');
        expect(code).toContain('className="client-room-category-list"');
        expect(code).toContain("client-room-category-btn");
        expect(code).toContain('className="client-room-category-chip"');
        expect(code).toContain("Item {cat.items.length}");
        expect(css).toContain(".client-room-category-sidebar");
        expect(css).toContain(".client-room-category-btn.active");
        expect(css).toContain("rgba(37, 99, 235, 0.1)");

        // Right Items Panel (Frame 2147225072)
        expect(code).toContain('className="client-room-items-panel"');
        expect(code).toContain('className="client-room-panel-header"');
        expect(code).toContain('className="client-room-category-heading"');
        expect(code).toContain('className="client-room-context-subtitle"');
        expect(code).toContain("BOQ Section");
        expect(code).toContain("Back to Rooms");
        expect(code).toContain("Export PDF");
        expect(code).toContain('className="client-room-panel-divider"');
        expect(css).toContain(".client-room-items-panel");

        // Table Structure (10 Columns, #E4ECFB header)
        expect(code).toContain('className="client-room-table-container"');
        expect(code).toContain('className="client-room-table"');
        expect(code).toContain("#</th>");
        expect(code).toContain("ITEM</th>");
        expect(code).toContain("UNIT</th>");
        expect(code).toContain("QTY</th>");
        expect(code).toContain("RATE (₹)</th>");
        expect(code).toContain("WASTE (%)</th>");
        expect(code).toContain("TAX (%)</th>");
        expect(code).toContain("AMOUNT(₹)</th>");
        expect(css).toContain(".client-room-table thead tr");
        expect(css).toContain("background: #E4ECFB");

        // Table Total Summary Bar (Frame 63)
        expect(code).toContain('className="client-room-table-total-bar"');
        expect(code).toContain('className="client-room-total-label"');
        expect(code).toContain('className="client-room-total-values"');
        expect(code).toContain("TOTAL (");
        expect(code).toContain("Qty:");
        expect(css).toContain(".client-room-table-total-bar");
        expect(css).toContain("background: #E4ECFB");

        // Pagination Bar (Frame 2147225166)
        expect(code).toContain('className="client-room-pagination-bar"');
        expect(code).toContain('className="client-room-pagination-count"');
        expect(code).toContain('className="client-room-pagination-pages"');
        expect(code).toContain("client-room-page-btn");
        expect(code).toContain("Total Items:");
        expect(code).toContain("Show per Page:");
        expect(css).toContain(".client-room-pagination-bar");
        expect(css).toContain(".client-room-page-btn.active");
        expect(css).toContain("border-color: #2563EB");
    });

    it("verifies the Approve BOQ / Review Form modal matches the Figma CSS Quick Mock (Frame 2147225095)", () => {
        const modalCode = readFileSync(reviewModalPath, "utf-8");
        const css = readFileSync(cssPath, "utf-8");

        // Modal backdrop and dialog container
        expect(modalCode).toContain("client-review-modal-backdrop");
        expect(modalCode).toContain("client-review-modal-dialog");
        expect(css).toContain(".client-review-modal-backdrop");
        expect(css).toContain("backdrop-filter: blur(7px)");
        expect(css).toContain(".client-review-modal-dialog");
        expect(css).toContain("max-width: 590px");
        expect(css).toContain("rgba(255, 255, 255, 0.6)");
        expect(css).toContain("border-radius: 16px");

        // Modal Header (Frame 2147225093)
        expect(modalCode).toContain("client-review-modal-header");
        expect(modalCode).toContain("client-review-header-title");
        expect(modalCode).toContain("Review BOQ");
        expect(modalCode).toContain("Please review the BOQ and select an action below.");
        expect(modalCode).toContain("client-review-close-btn");

        // Inner White Card (Frame 2147225027)
        expect(modalCode).toContain("client-review-inner-card");
        expect(css).toContain(".client-review-inner-card");
        expect(css).toContain("border-radius: 14px");

        // BOQ Metadata Context Bar (Frame 12)
        expect(modalCode).toContain("client-review-context-box");
        expect(modalCode).toContain("BOQ</span>");
        expect(modalCode).toContain("VERSION</span>");
        expect(modalCode).toContain("TOTAL AMOUNT</span>");
        expect(modalCode).toContain("client-review-context-divider");
        expect(css).toContain(".client-review-context-box");
        expect(css).toContain("background: #F2F3F2");
        expect(css).toContain("border: 1px solid #E2E8F0");

        // Choose One Action Section (Frame 2147225386)
        expect(modalCode).toContain("CHOOSE ONE ACTION");
        expect(modalCode).toContain("client-review-actions-section");
        expect(modalCode).toContain("client-review-options-list");
        expect(modalCode).toContain("client-review-option-card");

        // 4 Decision Options with Exact Titles and Subtitles from Figma
        expect(modalCode).toContain("Approve");
        expect(modalCode).toContain("I have reviewed the BOQ and approve it as submitted");
        expect(modalCode).toContain("Revise with Minor Revisions");
        expect(modalCode).toContain("The BOQ is generally acceptable, but minor changes are required before approval.");
        expect(modalCode).toContain("Revise with Major Revisions");
        expect(modalCode).toContain("Significant changes are required before this BOQ can be approved.");
        expect(modalCode).toContain("Reject");
        expect(modalCode).toContain("I do not approve this BOQ in its current form.");

        // Selected Option Styling in CSS (Frame 2147225092)
        expect(css).toContain(".client-review-option-card.selected");
        expect(css).toContain("border: 1px solid #2563EB");
        expect(css).toContain("box-shadow: 0px 0px 10px rgba(37, 99, 235, 0.25)");

        // Confirmation Checkbox Row (Frame 2147225087)
        expect(modalCode).toContain("client-review-confirm-row");
        expect(modalCode).toContain("I confirm that I have reviewed this BOQ and approve it as submitted.");
        expect(css).toContain(".client-review-confirm-row");
        expect(css).toContain("border: 1px solid #E2E8F0");

        // Conditional Revision & Rejection Form Fields
        expect(modalCode).toContain("Requested Changes");
        expect(modalCode).toContain("Rejection Reason");
        expect(modalCode).toContain("client-review-textarea");

        // Footer Actions (Frame 2147225095 bottom & Frame 2147225097)
        expect(modalCode).toContain("client-review-footer");
        expect(modalCode).toContain("client-review-btn-back");
        expect(modalCode).toContain("client-review-btn-cancel");
        expect(modalCode).toContain("client-review-btn-submit");
        expect(modalCode).toContain("Back");
        expect(modalCode).toContain("Cancel");
        expect(modalCode).toContain("Approve BOQ");

        // Submission Integration & API Contract
        expect(modalCode).toContain("submitClientBoqDecision");
        expect(modalCode).toContain("action: selectedAction");
    });
});
