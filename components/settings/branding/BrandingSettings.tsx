"use client";

import { useEffect, useState, useCallback } from "react";
import BrandingSubNavigation from "./BrandingSubNavigation";
import BrandAssetsPanel from "./BrandAssetsPanel";
import BrandSystemPanel from "./BrandSystemPanel";
import DocumentPreviewPanel from "./DocumentPreviewPanel";
import { BrandSubTab, BrandingSettings } from "@/lib/settings/types";
import { getBrandingSettings, SettingsOverview } from "@/lib/api/auth";

interface BrandingSettingsProps {
    overview: SettingsOverview | null;
    loading?: boolean;
    error?: string | null;
    onRefresh?: () => Promise<void>;
    showNotice: (message: string, type?: "success" | "error") => void;
}

const defaultBrandingSettings: BrandingSettings = {
    primaryLogo: null,
    lightLogo: null,
    darkLogo: null,
    favicon: null,
    signature: null,
    colors: {
        primary: "#2563EB",
        secondary: "#E2E8F0",
        accent: "#64748B",
        text: "#0F172A",
    },
    font: "Urbanist",
    buttonStyle: "rounded",
    documentSpacing: "compact",
    companyName: "Arvin Interiors",
};

export default function BrandingSettingsComponent({
    overview,
    showNotice,
}: BrandingSettingsProps) {
    const [activeSubTab, setActiveSubTab] = useState<BrandSubTab>("brand-assets");
    const [branding, setBranding] = useState<BrandingSettings>(defaultBrandingSettings);
    const [loadingData, setLoadingData] = useState(true);
    const [isDirty, setIsDirty] = useState(false);

    const loadBranding = useCallback(async () => {
        setLoadingData(true);
        try {
            const data = await getBrandingSettings();
            if (data) {
                const colors = data.colors || {
                    primary: data.primaryColor || "#2563EB",
                    secondary: data.secondaryColor || "#E2E8F0",
                    accent: "#64748B",
                    text: "#0F172A",
                };

                setBranding({
                    primaryLogo: data.primaryLogo ?? data.logoUrl ?? null,
                    lightLogo: data.lightLogo ?? null,
                    darkLogo: data.darkLogo ?? null,
                    favicon: data.favicon ?? data.faviconUrl ?? null,
                    signature: data.signature ?? null,
                    colors: {
                        primary: colors.primary || "#2563EB",
                        secondary: colors.secondary || "#E2E8F0",
                        accent: colors.accent || "#64748B",
                        text: colors.text || "#0F172A",
                    },
                    font: data.font || "Urbanist",
                    buttonStyle: data.buttonStyle || "rounded",
                    documentSpacing: data.documentSpacing || "compact",
                    companyName: data.companyName || overview?.workspace?.name || "Arvin Interiors",
                    logoUrl: data.primaryLogo ?? data.logoUrl ?? null,
                    faviconUrl: data.favicon ?? data.faviconUrl ?? null,
                    primaryColor: colors.primary || "#2563EB",
                    secondaryColor: colors.secondary || "#E2E8F0",
                });
            }
        } catch {
            // Keep default branding
        } finally {
            setLoadingData(false);
        }
    }, [overview]);

    useEffect(() => {
        loadBranding();
    }, [loadBranding]);

    // Unsaved changes alert when user tries to leave window
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "You have unsaved changes in branding. Are you sure you want to leave?";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    const handleSelectSubTab = (tab: BrandSubTab) => {
        if (isDirty && activeSubTab === "brand-system" && tab !== "brand-system") {
            const confirmed = window.confirm("You have unsaved changes in Brand System. Switch tab anyway?");
            if (!confirmed) return;
            setIsDirty(false);
        }
        setActiveSubTab(tab);
    };

    const handleBrandingUpdated = (updated: BrandingSettings) => {
        setBranding(updated);
        setIsDirty(false);
    };

    if (loadingData) {
        return (
            <div className="brand-settings-container" aria-busy="true">
                <div className="org-subnav-card">
                    <div className="skeleton" style={{ width: "90px", height: "14px", marginBottom: "16px" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div className="skeleton" style={{ height: "40px", borderRadius: "8px" }} />
                        <div className="skeleton" style={{ height: "40px", borderRadius: "8px" }} />
                        <div className="skeleton" style={{ height: "40px", borderRadius: "8px" }} />
                    </div>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="brand-assets-grid">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div className="skeleton" style={{ width: "120px", height: "14px" }} />
                                <div className="skeleton" style={{ height: "160px", borderRadius: "12px" }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const companyName = overview?.workspace?.name || branding.companyName || "Arvin Interiors";

    return (
        <div className="brand-settings-wrapper">
            <div className="brand-settings-container">
                {/* Left Column: Sub-navigation */}
                <BrandingSubNavigation
                    activeSubTab={activeSubTab}
                    onSelectSubTab={handleSelectSubTab}
                />

                {/* Right Column: Active Subtab Panel */}
                <div className="brand-content-area">
                    {activeSubTab === "brand-assets" && (
                        <BrandAssetsPanel
                            branding={branding}
                            onBrandingUpdated={handleBrandingUpdated}
                            showNotice={showNotice}
                        />
                    )}

                    {activeSubTab === "brand-system" && (
                        <BrandSystemPanel
                            branding={branding}
                            companyName={companyName}
                            onBrandingUpdated={handleBrandingUpdated}
                            showNotice={showNotice}
                            setIsDirty={setIsDirty}
                        />
                    )}

                    {activeSubTab === "document-preview" && (
                        <DocumentPreviewPanel
                            branding={branding}
                            companyName={companyName}
                            showNotice={showNotice}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
