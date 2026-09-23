export type SettingsTab =
    | "overview"
    | "profile"
    | "organization"
    | "branding"
    | "boq-costing"
    | "integrations"
    | "notifications"
    | "security"
    | "advanced"
    | "additional";

export interface SettingsNavItem {
    key: SettingsTab;
    label: string;
}

export type HealthStatus = "DONE" | "WARNING" | "ERROR";

export type HealthIconType =
    | "company"
    | "branding"
    | "gst"
    | "boq"
    | "templates"
    | "security"
    | "integrations";

export interface ConfigurationHealthCard {
    id: string;
    title: string;
    subtitle: string;
    status: HealthStatus;
    iconType: HealthIconType;
    route?: string;
    tabKey?: SettingsTab;
}

export interface FormattedRecentChange {
    id: string;
    action: string;
    description: string;
    timeAgo: string;
    actorName: string;
    actorAvatarUrl: string | null;
    actorInitials: string;
}

export interface SettingsOverviewViewModel {
    profile: {
        name: string;
        email: string;
        role: string;
        avatarUrl: string | null;
        initials: string;
        completionPercent: number;
    };
    usage: {
        projects: number;
        boqs: number;
        templates: number;
        storage: string;
    };
    healthCards: ConfigurationHealthCard[];
    recentChanges: FormattedRecentChange[];
}
