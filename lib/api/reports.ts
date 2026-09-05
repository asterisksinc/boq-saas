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

export async function getAnalytics(period?: "month" | "quarter" | "year"): Promise<AnalyticsResponse> {
    const sp = new URLSearchParams();
    if (period) sp.set("period", period);
    const q = sp.toString();
    return fetchApi<AnalyticsResponse>(`/api/v1/reports/analytics${q ? `?${q}` : ""}`);
}

export async function getAnalyticsPdf(period?: "month" | "quarter" | "year"): Promise<Blob> {
    const sp = new URLSearchParams();
    if (period) sp.set("period", period);
    const q = sp.toString();
    const response = await fetch(`/api/v1/reports/analytics/pdf${q ? `?${q}` : ""}`, { credentials: "include" });
    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(payload));
    }
    return response.blob();
}
