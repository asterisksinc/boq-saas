import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("User Dashboard → Billing → Manage Plan Redesign (Figma CSS Alignment)", () => {
    const pagePath = join(process.cwd(), "app", "billing", "manage-plan", "page.tsx");
    const cssPath = join(process.cwd(), "app", "billing", "billing-redesign.css");

    it("verifies required manage-plan page and billing redesign stylesheet exist", () => {
        expect(existsSync(pagePath)).toBe(true);
        expect(existsSync(cssPath)).toBe(true);
    });

    describe("1. Layout Width & Elimination of Excessive Left/Right Gaps", () => {
        it("ensures .mp-page-body fills the parent dashboard content width without restrictive max-width or centering margins", () => {
            const css = readFileSync(cssPath, "utf8");

            // Must NOT constrain .mp-page-body with fixed 1326px max-width or centering margins
            expect(css).toMatch(/\.billing-page-body\.mp-page-body,\s*\.mp-page-body\s*\{[^}]*width:\s*100%/);
            expect(css).toMatch(/\.billing-page-body\.mp-page-body,\s*\.mp-page-body\s*\{[^}]*max-width:\s*none/);
            expect(css).toMatch(/\.billing-page-body\.mp-page-body,\s*\.mp-page-body\s*\{[^}]*margin:\s*0/);

            // Must NOT force width: 100vw which causes horizontal scrollbar overflow
            expect(css).not.toContain("width: 100vw");
        });

        it("ensures outer section cards and inner cards expand to full available container width", () => {
            const css = readFileSync(cssPath, "utf8");

            expect(css).toMatch(/\.mp-section-wrapper,\s*\.mp-section-card\s*\{[^}]*width:\s*100%/);
            expect(css).toMatch(/\.mp-inner-card\s*\{[^}]*width:\s*100%/);
        });
    });

    describe("2. Figma Visual Foundation & Design Tokens", () => {
        it("matches Figma color palette, borders, shadows, and radii", () => {
            const css = readFileSync(cssPath, "utf8");

            // Colors
            expect(css).toContain("#F1F5F9"); // Page background
            expect(css).toContain("#2563EB"); // Primary blue
            expect(css).toContain("#0F172A"); // Primary dark text
            expect(css).toContain("#64748B"); // Secondary muted text
            expect(css).toContain("#E4ECFB"); // Add-on circle icon background
            expect(css).toContain("#E2E8F0"); // Border color
            expect(css).toContain("#EBEBEB"); // Divider line
            expect(css).toContain("#16A34A"); // Success / active badge green

            // Translucency & gradients
            expect(css).toContain("rgba(255, 255, 255, 0.6)");
            expect(css).toContain("linear-gradient(0deg, #FFFFFF, #FFFFFF)");
            expect(css).toContain("0px 0px 6px rgba(0, 0, 0, 0.06)");

            // Radii
            expect(css).toContain("border-radius: 6px"); // Outer section and button radius
            expect(css).toContain("border-radius: 14px"); // Inner card radius
            expect(css).toContain("border-radius: 48px"); // Circular icon radius
            expect(css).toContain("border-radius: 9999px"); // Pill badge radius

            // Typography
            expect(css).toContain("'Urbanist'");
        });
    });

    describe("3. Parent Dashboard Shell & Navigation", () => {
        it("preserves parent User Dashboard layout without duplicate global controls", () => {
            const page = readFileSync(pagePath, "utf8");

            // Imports stylesheet
            expect(page).toContain('import "../billing-redesign.css";');

            // Preserves DashboardRail and DashboardHeader
            expect(page).toContain("<DashboardRail");
            expect(page).toContain('<DashboardHeader title="Billing"');

            // Does not duplicate search bars or notifications in page body
            expect(page).not.toContain('<input placeholder="Search..."');
            expect(page).not.toContain("fig-dashboard-search");
        });

        it("renders back button with ArrowLeft and 'Manage Plan' heading", () => {
            const page = readFileSync(pagePath, "utf8");

            expect(page).toContain("className=\"mp-back-btn\"");
            expect(page).toContain("<ArrowLeft");
            expect(page).toContain("Manage Plan");
            expect(page).toContain('router.push("/billing")');
        });
    });

    describe("4. Section 1: YOUR CURRENT PLAN", () => {
        it("renders current plan summary with active status, price, 3-column metadata box, and footer", () => {
            const page = readFileSync(pagePath, "utf8");

            // Section label
            expect(page).toContain("YOUR CURRENT PLAN");

            // Inner card
            expect(page).toContain("className=\"mp-inner-card\"");

            // Header details
            expect(page).toContain("className=\"mp-current-name\"");
            expect(page).toContain("className=\"mp-status-pill\"");
            expect(page).toContain("Current Plan Price");
            expect(page).toContain("className=\"mp-current-price\"");
            expect(page).toContain("className=\"mp-current-interval\"");

            // 3-Column metadata box (Renews, Billing Frequency, Payment method)
            expect(page).toContain("className=\"mp-current-meta-box\"");
            expect(page).toContain("Renews");
            expect(page).toContain("Billing Frequency");
            expect(page).toContain("Payment method");
            expect(page).toContain("className=\"mp-meta-divider\"");

            // Footer row with Add-ons line and Last updated timestamp
            expect(page).toContain("className=\"mp-current-footer\"");
            expect(page).toContain("Add-ons:");
            expect(page).toContain("Last updated: Today,");
        });
    });

    describe("5. Section 2: INCLUDED WITH YOUR PLAN", () => {
        it("renders 3x3 grid containing all 9 feature entitlements", () => {
            const page = readFileSync(pagePath, "utf8");

            expect(page).toContain("INCLUDED WITH YOUR PLAN");
            expect(page).toContain("className=\"mp-included-grid\"");

            const requiredFeatures = [
                "Users",
                "Projects",
                "BOQs",
                "Templates",
                "Integrations",
                "Reports",
                "Support",
                "Storage",
                "AI usage",
            ];

            for (const feat of requiredFeatures) {
                expect(page).toContain(`label: "${feat}"`);
            }
        });
    });

    describe("6. Section 3: PLAN COMPARISON", () => {
        it("renders 4 responsive plan cards with dynamic pricing, feature rows, and action buttons", () => {
            const page = readFileSync(pagePath, "utf8");

            expect(page).toContain("PLAN COMPARISON");
            expect(page).toContain("className=\"mp-plan-grid\"");
            expect(page).toContain("mp-plan-card");

            // Plan tier names
            expect(page).toContain("Starter");
            expect(page).toContain("Professional");
            expect(page).toContain("Business");
            expect(page).toContain("Enterprise");

            // Active pill for current plan
            expect(page).toContain("mp-plan-active-pill");

            // Action buttons
            expect(page).toContain("Current Plan");
            expect(page).toContain("Select Plan");
            expect(page).toContain("Contact Sales");
        });
    });

    describe("7. Section 4: ADD-ONS (8 Cards)", () => {
        it("renders all 8 Figma add-on cards in a responsive grid", () => {
            const page = readFileSync(pagePath, "utf8");

            expect(page).toContain("ADD-ONS");
            expect(page).toContain("className=\"mp-addon-grid\"");
            expect(page).toContain("className=\"mp-addon-card\"");

            const requiredAddons = [
                {
                    title: "Proposal Generator",
                    desc: "Create branded proposals from approved BOQs.",
                },
                {
                    title: "AI Assistant",
                    desc: "Contextual assistance across estimation and project workflows.",
                },
                {
                    title: "Advanced Reports",
                    desc: "Deeper analytics with configurable dashboards.",
                },
                {
                    title: "Additional Storage",
                    desc: "Extend workflow forms beyond your plan allotment.",
                },
                {
                    title: "Advanced Integrations",
                    desc: "Premium connectors for ERPs and accounting systems",
                },
                {
                    title: "Client Portal",
                    desc: "Give clients a secure space to review and approve BOQs.",
                },
                {
                    title: "White-label Branding",
                    desc: "Remove BOQ branding and apply your own.",
                },
                {
                    title: "Enterprise Support",
                    desc: "Dedicated support with named engineers and SLAs.",
                },
            ];

            for (const addon of requiredAddons) {
                expect(page).toContain(addon.title);
                expect(page).toContain(addon.desc);
            }

            // Pill badge, pricing, and button
            expect(page).toContain("Not Enabled");
            expect(page).toContain("₹X / month");
            expect(page).toContain("Add Add-ons");
            expect(page).toContain("<Plus");
        });
    });

    describe("8. Dynamic Backend Integration & Interactive Modals", () => {
        it("integrates with authoritative backend APIs and preserves modal flows", () => {
            const page = readFileSync(pagePath, "utf8");

            // Backend APIs
            expect(page).toContain("getBillingOverview");
            expect(page).toContain("getPlanPreview");
            expect(page).toContain("changeSubscription");
            expect(page).toContain("updatePaymentMethod");

            // Modals
            expect(page).toContain("PlanChangeConfirmationModal");
            expect(page).toContain("PlanChangeSuccessModal");
            expect(page).toContain("PaymentEditModal");

            // Toast notification
            expect(page).toContain("billing-toast");
        });
    });

    describe("9. Responsive Viewport Adaptations", () => {
        it("defines responsive grid columns for desktop, tablet, and mobile in CSS", () => {
            const css = readFileSync(cssPath, "utf8");

            // 1200px breakpoint: 2-column grids for plan and addon cards
            expect(css).toContain("@media (max-width: 1200px)");
            expect(css).toContain(".mp-plan-grid,\n    .mp-addon-grid {\n        grid-template-columns: repeat(2, minmax(0, 1fr));\n    }");

            // 900px breakpoint: 2 columns for included grid, stacked metadata box
            expect(css).toContain("@media (max-width: 900px)");
            expect(css).toContain(".mp-included-grid {\n        grid-template-columns: repeat(2, minmax(0, 1fr));\n    }");

            // 640px breakpoint: 1-column stacked layout
            expect(css).toContain("@media (max-width: 640px)");
            expect(css).toContain(".mp-plan-grid,\n    .mp-addon-grid,\n    .mp-included-grid {\n        grid-template-columns: 1fr;\n    }");
        });
    });

    describe("10. Sticky Plan Change Navigation Bar (Frame 2147225331)", () => {
        it("verifies sticky navigation bar CSS classes match Frame 2147225331 design tokens", () => {
            const css = readFileSync(cssPath, "utf8");

            // Fixed container wrapper pinned to bottom, positioned safely inside .fig-dashboard-main
            expect(css).toContain(".plan-change-bar-wrapper {");
            expect(css).toContain("position: fixed;");
            expect(css).toContain("bottom: 24px;");
            expect(css).toContain("left: 98px;");
            expect(css).toContain("right: 16px;");
            expect(css).toContain("pointer-events: none;");

            // Bar container: White, blue border, rounded, box shadow, max-width 1028px
            expect(css).toContain(".plan-change-bar {");
            expect(css).toContain("background: #FFFFFF;");
            expect(css).toContain("border: 1px solid #2563EB;");
            expect(css).toContain("box-shadow: 0px 10px 20px -4px rgba(2, 6, 23, 0.1);");
            expect(css).toContain("border-radius: 6px;");
            expect(css).toContain("max-width: 1028px;");
            expect(css).toContain("min-height: 71px;");
            expect(css).toContain("padding: 14px;");
            expect(css).toContain("pointer-events: auto;");

            // Typography & Colors
            expect(css).toContain(".plan-change-bar-label {");
            expect(css).toContain("color: #64748B;");
            expect(css).toContain(".plan-change-bar-label.target {");
            expect(css).toContain("color: #2563EB;");
            expect(css).toContain(".plan-change-bar-val {");
            expect(css).toContain("color: #0F172A;");
            expect(css).toContain(".plan-change-bar-cancel {");
            expect(css).toContain("color: #0F172A;");

            // Review Change button: Primary blue #2563EB, 32px height, 6px radius, min-width 136px
            expect(css).toContain(".plan-change-bar-review {");
            expect(css).toContain("background: #2563EB;");
            expect(css).toContain("color: #FFFFFF;");
            expect(css).toContain("border-radius: 6px;");
            expect(css).toContain("min-width: 136px;");
            expect(css).toContain("height: 32px;");

            // Selected card styling & page body spacing
            expect(css).toContain(".mp-plan-card.mp-plan-selected {");
            expect(css).toContain("border-color: #2563EB;");
            expect(css).toContain(".billing-page-body.mp-page-body.has-plan-bar");
        });

        it("verifies PlanChangeBar component structure, card selection, and state wiring in page.tsx", () => {
            const page = readFileSync(pagePath, "utf8");

            // PlanChangeBar component exists
            expect(page).toContain("function PlanChangeBar(");
            expect(page).toContain("role=\"region\"");
            expect(page).toContain("aria-label=\"Plan change summary\"");

            // Frame 2147225331 labels and content
            expect(page).toContain("CURRENT PLAN");
            expect(page).toContain("UPGRADING TO");
            expect(page).toContain("DOWNGRADING TO");
            expect(page).toContain("Cancel");
            expect(page).toContain("Review Change");
            expect(page).toContain("<ArrowUpRight");

            // Dynamic rendering: Only when target plan is selected and different from current plan
            expect(page).toContain("showPlanBar");
            expect(page).toContain("<PlanChangeBar");
            expect(page).toContain("has-plan-bar");

            // Plan Comparison card selection state
            expect(page).toContain("isSelected");
            expect(page).toContain("mp-plan-selected");
            expect(page).toContain("mp-plan-selected-pill");
            expect(page).toContain("Selected");

            // Action triggers
            expect(page).toContain("handleSelectPlan");
            expect(page).toContain("handleReviewChange");
            expect(page).toContain("setSelectedPlanCode(null)");
        });

        it("verifies responsive CSS overrides for the sticky bar on mobile and tablet screens", () => {
            const css = readFileSync(cssPath, "utf8");

            // Mobile breakpoint adapts left and right bounds to full container width
            expect(css).toContain("@media (max-width: 760px)");
            expect(css).toContain("left: 16px;");
            expect(css).toContain("right: 16px;");
            expect(css).toContain("bottom: 16px;");

            // Small screens stack or wrap bar columns gracefully
            expect(css).toContain("@media (max-width: 640px)");
            expect(css).toContain(".plan-change-bar {");
            expect(css).toContain("flex-direction: column;");
        });
    });

    describe("11. Plan Change Confirmation Modal (Frame 2147225092 & Rectangle 69)", () => {
        it("verifies PlanChangeConfirmationModal CSS matches Figma exact specifications", () => {
            const css = readFileSync(cssPath, "utf8");

            // Modal Overlay (Rectangle 69)
            expect(css).toContain(".plan-modal-overlay {");
            expect(css).toContain("background: rgba(0, 0, 0, 0.2);");
            expect(css).toContain("backdrop-filter: blur(7px);");

            // Outer modal container (Frame 2147225092): 590px width, frosted glass surface
            expect(css).toContain(".pcm-modal {");
            expect(css).toContain("max-width: 590px;");
            expect(css).toContain("background: rgba(255, 255, 255, 0.6);");
            expect(css).toContain("border-radius: 16px;");
            expect(css).toContain("padding: 16px;");
            expect(css).toContain("gap: 16px;");

            // Inner white container (Frame 2147225027): 14px radius, pure white background
            expect(css).toContain(".pcm-inner-card {");
            expect(css).toContain("background: #FFFFFF;");
            expect(css).toContain("border-radius: 14px;");
            expect(css).toContain("padding: 16px;");
            expect(css).toContain("gap: 16px;");

            // Current Plan vs New Plan header pair (Frame 2147225505)
            expect(css).toContain(".pcm-plan-card {");
            expect(css).toContain("border: 1px solid #E2E8F0;");
            expect(css).toContain("border-radius: 8px;");
            expect(css).toContain("min-height: 72px;");
            expect(css).toContain(".pcm-plan-card.new-plan {");
            expect(css).toContain("background: rgba(37, 99, 235, 0.1);");
            expect(css).toContain("border: 1px solid #2563EB;");

            // Inner section boxes: 14px radius, 1px #E2E8F0 border, 20px padding
            expect(css).toContain(".pcm-section-box {");
            expect(css).toContain("border: 1px solid #E2E8F0;");
            expect(css).toContain("border-radius: 14px;");
            expect(css).toContain("padding: 20px;");

            // Price Breakdown dividers
            expect(css).toContain(".pcm-divider {");
            expect(css).toContain("background: #EBEBEB;");

            // Change row blue arrow icon
            expect(css).toContain(".pcm-change-arrow-icon {");
            expect(css).toContain("color: #2563EB;");

            // Payment method button (width: 188px, height: 46px, radius: 6px, background: #2563EB)
            expect(css).toContain(".pcm-pm-btn {");
            expect(css).toContain("min-width: 188px;");
            expect(css).toContain("height: 46px;");
            expect(css).toContain("background: #2563EB;");
            expect(css).toContain("border-radius: 6px;");

            // Footer Actions (Frame 2147225069)
            expect(css).toContain(".pcm-footer {");
            expect(css).toContain("height: 46px;");
            expect(css).toContain(".pcm-btn-cancel {");
            expect(css).toContain("min-width: 71px;");
            expect(css).toContain("height: 46px;");
            expect(css).toContain("border-radius: 6px;");
            expect(css).toContain(".pcm-btn-confirm {");
            expect(css).toContain("min-width: 241px;");
            expect(css).toContain("height: 46px;");
            expect(css).toContain("background: #2563EB;");
            expect(css).toContain("border-radius: 6px;");
        });

        it("verifies PlanChangeConfirmationModal component elements and content hierarchy in page.tsx", () => {
            const page = readFileSync(pagePath, "utf8");

            // Modal component declaration & dialog accessibility
            expect(page).toContain("function PlanChangeConfirmationModal(");
            expect(page).toContain("role=\"dialog\"");
            expect(page).toContain("aria-modal=\"true\"");

            // Header hierarchy (Frame 2147225093)
            expect(page).toContain("className=\"pcm-header\"");
            expect(page).toContain("className=\"pcm-title\"");
            expect(page).toContain("className=\"pcm-subtitle\"");
            expect(page).toContain("Review the immediate charge, credit and new limits before confirming.");
            expect(page).toContain("className=\"pcm-close\"");

            // Inner white panel (Frame 2147225027)
            expect(page).toContain("className=\"pcm-inner-card\"");

            // Current Plan vs New Plan (Frame 2147225505)
            expect(page).toContain("CURRENT PLAN");
            expect(page).toContain("NEW PLAN");

            // 5 Inner section boxes
            expect(page).toContain("PRICE BREAKDOWN");
            expect(page).toContain("WHAT CHANGES ON");
            expect(page).toContain("ADD-ON EFFECT");
            expect(page).toContain("No active add-ons on this workspace.");
            expect(page).toContain("PAYMENT METHOD");
            expect(page).toContain("Change Payment Method");

            // Lucide ArrowRight icon in comparison rows
            expect(page).toContain("<ArrowRight");
            expect(page).toContain("pcm-change-arrow-icon");

            // Price Breakdown elements
            expect(page).toContain("plan charge");
            expect(page).toContain("Credit for unused");
            expect(page).toContain("Tax");
            expect(page).toContain("Due today");
            expect(page).toContain("Next renewal on");

            // Footer action buttons (Frame 2147225069)
            expect(page).toContain("className=\"pcm-footer\"");
            expect(page).toContain("className=\"pcm-btn-cancel\"");
            expect(page).toContain("className=\"pcm-btn-confirm\"");
            expect(page).toContain("confirmButtonText");
        });
    });

    describe("12. Plan Change Success Modal (Frame 2147225094 & Frame 2147225096)", () => {
        it("matches Figma design tokens for the Success Modal in billing-redesign.css", () => {
            const css = readFileSync(cssPath, "utf8");

            // Outer Frosted Glass Shell (Frame 2147225094)
            expect(css).toContain(".psm-modal {");
            expect(css).toContain("max-width: 590px;");
            expect(css).toContain("min-height: 343px;");
            expect(css).toContain("background: rgba(255, 255, 255, 0.6);");
            expect(css).toContain("border-radius: 16px;");
            expect(css).toContain("padding: 16px;");
            expect(css).toContain("gap: 16px;");
            expect(css).toContain("backdrop-filter: blur(20px);");

            // Inner White Panel (Frame 2147225096)
            expect(css).toContain(".psm-inner-card {");
            expect(css).toContain("min-height: 249px;");
            expect(css).toContain("background: #FFFFFF;");
            expect(css).toContain("border-radius: 14px;");
            expect(css).toContain("padding: 24px 16px;");
            expect(css).toContain("gap: 16px;");

            // Success Check Icon Circle Wrapper (Frame 2147225105)
            expect(css).toContain(".psm-icon-circle {");
            expect(css).toContain("width: 68px;");
            expect(css).toContain("height: 68px;");
            expect(css).toContain("background: rgba(22, 163, 74, 0.12);");
            expect(css).toContain("border-radius: 100px;");
            expect(css).toContain(".psm-check-icon {");
            expect(css).toContain("width: 28px;");
            expect(css).toContain("height: 28px;");
            expect(css).toContain("color: #16A34A;");

            // Title & Subtitle Group (Frame 2147224969)
            expect(css).toContain(".psm-title-group {");
            expect(css).toContain("max-width: 320px;");
            expect(css).toContain("gap: 6px;");

            // Title typography
            expect(css).toContain(".psm-title {");
            expect(css).toContain("font-size: 18px;");
            expect(css).toContain("font-weight: 600;");
            expect(css).toContain("color: #0F172A;");

            // Subtitle typography
            expect(css).toContain(".psm-subtitle {");
            expect(css).toContain("font-size: 14px;");
            expect(css).toContain("font-weight: 500;");
            expect(css).toContain("color: #64748B;");
            expect(css).toContain("text-align: center;");

            // Metadata Info Box (Frame 2147225460)
            expect(css).toContain(".psm-meta-box {");
            expect(css).toContain("min-height: 53px;");
            expect(css).toContain("background: rgba(226, 232, 240, 0.2);");
            expect(css).toContain("border: 1px solid #E2E8F0;");
            expect(css).toContain("border-radius: 6px;");
            expect(css).toContain("padding: 8px 12px;");
            expect(css).toContain("gap: 16px;");

            // Metadata Columns (Frame 2147225000 & Frame 2147225313)
            expect(css).toContain(".psm-meta-col {");
            expect(css).toContain("gap: 4px;");
            expect(css).toContain(".psm-meta-label {");
            expect(css).toContain("font-size: 12px;");
            expect(css).toContain("color: #64748B;");
            expect(css).toContain(".psm-meta-val {");
            expect(css).toContain("font-size: 14px;");
            expect(css).toContain("color: #0F172A;");

            // Footer Actions (Frame 2147225095)
            expect(css).toContain(".psm-footer {");
            expect(css).toContain("height: 46px;");
            expect(css).toContain("gap: 16px;");

            // Back to Plan Button
            expect(css).toContain(".psm-btn-back {");
            expect(css).toContain("min-width: 105px;");
            expect(css).toContain("height: 46px;");
            expect(css).toContain("background: #FFFFFF;");
            expect(css).toContain("border: 1px solid #E2E8F0;");
            expect(css).toContain("border-radius: 6px;");
            expect(css).toContain("color: #0F172A;");

            // View Subscription Button
            expect(css).toContain(".psm-btn-view {");
            expect(css).toContain("min-width: 141px;");
            expect(css).toContain("height: 46px;");
            expect(css).toContain("background: #2563EB;");
            expect(css).toContain("border: 1px solid #2563EB;");
            expect(css).toContain("border-radius: 6px;");
            expect(css).toContain("color: #FFFFFF;");
        });

        it("verifies PlanChangeSuccessModal component structure and data formatting in page.tsx", () => {
            const page = readFileSync(pagePath, "utf8");

            // Modal component declaration & dialog accessibility
            expect(page).toContain("function PlanChangeSuccessModal(");
            expect(page).toContain("role=\"dialog\"");
            expect(page).toContain("aria-modal=\"true\"");
            expect(page).toContain("aria-labelledby=\"psm-modal-title\"");

            // Outer shell and inner card hierarchy
            expect(page).toContain("className=\"psm-modal\"");
            expect(page).toContain("className=\"psm-inner-card\"");

            // Success Check Icon wrapper & 28px icon
            expect(page).toContain("className=\"psm-icon-wrap\"");
            expect(page).toContain("className=\"psm-icon-circle\"");
            expect(page).toContain("<Check size={28} className=\"psm-check-icon\"");

            // Title & subtitle
            expect(page).toContain("className=\"psm-title-group\"");
            expect(page).toContain("id=\"psm-modal-title\" className=\"psm-title\"");
            expect(page).toContain("className=\"psm-subtitle\"");
            expect(page).toContain("Your plan has been changed to {newPlanName}.");

            // 2-Column Metadata Info Box
            expect(page).toContain("className=\"psm-meta-box\"");
            expect(page).toContain("className=\"psm-meta-col\"");
            expect(page).toContain("className=\"psm-meta-label\"");
            expect(page).toContain("Effective");
            expect(page).toContain("Effective Today");
            expect(page).toContain("Next Renewal");
            expect(page).toContain("{nextRenewalText}");

            // Footer Actions
            expect(page).toContain("className=\"psm-footer\"");
            expect(page).toContain("className=\"psm-btn-back\"");
            expect(page).toContain("Back to Plan");
            expect(page).toContain("className=\"psm-btn-view\"");
            expect(page).toContain("View Subscription");

            // Renewal text formatting using middle dot separator
            expect(page).toContain("nextRenewalText: `${money(renewalAmt, preview.newPlan.currency)} · ${renewalDateStr}`");
        });
    });
});
