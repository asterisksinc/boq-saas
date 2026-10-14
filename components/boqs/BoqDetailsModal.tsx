"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown, Loader2 } from "lucide-react";
import { type WorkspaceUserItem, getApiErrorMessage } from "@/lib/api/auth";

interface BoqDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    createMode: "blank" | "template";
    projects: { id: string; name: string; assignedDesignerId?: string | null; clientName?: string | null }[];
    templates: { id: string; name: string; description: string | null; tags: string[] | null; use_count?: number }[];
    workspaceUsers: WorkspaceUserItem[];
    initialProjectId?: string;
    initialTemplateId?: string;
    onSuccess: (newBoq: any) => void;
}

export default function BoqDetailsModal({
    isOpen,
    onClose,
    onBack,
    createMode,
    projects,
    templates,
    workspaceUsers,
    initialProjectId,
    initialTemplateId,
    onSuccess,
}: BoqDetailsModalProps) {
    const [boqNumber, setBoqNumber] = useState("");
    const [projectId, setProjectId] = useState(initialProjectId || "");
    const [version, setVersion] = useState("v1");
    const [assignedTo, setAssignedTo] = useState("");
    const [templateId, setTemplateId] = useState(initialTemplateId || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (initialProjectId) {
            setProjectId(initialProjectId);
        } else if (projects.length > 0 && !projectId) {
            setProjectId(projects[0].id);
        }
    }, [initialProjectId, projects, projectId]);

    useEffect(() => {
        if (initialTemplateId) {
            setTemplateId(initialTemplateId);
        } else if (templates.length > 0 && !templateId) {
            setTemplateId(templates[0].id);
        }
    }, [initialTemplateId, templates, templateId]);

    useEffect(() => {
        if (workspaceUsers.length > 0 && !assignedTo) {
            // Find designer matching project or default to first user
            const activeProj = projects.find((p) => p.id === projectId);
            if (activeProj?.assignedDesignerId) {
                const matched = workspaceUsers.find((u) => (u.userId || u.id) === activeProj.assignedDesignerId);
                if (matched) {
                    setAssignedTo(matched.userId || matched.id);
                    return;
                }
            }
            setAssignedTo(workspaceUsers[0].userId || workspaceUsers[0].id);
        }
    }, [workspaceUsers, projectId, projects, assignedTo]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");

        if (!projectId) {
            setErrorMessage("Please select a project.");
            return;
        }

        if (!version.trim()) {
            setErrorMessage("Version is required.");
            return;
        }

        if (createMode === "template" && !templateId) {
            setErrorMessage("Please select a template.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: Record<string, unknown> = {
                projectId,
                version: version.trim(),
                method: createMode,
            };

            if (boqNumber.trim()) {
                payload.boqNumber = boqNumber.trim();
            }

            if (assignedTo) {
                payload.assignedTo = assignedTo;
            }

            if (createMode === "template") {
                payload.templateId = templateId;
            }

            const res = await fetch("/api/v1/boqs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include",
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(getApiErrorMessage(data) || "Failed to create BOQ.");
            }

            onSuccess(data.data || data);
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to create BOQ.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="boq-modal-backdrop" onClick={onClose}>
            <div
                className="boq-details-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="boq-details-title"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="boq-details-header">
                    <div>
                        <h3 id="boq-details-title">BOQ Details</h3>
                        <p>Fill in the details to get started</p>
                    </div>
                    <button
                        type="button"
                        className="boq-details-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {errorMessage && (
                    <div className="boq-alert" style={{ margin: "14px 0 0" }}>
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="boq-details-form-body">
                        {/* Field 1: BOQ Number */}
                        <div className="boq-details-field">
                            <label htmlFor="boq-number-input">
                                BOQ Number <span className="boq-required-star">*</span>
                            </label>
                            <input
                                id="boq-number-input"
                                type="text"
                                placeholder="e.g. BOQ-0071"
                                value={boqNumber}
                                onChange={(e) => setBoqNumber(e.target.value)}
                            />
                        </div>

                        {/* Field 2: Project */}
                        <div className="boq-details-field">
                            <label htmlFor="boq-project-select">
                                Project <span className="boq-required-star">*</span>
                            </label>
                            <div className="boq-select-wrap">
                                <select
                                    id="boq-project-select"
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    required
                                >
                                    {projects.length > 0 ? (
                                        projects.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">No projects found...</option>
                                    )}
                                </select>
                                <ChevronDown size={16} className="boq-select-arrow" />
                            </div>
                        </div>

                        {/* Two-Column Row: Version & Assigned To */}
                        <div className="boq-details-row-2col">
                            <div className="boq-details-field">
                                <label htmlFor="boq-version-input">
                                    Version <span className="boq-required-star">*</span>
                                </label>
                                <input
                                    id="boq-version-input"
                                    type="text"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="boq-details-field">
                                <label htmlFor="boq-assigned-select">
                                    Assigned To <span className="boq-required-star">*</span>
                                </label>
                                <div className="boq-select-wrap">
                                    <select
                                        id="boq-assigned-select"
                                        value={assignedTo}
                                        onChange={(e) => setAssignedTo(e.target.value)}
                                        required
                                    >
                                        {workspaceUsers.length > 0 ? (
                                            workspaceUsers.map((u) => {
                                                const uId = u.userId || u.id;
                                                const label =
                                                    u.displayName ||
                                                    `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                                                    u.email ||
                                                    "User";
                                                return (
                                                    <option key={uId} value={uId}>
                                                        {label}
                                                    </option>
                                                );
                                            })
                                        ) : (
                                            <>
                                                <option value="">Select Assignee</option>
                                                <option value="default-assignee">Riya Sharma</option>
                                            </>
                                        )}
                                    </select>
                                    <ChevronDown size={16} className="boq-select-arrow" />
                                </div>
                            </div>
                        </div>

                        {/* Template Dropdown (Only for Template Mode) */}
                        {createMode === "template" && (
                            <div className="boq-details-field">
                                <label htmlFor="boq-template-select">
                                    Select Template <span className="boq-required-star">*</span>
                                </label>
                                <div className="boq-select-wrap">
                                    <select
                                        id="boq-template-select"
                                        value={templateId}
                                        onChange={(e) => setTemplateId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select template</option>
                                        {templates.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="boq-select-arrow" />
                                </div>
                            </div>
                        )}

                        {/* Method Information Box */}
                        <div className="boq-details-method-box">
                            <span className="boq-method-label">Method:</span>
                            <span className="boq-method-value">
                                {createMode === "template" ? "From Template" : "Blank BOQ"}
                            </span>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="boq-details-footer">
                        <button
                            type="button"
                            className="boq-btn-back"
                            onClick={onBack}
                            disabled={isSubmitting}
                        >
                            Back
                        </button>

                        <div className="boq-details-footer-actions">
                            <button
                                type="button"
                                className="boq-btn-cancel"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="boq-btn-create"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="boq-spinner" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    "Create BOQ"
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
