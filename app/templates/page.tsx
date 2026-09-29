"use client";

import React, { useState, useEffect, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Plus,
  MoreHorizontal,
  Play,
  Edit3,
  Copy,
  Trash2,
  Eye,
  List,
  LayoutGrid,
  X,
  RotateCcw,
  FileText,
} from "lucide-react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import NewTemplateModal from "@/components/templates/NewTemplateModal";
import ExcelImportModal from "@/components/templates/ExcelImportModal";
import TemplateFilterPopover, { TemplateFilterState } from "@/components/templates/TemplateFilterPopover";
import {
  getTemplatesOverview,
  listProjectTemplates,
  duplicateProjectTemplate,
  archiveProjectTemplate,
  restoreProjectTemplate,
  deleteProjectTemplatePermanently,
  useProjectTemplate,
} from "@/lib/api/templates";

// ── Types ──────────────────────────────────────────────────────────

type ProjectTemplate = {
  id: string;
  templateCode: string;
  name: string;
  description: string;
  businessType: string;
  projectType: string;
  team?: string | null;
  region?: string | null;
  visibility?: string;
  imageUrl?: string | null;
  tags?: string[];
  status: string;
  version: number;
  useCount: number;
  usageCount?: number;
  roomCount?: number;
  sectionCount?: number;
  itemCount?: number;
  composition?: {
    rooms: number;
    boqSections: number;
    items: number;
    stages?: number;
    tasks?: number;
    documents?: number;
  };
  lastUsedAt?: string | null;
  updatedAt: string;
  createdAt?: string;
};

type BoqTemplate = {
  id: string;
  name: string;
  description: string;
  category?: string;
  projectType?: string;
  status?: string;
  version?: string;
  usedIn?: string;
  tags?: string[];
  useCount: number;
  sections?: number;
  items?: number;
  updatedAt?: string;
  imageUrl?: string | null;
};

type DocumentTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  useCount: number;
  updatedAt: string;
  imageUrl?: string | null;
};

type ArchivedTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  templateType: string;
  version: string;
  archivedBy: string;
  archivedByRole: string;
  archivedOn: string;
  archivedRelative: string;
  usedIn: string;
  imageUrl?: string | null;
};

type OverviewData = {
  total: number;
  active: number;
  draft: number;
  needsReview: number;
  byType: Record<string, number>;
  recentlyUsed: ProjectTemplate[];
  projectTemplatesCount?: number;
  boqTemplatesCount?: number;
  documentTemplatesCount?: number;
  recentlyUpdatedCount?: number;
  mostUsedProject?: string | null;
  mostUsedBoq?: string | null;
  mostUsedDoc?: string | null;
  lastUpdatedName?: string | null;
};

// ── Fallback Images Curated for Real Estate / Architecture ─────────

const fallbackImages: Record<string, string> = {
  Residential: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "3BHK": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
  Villa: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
  Commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  Kitchen: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
  Hospitality: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
  Retail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
  Default: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
};

function getTemplateCover(t: { imageUrl?: string | null; businessType?: string; name?: string }): string {
  if (t.imageUrl) return t.imageUrl;
  const name = t.name?.toLowerCase() || "";
  if (name.includes("kitchen")) return fallbackImages.Kitchen;
  if (name.includes("villa")) return fallbackImages.Villa;
  if (name.includes("3bhk") || name.includes("residential")) return fallbackImages["3BHK"];
  if (name.includes("commercial") || name.includes("office")) return fallbackImages.Commercial;
  return fallbackImages[t.businessType || ""] || fallbackImages.Default;
}

// ── Main Page Component ───────────────────────────────────────────

