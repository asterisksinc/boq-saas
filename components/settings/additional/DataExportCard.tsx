"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { exportAdditionalData } from "@/lib/api/auth";

interface DataExportCardProps {
    showNotice: (message: string, type?: "success" | "error") => void;
}

export type ExportCategoryKey = "projects" | "boqs" | "documents" | "billing";

export default function DataExportCard({ showNotice }: DataExportCardProps) {
    const [selected, setSelected] = useState<Record<ExportCategoryKey, boolean>>({
        projects: true,
        boqs: true,
        documents: false,
        billing: false,
    });
    const [exporting, setExporting] = useState(false);

    const toggleCategory = (key: ExportCategoryKey) => {
        setSelected((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleExport = async () => {
        const categories = (Object.keys(selected) as ExportCategoryKey[]).filter(
            (k) => selected[k]
        );

        if (categories.length === 0) {
            showNotice("Please select at least one data category to export.", "error");
            return;
        }

        setExporting(true);
        try {
            const result = await exportAdditionalData(categories);
            showNotice(`Data archive exported successfully (${result.filename}).`, "success");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to export data archive.";
            showNotice(msg, "error");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="additional-main-container is-data-export" data-testid="data-export-card">
            {/* Header Frame 2147225610 */}
            <div className="additional-section-header">
                <div className="additional-section-header-left">
                    <h2 className="additional-section-title">Data Export</h2>
                    <p className="additional-section-subtitle">
                        Select data to export as a ZIP archive
                    </p>
                </div>
                <button
                    type="button"
                    className="btn-additional-export"
                    onClick={handleExport}
                    disabled={exporting}
                    data-testid="export-selected-btn"
                >
                    {exporting && <Loader2 size={14} className="spin" />}
                    <span>{exporting ? "Exporting..." : "Export Selected"}</span>
                </button>
            </div>

            {/* Divider Rectangle 34624165 */}
            <div className="additional-card-divider" />

            {/* Checkboxes Frame 2147225609 */}
            <div className="additional-checkbox-grid">
                {/* Row 1: Projects & BOQS (Frame 2147225607) */}
                <div className="additional-checkbox-row">
                    <button
                        type="button"
                        className="additional-checkbox-item"
                        onClick={() => toggleCategory("projects")}
                        role="checkbox"
                        aria-checked={selected.projects}
                        data-testid="checkbox-projects"
                    >
                        <span
                            className={`additional-checkbox-box ${selected.projects ? "is-checked" : ""}`}
                        >
                            {selected.projects && <Check size={14} strokeWidth={3} />}
                        </span>
                        <span className="additional-checkbox-label">Projects</span>
                    </button>

                    <button
                        type="button"
                        className="additional-checkbox-item"
                        onClick={() => toggleCategory("boqs")}
                        role="checkbox"
                        aria-checked={selected.boqs}
                        data-testid="checkbox-boqs"
                    >
                        <span
                            className={`additional-checkbox-box ${selected.boqs ? "is-checked" : ""}`}
                        >
                            {selected.boqs && <Check size={14} strokeWidth={3} />}
                        </span>
                        <span className="additional-checkbox-label">BOQS</span>
                    </button>
                </div>

                {/* Row 2: Documents & Billing History (Frame 2147225608) */}
                <div className="additional-checkbox-row">
                    <button
                        type="button"
                        className="additional-checkbox-item"
                        onClick={() => toggleCategory("documents")}
                        role="checkbox"
                        aria-checked={selected.documents}
                        data-testid="checkbox-documents"
                    >
                        <span
                            className={`additional-checkbox-box ${selected.documents ? "is-checked" : ""}`}
                        >
                            {selected.documents && <Check size={14} strokeWidth={3} />}
                        </span>
                        <span className="additional-checkbox-label">Documents</span>
                    </button>

                    <button
                        type="button"
                        className="additional-checkbox-item"
                        onClick={() => toggleCategory("billing")}
                        role="checkbox"
                        aria-checked={selected.billing}
                        data-testid="checkbox-billing"
                    >
                        <span
                            className={`additional-checkbox-box ${selected.billing ? "is-checked" : ""}`}
                        >
                            {selected.billing && <Check size={14} strokeWidth={3} />}
                        </span>
                        <span className="additional-checkbox-label">Billing History</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
