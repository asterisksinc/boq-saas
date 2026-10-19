"use client";

import { useState, useEffect, useMemo } from "react";
import { getCostingAnalysis, addVendorQuote, selectVendorQuote } from "@/lib/api/costing";
import type { CostingAnalysisResponse } from "@/lib/types";
import {
    RefreshCw,
    Plus,
    Search,
    Check,
    Star,
    X,
    AlertCircle,
    CheckCircle2,
    Clock,
    Tag,
    ChevronDown,
} from "lucide-react";
import { formatMoney, formatFullCurrency } from "@/lib/costing-format";

export { formatMoney, formatFullCurrency };
export type SubTab = "Cost Overview" | "Vendor Comparison" | "Variance Analysis";

interface AnalysisTabProps {
    selectedProjectId?: string;
    onProjectChange?: (id: string) => void;
    selectedCategory?: string;
    onCategoryChange?: (cat: string) => void;
    onFilterOptionsLoaded?: (
        projects: Array<{ label: string; value: string }>,
        categories: Array<{ label: string; value: string }>
    ) => void;
}

export default function AnalysisTab({
    selectedProjectId,
    onProjectChange,
    selectedCategory,
    onCategoryChange,
    onFilterOptionsLoaded,
}: AnalysisTabProps = {}) {
    const [activeTab, setActiveTab] = useState<SubTab>("Cost Overview");
    const [data, setData] = useState<CostingAnalysisResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
    const [addQuoteInitialItemId, setAddQuoteInitialItemId] = useState<string | undefined>(undefined);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    const tabs: SubTab[] = ["Cost Overview", "Vendor Comparison", "Variance Analysis"];
    const effectiveProjectId = selectedProjectId && selectedProjectId !== "all" ? selectedProjectId : undefined;

    const loadData = async (projId?: string) => {
        setLoading(true);
        setError("");
        try {
            const res = await getCostingAnalysis(projId ? { projectId: projId } : undefined);
            setData(res);

            if (onFilterOptionsLoaded) {
                const projectOpts = (res.projectsList || []).map(p => ({
                    label: p.name,
                    value: p.id,
                }));
                const categoryOpts = (res.varianceByCategory || []).map(c => ({
                    label: c.category,
                    value: c.category,
                }));
                onFilterOptionsLoaded(projectOpts, categoryOpts);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load analysis");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData(effectiveProjectId);
    }, [effectiveProjectId]);

    if (loading) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
                {/* 5 KPI Skeletons */}
                <div className="costing-kpi-grid">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="costing-kpi-card" style={{ opacity: 0.6 }}>
                            <div className="costing-kpi-text-group">
                                <div style={{ width: "80px", height: "14px", background: "#E2E8F0", borderRadius: "4px" }} />
                                <div style={{ width: "100px", height: "24px", background: "#CBD5E1", borderRadius: "4px" }} />
                            </div>
                            <div className="costing-kpi-track">
                                <div className="costing-kpi-fill" style={{ width: "50%", background: "#CBD5E1" }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Subnav Skeleton */}
                <div className="costing-analysis-subnav" style={{ opacity: 0.6 }}>
                    <div style={{ width: "120px", height: "16px", background: "#E2E8F0", borderRadius: "4px", margin: "6px 16px" }} />
                    <div style={{ width: "140px", height: "16px", background: "#E2E8F0", borderRadius: "4px", margin: "6px 16px" }} />
                    <div style={{ width: "140px", height: "16px", background: "#E2E8F0", borderRadius: "4px", margin: "6px 16px" }} />
                </div>

                {/* Content Grid Skeleton */}
                <div className="costing-overview-grid" style={{ opacity: 0.6 }}>
                    <div className="costing-overview-chart-card" style={{ minHeight: "333px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <RefreshCw size={24} className="animate-spin" style={{ color: "#2563EB" }} />
                    </div>
                    <div className="costing-overview-utilization-card" style={{ minHeight: "333px" }} />
                </div>

                {/* Markup Skeleton */}
                <div className="costing-overview-markup-card" style={{ minHeight: "188px", opacity: 0.6 }} />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ padding: "16px 20px", background: "#fef2f2", color: "#b91c1c", borderRadius: "10px", border: "1px solid #fecaca", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <AlertCircle size={20} />
                    <span>{error || "Unable to load costing analysis data."}</span>
                </div>
                <button
                    onClick={() => loadData(effectiveProjectId)}
                    style={{ background: "#fff", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "6px", padding: "6px 14px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                >
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );
    }

    const { summary } = data;
    const budget = summary.totalBudget;
    const actualCostProgress = budget > 0 ? Math.min(100, Math.round((summary.actualCost / budget) * 100)) : (summary.actualCost > 0 ? 100 : 0);
    const committedProgress = budget > 0 ? Math.min(100, Math.round((summary.committed / budget) * 100)) : (summary.committed > 0 ? 100 : 0);
    const forecastProgress = budget > 0 ? Math.min(100, Math.round((summary.forecast / budget) * 100)) : (summary.forecast > 0 ? 100 : 0);
    const varianceProgress = budget > 0 ? Math.min(100, Math.round((Math.abs(summary.variance) / budget) * 100)) : 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
            {/* Top 5 KPI Cards (Frame 2147225138) */}
            <div className="costing-kpi-grid">
                <MetricCard
                    title="Total Budget"
                    amount={formatMoney(summary.totalBudget)}
                    progress={summary.totalBudget > 0 ? 100 : 0}
                    progressColor="#2563EB"
                />
                <MetricCard
                    title="Actual Cost"
                    amount={formatMoney(summary.actualCost)}
                    progress={actualCostProgress}
                    progressColor="#2563EB"
                />
                <MetricCard
                    title="Committed"
                    amount={formatMoney(summary.committed)}
                    progress={committedProgress}
                    progressColor="#2563EB"
                />
                <MetricCard
                    title="Forecast"
                    amount={formatMoney(summary.forecast)}
                    progress={forecastProgress}
                    progressColor="#2563EB"
                />
                <MetricCard
                    title="Variance"
                    amount={summary.variance < 0 ? `-${formatMoney(Math.abs(summary.variance))}` : formatMoney(summary.variance)}
                    progress={varianceProgress}
                    progressColor="#2563EB"
                />
            </div>

            {/* Analysis Sub-Navigation Tabs (Frame 2147224980) */}
            <div className="costing-analysis-subnav" role="tablist">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        role="tab"
                        aria-selected={activeTab === tab}
                        onClick={() => setActiveTab(tab)}
                        className={`costing-analysis-tab-btn ${activeTab === tab ? "is-active" : ""}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div>
                {activeTab === "Cost Overview" && (
                    <CostOverview
                        data={data}
                        formatMoney={formatMoney}
                        selectedCategory={selectedCategory}
                        hoveredCategory={hoveredCategory}
                        setHoveredCategory={setHoveredCategory}
                    />
                )}
                {activeTab === "Vendor Comparison" && (
                    <VendorComparison
                        data={data}
                        formatMoney={formatMoney}
                        onRefresh={() => loadData(effectiveProjectId)}
                        onOpenAddModal={(itemId?: string) => {
                            setAddQuoteInitialItemId(itemId);
                            setIsAddQuoteOpen(true);
                        }}
                    />
                )}
                {activeTab === "Variance Analysis" && <VarianceAnalysis data={data} formatMoney={formatMoney} />}
            </div>

            {/* Add Vendor Quote Modal */}
            {isAddQuoteOpen && (
                <AddVendorQuoteModal
                    items={data.items}
                    initialItemId={addQuoteInitialItemId}
                    onClose={() => {
                        setIsAddQuoteOpen(false);
                        setAddQuoteInitialItemId(undefined);
                    }}
                    onSuccess={() => {
                        setIsAddQuoteOpen(false);
                        setAddQuoteInitialItemId(undefined);
                        void loadData(effectiveProjectId);
                    }}
                />
            )}
        </div>
    );
}

function MetricCard({
    title,
    amount,
    progress,
    progressColor = "#2563EB",
}: {
    title: string;
    amount: string;
    progress: number;
    progressColor?: string;
}) {
    return (
        <div className="costing-kpi-card">
            <div className="costing-kpi-text-group">
                <span className="costing-kpi-title">{title}</span>
                <span className="costing-kpi-value">{amount}</span>
            </div>
            <div className="costing-kpi-track">
                <div
                    className="costing-kpi-fill"
                    style={{
                        width: `${Math.min(100, Math.max(0, progress))}%`,
                        background: progressColor,
                    }}
                />
            </div>
        </div>
    );
}

// ── Sub-Tab 1: Cost Overview (Figma Frame 2147224997 & Frame 2147225000) ─────────

function CostOverview({
    data,
    formatMoney,
    selectedCategory,
    hoveredCategory,
    setHoveredCategory,
}: {
    data: CostingAnalysisResponse;
    formatMoney: (val: number, isTick?: boolean) => string;
    selectedCategory?: string;
    hoveredCategory: string | null;
    setHoveredCategory: (cat: string | null) => void;
}) {
    const rawCategories = data.varianceByCategory || [];
    const categories = useMemo(() => {
        if (!selectedCategory || selectedCategory === "all") return rawCategories;
        return rawCategories.filter(c => c.category.toLowerCase() === selectedCategory.toLowerCase());
    }, [rawCategories, selectedCategory]);

    // Calculate max value for scaling the chart
    const maxVal = useMemo(() => {
        if (!categories.length) return 100000;
        const maxCat = Math.max(...categories.map(c => Math.max(c.budget || 0, c.actual || 0)));
        return Math.max(maxCat * 1.15, 50000);
    }, [categories]);

    const yAxisTicks = useMemo(() => {
        return [
            { label: formatMoney(maxVal, true), val: maxVal },
            { label: formatMoney(maxVal * 0.75, true), val: maxVal * 0.75 },
            { label: formatMoney(maxVal * 0.5, true), val: maxVal * 0.5 },
            { label: formatMoney(maxVal * 0.25, true), val: maxVal * 0.25 },
            { label: formatMoney(0, true), val: 0 },
        ];
    }, [maxVal, formatMoney]);

    const costOverview = data.costOverview ?? {
        baseCost: data.summary.actualCost > 0 ? Math.round(data.summary.actualCost * 0.82) : 0,
        markupAmount: Math.max(0, data.summary.totalBudget - data.summary.actualCost),
        markupPercent: 18,
        taxAmount: Math.round(data.summary.totalBudget * 0.18),
        taxPercent: 18,
        clientPrice: data.summary.totalBudget > 0 ? Math.round(data.summary.totalBudget * 1.18) : 0
    };

    const hasData = categories.length > 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
            {/* 2-Column Grid (Frame 2147224997): Budget vs Actual Chart (Left) & Budget Utilization (Right) */}
            <div className="costing-overview-grid">
                {/* Left Panel: Budget vs Actual by Category Chart (Frame 93) */}
                <div className="costing-overview-chart-card">
                    {/* Header Row (Frame 2147225140) */}
                    <div className="costing-overview-chart-header">
                        <div className="costing-overview-chart-titles">
                            <h3 className="costing-overview-chart-title">Budget vs Actual by Category</h3>
                            <p className="costing-overview-chart-subtitle">
                                {data.projectName || "All Projects"} | {selectedCategory && selectedCategory !== "all" ? selectedCategory : "All categories"}
                            </p>
                        </div>
                        {/* Legend (Frame 2147224996) */}
                        <div className="costing-overview-chart-legend">
                            <div className="costing-legend-item is-budget">
                                <span className="costing-legend-line is-budget" />
                                <span>Budget</span>
                            </div>
                            <div className="costing-legend-item is-actual">
                                <span className="costing-legend-line is-actual" />
                                <span>Actual</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Canvas Area (Frame 2147224994) */}
                    <div className="costing-chart-container">
                        {/* 5 Dashed Gridlines with Y-Axis Ticks */}
                        <div className="costing-chart-gridlines">
                            {yAxisTicks.map((tick, i) => (
                                <div key={i} className="costing-gridline-row">
                                    <span className="costing-gridline-label">{tick.label}</span>
                                    <div className="costing-gridline-dash" />
                                </div>
                            ))}
                        </div>

                        {!hasData ? (
                            <div style={{ position: "absolute", inset: "0 0 24px 60px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: "13px" }}>
                                No costing records available yet.
                            </div>
                        ) : (
                            <>
                                {/* Category Grouped Bars (Rectangle 57 & Rectangle 58) */}
                                <div className="costing-chart-bars-wrap">
                                    {categories.slice(0, 8).map((cat) => {
                                        const bHeight = Math.min(100, Math.max(2, Math.round(((cat.budget || 0) / maxVal) * 100)));
                                        const aHeight = Math.min(100, Math.max(2, Math.round(((cat.actual || 0) / maxVal) * 100)));
                                        const isHovered = hoveredCategory === cat.id;

                                        return (
                                            <div
                                                key={cat.id}
                                                className="costing-category-bar-group"
                                                onMouseEnter={() => setHoveredCategory(cat.id)}
                                                onMouseLeave={() => setHoveredCategory(null)}
                                            >
                                                {/* Budget Bar (Rectangle 57) */}
                                                <div
                                                    className="costing-bar is-budget"
                                                    style={{ height: `${bHeight}%` }}
                                                    title={`Budget: ${formatMoney(cat.budget)}`}
                                                />
                                                {/* Actual Bar (Rectangle 58) */}
                                                <div
                                                    className="costing-bar is-actual"
                                                    style={{ height: `${aHeight}%` }}
                                                    title={`Actual: ${formatMoney(cat.actual)}`}
                                                />

                                                {/* Interactive Tooltip */}
                                                {isHovered && (
                                                    <div className="costing-chart-tooltip">
                                                        <div style={{ fontWeight: 600, marginBottom: "2px" }}>{cat.category}</div>
                                                        <div>Budget: {formatMoney(cat.budget)}</div>
                                                        <div>Actual: {formatMoney(cat.actual)}</div>
                                                        <div>Variance: {formatMoney(cat.variance)}</div>
                                                        <div>Utilization: {cat.utilization}%</div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Category Labels Below (Frame 2147224993) */}
                                <div className="costing-chart-categories-row">
                                    {categories.slice(0, 8).map((cat) => (
                                        <div key={cat.id} className="costing-chart-cat-label" title={cat.category}>
                                            {cat.category}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Panel: Budget Utilization (Frame 2147225000) */}
                <div className="costing-overview-utilization-card">
                    <h3 className="costing-utilization-title">Budget Utilization</h3>

                    {!hasData ? (
                        <div style={{ color: "#64748B", fontSize: "13px", padding: "16px 0" }}>
                            No category budget data available.
                        </div>
                    ) : (
                        <div className="costing-utilization-list">
                            {categories.map((cat) => {
                                const clampedPct = Math.min(100, Math.max(0, cat.utilization || 0));
                                return (
                                    <div key={cat.id} className="costing-utilization-item">
                                        <div className="costing-utilization-header">
                                            <span className="costing-utilization-name" title={cat.category}>
                                                {cat.category}
                                            </span>
                                            <span className="costing-utilization-pct">
                                                {cat.utilization}%
                                            </span>
                                        </div>
                                        <div className="costing-utilization-track">
                                            <div
                                                className="costing-utilization-fill"
                                                style={{ width: `${clampedPct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Card: Markup & Tax (Frame 2147225000) */}
            <div className="costing-overview-markup-card">
                <h3 className="costing-markup-title">Markup & Tax</h3>
                <div className="costing-markup-stack">
                    {/* Base Cost */}
                    <div className="costing-markup-row">
                        <span className="costing-markup-label">Base Cost</span>
                        <span className="costing-markup-val">{formatMoney(costOverview.baseCost)}</span>
                    </div>

                    {/* Markup */}
                    <div className="costing-markup-row">
                        <span className="costing-markup-label">Markup ({costOverview.markupPercent}%)</span>
                        <span className="costing-markup-val">{formatMoney(costOverview.markupAmount)}</span>
                    </div>

                    {/* GST */}
                    <div className="costing-markup-row">
                        <span className="costing-markup-label">GST ({costOverview.taxPercent}%)</span>
                        <span className="costing-markup-val">{formatMoney(costOverview.taxAmount)}</span>
                    </div>

                    {/* Divider (Rectangle 77) */}
                    <hr className="costing-markup-divider" />

                    {/* Total Client Price */}
                    <div className="costing-markup-total-row">
                        <span className="costing-markup-total-label">Client Price</span>
                        <span className="costing-markup-total-val">{formatMoney(costOverview.clientPrice)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Sub-Tab 2: Vendor Comparison ───────────────────────────────────────────────

function VendorComparison({
    data,
    formatMoney,
    onRefresh,
    onOpenAddModal
}: {
    data: CostingAnalysisResponse;
    formatMoney: (val: number) => string;
    onRefresh: () => void;
    onOpenAddModal: (itemId?: string) => void;
}) {
    const quotes = data.vendorQuotes;
    const items = data.items;

    // Pick first item that has quotes, or first item, or "all"
    const firstItemWithQuotes = useMemo(() => {
        const itemWithQuote = items.find(i => quotes.some(q => q.item_id === i.id));
        return itemWithQuote ? itemWithQuote.id : (items[0]?.id || "all");
    }, [items, quotes]);

    const [selectedItemId, setSelectedItemId] = useState<string>(firstItemWithQuotes);
    const [selectingId, setSelectingId] = useState<string | null>(null);

    // Keep selectedItemId valid if items change
    useEffect(() => {
        if (selectedItemId !== "all" && !items.some(i => i.id === selectedItemId)) {
            setSelectedItemId(firstItemWithQuotes);
        }
    }, [items, selectedItemId, firstItemWithQuotes]);

    const selectedItem = useMemo(() => {
        if (selectedItemId === "all") return null;
        return items.find(i => i.id === selectedItemId) || null;
    }, [items, selectedItemId]);

    const displayQuotes = useMemo(() => {
        if (selectedItemId === "all") {
            return quotes;
        }
        return quotes.filter(q => q.item_id === selectedItemId);
    }, [quotes, selectedItemId]);

    const handleSelectQuote = async (quoteId: string, select: boolean = true) => {
        if (quoteId.startsWith("pref-")) {
            return;
        }
        setSelectingId(quoteId);
        try {
            await selectVendorQuote(quoteId, select);
            onRefresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update vendor selection");
        } finally {
            setSelectingId(null);
        }
    };

    const subtitleText = selectedItem
        ? selectedItem.name
        : (quotes.length > 0 ? `All Items (${quotes.length} quotes)` : "No items selected");

    return (
        <div className="costing-vendor-card">
            {/* Header Frame 2147225151 */}
            <div className="costing-vendor-header">
                {/* Left Frame 2147224969 */}
                <div className="costing-vendor-header-left">
                    <h3 className="costing-vendor-header-title">Items</h3>
                    <p className="costing-vendor-header-subtitle">{subtitleText}</p>
                </div>

                {/* Right Frame 2147225103 */}
                <div className="costing-vendor-header-right">
                    <div className="costing-vendor-item-select-wrap">
                        <select
                            className="costing-vendor-item-select"
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(e.target.value)}
                            aria-label="Select BOQ item"
                        >
                            {items.length > 1 && (
                                <option value="all">All Items ({quotes.length})</option>
                            )}
                            {items.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={18} className="costing-vendor-item-select-icon" />
                    </div>

                    <button
                        type="button"
                        className="costing-vendor-add-btn"
                        onClick={() => onOpenAddModal(selectedItemId !== "all" ? selectedItemId : undefined)}
                    >
                        <Plus size={16} /> Add Quote
                    </button>
                </div>
            </div>

            {/* Table Area (Device Management_iOS / Frame 61) */}
            <div className="costing-vendor-table-wrapper">
                <div className="costing-vendor-table-scroll">
                    {/* Table Header Frame 57 */}
                    <div className="costing-vendor-table-header">
                        <div className="costing-vendor-th costing-col-check" aria-hidden="true"></div>
                        <div className="costing-vendor-th costing-col-vendor">VENDOR</div>
                        <div className="costing-vendor-th costing-col-quote">QUOTE</div>
                        <div className="costing-vendor-th costing-col-lead">LEAD TIME</div>
                        <div className="costing-vendor-th costing-col-rating">RATING</div>
                        <div className="costing-vendor-th costing-col-status">STATUS</div>
                        <div className="costing-vendor-th costing-col-action">ACTION</div>
                    </div>

                    {/* Rows */}
                    {displayQuotes.length === 0 ? (
                        <div className="costing-vendor-empty-card">
                            <Tag size={36} style={{ color: "#94A3B8" }} />
                            <h4 className="costing-vendor-empty-title">
                                {selectedItem ? `No quotes for ${selectedItem.name}` : "No vendor quotes found"}
                            </h4>
                            <p className="costing-vendor-empty-desc">
                                Add vendor quotations to compare rates, lead times, and track committed costs.
                            </p>
                            <button
                                type="button"
                                className="costing-new-item-btn"
                                onClick={() => onOpenAddModal(selectedItemId !== "all" ? selectedItemId : undefined)}
                            >
                                <Plus size={16} /> Add First Quote
                            </button>
                        </div>
                    ) : (
                        displayQuotes.map((q, idx) => {
                            const isSelecting = selectingId === q.id;
                            const ratingVal = typeof q.rating === "number" && !isNaN(q.rating) ? q.rating.toFixed(1) : "—";
                            const leadText = q.lead_time_days ? `${q.lead_time_days} days` : "—";

                            return (
                                <div key={q.id || idx}>
                                    <div className={`costing-vendor-row ${q.selected ? "is-selected" : ""}`}>
                                        {/* Col 1: Checkbox */}
                                        <div className="costing-vendor-td costing-col-check">
                                            <button
                                                type="button"
                                                role="checkbox"
                                                aria-checked={q.selected}
                                                aria-label={`Select ${q.vendor_name}`}
                                                className={`costing-vendor-checkbox-btn ${q.selected ? "is-checked" : ""}`}
                                                onClick={() => handleSelectQuote(q.id, !q.selected)}
                                                disabled={isSelecting}
                                            >
                                                {q.selected && <Check size={14} strokeWidth={3} />}
                                            </button>
                                        </div>

                                        {/* Col 2: Vendor */}
                                        <div className="costing-vendor-td costing-col-vendor">
                                            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                                <span className="costing-vendor-name" title={q.vendor_name}>
                                                    {q.vendor_name}
                                                </span>
                                                {selectedItemId === "all" && q.itemName && (
                                                    <span className="costing-vendor-item-hint">
                                                        {q.itemName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Col 3: Quote */}
                                        <div className="costing-vendor-td costing-col-quote">
                                            <span className="costing-vendor-quote">{formatFullCurrency(q.quote)}</span>
                                        </div>

                                        {/* Col 4: Lead Time */}
                                        <div className="costing-vendor-td costing-col-lead">
                                            <span className="costing-vendor-lead-time">{leadText}</span>
                                        </div>

                                        {/* Col 5: Rating */}
                                        <div className="costing-vendor-td costing-col-rating">
                                            <div className="costing-vendor-rating">
                                                <Star className="costing-vendor-star-icon" size={16} />
                                                <span>{ratingVal}</span>
                                            </div>
                                        </div>

                                        {/* Col 6: Status */}
                                        <div className="costing-vendor-td costing-col-status">
                                            <span className={`costing-vendor-status-badge ${q.selected ? "is-selected" : "is-quoted"}`}>
                                                {q.selected ? "SELECTED" : "QUOTED"}
                                            </span>
                                        </div>

                                        {/* Col 7: Action */}
                                        <div className="costing-vendor-td costing-col-action">
                                            {q.selected ? (
                                                <div className="costing-selected-action-pill">
                                                    <Check size={14} strokeWidth={2.5} /> Active
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="costing-select-vendor-btn"
                                                    disabled={isSelecting}
                                                    onClick={() => handleSelectQuote(q.id, true)}
                                                >
                                                    {isSelecting ? "..." : "Select"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {idx < displayQuotes.length - 1 && (
                                        <div className="costing-vendor-row-divider" />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Sub-Tab 3: Variance Analysis ───────────────────────────────────────────────

function VarianceAnalysis({ data, formatMoney }: { data: CostingAnalysisResponse; formatMoney: (val: number) => string }) {
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [search, setSearch] = useState("");

    const rows = data.varianceByCategory;

    const filteredRows = useMemo(() => {
        return rows.filter(r => {
            const matchesSearch = !search || r.category.toLowerCase().includes(search.toLowerCase()) || (r.code && r.code.toLowerCase().includes(search.toLowerCase()));
            const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [rows, search, statusFilter]);

    const totalBudget = filteredRows.reduce((s, r) => s + r.budget, 0);
    const totalActual = filteredRows.reduce((s, r) => s + r.actual, 0);
    const totalCommitted = filteredRows.reduce((s, r) => s + r.committed, 0);
    const totalForecast = filteredRows.reduce((s, r) => s + r.forecast, 0);
    const totalVariance = totalBudget - totalForecast;

    return (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            {/* Header with Project Title & Filters */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1f2d3d" }}>
                        Cost Variance Analysis <span style={{ fontWeight: 400, color: "#6b7280" }}>{data.projectName || "All Projects"}</span>
                    </h3>
                    <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                        Tracking live budget allocation against actual and committed contractor spend
                    </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "0 10px", width: "180px" }}>
                        <Search size={14} color="#6b7280" />
                        <input
                            placeholder="Filter category..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ border: "none", outline: "none", padding: "6px 8px", fontSize: "12px", width: "100%", background: "transparent" }}
                        />
                    </label>

                    {/* Status Pill Filters */}
                    <div style={{ display: "flex", gap: "6px", background: "#f3f4f6", padding: "3px", borderRadius: "8px" }}>
                        {["ALL", "ON TRACK", "AT RISK", "OVER BUDGET"].map(st => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                style={{
                                    border: "none",
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    background: statusFilter === st ? "#fff" : "transparent",
                                    color: statusFilter === st ? "#1f2d3d" : "#6b7280",
                                    boxShadow: statusFilter === st ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                                    transition: "all 0.15s"
                                }}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ background: "#f9fafb", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>
                            <th style={{ padding: "14px 18px", fontWeight: 600 }}>CATEGORY</th>
                            <th style={{ padding: "14px 18px", fontWeight: 600 }}>BUDGET</th>
                            <th style={{ padding: "14px 18px", fontWeight: 600 }}>ACTUAL</th>
                            <th style={{ padding: "14px 18px", fontWeight: 600 }}>COMMITTED</th>
                            <th style={{ padding: "14px 18px", fontWeight: 600 }}>FORECAST</th>
                            <th style={{ padding: "14px 18px", fontWeight: 600 }}>VARIANCE</th>
                            <th style={{ padding: "14px 18px", fontWeight: 600 }}>UTILIZATION</th>
                            <th style={{ padding: "14px 18px", fontWeight: 600 }}>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: "center", padding: "36px", color: "#6b7280" }}>
                                    No variance rows matching criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((row, i) => {
                                const isPositive = row.variance >= 0;
                                return (
                                    <tr
                                        key={row.id || i}
                                        style={{
                                            borderBottom: "1px solid #f3f4f6",
                                            transition: "background 0.15s"
                                        }}
                                    >
                                        {/* Category */}
                                        <td style={{ padding: "14px 18px" }}>
                                            <div style={{ fontWeight: 600, color: "#111827" }}>{row.category}</div>
                                            {row.code && (
                                                <div style={{ fontSize: "11px", color: "#6b7280", fontFamily: "monospace", marginTop: "2px" }}>
                                                    {row.code}
                                                </div>
                                            )}
                                        </td>

                                        {/* Budget */}
                                        <td style={{ padding: "14px 18px", color: "#374151", fontWeight: 500 }}>
                                            {formatMoney(row.budget)}
                                        </td>

                                        {/* Actual */}
                                        <td style={{ padding: "14px 18px", color: "#374151" }}>
                                            {formatMoney(row.actual)}
                                        </td>

                                        {/* Committed */}
                                        <td style={{ padding: "14px 18px", color: "#374151" }}>
                                            {formatMoney(row.committed)}
                                        </td>

                                        {/* Forecast */}
                                        <td style={{ padding: "14px 18px", color: "#374151" }}>
                                            {formatMoney(row.forecast)}
                                        </td>

                                        {/* Variance */}
                                        <td style={{ padding: "14px 18px" }}>
                                            <span style={{ fontWeight: 600, color: isPositive ? "#059669" : "#dc2626" }}>
                                                {isPositive ? `+${formatMoney(row.variance)}` : formatMoney(row.variance)}
                                            </span>
                                        </td>

                                        {/* Utilization */}
                                        <td style={{ padding: "14px 18px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "90px" }}>
                                                <div style={{ flex: 1, height: "5px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
                                                    <div
                                                        style={{
                                                            width: `${Math.min(100, Math.max(0, row.utilization))}%`,
                                                            height: "100%",
                                                            background: row.status === "OVER BUDGET" ? "#ef4444" : row.status === "AT RISK" ? "#f59e0b" : "#2563eb"
                                                        }}
                                                    />
                                                </div>
                                                <span style={{ fontSize: "11px", color: "#6b7280", width: "32px", textAlign: "right", fontWeight: 600 }}>
                                                    {row.utilization}%
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: "14px 18px" }}>
                                            <span
                                                style={{
                                                    background:
                                                        row.status === "ON TRACK"
                                                            ? "#ecfdf5"
                                                            : row.status === "AT RISK"
                                                            ? "#fffbeb"
                                                            : "#fef2f2",
                                                    color:
                                                        row.status === "ON TRACK"
                                                            ? "#059669"
                                                            : row.status === "AT RISK"
                                                            ? "#d97706"
                                                            : "#dc2626",
                                                    border: `1px solid ${
                                                        row.status === "ON TRACK"
                                                            ? "#a7f3d0"
                                                            : row.status === "AT RISK"
                                                            ? "#fde68a"
                                                            : "#fecaca"
                                                    }`,
                                                    padding: "3px 8px",
                                                    borderRadius: "12px",
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    display: "inline-block"
                                                }}
                                            >
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>

                    {/* Totals Footer Row */}
                    {filteredRows.length > 0 && (
                        <tfoot>
                            <tr style={{ background: "#f9fafb", borderTop: "2px solid #e5e7eb", fontWeight: 700, color: "#111827" }}>
                                <td style={{ padding: "14px 18px" }}>
                                    Total ({filteredRows.length} Categories)
                                </td>
                                <td style={{ padding: "14px 18px" }}>{formatMoney(totalBudget)}</td>
                                <td style={{ padding: "14px 18px" }}>{formatMoney(totalActual)}</td>
                                <td style={{ padding: "14px 18px" }}>{formatMoney(totalCommitted)}</td>
                                <td style={{ padding: "14px 18px" }}>{formatMoney(totalForecast)}</td>
                                <td style={{ padding: "14px 18px", color: totalVariance >= 0 ? "#059669" : "#dc2626" }}>
                                    {totalVariance >= 0 ? `+${formatMoney(totalVariance)}` : formatMoney(totalVariance)}
                                </td>
                                <td style={{ padding: "14px 18px" }}>
                                    {totalBudget > 0 ? `${Math.round((totalActual / totalBudget) * 100)}%` : "—"}
                                </td>
                                <td style={{ padding: "14px 18px" }}>
                                    <span
                                        style={{
                                            background: totalVariance >= 0 ? "#ecfdf5" : "#fef2f2",
                                            color: totalVariance >= 0 ? "#059669" : "#dc2626",
                                            padding: "3px 8px",
                                            borderRadius: "12px",
                                            fontSize: "11px",
                                            fontWeight: 700
                                        }}
                                    >
                                        {totalVariance >= 0 ? "ON TRACK" : "OVER BUDGET"}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}

// ── Add Vendor Quote Modal ─────────────────────────────────────────────────────

function AddVendorQuoteModal({
    items,
    initialItemId,
    onClose,
    onSuccess
}: {
    items: CostingAnalysisResponse["items"];
    initialItemId?: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [selectedItemId, setSelectedItemId] = useState(
        (initialItemId && items.some(i => i.id === initialItemId)) ? initialItemId : (items[0]?.id || "")
    );
    const [vendorName, setVendorName] = useState("");
    const [quotePrice, setQuotePrice] = useState("");
    const [leadTimeDays, setLeadTimeDays] = useState("7");
    const [rating, setRating] = useState("4.5");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemId) {
            setError("Please select an item");
            return;
        }
        if (!vendorName.trim()) {
            setError("Vendor name is required");
            return;
        }
        const quoteNum = parseFloat(quotePrice);
        if (isNaN(quoteNum) || quoteNum < 0) {
            setError("Please enter a valid quoted price");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            await addVendorQuote({
                itemId: selectedItemId,
                vendorName: vendorName.trim(),
                quote: quoteNum,
                leadTimeDays: parseInt(leadTimeDays, 10) || 7,
                rating: parseFloat(rating) || 4.5
            });
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add vendor quote");
            setSubmitting(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.5)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "20px"
            }}
        >
            <div
                style={{
                    background: "#fff",
                    borderRadius: "16px",
                    width: "100%",
                    maxWidth: "500px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    overflow: "hidden"
                }}
            >
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 600, color: "#111827" }}>Add Vendor Quotation</h3>
                        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#6b7280" }}>Compare alternative vendor rates and lead times</p>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "4px" }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {error && (
                        <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", border: "1px solid #fecaca" }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                            Select Costing Item *
                        </label>
                        <select
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", color: "#111827", outline: "none" }}
                            required
                        >
                            {items.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.code || "No Code"}) — Base: ₹{item.baseCost || item.base_cost}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                            Vendor Name *
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Royal Woods Ltd, Precision Steel"
                            value={vendorName}
                            onChange={(e) => setVendorName(e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", color: "#111827", outline: "none", boxSizing: "border-box" }}
                            required
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                                Quoted Price (₹) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="e.g. 14500"
                                value={quotePrice}
                                onChange={(e) => setQuotePrice(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", color: "#111827", outline: "none", boxSizing: "border-box" }}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                                Lead Time (Days)
                            </label>
                            <input
                                type="number"
                                placeholder="e.g. 7"
                                value={leadTimeDays}
                                onChange={(e) => setLeadTimeDays(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", color: "#111827", outline: "none", boxSizing: "border-box" }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                            Vendor Rating (1.0 to 5.0)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            placeholder="e.g. 4.5"
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", color: "#111827", outline: "none", boxSizing: "border-box" }}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px", paddingTop: "16px", borderTop: "1px solid #f3f4f6" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ background: "#fff", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", color: "#4b5563", cursor: "pointer", fontWeight: 500 }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{ background: "#2563eb", border: "none", padding: "8px 20px", borderRadius: "8px", fontSize: "13px", color: "#fff", cursor: "pointer", fontWeight: 500 }}
                        >
                            {submitting ? "Saving..." : "Save Quote"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
