import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  projectCreateSchema,
  projectPatchSchema,
  projectRoomCreateSchema,
  projectStatusSchema,
  projectRoomRequirementCreateSchema,
  projectRoomRequirementPatchSchema,
  projectRoomRequirementMaterialSchema,
  projectClientInviteSchema,
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
    expect(projectPatchSchema.parse({ imageUrl: "/api/v1/documents/test-doc-id/download" }))
      .toEqual({ imageUrl: "/api/v1/documents/test-doc-id/download" });
    expect(projectPatchSchema.parse({ coverImage: "https://example.com/cover.png" }))
      .toEqual({ coverImage: "https://example.com/cover.png" });
    expect(() => projectPatchSchema.parse({})).toThrow();
    expect(projectStatusSchema.parse({ status: "in_progress" }).status).toBe("in_progress");
    expect(projectRoomCreateSchema.parse({ name: "Master Bedroom", roomType: "Bedroom", length: 12, width: 14 }).unit).toBe("ft");
  });

  it("validates room requirements, dimensions, quantity, partitions, and material assignments", () => {
    const req = projectRoomRequirementCreateSchema.parse({
      name: "Wardrobe",
      category: "Storage",
      length: 8,
      depth: 2,
      height: 8,
      unit: "Unit",
      quantity: 1,
      partitions: 4,
      notes: "Master bedroom master wardrobe with full hanging space",
    });
    expect(req.name).toBe("Wardrobe");
    expect(req.category).toBe("Storage");
    expect(req.partitions).toBe(4);

    const patch = projectRoomRequirementPatchSchema.parse({
      quantity: 2,
      partitions: 6,
    });
    expect(patch.quantity).toBe(2);
    expect(patch.partitions).toBe(6);

    const mat = projectRoomRequirementMaterialSchema.parse({
      materialId: "mat-hdhmr-12",
      materialName: "12mm HDHMR Board",
      materialRate: 118,
      materialUnit: "Sq.ft",
      materialCategory: "HDHMR",
    });
    expect(mat.materialName).toBe("12mm HDHMR Board");
    expect(mat.materialRate).toBe(118);
  });

  it("validates client invitation request schema", () => {
    const valid = projectClientInviteSchema.parse({
      email: "Client@Example.COM ",
      clientName: "Jane Doe",
      message: "Please review the project workspace.",
    });
    expect(valid.email).toBe("client@example.com");
    expect(valid.clientName).toBe("Jane Doe");
    expect(valid.message).toBe("Please review the project workspace.");

    expect(() => projectClientInviteSchema.parse({ email: "not-an-email" })).toThrow();
  });
});

describe("Project tenant and import implementation", () => {
  const migration = readFileSync("supabase/migrations/20260901170000_project_user_apis_excel_import.sql", "utf8");
  const inviteMigration = readFileSync("supabase/migrations/20261006190000_project_client_invitations.sql", "utf8");
  const route = readFileSync("app/api/v1/[...path]/route.ts", "utf8");
  const collection = JSON.parse(readFileSync("postman/BOQ-Design-Arena-Complete.postman_collection.json", "utf8"));

  it("enables RLS and limits destructive project access to workspace admins", () => {
    expect(migration).toContain("alter table public.project_rooms enable row level security");
    expect(migration).toContain("alter table public.project_imports enable row level security");
    expect(migration).toContain("projects_delete_admin");
    expect(migration).toContain("current_workspace_role(workspace_id) in ('owner','admin')");
  });

  it("provisions project_client_invitations with RLS and touch trigger", () => {
    expect(inviteMigration).toContain("create table if not exists public.project_client_invitations");
    expect(inviteMigration).toContain("alter table public.project_client_invitations enable row level security");
    expect(inviteMigration).toContain("create policy project_client_invitations_select");
    expect(inviteMigration).toContain("create trigger project_client_invitations_touch");
  });

  it("is safe to rerun after a partially committed SQL Editor execution", () => {
    expect(migration).toContain("drop constraint if exists projects_area_check");
    expect(migration).toContain("create table if not exists public.project_rooms");
    expect(migration).toContain("drop trigger if exists project_rooms_touch");
    expect(migration).toContain("drop policy if exists projects_update_writer");
  });

  it("parses both Project and BOQ workbooks on the backend with bounded uploads", () => {
    expect(route).toContain("XLSX.read");
    expect(route).toContain("request.formData()");
    expect(route).toContain("10 * 1024 * 1024");
    expect(route).toContain('route === "projects/imports/preview"');
    expect(route).toContain('route === "boq-imports/upload"');
    expect(route).toContain('route.match(/^projects\\/([0-9a-f-]{36})\\/archive$/i)');
    expect(route).toContain('route.match(/^projects\\/([0-9a-f-]{36})\\/client-invite$/i)');
    expect(route).toContain('route.match(/^projects\\/([0-9a-f-]{36})\\/client-invite\\/resend$/i)');
    expect(route).toContain('route.match(/^projects\\/([0-9a-f-]{36})\\/rooms\\/([0-9a-f-]{36})\\/requirements$/i)');
    expect(route).toContain('route.match(/^projects\\/([0-9a-f-]{36})\\/rooms\\/([0-9a-f-]{36})\\/requirements\\/([0-9a-f-]{36})\\/duplicate$/i)');
    expect(route).toContain('route.match(/^projects\\/([0-9a-f-]{36})\\/rooms\\/([0-9a-f-]{36})\\/requirements\\/([0-9a-f-]{36})\\/material$/i)');
  });

  it("ships an importable Postman collection for all project workflows", () => {
    expect(collection.info.schema).toContain("collection/v2.1.0");
    expect(collection.item.map((item: { name: string }) => item.name)).toContain("11 — Projects & Excel Import");
  });

  it("handles client invitation lifecycle, token generation, and audit logging in API", () => {
    expect(route).toContain("project_client_invitations");
    expect(route).toContain("workspace_settings");
    expect(route).toContain("client_invitations");
    expect(route).toContain("audit_logs");
    expect(route).toContain('randomBytes(32).toString("hex")');
    expect(route).toContain("transporter.sendMail");
  });

  it("verifies boq page deep-linking supports projectId and create flags", () => {
    const boqsPage = readFileSync("app/boqs/page.tsx", "utf8");
    expect(boqsPage).toContain('sp.get("projectId")');
    expect(boqsPage).toContain('sp.get("create")');
    expect(boqsPage).toContain('sp.get("id")');
    expect(boqsPage).toContain("Back to Project");
  });

  it("verifies project overview page has action buttons in exact specified order", () => {
    const projectPage = readFileSync("app/projects/[id]/page.tsx", "utf8");
    const reviewIdx = projectPage.indexOf("Review Pending Actions");
    const inviteIdx = projectPage.indexOf("Send Invite to Client");
    const editIdx = projectPage.indexOf("Edit Project");
    expect(reviewIdx).toBeGreaterThan(-1);
    expect(inviteIdx).toBeGreaterThan(reviewIdx);
    expect(editIdx).toBeGreaterThan(inviteIdx);
  });
});

