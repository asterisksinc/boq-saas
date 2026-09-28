"use client";

import { useCallback, useEffect, useState } from "react";
import { Info } from "lucide-react";
import { SettingsOverview } from "@/lib/api/auth";
import {
    BoqApprovalSettings,
    BoqCostingSettingsData,
    BoqCostingSubTab,
    BoqNumberingSettings,
    BoqPricingSettings,
    BoqRevisionSettings,
    BoqTaxRule,
    BoqUnit,
} from "@/lib/settings/types";
import { getBoqCostingSettings, updateBoqCostingSettings } from "@/lib/api/costing";
import BoqCostingNavigation from "./BoqCostingNavigation";
import UnitsTable from "./Units/UnitsTable";
import NumberingForm from "./Numbering/NumberingForm";
import TaxRulesTable from "./TaxRules/TaxRulesTable";
import { PricingRules } from "./pricing/PricingRules";
import { RevisionRules } from "./revision/RevisionRules";
import { ApprovalRules } from "./approval/ApprovalRules";
import { SettingsErrorState } from "../SettingsEmptyState";

interface BoqCostingLayoutProps {
    overview: SettingsOverview | null;
    showNotice: (message: string, type?: "success" | "error") => void;
    onRefreshOverview?: () => Promise<void>;
}

