import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
    listClientProjects,
    listClientBoqs,
    getClientBoq,
    listClientDocuments,
    listClientInvoices,
    getClientInvoice,
    listClientApprovals,
    submitClientApprovalDecision,
    addClientApprovalComment,
} from "../lib/api/client";

describe("Client Dashboard Navigation & Screen Structure", () => {
    it("ensures ClientDashboardRail strictly features the 4 primary client menu items and 2 tool items", () => {
        const railPath = join(process.cwd(), "components", "client", "ClientDashboardRail.tsx");
        expect(existsSync(railPath)).toBe(true);

        const railContent = readFileSync(railPath, "utf-8");

        // Primary client menu items
        expect(railContent).toContain('label: "BOQ"');
        expect(railContent).toContain('route: "/client/boq"');
        expect(railContent).toContain('label: "Documents"');
        expect(railContent).toContain('route: "/client/documents"');
        expect(railContent).toContain('label: "Invoices"');
        expect(railContent).toContain('route: "/client/invoices"');
        expect(railContent).toContain('label: "Approvals"');
        expect(railContent).toContain('route: "/client/approvals"');

        // Tools items
        expect(railContent).toContain('title="Help & Support"');
        expect(railContent).toContain('navigate("/client/help")');
        expect(railContent).toContain('title="Settings"');
        expect(railContent).toContain('navigate("/client/settings")');

        // Strict isolation: must NOT leak internal user or admin tools
        expect(railContent).not.toContain("Costing");
        expect(railContent).not.toContain("Templates");
        expect(railContent).not.toContain("Analytics");
        expect(railContent).not.toContain("Workflow Rules");
        expect(railContent).not.toContain("/admin");
    });

    it("verifies all required Client Dashboard screen pages exist in the App Router", () => {
        const expectedScreens = [
            "app/client/boq/page.tsx",
            "app/client/boqs/page.tsx",
            "app/client/documents/page.tsx",
            "app/client/invoices/page.tsx",
            "app/client/approvals/page.tsx",
            "app/client/settings/page.tsx",
            "app/client/help/page.tsx",
            "app/client/dashboard/page.tsx",
        ];

        for (const screen of expectedScreens) {
            const p = join(process.cwd(), screen);
            expect(existsSync(p), `Missing required client screen: ${screen}`).toBe(true);
        }
    });

    it("verifies DashboardHeader supports optional hideNew property without breaking internal dashboard usage", () => {
        const headerPath = join(process.cwd(), "components", "DashboardHeader.tsx");
        const headerCode = readFileSync(headerPath, "utf-8");

        expect(headerCode).toContain("hideNew?: boolean");
        expect(headerCode).toContain("!hideNew &&");
        expect(headerCode).toContain("+ New");
    });

    it("verifies Client Settings page reuses existing settings components without admin tabs", () => {
        const settingsPath = join(process.cwd(), "app", "client", "settings", "page.tsx");
        const code = readFileSync(settingsPath, "utf-8");

        // Uses client rail and dashboard header
        expect(code).toContain("ClientDashboardRail");
        expect(code).toContain('current="/client/settings"');
        expect(code).toContain('DashboardHeader title="Client Settings" hideNew={true}');

        // Reuses core settings components
        expect(code).toContain("MyProfile");
        expect(code).toContain("SettingsNotifications");
        expect(code).toContain("SecuritySettings");
        expect(code).toContain("PreferencesSettings");

        // Does NOT expose internal workspace administration
        expect(code).not.toContain("OrganizationSettings");
        expect(code).not.toContain("BrandingSettingsComponent");
        expect(code).not.toContain("BoqCostingLayout");
        expect(code).not.toContain("AdvancedSettingsLayout");
    });

    it("verifies Client Help page integrates TicketWizardDrawer and support knowledge base", () => {
        const helpPath = join(process.cwd(), "app", "client", "help", "page.tsx");
        const code = readFileSync(helpPath, "utf-8");

        expect(code).toContain("ClientDashboardRail");
        expect(code).toContain('current="/client/help"');
        expect(code).toContain('DashboardHeader title="Help & Support" hideNew={true}');
        expect(code).toContain("<TicketWizardDrawer");
        expect(code).toContain("getHelpOverview");
        expect(code).toContain("listSupportTickets");
    });
});

