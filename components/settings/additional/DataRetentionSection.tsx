"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { RetentionSettings, updateRetentionSettings } from "@/lib/api/auth";

interface DataRetentionSectionProps {
    retention: RetentionSettings | null;
    loading: boolean;
    onUpdateRetention: (newRetention: RetentionSettings) => void;
    showNotice: (message: string, type?: "success" | "error") => void;
}

export default function DataRetentionSection({
    retention,
    loading,
    onUpdateRetention,
    showNotice,
}: DataRetentionSectionProps) {
    const [updating, setUpdating] = useState(false);

    const autoDelete = retention?.autoDeleteDrafts ?? true;
    const recycleDays = retention?.recycleBinDays ?? 90;

    const handleToggleAutoDelete = async () => {
        if (updating || loading) return;

        const nextVal = !autoDelete;
        setUpdating(true);
        try {
            const updated = await updateRetentionSettings({ autoDeleteDrafts: nextVal });
            onUpdateRetention(updated);
            showNotice(
                `Auto-delete for draft BOQs is now ${nextVal ? "enabled" : "disabled"}.`,
                "success"
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to update retention setting.";
            showNotice(msg, "error");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="additional-main-container is-data-retention" data-testid="data-retention-section">
            {/* Header Frame 2147225606 */}
            <div className="additional-section-header">
                <div className="additional-section-header-left">
                    <h2 className="additional-section-title">Data Retention</h2>
                </div>
            </div>

            {/* Divider Rectangle 34624165 */}
            <div className="additional-card-divider" />

            {loading ? (
                <div className="additional-retention-list">
                    <div
                        className="skeleton"
                        style={{ height: "82px", borderRadius: "6px", width: "100%" }}
                    />
                    <div
                        className="skeleton"
                        style={{ height: "82px", borderRadius: "6px", width: "100%" }}
                    />
                </div>
            ) : (
                <div className="additional-retention-list">
                    {/* Card 1: Recycle Bin Retention (Frame 95) */}
                    <div className="additional-inner-card" data-testid="retention-recycle-bin">
                        <div className="additional-card-info">
                            <h3 className="additional-card-info-title">Recycle Bin Retention</h3>
                            <p className="additional-card-info-subtitle">
                                Deleted items are retained for {recycleDays} days
                            </p>
                        </div>
                        <div className="additional-retention-value">{recycleDays} days</div>
                    </div>

                    {/* Card 2: Auto-delete Draft BOQs (Frame 2147225610) */}
                    <div className="additional-inner-card" data-testid="retention-auto-delete">
                        <div className="additional-card-info">
                            <h3 className="additional-card-info-title">Auto-delete Draft BOQs</h3>
                            <p className="additional-card-info-subtitle">
                                Automatically delete unsaved drafts older than 30 days
                            </p>
                        </div>
                        <button
                            type="button"
                            className={`additional-toggle-switch ${autoDelete ? "is-active" : ""}`}
                            onClick={handleToggleAutoDelete}
                            disabled={updating}
                            role="switch"
                            aria-checked={autoDelete}
                            aria-label="Toggle auto-delete draft BOQs"
                            data-testid="toggle-auto-delete-drafts"
                        >
                            <span className="additional-toggle-knob" />
                            {updating && (
                                <Loader2
                                    size={12}
                                    className="spin"
                                    style={{
                                        position: "absolute",
                                        top: "5px",
                                        left: autoDelete ? "8px" : "22px",
                                        color: autoDelete ? "#ffffff" : "#64748b",
                                    }}
                                />
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
