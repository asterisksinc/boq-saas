"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { BoqTaxRule } from "@/lib/settings/types";

interface TaxRuleModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    initialRule: BoqTaxRule | null;
    existingRules: BoqTaxRule[];
    onClose: () => void;
    onSave: (ruleData: Omit<BoqTaxRule, "id"> & { id?: string }) => Promise<void>;
    showNotice: (message: string, type?: "success" | "error") => void;
}

export default function TaxRuleModal({
    isOpen,
    mode,
    initialRule,
    existingRules,
    onClose,
    onSave,
    showNotice,
}: TaxRuleModalProps) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [rate, setRate] = useState<string>("18");
    const [inclusive, setInclusive] = useState<boolean>(false);

    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        if (mode === "edit" && initialRule) {
            setName(initialRule.name || "");
            setCode(initialRule.code || "");
            setRate(String(initialRule.rate ?? 18));
            setInclusive(Boolean(initialRule.inclusive));
        } else {
            setName("");
            setCode("");
            setRate("18");
            setInclusive(false);
        }
        setFormErrors({});
    }, [isOpen, mode, initialRule]);

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
        const numRate = Number(rate);

        if (!trimmedName) {
            errors.name = "Rule Name is required";
        }

        if (!trimmedCode) {
            errors.code = "Tax Code is required";
        } else {
            const duplicate = existingRules.find(
                (r) =>
                    r.code.toLowerCase() === trimmedCode.toLowerCase() &&
                    (mode !== "edit" || r.id !== initialRule?.id)
            );
            if (duplicate) {
                errors.code = "A tax rule with this code already exists";
            }
        }

        if (isNaN(numRate) || numRate < 0 || numRate > 100) {
            errors.rate = "Rate must be a number between 0 and 100";
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
                id: initialRule?.id,
                name: name.trim(),
                code: code.trim(),
                rate: Number(rate),
                inclusive,
                active: initialRule ? initialRule.active : true,
            });
            showNotice(
                mode === "create" ? "Tax rule added successfully." : "Tax rule updated successfully.",
                "success"
            );
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to save tax rule.";
            showNotice(msg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="boq-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="tax-modal-title">
            <div className="boq-modal-container">
                {/* Modal Header */}
                <div className="boq-modal-header">
                    <h3 id="tax-modal-title" className="boq-modal-title">
                        {mode === "create" ? "Add Tax Rule" : "Edit Tax Rule"}
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
                        {/* Rule Name * */}
                        <div className="boq-field">
                            <label htmlFor="taxRuleName">
                                Rule Name <span className="required">*</span>
                            </label>
                            <input
                                id="taxRuleName"
                                type="text"
                                className={`boq-input ${formErrors.name ? "has-error" : ""}`}
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                                }}
                                placeholder="e.g. GST 18%"
                                disabled={submitting}
                                required
                                autoFocus
                            />
                            {formErrors.name && (
                                <span className="boq-field-error" role="alert">{formErrors.name}</span>
                            )}
                        </div>

                        {/* Tax Code * & Rate (%) */}
                        <div className="boq-modal-grid">
                            <div className="boq-field">
                                <label htmlFor="taxCode">
                                    Tax Code <span className="required">*</span>
                                </label>
                                <input
                                    id="taxCode"
                                    type="text"
                                    className={`boq-input ${formErrors.code ? "has-error" : ""}`}
                                    value={code}
                                    onChange={(e) => {
                                        setCode(e.target.value);
                                        if (formErrors.code) setFormErrors((prev) => ({ ...prev, code: "" }));
                                    }}
                                    placeholder="e.g. GST18"
                                    disabled={submitting}
                                    required
                                />
                                {formErrors.code && (
                                    <span className="boq-field-error" role="alert">{formErrors.code}</span>
                                )}
                            </div>

                            <div className="boq-field">
                                <label htmlFor="taxRate">
                                    Rate (%) <span className="required">*</span>
                                </label>
                                <input
                                    id="taxRate"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className={`boq-input ${formErrors.rate ? "has-error" : ""}`}
                                    value={rate}
                                    onChange={(e) => {
                                        setRate(e.target.value);
                                        if (formErrors.rate) setFormErrors((prev) => ({ ...prev, rate: "" }));
                                    }}
                                    placeholder="18"
                                    disabled={submitting}
                                    required
                                />
                                {formErrors.rate && (
                                    <span className="boq-field-error" role="alert">{formErrors.rate}</span>
                                )}
                            </div>
                        </div>

                        {/* Tax Inclusive Toggle Switch */}
                        <div className="boq-toggle-row">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={inclusive}
                                id="taxInclusive"
                                className={`boq-toggle ${inclusive ? "is-active" : ""}`}
                                onClick={() => setInclusive(!inclusive)}
                                disabled={submitting}
                            >
                                <span className="boq-toggle-thumb" />
                            </button>
                            <label htmlFor="taxInclusive" style={{ cursor: "pointer", fontWeight: 500, fontSize: "13.5px", color: "#334155" }}>
                                Tax Inclusive
                            </label>
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
                            <span>{mode === "create" ? "Add Rule" : "Save Changes"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
