"use client";

import React, { FormEvent } from "react";
import { SharedSettingsActions } from "./SharedSettingsActions";

export interface SettingsSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    onSave?: (e: FormEvent) => void;
    saving?: boolean;
    saveLabel?: string;
    showActions?: boolean;
    headerAction?: React.ReactNode;
    className?: string;
}

export function SettingsSection({
    title,
    description,
    children,
    onSave,
    saving = false,
    saveLabel = "Save Changes",
    showActions = true,
    headerAction,
    className = "",
}: SettingsSectionProps) {
    const content = (
        <div className={`settings-section-card ${className}`.trim()}>
            <div className="form-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h2>{title}</h2>
                    {description && <p>{description}</p>}
                </div>
                {headerAction && <div className="form-header-action">{headerAction}</div>}
            </div>

            <div className="form-body">{children}</div>

            {showActions && onSave && (
                <div className="form-footer">
                    <SharedSettingsActions saving={saving} saveLabel={saveLabel} />
                </div>
            )}
        </div>
    );

    if (onSave) {
        return <form onSubmit={onSave}>{content}</form>;
    }

    return content;
}

export default SettingsSection;
