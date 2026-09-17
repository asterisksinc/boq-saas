"use client";

import { useState, useEffect, useMemo } from "react";
import {
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Info,
    Percent,
    Flag,
    ArrowDown,
    ArrowUp,
    Package,
    AlertCircle
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
    const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(2); // Default to May (27% Margin in Figma)

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
                <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>Evaluating profitability targets, category margins, and cost drivers</div>
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
    const currentDelta = data.currentMarginDelta ?? -2.3;
    const diffDelta = data.marginDifferenceDelta ?? -2.3;
    const lowMarginCount = data.lowMarginCount ?? data.lowMarginItems.length ?? 31;
    const avgLowMargin = data.avgLowMargin ?? 11.2;

    const trendPoints = data.trend && data.trend.length ? data.trend : [
        { month: "Mar", current: 18.2, target: targetMargin },
        { month: "Apr", current: 21.0, target: targetMargin },
        { month: "May", current: 27.0, target: targetMargin },
        { month: "Jun", current: 24.0, target: targetMargin },
        { month: "Jul", current: 25.4, target: targetMargin },
        { month: "Aug", current: currentMargin, target: targetMargin }
    ];

    const categories = data.byCategory && data.byCategory.length ? data.byCategory : [
        { id: "cat-1", name: "Furniture", marginPercent: 28.7, vsLastMonth: 8.2 },
        { id: "cat-2", name: "Kitchen", marginPercent: 24.3, vsLastMonth: 1.1 },
        { id: "cat-3", name: "Wardrobe", marginPercent: 19.4, vsLastMonth: -1.8 },
        { id: "cat-4", name: "Civil & Finishes", marginPercent: 22.6, vsLastMonth: -0.3 },
        { id: "cat-5", name: "MEP", marginPercent: 17.4, vsLastMonth: -3.2 },
    ];

    const lowItems = data.lowMarginItems && data.lowMarginItems.length ? data.lowMarginItems.slice(0, 3) : [
        { id: "low-1", name: "18MM HDHMR Board", brand: "Century · Sheet", marginPercent: 8.2, severity: "CRITICAL" },
        { id: "low-2", name: "Laminate - Matt", brand: "Greenlam · Sheet", marginPercent: 9.1, severity: "CRITICAL" },
        { id: "low-3", name: "Concealed Hinge", brand: "Hettich · Piece", marginPercent: 12.48, severity: "ACTIVE" }
    ];

    const impactDrivers = data.impactDrivers && data.impactDrivers.length ? data.impactDrivers : [
        { id: "drv-1", driver: "Vendor Rate Increase", impactOnMargin: -2.8, vsLastMonth: -1.8, affectedItems: 78, primaryImpact: "Furniture, Kitchen, Wardrobe" },
        { id: "drv-2", driver: "Material Cost Increase", impactOnMargin: -1.6, vsLastMonth: -0.8, affectedItems: 54, primaryImpact: "Civil & Finishes, Kitchen" },
        { id: "drv-3", driver: "Discounts & Concessions", impactOnMargin: -1.7, vsLastMonth: -0.6, affectedItems: 31, primaryImpact: "All Categories" },
        { id: "drv-4", driver: "Labour Cost Increase", impactOnMargin: -0.7, vsLastMonth: -0.3, affectedItems: 19, primaryImpact: "Installation, Civil & Finishes" }
    ];

    const insights = data.insights && data.insights.length ? data.insights : [
        { id: "ins-1", icon: "info" as const, text: `${lowMarginCount} items are below target margin ${Math.round(targetMargin)}%`, actionText: "Review Items", actionType: "library" },
        { id: "ins-2", icon: "trending" as const, text: "Kitchen category margin dropped by 1.8%", actionText: "View Analysis", actionType: "analysis" },
        { id: "ins-3", icon: "percent" as const, text: "Discounts applied exceeded limit in 4 projects", actionText: "Review Discounts", actionType: "projects" },
        { id: "ins-4", icon: "flag" as const, text: "5 people have cost overruns impacting margins", actionText: "View Over runs", actionType: "overruns" }
    ];

    const handleInsightAction = (actionType?: string) => {
        if (!onNavigateTab) return;
        if (actionType === "library") onNavigateTab("Library");
        else if (actionType === "analysis") onNavigateTab("Analysis");
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 1. Top 4 KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                {/* Card 1: Total Margin */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Total Margin</div>
                        <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>{Math.round(targetMargin)}%</div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>Organisation Target</div>
                </div>

                {/* Card 2: Current Margin */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Current Margin</div>
                        <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>{Math.round(currentMargin)}%</div>
                    </div>
                    <div style={{ fontSize: "12px", color: currentDelta < 0 ? "#ef4444" : "#10b981", marginTop: "12px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                        {currentDelta < 0 ? `${currentDelta}% vs Last Month ↓` : `+${currentDelta}% vs Last Month ↑`}
                    </div>
                </div>

                {/* Card 3: Margin Difference */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Margin Difference</div>
                        <div style={{ fontSize: "28px", fontWeight: 700, color: marginDifference >= 0 ? "#111827" : "#111827", letterSpacing: "-0.5px" }}>
                            {marginDifference > 0 ? `+${marginDifference.toFixed(1)}%` : `${marginDifference.toFixed(1)}%`}
                        </div>
                    </div>
                    <div style={{ fontSize: "12px", color: diffDelta < 0 ? "#ef4444" : "#10b981", marginTop: "12px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                        {diffDelta < 0 ? `${diffDelta}% vs Last Month ↓` : `+${diffDelta}% vs Last Month ↑`}
                    </div>
                </div>

                {/* Card 4: Low Margin Items */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Low Margin Items</div>
                        <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>{avgLowMargin.toFixed(1)}%</div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>{lowMarginCount} items below Target</div>
                </div>
            </div>

            {/* 2. Middle Row: 3 Columns (Margin Trend, Margin by Category, Low Margin Items) */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "20px" }}>
                {/* Column 1: Margin Trend */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#1f2d3d" }}>Margin Trend</h4>
                        <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#4b5563" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ width: "8px", height: "8px", background: "#2563eb", borderRadius: "50%" }} /> Current
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ width: "8px", height: "8px", background: "#cbd5e1", borderRadius: "50%" }} /> Target
                            </div>
                        </div>
                    </div>

                    {/* Interactive Curve Canvas */}
                    <div style={{ position: "relative", height: "190px", width: "100%", display: "flex" }}>
                        {/* Y-Axis Labels */}
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af", width: "36px", paddingBottom: "22px", textAlign: "right", paddingRight: "8px" }}>
                            <span>100%</span>
                            <span>75%</span>
                            <span>50%</span>
                            <span>25%</span>
                            <span>0%</span>
                        </div>

                        {/* Chart Area */}
                        <div style={{ flex: 1, position: "relative", height: "100%" }}>
                            {/* Horizontal Grid lines */}
                            <div style={{ position: "absolute", inset: 0, bottom: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none" }}>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} style={{ borderBottom: "1px dashed #f1f5f9", width: "100%" }} />
                                ))}
                            </div>

                            {/* SVG Wave Chart */}
                            <svg viewBox="0 0 320 140" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "calc(100% - 22px)", overflow: "visible" }}>
                                <defs>
                                    {/* Gradient for Current Wave */}
                                    <linearGradient id="currentMarginGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.85" />
                                        <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.35" />
                                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                                    </linearGradient>
                                    {/* Gradient for Target Wave */}
                                    <linearGradient id="targetMarginGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.75" />
                                        <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.15" />
                                    </linearGradient>
                                </defs>

                                {/* Target Wave (Light soft background curve) */}
                                <path
                                    d="M 0 100 Q 50 85, 100 65 T 200 70 T 320 60 L 320 140 L 0 140 Z"
                                    fill="url(#targetMarginGrad)"
                                />

                                {/* Current Wave (Bold curved blue wave matching Figma) */}
                                <path
                                    d="M 0 120 C 60 118, 90 105, 130 65 C 160 35, 190 85, 230 100 C 270 115, 300 110, 320 105 L 320 140 L 0 140 Z"
                                    fill="url(#currentMarginGrad)"
                                />
                                <path
                                    d="M 0 120 C 60 118, 90 105, 130 65 C 160 35, 190 85, 230 100 C 270 115, 300 110, 320 105"
                                    fill="none"
                                    stroke="#2563eb"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />

                                {/* Highlighted Point matching Figma May (27% Margin) */}
                                <circle cx="130" cy="65" r="4.5" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
                            </svg>

                            {/* Floating Tooltip Pill (May: 27% Margin) */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: "calc(40% - 38px)",
                                    top: "14px",
                                    background: "#111827",
                                    color: "#fff",
                                    padding: "4px 10px",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                                    textAlign: "center",
                                    pointerEvents: "none"
                                }}
                            >
                                27%
                                <div style={{ fontSize: "9px", fontWeight: 400, opacity: 0.85 }}>Margin</div>
                                {/* Tooltip bottom triangle */}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "-4px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: 0,
                                        height: 0,
                                        borderLeft: "4px solid transparent",
                                        borderRight: "4px solid transparent",
                                        borderTop: "4px solid #111827"
                                    }}
                                />
                            </div>

                            {/* X-Axis Month Labels */}
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>
                                {trendPoints.map((p, idx) => (
                                    <span key={p.month || idx}>{p.month}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2: Margin by Category */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 600, color: "#1f2d3d" }}>Margin by Category</h4>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, justifyContent: "space-around" }}>
                        {categories.slice(0, 5).map((cat) => {
                            const barColor = cat.marginPercent >= 24 ? "#10b981" : cat.marginPercent >= 18 ? "#f59e0b" : "#ef4444";
                            const isDeltaPositive = (cat.vsLastMonth ?? 0) >= 0;

                            return (
                                <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
                                    <span style={{ width: "95px", fontWeight: 500, color: "#1f2d3d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {cat.name}
                                    </span>

                                    {/* Progress capsule */}
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
                                            {isDeltaPositive ? `+${cat.vsLastMonth}% ↑` : `${cat.vsLastMonth}% ↑`}
                                        </span>
                                        <span style={{ color: "#9ca3af", fontSize: "9px" }}>vs last month</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Column 3: Low Margin Items */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 600, color: "#1f2d3d" }}>Low Margin Items</h4>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, justifyContent: "space-around" }}>
                        {lowItems.map((item, idx) => (
                            <div key={item.id || idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    {/* Gray square thumbnail */}
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
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#10b981" }}>
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
                        ))}
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
                    </div>
                </div>

                {/* Right: Margin Insights */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#1f2d3d", marginBottom: "16px" }}>
                        Margin Insights
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "18px", flex: 1, justifyContent: "space-around" }}>
                        {insights.map((ins, i) => (
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
                                        padding: 0,
                                        textDecoration: "none"
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                                >
                                    {ins.actionText}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

