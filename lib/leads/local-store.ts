/**
 * Browser-only Leads store used until the Leads backend exists.
 *
 * Mirrors the planned REST contract (see lib/api/leads.ts) so swapping to the real API is a flag flip:
 * set NEXT_PUBLIC_LEADS_BACKEND=api. Data lives in localStorage, per browser.
 */
import * as XLSX from "xlsx";
import type { Lead, LeadCallLog, LeadDetail, LeadInput, LeadNote, LeadPerson, Paged } from "@/lib/api/leads";

const STORAGE_KEY = "boq-saas:leads:v1";

const STAGE_LABELS: Record<string, string> = {
    new: "New", contacted: "Contacted", interested: "Interested", qualified: "Qualified",
    unqualified: "Un-Qualified", lost: "Lost", won: "Won", churned: "Churned",
};
const SOURCE_LABELS: Record<string, string> = {
    meta_ads: "Meta Ads", google_ads: "Google Ads", custom_website: "Custom Website",
    referral: "Referral", walk_in: "Walk-in", other: "Other",
};

interface StoredLead extends Omit<Lead, "stageLabel" | "sourceLabel"> {
    archivedAt?: string | null;
}

interface Store {
    seq: { lead: number; call: number; note: number };
    leads: StoredLead[];
    callLogs: LeadCallLog[];
    notes: LeadNote[];
}

export type LookupProject = { id: string; name: string; projectCode: string | null };
export type Lookups = { projects: LookupProject[]; members: LeadPerson[] };

function uuid() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

const pad = (n: number, width: number) => String(n).padStart(width, "0");

function sampleStore(): Store {
    const now = Date.now();
    const day = 86_400_000;
    const samples: Array<[string, string, string, string, string, string]> = [
        ["Pradhyumn Dhondi", "pradhyumn@gmail.com", "9966701124", "Bandra West, Mumbai", "meta_ads", "new"],
        ["Aarav Mehta", "aarav.mehta@gmail.com", "9820012345", "Koregaon Park, Pune", "google_ads", "contacted"],
        ["Saanvi Rao", "saanvi.rao@gmail.com", "9845098450", "Indiranagar, Bengaluru", "custom_website", "interested"],
        ["Kabir Shah", "kabir.shah@gmail.com", "9930099300", "Juhu, Mumbai", "referral", "qualified"],
        ["Ananya Iyer", "ananya.iyer@gmail.com", "9884098840", "Adyar, Chennai", "meta_ads", "unqualified"],
        ["Vihaan Kapoor", "vihaan.kapoor@gmail.com", "9810098100", "DLF Phase 5, Gurugram", "google_ads", "lost"],
        ["Diya Nair", "diya.nair@gmail.com", "9895098950", "Kakkanad, Kochi", "referral", "won"],
        ["Arjun Menon", "arjun.menon@gmail.com", "9447094470", "Whitefield, Bengaluru", "custom_website", "churned"],
    ];
    const leads: StoredLead[] = samples.map(([name, email, phone, location, source, stage], i) => ({
        id: uuid(),
        leadCode: `Lead-${pad(1120 + i, 7)}`,
        name, avatarUrl: null, email, phone, location,
        projectId: null,
        project: { id: "", name: ["Parkview Residence", "Oberoi Residence", "The Lakeview Villa"][i % 3], projectCode: `PRJ-2026-${214 + i}` },
        source: source as Lead["source"], stage: stage as Lead["stage"],
        assignedTo: null, assignee: null,
        lastContactedAt: i % 2 === 0 ? new Date(now - (i + 2) * day).toISOString() : null,
        sortOrder: i,
        createdAt: new Date(now - (30 - i) * day).toISOString(),
        updatedAt: new Date(now - i * day).toISOString(),
    }));
    const first = leads[0];
    return {
        seq: { lead: 1120 + leads.length, call: 20, note: 11 },
        leads,
        callLogs: [{
            id: uuid(), code: pad(19, 5), leadId: first.id, title: "Client Discovery Call", callType: "outbound", status: "connected",
            durationMinutes: 12, notes: "Walked through scope, budget and timelines for the living room and kitchen.",
            calledAt: new Date(now - 4 * day).toISOString(), createdBy: null, createdAt: new Date(now - 4 * day).toISOString(),
        }],
        notes: [{
            id: uuid(), code: pad(10, 4), leadId: first.id, title: "Kitchen layout preferences", body: "Prefers an island layout with a breakfast counter.",
            noteType: "meeting", visibility: "team", boqId: null, boqCode: null, projectId: null, projectName: first.project?.name ?? null,
            invoiceId: null, invoiceCode: null, attachments: [], createdBy: null, createdAt: new Date(now - 3 * day).toISOString(),
        }],
    };
}

