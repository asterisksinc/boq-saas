"use client";

import React, { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { FolderFileIcon } from "./FolderFileIcon";
import { getApiErrorMessage } from "@/lib/api/auth";

interface DeleteModalProps {
    title: string;
    description: string;
    label: string;
    info?: string;
    type?: "folder" | "file";
    onClose: () => void;
    onDelete: () => Promise<void>;
}

export default function DeleteModal({
    title,
    description,
    label,
    info,
    type = "folder",
    onClose,
    onDelete,
}: DeleteModalProps) {
    const [checked, setChecked] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function confirm() {
        if (!checked || busy) return;
        setBusy(true);
        setError("");
        try {
            await onDelete();
        } catch (deleteError) {
            setError(getApiErrorMessage(deleteError));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="doc-modal-backdrop" onClick={onClose}>
            <div
                className="doc-delete-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-dialog-title"
            >
                <div className="doc-delete-inner">
                    <div className="doc-delete-icon">
                        <Trash2 size={28} />
                    </div>

                    <div className="doc-delete-text">
                        <h2 id="delete-dialog-title" className="doc-delete-title">{title}</h2>
                        <p className="doc-delete-desc">{description}</p>
                    </div>

                    {error && (
                        <div className="doc-error-banner" style={{ width: "100%", margin: 0 }}>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="doc-delete-target">
                        <FolderFileIcon type={type} fileName={label} />
                        <div className="doc-delete-target-info">
                            <strong>{label}</strong>
                            {info && <small>{info}</small>}
                        </div>
                    </div>

                    <label className="doc-delete-check">
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => setChecked(event.target.checked)}
                            disabled={busy}
                        />
                        <span>I understand this action cannot be undone</span>
                    </label>
                </div>

                <div className="doc-delete-actions">
                    <button
                        type="button"
                        className="doc-delete-cancel-btn"
                        onClick={onClose}
                        disabled={busy}
                    >
                        No, Keep It.
                    </button>
                    <button
                        type="button"
                        className="doc-delete-confirm-btn"
                        disabled={!checked || busy}
                        onClick={() => void confirm()}
                    >
                        {busy ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <Loader2 size={16} className="animate-spin" />
                                Deleting...
                            </span>
                        ) : (
                            "Yes, Delete!"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