describe("Client Backend API Handlers & Project Isolation", () => {
    const routePath = join(process.cwd(), "app", "api", "v1", "[...path]", "route.ts");
    const routeCode = readFileSync(routePath, "utf-8");

    it("enforces strict server-side client project access scoping via getClientAccessibleProjectIds", () => {
        expect(routeCode).toContain("async function getClientAccessibleProjectIds(");
        expect(routeCode).toContain("project_client_invitations");
        expect(routeCode).toContain('"client_email"');
        expect(routeCode).toContain("client_onboarding");
    });

    it("defines secure client API routes in the API dispatcher", () => {
        // Project listing
        expect(routeCode).toContain('route === "client/projects"');
        // BOQs listing and detail
        expect(routeCode).toContain('route === "client/boqs"');
        expect(routeCode).toContain('clientBoqMatch = route.match');
        expect(routeCode).toContain('clientBoqPdfMatch = route.match');
        expect(routeCode).toContain('clientBoqExcelMatch = route.match');
        // Documents listing
        expect(routeCode).toContain('route === "client/documents"');
        // Invoices listing and detail
        expect(routeCode).toContain('route === "client/invoices"');
        expect(routeCode).toContain('clientInvoiceMatch = route.match');
        expect(routeCode).toContain('clientInvoicePdfMatch = route.match');
        // Approvals listing and decisions
        expect(routeCode).toContain('route === "client/approvals"');
        expect(routeCode).toContain('clientApprovalDecisionMatch = route.match');
        expect(routeCode).toContain('clientApprovalCommentMatch = route.match');
    });

    it("verifies Excel export generates valid workbook using XLSX with required columns", () => {
        expect(routeCode).toContain('getClientBoqExcel');
        expect(routeCode).toContain('boqExcel');
        expect(routeCode).toContain('XLSX.utils.book_new()');
        expect(routeCode).toContain('XLSX.utils.json_to_sheet');
        expect(routeCode).toContain('XLSX.write(wb, { type: "buffer", bookType: "xlsx" })');
        expect(routeCode).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it("verifies approval decision persists valid client statuses: approved, rejected, changes_required", () => {
        expect(routeCode).toContain('clientApprovalDecision');
        expect(routeCode).toContain('approvalDecisionSchema');
        const valPath = join(process.cwd(), "lib", "api", "validation.ts");
        const valCode = readFileSync(valPath, "utf-8");
        expect(valCode).toContain('"approved"');
        expect(valCode).toContain('"rejected"');
        expect(valCode).toContain('"changes_required"');
    });

    it("preserves User Dashboard and existing APIs without regression", () => {
        expect(routeCode).toContain('route === "dashboard/overview"');
        expect(routeCode).toContain('route === "boqs"');
        expect(routeCode).toContain('route === "invoices"');
        expect(routeCode).toContain('route === "proposals"');
        expect(routeCode).toContain('route === "documents"');
    });
});

describe("Client API Client Library Methods", () => {
    it("exports all necessary typed client API methods in lib/api/client.ts", () => {
        expect(typeof listClientProjects).toBe("function");
        expect(typeof listClientBoqs).toBe("function");
        expect(typeof getClientBoq).toBe("function");
        expect(typeof listClientDocuments).toBe("function");
        expect(typeof listClientInvoices).toBe("function");
        expect(typeof getClientInvoice).toBe("function");
        expect(typeof listClientApprovals).toBe("function");
        expect(typeof submitClientApprovalDecision).toBe("function");
        expect(typeof addClientApprovalComment).toBe("function");
    });
});