function load(): Store {
    if (typeof window === "undefined") return { seq: { lead: 0, call: 0, note: 0 }, leads: [], callLogs: [], notes: [] };
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Store;
    } catch {
        // fall through to fresh sample data
    }
    const store = sampleStore();
    save(store);
    return store;
}

function save(store: Store) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
        throw new Error("Browser storage is full or unavailable, so the change could not be saved.");
    }
}

const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 120));

function toLead(row: StoredLead): Lead {
    const { archivedAt: _archived, ...rest } = row;
    return { ...rest, stageLabel: STAGE_LABELS[row.stage] ?? row.stage, sourceLabel: SOURCE_LABELS[row.source] ?? row.source };
}

function paginate<T>(items: T[], page = 1, pageSize = 10): Paged<T> {
    const from = (page - 1) * pageSize;
    return { items: items.slice(from, from + pageSize), page, pageSize, total: items.length, hasMore: from + pageSize < items.length };
}

function matches(lead: StoredLead, filters: { search?: string; stage?: string; source?: string; assignedTo?: string }) {
    if (lead.archivedAt) return false;
    if (filters.stage && lead.stage !== filters.stage) return false;
    if (filters.source && lead.source !== filters.source) return false;
    if (filters.assignedTo && lead.assignedTo !== filters.assignedTo) return false;
    const q = filters.search?.trim().toLowerCase();
    if (q) {
        const hay = [lead.name, lead.email, lead.phone, lead.location, lead.leadCode, lead.project?.name].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
    }
    return true;
}

function resolveRefs(input: Partial<LeadInput>, lookups: Lookups, current?: StoredLead) {
    const out: Partial<StoredLead> = {};
    if (input.projectId !== undefined) {
        const project = lookups.projects.find((p) => p.id === input.projectId);
        if (input.projectId && !project) throw new Error("Linked project was not found in this workspace.");
        out.projectId = input.projectId || null;
        out.project = project ? { id: project.id, name: project.name, projectCode: project.projectCode } : current?.project ?? null;
    }
    if (input.assignedTo !== undefined) {
        const member = lookups.members.find((m) => m.id === input.assignedTo) ?? null;
        out.assignedTo = input.assignedTo || null;
        out.assignee = member;
    }
    return out;
}

