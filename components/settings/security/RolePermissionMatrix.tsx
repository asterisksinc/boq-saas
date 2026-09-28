"use client";

import { useMemo, useState } from "react";
import { Search, Pencil } from "lucide-react";
import {
    PermissionCategoryGroup,
    WorkspaceRoleItem,
    toggleWorkspaceRolePermission,
} from "@/lib/api/auth";
import PermissionCategoryRow from "./PermissionCategoryRow";
import PermissionRow from "./PermissionRow";

interface RolePermissionMatrixProps {
    roles: WorkspaceRoleItem[];
    categories: PermissionCategoryGroup[];
    initialPermissions: Record<string, Record<string, boolean>>;
    onEditRole: (role: WorkspaceRoleItem) => void;
    showNotice: (message: string, type?: "success" | "error") => void;
    canManage: boolean;
}

export default function RolePermissionMatrix({
    roles,
    categories,
    initialPermissions,
    onEditRole,
    showNotice,
    canManage,
}: RolePermissionMatrixProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(
        initialPermissions
    );
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

    // Filter categories and privileges based on search query
    const filteredCategories = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return categories;

        return categories
            .map((cat) => ({
                ...cat,
                privileges: cat.privileges.filter((p) =>
                    p.name.toLowerCase().includes(query)
                ),
            }))
            .filter((cat) => cat.privileges.length > 0);
    }, [categories, searchQuery]);

    const toggleCategoryExpand = (category: string) => {
        setCollapsedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const handleToggleIndividual = async (
        roleId: string,
        permissionId: string,
        currentEnabled: boolean
    ) => {
        const nextEnabled = !currentEnabled;

        // Optimistic update
        setPermissions((prev) => ({
            ...prev,
            [roleId]: {
                ...(prev[roleId] || {}),
                [permissionId]: nextEnabled,
            },
        }));

        try {
            await toggleWorkspaceRolePermission(roleId, {
                permissionId,
                enabled: nextEnabled,
            });
        } catch (err: unknown) {
            // Rollback
            setPermissions((prev) => ({
                ...prev,
                [roleId]: {
                    ...(prev[roleId] || {}),
                    [permissionId]: currentEnabled,
                },
            }));
            showNotice(
                err instanceof Error ? err.message : "Failed to update permission.",
                "error"
            );
        }
    };

    const handleToggleCategory = async (
        roleId: string,
        category: string,
        currentStatus: "all" | "some" | "none"
    ) => {
        // If all currently enabled, disable all. Otherwise, enable all.
        const nextEnabled = currentStatus !== "all";

        const categoryGroup = categories.find((c) => c.category === category);
        if (!categoryGroup) return;

        // Optimistic update
        const previousState = { ...(permissions[roleId] || {}) };
        setPermissions((prev) => {
            const updatedRolePerms = { ...(prev[roleId] || {}) };
            for (const priv of categoryGroup.privileges) {
                updatedRolePerms[priv.id] = nextEnabled;
            }
            return {
                ...prev,
                [roleId]: updatedRolePerms,
            };
        });

        try {
            await toggleWorkspaceRolePermission(roleId, {
                category,
                enabled: nextEnabled,
            });
        } catch (err: unknown) {
            // Rollback
            setPermissions((prev) => ({
                ...prev,
                [roleId]: previousState,
            }));
            showNotice(
                err instanceof Error ? err.message : "Failed to update category permissions.",
                "error"
            );
        }
    };

    return (
        <div className="security-matrix-card">
            <div className="security-matrix-table-wrap">
                <table className="security-matrix-table">
                    <thead>
                        <tr>
                            <th className="security-matrix-search-cell">
                                <div className="security-matrix-search-box">
                                    <input
                                        type="text"
                                        className="security-matrix-search-input"
                                        placeholder="Type privilege name"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        aria-label="Filter privileges by name"
                                    />
                                    <Search size={15} className="security-matrix-search-icon" />
                                </div>
                            </th>

                            {roles.map((role) => (
                                <th key={role.id} className="security-role-col-header">
                                    <span className="security-role-label">Role</span>
                                    <div className="security-role-name-wrap">
                                        <span className="security-role-name" title={role.name}>
                                            {role.name}
                                        </span>
                                        {canManage && (
                                            <button
                                                type="button"
                                                className="security-role-edit-btn"
                                                onClick={() => onEditRole(role)}
                                                aria-label={`Edit ${role.name}`}
                                                title={`Edit ${role.name}`}
                                            >
                                                <Pencil size={12} />
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {filteredCategories.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={roles.length + 1}
                                    style={{
                                        textAlign: "center",
                                        padding: "32px 16px",
                                        color: "#64748b",
                                        fontSize: "13.5px",
                                    }}
                                >
                                    No privileges found matching &quot;{searchQuery}&quot;.
                                </td>
                            </tr>
                        ) : (
                            filteredCategories.map((catGroup) => {
                                const isCollapsed =
                                    !searchQuery && Boolean(collapsedCategories[catGroup.category]);

                                return (
                                    <ReactFragment key={catGroup.category}>
                                        <PermissionCategoryRow
                                            categoryGroup={catGroup}
                                            roles={roles}
                                            permissions={permissions}
                                            isExpanded={!isCollapsed}
                                            onToggleExpand={() => toggleCategoryExpand(catGroup.category)}
                                            onToggleCategory={handleToggleCategory}
                                            canManage={canManage}
                                        />

                                        {!isCollapsed &&
                                            catGroup.privileges.map((privilege) => (
                                                <PermissionRow
                                                    key={privilege.id}
                                                    privilege={privilege}
                                                    roles={roles}
                                                    permissions={permissions}
                                                    onTogglePermission={handleToggleIndividual}
                                                    canManage={canManage}
                                                />
                                            ))}
                                    </ReactFragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ReactFragment({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
