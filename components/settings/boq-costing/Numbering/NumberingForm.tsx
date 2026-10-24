"use client";

import { FormEvent, useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
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
        <form onSubmit={handleSubmit} className="boq-numbering-column" noValidate>
            {/* Form Card: Frame 2147225143 (1060px x 299px) */}
            <div className="boq-numbering-card">
                {/* Row 1: Frame 2147225536 (1020px x 73px) */}
                <div className="boq-numbering-row">
                    {/* BOQ Prefix */}
                    <div className="boq-numbering-field">
                        <div className="boq-numbering-label-row">
                            <label htmlFor="boqPrefix" className="boq-numbering-label">
                                BOQ Prefix
                            </label>
                            <span className="boq-numbering-required">*</span>
                        </div>
                        <div className="boq-numbering-input-wrap">
                            <input
                                id="boqPrefix"
                                type="text"
                                className={`boq-numbering-input ${errors.boqPrefix ? "has-error" : ""}`}
                                value={boqPrefix}
                                onChange={(e) => {
                                    setBoqPrefix(e.target.value);
                                    if (errors.boqPrefix) setErrors((prev) => ({ ...prev, boqPrefix: "" }));
                                }}
                                placeholder="BOQ"
                                disabled={!canEdit || saving}
                                required
                            />
                        </div>
                        {errors.boqPrefix && (
                            <span className="boq-field-error" role="alert">{errors.boqPrefix}</span>
                        )}
                    </div>

                    {/* Project Prefix */}
                    <div className="boq-numbering-field">
                        <div className="boq-numbering-label-row">
                            <label htmlFor="projectPrefix" className="boq-numbering-label">
                                Project Prefix
                            </label>
                            <span className="boq-numbering-required">*</span>
                        </div>
                        <div className="boq-numbering-input-wrap">
                            <input
                                id="projectPrefix"
                                type="text"
                                className={`boq-numbering-input ${errors.projectPrefix ? "has-error" : ""}`}
                                value={projectPrefix}
                                onChange={(e) => {
                                    setProjectPrefix(e.target.value);
                                    if (errors.projectPrefix) setErrors((prev) => ({ ...prev, projectPrefix: "" }));
                                }}
                                placeholder="PRJ"
                                disabled={!canEdit || saving}
                                required
                            />
                        </div>
                        {errors.projectPrefix && (
                            <span className="boq-field-error" role="alert">{errors.projectPrefix}</span>
                        )}
                    </div>
                </div>

                {/* Row 2: Frame 2147225541 inner (1020px x 73px) */}
                <div className="boq-numbering-row">
                    {/* Financial Year */}
                    <div className="boq-numbering-field">
                        <div className="boq-numbering-label-row">
                            <label htmlFor="financialYear" className="boq-numbering-label">
                                Financial Year
                            </label>
                            <span className="boq-numbering-required">*</span>
                        </div>
                        <div className="boq-numbering-input-wrap">
                            <input
                                id="financialYear"
                                type="text"
                                className={`boq-numbering-input ${errors.financialYear ? "has-error" : ""}`}
                                value={financialYear}
                                onChange={(e) => {
                                    setFinancialYear(e.target.value);
                                    if (errors.financialYear) setErrors((prev) => ({ ...prev, financialYear: "" }));
                                }}
                                placeholder="2025-26"
                                disabled={!canEdit || saving}
                                required
                            />
                        </div>
                        {errors.financialYear && (
                            <span className="boq-field-error" role="alert">{errors.financialYear}</span>
                        )}
                    </div>

                    {/* Sequence Format */}
                    <div className="boq-numbering-field">
                        <div className="boq-numbering-label-row">
                            <label htmlFor="sequenceFormat" className="boq-numbering-label">
                                Sequence Format
                            </label>
                            <span className="boq-numbering-required">*</span>
                        </div>
                        <div className="boq-numbering-select-wrap">
                            <select
                                id="sequenceFormat"
                                className="boq-numbering-select"
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
                            <ChevronDown size={20} className="boq-numbering-select-arrow" aria-hidden="true" />
                        </div>
                    </div>
                </div>

                {/* Row 3: Frame 2147225537 (1020px x 73px) */}
                <div className="boq-numbering-row">
                    {/* Revision Format */}
                    <div className="boq-numbering-field">
                        <div className="boq-numbering-label-row">
                            <label htmlFor="revisionFormat" className="boq-numbering-label">
                                Revision Format
                            </label>
                            <span className="boq-numbering-required">*</span>
                        </div>
                        <div className="boq-numbering-input-wrap">
                            <input
                                id="revisionFormat"
                                type="text"
                                className={`boq-numbering-input ${errors.revisionFormat ? "has-error" : ""}`}
                                value={revisionFormat}
                                onChange={(e) => {
                                    setRevisionFormat(e.target.value);
                                    if (errors.revisionFormat) setErrors((prev) => ({ ...prev, revisionFormat: "" }));
                                }}
                                placeholder="REV-##"
                                disabled={!canEdit || saving}
                                required
                            />
                        </div>
                        {errors.revisionFormat && (
                            <span className="boq-field-error" role="alert">{errors.revisionFormat}</span>
                        )}
                    </div>

                    {/* Live Preview Box: Frame 95 */}
                    <div className="boq-numbering-field">
                        <NumberingPreview settings={currentNumberingSettings} />
                    </div>
                </div>
            </div>

            {/* Save Changes Button: Buttons Frame (119px x 46px, order 1) */}
            <button
                type="submit"
                className="boq-btn-save-numbering"
                disabled={!canEdit || saving}
            >
                {saving && <Loader2 size={16} className="spin" aria-hidden="true" />}
                <span>Save Changes</span>
            </button>
        </form>
    );
}
