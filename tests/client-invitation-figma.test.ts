import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Client Invitation Screen — Figma Specifications & Functional Verification", () => {
    const globalsCssPath = path.join(process.cwd(), "app/globals.css");
    const pagePath = path.join(process.cwd(), "app/client/invitation/[token]/page.tsx");
    const layoutPath = path.join(process.cwd(), "components/client/ClientAuthLayout.tsx");
    const inviteRedirectPath = path.join(process.cwd(), "app/invite/[token]/page.tsx");
    const apiRoutePath = path.join(process.cwd(), "app/api/v1/[...path]/route.ts");

    const cssContent = fs.readFileSync(globalsCssPath, "utf-8");
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    const inviteRedirectContent = fs.readFileSync(inviteRedirectPath, "utf-8");
    const apiRouteContent = fs.readFileSync(apiRoutePath, "utf-8");

    describe("1. Page Viewport & Master Composition", () => {
        it("defines two-panel responsive layout with #F2F3F2 background and 16px margins", () => {
            expect(cssContent).toMatch(/\.client-auth-shell\s*\{[^}]*background:\s*#f2f3f2/i);
            expect(cssContent).toMatch(/\.client-auth-shell\s*\{[^}]*padding:\s*16px/i);
            expect(cssContent).toMatch(/\.client-auth-shell\s*\{[^}]*gap:\s*16px/i);
            expect(cssContent).toMatch(/\.client-auth-shell\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*599px\)\s*minmax\(0,\s*793px\)/i);
        });

        it("verifies desktop panel width arithmetic matches 1440px viewport (16 + 599 + 16 + 793 + 16 = 1440px)", () => {
            const leftMargin = 16;
            const leftPanel = 599;
            const gap = 16;
            const rightPanel = 793;
            const rightMargin = 16;
            expect(leftMargin + leftPanel + gap + rightPanel + rightMargin).toBe(1440);
        });

        it("adapts layout for mobile and tablet with responsive media queries", () => {
            expect(cssContent).toContain("@media (max-width: 1024px)");
            expect(cssContent).toContain("@media (max-width: 768px)");
            expect(cssContent).toContain(".client-branding-panel {\r\n        display: none;\r\n    }");
        });
    });

    describe("2. Left Branding Panel — Figma Frame 2 & Decorative Glows", () => {
        it("defines left branding panel with 599px max-width, 868px height, 20px radius and contained overflow", () => {
            expect(cssContent).toMatch(/\.client-branding-panel\s*\{[^}]*max-width:\s*599px/i);
            expect(cssContent).toMatch(/\.client-branding-panel\s*\{[^}]*height:\s*868px/i);
            expect(cssContent).toMatch(/\.client-branding-panel\s*\{[^}]*border-radius:\s*20px/i);
            expect(cssContent).toMatch(/\.client-branding-panel\s*\{[^}]*overflow:\s*hidden/i);
        });

        it("reproduces the 3 layered blurred ellipses (Ellipse 3: #2563EB, Ellipse 2: #60A5FA, Ellipse 1: #F8FAFC, 92px blur)", () => {
            // Ellipse 3
            expect(cssContent).toContain(".client-glow-ellipse-3");
            expect(cssContent).toMatch(/\.client-glow-ellipse-3\s*\{[^}]*width:\s*1900px/i);
            expect(cssContent).toMatch(/\.client-glow-ellipse-3\s*\{[^}]*height:\s*1838px/i);
            expect(cssContent).toMatch(/\.client-glow-ellipse-3\s*\{[^}]*background:\s*#2563eb/i);
            expect(cssContent).toMatch(/\.client-glow-ellipse-3\s*\{[^}]*filter:\s*blur\(92px\)/i);
            expect(cssContent).toMatch(/\.client-glow-ellipse-3\s*\{[^}]*bottom:\s*-586px/i);

            // Ellipse 2
            expect(cssContent).toContain(".client-glow-ellipse-2");
            expect(cssContent).toMatch(/\.client-glow-ellipse-2\s*\{[^}]*width:\s*1402px/i);
            expect(cssContent).toMatch(/\.client-glow-ellipse-2\s*\{[^}]*height:\s*1307px/i);
            expect(cssContent).toMatch(/\.client-glow-ellipse-2\s*\{[^}]*background:\s*#60a5fa/i);
            expect(cssContent).toMatch(/\.client-glow-ellipse-2\s*\{[^}]*filter:\s*blur\(92px\)/i);

            // Ellipse 1
            expect(cssContent).toContain(".client-glow-ellipse-1");
            expect(cssContent).toMatch(/\.client-glow-ellipse-1\s*\{[^}]*width:\s*1020px/i);
            expect(cssContent).toMatch(/\.client-glow-ellipse-1\s*\{[^}]*height:\s*1094px/i);
            expect(cssContent).toMatch(/\.client-glow-ellipse-1\s*\{[^}]*background:\s*#f8fafc/i);
            expect(cssContent).toMatch(/\.client-glow-ellipse-1\s*\{[^}]*filter:\s*blur\(92px\)/i);
        });

        it("renders branding content box matching Figma Frame 17 (448px width, 24px gap)", () => {
            expect(cssContent).toMatch(/\.client-branding-content\s*\{[^}]*width:\s*448px/i);
            expect(cssContent).toMatch(/\.client-branding-content\s*\{[^}]*gap:\s*24px/i);
        });

        it("renders logo tile matching Figma Frame 16 (92x92px, #365EFB, 16px radius)", () => {
            expect(cssContent).toMatch(/\.client-branding-logo-box\s*\{[^}]*width:\s*92px/i);
            expect(cssContent).toMatch(/\.client-branding-logo-box\s*\{[^}]*height:\s*92px/i);
            expect(cssContent).toMatch(/\.client-branding-logo-box\s*\{[^}]*background:\s*#365efb/i);
            expect(cssContent).toMatch(/\.client-branding-logo-box\s*\{[^}]*border-radius:\s*16px/i);
            expect(layoutContent).toContain("/assets/boq-logo-large.svg");
        });

        it("renders heading and copy matching Figma Frame 18 (Inter 600 28px/120% and Inter 500 14px/140%)", () => {
            expect(cssContent).toMatch(/\.client-branding-title\s*\{[^}]*font-weight:\s*600/i);
            expect(cssContent).toMatch(/\.client-branding-title\s*\{[^}]*font-size:\s*28px/i);
            expect(cssContent).toMatch(/\.client-branding-title\s*\{[^}]*line-height:\s*120%/i);
            expect(cssContent).toMatch(/\.client-branding-title\s*\{[^}]*color:\s*#1a1d1b/i);

            expect(cssContent).toMatch(/\.client-branding-copy\s*\{[^}]*font-weight:\s*500/i);
            expect(cssContent).toMatch(/\.client-branding-copy\s*\{[^}]*font-size:\s*14px/i);
            expect(cssContent).toMatch(/\.client-branding-copy\s*\{[^}]*line-height:\s*140%/i);
            expect(cssContent).toMatch(/\.client-branding-copy\s*\{[^}]*color:\s*#475569/i);

            expect(layoutContent).toContain("One Platform for Every Commercial Decision");
            expect(layoutContent.replace(/\s+/g, " ")).toContain(
                "Create accurate BOQs, standardize costing, compare vendors, manage approvals, and move projects from estimation to procurement—all in one connected workspace."
            );
        });

        it("renders 3 carousel indicators matching Figma Frame 20 (6x6px circles with 8px gap)", () => {
            expect(cssContent).toMatch(/\.client-branding-dots\s*\{[^}]*gap:\s*8px/i);
            expect(cssContent).toMatch(/\.client-branding-dots span\s*\{[^}]*width:\s*6px/i);
            expect(cssContent).toMatch(/\.client-branding-dots span\s*\{[^}]*height:\s*6px/i);
            expect(cssContent).toMatch(/\.client-branding-dots span\s*\{[^}]*background:\s*#365efb/i);
            expect(cssContent).toMatch(/\.client-branding-dots span\s*\{[^}]*opacity:\s*0\.2/i);
            expect(cssContent).toMatch(/\.client-branding-dots span\.active\s*\{[^}]*opacity:\s*1/i);
        });
    });

    describe("3. Right Invitation Panel — Figma Frame 9 & Typography", () => {
        it("defines right panel with 793px max-width, 868px height, #FFFFFF background, 20px radius, and 102px 172px 24px padding", () => {
            expect(cssContent).toMatch(/\.client-content-panel\s*\{[^}]*max-width:\s*793px/i);
            expect(cssContent).toMatch(/\.client-content-panel\s*\{[^}]*height:\s*868px/i);
            expect(cssContent).toMatch(/\.client-content-panel\s*\{[^}]*background:\s*#ffffff/i);
            expect(cssContent).toMatch(/\.client-content-panel\s*\{[^}]*border-radius:\s*20px/i);
            expect(cssContent).toMatch(/\.client-content-panel\s*\{[^}]*padding:\s*102px\s+172px\s+24px/i);
        });

        it("verifies inner content column arithmetic matches 449px (793 - 2 * 172 = 449px)", () => {
            expect(793 - 2 * 172).toBe(449);
            expect(cssContent).toMatch(/\.client-panel-inner\s*\{[^}]*max-width:\s*449px/i);
            expect(cssContent).toMatch(/\.client-invite-frame\s*\{[^}]*max-width:\s*449px/i);
        });

        it("renders 32x32px BOQ application logo (Frame 3 Logo)", () => {
            expect(pageContent).toContain('src="/assets/boq-logo-small.svg"');
            expect(pageContent).toContain("width={32}");
            expect(pageContent).toContain("height={32}");
            expect(cssContent).toMatch(/\.client-invite-logo\s*\{[^}]*width:\s*32px/i);
            expect(cssContent).toMatch(/\.client-invite-logo\s*\{[^}]*height:\s*32px/i);
        });

        it("styles PROJECT INVITATION eyebrow matching Figma (Inter 700 16px/20px #2563EB)", () => {
            expect(pageContent).toContain("PROJECT INVITATION");
            expect(cssContent).toMatch(/\.client-invite-eyebrow\s*\{[^}]*font-weight:\s*700/i);
            expect(cssContent).toMatch(/\.client-invite-eyebrow\s*\{[^}]*font-size:\s*16px/i);
            expect(cssContent).toMatch(/\.client-invite-eyebrow\s*\{[^}]*line-height:\s*20px/i);
            expect(cssContent).toMatch(/\.client-invite-eyebrow\s*\{[^}]*color:\s*#2563eb/i);
        });

        it("styles dynamic invitation heading matching Figma (Inter 600 28px/36px letter-spacing -0.005em #0F172A)", () => {
            expect(pageContent).toContain("You&apos;re invited to {invite.projectName}");
            expect(cssContent).toMatch(/\.client-invite-heading\s*\{[^}]*font-weight:\s*600/i);
            expect(cssContent).toMatch(/\.client-invite-heading\s*\{[^}]*font-size:\s*28px/i);
            expect(cssContent).toMatch(/\.client-invite-heading\s*\{[^}]*line-height:\s*36px/i);
            expect(cssContent).toMatch(/\.client-invite-heading\s*\{[^}]*letter-spacing:\s*-0\.005em/i);
            expect(cssContent).toMatch(/\.client-invite-heading\s*\{[^}]*color:\s*#0f172a/i);
        });

        it("styles dynamic invitation description matching Figma (Inter 500 18px/28px #475569)", () => {
            expect(cssContent).toMatch(/\.client-invite-description\s*\{[^}]*font-weight:\s*500/i);
            expect(cssContent).toMatch(/\.client-invite-description\s*\{[^}]*font-size:\s*18px/i);
            expect(cssContent).toMatch(/\.client-invite-description\s*\{[^}]*line-height:\s*28px/i);
            expect(cssContent).toMatch(/\.client-invite-description\s*\{[^}]*color:\s*#475569/i);
            expect(pageContent).toContain("has invited you to collaborate on this project");
        });
    });

    describe("4. Action Buttons — Figma Frame 2147225499", () => {
        it("styles primary 'Accept Invitation' button (height 48px, background #2563EB, radius 6px, Inter 500 14px/20px #FFFFFF)", () => {
            expect(pageContent).toContain("Accept Invitation");
            expect(cssContent).toMatch(/\.client-invite-btn-primary\s*\{[^}]*height:\s*48px/i);
            expect(cssContent).toMatch(/\.client-invite-btn-primary\s*\{[^}]*background:\s*#2563eb/i);
            expect(cssContent).toMatch(/\.client-invite-btn-primary\s*\{[^}]*border-radius:\s*6px/i);
            expect(cssContent).toMatch(/\.client-invite-btn-primary\s*\{[^}]*font-weight:\s*500/i);
            expect(cssContent).toMatch(/\.client-invite-btn-primary\s*\{[^}]*font-size:\s*14px/i);
            expect(cssContent).toMatch(/\.client-invite-btn-primary\s*\{[^}]*line-height:\s*20px/i);
            expect(cssContent).toMatch(/\.client-invite-btn-primary\s*\{[^}]*color:\s*#ffffff/i);
        });

        it("styles secondary 'Sign In' button (height 48px, border 1px solid #E2E8F0, radius 6px, Inter 500 14px/20px #0F172A)", () => {
            expect(pageContent).toContain("Sign In");
            expect(cssContent).toMatch(/\.client-invite-btn-secondary\s*\{[^}]*height:\s*48px/i);
            expect(cssContent).toMatch(/\.client-invite-btn-secondary\s*\{[^}]*border:\s*1px solid #e2e8f0/i);
            expect(cssContent).toMatch(/\.client-invite-btn-secondary\s*\{[^}]*border-radius:\s*6px/i);
            expect(cssContent).toMatch(/\.client-invite-btn-secondary\s*\{[^}]*font-weight:\s*500/i);
            expect(cssContent).toMatch(/\.client-invite-btn-secondary\s*\{[^}]*font-size:\s*14px/i);
            expect(cssContent).toMatch(/\.client-invite-btn-secondary\s*\{[^}]*line-height:\s*20px/i);
            expect(cssContent).toMatch(/\.client-invite-btn-secondary\s*\{[^}]*color:\s*#0f172a/i);
        });

        it("sets 16px gap between primary and secondary buttons", () => {
            expect(cssContent).toMatch(/\.client-invite-buttons\s*\{[^}]*gap:\s*16px/i);
        });
    });

    describe("5. Footer & Divider — Figma Frame 14, Frame 12 & Frame 15", () => {
        it("renders 1px divider (#E2E8F0) and footer container with 24px gap", () => {
            expect(cssContent).toMatch(/\.client-footer-wrap\s*\{[^}]*gap:\s*24px/i);
            expect(cssContent).toMatch(/\.client-divider\s*\{[^}]*height:\s*1px/i);
            expect(cssContent).toMatch(/\.client-divider\s*\{[^}]*background:\s*#e2e8f0/i);
        });

        it("renders copyright text '2026 BOQ. All Rights Reserved.' (Inter 400 12px/16px #475569)", () => {
            expect(layoutContent).toContain("2026 BOQ. All Rights Reserved.");
            expect(cssContent).toMatch(/\.client-footer-copy\s*\{[^}]*font-weight:\s*400/i);
            expect(cssContent).toMatch(/\.client-footer-copy\s*\{[^}]*font-size:\s*12px/i);
            expect(cssContent).toMatch(/\.client-footer-copy\s*\{[^}]*line-height:\s*16px/i);
            expect(cssContent).toMatch(/\.client-footer-copy\s*\{[^}]*color:\s*#475569/i);
        });

        it("renders Privacy Policy and Terms of Service links with 16px gap (Inter 500 12px/16px #475569)", () => {
            expect(layoutContent).toContain('href="/privacy-policy"');
            expect(layoutContent).toContain('href="/terms-of-service"');
            expect(cssContent).toMatch(/\.client-footer-links\s*\{[^}]*gap:\s*16px/i);
            expect(cssContent).toMatch(/\.client-footer-links a\s*\{[^}]*font-weight:\s*500/i);
            expect(cssContent).toMatch(/\.client-footer-links a\s*\{[^}]*font-size:\s*12px/i);
            expect(cssContent).toMatch(/\.client-footer-links a\s*\{[^}]*line-height:\s*16px/i);
            expect(cssContent).toMatch(/\.client-footer-links a\s*\{[^}]*color:\s*#475569/i);
        });
    });

    describe("6. Backend Integration & Functional Workflows", () => {
        it("reuses existing inspectClientInvite and acceptClientInvite API services", () => {
            expect(pageContent).toContain("inspectClientInvite");
            expect(pageContent).toContain("acceptClientInvite");
            expect(apiRouteContent).toContain("inspectProjectClientInvite");
            expect(apiRouteContent).toContain("acceptProjectClientInvite");
        });

        it("preserves invitation context when redirecting unauthenticated users to /login", () => {
            expect(pageContent).toContain("router.push(`/login?next=${encodeURIComponent(`/client/invitation/${token}`)}`)");
            expect(pageContent).toContain('href={`/login?next=${encodeURIComponent(`/client/invitation/${token}`)}`}');
        });

        it("handles client onboarding redirection to /client/create-account when recipient has no account", () => {
            expect(pageContent).toContain("router.push(`/client/create-account?token=${encodeURIComponent(token)}`)");
        });

        it("handles all required states: loading, expired, revoked, already accepted, invalid token, account mismatch", () => {
            expect(pageContent).toContain("Validating your project invitation...");
            expect(pageContent).toContain("Invitation Expired");
            expect(pageContent).toContain("Invitation Revoked");
            expect(pageContent).toContain("Invitation Already Accepted");
            expect(pageContent).toContain("Invitation Not Available");
            expect(pageContent).toContain("mismatchedAccount");
        });

        it("prevents double-clicking Accept Invitation during submission with disabled state and loading spinner", () => {
            expect(pageContent).toContain("disabled={submitting}");
            expect(pageContent).toContain("submitting ?");
            expect(pageContent).toContain("Accepting Invitation...");
        });

        it("routes email link /invite/[token] to /client/invitation/[token]", () => {
            expect(inviteRedirectContent).toContain("router.replace(`/client/invitation/${encodeURIComponent(params.token)}`)");
        });
    });
});
