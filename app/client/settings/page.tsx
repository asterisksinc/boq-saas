"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, User, Bell, Shield, Sliders } from "lucide-react";

import {
    getSettingsOverview,
    SettingsOverview,
} from "@/lib/api/auth";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import MyProfile from "@/components/settings/MyProfile";
import SettingsNotifications from "@/components/settings/SettingsNotifications";
import SecuritySettings from "@/components/settings/SecuritySettings";
import PreferencesSettings from "@/components/settings/PreferencesSettings";
import SettingsSkeleton from "@/components/settings/SettingsSkeleton";
import { SettingsErrorState } from "@/components/settings/SettingsEmptyState";

type ClientSettingsTab = "profile" | "notifications" | "security" | "preferences";

interface ClientTabItem {
    key: ClientSettingsTab;
    label: string;
    icon: typeof User;
}

const clientTabs: ClientTabItem[] = [
    { key: "profile", label: "My Profile", icon: User },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "security", label: "Security & Sessions", icon: Shield },
    { key: "preferences", label: "Preferences", icon: Sliders },
];

export default function ClientSettingsPage() {
    const [overview, setOverview] = useState<SettingsOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ClientSettingsTab>("profile");
    const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadOverview = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSettingsOverview();
            setOverview(data);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Could not load settings.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOverview();
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get("tab") as ClientSettingsTab | null;
            if (tabParam && ["profile", "notifications", "security", "preferences"].includes(tabParam)) {
                setActiveTab(tabParam);
            }
        }
    }, [loadOverview]);

    const showNotice = (message: string, type: "success" | "error" = "success") => {
        setNotice({ message, type });
        setTimeout(() => setNotice(null), 4000);
    };

    const handleSelectTab = (tab: ClientSettingsTab) => {
        setActiveTab(tab);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", tab);
            window.history.replaceState({}, "", url.toString());
        }
    };

    return (
        <div className="fig-dashboard">
            <ClientDashboardRail current="/client/settings" />
            <div className="fig-dashboard-glow" />

            <main className="fig-dashboard-main">
                <DashboardHeader title="Client Settings" hideNew={true} />

                <section className="settings-content" style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
                    {notice && (
                        <div
                            className={`notice-banner ${notice.type}`}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                marginBottom: "20px",
                                background: notice.type === "success" ? "#dcfce7" : "#fee2e2",
                                color: notice.type === "success" ? "#15803d" : "#b91c1c",
                                border: `1px solid ${notice.type === "success" ? "#86efac" : "#fca5a5"}`,
                                fontSize: "13px",
                                fontWeight: "500",
                            }}
                        >
                            {notice.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            <span>{notice.message}</span>
                        </div>
                    )}

                    {/* Navigation bar with matching User Dashboard styling */}
                    <div style={{ marginBottom: "24px" }}>
                        <nav className="settings-nav-bar" aria-label="Client settings navigation">
                            <div className="settings-nav-tabs">
                                {clientTabs.map((tab) => {
                                    const isActive = activeTab === tab.key;
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            className={`settings-nav-tab ${isActive ? "is-active" : ""}`}
                                            onClick={() => handleSelectTab(tab.key)}
                                            aria-current={isActive ? "page" : undefined}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                fontWeight: isActive ? 600 : 500,
                                                color: isActive ? "#2563eb" : "#64748b",
                                                backgroundColor: isActive ? "#eff6ff" : "transparent",
                                            }}
                                        >
                                            <Icon size={15} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>
                    </div>

                    {loading ? (
                        <SettingsSkeleton />
                    ) : error ? (
                        <SettingsErrorState message={error} onRetry={loadOverview} />
                    ) : (
                        <div className="settings-panel-container">
                            {activeTab === "profile" && (
                                <MyProfile
                                    overview={overview}
                                    onProfileUpdated={() => {
                                        showNotice("Profile updated successfully.", "success");
                                        loadOverview();
                                    }}
                                />
                            )}

                            {activeTab === "notifications" && (
                                <SettingsNotifications
                                    showNotice={showNotice}
                                    userRole="client"
                                />
                            )}

                            {activeTab === "security" && (
                                <SecuritySettings
                                    onSecurityUpdated={() => {
                                        showNotice("Security preferences updated.", "success");
                                        loadOverview();
                                    }}
                                />
                            )}

                            {activeTab === "preferences" && (
                                <PreferencesSettings
                                    overview={overview}
                                    onPreferencesUpdated={() => {
                                        showNotice("Preferences saved successfully.", "success");
                                        loadOverview();
                                    }}
                                />
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
