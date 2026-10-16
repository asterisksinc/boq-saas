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
    const [periodLoading, setPeriodLoading] = useState(false);
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

    const handlePeriodChange = useCallback(async (period: DashboardPeriod) => {
        setActivePeriod(period);
        setPeriodLoading(true);
        try {
            const updated = await getDashboardOverview(period);
            setOverview(updated);
        } catch (err) {
            console.error("Failed to fetch analytics for period:", period, err);
        } finally {
            setPeriodLoading(false);
        }
    }, []);

    const hasProjects = overview ? recentProjects.length > 0 || overview.kpis.totalProjects > 0 : false;
    const hasBoqs = overview ? recentBoqs.length > 0 || overview.kpis.draftBoqs > 0 : false;
    // Analytics data exists only when there are projects, cost overview series, or non-zero financial data.
    // Draft BOQs alone do not constitute project analytics data.
    const hasAnalytics = overview ? Boolean(
        overview.kpis.totalProjects > 0 ||
        recentProjects.length > 0 ||
        (Array.isArray(overview.costOverview?.series) && overview.costOverview.series.length > 0) ||
        (overview.kpis.totalEstimatedValue !== null && overview.kpis.totalEstimatedValue > 0) ||
        (overview.kpis.actualCost !== null && overview.kpis.actualCost > 0)
    ) : false;
    const money = useMemo(() => overview ? new Intl.NumberFormat("en-IN", { style: "currency", currency: overview.scope.currency || "INR", notation: "compact", maximumFractionDigits: 1 }) : null, [overview]);

    return <main className="fig-dashboard">
        <div className="fig-dashboard-glow" />
        <DashboardRail />
        <div className="fig-dashboard-main">
            <DashboardHeader profile={overview?.profile} />
            {loading ? <DashboardLoading /> : error ? <section className="fig-dashboard-error"><h2>Couldn&apos;t load your dashboard</h2><p>{error}</p><button onClick={() => void load()}><RefreshCw size={16} /> Try again</button></section> : overview ? <section className="fig-dashboard-layout">
                <div className="fig-dashboard-left">
                    <Analytics overview={overview} hasContent={hasAnalytics} money={money} activePeriod={activePeriod} onPeriodChange={handlePeriodChange} />
                    <div className="fig-dashboard-bottom">
                        <ProjectsCard overview={overview} recentProjects={recentProjects} hasContent={hasProjects} money={money} />
                        <div className="fig-dashboard-stack"><BoqCard items={recentBoqs} hasContent={hasBoqs} money={money} boqIndex={boqIndex} onBoqIndexChange={setBoqIndex} /><QuickActions /></div>
                    </div>
                </div>
                <aside className="fig-dashboard-art" aria-hidden="true"><span /><i /><b /><em /></aside>
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

function AnalyticsEmptyIllustration() {
    return (
        <div className="fig-analytics-illustration" aria-hidden="true">
            <span className="fig-ambient-pill left" />
            <div className="fig-illustration-card">
                <div className="fig-illustration-badge">
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                        <path d="M2.5 12.5L6.5 8.5L9.5 11.5L14.5 4.5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10.5 4.5H14.5V8.5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <svg width="147" height="92" viewBox="0 0 146.36 92" fill="none" className="fig-illustration-svg">
                    <rect x="10.45" y="57.55" width="6.97" height="24.39" rx="1" fill="#2563EB" fillOpacity="0.1" />
                    <rect x="34.15" y="48.48" width="6.97" height="33.45" rx="1" fill="#2563EB" fillOpacity="0.1" />
                    <rect x="57.85" y="57.55" width="6.97" height="24.39" rx="1" fill="#2563EB" fillOpacity="0.1" />
                    <rect x="81.55" y="45.70" width="6.97" height="36.24" rx="1" fill="#2563EB" fillOpacity="0.1" />
                    <rect x="105.24" y="54.76" width="6.97" height="27.18" rx="1" fill="#2563EB" fillOpacity="0.1" />
                    <rect x="128.94" y="37.33" width="6.97" height="44.61" rx="1" fill="#2563EB" fillOpacity="0.1" />
                    <polyline
                        points="13.94,52.67 37.64,43.61 61.33,52.67 85.03,40.82 108.73,49.88 132.42,32.45"
                        stroke="#2563EB"
                        strokeWidth="0.7"
                        strokeOpacity="0.2"
                        fill="none"
                    />
                    <circle cx="13.94" cy="52.67" r="2.09" fill="#2563EB" />
                    <circle cx="37.64" cy="43.61" r="2.09" fill="#2563EB" />
                    <circle cx="61.33" cy="52.67" r="2.09" fill="#2563EB" />
                    <circle cx="85.03" cy="40.82" r="2.09" fill="#2563EB" />
                    <circle cx="108.73" cy="49.88" r="2.09" fill="#2563EB" />
                    <circle cx="132.42" cy="32.45" r="2.09" fill="#2563EB" />
                </svg>
            </div>
            <span className="fig-ambient-pill right" />
        </div>
    );
}

function Analytics({ overview, hasContent, money, activePeriod, onPeriodChange }: { overview: DashboardOverview; hasContent: boolean; money: Intl.NumberFormat | null; activePeriod: DashboardPeriod; onPeriodChange: (p: DashboardPeriod) => void }) {
    const estimated = overview.kpis.totalEstimatedValue;
    const canSeeMoney = overview.permissions.canViewFinancials && estimated !== null;
    const trends = overview.trends ?? computeTrends(overview.kpis);
    const backendSeries = overview.costOverview?.series;
    const chartData = (Array.isArray(backendSeries) && backendSeries.length > 0) ? backendSeries : null;

    return (
        <section className={`fig-analytics ${hasContent ? "has-content" : ""}`}>
            <div className="fig-card-heading">
                <div>
                    <h2>Analytics</h2>
                    <p>{hasContent ? `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(overview.scope.generatedAt))}` : "No data to display yet"}</p>
                </div>
            </div>

            {hasContent ? (
                <>
                    <div className="fig-metrics">
                        <Metric
                            value={formatNumber(overview.kpis.totalProjects)}
                            label="Total Project"
                            trend={trends.totalProjects.direction}
                            trendValue={trends.totalProjects.value ? `${trends.totalProjects.value}%` : null}
                        />
                        <Metric
                            value={formatNumber(overview.kpis.activeProjects)}
                            label="Active Project"
                            trend={trends.activeProjects.direction}
                            trendValue={trends.activeProjects.value ? `${trends.activeProjects.value}%` : null}
                        />
                        <Metric
                            value={canSeeMoney ? money?.format(estimated) ?? "—" : "Private"}
                            label="Total Est. Value"
                            trend={trends.estimatedValue.direction}
                            trendValue={trends.estimatedValue.value ? `${trends.estimatedValue.value}%` : null}
                        />
                        <Metric
                            value={overview.kpis.grossMargin === null ? "—" : `${overview.kpis.grossMargin}%`}
                            label="Gross Margin"
                            trend={trends.grossMargin.direction}
                            trendValue={trends.grossMargin.value ? `${trends.grossMargin.value}%` : null}
                        />
                    </div>
                    <div className="fig-chart-control">
                        <div className="fig-time-tabs" role="tablist" aria-label="Analytics period">
                            {(["week", "month", "quarter"] as DashboardPeriod[]).map((period) => (
                                <button
                                    key={period}
                                    type="button"
                                    role="tab"
                                    aria-selected={activePeriod === period}
                                    className={activePeriod === period ? "active" : ""}
                                    onClick={() => onPeriodChange(period)}
                                >
                                    <span>{period === "week" ? "Week" : period === "month" ? "Month" : "Quarter"}</span>
                                    <span className="tab-underline" />
                                </button>
                            ))}
                        </div>
                        {chartData ? (
                            <div className="fig-legend" aria-label="Chart legend">
                                <b />Actual <i /> Estimated
                            </div>
                        ) : (
                            <div className="fig-legend-hidden" aria-hidden="true">
                                <b />Actual <i /> Estimated
                            </div>
                        )}
                    </div>
                    {chartData ? <DynamicChart data={chartData} currency={overview.scope.currency} /> : <EmptyAnalytics />}
                </>
            ) : (
                <>
                    {/* Frame 2147224981: Centered empty metrics line */}
                    <div className="fig-analytics-empty-status">
                        <span>No data to display yet</span>
                    </div>

                    {/* Frame 2147224995: Range controls; fig-legend-hidden remains available for the approved empty-state styling. */}
                    <div className="fig-chart-control fig-chart-control-empty">
                        <div className="fig-time-tabs" role="tablist" aria-label="Analytics period">
                            {(["week", "month", "quarter"] as DashboardPeriod[]).map((period) => (
                                <button
                                    key={period}
                                    type="button"
                                    role="tab"
                                    aria-selected={activePeriod === period}
                                    className={activePeriod === period ? "active" : ""}
                                    onClick={() => onPeriodChange(period)}
                                >
                                    <span>{period === "week" ? "Week" : period === "month" ? "Month" : "Quarter"}</span>
                                    <span className="tab-underline" />
                                </button>
                            ))}
                        </div>
                        <div className="fig-legend-hidden" aria-hidden="true">
                            <b />Actual <i /> Estimated
                        </div>
                    </div>

                    {/* Frame 2147224994: Chart area with Figma illustration & text */}
                    <div className="fig-empty-analytics">
                        <AnalyticsEmptyIllustration />
                        <div className="fig-empty-text-wrap">
                            <strong>No analytics data yet</strong>
                            <p>Once you create projects, your analytics and insights will appear here.</p>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

function Metric({
    value,
    label,
    trend,
    trendValue
}: {
    value: string;
    label: string;
    trend?: "up" | "down" | "neutral";
    trendValue?: string | null;
}) {
    const isNoData = value === "—" || value === "0";
    const hasTrend = !isNoData && trend && trend !== "neutral" && Boolean(trendValue) && trendValue !== "0%";

    return (
        <div className="fig-metric">
            <div className="fig-metric-val-row">
                <strong>
                    {value === "Private" && (
                        <img className="fig-private-icon" src="/assets/dashboard/dashboard-visibility-off.svg" alt="" />
                    )}
                    {value}
                </strong>
                {hasTrend && (
                    <small className={`fig-metric-trend ${trend}`}>
                        {trend === "up" ? (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                <path d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5" stroke="#16A34A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                <path d="M7 3V11M7 11L3.5 7.5M7 11L10.5 7.5" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                        <span>{trendValue}</span>
                    </small>
                )}
            </div>
            <span>{label}</span>
        </div>
    );
}

function EmptyAnalytics() {
    return (
        <div className="fig-empty-analytics">
            <AnalyticsEmptyIllustration />
            <div className="fig-empty-text-wrap">
                <strong>No analytics data yet</strong>
                <p>Once you create projects, your analytics and insights will appear here.</p>
            </div>
        </div>
    );
}

function DynamicChart({ data, currency }: { data: Array<{ label: string; estimated: number; actual: number }>; currency: string }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const width = 940;
    const height = 220;
    const paddingBottom = 24;
    const chartHeight = height - paddingBottom;
    const allValues = data.flatMap(d => [d.estimated, d.actual]);
    const maxVal = Math.max(...allValues, 1);
    const range = maxVal || 1;
    const yLabels = Array.from({ length: 5 }, (_, i) => formatCompact(Math.round(maxVal - (i * (range / 4))), currency));
    const toX = (i: number) => (i / Math.max(data.length - 1, 1)) * width;
    const toY = (val: number) => Math.max(10, Math.min(chartHeight, chartHeight - (val / range) * (chartHeight - 20)));

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
    const actualFillPath = actualPath ? `${actualPath} L${width} ${height} L0 ${height}Z` : "";

    const hoveredItem = hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < data.length ? data[hoveredIndex] : null;

    return (
        <div className="fig-chart" onMouseLeave={() => setHoveredIndex(null)}>
            <div className="fig-chart-grid">
                {yLabels.map((label, i) => <span key={i}>{label}</span>)}
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Estimated and actual values">
                <defs>
                    <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                {actualFillPath && <path className="fig-actual-fill" d={actualFillPath} />}
                {estimatedPath && <path className="fig-estimated-line" d={estimatedPath} />}
                {actualPath && <path className="fig-actual-line" d={actualPath} />}

                {/* Interactive Points */}
                {data.map((d, i) => {
                    const x = toX(i);
                    const yAct = toY(d.actual);
                    const isHovered = hoveredIndex === i;
                    return (
                        <g key={i} className="fig-chart-point-group" onMouseEnter={() => setHoveredIndex(i)} tabIndex={0} role="button" aria-label={`${d.label}: Actual ${d.actual}, Estimated ${d.estimated}`}>
                            <rect x={Math.max(0, x - width / (data.length * 2))} y={0} width={width / data.length} height={height} fill="transparent" style={{ cursor: "pointer" }} />
                            {isHovered && (
                                <>
                                    <line x1={x} y1={0} x2={x} y2={chartHeight} stroke="#2563eb" strokeDasharray="3 3" opacity={0.5} />
                                    <circle cx={x} cy={yAct} r={5} fill="#ffffff" stroke="#2563eb" strokeWidth={2.5} />
                                    <circle cx={x} cy={toY(d.estimated)} r={4} fill="#ffffff" stroke="#64748b" strokeWidth={2} />
                                </>
                            )}
                        </g>
                    );
                })}
            </svg>
            {hoveredItem && hoveredIndex !== null && (
                <div
                    className="fig-chart-tooltip"
                    style={{
                        left: `${(toX(hoveredIndex) / width) * 100}%`,
                        top: `${toY(hoveredItem.actual) - 10}px`,
                    }}
                >
                    <strong>{hoveredItem.label}</strong>
                    <div className="fig-tooltip-row act"><span className="dot blue" /> Actual: {formatCompact(hoveredItem.actual, currency)}</div>
                    <div className="fig-tooltip-row est"><span className="dot slate" /> Estimated: {formatCompact(hoveredItem.estimated, currency)}</div>
                </div>
            )}
            <div className="fig-chart-months">
                {data.map((d, i) => <span key={i}>{d.label}</span>)}
            </div>
        </div>
    );
}

function ProjectsCard({ overview, recentProjects, hasContent, money }: { overview: DashboardOverview; recentProjects: DashboardItem[]; hasContent: boolean; money: Intl.NumberFormat | null }) {
    const total = overview.kpis.totalProjects;
    const active = overview.kpis.activeProjects;
    const planning = overview.projectStatusBreakdown?.planning ?? 0;
    const onHold = overview.projectStatusBreakdown?.onHold ?? 0;
    const completed = overview.projectStatusBreakdown?.completed ?? Math.max(0, total - active - planning - onHold);
    const totalBoqValue = overview.projectStatusBreakdown?.totalBoqValue ?? overview.kpis.totalEstimatedValue ?? 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <section className="fig-projects-card">
            <div className="fig-projects-card-header">
                <h2>Projects &amp; BOQ</h2>
                {hasContent && (
                    <a href="/projects" className="fig-projects-view-all" title="View all projects">
                        View all &rarr;
                    </a>
                )}
            </div>

            {hasContent ? (
                <div className="fig-projects-body">
                    {/* Frame 2147225005: Status Breakdown + Total BOQ Value */}
                    <div className="fig-projects-meta-row">
                        <div className="fig-project-legend" aria-label="Project status breakdown">
                            <div className="fig-project-legend-item">
                                <span className="fig-status-ring" />
                                <div>
                                    <span>In Progress</span>
                                    <b>{formatNumber(active)}</b>
                                </div>
                            </div>
                            <div className="fig-project-legend-item">
                                <span className="fig-status-ring" />
                                <div>
                                    <span>Planning</span>
                                    <b>{planning ? formatNumber(planning) : "—"}</b>
                                </div>
                            </div>
                            <div className="fig-project-legend-item">
                                <span className="fig-status-ring" />
                                <div>
                                    <span>On Hold</span>
                                    <b>{onHold ? formatNumber(onHold) : "—"}</b>
                                </div>
                            </div>
                            <div className="fig-project-legend-item complete">
                                <span className="fig-status-dot" />
                                <div>
                                    <span className="complete">Completed</span>
                                    <b>{formatNumber(completed)}</b>
                                </div>
                            </div>
                        </div>

                        <div className="fig-total-boq-value">
                            <span className="fig-total-boq-label">Total BOQ Value</span>
                            <strong className="fig-total-boq-num">
                                {overview.permissions.canViewFinancials ? (money?.format(totalBoqValue) ?? "—") : "Private"}
                            </strong>
                        </div>
                    </div>

                    {/* Frame 2147225007: Progress Visualization with Pin Marker */}
                    <div className="fig-project-progress-wrap" aria-label={`Project completion rate: ${completionRate}%`}>
                        <div className="fig-progress-ticks" aria-hidden="true">
                            {Array.from({ length: 14 }).map((_, i) => (
                                <span key={i} className="fig-tick-bar" />
                            ))}
                        </div>
                        <div className="fig-progress-bar-track">
                            <div className="fig-progress-bar-fill" style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }} />
                        </div>
                        <div
                            className="fig-progress-pin"
                            style={{ left: `clamp(0px, calc(${completionRate}% - 22px), calc(100% - 44px))` }}
                        >
                            <span className="fig-progress-pin-badge">{completionRate}%</span>
                            <div className="fig-progress-pin-stem">
                                <span className="fig-pin-dot" />
                                <span className="fig-pin-line" />
                            </div>
                        </div>
                    </div>

                    {/* Preserved fig-project-recent link */}
                    {recentProjects.length > 0 && (
                        <div className="fig-project-recent">
                            {recentProjects.slice(0, 1).map((project) => (
                                <a key={project.name} href={`/projects?search=${encodeURIComponent(project.name)}`}>
                                    <span>{project.name}</span>
                                    <small>{project.subtitle || "Project"}{project.status ? ` · ${project.status.replace(/_/g, " ")}` : ""}</small>
                                    {project.value !== undefined && overview.permissions.canViewFinancials ? <b>{money?.format(project.value)}</b> : null}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <EmptyCard icon="dashboard-projects" title="No projects or BOQ yet" detail="Create your first project or BOQ to see the overview here." />
            )}
        </section>
    );
}

function BoqCard({ items, hasContent, money, boqIndex, onBoqIndexChange }: { items: DashboardItem[]; hasContent: boolean; money: Intl.NumberFormat | null; boqIndex: number; onBoqIndexChange: (i: number) => void }) {
    const total = items.length;
    const safeIndex = total > 0 ? Math.min(boqIndex, total - 1) : 0;
    const item = total > 0 ? items[safeIndex] : null;
    const handlePrev = () => { if (total > 0) onBoqIndexChange(safeIndex > 0 ? safeIndex - 1 : total - 1); };
    const handleNext = () => { if (total > 0) onBoqIndexChange(safeIndex < total - 1 ? safeIndex + 1 : 0); };

    const statusBadge = item?.status?.toUpperCase() === "OVERDUE"
        ? "OVERDUE"
        : item?.status?.toUpperCase() === "DRAFT"
        ? "DRAFT"
        : "ACTIVE";

    return (
        <section className="fig-boq-card">
            <div className="fig-small-card-header">
                <h2>BOQ</h2>
                <div className={`fig-boq-arrows ${hasContent ? "" : "is-empty"}`}>
                    <button type="button" onClick={handlePrev} disabled={!hasContent || total < 2} aria-label="Previous BOQ">
                        <ChevronLeft size={16} />
                    </button>
                    <button type="button" onClick={handleNext} disabled={!hasContent || total < 2} aria-label="Next BOQ">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            {hasContent && item ? (
                <a href="/boqs" className="fig-boq-item" title="View BOQs">
                    <em>{statusBadge}</em>
                    <strong>{item.name}</strong>
                    <span>{item.subtitle ?? "Project BOQ"}</span>
                    <b>{item.value !== undefined ? money?.format(item.value) : "—"}</b>
                </a>
            ) : (
                <EmptyCard icon="dashboard-boqs" title="No BOQ available" detail="You haven't created any BOQs yet." compact />
            )}
        </section>
    );
}

function EmptyCard({ icon, title, detail, compact = false }: { icon: string; title: string; detail: string; compact?: boolean }) {
    return (
        <div className={`fig-empty-card ${compact ? "compact" : ""}`}>
            <span className="fig-empty-icon-wrap">
                <img src={`/assets/dashboard/${icon}.svg`} alt="" />
            </span>
            <strong>{title}</strong>
            <p>{detail}</p>
        </div>
    );
}

function QuickActions() {
    const router = useRouter();
    const actions = [
        { Icon: FilePlus2, label: "Create BOQ", path: "/boqs" },
        { Icon: FileSpreadsheet, label: "Import Excel", path: "/boqs" },
        { Icon: UserPlus, label: "Invite Team", path: "/settings?tab=security" },
        { Icon: FilePlus2, label: "Generate Rep.", path: "/analytics" }
    ];
    return (
        <section className="fig-quick-actions">
            <h2>Quick Actions</h2>
            <div>
                {actions.map(({ Icon, label, path }) => (
                    <button type="button" key={label} onClick={() => router.push(path)}>
                        <Icon size={20} color="#64748B" />
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}

function DashboardLoading() { return <div className="fig-dashboard-layout fig-dashboard-loading"><div className="fig-dashboard-left"><div /><div /><div /></div><div /></div>; }
