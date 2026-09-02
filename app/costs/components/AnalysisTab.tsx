"use client";

import { useState, useEffect } from "react";
import { CostingAnalysis, getCostingAnalysis } from "@/lib/api/costing";
import { RefreshCw } from "lucide-react";

type SubTab = "Cost Overview" | "Vendor Comparison" | "Variance Analysis";

export default function AnalysisTab() {
    const [activeTab, setActiveTab] = useState<SubTab>("Cost Overview");
    const [data, setData] = useState<CostingAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
        return "₹" + (val / 100000).toFixed(1) + "L";
    };

    if (loading) {
        return <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>Loading analysis...</div>;
    }

    if (error || !data) {
        return (
            <div style={{ padding: "16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                <span>{error}</span>
                <button onClick={loadData} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <RefreshCw size={16} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Top Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "16px" }}>
                <MetricCard title="Total Budget" amount={formatMoney(data.totalBudget)} progress={75} />
                <MetricCard title="Actual Cost" amount={formatMoney(data.actualCost)} progress={50} />
                <MetricCard title="Committed" amount={formatMoney(data.committed)} progress={60} />
                <MetricCard title="Forecast" amount={formatMoney(data.forecast)} progress={85} />
                <MetricCard title="Variance" amount={formatMoney(data.variance)} progress={30} />
            </div>

            {/* Sub Tabs */}
            <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid #e5e7eb" }}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: "12px 0",
                            background: "none",
                            border: "none",
                            borderBottom: activeTab === tab ? "2px solid #1f2d3d" : "2px solid transparent",
                            color: activeTab === tab ? "#1f2d3d" : "#6b7280",
                            fontWeight: activeTab === tab ? 600 : 500,
                            cursor: "pointer",
                            fontSize: "14px",
                            transition: "all 0.2s"
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div>
                {activeTab === "Cost Overview" && <CostOverview />}
                {activeTab === "Variance Analysis" && <VarianceAnalysis />}
                {activeTab === "Vendor Comparison" && (
                    <div style={{ textAlign: "center", padding: "64px", color: "#6b7280", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                        Vendor Comparison coming soon...
                    </div>
                )}
            </div>
        </div>
    );
}

function MetricCard({ title, amount, progress }: { title: string; amount: string; progress: number }) {
    return (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
            <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "8px" }}>{title}</div>
            <div style={{ fontSize: "28px", fontWeight: 600, color: "#1f2d3d", marginBottom: "16px" }}>{amount}</div>
            <div style={{ height: "4px", background: "#f3f4f6", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "#2563eb" }} />
            </div>
        </div>
    );
}

