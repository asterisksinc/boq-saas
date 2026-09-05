"use client";

import { ChevronDown, ChevronLeft, ChevronRight, FilePlus2, FileSpreadsheet, Plus, RefreshCw, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardOverview, getApiErrorMessage, getDashboardOverview } from "@/lib/api/auth";

const menuIcons = ["dashboard-overview-active", "dashboard-projects", "dashboard-boqs", "dashboard-costs", "dashboard-workspace", "dashboard-estimates", "dashboard-purchase-orders", "dashboard-analytics", "dashboard-reports", "dashboard-integrations", "dashboard-billing"];
type DashboardItem = { name: string; subtitle?: string; value?: number; status?: string };

function asItems(values: unknown[]): DashboardItem[] {
    return values.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const value = item as Record<string, unknown>;
        const name = typeof value.name === "string" ? value.name : typeof value.title === "string" ? value.title : "Untitled";
        return [{ name, subtitle: typeof value.projectName === "string" ? value.projectName : typeof value.subtitle === "string" ? value.subtitle : undefined, value: typeof value.value === "number" ? value.value : typeof value.total === "number" ? value.total : undefined, status: typeof value.status === "string" ? value.status : undefined }];
    });
}

function formatNumber(value: number) { return new Intl.NumberFormat("en-IN").format(value); }

export default function DashboardPage() {
    const router = useRouter();
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [recentProjects, setRecentProjects] = useState<DashboardItem[]>([]);
    const [recentBoqs, setRecentBoqs] = useState<DashboardItem[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const [overviewData, projRes, boqRes] = await Promise.all([
                getDashboardOverview(),
                fetch("/api/v1/projects?pageSize=5&sortBy=updatedAt&sortOrder=desc", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
                fetch("/api/v1/boqs?pageSize=5", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
            ]);
            setOverview(overviewData);
            // Use real project data instead of demo data
            const projItems = (projRes?.data?.items ?? []).map((p: any) => ({
                name: p.name || p.projectCode || "Untitled",
                subtitle: p.clientName || p.projectType || undefined,
                value: p.projectValue ?? p.approvedBudget ?? undefined,
                status: p.status,
            }));
            setRecentProjects(projItems);
            const boqItems = (boqRes?.data?.items ?? []).map((b: any) => ({
                name: b.boqNumber || b.boq_number || "Untitled",
                subtitle: b.projectName || b.project_name || undefined,
                value: b.grandTotal ?? b.grand_total ?? b.estimatedValue ?? undefined,
                status: b.status,
            }));
            setRecentBoqs(boqItems);
        }
        catch (requestError) {
            const message = getApiErrorMessage(requestError);
            if (/authentication|required|unauthenticated/i.test(message)) router.replace("/login");
            else setError(message);
        } finally { setLoading(false); }
    }, [router]);

    useEffect(() => { void load(); }, [load]);

    const hasContent = overview ? (recentProjects.length > 0 || recentBoqs.length > 0 || overview.kpis.totalProjects > 0 || overview.kpis.draftBoqs > 0) : false;
    const money = useMemo(() => overview ? new Intl.NumberFormat("en-IN", { style: "currency", currency: overview.scope.currency || "INR", notation: "compact", maximumFractionDigits: 1 }) : null, [overview]);

    return <main className="fig-dashboard">
        <div className="fig-dashboard-glow" />
        <DashboardRail />
        <div className="fig-dashboard-main">
            <DashboardHeader />
            {loading ? <DashboardLoading /> : error ? <section className="fig-dashboard-error"><h2>Couldn&apos;t load your dashboard</h2><p>{error}</p><button onClick={() => void load()}><RefreshCw size={16} /> Try again</button></section> : overview ? <section className="fig-dashboard-layout">
                <div className="fig-dashboard-left">
                    <Analytics overview={overview} hasContent={hasContent} money={money} />
                    <div className="fig-dashboard-bottom">
                        <ProjectsCard overview={overview} hasContent={hasContent} />
                        <div className="fig-dashboard-stack"><BoqCard items={recentBoqs} hasContent={hasContent} money={money} /><QuickActions /></div>
                    </div>
                </div>
                <aside className="fig-dashboard-art" aria-hidden="true"><span /><i /><b /></aside>
            </section> : null}
        </div>
    </main>;
}

