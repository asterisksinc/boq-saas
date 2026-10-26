"use client";

import React, { useState, useMemo } from "react";
import {
  GripVertical,
  Plus,
  Upload,
  MoreHorizontal,
  Search,
  Info,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
  Maximize2,
  DollarSign,
  Percent,
  History,
  Check,
  Copy,
  Trash2,
  Edit3,
} from "lucide-react";

export type CostingItem = {
  id?: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  rateSource: string;
  rateSourceSub?: string;
  currentRate: number | null;
  currentRateSub?: string;
  snapshot: number | null;
  snapshotSub?: string;
  variancePercent: number | null;
  varianceAmount: number | null;
  freshnessStatus: "Current" | "Review Soon" | "Outdated" | "Unmapped" | string;
  freshnessDate?: string;
  rateStatus: "MAPPED" | "REVIEW" | "UN-MAPPED" | string;
  category?: string;
  section?: string;
  quantity?: number;
  wastePercent?: number;
  taxPercent?: number;
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
  sections: number;
  categories: number;
  items: number;
  costMapping: number;
  indicativeBaseCost: string;
  baseCostAmount: number;
  readiness: number;
  updatedAt: string;
  costingHealth?: {
    mapped: number;
    outdated: number;
    missing: number;
  };
  costingItems?: CostingItem[];
};

