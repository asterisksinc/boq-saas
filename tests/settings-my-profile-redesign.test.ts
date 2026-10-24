import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Settings My Profile Redesign — Figma Precision & Dynamic Data", () => {
    const globalsCss = fs.readFileSync(path.resolve(process.cwd(), "app/globals.css"), "utf8");
    const settingsPageTsx = fs.readFileSync(path.resolve(process.cwd(), "app/settings/page.tsx"), "utf8");
    const myProfileTsx = fs.readFileSync(path.resolve(process.cwd(), "components/settings/MyProfile.tsx"), "utf8");
    const securitySettingsTsx = fs.readFileSync(path.resolve(process.cwd(), "components/settings/SecuritySettings.tsx"), "utf8");
    const preferencesSettingsTsx = fs.readFileSync(path.resolve(process.cwd(), "components/settings/PreferencesSettings.tsx"), "utf8");
    const segmentedControlTsx = fs.readFileSync(path.resolve(process.cwd(), "components/settings/PreferenceSegmentedControl.tsx"), "utf8");
    const changePasswordModalTsx = fs.readFileSync(path.resolve(process.cwd(), "components/settings/ChangePasswordModal.tsx"), "utf8");

    it("verifies parent User Dashboard integration and absence of duplicate shells", () => {
        // MyProfile is rendered inside app/settings/page.tsx when activeTab === 'profile'
        expect(settingsPageTsx).toContain('<MyProfile');
        expect(settingsPageTsx).toContain('activeTab === "profile"');

        // Must not recreate duplicate headers or search bars inside MyProfile
        expect(myProfileTsx).not.toContain('<DashboardHeader');
        expect(myProfileTsx).not.toContain('<DashboardRail');
        expect(myProfileTsx).not.toContain('fig-dashboard-glow');

        // Root container tokens
        expect(globalsCss).toMatch(/\.profile-redesign-container\s*\{[^}]*max-width:\s*1326px;/);
        expect(globalsCss).toMatch(/\.profile-layout-grid\s*\{[^}]*gap:\s*8px;/);
        expect(globalsCss).toMatch(/\.profile-layout-grid\s*\{[^}]*max-width:\s*1326px;/);
    });

    it("verifies Select Menu Sidebar matches Figma Frame 93 & 2147225533 specifications", () => {
        // Frame 93 container: 258px width, 169px height, rgba(255, 255, 255, 0.6) bg, 6px radius, 10px padding, 12px gap
        expect(globalsCss).toMatch(/\.profile-sidebar-card\s*\{[^}]*width:\s*258px;/);
        expect(globalsCss).toMatch(/\.profile-sidebar-card\s*\{[^}]*height:\s*169px;/);
        expect(globalsCss).toMatch(/\.profile-sidebar-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        expect(globalsCss).toMatch(/\.profile-sidebar-card\s*\{[^}]*border-radius:\s*6px;/);
        expect(globalsCss).toMatch(/\.profile-sidebar-card\s*\{[^}]*padding:\s*10px;/);
        expect(globalsCss).toMatch(/\.profile-sidebar-card\s*\{[^}]*gap:\s*12px;/);

        // Header: SELECT MENU, Urbanist 500, 14px, uppercase, #64748B
        expect(globalsCss).toMatch(/\.profile-sidebar-header\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.profile-sidebar-header\s*\{[^}]*font-weight:\s*500;/);
        expect(globalsCss).toMatch(/\.profile-sidebar-header\s*\{[^}]*text-transform:\s*uppercase;/);
        expect(globalsCss).toMatch(/\.profile-sidebar-header\s*\{[^}]*color:\s*#64748B;/i);

        // Frame 2147225533: width 238px, gap 6px
        expect(globalsCss).toMatch(/\.profile-sidebar-nav\s*\{[^}]*width:\s*238px;/);
        expect(globalsCss).toMatch(/\.profile-sidebar-nav\s*\{[^}]*gap:\s*6px;/);

        // Subnav buttons: width 238px, height 36px, padding 7px 10px, radius 4px
        expect(globalsCss).toMatch(/\.profile-sidebar-item\s*\{[^}]*width:\s*238px;/);
        expect(globalsCss).toMatch(/\.profile-sidebar-item\s*\{[^}]*height:\s*36px;/);
        expect(globalsCss).toMatch(/\.profile-sidebar-item\s*\{[^}]*padding:\s*7px 10px;/);
        expect(globalsCss).toMatch(/\.profile-sidebar-item\s*\{[^}]*border-radius:\s*4px;/);
        expect(globalsCss).toMatch(/\.profile-sidebar-item\s*\{[^}]*background:\s*#FFFFFF;/i);
        expect(globalsCss).toMatch(/\.profile-sidebar-item\s*\{[^}]*color:\s*#64748B;/i);

        // Active state: border 1px solid #2563EB, text #2563EB, font-weight 600
        expect(globalsCss).toMatch(/\.profile-sidebar-item\.active\s*\{[^}]*border:\s*1px solid #2563EB;/i);
        expect(globalsCss).toMatch(/\.profile-sidebar-item\.active\s*\{[^}]*color:\s*#2563EB;/i);
        expect(globalsCss).toMatch(/\.profile-sidebar-item\.active\s*\{[^}]*font-weight:\s*600;/);

        // Subnav contains all 3 menu items
        expect(myProfileTsx).toContain("Personal Info");
        expect(myProfileTsx).toContain("Security");
        expect(myProfileTsx).toContain("Preferences");
    });

    it("verifies Personal Info screen matches Figma Frame 2147225143 specifications", () => {
        // Content Area Frame 2147225541: width 1060px, align-items flex-end, gap 8px
        expect(globalsCss).toMatch(/\.profile-content-area\s*\{[^}]*width:\s*1060px;/);
        expect(globalsCss).toMatch(/\.profile-content-area\s*\{[^}]*align-items:\s*flex-end;/);
        expect(globalsCss).toMatch(/\.profile-content-area\s*\{[^}]*gap:\s*8px;/);

        // Card Frame 2147225143: 1060px width, min-height 563px, rgba(255, 255, 255, 0.6), 6px radius, 20px padding, 20px gap
        expect(globalsCss).toMatch(/\.profile-content-card\s*\{[^}]*width:\s*1060px;/);
        expect(globalsCss).toMatch(/\.profile-content-card\s*\{[^}]*min-height:\s*563px;/);
        expect(globalsCss).toMatch(/\.profile-content-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        expect(globalsCss).toMatch(/\.profile-content-card\s*\{[^}]*border-radius:\s*6px;/);
        expect(globalsCss).toMatch(/\.profile-content-card\s*\{[^}]*padding:\s*20px;/);
        expect(globalsCss).toMatch(/\.profile-content-card\s*\{[^}]*gap:\s*20px;/);

        // Avatar Row Frame 2147225522: width 278px, height 58px, gap 12px
        expect(globalsCss).toMatch(/\.profile-avatar-row\s*\{[^}]*width:\s*278px;/);
        expect(globalsCss).toMatch(/\.profile-avatar-row\s*\{[^}]*height:\s*58px;/);
        expect(globalsCss).toMatch(/\.profile-avatar-row\s*\{[^}]*gap:\s*12px;/);

        // Ellipse 52: 58x58px, 50% border radius
        expect(globalsCss).toMatch(/\.profile-avatar-circle\s*\{[^}]*width:\s*58px;/);
        expect(globalsCss).toMatch(/\.profile-avatar-circle\s*\{[^}]*height:\s*58px;/);
        expect(globalsCss).toMatch(/\.profile-avatar-circle\s*\{[^}]*border-radius:\s*50%;/);

        // Button 1: Upload Photo: 117x34px, border 1px #E2E8F0, radius 6px, font 14px 600, color #0F172A
        expect(globalsCss).toMatch(/\.btn-upload-photo\s*\{[^}]*width:\s*117px;/);
        expect(globalsCss).toMatch(/\.btn-upload-photo\s*\{[^}]*height:\s*34px;/);
        expect(globalsCss).toMatch(/\.btn-upload-photo\s*\{[^}]*border:\s*1px solid #E2E8F0;/i);
        expect(globalsCss).toMatch(/\.btn-upload-photo\s*\{[^}]*border-radius:\s*6px;/);
        expect(globalsCss).toMatch(/\.btn-upload-photo\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.btn-upload-photo\s*\{[^}]*font-weight:\s*600;/);
        expect(globalsCss).toMatch(/\.btn-upload-photo\s*\{[^}]*color:\s*#0F172A;/i);

        // Button 2: Remove: 83x34px, border 1px #E2E8F0, radius 6px, font 14px 600, color #DC2626
        expect(globalsCss).toMatch(/\.btn-remove-photo\s*\{[^}]*width:\s*83px;/);
        expect(globalsCss).toMatch(/\.btn-remove-photo\s*\{[^}]*height:\s*34px;/);
        expect(globalsCss).toMatch(/\.btn-remove-photo\s*\{[^}]*border:\s*1px solid #E2E8F0;/i);
        expect(globalsCss).toMatch(/\.btn-remove-photo\s*\{[^}]*border-radius:\s*6px;/);
        expect(globalsCss).toMatch(/\.btn-remove-photo\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.btn-remove-photo\s*\{[^}]*font-weight:\s*600;/);
        expect(globalsCss).toMatch(/\.btn-remove-photo\s*\{[^}]*color:\s*#DC2626;/i);

        // 2-Column Form Grid Frame 2147225529: 1020px width, 2 columns of 500px, 20px gap
        expect(globalsCss).toMatch(/\.profile-form-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*500px\)\);/);
        expect(globalsCss).toMatch(/\.profile-form-grid\s*\{[^}]*gap:\s*20px;/);
        expect(globalsCss).toMatch(/\.profile-form-grid\s*\{[^}]*width:\s*1020px;/);

        // Input controls: height 48px, border 1px #E2E8F0, radius 8px, font 14px 500 #0F172A
        expect(globalsCss).toMatch(/\.profile-input\s*\{[^}]*height:\s*48px;/);
        expect(globalsCss).toMatch(/\.profile-input\s*\{[^}]*border:\s*1px solid #E2E8F0;/i);
        expect(globalsCss).toMatch(/\.profile-input\s*\{[^}]*border-radius:\s*8px;/);
        expect(globalsCss).toMatch(/\.profile-input\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.profile-input\s*\{[^}]*font-weight:\s*500;/);
        expect(globalsCss).toMatch(/\.profile-input\s*\{[^}]*color:\s*#0F172A;/i);

        // Select controls: height 48px, border 1px #E2E8F0, radius 8px
        expect(globalsCss).toMatch(/\.profile-select\s*\{[^}]*height:\s*48px;/);
        expect(globalsCss).toMatch(/\.profile-select\s*\{[^}]*border:\s*1px solid #E2E8F0;/i);
        expect(globalsCss).toMatch(/\.profile-select\s*\{[^}]*border-radius:\s*8px;/);

        // Save Changes Button Frame 2147225530: 119x46px, background #2563EB, radius 6px, white text Urbanist 600 14px
        expect(globalsCss).toMatch(/\.btn-profile-save\s*\{[^}]*width:\s*119px;/);
        expect(globalsCss).toMatch(/\.btn-profile-save\s*\{[^}]*height:\s*46px;/);
        expect(globalsCss).toMatch(/\.btn-profile-save\s*\{[^}]*background:\s*#2563EB;/i);
        expect(globalsCss).toMatch(/\.btn-profile-save\s*\{[^}]*border-radius:\s*6px;/);
        expect(globalsCss).toMatch(/\.btn-profile-save\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.btn-profile-save\s*\{[^}]*font-weight:\s*600;/);
        expect(globalsCss).toMatch(/\.btn-profile-save\s*\{[^}]*color:\s*#FFFFFF;/i);

        // Form fields in TSX
        expect(myProfileTsx).toContain("Full Name");
        expect(myProfileTsx).toContain("Job Title");
        expect(myProfileTsx).toContain("Department");
        expect(myProfileTsx).toContain("Email");
        expect(myProfileTsx).toContain("Phone");
        expect(myProfileTsx).toContain("Preferred Language");
        expect(myProfileTsx).toContain("Timezone");
        expect(myProfileTsx).toContain("Date Format");
        expect(myProfileTsx).toContain("Currency Display");
        expect(myProfileTsx).toContain("profile-field-empty");
    });

    it("verifies Security screen matches Figma specifications", () => {
        // Stack: 1060px width, gap 8px
        expect(globalsCss).toMatch(/\.security-cards-stack\s*\{[^}]*width:\s*1060px;/);
        expect(globalsCss).toMatch(/\.security-cards-stack\s*\{[^}]*gap:\s*8px;/);

        // Security card panels: 1060px width, rgba(255, 255, 255, 0.6) bg, 6px radius, 20px padding, 20px gap
        expect(globalsCss).toMatch(/\.security-target-card[^{]*\{[^}]*width:\s*1060px;/);
        expect(globalsCss).toMatch(/\.security-target-card[^{]*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/);
        expect(globalsCss).toMatch(/\.security-target-card[^{]*\{[^}]*border-radius:\s*6px;/);
        expect(globalsCss).toMatch(/\.security-target-card[^{]*\{[^}]*padding:\s*20px;/);
        expect(globalsCss).toMatch(/\.security-target-card[^{]*\{[^}]*gap:\s*20px;/);

        // Dividers: 1px height, background #E2E8F0
        expect(globalsCss).toMatch(/\.security-card-divider[^{]*\{[^}]*height:\s*1px;/);
        expect(globalsCss).toMatch(/\.security-card-divider[^{]*\{[^}]*background:\s*#E2E8F0;/i);

        // Change Password Button: 145x34px, border 1px #E2E8F0, radius 6px, Urbanist 600 14px #0F172A
        expect(globalsCss).toMatch(/\.btn-change-password\s*\{[^}]*width:\s*145px;/);
        expect(globalsCss).toMatch(/\.btn-change-password\s*\{[^}]*height:\s*34px;/);
        expect(globalsCss).toMatch(/\.btn-change-password\s*\{[^}]*border:\s*1px solid #E2E8F0;/i);
        expect(globalsCss).toMatch(/\.btn-change-password\s*\{[^}]*border-radius:\s*6px;/);
        expect(globalsCss).toMatch(/\.btn-change-password\s*\{[^}]*font-size:\s*14px;/);
        expect(globalsCss).toMatch(/\.btn-change-password\s*\{[^}]*font-weight:\s*600;/);
        expect(globalsCss).toMatch(/\.btn-change-password\s*\{[^}]*color:\s*#0F172A;/i);

        // Two-factor toggle: 40x22px, border-radius 77.5px, checked bg #2563EB, thumb 16x16px
        expect(globalsCss).toMatch(/\.security-toggle-switch\s*\{[^}]*width:\s*40px;/);
        expect(globalsCss).toMatch(/\.security-toggle-switch\s*\{[^}]*height:\s*22px;/);
        expect(globalsCss).toMatch(/\.security-toggle-switch\s*\{[^}]*border-radius:\s*77\.5px;/);
        expect(globalsCss).toMatch(/\.security-toggle-switch\.checked\s*\{[^}]*background:\s*#2563EB;/i);
        expect(globalsCss).toMatch(/\.security-toggle-switch\s+\.toggle-slider\s*\{[^}]*width:\s*16px;/);
        expect(globalsCss).toMatch(/\.security-toggle-switch\s+\.toggle-slider\s*\{[^}]*height:\s*16px;/);

        // Session & Provider item cards: height 82px, padding 20px, gap 12px, border 1px #E2E8F0, radius 6px
        expect(globalsCss).toMatch(/\.session-item-card[^{]*\{[^}]*height:\s*82px;/);
        expect(globalsCss).toMatch(/\.session-item-card[^{]*\{[^}]*padding:\s*20px;/);
        expect(globalsCss).toMatch(/\.session-item-card[^{]*\{[^}]*gap:\s*12px;/);
        expect(globalsCss).toMatch(/\.session-item-card[^{]*\{[^}]*border:\s*1px solid #E2E8F0;/i);
        expect(globalsCss).toMatch(/\.session-item-card[^{]*\{[^}]*border-radius:\s*6px;/);

        // Current badge: height 18px, padding 2px 6px, bg rgba(22, 163, 74, 0.12), radius 4px, color #16A34A
        expect(globalsCss).toMatch(/\.badge-current-pill\s*\{[^}]*height:\s*18px;/);
        expect(globalsCss).toMatch(/\.badge-current-pill\s*\{[^}]*padding:\s*2px 6px;/);
        expect(globalsCss).toMatch(/\.badge-current-pill\s*\{[^}]*background:\s*rgba\(22,\s*163,\s*74,\s*0\.12\);/);
        expect(globalsCss).toMatch(/\.badge-current-pill\s*\{[^}]*border-radius:\s*4px;/);
        expect(globalsCss).toMatch(/\.badge-current-pill\s*\{[^}]*color:\s*#16A34A;/i);

        // Revoke button: 77x34px, border 1px #E2E8F0, radius 6px, color #DC2626
        expect(globalsCss).toMatch(/\.btn-revoke-session\s*\{[^}]*width:\s*77px;/);
        expect(globalsCss).toMatch(/\.btn-revoke-session\s*\{[^}]*height:\s*34px;/);
        expect(globalsCss).toMatch(/\.btn-revoke-session\s*\{[^}]*border:\s*1px solid #E2E8F0;/i);
        expect(globalsCss).toMatch(/\.btn-revoke-session\s*\{[^}]*border-radius:\s*6px;/);
        expect(globalsCss).toMatch(/\.btn-revoke-session\s*\{[^}]*color:\s*#DC2626;/i);

        // Provider buttons: height 34px, border 1px #E2E8F0, radius 6px, Urbanist 600 14px
        expect(globalsCss).toMatch(/\.btn-provider-action\s*\{[^}]*height:\s*34px;/);
        expect(globalsCss).toMatch(/\.btn-provider-action\s*\{[^}]*border:\s*1px solid #E2E8F0;/i);
        expect(globalsCss).toMatch(/\.btn-provider-action\s*\{[^}]*border-radius:\s*6px;/);
        expect(globalsCss).toMatch(/\.btn-provider-action\s*\{[^}]*color:\s*#0F172A;/i);

        // Sections in TSX
        expect(securitySettingsTsx).toContain("Password");
        expect(securitySettingsTsx).toContain("Two-Factor Authentication");
        expect(securitySettingsTsx).toContain("Active Sessions");
        expect(securitySettingsTsx).toContain("Connected Providers");
        expect(securitySettingsTsx).toContain("CURRENT");
        expect(securitySettingsTsx).toContain("Revoke");
    });

    it("verifies Preferences screen matches Figma specifications", () => {
        // Stack: 1060px width, gap 8px
        expect(globalsCss).toMatch(/\.preferences-cards-stack\s*\{[^}]*width:\s*1060px;/);
        expect(globalsCss).toMatch(/\.preferences-cards-stack\s*\{[^}]*gap:\s*8px;/);

        // Preference Display Card (Frame 95 & 97): 500px width, 82px height, padding 20px, gap 12px, border 1px #E2E8F0, radius 6px
        expect(globalsCss).toMatch(/\.pref-display-card\s*\{[^}]*width:\s*500px;/);
        expect(globalsCss).toMatch(/\.pref-display-card\s*\{[^}]*height:\s*82px;/);
        expect(globalsCss).toMatch(/\.pref-display-card\s*\{[^}]*padding:\s*20px;/);
        expect(globalsCss).toMatch(/\.pref-display-card\s*\{[^}]*border:\s*1px solid #E2E8F0;/i);
        expect(globalsCss).toMatch(/\.pref-display-card\s*\{[^}]*border-radius:\s*6px;/);

        // Segmented Control Buttons: height 42px, padding 0 14px, radius 8px
        expect(globalsCss).toMatch(/\.pref-segmented-btn\s*\{[^}]*height:\s*42px;/);
        expect(globalsCss).toMatch(/\.pref-segmented-btn\s*\{[^}]*padding:\s*0 14px;/);
        expect(globalsCss).toMatch(/\.pref-segmented-btn\s*\{[^}]*border-radius:\s*8px;/);

        // Segmented Control Selected State: bg rgba(37, 99, 235, 0.1), border 1px #2563EB, text #0F172A
        expect(globalsCss).toMatch(/\.pref-segmented-btn\.selected\s*\{[^}]*background:\s*rgba\(37,\s*99,\s*235,\s*0\.1\);/);
        expect(globalsCss).toMatch(/\.pref-segmented-btn\.selected\s*\{[^}]*border:\s*1px solid #2563EB;/i);
        expect(globalsCss).toMatch(/\.pref-segmented-btn\.selected\s*\{[^}]*color:\s*#0F172A;/i);

        // Radio indicator circles: 18x18px, 50% radius, selected bg #2563EB
        expect(globalsCss).toMatch(/\.pref-radio-indicator\s*\{[^}]*width:\s*18px;/);
        expect(globalsCss).toMatch(/\.pref-radio-indicator\s*\{[^}]*height:\s*18px;/);
        expect(globalsCss).toMatch(/\.pref-radio-indicator\s*\{[^}]*border-radius:\s*50%;/);
        expect(globalsCss).toMatch(/\.pref-radio-indicator\.selected\s*\{[^}]*background:\s*#2563EB;/i);

        // Navigation controls in TSX
        expect(preferencesSettingsTsx).toContain("Display");
        expect(preferencesSettingsTsx).toContain("Theme");
        expect(preferencesSettingsTsx).toContain("Density");
        expect(preferencesSettingsTsx).toContain("Navigation");
        expect(preferencesSettingsTsx).toContain("Default Landing Page");
        expect(preferencesSettingsTsx).toContain("Default Project View");
        expect(preferencesSettingsTsx).toContain("Email");
        expect(preferencesSettingsTsx).toContain("Email Digest");

        // Options
        expect(preferencesSettingsTsx).toContain("Dashboard");
        expect(preferencesSettingsTsx).toContain("Projects");
        expect(preferencesSettingsTsx).toContain("BOQs");
        expect(preferencesSettingsTsx).toContain("Costing");
        expect(preferencesSettingsTsx).toContain("Templates");
        expect(preferencesSettingsTsx).toContain("Analytics");

        // Preferences Save Changes button
        expect(preferencesSettingsTsx).toContain('className="btn-profile-save"');
        expect(preferencesSettingsTsx).toContain("Save Changes");
    });

    it("verifies Change Password Modal dialog matches system standards", () => {
        expect(changePasswordModalTsx).toContain('aria-modal="true"');
        expect(changePasswordModalTsx).toContain("Current Password");
        expect(changePasswordModalTsx).toContain("New Password");
        expect(changePasswordModalTsx).toContain("Confirm New Password");
        expect(changePasswordModalTsx).toContain("Update Password");

        // Modal container tokens
        expect(globalsCss).toMatch(/\.password-modal-content\s*\{[^}]*max-width:\s*440px;/);
        expect(globalsCss).toMatch(/\.password-modal-content\s*\{[^}]*border-radius:\s*14px;/);
        expect(globalsCss).toMatch(/\.btn-modal-submit\s*\{[^}]*background:\s*#2563eb;/i);
        expect(globalsCss).toMatch(/\.btn-modal-submit\s*\{[^}]*border-radius:\s*8px;/);
    });

    it("verifies responsive styles for mobile and tablet viewports", () => {
        // Media query collapses grid from 2-column to 1-column on narrower viewports
        expect(globalsCss).toContain("/* Responsive adjustments for Profile */");
        const profileRespIndex = globalsCss.indexOf("/* Responsive adjustments for Profile */");
        const mediaBlock = globalsCss.slice(profileRespIndex, profileRespIndex + 1500);

        expect(mediaBlock).toContain("@media (max-width: 1080px)");
        expect(mediaBlock).toMatch(/\.profile-layout-grid\s*\{[^}]*flex-direction:\s*column;/);
        expect(mediaBlock).toMatch(/\.profile-form-grid\s*\{[^}]*grid-template-columns:\s*1fr;/);
        expect(mediaBlock).toMatch(/\.preferences-grid-2col\s*\{[^}]*flex-direction:\s*column;/);
    });
});
