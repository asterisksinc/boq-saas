"use client";

import React, { useState } from "react";
import { FileText, Plus, Download, Trash2, X, Check } from "lucide-react";
import { updateTemplateDocuments } from "@/lib/api/templates";

type TemplateDocument = {
  id: string;
  name?: string;
  type?: string;
  format?: string;
  version?: string | number;
  updatedAt?: string | null;
};

interface TemplateDocumentsProps {
  templateId: string;
  initialDocuments?: TemplateDocument[];
  onUpdate?: () => void;
}

export default function TemplateDocuments({
  templateId,
  initialDocuments,
  onUpdate,
}: TemplateDocumentsProps) {
  const [documents, setDocuments] = useState<TemplateDocument[]>(initialDocuments || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Contract");
  const [docFormat, setDocFormat] = useState("PDF");
  const [docVersion, setDocVersion] = useState("v1.0");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialDocuments) {
      setDocuments(initialDocuments);
    }
  }, [initialDocuments]);

  const persist = async (nextDocs: TemplateDocument[]) => {
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

  const handleAddDocument = async () => {
    if (!docName.trim()) return;
    const newDoc: TemplateDocument = {
      id: `doc-${Date.now()}`,
      name: docName.trim(),
      type: docType,
      format: docFormat,
      version: docVersion,
      updatedAt: new Date().toISOString(),
    };
    const nextDocs = [...documents, newDoc];
    await persist(nextDocs);
    setIsModalOpen(false);
    setDocName("");
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm("Remove this document requirement?")) return;
    const nextDocs = documents.filter((d) => d.id !== id);
    await persist(nextDocs);
  };

  const handleDownload = (doc: TemplateDocument) => {
    // Generate a temporary mock text file or notification
    const element = document.createElement("a");
    const file = new Blob([`Document Requirement: ${doc.name}\nType: ${doc.type}\nFormat: ${doc.format}\nVersion: ${doc.version}`], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${(doc.name || "document").replace(/\s+/g, "_")}.${(doc.format || "pdf").toLowerCase()}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="td-doc-wrapper">
      {saveSuccess && (
        <div className="td-inspector-alert success" style={{ marginBottom: 16 }}>
          <Check size={14} />
          <span>Documents saved successfully.</span>
        </div>
      )}
      {saveError && (
        <div className="td-inspector-alert error" style={{ marginBottom: 16 }}>
          <span>{saveError}</span>
        </div>
      )}

      <div className="td-doc-header">
        <div>
          <h3 className="td-doc-title">Template Documents ({documents.length})</h3>
          <p className="td-doc-sub">
            Contract templates, client questionnaires, specifications, and signoff forms.
          </p>
        </div>
        <button
          type="button"
          className="td-add-doc-btn"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={15} />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="target-table-container">
        <div className="target-table-scroll">
          <table className="target-table">
            <thead>
              <tr>
                <th style={{ width: "35%" }}>DOCUMENT NAME</th>
                <th style={{ width: "20%" }}>TYPE</th>
                <th style={{ width: "12%" }}>FORMAT</th>
                <th style={{ width: "12%" }}>VERSION</th>
                <th style={{ width: "13%" }}>UPDATED</th>
                <th style={{ width: "8%" }} />
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "36px 0", color: "#94a3b8" }}>
                    No template documents configured. Click &quot;Upload Document&quot; to add documents.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="target-table-row">
                    <td>
                      <div className="target-table-name-cell">
                        <div className="td-doc-icon-box">
                          <FileText size={18} className="text-blue-600" />
                        </div>
                        <div className="target-table-name-info">
                          <span className="target-table-title">{doc.name || "Unnamed document"}</span>
                          <span className="target-table-desc">Standard template attachment</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="target-project-type-pill">{doc.type || "—"}</span>
                    </td>
                    <td>
                      <span className="cell-muted font-mono text-xs">{doc.format || "—"}</span>
                    </td>
                    <td>
                      <span className="target-table-version-text">{doc.version || "—"}</span>
                    </td>
                    <td>
                      <span className="cell-muted text-xs">
                        {new Intl.DateTimeFormat("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(doc.updatedAt || Date.now()))}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          className="target-card-menu-btn"
                          title="Download Document"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          className="target-card-menu-btn text-red-500"
                          title="Remove Document"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Document Modal */}
      {isModalOpen && (
        <div className="td-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="td-modal-content"
            style={{ maxWidth: 440, background: "#ffffff", borderRadius: 12, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Add Document Requirement
              </h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                  Document Name *
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Master Service Agreement, Client Questionnaire"
                  className="td-form-input"
                  style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                    Type
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                  >
                    <option value="Contract">Contract</option>
                    <option value="Specification">Specification</option>
                    <option value="Questionnaire">Questionnaire</option>
                    <option value="Signoff Form">Signoff Form</option>
                    <option value="Drawings">Drawings</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                    Format
                  </label>
                  <select
                    value={docFormat}
                    onChange={(e) => setDocFormat(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOCX">DOCX</option>
                    <option value="XLSX">XLSX</option>
                    <option value="DWG">DWG</option>
                    <option value="ZIP">ZIP</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                  Version
                </label>
                <input
                  type="text"
                  value={docVersion}
                  onChange={(e) => setDocVersion(e.target.value)}
                  placeholder="e.g. v1.0"
                  className="td-form-input"
                  style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="template-btn-secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="template-btn-primary"
                onClick={handleAddDocument}
                disabled={!docName.trim() || saving}
              >
                {saving ? "Saving..." : "Add Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