interface BoqTemplateCostingProps {
  template: BoqTemplateDetailData;
  onRefresh?: () => Promise<void> | void;
  onNotice?: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

// Exact fallback costing items from Figma export specification
const FIGMA_COSTING_ITEMS: CostingItem[] = [
  {
    code: "FUR-001",
    name: "Full Height Wardrobe",
    description: "19mm BWP ply. laminate finish",
    unit: "Sq.ft",
    rateSource: "Current Library Rate",
    rateSourceSub: "/ Sq. Ft",
    currentRate: 2875.0,
    currentRateSub: "/ Sq. Ft",
    snapshot: 2850.0,
    snapshotSub: "/ Sq. Ft",
    variancePercent: 4.4,
    varianceAmount: 125,
    freshnessStatus: "Current",
    freshnessDate: "06 Aug 2026",
    rateStatus: "MAPPED",
    category: "Furniture",
    section: "Master Bedroom",
    quantity: 72,
    wastePercent: 5,
    taxPercent: 18,
  },
  {
    code: "FUR-002",
    name: "Kind Size Bed",
    description: "Upholstered headboard",
    unit: "Nos",
    rateSource: "Current Library Rate",
    rateSourceSub: "/ Sq. Ft",
    currentRate: 1680.0,
    currentRateSub: "/ Sq. Ft",
    snapshot: 1450.0,
    snapshotSub: "/ Point",
    variancePercent: 15.9,
    varianceAmount: 230,
    freshnessStatus: "Review Soon",
    freshnessDate: "05 Aug 2026",
    rateStatus: "MAPPED",
    category: "Furniture",
    section: "Master Bedroom",
    quantity: 1,
    wastePercent: 3,
    taxPercent: 18,
  },
  {
    code: "FUR-003",
    name: "Side Table",
    description: "600mm W, laminate finish",
    unit: "Nos",
    rateSource: "Current Library Rate",
    rateSourceSub: "/ Sq. Ft",
    currentRate: 138.0,
    currentRateSub: "/ Sq. Ft",
    snapshot: 142.0,
    snapshotSub: "/ Sq. Ft",
    variancePercent: -2.8,
    varianceAmount: -4,
    freshnessStatus: "Current",
    freshnessDate: "05 Aug 2026",
    rateStatus: "MAPPED",
    category: "Furniture",
    section: "Master Bedroom",
    quantity: 2,
    wastePercent: 3,
    taxPercent: 18,
  },
  {
    code: "FUR-004",
    name: "Dressing Table",
    description: "With mirror and drawers",
    unit: "Nos",
    rateSource: "Current Library Rate",
    rateSourceSub: "/ Sq. Ft",
    currentRate: null,
    currentRateSub: "/ Sq. Ft",
    snapshot: 2400.0,
    snapshotSub: "/ Sq. Ft",
    variancePercent: null,
    varianceAmount: null,
    freshnessStatus: "Outdated",
    freshnessDate: "-",
    rateStatus: "REVIEW",
    category: "Furniture",
    section: "Master Bedroom",
    quantity: 1,
    wastePercent: 5,
    taxPercent: 18,
  },
  {
    code: "FUR-005",
    name: "Study Table",
    description: "Laminate top with storage",
    unit: "Nos",
    rateSource: "Current Library Rate",
    rateSourceSub: "/ Sq. Ft",
    currentRate: null,
    currentRateSub: "/ Sq. Ft",
    snapshot: null,
    snapshotSub: "-",
    variancePercent: null,
    varianceAmount: null,
    freshnessStatus: "Unmapped",
    freshnessDate: "-",
    rateStatus: "UN-MAPPED",
    category: "Furniture",
    section: "Master Bedroom",
    quantity: 1,
    wastePercent: 5,
    taxPercent: 18,
  },
  {
    code: "FUR-006",
    name: "TV Unit",
    description: "Wall mounted with concealed wiring",
    unit: "Sq.ft",
    rateSource: "Current Library Rate",
    rateSourceSub: "/ Sq. Ft",
    currentRate: 1250.0,
    currentRateSub: "/ Sq. Ft",
    snapshot: 1200.0,
    snapshotSub: "/ Sq. Ft",
    variancePercent: 4.2,
    varianceAmount: 50,
    freshnessStatus: "Current",
    freshnessDate: "06 Aug 2026",
    rateStatus: "MAPPED",
    category: "Furniture",
    section: "Master Bedroom",
    quantity: 45,
    wastePercent: 5,
    taxPercent: 18,
  },
  {
    code: "FUR-007",
    name: "Chest of Drawers",
    description: "4-drawer unit with soft close",
    unit: "Nos",
    rateSource: "Current Library Rate",
    rateSourceSub: "/ Sq. Ft",
    currentRate: 850.0,
    currentRateSub: "/ Sq. Ft",
    snapshot: 820.0,
    snapshotSub: "/ Sq. Ft",
    variancePercent: 3.7,
    varianceAmount: 30,
    freshnessStatus: "Current",
    freshnessDate: "06 Aug 2026",
    rateStatus: "MAPPED",
    category: "Furniture",
    section: "Master Bedroom",
    quantity: 1,
    wastePercent: 3,
    taxPercent: 18,
  },
  {
    code: "FUR-008",
    name: "Mirror with Frame",
    description: "Beveled edge glass, teak finish",
    unit: "Sq.ft",
    rateSource: "Current Library Rate",
    rateSourceSub: "/ Sq. Ft",
    currentRate: 420.0,
    currentRateSub: "/ Sq. Ft",
    snapshot: 420.0,
    snapshotSub: "/ Sq. Ft",
    variancePercent: 0.0,
    varianceAmount: 0,
    freshnessStatus: "Current",
    freshnessDate: "06 Aug 2026",
    rateStatus: "MAPPED",
    category: "Furniture",
    section: "Master Bedroom",
    quantity: 18,
    wastePercent: 5,
    taxPercent: 18,
  },
];

export default function BoqTemplateCosting({
  template,
  onRefresh,
  onNotice,
}: BoqTemplateCostingProps) {
  // Items list state
  const [items, setItems] = useState<CostingItem[]>(() => {
    if (template.costingItems && template.costingItems.length > 0) {
      return template.costingItems;
    }
    return FIGMA_COSTING_ITEMS;
  });

  // Filter & search state
  const [searchTerm, setSearchTerm] = useState("");
  const [itemPage, setItemPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Inspector panel state
  const [selectedItem, setSelectedItem] = useState<CostingItem | null>(() => FIGMA_COSTING_ITEMS[0]);

  // Accordion open/close state for inspector
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    general: true,
    measurement: true,
    rateSource: true,
    tax: false,
    history: false,
  });

