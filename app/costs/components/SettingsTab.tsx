"use client";

import { useState, useEffect } from "react";
import {
    RefreshCw,
    Coins,
    Ruler,
    Hash,
    BookOpen,
    Layers,
    Percent,
    ShieldAlert,
    Trash2,
    Receipt,
    Truck,
    Users,
    KeyRound,
    Clock,
    Lock,
    FileText,
    ArrowUpDown,
    Boxes,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Info,
    Check
} from "lucide-react";
import { getCostingSettings } from "@/lib/api/costing";
import type { CostingSettingsResponse } from "@/lib/types";

type SidebarCategory = "ALL" | "FOUNDATION" | "PRICING" | "GOVERNANCE" | "DATA";

const SIDEBAR_NAV = [
    {
        group: "FOUNDATION",
        items: [
            { id: "currencies", label: "Currencies & FX", icon: Coins },
            { id: "units", label: "Units of Measurement", icon: Ruler },
            { id: "cost-codes", label: "Cost Codes", icon: Hash },
            { id: "base-library", label: "Base Library Defaults", icon: BookOpen },
            { id: "hierarchy", label: "Hierarchy Defaults", icon: Layers }
        ]
    },
    {
        group: "PRICING",
        items: [
            { id: "markup-rules", label: "Markup Rules", icon: Percent },
            { id: "margin-floors", label: "Margin Floors", icon: ShieldAlert },
            { id: "waste-factors", label: "Waste Factors", icon: Trash2 },
            { id: "tax-defaults", label: "Tax (GST) Defaults", icon: Receipt },
            { id: "freight", label: "Freight & Transport", icon: Truck },
            { id: "labour", label: "Labour & Overheads", icon: Users }
        ]
    },
    {
        group: "GOVERNANCE",
        items: [
            { id: "approval-thresholds", label: "Approval Thresholds", icon: KeyRound },
            { id: "rate-validity", label: "Rate Validity & Expiry", icon: Clock },
            { id: "price-lock", label: "Price Lock Rules", icon: Lock },
            { id: "audit-log", label: "Audit Log", icon: FileText }
        ]
    },
    {
        group: "DATA",
        items: [
            { id: "bulk-io", label: "Bulk Import / Export", icon: ArrowUpDown },
            { id: "sync", label: "Sync & Integrations", icon: Boxes }
        ]
    }
];

