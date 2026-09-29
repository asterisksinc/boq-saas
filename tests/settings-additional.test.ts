import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import {
    additionalExportSchema,
    additionalRetentionSchema,
    deleteAccountSchema,
} from "../lib/api/validation";

describe("Settings → Additional Validation & Contract Tests", () => {
    describe("additionalExportSchema", () => {
        it("accepts valid category combinations", () => {
            expect(additionalExportSchema.parse({ categories: ["projects"] })).toEqual({
                categories: ["projects"],
            });
            expect(
                additionalExportSchema.parse({ categories: ["projects", "boqs"] })
            ).toEqual({
                categories: ["projects", "boqs"],
            });
            expect(
                additionalExportSchema.parse({
                    categories: ["projects", "boqs", "documents", "billing"],
                })
            ).toEqual({
                categories: ["projects", "boqs", "documents", "billing"],
            });
        });

        it("rejects empty categories array", () => {
            expect(() => additionalExportSchema.parse({ categories: [] })).toThrow();
        });

        it("rejects invalid categories", () => {
            expect(() =>
                additionalExportSchema.parse({ categories: ["projects", "invalid_category"] })
            ).toThrow();
        });
    });

    describe("additionalRetentionSchema", () => {
        it("accepts partial updates for retention fields", () => {
            expect(additionalRetentionSchema.parse({ autoDeleteDrafts: true })).toEqual({
                autoDeleteDrafts: true,
            });
            expect(additionalRetentionSchema.parse({ recycleBinDays: 90 })).toEqual({
                recycleBinDays: 90,
            });
            expect(additionalRetentionSchema.parse({ draftRetentionDays: 30 })).toEqual({
                draftRetentionDays: 30,
            });
            expect(
                additionalRetentionSchema.parse({
                    recycleBinDays: 60,
                    autoDeleteDrafts: false,
                    draftRetentionDays: 14,
                })
            ).toEqual({
                recycleBinDays: 60,
                autoDeleteDrafts: false,
                draftRetentionDays: 14,
            });
        });

        it("rejects empty objects", () => {
            expect(() => additionalRetentionSchema.parse({})).toThrow();
        });

        it("rejects out of range days", () => {
            expect(() => additionalRetentionSchema.parse({ recycleBinDays: 0 })).toThrow();
            expect(() => additionalRetentionSchema.parse({ recycleBinDays: -10 })).toThrow();
            expect(() => additionalRetentionSchema.parse({ recycleBinDays: 400 })).toThrow();
        });
    });

    describe("deleteAccountSchema", () => {
        it("accepts valid deletion payload", () => {
            expect(deleteAccountSchema.parse({})).toEqual({});
            expect(deleteAccountSchema.parse({ confirmation: "DELETE" })).toEqual({
                confirmation: "DELETE",
            });
            expect(
                deleteAccountSchema.parse({ confirmation: "DELETE", forceTransfer: true })
            ).toEqual({
                confirmation: "DELETE",
                forceTransfer: true,
            });
        });
    });
});

describe("ZIP Generation & Archival Capabilities", () => {
    it("generates a valid ZIP archive containing JSON and XLSX records with manifest", async () => {
        const zip = new JSZip();

        const sampleProjects = [
            { id: "p1", name: "Villa Renovation", status: "active", client_name: "John Doe" },
            { id: "p2", name: "Commercial Office", status: "completed", client_name: "Acme Corp" },
        ];

        // JSON file
        zip.file("projects/projects.json", JSON.stringify(sampleProjects, null, 2));

        // XLSX workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(sampleProjects);
        XLSX.utils.book_append_sheet(wb, ws, "Projects");
        const xlsxBuf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        zip.file("projects/projects.xlsx", xlsxBuf);

        // Manifest
        const manifest = {
            exportedAt: new Date().toISOString(),
            workspaceId: "test-workspace-id",
            categories: ["projects"],
            counts: { projects: 2 },
        };
        zip.file("manifest.json", JSON.stringify(manifest, null, 2));

        const buffer = await zip.generateAsync({ type: "nodebuffer" });
        expect(buffer.length).toBeGreaterThan(0);

        // Read back the zip to verify contents
        const loadedZip = await JSZip.loadAsync(buffer);
        expect(loadedZip.file("manifest.json")).not.toBeNull();
        expect(loadedZip.file("projects/projects.json")).not.toBeNull();
        expect(loadedZip.file("projects/projects.xlsx")).not.toBeNull();

        const manifestStr = await loadedZip.file("manifest.json")?.async("string");
        const parsedManifest = JSON.parse(manifestStr || "{}");
        expect(parsedManifest.workspaceId).toBe("test-workspace-id");
        expect(parsedManifest.counts.projects).toBe(2);

        const projectsStr = await loadedZip.file("projects/projects.json")?.async("string");
        const parsedProjects = JSON.parse(projectsStr || "[]");
        expect(parsedProjects).toHaveLength(2);
        expect(parsedProjects[0].name).toBe("Villa Renovation");
    });
});

