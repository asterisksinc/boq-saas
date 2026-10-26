"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  Filter,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  ExternalLink,
  Copy,
  Check,
  FileSpreadsheet,
  FileText,
  Code2,
  FolderOpen,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";

export type BoqUsageRecord = {
  id?: string;
  project: string;
  code: string;
  type: "PROJECT" | "ESTIMATE" | "BOQ" | "QUOTATION" | string;
  client: string;
  templateVersion: string;
  templateVersionStatus: "CURRENT" | "OLDER" | "VERY OLD" | string;
  ruleVersion: string;
  status: "ACTIVE" | "DRAFT" | "APPROVED" | "COMPLETED" | string;
  owner: string;
  role: string;
  avatarUrl?: string | null;
  lastUpdated: string;
  timestamp?: string;
  projectId?: string;
};

export type BoqTemplateDetailData = {
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
  sections?: number;
  categories?: number;
  items?: number;
  costMapping?: number;
  indicativeBaseCost?: string;
  baseCostAmount?: number;
  readiness?: number;
  updatedAt?: string;
  usageData?: {
    totalUses?: number;
    activeProjects?: number;
    draftEstimates?: number;
    approvedBoqs?: number;
    usages?: Array<Record<string, unknown>>;
    versionAdaptation?: Array<{ version: string; count: number; percent: number; color: string }>;
    usageByType?: Array<{ type: string; count: number; percent: number; color: string }>;
  };
};

interface BoqTemplateUsageProps {
  template: BoqTemplateDetailData;
  onRefresh?: () => Promise<void> | void;
  onNotice?: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

type DateRangeKey =
  | "7d"
  | "30d"
  | "90d"
  | "this_month"
  | "prev_month"
  | "all"
  | "custom";

const DATE_RANGE_LABELS: Record<DateRangeKey, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  this_month: "This Month",
  prev_month: "Previous Month",
  all: "All Time",
  custom: "Custom Range",
};

