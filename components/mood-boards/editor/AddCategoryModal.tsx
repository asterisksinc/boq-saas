"use client";

import React, { useState, useEffect } from "react";
import { X, FolderPlus } from "lucide-react";

export interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (categoryName: string, description?: string) => void;
  existingNames?: string[];
}

export default function AddCategoryModal({
  isOpen,
  onClose,
  onAddCategory,
  existingNames = [],
}: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Category name is required");
      return;
    }
    if (
      existingNames.some(
        (n) => n.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setError("A category with this name already exists");
      return;
    }

    onAddCategory(trimmed, description.trim() || undefined);
    onClose();
  };

  return (
    <div
      className="new-mb-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-cat-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mb-category-dialog">
        <div className="mb-category-dialog-header">
          <div className="mb-cat-dialog-title-group">
            <div className="mb-cat-icon-badge">
              <FolderPlus size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 id="add-cat-modal-title" className="mb-category-dialog-title">
                Add Category
              </h3>
              <p className="mb-cat-dialog-sub">
                Create a category to group your design inspiration and materials.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="new-mb-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-category-dialog-body">
            <div className="mb-editor-field">
              <label htmlFor="cat-name-input" className="mb-editor-label">
                <span>Category Name</span>
                <span className="mb-required-star">*</span>
              </label>
              <input
                id="cat-name-input"
                type="text"
                autoFocus
                placeholder="e.g. Master Bedroom, Color Palette, Lighting..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                className={`mb-editor-input ${error ? "error" : ""}`}
              />
              {error && <p className="mb-editor-error-msg">{error}</p>}
            </div>

            <div className="mb-editor-field mt-3">
              <label htmlFor="cat-desc-input" className="mb-editor-label">
                <span>Category Description</span>
                <span className="mb-optional-badge">(Optional)</span>
              </label>
              <textarea
                id="cat-desc-input"
                rows={2}
                placeholder="Optional notes about this category's style or requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mb-editor-textarea"
              />
            </div>
          </div>

          <div className="mb-category-dialog-footer">
            <button
              type="button"
              className="new-mb-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="new-mb-btn-continue"
            >
              Create Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
