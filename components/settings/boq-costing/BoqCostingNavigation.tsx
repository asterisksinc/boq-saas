"use client";

import { ChevronRight } from "lucide-react";
import { BoqCostingSubTab } from "@/lib/settings/types";

interface SubNavItem {
    key: BoqCostingSubTab;
    label: string;
}

const navItems: SubNavItem[] = [
    { key: "units", label: "Units" },
    { key: "numbering", label: "Numbering" },
    { key: "tax-rules", label: "Tax Rules" },
    { key: "pricing-rules", label: "Pricing Rules" },
    { key: "revision-rules", label: "Revision Rules" },
    { key: "approval-rules", label: "Approval Rules" },
];

interface BoqCostingNavigationProps {
    activeSubTab: BoqCostingSubTab;
    onSelectSubTab: (tab: BoqCostingSubTab) => void;
}

export default function BoqCostingNavigation({
    activeSubTab,
    onSelectSubTab,
}: BoqCostingNavigationProps) {
    return (
        <aside className="boq-subnav-card" aria-label="BOQ & Costing sub-navigation">
            <div className="boq-subnav-header">SELECT MENU</div>
            <nav className="boq-subnav-list" role="tablist">
                {navItems.map((item) => {
                    const isActive = activeSubTab === item.key;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`boq-subnav-item ${isActive ? "is-active" : ""}`}
                            onClick={() => onSelectSubTab(item.key)}
                        >
                            <span className="boq-subnav-label">{item.label}</span>
                            {isActive && <ChevronRight size={16} className="boq-subnav-chevron" aria-hidden="true" />}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
