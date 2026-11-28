import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEFAULT_PROJECT_STAGES, calculateStageProgress } from "../lib/domain/project-stages";

const NAMES = [
    "Enquiry", "Site Visit & Briefing", "Concept & Estimate", "BOQ & Proposal", "Client Review", "Agreement & Advance",
    "Design Finalisation", "Procurement & Production", "Site Execution", "Quality & Handover", "Project Completed",
    "On Hold", "Lost", "Cancelled",
];

describe("Standard project stages (Kanban columns)", () => {
    it("lists the 14 stages in order", () => {
        expect(DEFAULT_PROJECT_STAGES.map((s) => s.name)).toEqual(NAMES);
        expect(DEFAULT_PROJECT_STAGES.map((s) => s.sortOrder)).toEqual(NAMES.map((_, i) => i + 1));
    });

    it("advances progress across the 11 working stages; On Hold, Lost and Cancelled stay out", () => {
        const list = DEFAULT_PROJECT_STAGES.map((s, i) => ({ ...s, id: `s${i}` }));
        expect(calculateStageProgress("s0", list)).toBe(9.09);
        expect(calculateStageProgress("s4", list)).toBe(45.45);
        expect(calculateStageProgress("s9", list)).toBe(90.91);
        expect(calculateStageProgress("s10", list)).toBe(100);
        expect(calculateStageProgress("s11", list)).toBe(0);
        expect(calculateStageProgress("s12", list)).toBe(0);
        expect(calculateStageProgress("s13", list)).toBe(0);
        expect(calculateStageProgress("Concept & Estimate")).toBe(27.27);
    });

    it("migration seeds new workspaces and upgrades untouched ones in place", () => {
        const sql = readFileSync("supabase/migrations/20261128120000_standard_project_stages.sql", "utf8");
        for (const n of NAMES) expect(sql).toContain(`'${n}'`);
        expect(sql).toContain("create or replace function public.ensure_default_activity_stages");
        expect(sql).toMatch(/'Enquiry',\s+'#2563EB',\s+1, null,\s+'REQUIREMENT STATED'/);
    });
});
