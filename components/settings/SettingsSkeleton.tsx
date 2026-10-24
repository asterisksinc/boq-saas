"use client";

export default function SettingsSkeleton() {
    return (
        <div className="settings-overview-layout settings-skeleton-animate" aria-busy="true" aria-label="Loading settings...">
            {/* Profile Header Skeleton (Frame 93) */}
            <div className="settings-profile-card">
                <div className="settings-profile-top">
                    <div className="settings-profile-user">
                        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%" }} />
                        <div className="settings-profile-meta">
                            <div className="skeleton skeleton-title" style={{ width: 140, height: 20 }} />
                            <div className="skeleton skeleton-subtitle" style={{ width: 200, height: 14, marginTop: 6 }} />
                        </div>
                    </div>
                    <div className="skeleton skeleton-btn" style={{ width: 99, height: 34, borderRadius: 6 }} />
                </div>
                <div className="settings-profile-progress-wrap">
                    <div className="skeleton" style={{ flex: 1, height: 8, borderRadius: 9999 }} />
                    <div className="skeleton" style={{ width: 28, height: 14 }} />
                </div>
            </div>

            {/* KPI Cards Skeleton (Frame 2147225138) */}
            <div className="settings-kpi-grid">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="settings-kpi-card">
                        <div className="skeleton skeleton-subtitle" style={{ width: 60, height: 14 }} />
                        <div className="skeleton skeleton-title" style={{ width: 50, height: 28, marginTop: 8 }} />
                    </div>
                ))}
            </div>

            {/* Configuration Health Skeleton (Frame 2147225140) */}
            <div className="settings-config-card">
                <div className="skeleton skeleton-title" style={{ width: 140, height: 17 }} />
                <div className="settings-health-grid">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="settings-health-card" style={{ cursor: "default" }}>
                            <div className="settings-health-card-top">
                                <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 8 }} />
                                <div className="skeleton" style={{ width: 44, height: 18, borderRadius: 9999 }} />
                            </div>
                            <div className="settings-health-card-bottom">
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton skeleton-title" style={{ width: 90, height: 14 }} />
                                    <div className="skeleton skeleton-subtitle" style={{ width: 120, height: 12, marginTop: 4 }} />
                                </div>
                                <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 6 }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Changes Skeleton (Frame 2147225141) */}
            <div className="settings-recent-card">
                <div className="skeleton skeleton-title" style={{ width: 120, height: 17 }} />
                <div className="settings-recent-list">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="settings-recent-entry">
                            <div className="settings-recent-row">
                                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                                <div className="settings-recent-content">
                                    <div className="settings-recent-details">
                                        <div className="skeleton skeleton-title" style={{ width: 100, height: 14 }} />
                                        <div className="skeleton skeleton-subtitle" style={{ width: 160, height: 12 }} />
                                    </div>
                                    <div className="skeleton" style={{ width: 40, height: 12 }} />
                                </div>
                            </div>
                            {i < 4 && <div className="settings-recent-divider" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
