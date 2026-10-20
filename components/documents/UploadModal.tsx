"use client";

import React, { useState } from "react";
import { Loader2, Trash2, Upload, X } from "lucide-react";
import { FolderItem, formatSize } from "./types";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";

interface UploadModalProps {
    folders: FolderItem[];
    selectedFolder: FolderItem | null;
    onClose: () => void;
    onUploaded: (count: number) => void;
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

export default function UploadModal({
    folders,
    selectedFolder,
    onClose,
    onUploaded,
}: UploadModalProps) {
    const [folderId, setFolderId] = useState(
        selectedFolder?.id || folders[0]?.id || "",
    );
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");
    const [error, setError] = useState("");

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const dropped = Array.from(e.dataTransfer.files);
            setFiles((prev) => [...prev, ...dropped]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selected = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...selected]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        if (files.length === 0 || !folderId) {
            setError("Please select a target folder and choose at least one file to upload.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setUploadProgress(`Uploading ${i + 1} of ${files.length} (${file.name})...`);
                const form = new FormData();
                form.append("folderId", folderId);
                form.append("file", file);

                await apiJson("/api/v1/documents/upload", {
                    method: "POST",
                    body: form,
                });
            }

            onUploaded(files.length);
        } catch (submitError) {
            setError(getApiErrorMessage(submitError));
        } finally {
            setLoading(false);
            setUploadProgress("");
        }
    }

    return (
        <div className="doc-modal-backdrop" onClick={onClose}>
            <form
                className="doc-modal upload-modal"
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="upload-modal-title"
            >
                <div className="doc-modal-header">
                    <h2 id="upload-modal-title" className="doc-modal-title">Upload Files</h2>
                    <button
                        type="button"
                        className="doc-modal-close"
                        onClick={onClose}
                        aria-label="Close dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="doc-modal-inner">
                    {error && (
                        <div className="doc-error-banner" style={{ width: "100%", margin: 0 }}>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="doc-form-group">
                        <label htmlFor="upload-folder-select" className="doc-field-label">
                            Upload to <span className="doc-field-required">*</span>
                        </label>
                        <select
                            id="upload-folder-select"
                            className="doc-field-select"
                            value={folderId}
                            onChange={(event) => setFolderId(event.target.value)}
                            disabled={loading}
                        >
                            {folders.map((folder) => (
                                <option key={folder.id} value={folder.id}>
                                    {folder.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="doc-form-group">
                        <div
                            className={`doc-upload-drop ${isDragging ? "dragging" : ""}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                multiple
                                onChange={handleFileInput}
                                disabled={loading}
                                aria-label="Choose files to upload"
                            />
                            <div className="doc-upload-icon-sq">
                                <Upload size={20} color="#64748B" />
                            </div>
                            <div className="doc-upload-text">
                                <strong>Drop files here</strong>
                                <small>or click to browse your computer</small>
                            </div>
                        </div>

                        {files.length > 0 && (
                            <div className="doc-upload-file-list" aria-label="Selected files">
                                {files.map((file, idx) => (
                                    <div key={`${file.name}-${idx}`} className="doc-upload-file-item">
                                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                            <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {file.name}
                                            </span>
                                            <span style={{ fontSize: 11, color: "#64748B" }}>
                                                {formatSize(file.size)}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(idx)}
                                            disabled={loading}
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="doc-modal-actions">
                    <button
                        type="button"
                        className="doc-modal-btn-cancel"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="doc-modal-btn-primary"
                        disabled={loading || files.length === 0 || !folderId}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>{uploadProgress || "Uploading..."}</span>
                            </>
                        ) : (
                            "Save & Upload"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
