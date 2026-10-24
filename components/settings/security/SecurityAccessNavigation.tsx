"use client";

import { ChevronRight } from "lucide-react";

export type SecuritySubTab = "user" | "roles";

interface SubNavItem {
    key: SecuritySubTab;
    label: string;
}

const navItems: SubNavItem[] = [
    { key: "user", label: "User" },
    { key: "roles", label: "Roles & Privileges" },
];

interface SecurityAccessNavigationProps {
    activeSubTab: SecuritySubTab;
    onSelectSubTab: (tab: SecuritySubTab) => void;
}

export default function SecurityAccessNavigation({
    activeSubTab,
    onSelectSubTab,
}: SecurityAccessNavigationProps) {
    return (
        <aside className="security-subnav-card org-subnav-card" aria-label="Security & Access sub-navigation">
            <div className="security-subnav-header org-subnav-header">SELECT MENU</div>
            <nav className="security-subnav-list org-subnav-list" role="tablist">
                {navItems.map((item) => {
                    const isActive = activeSubTab === item.key;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`security-subnav-item org-subnav-item ${isActive ? "is-active" : ""}`}
                            onClick={() => onSelectSubTab(item.key)}
                        >
                            <span className="security-subnav-label org-subnav-label">{item.label}</span>
                            {isActive && <ChevronRight size={18} className="security-subnav-chevron org-subnav-chevron" aria-hidden="true" />}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
