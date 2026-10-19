"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, UploadCloud, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { getCostingCategories, createCostingItem, updateCostingItem, uploadCostingImage } from "@/lib/api/costing";
import type { CostingCategoryBackend, CostingItemBackend } from "@/lib/types";

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (item: CostingItemBackend) => void;
    existingVendors?: string[];
    itemToEdit?: CostingItemBackend | null;
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

export default function AddItemModal({ isOpen, onClose, onSuccess, existingVendors = [], itemToEdit }: AddItemModalProps) {
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

    // Populate or reset form fields on open
    useEffect(() => {
        if (!isOpen) return;
        if (itemToEdit) {
            setName(itemToEdit.name || "");
            const base = itemToEdit.baseCost != null ? itemToEdit.baseCost : itemToEdit.base_cost != null ? itemToEdit.base_cost : "";
            setBaseCost(base !== "" ? String(base) : "");
            const selling = itemToEdit.sellingRate != null ? itemToEdit.sellingRate : itemToEdit.selling_rate != null ? itemToEdit.selling_rate : "";
            setSellingRate(selling !== "" ? String(selling) : "");
            setUnit(itemToEdit.unit || "");
            setSpec(itemToEdit.spec || "");
            setDescription(itemToEdit.description || itemToEdit.spec || "");
            setRateStatus(itemToEdit.rate_status || itemToEdit.rateStatus || "active");
            const v = itemToEdit.preferred_vendor || itemToEdit.preferredVendor || itemToEdit.vendor || "";
            setVendor(v);
            setImagePreview(itemToEdit.image_url || itemToEdit.imageUrl || null);
            setImageFile(null);
            setError("");
        } else {
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
        }
    }, [isOpen, itemToEdit]);

    // Load categories when modal opens
    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;
        setLoadingCategories(true);
        setError("");

        getCostingCategories({ pageSize: 100 })
            .then((res) => {
                if (isMounted) {
                    const loadedCats = res.items || [];
                    setCategories(loadedCats);
                    if (itemToEdit && itemToEdit.category_id) {
                        const targetCat = loadedCats.find((c) => c.id === itemToEdit.category_id);
                        if (targetCat) {
                            if (targetCat.parent_id) {
                                setSelectedParentCatId(targetCat.parent_id);
                                setSelectedSubCatId(targetCat.id);
                            } else {
                                setSelectedParentCatId(targetCat.id);
                                setSelectedSubCatId("");
                            }
                        }
                    }
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
    }, [isOpen, itemToEdit]);

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

            if (itemToEdit) {
                const updatedItem = await updateCostingItem(itemToEdit.id, {
                    name: name.trim(),
                    categoryId: finalCategoryId,
                    unit: unit.trim(),
                    baseCost: parsedBaseCost,
                    sellingRate: parsedSellingRate,
                    preferredVendor: finalVendor,
                    spec: spec.trim() || null,
                    description: description.trim(),
                    rateStatus,
                    imageUrl: uploadedImageUrl || imagePreview,
                });

                onSuccess(updatedItem as CostingItemBackend);
                handleClose();
                return;
            }

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
            setError(err instanceof Error ? err.message : (itemToEdit ? "Failed to update costing item." : "Failed to create costing item."));
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
            className="costing-drawer-overlay"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="costing-drawer-title"
        >
            <div
                className="costing-add-item-drawer"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drawer Header (Frame 2147225093) */}
                <div className="costing-drawer-header">
                    <h2 id="costing-drawer-title" className="costing-drawer-title">
                        {itemToEdit ? "Edit Item" : "Add Item"}
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="costing-drawer-close-btn"
                        aria-label="Close dialog"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Inner White Card (Frame 2147225027) */}
                <form
                    onSubmit={handleSubmit}
                    className="costing-drawer-inner-card"
                >
                    {error && (
                        <div
                            style={{
                                width: "100%",
                                padding: "12px 14px",
                                background: "#FEF2F2",
                                color: "#B91C1C",
                                borderRadius: "8px",
                                fontSize: "13px",
                                border: "1px solid #FECACA",
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span>{error}</span>
                        </div>
                    )}

                    {/* 1. Item Name (Frame 16 + Frame 12) */}
                    <div className="costing-form-field">
                        <div className="costing-form-label-row">
                            <label className="costing-form-label" htmlFor="costing-item-name">
                                Item Name
                            </label>
                            <span className="costing-form-required">*</span>
                        </div>
                        <input
                            id="costing-item-name"
                            type="text"
                            placeholder="Enter Item Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="costing-form-input"
                            required
                        />
                    </div>

                    {/* 2. Item Image (Drag & Drop Zone Frame 2147225027 + Icon Tile Frame 2147225048) */}
                    <div className="costing-form-field">
                        <div className="costing-form-label-row">
                            <span className="costing-form-label">Item Image</span>
                        </div>
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
                            <div className="costing-form-upload-preview">
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{ width: "52px", height: "52px", borderRadius: "8px", objectFit: "cover", border: "1px solid #E2E8F0" }}
                                    />
                                    <div style={{ overflow: "hidden" }}>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "220px", fontFamily: "'Urbanist', sans-serif" }}>
                                            {imageFile?.name || "Uploaded Image"}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#64748B", fontFamily: "'Urbanist', sans-serif" }}>
                                            {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : "Attached"}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    style={{
                                        background: "#FEE2E2",
                                        border: "none",
                                        borderRadius: "6px",
                                        padding: "8px 12px",
                                        color: "#EF4444",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        fontFamily: "'Urbanist', sans-serif",
                                    }}
                                >
                                    <Trash2 size={14} /> Remove
                                </button>
                            </div>
                        ) : (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`costing-form-upload-zone ${isDragging ? "is-dragging" : ""}`}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        fileInputRef.current?.click();
                                    }
                                }}
                            >
                                <div className="costing-form-upload-icon-tile">
                                    <UploadCloud size={24} color="#2563EB" />
                                </div>
                                <p className="costing-form-upload-text">
                                    Drag & Drop Your File Here
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 3. Category (Frame 16 + Frame 12) */}
                    <div className="costing-form-field">
                        <div className="costing-form-label-row">
                            <label className="costing-form-label" htmlFor="costing-category-select">
                                Category
                            </label>
                            <span className="costing-form-required">*</span>
                        </div>
                        <div className="costing-form-select-wrap">
                            <select
                                id="costing-category-select"
                                value={selectedParentCatId}
                                onChange={(e) => handleParentCatChange(e.target.value)}
                                className={`costing-form-select ${!selectedParentCatId ? "is-placeholder" : ""}`}
                                required
                            >
                                <option value="" disabled>Select category</option>
                                {loadingCategories ? (
                                    <option value="" disabled>Loading categories...</option>
                                ) : (
                                    parentCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            <div className="costing-form-select-arrow">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Sub-Category (conditional if parent has children) */}
                    {availableSubCategories.length > 0 && (
                        <div className="costing-form-field">
                            <div className="costing-form-label-row">
                                <label className="costing-form-label" htmlFor="costing-subcategory-select">
                                    Sub-category
                                </label>
                            </div>
                            <div className="costing-form-select-wrap">
                                <select
                                    id="costing-subcategory-select"
                                    value={selectedSubCatId}
                                    onChange={(e) => handleSubCatChange(e.target.value)}
                                    className={`costing-form-select ${!selectedSubCatId ? "is-placeholder" : ""}`}
                                >
                                    <option value="">Select sub-category (Optional)</option>
                                    {availableSubCategories.map((sub) => (
                                        <option key={sub.id} value={sub.id}>
                                            {sub.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="costing-form-select-arrow">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Unit (Frame 16 + Frame 12) */}
                    <div className="costing-form-field">
                        <div className="costing-form-label-row">
                            <label className="costing-form-label" htmlFor="costing-unit-select">
                                Unit
                            </label>
                            <span className="costing-form-required">*</span>
                        </div>
                        <div className="costing-form-select-wrap">
                            <select
                                id="costing-unit-select"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className={`costing-form-select ${!unit ? "is-placeholder" : ""}`}
                                required
                            >
                                <option value="" disabled>Select Unit</option>
                                {POPULAR_UNITS.map((u) => (
                                    <option key={u.value} value={u.value}>
                                        {u.label}
                                    </option>
                                ))}
                            </select>
                            <div className="costing-form-select-arrow">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                    </div>

                    {/* 5. Base Cost & Selling Rate (Frame 2147225099: 2 Columns, gap: 16px) */}
                    <div className="costing-form-row-2col">
                        <div className="costing-form-field">
                            <div className="costing-form-label-row">
                                <label className="costing-form-label" htmlFor="costing-base-cost">
                                    Base Cost (₹)
                                </label>
                                <span className="costing-form-required">*</span>
                            </div>
                            <input
                                id="costing-base-cost"
                                type="text"
                                placeholder="ex. 45,00,000"
                                value={baseCost}
                                onChange={(e) => setBaseCost(e.target.value)}
                                className="costing-form-input"
                                required
                            />
                        </div>
                        <div className="costing-form-field">
                            <div className="costing-form-label-row">
                                <label className="costing-form-label" htmlFor="costing-selling-rate">
                                    Selling Rate
                                </label>
                            </div>
                            <input
                                id="costing-selling-rate"
                                type="text"
                                placeholder="ex. WoodCraft Studio"
                                value={sellingRate}
                                onChange={(e) => setSellingRate(e.target.value)}
                                className="costing-form-input"
                            />
                        </div>
                    </div>

                    {/* 6. Spec / Finish & Rate Status (Frame 2147225100: 2 Columns, gap: 16px) */}
                    <div className="costing-form-row-2col">
                        <div className="costing-form-field">
                            <div className="costing-form-label-row">
                                <label className="costing-form-label" htmlFor="costing-spec-finish">
                                    Spec / Finish
                                </label>
                            </div>
                            <input
                                id="costing-spec-finish"
                                type="text"
                                placeholder="ex. Custom, 6x6.5ft"
                                value={spec}
                                onChange={(e) => setSpec(e.target.value)}
                                className="costing-form-input"
                            />
                        </div>
                        <div className="costing-form-field">
                            <div className="costing-form-label-row">
                                <label className="costing-form-label" htmlFor="costing-rate-status">
                                    Rate Status
                                </label>
                            </div>
                            <div className="costing-form-select-wrap">
                                <select
                                    id="costing-rate-status"
                                    value={rateStatus}
                                    onChange={(e) => setRateStatus(e.target.value)}
                                    className="costing-form-select"
                                >
                                    <option value="active">Approved</option>
                                    <option value="draft">Draft</option>
                                    <option value="review">Review</option>
                                    <option value="outdated">Outdated</option>
                                </select>
                                <div className="costing-form-select-arrow">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 7. Vendor (Frame 16 + Frame 12) */}
                    <div className="costing-form-field">
                        <div className="costing-form-label-row">
                            <label className="costing-form-label" htmlFor="costing-vendor-select">
                                Vendor
                            </label>
                            <span className="costing-form-required">*</span>
                        </div>
                        {!isCustomVendor ? (
                            <div className="costing-form-select-wrap">
                                <select
                                    id="costing-vendor-select"
                                    value={vendor}
                                    onChange={(e) => {
                                        if (e.target.value === "__custom__") {
                                            setIsCustomVendor(true);
                                            setCustomVendorName("");
                                        } else {
                                            setVendor(e.target.value);
                                        }
                                    }}
                                    className={`costing-form-select ${!vendor ? "is-placeholder" : ""}`}
                                    required
                                >
                                    <option value="" disabled>ex. WoodCraft Studios</option>
                                    {allVendors.map((v) => (
                                        <option key={v} value={v}>
                                            {v}
                                        </option>
                                    ))}
                                    <option value="__custom__">
                                        + Add New / Custom Vendor...
                                    </option>
                                </select>
                                <div className="costing-form-select-arrow">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                                <input
                                    type="text"
                                    placeholder="Enter new vendor name"
                                    value={customVendorName}
                                    onChange={(e) => setCustomVendorName(e.target.value)}
                                    autoFocus
                                    className="costing-form-input"
                                    style={{ flex: 1 }}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCustomVendor(false);
                                        setVendor(allVendors[0] || "");
                                    }}
                                    className="costing-drawer-cancel-btn"
                                    style={{ width: "auto", padding: "0 14px", fontSize: "13px" }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 8. Description (Frame 16 + Frame 12 Textarea) */}
                    <div className="costing-form-field">
                        <div className="costing-form-label-row">
                            <label className="costing-form-label" htmlFor="costing-description">
                                Description
                            </label>
                            <span className="costing-form-required">*</span>
                        </div>
                        <textarea
                            id="costing-description"
                            placeholder="ex. lorem ipsum dolor sit amet, consectetur adipiscing elit..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="costing-form-textarea"
                            required
                        />
                    </div>
                </form>

                {/* Bottom Action Buttons (Frame 2147225069) */}
                <div className="costing-drawer-footer">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="costing-drawer-cancel-btn"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="costing-drawer-add-btn"
                    >
                        {submitting && <Loader2 size={16} className="animate-spin" />}
                        {submitting
                            ? (itemToEdit ? "Saving..." : "Adding...")
                            : (itemToEdit ? "Save Changes" : "Add")}
                    </button>
                </div>
            </div>
        </div>
    );
}
