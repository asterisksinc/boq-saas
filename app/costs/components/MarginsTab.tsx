"use client";

import { useState, useEffect, useMemo } from "react";
import {
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Info,
    Percent,
    Flag,
    Package,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import { getCostingMargins } from "@/lib/api/costing";
import type { MarginAnalysisResponse } from "@/lib/types";

interface MarginsTabProps {
    onNavigateTab?: (tab: "Library" | "Categories" | "Analysis" | "Scenarios" | "Margins" | "Settings") => void;
}

export default function MarginsTab({ onNavigateTab }: MarginsTabProps) {
    const [data, setData] = useState<MarginAnalysisResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getCostingMargins();
            setData(res);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load margins");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "64px", color: "#6b7280", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px auto", color: "#2563eb" }} />
                <div style={{ fontWeight: 500, color: "#1f2d3d" }}>Loading Margin Analysis...</div>
                <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>Evaluating profitability targets, category margins, and cost drivers from live database</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ padding: "16px 20px", background: "#fef2f2", color: "#b91c1c", borderRadius: "10px", border: "1px solid #fecaca", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <AlertCircle size={20} />
                    <span>{error || "Unable to load margin analysis data."}</span>
                </div>
                <button
                    onClick={loadData}
                    style={{ background: "#fff", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "6px", padding: "6px 14px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                >
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );
    }

    const { targetMargin, currentMargin, marginDifference } = data;
    const currentDelta = data.currentMarginDelta ?? 0;
    const diffDelta = data.marginDifferenceDelta ?? 0;
    const lowMarginCount = data.lowMarginCount ?? data.lowMarginItems?.length ?? 0;
    const avgLowMargin = data.avgLowMargin ?? 0;

    // Use strictly actual backend data (no hardcoded arrays)
    const trendPoints = data.trend || [];
    const categories = data.byCategory || [];
    const lowItems = data.lowMarginItems || [];
    const impactDrivers = data.impactDrivers || [];
    const insights = data.insights || [];

    const handleInsightAction = (actionType?: string) => {
        if (!onNavigateTab) return;
        if (actionType === "library") onNavigateTab("Library");
        else if (actionType === "analysis") onNavigateTab("Analysis");
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 1. Top 4 KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                {/* Card 1: Total Margin Target */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Total Margin Target</div>
                        <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>{Math.round(targetMargin)}%</div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>Organisation Target</div>
                </div>

                {/* Card 2: Current Margin */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Current Margin</div>
                        <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>{currentMargin.toFixed(1)}%</div>
                    </div>
                    <div style={{ fontSize: "12px", color: currentDelta < 0 ? "#ef4444" : "#10b981", marginTop: "12px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                        {currentDelta < 0 ? `${currentDelta.toFixed(1)}% vs Target` : `+${currentDelta.toFixed(1)}% vs Target`}
                    </div>
                </div>

                {/* Card 3: Margin Difference */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Margin Variance</div>
                        <div style={{ fontSize: "28px", fontWeight: 700, color: marginDifference >= 0 ? "#10b981" : "#ef4444", letterSpacing: "-0.5px" }}>
                            {marginDifference > 0 ? `+${marginDifference.toFixed(1)}%` : `${marginDifference.toFixed(1)}%`}
                        </div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px", fontWeight: 500 }}>
                        {marginDifference >= 0 ? "Exceeding Target" : "Below Target Threshold"}
                    </div>
                </div>

                {/* Card 4: Low Margin Items */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Low Margin Items</div>
                        <div style={{ fontSize: "28px", fontWeight: 700, color: lowMarginCount > 0 ? "#ef4444" : "#10b981", letterSpacing: "-0.5px" }}>{lowMarginCount}</div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>
                        {lowMarginCount > 0 ? `Avg: ${avgLowMargin.toFixed(1)}% margin` : "All items meet target"}
                    </div>
                </div>
            </div>

            {/* 2. Middle Row: 3 Columns (Margin Trend, Margin by Category, Low Margin Items) */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "20px", alignItems: "stretch" }}>
                {/* Column 1: Margin Trend */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div>
                            <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 600, color: "#1f2d3d" }}>Margin Trend</h4>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "11px", color: "#6b7280" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
                                    Actual Margin
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                                    Target ({Math.round(targetMargin)}%)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, minHeight: "220px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        {trendPoints.length === 0 ? (
                            <div style={{ textAlign: "center", color: "#9ca3af", padding: "32px 0", fontSize: "13px" }}>
                                Historical margin trend points will populate as cost items and BOQs are added over time.
                            </div>
                        ) : (
                            <div style={{ position: "relative", height: "180px", width: "100%" }}>
                                <svg width="100%" height="100%" viewBox="0 0 360 160" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                                    {/* Target Reference Line */}
                                    <line x1="0" y1="60" x2="360" y2="60" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />
                                    
                                    {/* Actual Line */}
                                    <polyline
                                        fill="none"
                                        stroke="#2563eb"
                                        strokeWidth="2.5"
                                        points={trendPoints.map((p, i) => {
                                            const x = (i / Math.max(1, trendPoints.length - 1)) * 360;
                                            const y = 140 - Math.min(120, Math.max(10, (p.current / 40) * 120));
                                            return `${x},${y}`;
                                        }).join(" ")}
                                    />

                                    {/* Data Dots */}
                                    {trendPoints.map((p, i) => {
                                        const x = (i / Math.max(1, trendPoints.length - 1)) * 360;
                                        const y = 140 - Math.min(120, Math.max(10, (p.current / 40) * 120));
                                        return (
                                            <circle
                                                key={i}
                                                cx={x}
                                                cy={y}
                                                r={4}
                                                fill="#2563eb"
                                                stroke="#ffffff"
                                                strokeWidth="2"
                                            />
                                        );
                                    })}
                                </svg>

                                {/* X-Axis Labels */}
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af", marginTop: "12px" }}>
                                    {trendPoints.map((p, i) => (
                                        <span key={i}>{p.month}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Margin by Category */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
                    <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 600, color: "#1f2d3d" }}>Margin by Category</h4>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, justifyContent: categories.length === 0 ? "center" : "space-around" }}>
                        {categories.length === 0 ? (
                            <div style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0", fontSize: "13px" }}>
                                No categories with margin data found.
                            </div>
                        ) : (
                            categories.slice(0, 5).map((cat) => {
                                const barColor = cat.marginPercent >= 24 ? "#10b981" : cat.marginPercent >= 18 ? "#f59e0b" : "#ef4444";
                                const isDeltaPositive = (cat.vsLastMonth ?? 0) >= 0;

                                return (
                                    <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
                                        <span style={{ width: "95px", fontWeight: 500, color: "#1f2d3d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {cat.name}
                                        </span>

                                        <div style={{ flex: 1, height: "8px", background: "#f3f4f6", borderRadius: "4px", overflow: "hidden" }}>
                                            <div
                                                style={{
                                                    width: `${Math.min(100, Math.max(8, (cat.marginPercent / 40) * 100))}%`,
                                                    height: "100%",
                                                    background: barColor,
                                                    borderRadius: "4px"
                                                }}
                                            />
                                        </div>

                                        <span style={{ width: "42px", textAlign: "right", color: "#4b5563", fontWeight: 500 }}>
                                            {cat.marginPercent.toFixed(1)}%
                                        </span>

                                        <div style={{ width: "65px", textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.1 }}>
                                            <span style={{ color: isDeltaPositive ? "#10b981" : "#ef4444", fontWeight: 600, fontSize: "11px" }}>
                                                {isDeltaPositive ? `+${cat.vsLastMonth}% ↑` : `${cat.vsLastMonth}% ↓`}
                                            </span>
                                            <span style={{ color: "#9ca3af", fontSize: "9px" }}>vs last month</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Column 3: Low Margin Items */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
                    <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 600, color: "#1f2d3d" }}>Low Margin Items</h4>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, justifyContent: lowItems.length === 0 ? "center" : "space-around" }}>
                        {lowItems.length === 0 ? (
                            <div style={{ textAlign: "center", color: "#10b981", padding: "24px 0", fontSize: "13px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                                <CheckCircle2 size={24} color="#10b981" />
                                <span>All items meet target profitability threshold!</span>
                            </div>
                        ) : (
                            lowItems.slice(0, 4).map((item, idx) => (
                                <div key={item.id || idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "36px", height: "36px", background: "#f3f4f6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", flexShrink: 0 }}>
                                            <Package size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>
                                                {item.name}
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#6b7280" }}>
                                                {item.brand || "Material · Unit"}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: item.marginPercent < 15 ? "#ef4444" : "#f59e0b" }}>
                                            {item.marginPercent.toFixed(1)}%
                                        </span>
                                        <span
                                            style={{
                                                background: item.severity === "CRITICAL" ? "#fef2f2" : "#ecfdf5",
                                                color: item.severity === "CRITICAL" ? "#ef4444" : "#10b981",
                                                border: `1px solid ${item.severity === "CRITICAL" ? "#fecaca" : "#a7f3d0"}`,
                                                padding: "2px 7px",
                                                borderRadius: "10px",
                                                fontSize: "9px",
                                                fontWeight: 700,
                                                letterSpacing: "0.5px"
                                            }}
                                        >
                                            {item.severity || "CRITICAL"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Bottom Row: 2 Columns (MARGIN IMPACT DRIVERS, Margin Insights) */}
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "20px" }}>
                {/* Left: Margin Impact Drivers Table */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", padding: "20px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#374151", letterSpacing: "0.5px", marginBottom: "16px" }}>
                        MARGIN IMPACT DRIVERS
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        {impactDrivers.length === 0 ? (
                            <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                                No negative margin variance drivers recorded.
                            </div>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ background: "#f9fafb", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                                        <th style={{ padding: "10px 12px", fontWeight: 600 }}>DRIVER</th>
                                        <th style={{ padding: "10px 12px", fontWeight: 600 }}>IMPACT ON MARGIN</th>
                                        <th style={{ padding: "10px 12px", fontWeight: 600 }}>VS LAST MONTH</th>
                                        <th style={{ padding: "10px 12px", fontWeight: 600 }}>AFFECTED ITEMS</th>
                                        <th style={{ padding: "10px 12px", fontWeight: 600 }}>PRIMARY IMPACT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {impactDrivers.map((row, i) => (
                                        <tr key={row.id || i} style={{ borderBottom: i === impactDrivers.length - 1 ? "none" : "1px solid #f3f4f6" }}>
                                            <td style={{ padding: "14px 12px", fontWeight: 500, color: "#111827" }}>{row.driver}</td>
                                            <td style={{ padding: "14px 12px", color: "#ef4444", fontWeight: 600 }}>
                                                {row.impactOnMargin < 0 ? `${row.impactOnMargin}%` : `+${row.impactOnMargin}%`}
                                            </td>
                                            <td style={{ padding: "14px 12px", color: "#ef4444", fontWeight: 500 }}>
                                                {row.vsLastMonth < 0 ? `${row.vsLastMonth}% ↓` : `+${row.vsLastMonth}% ↑`}
                                            </td>
                                            <td style={{ padding: "14px 12px", fontWeight: 700, color: "#111827" }}>{row.affectedItems}</td>
                                            <td style={{ padding: "14px 12px", color: "#4b5563" }}>{row.primaryImpact}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right: Margin Insights */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#1f2d3d", marginBottom: "16px" }}>
                        Margin Insights
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "18px", flex: 1, justifyContent: insights.length === 0 ? "center" : "flex-start" }}>
                        {insights.length === 0 ? (
                            <div style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0", fontSize: "13px" }}>
                                No critical margin deviations detected.
                            </div>
                        ) : (
                            insights.map((ins, i) => (
                                <div key={ins.id || i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                        <span style={{ color: "#6b7280", marginTop: "2px", flexShrink: 0 }}>
                                            {ins.icon === "info" && <Info size={16} />}
                                            {ins.icon === "trending" && <TrendingDown size={16} color="#ef4444" />}
                                            {ins.icon === "percent" && <Percent size={16} />}
                                            {ins.icon === "flag" && <Flag size={16} />}
                                        </span>
                                        <span style={{ fontSize: "13px", color: "#374151", lineHeight: 1.4 }}>
                                            {ins.text}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInsightAction(ins.actionType)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#2563eb",
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            cursor: "pointer",
                                            whiteSpace: "nowrap",
                                            padding: 0
                                        }}
                                        className="hover:underline"
                                    >
                                        {ins.actionText} &rarr;
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
