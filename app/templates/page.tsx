"use client";

import { ChevronDown, MoreHorizontal, Plus, Search, X, Copy, Trash2, Play, Edit3, Filter, List, LayoutGrid, Eye } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import DashboardRail from "@/components/DashboardRail";

type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  businessType: string;
  roomCount: number;
  sectionCount: number;
  itemCount: number;
  status: string;
  version: number;
  usageCount: number;
  imageUrl?: string | null;
  updatedAt: string;
};

type BoqTemplate = {
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
  items: number;
  costMapping: number;
  indicativeBaseCost: string;
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
};

const message = (x: unknown, fallback: string) => (x as { error?: { message?: string }; message?: string })?.error?.message || (x as { message?: string })?.message || fallback;
const date = (x?: string | null) => x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(x)) : "—";
const dateTime = (x?: string | null) => x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(x)) : "—";

const boqImages: Record<string, string> = {
  INTERIOR: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
  KITCHEN: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
  ELECTRICAL: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
  Flooring: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80",
  Plumbing: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
  Painting: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80",
  Commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
};

export default function TemplatesPage() {
  const [tab, setTab] = useState<"overview" | "projects" | "boqs" | "archived">("overview");
  const [view, setView] = useState<"list" | "grid">("grid");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // BOQ Templates State
  const [boqTemplates, setBoqTemplates] = useState<BoqTemplate[]>([]);
  const [boqPage, setBoqPage] = useState(1);
  const [boqPageSize, setBoqPageSize] = useState(10);
  const [boqTotal, setBoqTotal] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  // BOQ Filters
  const [statusFilter, setStatusFilter] = useState<string[]>(["Active", "Draft"]);
  const [projectTypeFilter, setProjectTypeFilter] = useState<string[]>(["Residential"]);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [mappingFilter, setMappingFilter] = useState<string[]>(["Fully Mapped"]);
  const [usedInFilter, setUsedInFilter] = useState<string>("All");

  // Archived Templates State
  const [archivedTemplates, setArchivedTemplates] = useState<ArchivedTemplate[]>([]);
  const [archivedPage, setArchivedPage] = useState(1);
  const [archivedPageSize, setArchivedPageSize] = useState(10);
  const [archivedTotal, setArchivedTotal] = useState(0);

  const [useModal, setUseModal] = useState<ProjectTemplate | null>(null);

  const loadOverview = async () => {
    try {
      const r = await fetch("/api/v1/project-templates/overview", { credentials: "include" });
      const b = await r.json();
      if (!r.ok) throw new Error(message(b, "Could not load overview."));
      setOverview(b.data);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Failed to load overview.");
    }
  };

  const loadTemplates = async () => {
    try {
      const p = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
      if (query) p.set("search", query);
      if (tab === "archived") p.set("status", "archived");

      const r = await fetch(`/api/v1/project-templates?${p}`, { credentials: "include" });
      const b = await r.json();
      if (!r.ok) throw new Error(message(b, "Could not load templates."));
      
      setTemplates(b.data?.items || []);
      setTotal(b.data?.total || 0);
      setHasMore(b.data?.hasMore || false);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Failed to load templates.");
    }
  };

  const loadBoqTemplates = async () => {
    try {
      const p = new URLSearchParams({ page: boqPage.toString(), pageSize: boqPageSize.toString() });
      if (query) p.set("search", query);

      const r = await fetch(`/api/v1/boq-templates?${p}`, { credentials: "include" });
      const b = await r.json();
      if (!r.ok) throw new Error(message(b, "Could not load BOQ templates."));
      
      setBoqTemplates(b.data?.items || []);
      setBoqTotal(b.data?.total || 0);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Failed to load BOQ templates.");
    }
  };

  const loadArchivedTemplates = async () => {
    try {
      const p = new URLSearchParams();
      if (query) p.set("search", query);

      const r = await fetch(`/api/v1/archived-templates?${p}`, { credentials: "include" });
      const b = await r.json();
      if (!r.ok) throw new Error(message(b, "Could not load archived templates."));
      
      setArchivedTemplates(b.data?.items || []);
      setArchivedTotal(b.data?.total || 0);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Failed to load archived templates.");
    }
  };

  useEffect(() => {
    setLoading(true);
    if (tab === "overview") {
      loadOverview().finally(() => setLoading(false));
    } else if (tab === "projects") {
      const id = setTimeout(() => loadTemplates().finally(() => setLoading(false)), query ? 250 : 0);
      return () => clearTimeout(id);
    } else if (tab === "boqs") {
      const id = setTimeout(() => loadBoqTemplates().finally(() => setLoading(false)), query ? 250 : 0);
      return () => clearTimeout(id);
    } else if (tab === "archived") {
      const id = setTimeout(() => loadArchivedTemplates().finally(() => setLoading(false)), query ? 250 : 0);
      return () => clearTimeout(id);
    } else {
      setLoading(false);
    }
  }, [tab, query, page, pageSize, boqPage, boqPageSize, archivedPage, archivedPageSize]);

  useEffect(() => {
    const close = () => setMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const duplicate = async (t: ProjectTemplate) => {
    try {
      const r = await fetch(`/api/v1/project-templates/${t.id}/duplicate`, { method: "POST", credentials: "include" });
      if (!r.ok) throw new Error(message(await r.json(), "Could not duplicate template."));
      setNotice("Template duplicated.");
      if (tab === "overview") loadOverview(); else loadTemplates();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Failed to duplicate template.");
    } finally {
      setMenu(null);
    }
  };

  const archive = async (t: ProjectTemplate) => {
    if (!confirm(`Are you sure you want to archive ${t.name}?`)) return;
    try {
      const r = await fetch(`/api/v1/project-templates/${t.id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error(message(await r.json(), "Could not archive template."));
      setNotice("Template archived.");
      if (tab === "overview") loadOverview(); else loadTemplates();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Failed to archive template.");
    } finally {
      setMenu(null);
    }
  };

  const renderBadge = (type: string) => {
    const cls = type ? type.toLowerCase() : "default";
    return <span className={`template-type-badge ${cls}`}>{type || "GENERAL"}</span>;
  };

  const renderStatus = (status: string) => {
    const cls = status ? status.toLowerCase() : "draft";
    return <span className={`template-status ${cls}`}>{status.replace("_", " ").toUpperCase() || "DRAFT"}</span>;
  };

  const getGradient = (type: string) => {
    const map: Record<string, string> = {
      RESIDENTIAL: "linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)",
      COMMERCIAL: "linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%)",
      VILLA: "linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)",
      RETAIL: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
      HOSPITALITY: "linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 100%)"
    };
    return map[type] || "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)";
  };

  return (
    <main className="fig-dashboard boq-dashboard">
      <div className="fig-dashboard-glow" />
      <DashboardRail />
      <div className="fig-dashboard-main">
        <header className="fig-dashboard-header">
          <h1>Templates</h1>
          <div className="fig-dashboard-header-actions">
            <label className="fig-dashboard-search">
              <img src="/assets/dashboard/dashboard-search.svg" alt="" />
              <input placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} />
            </label>
            <button className="fig-dashboard-new" onClick={() => location.assign("/templates/new")}>
              <Plus size={19} /><span>New</span><i /><ChevronDown size={18} />
            </button>
            <button className="fig-dashboard-bell" aria-label="Notifications">
              <img src="/assets/dashboard/dashboard-notifications.svg" alt="" />
            </button>
            <div className="fig-dashboard-avatar">BO</div>
          </div>
        </header>

        <section className="boq-page-shell templates-content">
          <div className="templates-title">
            <div>
              <h2>Template Library</h2>
              <p>Use templates to start projects, BOQs, and documents faster.</p>
            </div>
            <div className="templates-actions">
              {tab === "boqs" ? (
                <>
                  <button className="primary" onClick={() => location.assign("/templates/new")}>
                    <Plus size={16} /> New BOQ Template
                  </button>
                  <button className="import-btn">Import Excel</button>
                </>
              ) : tab === "archived" ? null : (
                <>
                  <label className="templates-search">
                    <Search size={16} />
                    <input placeholder="Search template by name..." value={query} onChange={e => setQuery(e.target.value)} />
                  </label>
                  <button className="filter-btn"><Filter size={16} /> Filter</button>
                  <button className="import-btn">Import Excel</button>
                  <button className="primary" onClick={() => location.assign("/templates/new")}>
                    <Plus size={16} /> New Template
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", marginBottom: 24 }}>
            <div className="templates-tabs" style={{ margin: 0, border: "none" }}>
              <button className={tab === "overview" ? "active" : ""} onClick={() => { setTab("overview"); setQuery(""); }}>Overview</button>
              <button className={tab === "projects" ? "active" : ""} onClick={() => { setTab("projects"); setQuery(""); setPage(1); }}>Project Templates</button>
              <button className={tab === "boqs" ? "active" : ""} onClick={() => { setTab("boqs"); setQuery(""); setBoqPage(1); }}>BOQ Templates</button>
              <button className={tab === "archived" ? "active" : ""} onClick={() => { setTab("archived"); setQuery(""); }}>Archived</button>
            </div>

            {(tab === "boqs" || tab === "archived") && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 8 }}>
                <label className="templates-search" style={{ margin: 0, width: tab === "archived" ? 280 : 260 }}>
                  <Search size={16} />
                  <input 
                    placeholder={tab === "archived" ? "Search Archived template by name..." : "Search BOQ template by name..."} 
                    value={query} 
                    onChange={e => setQuery(e.target.value)} 
                  />
                </label>
                <button 
                  className={`filter-btn ${filterOpen ? "active" : ""}`}
                  style={{ background: filterOpen ? "#eff6ff" : undefined, borderColor: filterOpen ? "#2563eb" : undefined, color: filterOpen ? "#2563eb" : undefined }}
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <Filter size={16} /> Filter
                </button>
                <div className="view-switch" style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 3, borderRadius: 8 }}>
                  <button 
                    style={{ background: view === "list" ? "#ffffff" : "transparent", border: "none", padding: "6px 8px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", color: view === "list" ? "#2563eb" : "#64748b" }}
                    onClick={() => setView("list")}
                    title="List View"
                  >
                    <List size={16} />
                  </button>
                  <button 
                    style={{ background: view === "grid" ? "#ffffff" : "transparent", border: "none", padding: "6px 8px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", color: view === "grid" ? "#2563eb" : "#64748b" }}
                    onClick={() => setView("grid")}
                    title="Grid View"
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="templates-loading">Loading templates...</div>
          ) : tab === "overview" ? (
            <div className="templates-overview">
              {overview?.recentlyUsed && overview.recentlyUsed.length > 0 && (
                <div className="templates-recently-used">
                  <div className="section-header">
                    <h3>Recently Used Templates</h3>
                    <a href="#" onClick={(e) => { e.preventDefault(); setTab("projects"); }}>View All →</a>
                  </div>
                  <div className="templates-recently-used-scroll">
                    {overview.recentlyUsed.map(t => (
                      <div key={t.id} className="template-card" onClick={() => location.assign(`/templates/${t.id}`)}>
                        <div className="template-card-image" style={{ background: t.imageUrl ? `url(${t.imageUrl}) center/cover` : getGradient(t.businessType) }}>
                          {!t.imageUrl && <div className="placeholder-icon"><LayoutGrid size={24} color="#94a3b8" /></div>}
                        </div>
                        <div className="template-card-info">
                          <div className="t-header">
                            <h4>{t.name}</h4>
                            <button className="more-btn" onClick={e => { e.stopPropagation(); setMenu(t.id); }}><MoreHorizontal size={16} /></button>
                          </div>
                          {renderBadge(t.businessType)}
                          <div className="t-stats">
                            <span>{t.roomCount || 0} Rooms</span> • <span>{t.sectionCount || 0} Sections</span>
                          </div>
                          <div className="t-footer">
                            <span className="t-used">Used {t.usageCount || 0} Times</span>
                          </div>
                        </div>
                        {menu === t.id && (
                          <div className="template-menu" onClick={e => e.stopPropagation()}>
                            <button onClick={() => location.assign(`/templates/${t.id}`)}><Edit3 size={14} /> Edit</button>
                            <button onClick={() => duplicate(t)}><Copy size={14} /> Duplicate</button>
                            <button onClick={() => { setMenu(null); setUseModal(t); }}><Play size={14} /> Use Template</button>
                            <button className="danger" onClick={() => archive(t)}><Trash2 size={14} /> Archive</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="templates-by-type">
                <h3>Templates by Type</h3>
                <div className="templates-stat-grid">
                  <div className="templates-stat-card" onClick={() => setTab("projects")}>
                    <div className="tsc-icon projects-icon"><LayoutGrid size={24} /></div>
                    <div className="tsc-content">
                      <h2>{overview?.total || 0}</h2>
                      <b>Project Templates</b>
                      <p>Start projects with pre-defined structure.</p>
                      {overview?.recentlyUsed?.[0] && <small>Most Used: {overview.recentlyUsed[0].name}</small>}
                    </div>
                  </div>
                  <div className="templates-stat-card" onClick={() => setTab("boqs")}>
                    <div className="tsc-icon boqs-icon"><List size={24} /></div>
                    <div className="tsc-content">
                      <h2>{boqTemplates.length || 7}</h2>
                      <b>BOQ Templates</b>
                      <p>Reusable BOQ Sections and item structures.</p>
                    </div>
                  </div>
                  <div className="templates-stat-card">
                    <div className="tsc-icon docs-icon"><Copy size={24} /></div>
                    <div className="tsc-content">
                      <h2>0</h2>
                      <b>Document Templates</b>
                      <p>Branded BOQ, proposals, and invoice layouts.</p>
                    </div>
                  </div>
                  <div className="templates-stat-card">
                    <div className="tsc-icon updated-icon"><Edit3 size={24} /></div>
                    <div className="tsc-content">
                      <h2>{overview?.active || 0}</h2>
                      <b>Recently Updated</b>
                      <p>in last 7 Days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : tab === "projects" ? (
            <div className="templates-list-view">
              <div className="templates-toolbar">
                <div className="view-switch">
                  <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><List size={16} /> List</button>
                  <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}><LayoutGrid size={16} /> Grid</button>
                </div>
              </div>

              {templates.length === 0 ? (
                <div className="templates-empty">
                  <LayoutGrid size={48} color="#cbd5e1" />
                  <h3>No templates found</h3>
                  <p>Create a new template to get started.</p>
                  <button className="primary" onClick={() => location.assign("/templates/new")}>
                    <Plus size={16} /> New Template
                  </button>
                </div>
              ) : view === "grid" ? (
                <div className="template-grid">
                  {templates.map(t => (
                    <div key={t.id} className="template-card" onClick={() => location.assign(`/templates/${t.id}`)}>
                      <div className="template-card-image" style={{ background: t.imageUrl ? `url(${t.imageUrl}) center/cover` : getGradient(t.businessType) }}>
                        {!t.imageUrl && <div className="placeholder-icon"><LayoutGrid size={24} color="#94a3b8" /></div>}
                      </div>
                      <div className="template-card-info">
                        <div className="t-header">
                          <h4>{t.name}</h4>
                          <button className="more-btn" onClick={e => { e.stopPropagation(); setMenu(t.id); }}><MoreHorizontal size={16} /></button>
                        </div>
                        {renderBadge(t.businessType)}
                        <div className="t-stats">
                          <span>{t.roomCount || 0} Rooms</span> • <span>{t.sectionCount || 0} BOQ Sections</span>
                        </div>
                        <div className="t-footer">
                          <span className="t-used">Used {t.usageCount || 0} Times</span>
                        </div>
                      </div>
                      {menu === t.id && (
                        <div className="template-menu" onClick={e => e.stopPropagation()}>
                          <button onClick={() => location.assign(`/templates/${t.id}`)}><Edit3 size={14} /> Edit</button>
                          <button onClick={() => duplicate(t)}><Copy size={14} /> Duplicate</button>
                          <button onClick={() => { setMenu(null); setUseModal(t); }}><Play size={14} /> Use Template</button>
                          <button className="danger" onClick={() => archive(t)}><Trash2 size={14} /> Archive</button>
                        </div>
                      )}
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
                        <th>PROJECT TYPE</th>
                        <th>ROOMS</th>
                        <th>SECTIONS</th>
                        <th>ITEMS</th>
                        <th>STATUS</th>
                        <th>VERSION</th>
                        <th>UPDATED</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {templates.map(t => (
                        <tr key={t.id} onClick={() => location.assign(`/templates/${t.id}`)}>
                          <td>
                            <div className="t-cell-name">
                              <div className="t-thumb" style={{ background: t.imageUrl ? `url(${t.imageUrl}) center/cover` : getGradient(t.businessType) }} />
                              <div>
                                <b>{t.name}</b>
                                <span>{t.description || "No description"}</span>
                              </div>
                            </div>
                          </td>
                          <td>{renderBadge(t.businessType)}</td>
                          <td>Residential</td>
                          <td>{t.roomCount || 0}</td>
                          <td>{t.sectionCount || 0}</td>
                          <td>{t.itemCount || 0}</td>
                          <td>{renderStatus(t.status)}</td>
                          <td>v{t.version || "1.0"}</td>
                          <td>{date(t.updatedAt)}</td>
                          <td className="menu-cell">
                            <button className="more-button" onClick={e => { e.stopPropagation(); setMenu(menu === t.id ? null : t.id); }}>
                              <MoreHorizontal size={16} />
                            </button>
                            {menu === t.id && (
                              <div className="template-menu" onClick={e => e.stopPropagation()}>
                                <button onClick={() => location.assign(`/templates/${t.id}`)}><Edit3 size={14} /> Edit</button>
                                <button onClick={() => duplicate(t)}><Copy size={14} /> Duplicate</button>
                                <button onClick={() => { setMenu(null); setUseModal(t); }}><Play size={14} /> Use Template</button>
                                <button className="danger" onClick={() => archive(t)}><Trash2 size={14} /> Archive</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="templates-pagination">
                    <span className="tp-info">Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} results</span>
                    <div className="tp-controls">
                      <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                      <span>Page {page}</span>
                      <button disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : tab === "boqs" ? (
            /* BOQ Templates Tab */
            <div>
              {boqTemplates.length === 0 ? (
                <div className="templates-empty">
                  <LayoutGrid size={48} color="#cbd5e1" />
                  <h3>No BOQ templates found</h3>
                  <p>Create a new BOQ template to get started.</p>
                  <button className="primary" onClick={() => location.assign("/templates/new")}>
                    <Plus size={16} /> New BOQ Template
                  </button>
                </div>
              ) : view === "grid" ? (
                /* BOQ TEMPLATES - GRID VIEW (Screen 1) */
                <div className="boq-grid-4col">
                  {boqTemplates.map(t => {
                    const progressColor = t.costMapping >= 90 ? "#10b981" : t.costMapping >= 70 ? "#f59e0b" : "#ef4444";
                    return (
                      <div key={t.id} className="boq-card-item" onClick={() => location.assign(`/templates/boq/${t.id}`)}>
                        <div 
                          className="boq-card-thumb" 
                          style={{ backgroundImage: `url(${t.imageUrl || boqImages[t.category] || boqImages.INTERIOR})` }}
                        >
                          <div className="boq-card-thumb-overlay" />
                        </div>
                        <div className="boq-card-body">
                          <h3 className="boq-card-title">{t.name}</h3>
                          <div className="boq-card-meta-row">
                            <span>{t.sections} Sections · {t.items} Items</span>
                            <span className={t.status?.toLowerCase() === "active" ? "boq-badge-active" : "boq-badge-draft"}>
                              {t.status?.toUpperCase() || "ACTIVE"}
                            </span>
                          </div>
                          <div className="boq-tags-row">
                            <span className="boq-tag-pill">{t.projectType || "Residential"}</span>
                            <span className="boq-tag-pill">{t.category || "Interior"}</span>
                          </div>
                          <div className="boq-progress-wrap">
                            <div className="boq-progress-bar-bg">
                              <div 
                                className="boq-progress-bar-fill" 
                                style={{ width: `${t.costMapping || 0}%`, backgroundColor: progressColor }} 
                              />
                            </div>
                            <span className="boq-progress-text">{t.costMapping || 0}% Mapped</span>
                          </div>
                        </div>
                        <div className="boq-card-foot" onClick={e => e.stopPropagation()}>
                          <span>{t.version || "v3.2"} · Used {t.useCount || 0} Times</span>
                          <button 
                            className="boq-card-menu-btn" 
                            onClick={e => { e.stopPropagation(); setMenu(menu === t.id ? null : t.id); }}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {menu === t.id && (
                            <div className="template-menu" onClick={e => e.stopPropagation()}>
                              <button onClick={() => location.assign(`/templates/boq/${t.id}`)}><Edit3 size={14} /> Edit</button>
                              <button onClick={() => setNotice("BOQ Template duplicated.")}><Copy size={14} /> Duplicate</button>
                              <button onClick={() => location.assign(`/templates/boq/${t.id}`)}><Play size={14} /> Use Template</button>
                              <button className="danger" onClick={() => setNotice("BOQ Template archived.")}><Trash2 size={14} /> Archive</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* BOQ TEMPLATES - LIST VIEW (Screen 2) & FILTER PANEL (Screen 3) */
                <div className="boq-list-layout">
                  <div className="boq-table-flex">
                    <table className="boq-data-table">
                      <thead>
                        <tr>
                          <th>TEMPLATE NAME</th>
                          <th>CATEGORY</th>
                          <th>SECTIONS</th>
                          <th>ITEMS</th>
                          <th>COST MAPPING</th>
                          <th>USED IN</th>
                          <th>VERSION</th>
                          <th>STATUS</th>
                          <th>LAST MODIFIED</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {boqTemplates.map(t => {
                          const catClass = t.category?.toLowerCase() === "interior" ? "boq-cat-interior"
                            : t.category?.toLowerCase() === "kitchen" ? "boq-cat-kitchen"
                            : t.category?.toLowerCase() === "electrical" ? "boq-cat-electrical"
                            : t.category?.toLowerCase() === "flooring" ? "boq-cat-flooring"
                            : t.category?.toLowerCase() === "plumbing" ? "boq-cat-plumbing"
                            : t.category?.toLowerCase() === "painting" ? "boq-cat-painting"
                            : t.category?.toLowerCase() === "commercial" ? "boq-cat-commercial"
                            : "boq-cat-default";

                          const progressColor = t.costMapping >= 90 ? "#10b981" : t.costMapping >= 70 ? "#f59e0b" : "#ef4444";

                          return (
                            <tr key={t.id} onClick={() => location.assign(`/templates/boq/${t.id}`)}>
                              <td>
                                <div className="boq-name-cell">
                                  <div 
                                    className="boq-name-thumb" 
                                    style={{ backgroundImage: `url(${t.imageUrl || boqImages[t.category] || boqImages.INTERIOR})` }} 
                                  />
                                  <div className="boq-name-info">
                                    <b>{t.name}</b>
                                    <span className="boq-code-text">{t.templateCode || "BOQ-RES-0184"}</span>
                                    <div className="boq-tags-row" style={{ marginTop: 2 }}>
                                      <span className="boq-tag-pill" style={{ fontSize: 10, padding: "1px 6px" }}>{t.projectType || "Residential"}</span>
                                      <span className="boq-tag-pill" style={{ fontSize: 10, padding: "1px 6px" }}>{t.category || "Interior"}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`boq-cat-badge ${catClass}`}>
                                  {t.category || "INTERIOR"}
                                </span>
                              </td>
                              <td><b>{t.sections || 0}</b></td>
                              <td><b>{t.items || 0}</b></td>
                              <td>
                                <div className="boq-mapping-cell">
                                  <div className="boq-mapping-bar">
                                    <div 
                                      className="boq-mapping-fill" 
                                      style={{ width: `${t.costMapping || 0}%`, backgroundColor: progressColor }} 
                                    />
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{t.costMapping || 0}%</span>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <b>{t.usedIn?.split(" ")[0] || "12"}</b>
                                  <span style={{ fontSize: 11, color: "#64748b" }}>Templates</span>
                                </div>
                              </td>
                              <td><span style={{ color: "#475569", fontWeight: 500 }}>{t.version || "v3.2"}</span></td>
                              <td>
                                <span className={t.status?.toLowerCase() === "active" ? "boq-badge-active" : "boq-badge-draft"}>
                                  {t.status?.toUpperCase() || "ACTIVE"}
                                </span>
                              </td>
                              <td><span style={{ fontSize: 12, color: "#64748b" }}>{dateTime(t.updatedAt)}</span></td>
                              <td onClick={e => e.stopPropagation()} style={{ position: "relative" }}>
                                <button 
                                  className="boq-card-menu-btn" 
                                  onClick={e => { e.stopPropagation(); setMenu(menu === t.id ? null : t.id); }}
                                >
                                  <MoreHorizontal size={16} />
                                </button>
                                {menu === t.id && (
                                  <div className="template-menu" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => location.assign(`/templates/boq/${t.id}`)}><Edit3 size={14} /> Edit</button>
                                    <button onClick={() => setNotice("BOQ Template duplicated.")}><Copy size={14} /> Duplicate</button>
                                    <button onClick={() => location.assign(`/templates/boq/${t.id}`)}><Play size={14} /> Use Template</button>
                                    <button className="danger" onClick={() => setNotice("BOQ Template archived.")}><Trash2 size={14} /> Archive</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="boq-pagination-bar">
                      <span>Total BOQ Templates: {boqTotal || boqTemplates.length}</span>
                      <div className="boq-page-buttons">
                        <button className="boq-page-num" disabled={boqPage === 1} onClick={() => setBoqPage(p => p - 1)}>‹</button>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button 
                            key={n} 
                            className={`boq-page-num ${boqPage === n ? "active" : ""}`}
                            onClick={() => setBoqPage(n)}
                          >
                            {n}
                          </button>
                        ))}
                        <button className="boq-page-num" onClick={() => setBoqPage(p => p + 1)}>›</button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>Show per Page:</span>
                        <select 
                          value={boqPageSize} 
                          onChange={e => setBoqPageSize(Number(e.target.value))}
                          style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {filterOpen && (
                    <aside className="boq-filter-panel">
                      <div className="boq-filter-head">
                        <h4>FILTER</h4>
                        <button onClick={() => setFilterOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}>
                          <X size={16} />
                        </button>
                      </div>

                      <div className="boq-filter-section">
                        <label className="boq-filter-label">Template Status</label>
                        <div className="boq-filter-checkboxes">
                          {["Active", "Draft", "Published", "Archived"].map(st => (
                            <label key={st} className="boq-filter-cb-item">
                              <input 
                                type="checkbox" 
                                checked={statusFilter.includes(st)} 
                                onChange={() => {
                                  setStatusFilter(prev => prev.includes(st) ? prev.filter(x => x !== st) : [...prev, st]);
                                }} 
                              />
                              <span>{st}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="boq-filter-section">
                        <label className="boq-filter-label">Project Type</label>
                        <div className="boq-filter-checkboxes">
                          {["Residential", "Commercial", "Hospitality", "Office", "Retail"].map(pt => (
                            <label key={pt} className="boq-filter-cb-item">
                              <input 
                                type="checkbox" 
                                checked={projectTypeFilter.includes(pt)} 
                                onChange={() => {
                                  setProjectTypeFilter(prev => prev.includes(pt) ? prev.filter(x => x !== pt) : [...prev, pt]);
                                }} 
                              />
                              <span>{pt}</span>
                            </label>
                          ))}
                          <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>+ More</a>
                        </div>
                      </div>

                      <div className="boq-filter-section">
                        <label className="boq-filter-label">Category</label>
                        <select 
                          className="boq-filter-select"
                          value={categoryFilter}
                          onChange={e => setCategoryFilter(e.target.value)}
                        >
                          <option value="All">Select Category</option>
                          <option value="Interior">Interior</option>
                          <option value="Kitchen">Kitchen</option>
                          <option value="Electrical">Electrical</option>
                          <option value="Flooring">Flooring</option>
                          <option value="Plumbing">Plumbing</option>
                          <option value="Painting">Painting</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                      </div>

                      <div className="boq-filter-section">
                        <label className="boq-filter-label">Project Type</label>
                        <div className="boq-filter-checkboxes">
                          {["Fully Mapped", "Partially Mapped", "Unmapped", "Need Review"].map(mp => (
                            <label key={mp} className="boq-filter-cb-item">
                              <input 
                                type="checkbox" 
                                checked={mappingFilter.includes(mp)} 
                                onChange={() => {
                                  setMappingFilter(prev => prev.includes(mp) ? prev.filter(x => x !== mp) : [...prev, mp]);
                                }} 
                              />
                              <span>{mp}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="boq-filter-section">
                        <label className="boq-filter-label">Used In</label>
                        <select 
                          className="boq-filter-select"
                          value={usedInFilter}
                          onChange={e => setUsedInFilter(e.target.value)}
                        >
                          <option value="All">Select Usage</option>
                          <option value="Templates">Templates</option>
                          <option value="Projects">Projects</option>
                        </select>
                      </div>

                      <div className="boq-filter-foot">
                        <div className="boq-filter-actions">
                          <button 
                            className="boq-filter-clear-btn"
                            onClick={() => {
                              setStatusFilter([]);
                              setProjectTypeFilter([]);
                              setCategoryFilter("All");
                              setMappingFilter([]);
                              setUsedInFilter("All");
                            }}
                          >
                            Clear All
                          </button>
                          <button className="boq-filter-apply-btn" onClick={() => setFilterOpen(false)}>
                            Apply Filters
                          </button>
                        </div>
                        <div className="boq-filter-summary">
                          2 filters applied
                        </div>
                      </div>
                    </aside>
                  )}
                </div>
              )}
            </div>
          ) : tab === "archived" ? (
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <table className="boq-archived-table">
                <thead>
                  <tr>
                    <th>TEMPLATE NAME</th>
                    <th>CATEGORY</th>
                    <th>TEMPLATE TYPE</th>
                    <th>VERSION</th>
                    <th>ARCHIVED BY</th>
                    <th>ARCHIVED ON</th>
                    <th>USED IN</th>
                    <th style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {archivedTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                        No archived templates found matching your search.
                      </td>
                    </tr>
                  ) : (
                    archivedTemplates.map((t, idx) => (
                      <tr key={t.id || idx}>
                        <td>
                          <div className="boq-archived-name-cell">
                            <div className="boq-archived-thumb">
                              <img src={t.imageUrl || boqImages.INTERIOR} alt={t.name} />
                            </div>
                            <div className="boq-archived-name-info">
                              <span className="an-name">{t.name}</span>
                              <span className="an-desc">{t.description}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{t.category}</span>
                            <span style={{ fontSize: 11, color: "#64748b" }}>{t.subcategory}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`boq-template-type-badge ${t.templateType === "BOQ TEMPLATE" ? "boq-template" : "project-template"}`}>
                            {t.templateType}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>
                          {t.version}
                        </td>
                        <td>
                          <div className="boq-archived-user-cell">
                            <div className="aru-avatar">
                              {t.archivedBy.split(" ").map(w => w[0]).join("").slice(0, 2)}
                            </div>
                            <div className="aru-info">
                              <span className="aru-name">{t.archivedBy}</span>
                              <span className="aru-role">{t.archivedByRole}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{t.archivedOn}</span>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>{t.archivedRelative}</span>
                          </div>
                        </td>
                        <td>
                          <span className="boq-used-in-cell">
                            {t.usedIn}
                          </span>
                        </td>
                        <td>
                          <div style={{ position: "relative" }}>
                            <button
                              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
                              onClick={(e) => { e.stopPropagation(); setMenu(menu === t.id ? null : t.id); }}
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {menu === t.id && (
                              <div className="boq-card-menu" style={{ right: 0, top: 24, zIndex: 10 }} onClick={e => e.stopPropagation()}>
                                <button onClick={() => { setNotice(`Restored ${t.name}`); setMenu(null); loadArchivedTemplates(); }}>
                                  <Play size={14} /> Restore
                                </button>
                                <button onClick={() => {
                                  if (t.templateType === "BOQ TEMPLATE") location.assign(`/templates/boq/${t.id}`);
                                  else location.assign(`/templates/${t.id}`);
                                }}>
                                  <Eye size={14} /> View Template
                                </button>
                                <button className="danger" onClick={() => { setNotice(`Deleted ${t.name}`); setMenu(null); setArchivedTemplates(prev => prev.filter(x => x.id !== t.id)); }}>
                                  <Trash2 size={14} /> Delete Permanently
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Bottom Pagination Bar */}
              <div className="boq-pagination-bar" style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Total Archived Templates: {archivedTemplates.length ? archivedTemplates.length : "NA"}
                </span>
                <div className="boq-page-buttons" style={{ display: "flex", gap: 4 }}>
                  <button className="boq-page-num">‹</button>
                  <button className="boq-page-num active">1</button>
                  <button className="boq-page-num">2</button>
                  <button className="boq-page-num">3</button>
                  <button className="boq-page-num">4</button>
                  <button className="boq-page-num">5</button>
                  <button className="boq-page-num">›</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
                  <span>Show per Page:</span>
                  <select style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="templates-empty">
              <Trash2 size={48} color="#cbd5e1" />
              <h3>Archived Templates</h3>
              <p>Coming soon! You'll be able to view and restore archived templates here.</p>
            </div>
          )}
        </section>
      </div>

      {useModal && (
        <UseTemplateModal 
          template={useModal} 
          onClose={() => setUseModal(null)} 
          onSuccess={() => { setUseModal(null); setNotice(`Successfully created project from template ${useModal.name}.`); }} 
          setNotice={setNotice} 
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

function UseTemplateModal({ template, onClose, onSuccess, setNotice }: { template: ProjectTemplate; onClose: () => void; onSuccess: () => void; setNotice: (n: string) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    location: "",
    startDate: "",
    targetCompletionDate: ""
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch(`/api/v1/project-templates/${template.id}/use`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: form.name,
          clientName: form.clientName,
          location: form.location,
          startDate: form.startDate || null,
          targetCompletionDate: form.targetCompletionDate || null
        })
      });
      const b = await r.json();
      if (!r.ok) throw new Error(message(b, "Failed to use template."));
      onSuccess();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Failed to use template.");
      setSaving(false);
    }
  };

  return (
    <div className="template-use-modal">
      <div className="tum-overlay" onClick={onClose} />
      <div className="tum-content">
        <header>
          <h3>Use Template: {template.name}</h3>
          <button className="tum-close" onClick={onClose}><X size={20} /></button>
        </header>
        <form onSubmit={submit}>
          <div className="tum-body">
            <p className="tum-desc">Fill in the basic details for the new project. The template's rooms, sections, and items will be copied over automatically.</p>
            
            <div className="tum-field">
              <label>Project Name <span className="req">*</span></label>
              <input required placeholder="ex. Sharma Residence" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            
            <div className="tum-field">
              <label>Client Name <span className="req">*</span></label>
              <input required placeholder="ex. John Doe" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} />
            </div>

            <div className="tum-field">
              <label>Location</label>
              <input placeholder="ex. Mumbai, Maharashtra" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>

            <div className="tum-row">
              <div className="tum-field">
                <label>Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="tum-field">
                <label>Target Completion</label>
                <input type="date" value={form.targetCompletionDate} onChange={e => setForm({ ...form, targetCompletionDate: e.target.value })} />
              </div>
            </div>
          </div>
          <footer>
            <button type="button" onClick={onClose} className="tum-cancel" disabled={saving}>Cancel</button>
            <button type="submit" className="primary" disabled={saving}>{saving ? "Creating Project..." : "Create Project"}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}
