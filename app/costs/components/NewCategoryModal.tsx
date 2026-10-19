"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, Loader2 } from "lucide-react";
import { createCostingCategory, updateCostingCategory } from "@/lib/api/costing";
import type { CostingCategoryBackend, CostingCategoryDetail } from "@/lib/types";

interface NewCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categories: CostingCategoryBackend[];
    initialParentId?: string | null;
    categoryToEdit?: CostingCategoryBackend | CostingCategoryDetail | null;
}

const UNIT_OPTIONS = [
    "Nos",
    "Sq.ft",
    "Rft",
    "Sqm",
    "Set",
    "Cum",
    "Kg",
    "Ltr",
    "Sheet",
    "Box",
    "Lot",
    "Pair",
    "Meter"
];

export default function NewCategoryModal({
    isOpen,
    onClose,
    onSuccess,
    categories,
    initialParentId,
    categoryToEdit
}: NewCategoryModalProps) {
    const [title, setTitle] = useState("");
    const [parentId, setParentId] = useState<string>("");
    const [defaultUnit, setDefaultUnit] = useState("");
    const [defaultTax, setDefaultTax] = useState("18%");
    const [defaultMarkup, setDefaultMarkup] = useState("");
    const [defaultWastage, setDefaultWastage] = useState("");
    const [transportIncluded, setTransportIncluded] = useState<string>("");
    const [labourIncluded, setLabourIncluded] = useState<string>("");
    const [description, setDescription] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (categoryToEdit) {
                setTitle(categoryToEdit.name || "");
                setParentId(categoryToEdit.parent_id || initialParentId || "");
                setDefaultUnit(categoryToEdit.default_unit || "Nos");
                setDefaultTax(categoryToEdit.default_tax_percent !== null && categoryToEdit.default_tax_percent !== undefined ? `${categoryToEdit.default_tax_percent}%` : "18%");
                setDefaultMarkup(categoryToEdit.default_markup_percent !== null && categoryToEdit.default_markup_percent !== undefined ? `${categoryToEdit.default_markup_percent}` : "");
                setDefaultWastage(categoryToEdit.default_waste_percent !== null && categoryToEdit.default_waste_percent !== undefined ? `${categoryToEdit.default_waste_percent}` : "");
                setTransportIncluded(categoryToEdit.transport_included ? "Yes" : "No");
                setLabourIncluded(categoryToEdit.labour_included ? "Yes" : "No");
                setDescription(categoryToEdit.description || "");
                setError("");
            } else {
                setTitle("");
                setParentId(initialParentId || "");
                setDefaultUnit("Nos");
                setDefaultTax("18%");
                setDefaultMarkup("");
                setDefaultWastage("");
                setTransportIncluded("");
                setLabourIncluded("");
                setDescription("");
                setError("");
            }
        }
    }, [isOpen, initialParentId, categoryToEdit]);

    if (!isOpen) return null;

    // Potential parent categories (exclude self if editing)
    const parentOptions = categories.filter((c) => !c.parent_id && (!categoryToEdit || c.id !== categoryToEdit.id));

    const parsePercent = (val: string, fallback = 0): number => {
        if (!val) return fallback;
        const cleaned = val.replace(/[^0-9.]/g, "");
        const num = parseFloat(cleaned);
        return isNaN(num) ? fallback : num;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("Category Title is required.");
            return;
        }
        if (!defaultUnit) {
            setError("Default Unit is required.");
            return;
        }

        setLoading(true);

        try {
            if (categoryToEdit) {
                await updateCostingCategory(categoryToEdit.id, {
                    name: title.trim(),
                    parentId: parentId ? parentId : null,
                    defaultUnit: defaultUnit.trim(),
                    defaultTaxPercent: parsePercent(defaultTax, 18),
                    defaultMarkupPercent: parsePercent(defaultMarkup, 0),
                    defaultWastePercent: parsePercent(defaultWastage, 0),
                    transportIncluded: transportIncluded === "Yes",
                    labourIncluded: labourIncluded === "Yes",
                    description: description.trim() || undefined
                });
            } else {
                const prefix = title.trim().replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 4) || "CAT";
                const autoCode = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

                await createCostingCategory({
                    name: title.trim(),
                    code: autoCode,
                    parentId: parentId ? parentId : undefined,
                    defaultUnit: defaultUnit.trim(),
                    defaultTaxPercent: parsePercent(defaultTax, 18),
                    defaultMarkupPercent: parsePercent(defaultMarkup, 0),
                    defaultWastePercent: parsePercent(defaultWastage, 0),
                    transportIncluded: transportIncluded === "Yes",
                    labourIncluded: labourIncluded === "Yes",
                    description: description.trim() || undefined
                });
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : (categoryToEdit ? "Failed to update category" : "Failed to create category"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="costing-modal-overlay-centered"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="costing-modal-title"
        >
            <div
                className="costing-new-category-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Frame 2147225093) */}
                <div className="costing-modal-header">
                    <div className="costing-modal-title-stack">
                        <h2 id="costing-modal-title" className="costing-modal-title">
                            {categoryToEdit ? "Edit Category" : "New Category"}
                        </h2>
                        <div className="costing-modal-subtitle">
                            {categoryToEdit ? "Modify category details and pricing defaults" : "Starting from: From Scratch"}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="costing-modal-close-btn"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Inner White Card (Frame 2147225027) */}
                <form onSubmit={handleSubmit} className="costing-modal-inner-card">
                    {error && (
                        <div
                            style={{
                                width: "100%",
                                padding: "12px 14px",
                                background: "#FEF2F2",
                                border: "1px solid #FECACA",
                                borderRadius: "8px",
                                color: "#B91C1C",
                                fontSize: "13px",
                                boxSizing: "border-box"
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* 1. Category Title (Frame 16 + Frame 12) */}
                    <div className="costing-form-field">
                        <div className="costing-form-label-row">
                            <label className="costing-form-label" htmlFor="new-cat-title">
                                Category Title
                            </label>
                            <span className="costing-form-required">*</span>
                        </div>
                        <input
                            id="new-cat-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter Title"
                            className="costing-form-input"
                            required
                        />
                    </div>

                    {/* 2. Parent Category (Frame 16 + Frame 12) */}
                    <div className="costing-form-field">
                        <div className="costing-form-label-row">
                            <label className="costing-form-label" htmlFor="new-cat-parent">
                                Parent Category
                            </label>
                        </div>
                        <div className="costing-form-select-wrap">
                            <select
                                id="new-cat-parent"
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                className={`costing-form-select ${!parentId ? "is-placeholder" : ""}`}
                            >
                                <option value="">None (Root Category)</option>
                                {parentOptions.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <div className="costing-form-select-arrow">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                    </div>

                    {/* 3. 2-Col: Default Unit & Default Tax */}
                    <div className="costing-form-row-2col">
                        <div className="costing-form-field">
                            <div className="costing-form-label-row">
                                <label className="costing-form-label" htmlFor="new-cat-unit">
                                    Default Unit
                                </label>
                                <span className="costing-form-required">*</span>
                            </div>
                            <div className="costing-form-select-wrap">
                                <select
                                    id="new-cat-unit"
                                    value={defaultUnit}
                                    onChange={(e) => setDefaultUnit(e.target.value)}
                                    className={`costing-form-select ${!defaultUnit ? "is-placeholder" : ""}`}
                                    required
                                >
                                    <option value="" disabled>Select Unit</option>
                                    {UNIT_OPTIONS.map((u) => (
                                        <option key={u} value={u}>
                                            {u}
                                        </option>
                                    ))}
                                </select>
                                <div className="costing-form-select-arrow">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="costing-form-field">
                            <div className="costing-form-label-row">
                                <label className="costing-form-label" htmlFor="new-cat-tax">
                                    Default Tax
                                </label>
                                <span className="costing-form-required">*</span>
                            </div>
                            <input
                                id="new-cat-tax"
                                type="text"
                                value={defaultTax}
                                onChange={(e) => setDefaultTax(e.target.value)}
                                placeholder="18%"
                                className="costing-form-input"
                                required
                            />
                        </div>
                    </div>

                    {/* 4. 2-Col: Default Markup & Default Wastage */}
                    <div className="costing-form-row-2col">
                        <div className="costing-form-field">
                            <div className="costing-form-label-row">
                                <label className="costing-form-label" htmlFor="new-cat-markup">
                                    Default Markup
                                </label>
                                <span className="costing-form-required">*</span>
                            </div>
                            <input
                                id="new-cat-markup"
                                type="text"
                                value={defaultMarkup}
                                onChange={(e) => setDefaultMarkup(e.target.value)}
                                placeholder="ex. 15%"
                                className="costing-form-input"
                                required
                            />
                        </div>

                        <div className="costing-form-field">
                            <div className="costing-form-label-row">
                                <label className="costing-form-label" htmlFor="new-cat-wastage">
                                    Default Wastage
                                </label>
                                <span className="costing-form-required">*</span>
                            </div>
                            <input
                                id="new-cat-wastage"
                                type="text"
                                value={defaultWastage}
                                onChange={(e) => setDefaultWastage(e.target.value)}
                                placeholder="ex. 5%"
                                className="costing-form-input"
                                required
                            />
                        </div>
                    </div>

                    {/* 5. 2-Col: Transport Included & Labour Included */}
                    <div className="costing-form-row-2col">
                        <div className="costing-form-field">
                            <div className="costing-form-label-row">
                                <label className="costing-form-label" htmlFor="new-cat-transport">
                                    Transport Included
                                </label>
                            </div>
                            <div className="costing-form-select-wrap">
                                <select
                                    id="new-cat-transport"
                                    value={transportIncluded}
                                    onChange={(e) => setTransportIncluded(e.target.value)}
                                    className={`costing-form-select ${!transportIncluded ? "is-placeholder" : ""}`}
                                >
                                    <option value="">Choose Input</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                                <div className="costing-form-select-arrow">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="costing-form-field">
                            <div className="costing-form-label-row">
                                <label className="costing-form-label" htmlFor="new-cat-labour">
                                    Labour Included
                                </label>
                            </div>
                            <div className="costing-form-select-wrap">
                                <select
                                    id="new-cat-labour"
                                    value={labourIncluded}
                                    onChange={(e) => setLabourIncluded(e.target.value)}
                                    className={`costing-form-select ${!labourIncluded ? "is-placeholder" : ""}`}
                                >
                                    <option value="">Choose Input</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                                <div className="costing-form-select-arrow">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 6. Description (Frame 16 + Frame 12 Textarea) */}
                    <div className="costing-form-field">
                        <div className="costing-form-label-row">
                            <label className="costing-form-label" htmlFor="new-cat-desc">
                                Description
                            </label>
                        </div>
                        <textarea
                            id="new-cat-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add notes..."
                            className="costing-form-textarea"
                        />
                    </div>
                </form>

                {/* Footer Buttons (Frame 2147225069) */}
                <div className="costing-modal-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="costing-modal-cancel-btn"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="costing-modal-submit-btn"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {categoryToEdit ? "Save Changes" : "Create Category"}
                    </button>
                </div>
            </div>
        </div>
    );
}
