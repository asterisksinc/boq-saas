"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, X, Check, AlertCircle } from "lucide-react";
import { MoodBoardImage } from "@/lib/mood-boards/types";
import { generateId } from "@/lib/mood-boards/helpers";

interface PendingImage {
  id: string;
  name: string;
  file: File;
  objectUrl: string;
  size: number;
  type: string;
}

interface MoodBoardImageUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onAddImages: (newImages: MoodBoardImage[]) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function MoodBoardImageUploader({
  isOpen,
  onClose,
  onAddImages,
}: MoodBoardImageUploaderProps) {
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  // Cleanup object URLs when component unmounts or modal closes
  const cleanupObjectUrls = () => {
    objectUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore
      }
    });
    objectUrlsRef.current = [];
  };

  useEffect(() => {
    return () => {
      cleanupObjectUrls();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanupObjectUrls();
      setPendingImages([]);
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

  const handleFiles = (files: FileList | File[]) => {
    setError(null);
    const newItems: PendingImage[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" is not a supported image file.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 10MB limit.`);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(objectUrl);

      newItems.push({
        id: generateId("img"),
        name: file.name,
        file,
        objectUrl,
        size: file.size,
        type: file.type,
      });
    });

    if (newItems.length > 0) {
      setPendingImages((prev) => [...prev, ...newItems]);
    }
  };

  const handleRemovePending = (id: string) => {
    setPendingImages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        try {
          URL.revokeObjectURL(target.objectUrl);
        } catch {
          // Ignore
        }
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleConfirm = () => {
    if (pendingImages.length === 0) return;

    // Convert to MoodBoardImage objects
    // Note: We retain objectUrls for active browser session preview
    const imagesToAdd: MoodBoardImage[] = pendingImages.map((p, index) => ({
      id: p.id,
      name: p.name,
      previewUrl: p.objectUrl,
      fileType: p.type,
      size: p.size,
      isCover: false,
      uploadedAt: new Date().toISOString(),
    }));

    onAddImages(imagesToAdd);
    // Don't revoke URLs that are being added to the active session image canvas
    objectUrlsRef.current = [];
    setPendingImages([]);
    onClose();
  };

  return (
    <div
      className="mb-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-images-title"
    >
      <div
        className="mb-modal-card"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-modal-header">
          <div>
            <h2 id="upload-images-title" className="mb-modal-title">
              Add Concept Images
            </h2>
            <p className="mb-modal-subtitle">
              Upload photographs, rendering perspectives, texture swatches, and design finishes.
            </p>
          </div>
          <button
            type="button"
            className="mb-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-modal-body">
          {/* Dropzone */}
          <div
            className={`mb-dropzone ${isDragging ? "is-dragging" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
            }}
          >
            <UploadCloud size={32} className="mb-dropzone-icon" />
            <span className="mb-dropzone-text">
              Drag and drop images here, or click to browse
            </span>
            <span className="mb-dropzone-hint">
              JPG, PNG, WEBP, or SVG up to 10MB each
            </span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 6,
                padding: "8px 12px",
                color: "#B91C1C",
                fontSize: 13,
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Pending Images Preview */}
          {pendingImages.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0F172A",
                }}
              >
                <span>Selected Images ({pendingImages.length})</span>
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#64748B",
                    fontSize: 12,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() => {
                    cleanupObjectUrls();
                    setPendingImages([]);
                  }}
                >
                  Clear All
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                  gap: 10,
                  maxHeight: 220,
                  overflowY: "auto",
                  padding: 4,
                }}
              >
                {pendingImages.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      position: "relative",
                      borderRadius: 6,
                      overflow: "hidden",
                      border: "1px solid #E2E8F0",
                      background: "#F8FAFC",
                      aspectRatio: "1/1",
                    }}
                  >
                    <img
                      src={p.objectUrl}
                      alt={p.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePending(p.id)}
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        background: "rgba(15, 23, 42, 0.75)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <X size={12} />
                    </button>
                    <span
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        fontSize: 10,
                        padding: "2px 4px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mb-modal-footer">
          <button
            type="button"
            className="mb-btn mb-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="mb-btn mb-btn-primary"
            disabled={pendingImages.length === 0}
            onClick={handleConfirm}
          >
            Add {pendingImages.length} {pendingImages.length === 1 ? "Image" : "Images"}
          </button>
        </div>
      </div>
    </div>
  );
}
