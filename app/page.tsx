import { ChevronRight } from "lucide-react";
import DarkWorkflowIndex from "@/components/home/DarkWorkflowIndex";
import HomeNav from "@/components/home/HomeNav";
import HomePricing from "@/components/home/HomePricing";
import { marketingSolutions } from "@/lib/marketing-solutions";
import "./home.css";

// Rebuilt from Figma "BOQ DESIGN ARENA" › PUBLIC PAGES › Home (node 327:10705).
// Images live in /public/assets/home (exported from Figma); the hero background (/public/assets/home/hero-bg.jpg) is a web-sized copy of /public/assets/herosection-ryvo-image.png.

const topFeatures = [
  ["Build Structured BOQs", "An intelligent assistant that collaborates, learns, and works alongside your team"],
  ["Integrate effortlessly", "Easily connect your favorite tools and platforms with seamless integrations"],
  ["Track performance in real time", "Track your progress and gain actionable insights in real time"],
];

const bottomFeatures = [
  [
    "Smart & easy order handling",
    "Easily manage, track, and fulfill all your orders from one intuitive dashboard keeping your business running smoothly.",
  ],
  [
    "Export data instantly. Report with ease.",
    "Export your data effortlessly and generate detailed reports in just a few clicks giving you the clarity to make smarter business decisions.",
  ],
];

const workflowPoints = [
  ["Safe, and Scalable.", "Secure, reliable solutions designed to scale with businesses."],
  ["Trusted and Protected", "Your data and operations remain secure, reliable, and protected."],
  ["Track performance in real time", "Monitor and analyze business instantly with real-time insights that help."],
];

const darkBlocks = [
  {
    id: "planning",
    label: "Planning",
    title: ["Centralize priorities", "before execution begins."],
    copy: "Organize projects, timelines, ownership, and documentation inside one operational layer designed to keep teams aligned from the start.",
    image: "/assets/home/dark-plan.jpg",
    alt: "Project plan board with workflow stages and sticky notes",
    padded: true,
  },
  {
    id: "coordination",
    label: "Coordination",
    title: ["Keep teams connected", "without operational overhead."],
    copy: "Discussions, updates, files, and decisions stay attached to execution workflows so teams maintain clarity without relying on endless meetings.",
    image: "/assets/home/dark-crm.jpg",
    alt: "Team dashboard showing deal metrics, ongoing tasks and project progress",
    padded: false,
  },
  {
    id: "execution",
    label: "Execution",
    title: ["Track progress, blockers,", "and delivery in real time."],
    copy: "Cube provides shared operational visibility across projects, ownership, and execution progress so teams can move faster with confidence.",
    image: "/assets/home/dark-table.jpg",
    alt: "Task table with type, rating, duration and assignees",
    padded: false,
  },
];

