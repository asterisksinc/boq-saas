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

type CreateMode = "blank" | "template";

interface BoqApiPage<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
}

const menuRoutes = [
    "/dashboard",
    "/projects",
    "/boqs",
    "/costs",
    "/workspace",
    "/proposals",
    "/invoices",
    "/analytics",
    "/documents",
    "/integrations",
    "/billing",
];

const menuIcons = [
    "dashboard-overview-active",
    "dashboard-projects",
    "dashboard-boqs",
    "dashboard-costs",
    "dashboard-workspace",
    "dashboard-estimates",
    "dashboard-purchase-orders",
    "dashboard-analytics",
    "dashboard-reports",
    "dashboard-integrations",
    "dashboard-billing",
];

const dossierTemplates = [
    { name: "Residential - 3BHK Standard", rooms: 8, items: 124, size: "128 sq.ft", tag: "Residential", category: "Popular", price: "₹1,85,000/No" },
    { name: "Office Fit-Out - Corporate", rooms: 5, items: 86, size: "18 sq.ft", tag: "Commercial", category: "Office", price: "₹4,40,000/No" },
    { name: "Modular Kitchen - L-Shape", rooms: 1, items: 22, size: "24 sq.ft", tag: "Kitchen", category: "Modular", price: "₹1,85,000/No" },
];

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

    useEffect(() => {
        const loadProj = async () => {
            try { const res = await fetch("/api/v1/projects?pageSize=100", { credentials: "include" }); if(res.ok){ const d = await res.json(); setProjects((d.data?.items ?? []).map((p:any) => ({ id: p.id, name: p.name }))); } } catch (e) {}
        };
        void loadProj();
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

            <aside className="fig-dashboard-rail" aria-label="Dashboard navigation">
                <div className="fig-dashboard-logo">
                    <span>
                        <img src="/assets/boq-logo-small.svg" alt="BOQ" />
                    </span>
                </div>

                <nav className="fig-dashboard-menu">
                    {menuRoutes.map((route, index) => (
                        <button
                            key={route}
                            type="button"
                            className={index === 2 ? "is-current" : ""}
                            aria-label={`Navigate to ${route}`}
                            onClick={() => window.location.assign(route)}
                        >
                            <img src={`/assets/dashboard/${menuIcons[index]}.svg`} alt="" />
                        </button>
                    ))}
                </nav>

                <div className="fig-dashboard-tools">
                    <button type="button" aria-label="Help">
                        <img src="/assets/dashboard/dashboard-help.svg" alt="" />
                    </button>
                    <button type="button" aria-label="Settings">
                        <img src="/assets/dashboard/dashboard-settings.svg" alt="" />
                    </button>
                </div>
            </aside>

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

                                                                        if (boq.id.startsWith("mock-")) {
                                                                            setBoqRows(
                                                                                boqRows.map(b =>
                                                                                    b.id === boq.id
                                                                                        ? { ...b, status }
                                                                                        : b
                                                                                )
                                                                            );
                                                                            return;
                                                                        }

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
                                                                if (boq.id.startsWith("mock-")) {
                                                                    const newB = { ...boq, id: 'mock-'+Date.now(), boqNumber: boq.boqNumber + ' (Copy)' }; setBoqRows([newB, ...boqRows]); return;
                                                                }
                                                                const res = await fetch(`/api/v1/boqs/${boq.id}/duplicate`, { method: "POST", credentials: "include" });
                                                                if (res.ok) window.location.reload();
                                                            }}><Copy size={14} color="#6b7280" /> Duplicate BOQ</button>
                                                            <button style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", textAlign: "left", padding: "8px 16px", background: "none", border: "none", fontSize: "13px", color: "#374151", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); alert("PDF"); setOpenMenuId(null); }}><FileDown size={14} color="#6b7280" /> Export as PDF</button>
                                                            <button style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", textAlign: "left", padding: "8px 16px", background: "none", border: "none", fontSize: "13px", color: "#374151", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); alert("Excel"); setOpenMenuId(null); }}><FileSpreadsheet size={14} color="#6b7280" /> Export Excel</button>
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
                            <span>Total Arrivals: 30</span>
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
                    <section className="boq-detail-shell">
                        <div className="boq-detail-breadcrumb">
                            <span>Bill of Quantities</span>
                            <ChevronRight size={15} />
                            <span className="active">{activeBoq.boqNumber}</span>
                        </div>

                        <div className="boq-detail-header-row">
                            <div className="boq-detail-heading-wrap">
                                <button type="button" className="boq-icon-back" onClick={() => setScreen("list")}>
                                    <ArrowLeft size={17} />
                                </button>
                                <div className="boq-title-stack">
                                    <div className="boq-title-line">
                                        <span className="boq-big-title">{activeBoq.boqNumber}</span>
                                        <span className={`boq-status-pill ${activeBoq.status.toLowerCase().replace(/\s/g, "-")}`}>
                                            {activeBoq.status}
                                        </span>
                                    </div>
                                    <span className="boq-subtitle">{activeBoq.projectName} - {activeBoq.version}</span>
                                </div>
                            </div>

                            <div className="boq-detail-actions-row">
                                <button type="button" className="boq-ghost-button">Duplicate</button>
                                <button type="button" className="boq-ghost-button">Export PDF</button>
                                <button type="button" className="boq-ghost-button">Send for Review</button>
                                <button type="button" className="fig-dashboard-new boq-save-button">Save Draft</button>
                            </div>
                        </div>

                        <div className="boq-detail-layout">
                            <div className="boq-main-panel">
                                <div className="boq-panel-toolbar">
                                    <label className="boq-search-field">
                                        <Search size={15} />
                                        <input placeholder="Search..." aria-label="Search rooms" />
                                    </label>

                                    <div className="boq-toolbar-right">
                                        <button type="button" className="boq-ghost-button">Import Excel</button>
                                        <button type="button" className="boq-ghost-button">Use Template</button>
                                        <button type="button" className="fig-dashboard-new boq-add-room">
                                            <Plus size={18} />
                                            <span>Add Room</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="boq-table-card">
                                    <div className="boq-table-heading">8 Rooms</div>
                                    <table className="boq-room-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Room</th>
                                                <th>Category</th>
                                                <th>Spec</th>
                                                <th>Unit</th>
                                                <th>Items</th>
                                                <th>Amount (₹)</th>
                                                <th>Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                [1, "Master Bedroom", "3", "Custom. 6×6.5ft", "No", 8, "₹1,85,000", "King Size Platform Bed with Upholstered Headboard W..."],
                                                [2, "Bedroom 02", "2", "Custom. 18×24in", "Set", 15, "₹42,000", "Bedside Tables - Pair, with Soft-Close Drawers"],
                                                [3, "Bedroom 03", "2", "Custom. 18×24in", "Set", 20, "₹42,000", "Bedside Tables - Pair, with Soft-Close Drawers"],
                                                [4, "Living Room", "2", "MDF + PU Lacquer", "Rft", 10, "₹15,200", "Sliding Wardrobe 3-Panel Mirror Finish..."],
                                                [5, "Dining Room", "3", "18mm thick, honed", "Sqft", 320, "₹1,53,600", "Italian Marble 600×600mm - Blanco Carrara"],
                                                [6, "Kitchen", "2", "Double layer GRP", "No", 24, "₹79,200", "False Ceiling - Gypsum Board with Cove Lighting"],
                                                [7, "Study Room", "1", "Double layer GRP", "No", 24, "₹79,200", "False Ceiling - Gypsum Board with Cove Lighting"],
                                                [8, "Guest Bedroom", "3", "Double layer GRP", "No", 24, "₹79,200", "False Ceiling - Gypsum Board with Cove Lighting"],
                                            ].map(([no, room, category, spec, unit, items, amount, description]) => (
                                                <tr key={String(no)}>
                                                    <td>{no}</td>
                                                    <td>{room}</td>
                                                    <td>{category}</td>
                                                    <td>{spec}</td>
                                                    <td>{unit}</td>
                                                    <td>{items}</td>
                                                    <td>{amount}</td>
                                                    <td>{description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <aside className="boq-summary-panel">
                                <div className="boq-summary-card">
                                    <div className="boq-summary-row">
                                        <span>Subtotal</span>
                                        <strong>₹12,65,800</strong>
                                    </div>
                                    <div className="boq-summary-row">
                                        <span>Markup (18%)</span>
                                        <strong>₹2,27,844</strong>
                                    </div>
                                    <div className="boq-summary-row">
                                        <span>GST (18%)</span>
                                        <strong>₹2,68,855.92</strong>
                                    </div>
                                    <div className="boq-summary-row total">
                                        <span>Grand Total</span>
                                        <strong>₹17,62,499.92</strong>
                                    </div>
                                </div>

                                <div className="boq-summary-metric">
                                    <span>Rooms Covered</span>
                                    <strong>8</strong>
                                </div>
                                <div className="boq-summary-metric">
                                    <span>Items</span>
                                    <strong>580</strong>
                                </div>

                                <button type="button" className="fig-dashboard-new boq-submit-button">Generate Proposal</button>
                            </aside>
                        </div>
                    </section>
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
                                <p>25 templates</p>
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
                            {dossierTemplates.map((template) => (
                                <div key={template.name} className="boq-template-item">
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
                                            <span>{template.rooms} Rooms</span>
                                            <span>{template.items} Items</span>
                                            <span>{template.size}</span>
                                        </div>
                                        <div className="boq-template-tags">
                                            <span>{template.tag}</span>
                                            <span>{template.category}</span>
                                        </div>
                                    </div>
                                    <strong className="boq-template-price">{template.price}</strong>
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
                                    )) : <option value="mock">Create a Project first...</option>}
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
                                    <select defaultValue="Residential - 3BHK Standard">
                                        <option>Residential - 3BHK Standard</option>
                                        <option>Office Fit-Out - Corporate</option>
                                        <option>Modular Kitchen - L-Shape</option>
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
                                
                                if (!projId || projId === "mock") {
                                    alert("Please create a Project first!");
                                    return;
                                }
                                
                                try {
                                    const res = await fetch("/api/v1/boqs", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ boqNumber: "BOQ-" + Math.floor(Math.random() * 10000), projectId: projId, version, method: "blank" }),
                                        credentials: "include"
                                    });
                                    if (!res.ok) throw new Error("Failed to create BOQ");
                                    const data = await res.json();
                                    window.location.reload(); // Quick refresh
                                } catch (e) {
                                    alert("Could not create BOQ. Check console.");
                                    console.error(e);
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

    useEffect(() => {
        const loadDetail = async () => {
            setLoading(true);
            try {
                if (activeBoq.id.startsWith('mock-')) throw new Error('Mock ID');
                const res = await fetch(`/api/v1/boqs/${activeBoq.id}`, { credentials: 'include' });
                if (!res.ok) throw new Error('Failed');
                const data = await res.json();
                const actualRooms = data.data?.rooms;
                if (actualRooms && Array.isArray(actualRooms)) {
                    setRooms(actualRooms);
                } else {
                    setRooms([]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        void loadDetail();
    }, [activeBoq.id]);

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
                    <button type="button" className="boq-ghost-button" onClick={() => alert('Duplicate BOQ')}>Duplicate</button>
                    <button type="button" className="boq-ghost-button" onClick={() => alert('Exporting PDF...')}>Export PDF</button>
                    <button type="button" className="boq-ghost-button" onClick={() => alert('Sent for Review!')}>Send for Review</button>
                    <button type="button" className="fig-dashboard-new boq-save-button" onClick={() => alert('Saved Draft!')}>Save Draft</button>
                </div>
            </div>

            <div className="boq-detail-layout">
                <div className="boq-main-panel">
                    <div className="boq-panel-toolbar">
                        <label className="boq-search-field">
                            <Search size={15} />
                            <input placeholder="Search..." aria-label="Search rooms" />
                        </label>

                        <div className="boq-toolbar-right">
                            <button type="button" className="boq-ghost-button" onClick={() => alert('Importing Excel...')}>Import Excel</button>
                            <button type="button" className="boq-ghost-button" onClick={() => alert('Using Template...')}>Use Template</button>
                            <button type="button" className="fig-dashboard-new boq-add-room" onClick={() => alert('Added Room!')}>
                                <Plus size={18} />
                                <span>Add Room</span>
                            </button>
                        </div>
                    </div>

                    <div className="boq-table-card">
                        <div className="boq-table-heading">{rooms.length} Rooms</div>
                        <table className="boq-room-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Room</th>
                                    <th>Category</th>
                                    <th>Spec</th>
                                    <th>Unit</th>
                                    <th>Items</th>
                                    <th>Amount (?)</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} style={{textAlign: 'center', padding: '16px'}}>Loading rooms...</td></tr>
                                ) : rooms.length === 0 ? (
                                    <tr><td colSpan={8} style={{textAlign: 'center', padding: '16px'}}>No rooms found. Add a room to get started!</td></tr>
                                ) : rooms.map((room, idx) => (
                                    <tr key={room.id} onClick={() => alert(`Opened Room: ${room.name}`)} style={{ cursor: 'pointer' }}>
                                        <td>{idx + 1}</td>
                                        <td>{room.name}</td>
                                        <td>{room.categories?.length ?? '-'}</td>
                                        <td>{room.spec ?? '-'}</td>
                                        <td>{room.unit ?? '-'}</td>
                                        <td>{room.items?.length ?? 0}</td>
                                        <td>{room.totalValue != null ? '?' + room.totalValue.toLocaleString('en-IN') : '-'}</td>
                                        <td>{room.description ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <aside className="boq-summary-panel">
                    <div className="boq-summary-card">
                        <div className="boq-summary-row">
                            <span>Subtotal</span>
                            <strong>?{activeBoq.estimatedValue.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="boq-summary-row total">
                            <span>Grand Total</span>
                            <strong>?{activeBoq.estimatedValue.toLocaleString('en-IN')}</strong>
                        </div>
                    </div>

                    <div className="boq-summary-metric">
                        <span>Rooms Covered</span>
                        <strong>{rooms.length}</strong>
                    </div>
                    <div className="boq-summary-metric">
                        <span>Items</span>
                        <strong>{rooms.reduce((acc, r) => acc + (r.items?.length || 0), 0)}</strong>
                    </div>

                    <button type="button" className="fig-dashboard-new boq-submit-button" onClick={() => alert('Generating Proposal...')}>Generate Proposal</button>
                </aside>
            </div>
        </section>
    );
}