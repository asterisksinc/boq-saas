"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { FolderFileIcon } from "./FolderFileIcon";
import { getApiErrorMessage } from "@/lib/api/auth";

interface DeleteModalProps {
    title: string;
    description: string;
    label: string;
    info?: string;
    onClose: () => void;
    onDelete: () => Promise<void>;
}

export default function DeleteModal({
    title,
    description,
    label,
    info,
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
        <div className="document-modal-backdrop" onClick={onClose}>
            <div
                className="document-modal delete-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-dialog-title"
            >
                <div className="delete-icon">
                    <Trash2 size={24} />
                </div>
                <h2 id="delete-dialog-title">{title}</h2>
                <p>{description}</p>
                {error && <p className="documents-error" role="alert">{error}</p>}
                <div className="delete-target">
                    <FolderFileIcon />
                    <div className="delete-target-info">
                        <strong>{label}</strong>
                        {info && <small>{info}</small>}
                    </div>
                </div>
                <label className="delete-check">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => setChecked(event.target.checked)}
                        disabled={busy}
                    />
                    <span>I understand this action cannot be undone</span>
                </label>
                <div className="delete-modal-actions">
                    <button
                        type="button"
                        className="delete-cancel-btn"
                        onClick={onClose}
                        disabled={busy}
                    >
                        No, Keep It.
                    </button>
                    <button
                        type="button"
                        className="delete-confirm-btn"
                        disabled={!checked || busy}
                        onClick={() => void confirm()}
                    >
                        {busy ? "Deleting..." : "Yes, Delete!"}
                    </button>
                </div>
            </div>
        </div>
    );
}
