import { describe, expect, it } from "vitest";
import {
    workspaceUserCreateSchema,
    workspaceUserPatchSchema,
    workspaceRoleCreateSchema,
    workspaceRolePatchSchema,
    workspacePermissionToggleSchema,
} from "../lib/api/validation";

describe("Security & Access Validation Schemas", () => {
    describe("workspaceUserCreateSchema", () => {
        it("validates valid user creation payload", () => {
            const valid = {
                firstName: "Robert",
                lastName: "Fox",
                email: "robert.fox@example.com",
                phone: "(406) 555-0120",
                role: "Technician",
            };
            const parsed = workspaceUserCreateSchema.parse(valid);
            expect(parsed.firstName).toBe("Robert");
            expect(parsed.lastName).toBe("Fox");
            expect(parsed.email).toBe("robert.fox@example.com");
            expect(parsed.phone).toBe("(406) 555-0120");
            expect(parsed.role).toBe("Technician");
        });

        it("lowercases email automatically", () => {
            const parsed = workspaceUserCreateSchema.parse({
                firstName: "Bessie",
                lastName: "Cooper",
                email: "BESSIE.COOPER@EXAMPLE.COM",
                phone: "(406) 555-0120",
                role: "Designer",
            });
            expect(parsed.email).toBe("bessie.cooper@example.com");
        });

        it("rejects invalid email formats", () => {
            expect(() =>
                workspaceUserCreateSchema.parse({
                    firstName: "Robert",
                    lastName: "Fox",
                    email: "not-an-email",
                    phone: "1234567890",
                    role: "Technician",
                })
            ).toThrow("Valid email address is required");
        });

        it("rejects empty first or last name", () => {
            expect(() =>
                workspaceUserCreateSchema.parse({
                    firstName: "",
                    lastName: "Fox",
                    email: "test@example.com",
                    phone: "1234567890",
                    role: "Technician",
                })
            ).toThrow("First name is required");

            expect(() =>
                workspaceUserCreateSchema.parse({
                    firstName: "Robert",
                    lastName: "   ",
                    email: "test@example.com",
                    phone: "1234567890",
                    role: "Technician",
                })
            ).toThrow("Last name is required");
        });

        it("rejects unknown extra properties (strict)", () => {
            expect(() =>
                workspaceUserCreateSchema.parse({
                    firstName: "Robert",
                    lastName: "Fox",
                    email: "test@example.com",
                    phone: "1234567890",
                    role: "Technician",
                    maliciousRole: "superadmin",
                })
            ).toThrow();
        });
    });

    describe("workspaceUserPatchSchema", () => {
        it("allows partial updates", () => {
            const parsed = workspaceUserPatchSchema.parse({
                phone: "(406) 555-9999",
                role: "Sales Engineer",
            });
            expect(parsed.phone).toBe("(406) 555-9999");
            expect(parsed.role).toBe("Sales Engineer");
            expect(parsed.firstName).toBeUndefined();
        });

        it("rejects empty patch objects", () => {
            expect(() => workspaceUserPatchSchema.parse({})).toThrow(
                "At least one field is required to update."
            );
        });
    });

    describe("workspaceRoleCreateSchema & workspaceRolePatchSchema", () => {
        it("validates role creation payload", () => {
            const parsed = workspaceRoleCreateSchema.parse({
                name: "Marketing Manager",
                description: "Manages outbound marketing and customer proposals",
            });
            expect(parsed.name).toBe("Marketing Manager");
        });

        it("rejects empty role name", () => {
            expect(() =>
                workspaceRoleCreateSchema.parse({
                    name: "   ",
                })
            ).toThrow("Role name is required");
        });

        it("validates role patch payload", () => {
            const parsed = workspaceRolePatchSchema.parse({
                name: "Senior Technician",
            });
            expect(parsed.name).toBe("Senior Technician");
        });
    });

    describe("workspacePermissionToggleSchema", () => {
        it("validates individual permission toggle", () => {
            const parsed = workspacePermissionToggleSchema.parse({
                permissionId: "dashboard.count_summary",
                enabled: true,
            });
            expect(parsed.permissionId).toBe("dashboard.count_summary");
            expect(parsed.enabled).toBe(true);
        });

        it("validates category-level permission toggle", () => {
            const parsed = workspacePermissionToggleSchema.parse({
                category: "DASHBOARD",
                enabled: false,
            });
            expect(parsed.category).toBe("DASHBOARD");
            expect(parsed.enabled).toBe(false);
        });

        it("rejects when neither permissionId nor category is provided", () => {
            expect(() =>
                workspacePermissionToggleSchema.parse({
                    enabled: true,
                })
            ).toThrow("Either permissionId or category is required.");
        });
    });
});

