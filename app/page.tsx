import { ArrowRight, BadgeCheck, Check, ChevronDown, Code2, Globe2, Star, Tag as TagIcon } from "lucide-react";
import { MarketingNav } from "@/components/MarketingChrome";

const figma = "/figma/";

const partnerLogos = [
  ["mark-a", "LOGOIPSUM"],
  ["mark-b", "LOGOIPSUM"],
  ["mark-c", "Logoipsum"],
  ["mark-d", "LOGOIPSUM"],
];

const bentoCards = [
  { title: "Build structured BOQs faster than spreadsheets can scale.", className: "wide" },
  { title: "Turn scattered material pricing into a controlled cost intelligence layer.", className: "tall" },
  {
    title:
      "Bring leads, communication, payments, and client updates into your workflow through connected forms, WhatsApp, email, and Razorpay integrations.",
    className: "color",
  },
  { title: "Get approvals without losing commercial traceability.", className: "blank" },
  { title: "Measure margin before execution exposes it.", className: "full" },
];

const stats = [
  ["12B+", "Line Items Managed"],
  ["100K+", "Projects & Workflows"],
  ["98%", "Workflow Visibility"],
  ["4.3K+", "Teams & Users"],
];

const stages = [
  [
    "Work Faster",
    "Create reusable BOQ structures, costing templates, and workflows instead of rebuilding the same commercial processes for every project.",
  ],
  [
    "Stay Accurate",
    "Keep rates, quantities, revisions, approvals, and commercial information connected so your team spends less time reconciling conflicting versions.",
  ],
  [
    "Know Your Margin",
    "Track project costs, pricing, approvals, procurement movement, and margin exposure from one connected workspace.",
  ],
];

const modules = [
  {
    title: "BOQ Builder",
    copy: "Build structured project estimates without Excel dependency.",
    items: ["Structured BOQ hierarchy", "Templates & Excel import", "Revisions & version control"],
    position: "right",
  },
  {
    title: "Costing & Materials",
    copy: "Create a reliable pricing foundation for every estimate.",
    items: ["Material cost library", "Vendor-linked rates", "GST, margin & costing logic"],
    position: "left",
  },
  {
    title: "Approvals & Procurement",
    copy: "Move approved costs into actionable project workflows.",
    items: ["Client approvals", "Vendor comparison", "Procurement handoff"],
    position: "right",
  },
  {
    title: "Project Intelligence",
    copy: "See what is happening across projects and commercials.",
    items: ["Project dashboards", "Cost & margin visibility", "Documents & activity tracking"],
    position: "left",
  },
];

const plans = [
  {
    title: "For Growing Teams",
    price: "₹1,499",
    cta: "Start Today",
    popular: false,
    copy: "Everything you need to bring your BOQ workflow into one system.",
    items: ["BOQ Builder", "Costing & Materials", "Projects & Documents", "Approvals", "Core Integrations"],
  },
  {
    title: "Enterprise",
    price: "₹2,799",
    cta: "Get Enterprise Now",
    popular: true,
    copy: "Advanced commercial control for larger project teams.",
    items: ["Everything in Professional", "Advanced Project Controls", "Advanced Integrations", "Advanced Reporting", "Priority Support"],
  },
];

const logoGlyphs = ["K", "N", "G", "+", "O", "A", "GH", "L", "M.", "■"];

const integrationFeatures = [
  ["Google Ad Forms", "Connect Google Ads lead forms and bring new enquiries into your workflow automatically."],
  ["Meta Ad Forms", "Capture leads from Facebook and Instagram campaigns directly inside RVYO."],
  ["Custom Forms", "Create custom forms with your own fields and embed them directly into your website."],
  ["WhatsApp Business", "Send timely project and client updates through WhatsApp without losing context."],
  ["Email", "Connect email communication to keep clients informed across key project touchpoints."],
  ["RazorPay", "Connect Razorpay and collect payments directly against invoices created in RVYO."],
];

const comparisonRows = [
  ["BOQ Management", "Structured", "Spreadsheets"],
  ["Costing Logic", "Centralised", "Manual"],
  ["Revisions", "Controlled", "Scattered"],
  ["Client Approvals", "Tracked", "Informal"],
  ["Project Visibility", "Real-Time", "Fragmented"],
  ["Commercial Control", "Centralized", "Disconnected"],
  ["Scalable Infrastructure", "Unlimited", "Limited"],
];

