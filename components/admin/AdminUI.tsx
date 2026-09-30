"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  CircleHelp,
  Contact,
  Download,
  Eye,
  FileText,
  Filter,
  Gauge,
  ImageIcon,
  LayoutTemplate,
  LifeBuoy,
  MoreHorizontal,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";

type BadgeTone = "green" | "blue" | "orange" | "red" | "gray" | "purple";
type AdminTableColumn<T> = { key: string; label: string; width?: string; render: (row: T) => ReactNode };
type AdminTableProps<T> = { columns: AdminTableColumn<T>[]; rows: T[]; menu?: ReactNode };

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Gauge },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: UserCircle },
  { href: "/admin/roles", label: "Roles", icon: ShieldCheck },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/templates", label: "Templates", icon: FileText },
  { href: "/admin/cms", label: "Content & CMS", icon: ImageIcon },
  { href: "/admin/blogs", label: "Blogs & Resources", icon: BookOpen },
  { href: "/admin/contact-submissions", label: "Contact Submissions", icon: Contact },
  { href: "/admin/offers", label: "Offers & Coupons", icon: Percent },
  { href: "/admin/support", label: "Support & Operations", icon: LifeBuoy },
  { href: "/admin/analytics?tab=events", label: "Activity Search", icon: Activity },
];

const orgRows = [
  ["Northline Design Studio", "ORG-1042", "Jane Cooper", "Interior Design", "Professional", "ACTIVE", 24, 18, 126, "$48k/mo", "5 Aug 2024", "1 hr ago", "Healthy"],
  ["Verona Infra", "ORG-1068", "Guy Hawkins", "Contractor", "Starter", "Suspended", 12, 8, 19, "$18k/mo", "5 Aug 2024", "1 hr ago", "Healthy"],
  ["Blueprint Design House", "ORG-1042", "Bessie Cooper", "Interior Design", "Business", "ACTIVE", 16, 32, 95, "$48k/mo", "5 Aug 2024", "1 hr ago", "Healthy"],
  ["Forma Living", "ORG-1014", "Kristin Watson", "Architecture", "Professional", "Suspended", 41, 5, 248, "$62k/mo", "5 Aug 2024", "2 hrs ago", "Warning"],
  ["Meridian Interiors", "ORG-1009", "Arlene McCoy", "Interior Design", "Business", "TRIAL", 8, 12, 24, "$12k/mo", "5 Aug 2024", "1 day ago", "Healthy"],
  ["Arc Habitat", "ORG-1021", "Annette Black", "Architecture", "Business", "ACTIVE", 27, 21, 155, "$48k/mo", "5 Aug 2024", "1 hr ago", "Warning"],
  ["Dwellcraft Studio", "ORG-1077", "Dianne Russell", "Architecture", "Starter", "ACTIVE", 17, 21, 94, "$28k/mo", "5 Aug 2024", "1 hr ago", "Healthy"],
].map(([name, code, owner, businessType, plan, status, users, projects, boqs, revenue, created, lastActivity, health]) => ({
  name, code, owner, businessType, plan, status, users, projects, boqs, revenue, created, lastActivity, health,
}));

const userRows = [
  ["Kathryn Murphy", "alma.lawson@example.com", "Studio Arc", "ORG-1029", "Editor", "Design", "ACTIVE", "18 min ago", "Email + Password", "Enabled", "5 Aug 2024"],
  ["Albert Flores", "michelle.rivera@example.com", "Northline Design Studio", "ORG-1042", "Designer", "Design", "Pending", "2 hrs ago", "Google", "Enabled", "5 Aug 2024"],
  ["Jenny Wilson", "nathan.roberts@example.com", "Forma Living", "ORG-1014", "Editor", "Design", "ACTIVE", "Yesterday", "Google", "Enabled", "5 Aug 2024"],
  ["Wade Warren", "curtis.weaver@example.com", "Forma Living", "ORG-1014", "Contributor", "Engineering", "Suspended", "32 min ago", "Email + Password", "Disabled", "5 Aug 2024"],
  ["Devon Lane", "dolores.chambers@example.com", "Northline Design Studio", "ORG-1042", "Organization Owner", "Management", "TRIAL", "1 hr ago", "Email + Password", "Enabled", "5 Aug 2024"],
  ["Bessie Cooper", "willie.jennings@example.com", "Meridian Interiors", "ORG-1009", "Manager", "Operations", "ACTIVE", "2 days ago", "Email + Password", "Disabled", "5 Aug 2024"],
  ["Marvin McKinney", "kenzi.lawson@example.com", "Forma Living", "ORG-1042", "Organization Admin", "Management", "ACTIVE", "1 day ago", "Email + Password", "Enabled", "5 Aug 2024"],
].map(([name, email, organization, orgCode, role, team, status, lastLogin, auth, twoFa, created]) => ({
  name, email, organization, orgCode, role, team, status, lastLogin, auth, twoFa, created,
}));

