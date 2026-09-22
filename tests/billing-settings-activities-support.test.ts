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

  it("validates support ticket creation and patch schemas with wizard context fields", () => {
    const validTicket = supportTicketSchema.parse({
      issueType: "BOQs",
      subject: "Export failing with 500",
      description: "When clicking export on project 42",
      priority: "high",
      status: "open",
      projectId,
      projectName: "Villa Luxury",
      relatedRecord: "BOQ #102",
      browserDevice: "Chrome on Windows 11",
      businessImpact: "Cannot meet tender deadline tomorrow",
      attemptedAction: "Clicked Export XLSX",
      attachments: [{ name: "error.png", size: 1024, type: "image/png" }],
    });
    expect(validTicket.priority).toBe("high");
    expect(validTicket.status).toBe("open");
    expect(validTicket.projectName).toBe("Villa Luxury");

    const draftTicket = supportTicketSchema.parse({
      issueType: "Account and Login",
      subject: "Draft: Account and Login",
      description: "Draft ticket in progress...",
      status: "draft",
    });
    expect(draftTicket.status).toBe("draft");
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

  it("encodes and restores ticket wizard draft metadata correctly", async () => {
    const { formatTicketDescription, parseTicketMetadata } = await import("../lib/api/auth");
    const meta = {
      currentStep: 3,
      attemptedAction: "Exporting BOQ to XLSX",
      projectId: "d1000000-0000-4000-8000-000000000001",
      projectName: "Downtown Highrise",
      relatedRecord: "BOQ #99",
      browserDevice: "Chrome on Windows 11",
      businessImpact: "Client tender presentation is in 2 hours",
      attachments: [{ name: "export_error.png", size: 45000, type: "image/png" }],
    };

    const formatted = formatTicketDescription("We are unable to export our BOQ.", meta);
    expect(formatted).toContain("We are unable to export our BOQ.");
    expect(formatted).toContain("Exporting BOQ to XLSX");
    expect(formatted).toContain("Downtown Highrise");
    expect(formatted).toContain("<!-- TICKET_METADATA:");

    const parsed = parseTicketMetadata(formatted);
    expect(parsed.cleanDescription).toBe("We are unable to export our BOQ.");
    expect(parsed.metadata.currentStep).toBe(3);
    expect(parsed.metadata.attemptedAction).toBe("Exporting BOQ to XLSX");
    expect(parsed.metadata.projectName).toBe("Downtown Highrise");
    expect(parsed.metadata.attachments?.[0].name).toBe("export_error.png");
  });

  it("implements the 7-step slide-over TicketWizardDrawer component and connects to help pages", () => {
    const drawerCode = readFileSync("components/TicketWizardDrawer.tsx", "utf8");
    const helpPageCode = readFileSync("app/help/page.tsx", "utf8");
    const articlePageCode = readFileSync("app/help/[id]/page.tsx", "utf8");
    const globalsCss = readFileSync("app/globals.css", "utf8");

    // Drawer header and 7 steps
    expect(drawerCode).toContain("Let's Get This Sorted.");
    expect(drawerCode).toContain("Step 01 of 07");
    expect(drawerCode).toContain("Step 02 of 07");
    expect(drawerCode).toContain("Step 03 of 07");
    expect(drawerCode).toContain("Step 04 of 07");
    expect(drawerCode).toContain("Step 05 of 07");
    expect(drawerCode).toContain("Step 06 of 07");
    expect(drawerCode).toContain("Step 07 of 07");

    // Drawer footer actions
    expect(drawerCode).toContain("Save as Draft");
    expect(drawerCode).toContain("Submit Ticket");
    expect(drawerCode).toContain("Unsaved Changes");

    // CSS classes
    expect(globalsCss).toContain(".ticket-drawer-backdrop");
    expect(globalsCss).toContain(".ticket-drawer");
    expect(globalsCss).toContain(".ticket-category-grid");
    expect(globalsCss).toContain(".ticket-dropzone");

    // Pages mount the drawer
    expect(helpPageCode).toContain("<TicketWizardDrawer");
    expect(articlePageCode).toContain("<TicketWizardDrawer");
  });
});
