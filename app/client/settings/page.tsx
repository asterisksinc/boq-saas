"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
    getSettingsOverview,
    SettingsOverview,
} from "@/lib/api/auth";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import SettingsLayout from "@/components/settings/SettingsLayout";
import SettingsNavigation, { CLIENT_SETTINGS_NAV_ITEMS, NavItem } from "@/components/settings/SettingsNavigation";
import MyProfile from "@/components/settings/MyProfile";
import SettingsNotifications from "@/components/settings/SettingsNotifications";
import SecuritySettings from "@/components/settings/SecuritySettings";
import PreferencesSettings from "@/components/settings/PreferencesSettings";
import SettingsSkeleton from "@/components/settings/SettingsSkeleton";
import { SettingsErrorState } from "@/components/settings/SettingsEmptyState";

type ClientSettingsTab = "profile" | "notifications" | "security" | "preferences";

const clientTabs: NavItem[] = [
    { key: "profile", label: "My Profile" },
    { key: "notifications", label: "Notifications" },
    { key: "security", label: "Security & Sessions" },
    { key: "preferences", label: "Preferences" },
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

    const userInitials = useMemo(() => {
        const name = overview?.profile?.displayName?.trim();
        if (!name) return "CL";
        const parts = name.split(/\s+/);
        if (parts.length > 1) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }, [overview]);

    const renderTabContent = () => {
        if (loading) {
            return <SettingsSkeleton />;
        }

        if (error) {
            return <SettingsErrorState message={error} onRetry={loadOverview} />;
        }

        switch (activeTab) {
            case "profile":
                return (
                    <MyProfile
                        overview={overview}
                        onProfileUpdated={() => {
                            showNotice("Profile updated successfully.", "success");
                            loadOverview();
                        }}
                    />
                );
            case "notifications":
                return (
                    <SettingsNotifications
                        showNotice={showNotice}
                        userRole="client"
                    />
                );
            case "security":
                return (
                    <SecuritySettings
                        onSecurityUpdated={() => {
                            showNotice("Security preferences updated.", "success");
                            loadOverview();
                        }}
                    />
                );
            case "preferences":
                return (
                    <PreferencesSettings
                        overview={overview}
                        onPreferencesUpdated={() => {
                            showNotice("Preferences saved successfully.", "success");
                            loadOverview();
                        }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <SettingsLayout
            rail={<ClientDashboardRail current="/client/settings" />}
            header={<DashboardHeader title="Client Settings" hideNew={true} avatarUrl={overview?.profile?.avatarUrl} userInitials={userInitials} />}
            notice={notice}
            navigation={
                <SettingsNavigation
                    activeTab={activeTab}
                    onSelectTab={(tab) => handleSelectTab(tab as ClientSettingsTab)}
                    items={clientTabs}
                />
            }
        >
            {renderTabContent()}
        </SettingsLayout>
    );
}
