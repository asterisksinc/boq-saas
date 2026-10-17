"use client";

import { Check, ChevronDown, MoreHorizontal, Plus, X, ArrowLeft, Home, User, MapPin, Calendar, Briefcase, Search, Minus, Info, RefreshCcw, Edit2, Trash2, Copy, UploadCloud, Layers } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState, useCallback } from "react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";

export type Project = {
  id: string;
  projectCode?: string | null;
  name: string;
  clientName: string;
  clientContact?: string | null;
  projectType: string;
  status: string;
  location?: string | null;
  description?: string | null;
  areaSqft?: number | null;
  projectValue?: number | null;
  approvedBudget?: number | null;
  startDate?: string | null;
  targetCompletionDate?: string | null;
  progress?: number | null;
  imageUrl?: string | null;
  coverImage?: string | null;
  boqsCount?: number;
  margin?: number | null;
  estimatedValue?: number | null;
  totalCost?: number | null;
  stage?: string | null;
  currentPhase?: string | null;
  leadDesigner?: string | null;
  designer?: string | null;
  rooms?: ProjectRoom[];
};

export type ProjectRequirement = {
  id: string;
  roomId?: string;
  name: string;
  category?: string;
  length?: number | null;
  depth?: number | null;
  breadth?: number | null;
  height?: number | null;
  unit?: string;
  quantity?: number;
  partitions?: number;
  notes?: string;
  referenceImageUrl?: string | null;
  materialId?: string | null;
  materialName?: string | null;
  materialRate?: number | null;
  materialUnit?: string | null;
  materialCategory?: string | null;
  materialStatus?: "PENDING" | "SELECTED";
};

export type ProjectRoom = {
  id?: string;
  projectId?: string;
  name: string;
  roomType: string;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  unit?: string;
  notes?: string | null;
  referenceImageUrl?: string | null;
  status?: string;
  isConfigured?: boolean;
  requirementsCount?: number;
  requirements?: ProjectRequirement[];
};

type Form = {
  name: string;
  clientName: string;
  clientContact: string;
  projectType: string;
  status: string;
  location: string;
  description: string;
  areaSqft: string;
  projectValue: string;
  startDate: string;
  targetCompletionDate: string;
  leadDesigner?: string;
};

const blankForm: Form = {
  name: "",
  clientName: "",
  clientContact: "",
  projectType: "Residential",
  status: "planning",
  location: "",
  description: "",
  areaSqft: "",
  projectValue: "",
  startDate: "",
  targetCompletionDate: "",
  leadDesigner: "",
};

const message = (x: unknown, fallback: string) =>
  (x as { error?: { message?: string }; message?: string })?.error?.message ||
  (x as { message?: string })?.message ||
  fallback;

const money = (n?: number | null) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const formatTotalValue = (val: number): string => {
  if (val >= 10000000) {
    const cr = (val / 10000000).toFixed(2).replace(/\.00$/, "").replace(/(\.[1-9])0$/, "$1");
    return `₹${cr}Cr`;
  }
  if (val >= 100000) {
    const l = (val / 100000).toFixed(2).replace(/\.00$/, "").replace(/(\.[1-9])0$/, "$1");
    return `₹${l}L`;
  }
  return money(val);
};

const boqDisplayValue = (p: Project) => {
  const val = p.estimatedValue ?? p.projectValue ?? p.approvedBudget;
  if (val != null && val > 0) {
    return formatTotalValue(val);
  }
  if (p.boqsCount != null && p.boqsCount > 0) {
    return `${p.boqsCount}`;
  }
  return p.boqsCount != null ? String(p.boqsCount) : "—";
};

