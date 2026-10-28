"use client";

import React from "react";
import { Loader2, Save } from "lucide-react";

export interface SharedSettingsActionsProps {
    saving?: boolean;
    saveLabel?: string;
    onCancel?: () => void;
    cancelLabel?: string;
    disabled?: boolean;
    className?: string;
}

export function SharedSettingsActions({
    saving = false,
    saveLabel = "Save Changes",
    onCancel,
    cancelLabel = "Cancel",
    disabled = false,
    className = "",
}: SharedSettingsActionsProps) {
    return (
        <div className={`settings-actions-row ${className}`.trim()} style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-end" }}>
            {onCancel && (
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={onCancel}
                    disabled={disabled || saving}
                >
                    {cancelLabel}
                </button>
            )}
            <button
                type="submit"
                className="btn-primary"
                disabled={disabled || saving}
            >
                {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                <span>{saving ? "Saving..." : saveLabel}</span>
            </button>
        </div>
    );
}

export default SharedSettingsActions;
