import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("New Project Template Figma Redesign Specs", () => {
  const css = readFileSync("app/templates-overview.css", "utf8");
  const modalTsx = readFileSync("components/templates/NewTemplateModal.tsx", "utf8");
  const pageTsx = readFileSync("app/templates/page.tsx", "utf8");

  it("verifies outer modal container matches Figma Frame 2147225095 (590px width, blur 20.4px, 16px radius)", () => {
    // Backdrop
    expect(css).toContain(".new-template-modal-overlay");
    expect(css).toMatch(/background:\s*rgba\(15,\s*23,\s*42,\s*0\.4\)/);
    expect(css).toMatch(/backdrop-filter:\s*blur\(4px\)/);
    expect(css).toMatch(/z-index:\s*1050/);

    // Modal Card: Frame 2147225095
    expect(css).toContain(".new-template-modal-card");
    expect(css).toMatch(/width:\s*590px/);
    expect(css).toMatch(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
    expect(css).toMatch(/backdrop-filter:\s*blur\(20\.4px\)/);
    expect(css).toMatch(/border-radius:\s*16px/);
    expect(css).toMatch(/padding:\s*16px/);
    expect(css).toMatch(/gap:\s*16px/);
  });

  it("verifies modal header matches Figma Frame 2147225093 (Title, Subtitle, Close Button)", () => {
    // Header row
    expect(css).toContain(".ntm-header");
    expect(css).toMatch(/display:\s*flex/);
    expect(css).toMatch(/justify-content:\s*space-between/);
    expect(css).toMatch(/min-height:\s*48px/);

    // Title and subtitle in TSX
    expect(modalTsx).toContain("New Template");
    expect(modalTsx).toContain("Enter the basic details for your template.");

    // Header typography in CSS
    expect(css).toContain(".ntm-header-info h2");
    expect(css).toMatch(/\.ntm-header-info\s+h2[^{]*\{[\s\S]*?font-weight:\s*600/);
    expect(css).toMatch(/\.ntm-header-info\s+h2[^{]*\{[\s\S]*?font-size:\s*18px/);
    expect(css).toMatch(/\.ntm-header-info\s+h2[^{]*\{[\s\S]*?color:\s*#0F172A/);

    expect(css).toContain(".ntm-header-info p");
    expect(css).toMatch(/\.ntm-header-info\s+p[^{]*\{[\s\S]*?font-weight:\s*500/);
    expect(css).toMatch(/\.ntm-header-info\s+p[^{]*\{[\s\S]*?font-size:\s*16px/);
    expect(css).toMatch(/\.ntm-header-info\s+p[^{]*\{[\s\S]*?color:\s*#64748B/);

    // Close button: 24px x 24px
    expect(css).toMatch(/\.ntm-close-btn[^{]*\{[\s\S]*?width:\s*24px/);
    expect(css).toMatch(/\.ntm-close-btn[^{]*\{[\s\S]*?height:\s*24px/);
  });

  it("verifies inner white form surface matches Figma Frame 2147225027 (#FFFFFF, 14px radius, 16px padding)", () => {
    expect(css).toContain(".ntm-form-surface");
    expect(css).toMatch(/background:\s*#FFFFFF/);
    expect(css).toMatch(/border-radius:\s*14px/);
    expect(css).toMatch(/border:\s*1px solid #E2E8F0/);
    expect(css).toMatch(/padding:\s*16px/);
    expect(css).toMatch(/gap:\s*16px/);

    // Verified in TSX structure
    expect(modalTsx).toContain('className="ntm-form-surface"');
  });

  it("verifies cover image upload box matches Figma Frame 2147225613 (162px x 162px, #F2F3F2, dashed border, helper text)", () => {
    // Top row container: Frame 2147225614
    expect(css).toContain(".ntm-top-row");
    expect(css).toMatch(/gap:\s*16px/);

    // Upload box: Frame 2147225613
    expect(css).toContain(".ntm-cover-box");
    expect(css).toMatch(/width:\s*162px/);
    expect(css).toMatch(/height:\s*162px/);
    expect(css).toMatch(/background:\s*#F2F3F2/);
    expect(css).toMatch(/border:\s*1px dashed #E2E8F0/);
    expect(css).toMatch(/border-radius:\s*8px/);

    // TSX copy & functionality
    expect(modalTsx).toContain("Upload Cover Image");
    expect(modalTsx).toContain("JPG, PNG or WebP");
    expect(modalTsx).toContain("(Max 5MB)");
    expect(modalTsx).toContain("onDragOver");
    expect(modalTsx).toContain("onDrop");
    expect(modalTsx).toContain("removeCoverImage");
  });

  it("verifies Template Name & Template ID match Figma Frame 2147225611 (48px inputs, #E2E8F0, read-only ID)", () => {
    // Inputs standard height & style
    expect(css).toMatch(/\.ntm-input[^{]*\{[\s\S]*?height:\s*48px[\s\S]*?border:\s*1px solid #E2E8F0[\s\S]*?border-radius:\s*8px/);
    expect(css).toMatch(/\.ntm-input-disabled[^{]*\{[\s\S]*?background:\s*#F2F3F2[\s\S]*?color:\s*#64748B[\s\S]*?cursor:\s*not-allowed/);

    // TSX labels & placeholders
    expect(modalTsx).toContain("Template Name");
    expect(modalTsx).toContain('placeholder="Enter template name"');
    expect(modalTsx).toContain("Template ID");
    expect(modalTsx).toContain('value="Auto-generated after saving"');
  });

  it("verifies two-column dropdowns match Figma Frame 2147225098 & Frame 2147225612 (Type, Business, Team, Region)", () => {
    // Two-column row
    expect(css).toContain(".ntm-two-col-row");
    expect(css).toMatch(/gap:\s*16px/);

    // Select input styling
    expect(css).toMatch(/\.ntm-select[^{]*\{[\s\S]*?height:\s*48px[\s\S]*?border:\s*1px solid #E2E8F0[\s\S]*?border-radius:\s*8px/);

    // TSX dropdown labels and placeholders
    expect(modalTsx).toContain("Template Type");
    expect(modalTsx).toContain("Select template type");
    expect(modalTsx).toContain("Business Type");
    expect(modalTsx).toContain("Select business type");
    expect(modalTsx).toContain("Team");
    expect(modalTsx).toContain("Select team");
    expect(modalTsx).toContain("Region");
    expect(modalTsx).toContain("Select region");
  });

  it("verifies Tags chip input and keyboard Enter support", () => {
    expect(css).toContain(".ntm-tags-container");
    expect(css).toMatch(/min-height:\s*48px/);
    expect(css).toMatch(/border:\s*1px solid #E2E8F0/);
    expect(css).toMatch(/border-radius:\s*8px/);

    expect(css).toContain(".ntm-tag-pill");
    expect(css).toMatch(/background:\s*rgba\(37,\s*99,\s*235,\s*0\.1\)/);
    expect(css).toMatch(/color:\s*#2563EB/);

    // TSX logic
    expect(modalTsx).toContain('placeholder={tags.length === 0 ? "Add tags and press Enter" : ""}');
    expect(modalTsx).toContain("handleTagKeyDown");
    expect(modalTsx).toContain("removeTag");
  });

  it("verifies Visibility selector matches Figma Frame 2147225303 (Organisation, Team, Private, active tokens)", () => {
    // Visibility group
    expect(css).toContain(".ntm-visibility-group");
    expect(css).toMatch(/gap:\s*12px/);

    // Radio pills
    expect(css).toContain(".ntm-radio-pill");
    expect(css).toMatch(/height:\s*40px/);
    expect(css).toMatch(/border-radius:\s*8px/);

    // Active token
    expect(css).toMatch(/\.ntm-radio-pill\.selected[^{]*\{[\s\S]*?background:\s*rgba\(37,\s*99,\s*235,\s*0\.1\)/);
    expect(css).toMatch(/\.ntm-radio-pill\.selected[^{]*\{[\s\S]*?border-color:\s*#2563EB/);
    expect(css).toMatch(/\.ntm-radio-pill\.selected[^{]*\{[\s\S]*?color:\s*#0F172A/);
    expect(css).toMatch(/\.ntm-radio-pill\.selected[^{]*\{[\s\S]*?font-weight:\s*600/);

    // Active indicator dot
    expect(css).toMatch(/\.ntm-radio-pill\.selected\s+\.ntm-radio-dot[^{]*\{[\s\S]*?background:\s*#2563EB/);

    // TSX options
    expect(modalTsx).toContain("Organisation");
    expect(modalTsx).toContain("Team");
    expect(modalTsx).toContain("Private");
  });

  it("verifies Description textarea matches Figma Frame 12 (85px height, #E2E8F0 border, 8px radius)", () => {
    expect(css).toContain(".ntm-textarea");
    expect(css).toMatch(/height:\s*85px/);
    expect(css).toMatch(/min-height:\s*85px/);
    expect(css).toMatch(/border:\s*1px solid #E2E8F0/);
    expect(css).toMatch(/border-radius:\s*8px/);

    // TSX
    expect(modalTsx).toContain("Description");
    expect(modalTsx).toContain('placeholder="Enter template description"');
  });

  it("verifies Modal Footer matches Figma Frame 2147225097 (Cancel 71x46, Next 84x46 #2563EB, ArrowRight)", () => {
    expect(css).toContain(".ntm-footer");
    expect(css).toMatch(/height:\s*46px/);
    expect(css).toMatch(/justify-content:\s*space-between/);

    // Cancel: 71px x 46px
    expect(css).toMatch(/\.ntm-btn-cancel[^{]*\{[\s\S]*?width:\s*71px/);
    expect(css).toMatch(/\.ntm-btn-cancel[^{]*\{[\s\S]*?height:\s*46px/);
    expect(css).toMatch(/\.ntm-btn-cancel[^{]*\{[\s\S]*?background:\s*#FFFFFF/);

    // Next: 84px x 46px #2563EB
    expect(css).toMatch(/\.ntm-btn-next[^{]*\{[\s\S]*?min-width:\s*84px/);
    expect(css).toMatch(/\.ntm-btn-next[^{]*\{[\s\S]*?height:\s*46px/);
    expect(css).toMatch(/\.ntm-btn-next[^{]*\{[\s\S]*?background:\s*#2563EB/);

    // TSX buttons
    expect(modalTsx).toContain("Cancel");
    expect(modalTsx).toContain("Next");
  });

  it("verifies responsive rules for mobile (<600px)", () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*600px\)[\s\S]*?\.new-template-modal-card/);
    expect(css).toMatch(/\.ntm-top-row\s*\{[\s\S]*?flex-direction:\s*column/);
    expect(css).toMatch(/\.ntm-two-col-row\s*\{[\s\S]*?flex-direction:\s*column/);
    expect(css).toMatch(/\.ntm-visibility-group\s*\{[\s\S]*?flex-direction:\s*column/);
  });

  it("verifies dynamic API integration, validation, and workflow progression", () => {
    // Validation
    expect(modalTsx).toContain("Template Name is required");
    expect(modalTsx).toContain("Template Type is required");
    expect(modalTsx).toContain("Business Type is required");
    expect(modalTsx).toContain("Team is required");
    expect(modalTsx).toContain("Region is required");

    // Real API integration
    expect(modalTsx).toContain('fetch("/api/v1/project-templates"');
    expect(modalTsx).toContain('fetch("/api/v1/boq-templates"');
    expect(modalTsx).toContain("uploadTemplateImage");

    // Workflow progression in page.tsx
    expect(pageTsx).toContain("loadProjectTemplates()");
    expect(pageTsx).toContain("loadOverview()");
    expect(pageTsx).toContain("router.push(`/templates/${created.id}`)");
  });
});
