import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { invoiceCreateSchema, invoicePatchSchema, invoiceStatusSchema, paymentCreateSchema } from "../lib/api/validation";
import { permissionsFor } from "../lib/domain/permissions";

const invoice = {
  type: "invoice" as const,
  clientName: "Kohinoor Group",
  billingAddress: { line1: "42 Main Road", city: "Mumbai", state: "Maharashtra", pincode: "400052" },
  projectName: "Kohinoor Office - L4",
  issueDate: "2026-09-01",
  dueDate: "2026-09-15",
  milestone: "Design Stage - 30%",
  taxRate: 18,
  status: "draft" as const,
  items: [{ description: "Interior Design Services", quantity: 1, rate: 220000 }],
};

describe("invoice request contracts", () => {
  it("accepts the create screen fields and all document types", () => {
    expect(invoiceCreateSchema.parse(invoice).type).toBe("invoice");
    for (const type of ["invoice", "pro_forma", "quote"] as const) expect(invoiceCreateSchema.parse({ ...invoice, type })).toBeTruthy();
  });

  it("rejects bad dates, empty items, and tenant mass assignment", () => {
    expect(() => invoiceCreateSchema.parse({ ...invoice, dueDate: "2026-08-31" })).toThrow();
    expect(() => invoiceCreateSchema.parse({ ...invoice, items: [] })).toThrow();
    expect(() => invoiceCreateSchema.parse({ ...invoice, workspaceId: "11111111-1111-4111-8111-111111111111" })).toThrow();
  });

  it("keeps editing, lifecycle, and payment payloads allowlisted", () => {
    expect(invoicePatchSchema.parse({ additionalNotes: "Pay within 15 days" })).toBeTruthy();
    expect(invoiceStatusSchema.parse({ status: "sent" })).toEqual({ status: "sent" });
    expect(paymentCreateSchema.parse({ amount: 1000, method: "upi" })).toBeTruthy();
    expect(() => paymentCreateSchema.parse({ amount: -1, method: "upi" })).toThrow();
  });
});

describe("invoice persistence and authorization", () => {
  const migration = readFileSync("supabase/migrations/20260901150000_invoices.sql", "utf8");
  const projectFilterMigration = readFileSync("supabase/migrations/20260920220000_invoice_project_filter_index.sql", "utf8");
  const route = readFileSync("app/api/v1/[...path]/route.ts", "utf8");

  it("uses fixed precision, server totals, workspace RLS, and atomic payment checks", () => {
    expect(migration).toContain("numeric(18,2)");
    expect(migration).toContain("round(sum((item ->> 'quantity')::numeric");
    expect(migration).toContain("alter table public.invoices enable row level security");
    expect(migration).toContain("public.is_workspace_member(workspace_id)");
    expect(migration).toContain("payment exceeds outstanding amount");
    expect(projectFilterMigration).toContain("invoices_workspace_project_updated_idx");
    expect(migration).toContain("public.set_invoice_status");
    expect(migration).toContain("public.archive_invoice");
    expect(migration).not.toContain("grant update (status");
  });

  it("supports internal user management without changing auth personas", () => {
    expect(permissionsFor("viewer").canCreateInvoice).toBe(false);
    expect(permissionsFor("member").canCreateInvoice).toBe(true);
    expect(permissionsFor("member").canRecordPayment).toBe(true);
    expect(permissionsFor("admin").canDeleteInvoice).toBe(true);
    expect(migration).not.toContain("alter table auth.users");
  });

  it("exposes list, summary, detail, status, payment, PDF, and archive routes", () => {
    for (const fragment of ["route === \"invoices\"", "route === \"invoices/summary\"", "invoiceStatusMatch", "invoicePaymentMatch", "invoicePdfMatch", "archiveInvoice"]) {
      expect(route).toContain(fragment);
    }
    expect(route).toContain("const projectId = request.nextUrl.searchParams.get(\"projectId\")");
    expect(route).toContain("query = query.eq(\"project_id\", projectId)");
  });

  it("ships a parseable invoice Postman collection", () => {
    const collection = JSON.parse(readFileSync("postman/BOQ-Design-Arena-Complete.postman_collection.json", "utf8"));
    expect(collection.info.name).toContain("Complete API");
    expect(collection.item.some((group: { name: string }) => group.name === "10 — Invoices")).toBe(true);
  });
});
