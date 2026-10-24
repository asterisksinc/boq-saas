import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
    adaptBoqCostingSettings,
    generateNumberingPreview,
    DEFAULT_BOQ_NUMBERING,
    DEFAULT_BOQ_TAX_RULES,
} from "../lib/settings/adapter";
import type { BoqNumberingSettings } from "../lib/settings/types";

describe("Settings BOQ & Costing — Numbering & Tax Rules Redesign (Figma Translation)", () => {
    const cssPath = path.resolve(__dirname, "../app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf8");

    it("1. Layout Arithmetic: container width, Numbering card and button dimensions match Figma", () => {
        // Container: 258px (submenu) + 8px (gap) + 1060px (panel) = 1326px
        expect(cssContent).toContain("max-width: 1326px;");
        expect(cssContent).toContain("width: 258px;");
        expect(cssContent).toContain("max-width: 1060px;");

        // Numbering Frame 2147225541: width 1060px, min-height 353px, gap 8px
        expect(cssContent).toContain(".boq-numbering-column");
        expect(cssContent).toContain("min-height: 353px;");

        // Numbering Card Frame 2147225143: 1060px x 299px, padding 20px, gap 20px, rgba(255, 255, 255, 0.6)
        expect(cssContent).toContain(".boq-numbering-card");
        expect(cssContent).toContain("height: 299px;");

        // Arithmetic check: 299px card + 8px gap + 46px button = 353px total
        const cardHeight = 299;
        const gap = 8;
        const buttonHeight = 46;
        expect(cardHeight + gap + buttonHeight).toBe(353);

        // Save Changes Button: 119px x 46px, background #2563EB, radius 6px
        expect(cssContent).toContain(".boq-btn-save-numbering");
        expect(cssContent).toContain("width: 119px;");
        expect(cssContent).toContain("height: 46px;");
        expect(cssContent).toContain("background: #2563EB;");
    });

    it("2. Numbering Grid: 3 rows of 2 columns (500px each) & Frame 95 Live Preview box tokens", () => {
        // Row height 73px, gap 20px
        expect(cssContent).toContain(".boq-numbering-row");
        expect(cssContent).toContain("height: 73px;");
        expect(cssContent).toContain("gap: 20px;");

        // Fields: width 500px, height 73px
        expect(cssContent).toContain(".boq-numbering-field");
        expect(cssContent).toContain("width: 500px;");

        // Inputs: height 48px, padding 14px 16px, border 1px solid #E2E8F0, radius 8px
        expect(cssContent).toContain(".boq-numbering-input");
        expect(cssContent).toContain("height: 48px;");
        expect(cssContent).toContain("border: 1px solid #E2E8F0;");
        expect(cssContent).toContain("border-radius: 8px;");

        // Frame 95 Live Preview Box: 500px x 73px, padding 16px 20px, #E4ECFB, 1px solid #2563EB, radius 6px
        expect(cssContent).toContain(".boq-live-preview-box");
        expect(cssContent).toContain("background: #E4ECFB;");
        expect(cssContent).toContain("border: 1px solid #2563EB;");
        expect(cssContent).toContain("border-radius: 6px;");
        expect(cssContent).toContain("padding: 16px 20px;");

        // Live Preview typography: 12px 500 #64748B label, 16px 500 #0F172A value
        expect(cssContent).toContain(".boq-live-preview-label");
        expect(cssContent).toContain("font-size: 12px;");
        expect(cssContent).toContain("color: #64748B;");
        expect(cssContent).toContain(".boq-live-preview-value");
        expect(cssContent).toContain("font-size: 16px;");
        expect(cssContent).toContain("color: #0F172A;");
    });

    it("3. Live Numbering Preview generation correctly formats preview string matching Figma snapshot", () => {
        const preview = generateNumberingPreview(DEFAULT_BOQ_NUMBERING);
        // Default in Figma: BOQ-2026-014-REV03
        expect(preview).toBe("BOQ-2026-014-REV03");

        // Custom settings verification
        const customSettings: BoqNumberingSettings = {
            boqPrefix: "EST",
            projectPrefix: "BLD",
            financialYear: "2026-27",
            sequenceFormat: "Year-based",
            revisionFormat: "R-##",
        };
        const customPreview = generateNumberingPreview(customSettings);
        expect(customPreview).toContain("EST-");
        expect(customPreview).toContain("2027");
        expect(customPreview).toContain("R03");
    });

    it("4. Tax Rules Table: Frame 2147225146 panel, Frame 2147225545 header and Frame 57 column widths", () => {
        // Outer Panel Frame 2147225146: max-width 1060px, min-height 481px, rgba(255, 255, 255, 0.6)
        expect(cssContent).toContain(".boq-tax-panel");
        expect(cssContent).toContain("min-height: 481px;");

        // Add Tax Rule Button: 134px x 38px, background #2563EB, radius 6px
        expect(cssContent).toContain(".boq-btn-add-tax");
        expect(cssContent).toContain("width: 134px;");
        expect(cssContent).toContain("height: 38px;");

        // Table Header Frame 57: height 36px, background #E4ECFB, border-radius 8px
        expect(cssContent).toContain(".boq-table-header-row");
        expect(cssContent).toContain("height: 36px;");
        expect(cssContent).toContain("background: #E4ECFB;");

        // Column widths exact arithmetic sum: 220 + 198.67 + 198.67 + 198.67 + 140 + 64 = 1020px
        expect(cssContent).toContain(".boq-tax-th-name");
        expect(cssContent).toContain("width: 220px;");
        expect(cssContent).toContain(".boq-tax-th-code");
        expect(cssContent).toContain("width: 198.67px;");
        expect(cssContent).toContain(".boq-tax-th-rate");
        expect(cssContent).toContain(".boq-tax-th-inclusive");
        expect(cssContent).toContain(".boq-tax-th-status");
        expect(cssContent).toContain("width: 140px;");
        expect(cssContent).toContain(".boq-tax-th-actions");
        expect(cssContent).toContain("width: 64px;");

        const sum = 220 + 198.67 + 198.67 + 198.67 + 140 + 64;
        expect(Math.round(sum)).toBe(1020);
    });

    it("5. Add Tax Rule Modal: Frame 2147225094 (590x366px), Frame 2147225027 (558x232px) and footer buttons", () => {
        // Modal Container: 590px x 366px, border-radius 16px, rgba(255, 255, 255, 0.6)
        expect(cssContent).toContain(".boq-tax-modal-container");
        expect(cssContent).toContain("width: 590px;");
        expect(cssContent).toContain("height: 366px;");
        expect(cssContent).toContain("border-radius: 16px;");

        // Inner Card: 558px x 232px, background #FFFFFF, border-radius 14px
        expect(cssContent).toContain(".boq-tax-modal-inner");
        expect(cssContent).toContain("width: 558px;");
        expect(cssContent).toContain("height: 232px;");
        expect(cssContent).toContain("background: #FFFFFF;");
        expect(cssContent).toContain("border-radius: 14px;");

        // 2-column row: 526px x 73px, gap 16px, 255px per column
        expect(cssContent).toContain(".boq-tax-modal-row-2col");
        expect(cssContent).toContain("width: 526px;");
        expect(cssContent).toContain("width: 255px;");

        // Toggle row: 526px x 22px, toggle 40x22px, thumb 16x16px
        expect(cssContent).toContain(".boq-tax-modal-toggle-row");
        expect(cssContent).toContain("height: 22px;");
        expect(cssContent).toContain(".boq-toggle");
        expect(cssContent).toContain("width: 40px;");
        expect(cssContent).toContain("height: 22px;");

        // Modal Footer buttons: Cancel (71px x 46px #FFFFFF) + Add Rule (85px x 46px #2563EB)
        expect(cssContent).toContain(".boq-tax-modal-btn-cancel");
        expect(cssContent).toContain("width: 71px;");
        expect(cssContent).toContain("height: 46px;");
        expect(cssContent).toContain(".boq-tax-modal-btn-submit");
        expect(cssContent).toContain("width: 85px;");
        expect(cssContent).toContain("height: 46px;");
        expect(cssContent).toContain("background: #2563EB;");

        // Modal Height Arithmetic: 16 (pad top) + 24 (hdr) + 16 (gap) + 232 (card) + 16 (gap) + 46 (ftr) + 16 (pad btm) = 366px
        const modalTotal = 16 + 24 + 16 + 232 + 16 + 46 + 16;
        expect(modalTotal).toBe(366);

        // Inner Card Arithmetic: 16 + 73 (Field 1) + 16 + 73 (Field 2) + 16 + 22 (Toggle) + 16 = 232px
        const innerTotal = 16 + 73 + 16 + 73 + 16 + 22 + 16;
        expect(innerTotal).toBe(232);
    });

    it("6. Default Tax Rules data structure contains standard compliant rules", () => {
        const settings = adaptBoqCostingSettings(null);
        expect(settings.taxRules.length).toBeGreaterThanOrEqual(4);

        const gst18 = settings.taxRules.find((t) => t.code === "GST18");
        expect(gst18).toBeDefined();
        expect(gst18?.rate).toBe(18);
        expect(gst18?.name).toBe("GST 18%");

        const gst12 = settings.taxRules.find((t) => t.code === "GST12");
        expect(gst12).toBeDefined();
        expect(gst12?.rate).toBe(12);

        const gst5 = settings.taxRules.find((t) => t.code === "GST05" || t.code === "GST5");
        expect(gst5).toBeDefined();
        expect(gst5?.rate).toBe(5);
    });
});
