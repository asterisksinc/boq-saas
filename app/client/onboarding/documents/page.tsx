"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FileText,
    FileCheck2,
    Loader2,
    AlertCircle,
    Check,
} from "lucide-react";
import { ClientOnboardingLayout } from "@/components/client/ClientOnboardingLayout";
import { DocumentSignModal } from "@/components/client/DocumentSignModal";
import { DocumentViewerModal } from "@/components/client/DocumentViewerModal";
import {
    getClientProject,
    getClientDocuments,
    getClientDashboard,
    updateClientOnboarding,
    type ClientProjectDetails,
    type ClientDocumentItem,
} from "@/lib/api/client";

function OnboardingDocumentsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryProjectId = searchParams.get("projectId") || "";

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [project, setProject] = useState<ClientProjectDetails | null>(null);
    const [documents, setDocuments] = useState<ClientDocumentItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [refreshWarning, setRefreshWarning] = useState<string | null>(null);

    // Modals
    const [signingDoc, setSigningDoc] = useState<ClientDocumentItem | null>(null);
    const [viewingDoc, setViewingDoc] = useState<ClientDocumentItem | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                let pid = queryProjectId;
                if (!pid) {
                    const dash = await getClientDashboard();
                    pid = dash?.project?.id || "";
                }

                if (!pid) {
                    if (isMounted) {
                        setError("No active project found for your account.");
                        setLoading(false);
                    }
                    return;
                }

                const [projRes, docsRes] = await Promise.all([
                    getClientProject(pid),
                    getClientDocuments(pid),
                ]);

                if (isMounted) {
                    setProject(projRes.project);
                    setDocuments(docsRes.items || []);
                }
            } catch (err: any) {
                if (isMounted) setError(err.message || "Failed to load project documents.");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [queryProjectId]);

    const handleSigned = async (docId: string) => {
        setDocuments((prev) =>
            prev.map((d) =>
                d.id === docId
                    ? {
                          ...d,
                          status: "signed",
                          signedAt: new Date().toISOString(),
                          signerName: project?.clientName || "Client",
                      }
                    : d
            )
        );

        if (project?.id) {
            try {
                const refreshed = await getClientDocuments(project.id);
                setDocuments(refreshed.items || []);
                setRefreshWarning(null);
            } catch (e) {
                console.warn("Could not refresh documents:", e);
                setRefreshWarning(
                    "Your document was signed successfully, but we could not refresh the list from the server. You can safely continue to the dashboard or reload."
                );
            }
        }
    };

    const handleDownload = (doc: ClientDocumentItem) => {
        if (!project) return;
        const downloadUrl =
            doc.type === "proposal"
                ? `/api/v1/proposals/${doc.id}/pdf`
                : doc.viewUrl || `/api/v1/client/projects/${project.id}/documents/${doc.id}/view`;
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleContinue = async () => {
        if (!project || submitting) return;
        setSubmitting(true);
        try {
            await updateClientOnboarding(project.id, "dashboard");
        } catch (err) {
            console.warn("Could not finalize onboarding status:", err);
        } finally {
            router.push(`/client/dashboard?projectId=${encodeURIComponent(project.id)}`);
        }
    };

    if (loading) {
        return (
            <div className="client-docs-loading-state" style={{ textAlign: "center", padding: "120px 0", width: "100%" }}>
                <Loader2 className="animate-spin" size={36} color="#2563EB" style={{ margin: "0 auto 16px auto" }} />
                <h3 style={{ fontSize: "16px", color: "#1E293B", fontWeight: 500 }}>
                    Loading project documents...
                </h3>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="client-docs-error-state" style={{ maxWidth: "596px", margin: "64px auto", textAlign: "center", padding: "40px 20px" }}>
                <div
                    style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "16px",
                        backgroundColor: "#FEF2F2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px auto",
                    }}
                >
                    <AlertCircle size={28} color="#EF4444" />
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>
                    Error Loading Documents
                </h2>
                <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px" }}>
                    {error || "Unable to retrieve documents for this project."}
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/client/onboarding")}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "6px",
                        backgroundColor: "#2563EB",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: 500,
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    Back to Onboarding
                </button>
            </div>
        );
    }

    return (
        <ClientOnboardingLayout
            activeStep="documents"
            completedSteps={["welcome"]}
            projectId={project.id}
        >
            {/* Frame 2147225026: Header Block */}
            <div className="client-docs-header-block">
                <h1 className="client-docs-title">
                    Review &amp; Sign Documents
                </h1>
                <p className="client-docs-subtitle">
                    Your project team has shared the following documents with you. Please review and sign them to complete your onboarding.
                </p>
            </div>

            {/* Non-blocking Warning Banner if List Refresh Failed */}
            {refreshWarning && (
                <div
                    style={{
                        maxWidth: "596px",
                        marginBottom: "16px",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        backgroundColor: "#FFFBEB",
                        border: "1px solid #FDE68A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        fontSize: "13px",
                        color: "#92400E",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{refreshWarning}</span>
                    </div>
                    {project && (
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    const refreshed = await getClientDocuments(project.id);
                                    setDocuments(refreshed.items || []);
                                    setRefreshWarning(null);
                                } catch (e) {
                                    console.warn("Retry refresh failed:", e);
                                }
                            }}
                            style={{
                                padding: "4px 10px",
                                borderRadius: "4px",
                                border: "1px solid #F59E0B",
                                backgroundColor: "#FFFFFF",
                                color: "#B45309",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                flexShrink: 0,
                            }}
                        >
                            Retry
                        </button>
                    )}
                </div>
            )}

            {/* Frame 2147225032: Content Column Sections */}
            <div className="client-docs-content-sections">
                {/* Frame 2147225027: Outer Document Container */}
                <div className="client-docs-container">
                    {documents.length === 0 ? (
                        <div className="client-docs-empty-card">
                            <div className="client-doc-icon-box" style={{ marginBottom: "16px" }}>
                                <FileCheck2 size={28} color="#2563EB" />
                            </div>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#0F172A", margin: "0 0 8px 0" }}>
                                No Documents Pending
                            </h3>
                            <p style={{ fontSize: "14px", color: "#64748B", margin: 0, maxWidth: "380px" }}>
                                There are currently no documents requiring your signature or review for this project.
                            </p>
                        </div>
                    ) : (
                        documents.map((doc) => {
                            const isSigned = doc.status === "signed";
                            const displayRef =
                                doc.reference ||
                                doc.referenceNumber ||
                                (doc.type === "proposal" ? "PROP-2026-024" : "CONT-2026-011");

                            return (
                                <div key={doc.id} className="client-doc-card-figma">
                                    {/* Frame 2147225508: Top Row */}
                                    <div className="client-doc-top-row">
                                        {/* Frame 2147225507: Left Group */}
                                        <div className="client-doc-left-group">
                                            {/* Frame 26: 56x56 Icon Box */}
                                            <div className="client-doc-icon-box" aria-hidden="true">
                                                <FileText size={28} color="#2563EB" strokeWidth={1.75} />
                                            </div>
                                            {/* Frame 2: Title & Ref */}
                                            <div className="client-doc-meta-group">
                                                <h3 className="client-doc-title-text">{doc.title}</h3>
                                                <div className="client-doc-ref-text">{displayRef}</div>
                                            </div>
                                        </div>

                                        {/* Frame 2147225014: Status Badge */}
                                        <div
                                            className={`client-doc-status-badge ${
                                                isSigned ? "status-signed" : "status-awaiting"
                                            }`}
                                        >
                                            {isSigned ? "Signed" : "Awaiting Signature"}
                                        </div>
                                    </div>

                                    {/* Frame 2147225509: Buttons Row */}
                                    <div className="client-doc-buttons-row">
                                        <button
                                            type="button"
                                            className="client-doc-btn-view"
                                            onClick={() => setViewingDoc(doc)}
                                            aria-label={`View ${doc.title}`}
                                        >
                                            View Document
                                        </button>

                                        {isSigned ? (
                                            <button
                                                type="button"
                                                className="client-doc-btn-download"
                                                onClick={() => handleDownload(doc)}
                                                aria-label={`Download ${doc.title}`}
                                            >
                                                Download
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="client-doc-btn-sign"
                                                onClick={() => setSigningDoc(doc)}
                                                aria-label={`Sign ${doc.title}`}
                                            >
                                                Sign Document
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Frame 2147225031: Bottom Action Row */}
                <div className="client-docs-actions-row">
                    <div className="client-docs-btn-back-spacer" aria-hidden="true" />
                    <button
                        type="button"
                        className="client-docs-btn-continue"
                        onClick={handleContinue}
                        disabled={submitting}
                        aria-label="Continue to Dashboard"
                    >
                        {submitting ? (
                            <Loader2 className="animate-spin" size={16} color="#FFFFFF" />
                        ) : (
                            "Continue to Dashboard"
                        )}
                    </button>
                </div>
            </div>

            {/* Document Viewer Modal */}
            {viewingDoc && (
                <DocumentViewerModal
                    projectId={project.id}
                    document={viewingDoc}
                    onClose={() => setViewingDoc(null)}
                    onSign={() => {
                        const docToSign = viewingDoc;
                        setViewingDoc(null);
                        setSigningDoc(docToSign);
                    }}
                />
            )}

            {/* Document Sign Modal */}
            {signingDoc && (
                <DocumentSignModal
                    projectId={project.id}
                    document={signingDoc}
                    initialSignerName={project.clientName || ""}
                    onClose={() => setSigningDoc(null)}
                    onSigned={handleSigned}
                />
            )}
        </ClientOnboardingLayout>
    );
}

export default function ClientOnboardingDocumentsPage() {
    return (
        <Suspense
            fallback={
                <div className="client-docs-loading-state" style={{ textAlign: "center", padding: "120px 0", width: "100%" }}>
                    <Loader2 className="animate-spin" size={36} color="#2563EB" style={{ margin: "0 auto 16px auto" }} />
                </div>
            }
        >
            <OnboardingDocumentsContent />
        </Suspense>
    );
}
