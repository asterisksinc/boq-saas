"use client";

import { Loader2, ShieldAlert, X } from "lucide-react";
import { UserSessionInfo } from "@/lib/api/auth";

interface RevokeSessionModalProps {
    isOpen: boolean;
    session: UserSessionInfo | null;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
}

export default function RevokeSessionModal({
    isOpen,
    session,
    onClose,
    onConfirm,
    loading,
}: RevokeSessionModalProps) {
    if (!isOpen || !session) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="password-modal-content"
                style={{ maxWidth: 440 }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="revoke-session-title"
            >
                <div className="password-modal-header">
                    <div className="password-modal-title-wrap">
                        <div className="password-modal-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>
                            <ShieldAlert size={18} />
                        </div>
                        <div>
                            <h3 id="revoke-session-title">Revoke Session</h3>
                            <p>Disconnect device access</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="password-modal-close"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Close dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="password-modal-body" style={{ padding: "18px 24px" }}>
                    <p style={{ margin: "0 0 12px 0", fontSize: 13.5, color: "#334155" }}>
                        Are you sure you want to revoke the session on <strong>{session.device}</strong>?
                    </p>
                    <div
                        style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            padding: "10px 14px",
                            fontSize: 12.5,
                            color: "#64748b",
                        }}
                    >
                        <div><strong>Device:</strong> {session.device}</div>
                        <div><strong>Location:</strong> {session.location}</div>
                    </div>
                    <p style={{ margin: "12px 0 0 0", fontSize: 12.5, color: "#94a3b8" }}>
                        The user will be immediately logged out of this device and required to sign in again.
                    </p>
                </div>

                <div className="password-modal-actions" style={{ padding: "14px 24px" }}>
                    <button
                        type="button"
                        className="btn-modal-cancel"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-modal-submit"
                        style={{ background: "#dc2626" }}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading && <Loader2 size={15} className="spin" style={{ marginRight: 6 }} />}
                        <span>{loading ? "Revoking..." : "Revoke Session"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
