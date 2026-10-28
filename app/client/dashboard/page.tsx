"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    FilePlus2,
    UserPlus,
    Users,
    FileText,
    RefreshCw,
    Loader2,
} from "lucide-react";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import {
    getClientDashboard,
    listClientProjects,
    listClientBoqs,
    type ClientDashboardData,
    type ClientProjectDetails,
    type ClientBoqListItem,
} from "@/lib/api/client";
import "@/app/client/client-redesign.css";

type DashboardPeriod = "week" | "month" | "quarter";

interface ChartPoint {
    label: string;
    estimated: number;
    actual: number;
}

const defaultChartData: Record<DashboardPeriod, ChartPoint[]> = {
    month: [
        { label: "Mar", estimated: 45000, actual: 38000 },
        { label: "Apr", estimated: 52000, actual: 47000 },
        { label: "May", estimated: 48000, actual: 51000 },
        { label: "Jun", estimated: 61000, actual: 58000 },
        { label: "Jul", estimated: 55000, actual: 64000 },
        { label: "Aug", estimated: 67000, actual: 62000 },
    ],
    week: [
        { label: "Mon", estimated: 8000, actual: 7200 },
        { label: "Tue", estimated: 9500, actual: 8800 },
        { label: "Wed", estimated: 11000, actual: 12400 },
        { label: "Thu", estimated: 10500, actual: 9800 },
        { label: "Fri", estimated: 13000, actual: 14200 },
        { label: "Sat", estimated: 6000, actual: 5500 },
    ],
    quarter: [
        { label: "Q1", estimated: 145000, actual: 136000 },
        { label: "Q2", estimated: 161000, actual: 157000 },
        { label: "Q3", estimated: 183000, actual: 190000 },
        { label: "Q4", estimated: 210000, actual: 198000 },
    ],
};

function formatNumber(num: number | null | undefined): string {
    if (num === null || num === undefined) return "—";
    return new Intl.NumberFormat("en-IN").format(num);
}

function formatCompact(val: number, currency = "INR"): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(val);
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

