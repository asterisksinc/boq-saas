import { getApiErrorMessage, parseApiResponse } from "./auth";
import type { DocumentFolder, DocumentFile, PaginatedResponse } from "../types";

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(path, {
        credentials: "include",
        headers: {
            ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...(options.headers ?? {}),
        },
        ...options,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getApiErrorMessage(payload));
    return parseApiResponse<T>(payload);
}

// ── Folders ─────────────────────────────────────────────────────────────────

export async function listFolders(parentId?: string): Promise<{ items: DocumentFolder[] }> {
    const sp = new URLSearchParams();
    if (parentId) sp.set("parentId", parentId);
    const q = sp.toString();
    return fetchApi<{ items: DocumentFolder[] }>(`/api/v1/document-folders${q ? `?${q}` : ""}`);
}

export async function createFolder(input: { name: string; parentId?: string }): Promise<DocumentFolder> {
    return fetchApi<DocumentFolder>("/api/v1/document-folders", { method: "POST", body: JSON.stringify(input) });
}

export async function updateFolder(folderId: string, input: { name?: string; parentId?: string }): Promise<DocumentFolder> {
    return fetchApi<DocumentFolder>(`/api/v1/document-folders/${folderId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteFolder(folderId: string, confirmation: string): Promise<{ deleted: true; filesDeleted: number }> {
    return fetchApi<{ deleted: true; filesDeleted: number }>(`/api/v1/document-folders/${folderId}`, {
        method: "DELETE",
        body: JSON.stringify({ confirmation }),
    });
}

// ── Documents ───────────────────────────────────────────────────────────────

export async function listDocuments(folderId: string, params?: {
    page?: number; pageSize?: number; search?: string;
}): Promise<PaginatedResponse<DocumentFile>> {
    const sp = new URLSearchParams({ folderId });
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    if (params?.search) sp.set("search", params.search);
    return fetchApi<PaginatedResponse<DocumentFile>>(`/api/v1/documents?${sp}`);
}

export async function uploadDocument(file: File, folderId: string, meta?: {
    projectId?: string; projectName?: string; proposalId?: string;
}): Promise<DocumentFile> {
    const form = new FormData();
    form.append("file", file);
    form.append("folderId", folderId);
    if (meta?.projectId) form.append("projectId", meta.projectId);
    if (meta?.projectName) form.append("projectName", meta.projectName);
    if (meta?.proposalId) form.append("proposalId", meta.proposalId);
    return fetchApi<DocumentFile>("/api/v1/documents/upload", { method: "POST", body: form });
}

export async function updateDocument(documentId: string, input: {
    name?: string; folderId?: string; projectId?: string; projectName?: string;
}): Promise<DocumentFile> {
    return fetchApi<DocumentFile>(`/api/v1/documents/${documentId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteDocument(documentId: string): Promise<{ deleted: true }> {
    return fetchApi<{ deleted: true }>(`/api/v1/documents/${documentId}`, { method: "DELETE" });
}

export async function downloadDocument(documentId: string): Promise<{ url: string; expiresIn: number; fileName: string }> {
    return fetchApi<{ url: string; expiresIn: number; fileName: string }>(`/api/v1/documents/${documentId}/download`);
}
