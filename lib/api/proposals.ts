import { getApiErrorMessage, parseApiResponse } from "./auth";
import type { Proposal, ProposalSummary, PaginatedResponse } from "../types";

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(path, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
        ...options,
    });
    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/pdf")) {
        if (!response.ok) throw new Error("PDF could not be generated.");
        return response.blob() as unknown as T;
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getApiErrorMessage(payload));
    return parseApiResponse<T>(payload);
}

export async function listProposals(params?: {
    page?: number; pageSize?: number; search?: string; status?: string;
}): Promise<PaginatedResponse<Proposal>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    if (params?.search) sp.set("search", params.search);
    if (params?.status) sp.set("status", params.status);
    const q = sp.toString();
    return fetchApi<PaginatedResponse<Proposal>>(`/api/v1/proposals${q ? `?${q}` : ""}`);
}

export async function getProposalSummary(): Promise<ProposalSummary> {
    return fetchApi<ProposalSummary>("/api/v1/proposals/summary");
}

export async function createProposal(input: {
    projectId?: string; projectName: string; clientName: string; sourceType?: string;
    sourceId?: string; sourceLabel?: string; proposedValue: number; expiryDate?: string;
    internalNotes?: string; scopeItems?: string[];
}): Promise<Proposal> {
    return fetchApi<Proposal>("/api/v1/proposals", { method: "POST", body: JSON.stringify(input) });
}

export async function getProposal(proposalId: string): Promise<Proposal> {
    return fetchApi<Proposal>(`/api/v1/proposals/${proposalId}`);
}

export async function updateProposal(proposalId: string, input: Record<string, unknown>): Promise<Proposal> {
    return fetchApi<Proposal>(`/api/v1/proposals/${proposalId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteProposal(proposalId: string): Promise<{ archived: true }> {
    return fetchApi<{ archived: true }>(`/api/v1/proposals/${proposalId}`, { method: "DELETE" });
}

export async function changeProposalStatus(proposalId: string, status: string): Promise<Proposal> {
    return fetchApi<Proposal>(`/api/v1/proposals/${proposalId}/status`, { method: "POST", body: JSON.stringify({ status }) });
}

export async function getProposalPdf(proposalId: string): Promise<Blob> {
    const response = await fetch(`/api/v1/proposals/${proposalId}/pdf`, { credentials: "include" });
    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(payload));
    }
    return response.blob();
}

export async function recordProposalView(proposalId: string): Promise<{ viewCount: number }> {
    return fetchApi<{ viewCount: number }>(`/api/v1/proposals/${proposalId}/view`, { method: "POST" });
}
