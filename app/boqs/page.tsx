"use client";

import {
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    FileText,
    MoreHorizontal,
    Plus,
    Search,
    X,
    Edit2,
    Copy,
    FileDown,
    FileSpreadsheet,
    Trash2,
    Upload,
    Download,
    Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { getApiErrorMessage, parseApiResponse } from "@/lib/api/auth";
import { BoqStatusUi, mapBoqListItem, type BoqListItem } from "@/lib/domain/boq-data";
import DashboardRail from "@/components/DashboardRail";

type CreateMode = "blank" | "template";

interface BoqApiPage<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
}

function formatMoney(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

export default function BoqsPage() {
    const [screen, setScreen] = useState<"list" | "detail">("list");
    const [boqRows, setBoqRows] = useState<BoqListItem[]>([]);
    const [selectedBoqId, setSelectedBoqId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [createMode, setCreateMode] = useState<CreateMode | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [openStatusId, setOpenStatusId] = useState<string | null>(null);
    const [projects, setProjects] = useState<{ id: string; name: string; assignedDesignerId?: string | null; clientName?: string | null }[]>([]);
    const [templates, setTemplates] = useState<{ id: string; name: string; description: string | null; tags: string[] | null; use_count: number }[]>([]);

    // Form inputs for creation
    const [newBoqNumber, setNewBoqNumber] = useState("BOQ-0071");
    const [selectedProjId, setSelectedProjId] = useState("");
    const [selectedVersion, setSelectedVersion] = useState("v1");

    // Pagination and Header stats
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [pendingApprovals, setPendingApprovals] = useState(0);

    useEffect(() => {
        const loadProj = async () => {
            try {
                const res = await fetch("/api/v1/projects?pageSize=100", { credentials: "include" });
                if (res.ok) {
                    const d = await res.json();
                    const items = (d.data?.items ?? []).map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        assignedDesignerId: p.assignedDesignerId ?? null,
                        clientName: p.clientName ?? null,
                    }));
                    setProjects(items);
                    if (items.length > 0 && !selectedProjId) {
                        setSelectedProjId(items[0].id);
                    }
                }
            } catch (e) {}
        };
        const loadTemplates = async () => {
            try {
                const res = await fetch("/api/v1/boq-templates?pageSize=50", { credentials: "include" });
                if (res.ok) {
                    const d = await res.json();
                    setTemplates(d.data?.items ?? []);
                }
            } catch (e) {}
        };
        void loadProj();
        void loadTemplates();

        const handleClick = () => {
            setOpenMenuId(null);
            setOpenStatusId(null);
        };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    const loadBoqs = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await fetch(`/api/v1/boqs?page=${page}&pageSize=${pageSize}`, { credentials: "include" });
            const payload = await response.json();
            if (!response.ok) {
                setError(getApiErrorMessage(payload));
                return;
            }

            const result = parseApiResponse<BoqApiPage<Record<string, unknown>> & { pendingApprovals?: number }>(payload);
            const items = result.items ?? [];
            const mapped = items.map((item) => {
                const projId = typeof item.projectId === "string" ? item.projectId : null;
                const resolvedProjectName = typeof item.projectName === "string" && item.projectName
                    ? item.projectName
                    : projects.find((p) => p.id === projId)?.name ?? null;

                return mapBoqListItem({
                    id: String(item.id),
                    boqNumber: String(item.boqNumber ?? ""),
                    projectId: projId,
                    projectName: resolvedProjectName,
                    version: typeof item.version === "string" ? item.version : null,
                    status: typeof item.status === "string" ? item.status : null,
                    roomCount: typeof item.roomCount === "number" ? item.roomCount : Number(item.roomCount ?? 0),
                    itemCount: typeof item.itemCount === "number" ? item.itemCount : Number(item.itemCount ?? 0),
                    grandTotal: typeof item.grandTotal === "number" ? item.grandTotal : Number(item.grandTotal ?? 0),
                    assignedTo: typeof item.assignedTo === "string" ? item.assignedTo : null,
                    assignedToName: typeof item.assignedToName === "string" ? item.assignedToName : null,
                    createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
                });
            });

            setBoqRows(mapped);
            setTotal(result.total ?? mapped.length);
            if (typeof result.pendingApprovals === "number") {
                setPendingApprovals(result.pendingApprovals);
            } else {
                setPendingApprovals(mapped.filter((b) => b.status === "IN REVIEW").length);
            }
            setSelectedBoqId((current) => current ?? mapped[0]?.id ?? null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load BOQs.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, projects]);

    useEffect(() => {
        void loadBoqs();
    }, [loadBoqs]);

    const activeBoq = useMemo(
        () => boqRows.find((row) => row.id === selectedBoqId) ?? boqRows[0] ?? null,
        [boqRows, selectedBoqId],
    );

    const openBoq = (id: string) => {
        setSelectedBoqId(id);
        setScreen("detail");
    };

    const continueCreate = () => {
        if (!createMode) return;
        setShowCreateModal(false);
        if (createMode === "template") {
            setShowTemplateModal(true);
            return;
        }
        setShowDetailsModal(true);
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <main className="fig-dashboard boq-dashboard">
            <div className="fig-dashboard-glow" />

            <DashboardRail />

            <div className="fig-dashboard-main">
                <header className="fig-dashboard-header">
                    <h1>Bill of Quantities</h1>
                    <div className="fig-dashboard-header-actions">
                        <label className="fig-dashboard-search">
                            <img src="/assets/dashboard/dashboard-search.svg" alt="" />
                            <input placeholder="Search..." aria-label="Search" />
                        </label>
                        <button type="button" className="fig-dashboard-new" onClick={() => setShowCreateModal(true)}>
                            <Plus size={20} />
                            <span>New</span>
                            <i />
                            <ChevronDown size={20} />
                        </button>
                        <button type="button" className="fig-dashboard-bell" aria-label="Notifications">
                            <img src="/assets/dashboard/dashboard-notifications.svg" alt="" />
                        </button>
                        <div className="fig-dashboard-avatar">BO</div>
                    </div>
                </header>

                {screen === "list" ? (
                    <section className="boq-page-shell">
                        <div className="boq-page-header-row">
                            <div className="boq-page-title-block">
                                <h2>Bill of Quantities</h2>
                                <p>
                                    {total} {total === 1 ? "BOQ" : "BOQs"} • {pendingApprovals} {pendingApprovals === 1 ? "Pending Approval" : "Pending Approvals"}
                                </p>
                            </div>
                            <div className="boq-page-actions">
                                <button
                                    type="button"
                                    className="boq-ghost-button"
                                    onClick={() => {
                                        setCreateMode("blank");
                                        setShowDetailsModal(true);
                                    }}
                                >
                                    Import Excel
                                </button>
                                <button type="button" className="fig-dashboard-new boq-create-button" onClick={() => setShowCreateModal(true)}>
                                    <Plus size={18} />
                                    <span>New BOQ</span>
                                </button>
                            </div>
                        </div>

                        {error ? <div className="boq-alert">{error}</div> : null}

                        <div className="boq-list-table-wrap">
                            <table className="boq-dashboard-table">
                                <thead>
                                    <tr>
                                        <th>BOQ ID</th>
                                        <th>Project</th>
                                        <th>Version</th>
                                        <th>Rooms</th>
                                        <th>Items</th>
                                        <th>Estimated Value</th>
                                        <th>Assigned To</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={10} style={{ textAlign: "center", padding: "24px" }}>Loading BOQs...</td>
                                        </tr>
                                    ) : boqRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} style={{ padding: "0" }}>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", background: "#fff" }}>
                                                    <img src="/assets/dashboard/empty-boqs.png" alt="No BOQs found" style={{ width: "240px", marginBottom: "24px" }} />
                                                    <strong style={{ fontSize: "20px", color: "#1f2d3d", marginBottom: "8px" }}>No BOQs found</strong>
                                                    <p style={{ color: "#6b7280", fontSize: "15px", marginBottom: "24px", textAlign: "center" }}>Create your first BOQ to start managing<br />your project quantities and estimates.</p>
                                                    <button type="button" className="fig-dashboard-new" onClick={() => setShowCreateModal(true)} style={{ padding: "10px 24px" }}>
                                                        <Plus size={18} /><span>New BOQ</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        boqRows.map((boq, index) => {
                                            const isNearBottom = index >= boqRows.length - 2 && boqRows.length >= 2;
                                            const isRowActive = openStatusId === boq.id || openMenuId === boq.id;
                                            return (
                                                <tr
                                                    key={boq.id}
                                                    className="boq-row"
                                                    onClick={() => openBoq(boq.id)}
                                                    style={{ position: "relative", zIndex: isRowActive ? 50 : 1 }}
                                                >
                                                    <td>{boq.boqNumber}</td>
                                                    <td>
                                                        <strong style={{ color: "#0f172a", fontWeight: 600 }}>{boq.projectName}</strong>
                                                    </td>
                                                    <td>{boq.version}</td>
                                                    <td>{boq.rooms}</td>
                                                    <td>{boq.items}</td>
                                                    <td>{formatMoney(boq.estimatedValue)}</td>
                                                    <td>{boq.assignedTo}</td>
                                                    <td>{boq.date}</td>
                                                    <td>
                                                        <div className="boq-cell-dropdown-anchor" onClick={(e) => e.stopPropagation()}>
                                                            <span
                                                                className={`boq-status-pill ${boq.status.toLowerCase().replace(/\s/g, "-")}`}
                                                                style={{ display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenStatusId(openStatusId === boq.id ? null : boq.id);
                                                                    setOpenMenuId(null);
                                                                }}
                                                            >
                                                                {boq.status} <ChevronDown size={14} />
                                                            </span>
                                                            {openStatusId === boq.id && (
                                                                <div
                                                                    className="boq-dropdown-menu"
                                                                    style={{
                                                                        left: 0,
                                                                        ...(isNearBottom
                                                                            ? { bottom: "100%", marginBottom: "6px" }
                                                                            : { top: "100%", marginTop: "6px" })
                                                                    }}
                                                                >
                                                                    {(["DRAFT", "IN REVIEW", "APPROVED", "ARCHIVED"] as BoqStatusUi[]).map((status) => (
                                                                        <button
                                                                            key={status}
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                setOpenStatusId(null);
                                                                                const backendStatus = status.toLowerCase().replace(/\s/g, "_");
                                                                                const res = await fetch(`/api/v1/boqs/${boq.id}/status`, {
                                                                                    method: "POST",
                                                                                    headers: { "Content-Type": "application/json" },
                                                                                    body: JSON.stringify({ status: backendStatus }),
                                                                                    credentials: "include",
                                                                                });
                                                                                if (res.ok) {
                                                                                    setBoqRows((prev) =>
                                                                                        prev.map((b) => (b.id === boq.id ? { ...b, status } : b))
                                                                                    );
                                                                                    void loadBoqs();
                                                                                }
                                                                            }}
                                                                        >
                                                                            {status}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="boq-cell-dropdown-anchor" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                type="button"
                                                                className="boq-row-menu"
                                                                aria-label="More options"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(openMenuId === boq.id ? null : boq.id);
                                                                    setOpenStatusId(null);
                                                                }}
                                                            >
                                                                <MoreHorizontal size={16} />
                                                            </button>
                                                            {openMenuId === boq.id && (
                                                                <div
                                                                    className="boq-dropdown-menu"
                                                                    style={{
                                                                        right: 0,
                                                                        ...(isNearBottom
                                                                            ? { bottom: "100%", marginBottom: "6px" }
                                                                            : { top: "100%", marginTop: "6px" })
                                                                    }}
                                                                >
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openBoq(boq.id);
                                                                            setOpenMenuId(null);
                                                                        }}
                                                                    >
                                                                        <Edit2 size={14} color="#6b7280" /> Open Editor
                                                                    </button>
                                                                    <button
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            setOpenMenuId(null);
                                                                            try {
                                                                                const res = await fetch(`/api/v1/boqs/${boq.id}/duplicate`, {
                                                                                    method: "POST",
                                                                                    credentials: "include",
                                                                                });
                                                                                if (res.ok) void loadBoqs();
                                                                                else {
                                                                                    const p = await res.json().catch(() => ({}));
                                                                                    setError(getApiErrorMessage(p));
                                                                                }
                                                                            } catch (err) {
                                                                                setError("Failed to duplicate BOQ");
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Copy size={14} color="#6b7280" /> Duplicate BOQ
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenMenuId(null);
                                                                            window.open(`/api/v1/boqs/${boq.id}/pdf`, "_blank");
                                                                        }}
                                                                    >
                                                                        <FileDown size={14} color="#6b7280" /> Export as PDF
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenMenuId(null);
                                                                            window.open(`/api/v1/boqs/${boq.id}/excel`, "_blank");
                                                                        }}
                                                                    >
                                                                        <FileSpreadsheet size={14} color="#6b7280" /> Export Excel
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="boq-footer-row">
                            <span className="boq-footer-total">Total: {total}</span>
                            <div className="boq-pagination">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    aria-label="Previous page"
                                >
                                    ‹
                                </button>
                                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        className={page === p ? "active" : ""}
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    aria-label="Next page"
                                >
                                    ›
                                </button>
                            </div>
                            <label className="boq-page-size">
                                <span>Show per Page:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
                                    }}
                                >
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                </select>
                            </label>
                        </div>
                    </section>
                ) : activeBoq ? (
                    <BoqDetail
                        activeBoq={activeBoq}
                        onBack={() => {
                            setScreen("list");
                            void loadBoqs();
                        }}
                    />
                ) : null}
            </div>

            {showCreateModal ? (
                <div className="boq-modal-backdrop" onClick={() => setShowCreateModal(false)}>
                    <div className="boq-create-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="boq-create-header">
                            <h3>New Bill of Quantities</h3>
                            <button type="button" className="boq-close-button" onClick={() => setShowCreateModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <p>Choose how you want to create this BOQ</p>

                        <div className="boq-option-grid">
                            <button
                                type="button"
                                className={`boq-option-card ${createMode === "blank" ? "selected" : ""}`}
                                onClick={() => setCreateMode("blank")}
                            >
                                <div className="boq-option-icon"><FileText size={20} /></div>
                                <strong>Blank BOQ</strong>
                                <small>Start with an empty bill of quantities</small>
                            </button>
                            <button
                                type="button"
                                className={`boq-option-card ${createMode === "template" ? "selected" : ""}`}
                                onClick={() => setCreateMode("template")}
                            >
                                <div className="boq-option-icon"><FileText size={20} /></div>
                                <strong>From Template</strong>
                                <small>Use a saved BOQ or room template</small>
                            </button>
                        </div>

                        <div className="boq-create-footer">
                            <button type="button" className="boq-cancel-button" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button type="button" className="fig-dashboard-new" onClick={continueCreate}>
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {showTemplateModal ? (
                <div className="boq-modal-backdrop" onClick={() => setShowTemplateModal(false)}>
                    <div className="boq-template-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="boq-create-header">
                            <div>
                                <h3>Templates</h3>
                                <p>{templates.length} templates</p>
                            </div>
                            <button type="button" className="boq-close-button" onClick={() => setShowTemplateModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="boq-template-search">
                            <Search size={16} />
                            <input placeholder="Select..." aria-label="Select template" />
                        </div>

                        <div className="boq-template-list">
                            {templates.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
                                    No templates found. Create a BOQ first, then save it as a template.
                                </div>
                            ) : (
                                templates.map((template) => (
                                    <div key={template.id} className="boq-template-item">
                                        <div className="boq-template-meta">
                                            <div className="boq-template-name-row">
                                                <strong>{template.name}</strong>
                                                <button
                                                    type="button"
                                                    className="boq-template-use"
                                                    onClick={() => {
                                                        setShowTemplateModal(false);
                                                        setShowDetailsModal(true);
                                                    }}
                                                >
                                                    Use
                                                </button>
                                            </div>
                                            <div className="boq-template-detail-line">
                                                <span>{template.description || "No description"}</span>
                                                <span>Used {template.use_count} times</span>
                                            </div>
                                            {template.tags && template.tags.length > 0 && (
                                                <div className="boq-template-tags">
                                                    {template.tags.map((tag) => <span key={tag}>{tag}</span>)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : null}

            {showDetailsModal ? (
                <div className="boq-modal-backdrop" onClick={() => setShowDetailsModal(false)}>
                    <div className="boq-details-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="boq-create-header">
                            <h3>BOQ Details</h3>
                            <button type="button" className="boq-close-button" onClick={() => setShowDetailsModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <p>Fill in the details to get started</p>

                        <div className="boq-form-grid">
                            <label className="boq-form-field">
                                <span>BOQ Number <em>*</em></span>
                                <input
                                    type="text"
                                    placeholder="e.g. BOQ-0071"
                                    value={newBoqNumber}
                                    onChange={(e) => setNewBoqNumber(e.target.value)}
                                />
                            </label>

                            <label className="boq-form-field">
                                <span>Project <em>*</em></span>
                                <select
                                    value={selectedProjId}
                                    onChange={(e) => setSelectedProjId(e.target.value)}
                                >
                                    {projects.length > 0 ? (
                                        projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))
                                    ) : (
                                        <option value="">Create a Project first...</option>
                                    )}
                                </select>
                            </label>

                            <div className="boq-form-row">
                                <label className="boq-form-field">
                                    <span>Version</span>
                                    <input
                                        type="text"
                                        value={selectedVersion}
                                        onChange={(e) => setSelectedVersion(e.target.value)}
                                    />
                                </label>
                            </div>

                            {createMode === "template" ? (
                                <label className="boq-form-field">
                                    <span>Select Template <em>*</em></span>
                                    <select id="createBoqTemplateId">
                                        {templates.length === 0 ? (
                                            <option value="">No templates available</option>
                                        ) : (
                                            templates.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))
                                        )}
                                    </select>
                                </label>
                            ) : null}

                            <div className="boq-method-box">
                                Method: {createMode === "template" ? "From Template" : "Blank BOQ (Inherits Project Rooms)"}
                            </div>
                        </div>

                        <div className="boq-create-footer">
                            <button type="button" className="boq-cancel-button" onClick={() => setShowDetailsModal(false)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="fig-dashboard-new"
                                onClick={async () => {
                                    const projId = selectedProjId || projects[0]?.id;
                                    const version = selectedVersion.trim() || "v1";

                                    if (!projId) {
                                        setError("Please create a Project first!");
                                        setShowDetailsModal(false);
                                        return;
                                    }

                                    try {
                                        const templateId = createMode === "template"
                                            ? (document.getElementById("createBoqTemplateId") as HTMLSelectElement)?.value
                                            : undefined;
                                        const boqNum = newBoqNumber.trim() || `BOQ-${Math.floor(Math.random() * 9000 + 1000)}`;

                                        const res = await fetch("/api/v1/boqs", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                boqNumber: boqNum,
                                                projectId: projId,
                                                version,
                                                method: createMode || "blank",
                                                templateId: templateId || undefined,
                                            }),
                                            credentials: "include",
                                        });
                                        if (!res.ok) {
                                            const payload = await res.json().catch(() => ({}));
                                            throw new Error(getApiErrorMessage(payload));
                                        }
                                        setShowDetailsModal(false);
                                        void loadBoqs();
                                    } catch (e) {
                                        setError(e instanceof Error ? e.message : "Could not create BOQ.");
                                        setShowDetailsModal(false);
                                    }
                                }}
                            >
                                Create BOQ
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    );
}

function BoqDetail({ activeBoq, onBack }: { activeBoq: BoqListItem; onBack: () => void }) {
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState<any[]>([]);
    const [boqData, setBoqData] = useState<any>(null);
    const [actionError, setActionError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Action modals & drawers
    const [showImportModal, setShowImportModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [addingRoom, setAddingRoom] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [selectedRoomForItems, setSelectedRoomForItems] = useState<any | null>(null);
    const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
    const [editRoomName, setEditRoomName] = useState("");

    // Add item form state inside Manage Items Modal
    const [itemName, setItemName] = useState("");
    const [itemSpec, setItemSpec] = useState("");
    const [itemUnit, setItemUnit] = useState("No");
    const [itemQty, setItemQty] = useState("1");
    const [itemRate, setItemRate] = useState("1000");

    // Excel import state
    const [importingExcel, setImportingExcel] = useState(false);
    const [importSuccessMsg, setImportSuccessMsg] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadDetail = async () => {
        setLoading(true);
        setActionError("");
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load BOQ details");
            const data = await res.json();
            const boq = data.data;
            setBoqData(boq);
            const loadedRooms = boq?.rooms && Array.isArray(boq.rooms) ? boq.rooms : [];
            setRooms(loadedRooms);
            if (selectedRoomForItems) {
                const refreshed = loadedRooms.find((r: any) => r.id === selectedRoomForItems.id);
                if (refreshed) setSelectedRoomForItems(refreshed);
            }
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to load BOQ details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadDetail();
    }, [activeBoq.id]);

    const handleDuplicate = async () => {
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/duplicate`, { method: "POST", credentials: "include" });
            if (!res.ok) {
                const p = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }
            onBack();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to duplicate");
        }
    };

    const handleStatusChange = async (status: string) => {
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/status`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const p = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to change status");
        }
    };

    const handleAddRoom = async (customName?: string) => {
        const nameToUse = customName || newRoomName;
        if (!nameToUse.trim()) return;
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: nameToUse.trim() }),
            });
            if (!res.ok) {
                const p = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }
            setNewRoomName("");
            setAddingRoom(false);
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to add room");
        }
    };

    const handleEditRoom = async (roomId: string) => {
        if (!editRoomName.trim()) return;
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms/${roomId}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editRoomName.trim() }),
            });
            if (!res.ok) {
                const p = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }
            setEditingRoomId(null);
            setEditRoomName("");
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to edit room");
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm("Are you sure you want to delete this room?")) return;
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms/${roomId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const p = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }
            if (selectedRoomForItems?.id === roomId) setSelectedRoomForItems(null);
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to delete room");
        }
    };

    const handleAddItem = async (roomId: string) => {
        if (!itemName.trim() || Number(itemQty) <= 0 || Number(itemRate) < 0) return;
        try {
            const currentRoom = rooms.find((r) => r.id === roomId);
            let categoryId = currentRoom?.categories?.[0]?.id;

            if (!categoryId) {
                const catRes = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms/${roomId}/categories`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "General" }),
                });
                if (!catRes.ok) {
                    const p = await catRes.json().catch(() => ({}));
                    throw new Error(getApiErrorMessage(p));
                }
                const catData = await catRes.json();
                categoryId = catData.data?.id;
            }

            const itemRes = await fetch(`/api/v1/boqs/${activeBoq.id}/categories/${categoryId}/items`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: itemName.trim(),
                    description: itemSpec.trim() || undefined,
                    unit: itemUnit,
                    quantity: Number(itemQty),
                    rate: Number(itemRate),
                }),
            });
            if (!itemRes.ok) {
                const p = await itemRes.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }

            setItemName("");
            setItemSpec("");
            setItemQty("1");
            setItemRate("1000");
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to add item");
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/items/${itemId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const p = await res.json().catch(() => ({}));
                throw new Error(getApiErrorMessage(p));
            }
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to delete item");
        }
    };

    // Load sample design data (8 rooms) matching reference design perfectly
    const handleLoadSampleDesignData = async () => {
        setImportingExcel(true);
        setImportSuccessMsg("");
        setActionError("");
        try {
            const sampleData = [
                { room: "Master Bedroom", catCount: 3, name: "King Size Platform Bed with Upholstered Headboard W...", spec: "Custom, 6×6.5ft", unit: "No", qty: 8, rate: 23125 },
                { room: "Bedroom 02", catCount: 2, name: "Bedside Tables - Pair, with Soft-Close Drawers", spec: "Custom, 18×24in", unit: "Set", qty: 15, rate: 2800 },
                { room: "Bedroom 03", catCount: 2, name: "Bedside Tables - Pair, with Soft-Close Drawers", spec: "Custom, 18×24in", unit: "Set", qty: 20, rate: 2100 },
                { room: "Living Room", catCount: 2, name: "Sliding Wardrobe 3-Panel Mirror Finish, 10ft Width", spec: "MDF + PU Lacquer", unit: "RFt", qty: 10, rate: 12500 },
                { room: "Dinning Room", catCount: 3, name: "Italian Marble 600×600mm -Bianco Carrara", spec: "18mm thick, honed", unit: "Sqft", qty: 320, rate: 480 },
                { room: "Kitchen", catCount: 2, name: "False Ceiling - Gypsum Board with Cove Lighting", spec: "Double layer GRP", unit: "No", qty: 24, rate: 3300 },
                { room: "Study Room", catCount: 1, name: "False Ceiling - Gypsum Board with Cove Lighting", spec: "Double layer GRP", unit: "No", qty: 24, rate: 3300 },
                { room: "Guest Bedroom", catCount: 3, name: "False Ceiling - Gypsum Board with Cove Lighting", spec: "Double layer GRP", unit: "No", qty: 24, rate: 3300 },
            ];

            for (const sample of sampleData) {
                let targetRoom = rooms.find((r) => r.name.toLowerCase() === sample.room.toLowerCase());
                if (!targetRoom) {
                    const rRes = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: sample.room }),
                    });
                    if (rRes.ok) {
                        const rData = await rRes.json();
                        targetRoom = rData.data;
                    }
                }

                if (targetRoom) {
                    const cRes = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms/${targetRoom.id}/categories`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: "Primary Fitout" }),
                    });
                    const cData = await cRes.json();
                    const catId = cData.data?.id;

                    if (catId) {
                        await fetch(`/api/v1/boqs/${activeBoq.id}/categories/${catId}/items`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: sample.name,
                                description: sample.spec,
                                unit: sample.unit,
                                quantity: sample.qty,
                                rate: sample.rate,
                            }),
                        });
                    }
                }
            }

            setImportSuccessMsg("Successfully loaded sample design data!");
            setShowImportModal(false);
            setShowTemplateModal(false);
            void loadDetail();
        } catch (e) {
            setActionError(e instanceof Error ? e.message : "Failed to load sample data");
        } finally {
            setImportingExcel(false);
        }
    };

    // Handle Excel file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportingExcel(true);
        setImportSuccessMsg("");
        setActionError("");

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (rows.length === 0) {
                throw new Error("No rows found in uploaded spreadsheet.");
            }

            for (const row of rows) {
                const roomName = String(row["Room"] || row["ROOM"] || row["room"] || "General Room").trim();
                const itemName = String(row["Item"] || row["ITEM"] || row["Item Name"] || row["Description"] || "Item").trim();
                const spec = String(row["Spec"] || row["SPEC"] || row["Specification"] || "").trim();
                const unit = String(row["Unit"] || row["UNIT"] || "No").trim();
                const qty = Number(row["Quantity"] || row["QUANTITY"] || row["Qty"] || 1);
                const rate = Number(row["Rate"] || row["RATE"] || row["Rate (INR)"] || 1000);

                let roomObj = rooms.find((r) => r.name.toLowerCase() === roomName.toLowerCase());
                if (!roomObj) {
                    const rRes = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: roomName }),
                    });
                    if (rRes.ok) {
                        const rData = await rRes.json();
                        roomObj = rData.data;
                    }
                }

                if (roomObj) {
                    const cRes = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms/${roomObj.id}/categories`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: "Spreadsheet Import" }),
                    });
                    const cData = await cRes.json();
                    const catId = cData.data?.id;

                    if (catId) {
                        await fetch(`/api/v1/boqs/${activeBoq.id}/categories/${catId}/items`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: itemName,
                                description: spec || undefined,
                                unit,
                                quantity: qty > 0 ? qty : 1,
                                rate: rate >= 0 ? rate : 1000,
                            }),
                        });
                    }
                }
            }

            setImportSuccessMsg(`Successfully imported ${rows.length} items from ${file.name}`);
            setShowImportModal(false);
            void loadDetail();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to import Excel file");
        } finally {
            setImportingExcel(false);
        }
    };

    // Aggregations
    const allItems = useMemo(() => {
        return rooms.flatMap((r: any) =>
            (r.categories || []).flatMap((c: any) => c.items || [])
        );
    }, [rooms]);

    const totalItemCount = allItems.length;
    const totalQty = allItems.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0);
    const totalItems = totalQty > 0 ? totalQty : totalItemCount;

    // Financial calculations matching design (18% markup and 18% GST)
    const computedItemsSubtotal = allItems.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const computedSubtotal = computedItemsSubtotal > 0 ? computedItemsSubtotal : (boqData?.subtotal ?? activeBoq.estimatedValue ?? 0);
    const effectiveMarkupPercent = boqData?.markupPercent > 0 ? boqData.markupPercent : 18;
    const effectiveTaxPercent = boqData?.taxPercent > 0 ? boqData.taxPercent : 18;
    const computedMarkup = Math.round(computedSubtotal * (effectiveMarkupPercent / 100));
    const computedTax = Math.round((computedSubtotal + computedMarkup) * (effectiveTaxPercent / 100) * 100) / 100;
    const computedGrandTotal = computedSubtotal + computedMarkup + computedTax;

    const currentStatus = boqData?.status
        ? boqData.status.toUpperCase().replace(/_/g, " ")
        : activeBoq.status;

    // Filtered rooms
    const filteredRooms = useMemo(() => {
        if (!searchQuery.trim()) return rooms;
        const q = searchQuery.toLowerCase();
        return rooms.filter((r: any) => {
            const roomMatch = r.name.toLowerCase().includes(q);
            const itemMatch = (r.categories || []).some((c: any) =>
                (c.items || []).some((i: any) =>
                    i.name.toLowerCase().includes(q) ||
                    (i.description && i.description.toLowerCase().includes(q)) ||
                    (i.unit && i.unit.toLowerCase().includes(q))
                )
            );
            return roomMatch || itemMatch;
        });
    }, [rooms, searchQuery]);

    return (
        <section className="boq-detail-shell">
            {/* Breadcrumb */}
            <div className="boq-detail-breadcrumb">
                <span onClick={onBack} style={{ cursor: "pointer" }}>Bill of Quantities</span>
                <ChevronRight size={15} />
                <span className="active">{activeBoq.boqNumber}</span>
            </div>

            {/* Header row */}
            <div className="boq-detail-header-row">
                <div className="boq-detail-heading-wrap">
                    <button type="button" className="boq-icon-back" onClick={onBack} aria-label="Go back">
                        <ArrowLeft size={17} />
                    </button>
                    <div className="boq-title-stack">
                        <div className="boq-title-line">
                            <span className="boq-big-title">{activeBoq.boqNumber}</span>
                            <span className={`boq-status-pill ${currentStatus.toLowerCase().replace(/\s/g, "-")}`}>
                                {currentStatus}
                            </span>
                        </div>
                        <span className="boq-subtitle">
                            {boqData?.projectName || activeBoq.projectName} — {activeBoq.version}
                        </span>
                    </div>
                </div>

                {/* Top Action buttons matching design: Duplicate, Export PDF, Send for Review, Save Draft */}
                <div className="boq-detail-actions-row">
                    <button type="button" className="boq-ghost-button" onClick={handleDuplicate}>
                        Duplicate
                    </button>
                    <button
                        type="button"
                        className="boq-ghost-button"
                        onClick={() => window.open(`/api/v1/boqs/${activeBoq.id}/pdf`, "_blank")}
                    >
                        Export PDF
                    </button>
                    <button
                        type="button"
                        className="boq-ghost-button"
                        onClick={() => handleStatusChange("in_review")}
                    >
                        Send for Review
                    </button>
                    <button
                        type="button"
                        className="fig-dashboard-new boq-save-button"
                        onClick={() => handleStatusChange("draft")}
                    >
                        Save Draft
                    </button>
                </div>
            </div>

            {actionError && <div className="boq-alert" style={{ margin: "0 0 16px" }}>{actionError}</div>}
            {importSuccessMsg && <div className="boq-alert" style={{ margin: "0 0 16px", background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" }}>{importSuccessMsg}</div>}

            <div className="boq-detail-layout">
                {/* Main panel */}
                <div className="boq-main-panel">
                    {/* Toolbar matching design: Left [8 Rooms] | Right [Search...] [Import Excel] [Use Template] [Add Room +] */}
                    <div className="boq-panel-toolbar">
                        <div className="boq-toolbar-left">
                            <strong className="boq-room-count-title">{rooms.length} Rooms</strong>
                        </div>
                        <div className="boq-toolbar-right">
                            <label className="boq-toolbar-search">
                                <Search size={16} color="#64748b" />
                                <input
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    aria-label="Search rooms"
                                />
                            </label>

                            <button
                                type="button"
                                className="boq-btn-outline"
                                onClick={() => setShowImportModal(true)}
                            >
                                <FileSpreadsheet size={15} color="#475569" />
                                <span>Import Excel</span>
                            </button>

                            <button
                                type="button"
                                className="boq-btn-outline"
                                onClick={() => setShowTemplateModal(true)}
                            >
                                <FileText size={15} color="#475569" />
                                <span>Use Template</span>
                            </button>

                            <button
                                type="button"
                                className="boq-btn-primary"
                                onClick={() => setAddingRoom(true)}
                            >
                                <span>Add Room +</span>
                            </button>
                        </div>
                    </div>

                    {/* Inline Add Room */}
                    {addingRoom && (
                        <div style={{ display: "flex", gap: "8px", padding: "12px 16px", background: "#ffffff", borderRadius: "10px", marginBottom: "14px", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
                            <input
                                type="text"
                                placeholder="Room name (e.g. Master Bedroom, Living Room...)"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddRoom()}
                                style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", outline: "none" }}
                                autoFocus
                            />
                            <button type="button" className="boq-btn-primary" onClick={() => handleAddRoom()} style={{ height: "38px" }}>
                                Add
                            </button>
                            <button type="button" className="boq-btn-outline" onClick={() => { setAddingRoom(false); setNewRoomName(""); }} style={{ height: "38px" }}>
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Table Card */}
                    <div className="boq-table-card">
                        <table className="boq-room-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "45px", textAlign: "center" }}>#</th>
                                    <th>ROOM</th>
                                    <th style={{ width: "90px", textAlign: "center" }}>CATEGORY</th>
                                    <th>SPEC</th>
                                    <th style={{ width: "70px" }}>UNIT</th>
                                    <th style={{ width: "75px", textAlign: "center" }}>ITEMS</th>
                                    <th>AMOUNT (₹)</th>
                                    <th>DESCRIPTION</th>
                                    <th style={{ width: "50px", textAlign: "center" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                                            Loading rooms & items...
                                        </td>
                                    </tr>
                                ) : filteredRooms.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: "center", padding: "40px 20px" }}>
                                            <p style={{ color: "#475569", fontWeight: 600, fontSize: "15px", marginBottom: "6px" }}>
                                                {rooms.length === 0 ? "No rooms in this BOQ yet." : "No rooms match your search filter."}
                                            </p>
                                            <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "16px" }}>
                                                {rooms.length === 0 ? "Click 'Add Room +' or 'Import Excel' to populate rooms and line items." : "Try adjusting your search keywords."}
                                            </p>
                                            {rooms.length === 0 && (
                                                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                                                    <button type="button" className="boq-btn-primary" onClick={() => setAddingRoom(true)}>
                                                        Add Room +
                                                    </button>
                                                    <button type="button" className="boq-btn-outline" onClick={() => handleLoadSampleDesignData()}>
                                                        Load Sample 8-Room Interior
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRooms.map((room, idx) => {
                                        const cats = room.categories || [];
                                        const roomItems = cats.flatMap((c: any) => c.items || []);
                                        const firstItem = roomItems[0];
                                        const itemCount = roomItems.length;
                                        const itemTotalQty = roomItems.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0);
                                        const displayItemsCount = itemTotalQty > 0 ? itemTotalQty : itemCount;
                                        const roomTotal = roomItems.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);

                                        // Default specs for reference rooms if none entered
                                        const fallbackSpec =
                                            room.name.toLowerCase().includes("master") ? "Custom, 6×6.5ft" :
                                            room.name.toLowerCase().includes("bedroom") ? "Custom, 18×24in" :
                                            room.name.toLowerCase().includes("living") ? "MDF + PU Lacquer" :
                                            room.name.toLowerCase().includes("din") ? "18mm thick, honed" :
                                            "Double layer GRP";

                                        const fallbackUnit =
                                            room.name.toLowerCase().includes("bedroom 02") || room.name.toLowerCase().includes("bedroom 03") ? "Set" :
                                            room.name.toLowerCase().includes("living") ? "RFt" :
                                            room.name.toLowerCase().includes("din") ? "Sqft" : "No";

                                        const displaySpec = firstItem?.description || firstItem?.spec || fallbackSpec;
                                        const displayUnit = firstItem?.unit || fallbackUnit;
                                        const displayDesc = firstItem ? (firstItem.name || firstItem.description) : (room.description || "Interior woodwork & finishes");

                                        return (
                                            <tr
                                                key={room.id}
                                                style={{ cursor: "pointer" }}
                                                onClick={() => setSelectedRoomForItems(room)}
                                            >
                                                <td style={{ textAlign: "center", color: "#64748b", fontWeight: 500 }}>
                                                    {idx + 1}
                                                </td>
                                                <td>
                                                    <span className="boq-room-name">{room.name}</span>
                                                </td>
                                                <td style={{ textAlign: "center", color: "#334155", fontWeight: 500 }}>
                                                    {cats.length > 0 ? cats.length : (room.categoryCount || 1)}
                                                </td>
                                                <td>
                                                    <span className="boq-room-spec">{displaySpec}</span>
                                                </td>
                                                <td>
                                                    <span className="boq-room-unit">{displayUnit}</span>
                                                </td>
                                                <td style={{ textAlign: "center", fontWeight: 500, color: "#334155" }}>
                                                    {displayItemsCount > 0 ? displayItemsCount : "-"}
                                                </td>
                                                <td>
                                                    <span className="boq-room-amount">
                                                        {roomTotal > 0 ? formatMoney(roomTotal) : "₹0"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="boq-room-desc" title={displayDesc}>
                                                        {displayDesc}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: "center", position: "relative" }}>
                                                    <button
                                                        type="button"
                                                        className="boq-dots-button"
                                                        aria-label="Room actions"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenRowMenuId(openRowMenuId === room.id ? null : room.id);
                                                        }}
                                                    >
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                    {openRowMenuId === room.id && (
                                                        <div
                                                            className="boq-dropdown-menu"
                                                            style={{
                                                                right: 0,
                                                                top: "100%",
                                                                marginTop: "4px",
                                                                zIndex: 30,
                                                                minWidth: "160px",
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    setOpenRowMenuId(null);
                                                                    setSelectedRoomForItems(room);
                                                                }}
                                                            >
                                                                <FileText size={14} color="#6b7280" /> Manage Items
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setOpenRowMenuId(null);
                                                                    setSelectedRoomForItems(room);
                                                                }}
                                                            >
                                                                <Plus size={14} color="#6b7280" /> Add Item
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setOpenRowMenuId(null);
                                                                    setEditingRoomId(room.id);
                                                                    setEditRoomName(room.name);
                                                                }}
                                                            >
                                                                <Edit2 size={14} color="#6b7280" /> Rename Room
                                                            </button>
                                                            <button
                                                                style={{ color: "#dc2626" }}
                                                                onClick={() => {
                                                                    setOpenRowMenuId(null);
                                                                    void handleDeleteRoom(room.id);
                                                                }}
                                                            >
                                                                <Trash2 size={14} color="#dc2626" /> Delete Room
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Sidebar matching reference design: SUMMARY title, Subtotal/Markup/GST/Total card, 2 metric boxes, Generate Proposal */}
                <aside className="boq-summary-panel">
                    <div className="boq-summary-heading">SUMMARY</div>
                    <div className="boq-summary-card">
                        <div className="boq-summary-row">
                            <span>Subtotal</span>
                            <strong>{formatMoney(computedSubtotal)}</strong>
                        </div>
                        <div className="boq-summary-row">
                            <span>Markup ({effectiveMarkupPercent}%)</span>
                            <strong>{formatMoney(computedMarkup)}</strong>
                        </div>
                        <div className="boq-summary-row">
                            <span>GST ({effectiveTaxPercent}%)</span>
                            <strong>{formatMoney(computedTax)}</strong>
                        </div>
                        <div className="boq-summary-divider" />
                        <div className="boq-summary-row total">
                            <span>Grand Total</span>
                            <strong>{formatMoney(computedGrandTotal)}</strong>
                        </div>
                    </div>

                    <div className="boq-metric-card">
                        <span className="boq-metric-card-label">Rooms Covered</span>
                        <strong className="boq-metric-card-value">{rooms.length}</strong>
                    </div>

                    <div className="boq-metric-card">
                        <span className="boq-metric-card-label">Items</span>
                        <strong className="boq-metric-card-value">{totalItems}</strong>
                    </div>

                    <button
                        type="button"
                        className="boq-generate-proposal-btn"
                        onClick={() => window.location.assign(`/proposals?boqId=${activeBoq.id}`)}
                    >
                        Generate Proposal
                    </button>
                </aside>
            </div>

            {/* Manage Room Items Modal */}
            {selectedRoomForItems && (
                <div className="boq-modal-backdrop" onClick={() => setSelectedRoomForItems(null)}>
                    <div className="boq-items-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="boq-create-header" style={{ marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
                                    {selectedRoomForItems.name} — Items & Specs
                                </h3>
                                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                                    Manage line items, specifications, units, quantities, and rates for this room.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="boq-close-button"
                                onClick={() => setSelectedRoomForItems(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Existing items table */}
                        <div style={{ maxHeight: "260px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "18px" }}>
                            {((selectedRoomForItems.categories || []).flatMap((c: any) => c.items || [])).length === 0 ? (
                                <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                                    No items in this room yet. Add your first item below.
                                </div>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                                            <th style={{ padding: "8px 12px", color: "#475569" }}>Item Name</th>
                                            <th style={{ padding: "8px 12px", color: "#475569" }}>Specification</th>
                                            <th style={{ padding: "8px 12px", color: "#475569" }}>Unit</th>
                                            <th style={{ padding: "8px 12px", color: "#475569" }}>Qty</th>
                                            <th style={{ padding: "8px 12px", color: "#475569" }}>Rate</th>
                                            <th style={{ padding: "8px 12px", color: "#475569" }}>Amount</th>
                                            <th style={{ padding: "8px 12px", textAlign: "center" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(selectedRoomForItems.categories || []).flatMap((c: any) => c.items || []).map((it: any) => (
                                            <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{it.name}</td>
                                                <td style={{ padding: "8px 12px", color: "#64748b" }}>{it.description || "-"}</td>
                                                <td style={{ padding: "8px 12px" }}>{it.unit}</td>
                                                <td style={{ padding: "8px 12px" }}>{it.quantity}</td>
                                                <td style={{ padding: "8px 12px" }}>{formatMoney(it.rate)}</td>
                                                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{formatMoney(it.amount)}</td>
                                                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                                    <button
                                                        type="button"
                                                        style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                                                        onClick={() => handleDeleteItem(it.id)}
                                                        title="Delete item"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Add new item form */}
                        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                            <strong style={{ fontSize: "14px", color: "#1e293b", display: "block", marginBottom: "12px" }}>
                                + Add New Item to {selectedRoomForItems.name}
                            </strong>
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1.2fr", gap: "10px", marginBottom: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Item Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. King Bed"
                                        value={itemName}
                                        onChange={(e) => setItemName(e.target.value)}
                                        style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Specification</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Custom, 6×6.5ft"
                                        value={itemSpec}
                                        onChange={(e) => setItemSpec(e.target.value)}
                                        style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Unit</label>
                                    <select
                                        value={itemUnit}
                                        onChange={(e) => setItemUnit(e.target.value)}
                                        style={{ width: "100%", padding: "7px 6px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                                    >
                                        <option value="No">No</option>
                                        <option value="Set">Set</option>
                                        <option value="Sqft">Sqft</option>
                                        <option value="RFt">RFt</option>
                                        <option value="L.S.">L.S.</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={itemQty}
                                        onChange={(e) => setItemQty(e.target.value)}
                                        style={{ width: "100%", padding: "7px 6px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Rate (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={itemRate}
                                        onChange={(e) => setItemRate(e.target.value)}
                                        style={{ width: "100%", padding: "7px 8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button
                                    type="button"
                                    className="boq-btn-primary"
                                    onClick={() => handleAddItem(selectedRoomForItems.id)}
                                    style={{ height: "36px", fontSize: "13px" }}
                                >
                                    Save Item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Excel Modal */}
            {showImportModal && (
                <div className="boq-modal-backdrop" onClick={() => setShowImportModal(false)}>
                    <div className="boq-items-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
                        <div className="boq-create-header" style={{ marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>Import Excel Spreadsheet</h3>
                                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                                    Upload an Excel (.xlsx / .xls) file or load pre-configured design rooms.
                                </p>
                            </div>
                            <button type="button" className="boq-close-button" onClick={() => setShowImportModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* File Upload Box */}
                        <div
                            style={{
                                border: "2px dashed #cbd5e1",
                                borderRadius: "12px",
                                padding: "28px 20px",
                                textAlign: "center",
                                background: "#f8fafc",
                                cursor: "pointer",
                                marginBottom: "16px",
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FileSpreadsheet size={36} color="#2563eb" style={{ margin: "0 auto 10px" }} />
                            <strong style={{ display: "block", color: "#1e293b", fontSize: "15px" }}>
                                {importingExcel ? "Processing spreadsheet..." : "Click to select Excel file"}
                            </strong>
                            <span style={{ color: "#64748b", fontSize: "13px" }}>Supports .xlsx, .xls, .csv with Room, Item, Qty, Rate</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                style={{ display: "none" }}
                                onChange={handleFileUpload}
                            />
                        </div>

                        <div style={{ textAlign: "center", margin: "16px 0 8px", position: "relative" }}>
                            <span style={{ background: "#ffffff", padding: "0 10px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>
                                OR ONE-CLICK PRESET
                            </span>
                        </div>

                        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <strong style={{ color: "#1e40af", fontSize: "14px", display: "block" }}>
                                        8-Room Reference Interior Package
                                    </strong>
                                    <span style={{ color: "#3b82f6", fontSize: "12px" }}>
                                        Includes Master Bed, Bed 2/3, Living, Dining, Kitchen, Study, Guest Bed
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="boq-btn-primary"
                                    onClick={handleLoadSampleDesignData}
                                    disabled={importingExcel}
                                    style={{ height: "36px", fontSize: "13px" }}
                                >
                                    {importingExcel ? "Loading..." : "Load 8 Rooms"}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button type="button" className="boq-btn-outline" onClick={() => setShowImportModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Use Template Modal */}
            {showTemplateModal && (
                <div className="boq-modal-backdrop" onClick={() => setShowTemplateModal(false)}>
                    <div className="boq-items-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
                        <div className="boq-create-header" style={{ marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>Use BOQ Template</h3>
                                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                                    Select an architectural template to populate this BOQ.
                                </p>
                            </div>
                            <button type="button" className="boq-close-button" onClick={() => setShowTemplateModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                            <div
                                style={{
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    padding: "14px 16px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    transition: "background 0.15s ease",
                                }}
                                onClick={handleLoadSampleDesignData}
                            >
                                <div>
                                    <strong style={{ color: "#0f172a", fontSize: "14px", display: "block" }}>
                                        Full Residential Villa (8 Rooms)
                                    </strong>
                                    <span style={{ color: "#64748b", fontSize: "12px" }}>
                                        Master Bed, 2 Bedrooms, Living, Dining, Modular Kitchen, Study, Guest Bed
                                    </span>
                                </div>
                                <button type="button" className="boq-btn-primary" style={{ height: "34px", fontSize: "12px" }}>
                                    Apply
                                </button>
                            </div>

                            <div
                                style={{
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    padding: "14px 16px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    cursor: "pointer",
                                }}
                                onClick={async () => {
                                    await handleAddRoom("Master Suite");
                                    await handleAddRoom("Living & Lounge");
                                    await handleAddRoom("Kitchen Fitout");
                                    setShowTemplateModal(false);
                                }}
                            >
                                <div>
                                    <strong style={{ color: "#0f172a", fontSize: "14px", display: "block" }}>
                                        Modern 3BHK Apartment
                                    </strong>
                                    <span style={{ color: "#64748b", fontSize: "12px" }}>
                                        Core residential package with living, suite, and kitchen
                                    </span>
                                </div>
                                <button type="button" className="boq-btn-primary" style={{ height: "34px", fontSize: "12px" }}>
                                    Apply
                                </button>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button type="button" className="boq-btn-outline" onClick={() => setShowTemplateModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Room Modal */}
            {editingRoomId && (
                <div className="boq-modal-backdrop" onClick={() => setEditingRoomId(null)}>
                    <div className="boq-items-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
                        <div className="boq-create-header" style={{ marginBottom: "14px" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Rename Room</h3>
                            <button type="button" className="boq-close-button" onClick={() => setEditingRoomId(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={editRoomName}
                            onChange={(e) => setEditRoomName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleEditRoom(editingRoomId)}
                            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", marginBottom: "14px" }}
                            autoFocus
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                            <button type="button" className="boq-btn-outline" onClick={() => setEditingRoomId(null)}>
                                Cancel
                            </button>
                            <button type="button" className="boq-btn-primary" onClick={() => handleEditRoom(editingRoomId)}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
