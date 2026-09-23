"use client";

import React from "react";

export interface SegmentedOption<T extends string> {
    value: T;
    label: string;
}

interface PreferenceSegmentedControlProps<T extends string> {
    options: SegmentedOption<T>[];
    value: T;
    onChange: (value: T) => void;
    disabled?: boolean;
    name?: string;
}

export default function PreferenceSegmentedControl<T extends string>({
    options,
    value,
    onChange,
    disabled = false,
    name,
}: PreferenceSegmentedControlProps<T>) {
    return (
        <div className="pref-segmented-group" role="radiogroup" aria-label={name}>
            {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={disabled}
                        className={`pref-segmented-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => onChange(opt.value)}
                    >
                        <span className={`pref-radio-indicator ${isSelected ? "selected" : ""}`}>
                            {isSelected && <span className="pref-radio-dot" />}
                        </span>
                        <span className="pref-btn-label">{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
