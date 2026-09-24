"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { SettingsOverview } from "@/lib/api/auth";
import OrganizationSubNavigation, { OrganizationSubTab } from "./OrganizationSubNavigation";
import OrganizationCompanyProfile from "./OrganizationCompanyProfile";
import OrganizationBusinessInfo from "./OrganizationBusinessInfo";
import OrganizationGstTax from "./OrganizationGstTax";
import OrganizationLocations from "./OrganizationLocations";
import { SettingsErrorState } from "./SettingsEmptyState";

interface OrganizationSettingsProps {
    overview: SettingsOverview | null;
    loading: boolean;
    error: string | null;
    onRefresh: () => Promise<void>;
    showNotice: (message: string, type?: "success" | "error") => void;
}

export default function OrganizationSettings({
    overview,
    loading,
    error,
    onRefresh,
    showNotice,
}: OrganizationSettingsProps) {
    const [activeSubTab, setActiveSubTab] = useState<OrganizationSubTab>("company-profile");

    // Loading skeleton matching the two-column target layout
    if (loading && !overview) {
        return (
            <div className="org-settings-container" aria-busy="true">
                <div className="org-subnav-card">
                    <div className="skeleton" style={{ width: "90px", height: "14px", marginBottom: "16px" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div className="skeleton" style={{ height: "40px", borderRadius: "8px" }} />
                        <div className="skeleton" style={{ height: "40px", borderRadius: "8px" }} />
                        <div className="skeleton" style={{ height: "40px", borderRadius: "8px" }} />
                        <div className="skeleton" style={{ height: "40px", borderRadius: "8px" }} />
                    </div>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="org-content-card">
                        <div className="org-form-grid">
                            {Array.from({ length: 10 }).map((_, idx) => (
                                <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <div className="skeleton" style={{ width: "120px", height: "14px" }} />
                                    <div className="skeleton" style={{ height: "42px", borderRadius: "8px" }} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div className="skeleton" style={{ width: "130px", height: "42px", borderRadius: "8px" }} />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !overview) {
        return <SettingsErrorState message={error} onRetry={onRefresh} />;
    }

    const role = overview?.role?.toLowerCase() || "member";
    const canEdit = role === "owner" || role === "admin";

    return (
        <div className="org-settings-wrapper">
            {!canEdit && (
                <div className="org-permission-banner" role="status">
                    <Info size={16} className="org-permission-icon" aria-hidden="true" />
                    <span>
                        You have view-only access to organization details. Only workspace owners and administrators can make changes.
                    </span>
                </div>
            )}

            <div className="org-settings-container">
                {/* Left Column: Secondary Navigation Card */}
                <OrganizationSubNavigation
                    activeSubTab={activeSubTab}
                    onSelectSubTab={setActiveSubTab}
                />

                {/* Right Column: Active Sub-tab View */}
                <div className="org-content-area">
                    {activeSubTab === "company-profile" && (
                        <OrganizationCompanyProfile
                            overview={overview}
                            canEdit={canEdit}
                            onSaveSuccess={onRefresh}
                            showNotice={showNotice}
                        />
                    )}

                    {activeSubTab === "business-info" && (
                        <OrganizationBusinessInfo
                            overview={overview}
                            canEdit={canEdit}
                            onSaveSuccess={onRefresh}
                            showNotice={showNotice}
                        />
                    )}

                    {activeSubTab === "gst-tax" && (
                        <OrganizationGstTax
                            overview={overview}
                            canEdit={canEdit}
                            onSaveSuccess={onRefresh}
                            showNotice={showNotice}
                        />
                    )}

                    {activeSubTab === "locations" && (
                        <OrganizationLocations
                            canEdit={canEdit}
                            showNotice={showNotice}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
