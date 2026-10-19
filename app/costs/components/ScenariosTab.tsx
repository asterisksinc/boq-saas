"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, RefreshCw, X, Loader2, Check, Minus } from "lucide-react";
import {
    getCostingScenarios,
    createCostingScenario,
    duplicateCostingScenario,
    deleteCostingScenario,
} from "@/lib/api/costing";
import { listBoqs } from "@/lib/api/boqs";
import type { CostingScenario, Boq } from "@/lib/types";
import { formatFullCurrency, formatScenarioDate, formatScenarioVariance } from "@/lib/costing-format";
import CostingMoreMenu from "@/components/costing/CostingMoreMenu";
import CostingPagination from "@/components/costing/CostingPagination";

interface ScenariosTabProps {
    statusFilter?: string;
    onStatusFilterChange?: (status: string) => void;
    searchQuery?: string;
    onSearchQueryChange?: (query: string) => void;
    isNewScenarioOpen?: boolean;
    setIsNewScenarioOpen?: (open: boolean) => void;
}

export default function ScenariosTab({
    statusFilter: propStatusFilter,
    onStatusFilterChange,
    searchQuery: propSearchQuery,
    onSearchQueryChange,
    isNewScenarioOpen: propIsNewScenarioOpen,
    setIsNewScenarioOpen: propSetIsNewScenarioOpen,
}: ScenariosTabProps = {}) {
    const [scenarios, setScenarios] = useState<CostingScenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fallback internal filter state if not passed from parent
    const [internalSearchQuery, setInternalSearchQuery] = useState("");
    const [internalStatusFilter, setInternalStatusFilter] = useState("all");
    const [internalIsNewScenarioOpen, setInternalIsNewScenarioOpen] = useState(false);

    const searchQuery = propSearchQuery ?? internalSearchQuery;
    const statusFilter = propStatusFilter ?? internalStatusFilter;
    const isCreateModalOpen = propIsNewScenarioOpen ?? internalIsNewScenarioOpen;

    const setIsCreateModalOpen = (open: boolean) => {
        if (propSetIsNewScenarioOpen) {
            propSetIsNewScenarioOpen(open);
        } else {
            setInternalIsNewScenarioOpen(open);
        }
    };

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modal state for New Scenario
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
                (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (s.scenario_type && s.scenario_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (s.baseline && s.baseline.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (s.projectName && s.projectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (s.boqNumber && s.boqNumber.toLowerCase().includes(searchQuery.toLowerCase()));

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

    // Header checkbox states
    const isAllCurrentSelected =
        paginatedScenarios.length > 0 && paginatedScenarios.every((s) => selectedIds.has(s.id));
    const isSomeCurrentSelected =
        paginatedScenarios.some((s) => selectedIds.has(s.id)) && !isAllCurrentSelected;

    const handleToggleSelectAll = () => {
        if (isAllCurrentSelected) {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                paginatedScenarios.forEach((s) => next.delete(s.id));
                return next;
            });
        } else {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                paginatedScenarios.forEach((s) => next.add(s.id));
                return next;
            });
        }
    };

    const handleToggleSelectRow = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
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
                adjustments: [],
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

    // Helper to format scenario type text
    const formatTypeText = (typeStr?: string) => {
        if (!typeStr) return "Full Cost";
        return typeStr
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
            {error && (
                <div
                    style={{
                        padding: "14px 18px",
                        background: "#FEF2F2",
                        color: "#B91C1C",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid #FECACA",
                        fontFamily: "'Urbanist', sans-serif",
                        fontSize: "14px",
                    }}
                >
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={loadData}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#B91C1C",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontWeight: 600,
                        }}
                    >
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            )}

            {/* Main Scenarios Card (Frame 2147225072) */}
            <div className="costing-scenarios-card">
                <div className="costing-scenarios-table-wrapper">
                    <table className="costing-scenarios-table">
                        <thead>
                            <tr className="costing-scenarios-table-header">
                                {/* 1. Checkbox (Component 16, 40px) */}
                                <th className="costing-scenarios-th costing-col-sc-check">
                                    <button
                                        type="button"
                                        onClick={handleToggleSelectAll}
                                        aria-label="Select all scenarios"
                                        className={`costing-scenarios-checkbox-btn ${
                                            isAllCurrentSelected
                                                ? "is-checked"
                                                : isSomeCurrentSelected
                                                ? "is-indeterminate"
                                                : ""
                                        }`}
                                    >
                                        {isAllCurrentSelected && <Check size={12} strokeWidth={3} />}
                                        {isSomeCurrentSelected && <Minus size={12} strokeWidth={3} />}
                                    </button>
                                </th>

                                {/* 2. SCENARIO (Component 5, 241px) */}
                                <th className="costing-scenarios-th costing-col-sc-name">SCENARIO</th>

                                {/* 3. BASELINE (Component 25, 165px) */}
                                <th className="costing-scenarios-th costing-col-sc-baseline">BASELINE</th>

                                {/* 4. TYPE (Component 18, 88px) */}
                                <th className="costing-scenarios-th costing-col-sc-type">TYPE</th>

                                {/* 5. TOTAL COST (₹) (Component 11, 129px) */}
                                <th className="costing-scenarios-th costing-col-sc-cost">TOTAL COST (₹)</th>

                                {/* 6. SELLING VALUE (₹) (Component 26, 153px) */}
                                <th className="costing-scenarios-th costing-col-sc-selling">SELLING VALUE (₹)</th>

                                {/* 7. MARGIN (Component 20, 88px) */}
                                <th className="costing-scenarios-th costing-col-sc-margin">MARGIN</th>

                                {/* 8. VARIANCE (Component 24, 112px) */}
                                <th className="costing-scenarios-th costing-col-sc-variance">VARIANCE</th>

                                {/* 9. STATUS (Component 10, 91px) */}
                                <th className="costing-scenarios-th costing-col-sc-status">STATUS</th>

                                {/* 10. UPDATED ON (Component 17, 125px) */}
                                <th className="costing-scenarios-th costing-col-sc-updated">UPDATED ON</th>

                                {/* 11. Actions (Component 12, 64px) */}
                                <th className="costing-scenarios-th costing-col-sc-actions"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: "center", padding: "48px 16px", color: "#64748B" }}>
                                        <RefreshCw
                                            size={24}
                                            className="animate-spin"
                                            style={{ margin: "0 auto 8px", display: "block", color: "#2563EB" }}
                                        />
                                        <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: "14px" }}>
                                            Loading scenarios...
                                        </span>
                                    </td>
                                </tr>
                            ) : filteredScenarios.length === 0 ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: "center", padding: "48px 24px", color: "#64748B" }}>
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: 600,
                                                color: "#0F172A",
                                                marginBottom: "6px",
                                                fontFamily: "'Urbanist', sans-serif",
                                            }}
                                        >
                                            No scenarios found
                                        </div>
                                        <p
                                            style={{
                                                margin: "0 0 16px 0",
                                                fontSize: "13.5px",
                                                color: "#64748B",
                                                fontFamily: "'Urbanist', sans-serif",
                                            }}
                                        >
                                            {searchQuery || statusFilter !== "all"
                                                ? "No scenarios match your search or filters."
                                                : "Create a scenario to simulate cost variations and margin impacts."}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setIsCreateModalOpen(true)}
                                            className="costing-new-item-btn"
                                            style={{ display: "inline-flex", margin: "0 auto" }}
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
                                    const variancePercent = s.variancePercent !== undefined ? Number(s.variancePercent) : undefined;
                                    const statusText = (s.status || "ACTIVE").toUpperCase();

                                    // Status pill badge class
                                    const statusClass =
                                        statusText === "ACTIVE"
                                            ? "status-active"
                                            : statusText === "APPLIED"
                                            ? "status-applied"
                                            : statusText === "QUOTED"
                                            ? "status-quoted"
                                            : "status-draft";

                                    // Baseline display text
                                    const projectName = s.projectName || (s.baseline ? s.baseline.split("·")[0]?.trim() : "Kohinoor Office");
                                    const boqCodeVersion = s.boqNumber
                                        ? `${s.boqNumber} • ${s.boqVersion || "v1"}`
                                        : "BOQ-8871 • v7";

                                    return (
                                        <tr
                                            key={s.id}
                                            className={`costing-scenarios-row ${isChecked ? "is-selected" : ""}`}
                                        >
                                            {/* 1. Checkbox */}
                                            <td className="costing-scenarios-td costing-col-sc-check">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleSelectRow(s.id)}
                                                    aria-label={`Select ${s.name}`}
                                                    className={`costing-scenarios-checkbox-btn ${
                                                        isChecked ? "is-checked" : ""
                                                    }`}
                                                >
                                                    {isChecked && <Check size={12} strokeWidth={3} />}
                                                </button>
                                            </td>

                                            {/* 2. Scenario Name & Description */}
                                            <td className="costing-scenarios-td costing-col-sc-name">
                                                <div className="costing-sc-name-title">{s.name}</div>
                                                <div className="costing-sc-name-desc">
                                                    {s.description ||
                                                        (s.adjustments && s.adjustments.length > 0
                                                            ? `${s.adjustments.length} adjustment${
                                                                  s.adjustments.length > 1 ? "s" : ""
                                                              }`
                                                            : "Baseline scenario")}
                                                </div>
                                            </td>

                                            {/* 3. Baseline */}
                                            <td className="costing-scenarios-td costing-col-sc-baseline">
                                                <div className="costing-sc-baseline-proj">{projectName}</div>
                                                <div className="costing-sc-baseline-boq">{boqCodeVersion}</div>
                                            </td>

                                            {/* 4. Type */}
                                            <td className="costing-scenarios-td costing-col-sc-type">
                                                <span className="costing-sc-type-badge">
                                                    {formatTypeText(s.scenario_type)}
                                                </span>
                                            </td>

                                            {/* 5. Total Cost (₹) */}
                                            <td className="costing-scenarios-td costing-col-sc-cost">
                                                <span className="costing-sc-value-text">
                                                    {formatFullCurrency(totalCost)}
                                                </span>
                                            </td>

                                            {/* 6. Selling Value (₹) */}
                                            <td className="costing-scenarios-td costing-col-sc-selling">
                                                <span className="costing-sc-value-text">
                                                    {formatFullCurrency(sellingValue)}
                                                </span>
                                            </td>

                                            {/* 7. Margin */}
                                            <td className="costing-scenarios-td costing-col-sc-margin">
                                                <span className="costing-sc-margin-text">
                                                    {margin.toFixed(1)}%
                                                </span>
                                            </td>

                                            {/* 8. Variance */}
                                            <td className="costing-scenarios-td costing-col-sc-variance">
                                                <span
                                                    className={`costing-sc-variance-text ${
                                                        variance <= 0 ? "is-favorable" : "is-unfavorable"
                                                    }`}
                                                >
                                                    {formatScenarioVariance(variance, variancePercent)}
                                                </span>
                                            </td>

                                            {/* 9. Status */}
                                            <td className="costing-scenarios-td costing-col-sc-status">
                                                <span className={`costing-sc-status-badge ${statusClass}`}>
                                                    {statusText}
                                                </span>
                                            </td>

                                            {/* 10. Updated On */}
                                            <td className="costing-scenarios-td costing-col-sc-updated">
                                                <span className="costing-sc-updated-text">
                                                    {formatScenarioDate(s.updated_at || s.created_at)}
                                                </span>
                                            </td>

                                            {/* 11. Actions */}
                                            <td className="costing-scenarios-td costing-col-sc-actions">
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
                        padding: "20px",
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
                            flexDirection: "column",
                        }}
                    >
                        <div
                            style={{
                                padding: "20px 24px",
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div>
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: "18px",
                                        fontWeight: 700,
                                        color: "#0f172a",
                                        fontFamily: "'Urbanist', sans-serif",
                                    }}
                                >
                                    New Costing Scenario
                                </h3>
                                <p
                                    style={{
                                        margin: "4px 0 0 0",
                                        fontSize: "13px",
                                        color: "#64748b",
                                        fontFamily: "'Urbanist', sans-serif",
                                    }}
                                >
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
                                    color: "#94a3b8",
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateScenario}
                            style={{
                                padding: "24px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "18px",
                            }}
                        >
                            {modalError && (
                                <div
                                    style={{
                                        background: "#fef2f2",
                                        border: "1px solid #fecaca",
                                        color: "#b91c1c",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontFamily: "'Urbanist', sans-serif",
                                    }}
                                >
                                    {modalError}
                                </div>
                            )}

                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#334155",
                                        marginBottom: "6px",
                                        fontFamily: "'Urbanist', sans-serif",
                                    }}
                                >
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
                                        boxSizing: "border-box",
                                        fontFamily: "'Urbanist', sans-serif",
                                    }}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#334155",
                                        marginBottom: "6px",
                                        fontFamily: "'Urbanist', sans-serif",
                                    }}
                                >
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
                                        boxSizing: "border-box",
                                        fontFamily: "'Urbanist', sans-serif",
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
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#334155",
                                        marginBottom: "6px",
                                        fontFamily: "'Urbanist', sans-serif",
                                    }}
                                >
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
                                        boxSizing: "border-box",
                                        fontFamily: "'Urbanist', sans-serif",
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
                                        cursor: "pointer",
                                        fontFamily: "'Urbanist', sans-serif",
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
                                        gap: "8px",
                                        fontFamily: "'Urbanist', sans-serif",
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
