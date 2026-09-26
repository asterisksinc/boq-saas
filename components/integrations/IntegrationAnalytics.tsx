"use client";

import { useEffect, useState } from 'react';
import { integrationsApi, IntegrationAnalytics as ApiAnalytics } from '@/lib/api/integrations';

interface Props {
    integrationId: string;
}

export default function IntegrationAnalytics({ integrationId }: Props) {
    const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
    const [period, setPeriod] = useState('30d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await integrationsApi.analytics(integrationId, period);
                setAnalytics(res as ApiAnalytics);
            } catch {
                /* empty state is fine */
            } finally {
                setLoading(false);
            }
        })();
    }, [integrationId, period]);

    if (loading || !analytics) {
        return <div className="intg-analytics-container"><div className="intg-skeleton intg-skeleton-chart" /><div className="intg-skeleton intg-skeleton-chart" /></div>;
    }

    const { leadsOverTime, leadSourceBreakdown, totalLeads } = analytics;

    /* ---------- SVG Line Chart ---------- */
    const width = 800;
    const height = 250;
    const paddingBottom = 30;
    const paddingLeft = 40;
    const chartHeight = height - paddingBottom;
    const chartWidth = width - paddingLeft;
    const maxVal = Math.max(...leadsOverTime.map(d => d.count), 10);

    const toX = (i: number) => paddingLeft + (i / Math.max(leadsOverTime.length - 1, 1)) * chartWidth;
    const toY = (val: number) => chartHeight - (val / maxVal) * chartHeight;

    /* Grid lines */
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(frac => ({
        y: toY(frac * maxVal),
        label: Math.round(frac * maxVal).toString(),
    }));

    /* Bezier path */
    let pathD = "";
    if (leadsOverTime.length > 0) {
        pathD = `M${toX(0)} ${toY(leadsOverTime[0].count)}`;
        for (let i = 1; i < leadsOverTime.length; i++) {
            const prev = { x: toX(i - 1), y: toY(leadsOverTime[i - 1].count) };
            const curr = { x: toX(i), y: toY(leadsOverTime[i].count) };
            const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
            const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
            pathD += ` C${cpx1} ${prev.y} ${cpx2} ${curr.y} ${curr.x} ${curr.y}`;
        }
    }
    const fillPath = leadsOverTime.length > 0 ? pathD + ` L${toX(leadsOverTime.length - 1)} ${chartHeight} L${toX(0)} ${chartHeight}Z` : "";

    /* ---------- SVG Donut Chart ---------- */
    const cx = 100, cy = 100, r = 70, strokeW = 24;
    const total = totalLeads || 1;
    const colors = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    let cumulativeAngle = -90;

    return (
        <div className="intg-analytics-container">
            <div className="intg-chart-card">
                <div className="intg-chart-header">
                    <h3>Leads Over Time</h3>
                    <select value={period} onChange={e => setPeriod(e.target.value)} className="intg-chart-select">
                        <option value="7d">This Week</option>
                        <option value="30d">This Month</option>
                        <option value="90d">Last 90 Days</option>
                    </select>
                </div>
                <div className="intg-line-chart">
                    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                                <stop stopColor="#2563eb" stopOpacity=".15" />
                                <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        {gridLines.map((g, i) => (
                            <g key={i}>
                                <line x1={paddingLeft} y1={g.y} x2={width} y2={g.y} stroke="#e5e9f0" strokeWidth="1" />
                                <text x={paddingLeft - 8} y={g.y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{g.label}</text>
                            </g>
                        ))}
                        {leadsOverTime.length > 0 && (
                            <>
                                <path d={fillPath} fill="url(#lineFill)" />
                                <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                                {leadsOverTime.map((d, i) => (
                                    <circle key={i} cx={toX(i)} cy={toY(d.count)} r="3" fill="#fff" stroke="#2563eb" strokeWidth="2" />
                                ))}
                            </>
                        )}
                    </svg>
                    <div className="intg-chart-labels">
                        {leadsOverTime.filter((_, i) => i % Math.max(1, Math.floor(leadsOverTime.length / 7)) === 0 || i === leadsOverTime.length - 1).map((d, i, arr) => (
                            <span key={i} style={{left: `${(leadsOverTime.indexOf(d) / Math.max(leadsOverTime.length - 1, 1)) * 100}%`}}>
                                {d.date}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="intg-chart-card">
                <div className="intg-chart-header">
                    <h3>Lead Source Breakdown</h3>
                </div>
                <div className="intg-donut-container">
                    <div className="intg-donut-svg">
                        <svg viewBox="0 0 200 200">
                            {leadSourceBreakdown.length === 0 && (
                                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e9f0" strokeWidth={strokeW} />
                            )}
                            {leadSourceBreakdown.map((item, i) => {
                                const sliceAngle = (item.count / total) * 360;
                                const startAngle = cumulativeAngle;
                                cumulativeAngle += sliceAngle;

                                if (sliceAngle === 0) return null;
                                const circumference = 2 * Math.PI * r;
                                const dashLength = (sliceAngle / 360) * circumference;
                                const dashOffset = -(((startAngle + 90) / 360) * circumference);

                                return (
                                    <circle
                                        key={i}
                                        cx={cx} cy={cy} r={r}
                                        fill="none"
                                        stroke={colors[i % colors.length]}
                                        strokeWidth={strokeW}
                                        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                                        strokeDashoffset={dashOffset}
                                        strokeLinecap="butt"
                                    />
                                );
                            })}
                            <text x={cx} y={cy - 8} textAnchor="middle" fontSize="12" fill="#6b7280">Total Leads</text>
                            <text x={cx} y={cy + 20} textAnchor="middle" fontSize="28" fontWeight="bold" fill="#1f2d3d">{totalLeads}</text>
                        </svg>
                    </div>
                    <div className="intg-donut-legend">
                        {leadSourceBreakdown.map((item, i) => (
                            <div key={i} className="intg-legend-item">
                                <span className="intg-legend-color" style={{backgroundColor: colors[i % colors.length]}} />
                                <span className="intg-legend-label">{item.source}</span>
                                <span className="intg-legend-val">{item.count} ({totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0}%)</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
