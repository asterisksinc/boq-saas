import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { adaptOverview } from "../lib/settings/adapter";
import { SettingsOverview } from "../lib/api/auth";

describe("Settings Overview Redesign — Figma Precision & Dynamic Data", () => {
    const globalsCss = fs.readFileSync(path.resolve(process.cwd(), "app/globals.css"), "utf8");
    const settingsPageTsx = fs.readFileSync(path.resolve(process.cwd(), "app/settings/page.tsx"), "utf8");
    const overviewTsx = fs.readFileSync(path.resolve(process.cwd(), "components/settings/SettingsOverview.tsx"), "utf8");
    const profileHeaderTsx = fs.readFileSync(path.resolve(process.cwd(), "components/settings/SettingsProfileHeader.tsx"), "utf8");
    const usageCardsTsx = fs.readFileSync(path.resolve(process.cwd(), "components/settings/SettingsUsageCards.tsx"), "utf8");
    const configHealthTsx = fs.readFileSync(path.resolve(process.cwd(), "components/settings/SettingsConfigurationHealth.tsx"), "utf8");
    const healthCardTsx = fs.readFileSync(path.resolve(process.cwd(), "components/settings/SettingsHealthCard.tsx"), "utf8");
    const recentChangesTsx = fs.readFileSync(path.resolve(process.cwd(), "components/settings/SettingsRecentChanges.tsx"), "utf8");
    const navTsx = fs.readFileSync(path.resolve(process.cwd(), "components/settings/SettingsNavigation.tsx"), "utf8");
    const skeletonTsx = fs.readFileSync(path.resolve(process.cwd(), "components/settings/SettingsSkeleton.tsx"), "utf8");

    it("verifies parent User Dashboard integration and absence of duplicate shells", () => {
        // Page must inherit .fig-dashboard and DashboardRail / DashboardHeader
        expect(settingsPageTsx).toContain('className="fig-dashboard boq-dashboard settings-page"');
        expect(settingsPageTsx).toContain('<DashboardRail current="/settings" />');
        expect(settingsPageTsx).toContain('<DashboardHeader');
        expect(settingsPageTsx).toContain('title="Settings"');

        // .settings-page must not override the background
        expect(globalsCss).toContain(".settings-page {");
        expect(globalsCss).toMatch(/\.settings-page\s*\{[^}]*background:\s*transparent;/);

        // .settings-page-container must have 24px vertical gap and no conflicting horizontal padding
        expect(globalsCss).toMatch(/\.settings-page-container\s*\{[^}]*gap:\s*24px;/);
        expect(globalsCss).toMatch(/\.settings-page-container\s*\{[^}]*padding:\s*0 0 48px;/);
    });

    it("verifies Settings Navigation tabs match Figma specifications", () => {
        // All required tabs present
        expect(navTsx).toContain('"overview"');
        expect(navTsx).toContain('"profile"');
        expect(navTsx).toContain('"organization"');
        expect(navTsx).toContain('"branding"');
        expect(navTsx).toContain('"boq-costing"');
        expect(navTsx).toContain('"integrations"');
        expect(navTsx).toContain('"notifications"');
        expect(navTsx).toContain('"security"');
        expect(navTsx).toContain('"advanced"');
        expect(navTsx).toContain('"additional"');

        // Nav bar container tokens: white, 1px border #e2e8f0, border-radius 6px, padding 6px, gap 6px, height 46px
        expect(globalsCss).toMatch(/\.settings-nav-bar\s*\{[^}]*background:\s*#ffffff;/);
        expect(globalsCss).toMatch(/\.settings-nav-bar\s*\{[^}]*border:\s*1px solid #e2e8f0;/);
        expect(globalsCss).toMatch(/\.settings-nav-bar\s*\{[^}]*border-radius:\s*6px;/);
        expect(globalsCss).toMatch(/\.settings-nav-bar\s*\{[^}]*padding:\s*6px;/);
        expect(globalsCss).toMatch(/\.settings-nav-bar\s*\{[^}]*gap:\s*6px;/);
        expect(globalsCss).toMatch(/\.settings-nav-bar\s*\{[^}]*height:\s*46px;/);

        // Tab item tokens: height 34px, padding 7px 10px, border-radius 4px, font-size 14px, weight 600
        expect(globalsCss).toMatch(/\.settings-nav-tab\s*\{[^}]*height:\s*34px;/);
        expect(globalsCss).toMatch(/\.settings-nav-tab\s*\{[^}]*padding:\s*7px 10px;/);
        expect(globalsCss).toMatch(/\.settings-nav-tab\s*\{[^}]*border-radius:\s*4px;/);
        expect(globalsCss).toMatch(/\.settings-nav-tab\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.settings-nav-tab\s*\{[^}]*font-weight:\s*600;/);
        expect(globalsCss).toMatch(/\.settings-nav-tab\s*\{[^}]*color:\s*#64748b;/);

        // Active tab: background #eff6ff, color #2563eb
        expect(globalsCss).toMatch(/\.settings-nav-tab\.is-active\s*\{[^}]*background:\s*#eff6ff;/);
        expect(globalsCss).toMatch(/\.settings-nav-tab\.is-active\s*\{[^}]*color:\s*#2563eb;/);
    });

    it("verifies Overview layout container gap matches Figma Frame 2147225520", () => {
        expect(globalsCss).toMatch(/\.settings-overview-layout\s*\{[^}]*gap:\s*8px;/);
        expect(overviewTsx).toContain("SettingsProfileHeader");
        expect(overviewTsx).toContain("SettingsUsageCards");
        expect(overviewTsx).toContain("SettingsConfigurationHealth");
        expect(overviewTsx).toContain("SettingsRecentChanges");
    });

    it("verifies Profile Summary Card matches Figma Frame 93", () => {
        // Card styling: padding 20px, gap 12px, min-height 117px, background rgba(255, 255, 255, 0.6), border-radius 6px
        expect(globalsCss).toMatch(/\.settings-profile-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        expect(globalsCss).toMatch(/\.settings-profile-card\s*\{[^}]*border-radius:\s*6px;/);
        expect(globalsCss).toMatch(/\.settings-profile-card\s*\{[^}]*padding:\s*20px;/);
        expect(globalsCss).toMatch(/\.settings-profile-card\s*\{[^}]*gap:\s*12px;/);
        expect(globalsCss).toMatch(/\.settings-profile-card\s*\{[^}]*min-height:\s*117px;/);

        // Avatar: 48x48px circular
        expect(globalsCss).toMatch(/\.settings-profile-avatar\s*\{[^}]*width:\s*48px;/);
        expect(globalsCss).toMatch(/\.settings-profile-avatar\s*\{[^}]*height:\s*48px;/);
        expect(globalsCss).toMatch(/\.settings-profile-avatar\s*\{[^}]*border-radius:\s*50%;/);

        // Typography: name 18px 500 #0f172a, subtitle 14px 500 #64748b
        expect(globalsCss).toMatch(/\.settings-profile-name\s*\{[^}]*font-size:\s*18px;/);
        expect(globalsCss).toMatch(/\.settings-profile-name\s*\{[^}]*font-weight:\s*500;/);
        expect(globalsCss).toMatch(/\.settings-profile-name\s*\{[^}]*color:\s*#0f172a;/);

        expect(globalsCss).toMatch(/\.settings-profile-subtitle\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.settings-profile-subtitle\s*\{[^}]*font-weight:\s*500;/);
        expect(globalsCss).toMatch(/\.settings-profile-subtitle\s*\{[^}]*color:\s*#64748b;/);

        // Edit Profile Button: 99x34px, border 1px #e2e8f0, radius 6px, font-size 14px, weight 600
        expect(globalsCss).toMatch(/\.settings-btn-edit-profile\s*\{[^}]*width:\s*99px;/);
        expect(globalsCss).toMatch(/\.settings-btn-edit-profile\s*\{[^}]*height:\s*34px;/);
        expect(globalsCss).toMatch(/\.settings-btn-edit-profile\s*\{[^}]*border:\s*1px solid #e2e8f0;/);
        expect(globalsCss).toMatch(/\.settings-btn-edit-profile\s*\{[^}]*border-radius:\s*6px;/);
        expect(globalsCss).toMatch(/\.settings-btn-edit-profile\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.settings-btn-edit-profile\s*\{[^}]*font-weight:\s*600;/);

        // Progress bar: track #dbebff, fill #2563eb, height 8px, fully rounded, percent 14px 500 #0f172a
        expect(globalsCss).toMatch(/\.settings-profile-progress-track\s*\{[^}]*background:\s*#dbebff;/);
        expect(globalsCss).toMatch(/\.settings-profile-progress-track\s*\{[^}]*height:\s*8px;/);
        expect(globalsCss).toMatch(/\.settings-profile-progress-fill\s*\{[^}]*background:\s*#2563eb;/);
        expect(globalsCss).toMatch(/\.settings-profile-progress-fill\s*\{[^}]*height:\s*8px;/);
        expect(globalsCss).toMatch(/\.settings-profile-progress-percent\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.settings-profile-progress-percent\s*\{[^}]*font-weight:\s*500;/);
        expect(globalsCss).toMatch(/\.settings-profile-progress-percent\s*\{[^}]*color:\s*#0f172a;/);

        // Modal integration
        expect(profileHeaderTsx).toContain("SettingsEditProfileModal");
    });

    it("verifies Statistics Cards match Figma Frame 2147225138", () => {
        // Container gap 8px
        expect(globalsCss).toMatch(/\.settings-kpi-grid\s*\{[^}]*gap:\s*8px;/);
        expect(globalsCss).toMatch(/\.settings-kpi-grid\s*\{[^}]*min-height:\s*94px;/);

        // Card styling: height 94px, padding 20px, gap 8px, background rgba(255, 255, 255, 0.6), radius 6px
        expect(globalsCss).toMatch(/\.settings-kpi-card\s*\{[^}]*height:\s*94px;/);
        expect(globalsCss).toMatch(/\.settings-kpi-card\s*\{[^}]*padding:\s*20px;/);
        expect(globalsCss).toMatch(/\.settings-kpi-card\s*\{[^}]*gap:\s*8px;/);
        expect(globalsCss).toMatch(/\.settings-kpi-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        expect(globalsCss).toMatch(/\.settings-kpi-card\s*\{[^}]*border-radius:\s*6px;/);

        // Label 14px 500 #64748b; Value 24px 500 #0f172a
        expect(globalsCss).toMatch(/\.settings-kpi-label\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.settings-kpi-label\s*\{[^}]*font-weight:\s*500;/);
        expect(globalsCss).toMatch(/\.settings-kpi-label\s*\{[^}]*color:\s*#64748b;/);
        expect(globalsCss).toMatch(/\.settings-kpi-value\s*\{[^}]*font-size:\s*24px;/);
        expect(globalsCss).toMatch(/\.settings-kpi-value\s*\{[^}]*font-weight:\s*500;/);
        expect(globalsCss).toMatch(/\.settings-kpi-value\s*\{[^}]*color:\s*#0f172a;/);

        // Usage cards component has Projects, BOQS, and Storage
        expect(usageCardsTsx).toContain("Projects");
        expect(usageCardsTsx).toContain("BOQS");
        expect(usageCardsTsx).toContain("Storage");
    });

    it("verifies Configuration Health Section matches Figma Frame 2147225140", () => {
        // Outer card: padding 20px, gap 20px, min-height 303px, background rgba(255, 255, 255, 0.6), radius 6px
        expect(globalsCss).toMatch(/\.settings-config-card\s*\{[^}]*padding:\s*20px;/);
        expect(globalsCss).toMatch(/\.settings-config-card\s*\{[^}]*gap:\s*20px;/);
        expect(globalsCss).toMatch(/\.settings-config-card\s*\{[^}]*min-height:\s*303px;/);
        expect(globalsCss).toMatch(/\.settings-config-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        expect(globalsCss).toMatch(/\.settings-config-card\s*\{[^}]*border-radius:\s*6px;/);

        // Heading: font-size 14px, weight 600, color #0f172a
        expect(globalsCss).toMatch(/\.settings-section-heading\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.settings-section-heading\s*\{[^}]*font-weight:\s*600;/);
        expect(globalsCss).toMatch(/\.settings-section-heading\s*\{[^}]*color:\s*#0f172a;/);
        expect(configHealthTsx).toContain("Configuration Health");

        // Grid: 4 columns repeat(4, 1fr), gap 8px
        expect(globalsCss).toMatch(/\.settings-health-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\);/);
        expect(globalsCss).toMatch(/\.settings-health-grid\s*\{[^}]*gap:\s*8px;/);

        // Inner health card: height 109px, padding 12px, gap 12px, background rgba(255, 255, 255, 0.8), radius 6px
        expect(globalsCss).toMatch(/\.settings-health-card\s*\{[^}]*height:\s*109px;/);
        expect(globalsCss).toMatch(/\.settings-health-card\s*\{[^}]*padding:\s*12px;/);
        expect(globalsCss).toMatch(/\.settings-health-card\s*\{[^}]*gap:\s*12px;/);
        expect(globalsCss).toMatch(/\.settings-health-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.8\);/);
        expect(globalsCss).toMatch(/\.settings-health-card\s*\{[^}]*border-radius:\s*6px;/);

        // Icon box: 38x38px, background #eff6ff, radius 8px, color #2563eb
        expect(globalsCss).toMatch(/\.settings-health-icon-box\s*\{[^}]*width:\s*38px;/);
        expect(globalsCss).toMatch(/\.settings-health-icon-box\s*\{[^}]*height:\s*38px;/);
        expect(globalsCss).toMatch(/\.settings-health-icon-box\s*\{[^}]*background:\s*#eff6ff;/);
        expect(globalsCss).toMatch(/\.settings-health-icon-box\s*\{[^}]*border-radius:\s*8px;/);
        expect(globalsCss).toMatch(/\.settings-health-icon-box\s*\{[^}]*color:\s*#2563eb;/);

        // Status badge: height 18px, padding 2px 6px, radius 9999px, 12px 500
        expect(globalsCss).toMatch(/\.settings-health-badge\s*\{[^}]*height:\s*18px;/);
        expect(globalsCss).toMatch(/\.settings-health-badge\s*\{[^}]*padding:\s*2px 6px;/);
        expect(globalsCss).toMatch(/\.settings-health-badge\s*\{[^}]*font-size:\s*12px;/);
        expect(globalsCss).toMatch(/\.settings-health-badge\s*\{[^}]*font-weight:\s*500;/);

        // Badges colors: DONE rgba(22, 163, 74, 0.12) / #16a34a, WARNING rgba(217, 119, 6, 0.12) / #d97706
        expect(globalsCss).toMatch(/\.settings-health-badge\.badge-done\s*\{[^}]*background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\);/);
        expect(globalsCss).toMatch(/\.settings-health-badge\.badge-done\s*\{[^}]*color:\s*#16a34a;/);
        expect(globalsCss).toMatch(/\.settings-health-badge\.badge-warning\s*\{[^}]*background:\s*rgba\(217,\s*119,\s*6,\s*0\.12\);/);
        expect(globalsCss).toMatch(/\.settings-health-badge\.badge-warning\s*\{[^}]*color:\s*#d97706;/);

        // Typography: title 14px 500 #0f172a, subtitle 12px 400 #64748b
        expect(globalsCss).toMatch(/\.settings-health-card-title\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.settings-health-card-title\s*\{[^}]*font-weight:\s*500;/);
        expect(globalsCss).toMatch(/\.settings-health-card-title\s*\{[^}]*color:\s*#0f172a;/);
        expect(globalsCss).toMatch(/\.settings-health-card-subtitle\s*\{[^}]*font-size:\s*12px;/);
        expect(globalsCss).toMatch(/\.settings-health-card-subtitle\s*\{[^}]*font-weight:\s*400;/);
        expect(globalsCss).toMatch(/\.settings-health-card-subtitle\s*\{[^}]*color:\s*#64748b;/);

        // Action button: 34x34px, background #ffffff, border 1px #e2e8f0, radius 6px, color #0f172a
        expect(globalsCss).toMatch(/\.settings-health-action-btn\s*\{[^}]*width:\s*34px;/);
        expect(globalsCss).toMatch(/\.settings-health-action-btn\s*\{[^}]*height:\s*34px;/);
        expect(globalsCss).toMatch(/\.settings-health-action-btn\s*\{[^}]*background:\s*#ffffff;/);
        expect(globalsCss).toMatch(/\.settings-health-action-btn\s*\{[^}]*border:\s*1px solid #e2e8f0;/);
        expect(globalsCss).toMatch(/\.settings-health-action-btn\s*\{[^}]*border-radius:\s*6px;/);
        expect(globalsCss).toMatch(/\.settings-health-action-btn\s*\{[^}]*color:\s*#0f172a;/);

        // Interactive click wiring
        expect(healthCardTsx).toContain("onClick={handleClick}");
        expect(healthCardTsx).toContain("settings-health-action-btn");
    });

    it("verifies Recent Changes Section matches Figma Frame 2147225141", () => {
        // Outer card: padding 20px, gap 20px, min-height 352px, background rgba(255, 255, 255, 0.6), radius 6px
        expect(globalsCss).toMatch(/\.settings-recent-card\s*\{[^}]*padding:\s*20px;/);
        expect(globalsCss).toMatch(/\.settings-recent-card\s*\{[^}]*gap:\s*20px;/);
        expect(globalsCss).toMatch(/\.settings-recent-card\s*\{[^}]*min-height:\s*352px;/);
        expect(globalsCss).toMatch(/\.settings-recent-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        expect(globalsCss).toMatch(/\.settings-recent-card\s*\{[^}]*border-radius:\s*6px;/);

        // Heading: "Recent Changes"
        expect(recentChangesTsx).toContain("Recent Changes");

        // Row item: height 35px, gap 16px
        expect(globalsCss).toMatch(/\.settings-recent-row\s*\{[^}]*height:\s*35px;/);
        expect(globalsCss).toMatch(/\.settings-recent-row\s*\{[^}]*gap:\s*16px;/);

        // Avatar: 32x32px, background #eff6ff, text #2563eb, 12px 600, circular
        expect(globalsCss).toMatch(/\.settings-recent-avatar\s*\{[^}]*width:\s*32px;/);
        expect(globalsCss).toMatch(/\.settings-recent-avatar\s*\{[^}]*height:\s*32px;/);
        expect(globalsCss).toMatch(/\.settings-recent-avatar\s*\{[^}]*background:\s*#eff6ff;/);
        expect(globalsCss).toMatch(/\.settings-recent-avatar\s*\{[^}]*color:\s*#2563eb;/);
        expect(globalsCss).toMatch(/\.settings-recent-avatar\s*\{[^}]*font-size:\s*12px;/);
        expect(globalsCss).toMatch(/\.settings-recent-avatar\s*\{[^}]*font-weight:\s*600;/);

        // Typography: actor 14px 500 #171717, desc 12px 400 #525866, time 12px 400 #525866
        expect(globalsCss).toMatch(/\.settings-recent-actor\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.settings-recent-actor\s*\{[^}]*font-weight:\s*500;/);
        expect(globalsCss).toMatch(/\.settings-recent-actor\s*\{[^}]*color:\s*#171717;/);
        expect(globalsCss).toMatch(/\.settings-recent-desc\s*\{[^}]*font-size:\s*12px;/);
        expect(globalsCss).toMatch(/\.settings-recent-desc\s*\{[^}]*font-weight:\s*400;/);
        expect(globalsCss).toMatch(/\.settings-recent-desc\s*\{[^}]*color:\s*#525866;/);
        expect(globalsCss).toMatch(/\.settings-recent-time\s*\{[^}]*font-size:\s*12px;/);
        expect(globalsCss).toMatch(/\.settings-recent-time\s*\{[^}]*font-weight:\s*400;/);
        expect(globalsCss).toMatch(/\.settings-recent-time\s*\{[^}]*color:\s*#525866;/);

        // Divider: height 1px, background #ebebeb
        expect(globalsCss).toMatch(/\.settings-recent-divider\s*\{[^}]*height:\s*1px;/);
        expect(globalsCss).toMatch(/\.settings-recent-divider\s*\{[^}]*background:\s*#ebebeb;/);
    });

    it("verifies dynamic data adapter transforms live backend data accurately", () => {
        const mockOverview: SettingsOverview = {
            profile: {
                displayName: "Arvin Interiors",
                email: "arvin@design.com",
                role: "owner",
                avatarUrl: "https://example.com/avatar.png",
                workspaceName: "Arvin Studio",
            },
            role: "owner",
            completionPercent: 85,
            usage: {
                projects: 12,
                boqs: 34,
                templates: 5,
                storageBytes: 1024 * 1024 * 1024 * 3.5, // 3.5 GB
                aiCredits: 100,
            },
            settings: {
                branding: { primaryLogo: "https://example.com/logo.png" },
                "boq-costing": { defaultTaxPercent: 18, defaultMarkupPercent: 15, currency: "INR" },
                security: { twoFactorRequired: true },
                integrations: { slack: { connected: true } },
            },
            workspace: {
                id: "ws-1",
                name: "Arvin Studio",
                profile: {
                    business_email: "contact@arvin.com",
                    tax_id: "27AAAAA0000A1Z5",
                },
            },
            recentChanges: [
                {
                    id: "change-1",
                    action: "settings.branding.updated",
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    actorUserId: "u-1",
                    actorName: "Arvin Designer",
                    actorInitials: "AD",
                },
            ],
        };

        const vm = adaptOverview(mockOverview);

        // Dynamic profile
        expect(vm.profile.name).toBe("Arvin Interiors");
        expect(vm.profile.email).toBe("arvin@design.com");
        expect(vm.profile.role).toBe("Owner");
        expect(vm.profile.avatarUrl).toBe("https://example.com/avatar.png");
        expect(vm.profile.completionPercent).toBe(85);

        // Dynamic usage
        expect(vm.usage.projects).toBe(12);
        expect(vm.usage.boqs).toBe(34);
        expect(vm.usage.templates).toBe(5);
        expect(vm.usage.storage).toBe("3.5 GB");

        // Dynamic health cards
        expect(vm.healthCards.length).toBe(7);
        const companyCard = vm.healthCards.find(c => c.id === "company-profile");
        expect(companyCard?.status).toBe("DONE");
        expect(companyCard?.subtitle).toBe("All required fields filled");

        const brandingCard = vm.healthCards.find(c => c.id === "branding");
        expect(brandingCard?.status).toBe("DONE");

        const gstCard = vm.healthCards.find(c => c.id === "gst-tax");
        expect(gstCard?.status).toBe("DONE");
        expect(gstCard?.subtitle).toBe("GSTIN verified");

        const boqCard = vm.healthCards.find(c => c.id === "boq-defaults");
        expect(boqCard?.status).toBe("DONE");

        const templateCard = vm.healthCards.find(c => c.id === "templates");
        expect(templateCard?.status).toBe("DONE");
        expect(templateCard?.subtitle).toBe("5 custom templates");

        const securityCard = vm.healthCards.find(c => c.id === "security");
        expect(securityCard?.status).toBe("DONE");
        expect(securityCard?.subtitle).toBe("2FA enabled");

        // Dynamic recent changes
        expect(vm.recentChanges.length).toBe(1);
        expect(vm.recentChanges[0].actorName).toBe("Arvin Designer");
        expect(vm.recentChanges[0].description).toBe("Updated brand identity & colors");
        expect(vm.recentChanges[0].timeAgo).toBe("1h ago");
    });
});
