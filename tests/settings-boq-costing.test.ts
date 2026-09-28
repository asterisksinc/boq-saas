import { describe, expect, it } from "vitest";
import {
  adaptBoqCostingSettings,
  generateNumberingPreview,
  calculatePricingPreview,
  formatIndianNumber,
  parseIndianNumber,
  DEFAULT_BOQ_UNITS,
  DEFAULT_BOQ_NUMBERING,
  DEFAULT_BOQ_TAX_RULES,
  DEFAULT_CATEGORY_MARKUPS,
  DEFAULT_BOQ_PRICING_SETTINGS,
  DEFAULT_BOQ_REVISION_SETTINGS,
  DEFAULT_BOQ_APPROVAL_SETTINGS,
} from "../lib/settings/adapter";
import type { BoqCostingSettingsData, BoqNumberingSettings } from "../lib/settings/types";

describe("Settings BOQ & Costing Adapter & Continuous Screens", () => {
  it("provides comprehensive default configuration matching reference designs", () => {
    const settings = adaptBoqCostingSettings(null);

    // Units verification (Design 1 & 2)
    expect(settings.units.length).toBeGreaterThanOrEqual(12);
    expect(settings.units.some((u) => u.name === "Sq ft" && u.code === "sft")).toBe(true);
    expect(settings.units.some((u) => u.name === "Kg" && u.code === "Kg")).toBe(true);
    expect(settings.units.some((u) => u.name === "Hour" && u.type === "Time")).toBe(true);

    // Tax Rules verification (Design 4 & 5)
    expect(settings.taxRules.length).toBeGreaterThanOrEqual(5);
    expect(settings.taxRules.some((t) => t.rate === 18 && t.inclusive === false)).toBe(true);
    expect(settings.taxRules.some((t) => t.rate === 5 && t.inclusive === false)).toBe(true);

    // Pricing Rules verification (Reference Screen 1)
    expect(settings.pricing.defaultMarkupPercent).toBe(18);
    expect(settings.pricing.categoryMarkups.length).toBe(4);
    expect(settings.pricing.categoryMarkups.find((c) => c.name === "Furniture")?.markupPercent).toBe(20);
    expect(settings.pricing.categoryMarkups.find((c) => c.name === "Civil Works")?.markupPercent).toBe(15);
    expect(settings.pricing.categoryMarkups.find((c) => c.name === "Electrical")?.markupPercent).toBe(18);
    expect(settings.pricing.categoryMarkups.find((c) => c.name === "Flooring")?.markupPercent).toBe(12);
    expect(settings.pricing.discountLimitPercent).toBe(10);
    expect(settings.pricing.marginThresholdPercent).toBe(25);
    expect(settings.pricing.wastagePercent).toBe(5);
    expect(settings.pricing.contingencyPercent).toBe(3);
    expect(settings.pricing.rounding).toBe("Nearest ₹10");

    // Revision Rules verification (Reference Screen 2)
    expect(settings.revision.autoRevisionNumbering).toBe(true);
    expect(settings.revision.revisionReasonRequired).toBe(true);
    expect(settings.revision.lockApprovedVersions).toBe(true);
    expect(settings.revision.reopenAfterApproval).toBe(true);
    expect(settings.revision.compareVersions).toBe(true);

    // Approval Rules verification (Reference Screen 3)
    expect(settings.approval.internalApprovalRequired).toBe(true);
    expect(settings.approval.clientApprovalRequired).toBe(true);
    expect(settings.approval.minValueForApproval).toBe(500000);
    expect(settings.approval.discountApprovalThresholdPercent).toBe(5);
    expect(settings.approval.marginApprovalThresholdPercent).toBe(20);
  });

  it("generates correct reactive live numbering preview matching Screenshot 3 reference", () => {
    const preview = generateNumberingPreview(DEFAULT_BOQ_NUMBERING);
    // Screenshot 3 displays BOQ-2026-014-REV03
    expect(preview).toBe("BOQ-2026-014-REV03");
  });

  it("reactively adapts numbering live preview when configuration changes", () => {
    const customNumbering: BoqNumberingSettings = {
      boqPrefix: "EST",
      projectPrefix: "INT",
      financialYear: "2024-25",
      sequenceFormat: "Year-based (e.g. 2026-001)",
      revisionFormat: "R-##",
    };

    const preview = generateNumberingPreview(customNumbering);
    expect(preview).toBe("EST-2025-014-R03");
  });

  it("calculates Pricing Preview accurately based on base cost, markup, tax, and rounding", () => {
    // Empty base cost should yield null (rendering '-' in UI)
    const emptyPreview = calculatePricingPreview(null, 18, 18, "Nearest ₹10");
    expect(emptyPreview.markupAmount).toBeNull();
    expect(emptyPreview.finalPrice).toBeNull();
    expect(emptyPreview.grossMarginPercent).toBeNull();

    // 10,000 base cost with 18% markup, 18% tax, Nearest ₹10 rounding
    // Markup = 1,800 -> Pre-tax = 11,800 -> Tax 18% = 2,124 -> Final = 13,924
    // Gross margin = (1,800 / 11,800) * 100 = 15.3%
    const calc = calculatePricingPreview(10000, 18, 18, "Nearest ₹10");
    expect(calc.markupAmount).toBe(1800);
    expect(calc.preTaxPrice).toBe(11800);
    expect(calc.taxAmount).toBe(2124);
    expect(calc.finalPrice).toBe(13924);
    expect(calc.grossMarginPercent).toBe(15.3);
  });

  it("formats Indian numbers with commas correctly for approval amounts", () => {
    expect(formatIndianNumber(500000)).toBe("5,00,000");
    expect(formatIndianNumber(1250000)).toBe("12,50,000");
    expect(formatIndianNumber(10000000)).toBe("1,00,00,000");
    expect(parseIndianNumber("5,00,000")).toBe(500000);
    expect(parseIndianNumber("  12,50,000 ")).toBe(1250000);
  });

  it("merges custom workspace pricing, revision, and approval settings cleanly without data loss", () => {
    const rawData = {
      pricing: {
        defaultMarkupPercent: 22,
        categoryMarkups: [
          { id: "custom-1", name: "Joinery", markupPercent: 25 },
        ],
        discountLimitPercent: 15,
        marginThresholdPercent: 30,
        wastagePercent: 8,
        contingencyPercent: 4,
        rounding: "Nearest ₹100",
      },
      revision: {
        autoRevisionNumbering: false,
        revisionReasonRequired: true,
        lockApprovedVersions: false,
        reopenAfterApproval: true,
        compareVersions: false,
      },
      approval: {
        internalApprovalRequired: false,
        clientApprovalRequired: true,
        minValueForApproval: 750000,
        discountApprovalThresholdPercent: 8,
        marginApprovalThresholdPercent: 15,
      },
    };

    const adapted = adaptBoqCostingSettings(rawData);

    // Pricing checks
    expect(adapted.pricing.defaultMarkupPercent).toBe(22);
    expect(adapted.defaultMarkupPercent).toBe(22);
    expect(adapted.pricing.categoryMarkups.length).toBe(1);
    expect(adapted.pricing.categoryMarkups[0].name).toBe("Joinery");
    expect(adapted.pricing.categoryMarkups[0].markupPercent).toBe(25);
    expect(adapted.pricing.rounding).toBe("Nearest ₹100");

    // Revision checks
    expect(adapted.revision.autoRevisionNumbering).toBe(false);
    expect(adapted.revision.lockApprovedVersions).toBe(false);
    expect(adapted.revision.compareVersions).toBe(false);
    expect(adapted.revision.revisionReasonRequired).toBe(true);

    // Approval checks
    expect(adapted.approval.internalApprovalRequired).toBe(false);
    expect(adapted.approval.clientApprovalRequired).toBe(true);
    expect(adapted.approval.minValueForApproval).toBe(750000);
    expect(adapted.approval.discountApprovalThresholdPercent).toBe(8);

    // Unmodified fields maintain standard defaults
    expect(adapted.units.length).toBeGreaterThanOrEqual(12);
    expect(adapted.numbering.boqPrefix).toBe("BOQ");
    expect(adapted.taxRules.length).toBeGreaterThanOrEqual(5);
  });
});
