"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";

interface FolderModalProps {
    onClose: () => void;
    onCreated: () => void;
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
            onCreated();
        } catch (submitError) {
            setError(getApiErrorMessage(submitError));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="document-modal-backdrop" onClick={onClose}>
            <form
                className="document-modal small"
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
                <h2>New Folder</h2>
                {error && <p className="documents-error" role="alert">{error}</p>}
                <label>
                    Folder Name{" "}
                    <input
                        required
                        autoFocus
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="ex. Projects"
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
                        disabled={loading || !name.trim()}
                    >
                        {loading ? "Creating..." : "Create Folder"}
                    </button>
                </footer>
            </form>
        </div>
    );
}
