"use client";

import {
    Building2,
    Palette,
    Receipt,
    Box,
    LayoutTemplate,
    Lock,
    Link2,
    ChevronRight,
} from "lucide-react";
import { ConfigurationHealthCard, HealthIconType, SettingsTab } from "@/lib/settings/types";
import { useRouter } from "next/navigation";

interface SettingsHealthCardProps {
    card: ConfigurationHealthCard;
    onSelectTab: (tab: SettingsTab) => void;
}

function renderHealthIcon(iconType: HealthIconType) {
    switch (iconType) {
        case "company":
            return <Building2 size={20} />;
        case "branding":
            return <Palette size={20} />;
        case "gst":
            return <Receipt size={20} />;
        case "boq":
            return <Box size={20} />;
        case "templates":
            return <LayoutTemplate size={20} />;
        case "security":
            return <Lock size={20} />;
        case "integrations":
            return <Link2 size={20} />;
        default:
            return <Box size={20} />;
    }
}

export default function SettingsHealthCard({
    card,
    onSelectTab,
}: SettingsHealthCardProps) {
    const router = useRouter();

    const handleClick = () => {
        if (card.route) {
            router.push(card.route);
        } else if (card.tabKey) {
            onSelectTab(card.tabKey);
        }
    };

    return (
        <button
            type="button"
            className="settings-health-card"
            onClick={handleClick}
            aria-label={`${card.title}: ${card.status}, ${card.subtitle}`}
        >
            <div className="settings-health-card-top">
                <div className="settings-health-icon-box">
                    {renderHealthIcon(card.iconType)}
                </div>
                <span className={`settings-health-badge badge-${card.status.toLowerCase()}`}>
                    {card.status}
                </span>
            </div>

            <div className="settings-health-card-bottom">
                <div className="settings-health-card-text">
                    <h3 className="settings-health-card-title">{card.title}</h3>
                    <p className="settings-health-card-subtitle">{card.subtitle}</p>
                </div>
                <div className="settings-health-arrow-box" aria-hidden="true">
                    <ChevronRight size={16} />
                </div>
            </div>
        </button>
    );
}
