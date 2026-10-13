"use client";

import React, { Suspense } from "react";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DocumentsView from "@/components/documents/DocumentsView";

export default function ClientDocumentsPage() {
    return (
        <Suspense
            fallback={
                <main className="fig-dashboard documents-page">
                    <div className="fig-dashboard-glow" />
                    <ClientDashboardRail current="/client/documents" />
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
                rail={<ClientDashboardRail current="/client/documents" />}
                isClient={true}
            />
        </Suspense>
    );
}