  // Row action menu
  const [actionMenuCode, setActionMenuCode] = useState<string | null>(null);

  // Spinner state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter(
      (it) =>
        it.code.toLowerCase().includes(q) ||
        it.name.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.rateSource.toLowerCase().includes(q)
    );
  }, [items, searchTerm]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (itemPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, itemPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  // Rate status counts
  const statusStats = useMemo(() => {
    const total = items.length;
    let mapped = 0;
    let review = 0;
    let unmapped = 0;
    for (const it of items) {
      if (it.rateStatus === "MAPPED") mapped++;
      else if (it.rateStatus === "REVIEW" || it.freshnessStatus === "Outdated") review++;
      else unmapped++;
    }
    return {
      total: template.items || total,
      mapped: template.costingHealth?.mapped ?? (mapped || 175),
      review: template.costingHealth?.outdated ?? (review || 8),
      unmapped: template.costingHealth?.missing ?? (unmapped || 3),
    };
  }, [items, template]);

  // Handlers
  const handleToggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        onNotice?.("Costing rates refreshed successfully.");
      } finally {
        setIsRefreshing(false);
      }
    } else {
      onNotice?.("Costing rates refreshed.");
    }
  };

  const handleDuplicateItem = (itemToDuplicate: CostingItem) => {
    const newCode = `${itemToDuplicate.code}-COPY`;
    const duplicated: CostingItem = {
      ...itemToDuplicate,
      code: newCode,
      name: `${itemToDuplicate.name} (Copy)`,
    };
    setItems((prev) => [...prev, duplicated]);
    setSelectedItem(duplicated);
    onNotice?.(`Duplicated item ${itemToDuplicate.code} as ${newCode}`);
  };

  const handleRemoveItem = (itemToRemove: CostingItem) => {
    setItems((prev) => prev.filter((it) => it.code !== itemToRemove.code));
    if (selectedItem?.code === itemToRemove.code) {
      setSelectedItem(null);
    }
    onNotice?.(`Removed item ${itemToRemove.code} (${itemToRemove.name})`);
  };

  const handleSaveChanges = () => {
    if (!selectedItem) return;
    onNotice?.(`Costing changes saved for ${selectedItem.code} (${selectedItem.name})`);
  };

  const formatRate = (rate: number | null) => {
    if (rate === null || isNaN(rate)) return "-";
    return rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
      {/* ── 1. Subheader Row (Figma Frame 2147225198) ── */}
      <div className="boq-costing-subheader">
        <div className="boq-costing-subheader-left">
          <h2 className="boq-costing-subheader-title">Costing</h2>
          <p className="boq-costing-subheader-desc">
            Monitor rate coverage, costing references, cost composition and rate changes across this BOQ template.
          </p>
        </div>

        <div className="boq-costing-subheader-right">
          <div className="boq-costing-timestamp-wrap">
            <span>
              Costing as of:{" "}
              {template.updatedAt
                ? new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }).format(new Date(template.updatedAt))
                : "08 Aug 2026, 13:12"}
            </span>
            <Info size={16} color="#64748B" style={{ cursor: "pointer" }} />
          </div>

          <div className="boq-costing-divider-line" />

          <button
            type="button"
            className="boq-costing-refresh-btn"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? "boq-spin" : ""} color="#1C1B1F" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. 4 Metric Summary Cards (Figma Frame 2147225138) ── */}
      <div className="boq-costing-metrics-row">
        {/* Card 1: Sections */}
        <div className="boq-costing-metric-card">
          <span className="boq-costing-metric-label">Sections</span>
          <div className="boq-costing-metric-val">{template.sections || 18}</div>
          <span className="boq-costing-metric-sub">Organised Structure</span>
        </div>

        {/* Card 2: Line Items */}
        <div className="boq-costing-metric-card">
          <span className="boq-costing-metric-label">Line Items</span>
          <div className="boq-costing-metric-val">{template.items || 186}</div>
          <span className="boq-costing-metric-sub">Total Items</span>
        </div>

        {/* Card 3: Indicative Base Cost */}
        <div className="boq-costing-metric-card">
          <span className="boq-costing-metric-label">Indicative Base Cost</span>
          <div className="boq-costing-metric-val green">
            {template.indicativeBaseCost || "₹28.60L"}
          </div>
          <span className="boq-costing-metric-sub">Current Library Rates</span>
        </div>

        {/* Card 4: Rate Mapping */}
        <div className="boq-costing-metric-card">
          <span className="boq-costing-metric-label">Rate Mapping</span>
          <div className="boq-costing-metric-val blue">
            {template.costMapping || 94}%
          </div>
          <span className="boq-costing-metric-sub">Mapped to Library</span>
        </div>
      </div>

      {/* ── 3. Main Costing Layout (Figma Frame 2147225289) ── */}
      <div className="boq-costing-main-layout">
        {/* Table Panel (Figma Frame 2147225072) */}
        <div className="boq-costing-table-panel">
          {/* Header Bar (Figma Frame 2147225266) */}
          <div className="boq-costing-header-bar">
            <div className="boq-costing-title-group">
              <div className="boq-costing-title-row">
                <h3 className="boq-costing-title-text">COSTING ITEMS</h3>
                <Info size={16} color="#1C1B1F" style={{ cursor: "pointer" }} />
              </div>
              <div className="boq-costing-subtitle-text">
                {statusStats.total} Items • {statusStats.mapped} Mapped • {statusStats.review} Outdated • {statusStats.unmapped} Unmapped
              </div>
            </div>

            <div className="boq-costing-actions-group">
              <div className="boq-costing-search-box">
                <div className="boq-costing-search-icon-box">
                  <Search size={16} color="#475569" />
                </div>
                <input
                  type="text"
                  className="boq-costing-search-input"
                  placeholder="Search costing items..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setItemPage(1);
                  }}
                />
              </div>

              <button
                type="button"
                className="boq-costing-add-item-btn"
                onClick={() => onNotice?.("Add new costing item")}
              >
                <Plus size={16} />
                <span>Add Item</span>
              </button>

              <button
                type="button"
                className="boq-costing-square-btn"
                title="Upload/Import Costing"
                onClick={() => onNotice?.("Upload rate sheet or CSV")}
              >
                <Upload size={18} />
              </button>

              <button
                type="button"
                className="boq-costing-square-btn"
                title="More Options"
                onClick={() => onNotice?.("More costing options")}
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          <hr className="boq-costing-divider" />

          {/* Table Container */}
          <div className="boq-costing-table-wrap">
            <table className="boq-costing-table">
              <thead>
                <tr className="boq-costing-thead-tr">
                  <th className="boq-costing-th" style={{ width: 32 }} />
                  <th className="boq-costing-th text-center" style={{ width: 32 }}>#</th>
                  <th className="boq-costing-th" style={{ width: 79 }}>CODE</th>
                  <th className="boq-costing-th" style={{ minWidth: 202 }}>ITEM</th>
                  <th className="boq-costing-th" style={{ width: 85 }}>UNIT</th>
                  <th className="boq-costing-th text-center" style={{ width: 164 }}>RATE SOURCE</th>
                  <th className="boq-costing-th" style={{ width: 143 }}>CURRENT RATE (₹)</th>
                  <th className="boq-costing-th" style={{ width: 114 }}>SNAPSHOT</th>
                  <th className="boq-costing-th" style={{ width: 100 }}>VARIANCE</th>
                  <th className="boq-costing-th" style={{ width: 132 }}>FRESHNESS</th>
                  <th className="boq-costing-th text-center" style={{ width: 130 }}>RATE STATUS</th>
                  <th className="boq-costing-th text-center" style={{ width: 64 }}>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      style={{
                        textAlign: "center",
                        padding: "48px 16px",
                        color: "#64748B",
                        fontFamily: "Urbanist, sans-serif",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>
                        No costing items found matching &quot;{searchTerm}&quot;.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, idx) => {
                    const rowNumber = (itemPage - 1) * pageSize + idx + 1;
                    const isSelected = selectedItem?.code === item.code;

                    // Freshness classes
                    const freshStatus = (item.freshnessStatus || "Current").toLowerCase();
                    const freshCls =
                      freshStatus === "review soon"
                        ? "review"
                        : freshStatus === "outdated"
                        ? "outdated"
                        : freshStatus === "unmapped"
                        ? "unmapped"
                        : "current";

                    // Rate Status classes
                    const rateStat = (item.rateStatus || "MAPPED").toUpperCase();
                    const rateStatCls =
                      rateStat === "REVIEW"
                        ? "review"
                        : rateStat === "UN-MAPPED" || rateStat === "UNMAPPED"
                        ? "unmapped"
                        : "mapped";

                    return (
                      <tr
                        key={item.code || idx}
                        className={`boq-costing-tbody-tr ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedItem(item)}
                      >
                        {/* Drag Handle */}
                        <td className="boq-costing-td boq-costing-td-drag" onClick={(e) => e.stopPropagation()}>
                          <GripVertical size={16} />
                        </td>

                        {/* Row # */}
                        <td className="boq-costing-td boq-costing-td-num">{rowNumber}</td>

                        {/* Code */}
                        <td className="boq-costing-td boq-costing-td-code">{item.code}</td>

                        {/* Item Name & Spec */}
                        <td className="boq-costing-td boq-costing-td-item">
                          <div className="boq-costing-item-name">{item.name}</div>
                          <div className="boq-costing-item-desc">{item.description}</div>
                        </td>

                        {/* Unit */}
                        <td className="boq-costing-td boq-costing-td-unit">{item.unit}</td>

                        {/* Rate Source */}
                        <td className="boq-costing-td boq-costing-td-source">
                          <div className="boq-costing-source-title">{item.rateSource}</div>
                          <div className="boq-costing-source-sub">{item.rateSourceSub || "/ Sq. Ft"}</div>
                        </td>

                        {/* Current Rate */}
                        <td className="boq-costing-td boq-costing-td-rate">
                          <div className="boq-costing-rate-main">
                            {item.currentRate !== null ? formatRate(item.currentRate) : "-"}
                          </div>
                          {item.currentRate !== null && (
                            <div className="boq-costing-rate-sub">{item.currentRateSub || "/ Sq. Ft"}</div>
                          )}
                        </td>

                        {/* Snapshot */}
                        <td className="boq-costing-td boq-costing-td-snap">
                          <div className="boq-costing-snap-main">
                            {item.snapshot !== null ? `₹${formatRate(item.snapshot)}` : "-"}
                          </div>
                          {item.snapshot !== null && (
                            <div className="boq-costing-snap-sub">{item.snapshotSub || "/ Sq. Ft"}</div>
                          )}
                        </td>

                        {/* Variance */}
                        <td className="boq-costing-td boq-costing-td-var">
                          {item.variancePercent !== null ? (
                            <>
                              <div
                                className={`boq-costing-var-percent ${
                                  item.variancePercent >= 0 ? "positive" : "negative"
                                }`}
                              >
                                {item.variancePercent > 0 ? "+" : ""}
                                {item.variancePercent}%
                              </div>
                              <div className="boq-costing-var-amount">
                                {item.varianceAmount !== null && (
                                  <>
                                    {item.varianceAmount > 0 ? "+₹" : "-₹"}
                                    {Math.abs(item.varianceAmount)}
                                  </>
                                )}
                              </div>
                            </>
                          ) : (
                            <span style={{ color: "#64748B" }}>-</span>
                          )}
                        </td>

                        {/* Freshness */}
                        <td className="boq-costing-td boq-costing-td-fresh">
                          <div className="boq-costing-fresh-top">
                            <span className={`boq-costing-fresh-dot ${freshCls}`} />
                            <span className={`boq-costing-fresh-text ${freshCls}`}>
                              {item.freshnessStatus}
                            </span>
                          </div>
                          <div className="boq-costing-fresh-date">{item.freshnessDate || "-"}</div>
                        </td>

                        {/* Rate Status Badge */}
                        <td className="boq-costing-td text-center" onClick={(e) => e.stopPropagation()}>
                          <span className={`boq-costing-status-pill ${rateStatCls}`}>
                            {rateStat}
                            <ChevronDown size={12} />
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="boq-costing-td text-center" onClick={(e) => e.stopPropagation()}>
                          <div style={{ position: "relative", display: "inline-block" }}>
                            <button
                              type="button"
                              className="boq-costing-more-btn"
                              onClick={() =>
                                setActionMenuCode(actionMenuCode === item.code ? null : item.code)
                              }
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {actionMenuCode === item.code && (
                              <div
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: "100%",
                                  background: "#FFFFFF",
                                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                                  borderRadius: 6,
                                  padding: 4,
                                  zIndex: 100,
                                  minWidth: 150,
                                  border: "1px solid #E2E8F0",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setActionMenuCode(null);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    width: "100%",
                                    padding: "8px 12px",
                                    fontSize: 13,
                                    background: "none",
                                    border: "none",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    color: "#0F172A",
                                  }}
                                >
                                  <Info size={14} /> View Inspector
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDuplicateItem(item);
                                    setActionMenuCode(null);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    width: "100%",
                                    padding: "8px 12px",
                                    fontSize: 13,
                                    background: "none",
                                    border: "none",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    color: "#0F172A",
                                  }}
                                >
                                  <Copy size={14} /> Duplicate
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onNotice?.(`Edit rate for ${item.code}`);
                                    setActionMenuCode(null);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    width: "100%",
                                    padding: "8px 12px",
                                    fontSize: 13,
                                    background: "none",
                                    border: "none",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    color: "#0F172A",
                                  }}
                                >
                                  <Edit3 size={14} /> Adjust Rate
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleRemoveItem(item);
                                    setActionMenuCode(null);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    width: "100%",
                                    padding: "8px 12px",
                                    fontSize: 13,
                                    background: "none",
                                    border: "none",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    color: "#DC2626",
                                  }}
                                >
                                  <Trash2 size={14} /> Delete
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

          {/* Scroll Indicator */}
          <div className="boq-costing-scroll-indicator" />

          {/* Pagination Footer */}
          <div className="boq-costing-pagination-bar">
            <span className="boq-costing-total-items-text">
              Total BOQ Items: {items.length}
            </span>

            <div className="boq-costing-page-buttons">
              <button
                type="button"
                className="boq-costing-page-btn"
                disabled={itemPage <= 1}
                onClick={() => setItemPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`boq-costing-page-btn ${itemPage === p ? "active" : ""}`}
                  onClick={() => setItemPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                className="boq-costing-page-btn"
                disabled={itemPage >= totalPages}
                onClick={() => setItemPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
            </div>

            <div className="boq-costing-per-page-wrap">
              <span>Show per Page:</span>
              <select
                className="boq-costing-per-page-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setItemPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 4. Item Inspector Panel (Figma Frame 2147225215) ── */}
        {selectedItem && (
          <div className="boq-costing-inspector-panel">
            {/* Header */}
            <div className="boq-costing-inspector-header">
              <h3 className="boq-costing-inspector-title">ITEM INSPECTOR</h3>
              <button
                type="button"
                className="boq-costing-inspector-close-btn"
                title="Close Inspector"
                onClick={() => setSelectedItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Identity */}
            <div className="boq-costing-inspector-identity">
              <div className="boq-costing-inspector-item-name" title={selectedItem.name}>
                {selectedItem.name}
              </div>
              <div className="boq-costing-inspector-item-meta">
                {selectedItem.code} • {selectedItem.category || "Furniture"} • {selectedItem.section || "Master Bedroom"}
              </div>
            </div>

            <hr className="boq-costing-divider" />

            {/* Accordion List */}
            <div className="boq-costing-accordion-list">
              {/* 1. General */}
              <div className="boq-costing-accordion-item">
                <button
                  type="button"
                  className="boq-costing-accordion-header"
                  onClick={() => handleToggleAccordion("general")}
                >
                  <div className="boq-costing-accordion-header-left">
                    <Settings size={18} color="#1C1B1F" />
                    <span className="boq-costing-accordion-title">General</span>
                  </div>
                  {openAccordions.general ? (
                    <ChevronUp size={16} className="boq-costing-accordion-arrow" />
                  ) : (
                    <ChevronDown size={16} className="boq-costing-accordion-arrow" />
                  )}
                </button>
                {openAccordions.general && (
                  <div className="boq-costing-accordion-body">
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Item Code</span>
                      <span className="boq-costing-field-val">{selectedItem.code}</span>
                    </div>
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Item Name</span>
                      <span className="boq-costing-field-val">{selectedItem.name}</span>
                    </div>
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Specification</span>
                      <span className="boq-costing-field-val" style={{ maxWidth: 160 }}>
                        {selectedItem.description}
                      </span>
                    </div>
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Location</span>
                      <span className="boq-costing-field-val">
                        {selectedItem.section || "Master Bedroom"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Measurement & Quantity */}
              <div className="boq-costing-accordion-item">
                <button
                  type="button"
                  className="boq-costing-accordion-header"
                  onClick={() => handleToggleAccordion("measurement")}
                >
                  <div className="boq-costing-accordion-header-left">
                    <Maximize2 size={18} color="#1C1B1F" />
                    <span className="boq-costing-accordion-title">Measurement &amp; Quantity</span>
                  </div>
                  {openAccordions.measurement ? (
                    <ChevronUp size={16} className="boq-costing-accordion-arrow" />
                  ) : (
                    <ChevronDown size={16} className="boq-costing-accordion-arrow" />
                  )}
                </button>
                {openAccordions.measurement && (
                  <div className="boq-costing-accordion-body">
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Unit of Measure</span>
                      <span className="boq-costing-field-val">{selectedItem.unit}</span>
                    </div>
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Quantity</span>
                      <span className="boq-costing-field-val">{selectedItem.quantity ?? 1}</span>
                    </div>
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Wastage %</span>
                      <span className="boq-costing-field-val">{selectedItem.wastePercent ?? 5}%</span>
                    </div>
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Effective Qty</span>
                      <span className="boq-costing-field-val">
                        {(
                          Number(selectedItem.quantity ?? 1) *
                          (1 + Number(selectedItem.wastePercent ?? 5) / 100)
                        ).toFixed(2)}{" "}
                        {selectedItem.unit}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Rate Source */}
              <div className="boq-costing-accordion-item">
                <button
                  type="button"
                  className="boq-costing-accordion-header"
                  onClick={() => handleToggleAccordion("rateSource")}
                >
                  <div className="boq-costing-accordion-header-left">
                    <DollarSign size={18} color="#1C1B1F" />
                    <span className="boq-costing-accordion-title">Rate Source</span>
                  </div>
                  {openAccordions.rateSource ? (
                    <ChevronUp size={16} className="boq-costing-accordion-arrow" />
                  ) : (
                    <ChevronDown size={16} className="boq-costing-accordion-arrow" />
                  )}
                </button>
                {openAccordions.rateSource && (
                  <div className="boq-costing-accordion-body">
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Provider</span>
                      <span className="boq-costing-field-val">{selectedItem.rateSource}</span>
                    </div>
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Current Rate</span>
                      <span className="boq-costing-field-val">
                        {selectedItem.currentRate !== null ? `₹${formatRate(selectedItem.currentRate)}` : "-"}
                      </span>
                    </div>
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Snapshot Rate</span>
                      <span className="boq-costing-field-val">
                        {selectedItem.snapshot !== null ? `₹${formatRate(selectedItem.snapshot)}` : "-"}
                      </span>
                    </div>
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Variance</span>
                      <span
                        className="boq-costing-field-val"
                        style={{
                          color:
                            selectedItem.variancePercent === null
                              ? "#64748B"
                              : selectedItem.variancePercent >= 0
                              ? "#2563EB"
                              : "#DC2626",
                        }}
                      >
                        {selectedItem.variancePercent !== null
                          ? `${selectedItem.variancePercent > 0 ? "+" : ""}${selectedItem.variancePercent}%`
                          : "-"}
                      </span>
                    </div>
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Freshness</span>
                      <span className="boq-costing-field-val">
                        {selectedItem.freshnessStatus} ({selectedItem.freshnessDate || "-"})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Tax */}
              <div className="boq-costing-accordion-item">
                <button
                  type="button"
                  className="boq-costing-accordion-header"
                  onClick={() => handleToggleAccordion("tax")}
                >
                  <div className="boq-costing-accordion-header-left">
                    <Percent size={18} color="#1C1B1F" />
                    <span className="boq-costing-accordion-title">Tax</span>
                  </div>
                  {openAccordions.tax ? (
                    <ChevronUp size={16} className="boq-costing-accordion-arrow" />
                  ) : (
                    <ChevronDown size={16} className="boq-costing-accordion-arrow" />
                  )}
                </button>
                {openAccordions.tax && (
                  <div className="boq-costing-accordion-body">
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">GST Bracket</span>
                      <span className="boq-costing-field-val">{selectedItem.taxPercent ?? 18}%</span>
                    </div>
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Landed Rate</span>
                      <span className="boq-costing-field-val" style={{ color: "#16A34A" }}>
                        {selectedItem.currentRate !== null
                          ? `₹${formatRate(
                              Number(selectedItem.currentRate) *
                                (1 + Number(selectedItem.taxPercent ?? 18) / 100)
                            )}`
                          : "-"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Rate History & Audit */}
              <div className="boq-costing-accordion-item">
                <button
                  type="button"
                  className="boq-costing-accordion-header"
                  onClick={() => handleToggleAccordion("history")}
                >
                  <div className="boq-costing-accordion-header-left">
                    <History size={18} color="#1C1B1F" />
                    <span className="boq-costing-accordion-title">Rate History &amp; Audit</span>
                  </div>
                  {openAccordions.history ? (
                    <ChevronUp size={16} className="boq-costing-accordion-arrow" />
                  ) : (
                    <ChevronDown size={16} className="boq-costing-accordion-arrow" />
                  )}
                </button>
                {openAccordions.history && (
                  <div className="boq-costing-accordion-body">
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Baseline Date</span>
                      <span className="boq-costing-field-val">12 Jul 2026</span>
                    </div>
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Last Audited</span>
                      <span className="boq-costing-field-val">
                        {selectedItem.freshnessDate || "06 Aug 2026"}
                      </span>
                    </div>
                    <div className="boq-costing-field-row">
                      <span className="boq-costing-field-label">Auditor</span>
                      <span className="boq-costing-field-val">Admin User</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="boq-costing-divider" />

            {/* Action Buttons */}
            <div className="boq-costing-inspector-btn-row">
              <button
                type="button"
                className="boq-costing-duplicate-btn"
                onClick={() => handleDuplicateItem(selectedItem)}
              >
                Duplicate
              </button>

              <button
                type="button"
                className="boq-costing-remove-btn"
                onClick={() => handleRemoveItem(selectedItem)}
              >
                Remove Item
              </button>
            </div>

            <button
              type="button"
              className="boq-costing-save-btn"
              onClick={handleSaveChanges}
            >
              Update Rate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
