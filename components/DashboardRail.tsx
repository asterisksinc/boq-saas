"use client";

import { usePathname, useRouter } from "next/navigation";

export interface DashboardRailProps {
    current?: string;
}

interface NavItem {
    route: string;
    icon: string;
    label: string;
}

const navItems: NavItem[] = [
    { route: "/dashboard", icon: "dashboard-overview-active", label: "Overview" },
    { route: "/projects", icon: "dashboard-projects", label: "Projects" },
    { route: "/boqs", icon: "dashboard-boqs", label: "Bill of Quantities" },
    { route: "/costs", icon: "dashboard-costs", label: "Costing" },
    { route: "/workspace", icon: "dashboard-workspace", label: "Workspace" },
    { route: "/proposals", icon: "dashboard-estimates", label: "Proposals" },
    { route: "/invoices", icon: "dashboard-purchase-orders", label: "Invoices" },
    { route: "/analytics", icon: "dashboard-analytics", label: "Analytics" },
    { route: "/documents", icon: "dashboard-reports", label: "Documents" },
    { route: "/integrations", icon: "dashboard-integrations", label: "Integrations" },
    { route: "/billing", icon: "dashboard-billing", label: "Billing" },
    { route: "/activities", icon: "dashboard-activities-active", label: "Activities" },
];

export default function DashboardRail({ current }: DashboardRailProps) {
    const router = useRouter();
    const pathname = usePathname();

    const isCurrent = (itemRoute: string) => {
        if (current) return current === itemRoute;
        if (!pathname) return false;
        if (itemRoute === "/dashboard") return pathname === "/dashboard";
        return pathname === itemRoute || pathname.startsWith(`${itemRoute}/`);
    };

    const isHelpCurrent = current === "/help" || pathname === "/help" || Boolean(pathname?.startsWith("/help/"));
    const isSettingsCurrent = current === "/settings" || pathname === "/settings" || Boolean(pathname?.startsWith("/settings/"));

    const navigate = (route: string) => {
        try {
            router.push(route);
        } catch {
            window.location.assign(route);
        }
    };

    return (
        <aside className="fig-dashboard-rail" aria-label="Dashboard navigation">
            <div
                className="fig-dashboard-logo"
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/dashboard")}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") navigate("/dashboard");
                }}
                aria-label="Go to Dashboard"
            >
                <span>
                    <img src="/assets/boq-logo-small.svg" alt="BOQ" />
                </span>
            </div>

            <nav className="fig-dashboard-menu" aria-label="Main menu">
                {navItems.map((item) => {
                    const active = isCurrent(item.route);
                    return (
                        <button
                            key={item.route}
                            type="button"
                            className={active ? "is-current" : ""}
                            aria-label={item.label}
                            title={item.label}
                            onClick={() => navigate(item.route)}
                        >
                            <img src={`/assets/dashboard/${item.icon}.svg`} alt="" />
                        </button>
                    );
                })}
            </nav>

            <div className="fig-dashboard-tools" aria-label="User tools">
                <button
                    type="button"
                    className={isHelpCurrent ? "is-current" : ""}
                    aria-label="Help & Support"
                    title="Help & Support"
                    onClick={() => navigate("/help")}
                >
                    <img src="/assets/dashboard/dashboard-help.svg" alt="" />
                </button>
                <button
                    type="button"
                    className={isSettingsCurrent ? "is-current" : ""}
                    aria-label="Settings"
                    title="Settings"
                    onClick={() => navigate("/settings")}
                >
                    <img src="/assets/dashboard/dashboard-settings.svg" alt="" />
                </button>
            </div>
        </aside>
    );
}
