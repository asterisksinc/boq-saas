"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  Filter,
  Download,
  ChevronDown,
  X,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Sliders,
  MoreVertical,
  ExternalLink,
  RefreshCw,
  FolderPlus,
} from "lucide-react";
import {
  getTemplateUsage,
  TemplateUsageRecord,
  TemplateUsageStats,
} from "@/lib/api/templates";

interface TemplateUsageProps {
  templateId: string;
  templateName?: string;
  templateCode?: string;
  useCount?: number;
  lastUsedAt?: string | null;
  currentVersion?: string | number;
  onUseTemplate?: () => void;
}

type DateRangeKey =
  | "7d"
  | "30d"
  | "90d"
  | "this_month"
  | "prev_month"
  | "custom"
  | "all";

const DATE_RANGE_LABELS: Record<DateRangeKey, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  this_month: "This Month",
  prev_month: "Previous Month",
  custom: "Custom Date Range",
  all: "All Time",
};

export default function TemplateUsage({
  templateId,
  templateName = "Template",
  templateCode,
  useCount = 0,
  lastUsedAt,
  currentVersion = "3.2",
  onUseTemplate,
}: TemplateUsageProps) {
  const router = useRouter();

  // Search & Filters state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeKey>("90d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customDateError, setCustomDateError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [versionFilter, setVersionFilter] = useState<string>("all");

  // Dropdown open states
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [activeKebabId, setActiveKebabId] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data state
  const [items, setItems] = useState<TemplateUsageRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<TemplateUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Outside click handler for dropdowns
  const dateMenuRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dateMenuRef.current &&
        !dateMenuRef.current.contains(event.target as Node)
      ) {
        setIsDateMenuOpen(false);
      }
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target as Node)
      ) {
        setIsFilterPanelOpen(false);
      }
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch usage data
  const fetchData = useCallback(async () => {
    if (!templateId) return;
    try {
      setLoading(true);
      setError(null);

      const res = await getTemplateUsage(templateId, {
        page,
        pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        version: versionFilter !== "all" ? versionFilter : undefined,
        range: dateRange,
        fromDate: dateRange === "custom" && customFrom ? customFrom : undefined,
        toDate: dateRange === "custom" && customTo ? customTo : undefined,
      });

      if (res) {
        setItems(res.items || []);
        setTotal(res.total || 0);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load usage data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    templateId,
    page,
    pageSize,
    debouncedSearch,
    statusFilter,
    versionFilter,
    dateRange,
    customFrom,
    customTo,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Export (CSV or Excel)
  const handleExport = (format: "csv" | "excel") => {
    setIsExportMenuOpen(false);
    if (!items || items.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Project Name",
      "Project Code",
      "Client / Trigger",
      "Owner",
      "Created On",
      "Template Version",
      "Status",
      "Progress (%)",
      "Last Updated",
      "Usage Source",
      "Modifications",
    ];

    const rows = items.map((item) => [
      `"${item.projectName.replace(/"/g, '""')}"`,
      `"${item.projectCode}"`,
      `"${item.clientName.replace(/"/g, '""')}"`,
      `"${item.owner.name.replace(/"/g, '""')}"`,
      `"${new Date(item.createdAt).toLocaleDateString("en-GB")}"`,
      `"${item.templateVersion}"`,
      `"${item.displayStatus}"`,
      item.progress,
      `"${new Date(item.updatedAt).toLocaleDateString("en-GB")}"`,
      `"${item.usageSource}"`,
      `"${item.modifications}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute(
      "download",
      `template-${templateCode || templateId}-usage-${dateStamp}.${format === "excel" ? "csv" : "csv"}`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom date range submission
  const handleApplyCustomDate = () => {
    if (!customFrom || !customTo) {
      setCustomDateError("Please select both start and end dates.");
      return;
    }
    if (new Date(customFrom) > new Date(customTo)) {
      setCustomDateError("Start date cannot be after end date.");
      return;
    }
    setCustomDateError(null);
    setIsCustomModalOpen(false);
    setDateRange("custom");
    setPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setVersionFilter("all");
    setDateRange("90d");
    setPage(1);
  };

  const hasActiveFilters =
    debouncedSearch !== "" ||
    statusFilter !== "all" ||
    versionFilter !== "all" ||
    dateRange !== "90d";

  // Calculations for KPI Cards
  const projectsCreatedVal = stats
    ? String(stats.projectsCreated).padStart(2, "0")
    : "06";
  const projectsCreatedTrend = stats
    ? stats.projectsCreatedTrend
    : "↑ 18% vs Last 90 Days";
  const activeProjectsVal = stats
    ? String(stats.activeProjects).padStart(2, "0")
    : "31";
  const activeProjectsSub = stats
    ? `${stats.activeProjectsPercent}% of Total Usage`
    : "74% of Total Usage";
  const completedProjectsVal = stats
    ? String(stats.completedProjects).padStart(2, "0")
    : "08";
  const completedProjectsSub = stats
    ? `${stats.completedProjectsPercent}% of Total Usage`
    : "19% of Total Usage";
  const versionsUsedVal = stats
    ? String(stats.versionsUsed).padStart(2, "0")
    : "03";
  const latestVersionSub = stats
    ? `Latest: ${stats.latestVersion}`
    : "Latest: v3.2";

  // Health and Reusability
  const healthScore = stats ? stats.healthScore : 91;
  const reusabilityScore = stats ? stats.reusabilityScore : 88;
  const reusabilityEligible = stats ? stats.reusabilityEligibleCount : 33;
  const reusabilityNoMajor = stats ? stats.reusabilityNoMajorCount : 29;

  // Post creation modifications
  const asIsStat = stats
    ? `${stats.postCreationModifications.asIs.count} (${stats.postCreationModifications.asIs.percent}%)`
    : "29 (69%)";
  const asIsPct = stats ? stats.postCreationModifications.asIs.percent : 69;

  const minorStat = stats
    ? `${stats.postCreationModifications.minor.count} (${stats.postCreationModifications.minor.percent}%)`
    : "9 (21%)";
  const minorPct = stats ? stats.postCreationModifications.minor.percent : 21;

  const majorStat = stats
    ? `${stats.postCreationModifications.major.count} (${stats.postCreationModifications.major.percent}%)`
    : "4 (10%)";
  const majorPct = stats ? stats.postCreationModifications.major.percent : 10;

  // Versions adoption list
  const versionAdoption = stats
    ? stats.versionAdoption
    : [
        { version: "v3.2 (Latest)", rawVersion: "v3.2", count: 28, percent: 67 },
        { version: "v3.1", rawVersion: "v3.1", count: 9, percent: 21 },
        { version: "v3.0", rawVersion: "v3.0", count: 4, percent: 10 },
        { version: "v2.5", rawVersion: "v2.5", count: 1, percent: 2 },
      ];

  const olderVersionsCount = stats ? stats.olderVersionProjectsCount : 14;

  // Status distribution list
  const statusDist = stats
    ? stats.statusDistribution
    : [
        { status: "active", label: "Active", count: 31, percent: 74, color: "#16A34A" },
        { status: "completed", label: "Completed", count: 8, percent: 21, color: "#2563EB" },
        { status: "on_hold", label: "On-Hold", count: 2, percent: 5, color: "#FAB000" },
        { status: "cancelled", label: "Cancelled", count: 1, percent: 2, color: "#DC2626" },
      ];

  const totalStatusProjects = statusDist.reduce((acc, cur) => acc + cur.count, 0) || 42;

  // Monthly trends for bar chart
  const monthlyTrends = stats
    ? stats.monthlyTrends
    : [
        { month: "Jan", created: 6, active: 14, completed: 3 },
        { month: "Feb", created: 8, active: 18, completed: 4 },
        { month: "Mar", created: 10, active: 22, completed: 5 },
        { month: "Apr", created: 14, active: 26, completed: 6 },
        { month: "May", created: 12, active: 29, completed: 7 },
        { month: "Jun", created: 16, active: 31, completed: 8 },
      ];

  // Pagination calculation
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Format date helper
  const formatDate = (isoString?: string | null): string => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return "—";
    }
  };

  const formatTime = (isoString?: string | null): string => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    } catch {
      return "";
    }
  };

  return (
    <div className="td-usage-tab-wrapper">
      {/* ====================================================================
          1. SECTION HEADER & TOOLBAR (Frame 2147225198)
          ==================================================================== */}
      <div className="td-usage-header-row">
        {/* Left Titles */}
        <div className="td-usage-header-left">
          <h2 className="td-usage-title">Usage</h2>
          <p className="td-usage-subtitle">
            Define the operational process inherited by projects created from this template.
          </p>
        </div>

        {/* Right Toolbar (Frame 2147225069) */}
        <div className="td-usage-toolbar">
          {/* Search Box (Frame 76) */}
          <div className="td-usage-search-box">
            <div className="td-usage-search-icon-box">
              <Search size={16} />
            </div>
            <input
              type="text"
              className="td-usage-search-input"
              placeholder="Search projects…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search projects created from this template"
            />
            {searchInput && (
              <button
                type="button"
                className="td-usage-clear-btn"
                onClick={() => setSearchInput("")}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Buttons Group (Frame 2147225194) */}
          <div className="td-usage-btn-group">
            {/* Date Range Selector */}
            <div ref={dateMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                className={`td-usage-date-btn ${isDateMenuOpen ? "active" : ""}`}
                onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
                aria-haspopup="true"
                aria-expanded={isDateMenuOpen}
              >
                <Calendar size={18} />
                <span>{DATE_RANGE_LABELS[dateRange]}</span>
                <ChevronDown size={16} />
              </button>

              {isDateMenuOpen && (
                <div className="td-usage-popover" role="menu">
                  {(Object.keys(DATE_RANGE_LABELS) as DateRangeKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      role="menuitem"
                      className={`td-usage-popover-item ${dateRange === key ? "selected" : ""}`}
                      onClick={() => {
                        setIsDateMenuOpen(false);
                        if (key === "custom") {
                          setIsCustomModalOpen(true);
                        } else {
                          setDateRange(key);
                          setPage(1);
                        }
                      }}
                    >
                      <span>{DATE_RANGE_LABELS[key]}</span>
                      {dateRange === key && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Button */}
            <div ref={filterPanelRef} style={{ position: "relative" }}>
              <button
                type="button"
                className={`td-usage-filter-btn ${isFilterPanelOpen ? "active" : ""}`}
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                aria-label="Filter projects"
              >
                <Filter size={16} />
                <span>Filter</span>
                {(statusFilter !== "all" || versionFilter !== "all") && (
                  <span className="td-usage-filter-dot" />
                )}
              </button>

              {isFilterPanelOpen && (
                <div className="td-usage-filter-panel" role="dialog" aria-label="Filters">
                  <div className="td-usage-filter-group">
                    <label className="td-usage-filter-label" htmlFor="filter-status-select">Status</label>
                    <select
                      id="filter-status-select"
                      className="td-usage-filter-select"
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On-Hold</option>
                      <option value="planning">Planning</option>
                    </select>
                  </div>

                  <div className="td-usage-filter-group">
                    <label className="td-usage-filter-label" htmlFor="filter-version-select">Template Version</label>
                    <select
                      id="filter-version-select"
                      className="td-usage-filter-select"
                      value={versionFilter}
                      onChange={(e) => {
                        setVersionFilter(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="all">All Versions</option>
                      <option value="v3.2">v3.2 (Latest)</option>
                      <option value="v3.1">v3.1</option>
                      <option value="v3.0">v3.0</option>
                      <option value="v2.5">v2.5</option>
                    </select>
                  </div>

                  <div className="td-usage-filter-actions">
                    <button
                      type="button"
                      className="td-usage-filter-btn-clear"
                      onClick={() => {
                        setStatusFilter("all");
                        setVersionFilter("all");
                        setPage(1);
                        setIsFilterPanelOpen(false);
                      }}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className="td-usage-primary-btn"
                      style={{ padding: "6px 14px", fontSize: 13, marginTop: 0 }}
                      onClick={() => setIsFilterPanelOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Export Button */}
            <div ref={exportMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="td-usage-export-btn"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                aria-haspopup="true"
                aria-expanded={isExportMenuOpen}
              >
                <Download size={16} />
                <span>Export</span>
                <ChevronDown size={16} />
              </button>

              {isExportMenuOpen && (
                <div className="td-usage-popover" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className="td-usage-popover-item"
                    onClick={() => handleExport("csv")}
                  >
                    <span>Export as CSV (.csv)</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="td-usage-popover-item"
                    onClick={() => handleExport("excel")}
                  >
                    <span>Export as Excel (.xlsx)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. SUMMARY KPI CARDS (Frame 2147225138)
          ==================================================================== */}
      <div className="td-usage-kpi-row">
        {/* Card 1: Projects Created */}
        <div className="td-usage-kpi-card">
          <span className="td-usage-kpi-label">Projects Created</span>
          <span className="td-usage-kpi-val">{projectsCreatedVal}</span>
          <span className="td-usage-kpi-sub green">{projectsCreatedTrend}</span>
        </div>

        {/* Card 2: Active Projects */}
        <div className="td-usage-kpi-card">
          <span className="td-usage-kpi-label">Active Projects</span>
          <span className="td-usage-kpi-val">{activeProjectsVal}</span>
          <span className="td-usage-kpi-sub">{activeProjectsSub}</span>
        </div>

        {/* Card 3: Completed Projects */}
        <div className="td-usage-kpi-card">
          <span className="td-usage-kpi-label">Completed Projects</span>
          <span className="td-usage-kpi-val">{completedProjectsVal}</span>
          <span className="td-usage-kpi-sub">{completedProjectsSub}</span>
        </div>

        {/* Card 4: Versions Used */}
        <div className="td-usage-kpi-card">
          <span className="td-usage-kpi-label">Versions Used</span>
          <span className="td-usage-kpi-val">{versionsUsedVal}</span>
          <span className="td-usage-kpi-sub">{latestVersionSub}</span>
        </div>
      </div>

      {/* ====================================================================
          3. MIDDLE ROW 1: Health, Modifications, Reusability (Frame 2147225199)
          ==================================================================== */}
      <div className="td-usage-middle-row">
        {/* Card 1: Template Usage Health */}
        <div className="td-usage-card td-usage-card-h147">
          <div className="td-usage-health-section">
            <div className="td-usage-card-header">
              <h3 className="td-usage-card-title">Template Usage Health</h3>
              <span className="td-usage-card-score">{healthScore}/100</span>
            </div>
            <div className="td-usage-health-track">
              <div
                className="td-usage-health-fill"
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>

          <div className="td-usage-health-grid">
            <div className="td-usage-health-grid-row">
              <div className="td-usage-health-indicator">
                <span className="td-usage-health-indicator-icon">
                  <Zap size={16} />
                </span>
                <span className="td-usage-health-indicator-text">
                  Strong Adoption
                </span>
              </div>
              <div className="td-usage-health-indicator">
                <span className="td-usage-health-indicator-icon">
                  <CheckCircle2 size={16} />
                </span>
                <span className="td-usage-health-indicator-text">
                  Latest Version widely Adopted
                </span>
              </div>
            </div>

            <div className="td-usage-health-grid-row">
              <div className="td-usage-health-indicator">
                <span className="td-usage-health-indicator-icon">
                  <Sliders size={16} />
                </span>
                <span className="td-usage-health-indicator-text">
                  Low modification
                </span>
              </div>
              <div className="td-usage-health-indicator">
                <span className="td-usage-health-indicator-icon yellow">
                  <AlertTriangle size={16} />
                </span>
                <span className="td-usage-health-indicator-text">
                  3 Projects still using older version
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Post-Creation Modification */}
        <div className="td-usage-card td-usage-card-h147">
          <div className="td-usage-card-header">
            <h3 className="td-usage-card-title">Post-Creation Modification</h3>
          </div>

          <div className="td-usage-mod-list">
            {/* Used as-is */}
            <div className="td-usage-mod-row">
              <div className="td-usage-mod-label-wrap">
                <span className="td-usage-mod-dot green" />
                <span className="td-usage-mod-label">Used as-is</span>
              </div>
              <div className="td-usage-mod-bar-track">
                <div
                  className="td-usage-mod-bar-fill green"
                  style={{ width: `${asIsPct}%` }}
                />
              </div>
              <span className="td-usage-mod-stat">{asIsStat}</span>
            </div>

            {/* Minor Modifications */}
            <div className="td-usage-mod-row">
              <div className="td-usage-mod-label-wrap">
                <span className="td-usage-mod-dot amber" />
                <span className="td-usage-mod-label">Minor Modifications</span>
              </div>
              <div className="td-usage-mod-bar-track">
                <div
                  className="td-usage-mod-bar-fill amber"
                  style={{ width: `${minorPct}%` }}
                />
              </div>
              <span className="td-usage-mod-stat">{minorStat}</span>
            </div>

            {/* Major Modifications */}
            <div className="td-usage-mod-row">
              <div className="td-usage-mod-label-wrap">
                <span className="td-usage-mod-dot red" />
                <span className="td-usage-mod-label">Major Modifications</span>
              </div>
              <div className="td-usage-mod-bar-track">
                <div
                  className="td-usage-mod-bar-fill red"
                  style={{ width: `${majorPct}%` }}
                />
              </div>
              <span className="td-usage-mod-stat">{majorStat}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Reusability Score */}
        <div className="td-usage-card td-usage-card-h147">
          <div className="td-usage-card-header">
            <h3 className="td-usage-card-title">Reusability Score</h3>
          </div>

          <div className="td-usage-reusability-body">
            {/* Circular Gauge */}
            <div className="td-usage-gauge-container">
              <svg className="td-usage-gauge-svg" width="80" height="80" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="#E2E8F0"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="#16A34A"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - reusabilityScore / 100)}`}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="td-usage-gauge-center">{reusabilityScore}%</span>
            </div>

            <div className="td-usage-gauge-info">
              <span className="td-usage-gauge-highlight">High Reusability</span>
              <p className="td-usage-gauge-desc">
                {reusabilityNoMajor} of {reusabilityEligible} eligible projects required no major changes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          4. MIDDLE ROW 2: Usage Trend, Status Distribution, Version Adoption
          ==================================================================== */}
      <div className="td-usage-charts-row">
        {/* Card 1: Template Usage Trend */}
        <div className="td-usage-card td-usage-card-h256">
          <div className="td-usage-card-header">
            <h3 className="td-usage-card-title">Template Usage Trend</h3>
          </div>

          {/* Legend */}
          <div className="td-usage-legend-row">
            <div className="td-usage-legend-item">
              <span className="td-usage-mod-dot blue" />
              <span>Projects Created</span>
            </div>
            <div className="td-usage-legend-item">
              <span className="td-usage-mod-dot green" />
              <span>Active Projects</span>
            </div>
            <div className="td-usage-legend-item">
              <span className="td-usage-mod-dot amber" />
              <span>Completed Projects</span>
            </div>
          </div>

          {/* Stacked Bars Trend Chart */}
          <div className="td-usage-chart-wrap">
            {/* Y Axis */}
            <div className="td-usage-y-axis">
              <span className="td-usage-y-label">400</span>
              <span className="td-usage-y-label">300</span>
              <span className="td-usage-y-label">200</span>
              <span className="td-usage-y-label">100</span>
              <span className="td-usage-y-label">0</span>
            </div>

            {/* Bars Area with Grid */}
            <div className="td-usage-bars-area">
              <div className="td-usage-grid-lines">
                <div className="td-usage-grid-line" />
                <div className="td-usage-grid-line" />
                <div className="td-usage-grid-line" />
                <div className="td-usage-grid-line" />
                <div className="td-usage-grid-line" />
              </div>

              <div className="td-usage-bars-columns">
                {monthlyTrends.map((col, idx) => {
                  const maxVal = 40;
                  const hCreated = Math.min(45, (col.created / maxVal) * 45 + 15);
                  const hActive = Math.min(45, (col.active / maxVal) * 45 + 18);
                  const hCompleted = Math.min(35, (col.completed / maxVal) * 35 + 10);

                  return (
                    <div
                      key={col.month || idx}
                      className="td-usage-bar-col"
                      title={`${col.month}: Created ${col.created}, Active ${col.active}, Completed ${col.completed}`}
                    >
                      <div
                        className="td-usage-bar-segment blue"
                        style={{ height: `${hCreated}px` }}
                      />
                      <div
                        className="td-usage-bar-segment green"
                        style={{ height: `${hActive}px` }}
                      />
                      <div
                        className="td-usage-bar-segment yellow"
                        style={{ height: `${hCompleted}px` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X Axis */}
              <div className="td-usage-x-axis">
                {monthlyTrends.map((col, idx) => (
                  <span key={col.month || idx} className="td-usage-x-label">
                    {col.month}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Project Status Distribution */}
        <div className="td-usage-card td-usage-card-h256">
          <div className="td-usage-card-header">
            <h3 className="td-usage-card-title">Version Adaptation</h3>
          </div>

          <div className="td-usage-status-content">
            {/* Donut Chart */}
            <div className="td-usage-donut-container">
              <svg className="td-usage-donut-svg" width="140" height="140" viewBox="0 0 140 140">
                {/* Segments */}
                <circle
                  cx="70"
                  cy="70"
                  r="52"
                  stroke="#16A34A"
                  strokeWidth="16"
                  strokeDasharray={`${2 * Math.PI * 52 * 0.74} ${2 * Math.PI * 52 * 0.26}`}
                  strokeDashoffset="0"
                  fill="transparent"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="52"
                  stroke="#2563EB"
                  strokeWidth="16"
                  strokeDasharray={`${2 * Math.PI * 52 * 0.21} ${2 * Math.PI * 52 * 0.79}`}
                  strokeDashoffset={`${-2 * Math.PI * 52 * 0.74}`}
                  fill="transparent"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="52"
                  stroke="#FAB000"
                  strokeWidth="16"
                  strokeDasharray={`${2 * Math.PI * 52 * 0.05} ${2 * Math.PI * 52 * 0.95}`}
                  strokeDashoffset={`${-2 * Math.PI * 52 * 0.95}`}
                  fill="transparent"
                />
              </svg>
              <div className="td-usage-donut-center">
                <span className="td-usage-donut-count">{totalStatusProjects}</span>
                <span className="td-usage-donut-label">Projects</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="td-usage-status-legend">
              {statusDist.map((st) => (
                <div key={st.status} className="td-usage-status-legend-item">
                  <div className="td-usage-status-legend-left">
                    <span
                      className="td-usage-mod-dot"
                      style={{ background: st.color }}
                    />
                    <span className="td-usage-status-legend-label">
                      {st.label}
                    </span>
                  </div>
                  <span className="td-usage-status-legend-stat">
                    {st.count} ({String(st.percent).padStart(2, "0")}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Version Adoption */}
        <div className="td-usage-card td-usage-card-h256">
          <div className="td-usage-card-header">
            <h3 className="td-usage-card-title">Version Adoption</h3>
          </div>

          <div className="td-usage-version-section">
            <div className="td-usage-version-bars">
              {versionAdoption.map((v) => (
                <div key={v.version} className="td-usage-mod-row">
                  <div className="td-usage-mod-label-wrap" style={{ width: 100 }}>
                    <span className="td-usage-mod-label">{v.version}</span>
                  </div>
                  <div className="td-usage-mod-bar-track">
                    <div
                      className="td-usage-mod-bar-fill blue"
                      style={{ width: `${v.percent}%` }}
                    />
                  </div>
                  <span className="td-usage-mod-stat">
                    {v.count} ({v.percent}%)
                  </span>
                </div>
              ))}
            </div>

            <div className="td-usage-version-divider" />

            <div className="td-usage-version-alert">
              <div className="td-usage-version-alert-left">
                <AlertTriangle size={16} color="#FAB000" />
                <span>
                  {olderVersionsCount} Active projects are on older version templates.
                </span>
              </div>
              <button
                type="button"
                className="td-usage-version-alert-link"
                onClick={() => {
                  setVersionFilter("v3.1");
                  setStatusFilter("active");
                  setPage(1);
                }}
              >
                View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          5. PROJECTS CREATED TABLE (Frame 2147225085 & Frame 2147225072)
          ==================================================================== */}
      <div className="td-usage-table-card">
        {loading && items.length === 0 ? (
          <div style={{ width: "100%", padding: "40px 0" }}>
            <div
              className="td-usage-skeleton"
              style={{ height: 40, marginBottom: 12 }}
            />
            <div
              className="td-usage-skeleton"
              style={{ height: 50, marginBottom: 8 }}
            />
            <div
              className="td-usage-skeleton"
              style={{ height: 50, marginBottom: 8 }}
            />
            <div className="td-usage-skeleton" style={{ height: 50 }} />
          </div>
        ) : error ? (
          <div className="td-usage-empty-state">
            <AlertTriangle size={36} color="#DC2626" />
            <h4 className="td-usage-empty-title">Error Loading Projects</h4>
            <p className="td-usage-empty-desc">{error}</p>
            <button
              type="button"
              className="td-usage-primary-btn"
              onClick={fetchData}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="td-usage-empty-state">
            {hasActiveFilters ? (
              <>
                <Search size={36} color="#64748B" />
                <h4 className="td-usage-empty-title">No Matching Projects Found</h4>
                <p className="td-usage-empty-desc">
                  No projects match your current filter and date criteria. Try adjusting your query or reset the filters.
                </p>
                <button
                  type="button"
                  className="td-usage-primary-btn"
                  onClick={handleClearFilters}
                >
                  Clear All Filters
                </button>
              </>
            ) : (
              <>
                <FolderPlus size={36} color="#2563EB" />
                <h4 className="td-usage-empty-title">No Projects Created Yet</h4>
                <p className="td-usage-empty-desc">
                  This template hasn&apos;t been used to create any projects yet. Use this template to create a new project.
                </p>
                {onUseTemplate && (
                  <button
                    type="button"
                    className="td-usage-primary-btn"
                    onClick={onUseTemplate}
                  >
                    Use Template Now
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            <div className="td-usage-table-scroll">
              <table className="td-usage-table">
                <thead>
                  <tr>
                    <th style={{ width: "16%" }}>PROJECT</th>
                    <th style={{ width: "13%" }}>TRIGGER</th>
                    <th style={{ width: "13%" }}>OWNER</th>
                    <th style={{ width: "13%" }}>CREATED ON</th>
                    <th style={{ width: "11%" }}>TEMPLATE VERSION</th>
                    <th style={{ width: "9%" }}>STATUS</th>
                    <th style={{ width: "16%" }}>PROGRESS</th>
                    <th style={{ width: "11%" }}>LAST UPDATED</th>
                    <th style={{ width: "11%" }}>USAGE SOURCE</th>
                    <th style={{ width: "9%" }}>MODIFICATIONS</th>
                    <th style={{ width: "4%" }} className="center"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      {/* Project Name */}
                      <td>
                        <div className="td-usage-project-cell">
                          <span
                            className="td-usage-project-title"
                            onClick={() => router.push(`/projects/${item.projectId}`)}
                            title={item.projectName}
                          >
                            {item.projectName}
                          </span>
                          <span className="td-usage-project-code">
                            {item.projectCode}
                          </span>
                        </div>
                      </td>

                      {/* Trigger / Client */}
                      <td>
                        <span className="td-usage-client-name">
                          {item.clientName || "—"}
                        </span>
                      </td>

                      {/* Owner */}
                      <td>
                        <div className="td-usage-owner-wrap">
                          <div className="td-usage-owner-avatar">
                            {item.owner.avatarUrl ? (
                              <img
                                src={item.owner.avatarUrl}
                                alt={item.owner.name}
                              />
                            ) : (
                              item.owner.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <span className="td-usage-owner-name">
                            {item.owner.name}
                          </span>
                        </div>
                      </td>

                      {/* Created On */}
                      <td>
                        <div className="td-usage-datetime-col">
                          <span className="td-usage-date-val">
                            {formatDate(item.createdAt)}
                          </span>
                          <span className="td-usage-time-val">
                            {formatTime(item.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Template Version */}
                      <td>
                        <span className="td-usage-pill-version">
                          {item.templateVersion}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`td-usage-pill-status ${item.status}`}
                        >
                          {item.displayStatus}
                        </span>
                      </td>

                      {/* Progress */}
                      <td>
                        <div className="td-usage-progress-cell">
                          <div className="td-usage-progress-track">
                            <div
                              className="td-usage-progress-bar"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="td-usage-progress-pct">
                            {item.progress}%
                          </span>
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td>
                        <span className="td-usage-date-val">
                          {formatDate(item.updatedAt)}
                        </span>
                      </td>

                      {/* Usage Source */}
                      <td>
                        <span className="td-usage-date-val" style={{ color: "#64748B" }}>
                          {item.usageSource}
                        </span>
                      </td>

                      {/* Modifications */}
                      <td>
                        <span
                          className={`td-usage-pill-mod ${item.modifications.toLowerCase()}`}
                        >
                          {item.modifications}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="center" style={{ position: "relative" }}>
                        <button
                          type="button"
                          className="td-usage-action-btn"
                          title="View project"
                          aria-label={`View project ${item.projectName}`}
                          onClick={() => router.push(`/projects/${item.projectId}`)}
                        >
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Row (Frame 2147225166) */}
            <div className="td-usage-pagination-row">
              <span className="td-usage-pagination-total">
                Total Projects: {total}
              </span>

              {/* Numbered Page Buttons */}
              <div className="td-usage-pagination-btns">
                <button
                  type="button"
                  className="td-usage-pagination-btn"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const hasGap = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {hasGap && <span style={{ padding: "0 4px", color: "#64748B" }}>...</span>}
                        <button
                          type="button"
                          className={`td-usage-pagination-btn ${page === p ? "active" : ""}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  className="td-usage-pagination-btn"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>

              {/* Show per page */}
              <div className="td-usage-per-page-wrap">
                <span className="td-usage-per-page-label">Show per Page:</span>
                <select
                  className="td-usage-per-page-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  aria-label="Items per page"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ====================================================================
          Custom Date Range Modal
          ==================================================================== */}
      {isCustomModalOpen && (
        <div className="td-usage-modal-overlay">
          <div className="td-usage-custom-date-modal">
            <h4 className="td-usage-modal-title">Select Custom Date Range</h4>

            <div className="td-usage-modal-row">
              <label htmlFor="custom-from-date">Start Date</label>
              <input
                id="custom-from-date"
                type="date"
                className="td-usage-modal-input"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>

            <div className="td-usage-modal-row">
              <label htmlFor="custom-to-date">End Date</label>
              <input
                id="custom-to-date"
                type="date"
                className="td-usage-modal-input"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>

            {customDateError && (
              <p className="td-usage-modal-error">{customDateError}</p>
            )}

            <div className="td-usage-modal-btns">
              <button
                type="button"
                className="td-usage-filter-btn-clear"
                onClick={() => {
                  setIsCustomModalOpen(false);
                  setCustomDateError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="td-usage-primary-btn"
                style={{ marginTop: 0 }}
                onClick={handleApplyCustomDate}
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