function DashboardRail() {
    const router = useRouter();
    const menuRoutes = ["/dashboard", "/projects", "/boqs", "/costs", "/workspace", "/proposals", "/invoices", "/analytics", "/documents", "/integrations", "/billing"];

    return <aside className="fig-dashboard-rail" aria-label="Dashboard navigation">
        <div className="fig-dashboard-logo"><span><img src="/assets/boq-logo-small.svg" alt="BOQ" /></span></div>
        <nav className="fig-dashboard-menu">{menuIcons.map((icon, index) => (
            <button
                key={icon}
                className={index === 0 ? "is-current" : ""}
                type="button"
                aria-label={`Navigation item ${index + 1}`}
                onClick={() => router.push(menuRoutes[index] || "/dashboard")}
            >
                <img src={`/assets/dashboard/${icon}.svg`} alt="" />
            </button>
        ))}</nav>
        <div className="fig-dashboard-tools"><button type="button" aria-label="Help"><img src="/assets/dashboard/dashboard-help.svg" alt="" /></button><button type="button" aria-label="Settings"><img src="/assets/dashboard/dashboard-settings.svg" alt="" /></button></div>
    </aside>;
}

function DashboardHeader() {
    const router = useRouter();
    return <header className="fig-dashboard-header"><h1>Overview</h1><div className="fig-dashboard-header-actions">
        <label className="fig-dashboard-search"><img src="/assets/dashboard/dashboard-search.svg" alt="" /><input placeholder="Search..." aria-label="Search" /></label>
        <button type="button" className="fig-dashboard-new" onClick={() => router.push("/projects")}><Plus size={20} /><span>New</span><i /><ChevronDown size={20} /></button>
        <button type="button" className="fig-dashboard-bell" aria-label="Notifications"><img src="/assets/dashboard/dashboard-notifications.svg" alt="" /></button><div className="fig-dashboard-avatar">BO</div>
    </div></header>;
}

function Analytics({ overview, hasContent, money }: { overview: DashboardOverview; hasContent: boolean; money: Intl.NumberFormat | null }) {
    const estimated = overview.kpis.totalEstimatedValue;
    const canSeeMoney = overview.permissions.canViewFinancials && estimated !== null;
    return <section className={`fig-analytics ${hasContent ? "has-content" : ""}`}><div className="fig-card-heading"><div><h2>Analytics</h2><p>{hasContent ? `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(overview.scope.generatedAt))}` : "No data to display yet"}</p></div></div>
        {hasContent ? <><div className="fig-metrics"><Metric value={formatNumber(overview.kpis.totalProjects)} label="Total Project" trend="up" /><Metric value={formatNumber(overview.kpis.activeProjects)} label="Active Project" trend="down" /><Metric value={canSeeMoney ? money?.format(estimated) ?? "—" : "Private"} label="Total Est. Value" trend="down" /><Metric value={overview.kpis.grossMargin === null ? "—" : `${overview.kpis.grossMargin}%`} label="Gross Margin" trend="up" /></div><div className="fig-chart-control"><span>Week</span><strong>Month</strong><span>Quarter</span><div><b />Actual <i /> Estimated</div></div><AnalyticsChart /></> : <EmptyAnalytics />}
    </section>;
}

function Metric({ value, label, trend }: { value: string; label: string; trend: "up" | "down" }) {
    const isNoData = value === "—" || value === "0";
    return <div className="fig-metric">
        <strong>{value === "Private" && <img className="fig-private-icon" src="/assets/dashboard/dashboard-visibility-off.svg" alt="" />}{value}</strong>
        {!isNoData && <small className={trend}>▲ {trend === "up" ? "1.2%" : "3.2%"}</small>}
        <span>{label}</span>
    </div>;
}
function EmptyAnalytics() {
    return <div className="fig-empty-analytics">
        <div className="fig-chart-placeholder">
            <img src="/assets/dashboard/empty-analytics.png" alt="No analytics data" style={{ maxWidth: '280px', marginBottom: '16px' }} />
            <strong style={{ display: 'block', fontSize: '18px', color: '#1f2d3d', marginBottom: '8px' }}>No analytics data yet</strong>
            <p style={{ color: '#6b7280', fontSize: '14px', maxWidth: '300px', margin: '0 auto', lineHeight: '1.5' }}>Once you create projects, your analytics and insights will appear here.</p>
        </div>
        <em>No data to display yet</em>
        <div className="fig-chart-control"><span>Week</span><strong>Month</strong><span>Quarter</span></div>
    </div>;
}

