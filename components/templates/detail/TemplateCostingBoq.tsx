"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  AlertCircle,
  Layers,
  ArrowUpDown,
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
  areaCode?: string;
  roomName?: string;
  roomId?: string;
  items: BoqItem[];
}

export interface BoqRoom {
  id: string;
  code?: string;
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

// Calculate row amount using standard BOQ formula: Qty * Rate * (1 + Waste%) * (1 + Tax%)
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
  // Normalize dynamic rooms and sections from database
  const normalizeStructure = useCallback((): BoqRoom[] => {
    const rawAreas = initialStructure?.areas || [];
    const rawSections = initialCosting?.sections || [];

    // If both areas and sections are empty, return empty array (clean empty state, no mock data)
    if (rawAreas.length === 0 && rawSections.length === 0 && initialItems.length === 0) {
      return [];
    }

    // 1. Build an Area Map from initialStructure.areas
    const areaMap = new Map<string, BoqRoom>();
    rawAreas.forEach((area: any, aIdx: number) => {
      const code = area.code || `AREA-${aIdx + 1}`;
      const id = area.id || `room-${code}`;
      areaMap.set(code, {
        id,
        code,
        name: area.name || `Area ${aIdx + 1}`,
        sections: [],
      });
    });

    // 2. Also check if areas already contained sections
    rawAreas.forEach((area: any, aIdx: number) => {
      const code = area.code || `AREA-${aIdx + 1}`;
      const targetRoom = areaMap.get(code);
      if (targetRoom && Array.isArray(area.sections) && area.sections.length > 0) {
        area.sections.forEach((sec: any, sIdx: number) => {
          const secId = sec.id || sec.code || `sec-${aIdx}-${sIdx}`;
          const items: BoqItem[] = (sec.items || []).map((it: any, iIdx: number) => ({
            id: it.id || it.code || `itm-${secId}-${iIdx}`,
            name: it.name || "Item",
            description: it.description || "",
            code: it.code,
            unit: it.unit || "Nos",
            quantity: Number(it.quantity ?? 1),
            rate: Number(it.rate ?? it.sellingRate ?? it.baseCost ?? 0),
            wastePercent: Number(it.wastePercent ?? 0),
            taxPercent: Number(it.taxPercent ?? 18),
            amount:
              it.amount !== undefined && it.amount !== null
                ? Number(it.amount)
                : calculateItemAmount(
                    Number(it.quantity ?? 1),
                    Number(it.rate ?? it.sellingRate ?? it.baseCost ?? 0),
                    Number(it.wastePercent ?? 0),
                    Number(it.taxPercent ?? 18)
                  ),
            rateStatus: it.rateStatus || "MAPPED",
          }));

          targetRoom.sections.push({
            id: secId,
            name: sec.name || `Section ${sIdx + 1}`,
            code: sec.code,
            areaCode: code,
            roomId: targetRoom.id,
            roomName: targetRoom.name,
            items,
          });
        });
      }
    });

    // 3. Map sections from costingBoq.sections
    const unmappedSections: BoqSection[] = [];
    rawSections.forEach((sec: any, sIdx: number) => {
      const secId = sec.id || sec.code || `sec-${sIdx}`;
      const items: BoqItem[] = (sec.items || []).map((it: any, iIdx: number) => ({
        id: it.id || it.code || `itm-${secId}-${iIdx}`,
        name: it.name || "Item",
        description: it.description || "",
        code: it.code,
        unit: it.unit || "Nos",
        quantity: Number(it.quantity ?? 1),
        rate: Number(it.rate ?? it.sellingRate ?? it.baseCost ?? 0),
        wastePercent: Number(it.wastePercent ?? 0),
        taxPercent: Number(it.taxPercent ?? 18),
        amount:
          it.amount !== undefined && it.amount !== null
            ? Number(it.amount)
            : calculateItemAmount(
                Number(it.quantity ?? 1),
                Number(it.rate ?? it.sellingRate ?? it.baseCost ?? 0),
                Number(it.wastePercent ?? 0),
                Number(it.taxPercent ?? 18)
              ),
        rateStatus: it.rateStatus || "MAPPED",
      }));

      // Match by areaCode, roomId, or roomName
      let targetRoom: BoqRoom | undefined;
      if (sec.areaCode && areaMap.has(sec.areaCode)) {
        targetRoom = areaMap.get(sec.areaCode);
      } else if (sec.roomId) {
        targetRoom = Array.from(areaMap.values()).find((r) => r.id === sec.roomId);
      } else if (sec.roomName) {
        targetRoom = Array.from(areaMap.values()).find(
          (r) => r.name.toLowerCase() === sec.roomName.toLowerCase()
        );
      }

      const normalizedSec: BoqSection = {
        id: secId,
        name: sec.name || `Section ${sIdx + 1}`,
        code: sec.code,
        areaCode: targetRoom ? targetRoom.code : sec.areaCode,
        roomId: targetRoom ? targetRoom.id : sec.roomId || "room-general",
        roomName: targetRoom ? targetRoom.name : sec.roomName || "General Area",
        items,
      };

      if (targetRoom) {
        // Prevent duplicate section IDs within the same room
        if (!targetRoom.sections.some((s) => s.id === secId)) {
          targetRoom.sections.push(normalizedSec);
        }
      } else {
        unmappedSections.push(normalizedSec);
      }
    });

    const resultRooms: BoqRoom[] = Array.from(areaMap.values());

    // Group any unmapped sections by roomName or into General Area
    if (unmappedSections.length > 0) {
      const extraMap: Record<string, BoqSection[]> = {};
      unmappedSections.forEach((s) => {
        const rName = s.roomName || "General Area";
        if (!extraMap[rName]) extraMap[rName] = [];
        extraMap[rName].push(s);
      });

      Object.entries(extraMap).forEach(([rName, sList], rIdx) => {
        resultRooms.push({
          id: `room-extra-${rIdx}`,
          name: rName,
          sections: sList,
        });
      });
    }

    // 4. If initialItems was provided and there are still no sections at all
    if (resultRooms.length === 0 && initialItems.length > 0) {
      resultRooms.push({
        id: "room-default",
        name: "General Area",
        sections: [
          {
            id: "sec-default",
            name: "General Section",
            roomName: "General Area",
            items: initialItems.map((it, idx) => ({
              ...it,
              id: it.id || `itm-${idx}`,
              rate: Number(it.rate ?? it.sellingRate ?? 0),
              quantity: Number(it.quantity ?? 1),
              wastePercent: Number(it.wastePercent ?? 0),
              taxPercent: Number(it.taxPercent ?? 18),
              amount:
                it.amount ??
                calculateItemAmount(
                  Number(it.quantity ?? 1),
                  Number(it.rate ?? it.sellingRate ?? 0),
                  Number(it.wastePercent ?? 0),
                  Number(it.taxPercent ?? 18)
                ),
              rateStatus: it.rateStatus || "MAPPED",
            })),
          },
        ],
      });
    }

    return resultRooms;
  }, [initialStructure, initialCosting, initialItems]);

