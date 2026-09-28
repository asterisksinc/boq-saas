"use client";

import { ChevronDown, Check, Minus } from "lucide-react";
import { PermissionCategoryGroup, WorkspaceRoleItem } from "@/lib/api/auth";

interface PermissionCategoryRowProps {
    categoryGroup: PermissionCategoryGroup;
    roles: WorkspaceRoleItem[];
    permissions: Record<string, Record<string, boolean>>;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onToggleCategory: (roleId: string, category: string, currentStatus: "all" | "some" | "none") => void;
    canManage: boolean;
}

export default function PermissionCategoryRow({
    categoryGroup,
    roles,
    permissions,
    isExpanded,
    onToggleExpand,
    onToggleCategory,
    canManage,
}: PermissionCategoryRowProps) {
    const totalPrivileges = categoryGroup.privileges.length;

    return (
        <tr className="security-category-row">
            <td className="security-category-cell">
                <button
                    type="button"
                    className="security-category-toggle-btn"
                    onClick={onToggleExpand}
                    aria-expanded={isExpanded}
                >
                    <ChevronDown
                        size={16}
                        className={`security-category-chevron ${isExpanded ? "" : "collapsed"}`}
                    />
                    <span>{categoryGroup.category}</span>
                </button>
            </td>

            {roles.map((role) => {
                const rolePerms = permissions[role.id] || {};
                let enabledCount = 0;
                for (const priv of categoryGroup.privileges) {
                    if (rolePerms[priv.id]) enabledCount++;
                }

                let status: "all" | "some" | "none" = "none";
                if (enabledCount === totalPrivileges && totalPrivileges > 0) {
                    status = "all";
                } else if (enabledCount > 0) {
                    status = "some";
                }

                return (
                    <td key={role.id} className="security-checkbox-cell">
                        <button
                            type="button"
                            className={`security-custom-checkbox ${
                                status === "all" ? "checked" : status === "some" ? "indeterminate" : ""
                            }`}
                            onClick={() => {
                                if (!canManage) return;
                                onToggleCategory(role.id, categoryGroup.category, status);
                            }}
                            disabled={!canManage}
                            aria-label={`Toggle all ${categoryGroup.category} privileges for ${role.name}`}
                            title={
                                status === "all"
                                    ? `All ${categoryGroup.category} privileges enabled for ${role.name}`
                                    : status === "some"
                                    ? `Some ${categoryGroup.category} privileges enabled for ${role.name}`
                                    : `No ${categoryGroup.category} privileges enabled for ${role.name}`
                            }
                        >
                            {status === "all" ? (
                                <Check size={13} strokeWidth={3} />
                            ) : status === "some" ? (
                                <Minus size={13} strokeWidth={3} />
                            ) : null}
                        </button>
                    </td>
                );
            })}
        </tr>
    );
}
