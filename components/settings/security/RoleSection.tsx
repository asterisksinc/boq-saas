"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import {
    WorkspaceRoleItem,
    PermissionCategoryGroup,
    getWorkspaceRolesAndPermissions,
} from "@/lib/api/auth";
import RolePermissionMatrix from "./RolePermissionMatrix";
import RoleFormModal from "./RoleFormModal";

interface RoleSectionProps {
    showNotice: (message: string, type?: "success" | "error") => void;
    userRole?: string;
}

export default function RoleSection({ showNotice, userRole }: RoleSectionProps) {
    const [roles, setRoles] = useState<WorkspaceRoleItem[]>([]);
    const [categories, setCategories] = useState<PermissionCategoryGroup[]>([]);
    const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<WorkspaceRoleItem | null>(null);

    const canManage = userRole ? ["owner", "admin"].includes(userRole) : true;

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getWorkspaceRolesAndPermissions();
            setRoles(data.roles || []);
            setCategories(data.categories || []);
            setPermissions(data.permissions || {});
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load roles and privileges.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAddRoleClick = () => {
        setRoleToEdit(null);
        setModalOpen(true);
    };

    const handleEditRoleClick = (role: WorkspaceRoleItem) => {
        setRoleToEdit(role);
        setModalOpen(true);
    };

    const handleMutationSuccess = (message: string) => {
        showNotice(message, "success");
        loadData();
    };

    if (loading) {
        return (
            <div className="security-section-wrapper" aria-busy="true">
                <div className="security-section-header">
                    <h3 className="security-section-title">Roles & Privileges</h3>
                    <div className="skeleton" style={{ width: 106, height: 38, borderRadius: 6 }} />
                </div>
                <div className="security-matrix-card">
                    <div className="skeleton" style={{ height: 56, marginBottom: 8, borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 36, marginBottom: 4, borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 44, marginBottom: 4, borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 44, marginBottom: 4, borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 36, marginBottom: 4, borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 44, marginBottom: 4, borderRadius: 4 }} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="security-section-wrapper">
                <div className="security-section-header">
                    <h3 className="security-section-title">Roles & Privileges</h3>
                </div>
                <div className="notice-banner error" role="alert" style={{ marginBottom: 16 }}>
                    <span>{error}</span>
                </div>
                <button
                    type="button"
                    className="security-btn-primary"
                    onClick={loadData}
                    style={{ width: "fit-content" }}
                >
                    Retry Loading Roles
                </button>
            </div>
        );
    }

    return (
        <div className="security-section-wrapper">
            <div className="security-section-header">
                <h3 className="security-section-title">Roles & Privileges</h3>
                {canManage && (
                    <button
                        type="button"
                        className="security-btn-primary"
                        onClick={handleAddRoleClick}
                        data-testid="add-role-btn"
                    >
                        <Plus size={20} strokeWidth={2.2} />
                        <span>Add Role</span>
                    </button>
                )}
            </div>

            <RolePermissionMatrix
                roles={roles}
                categories={categories}
                initialPermissions={permissions}
                onEditRole={handleEditRoleClick}
                showNotice={showNotice}
                canManage={canManage}
            />

            <RoleFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={handleMutationSuccess}
                roleToEdit={roleToEdit}
            />
        </div>
    );
}
