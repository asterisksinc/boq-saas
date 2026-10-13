"use client";

import React, { useState } from "react";
import { Eye, MoreHorizontal, Trash2, Upload } from "lucide-react";
import { DocumentItem, formatDate, formatSize } from "./types";
import { FolderFileIcon } from "./FolderFileIcon";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";

interface DocumentListProps {
    documents: DocumentItem[];
    view: "list" | "grid";
    onMenu: (id: string) => void;
    menuId: string | null;
    onDelete: (document: DocumentItem) => void;
    onUpload: () => void;
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
    onDelete,
    onUpload,
}: DocumentListProps) {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    async function viewDocument(document: DocumentItem) {
        if (downloadingId) return;
        setDownloadingId(document.id);
        try {
            const result = await apiJson<{ url: string }>(
                `/api/v1/documents/${document.id}/download`,
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

    if (documents.length === 0) {
        return (
            <div className="documents-empty-state">
                <FolderFileIcon />
                <h3>No files in this folder</h3>
                <p>Upload documents or assets to organize them here.</p>
                <button type="button" className="documents-primary" onClick={onUpload}>
                    <Upload size={16} /> Upload Files
                </button>
            </div>
        );
    }

    if (view === "grid") {
        return (
            <div className="folder-grid-view">
                {documents.map((doc) => (
                    <article
                        className="folder-grid-card"
                        key={doc.id}
                        onDoubleClick={() => void viewDocument(doc)}
                    >
                        <div className="folder-grid-card-top">
                            <button
                                type="button"
                                className="folder-icon-btn"
                                onClick={() => void viewDocument(doc)}
                            >
                                <FolderFileIcon />
                            </button>
                            <div className="documents-col-action">
                                <button
                                    type="button"
                                    className="document-menu-button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onMenu(doc.id);
                                    }}
                                    aria-label={`Actions for ${doc.name}`}
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                {menuId === doc.id && (
                                    <div
                                        className="document-menu"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button type="button" onClick={() => void viewDocument(doc)}>
                                            <Eye size={15} /> <span>View</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={() => onDelete(doc)}
                                        >
                                            <Trash2 size={15} /> <span>Delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="folder-grid-info" onClick={() => void viewDocument(doc)}>
                            <strong className="folder-grid-name">{doc.name}</strong>
                            <span className="folder-grid-meta">{doc.projectName || "General"}</span>
                            <div className="folder-grid-footer">
                                <span>{formatSize(doc.sizeBytes)}</span>
                                <time>{formatDate(doc.updatedAt)}</time>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        );
    }

    return (
        <div className="documents-table-wrapper">
            <div className="documents-table-card">
                <div className="documents-table-header">
                    <span className="th-name">NAME</span>
                    <span className="th-items">PROJECT</span>
                    <span className="th-size">SIZE</span>
                    <span className="th-date">LAST MODIFIED</span>
                    <span className="th-action"></span>
                </div>
                <div className="documents-table-body">
                    {documents.map((doc) => (
                        <div
                            className="documents-table-row"
                            key={doc.id}
                            onDoubleClick={() => void viewDocument(doc)}
                        >
                            <div
                                className="documents-col-name"
                                onClick={() => void viewDocument(doc)}
                            >
                                <FolderFileIcon />
                                <span className="documents-item-name">{doc.name}</span>
                            </div>
                            <div className="documents-col-items">
                                {doc.projectName || "General"}
                            </div>
                            <div className="documents-col-size">
                                {formatSize(doc.sizeBytes)}
                            </div>
                            <div className="documents-col-date">
                                {formatDate(doc.updatedAt)}
                            </div>
                            <div className="documents-col-action">
                                <button
                                    type="button"
                                    className="document-menu-button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onMenu(doc.id);
                                    }}
                                    aria-label={`Actions for ${doc.name}`}
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                {menuId === doc.id && (
                                    <div
                                        className="document-menu"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button type="button" onClick={() => void viewDocument(doc)}>
                                            <Eye size={15} /> <span>View</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={() => onDelete(doc)}
                                        >
                                            <Trash2 size={15} /> <span>Delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
