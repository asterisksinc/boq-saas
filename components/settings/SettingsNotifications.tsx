"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AlertCircle, RefreshCw, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import {
    NotificationChannel,
    NotificationEvent,
    NotificationMatrix,
} from "@/lib/settings/types";
import {
    NOTIFICATION_ROWS,
    NOTIFICATION_CHANNELS,
    DEFAULT_NOTIFICATION_MATRIX,
    adaptNotificationSettings,
    serializeNotificationSettings,
} from "@/lib/settings/adapter";
import { getSettingsSection, updateSettingsSection } from "@/lib/api/auth";

interface SettingsNotificationsProps {
    showNotice?: (message: string, type?: "success" | "error") => void;
    userRole?: string;
}

export default function SettingsNotifications({
    showNotice,
    userRole,
}: SettingsNotificationsProps) {
    const [matrix, setMatrix] = useState<NotificationMatrix>(DEFAULT_NOTIFICATION_MATRIX);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [activeToggles, setActiveToggles] = useState<Set<string>>(new Set());

    // Ref to hold latest matrix to prevent stale closures during rapid toggle interactions
    const matrixRef = useRef<NotificationMatrix>(matrix);
    matrixRef.current = matrix;

    const canManage = !userRole || ["owner", "admin"].includes(userRole);

    const loadPreferences = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getSettingsSection("notifications");
            const adapted = adaptNotificationSettings(res.data);
            setMatrix(adapted);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unable to load notification preferences.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPreferences();
    }, [loadPreferences]);

    const handleToggle = async (event: NotificationEvent, channel: NotificationChannel) => {
        if (!canManage) {
            showNotice?.("Only workspace owners and admins can modify notification preferences.", "error");
            return;
        }

        const toggleKey = `${event}:${channel}`;
        if (activeToggles.has(toggleKey)) {
            return; // Prevent duplicate concurrent in-flight requests for the exact same toggle
        }

        const currentVal = matrixRef.current[event]?.[channel] ?? true;
        const nextVal = !currentVal;

        // Optimistic UI update
        const updatedMatrix: NotificationMatrix = {
            ...matrixRef.current,
            [event]: {
                ...matrixRef.current[event],
                [channel]: nextVal,
            },
        };
        setMatrix(updatedMatrix);

        // Mark toggle as in-flight
        setActiveToggles((prev) => new Set(prev).add(toggleKey));
        setSavingStatus("saving");

        try {
            const payload = serializeNotificationSettings(updatedMatrix);
            await updateSettingsSection("notifications", { data: payload });
            setSavingStatus("saved");
            setTimeout(() => {
                setSavingStatus((current) => (current === "saved" ? "idle" : current));
            }, 2500);
        } catch (err: unknown) {
            // Revert optimistic update on failure
            setMatrix((prev) => ({
                ...prev,
                [event]: {
                    ...prev[event],
                    [channel]: currentVal,
                },
            }));
            const msg = err instanceof Error ? err.message : "Failed to update notification preference.";
            showNotice?.(msg, "error");
            setSavingStatus("idle");
        } finally {
            setActiveToggles((prev) => {
                const next = new Set(prev);
                next.delete(toggleKey);
                return next;
            });
        }
    };

    if (loading) {
        return (
            <div className="notif-matrix-card" data-testid="notifications-skeleton">
                <div className="notif-matrix-header-skeleton" />
                <div className="notif-matrix-rows-skeleton">
                    {Array.from({ length: 7 }).map((_, idx) => (
                        <div key={idx} className="notif-skeleton-row">
                            <div className="notif-skeleton-label skeleton" />
                            <div className="notif-skeleton-toggle skeleton" />
                            <div className="notif-skeleton-toggle skeleton" />
                            <div className="notif-skeleton-toggle skeleton" />
                            <div className="notif-skeleton-toggle skeleton" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="notif-matrix-card notif-error-card" data-testid="notifications-error">
                <div className="notif-error-content">
                    <AlertCircle className="notif-error-icon" size={32} />
                    <h3 className="notif-error-title">Unable to load notification preferences</h3>
                    <p className="notif-error-desc">{error}</p>
                    <button
                        type="button"
                        onClick={loadPreferences}
                        className="notif-retry-button"
                    >
                        <RefreshCw size={15} />
                        <span>Try Again</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="notif-container" data-testid="notifications-matrix">
            {!canManage && (
                <div className="notif-readonly-notice">
                    <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                    <span>View-only mode: Only workspace owners and administrators can change notification settings.</span>
                </div>
            )}

            {/* Subtle auto-save status indicator */}
            <div className="notif-status-bar" aria-live="polite">
                {savingStatus === "saving" && (
                    <span className="notif-status saving">
                        <Loader2 size={13} className="animate-spin" />
                        <span>Saving changes...</span>
                    </span>
                )}
                {savingStatus === "saved" && (
                    <span className="notif-status saved">
                        <CheckCircle2 size={13} />
                        <span>All preferences saved</span>
                    </span>
                )}
            </div>

            <div className="notif-matrix-card">
                <div className="notif-table-wrapper">
                    <table className="notif-matrix-table" role="grid" aria-label="Notification Preferences Matrix">
                        <thead>
                            <tr className="notif-matrix-header-row">
                                <th scope="col" className="notif-col-name">
                                    NOTIFICATION
                                </th>
                                {NOTIFICATION_CHANNELS.map((channel) => (
                                    <th key={channel.id} scope="col" className="notif-col-channel">
                                        {channel.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {NOTIFICATION_ROWS.map((row) => {
                                const eventKey = row.id;
                                const rowValues = matrix[eventKey] || DEFAULT_NOTIFICATION_MATRIX[eventKey];

                                return (
                                    <tr key={row.id} className="notif-matrix-row">
                                        <td className="notif-row-label">
                                            <span className="notif-label-text">{row.label}</span>
                                        </td>
                                        {NOTIFICATION_CHANNELS.map((channel) => {
                                            const channelKey = channel.id;
                                            const isChecked = rowValues[channelKey] ?? true;
                                            const toggleKey = `${eventKey}:${channelKey}`;
                                            const isPending = activeToggles.has(toggleKey);

                                            return (
                                                <td key={channel.id} className="notif-row-cell">
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={isChecked}
                                                        aria-label={`${row.label} via ${channel.label}`}
                                                        disabled={!canManage || isPending}
                                                        onClick={() => handleToggle(eventKey, channelKey)}
                                                        className={`notif-switch ${isChecked ? "checked" : ""} ${
                                                            !canManage ? "disabled" : ""
                                                        } ${isPending ? "pending" : ""}`}
                                                        title={
                                                            !canManage
                                                                ? "You do not have permission to modify this setting"
                                                                : `${isChecked ? "Disable" : "Enable"} ${channel.label} for ${row.label}`
                                                        }
                                                    >
                                                        <span className="notif-switch-track">
                                                            <span className="notif-switch-thumb" />
                                                        </span>
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
