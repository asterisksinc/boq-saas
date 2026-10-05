"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCheck, AlertCircle, Folder, FileText, Bell, Sparkles } from "lucide-react";
import { DashboardNotification } from "@/lib/api/auth";

interface NotificationsPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: DashboardNotification[];
    unreadCount: number;
    onMarkRead: (id: string) => void;
    onMarkAllRead: () => void;
    loading?: boolean;
    error?: string | null;
}

type CategoryTab = "All" | "BOQ" | "PROJECTS" | "PAYMENTS" | "SYSTEM";

const TABS: CategoryTab[] = ["All", "BOQ", "PROJECTS", "PAYMENTS", "SYSTEM"];

function formatTimeAgo(isoString: string): string {
    try {
        const diff = Date.now() - new Date(isoString).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(isoString).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    } catch {
        return "recently";
    }
}

function getNotificationCategory(item: DashboardNotification): "BOQ" | "PROJECTS" | "PAYMENTS" | "SYSTEM" {
    const t = (item.type || "").toLowerCase();
    const target = (item.targetType || "").toLowerCase();
    const title = (item.title || "").toLowerCase();

    if (t.includes("boq") || target.includes("boq") || title.includes("boq")) return "BOQ";
    if (t.includes("project") || target.includes("project") || title.includes("project")) return "PROJECTS";
    if (t.includes("payment") || t.includes("invoice") || target.includes("payment") || target.includes("invoice") || title.includes("payment") || title.includes("invoice")) return "PAYMENTS";
    return "SYSTEM";
}

function parseNotificationContent(item: DashboardNotification) {
    const rawTitle = item.title || "Notification";
    let title = rawTitle;
    let description = item.description || "";

    // If title has a separator like " — " or ": " and description isn't set, split it nicely
    if (!description) {
        if (rawTitle.includes(" — ")) {
            const parts = rawTitle.split(" — ");
            title = parts[0].trim();
            description = parts.slice(1).join(" — ").trim();
        } else if (rawTitle.includes(": ")) {
            const parts = rawTitle.split(": ");
            title = parts[0].trim();
            description = parts.slice(1).join(": ").trim();
        } else if (rawTitle.toLowerCase().includes("approved")) {
            title = "BOQ Approved";
            description = rawTitle;
        } else if (rawTitle.toLowerCase().includes("overdue")) {
            title = "Payment Overdue";
            description = rawTitle;
        } else {
            description = rawTitle;
        }
    }

    return { title, description };
}

export default function NotificationsPopover({
    isOpen,
    onClose,
    notifications,
    unreadCount,
    onMarkRead,
    onMarkAllRead,
    loading = false,
    error = null,
}: NotificationsPopoverProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<CategoryTab>("All");

    const filtered = useMemo(() => {
        if (activeTab === "All") return notifications;
        return notifications.filter((n) => getNotificationCategory(n) === activeTab);
    }, [notifications, activeTab]);

    if (!isOpen) return null;

    const handleItemClick = (item: DashboardNotification) => {
        if (!item.readAt) {
            onMarkRead(item.id);
        }

        // Navigate if target is known
        if (item.targetType === "project" && item.targetId) {
            onClose();
            router.push(`/projects/${item.targetId}`);
        } else if (item.targetType === "boq") {
            onClose();
            router.push("/boqs");
        } else if (item.targetType === "invoice") {
            onClose();
            router.push("/invoices");
        }
    };

    return (
        <div
            className="fig-dashboard-notifications"
            role="dialog"
            aria-label="Notifications"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="fig-notif-header">
                <div className="fig-notif-header-left">
                    <span className="fig-notif-title">Notifications</span>
                    {unreadCount > 0 ? (
                        <span className="fig-notif-badge">{unreadCount} NEW</span>
                    ) : (
                        <span className="fig-notif-badge fig-notif-badge-subtle">0 NEW</span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        className="fig-notif-mark-all-btn"
                        onClick={onMarkAllRead}
                    >
                        <CheckCheck size={14} className="fig-notif-check-icon" />
                        <span>Mark all as read</span>
                    </button>
                )}
            </div>

            {/* Category Filter Tabs */}
            <div className="fig-notif-tabs" role="tablist">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        className={`fig-notif-tab ${activeTab === tab ? "is-active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="fig-notif-body">
                {loading && notifications.length === 0 ? (
                    <div className="fig-notif-empty">Loading notifications...</div>
                ) : error ? (
                    <div className="fig-notif-empty text-red-500">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="fig-notif-empty">
                        <Bell size={24} className="fig-notif-empty-icon" />
                        <strong>No notifications</strong>
                        <span>
                            {activeTab === "All"
                                ? "You're all caught up! No notifications right now."
                                : `No ${activeTab} notifications at this moment.`}
                        </span>
                    </div>
                ) : (
                    <ul className="fig-notif-list">
                        {filtered.map((item) => {
                            const category = getNotificationCategory(item);
                            const { title, description } = parseNotificationContent(item);
                            const isUnread = !item.readAt;

                            // Determine icon style
                            const isApproved =
                                item.type?.includes("approved") ||
                                title.toLowerCase().includes("approved") ||
                                item.priority === "low";
                            const isAlert =
                                item.type?.includes("overdue") ||
                                title.toLowerCase().includes("overdue") ||
                                item.priority === "urgent" ||
                                item.priority === "high";

                            return (
                                <li
                                    key={item.id}
                                    className={`fig-notif-item ${isUnread ? "is-unread" : ""}`}
                                    onClick={() => handleItemClick(item)}
                                >
                                    {/* Icon Circle */}
                                    <div
                                        className={`fig-notif-avatar ${
                                            isAlert
                                                ? "is-alert"
                                                : isApproved
                                                ? "is-approved"
                                                : category === "BOQ"
                                                ? "is-boq"
                                                : category === "PROJECTS"
                                                ? "is-project"
                                                : "is-system"
                                        }`}
                                    >
                                        {isAlert ? (
                                            <AlertCircle size={16} />
                                        ) : isApproved ? (
                                            <Check size={16} />
                                        ) : category === "BOQ" ? (
                                            <FileText size={16} />
                                        ) : category === "PROJECTS" ? (
                                            <Folder size={16} />
                                        ) : (
                                            <Sparkles size={16} />
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="fig-notif-content">
                                        <div className="fig-notif-top-row">
                                            <span className="fig-notif-item-title">{title}</span>
                                            <div className="fig-notif-time-wrap">
                                                <span className="fig-notif-time">
                                                    {formatTimeAgo(item.createdAt)}
                                                </span>
                                                {isUnread && <span className="fig-notif-unread-dot" />}
                                            </div>
                                        </div>

                                        <p className="fig-notif-description">{description}</p>

                                        <span className={`fig-notif-category-tag tag-${category.toLowerCase()}`}>
                                            {category === "PAYMENTS" ? "Payments" : category}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
