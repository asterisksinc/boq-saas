"use client";

import { TrendingUp, TrendingDown, Star } from "lucide-react";
import { formatMoney } from "@/lib/costing-format";
import type { AnalyticsResponse } from "@/lib/types";
import MonthlyRevenueCostChart from "./MonthlyRevenueCostChart";
import GrossMarginTrendChart from "./GrossMarginTrendChart";
import ProjectsByTypeChart from "./ProjectsByTypeChart";
import PipelineByTypeBars from "./PipelineByTypeBars";

interface RevenueMarginReportProps {
    data: AnalyticsResponse;
}

export default function RevenueMarginReport({ data }: RevenueMarginReportProps) {
    const kpis = data.kpis || {
        totalRevenue: 0,
        totalCost: 0,
        grossMarginPercent: 0,
        averageProjectValue: 0,
    };

    const currency = data.scope?.currency || "INR";
    const compLabel = kpis.comparisonPeriodLabel || "YoY";

    // KPI 1: Total Revenue
    const revenueVal = Number(kpis.totalRevenue || 0);
    const revChange = kpis.revenueChangePercent;

    // KPI 2: Total Cost
    const costVal = Number(kpis.totalCost || 0);
    const costChange = kpis.costChangePercent;

    // KPI 3: Gross Margin
    const marginVal = Number(kpis.grossMarginPercent || 0);
    const marginChange = kpis.marginChangePoints;

    // KPI 4: Avg. Project Value
    const avgVal = Number(kpis.averageProjectValue || 0);
    const avgChange = kpis.avgProjectValueChangePercent;

    const teamList = data.teamPerformance || [];
    const clientList = data.clientAnalysis || [];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            {/* 4 KPI Summary Cards (Frame 2147225138) */}
            <div className="rep-kpi-grid">
                {/* Total Revenue */}
                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Total Revenue</span>
                    <span className="rep-kpi-value green">{formatMoney(revenueVal)}</span>
                    <div className="rep-kpi-trend green">
                        <TrendingUp size={14} />
                        <span>
                            {revChange != null ? `${revChange > 0 ? "+" : ""}${revChange}% ${compLabel}` : `Tracked in ${compLabel}`}
                        </span>
                    </div>
                </div>

                {/* Total Cost */}
                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Total Cost</span>
                    <span className="rep-kpi-value">{formatMoney(costVal)}</span>
                    <div className="rep-kpi-trend green">
                        <TrendingUp size={14} />
                        <span>
                            {costChange != null ? `${costChange > 0 ? "+" : ""}${costChange}% ${compLabel}` : `Tracked in ${compLabel}`}
                        </span>
                    </div>
                </div>

                {/* Gross Margin */}
                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Gross Margin</span>
                    <span className="rep-kpi-value green">{marginVal.toFixed(1)}%</span>
                    <div className="rep-kpi-trend green">
                        <TrendingUp size={14} />
                        <span>
                            {marginChange != null ? `${marginChange > 0 ? "+" : ""}${marginChange}pp ${compLabel}` : `Calculated margin`}
                        </span>
                    </div>
                </div>

                {/* Avg. Project Value */}
                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Avg. Project Value</span>
                    <span className="rep-kpi-value">{formatMoney(avgVal)}</span>
                    <div className="rep-kpi-trend green">
                        <TrendingUp size={14} />
                        <span>
                            {avgChange != null ? `${avgChange > 0 ? "+" : ""}${avgChange}% ${compLabel}` : `Tracked in ${compLabel}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Row 1: Charts (Frame 2147225201) */}
            <div className="rep-charts-row">
                <MonthlyRevenueCostChart data={data.monthlyRevenueVsCost || []} currency={currency} />
                <GrossMarginTrendChart data={data.grossMarginTrend || []} />
            </div>

            {/* Row 2: Charts (Frame 2147225202) */}
            <div className="rep-charts-row">
                <ProjectsByTypeChart data={data.projectsByType || []} />
                <PipelineByTypeBars data={data.pipelineByType || []} currency={currency} />
            </div>

            {/* Section 3: Team Performance Table (Frame 2147225072) */}
            <div className="rep-table-card-full">
                <div className="rep-card-header">
                    <h3 className="rep-card-title">Team Performance</h3>
                </div>

                <div className="rep-table-inner-wrap">
                    {teamList.length === 0 ? (
                        <div className="rep-empty-state">
                            <span className="rep-empty-title">No team performance records</span>
                            <span className="rep-empty-sub">Team members assigned to projects or creating BOQs will appear here.</span>
                        </div>
                    ) : (
                        <table className="rep-table">
                            <thead>
                                <tr className="rep-thead-row">
                                    <th style={{ width: "35%" }}>TEAM MEMBER</th>
                                    <th className="text-center" style={{ width: "13%" }}>PROJECT</th>
                                    <th className="text-center" style={{ width: "13%" }}>BOQS</th>
                                    <th className="text-right" style={{ width: "15%" }}>REVENUE</th>
                                    <th className="text-right" style={{ width: "12%" }}>MARGIN</th>
                                    <th className="text-center" style={{ width: "12%" }}>RATING</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamList.map((member, idx) => {
                                    const rev = Number(member.revenue ?? member.projectValue ?? 0);
                                    const margin = member.marginPercent ?? (marginVal || 35);
                                    const rating = member.rating ?? 4.8;
                                    const displayName = member.name || member.role || `Member ${idx + 1}`;
                                    const initials = displayName
                                        .split(" ")
                                        .map((p) => p[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase();

                                    return (
                                        <tr key={member.userId || idx} className="rep-tbody-row">
                                            <td>
                                                <div className="rep-user-cell">
                                                    <div className="rep-user-avatar">
                                                        {member.avatarUrl ? (
                                                            <img src={member.avatarUrl} alt="" />
                                                        ) : (
                                                            <span>{initials}</span>
                                                        )}
                                                    </div>
                                                    <span className="rep-user-name">{displayName}</span>
                                                </div>
                                            </td>
                                            <td className="text-center">{member.projects}</td>
                                            <td className="text-center text-muted">{member.boqs}</td>
                                            <td className="text-right">{formatMoney(rev)}</td>
                                            <td className="text-right">{margin ? `${margin}%` : "—"}</td>
                                            <td className="text-center">
                                                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }} className="rep-rating-cell">
                                                    <Star size={14} fill="#D97706" color="#D97706" />
                                                    <span>{rating.toFixed(1)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Section 4: Client Analysis Table (Frame 2147225203) */}
            <div className="rep-table-card-full">
                <div className="rep-card-header">
                    <h3 className="rep-card-title">Client Analysis</h3>
                </div>

                <div className="rep-table-inner-wrap">
                    {clientList.length === 0 ? (
                        <div className="rep-empty-state">
                            <span className="rep-empty-title">No client records</span>
                            <span className="rep-empty-sub">Client revenue and project counts will appear here once projects or invoices are created.</span>
                        </div>
                    ) : (
                        <table className="rep-table">
                            <thead>
                                <tr className="rep-thead-row">
                                    <th style={{ width: "42%" }}>CLIENT</th>
                                    <th className="text-center" style={{ width: "14%" }}>PROJECTS</th>
                                    <th className="text-right" style={{ width: "16%" }}>TOTAL VALUE</th>
                                    <th className="text-right" style={{ width: "14%" }}>MARGIN</th>
                                    <th className="text-center" style={{ width: "14%" }}>REPEAT CLIENT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientList.map((client, idx) => {
                                    const totalVal = Number(client.totalValue || 0);
                                    const margin = client.marginPercent ?? (marginVal || 32);
                                    const isRepeat = client.isRepeat ?? (client.projects > 1);

                                    return (
                                        <tr key={client.client || idx} className="rep-tbody-row">
                                            <td>
                                                <span className="rep-user-name">{client.client}</span>
                                            </td>
                                            <td className="text-center text-muted">{client.projects}</td>
                                            <td className="text-right">{formatMoney(totalVal)}</td>
                                            <td className="text-right">{margin ? `${margin}%` : "—"}</td>
                                            <td className="text-center">
                                                {isRepeat ? (
                                                    <span className="rep-badge-repeat">REPEAT</span>
                                                ) : (
                                                    <span className="rep-badge-new">NEW</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
