import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
    leadCallLogPatchSchema,
    leadCallLogSchema,
    leadCreateSchema,
    leadNotePatchSchema,
    leadNoteSchema,
    leadPatchSchema,
} from "../lib/api/validation";

const read = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");
const PROJECT_ID = "8f2b1c9e-4d3a-4b6f-9a2e-1c3d5e7f9a0b";

describe("Leads — request validation", () => {
    it("requires name, linked project and source, and defaults the stage to new", () => {
        const parsed = leadCreateSchema.safeParse({ name: "Pradhyumn Dhondi", projectId: PROJECT_ID, source: "meta_ads" });
        expect(parsed.success).toBe(true);
        expect(parsed.data?.stage).toBe("new");
        expect(leadCreateSchema.safeParse({ name: "A", source: "meta_ads" }).success).toBe(false);
        expect(leadCreateSchema.safeParse({ name: "A", projectId: PROJECT_ID }).success).toBe(false);
        expect(leadCreateSchema.safeParse({ name: "", projectId: PROJECT_ID, source: "meta_ads" }).success).toBe(false);
    });

    it("normalises optional contact fields and rejects bad emails and unknown keys", () => {
        const parsed = leadCreateSchema.parse({ name: "A", projectId: PROJECT_ID, source: "referral", email: " Foo@Example.com ", phone: "" });
        expect(parsed.email).toBe("foo@example.com");
        expect(parsed.phone).toBeNull();
        expect(leadCreateSchema.safeParse({ name: "A", projectId: PROJECT_ID, source: "referral", email: "nope" }).success).toBe(false);
        expect(leadCreateSchema.safeParse({ name: "A", projectId: PROJECT_ID, source: "referral", workspaceId: PROJECT_ID }).success).toBe(false);
    });

    it("only accepts the eight Figma pipeline stages", () => {
        for (const stage of ["new", "contacted", "interested", "qualified", "unqualified", "lost", "won", "churned"]) {
            expect(leadPatchSchema.safeParse({ stage }).success).toBe(true);
        }
        expect(leadPatchSchema.safeParse({ stage: "archived" }).success).toBe(false);
    });

    it("patch schemas never inject defaults or clear omitted fields", () => {
        expect(leadPatchSchema.parse({ stage: "won" })).toEqual({ stage: "won" });
        expect(leadCallLogPatchSchema.parse({ title: "Follow-up" })).toEqual({ title: "Follow-up" });
        expect(leadNotePatchSchema.parse({ title: "Update" })).toEqual({ title: "Update" });
        expect(leadPatchSchema.safeParse({}).success).toBe(false);
    });

    it("validates call logs and notes", () => {
        expect(leadCallLogSchema.parse({ title: "Discovery", status: "connected" }).callType).toBe("outbound");
        expect(leadCallLogSchema.safeParse({ title: "Discovery", status: "connected", durationMinutes: 2000 }).success).toBe(false);
        expect(leadCallLogSchema.safeParse({ title: "Discovery" }).success).toBe(false);
        const note = leadNoteSchema.parse({ title: "Invoice Update", visibility: "private" });
        expect(note.noteType).toBe("general");
        expect(note.attachments).toEqual([]);
        expect(leadNoteSchema.safeParse({ title: "x" }).success).toBe(false);
    });
});

describe("Leads — API routes and migration", () => {
    const route = read("app", "api", "v1", "[...path]", "route.ts");
    const migration = read("supabase", "migrations", "20261125120000_leads.sql");

    it("registers list, CRUD, board, import/export, call log, note and related-record routes", () => {
        expect(route).toContain('route === "leads") return listLeads');
        expect(route).toContain('route === "leads") return createLead');
        expect(route).toContain('route === "leads/export") return exportLeads');
        expect(route).toContain('route === "leads/import") return importLeads');
        expect(route).toMatch(/leadMatch && request\.method === "PATCH"\) return updateLead/);
        expect(route).toMatch(/leadMatch && request\.method === "DELETE"\) return archiveLead/);
        expect(route).toContain("call-logs$/i");
        expect(route).toContain("notes$/i");
        expect(route).toContain("(projects|boqs|proposals|invoices|tasks|approvals)$/i");
    });

    it("scopes every lead query to the caller's workspace and checks write access", () => {
        const block = route.slice(route.indexOf("// Leads\n// ----"), route.indexOf("async function dispatch("));
        expect(block.length).toBeGreaterThan(1000);
        expect(block).toContain('workspaceAccess(supabase, id, true)');
        expect(block.match(/\.eq\("workspace_id"/g)?.length ?? 0).toBeGreaterThan(15);
        expect(block).toContain("assertLeadRefs");
    });

    it("creates RLS-protected tables with private-note visibility", () => {
        for (const table of ["leads", "lead_call_logs", "lead_notes"]) {
            expect(migration).toContain(`create table public.${table}`);
            expect(migration).toContain(`alter table public.${table} enable row level security`);
        }
        expect(migration).toContain("visibility = 'team' or created_by = (select auth.uid())");
        expect(migration).toContain("check (stage in ('new','contacted','interested','qualified','unqualified','lost','won','churned'))");
        expect(migration).toContain("bump_lead_last_contacted");
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
        expect(read("app", "layout.tsx")).toContain("sidebarInitScript");
        expect(read("app", "globals.css")).toContain('html[data-sidebar="expanded"] body:has(.fig-side-menu) .fig-dashboard-main');
    });
});
