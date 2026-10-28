import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
    getArticleCategory,
    getHelpfulPercentage,
    getReadMinutes,
    getArticleShortAnswer,
    formatDate,
    priorityConfig,
    statusConfig,
} from "../components/shared/help-support/help-helpers";
import { HelpArticle } from "../lib/api/auth";

describe("Shared Settings Architecture & Component Reuse", () => {
    it("verifies shared settings components exist in components/settings and components/shared/settings", () => {
        const requiredFiles = [
            "components/settings/SettingsLayout.tsx",
            "components/settings/SettingsNavigation.tsx",
            "components/settings/SettingsSection.tsx",
            "components/settings/SharedSettingsFormFields.tsx",
            "components/settings/SharedSettingsActions.tsx",
            "components/shared/settings/index.ts",
            "components/shared/settings/SettingsLayout.tsx",
            "components/shared/settings/SettingsNavigation.tsx",
            "components/shared/settings/SettingsSection.tsx",
            "components/shared/settings/SharedSettingsFormFields.tsx",
            "components/shared/settings/SharedSettingsActions.tsx",
        ];

        for (const file of requiredFiles) {
            const p = join(process.cwd(), file);
            expect(existsSync(p), `Missing shared settings component: ${file}`).toBe(true);
        }
    });

    it("verifies SettingsNavigation exports CLIENT_SETTINGS_NAV_ITEMS and default 10 user items", () => {
        const navPath = join(process.cwd(), "components", "settings", "SettingsNavigation.tsx");
        const code = readFileSync(navPath, "utf-8");

        // Exports CLIENT_SETTINGS_NAV_ITEMS with required client tabs
        expect(code).toContain("CLIENT_SETTINGS_NAV_ITEMS");
        expect(code).toContain('"profile"');
        expect(code).toContain('"My Profile"');
        expect(code).toContain('"notifications"');
        expect(code).toContain('"Notifications"');
        expect(code).toContain('"security"');
        expect(code).toContain('"Security & Sessions"');
        expect(code).toContain('"preferences"');
        expect(code).toContain('"Preferences"');

        // Default nav items for User Dashboard
        expect(code).toContain('"overview"');
        expect(code).toContain('"profile"');
        expect(code).toContain('"organization"');
        expect(code).toContain('"branding"');
        expect(code).toContain('"boq-costing"');
        expect(code).toContain('"integrations"');
        expect(code).toContain('"notifications"');
        expect(code).toContain('"security"');
        expect(code).toContain('"advanced"');
        expect(code).toContain('"additional"');

        // Uses established CSS classes
        expect(code).toContain('className="settings-nav-bar"');
        expect(code).toContain('className="settings-nav-tabs"');
        expect(code).toContain("settings-nav-tab");
        expect(code).toContain("is-active");
    });

    it("verifies SettingsLayout provides consistent Figma shell structure for both dashboards", () => {
        const layoutPath = join(process.cwd(), "components", "settings", "SettingsLayout.tsx");
        const code = readFileSync(layoutPath, "utf-8");

        expect(code).toContain('className={`fig-dashboard boq-dashboard settings-page ${className}`.trim()}');
        expect(code).toContain('className="fig-dashboard-glow"');
        expect(code).toContain('className="fig-dashboard-main"');
        expect(code).toContain('className="settings-page-container"');
        expect(code).toContain('className="settings-body-wrap"');
        expect(code).toContain('className={`notice-banner ${notice.type}`}');
    });

    it("verifies Client Settings page reuses SettingsLayout and SettingsNavigation with strict role isolation", () => {
        const clientSettingsPath = join(process.cwd(), "app", "client", "settings", "page.tsx");
        const code = readFileSync(clientSettingsPath, "utf-8");

        // Shell reuse
        expect(code).toContain("SettingsLayout");
        expect(code).toContain("SettingsNavigation");
        expect(code).toContain("ClientDashboardRail");
        expect(code).toContain('current="/client/settings"');
        expect(code).toContain('DashboardHeader title="Client Settings" hideNew={true}');

        // Reused core settings components
        expect(code).toContain("MyProfile");
        expect(code).toContain("SettingsNotifications");
        expect(code).toContain('userRole="client"');
        expect(code).toContain("SecuritySettings");
        expect(code).toContain("PreferencesSettings");
        expect(code).toContain("SettingsSkeleton");
        expect(code).toContain("SettingsErrorState");

        // Role isolation: Admin and internal workspace settings must NOT be imported or exposed
        expect(code).not.toContain("OrganizationSettings");
        expect(code).not.toContain("BrandingSettingsComponent");
        expect(code).not.toContain("BoqCostingLayout");
        expect(code).not.toContain("AdvancedSettingsLayout");
        expect(code).not.toContain("AdditionalSettingsLayout");
        expect(code).not.toContain("SecurityAccessLayout");
    });

    it("verifies SharedSettingsFormFields exports Field supporting all form control variants", () => {
        const fieldPath = join(process.cwd(), "components", "settings", "SharedSettingsFormFields.tsx");
        const code = readFileSync(fieldPath, "utf-8");

        expect(code).toContain("export function Field(");
        expect(code).toContain('type === "checkbox"');
        expect(code).toContain('type === "select"');
        expect(code).toContain('type === "textarea"');
        expect(code).toContain('type === "color"');
        expect(code).toContain('className="required"');
        expect(code).toContain("form-field");
        expect(code).toContain("form-input");
    });
});

