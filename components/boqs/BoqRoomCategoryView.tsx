"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    Plus,
    Folder,
    Edit2,
    MoreVertical,
    MoreHorizontal,
    Trash2,
    X,
    GripVertical,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { type BoqListItem, formatFullIndianCurrency } from "@/lib/domain/boq-data";
import { getApiErrorMessage } from "@/lib/api/auth";
import type { BoqItem, BoqSubcategory, BoqCategory } from "@/lib/types";

interface BoqRoom {
    id: string;
    name: string;
    description?: string | null;
    sort_order?: number | null;
    categories?: BoqCategory[];
}

interface BoqRoomCategoryViewProps {
    activeBoq: BoqListItem;
    room: BoqRoom;
    onBackToBoq: () => void;
    onBackToList: () => void;
    onRefreshBoq: () => Promise<void>;
}

// Calculate total item price based on rate, qty, waste %, tax %
function computeItemAmount(item: {
    amount?: number | null;
    quantity?: number | string;
    rate?: number | string;
    wastePercent?: number | string;
    waste_percent?: number | string;
    taxPercent?: number | string;
    tax_percent?: number | string;
}): number {
    const explicit = Number(item.amount);
    if (!isNaN(explicit) && explicit > 0) return explicit;
    const q = Number(item.quantity) || 0;
    const r = Number(item.rate) || 0;
    const w = Number(item.wastePercent ?? item.waste_percent ?? 0);
    const t = Number(item.taxPercent ?? item.tax_percent ?? 18);
    return Math.round(q * r * (1 + w / 100) * (1 + t / 100));
}

