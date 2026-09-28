"use client";

import React from "react";
import { calculatePricingPreview, formatIndianNumber } from "@/lib/settings/adapter";

interface PricingPreviewProps {
    baseCost: number | null;
    onBaseCostChange: (val: number | null) => void;
    defaultMarkupPercent: number;
    activeTaxName?: string;
    activeTaxRate: number;
    rounding: string;
}

export const PricingPreview: React.FC<PricingPreviewProps> = ({
    baseCost,
    onBaseCostChange,
    defaultMarkupPercent,
    activeTaxName,
    activeTaxRate,
    rounding,
}) => {
    const preview = calculatePricingPreview(baseCost, defaultMarkupPercent, activeTaxRate, rounding);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/,/g, "").trim();
        if (val === "") {
            onBaseCostChange(null);
            return;
        }
        const num = Number(val);
        if (!isNaN(num) && num >= 0) {
            onBaseCostChange(num);
        }
    };

    const taxLabel = activeTaxName ? `Tax (${activeTaxName})` : `Tax (GST ${activeTaxRate}%)`;

    return (
        <aside className="boq-pricing-preview-card" aria-label="Pricing Preview">
            <h3 className="boq-preview-header">PRICING PREVIEW</h3>

            <div className="boq-preview-input-group">
                <label htmlFor="pricing-base-cost" className="boq-form-label">
                    Base Cost (₹) <span className="boq-required">*</span>
                </label>
                <input
                    id="pricing-base-cost"
                    type="number"
                    min="0"
                    step="any"
                    value={baseCost === null ? "" : baseCost}
                    onChange={handleInputChange}
                    className="boq-form-input boq-preview-input"
                />
            </div>

            <div className="boq-preview-breakdown">
                <div className="boq-preview-row">
                    <span className="boq-preview-key">Markup</span>
                    <span className="boq-preview-val">
                        {preview.markupAmount !== null ? `₹${formatIndianNumber(preview.markupAmount)}` : "-"}
                    </span>
                </div>

                <div className="boq-preview-row">
                    <span className="boq-preview-key">{taxLabel}</span>
                    <span className="boq-preview-val">
                        {preview.taxAmount !== null ? `₹${formatIndianNumber(preview.taxAmount)}` : "-"}
                    </span>
                </div>

                <div className="boq-preview-row">
                    <span className="boq-preview-key">Final Price</span>
                    <span className="boq-preview-val boq-preview-final">
                        {preview.finalPrice !== null ? `₹${formatIndianNumber(preview.finalPrice)}` : "-"}
                    </span>
                </div>

                <div className="boq-preview-row boq-preview-row-last">
                    <span className="boq-preview-key">Gross Margin</span>
                    <span className="boq-preview-val">
                        {preview.grossMarginPercent !== null ? `${preview.grossMarginPercent}%` : "-"}
                    </span>
                </div>
            </div>
        </aside>
    );
};
