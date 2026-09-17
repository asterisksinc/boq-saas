"use client";

import { useState, useEffect } from "react";
import { ChevronDown, MoreHorizontal, Copy, Edit2, Trash2, Plus, RefreshCw } from "lucide-react";
import { getCostingItems } from "@/lib/api/costing";
import type { CostingItemBackend } from "@/lib/types";
import AddItemModal from "./AddItemModal";

interface LibraryTabProps {
    isAddOpen?: boolean;
    setIsAddOpen?: (open: boolean) => void;
}

export default function LibraryTab({ isAddOpen, setIsAddOpen }: LibraryTabProps) {
    const [internalAddOpen, setInternalAddOpen] = useState(false);
    const showAddModal = isAddOpen !== undefined ? isAddOpen : internalAddOpen;
    const setShowAddModal = setIsAddOpen || setInternalAddOpen;

    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [items, setItems] = useState<CostingItemBackend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getCostingItems();
            setItems(res.items);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load items");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const formatMoney = (val: number | null | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    const existingVendors = Array.from(
        new Set(
            items
                .map((i) => i.preferredVendor || i.vendor || i.preferred_vendor)
                .filter(Boolean) as string[]
        )
    );

    return (
        <div style={{ position: "relative" }}>
            {error && (
                <div style={{ padding: "16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "10px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #fecaca" }}>
                    <span>{error}</span>
                    <button onClick={loadData} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            )}

            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px", minWidth: "900px" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "12px", letterSpacing: "0.05em" }}>ITEM</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "12px", letterSpacing: "0.05em" }}>TYPE</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "12px", letterSpacing: "0.05em" }}>CATEGORY</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "12px", letterSpacing: "0.05em" }}>UNIT</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "12px", letterSpacing: "0.05em" }}>BASE COST (₹)</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "12px", letterSpacing: "0.05em" }}>SELLING RATE (₹)</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "12px", letterSpacing: "0.05em" }}>MARGIN</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "12px", letterSpacing: "0.05em" }}>PREFERRED VENDOR</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "12px", letterSpacing: "0.05em" }}>RATE STATUS</th>
                                <th style={{ padding: "14px 16px", fontWeight: 600, fontSize: "12px", letterSpacing: "0.05em" }}>UPDATED</th>
                                <th style={{ padding: "14px 16px" }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                                        <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 8px", display: "block", color: "#3b82f6" }} />
                                        Loading items...
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
                                        <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "6px" }}>No items found in library</div>
                                        <p style={{ margin: "0 0 16px 0", fontSize: "13.5px", color: "#94a3b8" }}>Get started by adding materials, furniture, or custom costing items.</p>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(true)}
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
                                                gap: "6px",
                                            }}
                                        >
                                            <Plus size={16} /> Add Your First Item
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => {
                                    const base = Number(item.baseCost ?? item.base_cost ?? 0);
                                    const selling = Number(item.sellingRate ?? item.selling_rate ?? 0);
                                    const marginVal = item.marginPercent ?? (selling > 0 ? ((selling - base) / selling) * 100 : 0);
                                    const vendorName = item.preferredVendor || item.vendor || item.preferred_vendor || "-";
                                    const statusLabel = (item.rateStatus || item.rate_status || "active").toUpperCase();
                                    const itemImage = item.imageUrl || item.image_url;

                                    return (
                                        <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }} className="hover:bg-gray-50">
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    {itemImage ? (
                                                        <img
                                                            src={itemImage}
                                                            alt=""
                                                            style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: "36px", height: "36px", background: "#eff6ff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", fontWeight: 700, fontSize: "13px" }}>
                                                            {item.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>{item.name}</div>
                                                        <div style={{ color: "#94a3b8", fontSize: "12px" }}>{item.code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <span style={{
                                                    background: statusLabel === "ACTIVE" || statusLabel === "APPROVED" ? "#ecfdf5" : "#f1f5f9",
                                                    color: statusLabel === "ACTIVE" || statusLabel === "APPROVED" ? "#10b981" : "#475569",
                                                    padding: "4px 10px",
                                                    borderRadius: "12px",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    display: "inline-block",
                                                }}>
                                                    {statusLabel === "ACTIVE" ? "APPROVED" : statusLabel}
                                                </span>
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#334155" }}>
                                                {(item.category ?? item.category_id ?? "-").split(" > ").map((p: string, i: number) => (
                                                    <span key={i}>
                                                        {i > 0 && <br />}
                                                        <span style={{ color: i === 0 ? "#0f172a" : "#64748b", fontWeight: i === 0 ? 500 : 400, fontSize: i === 0 ? "13.5px" : "12px" }}>
                                                            {i > 0 && "> "}{p}
                                                        </span>
                                                    </span>
                                                ))}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#475569" }}>{item.unit}</td>
                                            <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 500 }}>{formatMoney(base)}</td>
                                            <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 500 }}>{formatMoney(selling)}</td>
                                            <td style={{ padding: "14px 16px", color: marginVal >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                                                {marginVal.toFixed(1)}%
                                            </td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                                                    {vendorName !== "-" && (
                                                        <div style={{ width: "22px", height: "22px", background: "#e2e8f0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                                                            {vendorName.slice(0, 1).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span>{vendorName}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#64748b", fontSize: "13px" }}>
                                                    <span style={{ textTransform: "capitalize" }}>{item.rateStatus || item.rate_status || "Active"}</span>
                                                    <ChevronDown size={14} />
                                                </div>
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>
                                                {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("en-IN") : item.updated_at ? new Date(item.updated_at).toLocaleDateString("en-IN") : "-"}
                                            </td>
                                            <td style={{ padding: "14px 16px", position: "relative" }}>
                                                <button
                                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px", borderRadius: "4px" }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === item.id ? null : item.id);
                                                    }}
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>

                                                {activeDropdown === item.id && (
                                                    <div style={{ position: "absolute", right: "20px", top: "40px", background: "#fff", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.12)", zIndex: 10, width: "160px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                                                        <button style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155", fontSize: "13.5px" }}>
                                                            <Edit2 size={15} /> Edit Item
                                                        </button>
                                                        <button style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155", fontSize: "13.5px" }}>
                                                            <Copy size={15} /> Duplicate Item
                                                        </button>
                                                        <button style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#ef4444", fontSize: "13.5px" }}>
                                                            <Trash2 size={15} /> Delete Item
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ color: "#64748b", fontSize: "13.5px", fontWeight: 500 }}>Total Items: {items.length}</div>
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#fff", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}>&lt;</button>
                        {[1, 2, 3, 4, 5].map((p) => (
                            <button
                                key={p}
                                style={{
                                    padding: "5px 11px",
                                    border: p === 1 ? "1px solid #2563eb" : "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    background: p === 1 ? "#eff6ff" : "#fff",
                                    color: p === 1 ? "#2563eb" : "#64748b",
                                    cursor: "pointer",
                                    fontWeight: p === 1 ? 700 : 500,
                                    fontSize: "13px",
                                }}
                            >
                                {p}
                            </button>
                        ))}
                        <button style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: "13px" }}>&gt;</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a", fontSize: "13.5px", fontWeight: 500 }}>
                        Show per Page:
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "5px 10px", background: "#fff" }}>
                            10 <ChevronDown size={14} color="#64748b" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Dedicated Add Item Modal Matching Figma Design */}
            <AddItemModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={(newItem) => {
                    setItems((prev) => [newItem, ...prev]);
                    void loadData();
                }}
                existingVendors={existingVendors}
            />
        </div>
    );
}
