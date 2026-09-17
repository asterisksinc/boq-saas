"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, Loader2 } from "lucide-react";
import { createCostingCategory } from "@/lib/api/costing";
import type { CostingCategoryBackend } from "@/lib/types";

interface NewCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categories: CostingCategoryBackend[];
    initialParentId?: string | null;
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
    initialParentId
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
    }, [isOpen, initialParentId]);

    if (!isOpen) return null;

    // Potential parent categories
    const parentOptions = categories.filter((c) => !c.parent_id);

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

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create category");
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
                    maxWidth: "540px",
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
                        padding: "24px 28px 20px 28px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start"
                    }}
                >
                    <div>
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "18px",
                                fontWeight: 700,
                                color: "#111827",
                                letterSpacing: "-0.01em"
                            }}
                        >
                            New Category
                        </h3>
                        <div
                            style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                marginTop: "4px"
                            }}
                        >
                            Starting from: From Scratch
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#9ca3af",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} style={{ padding: "0 28px 24px 28px" }}>
                    {error && (
                        <div
                            style={{
                                padding: "12px 14px",
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                borderRadius: "8px",
                                color: "#b91c1c",
                                fontSize: "13px",
                                marginBottom: "16px"
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Category Title */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "#374151",
                                    marginBottom: "6px"
                                }}
                            >
                                Category Title <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter Title"
                                style={{
                                    width: "100%",
                                    padding: "9px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #d1d5db",
                                    fontSize: "14px",
                                    outline: "none",
                                    color: "#111827",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>

                        {/* Parent Category */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "#374151",
                                    marginBottom: "6px"
                                }}
                            >
                                Parent Category
                            </label>
                            <div style={{ position: "relative" }}>
                                <select
                                    value={parentId}
                                    onChange={(e) => setParentId(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        paddingRight: "36px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        fontSize: "14px",
                                        outline: "none",
                                        color: parentId ? "#111827" : "#6b7280",
                                        backgroundColor: "#fff",
                                        appearance: "none",
                                        cursor: "pointer",
                                        boxSizing: "border-box"
                                    }}
                                >
                                    <option value="">ex. Master Bedroom</option>
                                    <option value="">None (Root Category)</option>
                                    {parentOptions.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={16}
                                    color="#9ca3af"
                                    style={{
                                        position: "absolute",
                                        right: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        pointerEvents: "none"
                                    }}
                                />
                            </div>
                        </div>

                        {/* 2-Col: Default Unit & Default Tax */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        color: "#374151",
                                        marginBottom: "6px"
                                    }}
                                >
                                    Default Unit <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <div style={{ position: "relative" }}>
                                    <select
                                        value={defaultUnit}
                                        onChange={(e) => setDefaultUnit(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "9px 12px",
                                            paddingRight: "36px",
                                            borderRadius: "8px",
                                            border: "1px solid #d1d5db",
                                            fontSize: "14px",
                                            outline: "none",
                                            color: defaultUnit ? "#111827" : "#9ca3af",
                                            backgroundColor: "#fff",
                                            appearance: "none",
                                            cursor: "pointer",
                                            boxSizing: "border-box"
                                        }}
                                    >
                                        <option value="">Select Unit</option>
                                        {UNIT_OPTIONS.map((u) => (
                                            <option key={u} value={u}>
                                                {u}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        size={16}
                                        color="#9ca3af"
                                        style={{
                                            position: "absolute",
                                            right: "12px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            pointerEvents: "none"
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        color: "#374151",
                                        marginBottom: "6px"
                                    }}
                                >
                                    Default Tax <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={defaultTax}
                                    onChange={(e) => setDefaultTax(e.target.value)}
                                    placeholder="18%"
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        fontSize: "14px",
                                        outline: "none",
                                        color: "#111827",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        </div>

                        {/* 2-Col: Default Markup & Default Wastage */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        color: "#374151",
                                        marginBottom: "6px"
                                    }}
                                >
                                    Default Markup <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={defaultMarkup}
                                    onChange={(e) => setDefaultMarkup(e.target.value)}
                                    placeholder="ex. 15%"
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        fontSize: "14px",
                                        outline: "none",
                                        color: "#111827",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        color: "#374151",
                                        marginBottom: "6px"
                                    }}
                                >
                                    Default Wastage <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={defaultWastage}
                                    onChange={(e) => setDefaultWastage(e.target.value)}
                                    placeholder="ex. 5%"
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        fontSize: "14px",
                                        outline: "none",
                                        color: "#111827",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        </div>

                        {/* 2-Col: Transport Included & Labour Included */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        color: "#374151",
                                        marginBottom: "6px"
                                    }}
                                >
                                    Transport Included
                                </label>
                                <div style={{ position: "relative" }}>
                                    <select
                                        value={transportIncluded}
                                        onChange={(e) => setTransportIncluded(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "9px 12px",
                                            paddingRight: "36px",
                                            borderRadius: "8px",
                                            border: "1px solid #d1d5db",
                                            fontSize: "14px",
                                            outline: "none",
                                            color: transportIncluded ? "#111827" : "#9ca3af",
                                            backgroundColor: "#fff",
                                            appearance: "none",
                                            cursor: "pointer",
                                            boxSizing: "border-box"
                                        }}
                                    >
                                        <option value="">Choose Input</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                    <ChevronDown
                                        size={16}
                                        color="#9ca3af"
                                        style={{
                                            position: "absolute",
                                            right: "12px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            pointerEvents: "none"
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        color: "#374151",
                                        marginBottom: "6px"
                                    }}
                                >
                                    Labour Included
                                </label>
                                <div style={{ position: "relative" }}>
                                    <select
                                        value={labourIncluded}
                                        onChange={(e) => setLabourIncluded(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "9px 12px",
                                            paddingRight: "36px",
                                            borderRadius: "8px",
                                            border: "1px solid #d1d5db",
                                            fontSize: "14px",
                                            outline: "none",
                                            color: labourIncluded ? "#111827" : "#9ca3af",
                                            backgroundColor: "#fff",
                                            appearance: "none",
                                            cursor: "pointer",
                                            boxSizing: "border-box"
                                        }}
                                    >
                                        <option value="">Choose Input</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                    <ChevronDown
                                        size={16}
                                        color="#9ca3af"
                                        style={{
                                            position: "absolute",
                                            right: "12px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            pointerEvents: "none"
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "#374151",
                                    marginBottom: "6px"
                                }}
                            >
                                Description
                            </label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add notes..."
                                style={{
                                    width: "100%",
                                    padding: "9px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #d1d5db",
                                    fontSize: "14px",
                                    outline: "none",
                                    color: "#111827",
                                    boxSizing: "border-box",
                                    resize: "vertical"
                                }}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "28px"
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: "9px 20px",
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#374151",
                                cursor: "pointer"
                            }}
                        >
                            Back
                        </button>

                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: "9px 16px",
                                    background: "transparent",
                                    border: "none",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: "#4b5563",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: "9px 22px",
                                    background: "#2563eb",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: "#fff",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    opacity: loading ? 0.7 : 1,
                                    boxShadow: "0 1px 2px rgba(37, 99, 235, 0.2)"
                                }}
                            >
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                Create Category
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
