"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Check,
  X,
  FileText,
  RotateCcw,
  GitCompare,
  Download,
  Eye,
  Sidebar,
  Layers,
} from "lucide-react";
import BoqVersionInfoModal from "./BoqVersionInfoModal";

export type BoqVersionRecord = {
  version: string;
  status: "PUBLISHED" | "DRAFT" | "SUPERSEDED" | "ARCHIVED" | string;
  changeSummary: string;
  changeDetail?: string;
  createdBy: string;
  publishedBy: string;
  approvedBy?: string;
  created: string;
  published: string;
  approved?: string;
  projects: number | string;
  changes: number | string;
  changesLevel: "HIGH" | "MEDIUM" | "LOW" | string;
  categoriesChanged?: string[];
  snapshot?: any;
  usage?: any;
  activity?: any[];
};

export type BoqTemplateDetailData = {
  id: string;
  name: string;
  templateCode?: string;
  version: string;
  status: string;
  sections?: number;
  items?: number;
  rooms?: any[];
  rules?: any[];
  versionsData?: BoqVersionRecord[];
  [key: string]: any;
};

interface BoqTemplateVersionsProps {
  template: BoqTemplateDetailData;
  onRefresh?: () => Promise<void> | void;
  onNotice?: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

// Fallback baseline records matching Figma specification
const FIGMA_DEFAULT_VERSIONS: BoqVersionRecord[] = [
  {
    version: "v3.3",
    status: "DRAFT",
    changeSummary: "Updated workflow & approvals",
    changeDetail: "Added 3 tasks and 2 approval rules",
    createdBy: "Pradhyumn D",
    publishedBy: "-",
    approvedBy: "-",
    created: "12 Aug 2026\n09:42 AM",
    published: "-",
    approved: "-",
    projects: "-",
    changes: 23,
    changesLevel: "HIGH",
    categoriesChanged: ["Workflow", "Approvals", "Tasks"],
    snapshot: {
      status: "DRAFT",
      version: "v3.3",
      areas: 8,
      rooms: 24,
      sections: 18,
      items: 189,
      stages: 7,
      tasks: 51,
      milestones: 6,
      approvals: 11,
      rules: 16,
      documents: 12,
    },
    usage: {
      projectsCount: 0,
      text: "Draft revision in review. No active projects created.",
      activeProjects: 0,
    },
  },
  {
    version: "v3.2",
    status: "PUBLISHED",
    changeSummary: "Updated BOQ Rates",
    changeDetail: "Updated rates & commercial defaults",
    createdBy: "Admin User",
    publishedBy: "Pradhyumn D",
    approvedBy: "Pradhyumn D",
    created: "02 Aug 2026\n10:21 AM",
    published: "06 Aug 2026\n02:32 PM",
    approved: "06 Aug 2026\n02:11 PM",
    projects: 18,
    changes: 27,
    changesLevel: "HIGH",
    categoriesChanged: ["Costing Rates", "Commercial Defaults", "Line Items"],
    snapshot: {
      status: "PUBLISHED",
      version: "v3.2",
      areas: 8,
      rooms: 24,
      sections: 18,
      items: 186,
      stages: 7,
      tasks: 48,
      milestones: 6,
      approvals: 9,
      rules: 14,
      documents: 12,
    },
    usage: {
      projectsCount: 18,
      text: "04 Aug 18 projects created from this version.",
      activeProjects: 14,
    },
  },
  {
    version: "v3.1",
    status: "SUPERSEDED",
    changeSummary: "Added milestone workflow",
    changeDetail: "Added milestones & task dependencies",
    createdBy: "Diptish Gohane",
    publishedBy: "Pradhyumn D",
    approvedBy: "Pradhyumn D",
    created: "22 Jul 2026\n04:42 PM",
    published: "28 Jul 2026\n11:05 AM",
    approved: "28 Jul 2026\n10:45 AM",
    projects: 14,
    changes: 16,
    changesLevel: "MEDIUM",
    categoriesChanged: ["Milestones", "Workflow", "Task Dependencies"],
    snapshot: {
      status: "SUPERSEDED",
      version: "v3.1",
      areas: 8,
      rooms: 24,
      sections: 18,
      items: 172,
      stages: 7,
      tasks: 45,
      milestones: 6,
      approvals: 9,
      rules: 12,
      documents: 10,
    },
    usage: {
      projectsCount: 14,
      text: "14 projects instantiated from this superseded revision.",
      activeProjects: 10,
    },
  },
  {
    version: "v3.0",
    status: "ARCHIVED",
    changeSummary: "Major template restructure",
    changeDetail: "Restructured areas & sections",
    createdBy: "Pradhyumn D",
    publishedBy: "Pradhyumn D",
    approvedBy: "Pradhyumn D",
    created: "08 Jul 2026\n09:30 AM",
    published: "14 Jul 2026\n03:10 PM",
    approved: "14 Jul 2026\n02:40 PM",
    projects: 10,
    changes: 41,
    changesLevel: "HIGH",
    categoriesChanged: ["Template Structure", "Areas", "Sections"],
    snapshot: {
      status: "ARCHIVED",
      version: "v3.0",
      areas: 8,
      rooms: 22,
      sections: 16,
      items: 150,
      stages: 6,
      tasks: 40,
      milestones: 5,
      approvals: 8,
      rules: 10,
      documents: 10,
    },
    usage: {
      projectsCount: 10,
      text: "10 historical projects created from v3.0.",
      activeProjects: 4,
    },
  },
  {
    version: "v2.5",
    status: "ARCHIVED",
    changeSummary: "Initial workflow configuration",
    changeDetail: "Initial stages, tasks & approvals",
    createdBy: "Admin User",
    publishedBy: "Pradhyumn D",
    approvedBy: "Pradhyumn D",
    created: "26 Jun 2026\n02:11 PM",
    published: "30 Jun 2026\n10:22 AM",
    approved: "30 Jun 2026\n09:50 AM",
    projects: 6,
    changes: 19,
    changesLevel: "MEDIUM",
    categoriesChanged: ["Workflow", "Stages", "Approvals"],
    snapshot: {
      status: "ARCHIVED",
      version: "v2.5",
      areas: 6,
      rooms: 18,
      sections: 14,
      items: 132,
      stages: 5,
      tasks: 34,
      milestones: 4,
      approvals: 6,
      rules: 8,
      documents: 8,
    },
    usage: {
      projectsCount: 6,
      text: "6 projects instantiated from this archived version.",
      activeProjects: 2,
    },
  },
  {
    version: "v2.0",
    status: "ARCHIVED",
    changeSummary: "Initial template release",
    changeDetail: "Base template with core structure",
    createdBy: "Admin User",
    publishedBy: "Pradhyumn D",
    approvedBy: "Pradhyumn D",
    created: "15 Jun 2026\n11:08 AM",
    published: "20 Jun 2026\n05:45 PM",
    approved: "20 Jun 2026\n05:15 PM",
    projects: 4,
    changes: 32,
    changesLevel: "HIGH",
    categoriesChanged: ["Base Template", "Initial Structure"],
    snapshot: {
      status: "ARCHIVED",
      version: "v2.0",
      areas: 6,
      rooms: 16,
      sections: 12,
      items: 110,
      stages: 4,
      tasks: 28,
      milestones: 3,
      approvals: 5,
      rules: 6,
      documents: 6,
    },
    usage: {
      projectsCount: 4,
      text: "4 projects instantiated from base release v2.0.",
      activeProjects: 1,
    },
  },
];

export default function BoqTemplateVersions({
  template,
  onRefresh,
  onNotice,
  onNavigateTab,
}: BoqTemplateVersionsProps) {
  // ── 1. State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState<"All Versions" | "Published" | "Drafts" | "Archived">("All Versions");
  const [myChangesOnly, setMyChangesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Version & Drawer State
  const initialList = (template.versionsData && template.versionsData.length > 0)
    ? template.versionsData
    : FIGMA_DEFAULT_VERSIONS;

  const [versionsList, setVersionsList] = useState<BoqVersionRecord[]>(initialList);
  const [selectedVersion, setSelectedVersion] = useState<BoqVersionRecord>(() => {
    const pub = initialList.find((v) => v.status === "PUBLISHED");
    return pub || initialList[0];
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sideBySide, setSideBySide] = useState(false);

  // Action Menu State
  const [actionMenuVersion, setActionMenuVersion] = useState<string | null>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [newVersionModalOpen, setNewVersionModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // New Version Form
  const [newVerNumber, setNewVerNumber] = useState("v3.4");
  const [newVerSummary, setNewVerSummary] = useState("");
  const [newVerDetail, setNewVerDetail] = useState("");

  // Close menus on outside click
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenuVersion(null);
        setFilterMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync if template changes
  useEffect(() => {
    if (template.versionsData && template.versionsData.length > 0) {
      setVersionsList(template.versionsData);
      const pub = template.versionsData.find((v) => v.status === "PUBLISHED");
      if (pub && !selectedVersion) {
        setSelectedVersion(pub);
      }
    }
  }, [template.versionsData]);

  // Helper to extract dynamic snapshot metrics for any version
  const getVersionSnapshot = (v?: BoqVersionRecord | null) => {
    if (!v) {
      return {
        status: "PUBLISHED",
        version: template.version || "v3.2",
        areas: 8,
        rooms: template.rooms?.length || 24,
        sections: template.sections || 18,
        items: template.items || 186,
        stages: 7,
        tasks: 48,
        milestones: 6,
        approvals: 9,
        rules: template.rules?.length || 14,
        documents: 12,
      };
    }

    if (v.snapshot) {
      return {
        ...v.snapshot,
        rooms: v.snapshot.rooms ?? (template.rooms?.length || 24),
        rules: v.snapshot.rules ?? (template.rules?.length || 14),
      };
    }

    const ver = String(v.version || "").toLowerCase();
    if (ver === "v3.3") {
      return {
        status: v.status || "DRAFT",
        version: v.version,
        areas: 8,
        rooms: 24,
        sections: 18,
        items: 189,
        stages: 7,
        tasks: 51,
        milestones: 6,
        approvals: 11,
        rules: 16,
        documents: 12,
      };
    }
    if (ver === "v3.1") {
      return {
        status: v.status || "SUPERSEDED",
        version: v.version,
        areas: 8,
        rooms: 24,
        sections: 18,
        items: 172,
        stages: 7,
        tasks: 45,
        milestones: 6,
        approvals: 9,
        rules: 12,
        documents: 10,
      };
    }
    if (ver === "v3.0") {
      return {
        status: v.status || "ARCHIVED",
        version: v.version,
        areas: 8,
        rooms: 22,
        sections: 16,
        items: 150,
        stages: 6,
        tasks: 40,
        milestones: 5,
        approvals: 8,
        rules: 10,
        documents: 10,
      };
    }
    if (ver === "v2.5") {
      return {
        status: v.status || "ARCHIVED",
        version: v.version,
        areas: 6,
        rooms: 18,
        sections: 14,
        items: 132,
        stages: 5,
        tasks: 34,
        milestones: 4,
        approvals: 6,
        rules: 8,
        documents: 8,
      };
    }
    if (ver === "v2.0") {
      return {
        status: v.status || "ARCHIVED",
        version: v.version,
        areas: 6,
        rooms: 16,
        sections: 12,
        items: 110,
        stages: 4,
        tasks: 28,
        milestones: 3,
        approvals: 5,
        rules: 6,
        documents: 6,
      };
    }

    return {
      status: v.status || "PUBLISHED",
      version: v.version,
      areas: 8,
      rooms: template.rooms?.length || 24,
      sections: template.sections || 18,
      items: template.items || 186,
      stages: 7,
      tasks: 48,
      milestones: 6,
      approvals: 9,
      rules: template.rules?.length || 14,
      documents: 12,
    };
  };

  // Helper to extract timeline events for any version
  const getVersionTimeline = (v?: BoqVersionRecord | null) => {
    if (!v) return [];
    if (v.activity && v.activity.length > 0) return v.activity;
    const isPub = v.status === "PUBLISHED" || v.status === "SUPERSEDED";
    const isDraft = v.status === "DRAFT";
    return [
      ...(isPub && v.published && v.published !== "-" ? [{
        title: "Published",
        time: v.published.replace("\n", " "),
        detail: `${v.publishedBy || "Pradhyumn"} Published ${v.version}`,
        dotClass: "green",
      }] : []),
      ...((v.approvedBy || isPub) ? [{
        title: "Approved",
        time: (v.approved || v.published || "06 Aug 2026 14:11").replace("\n", " "),
        detail: "Version approved for publishing",
        dotClass: "purple",
      }] : []),
      ...(isDraft ? [{
        title: "Draft Created",
        time: v.created.replace("\n", " "),
        detail: `${v.createdBy} branched Draft ${v.version}`,
        dotClass: "blue",
      }] : []),
    ];
  };

  // Check URL query parameters for direct version view
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const verParam = sp.get("version") || sp.get("versionId") || sp.get("versionInfo");
      if (verParam) {
        const found = versionsList.find(
          (v) => v.version.toLowerCase() === verParam.toLowerCase()
        );
        if (found) {
          setSelectedVersion(found);
          setDetailsModalOpen(true);
        }
      }
    }
  }, [versionsList]);

  // ── 2. Filter & Pagination Logic ──
  const filteredVersions = useMemo(() => {
    return versionsList.filter((v) => {
      // Filter Tab
      if (activeFilterTab === "Published" && v.status !== "PUBLISHED") return false;
      if (activeFilterTab === "Drafts" && v.status !== "DRAFT") return false;
      if (activeFilterTab === "Archived" && v.status !== "ARCHIVED" && v.status !== "SUPERSEDED") return false;

      // Dropdown Filter
      if (statusFilter !== "ALL" && v.status !== statusFilter) return false;

      // My Changes Only (matches Pradhyumn or Admin)
      if (myChangesOnly && !v.createdBy.toLowerCase().includes("pradhyumn") && !v.createdBy.toLowerCase().includes("admin")) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesVer = v.version.toLowerCase().includes(q);
        const matchesSummary = v.changeSummary.toLowerCase().includes(q);
        const matchesDetail = (v.changeDetail || "").toLowerCase().includes(q);
        const matchesAuthor = v.createdBy.toLowerCase().includes(q) || v.publishedBy.toLowerCase().includes(q);
        if (!matchesVer && !matchesSummary && !matchesDetail && !matchesAuthor) return false;
      }

      return true;
    });
  }, [versionsList, activeFilterTab, statusFilter, myChangesOnly, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredVersions.length / pageSize));
  const paginatedVersions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVersions.slice(start, start + pageSize);
  }, [filteredVersions, currentPage, pageSize]);

  // ── 3. KPI Calculations ──
  const totalVersionsCount = versionsList.length;
  const publishedVersionsCount = versionsList.filter((v) => v.status === "PUBLISHED" || v.status === "SUPERSEDED").length;
  const currentPublishedVer = versionsList.find((v) => v.status === "PUBLISHED")?.version || template.version || "v3.2";
  const activeDraftVer = versionsList.find((v) => v.status === "DRAFT")?.version || "v3.3";
  const totalProjectsUsing = versionsList.reduce((acc, v) => acc + (typeof v.projects === "number" ? v.projects : 0), 0) || 42;

  // ── 4. Handlers ──
  const handleRowClick = (v: BoqVersionRecord) => {
    setSelectedVersion(v);
    setDrawerOpen(true);
  };

  const handleCreateNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVerSummary.trim()) {
      onNotice?.("Please provide a change summary for the new version.");
      return;
    }

    const newRecord: BoqVersionRecord = {
      version: newVerNumber.trim() || `v3.${versionsList.length}`,
      status: "DRAFT",
      changeSummary: newVerSummary.trim(),
      changeDetail: newVerDetail.trim() || "Draft changes created from current version.",
      createdBy: "Pradhyumn D",
      publishedBy: "-",
      created: "Today\nJust now",
      published: "-",
      projects: "-",
      changes: 0,
      changesLevel: "LOW",
    };

    setVersionsList([newRecord, ...versionsList]);
    setSelectedVersion(newRecord);
    setNewVersionModalOpen(false);
    setNewVerSummary("");
    setNewVerDetail("");
    onNotice?.(`New version ${newRecord.version} created in Draft.`);
  };

  const handleExportHistory = (format: "csv" | "json") => {
    if (format === "json") {
      const blob = new Blob([JSON.stringify(versionsList, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, "_")}_versions.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ["Version", "Status", "Change Summary", "Detail", "Created By", "Published By", "Created", "Published", "Projects", "Changes", "Level"];
      const rows = versionsList.map(v => [
        v.version,
        v.status,
        `"${v.changeSummary.replace(/"/g, '""')}"`,
        `"${(v.changeDetail || "").replace(/"/g, '""')}"`,
        v.createdBy,
        v.publishedBy,
        `"${v.created.replace(/\n/g, ' ')}"`,
        `"${v.published.replace(/\n/g, ' ')}"`,
        v.projects,
        v.changes,
        v.changesLevel,
      ]);
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, "_")}_versions.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    onNotice?.(`Exported versions history as ${format.toUpperCase()}`);
  };

  const parseDateTimeLines = (str: string) => {
    if (!str || str === "-") return { date: "-", time: "" };
    const parts = str.split("\n");
    return {
      date: parts[0] || "-",
      time: parts[1] || "",
    };
  };

  return (
    <div className="boq-versions-container">
      {/* ── Subheader & Toolbar (Frame 2147225198) ── */}
      <div className="boq-versions-subheader">
        <div className="boq-versions-subheader-left">
          <h2 className="boq-versions-title">Versions</h2>
          <p className="boq-versions-desc">
            Manage template revisions, compare configuration changes, and control published versions.
          </p>
        </div>

        <div className="boq-versions-toolbar">
          {/* Glassmorphic Search Box (Frame 76: 260px x 46px) */}
          <div className="boq-versions-search-box">
            <div className="boq-versions-search-icon-box">
              <Search size={16} />
            </div>
            <input
              type="text"
              className="boq-versions-search-input"
              placeholder="Search versions…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Buttons Group (Frame 2147225194) */}
          <div className="boq-versions-toolbar-buttons">
            {/* Filter Button: 102px x 46px, #FFFFFF, border 1px solid #E2E8F0 */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="boq-versions-btn boq-versions-filter-btn"
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              >
                <Filter size={16} />
                <span>Filter</span>
              </button>

              {filterMenuOpen && (
                <div className="boq-versions-menu-popover" style={{ width: 200, top: "110%" }}>
                  <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>
                    Filter by Status
                  </div>
                  {["ALL", "PUBLISHED", "DRAFT", "SUPERSEDED", "ARCHIVED"].map((st) => (
                    <button
                      key={st}
                      className="boq-versions-menu-item"
                      onClick={() => {
                        setStatusFilter(st);
                        setFilterMenuOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      {statusFilter === st && <Check size={14} color="#2563EB" />}
                      <span style={{ marginLeft: statusFilter === st ? 0 : 22 }}>
                        {st === "ALL" ? "All Statuses" : st}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* New Version Button: 132px x 46px, background #2563EB */}
            <button
              type="button"
              className="boq-versions-btn boq-versions-new-btn"
              onClick={() => setNewVersionModalOpen(true)}
            >
              <Plus size={18} />
              <span>New Version</span>
            </button>

            {/* More Options Button: 48px x 46px, background #FFFFFF */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="boq-versions-btn boq-versions-icon-btn"
                title="More Options"
                onClick={() => setActionMenuVersion(actionMenuVersion === "toolbar" ? null : "toolbar")}
              >
                <MoreVertical size={18} />
              </button>

              {actionMenuVersion === "toolbar" && (
                <div className="boq-versions-menu-popover" ref={menuRef}>
                  <button
                    className="boq-versions-menu-item"
                    onClick={() => {
                      setSideBySide(!sideBySide);
                      setActionMenuVersion(null);
                    }}
                  >
                    <Sidebar size={14} /> {sideBySide ? "Full Table View" : "Split Panel View"}
                  </button>
                  <button
                    className="boq-versions-menu-item"
                    onClick={() => {
                      handleExportHistory("csv");
                      setActionMenuVersion(null);
                    }}
                  >
                    <Download size={14} /> Export CSV
                  </button>
                  <button
                    className="boq-versions-menu-item"
                    onClick={() => {
                      handleExportHistory("json");
                      setActionMenuVersion(null);
                    }}
                  >
                    <FileText size={14} /> Export JSON
                  </button>
                  <button
                    className="boq-versions-menu-item"
                    onClick={() => {
                      setCompareModalOpen(true);
                      setActionMenuVersion(null);
                    }}
                  >
                    <GitCompare size={14} /> Compare Versions
                  </button>
                  <button
                    className="boq-versions-menu-item"
                    onClick={() => {
                      onRefresh?.();
                      onNotice?.("Refreshed template versions list.");
                      setActionMenuVersion(null);
                    }}
                  >
                    <RotateCcw size={14} /> Refresh List
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 Metric KPI Cards (Frame 2147225138: width 1326px, height 116px, gap 8px) ── */}
      <div className="boq-versions-kpi-grid">
        {/* Card 1: Total Versions (Frame 93) */}
        <div className="boq-versions-kpi-card">
          <span className="boq-versions-kpi-label">Total Versions</span>
          <div className="boq-versions-kpi-val">
            {totalVersionsCount < 10 ? `0${totalVersionsCount}` : totalVersionsCount}
          </div>
          <span className="boq-versions-kpi-sub">{publishedVersionsCount} Published</span>
        </div>

        {/* Card 2: Current Version (Frame 2147225072) */}
        <div className="boq-versions-kpi-card">
          <span className="boq-versions-kpi-label">Current Version</span>
          <div className="boq-versions-kpi-val blue">{currentPublishedVer}</div>
          <span className="boq-versions-kpi-sub">Published</span>
        </div>

        {/* Card 3: Active Draft (Frame 2147225073) */}
        <div className="boq-versions-kpi-card">
          <span className="boq-versions-kpi-label">Active Draft</span>
          <div className="boq-versions-kpi-val accent">{activeDraftVer}</div>
          <span className="boq-versions-kpi-sub">Updated 2h ago</span>
        </div>

        {/* Card 4: Projects Using (Frame 2147225071) */}
        <div className="boq-versions-kpi-card">
          <span className="boq-versions-kpi-label">Projects Using</span>
          <div className="boq-versions-kpi-val">{totalProjectsUsing}</div>
          <span className="boq-versions-kpi-sub">This Template</span>
        </div>
      </div>

      {/* ── Filter Tabs & My Changes (Frame 2147225239) ── */}
      <div className="boq-versions-nav-row">
        {/* Filter Tabs Container: width 567px, height 46px, background #FFFFFF, border 1px solid #E2E8F0 */}
        <div className="boq-versions-tabs">
          <button
            type="button"
            className={`boq-versions-tab-pill all-versions ${activeFilterTab === "All Versions" ? "active" : ""}`}
            onClick={() => {
              setActiveFilterTab("All Versions");
              setCurrentPage(1);
            }}
          >
            All Versions
          </button>
          <button
            type="button"
            className={`boq-versions-tab-pill published ${activeFilterTab === "Published" ? "active" : ""}`}
            onClick={() => {
              setActiveFilterTab("Published");
              setCurrentPage(1);
            }}
          >
            Published
          </button>
          <button
            type="button"
            className={`boq-versions-tab-pill drafts ${activeFilterTab === "Drafts" ? "active" : ""}`}
            onClick={() => {
              setActiveFilterTab("Drafts");
              setCurrentPage(1);
            }}
          >
            Drafts
          </button>
          <button
            type="button"
            className={`boq-versions-tab-pill archived ${activeFilterTab === "Archived" ? "active" : ""}`}
            onClick={() => {
              setActiveFilterTab("Archived");
              setCurrentPage(1);
            }}
          >
            Archived
          </button>
        </div>

        {/* My Changes Checkbox (Frame 2147225238: width 104px, height 20px, gap 6px) */}
        <label className="boq-versions-mychanges-toggle">
          <input
            type="checkbox"
            checked={myChangesOnly}
            onChange={(e) => {
              setMyChangesOnly(e.target.checked);
              setCurrentPage(1);
            }}
          />
          <span>My Changes</span>
        </label>
      </div>

      {/* ── Table & Layout (Frame 2147225085 / Frame 2147225072) ── */}
      <div className="boq-versions-layout">
        {/* Full-Width Table Card */}
        <div className={`boq-versions-history-card ${sideBySide ? "with-drawer" : ""}`}>
          <div className="boq-versions-table-wrapper">
            <table className="boq-versions-table">
              {/* Header (Frame 57: #E4ECFB, 36px high, radius 8px) */}
              <thead>
                <tr className="boq-versions-thead">
                  <th className="boq-vcol-version">VERSION</th>
                  <th className="boq-vcol-status">STATUS</th>
                  <th className="boq-vcol-summary">CHANGE SUMMARY</th>
                  <th className="boq-vcol-createdby">CREATED BY</th>
                  <th className="boq-vcol-publishedby">PUBLISHED BY</th>
                  <th className="boq-vcol-created">CREATED</th>
                  <th className="boq-vcol-published">PUBLISHED</th>
                  <th className="boq-vcol-projects">PROJECTS</th>
                  <th className="boq-vcol-changes">CHANGES</th>
                  <th className="boq-vcol-actions">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVersions.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "48px 20px", color: "#64748B" }}>
                      No versions found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedVersions.map((v) => {
                    const isPublished = v.status === "PUBLISHED";
                    const isSelected = selectedVersion?.version === v.version;
                    const createdParts = parseDateTimeLines(v.created);
                    const pubParts = parseDateTimeLines(v.published);

                    // User Initials
                    const createdInitials = v.createdBy
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    const pubInitials = v.publishedBy !== "-"
                      ? v.publishedBy
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "";

                    return (
                      <tr
                        key={v.version}
                        className={`boq-versions-row ${isPublished ? "current" : ""} ${isSelected ? "selected" : ""}`}
                        onClick={() => handleRowClick(v)}
                        onDoubleClick={() => {
                          setSelectedVersion(v);
                          setDetailsModalOpen(true);
                        }}
                        title="Click to view summary • Double-click to view version info"
                      >
                        {/* 1. Version */}
                        <td className="boq-vcol-version">
                          <span className="boq-ver-tag">{v.version}</span>
                        </td>

                        {/* 2. Status Badge */}
                        <td className="boq-vcol-status">
                          <span className={`boq-ver-badge ${v.status.toLowerCase()}`}>
                            {v.status}
                          </span>
                        </td>

                        {/* 3. Change Summary (Two lines) */}
                        <td className="boq-vcol-summary">
                          <div className="boq-ver-summary-cell">
                            <span className="boq-ver-summary-title">{v.changeSummary}</span>
                            {v.changeDetail && (
                              <span className="boq-ver-summary-detail">{v.changeDetail}</span>
                            )}
                          </div>
                        </td>

                        {/* 4. Created By */}
                        <td className="boq-vcol-createdby">
                          <div className="boq-ver-user-cell">
                            <div className="boq-ver-avatar">{createdInitials}</div>
                            <span className="boq-ver-user-name">{v.createdBy}</span>
                          </div>
                        </td>

                        {/* 5. Published By */}
                        <td className="boq-vcol-publishedby">
                          {v.publishedBy !== "-" ? (
                            <div className="boq-ver-user-cell">
                              <div className="boq-ver-avatar">{pubInitials}</div>
                              <span className="boq-ver-user-name">{v.publishedBy}</span>
                            </div>
                          ) : (
                            <span className="boq-ver-dash">-</span>
                          )}
                        </td>

                        {/* 6. Created Date/Time */}
                        <td className="boq-vcol-created">
                          <div className="boq-ver-date-cell">
                            <span className="boq-ver-date-main">{createdParts.date}</span>
                            {createdParts.time && (
                              <span className="boq-ver-date-sub">{createdParts.time}</span>
                            )}
                          </div>
                        </td>

                        {/* 7. Published Date/Time */}
                        <td className="boq-vcol-published">
                          {v.published !== "-" ? (
                            <div className="boq-ver-date-cell">
                              <span className="boq-ver-date-main">{pubParts.date}</span>
                              {pubParts.time && (
                                <span className="boq-ver-date-sub">{pubParts.time}</span>
                              )}
                            </div>
                          ) : (
                            <span className="boq-ver-dash">-</span>
                          )}
                        </td>

                        {/* 8. Projects Count */}
                        <td className="boq-vcol-projects">
                          {v.projects !== "-" ? (
                            <span className="boq-ver-projects-val">{v.projects}</span>
                          ) : (
                            <span className="boq-ver-dash">-</span>
                          )}
                        </td>

                        {/* 9. Changes & Level Pill */}
                        <td className="boq-vcol-changes">
                          <div className="boq-ver-changes-cell">
                            <span className="boq-ver-changes-count">{v.changes}</span>
                            {v.changesLevel && (
                              <span className={`boq-ver-changes-pill ${v.changesLevel.toLowerCase()}`}>
                                {v.changesLevel}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 10. Actions Menu */}
                        <td className="boq-vcol-actions" onClick={(e) => e.stopPropagation()}>
                          <div style={{ position: "relative", display: "inline-block" }}>
                            <button
                              type="button"
                              className="boq-ver-action-btn"
                              title="Actions"
                              onClick={() =>
                                setActionMenuVersion(actionMenuVersion === v.version ? null : v.version)
                              }
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {actionMenuVersion === v.version && (
                              <div className="boq-versions-menu-popover" ref={menuRef}>
                                <button
                                  className="boq-versions-menu-item"
                                  onClick={() => {
                                    setSelectedVersion(v);
                                    setDetailsModalOpen(true);
                                    setActionMenuVersion(null);
                                  }}
                                >
                                  <FileText size={14} /> View Details
                                </button>
                                <button
                                  className="boq-versions-menu-item"
                                  onClick={() => {
                                    setSelectedVersion(v);
                                    setDrawerOpen(true);
                                    setActionMenuVersion(null);
                                  }}
                                >
                                  <Eye size={14} /> Open Side Panel
                                </button>
                                <button
                                  className="boq-versions-menu-item"
                                  onClick={() => {
                                    setSelectedVersion(v);
                                    setCompareModalOpen(true);
                                    setActionMenuVersion(null);
                                  }}
                                >
                                  <GitCompare size={14} /> Compare vs Current
                                </button>
                                {v.status !== "PUBLISHED" && (
                                  <button
                                    className="boq-versions-menu-item"
                                    onClick={() => {
                                      onNotice?.(`Version ${v.version} restored as base template.`);
                                      setActionMenuVersion(null);
                                    }}
                                  >
                                    <RotateCcw size={14} /> Restore Version
                                  </button>
                                )}
                                <button
                                  className="boq-versions-menu-item"
                                  onClick={() => {
                                    const blob = new Blob([JSON.stringify(v, null, 2)], { type: "application/json" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `version_${v.version}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    setActionMenuVersion(null);
                                  }}
                                >
                                  <Download size={14} /> Export JSON
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination (Frame 2147225166) */}
          <div className="boq-versions-pagination">
            <span className="boq-versions-total-text">
              Total Versions: {filteredVersions.length || 30}
            </span>

            {/* Pagination Controls (Frame 2147225165: 34px x 34px buttons) */}
            <div className="boq-versions-page-controls">
              <button
                type="button"
                className="boq-versions-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`boq-versions-page-btn ${currentPage === num ? "active" : ""}`}
                  onClick={() => setCurrentPage(num)}
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                className="boq-versions-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Per Page (Frame 2147225167) */}
            <div className="boq-versions-per-page">
              <span>Show per Page:</span>
              <select
                className="boq-versions-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pinned Side Panel (When in Split Panel View) */}
        {sideBySide && (
          <div className="boq-versions-side-panel">
            <div className="boq-versions-about-header">
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <h3 className="boq-versions-about-title">
                  {selectedVersion?.status === "PUBLISHED" ? "ABOUT CURRENT VERSION" : `ABOUT VERSION ${selectedVersion?.version}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setSideBySide(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
                >
                  <X size={16} />
                </button>
              </div>
              <p className="boq-versions-about-meta">
                {selectedVersion?.published !== "-"
                  ? `Published on ${selectedVersion?.published.replace("\n", " • ")}`
                  : `Created on ${selectedVersion?.created.replace("\n", " • ")}`}
              </p>
              <p className="boq-versions-about-desc">
                {selectedVersion?.changeDetail || selectedVersion?.changeSummary || "Updated BOQ rates and commercial defaults."}
              </p>
            </div>

            {/* Snapshot Summary Card */}
            {(() => {
              const panelSnap = getVersionSnapshot(selectedVersion);
              const panelTimeline = getVersionTimeline(selectedVersion);
              return (
                <>
                  <div className="boq-versions-card">
                    <h4 className="boq-versions-card-title">Snapshot Summary</h4>
                    <div className="boq-versions-kv-list">
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Status</span>
                        <span className={`boq-ver-badge ${selectedVersion?.status.toLowerCase()}`}>
                          {selectedVersion?.status}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Version</span>
                        <span className="boq-versions-kv-value">{selectedVersion?.version}</span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Areas</span>
                        <span className="boq-versions-kv-value">
                          {String(panelSnap.areas ?? 8).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Rooms</span>
                        <span className="boq-versions-kv-value">
                          {String(panelSnap.rooms ?? 24).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">BOQ Sections</span>
                        <span className="boq-versions-kv-value">
                          {String(panelSnap.sections ?? 18).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">BOQ Items</span>
                        <span className="boq-versions-kv-value">
                          {panelSnap.items ?? 186}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Workflow Stages</span>
                        <span className="boq-versions-kv-value">
                          {String(panelSnap.stages ?? 7).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Tasks</span>
                        <span className="boq-versions-kv-value">
                          {String(panelSnap.tasks ?? 48).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Milestones</span>
                        <span className="boq-versions-kv-value">
                          {String(panelSnap.milestones ?? 6).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Approvals</span>
                        <span className="boq-versions-kv-value">
                          {String(panelSnap.approvals ?? 9).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Rules</span>
                        <span className="boq-versions-kv-value">
                          {String(panelSnap.rules ?? 14).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Documents (Req.)</span>
                        <span className="boq-versions-kv-value">
                          {String(panelSnap.documents ?? 12).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Usage Card */}
                  <div className="boq-versions-card">
                    <h4 className="boq-versions-card-title">Usage</h4>
                    <p className="boq-versions-usage-text">
                      {selectedVersion?.projects !== "-"
                        ? `04 Aug ${selectedVersion.projects} projects created from this version.`
                        : "No active projects created from this revision."}
                    </p>
                    <button
                      type="button"
                      className="boq-versions-usage-link"
                      onClick={() => onNavigateTab?.("Usage")}
                    >
                      <span>View Projects</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  {/* Last Activity Card */}
                  <div className="boq-versions-card">
                    <h4 className="boq-versions-card-title">Last Activity</h4>
                    <div className="boq-versions-timeline">
                      {panelTimeline.map((act: any, idx: number) => (
                        <div key={idx} className="boq-versions-timeline-item">
                          <div className={`boq-versions-timeline-dot ${act.dotClass || (act.type === "PUBLISHED" ? "green" : act.type === "APPROVED" ? "purple" : "blue")}`} />
                          <div className="boq-versions-timeline-content">
                            <span className="boq-versions-timeline-title">{act.title}</span>
                            <span className="boq-versions-timeline-time">{act.time || act.timestamp}</span>
                            <span className="boq-versions-timeline-detail">{act.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* View Version Details Button */}
            <button
              type="button"
              className="boq-versions-detail-btn"
              onClick={() => setDetailsModalOpen(true)}
            >
              View Version Details
            </button>
          </div>
        )}
      </div>

      {/* ── Slide-Over Drawer Mode (When clicking a row in Full Table Mode) ── */}
      {drawerOpen && !sideBySide && selectedVersion && (
        <div className="boq-versions-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="boq-versions-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="boq-versions-drawer-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="boq-ver-tag" style={{ fontSize: 18 }}>{selectedVersion.version}</span>
                <span className={`boq-ver-badge ${selectedVersion.status.toLowerCase()}`}>
                  {selectedVersion.status}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  title="Pin Side by Side"
                  onClick={() => {
                    setSideBySide(true);
                    setDrawerOpen(false);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
                >
                  <Sidebar size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* About Version */}
            <div className="boq-versions-about-header">
              <h3 className="boq-versions-about-title">
                {selectedVersion?.status === "PUBLISHED" ? "ABOUT CURRENT VERSION" : `ABOUT VERSION ${selectedVersion?.version}`}
              </h3>
              <p className="boq-versions-about-meta">
                {selectedVersion?.published !== "-"
                  ? `Published on ${selectedVersion?.published.replace("\n", " • ")}`
                  : `Created on ${selectedVersion?.created.replace("\n", " • ")}`}
              </p>
              <p className="boq-versions-about-desc">
                {selectedVersion?.changeDetail || selectedVersion?.changeSummary || "Updated BOQ rates and commercial defaults."}
              </p>
            </div>

            {/* Snapshot Summary Card */}
            {(() => {
              const drawerSnap = getVersionSnapshot(selectedVersion);
              const drawerTimeline = getVersionTimeline(selectedVersion);
              return (
                <>
                  <div className="boq-versions-card" style={{ width: "100%" }}>
                    <h4 className="boq-versions-card-title">Snapshot Summary</h4>
                    <div className="boq-versions-kv-list">
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Status</span>
                        <span className={`boq-ver-badge ${selectedVersion?.status.toLowerCase()}`}>
                          {selectedVersion?.status}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Version</span>
                        <span className="boq-versions-kv-value">{selectedVersion?.version}</span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Areas</span>
                        <span className="boq-versions-kv-value">
                          {String(drawerSnap.areas ?? 8).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Rooms</span>
                        <span className="boq-versions-kv-value">
                          {String(drawerSnap.rooms ?? 24).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">BOQ Sections</span>
                        <span className="boq-versions-kv-value">
                          {String(drawerSnap.sections ?? 18).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">BOQ Items</span>
                        <span className="boq-versions-kv-value">
                          {drawerSnap.items ?? 186}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Workflow Stages</span>
                        <span className="boq-versions-kv-value">
                          {String(drawerSnap.stages ?? 7).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Tasks</span>
                        <span className="boq-versions-kv-value">
                          {String(drawerSnap.tasks ?? 48).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Milestones</span>
                        <span className="boq-versions-kv-value">
                          {String(drawerSnap.milestones ?? 6).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Approvals</span>
                        <span className="boq-versions-kv-value">
                          {String(drawerSnap.approvals ?? 9).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Rules</span>
                        <span className="boq-versions-kv-value">
                          {String(drawerSnap.rules ?? 14).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="boq-versions-kv-row">
                        <span className="boq-versions-kv-label">Documents (Req.)</span>
                        <span className="boq-versions-kv-value">
                          {String(drawerSnap.documents ?? 12).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Usage Card */}
                  <div className="boq-versions-card" style={{ width: "100%" }}>
                    <h4 className="boq-versions-card-title">Usage</h4>
                    <p className="boq-versions-usage-text">
                      {selectedVersion?.projects !== "-"
                        ? `04 Aug ${selectedVersion.projects} projects created from this version.`
                        : "No active projects created from this revision."}
                    </p>
                    <button
                      type="button"
                      className="boq-versions-usage-link"
                      onClick={() => {
                        setDrawerOpen(false);
                        onNavigateTab?.("Usage");
                      }}
                    >
                      <span>View Projects</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  {/* Last Activity Card */}
                  <div className="boq-versions-card" style={{ width: "100%" }}>
                    <h4 className="boq-versions-card-title">Last Activity</h4>
                    <div className="boq-versions-timeline">
                      {drawerTimeline.map((act: any, idx: number) => (
                        <div key={idx} className="boq-versions-timeline-item">
                          <div className={`boq-versions-timeline-dot ${act.dotClass || (act.type === "PUBLISHED" ? "green" : act.type === "APPROVED" ? "purple" : "blue")}`} />
                          <div className="boq-versions-timeline-content">
                            <span className="boq-versions-timeline-title">{act.title}</span>
                            <span className="boq-versions-timeline-time">{act.time || act.timestamp}</span>
                            <span className="boq-versions-timeline-detail">{act.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

            <button
              type="button"
              className="boq-versions-detail-btn"
              style={{ width: "100%" }}
              onClick={() => {
                setDrawerOpen(false);
                setDetailsModalOpen(true);
              }}
            >
              View Version Details
            </button>
          </div>
        </div>
      )}

      {/* ── View Version Info Modal (Redesigned Full Experience) ── */}
      {selectedVersion && (
        <BoqVersionInfoModal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          templateId={template.id}
          templateName={template.name}
          templateCode={template.templateCode || "BOQ-RES-001"}
          version={selectedVersion.version}
          initialVersionData={selectedVersion}
          onNotice={onNotice}
          onNavigateTab={onNavigateTab}
          onCompare={(v) => {
            setDetailsModalOpen(false);
            setCompareModalOpen(true);
          }}
          onRestore={(v) => {
            setDetailsModalOpen(false);
            onNotice?.(`Version ${v} restored as base template.`);
          }}
          onCreateDraft={(v) => {
            setDetailsModalOpen(false);
            setNewVerNumber(`v3.${versionsList.length + 1}`);
            setNewVersionModalOpen(true);
          }}
        />
      )}

      {/* ── Create New Version Modal ── */}
      {newVersionModalOpen && (
        <div className="boq-versions-modal-overlay" onClick={() => setNewVersionModalOpen(false)}>
          <div className="boq-versions-modal-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateNewVersion}>
              <div className="boq-versions-modal-header">
                <h3>Create New Version</h3>
                <button
                  type="button"
                  onClick={() => setNewVersionModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="boq-versions-modal-body">
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>
                    Version Tag
                  </label>
                  <input
                    type="text"
                    required
                    value={newVerNumber}
                    onChange={(e) => setNewVerNumber(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 6,
                      border: "1px solid #CBD5E1",
                      fontSize: 14,
                      outline: "none",
                    }}
                    placeholder="e.g. v3.4"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>
                    Change Summary
                  </label>
                  <input
                    type="text"
                    required
                    value={newVerSummary}
                    onChange={(e) => setNewVerSummary(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 6,
                      border: "1px solid #CBD5E1",
                      fontSize: 14,
                      outline: "none",
                    }}
                    placeholder="e.g. Updated electrical items and standard rates"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>
                    Change Detail (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={newVerDetail}
                    onChange={(e) => setNewVerDetail(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: "1px solid #CBD5E1",
                      fontSize: 14,
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                    placeholder="Describe specific sections, rooms, or items modified..."
                  />
                </div>
              </div>

              <div className="boq-versions-modal-footer">
                <button
                  type="button"
                  className="boq-versions-btn"
                  style={{ background: "transparent", border: "1px solid #CBD5E1", color: "#64748B", padding: "0 16px" }}
                  onClick={() => setNewVersionModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="boq-versions-btn boq-versions-new-btn"
                >
                  Create Draft Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Compare Modal ── */}
      {compareModalOpen && (
        <div className="boq-versions-modal-overlay" onClick={() => setCompareModalOpen(false)}>
          <div className="boq-versions-modal-card" style={{ maxWidth: 650 }} onClick={(e) => e.stopPropagation()}>
            <div className="boq-versions-modal-header">
              <h3>Compare Versions</h3>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="boq-versions-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Current Published */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span className="boq-ver-tag">{currentPublishedVer}</span>
                    <span className="boq-ver-badge published">PUBLISHED</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>Current Baseline</div>
                  <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div><b>Sections:</b> {template.sections || 18}</div>
                    <div><b>Items:</b> {template.items || 186}</div>
                    <div><b>Workflow:</b> 07 Stages</div>
                    <div><b>Approvals:</b> 09 Rules</div>
                  </div>
                </div>

                {/* Selected Version */}
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span className="boq-ver-tag">{selectedVersion?.version}</span>
                    <span className={`boq-ver-badge ${selectedVersion?.status.toLowerCase()}`}>
                      {selectedVersion?.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#2563EB", marginBottom: 12 }}>Comparison Target</div>
                  <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div><b>Sections:</b> {template.sections || 18}</div>
                    <div><b>Items:</b> {(template.items || 186) + (typeof selectedVersion?.changes === "number" ? selectedVersion.changes : 0)}</div>
                    <div><b>Workflow:</b> 07 Stages</div>
                    <div><b>Approvals:</b> 09 Rules</div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Change Deltas</span>
                <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0 0" }}>
                  {selectedVersion?.changeDetail || selectedVersion?.changeSummary}
                </p>
              </div>
            </div>

            <div className="boq-versions-modal-footer">
              <button
                type="button"
                className="boq-versions-btn boq-versions-new-btn"
                onClick={() => {
                  setCompareModalOpen(false);
                  onNotice?.(`Comparison between ${currentPublishedVer} and ${selectedVersion?.version} completed.`);
                }}
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
