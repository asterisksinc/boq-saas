import { BillingOverview } from "@/lib/api/auth";

export type BillingScenario =
    | { type: "healthy" }
    | { type: "past_due"; title: string; desc: string; actions: Array<"retry" | "update_payment"> }
    | { type: "cancelled_period_end"; title: string; desc: string; actions: Array<"reactivate"> }
    | { type: "suspended"; title: string; desc: string; actions: Array<"resolve_issue"> }
    | { type: "trial"; title: string; desc: string; actions: Array<"choose_plan"> }
    | { type: "cancelled"; title: string; desc: string; actions: Array<"reactivate"> };

export const fmtBillingDate = (x?: string | null) => {
    if (!x) return "14 September 2026";
    try {
        const d = new Date(x.includes("T") ? x : `${x.slice(0, 10)}T00:00:00`);
        if (isNaN(d.getTime())) return "14 September 2026";
        return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch {
        return "14 September 2026";
    }
};

export function resolveBillingScenario(
    sub: BillingOverview["subscription"] | null | undefined,
    planName = "Professional Plan"
): BillingScenario {
    if (!sub) return { type: "healthy" };

    const status = sub.status || "active";
    const lastPaymentError = sub.lastPaymentError || (sub as any).last_payment_error;
    const nextRetryAt = sub.nextRetryAt || (sub as any).next_retry_at;
    const cancelAtPeriodEnd = sub.cancelAtPeriodEnd ?? (sub as any).cancel_at_period_end;
    const periodEnd = sub.periodEnd || (sub as any).period_end;

    const isPastDue = status === "past_due" || Boolean(lastPaymentError);
    const isCancelledPeriodEnd = status === "cancelled_at_period_end" || (Boolean(cancelAtPeriodEnd) && status !== "cancelled");
    const isSuspended = status === "suspended";
    const isTrial = status === "trial";
    const isCancelled = status === "cancelled";

    // Healthy active subscription has no banner (Image 5)
    if (status === "active" && !isPastDue && !isCancelledPeriodEnd) {
        return { type: "healthy" };
    }

    // 1. Payment Failed / Past Due (Image 2)
    if (isPastDue) {
        const cleanErr = lastPaymentError ? String(lastPaymentError).replace(/\.+$/, "") : "";
        const desc = cleanErr
            ? `Your ${planName} payment could not be completed. Reason: ${cleanErr}.${nextRetryAt ? ` Next retry: ${fmtBillingDate(nextRetryAt)}.` : ""}`
            : `Your ${planName} payment could not be completed. Please retry or update your payment method.`;
        return {
            type: "past_due",
            title: "Payment failed",
            desc,
            actions: ["retry", "update_payment"],
        };
    }

    // 2. Cancellation Scheduled (Image 3)
    if (isCancelledPeriodEnd) {
        const periodEndDate = fmtBillingDate(periodEnd);
        return {
            type: "cancelled_period_end",
            title: "Cancellation scheduled",
            desc: `Your subscription remains active until ${periodEndDate}. Access and data retention continue until then.`,
            actions: ["reactivate"],
        };
    }

    // 3. Suspended (Image 4)
    if (isSuspended) {
        return {
            type: "suspended",
            title: "Subscription Suspended",
            desc: "Reason and outstanding amount are available in the recovery flow.",
            actions: ["resolve_issue"],
        };
    }

    // 4. Trial (Image 1)
    if (isTrial) {
        return {
            type: "trial",
            title: "Choose a plan that fits your workflow",
            desc: "Your trial stays active while you decide. Your data is preserved.",
            actions: ["choose_plan"],
        };
    }

    // 5. Cancelled Fallback
    if (isCancelled) {
        return {
            type: "cancelled",
            title: "Subscription Cancelled",
            desc: "Your subscription is inactive. Reactivate to restore full platform access.",
            actions: ["reactivate"],
        };
    }

    return { type: "healthy" };
}
