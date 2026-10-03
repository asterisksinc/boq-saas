"use client";

import React, { useState } from "react";
import { FileText, Plus, Download, Trash2, Eye } from "lucide-react";
import { mockDocuments, MockDocument } from "@/lib/templates/mock-data";

interface TemplateDocumentsProps {
  templateId: string;
  initialDocuments?: MockDocument[];
  onUpdate?: () => void;
}

export default function TemplateDocuments({
  templateId,
  initialDocuments,
  onUpdate,
}: TemplateDocumentsProps) {
  const documents =
    initialDocuments && initialDocuments.length > 0
      ? initialDocuments
      : mockDocuments;

  return (
    <div className="td-doc-wrapper">
      <div className="td-doc-header">
        <div>
          <h3 className="td-doc-title">Template Documents ({documents.length})</h3>
          <p className="td-doc-sub">
            Contract templates, client questionnaires, specifications, and signoff forms.
          </p>
        </div>
        <button type="button" className="td-add-doc-btn">
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
              {documents.map((doc) => (
                <tr key={doc.id} className="target-table-row">
                  <td>
                    <div className="target-table-name-cell">
                      <div className="td-doc-icon-box">
                        <FileText size={18} className="text-blue-600" />
                      </div>
                      <div className="target-table-name-info">
                        <span className="target-table-title">{doc.name}</span>
                        <span className="target-table-desc">Standard template attachment</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="target-project-type-pill">{doc.type}</span>
                  </td>
                  <td>
                    <span className="cell-muted font-mono text-xs">{doc.format}</span>
                  </td>
                  <td>
                    <span className="target-table-version-text">{doc.version}</span>
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
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
