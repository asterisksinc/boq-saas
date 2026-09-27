import { notFound } from "next/navigation";
import { ArrowRight, Check, ChevronDown, ClipboardList, FileText, Layers3, ReceiptText, UsersRound } from "lucide-react";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";
import { getSolutionBySlug, marketingSolutions, type MarketingSolution } from "@/lib/marketing-solutions";

const stats = [
  ["1.2B+", "Line Items Managed"],
  ["100K+", "Projects & Workflows"],
  ["98%", "Workflow Visibility"],
  ["4.3K+", "Teams & Users"],
];

const logos = ["LOGOIPSUM", "LOGOIPSUM", "Logoipsum", "LOGOIPSUM"];

const faqs = [
  "Can I import my existing Excel BOQs?",
  "Can my clients approve estimates online?",
  "Can I manage project-level costing?",
  "Is RVYO suitable for small teams?",
];

export function generateStaticParams() {
  return marketingSolutions.map((solution) => ({ slug: solution.slug }));
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = getSolutionBySlug(slug);

  if (!solution) {
    notFound();
  }

  return (
    <main className={`site home-page rvyo-page solution-page ${solution.template}`}>
      <MarketingNav current="Solutions" />
      <Hero solution={solution} />
      {solution.template === "template3" && <TrustedStrip />}
      <MetricsBlock />
      {solution.template === "template2" ? <TemplateTwoSections solution={solution} /> : <TemplateOneThreeSections solution={solution} />}
      <FaqBlock />
      <section className="final-cta rail">
        <div className="blue-grain" />
        <h2>Your projects are growing. Your workflow should too.</h2>
        <p>Bring BOQs, costing, approvals, documents, integrations, and commercial visibility into one system built for modern interior project teams.</p>
        <div>
          <a className="button soft" href="/register">Start Creating BOQ</a>
          <a className="button dark" href="/#demo">Book a Demo</a>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}

function Hero({ solution }: { solution: MarketingSolution }) {
  const isTemplate1 = solution.template === "template1";
  const isTemplate3 = solution.template === "template3";

  return (
    <section className={`solution-hero rail ${isTemplate1 ? "solution-hero-centered" : ""}`}>
      <div className="solution-hero-copy">
        <Tag>{solution.eyebrow}</Tag>
        <h1>{solution.headline}</h1>
        <p>{solution.copy}</p>
        <a className="button blue" href="/register">
          Learn more about RVYO <ArrowRight />
        </a>
      </div>
      <div className="solution-hero-art" aria-label={`${solution.title} workflow preview`}>
        {isTemplate1 ? <DashboardPreview /> : isTemplate3 ? <CollagePreview /> : <InvoicePreview />}
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="solution-dashboard-preview">
      <img src="/figma/hero-dashboard.png" alt="RVYO project dashboard preview" />
      <div>
        <strong>BOQ Control</strong>
        <span>Live margin, approval, and material visibility</span>
      </div>
    </div>
  );
}

function InvoicePreview() {
  return (
    <div className="solution-invoice-preview">
      <header>
        <strong>Invoice from RVYO</strong>
        <span>Billed to project client</span>
      </header>
      <div className="invoice-total">INR 12.50 due</div>
      <div className="invoice-options">
        <span><ReceiptText /> Card</span>
        <span><Layers3 /> Bank</span>
      </div>
      <div className="invoice-input">Card number <small>MM/YY CVC</small></div>
      <button type="button">Pay invoice</button>
      <footer>
        <span>Description</span><span>Qty</span><span>Total</span>
        <b>Plus plan</b><b>1</b><b>INR 12.50</b>
      </footer>
    </div>
  );
}

function CollagePreview() {
  return (
    <div className="solution-collage-preview">
      <img src="/figma/asset-11.png" alt="Project workspace view" />
      <img src="/figma/asset-12.png" alt="RVYO dashboard view" />
      <img src="/figma/asset-17.jpeg" alt="Interior project team" />
    </div>
  );
}

function TrustedStrip() {
  return (
    <section className="solution-trusted rail">
      <p>Used by interior design studios, firms, architects, estimators, and procurement teams.</p>
      <div>
        {logos.map((logo, index) => <span key={`${logo}-${index}`}>{logo}</span>)}
      </div>
    </section>
  );
}

function MetricsBlock() {
  return (
    <section className="solution-metrics rail">
      <Tag>Built for scale</Tag>
      <h2>More control at every stage of the project.</h2>
      <div className="solution-stat-grid">
        {stats.map(([value, label]) => (
          <article key={value}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function TemplateOneThreeSections({ solution }: { solution: MarketingSolution }) {
  return (
    <>
      <section className="solution-split rail">
        <div>
          <Tag>Workflow control</Tag>
          <h2>Everything your {solution.title.toLowerCase()} need before site work begins.</h2>
          <p>{solution.proof}</p>
        </div>
        <div className="solution-feature-list">
          <Feature icon={<ClipboardList />} title="Structured BOQs">Create clean project estimates with reusable line-item logic.</Feature>
          <Feature icon={<FileText />} title="Client approvals">Keep revision history, documents, and approvals in one place.</Feature>
          <Feature icon={<UsersRound />} title="Team visibility">Give sales, estimation, procurement, and project teams shared context.</Feature>
        </div>
      </section>
      <section className="solution-grid-band rail">
        {["Scope", "Costing", "Approvals", "Delivery"].map((item) => (
          <article key={item}>
            <Check />
            <h3>{item}</h3>
            <p>Keep every decision connected to project commercials.</p>
          </article>
        ))}
      </section>
    </>
  );
}

function TemplateTwoSections({ solution }: { solution: MarketingSolution }) {
  return (
    <section className="solution-two-column rail">
      <div>
        <Tag>Pre-built workflows</Tag>
        <h2>Launch cleaner commercial operations without rebuilding your process from scratch.</h2>
        <p>{solution.proof}</p>
        <a className="button blue" href="/register">Start building <ArrowRight /></a>
      </div>
      <div>
        {[
          ["Get paid more quickly with pre-built invoices", "Turn approved BOQs and milestones into cleaner billing workflows."],
          ["Launch client approval portals in minutes", "Share project decisions with clients while keeping your team in control."],
          ["Standardize repeatable project pricing", "Use templates, costing rules, and material libraries across teams."],
          ["Track operations as your team grows", "See project status, approvals, documents, and margin pressure in one place."],
        ].map(([title, copy]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FaqBlock() {
  return (
    <section className="solution-faq rail">
      <Tag>Questions, answered</Tag>
      <h2>Everything you need to know before getting started.</h2>
      <div>
        {faqs.map((question, index) => (
          <details key={question} open={index === 0}>
            <summary>{question}<ChevronDown /></summary>
            <p>Yes. RVYO keeps BOQs, costing, approvals, documents, and project communication connected in one workflow.</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <article>
      <span>{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </article>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag"><i />{children}</span>;
}
