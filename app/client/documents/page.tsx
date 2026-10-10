"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Eye,
    FileText,
    PenLine,
    Download,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    RefreshCw,
    Search,
    ShieldCheck,
} from "lucide-react";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import { DocumentSignModal } from "@/components/client/DocumentSignModal";
import { DocumentViewerModal } from "@/components/client/DocumentViewerModal";
import {
    listClientDocuments,
    listClientProjects,
    type ClientDocumentItem,
    type ClientProjectDetails,
} from "@/lib/api/client";

export default function ClientDocumentsPage() {
    const [documents, setDocuments] = useState<Array<ClientDocumentItem & { projectId?: string; projectName?: string }>>([]);
    const [projects, setProjects] = useState<ClientProjectDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedProjectId, setSelectedProjectId] = useState("");

    // Modal state
    const [viewingDoc, setViewingDoc] = useState<ClientDocumentItem | null>(null);
    const [signingDoc, setSigningDoc] = useState<ClientDocumentItem | null>(null);
    const [activeProjectId, setActiveProjectId] = useState<string>("");

    const loadProjects = useCallback(async () => {
        try {
            const res = await listClientProjects();
            setProjects(res.items || []);
        } catch {
            // Ignore error
        }
    }, []);

    const loadDocuments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listClientDocuments({
                projectId: selectedProjectId || undefined,
                type: typeFilter !== "all" ? typeFilter : undefined,
                status: statusFilter !== "all" ? statusFilter : undefined,
                search: searchQuery || undefined,
            });
            setDocuments(res.items);
            if (!activeProjectId && res.items.length > 0 && (res.items[0] as any).projectId) {
                setActiveProjectId((res.items[0] as any).projectId);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load project documents.");
        } finally {
            setLoading(false);
        }
    }, [selectedProjectId, typeFilter, statusFilter, searchQuery, activeProjectId]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const handleSigned = (docId: string) => {
        setSigningDoc(null);
        loadDocuments();
    };

    const awaitingSignatureCount = documents.filter((d) => d.status === "awaiting_signature").length;
    const signedCount = documents.filter((d) => d.status === "signed").length;

    return (
        <main className="fig-dashboard">
            <div className="fig-dashboard-glow" />

            <ClientDashboardRail current="/client/documents" />

            <div className="fig-dashboard-main">
                <DashboardHeader
                    title="Documents"
                    hideNew={true}
                    onSearch={(q) => setSearchQuery(q)}
                />

                <section style={{ padding: "24px 32px" }}>
                    {/* Page Header */}
                    <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                Project Documents
                            </h2>
                            <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>
                                {documents.length} {documents.length === 1 ? "document" : "documents"} • {awaitingSignatureCount} awaiting your signature
                            </p>
                        </div>

                        {/* Summary Badges */}
                        <div style={{ display: "flex", gap: "10px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: "#eff6ff",
                                    border: "1px solid #bfdbfe",
                                    borderRadius: "8px",
                                    padding: "6px 12px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#1d4ed8",
                                }}
                            >
                                <Clock size={15} /> {awaitingSignatureCount} Pending
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                    borderRadius: "8px",
                                    padding: "6px 12px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#15803d",
                                }}
                            >
                                <CheckCircle2 size={15} /> {signedCount} Signed
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "12px",
                            marginBottom: "20px",
                        }}
                    >
                        {/* Status Tabs */}
                        <div style={{ display: "flex", gap: "8px" }}>
                            {[
                                { key: "all", label: "All Documents" },
                                { key: "awaiting_signature", label: "Awaiting Signature" },
                                { key: "signed", label: "Signed" },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setStatusFilter(tab.key)}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        border: statusFilter === tab.key ? "1px solid #2563eb" : "1px solid #e2e8f0",
                                        backgroundColor: statusFilter === tab.key ? "#eff6ff" : "#ffffff",
                                        color: statusFilter === tab.key ? "#2563eb" : "#64748b",
                                        cursor: "pointer",
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Dropdown Filters */}
                        <div style={{ display: "flex", gap: "10px" }}>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "13px",
                                    backgroundColor: "#ffffff",
                                    color: "#334155",
                                    outline: "none",
                                }}
                            >
                                <option value="all">All Types</option>
                                <option value="proposal">Proposals</option>
                                <option value="contract">Contracts</option>
                                <option value="document">Attachments</option>
                            </select>

                            {projects.length > 1 && (
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        backgroundColor: "#ffffff",
                                        color: "#334155",
                                        outline: "none",
                                    }}
                                >
                                    <option value="">All Projects</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div
                            style={{
                                padding: "16px",
                                borderRadius: "8px",
                                backgroundColor: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#b91c1c",
                                marginBottom: "20px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                            }}
                        >
                            <AlertCircle size={18} />
                            <span>{error}</span>
                            <button
                                type="button"
                                onClick={loadDocuments}
                                style={{
                                    marginLeft: "auto",
                                    background: "none",
                                    border: "none",
                                    color: "#b91c1c",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <RefreshCw size={14} /> Retry
                            </button>
                        </div>
                    )}

                    {/* Documents List */}
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            overflow: "hidden",
                        }}
                    >
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>DOCUMENT</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>REFERENCE</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>PROJECT</th>
                                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>TYPE</th>
                                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>STATUS</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>SIGNATURE / DATE</th>
                                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "48px 16px" }}>
                                            <Loader2 className="animate-spin" size={32} color="#2563EB" style={{ margin: "0 auto 8px auto" }} />
                                            <div style={{ color: "#64748b", fontSize: "14px" }}>Loading your documents...</div>
                                        </td>
                                    </tr>
                                ) : documents.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "56px 16px" }}>
                                            <div style={{ maxWidth: "360px", margin: "0 auto" }}>
                                                <FileText size={40} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
                                                <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>
                                                    No Documents Available
                                                </h4>
                                                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                                    {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                                                        ? "No documents match your active filter criteria."
                                                        : "No proposals or contracts have been linked to your project yet."}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    documents.map((doc) => {
                                        const isSigned = doc.status === "signed";
                                        const docProjId = (doc as any).projectId || activeProjectId;
                                        return (
                                            <tr
                                                key={doc.id}
                                                style={{ borderBottom: "1px solid #f1f5f9" }}
                                            >
                                                <td style={{ padding: "14px 16px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <div
                                                            style={{
                                                                width: "36px",
                                                                height: "36px",
                                                                borderRadius: "8px",
                                                                backgroundColor: isSigned ? "#f0fdf4" : "#eff6ff",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                color: isSigned ? "#16a34a" : "#2563eb",
                                                            }}
                                                        >
                                                            <FileText size={18} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: "#0f172a" }}>{doc.title}</div>
                                                            {doc.fileSize && (
                                                                <div style={{ fontSize: "12px", color: "#94a3b8" }}>{doc.fileSize}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "14px 16px", fontFamily: "monospace", fontSize: "13px", color: "#475569" }}>
                                                    {doc.reference}
                                                </td>
                                                <td style={{ padding: "14px 16px", fontWeight: 500, color: "#334155" }}>
                                                    {(doc as any).projectName || "Project"}
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                                    <span
                                                        style={{
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            padding: "3px 8px",
                                                            borderRadius: "4px",
                                                            backgroundColor: doc.type === "proposal" ? "#fef3c7" : "#e0e7ff",
                                                            color: doc.type === "proposal" ? "#92400e" : "#3730a3",
                                                            textTransform: "capitalize",
                                                        }}
                                                    >
                                                        {doc.type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            padding: "4px 10px",
                                                            borderRadius: "999px",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            backgroundColor: isSigned ? "#dcfce7" : "#fef9c3",
                                                            color: isSigned ? "#15803d" : "#854d0e",
                                                        }}
                                                    >
                                                        {isSigned ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                                                        {isSigned ? "Signed" : "Awaiting Signature"}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>
                                                    {isSigned ? (
                                                        <div>
                                                            <div style={{ fontWeight: 500, color: "#0f172a" }}>
                                                                {doc.signerName || "Authorized Client"}
                                                            </div>
                                                            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                                                                {doc.signedAt ? new Date(doc.signedAt).toLocaleDateString() : "Confirmed"}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: "#d97706", fontWeight: 500 }}>Action Required</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                                    <div style={{ display: "inline-flex", gap: "6px" }}>
                                                        <button
                                                            type="button"
                                                            title="View Document"
                                                            onClick={() => {
                                                                setActiveProjectId(docProjId);
                                                                setViewingDoc(doc);
                                                            }}
                                                            style={{
                                                                padding: "6px 10px",
                                                                borderRadius: "6px",
                                                                border: "1px solid #cbd5e1",
                                                                background: "#ffffff",
                                                                color: "#334155",
                                                                fontSize: "12px",
                                                                fontWeight: 600,
                                                                cursor: "pointer",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "4px",
                                                            }}
                                                        >
                                                            <Eye size={13} /> View
                                                        </button>

                                                        {!isSigned && doc.requiresSignature && (
                                                            <button
                                                                type="button"
                                                                title="Sign Document"
                                                                onClick={() => {
                                                                    setActiveProjectId(docProjId);
                                                                    setSigningDoc(doc);
                                                                }}
                                                                style={{
                                                                    padding: "6px 12px",
                                                                    borderRadius: "6px",
                                                                    border: "none",
                                                                    background: "#2563eb",
                                                                    color: "#ffffff",
                                                                    fontSize: "12px",
                                                                    fontWeight: 600,
                                                                    cursor: "pointer",
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                }}
                                                            >
                                                                <PenLine size={13} /> Sign
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            title="Download File"
                                                            onClick={() => window.open(doc.viewUrl, "_blank")}
                                                            style={{
                                                                padding: "6px",
                                                                borderRadius: "6px",
                                                                border: "1px solid #cbd5e1",
                                                                background: "#ffffff",
                                                                color: "#334155",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            <Download size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Viewer Modal */}
            {viewingDoc && (
                <DocumentViewerModal
                    projectId={activeProjectId}
                    document={viewingDoc}
                    onClose={() => setViewingDoc(null)}
                    onSign={
                        viewingDoc.status !== "signed"
                            ? () => {
                                  const doc = viewingDoc;
                                  setViewingDoc(null);
                                  setSigningDoc(doc);
                              }
                            : undefined
                    }
                />
            )}

            {/* E-Signature Modal */}
            {signingDoc && (
                <DocumentSignModal
                    projectId={activeProjectId}
                    document={signingDoc}
                    onClose={() => setSigningDoc(null)}
                    onSigned={handleSigned}
                />
            )}
        </main>
    );
}
