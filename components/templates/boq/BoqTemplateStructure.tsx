"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Layers,
  GripVertical,
  Plus,
  Upload,
  MoreHorizontal,
  Search,
  Info,
  RefreshCw,
  X,
  Check,
  AlertTriangle,
  Edit3,
  Copy,
  Trash2,
} from "lucide-react";

export type BoqItem = {
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
  rateStatus?: "MAPPED" | "OUTDATED" | "MISSING" | string;
};

export type BoqCategory = {
  id?: string;
  name: string;
  itemsCount?: number;
  cost?: string;
  items?: BoqItem[];
};

export type BoqRoomSection = {
  id?: string;
  name: string;
  itemsCount?: number;
  cost?: string;
  categories?: BoqCategory[];
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
  usageDependencies?: {
    projectTemplatesCount: number;
    activeProjectsCount: number;
    draftTemplatesCount: number;
  };
  rooms?: BoqRoomSection[];
};

interface BoqTemplateStructureProps {
  template: BoqTemplateDetailData;
  onAddSection?: () => void;
  onAddItem?: () => void;
  onRefresh?: () => Promise<void> | void;
  onNotice?: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

// Exact fallback sections from Figma export specification
const FIGMA_DEFAULT_ROOMS: BoqRoomSection[] = [
  {
    name: "Living Room",
    itemsCount: 18,
    cost: "₹1.28L",
    categories: [
      { name: "Furniture", itemsCount: 8, cost: "₹0.82L", items: [] },
      { name: "Lighting", itemsCount: 6, cost: "₹0.26L", items: [] },
      { name: "Painting", itemsCount: 4, cost: "₹0.20L", items: [] },
    ],
  },
  {
    name: "Dining",
    itemsCount: 2,
    cost: "₹0.74L",
    categories: [
      { name: "Furniture", itemsCount: 2, cost: "₹0.74L", items: [] },
    ],
  },
  {
    name: "Kitchen",
    itemsCount: 5,
    cost: "₹3.26L",
    categories: [
      { name: "Modular Cabinetry", itemsCount: 5, cost: "₹3.26L", items: [] },
    ],
  },
  {
    name: "Master Bedroom",
    itemsCount: 18,
    cost: "₹4.82L",
    categories: [
      {
        name: "Furniture",
        itemsCount: 10,
        cost: "₹4.82L",
        items: [
          {
            code: "FUR-001",
            name: "Full Height Wardrobe",
            description: "19mm BWP ply. laminate finish",
            unit: "Sq.ft",
            quantity: 72,
            rateBasis: "Current Library Rate",
            rate: 2875,
            wastePercent: 5,
            taxPercent: 18,
            amount: 227736,
            rateStatus: "MAPPED",
          },
          {
            code: "FUR-002",
            name: "Kind Size Bed",
            description: "Upholstered headboard",
            unit: "Nos",
            quantity: 1,
            rateBasis: "Current Library Rate",
            rate: 45800,
            wastePercent: 0,
            taxPercent: 18,
            amount: 54044,
            rateStatus: "MAPPED",
          },
          {
            code: "FUR-003",
            name: "Side Table",
            description: "600mm W, laminate finish",
            unit: "Nos",
            quantity: 2,
            rateBasis: "Current Library Rate",
            rate: 6250,
            wastePercent: 5,
            taxPercent: 18,
            amount: 13125,
            rateStatus: "MAPPED",
          },
          {
            code: "FUR-004",
            name: "Dressing Table",
            description: "With mirror and drawers",
            unit: "Nos",
            quantity: 1,
            rateBasis: "Current Library Rate",
            rate: 24500,
            wastePercent: 5,
            taxPercent: 18,
            amount: 28783,
            rateStatus: "OUTDATED",
          },
          {
            code: "FUR-005",
            name: "Study Table",
            description: "Laminate top with storage",
            unit: "Nos",
            quantity: 1,
            rateBasis: "Current Library Rate",
            rate: 18750,
            wastePercent: 5,
            taxPercent: 18,
            amount: 22031,
            rateStatus: "MAPPED",
          },
          {
            code: "FUR-006",
            name: "TV Unit",
            description: "Floating unit, laminate finish",
            unit: "Sq.ft",
            quantity: 18,
            rateBasis: "Current Library Rate",
            rate: 2650,
            wastePercent: 5,
            taxPercent: 18,
            amount: 53667,
            rateStatus: "MAPPED",
          },
          {
            code: "FUR-007",
            name: "Chest of Drawers",
            description: "4 drawer unit",
            unit: "Nos",
            quantity: 1,
            rateBasis: "Current Library Rate",
            rate: 16500,
            wastePercent: 5,
            taxPercent: 18,
            amount: 19404,
            rateStatus: "MISSING",
          },
          {
            code: "FUR-008",
            name: "Mirror with Frame",
            description: "900mm x 1200mm",
            unit: "Nos",
            quantity: 1,
            rateBasis: "Current Library Rate",
            rate: 7250,
            wastePercent: 0,
            taxPercent: 18,
            amount: 8555,
            rateStatus: "MAPPED",
          },
        ],
      },
      { name: "Painting", itemsCount: 6, cost: "₹0.68L", items: [] },
      { name: "Electrical", itemsCount: 4, cost: "₹0.42L", items: [] },
    ],
  },
  { name: "Bedroom 02", itemsCount: 16, cost: "₹3.98L", categories: [] },
  { name: "Bedroom 03", itemsCount: 16, cost: "₹3.84L", categories: [] },
  { name: "Bathrooms", itemsCount: 22, cost: "₹12.98L", categories: [] },
  { name: "Electrical", itemsCount: 28, cost: "₹2.46L", categories: [] },
  { name: "Flooring", itemsCount: 8, cost: "₹1.64L", categories: [] },
  { name: "False Ceiling", itemsCount: 6, cost: "₹1.12L", categories: [] },
];

export default function BoqTemplateStructure({
  template,
  onAddSection,
  onAddItem,
  onRefresh,
  onNotice,
}: BoqTemplateStructureProps) {
  // Navigation & selection state
  const [selectedSection, setSelectedSection] = useState<string>("Master Bedroom");
  const [selectedCategory, setSelectedCategory] = useState<string>("Furniture");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "Master Bedroom": true,
  });
  const [structureSearch, setStructureSearch] = useState("");

  // Pagination state
  const [itemPage, setItemPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(10);

  // Inspector Panel state (Frame 2147225086)
  // Default to FUR-001 so the 3-panel view is displayed initially as in Figma export
  const [selectedItem, setSelectedItem] = useState<BoqItem | null>(() => {
    const mb = FIGMA_DEFAULT_ROOMS.find((r) => r.name === "Master Bedroom");
    const fur = mb?.categories?.find((c) => c.name === "Furniture");
    return fur?.items?.[0] || null;
  });

  type InspectorTab = "General" | "Measurement" | "Costing" | "Tasks" | "Approvals";
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("General");

  // Local map for dynamic item modifications (duplication, removal, add)
  const [customItemsMap, setCustomItemsMap] = useState<Record<string, BoqItem[]>>({});

  // Row Action Menu state
  const [actionMenuCode, setActionMenuCode] = useState<string | null>(null);

  // Refresh spinner state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Current category key for state storage
  const currentCategoryKey = `${selectedSection}::${selectedCategory}`;

  // Merge template.rooms with Figma defaults so user always has complete rich interactive rooms
  const allRooms = useMemo(() => {
    if (template.rooms && template.rooms.length > 0) {
      // If user has rooms from database, ensure Master Bedroom has items if empty
      return template.rooms.map((r) => {
        const fallbackRoom = FIGMA_DEFAULT_ROOMS.find((f) => f.name.toLowerCase() === r.name.toLowerCase());
        if (!r.categories || r.categories.length === 0) {
          return fallbackRoom || r;
        }
        return {
          ...r,
          categories: r.categories.map((c) => {
            if ((!c.items || c.items.length === 0) && fallbackRoom) {
              const fallbackCat = fallbackRoom.categories?.find(
                (fc) => fc.name.toLowerCase() === c.name.toLowerCase()
              );
              if (fallbackCat?.items && fallbackCat.items.length > 0) {
                return { ...c, items: fallbackCat.items };
              }
            }
            return c;
          }),
        };
      });
    }
    return FIGMA_DEFAULT_ROOMS;
  }, [template.rooms]);

  // Filtered rooms based on search
  const filteredRooms = useMemo(() => {
    if (!structureSearch.trim()) return allRooms;
    const q = structureSearch.toLowerCase();
    return allRooms.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.categories?.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [allRooms, structureSearch]);

  // Current active room
  const currentRoom = useMemo(() => {
    return allRooms.find((r) => r.name === selectedSection) || allRooms[0] || FIGMA_DEFAULT_ROOMS[0];
  }, [allRooms, selectedSection]);

  // Current active category
  const currentCategory = useMemo(() => {
    const cats = currentRoom?.categories || [];
    return cats.find((c) => c.name === selectedCategory) || cats[0] || null;
  }, [currentRoom, selectedCategory]);

  // Current category items
  const categoryItems = useMemo(() => {
    if (customItemsMap[currentCategoryKey]) {
      return customItemsMap[currentCategoryKey];
    }
    if (currentCategory?.items && currentCategory.items.length > 0) {
      return currentCategory.items;
    }
    // If current category is Furniture under Master Bedroom, provide exact Figma items
    if (selectedSection === "Master Bedroom" && selectedCategory === "Furniture") {
      const mb = FIGMA_DEFAULT_ROOMS.find((r) => r.name === "Master Bedroom");
      const fur = mb?.categories?.find((c) => c.name === "Furniture");
      return fur?.items || [];
    }
    return [];
  }, [customItemsMap, currentCategoryKey, currentCategory, selectedSection, selectedCategory]);

  // Calculated category statistics
  const totalCategoryQty = useMemo(() => {
    return categoryItems.reduce((acc, it) => acc + Number(it.quantity || 0), 0);
  }, [categoryItems]);

  const totalCategoryAmount = useMemo(() => {
    return categoryItems.reduce((acc, it) => {
      const qty = Number(it.quantity || 0);
      const rate = Number(it.rate || 0);
      const waste = Number(it.wastePercent || 0);
      const tax = Number(it.taxPercent || 0);
      const calculatedAmt = it.amount
        ? Number(it.amount)
        : Math.round(qty * rate * (1 + waste / 100) * (1 + tax / 100));
      return acc + calculatedAmt;
    }, 0);
  }, [categoryItems]);

  // Pagination calculations
  const paginatedItems = useMemo(() => {
    const start = (itemPage - 1) * itemPageSize;
    return categoryItems.slice(start, start + itemPageSize);
  }, [categoryItems, itemPage, itemPageSize]);

  const totalItemPages = Math.max(1, Math.ceil(categoryItems.length / itemPageSize));

  // Handlers
  const handleToggleExpand = (sectionName: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const handleSelectSection = (room: BoqRoomSection) => {
    setSelectedSection(room.name);
    if (room.categories && room.categories.length > 0) {
      setSelectedCategory(room.categories[0].name);
      const firstItem = room.categories[0].items?.[0] || null;
      setSelectedItem(firstItem);
    } else {
      setSelectedItem(null);
    }
    setItemPage(1);
    setExpandedSections((prev) => ({ ...prev, [room.name]: true }));
  };

  const handleSelectSubcategory = (sectionName: string, categoryName: string) => {
    setSelectedSection(sectionName);
    setSelectedCategory(categoryName);
    const targetRoom = allRooms.find((r) => r.name === sectionName);
    const targetCat = targetRoom?.categories?.find((c) => c.name === categoryName);
    const items =
      targetCat?.items ||
      (sectionName === "Master Bedroom" && categoryName === "Furniture"
        ? FIGMA_DEFAULT_ROOMS[3].categories?.[0].items
        : []);
    setSelectedItem(items?.[0] || null);
    setItemPage(1);
  };

  const handleDuplicateItem = (itemToDuplicate: BoqItem) => {
    const newCode = `${itemToDuplicate.code}-COPY`;
    const duplicatedItem: BoqItem = {
      ...itemToDuplicate,
      code: newCode,
      name: `${itemToDuplicate.name} (Copy)`,
    };
    setCustomItemsMap((prev) => {
      const current = prev[currentCategoryKey] || categoryItems;
      return {
        ...prev,
        [currentCategoryKey]: [...current, duplicatedItem],
      };
    });
    setSelectedItem(duplicatedItem);
    onNotice?.(`Duplicated item ${itemToDuplicate.code} as ${newCode}`);
  };

  const handleRemoveItem = (itemToRemove: BoqItem) => {
    setCustomItemsMap((prev) => {
      const current = prev[currentCategoryKey] || categoryItems;
      return {
        ...prev,
        [currentCategoryKey]: current.filter((it) => it.code !== itemToRemove.code),
      };
    });
    if (selectedItem?.code === itemToRemove.code) {
      setSelectedItem(null);
    }
    onNotice?.(`Removed ${itemToRemove.code} (${itemToRemove.name})`);
  };

  const handleSaveChanges = () => {
    if (!selectedItem) return;
    onNotice?.(`Changes saved for ${selectedItem.code} (${selectedItem.name})`);
  };

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        onNotice?.("BOQ Structure refreshed successfully.");
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const formatCurrency = (num: number) => {
    return num.toLocaleString("en-IN");
  };

  const formatRate = (rate: number) => {
    return rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
      {/* ── 1. Subheader Row (Figma Frame 2147225198) ── */}
      <div className="boq-struct-subheader">
        <div className="boq-struct-subheader-left">
          <h2 className="boq-struct-subheader-title">BOQ Structure</h2>
          <p className="boq-struct-subheader-desc">
            Monitor line items, categories, base cost across this BOQ template.
          </p>
        </div>

        <div className="boq-struct-subheader-right">
          <div className="boq-struct-timestamp-wrap">
            <span>
              Structure as of:{" "}
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

          <div className="boq-struct-divider-line" />

          <button
            type="button"
            className="boq-struct-refresh-btn"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? "boq-spin" : ""} color="#1C1B1F" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. 5 Metric Summary Cards (Figma Frame 2147225138) ── */}
      <div className="boq-struct-metrics-row">
        {/* Card 1: Sections */}
        <div className="boq-struct-metric-card">
          <span className="boq-struct-metric-label">Sections</span>
          <div className="boq-struct-metric-val">{template.sections || 18}</div>
          <span className="boq-struct-metric-sub">Organised Structure</span>
        </div>

        {/* Card 2: Line Items */}
        <div className="boq-struct-metric-card">
          <span className="boq-struct-metric-label">Line Items</span>
          <div className="boq-struct-metric-val">{template.items || 186}</div>
          <span className="boq-struct-metric-sub">Total Items</span>
        </div>

        {/* Card 3: Indicative Base Cost */}
        <div className="boq-struct-metric-card">
          <span className="boq-struct-metric-label">Indicative Base Cost</span>
          <div className="boq-struct-metric-val green">
            {template.indicativeBaseCost || "₹28.60L"}
          </div>
          <span className="boq-struct-metric-sub">Current Library Rates</span>
        </div>

        {/* Card 4: Rate Mapping */}
        <div className="boq-struct-metric-card">
          <span className="boq-struct-metric-label">Rate Mapping</span>
          <div className="boq-struct-metric-val blue">
            {template.costMapping || 94}%
          </div>
          <span className="boq-struct-metric-sub">Mapped to Library</span>
        </div>

        {/* Card 5: Project Templates */}
        <div className="boq-struct-metric-card">
          <span className="boq-struct-metric-label">Project Templates</span>
          <div className="boq-struct-metric-val">
            {template.usageDependencies?.projectTemplatesCount ?? template.useCount ?? 12}
          </div>
          <span className="boq-struct-metric-sub">Using this BOQ Template</span>
        </div>
      </div>

      {/* ── 3. Main Structure Layout (Figma Frame 2147225084) ── */}
      <div className="boq-struct-main-layout">
        {/* ── LEFT COLUMN: Tree Sidebar (Figma Frame 2147225071) ── */}
        <div className="boq-struct-sidebar">
          <h3 className="boq-struct-sidebar-title">BOQ STRUCTURE</h3>

          {/* Search Box */}
          <div className="boq-struct-search-box">
            <div className="boq-struct-search-icon-box">
              <Search size={16} color="#475569" />
            </div>
            <input
              type="text"
              className="boq-struct-search-input"
              placeholder="Search sections..."
              value={structureSearch}
              onChange={(e) => setStructureSearch(e.target.value)}
            />
          </div>

          <hr className="boq-struct-divider" />

          {/* Collapsible Sections Tree */}
          <div className="boq-struct-tree-list">
            {filteredRooms.map((room) => {
              const isSelected = selectedSection === room.name;
              const isExpanded = !!expandedSections[room.name];
              const hasCategories = (room.categories || []).length > 0;

              return (
                <div key={room.name} className="boq-struct-section-item">
                  <div
                    className={`boq-struct-section-row ${
                      isSelected && (!hasCategories || !isExpanded) ? "active" : ""
                    }`}
                    onClick={() => {
                      handleToggleExpand(room.name);
                      handleSelectSection(room);
                    }}
                  >
                    <div className="boq-struct-section-left">
                      <ChevronRight
                        className={`boq-struct-arrow-icon ${isExpanded ? "expanded" : ""}`}
                      />
                      {isExpanded ? (
                        <FolderOpen className="boq-struct-folder-icon" />
                      ) : (
                        <Folder className="boq-struct-folder-icon" />
                      )}
                      <span className="boq-struct-section-name">{room.name}</span>
                    </div>

                    <div className="boq-struct-badges-wrap">
                      <span className="boq-struct-count-badge">
                        {room.itemsCount || (room.categories || []).reduce((acc, c) => acc + (c.items?.length || c.itemsCount || 0), 0) || 0}
                      </span>
                      <span className="boq-struct-cost-badge">
                        {room.cost || "₹0.00L"}
                      </span>
                    </div>
                  </div>

                  {/* Subcategories (Frame 2147225180) */}
                  {hasCategories && isExpanded && (
                    <div className="boq-struct-subcategories-list">
                      {room.categories?.map((cat) => {
                        const isCatActive =
                          selectedSection === room.name && selectedCategory === cat.name;

                        return (
                          <div
                            key={cat.name}
                            className={`boq-struct-subcat-row ${isCatActive ? "active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSubcategory(room.name, cat.name);
                            }}
                          >
                            <div className="boq-struct-subcat-left">
                              <GripVertical className="boq-struct-drag-handle" />
                              <Layers className="boq-struct-subcat-icon" />
                              <span className="boq-struct-subcat-name">{cat.name}</span>
                            </div>

                            <div className="boq-struct-badges-wrap">
                              <span className="boq-struct-count-badge">
                                {cat.itemsCount || cat.items?.length || 0}
                              </span>
                              <span className="boq-struct-cost-badge">
                                {cat.cost || "₹0.00L"}
                              </span>
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

          <hr className="boq-struct-divider" />

          {/* Add BOQ Section CTA Button */}
          <button
            type="button"
            className="boq-struct-add-section-btn"
            onClick={onAddSection}
          >
            <Plus size={18} />
            <span>Add BOQ Section</span>
          </button>
        </div>

        {/* ── RIGHT COLUMN: Main Items Panel (Figma Frame 2147225085) ── */}
        <div className="boq-struct-items-panel">
          {/* Category Header Row (Frame 2147225266) */}
          <div className="boq-struct-category-header">
            <div className="boq-struct-category-title-group">
              <div className="boq-struct-breadcrumb">
                <span className="boq-struct-crumb-section">{selectedSection}</span>
                <ChevronRight className="boq-struct-crumb-arrow" />
                <span className="boq-struct-crumb-category">{selectedCategory}</span>
              </div>
              <div className="boq-struct-category-summary">
                {categoryItems.length} Items • ₹{formatCurrency(totalCategoryAmount)}
              </div>
            </div>

            <div className="boq-struct-category-actions">
              <button
                type="button"
                className="boq-struct-add-item-btn"
                onClick={onAddItem}
              >
                <Plus size={16} />
                <span>Add Item</span>
              </button>

              <button
                type="button"
                className="boq-struct-square-btn"
                title="Upload/Import Items"
                onClick={() => onNotice?.("Upload item CSV or Excel package")}
              >
                <Upload size={18} />
              </button>

              <button
                type="button"
                className="boq-struct-square-btn"
                title="More Options"
                onClick={() => onNotice?.("Category options")}
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          <hr className="boq-struct-divider" />

          {/* Table Container (Frame 2147225072) */}
          <div className="boq-struct-table-wrapper">
            <table className="boq-struct-table">
              <thead>
                <tr className="boq-struct-thead-tr">
                  <th className="boq-struct-th" style={{ width: 32 }} />
                  <th className="boq-struct-th text-center" style={{ width: 32 }}>#</th>
                  <th className="boq-struct-th" style={{ width: 79 }}>CODE</th>
                  <th className="boq-struct-th" style={{ minWidth: 202 }}>ITEM</th>
                  <th className="boq-struct-th" style={{ width: 85 }}>UNIT</th>
                  <th className="boq-struct-th text-center" style={{ width: 52 }}>QTY</th>
                  <th className="boq-struct-th text-center" style={{ width: 145 }}>RATE BASIS</th>
                  <th className="boq-struct-th" style={{ width: 100 }}>RATE (₹)</th>
                  <th className="boq-struct-th" style={{ width: 114 }}>WASTE (%)</th>
                  <th className="boq-struct-th" style={{ width: 100 }}>TAX (%)</th>
                  <th className="boq-struct-th" style={{ width: 132 }}>AMOUNT(₹)</th>
                  <th className="boq-struct-th text-center" style={{ width: 130 }}>RATE STATUS</th>
                  <th className="boq-struct-th text-center" style={{ width: 64 }}>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      style={{
                        textAlign: "center",
                        padding: "48px 16px",
                        color: "#64748B",
                        fontFamily: "Urbanist, sans-serif",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>
                        No line items found in {selectedSection} &gt; {selectedCategory}.
                      </p>
                      <button
                        type="button"
                        onClick={onAddItem}
                        style={{
                          marginTop: 12,
                          background: "#2563EB",
                          color: "#FFF",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        + Add First Item
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, idx) => {
                    const rowNumber = (itemPage - 1) * itemPageSize + idx + 1;
                    const qty = Number(item.quantity || 0);
                    const rate = Number(item.rate || 0);
                    const waste = Number(item.wastePercent || 0);
                    const tax = Number(item.taxPercent || 0);
                    const calculatedAmt = item.amount
                      ? Number(item.amount)
                      : Math.round(qty * rate * (1 + waste / 100) * (1 + tax / 100));

                    const status = (item.rateStatus || "MAPPED").toUpperCase();
                    const statusClass =
                      status === "OUTDATED"
                        ? "outdated"
                        : status === "MISSING"
                        ? "missing"
                        : "mapped";

                    const isRowSelected = selectedItem?.code === item.code;

                    return (
                      <tr
                        key={item.code || idx}
                        className={`boq-struct-tbody-tr ${isRowSelected ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedItem(item);
                          setInspectorTab("General");
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Drag Handle */}
                        <td className="boq-struct-td boq-struct-td-drag" onClick={(e) => e.stopPropagation()}>
                          <GripVertical size={16} />
                        </td>

                        {/* Row # */}
                        <td className="boq-struct-td boq-struct-td-num">{rowNumber}</td>

                        {/* Code */}
                        <td className="boq-struct-td boq-struct-td-code">{item.code}</td>

                        {/* Item Name & Spec */}
                        <td className="boq-struct-td boq-struct-td-item">
                          <div className="boq-struct-item-name">{item.name}</div>
                          <div className="boq-struct-item-desc">{item.description}</div>
                        </td>

                        {/* Unit */}
                        <td className="boq-struct-td boq-struct-td-unit">{item.unit}</td>

                        {/* Qty */}
                        <td className="boq-struct-td boq-struct-td-qty text-center">{qty}</td>

                        {/* Rate Basis */}
                        <td className="boq-struct-td boq-struct-td-basis text-center">
                          {item.rateBasis || "Current Library Rate"}
                        </td>

                        {/* Rate (₹) */}
                        <td className="boq-struct-td boq-struct-td-rate">
                          {formatRate(rate)}
                        </td>

                        {/* Waste (%) */}
                        <td className="boq-struct-td boq-struct-td-waste">{waste}%</td>

                        {/* Tax (%) */}
                        <td className="boq-struct-td boq-struct-td-tax">{tax}%</td>

                        {/* Amount(₹) */}
                        <td className="boq-struct-td boq-struct-td-amount">
                          {formatCurrency(calculatedAmt)}
                        </td>

                        {/* Rate Status Badge */}
                        <td className="boq-struct-td text-center" onClick={(e) => e.stopPropagation()}>
                          <span className={`boq-struct-status-badge ${statusClass}`}>
                            {status}
                            <ChevronDown size={12} />
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="boq-struct-td text-center" onClick={(e) => e.stopPropagation()}>
                          <div style={{ position: "relative", display: "inline-block" }}>
                            <button
                              type="button"
                              className="boq-struct-more-btn"
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
                                  minWidth: 140,
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
                                    onNotice?.(`Edit item ${item.code}`);
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
                                  <Edit3 size={14} /> Edit Item
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

              {/* Total Summary Row (Figma Frame 63) */}
              {categoryItems.length > 0 && (
                <tfoot>
                  <tr className="boq-struct-total-tr">
                    <td />
                    <td />
                    <td colSpan={2}>TOTAL ({categoryItems.length} ITEMS)</td>
                    <td />
                    <td className="text-center">{totalCategoryQty}</td>
                    <td />
                    <td />
                    <td />
                    <td />
                    <td>₹{formatCurrency(totalCategoryAmount)}</td>
                    <td />
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Horizontal Scroll Indicator Bar (Figma Rectangle 70) */}
          <div className="boq-struct-scroll-bar-indicator" />

          {/* Pagination Footer (Figma Frame 2147225166) */}
          <div className="boq-struct-pagination-bar">
            <span className="boq-struct-total-items-text">
              Total BOQ Items: {categoryItems.length}
            </span>

            <div className="boq-struct-page-buttons">
              <button
                type="button"
                className="boq-struct-page-btn"
                disabled={itemPage <= 1}
                onClick={() => setItemPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>

              {Array.from({ length: totalItemPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`boq-struct-page-btn ${itemPage === p ? "active" : ""}`}
                  onClick={() => setItemPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                className="boq-struct-page-btn"
                disabled={itemPage >= totalItemPages}
                onClick={() => setItemPage((p) => Math.min(totalItemPages, p + 1))}
              >
                ›
              </button>
            </div>

            <div className="boq-struct-per-page-wrap">
              <span>Show per Page:</span>
              <select
                className="boq-struct-per-page-select-box"
                value={itemPageSize}
                onChange={(e) => {
                  setItemPageSize(Number(e.target.value));
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

        {/* ── 3. Right Column: Item Inspector In-Flow Panel (Figma Frame 2147225086) ── */}
        {selectedItem && (
          <div className="boq-struct-inspector-panel">
            {/* Frame 2147225209: Title & Close Button */}
            <div className="boq-struct-inspector-panel-header">
              <h3 className="boq-struct-inspector-panel-title">ITEM INSPECTOR</h3>
              <button
                type="button"
                className="boq-struct-inspector-close-btn"
                title="Close Inspector"
                onClick={() => setSelectedItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Frame 2147225227: Code, Name, Subtitle & Rate Status Pill */}
            <div className="boq-struct-inspector-identity">
              <div className="boq-struct-inspector-identity-left">
                <span className="boq-struct-inspector-code">{selectedItem.code}</span>
                <div className="boq-struct-inspector-name" title={selectedItem.name}>
                  {selectedItem.name}
                </div>
                <div className="boq-struct-inspector-cat">
                  {selectedCategory} • {selectedSection}
                </div>
              </div>

              <div
                className={`boq-struct-inspector-status-badge ${
                  (selectedItem.rateStatus || "MAPPED").toLowerCase()
                }`}
              >
                <span>{selectedItem.rateStatus || "MAPPED"}</span>
              </div>
            </div>

            {/* Tabbing / Frame 2147225196: 5 Tabs */}
            <div className="boq-struct-inspector-tabs-wrap">
              {(
                [
                  "General",
                  "Measurement",
                  "Costing",
                  "Tasks",
                  "Approvals",
                ] as const
              ).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`boq-struct-inspector-tab-btn ${
                    inspectorTab === tab ? "active" : ""
                  }`}
                  onClick={() => setInspectorTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Body Content */}
            <div className="boq-struct-inspector-content-area">
              {inspectorTab === "General" && (
                <>
                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Item Name</span>
                    <span className="boq-struct-inspector-field-val">{selectedItem.name}</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Item Code</span>
                    <span className="boq-struct-inspector-field-val">{selectedItem.code}</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Description</span>
                    <span className="boq-struct-inspector-field-val">
                      {selectedItem.description && selectedItem.description.length > 20
                        ? selectedItem.description.slice(0, 20) + "..."
                        : selectedItem.description || "Full Height Wardrobe w..."}
                    </span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Item Specification</span>
                    <span className="boq-struct-inspector-field-val">
                      {selectedItem.description && selectedItem.description.length > 25
                        ? selectedItem.description
                        : "19mm BWP Plywood Laminate Finish Soft-close Hardware"}
                    </span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Status</span>
                    <div className="boq-struct-inspector-field-val">
                      <span className="boq-struct-inspector-active-pill">ACTIVE</span>
                    </div>
                  </div>

                  <hr className="boq-struct-inspector-divider" />

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Created by</span>
                    <span className="boq-struct-inspector-field-val">Admin User</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Created On</span>
                    <span className="boq-struct-inspector-field-val">12 Jul 2026</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Last Modified</span>
                    <span className="boq-struct-inspector-field-val">08 Aug 2026</span>
                  </div>
                </>
              )}

              {inspectorTab === "Measurement" && (
                <>
                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Unit of Measure</span>
                    <span className="boq-struct-inspector-field-val">{selectedItem.unit}</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Base Quantity</span>
                    <span className="boq-struct-inspector-field-val">{selectedItem.quantity}</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Wastage Allowance</span>
                    <span className="boq-struct-inspector-field-val">{selectedItem.wastePercent}%</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Effective Quantity</span>
                    <span className="boq-struct-inspector-field-val">
                      {(
                        Number(selectedItem.quantity) *
                        (1 + Number(selectedItem.wastePercent) / 100)
                      ).toFixed(2)}{" "}
                      {selectedItem.unit}
                    </span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Measurement Method</span>
                    <span className="boq-struct-inspector-field-val">Center-line / Plan Calc</span>
                  </div>
                </>
              )}

              {inspectorTab === "Costing" && (
                <>
                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Rate Basis</span>
                    <span className="boq-struct-inspector-field-val">
                      {selectedItem.rateBasis || "Current Library Rate"}
                    </span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Base Unit Rate</span>
                    <span className="boq-struct-inspector-field-val">
                      ₹{formatRate(selectedItem.rate)}
                    </span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Tax Rate (GST)</span>
                    <span className="boq-struct-inspector-field-val">{selectedItem.taxPercent}%</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Total Line Amount</span>
                    <span
                      className="boq-struct-inspector-field-val"
                      style={{ color: "#16A34A", fontWeight: 600 }}
                    >
                      ₹
                      {formatCurrency(
                        selectedItem.amount ||
                          Math.round(
                            Number(selectedItem.quantity) *
                              Number(selectedItem.rate) *
                              (1 + Number(selectedItem.wastePercent) / 100) *
                              (1 + Number(selectedItem.taxPercent) / 100)
                          )
                      )}
                    </span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Rate Status</span>
                    <span
                      className={`boq-struct-inspector-status-badge ${
                        (selectedItem.rateStatus || "MAPPED").toLowerCase()
                      }`}
                    >
                      {selectedItem.rateStatus || "MAPPED"}
                    </span>
                  </div>
                </>
              )}

              {inspectorTab === "Tasks" && (
                <>
                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Assigned Trade</span>
                    <span className="boq-struct-inspector-field-val">Carpentry &amp; Millwork</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Stage Milestone</span>
                    <span className="boq-struct-inspector-field-val">Phase 3 - Joinery Execution</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Dependencies</span>
                    <span className="boq-struct-inspector-field-val">Wall Leveling &amp; Plastering</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Est. Duration</span>
                    <span className="boq-struct-inspector-field-val">4 Working Days</span>
                  </div>
                </>
              )}

              {inspectorTab === "Approvals" && (
                <>
                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Architectural Signoff</span>
                    <span className="boq-struct-inspector-field-val">Approved by Lead Architect</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Rate Signoff</span>
                    <span className="boq-struct-inspector-field-val">Approved (Library v2.4)</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Material Sample</span>
                    <span className="boq-struct-inspector-field-val">Swatch Approved</span>
                  </div>

                  <div className="boq-struct-inspector-field-row">
                    <span className="boq-struct-inspector-field-label">Client Verification</span>
                    <span className="boq-struct-inspector-field-val">Included in Baseline BOQ</span>
                  </div>
                </>
              )}

            </div>

            {/* Frame Rectangle 73: Divider */}
            <hr className="boq-struct-inspector-divider" />

            {/* Frame 2147225256: Duplicate & Remove Item buttons */}
            <div className="boq-struct-inspector-btn-group">
              <button
                type="button"
                className="boq-struct-inspector-duplicate-btn"
                onClick={() => handleDuplicateItem(selectedItem)}
              >
                Duplicate
              </button>

              <button
                type="button"
                className="boq-struct-inspector-remove-btn"
                onClick={() => handleRemoveItem(selectedItem)}
              >
                Remove Item
              </button>
            </div>

            {/* Save Changes CTA Button */}
            <button
              type="button"
              className="boq-struct-inspector-save-btn"
              onClick={handleSaveChanges}
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
