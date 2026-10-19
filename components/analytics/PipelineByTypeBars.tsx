"use client";

import { formatMoney } from "@/lib/costing-format";

interface PipelineTypeItem {
    type: string;
    projects?: number;
    value?: number;
}

interface PipelineByTypeBarsProps {
    data: PipelineTypeItem[];
    currency?: string;
}

const TYPE_COLORS: Record<string, string> = {
    residential: "#2563EB",
    commercial: "#FF0000",
    retail: "#000000",
    hospitality: "#11AAE3",
    studio: "#6B82EC",
    industrial: "#F59E0B",
    other: "#94A3B8",
};

const FALLBACK_PALETTE = ["#2563EB", "#FF0000", "#000000", "#11AAE3", "#6B82EC", "#F59E0B", "#10B981", "#8B5CF6"];

export default function PipelineByTypeBars({ data, currency = "INR" }: PipelineByTypeBarsProps) {
    if (!data || data.length === 0) {
        return (
            <div className="rep-card-outer">
                <div className="rep-card-header">
                    <h3 className="rep-card-title">Pipeline by Type</h3>
                </div>
                <div className="rep-inner-card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ color: "#64748B", fontSize: "14px" }}>No pipeline breakdown recorded for this period.</div>
                </div>
            </div>
        );
    }

    const getColor = (type: string, index: number) => {
        const key = type.toLowerCase().trim();
        return TYPE_COLORS[key] || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
    };

    // Calculate max value or project count to scale the 10 segments
    const maxValue = Math.max(...data.map((d) => Number(d.value || 0)), 1);

    return (
        <div className="rep-card-outer">
            <div className="rep-card-header">
                <h3 className="rep-card-title">Pipeline by Type</h3>
            </div>

            <div className="rep-inner-card" style={{ padding: "20px" }}>
                <div className="rep-pipeline-bars-container">
                    {data.map((item, index) => {
                        const count = Number(item.projects || 0);
                        const val = Number(item.value || 0);
                        const color = getColor(item.type, index);

                        // Number of filled segments out of 10
                        const filledCount = Math.max(1, Math.min(10, Math.round((val / maxValue) * 10)));

                        return (
                            <div key={item.type} className="rep-pipe-item">
                                <div className="rep-pipe-header">
                                    <span className="rep-pipe-name">{item.type}</span>
                                    <div className="rep-pipe-metrics">
                                        <span className="rep-pipe-val">{formatMoney(val)}</span>
                                        <span>•</span>
                                        <span>{count} Proj.</span>
                                    </div>
                                </div>

                                {/* 10 Segmented Bar matching Figma Rectangle 83..92 */}
                                <div className="rep-segmented-bar">
                                    {Array.from({ length: 10 }, (_, segIdx) => (
                                        <div
                                            key={segIdx}
                                            className="rep-segment"
                                            style={{
                                                background: segIdx < filledCount ? color : "#F1F5F9",
                                            }}
                                        />
                                    ))}
                                </div>

                                {index < data.length - 1 && <div className="rep-pipe-divider" />}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
