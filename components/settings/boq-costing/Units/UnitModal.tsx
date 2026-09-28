"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { BoqUnit, UnitType } from "@/lib/settings/types";

interface UnitModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    initialUnit: BoqUnit | null;
    existingUnits: BoqUnit[];
    onClose: () => void;
    onSave: (unitData: Omit<BoqUnit, "id"> & { id?: string }) => Promise<void>;
    showNotice: (message: string, type?: "success" | "error") => void;
}

const UNIT_TYPES: UnitType[] = [
    "Count",
    "Area",
    "Length",
    "Weight",
    "Volume",
    "Time",
    "Other",
];

const DECIMAL_OPTIONS = [0, 1, 2, 3, 4];

export default function UnitModal({
    isOpen,
    mode,
    initialUnit,
    existingUnits,
    onClose,
    onSave,
    showNotice,
}: UnitModalProps) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [decimals, setDecimals] = useState<number>(0);
    const [type, setType] = useState<UnitType>("Count");

    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        if (mode === "edit" && initialUnit) {
            setName(initialUnit.name || "");
            setCode(initialUnit.code || "");
            setDecimals(typeof initialUnit.decimals === "number" ? initialUnit.decimals : 0);
            setType(initialUnit.type || "Count");
        } else {
            setName("");
            setCode("");
            setDecimals(0);
            setType("Count");
        }
        setFormErrors({});
    }, [isOpen, mode, initialUnit]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !submitting) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, submitting, onClose]);

    if (!isOpen) return null;

    const validateForm = () => {
        const errors: Record<string, string> = {};
        const trimmedName = name.trim();
        const trimmedCode = code.trim();

        if (!trimmedName) {
            errors.name = "Unit Name is required";
        }

        if (!trimmedCode) {
            errors.code = "Short Code is required";
        } else {
            // Check for duplicate code (exclude current unit in edit mode)
            const duplicate = existingUnits.find(
                (u) =>
                    u.code.toLowerCase() === trimmedCode.toLowerCase() &&
                    (mode !== "edit" || u.id !== initialUnit?.id)
            );
            if (duplicate) {
                errors.code = "A unit with this short code already exists";
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        setFormErrors({});

        try {
            await onSave({
                id: initialUnit?.id,
                name: name.trim(),
                code: code.trim(),
                decimals,
                type,
                active: initialUnit ? initialUnit.active : true,
                isCustom: true,
            });
            showNotice(
                mode === "create" ? "Unit added successfully." : "Unit updated successfully.",
                "success"
            );
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to save unit.";
            showNotice(msg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="boq-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="unit-modal-title">
            <div className="boq-modal-container">
                {/* Modal Header */}
                <div className="boq-modal-header">
                    <h3 id="unit-modal-title" className="boq-modal-title">
                        {mode === "create" ? "Add Custom Unit" : "Edit Unit"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="boq-modal-close"
                        aria-label="Close modal"
                        disabled={submitting}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="boq-modal-body">
                        {/* Unit Name * */}
                        <div className="boq-field">
                            <label htmlFor="unitName">
                                Unit Name <span className="required">*</span>
                            </label>
                            <input
                                id="unitName"
                                type="text"
                                className={`boq-input ${formErrors.name ? "has-error" : ""}`}
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                                }}
                                placeholder="e.g. Bundle"
                                disabled={submitting}
                                required
                                autoFocus
                            />
                            {formErrors.name && (
                                <span className="boq-field-error" role="alert">{formErrors.name}</span>
                            )}
                        </div>

                        {/* Short Code * & Decimal Places */}
                        <div className="boq-modal-grid">
                            <div className="boq-field">
                                <label htmlFor="shortCode">
                                    Short Code <span className="required">*</span>
                                </label>
                                <input
                                    id="shortCode"
                                    type="text"
                                    className={`boq-input ${formErrors.code ? "has-error" : ""}`}
                                    value={code}
                                    onChange={(e) => {
                                        setCode(e.target.value);
                                        if (formErrors.code) setFormErrors((prev) => ({ ...prev, code: "" }));
                                    }}
                                    placeholder="e.g. Bndl"
                                    disabled={submitting}
                                    required
                                />
                                {formErrors.code && (
                                    <span className="boq-field-error" role="alert">{formErrors.code}</span>
                                )}
                            </div>

                            <div className="boq-field">
                                <label htmlFor="decimalPlaces">
                                    Decimal Places
                                </label>
                                <select
                                    id="decimalPlaces"
                                    className="boq-select"
                                    value={decimals}
                                    onChange={(e) => setDecimals(Number(e.target.value))}
                                    disabled={submitting}
                                >
                                    {DECIMAL_OPTIONS.map((num) => (
                                        <option key={num} value={num}>
                                            {num}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Type * Segmented Buttons */}
                        <div className="boq-field">
                            <label id="unit-type-label">
                                Type <span className="required">*</span>
                            </label>
                            <div
                                className="boq-pill-group"
                                role="radiogroup"
                                aria-labelledby="unit-type-label"
                            >
                                {UNIT_TYPES.map((t) => {
                                    const isSelected = type === t;
                                    return (
                                        <button
                                            key={t}
                                            type="button"
                                            role="radio"
                                            aria-checked={isSelected}
                                            className={`boq-pill-btn ${isSelected ? "is-selected" : ""}`}
                                            onClick={() => setType(t)}
                                            disabled={submitting}
                                        >
                                            {t}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="boq-modal-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="boq-modal-btn-cancel"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="boq-btn-primary boq-modal-btn-submit"
                            disabled={submitting}
                        >
                            {submitting && <Loader2 size={16} className="spin" aria-hidden="true" />}
                            <span>{mode === "create" ? "Add Unit" : "Save Changes"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
