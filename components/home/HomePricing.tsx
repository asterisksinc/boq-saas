"use client";

import { useState } from "react";

type Billing = "monthly" | "yearly";

// Figma only specifies monthly prices. Yearly is shown as 12 × monthly until real yearly pricing is decided.
const plans = {
  standard: {
    title: "Standard Plan",
    copy: "Ideal for small to mid-sized teams streamlining daily operations.",
    monthly: 25,
    items: [
      "Automate up to 10 workflows",
      "Access core integration tools",
      "Real-time analytics dashboard",
      "Basic customer support",
      "10 user accounts included",
    ],
  },
  premium: {
    title: "Premium Plan",
    copy: "Built for growing businesses that demand advanced automation and insights.",
    monthly: 65,
    items: [
      "Unlimited workflows & integrations",
      "Advanced analytics & reporting",
      "Priority support & onboarding",
      "Collaboration tools for large teams",
      "Dedicated account manager",
    ],
  },
};

type Plan = (typeof plans)[keyof typeof plans];

function PlanContent({ plan, billing }: { plan: Plan; billing: Billing }) {
  const amount = billing === "monthly" ? plan.monthly : plan.monthly * 12;

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
            <strong>${amount}</strong>
            <span>/{billing === "monthly" ? "month" : "year"}</span>
          </div>
        </div>
        <a className="rv-btn rv-btn-dark" href="/register">
          Get Started Now
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
          <PlanContent plan={plans.standard} billing={billing} />
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
