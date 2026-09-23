"use client";

import { SettingsOverviewViewModel, SettingsTab } from "@/lib/settings/types";
import SettingsProfileHeader from "./SettingsProfileHeader";
import SettingsUsageCards from "./SettingsUsageCards";
import SettingsConfigurationHealth from "./SettingsConfigurationHealth";
import SettingsRecentChanges from "./SettingsRecentChanges";

interface SettingsOverviewProps {
    viewModel: SettingsOverviewViewModel;
    onSelectTab: (tab: SettingsTab) => void;
    onProfileUpdated: () => void;
}

export default function SettingsOverview({
    viewModel,
    onSelectTab,
    onProfileUpdated,
}: SettingsOverviewProps) {
    return (
        <div className="settings-overview-layout">
            {/* 1. Profile Header with working Edit Profile & dynamic progress bar */}
            <SettingsProfileHeader
                displayName={viewModel.profile.name}
                email={viewModel.profile.email}
                role={viewModel.profile.role}
                avatarUrl={viewModel.profile.avatarUrl}
                initials={viewModel.profile.initials}
                completionPercent={viewModel.profile.completionPercent}
                onProfileUpdated={onProfileUpdated}
            />

            {/* 2. KPI / Usage Cards: Projects, BOQs, Storage with star badge */}
            <SettingsUsageCards
                projects={viewModel.usage.projects}
                boqs={viewModel.usage.boqs}
                storage={viewModel.usage.storage}
            />

            {/* 3. Configuration Health: 7 interactive, real-data cards */}
            <SettingsConfigurationHealth
                healthCards={viewModel.healthCards}
                onSelectTab={onSelectTab}
            />

            {/* 4. Recent Changes: Real audit logs */}
            <SettingsRecentChanges
                recentChanges={viewModel.recentChanges}
            />
        </div>
    );
}