const testimonials = {
  jenny: { quote: "Caleo transformed our workflow, saving hours each week while boosting productivity.", name: "Jenny Elsi", role: "Marketing Manager", avatar: "/assets/home/avatar-1.png" },
  rafiq: {
    quote: "The team’s expertise transformed how we work. Projects are faster, smarter, and more efficient than ever, delivering measurable business success.",
    name: "Rafiq Ahmed",
    role: "Head of Product Development",
    avatar: "/assets/home/avatar-2.png",
  },
  ethan: { quote: "An indispensable platform that simplifies operations and drives measurable business growth.", name: "Ethan Blake", role: "Sales Director", avatar: "/assets/home/avatar-3.png" },
  andrew: { quote: "Our team collaborates seamlessly, and projects are completed more efficiently than ever.", name: "Andrew James", role: "Project Manager", avatar: "/assets/home/avatar-4.png" },
  ayesha: {
    quote: "Caleo’s tools streamlined our processes, allowing us to focus on growth. Results were immediate, impressive, and exceeded all expectations.",
    name: "Ayesha Karim",
    role: "Chief Operating Officer",
    avatar: "/assets/home/avatar-5.png",
  },
};

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
        <img src={data.avatar} alt="" loading="lazy" />
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
            <Tag arrow>RVYO is now live</Tag>
            <h1>
              The Commercial Operating System
              <br />
              for Interior Design teams.
            </h1>
            <p className="rv-lead">
              Streamline your sales process with powerful automation insights—helping you close deals faster, boost efficiency, and scale your
              business with confidence.
            </p>
            <div className="rv-hero-actions">
              <a className="rv-btn rv-btn-brand" href="#demo">
                <span className="rv-btn-dot" aria-hidden="true" />
                Talk to Sales
              </a>
              <a className="rv-btn rv-btn-dark" href="/register">
                Start Free Trial
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
          <Tag>Core Features</Tag>
          <h2 className="rv-h2">Simplify management. Amplify growth.</h2>
          <p className="rv-lead">
            See everything that matters at a glance. Track your sales, revenue, profits, and customer behavior in real time — always up to date.
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
              <Tag>Lead generation to customer</Tag>
              <h2 className="rv-h2">
                Smarter workflows.
                <br />
                Infinite growth.
              </h2>
            </div>
            <div className="rv-workflow-head-right">
              <p className="rv-lead">Streamline your sales process with powerful automation insights—helping you close deals faster.</p>
              <a className="rv-btn rv-btn-dark" href="#features">
                <span className="rv-btn-dot" aria-hidden="true" />
                Explore Our Features
              </a>
            </div>
          </div>
          <div className="rv-workflow-shot rv-container">
            <img src="/assets/home/workflow-dashboard.png" alt="Settings and billing screen inside the product" loading="lazy" />
            <img className="rv-workflow-arrow" src="/assets/home/workflow-arrow.svg" alt="" aria-hidden="true" />
            <a className="rv-play" href="#demo" aria-label="Watch main features">
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
      <section className="rv-dark" aria-label="How teams work in RVYO">
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
          <Tag>Smart Integrations</Tag>
          <h2 className="rv-h2">Connect your platforms</h2>
        </div>
        <img src="/assets/home/integrations.png" alt="Connected platform integrations" width={850} height={446} loading="lazy" />
        <div className="rv-integrations-body">
          <p className="rv-lead">
            Easily connect your favorite tools and platforms with seamless integrations—streamlining workflows, improving efficiency, and keeping
            your data and processes fully in sync.
          </p>
          <a className="rv-btn rv-btn-dark" href="/integrations">
            <span className="rv-btn-dot" aria-hidden="true" />
            Explore Our Integrations
          </a>
        </div>
      </section>

      {/* Pricing */}
      <section className="rv-pricing rv-container" id="pricing">
        <div className="rv-section-head">
          <Tag>Simple pricing</Tag>
          <h2 className="rv-h2">
            Flexible pricing built to
            <br />
            scale with your team.
          </h2>
          <p className="rv-lead">Choose from flexible plans tailored to fit your team’s needs</p>
        </div>
        <HomePricing />
      </section>

      {/* Testimonials */}
      <section className="rv-testimonials" id="insights">
        <div className="rv-container">
          <div className="rv-section-head">
            <Tag>Testimonial</Tag>
            <h2 className="rv-h2">Voices of our customers</h2>
            <p className="rv-lead">
              Caleo empowers teams with smart, intuitive tools designed to simplify workflows, enhance collaboration, and drive measurable results.
            </p>
          </div>
          <div className="rv-testimonial-grid">
            <div className="rv-testimonial-col">
              <Quote data={testimonials.jenny} size="short" />
              <Quote data={testimonials.rafiq} size="tall" />
            </div>
            <div className="rv-testimonial-col">
              <div className="rv-testimonial-photo">
                <img src="/assets/home/testimonial-photo.jpg" alt="Person sitting on a misty green hillside" loading="lazy" />
              </div>
              <Quote data={testimonials.ethan} size="short" />
            </div>
            <div className="rv-testimonial-col">
              <Quote data={testimonials.andrew} size="short" />
              <Quote data={testimonials.ayesha} size="tall" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rv-cta rv-container" id="demo">
        <div className="rv-cta-inner">
          <h2>Your projects are growing. Your workflow should too.</h2>
          <p>Bring BOQs, costing, approvals, documents, integrations, and commercial visibility into one system built for modern interior project teams.</p>
          <div className="rv-cta-actions">
            <a className="rv-cta-light" href="/register">
              Start Creating BOQ
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