describe("Shared Help & Support Architecture & Component Reuse", () => {
    it("verifies all shared help-support components exist in components/shared/help-support and components/help", () => {
        const requiredFiles = [
            "components/shared/help-support/help-helpers.ts",
            "components/shared/help-support/category-icons.tsx",
            "components/shared/help-support/HelpSkeletons.tsx",
            "components/shared/help-support/HelpSearch.tsx",
            "components/shared/help-support/ArticleContentRenderer.tsx",
            "components/shared/help-support/ArticleCard.tsx",
            "components/shared/help-support/HelpCategory.tsx",
            "components/shared/help-support/HelpSupportCta.tsx",
            "components/shared/help-support/ArticleDetailView.tsx",
            "components/shared/help-support/TicketsTableView.tsx",
            "components/shared/help-support/TicketDetailView.tsx",
            "components/shared/help-support/HelpSupportLayout.tsx",
            "components/shared/help-support/HelpSupportView.tsx",
            "components/shared/help-support/index.ts",
            "components/help/index.ts",
        ];

        for (const file of requiredFiles) {
            const p = join(process.cwd(), file);
            expect(existsSync(p), `Missing shared help component: ${file}`).toBe(true);
        }
    });

    it("verifies HelpSupportLayout provides consistent Figma glow and dashboard shell", () => {
        const layoutPath = join(process.cwd(), "components", "shared", "help-support", "HelpSupportLayout.tsx");
        const code = readFileSync(layoutPath, "utf-8");

        expect(code).toContain('className={`fig-dashboard boq-dashboard help-page ${className}`.trim()}');
        expect(code).toContain('className="help-gradient-glow"');
        expect(code).toContain('className="fig-dashboard-glow"');
        expect(code).toContain('className="fig-dashboard-main"');
        expect(code).toContain('className="help-content"');
        expect(code).toContain('className={`notice-banner ${notice.type}`}');
    });

    it("verifies Client Help page reuses HelpSupportView and imports help-redesign.css", () => {
        const clientHelpPath = join(process.cwd(), "app", "client", "help", "page.tsx");
        const code = readFileSync(clientHelpPath, "utf-8");

        expect(code).toContain('import "@/app/help/help-redesign.css";');
        expect(code).toContain("ClientDashboardRail");
        expect(code).toContain('current="/client/help"');
        expect(code).toContain('DashboardHeader title="Help & Support" hideNew={true}');
        expect(code).toContain("<TicketWizardDrawer");
        expect(code).toContain("HelpSupportView");
        expect(code).toContain('baseRoute="/client/help"');
        expect(code).toContain('role="client"');
        expect(code).toContain("getHelpOverview");
        expect(code).toContain("listSupportTickets");
    });

    it("verifies help-helpers accurately compute ratings, duration, categories, and date formats", () => {
        const mockArticle: HelpArticle = {
            id: "test-art-1",
            slug: "test-slug",
            title: "Test Article Title",
            summary: "Test summary text.",
            readMinutes: 3,
            helpfulYes: 18,
            helpfulNo: 2,
            category: { slug: "boqs-costing", name: "BOQs & Costing" },
            content: { shortAnswer: "This is the quick answer." },
        };

        // Category
        expect(getArticleCategory(mockArticle)?.slug).toBe("boqs-costing");
        expect(getArticleCategory(mockArticle)?.name).toBe("BOQs & Costing");

        // Helpful rating: 18 / (18 + 2) = 90%
        expect(getHelpfulPercentage(mockArticle)).toBe(90);

        // Rating denominator guard: < 5 total votes must return null
        const lowVotesArticle: HelpArticle = {
            ...mockArticle,
            helpfulYes: 2,
            helpfulNo: 1,
        };
        expect(getHelpfulPercentage(lowVotesArticle)).toBeNull();

        // Reading duration
        expect(getReadMinutes(mockArticle)).toBe(3);

        // Short answer
        expect(getArticleShortAnswer(mockArticle)).toBe("This is the quick answer.");

        // Priority and status configs
        expect(priorityConfig.urgent.label).toBe("Urgent");
        expect(statusConfig.open.label).toBe("Open");
        expect(statusConfig.resolved.color).toBe("#16a34a");

        // Date formatting
        expect(formatDate("2026-08-28T10:00:00Z")).toContain("2026");
    });

    it("verifies ArticleCard renders Figma 3-row layout and handles selection", () => {
        const cardPath = join(process.cwd(), "components", "shared", "help-support", "ArticleCard.tsx");
        const code = readFileSync(cardPath, "utf-8");

        expect(code).toContain('className="popular-article-card"');
        expect(code).toContain('className="card-top"');
        expect(code).toContain('className="card-icon-wrap"');
        expect(code).toContain('className="card-helpful-badge"');
        expect(code).toContain('className="card-middle"');
        expect(code).toContain('className="card-title"');
        expect(code).toContain('className="card-desc"');
        expect(code).toContain('className="card-bottom"');
        expect(code).toContain('className="card-category"');
        expect(code).toContain('className="card-read-time"');
    });

    it("verifies ArticleContentRenderer supports structured sections, HTML and plain text", () => {
        const rendererPath = join(process.cwd(), "components", "shared", "help-support", "ArticleContentRenderer.tsx");
        const code = readFileSync(rendererPath, "utf-8");

        expect(code).toContain('className="article-sections-flow"');
        expect(code).toContain('className="article-section-block"');
        expect(code).toContain('className="article-ordered-steps"');
        expect(code).toContain("dangerouslySetInnerHTML");
    });

    it("verifies HelpSupportCta presents the NEED A HUMAN callout with watermark", () => {
        const ctaPath = join(process.cwd(), "components", "shared", "help-support", "HelpSupportCta.tsx");
        const code = readFileSync(ctaPath, "utf-8");

        expect(code).toContain('className="cta-watermark"');
        expect(code).toContain('className="cta-tag"');
        expect(code).toContain("NEED A HUMAN?");
        expect(code).toContain('className="btn-cta-raise"');
        expect(code).toContain("Raise a Support Ticket");
    });

    it("verifies TicketsTableView and TicketDetailView support status updates, drafts, and replies", () => {
        const tablePath = join(process.cwd(), "components", "shared", "help-support", "TicketsTableView.tsx");
        const detailPath = join(process.cwd(), "components", "shared", "help-support", "TicketDetailView.tsx");

        const tableCode = readFileSync(tablePath, "utf-8");
        const detailCode = readFileSync(detailPath, "utf-8");

        // Table
        expect(tableCode).toContain('className="tickets-table"');
        expect(tableCode).toContain("category-pills");
        expect(tableCode).toContain("priority-badge");
        expect(tableCode).toContain("status-badge");

        // Detail
        expect(detailCode).toContain("Resume Wizard");
        expect(detailCode).toContain("Update Ticket Status:");
        expect(detailCode).toContain("Conversation History");
        expect(detailCode).toContain("messages-list");
        expect(detailCode).toContain("reply-form");
        expect(detailCode).toContain("Send Reply");
    });
});
