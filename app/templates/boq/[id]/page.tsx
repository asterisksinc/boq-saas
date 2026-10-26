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
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import {
  UseBoqTemplateModal,
  EditBoqTemplateModal,
  AddBoqSectionModal,
  AddBoqItemModal,
} from "@/components/templates/boq/BoqTemplateModals";
import BoqTemplateOverview from "@/components/templates/boq/BoqTemplateOverview";
import BoqTemplateStructure from "@/components/templates/boq/BoqTemplateStructure";
import BoqTemplateCosting from "@/components/templates/boq/BoqTemplateCosting";
import BoqTemplateRules from "@/components/templates/boq/BoqTemplateRules";
import BoqTemplateUsage from "@/components/templates/boq/BoqTemplateUsage";
import BoqTemplateVersions from "@/components/templates/boq/BoqTemplateVersions";
import BoqTemplateActivity from "@/components/templates/boq/BoqTemplateActivity";
import { duplicateBoqTemplate } from "@/lib/api/boqs";

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
  const searchParams = useSearchParams();
  const id = (params?.id as string) || "";

  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [template, setTemplate] = useState<BoqTemplateDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Handle tab change and sync to URL query parameter
  const handleTabChange = (t: string) => {
    setActiveTab(t);
    if (typeof window !== "undefined") {
      const tabSlug = t.toLowerCase().replace(/\s+/g, "-");
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabSlug);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Sync activeTab from URL search params on mount or param update
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam) {
      const matched = tabs.find(
        (t) =>
          t.toLowerCase().replace(/\s+/g, "-") === tabParam.toLowerCase() ||
          t.toLowerCase() === tabParam.toLowerCase()
      );
      if (matched && matched !== activeTab) {
        setActiveTab(matched);
      }
    }
  }, [searchParams]);

  // BOQ Structure state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ "Master Bedroom": true });
  const [selectedSection, setSelectedSection] = useState<string>("Master Bedroom");
  const [selectedCategory, setSelectedCategory] = useState<string>("Furniture");
  const [structureSearch, setStructureSearch] = useState("");
  const [useModalOpen, setUseModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addItemModal, setAddItemModal] = useState(false);
  const [addSectionModal, setAddSectionModal] = useState(false);
  const [itemPage, setItemPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(10);

  // Item Inspector state (BOQ Structure tab)
  const [selectedItem, setSelectedItem] = useState<BoqItem | null>(null);
  const [inspectorTab, setInspectorTab] = useState<string>("General");


  // Usage tab state
  const [usageSearch, setUsageSearch] = useState("");

  // Costing tab state
  const [costingSearch, setCostingSearch] = useState("");

  // Activity tab state
  const [activityFilter, setActivityFilter] = useState<string>("All");
  const [activitySearch, setActivitySearch] = useState("");

  const fetchTemplate = async () => {
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

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchTemplate();
    }
  }, [id]);

  // Set default selected room and category when template loads
  useEffect(() => {
    if (template?.rooms && template.rooms.length > 0) {
      const roomExists = template.rooms.some(r => r.name === selectedSection);
      if (!roomExists || !selectedSection) {
        const firstRoom = template.rooms[0];
        setSelectedSection(firstRoom.name);
        setExpandedSections(prev => ({ ...prev, [firstRoom.name]: true }));
        if (firstRoom.categories && firstRoom.categories.length > 0) {
          setSelectedCategory(firstRoom.categories[0].name);
        }
      }
    }
  }, [template]);

  const handleDuplicate = async () => {
    if (!template || duplicating) return;
    try {
      setDuplicating(true);
      const res = await duplicateBoqTemplate(template.id);
      setNotice(`Template "${template.name}" duplicated successfully.`);
      if (res?.id) {
        router.push(`/templates/boq/${res.id}`);
      } else {
        fetchTemplate();
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to duplicate template.");
    } finally {
      setDuplicating(false);
    }
  };

  const discipline = useMemo(() => {
    return template?.tags?.find(t => ["Interior Design", "Civil & Structural", "MEP", "Architecture"].includes(t)) || "Interior Design";
  }, [template]);

  const tier = useMemo(() => {
    return template?.tags?.find(t => ["Premium", "Luxury", "Standard", "Affordable", "High-End"].includes(t)) || "Premium";
  }, [template]);

  // Current selected category items
  const currentCategoryData = useMemo(() => {
    if (!template?.rooms) return null;
    const room = template.rooms.find(r => r.name === selectedSection) || template.rooms[0];
    if (!room) return null;
    const cat = room.categories?.find(c => c.name === selectedCategory) || room.categories?.[0];
    return { room, cat, items: cat?.items || [] };
  }, [template, selectedSection, selectedCategory]);

  const categoryItems = useMemo(() => {
    return currentCategoryData?.items || [];
  }, [currentCategoryData]);

  const totalCategoryQty = useMemo(() => {
    return categoryItems.reduce((acc, it) => acc + Number(it.quantity || 0), 0);
  }, [categoryItems]);

  const totalCategoryAmount = useMemo(() => {
    return categoryItems.reduce((acc, it) => {
      const qty = Number(it.quantity || 0);
      const rate = Number(it.rate || 0);
      const waste = Number(it.wastePercent || 0);
      const tax = Number(it.taxPercent || 0);
      const amt = it.amount ? Number(it.amount) : Math.round(qty * rate * (1 + waste / 100) * (1 + tax / 100));
      return acc + amt;
    }, 0);
  }, [categoryItems]);

  const paginatedItems = useMemo(() => {
    const start = (itemPage - 1) * itemPageSize;
    return categoryItems.slice(start, start + itemPageSize);
  }, [categoryItems, itemPage, itemPageSize]);

  const totalItemPages = Math.max(1, Math.ceil(categoryItems.length / itemPageSize));

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
        <div className="fig-dashboard-main">
          <DashboardHeader title="Templates" onNew={() => {}} />
          <div className="boq-detail-page-shell boq-page-shell">
            {/* Back link skeleton */}
            <div className="boq-skeleton-line" style={{ width: 140, height: 20, marginBottom: 8 }} />

            {/* Header row skeleton */}
            <div className="boq-detail-header-row">
              <div className="boq-detail-title-group" style={{ gap: 10 }}>
                <div className="boq-skeleton-title" style={{ width: 340, height: 29 }} />
                <div className="boq-skeleton-line" style={{ width: 420, height: 18 }} />
                <div className="boq-skeleton-line" style={{ width: 500, height: 18 }} />
              </div>
              <div className="boq-detail-header-actions">
                <div className="boq-skeleton-box" style={{ width: 48, height: 46 }} />
                <div className="boq-skeleton-box" style={{ width: 48, height: 46 }} />
                <div className="boq-skeleton-box" style={{ width: 115, height: 46 }} />
              </div>
            </div>

            {/* Tabs bar skeleton */}
            <div className="boq-skeleton-tabs" style={{ width: 851, height: 46, display: "flex", alignItems: "center", padding: "6px", gap: 6 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="boq-skeleton-line" style={{ width: i === 0 ? 110 : 90, height: 34, borderRadius: 4 }} />
              ))}
            </div>

            {/* 4 KPI cards skeleton */}
            <div className="boq-kpi-row">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="boq-kpi-card boq-skeleton-card" style={{ height: 106, padding: 16 }}>
                  <div className="boq-skeleton-line" style={{ width: 80, height: 16, marginBottom: 12 }} />
                  <div className="boq-skeleton-title" style={{ width: 120, height: 26, marginBottom: 8 }} />
                  <div className="boq-skeleton-line" style={{ width: 100, height: 14 }} />
                </div>
              ))}
            </div>

            {/* 3x3 cards grid skeleton */}
            <div className="boq-row-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="boq-card boq-skeleton-card" style={{ height: 250, padding: 24 }}>
                  <div className="boq-skeleton-line" style={{ width: 140, height: 20, marginBottom: 16 }} />
                  <div className="boq-skeleton-box" style={{ width: "100%", height: 140 }} />
                </div>
              ))}
            </div>
            <div className="boq-row-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="boq-card boq-skeleton-card" style={{ height: 250, padding: 24 }}>
                  <div className="boq-skeleton-line" style={{ width: 140, height: 20, marginBottom: 16 }} />
                  <div className="boq-skeleton-box" style={{ width: "100%", height: 140 }} />
                </div>
              ))}
            </div>
            <div className="boq-row-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="boq-card boq-skeleton-card" style={{ height: 250, padding: 24 }}>
                  <div className="boq-skeleton-line" style={{ width: 140, height: 20, marginBottom: 16 }} />
                  <div className="boq-skeleton-box" style={{ width: "100%", height: 140 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!template) {
    return (
      <main className="fig-dashboard boq-dashboard">
        <div className="fig-dashboard-glow" />
        <DashboardRail />
        <div className="fig-dashboard-main">
          <DashboardHeader title="Templates" onNew={() => router.push("/templates")} />
          <div className="boq-detail-page-shell boq-page-shell">
            <div className="boq-error-state">
              <div className="boq-error-icon">
                <AlertTriangle size={28} />
              </div>
              <h2 className="boq-error-title">BOQ Template Not Found</h2>
              <p className="boq-error-desc">
                The BOQ template you are trying to view does not exist or has been removed.
              </p>
              <div className="boq-error-actions">
                <button
                  type="button"
                  className="boq-detail-use-btn"
                  onClick={() => {
                    setLoading(true);
                    fetchTemplate();
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <RefreshCw size={16} /> Retry
                </button>
                <button
                  type="button"
                  className="boq-detail-action-icon-btn"
                  style={{ width: "auto", padding: "0 16px", height: 46 }}
                  onClick={() => router.push("/templates?tab=boqs")}
                >
                  Back to BOQ Templates
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="fig-dashboard boq-dashboard">
      <div className="fig-dashboard-glow" />
      <DashboardRail />
      <div className="fig-dashboard-main">
        <DashboardHeader title="Templates" onNew={() => setUseModalOpen(true)} />

        <div className="boq-detail-page-shell boq-page-shell">
          {/* Breadcrumb / Back Navigation */}
          <button
            type="button"
            className="boq-detail-back-link"
            onClick={() => router.push("/templates?tab=boqs")}
            aria-label="Back to BOQ Templates"
          >
            <ArrowLeft size={16} /> <span>BOQ Templates</span>
          </button>

          {/* Header row */}
          <div className="boq-detail-header-row">
            <div className="boq-detail-title-group">
              <h1 className="boq-detail-title">{template.name}</h1>
              <div className="boq-detail-meta-line">
                <span className="boq-detail-code">{template.templateCode}</span>
                <span className="boq-detail-dot">•</span>
                <span>{template.category || template.projectType || "Residential"}</span>
                <span className="boq-detail-dot">•</span>
                <span>{discipline}</span>
                <span className="boq-detail-dot">•</span>
                <span>{tier}</span>
              </div>
              <p className="boq-detail-desc">{template.description}</p>
            </div>

            <div className="boq-detail-header-actions">
              <button 
                type="button"
                className="boq-detail-action-icon-btn" 
                title={duplicating ? "Duplicating..." : "Duplicate"}
                aria-label="Duplicate template"
                disabled={duplicating}
                onClick={handleDuplicate}
              >
                {duplicating ? <RefreshCw size={20} className="boq-spin" /> : <Copy size={20} />}
              </button>
              <button 
                type="button"
                className="boq-detail-action-icon-btn" 
                title="Edit"
                aria-label="Edit template"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit3 size={20} />
              </button>
              <button 
                type="button"
                className="boq-detail-use-btn"
                aria-label="Use template"
                onClick={() => setUseModalOpen(true)}
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Tabs Bar */}
          <div className="boq-detail-tabs-bar" role="tablist">
            {tabs.map(t => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={activeTab === t}
                className={`boq-detail-tab-pill ${activeTab === t ? "active" : ""}`}
                onClick={() => handleTabChange(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* =========================================================================
              TAB 1: OVERVIEW (Figma Exact Redesign)
             ========================================================================= */}
          {activeTab === "Overview" && (
            <BoqTemplateOverview
              template={template}
              onNavigateTab={(tab) => handleTabChange(tab)}
              onNotice={(msg) => setNotice(msg)}
            />
          )}

          {/* =========================================================================
              TAB 2: BOQ STRUCTURE (Figma Exact Redesign)
             ========================================================================= */}
          {activeTab === "BOQ Structure" && (
            <BoqTemplateStructure
              template={template}
              onAddSection={() => setAddSectionModal(true)}
              onAddItem={() => setAddItemModal(true)}
              onRefresh={fetchTemplate}
              onNotice={(msg) => setNotice(msg)}
              onNavigateTab={(tab) => handleTabChange(tab)}
            />
          )}

          {/* =========================================================================
              TAB 3: COSTING (Figma Exact Redesign)
             ========================================================================= */}
          {activeTab === "Costing" && (
            <BoqTemplateCosting
              template={template}
              onRefresh={fetchTemplate}
              onNotice={(msg) => setNotice(msg)}
              onNavigateTab={(tab) => handleTabChange(tab)}
            />
          )}

          {/* =========================================================================
              RULES TAB (FIGMA REDESIGN)
              Templates - Project Templates - BOQ Template - Template Detail - Rules
              Frame 2147225198, 2147225138, 2147225291, 2147225085
              ========================================================================= */}
          {activeTab === "Rules" && (
            <BoqTemplateRules
              template={template}
              onRefresh={fetchTemplate}
              onNotice={(msg) => setNotice(msg)}
              onNavigateTab={(tab) => handleTabChange(tab)}
            />
          )}


          {/* =========================================================================
              TAB 5: USAGE (FIGMA EXACT REDESIGN)
              Templates - Project Templates - BOQ Template - Template Detail - Useage
              Frame 2147225198, 2147225138, 2147225292, 2147225069, 2147225291
              ========================================================================= */}
          {activeTab === "Usage" && (
            <BoqTemplateUsage
              template={template}
              onRefresh={fetchTemplate}
              onNotice={(msg) => setNotice(msg)}
              onNavigateTab={(tab) => handleTabChange(tab)}
            />
          )}

          {/* =========================================================================
              VERSIONS TAB (FIGMA EXACT REDESIGN)
              Templates - Project Templates - BOQ Template - Template Detail - Versions
              Canvas: 1440px wide, #F1F5F9, Frame 2147224971 (1326px container)
              ========================================================================= */}
          {activeTab === "Versions" && (
            <BoqTemplateVersions
              template={template}
              onRefresh={fetchTemplate}
              onNotice={(msg) => setNotice(msg)}
              onNavigateTab={(tab) => handleTabChange(tab)}
            />
          )}

          {/* =========================================================================
              ACTIVITY TAB (FIGMA EXACT REDESIGN)
              Templates - Project Templates - BOQ Template - Template Detail - Activity
              Canvas: 1440px wide, #F1F5F9, Frame 2147224971
              ========================================================================= */}
          {activeTab === "Activity" && (
            <BoqTemplateActivity
              template={template}
              onRefresh={fetchTemplate}
              onNotice={(msg) => setNotice(msg)}
              onNavigateTab={(tab) => handleTabChange(tab)}
              onOpenVersion={(ver) => {
                handleTabChange("Versions");
                if (typeof window !== "undefined") {
                  const u = new URL(window.location.href);
                  u.searchParams.set("tab", "Versions");
                  u.searchParams.set("version", ver);
                  window.history.pushState({}, "", u.toString());
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Use Template Modal */}
      {useModalOpen && template && (
        <UseBoqTemplateModal
          isOpen={useModalOpen}
          template={template as any}
          onClose={() => setUseModalOpen(false)}
          onSuccess={() => {
            setUseModalOpen(false);
            setNotice(`Successfully created project and BOQ from ${template.name}.`);
            router.push("/projects");
          }}
        />
      )}

      {/* Edit Template Modal */}
      {editModalOpen && template && (
        <EditBoqTemplateModal
          isOpen={editModalOpen}
          template={template as any}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => {
            setEditModalOpen(false);
            setNotice("Template updated successfully.");
            fetchTemplate();
          }}
        />
      )}

      {/* Add Item Modal */}
      {addItemModal && template && (
        <AddBoqItemModal
          isOpen={addItemModal}
          templateId={template.id}
          sectionName={selectedSection}
          categoryName={selectedCategory}
          onClose={() => setAddItemModal(false)}
          onSuccess={() => {
            setAddItemModal(false);
            setNotice("Item added to BOQ structure.");
            fetchTemplate();
          }}
        />
      )}

      {/* Add Section Modal */}
      {addSectionModal && template && (
        <AddBoqSectionModal
          isOpen={addSectionModal}
          templateId={template.id}
          onClose={() => setAddSectionModal(false)}
          onSuccess={(newSectionName) => {
            setAddSectionModal(false);
            setNotice(`Section "${newSectionName}" added to BOQ structure.`);
            setSelectedSection(newSectionName);
            setExpandedSections(prev => ({ ...prev, [newSectionName]: true }));
            fetchTemplate();
          }}
        />
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
