"use client";

import React, { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { uploadTemplateImage } from "@/lib/api/templates";

interface TemplateInfoCardProps {
  template: {
    id: string;
    templateCode?: string;
    name: string;
    description?: string;
    businessType?: string;
    projectType?: string;
    status?: string;
    tags?: string[];
    imageUrl?: string | null;
  };
  onDuplicate: () => void;
  onEdit: () => void;
  onUseTemplate: () => void;
  onImageUploaded?: (url: string) => void;
}

const fallbackCover =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80";

export default function TemplateInfoCard({
  template,
  onImageUploaded,
}: TemplateInfoCardProps) {
  const [imgSrc, setImgSrc] = useState<string>(template.imageUrl || fallbackCover);
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    setImgSrc(template.imageUrl || fallbackCover);
  }, [template.imageUrl]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await uploadTemplateImage(file);
      if (res?.url) {
        setImgSrc(res.url);
        onImageUploaded?.(res.url);
      }
    } catch {
      // Local preview fallback
      const objectUrl = URL.createObjectURL(file);
      setImgSrc(objectUrl);
    } finally {
      setUploading(false);
    }
  };

  const status = (template.status || "ACTIVE").toUpperCase();
  const statusClass =
    status === "ACTIVE"
      ? "status-pill-active"
      : status.includes("REVIEW")
      ? "status-pill-review"
      : "status-pill-draft";

  const tags = template.tags && template.tags.length > 0
    ? template.tags
    : [template.businessType || "Residential", "Interior Design", template.projectType || "Standard"].filter(Boolean);

  return (
    <section className="td-outer-panel" aria-labelledby="template-info-heading">
      {/* Frame 2147225193: Header */}
      <div className="td-panel-header-row">
        <h2 id="template-info-heading" className="td-panel-heading">
          TEMPLATE INFORMATION
        </h2>
      </div>

      {/* Frame 2147225027: White Inner Card */}
      <div className="td-inner-card td-info-card-inner">
        {/* Rectangle 79: 155px x 155px cover image */}
        <div className="td-info-image-wrap">
          <img
            src={imgSrc}
            alt={template.name}
            className="td-info-img"
            onError={() => setImgSrc(fallbackCover)}
          />
          <label className="td-info-img-upload-btn" title="Change template image" aria-label="Change template image">
            <ImageIcon size={14} />
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageFileChange}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Frame 2147225192: Metadata and Details */}
        <div className="td-info-details-col">
          {/* Row 1: Frame 2147225128: Template Name, Template ID, Template Type */}
          <div className="td-info-details-row">
            <div className="td-info-field">
              <span className="td-info-label">Template Name</span>
              <span className="td-info-value" title={template.name}>
                {template.name}
              </span>
            </div>

            <div className="td-info-field">
              <span className="td-info-label">Template ID</span>
              <span className="td-info-value">
                {template.templateCode || template.id}
              </span>
            </div>

            <div className="td-info-field">
              <span className="td-info-label">Template Type</span>
              <span className="td-info-value">Project Template</span>
            </div>
          </div>

          {/* Row 2: Frame 2147225129: Tag, Status, Type */}
          <div className="td-info-details-row">
            <div className="td-info-field">
              <span className="td-info-label">Tag</span>
              <div className="td-info-tags-wrap">
                {tags.map((t, idx) => (
                  <span key={idx} className="td-tag-chip">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="td-info-field">
              <span className="td-info-label">Status</span>
              <div>
                <span className={`td-status-pill ${statusClass}`}>{status}</span>
              </div>
            </div>

            <div className="td-info-field">
              <span className="td-info-label">Type</span>
              <span className="td-info-value">
                {template.businessType || template.projectType || "Residential"}
              </span>
            </div>
          </div>

          {/* Row 3: Frame 2147225000: Description */}
          <div className="td-info-field td-info-field-full">
            <span className="td-info-label">Description</span>
            <p className="td-info-desc">
              {template.description || "No description provided for this template."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
