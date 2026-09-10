"use client";

import { useState, useEffect } from "react";
import { Download, RefreshCw } from "lucide-react";
import DashboardRail from "@/components/DashboardRail";
import { getAnalytics, getAnalyticsPdf } from "@/lib/api/reports";
import type { AnalyticsResponse } from "@/lib/types";

type AnalyticsData = Partial<AnalyticsResponse> & {
    summary?: {
        totalRevenue?: number;
        totalCost?: number;
        grossMarginPercent?: number;
        avgProjectValue?: number;
        projectCount?: number;
        proposalCount?: number;
    };
    monthly?: Array<{
        month?: string;
        period?: string;
        revenue?: number;
        cost?: number;
        margin?: number;
    }>;
};

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [period, setPeriod] = useState<"month" | "quarter" | "year">("quarter");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState(false);

    const loadData = async (p: "month" | "quarter" | "year") => {
        setLoading(true);
        setError("");
        try {
            const report = await getAnalytics(p);
            setData(report as AnalyticsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData(period);
    }, [period]);

    const handleExportPdf = async () => {
        setDownloading(true);
        try {
            const blob = await getAnalyticsPdf(period);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `analytics-${period}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "PDF export failed");
        } finally {
            setDownloading(false);
        }
    };

    const currency = data?.scope?.currency || "INR";
    const fmt = (n: number | null | undefined) =>
        new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
        }).format(Number(n) || 0);

    const kpis = data?.kpis ?? data?.summary ?? {
        totalRevenue: 0,
        totalCost: 0,
        grossMarginPercent: 0,
        averageProjectValue: 0,
    };

    const totalRevenue = Number(kpis.totalRevenue ?? 0);
    const totalCost = Number(kpis.totalCost ?? 0);
    const grossMarginPercent = Number(kpis.grossMarginPercent ?? 0);
    const avgProjectValue = Number(
        (kpis as any).averageProjectValue ?? (kpis as any).avgProjectValue ?? 0
    );

    const monthlyList = (data?.monthlyRevenueVsCost ?? data?.monthly ?? []).map((m: any) => {
        const periodKey = m.period || m.month || "";
        const revenue = Number(m.revenue ?? 0);
        const cost = Number(m.cost ?? 0);
        const trendItem = data?.grossMarginTrend?.find((t) => t.period === periodKey);
        const margin = m.margin ?? trendItem?.marginPercent ?? (revenue > 0 ? ((revenue - cost) * 100) / revenue : 0);
        return {
            month: periodKey || "—",
            revenue,
            cost,
            margin: Number(margin || 0),
        };
    });

    const projectsByTypeList = (data?.projectsByType ?? []).map((p: any) => ({
        type: p.type || "Other",
        count: Number(p.projects ?? p.count ?? 0),
        value: Number(p.value ?? 0),
    }));

    const teamPerformanceList = (data?.teamPerformance ?? []).map((t: any) => ({
        name: t.name || (t.role ? `${t.role.charAt(0).toUpperCase() + t.role.slice(1)} (${String(t.userId || "").slice(0, 8)})` : String(t.userId || "Member")),
        projects: Number(t.projects ?? 0),
        revenue: Number(t.projectValue ?? t.revenue ?? 0),
    }));

    const clientAnalysisList = (data?.clientAnalysis ?? []).map((c: any) => ({
        name: c.client || c.name || "Client",
        projects: Number(c.projects ?? 0),
        totalValue: Number(c.totalValue ?? 0),
    }));

    const hasAnyBreakdown =
        monthlyList.length > 0 ||
        projectsByTypeList.length > 0 ||
        teamPerformanceList.length > 0 ||
        clientAnalysisList.length > 0;

    return (
        <main className="fig-dashboard boq-dashboard">
            <div className="fig-dashboard-glow" />
            <DashboardRail />

            <div className="fig-dashboard-main">
                <header className="fig-dashboard-header">
                    <h1>Analytics</h1>
                    <div className="fig-dashboard-header-actions">
                        <label className="fig-dashboard-search">
                            <img src="/assets/dashboard/dashboard-search.svg" alt="" />
                            <input placeholder="Search..." aria-label="Search" />
                        </label>
                        <button type="button" className="fig-dashboard-bell" aria-label="Notifications">
                            <img src="/assets/dashboard/dashboard-notifications.svg" alt="" />
                        </button>
                        <div className="fig-dashboard-avatar">BO</div>
                    </div>
                </header>

                <section style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#1f2d3d", margin: "0 0 8px" }}>
                                Business Analytics
                            </h2>
                            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                                Revenue, margins, and performance insights
                                {data?.scope?.generatedAt && (
                                    <span> • Last updated {new Date(data.scope.generatedAt).toLocaleDateString()}</span>
                                )}
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value as "month" | "quarter" | "year")}
                                style={{ padding: "8px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", background: "#fff" }}
                            >
                                <option value="month">This Month</option>
                                <option value="quarter">This Quarter</option>
                                <option value="year">This Year</option>
                            </select>
                            <button
                                onClick={handleExportPdf}
                                disabled={downloading}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    background: "#2563eb",
                                    color: "#fff",
                                    border: "none",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    opacity: downloading ? 0.6 : 1,
                                }}
                            >
                                <Download size={16} /> {downloading ? "Exporting..." : "Export PDF"}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: "16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                            <span>{error}</span>
                            <button
                                onClick={() => loadData(period)}
                                style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                            >
                                <RefreshCw size={16} /> Retry
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "64px", color: "#6b7280" }}>Loading analytics...</div>
                    ) : data ? (
                        <>
                            {/* KPIs */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                                {[
                                    { label: "Total Revenue", value: fmt(totalRevenue), color: "#2563eb" },
                                    { label: "Total Cost", value: fmt(totalCost), color: "#6b7280" },
                                    {
                                        label: "Gross Margin",
                                        value: `${grossMarginPercent.toFixed(1)}%`,
                                        color: grossMarginPercent >= 20 ? "#10b981" : "#ef4444",
                                    },
                                    { label: "Avg Project Value", value: fmt(avgProjectValue), color: "#8b5cf6" },
                                ].map((k) => (
                                    <div key={k.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                                        <div style={{ color: "#6b7280", fontSize: "13px", marginBottom: "8px" }}>{k.label}</div>
                                        <div style={{ fontSize: "24px", fontWeight: 700, color: k.color }}>{k.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Monthly Revenue vs Cost */}
                            {monthlyList.length > 0 && (
                                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                                    <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Monthly Revenue vs Cost</h3>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                                <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280" }}>Month</th>
                                                <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Revenue</th>
                                                <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Cost</th>
                                                <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Margin</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthlyList.map((m) => (
                                                <tr key={m.month} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                    <td style={{ padding: "8px 12px" }}>{m.month}</td>
                                                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmt(m.revenue)}</td>
                                                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmt(m.cost)}</td>
                                                    <td style={{ padding: "8px 12px", textAlign: "right", color: m.margin >= 20 ? "#10b981" : "#ef4444" }}>
                                                        {m.margin.toFixed(1)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Projects by Type */}
                            {projectsByTypeList.length > 0 && (
                                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                                    <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Projects by Type</h3>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                                <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280" }}>Type</th>
                                                <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Count</th>
                                                <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projectsByTypeList.map((p) => (
                                                <tr key={p.type} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                    <td style={{ padding: "8px 12px" }}>{p.type}</td>
                                                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{p.count}</td>
                                                    <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmt(p.value)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Team + Client */}
                            {(teamPerformanceList.length > 0 || clientAnalysisList.length > 0) && (
                                <div style={{ display: "grid", gridTemplateColumns: teamPerformanceList.length > 0 && clientAnalysisList.length > 0 ? "1fr 1fr" : "1fr", gap: "16px" }}>
                                    {teamPerformanceList.length > 0 && (
                                        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                                            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Team Performance</h3>
                                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                                <thead>
                                                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                                        <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280" }}>Name</th>
                                                        <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Projects</th>
                                                        <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {teamPerformanceList.map((t, idx) => (
                                                        <tr key={`${t.name}-${idx}`} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                            <td style={{ padding: "8px 12px" }}>{t.name}</td>
                                                            <td style={{ padding: "8px 12px", textAlign: "right" }}>{t.projects}</td>
                                                            <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmt(t.revenue)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {clientAnalysisList.length > 0 && (
                                        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                                            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Client Analysis</h3>
                                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                                <thead>
                                                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                                        <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280" }}>Client</th>
                                                        <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Projects</th>
                                                        <th style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>Total Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {clientAnalysisList.map((c, idx) => (
                                                        <tr key={`${c.name}-${idx}`} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                            <td style={{ padding: "8px 12px" }}>{c.name}</td>
                                                            <td style={{ padding: "8px 12px", textAlign: "right" }}>{c.projects}</td>
                                                            <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmt(c.totalValue)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!hasAnyBreakdown && (
                                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", textAlign: "center", color: "#6b7280" }}>
                                    No breakdown activity recorded for this period yet.
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: "center", padding: "64px", color: "#6b7280" }}>No analytics data available.</div>
                    )}
                </section>
            </div>
        </main>
    );
}
