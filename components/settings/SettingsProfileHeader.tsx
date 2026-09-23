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
                        <div className="settings-profile-role-row">
                            <span className="settings-profile-role">{role}</span>
                            {email ? (
                                <span className="settings-profile-email">{email}</span>
                            ) : null}
                        </div>
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
                    aria-valuenow={completionPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Profile completion progress"
                >
                    <div
                        className="settings-profile-progress-fill"
                        style={{ width: `${completionPercent}%` }}
                    />
                </div>
                <span className="settings-profile-progress-percent">
                    {completionPercent}%
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
