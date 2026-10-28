"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, FileText, Check, Loader2, AlertCircle } from "lucide-react";
import { signClientDocument, type ClientDocumentItem } from "@/lib/api/client";

export type SigningStep = "acknowledgement" | "create-signature" | "confirm-signature" | "success";
export type SignatureMode = "draw" | "type";

export type DocumentSignModalProps = {
    projectId: string;
    document: ClientDocumentItem;
    initialSignerName?: string;
    onClose: () => void;
    onSigned: (docId: string) => void;
};

export function DocumentSignModal({
    projectId,
    document,
    initialSignerName = "",
    onClose,
    onSigned,
}: DocumentSignModalProps) {
    // State machine
    const [step, setStep] = useState<SigningStep>("acknowledgement");
    const [mode, setMode] = useState<SignatureMode>("draw");

    // Modal 1: Acknowledgement
    const [acknowledged, setAcknowledged] = useState(false);

    // Modal 2 & 3: Signature draft
    const [typedName, setTypedName] = useState(initialSignerName);
    const [drawDataUrl, setDrawDataUrl] = useState<string | null>(null);
    const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

    // Canvas drawing state
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);

    // Submission & Error handling
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Setup canvas when entering "create-signature" in draw mode
    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // If we already had saved drawDataUrl, redraw it
        if (drawDataUrl) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = drawDataUrl;
            setIsCanvasEmpty(false);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setIsCanvasEmpty(true);
        }
    }, [drawDataUrl]);

    useEffect(() => {
        if (step === "create-signature" && mode === "draw") {
            const timer = setTimeout(initCanvas, 50);
            return () => clearTimeout(timer);
        }
    }, [step, mode, initCanvas]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSubmitting) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isSubmitting, onClose]);

    // Pointer drawing handlers for high-precision, touch & stylus support
    const getCanvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height),
        };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.setPointerCapture(e.pointerId);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        isDrawingRef.current = true;
        const pos = getCanvasPos(e);
        lastPosRef.current = pos;

        ctx.strokeStyle = "#0F172A";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Draw a single dot in case of tap
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "#0F172A";
        ctx.fill();

        setIsCanvasEmpty(false);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx || !lastPosRef.current) return;

        const pos = getCanvasPos(e);
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        lastPosRef.current = pos;
        setIsCanvasEmpty(false);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        lastPosRef.current = null;

        const canvas = canvasRef.current;
        if (canvas) {
            try {
                canvas.releasePointerCapture(e.pointerId);
            } catch {
                // Ignore capture release error
            }
            setDrawDataUrl(canvas.toDataURL("image/png"));
        }
    };

    const handleClear = () => {
        if (mode === "draw") {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            setDrawDataUrl(null);
            setIsCanvasEmpty(true);
        } else {
            setTypedName("");
        }
        setError("");
    };

    // Validating signature draft and proceeding from Add Signature to Confirm Signature
    const handleProceedToConfirm = () => {
        setError("");
        if (mode === "draw") {
            if (isCanvasEmpty || !drawDataUrl) {
                setError("Please draw your signature before continuing.");
                return;
            }
        } else {
            if (!typedName.trim()) {
                setError("Please type your name before continuing.");
                return;
            }
        }
        setStep("confirm-signature");
    };

    // Submitting signature from Confirm Signature to backend API
    const handleConfirmAndSign = async () => {
        setError("");

        if (mode === "draw") {
            if (isCanvasEmpty || !drawDataUrl) {
                setError("Please draw your signature before submitting.");
                return;
            }
        } else {
            if (!typedName.trim()) {
                setError("Please type your name before submitting.");
                return;
            }
        }

        setIsSubmitting(true);

        const signer = typedName.trim() || initialSignerName.trim() || "Authorized Client";
        const signaturePayload = mode === "draw" ? drawDataUrl || "" : signer;

        try {
            await signClientDocument(projectId, document.id, {
                signerName: signer,
                consent: true,
                signatureType: mode,
                signatureData: signaturePayload,
                signatureText: signer,
            });

            // Transition to Modal 5 (Success) only after server confirms success
            setStep("success");
        } catch (err: any) {
            setError(err.message || "Failed to submit signature. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const docReference = document.referenceNumber || document.reference || document.id;
    const isDraftEmpty = mode === "draw" ? isCanvasEmpty || !drawDataUrl : !typedName.trim();
    const isSubmitDisabled = isDraftEmpty || isSubmitting;

    const isSuccessStep = step === "success";

    return (
        <div
            className="client-sign-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-header-title"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) onClose();
            }}
        >
            <div
                className={`client-sign-modal-card ${
                    isSuccessStep ? "client-sign-success-modal" : ""
                }`}
            >
                {/* Header Row: Frame 2147225093 */}
                <div
                    className="client-sign-modal-header"
                    style={{
                        width: isSuccessStep ? "100%" : "100%",
                        maxWidth: isSuccessStep ? "388px" : "368px",
                    }}
                >
                    <h2 id="modal-header-title" className="client-sign-modal-title">
                        {step === "acknowledgement" && "Sign Document"}
                        {step === "create-signature" && "Add Signature"}
                        {step === "confirm-signature" && "Confirm Signature"}
                        {step === "success" && (
                            <span style={{ opacity: 0 }}>Proposal Created</span>
                        )}
                    </h2>
                    {!isSubmitting && (
                        <button
                            type="button"
                            className="client-sign-modal-close"
                            onClick={onClose}
                            aria-label="Close dialog"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* MODAL 1: Sign Document — Acknowledgement */}
                {step === "acknowledgement" && (
                    <div className="client-sign-inner-card">
                        {/* Document Information Table Cell */}
                        <div className="client-sign-doc-cell">
                            <div className="client-sign-doc-icon-circle" aria-hidden="true">
                                <FileText size={20} color="#64748B" />
                            </div>
                            <div className="client-sign-doc-info">
                                <h3 className="client-sign-doc-name">{document.title}</h3>
                                <p className="client-sign-doc-ref">{docReference}</p>
                            </div>
                        </div>

                        {/* Acknowledgement Text */}
                        <p className="client-sign-disclaimer">
                            By signing this document, you confirm that you have reviewed and agreed to its contents.
                        </p>

                        {/* Checkbox with Label */}
                        <label className="client-sign-checkbox-row">
                            <input
                                type="checkbox"
                                className="client-sign-checkbox-input"
                                checked={acknowledged}
                                onChange={(e) => setAcknowledged(e.target.checked)}
                            />
                            <span className="client-sign-checkbox-label">
                                I have reviewed this document and agree to sign it.
                            </span>
                        </label>
                    </div>
                )}

                {step === "acknowledgement" && (
                    <div className="client-sign-actions-row">
                        <button
                            type="button"
                            className="client-sign-btn-cancel"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="client-sign-btn-primary"
                            disabled={!acknowledged}
                            onClick={() => setStep("create-signature")}
                        >
                            Add Signature
                        </button>
                    </div>
                )}

                {/* MODAL 2 & 3: Add Signature — Draw Mode & Type Mode */}
                {step === "create-signature" && (
                    <div className="client-sign-inner-card">
                        {/* Segmented Mode Selector */}
                        <div className="client-sign-tab-container">
                            <button
                                type="button"
                                className={`client-sign-tab-btn ${mode === "draw" ? "active" : ""}`}
                                onClick={() => setMode("draw")}
                            >
                                Draw
                            </button>

                            <button
                                type="button"
                                className={`client-sign-tab-btn ${mode === "type" ? "active" : ""}`}
                                onClick={() => setMode("type")}
                            >
                                Type
                            </button>
                        </div>

                        {/* DRAW MODE CONTENT */}
                        {mode === "draw" && (
                            <div style={{ width: "100%" }}>
                                <div className="client-sign-draw-label">
                                    Draw your signature below.
                                </div>

                                <div className="client-sign-canvas-frame">
                                    <canvas
                                        ref={canvasRef}
                                        width={672}
                                        height={284}
                                        onPointerDown={handlePointerDown}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={handlePointerUp}
                                        onPointerCancel={handlePointerUp}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TYPE MODE CONTENT */}
                        {mode === "type" && (
                            <div style={{ width: "100%" }}>
                                <input
                                    type="text"
                                    className="client-sign-type-input"
                                    placeholder="Type your name here"
                                    value={typedName}
                                    onChange={(e) => setTypedName(e.target.value)}
                                    autoFocus
                                />

                                <div className="client-sign-type-preview">
                                    {typedName.trim() ? (
                                        <span className="client-sign-cursive-text">
                                            {typedName}
                                        </span>
                                    ) : (
                                        <span className="client-sign-cursive-placeholder">
                                            Your signature preview will appear here
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="client-sign-error-banner">
                                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                )}

                {step === "create-signature" && (
                    <div className="client-sign-actions-row" style={{ justifyContent: "space-between" }}>
                        <button
                            type="button"
                            className="client-sign-btn-clear"
                            onClick={handleClear}
                            disabled={isSubmitting}
                        >
                            Clear
                        </button>

                        <div className="client-sign-right-btn-group">
                            <button
                                type="button"
                                className="client-sign-btn-cancel"
                                onClick={() => setStep("acknowledgement")}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="client-sign-btn-primary"
                                onClick={handleProceedToConfirm}
                                disabled={isDraftEmpty}
                            >
                                Add Signature
                            </button>
                        </div>
                    </div>
                )}

                {/* MODAL 4: Confirm Signature (Figma Reference 1) */}
                {step === "confirm-signature" && (
                    <div className="client-sign-inner-card" style={{ height: "auto", minHeight: "236px" }}>
                        {/* Document Information Table Cell */}
                        <div className="client-sign-doc-cell">
                            <div className="client-sign-doc-icon-circle" aria-hidden="true">
                                <FileText size={20} color="#64748B" />
                            </div>
                            <div className="client-sign-doc-info">
                                <h3 className="client-sign-doc-name">{document.title}</h3>
                                <p className="client-sign-doc-ref">{docReference}</p>
                            </div>
                        </div>

                        {/* Signature Preview Panel: Frame 13 (336x118px) */}
                        <div className="client-sign-preview-frame">
                            {mode === "draw" && drawDataUrl ? (
                                <img
                                    src={drawDataUrl}
                                    alt="Your drawn signature"
                                    style={{
                                        maxHeight: "88px",
                                        maxWidth: "100%",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : mode === "type" && typedName.trim() ? (
                                <span className="client-sign-cursive-text">
                                    {typedName}
                                </span>
                            ) : (
                                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#64748B" }}>
                                    Your signature preview will appear here
                                </span>
                            )}
                        </div>

                        {error && (
                            <div className="client-sign-error-banner">
                                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                )}

                {step === "confirm-signature" && (
                    <div className="client-sign-actions-row" style={{ justifyContent: "space-between" }}>
                        <button
                            type="button"
                            className="client-sign-btn-back"
                            onClick={() => setStep("create-signature")}
                            disabled={isSubmitting}
                        >
                            Back
                        </button>

                        <button
                            type="button"
                            className="client-sign-btn-confirm"
                            onClick={handleConfirmAndSign}
                            disabled={isSubmitDisabled}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={15} style={{ marginRight: "6px" }} />
                                    <span>Signing...</span>
                                </>
                            ) : (
                                "Confirm & Sign"
                            )}
                        </button>
                    </div>
                )}

                {/* MODAL 5: Document Signed — Success (Figma Reference 2) */}
                {step === "success" && (
                    <>
                        {/* Frame 2147225096: Inner White Success Panel (388x180px) */}
                        <div className="client-sign-success-panel">
                            {/* Frame 2147225105: 68x68 Circular Success Icon Box */}
                            <div className="client-sign-success-icon-box" aria-hidden="true">
                                <Check size={28} color="#16A34A" strokeWidth={2.8} />
                            </div>

                            {/* Frame 2147224969: Text Container (320x48px) */}
                            <div className="client-sign-success-text-box">
                                <h3 className="client-sign-success-title">
                                    Document Signed
                                </h3>
                                <p className="client-sign-success-subtitle">
                                    Your signature has been added successfully.
                                </p>
                            </div>
                        </div>

                        {/* Buttons: 388x46px Full-Width Done Button */}
                        <button
                            type="button"
                            onClick={() => {
                                onSigned(document.id);
                                onClose();
                            }}
                            className="client-sign-btn-done"
                        >
                            Done
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
