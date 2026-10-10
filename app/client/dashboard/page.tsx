"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    Building2,
    User,
    Mail,
    MapPin,
    Calendar,
    FileText,
    CheckCircle2,
    Clock,
    Eye,
    PenLine,
    FileSpreadsheet,
    Receipt,
    LogOut,
    Loader2,
    AlertCircle,
    ChevronRight,
    DollarSign,
    Layers,
} from "lucide-react";
import { DocumentSignModal } from "@/components/client/DocumentSignModal";
import { DocumentViewerModal } from "@/components/client/DocumentViewerModal";
import {
    getClientDashboard,
    type ClientDashboardData,
    type ClientDocumentItem,
} from "@/lib/api/client";

function ClientDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryProjectId = searchParams.get("projectId") || "";

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ClientDashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "documents" | "boq" | "invoices">("overview");

    // Modal state
    const [signingDoc, setSigningDoc] = useState<ClientDocumentItem | null>(null);
    const [viewingDoc, setViewingDoc] = useState<ClientDocumentItem | null>(null);

    useEffect(() => {
        async function fetchDashboard() {
            setLoading(true);
            setError(null);
            try {
                const dash = await getClientDashboard(queryProjectId);
                setData(dash);
            } catch (err: any) {
                setError(err.message || "Failed to load client dashboard.");
            } finally {
                setLoading(false);
            }
        }

        fetchDashboard();
    }, [queryProjectId]);

    const handleLogout = async () => {
        try {
            await fetch("/api/v1/auth/logout", {
                method: "POST",
                credentials: "include",
            });
        } catch {
            // Ignore error
        }
        router.push("/login");
    };

    const handleSigned = async (docId: string) => {
        if (!data) return;
        setData({
            ...data,
            documents: data.documents.map((d) =>
                d.id === docId
                    ? { ...d, status: "signed", signedAt: new Date().toISOString() }
                    : d
            ),
        });

        try {
            const refreshed = await getClientDashboard(queryProjectId);
            setData(refreshed);
        } catch (e) {
            console.warn("Could not refresh client dashboard:", e);
        }
    };

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    minHeight: "100vh",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F8FAFC",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <Loader2 className="animate-spin" size={40} color="#2563EB" style={{ margin: "0 auto 16px auto" }} />
                    <h3 style={{ fontSize: "16px", color: "#1E293B", fontWeight: 600 }}>
                        Loading client workspace...
                    </h3>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div
                style={{
                    display: "flex",
                    minHeight: "100vh",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F8FAFC",
                    padding: "20px",
                }}
            >
                <div
                    style={{
                        maxWidth: "480px",
                        width: "100%",
                        backgroundColor: "#ffffff",
                        padding: "36px",
                        borderRadius: "16px",
                        border: "1px solid #E2E8F0",
                        textAlign: "center",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
                    }}
                >
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
                        Client Portal Access
                    </h2>
                    <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px", lineHeight: 1.5 }}>
                        {error || "Unable to find an active project linked to your client account."}
                    </p>
                    <button
                        type="button"
                        onClick={handleLogout}
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
                        Sign Out &amp; Return
                    </button>
                </div>
            </div>
        );
    }

    const { project, documents, boqs, invoices } = data;
    const signedCount = documents.filter((d) => d.status === "signed").length;
    const totalDocs = documents.length;

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", color: "#0F172A" }}>
            {/* Top Navigation */}
            <header
                style={{
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #E2E8F0",
                    position: "sticky",
                    top: 0,
                    zIndex: 30,
                }}
            >
                <div
                    style={{
                        maxWidth: "1280px",
                        margin: "0 auto",
                        padding: "0 24px",
                        height: "68px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    {/* Brand & Project Info */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <Link href="/client/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "10px",
                                    backgroundColor: "#2563EB",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Image
                                    src="/assets/boq-logo-small.svg"
                                    alt="BOQ"
                                    width={22}
                                    height={22}
                                    style={{ objectFit: "contain" }}
                                />
                            </div>
                            <span style={{ fontSize: "17px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
                                BOQ SaaS
                            </span>
                        </Link>

                        <div style={{ height: "20px", width: "1px", backgroundColor: "#CBD5E1" }} />

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>
                                {project.name}
                            </span>
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    padding: "2px 8px",
                                    borderRadius: "999px",
                                    backgroundColor: "#ECFDF5",
                                    color: "#059669",
                                }}
                            >
                                {project.status ? project.status.toUpperCase() : "ACTIVE"}
                            </span>
                        </div>
                    </div>

                    {/* User profile & Sign Out */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>
                                {project.clientName || "Client User"}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748B" }}>
                                Client Portal • {project.companyName || "Organization"}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Sign Out"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#ffffff",
                                color: "#64748B",
                                fontSize: "13px",
                                fontWeight: 500,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                            }}
                        >
                            <LogOut size={15} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>
                {/* Hero Header */}
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "16px",
                        border: "1px solid #E2E8F0",
                        padding: "24px 32px",
                        marginBottom: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "20px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                color: "#2563EB",
                                textTransform: "uppercase",
                                marginBottom: "6px",
                            }}
                        >
                            CLIENT COLLABORATION HUB
                        </div>
                        <h1
                            style={{
                                fontSize: "26px",
                                fontWeight: 700,
                                color: "#0F172A",
                                margin: "0 0 6px 0",
                            }}
                        >
                            {project.name}
                        </h1>
                        <p style={{ fontSize: "14px", color: "#64748B", margin: 0 }}>
                            Project Code: <strong style={{ color: "#334155" }}>{project.projectCode || "PRJ-001"}</strong>
                            {project.location ? ` • ${project.location}` : ""}
                            {project.projectType ? ` • ${project.projectType}` : ""}
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <Link
                            href={`/client/onboarding/documents?projectId=${encodeURIComponent(project.id)}`}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "10px 18px",
                                borderRadius: "8px",
                                backgroundColor: "#2563EB",
                                color: "#ffffff",
                                fontSize: "13px",
                                fontWeight: 600,
                                textDecoration: "none",
                                boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)",
                            }}
                        >
                            <span>Manage Documents</span>
                            <ChevronRight size={15} />
                        </Link>
                    </div>
                </div>

                {/* 4 Metric Cards */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "18px",
                        marginBottom: "28px",
                    }}
                >
                    {/* Card 1: Document Status */}
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "14px",
                            border: "1px solid #E2E8F0",
                            padding: "20px",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>Contracts &amp; Documents</span>
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "8px",
                                    backgroundColor: signedCount === totalDocs ? "#ECFDF5" : "#EFF6FF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <FileText size={18} color={signedCount === totalDocs ? "#059669" : "#2563EB"} />
                            </div>
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A" }}>
                            {signedCount} / {totalDocs} Signed
                        </div>
                        <div style={{ fontSize: "12px", color: signedCount === totalDocs ? "#059669" : "#D97706", marginTop: "4px", fontWeight: 500 }}>
                            {signedCount === totalDocs ? "All required documents signed" : `${totalDocs - signedCount} awaiting signature`}
                        </div>
                    </div>

                    {/* Card 2: Active BOQs */}
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "14px",
                            border: "1px solid #E2E8F0",
                            padding: "20px",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>Bill of Quantities</span>
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
                                <Layers size={18} color="#2563EB" />
                            </div>
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A" }}>
                            {boqs.length} {boqs.length === 1 ? "Version" : "Versions"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                            {boqs[0] ? `Latest: ${boqs[0].boq_number || boqs[0].boqNumber || "BOQ-01"}` : "No BOQ generated yet"}
                        </div>
                    </div>

                    {/* Card 3: Invoices */}
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "14px",
                            border: "1px solid #E2E8F0",
                            padding: "20px",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>Invoices</span>
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
                                <DollarSign size={18} color="#2563EB" />
                            </div>
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A" }}>
                            {invoices.length} {invoices.length === 1 ? "Invoice" : "Invoices"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                            {invoices.length > 0 ? "Commercial billing on file" : "Pending milestone billing"}
                        </div>
                    </div>

                    {/* Card 4: Project Manager */}
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "14px",
                            border: "1px solid #E2E8F0",
                            padding: "20px",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>Project Lead</span>
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
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                            {project.projectManager || "Assigned Manager"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                            {project.companyName || "Organization"}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        borderBottom: "1px solid #E2E8F0",
                        marginBottom: "24px",
                    }}
                >
                    {[
                        { id: "overview", label: "Project Overview" },
                        { id: "documents", label: `Documents (${totalDocs})` },
                        { id: "boq", label: `Bill of Quantities (${boqs.length})` },
                        { id: "invoices", label: `Invoices (${invoices.length})` },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                padding: "12px 18px",
                                border: "none",
                                borderBottom: activeTab === tab.id ? "2px solid #2563EB" : "2px solid transparent",
                                backgroundColor: "transparent",
                                color: activeTab === tab.id ? "#2563EB" : "#64748B",
                                fontSize: "14px",
                                fontWeight: activeTab === tab.id ? 600 : 500,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab 1: Project Overview */}
                {activeTab === "overview" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
                        {/* Company & Lead Info */}
                        <div
                            style={{
                                backgroundColor: "#ffffff",
                                borderRadius: "14px",
                                border: "1px solid #E2E8F0",
                                padding: "24px",
                                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                            }}
                        >
                            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: "0 0 16px 0" }}>
                                Project Team &amp; Contacts
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Building2 size={18} color="#475569" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>Company</div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>{project.companyName || "Meridian Build Co."}</div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <User size={18} color="#475569" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>Project Manager</div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>{project.projectManager}</div>
                                    </div>
                                </div>

                                {project.projectManagerEmail && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Mail size={18} color="#475569" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>Email</div>
                                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#2563EB" }}>
                                                <a href={`mailto:${project.projectManagerEmail}`} style={{ textDecoration: "none", color: "inherit" }}>
                                                    {project.projectManagerEmail}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <MapPin size={18} color="#475569" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>Site Location</div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>{project.location || "Site Address"}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Project Schedule & Timelines */}
                        <div
                            style={{
                                backgroundColor: "#ffffff",
                                borderRadius: "14px",
                                border: "1px solid #E2E8F0",
                                padding: "24px",
                                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                            }}
                        >
                            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: "0 0 16px 0" }}>
                                Timeline &amp; Schedule
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Calendar size={18} color="#475569" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>Start Date</div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>
                                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : "Scheduled with Contract"}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Calendar size={18} color="#475569" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>Target Completion</div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>
                                            {project.targetCompletionDate ? new Date(project.targetCompletionDate).toLocaleDateString() : "Per Project Milestones"}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        marginTop: "8px",
                                        padding: "14px",
                                        borderRadius: "10px",
                                        backgroundColor: "#EFF6FF",
                                        border: "1px solid #DBEAFE",
                                        fontSize: "13px",
                                        color: "#1E40AF",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <strong>Commercial Notice:</strong> All contract specifications and BOQ cost lines
                                    have been approved by {project.companyName || "the team"}. Use the tabs above to review
                                    drawings, BOQs, and legal documentation.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Documents */}
                {activeTab === "documents" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {documents.map((doc) => {
                            const isSigned = doc.status === "signed";
                            const docItem: ClientDocumentItem = {
                                id: doc.id,
                                title: doc.title,
                                reference: doc.reference,
                                type: doc.title.toLowerCase().includes("proposal") ? "proposal" : "contract",
                                status: doc.status,
                                viewUrl: doc.viewUrl,
                                requiresSignature: true,
                                signedAt: doc.signedAt,
                            };

                            return (
                                <div
                                    key={doc.id}
                                    style={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "14px",
                                        border: "1px solid #E2E8F0",
                                        padding: "20px 24px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: "16px",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <div
                                            style={{
                                                width: "44px",
                                                height: "44px",
                                                borderRadius: "10px",
                                                backgroundColor: isSigned ? "#ECFDF5" : "#EFF6FF",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <FileText size={22} color={isSigned ? "#059669" : "#2563EB"} />
                                        </div>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#0F172A", margin: 0 }}>
                                                    {doc.title}
                                                </h4>
                                                <span
                                                    style={{
                                                        padding: "2px 8px",
                                                        borderRadius: "999px",
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        backgroundColor: isSigned ? "#ECFDF5" : "#FFFBEB",
                                                        color: isSigned ? "#059669" : "#D97706",
                                                    }}
                                                >
                                                    {isSigned ? "SIGNED" : "AWAITING SIGNATURE"}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                                                {doc.reference}
                                                {doc.signedAt && ` • Signed on ${new Date(doc.signedAt).toLocaleDateString()}`}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <button
                                            type="button"
                                            onClick={() => setViewingDoc(docItem)}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                padding: "8px 14px",
                                                borderRadius: "8px",
                                                border: "1px solid #CBD5E1",
                                                backgroundColor: "#ffffff",
                                                color: "#334155",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                            }}
                                        >
                                            <Eye size={14} />
                                            <span>View</span>
                                        </button>

                                        {!isSigned && (
                                            <button
                                                type="button"
                                                onClick={() => setSigningDoc(docItem)}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    padding: "8px 16px",
                                                    borderRadius: "8px",
                                                    border: "none",
                                                    backgroundColor: "#2563EB",
                                                    color: "#ffffff",
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <PenLine size={14} />
                                                <span>Sign</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tab 3: BOQ */}
                {activeTab === "boq" && (
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "14px",
                            border: "1px solid #E2E8F0",
                            padding: "24px",
                        }}
                    >
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: "0 0 16px 0" }}>
                            Bill of Quantities (BOQ) Summary
                        </h3>
                        {boqs.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
                                <FileSpreadsheet size={36} color="#94A3B8" style={{ margin: "0 auto 12px auto" }} />
                                <p style={{ fontSize: "14px" }}>No published BOQ is currently available for this project.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {boqs.map((boq) => (
                                    <div
                                        key={boq.id}
                                        style={{
                                            padding: "16px",
                                            borderRadius: "10px",
                                            backgroundColor: "#F8FAFC",
                                            border: "1px solid #E2E8F0",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
                                                {boq.boq_number || boq.boqNumber || "BOQ-001"}
                                                {boq.version ? ` • v${boq.version}` : ""}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                                                Status: {boq.status || "Approved"}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: "16px", fontWeight: 700, color: "#059669" }}>
                                                ${((boq.grand_total || boq.grandTotal || 0) as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#64748B" }}>Total Cost</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 4: Invoices */}
                {activeTab === "invoices" && (
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "14px",
                            border: "1px solid #E2E8F0",
                            padding: "24px",
                        }}
                    >
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: "0 0 16px 0" }}>
                            Invoices &amp; Billing Schedule
                        </h3>
                        {invoices.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
                                <Receipt size={36} color="#94A3B8" style={{ margin: "0 auto 12px auto" }} />
                                <p style={{ fontSize: "14px" }}>No invoices have been billed for this project yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {invoices.map((inv) => (
                                    <div
                                        key={inv.id}
                                        style={{
                                            padding: "16px",
                                            borderRadius: "10px",
                                            backgroundColor: "#F8FAFC",
                                            border: "1px solid #E2E8F0",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
                                                {inv.invoice_number || inv.invoiceNumber || "INV-001"}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                                                Status: {inv.status || "Pending"}
                                                {(inv.due_date || inv.dueDate) && ` • Due ${new Date(inv.due_date || inv.dueDate || "").toLocaleDateString()}`}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                                                ${((inv.total || 0) as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Viewer Modal */}
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

            {/* Sign Modal */}
            {signingDoc && (
                <DocumentSignModal
                    projectId={project.id}
                    document={signingDoc}
                    initialSignerName={project.clientName || ""}
                    onClose={() => setSigningDoc(null)}
                    onSigned={handleSigned}
                />
            )}
        </div>
    );
}

export default function ClientDashboardPage() {
    return (
        <Suspense
            fallback={
                <div
                    style={{
                        display: "flex",
                        minHeight: "100vh",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#F8FAFC",
                    }}
                >
                    <Loader2 className="animate-spin" size={40} color="#2563EB" />
                </div>
            }
        >
            <ClientDashboardContent />
        </Suspense>
    );
}
