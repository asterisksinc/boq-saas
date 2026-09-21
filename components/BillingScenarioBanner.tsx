"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { BillingOverview } from "@/lib/api/auth";
import { resolveBillingScenario, fmtBillingDate } from "@/lib/billing-scenario";

interface BillingScenarioBannerProps {
    sub: BillingOverview["subscription"];
    planName?: string;
    onChoosePlan: () => void;
    onUpdatePayment: () => void;
    onRetryPayment: () => void;
    onReactivate: () => void;
    onResolveIssue?: () => void;
    loadingAction?: boolean;
}

export default function BillingScenarioBanner({
    sub,
    planName = "Professional Plan",
    onChoosePlan,
    onUpdatePayment,
    onRetryPayment,
    onReactivate,
    onResolveIssue,
    loadingAction = false,
}: BillingScenarioBannerProps) {
    const scenario = resolveBillingScenario(sub, planName);

    if (scenario.type === "healthy") {
        return null;
    }

    // 1. Payment Failed / Past Due (Image 2)
    if (scenario.type === "past_due") {
        return (
            <section className="billing-scenario-banner" aria-label="Payment failed notice">
                <div className="bsb-content">
                    <div className="bsb-icon-wrap">
                        <AlertCircle size={20} className="bsb-icon" />
                    </div>
                    <div className="bsb-text">
                        <h3 className="bsb-title">{scenario.title}</h3>
                        <p className="bsb-desc">{scenario.desc}</p>
                    </div>
                </div>
                <div className="bsb-actions">
                    <button
                        type="button"
                        className="bsb-btn-outline"
                        onClick={onRetryPayment}
                        disabled={loadingAction}
                    >
                        {loadingAction ? <Loader2 size={14} className="billing-spin" /> : null}
                        <span>Retry Payment</span>
                    </button>
                    <button
                        type="button"
                        className="bsb-btn-primary"
                        onClick={onUpdatePayment}
                    >
                        Update Payment Method
                    </button>
                </div>
            </section>
        );
    }

    // 2. Cancellation Scheduled (Image 3)
    if (scenario.type === "cancelled_period_end") {
        return (
            <section className="billing-scenario-banner" aria-label="Cancellation scheduled notice">
                <div className="bsb-content">
                    <div className="bsb-icon-wrap">
                        <AlertCircle size={20} className="bsb-icon" />
                    </div>
                    <div className="bsb-text">
                        <h3 className="bsb-title">{scenario.title}</h3>
                        <p className="bsb-desc">{scenario.desc}</p>
                    </div>
                </div>
                <div className="bsb-actions">
                    <button
                        type="button"
                        className="bsb-btn-primary"
                        onClick={onReactivate}
                        disabled={loadingAction}
                    >
                        {loadingAction ? <Loader2 size={14} className="billing-spin" /> : null}
                        <span>Reactivate Subscription</span>
                    </button>
                </div>
            </section>
        );
    }

    // 3. Suspended (Image 4)
    if (scenario.type === "suspended") {
        return (
            <section className="billing-scenario-banner" aria-label="Subscription suspended notice">
                <div className="bsb-content">
                    <div className="bsb-icon-wrap">
                        <AlertCircle size={20} className="bsb-icon" />
                    </div>
                    <div className="bsb-text">
                        <h3 className="bsb-title">{scenario.title}</h3>
                        <p className="bsb-desc">{scenario.desc}</p>
                    </div>
                </div>
                <div className="bsb-actions">
                    <button
                        type="button"
                        className="bsb-btn-primary"
                        onClick={onResolveIssue || onUpdatePayment}
                        disabled={loadingAction}
                    >
                        Resolve Issue
                    </button>
                </div>
            </section>
        );
    }

    // 4. Trial (Image 1)
    if (scenario.type === "trial") {
        return (
            <section className="billing-scenario-banner" aria-label="Trial active notice">
                <div className="bsb-content">
                    <div className="bsb-icon-wrap">
                        <AlertCircle size={20} className="bsb-icon" />
                    </div>
                    <div className="bsb-text">
                        <h3 className="bsb-title">{scenario.title}</h3>
                        <p className="bsb-desc">{scenario.desc}</p>
                    </div>
                </div>
                <div className="bsb-actions">
                    <button
                        type="button"
                        className="bsb-btn-primary"
                        onClick={onChoosePlan}
                    >
                        Choose Plan
                    </button>
                </div>
            </section>
        );
    }

    // 5. Fully Cancelled fallback
    if (scenario.type === "cancelled") {
        return (
            <section className="billing-scenario-banner" aria-label="Subscription cancelled notice">
                <div className="bsb-content">
                    <div className="bsb-icon-wrap">
                        <AlertCircle size={20} className="bsb-icon" />
                    </div>
                    <div className="bsb-text">
                        <h3 className="bsb-title">{scenario.title}</h3>
                        <p className="bsb-desc">{scenario.desc}</p>
                    </div>
                </div>
                <div className="bsb-actions">
                    <button
                        type="button"
                        className="bsb-btn-primary"
                        onClick={onReactivate}
                        disabled={loadingAction}
                    >
                        Reactivate Subscription
                    </button>
                </div>
            </section>
        );
    }

    return null;
}

