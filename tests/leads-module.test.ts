import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const read = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("Leads — frontend-only data layer (backend to be integrated)", () => {
    const client = read("lib", "api", "leads.ts");
    const store = read("lib", "leads", "local-store.ts");

    it("serves every lead call from the browser store unless the backend flag is on", () => {
        expect(client).toContain('process.env.NEXT_PUBLIC_LEADS_BACKEND === "api"');
        for (const fn of ["listLeads", "listLeadBoard", "getLead", "createLead", "updateLead", "deleteLead", "exportLeads", "importLeads",
            "listLeadRelated", "listLeadCallLogs", "saveLeadCallLog", "deleteLeadCallLog", "listLeadNotes", "saveLeadNote", "deleteLeadNote"]) {
            const body = client.slice(client.indexOf(`function ${fn}`), client.indexOf(`function ${fn}`) + 400);
            expect(body, fn).toContain("if (!LEADS_BACKEND_ENABLED)");
        }
    });

    it("keeps the planned REST paths for the backend team", () => {
        for (const path of ["/api/v1/leads", "/api/v1/leads/export", "/api/v1/leads/import", "/call-logs", "/notes"]) {
            expect(client).toContain(path);
        }
    });

    it("persists to localStorage with sample data and the eight pipeline stages", () => {
        expect(store).toContain('const STORAGE_KEY = "boq-saas:leads:v1"');
        for (const stage of ["new", "contacted", "interested", "qualified", "unqualified", "lost", "won", "churned"]) {
            expect(store).toContain(`"${stage}"`);
        }
        expect(store).toContain("sampleStore");
    });
});

describe("Leads — pages and grouped sidebar", () => {
    it("ships list/board, detail and drawer components on the dashboard shell", () => {
        const list = read("app", "leads", "page.tsx");
        const detail = read("app", "leads", "[id]", "page.tsx");
        expect(list).toContain('DashboardRail current="/leads"');
        expect(list).toContain("LeadBoard");
        expect(list).toContain("Export Excel");
        expect(list).toContain("Import Excel");
        expect(detail).toContain("Lead Information");
        // Figma lead detail: Back link, Last Contacted, Export + Edit Lead (contact actions in the menu), per-tab create action.
        for (const text of ["WhatsApp", "ld-back", "Last Contacted", "ld-square-btn--primary", "runTabAction", 'label="Assign to"']) expect(detail).toContain(text);
        // Five KPI cards, as in the design.
        for (const k of ["Projects", "BOQ Value", "Invoices", "Moodboards", "Outstanding Amount"]) expect(detail).toContain(`label: "${k}", value:`);
        expect(detail).not.toContain("ld-breadcrumb");
        expect(detail).not.toContain('label="Lead Source"');
        for (const tab of ["Projects", "BOQs", "Proposals", "Invoices", "Moodboards", "Tasks", "Approvals", "Call Logs", "Notes"]) {
            expect(detail).toContain(`label: "${tab}"`);
        }
        const drawers = read("components", "leads", "LeadDrawers.tsx");
        expect(drawers).toContain("Add Lead");
        expect(drawers).toContain("New Call Log");
        expect(drawers).toContain("New Note");
    });

    it("groups the sidebar per Figma with Leads first and persists the expanded state", () => {
        const rail = read("components", "DashboardRail.tsx");
        const groups = ["Relationship & Projects", "Design & Estimation", "Sales & Finance", "Insights", "Administration"];
        let last = -1;
        for (const group of groups) {
            const at = rail.indexOf(`title: "${group}"`);
            expect(at).toBeGreaterThan(last);
            last = at;
        }
        expect(rail.indexOf('route: "/leads"')).toBeLessThan(rail.indexOf('route: "/projects"'));
        expect(rail).toContain("fig-side-menu");
        expect(rail).toContain('{ route: "/dashboard", icon: "dashboard-overview-active", label: "Overview" }');
        expect(read("app", "layout.tsx")).toContain("sidebarInitScript");
        expect(read("app", "globals.css")).toContain('html[data-sidebar="expanded"] body:has(.fig-side-menu) .fig-dashboard-main');
    });
});
