"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

    return createPortal(
        <div className="boq-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="loc-modal-title">
            <div className="boq-modal-container">
                {/* Modal Header */}
                <div className="boq-modal-header">
                    <h6 id="loc-modal-title" className="boq-modal-title">
                        {mode === "create" ? "Add Location" : "Edit Location"}
                    </h6>
                    <button
                        type="button"
                        onClick={onClose}
                        className="boq-modal-close"
                        aria-label="Close modal"
                        disabled={submitting}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} noValidate className="boq-modal-form">
                    <div className="boq-modal-inner-card">
                        {/* Row 1: Location Name * | City * */}
                        <div className="boq-modal-row-2col">
                            <div className="boq-modal-field">
                                <div className="boq-modal-label-row"><label htmlFor="locName" className="boq-modal-label">Location Name</label><span className="boq-modal-required">*</span></div>
                                <input
                                    id="locName"
                                    type="text"
                                    className={`boq-modal-input ${formErrors.name ? "has-error" : ""}`}
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
                                    <span className="boq-field-error" role="alert">{formErrors.name}</span>
                                )}
                            </div>

                            <div className="boq-modal-field">
                                <div className="boq-modal-label-row"><label htmlFor="locCity" className="boq-modal-label">City</label><span className="boq-modal-required">*</span></div>
                                <input
                                    id="locCity"
                                    type="text"
                                    className={`boq-modal-input ${formErrors.city ? "has-error" : ""}`}
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
                                    <span className="boq-field-error" role="alert">{formErrors.city}</span>
                                )}
                            </div>
                        </div>

                        {/* Row 2: State * */}
                        <div className="boq-modal-field">
                            <div className="boq-modal-label-row"><label htmlFor="locState" className="boq-modal-label">State</label><span className="boq-modal-required">*</span></div>
                            <input
                                id="locState"
                                type="text"
                                className={`boq-modal-input ${formErrors.state ? "has-error" : ""}`}
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
                                <span className="boq-field-error" role="alert">{formErrors.state}</span>
                            )}
                        </div>

                        {/* Row 3: Address * */}
                        <div className="boq-modal-field">
                            <div className="boq-modal-label-row"><label htmlFor="locAddress" className="boq-modal-label">Address</label><span className="boq-modal-required">*</span></div>
                            <input
                                id="locAddress"
                                type="text"
                                className={`boq-modal-input ${formErrors.address ? "has-error" : ""}`}
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
                                <span className="boq-field-error" role="alert">{formErrors.address}</span>
                            )}
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="boq-modal-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="boq-modal-btn-cancel"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="boq-modal-btn-submit"
                            disabled={submitting}
                        >
                            {submitting && <Loader2 size={16} className="spin" aria-hidden="true" />}
                            <span>{mode === "create" ? "Add Location" : "Save Changes"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
