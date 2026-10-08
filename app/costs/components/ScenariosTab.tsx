"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, RefreshCw, Search, Layers, X, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import {
    getCostingScenarios,
    createCostingScenario,
    duplicateCostingScenario,
    deleteCostingScenario
} from "@/lib/api/costing";
import { listBoqs } from "@/lib/api/boqs";
import type { CostingScenario, Boq } from "@/lib/types";
import CostingMoreMenu from "@/components/costing/CostingMoreMenu";
import CostingFilterPopover from "@/components/costing/CostingFilterPopover";
import CostingPagination from "@/components/costing/CostingPagination";

export default function ScenariosTab() {
    const [scenarios, setScenarios] = useState<CostingScenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Toolbar & Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modal state for New Scenario
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newBoqId, setNewBoqId] = useState("");
    const [newType, setNewType] = useState("vendor_switch");
    const [boqsList, setBoqsList] = useState<Boq[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState("");

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getCostingScenarios();
            setScenarios(res.items || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load scenarios");
        } finally {
            setLoading(false);
        }
    };

    const loadBoqs = async () => {
        try {
            const res = await listBoqs({ pageSize: 50 });
            setBoqsList(res.items || []);
            if (res.items && res.items.length > 0 && !newBoqId) {
                setNewBoqId(res.items[0].id);
            }
        } catch {
            // Silently handle if BOQs list fails
        }
    };

    useEffect(() => {
        void loadData();
        void loadBoqs();
    }, []);

    // Filter scenarios
    const filteredScenarios = useMemo(() => {
        return scenarios.filter((s) => {
            const matchesSearch =
                !searchQuery ||
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.scenario_type && s.scenario_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (s.baseline && s.baseline.toLowerCase().includes(searchQuery.toLowerCase()));

            const currentStatus = (s.status || "ACTIVE").toLowerCase();
            const matchesStatus = statusFilter === "all" || currentStatus === statusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [scenarios, searchQuery, statusFilter]);

    // Paginate
    const paginatedScenarios = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredScenarios.slice(start, start + pageSize);
    }, [filteredScenarios, currentPage, pageSize]);

    // Formatting helpers
    const formatMoney = (val: number | null | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "-";
            return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        } catch {
            return "-";
        }
    };

    // Actions
    const handleDuplicate = async (id: string) => {
        try {
            await duplicateCostingScenario(id);
            await loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to duplicate scenario");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this scenario?")) return;
        try {
            await deleteCostingScenario(id);
            setScenarios((prev) => prev.filter((s) => s.id !== id));
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete scenario");
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(paginatedScenarios.map((s) => s.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleCreateScenario = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError("");

        if (!newTitle.trim()) {
            setModalError("Scenario title is required.");
            return;
        }

        if (!newBoqId && boqsList.length > 0) {
            setModalError("Please select a BOQ baseline.");
            return;
        }

        setIsSubmitting(true);
        try {
            await createCostingScenario({
                boqId: newBoqId,
                name: newTitle.trim(),
                scenarioType: newType,
                adjustments: []
            });
            setIsCreateModalOpen(false);
            setNewTitle("");
            await loadData();
        } catch (err) {
            setModalError(err instanceof Error ? err.message : "Failed to create scenario");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Toolbar matching Image 4 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            padding: "0 12px"
                        }}
                    >
                        <Search size={16} color="#6b7280" />
                        <input
                            placeholder="Search scenarios..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={{ border: "none", outline: "none", padding: "8px", fontSize: "14px", width: "240px" }}
                        />
                    </label>
                    <CostingFilterPopover
                        currentStatus={statusFilter}
                        onApply={({ status }) => {
                            setStatusFilter(status);
                            setCurrentPage(1);
                        }}
                        onReset={() => {
                            setStatusFilter("all");
                            setCurrentPage(1);
                        }}
                    />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={() => {
                            setModalError("");
                            setIsCreateModalOpen(true);
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            padding: "8px 18px",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "13px",
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(37,99,235,0.2)"
                        }}
                    >
                        <Plus size={16} /> New Item
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: "16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #fecaca" }}>
                    <span>{error}</span>
                    <button onClick={loadData} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            )}

            {/* Table Container matching Image 4 */}
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px", minWidth: "1050px" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                                <th style={{ padding: "14px 16px", width: "40px" }}>
                                    <input
                                        type="checkbox"
                                        checked={paginatedScenarios.length > 0 && selectedIds.size === paginatedScenarios.length}
                                        onChange={handleSelectAll}
                                        style={{ cursor: "pointer" }}
                                    />
                                </th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>SCENARIO</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>BASELINE</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>TYPE</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>TOTAL COST (₹)</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>SELLING VALUE (₹)</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>MARGIN</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>VARIANCE</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>STATUS</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>UPDATED ON</th>
                                <th style={{ padding: "14px 16px", width: "48px" }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                                        <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 8px", display: "block", color: "#3b82f6" }} />
                                        Loading scenarios...
                                    </td>
                                </tr>
                            ) : filteredScenarios.length === 0 ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
                                        <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>No scenarios found</div>
                                        <p style={{ margin: "0 0 16px 0", fontSize: "13.5px", color: "#94a3b8" }}>
                                            {searchQuery || statusFilter !== "all"
                                                ? "No scenarios match your search or filters."
                                                : "Create a scenario to simulate cost variations and vendor margin impacts."}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setIsCreateModalOpen(true)}
                                            style={{
                                                background: "#2563eb",
                                                color: "#ffffff",
                                                border: "none",
                                                padding: "9px 20px",
                                                borderRadius: "8px",
                                                fontWeight: 600,
                                                fontSize: "13.5px",
                                                cursor: "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}
                                        >
                                            <Plus size={16} /> Create Your First Scenario
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                paginatedScenarios.map((s) => {
                                    const isChecked = selectedIds.has(s.id);
                                    const totalCost = Number(s.totalCost ?? s.scenarioCost ?? s.baseCost ?? 0);
                                    const sellingValue = Number(s.sellingValue ?? (totalCost * 1.25));
                                    const margin = Number(s.margin ?? (sellingValue > 0 ? ((sellingValue - totalCost) / sellingValue) * 100 : 0));
                                    const variance = Number(s.variance ?? 0);
                                    const statusText = (s.status || "ACTIVE").toUpperCase();

                                    return (
                                        <tr
                                            key={s.id}
                                            style={{
                                                borderBottom: "1px solid #f1f5f9",
                                                backgroundColor: isChecked ? "#f8fafc" : "transparent",
                                                transition: "background 0.15s"
                                            }}
                                            className="hover:bg-slate-50"
                                        >
                                            <td style={{ padding: "14px 16px" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleSelectRow(s.id)}
                                                    style={{ cursor: "pointer" }}
                                                />
                                            </td>

                                            {/* Scenario Name */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "6px",
                                                            background: "#eff6ff",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            color: "#2563eb",
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        <Layers size={15} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: "#111827", fontSize: "14px" }}>
                                                            {s.name}
                                                        </div>
                                                        <div style={{ color: "#9ca3af", fontSize: "12px" }}>
                                                            {s.adjustments?.length || 0} adjustments
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Baseline */}
                                            <td style={{ padding: "14px 16px", color: "#475569" }}>
                                                {s.baseline || s.boqTitle || "Standard BOQ"}
                                            </td>

                                            {/* Type */}
                                            <td style={{ padding: "14px 16px", color: "#475569", textTransform: "capitalize" }}>
                                                {s.scenario_type ? s.scenario_type.replace(/_/g, " ") : "Standard"}
                                            </td>

                                            {/* Total Cost */}
                                            <td style={{ padding: "14px 16px", color: "#111827", fontWeight: 500 }}>
                                                ₹{formatMoney(totalCost)}
                                            </td>

                                            {/* Selling Value */}
                                            <td style={{ padding: "14px 16px", color: "#111827", fontWeight: 600 }}>
                                                ₹{formatMoney(sellingValue)}
                                            </td>

                                            {/* Margin */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <span
                                                    style={{
                                                        background: margin >= 20 ? "#ecfdf5" : "#fef3c7",
                                                        color: margin >= 20 ? "#10b981" : "#d97706",
                                                        padding: "3px 8px",
                                                        borderRadius: "10px",
                                                        fontSize: "12px",
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    {margin.toFixed(1)}%
                                                </span>
                                            </td>

                                            {/* Variance */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: variance <= 0 ? "#10b981" : "#ef4444", fontWeight: 600, fontSize: "13px" }}>
                                                    {variance <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                                    <span>{variance <= 0 ? `-${formatMoney(Math.abs(variance))}` : `+${formatMoney(variance)}`}</span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <span
                                                    style={{
                                                        background: statusText === "ACTIVE" || statusText === "APPLIED" ? "#ecfdf5" : "#f1f5f9",
                                                        color: statusText === "ACTIVE" || statusText === "APPLIED" ? "#10b981" : "#64748b",
                                                        padding: "3px 8px",
                                                        borderRadius: "12px",
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        letterSpacing: "0.04em",
                                                        textTransform: "uppercase"
                                                    }}
                                                >
                                                    {statusText}
                                                </span>
                                            </td>

                                            {/* Updated On */}
                                            <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>
                                                {formatDate(s.updated_at || s.created_at)}
                                            </td>

                                            {/* Action Menu */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <CostingMoreMenu
                                                    entityName="Scenario"
                                                    onDuplicate={() => handleDuplicate(s.id)}
                                                    onDelete={() => handleDelete(s.id)}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredScenarios.length > 0 && (
                    <CostingPagination
                        currentPage={currentPage}
                        totalPages={Math.max(1, Math.ceil(filteredScenarios.length / pageSize))}
                        totalItems={filteredScenarios.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setCurrentPage(1);
                        }}
                    />
                )}
            </div>

            {/* Create Scenario Modal */}
            {isCreateModalOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.45)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px"
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsCreateModalOpen(false);
                    }}
                >
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "16px",
                            width: "100%",
                            maxWidth: "520px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column"
                        }}
                    >
                        <div
                            style={{
                                padding: "20px 24px",
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between"
                            }}
                        >
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
                                    New Costing Scenario
                                </h3>
                                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                                    Model alternate material choices, bulk quotes, and margin variations
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    padding: "4px",
                                    cursor: "pointer",
                                    color: "#94a3b8"
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateScenario} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
                            {modalError && (
                                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                                    {modalError}
                                </div>
                            )}

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                                    Scenario Title <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Bulk Vendor Negotiation 2026"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "14px",
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                                    BOQ Baseline
                                </label>
                                <select
                                    value={newBoqId}
                                    onChange={(e) => setNewBoqId(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "14px",
                                        outline: "none",
                                        backgroundColor: "#fff",
                                        boxSizing: "border-box"
                                    }}
                                >
                                    {boqsList.length === 0 ? (
                                        <option value="">No BOQs available (standard library baseline)</option>
                                    ) : (
                                        boqsList.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.boqNumber || b.id}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                                    Scenario Type
                                </label>
                                <select
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "14px",
                                        outline: "none",
                                        backgroundColor: "#fff",
                                        boxSizing: "border-box"
                                    }}
                                >
                                    <option value="vendor_switch">Vendor Switch</option>
                                    <option value="bulk_discount">Bulk Discount</option>
                                    <option value="material_upgrade">Material Upgrade</option>
                                    <option value="cost_reduction">Cost Reduction</option>
                                    <option value="conservative">Conservative</option>
                                    <option value="optimistic">Optimistic</option>
                                </select>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    disabled={isSubmitting}
                                    style={{
                                        padding: "10px 18px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        background: "#fff",
                                        color: "#475569",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: "10px 22px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: "#2563eb",
                                        color: "#fff",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        cursor: isSubmitting ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px"
                                    }}
                                >
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    Create Scenario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
