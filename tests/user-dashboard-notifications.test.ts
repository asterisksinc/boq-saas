import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("User Dashboard Notifications UI & Figma Specifications", () => {
    const popoverPath = join(process.cwd(), "components", "header", "NotificationsPopover.tsx");
    const headerPath = join(process.cwd(), "components", "DashboardHeader.tsx");
    const cssPath = join(process.cwd(), "app", "globals.css");

    it("verifies notification components and files exist", () => {
        expect(existsSync(popoverPath)).toBe(true);
        expect(existsSync(headerPath)).toBe(true);
        expect(existsSync(cssPath)).toBe(true);
    });

    it("verifies NotificationsPopover matches Figma Frame 2147225093 container specifications", () => {
        const cssContent = readFileSync(cssPath, "utf-8");

        // Frame 2147225093
        expect(cssContent).toContain(".fig-dashboard-notifications {");
        expect(cssContent).toContain("width: 440px;");
        expect(cssContent).toContain("height: 557px;");
        expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6);");
        expect(cssContent).toContain("backdrop-filter: blur(5.5px);");
        expect(cssContent).toContain("border-radius: 16px;");
        expect(cssContent).toContain("padding: 16px;");
        expect(cssContent).toContain("gap: 16px;");
    });

    it("verifies Notifications Header matches Figma Frame 2147225549", () => {
        const popoverContent = readFileSync(popoverPath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        // Header structure
        expect(popoverContent).toContain("fig-notif-header");
        expect(popoverContent).toContain("fig-notif-title");
        expect(popoverContent).toContain("fig-notif-badge");
        expect(popoverContent).toContain("fig-notif-mark-all-btn");

        // Typography and badge styling
        expect(cssContent).toContain(".fig-notif-title {");
        expect(cssContent).toContain("font-size: 18px;");
        expect(cssContent).toContain("font-weight: 600;");
        expect(cssContent).toContain("color: #0F172A;");

        // Badge Frame 2147225014
        expect(cssContent).toContain(".fig-notif-badge {");
        expect(cssContent).toContain("background: #EF4444;");
        expect(cssContent).toContain("border-radius: 9999px;");
        expect(cssContent).toContain("padding: 2px 6px;");

        // Mark all as read button Frame 2147225525
        expect(cssContent).toContain(".fig-notif-mark-all-btn {");
        expect(cssContent).toContain("color: #2563EB;");
        expect(cssContent).toContain(".fig-notif-check-icon {");
        expect(cssContent).toContain("width: 14px;");
        expect(cssContent).toContain("height: 14px;");
    });

    it("verifies Category Filter Tabs bar matches Figma Buttons specifications", () => {
        const popoverContent = readFileSync(popoverPath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        // 5 tabs present in order
        expect(popoverContent).toContain('"All"');
        expect(popoverContent).toContain('"BOQ"');
        expect(popoverContent).toContain('"PROJECTS"');
        expect(popoverContent).toContain('"PAYMENTS"');
        expect(popoverContent).toContain('"SYSTEM"');

        // Tabs container styling
        expect(cssContent).toContain(".fig-notif-tabs {");
        expect(cssContent).toContain("height: 46px;");
        expect(cssContent).toContain("background: #FFFFFF;");
        expect(cssContent).toContain("border: 1px solid #E2E8F0;");
        expect(cssContent).toContain("border-radius: 6px;");
        expect(cssContent).toContain("padding: 6px;");
        expect(cssContent).toContain("gap: 6px;");

        // Tab button styling
        expect(cssContent).toContain(".fig-notif-tab {");
        expect(cssContent).toContain("padding: 7px 12px;");
        expect(cssContent).toContain("height: 34px;");
        expect(cssContent).toContain("border-radius: 4px;");
        expect(cssContent).toContain("font-size: 14px;");
        expect(cssContent).toContain("font-weight: 600;");

        // Active state
        expect(cssContent).toContain(".fig-notif-tab.is-active {");
        expect(cssContent).toContain("background: #EFF6FF;");
        expect(cssContent).toContain("color: #2563EB;");
    });

    it("verifies Notification List Card matches Figma Frame 2147225027 and item specs", () => {
        const popoverContent = readFileSync(popoverPath, "utf-8");
        const cssContent = readFileSync(cssPath, "utf-8");

        // Card container
        expect(cssContent).toContain(".fig-notif-body {");
        expect(cssContent).toContain("height: 425px;");
        expect(cssContent).toContain("background: #FFFFFF;");
        expect(cssContent).toContain("border-radius: 14px;");
        expect(cssContent).toContain("padding: 16px;");

        // Item layout Frame 2147225546
        expect(cssContent).toContain(".fig-notif-item {");
        expect(cssContent).toContain("gap: 12px;");
        expect(cssContent).toContain("border-bottom: 1px dashed rgba(100, 116, 139, 0.2);");

        // Avatar icon circle Frame 2147225550
        expect(cssContent).toContain(".fig-notif-avatar {");
        expect(cssContent).toContain("width: 34px;");
        expect(cssContent).toContain("height: 34px;");

        // Unread blue dot Ellipse 54
        expect(cssContent).toContain(".fig-notif-unread-dot {");
        expect(cssContent).toContain("width: 8px;");
        expect(cssContent).toContain("height: 8px;");
        expect(cssContent).toContain("background: #2563EB;");

        // Category tags
        expect(cssContent).toContain(".fig-notif-category-tag.tag-boq {");
        expect(cssContent).toContain("color: #16A34A;");
        expect(cssContent).toContain(".fig-notif-category-tag.tag-payments {");
        expect(cssContent).toContain("color: #EF4444;");
        expect(cssContent).toContain(".fig-notif-category-tag.tag-projects {");
        expect(cssContent).toContain("color: #2563EB;");
    });

    it("verifies all functional features and integrations remain intact", () => {
        const headerContent = readFileSync(headerPath, "utf-8");
        const popoverContent = readFileSync(popoverPath, "utf-8");

        // Fetching real notifications from backend
        expect(headerContent).toContain("getDashboardNotifications({ pageSize: 20 })");

        // Marking as read (single and all)
        expect(headerContent).toContain("markNotificationRead(id)");
        expect(headerContent).toContain("markAllNotificationsRead()");

        // Navigation when item is clicked
        expect(popoverContent).toContain("router.push(`/projects/${item.targetId}`)");
        expect(popoverContent).toContain('router.push("/boqs")');
        expect(popoverContent).toContain('router.push("/invoices")');

        // Opening / closing dropdown
        expect(headerContent).toContain('setActiveOverlay((prev) => (prev === "notifications" ? "none" : "notifications"))');

        // Loading, error, and empty state handling
        expect(popoverContent).toContain("loading && notifications.length === 0");
        expect(popoverContent).toContain("No notifications");
    });
});
