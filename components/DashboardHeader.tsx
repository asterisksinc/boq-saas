"use client";

import { Bell, ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import {
    getDashboardNotifications,
    getSettingsOverview,
    markNotificationRead,
    markAllNotificationsRead,
    DashboardNotification,
} from "@/lib/api/auth";
import SearchPopover from "./header/SearchPopover";
import NewMenuPopover from "./header/NewMenuPopover";
import NotificationsPopover from "./header/NotificationsPopover";

interface DashboardHeaderProps {
    title?: string;
    onNew?: () => void;
    onSearch?: (query: string) => void;
    avatarUrl?: string | null;
    userInitials?: string;
    profile?: { displayName?: string | null; avatarUrl?: string | null; email?: string | null } | null;
}

type ActiveOverlay = "none" | "search" | "new" | "notifications";

export default function DashboardHeader({
    title = "Overview",
    onNew,
    onSearch,
    avatarUrl: propAvatarUrl,
    userInitials: propUserInitials,
    profile,
}: DashboardHeaderProps) {
    const router = useRouter();
    const headerRef = useRef<HTMLElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Active popover overlay state: at most one open at a time
    const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>("none");

    // Search state
    const [searchValue, setSearchValue] = useState("");

    // Profile state
    const profileName = profile?.displayName?.trim() || profile?.email?.split("@")[0] || "";
    const profileInitials = profileName
        ? profileName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()
        : "BO";
    const [avatarUrl, setAvatarUrl] = useState<string | null>(propAvatarUrl ?? profile?.avatarUrl ?? null);
    const [userInitials, setUserInitials] = useState(propUserInitials ?? profileInitials);

    // Notifications state
    const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState<string | null>(null);

    // Sync profile props
    useEffect(() => {
        if (propAvatarUrl !== undefined || profile?.avatarUrl !== undefined) {
            setAvatarUrl(propAvatarUrl ?? profile?.avatarUrl ?? null);
        }
        if (propUserInitials !== undefined || profileName) {
            setUserInitials(propUserInitials ?? profileInitials);
        }
    }, [profileName, profileInitials, profile?.avatarUrl, propAvatarUrl, propUserInitials]);

    // Fetch user profile overview if needed
    useEffect(() => {
        let mounted = true;
        const fetchOverview = () => {
            getSettingsOverview()
                .then((overview) => {
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

    // Fetch real notifications from backend
    const loadNotifications = useCallback(() => {
        setLoadingNotifications(true);
        getDashboardNotifications({ pageSize: 20 })
            .then((data) => {
                setNotifications(data.items || []);
                setUnreadCount(data.unreadCount || 0);
                setNotificationError(null);
            })
            .catch((error) => {
                setNotificationError(
                    error instanceof Error ? error.message : "Notifications could not be loaded."
                );
            })
            .finally(() => {
                setLoadingNotifications(false);
            });
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    // Mark single notification as read
    const handleMarkRead = async (id: string) => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
            await markNotificationRead(id);
        } catch {
            // Revert on error
            loadNotifications();
        }
    };

    // Mark all notifications as read
    const handleMarkAllRead = async () => {
        const now = new Date().toISOString();
        // Optimistic update
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: now })));
        setUnreadCount(0);

        try {
            await markAllNotificationsRead();
        } catch {
            // Revert on error
            loadNotifications();
        }
    };

    // Outside click & Escape to close overlays
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setActiveOverlay("none");
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
                setActiveOverlay("none");
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Search input handlers
    const handleSearchClick = () => {
        setActiveOverlay("search");
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchValue(val);
        if (activeOverlay !== "search") {
            setActiveOverlay("search");
        }
        if (onSearch) {
            onSearch(val);
        }
    };

    const handleSelectSearchQuery = (q: string) => {
        setSearchValue(q);
        if (onSearch) {
            onSearch(q);
        }
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    // + New handlers
    const handleNewButtonClick = () => {
        if (onNew) {
            onNew();
        } else {
            setActiveOverlay((prev) => (prev === "new" ? "none" : "new"));
        }
    };

    const handleNewChevronClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveOverlay((prev) => (prev === "new" ? "none" : "new"));
    };

    // Bell handler
    const handleBellClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveOverlay((prev) => (prev === "notifications" ? "none" : "notifications"));
    };

    return (
        <header ref={headerRef} className="fig-dashboard-header">
            <h1>{title}</h1>

            <div className="fig-dashboard-header-actions">
                {/* 1. SEARCH TRIGGER & POPOVER */}
                <div className="fig-dashboard-header-item fig-dashboard-search-container">
                    <label className="fig-dashboard-search" onClick={handleSearchClick}>
                        <img src="/assets/dashboard/dashboard-search.svg" alt="" />
                        <input
                            ref={searchInputRef}
                            placeholder="Search..."
                            aria-label="Search"
                            value={searchValue}
                            onChange={handleSearchChange}
                            onFocus={handleSearchClick}
                        />
                    </label>

                    <SearchPopover
                        isOpen={activeOverlay === "search"}
                        query={searchValue}
                        onClose={() => setActiveOverlay("none")}
                        onSelectQuery={handleSelectSearchQuery}
                        onNavigate={(url) => router.push(url)}
                    />
                </div>

                {/* 2. + NEW TRIGGER & POPOVER */}
                <div className="fig-dashboard-header-item fig-dashboard-new-container">
                    <div className="fig-dashboard-new">
                        <button
                            type="button"
                            onClick={handleNewButtonClick}
                            className="flex items-center gap-2"
                        >
                            <Plus size={20} />
                            <span>New</span>
                        </button>
                        <i />
                        <button
                            type="button"
                            aria-label="Open new menu"
                            aria-expanded={activeOverlay === "new"}
                            onClick={handleNewChevronClick}
                        >
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    <NewMenuPopover
                        isOpen={activeOverlay === "new"}
                        onClose={() => setActiveOverlay("none")}
                        onNew={onNew}
                    />
                </div>

                {/* 3. NOTIFICATIONS TRIGGER & POPOVER */}
                <div className="fig-dashboard-header-item fig-dashboard-bell-container">
                    <button
                        type="button"
                        className="fig-dashboard-bell"
                        aria-label="Notifications"
                        aria-expanded={activeOverlay === "notifications"}
                        onClick={handleBellClick}
                        style={{ position: "relative" }}
                    >
                        <Bell size={19} aria-hidden="true" />
                        {unreadCount > 0 && (
                            <span
                                style={{
                                    position: "absolute",
                                    top: "-2px",
                                    right: "-2px",
                                    minWidth: "16px",
                                    height: "16px",
                                    borderRadius: "999px",
                                    backgroundColor: "#ef4444",
                                    color: "#ffffff",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    lineHeight: "16px",
                                    textAlign: "center",
                                    padding: "0 4px",
                                }}
                            >
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    <NotificationsPopover
                        isOpen={activeOverlay === "notifications"}
                        onClose={() => setActiveOverlay("none")}
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onMarkRead={handleMarkRead}
                        onMarkAllRead={handleMarkAllRead}
                        loading={loadingNotifications}
                        error={notificationError}
                    />
                </div>

                {/* 4. USER PROFILE AVATAR */}
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
