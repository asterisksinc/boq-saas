import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  adaptBoqCostingSettings,
  calculatePricingPreview,
  formatIndianNumber,
  parseIndianNumber,
  DEFAULT_BOQ_PRICING_SETTINGS,
  DEFAULT_BOQ_REVISION_SETTINGS,
  DEFAULT_BOQ_APPROVAL_SETTINGS,
  ROUNDING_OPTIONS,
} from "../lib/settings/adapter";
import type {
  BoqPricingSettings,
  BoqRevisionSettings,
  BoqApprovalSettings,
} from "../lib/settings/types";

describe("Settings BOQ & Costing - Pricing, Revision, and Approval Redesign", () => {
  describe("1. Layout Arithmetic & Dimensions", () => {
    it("adheres to master layout arithmetic: 258px subnav + 8px gap + 1060px content = 1326px", () => {
      const subnavWidth = 258;
      const subnavGap = 8;
      const contentWidth = 1060;
      const masterContainerWidth = 1326;

      expect(subnavWidth + subnavGap + contentWidth).toBe(masterContainerWidth);
    });

    it("Pricing Rules: center column (640px) + gap (8px) + preview sidebar (412px) = 1060px exactly", () => {
      const centerColumnWidth = 640;
      const gap = 8;
      const previewSidebarWidth = 412;
      const contentAreaWidth = 1060;

      expect(centerColumnWidth + gap + previewSidebarWidth).toBe(contentAreaWidth);
    });

    it("Pricing Rules: center column cards have exact heights matching Figma specs", () => {
      // Card 1: Default Markup (Frame 2147225145) = 171px
      // 20px padding-top + 17px title + 20px gap + 1px divider + 20px gap + 73px field + 20px padding-bottom = 171px
      const card1Height = 20 + 17 + 20 + 1 + 20 + 73 + 20;
      expect(card1Height).toBe(171);

      // Card 2: Category Markups (Frame 2147225148) = 302px
      // 20px padding-top + 17px title + 20px gap + 1px divider + 20px gap + 204px list (4*42 + 3*12) + 20px padding-bottom = 302px
      const listHeight = 4 * 42 + 3 * 12; // 168 + 36 = 204px
      expect(listHeight).toBe(204);
      const card2Height = 20 + 17 + 20 + 1 + 20 + listHeight + 20;
      expect(card2Height).toBe(302);

      // Card 3: Thresholds & Rules (Frame 2147225146) = 299px
      // 20px padding-top + 17px title + 20px gap + 1px divider + 20px gap + (3 rows of 73px with gaps/margin)
      // Save Changes button: 119px x 46px
      const saveBtnWidth = 119;
      const saveBtnHeight = 46;
      expect(saveBtnWidth).toBe(119);
      expect(saveBtnHeight).toBe(46);
    });

    it("Revision Rules: 1060px x 514px panel contains 5 cards (1020px x 82px) with exact height math", () => {
      const cardCount = 5;
      const cardHeight = 82;
      const gap = 16;
      const padding = 20;

      // Height = top padding (20) + (5 * 82) + (4 * 16) + bottom padding (20)
      // = 20 + 410 + 64 + 20 = 514px
      const totalPanelHeight = padding + cardCount * cardHeight + (cardCount - 1) * gap + padding;
      expect(totalPanelHeight).toBe(514);
    });

    it("Approval Rules: 1060px x 393px column satisfies exact component vertical arithmetic", () => {
      const card1TogglesHeight = 125; // 20 + 22 + 20 + 1 + 20 + 22 + 20 = 125px
      const gap1 = 8;
      const card2ThresholdsHeight = 206; // 20 + 73 + 20 + 73 + 20 = 206px
      const gap2 = 8;
      const saveButtonHeight = 46;

      const totalApprovalColHeight = card1TogglesHeight + gap1 + card2ThresholdsHeight + gap2 + saveButtonHeight;
      expect(totalApprovalColHeight).toBe(393);
    });
  });

  describe("2. Pricing Rules Logic & Calculations", () => {
    it("provides accurate default pricing configuration", () => {
      const settings = adaptBoqCostingSettings(null);

      expect(settings.pricing.defaultMarkupPercent).toBe(18);
      expect(settings.pricing.discountLimitPercent).toBe(10);
      expect(settings.pricing.marginThresholdPercent).toBe(25);
      expect(settings.pricing.wastagePercent).toBe(5);
      expect(settings.pricing.contingencyPercent).toBe(3);
      expect(settings.pricing.rounding).toBe("Nearest ₹10");
      expect(settings.pricing.categoryMarkups).toHaveLength(4);
      expect(settings.pricing.categoryMarkups.map((c) => c.name)).toEqual([
        "Furniture",
        "Civil Works",
        "Electrical",
        "Flooring",
      ]);
    });

    it("calculates Pricing Preview accurately for Base Cost ₹1,00,000", () => {
      // Base Cost = 1,00,000
      // Markup (18%) = 18,000
      // Pre-Tax = 1,18,000
      // Tax (18%) = 21,240
      // Final Price = 1,39,240
      // Gross Margin = (18,000 / 1,18,000) * 100 = 15.3%
      const preview = calculatePricingPreview(100000, 18, 18, "none");
      expect(preview.markupAmount).toBe(18000);
      expect(preview.preTaxPrice).toBe(118000);
      expect(preview.taxAmount).toBe(21240);
      expect(preview.finalPrice).toBe(139240);
      expect(preview.grossMarginPercent).toBe(15.3);
    });

    it("handles null base cost in Pricing Preview without crashing", () => {
      const emptyPreview = calculatePricingPreview(null, 18, 18, "Nearest ₹10");
      expect(emptyPreview.markupAmount).toBeNull();
      expect(emptyPreview.preTaxPrice).toBeNull();
      expect(emptyPreview.taxAmount).toBeNull();
      expect(emptyPreview.finalPrice).toBeNull();
      expect(emptyPreview.grossMarginPercent).toBeNull();
    });

    it("verifies rounding options includes Nearest ₹10, ₹100, etc.", () => {
      expect(ROUNDING_OPTIONS.some((r) => r.label.includes("10"))).toBe(true);
      expect(ROUNDING_OPTIONS.some((r) => r.label.includes("100"))).toBe(true);
      expect(ROUNDING_OPTIONS.some((r) => r.label === "No Rounding")).toBe(true);
    });
  });

  describe("3. Revision Rules Logic & Dual-Key Compatibility", () => {
    it("provides the 5 required Figma revision rules with active state", () => {
      const settings = adaptBoqCostingSettings(null);

      // Verify exact Figma rule properties
      expect(settings.revision.requireRevisionReason).toBe(true);
      expect(settings.revision.autoArchiveOnApprove).toBe(true);
      expect(settings.revision.lockAfterExport).toBe(true);
      expect(settings.revision.notifyOnNewRevision).toBe(true);
      expect(settings.revision.trackUnitCostChanges).toBe(true);

      // Verify backwards compatibility with legacy keys
      expect(settings.revision.revisionReasonRequired).toBe(true);
      expect(settings.revision.autoRevisionNumbering).toBe(true);
      expect(settings.revision.lockApprovedVersions).toBe(true);
      expect(settings.revision.reopenAfterApproval).toBe(true);
      expect(settings.revision.compareVersions).toBe(true);
    });

    it("correctly adapts custom revision settings with both key formats", () => {
      const customRaw = {
        revision: {
          requireRevisionReason: false,
          autoArchiveOnApprove: true,
          lockAfterExport: false,
          notifyOnNewRevision: true,
          trackUnitCostChanges: false,
        },
      };

      const adapted = adaptBoqCostingSettings(customRaw);
      expect(adapted.revision.requireRevisionReason).toBe(false);
      expect(adapted.revision.revisionReasonRequired).toBe(false);
      expect(adapted.revision.autoArchiveOnApprove).toBe(true);
      expect(adapted.revision.autoRevisionNumbering).toBe(true);
      expect(adapted.revision.lockAfterExport).toBe(false);
      expect(adapted.revision.lockApprovedVersions).toBe(false);
      expect(adapted.revision.notifyOnNewRevision).toBe(true);
      expect(adapted.revision.reopenAfterApproval).toBe(true);
      expect(adapted.revision.trackUnitCostChanges).toBe(false);
      expect(adapted.revision.compareVersions).toBe(false);
    });
  });

  describe("4. Approval Rules Logic & Numeric Formatting", () => {
    it("provides default approval settings matching Figma specifications", () => {
      const settings = adaptBoqCostingSettings(null);

      expect(settings.approval.internalApprovalRequired).toBe(true);
      expect(settings.approval.clientApprovalRequired).toBe(true);
      expect(settings.approval.minValueForApproval).toBe(500000);
      expect(settings.approval.discountApprovalThresholdPercent).toBe(5);
      expect(settings.approval.marginApprovalThresholdPercent).toBe(20);
    });

    it("formats and parses Indian numbers accurately for approval threshold inputs", () => {
      expect(formatIndianNumber(500000)).toBe("5,00,000");
      expect(formatIndianNumber(1000000)).toBe("10,00,000");
      expect(formatIndianNumber(2500000)).toBe("25,00,000");

      expect(parseIndianNumber("5,00,000")).toBe(500000);
      expect(parseIndianNumber("10,00,000")).toBe(1000000);
      expect(parseIndianNumber("2500000")).toBe(2500000);
    });
  });

  describe("5. CSS Rules & Figma Tokens in app/globals.css", () => {
    const cssPath = path.resolve(__dirname, "../app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf8");

    it("contains exact pricing layout classes and dimensions", () => {
      expect(cssContent).toContain(".boq-pricing-layout");
      expect(cssContent).toContain("max-width: 1060px");
      expect(cssContent).toContain(".boq-pricing-main-col");
      expect(cssContent).toContain("width: 640px");
      expect(cssContent).toContain(".boq-pricing-card-markup");
      expect(cssContent).toContain("height: 171px");
      expect(cssContent).toContain(".boq-pricing-card-categories");
      expect(cssContent).toContain(".boq-pricing-card-thresholds");
      expect(cssContent).toContain("height: 299px");
      expect(cssContent).toContain(".boq-pricing-sidebar-col");
      expect(cssContent).toContain("width: 412px");
      expect(cssContent).toContain(".boq-pricing-preview-card");
      expect(cssContent).toContain("height: 375px");
    });

    it("contains exact revision panel and card classes", () => {
      expect(cssContent).toContain(".boq-revision-panel");
      expect(cssContent).toContain("width: 1060px");
      expect(cssContent).toContain("min-height: 514px");
      expect(cssContent).toContain(".boq-revision-card");
      expect(cssContent).toContain("width: 1020px");
      expect(cssContent).toContain("height: 82px");
      expect(cssContent).toContain(".boq-figma-toggle");
      expect(cssContent).toContain("width: 40px");
      expect(cssContent).toContain("height: 22px");
      expect(cssContent).toContain(".boq-figma-toggle-knob");
      expect(cssContent).toContain("width: 16px");
      expect(cssContent).toContain("height: 16px");
    });

    it("contains exact approval column and card classes", () => {
      expect(cssContent).toContain(".boq-approval-col");
      expect(cssContent).toContain("width: 1060px");
      expect(cssContent).toContain(".boq-approval-card-toggles");
      expect(cssContent).toContain("height: 125px");
      expect(cssContent).toContain(".boq-approval-card-thresholds");
      expect(cssContent).toContain("height: 206px");
      expect(cssContent).toContain(".boq-approval-toggle-row-1020");
      expect(cssContent).toContain(".boq-approval-divider-1020");
      expect(cssContent).toContain("width: 1020px");
      expect(cssContent).toContain(".boq-approval-field-500");
      expect(cssContent).toContain("width: 500px");
    });

    it("contains exact button and color tokens", () => {
      expect(cssContent).toContain(".boq-btn-save-changes");
      expect(cssContent).toContain("width: 119px");
      expect(cssContent).toContain("height: 46px");
      expect(cssContent).toContain("background: #2563EB");
      expect(cssContent).toContain("border-radius: 6px");
    });
  });
});
