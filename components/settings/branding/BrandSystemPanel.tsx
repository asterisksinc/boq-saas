"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import ColorPickerField from "./ColorPickerField";
import BrandLivePreview from "./BrandLivePreview";
import { BrandingSettings, ButtonStyle, DocumentSpacing } from "@/lib/settings/types";
import { updateBrandingSettings } from "@/lib/api/auth";

interface BrandSystemPanelProps {
    branding: BrandingSettings;
    companyName?: string;
    onBrandingUpdated: (updated: BrandingSettings) => void;
    showNotice: (message: string, type?: "success" | "error") => void;
    setIsDirty?: (dirty: boolean) => void;
}

const SUPPORTED_FONTS = [
    "Urbanist",
    "Inter",
    "Roboto",
    "Plus Jakarta Sans",
    "Outfit",
    "Poppins",
    "Open Sans",
    "Montserrat",
    "DM Sans",
];

const BUTTON_STYLES: Array<{ key: ButtonStyle; label: string }> = [
    { key: "rounded", label: "Rounded" },
    { key: "square", label: "Square" },
    { key: "pill", label: "Pill" },
];

const DOCUMENT_SPACINGS: Array<{ key: DocumentSpacing; label: string }> = [
    { key: "compact", label: "Compact" },
    { key: "standard", label: "Standard" },
    { key: "spacious", label: "Spacious" },
];

export default function BrandSystemPanel({
    branding,
    companyName,
    onBrandingUpdated,
    showNotice,
    setIsDirty,
}: BrandSystemPanelProps) {
    // Local editable form state
    const [localBranding, setLocalBranding] = useState<BrandingSettings>(branding);
    const [saving, setSaving] = useState(false);

    // Keep in sync when external branding changes (e.g. initial load or asset upload)
    useEffect(() => {
        setLocalBranding(branding);
    }, [branding]);

    // Track dirty state
    useEffect(() => {
        const isDifferent =
            localBranding.colors?.primary !== branding.colors?.primary ||
            localBranding.colors?.secondary !== branding.colors?.secondary ||
            localBranding.colors?.accent !== branding.colors?.accent ||
            localBranding.colors?.text !== branding.colors?.text ||
            localBranding.font !== branding.font ||
            localBranding.buttonStyle !== branding.buttonStyle ||
            localBranding.documentSpacing !== branding.documentSpacing;

        setIsDirty?.(isDifferent);
    }, [localBranding, branding, setIsDirty]);

    const handleColorChange = (key: "primary" | "secondary" | "accent" | "text", val: string) => {
        setLocalBranding((prev) => ({
            ...prev,
            colors: {
                ...prev.colors,
                [key]: val,
            },
        }));
    };

    const handleFontChange = (font: string) => {
        setLocalBranding((prev) => ({
            ...prev,
            font,
        }));
    };

    const handleButtonStyleChange = (buttonStyle: ButtonStyle) => {
        setLocalBranding((prev) => ({
            ...prev,
            buttonStyle,
        }));
    };

    const handleSpacingChange = (documentSpacing: DocumentSpacing) => {
        setLocalBranding((prev) => ({
            ...prev,
            documentSpacing,
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await updateBrandingSettings({
                colors: localBranding.colors,
                font: localBranding.font,
                buttonStyle: localBranding.buttonStyle,
                documentSpacing: localBranding.documentSpacing,
            });
            onBrandingUpdated(updated);
            showNotice("Brand system saved successfully.", "success");
            setIsDirty?.(false);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to save brand settings.";
            showNotice(msg, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="brand-system-layout">
            <div className="brand-system-form-column">
                {/* 1. Brand Colors Card */}
                <div className="brand-system-card">
                    <h3 className="brand-system-card-title">Brand Colors</h3>
                    <div className="brand-colors-grid">
                        <ColorPickerField
                            label="Primary"
                            required
                            value={localBranding.colors?.primary || "#2563EB"}
                            onChange={(val) => handleColorChange("primary", val)}
                        />
                        <ColorPickerField
                            label="Secondary"
                            required
                            value={localBranding.colors?.secondary || "#E2E8F0"}
                            onChange={(val) => handleColorChange("secondary", val)}
                        />
                        <ColorPickerField
                            label="Accent"
                            required
                            value={localBranding.colors?.accent || "#64748B"}
                            onChange={(val) => handleColorChange("accent", val)}
                        />
                        <ColorPickerField
                            label="Text"
                            required
                            value={localBranding.colors?.text || "#0F172A"}
                            onChange={(val) => handleColorChange("text", val)}
                        />
                    </div>
                </div>

                {/* 2. Typography Card */}
                <div className="brand-system-card">
                    <h3 className="brand-system-card-title">Typography</h3>
                    <div className="brand-typography-field">
                        <label className="brand-field-label" htmlFor="brand-font-select">
                            Brand Font <span className="brand-field-required">*</span>
                        </label>
                        <div className="org-select-wrap">
                            <select
                                id="brand-font-select"
                                className="org-select"
                                value={localBranding.font || "Urbanist"}
                                onChange={(e) => handleFontChange(e.target.value)}
                            >
                                {SUPPORTED_FONTS.map((font) => (
                                    <option key={font} value={font}>
                                        {font}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 3. Document Style Card */}
                <div className="brand-system-card">
                    <h3 className="brand-system-card-title">Document Style</h3>

                    {/* Button Style */}
                    <div className="brand-style-row">
                        <span className="brand-style-row-label">Button Style</span>
                        <div className="brand-style-pill-group" role="radiogroup" aria-label="Button Style">
                            {BUTTON_STYLES.map((opt) => {
                                const isSelected = (localBranding.buttonStyle || "rounded") === opt.key;
                                return (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        className={`brand-style-pill ${isSelected ? "is-active" : ""}`}
                                        onClick={() => handleButtonStyleChange(opt.key)}
                                    >
                                        <span className={`brand-radio-indicator ${isSelected ? "is-checked" : ""}`} />
                                        <span className="brand-style-pill-label">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Document Spacing */}
                    <div className="brand-style-row">
                        <span className="brand-style-row-label">Document Spacing</span>
                        <div className="brand-style-pill-group" role="radiogroup" aria-label="Document Spacing">
                            {DOCUMENT_SPACINGS.map((opt) => {
                                const isSelected = (localBranding.documentSpacing || "compact") === opt.key;
                                return (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        className={`brand-style-pill ${isSelected ? "is-active" : ""}`}
                                        onClick={() => handleSpacingChange(opt.key)}
                                    >
                                        <span className={`brand-radio-indicator ${isSelected ? "is-checked" : ""}`} />
                                        <span className="brand-style-pill-label">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Save Changes Button at bottom right */}
                <div className="brand-system-footer">
                    <button
                        type="submit"
                        className="btn-primary brand-save-btn"
                        disabled={saving}
                    >
                        {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>

            {/* Right Column: Live Preview */}
            <div className="brand-system-preview-column">
                <BrandLivePreview
                    branding={localBranding}
                    companyName={companyName}
                />
            </div>
        </form>
    );
}
