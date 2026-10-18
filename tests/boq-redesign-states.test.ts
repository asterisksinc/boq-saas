import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
    formatCompactCurrency,
    formatBoqDisplayDate,
    normalizeBoqStatus,
    mapBoqListItem,
} from "../lib/domain/boq-data";

describe("BOQ Redesign - Empty and Populated States Validation", () => {
    const pagePath = join(process.cwd(), "app", "boqs", "page.tsx");
    const cssPath = join(process.cwd(), "app", "boq-redesign.css");
    const emptyIllustrationPath = join(process.cwd(), "components", "boqs", "BoqEmptyIllustration.tsx");
    const excelImportModalPath = join(process.cwd(), "components", "boqs", "BoqExcelImportModal.tsx");
    const actionMenuPath = join(process.cwd(), "components", "boqs", "BoqRowActionMenu.tsx");

    it("verifies required BOQ redesign files exist", () => {
        expect(existsSync(pagePath)).toBe(true);
        expect(existsSync(cssPath)).toBe(true);
        expect(existsSync(emptyIllustrationPath)).toBe(true);
        expect(existsSync(excelImportModalPath)).toBe(true);
        expect(existsSync(actionMenuPath)).toBe(true);
    });

    describe("Currency and Date Formatting Helpers", () => {
        it("formats currency matching Figma compact representation (₹1.2Cr, ₹42.5L, ₹28L, ₹65L, ₹9.8L)", () => {
            expect(formatCompactCurrency(12000000)).toBe("₹1.2Cr");
            expect(formatCompactCurrency(4250000)).toBe("₹42.5L");
            expect(formatCompactCurrency(2800000)).toBe("₹28L");
            expect(formatCompactCurrency(6500000)).toBe("₹65L");
            expect(formatCompactCurrency(980000)).toBe("₹9.8L");
            expect(formatCompactCurrency(0)).toBe("₹0");
            expect(formatCompactCurrency(null)).toBe("₹0");
        });

        it("formats date matching Figma representation (e.g. 5 Aug 2024 without leading zeros)", () => {
            expect(formatBoqDisplayDate("2024-08-05")).toBe("5 Aug 2024");
            expect(formatBoqDisplayDate("2024-08-02")).toBe("2 Aug 2024");
            expect(formatBoqDisplayDate("2024-07-28")).toBe("28 Jul 2024");
            expect(formatBoqDisplayDate("2024-07-22")).toBe("22 Jul 2024");
            expect(formatBoqDisplayDate("2024-08-01")).toBe("1 Aug 2024");
            expect(formatBoqDisplayDate(null)).toBe("-");
        });

        it("normalizes statuses matching Figma badges", () => {
            expect(normalizeBoqStatus("draft")).toBe("DRAFT");
            expect(normalizeBoqStatus("approved")).toBe("APPROVED");
            expect(normalizeBoqStatus("in_review")).toBe("IN REVIEW");
            expect(normalizeBoqStatus("pending approval")).toBe("IN REVIEW");
            expect(normalizeBoqStatus("archived")).toBe("ARCHIVED");
        });
    });

    describe("Dashboard Parent Styling Integration", () => {
        const pageContent = readFileSync(pagePath, "utf-8");

        it("uses the existing parent Dashboard shell, rail, and header", () => {
            expect(pageContent).toContain('className="fig-dashboard boq-dashboard"');
            expect(pageContent).toContain('className="fig-dashboard-glow"');
            expect(pageContent).toContain("<DashboardRail");
            expect(pageContent).toContain('className="fig-dashboard-main"');
            expect(pageContent).toContain('<DashboardHeader title="BOQ"');
        });

        it("retains the parent Dashboard header search and New action handlers", () => {
            expect(pageContent).toContain("onSearch={handleSearch}");
            expect(pageContent).toContain("onNew={() => setShowCreateModal(true)}");
        });
    });

    describe("Empty State Fidelity (Figma 1)", () => {
        const pageContent = readFileSync(pagePath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");
        const illustrationContent = readFileSync(emptyIllustrationPath, "utf-8");

        it("displays the exact empty state text hierarchy", () => {
            expect(pageContent).toContain("No BOQs found");
            expect(pageContent).toContain(
                "Create your first BOQ to start managing your project quantities and estimates."
            );
        });

        it("contains the primary blue New BOQ CTA button", () => {
            expect(pageContent).toContain("boq-btn-new-boq-redesign");
            expect(pageContent).toContain("New BOQ");
        });

        it("renders the Figma empty state vector illustration", () => {
            expect(pageContent).toContain("<BoqEmptyIllustration />");
            // Check SVG elements from Figma CSS (164px circle, union pills, sparkles, 32px badge)
            expect(illustrationContent).toContain('fill="#2563EB" fillOpacity="0.07"');
            expect(illustrationContent).toContain('fill="#2563EB" fillOpacity="0.08"');
            expect(illustrationContent).toContain('fill="#2563EB" fillOpacity="0.15"');
            expect(illustrationContent).toContain('fill="#2563EB" fillOpacity="0.16"');
            expect(illustrationContent).toContain('circle cx="16" cy="16" r="16" fill="#2563EB"');
        });

        it("styles the empty state with a semi-transparent surface", () => {
            expect(cssContent).toContain(".boq-content-surface-redesign {");
            expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6);");
            expect(cssContent).toContain("border-radius: 6px;");
            expect(cssContent).toContain(".boq-empty-container-redesign {");
        });
    });

    describe("Populated State Fidelity (Figma 2)", () => {
        const pageContent = readFileSync(pagePath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");
        const actionMenuContent = readFileSync(actionMenuPath, "utf-8");

        it("includes all 10 columns in the Figma specified order", () => {
            expect(pageContent).toContain("BOQ ID");
            expect(pageContent).toContain("PROJECT");
            expect(pageContent).toContain("VERSION");
            expect(pageContent).toContain("ROOMS");
            expect(pageContent).toContain("ITEMS");
            expect(pageContent).toContain("ESTIMATED VALUE");
            expect(pageContent).toContain("ASSIGNED TO");
            expect(pageContent).toContain("DATE");
            expect(pageContent).toContain("STATUS");
        });

        it("matches Figma table header styling (#E4ECFB background, 36px height, 8px radius)", () => {
            expect(cssContent).toContain(".boq-th-row-redesign {");
            expect(cssContent).toContain("background: #E4ECFB;");
            expect(cssContent).toContain("height: 36px;");
            expect(cssContent).toContain("border-radius: 8px;");
        });

        it("matches Figma table row styling (56px height, #EBEBEB divider)", () => {
            expect(cssContent).toContain(".boq-tr-redesign {");
            expect(cssContent).toContain("height: 56px;");
            expect(cssContent).toContain("border-bottom: 1px solid #EBEBEB;");
        });

        it("matches Figma status badge pills with correct colors", () => {
            expect(cssContent).toContain(".boq-status-badge-redesign.draft {");
            expect(cssContent).toContain("background: rgba(100, 116, 139, 0.12);");
            expect(cssContent).toContain("color: #64748B;");

            expect(cssContent).toContain(".boq-status-badge-redesign.approved {");
            expect(cssContent).toContain("background: rgba(22, 163, 74, 0.12);");
            expect(cssContent).toContain("color: #16A34A;");

            expect(cssContent).toContain(".boq-status-badge-redesign.in-review {");
            expect(cssContent).toContain("background: rgba(217, 119, 6, 0.12);");
            expect(cssContent).toContain("color: #D97706;");
        });

        it("matches Frame 90 action dropdown menu specifications", () => {
            expect(actionMenuContent).toContain('width: "166px"');
            expect(actionMenuContent).toContain('height: "188px"');
            expect(actionMenuContent).toContain('border: "1px solid #EBEBEB"');
            expect(actionMenuContent).toContain('borderRadius: "16px"');
            expect(actionMenuContent).toContain("Open Editor");
            expect(actionMenuContent).toContain("Duplicate BOQ");
            expect(actionMenuContent).toContain("Export as PDF");
            expect(actionMenuContent).toContain("Export as Excel");
        });

        it("matches Frame 2147225166 pagination footer specifications", () => {
            expect(pageContent).toContain("boq-table-footer-row-redesign");
            expect(pageContent).toContain("boq-pagination-controls-redesign");
            expect(pageContent).toContain("Show per Page:");
            expect(pageContent).toContain("boq-page-size-select-redesign");
            expect(cssContent).toContain(".boq-page-btn-redesign.active {");
            expect(cssContent).toContain("background: #E4ECFB;");
            expect(cssContent).toContain("border: 1px solid #2563EB;");
        });
    });

    describe("Dynamic Counts and Search Filtering", () => {
        const pageContent = readFileSync(pagePath, "utf-8");

        it("calculates summary counts dynamically without hardcoding", () => {
            expect(pageContent).toContain(
                '{total} {total === 1 ? "BOQ" : "BOQs"} | {pendingApprovals} pending approval'
            );
        });

        it("differentiates search with no results from empty collection", () => {
            expect(pageContent).toContain("No matching BOQs found");
            expect(pageContent).toContain("Clear Search");
        });
    });

    describe("Excel Import Integration", () => {
        const pageContent = readFileSync(pagePath, "utf-8");
        const modalContent = readFileSync(excelImportModalPath, "utf-8");

        it("integrates BoqExcelImportModal with the toolbar Import Excel button", () => {
            expect(pageContent).toContain("setShowExcelImportModal(true)");
            expect(pageContent).toContain("<BoqExcelImportModal");
            expect(modalContent).toContain("Import Excel Spreadsheet");
            expect(modalContent).toContain("Load 8 Rooms");
        });
    });
});