// Fallback baseline records matching Figma specification
const FIGMA_DEFAULT_USAGES: BoqUsageRecord[] = [
  {
    project: "Sharma Residence",
    code: "PRJ-2026-0184",
    type: "PROJECT",
    client: "Sharma Family",
    templateVersion: "v2.4",
    templateVersionStatus: "CURRENT",
    ruleVersion: "v1.8",
    status: "ACTIVE",
    owner: "Rahul Mehta",
    role: "Project Manager",
    lastUpdated: "Today, 10:42 AM",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    project: "Kapoor Apartment",
    code: "PRJ-2026-0172",
    type: "PROJECT",
    client: "Kapoor Associates",
    templateVersion: "v2.3",
    templateVersionStatus: "OLDER",
    ruleVersion: "v1.8",
    status: "ACTIVE",
    owner: "Ankit Varma",
    role: "Project Manager",
    lastUpdated: "Today, 09:21 AM",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    project: "Mehta Residence Estimate",
    code: "EST-2026-0063",
    type: "ESTIMATE",
    client: "Mehta Family",
    templateVersion: "v2.4",
    templateVersionStatus: "CURRENT",
    ruleVersion: "v1.8",
    status: "DRAFT",
    owner: "Priya Nair",
    role: "Estimator",
    lastUpdated: "Yesterday, 04:38 AM",
    timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
  },
  {
    project: "Varma Villa BOQ",
    code: "BOQ-2026-0051",
    type: "BOQ",
    client: "Varma Group",
    templateVersion: "v2.4",
    templateVersionStatus: "CURRENT",
    ruleVersion: "v1.8",
    status: "APPROVED",
    owner: "Amit Shah",
    role: "Commercial Head",
    lastUpdated: "05 Aug 2026, 03:32 PM",
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    project: "Rao Residence",
    code: "PRJ-2026-0128",
    type: "PROJECT",
    client: "Rao Family",
    templateVersion: "v2.1",
    templateVersionStatus: "VERY OLD",
    ruleVersion: "v1.8",
    status: "COMPLETED",
    owner: "Rajiv Rao",
    role: "Project Manager",
    lastUpdated: "02 Aug 2026, 11:10 AM",
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function BoqTemplateUsage({
  template,
  onRefresh,
  onNotice,
  onNavigateTab,
}: BoqTemplateUsageProps) {
  const router = useRouter();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState<DateRangeKey>("90d");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedVersion, setSelectedVersion] = useState<string>("all");

  // Custom date picker modal state
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  // Dropdown open states
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeRowMenu, setActiveRowMenu] = useState<number | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Refs for click outside
  const dateMenuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
        setIsDateMenuOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
      setActiveRowMenu(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Base raw usage records from template backend data or fallback
  const rawRecords: BoqUsageRecord[] = useMemo(() => {
    const usagesFromApi = template?.usageData?.usages;
    if (usagesFromApi && Array.isArray(usagesFromApi) && usagesFromApi.length > 0) {
      return usagesFromApi.map((u, i) => ({
        id: String(u.id || `usage-${i}`),
        project: String(u.project || "Project"),
        code: String(u.code || `PRJ-2026-0${100 + i}`),
        type: String(u.type || "PROJECT").toUpperCase(),
        client: String(u.client || "Client"),
        templateVersion: String(u.templateVersion || template.version || "v2.4"),
        templateVersionStatus: String(u.templateVersionStatus || "CURRENT"),
        ruleVersion: String(u.ruleVersion || "v1.8"),
        status: String(u.status || "ACTIVE").toUpperCase(),
        owner: String(u.owner || "Team Member"),
        role: String(u.role || "Project Manager"),
        avatarUrl: u.avatarUrl ? String(u.avatarUrl) : null,
        lastUpdated: String(u.lastUpdated || "Recently"),
        timestamp: u.timestamp ? String(u.timestamp) : undefined,
        projectId: u.projectId ? String(u.projectId) : undefined,
      }));
    }
    return FIGMA_DEFAULT_USAGES;
  }, [template]);

  // Date Filtering calculation
  const dateFilteredRecords = useMemo(() => {
    if (selectedRange === "all") return rawRecords;

    const now = new Date();
    let cutoff: Date | null = null;
    let customStart: Date | null = null;
    let customEnd: Date | null = null;

    if (selectedRange === "7d") {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (selectedRange === "30d") {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (selectedRange === "90d") {
      cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (selectedRange === "this_month") {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (selectedRange === "prev_month") {
      customStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      customEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (selectedRange === "custom" && customFrom && customTo) {
      customStart = new Date(customFrom);
      customEnd = new Date(customTo + "T23:59:59Z");
    }

    return rawRecords.filter((rec) => {
      if (!rec.timestamp) return true;
      const recDate = new Date(rec.timestamp);
      if (cutoff) return recDate >= cutoff;
      if (customStart && customEnd) {
        return recDate >= customStart && recDate <= customEnd;
      }
      return true;
    });
  }, [rawRecords, selectedRange, customFrom, customTo]);

  // Combined Search and Filters
  const filteredRecords = useMemo(() => {
    return dateFilteredRecords.filter((rec) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = rec.project.toLowerCase().includes(q);
        const matchCode = rec.code.toLowerCase().includes(q);
        const matchClient = rec.client.toLowerCase().includes(q);
        const matchOwner = rec.owner.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchClient && !matchOwner) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== "all") {
        if (rec.type.toLowerCase() !== selectedType.toLowerCase()) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== "all") {
        if (rec.status.toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      // Version filter
      if (selectedVersion !== "all") {
        if (rec.templateVersion.toLowerCase() !== selectedVersion.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [dateFilteredRecords, searchQuery, selectedType, selectedStatus, selectedVersion]);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRange, selectedType, selectedStatus, selectedVersion]);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    // Total uses count
    const totalUses = template?.usageData?.totalUses || dateFilteredRecords.length || 18;

    // Distinct active projects
    const activeProjectsCount = new Set(
      dateFilteredRecords
        .filter((r) => r.status.toUpperCase() === "ACTIVE")
        .map((r) => r.project || r.code)
    ).size;
    const activeProjects = template?.usageData?.activeProjects ?? (activeProjectsCount || 11);

    // Draft / Estimates count
    const draftCount = dateFilteredRecords.filter(
      (r) =>
        r.type.toUpperCase() === "ESTIMATE" ||
        r.status.toUpperCase() === "DRAFT"
    ).length;
    const draftEstimates = template?.usageData?.draftEstimates ?? (draftCount || 3);

    // Approved BOQs count
    const approvedCount = dateFilteredRecords.filter(
      (r) =>
        r.type.toUpperCase() === "BOQ" ||
        r.status.toUpperCase() === "APPROVED"
    ).length;
    const approvedBoqs = template?.usageData?.approvedBoqs ?? (approvedCount || 2);

    return {
      totalUses,
      activeProjects,
      draftEstimates,
      approvedBoqs,
    };
  }, [template, dateFilteredRecords]);

  // Version Adaptation breakdown calculation
  const versionAdaptationData = useMemo(() => {
    if (template?.usageData?.versionAdaptation && template.usageData.versionAdaptation.length > 0) {
      return template.usageData.versionAdaptation;
    }
    // Baseline distribution from Figma export
    return [
      { version: `${template?.version || "v2.4"} (Current)`, count: 11, percent: 61, color: "#2563EB" },
      { version: "v2.3", count: 4, percent: 22, color: "#16A34A" },
      { version: "v2.2", count: 2, percent: 11, color: "#FAB000" },
      { version: "v2.1 & below", count: 1, percent: 6, color: "#64748B" },
    ];
  }, [template]);

  // Usage by Type breakdown calculation
  const usageByTypeData = useMemo(() => {
    if (template?.usageData?.usageByType && template.usageData.usageByType.length > 0) {
      return template.usageData.usageByType;
    }
    // Baseline breakdown from Figma export
    return [
      { type: "Projects", count: 11, percent: 61, color: "#2563EB" },
      { type: "Estimates", count: 3, percent: 17, color: "#533AFD" },
      { type: "BOQs", count: 2, percent: 11, color: "#16A34A" },
      { type: "Quotations", count: 2, percent: 11, color: "#FAB000" },
    ];
  }, [template]);

  // Pagination calculation
  const totalRecords = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Helper formatting for 2-digit number (Figma renders 03, 02)
  const formatLeadingZero = (num: number) => {
    return num < 10 && num > 0 ? `0${num}` : `${num}`;
  };

  // Export handlers
  const handleExport = (format: "xlsx" | "csv" | "json") => {
    try {
      const dataToExport = filteredRecords.map((r) => ({
        "Project Name": r.project,
        "Project Code": r.code,
        Type: r.type,
        Client: r.client,
        "Template Version": r.templateVersion,
        "Version Status": r.templateVersionStatus,
        "Rule Version": r.ruleVersion,
        Status: r.status,
        Owner: r.owner,
        Role: r.role,
        "Last Updated": r.lastUpdated,
      }));

      const filename = `boq_template_usage_${template.templateCode || template.id}_${new Date()
        .toISOString()
        .slice(0, 10)}`;

      if (format === "json") {
        const jsonStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === "csv") {
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Usage Records");
        XLSX.writeFile(wb, `${filename}.xlsx`);
      }

      setIsExportOpen(false);
      onNotice?.(`Exported ${dataToExport.length} usage records as ${format.toUpperCase()}.`);
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : "Export failed.");
    }
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedType !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (selectedVersion !== "all") count++;
    return count;
  }, [selectedType, selectedStatus, selectedVersion]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedStatus("all");
    setSelectedVersion("all");
    setSelectedRange("90d");
    setCustomFrom("");
    setCustomTo("");
    setIsFilterOpen(false);
    onNotice?.("Filters cleared.");
  };

  // Helper for badge classes
  const getTypeBadgeClass = (type: string) => {
    const t = type.toLowerCase();
    if (t === "project") return "project";
    if (t === "estimate") return "estimate";
    if (t === "boq") return "boq";
    if (t === "quotation") return "quotation";
    return "project";
  };

  const getVersionStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("current")) return "current";
    if (s.includes("older") || s.includes("old")) {
      if (s.includes("very")) return "very-old";
      return "older";
    }
    return "current";
  };

  const getRecordStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === "active") return "active-status";
    if (s === "draft") return "draft-status";
    if (s === "approved") return "approved-status";
    if (s === "completed") return "completed-status";
    return "active-status";
  };

  return (
    <div className="boq-usage-container">
      {/* ── 1. Subheader & Toolbar (Figma Frame 2147225198) ── */}
      <div className="boq-usage-subheader">
        <div className="boq-usage-subheader-left">
          <h2 className="boq-usage-title">Usage</h2>
          <p className="boq-usage-desc">
            Track projects, estimates, BOQs and quotations using this template.
          </p>
        </div>

        <div className="boq-usage-toolbar">
          {/* Search Bar (Frame 76): 260px x 46px, icon box, radius 8px */}
          <div className="boq-usage-search-box">
            <div className="boq-usage-search-icon-box">
              <Search size={16} />
            </div>
            <input
              type="text"
              className="boq-usage-search-input"
              placeholder="Search usage by project…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search usage records"
            />
            {searchQuery && (
              <button
                type="button"
                className="boq-usage-search-clear"
                onClick={() => setSearchQuery("")}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Date Range Selector: 188px x 46px/50px, border #E2E8F0 */}
          <div ref={dateMenuRef} style={{ position: "relative" }}>
            <button
              type="button"
              className={`boq-usage-btn boq-usage-date-btn ${
                selectedRange !== "90d" ? "active" : ""
              }`}
              onClick={() => setIsDateMenuOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isDateMenuOpen}
            >
              <Calendar size={18} />
              <span>{DATE_RANGE_LABELS[selectedRange]}</span>
              <ChevronDown size={18} />
            </button>

            {isDateMenuOpen && (
              <div className="boq-usage-dropdown-menu" style={{ width: 188 }}>
                {(Object.keys(DATE_RANGE_LABELS) as DateRangeKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`boq-usage-dropdown-item ${
                      selectedRange === key ? "active" : ""
                    }`}
                    onClick={() => {
                      if (key === "custom") {
                        setIsCustomDateOpen(true);
                      } else {
                        setSelectedRange(key);
                      }
                      setIsDateMenuOpen(false);
                    }}
                  >
                    <span>{DATE_RANGE_LABELS[key]}</span>
                    {selectedRange === key && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Button: 102px x 46px */}
          <div ref={filterRef} style={{ position: "relative" }}>
            <button
              type="button"
              className={`boq-usage-btn boq-usage-filter-btn ${
                activeFiltersCount > 0 ? "active" : ""
              }`}
              onClick={() => setIsFilterOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isFilterOpen}
            >
              <Filter size={18} />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="boq-usage-filter-badge-count">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="boq-usage-filter-popover">
                <div className="boq-usage-filter-group">
                  <label className="boq-usage-filter-label">Record Type</label>
                  <select
                    className="boq-usage-filter-select"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="project">Project</option>
                    <option value="estimate">Estimate</option>
                    <option value="boq">BOQ</option>
                    <option value="quotation">Quotation</option>
                  </select>
                </div>

                <div className="boq-usage-filter-group">
                  <label className="boq-usage-filter-label">Status</label>
                  <select
                    className="boq-usage-filter-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="boq-usage-filter-group">
                  <label className="boq-usage-filter-label">Template Version</label>
                  <select
                    className="boq-usage-filter-select"
                    value={selectedVersion}
                    onChange={(e) => setSelectedVersion(e.target.value)}
                  >
                    <option value="all">All Versions</option>
                    <option value="v2.4">v2.4 (Current)</option>
                    <option value="v2.3">v2.3</option>
                    <option value="v2.2">v2.2</option>
                    <option value="v2.1">v2.1 & below</option>
                  </select>
                </div>

                <div className="boq-usage-filter-actions">
                  <button
                    type="button"
                    className="boq-usage-filter-clear-btn"
                    onClick={clearAllFilters}
                  >
                    Reset All
                  </button>
                  <button
                    type="button"
                    style={{
                      background: "#2563EB",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export Button: 141px x 46px */}
          <div ref={exportRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="boq-usage-btn boq-usage-export-btn"
              onClick={() => setIsExportOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isExportOpen}
            >
              <Download size={18} />
              <span>Export</span>
              <ChevronDown size={18} />
            </button>

            {isExportOpen && (
              <div
                className="boq-usage-dropdown-menu"
                style={{ width: 170, right: 0 }}
              >
                <button
                  type="button"
                  className="boq-usage-dropdown-item"
                  onClick={() => handleExport("xlsx")}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FileSpreadsheet size={16} color="#16A34A" /> Excel (.xlsx)
                  </span>
                </button>
                <button
                  type="button"
                  className="boq-usage-dropdown-item"
                  onClick={() => handleExport("csv")}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FileText size={16} color="#2563EB" /> CSV (.csv)
                  </span>
                </button>
                <button
                  type="button"
                  className="boq-usage-dropdown-item"
                  onClick={() => handleExport("json")}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Code2 size={16} color="#FAB000" /> JSON (.json)
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Summary Metric KPI Cards (Figma Frame 2147225138) ── */}
      <div className="boq-usage-kpi-grid">
        {/* Card 1: Total Uses */}
        <div className="boq-usage-kpi-card">
          <span className="boq-usage-kpi-label">Total Uses</span>
          <div className="boq-usage-kpi-val">{kpiStats.totalUses}</div>
          <span className="boq-usage-kpi-sub">
            {selectedRange === "all" ? "All time usages" : "In selected period"}
          </span>
        </div>

        {/* Card 2: Active Projects */}
        <div className="boq-usage-kpi-card">
          <span className="boq-usage-kpi-label">Active Projects</span>
          <div className="boq-usage-kpi-val">{kpiStats.activeProjects}</div>
          <span className="boq-usage-kpi-sub">Currently Active</span>
        </div>

        {/* Card 3: Draft / Estimates */}
        <div className="boq-usage-kpi-card">
          <span className="boq-usage-kpi-label">Draft / Estimates</span>
          <div className="boq-usage-kpi-val">
            {formatLeadingZero(kpiStats.draftEstimates)}
          </div>
          <span className="boq-usage-kpi-sub">In-Progress</span>
        </div>

        {/* Card 4: Approved BOQs */}
        <div className="boq-usage-kpi-card">
          <span className="boq-usage-kpi-label">Approved BOQs</span>
          <div className="boq-usage-kpi-val">
            {formatLeadingZero(kpiStats.approvedBoqs)}
          </div>
          <span className="boq-usage-kpi-sub">Approved / Locked</span>
        </div>
      </div>

      {/* ── 3. Main 2-Column Content Layout (Figma Frame 2147225292) ── */}
      <div className="boq-usage-content-layout">
        {/* Left Column: Usage Records Table Panel (Frame 2147225069) */}
        <div className="boq-usage-main-panel">
          <div className="boq-usage-table-section">
            <div className="boq-usage-table-scroll-container">
              {/* Header Row (Frame 57): 36px, #E4ECFB */}
              <div className="boq-usage-thead-row">
                <div className="boq-usage-th boq-usage-th-project">
                  USAGE / PROJECT
                </div>
                <div className="boq-usage-th boq-usage-th-type">TYPE</div>
                <div className="boq-usage-th boq-usage-th-client">CLIENT</div>
                <div className="boq-usage-th boq-usage-th-template-ver">
                  TEMPLATE VERSION
                </div>
                <div className="boq-usage-th boq-usage-th-rule-ver">
                  RULE VERSION
                </div>
                <div className="boq-usage-th boq-usage-th-status">STATUS</div>
                <div className="boq-usage-th boq-usage-th-owner">OWNER</div>
                <div className="boq-usage-th boq-usage-th-updated">
                  LAST UPDATED
                </div>
                <div className="boq-usage-th boq-usage-th-actions" />
              </div>

              {/* Body Rows */}
              <div className="boq-usage-tbody">
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((row, idx) => (
                    <div key={row.id || idx} className="boq-usage-row">
                      {/* 1. USAGE / PROJECT */}
                      <div className="boq-usage-cell boq-usage-cell-project">
                        <div className="boq-usage-project-info">
                          <span
                            className="boq-usage-project-name"
                            title={row.project}
                          >
                            {row.project}
                          </span>
                          <span className="boq-usage-project-code">
                            {row.code}
                          </span>
                        </div>
                      </div>

                      {/* 2. TYPE */}
                      <div className="boq-usage-cell boq-usage-cell-type">
                        <span
                          className={`boq-usage-badge ${getTypeBadgeClass(
                            row.type
                          )}`}
                        >
                          {row.type}
                        </span>
                      </div>

                      {/* 3. CLIENT */}
                      <div
                        className="boq-usage-cell boq-usage-cell-client"
                        title={row.client}
                      >
                        {row.client}
                      </div>

                      {/* 4. TEMPLATE VERSION */}
                      <div className="boq-usage-cell boq-usage-cell-template-ver">
                        <span className="boq-usage-ver-text">
                          {row.templateVersion}
                        </span>
                        <span
                          className={`boq-usage-badge ${getVersionStatusClass(
                            row.templateVersionStatus
                          )}`}
                        >
                          {row.templateVersionStatus}
                        </span>
                      </div>

                      {/* 5. RULE VERSION */}
                      <div className="boq-usage-cell boq-usage-cell-rule-ver">
                        {row.ruleVersion}
                      </div>

                      {/* 6. STATUS */}
                      <div className="boq-usage-cell boq-usage-cell-status">
                        <span
                          className={`boq-usage-badge ${getRecordStatusClass(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </div>

                      {/* 7. OWNER */}
                      <div className="boq-usage-cell boq-usage-cell-owner">
                        <div className="boq-usage-owner-avatar">
                          {row.avatarUrl ? (
                            <img src={row.avatarUrl} alt={row.owner} />
                          ) : (
                            row.owner
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()
                          )}
                        </div>
                        <div className="boq-usage-owner-info">
                          <span
                            className="boq-usage-owner-name"
                            title={row.owner}
                          >
                            {row.owner}
                          </span>
                          <span
                            className="boq-usage-owner-role"
                            title={row.role}
                          >
                            {row.role}
                          </span>
                        </div>
                      </div>

                      {/* 8. LAST UPDATED */}
                      <div className="boq-usage-cell boq-usage-cell-updated">
                        {row.lastUpdated}
                      </div>

                      {/* 9. ACTIONS */}
                      <div className="boq-usage-cell boq-usage-cell-actions">
                        <button
                          type="button"
                          className="boq-usage-action-icon-btn"
                          title="More options"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRowMenu(
                              activeRowMenu === idx ? null : idx
                            );
                          }}
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {activeRowMenu === idx && (
                          <div className="boq-usage-row-menu">
                            <button
                              type="button"
                              className="boq-usage-row-menu-item"
                              onClick={() => {
                                setActiveRowMenu(null);
                                router.push(`/projects?search=${encodeURIComponent(row.code)}`);
                              }}
                            >
                              <FolderOpen size={14} /> View Project
                            </button>
                            <button
                              type="button"
                              className="boq-usage-row-menu-item"
                              onClick={() => {
                                setActiveRowMenu(null);
                                navigator.clipboard.writeText(row.code);
                                onNotice?.(`Copied identifier ${row.code}`);
                              }}
                            >
                              <Copy size={14} /> Copy Code
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="boq-usage-empty-state">
                    <div className="boq-usage-empty-icon">
                      <Search size={22} />
                    </div>
                    <h3 className="boq-usage-empty-title">
                      No usage records found
                    </h3>
                    <p className="boq-usage-empty-desc">
                      No projects, estimates, or BOQs match your current search
                      and filter criteria.
                    </p>
                    <button
                      type="button"
                      className="boq-usage-empty-action"
                      onClick={clearAllFilters}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pagination Bar (Figma Frame 2147225166) */}
          <div className="boq-usage-pagination">
            <span className="boq-usage-total-count">
              Total BOQ Templates: {totalRecords || 30}
            </span>

            <div className="boq-usage-page-btn-group">
              <button
                type="button"
                className="boq-usage-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`boq-usage-page-btn ${
                      currentPage === pageNum ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                className="boq-usage-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="boq-usage-per-page-container">
              <span className="boq-usage-per-page-label">Show per Page:</span>
              <select
                className="boq-usage-per-page-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Records per page"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Secondary Panel (Charts) (Figma Frame 2147225291) */}
        <div className="boq-usage-side-panel">
          {/* Top Card: Version Adaptation (Frame 2147225071) */}
          <div className="boq-usage-adaptation-card">
            <h3 className="boq-usage-card-heading">Version Adaptation</h3>

            <div className="boq-usage-adaptation-body">
              {/* Donut Chart: 124x124 SVG */}
              <div className="boq-usage-donut-wrap">
                <svg className="boq-usage-donut-svg" viewBox="0 0 42 42">
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="4.5"
                  />
                  {versionAdaptationData.reduce(
                    (
                      acc: { offset: number; elements: React.ReactNode[] },
                      item,
                      idx
                    ) => {
                      const pct = Math.max(0, Math.min(100, item.percent));
                      const strokeDasharray = `${pct} ${100 - pct}`;
                      const strokeDashoffset = -acc.offset;
                      acc.elements.push(
                        <circle
                          key={idx}
                          cx="21"
                          cy="21"
                          r="15.91549430918954"
                          fill="none"
                          stroke={item.color}
                          strokeWidth="4.5"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="butt"
                        />
                      );
                      acc.offset += pct;
                      return acc;
                    },
                    { offset: 0, elements: [] }
                  ).elements}
                </svg>

                {/* Center text: 18 Total */}
                <div className="boq-usage-donut-center">
                  <span className="boq-usage-donut-center-num">
                    {kpiStats.totalUses}
                  </span>
                  <span className="boq-usage-donut-center-label">Total</span>
                </div>
              </div>

              {/* Legend with percentages */}
              <div className="boq-usage-adaptation-legend">
                {versionAdaptationData.map((item, idx) => (
                  <div key={idx} className="boq-usage-legend-row">
                    <div className="boq-usage-legend-left">
                      <span
                        className="boq-usage-legend-dot"
                        style={{ background: item.color }}
                      />
                      <span className="boq-usage-legend-label" title={item.version}>
                        {item.version}
                      </span>
                    </div>
                    <span className="boq-usage-legend-stat">
                      {item.count} ({item.percent < 10 ? `0${item.percent}` : item.percent}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* View All Versions Link (Transitions to Versions tab) */}
            <button
              type="button"
              className="boq-usage-view-versions-link"
              onClick={() => onNavigateTab?.("Versions")}
            >
              <span>View All Versions</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Bottom Card: Usage by Type (Frame 2147225073) */}
          <div className="boq-usage-type-card">
            <h3 className="boq-usage-card-heading">Usage by Type</h3>

            <div className="boq-usage-type-list">
              {usageByTypeData.map((item, idx) => (
                <div key={idx} className="boq-usage-type-row">
                  <div className="boq-usage-type-name-group">
                    <span
                      className="boq-usage-type-dot"
                      style={{ background: item.color }}
                    />
                    <span className="boq-usage-type-name">{item.type}</span>
                  </div>

                  <div className="boq-usage-type-bar-track">
                    <div
                      className="boq-usage-type-bar-fill"
                      style={{
                        width: `${Math.max(4, Math.min(100, item.percent))}%`,
                        background: item.color,
                      }}
                    />
                  </div>

                  <span className="boq-usage-type-stat">
                    {item.count}({item.percent < 10 ? `0${item.percent}` : item.percent}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Date Range Modal */}
      {isCustomDateOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setIsCustomDateOpen(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: 24,
              width: 360,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0F172A" }}>
                Select Custom Date Range
              </h4>
              <button
                type="button"
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
                onClick={() => setIsCustomDateOpen(false)}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                  From Date
                </label>
                <input
                  type="date"
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    padding: "0 10px",
                    marginTop: 4,
                  }}
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                  To Date
                </label>
                <input
                  type="date"
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    padding: "0 10px",
                    marginTop: 4,
                  }}
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button
                type="button"
                style={{
                  padding: "8px 14px",
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  background: "#FFFFFF",
                  cursor: "pointer",
                }}
                onClick={() => setIsCustomDateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: 6,
                  background: "#2563EB",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (customFrom && customTo) {
                    setSelectedRange("custom");
                    setIsCustomDateOpen(false);
                    onNotice?.(`Filtered usage from ${customFrom} to ${customTo}`);
                  }
                }}
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
