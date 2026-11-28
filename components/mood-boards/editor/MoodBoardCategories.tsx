"use client";

import React, { useState, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  GripVertical,
  Trash2,
  Edit2,
  UploadCloud,
  X,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Folder,
  FolderOpen,
} from "lucide-react";
import { MoodBoardCategory, MoodBoardImage } from "@/lib/mood-boards/types";
import { processUploadedImage } from "@/lib/mood-boards/image-utils";
import AddCategoryModal from "./AddCategoryModal";
import EditImageTitleModal from "./EditImageTitleModal";

export interface MoodBoardCategoriesProps {
  categories: MoodBoardCategory[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onAddCategory: (name: string, description?: string) => void;
  onDeleteCategory: (id: string) => void;
  onRenameCategory: (id: string, newName: string) => void;
  onReorderCategories: (newOrder: MoodBoardCategory[]) => void;
  onAddImagesToCategory: (categoryId: string, images: MoodBoardImage[]) => void;
  onRemoveImageFromCategory: (categoryId: string, imageId: string) => void;
  onUpdateImageTitle: (categoryId: string, imageId: string, newTitle: string) => void;
  onReplaceImage?: (categoryId: string, imageId: string, newImage: MoodBoardImage) => void;
  // For backwards compatibility with legacy props
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
  onAddImagesToCategory,
  onRemoveImageFromCategory,
  onUpdateImageTitle,
  onReplaceImage,
}: MoodBoardCategoriesProps) {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [draggedCatIndex, setDraggedCatIndex] = useState<number | null>(null);

  // Image title editing modal
  const [titleModalState, setTitleModalState] = useState<{
    isOpen: boolean;
    categoryId: string;
    imageId: string;
    currentTitle: string;
    thumbnail: string;
  }>({
    isOpen: false,
    categoryId: "",
    imageId: "",
    currentTitle: "",
    thumbnail: "",
  });

  // Drag-and-drop file upload states per category
  const [dragOverCatId, setDragOverCatId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  // Hidden file inputs
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const replaceInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [replaceTarget, setReplaceTarget] = useState<{
    categoryId: string;
    imageId: string;
  } | null>(null);

  // Inline rename logic
  const handleStartRename = (cat: MoodBoardCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
  };

  const handleSaveRename = (catId: string) => {
    if (editCatName.trim()) {
      onRenameCategory(catId, editCatName.trim());
    }
    setEditingCatId(null);
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedCatIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedCatIndex === null || draggedCatIndex === targetIndex) return;

    const updated = [...categories];
    const [moved] = updated.splice(draggedCatIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setDraggedCatIndex(targetIndex);
    onReorderCategories(updated);
  };

  const handleDragEnd = () => {
    setDraggedCatIndex(null);
  };

  // File Upload Logic
  const handleFilesSelected = async (categoryId: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).filter((f) => {
      const type = f.type.toLowerCase();
      const name = f.name.toLowerCase();
      return (
        type.startsWith("image/") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".png") ||
        name.endsWith(".webp")
      );
    });

    if (files.length === 0) return;

    setIsUploading(categoryId);
    try {
      const cat = categories.find((c) => c.id === categoryId);
      const startPosition = cat?.images?.length || 0;

      const processedImages: MoodBoardImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const img = await processUploadedImage(files[i], startPosition + i);
        processedImages.push(img);
      }

      onAddImagesToCategory(categoryId, processedImages);
    } catch (err) {
      console.error("Error processing images:", err);
    } finally {
      setIsUploading(null);
    }
  };

  // Image Replacement Logic
  const handleReplaceFileSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !replaceTarget) return;
    const file = fileList[0];
    try {
      const newImg = await processUploadedImage(file, 0);
      onReplaceImage?.(replaceTarget.categoryId, replaceTarget.imageId, newImg);
    } catch (err) {
      console.error("Failed to replace image:", err);
    } finally {
      setReplaceTarget(null);
    }
  };

  // Delete category with confirmation if contains images
  const handleDeleteCategoryPrompt = (cat: MoodBoardCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    const count = cat.images?.length || 0;
    if (count > 0) {
      const confirmed = window.confirm(
        `Category "${cat.name}" contains ${count} ${
          count === 1 ? "image" : "images"
        }. Are you sure you want to delete it? This cannot be undone.`
      );
      if (!confirmed) return;
    }
    onDeleteCategory(cat.id);
  };

  return (
    <section className="categories-section mb-section-card mb-categories-management" aria-labelledby="mb-categories-heading">
      {/* Header: Title "Categories", count & Add Category button */}
      <div className="mb-categories-header-wrap">
        <div className="mb-categories-header-left">
          <h2 id="mb-categories-heading" className="mb-categories-section-title">
            Categories
          </h2>
          <span className="mb-categories-total-badge">
            {categories.length} {categories.length === 1 ? "Category" : "Categories"}
          </span>
        </div>

        <button
          type="button"
          className="mb-btn-add-category"
          data-test="Add More Category"
          onClick={() => setIsAddModalOpen(true)}
          title="Add a new custom category"
        >
          <Plus size={16} />
          <span>Add Category</span>
        </button>
      </div>

      <p className="mb-categories-sub-hint">
        Organize your moodboard by rooms, materials, furniture, or design themes.
      </p>

      {/* Categories Accordion List */}
      <div className="mb-categories-accordion-list" role="list">
        {categories.map((category, index) => {
          const isSelected = category.id === activeCategoryId;
          const isExpanded = category.expanded ?? true;
          const images = category.images || [];
          const imageCount = images.length;
          const isCategoryUploading = isUploading === category.id;
          const isDragOver = dragOverCatId === category.id;

          return (
            <div
              key={category.id}
              className={`mb-category-accordion-card ${
                isSelected ? "is-selected-category" : ""
              } ${isExpanded ? "is-expanded" : "is-collapsed"}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* Category Accordion Header */}
              <div
                className="category-header mb-category-accordion-header"
                onClick={() => {
                  onSelectCategory(category.id);
                  onToggleExpand(category.id);
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectCategory(category.id);
                    onToggleExpand(category.id);
                  }
                }}
              >
                {/* Left Header: Drag Handle + Category Name + Image Count */}
                <div className="mb-cat-head-left">
                  <div
                    className="mb-cat-drag-handle"
                    title="Drag to reorder category"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical size={16} />
                  </div>

                  {editingCatId === category.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      onBlur={() => handleSaveRename(category.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(category.id);
                        if (e.key === "Escape") setEditingCatId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mb-cat-inline-rename-input"
                    />
                  ) : (
                    <div className="mb-cat-name-group">
                      <span className="mb-cat-title-text">{category.name}</span>
                      <span className="mb-cat-image-count-tag">
                        ({imageCount} {imageCount === 1 ? "Image" : "Images"})
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Header Actions: Edit, Delete, Expand/Collapse */}
                <div className="mb-cat-head-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="mb-cat-icon-action"
                    onClick={(e) => handleStartRename(category, e)}
                    title="Rename category"
                    aria-label={`Rename ${category.name}`}
                  >
                    <Edit2 size={14} />
                  </button>

                  {categories.length > 1 && (
                    <button
                      type="button"
                      className="mb-cat-icon-action delete"
                      onClick={(e) => handleDeleteCategoryPrompt(category, e)}
                      title="Delete category"
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <button
                    type="button"
                    className="mb-cat-icon-action expand"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCategory(category.id);
                      onToggleExpand(category.id);
                    }}
                    aria-label={isExpanded ? "Collapse category" : "Expand category"}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Accordion Body: Image Upload & Management when expanded */}
              {isExpanded && (
                <div className="mb-category-accordion-body">
                  {/* Category Description if available */}
                  {category.description && (
                    <p className="mb-category-desc-note">{category.description}</p>
                  )}

                  {/* Empty Category State */}
                  {images.length === 0 ? (
                    <div
                      className={`mb-category-empty-dropzone ${
                        isDragOver ? "is-dragover" : ""
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverCatId(category.id);
                      }}
                      onDragLeave={() => setDragOverCatId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverCatId(null);
                        handleFilesSelected(category.id, e.dataTransfer.files);
                      }}
                      onClick={() => fileInputRefs.current[category.id]?.click()}
                    >
                      <input
                        ref={(el) => {
                          fileInputRefs.current[category.id] = el;
                        }}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        style={{ display: "none" }}
                        onChange={(e) => handleFilesSelected(category.id, e.target.files)}
                      />

                      <div className="mb-empty-upload-icon-circle">
                        <UploadCloud size={24} className="text-blue-600" />
                      </div>

                      <h4 className="mb-empty-upload-title">
                        Upload images to this category
                      </h4>
                      <p className="mb-empty-upload-sub">
                        Drag and drop or browse files (JPG, PNG, WEBP)
                      </p>

                      <button
                        type="button"
                        className="mb-btn-browse-images"
                        disabled={isCategoryUploading}
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRefs.current[category.id]?.click();
                        }}
                      >
                        {isCategoryUploading ? "Processing..." : "Add Images"}
                      </button>
                    </div>
                  ) : (
                    /* Populated Category: 3-Column Image Cards Grid */
                    <div className="mb-category-images-container">
                      <div
                        className={`category-image-grid mb-category-images-grid ${
                          isDragOver ? "is-grid-dragover" : ""
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverCatId(category.id);
                        }}
                        onDragLeave={() => setDragOverCatId(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverCatId(null);
                          handleFilesSelected(category.id, e.dataTransfer.files);
                        }}
                      >
                        {images.map((img) => {
                          const displayTitle = img.title || img.name || "Untitled";
                          const hasTitle = Boolean(img.title && img.title.trim());

                          return (
                            <div key={img.id} className="mb-image-card">
                              {/* Thumbnail Container */}
                              <div className="mb-image-thumb-wrapper">
                                <img
                                  src={img.previewUrl}
                                  alt={displayTitle}
                                  className="mb-image-thumb"
                                  loading="lazy"
                                />

                                {/* Top-right Remove button */}
                                <button
                                  type="button"
                                  className="mb-img-remove-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveImageFromCategory(category.id, img.id);
                                  }}
                                  title="Remove image"
                                  aria-label={`Remove ${displayTitle}`}
                                >
                                  <X size={14} />
                                </button>

                                {/* Hover actions overlay */}
                                <div className="mb-image-hover-bar">
                                  <button
                                    type="button"
                                    className="mb-img-hover-action-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTitleModalState({
                                        isOpen: true,
                                        categoryId: category.id,
                                        imageId: img.id,
                                        currentTitle: displayTitle,
                                        thumbnail: img.previewUrl,
                                      });
                                    }}
                                    title="Edit title"
                                  >
                                    <Edit2 size={13} />
                                    <span>Edit Title</span>
                                  </button>

                                  {onReplaceImage && (
                                    <button
                                      type="button"
                                      className="mb-img-hover-action-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReplaceTarget({
                                          categoryId: category.id,
                                          imageId: img.id,
                                        });
                                        replaceInputRefs.current[category.id]?.click();
                                      }}
                                      title="Replace image"
                                    >
                                      <RefreshCw size={13} />
                                      <span>Replace</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Title Display & Quick Edit */}
                              <div
                                className="mb-image-card-footer"
                                onClick={() => {
                                  setTitleModalState({
                                    isOpen: true,
                                    categoryId: category.id,
                                    imageId: img.id,
                                    currentTitle: displayTitle,
                                    thumbnail: img.previewUrl,
                                  });
                                }}
                                title="Click to edit title"
                              >
                                <span
                                  className={`mb-image-title-text ${
                                    !hasTitle ? "needs-title" : ""
                                  }`}
                                >
                                  {displayTitle}
                                </span>
                                <Edit2 size={12} className="mb-title-edit-hint-icon" />
                              </div>
                            </div>
                          );
                        })}

                        {/* Compact "+ Add More" Dropzone Tile */}
                        <div
                          className="mb-add-more-tile"
                          onClick={() => fileInputRefs.current[category.id]?.click()}
                          title="Upload more images to this category"
                        >
                          <Plus size={20} className="mb-add-more-icon" />
                          <span className="mb-add-more-label">Add Images</span>
                        </div>
                      </div>

                      {/* Hidden File Input for this populated category */}
                      <input
                        ref={(el) => {
                          fileInputRefs.current[category.id] = el;
                        }}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        style={{ display: "none" }}
                        onChange={(e) => handleFilesSelected(category.id, e.target.files)}
                      />
                    </div>
                  )}

                  {/* Hidden Replace File Input */}
                  <input
                    ref={(el) => {
                      replaceInputRefs.current[category.id] = el;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    style={{ display: "none" }}
                    onChange={(e) => handleReplaceFileSelected(e.target.files)}
                  />
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
        onAddCategory={(catName, catDesc) => {
          onAddCategory(catName, catDesc);
          setIsAddModalOpen(false);
        }}
        existingNames={categories.map((c) => c.name)}
      />

      {/* Edit Image Title Modal */}
      <EditImageTitleModal
        isOpen={titleModalState.isOpen}
        onClose={() =>
          setTitleModalState((prev) => ({ ...prev, isOpen: false }))
        }
        currentTitle={titleModalState.currentTitle}
        imageThumbnail={titleModalState.thumbnail}
        onSaveTitle={(newTitle) => {
          onUpdateImageTitle(
            titleModalState.categoryId,
            titleModalState.imageId,
            newTitle
          );
        }}
      />
    </section>
  );
}
