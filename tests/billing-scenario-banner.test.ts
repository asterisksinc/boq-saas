import { describe, expect, it } from "vitest";
import { resolveBillingScenario, fmtBillingDate } from "../lib/billing-scenario";

describe("resolveBillingScenario", () => {
    it("Scenario 1: Trial renders title, description, and Choose Plan action", () => {
        const sub = {
            id: "sub-1",
            status: "trial",
            planCode: "professional",
            billingFrequency: "monthly",
            billingContact: "accounts@company.com",
            cancelAtPeriodEnd: false,
            periodEnd: null,
            lastPaymentError: null,
            nextRetryAt: null,
        } as any;

        const result = resolveBillingScenario(sub, "Professional Plan");

        expect(result.type).toBe("trial");
        if (result.type === "trial") {
            expect(result.title).toBe("Choose a plan that fits your workflow");
            expect(result.desc).toBe("Your trial stays active while you decide. Your data is preserved.");
            expect(result.actions).toEqual(["choose_plan"]);
        }
    });

    it("Scenario 2: Payment Failed / Past Due renders dynamic reason, retry date, and actions", () => {
        const sub = {
            id: "sub-2",
            status: "past_due",
            planCode: "professional",
            billingFrequency: "monthly",
            billingContact: "accounts@company.com",
            cancelAtPeriodEnd: false,
            periodEnd: "2026-09-14T00:00:00Z",
            lastPaymentError: "Card expired",
            nextRetryAt: "2026-08-12T00:00:00Z",
        } as any;

        const result = resolveBillingScenario(sub, "Professional Plan");

        expect(result.type).toBe("past_due");
        if (result.type === "past_due") {
            expect(result.title).toBe("Payment failed");
            expect(result.desc).toBe(
                "Your Professional Plan payment could not be completed. Reason: Card expired. Next retry: 12 August 2026."
            );
            expect(result.actions).toEqual(["retry", "update_payment"]);
        }
    });

    it("Scenario 2 (fallback without retry date): cleans trailing period gracefully", () => {
        const sub = {
            id: "sub-2b",
            status: "past_due",
            planCode: "professional",
            lastPaymentError: "Card expired.",
            nextRetryAt: null,
        } as any;

        const result = resolveBillingScenario(sub, "Professional Plan");

        expect(result.type).toBe("past_due");
        if (result.type === "past_due") {
            expect(result.title).toBe("Payment failed");
            expect(result.desc).toBe(
                "Your Professional Plan payment could not be completed. Reason: Card expired."
            );
        }
    });

    it("Scenario 3: Cancellation Scheduled renders dynamic periodEnd and Reactivate action", () => {
        const sub = {
            id: "sub-3",
            status: "cancelled_at_period_end",
            planCode: "professional",
            billingFrequency: "monthly",
            billingContact: "accounts@company.com",
            cancelAtPeriodEnd: true,
            periodEnd: "2026-09-14T00:00:00Z",
            lastPaymentError: null,
            nextRetryAt: null,
        } as any;

        const result = resolveBillingScenario(sub, "Professional Plan");

        expect(result.type).toBe("cancelled_period_end");
        if (result.type === "cancelled_period_end") {
            expect(result.title).toBe("Cancellation scheduled");
            expect(result.desc).toBe(
                "Your subscription remains active until 14 September 2026. Access and data retention continue until then."
            );
            expect(result.actions).toEqual(["reactivate"]);
        }
    });

    it("Scenario 4: Suspended renders notice and Resolve Issue action", () => {
        const sub = {
            id: "sub-4",
            status: "suspended",
            planCode: "professional",
            billingFrequency: "monthly",
            billingContact: "accounts@company.com",
            cancelAtPeriodEnd: false,
            periodEnd: "2026-09-14T00:00:00Z",
            lastPaymentError: null,
            nextRetryAt: null,
        } as any;

        const result = resolveBillingScenario(sub, "Professional Plan");

        expect(result.type).toBe("suspended");
        if (result.type === "suspended") {
            expect(result.title).toBe("Subscription Suspended");
            expect(result.desc).toBe("Reason and outstanding amount are available in the recovery flow.");
            expect(result.actions).toEqual(["resolve_issue"]);
        }
    });

    it("Scenario 5: Active and healthy returns type 'healthy' (no banner)", () => {
        const sub = {
            id: "sub-5",
            status: "active",
            planCode: "professional",
            billingFrequency: "monthly",
            billingContact: "accounts@company.com",
            cancelAtPeriodEnd: false,
            periodEnd: "2026-10-21T00:00:00Z",
            lastPaymentError: null,
            nextRetryAt: null,
        } as any;

        const result = resolveBillingScenario(sub, "Professional Plan");
        expect(result.type).toBe("healthy");
    });

    it("Null or missing subscription returns type 'healthy'", () => {
        expect(resolveBillingScenario(null).type).toBe("healthy");
        expect(resolveBillingScenario(undefined).type).toBe("healthy");
    });
});
