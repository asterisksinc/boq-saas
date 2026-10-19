import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Proposals Dashboard UI Redesign", () => {
    const pageContent = readFileSync("app/proposals/page.tsx", "utf8");
    const cssContent = readFileSync("app/proposals/proposals-redesign.css", "utf8");

    it("reuses DashboardRail with active proposals route and DashboardHeader", () => {
        expect(pageContent).toContain('DashboardRail current="/proposals"');
        expect(pageContent).toContain('<DashboardHeader title="Proposals"');
        expect(pageContent).toContain('className="fig-dashboard-glow"');
    });

    it("implements page sub-header with dynamic summary and action buttons", () => {
        expect(pageContent).toContain('className="proposals-sub-header"');
        expect(pageContent).toContain('className="proposals-title-group"');
        expect(pageContent).toContain('awaiting response');
        expect(pageContent).toContain('className="btn-templates"');
        expect(pageContent).toContain('className="btn-new-proposal"');
    });

    it("implements all four KPI cards with dynamic calculations", () => {
        expect(pageContent).toContain('className="proposals-summary-row"');
        expect(pageContent).toContain('Total Sent');
        expect(pageContent).toContain('This quarter');
        expect(pageContent).toContain('Win Rate');
        expect(pageContent).toContain('decided');
        expect(pageContent).toContain('Avg. Value');
        expect(pageContent).toContain('Per proposal');
        expect(pageContent).toContain('Pending Response');
        expect(pageContent).toContain('expiring soon');
    });

    it("maps all 10 columns correctly according to the Figma specification", () => {
        expect(pageContent).toContain('col-th-id');
        expect(pageContent).toContain('col-th-project');
        expect(pageContent).toContain('col-th-client');
        expect(pageContent).toContain('col-th-status');
        expect(pageContent).toContain('col-th-value');
        expect(pageContent).toContain('col-th-sent');
        expect(pageContent).toContain('col-th-expiry');
        expect(pageContent).toContain('col-th-views');
        expect(pageContent).toContain('col-th-date');
        expect(pageContent).toContain('col-th-actions');

        expect(pageContent).toContain('cell-id');
        expect(pageContent).toContain('cell-project');
        expect(pageContent).toContain('cell-client');
        expect(pageContent).toContain('cell-status');
        expect(pageContent).toContain('cell-value');
        expect(pageContent).toContain('cell-sent');
        expect(pageContent).toContain('cell-expiry');
        expect(pageContent).toContain('cell-views');
        expect(pageContent).toContain('cell-date');
        expect(pageContent).toContain('cell-actions');
    });

    it("renders Figma-matching views indicator and not opened states", () => {
        expect(pageContent).toContain('view-indicator-dot');
        expect(pageContent).toContain('view-indicator-inner');
        expect(pageContent).toContain('proposal-views-empty');
        expect(pageContent).toContain('Not opened');
    });

    it("renders row actions and the 6-item more options dropdown", () => {
        expect(pageContent).toContain('btn-preview');
        expect(pageContent).toContain('btn-row-more');
        expect(pageContent).toContain('proposals-dropdown-menu');
        expect(pageContent).toContain('Preview');
        expect(pageContent).toContain('Duplicate');
        expect(pageContent).toContain('Download PDF');
        expect(pageContent).toContain('Send Reminder');
        expect(pageContent).toContain('Mark as Won');
        expect(pageContent).toContain('Mark as Lost');
    });

    it("implements Figma pagination footer with Total Arrivals and Show per Page", () => {
        expect(pageContent).toContain('proposals-pagination');
        expect(pageContent).toContain('Total Arrivals:');
        expect(pageContent).toContain('pagination-controls');
        expect(pageContent).toContain('page-size-control');
        expect(pageContent).toContain('Show per Page:');
        expect(pageContent).toContain('page-size-select-box');
    });

    it("includes required Figma visual styling in proposals-redesign.css", () => {
        // Table header #E4ECFB
        expect(cssContent).toContain('#E4ECFB');
        // Card background rgba(255, 255, 255, 0.6)
        expect(cssContent).toContain('rgba(255, 255, 255, 0.6)');
        // Primary Blue #2563EB
        expect(cssContent).toContain('#2563EB');
        // Subtle divider #EBEBEB
        expect(cssContent).toContain('#EBEBEB');
        // Success green #16A34A
        expect(cssContent).toContain('#16A34A');
        // Dropdown menu border radius 16px and shadow
        expect(cssContent).toContain('border-radius: 16px');
        expect(cssContent).toContain('box-shadow: 0px 16px 32px -12px rgba(14, 18, 27, 0.1)');
        // Urbanist font family
        expect(cssContent).toContain("'Urbanist'");
    });

    it("defines Figma translucent modal overlay (Rectangle 69) and glassmorphic card (Frames 2147225092 & 2147225094)", () => {
        expect(cssContent).toContain(".proposal-modal-overlay");
        expect(cssContent).toMatch(/\.proposal-modal-overlay\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.2\);/);
        expect(cssContent).toMatch(/\.proposal-modal-overlay\s*\{[^}]*backdrop-filter:\s*blur\(7px\);/);

        expect(cssContent).toContain(".proposal-modal-card");
        expect(cssContent).toMatch(/\.proposal-modal-card\s*\{[^}]*max-width:\s*590px;/);
        expect(cssContent).toMatch(/\.proposal-modal-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.60?\);/);
        expect(cssContent).toMatch(/\.proposal-modal-card\s*\{[^}]*border-radius:\s*16px;/);
        expect(cssContent).toMatch(/\.proposal-modal-card\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\);/);
    });

    it("defines modal header with Urbanist font, 18px title, 16px subtitle, and close button", () => {
        expect(cssContent).toContain(".proposal-modal-header");
        expect(cssContent).toContain(".proposal-modal-title");
        expect(cssContent).toMatch(/\.proposal-modal-title\s*\{[^}]*font-family:\s*'Urbanist'/);
        expect(cssContent).toMatch(/\.proposal-modal-title\s*\{[^}]*font-size:\s*18px;/);
        expect(cssContent).toMatch(/\.proposal-modal-title\s*\{[^}]*color:\s*#0F172A;/);

        expect(cssContent).toContain(".proposal-modal-subtitle");
        expect(cssContent).toMatch(/\.proposal-modal-subtitle\s*\{[^}]*font-size:\s*16px;/);
        expect(cssContent).toMatch(/\.proposal-modal-subtitle\s*\{[^}]*color:\s*#64748B;/);

        expect(cssContent).toContain(".proposal-modal-close-btn");
        expect(cssContent).toMatch(/\.proposal-modal-close-btn\s*\{[^}]*width:\s*24px;/);
        expect(cssContent).toMatch(/\.proposal-modal-close-btn\s*\{[^}]*height:\s*24px;/);
    });

    it("defines white inner card (Frames 2147225091 & 2147225027) with border-radius 14px", () => {
        expect(cssContent).toContain(".proposal-modal-inner-card");
        expect(cssContent).toMatch(/\.proposal-modal-inner-card\s*\{[^}]*background:\s*#FFFFFF;/);
        expect(cssContent).toMatch(/\.proposal-modal-inner-card\s*\{[^}]*border-radius:\s*14px;/);
    });

    it("implements Step 1 with 2x2 options grid and exact Figma option cards and buttons", () => {
        expect(pageContent).toContain('className="proposal-options-grid"');
        expect(pageContent).toContain('From Scratch');
        expect(pageContent).toContain('Build a new proposal with a blank');
        expect(pageContent).toContain('From BOQ');
        expect(pageContent).toContain('Proposal from an approved BOQ');
        expect(pageContent).toContain('Duplicate Existing');
        expect(pageContent).toContain('Copy a previous proposal and modify it');
        expect(pageContent).toContain('From Template');
        expect(pageContent).toContain('Use a saved proposal template');

        expect(cssContent).toContain(".proposal-options-grid");
        expect(cssContent).toMatch(/\.proposal-option-card\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
        expect(cssContent).toMatch(/\.proposal-option-card\s*\{[^}]*border-radius:\s*8px;/);
        expect(cssContent).toMatch(/\.proposal-option-card\s*\{[^}]*min-height:\s*95px;/);

        expect(cssContent).toContain(".proposal-btn-cancel");
        expect(cssContent).toMatch(/\.proposal-btn-cancel\s*\{[^}]*width:\s*71px;/);
        expect(cssContent).toMatch(/\.proposal-btn-cancel\s*\{[^}]*height:\s*46px;/);
        expect(cssContent).toMatch(/\.proposal-btn-cancel\s*\{[^}]*background:\s*#FFFFFF;/);
        expect(cssContent).toMatch(/\.proposal-btn-cancel\s*\{[^}]*border-radius:\s*6px;/);

        expect(cssContent).toContain(".proposal-btn-continue");
        expect(cssContent).toMatch(/\.proposal-btn-continue\s*\{[^}]*width:\s*84px;/);
        expect(cssContent).toMatch(/\.proposal-btn-continue\s*\{[^}]*height:\s*46px;/);
        expect(cssContent).toMatch(/\.proposal-btn-continue\s*\{[^}]*background:\s*#2563EB;/);
        expect(cssContent).toMatch(/\.proposal-btn-continue\s*\{[^}]*border-radius:\s*6px;/);
    });

    it("implements Step 2 Proposal Details form with required fields, two-column row, and footer", () => {
        expect(pageContent).toContain('className="proposal-form-field"');
        expect(pageContent).toContain('className="proposal-form-label-row"');
        expect(pageContent).toContain('className="proposal-form-control-box"');
        expect(pageContent).toContain('className="proposal-form-row-2col"');
        expect(pageContent).toContain('className="proposal-form-control-box-textarea"');
        expect(pageContent).toContain('className="proposal-modal-footer-details"');
        expect(pageContent).toContain('className="proposal-btn-back"');
        expect(pageContent).toContain('className="proposal-btn-create"');

        expect(cssContent).toMatch(/\.proposal-form-control-box\s*\{[^}]*height:\s*48px;/);
        expect(cssContent).toMatch(/\.proposal-form-control-box\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
        expect(cssContent).toMatch(/\.proposal-form-control-box\s*\{[^}]*border-radius:\s*8px;/);
        expect(cssContent).toMatch(/\.proposal-form-control-box-textarea\s*\{[^}]*height:\s*85px;/);

        expect(cssContent).toMatch(/\.proposal-btn-back\s*\{[^}]*width:\s*59px;/);
        expect(cssContent).toMatch(/\.proposal-btn-back\s*\{[^}]*height:\s*46px;/);
        expect(cssContent).toMatch(/\.proposal-btn-create\s*\{[^}]*min-width:\s*128px;/);
        expect(cssContent).toMatch(/\.proposal-btn-create\s*\{[^}]*height:\s*46px;/);
    });

    it("ensures the proposal creation modal footer sits on the outer modal background separate from the white form panel", () => {
        // Form has id="proposal-create-form" and ends before footer
        expect(pageContent).toContain('id="proposal-create-form"');
        expect(pageContent).toContain('form="proposal-create-form"');

        // Form closes before the footer wrapper starts
        const formCloseIdx = pageContent.indexOf("</form>\n\n                        {/* Step 2 Footer");
        expect(formCloseIdx).toBeGreaterThan(-1);

        const footerIdx = pageContent.indexOf('className="proposal-modal-footer-details"');
        expect(footerIdx).toBeGreaterThan(formCloseIdx);
    });

    it("implements Figma Proposal Preview modal with exact dimensions, summary card, scope list, and footer", () => {
        // Modal & Inner card structure
        expect(pageContent).toContain('className="proposal-modal-card proposal-preview-card"');
        expect(pageContent).toContain('className="proposal-modal-inner-card proposal-preview-inner-card"');
        expect(pageContent).toContain('className="preview-company-row"');
        expect(pageContent).toContain('className="preview-summary-box"');
        expect(pageContent).toContain('className="preview-scope-dash"');
        expect(pageContent).toContain('className="preview-total-amount"');

        // Preview CSS tokens
        expect(cssContent).toMatch(/\.proposal-preview-card\s*\{[^}]*max-width:\s*720px;/);
        expect(cssContent).toMatch(/\.proposal-preview-inner-card\s*\{[^}]*padding:\s*24px 16px;/);
        expect(cssContent).toMatch(/\.proposal-preview-inner-card\s*\{[^}]*border-radius:\s*14px;/);
        expect(cssContent).toMatch(/\.preview-summary-box\s*\{[^}]*background:\s*#F2F3F2;/);
        expect(cssContent).toMatch(/\.preview-summary-box\s*\{[^}]*border:\s*1px solid #E2E8F0;/);
        expect(cssContent).toMatch(/\.preview-summary-box\s*\{[^}]*border-radius:\s*8px;/);
        expect(cssContent).toMatch(/\.preview-scope-dash\s*\{[^}]*width:\s*10px;/);
        expect(cssContent).toMatch(/\.preview-scope-dash\s*\{[^}]*height:\s*1px;/);
        expect(cssContent).toMatch(/\.preview-scope-dash\s*\{[^}]*background:\s*#64748B;/);
        expect(cssContent).toMatch(/\.preview-total-amount\s*\{[^}]*font-size:\s*28px;/);
        expect(cssContent).toMatch(/\.preview-total-amount\s*\{[^}]*color:\s*#2563EB;/);

        // Preview action buttons
        expect(cssContent).toMatch(/\.proposal-btn-edit\s*\{[^}]*width:\s*52px;/);
        expect(cssContent).toMatch(/\.proposal-btn-edit\s*\{[^}]*height:\s*46px;/);
        expect(cssContent).toMatch(/\.proposal-btn-download-pdf\s*\{[^}]*width:\s*119px;/);
        expect(cssContent).toMatch(/\.proposal-btn-download-pdf\s*\{[^}]*height:\s*46px;/);
        expect(cssContent).toMatch(/\.proposal-btn-download-pdf\s*\{[^}]*background:\s*#2563EB;/);
    });

    it("does not hardcode Figma sample data in production code", () => {
        expect(pageContent).not.toContain('"Oberoi Residence - Bandra"');
        expect(pageContent).not.toContain('"Nikhil Oberoi"');
        expect(pageContent).not.toContain('"Kohinoor Office - L4"');
        expect(pageContent).not.toContain('"Westin Hotels - Suites"');
    });
});

