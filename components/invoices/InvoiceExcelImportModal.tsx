"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { X, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, UploadCloud, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { createInvoice } from "@/lib/api/invoices";

interface InvoiceExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ParsedInvoiceRow {
    clientName: string;
    projectName: string;
    invoiceNumber?: string;
    type?: string;
    milestone?: string;
    amount?: number;
    issueDate?: string;
    dueDate?: string;
    description?: string;
    rate?: number;
    quantity?: number;
    taxRate?: number;
    reference?: string;
    notes?: string;
    status?: "draft" | "pending";
}

export default function InvoiceExcelImportModal({
    isOpen,
    onClose,
    onSuccess,
}: InvoiceExcelImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState("");
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [previewRows, setPreviewRows] = useState<ParsedInvoiceRow[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [rowCount, setRowCount] = useState(0);

    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successCount, setSuccessCount] = useState<number | null>(null);
    const [importLog, setImportLog] = useState<{ successes: number; errors: string[] } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFile = async (selectedFile: File) => {
        setError(null);
        setSuccessCount(null);
        setImportLog(null);
        const ext = selectedFile.name.split(".").pop()?.toLowerCase();
        if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
            setError("Please select a valid Excel (.xlsx, .xls) or CSV file.");
            return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError("File size exceeds 10 MB limit.");
            return;
        }

        try {
            setLoading(true);
            const buffer = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            if (!workbook.SheetNames.length) {
                throw new Error("No worksheets found in spreadsheet.");
            }

            const defaultSheet = workbook.SheetNames[0];
            setSheetNames(workbook.SheetNames);
            setSelectedSheet(defaultSheet);
            setFile(selectedFile);
            setFileName(selectedFile.name);

            parseSheetData(workbook, defaultSheet);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to parse file.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const parseSheetData = (workbook: XLSX.WorkBook, sheetName: string) => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return;

        const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        if (!rawData.length) {
            setError("The selected worksheet contains no data rows.");
            setPreviewRows([]);
            setColumns([]);
            setRowCount(0);
            return;
        }

        const cols = Object.keys(rawData[0]);
        setColumns(cols);
        setRowCount(rawData.length);

        // Normalize column keys
        const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, "");

        const parsed: ParsedInvoiceRow[] = rawData.map((row) => {
            const getVal = (possibleKeys: string[]): string => {
                for (const pk of possibleKeys) {
                    const normPk = normalizeKey(pk);
                    for (const [k, v] of Object.entries(row)) {
                        if (normalizeKey(k) === normPk && v !== undefined && v !== "") {
                            return String(v).trim();
                        }
                    }
                }
                return "";
            };

            const client = getVal(["client", "clientname", "customer", "customername"]);
            const project = getVal(["project", "projectname", "job", "jobname"]);
            const invNum = getVal(["invoicenumber", "invoiceid", "code", "invoiceno", "invno", "number"]);
            const milestone = getVal(["milestone", "stage", "phase"]);
            const amountStr = getVal(["amount", "total", "totalamount", "value", "price", "rate"]);
            const issueStr = getVal(["issuedate", "issue", "issued", "date", "createdat"]);
            const dueStr = getVal(["duedate", "due", "expiry"]);
            const desc = getVal(["description", "item", "itemdescription", "details", "workitem"]);
            const typeStr = getVal(["type", "documenttype", "invoicetype"]);
            const statusStr = getVal(["status", "invoicestatus"]);
            const notes = getVal(["notes", "additionalnotes", "remarks"]);

            const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, "")) || 0;
            const todayIso = new Date().toISOString().slice(0, 10);

            // Parse or fallback issue date
            let finalIssue = todayIso;
            if (issueStr) {
                const parsedDate = new Date(issueStr);
                if (!isNaN(parsedDate.getTime())) {
                    finalIssue = parsedDate.toISOString().slice(0, 10);
                }
            }

            // Parse or fallback due date
            let finalDue = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
            if (dueStr) {
                const parsedDate = new Date(dueStr);
                if (!isNaN(parsedDate.getTime())) {
                    finalDue = parsedDate.toISOString().slice(0, 10);
                }
            }
            if (finalDue < finalIssue) finalDue = finalIssue;

            return {
                clientName: client || "Imported Client",
                projectName: project || "Imported Project",
                invoiceNumber: invNum || undefined,
                type: typeStr.toLowerCase().includes("pro") ? "pro_forma" : typeStr.toLowerCase().includes("quote") ? "quote" : "invoice",
                milestone: milestone || "Execution Milestone",
                amount: amount,
                issueDate: finalIssue,
                dueDate: finalDue,
                description: desc || "Work Services",
                rate: amount > 0 ? amount : 0,
                quantity: 1,
                taxRate: 18,
                status: statusStr.toLowerCase() === "pending" ? "pending" : "draft",
                notes: notes || undefined,
            };
        });

        setPreviewRows(parsed);
    };

    const handleSheetChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        const sheetName = e.target.value;
        setSelectedSheet(sheetName);
        if (!file) return;

        try {
            setLoading(true);
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            parseSheetData(workbook, sheetName);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to read worksheet.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleImportSubmit = async () => {
        if (!previewRows.length) return;

        setImporting(true);
        setError(null);
        const errors: string[] = [];
        let successes = 0;

        for (let i = 0; i < previewRows.length; i++) {
            const row = previewRows[i];
            try {
                await createInvoice({
                    type: row.type || "invoice",
                    clientName: row.clientName,
                    projectName: row.projectName,
                    invoiceNumber: row.invoiceNumber || undefined,
                    issueDate: row.issueDate || new Date().toISOString().slice(0, 10),
                    dueDate: row.dueDate || new Date().toISOString().slice(0, 10),
                    milestone: row.milestone || "Execution Milestone",
                    taxRate: row.taxRate ?? 18,
                    additionalNotes: row.notes,
                    billingAddress: {
                        line1: "42 Client Address",
                        city: "Mumbai",
                        state: "Maharashtra",
                        pincode: "400052",
                    },
                    items: [
                        {
                            description: row.description || "Execution Services",
                            quantity: row.quantity || 1,
                            rate: row.rate || row.amount || 0,
                        },
                    ],
                });
                successes++;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to import row";
                errors.push(`Row ${i + 1} (${row.clientName || "Unnamed"}): ${message}`);
            }
        }

        setImporting(false);
        setSuccessCount(successes);
        setImportLog({ successes, errors });

        if (successes > 0) {
            onSuccess();
        }
        if (errors.length > 0 && successes === 0) {
            setError(`Import failed: ${errors[0]}`);
        }
    };

    const downloadSampleTemplate = () => {
        const sampleData = [
            {
                "Invoice Number": "INV-0101",
                "Client Name": "Kohinoor Group",
                "Project Name": "Kohinoor Office - L4",
                "Type": "invoice",
                "Milestone": "Design Stage — 30%",
                "Amount": 1200000,
                "Issue Date": "2026-09-01",
                "Due Date": "2026-09-15",
                "Description": "Interior Design Services",
                "Status": "draft",
            },
            {
                "Invoice Number": "INV-0102",
                "Client Name": "Oberoi Residence",
                "Project Name": "Nikhil Oberoi Villa",
                "Type": "invoice",
                "Milestone": "Advance — 30%",
                "Amount": 425000,
                "Issue Date": "2026-09-05",
                "Due Date": "2026-09-20",
                "Description": "Civil & Structural Advance",
                "Status": "draft",
            },
        ];

        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Invoices_Template");
        XLSX.writeFile(wb, "invoice_import_template.xlsx");
    };

    return (
        <div className="invoice-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
            <div
                className="invoice-import-card"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="invoice-import-header">
                    <div>
                        <h2 className="invoice-import-title">Import Invoices</h2>
                        <p className="invoice-import-subtitle">
                            Upload an Excel (.xlsx, .xls) or CSV spreadsheet to bulk import invoices
                        </p>
                    </div>
                    <button
                        type="button"
                        className="invoice-import-close-btn"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="invoice-import-body">
                    {/* Template download pill */}
                    <div className="invoice-import-sample-box">
                        <div className="invoice-import-sample-info">
                            <FileSpreadsheet size={18} color="#2563EB" />
                            <span>Need the formatted columns? Download our template.</span>
                        </div>
                        <button
                            type="button"
                            className="invoice-import-sample-btn"
                            onClick={downloadSampleTemplate}
                        >
                            <Download size={14} />
                            <span>Download Template</span>
                        </button>
                    </div>

                    {/* File Drop Area */}
                    {!file ? (
                        <div
                            className="invoice-import-dropzone"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (e.dataTransfer.files?.[0]) {
                                    handleFile(e.dataTransfer.files[0]);
                                }
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        handleFile(e.target.files[0]);
                                    }
                                }}
                            />
                            <div className="invoice-import-drop-icon">
                                <UploadCloud size={32} color="#2563EB" />
                            </div>
                            <p className="invoice-import-drop-title">
                                Click to upload or drag & drop spreadsheet
                            </p>
                            <p className="invoice-import-drop-meta">
                                Supports .XLSX, .XLS, or .CSV (max 10MB)
                            </p>
                        </div>
                    ) : (
                        <div className="invoice-import-selected-box">
                            <div className="invoice-import-selected-left">
                                <FileSpreadsheet size={24} color="#2563EB" />
                                <div>
                                    <strong className="invoice-import-filename">{fileName}</strong>
                                    <p className="invoice-import-filemeta">
                                        {rowCount} data rows detected • {columns.length} columns
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="invoice-import-change-btn"
                                onClick={() => {
                                    setFile(null);
                                    setFileName("");
                                    setPreviewRows([]);
                                    setColumns([]);
                                    setRowCount(0);
                                    setError(null);
                                    setSuccessCount(null);
                                }}
                            >
                                Change file
                            </button>
                        </div>
                    )}

                    {/* Sheet Selector if multiple sheets */}
                    {sheetNames.length > 1 && (
                        <div className="invoice-import-sheet-select-row">
                            <label>Worksheet:</label>
                            <select value={selectedSheet} onChange={handleSheetChange}>
                                {sheetNames.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <div className="invoice-import-error-banner" role="alert">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success Notice */}
                    {successCount !== null && (
                        <div className="invoice-import-success-banner" role="status">
                            <CheckCircle size={18} />
                            <span>
                                Successfully imported {successCount} invoice{successCount === 1 ? "" : "s"}!
                                {importLog?.errors?.length ? ` (${importLog.errors.length} skipped due to validation errors)` : ""}
                            </span>
                        </div>
                    )}

                    {/* Preview Table */}
                    {previewRows.length > 0 && (
                        <div className="invoice-import-preview-wrapper">
                            <div className="invoice-import-preview-head">
                                <span>Preview (First {Math.min(5, previewRows.length)} of {previewRows.length} rows)</span>
                                <span className="invoice-import-badge-pill">{previewRows.length} ready to import</span>
                            </div>
                            <div className="invoice-import-table-scroll">
                                <table className="invoice-import-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>CLIENT</th>
                                            <th>PROJECT</th>
                                            <th>TYPE</th>
                                            <th>AMOUNT</th>
                                            <th>ISSUE DATE</th>
                                            <th>DUE DATE</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewRows.slice(0, 5).map((r, idx) => (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td><strong>{r.clientName}</strong></td>
                                                <td>{r.projectName}</td>
                                                <td>
                                                    <span className={`invoice-badge-${(r.type || "invoice").toLowerCase().replace(/_/g, "-")}`}>
                                                        {(r.type || "invoice").toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>₹{new Intl.NumberFormat("en-IN").format(r.amount || 0)}</td>
                                                <td>{r.issueDate}</td>
                                                <td>{r.dueDate}</td>
                                                <td>
                                                    <span className={`invoice-status-${(r.status || "draft").toLowerCase()}`}>
                                                        {(r.status || "draft").toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="invoice-import-footer">
                    <button
                        type="button"
                        className="invoice-import-cancel-btn"
                        onClick={onClose}
                        disabled={importing}
                    >
                        {successCount !== null ? "Close" : "Cancel"}
                    </button>
                    {successCount === null ? (
                        <button
                            type="button"
                            className="invoice-import-submit-btn"
                            onClick={handleImportSubmit}
                            disabled={!previewRows.length || importing || loading}
                        >
                            {importing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Importing...</span>
                                </>
                            ) : (
                                <span>Import {previewRows.length ? `${previewRows.length} Invoices` : ""}</span>
                            )}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="invoice-import-submit-btn"
                            onClick={onClose}
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
