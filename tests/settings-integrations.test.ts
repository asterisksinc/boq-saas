import { describe, expect, it } from "vitest";
import { integrationDefinitions, getDefinition } from "../lib/integrations/definitions";
import { permissionsFor } from "../lib/domain/permissions";

describe("Settings Integrations Module & Reference Screen Matching", () => {
  it("contains exactly the 5 target integrations matching the reference screenshot", () => {
    expect(integrationDefinitions).toHaveLength(5);
    const providers = integrationDefinitions.map((d) => d.provider);
    expect(providers).toEqual([
      "meta_lead_ads",
      "google_ads",
      "custom_website",
      "whatsapp",
      "razorpay",
    ]);
  });

  it("verifies accurate titles matching the reference screenshot", () => {
    const titles = integrationDefinitions.map((d) => d.title);
    expect(titles).toEqual([
      "Meta Lead Ads",
      "Google Ads Lead Form Assets",
      "Custom Website",
      "WhatsApp Automation",
      "RazorPay Integration",
    ]);
  });

  it("verifies exact descriptions matching the reference screenshot", () => {
    const meta = getDefinition("meta_lead_ads");
    expect(meta?.description).toBe(
      "Receive new leads from Facebook & Instagram Lead Ads to your BOQ SaaS Account"
    );

    const google = getDefinition("google_ads");
    expect(google?.description).toBe(
      "Receive new leads from Google Ads Lead Form Assets to your BOQ SaaS Account"
    );

    const custom = getDefinition("custom_website");
    expect(custom?.description).toBe(
      "Receive new leads using webhooks from your custom website to your BOQ SaaS Account"
    );

    const whatsapp = getDefinition("whatsapp");
    expect(whatsapp?.description).toBe(
      "Send automated messages to your clients via WhatsApp from your BOQ SaaS Account"
    );

    const razorpay = getDefinition("razorpay");
    expect(razorpay?.description).toBe(
      "Start receiving payments from your clients on the invoices created."
    );
  });

  it("verifies valid icon paths for all definitions", () => {
    for (const def of integrationDefinitions) {
      expect(def.iconPath).toMatch(/^\/assets\/integrations\/[a-z0-9-]+\.svg$/);
    }
  });

  it("enforces role-based permissions: only owner and admin can manage integrations", () => {
    expect(permissionsFor("owner").canManageIntegrations).toBe(true);
    expect(permissionsFor("admin").canManageIntegrations).toBe(true);
    expect(permissionsFor("member").canManageIntegrations).toBe(false);
    expect(permissionsFor("viewer").canManageIntegrations).toBe(false);
  });

  it("maps backend integration status properly to UI state", () => {
    const mockBackendItems = [
      {
        id: "int-1",
        workspaceId: "ws-1",
        provider: "meta_lead_ads" as const,
        name: "Meta Lead Ads",
        status: "connected" as const,
        config: {},
        connectedAt: "2026-09-28T00:00:00Z",
        lastSyncedAt: null,
        createdBy: "user-1",
        createdAt: "2026-09-28T00:00:00Z",
        updatedAt: "2026-09-28T00:00:00Z",
      },
    ];

    const metaDef = getDefinition("meta_lead_ads");
    const metaConnected = mockBackendItems.find((i) => i.provider === metaDef?.provider);
    expect(metaConnected?.status).toBe("connected");
    expect(metaConnected?.id).toBe("int-1");

    const googleDef = getDefinition("google_ads");
    const googleConnected = mockBackendItems.find((i) => i.provider === googleDef?.provider);
    expect(googleConnected).toBeUndefined();
  });
});