  const [rooms, setRooms] = useState<BoqRoom[]>(normalizeStructure);

  // Sync state when props change
  useEffect(() => {
    const next = normalizeStructure();
    setRooms(next);
  }, [normalizeStructure]);

  // Initial expanded room: first room with sections or first room
  const [expandedRoomIds, setExpandedRoomIds] = useState<Record<string, boolean>>(() => {
    const initial = normalizeStructure();
    const firstWithSections = initial.find((r) => r.sections.length > 0) || initial[0];
    return firstWithSections ? { [firstWithSections.id]: true } : {};
  });

  // Selected section ID
  const [selectedSectionId, setSelectedSectionId] = useState<string>(() => {
    const initial = normalizeStructure();
    for (const r of initial) {
      if (r.sections.length > 0) return r.sections[0].id;
    }
    return "";
  });

  // Keep selected section valid if rooms change
  useEffect(() => {
    if (rooms.length > 0) {
      let found = false;
      for (const r of rooms) {
        if (r.sections.some((s) => s.id === selectedSectionId)) {
          found = true;
          break;
        }
      }
      if (!found) {
        for (const r of rooms) {
          if (r.sections.length > 0) {
            setSelectedSectionId(r.sections[0].id);
            setExpandedRoomIds((prev) => ({ ...prev, [r.id]: true }));
            break;
          }
        }
      }
    }
  }, [rooms, selectedSectionId]);

  // Search & view toggles
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Action and status menus
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BoqItem | null>(null);

