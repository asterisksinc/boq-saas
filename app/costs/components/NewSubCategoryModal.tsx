"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, Loader2 } from "lucide-react";
import { createCostingCategory } from "@/lib/api/costing";
import type { CostingCategoryBackend } from "@/lib/types";

interface NewSubCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newSubCategory?: CostingCategoryBackend) => void;
    categories: CostingCategoryBackend[];
    initialParentId?: string | null;
}

export default function NewSubCategoryModal({
    isOpen,
    onClose,
    onSuccess,
    categories,
    initialParentId
}: NewSubCategoryModalProps) {
    const [title, setTitle] = useState("");
    const [parentId, setParentId] = useState<string>("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Only root categories can be parents of sub-categories
    const parentOptions = categories.filter((c) => !c.parent_id);

    useEffect(() => {
        if (isOpen) {
            setTitle("");
            setParentId(initialParentId || (parentOptions[0]?.id ?? ""));
            setCode("");
            setError("");
        }
    }, [isOpen, initialParentId, parentOptions]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("Sub-Category Title is required.");
            return;
        }

        if (!parentId) {
            setError("Parent Category is required.");
            return;
        }

        setLoading(true);

        try {
            const selectedParent = categories.find((c) => c.id === parentId);
            const parentPrefix = selectedParent?.code
                ? selectedParent.code.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase()
                : "SUB";
            const autoCode = code.trim() || `${parentPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

            const created = await createCostingCategory({
                name: title.trim(),
                code: autoCode,
                parentId: parentId,
                defaultUnit: selectedParent?.default_unit || "Nos",
                defaultTaxPercent: selectedParent?.default_tax_percent ?? 18,
                defaultMarkupPercent: selectedParent?.default_markup_percent ?? 20,
                defaultWastePercent: selectedParent?.default_waste_percent ?? 5,
                transportIncluded: selectedParent?.transport_included ?? false,
                labourIncluded: selectedParent?.labour_included ?? false
            });

            onSuccess(created);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create sub-category");
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
            aria-labelledby="new-subcat-title"
        >
            <div
                className="costing-new-category-modal"
                style={{ maxWidth: "520px" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Frame 2147225093) */}
                <div className="costing-modal-header">
                    <div className="costing-modal-title-stack">
                        <h2 id="new-subcat-title" className="costing-modal-title">
                            New Sub-Category
                        </h2>
                        <div className="costing-modal-subtitle">
                            Create a sub-category under a parent category
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

                {/* Form Content (Frame 2147225027) */}
                <form onSubmit={handleSubmit} className="costing-modal-inner-card">
                    {error && (
                        <div
                            style={{
                                width: "100%",
                                background: "#FEF2F2",
                                border: "1px solid #FECACA",
                                color: "#B91C1C",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                boxSizing: "border-box"
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Sub-Category Title */}
                    <div className="costing-form-field">
                        <div className="costing-form-label-row">
                            <label className="costing-form-label" htmlFor="subcat-title-input">
                                Sub-Category Title
                            </label>
                            <span className="costing-form-required">*</span>
                        </div>
                        <input
                            id="subcat-title-input"
                            type="text"
                            placeholder="Enter sub-category title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="costing-form-input"
                            autoFocus
                            required
                        />
                    </div>

                    {/* Parent Category */}
                    <div className="costing-form-field">
                        <div className="costing-form-label-row">
                            <label className="costing-form-label" htmlFor="subcat-parent-select">
                                Parent Category
                            </label>
                            <span className="costing-form-required">*</span>
                        </div>
                        <div className="costing-form-select-wrap">
                            <select
                                id="subcat-parent-select"
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                className={`costing-form-select ${!parentId ? "is-placeholder" : ""}`}
                                required
                            >
                                <option value="" disabled>Select parent category</option>
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

                    {/* Sub-Category Code */}
                    <div className="costing-form-field">
                        <div className="costing-form-label-row">
                            <label className="costing-form-label" htmlFor="subcat-code-input">
                                Sub-Category Code
                            </label>
                        </div>
                        <input
                            id="subcat-code-input"
                            type="text"
                            placeholder="e.g. SUB-CAT-001 (auto-generated if empty)"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="costing-form-input"
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
                        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                        Create Sub-Category
                    </button>
                </div>
            </div>
        </div>
    );
}
