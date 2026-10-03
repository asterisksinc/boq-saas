"use client";

import React, { useState } from "react";
import { Copy, Edit3, Image as ImageIcon } from "lucide-react";
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
  onDuplicate,
  onEdit,
  onUseTemplate,
  onImageUploaded,
}: TemplateInfoCardProps) {
  const [imgSrc, setImgSrc] = useState<string>(template.imageUrl || fallbackCover);
  const [uploading, setUploading] = useState(false);

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
    : ["Residential", "Interior Design", template.projectType || "3BHK"];

  return (
    <div className="td-info-card">
      <div className="td-info-image-wrap">
        <img
          src={imgSrc}
          alt={template.name}
          className="td-info-img"
          onError={() => setImgSrc(fallbackCover)}
        />
        <label className="td-info-img-upload-btn" title="Change template image">
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

      <div className="td-info-grid">
        {/* Column 1: Name, Tags, Description */}
        <div className="td-info-col td-info-col-main">
          <div className="td-info-field">
            <span className="td-info-label">Template Name</span>
            <h2 className="td-info-title">{template.name}</h2>
          </div>

          <div className="td-info-field" style={{ marginTop: 12 }}>
            <span className="td-info-label">Tag</span>
            <div className="td-info-tags-row">
              {tags.map((t, idx) => (
                <span key={idx} className="td-info-tag-pill">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="td-info-field" style={{ marginTop: 12 }}>
            <span className="td-info-label">Description</span>
            <p className="td-info-desc">
              {template.description ||
                "Standard premium 3BHK interior project structure with predefined rooms, BOQ sections, costing references, milestones and client document requirements."}
            </p>
          </div>
        </div>

        {/* Column 2: Template ID, Status */}
        <div className="td-info-col td-info-col-meta">
          <div className="td-info-field">
            <span className="td-info-label">Template ID</span>
            <span className="td-info-value-bold">
              {template.templateCode || "TEM-RES-2938"}
            </span>
          </div>

          <div className="td-info-field" style={{ marginTop: 20 }}>
            <span className="td-info-label">Status</span>
            <div>
              <span className={`td-status-pill ${statusClass}`}>{status}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Template Type, Type */}
        <div className="td-info-col td-info-col-type">
          <div className="td-info-field">
            <span className="td-info-label">Template Type</span>
            <span className="td-info-value-bold">Project Template</span>
          </div>

          <div className="td-info-field" style={{ marginTop: 20 }}>
            <span className="td-info-label">Type</span>
            <span className="td-info-value-bold">
              {template.businessType || template.projectType || "Residential"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
