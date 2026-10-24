"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { BoqPricingSettings, CategoryMarkup, BoqTaxRule } from "@/lib/settings/types";
import { ROUNDING_OPTIONS } from "@/lib/settings/adapter";
import { getCostingCategories } from "@/lib/api/costing";
import { CategoryMarkupRow } from "./CategoryMarkupRow";
import { PricingPreview } from "./PricingPreview";

interface PricingRulesProps {
    initialPricing: BoqPricingSettings;
    activeTaxRule?: BoqTaxRule;
    canEdit: boolean;
    onSavePricing: (pricing: BoqPricingSettings) => Promise<void>;
    showNotice?: (type: "success" | "error" | "info", message: string) => void;
}

export const PricingRules: React.FC<PricingRulesProps> = ({
    initialPricing,
    activeTaxRule,
    canEdit,
    onSavePricing,
    showNotice,
}) => {
    const [defaultMarkup, setDefaultMarkup] = useState<number>(initialPricing.defaultMarkupPercent ?? 18);
    const [categoryMarkups, setCategoryMarkups] = useState<CategoryMarkup[]>(initialPricing.categoryMarkups ?? []);
    const [discountLimit, setDiscountLimit] = useState<number>(initialPricing.discountLimitPercent ?? 10);
    const [marginThreshold, setMarginThreshold] = useState<number>(initialPricing.marginThresholdPercent ?? 25);
    const [wastage, setWastage] = useState<number>(initialPricing.wastagePercent ?? 5);
    const [contingency, setContingency] = useState<number>(initialPricing.contingencyPercent ?? 3);
    const [rounding, setRounding] = useState<string>(initialPricing.rounding ?? "Nearest ₹10");

    // Local state for Pricing Preview
    const [previewBaseCost, setPreviewBaseCost] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    // Sync when initialPricing updates
    useEffect(() => {
        setDefaultMarkup(initialPricing.defaultMarkupPercent ?? 18);
        setCategoryMarkups(initialPricing.categoryMarkups ?? []);
        setDiscountLimit(initialPricing.discountLimitPercent ?? 10);
        setMarginThreshold(initialPricing.marginThresholdPercent ?? 25);
        setWastage(initialPricing.wastagePercent ?? 5);
        setContingency(initialPricing.contingencyPercent ?? 3);
        setRounding(initialPricing.rounding ?? "Nearest ₹10");
    }, [initialPricing]);

    // Dynamically check for additional workspace categories
    useEffect(() => {
        let isMounted = true;
        getCostingCategories()
            .then((res) => {
                if (!isMounted || !res?.items) return;
                const existingNames = new Set(initialPricing.categoryMarkups?.map((c) => c.name.toLowerCase()) ?? []);
                const additional: CategoryMarkup[] = [];
                res.items.forEach((cat) => {
                    if (cat.name && !existingNames.has(cat.name.toLowerCase())) {
                        existingNames.add(cat.name.toLowerCase());
                        additional.push({
                            id: cat.id,
                            name: cat.name,
                            markupPercent: Number(cat.default_markup_percent) || 15,
                        });
                    }
                });
                if (additional.length > 0) {
                    setCategoryMarkups((prev) => [...prev, ...additional]);
                }
            })
            .catch(() => {
                // Silently fallback to seeded/stored category markups
            });

        return () => {
            isMounted = false;
        };
    }, [initialPricing.categoryMarkups]);

    const handleCategoryMarkupChange = (id: string, markupPercent: number) => {
        setCategoryMarkups((prev) =>
            prev.map((c) => (c.id === id ? { ...c, markupPercent } : c))
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit || saving) return;

        setSaving(true);
        try {
            const updatedPricing: BoqPricingSettings = {
                defaultMarkupPercent: Number(defaultMarkup) || 0,
                categoryMarkups,
                discountLimitPercent: Number(discountLimit) || 0,
                marginThresholdPercent: Number(marginThreshold) || 0,
                wastagePercent: Number(wastage) || 0,
                contingencyPercent: Number(contingency) || 0,
                rounding,
            };

            await onSavePricing(updatedPricing);
            showNotice?.("success", "Pricing rules saved successfully.");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Could not save pricing rules.";
            showNotice?.("error", msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="boq-pricing-layout">
            {/* Left Column: Configuration Cards (Width: 640px) */}
            <form onSubmit={handleSave} className="boq-pricing-main-col">
                {/* 1. Default Markup Card (Frame 2147225145: 640px x 171px) */}
                <div className="boq-pricing-card-markup boq-pricing-card">
                    <h2 className="boq-pricing-card-title">Default Markup</h2>
                    <div className="boq-pricing-divider-600" />
                    <div className="boq-pricing-field-600 boq-form-group">
                        <label htmlFor="default-markup-input" className="boq-pricing-label boq-form-label">
                            Default Markup (%) <span className="boq-required" style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                            id="default-markup-input"
                            type="number"
                            min="0"
                            max="500"
                            step="0.5"
                            value={defaultMarkup === 0 ? "" : defaultMarkup}
                            placeholder="18"
                            onChange={(e) => setDefaultMarkup(e.target.value === "" ? 0 : Number(e.target.value))}
                            disabled={!canEdit}
                            className="boq-pricing-input-600 boq-form-input"
                            required
                        />
                    </div>
                </div>

                {/* 2. Category Markups Card (Frame 2147225148: 640px x 302px) */}
                <div className="boq-pricing-card-categories">
                    <h2 className="boq-pricing-card-title">Category Markups</h2>
                    <div className="boq-pricing-divider-600" />
                    <div className="boq-category-markups-list">
                        {categoryMarkups.map((cat) => (
                            <CategoryMarkupRow
                                key={cat.id}
                                category={cat}
                                canEdit={canEdit}
                                onChange={handleCategoryMarkupChange}
                            />
                        ))}
                    </div>
                </div>

                {/* 3. Thresholds & Rules Card (Frame 2147225146: 640px x 299px) */}
                <div className="boq-pricing-card-thresholds">
                    <h2 className="boq-pricing-card-title">Thresholds & Rules</h2>
                    <div className="boq-pricing-divider-600" />

                    {/* Row 1: Discount Limit & Margin Threshold (600px x 73px, gap 20px) */}
                    <div className="boq-pricing-row-2col">
                        <div className="boq-pricing-field-290 boq-form-group">
                            <label htmlFor="discount-limit-input" className="boq-pricing-label boq-form-label">
                                Discount Limit (max %) <span className="boq-required" style={{ color: "#EF4444" }}>*</span>
                            </label>
                            <input
                                id="discount-limit-input"
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={discountLimit === 0 ? "" : discountLimit}
                                placeholder="10"
                                onChange={(e) => setDiscountLimit(e.target.value === "" ? 0 : Number(e.target.value))}
                                disabled={!canEdit}
                                className="boq-pricing-input-290 boq-form-input"
                                required
                            />
                        </div>

                        <div className="boq-pricing-field-290 boq-form-group">
                            <label htmlFor="margin-threshold-input" className="boq-pricing-label boq-form-label">
                                Margin Threshold (min %) <span className="boq-required" style={{ color: "#EF4444" }}>*</span>
                            </label>
                            <input
                                id="margin-threshold-input"
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={marginThreshold === 0 ? "" : marginThreshold}
                                placeholder="25"
                                onChange={(e) => setMarginThreshold(e.target.value === "" ? 0 : Number(e.target.value))}
                                disabled={!canEdit}
                                className="boq-pricing-input-290 boq-form-input"
                                required
                            />
                        </div>
                    </div>

                    {/* Row 2: Wastage & Contingency (600px x 73px, gap 20px) */}
                    <div className="boq-pricing-row-2col">
                        <div className="boq-pricing-field-290 boq-form-group">
                            <label htmlFor="wastage-input" className="boq-pricing-label boq-form-label">
                                Wastage (%) <span className="boq-required" style={{ color: "#EF4444" }}>*</span>
                            </label>
                            <input
                                id="wastage-input"
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={wastage === 0 ? "" : wastage}
                                placeholder="5"
                                onChange={(e) => setWastage(e.target.value === "" ? 0 : Number(e.target.value))}
                                disabled={!canEdit}
                                className="boq-pricing-input-290 boq-form-input"
                                required
                            />
                        </div>

                        <div className="boq-pricing-field-290 boq-form-group">
                            <label htmlFor="contingency-input" className="boq-pricing-label boq-form-label">
                                Contingency (%) <span className="boq-required" style={{ color: "#EF4444" }}>*</span>
                            </label>
                            <input
                                id="contingency-input"
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={contingency === 0 ? "" : contingency}
                                placeholder="3"
                                onChange={(e) => setContingency(e.target.value === "" ? 0 : Number(e.target.value))}
                                disabled={!canEdit}
                                className="boq-pricing-input-290 boq-form-input"
                                required
                            />
                        </div>
                    </div>

                    {/* Row 3: Rounding & Empty Spacer (600px x 73px, gap 20px) */}
                    <div className="boq-pricing-row-2col">
                        <div className="boq-pricing-field-290 boq-form-group">
                            <label htmlFor="rounding-select" className="boq-pricing-label boq-form-label">
                                Rounding <span className="boq-required" style={{ color: "#EF4444" }}>*</span>
                            </label>
                            <select
                                id="rounding-select"
                                value={rounding}
                                onChange={(e) => setRounding(e.target.value)}
                                disabled={!canEdit}
                                className="boq-pricing-select-290 boq-form-select"
                                required
                            >
                                {ROUNDING_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="boq-pricing-field-290" style={{ visibility: "hidden" }} aria-hidden="true" />
                    </div>
                </div>

                {/* Save Changes Button (Buttons Frame: 119px x 46px, radius 6px, #2563EB) */}
                {canEdit && (
                    <button
                        type="submit"
                        disabled={saving}
                        className="boq-btn-save-changes boq-btn-primary boq-save-btn"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="boq-spinner animate-spin" aria-hidden="true" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <span>Save Changes</span>
                        )}
                    </button>
                )}
            </form>

            {/* Right Column: Pricing Preview (Width: 412px, Height: 375px) */}
            <div className="boq-pricing-sidebar-col">
                <PricingPreview
                    baseCost={previewBaseCost}
                    onBaseCostChange={setPreviewBaseCost}
                    defaultMarkupPercent={defaultMarkup}
                    activeTaxName={activeTaxRule?.name}
                    activeTaxRate={activeTaxRule?.rate ?? 18}
                    rounding={rounding}
                />
            </div>
        </div>
    );
};
