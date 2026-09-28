"use client";

import { FormEvent, useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import {
    WorkspaceRoleItem,
    createWorkspaceRole,
    updateWorkspaceRole,
} from "@/lib/api/auth";

interface RoleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    roleToEdit?: WorkspaceRoleItem | null;
}

export default function RoleFormModal({
    isOpen,
    onClose,
    onSuccess,
    roleToEdit,
}: RoleFormModalProps) {
    const isEditing = Boolean(roleToEdit);
    const [name, setName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        if (roleToEdit) {
            setName(roleToEdit.name || "");
        } else {
            setName("");
        }
        setErrorMessage(null);
    }, [isOpen, roleToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        const trimmed = name.trim();
        if (!trimmed) {
            setErrorMessage("Role Name is required.");
            return;
        }

        setSubmitting(true);
        try {
            if (isEditing && roleToEdit) {
                await updateWorkspaceRole(roleToEdit.id, { name: trimmed });
                onSuccess(`Role "${trimmed}" updated successfully.`);
            } else {
                await createWorkspaceRole({ name: trimmed });
                onSuccess(`Role "${trimmed}" created successfully.`);
            }
            onClose();
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to save role.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="security-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
            <div className="security-modal-box">
                <div className="security-modal-header">
                    <div>
                        <h3 id="role-modal-title" className="security-modal-title">
                            {isEditing ? "Edit Role" : "Add Role"}
                        </h3>
                        <p className="security-modal-desc">
                            {isEditing
                                ? "Update the role name and information."
                                : "Create a new role and set the basic information."}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="security-modal-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                        disabled={submitting}
                    >
                        <X size={18} />
                    </button>
                </div>

                {errorMessage && (
                    <div className="notice-banner error" role="alert" style={{ marginBottom: 16 }}>
                        <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="security-modal-field full-width" style={{ marginBottom: 20 }}>
                        <label className="security-modal-label">
                            Role Name <span className="req">*</span>
                        </label>
                        <input
                            type="text"
                            className="security-modal-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Marketing Manager"
                            disabled={submitting}
                            autoFocus
                        />
                    </div>

                    <div className="security-modal-footer">
                        <button
                            type="button"
                            className="security-modal-btn-cancel"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="security-modal-btn-save"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={15} className="spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>Save Role</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
