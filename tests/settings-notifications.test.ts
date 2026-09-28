import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import {
    NOTIFICATION_ROWS,
    NOTIFICATION_CHANNELS,
    DEFAULT_NOTIFICATION_MATRIX,
    adaptNotificationSettings,
    serializeNotificationSettings,
} from "../lib/settings/adapter";
import { settingsSectionSchema } from "../lib/api/validation";

describe("Settings Notifications Redesign & Preference Matrix", () => {
    it("defines the exact 7 notification event rows matching reference design in order", () => {
        expect(NOTIFICATION_ROWS).toHaveLength(7);
        expect(NOTIFICATION_ROWS.map((r) => r.id)).toEqual([
            "boq_approval",
            "payment_alert",
            "document_shared",
            "new_comment",
            "task_due",
            "weekly_digest",
            "marketing",
        ]);
        expect(NOTIFICATION_ROWS.map((r) => r.label)).toEqual([
            "BOQ Approval",
            "Payment Alert",
            "Document Shared",
            "New Comment",
            "Task Due",
            "Weekly Digest",
            "Marketing",
        ]);
    });

    it("defines the 4 notification channels matching reference design", () => {
        expect(NOTIFICATION_CHANNELS).toHaveLength(4);
        expect(NOTIFICATION_CHANNELS.map((c) => c.id)).toEqual([
            "email",
            "in_app",
            "push",
            "whatsapp",
        ]);
        expect(NOTIFICATION_CHANNELS.map((c) => c.label)).toEqual([
            "EMAIL",
            "IN-APP",
            "PUSH",
            "WHATSAPP",
        ]);
    });

    it("initializes default matrix with all 7 rows and 4 channels enabled (true)", () => {
        for (const row of NOTIFICATION_ROWS) {
            for (const channel of NOTIFICATION_CHANNELS) {
                expect(DEFAULT_NOTIFICATION_MATRIX[row.id][channel.id]).toBe(true);
            }
        }
    });

    it("adaptNotificationSettings returns defaults when given empty or null data", () => {
        const fromNull = adaptNotificationSettings(null);
        expect(fromNull.boq_approval.email).toBe(true);
        expect(fromNull.marketing.whatsapp).toBe(true);

        const fromEmpty = adaptNotificationSettings({});
        expect(fromEmpty.payment_alert.push).toBe(true);
        expect(fromEmpty.task_due.in_app).toBe(true);
    });

    it("adaptNotificationSettings preserves stored matrix preferences", () => {
        const customMatrix = {
            matrix: {
                boq_approval: { email: false, in_app: true, push: false, whatsapp: true },
                marketing: { email: false, in_app: false, push: false, whatsapp: false },
            },
        };
        const adapted = adaptNotificationSettings(customMatrix);
        expect(adapted.boq_approval.email).toBe(false);
        expect(adapted.boq_approval.in_app).toBe(true);
        expect(adapted.boq_approval.push).toBe(false);
        expect(adapted.boq_approval.whatsapp).toBe(true);
        expect(adapted.marketing.email).toBe(false);
        expect(adapted.marketing.whatsapp).toBe(false);
        // Untouched rows remain default true
        expect(adapted.document_shared.email).toBe(true);
    });

    it("adaptNotificationSettings maps legacy notification preferences correctly", () => {
        const legacy = {
            email: false,
            approvals: false,
            billing: false,
            tasks: false,
            weeklyDigest: false,
        };
        const adapted = adaptNotificationSettings(legacy);
        expect(adapted.boq_approval.email).toBe(false);
        expect(adapted.payment_alert.email).toBe(false);
        expect(adapted.task_due.email).toBe(false);
        expect(adapted.weekly_digest.email).toBe(false);
        expect(adapted.marketing.email).toBe(false);
    });

    it("serializeNotificationSettings prepares matrix and backward-compatible legacy keys", () => {
        const matrix = {
            ...DEFAULT_NOTIFICATION_MATRIX,
            boq_approval: { email: false, in_app: false, push: false, whatsapp: false },
        };
        const serialized = serializeNotificationSettings(matrix);
        expect(serialized.matrix).toBeDefined();
        expect(serialized.matrix.boq_approval.email).toBe(false);
        expect(serialized.approvals).toBe(false);
        expect(serialized.email).toBe(true); // Other rows still have email: true
    });

    it("validates serialized notification payload against settingsSectionSchema", () => {
        const payload = serializeNotificationSettings(DEFAULT_NOTIFICATION_MATRIX);
        const parsed = settingsSectionSchema.safeParse({ data: payload });
        expect(parsed.success).toBe(true);
    });

    it("verifies workspace_settings table and RLS policies in migrations", () => {
        const migration = readFileSync(
            "supabase/migrations/20260905210000_billing_settings_activities_support.sql",
            "utf8"
        );
        expect(migration).toContain("notifications jsonb not null default '{}'");
        expect(migration).toContain("workspace_settings_update_admin");
    });

    it("verifies route.ts handles settings/notifications", () => {
        const routeCode = readFileSync("app/api/v1/[...path]/route.ts", "utf8");
        expect(routeCode).toContain("notifications: \"notifications\"");
        expect(routeCode).toContain("section === \"notifications\"");
        expect(routeCode).toContain("adaptNotificationSettings");
    });
});
