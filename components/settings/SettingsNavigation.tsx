"use client";

import { SettingsNavItem, SettingsTab } from "@/lib/settings/types";

export interface NavItem {
    key: string;
    label: string;
}

export const CLIENT_SETTINGS_NAV_ITEMS: NavItem[] = [
    { key: "profile", label: "My Profile" },
    { key: "notifications", label: "Notifications" },
    { key: "security", label: "Security & Sessions" },
    { key: "preferences", label: "Preferences" },
];

export interface SettingsNavigationProps {
    activeTab: string;
    onSelectTab: (tab: any) => void;
    items?: NavItem[];
}

const defaultNavItems: SettingsNavItem[] = [
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
    items,
}: SettingsNavigationProps) {
    const navItemsToRender = items || defaultNavItems;

    return (
        <nav className="settings-nav-bar" aria-label="Settings navigation">
            <div className="settings-nav-tabs">
                {navItemsToRender.map((item) => {
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