function AnalyticsChart() { return <div className="fig-chart"><div className="fig-chart-grid"><span>₹ 100L</span><span>₹ 75L</span><span>₹ 50L</span><span>₹ 25L</span><span>₹ 0</span></div><svg viewBox="0 0 940 220" preserveAspectRatio="none" aria-label="Monthly estimated and actual values"><defs><linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#2563eb" stopOpacity=".28" /><stop offset="1" stopColor="#2563eb" stopOpacity=".02" /></linearGradient></defs><path className="fig-estimated-line" d="M0 148 C120 105 220 69 360 70 C480 72 535 171 665 132 C775 100 850 72 940 35" /><path className="fig-actual-fill" d="M0 148 C140 120 260 98 390 100 C510 102 530 150 650 135 C760 120 850 82 940 55 L940 220 L0 220Z" /><path className="fig-actual-line" d="M0 148 C140 120 260 98 390 100 C510 102 530 150 650 135 C760 120 850 82 940 55" /></svg><div className="fig-chart-months"><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div></div>; }

function ProjectsCard({ overview, hasContent }: { overview: DashboardOverview; hasContent: boolean }) { return <section className="fig-projects-card"><h2>Projects &amp; BOQ</h2>{hasContent ? <><div className="fig-project-legend"><span>○ In Progress <b>{formatNumber(overview.kpis.activeProjects)}</b></span><span>○ Planning <b>0</b></span><span>○ On Hold <b>0</b></span><span className="complete">● Completed <b>{Math.max(0, overview.kpis.totalProjects - overview.kpis.activeProjects)}</b></span></div><div className="fig-project-graph"><div className="fig-value-label"><span>Total BOQ Value</span><strong>₹{formatNumber(overview.kpis.totalEstimatedValue ?? 0)}</strong></div><div className="fig-project-bars">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}<b /></div></div></> : <EmptyCard icon="dashboard-projects" title="No projects or BOQ yet" detail="Create your first project or BOQ to see the overview here." />}</section>; }
function BoqCard({ items, hasContent, money }: { items: DashboardItem[]; hasContent: boolean; money: Intl.NumberFormat | null }) { const item = items[0]; return <section className="fig-boq-card"><div className="fig-small-card-header"><h2>BOQ</h2>{hasContent && <div><button><ChevronLeft size={16} /></button><button><ChevronRight size={16} /></button></div>}</div>{hasContent && item ? <div className="fig-boq-item"><em>{item.status?.toUpperCase() === "OVERDUE" ? "OVERDUE" : "ACTIVE"}</em><strong>{item.name}</strong><span>{item.subtitle ?? "Project BOQ"}</span><b>{item.value !== undefined ? money?.format(item.value) : "—"}</b></div> : <EmptyCard icon="dashboard-boqs" title="No BOQ available" detail="You haven't created any BOQs yet." compact />}</section>; }
function EmptyCard({ icon, title, detail, compact = false }: { icon: string; title: string; detail: string; compact?: boolean }) { return <div className={`fig-empty-card ${compact ? "compact" : ""}`}><span><img src={`/assets/dashboard/${icon}.svg`} alt="" /></span><strong>{title}</strong><p>{detail}</p></div>; }
function QuickActions() {
    const router = useRouter();
    const actions = [
        { Icon: FilePlus2, label: "Create BOQ", path: "/boqs" },
        { Icon: FileSpreadsheet, label: "Import Excel", path: "/projects" },
        { Icon: UserPlus, label: "Invite Team", path: "/workspace" },
        { Icon: FilePlus2, label: "Generate Rep.", path: "/analytics" }
    ];
    return <section className="fig-quick-actions">
        <h2>Quick Actions</h2>
        <div>
            {actions.map(({ Icon, label, path }) => (
                <button type="button" key={label} onClick={() => router.push(path)}>
                    <Icon size={20} /><span>{label}</span>
                </button>
            ))}
        </div>
    </section>;
}
function DashboardLoading() { return <div className="fig-dashboard-layout fig-dashboard-loading"><div className="fig-dashboard-left"><div /><div /><div /></div><div /></div>; }
