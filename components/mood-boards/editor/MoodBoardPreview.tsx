"use client";

import React, { useRef, useState } from "react";
import {
  UploadCloud,
  X,
  Star,
  Image as ImageIcon,
  Layers,
  Sparkles,
  DollarSign,
  Folder,
} from "lucide-react";
import {
  MoodBoardCategory,
  MoodBoardImage,
  MoodBoardItem,
} from "@/lib/mood-boards/types";
import { createSampleImageSvg } from "@/lib/mood-boards/mock-data";
import { generateId } from "@/lib/mood-boards/helpers";

interface MoodBoardPreviewProps {
  name: string;
  projectName: string;
  leadName: string;
  description: string;
  categories: MoodBoardCategory[];
  activeCategory: MoodBoardCategory;
  coverImage?: string;
  onSetCoverImage: (url: string) => void;
  onAddImagesToCategory: (categoryId: string, images: MoodBoardImage[]) => void;
  onRemoveImageFromCategory: (categoryId: string, imageId: string) => void;
  onChangeTemplate: () => void;
}

export default function MoodBoardPreview({
  name,
  projectName,
  leadName,
  description,
  categories,
  activeCategory,
  coverImage,
  onSetCoverImage,
  onAddImagesToCategory,
  onRemoveImageFromCategory,
  onChangeTemplate,
}: MoodBoardPreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate Subtotal, GST, and Total from all categories & items
  const subtotal = categories.reduce((totalCat, cat) => {
    const catSum = (cat.itemGroups || []).reduce((totalGrp, grp) => {
      const grpSum = (grp.items || []).reduce(
        (sum, item) => sum + (item.amount || 0),
        0
      );
      return totalGrp + grpSum;
    }, 0);
    return totalCat + catSum;
  }, 0);

  const gst = subtotal * 0.18;
  const totalAmount = subtotal + gst;

  // Format currency in Indian Rupees
  const formatCurrency = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  // Handle local image file upload
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: MoodBoardImage[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const objectUrl = URL.createObjectURL(file);
      newImages.push({
        id: `img-${generateId()}`,
        name: file.name,
        previewUrl: objectUrl,
        fileType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      });
    });

    if (newImages.length > 0) {
      onAddImagesToCategory(activeCategory.id, newImages);
      if (!coverImage) {
        onSetCoverImage(newImages[0].previewUrl);
      }
    }
  };

  // Generate a sample swatch for the active category
  const handleAddSampleSwatch = () => {
    const palettes: [string, string, string][] = [
      ["#1e293b", "#334155", "#475569"],
      ["#78350f", "#b45309", "#f59e0b"],
      ["#1e3a8a", "#2563eb", "#60a5fa"],
      ["#064e3b", "#047857", "#10b981"],
    ];
    const chosenPalette =
      palettes[Math.floor(Math.random() * palettes.length)];
    const sampleUrl = createSampleImageSvg(
      `${activeCategory.name} - Concept Spec`,
      chosenPalette,
      projectName || "Interior Specification"
    );

    const sampleImage: MoodBoardImage = {
      id: `img-sample-${generateId()}`,
      name: `${activeCategory.name}-Spec.svg`,
      previewUrl: sampleUrl,
      fileType: "image/svg+xml",
      size: 145000,
      uploadedAt: new Date().toISOString(),
    };

    onAddImagesToCategory(activeCategory.id, [sampleImage]);
    if (!coverImage) {
      onSetCoverImage(sampleUrl);
    }
  };

  const categoryImages = activeCategory.images || [];

  return (
    <section className="mb-preview-panel" aria-labelledby="mb-preview-title">
      {/* Header Row: MOODBOARD PREVIEW + Change Template button (Frame 2147225453) */}
      <div className="mb-preview-header-bar">
        <h2 id="mb-preview-title" className="mb-preview-heading-title">
          MOODBOARD PREVIEW
        </h2>

        <button
          type="button"
          className="mb-btn-change-template"
          onClick={onChangeTemplate}
        >
          Change Template
        </button>
      </div>

      {/* Main Inner White Card (Frame 2147225027) */}
      <div className="mb-preview-inner-card">
        {/* Mood Board Live Meta Header */}
        <div className="mb-preview-meta-block">
          <div className="mb-preview-meta-top">
            <h3 className="mb-preview-board-name">
              {name.trim() || "Untitled Mood Board"}
            </h3>
            <span className="mb-preview-status-pill">DRAFT</span>
          </div>

          <div className="mb-preview-meta-row">
            <span className="mb-preview-meta-item">
              <strong>Project:</strong> {projectName || "None selected"}
            </span>
            <span className="mb-preview-meta-dot">•</span>
            <span className="mb-preview-meta-item">
              <strong>Lead:</strong> {leadName || "None assigned"}
            </span>
            <span className="mb-preview-meta-dot">•</span>
            <span className="mb-preview-meta-item">
              <strong>Active Category:</strong> {activeCategory.name}
            </span>
          </div>

          {description && (
            <p className="mb-preview-desc-text">{description}</p>
          )}
        </div>

        {/* Visual Asset Uploader & Swatches Section */}
        <div className="mb-preview-assets-section">
          <div className="mb-preview-assets-header">
            <div className="mb-preview-assets-title-wrap">
              <Folder size={18} className="mb-preview-folder-icon" />
              <h4 className="mb-preview-category-assets-title">
                {activeCategory.name} Visuals & Swatches
              </h4>
              <span className="mb-category-badge">
                {categoryImages.length}
              </span>
            </div>

            <button
              type="button"
              className="mb-text-action-btn"
              onClick={handleAddSampleSwatch}
            >
              <Sparkles size={14} />
              <span>+ Add Sample Swatch</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div
            className={`mb-preview-dropzone ${isDragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFiles(e.target.files)}
            />
            <UploadCloud size={28} className="mb-dropzone-icon" />
            <p className="mb-dropzone-title">
              Click to upload or drag images into {activeCategory.name}
            </p>
            <p className="mb-dropzone-sub">
              JPG, PNG, WEBP, SVG preview supported
            </p>
          </div>

          {/* Images Grid */}
          {categoryImages.length > 0 ? (
            <div className="mb-preview-images-grid">
              {categoryImages.map((img) => {
                const isCover = coverImage === img.previewUrl;
                return (
                  <div
                    key={img.id}
                    className={`mb-preview-img-card ${
                      isCover ? "is-cover" : ""
                    }`}
                  >
                    <div className="mb-preview-img-wrapper">
                      <img
                        src={img.previewUrl}
                        alt={img.name}
                        className="mb-preview-img-thumb"
                      />
                      {isCover && (
                        <div className="mb-preview-cover-badge">
                          <Star size={10} fill="#FFFFFF" />
                          <span>Cover</span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="mb-editor-img-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveImageFromCategory(
                            activeCategory.id,
                            img.id
                          );
                        }}
                        aria-label={`Remove ${img.name}`}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="mb-preview-img-footer">
                      <span className="mb-preview-img-name" title={img.name}>
                        {img.name}
                      </span>
                      {!isCover && (
                        <button
                          type="button"
                          className="mb-btn-set-cover"
                          onClick={() => onSetCoverImage(img.previewUrl)}
                        >
                          Set Cover
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mb-preview-empty-gallery">
              <ImageIcon size={36} className="mb-empty-gallery-icon" />
              <p className="mb-empty-gallery-title">
                No visual assets added to {activeCategory.name} yet
              </p>
              <p className="mb-empty-gallery-sub">
                Upload room photos, material finishes, 3D renders, or click &quot;+ Add Sample Swatch&quot; above.
              </p>
            </div>
          )}
        </div>

        {/* Financial & Items Summary Box (Frame 2147225179 & Frame 2147225224) */}
        <div className="mb-financial-summary-card">
          <div className="mb-summary-row">
            <span className="mb-summary-label">Subtotal</span>
            <span className="mb-summary-val">
              {subtotal > 0 ? formatCurrency(subtotal) : "--"}
            </span>
          </div>

          <div className="mb-summary-row">
            <span className="mb-summary-label">GST (18%)</span>
            <span className="mb-summary-val">
              {subtotal > 0 ? formatCurrency(gst) : "₹0.00"}
            </span>
          </div>

          {/* Divider (Rectangle 30) */}
          <div className="mb-summary-divider" />

          <div className="mb-summary-row total">
            <span className="mb-summary-total-label">Total Amount</span>
            <span className="mb-summary-total-val">
              {totalAmount > 0 ? formatCurrency(totalAmount) : "₹0.00"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
