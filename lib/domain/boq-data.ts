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
