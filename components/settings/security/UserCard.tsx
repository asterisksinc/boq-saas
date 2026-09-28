"use client";

import { Pencil, Trash2 } from "lucide-react";
import { WorkspaceUserItem } from "@/lib/api/auth";

interface UserCardProps {
    user: WorkspaceUserItem;
    onEdit: (user: WorkspaceUserItem) => void;
    onDelete: (user: WorkspaceUserItem) => void;
    canManage?: boolean;
}

export default function UserCard({
    user,
    onEdit,
    onDelete,
    canManage = true,
}: UserCardProps) {
    const initials = user.displayName
        ? user.displayName
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0])
              .join("")
              .toUpperCase()
        : user.email.slice(0, 2).toUpperCase();

    return (
        <article className="security-user-card" aria-label={`User card for ${user.displayName}`}>
            <div className="security-user-card-top">
                <div className="security-user-card-info">
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="security-user-avatar"
                        />
                    ) : (
                        <div className="security-user-avatar" aria-hidden="true">
                            {initials}
                        </div>
                    )}
                    <div className="security-user-details">
                        <h4 className="security-user-name">{user.displayName}</h4>
                        <span className="security-user-role">{user.role || "Member"}</span>
                    </div>
                </div>

                {canManage && (
                    <div className="security-user-card-actions">
                        <button
                            type="button"
                            className="security-icon-btn edit"
                            onClick={() => onEdit(user)}
                            aria-label={`Edit ${user.displayName}`}
                            title="Edit User"
                        >
                            <Pencil size={15} />
                        </button>
                        <button
                            type="button"
                            className="security-icon-btn delete"
                            onClick={() => onDelete(user)}
                            aria-label={`Delete ${user.displayName}`}
                            title="Delete User"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                )}
            </div>

            <div className="security-user-card-divider" />

            <div className="security-user-card-bottom">
                <div className="security-user-meta-item">
                    <span className="security-meta-label">Phone:</span>
                    <span className="security-meta-value">{user.phone || "—"}</span>
                </div>
                <div className="security-user-meta-item">
                    <span className="security-meta-label">Email:</span>
                    <span className="security-meta-value">{user.email || "—"}</span>
                </div>
            </div>
        </article>
    );
}
