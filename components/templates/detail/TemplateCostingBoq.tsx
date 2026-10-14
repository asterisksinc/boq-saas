"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Edit3,
  MoreHorizontal,
  GripVertical,
  ChevronLeft,
  X,
  Check,
  Trash2,
  Copy,
} from "lucide-react";
import { updateTemplateSection } from "@/lib/api/templates";

export interface BoqItem {
  id: string;
  name: string;
  description?: string;
  code?: string;
  type?: string;
  unit: string;
  quantity: number;
  rate: number;
  sellingRate?: number;
  baseCost?: number;
  wastePercent: number;
  taxPercent: number;
  amount?: number;
  rateStatus?: "MAPPED" | "OUTDATED" | "MISSING";
}

export interface BoqSection {
  id: string;
  name: string;
  code?: string;
  roomName?: string;
  roomId?: string;
  items: BoqItem[];
}

export interface BoqRoom {
  id: string;
  name: string;
  sections: BoqSection[];
}

interface TemplateCostingBoqProps {
  templateId: string;
  initialCosting?: any;
  initialItems?: BoqItem[];
  initialStructure?: any;
  onUpdate?: () => void;
}

// Calculate row amount using exact formula
export function calculateItemAmount(
  quantity: number,
  rate: number,
  wastePercent: number,
  taxPercent: number
): number {
  const q = Number(quantity) || 0;
  const r = Number(rate) || 0;
  const w = Number(wastePercent) || 0;
  const t = Number(taxPercent) || 0;
  return Math.round(q * r * (1 + w / 100) * (1 + t / 100));
}