function CostOverview() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                {/* Bar Chart Mockup */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1f2d3d" }}>Budget vs Actual by Category</h3>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>Oberoi Residence | All categories</div>
                        </div>
                        <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#4b5563" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ width: "12px", height: "2px", background: "#2563eb" }} /> Budget
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ width: "12px", height: "2px", background: "#6b7280" }} /> Actual
                            </div>
                        </div>
                    </div>
                    
                    {/* Fake Chart */}
                    <div style={{ height: "250px", display: "flex", alignItems: "flex-end", gap: "40px", paddingLeft: "40px", position: "relative" }}>
                        {/* Y-Axis labels */}
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#9ca3af", fontSize: "12px" }}>
                            <span>₹18L</span>
                            <span>₹13.5L</span>
                            <span>₹9L</span>
                            <span>₹4.5L</span>
                            <span>₹0L</span>
                        </div>
                        {/* Grid lines */}
                        <div style={{ position: "absolute", left: "40px", right: 0, top: 0, bottom: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", zIndex: 0 }}>
                            {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ borderBottom: "1px dashed #e5e7eb", width: "100%" }} />)}
                        </div>
                        
                        {/* Bars */}
                        {[
                            { name: "Furniture", b: "100%", a: "70%" },
                            { name: "Civil", b: "70%", a: "55%" },
                            { name: "Electrical", b: "50%", a: "35%" },
                            { name: "Flooring", b: "75%", a: "50%" },
                            { name: "Sanitary", b: "45%", a: "35%" },
                            { name: "Others", b: "25%", a: "20%" },
                        ].map((cat, i) => (
                            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", zIndex: 1, height: "100%", justifyContent: "flex-end", flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "100%", width: "100%", justifyContent: "center", paddingBottom: "24px" }}>
                                    <div style={{ width: "30%", height: cat.b, background: "#e5e7eb", borderRadius: "4px 4px 0 0" }} />
                                    <div style={{ width: "30%", height: cat.a, background: "#2563eb", borderRadius: "4px 4px 0 0" }} />
                                </div>
                                <div style={{ color: "#6b7280", fontSize: "12px", position: "absolute", bottom: "-4px" }}>{cat.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Progress Bars */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                    <h3 style={{ margin: "0 0 24px 0", fontSize: "16px", fontWeight: 600, color: "#1f2d3d" }}>Budget Utilization</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        {[
                            { name: "Furniture", val: "69%" },
                            { name: "Civil", val: "73%" },
                            { name: "Electrical", val: "63%" },
                            { name: "Flooring", val: "66%" },
                            { name: "Sanitary", val: "50%" },
                            { name: "Others", val: "73%" },
                        ].map((cat, i) => (
                            <div key={i}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                                    <span style={{ fontWeight: 500, color: "#1f2d3d" }}>{cat.name}</span>
                                    <span style={{ color: "#6b7280" }}>{cat.val}</span>
                                </div>
                                <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
                                    <div style={{ width: cat.val, height: "100%", background: "#2563eb" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Markup & Tax Summary */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                <h3 style={{ margin: "0 0 24px 0", fontSize: "16px", fontWeight: 600, color: "#1f2d3d" }}>Markup & Tax</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", color: "#4b5563" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Base Cost</span>
                        <span style={{ color: "#1f2d3d", fontWeight: 500 }}>₹28.9L</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Markup (18%)</span>
                        <span style={{ color: "#1f2d3d", fontWeight: 500 }}>₹5.2L</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>GST (18%)</span>
                        <span style={{ color: "#1f2d3d", fontWeight: 500 }}>₹6.1L</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "16px", borderTop: "1px solid #e5e7eb", fontSize: "16px", color: "#1f2d3d" }}>
                        <span style={{ fontWeight: 600 }}>Client Price</span>
                        <span style={{ fontWeight: 600 }}>₹40.2L</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function VarianceAnalysis() {
    const rows = [
        { cat: "Furniture", b: "₹18.0L", a: "₹12.5L", c: "₹14.4L", f: "₹17.1L", v: "-₹0.9L", s: "ON TRACK" },
        { cat: "Civil", b: "₹9.8L", a: "₹7.2L", c: "₹8.3L", f: "₹9.3L", v: "-₹0.5L", s: "ON TRACK" },
        { cat: "Electrical", b: "₹4.6L", a: "₹2.9L", c: "₹3.3L", f: "₹4.4L", v: "-₹0.2L", s: "ON TRACK" },
        { cat: "Flooring", b: "₹4.6L", a: "₹2.9L", c: "₹3.3L", f: "₹4.4L", v: "-₹0.2L", s: "ON TRACK" },
        { cat: "Sanitary", b: "₹4.6L", a: "₹2.9L", c: "₹3.3L", f: "₹4.4L", v: "-₹0.2L", s: "ON TRACK" },
    ];

    return (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #e5e7eb" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1f2d3d" }}>Cost Variance Analysis <span style={{ fontWeight: 400, color: "#6b7280" }}>Oberoi Residence</span></h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                <thead>
                    <tr style={{ background: "#f9fafb", color: "#6b7280" }}>
                        <th style={{ padding: "16px", fontWeight: 600 }}>CATEGORY</th>
                        <th style={{ padding: "16px", fontWeight: 600 }}>BUDGET</th>
                        <th style={{ padding: "16px", fontWeight: 600 }}>ACTUAL</th>
                        <th style={{ padding: "16px", fontWeight: 600 }}>COMMITTED</th>
                        <th style={{ padding: "16px", fontWeight: 600 }}>FORECAST</th>
                        <th style={{ padding: "16px", fontWeight: 600 }}>VARIANCE</th>
                        <th style={{ padding: "16px", fontWeight: 600 }}>STATUS</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: i === rows.length - 1 ? "none" : "1px solid #e5e7eb" }}>
                            <td style={{ padding: "16px", color: "#1f2d3d", fontWeight: 500 }}>{row.cat}</td>
                            <td style={{ padding: "16px", color: "#6b7280" }}>{row.b}</td>
                            <td style={{ padding: "16px", color: "#6b7280" }}>{row.a}</td>
                            <td style={{ padding: "16px", color: "#6b7280" }}>{row.c}</td>
                            <td style={{ padding: "16px", color: "#6b7280" }}>{row.f}</td>
                            <td style={{ padding: "16px", color: "#6b7280" }}>{row.v}</td>
                            <td style={{ padding: "16px" }}>
                                <span style={{ background: "#ecfdf5", color: "#10b981", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
                                    {row.s}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
