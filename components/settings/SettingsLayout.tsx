"use client";

import React from "react";

export interface SettingsLayoutProps {
    rail: React.ReactNode;
    header: React.ReactNode;
    notice?: { message: string; type: "success" | "error" } | null;
    navigation: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export default function SettingsLayout({
    rail,
    header,
    notice,
    navigation,
    children,
    className = "",
}: SettingsLayoutProps) {
    return (
        <main className={`fig-dashboard boq-dashboard settings-page ${className}`.trim()}>
            <div className="fig-dashboard-glow" />
            {rail}

            <div className="fig-dashboard-main">
                {header}

                <div className="settings-page-container">
                    {notice && (
                        <div className={`notice-banner ${notice.type}`} role="status">
                            <span>{notice.message}</span>
                        </div>
                    )}

                    {navigation}

                    <div className="settings-body-wrap">
                        {children}
                    </div>
                </div>
            </div>
        </main>
    );
}
