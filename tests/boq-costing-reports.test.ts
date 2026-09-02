import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { boqCreateSchema, boqItemSchema, costingCategorySchema, costingItemSchema, costingScenarioSchema } from "../lib/api/validation";
import { permissionsFor } from "../lib/domain/permissions";

const uuid = "11111111-1111-4111-8111-111111111111";

describe("BOQ contracts", () => {
  it("supports blank and template creation without tenant mass assignment", () => {
    expect(boqCreateSchema.parse({ boqNumber: "BOQ-0071", projectId: uuid }).method).toBe("blank");
    expect(() => boqCreateSchema.parse({ boqNumber: "BOQ-0072", projectId: uuid, method: "template" })).toThrow();
    expect(() => boqCreateSchema.parse({ boqNumber: "BOQ-0073", projectId: uuid, workspaceId: uuid })).toThrow();
  });

  it("validates server-calculated item inputs", () => {
    expect(boqItemSchema.parse({ name: "Wardrobe", unit: "Sq.ft", quantity: 72, rate: 2875 }).taxPercent).toBe(18);
    expect(() => boqItemSchema.parse({ name: "Wardrobe", unit: "Sq.ft", quantity: 0, rate: 2875 })).toThrow();
    expect(() => boqItemSchema.parse({ name: "Wardrobe", unit: "Sq.ft", quantity: 1, rate: 1, amount: 1 })).toThrow();
  });
});

describe("Costing contracts and permissions", () => {
  it("accepts categories items and scenarios", () => {
    expect(costingCategorySchema.parse({ name: "Boards", code: "MAT-BRD", defaultUnit: "Sheet" })).toBeTruthy();
    expect(costingItemSchema.parse({ name: "HDHMR", code: "MAT-BRD-001", categoryId: uuid, unit: "Sheet", baseCost: 1200, sellingRate: 1650 })).toBeTruthy();
    expect(costingScenarioSchema.parse({ name: "Value Engineering", boqId: uuid })).toBeTruthy();
  });

  it("keeps editors and financial reports separated", () => {
    expect(permissionsFor("member").canManageBoq).toBe(true);
    expect(permissionsFor("member").canManageCosting).toBe(true);
    expect(permissionsFor("member").canViewReports).toBe(false);
    expect(permissionsFor("admin").canViewReports).toBe(true);
  });
});

describe("persistence routes and delivery artifacts", () => {
  const migration = readFileSync("supabase/migrations/20260902090000_boq_costing_reports.sql", "utf8");
  const route = readFileSync("app/api/v1/[...path]/route.ts", "utf8");
  const openapi = readFileSync("openapi.yaml", "utf8");
  const collection = JSON.parse(readFileSync("postman/BOQ-Design-Arena-Complete.postman_collection.json", "utf8"));

  it("uses fixed precision generated BOQ amounts workspace RLS and immutable report inputs", () => {
    expect(migration).toContain("numeric(18,2)");
    expect(migration).toContain("amount numeric(18,2) generated always");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("public.is_workspace_member(workspace_id)");
    expect(route).toContain('route === "reports/analytics"');
    expect(route).not.toContain('request.method === "POST" && route === "reports/analytics"');
  });

  it("documents and ships all three modules", () => {
    for (const path of ["/boqs:", "/costing/items:", "/costing/analysis:", "/reports/analytics:"]) expect(openapi).toContain(path);
    for (const name of ["12 — BOQ Management", "13 — Costing", "14 — Reports & Analytics"]) expect(collection.item.some((group: { name: string }) => group.name === name)).toBe(true);
  });
});
