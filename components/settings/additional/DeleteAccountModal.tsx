"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { deleteUserAccount } from "@/lib/api/auth";

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    showNotice: (message: string, type?: "success" | "error") => void;
}

export default function DeleteAccountModal({
    isOpen,
    onClose,
    showNotice,
}: DeleteAccountModalProps) {
    const [confirmText, setConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleClose = () => {
        if (deleting) return;
        setConfirmText("");
        setErrorMessage(null);
        onClose();
    };

    const handleDelete = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (confirmText.trim().toUpperCase() !== "DELETE") {
            setErrorMessage("Please type DELETE to confirm.");
            return;
        }

        setDeleting(true);
        try {
            await deleteUserAccount("DELETE");
            showNotice("Account permanently deleted. Redirecting...", "success");
            setTimeout(() => {
                window.location.href = "/auth/login?deleted=true";
            }, 1000);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to delete account.";
            setErrorMessage(msg);
            setDeleting(false);
        }
    };

    return (
        <div
            className="security-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
        >
            <div className="security-modal-content" style={{ maxWidth: "480px" }}>
                <div className="security-modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                background: "#fef2f2",
                                color: "#dc2626",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 id="delete-account-title" className="security-modal-title" style={{ color: "#991b1b" }}>
                                Delete Account
                            </h3>
                            <p className="security-modal-subtitle">
                                This action is permanent and irreversible
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="security-modal-close"
                        onClick={handleClose}
                        disabled={deleting}
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleDelete}>
                    <div className="security-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {errorMessage && (
                            <div
                                style={{
                                    background: "#fef2f2",
                                    border: "1px solid #fecaca",
                                    borderRadius: "8px",
                                    padding: "12px 14px",
                                    color: "#991b1b",
                                    fontSize: "13px",
                                    lineHeight: "1.4",
                                }}
                                role="alert"
                            >
                                {errorMessage}
                            </div>
                        )}

                        <p style={{ fontSize: "13.5px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                            Deleting your account will immediately revoke all active sessions, delete your profile, and remove your workspace memberships.
                        </p>

                        <div
                            style={{
                                background: "#fff7ed",
                                border: "1px solid #ffedd5",
                                borderRadius: "8px",
                                padding: "12px 14px",
                                fontSize: "12.5px",
                                color: "#9a3412",
                                lineHeight: "1.4",
                            }}
                        >
                            <strong>Important:</strong> If you are the sole owner of a shared workspace with other active members, you must transfer workspace ownership before deleting your account.
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label
                                htmlFor="delete-confirm-input"
                                style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}
                            >
                                Type <strong style={{ color: "#dc2626" }}>DELETE</strong> to confirm:
                            </label>
                            <input
                                id="delete-confirm-input"
                                type="text"
                                className="profile-input"
                                placeholder="DELETE"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                disabled={deleting}
                                autoFocus
                                required
                                data-testid="delete-account-confirm-input"
                            />
                        </div>
                    </div>

                    <div className="security-modal-footer">
                        <button
                            type="button"
                            className="btn-modal-cancel"
                            onClick={handleClose}
                            disabled={deleting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-danger-delete"
                            disabled={deleting || confirmText.trim().toUpperCase() !== "DELETE"}
                            data-testid="confirm-delete-account-btn"
                        >
                            {deleting && <Loader2 size={15} className="spin" />}
                            <span>{deleting ? "Deleting Account..." : "Permanently Delete Account"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
