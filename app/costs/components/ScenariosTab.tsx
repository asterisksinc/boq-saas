"use client";

import { useState, useEffect } from "react";
import { Plus, Copy, RefreshCw } from "lucide-react";
import { getCostingScenarios, createCostingScenario, duplicateCostingScenario } from "@/lib/api/costing";
import type { CostingScenario } from "@/lib/types";

export default function ScenariosTab() {
    const [scenarios, setScenarios] = useState<CostingScenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getCostingScenarios();
            setScenarios(res.items);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load scenarios");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadData(); }, []);

    const handleDuplicate = async (id: string) => {
        try {
            await duplicateCostingScenario(id);
            void loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to duplicate scenario");
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    if (loading) return <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>Loading scenarios...</div>;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#1f2d3d" }}>Costing Scenarios</h3>
            </div>

            {error && (
                <div style={{ padding: "16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                    <span>{error}</span>
                    <button onClick={loadData} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            )}

            {scenarios.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px", color: "#6b7280" }}>
                    <p>No scenarios found. Create a BOQ first, then add costing scenarios.</p>
                </div>
            ) : (
                <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                        <thead>
                            <tr style={{ background: "#f9fafb", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                                <th style={{ padding: "16px", fontWeight: 600 }}>NAME</th>
                                <th style={{ padding: "16px", fontWeight: 600 }}>TYPE</th>
                                <th style={{ padding: "16px", fontWeight: 600 }}>ADJUSTMENTS</th>
                                <th style={{ padding: "16px", fontWeight: 600 }}>BASE COST</th>
                                <th style={{ padding: "16px", fontWeight: 600 }}>SCENARIO COST</th>
                                <th style={{ padding: "16px", fontWeight: 600 }}>SAVINGS</th>
                                <th style={{ padding: "16px", fontWeight: 600 }}>CREATED</th>
                                <th style={{ padding: "16px" }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {scenarios.map(s => (
                                <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                    <td style={{ padding: "16px", fontWeight: 500, color: "#1f2d3d" }}>{s.name}</td>
                                    <td style={{ padding: "16px", color: "#6b7280" }}>{s.scenario_type}</td>
                                    <td style={{ padding: "16px", color: "#6b7280" }}>{s.adjustments?.length ?? 0}</td>
                                    <td style={{ padding: "16px", color: "#1f2d3d" }}>{s.baseCost != null ? `₹${s.baseCost.toLocaleString("en-IN")}` : "-"}</td>
                                    <td style={{ padding: "16px", color: "#1f2d3d" }}>{s.scenarioCost != null ? `₹${s.scenarioCost.toLocaleString("en-IN")}` : "-"}</td>
                                    <td style={{ padding: "16px", color: s.savings && s.savings > 0 ? "#10b981" : "#6b7280" }}>{s.savings != null ? `₹${s.savings.toLocaleString("en-IN")}` : "-"}</td>
                                    <td style={{ padding: "16px", color: "#6b7280" }}>{formatDate(s.created_at)}</td>
                                    <td style={{ padding: "16px" }}>
                                        <button onClick={() => handleDuplicate(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }} title="Duplicate">
                                            <Copy size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
