"use client";

import { useState, FormEvent } from "react";
import { X, Loader2, User } from "lucide-react";
import { updateUserProfile } from "@/lib/api/auth";

interface SettingsEditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    email: string;
    onProfileUpdated: (newName: string) => void;
}

export default function SettingsEditProfileModal({
    isOpen,
    onClose,
    currentName,
    email,
    onProfileUpdated,
}: SettingsEditProfileModalProps) {
    const [displayName, setDisplayName] = useState(currentName);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = displayName.trim();
        if (!trimmed) {
            setError("Display name cannot be empty.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await updateUserProfile({ displayName: trimmed });
            onProfileUpdated(trimmed);
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-modal-backdrop" onClick={onClose}>
            <div
                className="settings-modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="settings-modal-header">
                    <div className="settings-modal-title-wrap">
                        <div className="settings-modal-icon">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 id="modal-title">Edit Profile</h2>
                            <p>Update your personal account details</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="settings-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="settings-modal-form">
                    {error && (
                        <div className="settings-modal-error">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-field">
                        <label htmlFor="display-name-input">
                            Display Name <span className="required">*</span>
                        </label>
                        <input
                            id="display-name-input"
                            type="text"
                            className="form-input"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g. Riya Sharma"
                            maxLength={120}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="email-input">Email Address</label>
                        <input
                            id="email-input"
                            type="email"
                            className="form-input"
                            value={email || ""}
                            disabled
                            style={{ opacity: 0.7, background: "#f8fafc", cursor: "not-allowed" }}
                        />
                        <span style={{ fontSize: "11px", color: "var(--fig-muted)", marginTop: "4px" }}>
                            Email cannot be changed directly from here.
                        </span>
                    </div>

                    <div className="settings-modal-footer">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={saving}
                        >
                            {saving ? <Loader2 size={16} className="spin" /> : null}
                            <span>{saving ? "Saving..." : "Save Changes"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
