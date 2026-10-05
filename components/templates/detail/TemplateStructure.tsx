"use client";

import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Layers,
  FileText,
  X,
  GripVertical,
  Check,
} from "lucide-react";
import { updateTemplateSection } from "@/lib/api/templates";
import type { MockArea } from "@/lib/templates/types";

interface TemplateStructureProps {
  templateId: string;
  initialAreas?: MockArea[];
  onUpdate?: () => void;
}

export default function TemplateStructure({
  templateId,
  initialAreas,
  onUpdate,
}: TemplateStructureProps) {
  const areasList = initialAreas || [];

  const [areas, setAreas] = useState<MockArea[]>(areasList);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    areasList[0]?.id || "area-master-bedroom"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAreasExpanded, setIsAreasExpanded] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Inspector form state for the currently selected area
  const selectedArea =
    areas.find((a) => a.id === selectedAreaId) || areas[0];

  const [inspectorName, setInspectorName] = useState(selectedArea?.name || "");
  const [inspectorType, setInspectorType] = useState(selectedArea?.type || "");
  const [inspectorDimensions, setInspectorDimensions] = useState(
    selectedArea?.dimensions || ""
  );
  const [inspectorCode, setInspectorCode] = useState(selectedArea?.code || "");
  const [inspectorDesc, setInspectorDesc] = useState(
    selectedArea?.description ||
      ""
  );
  const [includedByDefault, setIncludedByDefault] = useState(
    selectedArea?.includedByDefault ?? true
  );
  const [allowRename, setAllowRename] = useState(
    selectedArea?.allowRename ?? true
  );
  const [requiredArea, setRequiredArea] = useState(
    selectedArea?.requiredArea ?? true
  );

  // Expanded BOQ sections inside the center editor
  const [expandedSectionIds, setExpandedSectionIds] = useState<Record<string, boolean>>({
    [selectedArea?.sections?.[0]?.id || "sec-furniture"]: true,
  });

  const handleSelectArea = (area: MockArea) => {
    setSelectedAreaId(area.id);
    setInspectorName(area.name);
    setInspectorType(area.type || "");
    setInspectorDimensions(area.dimensions || "");
    setInspectorCode(area.code || "");
    setInspectorDesc(
      area.description ||
        ""
    );
    setIncludedByDefault(area.includedByDefault ?? true);
    setAllowRename(area.allowRename ?? true);
    setRequiredArea(area.requiredArea ?? true);
    setIsInspectorOpen(true);
    setSaveSuccess(false);
    setSaveError(null);

    if (area.sections && area.sections.length > 0) {
      setExpandedSectionIds({ [area.sections[0].id]: true });
    }
  };

  const toggleSectionExpand = (secId: string) => {
    setExpandedSectionIds((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      // Update local area state
      const updatedAreas = areas.map((a) => {
        if (a.id === selectedAreaId) {
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

      // Persist to real backend via updateTemplateSection
      await updateTemplateSection(templateId, "structure", {
        data: { areas: updatedAreas },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onUpdate?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save structure";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStructure = () => {
    const newId = `area-${Date.now()}`;
    const newArea: MockArea = {
      id: newId,
      name: "New Room",
      type: "Custom",
      dimensions: "12ft x 10ft",
      code: `RM-${areas.length + 1}`,
      description: "Custom interior room structure",
      includedByDefault: true,
      allowRename: true,
      requiredArea: false,
      sections: [
        {
          id: `sec-${Date.now()}`,
          name: "General Works",
          itemsCount: 0,
          totalValue: 0,
          items: [],
        },
      ],
    };
    const nextAreas = [...areas, newArea];
    setAreas(nextAreas);
    handleSelectArea(newArea);
  };

  const filteredAreas = areas.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sectionsToRender =
    selectedArea?.sections && selectedArea.sections.length > 0
      ? selectedArea.sections
      : [
          {
            id: "sec-furniture",
            name: "Furniture",
            itemsCount: 24,
            totalValue: 482000,
            items: [],
          },
          {
            id: "sec-electrical",
            name: "Electrical",
            itemsCount: 28,
            totalValue: 125000,
            items: [],
          },
          {
            id: "sec-painting",
            name: "Painting",
            itemsCount: 12,
            totalValue: 95000,
            items: [],
          },
        ];

  return (
    <div className="td-structure-layout">
      {/* ── Column 1: Left Project Structure Sidebar ──────────────── */}
      <aside className="td-structure-sidebar">
        <div className="td-struct-sidebar-header">
          <span className="td-struct-sidebar-title">PROJECT STRUCTURE</span>
        </div>

        <div className="td-struct-search-box">
          <Search size={14} className="td-struct-search-icon" />
          <input
            type="text"
            placeholder="Search structure"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="td-struct-search-input"
          />
        </div>

        <div className="td-struct-tree">
          {/* Areas Tree Header */}
          <div
            className="td-struct-tree-group-header"
            onClick={() => setIsAreasExpanded(!isAreasExpanded)}
          >
            <div className="td-struct-group-title-left">
              <span className="group-icon">⊞</span>
              <span className="group-label">Areas ({areas.length})</span>
            </div>
            {isAreasExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>

          {/* Areas List */}
          {isAreasExpanded && (
            <div className="td-struct-areas-list">
              {filteredAreas.map((area) => {
                const isSelected = area.id === selectedAreaId;
                return (
                  <div
                    key={area.id}
                    className={`td-struct-area-row ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectArea(area)}
                  >
                    <div className="td-struct-area-left">
                      <GripVertical size={13} className="grip-icon" />
                      <span className="door-icon">🚪</span>
                      <span className="area-title">{area.name}</span>
                    </div>

                    {isSelected && (
                      <button
                        type="button"
                        className="td-struct-kebab-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Workflow Item in Tree */}
          <div className="td-struct-tree-group-header" style={{ marginTop: 8 }}>
            <div className="td-struct-group-title-left">
              <Layers size={14} />
              <span className="group-label">Workflow (6)</span>
            </div>
            <ChevronRight size={14} />
          </div>

          {/* Documents Item in Tree */}
          <div className="td-struct-tree-group-header">
            <div className="td-struct-group-title-left">
              <FileText size={14} />
              <span className="group-label">Documents (4)</span>
            </div>
            <ChevronRight size={14} />
          </div>
        </div>

        <div className="td-struct-sidebar-footer">
          <button
            type="button"
            className="td-add-structure-btn"
            onClick={handleAddStructure}
          >
            <Plus size={15} />
            <span>Add Structure</span>
          </button>
        </div>
      </aside>

      {/* ── Column 2: Center BOQ Sections Editor ──────────────────── */}
      <section className="td-structure-center">
        <div className="td-center-header">
          <h3 className="td-center-title">
            BOQ Sections ({sectionsToRender.length})
          </h3>
        </div>

        <div className="td-sections-accordions">
          {sectionsToRender.map((section, idx) => {
            const isExpanded = !!expandedSectionIds[section.id];
            const sectionNumber = String(idx + 1).padStart(2, "0");
            const itemsCount =
              section.items?.length || section.itemsCount || 24;

            return (
              <div key={section.id} className="td-section-card">
                <div
                  className="td-section-card-header"
                  onClick={() => toggleSectionExpand(section.id)}
                >
                  <div className="td-sec-header-left">
                    <GripVertical size={14} className="grip-icon" />
                    <span className="sec-num-badge">{sectionNumber}</span>
                    <span className="sec-name">{section.name}</span>
                  </div>

                  <div className="td-sec-header-right">
                    <span className="sec-items-count">{itemsCount} Items</span>
                    {isExpanded ? (
                      <ChevronDown size={15} />
                    ) : (
                      <ChevronRight size={15} />
                    )}
                    <button
                      type="button"
                      className="sec-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      title="Add item"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="td-section-items-table-wrap">
                    <table className="td-struct-items-table">
                      <thead>
                        <tr>
                          <th style={{ width: "35%" }}>ITEM</th>
                          <th style={{ width: "15%" }}>TYPE</th>
                          <th style={{ width: "15%" }}>UNIT</th>
                          <th style={{ width: "17%" }}>BASE COST (₹)</th>
                          <th style={{ width: "18%" }}>SELLING RATE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(section.items || []).map((item, itemIdx) => (
                          <tr key={item.id || itemIdx}>
                            <td>
                              <div className="td-item-name-cell">
                                <div className="td-item-thumb-box" />
                                <div className="td-item-name-text-col">
                                  <span className="item-title">{item.name}</span>
                                  <span className="item-code">
                                    {item.code || `MAT-BRD-${itemIdx + 1}`}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="cell-muted">{item.type || "Material"}</span>
                            </td>
                            <td>
                              <span className="cell-muted">{item.unit || "Sheet"}</span>
                            </td>
                            <td>
                              <span className="cell-num">
                                {Number(item.baseCost || 1200).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </td>
                            <td>
                              <span className="cell-num">
                                {Number(item.sellingRate || 1650).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Column 3: Right Inspector Panel ───────────────────────── */}
      {isInspectorOpen && (
        <aside className="td-inspector-panel">
          <div className="td-inspector-header">
            <span className="td-inspector-title">INSPECTOR</span>
            <button
              type="button"
              className="td-inspector-close"
              onClick={() => setIsInspectorOpen(false)}
              aria-label="Close inspector"
            >
              <X size={15} />
            </button>
          </div>

          <div className="td-inspector-body">
            {saveSuccess && (
              <div className="td-inspector-alert success">
                <Check size={14} />
                <span>Changes saved to backend.</span>
              </div>
            )}
            {saveError && (
              <div className="td-inspector-alert error">
                <span>{saveError}</span>
              </div>
            )}

            <div className="td-inspector-section">
              <span className="td-inspector-section-heading">General</span>

              <div className="td-form-group">
                <label className="td-form-label">
                  Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="td-form-input"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">
                  Area Type <span className="req">*</span>
                </label>
                <div className="td-select-wrapper">
                  <select
                    className="td-form-select"
                    value={inspectorType}
                    onChange={(e) => setInspectorType(e.target.value)}
                  >
                    <option value="Bedroom">Bedroom</option>
                    <option value="Living Room">Living Room</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Bathroom">Bathroom</option>
                    <option value="Common Area">Common Area</option>
                  </select>
                  <ChevronDown size={14} className="td-select-chevron" />
                </div>
              </div>

              <div className="td-form-group">
                <label className="td-form-label">
                  Area Dimensions <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="td-form-input"
                  value={inspectorDimensions}
                  onChange={(e) => setInspectorDimensions(e.target.value)}
                  placeholder="e.g. 16ft x 14ft"
                />
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Code</label>
                <input
                  type="text"
                  className="td-form-input"
                  value={inspectorCode}
                  onChange={(e) => setInspectorCode(e.target.value)}
                  placeholder="e.g. BED-MST"
                />
              </div>

              <div className="td-form-group">
                <div className="td-form-label-row">
                  <label className="td-form-label">
                    Description <span className="req">*</span>
                  </label>
                  <span className="td-char-count">{inspectorDesc.length}/200</span>
                </div>
                <textarea
                  className="td-form-textarea"
                  rows={3}
                  maxLength={200}
                  value={inspectorDesc}
                  onChange={(e) => setInspectorDesc(e.target.value)}
                />
              </div>
            </div>

            <div className="td-inspector-section">
              <span className="td-inspector-section-heading">Behaviour</span>

              <label className="td-checkbox-label">
                <input
                  type="checkbox"
                  checked={includedByDefault}
                  onChange={(e) => setIncludedByDefault(e.target.checked)}
                />
                <span className="box" />
                <span className="txt">Included by Default</span>
              </label>

              <label className="td-checkbox-label">
                <input
                  type="checkbox"
                  checked={allowRename}
                  onChange={(e) => setAllowRename(e.target.checked)}
                />
                <span className="box" />
                <span className="txt">Allow Rename in Project</span>
              </label>

              <label className="td-checkbox-label">
                <input
                  type="checkbox"
                  checked={requiredArea}
                  onChange={(e) => setRequiredArea(e.target.checked)}
                />
                <span className="box" />
                <span className="txt">Required Area</span>
              </label>
            </div>
          </div>

          <div className="td-inspector-footer">
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
  );
}