const roleRows = [
  ["Content Admin", "SYSTEM", "Platform", "Manage platform content and CMS templates", "15 Permissions", 8, "Active", "Jul 20, 2026 by Admin"],
  ["Contributor", "CUSTOM", "Organization", "Create and update permitted records and project items", "8 Permissions", 290, "Active", "Jul 20, 2026 by Mike D."],
  ["Editor", "CUSTOM", "Organization", "Create and edit assigned content and project data", "12 Permissions", 430, "Active", "Jul 20, 2026 by Mike D."],
  ["External User", "CUSTOM", "Project", "Restricted external auditor and client subcontractor access", "3 Permissions", 0, "Active", "Jul 20, 2026 by Admin"],
  ["Finance Admin", "CUSTOM", "Platform", "Manage billing, subscriptions, invoices, and financial operations", "18 Permissions", 12, "Active", "Jul 20, 2026 by Admin"],
  ["Manager", "CUSTOM", "Organization", "Manage tenant users, projects and operational workflows", "16 Permissions", 640, "Active", "Jul 20, 2026 by Sarah T."],
  ["Organization Admin", "SYSTEM", "Organization", "Manage billing, subscriptions, invoices, and financial operations", "20 Permissions", 512, "Active", "Jul 20, 2026 by Sarah T."],
].map(([name, type, scope, description, permissions, users, status, modified]) => ({
  name, type, scope, description, permissions, users, status, modified,
}));

const templates = [
  ["Professional Proposal", "TPL-PROP-001", "Document", "Proposal", "Clean Detailed", "2,840", 38.4, "Active"],
  ["Modern Contract", "TPL-CON-002", "Document", "Contract", "Modern", "1,920", 24.7, "Active"],
  ["Quick Estimate", "TPL-INV-003", "Invoice", "Quote / Estimation", "Minimal", "3,420", 45.1, "Active"],
  ["Pro Invoice", "TPL-INV-004", "Invoice", "Invoice", "Futuristic", "1,680", 18.2, "Paused"],
  ["Standard BOQ", "TPL-BOQ-005", "BOQ", "BOQ", "Clean Detailed", "980", 12.5, "Active"],
  ["Minimal Proposal", "TPL-PROP-006", "Document", "Proposal", "Minimal", "760", 10.8, "Active"],
  ["Futuristic Contract", "TPL-CON-007", "Document", "Contract", "Futuristic", "620", 8.1, "Active"],
  ["Modern Quote", "TPL-PROP-008", "Invoice", "Quote / Estimation", "Modern", "540", 6.9, "Active"],
].map(([name, code, category, type, style, uses, preference, status]) => ({
  name, code, category, type, style, uses, preference: Number(preference), status,
}));

