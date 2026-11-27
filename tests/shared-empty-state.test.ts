import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");

describe("Shared table empty state", () => {
    it("renders the BOQ illustration, a title, help text and an optional action", () => {
        const src = read("components/shared/TableEmptyState.tsx");
        expect(src).toContain("<BoqEmptyIllustration />");
        expect(src).toContain('className="tes-title"');
        expect(src).toContain('className="tes-btn"');
        expect(read("app/globals.css")).toMatch(/\.tes \{[^}]*min-height: 460px/);
    });

    it("is used by every list table instead of page-specific empty boxes", () => {
        const users: Record<string, string> = {
            "components/leads/LeadUi.tsx": "<TableEmptyState",
            "app/leads/[id]/page.tsx": "<TableEmptyState",
            "app/proposals/page.tsx": 'title="No Proposals found"',
            "app/invoices/page.tsx": 'title="No Invoices found"',
            "app/projects/page.tsx": 'title="No Projects found"',
            "app/templates/page.tsx": 'title="No Templates found"',
            "app/projects/[id]/page.tsx": 'title="No BOQs found"',
            "app/activities/page.tsx": ">No Tasks found<",
            "app/vendors/page.tsx": "<TableEmptyState",
            "app/costs/components/AnalysisTab.tsx": "<TableEmptyState",
        };
        for (const [file, marker] of Object.entries(users)) expect(read(file), file).toContain(marker);
    });
});
