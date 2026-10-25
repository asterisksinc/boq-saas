"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Calendar,
  Upload,
  MoreVertical,
  X,
  ChevronDown,
  CreditCard,
  GitBranch,
  FileText,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  getTemplateActivity,
  TemplateActivityRecord,
  TemplateActivityResponse,
  TemplateActivityChangeItem,
} from "@/lib/api/templates";

interface TemplateActivityProps {
  templateId: string;
}

export default function TemplateActivity({ templateId }: TemplateActivityProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<TemplateActivityResponse | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [dateRange, setDateRange] = useState("all");

  // Selection for Side Panel (Screen 2)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  // Dropdown states
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Search debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Activity Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTemplateActivity(templateId, {
        search: debouncedSearch,
        category,
        sort,
        dateRange,
      });
      setActivityData(res);

      // If currently selected activity is not in new items, keep it if it exists in response
      if (selectedActivityId && res.items) {
        const found = res.items.find((item) => item.id === selectedActivityId);
        if (!found) {
          // Keep it if it matches, else keep selection or clear
        }
      }
    } catch (err: any) {
      console.error("Failed to load template activity:", err);
      setError(err?.message || "Failed to load activity feed.");
    } finally {
      setLoading(false);
    }
  }, [templateId, debouncedSearch, category, sort, dateRange, selectedActivityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export CSV handler
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const q = new URLSearchParams({ export: "csv" });
      if (debouncedSearch) q.set("search", debouncedSearch);
      if (category !== "all") q.set("category", category);
      if (sort) q.set("sort", sort);
      if (dateRange !== "all") q.set("dateRange", dateRange);

      const url = `/api/v1/project-templates/${templateId}/activity?${q.toString()}`;
      window.open(url, "_blank");
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  // Find currently selected activity item
  const selectedActivity = useMemo(() => {
    if (!selectedActivityId || !activityData?.items) return null;
    return activityData.items.find((item) => item.id === selectedActivityId) || null;
  }, [selectedActivityId, activityData]);

  // Helper for rendering Change Icon in Side Panel
  const renderChangeIcon = (iconName: string) => {
    switch (iconName) {
      case "payment_card":
        return <CreditCard size={14} />;
      case "arrow_split":
        return <GitBranch size={14} />;
      case "docs":
        return <FileText size={14} />;
      case "data_table":
      default:
        return <Layers size={14} />;
    }
  };

  const stats = activityData?.stats || {
    totalEvents: 284,
    changesThisWeek: 18,
    contributors: 7,
    publishedChanges: 4,
  };

  return (
    <div className="td-act-container" data-testid="template-activity-container">
      {/* 1. Header & Toolbar */}
      <div className="td-act-header-row" data-testid="template-activity-header">
        <div className="td-act-header-left">
          <h2 className="td-act-title">Activity</h2>
          <p className="td-act-subtitle">
            Track changes actions, approvals, publishing events, and usage activity associated with this template.
          </p>
        </div>

        <div className="td-act-toolbar" data-testid="template-activity-toolbar">
          {/* Search Box */}
          <div className="td-act-search-box">
            <div className="td-act-search-icon-box">
              <Search size={16} />
            </div>
            <input
              type="text"
              className="td-act-search-input"
              placeholder="Search activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search activity"
              data-testid="activity-search-input"
            />
            {search && (
              <button
                type="button"
                className="td-act-close-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                style={{ width: 20, height: 20 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className={`td-act-toolbar-btn ${category !== "all" ? "active" : ""}`}
              onClick={() => {
                setShowFilterDropdown(!showFilterDropdown);
                setShowDateDropdown(false);
                setShowSortDropdown(false);
              }}
              data-testid="activity-filter-btn"
            >
              <Filter size={16} />
              <span>Filter</span>
            </button>
            {showFilterDropdown && (
              <div className="td-act-dropdown-menu" data-testid="filter-dropdown-menu">
                {["all", "changes", "publishing", "usage", "access", "system"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`td-act-dropdown-item ${category === cat ? "active" : ""}`}
                    onClick={() => {
                      setCategory(cat);
                      setShowFilterDropdown(false);
                    }}
                  >
                    <span style={{ textTransform: "capitalize" }}>{cat}</span>
                    {category === cat && <CheckCircle2 size={14} color="#2563EB" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Button */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className={`td-act-toolbar-btn ${dateRange !== "all" ? "active" : ""}`}
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setShowFilterDropdown(false);
                setShowSortDropdown(false);
              }}
              data-testid="activity-date-btn"
            >
              <Calendar size={16} />
              <span>{dateRange === "all" ? "Date" : dateRange.toUpperCase()}</span>
            </button>
            {showDateDropdown && (
              <div className="td-act-dropdown-menu" data-testid="date-dropdown-menu">
                {[
                  { id: "all", label: "All Dates" },
                  { id: "today", label: "Today" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "7d", label: "Last 7 Days" },
                  { id: "30d", label: "Last 30 Days" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`td-act-dropdown-item ${dateRange === item.id ? "active" : ""}`}
                    onClick={() => {
                      setDateRange(item.id);
                      setShowDateDropdown(false);
                    }}
                  >
                    <span>{item.label}</span>
                    {dateRange === item.id && <CheckCircle2 size={14} color="#2563EB" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            type="button"
            className="td-act-toolbar-btn"
            onClick={handleExportCsv}
            disabled={exporting}
            data-testid="activity-export-btn"
          >
            <Upload size={16} />
            <span>{exporting ? "Exporting..." : "Export"}</span>
          </button>

          {/* More Options Button */}
          <button
            type="button"
            className="td-act-toolbar-btn td-act-icon-btn"
            aria-label="More options"
            onClick={() => {
              // Quick reset all filters
              setSearch("");
              setCategory("all");
              setDateRange("all");
              setSort("newest");
            }}
            title="Reset filters"
            data-testid="activity-more-btn"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="td-act-kpi-grid" data-testid="activity-kpi-grid">
        {/* Card 1: Total Events */}
        <div className="td-act-kpi-card" data-testid="kpi-total-events">
          <div className="td-act-kpi-label">Total Events</div>
          <div className="td-act-kpi-value-row">
            <span className="td-act-kpi-value">{stats.totalEvents}</span>
            <span className="td-act-kpi-subtext">All Time</span>
          </div>
        </div>

        {/* Card 2: Changes This Week */}
        <div className="td-act-kpi-card" data-testid="kpi-changes-week">
          <div className="td-act-kpi-label">Changes This Week</div>
          <div className="td-act-kpi-value-row">
            <span className="td-act-kpi-value">{stats.changesThisWeek}</span>
            <span className="td-act-kpi-subtext">Last 7 Days</span>
          </div>
        </div>

        {/* Card 3: Contributors */}
        <div className="td-act-kpi-card" data-testid="kpi-contributors">
          <div className="td-act-kpi-label">Contributors</div>
          <div className="td-act-kpi-value-row">
            <span className="td-act-kpi-value">{stats.contributors}</span>
            <span className="td-act-kpi-subtext">Unique Users</span>
          </div>
        </div>

        {/* Card 4: Published Changes */}
        <div className="td-act-kpi-card" data-testid="kpi-published-changes">
          <div className="td-act-kpi-label">Published Changes</div>
          <div className="td-act-kpi-value-row">
            <span className="td-act-kpi-value">{stats.publishedChanges}</span>
            <span className="td-act-kpi-subtext">Last 30 Days</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs Bar & Sort */}
      <div className="td-act-tabs-row" data-testid="activity-tabs-row">
        {/* Segmented Control */}
        <div className="td-act-segmented-control" data-testid="activity-segmented-control">
          {[
            { id: "all", label: "All" },
            { id: "changes", label: "Changes" },
            { id: "publishing", label: "Publishing" },
            { id: "usage", label: "Usage" },
            { id: "access", label: "Access" },
            { id: "system", label: "System" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`td-act-seg-btn ${category === tab.id ? "active" : ""}`}
              onClick={() => setCategory(tab.id)}
              data-testid={`activity-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="td-act-sort-btn"
            onClick={() => {
              setShowSortDropdown(!showSortDropdown);
              setShowDateDropdown(false);
              setShowFilterDropdown(false);
            }}
            data-testid="activity-sort-btn"
          >
            <span>Sort: {sort === "newest" ? "Newest First" : "Oldest First"}</span>
            <ChevronDown size={16} />
          </button>
          {showSortDropdown && (
            <div className="td-act-dropdown-menu" data-testid="sort-dropdown-menu">
              <button
                type="button"
                className={`td-act-dropdown-item ${sort === "newest" ? "active" : ""}`}
                onClick={() => {
                  setSort("newest");
                  setShowSortDropdown(false);
                }}
              >
                <span>Newest First</span>
                {sort === "newest" && <CheckCircle2 size={14} color="#2563EB" />}
              </button>
              <button
                type="button"
                className={`td-act-dropdown-item ${sort === "oldest" ? "active" : ""}`}
                onClick={() => {
                  setSort("oldest");
                  setShowSortDropdown(false);
                }}
              >
                <span>Oldest First</span>
                {sort === "oldest" && <CheckCircle2 size={14} color="#2563EB" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Split Layout: Timeline Container + Side Panel */}
      <div className="td-act-content-row" data-testid="activity-content-row">
        {/* Timeline Container (Left column) */}
        <div
          className="td-act-timeline-container"
          style={{ width: selectedActivity ? "calc(100% - 334px)" : "100%" }}
          data-testid="activity-timeline-container"
        >
          {loading && <div className="td-act-loading">Loading template activity...</div>}

          {error && <div className="td-act-empty">{error}</div>}

          {!loading && (!activityData?.groups || activityData.groups.length === 0) && (
            <div className="td-act-empty">No activity records match your current filter.</div>
          )}

          {!loading &&
            activityData?.groups?.map((group) => (
              <div key={group.label} className="td-act-group-section" data-testid={`activity-group-${group.label.toLowerCase()}`}>
                {/* Date Divider Header */}
                <div className="td-act-group-header">{group.label}</div>

                {/* Timeline Event Rows */}
                <div className="td-act-group-list">
                  {group.items.map((item) => {
                    const isSelected = selectedActivityId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`td-act-item-row ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedActivityId(isSelected ? null : item.id)}
                        data-testid={`activity-item-${item.id}`}
                      >
                        {/* 1. Time */}
                        <div className="td-act-col-time">{item.timeLabel}</div>

                        {/* 2. Track & Indicator Dot */}
                        <div className="td-act-col-track">
                          <div className={`td-act-track-dot ${item.markerColor}`}>
                            <div className="inner" />
                          </div>
                          <div className="td-act-track-line" />
                        </div>

                        {/* 3. Actor Info */}
                        <div className="td-act-col-actor">
                          <div className="td-act-actor-avatar">
                            {item.actor.avatar ? (
                              <img src={item.actor.avatar} alt={item.actor.name} />
                            ) : (
                              <span>{item.actor.initials}</span>
                            )}
                          </div>
                          <div className="td-act-actor-info">
                            <span className="td-act-actor-name" title={item.actor.name}>
                              {item.actor.name}
                            </span>
                            <span className="td-act-actor-role" title={item.actor.role}>
                              {item.actor.role}
                            </span>
                          </div>
                        </div>

                        {/* 4. Event Content */}
                        <div className="td-act-col-content">
                          <div className="td-act-event-title">{item.title}</div>
                          {item.description && (
                            <div className="td-act-event-desc">{item.description}</div>
                          )}

                          {/* Costing Diff Box */}
                          {item.diff && (
                            <div className="td-act-diff-box">
                              {item.diff.rateSource && (
                                <div className="td-act-diff-line">{item.diff.rateSource}</div>
                              )}
                              {item.diff.rateValue && (
                                <div className="td-act-diff-val">{item.diff.rateValue}</div>
                              )}
                            </div>
                          )}

                          {/* Context Action Link */}
                          {item.actionLink && (
                            <a
                              href={item.actionLink.href}
                              className="td-act-event-link"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.actionLink.href.startsWith("/")) {
                                  e.preventDefault();
                                  router.push(item.actionLink.href);
                                }
                              }}
                            >
                              <span>{item.actionLink.label}</span>
                              <ArrowRight size={12} />
                            </a>
                          )}
                        </div>

                        {/* 5. Scope Badges */}
                        <div className="td-act-col-badges">
                          {item.scopeBadges?.map((badge, bIdx) => (
                            <span
                              key={bIdx}
                              className={badge.type === "category" ? "td-act-scope-pill" : "td-act-sub-pill"}
                            >
                              {badge.label}
                            </span>
                          ))}
                        </div>

                        {/* 6. More Options */}
                        <div className="td-act-col-action">
                          <button
                            type="button"
                            className="td-act-more-btn"
                            aria-label="Activity item options"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedActivityId(item.id);
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* 5. Screen 2: Activity Details Side Panel (Right column) */}
        {selectedActivity && (
          <aside className="td-act-side-panel" data-testid="activity-side-panel">
            {/* Panel Header */}
            <div className="td-act-panel-header">
              <div className="td-act-panel-title-group">
                <span className="td-act-panel-label">Activity Details</span>
                <span className={`td-act-status-pill ${selectedActivity.statusPillType}`}>
                  {selectedActivity.statusPill}
                </span>
              </div>
              <button
                type="button"
                className="td-act-close-btn"
                aria-label="Close activity details"
                onClick={() => setSelectedActivityId(null)}
                data-testid="close-side-panel-btn"
              >
                <X size={16} />
              </button>
            </div>

            {/* Actor Card */}
            <div className="td-act-actor-card">
              <div className="td-act-actor-avatar" style={{ width: 36, height: 36 }}>
                {selectedActivity.actor.avatar ? (
                  <img src={selectedActivity.actor.avatar} alt={selectedActivity.actor.name} />
                ) : (
                  <span>{selectedActivity.actor.initials}</span>
                )}
              </div>
              <div className="td-act-actor-meta">
                <span className="td-act-actor-name" style={{ fontSize: 14, fontWeight: 600 }}>
                  {selectedActivity.actor.name}
                </span>
                <span className="td-act-actor-role">{selectedActivity.actor.role}</span>
                <span className="td-act-actor-time">
                  {new Date(selectedActivity.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  • {selectedActivity.timeLabel} IST
                </span>
              </div>
            </div>

            {/* Action Transition Columns */}
            <div className="td-act-transition-grid" data-testid="activity-transition-grid">
              <div className="td-act-transition-col">
                <span className="td-act-trans-label">Action</span>
                <span className="td-act-trans-val" title={selectedActivity.details.action}>
                  {selectedActivity.details.action}
                </span>
              </div>
              <div className="td-act-transition-col">
                <span className="td-act-trans-label">Previous</span>
                <span className="td-act-trans-val" title={selectedActivity.details.previous}>
                  {selectedActivity.details.previous}
                </span>
              </div>
              <div className="td-act-transition-col">
                <span className="td-act-trans-label">New</span>
                <span className="td-act-trans-val" title={selectedActivity.details.newVal}>
                  {selectedActivity.details.newVal}
                </span>
              </div>
            </div>

            {/* Changes Included Inner Card */}
            {selectedActivity.details.changesIncluded && selectedActivity.details.changesIncluded.length > 0 && (
              <div className="td-act-changes-card" data-testid="activity-changes-card">
                <div className="td-act-changes-card-title">Changes Included</div>
                <div className="td-act-changes-list">
                  {selectedActivity.details.changesIncluded.map((ch: TemplateActivityChangeItem, idx: number) => (
                    <div key={idx} className="td-act-changes-item">
                      <div className="td-act-change-icon-wrap">
                        {renderChangeIcon(ch.icon)}
                      </div>
                      <span>
                        {ch.count} {ch.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reason Block */}
            {selectedActivity.details.reason && (
              <div className="td-act-info-block">
                <div className="td-act-info-header">Reason</div>
                <div className="td-act-info-text">{selectedActivity.details.reason}</div>
              </div>
            )}

            {/* Version Block */}
            <div className="td-act-info-block">
              <div className="td-act-info-header">Version</div>
              <div className="td-act-version-row">
                <span className="td-act-version-tag">{selectedActivity.details.versionLabel}</span>
                <a
                  href={`/templates/${templateId}?tab=Versions`}
                  className="td-act-version-link"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/templates/${templateId}?tab=Versions`);
                  }}
                >
                  View Version
                </a>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
