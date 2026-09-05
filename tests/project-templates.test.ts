import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  projectTemplateCreateSchema,
  projectTemplatePatchSchema,
  projectTemplateSectionSchema,
  projectTemplateUseSchema,
} from "../lib/api/validation";
import { permissionsFor } from "../lib/domain/permissions";

describe("project template user contracts", () => {
  it("accepts bounded template designer payloads and rejects tenant mass assignment", () => {
    const parsed = projectTemplateCreateSchema.parse({
      name: "Premium 3BHK",
      businessType: "Residential",
      projectType: "3BHK",
      structure: { areas: [] },
      costingBoq: { sections: [] },
      workflow: { stages: [], tasks: [], milestones: [], approvals: [], rules: [] },
    });
    expect(parsed.visibility).toBe("workspace");
    expect(() => projectTemplateCreateSchema.parse({ ...parsed, workspaceId: crypto.randomUUID() })).toThrow();
    expect(() => projectTemplatePatchSchema.parse({})).toThrow();
    expect(projectTemplateSectionSchema.parse({ data: { stages: [] } })).toBeTruthy();
  });

  it("validates use-template project dates", () => {
    expect(projectTemplateUseSchema.parse({ projectName: "Home", clientName: "Client" })).toBeTruthy();
    expect(() => projectTemplateUseSchema.parse({ projectName: "Home", clientName: "Client", startDate: "2026-10-02", targetCompletionDate: "2026-10-01" })).toThrow();
  });
});

describe("project template persistence and delivery", () => {
  const migration = readFileSync("supabase/migrations/20260905120000_project_templates_user_apis.sql", "utf8");
  const route = readFileSync("app/api/v1/[...path]/route.ts", "utf8");
  const guide = readFileSync("docs/FRONTEND_INTEGRATION_GUIDE.md", "utf8");
  const collection = JSON.parse(readFileSync("postman/BOQ-Design-Arena-Complete.postman_collection.json", "utf8"));

  it("enforces workspace RLS and user-role permissions", () => {
    for (const table of ["project_templates", "project_template_versions", "project_template_usage"]) {
      expect(migration).toContain(`alter table public.%I enable row level security`);
      expect(migration).toContain(table);
    }
    expect(migration).toContain("public.is_workspace_member(workspace_id)");
    expect(permissionsFor("member").canCreateTemplate).toBe(true);
    expect(permissionsFor("viewer").canUseTemplate).toBe(false);
    expect(permissionsFor("admin").canArchiveTemplate).toBe(true);
  });

  it("exposes all designed sections and ships Postman plus frontend guidance", () => {
    for (const fragment of ["project-templates/overview", "projectTemplateSectionMatch", "projectTemplateDocumentsMatch", "projectTemplateVersionsMatch", "projectTemplateUsageMatch", "projectTemplatePublishMatch", "projectTemplateUseMatch"]) {
      expect(route).toContain(fragment);
    }
    expect(guide).toContain("## Project Templates integration");
    expect(collection.item.some((group: { name: string }) => group.name === "15 — Project Templates (User)")).toBe(true);
  });
});
