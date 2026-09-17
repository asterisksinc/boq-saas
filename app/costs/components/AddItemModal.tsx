"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, UploadCloud, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { getCostingCategories, createCostingItem, uploadCostingImage } from "@/lib/api/costing";
import type { CostingCategoryBackend, CostingItemBackend } from "@/lib/types";

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (item: CostingItemBackend) => void;
    existingVendors?: string[];
}

const POPULAR_UNITS = [
    { label: "Nos (Numbers / Pieces)", value: "Nos" },
    { label: "Sq.ft (Square Feet)", value: "Sq.ft" },
    { label: "Rft (Running Feet)", value: "Rft" },
    { label: "Sqm (Square Meters)", value: "Sqm" },
    { label: "Mtr (Meters)", value: "Mtr" },
    { label: "Cu.ft (Cubic Feet)", value: "Cu.ft" },
    { label: "Kg (Kilograms)", value: "Kg" },
    { label: "Set (Sets)", value: "Set" },
    { label: "L.S. (Lump Sum)", value: "L.S." },
    { label: "Hours", value: "Hours" },
];

const DEFAULT_VENDORS = [
    "WoodCraft Studios",
    "Sierra Furniture",
    "Oakline Works",
    "Luma Studio",
    "Urban Living Co.",
    "Royal Deco Hardware",
    "Apex Civil Solutions",
];

