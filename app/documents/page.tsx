"use client";

import React, { Suspense } from "react";
import DashboardRail from "@/components/DashboardRail";
import DocumentsView from "@/components/documents/DocumentsView";

export default function DocumentsPage() {
    return (
        <Suspense
            fallback={
                <main className="fig-dashboard documents-page">
                    <div className="fig-dashboard-glow" />
                    <DashboardRail />
                    <div className="fig-dashboard-main">
                        <div className="documents-loading-card">
                            <div className="documents-spinner" />
                            <p>Loading documents…</p>
                        </div>
                    </div>
                </main>
            }
        >
            <DocumentsView
                rail={<DashboardRail />}
                isClient={false}
            />
        </Suspense>
    );
}
