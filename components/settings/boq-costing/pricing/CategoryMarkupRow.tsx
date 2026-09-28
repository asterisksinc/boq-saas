"use client";

import React from "react";
import type { CategoryMarkup } from "@/lib/settings/types";

interface CategoryMarkupRowProps {
    category: CategoryMarkup;
    canEdit: boolean;
    onChange: (id: string, markupPercent: number) => void;
}

export const CategoryMarkupRow: React.FC<CategoryMarkupRowProps> = ({
    category,
    canEdit,
    onChange,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === "") {
            onChange(category.id, 0);
            return;
        }
        const parsed = Number(val);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 500) {
            onChange(category.id, parsed);
        }
    };

    return (
        <div className="boq-category-markup-row">
            <span className="boq-category-name">{category.name}</span>
            <div className="boq-compact-input-group">
                <input
                    type="number"
                    min="0"
                    max="500"
                    step="0.5"
                    value={category.markupPercent === 0 ? "" : category.markupPercent}
                    placeholder="0"
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="boq-compact-number-input"
                    aria-label={`${category.name} markup percentage`}
                />
                <span className="boq-input-suffix" aria-hidden="true">%</span>
            </div>
        </div>
    );
};
