"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import type { MockItem } from "@/lib/templates/mock-data";

interface TemplateCostingBoqProps {
  templateId: string;
  initialItems?: MockItem[];
  onUpdate?: () => void;
}

interface TreeRoom {
  id: string;
  name: string;
  count: number;
  subSections?: { id: string; name: string; count: number }[];
}

const defaultRooms: TreeRoom[] = [
  { id: "rm-entrance", name: "Entrance", count: 8 },
  { id: "rm-living", name: "Living Room", count: 16 },
  { id: "rm-dining", name: "Dining", count: 10 },
  { id: "rm-kitchen", name: "Kitchen", count: 24 },
  {
    id: "rm-master",
    name: "Master Bedroom",
    count: 18,
    subSections: [
      { id: "sec-fur", name: "Furniture", count: 8 },
      { id: "sec-pnt", name: "Painting", count: 6 },
      { id: "sec-ele", name: "Electrical", count: 4 },
    ],
  },
  { id: "rm-bed2", name: "Bedroom 02", count: 16 },
  { id: "rm-bed3", name: "Bedroom 03", count: 16 },
  { id: "rm-baths", name: "Bathrooms", count: 12 },
  { id: "rm-kit2", name: "Kitchen", count: 14 },
  { id: "rm-flr", name: "Flooring", count: 12 },
  { id: "rm-clg", name: "False Ceiling", count: 24 },
];

const sampleItems: MockItem[] = [
  {
    id: "itm-1",
    name: "Full Height Wardrobe",
    description: "19mm BWP ply, laminate finish",
    unit: "Sq.ft",
    quantity: 72,
    baseCost: 2200,
    sellingRate: 2875,
    rate: 2875,
    wastePercent: 5,
    taxPercent: 18,
    amount: 227736,
    rateStatus: "MAPPED",
    code: "MAT-BRD-001",
    type: "Material",
  },
  {
    id: "itm-2",
    name: "King Size Bed",
    description: "Upholstered headboard",
    unit: "Nos",
    quantity: 1,
    baseCost: 38000,
    sellingRate: 45800,
    rate: 45800,
    wastePercent: 0,
    taxPercent: 18,
    amount: 54044,
    rateStatus: "MAPPED",
    code: "MAT-BRD-002",
    type: "Material",
  },
  {
    id: "itm-3",
    name: "Side Table",
    description: "600mm W, laminate finish",
    unit: "Nos",
    quantity: 2,
    baseCost: 5000,
    sellingRate: 6250,
    rate: 6250,
    wastePercent: 5,
    taxPercent: 18,
    amount: 13125,
    rateStatus: "MAPPED",
    code: "MAT-BRD-003",
    type: "Material",
  },
  {
    id: "itm-4",
    name: "Dressing Table",
    description: "With mirror and drawers",
    unit: "Nos",
    quantity: 1,
    baseCost: 20000,
    sellingRate: 24500,
    rate: 24500,
    wastePercent: 5,
    taxPercent: 18,
    amount: 28783,
    rateStatus: "OUTDATED",
    code: "MAT-BRD-004",
    type: "Material",
  },
  {
    id: "itm-5",
    name: "Study Table",
    description: "Laminate top with storage",
    unit: "Nos",
    quantity: 1,
    baseCost: 15000,
    sellingRate: 18750,
    rate: 18750,
    wastePercent: 5,
    taxPercent: 18,
    amount: 22031,
    rateStatus: "MAPPED",
    code: "MAT-BRD-005",
    type: "Material",
  },
  {
    id: "itm-6",
    name: "TV Unit",
    description: "Floating unit, laminate finish",
    unit: "Sq.ft",
    quantity: 18,
    baseCost: 2100,
    sellingRate: 2650,
    rate: 2650,
    wastePercent: 5,
    taxPercent: 18,
    amount: 53667,
    rateStatus: "MAPPED",
    code: "MAT-BRD-006",
    type: "Material",
  },
  {
    id: "itm-7",
    name: "Chest of Drawers",
    description: "4 drawer unit",
    unit: "Nos",
    quantity: 1,
    baseCost: 13000,
    sellingRate: 16500,
    rate: 16500,
    wastePercent: 5,
    taxPercent: 18,
    amount: 19404,
    rateStatus: "MISSING",
    code: "MAT-BRD-007",
    type: "Material",
  },
  {
    id: "itm-8",
    name: "Mirror with Frame",
    description: "900mm x 1200mm",
    unit: "Nos",
    quantity: 1,
    baseCost: 5500,
    sellingRate: 7250,
    rate: 7250,
    wastePercent: 0,
    taxPercent: 18,
    amount: 8555,
    rateStatus: "MAPPED",
    code: "MAT-BRD-008",
    type: "Material",
  },
];

