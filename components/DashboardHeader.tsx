"use client";

import { Bell, ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDashboardNotifications, getSettingsOverview, DashboardNotification } from "@/lib/api/auth";

interface DashboardHeaderProps {
    title?: string;
    onNew?: () => void;
    onSearch?: (query: string) => void;
    avatarUrl?: string | null;
    userInitials?: string;
    profile?: { displayName?: string | null; avatarUrl?: string | null; email?: string | null } | null;
}

export default function DashboardHeader({
    title = "Overview",
    onNew,
    onSearch,
    avatarUrl: propAvatarUrl,
    userInitials: propUserInitials,
    profile,
}: DashboardHeaderProps) {
    const router = useRouter();
    const [searchValue, setSearchValue] = useState("");
    const profileName = profile?.displayName?.trim() || profile?.email?.split("@")[0] || "";
    const profileInitials = profileName ? profileName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() : "BO";
    const [avatarUrl, setAvatarUrl] = useState<string | null>(propAvatarUrl ?? profile?.avatarUrl ?? null);
    const [userInitials, setUserInitials] = useState(propUserInitials ?? profileInitials);
    const [newMenuOpen, setNewMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationError, setNotificationError] = useState<string | null>(null);

    useEffect(() => {
        if (propAvatarUrl !== undefined || profile?.avatarUrl !== undefined) {
            setAvatarUrl(propAvatarUrl ?? profile?.avatarUrl ?? null);
        }
        if (propUserInitials !== undefined || profileName) {
            setUserInitials(propUserInitials ?? profileInitials);
        }
    }, [profileName, profileInitials, profile?.avatarUrl, propAvatarUrl, propUserInitials]);

    useEffect(() => {
        let mounted = true;
        const fetchOverview = () => {
            getSettingsOverview()
                .then(overview => {
                    if (!mounted) return;
                    if (overview?.profile?.avatarUrl !== undefined) {
                        setAvatarUrl(overview.profile.avatarUrl);
                    }
                    if (overview?.profile?.displayName) {
                        const parts = overview.profile.displayName.trim().split(/\s+/);
                        const inits = parts.length > 1
                            ? (parts[0][0] + parts[1][0]).toUpperCase()
                            : parts[0].slice(0, 2).toUpperCase();
                        setUserInitials(inits);
                    }
                })
                .catch(() => {
                    // Fallback to default
                });
        };

        if (propAvatarUrl === undefined) {
            fetchOverview();
        }

        const handleProfileUpdated = (e: Event) => {
            const custom = e as CustomEvent<{ avatarUrl?: string | null }>;
            if (custom.detail && custom.detail.avatarUrl !== undefined) {
                setAvatarUrl(custom.detail.avatarUrl);
            } else {
                fetchOverview();
            }
        };

        window.addEventListener("user-profile-updated", handleProfileUpdated);
        return () => {
            mounted = false;
            window.removeEventListener("user-profile-updated", handleProfileUpdated);
        };
    }, [propAvatarUrl]);

    useEffect(() => {
        let mounted = true;
        getDashboardNotifications({ pageSize: 8 }).then((data) => {
            if (!mounted) return;
            setNotifications(data.items || []);
            setUnreadCount(data.unreadCount || 0);
        }).catch((error) => {
            if (mounted) setNotificationError(error instanceof Error ? error.message : "Notifications could not be loaded.");
        });
        return () => { mounted = false; };
    }, []);

    const handleNewClick = () => {
        if (onNew) {
            onNew();
        } else {
            router.push("/projects");
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchValue(val);
        if (onSearch) {
            onSearch(val);
        }
    };

    return (
        <header className="fig-dashboard-header">
            <h1>{title}</h1>
            <div className="fig-dashboard-header-actions">
                <label className="fig-dashboard-search">
                    <img src="/assets/dashboard/dashboard-search.svg" alt="" />
                    <input
                        placeholder="Search..."
                        aria-label="Search"
                        value={searchValue}
                        onChange={handleSearchChange}
                    />
                </label>
                <div className="relative">
                    <div className="fig-dashboard-new">
                        <button type="button" onClick={handleNewClick} className="flex items-center gap-2">
                            <Plus size={20} />
                            <span>New</span>
                        </button>
                        <i />
                        <button
                            type="button"
                            aria-label="Open new menu"
                            aria-expanded={newMenuOpen}
                            onClick={() => {
                                setNewMenuOpen((open) => !open);
                                setNotificationsOpen(false);
                            }}
                        >
                            <ChevronDown size={20} />
                        </button>
                    </div>
                    {newMenuOpen && (
                        <div className="fig-dashboard-new-menu" role="menu">
                            <button type="button" role="menuitem" onClick={() => router.push("/projects")}>
                                <span className="fig-dashboard-menu-icon"><Plus size={15} /></span>
                                <span>New Project</span>
                            </button>
                            <button type="button" role="menuitem" onClick={() => router.push("/boqs")}>
                                <span className="fig-dashboard-menu-icon"><Plus size={15} /></span>
                                <span>New BOQ</span>
                            </button>
                            <button type="button" role="menuitem" onClick={() => router.push("/templates/new")}>
                                <span className="fig-dashboard-menu-icon"><Plus size={15} /></span>
                                <span>New Template</span>
                            </button>
                        </div>
                    )}
                </div>
                <div className="relative">
                    <button
                        type="button"
                        className="fig-dashboard-bell"
                        aria-label="Notifications"
                        aria-expanded={notificationsOpen}
                        onClick={() => {
                            setNotificationsOpen((open) => !open);
                            setNewMenuOpen(false);
                        }}
                    >
                        <Bell size={19} aria-hidden="true" />
                        {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                    </button>
                    {notificationsOpen && (
                        <div className="fig-dashboard-notifications" role="dialog" aria-label="Notifications">
                            <div className="fig-dashboard-popover-header">
                                <div>
                                    <strong>Notifications</strong>
                                    <span>Stay up to date with your workspace</span>
                                </div>
                                {unreadCount > 0 && <span className="text-xs text-gray-500">{unreadCount} unread</span>}
                            </div>
                            {notificationError ? <p className="text-sm text-red-600">{notificationError}</p> :
                                notifications.length === 0 ? <p className="text-sm text-gray-500">No notifications yet.</p> :
                                <ul className="fig-dashboard-notification-list">{notifications.map((notification) => <li key={notification.id} className={notification.readAt ? "" : "is-unread"}>
                                    <span className="fig-dashboard-notification-dot" />
                                    <div>
                                        <div className="font-medium">{notification.title}</div>
                                        <div className="mt-1 text-xs text-gray-500">{new Date(notification.createdAt).toLocaleString()}</div>
                                    </div>
                                </li>)}</ul>}
                            <div className="fig-dashboard-popover-footer">You're all caught up</div>
                        </div>
                    )}
                </div>
                <div className="fig-dashboard-avatar" title="Profile">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: 6,
                                objectFit: "cover",
                            }}
                        />
                    ) : (
                        userInitials
                    )}
                </div>
            </div>
        </header>
    );
}
