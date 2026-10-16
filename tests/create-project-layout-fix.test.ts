import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Create New Project UI Layout, Wizard Overlap & Width Alignment Fixes", () => {
  const pageSource = readFileSync("app/projects/page.tsx", "utf8");
  const cssSource = readFileSync("app/globals.css", "utf8");

  describe("1. Wizard Overlap & Stepper Component Fixes", () => {
    it("does not attach legacy wizard-steps class to Steps component", () => {
      // wizard-steps caused legacy .wizard-steps span { width: 22px; height: 22px; border-radius: 50% } collision
      expect(pageSource).not.toContain('<div className="project-steps-panel wizard-steps">');
      expect(pageSource).toContain('<div className="project-steps-panel" role="navigation" aria-label="Project setup steps">');
    });

    it("has explicit span reset for .project-steps-panel to protect against circle collisions", () => {
      expect(cssSource).toContain(".project-steps-panel span {");
      expect(cssSource).toContain("width: auto;");
      expect(cssSource).toContain("height: auto;");
      expect(cssSource).toContain("border: none;");
      expect(cssSource).toContain("border-radius: 0;");
    });

    it("defines clear typography and status colors for stepper titles and subtitles", () => {
      expect(cssSource).toContain(".project-setup-title {");
      expect(cssSource).toContain("font-size: 14px;");
      expect(cssSource).toContain("white-space: nowrap;");

      expect(cssSource).toContain(".project-setup-sub {");
      expect(cssSource).toContain("font-size: 12px;");

      // Active / Current step color
      expect(cssSource).toContain(".project-setup-step.current .project-setup-sub {");
      expect(cssSource).toContain("color: #2563EB;");

      // Done / Completed step color
      expect(cssSource).toContain(".project-setup-step.done .project-setup-sub {");
      expect(cssSource).toContain("color: #16A34A;");

      // Pending step color
      expect(cssSource).toContain(".project-setup-step.pending .project-setup-sub {");
      expect(cssSource).toContain("color: #94A3B8;");
    });

    it("includes connector line styling and active progress indicator", () => {
      expect(cssSource).toContain(".project-setup-line {");
      expect(cssSource).toContain(".project-setup-line.active {");
      expect(cssSource).toContain("background: #2563EB;");
    });

    it("supports responsive horizontal scrolling for stepper on screens <= 1120px", () => {
      expect(cssSource).toContain("@media (max-width: 1120px)");
      expect(cssSource).toContain(".project-steps-panel {");
      expect(cssSource).toContain("overflow-x: auto;");
    });
  });

  describe("2. Full Width Alignment & No Detached Absolute Overlay", () => {
    it("configures create-page-wrapper.project-scratch-wrapper in normal document flow", () => {
      expect(cssSource).toContain(".create-page-wrapper.project-scratch-wrapper {");
      // Must be relative, not absolute
      expect(cssSource).toMatch(/\.create-page-wrapper\.project-scratch-wrapper\s*\{[^}]*position:\s*relative;/);
      // Must not have nested scrollbars
      expect(cssSource).toMatch(/\.create-page-wrapper\.project-scratch-wrapper\s*\{[^}]*overflow:\s*visible;/);
      // Fluid width
      expect(cssSource).toMatch(/\.create-page-wrapper\.project-scratch-wrapper\s*\{[^}]*width:\s*100%;/);
    });

    it("removes artificial max-width: 1326px restriction from project-scratch-container", () => {
      // Must not constrain container to 1326px with auto margins that created 240px gaps
      expect(cssSource).not.toMatch(/\.project-scratch-container\s*\{[^}]*max-width:\s*1326px;/);
      expect(cssSource).toMatch(/\.project-scratch-container\s*\{[^}]*max-width:\s*100%;/);
      expect(cssSource).toMatch(/\.project-scratch-container\s*\{[^}]*margin:\s*0;/);
    });

    it("positions project-scratch-gradient cleanly across 100% width", () => {
      expect(cssSource).toContain(".project-scratch-gradient {");
      expect(cssSource).toMatch(/\.project-scratch-gradient\s*\{[^}]*left:\s*0;/);
      expect(cssSource).toMatch(/\.project-scratch-gradient\s*\{[^}]*right:\s*0;/);
    });
  });

  describe("3. Uniform Container Structure Across All 5 Wizard Steps", () => {
    it("Step 1 (details) uses project-scratch-container", () => {
      const step1Block = pageSource.split('if (screen === "details")')[1]?.split('if (screen === "rooms")')[0];
      expect(step1Block).toBeDefined();
      expect(step1Block).toContain('className="project-scratch-container"');
      expect(step1Block).toContain('<Steps current={1}');
    });

    it("Step 2 (rooms) uses project-scratch-container", () => {
      const step2Block = pageSource.split('if (screen === "rooms")')[1]?.split('if (screen === "roomConfig")')[0];
      expect(step2Block).toBeDefined();
      expect(step2Block).toContain('className="project-scratch-container"');
      expect(step2Block).toContain('current={2}');
    });

    it("Step 3 (roomConfig) uses project-scratch-container", () => {
      const step3Block = pageSource.split('if (screen === "roomConfig")')[1]?.split('if (screen === "requirements")')[0];
      expect(step3Block).toBeDefined();
      expect(step3Block).toContain('className="project-scratch-container"');
      expect(step3Block).toContain('current={3}');
    });

    it("Step 4 (requirements) uses project-scratch-container", () => {
      const step4Block = pageSource.split('if (screen === "requirements")')[1]?.split('if (screen === "materials")')[0];
      expect(step4Block).toBeDefined();
      expect(step4Block).toContain('className="project-scratch-container"');
      expect(step4Block).toContain('current={4}');
    });

    it("Step 5 (materials) uses project-scratch-container", () => {
      const step5Block = pageSource.split('if (screen === "materials") {\n    const curItem = activeReqForMaterial?.req;')[1]?.split('return (\n    <div className="create-page-wrapper">')[0];
      expect(step5Block).toBeDefined();
      expect(step5Block).toContain('className="project-scratch-container"');
      expect(step5Block).toContain('current={5}');
    });
  });

  describe("4. Parent Dashboard Shell & Component Integration", () => {
    it("preserves DashboardRail and DashboardHeader in parent hierarchy", () => {
      expect(pageSource).toContain("<DashboardRail />");
      expect(pageSource).toContain("<DashboardHeader");
      expect(pageSource).toContain('title="Projects"');
    });

    it("renders wizard within .fig-dashboard-main below header", () => {
      expect(pageSource).toContain('<main className="fig-dashboard project-ui">');
      expect(pageSource).toContain('<div className="fig-dashboard-main">');
    });
  });
});
