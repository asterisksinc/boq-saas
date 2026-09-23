"use client";

import { SettingsNavItem, SettingsTab } from "@/lib/settings/types";

interface SettingsNavigationProps {
    activeTab: SettingsTab;
    onSelectTab: (tab: SettingsTab) => void;
}

const navItems: SettingsNavItem[] = [
    { key: "overview", label: "Overview" },
    { key: "profile", label: "My Profile" },
    { key: "organization", label: "Organization" },
    { key: "branding", label: "Branding" },
    { key: "boq-costing", label: "BOQ & Costing" },
    { key: "integrations", label: "Integrations" },
    { key: "notifications", label: "Notifications" },
    { key: "security", label: "Security & Access" },
    { key: "advanced", label: "Advanced" },
    { key: "additional", label: "Additional" },
];

export default function SettingsNavigation({
    activeTab,
    onSelectTab,
}: SettingsNavigationProps) {
    return (
        <nav className="settings-nav-bar" aria-label="Settings navigation">
            <div className="settings-nav-tabs">
                {navItems.map((item) => {
                    const isActive = activeTab === item.key;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            className={`settings-nav-tab ${isActive ? "is-active" : ""}`}
                            onClick={() => onSelectTab(item.key)}
                            aria-current={isActive ? "page" : undefined}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