  const [isAddStructureModalOpen, setIsAddStructureModalOpen] = useState(false);
  const [selectedAreaCode, setSelectedAreaCode] = useState<string>("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionCode, setNewSectionCode] = useState("");

  const [isRenameSectionModalOpen, setIsRenameSectionModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

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

  // Drag and drop state for items
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Find currently active section and its parent room
  const activeSectionInfo = useMemo(() => {
    for (const rm of rooms) {
      for (const sec of rm.sections) {
        if (sec.id === selectedSectionId) {
          return { room: rm, section: sec };
        }
      }
    }
    // Fallback: first section available
    for (const rm of rooms) {
      if (rm.sections.length > 0) {
        return { room: rm, section: rm.sections[0] };
      }
    }
    return { room: rooms[0] || null, section: null };
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
          id: s.id,
          code: s.code || s.id,
          name: s.name,
          areaCode: s.areaCode || r.code || r.id,
          roomId: r.id,
          roomName: r.name,
          items: s.items,
        }))
      );
      const allItems = allSections.flatMap((s) => s.items);

      await updateTemplateSection(templateId, "costing-boq", {
        data: {
          sections: allSections,
          items: allItems,
          itemCount: allItems.length,
          sectionCount: allSections.length,
          totalAmount: allItems.reduce((sum, it) => sum + (it.amount || 0), 0),
        },
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
    setIsSectionMenuOpen(false);
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
    setIsSectionMenuOpen(false);
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
  const handleOpenRenameSection = () => {
    if (!activeSection) return;
    setRenameValue(activeSection.name);
    setIsRenameSectionModalOpen(true);
    setIsSectionMenuOpen(false);
  };

  const handleSaveRenameSection = () => {
    if (!activeSection || !renameValue.trim()) return;

    const nextRooms = rooms.map((rm) => ({
      ...rm,
      sections: rm.sections.map((sec) =>
        sec.id === activeSection.id ? { ...sec, name: renameValue.trim() } : sec
      ),
    }));

    persistChanges(nextRooms);
    setIsRenameSectionModalOpen(false);
  };

  // Delete Section
  const handleDeleteSection = () => {
    if (!activeSection) return;
    if (!window.confirm(`Are you sure you want to delete section "${activeSection.name}"?`)) return;

    const nextRooms = rooms.map((rm) => ({
      ...rm,
      sections: rm.sections.filter((sec) => sec.id !== activeSection.id),
    }));

    persistChanges(nextRooms);
    setIsSectionMenuOpen(false);

    // Pick new active section
    for (const r of nextRooms) {
      if (r.sections.length > 0) {
        setSelectedSectionId(r.sections[0].id);
        break;
      }
    }
  };

  // Add BOQ Structure (Room or Section)
  const handleOpenAddStructureModal = () => {
    setSelectedAreaCode(rooms[0]?.code || "");
    setNewRoomName("");
    setNewSectionName("");
    setNewSectionCode(`BOQ-${String(totalSectionsCount + 1).padStart(2, "0")}`);
    setIsAddStructureModalOpen(true);
  };

  const handleAddStructure = async () => {
    if (!newSectionName.trim()) return;

    const sId = `sec-${Date.now()}`;
    const generatedCode = newSectionCode.trim() || `BOQ-${String(totalSectionsCount + 1).padStart(2, "0")}`;

    let nextRooms: BoqRoom[];

    if (selectedAreaCode === "__NEW__") {
      if (!newRoomName.trim()) return;
      const rId = `rm-${Date.now()}`;
      const rCode = newRoomName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "-").slice(0, 8);

      const newSec: BoqSection = {
        id: sId,
        code: generatedCode,
        name: newSectionName.trim(),
        areaCode: rCode,
        roomId: rId,
        roomName: newRoomName.trim(),
        items: [],
      };

      const newRoom: BoqRoom = {
        id: rId,
        code: rCode,
        name: newRoomName.trim(),
        sections: [newSec],
      };

      nextRooms = [...rooms, newRoom];
      setExpandedRoomIds((prev) => ({ ...prev, [rId]: true }));

      // Also persist new area to structure.areas if possible
      try {
        const existingAreas = initialStructure?.areas || [];
        const updatedAreas = [...existingAreas, { code: rCode, name: newRoomName.trim() }];
        await updateTemplateSection(templateId, "structure", {
          data: { areas: updatedAreas },
        });
      } catch (e) {
        console.warn("Could not auto-add area to template structure:", e);
      }
    } else {
      // Add section to existing room
      const targetRoom = rooms.find((r) => r.code === selectedAreaCode || r.id === selectedAreaCode) || rooms[0];
      if (!targetRoom) return;

      const newSec: BoqSection = {
        id: sId,
        code: generatedCode,
        name: newSectionName.trim(),
        areaCode: targetRoom.code,
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        items: [],
      };

      nextRooms = rooms.map((rm) => {
        if (rm.id === targetRoom.id) {
          return {
            ...rm,
            sections: [...rm.sections, newSec],
          };
        }
        return rm;
      });

      setExpandedRoomIds((prev) => ({ ...prev, [targetRoom.id]: true }));
    }

    setSelectedSectionId(sId);
    persistChanges(nextRooms);
    setIsAddStructureModalOpen(false);
    setNewRoomName("");
    setNewSectionName("");
    setNewSectionCode("");
  };

  // Drag and drop reordering for items table
  const handleDragStart = (idx: number) => {
    setDraggedItemIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === targetIdx || !activeSection) return;

    const newItems = [...activeSection.items];
    const draggedItem = newItems[draggedItemIndex];
    newItems.splice(draggedItemIndex, 1);
    newItems.splice(targetIdx, 0, draggedItem);

    const nextRooms = rooms.map((rm) => ({
      ...rm,
      sections: rm.sections.map((sec) =>
        sec.id === activeSection.id ? { ...sec, items: newItems } : sec
      ),
    }));

    setRooms(nextRooms);
    setDraggedItemIndex(targetIdx);
  };

