"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { submitClientBoqDecision } from "@/lib/api/client";
import "@/app/client/client-redesign.css";

export type BoqReviewAction = "APPROVE" | "REQUEST_MINOR_REVISION" | "REQUEST_MAJOR_REVISION" | "REJECT";

export interface ReviewBoqModalProps {
    isOpen: boolean;
    onClose: () => void;
    boqId: string;
    boqNumber: string;
    version: string;
    totalAmount: number;
    projectName?: string;
    onSuccess: (updatedStatus: string) => void;
}

function formatCurrency(val: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(val || 0);
}

const REVIEW_OPTIONS: {
    action: BoqReviewAction;
    title: string;
    desc: string;
}[] = [
    {
        action: "APPROVE",
        title: "Approve",
        desc: "I have reviewed the BOQ and approve it as submitted",
    },
    {
        action: "REQUEST_MINOR_REVISION",
        title: "Revise with Minor Revisions",
        desc: "The BOQ is generally acceptable, but minor changes are required before approval.",
    },
    {
        action: "REQUEST_MAJOR_REVISION",
        title: "Revise with Major Revisions",
        desc: "Significant changes are required before this BOQ can be approved.",
    },
    {
        action: "REJECT",
        title: "Reject",
        desc: "I do not approve this BOQ in its current form.",
    },
];

