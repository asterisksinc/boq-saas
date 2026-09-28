"use client";

import { useEffect, useState } from "react";
import SecurityAccessNavigation, { SecuritySubTab } from "./SecurityAccessNavigation";
import UsersSection from "./UsersSection";
import RoleSection from "./RoleSection";

interface SecurityAccessLayoutProps {
    showNotice: (message: string, type?: "success" | "error") => void;
    userRole?: string;
}

export default function SecurityAccessLayout({
    showNotice,
    userRole,
}: SecurityAccessLayoutProps) {
    const [activeSubTab, setActiveSubTab] = useState<SecuritySubTab>("user");

    // Initialize subtab from URL query param if present
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const sub = params.get("subtab");
            if (sub === "user" || sub === "roles") {
                setActiveSubTab(sub);
            }
        }
    }, []);

    const handleSelectSubTab = (tab: SecuritySubTab) => {
        setActiveSubTab(tab);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("subtab", tab);
            window.history.replaceState({}, "", url.toString());
        }
    };

    return (
        <div className="security-access-container">
            <SecurityAccessNavigation
                activeSubTab={activeSubTab}
                onSelectSubTab={handleSelectSubTab}
            />

            <div className="security-access-content">
                {activeSubTab === "user" ? (
                    <UsersSection showNotice={showNotice} userRole={userRole} />
                ) : (
                    <RoleSection showNotice={showNotice} userRole={userRole} />
                )}
            </div>
        </div>
    );
}
