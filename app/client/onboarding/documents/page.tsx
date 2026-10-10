"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FileText,
    CheckCircle2,
    Clock,
    Eye,
    PenLine,
    ArrowRight,
    Loader2,
    AlertCircle,
    ShieldCheck,
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

    // Modals
    const [signingDoc, setSigningDoc] = useState<ClientDocumentItem | null>(null);
    const [viewingDoc, setViewingDoc] = useState<ClientDocumentItem | null>(null);

    useEffect(() => {
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
                    setError("No active project found for your account.");
                    setLoading(false);
                    return;
                }

                const [projRes, docsRes] = await Promise.all([
                    getClientProject(pid),
                    getClientDocuments(pid),
                ]);

                setProject(projRes.project);
                setDocuments(docsRes.items);
            } catch (err: any) {
                setError(err.message || "Failed to load project documents.");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
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
                setDocuments(refreshed.items);
            } catch (e) {
                console.warn("Could not refresh documents:", e);
            }
        }
    };

    const handleContinue = async () => {
        if (!project) return;
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
            <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Loader2 className="animate-spin" size={36} color="#2563EB" style={{ margin: "0 auto 16px auto" }} />
                <h3 style={{ fontSize: "16px", color: "#1E293B", fontWeight: 500 }}>
                    Loading project documents...
                </h3>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center", padding: "40px 20px" }}>
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
                        borderRadius: "8px",
                        backgroundColor: "#2563EB",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    Back to Onboarding
                </button>
            </div>
        );
    }

    const allSigned = documents.length > 0 && documents.every((d) => d.status === "signed");

    return (
        <ClientOnboardingLayout
            activeStep="documents"
            completedSteps={["welcome"]}
            projectId={project.id}
        >
            <div style={{ maxWidth: "780px" }}>
                {/* Company Eyebrow */}
                <div
                    style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        color: "#2563EB",
                        textTransform: "uppercase",
                        marginBottom: "10px",
                    }}
                >
                    {project.companyName || "MERIDIAN BUILD CO."}
                </div>

                {/* Main Heading */}
                <h1
                    style={{
                        fontSize: "30px",
                        fontWeight: 700,
                        color: "#0F172A",
                        lineHeight: 1.25,
                        letterSpacing: "-0.02em",
                        margin: "0 0 10px 0",
                    }}
                >
                    Review &amp; Sign Documents
                </h1>

                {/* Subtitle */}
                <p
                    style={{
                        fontSize: "15px",
                        color: "#64748B",
                        lineHeight: 1.6,
                        margin: "0 0 28px 0",
                    }}
                >
                    Please review and sign the required project documents to finalize your onboarding for{" "}
                    <strong style={{ color: "#1E293B" }}>{project.name}</strong>.
                </p>

                {/* Documents List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
                    {documents.map((doc) => {
                        const isSigned = doc.status === "signed";

                        return (
                            <div
                                key={doc.id}
                                style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "14px",
                                    border: "1px solid #E2E8F0",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                                    padding: "20px 24px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: "16px",
                                }}
                            >
                                {/* Left Info */}
                                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                    <div
                                        style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "12px",
                                            backgroundColor: isSigned ? "#ECFDF5" : "#EFF6FF",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <FileText size={24} color={isSigned ? "#059669" : "#2563EB"} />
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <h3
                                                style={{
                                                    fontSize: "16px",
                                                    fontWeight: 600,
                                                    color: "#0F172A",
                                                    margin: 0,
                                                }}
                                            >
                                                {doc.title}
                                            </h3>
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    padding: "3px 8px",
                                                    borderRadius: "999px",
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    backgroundColor: isSigned ? "#ECFDF5" : "#FFFBEB",
                                                    color: isSigned ? "#059669" : "#D97706",
                                                }}
                                            >
                                                {isSigned ? (
                                                    <>
                                                        <CheckCircle2 size={12} />
                                                        SIGNED
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock size={12} />
                                                        AWAITING SIGNATURE
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                color: "#64748B",
                                                marginTop: "4px",
                                            }}
                                        >
                                            {doc.reference}
                                            {doc.signedAt && isSigned
                                                ? ` • Signed on ${new Date(doc.signedAt).toLocaleDateString()}`
                                                : " • Required document"}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Actions */}
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setViewingDoc(doc)}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "9px 16px",
                                            borderRadius: "8px",
                                            border: "1px solid #CBD5E1",
                                            backgroundColor: "#ffffff",
                                            color: "#334155",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        <Eye size={15} />
                                        <span>View Document</span>
                                    </button>

                                    {isSigned ? (
                                        <div
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                padding: "9px 16px",
                                                borderRadius: "8px",
                                                backgroundColor: "#F1F5F9",
                                                color: "#475569",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                            }}
                                        >
                                            <ShieldCheck size={16} color="#059669" />
                                            <span>Signed</span>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setSigningDoc(doc)}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                padding: "9px 18px",
                                                borderRadius: "8px",
                                                border: "none",
                                                backgroundColor: "#2563EB",
                                                color: "#ffffff",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                transition: "all 0.15s ease",
                                            }}
                                        >
                                            <PenLine size={15} />
                                            <span>Sign Document</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Continue to Dashboard Banner / Button */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        backgroundColor: allSigned ? "#ECFDF5" : "#F8FAFC",
                        borderRadius: "12px",
                        border: allSigned ? "1px solid #A7F3D0" : "1px solid #E2E8F0",
                        marginBottom: "16px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {allSigned ? (
                            <>
                                <CheckCircle2 size={20} color="#059669" />
                                <span style={{ fontSize: "14px", color: "#065F46", fontWeight: 600 }}>
                                    All documents have been reviewed and signed!
                                </span>
                            </>
                        ) : (
                            <>
                                <Clock size={20} color="#D97706" />
                                <span style={{ fontSize: "14px", color: "#64748B" }}>
                                    You can proceed to the dashboard now, or sign any remaining documents later.
                                </span>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleContinue}
                        disabled={submitting}
                        style={{
                            padding: "12px 24px",
                            borderRadius: "10px",
                            backgroundColor: "#2563EB",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: 600,
                            border: "none",
                            cursor: submitting ? "not-allowed" : "pointer",
                            opacity: submitting ? 0.75 : 1,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                        }}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                <span>Proceeding...</span>
                            </>
                        ) : (
                            <>
                                <span>Continue to Dashboard</span>
                                <ArrowRight size={16} />
                            </>
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
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                    <Loader2 className="animate-spin" size={36} color="#2563EB" style={{ margin: "0 auto 16px auto" }} />
                </div>
            }
        >
            <OnboardingDocumentsContent />
        </Suspense>
    );
}
