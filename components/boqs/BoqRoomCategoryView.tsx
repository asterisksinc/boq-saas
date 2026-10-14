"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    ChevronRight,
    Plus,
    Folder,
    Edit2,
    MoreVertical,
    MoreHorizontal,
    Trash2,
    X,
    GripVertical,
    Loader2,
} from "lucide-react";
import { type BoqListItem } from "@/lib/domain/boq-data";
import { getApiErrorMessage } from "@/lib/api/auth";

interface BoqCategory {
    id: string;
    room_id?: string;
    name: string;
    description?: string | null;
    sort_order?: number;
    items?: BoqItem[];
}

interface BoqItem {
    id: string;
    room_id?: string;
    category_id?: string;
    name: string;
    description?: string | null;
    unit: string;
    quantity: number;
    rate: number;
    waste_percent?: number;
    wastePercent?: number;
    tax_percent?: number;
    taxPercent?: number;
    amount?: number;
    sort_order?: number;
}

interface BoqRoom {
    id: string;
    name: string;
    description?: string | null;
    categories?: BoqCategory[];
}

interface BoqRoomCategoryViewProps {
    activeBoq: BoqListItem;
    room: BoqRoom;
    onBackToBoq: () => void;
    onBackToList: () => void;
    onRefreshBoq: () => Promise<void>;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatRate(rate: number) {
    return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(rate);
}

export default function BoqRoomCategoryView({
    activeBoq,
    room,
    onBackToBoq,
    onBackToList,
    onRefreshBoq,
}: BoqRoomCategoryViewProps) {
    const categories = useMemo(() => room.categories || [], [room.categories]);

    // Selected category state
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
        categories[0]?.id || ""
    );

    // Keep active category in sync if categories change
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

    // Active category items
    const rawItems = useMemo(() => {
        return activeCategory?.items || [];
    }, [activeCategory]);

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const totalPages = Math.max(1, Math.ceil(rawItems.length / pageSize));

