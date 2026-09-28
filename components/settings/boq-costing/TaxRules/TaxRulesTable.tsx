"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MoreHorizontal, Plus } from "lucide-react";
import { BoqTaxRule } from "@/lib/settings/types";
import TaxRuleModal from "./TaxRuleModal";
import DeleteConfirmModal from "../DeleteConfirmModal";

interface TaxRulesTableProps {
    taxRules: BoqTaxRule[];
    canEdit: boolean;
    onSaveTaxRule: (ruleData: Omit<BoqTaxRule, "id"> & { id?: string }) => Promise<void>;
    onToggleActive: (ruleId: string, active: boolean) => Promise<void>;
    onDeleteTaxRule: (ruleId: string) => Promise<void>;
    showNotice: (message: string, type?: "success" | "error") => void;
}

export default function TaxRulesTable({
    taxRules,
    canEdit,
    onSaveTaxRule,
    onToggleActive,
    onDeleteTaxRule,
    showNotice,
}: TaxRulesTableProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingRule, setEditingRule] = useState<BoqTaxRule | null>(null);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<BoqTaxRule | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Toggle loading state
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
            showNotice("You do not have permission to add tax rules.", "error");
            return;
        }
        setModalMode("create");
        setEditingRule(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (rule: BoqTaxRule) => {
        if (!canEdit) {
            showNotice("You do not have permission to edit tax rules.", "error");
            return;
        }
        setOpenMenuId(null);
        setModalMode("edit");
        setEditingRule(rule);
        setModalOpen(true);
    };

    const handleToggle = async (rule: BoqTaxRule) => {
        if (!canEdit) {
            showNotice("You do not have permission to modify tax rules.", "error");
            return;
        }
        setOpenMenuId(null);
        setTogglingId(rule.id);
        try {
            await onToggleActive(rule.id, !rule.active);
            showNotice(
                `Tax rule ${rule.name} ${!rule.active ? "enabled" : "disabled"}.`,
                "success"
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to toggle tax rule.";
            showNotice(msg, "error");
        } finally {
            setTogglingId(null);
        }
    };

    const handleOpenDelete = (rule: BoqTaxRule) => {
        if (!canEdit) {
            showNotice("You do not have permission to delete tax rules.", "error");
            return;
        }
        setOpenMenuId(null);
        setRuleToDelete(rule);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!ruleToDelete) return;
        setDeleting(true);
        try {
            await onDeleteTaxRule(ruleToDelete.id);
            showNotice(`Tax rule "${ruleToDelete.name}" deleted.`, "success");
            setDeleteModalOpen(false);
            setRuleToDelete(null);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to delete tax rule.";
            showNotice(msg, "error");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="boq-content-card">
            {/* Header: Tax Rules + Add Tax Rule */}
            <div className="boq-card-header">
                <h2 className="boq-card-title">Tax Rules</h2>
                <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="boq-btn-primary"
                    disabled={!canEdit}
                >
                    <Plus size={16} aria-hidden="true" />
                    <span>Add Tax Rule</span>
                </button>
            </div>

            {/* Empty State */}
            {taxRules.length === 0 ? (
                <div className="boq-empty-state">
                    <h4>No tax rules configured</h4>
                    <p>Create your first tax rule to apply standard tax rates to BOQ line items.</p>
                    <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="boq-btn-primary"
                        disabled={!canEdit}
                        style={{ marginTop: "14px" }}
                    >
                        <Plus size={16} aria-hidden="true" />
                        <span>Add Tax Rule</span>
                    </button>
                </div>
            ) : (
                /* Table matching Screenshot 4 */
                <div className="boq-table-wrapper" ref={menuRef}>
                    <table className="boq-table" aria-label="Tax rules list">
                        <thead>
                            <tr>
                                <th scope="col" style={{ width: "24%" }}>RULE NAME</th>
                                <th scope="col" style={{ width: "16%" }}>CODE</th>
                                <th scope="col" style={{ width: "16%" }}>RATE</th>
                                <th scope="col" style={{ width: "18%" }}>INCLUSIVE</th>
                                <th scope="col" style={{ width: "16%" }}>STATUS</th>
                                <th scope="col" style={{ width: "10%", textAlign: "right" }} aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {taxRules.map((rule) => {
                                const isMenuOpen = openMenuId === rule.id;
                                const isToggling = togglingId === rule.id;

                                return (
                                    <tr key={rule.id} className="boq-table-row">
                                        <td className="boq-table-cell-name">
                                            <span>{rule.name}</span>
                                        </td>
                                        <td className="boq-table-cell-code">
                                            <span>{rule.code}</span>
                                        </td>
                                        <td className="boq-table-cell-rate">
                                            <span>{rule.rate}%</span>
                                        </td>
                                        <td className="boq-table-cell-inclusive">
                                            <span>{rule.inclusive ? "Inclusive" : "Exclusive"}</span>
                                        </td>
                                        <td className="boq-table-cell-active">
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={rule.active}
                                                aria-label={`Toggle status for ${rule.name}`}
                                                className={`boq-toggle ${rule.active ? "is-active" : ""}`}
                                                onClick={() => handleToggle(rule)}
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
                                                aria-label={`Actions for ${rule.name}`}
                                                aria-expanded={isMenuOpen}
                                                onClick={() => setOpenMenuId(isMenuOpen ? null : rule.id)}
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
                                                        onClick={() => handleOpenEdit(rule)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="boq-dropdown-item"
                                                        onClick={() => handleToggle(rule)}
                                                    >
                                                        {rule.active ? "Disable" : "Enable"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="boq-dropdown-item is-danger"
                                                        onClick={() => handleOpenDelete(rule)}
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

            {/* Add / Edit Tax Rule Modal */}
            <TaxRuleModal
                isOpen={modalOpen}
                mode={modalMode}
                initialRule={editingRule}
                existingRules={taxRules}
                onClose={() => {
                    setModalOpen(false);
                    setEditingRule(null);
                }}
                onSave={onSaveTaxRule}
                showNotice={showNotice}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                title="Delete Tax Rule"
                itemName={ruleToDelete?.name || ""}
                description="This tax rule will no longer be available for tax calculations."
                deleting={deleting}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setRuleToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
