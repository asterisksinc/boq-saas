"use client";

import { Check } from "lucide-react";
import { PermissionPrivilegeItem, WorkspaceRoleItem } from "@/lib/api/auth";

interface PermissionRowProps {
    privilege: PermissionPrivilegeItem;
    roles: WorkspaceRoleItem[];
    permissions: Record<string, Record<string, boolean>>;
    onTogglePermission: (roleId: string, permissionId: string, currentEnabled: boolean) => void;
    canManage: boolean;
}

export default function PermissionRow({
    privilege,
    roles,
    permissions,
    onTogglePermission,
    canManage,
}: PermissionRowProps) {
    return (
        <tr className="security-privilege-row">
            <td className="security-privilege-name-cell">
                <span>{privilege.name}</span>
            </td>

            {roles.map((role) => {
                const isEnabled = Boolean(permissions[role.id]?.[privilege.id]);

                return (
                    <td key={role.id} className="security-checkbox-cell">
                        <button
                            type="button"
                            className={`security-custom-checkbox ${isEnabled ? "checked" : ""}`}
                            onClick={() => {
                                if (!canManage) return;
                                onTogglePermission(role.id, privilege.id, isEnabled);
                            }}
                            disabled={!canManage}
                            aria-label={`Toggle ${privilege.name} for ${role.name}`}
                            title={isEnabled ? `Enabled for ${role.name}` : `Disabled for ${role.name}`}
                        >
                            {isEnabled && <Check size={13} strokeWidth={3} />}
                        </button>
                    </td>
                );
            })}
        </tr>
    );
}
