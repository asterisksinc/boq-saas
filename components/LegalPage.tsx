import { ShieldCheck } from "lucide-react";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";

const policyCopy = {
  "privacy-policy": {
    eyebrow: "RVYO User Policy",
    title: "Your Privacy Matters.",
    intro: "We're committed to protecting your information and being transparent about how we collect, use, and safeguard your data while you use RVYO.",
    sections: [
      ["1. Introduction", ["At RVYO, we build commercial workflow tools for teams that manage BOQs, costing, approvals, documents, and project execution. This policy explains how we handle information when you use our platform.", "If you create an account, request a demo, contact us, or subscribe to our services, we may collect your name, email address, company name, job title, and other contact details."]],
      ["2. Information We Use", ["We use account, workspace, project, billing, support, and usage information to operate the product, keep your workspace secure, improve RVYO, and communicate important service updates.", "Project data remains part of your workspace. We do not sell customer project information."]],
      ["3. Data Protection", ["We use administrative, technical, and organizational safeguards designed to protect information from unauthorized access, loss, misuse, or alteration.", "Access to customer data is limited to authorized personnel and service providers who need it to deliver or support the platform."]],
    ],
  },
  "terms-of-service": {
    eyebrow: "RVYO Legal Terms",
    title: "Terms of Service.",
    intro: "These terms explain the rules for accessing and using RVYO products, websites, and related services.",
    sections: [
      ["1. Using RVYO", ["You may use RVYO only for lawful business purposes and in accordance with these terms. You are responsible for activity in your account and workspace.", "Keep login credentials secure and notify us if you suspect unauthorized access."]],
      ["2. Subscriptions", ["Paid plans renew according to the billing cycle selected at purchase. Features, usage limits, and pricing may vary by plan.", "Taxes, payment gateway charges, or third-party fees may apply where relevant."]],
      ["3. Customer Content", ["You retain ownership of the BOQs, project files, estimates, documents, and other content you upload. You grant RVYO the limited rights needed to host, process, and display that content inside the service."]],
    ],
  },
  "cookie-policy": {
    eyebrow: "RVYO Cookie Policy",
    title: "Cookie Policy.",
    intro: "This policy explains how RVYO may use cookies and similar technologies to keep the website and product reliable.",
    sections: [
      ["1. Essential Cookies", ["Essential cookies help with sign-in, session continuity, security, preferences, and core site functionality."]],
      ["2. Analytics", ["We may use privacy-conscious analytics to understand page performance, feature usage, and product reliability."]],
      ["3. Managing Cookies", ["Most browsers let you control or delete cookies. Blocking essential cookies may affect sign-in or product functionality."]],
    ],
  },
  "refund-policy": {
    eyebrow: "RVYO Billing Policy",
    title: "Refund Policy.",
    intro: "This policy explains how refunds, cancellations, and billing adjustments are handled for RVYO subscriptions.",
    sections: [
      ["1. Cancellations", ["You can cancel a recurring subscription before the next renewal date. Access may continue until the end of the paid billing period."]],
      ["2. Refund Reviews", ["Refund requests are reviewed based on account status, billing history, product usage, and applicable law."]],
      ["3. Billing Issues", ["If you believe a charge is incorrect, contact support with your invoice details so our team can review it."]],
    ],
  },
  "data-processing": {
    eyebrow: "RVYO Data Policy",
    title: "Data Processing.",
    intro: "This page summarizes how RVYO processes workspace data to provide secure project and commercial workflow services.",
    sections: [
      ["1. Processing Purpose", ["RVYO processes customer data to provide BOQ management, costing, project workflows, approvals, reporting, integrations, and customer support."]],
      ["2. Sub-processors", ["We may use trusted infrastructure, communication, analytics, and payment providers where needed to deliver the service."]],
      ["3. Retention", ["Workspace data is retained while your account is active and then deleted or anonymized according to our operational and legal requirements."]],
    ],
  },
  security: {
    eyebrow: "RVYO Security",
    title: "Security.",
    intro: "RVYO is designed to keep commercial project information protected, traceable, and accessible to the right people.",
    sections: [
      ["1. Access Controls", ["Role-based access, authenticated sessions, and workspace boundaries help teams control who can view and change information."]],
      ["2. Operational Security", ["We monitor reliability, limit production data access, and maintain safeguards for infrastructure and application changes."]],
      ["3. Responsible Reporting", ["If you discover a security issue, contact us with details so we can investigate and respond quickly."]],
    ],
  },
  "acceptable-use-policy": {
    eyebrow: "RVYO Use Policy",
    title: "Acceptable Use Policy.",
    intro: "This policy protects RVYO, our customers, and the integrity of the platform.",
    sections: [
      ["1. Prohibited Activity", ["Do not use RVYO for illegal activity, abuse, harassment, malware, unauthorized access, spam, or attempts to disrupt the service."]],
      ["2. Platform Integrity", ["Do not reverse engineer, overload, scrape, or bypass usage controls in ways that harm service reliability or security."]],
      ["3. Enforcement", ["We may suspend or restrict access if activity creates legal, security, or operational risk."]],
    ],
  },
} as const;

export function LegalPage({ slug }: { slug: keyof typeof policyCopy }) {
  const policy = policyCopy[slug];

  return (
    <main className="site rvyo-page legal-page">
      <MarketingNav />
      <section className="legal-hero rail">
        <span className="tag">
          <ShieldCheck />
          {policy.eyebrow}
        </span>
        <h1>{policy.title}</h1>
        <p>{policy.intro}</p>
      </section>
      <article className="legal-body rail">
        <p className="effective-date">Effective Date: August 9, 2026</p>
        <p>
          At RVYO, we believe clear policies make better working relationships. This page explains the important details in plain language while keeping your team's commercial workflow protected.
        </p>
        {policy.sections.map(([heading, paragraphs]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
      <div className="legal-grid-band rail" aria-hidden="true" />
      <section className="final-cta rail">
        <div className="blue-grain" />
        <h2>Your projects are growing. Your workflow should too.</h2>
        <p>Bring BOQs, costing, approvals, documents, integrations, and commercial visibility into one system built for modern interior project teams.</p>
        <div>
          <a className="button soft" href="/register">
            Start Creating BOQ
          </a>
          <a className="button dark" href="/#demo">
            Book a Demo
          </a>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
