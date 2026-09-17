import { describe, expect, it } from "vitest";
import { mapBoqListItem, normalizeBoqStatus } from "../lib/domain/boq-data";

describe("BOQ data flow mapping", () => {
    it("normalizes backend status values into the UI contract", () => {
        expect(normalizeBoqStatus("draft")).toBe("DRAFT");
        expect(normalizeBoqStatus("in_review")).toBe("IN REVIEW");
        expect(normalizeBoqStatus("pending approval")).toBe("IN REVIEW");
        expect(normalizeBoqStatus("approved")).toBe("APPROVED");
        expect(normalizeBoqStatus("archived")).toBe("ARCHIVED");
    });

    it("maps paged API data to the BOQ list shape used by the page", () => {
        const item = mapBoqListItem({
            id: "b1",
            boqNumber: "BOQ-0071",
            projectId: "p1",
            projectName: "Oberoi Residence",
            version: "v2",
            status: "in_review",
            roomCount: 6,
            itemCount: 42,
            grandTotal: 1540000,
            assignedTo: "user-1",
            assignedToName: "Riya Sharma",
            createdAt: "2026-09-01T00:00:00.000Z",
        });

        expect(item.id).toBe("b1");
        expect(item.projectId).toBe("p1");
        expect(item.projectName).toBe("Oberoi Residence");
        expect(item.status).toBe("IN REVIEW");
        expect(item.estimatedValue).toBe(1540000);
        expect(item.assignedTo).toBe("Riya Sharma");
        expect(item.date).toMatch(/Sep|Sep 2026/);
    });

    it("gracefully falls back when project name or assignee name is omitted", () => {
        const item = mapBoqListItem({
            id: "b2",
            boqNumber: "BOQ-0072",
            projectId: "p2",
            assignedTo: "55555555-5555-4555-8555-555555555555",
        });

        expect(item.projectName).toBe("Untitled project");
        expect(item.assignedTo).toBe("Unassigned");
        expect(item.status).toBe("DRAFT");
        expect(item.rooms).toBe(0);
        expect(item.items).toBe(0);
        expect(item.estimatedValue).toBe(0);
    });
});
