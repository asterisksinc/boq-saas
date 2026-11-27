"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Columns3, Folder, List, Mail, Phone, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import { LeadFormDrawer } from "@/components/leads/LeadDrawers";
import { EmptyState, Pagination, PersonCell, Pill, RowMenu, SelectInput, Toast, Avatar, downloadBlob } from "@/components/leads/LeadUi";
import {
    LEAD_SOURCES, LEAD_STAGES, deleteLead, exportLeads, importLeads, listLeadBoard, listLeadFormOptions, listLeads, updateLead,
    type Lead, type LeadFilters, type LeadStage,
} from "@/lib/api/leads";
import "./leads.css";

type View = "list" | "board";
const VIEW_KEY = "boq.leads.view";

function LeadsPageInner() {
    const router = useRouter();
    const params = useSearchParams();
    const [view, setView] = useState<View>("list");
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [filters, setFilters] = useState<{ stage: string; source: string; assignedTo: string }>({ stage: "", source: "", assignedTo: "" });
    const [filterOpen, setFilterOpen] = useState(false);
    const [members, setMembers] = useState<Array<{ value: string; label: string }>>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [items, setItems] = useState<Lead[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [drawer, setDrawer] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });
    const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
    const [busyAction, setBusyAction] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(VIEW_KEY);
            if (saved === "board" || saved === "list") setView(saved);
        } catch {
            // ignore unavailable storage
        }
        if (params.get("create") === "true") setDrawer({ open: true, lead: null });
        listLeadFormOptions().then(({ members: m }) => setMembers(m.map((x) => ({ value: x.id, label: x.name })))).catch(() => undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(search.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (!filterOpen) return;
        const close = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setFilterOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [filterOpen]);

    const query: LeadFilters = useMemo(() => ({ search: debounced, ...filters }), [debounced, filters]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (view === "board") {
                const result = await listLeadBoard(query);
                setItems(result.items);
                setTotal(result.total);
            } else {
                const result = await listLeads({ ...query, page, pageSize });
                setItems(result.items);
                setTotal(result.total);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Leads could not be loaded.");
        } finally {
            setLoading(false);
        }
    }, [view, query, page, pageSize]);

    useEffect(() => { void load(); }, [load]);

    const switchView = (next: View) => {
        setView(next);
        try { localStorage.setItem(VIEW_KEY, next); } catch { /* ignore */ }
    };

    const notify = (message: string, tone: "success" | "error" = "success") => setToast({ message, tone });

    const remove = async (lead: Lead) => {
        if (!window.confirm(`Delete lead "${lead.name}"? This removes it from the pipeline.`)) return;
        try {
            await deleteLead(lead.id);
            notify("Lead deleted.");
            void load();
        } catch (err) {
            notify(err instanceof Error ? err.message : "Lead could not be deleted.", "error");
        }
    };

    const doExport = async () => {
        setBusyAction("export");
        try {
            downloadBlob(await exportLeads(query), `leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
        } catch (err) {
            notify(err instanceof Error ? err.message : "Export failed.", "error");
        } finally {
            setBusyAction(null);
        }
    };

    const doImport = async (file: File | undefined) => {
        if (!file) return;
        setBusyAction("import");
        try {
            const result = await importLeads(file);
            const skipped = result.skipped ? ` ${result.skipped} skipped${result.errors[0] ? ` (row ${result.errors[0].row}: ${result.errors[0].message})` : ""}.` : "";
            notify(`Imported ${result.imported} lead${result.imported === 1 ? "" : "s"}.${skipped}`, result.imported ? "success" : "error");
            setPage(1);
            void load();
        } catch (err) {
            notify(err instanceof Error ? err.message : "Import failed.", "error");
        } finally {
            setBusyAction(null);
        }
    };

    /** Optimistic stage change from the board; reverts on failure. */
    const moveLead = async (leadId: string, stage: LeadStage, beforeId: string | null) => {
        const lead = items.find((l) => l.id === leadId);
        if (!lead) return;
        const column = items.filter((l) => l.stage === stage && l.id !== leadId).sort((a, b) => a.sortOrder - b.sortOrder);
        const index = beforeId ? column.findIndex((l) => l.id === beforeId) : column.length;
        const prev = column[index - 1]?.sortOrder;
        const next = column[index]?.sortOrder;
        const sortOrder = prev === undefined && next === undefined ? 0 : prev === undefined ? next! - 1 : next === undefined ? prev + 1 : (prev + next) / 2;
        if (lead.stage === stage && lead.sortOrder === sortOrder) return;
        const label = LEAD_STAGES.find((s) => s.value === stage)?.label ?? stage;
        const snapshot = items;
        setItems((list) => list.map((l) => (l.id === leadId ? { ...l, stage, stageLabel: label, sortOrder } : l)));
        try {
            await updateLead(leadId, lead.stage === stage ? { sortOrder } : { stage, sortOrder });
            if (lead.stage !== stage) notify(`${lead.name} moved to ${label}.`);
        } catch (err) {
            setItems(snapshot);
            notify(err instanceof Error ? err.message : "Lead could not be moved.", "error");
        }
    };

    const activeFilters = Object.values(filters).filter(Boolean).length;
    const openLead = (lead: Lead) => router.push(`/leads/${lead.id}`);
    const menuFor = (lead: Lead) => [
        { label: "View Lead", onSelect: () => openLead(lead) },
        { label: "Edit Lead", onSelect: () => setDrawer({ open: true, lead }) },
        { label: "Delete Lead", onSelect: () => remove(lead), danger: true },
    ];

    return (
        <main className="fig-dashboard leads-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/leads" />
            <div className="fig-dashboard-main">
                <DashboardHeader title="Leads" onNew={() => setDrawer({ open: true, lead: null })} />

                <section className="ld-head">
                    <div>
                        <h2>Leads</h2>
                        <p>Record, manage &amp; track your leads.</p>
                    </div>
                    <div className="ld-head-actions">
                        <button type="button" className="ld-btn" onClick={doExport} disabled={busyAction === "export"}>
                            {busyAction === "export" ? "Exporting…" : "Export Excel"}
                        </button>
                        <button type="button" className="ld-btn" onClick={() => fileInput.current?.click()} disabled={busyAction === "import"}>
                            {busyAction === "import" ? "Importing…" : "Import Excel"}
                        </button>
                        <input
                            ref={fileInput}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            hidden
                            onChange={(e) => {
                                void doImport(e.target.files?.[0]);
                                e.target.value = "";
                            }}
                        />
                        <button type="button" className="ld-btn ld-btn--primary" onClick={() => setDrawer({ open: true, lead: null })}>
                            <Plus size={18} /> New Lead
                        </button>
                    </div>
                </section>

                <section className="ld-toolbar">
                    <label className="ld-search">
                        <span className="ld-search-icon"><Search size={16} /></span>
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search lead by name, email, phone…"
                            aria-label="Search leads"
                        />
                        {search ? <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={14} /></button> : null}
                    </label>
                    <div className="ld-filter" ref={filterRef}>
                        <button type="button" className={`ld-btn ld-btn--filter${activeFilters ? " is-active" : ""}`} aria-expanded={filterOpen} onClick={() => setFilterOpen((v) => !v)}>
                            <SlidersHorizontal size={18} /> Filter{activeFilters ? ` (${activeFilters})` : ""}
                        </button>
                        {filterOpen ? (
                            <div className="ld-filter-pop" role="dialog" aria-label="Filter leads">
                                <label>
                                    <span>Stage</span>
                                    <SelectInput value={filters.stage} onChange={(v) => { setFilters((f) => ({ ...f, stage: v })); setPage(1); }} placeholder="All stages" options={LEAD_STAGES} />
                                </label>
                                <label>
                                    <span>Source</span>
                                    <SelectInput value={filters.source} onChange={(v) => { setFilters((f) => ({ ...f, source: v })); setPage(1); }} placeholder="All sources" options={LEAD_SOURCES} />
                                </label>
                                <label>
                                    <span>Assigned to</span>
                                    <SelectInput value={filters.assignedTo} onChange={(v) => { setFilters((f) => ({ ...f, assignedTo: v })); setPage(1); }} placeholder="Anyone" options={members} />
                                </label>
                                <button type="button" className="ld-link" onClick={() => { setFilters({ stage: "", source: "", assignedTo: "" }); setPage(1); }}>
                                    Clear filters
                                </button>
                            </div>
                        ) : null}
                    </div>
                    <div className="ld-view-toggle" role="group" aria-label="View">
                        <button type="button" className={view === "list" ? "is-current" : ""} aria-pressed={view === "list"} aria-label="List view" onClick={() => switchView("list")}>
                            <List size={20} />
                        </button>
                        <button type="button" className={view === "board" ? "is-current" : ""} aria-pressed={view === "board"} aria-label="Board view" onClick={() => switchView("board")}>
                            <Columns3 size={20} />
                        </button>
                    </div>
                </section>

                {error ? (
                    <div className="ld-error" role="alert">
                        <span>{error}</span>
                        <button type="button" className="ld-btn" onClick={() => void load()}>Retry</button>
                    </div>
                ) : view === "list" ? (
                    <LeadTable
                        items={items}
                        loading={loading}
                        total={total}
                        page={page}
                        pageSize={pageSize}
                        filtered={Boolean(debounced || activeFilters)}
                        onPage={setPage}
                        onPageSize={(n) => { setPageSize(n); setPage(1); }}
                        onOpen={openLead}
                        menuFor={menuFor}
                        onCreate={() => setDrawer({ open: true, lead: null })}
                    />
                ) : (
                    <LeadBoard items={items} loading={loading} onOpen={openLead} menuFor={menuFor} onMove={moveLead} />
                )}
            </div>

            <LeadFormDrawer
                open={drawer.open}
                lead={drawer.lead}
                onClose={() => setDrawer({ open: false, lead: null })}
                onSaved={(lead, created) => {
                    setDrawer({ open: false, lead: null });
                    notify(created ? `${lead.name} added to leads.` : "Lead updated.");
                    void load();
                }}
            />
            <Toast message={toast?.message ?? null} tone={toast?.tone} onDone={() => setToast(null)} />
        </main>
    );
}

function LeadTable({
    items, loading, total, page, pageSize, filtered, onPage, onPageSize, onOpen, menuFor, onCreate,
}: {
    items: Lead[]; loading: boolean; total: number; page: number; pageSize: number; filtered: boolean;
    onPage: (n: number) => void; onPageSize: (n: number) => void; onOpen: (lead: Lead) => void;
    menuFor: (lead: Lead) => Array<{ label: string; onSelect: () => void; danger?: boolean }>; onCreate: () => void;
}) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    useEffect(() => setSelected(new Set()), [items]);
    const allSelected = items.length > 0 && items.every((l) => selected.has(l.id));
    const toggle = (id: string) => setSelected((s) => {
        const next = new Set(s);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    return (
        <section className="ld-card ld-table-card">
            <div className="ld-table-scroll">
                <table className="ld-table">
                    <thead>
                        <tr>
                            <th className="ld-col-check">
                                <input type="checkbox" aria-label="Select all leads" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((l) => l.id)))} />
                            </th>
                            <th>Name</th>
                            <th>Linked Project</th>
                            <th>Stage</th>
                            <th>Source</th>
                            <th>Email</th>
                            <th>Assigned To</th>
                            <th>Contact</th>
                            <th aria-label="Actions" />
                        </tr>
                    </thead>
                    <tbody>
                        {loading && !items.length ? (
                            Array.from({ length: 5 }, (_, i) => (
                                <tr key={i} className="ld-skeleton-row"><td colSpan={9}><span /></td></tr>
                            ))
                        ) : items.length ? (
                            items.map((lead) => (
                                <tr key={lead.id} onClick={() => onOpen(lead)} className={loading ? "is-stale" : ""}>
                                    <td className="ld-col-check" onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" aria-label={`Select ${lead.name}`} checked={selected.has(lead.id)} onChange={() => toggle(lead.id)} />
                                    </td>
                                    <td>
                                        <span className="ld-two-line">
                                            <strong>{lead.name}</strong>
                                            <span>{lead.location || "—"}</span>
                                        </span>
                                    </td>
                                    <td>
                                        <span className="ld-two-line">
                                            <strong>{lead.project?.name ?? "—"}</strong>
                                            <span>{lead.project?.projectCode ?? ""}</span>
                                        </span>
                                    </td>
                                    <td><Pill tone="blue">{lead.stageLabel}</Pill></td>
                                    <td><Pill tone="blue">{lead.sourceLabel}</Pill></td>
                                    <td className="ld-strong">{lead.email || "—"}</td>
                                    <td><PersonCell name={lead.assignee?.name} role={lead.assignee?.role} src={lead.assignee?.avatarUrl} /></td>
                                    <td className="ld-muted">{lead.phone || "—"}</td>
                                    <td className="ld-col-menu"><RowMenu actions={menuFor(lead)} label={`Actions for ${lead.name}`} /></td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9}>
                                    <EmptyState
                                        title="No Leads found"
                                        text={filtered ? "Try a different search or clear the filters." : "Add your first lead or import them from Excel."}
                                        action={filtered ? undefined : <button type="button" className="tes-btn" onClick={onCreate}><Plus size={20} strokeWidth={2.5} /> New Lead</button>}
                                    />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {total > 0 ? <Pagination page={page} pageSize={pageSize} total={total} label="Total Leads" onPage={onPage} onPageSize={onPageSize} /> : null}
        </section>
    );
}

function LeadBoard({
    items, loading, onOpen, menuFor, onMove,
}: {
    items: Lead[]; loading: boolean; onOpen: (lead: Lead) => void;
    menuFor: (lead: Lead) => Array<{ label: string; onSelect: () => void; danger?: boolean }>;
    onMove: (leadId: string, stage: LeadStage, beforeId: string | null) => void;
}) {
    const [dragId, setDragId] = useState<string | null>(null);
    const [over, setOver] = useState<{ stage: string; beforeId: string | null } | null>(null);
    const columns = useMemo(() => LEAD_STAGES.map((stage) => ({
        ...stage,
        leads: items.filter((l) => l.stage === stage.value).sort((a, b) => a.sortOrder - b.sortOrder),
    })), [items]);

    const drop = (stage: LeadStage) => {
        if (dragId) onMove(dragId, stage, over?.stage === stage ? over.beforeId : null);
        setDragId(null);
        setOver(null);
    };

    return (
        <section className="ld-board" aria-label="Leads board" aria-busy={loading}>
            {columns.map((column) => (
                <div
                    key={column.value}
                    className={`ld-column${over?.stage === column.value ? " is-over" : ""}`}
                    onDragOver={(e) => {
                        if (!dragId) return;
                        e.preventDefault();
                        if (over?.stage !== column.value) setOver({ stage: column.value, beforeId: null });
                    }}
                    onDrop={(e) => { e.preventDefault(); drop(column.value); }}
                >
                    <header className="ld-column-head">
                        <h3>{column.label}</h3>
                        <Pill tone="gray">{column.leads.length}</Pill>
                    </header>
                    <div className="ld-column-body">
                        {column.leads.map((lead) => (
                            <article
                                key={lead.id}
                                className={`ld-lead-card${dragId === lead.id ? " is-dragging" : ""}${over?.beforeId === lead.id ? " is-drop-before" : ""}`}
                                draggable
                                tabIndex={0}
                                aria-label={`${lead.name}, ${column.label}`}
                                onDragStart={(e) => { setDragId(lead.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", lead.id); }}
                                onDragEnd={() => { setDragId(null); setOver(null); }}
                                onDragOver={(e) => {
                                    if (!dragId || dragId === lead.id) return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (over?.beforeId !== lead.id) setOver({ stage: column.value, beforeId: lead.id });
                                }}
                                onClick={() => onOpen(lead)}
                                onKeyDown={(e) => e.key === "Enter" && onOpen(lead)}
                            >
                                <div className="ld-lead-card-project">
                                    <span className="ld-lead-card-icon"><Folder size={16} /></span>
                                    <span className="ld-two-line ld-two-line--small">
                                        <strong>{lead.project?.name ?? "No project"}</strong>
                                        <span>{lead.project?.projectCode ?? ""}</span>
                                    </span>
                                    <RowMenu actions={menuFor(lead)} label={`Actions for ${lead.name}`} />
                                </div>
                                <div className="ld-lead-card-person">
                                    <span className="ld-two-line">
                                        <strong>{lead.name}</strong>
                                        <span className="ld-small">{lead.location || "—"}</span>
                                    </span>
                                    <span className="ld-lead-card-source">
                                        <span>Source</span>
                                        <Pill tone="blue">{lead.sourceLabel}</Pill>
                                    </span>
                                </div>
                                <div className="ld-lead-card-contact">
                                    <span><Mail size={14} /> {lead.email || "—"}</span>
                                    <span><Phone size={14} /> {lead.phone || "—"}</span>
                                </div>
                                <div className="ld-lead-card-owner">
                                    {lead.assignee ? (
                                        <>
                                            <Avatar name={lead.assignee.name} src={lead.assignee.avatarUrl} size={28} />
                                            <span className="ld-two-line ld-two-line--small">
                                                <strong>{lead.assignee.name}</strong>
                                                <span>{lead.assignee.role ?? ""}</span>
                                            </span>
                                        </>
                                    ) : (
                                        <span className="ld-muted ld-small">Unassigned</span>
                                    )}
                                </div>
                            </article>
                        ))}
                        {!column.leads.length && !loading ? <p className="ld-column-empty">Drop leads here</p> : null}
                    </div>
                </div>
            ))}
        </section>
    );
}

export default function LeadsPage() {
    return (
        <Suspense fallback={null}>
            <LeadsPageInner />
        </Suspense>
    );
}

