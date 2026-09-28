"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2 } from "lucide-react";
import {
    WorkspaceUserItem,
    WorkspaceRoleItem,
    getWorkspaceUsers,
    getWorkspaceRolesAndPermissions,
} from "@/lib/api/auth";
import UserCard from "./UserCard";
import UserFormModal from "./UserFormModal";
import DeleteUserDialog from "./DeleteUserDialog";

interface UsersSectionProps {
    showNotice: (message: string, type?: "success" | "error") => void;
    userRole?: string;
}

export default function UsersSection({ showNotice, userRole }: UsersSectionProps) {
    const [users, setUsers] = useState<WorkspaceUserItem[]>([]);
    const [availableRoles, setAvailableRoles] = useState<WorkspaceRoleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals state
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<WorkspaceUserItem | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<WorkspaceUserItem | null>(null);

    const canManage = userRole ? ["owner", "admin"].includes(userRole) : true;

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                getWorkspaceUsers(),
                getWorkspaceRolesAndPermissions(),
            ]);
            setUsers(usersRes.items || []);
            setAvailableRoles(rolesRes.roles || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load workspace users.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAddUserClick = () => {
        setUserToEdit(null);
        setFormModalOpen(true);
    };

    const handleEditUserClick = (user: WorkspaceUserItem) => {
        setUserToEdit(user);
        setFormModalOpen(true);
    };

    const handleDeleteUserClick = (user: WorkspaceUserItem) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    const handleMutationSuccess = (message: string) => {
        showNotice(message, "success");
        loadData();
    };

    if (loading) {
        return (
            <div className="security-access-content">
                <div className="security-section-header">
                    <h3 className="security-section-title">User</h3>
                    <div className="skeleton" style={{ width: 110, height: 38, borderRadius: 8 }} />
                </div>
                <div className="security-user-cards-list">
                    <div className="skeleton" style={{ height: 115, borderRadius: 12 }} />
                    <div className="skeleton" style={{ height: 115, borderRadius: 12 }} />
                    <div className="skeleton" style={{ height: 115, borderRadius: 12 }} />
                    <div className="skeleton" style={{ height: 115, borderRadius: 12 }} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="security-access-content">
                <div className="security-section-header">
                    <h3 className="security-section-title">User</h3>
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
                    Retry Loading Users
                </button>
            </div>
        );
    }

    return (
        <div className="security-access-content">
            <div className="security-section-header">
                <h3 className="security-section-title">User</h3>
                {canManage && (
                    <button
                        type="button"
                        className="security-btn-primary"
                        onClick={handleAddUserClick}
                    >
                        <Plus size={16} />
                        <span>Add User</span>
                    </button>
                )}
            </div>

            {users.length === 0 ? (
                <div
                    style={{
                        padding: "48px 24px",
                        textAlign: "center",
                        background: "#ffffff",
                        borderRadius: "12px",
                        border: "1px dashed #cbd5e1",
                    }}
                >
                    <p style={{ color: "#64748b", margin: "0 0 16px 0", fontSize: "14px" }}>
                        No users currently assigned to this workspace.
                    </p>
                    {canManage && (
                        <button
                            type="button"
                            className="security-btn-primary"
                            onClick={handleAddUserClick}
                        >
                            <Plus size={16} />
                            <span>Add First User</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="security-user-cards-list">
                    {users.map((user) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            onEdit={handleEditUserClick}
                            onDelete={handleDeleteUserClick}
                            canManage={canManage}
                        />
                    ))}
                </div>
            )}

            {/* Add / Edit User Modal */}
            <UserFormModal
                isOpen={formModalOpen}
                onClose={() => setFormModalOpen(false)}
                onSuccess={handleMutationSuccess}
                userToEdit={userToEdit}
                availableRoles={availableRoles}
            />

            {/* Delete Confirmation Modal */}
            <DeleteUserDialog
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onSuccess={handleMutationSuccess}
                user={userToDelete}
            />
        </div>
    );
}
