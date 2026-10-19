"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Download, RefreshCw, ChevronDown, Calendar, Loader2 } from "lucide-react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import { getAnalytics, getAnalyticsPdf } from "@/lib/api/reports";
import type { AnalyticsResponse } from "@/lib/types";
import RevenueMarginReport from "@/components/analytics/RevenueMarginReport";
import ProjectPipelineReport from "@/components/analytics/ProjectPipelineReport";
import BoqsReport from "@/components/analytics/BoqsReport";
import TeamPerformanceReport from "@/components/analytics/TeamPerformanceReport";
import ClientAnalysisReport from "@/components/analytics/ClientAnalysisReport";
import "./analytics-redesign.css";

type ReportTab = "revenue" | "pipeline" | "boqs" | "team" | "clients";
type ReportPeriod = "month" | "quarter" | "year" | "all" | "custom";

const PERIOD_LABELS: Record<ReportPeriod, string> = {
    year: "This Year",
    quarter: "This Quarter",
    month: "This Month",
    all: "All Time",
    custom: "Custom Range",
};

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState<ReportTab>("revenue");
    const [period, setPeriod] = useState<ReportPeriod>("year");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [showDateMenu, setShowDateMenu] = useState(false);
    const [showCustomBox, setShowCustomBox] = useState(false);

    const [data, setData] = useState<AnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    const dateMenuRef = useRef<HTMLDivElement>(null);

    // Close date menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
                setShowDateMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadData = useCallback(
        async (selectedPeriod: ReportPeriod, fromDate?: string, toDate?: string) => {
            setLoading(true);
            setError(null);
            try {
                const report = await getAnalytics({
                    period: selectedPeriod,
                    tab: activeTab,
                    from: fromDate || undefined,
                    to: toDate || undefined,
                });
                setData(report);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load reports and analytics.");
            } finally {
                setLoading(false);
            }
        },
        [activeTab]
    );

    useEffect(() => {
        if (period !== "custom") {
            void loadData(period);
        }
    }, [period, loadData]);

    const handleSelectPeriod = (p: ReportPeriod) => {
        setPeriod(p);
        setShowDateMenu(false);
        if (p === "custom") {
            setShowCustomBox(true);
        } else {
            setShowCustomBox(false);
        }
    };

    const handleApplyCustomDates = () => {
        if (customFrom) {
            void loadData("custom", customFrom, customTo);
        }
    };

    const handleExportPdf = async () => {
        setDownloading(true);
        setError(null);
        try {
            const blob = await getAnalyticsPdf({
                period,
                tab: activeTab,
                from: customFrom || undefined,
                to: customTo || undefined,
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `reports-${activeTab}-${period}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "PDF report export failed. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <main className="fig-dashboard analytics-page">
            {/* Subtle blue gradient overlay matching Figma Rectangle 14 */}
            <div className="analytics-glow-top" />

            {/* Parent Sidebar */}
            <DashboardRail current="/analytics" />

            <div className="fig-dashboard-main">
                {/* Reusable Parent Dashboard Header */}
                <DashboardHeader title="Reports & Analytics" />

                <div className="rep-container">
                    {/* Header Section (Frame 2147225066) */}
                    <div className="rep-header-section">
                        <div className="rep-heading-group">
                            <h2 className="rep-title">Reports & Analytics</h2>
                            <p className="rep-subtitle">Business intelligence across all projects and operations</p>
                        </div>

                        <div className="rep-controls-group">
                            {/* Date Range Selector Dropdown matching Figma This Year selector */}
                            <div className="rep-date-selector" ref={dateMenuRef}>
                                <button
                                    type="button"
                                    className="rep-date-btn"
                                    onClick={() => setShowDateMenu(!showDateMenu)}
                                    aria-haspopup="true"
                                    aria-expanded={showDateMenu}
                                >
                                    <Calendar size={16} color="#0F172A" />
                                    <span>{PERIOD_LABELS[period]}</span>
                                    <ChevronDown size={16} color="#0F172A" />
                                </button>

                                {showDateMenu && (
                                    <div className="rep-date-menu">
                                        {(["year", "quarter", "month", "all", "custom"] as ReportPeriod[]).map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                className={`rep-date-item ${period === p ? "active" : ""}`}
                                                onClick={() => handleSelectPeriod(p)}
                                            >
                                                <span>{PERIOD_LABELS[p]}</span>
                                                {period === p && <span style={{ color: "#2563EB", fontWeight: 700 }}>✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Custom Date Pickers (if custom selected) */}
                            {showCustomBox && (
                                <div className="rep-custom-date-box">
                                    <input
                                        type="date"
                                        aria-label="Start Date"
                                        value={customFrom}
                                        onChange={(e) => setCustomFrom(e.target.value)}
                                    />
                                    <span style={{ color: "#64748B", fontSize: "12px" }}>to</span>
                                    <input
                                        type="date"
                                        aria-label="End Date"
                                        value={customTo}
                                        onChange={(e) => setCustomTo(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="rep-custom-apply-btn"
                                        onClick={handleApplyCustomDates}
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}

                            {/* Download PDF Action Button matching Figma Frame 2147225069 */}
                            <button
                                type="button"
                                className="rep-download-btn"
                                onClick={handleExportPdf}
                                disabled={downloading || loading}
                                title="Download complete report as PDF"
                            >
                                {downloading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        <span>Download PDF</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Report Category Tabs (Frame Buttons & Frame 2147225067) */}
                    <div className="rep-tabs-bar" role="tablist" aria-label="Report category tabs">
                        {[
                            { key: "revenue", label: "Revenue & Margin" },
                            { key: "pipeline", label: "Project Pipeline" },
                            { key: "boqs", label: "BOQs" },
                            { key: "team", label: "Team Performance" },
                            { key: "clients", label: "Client Analysis" },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.key}
                                className={`rep-tab-item ${activeTab === tab.key ? "active" : ""}`}
                                onClick={() => setActiveTab(tab.key as ReportTab)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="rep-alert-banner">
                            <span>{error}</span>
                            <button
                                type="button"
                                className="rep-retry-btn"
                                onClick={() => void loadData(period, customFrom, customTo)}
                            >
                                <RefreshCw size={14} />
                                <span>Retry</span>
                            </button>
                        </div>
                    )}

                    {/* Content Body */}
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
                            {/* Skeletons for 4 KPIs */}
                            <div className="rep-kpi-grid">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="rep-kpi-card">
                                        <div className="rep-skeleton" style={{ width: "80px", height: "14px" }} />
                                        <div className="rep-skeleton" style={{ width: "110px", height: "28px" }} />
                                        <div className="rep-skeleton" style={{ width: "60px", height: "14px" }} />
                                    </div>
                                ))}
                            </div>

                            {/* Skeletons for Charts */}
                            <div className="rep-charts-row">
                                <div className="rep-card-outer">
                                    <div className="rep-skeleton" style={{ width: "140px", height: "16px", marginBottom: "12px" }} />
                                    <div className="rep-skeleton" style={{ width: "100%", height: "220px", borderRadius: "14px" }} />
                                </div>
                                <div className="rep-card-outer">
                                    <div className="rep-skeleton" style={{ width: "140px", height: "16px", marginBottom: "12px" }} />
                                    <div className="rep-skeleton" style={{ width: "100%", height: "220px", borderRadius: "14px" }} />
                                </div>
                            </div>
                        </div>
                    ) : data ? (
                        <>
                            {activeTab === "revenue" && <RevenueMarginReport data={data} />}
                            {activeTab === "pipeline" && <ProjectPipelineReport data={data} />}
                            {activeTab === "boqs" && <BoqsReport data={data} />}
                            {activeTab === "team" && <TeamPerformanceReport data={data} />}
                            {activeTab === "clients" && <ClientAnalysisReport data={data} />}
                        </>
                    ) : (
                        <div className="rep-empty-state">
                            <span className="rep-empty-title">No analytics available</span>
                            <span className="rep-empty-sub">No reports found for this period. Try selecting another date preset.</span>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
