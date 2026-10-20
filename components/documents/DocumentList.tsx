"use client";

import React, { useState } from "react";
import {
    Download,
    Eye,
    FileUp,
    MoreHorizontal,
    Pencil,
    Trash2,
    Upload,
} from "lucide-react";
import { DocumentItem, formatDate, formatSize } from "./types";
import { FolderFileIcon } from "./FolderFileIcon";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";

interface DocumentListProps {
    documents: DocumentItem[];
    view: "list" | "grid";
    onMenu: (id: string) => void;
    menuId: string | null;
    onRename: (document: DocumentItem) => void;
    onDelete: (document: DocumentItem) => void;
    onUpload: () => void;
    searchQuery?: string;
}

async function apiJson<T>(url: string, init?: RequestInit) {
    const response = await fetch(url, {
        ...init,
        credentials: "include",
        cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getApiErrorMessage(payload));
    return parseApiResponse<T>(payload);
}

export default function DocumentList({
    documents,
    view,
    onMenu,
    menuId,
    onRename,
    onDelete,
    onUpload,
    searchQuery = "",
}: DocumentListProps) {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    async function viewDocument(doc: DocumentItem) {
        if (downloadingId) return;
        setDownloadingId(doc.id);
        try {
            const result = await apiJson<{ url: string }>(
                `/api/v1/documents/${doc.id}/download`,
            );
            if (result?.url) {
                window.open(result.url, "_blank", "noopener,noreferrer");
            }
        } catch (err) {
            console.error("Failed to view document:", err);
            alert(getApiErrorMessage(err));
        } finally {
            setDownloadingId(null);
        }
    }

    async function downloadDocument(doc: DocumentItem) {
        if (downloadingId) return;
        setDownloadingId(doc.id);
        try {
            const result = await apiJson<{ url: string; fileName?: string }>(
                `/api/v1/documents/${doc.id}/download`,
            );
            if (result?.url) {
                const link = document.createElement("a");
                link.href = result.url;
                link.download = result.fileName || doc.name;
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (err) {
            console.error("Failed to download document:", err);
            alert(getApiErrorMessage(err));
        } finally {
            setDownloadingId(null);
        }
    }

    if (documents.length === 0) {
        return (
            <div className="doc-empty-state">
                <div className="doc-empty-icon">
                    <FileUp size={28} />
                </div>
                <h3>{searchQuery ? "No matching files" : "No files in this folder"}</h3>
                <p>
                    {searchQuery
                        ? `No files match “${searchQuery}”. Try searching with a different term.`
                        : "Upload documents, proposals, drawings, or spreadsheets to keep them organized here."}
                </p>
                <button
                    type="button"
                    className="btn-doc-new-folder"
                    onClick={onUpload}
                >
                    <Upload size={18} />
                    <span>Upload Files</span>
                </button>
            </div>
        );
    }

    if (view === "grid") {
        return (
            <div className="doc-grid-container folder-grid-view" role="grid" aria-label="Documents grid">
                {documents.map((doc) => {
                    const isMenuOpen = menuId === doc.id;
                    return (
                        <article
                            key={doc.id}
                            className="doc-grid-card folder-grid-card"
                            onClick={() => void viewDocument(doc)}
                            tabIndex={0}
                            role="gridcell"
                            aria-label={`Document ${doc.name}`}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") void viewDocument(doc);
                            }}
                        >
                            <div className="doc-grid-card-top">
                                <div
                                    style={{ cursor: "pointer" }}
                                    title="View Document"
                                >
                                    <FolderFileIcon
                                        type="file"
                                        fileName={doc.name}
                                        mimeType={doc.mimeType}
                                    />
                                </div>
                                <div style={{ position: "relative" }}>
                                    <button
                                        type="button"
                                        className="doc-action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMenu(doc.id);
                                        }}
                                        aria-label={`Actions for ${doc.name}`}
                                        aria-haspopup="true"
                                        aria-expanded={isMenuOpen}
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>

                                    {isMenuOpen && (
                                        <div
                                            className="doc-menu-popover"
                                            onClick={(e) => e.stopPropagation()}
                                            role="menu"
                                        >
                                            <button
                                                type="button"
                                                className="doc-menu-item"
                                                onClick={() => void viewDocument(doc)}
                                                role="menuitem"
                                            >
                                                <Eye size={18} />
                                                <span>View File</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="doc-menu-item"
                                                onClick={() => void downloadDocument(doc)}
                                                role="menuitem"
                                            >
                                                <Download size={18} />
                                                <span>Download</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="doc-menu-item"
                                                onClick={() => onRename(doc)}
                                                role="menuitem"
                                            >
                                                <Pencil size={18} />
                                                <span>Rename</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="doc-menu-item danger"
                                                onClick={() => onDelete(doc)}
                                                role="menuitem"
                                            >
                                                <Trash2 size={18} />
                                                <span>Delete File</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="doc-grid-info">
                                <strong className="doc-grid-name" title={doc.name}>
                                    {doc.name}
                                </strong>
                                <div className="doc-grid-row-2">
                                    <span className="doc-grid-meta" title={doc.projectName || "General"}>
                                        {doc.projectName || "General"}
                                    </span>
                                    <span className="doc-grid-date-size">
                                        {formatDate(doc.updatedAt)} | {formatSize(doc.sizeBytes)}
                                    </span>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="doc-table-scroll">
            <div className="doc-table" role="table" aria-label="Documents table">
                {/* Table Header */}
                <div className="doc-table-header" role="row">
                    <span className="doc-th-name" role="columnheader">NAME</span>
                    <span className="doc-th-items" role="columnheader">PROJECT</span>
                    <span className="doc-th-size" role="columnheader">SIZE</span>
                    <span className="doc-th-date" role="columnheader" title="LAST MODIFIED" aria-label="Last Modified">MODIFIED</span>
                    <span className="doc-th-action" role="columnheader"></span>
                </div>

                {/* Table Body */}
                <div className="doc-table-body" role="rowgroup">
                    {documents.map((doc, index) => {
                        const isMenuOpen = menuId === doc.id;
                        return (
                            <React.Fragment key={doc.id}>
                                <div
                                    className={`doc-table-row ${isMenuOpen ? "menu-open" : ""}`}
                                    onDoubleClick={() => void viewDocument(doc)}
                                    role="row"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") void viewDocument(doc);
                                    }}
                                >
                                    {/* Name cell with circle file icon */}
                                    <div
                                        className="doc-td-name"
                                        onClick={() => void viewDocument(doc)}
                                        role="cell"
                                    >
                                        <FolderFileIcon
                                            type="file"
                                            fileName={doc.name}
                                            mimeType={doc.mimeType}
                                        />
                                        <span className="doc-name-text" title={doc.name}>
                                            {doc.name}
                                        </span>
                                    </div>

                                    {/* Project cell */}
                                    <div
                                        className="doc-td-items"
                                        onClick={() => void viewDocument(doc)}
                                        role="cell"
                                    >
                                        {doc.projectName || "General"}
                                    </div>

                                    {/* Size cell */}
                                    <div
                                        className="doc-td-size"
                                        onClick={() => void viewDocument(doc)}
                                        role="cell"
                                    >
                                        {formatSize(doc.sizeBytes)}
                                    </div>

                                    {/* Date cell */}
                                    <div
                                        className="doc-td-date"
                                        onClick={() => void viewDocument(doc)}
                                        role="cell"
                                    >
                                        {formatDate(doc.updatedAt)}
                                    </div>

                                    {/* Action cell */}
                                    <div className="doc-td-action" role="cell">
                                        <button
                                            type="button"
                                            className="doc-action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMenu(doc.id);
                                            }}
                                            aria-label={`Actions for ${doc.name}`}
                                            aria-haspopup="true"
                                            aria-expanded={isMenuOpen}
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>

                                        {isMenuOpen && (
                                            <div
                                                className="doc-menu-popover"
                                                onClick={(e) => e.stopPropagation()}
                                                role="menu"
                                            >
                                                <button
                                                    type="button"
                                                    className="doc-menu-item"
                                                    onClick={() => void viewDocument(doc)}
                                                    role="menuitem"
                                                >
                                                    <Eye size={18} />
                                                    <span>View File</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="doc-menu-item"
                                                    onClick={() => void downloadDocument(doc)}
                                                    role="menuitem"
                                                >
                                                    <Download size={18} />
                                                    <span>Download</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="doc-menu-item"
                                                    onClick={() => onRename(doc)}
                                                    role="menuitem"
                                                >
                                                    <Pencil size={18} />
                                                    <span>Rename</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="doc-menu-item danger"
                                                    onClick={() => onDelete(doc)}
                                                    role="menuitem"
                                                >
                                                    <Trash2 size={18} />
                                                    <span>Delete File</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Divider */}
                                {index < documents.length - 1 && (
                                    <hr className="doc-row-divider" aria-hidden="true" />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
