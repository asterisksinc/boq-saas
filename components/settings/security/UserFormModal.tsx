"use client";

import { FormEvent, useEffect, useState } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import {
    WorkspaceUserItem,
    WorkspaceRoleItem,
    createWorkspaceUser,
    updateWorkspaceUser,
} from "@/lib/api/auth";

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    userToEdit?: WorkspaceUserItem | null;
    availableRoles: WorkspaceRoleItem[];
}

export default function UserFormModal({
    isOpen,
    onClose,
    onSuccess,
    userToEdit,
    availableRoles,
}: UserFormModalProps) {
    const isEditing = Boolean(userToEdit);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        if (userToEdit) {
            setFirstName(userToEdit.firstName || "");
            setLastName(userToEdit.lastName || "");
            setEmail(userToEdit.email || "");
            setPhone(userToEdit.phone || "");
            setRole(userToEdit.role || (availableRoles[0]?.name ?? "Member"));
        } else {
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
            setRole(availableRoles[0]?.name ?? "Technician");
        }
        setErrorMessage(null);
    }, [isOpen, userToEdit, availableRoles]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        // Validation
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        const trimmedEmail = email.trim();
        const trimmedPhone = phone.trim();
        const trimmedRole = role.trim();

        if (!trimmedFirst) {
            setErrorMessage("First Name is required.");
            return;
        }
        if (!trimmedLast) {
            setErrorMessage("Last Name is required.");
            return;
        }
        if (!trimmedEmail) {
            setErrorMessage("Email is required.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setErrorMessage("Please enter a valid email address.");
            return;
        }
        if (!trimmedPhone) {
            setErrorMessage("Phone number is required.");
            return;
        }
        if (!trimmedRole) {
            setErrorMessage("Role is required.");
            return;
        }

        setSubmitting(true);
        try {
            if (isEditing && userToEdit) {
                await updateWorkspaceUser(userToEdit.id, {
                    firstName: trimmedFirst,
                    lastName: trimmedLast,
                    email: trimmedEmail,
                    phone: trimmedPhone,
                    role: trimmedRole,
                });
                onSuccess(`User ${trimmedFirst} ${trimmedLast} updated successfully.`);
            } else {
                await createWorkspaceUser({
                    firstName: trimmedFirst,
                    lastName: trimmedLast,
                    email: trimmedEmail,
                    phone: trimmedPhone,
                    role: trimmedRole,
                });
                onSuccess(`User ${trimmedFirst} ${trimmedLast} added successfully.`);
            }
            onClose();
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to save user. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="security-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
            <div className="security-modal-box" data-testid="add-user-modal">
                <div className="security-modal-header">
                    <div className="security-modal-header-text">
                        <h3 id="user-modal-title" className="security-modal-title">
                            {isEditing ? "Edit User" : "Add User"}
                        </h3>
                        <p className="security-modal-desc">
                            {isEditing
                                ? "Update user information and access permissions."
                                : "Create a new user and assign their access."}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="security-modal-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                        disabled={submitting}
                    >
                        <X size={24} />
                    </button>
                </div>

                {errorMessage && (
                    <div className="notice-banner error" role="alert" style={{ width: "100%", margin: 0 }}>
                        <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="security-modal-form-wrapper">
                    <div className="security-modal-inner-card">
                        {/* Row 1: First Name & Last Name */}
                        <div className="security-modal-row">
                            <div className="security-modal-field">
                                <label className="security-modal-label">
                                    First Name <span className="req">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="security-modal-input"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="e.g. Robert"
                                    disabled={submitting}
                                    autoFocus
                                />
                            </div>

                            <div className="security-modal-field">
                                <label className="security-modal-label">
                                    Last Name <span className="req">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="security-modal-input"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="e.g. Fox"
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* Row 2: Email & Phone */}
                        <div className="security-modal-row">
                            <div className="security-modal-field">
                                <label className="security-modal-label">
                                    Email <span className="req">*</span>
                                </label>
                                <input
                                    type="email"
                                    className="security-modal-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="bill.sanders@example.com"
                                    disabled={submitting}
                                />
                            </div>

                            <div className="security-modal-field">
                                <label className="security-modal-label">
                                    Phone <span className="req">*</span>
                                </label>
                                <input
                                    type="tel"
                                    className="security-modal-input"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="(406) 555-0120"
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* Row 3: Role Field */}
                        <div className="security-modal-field full-width">
                            <label className="security-modal-label">
                                Role <span className="req">*</span>
                            </label>
                            <div className="security-modal-select-wrap">
                                <select
                                    className="security-modal-select"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    disabled={submitting}
                                >
                                    {availableRoles.map((r) => (
                                        <option key={r.id} value={r.name}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={20} className="security-modal-select-icon" aria-hidden="true" />
                            </div>
                        </div>
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
                                    <Loader2 size={16} className="spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>Save User</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
