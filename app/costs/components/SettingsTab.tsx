"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { getCostingSettings } from "@/lib/api/costing";
import type { CostingSettingsResponse } from "@/lib/types";

export default function SettingsTab() {
    const [data, setData] = useState<CostingSettingsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = async () => {
        setLoading(true);
        setError("");
        try { setData(await getCostingSettings()); }
        catch (err) { setError(err instanceof Error ? err.message : "Failed to load settings"); }
        finally { setLoading(false); }
    };

    useEffect(() => { void loadData(); }, []);

    if (loading) return <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>Loading costing settings...</div>;
    if (error || !data) return (
        <div style={{ padding: "16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
            <span>{error || "No data available"}</span>
            <button onClick={loadData} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><RefreshCw size={16} /> Retry</button>
        </div>
    );

    const h = data.health;
    return (
        <div>
            <h3 style={{ margin: "0 0 24px", fontSize: "18px", fontWeight: 600, color: "#1f2d3d" }}>Costing Health & Settings</h3>

            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: h.completenessPercent >= 80 ? "#ecfdf5" : h.completenessPercent >= 50 ? "#fefce8" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 700, color: h.completenessPercent >= 80 ? "#10b981" : h.completenessPercent >= 50 ? "#eab308" : "#ef4444" }}>
                        {h.completenessPercent}%
                    </div>
                    <div>
                        <div style={{ fontSize: "16px", fontWeight: 600, color: "#1f2d3d" }}>Costing Completeness</div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>Based on categories, items, quotes, and scenarios</div>
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                {[
                    { label: "Categories", value: h.categoryCount },
                    { label: "Items", value: h.itemCount },
                    { label: "Vendor Quotes", value: h.vendorQuoteCount },
                    { label: "Scenarios", value: h.scenarioCount },
                    { label: "Missing Defaults", value: h.missingCategoryDefaults, warn: h.missingCategoryDefaults > 0 },
                    { label: "Expired Rates", value: h.expiredRates, warn: h.expiredRates > 0 },
                ].map(m => (
                    <div key={m.label} style={{ background: "#fff", border: `1px solid ${m.warn ? "#fde68a" : "#e5e7eb"}`, borderRadius: "12px", padding: "20px" }}>
                        <div style={{ color: "#6b7280", fontSize: "13px", marginBottom: "4px" }}>{m.label}</div>
                        <div style={{ fontSize: "24px", fontWeight: 700, color: m.warn ? "#d97706" : "#1f2d3d" }}>{m.value}</div>
                    </div>
                ))}
            </div>

            {data.sections.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 600, color: "#1f2d3d" }}>Available Sections</h4>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {data.sections.map(s => (
                            <span key={s} style={{ background: "#f3f4f6", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", color: "#374151" }}>{s}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
