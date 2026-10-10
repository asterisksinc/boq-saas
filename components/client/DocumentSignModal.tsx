"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, FileText, Check, Loader2, AlertCircle } from "lucide-react";
import { signClientDocument, type ClientDocumentItem } from "@/lib/api/client";

type SigningStep = "acknowledgement" | "create-signature" | "confirm-signature" | "success";
type SignatureMode = "draw" | "type";

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
            // Small tick to ensure canvas is mounted
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

        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Draw a single dot in case of tap
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 1.25, 0, Math.PI * 2);
        ctx.fillStyle = "#0f172a";
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
    };

    // Advancing from Modal 2/3 to Modal 4 (Confirm)
    const handleProceedToConfirm = () => {
        setError("");
        if (mode === "draw") {
            if (isCanvasEmpty || !drawDataUrl) {
                setError("Please draw your signature before continuing.");
                return;
            }
            setStep("confirm-signature");
        } else {
            if (!typedName.trim()) {
                setError("Please type your name before continuing.");
                return;
            }
            setStep("confirm-signature");
        }
    };

    // Submitting from Modal 4 (Confirm & Sign)
    const handleConfirmAndSign = async () => {
        setError("");
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

            // Transition directly to Modal 5 (Success)
            setStep("success");
        } catch (err: any) {
            setError(err.message || "Failed to submit signature. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const docReference = document.referenceNumber || document.reference || document.id;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                backgroundColor: "rgba(15, 23, 42, 0.45)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-header-title"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) onClose();
            }}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "18px",
                    width: "100%",
                    maxWidth: "460px",
                    boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1)",
                    overflow: "hidden",
                    padding: "24px",
                    position: "relative",
                }}
            >
                {/* Close Button at top-right (unless submitting) */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    aria-label="Close dialog"
                    style={{
                        position: "absolute",
                        top: "20px",
                        right: "20px",
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px",
                        borderRadius: "6px",
                        zIndex: 10,
                    }}
                >
                    <X size={18} />
                </button>

                {/* MODAL 1: Sign Document — Acknowledgement */}
                {step === "acknowledgement" && (
                    <div>
                        <h2
                            id="modal-header-title"
                            style={{
                                fontSize: "17px",
                                fontWeight: 700,
                                color: "#0f172a",
                                margin: "0 0 18px 0",
                            }}
                        >
                            Sign Document
                        </h2>

                        {/* Document Information Card */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "14px 16px",
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                marginBottom: "18px",
                            }}
                        >
                            <div
                                style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "8px",
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #f1f5f9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <FileText size={20} color="#64748b" />
                            </div>
                            <div style={{ overflow: "hidden" }}>
                                <div
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        color: "#0f172a",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {document.title}
                                </div>
                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                    {docReference}
                                </div>
                            </div>
                        </div>

                        {/* Acknowledgement Text */}
                        <p
                            style={{
                                fontSize: "13px",
                                color: "#475569",
                                lineHeight: 1.55,
                                margin: "0 0 16px 0",
                            }}
                        >
                            By signing this document, you confirm that you have reviewed and agreed to its contents.
                        </p>

                        {/* Checkbox with Label */}
                        <label
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "10px",
                                cursor: "pointer",
                                fontSize: "13px",
                                color: "#1e293b",
                                userSelect: "none",
                                marginBottom: "24px",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={acknowledged}
                                onChange={(e) => setAcknowledged(e.target.checked)}
                                style={{
                                    width: "16px",
                                    height: "16px",
                                    accentColor: "#2563eb",
                                    marginTop: "2px",
                                    cursor: "pointer",
                                }}
                            />
                            <span>I have reviewed this document and agree to sign it.</span>
                        </label>

                        {/* Footer Actions */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: "9px 18px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    backgroundColor: "#ffffff",
                                    color: "#334155",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={!acknowledged}
                                onClick={() => setStep("create-signature")}
                                style={{
                                    padding: "9px 18px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: "#2563eb",
                                    color: "#ffffff",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: acknowledged ? "pointer" : "not-allowed",
                                    opacity: acknowledged ? 1 : 0.45,
                                    transition: "opacity 0.15s ease",
                                }}
                            >
                                Add Signature
                            </button>
                        </div>
                    </div>
                )}

                {/* MODAL 2 & 3: Add Signature — Draw Mode & Type Mode */}
                {step === "create-signature" && (
                    <div>
                        <h2
                            id="modal-header-title"
                            style={{
                                fontSize: "17px",
                                fontWeight: 700,
                                color: "#0f172a",
                                margin: "0 0 16px 0",
                            }}
                        >
                            Add Signature
                        </h2>

                        {/* Segmented Mode Selector */}
                        <div
                            style={{
                                display: "flex",
                                padding: "3px",
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "10px",
                                marginBottom: "16px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setMode("draw")}
                                style={{
                                    flex: 1,
                                    padding: "8px 0",
                                    border: "none",
                                    borderRadius: "7px",
                                    fontSize: "13px",
                                    fontWeight: mode === "draw" ? 600 : 500,
                                    backgroundColor: mode === "draw" ? "#eff6ff" : "transparent",
                                    color: mode === "draw" ? "#2563eb" : "#64748b",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                Draw
                            </button>

                            <button
                                type="button"
                                onClick={() => setMode("type")}
                                style={{
                                    flex: 1,
                                    padding: "8px 0",
                                    border: "none",
                                    borderRadius: "7px",
                                    fontSize: "13px",
                                    fontWeight: mode === "type" ? 600 : 500,
                                    backgroundColor: mode === "type" ? "#eff6ff" : "transparent",
                                    color: mode === "type" ? "#2563eb" : "#64748b",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                Type
                            </button>
                        </div>

                        {/* DRAW MODE CONTENT */}
                        {mode === "draw" && (
                            <div>
                                <div
                                    style={{
                                        fontSize: "13px",
                                        color: "#334155",
                                        fontWeight: 500,
                                        marginBottom: "8px",
                                    }}
                                >
                                    Draw your signature below.
                                </div>

                                <div
                                    style={{
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "12px",
                                        backgroundColor: "#ffffff",
                                        overflow: "hidden",
                                        position: "relative",
                                        height: "150px",
                                        marginBottom: "20px",
                                    }}
                                >
                                    <canvas
                                        ref={canvasRef}
                                        width={500}
                                        height={200}
                                        onPointerDown={handlePointerDown}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={handlePointerUp}
                                        onPointerCancel={handlePointerUp}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "block",
                                            cursor: "crosshair",
                                            touchAction: "none",
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TYPE MODE CONTENT */}
                        {mode === "type" && (
                            <div>
                                <div style={{ marginBottom: "12px" }}>
                                    <input
                                        type="text"
                                        placeholder="Type your name here"
                                        value={typedName}
                                        onChange={(e) => setTypedName(e.target.value)}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "11px 14px",
                                            borderRadius: "9px",
                                            border: "1px solid #e2e8f0",
                                            fontSize: "14px",
                                            color: "#0f172a",
                                            outline: "none",
                                        }}
                                    />
                                </div>

                                <div
                                    style={{
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "12px",
                                        backgroundColor: "#ffffff",
                                        height: "115px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "12px 16px",
                                        marginBottom: "20px",
                                        textAlign: "center",
                                    }}
                                >
                                    {typedName.trim() ? (
                                        <span
                                            style={{
                                                fontFamily: "'Dancing Script', 'Caveat', 'Brush Script MT', cursive, sans-serif",
                                                fontSize: "30px",
                                                color: "#0f172a",
                                                letterSpacing: "0.5px",
                                                wordBreak: "break-word",
                                            }}
                                        >
                                            {typedName}
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                                            Your signature preview will appear here
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#b91c1c",
                                    marginBottom: "14px",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <button
                                type="button"
                                onClick={handleClear}
                                style={{
                                    padding: "9px 18px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    backgroundColor: "#ffffff",
                                    color: "#334155",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                }}
                            >
                                Clear
                            </button>

                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => setStep("acknowledgement")}
                                    style={{
                                        padding: "9px 18px",
                                        borderRadius: "8px",
                                        border: "1px solid #e2e8f0",
                                        backgroundColor: "#ffffff",
                                        color: "#334155",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleProceedToConfirm}
                                    disabled={mode === "draw" ? isCanvasEmpty : !typedName.trim()}
                                    style={{
                                        padding: "9px 18px",
                                        borderRadius: "8px",
                                        border: "none",
                                        backgroundColor: "#2563eb",
                                        color: "#ffffff",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor:
                                            (mode === "draw" ? !isCanvasEmpty : !!typedName.trim())
                                                ? "pointer"
                                                : "not-allowed",
                                        opacity:
                                            (mode === "draw" ? !isCanvasEmpty : !!typedName.trim())
                                                ? 1
                                                : 0.45,
                                        transition: "opacity 0.15s ease",
                                    }}
                                >
                                    Add Signature
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 4: Confirm Signature */}
                {step === "confirm-signature" && (
                    <div>
                        <h2
                            id="modal-header-title"
                            style={{
                                fontSize: "17px",
                                fontWeight: 700,
                                color: "#0f172a",
                                margin: "0 0 16px 0",
                            }}
                        >
                            Confirm Signature
                        </h2>

                        {/* Document Information Card */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "14px 16px",
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                marginBottom: "16px",
                            }}
                        >
                            <div
                                style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "8px",
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #f1f5f9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <FileText size={20} color="#64748b" />
                            </div>
                            <div style={{ overflow: "hidden" }}>
                                <div
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        color: "#0f172a",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {document.title}
                                </div>
                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                    {docReference}
                                </div>
                            </div>
                        </div>

                        {/* Signature Preview Panel */}
                        <div
                            style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                backgroundColor: "#ffffff",
                                height: "135px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "12px 16px",
                                marginBottom: "20px",
                            }}
                        >
                            {mode === "draw" && drawDataUrl ? (
                                <img
                                    src={drawDataUrl}
                                    alt="Your drawn signature"
                                    style={{
                                        maxHeight: "100px",
                                        maxWidth: "100%",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <span
                                    style={{
                                        fontFamily: "'Dancing Script', 'Caveat', 'Brush Script MT', cursive, sans-serif",
                                        fontSize: "30px",
                                        color: "#0f172a",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {typedName}
                                </span>
                            )}
                        </div>

                        {error && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    backgroundColor: "#fef2f2",
                                    border: "1px solid #fecaca",
                                    color: "#b91c1c",
                                    fontSize: "13px",
                                    marginBottom: "16px",
                                }}
                            >
                                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <button
                                type="button"
                                onClick={() => setStep("create-signature")}
                                disabled={isSubmitting}
                                style={{
                                    padding: "9px 18px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    backgroundColor: "#ffffff",
                                    color: "#334155",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    cursor: isSubmitting ? "not-allowed" : "pointer",
                                }}
                            >
                                Back
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmAndSign}
                                disabled={isSubmitting}
                                style={{
                                    padding: "9px 20px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: "#2563eb",
                                    color: "#ffffff",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: isSubmitting ? "not-allowed" : "pointer",
                                    opacity: isSubmitting ? 0.75 : 1,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                {isSubmitting && <Loader2 className="animate-spin" size={15} />}
                                <span>{isSubmitting ? "Signing..." : "Confirm & Sign"}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* MODAL 5: Document Signed — Success */}
                {step === "success" && (
                    <div style={{ textAlign: "center", padding: "16px 8px 8px 8px" }}>
                        {/* Large Light-Green Circular Icon */}
                        <div
                            style={{
                                width: "64px",
                                height: "64px",
                                borderRadius: "50%",
                                backgroundColor: "#dcfce7",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 16px auto",
                            }}
                        >
                            <Check size={32} color="#16a34a" strokeWidth={2.6} />
                        </div>

                        {/* Heading */}
                        <h2
                            id="modal-header-title"
                            style={{
                                fontSize: "18px",
                                fontWeight: 700,
                                color: "#0f172a",
                                margin: "0 0 6px 0",
                            }}
                        >
                            Document Signed
                        </h2>

                        {/* Subtitle */}
                        <p
                            style={{
                                fontSize: "13.5px",
                                color: "#64748b",
                                margin: "0 0 24px 0",
                            }}
                        >
                            Your signature has been added successfully.
                        </p>

                        {/* Done Button */}
                        <button
                            type="button"
                            onClick={() => {
                                onSigned(document.id);
                                onClose();
                            }}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "9px",
                                border: "none",
                                backgroundColor: "#2563eb",
                                color: "#ffffff",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "background-color 0.15s ease",
                            }}
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
