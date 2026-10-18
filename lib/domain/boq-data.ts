export type BoqStatusUi = "DRAFT" | "IN REVIEW" | "APPROVED" | "ARCHIVED";

export type BoqListApiItem = {
    id: string;
    boqNumber: string;
    projectId?: string | null;
    projectName?: string | null;
    version?: string | null;
    status?: string | null;
    roomCount?: number | null;
    itemCount?: number | null;
    grandTotal?: number | null;
    assignedTo?: string | null;
    assignedToName?: string | null;
    createdAt?: string | null;
};

export type BoqListItem = {
    id: string;
    boqNumber: string;
    projectId: string | null;
    projectName: string;
    version: string;
    rooms: number;
    items: number;
    estimatedValue: number;
    assignedTo: string;
    date: string;
    status: BoqStatusUi;
};

export function normalizeBoqStatus(status?: string | null): BoqStatusUi {
    switch ((status ?? "draft").toLowerCase()) {
        case "in_review":
        case "in-review":
        case "pending approval":
        case "pending_approval":
            return "IN REVIEW";
        case "approved":
            return "APPROVED";
        case "archived":
            return "ARCHIVED";
        case "draft":
        default:
            return "DRAFT";
    }
}

export function mapBoqListItem(payload: BoqListApiItem): BoqListItem {
    const date = payload.createdAt ? new Date(payload.createdAt) : new Date();
    const isUuid = (val?: string | null) =>
        Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

    return {
        id: payload.id,
        boqNumber: payload.boqNumber,
        projectId: payload.projectId || null,
        projectName: payload.projectName || "Untitled project",
        version: payload.version || "v1",
        rooms: Number(payload.roomCount ?? 0),
        items: Number(payload.itemCount ?? 0),
        estimatedValue: Number(payload.grandTotal ?? 0),
        assignedTo: payload.assignedToName || (payload.assignedTo && !isUuid(payload.assignedTo) ? payload.assignedTo : "Unassigned"),
        date: date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }),
        status: normalizeBoqStatus(payload.status),
    };
}

export function formatCompactCurrency(value: number | null | undefined, currency = "INR"): string {
    if (value === null || value === undefined || isNaN(value) || value === 0) return "₹0";
    const symbol = currency === "INR" ? "₹" : `${currency} `;
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (abs >= 10000000) {
        const cr = abs / 10000000;
        const numStr = Number.isInteger(cr)
            ? String(cr)
            : cr >= 10
            ? cr.toFixed(1).replace(/\.0$/, "")
            : cr.toFixed(2).replace(/\.?0+$/, "");
        return `${sign}${symbol}${numStr}Cr`;
    }
    if (abs >= 100000) {
        const l = abs / 100000;
        const numStr = Number.isInteger(l)
            ? String(l)
            : l >= 10
            ? l.toFixed(1).replace(/\.0$/, "")
            : l.toFixed(2).replace(/\.?0+$/, "");
        return `${sign}${symbol}${numStr}L`;
    }
    if (abs >= 1000) {
        const k = abs / 1000;
        const numStr = Number.isInteger(k) ? String(k) : k.toFixed(1).replace(/\.0$/, "");
        return `${sign}${symbol}${numStr}k`;
    }
    return `${sign}${symbol}${new Intl.NumberFormat("en-IN").format(abs)}`;
}

export function formatBoqDisplayDate(value: string | null | undefined): string {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const day = d.getDate();
    const month = d.toLocaleDateString("en-IN", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
}

export function formatFullIndianCurrency(val: number | null | undefined, forceDecimals = false): string {
    if (val === null || val === undefined || isNaN(val)) return "₹0";
    const abs = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    const hasCents = forceDecimals || (abs % 1 !== 0);
    const formatted = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: hasCents ? 2 : 0,
    }).format(abs);
    return `${sign}₹${formatted}`;
}


