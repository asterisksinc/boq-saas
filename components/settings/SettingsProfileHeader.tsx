"use client";

import { useState } from "react";
import SettingsEditProfileModal from "./SettingsEditProfileModal";

interface SettingsProfileHeaderProps {
    displayName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    initials: string;
    completionPercent: number;
    onProfileUpdated: () => void;
}

export default function SettingsProfileHeader({
    displayName,
    email,
    role,
    avatarUrl,
    initials,
    completionPercent,
    onProfileUpdated,
}: SettingsProfileHeaderProps) {
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Format subtitle to match Figma: "Owner riya@arvininteriors.com"
    const subtitle = [role, email].filter(Boolean).join(" ");
    const clampedPercent = Math.min(100, Math.max(0, completionPercent));

    return (
        <div className="settings-profile-card">
            <div className="settings-profile-top">
                <div className="settings-profile-user">
                    <div className="settings-profile-avatar" aria-hidden="true">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="settings-profile-img" />
                        ) : (
                            <span className="settings-profile-initials">{initials}</span>
                        )}
                    </div>
                    <div className="settings-profile-meta">
                        <h2 className="settings-profile-name">{displayName}</h2>
                        <p className="settings-profile-subtitle">{subtitle || "Member"}</p>
                    </div>
                </div>

                <div className="settings-profile-actions">
                    <button
                        type="button"
                        className="settings-btn-edit-profile"
                        onClick={() => setEditModalOpen(true)}
                    >
                        Edit Profile
                    </button>
                </div>
            </div>

            <div className="settings-profile-progress-wrap">
                <div
                    className="settings-profile-progress-track"
                    role="progressbar"
                    aria-valuenow={clampedPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Profile completion progress"
                >
                    <div
                        className="settings-profile-progress-fill"
                        style={{ width: `${clampedPercent}%` }}
                    />
                </div>
                <span className="settings-profile-progress-percent">
                    {clampedPercent}%
                </span>
            </div>

            <SettingsEditProfileModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                currentName={displayName}
                email={email}
                onProfileUpdated={() => {
                    onProfileUpdated();
                }}
            />
        </div>
    );
}
