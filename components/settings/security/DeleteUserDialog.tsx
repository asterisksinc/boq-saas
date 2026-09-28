"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { WorkspaceUserItem, deleteWorkspaceUser } from "@/lib/api/auth";

interface DeleteUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    user: WorkspaceUserItem | null;
}

export default function DeleteUserDialog({
    isOpen,
    onClose,
    onSuccess,
    user,
}: DeleteUserDialogProps) {
    const [deleting, setDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen || !user) return null;

    const handleDelete = async () => {
        setDeleting(true);
        setErrorMessage(null);
        try {
            await deleteWorkspaceUser(user.id);
            onSuccess(`User ${user.displayName} has been removed from the workspace.`);
            onClose();
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to remove user.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="security-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
            <div className="security-modal-box" style={{ maxWidth: 440 }}>
                <div className="security-modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: "#fee2e2",
                                color: "#dc2626",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <AlertTriangle size={18} />
                        </div>
                        <h3 id="delete-dialog-title" className="security-modal-title">
                            Delete User?
                        </h3>
                    </div>
                    <button
                        type="button"
                        className="security-modal-close-btn"
                        onClick={onClose}
                        disabled={deleting}
                    >
                        <X size={18} />
                    </button>
                </div>

                {errorMessage && (
                    <div className="notice-banner error" role="alert" style={{ marginBottom: 16 }}>
                        <span>{errorMessage}</span>
                    </div>
                )}

                <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.5, margin: "0 0 20px 0" }}>
                    Are you sure you want to remove <strong>{user.displayName}</strong> from the workspace? They will lose
                    access to all workspace resources, projects, and permissions.
                </p>

                <div className="security-modal-footer">
                    <button
                        type="button"
                        className="security-modal-btn-cancel"
                        onClick={onClose}
                        disabled={deleting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="security-modal-btn-danger"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <>
                                <Loader2 size={15} className="spin" />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            <span>Delete User</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
