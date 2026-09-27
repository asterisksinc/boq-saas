export type SolutionTemplate = "template1" | "template2" | "template3";

export type MarketingSolution = {
  title: string;
  slug: string;
  template: SolutionTemplate;
  eyebrow: string;
  headline: string;
  copy: string;
  proof: string;
};

export const marketingSolutions: MarketingSolution[] = [
  {
    title: "Interior Designers",
    slug: "interior-designers",
    template: "template1",
    eyebrow: "For design-led teams",
    headline: "Commercial control for interior designers.",
    copy: "Create BOQs, control revisions, share approvals, and keep every client decision connected to cost and scope.",
    proof: "Ideal for studios moving beyond spreadsheet-heavy estimating.",
  },
  {
    title: "Turnkey Contractors",
    slug: "turnkey-contractors",
    template: "template1",
    eyebrow: "For execution teams",
    headline: "Run turnkey projects with tighter cost visibility.",
    copy: "Manage BOQs, vendors, procurement handoffs, project documents, and commercial approvals from one workspace.",
    proof: "Built for teams handling design, sourcing, and site delivery.",
  },
  {
    title: "Interior Contractors",
    slug: "interior-contractors",
    template: "template1",
    eyebrow: "For contractor workflows",
    headline: "Keep estimates, materials, and execution in sync.",
    copy: "Turn project scope into trackable BOQs, compare rates, monitor margins, and avoid version confusion during delivery.",
    proof: "Designed for contractors who need fast estimating and clear project control.",
  },
  {
    title: "Interior Design Studios",
    slug: "interior-design-studios",
    template: "template2",
    eyebrow: "For growing studios",
    headline: "Unify costing, approvals, and revenue workflows.",
    copy: "Give your studio one operating layer for proposals, BOQs, client approvals, invoices, and team visibility.",
    proof: "Best for studios standardizing repeatable commercial processes.",
  },
  {
    title: "Design Build Firms",
    slug: "design-build-firms",
    template: "template2",
    eyebrow: "For design-build firms",
    headline: "Connect design intent to project commercials.",
    copy: "Bring estimating, revisions, billing milestones, procurement, and delivery information into a shared workflow.",
    proof: "Useful when design and execution teams need one source of truth.",
  },
  {
    title: "Modular Furniture Companies",
    slug: "modular-furniture-companies",
    template: "template2",
    eyebrow: "For modular teams",
    headline: "Structure pricing for repeatable modular projects.",
    copy: "Create reusable BOQ logic, manage productized cost libraries, track approvals, and keep orders tied to project scope.",
    proof: "Built for catalog-led teams scaling custom project delivery.",
  },
  {
    title: "Architecture Firms",
    slug: "architecture-firms",
    template: "template3",
    eyebrow: "For architecture firms",
    headline: "Turn project scope into controlled commercial workflows.",
    copy: "Coordinate estimates, documents, design-stage approvals, and consultant-ready project information without losing detail.",
    proof: "Helpful for firms adding stronger project and commercial visibility.",
  },
  {
    title: "Growing Project Teams",
    slug: "growing-project-teams",
    template: "template3",
    eyebrow: "For growing teams",
    headline: "Your projects are growing. Your workflow should too.",
    copy: "Bring BOQs, costing, approvals, documents, integrations, and commercial visibility into one system.",
    proof: "Made for teams moving from informal processes to structured operations.",
  },
];

export function getSolutionBySlug(slug: string) {
  return marketingSolutions.find((solution) => solution.slug === slug);
}
