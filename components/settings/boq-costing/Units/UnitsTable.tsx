"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MoreHorizontal, Plus } from "lucide-react";
import { BoqUnit } from "@/lib/settings/types";
import UnitModal from "./UnitModal";
import DeleteConfirmModal from "../DeleteConfirmModal";

interface UnitsTableProps {
    units: BoqUnit[];
    canEdit: boolean;
    onSaveUnit: (unitData: Omit<BoqUnit, "id"> & { id?: string }) => Promise<void>;
    onToggleActive: (unitId: string, active: boolean) => Promise<void>;
    onDeleteUnit: (unitId: string) => Promise<void>;
    showNotice: (message: string, type?: "success" | "error") => void;
}

export default function UnitsTable({
    units,
    canEdit,
    onSaveUnit,
    onToggleActive,
    onDeleteUnit,
    showNotice,
}: UnitsTableProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingUnit, setEditingUnit] = useState<BoqUnit | null>(null);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [unitToDelete, setUnitToDelete] = useState<BoqUnit | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Active toggle loading states
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // Row action dropdown state
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const handleOpenAdd = () => {
        if (!canEdit) {
            showNotice("You do not have permission to add units.", "error");
            return;
        }
        setModalMode("create");
        setEditingUnit(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (unit: BoqUnit) => {
        if (!canEdit) {
            showNotice("You do not have permission to edit units.", "error");
            return;
        }
        setOpenMenuId(null);
        setModalMode("edit");
        setEditingUnit(unit);
        setModalOpen(true);
    };

    const handleToggle = async (unit: BoqUnit) => {
        if (!canEdit) {
            showNotice("You do not have permission to modify units.", "error");
            return;
        }
        setOpenMenuId(null);
        setTogglingId(unit.id);
        try {
            await onToggleActive(unit.id, !unit.active);
            showNotice(
                `Unit ${unit.name} ${!unit.active ? "enabled" : "disabled"}.`,
                "success"
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to toggle unit status.";
            showNotice(msg, "error");
        } finally {
            setTogglingId(null);
        }
    };

    const handleOpenDelete = (unit: BoqUnit) => {
        if (!canEdit) {
            showNotice("You do not have permission to delete units.", "error");
            return;
        }
        setOpenMenuId(null);
        setUnitToDelete(unit);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!unitToDelete) return;
        setDeleting(true);
        try {
            await onDeleteUnit(unitToDelete.id);
            showNotice(`Unit "${unitToDelete.name}" deleted.`, "success");
            setDeleteModalOpen(false);
            setUnitToDelete(null);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to delete unit.";
            showNotice(msg, "error");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="boq-content-card">
            {/* Header: BOQ & Costing + Add Custom Unit */}
            <div className="boq-card-header">
                <h2 className="boq-card-title">BOQ & Costing</h2>
                <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="boq-btn-primary"
                    disabled={!canEdit}
                >
                    <Plus size={16} aria-hidden="true" />
                    <span>Add Custom Unit</span>
                </button>
            </div>

            {/* Empty State */}
            {units.length === 0 ? (
                <div className="boq-empty-state">
                    <h4>No custom units yet</h4>
                    <p>Create your first custom unit to use it in BOQs and costing.</p>
                    <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="boq-btn-primary"
                        disabled={!canEdit}
                        style={{ marginTop: "14px" }}
                    >
                        <Plus size={16} aria-hidden="true" />
                        <span>Add Custom Unit</span>
                    </button>
                </div>
            ) : (
                /* Table matching Screenshot 1 */
                <div className="boq-table-wrapper" ref={menuRef}>
                    <table className="boq-table" aria-label="Units list">
                        <thead>
                            <tr>
                                <th scope="col" style={{ width: "24%" }}>UNIT NAME</th>
                                <th scope="col" style={{ width: "16%" }}>CODE</th>
                                <th scope="col" style={{ width: "18%" }}>TYPE</th>
                                <th scope="col" style={{ width: "16%" }}>DECIMALS</th>
                                <th scope="col" style={{ width: "16%" }}>ACTIVE</th>
                                <th scope="col" style={{ width: "10%", textAlign: "right" }} aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {units.map((unit) => {
                                const isMenuOpen = openMenuId === unit.id;
                                const isToggling = togglingId === unit.id;

                                return (
                                    <tr key={unit.id} className="boq-table-row">
                                        <td className="boq-table-cell-name">
                                            <span>{unit.name}</span>
                                        </td>
                                        <td className="boq-table-cell-code">
                                            <span>{unit.code}</span>
                                        </td>
                                        <td className="boq-table-cell-type">
                                            <span>{unit.type}</span>
                                        </td>
                                        <td className="boq-table-cell-decimals">
                                            <span>{unit.decimals}</span>
                                        </td>
                                        <td className="boq-table-cell-active">
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={unit.active}
                                                aria-label={`Toggle active state for ${unit.name}`}
                                                className={`boq-toggle ${unit.active ? "is-active" : ""}`}
                                                onClick={() => handleToggle(unit)}
                                                disabled={!canEdit || isToggling}
                                            >
                                                <span className="boq-toggle-thumb">
                                                    {isToggling && (
                                                        <Loader2 size={10} className="spin" style={{ color: "#2563eb" }} />
                                                    )}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="boq-table-cell-actions" style={{ textAlign: "right", position: "relative" }}>
                                            <button
                                                type="button"
                                                className="boq-actions-btn"
                                                aria-label={`Actions for ${unit.name}`}
                                                aria-expanded={isMenuOpen}
                                                onClick={() => setOpenMenuId(isMenuOpen ? null : unit.id)}
                                                disabled={!canEdit}
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {isMenuOpen && (
                                                <div className="boq-dropdown-menu" role="menu">
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="boq-dropdown-item"
                                                        onClick={() => handleOpenEdit(unit)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="boq-dropdown-item"
                                                        onClick={() => handleToggle(unit)}
                                                    >
                                                        {unit.active ? "Disable" : "Enable"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="boq-dropdown-item is-danger"
                                                        onClick={() => handleOpenDelete(unit)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add / Edit Custom Unit Modal */}
            <UnitModal
                isOpen={modalOpen}
                mode={modalMode}
                initialUnit={editingUnit}
                existingUnits={units}
                onClose={() => {
                    setModalOpen(false);
                    setEditingUnit(null);
                }}
                onSave={onSaveUnit}
                showNotice={showNotice}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                title="Delete Unit"
                itemName={unitToDelete?.name || ""}
                description={
                    unitToDelete?.isCustom === false
                        ? "This is a default system unit. Deleting it will remove it from future BOQ selections."
                        : "This custom unit will be removed from your workspace settings."
                }
                deleting={deleting}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setUnitToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
