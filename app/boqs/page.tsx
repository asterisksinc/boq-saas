"use client";

import {
    ArrowLeft,
    ChevronLeft,
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
    Loader2,
    RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { getApiErrorMessage, parseApiResponse, getWorkspaceUsers, type WorkspaceUserItem } from "@/lib/api/auth";
import {
    mapBoqListItem,
    type BoqListItem,
    formatCompactCurrency,
    formatBoqDisplayDate,
} from "@/lib/domain/boq-data";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import BoqRowActionMenu from "@/components/boqs/BoqRowActionMenu";
import BoqStatusDropdown from "@/components/boqs/BoqStatusDropdown";
import BoqDetailsModal from "@/components/boqs/BoqDetailsModal";
import BoqTemplatesDrawer from "@/components/boqs/BoqTemplatesDrawer";
import BoqRoomCategoryView from "@/components/boqs/BoqRoomCategoryView";
import BoqEmptyIllustration from "@/components/boqs/BoqEmptyIllustration";
import BoqExcelImportModal from "@/components/boqs/BoqExcelImportModal";
import BoqDetailView from "@/components/boqs/BoqDetailView";
import "@/app/boq-redesign.css";

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
    const [projects, setProjects] = useState<{ id: string; name: string; assignedDesignerId?: string | null; clientName?: string | null }[]>([]);
    const [templates, setTemplates] = useState<{ id: string; name: string; description: string | null; tags: string[] | null; use_count: number }[]>([]);
    const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUserItem[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState("");

    // Form inputs for creation
    const [newBoqNumber, setNewBoqNumber] = useState("");
    const [selectedProjId, setSelectedProjId] = useState("");
    const [selectedVersion, setSelectedVersion] = useState("v1");

    // Pagination and Header stats
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [pendingApprovals, setPendingApprovals] = useState(0);
    const [showExcelImportModal, setShowExcelImportModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const sp = new URLSearchParams(window.location.search);
            const pId = sp.get("projectId");
            if (pId) {
                setSelectedProjId(pId);
            }
            const boqId = sp.get("id") || sp.get("boqId");
            if (boqId) {
                setSelectedBoqId(boqId);
                setScreen("detail");
            }
            if (sp.get("create") === "true" || sp.get("new") === "true") {
                setShowCreateModal(true);
            }
        }
    }, []);

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
                    const pIdFromUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("projectId") : null;
                    if (pIdFromUrl && items.some((p: { id: string }) => p.id === pIdFromUrl)) {
                        setSelectedProjId(pIdFromUrl);
                    } else if (items.length > 0 && !selectedProjId) {
                        setSelectedProjId(items[0].id);
                    }
                }
            } catch (e) { }
        };
        const loadTemplates = async () => {
            try {
                const res = await fetch("/api/v1/boq-templates?pageSize=50", { credentials: "include" });
                if (res.ok) {
                    const d = await res.json();
                    setTemplates(d.data?.items ?? []);
                }
            } catch (e) { }
        };
        const loadUsers = async () => {
            try {
                const res = await getWorkspaceUsers();
                if (res.items) {
                    setWorkspaceUsers(res.items);
                }
            } catch (e) { }
        };
        void loadProj();
        void loadTemplates();
        void loadUsers();

        const handleClick = () => {
            setOpenMenuId(null);
        };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    const loadBoqs = useCallback(async (query = searchQuery) => {
        try {
            setLoading(true);
            setError("");
            const searchParam = query ? `&search=${encodeURIComponent(query)}` : "";
            const response = await fetch(`/api/v1/boqs?page=${page}&pageSize=${pageSize}${searchParam}`, { credentials: "include" });
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

            // Client-side fallback search filter for project name & assignee
            const filtered = query
                ? mapped.filter(
                    (b) =>
                        b.boqNumber.toLowerCase().includes(query.toLowerCase()) ||
                        b.projectName.toLowerCase().includes(query.toLowerCase()) ||
                        b.assignedTo.toLowerCase().includes(query.toLowerCase()) ||
                        b.version.toLowerCase().includes(query.toLowerCase())
                )
                : mapped;

            setBoqRows(filtered);
            setTotal(query ? filtered.length : (result.total ?? mapped.length));
            if (typeof result.pendingApprovals === "number") {
                setPendingApprovals(result.pendingApprovals);
            } else {
                setPendingApprovals(mapped.filter((b) => b.status === "IN REVIEW").length);
            }
            const bIdFromUrl = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("id") || new URLSearchParams(window.location.search).get("boqId")) : null;
            if (bIdFromUrl && mapped.some((b) => b.id === bIdFromUrl)) {
                setSelectedBoqId(bIdFromUrl);
                setScreen("detail");
            } else {
                setSelectedBoqId((current) => current ?? mapped[0]?.id ?? null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load BOQs.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, projects, searchQuery]);

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        setPage(1);
    };

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
                <DashboardHeader title="BOQ" onSearch={handleSearch} onNew={() => setShowCreateModal(true)} />

                {screen === "list" ? (
                    <section className="boq-page-shell-redesign">
                        {/* Page Header Row (Frame 2147225066) */}
                        <div className="boq-header-row-redesign">
                            <div className="boq-title-section-redesign">
                                <h2 className="boq-main-title-redesign">Bill of Quantities</h2>
                                <p className="boq-summary-line-redesign">
                                    {total} {total === 1 ? "BOQ" : "BOQs"} | {pendingApprovals} pending approval
                                </p>
                            </div>
                            <div className="boq-toolbar-actions-redesign">
                                <button
                                    type="button"
                                    className="boq-btn-import-excel-redesign"
                                    onClick={() => setShowExcelImportModal(true)}
                                >
                                    Import Excel
                                </button>
                                <button
                                    type="button"
                                    className="boq-btn-new-boq-redesign"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                                    <span>New BOQ</span>
                                </button>
                            </div>
                        </div>

                        {error ? (
                            <div className="boq-alert-redesign">
                                <span>{error}</span>
                                <button
                                    type="button"
                                    onClick={() => void loadBoqs()}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#991B1B",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        textDecoration: "underline",
                                    }}
                                >
                                    Retry
                                </button>
                            </div>
                        ) : null}

                        {/* Main Content Surface (Frame 2147225067) */}
                        <div className="boq-content-surface-redesign">
                            {loading ? (
                                <div className="boq-state-feedback-card" style={{ minHeight: "360px" }}>
                                    <Loader2 size={32} className="animate-spin" color="#2563EB" />
                                    <span style={{ fontSize: "15px", color: "#64748B" }}>Loading Bill of Quantities...</span>
                                </div>
                            ) : boqRows.length === 0 ? (
                                searchQuery ? (
                                    /* Search No-Results State */
                                    <div className="boq-empty-container-redesign">
                                        <Search size={44} color="#94A3B8" />
                                        <div className="boq-empty-text-block-redesign">
                                            <h3 className="boq-empty-title-redesign">No matching BOQs found</h3>
                                            <p className="boq-empty-subtitle-redesign">
                                                No BOQs matched &ldquo;{searchQuery}&rdquo;. Try adjusting your keywords or clearing the search.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="boq-btn-import-excel-redesign"
                                            onClick={() => {
                                                setSearchQuery("");
                                                setPage(1);
                                            }}
                                        >
                                            Clear Search
                                        </button>
                                    </div>
                                ) : (
                                    /* Figma Empty State (Frame 2147225421 + Frame 2147225422) */
                                    <div className="boq-empty-container-redesign">
                                        <BoqEmptyIllustration />
                                        <div className="boq-empty-text-block-redesign">
                                            <h3 className="boq-empty-title-redesign">No BOQs found</h3>
                                            <p className="boq-empty-subtitle-redesign">
                                                Create your first BOQ to start managing your project quantities and estimates.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="boq-btn-new-boq-redesign"
                                            onClick={() => setShowCreateModal(true)}
                                        >
                                            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                                            <span>New BOQ</span>
                                        </button>
                                    </div>
                                )
                            ) : (
                                /* Populated State Table */
                                <div className="boq-table-responsive-wrap-redesign">
                                    <div className="boq-table-redesign">
                                        {/* Table Header Row (Frame 57) */}
                                        <div className="boq-th-row-redesign">
                                            <div className="boq-th-cell-redesign boq-col-id-w">BOQ ID</div>
                                            <div className="boq-th-cell-redesign boq-col-project-w">PROJECT</div>
                                            <div className="boq-th-cell-redesign boq-col-version-w">VERSION</div>
                                            <div className="boq-th-cell-redesign boq-col-rooms-w">ROOMS</div>
                                            <div className="boq-th-cell-redesign boq-col-items-w">ITEMS</div>
                                            <div className="boq-th-cell-redesign boq-col-value-w">ESTIMATED VALUE</div>
                                            <div className="boq-th-cell-redesign boq-col-assigned-w">ASSIGNED TO</div>
                                            <div className="boq-th-cell-redesign boq-col-date-w">DATE</div>
                                            <div className="boq-th-cell-redesign boq-col-status-w">STATUS</div>
                                            <div className="boq-th-cell-redesign boq-col-actions-w"></div>
                                        </div>

                                        {/* Table Rows (Frame 61) */}
                                        <div className="boq-tbody-redesign">
                                            {boqRows.map((boq, index) => {
                                                return (
                                                    <div
                                                        key={boq.id}
                                                        className="boq-tr-redesign"
                                                        onClick={() => openBoq(boq.id)}
                                                    >
                                                        <div className="boq-td-cell-redesign boq-col-id-w">
                                                            {boq.boqNumber}
                                                        </div>
                                                        <div
                                                            className="boq-td-cell-redesign boq-col-project-w project-name"
                                                            title={boq.projectName}
                                                        >
                                                            {boq.projectName}
                                                        </div>
                                                        <div className="boq-td-cell-redesign boq-col-version-w">
                                                            {boq.version}
                                                        </div>
                                                        <div className="boq-td-cell-redesign boq-col-rooms-w">
                                                            {boq.rooms}
                                                        </div>
                                                        <div className="boq-td-cell-redesign boq-col-items-w">
                                                            {boq.items}
                                                        </div>
                                                        <div className="boq-td-cell-redesign boq-col-value-w estimated-value">
                                                            {formatCompactCurrency(boq.estimatedValue)}
                                                        </div>
                                                        <div
                                                            className="boq-td-cell-redesign boq-col-assigned-w"
                                                            title={boq.assignedTo}
                                                        >
                                                            {boq.assignedTo}
                                                        </div>
                                                        <div className="boq-td-cell-redesign boq-col-date-w">
                                                            {formatBoqDisplayDate(boq.date)}
                                                        </div>
                                                        <div
                                                            className="boq-td-cell-redesign boq-col-status-w"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <BoqStatusDropdown
                                                                value={boq.status}
                                                                onChange={async (status) => {
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
                                                            />
                                                        </div>
                                                        <div
                                                            className="boq-td-cell-redesign boq-col-actions-w"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <BoqRowActionMenu
                                                                boqId={boq.id}
                                                                onOpenEditor={() => openBoq(boq.id)}
                                                                onDuplicate={async () => {
                                                                    try {
                                                                        const res = await fetch(`/api/v1/boqs/${boq.id}/duplicate`, {
                                                                            method: "POST",
                                                                            credentials: "include",
                                                                        });
                                                                        if (res.ok) {
                                                                            void loadBoqs();
                                                                        } else {
                                                                            const p = await res.json().catch(() => ({}));
                                                                            setError(getApiErrorMessage(p));
                                                                        }
                                                                    } catch {
                                                                        setError("Failed to duplicate BOQ");
                                                                    }
                                                                }}
                                                                onExportPdf={() => {
                                                                    window.open(`/api/v1/boqs/${boq.id}/pdf`, "_blank");
                                                                }}
                                                                onExportExcel={() => {
                                                                    window.open(`/api/v1/boqs/${boq.id}/excel`, "_blank");
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Pagination Footer Row (Frame 2147225166) */}
                                        <div className="boq-table-footer-row-redesign">
                                            <div className="boq-footer-total-label-redesign">
                                                Total: {total}
                                            </div>
                                            <div className="boq-pagination-controls-redesign">
                                                <button
                                                    type="button"
                                                    className="boq-page-btn-redesign"
                                                    disabled={page <= 1}
                                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                    aria-label="Previous page"
                                                >
                                                    <ChevronLeft size={18} color={page <= 1 ? "#94A3B8" : "#64748B"} />
                                                </button>
                                                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        className={`boq-page-btn-redesign ${page === p ? "active" : ""}`}
                                                        onClick={() => setPage(p)}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    className="boq-page-btn-redesign"
                                                    disabled={page >= totalPages}
                                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                                    aria-label="Next page"
                                                >
                                                    <ChevronRight size={18} color={page >= totalPages ? "#94A3B8" : "#0F172A"} />
                                                </button>
                                            </div>
                                            <div className="boq-page-size-wrap-redesign">
                                                <span className="boq-page-size-label-redesign">Show per Page:</span>
                                                <select
                                                    className="boq-page-size-select-redesign"
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
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                ) : activeBoq ? (
                    <div>
                        {/* {activeBoq.projectId && (
                            <a href={`/projects/${activeBoq.projectId}`} className="sr-only">
                                Back to Project
                            </a>
                        )} */}
                        <BoqDetail
                            activeBoq={activeBoq}
                            onBack={() => {
                                setScreen("list");
                                void loadBoqs();
                            }}
                        />
                    </div>
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

            {/* Sliding Templates Drawer matching Screenshot 2 */}
            <BoqTemplatesDrawer
                isOpen={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                templates={templates}
                onSelectTemplate={(templateId) => {
                    setSelectedTemplateId(templateId);
                    setShowTemplateModal(false);
                    setCreateMode("template");
                    setShowDetailsModal(true);
                }}
                onCreateNewTemplate={() => {
                    setShowTemplateModal(false);
                    setCreateMode("blank");
                    setShowDetailsModal(true);
                }}
            />

            {/* Redesigned BOQ Details Modal matching Screenshots 3 & 4 */}
            <BoqDetailsModal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                onBack={() => {
                    setShowDetailsModal(false);
                    if (createMode === "template") {
                        setShowTemplateModal(true);
                    } else {
                        setShowCreateModal(true);
                    }
                }}
                createMode={createMode || "blank"}
                projects={projects}
                templates={templates}
                workspaceUsers={workspaceUsers}
                initialProjectId={selectedProjId}
                initialTemplateId={selectedTemplateId}
                onSuccess={(newBoq) => {
                    setShowDetailsModal(false);
                    void loadBoqs();
                    if (newBoq?.id) {
                        openBoq(newBoq.id);
                    }
                }}
            />

            {/* Excel Import Modal for BOQs */}
            <BoqExcelImportModal
                isOpen={showExcelImportModal}
                onClose={() => setShowExcelImportModal(false)}
                projects={projects}
                onSuccess={() => {
                    void loadBoqs();
                }}
            />
        </main>
    );
}

function BoqDetail({ activeBoq, onBack }: { activeBoq: BoqListItem; onBack: () => void }) {
    return <BoqDetailView activeBoq={activeBoq} onBack={onBack} />;
}
