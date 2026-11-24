import { ChevronRight } from "lucide-react";
import DarkWorkflowIndex from "@/components/home/DarkWorkflowIndex";
import HomeNav from "@/components/home/HomeNav";
import HomePricing from "@/components/home/HomePricing";
import { marketingSolutions } from "@/lib/marketing-solutions";
import "./home.css";

// Rebuilt from Figma "BOQ DESIGN ARENA" › PUBLIC PAGES › Home (node 327:10705).
// Images live in /public/assets/home (exported from Figma); the hero background (/public/assets/home/hero-bg.jpg) is a web-sized copy of /public/assets/herosection-ryvo-image.png.

// Copy: "Landing Page Copy" doc (sections 01–08).
const topFeatures = [
  ["Lead Management", "Capture, track, and convert enquiries from first contact to won project."],
  ["BOQ Builder", "Create structured, client-ready BOQs without starting from scratch."],
  ["Cost Control", "Track project costs, quantities, rates, and margins with clarity."],
];

const bottomFeatures = [
  ["Invoicing", "Create, send, and track invoices connected to your project workflow."],
  ["Mood Boards", "Create, organise, and present design mood boards in a few clicks."],
];

const workflowPoints = [
  ["Project Creation", "Start every project with organised client and project details."],
  ["BOQ Creation", "Build clear, structured BOQs with quantities, rates, and items."],
  ["Client Sharing", "Share client-ready BOQs without manual formatting or follow-up."],
];

// TODO: swap these images for real Leads / Invoices / Mood Boards screenshots.
const darkBlocks = [
  {
    id: "leads",
    label: "Leads",
    title: ["Capture and convert", "every enquiry"],
    copy: "Create, manage, and track leads from first contact to won project.",
    image: "/assets/home/dark-plan.jpg",
    alt: "Lead pipeline board with stages",
    padded: true,
  },
  {
    id: "invoices",
    label: "Invoices",
    title: ["Stay on top of", "your finances"],
    copy: "Create, track, and manage invoices and project financials in one place.",
    image: "/assets/home/dark-crm.jpg",
    alt: "Financial dashboard with project metrics",
    padded: false,
  },
  {
    id: "mood-boards",
    label: "Mood Boards",
    title: ["Present design direction", "beautifully"],
    copy: "Create organised mood boards from images, templates, and categories in a few clicks.",
    image: "/assets/home/dark-table.jpg",
    alt: "Organised project board",
    padded: false,
  },
];

// Positions are the icon-cell centres in integrations.png (850×446), as percentages.
const integrationIcons = [
  { name: "Razorpay", file: "razorpay", x: 35.29, y: 22.2 },
  { name: "Email", file: "email", x: 19.53, y: 49.9 },
  { name: "WhatsApp", file: "whatsapp", x: 35.29, y: 77.35 },
  { name: "Google Ads", file: "google-ads", x: 64.7, y: 22.2 },
  { name: "Meta Ads", file: "meta-ads", x: 80.35, y: 49.9 },
  { name: "Custom Forms", file: "custom-forms", x: 64.7, y: 77.35 },
];

