"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Type, Check } from "lucide-react";

export interface EditImageTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  imageThumbnail?: string;
  onSaveTitle: (newTitle: string) => void | Promise<void>;
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
  const [isSaving, setIsSaving] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setError(null);
      setIsSaving(false);
      window.requestAnimationFrame(() => titleInputRef.current?.focus());
    }
  }, [isOpen, currentTitle]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Image title is required");
      return;
    }
    setIsSaving(true);
    try {
      await onSaveTitle(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update image title");
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
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
            
            </div>
            <div>
              <h3 id="edit-img-title" className="mb-category-dialog-title" style={{fontSize: "1.25rem"}}>
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
                ref={titleInputRef}
                id="img-title-input"
                type="text"
                placeholder="e.g. Bed & Headboard, Travertine Coffee Table..."
                value={title}
                disabled={isSaving}
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
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="new-mb-btn-continue"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Title"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