    const pagedItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        return rawItems.slice(start, start + pageSize);
    }, [rawItems, page, pageSize]);

    // Calculations
    const categoryTotalAmount = useMemo(() => {
        return rawItems.reduce((sum, item) => {
            const explicitAmt = Number(item.amount);
            if (!isNaN(explicitAmt) && explicitAmt > 0) return sum + explicitAmt;
            const q = Number(item.quantity) || 0;
            const r = Number(item.rate) || 0;
            const w = Number(item.wastePercent ?? item.waste_percent ?? 0);
            const t = Number(item.taxPercent ?? item.tax_percent ?? 18);
            const amt = Math.round(q * r * (1 + w / 100) * (1 + t / 100));
            return sum + amt;
        }, 0);
    }, [rawItems]);

    const categoryTotalQuantity = useMemo(() => {
        return rawItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }, [rawItems]);

    // Modals state
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
    const [editCategoryName, setEditCategoryName] = useState("");

    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [showEditItemModal, setShowEditItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState<BoqItem | null>(null);

    // Item form fields
    const [itemName, setItemName] = useState("");
    const [itemDesc, setItemDesc] = useState("");
    const [itemUnit, setItemUnit] = useState("Sq.ft");
    const [itemQty, setItemQty] = useState("1");
    const [itemRateVal, setItemRateVal] = useState("1000");
    const [itemWaste, setItemWaste] = useState("5");
    const [itemTax, setItemTax] = useState("18");

    // Action menu states
    const [openCategoryMenu, setOpenCategoryMenu] = useState(false);
    const [activeItemMenuId, setActiveItemMenuId] = useState<string | null>(null);
    const [itemMenuPos, setItemMenuPos] = useState<{ top: number; left: number } | null>(null);

    const [loadingAction, setLoadingAction] = useState(false);
    const [feedbackError, setFeedbackError] = useState("");
    const [feedbackSuccess, setFeedbackSuccess] = useState("");

    const categoryMenuRef = useRef<HTMLDivElement>(null);
    const itemMenuRef = useRef<HTMLDivElement>(null);

    // Handle outside clicks to close dropdown menus
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
                setOpenCategoryMenu(false);
            }
            if (itemMenuRef.current && !itemMenuRef.current.contains(e.target as Node)) {
                setActiveItemMenuId(null);
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpenCategoryMenu(false);
                setActiveItemMenuId(null);
            }
        };

        const handleScroll = () => {
            setActiveItemMenuId(null);
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);
        window.addEventListener("scroll", handleScroll, true);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, []);

    // ──────────────── Category CRUD Handlers ────────────────

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newCategoryName.trim();
        if (!trimmed) {
            setFeedbackError("Category name cannot be empty.");
            return;
        }

        // Prevent duplicate category name in this room
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
                body: JSON.stringify({ name: trimmed }),
                credentials: "include",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(getApiErrorMessage(data) || "Failed to create category.");
            }

            setNewCategoryName("");
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

    const handleDeleteCategory = async () => {
        if (!activeCategory) return;
        if (!confirm(`Are you sure you want to delete "${activeCategory.name}" and all its items?`)) {
            return;
        }

        setLoadingAction(true);
        setFeedbackError("");
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/categories/${activeCategory.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(data) || "Failed to delete category.");
            }

            setOpenCategoryMenu(false);
            setFeedbackSuccess("Category deleted successfully.");
            setTimeout(() => setFeedbackSuccess(""), 4000);
            await onRefreshBoq();
        } catch (err) {
            setFeedbackError(err instanceof Error ? err.message : "Failed to delete category.");
        } finally {
            setLoadingAction(false);
        }
    };

    // ──────────────── Item CRUD Handlers ────────────────

    const openAddItemModal = () => {
        setItemName("");
        setItemDesc("");
        setItemUnit("Sq.ft");
        setItemQty("1");
        setItemRateVal("1000");
        setItemWaste("5");
        setItemTax("18");
        setFeedbackError("");
        setShowAddItemModal(true);
    };

    const openEditItemModal = (item: BoqItem) => {
        setEditingItem(item);
        setItemName(item.name || "");
        setItemDesc(item.description || "");
        setItemUnit(item.unit || "Nos");
        setItemQty(String(item.quantity || 1));
        setItemRateVal(String(item.rate || 0));
        setItemWaste(String(item.wastePercent ?? item.waste_percent ?? 0));
        setItemTax(String(item.taxPercent ?? item.tax_percent ?? 18));
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
        const rateNum = Number(itemRateVal);
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
            const payload = {
                name: itemName.trim(),
                description: itemDesc.trim() || undefined,
                unit: itemUnit,
                quantity: qtyNum,
                rate: rateNum,
                wastePercent: wasteNum,
                taxPercent: taxNum,
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
        const rateNum = Number(itemRateVal);
        const wasteNum = Number(itemWaste) || 0;
        const taxNum = Number(itemTax) || 0;

        setLoadingAction(true);
        setFeedbackError("");
        try {
            const payload = {
                name: itemName.trim(),
                description: itemDesc.trim() || undefined,
                unit: itemUnit,
                quantity: qtyNum,
                rate: rateNum,
                wastePercent: wasteNum,
                taxPercent: taxNum,
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

    const handleDeleteItem = async (itemId: string) => {
        setLoadingAction(true);
        setFeedbackError("");
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/items/${itemId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(data) || "Failed to delete item.");
            }

            setActiveItemMenuId(null);
            setFeedbackSuccess("Item removed.");
            setTimeout(() => setFeedbackSuccess(""), 4000);
            await onRefreshBoq();
        } catch (err) {
            setFeedbackError(err instanceof Error ? err.message : "Failed to delete item.");
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <section className="boq-room-category-shell">
            {/* A. Breadcrumb Navigation */}
            <nav className="boq-detail-breadcrumb" aria-label="Breadcrumb">
                <button
                    type="button"
                    className="boq-breadcrumb-link"
                    onClick={onBackToList}
                >
                    Bill of Quantities
                </button>
                <ChevronRight size={15} className="boq-breadcrumb-sep" />
                <button
                    type="button"
                    className="boq-breadcrumb-link"
                    onClick={onBackToBoq}
                >
                    {activeBoq.boqNumber}
                </button>
                <ChevronRight size={15} className="boq-breadcrumb-sep" />
                <span className="boq-breadcrumb-active">{room.name}</span>
            </nav>

            {/* Notifications */}
            {feedbackError && (
                <div className="boq-alert" style={{ marginBottom: "16px" }}>
                    {feedbackError}
                </div>
            )}
            {feedbackSuccess && (
                <div
                    className="boq-alert"
                    style={{
                        marginBottom: "16px",
                        background: "#f0fdf4",
                        borderColor: "#bbf7d0",
                        color: "#166534",
                    }}
                >
                    {feedbackSuccess}
                </div>
            )}

            {/* Main Room Category Layout */}
            <div className="boq-room-category-layout">
                {/* B. Room Category Sidebar */}
                <aside className="boq-category-sidebar">
                    <h3 className="boq-category-sidebar-title">{room.name}</h3>

                    {/* C. Add More Category Button */}
                    <button
                        type="button"
                        className="boq-category-add-btn"
                        onClick={() => {
                            setNewCategoryName("");
                            setFeedbackError("");
                            setShowAddCategoryModal(true);
                        }}
                    >
                        <span>Add More Category</span>
                        <Plus size={16} />
                    </button>

                    {/* Category List */}
                    <div className="boq-category-list">
                        {categories.length === 0 ? (
                            <div className="boq-category-empty-sidebar">
                                <p>No categories yet.</p>
                                <small>Click the button above to add a category.</small>
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
                                        className={`boq-category-item ${isActive ? "active" : ""}`}
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
                                        <div className="boq-category-item-left">
                                            <Folder
                                                size={16}
                                                className={`boq-category-folder-icon ${isActive ? "active" : ""}`}
                                            />
                                            <span className="boq-category-name">{cat.name}</span>
                                        </div>
                                        <span className={`boq-category-item-badge ${isActive ? "active" : ""}`}>
                                            Item {itemCount}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* E. Main Category-Content Panel */}
                <main className="boq-category-content-panel">
                    {activeCategory ? (
                        <>
                            {/* Panel Header */}
                            <div className="boq-category-header">
                                <div className="boq-category-title-wrap">
                                    <h2 className="boq-category-title">{activeCategory.name}</h2>
                                    <p className="boq-category-subtitle">
                                        {room.name} · BOQ Section
                                    </p>
                                    <p className="boq-category-stats">
                                        {rawItems.length} Items · {formatCurrency(categoryTotalAmount)} Illustrative Template Value
                                    </p>
                                </div>

                                {/* Category Action Buttons: Edit, Add Item, More */}
                                <div className="boq-category-actions">
                                    <button
                                        type="button"
                                        className="boq-category-action-btn"
                                        aria-label="Edit category"
                                        title="Edit category"
                                        onClick={() => {
                                            setEditCategoryName(activeCategory.name);
                                            setShowEditCategoryModal(true);
                                        }}
                                    >
                                        <Edit2 size={16} />
                                    </button>

                                    <button
                                        type="button"
                                        className="boq-category-action-btn"
                                        aria-label="Add item to this category"
                                        title="Add item"
                                        onClick={openAddItemModal}
                                    >
                                        <Plus size={18} />
                                    </button>

                                    <div
                                        className="boq-cell-dropdown-anchor"
                                        ref={categoryMenuRef}
                                    >
                                        <button
                                            type="button"
                                            className="boq-category-action-btn"
                                            aria-label="More category options"
                                            title="More options"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenCategoryMenu(!openCategoryMenu);
                                            }}
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        {openCategoryMenu && (
                                            <div
                                                className="boq-floating-action-menu"
                                                style={{
                                                    position: "absolute",
                                                    right: 0,
                                                    top: "100%",
                                                    marginTop: "6px",
                                                    width: "150px",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    className="boq-floating-action-item"
                                                    onClick={() => {
                                                        setOpenCategoryMenu(false);
                                                        setEditCategoryName(activeCategory.name);
                                                        setShowEditCategoryModal(true);
                                                    }}
                                                >
                                                    <Edit2 size={14} color="#6b7280" />
                                                    <span>Edit Category</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="boq-floating-action-item"
                                                    style={{ color: "#ef4444" }}
                                                    onClick={handleDeleteCategory}
                                                >
                                                    <Trash2 size={14} color="#ef4444" />
                                                    <span>Delete Category</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Structured BOQ Item Table */}
                            <div className="boq-category-table-wrap">
                                <table className="boq-category-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "45px", textAlign: "center" }}>#</th>
                                            <th>ITEM</th>
                                            <th style={{ width: "80px" }}>UNIT</th>
                                            <th style={{ width: "65px", textAlign: "right" }}>QTY</th>
                                            <th style={{ width: "110px", textAlign: "right" }}>RATE (₹)</th>
                                            <th style={{ width: "85px", textAlign: "center" }}>WASTE (%)</th>
                                            <th style={{ width: "75px", textAlign: "center" }}>TAX (%)</th>
                                            <th style={{ width: "120px", textAlign: "right" }}>AMOUNT(₹)</th>
                                            <th style={{ width: "45px", textAlign: "center" }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rawItems.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={9}
                                                    style={{
                                                        textAlign: "center",
                                                        padding: "48px 20px",
                                                        color: "#64748b",
                                                    }}
                                                >
                                                    <p style={{ margin: "0 0 12px", fontSize: "15px" }}>
                                                        No items in <strong>{activeCategory.name}</strong> yet.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        className="boq-btn-primary"
                                                        onClick={openAddItemModal}
                                                        style={{ height: "36px", padding: "0 16px" }}
                                                    >
                                                        <Plus size={16} />
                                                        <span>Add First Item</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ) : (
                                            pagedItems.map((item, idx) => {
                                                const rowNum = (page - 1) * pageSize + idx + 1;
                                                const wastePct =
                                                    item.wastePercent ?? item.waste_percent ?? 0;
                                                const taxPct =
                                                    item.taxPercent ?? item.tax_percent ?? 18;
                                                const q = Number(item.quantity) || 0;
                                                const r = Number(item.rate) || 0;
                                                const calculatedAmt =
                                                    Number(item.amount) > 0
                                                        ? Number(item.amount)
                                                        : Math.round(
                                                              q *
                                                                  r *
                                                                  (1 + wastePct / 100) *
                                                                  (1 + taxPct / 100)
                                                          );

                                                return (
                                                    <tr key={item.id} className="boq-category-item-row">
                                                        <td style={{ textAlign: "center", color: "#94a3b8" }}>
                                                            <div className="boq-row-drag-handle">
                                                                <GripVertical size={13} color="#cbd5e1" />
                                                                <span>{rowNum}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="boq-item-cell-title-group">
                                                                <strong className="boq-item-cell-name">
                                                                    {item.name}
                                                                </strong>
                                                                <span className="boq-item-cell-desc">
                                                                    {item.description || "-"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="boq-item-cell-unit">{item.unit}</span>
                                                        </td>
                                                        <td style={{ textAlign: "right", fontWeight: 500 }}>
                                                            {item.quantity}
                                                        </td>
                                                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                                                            {formatRate(item.rate)}
                                                        </td>
                                                        <td style={{ textAlign: "center", color: "#64748b" }}>
                                                            {wastePct}%
                                                        </td>
                                                        <td style={{ textAlign: "center", color: "#64748b" }}>
                                                            {taxPct}%
                                                        </td>
                                                        <td style={{ textAlign: "right" }}>
                                                            <span className="boq-item-amount-green">
                                                                {calculatedAmt.toLocaleString("en-IN")}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            <button
                                                                type="button"
                                                                className="boq-dots-button"
                                                                aria-label={`Actions for ${item.name}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (activeItemMenuId === item.id) {
                                                                        setActiveItemMenuId(null);
                                                                    } else {
                                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                                        setItemMenuPos({
                                                                            top: rect.bottom + 4,
                                                                            left: rect.right - 140,
                                                                        });
                                                                        setActiveItemMenuId(item.id);
                                                                    }
                                                                }}
                                                            >
                                                                <MoreHorizontal size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>

                                {/* Totals Row */}
                                {rawItems.length > 0 && (
                                    <div className="boq-category-totals-strip">
                                        <div className="boq-totals-strip-left">
                                            TOTAL ({rawItems.length} ITEMS)
                                        </div>
                                        <div className="boq-totals-strip-center">
                                            {categoryTotalQuantity}
                                        </div>
                                        <div className="boq-totals-strip-right">
                                            ₹{Math.round(categoryTotalAmount).toLocaleString("en-IN")}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pagination and Page-Size Controls */}
                            <div className="boq-category-pagination-row">
                                <span className="boq-category-total-items-text">
                                    Total Items: {rawItems.length > 0 ? rawItems.length : "NA"}
                                </span>

                                <div className="boq-category-page-buttons">
                                    <button
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        aria-label="Previous page"
                                    >
                                        ‹
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            className={page === p ? "active" : ""}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        aria-label="Next page"
                                    >
                                        ›
                                    </button>
                                </div>

                                <div className="boq-category-page-size">
                                    <span>Show per Page:</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                    >
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: "center", padding: "64px 20px" }}>
                            <h3>No category selected</h3>
                            <p style={{ color: "#64748b", margin: "8px 0 16px" }}>
                                Click &apos;Add More Category&apos; on the left sidebar to add categories to {room.name}.
                            </p>
                        </div>
                    )}
                </main>
            </div>

            {/* Portal Menu for Item Actions */}
            {activeItemMenuId &&
                itemMenuPos &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        ref={itemMenuRef}
                        className="boq-floating-action-menu"
                        style={{
                            position: "fixed",
                            top: `${itemMenuPos.top}px`,
                            left: `${itemMenuPos.left}px`,
                            width: "140px",
                            zIndex: 99999,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="boq-floating-action-item"
                            onClick={() => {
                                const target = rawItems.find((i) => i.id === activeItemMenuId);
                                setActiveItemMenuId(null);
                                if (target) openEditItemModal(target);
                            }}
                        >
                            <Edit2 size={14} color="#6b7280" />
                            <span>Edit Item</span>
                        </button>
                        <button
                            type="button"
                            className="boq-floating-action-item"
                            style={{ color: "#ef4444" }}
                            onClick={() => {
                                const idToDelete = activeItemMenuId;
                                setActiveItemMenuId(null);
                                void handleDeleteItem(idToDelete);
                            }}
                        >
                            <Trash2 size={14} color="#ef4444" />
                            <span>Delete Item</span>
                        </button>
                    </div>,
                    document.body
                )}

            {/* Modal: Add Category */}
            {showAddCategoryModal && (
                <div className="boq-modal-backdrop" onClick={() => setShowAddCategoryModal(false)}>
                    <div
                        className="boq-details-modal"
                        style={{ maxWidth: "440px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="boq-details-header">
                            <div>
                                <h3>Add Category</h3>
                                <p>Add a new category to {room.name}</p>
                            </div>
                            <button
                                type="button"
                                className="boq-details-close-btn"
                                onClick={() => setShowAddCategoryModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCategory}>
                            <div className="boq-details-form-body">
                                <div className="boq-details-field">
                                    <label>
                                        Category Name <span className="boq-required-star">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Furniture, Electrical, Painting"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>
                            <div className="boq-details-footer" style={{ marginTop: "20px" }}>
                                <button
                                    type="button"
                                    className="boq-btn-cancel"
                                    onClick={() => setShowAddCategoryModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="boq-btn-create"
                                    disabled={loadingAction}
                                >
                                    {loadingAction ? "Adding..." : "Add Category"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Category */}
            {showEditCategoryModal && activeCategory && (
                <div className="boq-modal-backdrop" onClick={() => setShowEditCategoryModal(false)}>
                    <div
                        className="boq-details-modal"
                        style={{ maxWidth: "440px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="boq-details-header">
                            <div>
                                <h3>Edit Category</h3>
                                <p>Rename category for {room.name}</p>
                            </div>
                            <button
                                type="button"
                                className="boq-details-close-btn"
                                onClick={() => setShowEditCategoryModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateCategory}>
                            <div className="boq-details-form-body">
                                <div className="boq-details-field">
                                    <label>
                                        Category Name <span className="boq-required-star">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editCategoryName}
                                        onChange={(e) => setEditCategoryName(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>
                            <div className="boq-details-footer" style={{ marginTop: "20px" }}>
                                <button
                                    type="button"
                                    className="boq-btn-cancel"
                                    onClick={() => setShowEditCategoryModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="boq-btn-create"
                                    disabled={loadingAction}
                                >
                                    {loadingAction ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add Item */}
            {showAddItemModal && activeCategory && (
                <div className="boq-modal-backdrop" onClick={() => setShowAddItemModal(false)}>
                    <div
                        className="boq-details-modal"
                        style={{ maxWidth: "560px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="boq-details-header">
                            <div>
                                <h3>Add Item</h3>
                                <p>Add item to {activeCategory.name} ({room.name})</p>
                            </div>
                            <button
                                type="button"
                                className="boq-details-close-btn"
                                onClick={() => setShowAddItemModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveItem}>
                            <div className="boq-details-form-body">
                                <div className="boq-details-field">
                                    <label>
                                        Item Name <span className="boq-required-star">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Full Height Wardrobe"
                                        value={itemName}
                                        onChange={(e) => setItemName(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>

                                <div className="boq-details-field">
                                    <label>Description / Specification</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 19mm BWP ply, laminate finish"
                                        value={itemDesc}
                                        onChange={(e) => setItemDesc(e.target.value)}
                                    />
                                </div>

                                <div className="boq-details-row-2col">
                                    <div className="boq-details-field">
                                        <label>Unit <span className="boq-required-star">*</span></label>
                                        <select
                                            value={itemUnit}
                                            onChange={(e) => setItemUnit(e.target.value)}
                                            required
                                        >
                                            <option value="Sq.ft">Sq.ft</option>
                                            <option value="Nos">Nos</option>
                                            <option value="Set">Set</option>
                                            <option value="RFt">RFt</option>
                                            <option value="R.ft">R.ft</option>
                                            <option value="L.S.">L.S.</option>
                                            <option value="Cum">Cum</option>
                                        </select>
                                    </div>
                                    <div className="boq-details-field">
                                        <label>Quantity <span className="boq-required-star">*</span></label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="any"
                                            value={itemQty}
                                            onChange={(e) => setItemQty(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="boq-details-row-2col">
                                    <div className="boq-details-field">
                                        <label>Rate (₹) <span className="boq-required-star">*</span></label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={itemRateVal}
                                            onChange={(e) => setItemRateVal(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="boq-details-field">
                                        <label>Waste (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={itemWaste}
                                            onChange={(e) => setItemWaste(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="boq-details-field">
                                    <label>Tax (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={itemTax}
                                        onChange={(e) => setItemTax(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="boq-details-footer" style={{ marginTop: "24px" }}>
                                <button
                                    type="button"
                                    className="boq-btn-cancel"
                                    onClick={() => setShowAddItemModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="boq-btn-create"
                                    disabled={loadingAction}
                                >
                                    {loadingAction ? "Saving..." : "Add Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Item */}
            {showEditItemModal && editingItem && (
                <div className="boq-modal-backdrop" onClick={() => setShowEditItemModal(false)}>
                    <div
                        className="boq-details-modal"
                        style={{ maxWidth: "560px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="boq-details-header">
                            <div>
                                <h3>Edit Item</h3>
                                <p>Update item specifications</p>
                            </div>
                            <button
                                type="button"
                                className="boq-details-close-btn"
                                onClick={() => setShowEditItemModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateItem}>
                            <div className="boq-details-form-body">
                                <div className="boq-details-field">
                                    <label>
                                        Item Name <span className="boq-required-star">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={itemName}
                                        onChange={(e) => setItemName(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>

                                <div className="boq-details-field">
                                    <label>Description / Specification</label>
                                    <input
                                        type="text"
                                        value={itemDesc}
                                        onChange={(e) => setItemDesc(e.target.value)}
                                    />
                                </div>

                                <div className="boq-details-row-2col">
                                    <div className="boq-details-field">
                                        <label>Unit <span className="boq-required-star">*</span></label>
                                        <select
                                            value={itemUnit}
                                            onChange={(e) => setItemUnit(e.target.value)}
                                            required
                                        >
                                            <option value="Sq.ft">Sq.ft</option>
                                            <option value="Nos">Nos</option>
                                            <option value="Set">Set</option>
                                            <option value="RFt">RFt</option>
                                            <option value="R.ft">R.ft</option>
                                            <option value="L.S.">L.S.</option>
                                            <option value="Cum">Cum</option>
                                        </select>
                                    </div>
                                    <div className="boq-details-field">
                                        <label>Quantity <span className="boq-required-star">*</span></label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="any"
                                            value={itemQty}
                                            onChange={(e) => setItemQty(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="boq-details-row-2col">
                                    <div className="boq-details-field">
                                        <label>Rate (₹) <span className="boq-required-star">*</span></label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={itemRateVal}
                                            onChange={(e) => setItemRateVal(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="boq-details-field">
                                        <label>Waste (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={itemWaste}
                                            onChange={(e) => setItemWaste(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="boq-details-field">
                                    <label>Tax (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={itemTax}
                                        onChange={(e) => setItemTax(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="boq-details-footer" style={{ marginTop: "24px" }}>
                                <button
                                    type="button"
                                    className="boq-btn-cancel"
                                    onClick={() => setShowEditItemModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="boq-btn-create"
                                    disabled={loadingAction}
                                >
                                    {loadingAction ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
