import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  documentPatchSchema,
  folderCreateSchema,
  folderDeleteSchema,
  proposalCreateSchema,
  proposalPatchSchema,
  proposalStatusSchema,
} from "../lib/api/validation";
import { permissionsFor } from "../lib/domain/permissions";

describe("proposal request contracts", () => {
  const sourceId = "11111111-1111-4111-8111-111111111111";

  it("accepts all four design creation modes and requires a source reference", () => {
    const base = { projectName: "Oberoi Residence", clientName: "Nikhil Oberoi", proposedValue: 5_820_000 };
    expect(proposalCreateSchema.parse(base).sourceType).toBe("scratch");
    for (const sourceType of ["boq", "duplicate", "template"] as const) {
      expect(proposalCreateSchema.parse({ ...base, sourceType, sourceId }).sourceType).toBe(sourceType);
      expect(() => proposalCreateSchema.parse({ ...base, sourceType })).toThrow();
    }
  });

  it("rejects tenant/identity mass assignment and invalid lifecycle states", () => {
    expect(() => proposalCreateSchema.parse({ projectName: "P", clientName: "C", proposedValue: 1, workspaceId: sourceId })).toThrow();
    expect(() => proposalPatchSchema.parse({ status: "won" })).toThrow();
    expect(proposalStatusSchema.parse({ status: "won" })).toEqual({ status: "won" });
  });
});

describe("document request contracts", () => {
  const id = "22222222-2222-4222-8222-222222222222";

  it("validates folder create/delete confirmation and document allowlists", () => {
    expect(folderCreateSchema.parse({ name: "Projects", parentId: null })).toBeTruthy();
    expect(folderDeleteSchema.parse({ confirmation: "Projects" })).toBeTruthy();
    expect(documentPatchSchema.parse({ folderId: id, name: "Final.pdf" })).toBeTruthy();
    expect(() => documentPatchSchema.parse({ workspaceId: id })).toThrow();
  });
});

describe("proposal/document tenant and API controls", () => {
  const migration = readFileSync("supabase/migrations/20260901120000_proposals_documents.sql", "utf8");
  const route = readFileSync("app/api/v1/[...path]/route.ts", "utf8");

  it("enables RLS and workspace membership policies for every new table", () => {
    for (const table of ["proposals", "document_folders", "documents"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
      expect(migration).toContain(`public.${table}`);
    }
    expect(migration).toContain("public.is_workspace_member(workspace_id)");
    expect(migration).toContain("public.current_workspace_role(workspace_id) in ('owner','admin')");
  });

  it("publishes read/write/destructive permission flags", () => {
    expect(permissionsFor("viewer").canCreateProposal).toBe(false);
    expect(permissionsFor("member").canManageDocuments).toBe(true);
    expect(permissionsFor("member").canDeleteDocuments).toBe(false);
    expect(permissionsFor("owner").canArchiveProposal).toBe(true);
    expect(migration).toContain("'canCreateProposal'");
    expect(migration).toContain("'canDeleteDocuments'");
  });

  it("keeps storage private, bounded, and workspace scoped", () => {
    expect(migration).toContain("'workspace-documents', false, 26214400");
    expect(migration).toContain("storage.foldername(name)");
    expect(route).toContain("file.size > 25 * 1024 * 1024");
    expect(route).toContain("checksum_sha256");
  });

  it("exposes proposal, folder, document, download, and DELETE routes", () => {
    for (const fragment of ["route === \"proposals\"", "proposalPdfMatch", "proposalViewMatch", "route === \"document-folders\"", "route === \"documents/upload\"", "downloadMatch", "export async function DELETE"]) {
      expect(route).toContain(fragment);
    }
  });

  it("ships a parseable Postman collection", () => {
    const collection = JSON.parse(readFileSync("postman/BOQ-Design-Arena-Proposals-Documents.postman_collection.json", "utf8"));
    expect(collection.item).toHaveLength(4);
    expect(collection.info.name).toContain("Proposals & Documents");
  });
});
