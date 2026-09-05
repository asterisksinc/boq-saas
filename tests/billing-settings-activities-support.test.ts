import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  activityApprovalSchema, activityTaskSchema, articleFeedbackSchema,
  paymentMethodSchema, settingsSectionSchema, subscriptionChangeSchema, supportTicketSchema,
} from "../lib/api/validation";

const projectId = "d1000000-0000-4000-8000-000000000001";
const stageId = "f2000000-0000-4000-8000-000000000002";

describe("billing settings activity and support contracts", () => {
  it("accepts user inputs and rejects sensitive or tenant-owned fields", () => {
    expect(subscriptionChangeSchema.parse({ planCode: "business" }).billingFrequency).toBe("monthly");
    expect(paymentMethodSchema.parse({ brand: "Visa", last4: "4242" })).toBeTruthy();
    expect(() => paymentMethodSchema.parse({ brand: "Visa", last4: "4242", cardNumber: "4242424242424242" })).toThrow();
    expect(settingsSectionSchema.parse({ data: { email: true } })).toBeTruthy();
    expect(() => supportTicketSchema.parse({ issueType: "BOQ", subject: "Help", description: "Details", workspaceId: projectId })).toThrow();
  });

  it("validates activities and approval decisions", () => {
    expect(activityTaskSchema.parse({ name: "Review", projectId, stageId }).status).toBe("not_started");
    expect(activityApprovalSchema.parse({ name: "Approve", projectId, stageId, approverName: "Client", dueDate: "2026-09-14" })).toBeTruthy();
    expect(() => activityApprovalSchema.parse({ name: "Approve", projectId, stageId, dueDate: "2026-09-14" })).toThrow();
    expect(articleFeedbackSchema.parse({ helpful: true })).toEqual({ helpful: true });
  });
});

describe("module persistence and delivery artifacts", () => {
  const migration = readFileSync("supabase/migrations/20260905210000_billing_settings_activities_support.sql", "utf8");
  const route = readFileSync("app/api/v1/[...path]/route.ts", "utf8");
  const guide = readFileSync("docs/FRONTEND_INTEGRATION_GUIDE.md", "utf8");
  const seed = readFileSync("scripts/seed-demo-user.mjs", "utf8");
  const collection = JSON.parse(readFileSync("postman/BOQ-Design-Arena-Complete.postman_collection.json", "utf8"));

  it("enables RLS and keeps billing/settings mutations admin-only", () => {
    for (const table of ["workspace_subscriptions", "workspace_settings", "activity_tasks", "activity_approvals", "support_tickets"]) {
      expect(migration).toContain(`public.${table}`);
    }
    expect(migration).toContain("alter table public.%I enable row level security");
    expect(migration).toContain("t||'_insert_admin'");
    expect(migration).toContain("workspace_settings_update_admin");
    expect(migration).toContain("'canManageBilling'");
  });

  it("exposes each API module and documents frontend integration", () => {
    for (const fragment of ["billing/overview", "settings/overview", "activities/summary", "activities/tasks", "activities/approvals", "support/tickets", "route === \"help\""]) expect(route).toContain(fragment);
    for (const group of ["16 — Billing & Settings (User)", "17 — Activities (User)", "18 — Help & Support (User)"]) expect(collection.item.some((item: { name: string }) => item.name === group)).toBe(true);
    expect(guide).toContain("## Billing, Settings, Activities, and Help integration");
    expect(seed).toContain("demo@boq.com");
    expect(seed).toContain("activityApprovals");
  });
});
