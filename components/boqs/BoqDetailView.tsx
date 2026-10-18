"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    ArrowLeft,
    ChevronRight,
    Search,
    FileSpreadsheet,
    FileText,
    Plus,
    MoreHorizontal,
    Edit2,
    Copy,
    Trash2,
    X,
    CheckCircle2,
    AlertCircle,
    Download,
    Eye,
    History,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
    type BoqListItem,
    formatFullIndianCurrency,
} from "@/lib/domain/boq-data";
import { getApiErrorMessage } from "@/lib/api/auth";
import BoqRoomCategoryView from "@/components/boqs/BoqRoomCategoryView";
import BoqGenerateProposalModal from "@/components/boqs/BoqGenerateProposalModal";
import BoqVersionHistoryModal from "@/components/boqs/BoqVersionHistoryModal";
import BoqTemplatesDrawer from "@/components/boqs/BoqTemplatesDrawer";

interface BoqDetailViewProps {
    activeBoq: BoqListItem;
    onBack: () => void;
}

// Helper to extract display presentation for each room in the table
function getRoomPresentation(room: any) {
    const categories = room.categories || [];
    const categoryCount = categories.length > 0 ? categories.length : 1;
    const allItems = categories.flatMap((c: any) => c.items || []);
    const itemCount = allItems.length;

    const roomAmount = allItems.reduce((acc: number, item: any) => {
        const amt = Number(item.amount);
        if (!isNaN(amt) && amt > 0) return acc + amt;
        const q = Number(item.quantity) || 0;
        const r = Number(item.rate) || 0;
        const w = Number(item.wastePercent ?? item.waste_percent ?? 0);
        const t = Number(item.taxPercent ?? item.tax_percent ?? 18);
        return acc + Math.round(q * r * (1 + w / 100) * (1 + t / 100));
    }, 0);

    const firstItem = allItems[0];
    const spec = firstItem?.description || (itemCount > 0 ? "Standard Spec" : "-");
    const unit = firstItem?.unit || (itemCount > 0 ? "No" : "-");

    let displayDesc = "-";
    let fullTooltip = "";
    if (allItems.length > 0) {
        const itemNames = allItems.map((i: any) => i.name).filter(Boolean);
        displayDesc = itemNames.slice(0, 2).join(", ");
        if (itemNames.length > 2) displayDesc += ` +${itemNames.length - 2} more`;
        fullTooltip = itemNames.join(", ");
    }

    return {
        categoryCount,
        itemCount,
        roomAmount,
        spec,
        unit,
        displayDesc,
        fullTooltip,
    };
}

