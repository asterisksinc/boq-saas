"use client";

import { useState, useEffect } from "react";
import CategoryDetail from "./CategoryDetail";
import { Plus, RefreshCw } from "lucide-react";
import { CostingCategory, getCostingCategories } from "@/lib/api/costing";

export default function CategoriesTab() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [categories, setCategories] = useState<CostingCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getCostingCategories();
            setCategories(res.items);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    if (selectedCategory) {
        const category = categories.find(c => c.id === selectedCategory) || categories[0];
        return <CategoryDetail category={category} onBack={() => setSelectedCategory(null)} />;
    }

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#1f2d3d" }}>Categories</h3>
                <button style={{ display: "flex", alignItems: "center", gap: "8px", background: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer" }}>
                    <Plus size={16} /> New Category
                </button>
            </div>
            
            {error && (
                <div style={{ padding: "16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                    <span>{error}</span>
                    <button onClick={loadData} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>Loading categories...</div>
            ) : categories.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>No categories found.</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
                    {categories.map(cat => (
                        <div 
                            key={cat.id} 
                            onClick={() => setSelectedCategory(cat.id)}
                            style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", cursor: "pointer", transition: "box-shadow 0.2s" }}
                            className="hover:shadow-md"
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1f2d3d" }}>{cat.name}</h4>
                                <span style={{ background: cat.status === "ACTIVE" ? "#ecfdf5" : "#f3f4f6", color: cat.status === "ACTIVE" ? "#10b981" : "#4b5563", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>{cat.status}</span>
                            </div>
                            <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>{cat.code}</div>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Items</div>
                                    <div style={{ fontWeight: 600, color: "#1f2d3d", fontSize: "16px" }}>{cat.items}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Sub-Categories</div>
                                    <div style={{ fontWeight: 600, color: "#1f2d3d", fontSize: "16px" }}>{cat.subCategories}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
