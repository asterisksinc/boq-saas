import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Project Creation Success Modal (Figma CSS Redesign)", () => {
  const pageSource = readFileSync("app/projects/page.tsx", "utf8");
  const cssSource = readFileSync("app/globals.css", "utf8");

  describe("1. CSS Variables & Tokens", () => {
    it("defines all Figma success modal tokens in globals.css", () => {
      expect(cssSource).toContain("--success-primary: #22C55E;");
      expect(cssSource).toContain("--success-primary-soft: rgba(34, 197, 94, 0.2);");
      expect(cssSource).toContain("--success-border-soft: rgba(34, 197, 94, 0.3);");
      expect(cssSource).toContain("--success-overlay: rgba(0, 0, 0, 0.2);");
      expect(cssSource).toContain("--success-modal-background: rgba(255, 255, 255, 0.6);");
      expect(cssSource).toContain("--success-card-background: #FFFFFF;");
      expect(cssSource).toContain("--success-text-heading: #0F172A;");
      expect(cssSource).toContain("--success-text-subheading: #475569;");
      expect(cssSource).toContain("--success-text-muted: #64748B;");
      expect(cssSource).toContain("--success-action-primary: #2563EB;");
      expect(cssSource).toContain("--success-summary-background: #F2F3F2;");
      expect(cssSource).toContain("--success-divider: #E2E8F0;");
    });
  });

  describe("2. Background Overlay & Accessibility", () => {
    it("applies fixed blurred backdrop overlay matching Figma reference", () => {
      expect(cssSource).toContain(".success-modal-overlay {");
      expect(cssSource).toContain("position: fixed;");
      expect(cssSource).toContain("inset: 0;");
      expect(cssSource).toContain("backdrop-filter: blur(7px);");
      expect(cssSource).toContain("z-index: 1000;");
    });

    it("includes proper ARIA dialog semantics and Escape key listener", () => {
      expect(pageSource).toContain('className="success-modal-overlay"');
      expect(pageSource).toContain('role="dialog"');
      expect(pageSource).toContain('aria-modal="true"');
      expect(pageSource).toContain('aria-labelledby="project-success-modal-title"');
      expect(pageSource).toContain('if (e.key === "Escape")');
    });
  });

  describe("3. Centered Success Modal & Content Card", () => {
    it("defines 590px desktop reference modal container with responsive constraints", () => {
      expect(cssSource).toContain(".success-modal {");
      expect(cssSource).toContain("width: 590px;");
      expect(cssSource).toContain("max-width: calc(100vw - 32px);");
      expect(cssSource).toContain("max-height: calc(100dvh - 32px);");
      expect(cssSource).toContain("border-radius: 16px;");
    });

    it("defines inner white card with 14px border radius and 372px minimum height", () => {
      expect(cssSource).toContain(".success-content {");
      expect(cssSource).toContain("min-height: 372px;");
      expect(cssSource).toContain("border-radius: 14px;");
    });
  });

  describe("4. Modal Header", () => {
    it("renders modal title, subtitle, and close button in Create New Project header", () => {
      expect(pageSource).toContain('className="success-modal-header"');
      expect(pageSource).toContain('id="project-success-modal-title"');
      expect(pageSource).toContain("Create New Project");
      expect(pageSource).toContain("Choose how you want to start this project.");
      expect(pageSource).toContain('className="success-modal-close-btn"');
    });

    it("defines header typography matching Figma Urbanist font", () => {
      expect(cssSource).toContain(".success-modal-title {");
      expect(cssSource).toContain("font-family: 'Urbanist', sans-serif;");
      expect(cssSource).toContain("font-size: 18px;");
      expect(cssSource).toContain("font-weight: 600;");

      expect(cssSource).toContain(".success-modal-subtitle {");
      expect(cssSource).toContain("font-family: 'Urbanist', sans-serif;");
      expect(cssSource).toContain("font-size: 16px;");
      expect(cssSource).toContain("font-weight: 500;");
    });
  });

  describe("5. Green Animated Success Indicator", () => {
    it("renders double-circle indicator with 82px outer circle and 68px inner circle", () => {
      expect(cssSource).toContain(".success-indicator-outer {");
      expect(cssSource).toContain("width: 82px;");
      expect(cssSource).toContain("height: 82px;");
      expect(cssSource).toContain("border: 2px solid var(--success-border-soft, rgba(34, 197, 94, 0.3));");

      expect(cssSource).toContain(".success-indicator-inner {");
      expect(cssSource).toContain("width: 68px;");
      expect(cssSource).toContain("height: 68px;");
      expect(cssSource).toContain("border: 2px solid var(--success-primary, #22C55E);");
    });

    it("includes keyframe animations and respects prefers-reduced-motion", () => {
      expect(cssSource).toContain("@keyframes successIndicatorFadeIn");
      expect(cssSource).toContain("@keyframes successIndicatorPop");
      expect(cssSource).toContain("@media (prefers-reduced-motion: reduce)");
    });
  });

  describe("6. Success Titles & Typography", () => {
    it("renders Inter 20px 600 heading and Inter 16px 500 subtitle", () => {
      expect(pageSource).toContain("Project Created Successfully!");
      expect(pageSource).toContain("Your project workspace is ready");

      expect(cssSource).toContain(".success-main-heading {");
      expect(cssSource).toContain("font-family: 'Inter', sans-serif;");
      expect(cssSource).toContain("font-size: 20px;");
      expect(cssSource).toContain("font-weight: 600;");

      expect(cssSource).toContain(".success-sub-heading {");
      expect(cssSource).toContain("font-family: 'Inter', sans-serif;");
      expect(cssSource).toContain("font-size: 16px;");
      expect(cssSource).toContain("font-weight: 500;");
    });
  });

  describe("7. Project Information Summary Card", () => {
    it("renders 526px maximum width card with #F2F3F2 background and 20px radius", () => {
      expect(cssSource).toContain(".project-summary-info-card {");
      expect(cssSource).toContain("max-width: 526px;");
      expect(cssSource).toContain("background: var(--success-summary-background, #F2F3F2);");
      expect(cssSource).toContain("border: 1px solid var(--success-divider, #E2E8F0);");
      expect(cssSource).toContain("border-radius: 20px;");
    });

    it("displays Client Name, Type, Designer, Budget, and Area with dividers", () => {
      expect(pageSource).toContain("Client Name");
      expect(pageSource).toContain("Type");
      expect(pageSource).toContain("Designer");
      expect(pageSource).toContain("Budget");
      expect(pageSource).toContain("Area");

      expect(pageSource).toContain('className="psi-divider-v"');
      expect(pageSource).toContain('className="psi-divider-h"');
    });

    it("handles dynamic data fallbacks without hardcoded mocks", () => {
      expect(pageSource).toContain("clientNameDisplay");
      expect(pageSource).toContain("locationDisplay");
      expect(pageSource).toContain("designerDisplay");
      expect(pageSource).toContain("roomsDisplay");
      expect(pageSource).toContain("areaDisplay");
      expect(pageSource).toContain('resolveDesignerDisplay(');
      expect(pageSource).toContain("totalRoomAreaSqft(rooms)");
    });
  });

  describe("8. Action Buttons Footer & Navigation", () => {
    it("renders Back to Projects, Create BOQ, and Open Project Workspace buttons", () => {
      expect(pageSource).toContain('className="success-btn-back"');
      expect(pageSource).toContain("Back to Projects");
      expect(pageSource).toContain('className="success-btn-boq"');
      expect(pageSource).toMatch(/>\s*Create BOQ\s*</);
      expect(pageSource).toContain('className="success-btn-workspace"');
      expect(pageSource).toContain("Open Project Workspace");
    });

    it("navigates to existing boqs and project workspace routes with project id", () => {
      expect(pageSource).toContain("/boqs?new=true&projectId=");
      expect(pageSource).toContain("/projects/");
    });

    it("matches button styling and dimensions from Figma specifications", () => {
      expect(cssSource).toContain(".success-btn-back {");
      expect(cssSource).toContain("width: 127px;");
      expect(cssSource).toContain("height: 46px;");

      expect(cssSource).toContain(".success-btn-boq {");
      expect(cssSource).toContain("width: 136px;");
      expect(cssSource).toContain("height: 46px;");

      expect(cssSource).toContain(".success-btn-workspace {");
      expect(cssSource).toContain("width: 182px;");
      expect(cssSource).toContain("height: 46px;");
      expect(cssSource).toContain("background: var(--success-action-primary, #2563EB);");
    });
  });

  describe("9. Responsive Styling", () => {
    it("includes mobile media query adjustments for screens <= 640px", () => {
      expect(cssSource).toContain("@media (max-width: 640px) {");
      expect(cssSource).toContain(".psi-row {");
      expect(cssSource).toContain("flex-direction: column;");
      expect(cssSource).toContain(".success-modal-footer {");
      expect(cssSource).toContain("flex-direction: column-reverse;");
    });
  });
});
