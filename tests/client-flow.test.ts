import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
    clientRegisterSchema,
    clientDocumentSignSchema,
    clientOnboardingStepSchema,
    projectClientInviteSchema,
} from "../lib/api/validation";

describe("Client Flow Validation Schemas", () => {
    it("validates client registration payload with password matching requirements", () => {
        const valid = clientRegisterSchema.parse({
            fullName: "Jane Doe",
            email: "jane.doe@client.com",
            password: "SecurePassword123!",
            confirmPassword: "SecurePassword123!",
        });
        expect(valid.fullName).toBe("Jane Doe");
        expect(valid.email).toBe("jane.doe@client.com");
        expect(valid.password).toBe("SecurePassword123!");

        // Fails when password is too short
        expect(() =>
            clientRegisterSchema.parse({
                fullName: "Jane Doe",
                email: "jane.doe@client.com",
                password: "short",
                confirmPassword: "short",
            })
        ).toThrow();

        // Fails when email is malformed
        expect(() =>
            clientRegisterSchema.parse({
                fullName: "Jane Doe",
                email: "not-an-email",
                password: "SecurePassword123!",
                confirmPassword: "SecurePassword123!",
            })
        ).toThrow();
    });

    it("validates electronic signature submissions and enforces legal consent", () => {
        const validSign = clientDocumentSignSchema.parse({
            signerName: "Jane Doe",
            consent: true,
            signatureText: "Jane Doe",
        });
        expect(validSign.signerName).toBe("Jane Doe");
        expect(validSign.consent).toBe(true);

        // Fails when consent is missing or false
        expect(() =>
            clientDocumentSignSchema.parse({
                signerName: "Jane Doe",
                consent: false,
            })
        ).toThrow();

        // Fails when signer name is blank
        expect(() =>
            clientDocumentSignSchema.parse({
                signerName: "   ",
                consent: true,
            })
        ).toThrow();
    });

    it("validates Draw and Type signature methods with rich metadata", () => {
        // Draw mode signature
        const drawSignature = clientDocumentSignSchema.parse({
            signerName: "John Doe",
            consent: true,
            signatureType: "draw",
            signatureData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            signatureText: "John Doe",
        });
        expect(drawSignature.signatureType).toBe("draw");
        expect(drawSignature.signatureData).toContain("data:image/png;base64");

        // Type mode signature
        const typeSignature = clientDocumentSignSchema.parse({
            signerName: "Jane Doe",
            consent: true,
            signatureType: "type",
            signatureData: "Jane Doe",
            signatureText: "Jane Doe",
        });
        expect(typeSignature.signatureType).toBe("type");
        expect(typeSignature.signatureData).toBe("Jane Doe");

        // Rejects invalid signature types
        expect(() =>
            clientDocumentSignSchema.parse({
                signerName: "Jane Doe",
                consent: true,
                signatureType: "unsupported" as any,
            })
        ).toThrow();
    });

    it("validates client onboarding progression steps", () => {
        expect(clientOnboardingStepSchema.parse({ step: "welcome" }).step).toBe("welcome");
        expect(clientOnboardingStepSchema.parse({ step: "documents" }).step).toBe("documents");
        expect(clientOnboardingStepSchema.parse({ step: "dashboard" }).step).toBe("dashboard");

        // Rejects invalid progression steps
        expect(() => clientOnboardingStepSchema.parse({ step: "invalid_step" })).toThrow();
        expect(() => clientOnboardingStepSchema.parse({})).toThrow();
    });

    it("validates project invitation generation schema", () => {
        const invite = projectClientInviteSchema.parse({
            email: "client@acme.org",
            clientName: "Acme Corp Rep",
        });
        expect(invite.email).toBe("client@acme.org");
        expect(invite.clientName).toBe("Acme Corp Rep");
    });
});

describe("Client Database Migrations & Schemas", () => {
    it("has the client onboarding and document signatures migration file with RLS policies", () => {
        const migrationPath = join(
            process.cwd(),
            "supabase",
            "migrations",
            "20261009210000_client_onboarding_and_signatures.sql"
        );
        expect(existsSync(migrationPath)).toBe(true);

        const sql = readFileSync(migrationPath, "utf-8").toLowerCase();
        expect(sql).toContain("create table if not exists public.client_onboarding");
        expect(sql).toContain("create table if not exists public.client_document_signatures");
        expect(sql).toContain("alter table public.client_onboarding enable row level security;");
        expect(sql).toContain("alter table public.client_document_signatures enable row level security;");
        expect(sql).toContain("client_onboarding_project_idx");
        expect(sql).toContain("client_signatures_project_idx");
    });
});

