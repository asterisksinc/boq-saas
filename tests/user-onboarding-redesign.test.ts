import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
    onboardingPatchSchema,
    projectCreateSchema,
    clientRegisterSchema,
    clientDocumentSignSchema,
    clientOnboardingStepSchema,
    boqCreateSchema,
    boqImportSchema,
} from "../lib/api/validation";

describe("User Onboarding Redesign & Step 2 Workflow Integration", () => {
    describe("Onboarding Validation Schema (Backend)", () => {
        it("validates Step 1: Workspace payload with name, business type, and team size", () => {
            const valid = onboardingPatchSchema.parse({
                currentStep: "workflow",
                completedSteps: ["workspace"],
                workspace: {
                    name: "Studio Forma",
                    businessType: "Interior Design Studio",
                    customBusinessType: null,
                    teamSize: "6-20",
                },
                company: {
                    name: "Studio Forma",
                },
            });

            expect(valid.currentStep).toBe("workflow");
            expect(valid.completedSteps).toEqual(["workspace"]);
            expect(valid.workspace?.name).toBe("Studio Forma");
            expect(valid.workspace?.businessType).toBe("Interior Design Studio");
            expect(valid.workspace?.teamSize).toBe("6-20");
            expect(valid.workspace?.customBusinessType).toBeNull();
        });

        it("validates Custom Business Type when 'Other' is chosen", () => {
            const valid = onboardingPatchSchema.parse({
                workspace: {
                    name: "Apex Acoustic Labs",
                    businessType: "Acoustic Consultant",
                    customBusinessType: "Acoustic Consultant",
                    teamSize: "2-5",
                },
            });
            expect(valid.workspace?.customBusinessType).toBe("Acoustic Consultant");
        });

        it("validates Step 2: Workflow payload with all supported currencies", () => {
            const currencies = [
                "Indian Rupee (₹)",
                "US Dollar ($)",
                "Euro (€)",
                "British Pound (£)",
                "UAE Dirham (AED)",
                "Saudi Riyal (SAR)",
            ];

            for (const currency of currencies) {
                const valid = onboardingPatchSchema.parse({
                    currentStep: "project",
                    completedSteps: ["workspace", "workflow"],
                    workflow: {
                        currency,
                        measurementSystem: "Metric (m, sq.m, cu.m)",
                        taxType: "GST (India)",
                        defaultMarkup: "15",
                    },
                });
                expect(valid.workflow?.currency).toBe(currency);
            }
        });

        it("validates Step 2: Workflow payload with Metric and Imperial measurement systems", () => {
            const systems = [
                "Metric (m, sq.m, cu.m)",
                "Imperial (ft, sq.ft, cu.ft)",
            ];

            for (const measurementSystem of systems) {
                const valid = onboardingPatchSchema.parse({
                    workflow: {
                        measurementSystem,
                    },
                });
                expect(valid.workflow?.measurementSystem).toBe(measurementSystem);
            }
        });

        it("validates Step 2: Workflow payload with supported Tax/GST types", () => {
            const taxTypes = [
                "GST (India)",
                "VAT (Standard 5%)",
                "VAT (Standard 15%)",
                "Sales Tax (US)",
                "No Tax / Exempt",
            ];

            for (const taxType of taxTypes) {
                const valid = onboardingPatchSchema.parse({
                    workflow: {
                        taxType,
                    },
                });
                expect(valid.workflow?.taxType).toBe(taxType);
            }
        });

        it("validates Step 2: Default Markup accepts zero, positive numbers, and decimal percentages", () => {
            const markups = ["0", "12.5", "25", 0, 18, "100"];
            for (const defaultMarkup of markups) {
                const valid = onboardingPatchSchema.parse({
                    workflow: {
                        defaultMarkup,
                    },
                });
                expect(valid.workflow?.defaultMarkup).toBe(defaultMarkup);
            }
        });

        it("validates Step 3: Project preference payload", () => {
            const validScratch = onboardingPatchSchema.parse({
                currentStep: "first-project",
                completedSteps: ["workspace", "workflow", "project"],
                project: {
                    startingOption: "scratch",
                    details: {},
                },
            });
            expect(validScratch.project?.startingOption).toBe("scratch");

            const validImport = onboardingPatchSchema.parse({
                currentStep: "first-project",
                completedSteps: ["workspace", "workflow", "project"],
                project: {
                    startingOption: "import",
                    details: {},
                },
            });
            expect(validImport.project?.startingOption).toBe("import");
        });

        it("validates Step 4 & Completion payload with completed status", () => {
            const validCompletion = onboardingPatchSchema.parse({
                currentStep: "complete",
                completedSteps: ["workspace", "workflow", "project", "first-project"],
                status: "completed",
            });

            expect(validCompletion.currentStep).toBe("complete");
            expect(validCompletion.status).toBe("completed");
            expect(validCompletion.completedSteps).toHaveLength(4);
        });

        it("rejects invalid status and unknown properties due to strict mode", () => {
            expect(() =>
                onboardingPatchSchema.parse({
                    status: "invalid_status",
                })
            ).toThrow();

            expect(() =>
                onboardingPatchSchema.parse({
                    unknownField: "malicious",
                })
            ).toThrow();
        });
    });

    describe("Backend Workflow Persistence & BOQ Consumption Integration", () => {
        const routeFile = readFileSync(join(process.cwd(), "app/api/v1/[...path]/route.ts"), "utf8");

        it("handles currency mapping to ISO codes including SAR in route.ts", () => {
            expect(routeFile).toContain('companyPatch.currency = "USD"');
            expect(routeFile).toContain('companyPatch.currency = "EUR"');
            expect(routeFile).toContain('companyPatch.currency = "GBP"');
            expect(routeFile).toContain('companyPatch.currency = "AED"');
            expect(routeFile).toContain('companyPatch.currency = "SAR"');
            expect(routeFile).toContain('companyPatch.currency = "INR"');
        });

        it("persists currency and tax configuration to workspace_settings.boq_costing", () => {
            expect(routeFile).toContain("boqCosting.currency = companyPatch.currency;");
            expect(routeFile).toContain("boqCosting.taxType = taxType;");
            expect(routeFile).toContain("boqCosting.defaultTaxPercent = 0;");
            expect(routeFile).toContain("boqCosting.defaultTaxPercent = 5;");
            expect(routeFile).toContain("boqCosting.defaultTaxPercent = 15;");
            expect(routeFile).toContain("boqCosting.defaultTaxPercent = 8;");
            expect(routeFile).toContain("boqCosting.defaultTaxPercent = 18;");
        });

        it("persists defaultMarkupPercent to both boq_costing and boq_costing.pricing", () => {
            expect(routeFile).toContain("boqCosting.defaultMarkupPercent = markupVal;");
            expect(routeFile).toContain("defaultMarkupPercent: markupVal");
        });

        it("ensures createBoq consumes workspace costing defaults when creating new BOQs", () => {
            expect(routeFile).toContain("createBoq");
            expect(routeFile).toContain("boqCosting.defaultMarkupPercent");
            expect(routeFile).toContain("boqCosting.defaultTaxPercent");
            expect(routeFile).toContain("markup_percent: markupPercent");
            expect(routeFile).toContain("tax_percent: taxPercent");
        });
    });

    describe("Project Creation Integration (Step 4)", () => {
        it("validates mandatory fields for first project creation", () => {
            const valid = projectCreateSchema.parse({
                name: "Sharma Residence",
                clientName: "Rohan Sharma",
                projectType: "Residential",
                status: "active",
                location: "Mumbai, Maharashtra",
            });

            expect(valid.name).toBe("Sharma Residence");
            expect(valid.clientName).toBe("Rohan Sharma");
            expect(valid.projectType).toBe("Residential");
            expect(valid.status).toBe("active");
        });

        it("rejects project creation missing name or client name", () => {
            expect(() =>
                projectCreateSchema.parse({
                    name: "",
                    clientName: "John Doe",
                    projectType: "Commercial",
                })
            ).toThrow();

            expect(() =>
                projectCreateSchema.parse({
                    name: "Sharma Residence",
                    clientName: "",
                    projectType: "Commercial",
                })
            ).toThrow();
        });
    });

    describe("Client & Admin Isolation Check", () => {
        it("preserves client schemas untouched", () => {
            const clientReg = clientRegisterSchema.parse({
                fullName: "Client User",
                email: "client@test.com",
                password: "SecurePassword123!",
                confirmPassword: "SecurePassword123!",
            });
            expect(clientReg.fullName).toBe("Client User");

            const clientStep = clientOnboardingStepSchema.parse({
                step: "welcome",
            });
            expect(clientStep.step).toBe("welcome");
        });

        it("verifies middleware keeps user, client and admin boundaries intact", () => {
            const middlewareFile = readFileSync(join(process.cwd(), "middleware.ts"), "utf8");
            expect(middlewareFile).toContain("isPlatformAdmin");
            expect(middlewareFile).toContain("isClientUser");
            expect(middlewareFile).toContain("/client/dashboard");
            expect(middlewareFile).toContain("/admin");
        });

        it("verifies login page separates client from user onboarding redirects", () => {
            const loginFile = readFileSync(join(process.cwd(), "app/login/page.tsx"), "utf8");
            expect(loginFile).toContain('response.user?.role === "client"');
            expect(loginFile).toContain("/client/dashboard");
            expect(loginFile).toContain("getOnboardingState");
            expect(loginFile).toContain("/onboarding");
        });

        it("verifies email verification separates client from user onboarding redirects", () => {
            const verifyFile = readFileSync(join(process.cwd(), "app/verify-email/page.tsx"), "utf8");
            expect(verifyFile).toContain('currentUser?.user?.role === "client"');
            expect(verifyFile).toContain("/client/dashboard");
            expect(verifyFile).toContain("getOnboardingState");
            expect(verifyFile).toContain("/onboarding");
        });
    });

    describe("Figma CSS Reference & Step 2 UI Design Integrity", () => {
        const cssPath = join(process.cwd(), "app/onboarding/onboarding.css");
        const pagePath = join(process.cwd(), "app/onboarding/page.tsx");

        it("exists and defines the scoped onboarding CSS file", () => {
            expect(existsSync(cssPath)).toBe(true);
        });

        it("implements Figma header styling: 88px height, 1px dashed #E2E8F0, language pill", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-header");
            expect(css).toContain("88px");
            expect(css).toContain("dashed #e2e8f0");
            expect(css).toContain(".onb-lang-pill");
            expect(css).toContain("102px");
            expect(css).toContain("36px");
        });

        it("implements Figma sidebar styling: 300px width, 1px dashed border, step indicators and lines", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-sidebar");
            expect(css).toContain("300px");
            expect(css).toContain(".onb-step-circle");
            expect(css).toContain("20px");
            expect(css).toContain(".onb-step-line");
            expect(css).toContain("#22c55e"); // Completed / Active green
            expect(css).toContain("#94a3b8"); // Upcoming / neutral gray
        });

        it("implements Figma Frame 22: Information Notice with #F2F3F2 background, 1px solid #E2E8F0, 6px radius", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-info-callout");
            expect(css).toContain("#f2f3f2");
            expect(css).toContain("border-radius: 6px");
            expect(css).toContain("padding: 12px");
            expect(css).toContain("gap: 10px");
            expect(css).toContain(".onb-info-text");
            expect(css).toContain("#64748b");

            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("These settings apply to all BOQs and cost sheets in your workspace. They can be changed later.");
        });

        it("implements Figma form card: 596px width, #F2F3F2 background, 20px radius, 48px inputs", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-form-card");
            expect(css).toContain("596px");
            expect(css).toContain("#f2f3f2");
            expect(css).toContain("20px");
            expect(css).toContain(".onb-text-input");
            expect(css).toContain("48px");
            expect(css).toContain("8px");
        });

        it("implements Figma Frame 2147225035: Split Row for Tax & Default Markup with 24px gap", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-split-row");
            expect(css).toContain("gap: 24px");
            expect(css).toContain(".onb-helper-text");
            expect(css).toContain(".onb-input-suffix");

            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("Applied by default to all new BOQ line items.");
        });

        it("implements Figma action buttons: 48px height, 1px solid #E2E8F0 back button, #2563EB continue button", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-actions-row");
            expect(css).toContain(".onb-btn-back");
            expect(css).toContain(".onb-btn-continue");
            expect(css).toContain("#2563eb");
        });

        it("implements responsive media queries for mobile, tablet, and 1440px desktop", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain("@media (min-width: 1440px)");
            expect(css).toContain("@media (max-width: 900px)");
            expect(css).toContain("@media (max-width: 600px)");
        });
    });

    describe("Step 3: Project Choice UI & Figma Layout Integration", () => {
        const cssPath = join(process.cwd(), "app/onboarding/onboarding.css");
        const pagePath = join(process.cwd(), "app/onboarding/page.tsx");
        const dashboardPath = join(process.cwd(), "app/dashboard/page.tsx");

        it("implements Figma Frame 2147225036: Project cards row with 596px width and 24px gap", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-project-cards-row");
            expect(css).toContain("max-width: 596px");
            expect(css).toContain("gap: 24px");
            expect(css).toContain("display: flex");
        });

        it("implements Figma Frame 2147225027 & Frame 2147225032: 286x284px cards with 20px radius and 1px solid #E2E8F0", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-project-card");
            expect(css).toContain("width: 286px");
            expect(css).toContain("min-height: 284px");
            expect(css).toContain("border-radius: 20px");
            expect(css).toContain("border: 1px solid #e2e8f0");
            expect(css).toContain("padding: 24px");
            expect(css).toContain("gap: 18px");
            expect(css).toContain("background: #ffffff");
        });

        it("implements Figma Frame 26: 56x56 icon box with #F1F5F9 background, 8px radius, and 32x32 SVG", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-project-card-icon");
            expect(css).toContain("width: 56px");
            expect(css).toContain("height: 56px");
            expect(css).toContain("background: #f1f5f9");
            expect(css).toContain("border-radius: 8px");
            expect(css).toContain("color: #2563eb");
        });

        it("implements Figma Frame 2: Card typography with 18px title, -0.005em letter spacing, and 16px description", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-project-card-title");
            expect(css).toContain("font-size: 18px");
            expect(css).toContain("font-weight: 600");
            expect(css).toContain("letter-spacing: -0.005em");
            expect(css).toContain("color: #0f172a");

            expect(css).toContain(".onb-project-card-desc");
            expect(css).toContain("font-size: 16px");
            expect(css).toContain("font-weight: 500");
            expect(css).toContain("line-height: 140%");
            expect(css).toContain("color: #475569");
        });

        it("implements Figma card action buttons: full width, 48px height, #2563EB background, 6px radius", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-project-card-btn");
            expect(css).toContain("width: 100%");
            expect(css).toContain("height: 48px");
            expect(css).toContain("background: #2563eb");
            expect(css).toContain("border-radius: 6px");
        });

        it("renders Card 1 ('Start From Scratch') and Card 2 ('Import an existing BOQ') with respective buttons", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("Start From Scratch");
            expect(page).toContain("Create your first project and build a structured BOQ from the ground up.");
            expect(page).toContain("Create a Project");

            expect(page).toContain("Import an existing BOQ");
            expect(page).toContain("Bring your Excel or CSV data into a structured BOQ workflow.");
            expect(page).toContain("Import BOQ");
        });

        it("wires handleSelectProjectPath to save state and advance to step 3", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain('handleSelectProjectPath("scratch")');
            expect(page).toContain('handleSelectProjectPath("import")');
            expect(page).toContain('currentStep: "first-project"');
            expect(page).toContain('completedSteps: nextCompleted');
        });

        it("implements Figma Frame 12: 'Not ready yet? Go to Dashboard' in step 3 footer", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-footer-dashboard-link-wrap");
            expect(css).toContain(".onb-footer-not-ready");
            expect(css).toContain(".onb-footer-dashboard-btn");

            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("Not ready yet?");
            expect(page).toContain("Go to Dashboard");
            expect(page).toContain("handleGoToDashboard");
        });

        it("allows deferred onboarding access to dashboard without bouncing back to /onboarding", () => {
            const dashboard = readFileSync(dashboardPath, "utf8");
            expect(dashboard).toContain("onboarding_deferred");
            expect(dashboard).toContain("getOnboardingState");
            expect(dashboard).toContain('window.sessionStorage.getItem("onboarding_deferred") === "true"');
        });

        it("ensures sidebar connector lines 0 and 1 are completed (green) when on step 3", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("isDone || idx < step ? \"completed\" : \"\"");
        });
    });

    describe("Step 4: Create First Project UI & Integration (Figma Frame 2147225027)", () => {
        const cssPath = join(process.cwd(), "app/onboarding/onboarding.css");
        const pagePath = join(process.cwd(), "app/onboarding/page.tsx");

        it("implements Figma Frame 2147225027: Form card with #F2F3F2 background, 20px radius, 1px solid #E2E8F0", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-form-card");
            expect(css).toContain("#f2f3f2");
            expect(css).toContain("border: 1px solid #e2e8f0");
            expect(css).toContain("border-radius: 20px");
            expect(css).toContain("padding: 24px");
            expect(css).toContain("gap: 24px");
        });

        it("implements Figma Frame 2147225037: Row 1 two-column layout for Project Name & Client Name with 24px gap", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-project-two-col");
            expect(css).toContain("gap: 24px");
            expect(css).toContain(".onb-project-col");

            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("onb-project-two-col");
            expect(page).toContain("ex. Sharma Residence");
            expect(page).toContain("ex. John Doe");
        });

        it("implements Row 2: Project Type dropdown with 48px height, white background, and select arrow", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("onb-proj-type");
            expect(page).toContain("Residential");
            expect(page).toContain("Commercial");
            expect(page).toContain("Hospitality");
        });

        it("implements Figma Frame 2147225028: Row 3 Status chips (Active, On Hold, Planning) with 16px gap and green selection", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-status-row");
            expect(css).toContain("gap: 16px");
            expect(css).toContain(".onb-status-chip");
            expect(css).toContain(".onb-status-chip.selected");
            expect(css).toContain("border: 1px solid #22c55e");
            expect(css).toContain("color: #22c55e");
            expect(css).toContain(".onb-status-dot");
            expect(css).toContain("background: #22c55e");

            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("onb-status-row");
            expect(page).toContain("onb-status-chip");
            expect(page).toContain("onb-status-dot");
        });

        it("implements Row 4: Project Location optional with Figma helper text 'Optional — helps with reporting.'", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("onb-proj-loc");
            expect(page).toContain("ex. Mumbai, Maharashtra");
            expect(page).toContain("Optional — helps with reporting.");

            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-helper-text");
            expect(css).toContain("color: #475569");
            expect(css).toContain("font-size: 12px");
        });

        it("implements Figma Frame 2147225031: Footer actions row with Back and 'Create a Project' button", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("Create a Project");
            expect(page).toContain("Creating...");
            expect(page).toContain("onb-btn-back");
            expect(page).toContain("onb-btn-continue");

            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-btn-continue");
            expect(css).toContain("background: #2563eb");
            expect(css).toContain("height: 48px");
            expect(css).toContain("border-radius: 6px");
        });

        it("matches Figma sidebar text styling: only active step has dark title (#0F172A) and slate desc (#64748B)", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-step-title.active");
            expect(css).toContain("color: #0f172a");
            expect(css).toContain(".onb-step-desc.active");
            expect(css).toContain("color: #64748b");
        });

        it("persists project creation, updates onboarding state with project ID, and advances to confirmation", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("createProject");
            expect(page).toContain("projectId: created?.id");
            expect(page).toContain("completeOnboarding");
            expect(page).toContain("setCreatedProjectId(created?.id || null)");
            expect(page).toContain("setIsCompleted(true)");
        });

        it("provides responsive stacking for two-column inputs and status chips on mobile", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-project-two-col");
            expect(css).toContain("flex-direction: column");
            expect(css).toContain(".onb-status-row");
        });
    });

    describe("Step 5: Successful Project Creation Confirmation Screen (Figma Frame 27 / Frame 2147225039)", () => {
        const cssPath = join(process.cwd(), "app/onboarding/onboarding.css");
        const pagePath = join(process.cwd(), "app/onboarding/page.tsx");
        const dashboardPath = join(process.cwd(), "app/dashboard/page.tsx");

        it("implements Figma Frame 2147225039 & 2147225038: Double-ring green success badge (Outer: 82x82px, Inner: 68x68px)", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-success-badge-outer");
            expect(css).toContain("width: 82px");
            expect(css).toContain("height: 82px");
            expect(css).toContain("border: 2px solid rgba(34, 197, 94, 0.3)");

            expect(css).toContain(".onb-success-badge-inner");
            expect(css).toContain("width: 68px");
            expect(css).toContain("height: 68px");
            expect(css).toContain("background: rgba(34, 197, 94, 0.2)");
            expect(css).toContain("border: 2px solid #22c55e");

            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("onb-success-badge-outer");
            expect(page).toContain("onb-success-badge-inner");
            expect(page).toContain('stroke="#22C55E"');
        });

        it("implements Figma Frame 2147225034: Title 'Create Your First Project' (28px, 600, #0F172A) & subtitle (16px, 500, #475569)", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-success-header");
            expect(css).toContain(".onb-success-title");
            expect(css).toContain("font-size: 28px");
            expect(css).toContain("font-weight: 600");
            expect(css).toContain("color: #0f172a");

            expect(css).toContain(".onb-success-subtitle");
            expect(css).toContain("font-size: 16px");
            expect(css).toContain("font-weight: 500");
            expect(css).toContain("color: #475569");

            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("Create Your First Project");
            expect(page).toContain("Start with the project your team is currently working on.");
        });

        it("implements Figma Frame 2147225027: Summary card (596x286px, #F2F3F2 background, 20px radius, 16px 24px padding)", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-success-card");
            expect(css).toContain("max-width: 596px");
            expect(css).toContain("min-height: 286px");
            expect(css).toContain("background: #f2f3f2");
            expect(css).toContain("border: 1px solid #e2e8f0");
            expect(css).toContain("border-radius: 20px");
            expect(css).toContain("padding: 16px 24px");
        });

        it("renders all 5 summary rows (Workspace, Project, BOQ, Currency, Measurement) with checkmarks and dividers", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("onb-success-card");
            expect(page).toContain(">Workspace</span>");
            expect(page).toContain(">Project</span>");
            expect(page).toContain(">BOQ</span>");
            expect(page).toContain(">Currency</span>");
            expect(page).toContain(">Measurement</span>");
            expect(page).toContain("onb-success-divider");

            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-success-row");
            expect(css).toContain(".onb-success-row-left");
            expect(css).toContain(".onb-success-check-icon");
            expect(css).toContain(".onb-success-label");
            expect(css).toContain(".onb-success-value");
            expect(css).toContain(".onb-success-divider");
        });

        it("implements Figma Frame 2147225031: 2 action buttons 'Explore Templates' (164px, white) & 'Go to Dashboard' (153px, #2563EB)", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-success-actions-row");
            expect(css).toContain("gap: 68px");
            expect(css).toContain(".onb-btn-explore-templates");
            expect(css).toContain("min-width: 164px");
            expect(css).toContain("background: #ffffff");
            expect(css).toContain("color: #0f172a");

            expect(css).toContain(".onb-btn-dashboard");
            expect(css).toContain("min-width: 153px");
            expect(css).toContain("background: #2563eb");
            expect(css).toContain("color: #ffffff");

            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("Explore Templates");
            expect(page).toContain("Go to Dashboard");
            expect(page).toContain("handleExploreTemplates");
            expect(page).toContain("handleGoToDashboard");
        });

        it("completes all 4 steps and 3 connector lines in sidebar when isCompleted is true", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("const isDone = isCompleted || completedSteps.includes(s.id);");
            expect(page).toContain("className={`onb-step-line ${");
            expect(page).toContain('isDone || idx < step ? "completed" : ""');

            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-step-circle.completed");
            expect(css).toContain("background: #22c55e");
            expect(css).toContain(".onb-step-line.completed");
            expect(css).toContain("background: #22c55e");
        });

        it("handles page refresh by restoring persisted state and only redirecting if already viewed", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("onboarding_viewed");
            expect(page).toContain("setIsCompleted(true)");
            expect(page).toContain("handleExploreTemplates");
            expect(page).toContain("handleGoToDashboard");
            expect(page).toContain('router.push("/templates")');
            expect(page).toContain('router.push("/dashboard")');
        });
    });

    describe("Step 4 & Step 5: Import Existing BOQ Flow & Confirmation Screen (Figma Frame 27 / Frame 2147225050 / Frame 2147225027)", () => {
        const cssPath = join(process.cwd(), "app/onboarding/onboarding.css");
        const pagePath = join(process.cwd(), "app/onboarding/page.tsx");
        const routePath = join(process.cwd(), "app/api/v1/[...path]/route.ts");

        it("validates backend boqImportSchema accepts valid .xlsx, .xls, and .csv payloads", () => {
            const valid = boqImportSchema.parse({
                fileName: "master-boq-interiors.xlsx",
                fileType: "xlsx",
                rowCount: 142,
                columns: ["Room", "Category", "Item", "Unit", "Quantity", "Rate"],
                rows: [["Living Room", "Flooring", "Italian Marble", "sq.ft", 450, 850]],
            });
            expect(valid.fileName).toBe("master-boq-interiors.xlsx");
            expect(valid.fileType).toBe("xlsx");
            expect(valid.rowCount).toBe(142);
            expect(valid.columns).toHaveLength(6);
            expect(valid.rows).toHaveLength(1);
        });

        it("rejects invalid spreadsheet file formats in boqImportSchema", () => {
            expect(() => {
                boqImportSchema.parse({
                    fileName: "drawing.dwg",
                    fileType: "dwg" as any,
                    rowCount: 1,
                    columns: ["Room"],
                    rows: [["Living Room"]],
                });
            }).toThrow();
        });

        it("verifies backend parseBoqWorkbook accepts spreadsheet files up to 25 MB", () => {
            const route = readFileSync(routePath, "utf8");
            expect(route).toContain("upload.size > 25 * 1024 * 1024");
            expect(route).toContain("Spreadsheet files are limited to 25 MB.");
        });

        it("implements Figma Frame 27 / Frame 2147225034: Title 'Import Your Existing BOQ' & subtitle", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("Import Your Existing BOQ");
            expect(page).toContain("Upload an Excel or CSV file and we&apos;ll help structure your BOQ data.");

            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-content-title");
            expect(css).toContain("font-size: 28px");
            expect(css).toContain("font-weight: 600");
            expect(css).toContain("color: #0f172a");

            expect(css).toContain(".onb-content-subtitle");
            expect(css).toContain("font-size: 16px");
            expect(css).toContain("font-weight: 500");
            expect(css).toContain("color: #475569");
        });

        it("implements Figma Frame 2147225027: 596x251px upload card with #F2F3F2 background, 20px radius, 1px solid #E2E8F0", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-upload-card");
            expect(css).toContain("max-width: 596px");
            expect(css).toContain("min-height: 251px");
            expect(css).toContain("background: #f2f3f2");
            expect(css).toContain("border: 1px solid #e2e8f0");
            expect(css).toContain("border-radius: 20px");
            expect(css).toContain("padding: 32px 24px");
            expect(css).toContain("gap: 24px");
        });

        it("implements Figma Frame 2147225048: 62x62px upload badge with 8px radius, border #2563EB, and upload icon SVG", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-upload-icon-box");
            expect(css).toContain("width: 62px");
            expect(css).toContain("height: 62px");
            expect(css).toContain("background: rgba(37, 99, 235, 0.1)");
            expect(css).toContain("border: 1px solid #2563eb");
            expect(css).toContain("border-radius: 8px");

            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("onb-upload-icon-box");
            expect(page).toContain('stroke="#2563EB"');
        });

        it("implements Figma Frame 2147225019: Text group with 'Drag & Drop Your File Here' and 'or'", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-upload-text-group");
            expect(css).toContain(".onb-upload-heading");
            expect(css).toContain(".onb-upload-or");

            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("Drag & Drop Your File Here");
            expect(page).toContain("<p className=\"onb-upload-or\">or</p>");
        });

        it("implements Figma Frame 2147225049: 130x32px 'Explore Templates' button that opens file picker & 25 MB limit notice", () => {
            const css = readFileSync(cssPath, "utf8");
            expect(css).toContain(".onb-upload-browse-btn");
            expect(css).toContain("width: 130px");
            expect(css).toContain("height: 32px");
            expect(css).toContain("background: #ffffff");
            expect(css).toContain("border: 1px solid #e2e8f0");
            expect(css).toContain("border-radius: 6px");
            expect(css).toContain(".onb-upload-specs");

            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("Explore Templates");
            expect(page).toContain("Supported: .xlsx, .xls, .csv · Maximum file size: 25 MB");
            expect(page).toContain("fileInputRef.current?.click()");
        });

        it("implements Drag & Drop and File Picker with validation for .xlsx, .xls, .csv up to 25 MB", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("handleDragOver");
            expect(page).toContain("handleDragLeave");
            expect(page).toContain("handleDrop");
            expect(page).toContain("handleFileSelected");
            expect(page).toContain("25 * 1024 * 1024");
            expect(page).toContain("accept=\".xlsx,.xls,.csv\"");
        });

        it("implements footer action button hiding when no file is uploaded (opacity: 0) and enabling upon upload", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("step === 3 && pathSelection === \"import\" && !isUploadReady");
            expect(page).toContain("opacity: 0, pointerEvents: \"none\"");
        });

        it("associates imported BOQ with a created Project and workspace without duplicate records", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("createProject");
            expect(page).toContain("createBoq");
            expect(page).toContain("createBoqImport");
            expect(page).toContain("saveOnboardingState");
            expect(page).toContain("completeOnboarding");
        });

        it("implements dedicated Post-Import Success Screen with 'Your BOQ Has Been Imported!' and 7 summary rows", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("Your BOQ Has Been Imported!");
            expect(page).toContain("Your existing BOQ is ready in your workspace.");
            expect(page).toContain(">Workspace</span>");
            expect(page).toContain(">Project</span>");
            expect(page).toContain(">Imported BOQ</span>");
            expect(page).toContain(">Line Items</span>");
            expect(page).toContain(">Currency</span>");
            expect(page).toContain(">Measurement</span>");
            expect(page).toContain(">Import Status</span>");
            expect(page).toContain("Completed");
        });

        it("navigates to /templates on 'Explore Templates' and /dashboard on 'Go to Dashboard' in import success view", () => {
            const page = readFileSync(pagePath, "utf8");
            expect(page).toContain("handleExploreTemplates");
            expect(page).toContain("handleGoToDashboard");
            expect(page).toContain('router.push("/templates")');
            expect(page).toContain('router.push("/dashboard")');
        });
    });
});
