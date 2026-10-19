"use client";

import { useState } from "react";
import { Search, Building2, UserCheck, UserPlus, Percent, DollarSign } from "lucide-react";
import { formatMoney } from "@/lib/costing-format";
import type { AnalyticsResponse } from "@/lib/types";

interface ClientAnalysisReportProps {
    data: AnalyticsResponse;
}

export default function ClientAnalysisReport({ data }: ClientAnalysisReportProps) {
    const [search, setSearch] = useState("");
    const clientList = data.clientAnalysis || [];

    const totalClients = clientList.length;
    const repeatClients = clientList.filter((c) => c.isRepeat || c.projects > 1).length;
    const newClients = totalClients - repeatClients;
    const repeatRate = totalClients > 0 ? ((repeatClients / totalClients) * 100).toFixed(0) : "0";
    const highestVal = Math.max(...clientList.map((c) => Number(c.totalValue || 0)), 0);

    const filteredClients = clientList.filter((c) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return c.client?.toLowerCase().includes(q);
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            {/* KPI Cards */}
            <div className="rep-kpi-grid">
                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Total Clients</span>
                    <span className="rep-kpi-value">{totalClients}</span>
                    <div className="rep-kpi-trend neutral">
                        <Building2 size={14} />
                        <span>Client portfolio</span>
                    </div>
                </div>

                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Repeat Clients</span>
                    <span className="rep-kpi-value green">{repeatClients}</span>
                    <div className="rep-kpi-trend green">
                        <UserCheck size={14} />
                        <span>{repeatRate}% retention rate</span>
                    </div>
                </div>

                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">New Clients</span>
                    <span className="rep-kpi-value">{newClients}</span>
                    <div className="rep-kpi-trend neutral">
                        <UserPlus size={14} />
                        <span>First-time accounts</span>
                    </div>
                </div>

                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Highest Client Worth</span>
                    <span className="rep-kpi-value green">{formatMoney(highestVal)}</span>
                    <div className="rep-kpi-trend green">
                        <DollarSign size={14} />
                        <span>Top account valuation</span>
                    </div>
                </div>
            </div>

            {/* Client Analysis Table */}
            <div className="rep-table-card-full">
                <div className="rep-table-search-row">
                    <h3 className="rep-card-title">Client Portfolio & Repeat Analysis</h3>
                    <div className="rep-table-search-input">
                        <Search size={14} color="#64748B" />
                        <input
                            type="text"
                            placeholder="Search by client name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rep-table-inner-wrap">
                    {filteredClients.length === 0 ? (
                        <div className="rep-empty-state">
                            <span className="rep-empty-title">No client records found</span>
                            <span className="rep-empty-sub">
                                {search ? "Try adjusting your search query." : "Clients linked to projects or invoices will be listed here."}
                            </span>
                        </div>
                    ) : (
                        <table className="rep-table">
                            <thead>
                                <tr className="rep-thead-row">
                                    <th style={{ width: "36%" }}>CLIENT NAME</th>
                                    <th className="text-center" style={{ width: "12%" }}>PROJECTS</th>
                                    <th className="text-right" style={{ width: "18%" }}>TOTAL VALUE</th>
                                    <th className="text-right" style={{ width: "16%" }}>INVOICED</th>
                                    <th className="text-right" style={{ width: "10%" }}>MARGIN</th>
                                    <th className="text-center" style={{ width: "18%" }}>CLIENT TYPE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map((client, idx) => {
                                    const totalVal = Number(client.totalValue || 0);
                                    const rev = Number(client.revenue || 0);
                                    const margin = client.marginPercent ?? 32;
                                    const isRepeat = client.isRepeat ?? (client.projects > 1);

                                    return (
                                        <tr key={client.client || idx} className="rep-tbody-row">
                                            <td>
                                                <span className="rep-user-name">{client.client}</span>
                                            </td>
                                            <td className="text-center text-muted">{client.projects}</td>
                                            <td className="text-right" style={{ fontWeight: 600 }}>
                                                {formatMoney(totalVal)}
                                            </td>
                                            <td className="text-right">{formatMoney(rev)}</td>
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
