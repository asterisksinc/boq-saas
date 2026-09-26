"use client";

import React, { useRef } from "react";

interface ColorPickerFieldProps {
    label: string;
    value: string;
    onChange: (colorHex: string) => void;
    required?: boolean;
}

export default function ColorPickerField({
    label,
    value,
    onChange,
    required = true,
}: ColorPickerFieldProps) {
    const colorInputRef = useRef<HTMLInputElement | null>(null);

    // Normalize hex value for color picker input (requires #RRGGBB)
    const normalizedColorForInput = (() => {
        const trimmed = value.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
            return trimmed;
        }
        if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
            const r = trimmed[1];
            const g = trimmed[2];
            const b = trimmed[3];
            return `#${r}${r}${g}${g}${b}${b}`;
        }
        return "#2563EB";
    })();

    const handleSwatchClick = () => {
        colorInputRef.current?.click();
    };

    const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value.toUpperCase());
    };

    const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.trim();
        if (val && !val.startsWith("#")) {
            val = "#" + val;
        }
        onChange(val.toUpperCase());
    };

    return (
        <div className="brand-color-field">
            <label className="brand-color-label">
                {label}
                {required && <span className="brand-field-required">*</span>}
            </label>

            <div className="brand-color-input-container">
                {/* Native hidden color input */}
                <input
                    ref={colorInputRef}
                    type="color"
                    value={normalizedColorForInput}
                    onChange={handleNativeColorChange}
                    className="brand-color-native-input"
                    style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
                    aria-label={`Select ${label} color`}
                />

                {/* Visible color swatch button matching reference screenshot */}
                <button
                    type="button"
                    className="brand-color-swatch-btn"
                    style={{ backgroundColor: normalizedColorForInput }}
                    onClick={handleSwatchClick}
                    title="Click to pick a color"
                    aria-label={`Pick ${label} color, currently ${value}`}
                />

                {/* Editable hex text input matching reference */}
                <input
                    type="text"
                    className="brand-color-hex-input"
                    value={value}
                    onChange={handleTextInputChange}
                    maxLength={9}
                    placeholder="#2563EB"
                    aria-label={`${label} hex code`}
                />
            </div>
        </div>
    );
}
