import { ArrowRight, Code2, Globe2, Tag as TagIcon } from "lucide-react";
import MobileNav from "@/app/components/MobileNav";

const navItems = ["Home", "Product", "Features", "Pricing", "Solutions", "Insights", "Company"];

const footerColumns = [
  [
    "Product",
    ["Product Overview", "BOQ Builder", "Costing Library", "Material Management", "Client Approvals", "Project Management", "Documents", "Reports & Analytics", "Integrations", "Pricing"],
  ],
  [
    "Solutions",
    ["Interior Designers", "Interior Design Studios", "Architecture Firms", "Turnkey Contractors", "Design-Build Firms", "Modular Furniture Companies", "Interior Contractors", "Growing Project Teams"],
  ],
  ["Integrations", ["Google Ad Forms", "Meta Ad Forms", "Custom Forms", "WhatsApp", "Email", "Razorpay", "All Integrations"]],
  ["Company", ["About RVYO", "Customers", "Contact", "Book a Demo", "Support"]],
] as const;

const footerSecondary = [
  ["Features", ["BOQ Creation", "Excel Import", "BOQ Templates", "Costing", "Material Library", "Client Approvals", "Project Documents", "Project Activities", "Margin Tracking", "Reporting", "Notifications", "Revision Management"]],
  ["Resources", ["Resource Center", "Blog", "BOQ Templates", "Costing Templates", "Guides", "Case Studies", "Product Updates", "Help Center", "FAQs"]],
  [
    "Legal",
    [
      ["Privacy Policy", "/privacy-policy"],
      ["Terms of Service", "/terms-of-service"],
      ["Cookie Policy", "/cookie-policy"],
      ["Refund Policy", "/refund-policy"],
      ["Data Processing", "/data-processing"],
      ["Security", "/security"],
      ["Acceptable Use Policy", "/acceptable-use-policy"],
    ],
  ],
] as const;

export function MarketingNav({ current = "Home" }: { current?: "Home" | "Pricing" }) {
  return (
    <header className="nav-shell home-nav">
      <div className="nav-rail">
        <a className="brand-placeholder rvyo-brand" href="/" aria-label="RVYO home">
          <span className="rvyo-word">RVYO</span>
          <span className="rvyo-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        </a>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <a href={item === "Home" ? "/" : item === "Pricing" ? "/#pricing" : `/#${item.toLowerCase()}`} key={item}>
              {item}
            </a>
          ))}
        </nav>
        <a className="button blue nav-cta" href="/register">
          Get Started
        </a>
        <MobileNav current={current} />
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="home-footer rail" id="company">
      <div className="footer-topline">
        <h2>
          Build better projects.
          <br />
          Run a better business.
        </h2>
        <p>RVYO brings the commercial workflow of interior design teams into one connected platform</p>
        <a className="button blue" href="/register">
          Get Started
          <ArrowRight />
        </a>
      </div>
      <FooterCard icon={<TagIcon />} title="Find Your Right Plan" copy="Choose a plan that fits your team today and scales with your workflow tomorrow." link="View Pricing" />
      <FooterCard icon={<Code2 />} title="Connect Your Workflow" copy="Connect forms, communication, and payments with the tools your business already uses." link="Explore Integrations" />
      <div className="footer-columns">
        {footerColumns.map(([title, items]) => (
          <div className="footer-column" key={title}>
            <h3>{title}</h3>
            {items.map((item) => (
              <a href="#" key={item}>
                {item}
              </a>
            ))}
          </div>
        ))}
        <div className="footer-column footer-column-sub">
          <h3>{footerSecondary[0][0]}</h3>
          {footerSecondary[0][1].map((item) => (
            <a href="#" key={item}>
              {item}
            </a>
          ))}
        </div>
        <div className="footer-column footer-column-sub">
          <h3>{footerSecondary[1][0]}</h3>
          {footerSecondary[1][1].map((item) => (
            <a href="#" key={item}>
              {item}
            </a>
          ))}
        </div>
        <div className="footer-column footer-column-sub footer-legal">
          <h3>{footerSecondary[2][0]}</h3>
          {footerSecondary[2][1].map(([label, href]) => (
            <a href={href} key={label}>
              {label}
            </a>
          ))}
          <a className="signin" href="/login">
            Sign in <ArrowRight />
          </a>
        </div>
      </div>
      <div className="footer-bottomline">
        <div>
          <a href="#">
            <Globe2 /> India (English)
          </a>
          <span>© 2026 Ryvo, Pvt. Ltd.</span>
        </div>
        <i />
      </div>
    </footer>
  );
}

function FooterCard({ icon, title, copy, link }: { icon: React.ReactNode; title: string; copy: string; link: string }) {
  return (
    <article>
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
      <a href="#">
        {link} <ArrowRight />
      </a>
    </article>
  );
}