const testimonials = {
  ananya: {
    quote: "RVYO helped us bring our project details, BOQs, and client communication into one place. It has made our workflow much more organised.",
    name: "Ananya Sharma",
    role: "Studio Ananya, Mumbai",
  },
  rohan: {
    quote: "Earlier, our BOQs and cost sheets were spread across multiple files. RVYO gives us a much clearer way to manage estimates and project costs.",
    name: "Rohan Mehta",
    role: "Mehta Design Works, Delhi",
  },
  priya: {
    quote: "The lead and invoice views make it easier to see what needs attention. It has helped our team stay more organised.",
    name: "Priya Nair",
    role: "Nair Interiors, Bengaluru",
  },
  arjun: {
    quote: "Creating mood boards used to take a lot of time. RVYO makes it easier to organise images and present ideas to clients.",
    name: "Arjun Kapoor",
    role: "Kapoor Design Studio, Pune",
  },
  sneha: {
    quote: "We wanted one place to manage projects, costs, and client communication. RVYO gives our team that clarity.",
    name: "Sneha Iyer",
    role: "Iyer Design House, Chennai",
  },
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

const legalLinks: Record<string, string> = {
  "Privacy Policy": "/privacy-policy",
  "Terms of Service": "/terms-of-service",
  "Cookie Policy": "/cookie-policy",
  "Refund Policy": "/refund-policy",
  "Data Processing": "/data-processing",
  Security: "/security",
  "Acceptable Use Policy": "/acceptable-use-policy",
};

type FooterGroup = [string, string[]];

const footerColumns: FooterGroup[][] = [
  [["Product", ["Product Overview", "BOQ Builder", "Costing Library", "Material Management", "Client Approvals", "Project Management", "Documents", "Reports & Analytics", "Integrations", "Pricing"]]],
  [
    ["Solutions", ["Interior Designers", "Interior Design Studios", "Architecture Firms", "Turnkey Contractors", "Design-Build Firms", "Modular Furniture Companies", "Interior Contractors", "Growing Project Teams"]],
    ["Features", ["BOQ Creation", "Excel Import", "BOQ Templates", "Costing", "Material Library", "Client Approvals", "Project Documents", "Project Activities", "Margin Tracking", "Reporting", "Notifications", "Revision Management"]],
  ],
  [
    ["Integrations", ["Google Ad Forms", "Meta Ad Forms", "Custom Forms", "WhatsApp", "Email", "Razorpay", "All Integrations"]],
    ["Resources", ["Resource Center", "Blog", "BOQ Templates", "Costing Templates", "Guides", "Case Studies", "Product Updates", "Help Center", "FAQs"]],
  ],
  [
    ["Company", ["About RVYO", "Customers", "Contact", "Book a Demo", "Support"]],
    ["Legal", Object.keys(legalLinks)],
  ],
];

function footerHref(group: string, item: string) {
  if (group === "Legal") return legalLinks[item];
  if (group === "Solutions") {
    const solution = marketingSolutions.find((entry) => entry.title === item.replace("-", " "));
    return solution ? `/solutions/${solution.slug}` : "#solutions";
  }
  if (item === "Pricing") return "#pricing";
  if (item === "All Integrations") return "#integrations";
  if (item === "Book a Demo" || item === "Contact") return "#demo";
  return "#";
}

function Tag({ children, arrow = false }: { children: React.ReactNode; arrow?: boolean }) {
  return (
    <span className="rv-tag">
      {children}
      {arrow && (
        <svg viewBox="0 0 8 8" fill="none" aria-hidden="true">
          <path d="M1 4h6M4.5 1.5 7 4 4.5 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function Quote({ data, size }: { data: (typeof testimonials)[keyof typeof testimonials]; size: "short" | "tall" }) {
  return (
    <figure className={`rv-quote is-${size}`} style={{ margin: 0 }}>
      <div className="rv-quote-top">
        <img src="/assets/home/stars.svg" alt="Rated 5 out of 5" />
        <blockquote>“{data.quote}”</blockquote>
      </div>
      <figcaption className="rv-author">
        <span className="rv-avatar" aria-hidden="true">{initials(data.name)}</span>
        <div>
          <strong>{data.name}</strong>
          <span>{data.role}</span>
        </div>
      </figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <main className="rv-home">
      <HomeNav />

      {/* Hero */}
      <section className="rv-hero" id="product">
        <div className="rv-hero-inner">
          <div className="rv-hero-copy">
            <Tag arrow>Interior Design OS</Tag>
            <h1>
              Run your interior design
              <br />
              business with clarity.
            </h1>
            <p className="rv-lead">
              Manage leads, BOQs, costs, vendors, projects, invoices, and client communication in one connected platform.
            </p>
            <div className="rv-hero-actions">
              <a className="rv-btn rv-btn-brand" href="/register">
                <span className="rv-btn-dot" aria-hidden="true" />
                Start Free
              </a>
              <a className="rv-btn rv-btn-dark" href="#solutions">
                See How It Works
              </a>
            </div>
          </div>
          <div className="rv-hero-dashboard">
            <img src="/assets/home/hero-dashboard.png" alt="RVYO overview dashboard with project analytics" width={1222} height={654} />
          </div>
        </div>
        <div className="rv-trusted rv-container">
          <p>
            Trusted by <span>1000+ marketing teams</span>
          </p>
          <div className="rv-logos" aria-label="Customer logos">
            <div className="rv-logos-track">
              <img src="/assets/home/logos.svg" alt="" />
              <img src="/assets/home/logos.svg" alt="" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <div className="rv-grid-strip rv-container" aria-hidden="true" />

      {/* Core features */}
      <section className="rv-features rv-container" id="features">
        <div className="rv-section-head">
          <Tag>Everything Connected</Tag>
          <h2 className="rv-h2">One platform for your entire design business</h2>
          <p className="rv-lead">
            From the first enquiry to the final invoice, RVYO keeps your projects, costs, clients, and team aligned.
          </p>
        </div>
        <div className="rv-feature-grid">
          <div className="rv-feature-row is-top">
            {topFeatures.map(([title, copy]) => (
              <article className="rv-feature-card" key={title}>
                <h3>{title}</h3>
                <p className="rv-lead">{copy}</p>
              </article>
            ))}
          </div>
          <div className="rv-feature-row is-bottom">
            {bottomFeatures.map(([title, copy]) => (
              <article className="rv-feature-card" key={title}>
                <h3>{title}</h3>
                <p className="rv-lead">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Smarter workflows */}
      <section className="rv-workflow" id="solutions">
        <div className="rv-workflow-bg">
          <div className="rv-workflow-head rv-container">
            <div className="rv-workflow-head-left">
              <Tag>From Project to BOQ</Tag>
              <h2 className="rv-h2">
                Create a project. Build a BOQ.
                <br />
                Send it to your client.
              </h2>
            </div>
            <div className="rv-workflow-head-right">
              <p className="rv-lead">
                Create a project, build a structured BOQ, and share it with your client—without rebuilding spreadsheets, chasing details, or spending
                hours formatting documents.
              </p>
              <a className="rv-btn rv-btn-dark" href="#how-it-works">
                <span className="rv-btn-dot" aria-hidden="true" />
                See How It Works
              </a>
            </div>
          </div>
          <div className="rv-workflow-shot rv-container" id="how-it-works">
            <img src="/assets/home/workflow-dashboard.png" alt="Settings and billing screen inside the product" loading="lazy" />
            <img className="rv-workflow-arrow" src="/assets/home/workflow-arrow.svg" alt="" aria-hidden="true" />
            <a className="rv-play" href="#demo" aria-label="Watch how it works">
              <svg viewBox="0 0 30 30" fill="currentColor" aria-hidden="true">
                <path d="M10 7.8c0-1.1 1.2-1.8 2.2-1.2l10.4 6.4c.9.6.9 1.9 0 2.4l-10.4 6.4c-1 .6-2.2-.1-2.2-1.2z" />
              </svg>
            </a>
          </div>
        </div>
        <div className="rv-workflow-points rv-container">
          {workflowPoints.map(([title, copy]) => (
            <div className="rv-point" key={title}>
              <img src="/assets/home/bulb.png" alt="" aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p className="rv-lead">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dark workflow */}
      <section className="rv-dark" aria-label="Built for your workflow">
        <div className="rv-dark-frame rv-container">
          <aside className="rv-dark-index">
            <DarkWorkflowIndex items={darkBlocks.map(({ id, label }) => ({ id, label }))} />
          </aside>
          <div>
            {darkBlocks.map((block) => (
              <article className="rv-dark-block" id={block.id} key={block.id}>
                <div className="rv-dark-title">
                  <h3>
                    {block.title[0]}
                    <br />
                    {block.title[1]}
                  </h3>
                  <p>{block.copy}</p>
                </div>
                <div className={`rv-dark-media ${block.padded ? "is-padded" : ""}`}>
                  <img src={block.image} alt={block.alt} loading="lazy" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="rv-integrations" id="integrations">
        <div className="rv-section-head">
          <Tag>Works With Your Workflow</Tag>
          <h2 className="rv-h2">Connect your platforms</h2>
        </div>
        <div className="rv-integrations-art">
          <img src="/assets/home/integrations.png" alt="" width={850} height={446} loading="lazy" />
          <ul aria-label="Integrations">
            {integrationIcons.map((icon) => (
              <li key={icon.file} style={{ left: `${icon.x}%`, top: `${icon.y}%` }} title={icon.name}>
                <img src={`/assets/home/integrations/${icon.file}.svg`} alt={icon.name} />
              </li>
            ))}
          </ul>
        </div>
        <div className="rv-integrations-body">
          <p className="rv-lead">
            Connect the tools you already use to capture leads, communicate with clients, and collect payments.
          </p>
          <a className="rv-btn rv-btn-dark" href="/integrations">
            <span className="rv-btn-dot" aria-hidden="true" />
            Explore Integrations
          </a>
        </div>
      </section>

      {/* Pricing */}
      <section className="rv-pricing rv-container" id="pricing">
        <div className="rv-section-head">
          <Tag>Simple Pricing</Tag>
          <h2 className="rv-h2">
            Start free. Upgrade when
            <br />
            your business is ready.
          </h2>
          <p className="rv-lead">Choose the plan that fits your studio today, with room to grow as your projects and team expand.</p>
        </div>
        <HomePricing />
      </section>

      {/* Testimonials */}
      <section className="rv-testimonials" id="insights">
        <div className="rv-container">
          <div className="rv-section-head">
            <Tag>Loved by Design Businesses</Tag>
            <h2 className="rv-h2">Built for the way interior design businesses work</h2>
            <p className="rv-lead">
              See how design studios and business owners use RVYO to bring clarity to their projects, clients, and operations.
            </p>
          </div>
          <div className="rv-testimonial-grid">
            <div className="rv-testimonial-col">
              <Quote data={testimonials.priya} size="short" />
              <Quote data={testimonials.ananya} size="tall" />
            </div>
            <div className="rv-testimonial-col">
              <div className="rv-testimonial-photo">
                <img src="/assets/home/testimonial-photo.jpg" alt="Person sitting on a misty green hillside" loading="lazy" />
              </div>
              <Quote data={testimonials.sneha} size="short" />
            </div>
            <div className="rv-testimonial-col">
              <Quote data={testimonials.arjun} size="short" />
              <Quote data={testimonials.rohan} size="tall" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rv-cta rv-container" id="demo">
        <div className="rv-cta-inner">
          <h2>Bring clarity to your interior design business.</h2>
          <p>Manage leads, BOQs, costs, projects, invoices, and client communication in one connected platform.</p>
          <div className="rv-cta-actions">
            <a className="rv-cta-light" href="/register">
              Start Free
            </a>
            <a className="rv-cta-dark" href="/register">
              Book a Demo
            </a>
          </div>
        </div>
      </section>

      <div className="rv-grid-strip is-narrow" style={{ marginInline: "auto" }} aria-hidden="true" />

      {/* Footer */}
      <footer className="rv-footer" id="company">
        <div className="rv-footer-top">
          <div className="rv-footer-shell">
            <div className="rv-footer-intro">
              <div>
                <h2>
                  Build better projects.
                  <br />
                  Run a better business.
                </h2>
                <p>RVYO brings the commercial workflow of interior design teams into one connected platform</p>
              </div>
              <a className="rv-footer-start" href="/register">
                Get Started <ChevronRight />
              </a>
            </div>
            <div className="rv-footer-cards">
              <div className="rv-footer-card">
                <span className="rv-footer-card-icon">
                  <img src="/assets/home/footer-tag.svg" alt="" aria-hidden="true" />
                </span>
                <h3>Find Your Right Plan</h3>
                <p>Choose a plan that fits your team today and scales with your workflow tomorrow.</p>
                <a className="rv-footer-link" href="#pricing">
                  View Pricing <ChevronRight />
                </a>
              </div>
              <div className="rv-footer-card">
                <span className="rv-footer-card-icon">
                  <img src="/assets/home/footer-code.svg" alt="" aria-hidden="true" />
                </span>
                <h3>Connect Your Workflow</h3>
                <p>Connect forms, communication, and payments with the tools your business already uses.</p>
                <a className="rv-footer-link" href="#integrations">
                  Explore Integrations <ChevronRight />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="rv-footer-shell">
          <div className="rv-footer-columns">
            {footerColumns.map((groups, index) => (
              <div className="rv-footer-col" key={index}>
                {groups.map(([title, items]) => (
                  <div className="rv-footer-group" key={title}>
                    <h3>{title}</h3>
                    <ul>
                      {items.map((item) => (
                        <li key={item}>
                          <a href={footerHref(title, item)}>{item}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {index === footerColumns.length - 1 && (
                  <a className="rv-footer-link" href="/login">
                    Sign in <ChevronRight />
                  </a>
                )}
              </div>
            ))}
          </div>
          <div className="rv-footer-bottom">
            <div>
              <a className="rv-footer-locale" href="#">
                <img src="/assets/home/globe.svg" alt="" aria-hidden="true" />
                India (English)
              </a>
              <small>© 2026 Rvyo, Pvt. Ltd.</small>
            </div>
            <img src="/assets/home/footer-mark.svg" alt="" aria-hidden="true" />
          </div>
        </div>
      </footer>
    </main>
  );
}
