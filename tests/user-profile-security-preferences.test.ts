import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { preferencesPatchSchema } from "../lib/api/validation";

describe("User Profile Security & Preferences Validation", () => {
    it("validates theme options correctly", () => {
        expect(preferencesPatchSchema.parse({ theme: "light" }).theme).toBe("light");
        expect(preferencesPatchSchema.parse({ theme: "dark" }).theme).toBe("dark");
        expect(preferencesPatchSchema.parse({ theme: "system" }).theme).toBe("system");
        expect(() => preferencesPatchSchema.parse({ theme: "neon" })).toThrow();
    });

    it("validates density options correctly", () => {
        expect(preferencesPatchSchema.parse({ density: "comfortable" }).density).toBe("comfortable");
        expect(preferencesPatchSchema.parse({ density: "compact" }).density).toBe("compact");
        expect(() => preferencesPatchSchema.parse({ density: "wide" })).toThrow();
    });

    it("validates project view options correctly", () => {
        expect(preferencesPatchSchema.parse({ projectView: "table" }).projectView).toBe("table");
        expect(preferencesPatchSchema.parse({ projectView: "card" }).projectView).toBe("card");
        expect(preferencesPatchSchema.parse({ project_view: "table" }).project_view).toBe("table");
        expect(() => preferencesPatchSchema.parse({ projectView: "kanban" })).toThrow();
    });

    it("validates landing page and email digest options", () => {
        expect(preferencesPatchSchema.parse({ landingPage: "dashboard" }).landingPage).toBe("dashboard");
        expect(preferencesPatchSchema.parse({ landingPage: "projects" }).landingPage).toBe("projects");
        expect(preferencesPatchSchema.parse({ landing_page: "boqs" }).landing_page).toBe("boqs");
        expect(preferencesPatchSchema.parse({ emailDigest: "weekly" }).emailDigest).toBe("weekly");
        expect(preferencesPatchSchema.parse({ emailDigest: "daily" }).emailDigest).toBe("daily");
        expect(preferencesPatchSchema.parse({ emailDigest: "off" }).emailDigest).toBe("off");
        expect(preferencesPatchSchema.parse({ email_digest: "weekly" }).email_digest).toBe("weekly");
    });

    it("preserves standard user preference fields (timezone, locale, dateFormat, currencyDisplay)", () => {
        const parsed = preferencesPatchSchema.parse({
            timezone: "Asia/Kolkata",
            locale: "en-IN",
            dateFormat: "DD/MM/YYYY",
            currencyDisplay: "INR",
            theme: "light",
            density: "comfortable",
            landingPage: "dashboard",
            projectView: "table",
            emailDigest: "weekly",
        });

        expect(parsed.timezone).toBe("Asia/Kolkata");
        expect(parsed.locale).toBe("en-IN");
        expect(parsed.dateFormat).toBe("DD/MM/YYYY");
        expect(parsed.currencyDisplay).toBe("INR");
        expect(parsed.theme).toBe("light");
        expect(parsed.density).toBe("comfortable");
    });
});

describe("Security & Avatar Architecture Verification", () => {
    const routeContent = readFileSync("app/api/v1/[...path]/route.ts", "utf8");

    it("verifies dedicated avatars storage bucket usage and signed URL generation", () => {
        expect(routeContent).toContain('.storage.from("avatars")');
        expect(routeContent).toContain("createSignedUrl(");
        expect(routeContent).toContain("user.avatar.updated");
        // Ensure legacy base64 fallback is eliminated
        expect(routeContent).not.toContain("data:image/jpeg;base64");
    });

    it("verifies security routes and handlers exist in API router", () => {
        expect(routeContent).toContain('route === "users/me/security"');
        expect(routeContent).toContain('route === "users/me/security/revoke-others"');
        expect(routeContent).toContain("async function userSecurity(");
        expect(routeContent).toContain("async function revokeOtherSessions(");
    });

    it("verifies password change audit log tracking for dynamic 'days ago' calculation", () => {
        expect(routeContent).toContain("auth.password.changed");
        expect(routeContent).toContain("auth.password.reset");
        expect(routeContent).toContain("lastChangedDays");
        expect(routeContent).toContain("lastChangedText");
    });
});
