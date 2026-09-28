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
        <aside className="org-subnav-card" aria-label="Security & Access sub-navigation">
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