describe("Security & Access Architecture & UI Contract Verification", () => {
    it("verifies Settings navigation includes Security & Access tab", async () => {
        const fs = await import("node:fs");
        const navCode = fs.readFileSync("components/settings/SettingsNavigation.tsx", "utf8");
        expect(navCode).toContain('{ key: "security", label: "Security & Access" }');
    });

    it("verifies app/settings/page.tsx renders SecurityAccessLayout under security tab", async () => {
        const fs = await import("node:fs");
        const settingsPage = fs.readFileSync("app/settings/page.tsx", "utf8");
        expect(settingsPage).toContain('import SecurityAccessLayout from "@/components/settings/security/SecurityAccessLayout"');
        expect(settingsPage).toContain('if (activeTab === "security")');
        expect(settingsPage).toContain("<SecurityAccessLayout");
    });

    it("verifies SecurityAccessLayout coordinates User and Roles & Privileges tabs", async () => {
        const fs = await import("node:fs");
        const layoutCode = fs.readFileSync("components/settings/security/SecurityAccessLayout.tsx", "utf8");
        expect(layoutCode).toContain("<SecurityAccessNavigation");
        expect(layoutCode).toContain("<UsersSection");
        expect(layoutCode).toContain("<RoleSection");
        expect(layoutCode).toContain('activeSubTab === "user"');
    });

    it("verifies SecurityAccessNavigation matches Reference Design 1 & 3 submenu", async () => {
        const fs = await import("node:fs");
        const subNavCode = fs.readFileSync("components/settings/security/SecurityAccessNavigation.tsx", "utf8");
        expect(subNavCode).toContain("SELECT MENU");
        expect(subNavCode).toContain('{ key: "user", label: "User" }');
        expect(subNavCode).toContain('{ key: "roles", label: "Roles & Privileges" }');
    });

    it("verifies UsersSection contains Header, Add User button, and Modals", async () => {
        const fs = await import("node:fs");
        const usersCode = fs.readFileSync("components/settings/security/UsersSection.tsx", "utf8");
        expect(usersCode).toContain("User");
        expect(usersCode).toContain("Add User");
        expect(usersCode).toContain("<UserCard");
        expect(usersCode).toContain("<UserFormModal");
        expect(usersCode).toContain("<DeleteUserDialog");
    });

    it("verifies UserCard matches Reference Design 1 structure", async () => {
        const fs = await import("node:fs");
        const cardCode = fs.readFileSync("components/settings/security/UserCard.tsx", "utf8");
        expect(cardCode).toContain("security-user-card");
        expect(cardCode).toContain("security-user-avatar");
        expect(cardCode).toContain("security-user-name");
        expect(cardCode).toContain("security-user-role");
        expect(cardCode).toContain("security-icon-btn edit");
        expect(cardCode).toContain("security-icon-btn delete");
        expect(cardCode).toContain("security-user-card-divider");
        expect(cardCode).toContain("Phone:");
        expect(cardCode).toContain("Email:");
    });

    it("verifies UserFormModal matches Reference Design 2 fields", async () => {
        const fs = await import("node:fs");
        const modalCode = fs.readFileSync("components/settings/security/UserFormModal.tsx", "utf8");
        expect(modalCode).toContain("Add User");
        expect(modalCode).toContain("Create a new user and assign their access.");
        expect(modalCode).toContain("First Name");
        expect(modalCode).toContain("Last Name");
        expect(modalCode).toContain("Email");
        expect(modalCode).toContain("Phone");
        expect(modalCode).toContain("Role");
        expect(modalCode).toContain("Save User");
        expect(modalCode).toContain("Cancel");
    });

    it("verifies RoleSection & RolePermissionMatrix match Reference Design 3", async () => {
        const fs = await import("node:fs");
        const roleSectionCode = fs.readFileSync("components/settings/security/RoleSection.tsx", "utf8");
        const matrixCode = fs.readFileSync("components/settings/security/RolePermissionMatrix.tsx", "utf8");
        const catRowCode = fs.readFileSync("components/settings/security/PermissionCategoryRow.tsx", "utf8");

        expect(roleSectionCode).toContain("Roles & Privileges");
        expect(roleSectionCode).toContain("Add Role");
        expect(matrixCode).toContain("Type privilege name");
        expect(matrixCode).toContain("security-matrix-search-input");
        expect(matrixCode).toContain("security-role-edit-btn");
        expect(catRowCode).toContain("security-category-row");
        expect(catRowCode).toContain("indeterminate");
    });

    it("verifies RoleFormModal matches Reference Design 4", async () => {
        const fs = await import("node:fs");
        const roleModalCode = fs.readFileSync("components/settings/security/RoleFormModal.tsx", "utf8");
        expect(roleModalCode).toContain("Add Role");
        expect(roleModalCode).toContain("Create a new role and set the basic information.");
        expect(roleModalCode).toContain("Role Name");
        expect(roleModalCode).toContain("e.g. Marketing Manager");
        expect(roleModalCode).toContain("Save Role");
        expect(roleModalCode).toContain("Cancel");
    });

    it("verifies CSS styling classes in app/globals.css", async () => {
        const fs = await import("node:fs");
        const cssCode = fs.readFileSync("app/globals.css", "utf8");
        expect(cssCode).toContain(".security-access-container");
        expect(cssCode).toContain(".security-user-card");
        expect(cssCode).toContain(".security-user-avatar");
        expect(cssCode).toContain(".security-user-card-divider");
        expect(cssCode).toContain(".security-matrix-card");
        expect(cssCode).toContain(".security-matrix-search-input");
        expect(cssCode).toContain(".security-custom-checkbox.checked");
        expect(cssCode).toContain(".security-custom-checkbox.indeterminate");
        expect(cssCode).toContain(".security-modal-overlay");
        expect(cssCode).toContain(".security-modal-box");
    });

    it("verifies API route handlers and endpoints in route.ts", async () => {
        const fs = await import("node:fs");
        const routeCode = fs.readFileSync("app/api/v1/[...path]/route.ts", "utf8");
        expect(routeCode).toContain('route === "settings/security/users"');
        expect(routeCode).toContain('route.match(/^settings\\/security\\/users\\/([0-9a-f-]{36})$/i)');
        expect(routeCode).toContain('route === "settings/security/roles"');
        expect(routeCode).toContain('route.match(/^settings\\/security\\/roles\\/([0-9a-f-]{36})$/i)');
        expect(routeCode).toContain('route.match(/^settings\\/security\\/roles\\/([0-9a-f-]{36})\\/permissions$/i)');
        expect(routeCode).toContain("listWorkspaceUsers");
        expect(routeCode).toContain("createWorkspaceUser");
        expect(routeCode).toContain("updateWorkspaceUser");
        expect(routeCode).toContain("deleteWorkspaceUser");
        expect(routeCode).toContain("listWorkspaceRolesAndPermissions");
        expect(routeCode).toContain("createWorkspaceRole");
        expect(routeCode).toContain("updateWorkspaceRole");
        expect(routeCode).toContain("deleteWorkspaceRole");
        expect(routeCode).toContain("toggleRolePermissions");
    });

    it("verifies database migration creates workspace_roles, permission_definitions, workspace_role_permissions", async () => {
        const fs = await import("node:fs");
        const migration = fs.readFileSync(
            "supabase/migrations/20260928180000_security_access_roles_permissions.sql",
            "utf8"
        );
        expect(migration).toContain("create table if not exists public.workspace_roles");
        expect(migration).toContain("create table if not exists public.permission_definitions");
        expect(migration).toContain("create table if not exists public.workspace_role_permissions");
        expect(migration).toContain("current_workspace_role");
        expect(migration).toContain("initialize_workspace_roles");
        expect(migration).toContain("DASHBOARD");
        expect(migration).toContain("ENQUIRY");
        expect(migration).toContain("Count Summary");
        expect(migration).toContain("Sales Engineer");
        expect(migration).toContain("Technician");
    });
});
