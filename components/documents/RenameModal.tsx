"use client";

import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/auth";

interface RenameModalProps {
    title: string;
    initialName: string;
    onClose: () => void;
    onRename: (newName: string) => Promise<void>;
}

export default function RenameModal({
    title,
    initialName,
    onClose,
    onRename,
}: RenameModalProps) {
    const [name, setName] = useState(initialName);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError("Name cannot be empty.");
            return;
        }

        if (trimmed === initialName) {
            onClose();
            return;
        }

        setLoading(true);
        setError("");
        try {
            await onRename(trimmed);
            onClose();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="doc-modal-backdrop" onClick={onClose}>
            <form
                className="doc-modal small"
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="rename-modal-title"
            >
                <div className="doc-modal-header">
                    <h2 id="rename-modal-title" className="doc-modal-title">{title}</h2>
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
                        <label htmlFor="rename-input" className="doc-field-label">
                            New Name <span className="doc-field-required">*</span>
                        </label>
                        <input
                            id="rename-input"
                            className="doc-field-input"
                            autoFocus
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                                <span>Saving...</span>
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
