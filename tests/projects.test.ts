import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  projectCreateSchema,
  projectPatchSchema,
  projectRoomCreateSchema,
  projectStatusSchema,
} from "../lib/api/validation";

describe("Project request contracts", () => {
  it("accepts the project setup fields and applies a safe default status", () => {
    const result = projectCreateSchema.parse({
      name: "Oberoi Residence",
      clientName: "Nikhil Oberoi",
      projectType: "Residential",
      startDate: "2026-09-01",
      targetCompletionDate: "2026-12-01",
    });
    expect(result.status).toBe("planning");
  });

  it("rejects invalid dates and server-owned mass assignment", () => {
    expect(() => projectCreateSchema.parse({
      name: "Test", clientName: "Client", projectType: "Residential",
      startDate: "2026-12-01", targetCompletionDate: "2026-09-01",
    })).toThrow();
    expect(() => projectCreateSchema.parse({
      name: "Test", clientName: "Client", projectType: "Residential", workspaceId: crypto.randomUUID(),
    })).toThrow();
  });

  it("supports non-empty partial edits, lifecycle changes, and room dimensions", () => {
    expect(projectPatchSchema.parse({ approvedBudget: 4_500_000 })).toEqual({ approvedBudget: 4_500_000 });
    expect(() => projectPatchSchema.parse({})).toThrow();
    expect(projectStatusSchema.parse({ status: "in_progress" }).status).toBe("in_progress");
    expect(projectRoomCreateSchema.parse({ name: "Master Bedroom", roomType: "Bedroom", length: 12, width: 14 }).unit).toBe("ft");
  });
});

describe("Project tenant and import implementation", () => {
  const migration = readFileSync("supabase/migrations/20260901170000_project_user_apis_excel_import.sql", "utf8");
  const route = readFileSync("app/api/v1/[...path]/route.ts", "utf8");
  const collection = JSON.parse(readFileSync("postman/BOQ-Design-Arena-Complete.postman_collection.json", "utf8"));

  it("enables RLS and limits destructive project access to workspace admins", () => {
    expect(migration).toContain("alter table public.project_rooms enable row level security");
    expect(migration).toContain("alter table public.project_imports enable row level security");
    expect(migration).toContain("projects_delete_admin");
    expect(migration).toContain("current_workspace_role(workspace_id) in ('owner','admin')");
  });

  it("parses both Project and BOQ workbooks on the backend with bounded uploads", () => {
    expect(route).toContain("XLSX.read");
    expect(route).toContain("request.formData()");
    expect(route).toContain("10 * 1024 * 1024");
    expect(route).toContain('route === "projects/imports/preview"');
    expect(route).toContain('route === "boq-imports/upload"');
  });

  it("ships an importable Postman collection for all project workflows", () => {
    expect(collection.info.schema).toContain("collection/v2.1.0");
    expect(collection.item.map((item: { name: string }) => item.name)).toContain("11 — Projects & Excel Import");
  });
});
