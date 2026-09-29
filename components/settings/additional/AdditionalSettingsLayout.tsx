"use client";

import { useCallback, useEffect, useState } from "react";
import { getRetentionSettings, RetentionSettings } from "@/lib/api/auth";
import AdditionalSubNavigation, { AdditionalSubSection } from "./AdditionalSubNavigation";
import DataExportCard from "./DataExportCard";
import DataRetentionSection from "./DataRetentionSection";
import DeleteAccountSection from "./DeleteAccountSection";

interface AdditionalSettingsLayoutProps {
    showNotice: (message: string, type?: "success" | "error") => void;
    overview?: unknown;
}

export default function AdditionalSettingsLayout({
    showNotice,
}: AdditionalSettingsLayoutProps) {
    const [activeSection, setActiveSection] = useState<AdditionalSubSection>("data-export");
    const [retention, setRetention] = useState<RetentionSettings | null>(null);
    const [loading, setLoading] = useState(true);

    // Sync activeSection with URL search params
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const sectionParam = params.get("section") as AdditionalSubSection | null;
            if (
                sectionParam &&
                ["data-export", "data-retention", "delete-account"].includes(sectionParam)
            ) {
                setActiveSection(sectionParam);
            }
        }
    }, []);

    const handleSelectSection = (section: AdditionalSubSection) => {
        setActiveSection(section);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("section", section);
            window.history.replaceState({}, "", url.toString());
        }
    };

    const loadRetention = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getRetentionSettings();
            setRetention(data);
        } catch {
            // Default fallback if backend hasn't initialized
            setRetention({
                recycleBinDays: 90,
                autoDeleteDrafts: true,
                draftRetentionDays: 30,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRetention();
    }, [loadRetention]);

    return (
        <div className="additional-settings-layout" data-testid="additional-settings-layout">
            <AdditionalSubNavigation
                activeSection={activeSection}
                onSelectSection={handleSelectSection}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
                {activeSection === "data-export" && (
                    <DataExportCard showNotice={showNotice} />
                )}

                {activeSection === "data-retention" && (
                    <DataRetentionSection
                        retention={retention}
                        loading={loading}
                        onUpdateRetention={setRetention}
                        showNotice={showNotice}
                    />
                )}

                {activeSection === "delete-account" && (
                    <DeleteAccountSection
                        showNotice={showNotice}
                        onNavigateToExport={() => handleSelectSection("data-export")}
                    />
                )}
            </div>
        </div>
    );
}
