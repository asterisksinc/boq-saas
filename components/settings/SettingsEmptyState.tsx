"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface SettingsErrorStateProps {
    message: string;
    onRetry?: () => void;
}

export function SettingsErrorState({ message, onRetry }: SettingsErrorStateProps) {
    return (
        <div className="settings-error-state" role="alert">
            <div className="settings-error-icon">
                <AlertCircle size={28} />
            </div>
            <h3 className="settings-error-title">Unable to Load Settings</h3>
            <p className="settings-error-msg">{message}</p>
            {onRetry && (
                <button type="button" className="btn-primary" onClick={onRetry}>
                    <RefreshCw size={15} />
                    <span>Try Again</span>
                </button>
            )}
        </div>
    );
}

interface SettingsEmptyTabProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function SettingsEmptyTab({
    title,
    description,
    actionLabel,
    onAction,
}: SettingsEmptyTabProps) {
    return (
        <div className="settings-empty-tab">
            <div className="settings-empty-tab-icon">⚙️</div>
            <h3>{title}</h3>
            <p>{description}</p>
            {actionLabel && onAction && (
                <button type="button" className="btn-secondary" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
