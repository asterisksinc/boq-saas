"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { exportAdditionalData } from "@/lib/api/auth";
import DeleteAccountModal from "./DeleteAccountModal";

interface DeleteAccountSectionProps {
    showNotice: (message: string, type?: "success" | "error") => void;
    onNavigateToExport?: () => void;
}

export default function DeleteAccountSection({
    showNotice,
    onNavigateToExport,
}: DeleteAccountSectionProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleExportAll = async () => {
        setExporting(true);
        try {
            const result = await exportAdditionalData(["projects", "boqs", "documents", "billing"]);
            showNotice(`Full data archive exported (${result.filename}).`, "success");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to export data archive.";
            showNotice(msg, "error");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="additional-main-container" data-testid="delete-account-section">
            <div className="additional-section-header">
                <div className="additional-section-header-left">
                    <h2 className="additional-section-title">Delete Account</h2>
                </div>
            </div>

            <div className="additional-card-divider" />

            <div className="danger-zone-container">
                <div className="danger-zone-info">
                    <h3 className="danger-zone-title">Danger Zone</h3>
                    <p className="danger-zone-subtitle">
                        These actions are irreversible. Please be certain.
                    </p>
                </div>

                <div className="danger-zone-actions">
                    <button
                        type="button"
                        className="btn-danger-export"
                        onClick={onNavigateToExport || handleExportAll}
                        disabled={exporting}
                        data-testid="danger-export-data-btn"
                    >
                        {exporting && <Loader2 size={14} className="spin" />}
                        <span>{exporting ? "Exporting..." : "Export Data"}</span>
                    </button>

                    <button
                        type="button"
                        className="btn-danger-delete"
                        onClick={() => setModalOpen(true)}
                        data-testid="danger-delete-account-btn"
                    >
                        <span>Delete Account</span>
                    </button>
                </div>
            </div>

            <DeleteAccountModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                showNotice={showNotice}
            />
        </div>
    );
}
