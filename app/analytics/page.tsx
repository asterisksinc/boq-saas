"use client";

import { useState, useEffect } from "react";
import { Download, RefreshCw } from "lucide-react";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";

const menuRoutes = ["/dashboard", "/projects", "/boqs", "/costs", "/workspace", "/proposals", "/invoices", "/analytics", "/documents", "/integrations", "/billing"];
const menuIcons = ["dashboard-overview-active", "dashboard-projects", "dashboard-boqs", "dashboard-costs", "dashboard-workspace", "dashboard-estimates", "dashboard-purchase-orders", "dashboard-analytics", "dashboard-reports", "dashboard-integrations", "dashboard-billing"];

type AnalyticsData = {
    summary: { totalRevenue: number; totalCost: number; grossMarginPercent: number; avgProjectValue: number; projectCount: number; proposalCount: number };
    monthly: Array<{ month: string; revenue: number; cost: number; margin: number }>;
    projectsByType: Array<{ type: string; count: number; value: number }>;
    teamPerformance: Array<{ name: string; projects: number; revenue: number }>;
    clientAnalysis: Array<{ name: string; projects: number; totalValue: number }>;
};

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [period, setPeriod] = useState<"month" | "quarter" | "year">("quarter");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState(false);

    const loadData = async (p: string) => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/v1/reports/analytics?period=${p}`, { credentials: "include" });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(getApiErrorMessage(payload));
            setData(parseApiResponse<AnalyticsData>(payload));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadData(period); }, [period]);

    const handleExportPdf = async () => {
        setDownloading(true);
        try {
            const res = await fetch(`/api/v1/reports/analytics/pdf?period=${period}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to generate PDF");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `analytics-${period}.pdf`; a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "PDF export failed");
        } finally {
            setDownloading(false);
        }
    };

    const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);

    return (
        <main className="fig-dashboard boq-dashboard">
            <div className="fig-dashboard-glow" />
            <aside className="fig-dashboard-rail" aria-label="Dashboard navigation">
                <div className="fig-dashboard-logo"><span><img src="/assets/boq-logo-small.svg" alt="BOQ" /></span></div>
                <nav className="fig-dashboard-menu">
                    {menuRoutes.map((route, index) => (
                        <button key={route} type="button" className={index === 7 ? "is-current" : ""} aria-label={`Navigate to ${route}`} onClick={() => window.location.assign(route)}>
                            <img src={`/assets/dashboard/${menuIcons[index]}.svg`} alt="" />
                        </button>
                    ))}
                </nav>
                <div className="fig-dashboard-tools">
                    <button type="button" aria-label="Help"><img src="/assets/dashboard/dashboard-help.svg" alt="" /></button>
                    <button type="button" aria-label="Settings"><img src="/assets/dashboard/dashboard-settings.svg" alt="" /></button>
                </div>
            </aside>

            <div className="fig-dashboard-main">
                <header className="fig-dashboard-header">
                    <h1>Analytics</h1>
                    <div className="fig-dashboard-header-actions">
                        <label className="fig-dashboard-search"><img src="/assets/dashboard/dashboard-search.svg" alt="" /><input placeholder="Search..." aria-label="Search" /></label>
                        <button type="button" className="fig-dashboard-bell" aria-label="Notifications"><img src="/assets/dashboard/dashboard-notifications.svg" alt="" /></button>
                        <div className="fig-dashboard-avatar">BO</div>
                    </div>
                </header>

                <section style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#1f2d3d", margin: "0 0 8px" }}>Business Analytics</h2>
                            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Revenue, margins, and performance insights</p>
                        </div>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <select value={period} onChange={e => setPeriod(e.target.value as any)} style={{ padding: "8px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", background: "#fff" }}>
                                <option value="month">This Month</option>
                                <option value="quarter">This Quarter</option>
                                <option value="year">This Year</option>
                            </select>
                            <button onClick={handleExportPdf} disabled={downloading} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer", opacity: downloading ? 0.6 : 1 }}>
                                <Download size={16} /> {downloading ? "Exporting..." : "Export PDF"}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: "16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                            <span>{error}</span>
                            <button onClick={() => loadData(period)} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><RefreshCw size={16} /> Retry</button>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "64px", color: "#6b7280" }}>Loading analytics...</div>
                    ) : data ? (
                        <>
                            {/* KPIs */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                                {[
                                    { label: "Total Revenue", value: fmt(data.summary.totalRevenue), color: "#2563eb" },
                                    { label: "Total Cost", value: fmt(data.summary.totalCost), color: "#6b7280" },
                                    { label: "Gross Margin", value: `${data.summary.grossMarginPercent.toFixed(1)}%`, color: data.summary.grossMarginPercent >= 20 ? "#10b981" : "#ef4444" },
                                    { label: "Avg Project Value", value: fmt(data.summary.avgProjectValue), color: "#8b5cf6" },
                                ].map(k => (
                                    <div key={k.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                                        <div style={{ color: "#6b7280", fontSize: "13px", marginBottom: "8px" }}>{k.label}</div>
                                        <div style={{ fontSize: "24px", fontWeight: 700, color: k.color }}>{k.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Monthly Revenue vs Cost */}
                            {data.monthly.length > 0 && (
                                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                                    <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Monthly Revenue vs Cost</h3>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                        <thead><tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                            <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280" }}>Month</th>
                                            <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Revenue</th>
                                            <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Cost</th>
                                            <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Margin</th>
                                        </tr></thead>
                                        <tbody>{data.monthly.map(m => (
                                            <tr key={m.month} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                <td style={{ padding: "8px 12px" }}>{m.month}</td>
                                                <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmt(m.revenue)}</td>
                                                <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmt(m.cost)}</td>
                                                <td style={{ padding: "8px 12px", textAlign: "right", color: m.margin >= 20 ? "#10b981" : "#ef4444" }}>{m.margin.toFixed(1)}%</td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            )}

                            {/* Projects by Type */}
                            {data.projectsByType.length > 0 && (
                                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                                    <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Projects by Type</h3>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                        <thead><tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                            <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280" }}>Type</th>
                                            <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Count</th>
                                            <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Value</th>
                                        </tr></thead>
                                        <tbody>{data.projectsByType.map(p => (
                                            <tr key={p.type} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                <td style={{ padding: "8px 12px" }}>{p.type}</td>
                                                <td style={{ padding: "8px 12px", textAlign: "right" }}>{p.count}</td>
                                                <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmt(p.value)}</td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            )}

                            {/* Team + Client */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                {data.teamPerformance.length > 0 && (
                                    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                                        <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Team Performance</h3>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                            <thead><tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                                <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280" }}>Name</th>
                                                <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Projects</th>
                                                <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Revenue</th>
                                            </tr></thead>
                                            <tbody>{data.teamPerformance.map(t => (
                                                <tr key={t.name} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                    <td style={{ padding: "8px 12px" }}>{t.name}</td>
                                                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{t.projects}</td>
                                                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmt(t.revenue)}</td>
                                                </tr>
                                            ))}</tbody>
                                        </table>
                                    </div>
                                )}
                                {data.clientAnalysis.length > 0 && (
                                    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                                        <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Client Analysis</h3>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                            <thead><tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                                <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280" }}>Client</th>
                                                <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Projects</th>
                                                <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Total Value</th>
                                            </tr></thead>
                                            <tbody>{data.clientAnalysis.map(c => (
                                                <tr key={c.name} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                    <td style={{ padding: "8px 12px" }}>{c.name}</td>
                                                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{c.projects}</td>
                                                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmt(c.totalValue)}</td>
                                                </tr>
                                            ))}</tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: "center", padding: "64px", color: "#6b7280" }}>No analytics data available.</div>
                    )}
                </section>
            </div>
        </main>
    );
}
