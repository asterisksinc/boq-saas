"use client";

import { X, ExternalLink, Download, FileText, CheckCircle2, Clock } from "lucide-react";
import type { ClientDocumentItem } from "@/lib/api/client";

type DocumentViewerModalProps = {
    projectId: string;
    document: ClientDocumentItem;
    onClose: () => void;
    onSign?: () => void;
};

export function DocumentViewerModal({
    projectId,
    document,
    onClose,
    onSign,
}: DocumentViewerModalProps) {
    const isSigned = document.status === "signed";
    // Derive preview URL
    const previewUrl =
        document.type === "proposal"
            ? `/api/v1/proposals/${document.id}/pdf`
            : `/api/v1/client/projects/${projectId}/documents/${document.id}/view`;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 60,
                backgroundColor: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    width: "100%",
                    maxWidth: "880px",
                    height: "90vh",
                    maxHeight: "840px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    overflow: "hidden",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "16px 24px",
                        borderBottom: "1px solid #E2E8F0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "#F8FAFC",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                backgroundColor: isSigned ? "#ECFDF5" : "#EFF6FF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <FileText size={20} color={isSigned ? "#059669" : "#2563EB"} />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: "16px",
                                        fontWeight: 600,
                                        color: "#0F172A",
                                    }}
                                >
                                    {document.title}
                                </h3>
                                <span
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        padding: "2px 8px",
                                        borderRadius: "999px",
                                        backgroundColor: isSigned ? "#ECFDF5" : "#EFF6FF",
                                        color: isSigned ? "#059669" : "#2563EB",
                                    }}
                                >
                                    {document.type.toUpperCase()}
                                </span>
                            </div>
                            <p
                                style={{
                                    margin: "2px 0 0 0",
                                    fontSize: "12px",
                                    color: "#64748B",
                                }}
                            >
                                {document.referenceNumber || document.id}
                                {document.version ? ` • v${document.version}` : ""}
                                {document.fileSize ? ` • ${document.fileSize}` : ""}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "1px solid #CBD5E1",
                                backgroundColor: "#ffffff",
                                color: "#334155",
                                fontSize: "13px",
                                fontWeight: 500,
                                textDecoration: "none",
                                cursor: "pointer",
                            }}
                        >
                            <ExternalLink size={14} />
                            Open New Tab
                        </a>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: "transparent",
                                color: "#64748B",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* PDF Viewer Frame / Fallback */}
                <div
                    style={{
                        flex: 1,
                        backgroundColor: "#E2E8F0",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <iframe
                        src={previewUrl}
                        title={document.title}
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            backgroundColor: "#ffffff",
                        }}
                    />
                </div>

                {/* Footer with status and action */}
                <div
                    style={{
                        padding: "14px 24px",
                        borderTop: "1px solid #E2E8F0",
                        backgroundColor: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isSigned ? (
                            <>
                                <CheckCircle2 size={16} color="#059669" />
                                <span style={{ fontSize: "13px", color: "#059669", fontWeight: 500 }}>
                                    Signed by {document.signedBy || "Client"}
                                    {document.signedAt ? ` on ${new Date(document.signedAt).toLocaleDateString()}` : ""}
                                </span>
                            </>
                        ) : (
                            <>
                                <Clock size={16} color="#D97706" />
                                <span style={{ fontSize: "13px", color: "#64748B" }}>
                                    Document awaiting your legal electronic signature
                                </span>
                            </>
                        )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: "1px solid #CBD5E1",
                                backgroundColor: "#ffffff",
                                color: "#334155",
                                fontSize: "13px",
                                fontWeight: 500,
                                cursor: "pointer",
                            }}
                        >
                            Close
                        </button>

                        {!isSigned && onSign && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onSign();
                                }}
                                style={{
                                    padding: "8px 18px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: "#2563EB",
                                    color: "#ffffff",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                Sign Document
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
