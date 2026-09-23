"use client";

import { ConfigurationHealthCard, SettingsTab } from "@/lib/settings/types";
import SettingsHealthCard from "./SettingsHealthCard";

interface SettingsConfigurationHealthProps {
    healthCards: ConfigurationHealthCard[];
    onSelectTab: (tab: SettingsTab) => void;
}

export default function SettingsConfigurationHealth({
    healthCards,
    onSelectTab,
}: SettingsConfigurationHealthProps) {
    return (
        <section className="settings-section" aria-labelledby="config-health-heading">
            <h2 id="config-health-heading" className="settings-section-heading">
                Configuration Health
            </h2>
            <div className="settings-health-grid">
                {healthCards.map((card) => (
                    <SettingsHealthCard
                        key={card.id}
                        card={card}
                        onSelectTab={onSelectTab}
                    />
                ))}
            </div>
        </section>
    );
}
