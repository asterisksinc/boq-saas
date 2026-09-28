import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Check, ChevronDown, ClipboardList, Code2, FileText, Layers3, ReceiptText, Star, UsersRound } from "lucide-react";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";
import { getSolutionBySlug, marketingSolutions, type MarketingSolution } from "@/lib/marketing-solutions";

const stats = [
  ["1.2B+", "Line Items Managed"],
  ["100K+", "Projects & Workflows"],
  ["98%", "Workflow Visibility"],
  ["4.3K+", "Teams & Users"],
];

const logos = ["LOGOIPSUM", "LOGOIPSUM", "Logoipsum", "LOGOIPSUM"];

const templateOneLogos = [
  ["/figma/logo-openai.svg", "OpenAI"],
  ["/figma/logo-google.svg", "Google"],
  ["/figma/logo-nvidia.svg", "Nvidia"],
  ["/figma/logo-shopify.svg", "Shopify"],
];

const workflowCards = [
  ["Work Faster", "Create reusable BOQ structures, costing templates, and workflows instead of rebuilding the same commercial process for every project."],
  ["Stay Accurate", "Keep rates, quantities, revisions, approvals, and commercial information connected so your team spends less time reconciling versions."],
  ["Know Your Margin", "Track project costs, pricing, approvals, procurement movement, and margin exposure from one connected workspace."],
];

const templateTwoFeatures = [
  ["Get paid more quickly with pre-built invoices", "Turn approved BOQs and milestones into cleaner billing workflows that are ready to share with clients."],
  ["Launch a customer approval portal in minutes", "Give clients a secure place to review project scope, approvals, documents, and commercial decisions."],
  ["Standardize repeatable project pricing", "Use templates, costing rules, and material libraries so every team quotes from the same system."],
  ["Track operations as your team grows", "See project status, approvals, documents, and margin pressure without asking five people for updates."],
];

const stackModules = [
  ["BOQ Builder", "Build structured project estimates without Excel dependency.", ["Structured BOQ hierarchy", "Templates and Excel import", "Revisions and version control"]],
  ["Costing & Materials", "Create a reliable pricing foundation for every estimate.", ["Material cost library", "Vendor-linked rates", "GST, margin and costing logic"]],
  ["Approvals & Procurement", "Move approved costs into actionable project workflows.", ["Client approvals", "Vendor comparison", "Procurement handoff"]],
  ["Project Intelligence", "See what is happening across projects and commercials.", ["Project dashboards", "Cost and margin visibility", "Documents and activity tracking"]],
];

const integrationFeatures = [
  ["Google Ad Forms", "Bring campaign leads into RVYO automatically."],
  ["Meta Ad Forms", "Capture Facebook and Instagram enquiries inside your workflow."],
  ["Custom Forms", "Embed custom forms with your own project intake fields."],
  ["WhatsApp Business", "Send timely client updates without losing project context."],
  ["Email", "Connect communication to key project touchpoints."],
  ["Razorpay", "Collect payments against invoices created in RVYO."],
];

const pricingPlans = [
  {
    title: "For Growing Teams",
    price: "₹1,499",
    cta: "Start Today",
    copy: "Everything you need to bring your BOQ workflow into one system.",
    items: ["BOQ Builder", "Costing & Materials", "Projects & Documents", "Approvals", "Core Integrations"],
  },
  {
    title: "Enterprise",
    price: "₹2,799",
    cta: "Get Enterprise Now",
    copy: "Advanced commercial control for larger project teams.",
    items: ["Everything in Professional", "Advanced Project Controls", "Advanced Integrations", "Advanced Reporting", "Priority Support"],
  },
];

const comparisonRows = [
  ["BOQ Management", "Structured", "Spreadsheets"],
  ["Costing Logic", "Centralised", "Manual"],
  ["Revisions", "Controlled", "Scattered"],
  ["Client Approvals", "Tracked", "Informal"],
  ["Project Visibility", "Real-time", "Fragmented"],
  ["Commercial Control", "Centralized", "Disconnected"],
];

const testimonials = [
  ["David R.", "NovaTech", "The difference is having one structured version of the project. Our team spends less time searching for information and more time controlling the project."],
  ["James C.", "Vertex Labs", "RVYO helped us bring BOQs, costing, approvals, and project information into one workflow instead of managing everything across multiple files."],
  ["Liam F.", "Altura", "We wanted something more controlled than Excel without a complicated ERP. RVYO gives us that middle ground."],
];

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
      {solution.template === "template1" && <TemplateOneTrustedStrip />}
      {solution.template === "template3" && <TrustedStrip />}
      {solution.template !== "template2" && <MetricsBlock />}
      {solution.template === "template1" ? <TemplateOneFullSections solution={solution} /> : solution.template === "template2" ? <TemplateTwoFullSections solution={solution} /> : <TemplateThreeFullSections solution={solution} />}
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

