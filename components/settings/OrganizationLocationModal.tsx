"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
    createOrganizationLocation,
    LocationCreateInput,
    LocationPatchInput,
    OrganizationLocation,
    updateOrganizationLocation,
} from "@/lib/api/auth";

interface OrganizationLocationModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    initialLocation: OrganizationLocation | null;
    onClose: () => void;
    onSuccess: (location: OrganizationLocation, mode: "create" | "edit") => void;
    showNotice: (message: string, type?: "success" | "error") => void;
}

export default function OrganizationLocationModal({
    isOpen,
    mode,
    initialLocation,
    onClose,
    onSuccess,
    showNotice,
}: OrganizationLocationModalProps) {
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [address, setAddress] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        if (mode === "edit" && initialLocation) {
            setName(initialLocation.name || "");
            setCity(initialLocation.city || "");
            setState(initialLocation.state || "");
            setAddress(initialLocation.address || "");
        } else {
            setName("");
            setCity("");
            setState("");
            setAddress("");
        }
        setFormErrors({});
    }, [isOpen, mode, initialLocation]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !submitting) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, submitting, onClose]);

    if (!isOpen) return null;

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!name.trim()) errors.name = "Location Name is required";
        if (!city.trim()) errors.city = "City is required";
        if (!state.trim()) errors.state = "State is required";
        if (!address.trim()) errors.address = "Address is required";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        setFormErrors({});

        try {
            if (mode === "create") {
                const payload: LocationCreateInput = {
                    name: name.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    address: address.trim(),
                };
                const created = await createOrganizationLocation(payload);
                showNotice("Location added successfully.", "success");
                onSuccess(created, "create");
            } else if (mode === "edit" && initialLocation) {
                const payload: LocationPatchInput = {
                    name: name.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    address: address.trim(),
                };
                const updated = await updateOrganizationLocation(initialLocation.id, payload);
                showNotice("Location updated successfully.", "success");
                onSuccess(updated, "edit");
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to save location.";
            showNotice(msg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="org-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="loc-modal-title">
            <div className="org-modal-container">
                {/* Modal Header */}
                <div className="org-modal-header">
                    <h3 id="loc-modal-title" className="org-modal-title">
                        {mode === "create" ? "Add Location" : "Edit Location"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="org-modal-close"
                        aria-label="Close modal"
                        disabled={submitting}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="org-modal-body">
                        {/* Row 1: Location Name * | City * */}
                        <div className="org-modal-grid">
                            <div className="org-field">
                                <label htmlFor="locName">
                                    Location Name <span className="required">*</span>
                                </label>
                                <input
                                    id="locName"
                                    type="text"
                                    className={`org-input ${formErrors.name ? "has-error" : ""}`}
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                                    }}
                                    placeholder="e.g. Head Office"
                                    disabled={submitting}
                                    required
                                    autoFocus
                                />
                                {formErrors.name && (
                                    <span className="org-field-error" role="alert">{formErrors.name}</span>
                                )}
                            </div>

                            <div className="org-field">
                                <label htmlFor="locCity">
                                    City <span className="required">*</span>
                                </label>
                                <input
                                    id="locCity"
                                    type="text"
                                    className={`org-input ${formErrors.city ? "has-error" : ""}`}
                                    value={city}
                                    onChange={(e) => {
                                        setCity(e.target.value);
                                        if (formErrors.city) setFormErrors((prev) => ({ ...prev, city: "" }));
                                    }}
                                    placeholder="e.g. Mumbai"
                                    disabled={submitting}
                                    required
                                />
                                {formErrors.city && (
                                    <span className="org-field-error" role="alert">{formErrors.city}</span>
                                )}
                            </div>
                        </div>

                        {/* Row 2: State * */}
                        <div className="org-field" style={{ marginTop: "14px" }}>
                            <label htmlFor="locState">
                                State <span className="required">*</span>
                            </label>
                            <input
                                id="locState"
                                type="text"
                                className={`org-input ${formErrors.state ? "has-error" : ""}`}
                                value={state}
                                onChange={(e) => {
                                    setState(e.target.value);
                                    if (formErrors.state) setFormErrors((prev) => ({ ...prev, state: "" }));
                                }}
                                placeholder="e.g. Maharashtra"
                                disabled={submitting}
                                required
                            />
                            {formErrors.state && (
                                <span className="org-field-error" role="alert">{formErrors.state}</span>
                            )}
                        </div>

                        {/* Row 3: Address * */}
                        <div className="org-field" style={{ marginTop: "14px" }}>
                            <label htmlFor="locAddress">
                                Address <span className="required">*</span>
                            </label>
                            <input
                                id="locAddress"
                                type="text"
                                className={`org-input ${formErrors.address ? "has-error" : ""}`}
                                value={address}
                                onChange={(e) => {
                                    setAddress(e.target.value);
                                    if (formErrors.address) setFormErrors((prev) => ({ ...prev, address: "" }));
                                }}
                                placeholder="Street address"
                                disabled={submitting}
                                required
                            />
                            {formErrors.address && (
                                <span className="org-field-error" role="alert">{formErrors.address}</span>
                            )}
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="org-modal-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="org-modal-btn-cancel"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary org-modal-btn-submit"
                            disabled={submitting}
                        >
                            {submitting && <Loader2 size={16} className="spin" aria-hidden="true" />}
                            <span>{mode === "create" ? "Add Location" : "Save Changes"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
