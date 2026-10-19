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
import AddItemModal from "./components/AddItemModal";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import CostingExcelImportModal from "@/components/costing/CostingExcelImportModal";
import CostingFilterPopover, { type FilterOption } from "@/components/costing/CostingFilterPopover";
import "./costing-redesign.css";

type MainTab = "Library" | "Categories" | "Analysis" | "Scenarios" | "Margins" | "Settings";

export default function CostsPage() {
    const [activeTab, setActiveTab] = useState<MainTab>("Library");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
    const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");
    const [isCategoryDetailActive, setIsCategoryDetailActive] = useState(false);

    // Analysis filter states
    const [analysisProjectFilter, setAnalysisProjectFilter] = useState("all");
    const [analysisCategoryFilter, setAnalysisCategoryFilter] = useState("all");
    const [analysisProjectOptions, setAnalysisProjectOptions] = useState<FilterOption[]>([]);
    const [analysisCategoryOptions, setAnalysisCategoryOptions] = useState<FilterOption[]>([]);

    // Scenarios filter & action states
    const [scenarioStatusFilter, setScenarioStatusFilter] = useState("all");
    const [scenarioSearchQuery, setScenarioSearchQuery] = useState("");
    const [isNewScenarioOpen, setIsNewScenarioOpen] = useState(false);

    // Margins filter states
    const [marginsProjectFilter, setMarginsProjectFilter] = useState("all");
    const [marginsCategoryFilter, setMarginsCategoryFilter] = useState("all");
    const [marginsProjectOptions, setMarginsProjectOptions] = useState<FilterOption[]>([]);
    const [marginsCategoryOptions, setMarginsCategoryOptions] = useState<FilterOption[]>([]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const sp = new URLSearchParams(window.location.search);
            const tabParam = sp.get("tab");
            if (tabParam) {
                const matched = tabs.find(t => t.toLowerCase() === tabParam.toLowerCase());
                if (matched) setActiveTab(matched);
            }
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
                                    <button
                                        type="button"
                                        onClick={() => setIsAddOpen(true)}
                                        className="costing-new-item-btn"
                                    >
                                        <Plus size={18} /> New Item
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

                                {/* Right Actions for Analysis tab: Filter Button (Figma Frame 109) */}
                                {activeTab === "Analysis" && (
                                    <div className="costing-toolbar-group">
                                        <CostingFilterPopover
                                            showLabel={true}
                                            title="Filter Analysis"
                                            projectFilter={analysisProjectFilter}
                                            projectOptions={analysisProjectOptions}
                                            onProjectChange={setAnalysisProjectFilter}
                                            categoryFilter={analysisCategoryFilter}
                                            categoryOptions={analysisCategoryOptions}
                                            onCategoryChange={setAnalysisCategoryFilter}
                                            onReset={() => {
                                                setAnalysisProjectFilter("all");
                                                setAnalysisCategoryFilter("all");
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Right Actions for Scenarios tab: Filter Button (Figma Frame 109), Search & New Scenario */}
                                {activeTab === "Scenarios" && (
                                    <div className="costing-toolbar-group">
                                        <div className="costing-search-box">
                                            <div className="costing-search-icon-tile">
                                                <Search size={16} color="#475569" />
                                            </div>
                                            <input
                                                placeholder="Search scenarios…"
                                                value={scenarioSearchQuery}
                                                onChange={(e) => setScenarioSearchQuery(e.target.value)}
                                                className="costing-search-input"
                                                aria-label="Search scenarios"
                                            />
                                        </div>
                                        <CostingFilterPopover
                                            showLabel={true}
                                            title="Filter Scenarios"
                                            currentStatus={scenarioStatusFilter}
                                            statusFilter={scenarioStatusFilter}
                                            onStatusChange={setScenarioStatusFilter}
                                            statusOptions={[
                                                { label: "All Statuses", value: "all" },
                                                { label: "Active", value: "active" },
                                                { label: "Quoted", value: "quoted" },
                                                { label: "Applied", value: "applied" },
                                                { label: "Draft", value: "draft" },
                                            ]}
                                            onReset={() => setScenarioStatusFilter("all")}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsNewScenarioOpen(true)}
                                            className="costing-new-item-btn"
                                        >
                                            <Plus size={18} /> New Scenario
                                        </button>
                                    </div>
                                )}

                                {/* Right Actions for Margins tab: Filter Button (Figma Frame 109) */}
                                {activeTab === "Margins" && (
                                    <div className="costing-toolbar-group">
                                        <CostingFilterPopover
                                            showLabel={true}
                                            title="Filter Margins"
                                            projectFilter={marginsProjectFilter}
                                            projectOptions={marginsProjectOptions}
                                            onProjectChange={setMarginsProjectFilter}
                                            categoryFilter={marginsCategoryFilter}
                                            categoryOptions={marginsCategoryOptions}
                                            onCategoryChange={setMarginsCategoryFilter}
                                            onReset={() => {
                                                setMarginsProjectFilter("all");
                                                setMarginsCategoryFilter("all");
                                            }}
                                        />
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
                        {activeTab === "Analysis" && (
                            <AnalysisTab
                                selectedProjectId={analysisProjectFilter}
                                onProjectChange={setAnalysisProjectFilter}
                                selectedCategory={analysisCategoryFilter}
                                onCategoryChange={setAnalysisCategoryFilter}
                                onFilterOptionsLoaded={(projects, categories) => {
                                    setAnalysisProjectOptions(projects);
                                    setAnalysisCategoryOptions(categories);
                                }}
                            />
                        )}
                        {activeTab === "Scenarios" && (
                            <ScenariosTab
                                statusFilter={scenarioStatusFilter}
                                onStatusFilterChange={setScenarioStatusFilter}
                                searchQuery={scenarioSearchQuery}
                                onSearchQueryChange={setScenarioSearchQuery}
                                isNewScenarioOpen={isNewScenarioOpen}
                                setIsNewScenarioOpen={setIsNewScenarioOpen}
                            />
                        )}
                        {activeTab === "Margins" && (
                            <MarginsTab
                                onNavigateTab={handleTabChange}
                                projectFilter={marginsProjectFilter}
                                categoryFilter={marginsCategoryFilter}
                                onFilterOptionsLoaded={(projects, categories) => {
                                    setMarginsProjectOptions(projects);
                                    setMarginsCategoryOptions(categories);
                                }}
                            />
                        )}
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

            {/* Global Add Item Modal (rendered only when not on Library tab to prevent duplicate drawer mounting) */}
            {activeTab !== "Library" && (
                <AddItemModal
                    isOpen={isAddOpen}
                    onClose={() => setIsAddOpen(false)}
                    onSuccess={() => {
                        setIsAddOpen(false);
                        if (typeof window !== "undefined") {
                            window.location.reload();
                        }
                    }}
                />
            )}
        </main>
    );
}
