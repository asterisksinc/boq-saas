import { getApiErrorMessage, parseApiResponse } from "./auth";
import type { BoqCostingSettingsData } from "../settings/types";
import { adaptBoqCostingSettings } from "../settings/adapter";
import type {
    CostingCategoryBackend,
    CostingCategoryDetail,
    CostingItemBackend,
    CostingItemDetail,
    CostingAnalysisResponse,
    MarginAnalysisResponse,
    CostingSettingsResponse,
    CostingScenario,
    VendorQuote,
    PaginatedResponse,
} from "../types";

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
    if (!response.ok) {
        throw new Error(getApiErrorMessage(payload));
    }

    return parseApiResponse<T>(payload);
}

// ── Items ───────────────────────────────────────────────────────────────────

export async function getCostingItems(params?: { page?: number; pageSize?: number; search?: string; categoryId?: string; rateStatus?: string }): Promise<PaginatedResponse<CostingItemBackend>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
    if (params?.rateStatus) searchParams.set("rateStatus", params.rateStatus);
    const query = searchParams.toString();
    return fetchApi<PaginatedResponse<CostingItemBackend>>(`/api/v1/costing/items${query ? `?${query}` : ""}`);
}

export async function createCostingItem(input: {
    name: string;
    code?: string;
    categoryId: string;
    unit: string;
    baseCost: number;
    sellingRate: number;
    preferredVendor?: string | null;
    spec?: string | null;
    description?: string | null;
    rateStatus?: string;
    imageUrl?: string | null;
}): Promise<CostingItemBackend> {
    return fetchApi<CostingItemBackend>("/api/v1/costing/items", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function uploadCostingImage(file: File): Promise<{ url: string; storagePath?: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return fetchApi<{ url: string; storagePath?: string }>("/api/v1/costing/upload-image", {
        method: "POST",
        body: formData,
    });
}

export async function getCostingItemDetail(itemId: string): Promise<CostingItemDetail> {
    return fetchApi<CostingItemDetail>(`/api/v1/costing/items/${itemId}`);
}

export async function updateCostingItem(itemId: string, input: Record<string, unknown>): Promise<CostingItemBackend> {
    return fetchApi<CostingItemBackend>(`/api/v1/costing/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export async function deleteCostingItem(itemId: string): Promise<{ archived: true; id: string }> {
    return fetchApi<{ archived: true; id: string }>(`/api/v1/costing/items/${itemId}`, {
        method: "DELETE",
    });
}

// ── Categories ──────────────────────────────────────────────────────────────

export async function getCostingCategories(params?: { page?: number; pageSize?: number; search?: string }): Promise<PaginatedResponse<CostingCategoryBackend>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params?.search) searchParams.set("search", params.search);
    const query = searchParams.toString();
    return fetchApi<PaginatedResponse<CostingCategoryBackend>>(`/api/v1/costing/categories${query ? `?${query}` : ""}`);
}

export async function createCostingCategory(input: {
    name: string;
    code?: string;
    parentId?: string;
    defaultUnit?: string;
    defaultTaxPercent?: number;
    defaultMarkupPercent?: number;
    defaultWastePercent?: number;
    transportIncluded?: boolean;
    labourIncluded?: boolean;
    description?: string;
}): Promise<CostingCategoryBackend> {
    return fetchApi<CostingCategoryBackend>("/api/v1/costing/categories", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function getCostingCategoryDetail(categoryId: string): Promise<CostingCategoryDetail> {
    return fetchApi<CostingCategoryDetail>(`/api/v1/costing/categories/${categoryId}`);
}

export async function updateCostingCategory(categoryId: string, input: Record<string, unknown>): Promise<CostingCategoryBackend> {
    return fetchApi<CostingCategoryBackend>(`/api/v1/costing/categories/${categoryId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export async function deleteCostingCategory(categoryId: string): Promise<{ deleted: true; id: string }> {
    return fetchApi<{ deleted: true; id: string }>(`/api/v1/costing/categories/${categoryId}`, {
        method: "DELETE",
    });
}

// ── Vendor Quotes ───────────────────────────────────────────────────────────

export async function addVendorQuote(input: {
    itemId: string;
    vendorName: string;
    quote: number;
    leadTimeDays?: number;
    rating?: number;
}): Promise<VendorQuote> {
    return fetchApi<VendorQuote>("/api/v1/costing/vendor-quotes", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function selectVendorQuote(quoteId: string, selected: boolean): Promise<VendorQuote> {
    return fetchApi<VendorQuote>(`/api/v1/costing/vendor-quotes/${quoteId}/selection`, {
        method: "POST",
        body: JSON.stringify({ selected }),
    });
}

// ── Analysis ────────────────────────────────────────────────────────────────

export async function getCostingAnalysis(): Promise<CostingAnalysisResponse> {
    return fetchApi<CostingAnalysisResponse>("/api/v1/costing/analysis");
}

// ── Margins ─────────────────────────────────────────────────────────────────

export async function getCostingMargins(): Promise<MarginAnalysisResponse> {
    return fetchApi<MarginAnalysisResponse>("/api/v1/costing/margins");
}

// ── Settings ────────────────────────────────────────────────────────────────

export async function getCostingSettings(): Promise<CostingSettingsResponse> {
    return fetchApi<CostingSettingsResponse>("/api/v1/costing/settings");
}

// ── Scenarios ───────────────────────────────────────────────────────────────

export async function getCostingScenarios(params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<CostingScenario>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    const query = searchParams.toString();
    return fetchApi<PaginatedResponse<CostingScenario>>(`/api/v1/costing/scenarios${query ? `?${query}` : ""}`);
}

export async function createCostingScenario(input: {
    boqId: string;
    name: string;
    description?: string;
    type?: string;
    scenarioType?: string;
    adjustments?: Array<{ name?: string; rate?: number | null }>;
}): Promise<CostingScenario> {
    return fetchApi<CostingScenario>("/api/v1/costing/scenarios", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function getCostingScenarioDetail(scenarioId: string): Promise<CostingScenario> {
    return fetchApi<CostingScenario>(`/api/v1/costing/scenarios/${scenarioId}`);
}

export async function updateCostingScenario(scenarioId: string, input: Record<string, unknown>): Promise<CostingScenario> {
    return fetchApi<CostingScenario>(`/api/v1/costing/scenarios/${scenarioId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export async function duplicateCostingScenario(scenarioId: string): Promise<CostingScenario> {
    return fetchApi<CostingScenario>(`/api/v1/costing/scenarios/${scenarioId}/duplicate`, {
        method: "POST",
    });
}

export async function duplicateCostingItem(itemId: string): Promise<CostingItemBackend> {
    const detail = await getCostingItemDetail(itemId);
    return createCostingItem({
        name: `${detail.name} (Copy)`,
        categoryId: detail.category_id || "",
        unit: detail.unit || "Nos",
        baseCost: Number(detail.base_cost ?? detail.baseCost ?? 0),
        sellingRate: Number(detail.selling_rate ?? detail.sellingRate ?? 0),
        preferredVendor: detail.preferred_vendor || detail.preferredVendor,
        spec: detail.spec,
        rateStatus: detail.rate_status || detail.rateStatus || "active",
        imageUrl: detail.image_url || detail.imageUrl,
    });
}

export async function duplicateCostingCategory(categoryId: string): Promise<CostingCategoryBackend> {
    const detail = await getCostingCategoryDetail(categoryId);
    return createCostingCategory({
        name: `${detail.name} (Copy)`,
        parentId: detail.parent_id || undefined,
        defaultUnit: detail.default_unit || "Nos",
        defaultTaxPercent: detail.default_tax_percent ?? 18,
        defaultMarkupPercent: detail.default_markup_percent ?? 0,
        defaultWastePercent: detail.default_waste_percent ?? 0,
        transportIncluded: detail.transport_included,
        labourIncluded: detail.labour_included,
        description: detail.description || undefined,
    });
}

export async function deleteCostingScenario(scenarioId: string): Promise<{ deleted: true; id: string }> {
    return fetchApi<{ deleted: true; id: string }>(`/api/v1/costing/scenarios/${scenarioId}`, {
        method: "DELETE",
    });
}

// ── BOQ & Costing Section Settings ──────────────────────────────────────────

export async function getBoqCostingSettings(): Promise<BoqCostingSettingsData> {
    const res = await fetchApi<{ section: string; data: Record<string, unknown> }>("/api/v1/settings/boq-costing");
    return adaptBoqCostingSettings(res.data);
}

export async function updateBoqCostingSettings(patch: Partial<BoqCostingSettingsData>): Promise<BoqCostingSettingsData> {
    const res = await fetchApi<{ section: string; data: Record<string, unknown> }>("/api/v1/settings/boq-costing", {
        method: "PATCH",
        body: JSON.stringify({ data: patch }),
    });
    return adaptBoqCostingSettings(res.data);
}