export default function SettingsTab() {
    const [data, setData] = useState<CostingSettingsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<SidebarCategory>("ALL");
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getCostingSettings();
            setData(res);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load costing settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "64px", color: "#6b7280", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px auto", color: "#2563eb" }} />
                <div style={{ fontWeight: 500, color: "#1f2d3d" }}>Loading Costing Settings & Governance...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ padding: "16px 20px", background: "#fef2f2", color: "#b91c1c", borderRadius: "10px", border: "1px solid #fecaca", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <AlertCircle size={20} />
                    <span>{error || "Unable to load settings data"}</span>
                </div>
                <button
                    onClick={loadData}
                    style={{ background: "#fff", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "6px", padding: "6px 14px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                >
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );
    }

    const health = data.health;
    const cards = data.cards || [];
    const recentChanges = data.recentChanges || [];

    // Filter overview cards if category is selected
    const filteredCards = selectedCategory === "ALL"
        ? cards
        : cards.filter((c) => {
            const group = SIDEBAR_NAV.find((g) => g.group === selectedCategory);
            return group?.items.some((item) => item.label.toLowerCase() === c.title.toLowerCase() || c.id === item.id);
        });

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "-";
            return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
        } catch {
            return "-";
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Page Header */}
            <div>
                <h3 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>
                    Costing Configuration & Governance
                </h3>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
                    Configure defaults, pricing formulas, governance rules, and sync preferences across your organisation.
                </p>
            </div>

            {/* Configuration Health Section matching Image 5 */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "16px" }}>
                    CONFIGURATION HEALTH
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px" }}>
                    {/* 1. Completeness */}
                    <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: "26px", fontWeight: 800, color: "#10b981", letterSpacing: "-0.5px" }}>
                            {health.completenessPercent}%
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginTop: "4px" }}>
                            Completeness
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            {health.completenessPercent >= 80 ? "Healthy configuration" : "Setup in progress"}
                        </div>
                    </div>

                    {/* 2. Active Rules */}
                    <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: "26px", fontWeight: 800, color: "#2563eb", letterSpacing: "-0.5px" }}>
                            {health.activePricingRules ?? 0}
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginTop: "4px" }}>
                            Active Rules
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            Active pricing rules
                        </div>
                    </div>

                    {/* 3. Missing Defaults */}
                    <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: "26px", fontWeight: 800, color: (health.missingCategoryDefaults || 0) > 0 ? "#f59e0b" : "#10b981", letterSpacing: "-0.5px" }}>
                            {health.missingCategoryDefaults ?? 0}
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginTop: "4px" }}>
                            Missing Defaults
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            Categories needing setup
                        </div>
                    </div>

                    {/* 4. Expiring Tax Rules */}
                    <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: "26px", fontWeight: 800, color: (health.expiringTaxRules || 0) > 0 ? "#ef4444" : "#10b981", letterSpacing: "-0.5px" }}>
                            {health.expiringTaxRules ?? 0}
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginTop: "4px" }}>
                            Expiring Tax Rules
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            Within next 30 days
                        </div>
                    </div>

                    {/* 5. Pending Approvals */}
                    <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: "26px", fontWeight: 800, color: (health.pendingApprovals || 0) > 0 ? "#f59e0b" : "#10b981", letterSpacing: "-0.5px" }}>
                            {health.pendingApprovals ?? 0}
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginTop: "4px" }}>
                            Pending Approvals
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            Awaiting sign-off
                        </div>
                    </div>

                    {/* 6. Unmapped Cost Codes */}
                    <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: "26px", fontWeight: 800, color: (health.unmappedCostCodes || 0) > 0 ? "#f59e0b" : "#10b981", letterSpacing: "-0.5px" }}>
                            {health.unmappedCostCodes ?? 0}
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginTop: "4px" }}>
                            Unmapped Codes
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            Unmapped cost codes
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Layout: Left Sidebar + Right Center Grid & Context Panels */}
            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "24px", alignItems: "flex-start" }}>
                {/* ── Left Sidebar Navigation ── */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCategory("ALL");
                            setSelectedItemId(null);
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "8px 12px",
                            background: selectedCategory === "ALL" ? "#eff6ff" : "transparent",
                            color: selectedCategory === "ALL" ? "#2563eb" : "#334155",
                            fontWeight: selectedCategory === "ALL" ? 600 : 500,
                            fontSize: "13px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left"
                        }}
                    >
                        <span>All Settings ({cards.length})</span>
                    </button>

                    {SIDEBAR_NAV.map((grp) => (
                        <div key={grp.group} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div
                                onClick={() => {
                                    setSelectedCategory(grp.group as SidebarCategory);
                                    setSelectedItemId(null);
                                }}
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: selectedCategory === grp.group ? "#2563eb" : "#94a3b8",
                                    letterSpacing: "0.05em",
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    textTransform: "uppercase"
                                }}
                            >
                                {grp.group}
                            </div>
                            {grp.items.map((item) => {
                                const Icon = item.icon;
                                const isSelected = selectedItemId === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCategory(grp.group as SidebarCategory);
                                            setSelectedItemId(item.id);
                                        }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "7px 10px",
                                            borderRadius: "6px",
                                            border: "none",
                                            background: isSelected ? "#eff6ff" : "transparent",
                                            color: isSelected ? "#2563eb" : "#475569",
                                            fontWeight: isSelected ? 600 : 400,
                                            fontSize: "12.5px",
                                            cursor: "pointer",
                                            textAlign: "left"
                                        }}
                                        className="hover:bg-slate-50"
                                    >
                                        <Icon size={14} color={isSelected ? "#2563eb" : "#64748b"} />
                                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* ── Right Content Area ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Settings Overview Cards Grid */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#0f172a" }}>
                                Settings Overview {selectedCategory !== "ALL" && `— ${selectedCategory}`}
                            </h4>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                                Showing {filteredCards.length} of {cards.length} modules
                            </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                            {filteredCards.map((card) => {
                                const isConfigured = card.status === "CONFIGURED";
                                return (
                                    <div
                                        key={card.id}
                                        style={{
                                            background: "#fff",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "10px",
                                            padding: "18px 20px",
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                            gap: "12px"
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                                                <h5 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                                                    {card.title}
                                                </h5>
                                                <span
                                                    style={{
                                                        background: isConfigured ? "#ecfdf5" : "#fef3c7",
                                                        color: isConfigured ? "#10b981" : "#d97706",
                                                        padding: "2px 8px",
                                                        borderRadius: "10px",
                                                        fontSize: "10px",
                                                        fontWeight: 700,
                                                        letterSpacing: "0.04em"
                                                    }}
                                                >
                                                    {card.status}
                                                </span>
                                            </div>
                                            <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: "#64748b", lineHeight: "1.4" }}>
                                                {card.description}
                                            </p>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f8fafc", paddingTop: "10px" }}>
                                            <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                                                {card.subtitle || "Standard Baseline"}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    alert(`Opening ${card.title} configuration`);
                                                }}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "#2563eb",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    padding: 0,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                }}
                                                className="hover:underline"
                                            >
                                                Configure &rarr;
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Scope & Configuration Precedence & Recent Changes */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {/* Active Scope */}
                        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "14px" }}>
                                ACTIVE SCOPE
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#1e293b" }}>Global Defaults</span>
                                    <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>Active</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "13px", color: "#64748b" }}>Project Overrides</span>
                                    <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600 }}>Active in 4 projects</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "13px", color: "#64748b" }}>Client Overrides</span>
                                    <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600 }}>2 client rate cards</span>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Precedence */}
                        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "14px" }}>
                                CONFIGURATION PRECEDENCE
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {[
                                    "1. Item-level Override",
                                    "2. Category Defaults",
                                    "3. Scenario Rules",
                                    "4. Project Defaults",
                                    "5. Client Rate Card",
                                    "6. Global Baseline"
                                ].map((step, idx) => (
                                    <div key={idx} style={{ fontSize: "12.5px", color: idx === 0 ? "#2563eb" : "#475569", fontWeight: idx === 0 ? 600 : 400, display: "flex", alignItems: "center", gap: "6px" }}>
                                        {step}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Changes Section */}
                    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "16px" }}>
                            RECENT CONFIGURATION CHANGES
                        </div>
                        {recentChanges.length === 0 ? (
                            <div style={{ color: "#9ca3af", fontSize: "13px", textAlign: "center", padding: "16px" }}>
                                No recent changes recorded in audit logs.
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {recentChanges.map((chg) => (
                                    <div key={chg.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px" }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "13px" }}>
                                                {chg.action}
                                            </div>
                                            <div style={{ color: "#64748b", fontSize: "12px" }}>
                                                {chg.details} &bull; by {chg.user || "Admin"}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                                            {formatDate(chg.timestamp)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
