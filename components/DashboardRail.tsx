"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { SIDEBAR_STORAGE_KEY } from "@/lib/sidebar";

export interface DashboardRailProps {
    current?: string;
}

interface NavItem {
    route: string;
    icon: string;
    label: string;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

/** Sidebar groups from Figma "Side menu" (2760:120). The collapsed rail shows the same items in the same order. */
export const navGroups: NavGroup[] = [
    {
        title: "Relationship & Projects",
        items: [
            { route: "/leads", icon: "nav-leads", label: "Leads" },
            { route: "/projects", icon: "dashboard-projects", label: "Projects" },
            { route: "/mood-boards", icon: "nav-moodboards", label: "Moodboards" },
            { route: "/activities", icon: "nav-activities", label: "Activities" },
            { route: "/documents", icon: "nav-documents", label: "Documents" },
        ],
    },
    {
        title: "Design & Estimation",
        items: [
            { route: "/boqs", icon: "dashboard-boqs", label: "Bill of Quantities" },
            { route: "/costs", icon: "nav-costing", label: "Costing" },
            { route: "/templates", icon: "dashboard-templates", label: "Templates" },
        ],
    },
    {
        title: "Sales & Finance",
        items: [
            { route: "/proposals", icon: "dashboard-estimates", label: "Proposals" },
            { route: "/invoices", icon: "dashboard-purchase-orders", label: "Invoices" },
        ],
    },
    {
        title: "Insights",
        items: [{ route: "/analytics", icon: "dashboard-analytics", label: "Analytics" }],
    },
    {
        title: "Administration",
        items: [
            { route: "/integrations", icon: "dashboard-integrations", label: "Integrations" },
            { route: "/billing", icon: "dashboard-billing", label: "Billing" },
        ],
    },
];

const systemItems: NavItem[] = [
    { route: "/help", icon: "dashboard-help", label: "Help" },
    { route: "/settings", icon: "dashboard-settings", label: "Settings" },
];

function setSidebarExpanded(expanded: boolean) {
    const root = document.documentElement;
    if (expanded) root.dataset.sidebar = "expanded";
    else delete root.dataset.sidebar;
    try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, expanded ? "expanded" : "collapsed");
    } catch {
        // Storage can be unavailable (private mode); the toggle still works for this page view.
    }
}

export default function DashboardRail({ current }: DashboardRailProps) {
    const router = useRouter();
    const pathname = usePathname();

    const isCurrent = (itemRoute: string) => {
        if (current) return current === itemRoute;
        if (!pathname) return false;
        return pathname === itemRoute || pathname.startsWith(`${itemRoute}/`);
    };

    const navigate = (route: string) => {
        try {
            router.push(route);
        } catch {
            window.location.assign(route);
        }
    };

    const goHome = () => navigate("/dashboard");

    const renderIcon = (item: NavItem) => {
        const active = isCurrent(item.route);
        const label = item.route === "/help" ? "Help & Support" : item.label;
        return (
            <button
                key={item.route}
                type="button"
                className={`fig-side-rail-item${active ? " is-current" : ""}`}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                title={label}
                onClick={() => navigate(item.route)}
            >
                <img src={`/assets/dashboard/${item.icon}.svg`} alt="" />
            </button>
        );
    };

    return (
        <>
            {/* Collapsed icon rail (default) — Figma "Side menu" 2760:865 */}
            <aside className="fig-side-rail" aria-label="Dashboard navigation">
                <div className="fig-side-rail-top">
                    <button type="button" className="fig-side-menu-logo" onClick={goHome} aria-label="Go to Dashboard">
                        <img src="/assets/boq-logo-small.svg" alt="BOQ" />
                    </button>
                    <button
                        type="button"
                        className="fig-rail-expand"
                        aria-label="Expand sidebar"
                        title="Expand sidebar"
                        onClick={() => setSidebarExpanded(true)}
                    >
                        <ChevronsRight size={14} aria-hidden="true" />
                    </button>
                </div>
                <nav className="fig-side-rail-nav" aria-label="Main menu">
                    {navGroups.map((group) => (
                        <div key={group.title} className="fig-side-rail-group" role="group" aria-label={group.title}>
                            {group.items.map(renderIcon)}
                        </div>
                    ))}
                    <div className="fig-side-rail-group fig-side-rail-system" role="group" aria-label="System">
                        {systemItems.map(renderIcon)}
                    </div>
                </nav>
            </aside>

            {/* Expanded grouped side menu */}
            <aside className="fig-side-menu" aria-label="Dashboard navigation">
                <div className="fig-side-menu-top">
                    <button type="button" className="fig-side-menu-logo" onClick={goHome} aria-label="Go to Dashboard">
                        <img src="/assets/boq-logo-small.svg" alt="BOQ" />
                    </button>
                    <button
                        type="button"
                        className="fig-side-menu-collapse"
                        aria-label="Collapse sidebar"
                        title="Collapse sidebar"
                        onClick={() => setSidebarExpanded(false)}
                    >
                        <ChevronsLeft size={18} aria-hidden="true" />
                    </button>
                </div>

                <nav className="fig-side-menu-nav" aria-label="Main menu">
                    {[...navGroups, { title: "System", items: systemItems }].map((group) => (
                        <div key={group.title} className="fig-side-menu-group">
                            <p className="fig-side-menu-heading">{group.title}</p>
                            {group.items.map((item) => {
                                const active = isCurrent(item.route);
                                return (
                                    <button
                                        key={item.route}
                                        type="button"
                                        className={`fig-side-menu-item${active ? " is-current" : ""}`}
                                        aria-current={active ? "page" : undefined}
                                        onClick={() => navigate(item.route)}
                                    >
                                        <img src={`/assets/dashboard/${item.icon}.svg`} alt="" />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
}