  const handleDragEnd = () => {
    if (draggedItemIndex !== null) {
      persistChanges(rooms);
      setDraggedItemIndex(null);
    }
  };

  // Filtered rooms based on sidebar search
  const filteredRooms = useMemo(() => {
    if (!sidebarSearch.trim()) return rooms;
    const q = sidebarSearch.toLowerCase();
    return rooms
      .map((rm) => {
        const matchesRoom = rm.name.toLowerCase().includes(q) || (rm.code && rm.code.toLowerCase().includes(q));
        const matchedSections = rm.sections.filter(
          (s) => s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q))
        );
        if (matchesRoom) return rm;
        if (matchedSections.length > 0) {
          return { ...rm, sections: matchedSections };
        }
        return null;
      })
      .filter(Boolean) as BoqRoom[];
  }, [rooms, sidebarSearch]);

  return (
    <div className="td-costing-layout">
      {/* ── Left Sidebar: BOQ STRUCTURE (Figma Frame 2147225071) ────────── */}
      <aside className="td-costing-sidebar">
        {/* Header: BOQ STRUCTURE (Figma Frame 2147225199) */}
        <div className="td-costing-sidebar-header">
          <div className="td-costing-title-group">
            <span className="td-costing-sidebar-title">BOQ STRUCTURE</span>
            <span className="td-costing-sidebar-sub">
              {totalSectionsCount} Sections • {totalItemsCount} Items
            </span>
          </div>

          <button
            type="button"
            className="td-costing-search-btn"
            title="Search structure"
            aria-label="Search structure"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <div className="td-costing-search-btn-inner">
              <Search size={16} />
            </div>
          </button>
        </div>

        {/* Inline Search Bar */}
        {isSearchOpen && (
          <div className="td-costing-search-bar">
            <Search size={15} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search areas & sections..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              autoFocus
            />
            {sidebarSearch && (
              <button
                type="button"
                onClick={() => setSidebarSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <hr className="td-costing-divider" />

        {/* Structure Tree List (Figma Frame 2147225181) */}
        <div className="td-costing-tree-list">
          {filteredRooms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 8px", color: "#94A3B8", fontSize: 13 }}>
              {sidebarSearch ? "No matching areas or sections." : "No BOQ areas defined."}
            </div>
          ) : (
            filteredRooms.map((rm) => {
              const isExpanded = !!expandedRoomIds[rm.id];
              const roomItemCount = rm.sections.reduce((acc, s) => acc + s.items.length, 0);

              return (
                <div key={rm.id} className="td-costing-room-group">
                  {/* Area / Room Header Row (Figma Frame 2147225184) */}
                  <div
                    className="td-costing-room-row"
                    onClick={() => toggleRoomExpand(rm.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleRoomExpand(rm.id);
                      }
                    }}
                  >
                    <div className="td-costing-room-left">
                      <span
                        className="td-costing-room-chevron"
                        style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                      >
                        <ChevronRight size={14} />
                      </span>
                      <span className="td-costing-room-folder">
                        {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                      </span>
                      <span className="td-costing-room-name" title={rm.name}>
                        {rm.name}
                      </span>
                    </div>

                    <span className="td-costing-count-badge" title={`${roomItemCount} total items`}>
                      {roomItemCount}
                    </span>
                  </div>

                  {/* Subsections List (Figma Frame 2147225180) */}
                  {isExpanded && rm.sections.length > 0 && (
                    <div className="td-costing-subsections-list">
                      {rm.sections.map((sec) => {
                        const isSelected = sec.id === selectedSectionId;

                        return (
                          <div
                            key={sec.id}
                            className={`td-costing-sub-row ${isSelected ? "selected" : ""}`}
                            onClick={() => handleSelectSection(sec, rm)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleSelectSection(sec, rm);
                              }
                            }}
                          >
                            <div className="td-costing-sub-left">
                              <span className="td-costing-sub-grip">
                                <GripVertical size={13} />
                              </span>
                              <span className="td-costing-sub-folder">
                                <Layers size={14} />
                              </span>
                              <span className="td-costing-sub-name" title={sec.name}>
                                {sec.name}
                              </span>
                            </div>

                            <span className="td-costing-count-badge">
                              {sec.items.length}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <hr className="td-costing-divider" />

        {/* Add BOQ Structure CTA Button (Figma Buttons: #2563EB, 46px) */}
        <button
          type="button"
          className="td-costing-add-btn"
          onClick={handleOpenAddStructureModal}
        >
          <Plus size={16} />
          <span>Add BOQ Structure</span>
        </button>
      </aside>

      {/* ── Right Panel: Costing Main Workspace (Figma Frame 2147225072) ─── */}
      <section className="td-costing-main">
        {saveSuccess && (
          <div className="td-inspector-alert success" style={{ marginBottom: 4 }}>
            <Check size={14} />
            <span>BOQ changes saved successfully.</span>
          </div>
        )}
        {saveError && (
          <div className="td-inspector-alert error" style={{ marginBottom: 4 }}>
            <AlertCircle size={14} />
            <span>{saveError}</span>
          </div>
        )}

        {/* Main Section Header (Figma Frame 2147225198) */}
        <div className="td-costing-main-header">
          <div className="td-costing-main-title-col">
            <h2 className="td-costing-main-title">
              {activeSection?.name || "BOQ Workspace"}
            </h2>
            <p className="td-costing-main-subtitle">
              {activeRoom?.name ? `${activeRoom.name} • BOQ Section` : "Template BOQ Section"}
            </p>
          </div>

          <div className="td-costing-main-actions">
            <button
              type="button"
              className="td-costing-icon-btn"
              title="Rename Section"
              aria-label="Rename Section"
              disabled={!activeSection}
              onClick={handleOpenRenameSection}
            >
              <Edit3 size={18} />
            </button>

            <button
              type="button"
              className="td-costing-icon-btn"
              title="Add Item to Section"
              aria-label="Add Item to Section"
              disabled={!activeSection}
              onClick={handleOpenAddItem}
            >
              <Plus size={18} />
            </button>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="td-costing-icon-btn"
                title="More Section Options"
                aria-label="More Section Options"
                disabled={!activeSection}
                onClick={() => setIsSectionMenuOpen(!isSectionMenuOpen)}
              >
                <MoreHorizontal size={18} />
              </button>

              {isSectionMenuOpen && (
                <div
                  className="td-row-kebab-dropdown"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 50,
                    zIndex: 50,
                    minWidth: 160,
                  }}
                >
                  <button type="button" onClick={handleOpenRenameSection}>
                    <Edit3 size={13} style={{ marginRight: 6 }} />
                    Rename Section
                  </button>
                  <button type="button" onClick={handleOpenAddItem}>
                    <Plus size={13} style={{ marginRight: 6 }} />
                    Add Item
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={handleDeleteSection}
                  >
                    <Trash2 size={13} style={{ marginRight: 6 }} />
                    Delete Section
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub-header Summary Line (Figma: 11 Items • ₹4,82,000 Illustrative Template Value) */}
        <div className="td-costing-summary-bar">
          {items.length} Items • ₹{currentSectionTotalAmount.toLocaleString("en-IN")} Illustrative Template Value
        </div>

        <hr className="td-costing-divider" />

        {/* Inner Table Container (Figma Device Management_iOS: #F9FBFD) */}
        <div className="td-costing-table-container">
          <table className="td-costing-table">
            <thead>
              <tr>
                <th style={{ width: 36 }} aria-label="Reorder"></th>
                <th style={{ minWidth: 200 }}>ITEM</th>
                <th style={{ width: 85 }}>UNIT</th>
                <th style={{ width: 60 }}>QTY</th>
                <th style={{ width: 100 }}>RATE (₹)</th>
                <th style={{ width: 90 }}>WASTE (%)</th>
                <th style={{ width: 80 }}>TAX (%)</th>
                <th style={{ width: 110 }}>AMOUNT(₹)</th>
                <th style={{ width: 120 }}>RATE STATUS</th>
                <th style={{ width: 48 }} aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="td-costing-empty-state">
                      <Layers size={32} color="#94A3B8" />
                      <h4 className="td-costing-empty-title">
                        No items in this section
                      </h4>
                      <p className="td-costing-empty-desc">
                        Add items with rates, units, and tax to build this template section&apos;s BOQ.
                      </p>
                      <button
                        type="button"
                        className="td-modal-btn-primary"
                        onClick={handleOpenAddItem}
                        style={{ marginTop: 8 }}
                      >
                        <Plus size={15} style={{ marginRight: 6, display: "inline-block", verticalAlign: "middle" }} />
                        <span>Add First Item</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const status = item.rateStatus || "MAPPED";
                  const statusClass = status.toLowerCase();
                  const isActionOpen = openActionId === item.id;
                  const isStatusOpen = openStatusId === item.id;
                  const realIndex = (safePage - 1) * pageSize + idx;

                  return (
                    <tr
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(realIndex)}
                      onDragOver={(e) => handleDragOver(e, realIndex)}
                      onDragEnd={handleDragEnd}
                      style={{
                        opacity: draggedItemIndex === realIndex ? 0.4 : 1,
                        cursor: "default",
                      }}
                    >
                      {/* Drag Handle */}
                      <td className="td-costing-grip-cell">
                        <GripVertical size={16} />
                      </td>

                      {/* ITEM Name + Description */}
                      <td>
                        <div className="td-costing-item-cell">
                          <span className="td-costing-item-name">{item.name}</span>
                          <span className="td-costing-item-desc">
                            {item.description || "Specification not specified"}
                          </span>
                        </div>
                      </td>

                      {/* UNIT */}
                      <td>
                        <span className="td-costing-val-secondary">
                          {item.unit || "Nos"}
                        </span>
                      </td>

                      {/* QTY */}
                      <td>
                        <span className="td-costing-val-secondary">
                          {item.quantity}
                        </span>
                      </td>

                      {/* RATE (₹) */}
                      <td>
                        <span className="td-costing-val-primary">
                          {Number(item.rate).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      {/* WASTE (%) */}
                      <td>
                        <span className="td-costing-val-secondary">
                          {item.wastePercent}%
                        </span>
                      </td>

                      {/* TAX (%) */}
                      <td>
                        <span className="td-costing-val-secondary">
                          {item.taxPercent}%
                        </span>
                      </td>

                      {/* AMOUNT (₹) */}
                      <td>
                        <span className="td-costing-val-amount">
                          {Number(item.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* RATE STATUS Badge with dropdown selector */}
                      <td style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                        <div
                          className={`td-costing-status-pill ${statusClass}`}
                          onClick={() => setOpenStatusId(isStatusOpen ? null : item.id)}
                          title="Click to change rate status"
                        >
                          <span>{status}</span>
                          <ChevronDown size={11} />
                        </div>

                        {isStatusOpen && (
                          <div
                            className="td-row-kebab-dropdown"
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 36,
                              zIndex: 40,
                              minWidth: 130,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleRateStatusChange(item, "MAPPED")}
                            >
                              <span style={{ color: "#16A34A", fontWeight: 600 }}>● MAPPED</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRateStatusChange(item, "OUTDATED")}
                            >
                              <span style={{ color: "#D97706", fontWeight: 600 }}>● OUTDATED</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRateStatusChange(item, "MISSING")}
                            >
                              <span style={{ color: "#DC2626", fontWeight: 600 }}>● MISSING</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Row Actions Menu */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="td-costing-row-actions">
                          <button
                            type="button"
                            className="td-costing-kebab-btn"
                            aria-label={`Actions for ${item.name}`}
                            onClick={() => setOpenActionId(isActionOpen ? null : item.id)}
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {isActionOpen && (
                            <div
                              className="td-row-kebab-dropdown"
                              style={{
                                position: "absolute",
                                right: 0,
                                top: 32,
                                zIndex: 45,
                              }}
                            >
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleOpenEditItem(item)}
                              >
                                <Edit3 size={13} style={{ marginRight: 6 }} />
                                Edit Item
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleDuplicateItem(item)}
                              >
                                <Copy size={13} style={{ marginRight: 6 }} />
                                Duplicate
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                className="danger"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 size={13} style={{ marginRight: 6 }} />
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

              {/* Table Total Bar Row (Figma Frame 63: #E4ECFB, 36px) */}
              {items.length > 0 && (
                <tr className="td-costing-total-tr">
                  <td></td>
                  <td colSpan={2}>
                    <strong>TOTAL ({items.length} ITEMS)</strong>
                  </td>
                  <td>
                    <strong>{currentSectionTotalQuantity}</strong>
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>
                    <strong style={{ color: "#0F172A" }}>
                      ₹{currentSectionTotalAmount.toLocaleString("en-IN")}
                    </strong>
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar (Figma Frame 2147225166: 50px height) */}
        {items.length > 0 && (
          <div className="td-costing-pagination-bar">
            <div className="td-costing-pagination-total">
              Total Items: {items.length}
            </div>

            <div className="td-costing-pagination-nav" role="navigation" aria-label="Pagination">
              <button
                type="button"
                className="td-costing-page-btn"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`td-costing-page-btn ${safePage === pageNum ? "active" : ""}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className="td-costing-page-btn"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="td-costing-page-size-wrap">
              <span className="td-costing-page-size-label">Show per Page:</span>
              <div className="td-costing-page-size-select-wrap">
                <select
                  className="td-costing-page-size-select"
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
                <ChevronDown
                  size={14}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "calc(50% - 7px)",
                    pointerEvents: "none",
                    color: "#64748B",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Add / Edit Item Modal ─────────────────────────────────────── */}
      {isItemModalOpen && (
        <div className="td-modal-overlay" onClick={() => setIsItemModalOpen(false)}>
          <div
            className="td-modal-card"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="td-modal-header">
              <h3 className="td-modal-title">
                {editingItem ? "Edit BOQ Item" : "Add BOQ Item"}
              </h3>
              <button
                type="button"
                className="td-modal-close"
                onClick={() => setIsItemModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="td-inspector-field">
                <label className="td-inspector-label">
                  Item Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Full Height Wardrobe, Side Table"
                  className="td-inspector-input"
                  autoFocus
                />
              </div>

              <div className="td-inspector-field">
                <label className="td-inspector-label">
                  Description / Specification
                </label>
                <input
                  type="text"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="e.g. 19mm BWP ply, laminate finish"
                  className="td-inspector-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="td-inspector-field">
                  <label className="td-inspector-label">Unit</label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="td-inspector-select"
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

                <div className="td-inspector-field">
                  <label className="td-inspector-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(Number(e.target.value))}
                    className="td-inspector-input"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div className="td-inspector-field">
                  <label className="td-inspector-label">Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemRate}
                    onChange={(e) => setItemRate(Number(e.target.value))}
                    className="td-inspector-input"
                  />
                </div>

                <div className="td-inspector-field">
                  <label className="td-inspector-label">Waste (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={itemWaste}
                    onChange={(e) => setItemWaste(Number(e.target.value))}
                    className="td-inspector-input"
                  />
                </div>

                <div className="td-inspector-field">
                  <label className="td-inspector-label">Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={itemTax}
                    onChange={(e) => setItemTax(Number(e.target.value))}
                    className="td-inspector-input"
                  />
                </div>
              </div>

              <div className="td-inspector-field">
                <label className="td-inspector-label">Rate Status</label>
                <select
                  value={itemRateStatus}
                  onChange={(e) => setItemRateStatus(e.target.value as any)}
                  className="td-inspector-select"
                >
                  <option value="MAPPED">MAPPED (Verified against master catalog)</option>
                  <option value="OUTDATED">OUTDATED (Needs vendor rate refresh)</option>
                  <option value="MISSING">MISSING (Unmapped or estimation)</option>
                </select>
              </div>

              {/* Calculated Amount Preview Box */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  padding: "12px 16px",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, color: "#64748B", fontFamily: "'Urbanist', sans-serif" }}>
                  Calculated Amount:
                </span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#16A34A",
                    fontFamily: "'Urbanist', sans-serif",
                  }}
                >
                  ₹{calculateItemAmount(itemQty, itemRate, itemWaste, itemTax).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="td-modal-actions">
              <button
                type="button"
                className="td-modal-btn-cancel"
                onClick={() => setIsItemModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="td-modal-btn-primary"
                onClick={handleSaveItemModal}
                disabled={!itemName.trim() || saving}
              >
                {editingItem ? "Update Item" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add BOQ Structure Modal ───────────────────────────────────── */}
      {isAddStructureModalOpen && (
        <div className="td-modal-overlay" onClick={() => setIsAddStructureModalOpen(false)}>
          <div
            className="td-modal-card"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="td-modal-header">
              <h3 className="td-modal-title">Add BOQ Structure</h3>
              <button
                type="button"
                className="td-modal-close"
                onClick={() => setIsAddStructureModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="td-inspector-field">
                <label className="td-inspector-label">
                  Target Area / Room <span className="req">*</span>
                </label>
                <select
                  value={selectedAreaCode}
                  onChange={(e) => setSelectedAreaCode(e.target.value)}
                  className="td-inspector-select"
                >
                  {rooms.map((rm) => (
                    <option key={rm.id} value={rm.code || rm.id}>
                      {rm.name} {rm.code ? `(${rm.code})` : ""}
                    </option>
                  ))}
                  <option value="__NEW__">+ Create New Room / Area</option>
                </select>
              </div>

              {selectedAreaCode === "__NEW__" && (
                <div className="td-inspector-field">
                  <label className="td-inspector-label">
                    New Room / Area Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g. Master Bedroom, Balcony, Terrace"
                    className="td-inspector-input"
                    autoFocus
                  />
                </div>
              )}

              <div className="td-inspector-field">
                <label className="td-inspector-label">
                  Section Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="e.g. Furniture, Electrical, Painting, Flooring"
                  className="td-inspector-input"
                />
              </div>

              <div className="td-inspector-field">
                <label className="td-inspector-label">Section Code (Optional)</label>
                <input
                  type="text"
                  value={newSectionCode}
                  onChange={(e) => setNewSectionCode(e.target.value)}
                  placeholder="e.g. BOQ-19"
                  className="td-inspector-input"
                />
              </div>
            </div>

            <div className="td-modal-actions">
              <button
                type="button"
                className="td-modal-btn-cancel"
                onClick={() => setIsAddStructureModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="td-modal-btn-primary"
                onClick={handleAddStructure}
                disabled={
                  !newSectionName.trim() ||
                  (selectedAreaCode === "__NEW__" && !newRoomName.trim()) ||
                  saving
                }
              >
                Create Structure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rename Section Modal ──────────────────────────────────────── */}
      {isRenameSectionModalOpen && (
        <div className="td-modal-overlay" onClick={() => setIsRenameSectionModalOpen(false)}>
          <div
            className="td-modal-card"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="td-modal-header">
              <h3 className="td-modal-title">Rename BOQ Section</h3>
              <button
                type="button"
                className="td-modal-close"
                onClick={() => setIsRenameSectionModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="td-inspector-field">
              <label className="td-inspector-label">
                Section Name <span className="req">*</span>
              </label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="td-inspector-input"
                autoFocus
              />
            </div>

            <div className="td-modal-actions">
              <button
                type="button"
                className="td-modal-btn-cancel"
                onClick={() => setIsRenameSectionModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="td-modal-btn-primary"
                onClick={handleSaveRenameSection}
                disabled={!renameValue.trim() || saving}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
