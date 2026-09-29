"use client";

import { ChevronRight } from "lucide-react";

export type AdditionalSubSection = "data-export" | "data-retention" | "delete-account";

interface AdditionalSubNavigationProps {
    activeSection: AdditionalSubSection;
    onSelectSection: (section: AdditionalSubSection) => void;
}

const menuItems: Array<{ id: AdditionalSubSection; label: string }> = [
    { id: "data-export", label: "Data Export" },
    { id: "data-retention", label: "Data Retention" },
    { id: "delete-account", label: "Delete Account" },
];

export default function AdditionalSubNavigation({
    activeSection,
    onSelectSection,
}: AdditionalSubNavigationProps) {
    return (
        <aside className="additional-subnav-panel" aria-label="Additional settings menu">
            <div className="additional-subnav-header">SELECT MENU</div>
            <nav className="additional-subnav-list">
                {menuItems.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={`additional-subnav-item ${isActive ? "is-active" : ""}`}
                            onClick={() => onSelectSection(item.id)}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <span>{item.label}</span>
                            {isActive && (
                                <ChevronRight size={16} className="additional-subnav-chevron" />
                            )}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