export default function AddItemModal({ isOpen, onClose, onSuccess, existingVendors = [] }: AddItemModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form fields
    const [name, setName] = useState("");
    const [selectedParentCatId, setSelectedParentCatId] = useState("");
    const [selectedSubCatId, setSelectedSubCatId] = useState("");
    const [unit, setUnit] = useState("");
    const [baseCost, setBaseCost] = useState("");
    const [sellingRate, setSellingRate] = useState("");
    const [spec, setSpec] = useState("");
    const [rateStatus, setRateStatus] = useState("active");
    const [vendor, setVendor] = useState("");
    const [isCustomVendor, setIsCustomVendor] = useState(false);
    const [customVendorName, setCustomVendorName] = useState("");
    const [description, setDescription] = useState("");

    // Image upload state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Categories data
    const [categories, setCategories] = useState<CostingCategoryBackend[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // Submission & UI feedback
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Load categories when modal opens
    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;
        setLoadingCategories(true);
        setError("");

        getCostingCategories({ pageSize: 100 })
            .then((res) => {
                if (isMounted) {
                    setCategories(res.items || []);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "Failed to load categories");
                }
            })
            .finally(() => {
                if (isMounted) setLoadingCategories(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    // Parent categories (parent_id is null or empty)
    const parentCategories = categories.filter((c) => !c.parent_id);

    // Subcategories for the selected parent category
    const availableSubCategories = selectedParentCatId
        ? categories.filter((c) => c.parent_id === selectedParentCatId)
        : [];

    // Combine default and existing vendors
    const allVendors = Array.from(new Set([...DEFAULT_VENDORS, ...existingVendors.filter(Boolean)]));

    // Handle parent category selection
    const handleParentCatChange = (parentId: string) => {
        setSelectedParentCatId(parentId);
        setSelectedSubCatId("");

        const cat = categories.find((c) => c.id === parentId);
        if (cat?.default_unit) {
            setUnit(cat.default_unit);
        }
    };

    // Handle subcategory selection
    const handleSubCatChange = (subId: string) => {
        setSelectedSubCatId(subId);
        if (subId) {
            const sub = categories.find((c) => c.id === subId);
            if (sub?.default_unit) {
                setUnit(sub.default_unit);
            }
        }
    };

    // Drag & Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file (PNG, JPG, WEBP, SVG).");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError("Image file size must be less than 10MB.");
            return;
        }

        setError("");
        setImageFile(file);

        // Instant local preview
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Final Category ID: use sub-category if chosen, else parent category
        const finalCategoryId = selectedSubCatId || selectedParentCatId;

        // Effective Vendor
        const finalVendor = isCustomVendor ? customVendorName.trim() : vendor.trim();

        if (!name.trim()) {
            setError("Item Name is required.");
            return;
        }
        if (!finalCategoryId) {
            setError("Please select a Category.");
            return;
        }
        if (!unit.trim()) {
            setError("Please select a Unit.");
            return;
        }
        const parsedBaseCost = parseFloat(baseCost.replace(/,/g, ""));
        if (isNaN(parsedBaseCost) || parsedBaseCost < 0) {
            setError("Please enter a valid Base Cost.");
            return;
        }
        const parsedSellingRate = sellingRate ? parseFloat(sellingRate.replace(/,/g, "")) : parsedBaseCost * 1.25;
        if (isNaN(parsedSellingRate) || parsedSellingRate < 0) {
            setError("Please enter a valid Selling Rate.");
            return;
        }
        if (!finalVendor) {
            setError("Please select or enter a Vendor.");
            return;
        }
        if (!description.trim()) {
            setError("Description is required.");
            return;
        }

        setSubmitting(true);

        try {
            // Upload image if provided
            let uploadedImageUrl: string | null = null;
            if (imageFile) {
                try {
                    const uploadRes = await uploadCostingImage(imageFile);
                    uploadedImageUrl = uploadRes.url;
                } catch {
                    // Fallback to data URL preview if direct storage upload is unavailable
                    uploadedImageUrl = imagePreview;
                }
            }

            // Find category for code prefix
            const selectedCat = categories.find((c) => c.id === finalCategoryId);
            const catCodePrefix = selectedCat?.code
                ? selectedCat.code.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8)
                : "ITM";
            const autoCode = `${catCodePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

            const newItem = await createCostingItem({
                name: name.trim(),
                code: autoCode,
                categoryId: finalCategoryId,
                unit: unit.trim(),
                baseCost: parsedBaseCost,
                sellingRate: parsedSellingRate,
                preferredVendor: finalVendor,
                spec: spec.trim() || null,
                description: description.trim(),
                rateStatus,
                imageUrl: uploadedImageUrl,
            });

            onSuccess(newItem);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create costing item.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setName("");
        setSelectedParentCatId("");
        setSelectedSubCatId("");
        setUnit("");
        setBaseCost("");
        setSellingRate("");
        setSpec("");
        setRateStatus("active");
        setVendor("");
        setIsCustomVendor(false);
        setCustomVendorName("");
        setDescription("");
        setImageFile(null);
        setImagePreview(null);
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.45)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                zIndex: 1000,
            }}
            onClick={handleClose}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    width: "100%",
                    maxWidth: "560px",
                    maxHeight: "92vh",
                    borderRadius: "20px",
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(226, 232, 240, 0.8)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div
                    style={{
                        padding: "22px 28px 18px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid #f1f5f9",
                    }}
                >
                    <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "#0f172a" }}>Add Item</h3>
                    <button
                        type="button"
                        onClick={handleClose}
                        style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#64748b",
                            transition: "all 0.15s",
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        padding: "20px 28px",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        flex: 1,
                    }}
                >
                    {error && (
                        <div
                            style={{
                                padding: "12px 16px",
                                background: "#fef2f2",
                                color: "#b91c1c",
                                borderRadius: "10px",
                                fontSize: "13.5px",
                                border: "1px solid #fecaca",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Item Name */}
                    <div>
                        <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                            Item Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Item Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: "100%",
                                height: "44px",
                                padding: "0 14px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "10px",
                                outline: "none",
                                fontSize: "14px",
                                color: "#0f172a",
                                boxSizing: "border-box",
                                transition: "border-color 0.15s",
                            }}
                        />
                    </div>

                    {/* Item Image (Drag & Drop) */}
                    <div>
                        <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                            Item Image
                        </label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleFileSelect(e.target.files[0]);
                                }
                            }}
                        />

                        {imagePreview ? (
                            <div
                                style={{
                                    border: "1.5px solid #e2e8f0",
                                    borderRadius: "14px",
                                    padding: "12px 16px",
                                    background: "#f8fafc",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                                    />
                                    <div style={{ overflow: "hidden" }}>
                                        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0f172a", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "300px" }}>
                                            {imageFile?.name || "Uploaded Image"}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                                            {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : "Ready"}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    style={{
                                        background: "#fee2e2",
                                        border: "none",
                                        borderRadius: "8px",
                                        padding: "8px",
                                        color: "#ef4444",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "12px",
                                        fontWeight: 500,
                                    }}
                                >
                                    <Trash2 size={16} /> Remove
                                </button>
                            </div>
                        ) : (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: isDragging ? "2px dashed #3b82f6" : "1.5px dashed #cbd5e1",
                                    borderRadius: "14px",
                                    padding: "24px 16px",
                                    textAlign: "center",
                                    background: isDragging ? "#eff6ff" : "#f8fafc",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                <div
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        background: "#eff6ff",
                                        border: "1px solid #bfdbfe",
                                        color: "#2563eb",
                                        borderRadius: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 10px",
                                    }}
                                >
                                    <UploadCloud size={24} />
                                </div>
                                <p style={{ margin: 0, color: "#1e293b", fontWeight: 600, fontSize: "14px" }}>
                                    Drag & Drop Your File Here
                                </p>
                                <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "12px" }}>
                                    or click to browse from device (PNG, JPG, WEBP)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                            Category <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div style={{ position: "relative" }}>
                            <select
                                value={selectedParentCatId}
                                onChange={(e) => handleParentCatChange(e.target.value)}
                                style={{
                                    width: "100%",
                                    height: "44px",
                                    padding: "0 36px 0 14px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    outline: "none",
                                    fontSize: "14px",
                                    appearance: "none",
                                    color: selectedParentCatId ? "#0f172a" : "#94a3b8",
                                    background: "#ffffff",
                                    boxSizing: "border-box",
                                    cursor: "pointer",
                                }}
                            >
                                <option value="" disabled>Select category</option>
                                {loadingCategories ? (
                                    <option value="" disabled>Loading categories...</option>
                                ) : (
                                    parentCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id} style={{ color: "#0f172a" }}>
                                            {cat.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            <ChevronDown size={16} color="#64748b" style={{ position: "absolute", right: "14px", top: "14px", pointerEvents: "none" }} />
                        </div>
                    </div>

                    {/* Sub-Category (Dynamically shown if selected category has subcategories) */}
                    {availableSubCategories.length > 0 && (
                        <div>
                            <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                                Sub-category <span style={{ color: "#64748b", fontWeight: 400 }}>(Optional)</span>
                            </label>
                            <div style={{ position: "relative" }}>
                                <select
                                    value={selectedSubCatId}
                                    onChange={(e) => handleSubCatChange(e.target.value)}
                                    style={{
                                        width: "100%",
                                        height: "44px",
                                        padding: "0 36px 0 14px",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "10px",
                                        outline: "none",
                                        fontSize: "14px",
                                        appearance: "none",
                                        color: selectedSubCatId ? "#0f172a" : "#94a3b8",
                                        background: "#ffffff",
                                        boxSizing: "border-box",
                                        cursor: "pointer",
                                    }}
                                >
                                    <option value="">Select sub-category (Optional)</option>
                                    {availableSubCategories.map((sub) => (
                                        <option key={sub.id} value={sub.id} style={{ color: "#0f172a" }}>
                                            {sub.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} color="#64748b" style={{ position: "absolute", right: "14px", top: "14px", pointerEvents: "none" }} />
                            </div>
                        </div>
                    )}

                    {/* Unit */}
                    <div>
                        <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                            Unit <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div style={{ position: "relative" }}>
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                style={{
                                    width: "100%",
                                    height: "44px",
                                    padding: "0 36px 0 14px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    outline: "none",
                                    fontSize: "14px",
                                    appearance: "none",
                                    color: unit ? "#0f172a" : "#94a3b8",
                                    background: "#ffffff",
                                    boxSizing: "border-box",
                                    cursor: "pointer",
                                }}
                            >
                                <option value="" disabled>Select Unit</option>
                                {POPULAR_UNITS.map((u) => (
                                    <option key={u.value} value={u.value} style={{ color: "#0f172a" }}>
                                        {u.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} color="#64748b" style={{ position: "absolute", right: "14px", top: "14px", pointerEvents: "none" }} />
                        </div>
                    </div>

                    {/* Base Cost & Selling Rate Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                                Base Cost (₹) <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="ex. 45,00,000"
                                value={baseCost}
                                onChange={(e) => setBaseCost(e.target.value)}
                                style={{
                                    width: "100%",
                                    height: "44px",
                                    padding: "0 14px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    outline: "none",
                                    fontSize: "14px",
                                    color: "#0f172a",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                                Selling Rate
                            </label>
                            <input
                                type="text"
                                placeholder="ex. 55,00,000"
                                value={sellingRate}
                                onChange={(e) => setSellingRate(e.target.value)}
                                style={{
                                    width: "100%",
                                    height: "44px",
                                    padding: "0 14px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    outline: "none",
                                    fontSize: "14px",
                                    color: "#0f172a",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                    </div>

                    {/* Spec / Finish & Rate Status Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                                Spec / Finish
                            </label>
                            <input
                                type="text"
                                placeholder="ex. Custom, 6x6.5ft"
                                value={spec}
                                onChange={(e) => setSpec(e.target.value)}
                                style={{
                                    width: "100%",
                                    height: "44px",
                                    padding: "0 14px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    outline: "none",
                                    fontSize: "14px",
                                    color: "#0f172a",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                                Rate Status
                            </label>
                            <div style={{ position: "relative" }}>
                                <select
                                    value={rateStatus}
                                    onChange={(e) => setRateStatus(e.target.value)}
                                    style={{
                                        width: "100%",
                                        height: "44px",
                                        padding: "0 36px 0 14px",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "10px",
                                        outline: "none",
                                        fontSize: "14px",
                                        appearance: "none",
                                        color: "#0f172a",
                                        background: "#ffffff",
                                        boxSizing: "border-box",
                                        cursor: "pointer",
                                    }}
                                >
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="expired">Expired</option>
                                </select>
                                <ChevronDown size={16} color="#64748b" style={{ position: "absolute", right: "14px", top: "14px", pointerEvents: "none" }} />
                            </div>
                        </div>
                    </div>

                    {/* Vendor */}
                    <div>
                        <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                            Vendor <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        {!isCustomVendor ? (
                            <div style={{ position: "relative" }}>
                                <select
                                    value={vendor}
                                    onChange={(e) => {
                                        if (e.target.value === "__custom__") {
                                            setIsCustomVendor(true);
                                            setCustomVendorName("");
                                        } else {
                                            setVendor(e.target.value);
                                        }
                                    }}
                                    style={{
                                        width: "100%",
                                        height: "44px",
                                        padding: "0 36px 0 14px",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "10px",
                                        outline: "none",
                                        fontSize: "14px",
                                        appearance: "none",
                                        color: vendor ? "#0f172a" : "#94a3b8",
                                        background: "#ffffff",
                                        boxSizing: "border-box",
                                        cursor: "pointer",
                                    }}
                                >
                                    <option value="" disabled>ex. WoodCraft Studios</option>
                                    {allVendors.map((v) => (
                                        <option key={v} value={v} style={{ color: "#0f172a" }}>
                                            {v}
                                        </option>
                                    ))}
                                    <option value="__custom__" style={{ color: "#2563eb", fontWeight: 600 }}>
                                        + Add New / Custom Vendor...
                                    </option>
                                </select>
                                <ChevronDown size={16} color="#64748b" style={{ position: "absolute", right: "14px", top: "14px", pointerEvents: "none" }} />
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: "8px" }}>
                                <input
                                    type="text"
                                    placeholder="Enter new vendor name"
                                    value={customVendorName}
                                    onChange={(e) => setCustomVendorName(e.target.value)}
                                    autoFocus
                                    style={{
                                        flex: 1,
                                        height: "44px",
                                        padding: "0 14px",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "10px",
                                        outline: "none",
                                        fontSize: "14px",
                                        color: "#0f172a",
                                        boxSizing: "border-box",
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCustomVendor(false);
                                        setVendor(allVendors[0] || "");
                                    }}
                                    style={{
                                        padding: "0 14px",
                                        height: "44px",
                                        background: "#f1f5f9",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "10px",
                                        color: "#475569",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Choose Existing
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>
                            Description <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <textarea
                            placeholder="ex. lorem ipsum dolor sit amet, consectetur adipiscing elit..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            style={{
                                width: "100%",
                                padding: "12px 14px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "10px",
                                outline: "none",
                                fontSize: "14px",
                                color: "#0f172a",
                                minHeight: "85px",
                                resize: "vertical",
                                boxSizing: "border-box",
                                fontFamily: "inherit",
                            }}
                        />
                    </div>
                </form>

                {/* Modal Footer */}
                <div
                    style={{
                        padding: "16px 28px 22px",
                        background: "#ffffff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid #f1f5f9",
                    }}
                >
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            padding: "10px 24px",
                            borderRadius: "10px",
                            fontWeight: 600,
                            color: "#334155",
                            cursor: submitting ? "not-allowed" : "pointer",
                            fontSize: "14px",
                            transition: "background 0.15s",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{
                            background: submitting ? "#93c5fd" : "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            padding: "10px 30px",
                            borderRadius: "10px",
                            fontWeight: 600,
                            fontSize: "14px",
                            cursor: submitting ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                            transition: "all 0.15s",
                        }}
                    >
                        {submitting && <Loader2 size={16} className="animate-spin" />}
                        {submitting ? "Adding..." : "Add"}
                    </button>
                </div>
            </div>
        </div>
    );
}
