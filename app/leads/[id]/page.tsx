"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
    BadgeCheck, Calculator, ChevronDown, Download, ExternalLink, FileText, Folder, Image as ImageIcon, ListChecks, Mail, MapPin,
    MoreHorizontal, NotebookPen, Pencil, Phone, Plus, Receipt, Search, StickyNote, Trash2, User,
} from "lucide-react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import { CallLogDrawer, LeadFormDrawer, NoteDrawer } from "@/components/leads/LeadDrawers";
import { Avatar, EmptyState, Pagination, Pill, RowMenu, Toast, humanize, stageTone, statusTone } from "@/components/leads/LeadUi";
import {
    CALL_STATUSES, NOTE_TYPES, deleteLead, deleteLeadCallLog, deleteLeadNote, formatCompactMoney, formatDate, formatMoney,
    getLead, listLeadCallLogs, listLeadFormOptions, listLeadNotes, listLeadRelated, updateLead,
    type LeadCallLog, type LeadPerson, type LeadDetail, type LeadNote, type LeadRelatedTab,
} from "@/lib/api/leads";
import { loadMoodBoards, type MoodBoard } from "@/lib/mood-boards";
import "../leads.css";

const TABS = [
    { key: "projects", label: "Projects", icon: Folder, title: "Projects", text: "All projects linked with this lead.", action: "Create Project", href: "/projects?create=true" },
    { key: "boqs", label: "BOQs", icon: Calculator, title: "BOQs", text: "Bills of quantities across this lead's projects.", action: "Create BOQ", href: "/boqs?create=true" },
    { key: "proposals", label: "Proposals", icon: FileText, title: "Proposals", text: "Proposals shared with this lead.", action: "Create Proposal", href: "/proposals?create=true" },
    { key: "invoices", label: "Invoices", icon: Receipt, title: "Invoices", text: "Invoices raised for this lead's projects.", action: "Create Invoice", href: "/invoices?create=true" },
    { key: "moodboards", label: "Moodboards", icon: ImageIcon, title: "Moodboards", text: "Moodboards for this lead and its projects.", action: "Create Moodboard", href: "/mood-boards" },
    { key: "tasks", label: "Tasks", icon: ListChecks, title: "Tasks", text: "Tasks on this lead's projects.", action: "Create Task", href: "/activities?tab=tasks&create=true" },
    { key: "approvals", label: "Approvals", icon: BadgeCheck, title: "Approvals", text: "Approvals requested on this lead's projects.", action: "Request Approval", href: "/activities?tab=approvals&create=true" },
    { key: "call-logs", label: "Call Logs", icon: Phone, title: "Call Logs", text: "Every call made with this lead.", action: "New Call Log", href: null },
    { key: "notes", label: "Notes", icon: NotebookPen, title: "Notes", text: "Meeting notes, follow-ups and decisions.", action: "New Note", href: null },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const NOTE_TONES: Record<string, "blue" | "amber" | "green" | "gray" | "purple"> = {
    boq: "blue", invoice: "amber", project: "green", meeting: "purple", follow_up: "gray", general: "gray",
};

type Row = Record<string, any>;

export default function LeadDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [lead, setLead] = useState<LeadDetail | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [tab, setTab] = useState<TabKey>("projects");
    const [rows, setRows] = useState<Row[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [tabLoading, setTabLoading] = useState(true);
    const [tabError, setTabError] = useState<string | null>(null);
    const [moodBoards, setMoodBoards] = useState<MoodBoard[]>([]);
    const [editOpen, setEditOpen] = useState(false);
    const [callLog, setCallLog] = useState<{ open: boolean; log: LeadCallLog | null }>({ open: false, log: null });
    const [note, setNote] = useState<{ open: boolean; note: LeadNote | null }>({ open: false, note: null });
    const [entryOpen, setEntryOpen] = useState(false);
    const [counts, setCounts] = useState<Partial<Record<TabKey, number>>>({});
    const [query, setQuery] = useState("");
    const [members, setMembers] = useState<LeadPerson[]>([]);
    const [assigning, setAssigning] = useState(false);
    const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
    const entryRef = useRef<HTMLDivElement>(null);

    const notify = (message: string, tone: "success" | "error" = "success") => setToast({ message, tone });

    const loadLead = useCallback(async () => {
        try {
            setLead(await getLead(id));
            setLoadError(null);
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : "Lead could not be loaded.");
        }
    }, [id]);

    useEffect(() => { void loadLead(); }, [loadLead]);

    // Mood boards live in browser storage; match them by lead or by any of the lead's projects.
    useEffect(() => {
        if (!lead) return;
        try {
            const projectIds = new Set(lead.projectIds);
            setMoodBoards(loadMoodBoards().filter((b) => String(b.status).toLowerCase() !== "archived" && (b.leadId === lead.id || projectIds.has(b.projectId))));
        } catch {
            setMoodBoards([]);
        }
    }, [lead]);

    // Each load gets a token; responses from a tab the user has already left are ignored.
    const tabRequest = useRef(0);
    const loadTab = useCallback(async () => {
        const token = ++tabRequest.current;
        if (tab === "moodboards") { setTabLoading(false); return; }
        setTabLoading(true);
        setTabError(null);
        try {
            const result = tab === "call-logs"
                ? await listLeadCallLogs(id, page, pageSize)
                : tab === "notes"
                    ? await listLeadNotes(id, page, pageSize)
                    : await listLeadRelated<Row>(id, tab as LeadRelatedTab, page, pageSize);
            if (token !== tabRequest.current) return;
            setRows(result.items as Row[]);
            setTotal(result.total);
        } catch (err) {
            if (token !== tabRequest.current) return;
            setTabError(err instanceof Error ? err.message : "Records could not be loaded.");
        } finally {
            if (token === tabRequest.current) setTabLoading(false);
        }
    }, [id, tab, page, pageSize]);

    useEffect(() => { void loadTab(); }, [loadTab]);

    // Record counts for the stat cards and tab labels.
    const loadCounts = useCallback(async () => {
        const keys = TABS.map((t) => t.key).filter((k) => k !== "moodboards");
        const totals = await Promise.all(keys.map((key) => {
            const req = key === "call-logs" ? listLeadCallLogs(id, 1, 1) : key === "notes" ? listLeadNotes(id, 1, 1) : listLeadRelated(id, key as LeadRelatedTab, 1, 1);
            return req.then((r) => r.total).catch(() => 0);
        }));
        setCounts(Object.fromEntries(keys.map((k, i) => [k, totals[i]])));
    }, [id]);

    useEffect(() => { void loadCounts(); }, [loadCounts]);

    useEffect(() => {
        listLeadFormOptions()
            .then(({ members: list }) => setMembers(list.map((m) => ({ id: m.id, name: m.name, role: m.role ?? null, avatarUrl: m.avatarUrl ?? null }))))
            .catch(() => setMembers([]));
    }, []);

    const assign = async (memberId: string) => {
        if (!lead) return;
        setAssigning(true);
        try {
            await updateLead(lead.id, { assignedTo: memberId || null });
            notify(memberId ? "Lead assigned." : "Lead unassigned.");
            await loadLead();
        } catch (err) {
            notify(err instanceof Error ? err.message : "Lead could not be assigned.", "error");
        } finally {
            setAssigning(false);
        }
    };

    useEffect(() => {
        if (!entryOpen) return;
        const close = (event: MouseEvent) => {
            if (entryRef.current && !entryRef.current.contains(event.target as Node)) setEntryOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [entryOpen]);

    const switchTab = (key: TabKey) => {
        setTab(key);
        setPage(1);
        setRows([]);
        setQuery("");
    };

    const exportLead = () => {
        if (!lead) return;
        const book = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
            ["Lead ID", lead.leadCode], ["Name", lead.name], ["Email", lead.email ?? ""], ["Phone", lead.phone ?? ""],
            ["Location", lead.location ?? ""], ["Stage", lead.stageLabel], ["Source", lead.sourceLabel],
            ["Linked Project", lead.project?.name ?? ""], ["Assigned To", lead.assignee?.name ?? ""],
            ["Last Contacted", lead.lastContactedAt ? formatDate(lead.lastContactedAt) : ""], ["Created", formatDate(lead.createdAt)],
            [], ["Projects", lead.stats.projects], ["BOQ Value", lead.stats.boqValue],
            ["Invoices Paid", `${lead.stats.invoicesPaid} of ${lead.stats.invoicesTotal}`], ["Outstanding Amount", lead.stats.outstandingAmount],
        ]), "Lead");
        XLSX.writeFile(book, `${lead.leadCode}.xlsx`);
    };

    const removeLead = async () => {
        if (!lead || !window.confirm(`Delete lead "${lead.name}"?`)) return;
        try {
            await deleteLead(lead.id);
            router.push("/leads");
        } catch (err) {
            notify(err instanceof Error ? err.message : "Lead could not be deleted.", "error");
        }
    };

    const removeCallLog = async (log: LeadCallLog) => {
        if (!window.confirm(`Delete call log "${log.title}"?`)) return;
        try {
            await deleteLeadCallLog(id, log.id);
            notify("Call log deleted.");
            void loadTab();
            void loadCounts();
        } catch (err) {
            notify(err instanceof Error ? err.message : "Call log could not be deleted.", "error");
        }
    };

    const removeNote = async (item: LeadNote) => {
        if (!window.confirm(`Delete note "${item.title}"?`)) return;
        try {
            await deleteLeadNote(id, item.id);
            notify("Note deleted.");
            void loadTab();
            void loadCounts();
        } catch (err) {
            notify(err instanceof Error ? err.message : "Note could not be deleted.", "error");
        }
    };

    const currency = lead?.stats.currency ?? "INR";
    const countOf = (key: TabKey) => (key === "moodboards" ? moodBoards.length : counts[key]);
    const tabMeta = TABS.find((t) => t.key === tab)!;
    const q = query.trim().toLowerCase();
    const visibleRows = q ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q)) : rows;
    const visibleBoards = q ? moodBoards.filter((b) => `${b.name} ${b.projectName ?? ""}`.toLowerCase().includes(q)) : moodBoards;
    const phoneDigits = lead?.phone?.replace(/\D/g, "") ?? "";
    const whatsappNumber = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;

    const runTabAction = () => {
        if (tab === "call-logs") setCallLog({ open: true, log: null });
        else if (tab === "notes") setNote({ open: true, note: null });
        else if (tabMeta.href) router.push(tabMeta.href);
    };

    if (loadError) {
        return (
            <Shell>
                <div className="ld-error" role="alert">
                    <span>{loadError}</span>
                    <button type="button" className="ld-btn" onClick={() => router.push("/leads")}>Back to Leads</button>
                </div>
            </Shell>
        );
    }

    return (
        <Shell>
            <nav className="ld-breadcrumb" aria-label="Breadcrumb">
                <button type="button" onClick={() => router.push("/leads")}>Leads</button>
                <span aria-hidden="true">/</span>
                <button type="button" onClick={() => router.push("/leads")}>All Leads</button>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{lead?.leadCode.toUpperCase() ?? "…"}</span>
            </nav>

            <section className="ld-card ld-profile">
                <div className="ld-profile-identity">
                    <span className="ld-profile-avatar">
                        {lead?.avatarUrl ? <img src={lead.avatarUrl} alt="" /> : initialsOf(lead?.name)}
                    </span>
                    <div className="ld-profile-text">
                        <h2>{lead?.name ?? "Loading…"}</h2>
                        <p>{lead ? `${lead.leadCode.toUpperCase()} · Created ${formatDate(lead.createdAt)}` : ""}</p>
                        {lead ? (
                            <div className="ld-profile-tags">
                                <Pill tone={stageTone(lead.stage)}>{lead.stage === "new" ? "New Lead" : lead.stageLabel}</Pill>
                                <Pill tone="blue">{lead.sourceLabel}</Pill>
                            </div>
                        ) : null}
                    </div>
                </div>
                <div className="ld-profile-actions">
                    <a className={`ld-btn ld-btn--outline${lead?.phone ? "" : " is-disabled"}`} href={lead?.phone ? `tel:${lead.phone}` : undefined} aria-disabled={!lead?.phone}>
                        <Phone size={18} className="ld-icon-blue" /> Call
                    </a>
                    <a className={`ld-btn ld-btn--outline${lead?.email ? "" : " is-disabled"}`} href={lead?.email ? `mailto:${lead.email}` : undefined} aria-disabled={!lead?.email}>
                        <Mail size={18} /> Email
                    </a>
                    <a
                        className={`ld-btn ld-btn--outline${whatsappNumber ? "" : " is-disabled"}`}
                        href={whatsappNumber ? `https://wa.me/${whatsappNumber}` : undefined}
                        target="_blank"
                        rel="noreferrer"
                        aria-disabled={!whatsappNumber}
                    >
                        <WhatsAppIcon /> WhatsApp
                    </a>
                    <button type="button" className="ld-btn ld-btn--outline" onClick={() => setEditOpen(true)} disabled={!lead}>
                        <Pencil size={17} /> Edit Lead
                    </button>
                    <div className="ld-entry" ref={entryRef}>
                        <button type="button" className="ld-btn ld-btn--outline ld-btn--icon" aria-label="More actions" aria-haspopup="menu" aria-expanded={entryOpen} onClick={() => setEntryOpen((v) => !v)} disabled={!lead}>
                            <MoreHorizontal size={20} />
                        </button>
                        {entryOpen ? (
                            <div className="ld-pop-menu" role="menu">
                                <button type="button" role="menuitem" onClick={() => { setEntryOpen(false); setCallLog({ open: true, log: null }); }}>
                                    <Phone size={20} /> New Call Log
                                </button>
                                <button type="button" role="menuitem" onClick={() => { setEntryOpen(false); setNote({ open: true, note: null }); }}>
                                    <StickyNote size={20} /> New Note
                                </button>
                                <button type="button" role="menuitem" onClick={() => { setEntryOpen(false); exportLead(); }}>
                                    <Download size={20} /> Export Lead
                                </button>
                                <button type="button" role="menuitem" className="is-danger" onClick={() => { setEntryOpen(false); void removeLead(); }}>
                                    <Trash2 size={20} /> Delete Lead
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>

            <section className="ld-stats" aria-label="Lead summary">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    const value = lead ? countOf(t.key) : undefined;
                    return (
                        <button key={t.key} type="button" className={`ld-stat${tab === t.key ? " is-current" : ""}`} onClick={() => switchTab(t.key)}>
                            <Icon size={24} strokeWidth={1.6} className="ld-stat-icon" />
                            <span className="ld-stat-text">
                                <span>{t.label}</span>
                                <strong>{value == null ? "—" : String(value).padStart(2, "0")}</strong>
                            </span>
                        </button>
                    );
                })}
            </section>

            <div className="ld-detail-body">
                <aside className="ld-card ld-info">
                    <header className="ld-info-head">
                        <h3>Lead Information</h3>
                        <button type="button" className="ld-icon-btn" aria-label="Edit lead information" onClick={() => setEditOpen(true)} disabled={!lead}>
                            <Pencil size={20} />
                        </button>
                    </header>
                    {lead ? (
                        <dl>
                            <InfoRow icon={<User size={20} />} label="Name" value={lead.name} />
                            <InfoRow icon={<Mail size={20} />} label="Email" value={lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : null} />
                            <InfoRow icon={<Phone size={20} />} label="Phone" value={lead.phone ? <a href={`tel:${lead.phone}`}>{lead.phone}</a> : null} />
                            <InfoRow icon={<MapPin size={20} />} label="Location" value={lead.location} />
                            <hr />
                            <InfoRow
                                icon={<Folder size={20} />}
                                label="Linked Project"
                                value={lead.project ? (
                                    lead.project.id ? (
                                        <button type="button" className="ld-link" onClick={() => router.push(`/projects/${lead.project!.id}`)}>
                                            {lead.project.name} <ExternalLink size={18} />
                                        </button>
                                    ) : (
                                        <span>{lead.project.name}</span>
                                    )
                                ) : null}
                            />
                            <InfoRow
                                icon={<User size={20} />}
                                label="Assign to"
                                value={
                                    <span className="ld-assign">
                                        {lead.assignee ? <Avatar name={lead.assignee.name} src={lead.assignee.avatarUrl} size={28} /> : <User size={18} className="ld-assign-empty" />}
                                        <select
                                            aria-label="Assign to"
                                            value={lead.assignedTo ?? ""}
                                            disabled={assigning}
                                            onChange={(e) => void assign(e.target.value)}
                                        >
                                            <option value="">Unassigned</option>
                                            {lead.assignee && !members.some((m) => m.id === lead.assignedTo) ? (
                                                <option value={lead.assignedTo ?? ""}>{lead.assignee.name}</option>
                                            ) : null}
                                            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                        <ChevronDown size={18} aria-hidden="true" />
                                    </span>
                                }
                            />
                        </dl>
                    ) : (
                        <div className="ld-info-skeleton"><span /><span /><span /><span /></div>
                    )}
                </aside>

                <section className="ld-card ld-tabs-card">
                    <div className="ld-tabs" role="tablist" aria-label="Lead records">
                        {TABS.map((t) => {
                            const count = countOf(t.key);
                            return (
                                <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? "is-current" : ""} onClick={() => switchTab(t.key)}>
                                    {t.label}{count != null ? ` (${count})` : ""}
                                </button>
                            );
                        })}
                    </div>

                    <div className="ld-tab-head">
                        <div>
                            <h3>{tabMeta.title}</h3>
                            <p>{tabMeta.text}</p>
                        </div>
                        <div className="ld-tab-tools">
                            <label className="ld-tab-search">
                                <Search size={20} aria-hidden="true" />
                                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${tabMeta.label.toLowerCase()}...`} aria-label={`Search ${tabMeta.label.toLowerCase()}`} />
                            </label>
                            <button type="button" className="ld-btn ld-btn--primary" onClick={runTabAction} disabled={!lead}>
                                <Plus size={18} /> {tabMeta.action}
                            </button>
                        </div>
                    </div>

                    {tabError ? (
                        <div className="ld-error" role="alert">
                            <span>{tabError}</span>
                            <button type="button" className="ld-btn" onClick={() => void loadTab()}>Retry</button>
                        </div>
                    ) : tab === "moodboards" ? (
                        <MoodBoardList boards={visibleBoards} onOpen={(boardId) => router.push(`/mood-boards/${boardId}`)} />
                    ) : tab === "notes" ? (
                        <NotesGrid
                            notes={visibleRows as LeadNote[]}
                            loading={tabLoading}
                            onOpen={(n) => setNote({ open: true, note: n })}
                            onDelete={removeNote}
                            onCreate={() => setNote({ open: true, note: null })}
                        />
                    ) : (
                        <RecordsTable
                            tab={tab}
                            rows={visibleRows}
                            loading={tabLoading}
                            currency={currency}
                            onOpen={(row) => {
                                if (tab === "call-logs") setCallLog({ open: true, log: row as LeadCallLog });
                                else if (tab === "projects") router.push(`/projects/${row.id}`);
                                else if (tab === "boqs") router.push(`/boqs?boq=${row.id}`);
                                else if (tab === "proposals") router.push(`/proposals?proposal=${row.id}`);
                                else if (tab === "invoices") router.push(`/invoices?invoice=${row.id}`);
                                else router.push(`/activities?tab=${tab}`);
                            }}
                            onDeleteCallLog={removeCallLog}
                            onCreateCallLog={() => setCallLog({ open: true, log: null })}
                        />
                    )}

                    {tab !== "moodboards" && !tabError && total > 0 ? (
                        <Pagination
                            page={page}
                            pageSize={pageSize}
                            total={total}
                            label={`Total ${tabMeta.label}`}
                            onPage={setPage}
                            onPageSize={(n) => { setPageSize(n); setPage(1); }}
                        />
                    ) : null}
                </section>
            </div>

            {lead ? (
                <>
                    <LeadFormDrawer
                        open={editOpen}
                        lead={lead}
                        onClose={() => setEditOpen(false)}
                        onSaved={() => { setEditOpen(false); notify("Lead updated."); void loadLead(); void loadTab(); }}
                    />
                    <CallLogDrawer
                        open={callLog.open}
                        leadId={lead.id}
                        log={callLog.log}
                        onClose={() => setCallLog({ open: false, log: null })}
                        onSaved={() => {
                            const created = !callLog.log;
                            setCallLog({ open: false, log: null });
                            notify(created ? "Call log added." : "Call log updated.");
                            void loadLead();
                            void loadCounts();
                            if (tab === "call-logs") void loadTab(); else switchTab("call-logs");
                        }}
                    />
                    <NoteDrawer
                        open={note.open}
                        leadId={lead.id}
                        note={note.note}
                        onClose={() => setNote({ open: false, note: null })}
                        onSaved={() => {
                            const created = !note.note;
                            setNote({ open: false, note: null });
                            notify(created ? "Note added." : "Note updated.");
                            void loadCounts();
                            if (tab === "notes") void loadTab(); else switchTab("notes");
                        }}
                    />
                </>
            ) : null}
            <Toast message={toast?.message ?? null} tone={toast?.tone} onDone={() => setToast(null)} />
        </Shell>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <main className="fig-dashboard leads-page">
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/leads" />
            <div className="fig-dashboard-main">
                <DashboardHeader title="Leads" onNew={undefined} />
                {children}
            </div>
        </main>
    );
}

function initialsOf(name: string | null | undefined) {
    const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div className="ld-info-row">
            <dt><span className="ld-info-icon" aria-hidden="true">{icon}</span>{label}</dt>
            <dd>{value ?? <span className="ld-muted">—</span>}</dd>
        </div>
    );
}

function WhatsAppIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#25D366" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z" />
            <path fill="#fff" d="M17.3 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1a7.6 7.6 0 0 1-3.8-3.3c-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.4 13.4 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.8a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.3Z" />
        </svg>
    );
}

function RecordsTable({
    tab, rows, loading, currency, onOpen, onDeleteCallLog, onCreateCallLog,
}: {
    tab: TabKey; rows: Row[]; loading: boolean; currency: string; onOpen: (row: Row) => void;
    onDeleteCallLog: (log: LeadCallLog) => void; onCreateCallLog: () => void;
}) {
    const columns = useMemo<Array<{ label: string; render: (row: Row) => React.ReactNode }>>(() => {
        const project = (row: Row) => row.projectName ?? "—";
        switch (tab) {
            case "projects":
                return [
                    {
                        label: "Project",
                        render: (r) => (
                            <span className="ld-project-cell">
                                <span className="ld-project-thumb">{r.imageUrl ? <img src={r.imageUrl} alt="" /> : <Folder size={20} />}</span>
                                <span className="ld-two-line">
                                    <strong>{r.name}</strong>
                                    <span className="ld-small">{[r.projectCode, r.areaSqft ? `${Number(r.areaSqft).toLocaleString("en-IN")} sqft` : null].filter(Boolean).join(" · ")}</span>
                                </span>
                            </span>
                        ),
                    },
                    { label: "Type", render: (r) => <span className="ld-muted">{r.projectType ?? "—"}</span> },
                    { label: "Stage", render: (r) => (r.stage ? <Pill tone="gray">{humanize(r.stage)}</Pill> : <span className="ld-muted">—</span>) },
                    { label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{humanize(r.status).toUpperCase()}</Pill> },
                    { label: "BOQ Value", render: (r) => <strong className="ld-strong">{formatCompactMoney(Number(r.boqValue ?? 0), currency)}</strong> },
                    {
                        label: "Owner",
                        render: (r) => (r.designer ? (
                            <span className="ld-person"><Avatar name={r.designer} size={32} /><span className="ld-person-name">{r.designer}</span></span>
                        ) : <span className="ld-muted">—</span>),
                    },
                    { label: "Updated", render: (r) => <span className="ld-muted ld-nowrap">{formatDate(r.updatedAt ?? r.dueDate)}</span> },
                ];
            case "boqs":
                return [
                    { label: "BOQ", render: (r) => <strong className="ld-strong">{r.code}</strong> },
                    { label: "Version", render: (r) => <span className="ld-muted">{r.version}</span> },
                    { label: "Project", render: project },
                    { label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{humanize(r.status)}</Pill> },
                    { label: "Updated", render: (r) => <span className="ld-muted">{formatDate(r.updatedAt)}</span> },
                ];
            case "proposals":
                return [
                    { label: "Proposal", render: (r) => <strong className="ld-strong">{r.code}</strong> },
                    { label: "Project", render: project },
                    { label: "Value", render: (r) => formatMoney(Number(r.value ?? 0), r.currency ?? currency) },
                    { label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{humanize(r.status)}</Pill> },
                    { label: "Expiry", render: (r) => <span className="ld-muted">{formatDate(r.expiryDate)}</span> },
                ];
            case "invoices":
                return [
                    { label: "Invoice", render: (r) => <strong className="ld-strong">{r.code}</strong> },
                    { label: "Project", render: project },
                    { label: "Total", render: (r) => formatMoney(Number(r.total ?? 0), r.currency ?? currency) },
                    { label: "Paid", render: (r) => <span className="ld-muted">{formatMoney(Number(r.paid ?? 0), r.currency ?? currency)}</span> },
                    { label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{humanize(r.status)}</Pill> },
                    { label: "Due Date", render: (r) => <span className="ld-muted">{formatDate(r.dueDate)}</span> },
                ];
            case "tasks":
            case "approvals":
                return [
                    { label: tab === "tasks" ? "Task" : "Approval", render: (r) => <strong className="ld-strong">{r.name}</strong> },
                    { label: "Project", render: project },
                    { label: tab === "tasks" ? "Assignee" : "Approver", render: (r) => <span className="ld-muted">{r.person ?? "—"}</span> },
                    ...(tab === "tasks" ? [{ label: "Priority", render: (r: Row) => <Pill tone={r.priority === "high" || r.priority === "critical" ? "red" : "gray"}>{humanize(r.priority)}</Pill> }] : []),
                    { label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{humanize(r.status)}</Pill> },
                    { label: "Due Date", render: (r) => <span className="ld-muted">{formatDate(r.dueDate)}</span> },
                ];
            case "call-logs":
                return [
                    { label: "Call Purpose", render: (r) => <strong className="ld-strong">{r.title}</strong> },
                    { label: "Type", render: (r) => <span className="ld-muted">{r.callType === "inbound" ? "In-Bound" : "Out-Bound"}</span> },
                    { label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{CALL_STATUSES.find((s) => s.value === r.status)?.label ?? humanize(r.status)}</Pill> },
                    { label: "Duration", render: (r) => <span className="ld-muted">{r.durationMinutes != null ? `${r.durationMinutes} Minutes` : "—"}</span> },
                    { label: "Created On", render: (r) => <strong className="ld-strong">{formatDate(r.calledAt)}</strong> },
                ];
            default:
                return [];
        }
    }, [tab, currency]);

    const isCallLogs = tab === "call-logs";
    const hasMenu = isCallLogs || tab === "projects";
    const emptyLabel = TABS.find((t) => t.key === tab)?.label.toLowerCase() ?? "records";

    return (
        <div className="ld-table-scroll">
            <table className="ld-table ld-table--compact">
                <thead>
                    <tr>
                        {columns.map((c) => <th key={c.label}>{c.label}</th>)}
                        {hasMenu ? <th aria-label="Actions" /> : null}
                    </tr>
                </thead>
                <tbody>
                    {loading && !rows.length ? (
                        Array.from({ length: 4 }, (_, i) => <tr key={i} className="ld-skeleton-row"><td colSpan={columns.length + 1}><span /></td></tr>)
                    ) : rows.length ? (
                        rows.map((row) => (
                            <tr key={row.id} onClick={() => onOpen(row)}>
                                {columns.map((c) => <td key={c.label}>{c.render(row)}</td>)}
                                {hasMenu ? (
                                    <td className="ld-col-menu">
                                        <RowMenu
                                            label={`Actions for ${row.title ?? row.name}`}
                                            actions={!isCallLogs ? [{ label: "Open Project", onSelect: () => onOpen(row) }] : [
                                                { label: "View Call Log", onSelect: () => onOpen(row) },
                                                { label: "Delete Call Log", onSelect: () => onDeleteCallLog(row as LeadCallLog), danger: true },
                                            ]}
                                        />
                                    </td>
                                ) : null}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length + 1}>
                                <EmptyState
                                    title={`No ${emptyLabel} yet`}
                                    text={isCallLogs ? "Log calls with this lead to keep a history of every conversation." : "Records from this lead's linked projects will show up here."}
                                    action={isCallLogs ? <button type="button" className="ld-btn ld-btn--primary" onClick={onCreateCallLog}><Plus size={18} /> New Call Log</button> : undefined}
                                />
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function NotesGrid({
    notes, loading, onOpen, onDelete, onCreate,
}: {
    notes: LeadNote[]; loading: boolean; onOpen: (note: LeadNote) => void; onDelete: (note: LeadNote) => void; onCreate: () => void;
}) {
    if (loading && !notes.length) return <div className="ld-notes-grid">{[0, 1, 2].map((i) => <div key={i} className="ld-note-card is-skeleton" />)}</div>;
    if (!notes.length) {
        return (
            <EmptyState
                title="No notes yet"
                text="Capture meeting notes, follow-ups and decisions for this lead."
                action={<button type="button" className="ld-btn ld-btn--primary" onClick={onCreate}><Plus size={18} /> New Note</button>}
            />
        );
    }
    return (
        <div className="ld-notes-grid">
            {notes.map((n) => (
                <article key={n.id} className="ld-note-card" role="button" tabIndex={0} onClick={() => onOpen(n)} onKeyDown={(e) => e.key === "Enter" && onOpen(n)}>
                    <header>
                        <h4>{n.title}</h4>
                        <Pill tone={NOTE_TONES[n.noteType] ?? "gray"}>{NOTE_TYPES.find((t) => t.value === n.noteType)?.label ?? humanize(n.noteType)}</Pill>
                        <RowMenu
                            label={`Actions for ${n.title}`}
                            actions={[
                                { label: "View Note", onSelect: () => onOpen(n) },
                                { label: "Delete Note", onSelect: () => onDelete(n), danger: true },
                            ]}
                        />
                    </header>
                    <dl>
                        <div><dt>Linked BOQ</dt><dd>{n.boqCode ?? "-"}</dd></div>
                        <div><dt>Linked Project</dt><dd>{n.projectName ?? "-"}</dd></div>
                        <div><dt>Visibility</dt><dd>{n.visibility === "private" ? "Private" : "Team"}</dd></div>
                        <div><dt>Invoice</dt><dd>{n.invoiceCode ?? "-"}</dd></div>
                    </dl>
                </article>
            ))}
        </div>
    );
}

function MoodBoardList({ boards, onOpen }: { boards: MoodBoard[]; onOpen: (id: string) => void }) {
    if (!boards.length) return <EmptyState title="No moodboards yet" text="Moodboards for this lead or its projects will show up here." />;
    return (
        <div className="ld-table-scroll">
            <table className="ld-table ld-table--compact">
                <thead><tr><th>Moodboard</th><th>Project</th><th>Status</th><th>Updated</th></tr></thead>
                <tbody>
                    {boards.map((b) => (
                        <tr key={b.id} onClick={() => onOpen(b.id)}>
                            <td><strong className="ld-strong">{b.name}</strong></td>
                            <td>{b.projectName || "—"}</td>
                            <td><Pill tone={statusTone(b.status)}>{humanize(b.status)}</Pill></td>
                            <td className="ld-muted">{formatDate(b.updatedAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
