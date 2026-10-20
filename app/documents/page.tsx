"use client";

import React, { Suspense } from "react";
import DashboardRail from "@/components/DashboardRail";
import DocumentsView from "@/components/documents/DocumentsView";
import "./documents-redesign.css";

export default function DocumentsPage() {
    return (
        <Suspense
            fallback={
                <main className="fig-dashboard documents-page">
                    <div className="fig-dashboard-glow documents-bg-glow" />
                    <DashboardRail />
                    <div className="fig-dashboard-main">
                        <div className="doc-loading-container">
                            <div className="doc-spinner" />
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
