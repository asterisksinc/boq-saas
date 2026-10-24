import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("User Dashboard → Help & Support Redesign (Figma CSS Alignment)", () => {
    const pagePath = join(process.cwd(), "app", "help", "page.tsx");
    const articlePagePath = join(process.cwd(), "app", "help", "[id]", "page.tsx");
    const cssPath = join(process.cwd(), "app", "help", "help-redesign.css");

    it("verifies required help pages and redesign stylesheet exist", () => {
        expect(existsSync(pagePath)).toBe(true);
        expect(existsSync(articlePagePath)).toBe(true);
        expect(existsSync(cssPath)).toBe(true);
    });

    describe("1. Figma Visual Tokens & Gradient Glow (Rectangle 14)", () => {
        it("defines Figma color palette, borders, translucent surfaces, and radii in help-redesign.css", () => {
            const css = readFileSync(cssPath, "utf8");

            // Page Background & Glow
            expect(css).toContain("#F1F5F9");
            expect(css).toContain("#2563EB");
            expect(css).toContain("linear-gradient(180deg, #2563EB -371.16%, rgba(37, 99, 235, 0) 100%)");
            expect(css).toContain("opacity: 0.5");
            expect(css).toContain("height: 622px");

            // Text colors
            expect(css).toContain("#0F172A"); // Primary headings/labels
            expect(css).toContain("#64748B"); // Subtitles and secondary text

            // Accent & Containers
            expect(css).toContain("#E4ECFB"); // 40x40 icon container background
            expect(css).toContain("rgba(255, 255, 255, 0.6)"); // Translucent section container
            expect(css).toContain("#172554"); // Dark support CTA card background
            expect(css).toContain("#E2E8F0"); // Input and card borders

            // Radii
            expect(css).toContain("border-radius: 6px"); // Outer section and button radius
            expect(css).toContain("border-radius: 8px"); // Search input radius
            expect(css).toContain("border-radius: 14px"); // Card radius

            // Shadow
            expect(css).toContain("0px 0px 6px rgba(0, 0, 0, 0.06)");

            // Typography
            expect(css).toContain("'Urbanist'");
        });

        it("mounts the Rectangle 14 gradient glow on both help pages", () => {
            const pageCode = readFileSync(pagePath, "utf8");
            const articleCode = readFileSync(articlePagePath, "utf8");

            expect(pageCode).toContain('className="help-gradient-glow"');
            expect(articleCode).toContain('className="help-gradient-glow"');
        });

        it("imports help-redesign.css into both page components", () => {
            const pageCode = readFileSync(pagePath, "utf8");
            const articleCode = readFileSync(articlePagePath, "utf8");

            expect(pageCode).toMatch(/import\s+["']\.\/help-redesign\.css["']/);
            expect(articleCode).toMatch(/import\s+["']\.\.\/help-redesign\.css["']/);
        });
    });

    describe("2. Hero Section (Frame 2147225066)", () => {
        it("implements Figma typography and actions in page.tsx", () => {
            const pageCode = readFileSync(pagePath, "utf8");

            // Heading & Subtitle
            expect(pageCode).toContain("How Can We Help You Today?");
            expect(pageCode).toContain("Find answers, troubleshoot issues, or contact our support team.");

            // Action Buttons
            expect(pageCode).toContain("View My Ticket");
            expect(pageCode).toContain("Raise a Ticket");
        });

        it("styles the hero and buttons with exact Figma specifications", () => {
            const css = readFileSync(cssPath, "utf8");

            // Hero container
            expect(css).toMatch(/\.help-hero\s*\{[^}]*justify-content:\s*space-between/);
            expect(css).toMatch(/\.help-hero-text\s*h2\s*\{[^}]*font-size:\s*18px/);
            expect(css).toMatch(/\.help-hero-text\s*h2\s*\{[^}]*font-weight:\s*600/);
            expect(css).toMatch(/\.help-hero-text\s*h2\s*\{[^}]*color:\s*#0F172A/);

            expect(css).toMatch(/\.help-hero-text\s*p\s*\{[^}]*font-size:\s*16px/);
            expect(css).toMatch(/\.help-hero-text\s*p\s*\{[^}]*font-weight:\s*500/);
            expect(css).toMatch(/\.help-hero-text\s*p\s*\{[^}]*color:\s*#64748B/);

            // View My Ticket button
            expect(css).toMatch(/\.btn-view-ticket\s*\{[^}]*width:\s*150px/);
            expect(css).toMatch(/\.btn-view-ticket\s*\{[^}]*height:\s*46px/);
            expect(css).toMatch(/\.btn-view-ticket\s*\{[^}]*background:\s*#FFFFFF/);
            expect(css).toMatch(/\.btn-view-ticket\s*\{[^}]*border-radius:\s*6px/);
            expect(css).toMatch(/\.btn-view-ticket\s*\{[^}]*color:\s*#0F172A/);

            // Raise a Ticket button
            expect(css).toMatch(/\.btn-raise-ticket\s*\{[^}]*width:\s*140px/);
            expect(css).toMatch(/\.btn-raise-ticket\s*\{[^}]*height:\s*46px/);
            expect(css).toMatch(/\.btn-raise-ticket\s*\{[^}]*background:\s*#2563EB/);
            expect(css).toMatch(/\.btn-raise-ticket\s*\{[^}]*border-radius:\s*6px/);
            expect(css).toMatch(/\.btn-raise-ticket\s*\{[^}]*color:\s*#FFFFFF/);
        });
    });

    describe("3. Knowledge-Base Search Container (Frame 2147225073 & 16)", () => {
        it("renders full-width translucent container and search input with exact placeholder", () => {
            const pageCode = readFileSync(pagePath, "utf8");

            expect(pageCode).toContain('placeholder="Search questions, features, error messages, or topics"');
            expect(pageCode).toContain('className="help-search-container"');
            expect(pageCode).toContain('className="help-global-search"');
        });

        it("styles the search container and input according to Figma", () => {
            const css = readFileSync(cssPath, "utf8");

            // Container (Frame 2147225073)
            expect(css).toMatch(/\.help-search-container\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
            expect(css).toMatch(/\.help-search-container\s*\{[^}]*border-radius:\s*6px/);
            expect(css).toMatch(/\.help-search-container\s*\{[^}]*padding:\s*20px/);

            // Input (Frame 16)
            expect(css).toMatch(/\.help-global-search\s*\{[^}]*height:\s*46px/);
            expect(css).toMatch(/\.help-global-search\s*\{[^}]*background:\s*#FFFFFF/);
            expect(css).toMatch(/\.help-global-search\s*\{[^}]*border:\s*1px solid #E2E8F0/);
            expect(css).toMatch(/\.help-global-search\s*\{[^}]*border-radius:\s*8px/);
        });
    });

    describe("4. Popular Articles Section (Frame 2147225477)", () => {
        it("implements POPULAR ARTICLES heading, action button, and 4-column grid", () => {
            const pageCode = readFileSync(pagePath, "utf8");

            expect(pageCode).toContain("POPULAR ARTICLES");
            expect(pageCode).toContain("View All Articles");
            expect(pageCode).toContain('className="popular-articles-grid"');
        });

        it("styles popular articles grid and cards according to Figma tokens", () => {
            const css = readFileSync(cssPath, "utf8");

            // Action button (Frame 2147225468)
            expect(css).toMatch(/\.section-action-btn\s*\{[^}]*background:\s*#2563EB/);
            expect(css).toMatch(/\.section-action-btn\s*\{[^}]*border-radius:\s*6px/);
            expect(css).toMatch(/\.section-action-btn\s*\{[^}]*height:\s*46px/);

            // Grid: 4 columns on desktop
            expect(css).toMatch(/\.popular-articles-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
            expect(css).toMatch(/\.popular-articles-grid\s*\{[^}]*gap:\s*16px/);

            // Card anatomy
            expect(css).toMatch(/\.popular-article-card\s*\{[^}]*background:\s*#FFFFFF/);
            expect(css).toMatch(/\.popular-article-card\s*\{[^}]*border-radius:\s*14px/);
            expect(css).toMatch(/\.popular-article-card\s*\{[^}]*box-shadow:\s*0px 0px 6px rgba\(0,\s*0,\s*0,\s*0\.06\)/);

            // 40x40 icon container with #E4ECFB background and #2563EB icon
            expect(css).toMatch(/\.popular-article-card \.card-icon-wrap\s*\{[^}]*width:\s*40px/);
            expect(css).toMatch(/\.popular-article-card \.card-icon-wrap\s*\{[^}]*height:\s*40px/);
            expect(css).toMatch(/\.popular-article-card \.card-icon-wrap\s*\{[^}]*background:\s*#E4ECFB/);
            expect(css).toMatch(/\.popular-article-card \.card-icon-wrap\s*\{[^}]*border-radius:\s*6px/);
            expect(css).toMatch(/\.popular-article-card \.card-icon-wrap\s*\{[^}]*color:\s*#2563EB/);
        });
    });

    describe("5. Browse by Product Area Section (Frame 2147225478)", () => {
        it("renders all 8 product categories with descriptions and article count links", () => {
            const pageCode = readFileSync(pagePath, "utf8");

            expect(pageCode).toContain("BROWSE BY PRODUCT AREA");
            expect(pageCode).toContain("View All Categories");
            expect(pageCode).toContain('className="product-categories-grid"');

            // 8 product areas
            expect(pageCode).toContain("Getting Started");
            expect(pageCode).toContain("Projects & Activities");
            expect(pageCode).toContain("BOQs & Costing");
            expect(pageCode).toContain("Proposals & Invoices");
            expect(pageCode).toContain("Documents");
            expect(pageCode).toContain("Integrations");
            expect(pageCode).toContain("Team & Permissions");
            expect(pageCode).toContain("Account & Billing");
        });

        it("styles category cards with min-height 111px, 40x40 light blue icon box, and 4-col grid", () => {
            const css = readFileSync(cssPath, "utf8");

            // Grid: 4 columns on desktop
            expect(css).toMatch(/\.product-categories-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);

            // Card min-height and tokens
            expect(css).toMatch(/\.product-category-card\s*\{[^}]*min-height:\s*111px/);
            expect(css).toMatch(/\.product-category-card\s*\{[^}]*background:\s*#FFFFFF/);
            expect(css).toMatch(/\.product-category-card\s*\{[^}]*border-radius:\s*14px/);
            expect(css).toMatch(/\.product-category-card\s*\{[^}]*box-shadow:\s*0px 0px 6px rgba\(0,\s*0,\s*0,\s*0\.06\)/);

            // Icon box
            expect(css).toMatch(/\.product-category-card \.category-icon-box\s*\{[^}]*width:\s*40px/);
            expect(css).toMatch(/\.product-category-card \.category-icon-box\s*\{[^}]*height:\s*40px/);
            expect(css).toMatch(/\.product-category-card \.category-icon-box\s*\{[^}]*background:\s*#E4ECFB/);
            expect(css).toMatch(/\.product-category-card \.category-icon-box\s*\{[^}]*border-radius:\s*6px/);
            expect(css).toMatch(/\.product-category-card \.category-icon-box\s*\{[^}]*color:\s*#2563EB/);

            // Article count link
            expect(css).toMatch(/\.product-category-card \.category-count-link\s*\{[^}]*color:\s*#2563EB/);
        });
    });

    describe("6. Support CTA / Need a Human? (Frame 2147225027)", () => {
        it("renders dark navy container with watermark question mark and action button", () => {
            const pageCode = readFileSync(pagePath, "utf8");
            const articleCode = readFileSync(articlePagePath, "utf8");

            // Page CTA
            expect(pageCode).toContain("NEED A HUMAN?");
            expect(pageCode).toContain("Can&apos;t find what you need?");
            expect(pageCode).toContain("Our team will review your issue and respond according to your support plan.");
            expect(pageCode).toContain("Raise a Support Ticket");

            // Article CTA
            expect(articleCode).toContain("NEED A HUMAN?");
            expect(articleCode).toContain("Still need help?");
            expect(articleCode).toContain("Raise a Support Ticket");
        });

        it("styles the CTA container with #172554, 14px radius, watermark, and blue button", () => {
            const css = readFileSync(cssPath, "utf8");

            // CTA container
            expect(css).toMatch(/\.help-support-cta\s*\{[^}]*background:\s*#172554/);
            expect(css).toMatch(/\.help-support-cta\s*\{[^}]*border-radius:\s*14px/);
            expect(css).toMatch(/\.help-support-cta\s*\{[^}]*box-shadow:\s*0px 0px 6px rgba\(0,\s*0,\s*0,\s*0\.06\)/);
            expect(css).toMatch(/\.help-support-cta\s*\{[^}]*min-height:\s*115px/);
            expect(css).toMatch(/\.help-support-cta\s*\{[^}]*padding:\s*20px 28px/);

            // Watermark
            expect(css).toMatch(/\.help-support-cta \.cta-watermark\s*\{[^}]*font-size:\s*172/);
            expect(css).toMatch(/\.help-support-cta \.cta-watermark\s*\{[^}]*opacity:\s*0\.1/);
            expect(css).toMatch(/\.help-support-cta \.cta-watermark\s*\{[^}]*color:\s*#FFFFFF/);

            // Raise button
            expect(css).toMatch(/\.btn-cta-raise\s*\{[^}]*background:\s*#2563EB/);
            expect(css).toMatch(/\.btn-cta-raise\s*\{[^}]*border-radius:\s*6px/);
            expect(css).toMatch(/\.btn-cta-raise\s*\{[^}]*height:\s*46px/);
        });
    });

    describe("7. Data Integrity & Anti-Fabrication Guarantees", () => {
        it("does NOT contain fabricated default 96% helpful ratings in DEFAULT_ARTICLES or DEFAULT_POPULAR_ARTICLES", () => {
            const pageCode = readFileSync(pagePath, "utf8");
            const articleCode = readFileSync(articlePagePath, "utf8");

            // Must not have helpfulYes: 96 or helpfulNo: 4 hardcoded
            expect(pageCode).not.toContain("helpfulYes: 96");
            expect(pageCode).not.toContain("helpfulNo: 4");
            expect(articleCode).not.toContain("helpfulYes: 96");
            expect(articleCode).not.toContain("helpfulNo: 4");
        });

        it("ensures getHelpfulPercentage returns null without sufficient real sample size", () => {
            const pageCode = readFileSync(pagePath, "utf8");
            const articleCode = readFileSync(articlePagePath, "utf8");

            // Must require statistical significance (e.g. >= 5 votes) before rendering
            expect(pageCode).toContain("if (total < 5) return null;");
            expect(articleCode).toContain("if (total < 5) return null;");
        });
    });

    describe("8. Responsive Layout & Mobile Adaptability", () => {
        it("includes responsive breakpoints for 1100px (tablet) and 768px (mobile)", () => {
            const css = readFileSync(cssPath, "utf8");

            expect(css).toContain("@media (max-width: 1100px)");
            expect(css).toContain("@media (max-width: 768px)");

            // Responsive grid adjustments
            expect(css).toMatch(/@media \(max-width: 1100px\)[\s\S]*?\.popular-articles-grid[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
            expect(css).toMatch(/@media \(max-width: 768px\)[\s\S]*?\.popular-articles-grid[\s\S]*?grid-template-columns:\s*1fr/);
            expect(css).toMatch(/@media \(max-width: 768px\)[\s\S]*?\.product-categories-grid[\s\S]*?grid-template-columns:\s*1fr/);
        });
    });

    describe("9. Preservation of Shared Dashboard Chrome & Ticket Wizard Drawer", () => {
        it("preserves DashboardRail, DashboardHeader, and TicketWizardDrawer on both routes", () => {
            const pageCode = readFileSync(pagePath, "utf8");
            const articleCode = readFileSync(articlePagePath, "utf8");

            // Main Help Page
            expect(pageCode).toContain("<DashboardRail");
            expect(pageCode).toContain("<DashboardHeader");
            expect(pageCode).toContain("<TicketWizardDrawer");

            // Article Detail Page
            expect(articleCode).toContain("<DashboardRail");
            expect(articleCode).toContain("<DashboardHeader");
            expect(articleCode).toContain("<TicketWizardDrawer");
        });
    });

    describe("10. Article Detail Page Figma Specifications (Frames 2147225121, 2147225477, 2147225478, 2147225027)", () => {
        it("renders Frame 2147225121: Back to Help Centre row with 24x24 icon and 18px Urbanist 600 text", () => {
            const articleCode = readFileSync(articlePagePath, "utf8");
            const css = readFileSync(cssPath, "utf8");

            expect(articleCode).toContain('className="article-back-nav"');
            expect(articleCode).toContain('className="article-back-link"');
            expect(articleCode).toContain("Back to Help Centre");

            expect(css).toMatch(/\.article-back-link\s*\{[^}]*font-size:\s*18px/);
            expect(css).toMatch(/\.article-back-link\s*\{[^}]*font-weight:\s*600/);
            expect(css).toMatch(/\.article-back-link\s*\{[^}]*color:\s*#0F172A/);
            expect(css).toMatch(/\.article-back-icon|\.article-back-link svg\s*\{[^}]*width:\s*24px/);
        });

        it("renders Frame 2147225477: Translucent metadata section with uppercase category and 14px radius title card", () => {
            const articleCode = readFileSync(articlePagePath, "utf8");
            const css = readFileSync(cssPath, "utf8");

            expect(articleCode).toContain('className="article-meta-section');
            expect(articleCode).toContain('className="article-category-badge"');
            expect(articleCode).toContain('className="article-title-card');
            expect(articleCode).toContain('className="article-title"');
            expect(articleCode).toContain('className="article-meta-row"');

            // Outer translucent container
            expect(css).toMatch(/\.article-meta-section\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
            expect(css).toMatch(/\.article-meta-section\s*\{[^}]*border-radius:\s*6px/);
            expect(css).toMatch(/\.article-meta-section\s*\{[^}]*padding:\s*20px/);

            // Category badge
            expect(css).toMatch(/\.article-category-badge\s*\{[^}]*font-size:\s*14px/);
            expect(css).toMatch(/\.article-category-badge\s*\{[^}]*font-weight:\s*600/);
            expect(css).toMatch(/\.article-category-badge\s*\{[^}]*color:\s*#64748B/);
            expect(css).toMatch(/\.article-category-badge\s*\{[^}]*text-transform:\s*uppercase/);

            // Inner title card
            expect(css).toMatch(/\.article-title-card[^{]*\{[^}]*background:\s*#FFFFFF/);
            expect(css).toMatch(/\.article-title-card[^{]*\{[^}]*border-radius:\s*14px/);
            expect(css).toMatch(/\.article-title-card[^{]*\{[^}]*box-shadow:\s*0px 0px 6px rgba\(0,\s*0,\s*0,\s*0\.06\)/);

            // Title styling
            expect(css).toMatch(/\.article-title[^{]*\{[^}]*font-size:\s*24px/);
            expect(css).toMatch(/\.article-title[^{]*\{[^}]*font-weight:\s*700/);
            expect(css).toMatch(/\.article-title[^{]*\{[^}]*color:\s*#0F172A/);
        });

        it("renders Frame 2147225478: Translucent content section with short answer callout, body card, and feedback card", () => {
            const articleCode = readFileSync(articlePagePath, "utf8");
            const css = readFileSync(cssPath, "utf8");

            expect(articleCode).toContain('className="article-content-section');
            expect(articleCode).toContain('className="article-short-answer-callout');
            expect(articleCode).toContain('className="article-body-card');
            expect(articleCode).toContain('className="article-feedback-card');

            // Outer translucent container
            expect(css).toMatch(/\.article-content-section\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
            expect(css).toMatch(/\.article-content-section\s*\{[^}]*border-radius:\s*6px/);
            expect(css).toMatch(/\.article-content-section\s*\{[^}]*padding:\s*20px/);

            // Short answer callout: green left border (2px solid #16A34A), white background, 6px radius
            expect(css).toMatch(/\.article-short-answer-callout[^{]*\{[^}]*background:\s*#FFFFFF/);
            expect(css).toMatch(/\.article-short-answer-callout[^{]*\{[^}]*border-left:\s*2px solid #16A34A/);
            expect(css).toMatch(/\.article-short-answer-callout[^{]*\{[^}]*border-radius:\s*6px/);

            // Article body card: white background, 14px radius, 0 0 6px shadow
            expect(css).toMatch(/\.article-body-card\s*\{[^}]*background:\s*#FFFFFF/);
            expect(css).toMatch(/\.article-body-card\s*\{[^}]*border-radius:\s*14px/);
            expect(css).toMatch(/\.article-body-card\s*\{[^}]*box-shadow:\s*0px 0px 6px rgba\(0,\s*0,\s*0,\s*0\.06\)/);

            // Feedback card: 76x36px buttons, #EBEBEB border, 6px radius
            expect(css).toMatch(/\.article-feedback-card\s*\{[^}]*background:\s*#FFFFFF/);
            expect(css).toMatch(/\.article-feedback-card\s*\{[^}]*border-radius:\s*14px/);
            expect(css).toMatch(/\.feedback-action-btn[^{]*\{[^}]*width:\s*76px/);
            expect(css).toMatch(/\.feedback-action-btn[^{]*\{[^}]*height:\s*36px/);
            expect(css).toMatch(/\.feedback-action-btn[^{]*\{[^}]*border:\s*1px solid #EBEBEB/);
            expect(css).toMatch(/\.feedback-action-btn[^{]*\{[^}]*border-radius:\s*6px/);
        });

        it("renders Frame 2147225027: Still need help? CTA card with navy surface, watermark, and 143x46px blue button", () => {
            const articleCode = readFileSync(articlePagePath, "utf8");
            const css = readFileSync(cssPath, "utf8");

            expect(articleCode).toContain('className="article-support-cta');
            expect(articleCode).toContain("Still need help?");
            expect(articleCode).toContain("Carry this article into a support ticket so you don&apos;t have to repeat yourself.");
            expect(articleCode).toContain("Raise a Ticket");

            // CTA card
            expect(css).toMatch(/\.article-support-cta\s*\{[^}]*background:\s*#172554/);
            expect(css).toMatch(/\.article-support-cta\s*\{[^}]*border-radius:\s*14px/);
            expect(css).toMatch(/\.article-support-cta\s*\{[^}]*box-shadow:\s*0px 0px 6px rgba\(0,\s*0,\s*0,\s*0\.06\)/);

            // Watermark
            expect(css).toMatch(/\.article-support-cta \.cta-watermark\s*\{[^}]*font-size:\s*172/);
            expect(css).toMatch(/\.article-support-cta \.cta-watermark\s*\{[^}]*opacity:\s*0\.1/);
            expect(css).toMatch(/\.article-support-cta \.cta-watermark\s*\{[^}]*color:\s*#FFFFFF/);

            // Button
            expect(css).toMatch(/\.btn-raise-ticket-cta[^{]*\{[^}]*width:\s*143px/);
            expect(css).toMatch(/\.btn-raise-ticket-cta[^{]*\{[^}]*height:\s*46px/);
            expect(css).toMatch(/\.btn-raise-ticket-cta[^{]*\{[^}]*background:\s*#2563EB/);
            expect(css).toMatch(/\.btn-raise-ticket-cta[^{]*\{[^}]*border-radius:\s*6px/);
        });
    });

    describe("11. Elimination of Unwanted Right-Side Gap & Tablet/Desktop Fluid Alignment", () => {
        it("ensures help-content and help-article-page use 100% width without restrictive fixed max-width: 1326px", () => {
            const css = readFileSync(cssPath, "utf8");

            // Must NOT restrict outer page body to 1326px which causes right-side gaps on wide screens
            expect(css).toMatch(/\.help-content,\s*\.help-article-page,\s*\.help-article-page__content\s*\{[^}]*width:\s*100%/);
            expect(css).toMatch(/\.help-content,\s*\.help-article-page,\s*\.help-article-page__content\s*\{[^}]*max-width:\s*100%/);
            expect(css).toMatch(/\.help-content,\s*\.help-article-page,\s*\.help-article-page__content\s*\{[^}]*min-width:\s*0/);
            expect(css).toMatch(/\.help-content,\s*\.help-article-page,\s*\.help-article-page__content\s*\{[^}]*box-sizing:\s*border-box/);

            // Must NOT force width: 100vw which causes horizontal scrollbars
            expect(css).not.toContain("width: 100vw");
        });

        it("overrides parent fig-dashboard-main on tablet (max-width: 1120px) to prevent 16px clipping overflow and eliminate right gap", () => {
            const css = readFileSync(cssPath, "utf8");

            expect(css).toMatch(/\.help-page \.fig-dashboard-main\s*\{[^}]*width:\s*calc\(100% - 114px\)/);
            expect(css).toMatch(/@media \(max-width: 1120px\)[\s\S]*?\.help-page \.fig-dashboard-main\s*\{[^}]*width:\s*calc\(100% - 114px\)/);
        });

        it("ensures all article section containers and cards span 100% width with min-width: 0", () => {
            const css = readFileSync(cssPath, "utf8");

            expect(css).toMatch(/\.help-article-page__section,\s*\.help-article-page__card[\s\S]*?width:\s*100%/);
            expect(css).toMatch(/\.help-article-page__section,\s*\.help-article-page__card[\s\S]*?min-width:\s*0/);
            expect(css).toMatch(/\.help-article-page__section,\s*\.help-article-page__card[\s\S]*?max-width:\s*100%/);
        });
    });

    describe("12. Raising Tickets Drawer & Stepper Redesign (Figma CSS Alignment)", () => {
        const drawerPath = join(process.cwd(), "components", "TicketWizardDrawer.tsx");

        it("verifies TicketWizardDrawer component file exists", () => {
            expect(existsSync(drawerPath)).toBe(true);
        });

        it("renders Figma title 'Let's Get This Sorted.', close button, and 7-step wizard", () => {
            const drawerCode = readFileSync(drawerPath, "utf8");

            expect(drawerCode).toContain("Let&apos;s Get This Sorted.");
            expect(drawerCode).toContain("ticket-drawer-close-btn");
            expect(drawerCode).toContain("ticket-stepper-wrap");
            expect(drawerCode).toContain("ticket-stepper");
            expect(drawerCode).toContain("ticket-step-node");
            expect(drawerCode).toContain("ticket-step-circle");
        });

        it("styles Rectangle 69 backdrop and Frame 2147225093 glassmorphism drawer container", () => {
            const css = readFileSync(cssPath, "utf8");

            // Backdrop (Rectangle 69)
            expect(css).toMatch(/\.ticket-drawer-backdrop\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.2\)/);
            expect(css).toMatch(/\.ticket-drawer-backdrop\s*\{[^}]*backdrop-filter:\s*blur\(7px\)/);

            // Drawer Panel (Frame 2147225093)
            expect(css).toMatch(/\.ticket-drawer\s*\{[^}]*width:\s*590px/);
            expect(css).toMatch(/\.ticket-drawer\s*\{[^}]*right:\s*12px/);
            expect(css).toMatch(/\.ticket-drawer\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
            expect(css).toMatch(/\.ticket-drawer\s*\{[^}]*backdrop-filter:\s*blur\(20\.4px\)/);
            expect(css).toMatch(/\.ticket-drawer\s*\{[^}]*border-radius:\s*16px/);
            expect(css).toMatch(/\.ticket-drawer\s*\{[^}]*padding:\s*16px/);
            expect(css).toMatch(/\.ticket-drawer\s*\{[^}]*gap:\s*16px/);
        });

        it("styles Frame 93 Stepper Card with 14px radius, 66px height, and 26px step circles", () => {
            const css = readFileSync(cssPath, "utf8");

            // Stepper wrap (Frame 93)
            expect(css).toMatch(/\.ticket-stepper-wrap\s*\{[^}]*height:\s*66px/);
            expect(css).toMatch(/\.ticket-stepper-wrap\s*\{[^}]*border-radius:\s*14px/);
            expect(css).toMatch(/\.ticket-stepper-wrap\s*\{[^}]*padding:\s*20px/);
            expect(css).toMatch(/\.ticket-stepper-wrap\s*\{[^}]*box-shadow:\s*0px 0px 6px rgba\(0,\s*0,\s*0,\s*0\.06\)/);

            // 26px circle
            expect(css).toMatch(/\.ticket-step-circle\s*\{[^}]*width:\s*26px/);
            expect(css).toMatch(/\.ticket-step-circle\s*\{[^}]*height:\s*26px/);
            expect(css).toMatch(/\.ticket-step-circle\s*\{[^}]*border-radius:\s*74px/);

            // Active circle: #2563EB with glow
            expect(css).toMatch(/\.ticket-step-node\.active \.ticket-step-circle\s*\{[^}]*background:\s*#2563EB/);

            // Upcoming circle: #E2E8F0 with 1px solid #94A3B8
            expect(css).toMatch(/\.ticket-step-node\.upcoming \.ticket-step-circle\s*\{[^}]*background:\s*#E2E8F0/);
            expect(css).toMatch(/\.ticket-step-node\.upcoming \.ticket-step-circle\s*\{[^}]*border:\s*1px solid #94A3B8/);
        });

        it("renders Step 1 exact Figma header 'What Can We Help You With?' and 14 categories", () => {
            const drawerCode = readFileSync(drawerPath, "utf8");

            expect(drawerCode).toContain("What Can We Help You With?");
            expect(drawerCode).toContain("Choose the area closest to your issue.");

            // Categories
            expect(drawerCode).toContain("Account and Login");
            expect(drawerCode).toContain("Projects");
            expect(drawerCode).toContain("BOQs");
            expect(drawerCode).toContain("Costing");
            expect(drawerCode).toContain("Templates");
            expect(drawerCode).toContain("Proposals");
            expect(drawerCode).toContain("Invoice and Billing");
            expect(drawerCode).toContain("Documents");
            expect(drawerCode).toContain("Integrations");
            expect(drawerCode).toContain("Team and Permissions");
            expect(drawerCode).toContain("Client Portal");
            expect(drawerCode).toContain("Bug or Technical Issue");
            expect(drawerCode).toContain("Feature Request");
            expect(drawerCode).toContain("Other");
        });

        it("styles category cards with 49px height, #EBEBEB border, 10px radius, and 16px padding", () => {
            const css = readFileSync(cssPath, "utf8");

            expect(css).toMatch(/\.ticket-category-card\s*\{[^}]*height:\s*49px/);
            expect(css).toMatch(/\.ticket-category-card\s*\{[^}]*border:\s*1px solid #EBEBEB/);
            expect(css).toMatch(/\.ticket-category-card\s*\{[^}]*border-radius:\s*10px/);
            expect(css).toMatch(/\.ticket-category-card\s*\{[^}]*padding:\s*16px/);
        });

        it("styles Frame 2147225095 footer with 71px Cancel, 114px Save as Draft, and 84px Continue", () => {
            const css = readFileSync(cssPath, "utf8");

            // Footer height 46px
            expect(css).toMatch(/\.ticket-drawer-footer\s*\{[^}]*height:\s*46px/);

            // Cancel button: 71px wide, 46px high, #FFFFFF, 6px radius, #0F172A
            expect(css).toMatch(/\.ticket-drawer-btn-cancel\s*\{[^}]*width:\s*71px/);
            expect(css).toMatch(/\.ticket-drawer-btn-cancel\s*\{[^}]*height:\s*46px/);
            expect(css).toMatch(/\.ticket-drawer-btn-cancel\s*\{[^}]*background:\s*#FFFFFF/);
            expect(css).toMatch(/\.ticket-drawer-btn-cancel\s*\{[^}]*border-radius:\s*6px/);
            expect(css).toMatch(/\.ticket-drawer-btn-cancel\s*\{[^}]*color:\s*#0F172A/);

            // Save as Draft button: 114px wide, 46px high, #FFFFFF, 6px radius, #0F172A
            expect(css).toMatch(/\.ticket-drawer-btn-draft\s*\{[^}]*width:\s*114px/);
            expect(css).toMatch(/\.ticket-drawer-btn-draft\s*\{[^}]*height:\s*46px/);
            expect(css).toMatch(/\.ticket-drawer-btn-draft\s*\{[^}]*background:\s*#FFFFFF/);
            expect(css).toMatch(/\.ticket-drawer-btn-draft\s*\{[^}]*border-radius:\s*6px/);
            expect(css).toMatch(/\.ticket-drawer-btn-draft\s*\{[^}]*color:\s*#0F172A/);

            // Continue button: 84px wide, 46px high, #2563EB, 6px radius, #FFFFFF
            expect(css).toMatch(/\.ticket-drawer-btn-continue\s*\{[^}]*width:\s*84px/);
            expect(css).toMatch(/\.ticket-drawer-btn-continue\s*\{[^}]*height:\s*46px/);
            expect(css).toMatch(/\.ticket-drawer-btn-continue\s*\{[^}]*background:\s*#2563EB/);
            expect(css).toMatch(/\.ticket-drawer-btn-continue\s*\{[^}]*border-radius:\s*6px/);
            expect(css).toMatch(/\.ticket-drawer-btn-continue\s*\{[^}]*color:\s*#FFFFFF/);
        });

        it("includes responsive rules for mobile/tablet drawer fitting cleanly without right-side overflow", () => {
            const css = readFileSync(cssPath, "utf8");

            expect(css).toContain("@media (max-width: 640px)");
            expect(css).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.ticket-drawer[\s\S]*?right:\s*8px/);
            expect(css).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.ticket-category-grid[\s\S]*?grid-template-columns:\s*1fr/);
        });
    });
});
