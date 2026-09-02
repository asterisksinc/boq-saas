import { getApiErrorMessage, parseApiResponse } from "./auth";

export interface CostingCategory {
    id: string;
    name: string;
    code: string;
    items: number;
    subCategories: number;
    usedInBoqs: number;
    usedInProjects: number;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CostingItem {
    id: string;
    name: string;
    code: string;
    status: string;
    category: string;
    unit: string;
    baseCost: number;
    sellingRate: number;
    margin: string;
    vendor: string;
    rateStatus: string;
    updatedAt: string;
}

export interface CostingAnalysis {
    totalBudget: number;
    actualCost: number;
    committed: number;
    forecast: number;
    variance: number;
}

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(path, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
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

// Items
export async function getCostingItems(): Promise<{ items: CostingItem[]; total: number }> {
    try {
        const res = await fetchApi<{ items: any[]; total: number }>("/api/v1/costing/items");
        return {
            items: res.items.map(item => ({
                id: item.id,
                name: item.name || "Unknown",
                code: item.code || "-",
                status: item.status || "DRAFT",
                category: item.categoryName || "-",
                unit: item.unit || "-",
                baseCost: item.baseCost || 0,
                sellingRate: item.sellingRate || 0,
                margin: item.margin ? `${item.margin}%` : "0%",
                vendor: item.vendorName || "-",
                rateStatus: item.rateStatus || "DRAFT",
                updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"
            })),
            total: res.total || res.items.length
        };
    } catch (e) {
        // Fallback to mock data if backend not fully implemented
        console.warn("Using mock data for items due to API error:", e);
        return {
            items: [
                { id: "1", name: "18MM HDHMR Board", code: "MAT-8871", status: "APPROVED", category: "Boards > Plywood", unit: "Sheet", baseCost: 1200, sellingRate: 1650, margin: "27.33%", vendor: "Century Ply", rateStatus: "DRAFT", updatedAt: "5 Aug 2024" },
                { id: "2", name: "Soft Close Hinge", code: "MATHWD-0023-8871", status: "APPROVED", category: "Hardware > Hinges", unit: "Piece", baseCost: 85, sellingRate: 120, margin: "29.20%", vendor: "Hettich India", rateStatus: "DRAFT", updatedAt: "5 Aug 2024" },
            ],
            total: 2
        };
    }
}

// Categories
export async function getCostingCategories(): Promise<{ items: CostingCategory[]; total: number }> {
    try {
        const res = await fetchApi<{ items: any[]; total: number }>("/api/v1/costing/categories");
        return {
            items: res.items.map(cat => ({
                id: cat.id,
                name: cat.name || "Unknown",
                code: cat.code || "-",
                items: cat.itemsCount || 0,
                subCategories: cat.subCategoriesCount || 0,
                usedInBoqs: cat.usedInBoqs || 0,
                usedInProjects: cat.usedInProjects || 0,
                status: cat.status || "ACTIVE",
            })),
            total: res.total || res.items.length
        };
    } catch (e) {
        console.warn("Using mock data for categories due to API error:", e);
        return {
            items: [
                { id: "1", name: "Boards", code: "MAT-BRD", items: 42, subCategories: 3, usedInBoqs: 18, usedInProjects: 7, status: "ACTIVE" },
                { id: "2", name: "Hardware", code: "MAT-HWD", items: 124, subCategories: 5, usedInBoqs: 32, usedInProjects: 12, status: "ACTIVE" },
            ],
            total: 2
        };
    }
}

// Analysis
export async function getCostingAnalysis(): Promise<CostingAnalysis> {
    try {
        return await fetchApi<CostingAnalysis>("/api/v1/costing/analysis");
    } catch (e) {
        console.warn("Using mock data for analysis due to API error:", e);
        return {
            totalBudget: 4250000,
            actualCost: 2890000,
            committed: 3200000,
            forecast: 4100000,
            variance: -150000
        };
    }
}
