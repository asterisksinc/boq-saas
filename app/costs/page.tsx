"use client";

import {
    ChevronDown,
    Plus,
    Search,
    SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import LibraryTab from "./components/LibraryTab";
import CategoriesTab from "./components/CategoriesTab";
import AnalysisTab from "./components/AnalysisTab";
import ScenariosTab from "./components/ScenariosTab";
import MarginsTab from "./components/MarginsTab";
import SettingsTab from "./components/SettingsTab";
import DashboardRail from "@/components/DashboardRail";

type MainTab = "Library" | "Categories" | "Analysis" | "Scenarios" | "Margins" | "Settings";

export default function CostsPage() {
    const [activeTab, setActiveTab] = useState<MainTab>("Library");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");
    const [isCategoryDetailActive, setIsCategoryDetailActive] = useState(false);

    const tabs: MainTab[] = ["Library", "Categories", "Analysis", "Scenarios", "Margins", "Settings"];

    return (
        <main className="fig-dashboard boq-dashboard">
            <div className="fig-dashboard-glow" />

            <DashboardRail />

            <div className="fig-dashboard-main">
                <header className="fig-dashboard-header">
                    <h1>Costing</h1>
                    <div className="fig-dashboard-header-actions">
                        <label className="fig-dashboard-search">
                            <img src="/assets/dashboard/dashboard-search.svg" alt="" />
                            <input placeholder="Search..." aria-label="Search" />
                        </label>
                        <button type="button" className="fig-dashboard-new">
                            <Plus size={20} />
                            <span>New</span>
                            <i />
                            <ChevronDown size={20} />
                        </button>
                        <button type="button" className="fig-dashboard-bell" aria-label="Notifications">
                            <img src="/assets/dashboard/dashboard-notifications.svg" alt="" />
                        </button>
                        <div className="fig-dashboard-avatar">BO</div>
                    </div>
                </header>

                <section className="costing-page-shell" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Page Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#1f2d3d", margin: "0 0 8px 0" }}>Costing Library</h2>
                            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Budget control | Vendor comparison | Variance analysis</p>
                        </div>
                        <div style={{ display: "flex", gap: "12px" }}>
                            {activeTab !== "Library" && <button type="button" className="boq-ghost-button" style={{ 
                                background: "#fff", 
                                border: "1px solid #e5e7eb", 
                                padding: "8px 16px", 
                                borderRadius: "8px", 
                                fontWeight: 500,
                                cursor: "pointer"
                            }}>
                                Import Excel
                            </button>}
                            {activeTab === "Library" && <button type="button" className="boq-ghost-button" style={{ 
                                background: "#fff", 
                                border: "1px solid #e5e7eb", 
                                padding: "8px 16px", 
                                borderRadius: "8px", 
                                fontWeight: 500,
                                cursor: "pointer"
                            }}>
                                Import Excel
                            </button>}
                        </div>
                    </div>

                    {/* Tabs Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: "16px" }}>
                        <div style={{ display: "flex", gap: "8px", background: "#fff", padding: "4px", borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: "8px 32px",
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

                        {/* Right Actions depending on active tab */}
                        {activeTab === "Library" && (
                            <div style={{ display: "flex", gap: "12px" }}>
                                <label style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "0 12px" }}>
                                    <Search size={16} color="#6b7280" />
                                    <input placeholder="Search category by name..." style={{ border: "none", outline: "none", padding: "8px", fontSize: "14px", width: "200px" }} />
                                </label>
                                <button style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", width: "40px", cursor: "pointer" }}>
                                    <SlidersHorizontal size={16} color="#4b5563" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddOpen(true)}
                                    style={{ display: "flex", alignItems: "center", gap: "8px", background: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer" }}
                                >
                                    <Plus size={16} /> New Item
                                </button>
                            </div>
                        )}
                        {activeTab === "Categories" && !isCategoryDetailActive && (
                            <div style={{ display: "flex", gap: "12px" }}>
                                <label style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "0 12px" }}>
                                    <Search size={16} color="#6b7280" />
                                    <input
                                        placeholder="Search category by name..."
                                        value={categorySearch}
                                        onChange={(e) => setCategorySearch(e.target.value)}
                                        style={{ border: "none", outline: "none", padding: "8px", fontSize: "14px", width: "200px" }}
                                    />
                                </label>
                                <button style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", width: "40px", cursor: "pointer" }}>
                                    <SlidersHorizontal size={16} color="#4b5563" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsNewCategoryOpen(true)}
                                    style={{ display: "flex", alignItems: "center", gap: "8px", background: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer" }}
                                >
                                    <Plus size={16} /> New Category
                                </button>
                            </div>
                        )}
                        {activeTab === "Analysis" && (
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: "1px solid #e5e7eb", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer" }}>
                                    <SlidersHorizontal size={16} /> Filter
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div className="costing-content-area" style={{ background: "transparent", minHeight: "500px" }}>
                        {activeTab === "Library" && <LibraryTab isAddOpen={isAddOpen} setIsAddOpen={setIsAddOpen} />}
                        {activeTab === "Categories" && (
                            <CategoriesTab
                                searchQuery={categorySearch}
                                isNewCategoryOpen={isNewCategoryOpen}
                                setIsNewCategoryOpen={setIsNewCategoryOpen}
                                onDetailViewChange={setIsCategoryDetailActive}
                            />
                        )}
                        {activeTab === "Analysis" && <AnalysisTab />}
                        {activeTab === "Scenarios" && <ScenariosTab />}
                        {activeTab === "Margins" && <MarginsTab onNavigateTab={setActiveTab} />}
                        {activeTab === "Settings" && <SettingsTab />}
                    </div>
                </section>
            </div>
        </main>
    );
}
