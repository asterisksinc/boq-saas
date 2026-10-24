"use client";

import { useEffect, useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { integrationsApi, IntegrationAnalytics as ApiAnalytics } from '@/lib/api/integrations';

interface Props {
    integrationId: string;
}

const CAMPAIGN_COLORS: Record<string, string> = {
    'Search Campaign': '#2563EB',
    'Display Campaign': '#24A967',
    'YouTube Campaign': '#8C5DE9',
    'Other Campaigns': '#FD9536',
    'google_ads': '#2563EB',
    'custom_website': '#24A967',
    'meta_lead_ads': '#8C5DE9',
};

const COLOR_PALETTE = ['#2563EB', '#24A967', '#8C5DE9', '#FD9536', '#3B82F6', '#10B981'];

function formatDateLabel(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

export default function IntegrationAnalytics({ integrationId }: Props) {
    const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
    const [period, setPeriod] = useState<string>('7d');
    const [loading, setLoading] = useState(true);
    const [hoveredPoint, setHoveredPoint] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const res = await integrationsApi.analytics(integrationId, period);
                if (mounted && res) {
                    setAnalytics(res);
                }
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [integrationId, period]);

    // Format data points for the period
    const chartData = useMemo(() => {
        if (!analytics || !analytics.leadsOverTime || analytics.leadsOverTime.length === 0) {
            // Generate empty slots for selected period to render exact grid
            const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
            const points = [];
            const now = new Date();
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                points.push({
                    date: d.toISOString().split('T')[0],
                    count: 0
                });
            }
            return points;
        }
        return analytics.leadsOverTime;
    }, [analytics, period]);

    // Donut chart sources
    const sources = useMemo(() => {
        if (!analytics || !analytics.leadSourceBreakdown) return [];
        return analytics.leadSourceBreakdown;
    }, [analytics]);

    const totalLeads = analytics?.totalLeads || 0;

    /* ---------- Line Chart Sizing & Scaling ---------- */
    const svgWidth = 800;
    const svgHeight = 200;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;

    const dataMax = Math.max(...chartData.map(d => d.count), 0);
    // Base scale on 80 like in Figma, or higher multiple if data exceeds 80
    const maxY = dataMax <= 80 ? 80 : Math.ceil(dataMax / 20) * 20;

    const gridSteps = [maxY, Math.round(maxY * 0.75), Math.round(maxY * 0.5), Math.round(maxY * 0.25), 0];

    const getX = (index: number) => {
        if (chartData.length <= 1) return paddingLeft + plotWidth / 2;
        return paddingLeft + (index / (chartData.length - 1)) * plotWidth;
    };

    const getY = (value: number) => {
        return paddingTop + plotHeight - (value / maxY) * plotHeight;
    };

    // Construct curve path
    let linePath = "";
    if (chartData.length > 0) {
        linePath = `M ${getX(0)} ${getY(chartData[0].count)}`;
        for (let i = 1; i < chartData.length; i++) {
            const prevX = getX(i - 1);
            const prevY = getY(chartData[i - 1].count);
            const currX = getX(i);
            const currY = getY(chartData[i].count);
            const cpx1 = prevX + (currX - prevX) * 0.45;
            const cpx2 = currX - (currX - prevX) * 0.45;
            linePath += ` C ${cpx1} ${prevY}, ${cpx2} ${currY}, ${currX} ${currY}`;
        }
    }

    const areaPath = chartData.length > 0
        ? `${linePath} L ${getX(chartData.length - 1)} ${paddingTop + plotHeight} L ${getX(0)} ${paddingTop + plotHeight} Z`
        : "";

    /* ---------- Donut Chart Geometry ---------- */
    const donutRadius = 66;
    const donutStroke = 22;
    const circumference = 2 * Math.PI * donutRadius;
    const donutCenter = 80;

    let accumulatedOffset = 0;
    const donutSlices = sources.map((item, index) => {
        const sliceShare = totalLeads > 0 ? item.count / totalLeads : 0;
        const strokeLength = sliceShare * circumference;
        const color = CAMPAIGN_COLORS[item.source] || COLOR_PALETTE[index % COLOR_PALETTE.length];
        const offset = accumulatedOffset;
        accumulatedOffset += strokeLength;

        return {
            ...item,
            color,
            percentage: totalLeads > 0 ? Math.round(sliceShare * 100) : 0,
            strokeDasharray: `${strokeLength} ${circumference - strokeLength}`,
            strokeDashoffset: -offset,
        };
    });

    if (loading && !analytics) {
        return (
            <div className="intg-analytics-row">
                <div className="intg-chart-card intg-leads-card intg-kpi-skeleton" style={{ height: '335px' }} />
                <div className="intg-chart-card intg-donut-card intg-kpi-skeleton" style={{ height: '335px' }} />
            </div>
        );
    }

    return (
        <div className="intg-analytics-row">
            {/* Card 1: Leads Over Time (Figma Frame 93) */}
            <div className="intg-chart-card intg-leads-card">
                <div className="intg-chart-header">
                    <h3 className="intg-chart-title">Leads Over Time</h3>
                    <div className="intg-select-wrapper">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="intg-period-select"
                            aria-label="Reporting Period"
                        >
                            <option value="7d">This Week</option>
                            <option value="30d">This Month</option>
                            <option value="90d">This Quarter</option>
                        </select>
                        <ChevronDown size={14} className="intg-select-arrow" />
                    </div>
                </div>

                <div className="intg-chart-plot-wrap">
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="intg-svg-chart" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="leadAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="14.35%" stopColor="#2563EB" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Dashed Gridlines & Y-Axis Labels */}
                        {gridSteps.map((val, idx) => {
                            const y = getY(val);
                            return (
                                <g key={`grid-${idx}`}>
                                    <line
                                        x1={paddingLeft}
                                        y1={y}
                                        x2={svgWidth - paddingRight}
                                        y2={y}
                                        stroke="#64748B"
                                        strokeWidth="1"
                                        strokeDasharray="4 4"
                                        strokeOpacity="0.2"
                                    />
                                    <text
                                        x={paddingLeft - 10}
                                        y={y + 4}
                                        textAnchor="end"
                                        fontSize="12"
                                        fontFamily="Urbanist, sans-serif"
                                        fontWeight="500"
                                        fill="#64748B"
                                    >
                                        {val}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Chart Area Fill */}
                        {areaPath && (
                            <path d={areaPath} fill="url(#leadAreaGradient)" />
                        )}

                        {/* Chart Line */}
                        {linePath && (
                            <path
                                d={linePath}
                                fill="none"
                                stroke="#2563EB"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        )}

                        {/* Data Points (Figma Ellipse 44-51: 8x8px white circle with 2px blue stroke) */}
                        {chartData.map((d, i) => {
                            const cx = getX(i);
                            const cy = getY(d.count);
                            return (
                                <g key={`pt-${i}`}>
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r="4"
                                        fill="#FFFFFF"
                                        stroke="#2563EB"
                                        strokeWidth="2"
                                        className="intg-chart-dot"
                                        onMouseEnter={() => setHoveredPoint({ date: d.date, count: d.count, x: cx, y: cy })}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* Hover Tooltip */}
                    {hoveredPoint && (
                        <div
                            className="intg-chart-tooltip"
                            style={{
                                left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                                top: `${(hoveredPoint.y / svgHeight) * 100}%`
                            }}
                        >
                            <span className="intg-tooltip-count">{hoveredPoint.count} leads</span>
                            <span className="intg-tooltip-date">{formatDateLabel(hoveredPoint.date)}</span>
                        </div>
                    )}

                    {/* X-Axis Date Labels (Frame 2147224993) */}
                    <div className="intg-x-axis-labels">
                        {chartData.map((d, i) => {
                            // On small screens or lots of points, space labels cleanly
                            const shouldShow = chartData.length <= 8 || i % Math.ceil(chartData.length / 7) === 0 || i === chartData.length - 1;
                            if (!shouldShow) return null;
                            const leftPercent = (getX(i) / svgWidth) * 100;
                            return (
                                <span
                                    key={`label-${i}`}
                                    className="intg-x-label"
                                    style={{ left: `${leftPercent}%` }}
                                >
                                    {formatDateLabel(d.date)}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Card 2: Lead Source Breakdown (Figma Frame 2147225000) */}
            <div className="intg-chart-card intg-donut-card">
                <div className="intg-chart-header">
                    <h3 className="intg-chart-title">Lead Source Breakdown</h3>
                </div>

                <div className="intg-donut-body">
                    {/* Donut SVG (Frame 98: 160x160px) */}
                    <div className="intg-donut-svg-wrap">
                        <svg viewBox="0 0 160 160" className="intg-donut-svg">
                            {/* Empty background ring */}
                            <circle
                                cx={donutCenter}
                                cy={donutCenter}
                                r={donutRadius}
                                fill="none"
                                stroke="#F1F5F9"
                                strokeWidth={donutStroke}
                            />

                            {/* Slices */}
                            {donutSlices.map((slice, idx) => (
                                <circle
                                    key={`slice-${idx}`}
                                    cx={donutCenter}
                                    cy={donutCenter}
                                    r={donutRadius}
                                    fill="none"
                                    stroke={slice.color}
                                    strokeWidth={donutStroke}
                                    strokeDasharray={slice.strokeDasharray}
                                    strokeDashoffset={slice.strokeDashoffset}
                                    transform={`rotate(-90 ${donutCenter} ${donutCenter})`}
                                />
                            ))}
                        </svg>

                        {/* Center Metric (Frame 2147225436) */}
                        <div className="intg-donut-center">
                            <span className="intg-donut-total">{totalLeads}</span>
                            <span className="intg-donut-total-label">Total Leads</span>
                        </div>
                    </div>

                    {/* Legend (Frame 92: width 200px) */}
                    <div className="intg-donut-legend">
                        {donutSlices.length === 0 ? (
                            <div className="intg-legend-empty">No campaign leads recorded yet</div>
                        ) : (
                            donutSlices.map((item, idx) => (
                                <div key={`leg-${idx}`} className="intg-legend-row">
                                    <span
                                        className="intg-legend-color-box"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="intg-legend-name">{item.source}</span>
                                    <span className="intg-legend-stat">
                                        {item.count} ({item.percentage}%)
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
