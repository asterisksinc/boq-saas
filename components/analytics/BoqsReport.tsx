"use client";

import { useState } from "react";
import { Search, FileSpreadsheet, CheckCircle, Clock, FileEdit, Archive } from "lucide-react";
import type { AnalyticsResponse } from "@/lib/types";

interface BoqsReportProps {
    data: AnalyticsResponse;
}

export default function BoqsReport({ data }: BoqsReportProps) {
    const [search, setSearch] = useState("");
    const boqSummary = data.boqSummary;

    const totalBoqs = boqSummary?.totalBoqs ?? data.counts.boqs ?? 0;
    const byStatus = boqSummary?.byStatus ?? {
        draft: 0,
        in_review: 0,
        approved: 0,
        archived: 0,
    };

    const boqList = boqSummary?.boqs ?? [];
    const filteredBoqs = boqList.filter((b) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            b.boqNumber?.toLowerCase().includes(q) ||
            b.version?.toLowerCase().includes(q) ||
            b.status?.toLowerCase().includes(q)
        );
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            {/* KPI Cards */}
            <div className="rep-kpi-grid">
                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Total BOQs</span>
                    <span className="rep-kpi-value">{totalBoqs}</span>
                    <div className="rep-kpi-trend neutral">
                        <FileSpreadsheet size={14} />
                        <span>All versioned records</span>
                    </div>
                </div>

                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Approved BOQs</span>
                    <span className="rep-kpi-value green">{byStatus.approved}</span>
                    <div className="rep-kpi-trend green">
                        <CheckCircle size={14} />
                        <span>Ready for procurement</span>
                    </div>
                </div>

                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">In Review</span>
                    <span className="rep-kpi-value" style={{ color: "#D97706" }}>{byStatus.in_review}</span>
                    <div className="rep-kpi-trend neutral">
                        <Clock size={14} />
                        <span>Pending approval</span>
                    </div>
                </div>

                <div className="rep-kpi-card">
                    <span className="rep-kpi-label">Drafts</span>
                    <span className="rep-kpi-value">{byStatus.draft}</span>
                    <div className="rep-kpi-trend neutral">
                        <FileEdit size={14} />
                        <span>Work in progress</span>
                    </div>
                </div>
            </div>

            {/* Status Breakdown & Version Distribution Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", width: "100%" }}>
                {/* Status distribution */}
                <div className="rep-card-outer">
                    <div className="rep-card-header">
                        <h3 className="rep-card-title">BOQs by Lifecycle Status</h3>
                    </div>
                    <div className="rep-inner-card" style={{ gap: "12px", minHeight: "auto" }}>
                        {[
                            { label: "Approved", count: byStatus.approved, color: "#16A34A", icon: CheckCircle },
                            { label: "In Review", count: byStatus.in_review, color: "#D97706", icon: Clock },
                            { label: "Draft", count: byStatus.draft, color: "#2563EB", icon: FileEdit },
                            { label: "Archived", count: byStatus.archived, color: "#64748B", icon: Archive },
                        ].map((item) => (
                            <div
                                key={item.label}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "8px 0",
                                    borderBottom: "1px solid #F1F5F9",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: item.color }} />
                                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#0F172A" }}>{item.label}</span>
                                </div>
                                <span style={{ fontSize: "14px", fontWeight: 600, color: item.color }}>{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Version Breakdown */}
                <div className="rep-card-outer">
                    <div className="rep-card-header">
                        <h3 className="rep-card-title">BOQ Version Distribution</h3>
                    </div>
                    <div className="rep-inner-card" style={{ gap: "12px", minHeight: "auto" }}>
                        {(boqSummary?.byVersion || []).length === 0 ? (
                            <div style={{ color: "#64748B", fontSize: "14px", padding: "12px 0" }}>No version records available.</div>
                        ) : (
                            (boqSummary?.byVersion || []).map((ver) => (
                                <div
                                    key={ver.version}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "8px 0",
                                        borderBottom: "1px solid #F1F5F9",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#2563EB" }} />
                                        <span style={{ fontSize: "14px", fontWeight: 500, color: "#0F172A" }}>Version {ver.version}</span>
                                    </div>
                                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>{ver.count}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* BOQ Records Table */}
            <div className="rep-table-card-full">
                <div className="rep-table-search-row">
                    <h3 className="rep-card-title">Bill of Quantities Records</h3>
                    <div className="rep-table-search-input">
                        <Search size={14} color="#64748B" />
                        <input
                            type="text"
                            placeholder="Search by BOQ number, version..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rep-table-inner-wrap">
                    {filteredBoqs.length === 0 ? (
                        <div className="rep-empty-state">
                            <span className="rep-empty-title">No BOQs recorded</span>
                            <span className="rep-empty-sub">
                                {search ? "Try adjusting your search query." : "Bill of quantities created in projects will be listed here."}
                            </span>
                        </div>
                    ) : (
                        <table className="rep-table">
                            <thead>
                                <tr className="rep-thead-row">
                                    <th style={{ width: "30%" }}>BOQ NUMBER</th>
                                    <th className="text-center" style={{ width: "15%" }}>VERSION</th>
                                    <th className="text-center" style={{ width: "15%" }}>STATUS</th>
                                    <th className="text-right" style={{ width: "15%" }}>MARKUP %</th>
                                    <th className="text-right" style={{ width: "15%" }}>TAX %</th>
                                    <th className="text-right" style={{ width: "10%" }}>CREATED</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBoqs.map((boq) => (
                                    <tr key={boq.id} className="rep-tbody-row">
                                        <td style={{ fontWeight: 600, color: "#2563EB" }}>
                                            {boq.boqNumber}
                                        </td>
                                        <td className="text-center">
                                            <span style={{ background: "#F1F5F9", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>
                                                {boq.version}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span className={`rep-badge-status ${boq.status}`}>
                                                {boq.status.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="text-right">{boq.markupPercent}%</td>
                                        <td className="text-right">{boq.taxPercent}%</td>
                                        <td className="text-right text-muted">
                                            {new Date(boq.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
