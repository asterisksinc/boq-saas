export type BoqStatusUi = "DRAFT" | "IN REVIEW" | "APPROVED";

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
            return "IN REVIEW";
        case "approved":
            return "APPROVED";
        case "draft":
        default:
            return "DRAFT";
    }
}

export function mapBoqListItem(payload: BoqListApiItem): BoqListItem {
    const date = payload.createdAt ? new Date(payload.createdAt) : new Date();

    return {
        id: payload.id,
        boqNumber: payload.boqNumber,
        projectName: payload.projectName || "Untitled project",
        version: payload.version || "v1",
        rooms: Number(payload.roomCount ?? 0),
        items: Number(payload.itemCount ?? 0),
        estimatedValue: Number(payload.grandTotal ?? 0),
        assignedTo: payload.assignedToName || payload.assignedTo || "Unassigned",
        date: date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }),
        status: normalizeBoqStatus(payload.status),
    };
}
