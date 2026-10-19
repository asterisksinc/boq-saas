"use client";

import { useState } from "react";
import { Search, FolderKanban, Activity, Clock, CheckCircle2, PauseCircle } from "lucide-react";
import { formatMoney } from "@/lib/costing-format";
import type { AnalyticsResponse } from "@/lib/types";
import PipelineByTypeBars from "./PipelineByTypeBars";

interface ProjectPipelineReportProps {
    data: AnalyticsResponse;
}

export default function ProjectPipelineReport({ data }: ProjectPipelineReportProps) {
    const [search, setSearch] = useState("");
    const pipeline = data.pipeline;
    const currency = data.scope?.currency || "INR";

    const totalProjects = pipeline?.totalProjects ?? data.counts.projects ?? 0;
    const totalValue = pipeline?.totalValue ?? data.pipelineByType.reduce((s, t) => s + Number(t.value || 0), 0);
    const byStatus = pipeline?.byStatus ?? {
        planning: 0,
        active: 0,
        in_progress: 0,
        on_hold: 0,
        completed: 0,
    };

    const projectsList = pipeline?.projects ?? [];
    const filteredProjects = projectsList.filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            p.name?.toLowerCase().includes(q) ||
            p.projectCode?.toLowerCase().includes(q) ||
            p.clientName?.toLowerCase().includes(q) ||
            p.projectType?.toLowerCase().includes(q)
        );
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            {/* KPI Cards */}
            <div className="rep-kpi-grid">
                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Total Projects</span>
                    <span className="rep-kpi-value">{totalProjects}</span>
                    <div className="rep-kpi-trend neutral">
                        <FolderKanban size={14} />
                        <span>All pipeline records</span>
                    </div>
                </div>

                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Pipeline Value</span>
                    <span className="rep-kpi-value green">{formatMoney(totalValue)}</span>
                    <div className="rep-kpi-trend green">
                        <Activity size={14} />
                        <span>Cumulative project worth</span>
                    </div>
                </div>

                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Active / In Progress</span>
                    <span className="rep-kpi-value green">{byStatus.active + byStatus.in_progress}</span>
                    <div className="rep-kpi-trend green">
                        <Clock size={14} />
                        <span>Currently underway</span>
                    </div>
                </div>

                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Completed</span>
                    <span className="rep-kpi-value">{byStatus.completed}</span>
                    <div className="rep-kpi-trend neutral">
                        <CheckCircle2 size={14} />
                        <span>Successfully delivered</span>
                    </div>
                </div>
            </div>

            {/* Pipeline Stage Funnel Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", width: "100%" }}>
                {[
                    { label: "Planning", count: byStatus.planning, color: "#D97706", icon: Clock },
                    { label: "Active", count: byStatus.active, color: "#16A34A", icon: Activity },
                    { label: "In Progress", count: byStatus.in_progress, color: "#2563EB", icon: Activity },
                    { label: "On Hold", count: byStatus.on_hold, color: "#64748B", icon: PauseCircle },
                    { label: "Completed", count: byStatus.completed, color: "#059669", icon: CheckCircle2 },
                ].map((st) => {
                    const Icon = st.icon;
                    return (
                        <div
                            key={st.label}
                            style={{
                                background: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                borderRadius: "8px",
                                padding: "14px 16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div>
                                <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>{st.label}</div>
                                <div style={{ fontSize: "20px", fontWeight: 700, color: st.color, marginTop: "2px" }}>{st.count}</div>
                            </div>
                            <div style={{ background: `${st.color}15`, padding: "8px", borderRadius: "6px" }}>
                                <Icon size={18} color={st.color} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pipeline by Type Breakdown */}
            <PipelineByTypeBars data={data.pipelineByType || []} currency={currency} />

            {/* Project Records Table */}
            <div className="rep-table-card-full">
                <div className="rep-table-search-row">
                    <h3 className="rep-card-title">Project Pipeline Records</h3>
                    <div className="rep-table-search-input">
                        <Search size={14} color="#64748B" />
                        <input
                            type="text"
                            placeholder="Search by name, client, code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rep-table-inner-wrap">
                    {filteredProjects.length === 0 ? (
                        <div className="rep-empty-state">
                            <span className="rep-empty-title">No projects found</span>
                            <span className="rep-empty-sub">
                                {search ? "Try adjusting your search query." : "Projects created in the workspace will appear in the pipeline."}
                            </span>
                        </div>
                    ) : (
                        <table className="rep-table">
                            <thead>
                                <tr className="rep-thead-row">
                                    <th style={{ width: "12%" }}>CODE</th>
                                    <th style={{ width: "28%" }}>PROJECT NAME</th>
                                    <th style={{ width: "20%" }}>CLIENT</th>
                                    <th style={{ width: "15%" }}>TYPE</th>
                                    <th className="text-center" style={{ width: "12%" }}>STATUS</th>
                                    <th className="text-right" style={{ width: "13%" }}>VALUE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.map((proj) => {
                                    const val = Number(proj.projectValue || 0);
                                    return (
                                        <tr key={proj.id} className="rep-tbody-row">
                                            <td style={{ fontWeight: 600, color: "#2563EB" }}>
                                                {proj.projectCode || "PRJ"}
                                            </td>
                                            <td>
                                                <span className="rep-user-name">{proj.name}</span>
                                            </td>
                                            <td className="text-muted">{proj.clientName || "—"}</td>
                                            <td>{proj.projectType || "General"}</td>
                                            <td className="text-center">
                                                <span className={`rep-badge-status ${proj.status}`}>
                                                    {proj.status.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="text-right" style={{ fontWeight: 600 }}>
                                                {formatMoney(val)}
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
