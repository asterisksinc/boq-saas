"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { CreateMoodBoardInput, MoodBoardStatus } from "@/lib/mood-boards/types";
import { MOCK_PROJECTS, MOCK_CLIENTS } from "@/lib/mood-boards/mock-data";

interface ParsedRow {
  rowNumber: number;
  name: string;
  projectName: string;
  clientName: string;
  description?: string;
  status: MoodBoardStatus;
  createdBy?: string;
  isValid: boolean;
  errors: string[];
}

interface MoodBoardImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedCount: number, items: CreateMoodBoardInput[]) => void;
}

export default function MoodBoardImportDialog({
  isOpen,
  onClose,
  onImportSuccess,
}: MoodBoardImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setLoading(false);
      setParseError(null);
      setSheetNames([]);
      setSelectedSheet("");
      setWorkbook(null);
      setParsedRows([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizeStatus = (val: unknown): MoodBoardStatus => {
    if (!val) return "DRAFT";
    const s = String(val).trim().toUpperCase();
    if (s.includes("PROG") || s === "IN_PROGRESS" || s === "IN PROGRESS") return "IN_PROGRESS";
    if (s.includes("COMP") || s === "COMPLETED") return "COMPLETED";
    if (s.includes("ARCH") || s === "ARCHIVED") return "ARCHIVED";
    return "DRAFT";
  };

  const processWorksheet = (wb: XLSX.WorkBook, sheetName: string) => {
    try {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) throw new Error("Worksheet not found.");

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      if (rawRows.length === 0) {
        setParseError("The selected worksheet contains no data rows.");
        setParsedRows([]);
        return;
      }

      // Check available column keys
      const sampleRow = rawRows[0];
      const keys = Object.keys(sampleRow);

      const findKey = (candidates: string[]) => {
        return keys.find((k) =>
          candidates.some((c) => k.toLowerCase().replace(/[^a-z0-9]/g, "").includes(c))
        );
      };

      const nameKey = findKey(["moodboardname", "moodboard", "name", "title"]);
      const projectKey = findKey(["projectname", "project"]);
      const clientKey = findKey(["clientname", "client"]);
      const descKey = findKey(["description", "desc", "details"]);
      const statusKey = findKey(["status"]);
      const createdByKey = findKey(["createdby", "creator", "author"]);

      if (!nameKey || !projectKey || !clientKey) {
        setParseError(
          `Missing required columns. Found: ${keys.join(", ")}. Required: "Mood Board Name", "Project", "Client".`
        );
        setParsedRows([]);
        return;
      }

      const rows: ParsedRow[] = rawRows.map((r, index) => {
        const name = String(r[nameKey] || "").trim();
        const projectName = String(r[projectKey] || "").trim();
        const clientName = String(r[clientKey] || "").trim();
        const description = descKey ? String(r[descKey] || "").trim() : "";
        const rawStatus = statusKey ? r[statusKey] : "DRAFT";
        const createdBy = createdByKey ? String(r[createdByKey] || "").trim() : "Jenny Wilson";

        const errors: string[] = [];
        if (!name) errors.push("Missing Mood Board Name");
        if (!projectName) errors.push("Missing Project");
        if (!clientName) errors.push("Missing Client");

        return {
          rowNumber: index + 2, // Header is row 1
          name,
          projectName,
          clientName,
          description,
          status: normalizeStatus(rawStatus),
          createdBy: createdBy || "Jenny Wilson",
          isValid: errors.length === 0,
          errors,
        };
      });

      setParsedRows(rows);
      setParseError(null);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse worksheet.");
      setParsedRows([]);
    }
  };

  const handleFile = async (uploadedFile: File) => {
    const ext = uploadedFile.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      setParseError("Please select a valid Excel (.xlsx, .xls) or CSV file.");
      return;
    }

    setLoading(true);
    setParseError(null);
    setFile(uploadedFile);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        throw new Error("Spreadsheet contains no sheets.");
      }

      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      setSelectedSheet(wb.SheetNames[0]);
      processWorksheet(wb, wb.SheetNames[0]);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Error reading spreadsheet.");
      setParsedRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        "Mood Board Name": "Contemporary Penthouse Suite",
        Project: "Skyline Penthouse",
        Client: "Sharma Developers",
        Description: "Fluted wood panels, brushed bronze hardware, and soft grey leather.",
        Status: "In Progress",
        "Created By": "Alex Morgan",
      },
      {
        "Mood Board Name": "Minimalist Scandinavian Cafe",
        Project: "The Glasshouse Bistro",
        Client: "Gourmet Ventures",
        Description: "Blonde oak counters, terrazzo floors, and ceramic pendant lamps.",
        Status: "Completed",
        "Created By": "Jenny Wilson",
      },
      {
        "Mood Board Name": "Modern Executive Boardroom",
        Project: "Prestige Tech Park Hub",
        Client: "Apex Corp",
        Description: "Smart glass acoustic partitions and acoustic felt ceiling baffles.",
        Status: "Draft",
        "Created By": "David Chen",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, worksheet, "MoodBoards");
    XLSX.writeFile(wb, "mood-boards-sample-template.xlsx");
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleConfirmImport = () => {
    if (validRows.length === 0) return;

    const items: CreateMoodBoardInput[] = validRows.map((r) => {
      // Find matching mock project if available
      const matchedProject = MOCK_PROJECTS.find(
        (p) => p.name.toLowerCase() === r.projectName.toLowerCase()
      );
      const matchedClient = MOCK_CLIENTS.find(
        (c) => c.name.toLowerCase() === r.clientName.toLowerCase()
      );

      return {
        name: r.name,
        projectId: matchedProject?.id || `proj-custom-${Date.now()}`,
        projectName: r.projectName,
        clientId: matchedClient?.id || `client-custom-${Date.now()}`,
        clientName: r.clientName,
        clientSubtitle: matchedClient?.subtitle || "Imported Client",
        description: r.description || undefined,
        status: r.status,
        createdBy: r.createdBy || "Jenny Wilson",
      };
    });

    onImportSuccess(items.length, items);
    onClose();
  };

  return (
    <div
      className="mb-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-mb-title"
    >
      <div
        className="mb-modal-card"
        style={{ maxWidth: 720 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileSpreadsheet size={22} color="#2563EB" />
            <div>
              <h2 id="import-mb-title" className="mb-modal-title">
                Import Mood Boards from Excel
              </h2>
              <p className="mb-modal-subtitle">
                Upload a spreadsheet (.xlsx, .xls) to batch import presentation mood boards.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mb-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-modal-body">
          {/* Download Sample Template */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 6,
              padding: "10px 14px",
            }}
          >
            <span style={{ fontSize: 13, color: "#64748B" }}>
              Need the template format? Download our sample spreadsheet.
            </span>
            <button
              type="button"
              className="mb-btn mb-btn-secondary"
              style={{ height: 32, padding: "0 10px", fontSize: 12 }}
              onClick={handleDownloadSample}
            >
              <Download size={13} />
              <span>Download Template</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          {!file ? (
            <div
              className={`mb-dropzone ${isDragging ? "is-dragging" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) handleFile(dropped);
              }}
            >
              <UploadCloud size={32} className="mb-dropzone-icon" />
              <span className="mb-dropzone-text">
                Click or drag & drop your Excel file here
              </span>
              <span className="mb-dropzone-hint">
                Supports .xlsx, .xls, .csv files up to 10MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleFile(selected);
                }}
              />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: 6,
                padding: "10px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FileSpreadsheet size={20} color="#2563EB" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1E3A8A" }}>
                  {file.name}
                </span>
              </div>
              <button
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748B",
                  fontSize: 12,
                  textDecoration: "underline",
                }}
                onClick={() => {
                  setFile(null);
                  setParsedRows([]);
                  setParseError(null);
                }}
              >
                Change File
              </button>
            </div>
          )}

          {/* Sheet Selector if multiple sheets exist */}
          {sheetNames.length > 1 && workbook && (
            <div className="mb-form-group">
              <label htmlFor="import-sheet-select" className="mb-form-label">
                Select Worksheet:
              </label>
              <select
                id="import-sheet-select"
                className="mb-form-select"
                value={selectedSheet}
                onChange={(e) => {
                  setSelectedSheet(e.target.value);
                  processWorksheet(workbook, e.target.value);
                }}
              >
                {sheetNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 20 }}>
              <Loader2 size={18} className="animate-spin" color="#2563EB" />
              <span style={{ fontSize: 14, color: "#64748B" }}>
                Reading spreadsheet...
              </span>
            </div>
          )}

          {/* Error Message */}
          {parseError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 6,
                padding: "10px 14px",
                color: "#B91C1C",
                fontSize: 13,
              }}
            >
              <AlertCircle size={16} />
              <span>{parseError}</span>
            </div>
          )}

          {/* Validation Summary and Preview Table */}
          {parsedRows.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: "#16A34A", fontWeight: 600 }}>
                    ✓ {validRows.length} Valid {validRows.length === 1 ? "row" : "rows"}
                  </span>
                  {invalidRows.length > 0 && (
                    <span style={{ color: "#EF4444", fontWeight: 600 }}>
                      ✕ {invalidRows.length} Invalid {invalidRows.length === 1 ? "row" : "rows"}
                    </span>
                  )}
                </div>
                <span style={{ color: "#64748B" }}>
                  Total: {parsedRows.length} rows found
                </span>
              </div>

              <div className="mb-import-preview-box">
                <table className="mb-import-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Mood Board Name</th>
                      <th>Project</th>
                      <th>Client</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td>
                          {row.isValid ? (
                            <span className="mb-import-badge-valid">Valid</span>
                          ) : (
                            <span className="mb-import-badge-invalid" title={row.errors.join(", ")}>
                              Invalid
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {row.name || <em style={{ color: "#94A3B8" }}>(missing)</em>}
                        </td>
                        <td>{row.projectName || <em style={{ color: "#94A3B8" }}>(missing)</em>}</td>
                        <td>{row.clientName || <em style={{ color: "#94A3B8" }}>(missing)</em>}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="mb-modal-footer">
          <button
            type="button"
            className="mb-btn mb-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="mb-btn mb-btn-primary"
            disabled={validRows.length === 0}
            onClick={handleConfirmImport}
          >
            Import {validRows.length} {validRows.length === 1 ? "Mood Board" : "Mood Boards"}
          </button>
        </div>
      </div>
    </div>
  );
}