const modules = {
  blogs: [
    ["BOQ basics for modern studios", "Resource", "Published", "Sarah T.", "12,480", "Updated 1 hr ago"],
    ["Choosing the right costing model", "Blog", "Draft", "Content Team", "3,240", "Updated 4 hrs ago"],
    ["Contractor onboarding checklist", "Guide", "Published", "Mike D.", "8,912", "Updated yesterday"],
    ["Invoice automation playbook", "Resource", "Review", "Anika Rao", "6,128", "Updated 2 days ago"],
  ],
  offers: [
    ["WELCOME20", "20% off first 3 months", "Active", "3,420", "30 Sep 2026"],
    ["PROUPGRADE", "Professional plan upgrade", "Scheduled", "880", "15 Oct 2026"],
    ["REACTIVATE", "Win-back coupon", "Paused", "214", "22 Sep 2026"],
  ],
  support: [
    ["Failed Integration", "Payments", "Attention Required", "12", "8 min ago"],
    ["Failed Payments", "Billing", "Attention Required", "12", "16 min ago"],
    ["Open Support Tickets", "Support", "Active", "12", "1 hr ago"],
    ["Pending Abuse Reviews", "Trust", "Warning", "4", "2 hrs ago"],
  ],
  contacts: [
    ["Northline Design Studio", "jane@northline.example", "Enterprise enquiry", "New", "2 min ago"],
    ["Verona Infra", "ops@verona.example", "Pricing question", "Assigned", "18 min ago"],
    ["Meridian Interiors", "hello@meridian.example", "Partnership", "Closed", "1 day ago"],
  ],
  cms: [
    ["Home hero", "Landing Page", "Published", "20", "Updated 12 min ago"],
    ["Pricing FAQ", "CMS Block", "Draft", "8", "Updated 2 hrs ago"],
    ["Onboarding checklist", "Guide", "Published", "14", "Updated yesterday"],
    ["Invoice email template", "Email", "Review", "6", "Updated 3 days ago"],
  ],
};

