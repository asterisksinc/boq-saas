"use client";

import React from "react";

interface ApprovalSettingRowProps {
    id: string;
    label: string;
    checked: boolean;
    canEdit: boolean;
    onChange: (checked: boolean) => void;
}

export const ApprovalSettingRow: React.FC<ApprovalSettingRowProps> = ({
    id,
    label,
    checked,
    canEdit,
    onChange,
}) => {
    return (
        <div className="boq-approval-toggle-row">
            <label htmlFor={id} className="boq-approval-toggle-label">
                {label}
            </label>
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={!canEdit}
                onClick={() => onChange(!checked)}
                className={`boq-toggle-switch ${checked ? "is-active" : ""}`}
                aria-label={`Toggle ${label}`}
            >
                <span className="boq-toggle-knob" />
            </button>
        </div>
    );
};
