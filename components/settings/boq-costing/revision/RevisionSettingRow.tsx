"use client";

import React from "react";

interface RevisionSettingRowProps {
    id: string;
    title: string;
    description: string;
    checked: boolean;
    canEdit: boolean;
    onChange: (checked: boolean) => void;
}

export const RevisionSettingRow: React.FC<RevisionSettingRowProps> = ({
    id,
    title,
    description,
    checked,
    canEdit,
    onChange,
}) => {
    return (
        <div className="boq-setting-row-card">
            <div className="boq-setting-info">
                <label htmlFor={id} className="boq-setting-title">
                    {title}
                </label>
                <p className="boq-setting-description">{description}</p>
            </div>
            <div className="boq-setting-control">
                <button
                    id={id}
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    disabled={!canEdit}
                    onClick={() => onChange(!checked)}
                    className={`boq-toggle-switch ${checked ? "is-active" : ""}`}
                    aria-label={`Toggle ${title}`}
                >
                    <span className="boq-toggle-knob" />
                </button>
            </div>
        </div>
    );
};
