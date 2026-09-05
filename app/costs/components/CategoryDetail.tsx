"use client";

import { ArrowLeft, ChevronDown, Filter, MoreHorizontal, Plus, Search } from "lucide-react";
import { useState } from "react";

type SubTab = "Overview" | "Sub Categories" | "Items" | "Pricing Defaults" | "Activity";

export default function CategoryDetail({ category, onBack }: { category: any; onBack: () => void }) {
    const [activeTab, setActiveTab] = useState<SubTab>("Overview");

    const tabs: SubTab[] = ["Overview", "Sub Categories", "Items", "Pricing Defaults", "Activity"];

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", cursor: "pointer", marginBottom: "24px" }} onClick={onBack}>
                <ArrowLeft size={16} /> Back to Categories
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#1f2d3d", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "#4b5563" }}>📁</span> {category.name}
                        </h2>
                        <span style={{ background: "#ecfdf5", color: "#10b981", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>{category.status}</span>
                    </div>
                    <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>Board and panel products used in interior construction and furniture manufacturing.</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer", color: "#1f2d3d" }}>Duplicate</button>
                    <button style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer", color: "#1f2d3d" }}>Edit Category</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
                    <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "8px" }}>Items</div>
                    <div style={{ fontSize: "24px", fontWeight: 600, color: "#1f2d3d", marginBottom: "8px" }}>{category.items ?? 0}</div>
                    <div style={{ color: "#2563eb", fontSize: "12px", fontWeight: 500 }}>View Items →</div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
                    <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "8px" }}>Sub-Categories</div>
                    <div style={{ fontSize: "24px", fontWeight: 600, color: "#1f2d3d", marginBottom: "8px" }}>{category.subCategories ?? 0}</div>
                    <div style={{ color: "#2563eb", fontSize: "12px", fontWeight: 500 }}>View Sub-Categories →</div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
                    <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "8px" }}>Category Code</div>
                    <div style={{ fontSize: "18px", fontWeight: 600, color: "#1f2d3d", marginBottom: "8px" }}>{category.code ?? "-"}</div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
                    <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "8px" }}>Status</div>
                    <div style={{ fontSize: "18px", fontWeight: 600, color: category.status === "ACTIVE" ? "#10b981" : "#6b7280", marginBottom: "8px" }}>{category.status}</div>
                </div>
            </div>

            {/* Sub Tabs */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div style={{ display: "flex", background: "#fff", padding: "4px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: "8px 24px",
                                background: activeTab === tab ? "#eff6ff" : "transparent",
                                color: activeTab === tab ? "#2563eb" : "#6b7280",
                                fontWeight: activeTab === tab ? 600 : 500,
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "14px"
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === "Sub Categories" && (
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", width: "40px", cursor: "pointer" }}>
                            <Search size={16} color="#4b5563" />
                        </button>
                        <button style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: "1px solid #e5e7eb", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer", color: "#1f2d3d" }}>
                            <Filter size={16} /> Filter
                        </button>
                        <button style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer", color: "#1f2d3d" }}>
                            Import Excel
                        </button>
                        <button style={{ display: "flex", alignItems: "center", gap: "8px", background: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer" }}>
                            <Plus size={16} /> Sub-Category
                        </button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div>
                {activeTab === "Overview" && <OverviewTab />}
                {activeTab === "Sub Categories" && <SubCategoriesTab />}
                {activeTab === "Pricing Defaults" && <PricingDefaultsTab />}
                {["Items", "Activity"].includes(activeTab) && (
                    <div style={{ textAlign: "center", padding: "64px", color: "#6b7280", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                        {activeTab} content here...
                    </div>
                )}
            </div>
        </div>
    );
}

function OverviewTab() {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                    <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: 600, letterSpacing: "1px", marginBottom: "24px", textTransform: "uppercase" }}>Category Information</div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div>
                            <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Category Name</div>
                            <div style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>Boards</div>
                        </div>
                        <div>
                            <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Category Code</div>
                            <div style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>MAT-BRD</div>
                        </div>
                        <div>
                            <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Parent Category</div>
                            <div style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>Materials</div>
                        </div>
                        <div>
                            <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Default Unit</div>
                            <div style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>Sheet</div>
                        </div>
                        <div>
                            <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Created On</div>
                            <div style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>12 Jul 2026</div>
                        </div>
                        <div>
                            <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Created By</div>
                            <div style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>Nikhil Oberoi</div>
                        </div>
                        <div>
                            <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Updated On</div>
                            <div style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>05 Aug 2026</div>
                        </div>
                        <div>
                            <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Updated By</div>
                            <div style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>Pradhyumn D</div>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Description</div>
                            <div style={{ color: "#1f2d3d", fontSize: "14px", lineHeight: "1.5" }}>Includes plywood, MDF, particle board, HDHMR, and other board materials used for furniture and interior works.</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                    <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: 600, letterSpacing: "1px", marginBottom: "24px", textTransform: "uppercase" }}>Hierarchy</div>
                    <div style={{ height: "100px", background: "#f9fafb", borderRadius: "8px", border: "1px dashed #e5e7eb" }}></div>
                </div>
                
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                    <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: 600, letterSpacing: "1px", marginBottom: "24px", textTransform: "uppercase" }}>Pricing Details</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#6b7280", fontSize: "14px" }}>Default Markup</span>
                            <span style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>22%</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#6b7280", fontSize: "14px" }}>Default Tax</span>
                            <span style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>GST 18%</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#6b7280", fontSize: "14px" }}>Default Wastage</span>
                            <span style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>5%</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#6b7280", fontSize: "14px" }}>Cost Code</span>
                            <span style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>MAT-BRD</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style={{ gridColumn: "2", gridRow: "1 / span 2" }}>
                 <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", height: "100%" }}>
                    <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: 600, letterSpacing: "1px", marginBottom: "24px", textTransform: "uppercase" }}>Recent Activity</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        {[
                            { title: "Markup Updated", desc: "From 20% to 22% by Pradhyumn", date: "05 Aug, 2026", time: "10:24 AM" },
                            { title: "Sub_Category Added", desc: "HDHMR Added by Sai Kiran", date: "05 Aug, 2026", time: "10:24 AM" },
                            { title: "Category Created", desc: "Boards created by Pradhyumn", date: "05 Aug, 2026", time: "10:24 AM" },
                            { title: "Category Created", desc: "Boards created by Pradhyumn", date: "05 Aug, 2026", time: "10:24 AM" },
                        ].map((act, i) => (
                            <div key={i} style={{ display: "flex", gap: "12px" }}>
                                <div style={{ width: "32px", height: "32px", background: "#f3f4f6", borderRadius: "50%", flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#1f2d3d" }}>{act.title}</div>
                                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{act.desc}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{act.date}</div>
                                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>{act.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SubCategoriesTab() {
    const subCategories = [
        { name: "Plywood", code: "MAT-BRD-PLY", items: 12, boqs: 9, projects: 4, status: "APPROVED", date: "5 Aug 2024" },
        { name: "MDF", code: "MAT-BRD-MDF", items: 8, boqs: 6, projects: 3, status: "APPROVED", date: "5 Aug 2024" },
        { name: "Particle Board", code: "MAT-BRD-PB", items: 4, boqs: 3, projects: 2, status: "APPROVED", date: "5 Aug 2024" },
    ];

    return (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                <thead>
                    <tr style={{ background: "#f9fafb", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                        <th style={{ padding: "16px", fontWeight: 600 }}>SUB-CATEGORY NAME</th>
                        <th style={{ padding: "16px", fontWeight: 600 }}>SUB-CATEGORY CODE</th>
                        <th style={{ padding: "16px", fontWeight: 600 }}>ITEMS</th>
                        <th style={{ padding: "16px", fontWeight: 600 }}>USED IN BOQS</th>
                        <th style={{ padding: "16px", fontWeight: 600 }}>USED IN PROJECTS</th>
                        <th style={{ padding: "16px", fontWeight: 600 }}>STATUS</th>
                        <th style={{ padding: "16px", fontWeight: 600 }}>UPDATED</th>
                        <th style={{ padding: "16px" }}></th>
                    </tr>
                </thead>
                <tbody>
                    {subCategories.map((sub, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "16px", color: "#1f2d3d", fontWeight: 500 }}>{sub.name}</td>
                            <td style={{ padding: "16px", color: "#4b5563" }}>{sub.code}</td>
                            <td style={{ padding: "16px", color: "#4b5563" }}>{sub.items}</td>
                            <td style={{ padding: "16px", color: "#4b5563" }}>{sub.boqs}</td>
                            <td style={{ padding: "16px", color: "#4b5563" }}>{sub.projects}</td>
                            <td style={{ padding: "16px" }}>
                                <span style={{ background: "#ecfdf5", color: "#10b981", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>{sub.status}</span>
                            </td>
                            <td style={{ padding: "16px", color: "#6b7280" }}>{sub.date}</td>
                            <td style={{ padding: "16px", color: "#9ca3af" }}><MoreHorizontal size={20} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderTop: "1px solid #e5e7eb" }}>
                <div style={{ color: "#6b7280", fontSize: "14px", fontWeight: 500 }}>Total Sub Categories: NA</div>
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
    );
}

function PricingDefaultsTab() {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: 600, letterSpacing: "1px", marginBottom: "24px", textTransform: "uppercase" }}>Pricing Defaults</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", background: "#f9fafb", padding: "24px", borderRadius: "8px" }}>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Default Markup</div>
                        <div style={{ color: "#1f2d3d", fontSize: "16px", fontWeight: 600 }}>22%</div>
                    </div>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Default Tax</div>
                        <div style={{ color: "#1f2d3d", fontSize: "16px", fontWeight: 600 }}>GST 18%</div>
                    </div>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Default Wastage</div>
                        <div style={{ color: "#1f2d3d", fontSize: "16px", fontWeight: 600 }}>5%</div>
                    </div>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Default Unit</div>
                        <div style={{ color: "#1f2d3d", fontSize: "16px", fontWeight: 600 }}>Sheet</div>
                    </div>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Transportation Included</div>
                        <div style={{ color: "#1f2d3d", fontSize: "16px", fontWeight: 600 }}>No</div>
                    </div>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Labour Included</div>
                        <div style={{ color: "#1f2d3d", fontSize: "16px", fontWeight: 600 }}>Yes</div>
                    </div>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Markup Type</div>
                        <div style={{ color: "#1f2d3d", fontSize: "16px", fontWeight: 600 }}>Percentage</div>
                    </div>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Tax Applied On</div>
                        <div style={{ color: "#1f2d3d", fontSize: "16px", fontWeight: 600 }}>Selling Price</div>
                    </div>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Cost Code</div>
                        <div style={{ color: "#1f2d3d", fontSize: "16px", fontWeight: 600 }}>MAT-BRD</div>
                    </div>
                    <div>
                        <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Rate Effected From</div>
                        <div style={{ color: "#1f2d3d", fontSize: "16px", fontWeight: 600 }}>05 Aug, 2026</div>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                    <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: 600, letterSpacing: "1px", marginBottom: "24px", textTransform: "uppercase" }}>Inherited From</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#6b7280", fontSize: "14px" }}>Parent Category</span>
                            <span style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>Materials</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#6b7280", fontSize: "14px" }}>Organisation Defaults</span>
                            <span style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>Org Default V2.3</span>
                        </div>
                    </div>
                </div>
                
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                    <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: 600, letterSpacing: "1px", marginBottom: "24px", textTransform: "uppercase" }}>Last Updated</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#6b7280", fontSize: "14px" }}>Updated On</span>
                            <span style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>12 Jun 2026</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#6b7280", fontSize: "14px" }}>Updated By</span>
                            <span style={{ color: "#1f2d3d", fontSize: "14px", fontWeight: 500 }}>Pradhyumn D</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
