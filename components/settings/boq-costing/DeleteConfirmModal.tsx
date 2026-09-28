"use client";

import { useEffect } from "react";
import { Loader2, Trash2, X } from "lucide-react";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    title: string;
    itemName: string;
    description?: string;
    deleting: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export default function DeleteConfirmModal({
    isOpen,
    title,
    itemName,
    description,
    deleting,
    onClose,
    onConfirm,
}: DeleteConfirmModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !deleting) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, deleting, onClose]);

    if (!isOpen) return null;

    return (
        <div className="boq-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
            <div className="boq-modal-container" style={{ maxWidth: "420px" }}>
                <div className="boq-modal-header">
                    <h3 id="delete-dialog-title" className="boq-modal-title" style={{ color: "#b91c1c" }}>
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="boq-modal-close"
                        aria-label="Close modal"
                        disabled={deleting}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="boq-modal-body">
                    <p style={{ margin: 0, color: "#475569", fontSize: "13.5px", lineHeight: "1.5" }}>
                        Are you sure you want to delete <strong style={{ color: "#0f172a" }}>{itemName}</strong>?
                    </p>
                    {description && (
                        <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "12.5px", lineHeight: "1.4" }}>
                            {description}
                        </p>
                    )}
                </div>

                <div className="boq-modal-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        className="boq-modal-btn-cancel"
                        disabled={deleting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="boq-btn-danger"
                        disabled={deleting}
                    >
                        {deleting ? (
                            <Loader2 size={16} className="spin" aria-hidden="true" />
                        ) : (
                            <Trash2 size={16} aria-hidden="true" />
                        )}
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
