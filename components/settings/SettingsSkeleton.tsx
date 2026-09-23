"use client";

export default function SettingsSkeleton() {
    return (
        <div className="settings-overview-layout settings-skeleton-animate" aria-busy="true" aria-label="Loading settings...">
            {/* Profile Header Skeleton */}
            <div className="settings-profile-card">
                <div className="settings-profile-top">
                    <div className="settings-profile-user">
                        <div className="skeleton skeleton-avatar" />
                        <div className="settings-profile-meta">
                            <div className="skeleton skeleton-title" style={{ width: "160px", height: "20px" }} />
                            <div className="skeleton skeleton-subtitle" style={{ width: "240px", height: "14px", marginTop: "8px" }} />
                        </div>
                    </div>
                    <div className="skeleton skeleton-btn" style={{ width: "100px", height: "36px", borderRadius: "8px" }} />
                </div>
                <div className="settings-profile-progress-wrap" style={{ marginTop: "24px" }}>
                    <div className="skeleton" style={{ flex: 1, height: "8px", borderRadius: "9999px" }} />
                    <div className="skeleton" style={{ width: "36px", height: "14px" }} />
                </div>
            </div>

            {/* KPI Cards Skeleton */}
            <div className="settings-kpi-grid">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="settings-kpi-card">
                        <div className="skeleton skeleton-subtitle" style={{ width: "60px", height: "12px" }} />
                        <div className="skeleton skeleton-title" style={{ width: "40px", height: "32px", marginTop: "8px" }} />
                    </div>
                ))}
            </div>

            {/* Configuration Health Skeleton */}
            <div className="settings-section">
                <div className="skeleton skeleton-title" style={{ width: "180px", height: "20px", marginBottom: "16px" }} />
                <div className="settings-health-grid">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="settings-health-card" style={{ cursor: "default" }}>
                            <div className="settings-health-card-top">
                                <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "10px" }} />
                                <div className="skeleton" style={{ width: "50px", height: "20px", borderRadius: "9999px" }} />
                            </div>
                            <div className="settings-health-card-bottom" style={{ marginTop: "16px" }}>
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton skeleton-title" style={{ width: "100px", height: "14px" }} />
                                    <div className="skeleton skeleton-subtitle" style={{ width: "130px", height: "12px", marginTop: "6px" }} />
                                </div>
                                <div className="skeleton" style={{ width: "24px", height: "24px", borderRadius: "6px" }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Changes Skeleton */}
            <div className="settings-section">
                <div className="skeleton skeleton-title" style={{ width: "140px", height: "20px", marginBottom: "16px" }} />
                <div className="settings-recent-changes-card" style={{ padding: "16px" }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 4 ? "1px solid #f1f5f9" : "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div className="skeleton" style={{ width: "36px", height: "36px", borderRadius: "50%" }} />
                                <div>
                                    <div className="skeleton skeleton-title" style={{ width: "120px", height: "14px" }} />
                                    <div className="skeleton skeleton-subtitle" style={{ width: "180px", height: "12px", marginTop: "6px" }} />
                                </div>
                            </div>
                            <div className="skeleton" style={{ width: "48px", height: "12px" }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