const testimonials = [
  [
    "David R.",
    "NovaTech",
    "The difference is having one structured version of the project. Our team spends less time searching for information and more time controlling the project.",
  ],
  [
    "James C.",
    "Vertex Labs",
    "RVYO has helped us bring our BOQs, costing, approvals, and project information into one workflow instead of managing everything across multiple files.",
  ],
  [
    "Liam F.",
    "Altura",
    "We wanted something more controlled than Excel without a complicated ERP. RVYO gives us that middle ground.",
  ],
];

const faqs = [
  "Can I import my existing Excel BOQs?",
  "Is RVYO built specifically for interior design businesses?",
  "Can my clients approve BOQs online?",
  "Can I manage BOQ revisions?",
  "Can I track project margins?",
  "Can I connect my existing lead-generation tools?",
];

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
];

const footerSecondary = [
  ["Features", ["BOQ Creation", "Excel Import", "BOQ Templates", "Costing", "Material Library", "Client Approvals", "Project Documents", "Project Activities", "Margin Tracking", "Reporting", "Notifications", "Revision Management"]],
  ["Resources", ["Resource Center", "Blog", "BOQ Templates", "Costing Templates", "Guides", "Case Studies", "Product Updates", "Help Center", "FAQs"]],
  ["Legal", ["Privacy Policy", "Terms of Service", "Cookie Policy", "Refund Policy", "Data Processing", "Security", "Acceptable Use Policy"]],
];

const legalLinks: Record<string, string> = {
  "Privacy Policy": "/privacy-policy",
  "Terms of Service": "/terms-of-service",
  "Cookie Policy": "/cookie-policy",
  "Refund Policy": "/refund-policy",
  "Data Processing": "/data-processing",
  Security: "/security",
  "Acceptable Use Policy": "/acceptable-use-policy",
};

