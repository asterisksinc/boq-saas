"use client";

import { FormEvent, useState } from "react";
import { Loader2, Lock, X } from "lucide-react";
import { updateUserPassword } from "@/lib/api/auth";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ChangePasswordModal({
    isOpen,
    onClose,
    onSuccess,
}: ChangePasswordModalProps) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const resetForm = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrorMsg(null);
    };

    const handleClose = () => {
        if (saving) return;
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!currentPassword) {
            setErrorMsg("Current password is required.");
            return;
        }
        if (newPassword.length < 10) {
            setErrorMsg("New password must be at least 10 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setErrorMsg("New passwords do not match.");
            return;
        }

        setSaving(true);
        try {
            await updateUserPassword({
                currentPassword,
                newPassword,
            });
            resetForm();
            onSuccess();
            onClose();
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to update password.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleClose}>
            <div
                className="password-modal-content"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="change-pwd-title"
            >
                <div className="password-modal-header">
                    <div className="password-modal-title-wrap">
                        <div className="password-modal-icon">
                            <Lock size={18} />
                        </div>
                        <div>
                            <h3 id="change-pwd-title">Change Password</h3>
                            <p>Update your account password</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="password-modal-close"
                        onClick={handleClose}
                        disabled={saving}
                        aria-label="Close dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="password-modal-form">
                    {errorMsg && (
                        <div className="notice-banner error" role="alert" style={{ marginBottom: 16 }}>
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <div className="password-modal-body">
                        <div className="profile-field-group">
                            <label htmlFor="modal-current-pwd">
                                Current Password <span className="profile-req">*</span>
                            </label>
                            <input
                                id="modal-current-pwd"
                                type="password"
                                className="profile-input"
                                placeholder="Enter current password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                autoFocus
                                required
                                disabled={saving}
                            />
                        </div>

                        <div className="profile-field-group">
                            <label htmlFor="modal-new-pwd">
                                New Password <span className="profile-req">*</span>
                            </label>
                            <input
                                id="modal-new-pwd"
                                type="password"
                                className="profile-input"
                                placeholder="Min. 10 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={saving}
                            />
                        </div>

                        <div className="profile-field-group">
                            <label htmlFor="modal-confirm-pwd">
                                Confirm New Password <span className="profile-req">*</span>
                            </label>
                            <input
                                id="modal-confirm-pwd"
                                type="password"
                                className="profile-input"
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={saving}
                            />
                        </div>
                    </div>

                    <div className="password-modal-actions">
                        <button
                            type="button"
                            className="btn-modal-cancel"
                            onClick={handleClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-modal-submit"
                            disabled={saving}
                        >
                            {saving && <Loader2 size={16} className="spin" style={{ marginRight: 6 }} />}
                            <span>{saving ? "Updating..." : "Update Password"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
