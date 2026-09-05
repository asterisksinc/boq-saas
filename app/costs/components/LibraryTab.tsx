"use client";

import { useState, useEffect } from "react";
import { ChevronDown, MoreHorizontal, Copy, Edit2, Trash2, UploadCloud, X, RefreshCw } from "lucide-react";
import { getCostingItems } from "@/lib/api/costing";
import type { CostingItemBackend } from "@/lib/types";

export default function LibraryTab() {
    const [isAddOpen, setIsAddOpen] = useState(false);
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

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    };

    return (
        <div style={{ position: "relative" }}>
            {error && (
                <div style={{ padding: "16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                    <span>{error}</span>
                    <button onClick={loadData} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            )}

            <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                    <thead>
                        <tr style={{ background: "#f9fafb", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                            <th style={{ padding: "16px", fontWeight: 600 }}>ITEM</th>
                            <th style={{ padding: "16px", fontWeight: 600 }}>TYPE</th>
                            <th style={{ padding: "16px", fontWeight: 600 }}>CATEGORY</th>
                            <th style={{ padding: "16px", fontWeight: 600 }}>UNIT</th>
                            <th style={{ padding: "16px", fontWeight: 600 }}>BASE COST (₹)</th>
                            <th style={{ padding: "16px", fontWeight: 600 }}>SELLING RATE (₹)</th>
                            <th style={{ padding: "16px", fontWeight: 600 }}>MARGIN</th>
                            <th style={{ padding: "16px", fontWeight: 600 }}>PREFERRED VENDOR</th>
                            <th style={{ padding: "16px", fontWeight: 600 }}>RATE STATUS</th>
                            <th style={{ padding: "16px", fontWeight: 600 }}>UPDATED</th>
                            <th style={{ padding: "16px" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={11} style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>Loading items...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={11} style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>No items found.</td></tr>
                        ) : items.map((item) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb", cursor: "pointer", transition: "background 0.2s" }} className="hover:bg-gray-50">
                                <td style={{ padding: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ width: "32px", height: "32px", background: "#f3f4f6", borderRadius: "4px" }} />
                                        <div>
                                            <div style={{ fontWeight: 500, color: "#1f2d3d" }}>{item.name}</div>
                                            <div style={{ color: "#9ca3af", fontSize: "12px" }}>{item.code}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: "16px" }}>
                                    <span style={{ background: item.status === "APPROVED" ? "#ecfdf5" : "#f3f4f6", color: item.status === "APPROVED" ? "#10b981" : "#4b5563", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
                                        {item.status}
                                    </span>
                                </td>
                                <td style={{ padding: "16px", color: "#4b5563" }}>{(item.category ?? item.category_id ?? "-").split(" > ").map((p: string, i: number) => <span key={i}>{i > 0 && <br />}<span style={{ color: i === 0 ? "#1f2d3d" : "#9ca3af" }}>{i > 0 && "> "}{p}</span></span>)}</td>
                                <td style={{ padding: "16px", color: "#4b5563" }}>{item.unit}</td>
                                <td style={{ padding: "16px", color: "#1f2d3d" }}>{formatMoney(item.baseCost ?? item.base_cost)}</td>
                                <td style={{ padding: "16px", color: "#1f2d3d" }}>{formatMoney(item.sellingRate ?? item.selling_rate)}</td>
                                <td style={{ padding: "16px", color: "#10b981" }}>{item.margin ?? (item.selling_rate > 0 ? `${(((item.selling_rate - item.base_cost) / item.selling_rate) * 100).toFixed(1)}%` : "-")}</td>
                                <td style={{ padding: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4b5563" }}>
                                        {(item.vendor ?? item.preferred_vendor ?? "-") !== "-" && <div style={{ width: "20px", height: "20px", background: "#e5e7eb", borderRadius: "50%" }} />}
                                        {item.vendor ?? item.preferred_vendor ?? "-"}
                                    </div>
                                </td>
                                <td style={{ padding: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#6b7280" }}>
                                        {item.rateStatus ?? item.rate_status ?? "-"} <ChevronDown size={14} />
                                    </div>
                                </td>
                                <td style={{ padding: "16px", color: "#6b7280" }}>{item.updatedAt ?? (item.updated_at ? new Date(item.updated_at).toLocaleDateString("en-IN") : "-")}</td>
                                <td style={{ padding: "16px", position: "relative" }}>
                                    <button 
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                                        onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === item.id ? null : item.id); }}
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>
                                    
                                    {activeDropdown === item.id && (
                                        <div style={{ position: "absolute", right: "20px", top: "40px", background: "#fff", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, width: "160px", border: "1px solid #e5e7eb" }}>
                                            <button style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#4b5563" }}>
                                                <Edit2 size={16} /> Edit Item
                                            </button>
                                            <button style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#4b5563" }}>
                                                <Copy size={16} /> Duplicate Item
                                            </button>
                                            <button style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#ef4444" }}>
                                                <Trash2 size={16} /> Delete Item
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* Pagination */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderTop: "1px solid #e5e7eb" }}>
                    <div style={{ color: "#6b7280", fontSize: "14px", fontWeight: 500 }}>Total Items: {items.length}</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", background: "#fff", color: "#9ca3af", cursor: "pointer" }}>&lt;</button>
                        {[1, 2, 3, 4, 5].map((p) => (
                            <button key={p} style={{ 
                                padding: "6px 12px", 
                                border: p === 1 ? "1px solid #2563eb" : "1px solid #e5e7eb", 
                                borderRadius: "6px", 
                                background: p === 1 ? "#eff6ff" : "#fff", 
                                color: p === 1 ? "#2563eb" : "#6b7280", 
                                cursor: "pointer",
                                fontWeight: p === 1 ? 600 : 400
                            }}>
                                {p}
                            </button>
                        ))}
                        <button style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", background: "#fff", color: "#6b7280", cursor: "pointer" }}>&gt;</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>
                        Show per Page:
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "6px 12px" }}>
                            10 <ChevronDown size={14} color="#6b7280" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Add New Item Modal / Slide Over */}
            <button onClick={() => setIsAddOpen(true)} style={{ position: "absolute", top: "-56px", right: "0", background: "transparent", width: "100px", height: "40px", zIndex: 1, border: "none", cursor: "pointer", opacity: 0 }}>Trigger modal</button>

            {isAddOpen && (
                <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)" }} onClick={() => setIsAddOpen(false)} />
                    <div style={{ position: "relative", width: "500px", background: "#f3f5f6", display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)" }}>
                        <div style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#1f2d3d" }}>Add Item</h3>
                            <button onClick={() => setIsAddOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={20} /></button>
                        </div>
                        
                        <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#1f2d3d", marginBottom: "8px" }}>Item Name <span style={{ color: "#ef4444" }}>*</span></label>
                                    <input placeholder="Enter Item Name" style={{ width: "100%", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "14px" }} />
                                </div>
                                
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#1f2d3d", marginBottom: "8px" }}>Item Image</label>
                                    <div style={{ border: "1px dashed #cbd5e1", borderRadius: "12px", padding: "32px", textAlign: "center", background: "#f8fafc", cursor: "pointer" }}>
                                        <div style={{ width: "48px", height: "48px", background: "#eff6ff", color: "#2563eb", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                            <UploadCloud size={24} />
                                        </div>
                                        <p style={{ margin: 0, color: "#1f2d3d", fontWeight: 500, fontSize: "14px" }}>Drag & Drop Your File Here</p>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#1f2d3d", marginBottom: "8px" }}>Category <span style={{ color: "#ef4444" }}>*</span></label>
                                    <div style={{ position: "relative" }}>
                                        <select style={{ width: "100%", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "14px", appearance: "none", color: "#6b7280" }}>
                                            <option>Select category</option>
                                        </select>
                                        <ChevronDown size={16} color="#6b7280" style={{ position: "absolute", right: "16px", top: "14px", pointerEvents: "none" }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#1f2d3d", marginBottom: "8px" }}>Unit <span style={{ color: "#ef4444" }}>*</span></label>
                                    <div style={{ position: "relative" }}>
                                        <select style={{ width: "100%", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "14px", appearance: "none", color: "#6b7280" }}>
                                            <option>Select Unit</option>
                                        </select>
                                        <ChevronDown size={16} color="#6b7280" style={{ position: "absolute", right: "16px", top: "14px", pointerEvents: "none" }} />
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#1f2d3d", marginBottom: "8px" }}>Base Cost (₹) <span style={{ color: "#ef4444" }}>*</span></label>
                                        <input placeholder="ex. 45,00,000" style={{ width: "100%", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "14px" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#1f2d3d", marginBottom: "8px" }}>Selling Rate</label>
                                        <input placeholder="ex. WoodCraft Studio" style={{ width: "100%", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "14px" }} />
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#1f2d3d", marginBottom: "8px" }}>Spec / Finish</label>
                                        <input placeholder="ex. Custom, 6x6.5ft" style={{ width: "100%", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "14px" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#1f2d3d", marginBottom: "8px" }}>Rate Status</label>
                                        <div style={{ position: "relative" }}>
                                            <select style={{ width: "100%", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "14px", appearance: "none", color: "#6b7280" }}>
                                                <option>Select Status</option>
                                            </select>
                                            <ChevronDown size={16} color="#6b7280" style={{ position: "absolute", right: "16px", top: "14px", pointerEvents: "none" }} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#1f2d3d", marginBottom: "8px" }}>Vendor <span style={{ color: "#ef4444" }}>*</span></label>
                                    <div style={{ position: "relative" }}>
                                        <select style={{ width: "100%", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "14px", appearance: "none", color: "#6b7280" }}>
                                            <option>ex. WoodCraft Studios</option>
                                        </select>
                                        <ChevronDown size={16} color="#6b7280" style={{ position: "absolute", right: "16px", top: "14px", pointerEvents: "none" }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#1f2d3d", marginBottom: "8px" }}>Description <span style={{ color: "#ef4444" }}>*</span></label>
                                    <textarea placeholder="ex. lorem ipsum dolor sit amet, consectetur adipiscing elit..." style={{ width: "100%", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "14px", minHeight: "100px", resize: "none" }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: "24px", background: "#fff", display: "flex", justifyContent: "space-between", borderTop: "1px solid #e5e7eb" }}>
                            <button onClick={() => setIsAddOpen(false)} style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "10px 24px", borderRadius: "8px", fontWeight: 500, color: "#1f2d3d", cursor: "pointer" }}>Cancel</button>
                            <button style={{ background: "#60a5fa", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: 500, cursor: "not-allowed" }}>Add</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
