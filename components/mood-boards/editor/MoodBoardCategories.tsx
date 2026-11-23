"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  GripVertical,
  MoreVertical,
  Trash2,
  Edit2,
  FolderPlus,
} from "lucide-react";
import { MoodBoardCategory } from "@/lib/mood-boards/types";
import AddCategoryModal from "./AddCategoryModal";

interface MoodBoardCategoriesProps {
  categories: MoodBoardCategory[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
  onRenameCategory: (id: string, newName: string) => void;
  onReorderCategories: (newOrder: MoodBoardCategory[]) => void;
  activeGroupId?: string;
  onSelectGroup?: (groupId: string) => void;
}

export default function MoodBoardCategories({
  categories,
  activeCategoryId,
  onSelectCategory,
  onToggleExpand,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory,
  onReorderCategories,
  activeGroupId,
  onSelectGroup,
}: MoodBoardCategoriesProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const activeCategory =
    categories.find((c) => c.id === activeCategoryId) || categories[0];

  const handleStartRename = (cat: MoodBoardCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      onRenameCategory(id, editName.trim());
    }
    setEditingId(null);
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...categories];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setDraggedIndex(targetIndex);
    onReorderCategories(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <section className="mb-section-card" aria-labelledby="mb-categories-heading">
      {/* Category Heading (Frame 2147225617 Header) */}
      <div className="mb-categories-header">
        <h2 id="mb-categories-heading" className="mb-category-heading-title">
          {activeCategory?.name || "Categories"}
        </h2>
      </div>

      {/* Button: + Add More Category */}
      <button
        type="button"
        className="mb-btn-add-category"
        onClick={() => setIsAddModalOpen(true)}
      >
        <span>Add More Category</span>
        <Plus size={18} />
      </button>

      {/* Divider - Rectangle 72 */}
      <div className="mb-section-divider" />

      {/* Category list (Frame 2147225181) */}
      <div className="mb-categories-list" role="tree" aria-label="Mood Board Categories">
        {categories.map((category, index) => {
          const isSelected = category.id === activeCategoryId;
          const isExpanded = Boolean(category.expanded);
          const hasItemGroups =
            Boolean(category.itemGroups && category.itemGroups.length > 0);

          return (
            <div
              key={category.id}
              className={`mb-category-item-wrap ${
                isSelected ? "is-active" : ""
              }`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* Category row */}
              <div
                className={`mb-category-row ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectCategory(category.id)}
                role="treeitem"
                aria-selected={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectCategory(category.id);
                  }
                }}
              >
                <div className="mb-category-row-left">
                  {/* Expand / Collapse Icon */}
                  <button
                    type="button"
                    className="mb-cat-arrow-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand(category.id);
                    }}
                    aria-label={isExpanded ? "Collapse category" : "Expand category"}
                  >
                    {isExpanded ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </button>

                  {/* Folder Icon */}
                  {isExpanded ? (
                    <FolderOpen
                      size={18}
                      className={`mb-folder-icon ${isSelected ? "active" : ""}`}
                    />
                  ) : (
                    <Folder
                      size={18}
                      className={`mb-folder-icon ${isSelected ? "active" : ""}`}
                    />
                  )}

                  {/* Category Name or Inline Rename */}
                  {editingId === category.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleSaveRename(category.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(category.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="mb-cat-inline-edit"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="mb-category-name">{category.name}</span>
                  )}
                </div>

                <div className="mb-category-row-right">
                  {/* Image/Asset count badge (Frame 2147225014) */}
                  <span className="mb-category-badge">
                    {category.imageCount ?? category.images?.length ?? 0}
                  </span>

                  {/* Quick actions: Rename & Delete */}
                  <div className="mb-cat-row-actions">
                    <button
                      type="button"
                      className="mb-cat-mini-btn"
                      onClick={(e) => handleStartRename(category, e)}
                      title="Rename category"
                      aria-label="Rename category"
                    >
                      <Edit2 size={13} />
                    </button>
                    {categories.length > 1 && (
                      <button
                        type="button"
                        className="mb-cat-mini-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Are you sure you want to delete category "${category.name}"?`
                            )
                          ) {
                            onDeleteCategory(category.id);
                          }
                        }}
                        title="Delete category"
                        aria-label="Delete category"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-groups (e.g. Furniture, Painting, Electrical) when expanded */}
              {isExpanded && hasItemGroups && (
                <div className="mb-subgroups-list" role="group">
                  {category.itemGroups?.map((group) => {
                    const isGroupActive =
                      isSelected && activeGroupId === group.id;
                    return (
                      <div
                        key={group.id}
                        className={`mb-subgroup-row ${
                          isGroupActive ? "active" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCategory(category.id);
                          onSelectGroup?.(group.id);
                        }}
                      >
                        <div className="mb-subgroup-row-left">
                          <GripVertical
                            size={16}
                            className="mb-subgroup-grip"
                          />
                          <Folder
                            size={16}
                            className={`mb-subgroup-folder ${
                              isGroupActive ? "active" : ""
                            }`}
                          />
                          <span className="mb-subgroup-name">
                            {group.name}
                          </span>
                        </div>

                        <div className="mb-subgroup-row-right">
                          <span className="mb-subgroup-badge">
                            {group.itemCount ?? group.items.length}{" "}
                            {group.name === "Furniture" ? "Images" : ""}
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

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCategory={onAddCategory}
        existingNames={categories.map((c) => c.name)}
      />
    </section>
  );
}
