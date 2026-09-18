"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  Play,
  Plus,
  Search,
  X,
  MoreHorizontal,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  Share2,
  Layers,
  Check,
  ExternalLink,
  RefreshCw,
  Eye,
  Trash2,
  ArrowUpRight,
  GripVertical,
  Building,
  Percent,
  DollarSign,
  Info,
  Folder,
  Sliders,
  CheckSquare,
  Clock,
  ShieldCheck,
  Award,
  Settings
} from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardRail from "@/components/DashboardRail";

type BoqItem = {
  id?: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  rateBasis?: string;
  rate: number;
  wastePercent: number;
  taxPercent: number;
  amount: number;
};

type BoqCategory = {
  id?: string;
  name: string;
  itemsCount?: number;
  cost?: string;
  items?: BoqItem[];
};

type BoqRoomSection = {
  id?: string;
  name: string;
  itemsCount?: number;
  cost?: string;
  categories?: BoqCategory[];
};

type BoqTemplateDetailData = {
  id: string;
  templateCode: string;
  name: string;
  description: string;
  category: string;
  projectType: string;
  status: string;
  version: string;
  usedIn: string;
  tags: string[];
  useCount: number;
  sections: number;
  categories: number;
  items: number;
  costMapping: number;
  indicativeBaseCost: string;
  baseCostAmount: number;
  readiness: number;
  updatedAt: string;
  commercialSummary: {
    material: { amount: number; percent: number };
    labour: { amount: number; percent: number };
    transport: { amount: number; percent: number };
    other: { amount: number; percent: number };
    indicativeCost: number;
  };
  commercialDefaults: {
    currency: string;
    taxProfile: string;
    taxPercent: number;
    defaultWastage: number;
    defaultMarkup: number;
    rounding: string;
  };
  costingHealth: {
    mapped: number;
    outdated: number;
    reviewRequired: number;
    missing: number;
    rateFreshness: { current: number; reviewSoon: number; outdated: number };
  };
  usageDependencies: {
    projectTemplatesCount: number;
    activeProjectsCount: number;
    draftTemplatesCount: number;
    dependencies: { name: string; status: string }[];
  };
  attentionRequired: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  versionGovernance: {
    version: string;
    status: string;
    publishedDate: string;
    changes: { type: string; text: string }[];
  };
  recentActivity: {
    action: string;
    date: string;
    detail: string;
    type: string;
  }[];
  rooms?: BoqRoomSection[];
};

const tabs = ["Overview", "BOQ Structure", "Costing", "Rules", "Usage", "Versions", "Activity"];

