"use client";

import {
    Plus,
    Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import LibraryTab from "./components/LibraryTab";
import CategoriesTab from "./components/CategoriesTab";
import AnalysisTab from "./components/AnalysisTab";
import ScenariosTab from "./components/ScenariosTab";
import MarginsTab from "./components/MarginsTab";
import SettingsTab from "./components/SettingsTab";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import CostingExcelImportModal from "@/components/costing/CostingExcelImportModal";
import "./costing-redesign.css";

type MainTab = "Library" | "Categories" | "Analysis" | "Scenarios" | "Margins" | "Settings";

export default function CostsPage() {
    const [activeTab, setActiveTab] = useState<MainTab>("Library");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
    const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");
    const [isCategoryDetailActive, setIsCategoryDetailActive] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const sp = new URLSearchParams(window.location.search);
            if (sp.get("create") === "true" || sp.get("new") === "true") {
                setActiveTab("Library");
                setIsAddOpen(true);
            }
        }
    }, []);

    const tabs: MainTab[] = ["Library", "Categories", "Analysis", "Scenarios", "Margins", "Settings"];

    const handleTabChange = (tab: MainTab) => {
        setActiveTab(tab);
        setIsCategoryDetailActive(false);
    };

    return (
        <main className="fig-dashboard costing-dashboard">
            <div className="fig-dashboard-glow costing-bg-gradient-overlay" />

            <DashboardRail />

            <div className="fig-dashboard-main" style={{ position: "relative" }}>
                {/* Dashboard top header - preserves dashboard layout */}
                <DashboardHeader title="Costing" />

                <section className="costing-page-shell" style={{ padding: "0 0 24px 0" }}>
                    {/* Top-level Costing heading row and tabs: ONLY rendered when not inside Category Detail */}
                    {!isCategoryDetailActive && (
                        <>
                            {/* Page Heading Row (Frame 2147225066) */}
                            <div className="costing-heading-row">
                                <div className="costing-title-group">
                                    <h1 className="costing-main-heading">Costing Library</h1>
                                    <p className="costing-subheading">Budget control | Vendor comparison | Variance analysis</p>
                                </div>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsExcelImportOpen(true)}
                                        className="costing-import-excel-btn"
                                    >
                                        Import Excel
                                    </button>
                                </div>
                            </div>

                            {/* Navigation Tabs (Frame 2147225076) */}
                            <div className="costing-tabs-toolbar-row">
                                <div className="costing-tabs-container" role="tablist">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab}
                                            role="tab"
                                            aria-selected={activeTab === tab}
                                            onClick={() => handleTabChange(tab)}
                                            className={`costing-tab-btn ${activeTab === tab ? "is-active" : ""}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Right Actions for Categories tab */}
                                {activeTab === "Categories" && (
                                    <div className="costing-toolbar-group">
                                        <div className="costing-search-box">
                                            <div className="costing-search-icon-tile">
                                                <Search size={16} color="#475569" />
                                            </div>
                                            <input
                                                placeholder="Search category by name…"
                                                value={categorySearch}
                                                onChange={(e) => setCategorySearch(e.target.value)}
                                                className="costing-search-input"
                                                aria-label="Search categories"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsNewCategoryOpen(true)}
                                            className="costing-new-item-btn"
                                        >
                                            <Plus size={18} /> New Category
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

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

            {/* Global Excel Import Modal */}
            <CostingExcelImportModal
                isOpen={isExcelImportOpen}
                onClose={() => setIsExcelImportOpen(false)}
                onSuccess={() => {
                    if (typeof window !== "undefined") {
                        window.location.reload();
                    }
                }}
            />
        </main>
    );
}
