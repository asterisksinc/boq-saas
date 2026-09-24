"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
    archiveOrganizationLocation,
    getOrganizationLocations,
    OrganizationLocation,
    setDefaultOrganizationLocation,
} from "@/lib/api/auth";
import OrganizationLocationModal from "./OrganizationLocationModal";
import DeleteLocationModal from "./DeleteLocationModal";

interface OrganizationLocationsProps {
    canEdit: boolean;
    showNotice: (message: string, type?: "success" | "error") => void;
}

export default function OrganizationLocations({
    canEdit,
    showNotice,
}: OrganizationLocationsProps) {
    const [locations, setLocations] = useState<OrganizationLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add / Edit Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingLocation, setEditingLocation] = useState<OrganizationLocation | null>(null);

    // Delete Modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [locationToDelete, setLocationToDelete] = useState<OrganizationLocation | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Setting Default state
    const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

    const loadLocations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getOrganizationLocations();
            setLocations(res.items || []);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load locations.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLocations();
    }, [loadLocations]);

    // Handle Open Add Modal
    const handleOpenAdd = () => {
        if (!canEdit) {
            showNotice("You do not have permission to add locations.", "error");
            return;
        }
        setModalMode("create");
        setEditingLocation(null);
        setModalOpen(true);
    };

    // Handle Open Edit Modal
    const handleOpenEdit = (loc: OrganizationLocation) => {
        if (!canEdit) {
            showNotice("You do not have permission to edit locations.", "error");
            return;
        }
        setModalMode("edit");
        setEditingLocation(loc);
        setModalOpen(true);
    };

    // Handle Modal Success
    const handleModalSuccess = (savedLocation: OrganizationLocation, mode: "create" | "edit") => {
        setModalOpen(false);
        setEditingLocation(null);
        // Refresh locations from server
        loadLocations();
    };

    // Handle Set Default
    const handleSetDefault = async (loc: OrganizationLocation) => {
        if (!canEdit) {
            showNotice("You do not have permission to set default location.", "error");
            return;
        }
        if (loc.isDefault) return;

        setSettingDefaultId(loc.id);
        try {
            await setDefaultOrganizationLocation(loc.id);
            showNotice("Default location updated.", "success");
            await loadLocations();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to set default location.";
            showNotice(msg, "error");
        } finally {
            setSettingDefaultId(null);
        }
    };

    // Handle Open Delete Modal
    const handleOpenDelete = (loc: OrganizationLocation) => {
        if (!canEdit) {
            showNotice("You do not have permission to delete locations.", "error");
            return;
        }
        setLocationToDelete(loc);
        setDeleteModalOpen(true);
    };

    // Handle Confirm Delete
    const handleConfirmDelete = async () => {
        if (!locationToDelete) return;
        setDeleting(true);
        try {
            await archiveOrganizationLocation(locationToDelete.id);
            showNotice("Location archived successfully.", "success");
            setDeleteModalOpen(false);
            setLocationToDelete(null);
            await loadLocations();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to archive location.";
            showNotice(msg, "error");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="org-content-card org-locations-card">
            {/* Header: Locations title on left, + Add Location on right */}
            <div className="org-locations-header">
                <h3 className="org-locations-title">Locations</h3>
                <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="btn-primary org-btn-add-location"
                    disabled={!canEdit}
                    title={!canEdit ? "Adding locations requires Owner or Admin role" : undefined}
                >
                    <Plus size={16} aria-hidden="true" />
                    <span>Add Location</span>
                </button>
            </div>

            <div className="org-locations-divider" />

            {/* Loading Skeleton */}
            {loading && (
                <div className="org-locations-list" aria-busy="true">
                    {[1, 2].map((idx) => (
                        <div key={idx} className="org-location-row skeleton-row">
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                                <div className="skeleton" style={{ width: "140px", height: "18px", borderRadius: "4px" }} />
                                <div className="skeleton" style={{ width: "280px", height: "14px", borderRadius: "4px" }} />
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <div className="skeleton" style={{ width: "60px", height: "32px", borderRadius: "6px" }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="org-locations-error" role="alert">
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={loadLocations}
                        className="btn-primary"
                        style={{ height: "36px", padding: "0 16px", fontSize: "13px" }}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && locations.length === 0 && (
                <div className="org-locations-empty">
                    <h4>No locations configured</h4>
                    <p>Add your first office or branch location.</p>
                    <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="btn-primary org-btn-add-location"
                        disabled={!canEdit}
                        style={{ marginTop: "12px" }}
                    >
                        <Plus size={16} aria-hidden="true" />
                        <span>Add Location</span>
                    </button>
                </div>
            )}

            {/* Locations List */}
            {!loading && !error && locations.length > 0 && (
                <div className="org-locations-list">
                    {locations.map((loc) => {
                        const isSettingThisDefault = settingDefaultId === loc.id;
                        return (
                            <div key={loc.id} className="org-location-row">
                                <div className="org-location-info">
                                    <div className="org-location-title-row">
                                        <span className="org-location-name">{loc.name}</span>
                                        {loc.isDefault && (
                                            <span className="org-loc-default-badge">DEFAULT</span>
                                        )}
                                    </div>
                                    <div className="org-location-address">
                                        {loc.address} · {loc.city}, {loc.state}
                                    </div>
                                </div>

                                <div className="org-location-actions">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEdit(loc)}
                                        className="org-loc-btn-neutral"
                                        disabled={!canEdit}
                                    >
                                        Edit
                                    </button>

                                    {!loc.isDefault && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleSetDefault(loc)}
                                                className="org-loc-btn-neutral"
                                                disabled={!canEdit || isSettingThisDefault}
                                            >
                                                {isSettingThisDefault && (
                                                    <Loader2 size={13} className="spin" aria-hidden="true" />
                                                )}
                                                <span>Set Default</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleOpenDelete(loc)}
                                                className="org-loc-btn-delete"
                                                disabled={!canEdit}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Location Modal */}
            <OrganizationLocationModal
                isOpen={modalOpen}
                mode={modalMode}
                initialLocation={editingLocation}
                onClose={() => setModalOpen(false)}
                onSuccess={handleModalSuccess}
                showNotice={showNotice}
            />

            {/* Delete Location Confirmation Modal */}
            <DeleteLocationModal
                isOpen={deleteModalOpen}
                location={locationToDelete}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                isDeleting={deleting}
            />
        </div>
    );
}
