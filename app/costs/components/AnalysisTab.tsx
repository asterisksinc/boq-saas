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
} from "lucide-react";

type SubTab = "Cost Overview" | "Vendor Comparison" | "Variance Analysis";

export default function AnalysisTab() {
    const [activeTab, setActiveTab] = useState<SubTab>("Cost Overview");
    const [data, setData] = useState<CostingAnalysisResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);

    const tabs: SubTab[] = ["Cost Overview", "Vendor Comparison", "Variance Analysis"];

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getCostingAnalysis();
            setData(res);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load analysis");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const formatMoney = (val: number) => {
        if (val === undefined || val === null || isNaN(val)) return "₹0";
        const sign = val < 0 ? "-" : "";
        const abs = Math.abs(val);
        if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
        if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
        if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
        return `${sign}₹${abs.toLocaleString("en-IN")}`;
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "64px", color: "#6b7280", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px auto", color: "#2563eb" }} />
                <div style={{ fontWeight: 500, color: "#1f2d3d" }}>Loading Costing Analysis...</div>
                <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>Aggregating project budgets, actual costs, and vendor comparisons</div>
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
                    onClick={loadData}
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
    const varianceProgress = budget > 0 ? Math.min(100, Math.abs(Math.round((summary.variance / budget) * 100))) : 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Top Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <MetricCard
                    title="Total Budget"
                    amount={formatMoney(summary.totalBudget)}
                    progress={100}
                    subtitle={data.projectName ? `${data.projectName}` : "All active projects"}
                    progressColor="#2563eb"
                />
                <MetricCard
                    title="Actual Cost"
                    amount={formatMoney(summary.actualCost)}
                    progress={actualCostProgress}
                    subtitle={`${actualCostProgress}% of budget spent`}
                    progressColor={actualCostProgress > 100 ? "#ef4444" : actualCostProgress > 80 ? "#f59e0b" : "#2563eb"}
                />
                <MetricCard
                    title="Committed"
                    amount={formatMoney(summary.committed)}
                    progress={committedProgress}
                    subtitle={`${committedProgress}% vendor quotes committed`}
                    progressColor="#6366f1"
                />
                <MetricCard
                    title="Forecast"
                    amount={formatMoney(summary.forecast)}
                    progress={forecastProgress}
                    subtitle={`${forecastProgress}% projected completion`}
                    progressColor="#0284c7"
                />
                <MetricCard
                    title="Variance"
                    amount={formatMoney(summary.variance)}
                    progress={varianceProgress}
                    subtitle={summary.variance >= 0 ? "Under budget surplus" : "Over budget deficit"}
                    progressColor={summary.variance >= 0 ? "#10b981" : "#ef4444"}
                    isPositive={summary.variance >= 0}
                />
            </div>

            {/* Sub Tabs */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", gap: "28px" }}>
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: "12px 0",
                                background: "none",
                                border: "none",
                                borderBottom: activeTab === tab ? "2px solid #2563eb" : "2px solid transparent",
                                color: activeTab === tab ? "#2563eb" : "#6b7280",
                                fontWeight: activeTab === tab ? 600 : 500,
                                cursor: "pointer",
                                fontSize: "14px",
                                transition: "all 0.15s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            {tab}
                            {tab === "Vendor Comparison" && data.vendorQuotes.length > 0 && (
                                <span style={{ background: activeTab === tab ? "#eff6ff" : "#f3f4f6", color: activeTab === tab ? "#2563eb" : "#4b5563", padding: "1px 7px", borderRadius: "10px", fontSize: "12px", fontWeight: 600 }}>
                                    {data.vendorQuotes.length}
                                </span>
                            )}
                            {tab === "Variance Analysis" && data.varianceByCategory.length > 0 && (
                                <span style={{ background: activeTab === tab ? "#eff6ff" : "#f3f4f6", color: activeTab === tab ? "#2563eb" : "#4b5563", padding: "1px 7px", borderRadius: "10px", fontSize: "12px", fontWeight: 600 }}>
                                    {data.varianceByCategory.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                        onClick={loadData}
                        title="Refresh data"
                        style={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            color: "#4b5563",
                            fontSize: "13px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                    {activeTab === "Vendor Comparison" && (
                        <button
                            onClick={() => setIsAddQuoteOpen(true)}
                            style={{
                                background: "#2563eb",
                                border: "none",
                                padding: "6px 14px",
                                borderRadius: "6px",
                                color: "#fff",
                                fontSize: "13px",
                                fontWeight: 500,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            <Plus size={14} /> Add Vendor Quote
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div>
                {activeTab === "Cost Overview" && <CostOverview data={data} formatMoney={formatMoney} />}
                {activeTab === "Vendor Comparison" && (
                    <VendorComparison
                        data={data}
                        formatMoney={formatMoney}
                        onRefresh={loadData}
                        onOpenAddModal={() => setIsAddQuoteOpen(true)}
                    />
                )}
                {activeTab === "Variance Analysis" && <VarianceAnalysis data={data} formatMoney={formatMoney} />}
            </div>

            {/* Add Vendor Quote Modal */}
            {isAddQuoteOpen && (
                <AddVendorQuoteModal
                    items={data.items}
                    onClose={() => setIsAddQuoteOpen(false)}
                    onSuccess={() => {
                        setIsAddQuoteOpen(false);
                        void loadData();
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
    subtitle,
    progressColor = "#2563eb",
    isPositive
}: {
    title: string;
    amount: string;
    progress: number;
    subtitle?: string;
    progressColor?: string;
    isPositive?: boolean;
}) {
    return (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            <div>
                <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>{title}</div>
                <div style={{ fontSize: "26px", fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>{amount}</div>
            </div>
            <div style={{ marginTop: "16px" }}>
                <div style={{ height: "4px", background: "#f3f4f6", borderRadius: "2px", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, progress))}%`, height: "100%", background: progressColor, transition: "width 0.4s ease" }} />
                </div>
                {subtitle && (
                    <div style={{ fontSize: "12px", color: isPositive !== undefined ? (isPositive ? "#059669" : "#dc2626") : "#6b7280", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {subtitle}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Sub-Tab 1: Cost Overview ───────────────────────────────────────────────────

function CostOverview({ data, formatMoney }: { data: CostingAnalysisResponse; formatMoney: (val: number) => string }) {
    const categories = data.varianceByCategory;

    // Calculate max value for scaling the chart
    const maxVal = useMemo(() => {
        if (!categories.length) return 100000;
        const maxCat = Math.max(...categories.map(c => Math.max(c.budget, c.actual)));
        return Math.max(maxCat * 1.15, 50000);
    }, [categories]);

    const yAxisTicks = useMemo(() => {
        return [
            formatMoney(maxVal),
            formatMoney(maxVal * 0.75),
            formatMoney(maxVal * 0.5),
            formatMoney(maxVal * 0.25),
            "₹0",
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

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                {/* Budget vs Actual Chart */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1f2d3d" }}>Budget vs Actual by Category</h3>
                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                                {data.projectName || "All Projects"} | {categories.length} Categories
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "18px", fontSize: "12px", color: "#4b5563" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ width: "12px", height: "12px", background: "#cbd5e1", borderRadius: "2px" }} /> Budget
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ width: "12px", height: "12px", background: "#2563eb", borderRadius: "2px" }} /> Actual
                            </div>
                        </div>
                    </div>

                    {/* Chart Canvas */}
                    <div style={{ height: "260px", display: "flex", alignItems: "flex-end", gap: "24px", paddingLeft: "60px", paddingBottom: "28px", position: "relative" }}>
                        {/* Y-Axis labels */}
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: "28px", display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#9ca3af", fontSize: "11px", fontWeight: 500, width: "52px", textAlign: "right" }}>
                            {yAxisTicks.map((tick, i) => (
                                <span key={i}>{tick}</span>
                            ))}
                        </div>

                        {/* Grid lines */}
                        <div style={{ position: "absolute", left: "60px", right: 0, top: 0, bottom: "28px", display: "flex", flexDirection: "column", justifyContent: "space-between", zIndex: 0, pointerEvents: "none" }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{ borderBottom: "1px dashed #f1f5f9", width: "100%" }} />
                            ))}
                        </div>

                        {/* Dynamic Category Bars */}
                        {categories.slice(0, 7).map((cat) => {
                            const bHeight = Math.min(100, Math.max(4, Math.round((cat.budget / maxVal) * 100)));
                            const aHeight = Math.min(100, Math.max(4, Math.round((cat.actual / maxVal) * 100)));
                            return (
                                <div
                                    key={cat.id}
                                    title={`${cat.category}\nBudget: ${formatMoney(cat.budget)}\nActual: ${formatMoney(cat.actual)}\nVariance: ${formatMoney(cat.variance)}`}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        zIndex: 1,
                                        height: "100%",
                                        justifyContent: "flex-end",
                                        flex: 1,
                                        position: "relative",
                                        cursor: "pointer"
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "100%", width: "100%", justifyContent: "center" }}>
                                        {/* Budget bar */}
                                        <div
                                            style={{
                                                width: "36%",
                                                maxWidth: "24px",
                                                height: `${bHeight}%`,
                                                background: "#cbd5e1",
                                                borderRadius: "4px 4px 0 0",
                                                transition: "height 0.4s ease"
                                            }}
                                        />
                                        {/* Actual bar */}
                                        <div
                                            style={{
                                                width: "36%",
                                                maxWidth: "24px",
                                                height: `${aHeight}%`,
                                                background: cat.actual > cat.budget && cat.budget > 0 ? "#ef4444" : "#2563eb",
                                                borderRadius: "4px 4px 0 0",
                                                transition: "height 0.4s ease"
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            color: "#6b7280",
                                            fontSize: "11px",
                                            position: "absolute",
                                            bottom: "-24px",
                                            whiteSpace: "nowrap",
                                            maxWidth: "80px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            textAlign: "center"
                                        }}
                                    >
                                        {cat.category}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Budget Utilization Column */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1f2d3d" }}>Budget Utilization</h3>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>{categories.length} Categories</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
                        {categories.map((cat) => {
                            const barColor = cat.utilization > 100 ? "#ef4444" : cat.utilization >= 80 ? "#f59e0b" : "#2563eb";
                            return (
                                <div key={cat.id}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                                        <span style={{ fontWeight: 500, color: "#1f2d3d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
                                            {cat.category}
                                        </span>
                                        <span style={{ color: barColor, fontWeight: 600, fontSize: "12px" }}>
                                            {cat.utilization}%
                                        </span>
                                    </div>
                                    <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
                                        <div
                                            style={{
                                                width: `${Math.min(100, Math.max(0, cat.utilization))}%`,
                                                height: "100%",
                                                background: barColor,
                                                borderRadius: "3px",
                                                transition: "width 0.4s ease"
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Markup & Tax Summary Card */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1f2d3d" }}>Markup & Tax Summary</h3>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>Calculated across workspace inventory & active rates</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", background: "#f9fafb", padding: "20px", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                    <div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Base Cost</div>
                        <div style={{ fontSize: "18px", fontWeight: 600, color: "#1f2d3d" }}>{formatMoney(costOverview.baseCost)}</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Direct material & labor</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Markup ({costOverview.markupPercent}%)</div>
                        <div style={{ fontSize: "18px", fontWeight: 600, color: "#059669" }}>{formatMoney(costOverview.markupAmount)}</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Contractor margin</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>GST ({costOverview.taxPercent}%)</div>
                        <div style={{ fontSize: "18px", fontWeight: 600, color: "#1f2d3d" }}>{formatMoney(costOverview.taxAmount)}</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Applicable goods tax</div>
                    </div>
                    <div style={{ borderLeft: "2px solid #e5e7eb", paddingLeft: "20px" }}>
                        <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600, marginBottom: "4px" }}>Total Client Price</div>
                        <div style={{ fontSize: "20px", fontWeight: 700, color: "#2563eb" }}>{formatMoney(costOverview.clientPrice)}</div>
                        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>Final quote value</div>
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
    onOpenAddModal: () => void;
}) {
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [selectingId, setSelectingId] = useState<string | null>(null);

    const quotes = data.vendorQuotes;

    const availableCategories = useMemo(() => {
        const set = new Set<string>();
        quotes.forEach(q => {
            if (q.categoryName && q.categoryName !== "-") set.add(q.categoryName);
        });
        return ["All", ...Array.from(set)];
    }, [quotes]);

    const filteredQuotes = useMemo(() => {
        return quotes.filter(q => {
            const matchesSearch =
                !search ||
                q.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
                (q.itemName && q.itemName.toLowerCase().includes(search.toLowerCase())) ||
                (q.itemCode && q.itemCode.toLowerCase().includes(search.toLowerCase()));
            const matchesCat = categoryFilter === "All" || q.categoryName === categoryFilter;
            return matchesSearch && matchesCat;
        });
    }, [quotes, search, categoryFilter]);

    const minQuotePerItem = useMemo(() => {
        const map = new Map<string, number>();
        quotes.forEach(q => {
            const current = map.get(q.item_id);
            if (current === undefined || q.quote < current) {
                map.set(q.item_id, q.quote);
            }
        });
        return map;
    }, [quotes]);

    const handleSelectQuote = async (quoteId: string) => {
        if (quoteId.startsWith("pref-")) {
            return;
        }
        setSelectingId(quoteId);
        try {
            await selectVendorQuote(quoteId, true);
            onRefresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to select vendor quote");
        } finally {
            setSelectingId(null);
        }
    };

    const selectedCount = quotes.filter(q => q.selected).length;
    const avgLeadTime = quotes.length
        ? Math.round(quotes.reduce((s, q) => s + (q.lead_time_days || 0), 0) / quotes.length)
        : 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Top Stat Ribbon */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Total Quotes</div>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: "#1f2d3d", marginTop: "4px" }}>{quotes.length}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Active vendor proposals</div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Selected Vendors</div>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: "#059669", marginTop: "4px" }}>{selectedCount}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Committed suppliers</div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Average Lead Time</div>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: "#2563eb", marginTop: "4px" }}>{avgLeadTime} days</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Delivery timeline</div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Costing Items Tracked</div>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: "#1f2d3d", marginTop: "4px" }}>{data.items.length}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Available in library</div>
                </div>
            </div>

            {/* Filter and Action Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1 }}>
                    <label style={{ display: "flex", alignItems: "center", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "0 12px", width: "260px" }}>
                        <Search size={16} color="#6b7280" />
                        <input
                            placeholder="Search item or vendor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ border: "none", outline: "none", padding: "8px", fontSize: "13px", width: "100%", background: "transparent" }}
                        />
                    </label>

                    {availableCategories.length > 1 && (
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px", color: "#374151", background: "#f9fafb", outline: "none", cursor: "pointer" }}
                        >
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>
                                    Category: {cat}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    Showing <strong>{filteredQuotes.length}</strong> of {quotes.length} quotes
                </div>
            </div>

            {/* Vendor Quotes Comparison Table */}
            {filteredQuotes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px 20px", color: "#6b7280", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                    <Tag size={36} style={{ color: "#9ca3af", margin: "0 auto 12px auto" }} />
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#1f2d3d", fontWeight: 600 }}>No vendor quotes found</h4>
                    <p style={{ fontSize: "13px", color: "#6b7280", maxWidth: "420px", margin: "0 auto 16px auto" }}>
                        {search || categoryFilter !== "All"
                            ? "No vendor quotes match the selected filter criteria."
                            : "Add vendor quotations to compare rates, lead times, and track committed costs."}
                    </p>
                    <button
                        onClick={onOpenAddModal}
                        style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "8px", fontWeight: 500, cursor: "pointer", fontSize: "14px" }}
                    >
                        <Plus size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} /> Add First Quote
                    </button>
                </div>
            ) : (
                <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                        <thead>
                            <tr style={{ background: "#f9fafb", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>
                                <th style={{ padding: "14px 16px", fontWeight: 600 }}>ITEM / SPEC</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600 }}>CATEGORY</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600 }}>VENDOR</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600 }}>QUOTED RATE</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600 }}>BASE COST</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600 }}>LEAD TIME</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600 }}>RATING</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600 }}>STATUS</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, textAlign: "right" }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuotes.map((q, i) => {
                                const isBestPrice = minQuotePerItem.get(q.item_id) === q.quote;
                                const isSelecting = selectingId === q.id;

                                return (
                                    <tr
                                        key={q.id || i}
                                        style={{
                                            borderBottom: i === filteredQuotes.length - 1 ? "none" : "1px solid #f3f4f6",
                                            background: q.selected ? "#faf5ff" : "#fff",
                                            transition: "background 0.15s"
                                        }}
                                    >
                                        {/* Item */}
                                        <td style={{ padding: "14px 16px" }}>
                                            <div style={{ fontWeight: 600, color: "#111827" }}>{q.itemName || "Custom Item"}</div>
                                            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                                                Code: <span style={{ fontFamily: "monospace", color: "#4b5563" }}>{q.itemCode || "-"}</span>
                                            </div>
                                        </td>

                                        {/* Category */}
                                        <td style={{ padding: "14px 16px" }}>
                                            <span style={{ background: "#f3f4f6", color: "#374151", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 500 }}>
                                                {q.categoryName || "-"}
                                            </span>
                                        </td>

                                        {/* Vendor */}
                                        <td style={{ padding: "14px 16px" }}>
                                            <div style={{ fontWeight: 600, color: "#1f2d3d" }}>{q.vendor_name}</div>
                                            {q.selected && (
                                                <div style={{ fontSize: "11px", color: "#059669", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                                                    <CheckCircle2 size={12} /> Preferred Supplier
                                                </div>
                                            )}
                                        </td>

                                        {/* Quoted Rate */}
                                        <td style={{ padding: "14px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>{formatMoney(q.quote)}</span>
                                                {isBestPrice && (
                                                    <span style={{ background: "#dcfce7", color: "#15803d", fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                                                        BEST PRICE
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Base Cost */}
                                        <td style={{ padding: "14px 16px", color: "#6b7280" }}>
                                            {formatMoney(q.baseCost || 0)}
                                        </td>

                                        {/* Lead Time */}
                                        <td style={{ padding: "14px 16px", color: "#4b5563" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                <Clock size={13} color="#9ca3af" />
                                                <span>{q.lead_time_days ? `${q.lead_time_days} days` : "Immediate"}</span>
                                            </div>
                                        </td>

                                        {/* Rating */}
                                        <td style={{ padding: "14px 16px" }}>
                                            {q.rating ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#d97706", fontWeight: 600, fontSize: "12px" }}>
                                                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                                                    <span>{q.rating.toFixed(1)}</span>
                                                </div>
                                            ) : (
                                                <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: "14px 16px" }}>
                                            {q.selected ? (
                                                <span style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                    <Check size={11} /> Selected
                                                </span>
                                            ) : (
                                                <span style={{ background: "#f3f4f6", color: "#6b7280", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 500 }}>
                                                    Alternative
                                                </span>
                                            )}
                                        </td>

                                        {/* Action */}
                                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                            {q.selected ? (
                                                <span style={{ fontSize: "12px", color: "#059669", fontWeight: 600 }}>Active</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSelectQuote(q.id)}
                                                    disabled={isSelecting}
                                                    style={{
                                                        background: "#fff",
                                                        border: "1px solid #d1d5db",
                                                        padding: "5px 10px",
                                                        borderRadius: "6px",
                                                        fontSize: "12px",
                                                        fontWeight: 500,
                                                        color: "#374151",
                                                        cursor: "pointer",
                                                        transition: "all 0.15s"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = "#2563eb";
                                                        e.currentTarget.style.color = "#2563eb";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = "#d1d5db";
                                                        e.currentTarget.style.color = "#374151";
                                                    }}
                                                >
                                                    {isSelecting ? "Selecting..." : "Select Vendor"}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
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
    onClose,
    onSuccess
}: {
    items: CostingAnalysisResponse["items"];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || "");
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
