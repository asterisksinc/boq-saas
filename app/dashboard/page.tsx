"use client";

import { ChevronLeft, ChevronRight, FilePlus2, FileSpreadsheet, RefreshCw, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import { DashboardOverview, getApiErrorMessage, getDashboardOverview } from "@/lib/api/auth";

type DashboardPeriod = "week" | "month" | "quarter";
type DashboardItem = { name: string; subtitle?: string; value?: number; status?: string };

function formatNumber(value: number) { return new Intl.NumberFormat("en-IN").format(value); }

function formatCompact(value: number, currency = "INR"): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function asNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toDashboardItems(value: unknown, kind: "project" | "boq"): DashboardItem[] {
    if (!Array.isArray(value)) return [];
    return value.filter(isRecord).map((item) => ({
        name: String(kind === "project"
            ? item.name ?? item.projectCode ?? "Untitled"
            : item.boqNumber ?? item.boq_number ?? "Untitled"),
        subtitle: typeof (kind === "project" ? item.clientName ?? item.projectType : item.projectName ?? item.project_name) === "string"
            ? String(kind === "project" ? item.clientName ?? item.projectType : item.projectName ?? item.project_name)
            : undefined,
        value: asNumber(kind === "project"
            ? item.projectValue ?? item.approvedBudget
            : item.grandTotal ?? item.grand_total ?? item.estimatedValue),
        status: typeof item.status === "string" ? item.status : undefined,
    }));
}

export default function DashboardPage() {
    const router = useRouter();
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [recentProjects, setRecentProjects] = useState<DashboardItem[]>([]);
    const [recentBoqs, setRecentBoqs] = useState<DashboardItem[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [activePeriod, setActivePeriod] = useState<DashboardPeriod>("month");
    const [boqIndex, setBoqIndex] = useState(0);

    const load = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const [overviewData, projRes, boqRes] = await Promise.all([
                getDashboardOverview(),
                fetch("/api/v1/dashboard/recent-projects?pageSize=5", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
                fetch("/api/v1/dashboard/recent-boqs?pageSize=5", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
            ]);
            setOverview(overviewData);
            setRecentProjects(toDashboardItems(projRes?.data?.items ?? overviewData.recentProjects, "project"));
            setRecentBoqs(toDashboardItems(boqRes?.data?.items ?? overviewData.recentBoqs, "boq"));
        }
        catch (requestError) {
            const message = getApiErrorMessage(requestError);
            if (/authentication|required|unauthenticated/i.test(message)) router.replace("/login");
            else setError(message);
        } finally { setLoading(false); }
    }, [router]);

    useEffect(() => { void load(); }, [load]);

    const hasProjects = overview ? recentProjects.length > 0 || overview.kpis.totalProjects > 0 : false;
    const hasBoqs = overview ? recentBoqs.length > 0 || overview.kpis.draftBoqs > 0 : false;
    const hasAnalytics = overview ? hasProjects || hasBoqs || overview.kpis.totalEstimatedValue !== null || overview.kpis.actualCost !== null || overview.kpis.grossMargin !== null : false;
    const money = useMemo(() => overview ? new Intl.NumberFormat("en-IN", { style: "currency", currency: overview.scope.currency || "INR", notation: "compact", maximumFractionDigits: 1 }) : null, [overview]);

    return <main className="fig-dashboard">
        <div className="fig-dashboard-glow" />
        <DashboardRail />
        <div className="fig-dashboard-main">
            <DashboardHeader profile={overview?.profile} />
            {loading ? <DashboardLoading /> : error ? <section className="fig-dashboard-error"><h2>Couldn&apos;t load your dashboard</h2><p>{error}</p><button onClick={() => void load()}><RefreshCw size={16} /> Try again</button></section> : overview ? <section className="fig-dashboard-layout">
                <div className="fig-dashboard-left">
                    <Analytics overview={overview} hasContent={hasAnalytics} money={money} activePeriod={activePeriod} onPeriodChange={setActivePeriod} />
                    <div className="fig-dashboard-bottom">
                        <ProjectsCard overview={overview} recentProjects={recentProjects} hasContent={hasProjects} money={money} />
                        <div className="fig-dashboard-stack"><BoqCard items={recentBoqs} hasContent={hasBoqs} money={money} boqIndex={boqIndex} onBoqIndexChange={setBoqIndex} /><QuickActions /></div>
                    </div>
                </div>
                <aside className="fig-dashboard-art" aria-hidden="true"><span /><i /><b /></aside>
            </section> : null}
        </div>
    </main>;
}

function computeTrends(kpis: DashboardOverview["kpis"]) {
    const total = kpis.totalProjects;
    const active = kpis.activeProjects;
    const estimated = kpis.totalEstimatedValue;
    const actualCost = kpis.actualCost;
    const margin = kpis.grossMargin;
    const totalTrend = total > 0 ? Math.round((active / total) * 100) : 0;
    const activeTrend = total > 0 ? Math.round((active / total) * 100) : 0;
    const estTrend = estimated && actualCost ? Math.round(Math.abs(((estimated - actualCost) / estimated) * 100) * 10) / 10 : 0;
    const marginTrend = margin !== null ? Math.abs(margin) : 0;

    return {
        totalProjects: { value: totalTrend, direction: (active > 0 ? "up" : "neutral") as "up" | "down" | "neutral" },
        activeProjects: { value: activeTrend, direction: (active > 0 ? "down" : "neutral") as "up" | "down" | "neutral" },
        estimatedValue: { value: estTrend, direction: (estimated && actualCost && estimated > actualCost ? "down" : "up") as "up" | "down" | "neutral" },
        grossMargin: { value: marginTrend, direction: (margin !== null && margin > 0 ? "up" : "neutral") as "up" | "down" | "neutral" },
    };
}

function Analytics({ overview, hasContent, money, activePeriod, onPeriodChange }: { overview: DashboardOverview; hasContent: boolean; money: Intl.NumberFormat | null; activePeriod: DashboardPeriod; onPeriodChange: (p: DashboardPeriod) => void }) {
    const estimated = overview.kpis.totalEstimatedValue;
    const canSeeMoney = overview.permissions.canViewFinancials && estimated !== null;
    const trends = computeTrends(overview.kpis);
    const backendSeries = overview.costOverview?.series;
    const chartData = (Array.isArray(backendSeries) && backendSeries.length > 0) ? backendSeries : null;

    return <section className={`fig-analytics ${hasContent ? "has-content" : ""}`}><div className="fig-card-heading"><div><h2>Analytics</h2><p>{hasContent ? `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(overview.scope.generatedAt))}` : "No data to display yet"}</p></div></div>
        {hasContent ? <>
            <div className="fig-metrics">
                <Metric value={formatNumber(overview.kpis.totalProjects)} label="Total Project" trend={trends.totalProjects.direction} trendValue={`${trends.totalProjects.value}%`} />
                <Metric value={formatNumber(overview.kpis.activeProjects)} label="Active Project" trend={trends.activeProjects.direction} trendValue={`${trends.activeProjects.value}%`} />
                <Metric value={canSeeMoney ? money?.format(estimated) ?? "—" : "Private"} label="Total Est. Value" trend={trends.estimatedValue.direction} trendValue={`${trends.estimatedValue.value}%`} />
                <Metric value={overview.kpis.grossMargin === null ? "—" : `${overview.kpis.grossMargin}%`} label="Gross Margin" trend={trends.grossMargin.direction} trendValue={`${trends.grossMargin.value}%`} />
            </div>
            <div className="fig-chart-control">
                {(["week", "month", "quarter"] as DashboardPeriod[]).map((period) => (
                    <button key={period} type="button" className={activePeriod === period ? "active" : ""} onClick={() => onPeriodChange(period)}>
                        {period === "week" ? "Week" : period === "month" ? "Month" : "Quarter"}
                    </button>
                ))}
                <div><b />Actual <i /> Estimated</div>
            </div>
            {chartData ? <DynamicChart data={chartData} currency={overview.scope.currency} /> : <EmptyAnalytics />}
        </> : <EmptyAnalytics />}
    </section>;
}

function Metric({ value, label, trend, trendValue }: { value: string; label: string; trend: "up" | "down" | "neutral"; trendValue: string }) {
    const isNoData = value === "—" || value === "0";
    return <div className="fig-metric">
        <strong>{value === "Private" && <img className="fig-private-icon" src="/assets/dashboard/dashboard-visibility-off.svg" alt="" />}{value}</strong>
        {!isNoData && trend !== "neutral" && <small className={trend}>{trend === "up" ? "▲" : "▼"} {trendValue}</small>}
        <span>{label}</span>
    </div>;
}

function EmptyAnalytics() {
    return <div className="fig-empty-analytics">
        <div className="fig-chart-placeholder">
            <img src="/assets/dashboard/empty-analytics.png" alt="No analytics data" />
            <strong>No analytics data yet</strong>
            <p>Once you create projects, your analytics and insights will appear here.</p>
        </div>
    </div>;
}

function DynamicChart({ data, currency }: { data: Array<{ label: string; estimated: number; actual: number }>; currency: string }) {
    const width = 940;
    const height = 220;
    const paddingBottom = 24;
    const chartHeight = height - paddingBottom;
    const allValues = data.flatMap(d => [d.estimated, d.actual]);
    const maxVal = Math.max(...allValues);
    const range = maxVal || 1;
    const yLabels = Array.from({ length: 5 }, (_, i) => formatCompact(Math.round(maxVal - (i * (range / 4))), currency));
    const toX = (i: number) => (i / Math.max(data.length - 1, 1)) * width;
    const toY = (val: number) => chartHeight - (val / range) * chartHeight;

    function buildSmoothPath(values: number[]): string {
        if (values.length < 2) return "";
        const points = values.map((v, i) => ({ x: toX(i), y: toY(v) }));
        let d = `M${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
            const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
            d += ` C${cpx1} ${prev.y} ${cpx2} ${curr.y} ${curr.x} ${curr.y}`;
        }
        return d;
    }

    const estimatedPath = buildSmoothPath(data.map(d => d.estimated));
    const actualPath = buildSmoothPath(data.map(d => d.actual));
    const actualFillPath = actualPath + ` L${width} ${height} L0 ${height}Z`;

    return <div className="fig-chart">
        <div className="fig-chart-grid">{yLabels.map((label, i) => <span key={i}>{label}</span>)}</div>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Estimated and actual values">
            <defs><linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#2563eb" stopOpacity=".28" /><stop offset="1" stopColor="#2563eb" stopOpacity=".02" /></linearGradient></defs>
            <path className="fig-estimated-line" d={estimatedPath} />
            <path className="fig-actual-fill" d={actualFillPath} />
            <path className="fig-actual-line" d={actualPath} />
        </svg>
        <div className="fig-chart-months">{data.map((d, i) => <span key={i}>{d.label}</span>)}</div>
    </div>;
}

function ProjectsCard({ overview, recentProjects, hasContent, money }: { overview: DashboardOverview; recentProjects: DashboardItem[]; hasContent: boolean; money: Intl.NumberFormat | null }) {
    const total = overview.kpis.totalProjects;
    const active = overview.kpis.activeProjects;
    const planning = overview.projectStatusBreakdown?.planning ?? null;
    const onHold = overview.projectStatusBreakdown?.onHold ?? null;
    const completed = overview.projectStatusBreakdown?.completed ?? Math.max(0, total - active);

    return <section className="fig-projects-card"><h2>Projects &amp; BOQ</h2>{hasContent ? <>
        <div className="fig-project-legend">
            <span>○ In Progress <b>{formatNumber(active)}</b></span>
            <span>○ Planning <b>{planning ?? "—"}</b></span>
            <span>○ On Hold <b>{onHold ?? "—"}</b></span>
            <span className="complete">● Completed <b>{completed}</b></span>
        </div>
        {recentProjects.length > 0 ? <div className="fig-project-recent">
            {recentProjects.slice(0, 5).map((project) => <a key={project.name} href={`/projects?search=${encodeURIComponent(project.name)}`}>
                <span>{project.name}</span><small>{project.subtitle || "Project"}{project.status ? ` · ${project.status.replace(/_/g, " ")}` : ""}</small>
                {project.value !== undefined && overview.permissions.canViewFinancials ? <b>{money?.format(project.value)}</b> : null}
            </a>)}
        </div> : <EmptyCard icon="dashboard-projects" title="No recent projects" detail="Create a project to see it here." compact />}
    </> : <EmptyCard icon="dashboard-projects" title="No projects or BOQ yet" detail="Create your first project or BOQ to see the overview here." />}</section>;
}

function BoqCard({ items, hasContent, money, boqIndex, onBoqIndexChange }: { items: DashboardItem[]; hasContent: boolean; money: Intl.NumberFormat | null; boqIndex: number; onBoqIndexChange: (i: number) => void }) {
    const total = items.length;
    const safeIndex = total > 0 ? Math.min(boqIndex, total - 1) : 0;
    const item = total > 0 ? items[safeIndex] : null;
    const handlePrev = () => { if (total > 0) onBoqIndexChange(safeIndex > 0 ? safeIndex - 1 : total - 1); };
    const handleNext = () => { if (total > 0) onBoqIndexChange(safeIndex < total - 1 ? safeIndex + 1 : 0); };

    return <section className="fig-boq-card">
        <div className="fig-small-card-header"><h2>BOQ</h2>{hasContent && <div><button type="button" onClick={handlePrev} disabled={total < 2} aria-label="Previous BOQ"><ChevronLeft size={16} /></button><button type="button" onClick={handleNext} disabled={total < 2} aria-label="Next BOQ"><ChevronRight size={16} /></button></div>}</div>
        {hasContent && item ? <div className="fig-boq-item"><em>{item.status?.toUpperCase() === "OVERDUE" ? "OVERDUE" : "ACTIVE"}</em><strong>{item.name}</strong><span>{item.subtitle ?? "Project BOQ"}</span><b>{item.value !== undefined ? money?.format(item.value) : "—"}</b></div> : <EmptyCard icon="dashboard-boqs" title="No BOQ available" detail="You haven't created any BOQs yet." compact />}
    </section>;
}

function EmptyCard({ icon, title, detail, compact = false }: { icon: string; title: string; detail: string; compact?: boolean }) { return <div className={`fig-empty-card ${compact ? "compact" : ""}`}><span><img src={`/assets/dashboard/${icon}.svg`} alt="" /></span><strong>{title}</strong><p>{detail}</p></div>; }

function QuickActions() {
    const router = useRouter();
    const actions = [
        { Icon: FilePlus2, label: "Create BOQ", path: "/boqs" },
        { Icon: FileSpreadsheet, label: "Import Excel", path: "/boqs" },
        { Icon: UserPlus, label: "Invite Team", path: "/settings?tab=security" },
        { Icon: FilePlus2, label: "Generate Rep.", path: "/analytics" }
    ];
    return <section className="fig-quick-actions"><h2>Quick Actions</h2><div>{actions.map(({ Icon, label, path }) => <button type="button" key={label} onClick={() => router.push(path)}><Icon size={20} /><span>{label}</span></button>)}</div></section>;
}

function DashboardLoading() { return <div className="fig-dashboard-layout fig-dashboard-loading"><div className="fig-dashboard-left"><div /><div /><div /></div><div /></div>; }
