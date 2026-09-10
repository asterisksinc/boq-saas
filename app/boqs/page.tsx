"use client";

import {
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    FileText,
    MoreHorizontal,
    Plus,
    Search,
    X,
    Edit2,
    Copy,
    FileDown,
    FileSpreadsheet
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

// Templates are loaded dynamically from the API

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
    const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
    const [templates, setTemplates] = useState<{id: string; name: string; description: string | null; tags: string[] | null; use_count: number}[]>([]);

    useEffect(() => {
        const loadProj = async () => {
            try { const res = await fetch("/api/v1/projects?pageSize=100", { credentials: "include" }); if(res.ok){ const d = await res.json(); setProjects((d.data?.items ?? []).map((p:any) => ({ id: p.id, name: p.name }))); } } catch (e) {}
        };
        const loadTemplates = async () => {
            try { const res = await fetch("/api/v1/boq-templates?pageSize=50", { credentials: "include" }); if(res.ok){ const d = await res.json(); setTemplates(d.data?.items ?? []); } } catch (e) {}
        };
        void loadProj();
        void loadTemplates();
        const handleClick = () => { setOpenMenuId(null); setOpenStatusId(null); };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    useEffect(() => {
        const loadBoqs = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await fetch("/api/v1/boqs?pageSize=100", { credentials: "include" });
                const payload = await response.json();
                if (!response.ok) {
                    setError(getApiErrorMessage(payload));
                    return;
                }

                const result = parseApiResponse<BoqApiPage<Record<string, unknown>>>(payload);
                const mapped = (result.items ?? []).map((item) => mapBoqListItem({
                    id: String(item.id),
                    boqNumber: String(item.boqNumber ?? ""),
                    projectId: typeof item.projectId === "string" ? item.projectId : null,
                    projectName: typeof item.projectName === "string" ? item.projectName : null,
                    version: typeof item.version === "string" ? item.version : null,
                    status: typeof item.status === "string" ? item.status : null,
                    roomCount: typeof item.roomCount === "number" ? item.roomCount : Number(item.roomCount ?? 0),
                    itemCount: typeof item.itemCount === "number" ? item.itemCount : Number(item.itemCount ?? 0),
                    grandTotal: typeof item.grandTotal === "number" ? item.grandTotal : Number(item.grandTotal ?? 0),
                    assignedTo: typeof item.assignedTo === "string" ? item.assignedTo : null,
                    assignedToName: typeof item.assignedToName === "string" ? item.assignedToName : null,
                    createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
                }));

                setBoqRows(mapped);
                setSelectedBoqId((current) => current ?? mapped[0]?.id ?? null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load BOQs.");
            } finally {
                setLoading(false);
            }
        };

        void loadBoqs();
    }, []);

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
                                <p>{boqRows.length} BOQs</p>
                            </div>
                            <div className="boq-page-actions">
                                <button type="button" className="boq-ghost-button">Import Excel</button>
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
                                            <td colSpan={10} style={{ textAlign: "center", padding: "16px" }}>Loading BOQs...</td>
                                        </tr>
                                    ) : boqRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} style={{ padding: "0" }}>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", background: "#fff" }}>
                                                    <img src="/assets/dashboard/empty-boqs.png" alt="No BOQs found" style={{ width: "240px", marginBottom: "24px" }} />
                                                    <strong style={{ fontSize: "20px", color: "#1f2d3d", marginBottom: "8px" }}>No BOQs found</strong>
                                                    <p style={{ color: "#6b7280", fontSize: "15px", marginBottom: "24px", textAlign: "center" }}>Create your first BOQ to start managing<br/>your project quantities and estimates.</p>
                                                    <button type="button" className="fig-dashboard-new" onClick={() => setShowCreateModal(true)} style={{ padding: "10px 24px" }}>
                                                        <Plus size={18} /><span>New BOQ</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        boqRows.map((boq) => (
                                            <tr key={boq.id} className="boq-row" onClick={() => openBoq(boq.id)}>
                                                <td>{boq.boqNumber}</td>
                                                <td>{boq.projectName}</td>
                                                <td>{boq.version}</td>
                                                <td>{boq.rooms}</td>
                                                <td>{boq.items}</td>
                                                <td>{formatMoney(boq.estimatedValue)}</td>
                                                <td>{boq.assignedTo}</td>
                                                <td>{boq.date}</td>
                                                <td style={{ position: "relative" }}>
                                                    <span 
                                                        className={`boq-status-pill ${boq.status.toLowerCase().replace(/\s/g, "-")}`}
                                                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                                                        onClick={(e) => { e.stopPropagation(); setOpenStatusId(openStatusId === boq.id ? null : boq.id); setOpenMenuId(null); }}
                                                    >
                                                        {boq.status} <ChevronDown size={14} />
                                                    </span>
                                                    {openStatusId === boq.id && (
                                                        <div
                                                            className="boq-dropdown-menu"
                                                            style={{
                                                                position: "absolute",
                                                                top: "100%",
                                                                left: "16px",
                                                                background: "#fff",
                                                                border: "1px solid #e5e7eb",
                                                                borderRadius: "8px",
                                                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                                                zIndex: 10,
                                                                minWidth: "140px",
                                                                padding: "4px 0",
                                                                marginTop: "4px"
                                                            }}
                                                        >
                                                            {(["DRAFT", "IN REVIEW", "APPROVED", "ARCHIVED"] as BoqStatusUi[]).map(status => (
                                                                <button
                                                                    key={status}
                                                                    style={{
                                                                        display: "block",
                                                                        width: "100%",
                                                                        textAlign: "left",
                                                                        padding: "8px 16px",
                                                                        background: "none",
                                                                        border: "none",
                                                                        fontSize: "13px",
                                                                        color: "#374151",
                                                                        cursor: "pointer"
                                                                    }}
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        setOpenStatusId(null);




                                                                        const res = await fetch(
                                                                            `/api/v1/boqs/${boq.id}/status`,
                                                                            {
                                                                                method: "POST",
                                                                                headers: {
                                                                                    "Content-Type": "application/json"
                                                                                },
                                                                                body: JSON.stringify({
                                                                                    status: status
                                                                                        .toLowerCase()
                                                                                        .replace(" ", "_")
                                                                                }),
                                                                                credentials: "include"
                                                                            }
                                                                        );

                                                                        if (res.ok) {
                                                                            setBoqRows(
                                                                                boqRows.map(b =>
                                                                                    b.id === boq.id
                                                                                        ? { ...b, status }
                                                                                        : b
                                                                                )
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    {status}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ position: "relative" }}>
                                                    <button type="button" className="boq-row-menu" aria-label="More options" onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === boq.id ? null : boq.id); setOpenStatusId(null); }}>
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                    {openMenuId === boq.id && (
                                                        <div className="boq-dropdown-menu" style={{ position: "absolute", top: "100%", right: "16px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", zIndex: 10, minWidth: "160px", padding: "4px 0", marginTop: "4px" }}>
                                                            <button style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", textAlign: "left", padding: "8px 16px", background: "none", border: "none", fontSize: "13px", color: "#374151", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); openBoq(boq.id); setOpenMenuId(null); }}><Edit2 size={14} color="#6b7280" /> Open Editor</button>
                                                            <button style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", textAlign: "left", padding: "8px 16px", background: "none", border: "none", fontSize: "13px", color: "#374151", cursor: "pointer" }} onClick={async (e) => { 
                                                                e.stopPropagation(); 
                                                                setOpenMenuId(null);
                                                                try {
                                                                    const res = await fetch(`/api/v1/boqs/${boq.id}/duplicate`, { method: "POST", credentials: "include" });
                                                                    if (res.ok) window.location.reload();
                                                                    else { const p = await res.json().catch(() => ({})); setError(getApiErrorMessage(p)); }
                                                                } catch (err) { setError("Failed to duplicate BOQ"); }
                                                            }}><Copy size={14} color="#6b7280" /> Duplicate BOQ</button>
                                                            <button style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", textAlign: "left", padding: "8px 16px", background: "none", border: "none", fontSize: "13px", color: "#374151", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); window.open(`/api/v1/boqs/${boq.id}/pdf`, "_blank"); }}><FileDown size={14} color="#6b7280" /> Export as PDF</button>
                                                            <button style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", textAlign: "left", padding: "8px 16px", background: "none", border: "none", fontSize: "13px", color: "#374151", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); window.open(`/api/v1/boqs/${boq.id}/excel`, "_blank"); }}><FileSpreadsheet size={14} color="#6b7280" /> Export Excel</button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="boq-footer-row">
                            <span>Total: {boqRows.length}</span>
                            <div className="boq-pagination">
                                <button type="button">‹</button>
                                <button type="button" className="active">1</button>
                                <button type="button">2</button>
                                <button type="button">3</button>
                                <button type="button">4</button>
                                <button type="button">5</button>
                                <button type="button">›</button>
                            </div>
                            <label className="boq-page-size">
                                <span>Show per Page:</span>
                                <select defaultValue="10">
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                </select>
                            </label>
                        </div>
                    </section>
                ) : activeBoq ? (
                    <BoqDetail activeBoq={activeBoq} onBack={() => setScreen("list")} />
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
                                <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>No templates found. Create a BOQ first, then save it as a template.</div>
                            ) : templates.map((template) => (
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
                                                {template.tags.map(tag => <span key={tag}>{tag}</span>)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
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
                                <input type="text" placeholder="e.g. BOQ-0071" defaultValue="BOQ-0071" />
                            </label>

                            <label className="boq-form-field">
                                <span>Project <em>*</em></span>
                                <select id="createBoqProjectId">
                                    {projects.length > 0 ? projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    )) : <option value="">Create a Project first...</option>}
                                </select>
                            </label>

                            <div className="boq-form-row">
                                <label className="boq-form-field">
                                    <span>Version</span>
                                    <input type="text" id="createBoqVersion" defaultValue="v1" />
                                </label>
                            </div>

                            {createMode === "template" ? (
                                <label className="boq-form-field">
                                    <span>Select Template <em>*</em></span>
                                    <select id="createBoqTemplateId">
                                        {templates.length === 0 ? (
                                            <option value="">No templates available</option>
                                        ) : templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </label>
                            ) : null}

                            <div className="boq-method-box">
                                Method: {createMode === "template" ? "From Template" : "Blank BOQ"}
                            </div>
                        </div>

                        <div className="boq-create-footer">
                            <button type="button" className="boq-cancel-button" onClick={() => setShowDetailsModal(false)}>
                                Back
                            </button>
                            <button type="button" className="boq-cancel-button" onClick={() => setShowDetailsModal(false)}>
                                Cancel
                            </button>
                            <button type="button" className="fig-dashboard-new" onClick={async () => {
                                const projId = (document.getElementById("createBoqProjectId") as HTMLSelectElement)?.value;
                                const version = (document.getElementById("createBoqVersion") as HTMLInputElement)?.value || "v1";
                                
                                if (!projId) {
                                    setError("Please create a Project first!");
                                    setShowDetailsModal(false);
                                    return;
                                }
                                
                                try {
                                    const templateId = createMode === "template" ? (document.getElementById("createBoqTemplateId") as HTMLSelectElement)?.value : undefined;
                                    const res = await fetch("/api/v1/boqs", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ boqNumber: "BOQ-" + Math.floor(Math.random() * 10000), projectId: projId, version, method: createMode || "blank", templateId: templateId || undefined }),
                                        credentials: "include"
                                    });
                                    if (!res.ok) {
                                        const payload = await res.json().catch(() => ({}));
                                        throw new Error(getApiErrorMessage(payload));
                                    }
                                    window.location.reload();
                                } catch (e) {
                                    setError(e instanceof Error ? e.message : "Could not create BOQ.");
                                    setShowDetailsModal(false);
                                }
                            }}>
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
    const [addingRoom, setAddingRoom] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");

    const loadDetail = async () => {
        setLoading(true);
        setActionError("");
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to load BOQ details');
            const data = await res.json();
            const boq = data.data;
            setBoqData(boq);
            setRooms(boq?.rooms && Array.isArray(boq.rooms) ? boq.rooms : []);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to load BOQ details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadDetail(); }, [activeBoq.id]);

    const handleDuplicate = async () => {
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/duplicate`, { method: 'POST', credentials: 'include' });
            if (!res.ok) { const p = await res.json().catch(() => ({})); throw new Error(getApiErrorMessage(p)); }
            window.location.reload();
        } catch (err) { setActionError(err instanceof Error ? err.message : "Failed to duplicate"); }
    };

    const handleStatusChange = async (status: string) => {
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/status`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) { const p = await res.json().catch(() => ({})); throw new Error(getApiErrorMessage(p)); }
            window.location.reload();
        } catch (err) { setActionError(err instanceof Error ? err.message : "Failed to change status"); }
    };

    const handleAddRoom = async () => {
        if (!newRoomName.trim()) return;
        try {
            const res = await fetch(`/api/v1/boqs/${activeBoq.id}/rooms`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newRoomName.trim() })
            });
            if (!res.ok) { const p = await res.json().catch(() => ({})); throw new Error(getApiErrorMessage(p)); }
            setNewRoomName("");
            setAddingRoom(false);
            void loadDetail();
        } catch (err) { setActionError(err instanceof Error ? err.message : "Failed to add room"); }
    };

    const totalItems = rooms.reduce((acc: number, r: any) => {
        const cats = r.categories || [];
        return acc + cats.reduce((a: number, c: any) => a + (c.items?.length || 0), 0);
    }, 0);

    const subtotal = boqData?.subtotal ?? activeBoq.estimatedValue;
    const markupPercent = boqData?.markupPercent ?? 0;
    const taxPercent = boqData?.taxPercent ?? 0;
    const markupAmount = boqData?.markupAmount ?? 0;
    const taxAmount = boqData?.taxAmount ?? 0;
    const grandTotal = boqData?.grandTotal ?? activeBoq.estimatedValue;

    return (
        <section className="boq-detail-shell">
            <div className="boq-detail-breadcrumb">
                <span>Bill of Quantities</span>
                <ChevronRight size={15} />
                <span className="active">{activeBoq.boqNumber}</span>
            </div>

            <div className="boq-detail-header-row">
                <div className="boq-detail-heading-wrap">
                    <button type="button" className="boq-icon-back" onClick={onBack}>
                        <ArrowLeft size={17} />
                    </button>
                    <div className="boq-title-stack">
                        <div className="boq-title-line">
                            <span className="boq-big-title">{activeBoq.boqNumber}</span>
                            <span className={`boq-status-pill ${activeBoq.status.toLowerCase().replace(/\s/g, '-')}`}>
                                {activeBoq.status}
                            </span>
                        </div>
                        <span className="boq-subtitle">{activeBoq.projectName} - {activeBoq.version}</span>
                    </div>
                </div>

                <div className="boq-detail-actions-row">
                    <button type="button" className="boq-ghost-button" onClick={handleDuplicate}>Duplicate</button>
                    <button type="button" className="boq-ghost-button" onClick={() => handleStatusChange('in_review')}>Send for Review</button>
                    <button type="button" className="fig-dashboard-new boq-save-button" onClick={() => handleStatusChange('draft')}>Save Draft</button>
                </div>
            </div>

            {actionError && <div className="boq-alert" style={{margin: '0 0 16px'}}>{actionError}</div>}

            <div className="boq-detail-layout">
                <div className="boq-main-panel">
                    <div className="boq-panel-toolbar">
                        <label className="boq-search-field">
                            <Search size={15} />
                            <input placeholder="Search..." aria-label="Search rooms" />
                        </label>

                        <div className="boq-toolbar-right">
                            <button type="button" className="fig-dashboard-new boq-add-room" onClick={() => setAddingRoom(true)}>
                                <Plus size={18} />
                                <span>Add Room</span>
                            </button>
                        </div>
                    </div>

                    {addingRoom && (
                        <div style={{display: 'flex', gap: '8px', padding: '12px 16px', background: '#f9fafb', borderRadius: '8px', marginBottom: '12px'}}>
                            <input
                                type="text" placeholder="Room name" value={newRoomName}
                                onChange={e => setNewRoomName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddRoom()}
                                style={{flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px'}}
                                autoFocus
                            />
                            <button type="button" className="fig-dashboard-new" onClick={handleAddRoom} style={{padding: '8px 16px'}}>Add</button>
                            <button type="button" className="boq-ghost-button" onClick={() => { setAddingRoom(false); setNewRoomName(""); }}>Cancel</button>
                        </div>
                    )}

                    <div className="boq-table-card">
                        <div className="boq-table-heading">{rooms.length} Rooms</div>
                        <table className="boq-room-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Room</th>
                                    <th>Categories</th>
                                    <th>Items</th>
                                    <th>Amount (₹)</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{textAlign: 'center', padding: '16px'}}>Loading rooms...</td></tr>
                                ) : rooms.length === 0 ? (
                                    <tr><td colSpan={6} style={{textAlign: 'center', padding: '16px'}}>No rooms found. Add a room to get started!</td></tr>
                                ) : rooms.map((room, idx) => {
                                    const cats = room.categories || [];
                                    const itemCount = cats.reduce((a: number, c: any) => a + (c.items?.length || 0), 0);
                                    const roomTotal = cats.reduce((a: number, c: any) => a + (c.items || []).reduce((s: number, i: any) => s + (i.amount || 0), 0), 0);
                                    return (
                                        <tr key={room.id} style={{ cursor: 'pointer' }}>
                                            <td>{idx + 1}</td>
                                            <td>{room.name}</td>
                                            <td>{cats.length}</td>
                                            <td>{itemCount}</td>
                                            <td>{roomTotal > 0 ? formatMoney(roomTotal) : '-'}</td>
                                            <td>{room.description ?? '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <aside className="boq-summary-panel">
                    <div className="boq-summary-card">
                        <div className="boq-summary-row">
                            <span>Subtotal</span>
                            <strong>{formatMoney(subtotal)}</strong>
                        </div>
                        {markupPercent > 0 && (
                            <div className="boq-summary-row">
                                <span>Markup ({markupPercent}%)</span>
                                <strong>{formatMoney(markupAmount)}</strong>
                            </div>
                        )}
                        {taxPercent > 0 && (
                            <div className="boq-summary-row">
                                <span>GST ({taxPercent}%)</span>
                                <strong>{formatMoney(taxAmount)}</strong>
                            </div>
                        )}
                        <div className="boq-summary-row total">
                            <span>Grand Total</span>
                            <strong>{formatMoney(grandTotal)}</strong>
                        </div>
                    </div>

                    <div className="boq-summary-metric">
                        <span>Rooms Covered</span>
                        <strong>{rooms.length}</strong>
                    </div>
                    <div className="boq-summary-metric">
                        <span>Items</span>
                        <strong>{totalItems}</strong>
                    </div>

                    <button type="button" className="fig-dashboard-new boq-submit-button" onClick={() => window.location.assign('/proposals')}>Generate Proposal</button>
                </aside>
            </div>
        </section>
    );
}