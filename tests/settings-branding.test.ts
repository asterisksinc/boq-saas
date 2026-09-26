import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
    brandAssetTypeSchema,
    brandHexColorSchema,
    brandColorsSchema,
    brandingSettingsPatchSchema,
    brandAssetDeleteSchema,
} from "../lib/api/validation";
import { deriveConfigurationHealth, formatActionDescription } from "../lib/settings/adapter";
import { SettingsOverview } from "../lib/api/auth";

describe("Settings Branding Validation & Contracts", () => {
    it("validates all supported brand asset types and rejects invalid ones", () => {
        const validTypes = ["primaryLogo", "lightLogo", "darkLogo", "favicon", "signature"];
        for (const type of validTypes) {
            expect(brandAssetTypeSchema.parse(type)).toBe(type);
        }

        expect(() => brandAssetTypeSchema.parse("invalidLogo")).toThrow();
        expect(() => brandAssetTypeSchema.parse("banner")).toThrow();
        expect(() => brandAssetTypeSchema.parse(123)).toThrow();
    });

    it("validates HEX color formats strictly", () => {
        expect(brandHexColorSchema.parse("#2563EB")).toBe("#2563EB");
        expect(brandHexColorSchema.parse("#E2E8F0")).toBe("#E2E8F0");
        expect(brandHexColorSchema.parse("#64748B")).toBe("#64748B");
        expect(brandHexColorSchema.parse("#0F172A")).toBe("#0F172A");
        expect(brandHexColorSchema.parse("#fff")).toBe("#fff");

        // Invalid hex
        expect(() => brandHexColorSchema.parse("blue")).toThrow();
        expect(() => brandHexColorSchema.parse("2563EB")).toThrow();
        expect(() => brandHexColorSchema.parse("#GGGGGG")).toThrow();
        expect(() => brandHexColorSchema.parse("#12")).toThrow();
    });

    it("validates full brand colors schema with all 4 required properties", () => {
        const validColors = {
            primary: "#2563EB",
            secondary: "#E2E8F0",
            accent: "#64748B",
            text: "#0F172A",
        };
        const parsed = brandColorsSchema.parse(validColors);
        expect(parsed.primary).toBe("#2563EB");
        expect(parsed.secondary).toBe("#E2E8F0");
        expect(parsed.accent).toBe("#64748B");
        expect(parsed.text).toBe("#0F172A");

        // Reject missing or invalid
        expect(() => brandColorsSchema.parse({ primary: "#2563EB" })).toThrow();
        expect(() =>
            brandColorsSchema.parse({
                ...validColors,
                primary: "invalid",
            })
        ).toThrow();
    });

    it("validates button style, document spacing, and typography in patch schema", () => {
        const validPatch = {
            colors: {
                primary: "#2563EB",
                secondary: "#E2E8F0",
            },
            font: "Urbanist",
            buttonStyle: "rounded" as const,
            documentSpacing: "compact" as const,
        };

        const parsed = brandingSettingsPatchSchema.parse(validPatch);
        expect(parsed.font).toBe("Urbanist");
        expect(parsed.buttonStyle).toBe("rounded");
        expect(parsed.documentSpacing).toBe("compact");

        // Test alternative valid enum options
        const pillSpacious = brandingSettingsPatchSchema.parse({
            buttonStyle: "pill",
            documentSpacing: "spacious",
        });
        expect(pillSpacious.buttonStyle).toBe("pill");
        expect(pillSpacious.documentSpacing).toBe("spacious");

        const squareStandard = brandingSettingsPatchSchema.parse({
            buttonStyle: "square",
            documentSpacing: "standard",
        });
        expect(squareStandard.buttonStyle).toBe("square");
        expect(squareStandard.documentSpacing).toBe("standard");

        // Rejects invalid options
        expect(() =>
            brandingSettingsPatchSchema.parse({ buttonStyle: "circle" })
        ).toThrow();
        expect(() =>
            brandingSettingsPatchSchema.parse({ documentSpacing: "huge" })
        ).toThrow();
    });

    it("validates brand asset delete schema", () => {
        expect(brandAssetDeleteSchema.parse({ assetType: "primaryLogo" })).toEqual({
            assetType: "primaryLogo",
        });
        expect(() => brandAssetDeleteSchema.parse({ assetType: "unknown" })).toThrow();
    });
});

