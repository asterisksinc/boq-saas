import {
  ArrowRight,
  BarChart3,
  Check,
  FileText,
  Globe2,
  Layers3,
  Sparkles,
} from "lucide-react";
import styles from "./pricing.module.css";
import MobileNav from "../components/MobileNav";

const plans = [
  {
    name: "Standard",
    description: "For companies getting their revenue operations off the ground.",
    price: "Free",
    features: ["Up to $5M in annual revenue", "Up to 100 active contracts", "24/7 AI Agent help", "All features of the Platform", "Community Help"],
  },
  {
    name: "Startup",
    description: "For companies ready to operationalize revenue and reporting.",
    price: "$100",
    popular: true,
    features: ["$5M–$20M in annual revenue", "Up to 500 active contracts", "24/7 AI Agent help", "All features of the Platform", "Community Help"],
  },
];

const comparison = [
  ["Contract processing", true, true],
  ["Automated billing & invoicing", true, true],
  ["Collections & cash application", true, true],
  ["Complex usage billing", false, true],
  ["Reporting", true, true],
  ["ASC 606 RevRec", true, true],
  ["Advanced RevRec for complex usage", false, true],
  ["QuickBooks Online", true, true],
  ["Intuit Enterprise Suite", false, true],
  ["Rillet", true, true],
  ["NetSuite", false, true],
  ["Sage Intacct", false, true],
  ["Custom integrations", false, true],
] as const;

function Tag({ children }: { children: React.ReactNode }) {
  return <span className={styles.tag}><i />{children}</span>;
}

function Header() {
  const links = ["Home", "Product", "Features", "Pricing", "Solutions", "Insights", "Company"];
  return <header className="nav-shell"><div className={`nav-rail ${styles.pricingNav}`}><a className="brand-placeholder" href="/" aria-label="BOQ-SAAS home"><span aria-hidden="true">B</span><strong>BOQ-SAAS</strong></a><nav>{links.map(x => <a className={x === "Pricing" ? "active-nav" : undefined} aria-current={x === "Pricing" ? "page" : undefined} href={x === "Home" ? "/" : x === "Pricing" ? "/pricing" : `/#${x.toLowerCase()}`} key={x}>{x}</a>)}</nav><a className="button blue nav-cta" href="#pricing-demo">Request Demo</a><MobileNav current="Pricing"/></div></header>;
}

