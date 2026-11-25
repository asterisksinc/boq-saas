import { getApiErrorMessage, parseApiResponse } from "./auth";

export const LEAD_STAGES = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "interested", label: "Interested" },
    { value: "qualified", label: "Qualified" },
    { value: "unqualified", label: "Un-Qualified" },
    { value: "lost", label: "Lost" },
    { value: "won", label: "Won" },
    { value: "churned", label: "Churned" },
] as const;

export const LEAD_SOURCES = [
    { value: "meta_ads", label: "Meta Ads" },
    { value: "google_ads", label: "Google Ads" },
    { value: "custom_website", label: "Custom Website" },
    { value: "referral", label: "Referral" },
    { value: "walk_in", label: "Walk-in" },
    { value: "other", label: "Other" },
] as const;

export const CALL_STATUSES = [
    { value: "connected", label: "Connected" },
    { value: "no_answer", label: "No Answer" },
    { value: "busy", label: "Busy" },
    { value: "voicemail", label: "Voicemail" },
    { value: "scheduled", label: "Scheduled" },
] as const;

export const NOTE_TYPES = [
    { value: "general", label: "General Note" },
    { value: "meeting", label: "Meeting Note" },
    { value: "follow_up", label: "Follow-up Note" },
    { value: "boq", label: "BOQ Note" },
    { value: "project", label: "Project Note" },
    { value: "invoice", label: "Invoice Note" },
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number]["value"];
export type LeadSource = (typeof LEAD_SOURCES)[number]["value"];

export interface LeadPerson {
    id: string;
    name: string;
    role: string | null;
    avatarUrl: string | null;
}

export interface Lead {
    id: string;
    leadCode: string;
    name: string;
    avatarUrl: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    projectId: string | null;
    project: { id: string; name: string; projectCode: string | null } | null;
    source: LeadSource;
    sourceLabel: string;
    stage: LeadStage;
    stageLabel: string;
    assignedTo: string | null;
    assignee: LeadPerson | null;
    lastContactedAt: string | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface LeadDetail extends Lead {
    stats: {
        projects: number;
        boqValue: number;
        invoicesPaid: number;
        invoicesTotal: number;
        outstandingAmount: number;
        currency: string;
    };
    projectIds: string[];
}

export interface LeadCallLog {
    id: string;
    code: string;
    leadId: string;
    title: string;
    callType: "inbound" | "outbound";
    status: (typeof CALL_STATUSES)[number]["value"];
    durationMinutes: number | null;
    notes: string | null;
    calledAt: string;
    createdBy: LeadPerson | null;
    createdAt: string;
}

export interface LeadNote {
    id: string;
    code: string;
    leadId: string;
    title: string;
    body: string | null;
    noteType: (typeof NOTE_TYPES)[number]["value"];
    visibility: "private" | "team";
    boqId: string | null;
    boqCode: string | null;
    projectId: string | null;
    projectName: string | null;
    invoiceId: string | null;
    invoiceCode: string | null;
    attachments: Array<{ name: string; url: string }>;
    createdBy: LeadPerson | null;
    createdAt: string;
}

export interface Paged<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
}

export interface LeadInput {
    name: string;
    avatarUrl?: string | null;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    projectId: string;
    source: LeadSource;
    stage?: LeadStage;
    assignedTo?: string | null;
}

