"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2, X } from "lucide-react";
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

    return createPortal(
        <div className="boq-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="unit-modal-title">
            <div className="boq-modal-container">
                {/* Modal Header (Frame 2147225093) */}
                <div className="boq-modal-header">
                    <h6 id="unit-modal-title" className="boq-modal-title">
                        {mode === "create" ? "Add Custom Unit" : "Edit Unit"}
                    </h6>
                    <button
                        type="button"
                        onClick={onClose}
                        className="boq-modal-close"
                        aria-label="Close modal"
                        disabled={submitting}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} noValidate className="boq-modal-form">
                    {/* Inner White Card (Frame 2147225027) */}
                    <div className="boq-modal-inner-card">
                        {/* 1. Unit Name * */}
                        <div className="boq-modal-field">
                            <div className="boq-modal-label-row">
                                <label htmlFor="unitName" className="boq-modal-label">
                                    Unit Name
                                </label>
                                <span className="boq-modal-required">*</span>
                            </div>
                            <div className="boq-modal-input-wrap">
                                <input
                                    id="unitName"
                                    type="text"
                                    className={`boq-modal-input ${formErrors.name ? "has-error" : ""}`}
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
                            </div>
                            {formErrors.name && (
                                <span className="boq-field-error" role="alert">{formErrors.name}</span>
                            )}
                        </div>

                        {/* 2. Short Code * & Decimal Places (Frame 2147225548) */}
                        <div className="boq-modal-row-2col">
                            {/* Short Code * */}
                            <div className="boq-modal-field">
                                <div className="boq-modal-label-row">
                                    <label htmlFor="shortCode" className="boq-modal-label">
                                        Short Code
                                    </label>
                                    <span className="boq-modal-required">*</span>
                                </div>
                                <div className="boq-modal-input-wrap">
                                    <input
                                        id="shortCode"
                                        type="text"
                                        className={`boq-modal-input ${formErrors.code ? "has-error" : ""}`}
                                        value={code}
                                        onChange={(e) => {
                                            setCode(e.target.value);
                                            if (formErrors.code) setFormErrors((prev) => ({ ...prev, code: "" }));
                                        }}
                                        placeholder="e.g. Bndl"
                                        disabled={submitting}
                                        required
                                    />
                                </div>
                                {formErrors.code && (
                                    <span className="boq-field-error" role="alert">{formErrors.code}</span>
                                )}
                            </div>

                            {/* Decimal Places */}
                            <div className="boq-modal-field">
                                <div className="boq-modal-label-row">
                                    <label htmlFor="decimalPlaces" className="boq-modal-label">
                                        Decimal Places
                                    </label>
                                </div>
                                <div className="boq-modal-select-wrap">
                                    <select
                                        id="decimalPlaces"
                                        className="boq-modal-select"
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
                                    <ChevronDown size={20} className="boq-modal-select-arrow" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        {/* 3. Type * (Frame 2147225303) */}
                        <div className="boq-modal-field">
                            <div className="boq-modal-label-row">
                                <label id="unit-type-label" className="boq-modal-label">
                                    Type
                                </label>
                                <span className="boq-modal-required">*</span>
                            </div>
                            <div
                                className="boq-modal-pills-row"
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
                                            className={`boq-type-pill ${isSelected ? "is-selected" : ""}`}
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

                    {/* Modal Footer (Frame 2147225095) */}
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
                            className="boq-modal-btn-submit"
                            disabled={submitting}
                        >
                            {submitting && <Loader2 size={16} className="spin" aria-hidden="true" />}
                            <span>{mode === "create" ? "Add Unit" : "Save Changes"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
