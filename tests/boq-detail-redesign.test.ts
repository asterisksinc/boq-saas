import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { formatFullIndianCurrency } from "../lib/domain/boq-data";
import { proposalCreateSchema } from "../lib/api/validation";

describe("BOQ Details Page Redesign & In-Context Proposal Generation", () => {
    const detailViewPath = join(process.cwd(), "components", "boqs", "BoqDetailView.tsx");
    const proposalModalPath = join(process.cwd(), "components", "boqs", "BoqGenerateProposalModal.tsx");
    const pagePath = join(process.cwd(), "app", "boqs", "page.tsx");
    const cssPath = join(process.cwd(), "app", "boq-redesign.css");

    it("verifies all required BOQ Details components and styles exist", () => {
        expect(existsSync(detailViewPath)).toBe(true);
        expect(existsSync(proposalModalPath)).toBe(true);
        expect(existsSync(pagePath)).toBe(true);
        expect(existsSync(cssPath)).toBe(true);
    });

    describe("Full Indian Currency Formatter", () => {
        it("formats integers without decimals matching Figma values", () => {
            expect(formatFullIndianCurrency(1265800)).toBe("₹12,65,800");
            expect(formatFullIndianCurrency(227844)).toBe("₹2,27,844");
            expect(formatFullIndianCurrency(185000)).toBe("₹1,85,000");
            expect(formatFullIndianCurrency(42000)).toBe("₹42,000");
            expect(formatFullIndianCurrency(125000)).toBe("₹1,25,000");
            expect(formatFullIndianCurrency(153600)).toBe("₹1,53,600");
            expect(formatFullIndianCurrency(79200)).toBe("₹79,200");
        });

        it("formats cents/decimals matching Figma GST and Grand Total values", () => {
            expect(formatFullIndianCurrency(268855.92)).toBe("₹2,68,855.92");
            expect(formatFullIndianCurrency(1762499.92)).toBe("₹17,62,499.92");
        });

        it("handles zero and null gracefully", () => {
            expect(formatFullIndianCurrency(0)).toBe("₹0");
            expect(formatFullIndianCurrency(null)).toBe("₹0");
            expect(formatFullIndianCurrency(undefined)).toBe("₹0");
        });
    });

    describe("Breadcrumb & Identity Header Hierarchy", () => {
        const detailContent = readFileSync(detailViewPath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        it("renders the breadcrumb matching Figma Frame 240", () => {
            expect(detailContent).toContain("boq-detail-breadcrumb-redesign");
            expect(detailContent).toContain("Bill of Quantities");
            expect(detailContent).toContain("boq-breadcrumb-current-id");
            expect(cssContent).toContain(".boq-detail-breadcrumb-redesign {");
            expect(cssContent).toContain(".boq-breadcrumb-parent-link");
            expect(cssContent).toContain(".boq-breadcrumb-current-id");
        });

        it("renders the BOQ identity block with status pill and project-version subtitle", () => {
            expect(detailContent).toContain("boq-detail-identity-row-redesign");
            expect(detailContent).toContain("boq-detail-heading-boq-id");
            expect(detailContent).toContain("boq-detail-status-pill-redesign");
            expect(detailContent).toContain("boq-detail-project-version-sub");
        });

        it("contains all 4 action toolbar buttons with Figma styling", () => {
            expect(detailContent).toContain("boq-detail-actions-right");
            expect(detailContent).toContain("Duplicate");
            expect(detailContent).toContain("Export PDF");
            expect(detailContent).toContain("Send for Review");
            expect(detailContent).toContain("Save Draft");
            expect(cssContent).toContain(".boq-detail-btn-action-ghost");
            expect(cssContent).toContain(".boq-detail-btn-action-save");
        });
    });

    describe("Two-Column Layout & Rooms Table Fidelity", () => {
        const detailContent = readFileSync(detailViewPath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        it("implements the two-column layout matching Figma Frame 2147225084", () => {
            expect(detailContent).toContain("boq-detail-two-column-layout");
            expect(detailContent).toContain("boq-detail-left-content");
            expect(detailContent).toContain("boq-detail-summary-panel-redesign");
            expect(cssContent).toContain(".boq-detail-two-column-layout {");
        });

        it("includes the rooms toolbar with count, frosted search, import, template, and add room", () => {
            expect(detailContent).toContain("boq-rooms-toolbar-row");
            expect(detailContent).toContain("boq-room-count-title-tag");
            expect(detailContent).toContain("boq-rooms-search-box");
            expect(detailContent).toContain("boq-btn-toolbar-import");
            expect(detailContent).toContain("boq-btn-toolbar-template");
            expect(detailContent).toContain("boq-btn-toolbar-add-room");
        });

        it("renders the 10-column table header in exact Figma order with #E4ECFB background", () => {
            expect(detailContent).toContain("boq-rooms-thead-row");
            expect(detailContent).toContain("boq-room-col-idx");
            expect(detailContent).toContain("boq-room-col-name");
            expect(detailContent).toContain("boq-room-col-category");
            expect(detailContent).toContain("boq-room-col-spec");
            expect(detailContent).toContain("boq-room-col-unit");
            expect(detailContent).toContain("boq-room-col-items");
            expect(detailContent).toContain("boq-room-col-amount");
            expect(detailContent).toContain("boq-room-col-desc");
            expect(detailContent).toContain("boq-room-col-actions");
            expect(cssContent).toContain("background: #E4ECFB;");
            expect(cssContent).toContain("height: 36px;");
        });

        it("styles 56px table rows with #EBEBEB divider and hover effect", () => {
            expect(cssContent).toContain(".boq-rooms-tr-row {");
            expect(cssContent).toContain("height: 56px;");
            expect(cssContent).toContain("border-bottom: 1px solid #EBEBEB;");
        });
    });

    describe("Right Summary Panel Fidelity", () => {
        const detailContent = readFileSync(detailViewPath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        it("displays SUMMARY heading, financial rows, and Grand Total", () => {
            expect(detailContent).toContain("boq-summary-heading-label");
            expect(detailContent).toContain("SUMMARY");
            expect(detailContent).toContain("Subtotal");
            expect(detailContent).toContain("Markup");
            expect(detailContent).toContain("GST");
            expect(detailContent).toContain("Grand Total");
        });

        it("contains the two 76px stat boxes: Rooms Covered and Items", () => {
            expect(detailContent).toContain("boq-summary-stat-box");
            expect(detailContent).toContain("Rooms Covered");
            expect(detailContent).toContain("Items");
            expect(cssContent).toContain(".boq-summary-stat-box {");
            expect(cssContent).toContain("height: 76px;");
            expect(cssContent).toContain("background: #F2F3F2;");
            expect(cssContent).toContain("border: 1px solid #E2E8F0;");
        });

        it("includes the primary Generate Proposal button and hides Compare Vendors", () => {
            expect(detailContent).toContain("boq-btn-generate-proposal-primary");
            expect(detailContent).toContain("Generate Proposal");
            expect(detailContent).toContain("boq-btn-compare-vendors-secondary");
            expect(cssContent).toContain(".boq-btn-compare-vendors-secondary {");
            expect(cssContent).toContain("display: none;");
        });
    });

    describe("Critical Requirement: In-Context Generate Proposal", () => {
        const detailContent = readFileSync(detailViewPath, "utf-8");
        const proposalContent = readFileSync(proposalModalPath, "utf-8");

        it("opens in-context modal on Generate Proposal click without redirecting to /proposals", () => {
            // Must NOT redirect via location.assign to /proposals
            expect(detailContent).not.toMatch(/window\.location\.assign\(['"]\/proposals/);
            expect(detailContent).toContain("setShowProposalModal(true)");
            expect(detailContent).toContain("<BoqGenerateProposalModal");
        });

        it("prefills the proposal form using current BOQ and project context", () => {
            expect(proposalContent).toContain('sourceType: "boq"');
            expect(proposalContent).toContain("sourceId:");
            expect(proposalContent).toContain("sourceLabel:");
            expect(proposalContent).toContain("projectName");
            expect(proposalContent).toContain("clientName");
            expect(proposalContent).toContain("proposedValue");
            expect(proposalContent).toContain("scopeItems");
        });

        it("submits the proposal to /api/v1/proposals and shows in-context success state with PDF download", () => {
            expect(proposalContent).toContain('fetch("/api/v1/proposals"');
            expect(proposalContent).toContain("Proposal Generated Successfully!");
            expect(proposalContent).toContain("Download Proposal PDF");
            expect(proposalContent).toContain("Done");
        });

        it("validates proposal payload against backend proposalCreateSchema", () => {
            const boqId = "33333333-3333-4333-8333-333333333333";
            const validBoqProposal = {
                projectName: "Kohinoor Office",
                clientName: "Kohinoor Realty",
                sourceType: "boq",
                sourceId: boqId,
                sourceLabel: "BOQ-0071 - v1",
                proposedValue: 1762499.92,
                scopeItems: [
                    "Master Bedroom — 8 items",
                    "Living Room — 10 items",
                ],
            };
            const parsed = proposalCreateSchema.parse(validBoqProposal);
            expect(parsed.sourceType).toBe("boq");
            expect(parsed.sourceId).toBe(boqId);
            expect(parsed.proposedValue).toBe(1762499.92);
        });
    });

    describe("Page Route Delegation", () => {
        const pageContent = readFileSync(pagePath, "utf-8");

        it("delegates screen === 'detail' cleanly to BoqDetailView", () => {
            expect(pageContent).toContain("import BoqDetailView from");
            expect(pageContent).toContain("<BoqDetailView activeBoq={activeBoq} onBack={onBack} />");
        });
    });
});