export default function TemplatesPage() {
  const router = useRouter();

  // Navigation tab: Overview | Project Templates | BOQ Templates | Document Templates | Archived
  const [tab, setTab] = useState<"overview" | "projects" | "boqs" | "documents" | "archived">("overview");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals & Popovers
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [useModalTemplate, setUseModalTemplate] = useState<ProjectTemplate | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Filter State
  const [filters, setFilters] = useState<TemplateFilterState>({
    businessType: "",
    status: "",
    region: "",
  });

  // Data States
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // BOQ Templates State
  const [boqTemplates, setBoqTemplates] = useState<BoqTemplate[]>([]);
  const [boqPage, setBoqPage] = useState(1);
  const [boqTotal, setBoqTotal] = useState(0);

  // Document Templates State
  const [docTemplates, setDocTemplates] = useState<DocumentTemplate[]>([]);

  // Archived Templates State
  const [archivedTemplates, setArchivedTemplates] = useState<ArchivedTemplate[]>([]);
  const [archivedTotal, setArchivedTotal] = useState(0);

  // ── Loaders ─────────────────────────────────────────────────────

  const loadOverview = async () => {
    try {
      const data = await getTemplatesOverview();
      setOverview(data);
    } catch {
      // Keep existing overview or fallback
    }
  };

  const loadProjectTemplates = async () => {
    try {
      const res = await listProjectTemplates({
        search: query || undefined,
        status: filters.status || undefined,
        type: filters.businessType || undefined,
        page,
        pageSize,
      });
      setProjectTemplates(res.items || []);
      setTotal(res.total || 0);
      setHasMore(res.hasMore || false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load project templates.";
      setNotice(msg);
    }
  };

  const loadBoqTemplates = async () => {
    try {
      const p = new URLSearchParams({ page: boqPage.toString(), pageSize: "12" });
      if (query) p.set("search", query);
      const r = await fetch(`/api/v1/boq-templates?${p}`, { credentials: "include" });
      const b = await r.json();
      if (!r.ok) throw new Error(b?.message || "Could not load BOQ templates.");
      setBoqTemplates(b.data?.items || []);
      setBoqTotal(b.data?.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load BOQ templates.";
      setNotice(msg);
    }
  };

  const loadDocTemplates = async () => {
    try {
      const r = await fetch("/api/v1/proposals?status=all&sourceType=template", { credentials: "include" });
      if (r.ok) {
        const b = await r.json();
        const items = (b.data?.items || []).map((item: any) => ({
          id: item.id,
          name: item.projectName || "Standard Proposal Template",
          description: `Document layout with ${item.scopeItems?.length || 4} scope sections`,
          category: "Proposal",
          type: "DOCUMENT TEMPLATE",
          useCount: item.viewCount || 8,
          updatedAt: item.updatedAt || new Date().toISOString(),
          imageUrl: fallbackImages.Commercial,
        }));
        setDocTemplates(items);
      } else {
        // Fallback default document templates
        setDocTemplates([
          {
            id: "doc-1",
            name: "BOQ (Detailed) Template",
            description: "Standard detailed BOQ export format with client signoff blocks",
            category: "BOQ Layout",
            type: "DOCUMENT TEMPLATE",
            useCount: 36,
            updatedAt: new Date().toISOString(),
            imageUrl: fallbackImages.Residential,
          },
          {
            id: "doc-2",
            name: "Invoice Standard Layout",
            description: "GST-compliant commercial tax invoice layout with milestones",
            category: "Invoice",
            type: "DOCUMENT TEMPLATE",
            useCount: 24,
            updatedAt: new Date().toISOString(),
            imageUrl: fallbackImages.Commercial,
          },
        ]);
      }
    } catch {
      // Ignored
    }
  };

  const loadArchived = async () => {
    try {
      const p = new URLSearchParams();
      if (query) p.set("search", query);
      const r = await fetch(`/api/v1/archived-templates?${p}`, { credentials: "include" });
      const b = await r.json();
      if (!r.ok) throw new Error(b?.message || "Could not load archived templates.");
      setArchivedTemplates(b.data?.items || []);
      setArchivedTotal(b.data?.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load archived templates.";
      setNotice(msg);
    }
  };

  // Trigger loading based on active tab and search query
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      if (tab === "overview") {
        Promise.all([loadOverview(), loadBoqTemplates()]).finally(() => setLoading(false));
      } else if (tab === "projects") {
        loadProjectTemplates().finally(() => setLoading(false));
      } else if (tab === "boqs") {
        loadBoqTemplates().finally(() => setLoading(false));
      } else if (tab === "documents") {
        loadDocTemplates().finally(() => setLoading(false));
      } else if (tab === "archived") {
        loadArchived().finally(() => setLoading(false));
      }
    }, query ? 250 : 0);

    return () => clearTimeout(timer);
  }, [tab, query, page, boqPage, filters]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleDocumentClick = () => {
      setMenuId(null);
      setIsFilterOpen(false);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // ── Actions ─────────────────────────────────────────────────────

  const handleDuplicate = async (t: ProjectTemplate) => {
    try {
      await duplicateProjectTemplate(t.id);
      setNotice(`Template "${t.name}" duplicated.`);
      if (tab === "overview") loadOverview();
      else loadProjectTemplates();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to duplicate template.");
    } finally {
      setMenuId(null);
    }
  };

  const handleArchive = async (t: ProjectTemplate) => {
    if (!window.confirm(`Are you sure you want to archive "${t.name}"?`)) return;
    try {
      await archiveProjectTemplate(t.id);
      setNotice(`Template "${t.name}" archived.`);
      if (tab === "overview") loadOverview();
      else loadProjectTemplates();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to archive template.");
    } finally {
      setMenuId(null);
    }
  };

  const handleRestore = async (t: { id: string; name: string }) => {
    try {
      await restoreProjectTemplate(t.id);
      setNotice(`Template "${t.name}" restored to library.`);
      loadArchived();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to restore template.");
    } finally {
      setMenuId(null);
    }
  };

  const handleDeletePermanently = async (t: { id: string; name: string }) => {
    if (!window.confirm(`Permanently delete "${t.name}"? This cannot be undone.`)) return;
    try {
      await deleteProjectTemplatePermanently(t.id);
      setNotice(`Template "${t.name}" permanently deleted.`);
      loadArchived();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to delete template.");
    } finally {
      setMenuId(null);
    }
  };

  // ── Render Helpers ──────────────────────────────────────────────

  const renderBadge = (type: string) => {
    const lower = (type || "").toLowerCase();
    if (lower.includes("boq")) {
      return <span className="target-badge-pill boq">BOQ TEMPLATE</span>;
    }
    if (lower.includes("document") || lower.includes("proposal")) {
      return <span className="target-badge-pill document">DOCUMENT TEMPLATE</span>;
    }
    return <span className="target-badge-pill project">PROJECT TEMPLATE</span>;
  };

  const renderCardMeta = (t: ProjectTemplate) => {
    const rooms = t.composition?.rooms ?? t.roomCount ?? 8;
    const sections = t.composition?.boqSections ?? t.sectionCount ?? 18;
    return `${rooms} Rooms · ${sections} BOQ Sections`;
  };

  return (
    <main className="fig-dashboard boq-dashboard">
      <div className="fig-dashboard-glow" />
      <DashboardRail />
      <div className="fig-dashboard-main">
        {/* Parent Global Header */}
        <DashboardHeader
          title="Templates"
          onNew={() => setIsNewModalOpen(true)}
          onSearch={(q) => setQuery(q)}
        />

        <section className="boq-page-shell templates-content">
          {/* Section 1: Template Library Header */}
          <div className="template-library-header">
            <div className="template-library-title-group">
              <h2>Template Library</h2>
              <p>Use templates to start projects, BOQs, and documents faster.</p>
            </div>

            {/* Template Controls Group matching Image 2 */}
            <div className="template-controls-group">
              {/* Search */}
              <div className="template-search-wrapper">
                <Search size={16} className="template-search-icon" />
                <input
                  type="text"
                  className="template-search-input"
                  placeholder="Search template by name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {/* Filter Button */}
              <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className={`template-icon-btn ${isFilterOpen ? "active" : ""}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  title="Filter templates"
                  aria-label="Filter templates"
                >
                  <SlidersHorizontal size={17} />
                </button>
                <TemplateFilterPopover
                  isOpen={isFilterOpen}
                  onClose={() => setIsFilterOpen(false)}
                  filters={filters}
                  onChange={setFilters}
                  onReset={() => setFilters({ businessType: "", status: "", region: "" })}
                />
              </div>

              {/* New Template Button */}
              <button
                type="button"
                className="template-btn-primary"
                onClick={() => setIsNewModalOpen(true)}
              >
                <Plus size={16} />
                <span>New Template</span>
              </button>

              {/* Import Excel Button */}
              <button
                type="button"
                className="template-btn-secondary"
                onClick={() => setIsImportModalOpen(true)}
              >
                <span>Import Excel</span>
              </button>
            </div>
          </div>

          {/* Section 2: Navigation Tabs Pill Bar */}
          <div className="template-nav-pill-track">
            <button
              type="button"
              className={`template-nav-pill ${tab === "overview" ? "active" : ""}`}
              onClick={() => { setTab("overview"); setQuery(""); }}
            >
              Overview
            </button>
            <button
              type="button"
              className={`template-nav-pill ${tab === "projects" ? "active" : ""}`}
              onClick={() => { setTab("projects"); setQuery(""); setPage(1); }}
            >
              Project Templates
            </button>
            <button
              type="button"
              className={`template-nav-pill ${tab === "boqs" ? "active" : ""}`}
              onClick={() => { setTab("boqs"); setQuery(""); setBoqPage(1); }}
            >
              BOQ Templates
            </button>
            <button
              type="button"
              className={`template-nav-pill ${tab === "documents" ? "active" : ""}`}
              onClick={() => { setTab("documents"); setQuery(""); }}
            >
              Document Templates
            </button>
            <button
              type="button"
              className={`template-nav-pill ${tab === "archived" ? "active" : ""}`}
              onClick={() => { setTab("archived"); setQuery(""); }}
            >
              Archived
            </button>
          </div>

          {/* Tab 1: Overview */}
          {tab === "overview" ? (
            <div>
              {/* RECENTLY USED TEMPLATES Section */}
              <div className="template-section-header">
                <h3 className="template-section-heading">RECENTLY USED TEMPLATES</h3>
                <button
                  type="button"
                  className="template-view-all-link"
                  onClick={() => setTab("projects")}
                >
                  View All →
                </button>
              </div>

              {loading ? (
                <div className="template-cards-grid">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="template-card-skeleton skeleton-shimmer" />
                  ))}
                </div>
              ) : (overview?.recentlyUsed && overview.recentlyUsed.length > 0) ? (
                <div className="template-cards-grid">
                  {overview.recentlyUsed.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      className="target-template-card"
                      onClick={() => router.push(`/templates/${t.id}`)}
                    >
                      <div className="target-card-img-wrap">
                        <img
                          src={getTemplateCover(t)}
                          alt={t.name}
                          className="target-card-img"
                          loading="lazy"
                        />
                      </div>
                      <div className="target-card-body">
                        <div className="target-card-top-row">
                          <h4 className="target-card-title" title={t.name}>{t.name}</h4>
                          {renderBadge(t.businessType)}
                        </div>
                        <p className="target-card-meta">{renderCardMeta(t)}</p>
                      </div>
                      <div className="target-card-footer">
                        <span className="target-card-used">
                          Used {t.useCount ?? t.usageCount ?? 0} Times
                        </span>
                        <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="target-card-menu-btn"
                            aria-label="More options"
                            onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {menuId === t.id && (
                            <div className="target-card-menu-dropdown">
                              <button onClick={() => { setMenuId(null); setUseModalTemplate(t); }}>
                                <Play size={14} /> Use Template
                              </button>
                              <button onClick={() => router.push(`/templates/${t.id}`)}>
                                <Edit3 size={14} /> Edit Template
                              </button>
                              <button onClick={() => handleDuplicate(t)}>
                                <Copy size={14} /> Duplicate
                              </button>
                              <button className="danger" onClick={() => handleArchive(t)}>
                                <Trash2 size={14} /> Archive
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="templates-empty" style={{ padding: "36px 20px", marginBottom: 32 }}>
                  <LayoutGrid size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                  <h3 style={{ fontSize: 16, margin: "0 0 6px 0", color: "#0f172a" }}>No recently used templates</h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px 0" }}>
                    Create your first template or import one from Excel.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="template-btn-primary" onClick={() => setIsNewModalOpen(true)}>
                      <Plus size={16} /> New Template
                    </button>
                    <button className="template-btn-secondary" onClick={() => setIsImportModalOpen(true)}>
                      Import Excel
                    </button>
                  </div>
                </div>
              )}

              {/* TEMPLATES BY TYPE Section (KPI Cards) */}
              <div className="template-section-header">
                <h3 className="template-section-heading">TEMPLATES BY TYPE</h3>
              </div>

              {loading ? (
                <div className="target-kpi-grid">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="template-card-skeleton skeleton-shimmer" style={{ height: 160 }} />
                  ))}
                </div>
              ) : (
                <div className="target-kpi-grid">
                  {/* Card 1: Project Templates */}
                  <div
                    className="target-kpi-card"
                    onClick={() => setTab("projects")}
                    tabIndex={0}
                    role="button"
                  >
                    <div className="target-kpi-label">Project Templates</div>
                    <div className="target-kpi-value">
                      {overview?.projectTemplatesCount ?? overview?.total ?? 0}
                    </div>
                    <div className="target-kpi-desc">
                      Start projects with pre-defined structure.
                    </div>
                    <div className="target-kpi-note">
                      Most Used: <b>{overview?.mostUsedProject || "None"}</b>
                    </div>
                  </div>

                  {/* Card 2: BOQ Templates */}
                  <div
                    className="target-kpi-card"
                    onClick={() => setTab("boqs")}
                    tabIndex={0}
                    role="button"
                  >
                    <div className="target-kpi-label">BOQ Templates</div>
                    <div className="target-kpi-value">
                      {overview?.boqTemplatesCount ?? boqTotal ?? 7}
                    </div>
                    <div className="target-kpi-desc">
                      Reusable BOQ Sections and item structures.
                    </div>
                    <div className="target-kpi-note">
                      Most Used: <b>{overview?.mostUsedBoq || "Kitchen BOQ Template"}</b>
                    </div>
                  </div>

                  {/* Card 3: Document Templates */}
                  <div
                    className="target-kpi-card"
                    onClick={() => setTab("documents")}
                    tabIndex={0}
                    role="button"
                  >
                    <div className="target-kpi-label">Document Templates</div>
                    <div className="target-kpi-value">
                      {overview?.documentTemplatesCount ?? docTemplates.length ?? 1}
                    </div>
                    <div className="target-kpi-desc">
                      Branded BOQ, proposals, and invoice layouts.
                    </div>
                    <div className="target-kpi-note">
                      Most Used: <b>{overview?.mostUsedDoc || "BOQ (Detailed)"}</b>
                    </div>
                  </div>

                  {/* Card 4: Recently Updated */}
                  <div className="target-kpi-card">
                    <div className="target-kpi-label">Recently Updated</div>
                    <div className="target-kpi-value">
                      {overview?.recentlyUpdatedCount ?? 0}
                    </div>
                    <div className="target-kpi-subdesc">in last 7 Days</div>
                    <div className="target-kpi-note">
                      Updated: <b>{overview?.lastUpdatedName || "Invoice Standard"}</b>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : tab === "projects" ? (
            /* Tab 2: Project Templates */
            <div>
              <div className="templates-toolbar" style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  Showing {projectTemplates.length} of {total} templates
                </span>
                <div className="view-switch" style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 3, borderRadius: 8 }}>
                  <button
                    type="button"
                    style={{
                      background: view === "grid" ? "#ffffff" : "transparent",
                      border: "none",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: view === "grid" ? "#2563eb" : "#64748b",
                    }}
                    onClick={() => setView("grid")}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    type="button"
                    style={{
                      background: view === "list" ? "#ffffff" : "transparent",
                      border: "none",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: view === "list" ? "#2563eb" : "#64748b",
                    }}
                    onClick={() => setView("list")}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="template-cards-grid">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="template-card-skeleton skeleton-shimmer" />
                  ))}
                </div>
              ) : projectTemplates.length === 0 ? (
                <div className="templates-empty">
                  <LayoutGrid size={48} color="#cbd5e1" />
                  <h3>No templates found</h3>
                  <p>{query ? "Try adjusting your search or filters." : "Create your first template to get started."}</p>
                  <button className="template-btn-primary" onClick={() => setIsNewModalOpen(true)}>
                    <Plus size={16} /> New Template
                  </button>
                </div>
              ) : view === "grid" ? (
                <div className="template-cards-grid">
                  {projectTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="target-template-card"
                      onClick={() => router.push(`/templates/${t.id}`)}
                    >
                      <div className="target-card-img-wrap">
                        <img
                          src={getTemplateCover(t)}
                          alt={t.name}
                          className="target-card-img"
                          loading="lazy"
                        />
                      </div>
                      <div className="target-card-body">
                        <div className="target-card-top-row">
                          <h4 className="target-card-title" title={t.name}>{t.name}</h4>
                          {renderBadge(t.businessType)}
                        </div>
                        <p className="target-card-meta">{renderCardMeta(t)}</p>
                      </div>
                      <div className="target-card-footer">
                        <span className="target-card-used">
                          Used {t.useCount ?? t.usageCount ?? 0} Times
                        </span>
                        <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="target-card-menu-btn"
                            onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {menuId === t.id && (
                            <div className="target-card-menu-dropdown">
                              <button onClick={() => { setMenuId(null); setUseModalTemplate(t); }}>
                                <Play size={14} /> Use Template
                              </button>
                              <button onClick={() => router.push(`/templates/${t.id}`)}>
                                <Edit3 size={14} /> Edit Template
                              </button>
                              <button onClick={() => handleDuplicate(t)}>
                                <Copy size={14} /> Duplicate
                              </button>
                              <button className="danger" onClick={() => handleArchive(t)}>
                                <Trash2 size={14} /> Archive
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="template-table-wrap">
                  <table className="template-table">
                    <thead>
                      <tr>
                        <th>TEMPLATE NAME</th>
                        <th>TYPE</th>
                        <th>ROOMS</th>
                        <th>SECTIONS</th>
                        <th>USED</th>
                        <th>STATUS</th>
                        <th>UPDATED</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {projectTemplates.map((t) => (
                        <tr key={t.id} onClick={() => router.push(`/templates/${t.id}`)}>
                          <td>
                            <div className="template-name-cell">
                              <img src={getTemplateCover(t)} alt="" />
                              <div className="info">
                                <h4>{t.name}</h4>
                                <p>{t.description || "No description provided"}</p>
                              </div>
                            </div>
                          </td>
                          <td>{renderBadge(t.businessType)}</td>
                          <td>{t.composition?.rooms ?? t.roomCount ?? 0}</td>
                          <td>{t.composition?.boqSections ?? t.sectionCount ?? 0}</td>
                          <td>{t.useCount ?? t.usageCount ?? 0} times</td>
                          <td>
                            <span className={`template-status ${t.status?.toLowerCase() || "draft"}`}>
                              {(t.status || "DRAFT").toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {t.updatedAt ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(t.updatedAt)) : "—"}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="target-card-menu-btn"
                              onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {menuId === t.id && (
                              <div className="target-card-menu-dropdown" style={{ right: 20 }}>
                                <button onClick={() => { setMenuId(null); setUseModalTemplate(t); }}>
                                  <Play size={14} /> Use Template
                                </button>
                                <button onClick={() => router.push(`/templates/${t.id}`)}>
                                  <Edit3 size={14} /> Edit Template
                                </button>
                                <button onClick={() => handleDuplicate(t)}>
                                  <Copy size={14} /> Duplicate
                                </button>
                                <button className="danger" onClick={() => handleArchive(t)}>
                                  <Trash2 size={14} /> Archive
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="templates-pagination">
                    <span className="total">Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}</span>
                    <div className="pages">
                      <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                      <button className="active">{page}</button>
                      <button disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : tab === "boqs" ? (
            /* Tab 3: BOQ Templates */
            <div>
              {loading ? (
                <div className="template-cards-grid">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="template-card-skeleton skeleton-shimmer" />
                  ))}
                </div>
              ) : boqTemplates.length === 0 ? (
                <div className="templates-empty">
                  <LayoutGrid size={48} color="#cbd5e1" />
                  <h3>No BOQ templates found</h3>
                  <p>Create or import a BOQ template to get started.</p>
                  <button className="template-btn-primary" onClick={() => setIsNewModalOpen(true)}>
                    <Plus size={16} /> New BOQ Template
                  </button>
                </div>
              ) : (
                <div className="template-cards-grid">
                  {boqTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="target-template-card"
                      onClick={() => router.push(`/templates/boq/${t.id}`)}
                    >
                      <div className="target-card-img-wrap">
                        <img
                          src={getTemplateCover(t)}
                          alt={t.name}
                          className="target-card-img"
                          loading="lazy"
                        />
                      </div>
                      <div className="target-card-body">
                        <div className="target-card-top-row">
                          <h4 className="target-card-title" title={t.name}>{t.name}</h4>
                          <span className="target-badge-pill boq">BOQ TEMPLATE</span>
                        </div>
                        <p className="target-card-meta">
                          {t.sections || 12} Sections · {t.items || 86} Items
                        </p>
                      </div>
                      <div className="target-card-footer">
                        <span className="target-card-used">
                          Used {t.useCount || 0} Times
                        </span>
                        <button
                          type="button"
                          className="target-card-menu-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/templates/boq/${t.id}`);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : tab === "documents" ? (
            /* Tab 4: Document Templates */
            <div>
              <div className="template-cards-grid">
                {docTemplates.map((t) => (
                  <div
                    key={t.id}
                    className="target-template-card"
                    onClick={() => router.push("/proposals")}
                  >
                    <div className="target-card-img-wrap">
                      <img
                        src={getTemplateCover(t)}
                        alt={t.name}
                        className="target-card-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="target-card-body">
                      <div className="target-card-top-row">
                        <h4 className="target-card-title" title={t.name}>{t.name}</h4>
                        <span className="target-badge-pill document">DOCUMENT TEMPLATE</span>
                      </div>
                      <p className="target-card-meta">{t.description}</p>
                    </div>
                    <div className="target-card-footer">
                      <span className="target-card-used">
                        Used {t.useCount} Times
                      </span>
                      <button
                        type="button"
                        className="target-card-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/proposals");
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Tab 5: Archived Templates */
            <div>
              {loading ? (
                <div className="template-cards-grid">
                  {[1, 2].map((i) => (
                    <div key={i} className="template-card-skeleton skeleton-shimmer" />
                  ))}
                </div>
              ) : archivedTemplates.length === 0 ? (
                <div className="templates-empty">
                  <Trash2 size={48} color="#cbd5e1" />
                  <h3>No archived templates</h3>
                  <p>Archived templates will appear here with the option to restore them.</p>
                </div>
              ) : (
                <div className="template-table-wrap">
                  <table className="template-table">
                    <thead>
                      <tr>
                        <th>TEMPLATE NAME</th>
                        <th>CATEGORY</th>
                        <th>TYPE</th>
                        <th>ARCHIVED BY</th>
                        <th>ARCHIVED DATE</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedTemplates.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <div className="template-name-cell">
                              <img src={t.imageUrl || fallbackImages.Residential} alt="" />
                              <div className="info">
                                <h4>{t.name}</h4>
                                <p>{t.description || "Archived template"}</p>
                              </div>
                            </div>
                          </td>
                          <td>{t.category}</td>
                          <td>{renderBadge(t.templateType)}</td>
                          <td>{t.archivedBy || "Admin"}</td>
                          <td>{t.archivedOn || "Recently"}</td>
                          <td>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                type="button"
                                className="template-btn-secondary"
                                style={{ height: 32, padding: "0 10px", fontSize: 12 }}
                                onClick={() => handleRestore(t)}
                              >
                                <RotateCcw size={13} />
                                <span>Restore</span>
                              </button>
                              <button
                                type="button"
                                className="template-btn-secondary"
                                style={{ height: 32, padding: "0 10px", fontSize: 12, color: "#ef4444" }}
                                onClick={() => handleDeletePermanently(t)}
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* New Template Modal matching Image 3 */}
      <NewTemplateModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={(created) => {
          setIsNewModalOpen(false);
          setNotice(`Template "${created.name}" created successfully.`);
          if (created.id) {
            router.push(`/templates/${created.id}`);
          } else {
            loadOverview();
          }
        }}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(created) => {
          setIsImportModalOpen(false);
          setNotice(`Template "${created.name}" imported successfully.`);
          loadOverview();
          if (tab !== "overview") loadProjectTemplates();
        }}
      />

      {/* Use Template Modal */}
      {useModalTemplate && (
        <UseTemplateDialog
          template={useModalTemplate}
          onClose={() => setUseModalTemplate(null)}
          onSuccess={() => {
            const name = useModalTemplate.name;
            setUseModalTemplate(null);
            setNotice(`Successfully created new project from template "${name}".`);
            router.push("/projects");
          }}
          setNotice={setNotice}
        />
      )}

      {/* Toast Feedback Notice */}
      {notice && (
        <div className="projects-toast">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </main>
  );
}

// ── Use Template Dialog ───────────────────────────────────────────

function UseTemplateDialog({
  template,
  onClose,
  onSuccess,
  setNotice,
}: {
  template: ProjectTemplate;
  onClose: () => void;
  onSuccess: () => void;
  setNotice: (n: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    projectName: "",
    clientName: "",
    location: "",
    startDate: "",
    targetCompletionDate: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await useProjectTemplate(template.id, {
        projectName: form.projectName.trim(),
        clientName: form.clientName.trim(),
        location: form.location.trim() || undefined,
        startDate: form.startDate || undefined,
        targetCompletionDate: form.targetCompletionDate || undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to use template.");
      setSaving(false);
    }
  };

  return (
    <div className="new-template-modal-overlay" onClick={onClose}>
      <div className="new-template-modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="ntm-header">
          <div className="ntm-header-info">
            <h2>Use Template: {template.name}</h2>
            <p>Start a new project pre-configured with this template's structure and BOQ.</p>
          </div>
          <button type="button" className="ntm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ntm-form-field">
            <label className="ntm-label">Project Name <span className="ntm-req">*</span></label>
            <input
              type="text"
              required
              className="ntm-input"
              placeholder="e.g. Sharma Residence"
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
            />
          </div>

          <div className="ntm-form-field">
            <label className="ntm-label">Client Name <span className="ntm-req">*</span></label>
            <input
              type="text"
              required
              className="ntm-input"
              placeholder="e.g. John Doe"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            />
          </div>

          <div className="ntm-form-field">
            <label className="ntm-label">Location</label>
            <input
              type="text"
              className="ntm-input"
              placeholder="e.g. Bandra West, Mumbai"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div className="ntm-two-col-row">
            <div className="ntm-form-field">
              <label className="ntm-label">Start Date</label>
              <input
                type="date"
                className="ntm-input"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="ntm-form-field">
              <label className="ntm-label">Target Completion</label>
              <input
                type="date"
                className="ntm-input"
                value={form.targetCompletionDate}
                onChange={(e) => setForm({ ...form, targetCompletionDate: e.target.value })}
              />
            </div>
          </div>

          <div className="ntm-footer">
            <button type="button" className="ntm-btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="ntm-btn-next" disabled={saving}>
              {saving ? "Creating Project..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
