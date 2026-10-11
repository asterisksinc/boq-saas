"use client";

import { useState } from "react";
import { X, Check, AlertCircle, Loader2 } from "lucide-react";
import { submitClientBoqDecision } from "@/lib/api/client";

export type BoqReviewAction = "APPROVE" | "REQUEST_MINOR_REVISION" | "REQUEST_MAJOR_REVISION" | "REJECT";

interface ReviewBoqModalProps {
    isOpen: boolean;
    onClose: () => void;
    boqId: string;
    boqNumber: string;
    version: string;
    totalAmount: number;
    onSuccess: (updatedStatus: string) => void;
}

function formatCurrency(val: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(val);
}

export default function ReviewBoqModal({
    isOpen,
    onClose,
    boqId,
    boqNumber,
    version,
    totalAmount,
    onSuccess,
}: ReviewBoqModalProps) {
    const [selectedAction, setSelectedAction] = useState<BoqReviewAction>("APPROVE");
    const [confirmed, setConfirmed] = useState(false);
    const [comments, setComments] = useState("");
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                backgroundColor: "rgba(15, 23, 42, 0.45)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) onClose();
            }}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    width: "100%",
                    maxWidth: "580px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "24px 28px 16px 28px",
                        position: "relative",
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        style={{
                            position: "absolute",
                            right: "24px",
                            top: "24px",
                            background: "transparent",
                            border: "none",
                            color: "#64748b",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <X size={20} />
                    </button>

                    <h2
                        style={{
                            margin: 0,
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#0f172a",
                            lineHeight: "1.3",
                        }}
                    >
                        Review BOQ
                    </h2>
                    <p
                        style={{
                            margin: "4px 0 0 0",
                            fontSize: "14px",
                            color: "#64748b",
                        }}
                    >
                        Please review the BOQ and select an action below.
                    </p>
                </div>

                {/* Body Content */}
                <div
                    style={{
                        padding: "0 28px 24px 28px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        maxHeight: "calc(85vh - 150px)",
                        overflowY: "auto",
                    }}
                >
                    {/* Top Summary Box */}
                    <div
                        style={{
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "14px 20px",
                            display: "grid",
                            gridTemplateColumns: "1.2fr 1fr 1.3fr",
                            gap: "12px",
                        }}
                    >
                        <div>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", letterSpacing: "0.04em" }}>
                                BOQ
                            </div>
                            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                                {boqNumber}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", letterSpacing: "0.04em" }}>
                                VERSION
                            </div>
                            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                                {version}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", letterSpacing: "0.04em" }}>
                                TOTAL AMOUNT
                            </div>
                            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                                {formatCurrency(totalAmount)}
                            </div>
                        </div>
                    </div>

                    {/* Section Label */}
                    <div>
                        <div
                            style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#64748b",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                marginBottom: "10px",
                            }}
                        >
                            CHOOSE ONE ACTION
                        </div>

                        {/* 4 Action Cards */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {/* Option 1: Approve */}
                            <div
                                onClick={() => setSelectedAction("APPROVE")}
                                style={{
                                    border: isApprove ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                                    backgroundColor: isApprove ? "#f8faff" : "#ffffff",
                                    borderRadius: "10px",
                                    padding: "14px 18px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                                        Approve
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                        I have reviewed the BOQ and approve it as submitted
                                    </div>
                                </div>
                                <div
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                        borderRadius: "50%",
                                        border: isApprove ? "none" : "1.5px solid #cbd5e1",
                                        backgroundColor: isApprove ? "#2563eb" : "transparent",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        marginLeft: "12px",
                                    }}
                                >
                                    {isApprove && <Check size={13} color="#ffffff" strokeWidth={3} />}
                                </div>
                            </div>

                            {/* Option 2: Minor Revisions */}
                            <div
                                onClick={() => setSelectedAction("REQUEST_MINOR_REVISION")}
                                style={{
                                    border: isMinor ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                                    backgroundColor: isMinor ? "#f8faff" : "#ffffff",
                                    borderRadius: "10px",
                                    padding: "14px 18px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                                        Revise with Minor Revisions
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                        The BOQ is generally acceptable, but minor changes are required before approval.
                                    </div>
                                </div>
                                <div
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                        borderRadius: "50%",
                                        border: isMinor ? "none" : "1.5px solid #cbd5e1",
                                        backgroundColor: isMinor ? "#2563eb" : "transparent",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        marginLeft: "12px",
                                    }}
                                >
                                    {isMinor && <Check size={13} color="#ffffff" strokeWidth={3} />}
                                </div>
                            </div>

                            {/* Option 3: Major Revisions */}
                            <div
                                onClick={() => setSelectedAction("REQUEST_MAJOR_REVISION")}
                                style={{
                                    border: isMajor ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                                    backgroundColor: isMajor ? "#f8faff" : "#ffffff",
                                    borderRadius: "10px",
                                    padding: "14px 18px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                                        Revise with Major Revisions
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                        Significant changes are required before this BOQ can be approved.
                                    </div>
                                </div>
                                <div
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                        borderRadius: "50%",
                                        border: isMajor ? "none" : "1.5px solid #cbd5e1",
                                        backgroundColor: isMajor ? "#2563eb" : "transparent",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        marginLeft: "12px",
                                    }}
                                >
                                    {isMajor && <Check size={13} color="#ffffff" strokeWidth={3} />}
                                </div>
                            </div>

                            {/* Option 4: Reject */}
                            <div
                                onClick={() => setSelectedAction("REJECT")}
                                style={{
                                    border: isReject ? "1.5px solid #dc2626" : "1px solid #e2e8f0",
                                    backgroundColor: isReject ? "#fef2f2" : "#ffffff",
                                    borderRadius: "10px",
                                    padding: "14px 18px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: isReject ? "#b91c1c" : "#0f172a" }}>
                                        Reject
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                        I do not approve this BOQ in its current form.
                                    </div>
                                </div>
                                <div
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                        borderRadius: "50%",
                                        border: isReject ? "none" : "1.5px solid #cbd5e1",
                                        backgroundColor: isReject ? "#dc2626" : "transparent",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        marginLeft: "12px",
                                    }}
                                >
                                    {isReject && <Check size={13} color="#ffffff" strokeWidth={3} />}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contextual Forms */}
                    {isApprove && (
                        <div
                            style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "10px",
                                padding: "12px 16px",
                                backgroundColor: "#ffffff",
                            }}
                        >
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    cursor: "pointer",
                                    userSelect: "none",
                                    fontSize: "13px",
                                    color: "#1e293b",
                                    fontWeight: 500,
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={confirmed}
                                    onChange={(e) => setConfirmed(e.target.checked)}
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        accentColor: "#2563eb",
                                        cursor: "pointer",
                                    }}
                                />
                                <span>I confirm that I have reviewed this BOQ and approve it as submitted.</span>
                            </label>
                        </div>
                    )}

                    {(isMinor || isMajor) && (
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#0f172a",
                                    marginBottom: "6px",
                                }}
                            >
                                Revision Comments
                            </label>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder={
                                    isMinor
                                        ? "Please describe the minor revisions required..."
                                        : "Please describe the major revisions required..."
                                }
                                rows={4}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "13px",
                                    color: "#0f172a",
                                    outline: "none",
                                    resize: "vertical",
                                    boxSizing: "border-box",
                                    fontFamily: "inherit",
                                }}
                            />
                        </div>
                    )}

                    {isReject && (
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#0f172a",
                                    marginBottom: "6px",
                                }}
                            >
                                Rejection Reason
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Please explain why this BOQ is being rejected..."
                                rows={4}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "13px",
                                    color: "#0f172a",
                                    outline: "none",
                                    resize: "vertical",
                                    boxSizing: "border-box",
                                    fontFamily: "inherit",
                                }}
                            />
                        </div>
                    )}

                    {/* Error Notice */}
                    {errorMessage && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "10px 14px",
                                backgroundColor: "#fef2f2",
                                border: "1px solid #fecaca",
                                borderRadius: "8px",
                                color: "#b91c1c",
                                fontSize: "13px",
                            }}
                        >
                            <AlertCircle size={16} />
                            <span>{errorMessage}</span>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div
                    style={{
                        padding: "16px 28px 24px 28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderTop: "1px solid #f1f5f9",
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        style={{
                            padding: "8px 18px",
                            borderRadius: "8px",
                            backgroundColor: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            color: "#334155",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Back
                    </button>

                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            style={{
                                padding: "8px 18px",
                                borderRadius: "8px",
                                backgroundColor: "#ffffff",
                                border: "1px solid #cbd5e1",
                                color: "#475569",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            style={{
                                padding: "8px 20px",
                                borderRadius: "8px",
                                backgroundColor: !canSubmit
                                    ? "#94a3b8"
                                    : isReject
                                    ? "#dc2626"
                                    : "#2563eb",
                                border: "none",
                                color: "#ffffff",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: canSubmit ? "pointer" : "not-allowed",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "background-color 0.15s ease",
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" /> Submitting...
                                </>
                            ) : isApprove ? (
                                "Approve BOQ"
                            ) : isReject ? (
                                "Reject BOQ"
                            ) : (
                                "Submit Revision Request"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