export const localLeads = {
    list(filters: { search?: string; stage?: string; source?: string; assignedTo?: string; page?: number; pageSize?: number }) {
        const rows = load().leads.filter((l) => matches(l, filters)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        return delay(paginate(rows.map(toLead), filters.page, filters.pageSize));
    },

    board(filters: { search?: string; stage?: string; source?: string; assignedTo?: string }) {
        const items = load().leads.filter((l) => matches(l, filters)).sort((a, b) => a.sortOrder - b.sortOrder).map(toLead);
        return delay({ items, total: items.length });
    },

    get(leadId: string, lookups: Lookups): Promise<LeadDetail> {
        const lead = load().leads.find((l) => l.id === leadId && !l.archivedAt);
        if (!lead) return Promise.reject(new Error("Lead was not found."));
        // Real linked-project numbers arrive with the backend; until then only the project count is known.
        const linked = lead.projectId && lookups.projects.some((p) => p.id === lead.projectId);
        return delay({
            ...toLead(lead),
            stats: { projects: linked ? 1 : 0, boqValue: 0, invoicesPaid: 0, invoicesTotal: 0, outstandingAmount: 0, currency: "INR" },
            projectIds: lead.projectId ? [lead.projectId] : [],
        });
    },

    create(input: LeadInput, lookups: Lookups) {
        const store = load();
        store.seq.lead += 1;
        const now = new Date().toISOString();
        const minOrder = Math.min(0, ...store.leads.map((l) => l.sortOrder));
        const lead: StoredLead = {
            id: uuid(), leadCode: `Lead-${pad(store.seq.lead, 7)}`, name: input.name, avatarUrl: input.avatarUrl ?? null,
            email: input.email ?? null, phone: input.phone ?? null, location: input.location ?? null,
            projectId: null, project: null, source: input.source, stage: input.stage ?? "new", assignedTo: null, assignee: null,
            lastContactedAt: null, sortOrder: minOrder - 1, createdAt: now, updatedAt: now,
            ...resolveRefs({ projectId: input.projectId, assignedTo: input.assignedTo ?? null }, lookups),
        };
        store.leads.push(lead);
        save(store);
        return delay(toLead(lead));
    },

    update(leadId: string, input: Partial<LeadInput> & { sortOrder?: number }, lookups: Lookups) {
        const store = load();
        const lead = store.leads.find((l) => l.id === leadId && !l.archivedAt);
        if (!lead) return Promise.reject(new Error("Lead was not found."));
        const { projectId, assignedTo, ...plain } = input;
        Object.assign(lead, Object.fromEntries(Object.entries(plain).filter(([, v]) => v !== undefined)));
        Object.assign(lead, resolveRefs({ projectId, assignedTo }, lookups, lead));
        lead.updatedAt = new Date().toISOString();
        save(store);
        return delay(toLead(lead));
    },

    remove(leadId: string) {
        const store = load();
        const lead = store.leads.find((l) => l.id === leadId);
        if (!lead) return Promise.reject(new Error("Lead was not found."));
        lead.archivedAt = new Date().toISOString();
        save(store);
        return delay({ archived: true as const });
    },

    callLogs(leadId: string, page = 1, pageSize = 10) {
        const rows = load().callLogs.filter((c) => c.leadId === leadId).sort((a, b) => b.calledAt.localeCompare(a.calledAt));
        return delay(paginate(rows, page, pageSize));
    },

    saveCallLog(leadId: string, input: Record<string, unknown>, logId?: string) {
        const store = load();
        const lead = store.leads.find((l) => l.id === leadId && !l.archivedAt);
        if (!lead) return Promise.reject(new Error("Lead was not found."));
        let log = logId ? store.callLogs.find((c) => c.id === logId && c.leadId === leadId) : undefined;
        if (logId && !log) return Promise.reject(new Error("Call log was not found."));
        if (!log) {
            store.seq.call += 1;
            const now = new Date().toISOString();
            log = { id: uuid(), code: pad(store.seq.call, 5), leadId, title: "", callType: "outbound", status: "connected", durationMinutes: null, notes: null, calledAt: now, createdBy: null, createdAt: now };
            store.callLogs.push(log);
            lead.lastContactedAt = now;
        }
        Object.assign(log, input);
        save(store);
        return delay({ ...log });
    },

    deleteCallLog(leadId: string, logId: string) {
        const store = load();
        store.callLogs = store.callLogs.filter((c) => !(c.id === logId && c.leadId === leadId));
        save(store);
        return delay({ deleted: true as const });
    },

    notes(leadId: string, page = 1, pageSize = 10) {
        const rows = load().notes.filter((n) => n.leadId === leadId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return delay(paginate(rows, page, pageSize));
    },

    saveNote(leadId: string, input: Record<string, unknown>, lookups: Lookups, noteId?: string) {
        const store = load();
        if (!store.leads.some((l) => l.id === leadId && !l.archivedAt)) return Promise.reject(new Error("Lead was not found."));
        let note = noteId ? store.notes.find((n) => n.id === noteId && n.leadId === leadId) : undefined;
        if (noteId && !note) return Promise.reject(new Error("Note was not found."));
        if (!note) {
            store.seq.note += 1;
            note = {
                id: uuid(), code: pad(store.seq.note, 4), leadId, title: "", body: null, noteType: "general", visibility: "team",
                boqId: null, boqCode: null, projectId: null, projectName: null, invoiceId: null, invoiceCode: null,
                attachments: [], createdBy: null, createdAt: new Date().toISOString(),
            };
            store.notes.push(note);
        }
        Object.assign(note, input);
        if (input.projectId !== undefined) note.projectName = lookups.projects.find((p) => p.id === input.projectId)?.name ?? null;
        save(store);
        return delay({ ...note });
    },

    deleteNote(leadId: string, noteId: string) {
        const store = load();
        store.notes = store.notes.filter((n) => !(n.id === noteId && n.leadId === leadId));
        save(store);
        return delay({ deleted: true as const });
    },

    async exportXlsx(filters: { search?: string; stage?: string; source?: string; assignedTo?: string }) {
        const rows = load().leads.filter((l) => matches(l, filters)).map(toLead);
        const sheet = XLSX.utils.aoa_to_sheet([
            ["Lead ID", "Name", "Email", "Phone", "Location", "Linked Project", "Project Code", "Stage", "Source", "Assigned To", "Last Contacted", "Created"],
            ...rows.map((l) => [
                l.leadCode, l.name, l.email ?? "", l.phone ?? "", l.location ?? "", l.project?.name ?? "", l.project?.projectCode ?? "",
                l.stageLabel, l.sourceLabel, l.assignee?.name ?? "", l.lastContactedAt?.slice(0, 10) ?? "", l.createdAt.slice(0, 10),
            ]),
        ]);
        const book = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(book, sheet, "Leads");
        const data = XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
        return new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    },

    async importFile(file: File, lookups: Lookups) {
        if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error("Supported file types are XLSX, XLS and CSV.");
        if (file.size > 5 * 1024 * 1024) throw new Error("File size must be 5 MB or less.");
        const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets[book.SheetNames[0]], { defval: "" });
        if (!records.length) throw new Error("The file has no rows.");
        const pick = (record: Record<string, unknown>, ...names: string[]) => {
            for (const [key, value] of Object.entries(record)) if (names.includes(key.trim().toLowerCase())) return String(value ?? "").trim();
            return "";
        };
        const byLabel = (value: string, labels: Record<string, string>) => {
            const v = value.toLowerCase().replace(/[\s_-]+/g, "");
            return Object.entries(labels).find(([k, l]) => k.replace(/_/g, "") === v || l.toLowerCase().replace(/[\s_-]+/g, "") === v)?.[0];
        };
        const errors: Array<{ row: number; message: string }> = [];
        let imported = 0;
        for (const [index, record] of records.slice(0, 1000).entries()) {
            const name = pick(record, "name", "lead name");
            if (!name) { errors.push({ row: index + 2, message: "Name is required." }); continue; }
            const code = pick(record, "project code").toLowerCase();
            const projectName = pick(record, "linked project", "project").toLowerCase();
            const project = lookups.projects.find((p) => (code && p.projectCode?.toLowerCase() === code) || (projectName && p.name.toLowerCase() === projectName));
            await this.create({
                name: name.slice(0, 160), email: pick(record, "email") || null, phone: pick(record, "phone", "contact") || null,
                location: pick(record, "location") || null, projectId: project?.id ?? "",
                source: (byLabel(pick(record, "source", "lead source"), SOURCE_LABELS) ?? "other") as LeadInput["source"],
                stage: (byLabel(pick(record, "stage"), STAGE_LABELS) ?? "new") as LeadInput["stage"],
            }, lookups);
            imported += 1;
        }
        return { imported, skipped: errors.length, errors };
    },
};
