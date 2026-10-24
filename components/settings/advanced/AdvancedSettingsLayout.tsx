"use client";

import { useCallback, useEffect, useState } from "react";
import {
    getLoginHistory,
    getSecuritySettings,
    revokeOtherSessions,
    revokeSession,
    UserSecuritySettings,
    LoginHistoryItem,
} from "@/lib/api/auth";
import AdvancedSubNavigation, { AdvancedSubSection } from "./AdvancedSubNavigation";
import PasswordSecurityCard from "./PasswordSecurityCard";
import TwoFactorAuthCard from "./TwoFactorAuthCard";
import TwoFactorManageModal from "./TwoFactorManageModal";
import LoginHistorySection from "./LoginHistorySection";
import ActiveSessionsSection from "./ActiveSessionsSection";
import ChangePasswordModal from "../ChangePasswordModal";

interface AdvancedSettingsLayoutProps {
    showNotice: (message: string, type?: "success" | "error") => void;
    overview?: unknown;
}

export default function AdvancedSettingsLayout({
    showNotice,
}: AdvancedSettingsLayoutProps) {
    const [activeSection, setActiveSection] = useState<AdvancedSubSection>("password-2fa");
    const [security, setSecurity] = useState<UserSecuritySettings | null>(null);
    const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);

    // Sync activeSection with URL search params and popstate
    useEffect(() => {
        const syncFromUrl = () => {
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                const sectionParam = params.get("section") as AdvancedSubSection | null;
                if (
                    sectionParam &&
                    ["password-2fa", "login-history", "active-sessions"].includes(sectionParam)
                ) {
                    setActiveSection(sectionParam);
                }
            }
        };

        syncFromUrl();
        window.addEventListener("popstate", syncFromUrl);
        return () => window.removeEventListener("popstate", syncFromUrl);
    }, []);

    const handleSelectSection = (section: AdvancedSubSection) => {
        setActiveSection(section);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", "advanced");
            url.searchParams.set("section", section);
            window.history.replaceState({}, "", url.toString());
        }
    };

    const loadSecurityData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const secData = await getSecuritySettings();
            setSecurity(secData);

            if (secData.loginHistory && secData.loginHistory.length > 0) {
                setLoginHistory(secData.loginHistory);
            } else {
                try {
                    const hist = await getLoginHistory();
                    setLoginHistory(hist);
                } catch {
                    setLoginHistory([]);
                }
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load security settings.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSecurityData();
    }, [loadSecurityData]);

    const handlePasswordSuccess = () => {
        showNotice("Password changed successfully.", "success");
        loadSecurityData();
    };

    const handleTwoFactorSuccess = () => {
        showNotice("Two-factor authentication updated.", "success");
        loadSecurityData();
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            if (sessionId === "all" || sessionId === "others") {
                await revokeOtherSessions();
            } else {
                await revokeSession(sessionId);
            }
            showNotice("Session revoked successfully.", "success");
            await loadSecurityData();
        } catch (err: unknown) {
            showNotice(err instanceof Error ? err.message : "Failed to revoke session.", "error");
            throw err;
        }
    };

    const lastChangedText = security?.password?.display || "Last changed 90 days ago";
    const twoFactorEnabled = security?.twoFactor?.enabled ?? false;
    const twoFactorStatus = security?.twoFactor?.display || (twoFactorEnabled ? "Enabled - Authenticator App" : "Disabled");
    const sessions = security?.sessions || [];

    return (
        <div className="advanced-settings-layout" data-testid="advanced-settings-layout">
            {/* ── Left Sidebar Submenu: SELECT MENU (Frame 2147225543) ── */}
            <AdvancedSubNavigation
                activeSection={activeSection}
                onSelectSection={handleSelectSection}
            />

            {/* ── Main Content Area: Frame 2147225145 ── */}
            <div
                className={`advanced-main-content ${activeSection === "login-history" ? "is-login-history" : ""}`}
                data-testid="advanced-main-content"
                data-section={activeSection}
            >
                {activeSection === "password-2fa" && (
                    <div className="advanced-cards-stack" data-testid="password-2fa-stack">
                        {/* ── Row 1: Password (Frame 95) ── */}
                        <PasswordSecurityCard
                            lastChangedText={lastChangedText}
                            onChangePassword={() => setPasswordModalOpen(true)}
                            loading={loading}
                        />

                        {/* ── Row 2: Two-Factor Auth (Frame 96) ── */}
                        <TwoFactorAuthCard
                            statusText={twoFactorStatus}
                            onManageClick={() => setTwoFactorModalOpen(true)}
                            loading={loading}
                        />
                    </div>
                )}

                {activeSection === "login-history" && (
                    <LoginHistorySection
                        history={loginHistory}
                        loading={loading}
                        error={error}
                        onRetry={loadSecurityData}
                    />
                )}

                {activeSection === "active-sessions" && (
                    <ActiveSessionsSection
                        sessions={sessions}
                        loading={loading}
                        error={error}
                        onRevoke={handleRevokeSession}
                        onRetry={loadSecurityData}
                    />
                )}
            </div>

            {/* ── Change Password Modal Dialog ── */}
            <ChangePasswordModal
                isOpen={passwordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
                onSuccess={handlePasswordSuccess}
            />

            {/* ── 2FA Management Modal Dialog ── */}
            <TwoFactorManageModal
                isOpen={twoFactorModalOpen}
                isEnabled={twoFactorEnabled}
                onClose={() => setTwoFactorModalOpen(false)}
                onSuccess={handleTwoFactorSuccess}
            />
        </div>
    );
}
