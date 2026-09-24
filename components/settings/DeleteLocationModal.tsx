"use client";

import { useEffect } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { OrganizationLocation } from "@/lib/api/auth";

interface DeleteLocationModalProps {
    isOpen: boolean;
    location: OrganizationLocation | null;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

export default function DeleteLocationModal({
    isOpen,
    location,
    onClose,
    onConfirm,
    isDeleting,
}: DeleteLocationModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !isDeleting) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isDeleting, onClose]);

    if (!isOpen || !location) return null;

    return (
        <div className="org-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-loc-title">
            <div className="org-modal-container org-delete-modal-container">
                {/* Destructive Icon Container (68x68 circle, #FEF2F2, red icon) */}
                <div className="org-delete-icon-wrapper" aria-hidden="true">
                    <Trash2 size={28} className="org-delete-trash-icon" />
                </div>

                {/* Modal Title & Description */}
                <h3 id="delete-loc-title" className="org-delete-modal-title">
                    Delete Location?
                </h3>
                <p className="org-delete-modal-desc">
                    This location will be permanently deleted from &quot;Locations&quot;. This action cannot be undone.
                </p>

                {/* Actions: Cancel | Archive */}
                <div className="org-delete-modal-actions">
                    <button
                        type="button"
                        onClick={onClose}
                        className="org-modal-btn-cancel org-delete-btn-cancel"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="org-delete-btn-archive"
                        disabled={isDeleting}
                    >
                        {isDeleting && <Loader2 size={16} className="spin" aria-hidden="true" />}
                        <span>Archive</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
