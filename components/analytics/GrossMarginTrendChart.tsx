"use client";

import { useState } from "react";

interface TrendDataPoint {
    period?: string;
    marginPercent?: number;
    margin?: number;
}

interface GrossMarginTrendChartProps {
    data: TrendDataPoint[];
}

export default function GrossMarginTrendChart({ data }: GrossMarginTrendChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!data || data.length === 0) {
        return (
            <div className="rep-card-outer">
                <div className="rep-card-header">
                    <h3 className="rep-card-title">Gross Margin Trend (%)</h3>
                </div>
                <div className="rep-inner-card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ color: "#64748B", fontSize: "14px" }}>No margin trend data available for this period.</div>
                </div>
            </div>
        );
    }

    const marginValues = data.map((d) => Number(d.marginPercent ?? d.margin ?? 0));
    const maxMargin = Math.max(...marginValues, 40);
    const minMargin = Math.max(0, Math.min(...marginValues, 20));

    // Y ticks: 4 levels matching Figma (e.g. 38%, 34%, 31%, 28%)
    const yStep = (maxMargin - minMargin) / 3 || 10;
    const yTicks = [
        maxMargin,
        maxMargin - yStep,
        maxMargin - yStep * 2,
        minMargin,
    ];

    const formatMonthName = (periodStr?: string) => {
        if (!periodStr) return "—";
        try {
            const parts = periodStr.split("-");
            if (parts.length >= 2) {
                const monthNum = parseInt(parts[1], 10);
                const date = new Date(2026, monthNum - 1, 1);
                return date.toLocaleString("en-US", { month: "short" });
            }
            return periodStr;
        } catch {
            return periodStr;
        }
    };

    // Calculate SVG coordinate points for the line
    const width = 500;
    const height = 140;
    const paddingLeft = 10;
    const paddingRight = 10;
    const usableWidth = width - paddingLeft - paddingRight;

    const points = data.map((d, i) => {
        const val = Number(d.marginPercent ?? d.margin ?? 0);
        const x = paddingLeft + (i / Math.max(1, data.length - 1)) * usableWidth;
        const normalizedY = (val - minMargin) / (maxMargin - minMargin || 1);
        const y = height - normalizedY * height;
        return { x, y, val, period: d.period };
    });

    const pathD = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ");

    const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

    return (
        <div className="rep-card-outer">
            <div className="rep-card-header">
                <h3 className="rep-card-title">Gross Margin Trend (%)</h3>
            </div>

            <div className="rep-inner-card">
                <div style={{ position: "relative", width: "100%", height: "220px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    {/* Y-axis dashed grid lines */}
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none" }}>
                        {yTicks.map((tick, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", height: "14px" }}>
                                <span style={{ width: "32px", fontSize: "12px", color: "#0F172A", textAlign: "right", flexShrink: 0, fontWeight: 500 }}>
                                    {Math.round(tick)}%
                                </span>
                                <div style={{ flex: 1, borderTop: "1px dashed #EBEBEB" }} />
                            </div>
                        ))}
                    </div>

                    {/* SVG Line & Dots */}
                    <div
                        style={{
                            position: "absolute",
                            left: "44px",
                            right: "12px",
                            top: "7px",
                            bottom: "24px",
                        }}
                    >
                        <svg
                            viewBox={`0 0 ${width} ${height}`}
                            preserveAspectRatio="none"
                            style={{ width: "100%", height: "100%", overflow: "visible" }}
                        >
                            {/* Line path */}
                            <path
                                d={pathD}
                                fill="none"
                                stroke="#2563EB"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {/* Points */}
                            {points.map((p, idx) => (
                                <g key={idx}>
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={hoveredIndex === idx ? 6 : 4}
                                        fill="#2563EB"
                                        stroke="#FFFFFF"
                                        strokeWidth={hoveredIndex === idx ? 2.5 : 2}
                                        style={{ cursor: "pointer", transition: "r 0.15s ease" }}
                                        onMouseEnter={() => setHoveredIndex(idx)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    />
                                    {/* Transparent larger hit area for easy hover */}
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={14}
                                        fill="transparent"
                                        style={{ cursor: "pointer" }}
                                        onMouseEnter={() => setHoveredIndex(idx)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    />
                                </g>
                            ))}
                        </svg>
                    </div>

                    {/* X-axis labels at bottom */}
                    <div
                        style={{
                            position: "absolute",
                            left: "44px",
                            right: "12px",
                            bottom: "0px",
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#64748B",
                        }}
                    >
                        {data.map((item, index) => (
                            <span
                                key={item.period || index}
                                style={{
                                    textAlign: "center",
                                    color: hoveredIndex === index ? "#0F172A" : "#64748B",
                                    fontWeight: hoveredIndex === index ? 700 : 500,
                                }}
                            >
                                {formatMonthName(item.period)}
                            </span>
                        ))}
                    </div>

                    {/* Tooltip on hover */}
                    {hoveredPoint && (
                        <div
                            className="rep-chart-tooltip"
                            style={{
                                left: `calc(44px + ${(hoveredIndex! / Math.max(1, data.length - 1)) * 90}%)`,
                                top: "20px",
                            }}
                        >
                            <div style={{ fontWeight: 600 }}>{hoveredPoint.period}</div>
                            <div style={{ color: "#38BDF8" }}>Gross Margin: {hoveredPoint.val.toFixed(1)}%</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