export default function BoqRoomCategoryView({
    activeBoq,
    room,
    onBackToBoq,
    onBackToList,
    onRefreshBoq,
}: BoqRoomCategoryViewProps) {
    const categories = useMemo(() => room.categories || [], [room.categories]);

    // Active Category Selection
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
        categories[0]?.id || ""
    );

    // Keep active category in sync if categories change or active category is removed
    useEffect(() => {
        if (!selectedCategoryId && categories.length > 0) {
            setSelectedCategoryId(categories[0].id);
        } else if (
            selectedCategoryId &&
            !categories.some((c) => c.id === selectedCategoryId) &&
            categories.length > 0
        ) {
            setSelectedCategoryId(categories[0].id);
        }
    }, [categories, selectedCategoryId]);

    const activeCategory = useMemo(() => {
        return categories.find((c) => c.id === selectedCategoryId) || categories[0] || null;
    }, [categories, selectedCategoryId]);

    // Subcategories under active category
    const subcategories = useMemo(() => {
        return activeCategory?.subcategories || [];
    }, [activeCategory]);

    // Items under active category
    const activeCategoryItems = useMemo(() => {
        return activeCategory?.items || [];
    }, [activeCategory]);

    // Collapsed state map for subcategories (defaults to all expanded)
    const [collapsedSubcats, setCollapsedSubcats] = useState<Record<string, boolean>>({});

    const toggleSubcatCollapse = (subcatId: string) => {
        setCollapsedSubcats((prev) => ({
            ...prev,
            [subcatId]: !prev[subcatId],
        }));
    };

    // Pagination for the active category
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const totalCategoryItems = activeCategoryItems.length;
    const totalPages = Math.max(1, Math.ceil(totalCategoryItems / pageSize));

    // Financial totals for active category
    const totalCategoryAmount = useMemo(() => {
        return activeCategoryItems.reduce((acc, it) => acc + computeItemAmount(it), 0);
    }, [activeCategoryItems]);

    const totalCategoryQty = useMemo(() => {
        return activeCategoryItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    }, [activeCategoryItems]);

    // ── Modals State ──
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryDesc, setNewCategoryDesc] = useState("");

    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
    const [editCategoryName, setEditCategoryName] = useState("");

    const [showAddSubcategoryModal, setShowAddSubcategoryModal] = useState(false);
    const [newSubcategoryName, setNewSubcategoryName] = useState("");
    const [newSubcategoryDesc, setNewSubcategoryDesc] = useState("");

    const [showEditSubcategoryModal, setShowEditSubcategoryModal] = useState(false);
    const [editingSubcategory, setEditingSubcategory] = useState<BoqSubcategory | null>(null);
    const [editSubcategoryName, setEditSubcategoryName] = useState("");

    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [targetSubcategoryForAdd, setTargetSubcategoryForAdd] = useState<BoqSubcategory | null>(null);
    const [addItemSubcatId, setAddItemSubcatId] = useState<string>("");

    const [showEditItemModal, setShowEditItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState<BoqItem | null>(null);
    const [editItemSubcatId, setEditItemSubcatId] = useState<string>("");

    // Confirmation deletion state
    const [deleteTarget, setDeleteTarget] = useState<{
        type: "category" | "subcategory" | "item";
        id: string;
        name: string;
        count?: number;
    } | null>(null);

    // Item form fields
    const [itemName, setItemName] = useState("");
    const [itemSpec, setItemSpec] = useState("");
    const [itemUnit, setItemUnit] = useState("Sq.ft");
    const [itemQty, setItemQty] = useState("1");
    const [itemRate, setItemRate] = useState("1000");
    const [itemWaste, setItemWaste] = useState("5");
    const [itemTax, setItemTax] = useState("18");

    // Action menu dropdown anchors
    const [openCategoryMenu, setOpenCategoryMenu] = useState(false);
    const [activeItemMenuId, setActiveItemMenuId] = useState<string | null>(null);
    const categoryMenuRef = useRef<HTMLDivElement>(null);

    // Loading & feedback state
    const [loadingAction, setLoadingAction] = useState(false);
    const [feedbackError, setFeedbackError] = useState("");
    const [feedbackSuccess, setFeedbackSuccess] = useState("");

    // Outside click listener for menus
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
                setOpenCategoryMenu(false);
            }
            if (!(e.target as HTMLElement).closest(".boq-item-action-trigger")) {
                setActiveItemMenuId(null);
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpenCategoryMenu(false);
                setActiveItemMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    // ──────────────── Category Handlers ────────────────

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newCategoryName.trim();
        if (!trimmed) {
            setFeedbackError("Category name cannot be empty.");
            return;
        }

        if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
            setFeedbackError(`Category "${trimmed}" already exists in ${room.name}.`);
            return;
        }

        setLoadingAction(true);
        setFeedbackError("");
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms/${room.id}/categories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: trimmed,
                    description: newCategoryDesc.trim() || undefined,
                }),
                credentials: "include",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(getApiErrorMessage(data) || "Failed to create category.");
            }

            setNewCategoryName("");
            setNewCategoryDesc("");
            setShowAddCategoryModal(false);
            setFeedbackSuccess(`Category "${trimmed}" created successfully.`);
            setTimeout(() => setFeedbackSuccess(""), 4000);

            await onRefreshBoq();
            if (data.data?.id) {
                setSelectedCategoryId(data.data.id);
            }
        } catch (err) {
            setFeedbackError(err instanceof Error ? err.message : "Failed to create category.");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCategory) return;
        const trimmed = editCategoryName.trim();
        if (!trimmed) {
            setFeedbackError("Category name cannot be empty.");
            return;
        }

        setLoadingAction(true);
        setFeedbackError("");
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/categories/${activeCategory.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmed }),
                credentials: "include",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(getApiErrorMessage(data) || "Failed to update category.");
            }

            setShowEditCategoryModal(false);
            setFeedbackSuccess("Category updated successfully.");
            setTimeout(() => setFeedbackSuccess(""), 4000);
            await onRefreshBoq();
        } catch (err) {
            setFeedbackError(err instanceof Error ? err.message : "Failed to update category.");
        } finally {
            setLoadingAction(false);
        }
    };

    const confirmDeleteCategory = () => {
        if (!activeCategory) return;
        setDeleteTarget({
            type: "category",
            id: activeCategory.id,
            name: activeCategory.name,
            count: activeCategoryItems.length,
        });
        setOpenCategoryMenu(false);
    };

    const handleDeleteCategoryExecution = async () => {
        if (!deleteTarget || deleteTarget.type !== "category") return;
        setLoadingAction(true);
        setFeedbackError("");
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/categories/${deleteTarget.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(data) || "Failed to delete category.");
            }

            setDeleteTarget(null);
            setFeedbackSuccess("Category deleted successfully.");
            setTimeout(() => setFeedbackSuccess(""), 4000);
            await onRefreshBoq();
        } catch (err) {
            setFeedbackError(err instanceof Error ? err.message : "Failed to delete category.");
        } finally {
            setLoadingAction(false);
        }
    };

    // ──────────────── Subcategory Handlers ────────────────

    const handleCreateSubcategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCategory) return;
        const trimmed = newSubcategoryName.trim();
        if (!trimmed) {
            setFeedbackError("Subcategory name cannot be empty.");
            return;
        }

        if (subcategories.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
            setFeedbackError(`Subcategory "${trimmed}" already exists in ${activeCategory.name}.`);
            return;
        }

        setLoadingAction(true);
        setFeedbackError("");
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/categories/${activeCategory.id}/subcategories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: trimmed,
                    description: newSubcategoryDesc.trim() || undefined,
                }),
                credentials: "include",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(getApiErrorMessage(data) || "Failed to create subcategory.");
            }

            setNewSubcategoryName("");
            setNewSubcategoryDesc("");
            setShowAddSubcategoryModal(false);
            setFeedbackSuccess(`Subcategory "${trimmed}" added to ${activeCategory.name}.`);
            setTimeout(() => setFeedbackSuccess(""), 4000);

            await onRefreshBoq();
        } catch (err) {
            setFeedbackError(err instanceof Error ? err.message : "Failed to create subcategory.");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleUpdateSubcategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCategory || !editingSubcategory) return;
        const trimmed = editSubcategoryName.trim();
        if (!trimmed) {
            setFeedbackError("Subcategory name cannot be empty.");
            return;
        }

        setLoadingAction(true);
        setFeedbackError("");
        try {
            const res = await fetch(
                `/api/v1/boqs/${activeBoq.id}/categories/${activeCategory.id}/subcategories/${editingSubcategory.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: trimmed }),
                    credentials: "include",
                }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(getApiErrorMessage(data) || "Failed to update subcategory.");
            }

            setShowEditSubcategoryModal(false);
            setEditingSubcategory(null);
            setFeedbackSuccess("Subcategory updated successfully.");
            setTimeout(() => setFeedbackSuccess(""), 4000);
            await onRefreshBoq();
        } catch (err) {
            setFeedbackError(err instanceof Error ? err.message : "Failed to update subcategory.");
        } finally {
            setLoadingAction(false);
        }
    };

    const confirmDeleteSubcategory = (subcat: BoqSubcategory) => {
        const count = subcat.items?.length || 0;
        setDeleteTarget({
            type: "subcategory",
            id: subcat.id,
            name: subcat.name,
            count,
        });
    };

    const handleDeleteSubcategoryExecution = async () => {
        if (!deleteTarget || deleteTarget.type !== "subcategory" || !activeCategory) return;
        setLoadingAction(true);
        setFeedbackError("");
        try {
            const res = await fetch(
                `/api/v1/boqs/${activeBoq.id}/categories/${activeCategory.id}/subcategories/${deleteTarget.id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(data) || "Failed to delete subcategory.");
            }

            setDeleteTarget(null);
            setFeedbackSuccess("Subcategory removed.");
            setTimeout(() => setFeedbackSuccess(""), 4000);
            await onRefreshBoq();
        } catch (err) {
            setFeedbackError(err instanceof Error ? err.message : "Failed to delete subcategory.");
        } finally {
            setLoadingAction(false);
        }
    };

    // ──────────────── Item Handlers ────────────────

    const openAddItemModal = (subcat?: BoqSubcategory | null) => {
        setTargetSubcategoryForAdd(subcat || null);
        setAddItemSubcatId(subcat?.id || "");
        setItemName("");
        setItemSpec("");
        setItemUnit("Sq.ft");
        setItemQty("1");
        setItemRate("1000");
        setItemWaste("5");
        setItemTax("18");
        setFeedbackError("");
        setShowAddItemModal(true);
    };

    const openEditItemModal = (item: BoqItem) => {
        setEditingItem(item);
        setEditItemSubcatId(item.subcategoryId || "");
        setItemName(item.name || "");
        setItemSpec(item.description || "");
        setItemUnit(item.unit || "Nos");
        setItemQty(String(item.quantity || 1));
        setItemRate(String(item.rate || 0));
        setItemWaste(String(item.waste_percent ?? (item as any).wastePercent ?? 0));
        setItemTax(String(item.tax_percent ?? (item as any).taxPercent ?? 18));
        setFeedbackError("");
        setShowEditItemModal(true);
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCategory) return;
        if (!itemName.trim()) {
            setFeedbackError("Item name is required.");
            return;
        }

        const qtyNum = Number(itemQty);
        const rateNum = Number(itemRate);
        const wasteNum = Number(itemWaste) || 0;
        const taxNum = Number(itemTax) || 0;

        if (isNaN(qtyNum) || qtyNum <= 0) {
            setFeedbackError("Quantity must be a positive number.");
            return;
        }
        if (isNaN(rateNum) || rateNum < 0) {
            setFeedbackError("Rate must be a non-negative number.");
            return;
        }

        setLoadingAction(true);
        setFeedbackError("");
        try {
            const selectedSub = subcategories.find((s) => s.id === addItemSubcatId) || targetSubcategoryForAdd;
            const payload = {
                name: itemName.trim(),
                description: itemSpec.trim() || undefined,
                unit: itemUnit,
                quantity: qtyNum,
                rate: rateNum,
                wastePercent: wasteNum,
                taxPercent: taxNum,
                subcategoryId: selectedSub?.id || undefined,
                subcategoryName: selectedSub?.name || undefined,
            };

            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/categories/${activeCategory.id}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(getApiErrorMessage(data) || "Failed to add item.");
            }

            setShowAddItemModal(false);
            setFeedbackSuccess("Item added successfully.");
            setTimeout(() => setFeedbackSuccess(""), 4000);
            await onRefreshBoq();
        } catch (err) {
            setFeedbackError(err instanceof Error ? err.message : "Failed to add item.");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        if (!itemName.trim()) {
            setFeedbackError("Item name is required.");
            return;
        }

        const qtyNum = Number(itemQty);
        const rateNum = Number(itemRate);
        const wasteNum = Number(itemWaste) || 0;
        const taxNum = Number(itemTax) || 0;

        setLoadingAction(true);
        setFeedbackError("");
        try {
            const selectedSub = subcategories.find((s) => s.id === editItemSubcatId);
            const payload = {
                name: itemName.trim(),
                description: itemSpec.trim() || undefined,
                unit: itemUnit,
                quantity: qtyNum,
                rate: rateNum,
                wastePercent: wasteNum,
                taxPercent: taxNum,
                subcategoryId: editItemSubcatId || undefined,
                subcategoryName: selectedSub?.name || undefined,
            };

            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/items/${editingItem.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(getApiErrorMessage(data) || "Failed to update item.");
            }

            setShowEditItemModal(false);
            setEditingItem(null);
            setFeedbackSuccess("Item updated successfully.");
            setTimeout(() => setFeedbackSuccess(""), 4000);
            await onRefreshBoq();
        } catch (err) {
            setFeedbackError(err instanceof Error ? err.message : "Failed to update item.");
        } finally {
            setLoadingAction(false);
        }
    };

    const confirmDeleteItem = (item: BoqItem) => {
        setDeleteTarget({
            type: "item",
            id: item.id,
            name: item.name,
        });
        setActiveItemMenuId(null);
    };

    const handleDeleteItemExecution = async () => {
        if (!deleteTarget || deleteTarget.type !== "item") return;
        setLoadingAction(true);
        setFeedbackError("");
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/items/${deleteTarget.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(data) || "Failed to delete item.");
            }

            setDeleteTarget(null);
            setFeedbackSuccess("Item removed.");
            setTimeout(() => setFeedbackSuccess(""), 4000);
            await onRefreshBoq();
        } catch (err) {
            setFeedbackError(err instanceof Error ? err.message : "Failed to delete item.");
        } finally {
            setLoadingAction(false);
        }
    };

    // Live amount calculation for item dialogs
    const liveItemAmount = useMemo(() => {
        const q = Number(itemQty) || 0;
        const r = Number(itemRate) || 0;
        const w = Number(itemWaste) || 0;
        const t = Number(itemTax) || 0;
        return Math.round(q * r * (1 + w / 100) * (1 + t / 100));
    }, [itemQty, itemRate, itemWaste, itemTax]);

    return (
        <section className="boq-room-detail-shell">
            {/* Ambient blue gradient matching Figma Rectangle 14 */}
            <div className="boq-room-gradient-ambient" aria-hidden="true" />

            {/* Breadcrumb Navigation (Frame 240) */}
            <nav className="boq-room-breadcrumb-redesign" aria-label="Breadcrumb">
                <button
                    type="button"
                    className="boq-room-breadcrumb-link"
                    onClick={onBackToList}
                >
                    Bill of Quantities
                </button>
                <ChevronRight size={18} className="boq-room-breadcrumb-sep" />
                <button
                    type="button"
                    className="boq-room-breadcrumb-link"
                    onClick={onBackToBoq}
                >
                    {activeBoq.boqNumber}
                </button>
                <ChevronRight size={18} className="boq-room-breadcrumb-sep" />
                <span className="boq-room-breadcrumb-active">{room.name}</span>
            </nav>

            {/* Notifications */}
            {feedbackError && (
                <div
                    style={{
                        padding: "10px 14px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        color: "#991b1b",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        zIndex: 1,
                    }}
                >
                    <AlertCircle size={16} />
                    <span>{feedbackError}</span>
                </div>
            )}
            {feedbackSuccess && (
                <div
                    style={{
                        padding: "10px 14px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "6px",
                        color: "#166534",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        zIndex: 1,
                    }}
                >
                    <CheckCircle2 size={16} />
                    <span>{feedbackSuccess}</span>
                </div>
            )}

            {/* Two-Column Layout (Frame 2147225085) */}
            <div className="boq-room-two-column-layout">
                {/* ── Left Category Panel (Frame 2147225071) ── */}
                <aside className="boq-room-category-panel">
                    <h3 className="boq-room-category-panel-title">{room.name}</h3>

                    {/* Prominent Add More Category Button (46px, full width) */}
                    <button
                        type="button"
                        className="boq-btn-add-more-category"
                        onClick={() => {
                            setNewCategoryName("");
                            setNewCategoryDesc("");
                            setFeedbackError("");
                            setShowAddCategoryModal(true);
                        }}
                    >
                        <span>Add More Category</span>
                        <Plus size={18} />
                    </button>

                    {/* Divider */}
                    <div className="boq-room-panel-divider" />

                    {/* Category List (Frame 2147225387) */}
                    <div className="boq-room-category-list">
                        {categories.length === 0 ? (
                            <div style={{ color: "#64748B", fontSize: "14px", padding: "12px 0" }}>
                                <p style={{ margin: "0 0 6px", fontWeight: 600 }}>No categories yet</p>
                                <span style={{ fontSize: "13px" }}>
                                    Click "Add More Category" to create one.
                                </span>
                            </div>
                        ) : (
                            categories.map((cat) => {
                                const isActive = cat.id === activeCategory?.id;
                                const itemCount = cat.items?.length || 0;
                                return (
                                    <div
                                        key={cat.id}
                                        role="button"
                                        tabIndex={0}
                                        className={`boq-room-category-item-row ${isActive ? "active" : ""}`}
                                        onClick={() => {
                                            setSelectedCategoryId(cat.id);
                                            setPage(1);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                setSelectedCategoryId(cat.id);
                                                setPage(1);
                                            }
                                        }}
                                    >
                                        <div className="boq-room-category-item-left">
                                            <Folder className="boq-room-category-item-icon" />
                                            <span className="boq-room-category-item-name">{cat.name}</span>
                                        </div>
                                        <span className="boq-room-category-item-badge">
                                            Item {itemCount}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* ── Right Main Content Panel (Frame 2147225072) ── */}
                <main className="boq-room-main-panel">
                    {activeCategory ? (
                        <>
                            {/* Category Header Row (Frame 2147225198) */}
                            <div className="boq-room-category-header-row">
                                <div className="boq-room-category-title-block">
                                    <h2 className="boq-room-category-heading-title">
                                        {activeCategory.name}
                                    </h2>
                                    <p className="boq-room-category-heading-sub">
                                        {room.name} • BOQ Section
                                    </p>
                                </div>

                                {/* Category Actions: Edit, Add Subcategory, More */}
                                <div className="boq-room-category-actions-group">
                                    {/* Edit Category Button */}
                                    <button
                                        type="button"
                                        className="boq-room-square-btn"
                                        aria-label="Edit Category"
                                        title="Edit Category Name"
                                        onClick={() => {
                                            setEditCategoryName(activeCategory.name);
                                            setShowEditCategoryModal(true);
                                        }}
                                    >
                                        <Edit2 size={18} color="#1C1B1F" />
                                    </button>

                                    {/* Prominent Add Subcategory Primary Button */}
                                    <button
                                        type="button"
                                        className="boq-btn-add-subcategory-primary"
                                        onClick={() => {
                                            setNewSubcategoryName("");
                                            setNewSubcategoryDesc("");
                                            setFeedbackError("");
                                            setShowAddSubcategoryModal(true);
                                        }}
                                    >
                                        <Plus size={18} />
                                        <span>Add Subcategory</span>
                                    </button>

                                    {/* More Options Dropdown */}
                                    <div style={{ position: "relative" }} ref={categoryMenuRef}>
                                        <button
                                            type="button"
                                            className="boq-room-square-btn"
                                            aria-label="More category options"
                                            onClick={() => setOpenCategoryMenu(!openCategoryMenu)}
                                        >
                                            <MoreVertical size={18} color="#1C1B1F" />
                                        </button>

                                        {openCategoryMenu && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    right: 0,
                                                    top: "100%",
                                                    marginTop: "6px",
                                                    width: "160px",
                                                    background: "#FFFFFF",
                                                    border: "1px solid #E2E8F0",
                                                    borderRadius: "8px",
                                                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                                                    padding: "6px",
                                                    zIndex: 100,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "2px",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        width: "100%",
                                                        padding: "8px 10px",
                                                        background: "none",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        fontSize: "13px",
                                                        fontFamily: "Urbanist, sans-serif",
                                                        color: "#0F172A",
                                                        cursor: "pointer",
                                                        textAlign: "left",
                                                    }}
                                                    onClick={() => {
                                                        setOpenCategoryMenu(false);
                                                        setEditCategoryName(activeCategory.name);
                                                        setShowEditCategoryModal(true);
                                                    }}
                                                >
                                                    <Edit2 size={14} color="#64748B" />
                                                    <span>Rename Category</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        width: "100%",
                                                        padding: "8px 10px",
                                                        background: "none",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        fontSize: "13px",
                                                        fontFamily: "Urbanist, sans-serif",
                                                        color: "#DC2626",
                                                        cursor: "pointer",
                                                        textAlign: "left",
                                                    }}
                                                    onClick={confirmDeleteCategory}
                                                >
                                                    <Trash2 size={14} color="#DC2626" />
                                                    <span>Delete Category</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Summary Stats Line */}
                            <p className="boq-room-category-stats-banner">
                                {totalCategoryItems} Items • {formatFullIndianCurrency(totalCategoryAmount)} illustrative Template Value
                            </p>

                            {/* Divider */}
                            <div className="boq-room-panel-divider" />

                            {/* ── MANDATORY HIERARCHY: Category → Subcategory → Items ── */}
                            <div className="boq-subcategories-stack">
                                {subcategories.length === 0 && (!activeCategory.unassignedItems || activeCategory.unassignedItems.length === 0) ? (
                                    <div className="boq-empty-subcategories-box">
                                        <p>No subcategories created in {activeCategory.name} yet</p>
                                        <span>
                                            Organize your items into subcategories (e.g., Wardrobes, Beds, Side Tables)
                                        </span>
                                        <button
                                            type="button"
                                            className="boq-btn-add-subcategory-primary"
                                            style={{ marginTop: "8px" }}
                                            onClick={() => {
                                                setNewSubcategoryName("");
                                                setNewSubcategoryDesc("");
                                                setShowAddSubcategoryModal(true);
                                            }}
                                        >
                                            <Plus size={16} />
                                            <span>Add First Subcategory</span>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Render Subcategories */}
                                        {subcategories.map((subcat) => {
                                            const subcatItems = subcat.items || [];
                                            const isCollapsed = !!collapsedSubcats[subcat.id];
                                            const subcatAmount = subcatItems.reduce(
                                                (acc, it) => acc + computeItemAmount(it),
                                                0
                                            );

                                            return (
                                                <div key={subcat.id} className="boq-subcategory-card">
                                                    {/* Subcategory Header */}
                                                    <div className="boq-subcategory-header-bar">
                                                        <div
                                                            className="boq-subcategory-header-left"
                                                            onClick={() => toggleSubcatCollapse(subcat.id)}
                                                        >
                                                            {isCollapsed ? (
                                                                <ChevronRight size={18} className="boq-subcategory-toggle-icon" />
                                                            ) : (
                                                                <ChevronDown size={18} className="boq-subcategory-toggle-icon" />
                                                            )}
                                                            <h4 className="boq-subcategory-title-text">{subcat.name}</h4>
                                                            <span className="boq-subcategory-count-pill">
                                                                {subcatItems.length} {subcatItems.length === 1 ? "Item" : "Items"}
                                                            </span>
                                                            <span className="boq-subcategory-subtotal-val">
                                                                {formatFullIndianCurrency(subcatAmount)}
                                                            </span>
                                                        </div>

                                                        {/* Subcategory Header Actions: Add Item, Edit, Delete */}
                                                        <div className="boq-subcategory-header-right">
                                                            {/* Contextual "+ Add Item" Button */}
                                                            <button
                                                                type="button"
                                                                className="boq-btn-add-item-subcategory"
                                                                title={`Add item to ${subcat.name}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openAddItemModal(subcat);
                                                                }}
                                                            >
                                                                <Plus size={15} />
                                                                <span>Add Item</span>
                                                            </button>

                                                            {/* Edit Subcategory */}
                                                            <button
                                                                type="button"
                                                                className="boq-btn-subcat-icon"
                                                                title="Rename Subcategory"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingSubcategory(subcat);
                                                                    setEditSubcategoryName(subcat.name);
                                                                    setShowEditSubcategoryModal(true);
                                                                }}
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>

                                                            {/* Delete Subcategory */}
                                                            <button
                                                                type="button"
                                                                className="boq-btn-subcat-icon delete"
                                                                title="Delete Subcategory"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    confirmDeleteSubcategory(subcat);
                                                                }}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Subcategory Items Table */}
                                                    {!isCollapsed && (
                                                        <div className="boq-items-table-wrapper">
                                                            {subcatItems.length === 0 ? (
                                                                <div className="boq-empty-items-row">
                                                                    <p style={{ margin: "0 0 6px", fontWeight: 500, fontSize: "14px" }}>
                                                                        No items in {subcat.name} yet.
                                                                    </p>
                                                                    <button
                                                                        type="button"
                                                                        className="boq-btn-add-item-subcategory"
                                                                        onClick={() => openAddItemModal(subcat)}
                                                                    >
                                                                        <Plus size={14} />
                                                                        <span>Add Item</span>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <table className="boq-items-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th className="col-num">#</th>
                                                                            <th className="col-item">ITEM</th>
                                                                            <th className="col-unit">UNIT</th>
                                                                            <th className="col-qty">QTY</th>
                                                                            <th className="col-rate">RATE (₹)</th>
                                                                            <th className="col-waste">WASTE (%)</th>
                                                                            <th className="col-tax">TAX (%)</th>
                                                                            <th className="col-amount">AMOUNT (₹)</th>
                                                                            <th className="col-actions"></th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {subcatItems.map((item, idx) => {
                                                                            const itemAmt = computeItemAmount(item);
                                                                            const isMenuOpen = activeItemMenuId === item.id;
                                                                            return (
                                                                                <tr key={item.id}>
                                                                                    <td className="col-num">
                                                                                        <div className="boq-item-num-wrap">
                                                                                            <GripVertical size={14} className="boq-item-drag-handle" />
                                                                                            <span>{idx + 1}</span>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="col-item">
                                                                                        <div className="boq-item-identity-cell">
                                                                                            <span className="boq-item-title-text">{item.name}</span>
                                                                                            {item.description && (
                                                                                                <span className="boq-item-spec-text">
                                                                                                    {item.description}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="col-unit">{item.unit || "Nos"}</td>
                                                                                    <td className="col-qty">{item.quantity}</td>
                                                                                    <td className="col-rate">
                                                                                        {new Intl.NumberFormat("en-IN", {
                                                                                            minimumFractionDigits: 2,
                                                                                            maximumFractionDigits: 2,
                                                                                        }).format(Number(item.rate) || 0)}
                                                                                    </td>
                                                                                    <td className="col-waste">{item.waste_percent ?? (item as any).wastePercent ?? 0}%</td>
                                                                                    <td className="col-tax">{item.tax_percent ?? (item as any).taxPercent ?? 18}%</td>
                                                                                    <td className="col-amount">
                                                                                        {new Intl.NumberFormat("en-IN").format(itemAmt)}
                                                                                    </td>
                                                                                    <td className="col-actions">
                                                                                        <button
                                                                                            type="button"
                                                                                            className="boq-item-action-trigger"
                                                                                            aria-label="Item actions"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setActiveItemMenuId(isMenuOpen ? null : item.id);
                                                                                            }}
                                                                                        >
                                                                                            <MoreHorizontal size={18} />
                                                                                        </button>

                                                                                        {isMenuOpen && (
                                                                                            <div
                                                                                                style={{
                                                                                                    position: "absolute",
                                                                                                    right: "12px",
                                                                                                    top: "calc(100% - 6px)",
                                                                                                    width: "140px",
                                                                                                    background: "#FFFFFF",
                                                                                                    border: "1px solid #E2E8F0",
                                                                                                    borderRadius: "8px",
                                                                                                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                                                                                                    padding: "6px",
                                                                                                    zIndex: 100,
                                                                                                    display: "flex",
                                                                                                    flexDirection: "column",
                                                                                                    gap: "2px",
                                                                                                    textAlign: "left",
                                                                                                }}
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            >
                                                                                                <button
                                                                                                    type="button"
                                                                                                    style={{
                                                                                                        display: "flex",
                                                                                                        alignItems: "center",
                                                                                                        gap: "8px",
                                                                                                        width: "100%",
                                                                                                        padding: "7px 10px",
                                                                                                        background: "none",
                                                                                                        border: "none",
                                                                                                        borderRadius: "4px",
                                                                                                        fontSize: "13px",
                                                                                                        fontFamily: "Urbanist, sans-serif",
                                                                                                        color: "#0F172A",
                                                                                                        cursor: "pointer",
                                                                                                        textAlign: "left",
                                                                                                    }}
                                                                                                    onClick={() => {
                                                                                                        setActiveItemMenuId(null);
                                                                                                        openEditItemModal(item);
                                                                                                    }}
                                                                                                >
                                                                                                    <Edit2 size={14} color="#64748B" />
                                                                                                    <span>Edit Item</span>
                                                                                                </button>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    style={{
                                                                                                        display: "flex",
                                                                                                        alignItems: "center",
                                                                                                        gap: "8px",
                                                                                                        width: "100%",
                                                                                                        padding: "7px 10px",
                                                                                                        background: "none",
                                                                                                        border: "none",
                                                                                                        borderRadius: "4px",
                                                                                                        fontSize: "13px",
                                                                                                        fontFamily: "Urbanist, sans-serif",
                                                                                                        color: "#DC2626",
                                                                                                        cursor: "pointer",
                                                                                                        textAlign: "left",
                                                                                                    }}
                                                                                                    onClick={() => confirmDeleteItem(item)}
                                                                                                >
                                                                                                    <Trash2 size={14} color="#DC2626" />
                                                                                                    <span>Delete Item</span>
                                                                                                </button>
                                                                                            </div>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Backward compatibility: Direct category items without a subcategory */}
                                        {activeCategory.unassignedItems && activeCategory.unassignedItems.length > 0 && (
                                            <div className="boq-subcategory-card" style={{ borderColor: "#CBD5E1" }}>
                                                <div className="boq-subcategory-header-bar" style={{ background: "#F1F5F9" }}>
                                                    <div className="boq-subcategory-header-left">
                                                        <h4 className="boq-subcategory-title-text" style={{ color: "#475569" }}>
                                                            General / Direct Items
                                                        </h4>
                                                        <span className="boq-subcategory-count-pill" style={{ background: "#E2E8F0", color: "#475569" }}>
                                                            {activeCategory.unassignedItems.length} Items
                                                        </span>
                                                    </div>
                                                    <div className="boq-subcategory-header-right">
                                                        <button
                                                            type="button"
                                                            className="boq-btn-add-item-subcategory"
                                                            onClick={() => openAddItemModal(null)}
                                                        >
                                                            <Plus size={15} />
                                                            <span>Add Item</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="boq-items-table-wrapper">
                                                    <table className="boq-items-table">
                                                        <thead>
                                                            <tr>
                                                                <th className="col-num">#</th>
                                                                <th className="col-item">ITEM</th>
                                                                <th className="col-unit">UNIT</th>
                                                                <th className="col-qty">QTY</th>
                                                                <th className="col-rate">RATE (₹)</th>
                                                                <th className="col-waste">WASTE (%)</th>
                                                                <th className="col-tax">TAX (%)</th>
                                                                <th className="col-amount">AMOUNT (₹)</th>
                                                                <th className="col-actions"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {activeCategory.unassignedItems.map((item, idx) => {
                                                                const itemAmt = computeItemAmount(item);
                                                                const isMenuOpen = activeItemMenuId === item.id;
                                                                return (
                                                                    <tr key={item.id}>
                                                                        <td className="col-num">{idx + 1}</td>
                                                                        <td className="col-item">
                                                                            <div className="boq-item-identity-cell">
                                                                                <span className="boq-item-title-text">{item.name}</span>
                                                                                {item.description && (
                                                                                    <span className="boq-item-spec-text">{item.description}</span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="col-unit">{item.unit || "Nos"}</td>
                                                                        <td className="col-qty">{item.quantity}</td>
                                                                        <td className="col-rate">
                                                                            {new Intl.NumberFormat("en-IN", {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2,
                                                                            }).format(Number(item.rate) || 0)}
                                                                        </td>
                                                                        <td className="col-waste">{item.waste_percent ?? (item as any).wastePercent ?? 0}%</td>
                                                                        <td className="col-tax">{item.tax_percent ?? (item as any).taxPercent ?? 18}%</td>
                                                                        <td className="col-amount">
                                                                            {new Intl.NumberFormat("en-IN").format(itemAmt)}
                                                                        </td>
                                                                        <td className="col-actions">
                                                                            <button
                                                                                type="button"
                                                                                className="boq-item-action-trigger"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setActiveItemMenuId(isMenuOpen ? null : item.id);
                                                                                }}
                                                                            >
                                                                                <MoreHorizontal size={18} />
                                                                            </button>
                                                                            {isMenuOpen && (
                                                                                <div
                                                                                    style={{
                                                                                        position: "absolute",
                                                                                        right: "12px",
                                                                                        top: "calc(100% - 6px)",
                                                                                        width: "140px",
                                                                                        background: "#FFFFFF",
                                                                                        border: "1px solid #E2E8F0",
                                                                                        borderRadius: "8px",
                                                                                        padding: "6px",
                                                                                        zIndex: 100,
                                                                                    }}
                                                                                >
                                                                                    <button
                                                                                        type="button"
                                                                                        style={{ width: "100%", padding: "6px", border: "none", background: "none", textAlign: "left", cursor: "pointer" }}
                                                                                        onClick={() => {
                                                                                            setActiveItemMenuId(null);
                                                                                            openEditItemModal(item);
                                                                                        }}
                                                                                    >
                                                                                        Edit Item
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        style={{ width: "100%", padding: "6px", border: "none", background: "none", color: "#DC2626", textAlign: "left", cursor: "pointer" }}
                                                                                        onClick={() => confirmDeleteItem(item)}
                                                                                    >
                                                                                        Delete Item
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Category Subtotal / Summary Row (Figma Frame 63) */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "36px",
                                    background: "#E4ECFB",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "0 16px",
                                    boxSizing: "border-box",
                                    fontFamily: "Urbanist, sans-serif",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    color: "#0F172A",
                                    marginTop: "8px",
                                }}
                            >
                                <span style={{ textTransform: "uppercase" }}>
                                    TOTAL ({totalCategoryItems} {totalCategoryItems === 1 ? "ITEM" : "ITEMS"})
                                </span>
                                <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                                    <span>QTY: {totalCategoryQty}</span>
                                    <span>{formatFullIndianCurrency(totalCategoryAmount)}</span>
                                </div>
                            </div>

                            {/* Pagination Footer (Figma Frame 2147225166) */}
                            <div className="boq-room-pagination-bar">
                                <span className="boq-room-total-items-tag">
                                    Total Items: {totalCategoryItems}
                                </span>

                                <div className="boq-room-pagination-controls">
                                    <button
                                        type="button"
                                        className="boq-room-page-btn"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        aria-label="Previous Page"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            className={`boq-room-page-btn ${p === page ? "active" : ""}`}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        className="boq-room-page-btn"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        aria-label="Next Page"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>

                                <div className="boq-room-page-size-wrap">
                                    <span>Show per Page:</span>
                                    <select
                                        className="boq-room-page-size-select"
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: "center", padding: "60px 20px", width: "100%", color: "#64748B" }}>
                            <p style={{ fontSize: "16px", fontWeight: 600, color: "#0F172A" }}>
                                No category selected
                            </p>
                            <p style={{ fontSize: "14px", margin: "4px 0 16px" }}>
                                Select a category from the left panel or click "Add More Category".
                            </p>
                            <button
                                type="button"
                                className="boq-btn-add-more-category"
                                style={{ maxWidth: "240px", margin: "0 auto" }}
                                onClick={() => setShowAddCategoryModal(true)}
                            >
                                <Plus size={18} />
                                <span>Add Category</span>
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* ── MODALS ── */}

            {/* 1. Add Category Modal */}
            {showAddCategoryModal && (
                <div className="boq-modal-backdrop" onClick={() => setShowAddCategoryModal(false)}>
                    <div className="boq-create-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
                        <div className="boq-create-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                                    Add More Category
                                </h3>
                                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>
                                    Create a new category for <strong>{room.name}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                className="boq-close-button"
                                onClick={() => setShowAddCategoryModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCategory} style={{ marginTop: "16px" }}>
                            <div className="boq-form-field" style={{ marginBottom: "14px" }}>
                                <label className="boq-form-label">Category Name *</label>
                                <input
                                    type="text"
                                    className="boq-form-input"
                                    placeholder="e.g. Furniture, Electrical, Painting"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="boq-form-field" style={{ marginBottom: "20px" }}>
                                <label className="boq-form-label">Notes / Description (Optional)</label>
                                <textarea
                                    className="boq-form-input"
                                    rows={2}
                                    placeholder="Optional category description or notes"
                                    value={newCategoryDesc}
                                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    className="boq-btn-modal-cancel"
                                    onClick={() => setShowAddCategoryModal(false)}
                                    disabled={loadingAction}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="boq-btn-modal-submit"
                                    disabled={loadingAction || !newCategoryName.trim()}
                                >
                                    {loadingAction ? "Creating..." : "Create Category"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Edit Category Modal */}
            {showEditCategoryModal && (
                <div className="boq-modal-backdrop" onClick={() => setShowEditCategoryModal(false)}>
                    <div className="boq-create-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
                        <div className="boq-create-header">
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                                Rename Category
                            </h3>
                            <button
                                type="button"
                                className="boq-close-button"
                                onClick={() => setShowEditCategoryModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateCategory} style={{ marginTop: "16px" }}>
                            <div className="boq-form-field" style={{ marginBottom: "20px" }}>
                                <label className="boq-form-label">Category Name *</label>
                                <input
                                    type="text"
                                    className="boq-form-input"
                                    value={editCategoryName}
                                    onChange={(e) => setEditCategoryName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    className="boq-btn-modal-cancel"
                                    onClick={() => setShowEditCategoryModal(false)}
                                    disabled={loadingAction}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="boq-btn-modal-submit"
                                    disabled={loadingAction || !editCategoryName.trim()}
                                >
                                    {loadingAction ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Add Subcategory Modal */}
            {showAddSubcategoryModal && activeCategory && (
                <div className="boq-modal-backdrop" onClick={() => setShowAddSubcategoryModal(false)}>
                    <div className="boq-create-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
                        <div className="boq-create-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                                    Add Subcategory
                                </h3>
                                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>
                                    Parent: <strong>{room.name} → {activeCategory.name}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                className="boq-close-button"
                                onClick={() => setShowAddSubcategoryModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubcategory} style={{ marginTop: "16px" }}>
                            <div className="boq-form-field" style={{ marginBottom: "14px" }}>
                                <label className="boq-form-label">Subcategory Name *</label>
                                <input
                                    type="text"
                                    className="boq-form-input"
                                    placeholder="e.g. Wardrobes, Beds, Side Tables, Lighting"
                                    value={newSubcategoryName}
                                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="boq-form-field" style={{ marginBottom: "20px" }}>
                                <label className="boq-form-label">Description (Optional)</label>
                                <input
                                    type="text"
                                    className="boq-form-input"
                                    placeholder="e.g. Storage units & closets"
                                    value={newSubcategoryDesc}
                                    onChange={(e) => setNewSubcategoryDesc(e.target.value)}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    className="boq-btn-modal-cancel"
                                    onClick={() => setShowAddSubcategoryModal(false)}
                                    disabled={loadingAction}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="boq-btn-modal-submit"
                                    disabled={loadingAction || !newSubcategoryName.trim()}
                                >
                                    {loadingAction ? "Adding..." : "Add Subcategory"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 4. Edit Subcategory Modal */}
            {showEditSubcategoryModal && editingSubcategory && (
                <div className="boq-modal-backdrop" onClick={() => setShowEditSubcategoryModal(false)}>
                    <div className="boq-create-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
                        <div className="boq-create-header">
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                                Rename Subcategory
                            </h3>
                            <button
                                type="button"
                                className="boq-close-button"
                                onClick={() => setShowEditSubcategoryModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSubcategory} style={{ marginTop: "16px" }}>
                            <div className="boq-form-field" style={{ marginBottom: "20px" }}>
                                <label className="boq-form-label">Subcategory Name *</label>
                                <input
                                    type="text"
                                    className="boq-form-input"
                                    value={editSubcategoryName}
                                    onChange={(e) => setEditSubcategoryName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    className="boq-btn-modal-cancel"
                                    onClick={() => setShowEditSubcategoryModal(false)}
                                    disabled={loadingAction}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="boq-btn-modal-submit"
                                    disabled={loadingAction || !editSubcategoryName.trim()}
                                >
                                    {loadingAction ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 5. Add Item Modal (Contextual to Selected Subcategory) */}
            {showAddItemModal && activeCategory && (
                <div className="boq-modal-backdrop" onClick={() => setShowAddItemModal(false)}>
                    <div className="boq-create-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
                        <div className="boq-create-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                                    Add New Item
                                </h3>
                                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>
                                    Context: <strong>{room.name} → {activeCategory.name}</strong>
                                    {targetSubcategoryForAdd ? ` → ${targetSubcategoryForAdd.name}` : ""}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="boq-close-button"
                                onClick={() => setShowAddItemModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveItem} style={{ marginTop: "16px" }}>
                            <div className="boq-form-field" style={{ marginBottom: "12px" }}>
                                <label className="boq-form-label">Item Name *</label>
                                <input
                                    type="text"
                                    className="boq-form-input"
                                    placeholder="e.g. Full Height Wardrobe, King Size Bed"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="boq-form-field" style={{ marginBottom: "12px" }}>
                                <label className="boq-form-label">Specification / Description</label>
                                <input
                                    type="text"
                                    className="boq-form-input"
                                    placeholder="e.g. 19mm BWP ply. laminate finish"
                                    value={itemSpec}
                                    onChange={(e) => setItemSpec(e.target.value)}
                                />
                            </div>

                            {subcategories.length > 0 && (
                                <div className="boq-form-field" style={{ marginBottom: "12px" }}>
                                    <label className="boq-form-label">Subcategory</label>
                                    <select
                                        className="boq-form-input"
                                        value={addItemSubcatId}
                                        onChange={(e) => {
                                            setAddItemSubcatId(e.target.value);
                                            const sub = subcategories.find((s) => s.id === e.target.value);
                                            setTargetSubcategoryForAdd(sub || null);
                                        }}
                                    >
                                        <option value="">General / Direct (No Subcategory)</option>
                                        {subcategories.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                                <div className="boq-form-field">
                                    <label className="boq-form-label">Unit</label>
                                    <select
                                        className="boq-form-input"
                                        value={itemUnit}
                                        onChange={(e) => setItemUnit(e.target.value)}
                                    >
                                        <option value="Sq.ft">Sq.ft</option>
                                        <option value="Nos">Nos</option>
                                        <option value="Rft">Rft</option>
                                        <option value="Set">Set</option>
                                        <option value="L.S">L.S</option>
                                        <option value="Kg">Kg</option>
                                    </select>
                                </div>
                                <div className="boq-form-field">
                                    <label className="boq-form-label">Quantity *</label>
                                    <input
                                        type="number"
                                        className="boq-form-input"
                                        min="0.01"
                                        step="any"
                                        value={itemQty}
                                        onChange={(e) => setItemQty(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                                <div className="boq-form-field">
                                    <label className="boq-form-label">Rate (₹) *</label>
                                    <input
                                        type="number"
                                        className="boq-form-input"
                                        min="0"
                                        step="any"
                                        value={itemRate}
                                        onChange={(e) => setItemRate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="boq-form-field">
                                    <label className="boq-form-label">Waste (%)</label>
                                    <input
                                        type="number"
                                        className="boq-form-input"
                                        min="0"
                                        max="100"
                                        value={itemWaste}
                                        onChange={(e) => setItemWaste(e.target.value)}
                                    />
                                </div>
                                <div className="boq-form-field">
                                    <label className="boq-form-label">Tax (%)</label>
                                    <input
                                        type="number"
                                        className="boq-form-input"
                                        min="0"
                                        max="100"
                                        value={itemTax}
                                        onChange={(e) => setItemTax(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Live Amount Calculation Preview */}
                            <div
                                style={{
                                    padding: "10px 14px",
                                    background: "#F8FAFC",
                                    border: "1px solid #E2E8F0",
                                    borderRadius: "6px",
                                    marginBottom: "20px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 500 }}>
                                    Estimated Amount (Qty × Rate + Waste + Tax):
                                </span>
                                <strong style={{ fontSize: "16px", color: "#16A34A" }}>
                                    {formatFullIndianCurrency(liveItemAmount)}
                                </strong>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    className="boq-btn-modal-cancel"
                                    onClick={() => setShowAddItemModal(false)}
                                    disabled={loadingAction}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="boq-btn-modal-submit"
                                    disabled={loadingAction || !itemName.trim()}
                                >
                                    {loadingAction ? "Adding..." : "Add Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 6. Edit Item Modal */}
            {showEditItemModal && editingItem && (
                <div className="boq-modal-backdrop" onClick={() => setShowEditItemModal(false)}>
                    <div className="boq-create-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
                        <div className="boq-create-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                                    Edit Item
                                </h3>
                                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>
                                    Update details for <strong>{editingItem.name}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                className="boq-close-button"
                                onClick={() => setShowEditItemModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateItem} style={{ marginTop: "16px" }}>
                            <div className="boq-form-field" style={{ marginBottom: "12px" }}>
                                <label className="boq-form-label">Item Name *</label>
                                <input
                                    type="text"
                                    className="boq-form-input"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="boq-form-field" style={{ marginBottom: "12px" }}>
                                <label className="boq-form-label">Specification / Description</label>
                                <input
                                    type="text"
                                    className="boq-form-input"
                                    value={itemSpec}
                                    onChange={(e) => setItemSpec(e.target.value)}
                                />
                            </div>

                            {subcategories.length > 0 && (
                                <div className="boq-form-field" style={{ marginBottom: "12px" }}>
                                    <label className="boq-form-label">Subcategory</label>
                                    <select
                                        className="boq-form-input"
                                        value={editItemSubcatId}
                                        onChange={(e) => setEditItemSubcatId(e.target.value)}
                                    >
                                        <option value="">General / Direct (No Subcategory)</option>
                                        {subcategories.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                                <div className="boq-form-field">
                                    <label className="boq-form-label">Unit</label>
                                    <select
                                        className="boq-form-input"
                                        value={itemUnit}
                                        onChange={(e) => setItemUnit(e.target.value)}
                                    >
                                        <option value="Sq.ft">Sq.ft</option>
                                        <option value="Nos">Nos</option>
                                        <option value="Rft">Rft</option>
                                        <option value="Set">Set</option>
                                        <option value="L.S">L.S</option>
                                        <option value="Kg">Kg</option>
                                    </select>
                                </div>
                                <div className="boq-form-field">
                                    <label className="boq-form-label">Quantity *</label>
                                    <input
                                        type="number"
                                        className="boq-form-input"
                                        min="0.01"
                                        step="any"
                                        value={itemQty}
                                        onChange={(e) => setItemQty(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                                <div className="boq-form-field">
                                    <label className="boq-form-label">Rate (₹) *</label>
                                    <input
                                        type="number"
                                        className="boq-form-input"
                                        min="0"
                                        step="any"
                                        value={itemRate}
                                        onChange={(e) => setItemRate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="boq-form-field">
                                    <label className="boq-form-label">Waste (%)</label>
                                    <input
                                        type="number"
                                        className="boq-form-input"
                                        min="0"
                                        max="100"
                                        value={itemWaste}
                                        onChange={(e) => setItemWaste(e.target.value)}
                                    />
                                </div>
                                <div className="boq-form-field">
                                    <label className="boq-form-label">Tax (%)</label>
                                    <input
                                        type="number"
                                        className="boq-form-input"
                                        min="0"
                                        max="100"
                                        value={itemTax}
                                        onChange={(e) => setItemTax(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Live Amount Calculation Preview */}
                            <div
                                style={{
                                    padding: "10px 14px",
                                    background: "#F8FAFC",
                                    border: "1px solid #E2E8F0",
                                    borderRadius: "6px",
                                    marginBottom: "20px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 500 }}>
                                    Estimated Amount (Qty × Rate + Waste + Tax):
                                </span>
                                <strong style={{ fontSize: "16px", color: "#16A34A" }}>
                                    {formatFullIndianCurrency(liveItemAmount)}
                                </strong>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    className="boq-btn-modal-cancel"
                                    onClick={() => setShowEditItemModal(false)}
                                    disabled={loadingAction}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="boq-btn-modal-submit"
                                    disabled={loadingAction || !itemName.trim()}
                                >
                                    {loadingAction ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 7. Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="boq-modal-backdrop" onClick={() => setDeleteTarget(null)}>
                    <div className="boq-create-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
                        <div className="boq-create-header">
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#DC2626" }}>
                                Delete {deleteTarget.type === "category" ? "Category" : deleteTarget.type === "subcategory" ? "Subcategory" : "Item"}
                            </h3>
                            <button
                                type="button"
                                className="boq-close-button"
                                onClick={() => setDeleteTarget(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ marginTop: "14px", color: "#334155", fontSize: "14px", lineHeight: "150%" }}>
                            <p style={{ margin: "0 0 10px" }}>
                                Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
                            </p>
                            {deleteTarget.count !== undefined && deleteTarget.count > 0 && (
                                <p style={{ margin: "0 0 10px", color: "#B91C1C", background: "#FEF2F2", padding: "8px 12px", borderRadius: "6px" }}>
                                    Warning: This will also permanently delete all {deleteTarget.count} items contained inside it!
                                </p>
                            )}
                            <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
                                This action cannot be undone.
                            </p>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                            <button
                                type="button"
                                className="boq-btn-modal-cancel"
                                onClick={() => setDeleteTarget(null)}
                                disabled={loadingAction}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                style={{
                                    height: "38px",
                                    padding: "0 16px",
                                    background: "#DC2626",
                                    color: "#FFFFFF",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                }}
                                disabled={loadingAction}
                                onClick={() => {
                                    if (deleteTarget.type === "category") handleDeleteCategoryExecution();
                                    else if (deleteTarget.type === "subcategory") handleDeleteSubcategoryExecution();
                                    else handleDeleteItemExecution();
                                }}
                            >
                                {loadingAction ? "Deleting..." : "Delete Permanently"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