export default function Home() {
  return (
    <main className="site home-page rvyo-page">
      <MarketingNav />

      <section className="home-hero rail">
        <Tag>RVYO is now live</Tag>
        <h1>The commercial operating system for interior design teams.</h1>
        <p>
          Build structured BOQs, control project costing, compare vendors, collect client approvals, manage documents, and
          track commercial performance all from one platform built for interior project workflows.
        </p>
        <div className="hero-actions">
          <a className="button dark" href="/register">
            Start Now
          </a>
          <a className="button blue" href="#demo">
            Book a Demo
          </a>
        </div>
        <small>No complex setup. Start with your first project.</small>
      </section>

      <section className="hero-visual rail" aria-label="RVYO dashboard preview">
        <div className="blue-grain" />
        <div className="dashboard-frame">
          <img src={`${figma}hero-dashboard.png`} alt="RVYO dashboard with commercial project metrics" />
        </div>
      </section>

      <section className="trusted rail">
        <p>Used by interior design studios, firms, architects, estimators, and procurement teams.</p>
        <div>
          {partnerLogos.map(([mark, label]) => (
            <span className="partner-logo" key={mark}>
              <i className={mark} />
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="bento rail" id="product">
        <div className="bento-grid">
          {bentoCards.map((card) => (
            <article className={`bento-card ${card.className}`} key={card.title}>
              <h3>{card.title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="metrics rail" id="features">
        <Tag>Built for scale</Tag>
        <h2>More control at every stage of the project.</h2>
        <div className="stat-grid">
          {stats.map(([value, label]) => (
            <article key={value}>
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="stage rail">
        <Tag>Why RVYO</Tag>
        <h2>
          Stop managing projects.
          <br />
          Start controlling them.
        </h2>
        <div className="stage-visuals">
          {stages.map(([title, copy], index) => (
            <article key={title}>
              <div className={`stage-art stage-art-${index + 1}`} />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="purpose rail" id="solutions">
        <Tag>The RVYO stack</Tag>
        <h2>Purpose-built modules work together to take a project from initial scope to controlled execution.</h2>
        <div className="module-grid">
          {modules.map((card) => (
            <article className={`module-card ${card.position}`} key={card.title}>
              <div>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </div>
              <ul>
                {card.items.map((item) => (
                  <li key={item}>
                    <Check />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing-intro rail" id="pricing">
        <Tag>Simple pricing</Tag>
        <h2>Choose the plan that fits your team today. Upgrade when your projects and operations grow.</h2>
        <div className="billing-toggle" aria-label="Billing frequency">
          <span>Yearly</span>
          <b />
          <span>Monthly</span>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <PriceCard key={plan.title} {...plan} />
          ))}
        </div>
      </section>

      <section className="integrations" id="insights">
        <div className="integration-rail">
          <Tag>Connected workflow</Tag>
          <h2>Bring every client touchpoint into RVYO.</h2>
          <p className="section-subcopy">
            Connect the tools your team already uses to capture leads, communicate with clients, and collect project
            payments without breaking your workflow.
          </p>
          <div className="logo-row">
            {logoGlyphs.map((glyph, index) => (
              <span key={`${glyph}-${index}`}>{glyph}</span>
            ))}
          </div>
          <div className="dark-feature-grid">
            {integrationFeatures.map(([title, copy]) => (
              <article key={title}>
                <span>
                  <Code2 />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="comparison rail">
        <Tag>The switch</Tag>
        <h2>RVYO gives your team a structured workflow where BOQs, costing, approvals, documents, and project information stay connected.</h2>
        <table>
          <thead>
            <tr>
              <th>Capability</th>
              <th>
                Ryvo <span className="tiny-mark">✣</span>
              </th>
              <th>Other Apps</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map(([label, ryvo, other]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>
                  <BadgeCheck />
                  {ryvo}
                </td>
                <td>
                  <span className="x-icon">×</span>
                  {other}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="testimonials rail">
        <Tag>From the people using RVYO</Tag>
        <h2>
          Built around how project
          <br />
          teams actually work.
        </h2>
        <div className="testimonial-grid">
          {testimonials.map(([name, company, quote], index) => (
            <article key={name}>
              <p>“{quote}”</p>
              <div className="testimonial-person">
                <span className={`avatar avatar-${index + 1}`} />
                <div>
                  <strong>{name}</strong>
                  <small>{company}</small>
                </div>
                <span className="stars">
                  {Array.from({ length: index === 2 ? 2 : 5 }, (_, starIndex) => (
                    <Star key={starIndex} />
                  ))}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="faq rail">
        <Tag>Questions, answered</Tag>
        <h2>
          Everything you need to know
          <br />
          before getting started.
        </h2>
        <div className="faq-grid">
          {faqs.map((question, index) => (
            <details key={`${question}-${index}`}>
              <summary>
                {question}
                <ChevronDown />
              </summary>
              <p>Yes. RVYO is built to keep BOQs, costing, approvals, documents, and project communication connected.</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta rail" id="demo">
        <div className="blue-grain" />
        <h2>Your projects are growing. Your workflow should too.</h2>
        <p>Bring BOQs, costing, approvals, documents, integrations, and commercial visibility into one system built for modern interior project teams.</p>
        <div>
          <a className="button soft" href="/register">
            Start Creating BOQ
          </a>
          <a className="button dark" href="#demo">
            Book a Demo
          </a>
        </div>
      </section>

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
            <div className="footer-column" key={title as string}>
              <h3>{title}</h3>
              {(items as string[]).map((item) => (
                <a href="#" key={item}>
                  {item}
                </a>
              ))}
            </div>
          ))}
          <div className="footer-column footer-column-sub">
            <h3>{footerSecondary[0][0] as string}</h3>
            {(footerSecondary[0][1] as string[]).map((item) => (
              <a href="#" key={item}>
                {item}
              </a>
            ))}
          </div>
          <div className="footer-column footer-column-sub">
            <h3>{footerSecondary[1][0] as string}</h3>
            {(footerSecondary[1][1] as string[]).map((item) => (
              <a href="#" key={item}>
                {item}
              </a>
            ))}
          </div>
          <div className="footer-column footer-column-sub footer-legal">
            <h3>{footerSecondary[2][0] as string}</h3>
            {(footerSecondary[2][1] as string[]).map((item) => (
              <a href={legalLinks[item]} key={item}>
                {item}
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
    </main>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="tag">
      <i />
      {children}
    </span>
  );
}

function PriceCard({
  title,
  price,
  cta,
  copy,
  items,
  popular,
}: {
  title: string;
  price: string;
  cta: string;
  copy: string;
  items: string[];
  popular: boolean;
}) {
  return (
    <article className={`price ${popular ? "popular" : ""}`}>
      {popular && <b className="popular-label">Most Popular</b>}
      <h3>{title}</h3>
      <p>{copy}</p>
      <div>
        <strong>{price}</strong>
        <small>/ mo</small>
      </div>
      <a className={popular ? "primary" : ""} href="/register">
        {cta}
      </a>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <Check />
            {item}
          </li>
        ))}
      </ul>
    </article>
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
