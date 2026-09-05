"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { getCostingMargins } from "@/lib/api/costing";
import type { MarginAnalysisResponse } from "@/lib/types";

export default function MarginsTab() {
    const [data, setData] = useState<MarginAnalysisResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = async () => {
        setLoading(true);
        setError("");
        try { setData(await getCostingMargins()); }
        catch (err) { setError(err instanceof Error ? err.message : "Failed to load margins"); }
        finally { setLoading(false); }
    };

    useEffect(() => { void loadData(); }, []);

    if (loading) return <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>Loading margin analysis...</div>;
    if (error || !data) return (
        <div style={{ padding: "16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
            <span>{error || "No data available"}</span>
            <button onClick={loadData} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><RefreshCw size={16} /> Retry</button>
        </div>
    );

    return (
        <div>
            <h3 style={{ margin: "0 0 24px", fontSize: "18px", fontWeight: 600, color: "#1f2d3d" }}>Margin Analysis</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "32px" }}>
                {[
                    { label: "Target Margin", value: `${data.targetMargin.toFixed(1)}%`, color: "#2563eb" },
                    { label: "Current Margin", value: `${data.currentMargin.toFixed(1)}%`, color: data.currentMargin >= data.targetMargin ? "#10b981" : "#ef4444" },
                    { label: "Difference", value: `${data.marginDifference > 0 ? "+" : ""}${data.marginDifference.toFixed(1)}%`, color: data.marginDifference >= 0 ? "#10b981" : "#ef4444" },
                ].map(k => (
                    <div key={k.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                        <div style={{ color: "#6b7280", fontSize: "13px", marginBottom: "8px" }}>{k.label}</div>
                        <div style={{ fontSize: "28px", fontWeight: 700, color: k.color }}>{k.value}</div>
                    </div>
                ))}
            </div>

            {data.byCategory.length > 0 && (
                <>
                    <h4 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600, color: "#1f2d3d" }}>Margin by Category</h4>
                    <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: "32px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead><tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280" }}>CATEGORY</th>
                                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "#6b7280" }}>MARGIN %</th>
                            </tr></thead>
                            <tbody>{data.byCategory.map(c => (
                                <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                    <td style={{ padding: "12px 16px", color: "#1f2d3d" }}>{c.name}</td>
                                    <td style={{ padding: "12px 16px", textAlign: "right", color: c.marginPercent >= data.targetMargin ? "#10b981" : "#ef4444", fontWeight: 600 }}>{c.marginPercent.toFixed(1)}%</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </>
            )}

            {data.lowMarginItems.length > 0 && (
                <>
                    <h4 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600, color: "#1f2d3d" }}>Low Margin Items</h4>
                    <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead><tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280" }}>ITEM</th>
                                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "#6b7280" }}>BASE COST</th>
                                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "#6b7280" }}>SELLING RATE</th>
                                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "#6b7280" }}>MARGIN</th>
                            </tr></thead>
                            <tbody>{data.lowMarginItems.map(item => (
                                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                    <td style={{ padding: "12px 16px", color: "#1f2d3d" }}>{item.name}</td>
                                    <td style={{ padding: "12px 16px", textAlign: "right" }}>₹{item.base_cost.toLocaleString("en-IN")}</td>
                                    <td style={{ padding: "12px 16px", textAlign: "right" }}>₹{item.selling_rate.toLocaleString("en-IN")}</td>
                                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#ef4444", fontWeight: 600 }}>{item.marginPercent.toFixed(1)}%</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
