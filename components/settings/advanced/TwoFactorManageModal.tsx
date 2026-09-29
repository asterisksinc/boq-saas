"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, Loader2, ShieldCheck, X } from "lucide-react";
import { disableTwoFactor, enrollTwoFactor, verifyTwoFactor } from "@/lib/api/auth";

interface TwoFactorManageModalProps {
    isOpen: boolean;
    onClose: () => void;
    isEnabled: boolean;
    onSuccess: () => void;
}

export default function TwoFactorManageModal({
    isOpen,
    onClose,
    isEnabled,
    onSuccess,
}: TwoFactorManageModalProps) {
    const [loadingEnroll, setLoadingEnroll] = useState(false);
    const [factorId, setFactorId] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [confirmDisable, setConfirmDisable] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setFactorId(null);
            setQrCode(null);
            setSecret(null);
            setVerificationCode("");
            setErrorMsg(null);
            setCopied(false);
            setConfirmDisable(false);
            return;
        }

        if (!isEnabled) {
            // Initiate TOTP enrollment
            setLoadingEnroll(true);
            setErrorMsg(null);
            enrollTwoFactor()
                .then((res) => {
                    setFactorId(res.factorId);
                    setQrCode(res.qrCode || null);
                    setSecret(res.secret || null);
                })
                .catch((err) => {
                    setErrorMsg(err instanceof Error ? err.message : "Failed to generate 2FA setup details.");
                })
                .finally(() => {
                    setLoadingEnroll(false);
                });
        }
    }, [isOpen, isEnabled]);

    if (!isOpen) return null;

    const handleCopySecret = async () => {
        if (!secret) return;
        try {
            await navigator.clipboard.writeText(secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!factorId || !verificationCode.trim()) {
            setErrorMsg("Please enter the 6-digit verification code from your authenticator app.");
            return;
        }

        setSubmitting(true);
        setErrorMsg(null);
        try {
            await verifyTwoFactor(factorId, verificationCode.trim());
            onSuccess();
            onClose();
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Invalid code. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDisable = async () => {
        setSubmitting(true);
        setErrorMsg(null);
        try {
            await disableTwoFactor();
            onSuccess();
            onClose();
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to disable 2FA.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="password-modal-content"
                style={{ maxWidth: 460 }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="two-factor-manage-title"
            >
                <div className="password-modal-header">
                    <div className="password-modal-title-wrap">
                        <div className="password-modal-icon">
                            <KeyRound size={18} />
                        </div>
                        <div>
                            <h3 id="two-factor-manage-title">Two-Factor Authentication</h3>
                            <p>{isEnabled ? "Manage your 2FA security configuration" : "Setup an authenticator app (TOTP)"}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="password-modal-close"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="password-modal-body" style={{ padding: "20px 24px" }}>
                    {errorMsg && (
                        <div className="notice-banner error" role="alert" style={{ marginBottom: 16 }}>
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {isEnabled ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "14px 16px",
                                    background: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                    borderRadius: 8,
                                }}
                            >
                                <ShieldCheck size={24} style={{ color: "#16a34a", flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#166534" }}>
                                        Two-Factor Authentication is Active
                                    </div>
                                    <div style={{ fontSize: 12.5, color: "#15803d" }}>
                                        Your account requires a code from your authenticator app on sign-in.
                                    </div>
                                </div>
                            </div>

                            {confirmDisable ? (
                                <div
                                    style={{
                                        background: "#fef2f2",
                                        border: "1px solid #fecaca",
                                        padding: 14,
                                        borderRadius: 8,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#991b1b" }}>
                                        Are you sure you want to disable 2FA?
                                    </div>
                                    <div style={{ fontSize: 12.5, color: "#b91c1c" }}>
                                        Disabling 2FA makes your account less secure.
                                    </div>
                                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                        <button
                                            type="button"
                                            className="btn-modal-cancel"
                                            onClick={() => setConfirmDisable(false)}
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-modal-submit"
                                            style={{ background: "#dc2626" }}
                                            onClick={handleDisable}
                                            disabled={submitting}
                                        >
                                            {submitting ? <Loader2 size={14} className="spin" /> : null}
                                            <span>{submitting ? "Disabling..." : "Yes, Disable 2FA"}</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="btn-advanced-revoke"
                                    style={{ alignSelf: "flex-start", marginTop: 8 }}
                                    onClick={() => setConfirmDisable(true)}
                                >
                                    Disable 2FA
                                </button>
                            )}
                        </div>
                    ) : loadingEnroll ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 0", gap: 12 }}>
                            <Loader2 size={28} className="spin" style={{ color: "#2563eb" }} />
                            <span style={{ fontSize: 13, color: "#64748b" }}>Generating authenticator setup details...</span>
                        </div>
                    ) : (
                        <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>
                                    Step 1: Scan QR code or copy secret key
                                </div>
                                <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 12px 0" }}>
                                    Use Google Authenticator, Microsoft Authenticator, or 1Password to scan this QR code:
                                </p>
                                {qrCode && (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            background: "#f8fafc",
                                            padding: 16,
                                            borderRadius: 8,
                                            border: "1px solid #e2e8f0",
                                            marginBottom: 12,
                                        }}
                                    >
                                        <div
                                            dangerouslySetInnerHTML={{ __html: qrCode }}
                                            style={{ width: 160, height: 160 }}
                                        />
                                    </div>
                                )}

                                {secret && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f1f5f9", padding: "8px 12px", borderRadius: 6 }}>
                                        <span style={{ fontSize: 12, color: "#475569", flex: 1, fontFamily: "monospace", wordBreak: "break-all" }}>
                                            {secret}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCopySecret}
                                            style={{
                                                background: "#ffffff",
                                                border: "1px solid #cbd5e1",
                                                borderRadius: 4,
                                                padding: "4px 8px",
                                                cursor: "pointer",
                                                fontSize: 11.5,
                                                color: "#334155",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}
                                        >
                                            {copied ? <Check size={12} style={{ color: "#16a34a" }} /> : <Copy size={12} />}
                                            <span>{copied ? "Copied" : "Copy"}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="two-factor-verify-code" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>
                                    Step 2: Enter 6-digit confirmation code
                                </label>
                                <input
                                    id="two-factor-verify-code"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    className="profile-input"
                                    placeholder="000000"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                                    autoComplete="one-time-code"
                                    style={{ fontSize: 16, letterSpacing: 4, textAlign: "center", maxWidth: 180 }}
                                    required
                                    disabled={submitting}
                                />
                            </div>

                            <div className="password-modal-actions" style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, marginTop: 4 }}>
                                <button
                                    type="button"
                                    className="btn-modal-cancel"
                                    onClick={onClose}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-modal-submit"
                                    disabled={submitting || verificationCode.length < 6}
                                >
                                    {submitting && <Loader2 size={15} className="spin" style={{ marginRight: 6 }} />}
                                    <span>{submitting ? "Verifying..." : "Verify & Enable"}</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
