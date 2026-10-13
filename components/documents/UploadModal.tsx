"use client";

import React, { useState } from "react";
import { Upload, X } from "lucide-react";
import { FolderItem } from "./types";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";

interface UploadModalProps {
    folders: FolderItem[];
    selectedFolder: FolderItem | null;
    onClose: () => void;
    onUploaded: () => void;
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
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
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
            setFile(e.dataTransfer.files[0]);
        }
    };

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!file || !folderId) {
            setError("Please select a target folder and choose a file to upload.");
            return;
        }

        setLoading(true);
        setError("");
        const form = new FormData();
        form.append("folderId", folderId);
        form.append("file", file);

        try {
            await apiJson("/api/v1/documents/upload", {
                method: "POST",
                body: form,
            });
            onUploaded();
        } catch (submitError) {
            setError(getApiErrorMessage(submitError));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="document-modal-backdrop" onClick={onClose}>
            <form
                className="document-modal"
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="document-modal-close"
                    onClick={onClose}
                    aria-label="Close dialog"
                >
                    <X size={18} />
                </button>
                <h2>Upload Files</h2>
                {error && <p className="documents-error" role="alert">{error}</p>}
                <label>
                    Upload to{" "}
                    <select
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
                </label>
                <label
                    className={`upload-drop ${isDragging ? "dragging" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={isDragging ? { borderColor: "#2563eb", background: "#eff6ff" } : undefined}
                >
                    <Upload size={24} color="#64748B" />
                    <strong>{file ? file.name : "Drop files here"}</strong>
                    <small>or click to browse your computer</small>
                    <input
                        type="file"
                        onChange={(event) => setFile(event.target.files?.[0] || null)}
                        disabled={loading}
                    />
                </label>
                <footer>
                    <button type="button" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="documents-primary"
                        disabled={loading || !file || !folderId}
                    >
                        {loading ? "Uploading..." : "Save & Upload"}
                    </button>
                </footer>
            </form>
        </div>
    );
}