export default function BoqTemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [template, setTemplate] = useState<BoqTemplateDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  // BOQ Structure state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ "Master Bedroom": true });
  const [selectedSection, setSelectedSection] = useState<string>("Master Bedroom");
  const [selectedCategory, setSelectedCategory] = useState<string>("Furniture");
  const [structureSearch, setStructureSearch] = useState("");
  const [useModalOpen, setUseModalOpen] = useState(false);
  const [addItemModal, setAddItemModal] = useState(false);
  const [addSectionModal, setAddSectionModal] = useState(false);

  // Item Inspector state (BOQ Structure tab)
  const [selectedItem, setSelectedItem] = useState<BoqItem | null>(null);
  const [inspectorTab, setInspectorTab] = useState<string>("General");

  // Rules tab state
  const [ruleFilter, setRuleFilter] = useState<string>("All Rules");
  const [rulesSearch, setRulesSearch] = useState("");
  const [selectedRule, setSelectedRule] = useState<Record<string, unknown> | null>(null);
  const [ruleInspTab, setRuleInspTab] = useState<string>("Overview");

  // Usage tab state
  const [usageSearch, setUsageSearch] = useState("");

  // Costing tab state
  const [costingSearch, setCostingSearch] = useState("");

  // Versions tab state
  const [versionFilter, setVersionFilter] = useState<string>("All Versions");
  const [versionsSearch, setVersionsSearch] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<Record<string, unknown> | null>(null);
  const [myChangesOnly, setMyChangesOnly] = useState(false);

  // Activity tab state
  const [activityFilter, setActivityFilter] = useState<string>("All");
  const [activitySearch, setActivitySearch] = useState("");

  useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/v1/boq-templates/${id}`, { credentials: "include" });
        const b = await r.json();
        if (!r.ok) {
          throw new Error(b.message || "Failed to load BOQ template details.");
        }
        setTemplate(b.data);
      } catch (e) {
        setNotice(e instanceof Error ? e.message : "Error loading template details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTemplate();
  }, [id]);

  // Current selected category items
  const currentCategoryData = useMemo(() => {
    if (!template?.rooms) return null;
    const room = template.rooms.find(r => r.name === selectedSection);
    if (!room || !room.categories) return null;
    const cat = room.categories.find(c => c.name === selectedCategory) || room.categories[0];
    return { room, cat, items: cat?.items || [] };
  }, [template, selectedSection, selectedCategory]);

  const toggleSectionExpand = (sectionName: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const handleSelectCategory = (sectionName: string, categoryName: string) => {
    setSelectedSection(sectionName);
    setSelectedCategory(categoryName);
  };

  if (loading) {
    return (
      <main className="fig-dashboard boq-dashboard">
        <div className="fig-dashboard-glow" />
        <DashboardRail />
        <div className="fig-dashboard-main" style={{ padding: 40, color: "#64748b" }}>
          Loading BOQ template...
        </div>
      </main>
    );
  }

  if (!template) {
    return (
      <main className="fig-dashboard boq-dashboard">
        <div className="fig-dashboard-glow" />
        <DashboardRail />
        <div className="fig-dashboard-main" style={{ padding: 40 }}>
          <div style={{ color: "#ef4444", marginBottom: 12 }}>BOQ Template not found.</div>
          <button className="primary" onClick={() => router.push("/templates")}>Back to Templates</button>
        </div>
      </main>
    );
  }

  return (
    <main className="fig-dashboard boq-dashboard">
      <div className="fig-dashboard-glow" />
      <DashboardRail />
      <div className="fig-dashboard-main">
        {/* Top bar */}
        <header className="fig-dashboard-header">
          <h1>Templates</h1>
          <div className="fig-dashboard-header-actions">
            <label className="fig-dashboard-search">
              <img src="/assets/dashboard/dashboard-search.svg" alt="" />
              <input placeholder="Search..." />
            </label>
            <button className="fig-dashboard-new" onClick={() => setUseModalOpen(true)}>
              <Plus size={19} /><span>New</span><i /><ChevronDown size={18} />
            </button>
            <button className="fig-dashboard-bell" aria-label="Notifications">
              <img src="/assets/dashboard/dashboard-notifications.svg" alt="" />
            </button>
            <div className="fig-dashboard-avatar">BO</div>
          </div>
        </header>

        <div className="boq-page-shell boq-detail-container">
          {/* Breadcrumb */}
          <div className="boq-detail-back-link" onClick={() => router.push("/templates")}>
            <ArrowLeft size={16} /> BOQ Templates
          </div>

          {/* Header row */}
          <div className="boq-detail-header-row">
            <div className="boq-detail-title-group">
              <h1>{template.name}</h1>
              <div className="boq-detail-meta-line">
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{template.templateCode}</span>
                <span>·</span>
                <span>{template.projectType}</span>
                <span>·</span>
                <span>Interior Design</span>
                <span>·</span>
                <span>Premium</span>
              </div>
              <p className="boq-detail-desc">{template.description}</p>
            </div>

            <div className="boq-detail-header-actions">
              <button 
                className="boq-detail-icon-btn" 
                title="Duplicate"
                onClick={() => setNotice("Template duplicated successfully.")}
              >
                <Copy size={16} />
              </button>
              <button 
                className="boq-detail-icon-btn" 
                title="Edit"
                onClick={() => setNotice("Edit mode activated.")}
              >
                <Edit3 size={16} />
              </button>
              <button 
                className="boq-detail-use-btn"
                onClick={() => setUseModalOpen(true)}
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="boq-detail-tabs">
            {tabs.map(t => (
              <button
                key={t}
                className={`boq-detail-tab-btn ${activeTab === t ? "active" : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* =========================================================================
              TAB 1: OVERVIEW (Screen 4)
             ========================================================================= */}
          {activeTab === "Overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* 4 Top Metric Cards */}
              <div className="boq-metric-cards-4">
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Sections</span>
                  <div className="boq-mcard-val">{template.sections}</div>
                  <span className="boq-mcard-sub">Organised Structure</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Line Items</span>
                  <div className="boq-mcard-val">{template.items}</div>
                  <span className="boq-mcard-sub">Total Items</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Indicative Base Cost</span>
                  <div className="boq-mcard-val accent">{template.indicativeBaseCost}</div>
                  <span className="boq-mcard-sub">Current Library Rates</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Rate Mapping</span>
                  <div className="boq-mcard-val blue">{template.costMapping}%</div>
                  <span className="boq-mcard-sub">Mapped to Library</span>
                </div>
              </div>

              {/* Middle Row: Readiness, Commercial Summary, Commercial Defaults */}
              <div className="boq-overview-row-3">
                {/* 1. BOQ Readiness */}
                <div className="boq-panel-card">
                  <div className="boq-panel-head">
                    <h3>BOQ Readiness</h3>
                  </div>
                  <div className="boq-readiness-content">
                    <div className="boq-donut-score">
                      <div className="boq-donut-inner">
                        <span className="boq-donut-num">{template.readiness}</span>
                        <span className="boq-donut-total">/ 100</span>
                      </div>
                    </div>
                    <div className="boq-readiness-checks">
                      <div className="boq-check-item" style={{ color: "#059669" }}>
                        <CheckCircle2 size={15} /> <span>Structure Complete</span>
                      </div>
                      <div className="boq-check-item" style={{ color: "#059669" }}>
                        <CheckCircle2 size={15} /> <span>18/18 Sections Configured</span>
                      </div>
                      <div className="boq-check-item" style={{ color: "#059669" }}>
                        <CheckCircle2 size={15} /> <span>Units Configured</span>
                      </div>
                      <div className="boq-check-item" style={{ color: "#059669" }}>
                        <CheckCircle2 size={15} /> <span>Commercial Defaults Configured</span>
                      </div>
                      <div className="boq-check-item" style={{ color: "#d97706" }}>
                        <AlertTriangle size={15} /> <span>5 Automated Rate references</span>
                      </div>
                      <div className="boq-check-item" style={{ color: "#d97706" }}>
                        <AlertTriangle size={15} /> <span>3 items require review</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 12, marginTop: "auto", fontSize: 12 }}>
                    <span style={{ color: "#64748b" }}>Ready with minor warnings.</span>
                    <a href="#" className="boq-panel-link" onClick={e => { e.preventDefault(); setActiveTab("Rules"); }}>View Validation →</a>
                  </div>
                </div>

                {/* 2. Commercial Summary */}
                <div className="boq-panel-card">
                  <div className="boq-panel-head">
                    <h3>Commercial Summary</h3>
                    <span className="boq-panel-link" onClick={() => setActiveTab("Costing")}>View Costing →</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Base Cost</span>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>₹28,60,000</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#2563eb" }} /> Material
                        </span>
                        <b>₹21,40,000 (75%)</b>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#10b981" }} /> Labour
                        </span>
                        <b>₹4,82,000 (16.9%)</b>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#06b6d4" }} /> Transport
                        </span>
                        <b>₹98,000 (3.4%)</b>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#f59e0b" }} /> Other
                        </span>
                        <b>₹1,40,000 (4.9%)</b>
                      </div>
                    </div>
                    {/* SVG Donut */}
                    <div style={{ width: 90, height: 90, flexShrink: 0 }}>
                      <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#2563eb" strokeWidth="6" strokeDasharray="66 100" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray="15 100" strokeDashoffset="-66" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#06b6d4" strokeWidth="6" strokeDasharray="3 100" strokeDashoffset="-81" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="6" strokeDasharray="4 100" strokeDashoffset="-84" />
                      </svg>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}>
                    <span>Indicative Cost</span>
                    <b style={{ color: "#0f172a" }}>₹28,60,000</b>
                  </div>
                </div>

                {/* 3. Commercial Defaults */}
                <div className="boq-panel-card">
                  <div className="boq-panel-head">
                    <h3>Commercial Defaults</h3>
                    <span className="boq-panel-link" onClick={() => setActiveTab("Rules")}>View Rules →</span>
                  </div>
                  <div className="boq-defaults-list">
                    <div className="boq-default-item">
                      <div className="boq-default-icon boq-icon-blue">₹</div>
                      <div className="boq-default-info">
                        <span className="boq-default-label">Currency</span>
                        <span className="boq-default-val">{template.commercialDefaults.currency}</span>
                      </div>
                    </div>
                    <div className="boq-default-item">
                      <div className="boq-default-icon boq-icon-amber">%</div>
                      <div className="boq-default-info">
                        <span className="boq-default-label">Default Wastage</span>
                        <span className="boq-default-val">{template.commercialDefaults.defaultWastage}%</span>
                      </div>
                    </div>
                    <div className="boq-default-item">
                      <div className="boq-default-icon boq-icon-purple"><Building size={16} /></div>
                      <div className="boq-default-info">
                        <span className="boq-default-label">Tax Profile</span>
                        <span className="boq-default-val">{template.commercialDefaults.taxProfile}</span>
                      </div>
                    </div>
                    <div className="boq-default-item">
                      <div className="boq-default-icon boq-icon-blue"><TrendingUp size={16} /></div>
                      <div className="boq-default-info">
                        <span className="boq-default-label">Default Markup</span>
                        <span className="boq-default-val">{template.commercialDefaults.defaultMarkup}%</span>
                      </div>
                    </div>
                    <div className="boq-default-item">
                      <div className="boq-default-icon boq-icon-green"><Percent size={16} /></div>
                      <div className="boq-default-info">
                        <span className="boq-default-label">Tax</span>
                        <span className="boq-default-val">{template.commercialDefaults.taxPercent}%</span>
                      </div>
                    </div>
                    <div className="boq-default-item">
                      <div className="boq-default-icon boq-icon-purple">#</div>
                      <div className="boq-default-info">
                        <span className="boq-default-label">Rounding</span>
                        <span className="boq-default-val">{template.commercialDefaults.rounding}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Row: BOQ Structure & Coverage, Costing Health, Usage & Dependencies */}
              <div className="boq-overview-row-3">
                {/* 1. BOQ Structure & Coverage */}
                <div className="boq-panel-card">
                  <div className="boq-panel-head">
                    <h3>BOQ Structure & Coverage</h3>
                    <span className="boq-panel-link" onClick={() => setActiveTab("BOQ Structure")}>View Structure →</span>
                  </div>
                  <div className="boq-coverage-counts">
                    <div className="boq-cov-col">
                      <b>{template.sections}</b>
                      <span>Sections</span>
                    </div>
                    <div className="boq-cov-col">
                      <b>{template.categories}</b>
                      <span>Categories</span>
                    </div>
                    <div className="boq-cov-col">
                      <b>{template.items}</b>
                      <span>Line Items</span>
                    </div>
                  </div>
                  <div className="boq-cov-bars">
                    <div className="boq-cov-bar-row">
                      <div className="boq-cov-bar-label">
                        <span>Sections Configured</span>
                        <b>18 / 18</b>
                      </div>
                      <div className="boq-progress-bar-bg">
                        <div className="boq-progress-bar-fill" style={{ width: "100%", background: "#10b981" }} />
                      </div>
                    </div>
                    <div className="boq-cov-bar-row">
                      <div className="boq-cov-bar-label">
                        <span>Items with valid units</span>
                        <b>183 / 186</b>
                      </div>
                      <div className="boq-progress-bar-bg">
                        <div className="boq-progress-bar-fill" style={{ width: "98%", background: "#10b981" }} />
                      </div>
                    </div>
                    <div className="boq-cov-bar-row">
                      <div className="boq-cov-bar-label">
                        <span>Items with quantity rules</span>
                        <b>178 / 186</b>
                      </div>
                      <div className="boq-progress-bar-bg">
                        <div className="boq-progress-bar-fill" style={{ width: "95%", background: "#10b981" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Costing Health */}
                <div className="boq-panel-card">
                  <div className="boq-panel-head">
                    <h3>Costing Health</h3>
                    <span className="boq-panel-link" onClick={() => setActiveTab("Costing")}>Review Costing →</span>
                  </div>
                  <div className="boq-health-split">
                    <div className="boq-health-list">
                      <div className="boq-health-item">
                        <div className="boq-h-sq boq-sq-blue" />
                        <div className="boq-h-content">
                          <b>175 Mapped</b>
                          <p>Current mappings active</p>
                        </div>
                      </div>
                      <div className="boq-health-item">
                        <div className="boq-h-sq boq-sq-yellow" />
                        <div className="boq-h-content">
                          <b>03 Outdated</b>
                          <p>Rate references outdates</p>
                        </div>
                      </div>
                      <div className="boq-health-item">
                        <div className="boq-h-sq boq-sq-yellow" />
                        <div className="boq-h-content">
                          <b>08 Review Required</b>
                          <p>Mapping requires review</p>
                        </div>
                      </div>
                      <div className="boq-health-item">
                        <div className="boq-h-sq boq-sq-red" />
                        <div className="boq-h-content">
                          <b>00 Missing</b>
                          <p>No Costing Reference</p>
                        </div>
                      </div>
                    </div>

                    <div className="boq-health-list">
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Rate Freshness</span>
                      <div className="boq-health-item">
                        <div className="boq-h-sq boq-sq-blue" />
                        <div className="boq-h-content">
                          <b>168 Current</b>
                          <p>Rates Updated</p>
                        </div>
                      </div>
                      <div className="boq-health-item">
                        <div className="boq-h-sq boq-sq-yellow" />
                        <div className="boq-h-content">
                          <b>10 Review Soon</b>
                          <p>Approaching Review</p>
                        </div>
                      </div>
                      <div className="boq-health-item">
                        <div className="boq-h-sq boq-sq-red" />
                        <div className="boq-h-content">
                          <b>08 Outdated</b>
                          <p>Require Update</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Usage & Dependencies */}
                <div className="boq-panel-card">
                  <div className="boq-panel-head">
                    <h3>Usage & Dependencies</h3>
                    <span className="boq-panel-link" onClick={() => setActiveTab("Usage")}>View Usage →</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <div className="boq-default-icon boq-icon-blue" style={{ width: 28, height: 28, fontSize: 12 }}>₹</div>
                        <div>
                          <b>{template.usageDependencies.projectTemplatesCount}</b>
                          <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Project Templates</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <div className="boq-default-icon boq-icon-purple" style={{ width: 28, height: 28, fontSize: 12 }}><Building size={14} /></div>
                        <div>
                          <b>{template.usageDependencies.activeProjectsCount}</b>
                          <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Active Projects</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <div className="boq-default-icon boq-icon-green" style={{ width: 28, height: 28, fontSize: 12 }}><Percent size={14} /></div>
                        <div>
                          <b>0{template.usageDependencies.draftTemplatesCount}</b>
                          <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Draft Templates</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Dependencies</span>
                      {template.usageDependencies.dependencies.map(d => (
                        <div key={d.name} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11.5 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#10b981", marginTop: 4, flexShrink: 0 }} />
                          <div>
                            <span style={{ color: "#1e293b", fontWeight: 500 }}>{d.name}</span>
                            <div style={{ color: "#64748b" }}>{d.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="boq-notice-box">
                    <Info size={16} style={{ flexShrink: 0 }} />
                    <span>This BOQ Template is actively used by 12 Project Templates and 38 Projects. Changes will create a new version.</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Attention Required, Version Governance, Recent Activity */}
              <div className="boq-overview-row-3">
                {/* 1. Attention Required */}
                <div className="boq-panel-card">
                  <div className="boq-panel-head">
                    <h3>Attention Required</h3>
                    <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>
                      08 Issues
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "left" }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>CRITICAL</span>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626" }}>01</div>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Missing Cost References</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706" }}>WARNING</span>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#d97706" }}>05</div>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Outdated rate References</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb" }}>INFO</span>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#2563eb" }}>01</div>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Deprecated Item</span>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, marginTop: "auto" }}>
                    <a href="#" className="boq-panel-link" onClick={e => { e.preventDefault(); setNotice("Viewing all issues."); }}>Review All Issues →</a>
                  </div>
                </div>

                {/* 2. Version Governance */}
                <div className="boq-panel-card">
                  <div className="boq-panel-head">
                    <h3>Version Governance</h3>
                    <span className="boq-panel-link" onClick={() => setActiveTab("Versions")}>View Versions →</span>
                  </div>
                  <div style={{ display: "flex", gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>{template.versionGovernance.version}</div>
                      <span className="boq-badge-active" style={{ fontSize: 10 }}>{template.versionGovernance.status}</span>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 16 }}>
                        <span>Published</span>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{template.versionGovernance.publishedDate}</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, borderLeft: "1px solid #f1f5f9", paddingLeft: 16 }}>
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Changes since v2.3</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6, fontSize: 12, color: "#334155" }}>
                        {template.versionGovernance.changes.map((c, i) => (
                          <span key={i}>{c.text}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Recent Activity */}
                <div className="boq-panel-card">
                  <div className="boq-panel-head">
                    <h3>Recent Activity</h3>
                    <span className="boq-panel-link" onClick={() => setActiveTab("Activity")}>View Activity →</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", marginTop: 6 }} />
                      <div>
                        <b style={{ fontSize: 13, color: "#0f172a" }}>Published</b>
                        <div style={{ fontSize: 11, color: "#64748b" }}>06 Aug 2026 · 14:32</div>
                        <div style={{ fontSize: 12, color: "#334155", marginTop: 2 }}>Pradhyumn Published v3.2</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6", marginTop: 6 }} />
                      <div>
                        <b style={{ fontSize: 13, color: "#0f172a" }}>Approved</b>
                        <div style={{ fontSize: 11, color: "#64748b" }}>06 Aug 2026 · 14:11</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: BOQ STRUCTURE (Screen 5)
             ========================================================================= */}
          {activeTab === "BOQ Structure" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Subheader */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>BOQ Structure</h2>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Monitor line items, categories, base cost across this BOQ template.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "#64748b" }}>
                  <span>Structure as of: <b style={{ color: "#2563eb" }}>08 Aug 2026, 13:12</b> (i)</span>
                  <span>|</span>
                  <button 
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}
                    onClick={() => setNotice("Structure refreshed.")}
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              {/* 5 Metric Cards */}
              <div className="boq-metric-cards-5">
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Sections</span>
                  <div className="boq-mcard-val">{template.sections}</div>
                  <span className="boq-mcard-sub">Organised Structure</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Line Items</span>
                  <div className="boq-mcard-val">{template.items}</div>
                  <span className="boq-mcard-sub">Total Items</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Indicative Base Cost</span>
                  <div className="boq-mcard-val accent">{template.indicativeBaseCost}</div>
                  <span className="boq-mcard-sub">Current Library Rates</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Rate Mapping</span>
                  <div className="boq-mcard-val blue">{template.costMapping}%</div>
                  <span className="boq-mcard-sub">Mapped to Library</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Project Templates</span>
                  <div className="boq-mcard-val">12</div>
                  <span className="boq-mcard-sub">Using this BOQ Template</span>
                </div>
              </div>

              {/* 2-Panel or 3-Panel Structure Layout */}
              <div className={selectedItem ? "boq-structure-3panel" : "boq-structure-panels"}>
                {/* Left Panel: BOQ STRUCTURE Tree */}
                <div className="boq-tree-panel">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase" }}>BOQ STRUCTURE</span>
                  </div>

                  <div className="boq-tree-search">
                    <Search size={14} color="#94a3b8" />
                    <input 
                      placeholder="Search sections..." 
                      value={structureSearch}
                      onChange={e => setStructureSearch(e.target.value)}
                    />
                  </div>

                  <div className="boq-tree-list">
                    {(template.rooms || []).filter(r => r.name.toLowerCase().includes(structureSearch.toLowerCase())).map(r => {
                      const isExpanded = !!expandedSections[r.name];
                      const isSelected = selectedSection === r.name;
                      const hasCategories = (r.categories || []).length > 0;

                      return (
                        <div key={r.name} className="boq-tree-node">
                          <div 
                            className={`boq-tree-node-row ${isSelected && !hasCategories ? "active" : ""}`}
                            onClick={() => {
                              toggleSectionExpand(r.name);
                              setSelectedSection(r.name);
                              if (r.categories?.[0]) setSelectedCategory(r.categories[0].name);
                            }}
                          >
                            <div className="boq-tree-left">
                              {hasCategories ? (
                                isExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />
                              ) : <span style={{ width: 14 }} />}
                              <Folder size={15} color="#64748b" />
                              <span>{r.name}</span>
                            </div>
                            <div className="boq-tree-badges">
                              <span className="boq-count-badge">{r.itemsCount || 0}</span>
                              <span className="boq-cost-badge">{r.cost || "₹0.00L"}</span>
                            </div>
                          </div>

                          {/* Sub-categories tree */}
                          {hasCategories && isExpanded && (
                            <div className="boq-tree-subnodes">
                              {r.categories?.map(c => {
                                const isCatActive = selectedSection === r.name && selectedCategory === c.name;
                                return (
                                  <div
                                    key={c.name}
                                    className={`boq-tree-node-row ${isCatActive ? "active" : ""}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectCategory(r.name, c.name);
                                    }}
                                  >
                                    <div className="boq-tree-left">
                                      <Layers size={14} color={isCatActive ? "#2563eb" : "#64748b"} />
                                      <span>{c.name}</span>
                                    </div>
                                    <div className="boq-tree-badges">
                                      <span className="boq-count-badge">{c.itemsCount || c.items?.length || 0}</span>
                                      <span className="boq-cost-badge">{c.cost || "₹0.00L"}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    className="primary" 
                    style={{ width: "100%", marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    onClick={() => setAddSectionModal(true)}
                  >
                    <Plus size={16} /> Add BOQ Section
                  </button>
                </div>

                {/* Middle Panel: Items Table */}
                <div className="boq-items-panel">
                  <div className="boq-items-head">
                    <div>
                      <div className="boq-items-breadcrumb">
                        {selectedSection} &gt; {selectedCategory}
                      </div>
                      <div className="boq-items-count-cost">
                        {currentCategoryData?.items.length || 0} Items · {currentCategoryData?.cat.cost || "₹4,82,000"}
                      </div>
                    </div>
                    <div className="boq-items-actions">
                      <button className="boq-add-item-btn" onClick={() => setAddItemModal(true)}>
                        <Plus size={15} /> Add Item
                      </button>
                      <button className="boq-icon-square-btn" title="Upload" onClick={() => setNotice("Import item list")}>
                        <Upload size={15} />
                      </button>
                      <button className="boq-icon-square-btn" title="More options">
                        <MoreHorizontal size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="boq-data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 24 }} />
                        <th style={{ width: 40 }}>#</th>
                        <th>CODE</th>
                        <th>ITEM</th>
                        <th>UNIT</th>
                        <th>QTY</th>
                        <th>RATE BASIS</th>
                        <th style={{ textAlign: "right" }}>R…</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentCategoryData?.items || []).map((item, idx) => (
                        <tr 
                          key={item.code || idx} 
                          onClick={() => { setSelectedItem(item); setInspectorTab("General"); }}
                          style={{ cursor: "pointer", background: selectedItem?.code === item.code ? "#f8fafc" : undefined }}
                        >
                          <td style={{ color: "#cbd5e1", cursor: "grab" }}>
                            <GripVertical size={14} />
                          </td>
                          <td style={{ color: "#94a3b8" }}>{idx + 1}</td>
                          <td>
                            <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#1e293b" }}>
                              {item.code}
                            </span>
                          </td>
                          <td>
                            <div>
                              <b style={{ color: "#0f172a", fontSize: 13 }}>{item.name}</b>
                              <div style={{ fontSize: 11, color: "#64748b" }}>{item.description}</div>
                            </div>
                          </td>
                          <td>{item.unit}</td>
                          <td><b>{item.quantity}</b></td>
                          <td><span style={{ fontSize: 12, color: "#475569" }}>{item.rateBasis || "Current Library Rate"}</span></td>
                          <td style={{ textAlign: "right" }}>{Number(item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Table Total Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", fontSize: 13, fontWeight: 700 }}>
                    <span style={{ color: "#475569" }}>
                      TOTAL ({currentCategoryData?.items.length || 8} ITEMS)
                    </span>
                    <span>
                      QTY: {currentCategoryData?.items.reduce((acc, it) => acc + Number(it.quantity || 0), 0) || 96}
                    </span>
                  </div>

                  {/* Table Pagination Footer */}
                  <div className="boq-pagination-bar">
                    <span>Total BOQ Items: {currentCategoryData?.items.length || 30}</span>
                    <div className="boq-page-buttons">
                      <button className="boq-page-num">‹</button>
                      <button className="boq-page-num active">1</button>
                      <button className="boq-page-num">2</button>
                      <button className="boq-page-num">3</button>
                      <button className="boq-page-num">›</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>Show per Page:</span>
                      <select style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Item Inspector */}
                {selectedItem && (
                  <div className="boq-inspector-panel">
                    <div className="boq-inspector-header">
                      <div className="boq-inspector-title">
                        <h3>ITEM INSPECTOR</h3>
                        <span className="insp-code">{selectedItem.code}</span>
                        <span className="insp-name">{selectedItem.name}</span>
                        <span className="insp-desc">Furniture - {selectedSection}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="boq-inspector-badge-mapped">MAPPED</span>
                        <button className="boq-inspector-close" onClick={() => setSelectedItem(null)}>
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="boq-inspector-tabs">
                      {["General", "Measurement", "Costing"].map(t => (
                        <button
                          key={t}
                          className={`boq-inspector-tab ${inspectorTab === t ? "active" : ""}`}
                          onClick={() => setInspectorTab(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <div className="boq-inspector-body">
                      {inspectorTab === "General" && (
                        <>
                          <div className="boq-insp-field">
                            <span className="insp-label">Item Name</span>
                            <span className="insp-value">{selectedItem.name}</span>
                          </div>
                          <div className="boq-insp-field">
                            <span className="insp-label">Item Code</span>
                            <span className="insp-value">{selectedItem.code}</span>
                          </div>
                          <div className="boq-insp-field">
                            <span className="insp-label">Description</span>
                            <span className="insp-value">{selectedItem.description || selectedItem.name + " w..."}</span>
                          </div>
                          <div className="boq-insp-field">
                            <span className="insp-label">Item Specification</span>
                            <ul className="boq-insp-spec">
                              <li>19mm BWP Plywood</li>
                              <li>Laminate Finish</li>
                              <li>Soft-close Hardware</li>
                            </ul>
                          </div>
                          <div className="boq-insp-field">
                            <span className="insp-label">Status</span>
                            <span className="insp-value status-active">ACTIVE</span>
                          </div>
                          <div className="boq-insp-field">
                            <span className="insp-label">Created by</span>
                            <span className="insp-value">Admin User</span>
                          </div>
                          <div className="boq-insp-field">
                            <span className="insp-label">Created On</span>
                            <span className="insp-value">12 Jul 2026</span>
                          </div>
                          <div className="boq-insp-field">
                            <span className="insp-label">Last Modified</span>
                            <span className="insp-value">08 Aug 2026</span>
                          </div>
                        </>
                      )}
                      {inspectorTab === "Measurement" && (
                        <>
                          <div className="boq-insp-field">
                            <span className="insp-label">Unit</span>
                            <span className="insp-value">{selectedItem.unit}</span>
                          </div>
                          <div className="boq-insp-field">
                            <span className="insp-label">Quantity</span>
                            <span className="insp-value">{selectedItem.quantity}</span>
                          </div>
                          <div className="boq-insp-field">
                            <span className="insp-label">Wastage</span>
                            <span className="insp-value">{selectedItem.wastePercent}%</span>
                          </div>
                        </>
                      )}
                      {inspectorTab === "Costing" && (
                        <>
                          <div className="boq-insp-field">
                            <span className="insp-label">Rate</span>
                            <span className="insp-value">₹{Number(selectedItem.rate).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="boq-insp-field">
                            <span className="insp-label">Amount</span>
                            <span className="insp-value">₹{Number(selectedItem.amount).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="boq-insp-field">
                            <span className="insp-label">Tax</span>
                            <span className="insp-value">{selectedItem.taxPercent}%</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="boq-inspector-footer">
                      <div className="insp-actions-row">
                        <button className="boq-insp-btn-outline" onClick={() => setNotice("Item duplicated.")}>Duplicate</button>
                        <button className="boq-insp-btn-outline danger" onClick={() => { setSelectedItem(null); setNotice("Item removed."); }}>Remove Item</button>
                      </div>
                      <button className="boq-insp-btn-save" onClick={() => setNotice("Changes saved.")}>Save Changes</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              OTHER TABS: Costing, Rules, Usage, Versions, Activity
             ========================================================================= */}
          {activeTab === "Costing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Subheader */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Costing</h2>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Monitor rate coverage, costing references, cost composition and rate changes across this BOQ template.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "#64748b" }}>
                  <span>Costing as of: <b style={{ color: "#2563eb" }}>08 Aug 2026, 13:12</b></span>
                  <button style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }} onClick={() => setNotice("Costing refreshed.")}>
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="boq-metric-cards-4">
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Sections</span>
                  <div className="boq-mcard-val">{template.sections}</div>
                  <span className="boq-mcard-sub">Organised Structure</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Line Items</span>
                  <div className="boq-mcard-val">{template.items}</div>
                  <span className="boq-mcard-sub">Total Items</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Indicative Base Cost</span>
                  <div className="boq-mcard-val accent">{template.indicativeBaseCost}</div>
                  <span className="boq-mcard-sub">Current Library Rates</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Rate Mapping</span>
                  <div className="boq-mcard-val blue">{template.costMapping}%</div>
                  <span className="boq-mcard-sub">Mapped to Library</span>
                </div>
              </div>

              {/* Costing Items Section */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                      <FileText size={15} /> COSTING ITEMS <Info size={13} color="#94a3b8" />
                    </span>
                    <div className="boq-costing-stats-bar">
                      <b>{(template as Record<string, unknown>).costingItems ? ((template as Record<string, unknown>).costingItems as Array<Record<string, unknown>>).length : template.items} Items</b>
                      <span className="stat-dot" />
                      <span>{template.costingHealth.mapped} Mapped</span>
                      <span className="stat-dot" />
                      <span>{template.costingHealth.outdated} Outdated</span>
                      <span className="stat-dot" />
                      <span>{template.costingHealth.missing} Unmapped</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label className="fig-dashboard-search" style={{ margin: 0, minWidth: 180 }}>
                      <Search size={14} />
                      <input placeholder="Search costing items..." value={costingSearch} onChange={e => setCostingSearch(e.target.value)} style={{ fontSize: 12 }} />
                    </label>
                    <button className="boq-add-item-btn" onClick={() => setNotice("Add costing item")}>
                      <Plus size={15} /> Add Item
                    </button>
                    <button className="boq-icon-square-btn" title="Export"><Download size={15} /></button>
                    <button className="boq-icon-square-btn" title="More"><MoreHorizontal size={15} /></button>
                  </div>
                </div>

                {/* Costing Table */}
                <table className="boq-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 24 }} />
                      <th style={{ width: 40 }}>#</th>
                      <th>CODE</th>
                      <th>ITEM</th>
                      <th>UNIT</th>
                      <th>RATE SOURCE</th>
                      <th>CURRENT RATE (₹)</th>
                      <th>SNAPSHOT</th>
                      <th>VARIANCE</th>
                      <th>FRESHNESS</th>
                      <th>RATE STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(((template as Record<string, unknown>).costingItems as Array<Record<string, unknown>>) || [])
                      .filter((ci: Record<string, unknown>) => !costingSearch || String(ci.name).toLowerCase().includes(costingSearch.toLowerCase()) || String(ci.code).toLowerCase().includes(costingSearch.toLowerCase()))
                      .slice(0, 10)
                      .map((ci: Record<string, unknown>, idx: number) => (
                      <tr key={String(ci.code) + idx}>
                        <td style={{ color: "#cbd5e1" }}><GripVertical size={14} /></td>
                        <td style={{ color: "#94a3b8" }}>{idx + 1}</td>
                        <td><span style={{ fontFamily: "monospace", fontWeight: 600, color: "#1e293b" }}>{String(ci.code)}</span></td>
                        <td>
                          <div>
                            <b style={{ color: "#0f172a", fontSize: 13 }}>{String(ci.name)}</b>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{String(ci.description || "")}</div>
                          </div>
                        </td>
                        <td>{String(ci.unit)}</td>
                        <td>
                          <div className="boq-rate-source-cell">
                            <div className="rate-source-label">{String(ci.rateSource)}</div>
                            <div className="rate-source-sub">{String(ci.rateSourceSub || "/ Sq. Ft")}</div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {Number(ci.currentRate) > 0 ? Number(ci.currentRate).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
                        </td>
                        <td>
                          <div className="boq-snapshot-cell">
                            <div className="snap-amount">{Number(ci.snapshot) > 0 ? `₹${Number(ci.snapshot).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}</div>
                            <div className="snap-sub">{Number(ci.snapshot) > 0 ? String(ci.snapshotSub || "/ Sq. Ft") : ""}</div>
                          </div>
                        </td>
                        <td>
                          {Number(ci.variance) !== 0 ? (
                            <div className={`boq-variance-cell ${Number(ci.variance) > 0 ? "positive" : "negative"}`}>
                              <div>{Number(ci.variance) > 0 ? "+" : ""}{Number(ci.variance)}%</div>
                              <div className="var-sub">{Number(ci.varianceAmount) > 0 ? "+" : ""}₹{Math.abs(Number(ci.varianceAmount)).toLocaleString("en-IN")}</div>
                            </div>
                          ) : <span style={{ color: "#94a3b8" }}>—</span>}
                        </td>
                        <td>
                          <div className="boq-freshness-cell">
                            <span className={`boq-freshness-dot ${String(ci.freshnessCls)}`} />
                            <div>
                              <div className={`boq-freshness-label ${String(ci.freshnessCls)}`}>{String(ci.freshness)}</div>
                              <div className="boq-freshness-date">{String(ci.freshnessDate || "")}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className={`boq-rate-status-badge ${String(ci.rateStatus).toLowerCase().replace("-", "")}`}>
                              {String(ci.rateStatus)}
                            </span>
                            {String(ci.rateStatus) === "MAPPED" && <Check size={14} className="boq-rate-check" />}
                            <MoreHorizontal size={14} color="#94a3b8" style={{ cursor: "pointer" }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="boq-pagination-bar">
                  <span>Total BOQ Items: {((template as Record<string, unknown>).costingItems as Array<Record<string, unknown>>)?.length || 30}</span>
                  <div className="boq-page-buttons">
                    <button className="boq-page-num">‹</button>
                    <button className="boq-page-num active">1</button>
                    <button className="boq-page-num">2</button>
                    <button className="boq-page-num">3</button>
                    <button className="boq-page-num">›</button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Show per Page:</span>
                    <select style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Rules" && (() => {
            const allRules = ((template as Record<string, unknown>).rules as Array<Record<string, unknown>>) || [];
            const categories = ["All Rules", "Commercial", "Calculation", "Governance"];
            const categoryCounts: Record<string, number> = { "All Rules": allRules.length };
            categories.slice(1).forEach(c => { categoryCounts[c] = allRules.filter(r => String(r.category) === c).length; });
            const filteredRules = (ruleFilter === "All Rules" ? allRules : allRules.filter(r => String(r.category) === ruleFilter))
              .filter(r => !rulesSearch || String(r.name).toLowerCase().includes(rulesSearch.toLowerCase()));
            return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Subheader */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Rules</h2>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Configure how this BOQ behaves when used in Projects</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label className="fig-dashboard-search" style={{ margin: 0, minWidth: 180 }}>
                    <Search size={14} />
                    <input placeholder="Search rules..." value={rulesSearch} onChange={e => setRulesSearch(e.target.value)} style={{ fontSize: 12 }} />
                  </label>
                  <button className="boq-add-item-btn" onClick={() => setNotice("Create rule form")}>
                    <Plus size={15} /> Create Rule
                  </button>
                  <button className="boq-icon-square-btn" title="Filter"><Sliders size={15} /></button>
                  <button className="boq-icon-square-btn" title="More"><MoreHorizontal size={15} /></button>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="boq-metric-cards-4">
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Sections</span>
                  <div className="boq-mcard-val">{template.sections}</div>
                  <span className="boq-mcard-sub">Organised Structure</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Line Items</span>
                  <div className="boq-mcard-val">{template.items}</div>
                  <span className="boq-mcard-sub">Total Items</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Indicative Base Cost</span>
                  <div className="boq-mcard-val accent">{template.indicativeBaseCost}</div>
                  <span className="boq-mcard-sub">Current Library Rates</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Rate Mapping</span>
                  <div className="boq-mcard-val blue">{template.costMapping}%</div>
                  <span className="boq-mcard-sub">Mapped to Library</span>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="boq-rules-filter-pills">
                {categories.map(c => (
                  <button key={c} className={`boq-rule-pill ${ruleFilter === c ? "active" : ""}`} onClick={() => setRuleFilter(c)}>
                    {c} <span className="pill-count">{categoryCounts[c] || 0}</span>
                  </button>
                ))}
              </div>

              {/* Rules Table + Optional Inspector Split */}
              <div className={selectedRule ? "boq-rules-split" : ""}>
                <div className={selectedRule ? "boq-rules-main" : ""} style={{ background: "#fff", border: selectedRule ? "none" : "1px solid #e2e8f0", borderRadius: selectedRule ? 0 : 12, overflow: "hidden" }}>
                  <table className="boq-data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 24 }} />
                        <th>RULE NAME</th>
                        <th>SCOPE</th>
                        <th>VALUE</th>
                        <th>SOURCE</th>
                        <th>STATUS</th>
                        <th>IMPACT</th>
                        <th>LAST UPDATED</th>
                        <th style={{ width: 32 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRules.map((rule, idx) => (
                        <tr
                          key={String(rule.id) || idx}
                          onClick={() => { setSelectedRule(rule); setRuleInspTab("Overview"); }}
                          style={{ cursor: "pointer", background: selectedRule && String(selectedRule.id) === String(rule.id) ? "#f8fafc" : undefined }}
                        >
                          <td style={{ color: "#cbd5e1" }}><GripVertical size={14} /></td>
                          <td>
                            <div>
                              <b style={{ color: "#0f172a", fontSize: 13 }}>{String(rule.name)}</b>
                              <div style={{ fontSize: 11, color: "#64748b" }}>{String(rule.description || "")}</div>
                            </div>
                          </td>
                          <td style={{ fontSize: 12, color: "#475569", whiteSpace: "pre-line" }}>{String(rule.scope)}</td>
                          <td style={{ fontSize: 12, fontWeight: 600 }}>{String(rule.value)}</td>
                          <td>
                            <span className={`boq-source-badge ${String(rule.source).toLowerCase()}`}>
                              {String(rule.source)}
                            </span>
                          </td>
                          <td>
                            <span className={`boq-status-badge-sm ${String(rule.status).toLowerCase()}`}>
                              {String(rule.status)}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: "#475569" }}>{String(rule.impact)}</td>
                          <td style={{ fontSize: 12, color: "#64748b" }}>{String(rule.lastUpdated)}</td>
                          <td><MoreHorizontal size={14} color="#94a3b8" style={{ cursor: "pointer" }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div className="boq-pagination-bar">
                    <span>Total Rules: {filteredRules.length || "NA"}</span>
                    <div className="boq-page-buttons">
                      <button className="boq-page-num">‹</button>
                      <button className="boq-page-num active">1</button>
                      <button className="boq-page-num">2</button>
                      <button className="boq-page-num">3</button>
                      <button className="boq-page-num">4</button>
                      <button className="boq-page-num">5</button>
                      <button className="boq-page-num">›</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>Show per Page:</span>
                      <select style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Rule Inspector Panel */}
                {selectedRule && (
                  <div className="boq-rule-inspector">
                    <div className="boq-rule-insp-header" style={{ position: "relative" }}>
                      <p className="rule-insp-title">{String(selectedRule.name).toUpperCase()}</p>
                      <p className="rule-insp-desc">{String(selectedRule.description)} applied on internal cost</p>
                      <button className="rule-insp-close" style={{ position: "absolute", right: 18, top: 20, background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }} onClick={() => setSelectedRule(null)}>
                        <X size={16} />
                      </button>
                    </div>

                    <div className="boq-rule-insp-tabs">
                      {["Overview", "Conditions", "Actions"].map(t => (
                        <button key={t} className={`boq-rule-insp-tab ${ruleInspTab === t ? "active" : ""}`} onClick={() => setRuleInspTab(t)}>
                          {t}
                        </button>
                      ))}
                    </div>

                    <div className="boq-rule-insp-body">
                      {ruleInspTab === "Overview" && (
                        <>
                          <div className="boq-rule-insp-field">
                            <span className="rinsp-label">Status</span>
                            <span className="rinsp-value status-active">{String(selectedRule.status)}</span>
                          </div>
                          <div className="boq-rule-insp-field">
                            <span className="rinsp-label">Value</span>
                            <span className="rinsp-value">{String(selectedRule.value)}</span>
                          </div>
                          <div className="boq-rule-insp-field">
                            <span className="rinsp-label">Scope</span>
                            <span className="rinsp-value">{String(selectedRule.scope)}</span>
                          </div>
                          <div className="boq-rule-insp-field">
                            <span className="rinsp-label">Inherited by</span>
                            <div>
                              <div className="rinsp-value">{String(selectedRule.impact)}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{template.sections} sections</div>
                            </div>
                          </div>
                          <div className="boq-rule-insp-field">
                            <span className="rinsp-label">Calculation Basis</span>
                            <span className="rinsp-value">Internal Cost</span>
                          </div>

                          <div className="boq-rule-applied-to">
                            <h4>Applied to</h4>
                            {["Material", "Labour", "Transportation", "Overhead", "Tax"].map((item, i) => (
                              <label key={item} className="boq-rule-checkbox">
                                <input type="checkbox" defaultChecked={i < 4} readOnly />
                                {item}
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                      {ruleInspTab === "Conditions" && (
                        <div style={{ color: "#64748b", fontSize: 13 }}>
                          <p>Rule conditions define when this rule is triggered. Configure thresholds, item filters, and scope constraints.</p>
                          <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, marginTop: 12 }}>
                            <b style={{ color: "#0f172a" }}>Scope: {String(selectedRule.scope)}</b>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Applies to all items in scope when conditions are met.</div>
                          </div>
                        </div>
                      )}
                      {ruleInspTab === "Actions" && (
                        <div style={{ color: "#64748b", fontSize: 13 }}>
                          <p>Actions executed when this rule&apos;s conditions are satisfied.</p>
                          <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, marginTop: 12 }}>
                            <b style={{ color: "#0f172a" }}>Apply {String(selectedRule.value)}</b>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Calculation applied to {String(selectedRule.impact).toLowerCase()}.</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="boq-rule-insp-footer">
                      <button className="boq-rule-insp-btn-edit" onClick={() => setNotice("Edit rule form opened.")}>Edit Rule</button>
                      <button className="boq-rule-insp-btn-deactivate" onClick={() => setNotice("Rule deactivated.")}>Deactivate</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })()}


          {activeTab === "Usage" && (() => {
            const ud = (template as Record<string, unknown>).usageData as Record<string, unknown> | undefined;
            const usages = (ud?.usages as Array<Record<string, unknown>>) || [];
            const versionAdaptation = (ud?.versionAdaptation as Array<Record<string, unknown>>) || [];
            const usageByType = (ud?.usageByType as Array<Record<string, unknown>>) || [];
            const totalUses = Number(ud?.totalUses || 18);
            const filteredUsages = usages.filter(u => !usageSearch || String(u.project).toLowerCase().includes(usageSearch.toLowerCase()));
            return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Subheader */}
              <div className="boq-usage-header-bar">
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Useage</h2>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Track projects, estimates, BOQs and quotations using this template.</p>
                </div>
                <div className="boq-usage-header-actions">
                  <label className="fig-dashboard-search" style={{ margin: 0, minWidth: 200 }}>
                    <Search size={14} />
                    <input placeholder="Search usage by project..." value={usageSearch} onChange={e => setUsageSearch(e.target.value)} style={{ fontSize: 12 }} />
                  </label>
                  <button className="boq-usage-dropdown">Last 90 Days <ChevronDown size={14} /></button>
                  <button className="boq-usage-icon-btn"><Filter size={14} /> Filter</button>
                  <button className="boq-usage-icon-btn"><Download size={14} /> Export <ChevronDown size={14} /></button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="boq-metric-cards-4">
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Total Uses</span>
                  <div className="boq-mcard-val">{totalUses}</div>
                  <span className="boq-mcard-sub">All time usages</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Active Projects</span>
                  <div className="boq-mcard-val">{Number(ud?.activeProjects || 11)}</div>
                  <span className="boq-mcard-sub">Currently Active</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Draft / Estimates</span>
                  <div className="boq-mcard-val">0{Number(ud?.draftEstimates || 3)}</div>
                  <span className="boq-mcard-sub">In-Progress</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Approved BOQs</span>
                  <div className="boq-mcard-val">0{Number(ud?.approvedBoqs || 2)}</div>
                  <span className="boq-mcard-sub">Approved / Locked</span>
                </div>
              </div>

              {/* Usage Table + Charts */}
              <div className="boq-usage-layout">
                {/* Left: Usage Table */}
                <div className="boq-usage-table-section" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                  <table className="boq-data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 24 }} />
                        <th>USAGE / PROJECT</th>
                        <th>TYPE</th>
                        <th>CLIENT</th>
                        <th>TEMPLATE VERSION</th>
                        <th>RULE VERSION</th>
                        <th>STATUS</th>
                        <th>OWNER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsages.map((u, idx) => (
                        <tr key={idx}>
                          <td style={{ color: "#cbd5e1" }}><GripVertical size={14} /></td>
                          <td>
                            <div>
                              <b style={{ color: "#0f172a", fontSize: 13 }}>{String(u.project)}</b>
                              <div style={{ fontSize: 11, color: "#64748b" }}>{String(u.code)}</div>
                            </div>
                          </td>
                          <td>
                            <span className={`boq-type-badge ${String(u.type).toLowerCase() === "boq" ? "boq-type" : String(u.type).toLowerCase()}`}>
                              {String(u.type)}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: "#334155" }}>{String(u.client)}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{String(u.templateVersion)}</span>
                              <span className={`boq-ver-badge ${String(u.templateVersionStatus).toLowerCase().replace(" ", "-")}`}>
                                {String(u.templateVersionStatus)}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontSize: 12, fontWeight: 600 }}>{String(u.ruleVersion)}</td>
                          <td>
                            <span className={`boq-usage-status ${String(u.status).toLowerCase()}`}>
                              {String(u.status)}
                            </span>
                          </td>
                          <td>
                            <div className="boq-owner-cell">
                              <div className="boq-owner-avatar">
                                {String(u.owner).split(" ").map(w => w[0]).join("").slice(0, 2)}
                              </div>
                              <div className="boq-owner-info">
                                <span className="owner-name">{String(u.owner)}</span>
                                <span className="owner-role">{String(u.role)}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div className="boq-pagination-bar">
                    <span>Total BOQ Templates: {filteredUsages.length || 30}</span>
                    <div className="boq-page-buttons">
                      <button className="boq-page-num">‹</button>
                      <button className="boq-page-num active">1</button>
                      <button className="boq-page-num">2</button>
                      <button className="boq-page-num">3</button>
                      <button className="boq-page-num">4</button>
                      <button className="boq-page-num">5</button>
                      <button className="boq-page-num">›</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>Show per Page:</span>
                      <select style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right: Charts */}
                <div className="boq-usage-charts">
                  {/* Version Adaptation Donut */}
                  <div className="boq-usage-chart-card">
                    <h4>Version Adaptation</h4>
                    <div className="boq-donut-chart">
                      <div className="boq-donut-svg-wrap">
                        <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                          {versionAdaptation.reduce((acc: Array<{offset: number; el: React.ReactNode}>, v, i) => {
                            const dashLen = Number(v.percent) * 0.88;
                            const offset = i === 0 ? 0 : acc[i-1].offset + Number(versionAdaptation[i-1].percent) * 0.88;
                            acc.push({ offset, el: (
                              <circle key={i} cx="18" cy="18" r="14" fill="none" stroke={String(v.color)} strokeWidth="5" strokeDasharray={`${dashLen} 100`} strokeDashoffset={`-${offset}`} />
                            )});
                            return acc;
                          }, []).map(item => item.el)}
                        </svg>
                        <div className="boq-donut-center-label">
                          <span className="donut-num">{totalUses}</span>
                          <span className="donut-sub">Total</span>
                        </div>
                      </div>
                      <div className="boq-donut-legend">
                        {versionAdaptation.map((v, i) => (
                          <div key={i} className="boq-donut-legend-item">
                            <span className="legend-dot" style={{ background: String(v.color) }} />
                            <span>{String(v.version)}</span>
                            <span className="legend-count">{String(v.count)}</span>
                            <span className="legend-pct">({String(v.percent)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="boq-view-versions-link" style={{ marginTop: 12 }} onClick={() => setActiveTab("Versions")}>
                      View All Versions →
                    </div>
                  </div>

                  {/* Usage by Type Bar */}
                  <div className="boq-usage-chart-card">
                    <h4>Usage by Type</h4>
                    <div className="boq-bar-chart">
                      {usageByType.map((t, i) => (
                        <div key={i} className="boq-bar-row">
                          <div className="bar-label">
                            <span className="bar-dot" style={{ background: String(t.color) }} />
                            {String(t.type)}
                          </div>
                          <div className="boq-bar-track">
                            <div className="boq-bar-fill" style={{ width: `${Number(t.percent)}%`, background: String(t.color) }} />
                          </div>
                          <span className="bar-stat">{String(t.count)}({String(t.percent)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {activeTab === "Versions" && (() => {
            const allVersions = ((template as Record<string, unknown>).versionsData as Array<Record<string, unknown>>) || [];
            const vFilterTabs = ["All Versions", "Published", "Drafts", "Archived"];
            const filteredVersions = allVersions
              .filter(v => {
                if (versionFilter === "All Versions") return true;
                if (versionFilter === "Published") return String(v.status) === "PUBLISHED";
                if (versionFilter === "Drafts") return String(v.status) === "DRAFT";
                if (versionFilter === "Archived") return String(v.status) === "ARCHIVED" || String(v.status) === "SUPERSEDED";
                return true;
              })
              .filter(v => !versionsSearch || String(v.version).toLowerCase().includes(versionsSearch.toLowerCase()) || String(v.changeSummary).toLowerCase().includes(versionsSearch.toLowerCase()));
            return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Subheader */}
              <div className="boq-versions-header">
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Versions</h2>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Manage template revisions, compare configuration changes, and control published versions.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label className="fig-dashboard-search" style={{ margin: 0, minWidth: 180 }}>
                    <Search size={14} />
                    <input placeholder="Search versions..." value={versionsSearch} onChange={e => setVersionsSearch(e.target.value)} style={{ fontSize: 12 }} />
                  </label>
                  <button className="boq-usage-icon-btn"><Filter size={14} /> Filter</button>
                  <button className="boq-add-item-btn" onClick={() => setNotice("New version created.")}>
                    <Plus size={15} /> New Version
                  </button>
                  <button className="boq-icon-square-btn" title="More"><MoreHorizontal size={15} /></button>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="boq-metric-cards-4">
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Total Versions</span>
                  <div className="boq-mcard-val">0{allVersions.length}</div>
                  <span className="boq-mcard-sub">{allVersions.filter(v => String(v.status) === "PUBLISHED").length} Published</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Current Version</span>
                  <div className="boq-mcard-val blue">{String(allVersions.find(v => String(v.status) === "PUBLISHED")?.version || "v3.2")}</div>
                  <span className="boq-mcard-sub">Published</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Active Draft</span>
                  <div className="boq-mcard-val accent">{String(allVersions.find(v => String(v.status) === "DRAFT")?.version || "v3.3")}</div>
                  <span className="boq-mcard-sub">Updated 2h ago</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Projects Using</span>
                  <div className="boq-mcard-val">{allVersions.reduce((sum, v) => sum + (typeof v.projects === "number" ? Number(v.projects) : 0), 0) || 42}</div>
                  <span className="boq-mcard-sub">This Template</span>
                </div>
              </div>

              {/* Filter Tabs + My Changes */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="boq-versions-filter-tabs" style={{ marginBottom: 0 }}>
                  {vFilterTabs.map(t => (
                    <button key={t} className={`boq-versions-filter-tab ${versionFilter === t ? "active" : ""}`} onClick={() => setVersionFilter(t)}>{t}</button>
                  ))}
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", cursor: "pointer" }}>
                  <input type="checkbox" checked={myChangesOnly} onChange={e => setMyChangesOnly(e.target.checked)} style={{ accentColor: "#2563eb" }} />
                  My Changes
                </label>
              </div>

              {/* Versions Table + Optional Detail Panel */}
              <div className={selectedVersion ? "boq-versions-split" : ""}>
                <div className={selectedVersion ? "boq-versions-main" : ""} style={{ background: "#fff", border: selectedVersion ? "none" : "1px solid #e2e8f0", borderRadius: selectedVersion ? 0 : 12, overflow: "hidden" }}>
                  <table className="boq-data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 24 }} />
                        <th>VERSION</th>
                        <th>STATUS</th>
                        <th>CHANGE SUMMARY</th>
                        <th>CREATED BY</th>
                        <th>PUBLISHED BY</th>
                        <th>CREATED</th>
                        <th>PUBLISHED</th>
                        <th>PROJECTS</th>
                        <th>CHANGES</th>
                        <th style={{ width: 32 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVersions.map((v, idx) => (
                        <tr
                          key={String(v.version) || idx}
                          onClick={() => setSelectedVersion(v)}
                          style={{ cursor: "pointer", background: selectedVersion && String(selectedVersion.version) === String(v.version) ? "#f8fafc" : undefined }}
                        >
                          <td style={{ color: "#cbd5e1" }}><GripVertical size={14} /></td>
                          <td style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{String(v.version)}</td>
                          <td>
                            <span className={`boq-version-status ${String(v.status).toLowerCase()}`}>
                              {String(v.status)}
                            </span>
                          </td>
                          <td>
                            <div>
                              <b style={{ color: "#0f172a", fontSize: 13 }}>{String(v.changeSummary)}</b>
                              <div style={{ fontSize: 11, color: "#64748b" }}>{String(v.changeDetail || "")}</div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div className="boq-owner-avatar" style={{ width: 24, height: 24, fontSize: 9 }}>
                                {String(v.createdBy).split(" ").map(w => w[0]).join("").slice(0, 2)}
                              </div>
                              <span style={{ fontSize: 12 }}>{String(v.createdBy)}</span>
                            </div>
                          </td>
                          <td>
                            {String(v.publishedBy) !== "-" ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div className="boq-owner-avatar" style={{ width: 24, height: 24, fontSize: 9 }}>
                                  {String(v.publishedBy).split(" ").map(w => w[0]).join("").slice(0, 2)}
                                </div>
                                <span style={{ fontSize: 12 }}>{String(v.publishedBy)}</span>
                              </div>
                            ) : <span style={{ color: "#94a3b8" }}>-</span>}
                          </td>
                          <td style={{ fontSize: 12, color: "#475569", whiteSpace: "pre-line" }}>{String(v.created)}</td>
                          <td style={{ fontSize: 12, color: "#475569", whiteSpace: "pre-line" }}>{String(v.published) !== "-" ? String(v.published) : <span style={{ color: "#94a3b8" }}>-</span>}</td>
                          <td style={{ fontSize: 13, fontWeight: 600 }}>{String(v.projects) !== "-" ? String(v.projects) : <span style={{ color: "#94a3b8" }}>-</span>}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontWeight: 600 }}>{String(v.changes)}</span>
                              <span className={`boq-changes-badge ${String(v.changesLevel).toLowerCase()}`}>{String(v.changesLevel)}</span>
                            </div>
                          </td>
                          <td><MoreHorizontal size={14} color="#94a3b8" style={{ cursor: "pointer" }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="boq-pagination-bar">
                    <span>Total Versions: {filteredVersions.length || 30}</span>
                    <div className="boq-page-buttons">
                      <button className="boq-page-num">‹</button>
                      <button className="boq-page-num active">1</button>
                      <button className="boq-page-num">2</button>
                      <button className="boq-page-num">3</button>
                      <button className="boq-page-num">4</button>
                      <button className="boq-page-num">5</button>
                      <button className="boq-page-num">›</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>Show per Page:</span>
                      <select style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Version Detail Panel */}
                {selectedVersion && (
                  <div className="boq-version-detail-panel">
                    <div className="boq-version-detail-header">
                      <h3>ABOUT CURRENT VERSION</h3>
                      <div className="vd-pub-info">Published on {String(selectedVersion.published) !== "-" ? String(selectedVersion.published).replace("\n", " ") : "N/A"}</div>
                      <p className="vd-desc">{String(selectedVersion.changeSummary)}. {String(selectedVersion.changeDetail)}</p>
                      <button className="vd-close" onClick={() => setSelectedVersion(null)}>
                        <X size={16} />
                      </button>
                    </div>

                    <div className="boq-version-detail-section">
                      <h4>Snapshot Summary</h4>
                      <div className="boq-vd-field">
                        <span className="vd-label">Status</span>
                        <span className={`boq-version-status ${String(selectedVersion.status).toLowerCase()}`}>{String(selectedVersion.status)}</span>
                      </div>
                      <div className="boq-vd-field">
                        <span className="vd-label">Version</span>
                        <span className="vd-value">{String(selectedVersion.version)}</span>
                      </div>
                      <div className="boq-vd-field"><span className="vd-label">Areas</span><span className="vd-value">08</span></div>
                      <div className="boq-vd-field"><span className="vd-label">Rooms</span><span className="vd-value">24</span></div>
                      <div className="boq-vd-field"><span className="vd-label">BOQ Sections</span><span className="vd-value">{template.sections}</span></div>
                      <div className="boq-vd-field"><span className="vd-label">BOQ Items</span><span className="vd-value">{template.items}</span></div>
                      <div className="boq-vd-field"><span className="vd-label">Workflow Stages</span><span className="vd-value">07</span></div>
                      <div className="boq-vd-field"><span className="vd-label">Tasks</span><span className="vd-value">48</span></div>
                      <div className="boq-vd-field"><span className="vd-label">Milestones</span><span className="vd-value">06</span></div>
                      <div className="boq-vd-field"><span className="vd-label">Approvals</span><span className="vd-value">09</span></div>
                      <div className="boq-vd-field"><span className="vd-label">Rules</span><span className="vd-value">14</span></div>
                      <div className="boq-vd-field"><span className="vd-label">Documents (Req.)</span><span className="vd-value">12</span></div>
                    </div>

                    <div className="boq-version-detail-section">
                      <h4>Usage</h4>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        04 Aug 18 projects created from this version
                      </div>
                      <div className="boq-view-versions-link" style={{ marginTop: 6 }} onClick={() => setActiveTab("Usage")}>
                        View Projects →
                      </div>
                    </div>

                    <div className="boq-version-detail-section">
                      <h4>Last Activity</h4>
                      <div className="boq-vd-activity-item">
                        <span className="vda-dot" style={{ background: "#10b981" }} />
                        <div>
                          <div className="vda-title">Published</div>
                          <div className="vda-meta">06 Aug 2026 · 14:32</div>
                          <div className="vda-meta">Pradhyumn Published v3.2</div>
                        </div>
                      </div>
                      <div className="boq-vd-activity-item">
                        <span className="vda-dot" style={{ background: "#6366f1" }} />
                        <div>
                          <div className="vda-title">Approved</div>
                          <div className="vda-meta">06 Aug 2026 · 14:11</div>
                          <div className="vda-meta">Version approved for publishing</div>
                        </div>
                      </div>
                    </div>

                    <div className="boq-version-detail-footer">
                      <button onClick={() => setNotice("Viewing version details for " + String(selectedVersion.version))}>View Version Details</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })()}

          {activeTab === "Activity" && (() => {
            const allActivity = ((template as Record<string, unknown>).activityData as Array<Record<string, unknown>>) || [];
            const actCategories = ["All", "Changes", "Publishing", "Usage", "Access", "System"];
            const filteredActivity = allActivity
              .filter(a => activityFilter === "All" || String(a.category) === activityFilter)
              .filter(a => !activitySearch || String(a.title).toLowerCase().includes(activitySearch.toLowerCase()) || String(a.user).toLowerCase().includes(activitySearch.toLowerCase()));
            const groupedByDay: Record<string, Array<Record<string, unknown>>> = {};
            filteredActivity.forEach(a => {
              const day = String(a.day || "TODAY");
              if (!groupedByDay[day]) groupedByDay[day] = [];
              groupedByDay[day].push(a);
            });
            return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Subheader */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Activity</h2>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Track changes actions, approvals, publishing events, and usage activity associated with this template.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label className="fig-dashboard-search" style={{ margin: 0, minWidth: 180 }}>
                    <Search size={14} />
                    <input placeholder="Search activity..." value={activitySearch} onChange={e => setActivitySearch(e.target.value)} style={{ fontSize: 12 }} />
                  </label>
                  <button className="boq-usage-icon-btn"><Filter size={14} /> Filter</button>
                  <button className="boq-usage-icon-btn"><Calendar size={14} /> Date</button>
                  <button className="boq-usage-icon-btn"><Download size={14} /> Export</button>
                  <button className="boq-icon-square-btn" title="More"><MoreHorizontal size={15} /></button>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="boq-metric-cards-4">
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Total Events</span>
                  <div className="boq-mcard-val">284</div>
                  <span className="boq-mcard-sub">All Time</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Changes This Week</span>
                  <div className="boq-mcard-val">18</div>
                  <span className="boq-mcard-sub">Last 7 Days</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Contributors</span>
                  <div className="boq-mcard-val">7</div>
                  <span className="boq-mcard-sub">Unique Users</span>
                </div>
                <div className="boq-mcard">
                  <span className="boq-mcard-label">Published Changes</span>
                  <div className="boq-mcard-val">4</div>
                  <span className="boq-mcard-sub">Last 30 Days</span>
                </div>
              </div>

              {/* Filter Tabs + Sort */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="boq-activity-filter-tabs" style={{ marginBottom: 0 }}>
                  {actCategories.map(c => (
                    <button key={c} className={`boq-activity-filter-tab ${activityFilter === c ? "active" : ""}`} onClick={() => setActivityFilter(c)}>{c}</button>
                  ))}
                </div>
                <div className="boq-activity-sort">
                  Sort: <b>Newest First</b> <ChevronDown size={14} />
                </div>
              </div>

              {/* Activity Timeline */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                {Object.entries(groupedByDay).map(([day, items]) => (
                  <React.Fragment key={day}>
                    <div className="boq-activity-day-group">{day}</div>
                    {items.map((a, idx) => (
                      <div key={idx} className="boq-activity-item">
                        <span className="boq-activity-time">{String(a.time)}</span>
                        <span className="boq-activity-dot" style={{ background: String(a.dotColor || "#94a3b8") }} />
                        <div className="boq-activity-user">
                          <span className="au-name">{String(a.user)}</span>
                          <span className="au-role">{String(a.role)}</span>
                        </div>
                        <div className="boq-activity-content">
                          <div className="ac-title" dangerouslySetInnerHTML={{ __html: String(a.title) }} />
                          <div className="ac-detail">{String(a.detail || "")}</div>
                          {Boolean(a.rateChange) && (
                            <div className="ac-rate-change">
                              <span className="old-rate">{String((a.rateChange as Record<string, string>).old)}</span>
                              {" → "}
                              <span className="new-rate">{String((a.rateChange as Record<string, string>).new)}</span>
                            </div>
                          )}
                          {Boolean(a.link) && <span className="ac-link" onClick={() => setNotice(String(a.link))}>{String(a.link)}</span>}
                        </div>
                        <div className="boq-activity-category">
                          <span className="acat-label">
                            {String(a.category) === "System" && <Settings size={13} />}
                            {String(a.category) === "Versions" && <Copy size={13} />}
                            {String(a.category) === "Costing & BOQ" && <DollarSign size={13} />}
                            {String(a.category) === "Workflow" && <CheckSquare size={13} />}
                            {String(a.category) === "Access" && <ShieldCheck size={13} />}
                            {String(a.category) === "Publishing" && <Share2 size={13} />}
                            {String(a.category)}
                          </span>
                          {Boolean(a.categorySub) && <span className="acat-sub">{String(a.categorySub)}</span>}
                        </div>
                        <MoreHorizontal size={14} color="#94a3b8" style={{ flexShrink: 0, cursor: "pointer" }} />
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
            );
          })()}
        </div>
      </div>

      {/* Use Template Modal */}
      {useModalOpen && (
        <div className="template-use-modal">
          <div className="tum-overlay" onClick={() => setUseModalOpen(false)} />
          <div className="tum-content">
            <header>
              <h3>Use BOQ Template: {template.name}</h3>
              <button className="tum-close" onClick={() => setUseModalOpen(false)}><X size={20} /></button>
            </header>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setNotice(`Successfully created project and BOQ from ${template.name}.`);
              setUseModalOpen(false);
            }}>
              <div className="tum-body">
                <p className="tum-desc">
                  Create a new project pre-populated with this BOQ template's {template.sections} sections and {template.items} items.
                </p>
                <div className="tum-field">
                  <label>Project Name <span className="req">*</span></label>
                  <input required placeholder="ex. Oberoi Sky City 4BHK" />
                </div>
                <div className="tum-field">
                  <label>Client Name <span className="req">*</span></label>
                  <input required placeholder="ex. Vikram Malhotra" />
                </div>
                <div className="tum-field">
                  <label>Location</label>
                  <input placeholder="ex. Mumbai, Maharashtra" />
                </div>
              </div>
              <footer>
                <button type="button" onClick={() => setUseModalOpen(false)} className="tum-cancel">Cancel</button>
                <button type="submit" className="primary">Create Project &amp; BOQ</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {addItemModal && (
        <div className="template-use-modal">
          <div className="tum-overlay" onClick={() => setAddItemModal(false)} />
          <div className="tum-content">
            <header>
              <h3>Add Item to {selectedSection} &gt; {selectedCategory}</h3>
              <button className="tum-close" onClick={() => setAddItemModal(false)}><X size={20} /></button>
            </header>
            <form onSubmit={(e) => {
              e.preventDefault();
              setNotice("Item added to BOQ structure.");
              setAddItemModal(false);
            }}>
              <div className="tum-body">
                <div className="tum-field">
                  <label>Item Name <span className="req">*</span></label>
                  <input required placeholder="ex. Custom Headboard" />
                </div>
                <div className="tum-field">
                  <label>Unit &amp; Quantity</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input style={{ flex: 1 }} defaultValue="Nos" placeholder="Unit" />
                    <input style={{ flex: 1 }} type="number" defaultValue="1" placeholder="Qty" />
                  </div>
                </div>
                <div className="tum-field">
                  <label>Rate (₹)</label>
                  <input type="number" defaultValue="15000" />
                </div>
              </div>
              <footer>
                <button type="button" onClick={() => setAddItemModal(false)} className="tum-cancel">Cancel</button>
                <button type="submit" className="primary">Add Item</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {addSectionModal && (
        <div className="template-use-modal">
          <div className="tum-overlay" onClick={() => setAddSectionModal(false)} />
          <div className="tum-content">
            <header>
              <h3>Add BOQ Section</h3>
              <button className="tum-close" onClick={() => setAddSectionModal(false)}><X size={20} /></button>
            </header>
            <form onSubmit={(e) => {
              e.preventDefault();
              setNotice("Section added to BOQ structure.");
              setAddSectionModal(false);
            }}>
              <div className="tum-body">
                <div className="tum-field">
                  <label>Section Name <span className="req">*</span></label>
                  <input required placeholder="ex. Balcony / Terrace" />
                </div>
                <div className="tum-field">
                  <label>Initial Category</label>
                  <input defaultValue="Civil &amp; Waterproofing" />
                </div>
              </div>
              <footer>
                <button type="button" onClick={() => setAddSectionModal(false)} className="tum-cancel">Cancel</button>
                <button type="submit" className="primary">Create Section</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {notice && (
        <div className="projects-toast">
          {notice}
          <button onClick={() => setNotice(null)}><X size={16} /></button>
        </div>
      )}
    </main>
  );
}