export default function BoqDetailView({ activeBoq, onBack }: BoqDetailViewProps) {
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState<any[]>([]);
    const [boqData, setBoqData] = useState<any>(null);
    const [actionError, setActionError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Navigation & Drilldown
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    // Modals
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [addingRoom, setAddingRoom] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [selectedRoomForItems, setSelectedRoomForItems] = useState<any | null>(null);
    const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
    const [editRoomName, setEditRoomName] = useState("");

    // Add item form state inside Manage Items Modal
    const [itemName, setItemName] = useState("");
    const [itemSpec, setItemSpec] = useState("");
    const [itemUnit, setItemUnit] = useState("No");
    const [itemQty, setItemQty] = useState("1");
    const [itemRate, setItemRate] = useState("1000");

    // Excel import state
    const [importingExcel, setImportingExcel] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Templates state for Use Template drawer
    const [templatesList, setTemplatesList] = useState<any[]>([]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await fetch("/api/v1/boq-templates?includeSnapshot=true", { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.data?.items) {
                        setTemplatesList(data.data.items);
                    }
                }
            } catch {
                // Ignore background fetch failure
            }
        };
        void fetchTemplates();
    }, []);

    // Read room param from URL if present
    useEffect(() => {
        if (typeof window !== "undefined") {
            const sp = new URLSearchParams(window.location.search);
            const rId = sp.get("roomId");
            if (rId) {
                setSelectedRoomId(rId);
            }
        }
    }, []);

    // Close action dropdown menu on outside click
    useEffect(() => {
        const handleOutsideClick = () => {
            setOpenRowMenuId(null);
        };
        window.addEventListener("click", handleOutsideClick);
        return () => window.removeEventListener("click", handleOutsideClick);
    }, []);

    const loadDetail = async () => {
        setLoading(true);
        setActionError("");
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load BOQ details");
            const data = await res.json();
            const boq = data.data;
            setBoqData(boq);
            const loadedRooms = boq?.rooms && Array.isArray(boq.rooms) ? boq.rooms : [];
            const uniqueRooms = Array.from(new Map(loadedRooms.map((r: any) => [r.id, r])).values());
            setRooms(uniqueRooms);
            if (selectedRoomForItems) {
                const refreshed = uniqueRooms.find((r: any) => r.id === selectedRoomForItems.id);
                if (refreshed) setSelectedRoomForItems(refreshed);
            }
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to load BOQ details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadDetail();
    }, [activeBoq.id]);

    const handleDuplicateRoom = async (roomId: string) => {
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms/${roomId}/duplicate`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                const p = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }
            setSuccessMsg("Room duplicated successfully");
            setTimeout(() => setSuccessMsg(""), 3500);
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to duplicate room");
        }
    };

    const handleDuplicate = async () => {
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/duplicate`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                const p = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }
            onBack();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to duplicate");
        }
    };

    const handleStatusChange = async (status: string) => {
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/status`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const p = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }
            setSuccessMsg(`BOQ status updated to ${status.replace(/_/g, " ").toUpperCase()}`);
            setTimeout(() => setSuccessMsg(""), 3500);
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to change status");
        }
    };

    const handleAddRoom = async (customName?: string) => {
        const nameToUse = customName || newRoomName;
        if (!nameToUse.trim()) return;
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: nameToUse.trim() }),
            });
            if (!res.ok) {
                const p = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }
            setNewRoomName("");
            setAddingRoom(false);
            setSuccessMsg(`Room "${nameToUse.trim()}" added successfully`);
            setTimeout(() => setSuccessMsg(""), 3500);
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to add room");
        }
    };

    const handleEditRoom = async (roomId: string) => {
        if (!editRoomName.trim()) return;
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms/${roomId}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editRoomName.trim() }),
            });
            if (!res.ok) {
                const p = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }
            setEditingRoomId(null);
            setEditRoomName("");
            setSuccessMsg("Room updated successfully");
            setTimeout(() => setSuccessMsg(""), 3500);
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to edit room");
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm("Are you sure you want to delete this room?")) return;
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms/${roomId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const p = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }
            if (selectedRoomForItems?.id === roomId) setSelectedRoomForItems(null);
            setSuccessMsg("Room deleted successfully");
            setTimeout(() => setSuccessMsg(""), 3500);
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to delete room");
        }
    };

    const handleAddItem = async (roomId: string) => {
        if (!itemName.trim() || Number(itemQty) <= 0 || Number(itemRate) < 0) return;
        try {
            const currentRoom = rooms.find((r) => r.id === roomId);
            let categoryId = currentRoom?.categories?.[0]?.id;

            if (!categoryId) {
                const catRes = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms/${roomId}/categories`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "General" }),
                });
                if (!catRes.ok) {
                    const p = await catRes.json().catch(() => ({}));
                    throw new Error(getApiErrorMessage(p));
                }
                const catData = await catRes.json();
                categoryId = catData.data?.id;
            }

            const itemRes = await fetch(`/api/v1/boqs/${activeBoq.id}/categories/${categoryId}/items`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: itemName.trim(),
                    description: itemSpec.trim() || undefined,
                    unit: itemUnit,
                    quantity: Number(itemQty),
                    rate: Number(itemRate),
                }),
            });
            if (!itemRes.ok) {
                const p = await itemRes.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }

            setItemName("");
            setItemSpec("");
            setItemQty("1");
            setItemRate("1000");
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to add item");
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/items/${itemId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const p = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to delete item");
        }
    };

    // Load sample design data (8 rooms) matching reference design perfectly
    const handleLoadSampleDesignData = async () => {
        setImportingExcel(true);
        setActionError("");
        try {
            const sampleData = [
                { room: "Master Bedroom", spec: "Custom, 6×6.5ft", unit: "No", qty: 8, rate: 23125, name: "King Size Platform Bed with Upholstered Headboard Walnut Veneer" },
                { room: "Bedroom 02", spec: "Custom, 18×24in", unit: "Set", qty: 15, rate: 2800, name: "Bedside Tables - Pair, with Soft-Close Drawers" },
                { room: "Bedroom 03", spec: "Custom, 18×24in", unit: "Set", qty: 20, rate: 2100, name: "Bedside Tables - Pair, with Soft-Close Drawers" },
                { room: "Living Room", spec: "MDF + PU Lacquer", unit: "RFt", qty: 10, rate: 12500, name: "Sliding Wardrobe 3-Panel Mirror Finish, 10ft Width" },
                { room: "Dinning Room", spec: "18mm thick, honed", unit: "Sqft", qty: 320, rate: 480, name: "Italian Marble 600×600mm -Bianco Carrara" },
                { room: "Kitchen", spec: "Double layer GRP", unit: "No", qty: 24, rate: 3300, name: "False Ceiling - Gypsum Board with Cove Lighting" },
                { room: "Study Room", spec: "Double layer GRP", unit: "No", qty: 24, rate: 3300, name: "False Ceiling - Gypsum Board with Cove Lighting" },
                { room: "Guest Bedroom", spec: "Double layer GRP", unit: "No", qty: 24, rate: 3300, name: "False Ceiling - Gypsum Board with Cove Lighting" },
            ];

            for (const sample of sampleData) {
                let targetRoom = rooms.find((r) => r.name.toLowerCase() === sample.room.toLowerCase());
                if (!targetRoom) {
                    const rRes = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: sample.room }),
                    });
                    if (rRes.ok) {
                        const rData = await rRes.json();
                        targetRoom = rData.data;
                    }
                }

                if (targetRoom) {
                    const cRes = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms/${targetRoom.id}/categories`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: "Primary Fitout" }),
                    });
                    const cData = await cRes.json();
                    const catId = cData.data?.id;

                    if (catId) {
                        await fetch(`/api/v1/boqs/${activeBoq.id}/categories/${catId}/items`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: sample.name,
                                description: sample.spec,
                                unit: sample.unit,
                                quantity: sample.qty,
                                rate: sample.rate,
                            }),
                        });
                    }
                }
            }

            setSuccessMsg("Successfully loaded 8-room reference interior package!");
            setTimeout(() => setSuccessMsg(""), 3500);
            setShowImportModal(false);
            setShowTemplateModal(false);
            void loadDetail();
        } catch (e) {
            setActionError(e instanceof Error ? e.message : "Failed to load sample data");
        } finally {
            setImportingExcel(false);
        }
    };

    // Apply template data to active BOQ
    const handleApplyTemplate = async (templateId: string) => {
        setImportingExcel(true);
        setActionError("");
        try {
            let template = templatesList.find((t) => t.id === templateId);
            if (!template?.rooms || template.rooms.length === 0) {
                const res = await fetch(`/api/v1/boq-templates/${templateId}`, { credentials: "include" });
                if (res.ok) {
                    const d = await res.json();
                    template = d.data || d;
                }
            }

            const sourceRooms = template?.rooms || template?.snapshot?.rooms || [];

            if (Array.isArray(sourceRooms) && sourceRooms.length > 0) {
                for (const sRoom of sourceRooms) {
                    let targetRoom = rooms.find((r) => r.name.toLowerCase() === (sRoom.name || "").toLowerCase());
                    if (!targetRoom) {
                        const rRes = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: sRoom.name, description: sRoom.description }),
                        });
                        if (rRes.ok) {
                            const rData = await rRes.json();
                            targetRoom = rData.data;
                        }
                    }

                    if (targetRoom && Array.isArray(sRoom.categories)) {
                        for (const sCat of sRoom.categories) {
                            const cRes = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms/${targetRoom.id}/categories`, {
                                method: "POST",
                                credentials: "include",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: sCat.name || "General", description: sCat.description }),
                            });
                            if (cRes.ok) {
                                const cData = await cRes.json();
                                const catId = cData.data?.id;
                                if (catId && Array.isArray(sCat.items)) {
                                    for (const sItem of sCat.items) {
                                        await fetch(`/api/v1/boqs/${activeBoq.id}/categories/${catId}/items`, {
                                            method: "POST",
                                            credentials: "include",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                name: sItem.name,
                                                description: sItem.description,
                                                unit: sItem.unit || "Nos",
                                                quantity: sItem.quantity || 1,
                                                rate: sItem.rate || 0,
                                            }),
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                await handleLoadSampleDesignData();
                return;
            }

            setSuccessMsg(`Successfully applied ${template?.name || "template"} to BOQ!`);
            setTimeout(() => setSuccessMsg(""), 3500);
            setShowTemplateModal(false);
            void loadDetail();
        } catch (e) {
            setActionError(e instanceof Error ? e.message : "Failed to apply template");
        } finally {
            setImportingExcel(false);
        }
    };

    // Handle Excel file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportingExcel(true);
        setActionError("");

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (rows.length === 0) {
                throw new Error("No rows found in uploaded spreadsheet.");
            }

            for (const row of rows) {
                const roomName = String(row["Room"] || row["ROOM"] || row["room"] || "General Room").trim();
                const itemNameVal = String(row["Item"] || row["ITEM"] || row["Item Name"] || row["Description"] || "Item").trim();
                const specVal = String(row["Spec"] || row["SPEC"] || row["Specification"] || "").trim();
                const unitVal = String(row["Unit"] || row["UNIT"] || "No").trim();
                const qtyVal = Number(row["Quantity"] || row["QUANTITY"] || row["Qty"] || 1);
                const rateVal = Number(row["Rate"] || row["RATE"] || row["Rate (INR)"] || 1000);

                let roomObj = rooms.find((r) => r.name.toLowerCase() === roomName.toLowerCase());
                if (!roomObj) {
                    const rRes = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: roomName }),
                    });
                    if (rRes.ok) {
                        const rData = await rRes.json();
                        roomObj = rData.data;
                    }
                }

                if (roomObj) {
                    const cRes = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms/${roomObj.id}/categories`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: "Spreadsheet Import" }),
                    });
                    const cData = await cRes.json();
                    const catId = cData.data?.id;

                    if (catId) {
                        await fetch(`/api/v1/boqs/${activeBoq.id}/categories/${catId}/items`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: itemNameVal,
                                description: specVal || undefined,
                                unit: unitVal,
                                quantity: qtyVal > 0 ? qtyVal : 1,
                                rate: rateVal >= 0 ? rateVal : 1000,
                            }),
                        });
                    }
                }
            }

            setSuccessMsg(`Successfully imported ${rows.length} items from ${file.name}`);
            setTimeout(() => setSuccessMsg(""), 3500);
            setShowImportModal(false);
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to import Excel file");
        } finally {
            setImportingExcel(false);
        }
    };

    // Item aggregations with stable deduplication
    const allUniqueItems = useMemo(() => {
        const itemsMap = new Map<string, any>();
        for (const room of rooms) {
            for (const cat of (room.categories || [])) {
                for (const it of (cat.items || [])) {
                    if (it.id && !itemsMap.has(it.id)) {
                        itemsMap.set(it.id, it);
                    }
                }
            }
        }
        return Array.from(itemsMap.values());
    }, [rooms]);

    const totalItemCount = allUniqueItems.length;

    // Financial calculations matching design (18% markup and 18% GST)
    const computedItemsSubtotal = allUniqueItems.reduce((s: number, i: any) => {
        const amt = Number(i.amount);
        if (!isNaN(amt) && amt > 0) return s + amt;
        const q = Number(i.quantity) || 0;
        const r = Number(i.rate) || 0;
        return s + (q * r);
    }, 0);

    const computedSubtotal = computedItemsSubtotal > 0 ? computedItemsSubtotal : (boqData?.subtotal ?? activeBoq.estimatedValue ?? 0);
    const effectiveMarkupPercent = boqData?.markupPercent > 0 ? boqData.markupPercent : 18;
    const effectiveTaxPercent = boqData?.taxPercent > 0 ? boqData.taxPercent : 18;
    const computedMarkup = Math.round(computedSubtotal * (effectiveMarkupPercent / 100));
    const computedTax = Math.round((computedSubtotal + computedMarkup) * (effectiveTaxPercent / 100) * 100) / 100;
    const computedGrandTotal = computedSubtotal + computedMarkup + computedTax;

    const currentStatus = boqData?.status
        ? boqData.status.toUpperCase().replace(/_/g, " ")
        : activeBoq.status;

    // Filtered rooms
    const filteredRooms = useMemo(() => {
        if (!searchQuery.trim()) return rooms;
        const q = searchQuery.toLowerCase();
        return rooms.filter((r: any) => {
            const roomMatch = r.name.toLowerCase().includes(q);
            const itemMatch = (r.categories || []).some((c: any) =>
                (c.items || []).some((i: any) =>
                    i.name.toLowerCase().includes(q) ||
                    (i.description && i.description.toLowerCase().includes(q)) ||
                    (i.unit && i.unit.toLowerCase().includes(q))
                )
            );
            return roomMatch || itemMatch;
        });
    }, [rooms, searchQuery]);

    // Drill down into room categories view
    const selectedRoom = rooms.find((r: any) => r.id === selectedRoomId);
    if (selectedRoom) {
        return (
            <BoqRoomCategoryView
                key={selectedRoom.id}
                activeBoq={activeBoq}
                room={selectedRoom}
                onBackToBoq={() => setSelectedRoomId(null)}
                onBackToList={onBack}
                onRefreshBoq={loadDetail}
            />
        );
    }

    return (
        <section className="boq-detail-shell-redesign">
            {/* Breadcrumb (Frame 240) */}
            <nav className="boq-detail-breadcrumb-redesign" aria-label="Breadcrumb">
                <button
                    type="button"
                    onClick={onBack}
                    className="boq-breadcrumb-parent-link"
                >
                    Bill of Quantities
                </button>
                <div className="boq-breadcrumb-chevron">
                    <ChevronRight size={18} />
                </div>
                <span className="boq-breadcrumb-current-id">{activeBoq.boqNumber}</span>

            </nav>

            {/* Header Row: Identity (Left) & Actions (Right) (Frame 2147225066) */}
            <div className="boq-detail-identity-row-redesign">
                <div className="boq-detail-identity-left">
                    <button
                        type="button"
                        className="boq-detail-back-arrow-btn"
                        onClick={onBack}
                        aria-label="Back to BOQ list"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="boq-detail-identity-stack">
                        <div className="boq-detail-identity-top-line">
                            <h1 className="boq-detail-heading-boq-id">{activeBoq.boqNumber}</h1>
                            <span
                                className={`boq-detail-status-pill-redesign ${currentStatus.toLowerCase().replace(/\s/g, "-")}`}
                            >
                                {currentStatus}
                            </span>
                        </div>
                        <p className="boq-detail-project-version-sub">
                            {boqData?.projectName || activeBoq.projectName} — {activeBoq.version}
                        </p>
                    </div>
                </div>

                {/* Right Actions: History, Create Revision, Duplicate, Export PDF, Send for Review, Save Draft (Frame 2147225069) */}
                <div className="boq-detail-actions-right">
                    <button
                        type="button"
                        className="boq-detail-btn-action-ghost"
                        onClick={() => setShowHistoryModal(true)}
                        title="View revision history and immutable snapshots"
                    >
                        <History size={15} style={{ marginRight: "4px" }} />
                        <span>History ({activeBoq.version || "v1"})</span>
                    </button>
                    <button
                        type="button"
                        className="boq-detail-btn-action-ghost"
                        onClick={async () => {
                            try {
                                const r = await fetch(`/api/v1/boqs/${activeBoq.id}/revisions`, {
                                    method: "POST",
                                    credentials: "include",
                                });
                                if (!r.ok) {
                                    const p = await r.json().catch(() => ({}));
                                    throw new Error(getApiErrorMessage(p));
                                }
                                const data = await r.json();
                                setSuccessMsg(`Revision ${data.data?.version || "created"} saved!`);
                                setTimeout(() => setSuccessMsg(""), 3500);
                                void loadDetail();
                            } catch (err) {
                                setActionError(err instanceof Error ? err.message : "Failed to create revision");
                            }
                        }}
                        title="Create a new minor revision (e.g. v1.1) from this BOQ without mutating current version"
                    >
                        <span>Create Revision</span>
                    </button>
                    <button
                        type="button"
                        className="boq-detail-btn-action-ghost"
                        onClick={handleDuplicate}
                    >
                        Duplicate
                    </button>
                    <button
                        type="button"
                        className="boq-detail-btn-action-ghost"
                        onClick={() => window.open(`/api/v1/boqs/${activeBoq.id}/pdf`, "_blank")}
                    >
                        Export PDF
                    </button>
                    <button
                        type="button"
                        className="boq-detail-btn-action-ghost"
                        onClick={() => handleStatusChange("in_review")}
                    >
                        Send for Review
                    </button>
                    <button
                        type="button"
                        className="boq-detail-btn-action-save"
                        onClick={() => handleStatusChange("draft")}
                    >
                        Save Draft
                    </button>
                </div>
            </div>

            {/* Feedback Banners */}
            {actionError && (
                <div className="boq-alert-redesign">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <AlertCircle size={18} />
                        <span>{actionError}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setActionError("")}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {successMsg && (
                <div
                    className="boq-alert-redesign"
                    style={{ background: "#F0FDF4", borderColor: "#BBF7D0", color: "#166534" }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <CheckCircle2 size={18} />
                        <span>{successMsg}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSuccessMsg("")}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Main Two-Column Layout (Frame 2147225084) */}
            <div className="boq-detail-two-column-layout">
                {/* Left Column: Rooms & Items (Frame 2147225085) */}
                <div className="boq-detail-left-content">
                    {/* Rooms Toolbar (Frame 2147225066) */}
                    <div className="boq-rooms-toolbar-row">
                        <span className="boq-room-count-title-tag">{rooms.length} Rooms</span>

                        <div className="boq-rooms-controls-right">
                            {/* Search Box (Frame 76) */}
                            <label className="boq-rooms-search-box">
                                <div className="boq-rooms-search-icon-tile">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    className="boq-rooms-search-input"
                                    placeholder="Search…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    aria-label="Search rooms and items"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </label>

                            <button
                                type="button"
                                className="boq-btn-toolbar-import"
                                onClick={() => setShowImportModal(true)}
                            >
                                <FileSpreadsheet size={16} />
                                <span>Import Excel</span>
                            </button>

                            <button
                                type="button"
                                className="boq-btn-toolbar-template"
                                onClick={() => setShowTemplateModal(true)}
                            >
                                <FileText size={16} />
                                <span>Use Template</span>
                            </button>

                            <button
                                type="button"
                                className="boq-btn-toolbar-add-room"
                                onClick={() => setAddingRoom(true)}
                            >
                                <span>Add Room</span>
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Inline Add Room form */}
                    {addingRoom && (
                        <div
                            style={{
                                display: "flex",
                                gap: "8px",
                                padding: "12px 16px",
                                background: "#FFFFFF",
                                borderRadius: "8px",
                                border: "1px solid #CBD5E1",
                                width: "100%",
                                boxSizing: "border-box",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.03)",
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Room name (e.g. Master Bedroom, Living Room, Kitchen...)"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddRoom()}
                                style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    border: "1px solid #D1D5DB",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    outline: "none",
                                }}
                                autoFocus
                            />
                            <button
                                type="button"
                                className="boq-btn-toolbar-add-room"
                                onClick={() => handleAddRoom()}
                                style={{ height: "38px", padding: "8px 18px" }}
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                className="boq-btn-toolbar-import"
                                onClick={() => {
                                    setAddingRoom(false);
                                    setNewRoomName("");
                                }}
                                style={{ height: "38px", padding: "8px 16px" }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Rooms Table Surface (Frame 2147225072) */}
                    <div className="boq-rooms-table-surface">
                        <div className="boq-rooms-table-scrollable">
                            <div className="boq-rooms-table-inner">
                                {/* Table Header (Frame 57) */}
                                <div className="boq-rooms-thead-row">
                                    <div className="boq-rooms-th-cell boq-room-col-idx">#</div>
                                    <div className="boq-rooms-th-cell boq-room-col-name">ROOM</div>
                                    <div className="boq-rooms-th-cell boq-room-col-category">CATEGORY</div>
                                    <div className="boq-rooms-th-cell boq-room-col-spec">SPEC</div>
                                    <div className="boq-rooms-th-cell boq-room-col-unit">UNIT</div>
                                    <div className="boq-rooms-th-cell boq-room-col-items">ITEMS</div>
                                    <div className="boq-rooms-th-cell boq-room-col-amount">AMOUNT (₹)</div>
                                    <div className="boq-rooms-th-cell boq-room-col-desc">DESCRIPTION</div>
                                    <div className="boq-rooms-th-cell boq-room-col-actions"></div>
                                </div>

                                {/* Table Body Rows */}
                                {loading ? (
                                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748B" }}>
                                        Loading rooms & items…
                                    </div>
                                ) : filteredRooms.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "48px 20px" }}>
                                        <p style={{ color: "#0F172A", fontWeight: 600, fontSize: "16px", margin: "0 0 6px" }}>
                                            {rooms.length === 0 ? "No rooms in this BOQ yet." : "No rooms match your search query."}
                                        </p>
                                        <p style={{ color: "#64748B", fontSize: "14px", margin: "0 0 16px" }}>
                                            {rooms.length === 0
                                                ? "Click 'Add Room' or 'Import Excel' to start populating rooms and quantities."
                                                : "Try searching with a different room name or line item."}
                                        </p>
                                        {rooms.length === 0 ? (
                                            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                                                <button
                                                    type="button"
                                                    className="boq-btn-toolbar-add-room"
                                                    onClick={() => setAddingRoom(true)}
                                                >
                                                    Add Room +
                                                </button>
                                                <button
                                                    type="button"
                                                    className="boq-btn-toolbar-import"
                                                    onClick={() => handleLoadSampleDesignData()}
                                                >
                                                    Load 8-Room Interior Package
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className="boq-btn-toolbar-import"
                                                onClick={() => setSearchQuery("")}
                                            >
                                                Clear Search
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    filteredRooms.map((room, idx) => {
                                        const pres = getRoomPresentation(room);

                                        return (
                                            <div
                                                key={room.id}
                                                className="boq-rooms-tr-row"
                                                onClick={() => setSelectedRoomId(room.id)}
                                            >
                                                <div className="boq-rooms-td-cell boq-room-col-idx">
                                                    {idx + 1}
                                                </div>
                                                <div className="boq-rooms-td-cell boq-room-col-name room-name">
                                                    {room.name}
                                                </div>
                                                <div className="boq-rooms-td-cell boq-room-col-category category-count">
                                                    {pres.categoryCount}
                                                </div>
                                                <div className="boq-rooms-td-cell boq-room-col-spec">
                                                    {pres.spec}
                                                </div>
                                                <div className="boq-rooms-td-cell boq-room-col-unit">
                                                    {pres.unit}
                                                </div>
                                                <div className="boq-rooms-td-cell boq-room-col-items items-count">
                                                    {pres.itemCount > 0 ? pres.itemCount : "-"}
                                                </div>
                                                <div className="boq-rooms-td-cell boq-room-col-amount amount">
                                                    {pres.roomAmount > 0
                                                        ? formatFullIndianCurrency(pres.roomAmount)
                                                        : (pres.itemCount > 0 ? "₹0" : "-")}
                                                </div>
                                                <div
                                                    className="boq-rooms-td-cell boq-room-col-desc description-cell"
                                                    title={pres.fullTooltip}
                                                >
                                                    {pres.displayDesc}
                                                </div>
                                                <div
                                                    className="boq-rooms-td-cell boq-room-col-actions"
                                                    style={{ position: "relative" }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        className="boq-room-row-action-btn"
                                                        aria-label="Room actions"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenRowMenuId(openRowMenuId === room.id ? null : room.id);
                                                        }}
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>

                                                    {openRowMenuId === room.id && (
                                                        <div
                                                            className="boq-action-dropdown-menu"
                                                            style={{
                                                                position: "absolute",
                                                                top: "40px",
                                                                right: "0px",
                                                                zIndex: 40,
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                type="button"
                                                                className="boq-action-dropdown-item"
                                                                onClick={() => {
                                                                    setOpenRowMenuId(null);
                                                                    setSelectedRoomId(room.id);
                                                                }}
                                                            >
                                                                <Eye size={15} />
                                                                <span>View Room</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="boq-action-dropdown-item"
                                                                onClick={() => {
                                                                    setOpenRowMenuId(null);
                                                                    setSelectedRoomForItems(room);
                                                                }}
                                                            >
                                                                <Plus size={15} />
                                                                <span>Manage Items</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="boq-action-dropdown-item"
                                                                onClick={() => {
                                                                    setOpenRowMenuId(null);
                                                                    setEditingRoomId(room.id);
                                                                    setEditRoomName(room.name);
                                                                }}
                                                            >
                                                                <Edit2 size={15} />
                                                                <span>Rename Room</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="boq-action-dropdown-item"
                                                                onClick={() => {
                                                                    setOpenRowMenuId(null);
                                                                    void handleDuplicateRoom(room.id);
                                                                }}
                                                            >
                                                                <Copy size={15} />
                                                                <span>Duplicate Room</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="boq-action-dropdown-item"
                                                                style={{ color: "#DC2626" }}
                                                                onClick={() => {
                                                                    setOpenRowMenuId(null);
                                                                    void handleDeleteRoom(room.id);
                                                                }}
                                                            >
                                                                <Trash2 size={15} />
                                                                <span>Delete Room</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Summary Panel (Frame 2147225071) */}
                <aside className="boq-detail-summary-panel-redesign">
                    <h3 className="boq-summary-heading-label">SUMMARY</h3>
                    <div className="boq-summary-horizontal-divider" />

                    {/* Financial Breakdown (Frame 2147225075) */}
                    <div className="boq-summary-breakdown-box">
                        <div className="boq-summary-financial-row">
                            <span className="label">Subtotal</span>
                            <span className="val">{formatFullIndianCurrency(computedSubtotal)}</span>
                        </div>
                        <div className="boq-summary-financial-row">
                            <span className="label">Markup ({effectiveMarkupPercent}%)</span>
                            <span className="val">{formatFullIndianCurrency(computedMarkup)}</span>
                        </div>
                        <div className="boq-summary-financial-row">
                            <span className="label">GST ({effectiveTaxPercent}%)</span>
                            <span className="val">{formatFullIndianCurrency(computedTax, true)}</span>
                        </div>
                        <div className="boq-summary-horizontal-divider" style={{ margin: "4px 0" }} />
                        <div className="boq-summary-financial-row grand-total">
                            <span className="label">Grand Total</span>
                            <span className="val">{formatFullIndianCurrency(computedGrandTotal, true)}</span>
                        </div>
                    </div>

                    {/* Stat Cards (Frame 2147225090) */}
                    <div className="boq-summary-stat-cards-wrap">
                        {/* Rooms Covered Card (Frame 2147225089) */}
                        <div className="boq-summary-stat-box">
                            <span className="boq-summary-stat-box-label">Rooms Covered</span>
                            <span className="boq-summary-stat-box-value">{rooms.length}</span>
                        </div>

                        {/* Items Card (Frame 2147225087) */}
                        <div className="boq-summary-stat-box">
                            <span className="boq-summary-stat-box-label">Items</span>
                            <span className="boq-summary-stat-box-value">{totalItemCount > 0 ? totalItemCount : "-"}</span>
                        </div>
                    </div>

                    {/* Generate Proposal CTA Button */}
                    <button
                        type="button"
                        className="boq-btn-generate-proposal-primary"
                        onClick={() => setShowProposalModal(true)}
                    >
                        Generate Proposal
                    </button>

                    {/* Compare Vendors (Figma: display none) */}
                    <button type="button" className="boq-btn-compare-vendors-secondary">
                        Compare Vendors
                    </button>
                </aside>
            </div>

            {/* In-Context Generate Proposal Modal (Does NOT redirect to proposals menu!) */}
            {showProposalModal && (
                <BoqGenerateProposalModal
                    isOpen={showProposalModal}
                    onClose={() => setShowProposalModal(false)}
                    boq={activeBoq}
                    boqData={boqData}
                    rooms={rooms}
                    grandTotal={computedGrandTotal}
                    onSuccess={(created) => {
                        setSuccessMsg(`Proposal ${created.proposalCode} generated successfully for ${created.clientName}!`);
                        setTimeout(() => setSuccessMsg(""), 5000);
                    }}
                />
            )}

            {/* Manage Room Items Modal */}
            {selectedRoomForItems && (
                <div className="boq-modal-backdrop" onClick={() => setSelectedRoomForItems(null)}>
                    <div
                        className="boq-items-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: "680px", width: "95%", background: "#FFFFFF", borderRadius: "10px", padding: "20px" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#0F172A" }}>
                                    {selectedRoomForItems.name} — Items & Specs
                                </h3>
                                <p style={{ color: "#64748B", fontSize: "13px", margin: "4px 0 0" }}>
                                    Manage line items, specifications, units, quantities, and rates for this room.
                                </p>
                            </div>
                            <button
                                type="button"
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
                                onClick={() => setSelectedRoomForItems(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Existing items table */}
                        <div style={{ maxHeight: "260px", overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: "8px", marginBottom: "18px" }}>
                            {((selectedRoomForItems.categories || []).flatMap((c: any) => c.items || [])).length === 0 ? (
                                <div style={{ padding: "24px", textAlign: "center", color: "#94A3B8" }}>
                                    No items in this room yet. Add your first item below.
                                </div>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ background: "#F8FAFC", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>
                                            <th style={{ padding: "8px 12px", color: "#475569" }}>Item Name</th>
                                            <th style={{ padding: "8px 12px", color: "#475569" }}>Specification</th>
                                            <th style={{ padding: "8px 12px", color: "#475569" }}>Unit</th>
                                            <th style={{ padding: "8px 12px", color: "#475569" }}>Qty</th>
                                            <th style={{ padding: "8px 12px", color: "#475569" }}>Rate</th>
                                            <th style={{ padding: "8px 12px", color: "#475569" }}>Amount</th>
                                            <th style={{ padding: "8px 12px", textAlign: "center" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(selectedRoomForItems.categories || []).flatMap((c: any) => c.items || []).map((it: any) => (
                                            <tr key={it.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{it.name}</td>
                                                <td style={{ padding: "8px 12px", color: "#64748B" }}>{it.description || "-"}</td>
                                                <td style={{ padding: "8px 12px" }}>{it.unit}</td>
                                                <td style={{ padding: "8px 12px" }}>{it.quantity}</td>
                                                <td style={{ padding: "8px 12px" }}>{formatFullIndianCurrency(it.rate)}</td>
                                                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{formatFullIndianCurrency(it.amount)}</td>
                                                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                                    <button
                                                        type="button"
                                                        style={{ background: "transparent", border: "none", color: "#EF4444", cursor: "pointer", padding: "4px" }}
                                                        onClick={() => handleDeleteItem(it.id)}
                                                        title="Delete item"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Add new item form */}
                        <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                            <strong style={{ fontSize: "14px", color: "#0F172A", display: "block", marginBottom: "12px" }}>
                                + Add New Item to {selectedRoomForItems.name}
                            </strong>
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1.2fr", gap: "10px", marginBottom: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>Item Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. King Bed"
                                        value={itemName}
                                        onChange={(e) => setItemName(e.target.value)}
                                        style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "13px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>Specification</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Custom, 6×6.5ft"
                                        value={itemSpec}
                                        onChange={(e) => setItemSpec(e.target.value)}
                                        style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "13px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>Unit</label>
                                    <select
                                        value={itemUnit}
                                        onChange={(e) => setItemUnit(e.target.value)}
                                        style={{ width: "100%", padding: "7px 6px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "13px" }}
                                    >
                                        <option value="No">No</option>
                                        <option value="Set">Set</option>
                                        <option value="Sqft">Sqft</option>
                                        <option value="RFt">RFt</option>
                                        <option value="L.S.">L.S.</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={itemQty}
                                        onChange={(e) => setItemQty(e.target.value)}
                                        style={{ width: "100%", padding: "7px 6px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "13px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>Rate (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={itemRate}
                                        onChange={(e) => setItemRate(e.target.value)}
                                        style={{ width: "100%", padding: "7px 8px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "13px" }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button
                                    type="button"
                                    className="boq-btn-toolbar-add-room"
                                    onClick={() => handleAddItem(selectedRoomForItems.id)}
                                    style={{ height: "36px", fontSize: "13px", padding: "6px 16px" }}
                                >
                                    Save Item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Excel Modal */}
            {showImportModal && (
                <div className="boq-modal-backdrop" onClick={() => setShowImportModal(false)}>
                    <div
                        className="boq-items-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: "560px", width: "95%", background: "#FFFFFF", borderRadius: "10px", padding: "24px" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#0F172A" }}>Import Excel Spreadsheet</h3>
                                <p style={{ color: "#64748B", fontSize: "13px", margin: "4px 0 0" }}>
                                    Upload an Excel (.xlsx / .xls) file or load pre-configured design rooms.
                                </p>
                            </div>
                            <button
                                type="button"
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
                                onClick={() => setShowImportModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* File Upload Box */}
                        <div
                            style={{
                                border: "2px dashed #CBD5E1",
                                borderRadius: "12px",
                                padding: "28px 20px",
                                textAlign: "center",
                                background: "#F8FAFC",
                                cursor: "pointer",
                                marginBottom: "16px",
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FileSpreadsheet size={36} color="#2563EB" style={{ margin: "0 auto 10px" }} />
                            <strong style={{ display: "block", color: "#0F172A", fontSize: "15px" }}>
                                {importingExcel ? "Processing spreadsheet…" : "Click to select Excel file"}
                            </strong>
                            <span style={{ color: "#64748B", fontSize: "13px" }}>Supports .xlsx, .xls, .csv with Room, Item, Qty, Rate</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                style={{ display: "none" }}
                                onChange={handleFileUpload}
                            />
                        </div>

                        <div style={{ textAlign: "center", margin: "16px 0 8px", position: "relative" }}>
                            <span style={{ background: "#FFFFFF", padding: "0 10px", color: "#94A3B8", fontSize: "12px", fontWeight: 600 }}>
                                OR ONE-CLICK PRESET
                            </span>
                        </div>

                        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <strong style={{ color: "#1E40AF", fontSize: "14px", display: "block" }}>
                                        8-Room Reference Interior Package
                                    </strong>
                                    <span style={{ color: "#3B82F6", fontSize: "12px" }}>
                                        Includes Master Bed, Bed 2/3, Living, Dining, Kitchen, Study, Guest Bed
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="boq-btn-toolbar-add-room"
                                    onClick={handleLoadSampleDesignData}
                                    disabled={importingExcel}
                                    style={{ height: "36px", fontSize: "13px", padding: "6px 16px" }}
                                >
                                    {importingExcel ? "Loading…" : "Load 8 Rooms"}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                className="boq-btn-toolbar-import"
                                onClick={() => setShowImportModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Use Template Drawer (Figma Frame 2147225093) */}
            <BoqTemplatesDrawer
                isOpen={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                templates={templatesList}
                onSelectTemplate={handleApplyTemplate}
                onCreateNewTemplate={() => window.location.assign("/templates/new")}
            />

            {/* Rename Room Modal */}
            {editingRoomId && (
                <div className="boq-modal-backdrop" onClick={() => setEditingRoomId(null)}>
                    <div
                        className="boq-items-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: "420px", width: "95%", background: "#FFFFFF", borderRadius: "10px", padding: "20px" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0F172A" }}>Rename Room</h3>
                            <button
                                type="button"
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
                                onClick={() => setEditingRoomId(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={editRoomName}
                            onChange={(e) => setEditRoomName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleEditRoom(editingRoomId)}
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "8px 12px",
                                border: "1px solid #CBD5E1",
                                borderRadius: "6px",
                                fontSize: "14px",
                                marginBottom: "14px",
                                outline: "none",
                            }}
                            autoFocus
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                            <button
                                type="button"
                                className="boq-btn-toolbar-import"
                                onClick={() => setEditingRoomId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="boq-btn-toolbar-add-room"
                                onClick={() => handleEditRoom(editingRoomId)}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Version History Modal */}
            <BoqVersionHistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                boqId={activeBoq.id}
                boqNumber={activeBoq.boqNumber}
                currentVersion={activeBoq.version}
                onSelectVersion={(ver) => {
                    void loadDetail();
                }}
                onRevisionCreated={() => {
                    void loadDetail();
                }}
            />
        </section>
    );
}
