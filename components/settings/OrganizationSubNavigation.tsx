"use client";

import { ChevronRight } from "lucide-react";

export type OrganizationSubTab =
    | "company-profile"
    | "business-info"
    | "gst-tax"
    | "locations";

interface SubNavItem {
    key: OrganizationSubTab;
    label: string;
}

const navItems: SubNavItem[] = [
    { key: "company-profile", label: "Company Profile" },
    { key: "business-info", label: "Business Info" },
    { key: "gst-tax", label: "GST & Tax" },
    { key: "locations", label: "Locations" },
];

interface OrganizationSubNavigationProps {
    activeSubTab: OrganizationSubTab;
    onSelectSubTab: (tab: OrganizationSubTab) => void;
}

export default function OrganizationSubNavigation({
    activeSubTab,
    onSelectSubTab,
}: OrganizationSubNavigationProps) {
    return (
        <aside className="org-subnav-card" aria-label="Organization sub-navigation">
            <div className="org-subnav-header">SELECT MENU</div>
            <nav className="org-subnav-list" role="tablist">
                {navItems.map((item) => {
                    const isActive = activeSubTab === item.key;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`org-subnav-item ${isActive ? "is-active" : ""}`}
                            onClick={() => onSelectSubTab(item.key)}
                        >
                            <span className="org-subnav-label">{item.label}</span>
                            {isActive && <ChevronRight size={16} className="org-subnav-chevron" aria-hidden="true" />}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
