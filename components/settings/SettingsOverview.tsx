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
            {/* 1. Profile Summary Card (Frame 93) */}
            <SettingsProfileHeader
                displayName={viewModel.profile.name}
                email={viewModel.profile.email}
                role={viewModel.profile.role}
                avatarUrl={viewModel.profile.avatarUrl}
                initials={viewModel.profile.initials}
                completionPercent={viewModel.profile.completionPercent}
                onProfileUpdated={onProfileUpdated}
            />

            {/* 2. Workspace Statistics Cards (Frame 2147225138) */}
            <SettingsUsageCards
                projects={viewModel.usage.projects}
                boqs={viewModel.usage.boqs}
                storage={viewModel.usage.storage}
            />

            {/* 3. Configuration Health Section (Frame 2147225140) */}
            <SettingsConfigurationHealth
                healthCards={viewModel.healthCards}
                onSelectTab={onSelectTab}
            />

            {/* 4. Recent Changes Section (Frame 2147225141) */}
            <SettingsRecentChanges
                recentChanges={viewModel.recentChanges}
            />
        </div>
    );
}
