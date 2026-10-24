"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface Props {
    title: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DisconnectModal({ title, loading = false, onConfirm, onCancel }: Props) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !loading) onCancel();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onCancel, loading]);

    return (
        <div className="intg-modal-backdrop" onClick={() => !loading && onCancel()} role="presentation">
            <div
                className="intg-modal-dialog intg-disconnect-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="disconnect-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="intg-modal-close"
                    onClick={onCancel}
                    disabled={loading}
                    aria-label="Close dialog"
                >
                    <X size={18} />
                </button>

                <div className="intg-disconnect-icon-wrap">
                    <AlertTriangle size={24} className="intg-disconnect-warning-icon" />
                </div>

                <h3 id="disconnect-title" className="intg-disconnect-heading">
                    Disconnect {title}?
                </h3>

                <p className="intg-disconnect-text">
                    Are you sure you want to disconnect <strong>{title}</strong>? This will stop receiving new leads,
                    halting automated delivery and synchronization with your BOQ SaaS account.
                </p>

                <div className="intg-disconnect-actions">
                    <button
                        type="button"
                        className="intg-btn intg-btn-modal-cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="intg-btn intg-btn-modal-danger"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Disconnecting...</span>
                            </>
                        ) : (
                            "Disconnect"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