const date = (x?: string | null) =>
  x ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${x}T00:00:00`)) : "—";

const label = (x: string) => x.replace(/_/g, " ");

const formatTimeline = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "—";
  const fmt = (d: string) => {
    try {
      const clean = d.includes("T") ? d.split("T")[0] : d;
      return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
        new Date(`${clean}T00:00:00`)
      );
    } catch {
      return d;
    }
  };
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  if (start) return `Starts ${fmt(start)}`;
  return `Due ${fmt(end!)}`;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuState, setMenuState] = useState<{
    project: Project;
    anchorRect: { top: number; bottom: number; left: number; right: number };
  } | null>(null);
  const [create, setCreate] = useState(false);
  const [createScreen, setCreateScreen] = useState<string>("choice");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [wizardProject, setWizardProject] = useState<Project | null>(null);
  const [remove, setRemove] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ totalProjects: number; totalEstimatedValue: number } | null>(null);

  const filterWrapRef = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const loadInFlight = useRef(false);

  const load = useCallback(async () => {
    if (loadInFlight.current) return;
    loadInFlight.current = true;
    setLoading(true);
    try {
      const p = new URLSearchParams({ pageSize: "100" });
      if (query.trim()) p.set("search", query.trim());
      if (filter !== "all") p.set("status", filter);
      const r = await fetch(`/api/v1/projects?${p}`, { credentials: "include" });
      const b = await r.json();
      if (!r.ok) throw new Error(message(b, "Projects could not be loaded."));
      setProjects(b.data?.items || []);
      if (b.data?.summary) {
        setSummary(b.data.summary);
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Projects could not be loaded.");
    } finally {
      loadInFlight.current = false;
      setLoading(false);
    }
  }, [query, filter]);

  useEffect(() => {
    const handleFocus = () => {
      load();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [load]);

  useEffect(() => {
    const id = setTimeout(() => {
      load();
    }, query ? 250 : 0);
    return () => clearTimeout(id);
  }, [load, query, filter]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get("status");
      if (s && ["active", "planning", "in_progress", "on_hold", "completed"].includes(s)) {
        setFilter(s);
      }
      const q = sp.get("search");
      if (q) setQuery(q);
      if (sp.get("create") === "true" || sp.get("new") === "true") {
        setWizardProject(null);
        setCreateScreen("choice");
        setCreate(true);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (filter !== "all") url.searchParams.set("status", filter);
    else url.searchParams.delete("status");
    if (query.trim()) url.searchParams.set("search", query.trim());
    else url.searchParams.delete("search");
    window.history.replaceState(null, "", url.toString());
  }, [filter, query]);

  useEffect(() => {
    const handleScrollResize = () => setMenuState(null);
    window.addEventListener("scroll", handleScrollResize, true);
    window.addEventListener("resize", handleScrollResize);
    return () => {
      window.removeEventListener("scroll", handleScrollResize, true);
      window.removeEventListener("resize", handleScrollResize);
    };
  }, []);

  const toggleMenu = (p: Project, btn: HTMLElement) => {
    if (menuState?.project.id === p.id) {
      setMenuState(null);
    } else {
      const rect = btn.getBoundingClientRect();
      setMenuState({
        project: p,
        anchorRect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
        },
      });
    }
  };

  useEffect(() => {
    fetch("/api/v1/users/me/preferences", { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        const pv = b?.data?.projectView || b?.data?.project_view;
        if (pv === "card") setView("grid");
        else if (pv === "table") setView("list");
      })
      .catch(() => {});
  }, []);

  const changeView = (nextView: "list" | "grid") => {
    setView(nextView);
    fetch("/api/v1/users/me/preferences", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectView: nextView === "grid" ? "card" : "table" }),
    }).catch(() => {});
  };

  const total = useMemo(
    () => summary?.totalEstimatedValue ?? projects.reduce((s, p) => s + (p.estimatedValue ?? p.approvedBudget ?? p.projectValue ?? 0), 0),
    [summary, projects]
  );
  const projectCount = summary?.totalProjects ?? projects.length;

  const status = async (project: Project, next: string) => {
    try {
      const r = await fetch(`/api/v1/projects/${project.id}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!r.ok) {
        setNotice(message(await r.json(), "Project status could not be changed."));
      } else {
        setMenuState(null);
        setNotice(`Project status changed to ${label(next)}.`);
        load();
      }
    } catch {
      setNotice("Failed to update project status.");
    }
  };

  const archive = async (project: Project) => {
    try {
      const r = await fetch(`/api/v1/projects/${project.id}/archive`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        setNotice(message(await r.json(), "Project could not be archived."));
      } else {
        setMenuState(null);
        setNotice("Project archived.");
        load();
      }
    } catch {
      setNotice("Failed to archive project.");
    }
  };

  const duplicate = async (project: Project) => {
    try {
      const r = await fetch(`/api/v1/projects/${project.id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        setNotice(message(await r.json(), "Project could not be duplicated."));
      } else {
        setMenuState(null);
        setNotice("Project duplicated.");
        load();
      }
    } catch {
      setNotice("Failed to duplicate project.");
    }
  };

  const del = async () => {
    if (!remove) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const r = await fetch(`/api/v1/projects/${remove.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        const errMsg = message(errData, "Project could not be deleted.");
        setDeleteError(errMsg);
        setNotice(errMsg);
      } else {
        setRemove(null);
        setNotice("Project deleted.");
        load();
      }
    } catch {
      const errMsg = "Failed to delete project.";
      setDeleteError(errMsg);
      setNotice(errMsg);
    } finally {
      setDeleting(false);
    }
  };

  const exportFile = async () => {
    try {
      const r = await fetch("/api/v1/projects/export", { credentials: "include" });
      if (!r.ok) return setNotice("Export is unavailable right now.");
      const b = await r.blob(),
        u = URL.createObjectURL(b),
        a = document.createElement("a");
      a.href = u;
      a.download = "projects.xlsx";
      a.click();
      URL.revokeObjectURL(u);
    } catch {
      setNotice("Failed to export projects.");
    }
  };

  const exportSingleProject = async (project: Project) => {
    try {
      const r = await fetch(`/api/v1/projects/export?projectId=${encodeURIComponent(project.id)}`, {
        credentials: "include",
      });
      if (!r.ok) return setNotice("Export is unavailable right now.");
      const b = await r.blob(),
        u = URL.createObjectURL(b),
        a = document.createElement("a");
      a.href = u;
      a.download = `${project.name || "project"}.xlsx`;
      a.click();
      URL.revokeObjectURL(u);
    } catch {
      setNotice("Failed to export project.");
    }
  };

  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const data = new FormData();
    data.append("file", selected);
    try {
      const r = await fetch("/api/v1/projects/imports?skipInvalid=true", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      e.target.value = "";
      const b = await r.json();
      if (!r.ok) setNotice(message(b, "Spreadsheet could not be imported."));
      else {
        setNotice(`${b.data?.projects?.length || 0} project(s) imported.`);
        load();
      }
    } catch {
      setNotice("Failed to import projects.");
    }
  };

  const openEditDetails = (p: Project) => {
    setMenuState(null);
    setEditingProject(p);
  };

  const resumeWizard = (p: Project, step = "rooms") => {
    setWizardProject(p);
    setCreateScreen(step);
    setCreate(true);
  };

  const menuWidth = 205;
  const menuHeight = 370;
  const anchor = menuState?.anchorRect;
  let menuLeft = (anchor?.right ?? 0) - menuWidth;
  if (typeof window !== "undefined") {
    if (menuLeft < 10) menuLeft = 10;
    if (menuLeft + menuWidth > window.innerWidth - 10) {
      menuLeft = window.innerWidth - menuWidth - 10;
    }
  }
  const spaceBelow = typeof window !== "undefined" ? window.innerHeight - (anchor?.bottom ?? 0) : 500;
  const opensUp = spaceBelow < menuHeight && (anchor?.top ?? 0) > menuHeight;
  const menuTop = opensUp
    ? Math.max(10, (anchor?.top ?? 0) - menuHeight - 4)
    : (anchor?.bottom ?? 0) + 4;

  return (
    <main className="fig-dashboard project-ui">
      <div className="fig-dashboard-glow" />
      <DashboardRail />
      <div className="fig-dashboard-main">
        <DashboardHeader
          title="Projects"
          onNew={() => {
            setWizardProject(null);
            setCreateScreen("choice");
            setCreate(true);
          }}
        />

        {(!create || createScreen === "choice") && (
          <section className="projects-content">
            <div className="projects-title">
              <div className="projects-title-left">
                <h2 className="projects-heading">All Projects</h2>
                <p className="projects-summary">
                  {projectCount} {projectCount === 1 ? "project" : "projects"} | {formatTotalValue(total)} total estimated value
                </p>
              </div>
              <div className="projects-actions">
                <button
                  type="button"
                  className="projects-btn-secondary"
                  onClick={() => file.current?.click()}
                >
                  Import Excel
                </button>
                <input ref={file} type="file" accept=".xlsx,.xls,.csv" onChange={importFile} style={{ display: "none" }} />
                <button
                  type="button"
                  className="projects-btn-secondary"
                  onClick={exportFile}
                >
                  Export Excel
                </button>
                <button
                  type="button"
                  className="projects-btn-primary"
                  onClick={() => {
                    setWizardProject(null);
                    setCreateScreen("choice");
                    setCreate(true);
                  }}
                >
                  <Plus size={20} />
                  <span>New Project</span>
                </button>
              </div>
            </div>

            <div className="projects-toolbar">
              <div className="projects-toolbar-left">
                <label className="projects-search">
                  <span className="projects-search-icon-box">
                    <Search size={16} color="#475569" />
                  </span>
                  <input
                    placeholder="Search projects or clients…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search projects or clients"
                  />
                </label>

                <div className="filter-wrap" ref={filterWrapRef}>
                  <button
                    type="button"
                    className={`projects-filter-btn ${filter !== "all" ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFilterOpen((prev) => !prev);
                    }}
                  >
                    <img src="/assets/projects/filter-icon.svg" alt="" style={{ width: 18, height: 18 }} />
                    <span>Filter{filter !== "all" ? ` (${label(filter)})` : ""}</span>
                  </button>
                  {filterOpen && (
                    <>
                      <div
                        className="filter-menu-backdrop"
                        style={{
                          position: "fixed",
                          inset: 0,
                          zIndex: 998,
                          background: "transparent",
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFilterOpen(false);
                        }}
                      />
                      <div
                        className="filter-menu"
                        style={{
                          position: "absolute",
                          zIndex: 1000,
                          left: 0,
                          top: 50,
                          boxShadow: "0 12px 30px rgba(30, 52, 85, 0.15)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <b>Project status</b>
                        {[
                          { key: "all", labelText: "All statuses" },
                          { key: "active", labelText: "Active" },
                          { key: "planning", labelText: "Planning" },
                          { key: "in_progress", labelText: "In Progress" },
                          { key: "on_hold", labelText: "On Hold" },
                          { key: "completed", labelText: "Completed" },
                        ].map(({ key, labelText }) => (
                          <button
                            key={key}
                            type="button"
                            className={filter === key ? "selected-option" : ""}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFilter(key);
                              setFilterOpen(false);
                            }}
                          >
                            <span style={{ width: 16, display: "inline-flex", alignItems: "center" }}>
                              {filter === key && <Check size={14} color="#2563eb" />}
                            </span>
                            {labelText}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="view-switch">
                <button
                  type="button"
                  title="List view"
                  aria-label="List view"
                  className={view === "list" ? "active" : ""}
                  onClick={() => changeView("list")}
                >
                  <img src="/assets/projects/view-list.svg" alt="List view" width={18} height={18} />
                </button>
                <button
                  type="button"
                  title="Grid view"
                  aria-label="Grid view"
                  className={view === "grid" ? "active" : ""}
                  onClick={() => changeView("grid")}
                >
                  <img src="/assets/projects/view-grid.svg" alt="Grid view" width={18} height={18} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="projects-table-card">
                <div className="projects-state-box">
                  <div className="projects-state-spinner" />
                  <p>Loading projects…</p>
                </div>
              </div>
            ) : !projects.length ? (
              filter !== "all" || query.trim() ? (
                <div className="projects-table-card">
                  <div className="projects-state-box">
                    <img src="/assets/projects/filter-icon.svg" alt="" style={{ width: 36, height: 36, opacity: 0.4 }} />
                    <h3>No matching projects found</h3>
                    <p>
                      {query.trim() && filter !== "all"
                        ? `No projects matching "${query}" with status "${label(filter)}".`
                        : query.trim()
                        ? `No projects matching "${query}".`
                        : `No projects found with status "${label(filter)}".`}
                    </p>
                    <button
                      type="button"
                      className="projects-btn-primary"
                      onClick={() => {
                        setFilter("all");
                        setQuery("");
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className="projects-table-card">
                  <Empty
                    onCreate={() => {
                      setWizardProject(null);
                      setCreateScreen("choice");
                      setCreate(true);
                    }}
                  />
                </div>
              )
            ) : view === "grid" ? (
              <Grid
                projects={projects}
                activeMenuId={menuState?.project.id ?? null}
                toggleMenu={toggleMenu}
              />
            ) : (
              <Table
                projects={projects}
                activeMenuId={menuState?.project.id ?? null}
                toggleMenu={toggleMenu}
              />
            )}
          </section>
        )}

        {menuState && (
          <>
            <div
              className="project-menu-backdrop"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9998,
                background: "transparent",
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuState(null);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuState(null);
              }}
            />
            <div
              className="project-menu"
              style={{
                position: "fixed",
                top: `${menuTop}px`,
                left: `${menuLeft}px`,
                zIndex: 9999,
                boxShadow: "0 14px 35px rgba(27, 46, 75, 0.22)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Menu
                project={menuState.project}
                status={status}
                archive={archive}
                duplicate={duplicate}
                remove={setRemove}
                exportProject={exportSingleProject}
                openEdit={openEditDetails}
                closeMenu={() => setMenuState(null)}
              />
            </div>
          </>
        )}

        {create && (
          <Create
            initialProject={wizardProject}
            screen={createScreen}
            setScreen={setCreateScreen}
            onClose={() => {
              setCreate(false);
              setWizardProject(null);
            }}
            onCreated={(x) => {
              setCreate(false);
              setWizardProject(null);
              setNotice(x);
              load();
            }}
          />
        )}
      </div>

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={(msg) => {
            setEditingProject(null);
            setNotice(msg);
            load();
          }}
          onConfigureRooms={(p) => {
            setEditingProject(null);
            resumeWizard(p, "rooms");
          }}
        />
      )}

      {remove && (
        <DeleteProjectModal
          project={remove}
          onClose={() => {
            setRemove(null);
            setDeleteError("");
          }}
          onConfirm={del}
          deleting={deleting}
          error={deleteError}
        />
      )}

      {notice && (
        <div className="projects-toast">
          {notice}
          <button onClick={() => setNotice(null)}>
            <X size={15} />
          </button>
        </div>
      )}
    </main>
  );
}

function Empty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="projects-state-box">
      <img src="/assets/projects/menu-open.svg" alt="" style={{ width: 44, height: 44, opacity: 0.5 }} />
      <h3>No projects yet</h3>
      <p>Create your first project to start building BOQs.</p>
      <button type="button" className="projects-btn-primary" onClick={onCreate}>
        <Plus size={18} />
        New Project
      </button>
    </div>
  );
}

function Table({
  projects,
  activeMenuId,
  toggleMenu,
}: {
  projects: Project[];
  activeMenuId: string | null;
  toggleMenu: (p: Project, btn: HTMLElement) => void;
}) {
  return (
    <div className="projects-table-card">
      <div className="projects-table-wrap">
        <table className="projects-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>PROJECT</th>
              <th>TYPE</th>
              <th>STAGE</th>
              <th>STATUS</th>
              <th>DESIGNER</th>
              <th>BOQS</th>
              <th>MARGIN</th>
              <th>PROGRESS</th>
              <th>DUE DATE</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => {
              return (
                <tr key={p.id} onClick={() => location.assign(`/projects/${p.id}`)}>
                  <td className="cell-id">{p.projectCode || `PRJ-${String(i + 1).padStart(4, "0")}`}</td>
                  <td className="cell-project">
                    <div className="project-cell-content">
                      <span className="project-cell-name">
                        {p.name}{p.location ? ` — ${p.location}` : ""}
                      </span>
                      <span className="project-cell-sub">
                        {p.clientName || "—"}{p.areaSqft ? ` · ${p.areaSqft.toLocaleString("en-IN")} sqft` : ""}
                      </span>
                    </div>
                  </td>
                  <td className="cell-type">{p.projectType || "—"}</td>
                  <td className="cell-stage">
                    <span className="project-stage-badge">
                      {p.stage || p.currentPhase || "Planning"}
                    </span>
                  </td>
                  <td className="cell-status">
                    <span className={`project-status-badge status-${(p.status || "").toLowerCase().replace(/\s+/g, "_")}`}>
                      {label(p.status)}
                    </span>
                  </td>
                  <td className="cell-designer">
                    {p.leadDesigner || p.designer || p.clientName?.split(" ")[0] || "Unassigned"}
                  </td>
                  <td className="cell-boqs">{p.boqsCount ?? 0}</td>
                  <td className="cell-margin">{p.margin != null ? `${p.margin}%` : "—"}</td>
                  <td className="cell-progress">
                    <div
                      className="project-progress-wrap"
                      role="progressbar"
                      aria-valuenow={p.progress || 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Project progress: ${p.progress || 0}%`}
                    >
                      <div className="project-progress-track">
                        <div
                          className="project-progress-fill"
                          style={{ width: `${Math.min(100, Math.max(0, p.progress || 0))}%` }}
                        />
                      </div>
                      <span className="project-progress-pct">{p.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="cell-due-date">{date(p.targetCompletionDate)}</td>
                  <td className="menu-cell" onClick={(e) => e.stopPropagation()}>
                    <div className="menu-cell-inner">
                      <button
                        type="button"
                        className={`more-button ${activeMenuId === p.id ? "active" : ""}`}
                        title="More actions"
                        aria-label="More actions"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleMenu(p, e.currentTarget);
                        }}
                      >
                        <MoreHorizontal size={20} color="#64748B" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Grid({
  projects,
  activeMenuId,
  toggleMenu,
}: {
  projects: Project[];
  activeMenuId: string | null;
  toggleMenu: (p: Project, btn: HTMLElement) => void;
}) {
  return (
    <div className="project-grid">
      {projects.map((p) => {
        return (
          <div key={p.id} className="project-card" onClick={() => location.assign(`/projects/${p.id}`)}>
            <div className="project-card-header">
              <div className="project-card-header-left">
                <h3 className="project-card-name" title={`${p.name}${p.location ? ` — ${p.location}` : ""}`}>
                  {p.name}
                  {p.location ? ` — ${p.location}` : ""}
                </h3>
                <p className="project-card-code">{p.projectCode || "PRJ-0001"}</p>
              </div>
              <div className="project-card-header-right" onClick={(e) => e.stopPropagation()}>
                <span className={`project-status-badge status-${(p.status || "").toLowerCase().replace(/\s+/g, "_")}`}>
                  {label(p.status)}
                </span>
                <button
                  type="button"
                  className={`more-button ${activeMenuId === p.id ? "active" : ""}`}
                  title="More actions"
                  aria-label="More actions"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMenu(p, e.currentTarget);
                  }}
                >
                  <MoreHorizontal size={20} color="#64748B" />
                </button>
              </div>
            </div>

            <div className="project-card-panel">
              <div className="project-card-rows">
                <div className="project-card-row">
                  <div className="project-card-col">
                    <span className="project-card-label">Client Name</span>
                    <span className="project-card-value" title={p.clientName}>{p.clientName || "—"}</span>
                  </div>
                  <div className="project-card-col">
                    <span className="project-card-label">Square Foot</span>
                    <span className="project-card-value">{p.areaSqft ? `${p.areaSqft.toLocaleString("en-IN")} sqft` : "—"}</span>
                  </div>
                  <div className="project-card-col">
                    <span className="project-card-label">Type</span>
                    <span className="project-card-value" title={p.projectType}>{p.projectType || "—"}</span>
                  </div>
                </div>

                <div className="project-card-row">
                  <div className="project-card-col">
                    <span className="project-card-label">Designer</span>
                    <span className="project-card-value" title={p.leadDesigner || p.designer || p.clientName?.split(" ")[0] || "Unassigned"}>
                      {p.leadDesigner || p.designer || p.clientName?.split(" ")[0] || "Unassigned"}
                    </span>
                  </div>
                  <div className="project-card-col">
                    <span className="project-card-label">BOQs</span>
                    <span className="project-card-value">{boqDisplayValue(p)}</span>
                  </div>
                  <div className="project-card-col">
                    <span className="project-card-label">Margin</span>
                    <span className="project-card-value">{p.margin != null ? `${p.margin}%` : "—"}</span>
                  </div>
                </div>
              </div>

              <div className="project-card-divider" />

              <div className="project-card-row project-card-row-footer">
                <div className="project-card-col">
                  <span className="project-card-label">Stage</span>
                  <span className="project-stage-badge">{p.stage || p.currentPhase || "Planning"}</span>
                </div>
                <div className="project-card-col">
                  <span className="project-card-label">Due Date</span>
                  <span className="project-card-value">{date(p.targetCompletionDate)}</span>
                </div>
                <div className="project-card-col">
                  <span className="project-card-label">Progress</span>
                  <div
                    className="project-progress-wrap"
                    role="progressbar"
                    aria-valuenow={p.progress || 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Project progress: ${p.progress || 0}%`}
                  >
                    <div className="project-progress-track">
                      <div
                        className="project-progress-fill"
                        style={{ width: `${Math.min(100, Math.max(0, p.progress || 0))}%` }}
                      />
                    </div>
                    <span className="project-progress-pct">{p.progress || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Menu({
  project,
  status,
  archive,
  duplicate,
  remove,
  exportProject,
  openEdit,
  closeMenu,
}: {
  project: Project;
  status: (p: Project, x: string) => void;
  archive: (p: Project) => void;
  duplicate: (p: Project) => void;
  remove: (p: Project) => void;
  exportProject: (p: Project) => void;
  openEdit: (p: Project) => void;
  closeMenu: () => void;
}) {
  const go = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    location.assign(path);
  };

  const act = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    fn();
  };

  return (
    <>
      <button type="button" onClick={go(`/projects/${project.id}`)}>
        <img src="/assets/projects/menu-open.svg" alt="" width={18} height={18} />
        Open Project
      </button>
      <button type="button" onClick={act(() => openEdit(project))}>
        <img src="/assets/projects/menu-edit.svg" alt="" width={18} height={18} />
        Edit Details
      </button>
      <button type="button" onClick={go(`/boqs?projectId=${project.id}`)}>
        <img src="/assets/projects/menu-create-boq.svg" alt="" width={18} height={18} />
        Create BOQ
      </button>
      <button type="button" onClick={act(() => duplicate(project))}>
        <img src="/assets/projects/menu-duplicate.svg" alt="" width={18} height={18} />
        Duplicate Project
      </button>
      <button type="button" onClick={act(() => exportProject(project))}>
        <img src="/assets/projects/menu-export.svg" alt="" width={18} height={18} />
        Export
      </button>
      <button
        type="button"
        onClick={act(() => status(project, project.status === "on_hold" ? "active" : "on_hold"))}
      >
        <img src="/assets/projects/menu-hold.svg" alt="" width={18} height={18} />
        {project.status === "on_hold" ? "Resume Project" : "Put On Hold"}
      </button>
      <button type="button" onClick={act(() => status(project, "completed"))}>
        <img src="/assets/projects/menu-complete.svg" alt="" width={18} height={18} />
        Mark Completed
      </button>
      <button type="button" onClick={act(() => archive(project))}>
        <img src="/assets/projects/menu-archive.svg" alt="" width={18} height={18} />
        Archive Project
      </button>
      <button type="button" className="danger" onClick={act(() => remove(project))}>
        <img src="/assets/projects/menu-delete.svg" alt="" width={18} height={18} />
        Delete Project
      </button>
    </>
  );
}

function EditProjectModal({
  project,
  onClose,
  onSaved,
  onConfigureRooms,
}: {
  project: Project;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onConfigureRooms: (p: Project) => void;
}) {
  const [form, setForm] = useState<Form>({
    name: project.name || "",
    clientName: project.clientName || "",
    clientContact: project.clientContact || "",
    projectType: project.projectType || "Residential",
    status: project.status || "planning",
    location: project.location || "",
    description: project.description || "",
    areaSqft: project.areaSqft ? String(project.areaSqft) : "",
    projectValue: project.projectValue ? String(project.projectValue) : "",
    startDate: project.startDate ? project.startDate.split("T")[0] : "",
    targetCompletionDate: project.targetCompletionDate ? project.targetCompletionDate.split("T")[0] : "",
    leadDesigner: project.leadDesigner || project.designer || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const change = (key: keyof Form, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const parseBudget = (val: string): number | null => {
    if (!val || !val.trim()) return null;
    const clean = val.trim().replace(/,/g, "").replace(/₹/g, "");
    if (/^(\d+(\.\d+)?)\s*(cr|crore|crores)$/i.test(clean)) {
      const m = clean.match(/^(\d+(\.\d+)?)/);
      return m ? Math.round(Number(m[1]) * 10000000) : null;
    }
    if (/^(\d+(\.\d+)?)\s*(l|lac|lakh|lakhs)$/i.test(clean)) {
      const m = clean.match(/^(\d+(\.\d+)?)/);
      return m ? Math.round(Number(m[1]) * 100000) : null;
    }
    const n = Number(clean);
    return isNaN(n) ? null : n;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Project Name is required.");
      return;
    }
    if (!form.clientName.trim()) {
      setError("Client Name is required.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      clientName: form.clientName.trim(),
      clientContact: form.clientContact.trim() || null,
      projectType: form.projectType,
      status: form.status,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
      projectValue: parseBudget(form.projectValue),
      startDate: form.startDate || null,
      targetCompletionDate: form.targetCompletionDate || null,
      leadDesigner: form.leadDesigner?.trim() || null,
      metadata: {
        leadDesigner: form.leadDesigner?.trim() || null,
      },
    };

    try {
      const res = await fetch(`/api/v1/projects/${project.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(message(data, "Failed to update project."));
      onSaved("Project details updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project.");
    } finally {
      setSaving(false);
    }
  };

  const projectCode = project.projectCode || (project.id ? `PRJ-${project.id.slice(-4).toUpperCase()}` : "PRJ-0001");

  return (
    <div className="project-modal-backdrop" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-project-title"
        className="project-modal project-edit-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header - Frame 2147225093 */}
        <header className="project-edit-header">
          <div className="project-edit-header-text">
            <h1 id="edit-project-title" className="project-edit-title">
              Edit Project
            </h1>
            <p className="project-edit-code">{projectCode}</p>
          </div>
          <button
            type="button"
            className="project-edit-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </header>

        {/* Inner White Form Panel - Frame 2147225027 */}
        <form id="edit-project-form" onSubmit={handleSubmit} className="project-edit-panel">
          <div className="project-edit-grid">
            {/* Project Name */}
            <div className="project-edit-field">
              <label htmlFor="edit-proj-name" className="project-edit-label">
                Project Name <span className="project-edit-required">*</span>
              </label>
              <div className="project-edit-input-wrap">
                <input
                  id="edit-proj-name"
                  required
                  className="project-edit-input"
                  value={form.name}
                  onChange={(e) => change("name", e.target.value)}
                  placeholder="e.g. Oberoi Residence"
                />
              </div>
            </div>

            {/* Client Name */}
            <div className="project-edit-field">
              <label htmlFor="edit-client-name" className="project-edit-label">
                Client Name <span className="project-edit-required">*</span>
              </label>
              <div className="project-edit-input-wrap">
                <input
                  id="edit-client-name"
                  required
                  className="project-edit-input"
                  value={form.clientName}
                  onChange={(e) => change("clientName", e.target.value)}
                  placeholder="e.g. Nikhil Oberoi"
                />
              </div>
            </div>

            {/* Project Type */}
            <div className="project-edit-field">
              <label htmlFor="edit-proj-type" className="project-edit-label">
                Project Type
              </label>
              <div className="project-edit-input-wrap">
                <select
                  id="edit-proj-type"
                  required
                  className="project-edit-select"
                  value={form.projectType}
                  onChange={(e) => change("projectType", e.target.value)}
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Retail">Retail</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Studio">Studio</option>
                  <option value="Institutional">Institutional</option>
                  <option value="Other">Other</option>
                </select>
                <div className="project-edit-select-icon">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Assigned Designer */}
            <div className="project-edit-field">
              <label htmlFor="edit-designer" className="project-edit-label">
                Assigned Designer
              </label>
              <div className="project-edit-input-wrap">
                <input
                  id="edit-designer"
                  className="project-edit-input"
                  value={form.leadDesigner || ""}
                  onChange={(e) => change("leadDesigner", e.target.value)}
                  placeholder="e.g. Jenny Wilson"
                />
              </div>
            </div>

            {/* Budget (₹) */}
            <div className="project-edit-field">
              <label htmlFor="edit-budget" className="project-edit-label">
                Budget (₹)
              </label>
              <div className="project-edit-input-wrap">
                <input
                  id="edit-budget"
                  className="project-edit-input"
                  value={form.projectValue}
                  onChange={(e) => change("projectValue", e.target.value)}
                  placeholder="e.g. 42.5L or 4250000"
                />
              </div>
            </div>

            {/* Area (sqft) */}
            <div className="project-edit-field">
              <label htmlFor="edit-area" className="project-edit-label">
                Area (sqft)
              </label>
              <div className="project-edit-input-wrap">
                <input
                  id="edit-area"
                  type="number"
                  min="1"
                  className="project-edit-input"
                  value={form.areaSqft}
                  onChange={(e) => change("areaSqft", e.target.value)}
                  placeholder="e.g. 3200"
                />
              </div>
            </div>

            {/* Location */}
            <div className="project-edit-field">
              <label htmlFor="edit-location" className="project-edit-label">
                Location
              </label>
              <div className="project-edit-input-wrap">
                <input
                  id="edit-location"
                  className="project-edit-input"
                  value={form.location}
                  onChange={(e) => change("location", e.target.value)}
                  placeholder="e.g. Bandra West, Mumbai"
                />
              </div>
            </div>

            {/* Client Contact */}
            <div className="project-edit-field">
              <label htmlFor="edit-contact" className="project-edit-label">
                Client Contact
              </label>
              <div className="project-edit-input-wrap">
                <input
                  id="edit-contact"
                  className="project-edit-input"
                  value={form.clientContact}
                  onChange={(e) => change("clientContact", e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>

            {/* Start Date */}
            <div className="project-edit-field">
              <label htmlFor="edit-start-date" className="project-edit-label">
                Start Date
              </label>
              <div className="project-edit-input-wrap">
                <input
                  id="edit-start-date"
                  type="date"
                  className="project-edit-input"
                  value={form.startDate}
                  onChange={(e) => change("startDate", e.target.value)}
                />
              </div>
            </div>

            {/* Target Completion */}
            <div className="project-edit-field">
              <label htmlFor="edit-target-date" className="project-edit-label">
                Target Completion
              </label>
              <div className="project-edit-input-wrap">
                <input
                  id="edit-target-date"
                  type="date"
                  min={form.startDate || undefined}
                  className="project-edit-input"
                  value={form.targetCompletionDate}
                  onChange={(e) => change("targetCompletionDate", e.target.value)}
                />
              </div>
            </div>

            {/* Project Status */}
            <div className="project-edit-field full-width">
              <label className="project-edit-label">Project Status</label>
              <div className="project-edit-status-pills" role="radiogroup">
                {[
                  { val: "planning", text: "Planning" },
                  { val: "in_progress", text: "In Progress" },
                  { val: "on_hold", text: "On Hold" },
                  { val: "completed", text: "Completed" },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    role="radio"
                    aria-checked={form.status === s.val}
                    className={`project-edit-status-pill ${form.status === s.val ? "active" : ""}`}
                    onClick={() => change("status", s.val)}
                  >
                    <span className="project-edit-status-dot" />
                    {s.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Scope / Description */}
            <div className="project-edit-field full-width">
              <label htmlFor="edit-desc" className="project-edit-label">
                Project Scope / Description
              </label>
              <div className="project-edit-input-wrap">
                <textarea
                  id="edit-desc"
                  rows={3}
                  className="project-edit-textarea"
                  value={form.description}
                  onChange={(e) => change("description", e.target.value)}
                  placeholder="Brief description of the project scope and specifications..."
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="project-edit-error-banner" role="alert">
              <Info size={16} />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Footer - Frame 2147225069 */}
        <footer className="project-edit-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="project-edit-cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            {onConfigureRooms && (
              <button
                type="button"
                className="project-edit-rooms-btn"
                onClick={() => onConfigureRooms(project)}
                disabled={saving}
              >
                Configure Rooms in Wizard →
              </button>
            )}
          </div>
          <button
            type="submit"
            form="edit-project-form"
            className="project-edit-save-btn"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function DeleteProjectModal({
  project,
  onClose,
  onConfirm,
  deleting,
  error,
}: {
  project: Project;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
  error?: string;
}) {
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, deleting]);

  return (
    <div className="project-modal-backdrop" onMouseDown={deleting ? undefined : onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
        className="project-modal project-delete-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Frame 2147225027 */}
        <div className="project-delete-panel">
          {/* Frame 2147225105 */}
          <div className="project-delete-icon-badge">
            <Trash2 size={28} className="project-delete-icon" />
          </div>

          {/* Frame 2147224969 */}
          <div className="project-delete-text-wrap">
            <h2 id="delete-project-title" className="project-delete-title">
              Delete Project
            </h2>
            <p className="project-delete-desc">
              &ldquo;{project.name}&rdquo; and all associated BOQs and data will be permanently removed. This cannot be undone.
            </p>
          </div>

          {error && (
            <div className="project-delete-error" role="alert">
              {error}
            </div>
          )}
        </div>

        {/* Frame 2147225069 */}
        <footer className="project-delete-footer">
          <button
            type="button"
            className="project-delete-cancel-btn"
            onClick={onClose}
            disabled={deleting}
          >
            No, Keep It,
          </button>
          <button
            type="button"
            className="project-delete-confirm-btn"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Yes, Delete!"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function Create({
  initialProject,
  screen,
  setScreen,
  onClose,
  onCreated,
}: {
  initialProject?: Project | null;
  screen: string;
  setScreen: (s: string) => void;
  onClose: () => void;
  onCreated: (x: string) => void;
}) {
  const [method, setMethod] = useState("scratch");
  const [form, setForm] = useState<Form>(blankForm);
  const [project, setProject] = useState<Project | null>(initialProject || null);
  const [rooms, setRooms] = useState<ProjectRoom[]>([
    { name: "Master Bedroom", roomType: "Master Bedroom", unit: "ft" },
  ]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [roomSearch, setRoomSearch] = useState("");
  const [roomCategoryFilter, setRoomCategoryFilter] = useState("All Category");
  const [showRoomDeleteModal, setShowRoomDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<ProjectRoom | null>(null);
  const [roomDeleteIndex, setRoomDeleteIndex] = useState<number | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const roomNameInputRef = useRef<HTMLInputElement>(null);
  const [roomNotice, setRoomNotice] = useState<string | null>(null);

  const [addingRequirement, setAddingRequirement] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [activeReqMenu, setActiveReqMenu] = useState<string | null>(null);

  const [reqForm, setReqForm] = useState<{
    name: string;
    category: string;
    length: string;
    depth: string;
    height: string;
    unit: string;
    quantity: number;
    partitions: number;
    notes: string;
    referenceImageUrl?: string | null;
  }>({
    name: "Wardrobe",
    category: "Storage",
    length: "8",
    depth: "2",
    height: "8",
    unit: "Unit",
    quantity: 1,
    partitions: 4,
    notes: "",
    referenceImageUrl: null,
  });

  const [activeMaterialReqId, setActiveMaterialReqId] = useState<string | null>(null);
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialsCatalog, setMaterialsCatalog] = useState<any[]>([]);
  const [selectedMaterialForAssign, setSelectedMaterialForAssign] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [uploadingRoomRef, setUploadingRoomRef] = useState(false);
  const [uploadingReqRef, setUploadingReqRef] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Four Project Creation options and sub-workflow states
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateForm, setTemplateForm] = useState({
    projectName: "",
    clientName: "",
    location: "",
    startDate: "",
    targetCompletionDate: "",
  });

  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const [loadingExistingProjects, setLoadingExistingProjects] = useState(false);
  const [selectedDuplicateProjectId, setSelectedDuplicateProjectId] = useState<string | null>(null);
  const [duplicateSearch, setDuplicateSearch] = useState("");

  const [importFileObj, setImportFileObj] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const importModalInputRef = useRef<HTMLInputElement>(null);

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    setError("");
    try {
      const res = await fetch("/api/v1/project-templates?status=active", {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) {
        const items = json.data?.items || json.items || [];
        setTemplates(items);
        if (items.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(items[0].id);
        }
      } else {
        setError(message(json, "Failed to load project templates."));
      }
    } catch {
      setError("Failed to load project templates.");
    } finally {
      setLoadingTemplates(false);
    }
  }, [selectedTemplateId]);

  const loadExistingProjects = useCallback(async () => {
    setLoadingExistingProjects(true);
    setError("");
    try {
      const res = await fetch("/api/v1/projects", {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) {
        const projs = json.data?.projects || json.projects || json.data || [];
        setExistingProjects(projs);
        if (projs.length > 0 && !selectedDuplicateProjectId) {
          setSelectedDuplicateProjectId(projs[0].id);
        }
      } else {
        setError(message(json, "Failed to load projects."));
      }
    } catch {
      setError("Failed to load projects.");
    } finally {
      setLoadingExistingProjects(false);
    }
  }, [selectedDuplicateProjectId]);

  useEffect(() => {
    if (screen === "template" && templates.length === 0) {
      loadTemplates();
    } else if (screen === "duplicate" && existingProjects.length === 0) {
      loadExistingProjects();
    }
  }, [screen, loadTemplates, loadExistingProjects, templates.length, existingProjects.length]);

  const handleUseTemplate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      setError("Please select a project template.");
      return;
    }
    if (!templateForm.projectName.trim()) {
      setError("Please enter a project name.");
      return;
    }
    if (!templateForm.clientName.trim()) {
      setError("Please enter a client name.");
      return;
    }
    if (
      templateForm.startDate &&
      templateForm.targetCompletionDate &&
      templateForm.targetCompletionDate < templateForm.startDate
    ) {
      setError("Target completion date cannot be before start date.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/project-templates/${selectedTemplateId}/use`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: templateForm.projectName.trim(),
          clientName: templateForm.clientName.trim(),
          location: templateForm.location.trim() || undefined,
          startDate: templateForm.startDate || undefined,
          targetCompletionDate: templateForm.targetCompletionDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(message(data, "Failed to create project from template."));
      }
      onCreated("Project created from template successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project from template.");
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedDuplicateProjectId) {
      setError("Please select a project to duplicate.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/projects/${selectedDuplicateProjectId}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(message(data, "Failed to duplicate project."));
      }
      onCreated("Project duplicated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate project.");
      setSaving(false);
    }
  };

  const handleImportSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!importFileObj) {
      setError("Please select an Excel or CSV file to import.");
      return;
    }
    setImporting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", importFileObj);
      const res = await fetch("/api/v1/projects/imports?skipInvalid=true", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(message(data, "Spreadsheet could not be imported."));
      }
      const count = data.data?.projects?.length || 1;
      onCreated(`${count} project(s) imported successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import project spreadsheet.");
      setImporting(false);
    }
  };

  const handleContinue = () => {
    setError("");
    if (method === "scratch") {
      setScreen("details");
    } else if (method === "template") {
      loadTemplates();
      setScreen("template");
    } else if (method === "import") {
      setScreen("import");
    } else if (method === "duplicate") {
      loadExistingProjects();
      setScreen("duplicate");
    }
  };

  const handleUploadRoomRef = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }
    setUploadingRoomRef(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/projects/upload-image", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(message(data, "Failed to upload image."));
      updateActiveRoomField("referenceImageUrl", data.data?.url || data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploadingRoomRef(false);
    }
  };

  const handleUploadReqRef = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }
    setUploadingReqRef(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/projects/upload-image", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(message(data, "Failed to upload image."));
      setReqForm((f) => ({ ...f, referenceImageUrl: data.data?.url || data.url }));
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploadingReqRef(false);
    }
  };

  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
      setForm({
        name: initialProject.name || "",
        clientName: initialProject.clientName || "",
        clientContact: initialProject.clientContact || "",
        projectType: initialProject.projectType || "Residential",
        status: initialProject.status || "planning",
        location: initialProject.location || "",
        description: initialProject.description || "",
        areaSqft: initialProject.areaSqft ? String(initialProject.areaSqft) : "",
        projectValue: initialProject.projectValue ? String(initialProject.projectValue) : "",
        startDate: initialProject.startDate ? initialProject.startDate.split("T")[0] : "",
        targetCompletionDate: initialProject.targetCompletionDate ? initialProject.targetCompletionDate.split("T")[0] : "",
      });
      fetch(`/api/v1/projects/${initialProject.id}/rooms`, { credentials: "include" })
        .then((r) => r.json())
        .then((b) => {
          if (b.data?.items?.length) {
            setRooms(b.data.items);
          }
        })
        .catch(() => {});
    }
  }, [initialProject]);

  const loadProjectRooms = useCallback(async (projId: string) => {
    try {
      const r = await fetch(`/api/v1/projects/${projId}/rooms`, { credentials: "include" });
      const b = await r.json();
      if (r.ok && b.data?.items) {
        setRooms(b.data.items);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (project?.id && (screen === "roomConfig" || screen === "requirements" || screen === "materials")) {
      loadProjectRooms(project.id);
    }
  }, [project?.id, screen, loadProjectRooms]);

  useEffect(() => {
    if (screen === "materials") {
      fetch("/api/v1/costing/items?pageSize=50", { credentials: "include" })
        .then((r) => r.json())
        .then((b) => {
          if (b.data?.items) {
            setMaterialsCatalog(b.data.items);
          }
        })
        .catch(() => {});
    }
  }, [screen]);

  const change = (key: keyof Form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const activeRoom = useMemo(() => {
    return rooms[activeRoomIndex] || rooms[0] || { name: "Room", roomType: "Master Bedroom", unit: "ft" };
  }, [rooms, activeRoomIndex]);

  const updateActiveRoomField = (field: keyof ProjectRoom, val: any) => {
    setRooms((prev) =>
      prev.map((r, i) => (i === activeRoomIndex ? { ...r, [field]: val } : r))
    );
  };

  const configuredCount = useMemo(() => {
    return rooms.filter((r) => (Number(r.length) > 0 && Number(r.width) > 0 && Number(r.height) > 0) || r.isConfigured).length;
  }, [rooms]);

  const configuredMaterialsRoomsCount = useMemo(() => {
    return rooms.filter((r) => {
      const reqs = r.requirements || [];
      return reqs.length > 0 && reqs.every((rq) => Boolean(rq.materialId || rq.materialStatus === "SELECTED" || rq.materialName));
    }).length;
  }, [rooms]);

  const allRequirementsAcrossRooms = useMemo(() => {
    const list: Array<{ room: ProjectRoom; req: ProjectRequirement }> = [];
    rooms.forEach((rm) => {
      (rm.requirements || []).forEach((rq) => {
        list.push({ room: rm, req: rq });
      });
    });
    return list;
  }, [rooms]);

  useEffect(() => {
    if (screen === "materials" && !activeMaterialReqId && allRequirementsAcrossRooms.length > 0) {
      setActiveMaterialReqId(allRequirementsAcrossRooms[0].req.id);
    }
  }, [screen, activeMaterialReqId, allRequirementsAcrossRooms]);

  const activeReqForMaterial = useMemo(() => {
    if (!activeMaterialReqId) return allRequirementsAcrossRooms[0] || null;
    return allRequirementsAcrossRooms.find((x) => x.req.id === activeMaterialReqId) || allRequirementsAcrossRooms[0] || null;
  }, [activeMaterialReqId, allRequirementsAcrossRooms]);

  const availableCategories = useMemo(() => {
    const defaultTypes = [
      "All Category",
      "Master Bedroom",
      "Bedroom",
      "Living Room",
      "Dining Room",
      "Kitchen",
      "Study Room",
      "Guest Bedroom",
      "Bathroom",
      "Balcony",
    ];
    const roomTypes = rooms.map((r) => r.roomType).filter(Boolean);
    return Array.from(new Set([...defaultTypes, ...roomTypes]));
  }, [rooms]);

  const filteredRoomRows = useMemo(() => {
    return rooms
      .map((room, originalIndex) => ({ room, originalIndex }))
      .filter(({ room }) => {
        const matchesCategory =
          roomCategoryFilter === "All Category" ||
          (room.roomType && room.roomType.toLowerCase() === roomCategoryFilter.toLowerCase()) ||
          (room.name && room.name.toLowerCase().includes(roomCategoryFilter.toLowerCase()));
        const matchesSearch =
          !roomSearch.trim() ||
          room.name.toLowerCase().includes(roomSearch.toLowerCase()) ||
          (room.roomType && room.roomType.toLowerCase().includes(roomSearch.toLowerCase()));
        return matchesCategory && matchesSearch;
      });
  }, [rooms, roomCategoryFilter, roomSearch]);

  const handleAddRoom = () => {
    setError("");
    const defaultTypes = [
      "Master Bedroom",
      "Bedroom",
      "Living Room",
      "Dining Room",
      "Kitchen",
      "Study Room",
      "Guest Bedroom",
      "Bathroom",
      "Balcony",
      "Pooja Room",
      "Utility",
    ];
    const existingNames = new Set(rooms.map((r) => r.name.toLowerCase()));
    let nextName = "";
    let nextType = "Bedroom";
    for (const t of defaultTypes) {
      if (!existingNames.has(t.toLowerCase())) {
        nextName = t;
        nextType = t;
        break;
      }
    }
    if (!nextName) {
      nextName = `Room ${rooms.length + 1}`;
      nextType = "Bedroom";
    }

    setRooms((prev) => [...prev, { name: nextName, roomType: nextType, unit: "ft" }]);
  };

  const confirmDeleteRoom = (index: number) => {
    setError("");
    const rm = rooms[index];
    if (!rm) return;
    const isPopulated =
      (Number(rm.length) > 0 && Number(rm.width) > 0) ||
      Boolean(rm.isConfigured) ||
      Boolean(rm.requirements && rm.requirements.length > 0) ||
      Boolean(rm.notes && rm.notes.trim()) ||
      Boolean(rm.referenceImageUrl);

    if (isPopulated) {
      setRoomToDelete(rm);
      setRoomDeleteIndex(index);
      setShowRoomDeleteModal(true);
    } else {
      handleRemoveRoomIndex(index);
    }
  };

  const handleRemoveRoomIndex = async (index: number) => {
    const rm = rooms[index];
    if (rm?.id && project?.id) {
      try {
        await fetch(`/api/v1/projects/${project.id}/rooms/${rm.id}`, {
          method: "DELETE",
          credentials: "include",
        });
      } catch (e) {
        console.error("Failed to delete room on server", e);
      }
    }
    setRooms((rs) => rs.filter((_, i) => i !== index));
    setShowRoomDeleteModal(false);
    setRoomToDelete(null);
    setRoomDeleteIndex(null);
  };

  const handleConfirmRoomDelete = async () => {
    if (roomDeleteIndex === null) return;
    if (roomDeleteIndex < rooms.length - 1 && roomToDelete?.name?.includes("room(s)")) {
      const toDelete = rooms.slice(roomDeleteIndex);
      if (project?.id) {
        for (const rm of toDelete) {
          if (rm.id) {
            try {
              await fetch(`/api/v1/projects/${project.id}/rooms/${rm.id}`, {
                method: "DELETE",
                credentials: "include",
              });
            } catch {}
          }
        }
      }
      setRooms((prev) => prev.slice(0, roomDeleteIndex));
    } else {
      await handleRemoveRoomIndex(roomDeleteIndex);
    }
    setShowRoomDeleteModal(false);
    setRoomToDelete(null);
    setRoomDeleteIndex(null);
  };

  const handleDecrementRoom = () => {
    if (rooms.length <= 1) return;
    const lastIndex = rooms.length - 1;
    confirmDeleteRoom(lastIndex);
  };

  const handleDirectCountChange = (val: number) => {
    if (isNaN(val)) return;
    const targetCount = Math.max(1, Math.min(50, val));
    if (targetCount === rooms.length) return;
    if (targetCount > rooms.length) {
      const addedCount = targetCount - rooms.length;
      const newRooms: ProjectRoom[] = [];
      const defaultTypes = [
        "Master Bedroom",
        "Bedroom",
        "Living Room",
        "Dining Room",
        "Kitchen",
        "Study Room",
        "Guest Bedroom",
        "Bathroom",
        "Balcony",
        "Pooja Room",
        "Utility",
      ];
      for (let i = 0; i < addedCount; i++) {
        const nextIndex = rooms.length + i;
        const fallbackName = nextIndex < defaultTypes.length ? defaultTypes[nextIndex] : `Room ${nextIndex + 1}`;
        newRooms.push({
          name: fallbackName,
          roomType: nextIndex < defaultTypes.length ? defaultTypes[nextIndex] : "Bedroom",
          unit: "ft",
        });
      }
      setRooms((prev) => [...prev, ...newRooms]);
    } else {
      const truncated = rooms.slice(targetCount);
      const hasPopulated = truncated.some(
        (r) =>
          (Number(r.length) > 0 && Number(r.width) > 0) ||
          r.isConfigured ||
          (r.requirements && r.requirements.length > 0)
      );
      if (hasPopulated) {
        setRoomToDelete({
          name: `${truncated.length} room(s)`,
          roomType: "Various",
          unit: "ft",
        });
        setRoomDeleteIndex(targetCount);
        setShowRoomDeleteModal(true);
      } else {
        setRooms((prev) => prev.slice(0, targetCount));
      }
    }
  };

  const submitProjectDetails = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      ...form,
      name: form.name.trim(),
      clientName: form.clientName.trim(),
      clientContact: form.clientContact.trim() || null,
      description: form.description.trim() || null,
      location: form.location.trim() || undefined,
      areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
      projectValue: form.projectValue ? Number(form.projectValue) : null,
      startDate: form.startDate || null,
      targetCompletionDate: form.targetCompletionDate || null,
    };

    try {
      let currentProj = project;
      if (currentProj?.id) {
        const r = await fetch(`/api/v1/projects/${currentProj.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Project could not be updated."));
        currentProj = b.data;
        setProject(currentProj);
      } else {
        const r = await fetch("/api/v1/projects", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Project could not be created."));
        currentProj = b.data;
        setProject(currentProj);
      }

      if (coverFile && currentProj?.id) {
        try {
          const d = new FormData();
          d.append("file", coverFile);
          const ur = await fetch("/api/v1/projects/upload-image", {
            method: "POST",
            credentials: "include",
            body: d,
          });
          const ub = await ur.json();
          const coverUrl = ub.data?.url || ub.url;
          if (ur.ok && coverUrl) {
            await fetch(`/api/v1/projects/${currentProj.id}`, {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ coverImage: coverUrl, imageUrl: coverUrl }),
            });
            currentProj = { ...currentProj, coverImage: coverUrl, imageUrl: coverUrl };
            setProject(currentProj);
          }
        } catch (err) {
          console.error("Cover upload failed", err);
        }
      }

      setScreen("rooms");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Project could not be created.");
    } finally {
      setSaving(false);
    }
  };

  const persistAllRoomsDraft = async () => {
    let curProj = project;
    if (!curProj?.id) {
      const name = form.name.trim() || "New Residential Project";
      const r = await fetch("/api/v1/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name,
          clientName: form.clientName.trim() || "Draft Client",
          projectType: form.projectType || "Residential",
          status: form.status || "planning",
        }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(message(b, "Project could not be saved."));
      curProj = b.data;
      setProject(curProj);
    }

    if (!curProj?.id) return;
    const projId = curProj.id;

    const updated = [...rooms];
    for (let i = 0; i < updated.length; i++) {
      const rm = updated[i];
      if (!rm.name.trim()) continue;
      if (rm.id) {
        const res = await fetch(`/api/v1/projects/${projId}/rooms/${rm.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: rm.name.trim(),
            roomType: rm.roomType.trim() || rm.name.trim(),
            length: rm.length ? Number(rm.length) : null,
            width: rm.width ? Number(rm.width) : null,
            height: rm.height ? Number(rm.height) : null,
            unit: rm.unit || "ft",
            notes: rm.notes || null,
            referenceImageUrl: rm.referenceImageUrl || null,
          }),
        });
        const b = await res.json();
        if (!res.ok) throw new Error(message(b, `Room "${rm.name}" could not be saved.`));
      } else {
        const res = await fetch(`/api/v1/projects/${projId}/rooms`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: rm.name.trim(),
            roomType: rm.roomType.trim() || rm.name.trim(),
            length: rm.length ? Number(rm.length) : null,
            width: rm.width ? Number(rm.width) : null,
            height: rm.height ? Number(rm.height) : null,
            unit: rm.unit || "ft",
            notes: rm.notes || null,
            referenceImageUrl: rm.referenceImageUrl || null,
          }),
        });
        const b = await res.json();
        if (!res.ok) throw new Error(message(b, `Room "${rm.name}" could not be created.`));
        if (b.data?.id) {
          updated[i] = { ...rm, id: b.data.id };
        }
      }
    }
    setRooms(updated);
  };

  const continueFromRoomSetup = async () => {
    setSaving(true);
    setError("");

    if (rooms.length === 0) {
      setError("Please add at least one room before continuing.");
      setSaving(false);
      return;
    }

    const emptyIdx = rooms.findIndex((r) => !r.name.trim());
    if (emptyIdx !== -1) {
      setError(`Please provide a room name for room #${String(emptyIdx + 1).padStart(2, "0")}.`);
      setSaving(false);
      return;
    }

    try {
      let curProj = project;
      if (!curProj?.id) {
        const name = form.name.trim() || "New Residential Project";
        const r = await fetch("/api/v1/projects", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            name,
            clientName: form.clientName.trim() || "Draft Client",
            projectType: form.projectType || "Residential",
            status: form.status || "planning",
          }),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Project could not be created."));
        curProj = b.data;
        setProject(curProj);
      }

      if (!curProj?.id) throw new Error("Project must be created before continuing.");
      const projId = curProj.id;

      const updatedRooms = [...rooms];
      for (let i = 0; i < updatedRooms.length; i++) {
        const rm = updatedRooms[i];
        if (rm.id) {
          const r = await fetch(`/api/v1/projects/${projId}/rooms/${rm.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: rm.name.trim(),
              roomType: rm.roomType.trim() || rm.name.trim(),
              unit: rm.unit || "ft",
            }),
          });
          const b = await r.json();
          if (!r.ok) throw new Error(message(b, `Room "${rm.name}" could not be updated.`));
        } else {
          const r = await fetch(`/api/v1/projects/${projId}/rooms`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: rm.name.trim(),
              roomType: rm.roomType.trim() || rm.name.trim(),
              unit: rm.unit || "ft",
            }),
          });
          const b = await r.json();
          if (!r.ok) throw new Error(message(b, `Room "${rm.name}" could not be created.`));
          updatedRooms[i] = { ...rm, id: b.data.id, isConfigured: b.data.isConfigured };
        }
      }
      setRooms(updatedRooms);
      setActiveRoomIndex(0);
      setScreen("roomConfig");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Rooms could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnitChange = (newUnit: "ft" | "m") => {
    if (!activeRoom) return;
    const oldUnit = activeRoom.unit || "ft";
    if (oldUnit === newUnit) return;
    const l = activeRoom.length != null ? Number(activeRoom.length) : null;
    const w = activeRoom.width != null ? Number(activeRoom.width) : null;
    const h = activeRoom.height != null ? Number(activeRoom.height) : null;
    let nextL = l;
    let nextW = w;
    let nextH = h;
    if (oldUnit === "ft" && newUnit === "m") {
      nextL = l != null && !isNaN(l) ? Math.round(l * 0.3048 * 100) / 100 : null;
      nextW = w != null && !isNaN(w) ? Math.round(w * 0.3048 * 100) / 100 : null;
      nextH = h != null && !isNaN(h) ? Math.round(h * 0.3048 * 100) / 100 : null;
    } else if (oldUnit === "m" && newUnit === "ft") {
      nextL = l != null && !isNaN(l) ? Math.round(l * 3.28084 * 100) / 100 : null;
      nextW = w != null && !isNaN(w) ? Math.round(w * 3.28084 * 100) / 100 : null;
      nextH = h != null && !isNaN(h) ? Math.round(h * 3.28084 * 100) / 100 : null;
    }
    setRooms((prev) =>
      prev.map((r, i) =>
        i === activeRoomIndex
          ? {
              ...r,
              unit: newUnit,
              length: nextL,
              width: nextW,
              height: nextH,
            }
          : r
      )
    );
  };

  const handleDuplicateActiveRoom = () => {
    if (!activeRoom) return;
    const cloned: ProjectRoom = {
      name: `${activeRoom.name || "Room"} (Copy)`,
      roomType: activeRoom.roomType || "Master Bedroom",
      length: activeRoom.length,
      width: activeRoom.width,
      height: activeRoom.height,
      unit: activeRoom.unit || "ft",
      notes: activeRoom.notes || null,
      referenceImageUrl: activeRoom.referenceImageUrl || null,
      isConfigured: false,
    };
    setRooms((prev) => [...prev, cloned]);
    setActiveRoomIndex(rooms.length);
    setRoomNotice(`Room duplicated as "${cloned.name}".`);
    setTimeout(() => setRoomNotice(null), 3000);
  };

  const handleCancelRoomForm = () => {
    if (project?.id) {
      loadProjectRooms(project.id);
    }
    setRoomNotice("Room edits discarded.");
    setTimeout(() => setRoomNotice(null), 2500);
  };

  const saveSingleActiveRoom = async (): Promise<boolean> => {
    setSaving(true);
    setError("");

    let curProj = project;
    if (!curProj?.id) {
      try {
        const name = form.name.trim() || "New Residential Project";
        const r = await fetch("/api/v1/projects", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            name,
            clientName: form.clientName.trim() || "Draft Client",
            projectType: form.projectType || "Residential",
            status: form.status || "planning",
          }),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Project could not be saved."));
        curProj = b.data;
        setProject(curProj);
      } catch (e: any) {
        setError(e.message || "Failed to save project.");
        setSaving(false);
        return false;
      }
    }

    if (!curProj?.id) {
      setSaving(false);
      return false;
    }
    const projId = curProj.id;

    const targetRoom = activeRoom;
    if (!targetRoom.name?.trim()) {
      setError("Please provide a room name.");
      setSaving(false);
      return false;
    }

    const l = targetRoom.length != null ? Number(targetRoom.length) : null;
    const w = targetRoom.width != null ? Number(targetRoom.width) : null;
    const h = targetRoom.height != null ? Number(targetRoom.height) : null;

    if (l != null && (isNaN(l) || l <= 0)) {
      setError("Length must be a valid positive number.");
      setSaving(false);
      return false;
    }
    if (w != null && (isNaN(w) || w <= 0)) {
      setError("Width must be a valid positive number.");
      setSaving(false);
      return false;
    }
    if (h != null && (isNaN(h) || h <= 0)) {
      setError("Height must be a valid positive number.");
      setSaving(false);
      return false;
    }

    const isRoomConfigured = Boolean(l && w && h);

    try {
      if (targetRoom.id) {
        const r = await fetch(`/api/v1/projects/${projId}/rooms/${targetRoom.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: targetRoom.name.trim(),
            roomType: targetRoom.roomType.trim() || "Master Bedroom",
            length: l,
            width: w,
            height: h,
            unit: targetRoom.unit || "ft",
            notes: targetRoom.notes || null,
            referenceImageUrl: targetRoom.referenceImageUrl || null,
          }),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Failed to save room dimensions."));
        setRooms((prev) =>
          prev.map((r, i) => (i === activeRoomIndex ? { ...r, ...b.data, isConfigured: isRoomConfigured } : r))
        );
        setRoomNotice(`Room "${targetRoom.name.trim()}" saved successfully.`);
        setTimeout(() => setRoomNotice(null), 3000);
        return true;
      } else {
        const r = await fetch(`/api/v1/projects/${projId}/rooms`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: targetRoom.name.trim(),
            roomType: targetRoom.roomType.trim() || "Master Bedroom",
            length: l,
            width: w,
            height: h,
            unit: targetRoom.unit || "ft",
            notes: targetRoom.notes || null,
            referenceImageUrl: targetRoom.referenceImageUrl || null,
          }),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Failed to save room."));
        setRooms((prev) =>
          prev.map((r, i) => (i === activeRoomIndex ? { ...r, ...b.data, isConfigured: isRoomConfigured } : r))
        );
        setRoomNotice(`Room "${targetRoom.name.trim()}" saved successfully.`);
        setTimeout(() => setRoomNotice(null), 3000);
        return true;
      }
    } catch (x) {
      setError(x instanceof Error ? x.message : "Failed to save room.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const continueFromRoomConfig = async () => {
    setError("");
    const l = Number(activeRoom?.length) || 0;
    const w = Number(activeRoom?.width) || 0;
    const h = Number(activeRoom?.height) || 0;

    if (activeRoom && l > 0 && w > 0 && h > 0) {
      const ok = await saveSingleActiveRoom();
      if (!ok) return;
    }

    try {
      await persistAllRoomsDraft();
    } catch {
      // Non-critical if draft save has warning
    }

    setAddingRequirement(false);
    setEditingReqId(null);
    setScreen("requirements");
  };

  const saveRequirement = async () => {
    if (!project?.id || !activeRoom?.id) {
      setError("Please ensure the room is saved before adding requirements.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      name: reqForm.name.trim(),
      category: reqForm.category || "Storage",
      length: reqForm.length ? Number(reqForm.length) : null,
      depth: reqForm.depth ? Number(reqForm.depth) : null,
      breadth: reqForm.depth ? Number(reqForm.depth) : null,
      height: reqForm.height ? Number(reqForm.height) : null,
      unit: reqForm.unit || "Unit",
      quantity: reqForm.quantity || 1,
      partitions: reqForm.partitions || 0,
      notes: reqForm.notes || undefined,
      referenceImageUrl: reqForm.referenceImageUrl || null,
    };

    try {
      if (editingReqId) {
        const r = await fetch(`/api/v1/projects/${project.id}/rooms/${activeRoom.id}/requirements/${editingReqId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Failed to update requirement."));
        setRooms((prev) =>
          prev.map((rm, i) => {
            if (i !== activeRoomIndex) return rm;
            const updatedReqs = (rm.requirements || []).map((rq) => (rq.id === editingReqId ? b.data : rq));
            return { ...rm, requirements: updatedReqs };
          })
        );
      } else {
        const r = await fetch(`/api/v1/projects/${project.id}/rooms/${activeRoom.id}/requirements`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(message(b, "Failed to save requirement."));
        setRooms((prev) =>
          prev.map((rm, i) => {
            if (i !== activeRoomIndex) return rm;
            const updatedReqs = [...(rm.requirements || []), b.data];
            return { ...rm, requirements: updatedReqs, requirementsCount: updatedReqs.length };
          })
        );
      }
      setAddingRequirement(false);
      setEditingReqId(null);
    } catch (x) {
      setError(x instanceof Error ? x.message : "Failed to save requirement.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRequirement = async (reqId: string) => {
    if (!project?.id || !activeRoom?.id) return;
    try {
      const r = await fetch(`/api/v1/projects/${project.id}/rooms/${activeRoom.id}/requirements/${reqId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (r.ok) {
        setRooms((prev) =>
          prev.map((rm, i) => {
            if (i !== activeRoomIndex) return rm;
            const updatedReqs = (rm.requirements || []).filter((rq) => rq.id !== reqId);
            return { ...rm, requirements: updatedReqs, requirementsCount: updatedReqs.length };
          })
        );
      }
    } catch {}
    setActiveReqMenu(null);
  };

  const duplicateRequirement = async (reqId: string) => {
    if (!project?.id || !activeRoom?.id) return;
    try {
      const r = await fetch(`/api/v1/projects/${project.id}/rooms/${activeRoom.id}/requirements/${reqId}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      const b = await r.json();
      if (r.ok && b.data) {
        setRooms((prev) =>
          prev.map((rm, i) => {
            if (i !== activeRoomIndex) return rm;
            const updatedReqs = [...(rm.requirements || []), b.data];
            return { ...rm, requirements: updatedReqs, requirementsCount: updatedReqs.length };
          })
        );
      }
    } catch {}
    setActiveReqMenu(null);
  };

  const openEditRequirement = (req: ProjectRequirement) => {
    setReqForm({
      name: req.name,
      category: req.category || "Storage",
      length: req.length ? String(req.length) : "8",
      depth: (req.depth ?? req.breadth) ? String(req.depth ?? req.breadth) : "2",
      height: req.height ? String(req.height) : "8",
      unit: req.unit || "Unit",
      quantity: req.quantity || 1,
      partitions: req.partitions || 0,
      notes: req.notes || "",
      referenceImageUrl: req.referenceImageUrl || null,
    });
    setEditingReqId(req.id);
    setAddingRequirement(true);
    setActiveReqMenu(null);
  };

  const assignMaterialToRequirement = async (matToAssign?: any) => {
    const mat = matToAssign || selectedMaterialForAssign;
    if (!mat || !activeReqForMaterial) return;
    const { room, req } = activeReqForMaterial;

    // Immediate local state update so UI updates without waiting
    setRooms((prev) =>
      prev.map((rm) => {
        if (rm.id !== room.id && rm.name !== room.name) return rm;
        const updatedReqs = (rm.requirements || []).map((rq) =>
          rq.id === req.id || rq.name === req.name
            ? {
                ...rq,
                materialId: mat.id,
                materialName: mat.name,
                materialRate: mat.unitPrice || mat.sellingRate || mat.baseCost || mat.price || 118,
                materialUnit: mat.unit || "Sq.ft",
                materialCategory: mat.categoryName || mat.category || "HDHMR",
                materialStatus: "SELECTED" as const,
              }
            : rq
        );
        return { ...rm, requirements: updatedReqs };
      })
    );

    if (project?.id && room.id && req.id) {
      try {
        const r = await fetch(`/api/v1/projects/${project.id}/rooms/${room.id}/requirements/${req.id}/material`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialId: mat.id,
            materialName: mat.name,
            materialRate: mat.unitPrice || mat.sellingRate || mat.baseCost || mat.price || 118,
            materialUnit: mat.unit || "Sq.ft",
            materialCategory: mat.categoryName || mat.category || "HDHMR",
          }),
        });
        const b = await r.json();
        if (r.ok && b.data) {
          setRooms((prev) =>
            prev.map((rm) => {
              if (rm.id !== room.id) return rm;
              const updatedReqs = (rm.requirements || []).map((rq) => (rq.id === req.id ? b.data : rq));
              return { ...rm, requirements: updatedReqs };
            })
          );
        }
      } catch {}
    }
    setShowAssignModal(false);
  };

  const createBoqAndFinish = async () => {
    if (!project?.id) return;
    setSaving(true);
    try {
      await fetch("/api/v1/boqs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          method: "scratch",
          markupPercent: 15,
          taxPercent: 18,
        }),
      }).catch(() => {});
      setScreen("success");
    } finally {
      setSaving(false);
    }
  };

  const saveAsDraft = async () => {
    if (project) {
      setSaving(true);
      setError("");
      try {
        await persistAllRoomsDraft();
        onCreated("Project and rooms saved as draft.");
      } catch (x) {
        setError(x instanceof Error ? x.message : "Failed to save draft.");
      } finally {
        setSaving(false);
      }
      return;
    }

    const name = form.name.trim();
    if (!name) {
      setError("Please enter a Project Name to save as draft.");
      return;
    }

    setSaving(true);
    setError("");

    const clientName = form.clientName.trim() || "Draft Client";
    const projectType = form.projectType || "Residential";
    const statusVal = "planning";

    const body = {
      ...form,
      name,
      clientName,
      projectType,
      status: statusVal,
      clientContact: form.clientContact || null,
      description: form.description || null,
      location: form.location || undefined,
      areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
      projectValue: form.projectValue ? Number(form.projectValue) : null,
      startDate: form.startDate || null,
      targetCompletionDate: form.targetCompletionDate || null,
    };

    try {
      const r = await fetch("/api/v1/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(message(b, "Project could not be created."));
      onCreated("Project saved as draft.");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Project could not be saved as draft.");
    } finally {
      setSaving(false);
    }
  };

  const creationOptions = [
    {
      id: "scratch",
      title: "From Scratch",
      desc: "Set up project details manually",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.87531 11.7679L4.10754 13.5357L6.46456 15.8927L15.8926 6.46461L13.5356 4.10758L11.7679 5.87535L12.9464 7.05386L11.7679 8.23237L10.5894 7.05386L9.41087 8.23237L10.5894 9.41088L9.41087 10.5894L8.23233 9.41088L7.05382 10.5894L8.23233 11.7679L7.05382 12.9464L5.87531 11.7679ZM14.1249 2.33981L17.6605 5.87535C17.9859 6.20079 17.9859 6.72842 17.6605 7.05386L7.05382 17.6605C6.72838 17.9859 6.20075 17.9859 5.87531 17.6605L2.33977 14.125C2.01434 13.7995 2.01434 13.2719 2.33977 12.9464L12.9464 2.33981C13.2718 2.01438 13.7995 2.01438 14.1249 2.33981ZM11.7679 15.303L12.9464 14.1245L14.8151 15.9933H15.9936V14.8148L14.1249 12.946L15.3034 11.7675L17.4998 13.9639V17.5H13.9649L11.7679 15.303ZM4.69668 8.23185L2.33966 5.87482C2.01422 5.54939 2.01422 5.02175 2.33966 4.69631L4.69668 2.33929C5.02211 2.01386 5.54976 2.01386 5.87519 2.33929L8.23221 4.69631L7.05371 5.87482L5.28594 4.10706L4.10742 5.28557L5.87519 7.05334L4.69668 8.23185Z" />
        </svg>
      ),
    },
    {
      id: "template",
      title: "Use Template",
      desc: "Start from a project template",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3.33333 17.5C2.8731 17.5 2.5 17.1269 2.5 16.6667V3.33333C2.5 2.8731 2.8731 2.5 3.33333 2.5H16.6667C17.1269 2.5 17.5 2.8731 17.5 3.33333V16.6667C17.5 17.1269 17.1269 17.5 16.6667 17.5H3.33333ZM6.66667 8.33333H4.16667V15.8333H6.66667V8.33333ZM15.8333 8.33333H8.33333V15.8333H15.8333V8.33333ZM15.8333 4.16667H4.16667V6.66667H15.8333V4.16667Z" />
        </svg>
      ),
    },
    {
      id: "import",
      title: "Import Excel/CSV",
      desc: "Import existing project data",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18.3333 3.33333C18.3333 2.8731 17.9602 2.5 17.5 2.5H2.49996C2.03973 2.5 1.66663 2.8731 1.66663 3.33333V16.6667C1.66663 17.1269 2.03973 17.5 2.49996 17.5H17.5C17.9602 17.5 18.3333 17.1269 18.3333 16.6667V3.33333ZM3.33329 12.5H6.17999C6.82296 13.9716 8.29136 15 9.99996 15C11.7085 15 13.177 13.9716 13.82 12.5H16.6666V15.8333H3.33329V12.5ZM3.33329 4.16667H16.6666V10.8333H12.5C12.5 12.2141 11.3807 13.3333 9.99996 13.3333C8.61921 13.3333 7.49996 12.2141 7.49996 10.8333H3.33329V4.16667ZM13.3333 9.16667H10.8333V11.6667H9.16663V9.16667H6.66663L9.99996 5.41667L13.3333 9.16667Z" />
        </svg>
      ),
    },
    {
      id: "duplicate",
      title: "Duplicate Project",
      desc: "Copy an existing project.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.83317 5.00033V2.50033C5.83317 2.04009 6.20627 1.66699 6.6665 1.66699H16.6665C17.1267 1.66699 17.4998 2.04009 17.4998 2.50033V14.167C17.4998 14.6272 17.1267 15.0003 16.6665 15.0003H14.1665V17.4996C14.1665 17.9602 13.7916 18.3337 13.3275 18.3337H3.33888C2.87549 18.3337 2.5 17.9632 2.5 17.4996L2.50217 5.83438C2.50225 5.37375 2.8772 5.00033 3.34118 5.00033H5.83317ZM4.16868 6.66699L4.16682 16.667H12.4998V6.66699H4.16868ZM7.49983 5.00033H14.1665V13.3337H15.8332V3.33366H7.49983V5.00033ZM5.83333 9.16699H10.8333V10.8337H5.83333V9.16699ZM5.83333 12.5003H10.8333V14.167H5.83333V12.5003Z" />
        </svg>
      ),
    },
  ];

  if (screen === "choice") {
    return (
      <Modal
        title="Create New Project"
        subtitle="Choose how you want to start this project."
        onClose={onClose}
        className="project-create-modal"
      >
        <div className="project-create-panel">
          <div className="project-create-grid start-options" role="radiogroup" aria-label="Project creation method">
            {creationOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={method === opt.id}
                className={`project-create-card ${method === opt.id ? "selected" : ""}`}
                onClick={() => {
                  setMethod(opt.id);
                  setError("");
                }}
              >
                {method === opt.id && (
                  <span className="project-create-card-check" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.3334 4L6.00008 11.3333L2.66675 8" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                <div className="project-create-card-icon" aria-hidden="true">
                  {opt.icon}
                </div>
                <div className="project-create-card-text">
                  <span className="project-create-card-title">{opt.title}</span>
                  <span className="project-create-card-desc">{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <footer className="project-create-footer">
          <button type="button" className="project-create-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="project-create-continue-btn primary"
            disabled={!method || saving}
            onClick={handleContinue}
          >
            Continue
          </button>
        </footer>
        {error && <p className="form-error">{error}</p>}
      </Modal>
    );
  }

  if (screen === "template") {
    const filteredTemplates = templates.filter(
      (t) =>
        !templateSearch ||
        t.name?.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.templateCode?.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.projectType?.toLowerCase().includes(templateSearch.toLowerCase())
    );

    return (
      <Modal
        title="Use Project Template"
        subtitle="Select a pre-built template to populate project structure and BOQ."
        onClose={onClose}
        wide
        className="project-create-modal project-create-flow-modal"
      >
        <form onSubmit={handleUseTemplate} className="project-create-flow-form">
          <div className="project-create-panel">
            {loadingTemplates ? (
              <div className="project-create-loading">Loading project templates…</div>
            ) : templates.length === 0 ? (
              <div className="project-create-empty">
                <p>No active project templates found in your workspace.</p>
                <button
                  type="button"
                  className="projects-btn-secondary"
                  onClick={() => setScreen("details")}
                >
                  Create from Scratch Instead
                </button>
              </div>
            ) : (
              <>
                <div className="project-create-subheading">
                  <span>1. Choose Template</span>
                  <div className="project-create-search-input-wrap">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search templates…"
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="project-create-template-list">
                  {filteredTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      role="button"
                      tabIndex={0}
                      className={`project-create-template-card ${selectedTemplateId === tpl.id ? "selected" : ""}`}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedTemplateId(tpl.id);
                        }
                      }}
                    >
                      <div className="project-create-template-card-header">
                        <span className="project-create-template-code">{tpl.templateCode || "TEMPLATE"}</span>
                        <span className="project-create-template-type">{tpl.projectType || tpl.businessType || "Residential"}</span>
                      </div>
                      <div className="project-create-template-name">{tpl.name}</div>
                      {tpl.description && (
                        <div className="project-create-template-desc">{tpl.description}</div>
                      )}
                      {selectedTemplateId === tpl.id && (
                        <div className="project-create-template-check">
                          <Check size={14} strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="project-create-subheading" style={{ marginTop: 12 }}>
                  <span>2. Project Details</span>
                </div>

                <div className="form-grid">
                  <Label text="Project Name" required>
                    <input
                      required
                      value={templateForm.projectName}
                      onChange={(e) => setTemplateForm({ ...templateForm, projectName: e.target.value })}
                      placeholder="e.g. Bandra Residence"
                    />
                  </Label>
                  <Label text="Client Name" required>
                    <input
                      required
                      value={templateForm.clientName}
                      onChange={(e) => setTemplateForm({ ...templateForm, clientName: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                    />
                  </Label>
                </div>

                <div className="form-grid">
                  <Label text="Location">
                    <input
                      value={templateForm.location}
                      onChange={(e) => setTemplateForm({ ...templateForm, location: e.target.value })}
                      placeholder="e.g. Mumbai, Maharashtra"
                    />
                  </Label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Label text="Start Date">
                      <input
                        type="date"
                        value={templateForm.startDate}
                        onChange={(e) => setTemplateForm({ ...templateForm, startDate: e.target.value })}
                      />
                    </Label>
                    <Label text="Target Date">
                      <input
                        type="date"
                        min={templateForm.startDate || undefined}
                        value={templateForm.targetCompletionDate}
                        onChange={(e) => setTemplateForm({ ...templateForm, targetCompletionDate: e.target.value })}
                      />
                    </Label>
                  </div>
                </div>
              </>
            )}
          </div>

          <footer className="project-create-footer">
            <button
              type="button"
              className="project-create-cancel-btn"
              onClick={() => {
                setError("");
                setScreen("choice");
              }}
            >
              ← Back
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="project-create-cancel-btn" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button
                type="submit"
                className="project-create-continue-btn primary"
                disabled={!selectedTemplateId || saving}
              >
                {saving ? "Creating…" : "Create from Template"}
              </button>
            </div>
          </footer>
          {error && <p className="form-error">{error}</p>}
        </form>
      </Modal>
    );
  }

  if (screen === "duplicate") {
    const filteredProjects = existingProjects.filter(
      (p) =>
        !duplicateSearch ||
        p.name?.toLowerCase().includes(duplicateSearch.toLowerCase()) ||
        p.clientName?.toLowerCase().includes(duplicateSearch.toLowerCase()) ||
        p.projectCode?.toLowerCase().includes(duplicateSearch.toLowerCase())
    );

    return (
      <Modal
        title="Duplicate Project"
        subtitle="Select an existing workspace project to duplicate."
        onClose={onClose}
        className="project-create-modal project-create-flow-modal"
      >
        <div className="project-create-panel">
          {loadingExistingProjects ? (
            <div className="project-create-loading">Loading projects…</div>
          ) : existingProjects.length === 0 ? (
            <div className="project-create-empty">
              <p>No existing projects found in this workspace.</p>
              <button
                type="button"
                className="projects-btn-secondary"
                onClick={() => setScreen("details")}
              >
                Create from Scratch Instead
              </button>
            </div>
          ) : (
            <>
              <div className="project-create-search-input-wrap" style={{ width: "100%", boxSizing: "border-box" }}>
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search projects by name, code, or client…"
                  value={duplicateSearch}
                  onChange={(e) => setDuplicateSearch(e.target.value)}
                />
              </div>

              <div className="project-create-duplicate-list" role="listbox" aria-label="Projects to duplicate">
                {filteredProjects.map((proj) => (
                  <div
                    key={proj.id}
                    role="option"
                    aria-selected={selectedDuplicateProjectId === proj.id}
                    tabIndex={0}
                    className={`project-create-duplicate-item ${selectedDuplicateProjectId === proj.id ? "selected" : ""}`}
                    onClick={() => setSelectedDuplicateProjectId(proj.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedDuplicateProjectId(proj.id);
                      }
                    }}
                  >
                    <div className="project-create-duplicate-info">
                      <div className="project-create-duplicate-header">
                        <span className="project-create-duplicate-name">{proj.name}</span>
                        <span className="project-create-duplicate-code">{proj.projectCode || "PRJ"}</span>
                      </div>
                      <div className="project-create-duplicate-client">Client: {proj.clientName}</div>
                    </div>
                    {selectedDuplicateProjectId === proj.id && (
                      <div className="project-create-duplicate-check">
                        <Check size={16} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <footer className="project-create-footer">
          <button
            type="button"
            className="project-create-cancel-btn"
            onClick={() => {
              setError("");
              setScreen("choice");
            }}
          >
            ← Back
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="project-create-cancel-btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className="project-create-continue-btn primary"
              disabled={!selectedDuplicateProjectId || saving}
              onClick={handleDuplicate}
            >
              {saving ? "Duplicating…" : "Duplicate Project"}
            </button>
          </div>
        </footer>
        {error && <p className="form-error">{error}</p>}
      </Modal>
    );
  }

  if (screen === "import") {
    return (
      <Modal
        title="Import Excel/CSV"
        subtitle="Import project data and room details from a spreadsheet."
        onClose={onClose}
        className="project-create-modal project-create-flow-modal"
      >
        <div className="project-create-panel">
          <div
            className={`project-create-dropzone ${dragOver ? "drag-over" : ""} ${importFileObj ? "has-file" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) {
                if (/\.(xlsx|xls|csv)$/i.test(f.name)) {
                  setImportFileObj(f);
                  setError("");
                } else {
                  setError("Please drop a valid .xlsx, .xls, or .csv file.");
                }
              }
            }}
            onClick={() => importModalInputRef.current?.click()}
          >
            <input
              ref={importModalInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setImportFileObj(f);
                  setError("");
                }
              }}
            />

            {importFileObj ? (
              <div className="project-create-file-selected">
                <UploadCloud size={32} color="#2563EB" />
                <div className="project-create-file-name">{importFileObj.name}</div>
                <div className="project-create-file-size">
                  {(importFileObj.size / 1024).toFixed(1)} KB
                </div>
                <button
                  type="button"
                  className="project-create-remove-file"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportFileObj(null);
                    if (importModalInputRef.current) importModalInputRef.current.value = "";
                  }}
                >
                  Choose another file
                </button>
              </div>
            ) : (
              <div className="project-create-dropzone-prompt">
                <UploadCloud size={36} color="#64748B" />
                <div className="project-create-dropzone-title">
                  Choose a file or drag & drop it here
                </div>
                <div className="project-create-dropzone-desc">
                  Supports Excel (.xlsx, .xls) and CSV (.csv) up to 10MB
                </div>
                <button
                  type="button"
                  className="project-create-browse-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    importModalInputRef.current?.click();
                  }}
                >
                  Browse Files
                </button>
              </div>
            )}
          </div>

          <div className="project-create-template-hint">
            <span>Need sample format? </span>
            <a href="/api/v1/projects/import-template" download="project-import-template.csv">
              Download CSV Template
            </a>
          </div>
        </div>

        <footer className="project-create-footer">
          <button
            type="button"
            className="project-create-cancel-btn"
            onClick={() => {
              setError("");
              setScreen("choice");
            }}
          >
            ← Back
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="project-create-cancel-btn" onClick={onClose} disabled={importing}>
              Cancel
            </button>
            <button
              type="button"
              className="project-create-continue-btn primary"
              disabled={!importFileObj || importing}
              onClick={() => handleImportSubmit()}
            >
              {importing ? "Importing…" : "Import Project"}
            </button>
          </div>
        </footer>
        {error && <p className="form-error">{error}</p>}
      </Modal>
    );
  }

  if (screen === "details") {
    return (
      <div className="create-page-wrapper project-scratch-wrapper">
        <div className="project-scratch-container">
          <div className="project-scratch-gradient" />

          {/* Header Frame 2147225305 */}
          <header className="project-scratch-header">
            <div className="project-scratch-header-left">
              <button
                type="button"
                className="project-scratch-back-btn"
                onClick={() => setScreen("choice")}
                aria-label="Back to selection"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="project-scratch-title-block">
                <h2>Create New Project</h2>
                <p>Set up the foundational details for your new residential project.</p>
              </div>
            </div>
            <div className="project-scratch-header-right">
              <button type="button" className="project-scratch-btn-cancel" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="project-scratch-btn-draft" onClick={saveAsDraft} disabled={saving}>
                {saving ? "Saving…" : "Save as Draft"}
              </button>
              <button
                type="submit"
                form="create-details-form"
                className="project-scratch-btn-continue"
                disabled={saving}
              >
                {saving ? "Creating…" : "Continue to Next"}
              </button>
            </div>
          </header>

          {/* Step Progress Tracker Frame 2147225073 */}
          <div className="project-setup-tracker">
            <div className="project-setup-heading">PROJECT SETUP</div>
            <Steps current={1} />
          </div>

          {/* Main Card Frame 2147225072 */}
          <div className="project-details-card">
            <div className="project-details-heading">PROJECT DETAILS</div>

            {/* Inner White Form Panel Frame 93 */}
            <div className="project-details-panel">
              <form id="create-details-form" className="project-scratch-form" onSubmit={submitProjectDetails}>
                <div className="project-field-group">
                  <label className="project-field-label" htmlFor="project-name-input">
                    Project Name <em>*</em>
                  </label>
                  <input
                    id="project-name-input"
                    className="project-field-input"
                    required
                    value={form.name}
                    onChange={(e) => change("name", e.target.value)}
                    placeholder="ex. Sharma Residence"
                  />
                  <span className="project-field-helper">
                    Use a clear name that helps your team identify the project.
                  </span>
                </div>

                <div className="project-details-divider" />

                <div className="project-section-subtitle">CLIENT INFORMATION</div>

                <div className="project-fields-row">
                  <div className="project-field-group">
                    <label className="project-field-label" htmlFor="client-name-input">
                      Client Name <em>*</em>
                    </label>
                    <input
                      id="client-name-input"
                      className="project-field-input"
                      required
                      value={form.clientName}
                      onChange={(e) => change("clientName", e.target.value)}
                      placeholder="ex. John Doe"
                    />
                  </div>
                  <div className="project-field-group">
                    <label className="project-field-label" htmlFor="client-contact-input">
                      Client Contact
                    </label>
                    <input
                      id="client-contact-input"
                      className="project-field-input"
                      value={form.clientContact}
                      onChange={(e) => change("clientContact", e.target.value)}
                      placeholder="ex. +91 00000 00000"
                    />
                  </div>
                </div>

                <div className="project-fields-row">
                  <div className="project-field-group">
                    <label className="project-field-label" htmlFor="project-type-select">
                      Project Type <em>*</em>
                    </label>
                    <select
                      id="project-type-select"
                      className="project-field-select"
                      required
                      value={form.projectType}
                      onChange={(e) => change("projectType", e.target.value)}
                    >
                      <option value="">Select project type</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Retail">Retail</option>
                      <option value="Hospitality">Hospitality</option>
                    </select>
                  </div>
                  <div className="project-field-group">
                    <span className="project-field-label">Project Status</span>
                    <div className="project-status-pills" role="radiogroup" aria-label="Project Status">
                      {[
                        { val: "planning", label: "Planning" },
                        { val: "in_progress", label: "In Progress" },
                        { val: "on_hold", label: "On Hold" },
                      ].map((s) => {
                        const isSelected = form.status === s.val;
                        return (
                          <button
                            key={s.val}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            className={`project-status-pill ${isSelected ? "active" : ""}`}
                            onClick={() => change("status", s.val)}
                          >
                            <span className="project-status-pill-circle" />
                            <span>{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="project-fields-row">
                  <div className="project-field-group">
                    <label className="project-field-label" htmlFor="location-input">
                      Location
                    </label>
                    <input
                      id="location-input"
                      className="project-field-input"
                      value={form.location}
                      onChange={(e) => change("location", e.target.value)}
                      placeholder="ex. Enter location"
                    />
                  </div>
                  <div className="project-field-group">
                    <label className="project-field-label" htmlFor="area-sqft-input">
                      Area (sqft)
                    </label>
                    <input
                      id="area-sqft-input"
                      className="project-field-input"
                      type="number"
                      min="1"
                      value={form.areaSqft}
                      onChange={(e) => change("areaSqft", e.target.value)}
                      placeholder="ex. 3,200"
                    />
                  </div>
                </div>

                <div className="project-field-group">
                  <label className="project-field-label" htmlFor="project-desc-input">
                    Project Scope / Description
                  </label>
                  <textarea
                    id="project-desc-input"
                    className="project-field-textarea"
                    rows={4}
                    value={form.description}
                    onChange={(e) => change("description", e.target.value)}
                    placeholder="ex. Enter description"
                  />
                </div>

                <div className="project-details-divider alt" />

                <div className="project-section-subtitle">PROJECT TIMELINE</div>

                <div className="project-fields-row">
                  <div className="project-field-group">
                    <label className="project-field-label" htmlFor="start-date-input">
                      Start Date
                    </label>
                    <input
                      id="start-date-input"
                      className="project-field-input"
                      type="date"
                      placeholder="dd-mm-yyyy"
                      value={form.startDate}
                      onChange={(e) => change("startDate", e.target.value)}
                    />
                  </div>
                  <div className="project-field-group">
                    <label className="project-field-label" htmlFor="target-date-input">
                      Expected Completion
                    </label>
                    <input
                      id="target-date-input"
                      className="project-field-input"
                      type="date"
                      placeholder="dd-mm-yyyy"
                      min={form.startDate || undefined}
                      value={form.targetCompletionDate}
                      onChange={(e) => change("targetCompletionDate", e.target.value)}
                    />
                  </div>
                </div>

                {error && <p className="form-error">{error}</p>}
              </form>
            </div>

            {/* Inner White Cover Card Frame 94 */}
            <div className="project-cover-card">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                style={{ display: "none" }}
                accept="image/png, image/jpeg, image/webp"
              />
              <div
                className="project-cover-dropzone"
                tabIndex={0}
                role="button"
                aria-label="Upload Project Cover"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                {coverFile ? (
                  <img
                    src={URL.createObjectURL(coverFile)}
                    alt="Cover preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
                  />
                ) : (
                  <>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M19.2498 13.75V16.5H21.9998V18.3333H19.2498V21.0833H17.4165V18.3333H14.6665V16.5H17.4165V13.75H19.2498ZM19.2573 2.75C19.7595 2.75 20.1665 3.15787 20.1665 3.66062V11.9167H18.3331V4.58333H3.66646V17.4157L12.8331 8.25L15.5831 11V13.5933L12.8331 10.8427L6.25788 17.4167H12.8331V19.25H2.74228C2.24018 19.25 1.83313 18.8422 1.83313 18.3394V3.66062C1.83313 3.1577 2.2505 2.75 2.74228 2.75H19.2573ZM7.33313 6.41667C8.34565 6.41667 9.16646 7.23748 9.16646 8.25C9.16646 9.26255 8.34565 10.0833 7.33313 10.0833C6.32061 10.0833 5.4998 9.26255 5.4998 8.25C5.4998 7.23748 6.32061 6.41667 7.33313 6.41667Z"
                        fill="#0F172A"
                      />
                    </svg>
                    <span className="project-cover-label">UPLOAD COVER</span>
                  </>
                )}
              </div>
              <div className="project-cover-info">
                <h4 className="project-cover-title">Project Cover Image</h4>
                <p className="project-cover-desc">
                  Upload a high-resolution image to identify this project on the dashboard. Recommended Size: 800X600px.
                </p>
                <button
                  type="button"
                  className="project-cover-browse-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {coverFile ? "Change Image" : "Browse"}
                </button>
                {coverFile && (
                  <span className="project-cover-filename">
                    Selected: {coverFile.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "rooms") {
    return (
      <div className="create-page-wrapper project-scratch-wrapper">
        <div className="project-scratch-container">
          <div className="project-scratch-gradient" />
          <header className="project-scratch-header">
            <div className="project-scratch-header-left">
              <button
                type="button"
                className="project-scratch-back-btn"
                onClick={() => setScreen("details")}
                aria-label="Back to Project Details"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="project-scratch-title-block">
                <h2>Create New Project</h2>
                <p>Set up the foundational details for your new residential project.</p>
              </div>
            </div>

            <div className="project-scratch-header-right">
              <button
                type="button"
                className="project-scratch-btn-cancel"
                onClick={() => {
                  if (rooms.length > 0) {
                    setShowCancelConfirm(true);
                  } else {
                    onClose();
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="project-scratch-btn-draft"
                onClick={saveAsDraft}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save as Draft"}
              </button>
              <button
                type="button"
                className="project-scratch-btn-continue"
                onClick={continueFromRoomSetup}
                disabled={saving}
              >
                {saving ? "Saving…" : "Continue to Next"}
              </button>
            </div>
          </header>

          {/* Step Progress Tracker Frame 2147225073 */}
          <div className="project-setup-tracker">
            <div className="project-setup-heading">PROJECT SETUP</div>
            <Steps
              current={2}
              onStepClick={(step) => {
                if (step === 1) setScreen("details");
              }}
            />
          </div>

          {/* Project Details Summary Card Frame 2147225306 */}
          <div className="project-summary-card">
            <div className="project-setup-heading">PROJECT DETAILS</div>
            <div className="project-summary-panel">
              <div className="project-summary-main">
                <div className="project-summary-icon">
                  <Home size={20} />
                </div>
                <div className="project-summary-info">
                  <div className="project-summary-title-row">
                    <span className="project-summary-name">
                      {project?.name || form.name || "Project Name"}
                    </span>
                    <span className="project-summary-status">
                      {label(project?.status || form.status || "planning")}
                    </span>
                  </div>
                  <span className="project-summary-subtitle">
                    {project?.projectType || form.projectType ? `${project?.projectType || form.projectType} Interior Project` : "Residential Interior Project"}
                  </span>
                </div>
              </div>

              <div className="project-summary-divider" />

              <div className="project-summary-meta-group">
                <div className="project-summary-meta-item">
                  <User className="project-summary-meta-icon" />
                  <div className="project-summary-meta-text">
                    <span className="project-summary-meta-label">Client</span>
                    <span className="project-summary-meta-value" title={project?.clientName || form.clientName || "—"}>
                      {project?.clientName || form.clientName || "—"}
                    </span>
                  </div>
                </div>

                <div className="project-summary-meta-item">
                  <MapPin className="project-summary-meta-icon" />
                  <div className="project-summary-meta-text">
                    <span className="project-summary-meta-label">Location</span>
                    <span className="project-summary-meta-value" title={project?.location || form.location || "—"}>
                      {project?.location || form.location || "—"}
                    </span>
                  </div>
                </div>

                <div className="project-summary-meta-item">
                  <Briefcase className="project-summary-meta-icon" />
                  <div className="project-summary-meta-text">
                    <span className="project-summary-meta-label">Type</span>
                    <span className="project-summary-meta-value" title={project?.projectType || form.projectType || "Residential"}>
                      {project?.projectType || form.projectType || "Residential"}
                    </span>
                  </div>
                </div>

                <div className="project-summary-meta-item">
                  <Calendar className="project-summary-meta-icon" />
                  <div className="project-summary-meta-text">
                    <span className="project-summary-meta-label">Timeline</span>
                    <span
                      className="project-summary-meta-value"
                      title={formatTimeline(project?.startDate || form.startDate, project?.targetCompletionDate || form.targetCompletionDate)}
                    >
                      {formatTimeline(project?.startDate || form.startDate, project?.targetCompletionDate || form.targetCompletionDate)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="project-summary-edit-btn"
                onClick={() => setScreen("details")}
              >
                Edit Project
              </button>
            </div>
          </div>

          {/* Room Setup Main Card Frame 2147225072 */}
          <div className="room-setup-card-wrapper">
            <div className="project-setup-heading">ROOM SETUP</div>
            <div className="room-setup-main-panel">
              {/* Number of Rooms Control */}
              <div className="room-count-wrapper">
                <label className="room-count-label">
                  Number of Rooms <em>*</em>
                </label>
                <div className="room-count-controls-row">
                  <div className="room-stepper-box">
                    <button
                      type="button"
                      className="room-stepper-btn"
                      onClick={handleDecrementRoom}
                      disabled={rooms.length <= 1}
                      aria-label="Decrease room count"
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      className="room-count-display"
                      value={rooms.length}
                      onChange={(e) => handleDirectCountChange(parseInt(e.target.value, 10))}
                      aria-label="Room count"
                    />
                    <button
                      type="button"
                      className="room-stepper-btn"
                      onClick={handleAddRoom}
                      aria-label="Increase room count"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="room-count-summary">
                    <strong>{rooms.length}</strong>
                    <span>{rooms.length === 1 ? "room" : "rooms"} will be created for this project.</span>
                  </div>
                </div>
                <p className="room-count-helper">
                  Set the initial room count and create the room structure you'll configure for the BOQ. You can add or
                  remove rooms later.
                </p>
              </div>

              <hr className="room-setup-divider" />

              {/* Room List Section */}
              <div className="room-list-header-row">
                <div className="room-list-header-info">
                  <h3 className="room-list-header-title">ROOM LIST</h3>
                  <p className="room-list-header-desc">
                    Give each room a clear name so it can be identified throughout the BOQ workflow.
                  </p>
                </div>
                <button
                  type="button"
                  className="room-quick-add-btn"
                  onClick={handleAddRoom}
                >
                  <Plus size={16} />
                  <span>Quick Add</span>
                </button>
              </div>

              {/* Room Toolbar */}
              <div className="room-toolbar-row">
                <div className="room-search-box">
                  <Search size={18} />
                  <input
                    type="text"
                    className="room-search-input"
                    placeholder="Search Rooms"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                  />
                  {roomSearch && (
                    <button
                      type="button"
                      onClick={() => setRoomSearch("")}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B", display: "flex", alignItems: "center", padding: 0 }}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="room-filter-box">
                  <select
                    className="room-filter-select"
                    value={roomCategoryFilter}
                    onChange={(e) => setRoomCategoryFilter(e.target.value)}
                  >
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="room-filter-chevron" />
                </div>
              </div>

              {/* Room Table */}
              <div className="room-table-container">
                <div className="room-table-header-row">
                  <div className="room-th-cell room-th-num">#</div>
                  <div className="room-th-cell room-th-name">ROOM NAME</div>
                  <div className="room-th-cell room-th-type">ROOM TYPE</div>
                  <div className="room-th-cell room-th-status">STATUS</div>
                  <div className="room-th-cell room-th-actions" />
                </div>

                <div className="room-table-body">
                  {filteredRoomRows.length === 0 ? (
                    <div className="room-table-empty">
                      No rooms match the search or category filter.
                    </div>
                  ) : (
                    filteredRoomRows.map(({ room, originalIndex }) => {
                      const isConfigured = Boolean(
                        room.isConfigured || (Number(room.length) > 0 && Number(room.width) > 0)
                      );
                      const hasRequirements = Boolean(room.requirements && room.requirements.length > 0);
                      const statusType = isConfigured
                        ? "configured"
                        : hasRequirements
                        ? "items"
                        : "not-configured";
                      const statusLabel = isConfigured
                        ? "CONFIGURED"
                        : hasRequirements
                        ? `${room.requirements!.length} ITEMS`
                        : "NOT CONFIGURED";

                      return (
                        <div key={originalIndex} className="room-table-row">
                          <div className="room-td-cell room-td-num">
                            {String(originalIndex + 1).padStart(2, "0")}
                          </div>
                          <div className="room-td-cell room-td-name">
                            <input
                              type="text"
                              className="room-name-input"
                              value={room.name}
                              placeholder="e.g. Master Bedroom"
                              onChange={(e) =>
                                setRooms((rs) =>
                                  rs.map((r, x) => (x === originalIndex ? { ...r, name: e.target.value } : r))
                                )
                              }
                            />
                          </div>
                          <div className="room-td-cell room-td-type">
                            <div className="room-type-select-box">
                              <select
                                className="room-type-select"
                                value={room.roomType || ""}
                                onChange={(e) =>
                                  setRooms((rs) =>
                                    rs.map((r, x) =>
                                      x === originalIndex ? { ...r, roomType: e.target.value } : r
                                    )
                                  )
                                }
                              >
                                <option value="" disabled>
                                  Select type
                                </option>
                                <option value="Master Bedroom">Master Bedroom</option>
                                <option value="Bedroom">Bedroom</option>
                                <option value="Living Room">Living Room</option>
                                <option value="Dining Room">Dining Room</option>
                                <option value="Kitchen">Kitchen</option>
                                <option value="Study Room">Study Room</option>
                                <option value="Guest Bedroom">Guest Bedroom</option>
                                <option value="Bathroom">Bathroom</option>
                                <option value="Balcony">Balcony</option>
                                <option value="Pooja Room">Pooja Room</option>
                                <option value="Utility">Utility</option>
                              </select>
                              <ChevronDown size={14} />
                            </div>
                          </div>
                          <div className="room-td-cell room-td-status">
                            <span className={`room-status-badge ${statusType}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <div className="room-td-cell room-td-actions">
                            <button
                              type="button"
                              className="room-delete-btn"
                              title="Delete Room"
                              aria-label={`Delete room ${room.name || originalIndex + 1}`}
                              onClick={() => confirmDeleteRoom(originalIndex)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {error && <p className="form-error" style={{ color: "#DC2626", margin: 0 }}>{error}</p>}
            </div>
          </div>
        </div>

        {/* Confirmation Modal for deleting populated room */}
        {showRoomDeleteModal && roomToDelete && (
          <Modal
            title="Remove Room?"
            subtitle={`Are you sure you want to remove "${roomToDelete.name || 'this room'}"? Any configurations or items for this room will be lost.`}
            onClose={() => {
              setShowRoomDeleteModal(false);
              setRoomToDelete(null);
              setRoomDeleteIndex(null);
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
              <button
                type="button"
                className="project-scratch-btn-cancel"
                onClick={() => {
                  setShowRoomDeleteModal(false);
                  setRoomToDelete(null);
                  setRoomDeleteIndex(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  background: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 18px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={handleConfirmRoomDelete}
              >
                Remove Room
              </button>
            </div>
          </Modal>
        )}

        {/* Cancel confirmation modal */}
        {showCancelConfirm && (
          <Modal
            title="Discard Changes?"
            subtitle="Are you sure you want to exit the wizard? Any unsaved project and room changes will be discarded."
            onClose={() => setShowCancelConfirm(false)}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
              <button
                type="button"
                className="project-scratch-btn-cancel"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                style={{
                  background: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 18px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => {
                  setShowCancelConfirm(false);
                  onClose();
                }}
              >
                Discard & Exit
              </button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (screen === "roomConfig") {
    const l = Number(activeRoom.length) || 0;
    const w = Number(activeRoom.width) || 0;
    const h = Number(activeRoom.height) || 0;
    const area = l * w;
    const volume = l * w * h;
    const unitLabel = activeRoom.unit === "m" ? "m" : "ft";
    const areaUnitLabel = activeRoom.unit === "m" ? "sq.m" : "sq.ft";
    const volUnitLabel = activeRoom.unit === "m" ? "cu.m" : "cu.ft";
    const activeIsConfigured = (l > 0 && w > 0 && h > 0) || activeRoom.isConfigured;

    return (
      <div className="create-page-wrapper project-scratch-wrapper">
        <div className="project-scratch-container">
          <div className="project-scratch-gradient" />

          {/* Header Actions Row Frame 2147225305 */}
          <div className="project-scratch-header">
            <div className="project-scratch-header-left">
              <button
                type="button"
                className="project-scratch-back-btn"
                onClick={() => setScreen("rooms")}
                aria-label="Back to Room Setup"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="project-scratch-title-block">
                <h2>Create New Project</h2>
                <p>Set up the foundational details for your new residential project.</p>
              </div>
            </div>

            <div className="project-scratch-header-right">
              <button
                type="button"
                className="project-scratch-btn-cancel"
                onClick={() => setShowCancelConfirm(true)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="project-scratch-btn-draft"
                onClick={saveAsDraft}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save as Draft"}
              </button>
              <button
                type="button"
                className="project-scratch-btn-continue"
                onClick={continueFromRoomConfig}
                disabled={saving}
              >
                Continue to Next
              </button>
            </div>
          </div>

        {/* Step Progress Tracker Frame 2147225073 */}
        <div className="project-setup-tracker">
          <div className="project-setup-heading">PROJECT SETUP</div>
          <Steps
            current={3}
            onStepClick={(step) => {
              if (step === 1) setScreen("details");
              else if (step === 2) setScreen("rooms");
            }}
          />
        </div>

        {/* Project Details Summary Card Frame 2147225306 */}
        <div className="project-summary-card">
          <div className="project-setup-heading">PROJECT DETAILS</div>
          <div className="project-summary-panel">
            <div className="project-summary-main">
              <div className="project-summary-icon">
                <Home size={20} />
              </div>
              <div className="project-summary-info">
                <div className="project-summary-title-row">
                  <span className="project-summary-name">
                    {project?.name || form.name || "Project Name"}
                  </span>
                  <span className="project-summary-status">
                    {label(project?.status || form.status || "planning")}
                  </span>
                </div>
                <span className="project-summary-subtitle">
                  {project?.projectType || form.projectType ? `${project?.projectType || form.projectType} Interior Project` : "Residential Interior Project"}
                </span>
              </div>
            </div>

            <div className="project-summary-divider" />

            <div className="project-summary-meta-group">
              <div className="project-summary-meta-item">
                <User className="project-summary-meta-icon" />
                <div className="project-summary-meta-text">
                  <span className="project-summary-meta-label">Client</span>
                  <span className="project-summary-meta-value" title={project?.clientName || form.clientName || "—"}>
                    {project?.clientName || form.clientName || "—"}
                  </span>
                </div>
              </div>

              <div className="project-summary-meta-item">
                <MapPin className="project-summary-meta-icon" />
                <div className="project-summary-meta-text">
                  <span className="project-summary-meta-label">Location</span>
                  <span className="project-summary-meta-value" title={project?.location || form.location || "—"}>
                    {project?.location || form.location || "—"}
                  </span>
                </div>
              </div>

              <div className="project-summary-meta-item">
                <Briefcase className="project-summary-meta-icon" />
                <div className="project-summary-meta-text">
                  <span className="project-summary-meta-label">Type</span>
                  <span className="project-summary-meta-value" title={project?.projectType || form.projectType || "Residential"}>
                    {project?.projectType || form.projectType || "Residential"}
                  </span>
                </div>
              </div>

              <div className="project-summary-meta-item">
                <Calendar className="project-summary-meta-icon" />
                <div className="project-summary-meta-text">
                  <span className="project-summary-meta-label">Timeline</span>
                  <span
                    className="project-summary-meta-value"
                    title={formatTimeline(project?.startDate || form.startDate, project?.targetCompletionDate || form.targetCompletionDate)}
                  >
                    {formatTimeline(project?.startDate || form.startDate, project?.targetCompletionDate || form.targetCompletionDate)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="project-summary-edit-btn"
              onClick={() => setScreen("details")}
            >
              Edit Project
            </button>
          </div>
        </div>

        {/* Dynamic Room Summary Metrics Bar (Frame 2147225071) */}
        <div className="room-metrics-bar">
          <div className="room-metric-card">
            <span className="room-metric-label">Total Rooms</span>
            <span className="room-metric-value">{rooms.length}</span>
          </div>
          <div className="room-metric-card">
            <span className="room-metric-label">Configured</span>
            <span className="room-metric-value configured">{configuredCount}</span>
          </div>
          <div className="room-metric-card">
            <span className="room-metric-label">Pending</span>
            <span className="room-metric-value pending">{Math.max(0, rooms.length - configuredCount)}</span>
          </div>
        </div>

        {/* Main Two-Column Workspace (Frame 2147225336) */}
        <div className="room-dimensions-layout">
          {/* Left Column: PROJECT ROOMS (Frame 2147225072) */}
          <div className="project-rooms-panel">
            <h3 className="project-rooms-title">PROJECT ROOMS</h3>
            <div className="project-rooms-card">
              {rooms.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#64748B", fontSize: "14px", width: "100%" }}>
                  No rooms added yet.
                </div>
              ) : (
                rooms.map((r, i) => {
                  const isConf = (Number(r.length) > 0 && Number(r.width) > 0 && Number(r.height) > 0) || r.isConfigured;
                  const isSelected = i === activeRoomIndex;
                  const roomUnit = r.unit || "ft";

                  return (
                    <div
                      key={r.id || `room-${i}`}
                      className={`project-room-item ${isSelected ? "active" : ""}`}
                      onClick={() => setActiveRoomIndex(i)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveRoomIndex(i);
                        }
                      }}
                    >
                      <div className="project-room-item-top">
                        <div className="project-room-item-left">
                          <div className="project-room-num-badge">
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <span className="project-room-name" title={r.name || `Room ${i + 1}`}>
                            {r.name || `Room ${i + 1}`}
                          </span>
                        </div>
                        <span className={`project-room-status ${isConf ? "configured" : "pending"}`}>
                          {isConf ? "CONFIGURED" : "PENDING"}
                        </span>
                      </div>

                      <div className="project-room-item-bottom">
                        <span className="project-room-type-text" title={r.roomType || "Room"}>
                          {r.roomType || "Room"}
                        </span>
                        <span className="project-room-dim-text">
                          {isConf
                            ? `${r.length} × ${r.width} × ${r.height || 0} ${roomUnit}`
                            : "Dimensions not added"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: ROOM DIMENSIONS (Frame 2147225306) */}
          <div className="room-dimensions-panel">
            {/* Header above form (Frame 2147225339) */}
            <div className="room-detail-header-row">
              <div className="room-detail-header-left">
                <h3 className="room-detail-title">
                  {(activeRoom.name || "ROOM").toUpperCase()}
                </h3>
                <span className={`project-room-status ${activeIsConfigured ? "configured" : "pending"}`}>
                  {activeIsConfigured ? "CONFIGURED" : "PENDING"}
                </span>
              </div>

              <div className="room-detail-actions-right">
                <button
                  type="button"
                  className="room-action-btn"
                  onClick={() => {
                    roomNameInputRef.current?.focus();
                    roomNameInputRef.current?.select();
                  }}
                >
                  Edit Name
                </button>
                <button
                  type="button"
                  className="room-action-btn"
                  onClick={handleDuplicateActiveRoom}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="room-action-btn icon-only"
                  onClick={() => confirmDeleteRoom(activeRoomIndex)}
                  title="Delete Room"
                  aria-label="Delete Room"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Inner Form Card (Frame 93) */}
            <div className="room-form-card">
              {/* Section 1: ROOM INFORMATION (Frame 2147225340) */}
              <div className="room-info-section">
                <h4 className="room-section-heading">ROOM INFORMATION</h4>
                <div className="room-info-grid">
                  <div className="dimension-input-group">
                    <label className="dimension-label">
                      Room Name <span className="req-star">*</span>
                    </label>
                    <input
                      ref={roomNameInputRef}
                      type="text"
                      className="dimension-text-input"
                      value={activeRoom.name || ""}
                      onChange={(e) => updateActiveRoomField("name", e.target.value)}
                      placeholder="ex. Master Bedroom"
                    />
                  </div>

                  <div className="dimension-input-group">
                    <label className="dimension-label">
                      Room Type <span className="req-star">*</span>
                    </label>
                    <div className="dimension-select-box">
                      <select
                        className="dimension-select"
                        value={activeRoom.roomType || ""}
                        onChange={(e) => updateActiveRoomField("roomType", e.target.value)}
                      >
                        <option value="" disabled>
                          Select type
                        </option>
                        <option value="Master Bedroom">Master Bedroom</option>
                        <option value="Bedroom">Bedroom</option>
                        <option value="Living Room">Living Room</option>
                        <option value="Dining Room">Dining Room</option>
                        <option value="Kitchen">Kitchen</option>
                        <option value="Study Room">Study Room</option>
                        <option value="Guest Bedroom">Guest Bedroom</option>
                        <option value="Bathroom">Bathroom</option>
                        <option value="Balcony">Balcony</option>
                        <option value="Pooja Room">Pooja Room</option>
                        <option value="Utility">Utility</option>
                      </select>
                      <ChevronDown size={16} className="dimension-select-chevron" />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="dimension-divider" />

              {/* Section 2: ROOM DIMENSIONS (Frame 2147225342) */}
              <div className="room-info-section">
                <div className="room-dimensions-header-row">
                  <div className="room-dimensions-header-left">
                    <h4 className="room-section-heading">ROOM DIMENSIONS</h4>
                    <p className="room-dimensions-subtitle">
                      Give each room a clear name so it can be identified throughout the BOQ workflow.
                    </p>
                  </div>

                  {/* Unit Selector */}
                  <div className="room-unit-selector-box">
                    <select
                      className="room-unit-select"
                      value={activeRoom.unit || "ft"}
                      onChange={(e) => handleUnitChange(e.target.value as "ft" | "m")}
                      aria-label="Unit of measurement"
                    >
                      <option value="ft">Feet</option>
                      <option value="m">Meters</option>
                    </select>
                    <ChevronDown size={14} className="room-unit-chevron" />
                  </div>
                </div>

                {/* 3 Inputs Row (Length x Width x Height) */}
                <div className="dimension-triplet-row">
                  <div className="dimension-triplet-col">
                    <label className="dimension-label">
                      Length <span className="req-star">*</span>
                    </label>
                    <div className="dimension-input-suffix-wrap">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="dimension-numeric-input"
                        value={activeRoom.length ?? ""}
                        onChange={(e) =>
                          updateActiveRoomField("length", e.target.value ? Math.max(0, Number(e.target.value)) : null)
                        }
                        placeholder="0"
                      />
                      <span className="dimension-unit-tag">{unitLabel}</span>
                    </div>
                  </div>

                  <div className="dimension-times-separator">×</div>

                  <div className="dimension-triplet-col">
                    <label className="dimension-label">
                      Width <span className="req-star">*</span>
                    </label>
                    <div className="dimension-input-suffix-wrap">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="dimension-numeric-input"
                        value={activeRoom.width ?? ""}
                        onChange={(e) =>
                          updateActiveRoomField("width", e.target.value ? Math.max(0, Number(e.target.value)) : null)
                        }
                        placeholder="0"
                      />
                      <span className="dimension-unit-tag">{unitLabel}</span>
                    </div>
                  </div>

                  <div className="dimension-times-separator">×</div>

                  <div className="dimension-triplet-col">
                    <label className="dimension-label">
                      Height <span className="req-star">*</span>
                    </label>
                    <div className="dimension-input-suffix-wrap">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="dimension-numeric-input"
                        value={activeRoom.height ?? ""}
                        onChange={(e) =>
                          updateActiveRoomField("height", e.target.value ? Math.max(0, Number(e.target.value)) : null)
                        }
                        placeholder="0"
                      />
                      <span className="dimension-unit-tag">{unitLabel}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: ROOM MEASUREMENT SUMMARY (Frame 2147225355) */}
              <div className="room-summary-calc-panel">
                <h4 className="room-summary-calc-title">ROOM MEASUREMENT SUMMARY</h4>
                <div className="room-summary-calc-grid">
                  <div className="room-calc-card">
                    <span className="room-calc-type-label">AREA</span>
                    <div className="room-calc-value-row">
                      <span className="room-calc-big-num">{area > 0 ? area.toLocaleString() : "0"}</span>
                      <span className="room-calc-unit">{areaUnitLabel}</span>
                    </div>
                    <span className="room-calc-formula">
                      {l > 0 && w > 0
                        ? `${l} × ${w} = ${area.toLocaleString()} ${areaUnitLabel}`
                        : `0 × 0 = 0 ${areaUnitLabel}`}
                    </span>
                  </div>

                  <div className="room-calc-card">
                    <span className="room-calc-type-label">VOLUME</span>
                    <div className="room-calc-value-row">
                      <span className="room-calc-big-num">{volume > 0 ? volume.toLocaleString() : "0"}</span>
                      <span className="room-calc-unit">{volUnitLabel}</span>
                    </div>
                    <span className="room-calc-formula">
                      {l > 0 && w > 0 && h > 0
                        ? `${l} × ${w} × ${h} = ${volume.toLocaleString()} ${volUnitLabel}`
                        : `0 × 0 × 0 = 0 ${volUnitLabel}`}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="dimension-divider" />

              {/* Section 4: Room Notes */}
              <div className="room-info-section">
                <label className="dimension-label">Room Notes</label>
                <textarea
                  rows={3}
                  className="room-notes-textarea"
                  value={activeRoom.notes || ""}
                  onChange={(e) => updateActiveRoomField("notes", e.target.value)}
                  placeholder="ex. notes"
                />
              </div>

              <hr className="dimension-divider" />

              {/* Section 5: Room References (Frame 2147225297) */}
              <div className="room-info-section">
                <label className="dimension-label">ROOM REFERENCES</label>
                {activeRoom.referenceImageUrl ? (
                  <div className="room-ref-preview-card">
                    <img
                      src={activeRoom.referenceImageUrl}
                      alt="Room Reference"
                      className="room-ref-preview-img"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A", margin: "0 0 6px 0" }}>
                        Reference Image Attached
                      </p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <label
                          style={{
                            cursor: uploadingRoomRef ? "not-allowed" : "pointer",
                            fontSize: "12px",
                            color: "#2563EB",
                            fontWeight: 600,
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            display: "inline-block",
                          }}
                        >
                          {uploadingRoomRef ? "Uploading…" : "Replace"}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            disabled={uploadingRoomRef}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadRoomRef(file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          style={{
                            fontSize: "12px",
                            color: "#DC2626",
                            fontWeight: 600,
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "#FEF2F2",
                            border: "1px solid #FECACA",
                            cursor: "pointer",
                          }}
                          onClick={() => updateActiveRoomField("referenceImageUrl", null)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="room-ref-dropzone" title="Upload room reference image">
                    <UploadCloud size={24} style={{ color: "#0F172A" }} />
                    <span className="room-ref-dropzone-text">
                      {uploadingRoomRef ? "Uploading…" : "UPLOAD IMAGE"}
                    </span>
                    <span style={{ display: "none" }}>Upload room reference image</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      disabled={uploadingRoomRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadRoomRef(file);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Bottom Actions inside Form Panel (Frame 2147225069) */}
              <div className="room-form-bottom-actions">
                <button
                  type="button"
                  className="room-form-cancel-btn"
                  onClick={handleCancelRoomForm}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="room-form-save-btn"
                  onClick={saveSingleActiveRoom}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save Room"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {roomNotice && (
          <div style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background: "#16A34A",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontFamily: "'Urbanist', sans-serif",
            fontWeight: 600,
            fontSize: "14px",
          }}>
            {roomNotice}
          </div>
        )}

        {error && <p className="form-error">{error}</p>}
        </div>

        {/* Confirmation Modal for deleting room */}
        {showRoomDeleteModal && roomToDelete && (
          <Modal
            title="Remove Room?"
            subtitle={`Are you sure you want to remove "${roomToDelete.name || 'this room'}"? Any configurations or items for this room will be lost.`}
            onClose={() => {
              setShowRoomDeleteModal(false);
              setRoomToDelete(null);
              setRoomDeleteIndex(null);
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
              <button
                type="button"
                className="project-scratch-btn-cancel"
                onClick={() => {
                  setShowRoomDeleteModal(false);
                  setRoomToDelete(null);
                  setRoomDeleteIndex(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  background: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 18px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={handleConfirmRoomDelete}
              >
                Remove Room
              </button>
            </div>
          </Modal>
        )}

        {/* Cancel confirmation modal */}
        {showCancelConfirm && (
          <Modal
            title="Discard Changes?"
            subtitle="Are you sure you want to exit the wizard? Any unsaved project and room changes will be discarded."
            onClose={() => setShowCancelConfirm(false)}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
              <button
                type="button"
                className="project-scratch-btn-cancel"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                style={{
                  background: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 18px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => {
                  setShowCancelConfirm(false);
                  onClose();
                }}
              >
                Discard & Exit
              </button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (screen === "requirements") {
    const l = Number(activeRoom.length) || 0;
    const w = Number(activeRoom.width) || 0;
    const h = Number(activeRoom.height) || 0;
    const area = l * w;
    const volume = l * w * h;
    const unitLabel = activeRoom.unit === "m" ? "m" : "ft";
    const areaUnitLabel = activeRoom.unit === "m" ? "sq.m" : "sq.ft";
    const volUnitLabel = activeRoom.unit === "m" ? "cu.m" : "cu.ft";
    const activeIsConfigured = (l > 0 && w > 0 && h > 0) || activeRoom.isConfigured;

    const currentRoomReqs = activeRoom.requirements || [];

    return (
      <div className="create-page-wrapper project-scratch-wrapper">
        <div className="project-scratch-container">
          <div className="project-scratch-gradient" />

          {/* Header Actions Row (Frame 2147225305) */}
          <div className="project-scratch-header">
            <div className="project-scratch-header-left">
              <button
                type="button"
                className="project-scratch-back-btn"
                onClick={() => {
                  setAddingRequirement(false);
                  setEditingReqId(null);
                  setScreen("roomConfig");
                }}
                aria-label="Back to Room Dimensions"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="project-scratch-title-block">
                <h2>Create New Project</h2>
                <p>Set up the foundational details for your new residential project.</p>
              </div>
            </div>

            <div className="project-scratch-header-right">
              <button
                type="button"
                className="project-scratch-btn-cancel"
                onClick={() => setShowCancelConfirm(true)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="project-scratch-btn-draft"
                onClick={saveAsDraft}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save as Draft"}
              </button>
              <button
                type="button"
                className="project-scratch-btn-continue"
                onClick={() => {
                  setAddingRequirement(false);
                  setEditingReqId(null);
                  setScreen("materials");
                }}
                disabled={saving}
              >
                Continue to Next
              </button>
            </div>
          </div>

        {/* Step Progress Tracker (Frame 2147225073) */}
        <div className="project-setup-tracker">
          <div className="project-setup-heading">PROJECT SETUP</div>
          <Steps
            current={4}
            onStepClick={(step) => {
              if (step === 1) setScreen("details");
              else if (step === 2) setScreen("rooms");
              else if (step === 3) setScreen("roomConfig");
            }}
          />
        </div>

        {/* Project Details Summary Card (Frame 2147225306) */}
        <div className="project-summary-card">
          <div className="project-setup-heading">PROJECT DETAILS</div>
          <div className="project-summary-panel">
            <div className="project-summary-main">
              <div className="project-summary-icon">
                <Home size={20} />
              </div>
              <div className="project-summary-info">
                <div className="project-summary-title-row">
                  <span className="project-summary-name">
                    {project?.name || form.name || "Project Name"}
                  </span>
                  <span className="project-summary-status">
                    {label(project?.status || form.status || "planning")}
                  </span>
                </div>
                <span className="project-summary-subtitle">
                  {project?.projectType || form.projectType ? `${project?.projectType || form.projectType} Interior Project` : "Residential Interior Project"}
                </span>
              </div>
            </div>

            <div className="project-summary-divider" />

            <div className="project-summary-meta-group">
              <div className="project-summary-meta-item">
                <User className="project-summary-meta-icon" />
                <div className="project-summary-meta-text">
                  <span className="project-summary-meta-label">Client</span>
                  <span className="project-summary-meta-value" title={project?.clientName || form.clientName || "—"}>
                    {project?.clientName || form.clientName || "—"}
                  </span>
                </div>
              </div>

              <div className="project-summary-meta-item">
                <MapPin className="project-summary-meta-icon" />
                <div className="project-summary-meta-text">
                  <span className="project-summary-meta-label">Location</span>
                  <span className="project-summary-meta-value" title={project?.location || form.location || "—"}>
                    {project?.location || form.location || "—"}
                  </span>
                </div>
              </div>

              <div className="project-summary-meta-item">
                <Briefcase className="project-summary-meta-icon" />
                <div className="project-summary-meta-text">
                  <span className="project-summary-meta-label">Type</span>
                  <span className="project-summary-meta-value" title={project?.projectType || form.projectType || "Residential"}>
                    {project?.projectType || form.projectType || "Residential"}
                  </span>
                </div>
              </div>

              <div className="project-summary-meta-item">
                <Calendar className="project-summary-meta-icon" />
                <div className="project-summary-meta-text">
                  <span className="project-summary-meta-label">Timeline</span>
                  <span
                    className="project-summary-meta-value"
                    title={formatTimeline(project?.startDate || form.startDate, project?.targetCompletionDate || form.targetCompletionDate)}
                  >
                    {formatTimeline(project?.startDate || form.startDate, project?.targetCompletionDate || form.targetCompletionDate)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="project-summary-edit-btn"
              onClick={() => setScreen("details")}
            >
              Edit Project
            </button>
          </div>
        </div>

        {/* Dynamic Room Summary Metrics Bar (Frame 2147225071) */}
        <div className="room-metrics-bar">
          <div className="room-metric-card">
            <span className="room-metric-label">Total Rooms</span>
            <span className="room-metric-value">{rooms.length}</span>
          </div>
          <div className="room-metric-card">
            <span className="room-metric-label">Configured</span>
            <span className="room-metric-value configured">{configuredCount}</span>
          </div>
          <div className="room-metric-card">
            <span className="room-metric-label">Pending</span>
            <span className="room-metric-value pending">{Math.max(0, rooms.length - configuredCount)}</span>
          </div>
        </div>

        {/* Main Two-Column Layout (Frame 2147224971) */}
        <div className="requirements-layout">
          {/* Left Column: Project Rooms (Frame 2147225072 - 380px) */}
          <div className="project-rooms-panel">
            <h3 className="project-rooms-title">PROJECT ROOMS</h3>
            <div className="project-rooms-card">
              {rooms.map((r, i) => {
                const reqCount = r.requirements?.length || 0;
                const isSelected = i === activeRoomIndex;
                const isRoomConfigured = (Number(r.length) > 0 && Number(r.width) > 0 && Number(r.height) > 0) || r.isConfigured;

                return (
                  <div
                    key={r.id || i}
                    className={`project-room-item ${isSelected ? "active" : ""}`}
                    onClick={() => {
                      setActiveRoomIndex(i);
                      setAddingRequirement(false);
                      setEditingReqId(null);
                    }}
                  >
                    <div className="project-room-item-top">
                      <div className="project-room-item-left">
                        <span className="project-room-num-badge">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="project-room-name">
                          {r.name || `Room ${i + 1}`}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {reqCount > 0 && (
                          <span className="project-room-req-count-badge">{reqCount}</span>
                        )}
                        <span className={`project-room-status ${isRoomConfigured ? "configured" : "pending"}`}>
                          {isRoomConfigured ? "CONFIGURED" : "PENDING"}
                        </span>
                      </div>
                    </div>

                    <div className="project-room-item-bottom">
                      <span className={`project-room-items-count-text ${reqCount > 0 ? "has-items" : ""}`}>
                        {reqCount > 0 ? `✓ ${reqCount} item${reqCount > 1 ? "s" : ""} added` : "No requirements yet"}
                      </span>
                      <span className="project-room-dim-text">
                        {r.length && r.width ? `${r.length}x${r.width} ${r.unit || "ft"}` : "Dimensions pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Requirements Workspace (930px) */}
          <div className="requirements-workspace-panel">
            {/* Header row for active room */}
            <div className="room-detail-header-row">
              <div className="room-detail-header-left">
                <h3 className="room-detail-title">
                  {activeRoom.name?.toUpperCase() || "ROOM"}
                </h3>
                <span className={`project-room-status ${activeIsConfigured ? "configured" : "pending"}`}>
                  {activeIsConfigured ? "CONFIGURED" : "PENDING"}
                </span>
              </div>
              <div className="room-detail-actions-right">
                <button
                  type="button"
                  className="room-action-btn"
                  onClick={() => {
                    const nextName = prompt("Enter new room name:", activeRoom.name);
                    if (nextName?.trim()) updateActiveRoomField("name", nextName.trim());
                  }}
                >
                  <Edit2 size={14} /> Edit Name
                </button>
              </div>
            </div>

            {/* Inner Workspace Card (Frame 93) */}
            <div className="room-form-card">
              {!addingRequirement ? (
                /* VIEW 1: Requirements Overview / Cards List */
                <>
                  <div className="requirements-overview-header">
                    <h4 className="requirements-overview-title">Requirement</h4>
                    <button
                      type="button"
                      className="add-requirement-primary-btn"
                      onClick={() => {
                        setReqForm({
                          name: "Wardrobe",
                          category: "Storage",
                          length: "8",
                          depth: "2",
                          height: "8",
                          unit: "Unit",
                          quantity: 1,
                          partitions: 4,
                          notes: "",
                          referenceImageUrl: null,
                        });
                        setEditingReqId(null);
                        setAddingRequirement(true);
                      }}
                    >
                      <Plus size={16} /> Add Requirement
                    </button>
                  </div>

                  {!currentRoomReqs.length ? (
                    <>
                      <div className="empty-requirements-state">
                        <div className="empty-requirements-icon">
                          <Plus size={24} />
                        </div>
                        <h4 className="empty-requirements-title">No Requirements Added</h4>
                        <p className="empty-requirements-desc">
                          Add the furniture, storage, panels, cabinets, or other items required for this room.
                        </p>
                        <button
                          type="button"
                          className="add-requirement-primary-btn"
                          onClick={() => {
                            setReqForm({
                              name: "Wardrobe",
                              category: "Storage",
                              length: "8",
                              depth: "2",
                              height: "8",
                              unit: "Unit",
                              quantity: 1,
                              partitions: 4,
                              notes: "",
                              referenceImageUrl: null,
                            });
                            setEditingReqId(null);
                            setAddingRequirement(true);
                          }}
                        >
                          <Plus size={16} /> Add Requirement
                        </button>
                      </div>

                      <div className="common-requirements-section">
                        <h5 className="common-requirements-title">
                          COMMON FOR {activeRoom.name?.toUpperCase() || "ROOM"}
                        </h5>
                        <div className="common-chips-list">
                          {["Wardrobe", "Bed Back Panel", "Side Table", "TV Unit", "Study Table", "Storage Unit"].map((c) => (
                            <button
                              key={c}
                              type="button"
                              className="common-chip-btn"
                              onClick={() => {
                                setReqForm({
                                  name: c,
                                  category: c === "Wardrobe" || c === "Storage Unit" ? "Storage" : "Furniture",
                                  length: "6",
                                  depth: "2",
                                  height: "7",
                                  unit: "Unit",
                                  quantity: 1,
                                  partitions: 2,
                                  notes: "",
                                  referenceImageUrl: null,
                                });
                                setEditingReqId(null);
                                setAddingRequirement(true);
                              }}
                            >
                              <Plus size={12} /> {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="requirements-cards-grid">
                      {currentRoomReqs.map((rq) => {
                        const isPending = !rq.materialId && rq.materialStatus !== "SELECTED";
                        return (
                          <div key={rq.id} className="requirement-item-card">
                            <div className="ric-header">
                              <div className="ric-title">
                                <h4>{rq.name}</h4>
                                <span>{rq.category || "General"}</span>
                              </div>
                              <div className="ric-header-right">
                                <span className={`material-pill ${isPending ? "pending" : "selected"}`}>
                                  {isPending ? "MATERIAL PENDING" : "MATERIAL SELECTED"}
                                </span>
                                <button
                                  type="button"
                                  className="ric-more-btn"
                                  aria-label="Requirement Options"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveReqMenu(activeReqMenu === rq.id ? null : rq.id);
                                  }}
                                >
                                  <MoreHorizontal size={16} />
                                </button>
                                {activeReqMenu === rq.id && (
                                  <div className="ric-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      className="ric-menu-item"
                                      onClick={() => openEditRequirement(rq)}
                                    >
                                      <Edit2 size={13} /> Edit Requirement
                                    </button>
                                    <button
                                      type="button"
                                      className="ric-menu-item"
                                      onClick={() => duplicateRequirement(rq.id)}
                                    >
                                      <Copy size={13} /> Duplicate Requirement
                                    </button>
                                    <button
                                      type="button"
                                      className="ric-menu-item danger"
                                      onClick={() => deleteRequirement(rq.id)}
                                    >
                                      <Trash2 size={13} /> Delete Requirement
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="ric-specs-panel">
                              <div className="ric-spec-item">
                                <span className="ric-spec-label">Dimensions</span>
                                <span className="ric-spec-value">
                                  {rq.length || 0} x {rq.depth ?? rq.breadth ?? 0} x {rq.height || 0} {rq.unit || "ft"}
                                </span>
                              </div>
                              <div className="ric-spec-item">
                                <span className="ric-spec-label">Quantity</span>
                                <span className="ric-spec-value">
                                  {rq.quantity || 1} {rq.unit || "Unit"}
                                </span>
                              </div>
                              <div className="ric-spec-item">
                                <span className="ric-spec-label">Partitions</span>
                                <span className="ric-spec-value">{rq.partitions || 0}</span>
                              </div>
                            </div>

                            <div className="ric-footer-row">
                              <span className="ric-footer-label">Material</span>
                              <span className="ric-footer-val">{rq.materialName || "Not Selected"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* VIEW 2: Add / Edit Requirement Form */
                <>
                  <div className="req-form-header-block">
                    <h4 className="req-form-title">{editingReqId ? "Edit Requirement" : "Add Requirement"}</h4>
                    <p className="req-form-subtitle">
                      Select what needs to be built or installed in <b>{activeRoom.name?.toUpperCase()}</b>
                    </p>
                  </div>

                  {/* Room Dimensions Info Strip (Frame 2147225345) */}
                  <div className="req-header-info-strip">
                    <div className="req-header-info-item">
                      <span className="req-header-info-label">ROOM</span>
                      <span className="req-header-info-val">
                        {l}x{w}x{h} {unitLabel}
                      </span>
                    </div>
                    <div className="req-header-info-item">
                      <span className="req-header-info-label">AREA</span>
                      <span className="req-header-info-val">
                        {area} {areaUnitLabel}
                      </span>
                    </div>
                    <div className="req-header-info-item">
                      <span className="req-header-info-label">VOLUME</span>
                      <span className="req-header-info-val">
                        {volume} {volUnitLabel}
                      </span>
                    </div>
                  </div>

                  {/* Requirement Type Search and Category Chips */}
                  <div className="room-info-section">
                    <label className="dimension-label">
                      Requirement Type <span className="req-star">*</span>
                    </label>
                    <div className="req-type-search-wrap">
                      <Search size={16} className="req-type-search-icon" />
                      <input
                        className="req-type-search-input"
                        placeholder="Search items..."
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="req-categories-group">
                    {/* Storage */}
                    <div className="req-category-block">
                      <span className="req-category-label">STORAGE</span>
                      <div className="req-chips-cluster">
                        {["Wardrobe", "Storage Unit", "Shoe Cabinet"]
                          .filter((c) => !itemSearchQuery || c.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                          .map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`req-chip-btn ${reqForm.name === c ? "selected" : ""}`}
                              onClick={() => {
                                setReqForm((f) => ({ ...f, name: c, category: "Storage" }));
                              }}
                            >
                              {c}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Furniture */}
                    <div className="req-category-block">
                      <span className="req-category-label">FURNITURE</span>
                      <div className="req-chips-cluster">
                        {["Bed Back Panel", "Study Table", "Side Table", "TV Unit", "Vanity"]
                          .filter((c) => !itemSearchQuery || c.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                          .map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`req-chip-btn ${reqForm.name === c ? "selected" : ""}`}
                              onClick={() => {
                                setReqForm((f) => ({ ...f, name: c, category: "Furniture" }));
                              }}
                            >
                              {c}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Kitchen */}
                    <div className="req-category-block">
                      <span className="req-category-label">KITCHEN</span>
                      <div className="req-chips-cluster">
                        {["Base Cabinet", "Wall Cabinet", "Tall Unit", "Pantry", "Overhead Cabinet"]
                          .filter((c) => !itemSearchQuery || c.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                          .map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`req-chip-btn ${reqForm.name === c ? "selected" : ""}`}
                              onClick={() => {
                                setReqForm((f) => ({ ...f, name: c, category: "Kitchen" }));
                              }}
                            >
                              {c}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Wall & Ceiling */}
                    <div className="req-category-block">
                      <span className="req-category-label">WALL & CEILING</span>
                      <div className="req-chips-cluster">
                        {["Wall Panel", "False Ceiling", "Decorative Panel"]
                          .filter((c) => !itemSearchQuery || c.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                          .map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`req-chip-btn ${reqForm.name === c ? "selected" : ""}`}
                              onClick={() => {
                                setReqForm((f) => ({ ...f, name: c, category: "Wall & Ceiling" }));
                              }}
                            >
                              {c}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Other */}
                    <div className="req-category-block">
                      <span className="req-category-label">OTHER</span>
                      <div className="req-chips-cluster">
                        <button
                          type="button"
                          className={`req-chip-btn ${reqForm.name === "Custom Item" || (!["Wardrobe", "Storage Unit", "Shoe Cabinet", "Bed Back Panel", "Study Table", "Side Table", "TV Unit", "Vanity", "Base Cabinet", "Wall Cabinet", "Tall Unit", "Pantry", "Overhead Cabinet", "Wall Panel", "False Ceiling", "Decorative Panel"].includes(reqForm.name) && reqForm.category === "Other") ? "selected" : ""}`}
                          onClick={() => {
                            const n = prompt("Enter custom requirement name:", reqForm.name || "Custom Item") || "Custom Item";
                            setReqForm((f) => ({ ...f, name: n, category: "Other" }));
                          }}
                        >
                          Custom Item
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Selected Item Detail Banner */}
                  <div className="req-selected-item-banner">
                    <div className="req-selected-item-left">
                      <span className="req-selected-item-name">{reqForm.name || "Selected Item"}</span>
                      <span className="req-selected-item-cat">{reqForm.category || "General"}</span>
                    </div>
                    <span className="req-selected-item-note">
                      Item dimensions are separate from room size
                    </span>
                  </div>

                  <hr className="dimension-divider" />

                  {/* Section: Item Dimensions */}
                  <div className="room-info-section">
                    <span className="room-dimensions-subtitle" style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
                      Item Dimensions
                    </span>

                    <div className="dimension-triplet-row">
                      <div className="dimension-triplet-col">
                        <label className="dimension-label">
                          Length <span className="req-star">*</span>
                        </label>
                        <div className="dimension-input-suffix-wrap">
                          <input
                            type="number"
                            step="any"
                            className="dimension-numeric-input"
                            value={reqForm.length}
                            onChange={(e) => setReqForm((f) => ({ ...f, length: e.target.value }))}
                          />
                          <span className="dimension-unit-tag">{unitLabel}</span>
                        </div>
                      </div>

                      <div className="dimension-times-separator">x</div>

                      <div className="dimension-triplet-col">
                        <label className="dimension-label">
                          Breadth/Depth <span className="req-star">*</span>
                        </label>
                        <div className="dimension-input-suffix-wrap">
                          <input
                            type="number"
                            step="any"
                            className="dimension-numeric-input"
                            value={reqForm.depth}
                            onChange={(e) => setReqForm((f) => ({ ...f, depth: e.target.value }))}
                          />
                          <span className="dimension-unit-tag">{unitLabel}</span>
                        </div>
                      </div>

                      <div className="dimension-times-separator">x</div>

                      <div className="dimension-triplet-col">
                        <label className="dimension-label">
                          Height <span className="req-star">*</span>
                        </label>
                        <div className="dimension-input-suffix-wrap">
                          <input
                            type="number"
                            step="any"
                            className="dimension-numeric-input"
                            value={reqForm.height}
                            onChange={(e) => setReqForm((f) => ({ ...f, height: e.target.value }))}
                          />
                          <span className="dimension-unit-tag">{unitLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Quantity, Unit & Partitions */}
                  <div className="room-info-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                    <div className="dimension-input-group">
                      <label className="dimension-label">
                        Quantity <span className="req-star">*</span>
                      </label>
                      <div className="req-stepper-wrap">
                        <button
                          type="button"
                          className="req-stepper-btn"
                          aria-label="Decrease quantity"
                          onClick={() => setReqForm((f) => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          className="req-stepper-num-input"
                          value={reqForm.quantity}
                          onChange={(e) =>
                            setReqForm((f) => ({ ...f, quantity: Math.max(1, Number(e.target.value) || 1) }))
                          }
                        />
                        <button
                          type="button"
                          className="req-stepper-btn"
                          aria-label="Increase quantity"
                          onClick={() => setReqForm((f) => ({ ...f, quantity: f.quantity + 1 }))}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="dimension-input-group">
                      <label className="dimension-label">
                        Unit <span className="req-star">*</span>
                      </label>
                      <div className="dimension-select-box">
                        <select
                          className="dimension-select"
                          value={reqForm.unit}
                          onChange={(e) => setReqForm((f) => ({ ...f, unit: e.target.value }))}
                        >
                          <option value="Unit">Unit</option>
                          <option value="Nos">Nos</option>
                          <option value="Sets">Sets</option>
                          <option value="ft">ft</option>
                          <option value="sq.ft">sq.ft</option>
                        </select>
                        <ChevronDown size={14} className="dimension-select-chevron" />
                      </div>
                    </div>

                    <div className="dimension-input-group">
                      <label className="dimension-label">
                        Number of Partitions <span className="req-star">*</span>
                      </label>
                      <div className="req-stepper-wrap">
                        <button
                          type="button"
                          className="req-stepper-btn"
                          aria-label="Decrease partitions"
                          onClick={() => setReqForm((f) => ({ ...f, partitions: Math.max(0, f.partitions - 1) }))}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          className="req-stepper-num-input"
                          value={reqForm.partitions}
                          onChange={(e) =>
                            setReqForm((f) => ({ ...f, partitions: Math.max(0, Number(e.target.value) || 0) }))
                          }
                        />
                        <button
                          type="button"
                          className="req-stepper-btn"
                          aria-label="Increase partitions"
                          onClick={() => setReqForm((f) => ({ ...f, partitions: f.partitions + 1 }))}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="req-helper-text">
                        Partitions will be used later to calculate material requirements.
                      </p>
                    </div>
                  </div>

                  <hr className="dimension-divider" />

                  {/* Section: Requirement Notes */}
                  <div className="room-info-section">
                    <label className="dimension-label">Requirement Notes</label>
                    <textarea
                      rows={3}
                      className="room-notes-textarea"
                      value={reqForm.notes}
                      onChange={(e) => setReqForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="ex. add notes about this item..."
                    />
                  </div>

                  <hr className="dimension-divider" />

                  {/* Section: Requirement References */}
                  <div className="room-info-section">
                    <label className="dimension-label">Requirement References</label>
                    <p style={{ fontSize: "12px", color: "#64748B", margin: "-8px 0 4px 0" }}>
                      Upload reference design, finish or detail photos (JPG, PNG, WebP up to 5MB).
                    </p>
                    {reqForm.referenceImageUrl ? (
                      <div className="room-ref-preview-card">
                        <img
                          src={reqForm.referenceImageUrl}
                          alt="Requirement Reference"
                          className="room-ref-preview-img"
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A", margin: "0 0 6px 0" }}>
                            Reference Image Attached
                          </p>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <label
                              style={{
                                cursor: uploadingReqRef ? "not-allowed" : "pointer",
                                fontSize: "12px",
                                color: "#2563EB",
                                fontWeight: 600,
                                padding: "6px 12px",
                                borderRadius: "6px",
                                background: "#EFF6FF",
                                border: "1px solid #BFDBFE",
                                display: "inline-block",
                              }}
                            >
                              {uploadingReqRef ? "Uploading…" : "Replace"}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                disabled={uploadingReqRef}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadReqRef(file);
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              style={{
                                fontSize: "12px",
                                color: "#DC2626",
                                fontWeight: 600,
                                padding: "6px 12px",
                                borderRadius: "6px",
                                background: "#FEF2F2",
                                border: "1px solid #FECACA",
                                cursor: "pointer",
                              }}
                              onClick={() => setReqForm((f) => ({ ...f, referenceImageUrl: null }))}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="room-ref-dropzone" title="Upload reference photo">
                        <UploadCloud size={24} style={{ color: "#0F172A" }} />
                        <span className="room-ref-dropzone-text">
                          {uploadingReqRef ? "Uploading…" : "UPLOAD IMAGE"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          disabled={uploadingReqRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadReqRef(file);
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Bottom Actions inside Panel (Frame 2147225069) */}
                  <div className="room-form-bottom-actions">
                    <button
                      type="button"
                      className="room-form-cancel-btn"
                      onClick={() => {
                        setAddingRequirement(false);
                        setEditingReqId(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="room-form-save-btn"
                      onClick={saveRequirement}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save Requirement"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {roomNotice && (
          <div style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background: "#16A34A",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontFamily: "'Urbanist', sans-serif",
            fontWeight: 600,
            fontSize: "14px",
          }}>
            {roomNotice}
          </div>
        )}

        {error && <p className="form-error">{error}</p>}
        </div>

        {/* Confirmation Modal for deleting room */}
        {showRoomDeleteModal && roomToDelete && (
          <Modal
            title="Remove Room?"
            subtitle={`Are you sure you want to remove "${roomToDelete.name || 'this room'}"? Any configurations or items for this room will be lost.`}
            onClose={() => {
              setShowRoomDeleteModal(false);
              setRoomToDelete(null);
              setRoomDeleteIndex(null);
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
              <button
                type="button"
                className="project-scratch-btn-cancel"
                onClick={() => {
                  setShowRoomDeleteModal(false);
                  setRoomToDelete(null);
                  setRoomDeleteIndex(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  background: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 18px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={handleConfirmRoomDelete}
              >
                Remove Room
              </button>
            </div>
          </Modal>
        )}

        {/* Cancel confirmation modal */}
        {showCancelConfirm && (
          <Modal
            title="Discard Changes?"
            subtitle="Are you sure you want to exit the wizard? Any unsaved project and room changes will be discarded."
            onClose={() => setShowCancelConfirm(false)}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
              <button
                type="button"
                className="project-scratch-btn-cancel"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                style={{
                  background: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 18px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => {
                  setShowCancelConfirm(false);
                  onClose();
                }}
              >
                Discard & Exit
              </button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (screen === "materials") {
    const curItem = activeReqForMaterial?.req;
    const curRoom = activeReqForMaterial?.room;

    const filteredMaterials = (materialsCatalog.length
      ? materialsCatalog
      : [
          {
            id: "mat-hdhmr-18",
            name: "18mm HDHMR Board",
            categoryName: "HDHMR",
            thickness: "18mm",
            finish: "Plain",
            unitPrice: 240,
            unit: "Sq.ft",
            stock: 320,
            brand: "Euronics",
            status: "in-stock",
          },
          {
            id: "mat-hdhmr-12",
            name: "12mm HDHMR Board",
            categoryName: "HDHMR",
            thickness: "12mm",
            finish: "Plain",
            unitPrice: 180,
            unit: "Sq.ft",
            stock: 120,
            brand: "Euronics",
            status: "low-stock",
          },
          {
            id: "mat-acrylic-3",
            name: "Acrylic Glass Board",
            categoryName: "Acrylic",
            thickness: "3mm",
            finish: "Gloss",
            unitPrice: 240,
            unit: "Sq.ft",
            stock: 320,
            brand: "Euronics",
            status: "in-stock",
          },
        ]
    ).filter((m) => {
      const q = materialSearch.toLowerCase().trim();
      return (
        !q ||
        m.name?.toLowerCase().includes(q) ||
        m.categoryName?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q) ||
        m.brand?.toLowerCase().includes(q) ||
        m.code?.toLowerCase().includes(q)
      );
    });

    return (
      <div className="create-page-wrapper project-scratch-wrapper">
        <div className="project-scratch-container">
          <div className="project-scratch-gradient" />

          {/* Header Actions Row (Frame 2147225305) */}
          <div className="project-scratch-header">
            <div className="project-scratch-header-left">
              <button
                type="button"
                className="project-scratch-back-btn"
                onClick={() => setScreen("requirements")}
                aria-label="Back to Requirements"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="project-scratch-title-block">
                <h2>Create New Project</h2>
                <p>Set up the foundational details for your new residential project.</p>
              </div>
            </div>

            <div className="project-scratch-header-right">
              <button
                type="button"
                className="project-scratch-btn-cancel"
                onClick={() => setShowCancelConfirm(true)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="project-scratch-btn-draft"
                onClick={saveAsDraft}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save as Draft"}
              </button>
              <button
                type="button"
                className="project-scratch-btn-continue"
                onClick={createBoqAndFinish}
                disabled={saving}
              >
                {saving ? "Creating BOQ…" : "Continue to BOQ"}
              </button>
            </div>
          </div>

        {/* Step Progress Tracker (Frame 2147225073) */}
        <div className="project-setup-tracker">
          <div className="project-setup-heading">PROJECT SETUP</div>
          <Steps
            current={5}
            onStepClick={(step) => {
              if (step === 1) setScreen("details");
              else if (step === 2) setScreen("rooms");
              else if (step === 3) setScreen("roomConfig");
              else if (step === 4) setScreen("requirements");
            }}
          />
        </div>

        {/* Dynamic Summary Metrics Bar (Frame 2147225071) */}
        <div className="room-metrics-bar">
          <div className="room-metric-card">
            <span className="room-metric-label">Total Rooms</span>
            <span className="room-metric-value">{rooms.length}</span>
          </div>
          <div className="room-metric-card">
            <span className="room-metric-label">Configured</span>
            <span className="room-metric-value configured">{configuredMaterialsRoomsCount}</span>
          </div>
          <div className="room-metric-card">
            <span className="room-metric-label">Pending</span>
            <span className="room-metric-value pending">{Math.max(0, rooms.length - configuredMaterialsRoomsCount)}</span>
          </div>
        </div>

        {/* Main Two-Column Layout (Frame 2147224971) */}
        <div className="material-assignment-layout">
          {/* Left Column: Project Rooms (Frame 2147225072 - 380px) */}
          <div className="material-rooms-panel">
            <h3 className="material-rooms-title">PROJECT ROOMS</h3>
            <div className="material-rooms-card">
              {rooms.length === 0 ? (
                <div style={{ fontSize: "13px", color: "#64748B", fontStyle: "italic", padding: "12px 0" }}>
                  No rooms added yet.
                </div>
              ) : (
                rooms.map((rm, i) => {
                  const roomReqs = rm.requirements || [];
                  return (
                    <div key={rm.id || i} className="material-room-group">
                      <div className="material-room-group-heading">
                        {rm.name?.toUpperCase() || `ROOM ${i + 1}`}
                      </div>
                      {roomReqs.length === 0 ? (
                        <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", padding: "4px 0 8px 0" }}>
                          No requirements in this room
                        </div>
                      ) : (
                        roomReqs.map((rq) => {
                          const isAssigned = Boolean(rq.materialId || rq.materialStatus === "SELECTED" || rq.materialName);
                          const isActive = activeMaterialReqId === rq.id;
                          return (
                            <div
                              key={rq.id}
                              className={`material-requirement-row-card ${isActive ? "active" : ""}`}
                              onClick={() => setActiveMaterialReqId(rq.id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setActiveMaterialReqId(rq.id);
                                }
                              }}
                            >
                              <div className="mr-card-top">
                                <h4 className="mr-card-title" title={rq.name}>{rq.name}</h4>
                                <span className={`mr-card-badge ${isAssigned ? "selected" : "pending"}`}>
                                  {isAssigned ? "SELECTED" : "PENDING"}
                                </span>
                              </div>
                              <div className="mr-card-bottom">
                                {isAssigned ? (
                                  <span className="mr-card-mat-name" title={rq.materialName || "Material assigned"}>
                                    {rq.materialName || "Material assigned"}
                                  </span>
                                ) : (
                                  <span className="mr-card-no-mat">No material selected</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      {i < rooms.length - 1 && <div className="material-room-group-divider" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Material Assignment Workspace (Frame 2147225306 - 930px) */}
          <div className="material-workspace-panel">
            {/* Upper Requirement Summary Card (Frame 93, 890px × 75px) */}
            {curItem && curRoom ? (
              <div className="material-requirement-summary-card">
                <div className="mr-summary-col">
                  <span className="mr-summary-label">Item</span>
                  <span className="mr-summary-value" title={curItem.name}>{curItem.name}</span>
                </div>
                <div className="mr-summary-col">
                  <span className="mr-summary-label">Room</span>
                  <span className="mr-summary-value" title={curRoom.name}>{curRoom.name}</span>
                </div>
                <div className="mr-summary-col">
                  <span className="mr-summary-label">Category</span>
                  <span className="mr-summary-value" title={curItem.category || "Storage"}>{curItem.category || "Storage"}</span>
                </div>
                <div className="mr-summary-col">
                  <span className="mr-summary-label">Dimensions</span>
                  <span
                    className="mr-summary-value"
                    title={`${curItem.length || 0} × ${curItem.depth ?? curItem.breadth ?? 0} × ${curItem.height || 0} ${curItem.unit || "ft"}`}
                  >
                    {curItem.length || 0} × {curItem.depth ?? curItem.breadth ?? 0} × {curItem.height || 0} {curItem.unit || "ft"}
                  </span>
                </div>
                <div className="mr-summary-col">
                  <span className="mr-summary-label">Quantity</span>
                  <span className="mr-summary-value">
                    {curItem.quantity || 1} {curItem.unit || "Unit"}
                  </span>
                </div>
                <div className="mr-summary-col">
                  <span className="mr-summary-label">Partitions</span>
                  <span className="mr-summary-value">{curItem.partitions || 0}</span>
                </div>
              </div>
            ) : null}

            {/* Inner Material Catalog Card Container (Frame 94) */}
            <div className="material-catalog-container">
              {/* Search Box (Frame 16) */}
              <div className="material-catalog-search-wrap">
                <Search size={18} color="#64748B" />
                <input
                  type="text"
                  className="material-catalog-search-input"
                  placeholder="Search materials by name, code, brand..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                />
                {materialSearch && (
                  <button
                    type="button"
                    onClick={() => setMaterialSearch("")}
                    style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", padding: 0 }}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* 3-Column Material Catalog Grid */}
              {filteredMaterials.length === 0 ? (
                <div className="empty-materials-state">
                  <div className="empty-materials-icon">
                    <Layers size={24} />
                  </div>
                  <h4 className="empty-materials-title">No Materials Found</h4>
                  <p className="empty-materials-desc">
                    No materials match your search "{materialSearch}". Try clearing the search or searching for another keyword.
                  </p>
                </div>
              ) : !curItem ? (
                <div className="empty-materials-state">
                  <div className="empty-materials-icon">
                    <Layers size={24} />
                  </div>
                  <h4 className="empty-materials-title">No Requirement Selected</h4>
                  <p className="empty-materials-desc">
                    Select a requirement from the left panel to assign materials.
                  </p>
                </div>
              ) : (
                <div className="material-catalog-grid">
                  {filteredMaterials.map((mat) => {
                    const isAssigned = curItem?.materialId === mat.id || curItem?.materialName === mat.name;
                    const stockStatus = mat.status || (mat.stock > 150 ? "in-stock" : mat.stock > 0 ? "low-stock" : "out-of-stock");
                    const stockLabel = stockStatus === "in-stock" ? "In Stock" : stockStatus === "low-stock" ? "Low Stock" : "Out of Stock";
                    const thicknessVal = mat.thickness || "18mm";
                    const finishVal = mat.finish || "Plain";
                    const categoryVal = mat.categoryName || mat.category || "HDHMR";
                    const priceVal = mat.unitPrice || mat.sellingRate || mat.baseCost || mat.price || 240;
                    const unitVal = mat.unit || "Sq.ft";
                    const stockVal = mat.stock ?? 320;
                    const brandVal = mat.brand || mat.preferredVendor || mat.vendor || "Euronics";

                    return (
                      <div
                        key={mat.id}
                        className={`material-catalog-card ${isAssigned ? "selected" : ""}`}
                      >
                        <div className="material-card-top">
                          <div className="material-card-info-group">
                            <div className="material-card-thumbnail">
                              {mat.imageUrl ? (
                                <img src={mat.imageUrl} alt={mat.name} />
                              ) : (
                                <Layers size={24} />
                              )}
                            </div>
                            <div className="material-card-title-group">
                              <h5 className="material-card-title" title={mat.name}>{mat.name}</h5>
                              <div className={`material-stock-badge ${stockStatus}`}>
                                <span className="material-stock-dot" />
                                <span>{stockLabel}</span>
                              </div>
                            </div>
                          </div>
                          {isAssigned && (
                            <div className="material-card-selected-icon" title="Selected Material">
                              <Check size={20} strokeWidth={2.5} />
                            </div>
                          )}
                        </div>

                        <div className="material-card-spec-box">
                          <div className="material-spec-row">
                            <div className="material-spec-col">
                              <span className="material-spec-label">Category</span>
                              <span className="material-spec-val" title={categoryVal}>{categoryVal}</span>
                            </div>
                            <div className="material-spec-col">
                              <span className="material-spec-label">Thickness</span>
                              <span className="material-spec-val" title={thicknessVal}>{thicknessVal}</span>
                            </div>
                          </div>

                          <div className="material-spec-row">
                            <div className="material-spec-col">
                              <span className="material-spec-label">Finish</span>
                              <span className="material-spec-val" title={finishVal}>{finishVal}</span>
                            </div>
                            <div className="material-spec-col">
                              <span className="material-spec-label">Price</span>
                              <span className="material-spec-val">₹{priceVal}/{unitVal}</span>
                            </div>
                          </div>

                          <div className="material-spec-footer">
                            <span>
                              <b className="material-spec-stock">{stockVal} {unitVal}</b> Available
                            </span>
                            <span className="material-spec-brand" title={brandVal}>{brandVal}</span>
                          </div>
                        </div>

                        <div className="material-card-actions">
                          <button
                            type="button"
                            className={`material-card-select-btn ${isAssigned ? "selected" : ""}`}
                            onClick={() => {
                              setSelectedMaterialForAssign(mat);
                              assignMaterialToRequirement(mat);
                            }}
                            disabled={saving}
                            aria-label={isAssigned ? `Selected ${mat.name}` : `Select ${mat.name}`}
                          >
                            {isAssigned && (
                              <span className="material-card-btn-check">
                                <Check size={14} strokeWidth={2.5} />
                              </span>
                            )}
                            <span>{isAssigned ? "Selected" : "Select"}</span>
                          </button>
                          <button
                            type="button"
                            className="material-card-icon-btn"
                            title="View Material Specifications"
                            aria-label={`View specifications for ${mat.name}`}
                            onClick={() => {
                              setSelectedMaterialForAssign(mat);
                              setShowAssignModal(true);
                            }}
                          >
                            <Info size={16} />
                          </button>
                          <button
                            type="button"
                            className="material-card-icon-btn"
                            title="Refresh or Re-assign Material"
                            aria-label={`Refresh material ${mat.name}`}
                            onClick={() => {
                              setSelectedMaterialForAssign(mat);
                              assignMaterialToRequirement(mat);
                            }}
                          >
                            <RefreshCcw size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        </div>

        {/* Material Specification Modal */}
        {showAssignModal && selectedMaterialForAssign && curItem && curRoom && (
          <div className="material-modal-overlay" onMouseDown={() => setShowAssignModal(false)}>
            <div className="material-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="mm-header">
                <div>
                  <h3>Assign Material</h3>
                  <p>Confirm material assignment and specifications for this requirement.</p>
                </div>
                <button type="button" onClick={() => setShowAssignModal(false)} aria-label="Close modal">
                  <X size={20} />
                </button>
              </div>
              <div className="mm-content">
                <div className="mm-table">
                  <div className="mm-row">
                    <span>Requirement</span>
                    <span style={{ fontWeight: 600, color: "#0F172A" }}>{curItem.name}</span>
                  </div>
                  <div className="mm-row">
                    <span>Room</span>
                    <span>{curRoom.name}</span>
                  </div>
                  <div className="mm-row">
                    <span>Material</span>
                    <span style={{ fontWeight: 600, color: "#2563EB" }}>{selectedMaterialForAssign.name}</span>
                  </div>
                  <div className="mm-row">
                    <span>Category</span>
                    <span>{selectedMaterialForAssign.categoryName || selectedMaterialForAssign.category || "HDHMR"}</span>
                  </div>
                  <div className="mm-row">
                    <span>Thickness</span>
                    <span>{selectedMaterialForAssign.thickness || "18mm"}</span>
                  </div>
                  <div className="mm-row">
                    <span>Finish</span>
                    <span>{selectedMaterialForAssign.finish || "Plain"}</span>
                  </div>
                  <div className="mm-row">
                    <span>Unit Price</span>
                    <span>₹{selectedMaterialForAssign.unitPrice || selectedMaterialForAssign.sellingRate || selectedMaterialForAssign.baseCost || selectedMaterialForAssign.price || 240} / {selectedMaterialForAssign.unit || "Sq.ft"}</span>
                  </div>
                  <div className="mm-row">
                    <span>Stock Available</span>
                    <span>{selectedMaterialForAssign.stock ?? 320} {selectedMaterialForAssign.unit || "Sq.ft"}</span>
                  </div>
                  <div className="mm-row">
                    <span>Brand</span>
                    <span>{selectedMaterialForAssign.brand || selectedMaterialForAssign.preferredVendor || selectedMaterialForAssign.vendor || "Euronics"}</span>
                  </div>
                </div>
                <span className="mm-note">Final material quantity and total costing will be calculated in the BOQ preview.</span>
              </div>
              <div className="mm-footer">
                <button type="button" className="mm-btn-cancel" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="mm-btn-assign"
                  onClick={() => assignMaterialToRequirement(selectedMaterialForAssign)}
                  disabled={saving}
                >
                  {saving ? "Assigning…" : "Assign Material"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel confirmation modal */}
        {showCancelConfirm && (
          <Modal
            title="Discard Changes?"
            subtitle="Are you sure you want to exit the wizard? Any unsaved project and room changes will be discarded."
            onClose={() => setShowCancelConfirm(false)}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
              <button
                type="button"
                className="project-scratch-btn-cancel"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className="project-scratch-btn-primary"
                style={{
                  background: "#ef4444",
                  borderColor: "#ef4444",
                  boxShadow: "0 1px 2px rgba(239, 68, 68, 0.2)",
                }}
                onClick={() => {
                  setShowCancelConfirm(false);
                  onClose();
                }}
              >
                Discard & Exit
              </button>
            </div>
          </Modal>
        )}

      </div>
    );
  }

  return (
    <div className="create-page-wrapper">
      <div className="create-page-header">
        <div className="create-page-header-left">
          <button className="back-btn" onClick={() => onCreated("Project setup completed.")}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2>Project Workspace Ready</h2>
            <p>Your project and rooms have been successfully initialized.</p>
          </div>
        </div>
      </div>
      <div className="success-panel">
        <div className="success-check">
          <Check />
        </div>
        <h2>Project Configured Successfully!</h2>
        <p>{project?.name} is ready for BOQ creation and review.</p>
        <dl>
          <div>
            <dt>Client</dt>
            <dd>{project?.clientName}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{project?.projectType}</dd>
          </div>
          <div>
            <dt>Configured Rooms</dt>
            <dd>{rooms.filter((r) => r.name.trim()).length}</dd>
          </div>
          <div>
            <dt>Total Requirements</dt>
            <dd>{allRequirementsAcrossRooms.length}</dd>
          </div>
        </dl>
        <footer style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
          <button
            type="button"
            onClick={() => onCreated("Project created.")}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Back to Projects
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => location.assign(`/projects/${project?.id}`)}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #2865e8",
              background: "#2865e8",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Open Project Workspace
          </button>
        </footer>
      </div>
    </div>
  );
}

function Label({ text, required, children }: { text: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label>
      {text}
      {required && <em>*</em>}
      {children}
    </label>
  );
}

function Steps({ current, onStepClick }: { current: number; onStepClick?: (step: number) => void }) {
  const steps = [
    { num: "01", name: "Project Details", step: 1 },
    { num: "02", name: "Room Setup", step: 2 },
    { num: "03", name: "Room Dimensions", step: 3 },
    { num: "04", name: "Requirements", step: 4 },
    { num: "05", name: "Material Assignment", step: 5 },
  ];

  return (
    <div className="project-steps-panel" role="navigation" aria-label="Project setup steps">
      {steps.map((s, idx) => {
        const isDone = s.step < current;
        const isCurrent = s.step === current;
        const statusText = isCurrent ? "Current step" : isDone ? "Completed" : "Pending";
        const isClickable = isDone && !!onStepClick;

        return (
          <div key={s.step} className="project-setup-step-group">
            <div
              className={`project-setup-step ${isCurrent ? "current" : isDone ? "done" : "pending"}`}
              style={isClickable ? { cursor: "pointer" } : undefined}
              onClick={() => {
                if (isClickable && onStepClick) {
                  onStepClick(s.step);
                }
              }}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={(e) => {
                if (isClickable && onStepClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onStepClick(s.step);
                }
              }}
            >
              <div className="project-setup-circle">
                {isDone ? <Check size={14} strokeWidth={2.5} /> : s.num}
              </div>
              <div className="project-setup-labels">
                <span className="project-setup-title">{s.name}</span>
                <span className="project-setup-sub">{statusText}</span>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className={`project-setup-line ${s.step < current ? "active" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  className = "",
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div className="project-modal-backdrop" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        className={`project-modal ${wide ? "wide" : ""} ${className}`.trim()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <h1 id="project-modal-title">{title}</h1>
            <p>{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
