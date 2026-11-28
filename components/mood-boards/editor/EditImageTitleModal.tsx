"use client";

import React, { useState, useEffect } from "react";
import { X, Type, Check } from "lucide-react";

export interface EditImageTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  imageThumbnail?: string;
  onSaveTitle: (newTitle: string) => void;
}

export default function EditImageTitleModal({
  isOpen,
  onClose,
  currentTitle,
  imageThumbnail,
  onSaveTitle,
}: EditImageTitleModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setError(null);
    }
  }, [isOpen, currentTitle]);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Image title is required");
      return;
    }
    onSaveTitle(trimmed);
    onClose();
  };

  return (
    <div
      className="new-mb-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-img-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mb-category-dialog" style={{ maxWidth: 440 }}>
        <div className="mb-category-dialog-header">
          <div className="mb-cat-dialog-title-group">
            <div className="mb-cat-icon-badge">
              <Type size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 id="edit-img-title" className="mb-category-dialog-title">
                Edit Image Title
              </h3>
              <p className="mb-cat-dialog-sub">
                Every image must have a descriptive title for clients.
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

        <form onSubmit={handleSave}>
          <div className="mb-category-dialog-body">
            {imageThumbnail && (
              <div className="mb-title-modal-preview">
                <img
                  src={imageThumbnail}
                  alt={currentTitle}
                  className="mb-title-modal-img"
                />
              </div>
            )}

            <div className="mb-editor-field">
              <label htmlFor="img-title-input" className="mb-editor-label">
                <span>Image Title</span>
                <span className="mb-required-star">*</span>
              </label>
              <input
                id="img-title-input"
                type="text"
                autoFocus
                placeholder="e.g. Bed & Headboard, Travertine Coffee Table..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError(null);
                }}
                className={`mb-editor-input ${error ? "error" : ""}`}
              />
              {error && <p className="mb-editor-error-msg">{error}</p>}
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
              Save Title
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
