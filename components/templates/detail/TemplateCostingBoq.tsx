"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { updateTemplateSection } from "@/lib/api/templates";

interface TemplateItem {
  id: string;
  name: string;
  unit?: string | null;
  quantity?: number | null;
  rate?: number | null;
  sellingRate?: number | null;
  wastePercent?: number | null;
  taxPercent?: number | null;
  amount?: number | null;
  rateStatus?: string | null;
  description?: string | null;
}

interface TemplateCostingBoqProps {
  templateId: string;
  initialItems?: TemplateItem[];
  onUpdate?: () => void;
}

export default function TemplateCostingBoq({ templateId, initialItems = [], onUpdate }: TemplateCostingBoqProps) {
  const [items, setItems] = useState<TemplateItem[]>(initialItems);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => setItems(initialItems), [initialItems]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const visibleItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );
  useEffect(() => setPage((current) => Math.min(current, totalPages)), [totalPages]);

  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const persist = async (nextItems: TemplateItem[]) => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateTemplateSection(templateId, "costing-boq", { items: nextItems, itemCount: nextItems.length });
      setItems(nextItems);
      onUpdate?.();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The BOQ could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  const editItem = async (item: TemplateItem) => {
    const name = window.prompt("Item name", item.name);
    if (name === null || !name.trim()) return;
    const rateText = window.prompt("Rate", String(item.rate ?? item.sellingRate ?? ""));
    if (rateText === null) return;
    const rate = Number(rateText);
    if (!Number.isFinite(rate) || rate < 0) {
      setSaveError("Rate must be a non-negative number.");
      return;
    }
    await persist(items.map((candidate) => candidate.id === item.id
      ? { ...candidate, name: name.trim(), rate, sellingRate: rate }
      : candidate));
    setActionMenuId(null);
  };

  const duplicateItem = async (item: TemplateItem) => {
    await persist([...items, { ...item, id: crypto.randomUUID(), name: `${item.name} (Copy)` }]);
    setActionMenuId(null);
  };

  const deleteItem = async (item: TemplateItem) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    await persist(items.filter((candidate) => candidate.id !== item.id));
    setActionMenuId(null);
  };

  return (
    <section className="td-costing-main">
      <div className="td-costing-main-header">
        <div className="td-costing-main-title-col">
          <h2 className="title">Costing &amp; BOQ</h2>
          <span className="sub">Persisted template BOQ</span>
          <span className="meta">{items.length} Items · ₹{totalAmount.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {saveError && <div role="alert" className="td-inspector-alert error">{saveError}</div>}
      <div className="td-costing-table-wrap">
        <table className="td-costing-table">
          <thead>
            <tr>
              <th>ITEM</th><th>UNIT</th><th>QTY</th><th>RATE (₹)</th><th>WASTE (%)</th>
              <th>TAX (%)</th><th>AMOUNT (₹)</th><th>RATE STATUS</th><th />
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => {
              const status = item.rateStatus || "UNMAPPED";
              const statusClass = status === "MAPPED" ? "status-mapped" : status === "OUTDATED" ? "status-outdated" : "status-missing";
              return (
                <tr key={item.id} className="td-costing-row">
                  <td><div className="item-text-group"><span className="name">{item.name}</span><span className="desc">{item.description || "No description"}</span></div></td>
                  <td><span className="unit-txt">{item.unit || "-"}</span></td>
                  <td><span className="qty-txt">{item.quantity ?? 0}</span></td>
                  <td><span className="rate-txt">{Number(item.rate ?? item.sellingRate ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
                  <td><span className="pct-txt">{item.wastePercent ?? 0}%</span></td>
                  <td><span className="pct-txt">{item.taxPercent ?? 0}%</span></td>
                  <td><span className="amount-txt">{Number(item.amount ?? 0).toLocaleString("en-IN")}</span></td>
                  <td><div className={`td-rate-status-pill ${statusClass}`}><span>{status}</span><ChevronDown size={11} /></div></td>
                  <td onClick={(event) => event.stopPropagation()}>
                    <div className="td-row-kebab-wrap">
                      <button type="button" className="td-row-kebab-btn" aria-label={`Actions for ${item.name}`} onClick={() => setActionMenuId(actionMenuId === item.id ? null : item.id)}><MoreHorizontal size={14} /></button>
                      {actionMenuId === item.id && (
                        <div className="td-row-kebab-dropdown">
                          <button disabled={saving} onClick={() => void editItem(item)}>Edit Item</button>
                          <button disabled={saving} onClick={() => void duplicateItem(item)}>Duplicate</button>
                          <button disabled={saving} className="danger" onClick={() => void deleteItem(item)}>Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && <div className="td-costing-empty">No BOQ items configured.</div>}
        <div className="td-costing-total-bar"><span className="total-label">TOTAL ({items.length} ITEMS)</span><span className="total-qty">{totalQuantity}</span><span className="total-amount">₹{totalAmount.toLocaleString("en-IN")}</span></div>
      </div>

      <div className="target-table-pagination-row">
        <div className="target-table-total-count">Total Items: {items.length}</div>
        <div className="target-table-page-nav" role="navigation" aria-label="Pagination">
          <button type="button" className="target-table-page-btn arrow" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={15} /></button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button key={pageNumber} type="button" className={`target-table-page-btn ${page === pageNumber ? "active" : ""}`} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
          ))}
          <button type="button" className="target-table-page-btn arrow" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><ChevronRight size={15} /></button>
        </div>
        <label className="target-table-page-size-wrap"><span className="target-table-page-size-label">Show per Page:</span><select className="target-table-page-size-select" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} aria-label="Items per page"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
      </div>
    </section>
  );
}
