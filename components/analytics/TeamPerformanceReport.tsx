"use client";

import { useState } from "react";
import { Search, Users, Briefcase, FileSpreadsheet, DollarSign, Star } from "lucide-react";
import { formatMoney } from "@/lib/costing-format";
import type { AnalyticsResponse } from "@/lib/types";

interface TeamPerformanceReportProps {
    data: AnalyticsResponse;
}

export default function TeamPerformanceReport({ data }: TeamPerformanceReportProps) {
    const [search, setSearch] = useState("");
    const teamList = data.teamPerformance || [];

    const totalMembers = teamList.length;
    const totalProjectsAssigned = teamList.reduce((s, m) => s + Number(m.projects || 0), 0);
    const totalBoqsCreated = teamList.reduce((s, m) => s + Number(m.boqs || 0), 0);
    const totalRevenueDelivered = teamList.reduce((s, m) => s + Number(m.revenue ?? m.projectValue ?? 0), 0);
    const avgProjectsPerMember = totalMembers > 0 ? (totalProjectsAssigned / totalMembers).toFixed(1) : "0";

    const filteredMembers = teamList.filter((m) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            m.name?.toLowerCase().includes(q) ||
            m.role?.toLowerCase().includes(q)
        );
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            {/* KPI Cards */}
            <div className="rep-kpi-grid">
                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Active Members</span>
                    <span className="rep-kpi-value">{totalMembers}</span>
                    <div className="rep-kpi-trend neutral">
                        <Users size={14} />
                        <span>Workspace members</span>
                    </div>
                </div>

                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Assigned Projects</span>
                    <span className="rep-kpi-value green">{totalProjectsAssigned}</span>
                    <div className="rep-kpi-trend green">
                        <Briefcase size={14} />
                        <span>{avgProjectsPerMember} avg per member</span>
                    </div>
                </div>

                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">BOQs Generated</span>
                    <span className="rep-kpi-value">{totalBoqsCreated}</span>
                    <div className="rep-kpi-trend neutral">
                        <FileSpreadsheet size={14} />
                        <span>Across active projects</span>
                    </div>
                </div>

                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Delivered Value</span>
                    <span className="rep-kpi-value green">{formatMoney(totalRevenueDelivered)}</span>
                    <div className="rep-kpi-trend green">
                        <DollarSign size={14} />
                        <span>Attributed project revenue</span>
                    </div>
                </div>
            </div>

            {/* Team Performance Table */}
            <div className="rep-table-card-full">
                <div className="rep-table-search-row">
                    <h3 className="rep-card-title">Team Member Performance Breakdown</h3>
                    <div className="rep-table-search-input">
                        <Search size={14} color="#64748B" />
                        <input
                            type="text"
                            placeholder="Search by member name, role..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rep-table-inner-wrap">
                    {filteredMembers.length === 0 ? (
                        <div className="rep-empty-state">
                            <span className="rep-empty-title">No team members found</span>
                            <span className="rep-empty-sub">
                                {search ? "Try adjusting your search query." : "Workspace members will be listed here with their assigned project metrics."}
                            </span>
                        </div>
                    ) : (
                        <table className="rep-table">
                            <thead>
                                <tr className="rep-thead-row">
                                    <th style={{ width: "30%" }}>TEAM MEMBER</th>
                                    <th style={{ width: "16%" }}>ROLE</th>
                                    <th className="text-center" style={{ width: "12%" }}>PROJECTS</th>
                                    <th className="text-center" style={{ width: "12%" }}>BOQS</th>
                                    <th className="text-right" style={{ width: "15%" }}>DELIVERED VALUE</th>
                                    <th className="text-center" style={{ width: "15%" }}>RATING</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.map((member, idx) => {
                                    const rev = Number(member.revenue ?? member.projectValue ?? 0);
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
                                            <td>
                                                <span style={{ textTransform: "capitalize", color: "#64748B", fontSize: "13px" }}>
                                                    {member.role || "Member"}
                                                </span>
                                            </td>
                                            <td className="text-center">{member.projects}</td>
                                            <td className="text-center text-muted">{member.boqs}</td>
                                            <td className="text-right" style={{ fontWeight: 600 }}>
                                                {formatMoney(rev)}
                                            </td>
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
        </div>
    );
}
