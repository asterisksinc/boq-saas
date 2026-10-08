"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { X, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, UploadCloud } from "lucide-react";
import * as XLSX from "xlsx";
import { createCostingCategory, createCostingItem } from "@/lib/api/costing";

interface CostingExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  importType?: "items" | "categories" | "sub-categories";
  parentCategoryId?: string;
}

export default function CostingExcelImportModal({
  isOpen,
  onClose,
  onSuccess,
  importType = "items",
  parentCategoryId,
}: CostingExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (selectedFile: File) => {
    setError(null);
    setSuccessCount(null);
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
      const sheet = workbook.Sheets[defaultSheet];
      const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      if (rawData.length === 0) {
        throw new Error("Spreadsheet must contain at least one data row.");
      }

      const cols = Object.keys(rawData[0] || {});
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setSheetNames(workbook.SheetNames);
      setSelectedSheet(defaultSheet);
      setColumns(cols);
      setPreviewRows(rawData.slice(0, 5));
      setRowCount(rawData.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse spreadsheet.");
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file || previewRows.length === 0) {
      setError("Please select a valid spreadsheet file first.");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[selectedSheet || workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      let imported = 0;

      for (const row of rows) {
        // Case-insensitive key lookup helper
        const getVal = (...keys: string[]): string => {
          for (const k of keys) {
            for (const rk of Object.keys(row)) {
              if (rk.trim().toLowerCase() === k.toLowerCase()) {
                const v = row[rk];
                return v !== null && v !== undefined ? String(v).trim() : "";
              }
            }
          }
          return "";
        };

        if (importType === "items") {
          const name = getVal("item", "item name", "name", "title", "description");
          if (!name) continue;

          const unit = getVal("unit", "uom") || "Nos";
          const baseCost = parseFloat(getVal("base cost", "base_cost", "rate", "cost", "unit rate") || "0") || 0;
          const sellingRate = parseFloat(getVal("selling rate", "selling_rate", "selling price", "price") || "0") || (baseCost > 0 ? Math.round(baseCost * 1.2) : 0);
          const preferredVendor = getVal("vendor", "preferred vendor", "supplier") || null;
          const spec = getVal("spec", "specification", "notes") || null;
          const code = getVal("code", "item code", "sku") || undefined;
          const rateStatus = (getVal("status", "rate status") || "active").toLowerCase();

          if (parentCategoryId) {
            await createCostingItem({
              name,
              code,
              categoryId: parentCategoryId,
              unit,
              baseCost,
              sellingRate,
              preferredVendor,
              spec,
              rateStatus: ["active", "draft", "expired"].includes(rateStatus) ? rateStatus : "active",
            });
            imported++;
          }
        } else if (importType === "sub-categories") {
          const name = getVal("sub-category", "sub category", "title", "name");
          if (!name) continue;

          const code = getVal("code", "sub-category code", "sub category code") || undefined;
          await createCostingCategory({
            name,
            code,
            parentId: parentCategoryId || undefined,
            defaultUnit: getVal("unit", "default unit") || "Nos",
          });
          imported++;
        } else {
          // categories
          const name = getVal("category", "category name", "title", "name");
          if (!name) continue;

          const code = getVal("code", "category code") || undefined;
          const defaultUnit = getVal("unit", "default unit") || "Nos";
          await createCostingCategory({
            name,
            code,
            defaultUnit,
          });
          imported++;
        }
      }

      setSuccessCount(imported);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import rows.");
    } finally {
      setImporting(false);
    }
  };

  const getTitle = () => {
    switch (importType) {
      case "items":
        return "Import Items via Excel";
      case "sub-categories":
        return "Import Sub-Categories via Excel";
      default:
        return "Import Categories via Excel";
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
        zIndex: 99999,
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !importing) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "600px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#1e293b" }}>{getTitle()}</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
              Upload an Excel (.xlsx, .xls) or CSV spreadsheet to populate data.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: "4px",
              borderRadius: "6px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "#fef2f2",
                color: "#b91c1c",
                borderRadius: "8px",
                border: "1px solid #fecaca",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div
              style={{
                padding: "12px 16px",
                background: "#ecfdf5",
                color: "#059669",
                borderRadius: "8px",
                border: "1px solid #a7f3d0",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle size={16} />
              <span>Successfully imported {successCount} records!</span>
            </div>
          )}

          {/* Upload Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed #cbd5e1",
              borderRadius: "12px",
              padding: "32px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: "#f8fafc",
              transition: "border 0.15s ease",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
              }}
            >
              <UploadCloud size={24} />
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
              {fileName ? fileName : "Click to upload or drag and drop spreadsheet"}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              Supports .XLSX, .XLS, or .CSV (up to 10MB)
            </div>
          </div>

          {/* Preview Table */}
          {previewRows.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#475569",
                }}
              >
                <span>Found {rowCount} data rows</span>
                {sheetNames.length > 1 && (
                  <select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      fontSize: "12px",
                    }}
                  >
                    {sheetNames.map((sn) => (
                      <option key={sn} value={sn}>
                        Sheet: {sn}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div
                style={{
                  maxHeight: "160px",
                  overflowY: "auto",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead style={{ background: "#f1f5f9", position: "sticky", top: 0 }}>
                    <tr>
                      {columns.slice(0, 5).map((col) => (
                        <th key={col} style={{ padding: "6px 10px", textAlign: "left", color: "#475569" }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        {columns.slice(0, 5).map((col) => (
                          <td key={col} style={{ padding: "6px 10px", color: "#1e293b" }}>
                            {String(r[col] || "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #f1f5f9",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#475569",
              fontSize: "13.5px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !file || loading}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: importing || !file ? "not-allowed" : "pointer",
              opacity: importing || !file ? 0.6 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {importing && <Loader2 size={15} className="animate-spin" />}
            <span>Import Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
