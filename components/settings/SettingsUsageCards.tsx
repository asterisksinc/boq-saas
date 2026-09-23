"use client";

interface SettingsUsageCardsProps {
    projects: number;
    boqs: number;
    storage: string;
}

export default function SettingsUsageCards({
    projects,
    boqs,
    storage,
}: SettingsUsageCardsProps) {
    return (
        <div className="settings-kpi-grid">
            {/* Card 1: Projects */}
            <div className="settings-kpi-card">
                <span className="settings-kpi-label">Projects</span>
                <span className="settings-kpi-value">{projects}</span>
            </div>

            {/* Card 2: BOQS */}
            <div className="settings-kpi-card">
                <span className="settings-kpi-label">BOQS</span>
                <span className="settings-kpi-value">{boqs}</span>
            </div>

            {/* Card 3: Storage */}
            <div className="settings-kpi-card settings-kpi-storage">
                <div className="settings-kpi-storage-left">
                    <span className="settings-kpi-label">Storage</span>
                    <span className="settings-kpi-value">{storage}</span>
                </div>
               
            </div>
        </div>
    );
}
