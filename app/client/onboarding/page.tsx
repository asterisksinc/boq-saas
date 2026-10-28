"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Activity,
    FileSpreadsheet,
    Receipt,
    FileCheck2,
    MessageSquare,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { ClientOnboardingLayout } from "@/components/client/ClientOnboardingLayout";
import {
    getClientProject,
    getClientDashboard,
    getClientOnboarding,
    updateClientOnboarding,
    type ClientProjectDetails,
} from "@/lib/api/client";

function formatStatus(status?: string): string {
    if (!status) return "Active";
    const clean = status.trim().toLowerCase();
    if (clean === "active") return "Active";
    return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

const featureCards = [
    {
        title: "Review Project Updates",
        icon: <Activity size={18} color="#2563EB" strokeWidth={2} />,
        className: "client-welcome-card-1",
    },
    {
        title: "Review and Approve BOQs",
        icon: <FileSpreadsheet size={18} color="#2563EB" strokeWidth={2} />,
        className: "client-welcome-card-2",
    },
    {
        title: "Access Invoices and Payment Information",
        icon: <Receipt size={18} color="#2563EB" strokeWidth={2} />,
        className: "client-welcome-card-3",
    },
    {
        title: "Review and Sign Documents",
        icon: <FileCheck2 size={18} color="#2563EB" strokeWidth={2} />,
        className: "client-welcome-card-4",
    },
    {
        title: "Stay Connected With Your Project Team",
        icon: <MessageSquare size={18} color="#2563EB" strokeWidth={2} />,
        className: "client-welcome-card-5",
    },
];

function OnboardingWelcomeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryProjectId = searchParams.get("projectId") || "";

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [project, setProject] = useState<ClientProjectDetails | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchDetails() {
            setLoading(true);
            setError(null);
            try {
                let activeProject: ClientProjectDetails | null = null;
                let targetProjectId = queryProjectId;

                if (targetProjectId) {
                    const res = await getClientProject(targetProjectId);
                    activeProject = res.project;
                } else {
                    const dash = await getClientDashboard();
                    if (dash?.project?.id) {
                        targetProjectId = dash.project.id;
                        activeProject = {
                            id: dash.project.id,
                            projectCode: dash.project.projectCode,
                            name: dash.project.name,
                            clientName: dash.project.clientName,
                            status: dash.project.status,
                            location: dash.project.location,
                            projectType: dash.project.projectType,
                            companyName: dash.project.companyName,
                            projectManager: dash.project.projectManager,
                        };
                    }
                }

                if (!activeProject) {
                    if (isMounted) setError("No project active for your client account.");
                    return;
                }

                // Check if onboarding is already completed for this project
                try {
                    const onboardingRes = await getClientOnboarding(activeProject.id);
                    if (
                        onboardingRes?.onboarding?.status === "completed" ||
                        onboardingRes?.onboarding?.currentStep === "dashboard"
                    ) {
                        router.push(`/client/dashboard?projectId=${encodeURIComponent(activeProject.id)}`);
                        return;
                    }
                } catch {
                    // Non-blocking: proceed with rendering welcome screen
                }

                if (isMounted) {
                    setProject(activeProject);
                }
            } catch (err: any) {
                if (isMounted) setError(err.message || "Failed to load project details.");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchDetails();

        return () => {
            isMounted = false;
        };
    }, [queryProjectId, router]);

    async function handleGetStarted() {
        if (!project || submitting) return;
        setSubmitting(true);
        try {
            await updateClientOnboarding(project.id, "documents");
            router.push(`/client/onboarding/documents?projectId=${encodeURIComponent(project.id)}`);
        } catch (err: any) {
            console.warn("Could not record onboarding step:", err);
            // Even if onboarding state persistence reports an error, proceed to documents
            router.push(`/client/onboarding/documents?projectId=${encodeURIComponent(project.id)}`);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="client-welcome-loading-state" style={{ textAlign: "center", padding: "120px 0", width: "100%" }}>
                <Loader2 className="animate-spin" size={36} color="#2563EB" style={{ margin: "0 auto 16px auto" }} />
                <h3 style={{ fontSize: "16px", color: "#1E293B", fontWeight: 500 }}>
                    Loading your project workspace...
                </h3>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="client-welcome-error-state" style={{ maxWidth: "596px", margin: "64px auto", textAlign: "center", padding: "40px 20px" }}>
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
                        borderRadius: "6px",
                        backgroundColor: "#2563EB",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: 500,
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
            {/* Frame 2147225026: Header Block */}
            <div className="client-welcome-header-block">
                {project.companyName && (
                    <div className="client-welcome-company-eyebrow">
                        {project.companyName}
                    </div>
                )}
                <h1 className="client-welcome-title">
                    Welcome, {project.clientName || "Client"}
                </h1>
                <p className="client-welcome-subtitle">
                    Welcome to your project portal. This is your central place to stay updated, review project information, approve BOQs, manage invoices, and access important documents.
                </p>
            </div>

            {/* Frame 2147225032: Content Column Sections */}
            <div className="client-welcome-content-sections">
                {/* Frame 2147225027: YOUR PROJECT Card */}
                <div className="client-welcome-project-card">
                    <div className="client-welcome-project-title-block">
                        <div className="client-welcome-project-label">YOUR PROJECT</div>
                        <h2 className="client-welcome-project-name">
                            {project.name || "Untitled Project"}
                        </h2>
                    </div>

                    <div className="client-welcome-project-rows">
                        {/* Row 1: Project Manager */}
                        <div className="client-welcome-detail-row">
                            <span className="client-welcome-row-label">Project Manager</span>
                            <span className="client-welcome-row-value">
                                {project.projectManager || "Assigned Manager"}
                            </span>
                        </div>

                        {/* Row 2: Company */}
                        <div className="client-welcome-detail-row">
                            <span className="client-welcome-row-label">Company</span>
                            <span className="client-welcome-row-value">
                                {project.companyName || "Organization"}
                            </span>
                        </div>

                        {/* Row 3: Project Status */}
                        <div className="client-welcome-detail-row">
                            <span className="client-welcome-row-label">Project Status</span>
                            <span
                                className={`client-welcome-status-badge ${
                                    (project.status || "").toLowerCase() === "active"
                                        ? "status-active"
                                        : "status-other"
                                }`}
                            >
                                {formatStatus(project.status)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Frame 2147225506: HERE'S WHAT YOU CAN DO */}
                <div className="client-welcome-features-block">
                    <div className="client-welcome-features-label">HERE&apos;S WHAT YOU CAN DO</div>
                    <div className="client-welcome-features-list">
                        {featureCards.map((card, idx) => (
                            <div
                                key={idx}
                                className={`client-welcome-feature-card ${card.className}`}
                            >
                                <div className="client-welcome-feature-icon-box" aria-hidden="true">
                                    {card.icon}
                                </div>
                                <span className="client-welcome-feature-text">{card.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Frame 2147225031: Bottom Action Buttons */}
                <div className="client-welcome-actions-row">
                    <div className="client-welcome-btn-back-spacer" aria-hidden="true" />
                    <button
                        type="button"
                        className="client-welcome-btn-get-started"
                        onClick={handleGetStarted}
                        disabled={submitting}
                        aria-label="Get Started"
                    >
                        {submitting ? (
                            <Loader2 className="animate-spin" size={16} color="#FFFFFF" />
                        ) : (
                            "Get Started"
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
                <div className="client-welcome-loading-state" style={{ textAlign: "center", padding: "120px 0", width: "100%" }}>
                    <Loader2 className="animate-spin" size={36} color="#2563EB" style={{ margin: "0 auto 16px auto" }} />
                </div>
            }
        >
            <OnboardingWelcomeContent />
        </Suspense>
    );
}
