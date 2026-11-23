"use client";

import React from "react";
import { Folder, Trash2, Plus } from "lucide-react";
import {
  MoodBoardCategory,
  MoodBoardItemGroup,
  MoodBoardItem,
} from "@/lib/mood-boards/types";
import { generateId } from "@/lib/mood-boards/helpers";

interface MoodBoardItemsProps {
  category: MoodBoardCategory;
  activeGroupId: string;
  onSelectGroup: (groupId: string) => void;
  onAddItem: (groupId: string) => void;
  onUpdateItem: (
    groupId: string,
    itemId: string,
    field: "description" | "quantity" | "rate",
    value: string | number
  ) => void;
  onDeleteItem: (groupId: string, itemId: string) => void;
}

export default function MoodBoardItems({
  category,
  activeGroupId,
  onSelectGroup,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: MoodBoardItemsProps) {
  // Fallback if no itemGroups defined on category
  const itemGroups: MoodBoardItemGroup[] =
    category.itemGroups && category.itemGroups.length > 0
      ? category.itemGroups
      : [
          {
            id: `grp-${category.id}-default`,
            name: "General Items",
            items: [],
          },
        ];

  const currentGroup =
    itemGroups.find((g) => g.id === activeGroupId) || itemGroups[0];

  return (
    <section className="mb-section-card" aria-labelledby="mb-items-section-title">
      <h2 id="mb-items-section-title" className="mb-section-heading">
        ITEMS
      </h2>

      {/* Inner section for Items */}
      <div className="mb-items-container">
        {/* Category Title */}
        <h3 className="mb-items-category-title">{category.name}</h3>

        {/* Item Group Tabs / Selectors (Frame 2147225387) */}
        <div className="mb-item-groups-list" role="tablist">
          {itemGroups.map((group) => {
            const isActive = group.id === currentGroup?.id;
            return (
              <button
                key={group.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`mb-item-group-tab ${isActive ? "active" : ""}`}
                onClick={() => onSelectGroup(group.id)}
              >
                <div className="mb-item-group-tab-left">
                  <Folder
                    size={16}
                    className={`mb-group-tab-icon ${isActive ? "active" : ""}`}
                  />
                  <span className="mb-group-tab-name">{group.name}</span>
                </div>
                <span
                  className={`mb-group-tab-badge ${isActive ? "active" : ""}`}
                >
                  Item {group.items?.length || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Editable Item Table Card (Frame 2147225027) */}
        <div className="mb-items-table-card">
          <div className="mb-table-scroll-wrapper">
            {/* Table Header (Frame 57) */}
            <div className="mb-items-table-header" role="row">
              <div className="mb-th mb-th-desc">DESCRIPTION</div>
              <div className="mb-th mb-th-qty">QTY</div>
              <div className="mb-th mb-th-rate">RATE</div>
              <div className="mb-th mb-th-amount">AMOUNT</div>
              <div className="mb-th mb-th-action" aria-label="Actions" />
            </div>

            {/* Table Rows (Frame 61) */}
            <div className="mb-items-table-body">
              {currentGroup && currentGroup.items.length > 0 ? (
                currentGroup.items.map((item) => (
                  <div key={item.id} className="mb-items-table-row" role="row">
                    {/* Description input */}
                    <div className="mb-td mb-td-desc">
                      <input
                        type="text"
                        placeholder="Enter Description"
                        value={item.description}
                        onChange={(e) =>
                          onUpdateItem(
                            currentGroup.id,
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                        className="mb-table-input"
                        aria-label="Item description"
                      />
                    </div>

                    {/* Qty input */}
                    <div className="mb-td mb-td-qty">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity || 0}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          onUpdateItem(
                            currentGroup.id,
                            item.id,
                            "quantity",
                            val
                          );
                        }}
                        className="mb-table-input mb-input-number"
                        aria-label="Quantity"
                      />
                    </div>

                    {/* Rate input */}
                    <div className="mb-td mb-td-rate">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.rate || 0}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          onUpdateItem(
                            currentGroup.id,
                            item.id,
                            "rate",
                            val
                          );
                        }}
                        className="mb-table-input mb-input-number"
                        aria-label="Rate"
                      />
                    </div>

                    {/* Amount (computed: qty * rate) */}
                    <div className="mb-td mb-td-amount">
                      <span className="mb-amount-val">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Action: Delete item */}
                    <div className="mb-td mb-td-action">
                      <button
                        type="button"
                        onClick={() =>
                          onDeleteItem(currentGroup.id, item.id)
                        }
                        className="mb-btn-item-delete"
                        title="Delete item"
                        aria-label="Delete item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="mb-items-empty">
                  No items in this group yet. Click &quot;Add Item&quot; below to add items.
                </div>
              )}
            </div>
          </div>

          {/* Divider line (Rectangle 30) */}
          <div className="mb-table-divider" />

          {/* Add Item Button */}
          <button
            type="button"
            className="mb-btn-add-item"
            onClick={() => onAddItem(currentGroup.id)}
          >
            <span>Add Item</span>
          </button>
        </div>
      </div>
    </section>
  );
}
