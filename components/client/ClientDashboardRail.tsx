"use client";

import { usePathname, useRouter } from "next/navigation";

export interface ClientDashboardRailProps {
    current?: string;
}

interface ClientNavItem {
    route: string;
    icon: string;
    label: string;
}

const clientNavItems: ClientNavItem[] = [
    { route: "/client/boq", icon: "dashboard-boqs", label: "BOQ" },
    { route: "/client/documents", icon: "dashboard-reports", label: "Documents" },
    { route: "/client/invoices", icon: "dashboard-purchase-orders", label: "Invoices" },
    { route: "/client/approvals", icon: "dashboard-activities", label: "Approvals" },
];

export default function ClientDashboardRail({ current }: ClientDashboardRailProps) {
    const router = useRouter();
    const pathname = usePathname();

    const isCurrent = (itemRoute: string) => {
        if (current) return current === itemRoute;
        if (!pathname) return false;
        if (itemRoute === "/client/boq") {
            return pathname === "/client/boq" || pathname.startsWith("/client/boq/") || pathname === "/client/boqs" || pathname.startsWith("/client/boqs/");
        }
        return pathname === itemRoute || pathname.startsWith(`${itemRoute}/`);
    };

    const isHelpCurrent = current === "/client/help" || pathname === "/client/help" || Boolean(pathname?.startsWith("/client/help/"));
    const isSettingsCurrent = current === "/client/settings" || pathname === "/client/settings" || Boolean(pathname?.startsWith("/client/settings/"));

    const navigate = (route: string) => {
        try {
            router.push(route);
        } catch {
            window.location.assign(route);
        }
    };

    return (
        <aside className="fig-dashboard-rail" aria-label="Client navigation">
            <div
                className="fig-dashboard-logo"
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/client/boq")}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") navigate("/client/boq");
                }}
                aria-label="Go to BOQ"
            >
                <span>
                    <img src="/assets/boq-logo-small.svg" alt="BOQ" />
                </span>
            </div>

            <nav className="fig-dashboard-menu" aria-label="Main client menu">
                {clientNavItems.map((item) => {
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

            <div className="fig-dashboard-tools" aria-label="Client tools">
                <button
                    type="button"
                    className={isHelpCurrent ? "is-current" : ""}
                    aria-label="Help & Support"
                    title="Help & Support"
                    onClick={() => navigate("/client/help")}
                >
                    <img src="/assets/dashboard/dashboard-help.svg" alt="" />
                </button>
                <button
                    type="button"
                    className={isSettingsCurrent ? "is-current" : ""}
                    aria-label="Settings"
                    title="Settings"
                    onClick={() => navigate("/client/settings")}
                >
                    <img src="/assets/dashboard/dashboard-settings.svg" alt="" />
                </button>
            </div>
        </aside>
    );
}