export function AdminShell({ title, children, actionLabel = "New" }: { title: string; children: ReactNode; actionLabel?: string }) {
  return (
    <main className="admin-fig">
      <div className="admin-fig-glow" />
      <aside className="admin-rail" aria-label="Admin navigation">
        <Link className="admin-logo" href="/dashboard" aria-label="BOQ admin dashboard">
          <img src="/assets/boq-logo-small.svg" alt="" />
        </Link>
        <nav className="admin-nav">
          {navItems.map(({ href, label, icon: Icon }) => <AdminNavItem key={href} href={href} label={label} Icon={Icon} />)}
        </nav>
        <div className="admin-nav admin-nav-bottom">
          <Link href="/help" title="Help" aria-label="Help"><CircleHelp size={20} /></Link>
          <Link href="/settings" title="Settings" aria-label="Settings"><Settings size={20} /></Link>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <h1>{title}</h1>
          <div className="admin-top-actions">
            <label className="admin-search">
              <Search size={16} />
              <input placeholder="Search..." aria-label="Search" />
            </label>
            <button className="admin-primary"><Plus size={18} /><span>{actionLabel}</span><i /><ChevronDown size={18} /></button>
            <button className="admin-icon-button" aria-label="Notifications"><Bell size={19} /></button>
            <div className="admin-avatar">AD</div>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

function AdminNavItem({ href, label, Icon }: { href: string; label: string; Icon: typeof Gauge }) {
  const pathname = usePathname();
  const path = href.split("?")[0];
  const active = pathname === path || (path !== "/dashboard" && Boolean(pathname?.startsWith(`${path}/`)));
  return <Link className={active ? "active" : ""} href={href} title={label} aria-label={label}><Icon size={20} /></Link>;
}

export function AdminOverviewPage() {
  return (
    <AdminShell title="Overview">
      <section className="admin-overview-grid">
        <Panel className="admin-business-health">
          <SectionTitle title="Business Health" detail="Platform growth and commercial performance" />
          <div className="admin-metric-strip">
            <Metric value="$2.4M" label="MRR" trend="+12%" />
            <Metric value="12" label="New Organizations" trend="-3.2%" tone="red" />
            <Metric value="18.6%" label="Trial Conversion" trend="-6.2%" tone="red" />
            <Metric value="2.4%" label="Churn" trend="+1.2%" />
          </div>
          <ChartTabs legend={["Revenue", "New Organizations"]} />
          <LineChart />
        </Panel>
        <Panel className="admin-blue-panel">
          <SectionTitle title="Analytics Metric" />
          <MetricRow icon={Building2} value="248" label="Organizations" />
          <MetricRow icon={FileText} value="186" label="Active Subscriptions" />
          <MetricRow icon={Gauge} value="$2.4M" label="Monthly Recurring Revenue" trend="+6.2%" />
          <MetricRow icon={Users} value="1,284" label="Active Users" trend="+6.2%" />
        </Panel>
        <Panel>
          <SectionTitle title="Product Health" />
          <div className="admin-mini-grid">
            <Metric value="1,284" label="Active Users" trend="+14.1%" />
            <Metric value="3,642" label="Projects Created" trend="+14.1%" />
            <Metric value="8,914" label="BOQs Created" trend="+14.1%" />
            <Metric value="2,186" label="Templates Used" trend="+14.1%" />
            <Metric value="5,274" label="Proposals Generated" trend="+14.1%" />
            <Metric value="3,891" label="Invoice Generated" trend="+14.1%" />
          </div>
        </Panel>
        <Panel>
          <SectionTitle title="Operational Health" />
          {modules.support.slice(0, 3).map((row) => <OpsRow key={row[0]} title={row[0]} label={row[2]} value={row[3]} />)}
        </Panel>
        <Panel>
          <SectionTitle title="Subscription Status" />
          <Donut value="248" label="Organizations" />
        </Panel>
        <Panel className="admin-span">
          <SectionTitle title="Recent Activity" />
          {["Organization Created", "Role permission updated", "Template published"].map((title) => (
            <ActivityRow key={title} title={title} detail="Northline Design Studio" />
          ))}
        </Panel>
      </section>
    </AdminShell>
  );
}

export function OrganizationsPage() {
  const columns: AdminTableColumn<(typeof orgRows)[number]>[] = [
    { key: "organization", label: "Organization", width: "180px", render: row => <TwoLine title={row.name as string} detail={row.code as string} /> },
    { key: "owner", label: "Owner", width: "120px", render: row => row.owner },
    { key: "businessType", label: "Business Type", width: "130px", render: row => row.businessType },
    { key: "plan", label: "Plan", width: "105px", render: row => <Badge tone="gray">{row.plan}</Badge> },
    { key: "status", label: "Status", width: "96px", render: row => <Badge tone={row.status === "Suspended" ? "orange" : row.status === "TRIAL" ? "blue" : "green"}>{row.status}</Badge> },
    { key: "users", label: "Users", width: "68px", render: row => row.users },
    { key: "projects", label: "Projects", width: "82px", render: row => row.projects },
    { key: "boqs", label: "BOQs", width: "68px", render: row => row.boqs },
    { key: "revenue", label: "Revenue", width: "90px", render: row => row.revenue },
    { key: "created", label: "Created", width: "105px", render: row => row.created },
    { key: "activity", label: "Last Activity", width: "120px", render: row => row.lastActivity },
    { key: "health", label: "Health", width: "90px", render: row => <span className={row.health === "Warning" ? "admin-text-orange" : "admin-text-green"}>{row.health}</span> },
  ];
  return <ListPage title="Organizations" heading="Organizations" detail="Manage every subscribed company or workspace on the platform." action="New Organization" stats={[["Total Organizations", "248"], ["Active", "184", "green"], ["Trial", "35", "blue"], ["Attention Required", "25", "orange"]]} search="Search projects or clients..." table={<AdminTable rows={orgRows} columns={columns} />} />;
}

export function UsersPage() {
  const columns: AdminTableColumn<(typeof userRows)[number]>[] = [
    { key: "user", label: "User", render: row => <TwoLine title={row.name} detail={row.email} /> },
    { key: "organization", label: "Organization", width: "180px", render: row => <TwoLine title={row.organization} detail={row.orgCode} /> },
    { key: "role", label: "Role", width: "160px", render: row => row.role },
    { key: "team", label: "Team", width: "110px", render: row => row.team },
    { key: "status", label: "Status", width: "96px", render: row => <Badge tone={row.status === "Suspended" ? "red" : row.status === "Pending" ? "orange" : row.status === "TRIAL" ? "blue" : "green"}>{row.status}</Badge> },
    { key: "login", label: "Last Login", width: "110px", render: row => row.lastLogin },
    { key: "auth", label: "Authentication", width: "142px", render: row => <Badge tone="gray">{row.auth}</Badge> },
    { key: "twoFa", label: "2FA", width: "82px", render: row => <Badge tone={row.twoFa === "Enabled" ? "blue" : "gray"}>{row.twoFa}</Badge> },
    { key: "created", label: "Created", width: "96px", render: row => row.created },
  ];
  return <ListPage title="All User" heading="Users & Access" detail="Manage platform users, roles, organization access, and account status" action="Invite User" stats={[["Total Users", "1,842"], ["Active Users", "1,674", "green"], ["Pending Invitations", "86", "orange"], ["Suspended Users", "42", "red"], ["2FA Enabled", "1,842"]]} search="Search organization or clients..." table={<AdminTable rows={userRows} columns={columns} />} />;
}

export function RolesPage() {
  const columns: AdminTableColumn<(typeof roleRows)[number]>[] = [
    { key: "name", label: "Role Name", width: "160px", render: row => row.name },
    { key: "type", label: "Type", width: "96px", render: row => <Badge tone={row.type === "SYSTEM" ? "blue" : "purple"}>{row.type}</Badge> },
    { key: "scope", label: "Scope", width: "110px", render: row => <Badge tone="gray">{row.scope}</Badge> },
    { key: "description", label: "Description", render: row => row.description },
    { key: "permissions", label: "Permissions", width: "120px", render: row => <Badge tone="gray">{row.permissions}</Badge> },
    { key: "users", label: "Users", width: "70px", render: row => row.users },
    { key: "status", label: "Status", width: "82px", render: row => <Badge tone="blue">{row.status}</Badge> },
    { key: "modified", label: "Last Modified", width: "170px", render: row => row.modified },
  ];
  return <ListPage title="Roles" heading="Roles" detail="Manage platform roles and control the permissions available to users across the SaaS platform." action="Create Role" search="Search by role name, identifier, or description" table={<AdminTable rows={roleRows} columns={columns} />} />;
}

export function AnalyticsPage() {
  return (
    <AdminShell title="Analytics">
      <section className="admin-page-stack">
        <PageHeading title="Admin Analytics" detail="Track growth, revenue, usage and customer health across the platform." actions={<><button className="admin-secondary"><CircleHelp size={16} />Help</button><button className="admin-secondary"><Download size={16} />Export</button><button className="admin-secondary square"><RefreshCw size={16} /></button></>} />
        <div className="admin-filter-grid">
          {["Time Period", "Comparison", "Segment", "User Type", "Platform"].map((item, index) => <SelectField key={item} label={item} value={["Last 30 Days", "Previous Period", "All Segments", "All Users", "All Platforms"][index]} />)}
          <button className="admin-reset">Reset</button><button className="admin-apply">Apply</button>
        </div>
        <Segmented items={["Overview", "Acquisition", "Activation", "Revenue"]} />
        <div className="admin-kpi-row">
          <MetricCard label="Active Organisations" value="2,847" trend="12%" />
          <MetricCard label="Weekly Active Users" value="28,416" trend="18%" />
          <MetricCard label="Monthly Recurring Revenue" value="₹482,320" trend="14%" />
          <MetricCard label="Net Revenue Retention" value="112%" trend="3%" />
          <MetricCard label="Activation Rate" value="68%" trend="6%" />
        </div>
        <div className="admin-chart-row">
          <ChartCard title="Growth & Performance" />
          <ChartCard title="Revenue Trend" />
          <ChartCard title="User Engagement" />
        </div>
        <div className="admin-bottom-row">
          <Panel><SectionTitle title="Customer Health" /><Donut value="2,847" label="Organisations" compact /></Panel>
          <Panel className="admin-wide"><SectionTitle title="Recent Alerts & Anomalies" />{["Unusual spike in churn", "Drop in feature adoption", "High support ticket volume"].map((x, i) => <AlertRow key={x} title={x} tone={i === 0 ? "red" : i === 1 ? "orange" : "blue"} />)}</Panel>
          <Panel><SectionTitle title="Quick Insights" />{["Signups are up 24%", "Enterprise segment is growing", "Feature adoption improving"].map(x => <InsightRow key={x} title={x} />)}</Panel>
        </div>
      </section>
    </AdminShell>
  );
}

export function TemplatesAdminPage() {
  const columns: AdminTableColumn<(typeof templates)[number]>[] = [
    { key: "template", label: "Template", render: row => <div className="admin-template-cell"><span className="admin-thumb" /><TwoLine title={row.name} detail={row.code} /></div> },
    { key: "category", label: "Category", width: "160px", render: row => row.category },
    { key: "type", label: "Type", width: "180px", render: row => row.type },
    { key: "style", label: "Style", width: "160px", render: row => <Badge tone={row.style === "Futuristic" ? "orange" : row.style === "Modern" ? "purple" : row.style === "Minimal" ? "gray" : "blue"}>{row.style}</Badge> },
    { key: "uses", label: "Total Uses", width: "150px", render: row => row.uses },
    { key: "preference", label: "Preference", width: "180px", render: row => <Progress value={row.preference} /> },
    { key: "status", label: "Status", width: "120px", render: row => <Badge tone={row.status === "Paused" ? "orange" : "green"}>{row.status}</Badge> },
  ];
  return <ListPage title="Template" heading="Template" detail="Manage and monitor document templates available across the platform." action="New Template" stats={[["Total Templates", "24"], ["Active Templates", "20"], ["Total Uses", "12,840"], ["Uses This Month", "1,842"], ["Clean Detailed", "42%"]]} tabs={["All Templates", "BOQ", "Documents", "Invoices"]} search="Search by template name or ID..." table={<AdminTable rows={templates} columns={columns} menu={<Menu />} />} />;
}

export function ModulePage({ kind }: { kind: keyof typeof modules }) {
  const config = {
    blogs: ["Blogs & Resources", "Publish, review and monitor educational content across the platform.", "New Resource", ["Total Resources", "42"], ["Published", "34"], ["In Review", "5"], ["Drafts", "3"]],
    offers: ["Offers & Coupons", "Create and monitor promotional campaigns and subscription coupons.", "New Coupon", ["Active Coupons", "12"], ["Redemptions", "4,514"], ["Scheduled", "3"], ["Paused", "2"]],
    support: ["Support & Operations", "Monitor incidents, failed jobs, payments and support workflows.", "New Workflow", ["Open Issues", "40"], ["Attention Required", "28"], ["SLA Risk", "6"], ["Resolved Today", "112"]],
    contacts: ["Contact Submissions", "Review website enquiries and assign follow-up owners.", "New Entry", ["Total Contacts", "1,248"], ["New", "42"], ["Assigned", "86"], ["Closed", "1,120"]],
    cms: ["Content & CMS", "Manage landing pages, CMS blocks, system copy and transactional content.", "New Content", ["Total Items", "68"], ["Published", "51"], ["Draft", "11"], ["Review", "6"]],
  }[kind] as [string, string, string, ...string[][]];
  const rows = modules[kind];
  const columns: AdminTableColumn<(typeof rows)[number]>[] = [
    { key: "name", label: kind === "contacts" ? "Submission" : "Name", render: row => <TwoLine title={row[0]} detail={row[1]} /> },
    { key: "status", label: "Status", width: "160px", render: row => <Badge tone={row[2] === "Published" || row[2] === "Active" || row[2] === "Closed" ? "green" : row[2] === "Draft" || row[2] === "Paused" ? "gray" : row[2] === "New" || row[2] === "Scheduled" || row[2] === "Attention Required" || row[2] === "Warning" ? "orange" : "blue"}>{row[2]}</Badge> },
    { key: "owner", label: kind === "support" ? "Count" : kind === "offers" ? "Redemptions" : "Owner", width: "180px", render: row => row[3] },
    { key: "metric", label: kind === "support" ? "Last Event" : kind === "contacts" ? "Received" : "Metric", width: "180px", render: row => row[4] },
    { key: "updated", label: "Updated", width: "180px", render: row => row[5] ?? "Just now" },
  ];
  const stats = config.slice(3) as string[][];
  return <ListPage title={config[0]} heading={config[0]} detail={config[1]} action={config[2]} stats={stats} search={`Search ${config[0].toLowerCase()}...`} table={<AdminTable rows={rows} columns={columns} />} />;
}

function ListPage({ title, heading, detail, action, stats, search, tabs, table }: { title: string; heading: string; detail: string; action: string; stats?: string[][]; search: string; tabs?: string[]; table: ReactNode }) {
  const [filterOpen, setFilterOpen] = useState(false);
  return (
    <AdminShell title={title} actionLabel="New">
      <section className="admin-page-stack">
        <PageHeading title={heading} detail={detail} actions={<button className="admin-primary single"><Plus size={18} />{action}</button>} />
        {stats && <div className="admin-stat-grid">{stats.map(([label, value, tone]) => <StatCard key={label} label={label} value={value} tone={tone as BadgeTone} />)}</div>}
        {tabs && <Segmented items={tabs} />}
        <div className="admin-table-toolbar">
          <label className="admin-search admin-content-search"><Search size={16} /><input placeholder={search} /></label>
          <button className={`admin-secondary ${filterOpen ? "active" : ""}`} onClick={() => setFilterOpen(!filterOpen)}><Filter size={16} />Filter</button>
          {filterOpen && <div className="admin-filter-popover"><b>FILTER</b><label><input type="checkbox" defaultChecked /> Active</label><label><input type="checkbox" /> Trial</label><label><input type="checkbox" /> Attention required</label><button onClick={() => setFilterOpen(false)}>Apply Filters</button></div>}
        </div>
        {table}
      </section>
    </AdminShell>
  );
}

function AdminTable<T>({ columns, rows, menu }: AdminTableProps<T>) {
  const [open, setOpen] = useState(0);
  return (
    <Panel className="admin-table-panel">
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr>{columns.map(c => <th key={c.key} style={{ width: c.width }}>{c.label}</th>)}<th /></tr></thead>
          <tbody>
            {rows.map((row, index) => <tr key={index}>{columns.map(c => <td key={c.key} style={{ width: c.width }}>{c.render(row)}</td>)}<td className="admin-actions-cell"><button onClick={() => setOpen(open === index + 1 ? 0 : index + 1)}><MoreHorizontal size={18} /></button>{open === index + 1 && (menu ?? <Menu />)}</td></tr>)}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PageHeading({ title, detail, actions }: { title: string; detail: string; actions?: ReactNode }) {
  return <div className="admin-page-heading"><div><h2>{title}</h2><p>{detail}</p></div>{actions && <div className="admin-heading-actions">{actions}</div>}</div>;
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`admin-panel ${className}`}>{children}</div>;
}

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return <div className="admin-section-title"><h3>{title}</h3>{detail && <p>{detail}</p>}</div>;
}

function Metric({ value, label, trend, tone = "green" }: { value: string; label: string; trend?: string; tone?: "green" | "red" }) {
  return <div className="admin-metric"><div><strong>{value}</strong>{trend && <span className={tone}>{trend}</span>}</div><small>{label}</small></div>;
}

function MetricRow({ icon: Icon, value, label, trend = "+12.4%" }: { icon: typeof Gauge; value: string; label: string; trend?: string }) {
  return <div className="admin-blue-metric"><span><Icon size={18} /></span><div><strong>{value}</strong><small>{label}</small></div><em>{trend}</em></div>;
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: BadgeTone }) {
  return <div className="admin-stat-card"><span>{label}</span><strong className={tone ? `tone-${tone}` : ""}>{value}</strong></div>;
}

function MetricCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return <Panel className="admin-kpi-card"><span>{label}</span><strong>{value}</strong><small>+ {trend} vs previous period</small></Panel>;
}

