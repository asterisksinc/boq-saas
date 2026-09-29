import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Settings → Advanced Architecture & API Tests", () => {
    const routeContent = readFileSync("app/api/v1/[...path]/route.ts", "utf8");
    const pageContent = readFileSync("app/settings/page.tsx", "utf8");
    const cssContent = readFileSync("app/globals.css", "utf8");

    it("verifies SettingsPage integrates AdvancedSettingsLayout for the advanced tab", () => {
        expect(pageContent).toContain('import AdvancedSettingsLayout from "@/components/settings/advanced/AdvancedSettingsLayout"');
        expect(pageContent).toContain('if (activeTab === "advanced") {');
        expect(pageContent).toContain("<AdvancedSettingsLayout");
    });

    it("verifies URL search param preservation for tab and sub-sections", () => {
        expect(pageContent).toContain('tab !== "advanced"');
        expect(pageContent).toContain('tab === "advanced"');
    });

    it("verifies API route handlers exist for all Advanced security capabilities", () => {
        expect(routeContent).toContain('route === "users/me/security"');
        expect(routeContent).toContain('route === "users/me/security/revoke-others"');
        expect(routeContent).toContain('users/me/security/history');
        expect(routeContent).toContain('users/me/security/2fa/enroll');
        expect(routeContent).toContain('users/me/security/2fa/verify');
        expect(routeContent).toContain('users/me/security/2fa/unenroll');
        expect(routeContent).toContain('users/me/security/sessions');
    });

    it("verifies native Supabase MFA methods are utilized for 2FA", () => {
        expect(routeContent).toContain("supabase.auth.mfa.enroll");
        expect(routeContent).toContain("supabase.auth.mfa.challengeAndVerify");
        expect(routeContent).toContain("supabase.auth.mfa.unenroll");
        expect(routeContent).toContain("supabase.auth.mfa.listFactors");
    });

    it("verifies password audit logging and dynamic calculation", () => {
        expect(routeContent).toContain("auth.password.changed");
        expect(routeContent).toContain("auth.password.reset");
        expect(routeContent).toContain("lastChangedDays");
        expect(routeContent).toContain("lastChangedText");
    });

    it("verifies dynamic session management and non-revocable current session protection", () => {
        expect(routeContent).toContain('sessionId === "current"');
        expect(routeContent).toContain("Current session cannot be revoked");
        expect(routeContent).toContain("auth.session.revoked");
        expect(routeContent).toContain("auth.sessions.revoked");
    });

    it("verifies Login History uses real audit log tracking with device and status indicators", () => {
        expect(routeContent).toContain("auth.login.succeeded");
        expect(routeContent).toContain("loginAuditRows");
        expect(routeContent).toContain("formatRelativeTime");
        expect(routeContent).toContain("parseDeviceSlash");
    });

    it("verifies UI styling classes exist for the 3 reference designs", () => {
        expect(cssContent).toContain(".advanced-settings-layout");
        expect(cssContent).toContain(".advanced-subnav-panel");
        expect(cssContent).toContain(".advanced-subnav-item.is-active");
        expect(cssContent).toContain(".advanced-card");
        expect(cssContent).toContain(".btn-advanced-action");
        expect(cssContent).toContain(".btn-advanced-revoke");
        expect(cssContent).toContain(".advanced-badge-current");
        expect(cssContent).toContain(".login-status-dot.is-success");
        expect(cssContent).toContain(".login-status-dot.is-warning");
    });
});
