"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { BoqRevisionSettings } from "@/lib/settings/types";
import { RevisionSettingRow } from "./RevisionSettingRow";

interface RevisionRulesProps {
    initialRevision: BoqRevisionSettings;
    canEdit: boolean;
    onSaveRevision: (revision: BoqRevisionSettings) => Promise<void>;
    showNotice?: (type: "success" | "error" | "info", message: string) => void;
}

export const RevisionRules: React.FC<RevisionRulesProps> = ({
    initialRevision,
    canEdit,
    onSaveRevision,
    showNotice,
}) => {
    const [settings, setSettings] = useState<BoqRevisionSettings>({
        autoRevisionNumbering: initialRevision.autoRevisionNumbering ?? true,
        revisionReasonRequired: initialRevision.revisionReasonRequired ?? true,
        lockApprovedVersions: initialRevision.lockApprovedVersions ?? true,
        reopenAfterApproval: initialRevision.reopenAfterApproval ?? true,
        compareVersions: initialRevision.compareVersions ?? true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setSettings({
            autoRevisionNumbering: initialRevision.autoRevisionNumbering ?? true,
            revisionReasonRequired: initialRevision.revisionReasonRequired ?? true,
            lockApprovedVersions: initialRevision.lockApprovedVersions ?? true,
            reopenAfterApproval: initialRevision.reopenAfterApproval ?? true,
            compareVersions: initialRevision.compareVersions ?? true,
        });
    }, [initialRevision]);

    const handleToggle = async (key: keyof BoqRevisionSettings, val: boolean) => {
        if (!canEdit) return;
        const updated = { ...settings, [key]: val };
        setSettings(updated);
        try {
            await onSaveRevision(updated);
            showNotice?.("success", "Revision rules updated successfully.");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Could not save revision rules.";
            showNotice?.("error", msg);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit || saving) return;

        setSaving(true);
        try {
            await onSaveRevision(settings);
            showNotice?.("success", "Revision rules saved successfully.");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Could not save revision rules.";
            showNotice?.("error", msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="boq-revision-container">
            <div className="boq-revision-list">
                <RevisionSettingRow
                    id="rev-auto-numbering"
                    title="Auto Revision Numbering"
                    description="Automatically increment revision number on save"
                    checked={settings.autoRevisionNumbering}
                    canEdit={canEdit}
                    onChange={(checked) => handleToggle("autoRevisionNumbering", checked)}
                />

                <RevisionSettingRow
                    id="rev-reason-required"
                    title="Revision Reason Required"
                    description="User must provide a reason when saving a new revision"
                    checked={settings.revisionReasonRequired}
                    canEdit={canEdit}
                    onChange={(checked) => handleToggle("revisionReasonRequired", checked)}
                />

                <RevisionSettingRow
                    id="rev-lock-approved"
                    title="Lock Approved Versions"
                    description="Prevent editing once a version is approved"
                    checked={settings.lockApprovedVersions}
                    canEdit={canEdit}
                    onChange={(checked) => handleToggle("lockApprovedVersions", checked)}
                />

                <RevisionSettingRow
                    id="rev-reopen-approved"
                    title="Reopen After Approval"
                    description="Requires admin permission to reopen"
                    checked={settings.reopenAfterApproval}
                    canEdit={canEdit}
                    onChange={(checked) => handleToggle("reopenAfterApproval", checked)}
                />

                <RevisionSettingRow
                    id="rev-compare-versions"
                    title="Compare Versions"
                    description="Enable side-by-side version comparison"
                    checked={settings.compareVersions}
                    canEdit={canEdit}
                    onChange={(checked) => handleToggle("compareVersions", checked)}
                />
            </div>

            {canEdit && (
                <div className="boq-settings-actions-footer">
                    <button
                        type="submit"
                        disabled={saving}
                        className="boq-btn-primary boq-save-btn"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="boq-spinner" aria-hidden="true" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <span>Save Changes</span>
                        )}
                    </button>
                </div>
            )}
        </form>
    );
};
