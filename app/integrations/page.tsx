"use client";

import DashboardRail from "@/components/DashboardRail";

export default function IntegrationsPage() {
    return (
        <main className="fig-dashboard boq-dashboard">
            <div className="fig-dashboard-glow" />
            <DashboardRail />

            <div className="fig-dashboard-main">
                <header className="fig-dashboard-header">
                    <h1>Integrations</h1>
                    <div className="fig-dashboard-header-actions">
                        <button type="button" className="fig-dashboard-bell" aria-label="Notifications"><img src="/assets/dashboard/dashboard-notifications.svg" alt="" /></button>
                        <div className="fig-dashboard-avatar">BO</div>
                    </div>
                </header>

                <section style={{ padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "500px" }}>
                    <div style={{ textAlign: "center", maxWidth: "480px" }}>
                        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "32px" }}>🔗</div>
                        <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#1f2d3d", margin: "0 0 12px" }}>Integrations</h2>
                        <p style={{ fontSize: "16px", color: "#6b7280", margin: "0 0 8px" }}>
                            Third-party integrations and API connections are coming soon.
                        </p>
                        <p style={{ fontSize: "14px", color: "#9ca3af", margin: "0 0 32px" }}>
                            Connect with accounting software, CRM tools, cloud storage, and more to streamline your workflow.
                        </p>
                        <span style={{ display: "inline-block", background: "#eff6ff", color: "#2563eb", padding: "8px 20px", borderRadius: "20px", fontSize: "13px", fontWeight: 600 }}>
                            Coming Soon
                        </span>
                    </div>
                </section>
            </div>
        </main>
    );
}