export default function BoqCostingLayout({
    overview,
    showNotice,
    onRefreshOverview,
}: BoqCostingLayoutProps) {
    const [activeSubTab, setActiveSubTab] = useState<BoqCostingSubTab>("units");
    const [settingsData, setSettingsData] = useState<BoqCostingSettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Read initial section from URL query param
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const sectionParam = params.get("section") as BoqCostingSubTab | null;
            if (
                sectionParam &&
                [
                    "units",
                    "numbering",
                    "tax-rules",
                    "pricing-rules",
                    "revision-rules",
                    "approval-rules",
                ].includes(sectionParam)
            ) {
                setActiveSubTab(sectionParam);
            }
        }
    }, []);

    // Sync subtab to URL without full navigation reload
    const handleSelectSubTab = (subTab: BoqCostingSubTab) => {
        setActiveSubTab(subTab);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", "boq-costing");
            url.searchParams.set("section", subTab);
            window.history.replaceState({}, "", url.toString());
        }
    };

    // Load BOQ Costing settings from backend
    const loadSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getBoqCostingSettings();
            setSettingsData(data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load BOQ & Costing settings.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const role = overview?.role?.toLowerCase() || "member";
    const canEdit = role === "owner" || role === "admin";

    // ── Units Mutations ──────────────────────────────────────────────────────────

    const handleSaveUnit = async (unitData: Omit<BoqUnit, "id"> & { id?: string }) => {
        if (!settingsData) return;
        let updatedUnits: BoqUnit[];

        if (unitData.id) {
            // Edit existing unit
            updatedUnits = settingsData.units.map((u) =>
                u.id === unitData.id
                    ? {
                          ...u,
                          name: unitData.name,
                          code: unitData.code,
                          type: unitData.type,
                          decimals: unitData.decimals,
                          active: unitData.active,
                      }
                    : u
            );
        } else {
            // Create new custom unit
            const newUnit: BoqUnit = {
                id: `custom-unit-${Date.now()}`,
                name: unitData.name,
                code: unitData.code,
                type: unitData.type,
                decimals: unitData.decimals,
                active: true,
                isCustom: true,
                createdAt: new Date().toISOString(),
            };
            updatedUnits = [...settingsData.units, newUnit];
        }

        const res = await updateBoqCostingSettings({ units: updatedUnits });
        setSettingsData(res);
        onRefreshOverview?.();
    };

    const handleToggleUnitActive = async (unitId: string, active: boolean) => {
        if (!settingsData) return;
        const updatedUnits = settingsData.units.map((u) =>
            u.id === unitId ? { ...u, active } : u
        );
        // Optimistic update
        setSettingsData((prev) => (prev ? { ...prev, units: updatedUnits } : prev));
        const res = await updateBoqCostingSettings({ units: updatedUnits });
        setSettingsData(res);
        onRefreshOverview?.();
    };

    const handleDeleteUnit = async (unitId: string) => {
        if (!settingsData) return;
        const updatedUnits = settingsData.units.filter((u) => u.id !== unitId);
        const res = await updateBoqCostingSettings({ units: updatedUnits });
        setSettingsData(res);
        onRefreshOverview?.();
    };

    // ── Numbering Mutation ──────────────────────────────────────────────────────

    const handleSaveNumbering = async (numbering: BoqNumberingSettings) => {
        const res = await updateBoqCostingSettings({ numbering });
        setSettingsData(res);
        onRefreshOverview?.();
    };

    // ── Tax Rules Mutations ─────────────────────────────────────────────────────

    const handleSaveTaxRule = async (ruleData: Omit<BoqTaxRule, "id"> & { id?: string }) => {
        if (!settingsData) return;
        let updatedTaxRules: BoqTaxRule[];

        if (ruleData.id) {
            updatedTaxRules = settingsData.taxRules.map((r) =>
                r.id === ruleData.id
                    ? {
                          ...r,
                          name: ruleData.name,
                          code: ruleData.code,
                          rate: ruleData.rate,
                          inclusive: ruleData.inclusive,
                          active: ruleData.active,
                      }
                    : r
            );
        } else {
            const newRule: BoqTaxRule = {
                id: `tax-${Date.now()}`,
                name: ruleData.name,
                code: ruleData.code,
                rate: ruleData.rate,
                inclusive: ruleData.inclusive,
                active: true,
                createdAt: new Date().toISOString(),
            };
            updatedTaxRules = [...settingsData.taxRules, newRule];
        }

        const res = await updateBoqCostingSettings({ taxRules: updatedTaxRules });
        setSettingsData(res);
        onRefreshOverview?.();
    };

    const handleToggleTaxRuleActive = async (ruleId: string, active: boolean) => {
        if (!settingsData) return;
        const updatedRules = settingsData.taxRules.map((r) =>
            r.id === ruleId ? { ...r, active } : r
        );
        setSettingsData((prev) => (prev ? { ...prev, taxRules: updatedRules } : prev));
        const res = await updateBoqCostingSettings({ taxRules: updatedRules });
        setSettingsData(res);
        onRefreshOverview?.();
    };

    const handleDeleteTaxRule = async (ruleId: string) => {
        if (!settingsData) return;
        const updatedRules = settingsData.taxRules.filter((r) => r.id !== ruleId);
        const res = await updateBoqCostingSettings({ taxRules: updatedRules });
        setSettingsData(res);
        onRefreshOverview?.();
    };

    // ── Pricing Mutation (Screen 1) ─────────────────────────────────────────────

    const handleSavePricing = async (pricing: BoqPricingSettings) => {
        const res = await updateBoqCostingSettings({
            pricing,
            defaultMarkupPercent: pricing.defaultMarkupPercent,
            defaultWastePercent: pricing.wastagePercent,
        });
        setSettingsData(res);
        onRefreshOverview?.();
    };

    // ── Revision Mutation (Screen 2) ────────────────────────────────────────────

    const handleSaveRevision = async (revision: BoqRevisionSettings) => {
        const res = await updateBoqCostingSettings({ revision });
        setSettingsData(res);
        onRefreshOverview?.();
    };

    // ── Approval Mutation (Screen 3) ────────────────────────────────────────────

    const handleSaveApproval = async (approval: BoqApprovalSettings) => {
        const res = await updateBoqCostingSettings({ approval });
        setSettingsData(res);
        onRefreshOverview?.();
    };

    // ── Loading Skeleton ────────────────────────────────────────────────────────

    if (loading && !settingsData) {
        return (
            <div className="boq-costing-container" aria-busy="true">
                {/* Left submenu skeleton */}
                <div className="boq-subnav-card">
                    <div className="skeleton" style={{ width: "90px", height: "14px", marginBottom: "16px" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="skeleton" style={{ height: "40px", borderRadius: "8px" }} />
                        ))}
                    </div>
                </div>

                {/* Right content skeleton */}
                <div className="boq-content-area">
                    <div className="boq-content-card">
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                            <div className="skeleton" style={{ width: "160px", height: "24px", borderRadius: "6px" }} />
                            <div className="skeleton" style={{ width: "140px", height: "38px", borderRadius: "8px" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="skeleton" style={{ height: "46px", borderRadius: "6px" }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !settingsData) {
        return <SettingsErrorState message={error} onRetry={loadSettings} />;
    }

    if (!settingsData) {
        return <SettingsErrorState message="BOQ & Costing settings could not be loaded." onRetry={loadSettings} />;
    }

    return (
        <div className="boq-costing-wrapper">
            {!canEdit && (
                <div className="boq-permission-banner" role="status">
                    <Info size={16} className="boq-permission-icon" aria-hidden="true" />
                    <span>
                        You have read-only access to BOQ & Costing settings. Workspace owners and administrators can configure units, numbering, and tax rules.
                    </span>
                </div>
            )}

            <div className="boq-costing-container">
                {/* Left Column: Submenu Navigation */}
                <BoqCostingNavigation
                    activeSubTab={activeSubTab}
                    onSelectSubTab={handleSelectSubTab}
                />

                {/* Right Column: Active Subtab Content Area */}
                <div className="boq-content-area">
                    {activeSubTab === "units" && (
                        <UnitsTable
                            units={settingsData.units}
                            canEdit={canEdit}
                            onSaveUnit={handleSaveUnit}
                            onToggleActive={handleToggleUnitActive}
                            onDeleteUnit={handleDeleteUnit}
                            showNotice={showNotice}
                        />
                    )}

                    {activeSubTab === "numbering" && (
                        <NumberingForm
                            initialNumbering={settingsData.numbering}
                            canEdit={canEdit}
                            onSaveNumbering={handleSaveNumbering}
                            showNotice={showNotice}
                        />
                    )}

                    {activeSubTab === "tax-rules" && (
                        <TaxRulesTable
                            taxRules={settingsData.taxRules}
                            canEdit={canEdit}
                            onSaveTaxRule={handleSaveTaxRule}
                            onToggleActive={handleToggleTaxRuleActive}
                            onDeleteTaxRule={handleDeleteTaxRule}
                            showNotice={showNotice}
                        />
                    )}

                    {activeSubTab === "pricing-rules" && (
                        <PricingRules
                            initialPricing={settingsData.pricing}
                            activeTaxRule={settingsData.taxRules.find((t) => t.active) || settingsData.taxRules[0]}
                            canEdit={canEdit}
                            onSavePricing={handleSavePricing}
                            showNotice={(type, msg) => showNotice(msg, type === "info" ? "success" : type)}
                        />
                    )}

                    {activeSubTab === "revision-rules" && (
                        <RevisionRules
                            initialRevision={settingsData.revision}
                            canEdit={canEdit}
                            onSaveRevision={handleSaveRevision}
                            showNotice={(type, msg) => showNotice(msg, type === "info" ? "success" : type)}
                        />
                    )}

                    {activeSubTab === "approval-rules" && (
                        <ApprovalRules
                            initialApproval={settingsData.approval}
                            canEdit={canEdit}
                            onSaveApproval={handleSaveApproval}
                            showNotice={(type, msg) => showNotice(msg, type === "info" ? "success" : type)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
