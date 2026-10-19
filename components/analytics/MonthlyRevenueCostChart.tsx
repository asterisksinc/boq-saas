"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/costing-format";

interface MonthlyDataPoint {
    month?: string;
    period?: string;
    revenue?: number;
    cost?: number;
    margin?: number;
}

interface MonthlyRevenueCostChartProps {
    data: MonthlyDataPoint[];
    currency?: string;
}

export default function MonthlyRevenueCostChart({ data, currency = "INR" }: MonthlyRevenueCostChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!data || data.length === 0) {
        return (
            <div className="rep-card-outer">
                <div className="rep-card-header">
                    <h3 className="rep-card-title">Monthly Revenue vs Cost (₹ Lakhs)</h3>
                </div>
                <div className="rep-inner-card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ color: "#64748B", fontSize: "14px" }}>No monthly revenue data available for this period.</div>
                </div>
            </div>
        );
    }

    // Determine max value for Y-axis scaling
    const maxVal = Math.max(
        ...data.map((d) => Math.max(Number(d.revenue || 0), Number(d.cost || 0))),
        100000 // default minimum scale (1 Lakh)
    );

    // Format Y-axis ticks in Lakhs (or custom units)
    const yTicks = [
        maxVal,
        maxVal * 0.75,
        maxVal * 0.5,
        maxVal * 0.25,
        0,
    ];

    const formatTick = (val: number) => {
        if (currency === "INR") {
            const lk = val / 100000;
            return `${lk >= 10 ? lk.toFixed(0) : lk.toFixed(1)}L`;
        }
        return `${(val / 1000).toFixed(0)}K`;
    };

    // Helper to format short month name from period string (e.g. "2026-03" -> "Mar")
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

    const hoveredPoint = hoveredIndex !== null ? data[hoveredIndex] : null;

    return (
        <div className="rep-card-outer">
            <div className="rep-card-header">
                <h3 className="rep-card-title">Monthly Revenue vs Cost (₹ Lakhs)</h3>
                <div className="rep-card-legend">
                    <div className="rep-legend-item">
                        <span className="rep-legend-line blue" />
                        <span style={{ color: "#2563EB" }}>Revenue</span>
                    </div>
                    <div className="rep-legend-item">
                        <span className="rep-legend-line slate" />
                        <span style={{ color: "#64748B" }}>Cost</span>
                    </div>
                </div>
            </div>

            <div className="rep-inner-card">
                {/* Chart container with absolute positioning like Figma */}
                <div style={{ position: "relative", width: "100%", height: "220px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    {/* Y-axis dashed grid lines */}
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none" }}>
                        {yTicks.map((tick, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", height: "14px" }}>
                                <span style={{ width: "32px", fontSize: "12px", color: "#64748B", textAlign: "right", flexShrink: 0, fontWeight: 500 }}>
                                    {formatTick(tick)}
                                </span>
                                <div style={{ flex: 1, borderTop: "1px dashed rgba(100, 116, 139, 0.2)" }} />
                            </div>
                        ))}
                    </div>

                    {/* Bars overlay */}
                    <div
                        style={{
                            position: "absolute",
                            left: "44px",
                            right: "12px",
                            top: "7px",
                            bottom: "24px",
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-around",
                            alignItems: "flex-end",
                            zIndex: 1,
                        }}
                    >
                        {data.map((item, index) => {
                            const rev = Number(item.revenue || 0);
                            const cst = Number(item.cost || 0);
                            const revHeight = Math.min(100, Math.max(3, (rev / maxVal) * 100));
                            const costHeight = Math.min(100, Math.max(3, (cst / maxVal) * 100));

                            return (
                                <div
                                    key={item.period || item.month || index}
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "flex-end",
                                        gap: "4px",
                                        height: "100%",
                                        cursor: "pointer",
                                        padding: "0 4px",
                                    }}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    {/* Revenue Bar (Blue) */}
                                    <div
                                        style={{
                                            width: "16px",
                                            height: `${revHeight}%`,
                                            background: "#2563EB",
                                            borderRadius: "4px 4px 0 0",
                                            opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.6,
                                            transition: "height 0.3s ease, opacity 0.15s ease",
                                        }}
                                    />
                                    {/* Cost Bar (Slate) */}
                                    <div
                                        style={{
                                            width: "16px",
                                            height: `${costHeight}%`,
                                            background: "#DAE0E6",
                                            borderRadius: "4px 4px 0 0",
                                            opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.6,
                                            transition: "height 0.3s ease, opacity 0.15s ease",
                                        }}
                                    />
                                </div>
                            );
                        })}
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
                            justifyContent: "space-around",
                            alignItems: "center",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#64748B",
                        }}
                    >
                        {data.map((item, index) => (
                            <span
                                key={item.period || item.month || index}
                                style={{
                                    textAlign: "center",
                                    color: hoveredIndex === index ? "#0F172A" : "#64748B",
                                    fontWeight: hoveredIndex === index ? 700 : 500,
                                }}
                            >
                                {formatMonthName(item.period || item.month)}
                            </span>
                        ))}
                    </div>

                    {/* Tooltip on hover */}
                    {hoveredPoint && (
                        <div
                            className="rep-chart-tooltip"
                            style={{
                                left: `calc(44px + ${(hoveredIndex! + 0.5) * ((100 - 10) / data.length)}%)`,
                                top: "20px",
                            }}
                        >
                            <div style={{ fontWeight: 600, marginBottom: "2px" }}>{hoveredPoint.period || hoveredPoint.month}</div>
                            <div>Revenue: {formatMoney(Number(hoveredPoint.revenue || 0))}</div>
                            <div>Cost: {formatMoney(Number(hoveredPoint.cost || 0))}</div>
                            {hoveredPoint.revenue ? (
                                <div style={{ color: "#10B981", marginTop: "2px" }}>
                                    Margin: {(((Number(hoveredPoint.revenue) - Number(hoveredPoint.cost || 0)) * 100) / Number(hoveredPoint.revenue)).toFixed(1)}%
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