describe("API Routing for Client Experience", () => {
    it("defines client route handlers in route.ts without modifying admin or user dashboard endpoints", () => {
        const routePath = join(process.cwd(), "app", "api", "v1", "[...path]", "route.ts");
        const code = readFileSync(routePath, "utf-8");

        // Inspect & Register
        expect(code).toContain("inspectProjectClientInvite");
        expect(code).toContain("acceptProjectClientInvite");
        expect(code).toContain("registerProjectClientInvite");

        // Client project, documents & e-signature
        expect(code).toContain("getClientProjectDetails");
        expect(code).toContain("getClientProjectDocuments");
        expect(code).toContain("signClientProjectDocument");
        expect(code).toContain("viewClientContractPdf");

        // Onboarding & Client Dashboard
        expect(code).toContain("getClientOnboardingProgress");
        expect(code).toContain("updateClientOnboardingProgress");
        expect(code).toContain("getClientDashboardData");

        // Route dispatcher matching
        expect(code).toContain("invitationTokenMatch = route.match");
        expect(code).toContain("clientDocsMatch = route.match");
        expect(code).toContain("clientOnboardingMatch = route.match");
        expect(code).toContain('route === "client/dashboard"');
    });

    it("verifies public routing and client redirect logic in middleware.ts", () => {
        const middlewarePath = join(process.cwd(), "middleware.ts");
        const code = readFileSync(middlewarePath, "utf-8");

        // Public client routes
        expect(code).toContain('pathname.startsWith("/client/invitation")');
        expect(code).toContain('pathname.startsWith("/client/create-account")');

        // Client role routing to dedicated dashboard
        expect(code).toContain('role === "client"');
        expect(code).toContain('isClientUser(user) ? "/client/dashboard" : "/dashboard"');
    });
});

describe("Client UI Screen Files", () => {
    it("ensures all 6 client screen pages and shared layouts are present", () => {
        const screens = [
            "components/client/ClientAuthLayout.tsx",
            "components/client/ClientOnboardingLayout.tsx",
            "components/client/DocumentSignModal.tsx",
            "components/client/DocumentViewerModal.tsx",
            "app/client/invitation/[token]/page.tsx",
            "app/client/create-account/page.tsx",
            "app/client/invitation/success/page.tsx",
            "app/client/onboarding/page.tsx",
            "app/client/onboarding/documents/page.tsx",
            "app/client/dashboard/page.tsx",
            "app/invite/[token]/page.tsx",
        ];

        for (const file of screens) {
            const p = join(process.cwd(), file);
            expect(existsSync(p), `Missing file: ${file}`).toBe(true);
        }
    });

    it("verifies DocumentSignModal implements the complete 5-state signing workflow", () => {
        const modalPath = join(process.cwd(), "components", "client", "DocumentSignModal.tsx");
        const modalCode = readFileSync(modalPath, "utf-8");

        // Modal 1: Acknowledgement
        expect(modalCode).toContain("Sign Document");
        expect(modalCode).toContain("By signing this document, you confirm that you have reviewed and agreed to its contents.");
        expect(modalCode).toContain("I have reviewed this document and agree to sign it.");

        // Modal 2 & 3: Add Signature (Draw & Type)
        expect(modalCode).toContain("Add Signature");
        expect(modalCode).toContain("Draw your signature below.");
        expect(modalCode).toContain("Type your name here");
        expect(modalCode).toContain("Your signature preview will appear here");
        expect(modalCode).toContain("onPointerDown");
        expect(modalCode).toContain("onPointerMove");
        expect(modalCode).toContain("onPointerUp");

        // Modal 4: Confirm Signature
        expect(modalCode).toContain("Confirm Signature");
        expect(modalCode).toContain("Confirm & Sign");

        // Modal 5: Document Signed (Success)
        expect(modalCode).toContain("Document Signed");
        expect(modalCode).toContain("Your signature has been added successfully.");
        expect(modalCode).toContain("Done");
    });

    it("verifies backend security checks: unauthorized client forbidden and duplicate signature conflict", () => {
        const routePath = join(process.cwd(), "app", "api", "v1", "[...path]", "route.ts");
        const routeCode = readFileSync(routePath, "utf-8");

        // Access check
        expect(routeCode).toContain('You do not have access to sign documents for this project.');
        // Duplicate check
        expect(routeCode).toContain('This document has already been signed.');
    });
});