function TemplateOneTrustedStrip() {
  return (
    <section className="solution-trusted solution-trusted-logos rail" aria-label="Trusted partner logos">
      <p>Used by interior design studios, firms, architects, estimators, and procurement teams.</p>
      <div>
        {templateOneLogos.map(([src, label]) => (
          <span key={label}>
            <img src={src} alt={`${label} logo`} />
          </span>
        ))}
      </div>
    </section>
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

function TemplateOneFullSections({ solution }: { solution: MarketingSolution }) {
  return (
    <>
      <section className="solution-control rail">
        <div>
          <Tag>Workflow control</Tag>
          <h2>Stop managing projects. Start controlling them.</h2>
          <p>{solution.proof} RVYO connects the commercial decisions that usually live across spreadsheets, chats, documents, and approvals.</p>
        </div>
        <div className="solution-control-grid">
          {workflowCards.map(([title, copy], index) => (
            <article key={title}>
              <div className={`solution-art solution-art-${index + 1}`} />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="solution-stack rail">
        <Tag>The RVYO stack</Tag>
        <h2>Purpose-built modules work together from initial scope to controlled execution.</h2>
        <div className="solution-stack-grid">
          {stackModules.map(([title, copy, items], index) => (
            <article key={title as string} className={index % 2 ? "reverse" : ""}>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
              <ul>
                {(items as string[]).map((item) => (
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

      <section className="solution-integrations">
        <div className="solution-integrations-rail">
          <Tag>Connected workflow</Tag>
          <h2>Bring every client touchpoint into RVYO.</h2>
          <p>Connect the tools your team already uses to capture leads, communicate with clients, and collect project payments without breaking your workflow.</p>
          <div className="solution-logo-orbit" aria-hidden="true">
            {["K", "N", "G", "+", "O", "A", "GH", "L", "M", "R"].map((glyph, index) => (
              <span key={`${glyph}-${index}`}>{glyph}</span>
            ))}
          </div>
          <div className="solution-dark-grid">
            {integrationFeatures.map(([title, copy]) => (
              <article key={title}>
                <span><Code2 /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="solution-pricing rail">
        <Tag>Simple pricing</Tag>
        <h2>Choose the plan that fits your team today. Upgrade when your operations grow.</h2>
        <div className="solution-pricing-grid">
          {pricingPlans.map((plan, index) => (
            <article key={plan.title} className={index === 1 ? "featured" : ""}>
              {index === 1 && <b>Most Popular</b>}
              <h3>{plan.title}</h3>
              <p>{plan.copy}</p>
              <div>
                <strong>{plan.price}</strong>
                <small>/ mo</small>
              </div>
              <a href="/register">{plan.cta}</a>
              <ul>
                {plan.items.map((item) => (
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

      <section className="solution-comparison rail">
        <Tag>The switch</Tag>
        <h2>Keep BOQs, costing, approvals, documents, and project information connected.</h2>
        <table>
          <thead>
            <tr>
              <th>Capability</th>
              <th>RVYO</th>
              <th>Other Apps</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map(([label, rvyo, other]) => (
              <tr key={label}>
                <td>{label}</td>
                <td><BadgeCheck />{rvyo}</td>
                <td>{other}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="solution-testimonials rail">
        <Tag>From the people using RVYO</Tag>
        <h2>Built around how project teams actually work.</h2>
        <div>
          {testimonials.map(([name, company, quote], index) => (
            <article key={name}>
              <p>“{quote}”</p>
              <footer>
                <span className={`solution-avatar avatar-${index + 1}`} />
                <div>
                  <strong>{name}</strong>
                  <small>{company}</small>
                </div>
                <span className="solution-stars">
                  {Array.from({ length: 5 }, (_, starIndex) => <Star key={starIndex} />)}
                </span>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function TemplateTwoFullSections({ solution }: { solution: MarketingSolution }) {
  return (
    <>
      <section className="solution-template2-intro rail">
        <div>
          <Tag>Pre-built workflows</Tag>
          <h2>More control at every stage of the project.</h2>
          <p>
            {solution.proof} Launch cleaner billing, approval, and operational workflows without diverting your team from the project work that matters.
          </p>
        </div>
        <div className="template2-feature-grid">
          {templateTwoFeatures.map(([title, copy]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
              <a href="/register">Learn more <ArrowRight /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="template2-billing rail">
        <div>
          <Tag>Revenue workflow</Tag>
          <h2>From approved BOQ to client-ready invoice in one connected flow.</h2>
          <p>
            Keep milestone billing, approvals, revisions, and documents tied to the same project record, so finance and delivery teams work from shared context.
          </p>
          <div className="template2-mini-plans">
            <article>
              <strong>Standard</strong>
              <span>INR 6.67/mo</span>
              <a href="/register">Get started</a>
            </article>
            <article>
              <strong>Plus</strong>
              <span>INR 12.50/mo</span>
              <a href="/register">Get started</a>
            </article>
          </div>
        </div>
        <InvoicePreview />
      </section>

      <SharedLowerSections variant="template2" />
    </>
  );
}

function TemplateThreeFullSections({ solution }: { solution: MarketingSolution }) {
  return (
    <>
      <section className="template3-showcase rail">
        <div>
          <Tag>Design to delivery</Tag>
          <h2>Everything your {solution.title.toLowerCase()} need before site work begins.</h2>
          <p>{solution.proof} Keep scope, costing, approvals, documentation, and delivery signals visible from the first estimate onward.</p>
        </div>
        <div className="template3-image-grid">
          <img src="/figma/asset-11.png" alt="Project workspace preview" />
          <img src="/figma/asset-12.png" alt="RVYO dashboard preview" />
          <img src="/figma/asset-17.jpeg" alt="Interior project team discussion" />
        </div>
      </section>

      <SharedLowerSections variant="template3" />
    </>
  );
}

function SharedLowerSections({ variant }: { variant: "template2" | "template3" }) {
  return (
    <>
      <section className={`solution-control rail ${variant}`}>
        <div>
          <Tag>Workflow control</Tag>
          <h2>Stop managing projects. Start controlling them.</h2>
          <p>Bring project scope, costing, approvals, documents, communication, and commercial visibility into one workflow your whole team can trust.</p>
        </div>
        <div className="solution-control-grid">
          {workflowCards.map(([title, copy], index) => (
            <article key={title}>
              <div className={`solution-art solution-art-${index + 1}`} />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="solution-stack rail">
        <Tag>The RVYO stack</Tag>
        <h2>Purpose-built modules work together from initial scope to controlled execution.</h2>
        <div className="solution-stack-grid">
          {stackModules.map(([title, copy, items], index) => (
            <article key={title as string} className={index % 2 ? "reverse" : ""}>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
              <ul>
                {(items as string[]).map((item) => (
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

      <section className="solution-integrations">
        <div className="solution-integrations-rail">
          <Tag>Connected workflow</Tag>
          <h2>Bring every client touchpoint into RVYO.</h2>
          <p>Connect the tools your team already uses to capture leads, communicate with clients, and collect project payments without breaking your workflow.</p>
          <div className="solution-logo-orbit" aria-hidden="true">
            {["K", "N", "G", "+", "O", "A", "GH", "L", "M", "R"].map((glyph, index) => (
              <span key={`${glyph}-${index}`}>{glyph}</span>
            ))}
          </div>
          <div className="solution-dark-grid">
            {integrationFeatures.map(([title, copy]) => (
              <article key={title}>
                <span><Code2 /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="solution-pricing rail">
        <Tag>Simple pricing</Tag>
        <h2>Choose the plan that fits your team today. Upgrade when your operations grow.</h2>
        <div className="solution-pricing-grid">
          {pricingPlans.map((plan, index) => (
            <article key={plan.title} className={index === 1 ? "featured" : ""}>
              {index === 1 && <b>Most Popular</b>}
              <h3>{plan.title}</h3>
              <p>{plan.copy}</p>
              <div>
                <strong>{plan.price}</strong>
                <small>/ mo</small>
              </div>
              <a href="/register">{plan.cta}</a>
              <ul>
                {plan.items.map((item) => (
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

      <section className="solution-comparison rail">
        <Tag>The switch</Tag>
        <h2>Keep BOQs, costing, approvals, documents, and project information connected.</h2>
        <table>
          <thead>
            <tr>
              <th>Capability</th>
              <th>RVYO</th>
              <th>Other Apps</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map(([label, rvyo, other]) => (
              <tr key={label}>
                <td>{label}</td>
                <td><BadgeCheck />{rvyo}</td>
                <td>{other}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="solution-testimonials rail">
        <Tag>From the people using RVYO</Tag>
        <h2>Built around how project teams actually work.</h2>
        <div>
          {testimonials.map(([name, company, quote], index) => (
            <article key={name}>
              <p>&quot;{quote}&quot;</p>
              <footer>
                <span className={`solution-avatar avatar-${index + 1}`} />
                <div>
                  <strong>{name}</strong>
                  <small>{company}</small>
                </div>
                <span className="solution-stars">
                  {Array.from({ length: 5 }, (_, starIndex) => <Star key={starIndex} />)}
                </span>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </>
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