export default function TemplateCostingBoq({
  templateId,
  initialCosting,
  initialItems = [],
  initialStructure,
  onUpdate,
}: TemplateCostingBoqProps) {
  // Derive structure rooms and sections from template
  const defaultInitialStructure = useMemo<BoqRoom[]>(() => {
    // 1. If template has structure areas with sections and items
    if (initialStructure?.areas && Array.isArray(initialStructure.areas) && initialStructure.areas.length > 0) {
      return initialStructure.areas.map((area: any, aIdx: number) => ({
        id: area.id || `room-${aIdx}`,
        name: area.name || `Room ${aIdx + 1}`,
        sections: (area.sections || []).map((sec: any, sIdx: number) => ({
          id: sec.id || `sec-${aIdx}-${sIdx}`,
          name: sec.name || `Section ${sIdx + 1}`,
          roomId: area.id || `room-${aIdx}`,
          roomName: area.name || `Room ${aIdx + 1}`,
          items: (sec.items || []).map((it: any, iIdx: number) => ({
            id: it.id || `itm-${aIdx}-${sIdx}-${iIdx}`,
            name: it.name || "Item",
            description: it.description || "",
            unit: it.unit || "Nos",
            quantity: Number(it.quantity ?? 1),
            rate: Number(it.rate ?? it.sellingRate ?? it.baseCost ?? 0),
            wastePercent: Number(it.wastePercent ?? 0),
            taxPercent: Number(it.taxPercent ?? 18),
            amount: calculateItemAmount(
              Number(it.quantity ?? 1),
              Number(it.rate ?? it.sellingRate ?? it.baseCost ?? 0),
              Number(it.wastePercent ?? 0),
              Number(it.taxPercent ?? 18)
            ),
            rateStatus: it.rateStatus || "MAPPED",
          })),
        })),
      }));
    }

    // 2. If costingBoq has sections
    if (initialCosting?.sections && Array.isArray(initialCosting.sections) && initialCosting.sections.length > 0) {
      const roomMap: Record<string, BoqSection[]> = {};
      initialCosting.sections.forEach((sec: any, sIdx: number) => {
        const rName = sec.roomName || "General Area";
        if (!roomMap[rName]) roomMap[rName] = [];
        roomMap[rName].push({
          id: sec.id || `sec-${sIdx}`,
          name: sec.name || "Section",
          roomName: rName,
          items: (sec.items || []).map((it: any, iIdx: number) => ({
            id: it.id || `itm-${sIdx}-${iIdx}`,
            name: it.name || "Item",
            description: it.description || "",
            unit: it.unit || "Nos",
            quantity: Number(it.quantity ?? 1),
            rate: Number(it.rate ?? it.sellingRate ?? 0),
            wastePercent: Number(it.wastePercent ?? 0),
            taxPercent: Number(it.taxPercent ?? 18),
            amount: calculateItemAmount(
              Number(it.quantity ?? 1),
              Number(it.rate ?? it.sellingRate ?? 0),
              Number(it.wastePercent ?? 0),
              Number(it.taxPercent ?? 18)
            ),
            rateStatus: it.rateStatus || "MAPPED",
          })),
        });
      });

      return Object.entries(roomMap).map(([rName, secs], rIdx) => ({
        id: `room-${rIdx}`,
        name: rName,
        sections: secs,
      }));
    }

    // 3. Fallback: single room with initialItems or single default section
    const defaultItems: BoqItem[] = initialItems.length > 0 ? initialItems.map(it => ({
      ...it,
      rate: Number(it.rate ?? it.sellingRate ?? 0),
      quantity: Number(it.quantity ?? 1),
      wastePercent: Number(it.wastePercent ?? 0),
      taxPercent: Number(it.taxPercent ?? 18),
      amount: calculateItemAmount(
        Number(it.quantity ?? 1),
        Number(it.rate ?? it.sellingRate ?? 0),
        Number(it.wastePercent ?? 0),
        Number(it.taxPercent ?? 18)
      ),
      rateStatus: it.rateStatus || "MAPPED",
    })) : [
      {
        id: "itm-1",
        name: "Full Height Wardrobe",
        description: "19mm BWP ply, laminate finish",
        unit: "Sq.ft",
        quantity: 72,
        rate: 2875,
        wastePercent: 5,
        taxPercent: 18,
        amount: 227736,
        rateStatus: "MAPPED",
      },
      {
        id: "itm-2",
        name: "King Size Bed",
        description: "Upholstered headboard",
        unit: "Nos",
        quantity: 1,
        rate: 45800,
        wastePercent: 0,
        taxPercent: 18,
        amount: 54044,
        rateStatus: "MAPPED",
      },
      {
        id: "itm-3",
        name: "Side Table",
        description: "600mm W, laminate finish",
        unit: "Nos",
        quantity: 2,
        rate: 6250,
        wastePercent: 5,
        taxPercent: 18,
        amount: 13125,
        rateStatus: "MAPPED",
      },
      {
        id: "itm-4",
        name: "Dressing Table",
        description: "With mirror and drawers",
        unit: "Nos",
        quantity: 1,
        rate: 24500,
        wastePercent: 5,
        taxPercent: 18,
        amount: 28783,
        rateStatus: "OUTDATED",
      },
      {
        id: "itm-5",
        name: "Study Table",
        description: "Laminate top with storage",
        unit: "Nos",
        quantity: 1,
        rate: 18750,
        wastePercent: 5,
        taxPercent: 18,
        amount: 22031,
        rateStatus: "MAPPED",
      },
      {
        id: "itm-6",
        name: "TV Unit",
        description: "Floating unit, laminate finish",
        unit: "Sq.ft",
        quantity: 18,
        rate: 2650,
        wastePercent: 5,
        taxPercent: 18,
        amount: 53667,
        rateStatus: "MAPPED",
      },
      {
        id: "itm-7",
        name: "Chest of Drawers",
        description: "4 drawer unit",
        unit: "Nos",
        quantity: 1,
        rate: 16500,
        wastePercent: 5,
        taxPercent: 18,
        amount: 19404,
        rateStatus: "MISSING",
      },
      {
        id: "itm-8",
        name: "Mirror with Frame",
        description: "900mm x 1200mm",
        unit: "Nos",
        quantity: 1,
        rate: 7250,
        wastePercent: 0,
        taxPercent: 18,
        amount: 8555,
        rateStatus: "MAPPED",
      },
    ];

    return [
      {
        id: "rm-master",
        name: "Master Bedroom",
        sections: [
          {
            id: "sec-furniture",
            name: "Furniture",
            roomName: "Master Bedroom",
            items: defaultItems,
          },
          {
            id: "sec-painting",
            name: "Painting",
            roomName: "Master Bedroom",
            items: [],
          },
          {
            id: "sec-electrical",
            name: "Electrical",
            roomName: "Master Bedroom",
            items: [],
          },
        ],
      },
      {
        id: "rm-living",
        name: "Living Room",
        sections: [
          {
            id: "sec-liv-furn",
            name: "Living Furniture",
            roomName: "Living Room",
            items: [],
          },
        ],
      },
      {
        id: "rm-dining",
        name: "Dining",
        sections: [],
      },
      {
        id: "rm-kitchen",
        name: "Kitchen",
        sections: [],
      },
    ];
  }, [initialStructure, initialCosting, initialItems]);

  const [rooms, setRooms] = useState<BoqRoom[]>(defaultInitialStructure);
  const [expandedRoomIds, setExpandedRoomIds] = useState<Record<string, boolean>>({
    [defaultInitialStructure[0]?.id || "rm-master"]: true,
  });
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    defaultInitialStructure[0]?.sections?.[0]?.id || "sec-furniture"
  );
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Table pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Action and status menus
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BoqItem | null>(null);
  const [isAddStructureModalOpen, setIsAddStructureModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newSectionName, setNewSectionName] = useState("");

  // Item form state
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemUnit, setItemUnit] = useState("Nos");
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState(1000);
  const [itemWaste, setItemWaste] = useState(5);
  const [itemTax, setItemTax] = useState(18);
  const [itemRateStatus, setItemRateStatus] = useState<"MAPPED" | "OUTDATED" | "MISSING">("MAPPED");

  // Save / Persistence states
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Find currently active section and room
  const activeSectionInfo = useMemo(() => {
    for (const rm of rooms) {
      for (const sec of rm.sections) {
        if (sec.id === selectedSectionId) {
          return { room: rm, section: sec };
        }
      }
    }
    // Fallback to first section if available
    const firstSec = rooms[0]?.sections?.[0];
    return { room: rooms[0], section: firstSec };
  }, [rooms, selectedSectionId]);

  const activeSection = activeSectionInfo.section;
  const activeRoom = activeSectionInfo.room;
  const items = activeSection?.items || [];

  // Summary counts across all rooms & sections
  const totalSectionsCount = useMemo(() => {
    return rooms.reduce((acc, r) => acc + r.sections.length, 0);
  }, [rooms]);

  const totalItemsCount = useMemo(() => {
    return rooms.reduce(
      (acc, r) => acc + r.sections.reduce((sAcc, s) => sAcc + s.items.length, 0),
      0
    );
  }, [rooms]);

  // Current section totals
  const currentSectionTotalAmount = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.amount || 0), 0);
  }, [items]);

  const currentSectionTotalQuantity = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }, [items]);

  // Pagination for items table
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  // Persist updated structure & costing to backend
  const persistChanges = async (nextRooms: BoqRoom[]) => {
    try {
      setSaving(true);
      setSaveError(null);

      // Collect all sections flattened for costing_boq
      const allSections = nextRooms.flatMap((r) =>
        r.sections.map((s) => ({
          ...s,
          roomId: r.id,
          roomName: r.name,
        }))
      );
      const allItems = allSections.flatMap((s) => s.items);

      await updateTemplateSection(templateId, "costing-boq", {
        sections: allSections,
        items: allItems,
        itemCount: allItems.length,
        sectionCount: allSections.length,
        totalAmount: allItems.reduce((sum, it) => sum + (it.amount || 0), 0),
      });

      setRooms(nextRooms);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onUpdate?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save BOQ changes.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleRoomExpand = (roomId: string) => {
    setExpandedRoomIds((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  };

  const handleSelectSection = (sec: BoqSection, rm: BoqRoom) => {
    setSelectedSectionId(sec.id);
    setPage(1);
    setOpenActionId(null);
    setOpenStatusId(null);
  };

  // Status Change Handler
  const handleRateStatusChange = (
    item: BoqItem,
    newStatus: "MAPPED" | "OUTDATED" | "MISSING"
  ) => {
    const nextRooms = rooms.map((rm) => ({
      ...rm,
      sections: rm.sections.map((sec) => {
        if (sec.id === activeSection?.id) {
          return {
            ...sec,
            items: sec.items.map((it) =>
              it.id === item.id ? { ...it, rateStatus: newStatus } : it
            ),
          };
        }
        return sec;
      }),
    }));

    persistChanges(nextRooms);
    setOpenStatusId(null);
  };

  // Open Add/Edit Item Modal
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemName("");
    setItemDesc("");
    setItemUnit("Nos");
    setItemQty(1);
    setItemRate(1000);
    setItemWaste(5);
    setItemTax(18);
    setItemRateStatus("MAPPED");
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: BoqItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDesc(item.description || "");
    setItemUnit(item.unit || "Nos");
    setItemQty(item.quantity);
    setItemRate(item.rate);
    setItemWaste(item.wastePercent);
    setItemTax(item.taxPercent);
    setItemRateStatus(item.rateStatus || "MAPPED");
    setIsItemModalOpen(true);
    setOpenActionId(null);
  };

  // Save Item (Add or Edit)
  const handleSaveItemModal = () => {
    if (!itemName.trim() || !activeSection) return;

    const amt = calculateItemAmount(itemQty, itemRate, itemWaste, itemTax);

    let nextRooms: BoqRoom[];
    if (editingItem) {
      nextRooms = rooms.map((rm) => ({
        ...rm,
        sections: rm.sections.map((sec) => {
          if (sec.id === activeSection.id) {
            return {
              ...sec,
              items: sec.items.map((it) =>
                it.id === editingItem.id
                  ? {
                      ...it,
                      name: itemName.trim(),
                      description: itemDesc.trim(),
                      unit: itemUnit,
                      quantity: Number(itemQty),
                      rate: Number(itemRate),
                      wastePercent: Number(itemWaste),
                      taxPercent: Number(itemTax),
                      amount: amt,
                      rateStatus: itemRateStatus,
                    }
                  : it
              ),
            };
          }
          return sec;
        }),
      }));
    } else {
      const newItem: BoqItem = {
        id: `itm-${Date.now()}`,
        name: itemName.trim(),
        description: itemDesc.trim(),
        unit: itemUnit,
        quantity: Number(itemQty),
        rate: Number(itemRate),
        wastePercent: Number(itemWaste),
        taxPercent: Number(itemTax),
        amount: amt,
        rateStatus: itemRateStatus,
      };

      nextRooms = rooms.map((rm) => ({
        ...rm,
        sections: rm.sections.map((sec) => {
          if (sec.id === activeSection.id) {
            return {
              ...sec,
              items: [...sec.items, newItem],
            };
          }
          return sec;
        }),
      }));
    }

    persistChanges(nextRooms);
    setIsItemModalOpen(false);
  };

  const handleDuplicateItem = (item: BoqItem) => {
    if (!activeSection) return;
    const duplicated: BoqItem = {
      ...item,
      id: `itm-${Date.now()}`,
      name: `${item.name} (Copy)`,
    };

    const nextRooms = rooms.map((rm) => ({
      ...rm,
      sections: rm.sections.map((sec) => {
        if (sec.id === activeSection.id) {
          return {
            ...sec,
            items: [...sec.items, duplicated],
          };
        }
        return sec;
      }),
    }));

    persistChanges(nextRooms);
    setOpenActionId(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!activeSection) return;
    const nextRooms = rooms.map((rm) => ({
      ...rm,
      sections: rm.sections.map((sec) => {
        if (sec.id === activeSection.id) {
          return {
            ...sec,
            items: sec.items.filter((it) => it.id !== itemId),
          };
        }
        return sec;
      }),
    }));

    persistChanges(nextRooms);
    setOpenActionId(null);
  };

  // Section renaming
  const handleRenameSection = () => {
    if (!activeSection) return;
    const newName = window.prompt("Enter new section name:", activeSection.name);
    if (!newName || !newName.trim()) return;

    const nextRooms = rooms.map((rm) => ({
      ...rm,
      sections: rm.sections.map((sec) =>
        sec.id === activeSection.id ? { ...sec, name: newName.trim() } : sec
      ),
    }));

    persistChanges(nextRooms);
  };

  // Add BOQ Structure (Room or Section)
  const handleAddStructure = () => {
    if (!newRoomName.trim()) return;

    const rId = `rm-${Date.now()}`;
    const sId = `sec-${Date.now()}`;

    const newSec: BoqSection = {
      id: sId,
      name: newSectionName.trim() || "General Section",
      roomName: newRoomName.trim(),
      items: [],
    };

    const newRoom: BoqRoom = {
      id: rId,
      name: newRoomName.trim(),
      sections: [newSec],
    };

    const nextRooms = [...rooms, newRoom];
    setExpandedRoomIds((prev) => ({ ...prev, [rId]: true }));
    setSelectedSectionId(sId);
    persistChanges(nextRooms);
    setIsAddStructureModalOpen(false);
    setNewRoomName("");
    setNewSectionName("");
  };

  return (
    <div className="td-costing-layout">
      {/* ── Left Sidebar: BOQ STRUCTURE ────────────────────────────── */}
      <aside className="td-costing-sidebar" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div className="td-costing-sidebar-header">
          <div className="td-costing-title-group">
            <span className="td-costing-sidebar-title">BOQ STRUCTURE</span>
            <span className="td-costing-sidebar-sub">
              {totalSectionsCount} Sections · {totalItemsCount} Items
            </span>
          </div>

          <button
            type="button"
            className="td-sidebar-search-btn"
            title="Search structure"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search size={15} />
          </button>
        </div>

        {isSearchOpen && (
          <div style={{ padding: "6px 12px", borderBottom: "1px solid #f1f5f9" }}>
            <input
              type="text"
              placeholder="Search rooms & sections..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: 12,
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                outline: "none",
              }}
            />
          </div>
        )}

        <div className="td-costing-tree-list">
          {rooms
            .filter((rm) =>
              sidebarSearch
                ? rm.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
                  rm.sections.some((s) => s.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
                : true
            )
            .map((rm) => {
              const isExpanded = !!expandedRoomIds[rm.id];
              const secCount = rm.sections.length;

              return (
                <div key={rm.id}>
                  <div
                    className="td-costing-tree-room-row"
                    onClick={() => toggleRoomExpand(rm.id)}
                  >
                    <div className="left">
                      <span className="chev">
                        {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </span>
                      <span className="folder-icon">
                        {isExpanded ? <FolderOpen size={14} color="#64748b" /> : <Folder size={14} color="#64748b" />}
                      </span>
                      <span>{rm.name}</span>
                    </div>
                    <span className="count-badge">{secCount}</span>
                  </div>

                  {isExpanded && rm.sections.length > 0 && (
                    <div className="td-costing-subsections-list">
                      {rm.sections.map((sec) => {
                        const isSelected = sec.id === selectedSectionId;
                        return (
                          <div
                            key={sec.id}
                            className={`td-costing-sub-row ${isSelected ? "selected" : ""}`}
                            onClick={() => handleSelectSection(sec, rm)}
                          >
                            <div className="left">
                              <GripVertical size={12} className="grip" />
                              <span>{sec.name}</span>
                            </div>
                            <span className="count-badge">{sec.items.length}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="td-costing-sidebar-footer">
          <button
            type="button"
            className="td-add-structure-btn"
            style={{ width: "100%" }}
            onClick={() => setIsAddStructureModalOpen(true)}
          >
            <Plus size={15} />
            <span>Add BOQ Structure</span>
          </button>
        </div>
      </aside>

      {/* ── Right Panel: Costing Main ──────────────────────────────── */}
      <section className="td-costing-main">
        {saveSuccess && (
          <div className="td-inspector-alert success" style={{ marginBottom: 4 }}>
            <Check size={14} />
            <span>BOQ changes saved successfully.</span>
          </div>
        )}
        {saveError && (
          <div className="td-inspector-alert error" style={{ marginBottom: 4 }}>
            <span>{saveError}</span>
          </div>
        )}

        <div className="td-costing-main-header">
          <div className="td-costing-main-title-col">
            <h2 className="title">{activeSection?.name || "BOQ Section"}</h2>
            <span className="sub">
              {activeRoom?.name || "Room"} · BOQ Section
            </span>
            <span className="meta">
              {items.length} Items · ₹{currentSectionTotalAmount.toLocaleString("en-IN")} Illustrative Template Value
            </span>
          </div>

          <div className="td-costing-main-actions">
            <button
              type="button"
              className="td-icon-box-btn"
              title="Edit Section"
              onClick={handleRenameSection}
            >
              <Edit3 size={15} />
            </button>
            <button
              type="button"
              className="td-icon-box-btn"
              title="Add Item"
              onClick={handleOpenAddItem}
            >
              <Plus size={15} />
            </button>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="td-icon-box-btn"
                title="More options"
                onClick={() => setIsSectionMenuOpen(!isSectionMenuOpen)}
              >
                <MoreHorizontal size={15} />
              </button>
              {isSectionMenuOpen && (
                <div className="td-wf-action-menu" style={{ position: "absolute", right: 0, top: 36, zIndex: 30 }}>
                  <button
                    type="button"
                    className="item"
                    onClick={() => {
                      setIsSectionMenuOpen(false);
                      handleRenameSection();
                    }}
                  >
                    <Edit3 size={13} />
                    <span>Rename Section</span>
                  </button>
                  <button
                    type="button"
                    className="item"
                    onClick={() => {
                      setIsSectionMenuOpen(false);
                      handleOpenAddItem();
                    }}
                  >
                    <Plus size={13} />
                    <span>Add Item to Section</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Costing Table */}
        <div className="td-costing-table-wrap">
          <table className="td-costing-table">
            <thead>
              <tr>
                <th style={{ width: "26%" }}>ITEM</th>
                <th style={{ width: "8%" }}>UNIT</th>
                <th style={{ width: "7%" }}>QTY</th>
                <th style={{ width: "11%" }}>RATE (₹)</th>
                <th style={{ width: "9%" }}>WASTE (%)</th>
                <th style={{ width: "8%" }}>TAX (%)</th>
                <th style={{ width: "13%" }}>AMOUNT(₹)</th>
                <th style={{ width: "13%" }}>RATE STATUS</th>
                <th style={{ width: "5%" }} />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                    No items configured in this section. Click the + button above to add an item.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const status = item.rateStatus || "MAPPED";
                  const statusClass =
                    status === "MAPPED"
                      ? "status-mapped"
                      : status === "OUTDATED"
                      ? "status-outdated"
                      : "status-missing";

                  const isActionOpen = openActionId === item.id;
                  const isStatusOpen = openStatusId === item.id;

                  return (
                    <tr key={item.id} className="td-costing-row">
                      <td>
                        <div className="td-costing-item-cell">
                          <GripVertical size={13} className="drag-grip" />
                          <div className="item-text-group">
                            <span className="name">{item.name}</span>
                            <span className="desc">
                              {item.description || "Specification not specified"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="unit-txt">{item.unit || "Nos"}</span>
                      </td>
                      <td>
                        <span className="qty-txt">{item.quantity}</span>
                      </td>
                      <td>
                        <span className="rate-txt">
                          {Number(item.rate).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td>
                        <span className="pct-txt">{item.wastePercent}%</span>
                      </td>
                      <td>
                        <span className="pct-txt">{item.taxPercent}%</span>
                      </td>
                      <td>
                        <span className="amount-txt" style={{ color: "#16a34a", fontWeight: 600 }}>
                          {Number(item.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                        <div
                          className={`td-rate-status-pill ${statusClass}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => setOpenStatusId(isStatusOpen ? null : item.id)}
                          title="Click to change rate status"
                        >
                          <span>{status}</span>
                          <ChevronDown size={11} />
                        </div>

                        {isStatusOpen && (
                          <div
                            className="td-wf-action-menu"
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 32,
                              zIndex: 40,
                              minWidth: 120,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                          >
                            <button
                              type="button"
                              className="item"
                              onClick={() => handleRateStatusChange(item, "MAPPED")}
                            >
                              <span style={{ color: "#16a34a", fontWeight: 600 }}>● MAPPED</span>
                            </button>
                            <button
                              type="button"
                              className="item"
                              onClick={() => handleRateStatusChange(item, "OUTDATED")}
                            >
                              <span style={{ color: "#d97706", fontWeight: 600 }}>● OUTDATED</span>
                            </button>
                            <button
                              type="button"
                              className="item"
                              onClick={() => handleRateStatusChange(item, "MISSING")}
                            >
                              <span style={{ color: "#dc2626", fontWeight: 600 }}>● MISSING</span>
                            </button>
                          </div>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="td-row-kebab-wrap" style={{ position: "relative" }}>
                          <button
                            type="button"
                            className="td-row-kebab-btn"
                            aria-label={`Actions for ${item.name}`}
                            onClick={() => setOpenActionId(isActionOpen ? null : item.id)}
                          >
                            <MoreHorizontal size={14} />
                          </button>

                          {isActionOpen && (
                            <div className="td-row-kebab-dropdown">
                              <button
                                disabled={saving}
                                onClick={() => handleOpenEditItem(item)}
                              >
                                Edit Item
                              </button>
                              <button
                                disabled={saving}
                                onClick={() => handleDuplicateItem(item)}
                              >
                                Duplicate
                              </button>
                              <button
                                disabled={saving}
                                className="danger"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                Delete
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

          {/* Table Total Bar */}
          <div className="td-costing-total-bar">
            <span className="total-label">TOTAL ({items.length} ITEMS)</span>
            <span className="total-qty">{currentSectionTotalQuantity}</span>
            <span className="total-amount">
              ₹{currentSectionTotalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="target-table-pagination-row">
          <div className="target-table-total-count">
            Total Items: {items.length}
          </div>

          <div className="target-table-page-nav" role="navigation" aria-label="Pagination">
            <button
              type="button"
              className="target-table-page-btn arrow"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`target-table-page-btn ${safePage === pageNum ? "active" : ""}`}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              className="target-table-page-btn arrow"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="target-table-page-size-wrap">
            <span className="target-table-page-size-label">Show per Page:</span>
            <div className="target-table-page-size-select-wrap">
              <select
                className="target-table-page-size-select"
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
              <ChevronDown size={14} className="target-table-select-arrow" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Add / Edit Item Modal ───────────────────────────────────── */}
      {isItemModalOpen && (
        <div className="td-modal-overlay" onClick={() => setIsItemModalOpen(false)}>
          <div
            className="td-modal-content"
            style={{ maxWidth: 520, background: "#ffffff", borderRadius: 12, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                {editingItem ? "Edit BOQ Item" : "Add BOQ Item"}
              </h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                onClick={() => setIsItemModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Full Height Wardrobe"
                  className="td-form-input"
                  style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                  Description / Specification
                </label>
                <input
                  type="text"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="e.g. 19mm BWP ply, laminate finish"
                  className="td-form-input"
                  style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                    Unit
                  </label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                  >
                    <option value="Nos">Nos</option>
                    <option value="Sq.ft">Sq.ft</option>
                    <option value="R.ft">R.ft</option>
                    <option value="Cu.m">Cu.m</option>
                    <option value="Sq.m">Sq.m</option>
                    <option value="Kg">Kg</option>
                    <option value="Ltr">Ltr</option>
                    <option value="Lot">Lot</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(Number(e.target.value))}
                    className="td-form-input"
                    style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                    Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemRate}
                    onChange={(e) => setItemRate(Number(e.target.value))}
                    className="td-form-input"
                    style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                    Waste (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={itemWaste}
                    onChange={(e) => setItemWaste(Number(e.target.value))}
                    className="td-form-input"
                    style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                    Tax (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={itemTax}
                    onChange={(e) => setItemTax(Number(e.target.value))}
                    className="td-form-input"
                    style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                  Rate Status
                </label>
                <select
                  value={itemRateStatus}
                  onChange={(e) => setItemRateStatus(e.target.value as any)}
                  style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                >
                  <option value="MAPPED">MAPPED</option>
                  <option value="OUTDATED">OUTDATED</option>
                  <option value="MISSING">MISSING</option>
                </select>
              </div>

              <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Calculated Amount:</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>
                  ₹{calculateItemAmount(itemQty, itemRate, itemWaste, itemTax).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="template-btn-secondary"
                onClick={() => setIsItemModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="template-btn-primary"
                onClick={handleSaveItemModal}
                disabled={!itemName.trim()}
              >
                {editingItem ? "Update Item" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add BOQ Structure Modal ─────────────────────────────────── */}
      {isAddStructureModalOpen && (
        <div className="td-modal-overlay" onClick={() => setIsAddStructureModalOpen(false)}>
          <div
            className="td-modal-content"
            style={{ maxWidth: 440, background: "#ffffff", borderRadius: 12, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Add BOQ Structure
              </h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                onClick={() => setIsAddStructureModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                  Room / Area Name *
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Master Bedroom, Living Room"
                  className="td-form-input"
                  style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                  Initial Section Name
                </label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="e.g. Furniture, Electrical, Painting"
                  className="td-form-input"
                  style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="template-btn-secondary"
                onClick={() => setIsAddStructureModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="template-btn-primary"
                onClick={handleAddStructure}
                disabled={!newRoomName.trim()}
              >
                Create Structure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