function ChartTabs({ legend }: { legend: string[] }) {
  return <div className="admin-chart-tabs"><div><button>Week</button><button className="active">Month</button><button>Quarter</button></div><p><i />{legend[0]}<b />{legend[1]}</p></div>;
}

function LineChart() {
  return <div className="admin-line-chart"><svg viewBox="0 0 900 210" preserveAspectRatio="none"><path d="M0 150 C150 100 250 88 360 80 S540 135 650 120 800 88 900 48" /><path className="alt" d="M0 155 C145 118 280 100 380 95 S520 142 650 124 800 95 900 66" /><path className="fill" d="M0 155 C145 118 280 100 380 95 S520 142 650 124 800 95 900 66 L900 210 L0 210Z" /></svg><div>{["Mar", "Apr", "May", "Jun", "Jul", "Aug"].map(x => <span key={x}>{x}</span>)}</div></div>;
}

function ChartCard({ title }: { title: string }) {
  return <Panel><div className="admin-card-head"><SectionTitle title={title} /><button>Monthly <ChevronDown size={14} /></button></div><LineChart /></Panel>;
}

function Donut({ value, label, compact }: { value: string; label: string; compact?: boolean }) {
  return <div className={`admin-donut-wrap ${compact ? "compact" : ""}`}><div className="admin-donut"><strong>{value}</strong><span>{label}</span></div><div className="admin-donut-legend"><span><i className="blue" />Active <b>186</b></span><span><i className="sky" />Trial <b>42</b></span><span><i className="orange" />Past Due <b>9</b></span><span><i className="purple" />Grace Period <b>5</b></span><span><i className="red" />Suspended <b>4</b></span><span><i className="gray" />Cancelled <b>2</b></span></div></div>;
}

