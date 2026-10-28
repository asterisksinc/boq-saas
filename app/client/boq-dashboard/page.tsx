"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    ExternalLink,
    Eye,
    FileSpreadsheet,
    FileText,
    Layers,
    Loader2,
    PenLine,
    Receipt,
    RefreshCw,
    User,
    AlertCircle,
    ChevronRight,
} from "lucide-react";
import ClientDashboardRail from "@/components/client/ClientDashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import { DocumentSignModal } from "@/components/client/DocumentSignModal";
import { DocumentViewerModal } from "@/components/client/DocumentViewerModal";
import {
    getClientDashboard,
    type ClientDashboardData,
    type ClientDocumentItem,
} from "@/lib/api/client";
import "@/app/client/client-redesign.css";

type DashboardTab = "overview" | "boq" | "invoices" | "documents";

function formatMoney(value: number, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function ClientDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryProjectId = searchParams?.get("projectId") || "";

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ClientDashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
    const [searchFilter, setSearchFilter] = useState("");

    // Modal state
    const [signingDoc, setSigningDoc] = useState<ClientDocumentItem | null>(null);
    const [viewingDoc, setViewingDoc] = useState<ClientDocumentItem | null>(null);

    const fetchDashboard = useCallback(async () => {
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
    }, [queryProjectId]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const handleSigned = async (docId: string) => {
        if (!data) return;
        setData({
            ...data,
            documents: data.documents.map((d) =>
                d.id === docId ? { ...d, status: "signed", signedAt: new Date().toISOString() } : d
            ),
        });

        try {
            const refreshed = await getClientDashboard(queryProjectId);
            setData(refreshed);
        } catch (e) {
            console.warn("Could not refresh client dashboard:", e);
        }
    };

    // Computations from real backend data
    const boqs = data?.boqs || [];
    const documents = data?.documents || [];
    const invoices = data?.invoices || [];
    const project = data?.project;

    const totalEstValue = useMemo(() => {
        const sumBoqs = boqs.reduce((acc, b) => acc + (Number(b.grandTotal ?? b.grand_total) || 0), 0);
        return sumBoqs;
    }, [boqs]);

    const signedDocsCount = useMemo(() => {
        return documents.filter((d) => d.status === "signed").length;
    }, [documents]);

    const awaitingDocsCount = documents.length - signedDocsCount;

    const totalInvoicesAmount = useMemo(() => {
        return invoices.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
    }, [invoices]);

    const paidInvoicesCount = useMemo(() => {
        return invoices.filter((i) => (i.status || "").toLowerCase() === "paid").length;
    }, [invoices]);

    // Adapt document items for modals
    const modalDocuments: ClientDocumentItem[] = useMemo(() => {
        return documents.map((d) => ({
            id: d.id,
            title: d.title,
            reference: d.reference,
            type: d.reference.startsWith("PROP") ? "proposal" : "document",
            status: d.status,
            viewUrl: d.viewUrl,
            requiresSignature: d.status === "awaiting_signature",
            signedAt: d.signedAt,
        }));
    }, [documents]);

    const openDocumentForSigning = (docId: string) => {
        const found = modalDocuments.find((d) => d.id === docId);
        if (found) setSigningDoc(found);
    };

    const openDocumentForViewing = (docId: string) => {
        const found = modalDocuments.find((d) => d.id === docId);
        if (found) setViewingDoc(found);
    };

    return (
        <main className="client-redesign-shell">
            <div className="client-bg-glow" />

            <ClientDashboardRail current="/client/boq-dashboard" />

            <div className="client-main-area">
                <DashboardHeader
                    title="BOQ Dashboard"
                    hideNew={true}
                    onSearch={(q) => setSearchFilter(q.toLowerCase())}
                />

                {/* Error Banner */}
                {error && (
                    <div className="client-banner-error">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                        <button type="button" onClick={fetchDashboard}>
                            Retry
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="client-loading-card">
                        <Loader2 className="animate-spin" size={36} color="#2563EB" />
                        <span>Loading BOQ Dashboard...</span>
                    </div>
                ) : !project ? (
                    <div className="client-empty-card">
                        <CheckCircle2 size={40} color="#94A3B8" style={{ margin: "0 auto 8px auto" }} />
                        <div className="client-empty-title">No Active Project Found</div>
                        <p className="client-empty-desc">
                            There are currently no active projects linked to this client workspace.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Project Header Banner */}
                        <div className="client-surface-glass" style={{ padding: "20px 24px" }}>
                            <div className="client-page-header-row">
                                <div className="client-title-group">
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                        <h1 className="client-page-title" style={{ fontSize: "20px" }}>
                                            {project.name}
                                        </h1>
                                        <span className="client-badge client-badge-success">
                                            {project.status ? project.status.toUpperCase() : "ACTIVE"}
                                        </span>
                                    </div>
                                    <p className="client-page-subtitle" style={{ fontSize: "14px" }}>
                                        Project Code: <strong style={{ color: "#0F172A" }}>{project.projectCode || "PRJ-001"}</strong>
                                        {project.location ? ` · ${project.location}` : ""}
                                        {project.projectType ? ` · ${project.projectType}` : ""}
                                    </p>
                                </div>

                                <div className="client-header-actions">
                                    <div style={{ textAlign: "right", marginRight: "8px" }}>
                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>
                                            {project.projectManager || "Alex Morgan"}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#64748B" }}>
                                            {project.companyName || "Meridian Build Co."}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="client-btn-primary client-btn-compact"
                                        onClick={() => router.push("/client/boq")}
                                    >
                                        View All BOQs <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4 KPI Summary Cards matching User Dashboard dimensions */}
                        <div className="client-kpi-row">
                            {/* KPI 1: Estimated Value */}
                            <div className="client-kpi-card">
                                <div className="client-kpi-label">
                                    <span>Total Est. Value</span>
                                    <DollarSign size={16} color="#2563EB" />
                                </div>
                                <div className="client-kpi-value">
                                    {totalEstValue > 0 ? formatMoney(totalEstValue) : "—"}
                                </div>
                                <div className="client-kpi-trend neutral">
                                    <span>{boqs.length} {boqs.length === 1 ? "BOQ" : "BOQs"} in scope</span>
                                </div>
                            </div>

                            {/* KPI 2: Documents */}
                            <div className="client-kpi-card">
                                <div className="client-kpi-label">
                                    <span>Documents</span>
                                    <FileText size={16} color="#2563EB" />
                                </div>
                                <div className="client-kpi-value">
                                    {signedDocsCount} / {documents.length}
                                </div>
                                <div className={`client-kpi-trend ${awaitingDocsCount > 0 ? "down" : "up"}`}>
                                    <span>{awaitingDocsCount > 0 ? `${awaitingDocsCount} awaiting signature` : "All signed"}</span>
                                </div>
                            </div>

                            {/* KPI 3: Commercial Invoices */}
                            <div className="client-kpi-card">
                                <div className="client-kpi-label">
                                    <span>Invoices</span>
                                    <Receipt size={16} color="#2563EB" />
                                </div>
                                <div className="client-kpi-value">
                                    {invoices.length > 0 ? formatMoney(totalInvoicesAmount) : "₹0"}
                                </div>
                                <div className="client-kpi-trend neutral">
                                    <span>{paidInvoicesCount} of {invoices.length} paid</span>
                                </div>
                            </div>

                            {/* KPI 4: Project Lead */}
                            <div className="client-kpi-card">
                                <div className="client-kpi-label">
                                    <span>Project Lead</span>
                                    <User size={16} color="#2563EB" />
                                </div>
                                <div className="client-kpi-value" style={{ fontSize: "18px" }}>
                                    {project.projectManager || "Assigned Manager"}
                                </div>
                                <div className="client-kpi-trend neutral">
                                    <span>{project.companyName || "Organization"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div
                            style={{
                                display: "flex",
                                gap: "6px",
                                borderBottom: "1px solid #E2E8F0",
                                paddingBottom: "2px",
                            }}
                        >
                            {[
                                { id: "overview", label: "Project Overview" },
                                { id: "boq", label: `Bill of Quantities (${boqs.length})` },
                                { id: "invoices", label: `Invoices (${invoices.length})` },
                                { id: "documents", label: `Documents (${documents.length})` },
                            ].map((tab) => {
                                const active = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id as DashboardTab)}
                                        style={{
                                            padding: "10px 16px",
                                            border: "none",
                                            borderBottom: active ? "2.5px solid #2563EB" : "2.5px solid transparent",
                                            backgroundColor: "transparent",
                                            color: active ? "#2563EB" : "#64748B",
                                            fontSize: "14px",
                                            fontWeight: active ? 600 : 500,
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* TAB 1: OVERVIEW */}
                        {activeTab === "overview" && (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1.4fr 1fr",
                                    gap: "16px",
                                    alignItems: "start",
                                }}
                            >
                                {/* Left Column: Recent BOQs & Recent Invoices */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {/* Recent BOQs Card */}
                                    <div className="client-table-container">
                                        <div
                                            style={{
                                                padding: "16px 20px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                borderBottom: "1px solid #EBEBEB",
                                            }}
                                        >
                                            <div>
                                                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#0F172A" }}>
                                                    Bill of Quantities
                                                </h2>
                                                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748B" }}>
                                                    Recent cost estimates for your approval
                                                </p>
                                            </div>
                                            <Link
                                                href="/client/boq"
                                                className="client-btn-secondary client-btn-compact"
                                                style={{ textDecoration: "none" }}
                                            >
                                                View all ({boqs.length})
                                            </Link>
                                        </div>

                                        <div className="client-table-scroll">
                                            <table className="client-table">
                                                <thead>
                                                    <tr>
                                                        <th>BOQ #</th>
                                                        <th>VERSION</th>
                                                        <th>STATUS</th>
                                                        <th style={{ textAlign: "right" }}>AMOUNT</th>
                                                        <th style={{ width: "40px" }} />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {boqs.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>
                                                                No BOQs assigned yet.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        boqs.slice(0, 4).map((b) => {
                                                            const isApproved = (b.status || "").toLowerCase().includes("approved");
                                                            const badgeClass = isApproved
                                                                ? "client-badge-success"
                                                                : "client-badge-pending";
                                                            const totalVal = Number(b.grandTotal ?? b.grand_total) || 0;

                                                            return (
                                                                <tr
                                                                    key={b.id}
                                                                    onClick={() => router.push("/client/boq")}
                                                                >
                                                                    <td className="bold-cell">
                                                                        {b.boqNumber || b.boq_number || "BOQ-001"}
                                                                    </td>
                                                                    <td className="muted-cell">
                                                                        {b.version || "v1"}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`client-badge ${badgeClass}`}>
                                                                            {b.status || "DRAFT"}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                                                                        {totalVal > 0 ? formatMoney(totalVal) : "—"}
                                                                    </td>
                                                                    <td style={{ textAlign: "center", color: "#94A3B8" }}>
                                                                        <ChevronRight size={15} />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Recent Invoices Card */}
                                    <div className="client-table-container">
                                        <div
                                            style={{
                                                padding: "16px 20px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                borderBottom: "1px solid #EBEBEB",
                                            }}
                                        >
                                            <div>
                                                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#0F172A" }}>
                                                    Recent Invoices
                                                </h2>
                                                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748B" }}>
                                                    Milestone billing and payment status
                                                </p>
                                            </div>
                                            <Link
                                                href="/client/invoices"
                                                className="client-btn-secondary client-btn-compact"
                                                style={{ textDecoration: "none" }}
                                            >
                                                View all ({invoices.length})
                                            </Link>
                                        </div>

                                        <div className="client-table-scroll">
                                            <table className="client-table">
                                                <thead>
                                                    <tr>
                                                        <th>INVOICE #</th>
                                                        <th>DUE DATE</th>
                                                        <th>STATUS</th>
                                                        <th style={{ textAlign: "right" }}>AMOUNT</th>
                                                        <th style={{ width: "40px" }} />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invoices.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>
                                                                No commercial invoices issued yet.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        invoices.slice(0, 4).map((inv) => {
                                                            const isPaid = (inv.status || "").toLowerCase() === "paid";
                                                            const badgeClass = isPaid ? "client-badge-success" : "client-badge-warning";
                                                            const totalVal = Number(inv.total) || 0;

                                                            return (
                                                                <tr
                                                                    key={inv.id}
                                                                    onClick={() => router.push(`/client/invoices/${inv.id}`)}
                                                                >
                                                                    <td className="bold-cell">
                                                                        {inv.invoiceNumber || inv.invoice_number || "INV-001"}
                                                                    </td>
                                                                    <td className="muted-cell">
                                                                        {formatDate(inv.dueDate || inv.due_date)}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`client-badge ${badgeClass}`}>
                                                                            {inv.status || "PENDING"}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                                                                        {formatMoney(totalVal)}
                                                                    </td>
                                                                    <td style={{ textAlign: "center", color: "#94A3B8" }}>
                                                                        <ChevronRight size={15} />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Project Meta & Documents Action Card */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {/* Project Meta Card */}
                                    <div className="client-surface-glass" style={{ padding: "20px" }}>
                                        <h3
                                            style={{
                                                margin: "0 0 14px 0",
                                                fontSize: "15px",
                                                fontWeight: 600,
                                                color: "#0F172A",
                                                borderBottom: "1px solid #E2E8F0",
                                                paddingBottom: "10px",
                                            }}
                                        >
                                            Project Information
                                        </h3>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748B" }}>Client Name</span>
                                                <span style={{ fontWeight: 600, color: "#0F172A" }}>{project.clientName || "Client"}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748B" }}>Organization</span>
                                                <span style={{ fontWeight: 600, color: "#0F172A" }}>{project.companyName || "Meridian Build Co."}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748B" }}>Project Location</span>
                                                <span style={{ fontWeight: 600, color: "#0F172A" }}>{project.location || "Bengaluru, India"}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748B" }}>Project Type</span>
                                                <span style={{ fontWeight: 600, color: "#0F172A" }}>{project.projectType || "Commercial Interior"}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748B" }}>Start Date</span>
                                                <span style={{ fontWeight: 600, color: "#0F172A" }}>{formatDate(project.startDate)}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748B" }}>Target Delivery</span>
                                                <span style={{ fontWeight: 600, color: "#0F172A" }}>{formatDate(project.targetCompletionDate)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Documents Sign / View Card */}
                                    <div className="client-surface-glass" style={{ padding: "20px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#0F172A" }}>
                                                Required Documents
                                            </h3>
                                            <Link
                                                href="/client/documents"
                                                style={{ fontSize: "13px", color: "#2563EB", fontWeight: 600, textDecoration: "none" }}
                                            >
                                                Documents Hub
                                            </Link>
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            {documents.length === 0 ? (
                                                <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
                                                    No documents requiring attention.
                                                </p>
                                            ) : (
                                                documents.map((doc) => {
                                                    const isSigned = doc.status === "signed";
                                                    return (
                                                        <div
                                                            key={doc.id}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                                padding: "12px",
                                                                borderRadius: "6px",
                                                                border: "1px solid #E2E8F0",
                                                                backgroundColor: "#FFFFFF",
                                                            }}
                                                        >
                                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                                <FileText size={18} color="#2563EB" />
                                                                <div>
                                                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>
                                                                        {doc.title}
                                                                    </div>
                                                                    <div style={{ fontSize: "11px", color: "#64748B" }}>
                                                                        {doc.reference} · {isSigned ? "Signed" : "Awaiting Signature"}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div style={{ display: "flex", gap: "6px" }}>
                                                                <button
                                                                    type="button"
                                                                    className="client-btn-secondary client-btn-compact"
                                                                    onClick={() => openDocumentForViewing(doc.id)}
                                                                >
                                                                    View
                                                                </button>
                                                                {!isSigned && (
                                                                    <button
                                                                        type="button"
                                                                        className="client-btn-primary client-btn-compact"
                                                                        onClick={() => openDocumentForSigning(doc.id)}
                                                                    >
                                                                        Sign
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: BOQS LIST */}
                        {activeTab === "boq" && (
                            <div className="client-table-container">
                                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #EBEBEB" }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#0F172A" }}>
                                            Bill of Quantities
                                        </h2>
                                        <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748B" }}>
                                            {boqs.length} BOQs registered for {project.name}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="client-btn-primary client-btn-compact"
                                        onClick={() => router.push("/client/boq")}
                                    >
                                        Go to BOQ Workspace
                                    </button>
                                </div>

                                <div className="client-table-scroll">
                                    <table className="client-table">
                                        <thead>
                                            <tr>
                                                <th>BOQ #</th>
                                                <th>VERSION</th>
                                                <th>STATUS</th>
                                                <th style={{ textAlign: "right" }}>TOTAL VALUE</th>
                                                <th style={{ width: "120px", textAlign: "right" }}>ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {boqs.map((b) => {
                                                const isApproved = (b.status || "").toLowerCase().includes("approved");
                                                const totalVal = Number(b.grandTotal ?? b.grand_total) || 0;
                                                return (
                                                    <tr key={b.id} onClick={() => router.push("/client/boq")}>
                                                        <td className="bold-cell">{b.boqNumber || b.boq_number || "BOQ-001"}</td>
                                                        <td className="muted-cell">{b.version || "v1"}</td>
                                                        <td>
                                                            <span className={`client-badge ${isApproved ? "client-badge-success" : "client-badge-pending"}`}>
                                                                {b.status || "YET TO APPROVE"}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                                                            {totalVal > 0 ? formatMoney(totalVal) : "—"}
                                                        </td>
                                                        <td style={{ textAlign: "right" }}>
                                                            <span style={{ color: "#2563EB", fontWeight: 600, fontSize: "13px" }}>
                                                                Open Details →
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: INVOICES LIST */}
                        {activeTab === "invoices" && (
                            <div className="client-table-container">
                                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #EBEBEB" }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#0F172A" }}>
                                            Commercial Invoices
                                        </h2>
                                        <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748B" }}>
                                            {invoices.length} billing statements for {project.name}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="client-btn-primary client-btn-compact"
                                        onClick={() => router.push("/client/invoices")}
                                    >
                                        Go to Invoices Workspace
                                    </button>
                                </div>

                                <div className="client-table-scroll">
                                    <table className="client-table">
                                        <thead>
                                            <tr>
                                                <th>INVOICE #</th>
                                                <th>DUE DATE</th>
                                                <th>STATUS</th>
                                                <th style={{ textAlign: "right" }}>AMOUNT</th>
                                                <th style={{ width: "120px", textAlign: "right" }}>ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoices.map((inv) => {
                                                const isPaid = (inv.status || "").toLowerCase() === "paid";
                                                return (
                                                    <tr key={inv.id} onClick={() => router.push(`/client/invoices/${inv.id}`)}>
                                                        <td className="bold-cell">{inv.invoiceNumber || inv.invoice_number || "INV-001"}</td>
                                                        <td className="muted-cell">{formatDate(inv.dueDate || inv.due_date)}</td>
                                                        <td>
                                                            <span className={`client-badge ${isPaid ? "client-badge-success" : "client-badge-warning"}`}>
                                                                {inv.status || "PENDING"}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                                                            {formatMoney(Number(inv.total) || 0)}
                                                        </td>
                                                        <td style={{ textAlign: "right" }}>
                                                            <span style={{ color: "#2563EB", fontWeight: 600, fontSize: "13px" }}>
                                                                View →
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: DOCUMENTS LIST */}
                        {activeTab === "documents" && (
                            <div className="client-table-container">
                                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #EBEBEB" }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#0F172A" }}>
                                            Project Documents
                                        </h2>
                                        <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748B" }}>
                                            {documents.length} contracts, proposals, and agreements
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="client-btn-primary client-btn-compact"
                                        onClick={() => router.push("/client/documents")}
                                    >
                                        Go to Documents Hub
                                    </button>
                                </div>

                                <div className="client-table-scroll">
                                    <table className="client-table">
                                        <thead>
                                            <tr>
                                                <th>DOCUMENT</th>
                                                <th>REFERENCE</th>
                                                <th>STATUS</th>
                                                <th style={{ width: "160px", textAlign: "right" }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {documents.map((doc) => {
                                                const isSigned = doc.status === "signed";
                                                return (
                                                    <tr key={doc.id}>
                                                        <td className="bold-cell">{doc.title}</td>
                                                        <td className="muted-cell">{doc.reference}</td>
                                                        <td>
                                                            <span className={`client-badge ${isSigned ? "client-badge-success" : "client-badge-warning"}`}>
                                                                {isSigned ? "SIGNED" : "AWAITING SIGNATURE"}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: "right" }}>
                                                            <div style={{ display: "inline-flex", gap: "6px" }}>
                                                                <button
                                                                    type="button"
                                                                    className="client-btn-secondary client-btn-compact"
                                                                    onClick={() => openDocumentForViewing(doc.id)}
                                                                >
                                                                    View
                                                                </button>
                                                                {!isSigned && (
                                                                    <button
                                                                        type="button"
                                                                        className="client-btn-primary client-btn-compact"
                                                                        onClick={() => openDocumentForSigning(doc.id)}
                                                                    >
                                                                        Sign
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Document Viewer Modal */}
            {viewingDoc && project && (
                <DocumentViewerModal
                    projectId={project.id}
                    document={viewingDoc}
                    onClose={() => setViewingDoc(null)}
                    onSign={() => {
                        const target = viewingDoc;
                        setViewingDoc(null);
                        setSigningDoc(target);
                    }}
                />
            )}

            {/* Document Signing Modal */}
            {signingDoc && project && (
                <DocumentSignModal
                    projectId={project.id}
                    document={signingDoc}
                    initialSignerName={project.clientName || ""}
                    onClose={() => setSigningDoc(null)}
                    onSigned={(docId) => {
                        handleSigned(docId);
                        setSigningDoc(null);
                    }}
                />
            )}
        </main>
    );
}

export default function ClientDashboardPage() {
    return (
        <Suspense
            fallback={
                <main className="client-redesign-shell">
                    <div className="client-bg-glow" />
                    <ClientDashboardRail current="/client/boq-dashboard" />
                    <div className="client-main-area">
                        <div className="client-loading-card">
                            <Loader2 className="animate-spin" size={36} color="#2563EB" />
                            <span>Opening BOQ Dashboard...</span>
                        </div>
                    </div>
                </main>
            }
        >
            <ClientDashboardContent />
        </Suspense>
    );
}
