"use client";

import { useState, useEffect, useMemo } from "react";
import {
    RefreshCw,
    TrendingDown,
    Percent,
    Flag,
    Package,
    AlertCircle,
    CheckCircle2,
    SlidersHorizontal,
    ExternalLink,
    ChevronRight,
    ChevronDown,
    X,
} from "lucide-react";
import { getCostingMargins, getCostingCategories } from "@/lib/api/costing";
import type { MarginAnalysisResponse, MarginImpactDriver, MarginInsight, LowMarginItem, MarginTrendPoint } from "@/lib/types";
import { formatFullCurrency } from "@/lib/costing-format";
import type { FilterOption } from "@/components/costing/CostingFilterPopover";

interface MarginsTabProps {
    onNavigateTab?: (tab: "Library" | "Categories" | "Analysis" | "Scenarios" | "Margins" | "Settings") => void;
    projectFilter?: string;
    categoryFilter?: string;
    onFilterOptionsLoaded?: (projects: FilterOption[], categories: FilterOption[]) => void;
}

export default function MarginsTab({
    onNavigateTab,
    projectFilter = "all",
    categoryFilter = "all",
    onFilterOptionsLoaded,
}: MarginsTabProps) {
    const [data, setData] = useState<MarginAnalysisResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);
    const [showDetailedLowMarginTable, setShowDetailedLowMarginTable] = useState(false);
    const [lowMarginSearch, setLowMarginSearch] = useState("");

    const loadData = async (cat?: string, proj?: string) => {
        setLoading(true);
        setError("");
        try {
            const res = await getCostingMargins({
                categoryId: cat && cat !== "all" ? cat : undefined,
                projectId: proj && proj !== "all" ? proj : undefined,
            });
            setData(res);

            // Populate category filter options if callback provided
            if (onFilterOptionsLoaded) {
                try {
                    const cats = await getCostingCategories();
                    const catOptions = (cats.items || []).map((c) => ({
                        label: c.name,
                        value: c.id,
                    }));
                    onFilterOptionsLoaded([], catOptions);
                } catch {
                    // Silently ignore if category options fail
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load margins");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData(categoryFilter, projectFilter);
    }, [categoryFilter, projectFilter]);

    if (loading) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                {/* 4 KPI Skeletons */}
                <div className="costing-margins-kpi-grid">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="costing-margins-kpi-card" style={{ opacity: 0.6 }}>
                            <div style={{ width: "90px", height: "14px", background: "#E2E8F0", borderRadius: "4px" }} />
                            <div style={{ width: "60px", height: "28px", background: "#CBD5E1", borderRadius: "4px" }} />
                            <div style={{ width: "110px", height: "12px", background: "#E2E8F0", borderRadius: "4px" }} />
                        </div>
                    ))}
                </div>

                {/* 3 Panel Skeletons */}
                <div className="costing-margins-row2-grid">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="costing-margins-panel-card" style={{ opacity: 0.6 }}>
                            <div style={{ width: "120px", height: "16px", background: "#E2E8F0", borderRadius: "4px" }} />
                            <div style={{ flex: 1, width: "100%", background: "#F1F5F9", borderRadius: "4px" }} />
                        </div>
                    ))}
                </div>

                {/* Bottom Row Skeleton */}
                <div className="costing-margins-row3-grid">
                    <div className="costing-impact-card" style={{ opacity: 0.6 }}>
                        <div style={{ width: "180px", height: "16px", background: "#E2E8F0", borderRadius: "4px" }} />
                        <div style={{ flex: 1, width: "100%", background: "#F1F5F9", borderRadius: "4px" }} />
                    </div>
                    <div className="costing-insights-card" style={{ opacity: 0.6 }}>
                        <div style={{ width: "120px", height: "16px", background: "#E2E8F0", borderRadius: "4px" }} />
                        <div style={{ flex: 1, width: "100%", background: "#F1F5F9", borderRadius: "4px" }} />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div
                style={{
                    padding: "16px 20px",
                    background: "#FEF2F2",
                    color: "#B91C1C",
                    borderRadius: "8px",
                    border: "1px solid #FECACA",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontFamily: "'Urbanist', sans-serif",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <AlertCircle size={20} />
                    <span>{error || "Unable to load margin analysis data."}</span>
                </div>
                <button
                    type="button"
                    onClick={() => loadData(categoryFilter, projectFilter)}
                    style={{
                        background: "#fff",
                        border: "1px solid #FCA5A5",
                        color: "#B91C1C",
                        borderRadius: "6px",
                        padding: "6px 14px",
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                    }}
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

    const trendPoints = data.trend || [];
    const categories = data.byCategory || [];
    const lowItems = data.lowMarginItems || [];
    const impactDrivers = data.impactDrivers || [];
    const insights = data.insights || [];

    const handleInsightAction = (actionType?: string) => {
        if (!actionType) return;
        if (actionType === "low_margin_table") {
            setShowDetailedLowMarginTable(true);
        } else if (actionType === "library" && onNavigateTab) {
            onNavigateTab("Library");
        } else if (actionType === "analysis" && onNavigateTab) {
            onNavigateTab("Analysis");
        }
    };

    // Filter detailed low-margin items
    const filteredDetailedItems = lowItems.filter((item) => {
        if (!lowMarginSearch) return true;
        const q = lowMarginSearch.toLowerCase();
        return (
            item.name.toLowerCase().includes(q) ||
            (item.code && item.code.toLowerCase().includes(q)) ||
            (item.categoryName && item.categoryName.toLowerCase().includes(q)) ||
            (item.brand && item.brand.toLowerCase().includes(q))
        );
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
            {/* 1. Row 1: Four KPI Cards (Frame 2147225138) */}
            <div className="costing-margins-kpi-grid">
                {/* Card 1: Total Margin Target (Frame 93) */}
                <div className="costing-margins-kpi-card">
                    <span className="costing-margins-kpi-title">Total Margin</span>
                    <span className="costing-margins-kpi-value">{Math.round(targetMargin)}%</span>
                    <span className="costing-margins-kpi-subtitle">Organisation Target</span>
                </div>

                {/* Card 2: Current Margin (Frame 2147225072) */}
                <div className="costing-margins-kpi-card">
                    <span className="costing-margins-kpi-title">Current Margin</span>
                    <span className="costing-margins-kpi-value">{currentMargin.toFixed(1)}%</span>
                    <span
                        className={`costing-margins-kpi-subtitle ${
                            currentDelta < 0 ? "is-negative" : "is-positive"
                        }`}
                    >
                        {currentDelta < 0
                            ? `${currentDelta.toFixed(1)}% vs Last Month ↓`
                            : `+${currentDelta.toFixed(1)}% vs Last Month ↑`}
                    </span>
                </div>

                {/* Card 3: Margin Difference (Frame 2147225073) */}
                <div className="costing-margins-kpi-card">
                    <span className="costing-margins-kpi-title">Margin Difference</span>
                    <span className="costing-margins-kpi-value">
                        {marginDifference >= 0 ? `+${marginDifference.toFixed(1)}%` : `${marginDifference.toFixed(1)}%`}
                    </span>
                    <span
                        className={`costing-margins-kpi-subtitle ${
                            diffDelta < 0 ? "is-negative" : "is-positive"
                        }`}
                    >
                        {diffDelta < 0
                            ? `${diffDelta.toFixed(1)}% vs Last Month ↓`
                            : `+${diffDelta.toFixed(1)}% vs Last Month ↑`}
                    </span>
                </div>

                {/* Card 4: Low Margin Items (Frame 2147225071) */}
                <div
                    className="costing-margins-kpi-card"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowDetailedLowMarginTable(prev => !prev)}
                    title="Click to view detailed low margin items"
                >
                    <span className="costing-margins-kpi-title">Low Margin Items</span>
                    <span className="costing-margins-kpi-value">
                        {avgLowMargin > 0 ? `${avgLowMargin.toFixed(1)}%` : `${lowMarginCount}`}
                    </span>
                    <span className="costing-margins-kpi-subtitle">
                        {lowMarginCount} Items below Target
                    </span>
                </div>
            </div>

            {/* 2. Row 2: 3 Analytics Panels (Frame 2147225233 / Frame 2147225200) */}
            <div className="costing-margins-row2-grid">
                {/* Panel A: Margin Trend (Frame 93) */}
                <div className="costing-margins-panel-card">
                    <div className="costing-trend-header">
                        <span className="costing-panel-title">Margin Trend</span>
                        <div className="costing-trend-legend">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <span className="costing-legend-badge-current" />
                                Current
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <span className="costing-legend-badge-target" />
                                Target
                            </span>
                        </div>
                    </div>

                    <div className="costing-trend-chart-body">
                        {/* Y-Axis labels */}
                        <div className="costing-trend-y-axis">
                            <span>40%</span>
                            <span>30%</span>
                            <span>20%</span>
                            <span>10%</span>
                            <span>0%</span>
                        </div>

                        {/* Chart Area */}
                        <div className="costing-trend-chart-main">
                            <div style={{ position: "relative", width: "100%", height: "163px" }}>
                                <svg
                                    width="100%"
                                    height="100%"
                                    viewBox="0 0 350 140"
                                    preserveAspectRatio="none"
                                    style={{ overflow: "visible" }}
                                >
                                    {/* Horizontal Grid lines */}
                                    <line x1="0" y1="0" x2="350" y2="0" stroke="#E7E7E7" strokeWidth="1" strokeDasharray="2 2" />
                                    <line x1="0" y1="35" x2="350" y2="35" stroke="#E7E7E7" strokeWidth="1" strokeDasharray="2 2" />
                                    <line x1="0" y1="70" x2="350" y2="70" stroke="#E7E7E7" strokeWidth="1" strokeDasharray="2 2" />
                                    <line x1="0" y1="105" x2="350" y2="105" stroke="#E7E7E7" strokeWidth="1" strokeDasharray="2 2" />
                                    <line x1="0" y1="140" x2="350" y2="140" stroke="#E7E7E7" strokeWidth="1" />

                                    {/* Target Area and Line (Figma Stacked_area_2) */}
                                    <polygon
                                        fill="rgba(37, 99, 235, 0.12)"
                                        points={`0,${140 - (targetMargin / 40) * 140} 350,${140 - (targetMargin / 40) * 140} 350,140 0,140`}
                                    />
                                    <line
                                        x1="0"
                                        y1={140 - (targetMargin / 40) * 140}
                                        x2="350"
                                        y2={140 - (targetMargin / 40) * 140}
                                        stroke="#2563EB"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 4"
                                        opacity="0.5"
                                    />

                                    {/* Current Trend Area & Line (Figma Stacked_area_1) */}
                                    {trendPoints.length > 0 && (
                                        <>
                                            <polygon
                                                fill="url(#currentAreaGrad)"
                                                points={`0,140 ${trendPoints
                                                    .map((p, i) => {
                                                        const x = (i / Math.max(1, trendPoints.length - 1)) * 350;
                                                        const y = Math.max(5, 140 - (p.current / 40) * 140);
                                                        return `${x},${y}`;
                                                    })
                                                    .join(" ")} 350,140`}
                                            />
                                            <polyline
                                                fill="none"
                                                stroke="#2563EB"
                                                strokeWidth="2.5"
                                                points={trendPoints
                                                    .map((p, i) => {
                                                        const x = (i / Math.max(1, trendPoints.length - 1)) * 350;
                                                        const y = Math.max(5, 140 - (p.current / 40) * 140);
                                                        return `${x},${y}`;
                                                    })
                                                    .join(" ")}
                                            />

                                            {/* Data points */}
                                            {trendPoints.map((p, i) => {
                                                const x = (i / Math.max(1, trendPoints.length - 1)) * 350;
                                                const y = Math.max(5, 140 - (p.current / 40) * 140);
                                                const isHovered = activeHoverIndex === i;
                                                return (
                                                    <g key={i}>
                                                        <circle
                                                            cx={x}
                                                            cy={y}
                                                            r={isHovered ? 6 : 4}
                                                            fill="#2563EB"
                                                            stroke="#FFFFFF"
                                                            strokeWidth="2"
                                                            style={{ cursor: "pointer", transition: "r 0.15s ease" }}
                                                            onMouseEnter={() => setActiveHoverIndex(i)}
                                                            onMouseLeave={() => setActiveHoverIndex(null)}
                                                        />
                                                    </g>
                                                );
                                            })}
                                        </>
                                    )}

                                    <defs>
                                        <linearGradient id="currentAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Tooltip (Figma _Tooltip) */}
                                {activeHoverIndex !== null && trendPoints[activeHoverIndex] && (
                                    <div
                                        className="costing-trend-tooltip"
                                        style={{
                                            left: `${(activeHoverIndex / Math.max(1, trendPoints.length - 1)) * 100}%`,
                                            top: `${Math.max(10, 140 - (trendPoints[activeHoverIndex].current / 40) * 140)}px`,
                                        }}
                                    >
                                        <span className="costing-trend-tooltip-val">
                                            {trendPoints[activeHoverIndex].current.toFixed(1)}%
                                        </span>
                                        <span className="costing-trend-tooltip-label">
                                            {trendPoints[activeHoverIndex].month}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* X-Axis Month Labels */}
                            <div className="costing-trend-x-axis">
                                {trendPoints.map((p, i) => (
                                    <span key={i}>{p.month}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel B: Margin by Category (Frame 2147225073) */}
                <div className="costing-margins-panel-card">
                    <span className="costing-panel-title">Margin by Category</span>

                    <div className="costing-catmargin-list">
                        {categories.length === 0 ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    color: "#64748B",
                                    padding: "40px 0",
                                    fontSize: "13px",
                                    fontFamily: "'Urbanist', sans-serif",
                                }}
                            >
                                No category margins recorded.
                            </div>
                        ) : (
                            categories.slice(0, 5).map((cat) => {
                                const fillWidth = Math.min(100, Math.max(6, (cat.marginPercent / 40) * 100));
                                const barColor =
                                    cat.marginPercent >= 24
                                        ? "#16A34A"
                                        : cat.marginPercent >= 18
                                        ? "#F59E0B"
                                        : "#DC2626";
                                const isDeltaPositive = (cat.vsLastMonth ?? 0) >= 0;

                                return (
                                    <div key={cat.id} className="costing-catmargin-row">
                                        <span className="costing-catmargin-name" title={cat.name}>
                                            {cat.name}
                                        </span>

                                        <div className="costing-catmargin-bar-group">
                                            <div className="costing-catmargin-track">
                                                <div
                                                    className="costing-catmargin-fill"
                                                    style={{
                                                        width: `${fillWidth}%`,
                                                        background: barColor,
                                                    }}
                                                />
                                            </div>
                                            <span className="costing-catmargin-pct">
                                                {cat.marginPercent.toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="costing-catmargin-delta">
                                            <span
                                                className="costing-catmargin-delta-val"
                                                style={{ color: isDeltaPositive ? "#16A34A" : "#DC2626" }}
                                            >
                                                {isDeltaPositive
                                                    ? `+${Math.abs(cat.vsLastMonth ?? 0).toFixed(1)}% ↑`
                                                    : `-${Math.abs(cat.vsLastMonth ?? 0).toFixed(1)}% ↓`}
                                            </span>
                                            <span className="costing-catmargin-delta-sub">vs last month</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Panel C: Low Margin Items Summary (Frame 2147225071) */}
                <div className="costing-margins-panel-card">
                    <span className="costing-panel-title">Low Margin Items</span>

                    <div className="costing-lowmargin-list">
                        {lowItems.length === 0 ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    color: "#16A34A",
                                    padding: "36px 0",
                                    fontSize: "13px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontFamily: "'Urbanist', sans-serif",
                                }}
                            >
                                <CheckCircle2 size={24} color="#16A34A" />
                                <span>All items meet profitability target!</span>
                            </div>
                        ) : (
                            lowItems.slice(0, 4).map((item, idx) => (
                                <div key={item.id || idx} className="costing-lowmargin-row">
                                    <div className="costing-lowmargin-left">
                                        <div className="costing-lowmargin-thumb">
                                            <Package size={16} />
                                        </div>
                                        <div className="costing-lowmargin-info">
                                            <span className="costing-lowmargin-title" title={item.name}>
                                                {item.name}
                                            </span>
                                            <span className="costing-lowmargin-subtitle" title={item.brand || "Material"}>
                                                {item.brand || `${item.unit || "Sheet"} • Standard`}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span className="costing-lowmargin-pct">
                                            {item.marginPercent.toFixed(1)}%
                                        </span>
                                        <span
                                            className={`costing-lowmargin-badge ${
                                                item.severity === "CRITICAL" || item.marginPercent < 10
                                                    ? "is-critical"
                                                    : "is-active"
                                            }`}
                                        >
                                            {item.severity === "CRITICAL" || item.marginPercent < 10
                                                ? "CRITICAL"
                                                : "ACTIVE"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Row 3: Two Panels (Frame 2147225129) */}
            <div className="costing-margins-row3-grid">
                {/* Left Panel: MARGIN IMPACT DRIVERS (Frame 2147225071) */}
                <div className="costing-impact-card">
                    <span className="costing-impact-title">MARGIN IMPACT DRIVERS</span>

                    <div className="costing-impact-table-wrapper">
                        {impactDrivers.length === 0 ? (
                            <div
                                style={{
                                    padding: "36px 0",
                                    textAlign: "center",
                                    color: "#64748B",
                                    fontSize: "13px",
                                    fontFamily: "'Urbanist', sans-serif",
                                    width: "100%",
                                }}
                            >
                                No negative margin variance drivers recorded.
                            </div>
                        ) : (
                            <table className="costing-impact-table">
                                <thead>
                                    <tr className="costing-impact-table-header">
                                        <th className="costing-impact-th costing-col-impact-driver">DRIVER</th>
                                        <th className="costing-impact-th costing-col-impact-val">IMPACT ON MARGIN</th>
                                        <th className="costing-impact-th costing-col-impact-vs">VS LAST MONTH</th>
                                        <th className="costing-impact-th costing-col-impact-items">AFFECTED ITEMS</th>
                                        <th className="costing-impact-th costing-col-impact-primary">PRIMARY IMPACT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {impactDrivers.map((row, i) => (
                                        <tr key={row.id || i} className="costing-impact-row">
                                            <td className="costing-impact-td costing-col-impact-driver">
                                                <span className="costing-impact-driver-text">{row.driver}</span>
                                            </td>
                                            <td className="costing-impact-td costing-col-impact-val">
                                                <span className="costing-impact-val-text">
                                                    {row.impactOnMargin < 0 ? `${row.impactOnMargin}%` : `+${row.impactOnMargin}%`}
                                                </span>
                                            </td>
                                            <td className="costing-impact-td costing-col-impact-vs">
                                                <span className="costing-impact-vs-text">
                                                    {row.vsLastMonth < 0
                                                        ? `${row.vsLastMonth}% ↓`
                                                        : `+${row.vsLastMonth}% ↑`}
                                                </span>
                                            </td>
                                            <td className="costing-impact-td costing-col-impact-items">
                                                <span className="costing-impact-items-text">{row.affectedItems}</span>
                                            </td>
                                            <td className="costing-impact-td costing-col-impact-primary">
                                                <span className="costing-impact-primary-text">{row.primaryImpact}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right Panel: Margin Insights (Frame 2147225074) */}
                <div className="costing-insights-card">
                    <span className="costing-insights-title">Margin Insights</span>

                    <div className="costing-insights-list">
                        {insights.length === 0 ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    color: "#64748B",
                                    padding: "36px 0",
                                    fontSize: "13px",
                                    fontFamily: "'Urbanist', sans-serif",
                                    width: "100%",
                                }}
                            >
                                No critical margin deviations detected.
                            </div>
                        ) : (
                            insights.map((ins, i) => (
                                <div key={ins.id || i} className="costing-insight-item">
                                    <div className="costing-insight-left">
                                        <span className="costing-insight-icon">
                                            {ins.icon === "info" && <AlertCircle size={18} color="#1C1B1F" />}
                                            {ins.icon === "trending" && <TrendingDown size={18} color="#DC2626" />}
                                            {ins.icon === "percent" && <Percent size={18} color="#1C1B1F" />}
                                            {ins.icon === "flag" && <Flag size={18} color="#1C1B1F" />}
                                        </span>
                                        <span className="costing-insight-text">{ins.text}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInsightAction(ins.actionType)}
                                        className="costing-insight-action-btn"
                                    >
                                        {ins.actionText}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 4. Detailed Low Margin Items Section (Requirement 8) */}
            {showDetailedLowMarginTable && (
                <div
                    className="costing-scenarios-card"
                    style={{ marginTop: "8px", position: "relative" }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                            flexWrap: "wrap",
                            gap: "12px",
                        }}
                    >
                        <div>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: "16px",
                                    fontWeight: 600,
                                    color: "#0F172A",
                                    fontFamily: "'Urbanist', sans-serif",
                                }}
                            >
                                Detailed Low Margin Items ({lowItems.length})
                            </h3>
                            <p
                                style={{
                                    margin: "2px 0 0 0",
                                    fontSize: "13px",
                                    color: "#64748B",
                                    fontFamily: "'Urbanist', sans-serif",
                                }}
                            >
                                Items falling below the {Math.round(targetMargin)}% profitability target threshold
                            </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input
                                placeholder="Search low margin items..."
                                value={lowMarginSearch}
                                onChange={(e) => setLowMarginSearch(e.target.value)}
                                className="costing-search-input"
                                style={{ width: "220px", height: "36px", fontSize: "13px" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowDetailedLowMarginTable(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#64748B",
                                    padding: "4px",
                                }}
                                title="Close table"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="costing-scenarios-table-wrapper" style={{ marginTop: "8px" }}>
                        <table className="costing-scenarios-table">
                            <thead>
                                <tr className="costing-scenarios-table-header">
                                    <th className="costing-scenarios-th" style={{ width: "240px" }}>ITEM NAME</th>
                                    <th className="costing-scenarios-th" style={{ width: "160px" }}>CATEGORY</th>
                                    <th className="costing-scenarios-th" style={{ width: "130px" }}>BASE COST</th>
                                    <th className="costing-scenarios-th" style={{ width: "130px" }}>SELLING RATE</th>
                                    <th className="costing-scenarios-th" style={{ width: "110px" }}>MARGIN</th>
                                    <th className="costing-scenarios-th" style={{ width: "100px" }}>SEVERITY</th>
                                    <th className="costing-scenarios-th" style={{ width: "80px" }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDetailedItems.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            style={{
                                                textAlign: "center",
                                                padding: "36px",
                                                color: "#64748B",
                                                fontFamily: "'Urbanist', sans-serif",
                                            }}
                                        >
                                            No low margin items match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDetailedItems.map((item) => (
                                        <tr key={item.id} className="costing-scenarios-row">
                                            <td className="costing-scenarios-td">
                                                <div className="costing-sc-name-title">{item.name}</div>
                                                <div className="costing-sc-name-desc">
                                                    {item.brand || item.code || "Standard"}
                                                </div>
                                            </td>
                                            <td className="costing-scenarios-td">
                                                <span className="costing-sc-value-text">
                                                    {item.categoryName || "General"}
                                                </span>
                                            </td>
                                            <td className="costing-scenarios-td">
                                                <span className="costing-sc-value-text">
                                                    {formatFullCurrency(item.baseCost ?? 0)}
                                                </span>
                                            </td>
                                            <td className="costing-scenarios-td">
                                                <span className="costing-sc-value-text">
                                                    {formatFullCurrency(item.sellingRate ?? 0)}
                                                </span>
                                            </td>
                                            <td className="costing-scenarios-td">
                                                <span
                                                    className={`costing-sc-variance-text ${
                                                        item.marginPercent < 10 ? "is-unfavorable" : "is-favorable"
                                                    }`}
                                                >
                                                    {item.marginPercent.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="costing-scenarios-td">
                                                <span
                                                    className={`costing-lowmargin-badge ${
                                                        item.severity === "CRITICAL" || item.marginPercent < 10
                                                            ? "is-critical"
                                                            : "is-active"
                                                    }`}
                                                >
                                                    {item.severity || "CRITICAL"}
                                                </span>
                                            </td>
                                            <td className="costing-scenarios-td">
                                                {onNavigateTab && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onNavigateTab("Library")}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "#2563EB",
                                                            cursor: "pointer",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                        }}
                                                    >
                                                        Edit <ExternalLink size={12} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
