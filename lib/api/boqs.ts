import { getApiErrorMessage, parseApiResponse } from "./auth";
import type { Boq, BoqDetail, BoqTemplate, PaginatedResponse } from "../types";

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(path, {
        credentials: "include",
        headers: {
            ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...(options.headers ?? {}),
        },
        ...options,
    });
    if (options.method === "GET" || !options.method) {
        // For blob responses (PDF)
        const ct = response.headers.get("content-type") || "";
        if (ct.includes("application/pdf")) {
            if (!response.ok) throw new Error("PDF could not be generated.");
            return response.blob() as unknown as T;
        }
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getApiErrorMessage(payload));
    return parseApiResponse<T>(payload);
}

export async function listBoqs(params?: {
    page?: number; pageSize?: number; search?: string; status?: string; projectId?: string;
}): Promise<PaginatedResponse<Boq>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    if (params?.search) sp.set("search", params.search);
    if (params?.status) sp.set("status", params.status);
    if (params?.projectId) sp.set("projectId", params.projectId);
    const q = sp.toString();
    return fetchApi<PaginatedResponse<Boq>>(`/api/v1/boqs${q ? `?${q}` : ""}`);
}

export async function createBoq(input: {
    projectId: string; boqNumber: string; version?: string; assignedTo?: string;
    method?: string; templateId?: string; markupPercent?: number; taxPercent?: number;
}): Promise<Boq> {
    return fetchApi<Boq>("/api/v1/boqs", { method: "POST", body: JSON.stringify(input) });
}

export async function getBoq(boqId: string): Promise<BoqDetail> {
    return fetchApi<BoqDetail>(`/api/v1/boqs/${boqId}`);
}

export async function updateBoq(boqId: string, input: Record<string, unknown>): Promise<Boq> {
    return fetchApi<Boq>(`/api/v1/boqs/${boqId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function setBoqStatus(boqId: string, status: string): Promise<Boq> {
    return fetchApi<Boq>(`/api/v1/boqs/${boqId}/status`, { method: "POST", body: JSON.stringify({ status }) });
}

export async function duplicateBoq(boqId: string): Promise<Boq> {
    return fetchApi<Boq>(`/api/v1/boqs/${boqId}/duplicate`, { method: "POST" });
}

// Room CRUD
export async function addBoqRoom(boqId: string, input: { name: string; description?: string; sort_order?: number }): Promise<Record<string, unknown>> {
    return fetchApi(`/api/v1/boqs/${boqId}/rooms`, { method: "POST", body: JSON.stringify(input) });
}

export async function updateBoqRoom(boqId: string, roomId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return fetchApi(`/api/v1/boqs/${boqId}/rooms/${roomId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteBoqRoom(boqId: string, roomId: string): Promise<{ deleted: true; id: string }> {
    return fetchApi(`/api/v1/boqs/${boqId}/rooms/${roomId}`, { method: "DELETE" });
}

// Category CRUD
export async function addBoqCategory(boqId: string, roomId: string, input: { name: string; description?: string; sort_order?: number }): Promise<Record<string, unknown>> {
    return fetchApi(`/api/v1/boqs/${boqId}/rooms/${roomId}/categories`, { method: "POST", body: JSON.stringify(input) });
}

export async function updateBoqCategory(boqId: string, categoryId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return fetchApi(`/api/v1/boqs/${boqId}/categories/${categoryId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteBoqCategory(boqId: string, categoryId: string): Promise<{ deleted: true; id: string }> {
    return fetchApi(`/api/v1/boqs/${boqId}/categories/${categoryId}`, { method: "DELETE" });
}

// Item CRUD
export async function addBoqItem(boqId: string, categoryId: string, input: {
    name: string; description?: string; unit?: string; quantity?: number; rate?: number;
    wastePercent?: number; taxPercent?: number; sortOrder?: number;
}): Promise<Record<string, unknown>> {
    return fetchApi(`/api/v1/boqs/${boqId}/categories/${categoryId}/items`, { method: "POST", body: JSON.stringify(input) });
}

export async function updateBoqItem(boqId: string, itemId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return fetchApi(`/api/v1/boqs/${boqId}/items/${itemId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteBoqItem(boqId: string, itemId: string): Promise<{ deleted: true; id: string }> {
    return fetchApi(`/api/v1/boqs/${boqId}/items/${itemId}`, { method: "DELETE" });
}

// Templates
export async function listBoqTemplates(params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<BoqTemplate>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    const q = sp.toString();
    return fetchApi<PaginatedResponse<BoqTemplate>>(`/api/v1/boq-templates${q ? `?${q}` : ""}`);
}

export async function createBoqTemplate(input: { boqId: string; name: string; description?: string; tags?: string[] }): Promise<BoqTemplate> {
    return fetchApi<BoqTemplate>("/api/v1/boq-templates", { method: "POST", body: JSON.stringify(input) });
}

// Import
export async function previewBoqImport(file: File, projectId?: string): Promise<Record<string, unknown>> {
    const form = new FormData();
    form.append("file", file);
    if (projectId) form.append("projectId", projectId);
    return fetchApi("/api/v1/boq-imports/preview", { method: "POST", body: form });
}

export async function uploadBoqImport(file: File, projectId?: string): Promise<Record<string, unknown>> {
    const form = new FormData();
    form.append("file", file);
    if (projectId) form.append("projectId", projectId);
    return fetchApi("/api/v1/boq-imports/upload", { method: "POST", body: form });
}