export interface LeadFilters {
    search?: string;
    stage?: string;
    source?: string;
    assignedTo?: string;
}

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
    const isForm = options.body instanceof FormData;
    const response = await fetch(path, {
        credentials: "include",
        ...options,
        headers: isForm ? options.headers : { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getApiErrorMessage(payload));
    return parseApiResponse<T>(payload);
}

function query(params: Record<string, string | number | undefined>) {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") sp.set(key, String(value));
    const q = sp.toString();
    return q ? `?${q}` : "";
}

export function listLeads(params: LeadFilters & { page?: number; pageSize?: number }) {
    return fetchApi<Paged<Lead>>(`/api/v1/leads${query({ ...params })}`);
}

export function listLeadBoard(params: LeadFilters) {
    return fetchApi<{ items: Lead[]; total: number }>(`/api/v1/leads${query({ ...params, view: "board" })}`);
}

export function getLead(leadId: string) {
    return fetchApi<LeadDetail>(`/api/v1/leads/${leadId}`);
}

export function createLead(input: LeadInput) {
    return fetchApi<Lead>("/api/v1/leads", { method: "POST", body: JSON.stringify(input) });
}

export function updateLead(leadId: string, input: Partial<LeadInput> & { sortOrder?: number }) {
    return fetchApi<Lead>(`/api/v1/leads/${leadId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteLead(leadId: string) {
    return fetchApi<{ archived: true }>(`/api/v1/leads/${leadId}`, { method: "DELETE" });
}

export async function exportLeads(filters: LeadFilters) {
    const response = await fetch(`/api/v1/leads/export${query({ ...filters })}`, { credentials: "include" });
    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(payload));
    }
    return response.blob();
}

export function importLeads(file: File) {
    const form = new FormData();
    form.append("file", file);
    return fetchApi<{ imported: number; skipped: number; errors: Array<{ row: number; message: string }> }>("/api/v1/leads/import", {
        method: "POST",
        body: form,
    });
}

export function uploadLeadAvatar(file: File) {
    const form = new FormData();
    form.append("file", file);
    return fetchApi<{ url: string }>("/api/v1/projects/upload-image", { method: "POST", body: form });
}

export type LeadRelatedTab = "projects" | "boqs" | "proposals" | "invoices" | "tasks" | "approvals";

export function listLeadRelated<T = Record<string, unknown>>(leadId: string, tab: LeadRelatedTab, page = 1, pageSize = 10) {
    return fetchApi<Paged<T>>(`/api/v1/leads/${leadId}/${tab}${query({ page, pageSize })}`);
}

export function listLeadCallLogs(leadId: string, page = 1, pageSize = 10) {
    return fetchApi<Paged<LeadCallLog>>(`/api/v1/leads/${leadId}/call-logs${query({ page, pageSize })}`);
}

export function saveLeadCallLog(leadId: string, input: Record<string, unknown>, logId?: string) {
    return fetchApi<LeadCallLog>(`/api/v1/leads/${leadId}/call-logs${logId ? `/${logId}` : ""}`, {
        method: logId ? "PATCH" : "POST",
        body: JSON.stringify(input),
    });
}

export function deleteLeadCallLog(leadId: string, logId: string) {
    return fetchApi<{ deleted: true }>(`/api/v1/leads/${leadId}/call-logs/${logId}`, { method: "DELETE" });
}

export function listLeadNotes(leadId: string, page = 1, pageSize = 10) {
    return fetchApi<Paged<LeadNote>>(`/api/v1/leads/${leadId}/notes${query({ page, pageSize })}`);
}

export function saveLeadNote(leadId: string, input: Record<string, unknown>, noteId?: string) {
    return fetchApi<LeadNote>(`/api/v1/leads/${leadId}/notes${noteId ? `/${noteId}` : ""}`, {
        method: noteId ? "PATCH" : "POST",
        body: JSON.stringify(input),
    });
}

export function deleteLeadNote(leadId: string, noteId: string) {
    return fetchApi<{ deleted: true }>(`/api/v1/leads/${leadId}/notes/${noteId}`, { method: "DELETE" });
}

/** Options for the Linked Project and Assign to dropdowns. */
export async function listLeadFormOptions() {
    const [projects, members] = await Promise.all([
        fetchApi<{ items: Array<{ id: string; name: string; projectCode?: string | null }> }>("/api/v1/projects?page=1&pageSize=100"),
        fetchApi<{ items: Array<{ id: string; name: string; role?: string | null; avatarUrl?: string | null }> }>("/api/v1/workspace/designers"),
    ]);
    return { projects: projects.items ?? [], members: members.items ?? [] };
}

export function initials(name: string | null | undefined) {
    const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function formatMoney(value: number, currency = "INR") {
    try {
        return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 2 }).format(value || 0);
    } catch {
        return `${currency} ${(value || 0).toFixed(2)}`;
    }
}

export function formatCompactMoney(value: number, currency = "INR") {
    if (currency === "INR") {
        if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
        if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
    }
    return formatMoney(value, currency).replace(/\.00$/, "");
}

export function relativeDays(iso: string | null) {
    if (!iso) return null;
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    return `${days} days ago`;
}

export function formatDate(iso: string | null | undefined) {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
