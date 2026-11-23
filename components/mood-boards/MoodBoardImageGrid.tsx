"use client";

import React from "react";
import { Trash2, Star, Eye, Image as ImageIcon } from "lucide-react";
import { MoodBoardImage } from "@/lib/mood-boards/types";

interface MoodBoardImageGridProps {
  images: MoodBoardImage[];
  coverImage?: string;
  onSetCover: (imageUrl: string) => void;
  onRemoveImage: (imageId: string) => void;
  onPreviewImage: (image: MoodBoardImage) => void;
}

export default function MoodBoardImageGrid({
  images,
  coverImage,
  onSetCover,
  onRemoveImage,
  onPreviewImage,
}: MoodBoardImageGridProps) {
  if (images.length === 0) {
    return (
      <div className="mb-empty-state" style={{ padding: "40px 20px" }}>
        <div className="mb-empty-icon">
          <ImageIcon size={32} />
        </div>
        <h4 className="mb-empty-title">No concept images yet</h4>
        <p className="mb-empty-desc">
          Upload room elevations, material palettes, finish swatches, or lighting concepts to populate this mood board.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-image-canvas">
      {images.map((img) => {
        const isCover = img.isCover || img.previewUrl === coverImage;

        return (
          <div key={img.id} className="mb-image-tile">
            <div className="mb-image-tile-media">
              <img
                src={img.previewUrl}
                alt={img.name}
                className="mb-image-tile-img"
                onClick={() => onPreviewImage(img)}
              />

              {isCover && (
                <span className="mb-image-tile-cover-badge">
                  Cover Image
                </span>
              )}

              <button
                type="button"
                className="mb-image-tile-delete"
                title="Remove image"
                aria-label={`Remove image ${img.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage(img.id);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="mb-image-tile-footer">
              <span className="mb-image-tile-name" title={img.name}>
                {img.name}
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  className="mb-image-tile-cover-btn"
                  title="Preview full image"
                  onClick={() => onPreviewImage(img)}
                  style={{ display: "flex", alignItems: "center", gap: 3 }}
                >
                  <Eye size={13} />
                </button>

                {!isCover && (
                  <button
                    type="button"
                    className="mb-image-tile-cover-btn"
                    title="Set as board cover"
                    onClick={() => onSetCover(img.previewUrl)}
                    style={{ display: "flex", alignItems: "center", gap: 3 }}
                  >
                    <Star size={13} />
                    <span>Set Cover</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
