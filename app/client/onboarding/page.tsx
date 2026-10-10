"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Building2,
    User,
    MapPin,
    Calendar,
    FileCheck2,
    FileSpreadsheet,
    TrendingUp,
    Receipt,
    MessageSquare,
    ArrowRight,
    Loader2,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { ClientOnboardingLayout } from "@/components/client/ClientOnboardingLayout";
import {
    getClientProject,
    getClientDashboard,
    updateClientOnboarding,
    type ClientProjectDetails,
} from "@/lib/api/client";

function OnboardingWelcomeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryProjectId = searchParams.get("projectId") || "";

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [project, setProject] = useState<ClientProjectDetails | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDetails() {
            setLoading(true);
            setError(null);
            try {
                if (queryProjectId) {
                    const res = await getClientProject(queryProjectId);
                    setProject(res.project);
                } else {
                    const dash = await getClientDashboard();
                    if (dash?.project?.id) {
                        setProject({
                            id: dash.project.id,
                            projectCode: dash.project.projectCode,
                            name: dash.project.name,
                            clientName: dash.project.clientName,
                            status: dash.project.status,
                            location: dash.project.location,
                            projectType: dash.project.projectType,
                            companyName: dash.project.companyName,
                            projectManager: dash.project.projectManager,
                        });
                    } else {
                        setError("No project active for your client account.");
                    }
                }
            } catch (err: any) {
                setError(err.message || "Failed to load project details.");
            } finally {
                setLoading(false);
            }
        }

        fetchDetails();
    }, [queryProjectId]);

    async function handleGetStarted() {
        if (!project) return;
        setSubmitting(true);
        try {
            await updateClientOnboarding(project.id, "documents");
            router.push(`/client/onboarding/documents?projectId=${encodeURIComponent(project.id)}`);
        } catch (err: any) {
            // Even if onboarding state fails, proceed to documents
            console.warn("Could not record onboarding step:", err);
            router.push(`/client/onboarding/documents?projectId=${encodeURIComponent(project.id)}`);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Loader2 className="animate-spin" size={36} color="#2563EB" style={{ margin: "0 auto 16px auto" }} />
                <h3 style={{ fontSize: "16px", color: "#1E293B", fontWeight: 500 }}>
                    Loading your project workspace...
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
                    Project Not Found
                </h2>
                <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px" }}>
                    {error || "We could not find an active project linked to your account."}
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/login")}
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
                    Return to Login
                </button>
            </div>
        );
    }

    return (
        <ClientOnboardingLayout activeStep="welcome" completedSteps={[]} projectId={project.id}>
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

                {/* Welcome Heading */}
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
                    Welcome, {project.clientName || "Client"}
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
                    You have been added to the following project. Review the details below and proceed to complete your onboarding.
                </p>

                {/* Project Info Card */}
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "16px",
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                        padding: "28px",
                        marginBottom: "32px",
                    }}
                >
                    {/* Project Title & Status Badges */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "12px",
                            paddingBottom: "20px",
                            borderBottom: "1px solid #F1F5F9",
                        }}
                    >
                        <div>
                            <h2
                                style={{
                                    fontSize: "20px",
                                    fontWeight: 700,
                                    color: "#0F172A",
                                    margin: "0 0 6px 0",
                                }}
                            >
                                {project.name}
                            </h2>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: "#64748B",
                                        backgroundColor: "#F1F5F9",
                                        padding: "3px 8px",
                                        borderRadius: "6px",
                                    }}
                                >
                                    {project.projectCode || "PRJ-001"}
                                </span>
                                {project.projectType && (
                                    <span style={{ fontSize: "13px", color: "#64748B" }}>
                                        • {project.projectType}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 12px",
                                    borderRadius: "999px",
                                    backgroundColor: "#ECFDF5",
                                    color: "#059669",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                }}
                            >
                                <span
                                    style={{
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "50%",
                                        backgroundColor: "#10B981",
                                    }}
                                />
                                {project.status ? project.status.toUpperCase() : "ACTIVE"}
                            </span>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "16px",
                            padding: "20px 0",
                            borderBottom: "1px solid #F1F5F9",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "8px",
                                    backgroundColor: "#EFF6FF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <User size={18} color="#2563EB" />
                            </div>
                            <div>
                                <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>
                                    Project Manager
                                </div>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>
                                    {project.projectManager || "Assigned Manager"}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "8px",
                                    backgroundColor: "#EFF6FF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Building2 size={18} color="#2563EB" />
                            </div>
                            <div>
                                <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>
                                    Company
                                </div>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>
                                    {project.companyName || "Meridian Build Co."}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "8px",
                                    backgroundColor: "#EFF6FF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <MapPin size={18} color="#2563EB" />
                            </div>
                            <div>
                                <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>
                                    Location
                                </div>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>
                                    {project.location || "Site Location"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* What you can do section */}
                    <div style={{ paddingTop: "20px" }}>
                        <h4
                            style={{
                                fontSize: "13px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                color: "#475569",
                                margin: "0 0 14px 0",
                            }}
                        >
                            What you can do in your client portal:
                        </h4>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {[
                                {
                                    icon: <FileCheck2 size={18} color="#2563EB" />,
                                    title: "Review & Sign Contracts",
                                    desc: "Access project agreements, scope definitions, and electronically sign contracts.",
                                },
                                {
                                    icon: <FileSpreadsheet size={18} color="#2563EB" />,
                                    title: "View Bill of Quantities (BOQ)",
                                    desc: "Inspect detailed itemized cost breakdowns, specifications, and scope items.",
                                },
                                {
                                    icon: <TrendingUp size={18} color="#2563EB" />,
                                    title: "Track Project Progress",
                                    desc: "Monitor live milestones, delivery dates, and real-time updates.",
                                },
                                {
                                    icon: <Receipt size={18} color="#2563EB" />,
                                    title: "Review Invoices & Payments",
                                    desc: "Track billing schedules, commercial invoices, and payment statuses.",
                                },
                                {
                                    icon: <MessageSquare size={18} color="#2563EB" />,
                                    title: "Direct Team Communication",
                                    desc: "Connect directly with your project manager and commercial team.",
                                },
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "12px",
                                        padding: "10px 14px",
                                        borderRadius: "10px",
                                        backgroundColor: "#F8FAFC",
                                        border: "1px solid #F1F5F9",
                                    }}
                                >
                                    <div style={{ marginTop: "2px", flexShrink: 0 }}>{item.icon}</div>
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>
                                            {item.title}
                                        </div>
                                        <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
                                            {item.desc}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Primary Action Button */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        onClick={handleGetStarted}
                        disabled={submitting}
                        style={{
                            padding: "14px 28px",
                            borderRadius: "10px",
                            backgroundColor: "#2563EB",
                            color: "#ffffff",
                            fontSize: "15px",
                            fontWeight: 600,
                            border: "none",
                            cursor: submitting ? "not-allowed" : "pointer",
                            opacity: submitting ? 0.75 : 1,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                            transition: "all 0.15s ease",
                        }}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                <span>Starting Onboarding...</span>
                            </>
                        ) : (
                            <>
                                <span>Get Started</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </ClientOnboardingLayout>
    );
}

export default function ClientOnboardingWelcomePage() {
    return (
        <Suspense
            fallback={
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                    <Loader2 className="animate-spin" size={36} color="#2563EB" style={{ margin: "0 auto 16px auto" }} />
                </div>
            }
        >
            <OnboardingWelcomeContent />
        </Suspense>
    );
}
