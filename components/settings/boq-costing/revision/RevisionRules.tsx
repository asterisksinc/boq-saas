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
        requireRevisionReason: initialRevision.requireRevisionReason ?? initialRevision.revisionReasonRequired ?? true,
        autoArchiveOnApprove: initialRevision.autoArchiveOnApprove ?? initialRevision.autoRevisionNumbering ?? true,
        lockAfterExport: initialRevision.lockAfterExport ?? initialRevision.lockApprovedVersions ?? true,
        notifyOnNewRevision: initialRevision.notifyOnNewRevision ?? initialRevision.reopenAfterApproval ?? true,
        trackUnitCostChanges: initialRevision.trackUnitCostChanges ?? initialRevision.compareVersions ?? true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setSettings({
            autoRevisionNumbering: initialRevision.autoRevisionNumbering ?? true,
            revisionReasonRequired: initialRevision.revisionReasonRequired ?? true,
            lockApprovedVersions: initialRevision.lockApprovedVersions ?? true,
            reopenAfterApproval: initialRevision.reopenAfterApproval ?? true,
            compareVersions: initialRevision.compareVersions ?? true,
            requireRevisionReason: initialRevision.requireRevisionReason ?? initialRevision.revisionReasonRequired ?? true,
            autoArchiveOnApprove: initialRevision.autoArchiveOnApprove ?? initialRevision.autoRevisionNumbering ?? true,
            lockAfterExport: initialRevision.lockAfterExport ?? initialRevision.lockApprovedVersions ?? true,
            notifyOnNewRevision: initialRevision.notifyOnNewRevision ?? initialRevision.reopenAfterApproval ?? true,
            trackUnitCostChanges: initialRevision.trackUnitCostChanges ?? initialRevision.compareVersions ?? true,
        });
    }, [initialRevision]);

    const handleToggle = async (
        figmaKey: "requireRevisionReason" | "autoArchiveOnApprove" | "lockAfterExport" | "notifyOnNewRevision" | "trackUnitCostChanges",
        legacyKey: "revisionReasonRequired" | "autoRevisionNumbering" | "lockApprovedVersions" | "reopenAfterApproval" | "compareVersions",
        val: boolean
    ) => {
        if (!canEdit) return;
        const updated: BoqRevisionSettings = {
            ...settings,
            [figmaKey]: val,
            [legacyKey]: val,
        };
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
        <form onSubmit={handleSave} className="boq-revision-panel boq-revision-container">
            {/* 1. Require revision reason */}
            <RevisionSettingRow
                id="rev-reason-required"
                title="Require revision reason"
                description="Require user to enter a reason for each revision"
                checked={settings.requireRevisionReason ?? settings.revisionReasonRequired}
                canEdit={canEdit}
                onChange={(checked) => handleToggle("requireRevisionReason", "revisionReasonRequired", checked)}
            />

            {/* 2. Auto-archive on approve */}
            <RevisionSettingRow
                id="rev-auto-archive"
                title="Auto-archive on approve"
                description="Automatically archive previous revisions when a new one is approved"
                checked={settings.autoArchiveOnApprove ?? settings.autoRevisionNumbering}
                canEdit={canEdit}
                onChange={(checked) => handleToggle("autoArchiveOnApprove", "autoRevisionNumbering", checked)}
            />

            {/* 3. Lock after export */}
            <RevisionSettingRow
                id="rev-lock-export"
                title="Lock after export"
                description="Lock revision from further edits once exported"
                checked={settings.lockAfterExport ?? settings.lockApprovedVersions}
                canEdit={canEdit}
                onChange={(checked) => handleToggle("lockAfterExport", "lockApprovedVersions", checked)}
            />

            {/* 4. Notify on new revision */}
            <RevisionSettingRow
                id="rev-notify-new"
                title="Notify on new revision"
                description="Send notifications when a new revision is created"
                checked={settings.notifyOnNewRevision ?? settings.reopenAfterApproval}
                canEdit={canEdit}
                onChange={(checked) => handleToggle("notifyOnNewRevision", "reopenAfterApproval", checked)}
            />

            {/* 5. Track unit cost changes */}
            <RevisionSettingRow
                id="rev-track-costs"
                title="Track unit cost changes"
                description="Highlight and track changes to unit costs across revisions"
                checked={settings.trackUnitCostChanges ?? settings.compareVersions}
                canEdit={canEdit}
                onChange={(checked) => handleToggle("trackUnitCostChanges", "compareVersions", checked)}
            />
        </form>
    );
};