export default function ReviewBoqModal({
    isOpen,
    onClose,
    boqId,
    boqNumber,
    version,
    totalAmount,
    projectName,
    onSuccess,
}: ReviewBoqModalProps) {
    const [selectedAction, setSelectedAction] = useState<BoqReviewAction>("APPROVE");
    const [confirmed, setConfirmed] = useState(false);
    const [comments, setComments] = useState("");
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setSelectedAction("APPROVE");
            setConfirmed(false);
            setComments("");
            setReason("");
            setErrorMessage(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSubmitting) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setErrorMessage(null);

        // Validation
        if (selectedAction === "APPROVE" && !confirmed) {
            setErrorMessage("Please confirm that you have reviewed the BOQ before approving.");
            return;
        }

        if (
            (selectedAction === "REQUEST_MINOR_REVISION" || selectedAction === "REQUEST_MAJOR_REVISION") &&
            !comments.trim()
        ) {
            setErrorMessage("Please describe the revisions required before submitting.");
            return;
        }

        if (selectedAction === "REJECT" && !reason.trim()) {
            setErrorMessage("Please provide a reason for rejecting this BOQ.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: Parameters<typeof submitClientBoqDecision>[1] = {
                action: selectedAction,
                version,
                confirmation: selectedAction === "APPROVE" ? confirmed : undefined,
                comments:
                    selectedAction === "REQUEST_MINOR_REVISION" || selectedAction === "REQUEST_MAJOR_REVISION"
                        ? comments.trim()
                        : undefined,
                reason: selectedAction === "REJECT" ? reason.trim() : undefined,
            };

            const res = await submitClientBoqDecision(boqId, payload);
            onSuccess(res.status || selectedAction);
            onClose();
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to submit decision. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isApprove = selectedAction === "APPROVE";
    const isMinor = selectedAction === "REQUEST_MINOR_REVISION";
    const isMajor = selectedAction === "REQUEST_MAJOR_REVISION";
    const isReject = selectedAction === "REJECT";

    const canSubmit =
        !isSubmitting &&
        ((isApprove && confirmed) ||
            ((isMinor || isMajor) && comments.trim().length > 0) ||
            (isReject && reason.trim().length > 0));

    return (
        <div
            className="client-review-modal-backdrop"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-boq-modal-title"
        >
            <div
                className="client-review-modal-dialog"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Frame 2147225093) */}
                <div className="client-review-modal-header">
                    <div className="client-review-header-title-group">
                        <h2 id="review-boq-modal-title" className="client-review-header-title">
                            Review BOQ
                        </h2>
                        <p className="client-review-header-subtitle">
                            Please review the BOQ and select an action below.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="client-review-close-btn"
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="Close review dialog"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Inner White Card (Frame 2147225027) */}
                <div className="client-review-inner-card">
                    {/* Metadata Context Bar (Frame 12) */}
                    <div className="client-review-context-box">
                        <div className="client-review-context-row">
                            <div className="client-review-context-col">
                                <span className="client-review-context-label">BOQ</span>
                                <span className="client-review-context-val">{boqNumber}</span>
                            </div>

                            <div className="client-review-context-divider" />

                            <div className="client-review-context-col">
                                <span className="client-review-context-label">VERSION</span>
                                <span className="client-review-context-val">{version}</span>
                            </div>

                            <div className="client-review-context-divider" />

                            <div className="client-review-context-col">
                                <span className="client-review-context-label">TOTAL AMOUNT</span>
                                <span className="client-review-context-val">{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="client-banner-error" role="alert" style={{ margin: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <AlertCircle size={16} />
                                <span>{errorMessage}</span>
                            </div>
                        </div>
                    )}

                    {/* Choose One Action Section (Frame 2147225386) */}
                    <div className="client-review-actions-section">
                        <h3 className="client-review-actions-heading">CHOOSE ONE ACTION</h3>

                        <div
                            className="client-review-options-list"
                            role="radiogroup"
                            aria-label="Choose one action"
                        >
                            {REVIEW_OPTIONS.map((opt) => {
                                const isSelected = selectedAction === opt.action;
                                return (
                                    <div
                                        key={opt.action}
                                        role="radio"
                                        aria-checked={isSelected}
                                        tabIndex={0}
                                        onClick={() => {
                                            if (!isSubmitting) setSelectedAction(opt.action);
                                        }}
                                        onKeyDown={(e) => {
                                            if (isSubmitting) return;
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setSelectedAction(opt.action);
                                            }
                                        }}
                                        className={`client-review-option-card ${isSelected ? "selected" : ""}`}
                                    >
                                        <div className="client-review-option-text-group">
                                            <h4 className="client-review-option-title">{opt.title}</h4>
                                            <p className="client-review-option-subtitle">{opt.desc}</p>
                                        </div>
                                        <div className="client-review-option-indicator">
                                            {isSelected ? (
                                                <CheckCircle2 size={22} color="#2563EB" />
                                            ) : (
                                                <div className="client-review-radio-circle" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Confirmation Checkbox Row (Frame 2147225087) */}
                    {isApprove && (
                        <label className="client-review-confirm-row">
                            <input
                                type="checkbox"
                                checked={confirmed}
                                onChange={(e) => setConfirmed(e.target.checked)}
                                className="client-review-confirm-checkbox"
                                disabled={isSubmitting}
                            />
                            <span className="client-review-confirm-text">
                                I confirm that I have reviewed this BOQ and approve it as submitted.
                            </span>
                        </label>
                    )}

                    {/* Conditional feedback input for Revisions */}
                    {(isMinor || isMajor) && (
                        <div className="client-review-feedback-group">
                            <label className="client-review-feedback-label">
                                Requested Changes <span style={{ color: "#DC2626" }}>*</span>
                            </label>
                            <textarea
                                className="client-review-textarea"
                                rows={3}
                                placeholder="Detail the rooms, categories, or items you would like changed..."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    )}

                    {/* Conditional feedback input for Rejection */}
                    {isReject && (
                        <div className="client-review-feedback-group">
                            <label className="client-review-feedback-label">
                                Rejection Reason <span style={{ color: "#DC2626" }}>*</span>
                            </label>
                            <textarea
                                className="client-review-textarea"
                                rows={3}
                                placeholder="Please explain why this BOQ was declined..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    )}
                </div>

                {/* Footer Actions (Frame 2147225095 bottom) */}
                <div className="client-review-footer">
                    <button
                        type="button"
                        className="client-review-btn-back"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Back
                    </button>

                    <div className="client-review-footer-right">
                        <button
                            type="button"
                            className="client-review-btn-cancel"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={`client-review-btn-submit ${isReject ? "danger" : ""}`}
                            onClick={handleSubmit}
                            disabled={!canSubmit || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <span>
                                    {isApprove ? "Approve BOQ" : isReject ? "Reject BOQ" : "Submit Revision Request"}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
