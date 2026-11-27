/**
 * Vendor contact credits (NoBroker-style access).
 *
 * Browsing the marketplace and vendor profiles is free for every signed-in user. Revealing a vendor's phone, email and
 * address costs one contact credit, spent only when the OTP check succeeds. A vendor the company already unlocked stays
 * unlocked and is never charged again.
 *
 *  - Free workspaces get FREE_CONTACT_UNLOCKS in total (a one-time trial, not monthly).
 *  - Paid workspaces get a monthly allowance set by RVYO admin on the plan: `subscription_plans.limits.vendorContactsPerMonth`.
 *    A plan without that limit counts as free, so nothing changes until admin switches a plan on (payments come later).
 */

export const FREE_CONTACT_UNLOCKS = 5;
/** Suggested monthly allowance for paid plans (the business range is 25–30). Admin sets the real value per plan. */
export const SUGGESTED_PAID_MONTHLY_UNLOCKS = 30;

export interface ContactPlan {
    tier: "free" | "paid";
    limit: number;
    period: "lifetime" | "month";
    planName: string | null;
}

export const FREE_CONTACT_PLAN: ContactPlan = { tier: "free", limit: FREE_CONTACT_UNLOCKS, period: "lifetime", planName: null };

export interface ContactUsage {
    used: number;
    limit: number;
    remaining: number;
    period: ContactPlan["period"];
    tier: ContactPlan["tier"];
    /** Start of the next allowance period for paid plans; null for the free trial. */
    resetsAt: Date | null;
}

/** Reads the workspace plan from GET /api/v1/billing/overview. Anything unexpected falls back to the free trial. */
export function contactPlanFromBilling(overview: unknown): ContactPlan {
    const sub = (overview as { subscription?: Record<string, any> | null } | null)?.subscription;
    if (!sub || sub.status !== "active") return FREE_CONTACT_PLAN;
    const plan = sub.subscriptionPlans as { name?: string; limits?: Record<string, unknown> } | undefined;
    const monthly = Number(plan?.limits?.vendorContactsPerMonth);
    if (!Number.isFinite(monthly) || monthly <= 0) return FREE_CONTACT_PLAN;
    return { tier: "paid", limit: Math.floor(monthly), period: "month", planName: plan?.name ?? null };
}

/** Counts paid-for unlocks (one per vendor) against the plan. `unlocks` are the successful disclosures. */
export function contactUsage(unlocks: Array<{ vendorId: string; at: string }>, plan: ContactPlan, now = new Date()): ContactUsage {
    const start = plan.period === "month" ? new Date(now.getFullYear(), now.getMonth(), 1) : null;
    const seen = new Set<string>();
    for (const u of unlocks) {
        if (start && new Date(u.at) < start) continue;
        seen.add(u.vendorId);
    }
    const used = seen.size;
    return {
        used,
        limit: plan.limit,
        remaining: Math.max(0, plan.limit - used),
        period: plan.period,
        tier: plan.tier,
        resetsAt: start ? new Date(now.getFullYear(), now.getMonth() + 1, 1) : null,
    };
}

/** "3 of 5 free contacts left" / "12 of 30 contacts left this month". */
export function usageLabel(u: ContactUsage): string {
    return u.tier === "free"
        ? `${u.remaining} of ${u.limit} free contact${u.limit === 1 ? "" : "s"} left`
        : `${u.remaining} of ${u.limit} contacts left this month`;
}
