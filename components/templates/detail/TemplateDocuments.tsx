"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Upload,
  MoreHorizontal,
  Download,
  Eye,
  Trash2,
  Edit2,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  UploadCloud,
} from "lucide-react";
import { updateTemplateDocuments } from "@/lib/api/templates";
import {
  TemplateDocumentItem,
  DEFAULT_TEMPLATE_DOCUMENTS,
  normalizeTemplateDocument,
  formatFileSize,
  formatDateString,
  detectCategoryAndFormat,
} from "@/lib/templates/default-documents";

interface TemplateDocumentsProps {
  templateId: string;
  initialDocuments?: any[];
  onUpdate?: () => void;
}

export default function TemplateDocuments({
  templateId,
  initialDocuments,
  onUpdate,
}: TemplateDocumentsProps) {
  // Normalize documents
  const initialNormalized = useMemo(() => {
    if (initialDocuments && Array.isArray(initialDocuments) && initialDocuments.length > 0) {
      return initialDocuments.map((d, i) => normalizeTemplateDocument(d, i));
    }
    return DEFAULT_TEMPLATE_DOCUMENTS;
  }, [initialDocuments]);

  const [documents, setDocuments] = useState<TemplateDocumentItem[]>(initialNormalized);

  // Sync if prop updates
  useEffect(() => {
    if (initialDocuments && Array.isArray(initialDocuments) && initialDocuments.length > 0) {
      setDocuments(initialDocuments.map((d, i) => normalizeTemplateDocument(d, i)));
    }
  }, [initialDocuments]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Kebab Menu State
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<TemplateDocumentItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<TemplateDocumentItem | null>(null);

  // Upload Form State
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("BOQ");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Notification / Saving state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unique categories for filter
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return ["All", ...Array.from(set)];
  }, [documents]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedCategory !== "All" && doc.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesCat = doc.category.toLowerCase().includes(q);
        const matchesFormat = (doc.format || "").toLowerCase().includes(q);
        const matchesDesc = (doc.description || "").toLowerCase().includes(q);
        return matchesName || matchesCat || matchesFormat || matchesDesc;
      }
      return true;
    });
  }, [documents, selectedCategory, searchQuery]);

  // Pagination calculations
  const totalCount = filteredDocuments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginatedDocs = filteredDocuments.slice(startIdx, startIdx + pageSize);

  // Persist to backend
  const commitDocumentsChange = async (nextDocs: TemplateDocumentItem[]) => {
    try {
      setSaving(true);
      setSaveError(null);
      await updateTemplateDocuments(templateId, nextDocs);
      setDocuments(nextDocs);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onUpdate?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update documents.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Upload handler
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!uploadFileName) {
      setUploadFileName(file.name);
    }
    const detected = detectCategoryAndFormat(file.name);
    if (detected.category !== "General") {
      setUploadCategory(detected.category);
    }
  };

  const handleSaveUpload = async () => {
    const finalName = uploadFileName.trim() || selectedFile?.name || "Uploaded Document";
    const detected = detectCategoryAndFormat(finalName);
    const sizeStr = selectedFile ? formatFileSize(selectedFile.size) : "1.5 MB";
    const sizeBytes = selectedFile ? selectedFile.size : 1572864;

    const newDoc: TemplateDocumentItem = {
      id: `doc-${Date.now()}`,
      name: finalName,
      category: uploadCategory || detected.category,
      size: sizeStr,
      sizeBytes,
      date: formatDateString(new Date().toISOString()),
      format: detected.format,
      version: "v1.0",
      type: uploadCategory || detected.category,
      uploadedBy: "Admin User",
      description: uploadDescription.trim() || "Template document requirement",
      updatedAt: new Date().toISOString(),
    };

    const nextDocs = [newDoc, ...documents];
    await commitDocumentsChange(nextDocs);

    // Reset upload modal
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setUploadFileName("");
    setUploadDescription("");
    setUploadCategory("BOQ");
  };

  // Delete handler
  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm("Are you sure you want to remove this document from the template?")) return;
    const nextDocs = documents.filter((d) => d.id !== docId);
    await commitDocumentsChange(nextDocs);
    setOpenKebabId(null);
  };

  // Save edit/rename
  const handleSaveEdit = async () => {
    if (!editingDoc) return;
    const nextDocs = documents.map((d) => (d.id === editingDoc.id ? editingDoc : d));
    await commitDocumentsChange(nextDocs);
    setEditingDoc(null);
    setOpenKebabId(null);
  };

  // Download document
  const handleDownloadDocument = (doc: TemplateDocumentItem) => {
    const element = document.createElement("a");
    const content = `BOQ SaaS Template Document Attachment\n=====================================\nDocument Name: ${doc.name}\nCategory: ${doc.category}\nFile Format: ${doc.format || "PDF"}\nFile Size: ${doc.size}\nDate Added: ${doc.date}\nVersion: ${doc.version || "v1.0"}\nUploaded By: ${doc.uploadedBy || "Admin User"}\nDescription: ${doc.description || "N/A"}\n`;
    const fileBlob = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(fileBlob);
    element.download = doc.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setOpenKebabId(null);
  };

  // File type icon helper
  const renderDocIcon = (format?: string, name = "") => {
    const ext = (format || name.split(".").pop() || "pdf").toLowerCase();
    if (ext === "pdf") {
      return (
        <div className="td-doc-type-icon pdf" title="PDF Document">
          <FileText size={16} />
        </div>
      );
    }
    if (ext === "dwg" || ext === "cad" || ext === "dxf") {
      return (
        <div className="td-doc-type-icon dwg" title="AutoCAD Drawing">
          <FileCode size={16} />
        </div>
      );
    }
    if (ext === "xlsx" || ext === "xls" || ext === "csv") {
      return (
        <div className="td-doc-type-icon xlsx" title="Spreadsheet">
          <FileSpreadsheet size={16} />
        </div>
      );
    }
    if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp") {
      return (
        <div className="td-doc-type-icon jpg" title="Image / Photo">
          <ImageIcon size={16} />
        </div>
      );
    }
    if (ext === "zip" || ext === "rar" || ext === "7z") {
      return (
        <div className="td-doc-type-icon zip" title="Archive">
          <FileArchive size={16} />
        </div>
      );
    }
    return (
      <div className="td-doc-type-icon general" title="Document">
        <FileText size={16} />
      </div>
    );
  };

  return (
    <div className="td-documents-shell">
      {/* ── Status Notifications ────────────────────────────────────────── */}
      {saveSuccess && (
        <div className="td-inspector-alert success" style={{ marginBottom: 4 }}>
          <Check size={14} />
          <span>Documents updated and saved successfully.</span>
        </div>
      )}
      {saveError && (
        <div className="td-inspector-alert error" style={{ marginBottom: 4 }}>
          <span>{saveError}</span>
        </div>
      )}

      {/* ── 1. Section Header & Toolbar (Figma Frame 2147225198) ─────────── */}
      <div className="td-doc-header-row">
        {/* Title & Count (Frame 2147225206) */}
        <div className="td-doc-title-col">
          <h2 className="td-doc-heading">Documents</h2>
          <p className="td-doc-count-sub">
            {documents.length} Document{documents.length === 1 ? "" : "s"} in this template
          </p>
        </div>

        {/* Toolbar Controls (Frame 2147225069) */}
        <div className="td-doc-toolbar">
          {/* Search Box (Frame 76) */}
          <div className="td-doc-search-box">
            <div className="td-doc-search-badge">
              <Search size={16} />
            </div>
            <input
              type="text"
              className="td-doc-search-input"
              placeholder="Search documents…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Search documents"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94A3B8",
                  padding: 2,
                }}
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Buttons Group (Frame 2147225194) */}
          <div className="td-doc-btn-group">
            {/* View / Toggle Icon Button */}
            <button
              type="button"
              className="td-doc-icon-btn"
              title="Toggle View"
              onClick={() => {
                // Toggle sorting or cycling
                setDocuments((prev) => [...prev].reverse());
              }}
              aria-label="Toggle View"
            >
              <SlidersHorizontal size={18} />
            </button>

            {/* Filter Button */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className={`td-doc-filter-btn ${selectedCategory !== "All" ? "active" : ""}`}
                onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                title="Filter by category"
              >
                <SlidersHorizontal size={16} />
                <span>{selectedCategory === "All" ? "Filter" : selectedCategory}</span>
                <ChevronDown size={14} />
              </button>

              {isFilterDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: 50,
                    right: 0,
                    zIndex: 50,
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    minWidth: 180,
                    padding: "6px 0",
                  }}
                >
                  <div style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>
                    Filter by Category
                  </div>
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 14px",
                        fontSize: 13,
                        background: selectedCategory === cat ? "#EFF6FF" : "transparent",
                        color: selectedCategory === cat ? "#2563EB" : "#0F172A",
                        fontWeight: selectedCategory === cat ? 600 : 400,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsFilterDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      <span>{cat}</span>
                      {selectedCategory === cat && <Check size={14} />}
                    </button>
                  ))}
                  {selectedCategory !== "All" && (
                    <>
                      <hr style={{ border: "none", borderTop: "1px solid #E2E8F0", margin: "4px 0" }} />
                      <button
                        type="button"
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 14px",
                          fontSize: 12,
                          color: "#DC2626",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setSelectedCategory("All");
                          setIsFilterDropdownOpen(false);
                        }}
                      >
                        Reset Filter
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Quick Add Button */}
            <button
              type="button"
              className="td-doc-action-btn"
              onClick={() => setIsUploadModalOpen(true)}
              title="Add Document Requirement"
              aria-label="Add Document Requirement"
            >
              <Plus size={20} />
            </button>

            {/* Upload Button */}
            <button
              type="button"
              className="td-doc-upload-btn"
              onClick={() => setIsUploadModalOpen(true)}
              title="Upload New Document"
            >
              <Upload size={16} />
              <span>Upload</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Main Content Card (Figma Frame 2147225199 / Frame 93) ─────── */}
      <div className="td-doc-table-card">
        <div className="td-doc-table-wrapper">
          <table className="td-doc-table" role="table">
            {/* Table Header (Frame 57: #E4ECFB, 36px height) */}
            <thead>
              <tr role="row">
                <th style={{ width: "40%" }}>NAME</th>
                <th style={{ width: "20%" }}>CATEGORY</th>
                <th style={{ width: "16%" }}>SIZE</th>
                <th style={{ width: "16%" }}>DATE</th>
                <th className="center" style={{ width: "8%" }}></th>
              </tr>
            </thead>

            {/* Table Body (Frames 59, 83, 81, 82, 84, 85: 56px height) */}
            <tbody>
              {paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ maxWidth: 360, margin: "0 auto" }}>
                      <p style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", margin: "0 0 6px 0" }}>
                        No documents found
                      </p>
                      <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 16px 0" }}>
                        {searchQuery || selectedCategory !== "All"
                          ? "No template documents match your current filter criteria."
                          : "This template does not have any attached documents yet."}
                      </p>
                      <button
                        type="button"
                        className="td-doc-upload-btn"
                        style={{ margin: "0 auto" }}
                        onClick={() => setIsUploadModalOpen(true)}
                      >
                        <Plus size={16} />
                        <span>Upload First Document</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc) => {
                  const isKebabOpen = openKebabId === doc.id;

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setPreviewDoc(doc)}
                      title="Click to preview document"
                    >
                      {/* Column 1: NAME */}
                      <td>
                        <div className="td-doc-name-cell">
                          {renderDocIcon(doc.format, doc.name)}
                          <span className="td-doc-name-text">{doc.name}</span>
                        </div>
                      </td>

                      {/* Column 2: CATEGORY */}
                      <td>
                        <span className="td-doc-category-badge">
                          {doc.category || "General"}
                        </span>
                      </td>

                      {/* Column 3: SIZE */}
                      <td>
                        <span className="td-doc-size-text">{doc.size || "1.2 MB"}</span>
                      </td>

                      {/* Column 4: DATE */}
                      <td>
                        <span className="td-doc-date-text">{doc.date || "12 Aug 2024"}</span>
                      </td>

                      {/* Column 5: Kebab Action Menu */}
                      <td className="center" onClick={(e) => e.stopPropagation()}>
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <button
                            type="button"
                            className="td-doc-kebab-btn"
                            title="Document actions"
                            onClick={() => setOpenKebabId(isKebabOpen ? null : doc.id)}
                            aria-label="Document actions"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {isKebabOpen && (
                            <div
                              style={{
                                position: "absolute",
                                top: 28,
                                right: 0,
                                zIndex: 40,
                                background: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                borderRadius: 8,
                                boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                                minWidth: 160,
                                padding: "6px 0",
                              }}
                            >
                              <button
                                type="button"
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 14px",
                                  fontSize: 13,
                                  border: "none",
                                  background: "transparent",
                                  color: "#0F172A",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                                onClick={() => {
                                  setPreviewDoc(doc);
                                  setOpenKebabId(null);
                                }}
                              >
                                <Eye size={14} color="#64748B" />
                                <span>Preview Document</span>
                              </button>
                              <button
                                type="button"
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 14px",
                                  fontSize: 13,
                                  border: "none",
                                  background: "transparent",
                                  color: "#0F172A",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                                onClick={() => handleDownloadDocument(doc)}
                              >
                                <Download size={14} color="#64748B" />
                                <span>Download</span>
                              </button>
                              <button
                                type="button"
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 14px",
                                  fontSize: 13,
                                  border: "none",
                                  background: "transparent",
                                  color: "#0F172A",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                                onClick={() => {
                                  setEditingDoc(doc);
                                  setOpenKebabId(null);
                                }}
                              >
                                <Edit2 size={14} color="#64748B" />
                                <span>Edit Metadata</span>
                              </button>
                              <hr style={{ border: "none", borderTop: "1px solid #EBEBEB", margin: "4px 0" }} />
                              <button
                                type="button"
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 14px",
                                  fontSize: 13,
                                  border: "none",
                                  background: "transparent",
                                  color: "#DC2626",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                                onClick={() => handleDeleteDocument(doc.id)}
                              >
                                <Trash2 size={14} color="#DC2626" />
                                <span>Remove Document</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 3. Bottom Pagination Bar (Figma Frame 2147225166) ───────────── */}
        <div className="target-table-pagination-row">
          {/* Total Documents count */}
          <div className="target-table-total-count">
            Total Documents: {totalCount}
          </div>

          {/* Page navigation buttons (Frame 2147225165) */}
          <div className="target-table-page-nav" role="navigation" aria-label="Pagination">
            <button
              type="button"
              className="target-table-page-btn arrow"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`target-table-page-btn ${safePage === pageNum ? "active" : ""}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              className="target-table-page-btn arrow"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Page Size Dropdown (Frame 2147225167) */}
          <div className="target-table-page-size-wrap">
            <span className="target-table-page-size-label">Show per Page:</span>
            <div className="target-table-page-size-select-wrap">
              <select
                className="target-table-page-size-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <ChevronDown size={14} className="target-table-select-arrow" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Upload Document Modal ─────────────────────────────────────── */}
      {isUploadModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setIsUploadModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#FFFFFF",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
                  Upload Template Document
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>
                  Attach blueprints, contracts, BOQ spreadsheets, or signoff forms.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}
                aria-label="Close Modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drag & Drop File Zone */}
            <div
              style={{
                border: isDragging ? "2px dashed #2563EB" : "2px dashed #CBD5E1",
                borderRadius: 8,
                padding: "24px 16px",
                textAlign: "center",
                background: isDragging ? "#EFF6FF" : "#F8FAFC",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={36} color="#2563EB" style={{ margin: "0 auto 8px" }} />
              {selectedFile ? (
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                    {selectedFile.name}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748B" }}>
                    {formatFileSize(selectedFile.size)} • Click to change file
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                    Click to select file or drag & drop here
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748B" }}>
                    Supports PDF, DWG, XLSX, DOCX, JPG up to 50MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
            </div>

            {/* Document Title */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Document Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Master Service Agreement v1.0.pdf"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 14,
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Category */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 14,
                    border: "1px solid #CBD5E1",
                    borderRadius: 6,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="BOQ">BOQ</option>
                  <option value="Drawing">Drawing</option>
                  <option value="Costing">Costing</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Site">Site</option>
                  <option value="Contract">Contract</option>
                  <option value="Specification">Specification</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Requirement Scope
                </label>
                <input
                  type="text"
                  readOnly
                  value="Project Template Default"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 14,
                    border: "1px solid #CBD5E1",
                    borderRadius: 6,
                    background: "#F1F5F9",
                    color: "#64748B",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe what this document represents..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 14,
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                style={{
                  padding: "9px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#475569",
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUpload}
                disabled={(!uploadFileName.trim() && !selectedFile) || saving}
                style={{
                  padding: "9px 18px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  background: (!uploadFileName.trim() && !selectedFile) || saving ? "#93C5FD" : "#2563EB",
                  border: "none",
                  borderRadius: 6,
                  cursor: (!uploadFileName.trim() && !selectedFile) || saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Uploading..." : "Save Document"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Preview Document Modal ────────────────────────────────────── */}
      {previewDoc && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setPreviewDoc(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 580,
              background: "#FFFFFF",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {renderDocIcon(previewDoc.format, previewDoc.name)}
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                    {previewDoc.name}
                  </h3>
                  <span className="td-doc-category-badge" style={{ marginTop: 4 }}>
                    {previewDoc.category}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}
                aria-label="Close Preview"
              >
                <X size={20} />
              </button>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #EBEBEB", margin: 0 }} />

            {/* Document Metadata Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#F8FAFC", padding: 16, borderRadius: 8 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#64748B" }}>File Size</span>
                <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                  {previewDoc.size}
                </p>
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#64748B" }}>File Format</span>
                <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                  {previewDoc.format || "PDF"}
                </p>
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#64748B" }}>Date Added</span>
                <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                  {previewDoc.date}
                </p>
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#64748B" }}>Uploaded By</span>
                <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                  {previewDoc.uploadedBy || "Admin User"}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                Description
              </span>
              <p style={{ margin: 0, fontSize: 14, color: "#334155", lineHeight: 1.5 }}>
                {previewDoc.description ||
                  "Standard template attachment required for projects initiated from this template."}
              </p>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <button
                type="button"
                onClick={() => {
                  const toDelete = previewDoc.id;
                  setPreviewDoc(null);
                  handleDeleteDocument(toDelete);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#DC2626",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  style={{
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#475569",
                    background: "#F1F5F9",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(previewDoc)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#FFFFFF",
                    background: "#2563EB",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  <Download size={14} />
                  <span>Download Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Edit Metadata Modal ───────────────────────────────────────── */}
      {editingDoc && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setEditingDoc(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#FFFFFF",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
                Edit Document Metadata
              </h3>
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}
                aria-label="Close Modal"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Document Name *
              </label>
              <input
                type="text"
                value={editingDoc.name}
                onChange={(e) => setEditingDoc({ ...editingDoc, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 14,
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Category
              </label>
              <select
                value={editingDoc.category}
                onChange={(e) => setEditingDoc({ ...editingDoc, category: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 14,
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="BOQ">BOQ</option>
                <option value="Drawing">Drawing</option>
                <option value="Costing">Costing</option>
                <option value="Proposal">Proposal</option>
                <option value="Vendor">Vendor</option>
                <option value="Site">Site</option>
                <option value="Contract">Contract</option>
                <option value="Specification">Specification</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Description
              </label>
              <textarea
                rows={3}
                value={editingDoc.description || ""}
                onChange={(e) => setEditingDoc({ ...editingDoc, description: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 14,
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                style={{
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#475569",
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editingDoc.name.trim() || saving}
                style={{
                  padding: "8px 18px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  background: !editingDoc.name.trim() || saving ? "#93C5FD" : "#2563EB",
                  border: "none",
                  borderRadius: 6,
                  cursor: !editingDoc.name.trim() || saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