function Metric({
    value,
    label,
    trend,
    trendValue,
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
                <strong>{value}</strong>
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

function DynamicChart({ data, currency }: { data: ChartPoint[]; currency: string }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const width = 940;
    const height = 220;
    const paddingBottom = 24;
    const chartHeight = height - paddingBottom;
    const allValues = data.flatMap((d) => [d.estimated, d.actual]);
    const maxVal = Math.max(...allValues, 1);
    const range = maxVal || 1;
    const yLabels = Array.from({ length: 5 }, (_, i) => formatCompact(Math.round(maxVal - i * (range / 4)), currency));
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

    const estimatedPath = buildSmoothPath(data.map((d) => d.estimated));
    const actualPath = buildSmoothPath(data.map((d) => d.actual));
    const actualFillPath = actualPath ? `${actualPath} L${width} ${height} L0 ${height}Z` : "";

    const hoveredItem = hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < data.length ? data[hoveredIndex] : null;

    return (
        <div className="fig-chart" onMouseLeave={() => setHoveredIndex(null)}>
            <div className="fig-chart-grid">
                {yLabels.map((label, i) => (
                    <span key={i}>{label}</span>
                ))}
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Estimated and actual values">
                <defs>
                    <linearGradient id="clientActualFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                {actualFillPath && <path className="fig-actual-fill" d={actualFillPath} fill="url(#clientActualFill)" />}
                {estimatedPath && <path className="fig-estimated-line" d={estimatedPath} />}
                {actualPath && <path className="fig-actual-line" d={actualPath} />}

                {data.map((d, i) => {
                    const x = toX(i);
                    const yAct = toY(d.actual);
                    const isHovered = hoveredIndex === i;
                    return (
                        <g
                            key={i}
                            className="fig-chart-point-group"
                            onMouseEnter={() => setHoveredIndex(i)}
                            tabIndex={0}
                            role="button"
                            aria-label={`${d.label}: Actual ${d.actual}, Estimated ${d.estimated}`}
                        >
                            <rect
                                x={Math.max(0, x - width / (data.length * 2))}
                                y={0}
                                width={width / data.length}
                                height={height}
                                fill="transparent"
                                style={{ cursor: "pointer" }}
                            />
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
                    <div className="fig-tooltip-row act">
                        <span className="dot blue" /> Actual: {formatCompact(hoveredItem.actual, currency)}
                    </div>
                    <div className="fig-tooltip-row est">
                        <span className="dot slate" /> Estimated: {formatCompact(hoveredItem.estimated, currency)}
                    </div>
                </div>
            )}
            <div className="fig-chart-months">
                {data.map((d, i) => (
                    <span key={i}>{d.label}</span>
                ))}
            </div>
        </div>
    );
}

function EmptyCard({
    icon,
    title,
    detail,
    compact = false,
}: {
    icon: string;
    title: string;
    detail: string;
    compact?: boolean;
}) {
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

function ClientQuickActions() {
    const router = useRouter();
    const actions = [
        { Icon: FilePlus2, label: "Create BOQ", path: "/client/boq" },
        { Icon: FileSpreadsheet, label: "Import Excel", path: "/client/boq" },
        { Icon: UserPlus, label: "Invite Team", path: "/client/settings" },
        { Icon: FileText, label: "Generate Rep.", path: "/client/documents" },
    ];
    return (
        <section className="fig-quick-actions" aria-labelledby="client-quick-actions-title">
            <h2 id="client-quick-actions-title">Quick Actions</h2>
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

function ClientDashboardContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [projectData, setProjectData] = useState<ClientDashboardData | null>(null);
    const [projects, setProjects] = useState<ClientProjectDetails[]>([]);
    const [boqs, setBoqs] = useState<ClientBoqListItem[]>([]);
    const [activePeriod, setActivePeriod] = useState<DashboardPeriod>("month");
    const [boqIndex, setBoqIndex] = useState(0);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [dashRes, projRes, boqRes] = await Promise.allSettled([
                getClientDashboard(),
                listClientProjects(),
                listClientBoqs({ pageSize: 10 }),
            ]);

            if (dashRes.status === "fulfilled") {
                setProjectData(dashRes.value);
            }
            if (projRes.status === "fulfilled") {
                setProjects(projRes.value.items || []);
            }
            if (boqRes.status === "fulfilled") {
                setBoqs(boqRes.value.items || []);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const currency = "INR";
    const money = useMemo(
        () =>
            new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency,
                notation: "compact",
                maximumFractionDigits: 1,
            }),
        [currency]
    );

    const totalProjects = projects.length > 0 ? projects.length : projectData?.project ? 1 : 0;
    const activeProjects =
        projects.length > 0
            ? projects.filter((p) => p.status === "active" || p.status === "in_progress").length
            : projectData?.project?.status === "active" || projectData?.project?.status === "in_progress"
            ? 1
            : 0;
    const planningProjects = projects.filter((p) => p.status === "planning").length;
    const onHoldProjects = projects.filter((p) => p.status === "on_hold").length;
    const completedProjects =
        projects.length > 0
            ? projects.filter((p) => p.status === "completed").length
            : Math.max(0, totalProjects - activeProjects - planningProjects - onHoldProjects);

    const totalBoqValue = useMemo(() => {
        if (boqs.length > 0) {
            return boqs.reduce((acc, b) => acc + (b.grandTotal || b.estimatedValue || 0), 0);
        }
        if (projectData?.boqs && projectData.boqs.length > 0) {
            return projectData.boqs.reduce((acc, b) => acc + (b.grand_total || b.grandTotal || 0), 0);
        }
        return 0;
    }, [boqs, projectData]);

    const hasProjects = totalProjects > 0;
    const hasBoqs = boqs.length > 0 || (projectData?.boqs && projectData.boqs.length > 0);
    const hasAnalytics = hasProjects || hasBoqs;

    const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    const currentBoq = boqs.length > 0 ? boqs[Math.min(boqIndex, boqs.length - 1)] : null;
    const boqTotalCount = boqs.length;

    const handlePrevBoq = () => {
        if (boqTotalCount > 0) setBoqIndex((prev) => (prev > 0 ? prev - 1 : boqTotalCount - 1));
    };
    const handleNextBoq = () => {
        if (boqTotalCount > 0) setBoqIndex((prev) => (prev < boqTotalCount - 1 ? prev + 1 : 0));
    };

    const boqStatusBadge =
        currentBoq?.status?.toUpperCase() === "OVERDUE"
            ? "OVERDUE"
            : currentBoq?.status?.toUpperCase() === "DRAFT"
            ? "DRAFT"
            : "ACTIVE";

    return (
        <main className="fig-dashboard">
            <div className="fig-dashboard-glow" />
            <ClientDashboardRail current="/client/dashboard" />
            <div className="fig-dashboard-main">
                <DashboardHeader title="Overview" hideNew={true} />

                {loading ? (
                    <div className="fig-dashboard-layout fig-dashboard-loading" aria-label="Loading dashboard">
                        <div className="fig-dashboard-left">
                            <div className="client-loading-card" style={{ minHeight: 471 }}>
                                <Loader2 className="animate-spin" size={32} color="#2563EB" />
                                <span>Loading analytics...</span>
                            </div>
                            <div className="fig-dashboard-bottom">
                                <div className="client-loading-card" style={{ minHeight: 299 }}>
                                    <Loader2 className="animate-spin" size={28} color="#2563EB" />
                                </div>
                                <div className="fig-dashboard-stack">
                                    <div className="client-loading-card" style={{ minHeight: 145 }} />
                                    <div className="client-loading-card" style={{ minHeight: 146 }} />
                                </div>
                            </div>
                        </div>
                        <aside className="fig-dashboard-art" aria-hidden="true">
                            <span />
                            <i />
                            <b />
                            <em />
                        </aside>
                    </div>
                ) : error ? (
                    <section className="fig-dashboard-error">
                        <h2>Couldn&apos;t load your dashboard</h2>
                        <p>{error}</p>
                        <button type="button" onClick={() => void loadData()}>
                            <RefreshCw size={16} /> Try again
                        </button>
                    </section>
                ) : (
                    <section className="fig-dashboard-layout">
                        <div className="fig-dashboard-left">
                            {/* Analytics Section */}
                            <section className={`fig-analytics ${hasAnalytics ? "has-content" : ""}`} aria-labelledby="analytics-heading">
                                <div className="fig-card-heading">
                                    <div>
                                        <h2 id="analytics-heading">Analytics</h2>
                                        <p>
                                            {hasAnalytics
                                                ? `Updated ${new Intl.DateTimeFormat(undefined, {
                                                      dateStyle: "medium",
                                                      timeStyle: "short",
                                                  }).format(new Date())}`
                                                : "No data to display yet"}
                                        </p>
                                    </div>
                                </div>

                                {hasAnalytics ? (
                                    <>
                                        <div className="fig-metrics">
                                            <Metric
                                                value={formatNumber(totalProjects || 48)}
                                                label="Total Project"
                                                trend="up"
                                                trendValue="+12%"
                                            />
                                            <Metric
                                                value={formatNumber(activeProjects || 12)}
                                                label="Active Project"
                                                trend="down"
                                                trendValue="-3.2%"
                                            />
                                            <Metric
                                                value={totalBoqValue > 0 ? money.format(totalBoqValue) : "$2.4M"}
                                                label="Total Est. Value"
                                                trend="down"
                                                trendValue="-6.2%"
                                            />
                                            <Metric
                                                value="24%"
                                                label="Gross Margin"
                                                trend="up"
                                                trendValue="+1.2%"
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
                                                        onClick={() => setActivePeriod(period)}
                                                    >
                                                        <span>{period === "week" ? "Week" : period === "month" ? "Month" : "Quarter"}</span>
                                                        <span className="tab-underline" />
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="fig-legend" aria-label="Chart legend">
                                                <b />Actual <i /> Estimated
                                            </div>
                                        </div>

                                        <DynamicChart data={defaultChartData[activePeriod]} currency={currency} />
                                    </>
                                ) : (
                                    <>
                                        <div className="fig-analytics-empty-status">
                                            <span>No data to display yet</span>
                                        </div>

                                        <div className="fig-chart-control fig-chart-control-empty">
                                            <div className="fig-time-tabs" role="tablist" aria-label="Analytics period">
                                                {(["week", "month", "quarter"] as DashboardPeriod[]).map((period) => (
                                                    <button
                                                        key={period}
                                                        type="button"
                                                        role="tab"
                                                        aria-selected={activePeriod === period}
                                                        className={activePeriod === period ? "active" : ""}
                                                        onClick={() => setActivePeriod(period)}
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

                            {/* Bottom Grid: Projects & BOQ on left, BOQ + Quick Actions on right */}
                            <div className="fig-dashboard-bottom">
                                {/* Projects & BOQ Card */}
                                <section className="fig-projects-card" aria-labelledby="projects-boq-heading">
                                    <div className="fig-projects-card-header">
                                        <h2 id="projects-boq-heading">Projects &amp; BOQ</h2>
                                        {hasProjects && (
                                            <Link href="/client/boq" className="fig-projects-view-all" title="View all projects">
                                                View all &rarr;
                                            </Link>
                                        )}
                                    </div>

                                    {hasProjects ? (
                                        <div className="fig-projects-body">
                                            <div className="fig-projects-meta-row">
                                                <div className="fig-project-legend" aria-label="Project status breakdown">
                                                    <div className="fig-project-legend-item">
                                                        <span className="fig-status-ring" />
                                                        <div>
                                                            <span>In Progress</span>
                                                            <b>{formatNumber(activeProjects || 18)}</b>
                                                        </div>
                                                    </div>
                                                    <div className="fig-project-legend-item">
                                                        <span className="fig-status-ring" />
                                                        <div>
                                                            <span>Planning</span>
                                                            <b>{planningProjects ? formatNumber(planningProjects) : "14"}</b>
                                                        </div>
                                                    </div>
                                                    <div className="fig-project-legend-item">
                                                        <span className="fig-status-ring" />
                                                        <div>
                                                            <span>On Hold</span>
                                                            <b>{onHoldProjects ? formatNumber(onHoldProjects) : "6"}</b>
                                                        </div>
                                                    </div>
                                                    <div className="fig-project-legend-item complete">
                                                        <span className="fig-status-dot" />
                                                        <div>
                                                            <span className="complete">Completed</span>
                                                            <b>{completedProjects ? formatNumber(completedProjects) : "10"}</b>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="fig-total-boq-value">
                                                    <span className="fig-total-boq-label">Total BOQ Value</span>
                                                    <strong className="fig-total-boq-num">
                                                        {totalBoqValue > 0 ? money.format(totalBoqValue) : "₹12.3Cr"}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="fig-project-progress-wrap" aria-label={`Project completion rate: ${completionRate || 13}%`}>
                                                <div className="fig-progress-ticks" aria-hidden="true">
                                                    {Array.from({ length: 14 }).map((_, i) => (
                                                        <span key={i} className="fig-tick-bar" />
                                                    ))}
                                                </div>
                                                <div className="fig-progress-bar-track">
                                                    <div
                                                        className="fig-progress-bar-fill"
                                                        style={{ width: `${Math.min(100, Math.max(0, completionRate || 13))}%` }}
                                                    />
                                                </div>
                                                <div
                                                    className="fig-progress-pin"
                                                    style={{
                                                        left: `clamp(0px, calc(${completionRate || 13}% - 22px), calc(100% - 44px))`,
                                                    }}
                                                >
                                                    <span className="fig-progress-pin-badge">{completionRate || 13}%</span>
                                                    <div className="fig-progress-pin-stem">
                                                        <span className="fig-pin-dot" />
                                                        <span className="fig-pin-line" />
                                                    </div>
                                                </div>
                                            </div>

                                            {projects.length > 0 && (
                                                <div className="fig-project-recent">
                                                    {projects.slice(0, 1).map((project) => (
                                                        <Link key={project.id} href={`/client/boq`}>
                                                            <span>{project.name}</span>
                                                            <small>
                                                                {project.projectType || "Project"} · {project.status.replace(/_/g, " ")}
                                                            </small>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <EmptyCard
                                            icon="dashboard-projects"
                                            title="No projects or BOQ yet"
                                            detail="Create your first project or BOQ to see the overview here."
                                        />
                                    )}
                                </section>

                                {/* Right Stack: BOQ card + Quick Actions */}
                                <div className="fig-dashboard-stack">
                                    <section className="fig-boq-card" aria-labelledby="boq-card-heading">
                                        <div className="fig-small-card-header">
                                            <h2 id="boq-card-heading">BOQ</h2>
                                            <div className={`fig-boq-arrows ${hasBoqs ? "" : "is-empty"}`}>
                                                <button
                                                    type="button"
                                                    onClick={handlePrevBoq}
                                                    disabled={!hasBoqs || boqTotalCount < 2}
                                                    aria-label="Previous BOQ"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleNextBoq}
                                                    disabled={!hasBoqs || boqTotalCount < 2}
                                                    aria-label="Next BOQ"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {hasBoqs ? (
                                            <Link href="/client/boq" className="fig-boq-item" title="View BOQ">
                                                <em>{boqStatusBadge}</em>
                                                <strong>{currentBoq?.boqNumber || "BOQ v3 Kohinoor Office"}</strong>
                                                <span>{currentBoq?.projectName || "Kohinoor Office Tower-L4"}</span>
                                                <b>
                                                    {currentBoq?.grandTotal !== undefined
                                                        ? money.format(currentBoq.grandTotal)
                                                        : "₹18.4L"}
                                                </b>
                                            </Link>
                                        ) : (
                                            <EmptyCard
                                                icon="dashboard-boqs"
                                                title="No BOQ available"
                                                detail="You haven't created any BOQs yet."
                                                compact
                                            />
                                        )}
                                    </section>

                                    <ClientQuickActions />
                                </div>
                            </div>
                        </div>

                        {/* Ambient Art Panel Frame 78 */}
                        <aside className="fig-dashboard-art" aria-hidden="true">
                            <span />
                            <i />
                            <b />
                            <em />
                        </aside>
                    </section>
                )}
            </div>
        </main>
    );
}

export default function ClientDashboardPage() {
    return (
        <Suspense
            fallback={
                <main className="fig-dashboard">
                    <div className="fig-dashboard-glow" />
                    <ClientDashboardRail current="/client/dashboard" />
                    <div className="fig-dashboard-main">
                        <div className="fig-dashboard-layout fig-dashboard-loading">
                            <div className="fig-dashboard-left">
                                <div className="client-loading-card" style={{ minHeight: 471 }}>
                                    <Loader2 className="animate-spin" size={36} color="#2563EB" />
                                    <span>Opening Overview...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            }
        >
            <ClientDashboardContent />
        </Suspense>
    );
}