describe("Settings Health & Action Descriptions for Branding", () => {
    it("reports branding health as DONE when logo is configured and WARNING when missing", () => {
        const overviewWithLogo: SettingsOverview = {
            profile: { displayName: "Admin", avatarUrl: null },
            role: "owner",
            completionPercent: 80,
            usage: { projects: 1, boqs: 1, templates: 1, storageBytes: 1024, aiCredits: null },
            settings: {
                branding: { primaryLogo: "https://example.com/logo.png", primaryColor: "#2563EB" },
            },
            recentChanges: [],
        };

        const cardsDone = deriveConfigurationHealth(overviewWithLogo);
        const brandingCardDone = cardsDone.find((c) => c.id === "branding");
        expect(brandingCardDone?.status).toBe("DONE");
        expect(brandingCardDone?.subtitle).toBe("Logo & colors configured");

        const overviewWithoutLogo: SettingsOverview = {
            profile: { displayName: "Admin", avatarUrl: null },
            role: "owner",
            completionPercent: 50,
            usage: { projects: 0, boqs: 0, templates: 0, storageBytes: 0, aiCredits: null },
            settings: {
                branding: { primaryColor: "#2563EB" },
            },
            recentChanges: [],
        };

        const cardsWarning = deriveConfigurationHealth(overviewWithoutLogo);
        const brandingCardWarning = cardsWarning.find((c) => c.id === "branding");
        expect(brandingCardWarning?.status).toBe("WARNING");
        expect(brandingCardWarning?.subtitle).toBe("Needs logo upload");
    });

    it("formats branding audit actions correctly", () => {
        expect(formatActionDescription("settings.branding.updated")).toBe(
            "Updated brand identity & colors"
        );
        expect(formatActionDescription("settings.branding.asset_uploaded")).toBe(
            "Uploaded brand asset"
        );
        expect(formatActionDescription("settings.branding.asset_deleted")).toBe(
            "Removed brand asset"
        );
    });
});

describe("Backend API Route Integration for Branding", () => {
    const routeCode = readFileSync("app/api/v1/[...path]/route.ts", "utf8");

    it("implements uploadBrandingAsset with workspace isolation and storage cleanup", () => {
        expect(routeCode).toContain("async function uploadBrandingAsset");
        expect(routeCode).toContain("settings/branding/assets");
        expect(routeCode).toContain("workspace-documents");
        expect(routeCode).toContain("scoped.access.workspaceId");
        expect(routeCode).toContain("createSignedUrl");
        expect(routeCode).toContain("settings.branding.asset_uploaded");
    });

    it("implements deleteBrandingAsset with asset cleanup and audit log", () => {
        expect(routeCode).toContain("async function deleteBrandingAsset");
        expect(routeCode).toContain("settings.branding.asset_deleted");
    });

    it("implements getBrandingPreviewData with organization and document fallbacks", () => {
        expect(routeCode).toContain("async function getBrandingPreviewData");
        expect(routeCode).toContain("settings/branding/preview-data");
        expect(routeCode).toContain("BOQ-2026-014");
        expect(routeCode).toContain("Arvin Interiors");
    });

    it("synchronizes primary logo with workspace_profiles.logo_url for cross-app consistency", () => {
        expect(routeCode).toContain('.from("workspace_profiles").update({ logo_url:');
    });
});

describe("UI Styling & Component Architecture for Branding", () => {
    const globalsCss = readFileSync("app/globals.css", "utf8");
    const settingsPage = readFileSync("app/settings/page.tsx", "utf8");

    it("defines all required CSS classes matching the reference designs", () => {
        expect(globalsCss).toContain(".brand-settings-container");
        expect(globalsCss).toContain(".brand-assets-grid");
        expect(globalsCss).toContain(".brand-asset-dropzone");
        expect(globalsCss).toContain(".brand-asset-delete-btn");
        expect(globalsCss).toContain(".brand-system-layout");
        expect(globalsCss).toContain(".brand-colors-grid");
        expect(globalsCss).toContain(".brand-color-swatch-btn");
        expect(globalsCss).toContain(".brand-style-pill");
        expect(globalsCss).toContain(".brand-live-preview-card");
        expect(globalsCss).toContain(".brand-preview-banner");
        expect(globalsCss).toContain(".doc-preview-tabs-bar");
        expect(globalsCss).toContain(".doc-preview-sheet");
        expect(globalsCss).toContain(".doc-skeleton-bar");
    });

    it("mounts BrandingSettingsComponent inside SettingsPage when branding tab is active", () => {
        expect(settingsPage).toContain("BrandingSettingsComponent");
        expect(settingsPage).toContain('activeTab === "branding"');
    });
});
