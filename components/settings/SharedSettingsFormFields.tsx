"use client";

import React from "react";

export interface SharedFormFieldProps {
    label: string;
    type?: string;
    value?: string | number | boolean;
    onChange: (value: string | number | boolean) => void;
    placeholder?: string;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
    fullWidth?: boolean;
    checked?: boolean;
    disabled?: boolean;
    required?: boolean;
    hint?: string;
    className?: string;
}

export function Field({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    options,
    min,
    max,
    step,
    fullWidth,
    checked,
    disabled,
    required,
    hint,
    className = "",
}: SharedFormFieldProps) {
    const inputValue = value as string | number | undefined;

    return (
        <div className={`form-field ${fullWidth ? "full-width" : ""} ${className}`.trim()}>
            <label>
                {label}
                {required && <span className="required" style={{ color: "#dc2626" }}> *</span>}
            </label>
            {type === "checkbox" ? (
                <label className="checkbox-label" style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: disabled ? "not-allowed" : "pointer" }}>
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        disabled={disabled}
                    />
                    <span>Enabled</span>
                </label>
            ) : type === "select" ? (
                <select
                    value={inputValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="form-input"
                    disabled={disabled}
                >
                    {options?.map((o) => (
                        <option key={o} value={o}>
                            {o}
                        </option>
                    ))}
                </select>
            ) : type === "textarea" ? (
                <textarea
                    value={inputValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="form-textarea"
                    rows={3}
                    disabled={disabled}
                />
            ) : type === "color" ? (
                <input
                    type="color"
                    value={inputValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="color-input"
                    disabled={disabled}
                />
            ) : (
                <input
                    type={type}
                    value={inputValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    step={step}
                    className="form-input"
                    disabled={disabled}
                />
            )}
            {hint && <span className="field-hint" style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{hint}</span>}
        </div>
    );
}

export default Field;