export default function TemplateCostingBoq({
  templateId,
  initialItems,
  onUpdate,
}: TemplateCostingBoqProps) {
  const items = initialItems || [];

  const [selectedSubSec, setSelectedSubSec] = useState("sec-fur");
  const [expandedRoomId, setExpandedRoomId] = useState<string>("rm-master");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const totalQuantity = items.reduce((acc, itm) => acc + (itm.quantity || 1), 0);
  const totalAmount = items.reduce((acc, itm) => acc + (itm.amount || 0), 0);

  const toggleRoomExpand = (roomId: string) => {
    setExpandedRoomId(expandedRoomId === roomId ? "" : roomId);
  };

  return (
    <div className="td-costing-layout">
      {/* ── Left BOQ Structure Sidebar ────────────────────────────── */}
      <aside className="td-costing-sidebar">
        <div className="td-costing-sidebar-header">
          <div className="td-costing-title-group">
            <span className="td-costing-sidebar-title">BOQ STRUCTURE</span>
            <span className="td-costing-sidebar-sub">18 Sections · 186 Items</span>
          </div>
          <button type="button" className="td-sidebar-search-btn" title="Search BOQ">
            <Search size={15} />
          </button>
        </div>

        <div className="td-costing-tree-list">
          {defaultRooms.map((room) => {
            const isExpanded = expandedRoomId === room.id;
            const hasSubs = !!room.subSections && room.subSections.length > 0;

            return (
              <div key={room.id} className="td-costing-tree-item-group">
                <div
                  className="td-costing-tree-room-row"
                  onClick={() => toggleRoomExpand(room.id)}
                >
                  <div className="left">
                    {hasSubs ? (
                      isExpanded ? (
                        <ChevronDown size={14} className="chev" />
                      ) : (
                        <ChevronRight size={14} className="chev" />
                      )
                    ) : (
                      <ChevronRight size={14} className="chev" />
                    )}
                    {isExpanded ? (
                      <FolderOpen size={15} className="folder-icon" />
                    ) : (
                      <Folder size={15} className="folder-icon" />
                    )}
                    <span className="room-name">{room.name}</span>
                  </div>
                  <span className="count-badge">{room.count}</span>
                </div>

                {/* Subsections if expanded */}
                {isExpanded && room.subSections && (
                  <div className="td-costing-subsections-list">
                    {room.subSections.map((sub) => {
                      const isSelected = selectedSubSec === sub.id;
                      return (
                        <div
                          key={sub.id}
                          className={`td-costing-sub-row ${isSelected ? "selected" : ""}`}
                          onClick={() => setSelectedSubSec(sub.id)}
                        >
                          <div className="left">
                            <GripVertical size={13} className="grip" />
                            <span className="file-icon">📋</span>
                            <span className="sub-name">{sub.name}</span>
                          </div>
                          <span className="count-badge">{sub.count}</span>
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
          <button type="button" className="td-add-boq-structure-btn">
            <Plus size={15} />
            <span>Add BOQ Structure</span>
          </button>
        </div>
      </aside>

      {/* ── Center / Main BOQ Table ───────────────────────────────── */}
      <section className="td-costing-main">
        {/* Section Header */}
        <div className="td-costing-main-header">
          <div className="td-costing-main-title-col">
            <h2 className="title">Furniture</h2>
            <span className="sub">Master Bedroom · BOQ Section</span>
            <span className="meta">
              {items.length} Items · ₹{totalAmount.toLocaleString("en-IN")} Illustrative Template Value
            </span>
          </div>

          <div className="td-costing-main-actions">
            <button type="button" className="td-icon-box-btn" title="Edit Section">
              <Edit3 size={15} />
            </button>
            <button type="button" className="td-icon-box-btn" title="Add item">
              <Plus size={15} />
            </button>
            <button type="button" className="td-icon-box-btn" title="More options">
              <MoreHorizontal size={15} />
            </button>
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
              {items.map((item) => {
                const status = item.rateStatus || "MAPPED";
                const statusClass =
                  status === "MAPPED"
                    ? "status-mapped"
                    : status === "OUTDATED"
                    ? "status-outdated"
                    : "status-missing";

                return (
                  <tr key={item.id} className="td-costing-row">
                    <td>
                      <div className="td-costing-item-cell">
                        <GripVertical size={13} className="drag-grip" />
                        <div className="item-text-group">
                          <span className="name">{item.name}</span>
                          <span className="desc">
                            {item.description || "19mm BWP ply, laminate finish"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="unit-txt">{item.unit || "Nos"}</span>
                    </td>
                    <td>
                      <span className="qty-txt">{item.quantity ?? 1}</span>
                    </td>
                    <td>
                      <span className="rate-txt">
                        {Number(item.rate || item.sellingRate || 2875).toLocaleString(
                          "en-IN",
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="pct-txt">{item.wastePercent ?? 5}%</span>
                    </td>
                    <td>
                      <span className="pct-txt">{item.taxPercent ?? 18}%</span>
                    </td>
                    <td>
                      <span className="amount-txt">
                        {Number(item.amount || 227736).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td>
                      <div className={`td-rate-status-pill ${statusClass}`}>
                        <span>{status}</span>
                        <ChevronDown size={11} />
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="td-row-kebab-wrap">
                        <button
                          type="button"
                          className="td-row-kebab-btn"
                          onClick={() =>
                            setActionMenuId(actionMenuId === item.id ? null : item.id)
                          }
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {actionMenuId === item.id && (
                          <div className="td-row-kebab-dropdown">
                            <button onClick={() => setActionMenuId(null)}>Edit Item</button>
                            <button onClick={() => setActionMenuId(null)}>Duplicate</button>
                            <button className="danger" onClick={() => setActionMenuId(null)}>Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Table Total Bar */}
          <div className="td-costing-total-bar">
            <span className="total-label">TOTAL ({items.length} ITEMS)</span>
            <span className="total-qty">{totalQuantity}</span>
            <span className="total-amount">
              ₹{totalAmount.toLocaleString("en-IN")}
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
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>

            <button
              type="button"
              className={`target-table-page-btn ${page === 1 ? "active" : ""}`}
              onClick={() => setPage(1)}
            >
              1
            </button>
            <button
              type="button"
              className={`target-table-page-btn ${page === 2 ? "active" : ""}`}
              onClick={() => setPage(2)}
            >
              2
            </button>
            <button
              type="button"
              className={`target-table-page-btn ${page === 3 ? "active" : ""}`}
              onClick={() => setPage(3)}
            >
              3
            </button>
            <button
              type="button"
              className={`target-table-page-btn ${page === 4 ? "active" : ""}`}
              onClick={() => setPage(4)}
            >
              4
            </button>
            <button
              type="button"
              className={`target-table-page-btn ${page === 5 ? "active" : ""}`}
              onClick={() => setPage(5)}
            >
              5
            </button>

            <button
              type="button"
              className="target-table-page-btn arrow"
              onClick={() => setPage((p) => Math.min(5, p + 1))}
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
                onChange={(e) => setPageSize(Number(e.target.value))}
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
    </div>
  );
}