export default function PricingPage() {
  return <main className={styles.page}>
    <Header />
    <section className={styles.hero}>
      <div className={styles.heroRail}>
        <div className={styles.heroCopy}><Tag>Oberion Billings</Tag><h1>Revenue Automation<br />Built for Modern Teams</h1><p>Oberion empowers finance teams with AI-native billing, collections, and revenue<br />operations workflows.</p></div>
        <div className={styles.planGrid}>{plans.map(plan => <article className={`${styles.plan} ${plan.popular ? styles.popular : ""}`} key={plan.name}>{plan.popular && <span className={styles.popularLabel}><i />Most Popular Plan</span>}<div><h2><Sparkles />{plan.name}</h2><p>{plan.description}</p></div><div className={styles.planBody}><strong>{plan.price}</strong><small>/ month</small><ul>{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul></div><a href="#pricing-demo">{plan.popular ? "Get Started" : "Start free trial"}</a></article>)}</div>
        <div className={styles.pattern} />
      </div>
    </section>

    <section className={styles.aiStrip}><div className={styles.wideRail}><div className={styles.aiTitle}><Tag>Company</Tag><h2>AI included on every<br />plan, No hidden charges</h2></div><div className={styles.pills}>{["Custom Reporting", "Multi-Entity Support", "Advance API Support", "International Support", "Custom Workflows"].map(x => <span key={x}>{x}</span>)}</div><div className={styles.automation}><span><Sparkles /></span><div><h3>Smart Automation</h3><p>Automate invoicing, collections, and payment reconciliation so your team can focus on strategic financial operations.</p></div></div></div></section>

    <section className={styles.logoWall} aria-label="Trusted by modern teams"><div className={styles.logoGrid}>{["Mentropic", "Deep", "Betawise", "SourceAI", "Mentropic", "Deep", "Betawise", "SourceAI"].map((x, i) => <span key={`${x}-${i}`}>{x === "Deep" && <i />} {x}</span>)}</div></section>

    <section className={styles.productIntro}><div className={styles.contentRail}><div><Tag>Oberion Product</Tag><h2>Turn your schedule and<br />services into a clean booking<br />experience</h2></div><div className={styles.introFeatures}><MiniFeature icon={<Globe2 />} title="Offerings">A fast, seamless checkout that turns interest into bookings.</MiniFeature><MiniFeature icon={<Layers3 />} title="Schedules">View all upcoming classes and appointments in one place.</MiniFeature><MiniFeature icon={<FileText />} title="Management">Manage your clients, contacts, and plans from the Oberion dashboard.</MiniFeature></div></div></section>

    <section className={styles.billing}><div className={styles.contentRail}><div className={styles.tableHead}><h2>Billing &amp; Collections</h2><span><i />Standard</span><span><i />Startup</span></div><div className={styles.tableBody}>{comparison.map(([name, standard, startup]) => <div className={styles.tableRow} key={name}><span>{name}</span><b>{standard && <Check />}</b><b>{startup && <Check />}</b></div>)}</div><div className={styles.billingNote}><span><BarChart3 /></span><p>Simple usage billing price + quantity is available at any tier.<br />Simple instances of NetSuite or Sage with no customizations may be eligible for Grow Tier pricing upon review.</p></div></div></section>

    <section className={styles.support}><div className={styles.contentRail}><div className={styles.sectionHeading}><Tag>Oberion Support</Tag><h2>Get answers in minutes,<br />not weeks, 24/7.</h2></div><div className={styles.supportGrid}><article><div className={styles.blackOrb} /><h3>24/7 Human support</h3><p>Our customer success and support teams ensure seamless onboarding, tailored training, and rapid responses whenever your team needs help.</p></article><article><div className={styles.supportArt} aria-hidden="true" /><h3>In-House support Team</h3><p>Oberion works closely with your team through onboarding, setup, and ongoing support to ensure a smooth and successful rollout.</p></article></div></div></section>

    <section className={styles.solutions}><div className={styles.contentRail}><div className={styles.solutionsHead}><div><Tag>Oberion Solutions</Tag><h2>Unified Solutions for Businesses,<br />Workforces, and Customers</h2></div><p>Reduce manual work, close faster,<br />and keep revenue operations running<br />around the clock.</p></div><div className={styles.solutionGrid}><article className={styles.phoneCard}><div className={styles.phoneVisual} aria-hidden="true" /><div><h3>AI-Powered Billing and Revenue Automation</h3><p>Automate invoicing, collections, and reconciliations with AI-powered workflows built for speed and accuracy.</p><a href="#pricing-demo">Contact Agent</a></div></article><div className={styles.solutionFeatures}><SolutionFeature icon={<FileText />} title="Smart Automation">Automate invoicing, collections, and payment reconciliation so your team can focus on strategic financial operations.</SolutionFeature><SolutionFeature icon={<BarChart3 />} title="Unified Records">Create a complete customer view by connecting contracts, payments, usage, and billing data in one intelligent system.</SolutionFeature></div></div></div></section>

    <section className={styles.testimonial}><div className={styles.contentRail}><div className={styles.testimonialPhoto} aria-label="Oberion customer team" /><div className={styles.quote}><div><span>“</span><h2>Our finance team was buried in manual work before <em>Oberion</em>. Now invoicing, collections, and reconciliation run automatically, even as our volume keeps growing.</h2><p>— Sophia Reynolds, CFO</p><a href="#pricing-demo">Request Demo</a></div><footer><small>LuthoropticsAI</small><strong>80% <span>reduction in aged-receivables</span></strong></footer></div></div></section>

    <section className={styles.demo} id="pricing-demo"><div className={styles.contentRail}><img src="/figma/contours.png" alt="" /><Tag>Oberion Demo</Tag><h2>Put revenue on autopilot</h2><p>From contract to close — faster cash, accurate books, and less manual work.</p><form><input type="email" aria-label="Email address" placeholder="Email address" /><button>Get a Demo <ArrowRight /></button></form></div></section>
  </main>;
}

function MiniFeature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) { return <article><span>{icon}</span><h3>{title}</h3><p>{children}</p></article>; }
function SolutionFeature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) { return <article><span>{icon}</span><div><h3>{title}</h3><p>{children}</p></div></article>; }
