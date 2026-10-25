"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  FileText,
  X,
  GripVertical,
  Check,
  Home,
  GitMerge,
  Folder,
  SlidersHorizontal,
} from "lucide-react";
import { updateTemplateSection } from "@/lib/api/templates";
export interface StructureItem {
  id: string;
  name: string;
  code: string;
  type: string;
  unit: string;
  quantity?: number;
  baseCost: number;
  sellingRate: number;
  rate?: number;
  wastePercent?: number;
  taxPercent?: number;
  amount?: number;
  margin?: string;
  preferredVendor?: string;
  rateStatus?: string;
  updatedAt?: string;
  description?: string;
}

export interface StructureSection {
  id: string;
  name: string;
  code?: string;
  description?: string;
  itemsCount?: number;
  totalValue?: number;
  items: StructureItem[];
}

export interface StructureArea {
  id: string;
  name: string;
  type: string;
  dimensions: string;
  code?: string;
  description?: string;
  includedByDefault?: boolean;
  allowRename?: boolean;
  requiredArea?: boolean;
  sections: StructureSection[];
}

interface TemplateStructureProps {
  templateId: string;
  initialAreas?: any[];
  costingBoq?: any;
  workflow?: any;
  documents?: any;
  composition?: any;
  onUpdate?: () => void;
  onNavigateTab?: (tab: string) => void;
}

