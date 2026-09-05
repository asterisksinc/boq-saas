"use client";

const menuRoutes = ["/dashboard", "/projects", "/boqs", "/costs", "/workspace", "/proposals", "/invoices", "/analytics", "/documents", "/integrations", "/billing"];
const menuIcons = ["dashboard-overview-active", "dashboard-projects", "dashboard-boqs", "dashboard-costs", "dashboard-workspace", "dashboard-estimates", "dashboard-purchase-orders", "dashboard-analytics", "dashboard-reports", "dashboard-integrations", "dashboard-billing"];

export default function WorkspacePage() {
    return (
        <main className="fig-dashboard boq-dashboard">
            <div className="fig-dashboard-glow" />
            <aside className="fig-dashboard-rail" aria-label="Dashboard navigation">
                <div className="fig-dashboard-logo"><span><img src="/assets/boq-logo-small.svg" alt="BOQ" /></span></div>
                <nav className="fig-dashboard-menu">
                    {menuRoutes.map((route, index) => (
                        <button key={route} type="button" className={index === 4 ? "is-current" : ""} aria-label={`Navigate to ${route}`} onClick={() => window.location.assign(route)}>
                            <img src={`/assets/dashboard/${menuIcons[index]}.svg`} alt="" />
                        </button>
                    ))}
                </nav>
                <div className="fig-dashboard-tools">
                    <button type="button" aria-label="Help"><img src="/assets/dashboard/dashboard-help.svg" alt="" /></button>
                    <button type="button" aria-label="Settings"><img src="/assets/dashboard/dashboard-settings.svg" alt="" /></button>
                </div>
            </aside>

            <div className="fig-dashboard-main">
                <header className="fig-dashboard-header">
                    <h1>Workspace</h1>
                    <div className="fig-dashboard-header-actions">
                        <button type="button" className="fig-dashboard-bell" aria-label="Notifications"><img src="/assets/dashboard/dashboard-notifications.svg" alt="" /></button>
                        <div className="fig-dashboard-avatar">BO</div>
                    </div>
                </header>

                <section style={{ padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "500px" }}>
                    <div style={{ textAlign: "center", maxWidth: "480px" }}>
                        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "32px" }}>🏗️</div>
                        <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#1f2d3d", margin: "0 0 12px" }}>Workspace</h2>
                        <p style={{ fontSize: "16px", color: "#6b7280", margin: "0 0 8px" }}>
                            Team collaboration and workspace management features are coming soon.
                        </p>
                        <p style={{ fontSize: "14px", color: "#9ca3af", margin: "0 0 32px" }}>
                            You&apos;ll be able to manage team members, assign roles, and collaborate on projects from here.
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
