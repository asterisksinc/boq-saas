"use client";

import { ChevronRight } from "lucide-react";

export type AdvancedSubSection = "password-2fa" | "login-history" | "active-sessions";

interface AdvancedSubNavigationProps {
    activeSection: AdvancedSubSection;
    onSelectSection: (section: AdvancedSubSection) => void;
}

const menuItems: Array<{ id: AdvancedSubSection; label: string }> = [
    { id: "password-2fa", label: "Password & 2FA" },
    { id: "login-history", label: "Login History" },
    { id: "active-sessions", label: "Active Sessions" },
];

export default function AdvancedSubNavigation({
    activeSection,
    onSelectSection,
}: AdvancedSubNavigationProps) {
    return (
        <aside className="advanced-subnav-panel" aria-label="Advanced settings menu">
            <div className="advanced-subnav-header">SELECT MENU</div>
            <nav className="advanced-subnav-list">
                {menuItems.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={`advanced-subnav-item ${isActive ? "is-active" : ""}`}
                            onClick={() => onSelectSection(item.id)}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <span>{item.label}</span>
                            {isActive && (
                                <ChevronRight size={16} className="advanced-subnav-chevron" />
                            )}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
