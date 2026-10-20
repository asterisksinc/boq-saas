"use client";

import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";

interface FolderModalProps {
    onClose: () => void;
    onCreated: (folderName: string) => void;
    parentId: string | null;
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

export default function FolderModal({
    onClose,
    onCreated,
    parentId,
}: FolderModalProps) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError("Folder name is required.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            await apiJson("/api/v1/document-folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmed, parentId }),
            });
            onCreated(trimmed);
        } catch (submitError) {
            setError(getApiErrorMessage(submitError));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="doc-modal-backdrop" onClick={onClose}>
            <form
                className="doc-modal small"
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="folder-modal-title"
            >
                <div className="doc-modal-header">
                    <h2 id="folder-modal-title" className="doc-modal-title">New Folder</h2>
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
                        <label htmlFor="folder-name-input" className="doc-field-label">
                            Folder Name <span className="doc-field-required">*</span>
                        </label>
                        <input
                            id="folder-name-input"
                            className="doc-field-input"
                            required
                            autoFocus
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="ex. Projects"
                            disabled={loading}
                        />
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
                        disabled={loading || !name.trim()}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Creating...</span>
                            </>
                        ) : (
                            "Create Folder"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
