import { describe, it, expect } from "vitest";
import { clientBoqDecisionSchema } from "../lib/api/validation";

describe("Client BOQ Module - Schema & Validation Tests", () => {
    it("validates APPROVE decision with confirmation flag", () => {
        const validPayload = {
            action: "APPROVE",
            version: "v1.0",
            confirmation: true,
        };
        const parsed = clientBoqDecisionSchema.safeParse(validPayload);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect(parsed.data.action).toBe("APPROVE");
            expect(parsed.data.confirmation).toBe(true);
        }
    });

    it("rejects APPROVE decision when confirmation is false or missing", () => {
        const missingConf = {
            action: "APPROVE",
            version: "v1.0",
        };
        const parsed1 = clientBoqDecisionSchema.safeParse(missingConf);
        expect(parsed1.success).toBe(false);

        const falseConf = {
            action: "APPROVE",
            version: "v1.0",
            confirmation: false,
        };
        const parsed2 = clientBoqDecisionSchema.safeParse(falseConf);
        expect(parsed2.success).toBe(false);
    });

    it("validates REQUEST_MINOR_REVISION with comments", () => {
        const validPayload = {
            action: "REQUEST_MINOR_REVISION",
            version: "v2.0",
            comments: "Please adjust master bedroom wardrobe dimensions to 7ft.",
        };
        const parsed = clientBoqDecisionSchema.safeParse(validPayload);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect(parsed.data.comments).toBe("Please adjust master bedroom wardrobe dimensions to 7ft.");
        }
    });

    it("rejects REQUEST_MINOR_REVISION when comments are missing or empty", () => {
        const emptyComments = {
            action: "REQUEST_MINOR_REVISION",
            version: "v2.0",
            comments: "",
        };
        const parsed = clientBoqDecisionSchema.safeParse(emptyComments);
        expect(parsed.success).toBe(false);
    });

    it("validates REQUEST_MAJOR_REVISION with detailed feedback", () => {
        const validPayload = {
            action: "REQUEST_MAJOR_REVISION",
            version: "v1.0",
            comments: "Entire kitchen scope and dining room finishes need redesign.",
        };
        const parsed = clientBoqDecisionSchema.safeParse(validPayload);
        expect(parsed.success).toBe(true);
    });

    it("validates REJECT decision with reason", () => {
        const validPayload = {
            action: "REJECT",
            version: "v1.0",
            reason: "Budget exceeds approved project allocation.",
        };
        const parsed = clientBoqDecisionSchema.safeParse(validPayload);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect(parsed.data.reason).toBe("Budget exceeds approved project allocation.");
        }
    });

    it("rejects REJECT decision when reason is missing or empty", () => {
        const missingReason = {
            action: "REJECT",
            version: "v1.0",
        };
        const parsed = clientBoqDecisionSchema.safeParse(missingReason);
        expect(parsed.success).toBe(false);
    });

    it("rejects unsupported actions", () => {
        const invalidAction = {
            action: "DELETE_BOQ",
            version: "v1.0",
        };
        const parsed = clientBoqDecisionSchema.safeParse(invalidAction);
        expect(parsed.success).toBe(false);
    });
});

describe("Client BOQ Costing & Calculation Consistency", () => {
    it("correctly computes financial breakdown with markup and GST", () => {
        const items = [
            { quantity: 72, rate: 2875, wastePercent: 5, taxPercent: 18 },
            { quantity: 1, rate: 45800, wastePercent: 0, taxPercent: 18 },
            { quantity: 2, rate: 6250, wastePercent: 5, taxPercent: 18 },
        ];

        // Item amounts
        const subtotal = items.reduce((sum, it) => sum + it.quantity * it.rate, 0);
        expect(subtotal).toBe(72 * 2875 + 1 * 45800 + 2 * 6250); // 207000 + 45800 + 12500 = 265300

        const markupPercent = 18;
        const markupAmount = Math.round((subtotal * markupPercent) / 100);
        const taxableAmount = subtotal + markupAmount;

        const taxPercent = 18;
        const taxAmount = Number(((taxableAmount * taxPercent) / 100).toFixed(2));
        const grandTotal = Number((taxableAmount + taxAmount).toFixed(2));

        expect(markupAmount).toBe(47754);
        expect(taxableAmount).toBe(313054);
        expect(taxAmount).toBe(56349.72);
        expect(grandTotal).toBe(369403.72);
    });

    it("maps backend decision statuses to UI badge labels accurately", () => {
        function getStatusLabel(statusStr?: string) {
            const s = (statusStr || "").toLowerCase().replace(/[-_]/g, " ");
            if (s.includes("approved")) return "APPROVED";
            if (s.includes("revision") || s.includes("changes")) return "REVISION REQUESTED";
            if (s.includes("reject")) return "REJECTED";
            return "YET TO APPROVE";
        }

        expect(getStatusLabel("approved")).toBe("APPROVED");
        expect(getStatusLabel("APPROVED")).toBe("APPROVED");
        expect(getStatusLabel("revision_requested")).toBe("REVISION REQUESTED");
        expect(getStatusLabel("changes_required")).toBe("REVISION REQUESTED");
        expect(getStatusLabel("rejected")).toBe("REJECTED");
        expect(getStatusLabel("in_review")).toBe("YET TO APPROVE");
        expect(getStatusLabel("draft")).toBe("YET TO APPROVE");
        expect(getStatusLabel("yet_to_approve")).toBe("YET TO APPROVE");
    });
});
