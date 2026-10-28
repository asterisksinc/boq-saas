"use client";

import React from "react";

export interface HelpSupportLayoutProps {
    rail: React.ReactNode;
    header: React.ReactNode;
    notice?: { message: string; type: "success" | "error" } | null;
    drawer?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function HelpSupportLayout({
    rail,
    header,
    notice,
    drawer,
    children,
    className = "",
}: HelpSupportLayoutProps) {
    return (
        <main className={`fig-dashboard boq-dashboard help-page ${className}`.trim()}>
            {/* Top gradient glow matching Figma Rectangle 14 */}
            <div className="help-gradient-glow" />
            <div className="fig-dashboard-glow" />
            {rail}

            <div className="fig-dashboard-main">
                {header}

                <section className="help-content">
                    {/* Notice Toast */}
                    {notice && (
                        <div
                            className={`notice-banner ${notice.type}`}
                            role="status"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                background: notice.type === "success" ? "#dcfce7" : "#fee2e2",
                                color: notice.type === "success" ? "#15803d" : "#b91c1c",
                                border: `1px solid ${notice.type === "success" ? "#86efac" : "#fca5a5"}`,
                                fontSize: "13px",
                                fontWeight: "500",
                            }}
                        >
                            <span>{notice.message}</span>
                        </div>
                    )}

                    {children}
                </section>
            </div>

            {drawer}
        </main>
    );
}

export default HelpSupportLayout;
