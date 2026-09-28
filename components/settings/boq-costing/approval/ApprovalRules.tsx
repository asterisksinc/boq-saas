"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { BoqApprovalSettings } from "@/lib/settings/types";
import { formatIndianNumber, parseIndianNumber } from "@/lib/settings/adapter";
import { ApprovalSettingRow } from "./ApprovalSettingRow";

interface ApprovalRulesProps {
    initialApproval: BoqApprovalSettings;
    canEdit: boolean;
    onSaveApproval: (approval: BoqApprovalSettings) => Promise<void>;
    showNotice?: (type: "success" | "error" | "info", message: string) => void;
}

export const ApprovalRules: React.FC<ApprovalRulesProps> = ({
    initialApproval,
    canEdit,
    onSaveApproval,
    showNotice,
}) => {
    const [internalApproval, setInternalApproval] = useState<boolean>(initialApproval.internalApprovalRequired ?? true);
    const [clientApproval, setClientApproval] = useState<boolean>(initialApproval.clientApprovalRequired ?? true);
    const [minValue, setMinValue] = useState<number>(initialApproval.minValueForApproval ?? 500000);
    const [minValueDisplay, setMinValueDisplay] = useState<string>(formatIndianNumber(initialApproval.minValueForApproval ?? 500000));
    const [isFocusedMinValue, setIsFocusedMinValue] = useState<boolean>(false);
    const [discountThreshold, setDiscountThreshold] = useState<number>(initialApproval.discountApprovalThresholdPercent ?? 5);
    const [marginThreshold, setMarginThreshold] = useState<number>(initialApproval.marginApprovalThresholdPercent ?? 20);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setInternalApproval(initialApproval.internalApprovalRequired ?? true);
        setClientApproval(initialApproval.clientApprovalRequired ?? true);
        const val = initialApproval.minValueForApproval ?? 500000;
        setMinValue(val);
        setMinValueDisplay(formatIndianNumber(val));
        setDiscountThreshold(initialApproval.discountApprovalThresholdPercent ?? 5);
        setMarginThreshold(initialApproval.marginApprovalThresholdPercent ?? 20);
    }, [initialApproval]);

    const handleMinValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setMinValueDisplay(text);
        const parsed = parseIndianNumber(text);
        setMinValue(parsed);
    };

    const handleMinValueBlur = () => {
        setIsFocusedMinValue(false);
        setMinValueDisplay(formatIndianNumber(minValue));
    };

    const handleMinValueFocus = () => {
        setIsFocusedMinValue(true);
        // Show raw number or clean value while typing
        setMinValueDisplay(minValue === 0 ? "" : String(minValue));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit || saving) return;

        if (minValue < 0) {
            showNotice?.("error", "Minimum value for approval must be greater than or equal to 0.");
            return;
        }
        if (discountThreshold < 0 || discountThreshold > 100) {
            showNotice?.("error", "Discount approval threshold must be between 0% and 100%.");
            return;
        }
        if (marginThreshold < 0 || marginThreshold > 100) {
            showNotice?.("error", "Margin approval threshold must be between 0% and 100%.");
            return;
        }

        setSaving(true);
        try {
            const updatedApproval: BoqApprovalSettings = {
                internalApprovalRequired: internalApproval,
                clientApprovalRequired: clientApproval,
                minValueForApproval: Number(minValue) || 0,
                discountApprovalThresholdPercent: Number(discountThreshold) || 0,
                marginApprovalThresholdPercent: Number(marginThreshold) || 0,
            };

            await onSaveApproval(updatedApproval);
            showNotice?.("success", "Approval rules saved successfully.");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Could not save approval rules.";
            showNotice?.("error", msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="boq-approval-container">
            {/* Card 1: Requirement Toggles */}
            <div className="boq-approval-toggles-card">
                <ApprovalSettingRow
                    id="approval-internal-required"
                    label="Internal Approval Required"
                    checked={internalApproval}
                    canEdit={canEdit}
                    onChange={setInternalApproval}
                />
                <div className="boq-toggle-divider" />
                <ApprovalSettingRow
                    id="approval-client-required"
                    label="Client Approval Required"
                    checked={clientApproval}
                    canEdit={canEdit}
                    onChange={setClientApproval}
                />
            </div>

            {/* Card 2: Numeric Thresholds */}
            <div className="boq-approval-thresholds-card">
                <div className="boq-threshold-grid">
                    <div className="boq-form-group">
                        <label htmlFor="approval-min-value-input" className="boq-form-label">
                            Min Value for Approval (₹) <span className="boq-required">*</span>
                        </label>
                        <input
                            id="approval-min-value-input"
                            type="text"
                            inputMode="numeric"
                            value={isFocusedMinValue ? minValueDisplay : formatIndianNumber(minValue)}
                            placeholder="5,00,000"
                            onChange={handleMinValueChange}
                            onFocus={handleMinValueFocus}
                            onBlur={handleMinValueBlur}
                            disabled={!canEdit}
                            className="boq-form-input"
                            required
                        />
                    </div>

                    <div className="boq-form-group">
                        <label htmlFor="approval-discount-threshold-input" className="boq-form-label">
                            Discount Approval Threshold (%) <span className="boq-required">*</span>
                        </label>
                        <input
                            id="approval-discount-threshold-input"
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={discountThreshold === 0 ? "" : discountThreshold}
                            placeholder="5"
                            onChange={(e) => setDiscountThreshold(e.target.value === "" ? 0 : Number(e.target.value))}
                            disabled={!canEdit}
                            className="boq-form-input"
                            required
                        />
                    </div>

                    <div className="boq-form-group">
                        <label htmlFor="approval-margin-threshold-input" className="boq-form-label">
                            Margin Approval Threshold (%) <span className="boq-required">*</span>
                        </label>
                        <input
                            id="approval-margin-threshold-input"
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={marginThreshold === 0 ? "" : marginThreshold}
                            placeholder="20"
                            onChange={(e) => setMarginThreshold(e.target.value === "" ? 0 : Number(e.target.value))}
                            disabled={!canEdit}
                            className="boq-form-input"
                            required
                        />
                    </div>

                    <div>{/* Empty column cell for clean 2-column grid alignment */}</div>
                </div>
            </div>

            {/* Save Changes Button */}
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
