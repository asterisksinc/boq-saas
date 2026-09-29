"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { X, FileSpreadsheet, ArrowRight, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { createProjectTemplate } from "@/lib/api/templates";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (template: Record<string, unknown>) => void;
}

export default function ExcelImportModal({ isOpen, onClose, onSuccess }: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [businessType, setBusinessType] = useState("Residential");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (selectedFile: File) => {
    setError(null);
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
      const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" });

      if (rawData.length < 2) {
        throw new Error("Spreadsheet must contain a header row and at least one data row.");
      }

      const cols = (rawData[0] as string[]).map((c, i) => String(c || `Column ${i + 1}`).trim()).filter(Boolean);
      const rows = rawData.slice(1, 11);

      setFile(selectedFile);
      setFileName(selectedFile.name);
      setTemplateName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      setSheetNames(workbook.SheetNames);
      setSelectedSheet(defaultSheet);
      setColumns(cols);
      setPreviewRows(rows);
      setRowCount(rawData.length - 1);
    } catch (err: unknown) {
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

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !templateName.trim()) {
      setError("Please specify a template name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build structured BOQ items and sections from spreadsheet rows
      const sections = [
        {
          id: crypto.randomUUID(),
          title: "Imported Section",
          code: "SEC-01",
          items: previewRows.map((row, idx) => ({
            id: crypto.randomUUID(),
            name: String(row[0] || `Item ${idx + 1}`),
            unit: String(row[1] || "sqft"),
            quantity: Number(row[2]) || 1,
            rate: Number(row[3]) || 0,
            amount: (Number(row[2]) || 1) * (Number(row[3]) || 0),
          })),
        },
      ];

      const payload = {
        name: templateName.trim(),
        description: `Imported from Excel file ${fileName} (${rowCount} rows)`,
        businessType,
        projectType: businessType || "Residential",
        team: "Estimation",
        region: "Global",
        visibility: "workspace",
        tags: ["excel-import"],
        structure: { areas: [{ id: crypto.randomUUID(), name: "Main Area", type: "General" }] },
        costingBoq: {
          sections,
          sectionCount: sections.length,
          itemCount: previewRows.length,
        },
        workflow: { stages: [], tasks: [], milestones: [], approvals: [], rules: [] },
        documents: [],
      };

      const result = await createProjectTemplate(payload);
      onSuccess(result as Record<string, unknown>);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to import template. Please verify data format.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-template-modal-overlay" onClick={onClose}>
      <div className="new-template-modal-card" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="ntm-header">
          <div className="ntm-header-info">
            <h2>Import Template from Excel</h2>
            <p>Upload a spreadsheet (.xlsx, .xls, or .csv) to generate a new template.</p>
          </div>
          <button type="button" className="ntm-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="ntm-api-error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleImport}>
          {!file ? (
            <div
              className="excel-drop-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              <FileSpreadsheet size={40} className="excel-drop-icon" />
              <div className="excel-drop-title">Click to upload or drag & drop</div>
              <div className="excel-drop-sub">Excel files (.xlsx, .xls) or CSV up to 10 MB</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="excel-loaded-view">
              <div className="excel-file-badge">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={18} color="#10b981" />
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{fileName}</span>
                  <span style={{ color: "#64748b", fontSize: 12 }}>({rowCount} rows detected)</span>
                </div>
                <button
                  type="button"
                  className="excel-change-btn"
                  onClick={() => { setFile(null); setPreviewRows([]); }}
                >
                  Change
                </button>
              </div>

              <div className="ntm-two-col-row" style={{ marginTop: 16 }}>
                <div className="ntm-form-field">
                  <label className="ntm-label">Template Name <span className="ntm-req">*</span></label>
                  <input
                    type="text"
                    className="ntm-input"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    required
                  />
                </div>
                <div className="ntm-form-field">
                  <label className="ntm-label">Business Type <span className="ntm-req">*</span></label>
                  <select
                    className="ntm-select"
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value)}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Retail">Retail</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
              </div>

              {columns.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <label className="ntm-label">Detected Columns ({columns.length})</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {columns.slice(0, 8).map(c => (
                      <span key={c} style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: 4, fontSize: 12, color: "#475569" }}>
                        {c}
                      </span>
                    ))}
                    {columns.length > 8 && (
                      <span style={{ color: "#94a3b8", fontSize: 12, alignSelf: "center" }}>
                        +{columns.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="ntm-footer">
            <button type="button" className="ntm-btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="ntm-btn-next" disabled={!file || loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="ntm-spinner" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <span>Create Template</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
