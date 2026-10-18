"use client";

import React, { useState, useMemo } from "react";
import { X, CheckCircle2, AlertCircle, Loader2, FileText, Download } from "lucide-react";
import { type BoqListItem, formatFullIndianCurrency } from "@/lib/domain/boq-data";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";

interface BoqGenerateProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    boq: BoqListItem;
    boqData?: any;
    rooms: any[];
    grandTotal: number;
    onSuccess?: (createdProposal: {
        id: string;
        proposalCode: string;
        projectName: string;
        clientName: string;
    }) => void;
}

export default function BoqGenerateProposalModal({
    isOpen,
    onClose,
    boq,
    boqData,
    rooms,
    grandTotal,
    onSuccess,
}: BoqGenerateProposalModalProps) {
    // Generate default scope items from rooms
    const defaultScopeItems = useMemo(() => {
        if (!rooms || rooms.length === 0) {
            return [`Fitout and items for ${boq.projectName}`];
        }
        return rooms.map((room) => {
            const allItems = (room.categories || []).flatMap((c: any) => c.items || []);
            const itemCount = allItems.length;
            const roomTotal = allItems.reduce((acc: number, item: any) => {
                const amt = Number(item.amount);
                if (!isNaN(amt) && amt > 0) return acc + amt;
                const q = Number(item.quantity) || 0;
                const r = Number(item.rate) || 0;
                return acc + (q * r);
            }, 0);

            const specPreview = allItems.find((i: any) => i.description)?.description;
            if (specPreview) {
                return `${room.name} — ${itemCount} items (${specPreview}) ${roomTotal > 0 ? `— ${formatFullIndianCurrency(roomTotal)}` : ""}`;
            }
            return `${room.name} — ${itemCount} items ${roomTotal > 0 ? `(${formatFullIndianCurrency(roomTotal)})` : ""}`;
        });
    }, [rooms, boq.projectName]);

    // Form fields
    const defaultExpiryDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split("T")[0];
    }, []);

    const [projectName, setProjectName] = useState(boqData?.projectName || boq.projectName || "Untitled Project");
    const [clientName, setClientName] = useState(
        boqData?.clientName || boqData?.client_name || boqData?.client || ""
    );
    const [proposedValue, setProposedValue] = useState<string>(String(Math.round(grandTotal) || 0));
    const [expiryDate, setExpiryDate] = useState(defaultExpiryDate);
    const [internalNotes, setInternalNotes] = useState(
        `Generated from BOQ ${boq.boqNumber} (${boq.version}) for project ${boq.projectName}.`
    );
    const [scopeItems, setScopeItems] = useState<string[]>(defaultScopeItems);
    const [newScopeText, setNewScopeText] = useState("");

    // Submission states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [createdProposal, setCreatedProposal] = useState<{
        id: string;
        proposalCode: string;
        projectName: string;
        clientName: string;
    } | null>(null);

    // Keep form prefilled if boq changes
    React.useEffect(() => {
        setProjectName(boqData?.projectName || boq.projectName || "Untitled Project");
        setClientName(boqData?.clientName || boqData?.client_name || boqData?.client || "");
        setProposedValue(String(Math.round(grandTotal) || 0));
        setInternalNotes(`Generated from BOQ ${boq.boqNumber} (${boq.version}) for project ${boq.projectName}.`);
        setScopeItems(defaultScopeItems);
        setError("");
        setCreatedProposal(null);
    }, [boq.id, boq.boqNumber, boq.version, boq.projectName, boqData, grandTotal, defaultScopeItems]);

    if (!isOpen) return null;

    const handleAddScopeItem = () => {
        if (!newScopeText.trim()) return;
        setScopeItems((prev) => [...prev, newScopeText.trim()]);
        setNewScopeText("");
    };

    const handleRemoveScopeItem = (index: number) => {
        setScopeItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!projectName.trim()) {
            setError("Project Name is required.");
            return;
        }

        if (!clientName.trim()) {
            setError("Client Name is required.");
            return;
        }

        const numericValue = parseFloat(proposedValue);
        if (isNaN(numericValue) || numericValue < 0) {
            setError("Proposed Value must be a valid positive number.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Check UUID format
            const isUuid = (val?: string | null) =>
                Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

            const payload: Record<string, unknown> = {
                sourceType: "boq",
                sourceId: isUuid(boq.id) ? boq.id : undefined,
                sourceLabel: `${boq.boqNumber} - ${boq.version}`,
                projectName: projectName.trim(),
                clientName: clientName.trim(),
                proposedValue: numericValue,
                expiryDate: expiryDate || null,
                internalNotes: internalNotes.trim() || null,
                scopeItems: scopeItems.filter((s) => s.trim().length > 0),
            };

            if (isUuid(boq.projectId)) {
                payload.projectId = boq.projectId;
            }

            const response = await fetch("/api/v1/proposals", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(getApiErrorMessage(responseData));
            }

            const result = parseApiResponse<{
                id: string;
                proposalCode: string;
                projectName: string;
                clientName: string;
            }>(responseData);

            const proposalRecord = {
                id: result.id,
                proposalCode: result.proposalCode || "Proposal",
                projectName: result.projectName,
                clientName: result.clientName,
            };

            setCreatedProposal(proposalRecord);
            if (onSuccess) {
                onSuccess(proposalRecord);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create proposal");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="boq-modal-backdrop" onClick={onClose}>
            <div
                className="boq-items-modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: "680px",
                    width: "95%",
                    maxHeight: "90vh",
                    display: "flex",
                    flexDirection: "column",
                    background: "#FFFFFF",
                    borderRadius: "12px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    overflow: "hidden",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid #E2E8F0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "18px",
                                fontWeight: 700,
                                color: "#0F172A",
                                fontFamily: "'Urbanist', sans-serif",
                            }}
                        >
                            Generate Proposal
                        </h2>
                        <p
                            style={{
                                margin: "4px 0 0",
                                fontSize: "14px",
                                color: "#64748B",
                                fontFamily: "'Urbanist', sans-serif",
                            }}
                        >
                            Create a formal client proposal using this BOQ&apos;s data and scope.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#64748B",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Body */}
                <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                    {/* Success State */}
                    {createdProposal ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                textAlign: "center",
                                padding: "24px 16px",
                                gap: "16px",
                            }}
                        >
                            <div
                                style={{
                                    width: "56px",
                                    height: "56px",
                                    borderRadius: "28px",
                                    background: "#ECFDF5",
                                    color: "#059669",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <h3
                                    style={{
                                        margin: "0 0 6px",
                                        fontSize: "18px",
                                        fontWeight: 700,
                                        color: "#0F172A",
                                        fontFamily: "'Urbanist', sans-serif",
                                    }}
                                >
                                    Proposal Generated Successfully!
                                </h3>
                                <p style={{ margin: 0, color: "#64748B", fontSize: "14px" }}>
                                    Proposal <strong>{createdProposal.proposalCode}</strong> has been created and linked to{" "}
                                    <strong>{boq.boqNumber}</strong>.
                                </p>
                            </div>

                            <div
                                style={{
                                    background: "#F8FAFC",
                                    border: "1px solid #E2E8F0",
                                    borderRadius: "8px",
                                    padding: "16px 20px",
                                    width: "100%",
                                    maxWidth: "480px",
                                    textAlign: "left",
                                    fontSize: "14px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Reference:</span>
                                    <strong style={{ color: "#0F172A" }}>{createdProposal.proposalCode}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Project:</span>
                                    <span style={{ color: "#0F172A", fontWeight: 500 }}>{createdProposal.projectName}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Client:</span>
                                    <span style={{ color: "#0F172A", fontWeight: 500 }}>{createdProposal.clientName}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Value:</span>
                                    <strong style={{ color: "#2563EB" }}>
                                        {formatFullIndianCurrency(Number(proposedValue))}
                                    </strong>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => window.open(`/api/v1/proposals/${createdProposal.id}/pdf`, "_blank")}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "12px 20px",
                                        background: "#FFFFFF",
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "6px",
                                        fontWeight: 600,
                                        fontSize: "14px",
                                        color: "#0F172A",
                                        cursor: "pointer",
                                    }}
                                >
                                    <Download size={16} />
                                    Download Proposal PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        padding: "12px 28px",
                                        background: "#2563EB",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontWeight: 600,
                                        fontSize: "14px",
                                        color: "#FFFFFF",
                                        cursor: "pointer",
                                    }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Proposal Input Form */
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                            {error && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "12px 16px",
                                        background: "#FEF2F2",
                                        border: "1px solid #FECACA",
                                        borderRadius: "8px",
                                        color: "#DC2626",
                                        fontSize: "14px",
                                    }}
                                >
                                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Source BOQ context card */}
                            <div
                                style={{
                                    background: "#EFF6FF",
                                    border: "1px solid #BFDBFE",
                                    borderRadius: "8px",
                                    padding: "12px 16px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontSize: "13px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <FileText size={18} color="#2563EB" />
                                    <div>
                                        <div style={{ color: "#1E40AF", fontWeight: 600 }}>
                                            Source BOQ: {boq.boqNumber} ({boq.version})
                                        </div>
                                        <div style={{ color: "#3B82F6", fontSize: "12px" }}>
                                            {rooms.length} Rooms • {boq.items} Total Items
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ color: "#64748B", fontSize: "11px" }}>ESTIMATED TOTAL</div>
                                    <strong style={{ color: "#0F172A", fontSize: "14px" }}>
                                        {formatFullIndianCurrency(grandTotal)}
                                    </strong>
                                </div>
                            </div>

                            {/* Two-column basic info */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            color: "#0F172A",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        Project Name <span style={{ color: "#DC2626" }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        required
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px 12px",
                                            border: "1px solid #CBD5E1",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                        }}
                                    />
                                </div>

                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            color: "#0F172A",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        Client Name <span style={{ color: "#DC2626" }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Acme Corp / Rahul Sharma"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        required
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px 12px",
                                            border: "1px solid #CBD5E1",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            color: "#0F172A",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        Proposed Value (₹) <span style={{ color: "#DC2626" }}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={proposedValue}
                                        onChange={(e) => setProposedValue(e.target.value)}
                                        required
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px 12px",
                                            border: "1px solid #CBD5E1",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                        }}
                                    />
                                </div>

                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            color: "#0F172A",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        Validity / Expiry Date
                                    </label>
                                    <input
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px 12px",
                                            border: "1px solid #CBD5E1",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            outline: "none",
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Scope Items */}
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#0F172A",
                                        marginBottom: "6px",
                                    }}
                                >
                                    Scope of Work Items ({scopeItems.length})
                                </label>
                                <div
                                    style={{
                                        maxHeight: "150px",
                                        overflowY: "auto",
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "6px",
                                        padding: "8px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "6px",
                                        background: "#F8FAFC",
                                    }}
                                >
                                    {scopeItems.length === 0 ? (
                                        <div style={{ color: "#94A3B8", fontSize: "13px", padding: "8px" }}>
                                            No scope items added yet. Add items below.
                                        </div>
                                    ) : (
                                        scopeItems.map((item, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    padding: "6px 10px",
                                                    background: "#FFFFFF",
                                                    border: "1px solid #E2E8F0",
                                                    borderRadius: "4px",
                                                    fontSize: "13px",
                                                    color: "#334155",
                                                }}
                                            >
                                                <span>{item}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveScopeItem(idx)}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "#94A3B8",
                                                        cursor: "pointer",
                                                        padding: "2px",
                                                    }}
                                                    title="Remove item"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                    <input
                                        type="text"
                                        placeholder="Add custom scope line item..."
                                        value={newScopeText}
                                        onChange={(e) => setNewScopeText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddScopeItem();
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: "8px 12px",
                                            border: "1px solid #CBD5E1",
                                            borderRadius: "6px",
                                            fontSize: "13px",
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddScopeItem}
                                        style={{
                                            padding: "8px 16px",
                                            background: "#FFFFFF",
                                            border: "1px solid #CBD5E1",
                                            borderRadius: "6px",
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Internal Notes */}
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#0F172A",
                                        marginBottom: "6px",
                                    }}
                                >
                                    Internal Notes
                                </label>
                                <textarea
                                    rows={2}
                                    value={internalNotes}
                                    onChange={(e) => setInternalNotes(e.target.value)}
                                    placeholder="Internal notes or terms (optional)..."
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "8px 12px",
                                        border: "1px solid #CBD5E1",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        outline: "none",
                                        fontFamily: "inherit",
                                    }}
                                />
                            </div>

                            {/* Footer Actions */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    alignItems: "center",
                                    gap: "12px",
                                    paddingTop: "12px",
                                    borderTop: "1px solid #E2E8F0",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    style={{
                                        padding: "10px 18px",
                                        background: "#FFFFFF",
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "#475569",
                                        cursor: isSubmitting ? "not-allowed" : "pointer",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "10px 24px",
                                        background: "#2563EB",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        color: "#FFFFFF",
                                        cursor: isSubmitting ? "not-allowed" : "pointer",
                                        opacity: isSubmitting ? 0.75 : 1,
                                    }}
                                >
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    {isSubmitting ? "Generating..." : "Generate Proposal"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
