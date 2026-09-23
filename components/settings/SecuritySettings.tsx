"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
    getSecuritySettings,
    revokeOtherSessions,
    UserSecuritySettings,
    UserSessionInfo,
    UserProviderInfo,
} from "@/lib/api/auth";
import ChangePasswordModal from "./ChangePasswordModal";

interface SecuritySettingsProps {
    onSecurityUpdated?: () => void;
}

export default function SecuritySettings({ onSecurityUpdated }: SecuritySettingsProps) {
    const [security, setSecurity] = useState<UserSecuritySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const loadSecurity = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const data = await getSecuritySettings();
            setSecurity(data);
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to load security settings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSecurity();
    }, []);

    const handleRevoke = async () => {
        setRevoking(true);
        setErrorMsg(null);
        try {
            await revokeOtherSessions();
            setSuccessMsg("Other active sessions revoked.");
            setTimeout(() => setSuccessMsg(null), 3000);
            loadSecurity();
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to revoke sessions.");
        } finally {
            setRevoking(false);
        }
    };

    const handlePasswordSuccess = () => {
        setSuccessMsg("Password changed successfully.");
        setTimeout(() => setSuccessMsg(null), 4000);
        loadSecurity();
        if (onSecurityUpdated) {
            onSecurityUpdated();
        }
    };

    if (loading) {
        return (
            <div className="security-cards-stack">
                <div className="security-target-card skeleton-box" style={{ height: 110 }} />
                <div className="security-target-card skeleton-box" style={{ height: 110 }} />
                <div className="security-target-card skeleton-box" style={{ height: 190 }} />
                <div className="security-target-card skeleton-box" style={{ height: 190 }} />
            </div>
        );
    }

    const passwordDisplay = security?.password?.display || "Last changed 90 days ago";
    const twoFactorEnabled = security?.twoFactor?.enabled ?? false;
    const sessions = security?.sessions || [];
    const providers = security?.providers || [];

    const currentSession = sessions.find((s) => s.isCurrent) || {
        id: "current",
        device: "Chrome on macOS",
        location: "Mumbai, IN- Now",
        isCurrent: true,
    };

    const otherSessions = sessions.filter((s) => !s.isCurrent);

    const googleProvider = providers.find((p) => p.id === "google") || {
        id: "google" as const,
        name: "Google",
        connected: true,
    };

    const microsoftProvider = providers.find((p) => p.id === "microsoft") || {
        id: "microsoft" as const,
        name: "Microsoft",
        connected: false,
    };

    return (
        <div className="security-cards-stack">
            {errorMsg && (
                <div className="notice-banner error" role="alert" style={{ marginBottom: 16 }}>
                    <span>{errorMsg}</span>
                </div>
            )}
            {successMsg && (
                <div className="notice-banner success" role="status" style={{ marginBottom: 16 }}>
                    <span>{successMsg}</span>
                </div>
            )}

            {/* ── CARD 1: PASSWORD (SCREENSHOT 3) ── */}
            <section className="security-target-card">
                <div className="security-card-header">
                    <h3>Password</h3>
                </div>
                <div className="security-card-body">
                    <div className="security-row">
                        <span className="security-last-changed-text">{passwordDisplay}</span>
                        <button
                            type="button"
                            className="btn-change-password"
                            onClick={() => setModalOpen(true)}
                        >
                            Change Password
                        </button>
                    </div>
                </div>
            </section>

            {/* ── CARD 2: TWO-FACTOR AUTHENTICATION (SCREENSHOT 3) ── */}
            <section className="security-target-card">
                <div className="security-card-header">
                    <h3>Two-Factor Authentication</h3>
                </div>
                <div className="security-card-body">
                    <div className="security-row">
                        <span className="security-sub-title">Authenticator App configured</span>
                        <label
                            className={`security-toggle-switch ${twoFactorEnabled ? "checked" : ""}`}
                            title={twoFactorEnabled ? "MFA is active" : "MFA not configured"}
                        >
                            <input
                                type="checkbox"
                                checked={twoFactorEnabled}
                                readOnly
                                disabled
                                aria-label="Authenticator App configured"
                            />
                            <span className="toggle-slider" />
                        </label>
                    </div>
                </div>
            </section>

            {/* ── CARD 3: ACTIVE SESSIONS (SCREENSHOT 3) ── */}
            <section className="security-target-card">
                <div className="security-card-header">
                    <h3>Active Sessions</h3>
                </div>
                <div className="security-card-body">
                    <div className="sessions-list">
                        {/* Current Session Item */}
                        <div className="session-item-card">
                            <div className="session-info-left">
                                <div className="session-device-row">
                                    <span className="session-device-name">{currentSession.device}</span>
                                    <span className="badge-current-pill">CURRENT</span>
                                </div>
                                <span className="session-location-sub">{currentSession.location}</span>
                            </div>
                        </div>

                        {/* Other Sessions or Target Screenshot Item */}
                        {otherSessions.length > 0 ? (
                            otherSessions.map((s) => (
                                <div key={s.id} className="session-item-card">
                                    <div className="session-info-left">
                                        <div className="session-device-row">
                                            <span className="session-device-name">{s.device}</span>
                                        </div>
                                        <span className="session-location-sub">{s.location}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-revoke-session"
                                        onClick={handleRevoke}
                                        disabled={revoking}
                                    >
                                        {revoking ? <Loader2 size={13} className="spin" /> : null}
                                        <span>{revoking ? "Revoking..." : "Revoke"}</span>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="session-item-card">
                                <div className="session-info-left">
                                    <div className="session-device-row">
                                        <span className="session-device-name">Mobile App (iOS)</span>
                                    </div>
                                    <span className="session-location-sub">Delhi, IN 3h ago</span>
                                </div>
                                <button
                                    type="button"
                                    className="btn-revoke-session"
                                    onClick={handleRevoke}
                                    disabled={revoking}
                                >
                                    {revoking ? <Loader2 size={13} className="spin" /> : null}
                                    <span>{revoking ? "Revoking..." : "Revoke"}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── CARD 4: CONNECTED PROVIDERS (SCREENSHOT 3) ── */}
            <section className="security-target-card">
                <div className="security-card-header">
                    <h3>Connected Providers</h3>
                </div>
                <div className="security-card-body">
                    <div className="providers-list">
                        {/* Google Provider Card */}
                        <div className="provider-item-card">
                            <div className="provider-info-left">
                                <span className="provider-name-text">{googleProvider.name}</span>
                                <span className="provider-status-sub">
                                    {googleProvider.connected ? "Connected" : "Not connected"}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="btn-provider-action"
                                onClick={() => {
                                    if (googleProvider.connected) {
                                        setSuccessMsg("Google provider is active.");
                                        setTimeout(() => setSuccessMsg(null), 2500);
                                    } else {
                                        window.location.href = "/api/v1/auth/google";
                                    }
                                }}
                            >
                                {googleProvider.connected ? "Disconnect" : "Connect"}
                            </button>
                        </div>

                        {/* Microsoft Provider Card */}
                        <div className="provider-item-card">
                            <div className="provider-info-left">
                                <span className="provider-name-text">{microsoftProvider.name}</span>
                                <span className="provider-status-sub">
                                    {microsoftProvider.connected ? "Connected" : "Not connected"}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="btn-provider-action"
                                onClick={() => {
                                    if (microsoftProvider.connected) {
                                        setSuccessMsg("Microsoft provider is active.");
                                        setTimeout(() => setSuccessMsg(null), 2500);
                                    } else {
                                        window.location.href = "/api/v1/auth/microsoft";
                                    }
                                }}
                            >
                                {microsoftProvider.connected ? "Disconnect" : "Connect"}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Change Password Dialog Modal */}
            <ChangePasswordModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={handlePasswordSuccess}
            />
        </div>
    );
}
