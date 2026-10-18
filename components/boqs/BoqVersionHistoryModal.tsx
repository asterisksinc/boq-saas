"use client";

import React, { useState, useEffect } from "react";
import { X, History, Plus, Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { getBoqRevisions, createBoqRevision } from "@/lib/api/boqs";
import { formatCompactCurrency, formatBoqDisplayDate } from "@/lib/domain/boq-data";

interface BoqVersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    boqId: string;
    boqNumber: string;
    currentVersion: string;
    onSelectVersion?: (versionBoq: any) => void;
    onRevisionCreated?: (newRevision: any) => void;
}

export default function BoqVersionHistoryModal({
    isOpen,
    onClose,
    boqId,
    boqNumber,
    currentVersion,
    onSelectVersion,
    onRevisionCreated,
}: BoqVersionHistoryModalProps) {
    const [revisions, setRevisions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingRevision, setCreatingRevision] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const loadRevisions = async () => {
        if (!boqId) return;
        try {
            setLoading(true);
            setError("");
            const res = await getBoqRevisions(boqId);
            setRevisions(res.items || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load version history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            void loadRevisions();
        }
    }, [isOpen, boqId]);

    const handleCreateMinorRevision = async () => {
        try {
            setCreatingRevision(true);
            setError("");
            const res = await createBoqRevision(boqId);
            setSuccessMsg(`Revision ${res.version || "created"} saved successfully without mutating earlier versions.`);
            setTimeout(() => setSuccessMsg(""), 3500);
            await loadRevisions();
            if (onRevisionCreated) {
                onRevisionCreated(res);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create minor revision.");
        } finally {
            setCreatingRevision(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="boq-modal-backdrop" onClick={onClose}>
            <div
                className="boq-version-history-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="boq-history-title"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="boq-version-history-header">
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <History size={20} color="#2563EB" />
                            <h3 id="boq-history-title">Version History — {boqNumber}</h3>
                        </div>
                        <p>View immutable historical snapshots and generate minor revisions.</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                            type="button"
                            className="boq-btn-create-revision-header"
                            onClick={handleCreateMinorRevision}
                            disabled={creatingRevision}
                        >
                            {creatingRevision ? (
                                <>
                                    <Loader2 size={15} className="boq-spinner" />
                                    <span>Saving…</span>
                                </>
                            ) : (
                                <>
                                    <Plus size={16} />
                                    <span>Create Minor Revision</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="boq-details-close-btn"
                            onClick={onClose}
                            aria-label="Close version history"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="boq-alert-redesign" style={{ margin: "12px 16px 0" }}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}
                {successMsg && (
                    <div
                        className="boq-alert-redesign"
                        style={{ margin: "12px 16px 0", background: "#F0FDF4", borderColor: "#BBF7D0", color: "#166534" }}
                    >
                        <CheckCircle2 size={16} />
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* Revision List */}
                <div className="boq-version-history-body">
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px", gap: "12px" }}>
                            <Loader2 size={28} className="boq-spinner" color="#2563EB" />
                            <span style={{ fontFamily: "Urbanist, sans-serif", fontSize: "14px", color: "#64748B" }}>
                                Loading version history…
                            </span>
                        </div>
                    ) : revisions.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "36px 16px", color: "#64748B" }}>
                            <p style={{ fontFamily: "Urbanist, sans-serif", fontWeight: 600, fontSize: "15px", color: "#0F172A" }}>
                                No version history found
                            </p>
                            <p style={{ fontFamily: "Urbanist, sans-serif", fontSize: "13px" }}>
                                Current version is {currentVersion}. Revisions will be stored here as immutable snapshots.
                            </p>
                        </div>
                    ) : (
                        <div className="boq-version-list">
                            {revisions.map((rev) => {
                                const isCurrent = rev.id === boqId || rev.version === currentVersion;
                                return (
                                    <div
                                        key={rev.id}
                                        className={`boq-version-item-card ${isCurrent ? "is-current" : ""}`}
                                    >
                                        <div className="boq-version-meta-left">
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span className="boq-version-tag">{rev.version}</span>
                                                {isCurrent && <span className="boq-version-current-badge">CURRENT</span>}
                                                <span className="boq-version-status-pill">{rev.status || "DRAFT"}</span>
                                            </div>
                                            <div className="boq-version-subtext">
                                                <span>Saved: {formatBoqDisplayDate(rev.createdAt || rev.created_at)}</span>
                                                {rev.assignedToName && <span>Assigned to: {rev.assignedToName}</span>}
                                                <span>{rev.roomCount || 0} Rooms | {rev.itemCount || 0} Items</span>
                                            </div>
                                        </div>

                                        <div className="boq-version-meta-right">
                                            <div className="boq-version-price-tag">
                                                {formatCompactCurrency(rev.grandTotal || rev.grand_total || 0)}
                                            </div>
                                            {onSelectVersion && (
                                                <button
                                                    type="button"
                                                    className={`boq-btn-version-select ${isCurrent ? "active" : ""}`}
                                                    onClick={() => {
                                                        onSelectVersion(rev);
                                                        onClose();
                                                    }}
                                                >
                                                    {isCurrent ? "Viewing" : "Open Snapshot"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="boq-version-history-footer">
                    <span style={{ fontFamily: "Urbanist, sans-serif", fontSize: "13px", color: "#64748B" }}>
                        Each revision preserves room data, line items, rates, and totals as an immutable snapshot.
                    </span>
                    <button type="button" className="boq-btn-create-cancel-redesign" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