function normalizeArea(
  raw: any,
  index: number,
  allCostingSections: any[] = []
): StructureArea {
  const code = raw.code || `RM-${index + 1}`;
  const id = raw.id || `area-${code.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  const name = raw.name || `Room ${index + 1}`;

  const type =
    raw.type ||
    (name.toLowerCase().includes("bed")
      ? "Bedroom"
      : name.toLowerCase().includes("bath")
      ? "Bathroom"
      : name.toLowerCase().includes("kitchen")
      ? "Kitchen"
      : name.toLowerCase().includes("dining")
      ? "Dining"
      : name.toLowerCase().includes("living")
      ? "Living Room"
      : name.toLowerCase().includes("entrance")
      ? "Entrance"
      : "Custom");

  const dimensions =
    raw.dimensions ||
    (type === "Bedroom"
      ? "16ft x 14ft"
      : type === "Living Room"
      ? "20ft x 16ft"
      : type === "Kitchen"
      ? "12ft x 10ft"
      : type === "Bathroom"
      ? "8ft x 6ft"
      : "14ft x 12ft");

  const description =
    raw.description ||
    `${name} interior structure with predefined BOQ sections and specifications.`;
  const includedByDefault = raw.includedByDefault ?? true;
  const allowRename = raw.allowRename ?? true;
  const requiredArea = raw.requiredArea ?? raw.required ?? index < 5;

  // Resolve BOQ sections for this area
  let sections: StructureSection[] = [];
  if (Array.isArray(raw.sections) && raw.sections.length > 0) {
    sections = raw.sections;
  } else if (allCostingSections.length > 0) {
    // Look for sections tagged with this area's code or id
    const matched = allCostingSections.filter(
      (s: any) =>
        s.areaCode === code ||
        s.areaCode === id ||
        s.areaCode?.toLowerCase() === name.toLowerCase()
    );

    if (matched.length > 0) {
      sections = matched.map((s: any, sIdx: number) => ({
        id: s.id || `sec-${s.code || sIdx}`,
        name: s.name || `Section ${sIdx + 1}`,
        code: s.code || `BOQ-0${sIdx + 1}`,
        itemsCount: Array.isArray(s.items) ? s.items.length : s.itemsCount ?? 0,
        totalValue: s.totalValue ?? 0,
        items: (s.items || []).map((it: any, itIdx: number) => {
          const sellingRate = Number(it.sellingRate ?? it.rate ?? 1200);
          const baseCost = Number(it.baseCost ?? Math.round(sellingRate * 0.72));
          const marginVal =
            sellingRate > 0
              ? (((sellingRate - baseCost) / sellingRate) * 100).toFixed(2) + "%"
              : "0%";
          return {
            id: it.id || `itm-${it.code || itIdx}`,
            name: it.name || `Item ${itIdx + 1}`,
            code: it.code || `ITM-${itIdx + 1}`,
            type: it.type || "Material",
            unit: it.unit || "Sheet",
            baseCost,
            sellingRate,
            margin: it.margin || marginVal,
            preferredVendor: it.preferredVendor || it.vendor || "Century Ply",
            rateStatus:
              it.rateStatus || (it.status ? it.status.toUpperCase() : "ACTIVE"),
            updatedAt: it.updatedAt || "5 Aug 2024",
            description: it.description || "",
          };
        }),
      }));
    }
  }

  // Fallback for Master Bedroom or first room if no sections were mapped
  if (sections.length === 0 && (name.toLowerCase().includes("master") || index === 0)) {
    sections = [
      {
        id: `sec-${id}-furniture`,
        name: "Furniture",
        code: "BOQ-01",
        itemsCount: 5,
        totalValue: 6670,
        items: [
          {
            id: `itm-${id}-1`,
            name: "18MM HDHMR Board",
            code: "MAT-BRD-001",
            type: "Material",
            unit: "Sheet",
            baseCost: 1200,
            sellingRate: 1650,
            margin: "27.33%",
            preferredVendor: "Century Ply",
            rateStatus: "ACTIVE",
            updatedAt: "5 Aug 2024",
          },
          {
            id: `itm-${id}-2`,
            name: "12MM Plywood",
            code: "MAT-BRD-002",
            type: "Material",
            unit: "Sheet",
            baseCost: 850,
            sellingRate: 1230,
            margin: "30.09%",
            preferredVendor: "Century Ply",
            rateStatus: "DRAFT",
            updatedAt: "5 Aug 2024",
          },
          {
            id: `itm-${id}-3`,
            name: "18MM MDF Board",
            code: "MAT-BRD-003",
            type: "Material",
            unit: "Sheet",
            baseCost: 950,
            sellingRate: 1320,
            margin: "28.00%",
            preferredVendor: "Century Ply",
            rateStatus: "ACTIVE",
            updatedAt: "5 Aug 2024",
          },
          {
            id: `itm-${id}-4`,
            name: "18MM Particle Board",
            code: "MAT-BRD-004",
            type: "Material",
            unit: "Sheet",
            baseCost: 620,
            sellingRate: 890,
            margin: "30.78%",
            preferredVendor: "Century Ply",
            rateStatus: "ACTIVE",
            updatedAt: "5 Aug 2024",
          },
          {
            id: `itm-${id}-5`,
            name: "18MM Black Board",
            code: "MAT-BRD-005",
            type: "Material",
            unit: "Sheet",
            baseCost: 1150,
            sellingRate: 1580,
            margin: "27.02%",
            preferredVendor: "Century Ply",
            rateStatus: "ACTIVE",
            updatedAt: "5 Aug 2024",
          },
        ],
      },
      {
        id: `sec-${id}-electrical`,
        name: "Electrical",
        code: "BOQ-02",
        itemsCount: 28,
        totalValue: 14500,
        items: [],
      },
      {
        id: `sec-${id}-painting`,
        name: "Painting",
        code: "BOQ-03",
        itemsCount: 12,
        totalValue: 8900,
        items: [],
      },
    ];
  }

  return {
    id,
    name,
    type,
    dimensions,
    code,
    description,
    includedByDefault,
    allowRename,
    requiredArea,
    sections,
  };
}

export default function TemplateStructure({
  templateId,
  initialAreas = [],
  costingBoq,
  workflow,
  documents,
  composition,
  onUpdate,
  onNavigateTab,
}: TemplateStructureProps) {
  // Normalize areas on load
  const allCostingSections = costingBoq?.sections || [];
  const normalizedInitial = useMemo(() => {
    if (initialAreas.length === 0) return [];
    return initialAreas.map((a, idx) =>
      normalizeArea(a, idx, allCostingSections)
    );
  }, [initialAreas, allCostingSections]);

  const [areas, setAreas] = useState<StructureArea[]>(normalizedInitial);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(() => {
    return (
      normalizedInitial[0]?.id ||
      normalizedInitial[0]?.code ||
      "area-master-bedroom"
    );
  });

  useEffect(() => {
    if (normalizedInitial.length > 0) {
      setAreas(normalizedInitial);
      if (!normalizedInitial.some((a) => a.id === selectedAreaId)) {
        setSelectedAreaId(normalizedInitial[0].id);
      }
    }
  }, [normalizedInitial]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAreasExpanded, setIsAreasExpanded] = useState(true);
  const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(false);
  const [isDocumentsExpanded, setIsDocumentsExpanded] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Inspector form states
  const selectedArea = useMemo(() => {
    return (
      areas.find((a) => a.id === selectedAreaId || a.code === selectedAreaId) ||
      areas[0]
    );
  }, [areas, selectedAreaId]);

  const [inspectorName, setInspectorName] = useState(selectedArea?.name || "");
  const [inspectorType, setInspectorType] = useState(selectedArea?.type || "Bedroom");
  const [inspectorDimensions, setInspectorDimensions] = useState(
    selectedArea?.dimensions || "16ft x 14ft"
  );
  const [inspectorCode, setInspectorCode] = useState(selectedArea?.code || "");
  const [inspectorDesc, setInspectorDesc] = useState(
    selectedArea?.description || ""
  );
  const [includedByDefault, setIncludedByDefault] = useState(
    selectedArea?.includedByDefault ?? true
  );
  const [allowRename, setAllowRename] = useState(
    selectedArea?.allowRename ?? true
  );
  const [excludeByDefault, setExcludeByDefault] = useState(false);
  const [requiredArea, setRequiredArea] = useState(
    selectedArea?.requiredArea ?? true
  );

  // Expanded sections within the middle panel
  const [expandedSectionIds, setExpandedSectionIds] = useState<
    Record<string, boolean>
  >(() => {
    const firstSec = selectedArea?.sections?.[0]?.id;
    return firstSec ? { [firstSec]: true } : {};
  });

  // Keep inspector form in sync when selectedArea changes
  useEffect(() => {
    if (selectedArea) {
      setInspectorName(selectedArea.name);
      setInspectorType(selectedArea.type || "Bedroom");
      setInspectorDimensions(selectedArea.dimensions || "16ft x 14ft");
      setInspectorCode(selectedArea.code || "");
      setInspectorDesc(selectedArea.description || "");
      setIncludedByDefault(selectedArea.includedByDefault ?? true);
      setAllowRename(selectedArea.allowRename ?? true);
      setRequiredArea(selectedArea.requiredArea ?? true);
      setExcludeByDefault(false);
      setSaveSuccess(false);
      setSaveError(null);

      if (selectedArea.sections && selectedArea.sections.length > 0) {
        setExpandedSectionIds({ [selectedArea.sections[0].id]: true });
      }
    }
  }, [selectedArea?.id]);

  const handleSelectArea = (area: StructureArea) => {
    setSelectedAreaId(area.id);
    setIsInspectorOpen(true);
  };

  const toggleSectionExpand = (secId: string) => {
    setExpandedSectionIds((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  // Drag-and-drop reordering for areas
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetIdx: number) => {
    if (draggedIndex === null || draggedIndex === targetIdx) {
      setDraggedIndex(null);
      return;
    }

    const reordered = [...areas];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIdx, 0, moved);

    setAreas(reordered);
    setDraggedIndex(null);

    try {
      await updateTemplateSection(templateId, "structure", {
        data: { areas: reordered },
      });
      onUpdate?.();
    } catch {}
  };

  // Save changes from inspector to real backend
  const handleSaveChanges = async () => {
    if (!selectedArea) return;
    try {
      setSaving(true);
      setSaveError(null);

      const updatedAreas = areas.map((a) => {
        if (a.id === selectedArea.id) {
          return {
            ...a,
            name: inspectorName,
            type: inspectorType,
            dimensions: inspectorDimensions,
            code: inspectorCode,
            description: inspectorDesc,
            includedByDefault,
            allowRename,
            requiredArea,
          };
        }
        return a;
      });

      setAreas(updatedAreas);

      await updateTemplateSection(templateId, "structure", {
        data: { areas: updatedAreas },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onUpdate?.();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save structure changes";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Add Structure Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaType, setNewAreaType] = useState("Bedroom");
  const [newAreaDimensions, setNewAreaDimensions] = useState("16ft x 14ft");
  const [newAreaCode, setNewAreaCode] = useState("");
  const [newAreaDesc, setNewAreaDesc] = useState("");
  const [newIncludedByDefault, setNewIncludedByDefault] = useState(true);
  const [newAllowRename, setNewAllowRename] = useState(true);
  const [newRequiredArea, setNewRequiredArea] = useState(false);
  const [creatingArea, setCreatingArea] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    const codeGuess = `RM-0${areas.length + 1}`;
    setNewAreaName("");
    setNewAreaType("Bedroom");
    setNewAreaDimensions("16ft x 14ft");
    setNewAreaCode(codeGuess);
    setNewAreaDesc("Interior room structure with predefined BOQ sections.");
    setNewIncludedByDefault(true);
    setNewAllowRename(true);
    setNewRequiredArea(false);
    setCreateError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) {
      setCreateError("Structure Name is required.");
      return;
    }

    try {
      setCreatingArea(true);
      setCreateError(null);

      const newId = `area-${Date.now()}`;
      const newArea: StructureArea = {
        id: newId,
        name: newAreaName.trim(),
        type: newAreaType,
        dimensions: newAreaDimensions.trim() || "14ft x 12ft",
        code: newAreaCode.trim() || `RM-${areas.length + 1}`,
        description:
          newAreaDesc.trim() || `${newAreaName} interior room structure`,
        includedByDefault: newIncludedByDefault,
        allowRename: newAllowRename,
        requiredArea: newRequiredArea,
        sections: [
          {
            id: `sec-${Date.now()}`,
            name: "General Works",
            code: "BOQ-01",
            itemsCount: 0,
            totalValue: 0,
            items: [],
          },
        ],
      };

      const nextAreas = [...areas, newArea];
      setAreas(nextAreas);

      await updateTemplateSection(templateId, "structure", {
        data: { areas: nextAreas },
      });

      handleSelectArea(newArea);
      setIsAddModalOpen(false);
      onUpdate?.();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create structure";
      setCreateError(msg);
    } finally {
      setCreatingArea(false);
    }
  };

  // Filter areas based on search query
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areas;
    const q = searchQuery.toLowerCase();
    return areas.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.code && a.code.toLowerCase().includes(q)) ||
        (a.type && a.type.toLowerCase().includes(q))
    );
  }, [areas, searchQuery]);

  // Dynamic counts for Workflow and Documents
  const workflowCount =
    composition?.stages ||
    composition?.tasks ||
    (Array.isArray(workflow?.stages)
      ? workflow.stages.length
      : Array.isArray(workflow?.tasks)
      ? workflow.tasks.length
      : 6);

  const documentsCount =
    composition?.documents ||
    (Array.isArray(documents) ? documents.length : 4);

  const sectionsToRender = selectedArea?.sections || [];

  return (
    <>
      <div
        className={`td-structure-layout ${
          !isInspectorOpen ? "no-inspector" : ""
        }`}
      >
        {/* ── Column 1: Left Project Structure Sidebar ──────────────── */}
        <aside className="td-structure-sidebar" aria-label="Project Structure">
          <div className="td-struct-sidebar-header">
            <span className="td-struct-sidebar-title">PROJECT STRUCTURE</span>
          </div>

          {/* Search Box matching Figma Frame 76 */}
          <div className="td-struct-search-box">
            <div className="td-struct-search-icon-box" aria-hidden="true">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search structure"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="td-struct-search-input"
              aria-label="Search structure"
            />
          </div>

          <hr className="td-struct-divider" />

          {/* Hierarchy Groups Tree */}
          <div className="td-struct-tree" role="tree">
            {/* Group 1: Areas Group Header */}
            <div
              className="td-struct-tree-group-header"
              onClick={() => setIsAreasExpanded(!isAreasExpanded)}
              role="treeitem"
              aria-expanded={isAreasExpanded}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setIsAreasExpanded(!isAreasExpanded);
                }
              }}
            >
              <div className="td-struct-group-title-left">
                <Home size={18} />
                <span>Areas ({areas.length})</span>
              </div>
              <ChevronDown
                size={18}
                className={`td-struct-group-chevron ${
                  !isAreasExpanded ? "collapsed" : ""
                }`}
              />
            </div>

            {/* Nested Area Rows */}
            {isAreasExpanded && (
              <div className="td-struct-areas-list" role="group">
                {filteredAreas.length === 0 ? (
                  <div
                    style={{
                      padding: "10px 8px",
                      fontSize: "13px",
                      color: "#64748B",
                      textAlign: "center",
                    }}
                  >
                    No matching areas found.
                  </div>
                ) : (
                  filteredAreas.map((area, idx) => {
                    const isSelected =
                      area.id === selectedAreaId || area.code === selectedAreaId;
                    return (
                      <div
                        key={area.id || idx}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(idx)}
                        className={`td-struct-area-row ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => handleSelectArea(area)}
                        role="treeitem"
                        aria-selected={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleSelectArea(area);
                          }
                        }}
                      >
                        <div className="td-struct-area-left">
                          <GripVertical size={16} className="grip-icon" />
                          <Folder size={18} className="folder-icon" />
                          <span className="area-title">{area.name}</span>
                        </div>

                        {isSelected && (
                          <button
                            type="button"
                            className="td-struct-kebab-btn"
                            title="Structure options"
                            aria-label={`Options for ${area.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsInspectorOpen(true);
                            }}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <hr className="td-struct-divider" />

            {/* Group 2: Workflow (Dynamic Count) */}
            <div
              className="td-struct-tree-group-header"
              onClick={() => {
                setIsWorkflowExpanded(!isWorkflowExpanded);
                if (onNavigateTab) onNavigateTab("Workflow");
              }}
              role="treeitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (onNavigateTab) onNavigateTab("Workflow");
                }
              }}
            >
              <div className="td-struct-group-title-left">
                <GitMerge size={18} />
                <span>Workflow ({workflowCount})</span>
              </div>
              <ChevronRight size={18} />
            </div>

            {/* Group 3: Documents (Dynamic Count) */}
            <div
              className="td-struct-tree-group-header"
              onClick={() => {
                setIsDocumentsExpanded(!isDocumentsExpanded);
                if (onNavigateTab) onNavigateTab("Documents");
              }}
              role="treeitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (onNavigateTab) onNavigateTab("Documents");
                }
              }}
            >
              <div className="td-struct-group-title-left">
                <FileText size={18} />
                <span>Documents ({documentsCount})</span>
              </div>
              <ChevronRight size={18} />
            </div>
          </div>

          <hr className="td-struct-divider" />

          {/* Add Structure Button matching Figma */}
          <button
            type="button"
            className="td-add-structure-btn"
            onClick={handleOpenAddModal}
          >
            <Plus size={18} />
            <span>Add Structure</span>
          </button>
        </aside>

        {/* ── Column 2: Center BOQ Sections Editor ──────────────────── */}
        <section
          className="td-structure-center"
          aria-label="BOQ Sections & Items"
        >
          <div className="td-center-header">
            <h3 className="td-center-title">
              BOQ Sections ({sectionsToRender.length})
            </h3>
            {!isInspectorOpen && (
              <div className="td-center-header-actions">
                <button
                  type="button"
                  className="td-toggle-inspector-btn"
                  onClick={() => setIsInspectorOpen(true)}
                  title="Open Inspector"
                >
                  <SlidersHorizontal size={14} />
                  <span>Inspect Area</span>
                </button>
              </div>
            )}
          </div>

          <hr className="td-struct-divider" />

          {/* List of BOQ Sections */}
          <div className="td-sections-accordions">
            {sectionsToRender.length === 0 ? (
              <div
                style={{
                  padding: "36px 16px",
                  textAlign: "center",
                  color: "#64748B",
                  background: "#FFFFFF",
                  borderRadius: "8px",
                  border: "1px dashed #CBD5E1",
                  width: "100%",
                }}
              >
                <p style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
                  No BOQ sections configured for {selectedArea?.name || "this area"}.
                </p>
                <button
                  type="button"
                  className="td-modal-btn-primary"
                  onClick={() => {
                    const newSecId = `sec-${Date.now()}`;
                    const newSec: StructureSection = {
                      id: newSecId,
                      name: "Custom Works",
                      code: `BOQ-0${sectionsToRender.length + 1}`,
                      itemsCount: 0,
                      totalValue: 0,
                      items: [],
                    };
                    const updated = areas.map((a) => {
                      if (a.id === selectedArea?.id) {
                        return { ...a, sections: [...(a.sections || []), newSec] };
                      }
                      return a;
                    });
                    setAreas(updated);
                    setExpandedSectionIds({ [newSecId]: true });
                  }}
                >
                  <Plus size={14} style={{ display: "inline", marginRight: 4 }} />
                  <span>Add BOQ Section</span>
                </button>
              </div>
            ) : (
              sectionsToRender.map((section, idx) => {
                const isExpanded = !!expandedSectionIds[section.id];
                const sectionNumber = String(idx + 1).padStart(2, "0");
                const itemsCount =
                  section.items?.length ?? section.itemsCount ?? 0;

                return (
                  <div key={section.id || idx} className="td-section-card">
                    {/* Section Header Card (Frame 12) */}
                    <div
                      className="td-section-card-header"
                      onClick={() => toggleSectionExpand(section.id)}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isExpanded}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          toggleSectionExpand(section.id);
                        }
                      }}
                    >
                      <div className="td-sec-header-left">
                        <GripVertical size={16} className="grip-icon" />
                        <span className="td-sec-num-badge">{sectionNumber}</span>
                        <span className="td-sec-name">{section.name}</span>
                      </div>

                      <div className="td-sec-header-right">
                        <span className="td-sec-items-count">
                          {itemsCount} Items
                        </span>
                        <ChevronRight
                          size={16}
                          className={`td-sec-expand-arrow ${
                            isExpanded ? "expanded" : ""
                          }`}
                        />
                        <button
                          type="button"
                          className="td-sec-add-btn"
                          title="Add item"
                          aria-label="Add item"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newItem: StructureItem = {
                              id: `itm-${Date.now()}`,
                              name: "New Custom Material",
                              code: `MAT-00${(section.items?.length || 0) + 1}`,
                              type: "Material",
                              unit: "Sheet",
                              baseCost: 1000,
                              sellingRate: 1400,
                              margin: "28.57%",
                              preferredVendor: "Century Ply",
                              rateStatus: "ACTIVE",
                              updatedAt: "Today",
                            };
                            const updated = areas.map((a) => {
                              if (a.id === selectedArea?.id) {
                                return {
                                  ...a,
                                  sections: a.sections.map((s) => {
                                    if (s.id === section.id) {
                                      return {
                                        ...s,
                                        items: [...(s.items || []), newItem],
                                        itemsCount: (s.items?.length || 0) + 1,
                                      };
                                    }
                                    return s;
                                  }),
                                };
                              }
                              return a;
                            });
                            setAreas(updated);
                            setExpandedSectionIds((prev) => ({
                              ...prev,
                              [section.id]: true,
                            }));
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Items Table (Frames 57, 59, 60...) */}
                    {isExpanded && (
                      <div className="td-section-items-table-wrap">
                        <table className="td-struct-table">
                          <thead>
                            <tr>
                              <th style={{ width: "24%" }}>ITEM</th>
                              <th style={{ width: "10%" }}>TYPE</th>
                              <th style={{ width: "8%" }}>UNIT</th>
                              <th
                                style={{ width: "12%" }}
                                className="col-center"
                              >
                                BASE COST (₹)
                              </th>
                              <th
                                style={{ width: "12%" }}
                                className="col-center"
                              >
                                SELLING RATE (₹)
                              </th>
                              <th style={{ width: "9%" }}>MARGIN</th>
                              <th style={{ width: "13%" }}>PREFERRED VENDOR</th>
                              <th style={{ width: "10%" }}>RATE STATUS</th>
                              <th style={{ width: "10%" }}>UPDATED</th>
                              <th
                                style={{ width: "4%" }}
                                className="col-center"
                              >
                                &nbsp;
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(section.items || []).length === 0 ? (
                              <tr>
                                <td
                                  colSpan={10}
                                  style={{
                                    textAlign: "center",
                                    padding: "24px 0",
                                    color: "#94A3B8",
                                  }}
                                >
                                  No items in this section. Click the &ldquo;+&rdquo; button above to add an item.
                                </td>
                              </tr>
                            ) : (
                              (section.items || []).map((item, itemIdx) => {
                                const baseCostFormatted = Number(
                                  item.baseCost ?? 0
                                ).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                });

                                const sellingRateFormatted = Number(
                                  item.sellingRate ?? item.rate ?? 0
                                ).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                });

                                const marginText =
                                  item.margin ||
                                  (item.sellingRate && item.baseCost
                                    ? (
                                        ((item.sellingRate - item.baseCost) /
                                          item.sellingRate) *
                                        100
                                      ).toFixed(2) + "%"
                                    : "28.00%");

                                const status = (
                                  item.rateStatus || "ACTIVE"
                                ).toUpperCase();
                                const isItemActive = status === "ACTIVE";

                                return (
                                  <tr key={item.id || itemIdx}>
                                    {/* Col 1: ITEM */}
                                    <td>
                                      <div className="td-struct-item-cell">
                                        <div className="td-struct-item-thumb">
                                          <span>📦</span>
                                        </div>
                                        <div className="td-struct-item-texts">
                                          <span className="td-struct-item-name">
                                            {item.name}
                                          </span>
                                          <span className="td-struct-item-code">
                                            {item.code || `MAT-00${itemIdx + 1}`}
                                          </span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Col 2: TYPE */}
                                    <td>
                                      <span className="td-struct-cell-muted">
                                        {item.type || "Material"}
                                      </span>
                                    </td>

                                    {/* Col 3: UNIT */}
                                    <td>
                                      <span className="td-struct-cell-muted">
                                        {item.unit || "Sheet"}
                                      </span>
                                    </td>

                                    {/* Col 4: BASE COST (₹) */}
                                    <td>
                                      <div className="td-struct-cell-num">
                                        {baseCostFormatted}
                                      </div>
                                    </td>

                                    {/* Col 5: SELLING RATE (₹) */}
                                    <td>
                                      <div className="td-struct-cell-num">
                                        {sellingRateFormatted}
                                      </div>
                                    </td>

                                    {/* Col 6: MARGIN */}
                                    <td>
                                      <span className="td-struct-cell-margin">
                                        {marginText}
                                      </span>
                                    </td>

                                    {/* Col 7: PREFERRED VENDOR */}
                                    <td>
                                      <div className="td-struct-vendor-cell">
                                        <div className="td-struct-vendor-avatar">
                                          {(
                                            item.preferredVendor || "Century Ply"
                                          ).charAt(0)}
                                        </div>
                                        <span className="td-struct-cell-muted">
                                          {item.preferredVendor ||
                                            "Century Ply"}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Col 8: RATE STATUS */}
                                    <td>
                                      <span
                                        className={`td-struct-status-pill ${
                                          isItemActive ? "active" : "draft"
                                        }`}
                                      >
                                        {status}
                                      </span>
                                    </td>

                                    {/* Col 9: UPDATED */}
                                    <td>
                                      <span className="td-struct-cell-muted">
                                        {item.updatedAt || "5 Aug 2024"}
                                      </span>
                                    </td>

                                    {/* Col 10: Actions */}
                                    <td className="td-struct-action-cell">
                                      <button
                                        type="button"
                                        className="td-struct-row-kebab"
                                        title="Item options"
                                        aria-label="Item options"
                                      >
                                        <MoreHorizontal size={18} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ── Column 3: Right Inspector Panel ───────────────────────── */}
        {isInspectorOpen && (
          <aside className="td-inspector-panel" aria-label="Area Inspector">
            <div className="td-inspector-header">
              <span className="td-inspector-title">INSPECTOR</span>
              <button
                type="button"
                className="td-inspector-close"
                onClick={() => setIsInspectorOpen(false)}
                aria-label="Close inspector"
                title="Close inspector"
              >
                <X size={18} />
              </button>
            </div>

            <hr className="td-struct-divider" />

            <div className="td-inspector-body">
              {saveSuccess && (
                <div
                  className="td-inspector-alert success"
                  style={{
                    background: "#ECFDF5",
                    color: "#059669",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                  }}
                >
                  <Check size={16} />
                  <span>Changes saved to backend.</span>
                </div>
              )}

              {saveError && (
                <div
                  className="td-inspector-alert error"
                  style={{
                    background: "#FEF2F2",
                    color: "#DC2626",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                >
                  <span>{saveError}</span>
                </div>
              )}

              {/* General Section */}
              <div className="td-inspector-section">
                <span className="td-inspector-section-heading">General</span>

                {/* Name */}
                <div className="td-inspector-field">
                  <label className="td-inspector-label">
                    Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="td-inspector-input"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    placeholder="e.g. Master Bedroom"
                  />
                </div>

                {/* Area Type */}
                <div className="td-inspector-field">
                  <label className="td-inspector-label">
                    Area Type <span className="req">*</span>
                  </label>
                  <select
                    className="td-inspector-select"
                    value={inspectorType}
                    onChange={(e) => setInspectorType(e.target.value)}
                  >
                    <option value="Bedroom">Bedroom</option>
                    <option value="Living Room">Living Room</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Bathroom">Bathroom</option>
                    <option value="Dining">Dining</option>
                    <option value="Entrance">Entrance</option>
                    <option value="Balcony">Balcony</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                {/* Area Dimensions */}
                <div className="td-inspector-field">
                  <label className="td-inspector-label">
                    Area Dimensions <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="td-inspector-input"
                    value={inspectorDimensions}
                    onChange={(e) => setInspectorDimensions(e.target.value)}
                    placeholder="e.g. 16ft x 14ft"
                  />
                </div>

                {/* Code */}
                <div className="td-inspector-field">
                  <label className="td-inspector-label">Code</label>
                  <input
                    type="text"
                    className="td-inspector-input"
                    value={inspectorCode}
                    onChange={(e) => setInspectorCode(e.target.value)}
                    placeholder="e.g. BED-MST"
                  />
                </div>

                {/* Description with character count */}
                <div className="td-inspector-field">
                  <div className="td-inspector-label-row">
                    <label className="td-inspector-label">
                      Description <span className="req">*</span>
                    </label>
                    <span className="td-inspector-char-count">
                      {inspectorDesc.length}/200
                    </span>
                  </div>
                  <textarea
                    className="td-inspector-textarea"
                    rows={3}
                    maxLength={200}
                    value={inspectorDesc}
                    onChange={(e) => setInspectorDesc(e.target.value)}
                    placeholder="Enter area description..."
                  />
                </div>
              </div>

              <hr className="td-struct-divider" />

              {/* Behaviour Section */}
              <div className="td-inspector-section">
                <span className="td-inspector-section-heading">Behaviour</span>

                {/* Included by Default */}
                <div
                  className="td-inspector-checkbox-row"
                  onClick={() => setIncludedByDefault(!includedByDefault)}
                  role="checkbox"
                  aria-checked={includedByDefault}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setIncludedByDefault(!includedByDefault);
                    }
                  }}
                >
                  <div
                    className={`td-inspector-checkbox-box ${
                      includedByDefault ? "checked" : "unchecked"
                    }`}
                  >
                    {includedByDefault && <Check size={14} />}
                  </div>
                  <span className="td-inspector-checkbox-label">
                    Included by Default
                  </span>
                </div>

                {/* Allow Rename in Project */}
                <div
                  className="td-inspector-checkbox-row"
                  onClick={() => setAllowRename(!allowRename)}
                  role="checkbox"
                  aria-checked={allowRename}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setAllowRename(!allowRename);
                    }
                  }}
                >
                  <div
                    className={`td-inspector-checkbox-box ${
                      allowRename ? "checked" : "unchecked"
                    }`}
                  >
                    {allowRename && <Check size={14} />}
                  </div>
                  <span className="td-inspector-checkbox-label">
                    Allow Rename in Project
                  </span>
                </div>

                {/* Exclude by Default */}
                <div
                  className="td-inspector-checkbox-row"
                  onClick={() => setExcludeByDefault(!excludeByDefault)}
                  role="checkbox"
                  aria-checked={excludeByDefault}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setExcludeByDefault(!excludeByDefault);
                    }
                  }}
                >
                  <div
                    className={`td-inspector-checkbox-box ${
                      excludeByDefault ? "checked" : "unchecked"
                    }`}
                  >
                    {excludeByDefault && <Check size={14} />}
                  </div>
                  <span className="td-inspector-checkbox-label">
                    Optional Area in Project
                  </span>
                </div>

                {/* Required Area */}
                <div
                  className="td-inspector-checkbox-row"
                  onClick={() => setRequiredArea(!requiredArea)}
                  role="checkbox"
                  aria-checked={requiredArea}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setRequiredArea(!requiredArea);
                    }
                  }}
                >
                  <div
                    className={`td-inspector-checkbox-box ${
                      requiredArea ? "checked" : "unchecked"
                    }`}
                  >
                    {requiredArea && <Check size={14} />}
                  </div>
                  <span className="td-inspector-checkbox-label">
                    Required Area
                  </span>
                </div>
              </div>

              <hr className="td-struct-divider" />

              {/* Save Changes Button */}
              <button
                type="button"
                className="td-inspector-save-btn"
                onClick={handleSaveChanges}
                disabled={saving}
              >
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Add Structure Modal ────────────────────────────────────── */}
      {isAddModalOpen && (
        <div
          className="td-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-structure-title"
        >
          <div className="td-modal-card">
            <div className="td-modal-header">
              <h3 id="add-structure-title" className="td-modal-title">
                Add Project Structure
              </h3>
              <button
                type="button"
                className="td-modal-close"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div
                style={{
                  background: "#FEF2F2",
                  color: "#DC2626",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              >
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateAreaSubmit}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div className="td-inspector-field">
                  <label className="td-inspector-label">
                    Structure / Area Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="td-inspector-input"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    placeholder="e.g. Balcony or Guest Bedroom"
                    required
                    autoFocus
                  />
                </div>

                <div className="td-inspector-field">
                  <label className="td-inspector-label">
                    Area Type <span className="req">*</span>
                  </label>
                  <select
                    className="td-inspector-select"
                    value={newAreaType}
                    onChange={(e) => setNewAreaType(e.target.value)}
                  >
                    <option value="Bedroom">Bedroom</option>
                    <option value="Living Room">Living Room</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Bathroom">Bathroom</option>
                    <option value="Dining">Dining</option>
                    <option value="Balcony">Balcony</option>
                    <option value="Entrance">Entrance</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div className="td-inspector-field">
                  <label className="td-inspector-label">Dimensions</label>
                  <input
                    type="text"
                    className="td-inspector-input"
                    value={newAreaDimensions}
                    onChange={(e) => setNewAreaDimensions(e.target.value)}
                    placeholder="e.g. 14ft x 12ft"
                  />
                </div>

                <div className="td-inspector-field">
                  <label className="td-inspector-label">Code</label>
                  <input
                    type="text"
                    className="td-inspector-input"
                    value={newAreaCode}
                    onChange={(e) => setNewAreaCode(e.target.value)}
                    placeholder="e.g. BAL-01"
                  />
                </div>

                <div className="td-inspector-field">
                  <label className="td-inspector-label">Description</label>
                  <textarea
                    className="td-inspector-textarea"
                    rows={2}
                    value={newAreaDesc}
                    onChange={(e) => setNewAreaDesc(e.target.value)}
                    placeholder="Area specifications..."
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div
                    className="td-inspector-checkbox-row"
                    onClick={() => setNewIncludedByDefault(!newIncludedByDefault)}
                  >
                    <div
                      className={`td-inspector-checkbox-box ${
                        newIncludedByDefault ? "checked" : "unchecked"
                      }`}
                    >
                      {newIncludedByDefault && <Check size={14} />}
                    </div>
                    <span className="td-inspector-checkbox-label">
                      Included by Default
                    </span>
                  </div>

                  <div
                    className="td-inspector-checkbox-row"
                    onClick={() => setNewAllowRename(!newAllowRename)}
                  >
                    <div
                      className={`td-inspector-checkbox-box ${
                        newAllowRename ? "checked" : "unchecked"
                      }`}
                    >
                      {newAllowRename && <Check size={14} />}
                    </div>
                    <span className="td-inspector-checkbox-label">
                      Allow Rename in Project
                    </span>
                  </div>

                  <div
                    className="td-inspector-checkbox-row"
                    onClick={() => setNewRequiredArea(!newRequiredArea)}
                  >
                    <div
                      className={`td-inspector-checkbox-box ${
                        newRequiredArea ? "checked" : "unchecked"
                      }`}
                    >
                      {newRequiredArea && <Check size={14} />}
                    </div>
                    <span className="td-inspector-checkbox-label">
                      Required Area
                    </span>
                  </div>
                </div>
              </div>

              <div className="td-modal-actions">
                <button
                  type="button"
                  className="td-modal-btn-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="td-modal-btn-primary"
                  disabled={creatingArea}
                >
                  <span>{creatingArea ? "Creating..." : "Create Structure"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
