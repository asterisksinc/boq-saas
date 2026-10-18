"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { X, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, UploadCloud } from "lucide-react";
import * as XLSX from "xlsx";
import { getApiErrorMessage } from "@/lib/api/auth";

interface ProjectOption {
    id: string;
    name: string;
}

interface BoqExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: ProjectOption[];
    onSuccess: () => void;
}

export default function BoqExcelImportModal({
    isOpen,
    onClose,
    projects,
    onSuccess,
}: BoqExcelImportModalProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "");
    const [version, setVersion] = useState("v1");
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState("");
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
    const [rowCount, setRowCount] = useState(0);

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync default project if not set
    React.useEffect(() => {
        if (!selectedProjectId && projects.length > 0) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

    if (!isOpen) return null;

    const resetState = () => {
        setFile(null);
        setFileName("");
        setSheetNames([]);
        setSelectedSheet("");
        setPreviewRows([]);
        setRowCount(0);
        setIsProcessing(false);
        setStatusMessage("");
        setErrorMessage("");
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileSelected = async (selectedFile: File) => {
        setErrorMessage("");
        setStatusMessage("");
        const ext = selectedFile.name.split(".").pop()?.toLowerCase();
        if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
            setErrorMessage("Please select a valid Excel (.xlsx, .xls) or CSV spreadsheet.");
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setErrorMessage("Spreadsheet file size cannot exceed 10 MB.");
            return;
        }

        try {
            const buffer = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            if (!workbook.SheetNames.length) {
                throw new Error("No worksheets found in spreadsheet.");
            }

            const defaultSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[defaultSheet];
            const jsonRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet);

            if (jsonRows.length === 0) {
                throw new Error("The worksheet does not contain any data rows.");
            }

            setFile(selectedFile);
            setFileName(selectedFile.name);
            setSheetNames(workbook.SheetNames);
            setSelectedSheet(defaultSheet);
            setPreviewRows(jsonRows.slice(0, 5));
            setRowCount(jsonRows.length);
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to parse spreadsheet.");
            setFile(null);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) void handleFileSelected(f);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) void handleFileSelected(f);
    };

    const handleImportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setStatusMessage("");

        const projId = selectedProjectId || projects[0]?.id;
        if (!projId) {
            setErrorMessage("Please select an active project for this BOQ.");
            return;
        }

        if (!file) {
            setErrorMessage("Please select a spreadsheet file to import.");
            return;
        }

        setIsProcessing(true);
        setStatusMessage("Creating BOQ and importing items...");

        try {
            // 1. Create a blank BOQ for the project
            const createRes = await fetch("/api/v1/boqs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: projId,
                    version: version.trim() || "v1",
                    method: "blank",
                }),
                credentials: "include",
            });

            if (!createRes.ok) {
                const errPayload = await createRes.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(errPayload) || "Failed to create BOQ.");
            }

            const createdData = await createRes.json();
            const newBoq = createdData.data;
            const boqId = newBoq?.id;

            // 2. Upload file to backend BOQ import endpoint for record preservation
            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("projectId", projId);
                if (selectedSheet) formData.append("sheet", selectedSheet);

                await fetch("/api/v1/boq-imports/upload", {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                });
            } catch {
                // Secondary record tracking, continue with item insertion
            }

            // 3. Parse spreadsheet and insert rooms and items into the created BOQ
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheet = workbook.Sheets[selectedSheet || workbook.SheetNames[0]];
            const rows: any[] = XLSX.utils.sheet_to_json(sheet);

            if (boqId && rows.length > 0) {
                const roomMap = new Map<string, string>();
                const categoryMap = new Map<string, string>();
                const subcategoryMap = new Map<string, { id: string; name: string }>();

                for (const row of rows) {
                    const roomName = String(
                        row["Room"] || row["ROOM"] || row["room"] || row["Room Name"] || "General Area"
                    ).trim();
                    const categoryName = String(
                        row["Category"] || row["CATEGORY"] || row["category"] || row["Category Name"] || "Primary Fitout"
                    ).trim();
                    const subcategoryName = String(
                        row["Subcategory"] || row["SUBCATEGORY"] || row["subcategory"] || row["Sub Category"] || row["Sub-Category"] || row["Subcategory Name"] || ""
                    ).trim();
                    const itemName = String(
                        row["Item"] || row["ITEM"] || row["Item Name"] || row["Description"] || "Fitting & Fixture"
                    ).trim();
                    const spec = String(row["Spec"] || row["SPEC"] || row["Specification"] || row["Description"] || "").trim();
                    const unit = String(row["Unit"] || row["UNIT"] || "Nos").trim();
                    const qty = Number(row["Quantity"] || row["QUANTITY"] || row["Qty"] || 1) || 1;
                    const rate = Number(row["Rate"] || row["RATE"] || row["Rate (INR)"] || 1000) || 1000;
                    const waste = Number(row["Waste"] || row["WASTE"] || row["Waste (%)"] || row["wastePercent"] || 0) || 0;
                    const tax = Number(row["Tax"] || row["TAX"] || row["Tax (%)"] || row["taxPercent"] || 18) || 18;

                    let roomId = roomMap.get(roomName.toLowerCase());
                    if (!roomId) {
                        const rRes = await fetch(`/api/v1/boqs/${boqId}/rooms`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: roomName }),
                        });
                        if (rRes.ok) {
                            const rData = await rRes.json();
                            roomId = rData.data?.id;
                            if (roomId) roomMap.set(roomName.toLowerCase(), roomId);
                        }
                    }

                    if (roomId) {
                        const catKey = `${roomId}:${categoryName.toLowerCase()}`;
                        let catId = categoryMap.get(catKey);
                        if (!catId) {
                            const cRes = await fetch(`/api/v1/boqs/${boqId}/rooms/${roomId}/categories`, {
                                method: "POST",
                                credentials: "include",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: categoryName }),
                            });
                            if (cRes.ok) {
                                const cData = await cRes.json();
                                catId = cData.data?.id;
                                if (catId) categoryMap.set(catKey, catId);
                            }
                        }

                        if (catId) {
                            let subcatId: string | undefined = undefined;
                            let subcatName: string | undefined = undefined;

                            if (subcategoryName) {
                                const subKey = `${catId}:${subcategoryName.toLowerCase()}`;
                                const existingSub = subcategoryMap.get(subKey);
                                if (existingSub) {
                                    subcatId = existingSub.id;
                                    subcatName = existingSub.name;
                                } else {
                                    const sRes = await fetch(`/api/v1/boqs/${boqId}/categories/${catId}/subcategories`, {
                                        method: "POST",
                                        credentials: "include",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ name: subcategoryName }),
                                    });
                                    if (sRes.ok) {
                                        const sData = await sRes.json();
                                        if (sData.data?.id) {
                                            const createdId = String(sData.data.id);
                                            const createdName = String(sData.data.name || subcategoryName);
                                            subcatId = createdId;
                                            subcatName = createdName;
                                            subcategoryMap.set(subKey, { id: createdId, name: createdName });
                                        }
                                    }
                                }
                            }

                            await fetch(`/api/v1/boqs/${boqId}/categories/${catId}/items`, {
                                method: "POST",
                                credentials: "include",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    name: itemName,
                                    description: spec,
                                    unit,
                                    quantity: qty,
                                    rate,
                                    wastePercent: waste,
                                    taxPercent: tax,
                                    subcategoryId: subcatId,
                                    subcategoryName: subcatName,
                                }),
                            });
                        }
                    }
                }
            }

            setStatusMessage("BOQ successfully imported!");
            setTimeout(() => {
                handleClose();
                onSuccess();
            }, 500);
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to import Excel spreadsheet.");
        } finally {
            setIsProcessing(false);
        }
    };

    // One-click sample import preset for demo convenience
    const handleOneClickPreset = async () => {
        const projId = selectedProjectId || projects[0]?.id;
        if (!projId) {
            setErrorMessage("Please select an active project first.");
            return;
        }

        setIsProcessing(true);
        setStatusMessage("Loading 8-Room reference interior package...");
        setErrorMessage("");

        try {
            const createRes = await fetch("/api/v1/boqs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: projId,
                    version: "v1",
                    method: "blank",
                }),
                credentials: "include",
            });

            if (!createRes.ok) {
                const errPayload = await createRes.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(errPayload) || "Failed to create BOQ.");
            }

            const createdData = await createRes.json();
            const boqId = createdData.data?.id;

            if (boqId) {
                const sampleData = [
                    // Master Bedroom -> Furniture (8 items matching Figma specification)
                    { room: "Master Bedroom", category: "Furniture", subcategory: "Wardrobes", name: "Full Height Wardrobe", spec: "19mm BWP ply. laminate finish", unit: "Sq.ft", qty: 72, rate: 2875, waste: 5, tax: 18 },
                    { room: "Master Bedroom", category: "Furniture", subcategory: "Beds", name: "Kind Size Bed", spec: "Upholstered headboard", unit: "Nos", qty: 1, rate: 45800, waste: 0, tax: 18 },
                    { room: "Master Bedroom", category: "Furniture", subcategory: "Side Tables", name: "Side Table", spec: "600mm W, laminate finish", unit: "Nos", qty: 2, rate: 6250, waste: 5, tax: 18 },
                    { room: "Master Bedroom", category: "Furniture", subcategory: "Dressing Units", name: "Dressing Table", spec: "With mirror and drawers", unit: "Nos", qty: 1, rate: 24500, waste: 5, tax: 18 },
                    { room: "Master Bedroom", category: "Furniture", subcategory: "Study Units", name: "Study Table", spec: "Laminate top with storage", unit: "Nos", qty: 1, rate: 18750, waste: 5, tax: 18 },
                    { room: "Master Bedroom", category: "Furniture", subcategory: "TV Units", name: "TV Unit", spec: "Floating unit, laminate finish", unit: "Sq.ft", qty: 18, rate: 2650, waste: 5, tax: 18 },
                    { room: "Master Bedroom", category: "Furniture", subcategory: "Storage Units", name: "Chest of Drawers", spec: "4 drawer unit", unit: "Nos", qty: 1, rate: 16500, waste: 5, tax: 18 },
                    { room: "Master Bedroom", category: "Furniture", subcategory: "Mirrors", name: "Mirror with Frame", spec: "900mm x 1200mm", unit: "Nos", qty: 1, rate: 7250, waste: 0, tax: 18 },
                    // Master Bedroom -> Painting & Electrical categories
                    { room: "Master Bedroom", category: "Painting", subcategory: "Wall Finishing", name: "Interior Wall Paint", spec: "Premium acrylic emulsion", unit: "Sq.ft", qty: 450, rate: 45, waste: 5, tax: 18 },
                    { room: "Master Bedroom", category: "Electrical", subcategory: "Lighting", name: "Ceiling Concealed Light", spec: "12W LED warm white", unit: "Nos", qty: 8, rate: 850, waste: 0, tax: 18 },
                    // Additional Rooms
                    { room: "Bedroom 02", category: "Furniture", subcategory: "Side Tables", name: "Bedside Tables - Pair with Soft-Close", spec: "Custom, 18×24in", unit: "Set", qty: 15, rate: 2800, waste: 0, tax: 18 },
                    { room: "Bedroom 03", category: "Furniture", subcategory: "Side Tables", name: "Bedside Tables - Pair with Soft-Close", spec: "Custom, 18×24in", unit: "Set", qty: 20, rate: 2100, waste: 0, tax: 18 },
                    { room: "Living Room", category: "Furniture", subcategory: "Wardrobes", name: "Sliding Wardrobe 3-Panel Mirror Finish", spec: "MDF + PU Lacquer", unit: "RFt", qty: 10, rate: 12500, waste: 0, tax: 18 },
                    { room: "Dining Room", category: "Flooring", subcategory: "Stone", name: "Italian Marble 600×600mm Bianco Carrara", spec: "18mm thick, honed", unit: "Sqft", qty: 320, rate: 480, waste: 5, tax: 18 },
                    { room: "Kitchen", category: "Ceiling", subcategory: "Gypsum", name: "False Ceiling - Gypsum Board with Cove Lighting", spec: "Double layer GRP", unit: "No", qty: 24, rate: 3300, waste: 5, tax: 18 },
                    { room: "Study Room", category: "Furniture", subcategory: "Desks", name: "Modular Desk with Cable Management", spec: "Oak Veneer", unit: "No", qty: 2, rate: 18500, waste: 0, tax: 18 },
                    { room: "Guest Bedroom", category: "Furniture", subcategory: "Beds", name: "Queen Bed with Storage", spec: "Fabric Upholstered", unit: "No", qty: 1, rate: 38000, waste: 0, tax: 18 },
                ];

                const roomMap = new Map<string, string>();
                const categoryMap = new Map<string, string>();
                const subcategoryMap = new Map<string, { id: string; name: string }>();

                for (const sample of sampleData) {
                    let roomId = roomMap.get(sample.room.toLowerCase());
                    if (!roomId) {
                        const rRes = await fetch(`/api/v1/boqs/${boqId}/rooms`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: sample.room }),
                        });
                        if (rRes.ok) {
                            const rData = await rRes.json();
                            roomId = rData.data?.id;
                            if (roomId) roomMap.set(sample.room.toLowerCase(), roomId);
                        }
                    }

                    if (roomId) {
                        const catKey = `${roomId}:${sample.category.toLowerCase()}`;
                        let catId = categoryMap.get(catKey);
                        if (!catId) {
                            const cRes = await fetch(`/api/v1/boqs/${boqId}/rooms/${roomId}/categories`, {
                                method: "POST",
                                credentials: "include",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: sample.category }),
                            });
                            if (cRes.ok) {
                                const cData = await cRes.json();
                                catId = cData.data?.id;
                                if (catId) categoryMap.set(catKey, catId);
                            }
                        }

                        if (catId) {
                            let subcatId: string | undefined = undefined;
                            let subcatName: string | undefined = undefined;

                            if (sample.subcategory) {
                                const subKey = `${catId}:${sample.subcategory.toLowerCase()}`;
                                const existingSub = subcategoryMap.get(subKey);
                                if (existingSub) {
                                    subcatId = existingSub.id;
                                    subcatName = existingSub.name;
                                } else {
                                    const sRes = await fetch(`/api/v1/boqs/${boqId}/categories/${catId}/subcategories`, {
                                        method: "POST",
                                        credentials: "include",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ name: sample.subcategory }),
                                    });
                                    if (sRes.ok) {
                                        const sData = await sRes.json();
                                        if (sData.data?.id) {
                                            const createdId = String(sData.data.id);
                                            const createdName = String(sData.data.name || sample.subcategory);
                                            subcatId = createdId;
                                            subcatName = createdName;
                                            subcategoryMap.set(subKey, { id: createdId, name: createdName });
                                        }
                                    }
                                }
                            }

                            await fetch(`/api/v1/boqs/${boqId}/categories/${catId}/items`, {
                                method: "POST",
                                credentials: "include",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    name: sample.name,
                                    description: sample.spec,
                                    unit: sample.unit,
                                    quantity: sample.qty,
                                    rate: sample.rate,
                                    wastePercent: sample.waste ?? 0,
                                    taxPercent: sample.tax ?? 18,
                                    subcategoryId: subcatId,
                                    subcategoryName: subcatName,
                                }),
                            });
                        }
                    }
                }
            }

            setStatusMessage("Sample 8-Room BOQ successfully created!");
            setTimeout(() => {
                handleClose();
                onSuccess();
            }, 500);
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to load sample data.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="boq-modal-backdrop" onClick={handleClose}>
            <div
                className="boq-create-modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "560px", width: "100%" }}
            >
                <div className="boq-create-header">
                    <div>
                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#0F172A", fontFamily: "'Urbanist', sans-serif" }}>
                            Import Excel Spreadsheet
                        </h3>
                        <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748B", fontFamily: "'Urbanist', sans-serif" }}>
                            Upload a Bill of Quantities spreadsheet (.xlsx, .xls, .csv)
                        </p>
                    </div>
                    <button type="button" className="boq-close-button" onClick={handleClose} aria-label="Close dialog">
                        <X size={18} />
                    </button>
                </div>

                {errorMessage && (
                    <div
                        style={{
                            background: "#FEF2F2",
                            border: "1px solid #FCA5A5",
                            color: "#991B1B",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "16px",
                        }}
                    >
                        <AlertCircle size={16} />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {statusMessage && (
                    <div
                        style={{
                            background: "#F0FDF4",
                            border: "1px solid #86EFAC",
                            color: "#166534",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "16px",
                        }}
                    >
                        <CheckCircle2 size={16} />
                        <span>{statusMessage}</span>
                    </div>
                )}

                <form onSubmit={handleImportSubmit}>
                    {/* Project & Version Selection */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: "12px", marginBottom: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#0F172A", marginBottom: "6px" }}>
                                Target Project *
                            </label>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                style={{
                                    width: "100%",
                                    height: "42px",
                                    padding: "0 12px",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "6px",
                                    background: "#FFFFFF",
                                    fontFamily: "'Urbanist', sans-serif",
                                    fontSize: "14px",
                                    color: "#0F172A",
                                    outline: "none",
                                }}
                            >
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#0F172A", marginBottom: "6px" }}>
                                Version
                            </label>
                            <input
                                type="text"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                placeholder="v1"
                                style={{
                                    width: "100%",
                                    height: "42px",
                                    padding: "0 12px",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "6px",
                                    fontFamily: "'Urbanist', sans-serif",
                                    fontSize: "14px",
                                    color: "#0F172A",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                    </div>

                    {/* Drag and drop upload box */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: file ? "2px solid #2563EB" : "2px dashed #CBD5E1",
                            borderRadius: "8px",
                            padding: "24px 16px",
                            textAlign: "center",
                            background: file ? "#EFF6FF" : "#F8FAFC",
                            cursor: "pointer",
                            marginBottom: "16px",
                            transition: "all 0.15s ease",
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                        {file ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                                <FileSpreadsheet size={36} color="#2563EB" />
                                <strong style={{ color: "#0F172A", fontSize: "14px" }}>{fileName}</strong>
                                <span style={{ color: "#64748B", fontSize: "12px" }}>
                                    {rowCount} rows parsed • Ready to import
                                </span>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                                <UploadCloud size={36} color="#64748B" />
                                <strong style={{ color: "#0F172A", fontSize: "14px" }}>
                                    Click to select or drag and drop Excel file
                                </strong>
                                <span style={{ color: "#64748B", fontSize: "12px" }}>
                                    Supports .xlsx, .xls, .csv files (max 10 MB)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Preview summary */}
                    {previewRows.length > 0 && (
                        <div
                            style={{
                                background: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                borderRadius: "6px",
                                padding: "10px 12px",
                                marginBottom: "16px",
                                fontSize: "12px",
                                color: "#475569",
                            }}
                        >
                            <span style={{ fontWeight: 600, color: "#0F172A" }}>Detected Preview: </span>
                            {rowCount} line items across worksheets. Columns will be mapped to Room, Item, Quantity & Rate.
                        </div>
                    )}

                    {/* One-click preset option */}
                    <div
                        style={{
                            background: "#F1F5F9",
                            border: "1px solid #E2E8F0",
                            borderRadius: "6px",
                            padding: "12px 14px",
                            marginBottom: "20px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <strong style={{ display: "block", fontSize: "13px", color: "#0F172A" }}>
                                Need sample data?
                            </strong>
                            <span style={{ fontSize: "12px", color: "#64748B" }}>
                                Load 8-Room reference interior fit-out package
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleOneClickPreset}
                            disabled={isProcessing}
                            style={{
                                padding: "6px 14px",
                                background: "#FFFFFF",
                                border: "1px solid #CBD5E1",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#2563EB",
                                cursor: "pointer",
                            }}
                        >
                            Load 8 Rooms
                        </button>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isProcessing}
                            style={{
                                height: "42px",
                                padding: "0 18px",
                                border: "1px solid #CBD5E1",
                                borderRadius: "6px",
                                background: "#FFFFFF",
                                color: "#475569",
                                fontWeight: 600,
                                fontSize: "14px",
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isProcessing || !file}
                            style={{
                                height: "42px",
                                padding: "0 20px",
                                border: "none",
                                borderRadius: "6px",
                                background: isProcessing || !file ? "#93C5FD" : "#2563EB",
                                color: "#FFFFFF",
                                fontWeight: 600,
                                fontSize: "14px",
                                cursor: isProcessing || !file ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            {isProcessing && <Loader2 size={16} className="animate-spin" />}
                            <span>{isProcessing ? "Importing..." : "Import BOQ"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
