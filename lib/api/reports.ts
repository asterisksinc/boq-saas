import { getApiErrorMessage, parseApiResponse } from "./auth";
import type { AnalyticsResponse } from "../types";

async function fetchApi<T>(path: string): Promise<T> {
    const response = await fetch(path, { credentials: "include" });
    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/pdf")) {
        if (!response.ok) throw new Error("PDF could not be generated.");
        return response.blob() as unknown as T;
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getApiErrorMessage(payload));
    return parseApiResponse<T>(payload);
}

export interface AnalyticsFilterParams {
    period?: "month" | "quarter" | "year" | "all" | "custom" | string;
    tab?: string;
    from?: string;
    to?: string;
}

export async function getAnalytics(
    params?: "month" | "quarter" | "year" | "all" | "custom" | string | AnalyticsFilterParams
): Promise<AnalyticsResponse> {
    const sp = new URLSearchParams();
    if (typeof params === "string") {
        if (params) sp.set("period", params);
    } else if (params) {
        if (params.period) sp.set("period", params.period);
        if (params.tab) sp.set("tab", params.tab);
        if (params.from) sp.set("from", params.from);
        if (params.to) sp.set("to", params.to);
    }
    const q = sp.toString();
    return fetchApi<AnalyticsResponse>(`/api/v1/reports/analytics${q ? `?${q}` : ""}`);
}

export async function getAnalyticsPdf(
    params?: "month" | "quarter" | "year" | "all" | "custom" | string | AnalyticsFilterParams
): Promise<Blob> {
    const sp = new URLSearchParams();
    if (typeof params === "string") {
        if (params) sp.set("period", params);
    } else if (params) {
        if (params.period) sp.set("period", params.period);
        if (params.tab) sp.set("tab", params.tab);
        if (params.from) sp.set("from", params.from);
        if (params.to) sp.set("to", params.to);
    }
    const q = sp.toString();
    const response = await fetch(`/api/v1/reports/analytics/pdf${q ? `?${q}` : ""}`, { credentials: "include" });
    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(payload));
    }
    return response.blob();
}
