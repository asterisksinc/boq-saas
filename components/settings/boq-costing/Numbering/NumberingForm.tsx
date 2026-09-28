"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { BoqNumberingSettings } from "@/lib/settings/types";
import NumberingPreview from "./NumberingPreview";

interface NumberingFormProps {
    initialNumbering: BoqNumberingSettings;
    canEdit: boolean;
    onSaveNumbering: (numbering: BoqNumberingSettings) => Promise<void>;
    showNotice: (message: string, type?: "success" | "error") => void;
}

const SEQUENCE_FORMATS = [
    { value: "Year-based", label: "Year-based" },
    { value: "Project-based", label: "Project-based" },
    { value: "Sequential", label: "Sequential" },
    { value: "Monthly", label: "Monthly" },
];

export default function NumberingForm({
    initialNumbering,
    canEdit,
    onSaveNumbering,
    showNotice,
}: NumberingFormProps) {
    const [boqPrefix, setBoqPrefix] = useState(initialNumbering.boqPrefix || "BOQ");
    const [projectPrefix, setProjectPrefix] = useState(initialNumbering.projectPrefix || "PRJ");
    const [financialYear, setFinancialYear] = useState(initialNumbering.financialYear || "2025-26");
    const [sequenceFormat, setSequenceFormat] = useState(initialNumbering.sequenceFormat || "Year-based");
    const [revisionFormat, setRevisionFormat] = useState(initialNumbering.revisionFormat || "REV-##");

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setBoqPrefix(initialNumbering.boqPrefix || "BOQ");
        setProjectPrefix(initialNumbering.projectPrefix || "PRJ");
        setFinancialYear(initialNumbering.financialYear || "2025-26");
        setSequenceFormat(initialNumbering.sequenceFormat || "Year-based");
        setRevisionFormat(initialNumbering.revisionFormat || "REV-##");
    }, [initialNumbering]);

    const currentNumberingSettings: BoqNumberingSettings = {
        boqPrefix,
        projectPrefix,
        financialYear,
        sequenceFormat,
        revisionFormat,
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!boqPrefix.trim()) errs.boqPrefix = "BOQ Prefix is required";
        if (!projectPrefix.trim()) errs.projectPrefix = "Project Prefix is required";
        if (!financialYear.trim()) errs.financialYear = "Financial Year is required";
        if (!revisionFormat.trim()) errs.revisionFormat = "Revision Format is required";

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!canEdit) {
            showNotice("You do not have permission to modify numbering settings.", "error");
            return;
        }
        if (!validate()) return;

        setSaving(true);
        setErrors({});

        try {
            await onSaveNumbering({
                boqPrefix: boqPrefix.trim(),
                projectPrefix: projectPrefix.trim(),
                financialYear: financialYear.trim(),
                sequenceFormat,
                revisionFormat: revisionFormat.trim(),
            });
            showNotice("Numbering configuration saved successfully.", "success");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to save numbering settings.";
            showNotice(msg, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="boq-content-card">
            <form onSubmit={handleSubmit} noValidate>
                <div className="boq-form-grid">
                    {/* Row 1: BOQ Prefix * | Project Prefix * */}
                    <div className="boq-field">
                        <label htmlFor="boqPrefix">
                            BOQ Prefix <span className="required">*</span>
                        </label>
                        <input
                            id="boqPrefix"
                            type="text"
                            className={`boq-input ${errors.boqPrefix ? "has-error" : ""}`}
                            value={boqPrefix}
                            onChange={(e) => {
                                setBoqPrefix(e.target.value);
                                if (errors.boqPrefix) setErrors((prev) => ({ ...prev, boqPrefix: "" }));
                            }}
                            placeholder="e.g. BOQ"
                            disabled={!canEdit || saving}
                            required
                        />
                        {errors.boqPrefix && (
                            <span className="boq-field-error" role="alert">{errors.boqPrefix}</span>
                        )}
                    </div>

                    <div className="boq-field">
                        <label htmlFor="projectPrefix">
                            Project Prefix <span className="required">*</span>
                        </label>
                        <input
                            id="projectPrefix"
                            type="text"
                            className={`boq-input ${errors.projectPrefix ? "has-error" : ""}`}
                            value={projectPrefix}
                            onChange={(e) => {
                                setProjectPrefix(e.target.value);
                                if (errors.projectPrefix) setErrors((prev) => ({ ...prev, projectPrefix: "" }));
                            }}
                            placeholder="e.g. PRJ"
                            disabled={!canEdit || saving}
                            required
                        />
                        {errors.projectPrefix && (
                            <span className="boq-field-error" role="alert">{errors.projectPrefix}</span>
                        )}
                    </div>

                    {/* Row 2: Financial Year * | Sequence Format * */}
                    <div className="boq-field">
                        <label htmlFor="financialYear">
                            Financial Year <span className="required">*</span>
                        </label>
                        <input
                            id="financialYear"
                            type="text"
                            className={`boq-input ${errors.financialYear ? "has-error" : ""}`}
                            value={financialYear}
                            onChange={(e) => {
                                setFinancialYear(e.target.value);
                                if (errors.financialYear) setErrors((prev) => ({ ...prev, financialYear: "" }));
                            }}
                            placeholder="e.g. 2025-26"
                            disabled={!canEdit || saving}
                            required
                        />
                        {errors.financialYear && (
                            <span className="boq-field-error" role="alert">{errors.financialYear}</span>
                        )}
                    </div>

                    <div className="boq-field">
                        <label htmlFor="sequenceFormat">
                            Sequence Format <span className="required">*</span>
                        </label>
                        <select
                            id="sequenceFormat"
                            className="boq-select"
                            value={sequenceFormat}
                            onChange={(e) => setSequenceFormat(e.target.value)}
                            disabled={!canEdit || saving}
                        >
                            {SEQUENCE_FORMATS.map((fmt) => (
                                <option key={fmt.value} value={fmt.value}>
                                    {fmt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Row 3: Revision Format * | LIVE PREVIEW */}
                    <div className="boq-field">
                        <label htmlFor="revisionFormat">
                            Revision Format <span className="required">*</span>
                        </label>
                        <input
                            id="revisionFormat"
                            type="text"
                            className={`boq-input ${errors.revisionFormat ? "has-error" : ""}`}
                            value={revisionFormat}
                            onChange={(e) => {
                                setRevisionFormat(e.target.value);
                                if (errors.revisionFormat) setErrors((prev) => ({ ...prev, revisionFormat: "" }));
                            }}
                            placeholder="e.g. REV-##"
                            disabled={!canEdit || saving}
                            required
                        />
                        {errors.revisionFormat && (
                            <span className="boq-field-error" role="alert">{errors.revisionFormat}</span>
                        )}
                    </div>

                    <div className="boq-field">
                        <label style={{ visibility: "hidden" }} aria-hidden="true">
                            Preview
                        </label>
                        <NumberingPreview settings={currentNumberingSettings} />
                    </div>
                </div>

                {/* Form Footer */}
                <div className="boq-form-footer" style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                        type="submit"
                        className="boq-btn-primary"
                        disabled={!canEdit || saving}
                    >
                        {saving ? (
                            <Loader2 size={16} className="spin" aria-hidden="true" />
                        ) : (
                            <Save size={16} aria-hidden="true" />
                        )}
                        <span>Save Changes</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
