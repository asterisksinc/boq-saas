"use client";

import { ChevronRight } from "lucide-react";
import { BrandSubTab } from "@/lib/settings/types";

interface SubNavItem {
    key: BrandSubTab;
    label: string;
}

const navItems: SubNavItem[] = [
    { key: "brand-assets", label: "Brand Assets" },
    { key: "brand-system", label: "Brand System" },
    { key: "document-preview", label: "Document Preview" },
];

interface BrandingSubNavigationProps {
    activeSubTab: BrandSubTab;
    onSelectSubTab: (tab: BrandSubTab) => void;
}

export default function BrandingSubNavigation({
    activeSubTab,
    onSelectSubTab,
}: BrandingSubNavigationProps) {
    return (
        <aside className="org-subnav-card" aria-label="Branding navigation">
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
