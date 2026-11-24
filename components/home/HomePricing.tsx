"use client";

import { useState } from "react";

type Billing = "monthly" | "yearly";

// Copy from the "Landing Page Copy" doc. Premium price is not decided yet (copy says ₹[Price]),
// so `monthly: null` shows "Coming soon" instead of a number.
// TODO: set the Premium price, its yearly price and confirm its feature list.
const plans: Record<"free" | "premium", { title: string; copy: string; monthly: number | null; cta: string; items: string[] }> = {
  free: {
    title: "Start Free",
    copy: "Get organised and manage your first projects with confidence.",
    monthly: 0,
    cta: "Start Free",
    items: [
      "Manage leads and enquiries",
      "Create projects and BOQs",
      "Track basic project costs",
      "Create and manage invoices",
      "Access core project workflows",
    ],
  },
  premium: {
    title: "RVYO Premium",
    copy: "Run a more organised, profitable, and scalable design business.",
    monthly: null,
    cta: "Start Premium",
    items: [
      "Everything in Start Free",
      "Mood boards",
      "Cost and margin tracking",
      "Client-ready BOQ sharing",
      "Integrations: WhatsApp, Email, Razorpay, ad forms",
    ],
  },
};

type Plan = (typeof plans)[keyof typeof plans];

function PlanContent({ plan, billing }: { plan: Plan; billing: Billing }) {
  const amount = plan.monthly === null ? null : billing === "monthly" ? plan.monthly : plan.monthly * 12;

  return (
    <div className="rv-plan-content">
      <div>
        <h3>{plan.title}</h3>
        <p className="rv-lead">{plan.copy}</p>
      </div>
      <div className="rv-plan-price">
        <div>
          <p className="rv-lead">Starting at</p>
          <div className="rv-plan-amount">
            {amount === null ? (
              <strong>Coming soon</strong>
            ) : (
              <>
                <strong>₹{amount.toLocaleString("en-IN")}</strong>
                <span>/{billing === "monthly" ? "month" : "year"}</span>
              </>
            )}
          </div>
        </div>
        <a className="rv-btn rv-btn-dark" href="/register">
          {plan.cta}
        </a>
      </div>
      <div className="rv-plan-list">
        <p className="rv-lead">What includes:</p>
        <ul>
          {plan.items.map((item) => (
            <li key={item}>
              <img src="/assets/home/plan-icon.svg" alt="" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function HomePricing() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <div className="rv-pricing-body">
      <div className="rv-toggle" role="group" aria-label="Billing period">
        <button type="button" aria-pressed={billing === "monthly"} onClick={() => setBilling("monthly")}>
          Monthly
        </button>
        <button type="button" aria-pressed={billing === "yearly"} onClick={() => setBilling("yearly")}>
          Yearly
        </button>
      </div>

      <div className="rv-plans">
        <article className="rv-plan is-standard">
          <PlanContent plan={plans.free} billing={billing} />
        </article>
        <article className="rv-plan is-premium">
          <PlanContent plan={plans.premium} billing={billing} />
          <div className="rv-plan-photo">
            <img src="/assets/home/pricing-photo.jpg" alt="Designer working on a laptop" loading="lazy" />
          </div>
        </article>
      </div>
    </div>
  );
}
