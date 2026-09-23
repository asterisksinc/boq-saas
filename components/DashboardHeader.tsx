"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSettingsOverview } from "@/lib/api/auth";

interface DashboardHeaderProps {
    title?: string;
    onNew?: () => void;
    onSearch?: (query: string) => void;
    avatarUrl?: string | null;
    userInitials?: string;
}

export default function DashboardHeader({
    title = "Overview",
    onNew,
    onSearch,
    avatarUrl: propAvatarUrl,
    userInitials: propUserInitials,
}: DashboardHeaderProps) {
    const router = useRouter();
    const [searchValue, setSearchValue] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(propAvatarUrl ?? null);
    const [userInitials, setUserInitials] = useState(propUserInitials ?? "BO");

    useEffect(() => {
        if (propAvatarUrl !== undefined) {
            setAvatarUrl(propAvatarUrl);
        }
        if (propUserInitials !== undefined) {
            setUserInitials(propUserInitials);
        }
    }, [propAvatarUrl, propUserInitials]);

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
                <button
                    type="button"
                    className="fig-dashboard-new"
                    onClick={handleNewClick}
                >
                    <Plus size={20} />
                    <span>New</span>
                    <i />
                    <ChevronDown size={20} />
                </button>
                <button
                    type="button"
                    className="fig-dashboard-bell"
                    aria-label="Notifications"
                >
                    <img src="/assets/dashboard/dashboard-notifications.svg" alt="" />
                </button>
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