describe("Settings → Additional Backend & Route Integration", () => {
    const routeContent = readFileSync("app/api/v1/[...path]/route.ts", "utf8");

    it("verifies dispatch routes for Additional settings and Account Deletion", () => {
        expect(routeContent).toContain('route === "users/me"');
        expect(routeContent).toContain('request.method === "DELETE" && route === "users/me"');
        expect(routeContent).toContain('route === "settings/additional/export"');
        expect(routeContent).toContain('route === "settings/additional/retention"');
    });

    it("verifies multi-tenant protection before account deletion", () => {
        expect(routeContent).toContain("deleteMeApi");
        expect(routeContent).toContain("workspace_memberships");
        expect(routeContent).toContain('m.role === "owner"');
        expect(routeContent).toContain("Please transfer workspace ownership before deleting your account");
        expect(routeContent).toContain("admin.auth.admin.deleteUser");
    });

    it("verifies data export packages real workspace data and manifest", () => {
        expect(routeContent).toContain("additionalDataExport");
        expect(routeContent).toContain("application/zip");
        expect(routeContent).toContain("Content-Disposition");
        expect(routeContent).toContain("manifest.json");
        expect(routeContent).toContain("settings.additional.exported");
    });

    it("verifies data retention endpoint handles recycle bin and auto-delete draft BOQs", () => {
        expect(routeContent).toContain("additionalRetentionApi");
        expect(routeContent).toContain("recycleBinDays");
        expect(routeContent).toContain("autoDeleteDrafts");
        expect(routeContent).toContain("draftRetentionDays");
        expect(routeContent).toContain("settings.retention.updated");
    });
});

describe("Settings → Additional Frontend & Page Integration", () => {
    const pageContent = readFileSync("app/settings/page.tsx", "utf8");
    const cssContent = readFileSync("app/globals.css", "utf8");

    it("verifies page.tsx integrates AdditionalSettingsLayout", () => {
        expect(pageContent).toContain(
            'import AdditionalSettingsLayout from "@/components/settings/additional/AdditionalSettingsLayout"'
        );
        expect(pageContent).toContain('if (activeTab === "additional") {');
        expect(pageContent).toContain("<AdditionalSettingsLayout");
    });

    it("verifies URL search params preservation for additional tab section", () => {
        expect(pageContent).toContain('tab !== "additional"');
    });

    it("verifies all component files exist in components/settings/additional", () => {
        expect(
            existsSync("components/settings/additional/AdditionalSettingsLayout.tsx")
        ).toBe(true);
        expect(
            existsSync("components/settings/additional/AdditionalSubNavigation.tsx")
        ).toBe(true);
        expect(existsSync("components/settings/additional/DataExportCard.tsx")).toBe(true);
        expect(
            existsSync("components/settings/additional/DataRetentionSection.tsx")
        ).toBe(true);
        expect(
            existsSync("components/settings/additional/DeleteAccountSection.tsx")
        ).toBe(true);
        expect(
            existsSync("components/settings/additional/DeleteAccountModal.tsx")
        ).toBe(true);
    });

    it("verifies CSS classes for Additional settings match reference designs", () => {
        expect(cssContent).toContain(".additional-settings-layout");
        expect(cssContent).toContain(".additional-subnav-panel");
        expect(cssContent).toContain(".additional-subnav-item.is-active");
        expect(cssContent).toContain(".additional-main-container");
        expect(cssContent).toContain(".additional-section-header");
        expect(cssContent).toContain(".additional-card-divider");
        expect(cssContent).toContain(".additional-checkbox-grid");
        expect(cssContent).toContain(".additional-checkbox-box.is-checked");
        expect(cssContent).toContain(".btn-additional-export");
        expect(cssContent).toContain(".additional-inner-card");
        expect(cssContent).toContain(".additional-toggle-switch.is-active");
        expect(cssContent).toContain(".danger-zone-container");
        expect(cssContent).toContain(".btn-danger-export");
        expect(cssContent).toContain(".btn-danger-delete");
    });
});
