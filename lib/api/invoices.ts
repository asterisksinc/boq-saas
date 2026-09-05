import { getApiErrorMessage, parseApiResponse } from "./auth";
import type { Invoice, InvoiceSummary, PaginatedResponse } from "../types";

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

export async function listInvoices(params?: {
    page?: number; pageSize?: number; search?: string; status?: string; type?: string;
}): Promise<PaginatedResponse<Invoice>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    if (params?.search) sp.set("search", params.search);
    if (params?.status) sp.set("status", params.status);
    if (params?.type) sp.set("type", params.type);
    const q = sp.toString();
    return fetchApi<PaginatedResponse<Invoice>>(`/api/v1/invoices${q ? `?${q}` : ""}`);
}

export async function getInvoiceSummary(): Promise<InvoiceSummary> {
    return fetchApi<InvoiceSummary>("/api/v1/invoices/summary");
}

export async function createInvoice(input: {
    type?: string; clientName: string; clientId?: string; billingAddress?: Record<string, string>;
    projectId?: string; projectName?: string; invoiceNumber?: string;
    issueDate: string; dueDate: string; milestone?: string; reference?: string;
    taxRate?: number; additionalNotes?: string; bankDetails?: Record<string, string>;
    items: Array<{ description: string; quantity: number; rate: number }>;
}): Promise<Invoice> {
    return fetchApi<Invoice>("/api/v1/invoices", { method: "POST", body: JSON.stringify(input) });
}

export async function getInvoice(invoiceId: string): Promise<Invoice> {
    return fetchApi<Invoice>(`/api/v1/invoices/${invoiceId}`);
}

export async function updateInvoice(invoiceId: string, input: Record<string, unknown>): Promise<Invoice> {
    return fetchApi<Invoice>(`/api/v1/invoices/${invoiceId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function archiveInvoice(invoiceId: string): Promise<{ archived: true }> {
    return fetchApi<{ archived: true }>(`/api/v1/invoices/${invoiceId}`, { method: "DELETE" });
}

export async function changeInvoiceStatus(invoiceId: string, status: string): Promise<Invoice> {
    return fetchApi<Invoice>(`/api/v1/invoices/${invoiceId}/status`, { method: "POST", body: JSON.stringify({ status }) });
}

export async function recordPayment(invoiceId: string, input: {
    amount: number; paidAt?: string; method?: string; reference?: string; notes?: string;
}): Promise<Invoice> {
    return fetchApi<Invoice>(`/api/v1/invoices/${invoiceId}/payments`, { method: "POST", body: JSON.stringify(input) });
}

export async function getInvoicePdf(invoiceId: string): Promise<Blob> {
    const response = await fetch(`/api/v1/invoices/${invoiceId}/pdf`, { credentials: "include" });
    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(payload));
    }
    return response.blob();
}