function OpsRow({ title, label, value }: { title: string; label: string; value: string }) {
  return <div className="admin-ops-row"><span><AlertTriangle size={17} /></span><div><b>{title}</b><small>{label}</small></div><strong>{value}</strong><ChevronDown size={16} /></div>;
}

function ActivityRow({ title, detail }: { title: string; detail: string }) {
  return <div className="admin-activity-row"><span><Building2 size={18} /></span><div><b>{title}</b><small>{detail}</small><small>2 min ago</small></div></div>;
}

function AlertRow({ title, tone }: { title: string; tone: BadgeTone }) {
  return <div className="admin-alert-row"><span className={`tone-${tone}`}><AlertTriangle size={16} /></span><div><b>{title}</b><small>Churn rate increased by 2.3% in the last 7 days.</small></div><em>2 hours ago</em></div>;
}

function InsightRow({ title }: { title: string }) {
  return <div className="admin-alert-row insight"><span><Activity size={16} /></span><div><b>{title}</b><small>Your platform gained 1,240 new users this month.</small></div></div>;
}

function TwoLine({ title, detail }: { title: ReactNode; detail: ReactNode }) {
  return <div className="admin-two-line"><b>{title}</b><span>{detail}</span></div>;
}

function Badge({ children, tone }: { children: ReactNode; tone: BadgeTone }) {
  return <span className={`admin-badge tone-${tone}`}>{children}</span>;
}

function Progress({ value }: { value: number }) {
  return <div className="admin-progress"><span>{value}%</span><i><b style={{ width: `${Math.min(value * 2, 100)}%` }} /></i></div>;
}

function Segmented({ items }: { items: string[] }) {
  const [active, setActive] = useState(items[0]);
  return <div className="admin-segmented">{items.map(item => <button key={item} className={active === item ? "active" : ""} onClick={() => setActive(item)}>{item}</button>)}</div>;
}

function SelectField({ label, value }: { label: string; value: string }) {
  return <label className="admin-select-field"><span>{label}</span><button>{value}<ChevronDown size={16} /></button></label>;
}

function Menu() {
  return <div className="admin-row-menu"><button><Eye size={16} />View</button><button><CircleHelp size={16} />Pause</button><button className="danger"><Trash2 size={16} />Delete</button></div>;
}

export function useFilteredRows<T extends Record<string, unknown>>(rows: T[], query: string) {
  return useMemo(() => rows.filter(row => Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())), [rows, query]);
}
