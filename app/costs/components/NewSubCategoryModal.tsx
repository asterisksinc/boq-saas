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
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.45)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: "20px"
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    width: "100%",
                    maxWidth: "520px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    animation: "fadeIn 0.15s ease-out"
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between"
                    }}
                >
                    <div>
                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
                            New Sub-Category
                        </h3>
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                            Create a sub-category under a parent category
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            padding: "4px",
                            cursor: "pointer",
                            color: "#94a3b8",
                            borderRadius: "6px"
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", padding: "24px", gap: "20px" }}>
                    {error && (
                        <div
                            style={{
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#b91c1c",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                fontSize: "13px"
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Sub-Category Title */}
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                            Sub-Category Title <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter sub-category title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "14px",
                                outline: "none",
                                boxSizing: "border-box"
                            }}
                            autoFocus
                        />
                    </div>

                    {/* Parent Category */}
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                            Parent Category <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div style={{ position: "relative" }}>
                            <select
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    paddingRight: "36px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "14px",
                                    outline: "none",
                                    backgroundColor: "#fff",
                                    appearance: "none",
                                    cursor: "pointer",
                                    boxSizing: "border-box"
                                }}
                            >
                                <option value="" disabled>Select parent category</option>
                                {parentOptions.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                size={16}
                                style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#94a3b8",
                                    pointerEvents: "none"
                                }}
                            />
                        </div>
                    </div>

                    {/* Sub-Category Code */}
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                            Sub-Category Code
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. SUB-CAT-001 (auto-generated if empty)"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "14px",
                                outline: "none",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "12px",
                            marginTop: "8px",
                            paddingTop: "16px",
                            borderTop: "1px solid #f1f5f9"
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            style={{
                                padding: "10px 20px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                background: "#fff",
                                color: "#475569",
                                fontSize: "14px",
                                fontWeight: 500,
                                cursor: "pointer"
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: "10px 22px",
                                borderRadius: "8px",
                                border: "none",
                                background: "#2563eb",
                                color: "#fff",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: loading ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                boxShadow: "0 1px 2px rgba(37,99,235,0.2)"
                            }}
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                            Create Sub-Category
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
