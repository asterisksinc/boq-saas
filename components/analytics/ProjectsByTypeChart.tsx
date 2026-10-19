"use client";

import { useState } from "react";

interface ProjectTypeItem {
    type: string;
    projects?: number;
    count?: number;
    value?: number;
}

interface ProjectsByTypeChartProps {
    data: ProjectTypeItem[];
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

export default function ProjectsByTypeChart({ data }: ProjectsByTypeChartProps) {
    const [hoveredType, setHoveredType] = useState<string | null>(null);

    if (!data || data.length === 0) {
        return (
            <div className="rep-card-outer">
                <div className="rep-card-header">
                    <h3 className="rep-card-title">Projects by Type</h3>
                </div>
                <div className="rep-inner-card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ color: "#64748B", fontSize: "14px" }}>No project type breakdown recorded for this period.</div>
                </div>
            </div>
        );
    }

    const totalProjects = data.reduce((sum, item) => sum + Number(item.projects ?? item.count ?? 0), 0);

    const getColor = (type: string, index: number) => {
        const key = type.toLowerCase().trim();
        return TYPE_COLORS[key] || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
    };

    // Calculate SVG donut stroke-dasharray segments
    // Radius = 65, Circumference = 2 * PI * 65 ≈ 408.4
    const radius = 65;
    const circumference = 2 * Math.PI * radius;

    let accumulatedAngle = 0;
    const segments = data.map((item, index) => {
        const count = Number(item.projects ?? item.count ?? 0);
        const fraction = totalProjects > 0 ? count / totalProjects : 0;
        const strokeLength = fraction * circumference;
        const strokeDasharray = `${strokeLength} ${circumference}`;
        const strokeDashoffset = -accumulatedAngle;
        accumulatedAngle += strokeLength;

        return {
            type: item.type,
            count,
            value: item.value,
            color: getColor(item.type, index),
            strokeDasharray,
            strokeDashoffset,
            percentage: (fraction * 100).toFixed(0),
        };
    });

    const activeItem = segments.find((s) => s.type === hoveredType);

    return (
        <div className="rep-card-outer">
            <div className="rep-card-header">
                <h3 className="rep-card-title">Projects by Type</h3>
            </div>

            <div className="rep-inner-card" style={{ gap: "24px", justifyContent: "center" }}>
                {/* Donut Chart Visual */}
                <div className="rep-donut-container">
                    <div className="rep-donut-svg-wrap">
                        <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: "rotate(-90deg)" }}>
                            {/* Background track circle */}
                            <circle
                                cx="90"
                                cy="90"
                                r={radius}
                                fill="transparent"
                                stroke="#F1F5F9"
                                strokeWidth="24"
                            />
                            {/* Colored segments */}
                            {segments.map((seg) => (
                                <circle
                                    key={seg.type}
                                    cx="90"
                                    cy="90"
                                    r={radius}
                                    fill="transparent"
                                    stroke={seg.color}
                                    strokeWidth={hoveredType === seg.type ? 28 : 24}
                                    strokeDasharray={seg.strokeDasharray}
                                    strokeDashoffset={seg.strokeDashoffset}
                                    style={{
                                        cursor: "pointer",
                                        transition: "stroke-width 0.2s ease, opacity 0.2s ease",
                                        opacity: hoveredType === null || hoveredType === seg.type ? 1 : 0.7,
                                    }}
                                    onMouseEnter={() => setHoveredType(seg.type)}
                                    onMouseLeave={() => setHoveredType(null)}
                                />
                            ))}
                        </svg>

                        {/* Center text in donut */}
                        <div className="rep-donut-center-text">
                            <div className="rep-donut-center-num">
                                {activeItem ? activeItem.count : totalProjects}
                            </div>
                            <div className="rep-donut-center-sub">
                                {activeItem ? activeItem.type : "Projects"}
                            </div>
                        </div>
                    </div>

                    {/* Legend list below donut matching Figma layout */}
                    <div className="rep-donut-legend-list">
                        {segments.map((seg) => (
                            <div
                                key={seg.type}
                                className="rep-donut-legend-row"
                                style={{
                                    cursor: "pointer",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    background: hoveredType === seg.type ? "#F8FAFC" : "transparent",
                                }}
                                onMouseEnter={() => setHoveredType(seg.type)}
                                onMouseLeave={() => setHoveredType(null)}
                            >
                                <div className="rep-donut-legend-left">
                                    <span className="rep-color-sq" style={{ background: seg.color }} />
                                    <span className="rep-donut-type-name">{seg.type}</span>
                                </div>
                                <span className="rep-donut-count">{seg.count} Project{seg.count === 1 ? "" : "s"}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
