"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { X, Loader2, Plus, AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { BoqTemplateItem } from "./BoqTemplateGrid";
import {
  createBoqTemplate,
  updateBoqTemplate,
  useBoqTemplate,
  addBoqTemplateSection,
  addBoqTemplateItem,
  uploadBoqTemplateImage,
} from "@/lib/api/boqs";

// ── 1. New BOQ Template Modal ───────────────────────────────────────
interface NewBoqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (template: any) => void;
}

export function NewBoqTemplateModal({ isOpen, onClose, onSuccess }: NewBoqModalProps) {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("INTERIOR");
  const [projectType, setProjectType] = useState("Residential");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(["Residential", "Interior"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setCoverError("Only JPG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError("Image size must be less than 5 MB.");
      return;
    }

    setCoverFile(file);
    setCoverError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeCoverImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddTag = () => {
    const val = tagInput.trim().replace(/^,+|,+$/g, "");
    if (val && !tags.includes(val) && tags.length < 20) {
      setTags([...tags, val]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a template name.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let uploadedImageUrl: string | null = null;
      if (coverFile) {
        try {
          const uploadRes = await uploadBoqTemplateImage(coverFile);
          uploadedImageUrl = uploadRes?.url || null;
        } catch {
          uploadedImageUrl = coverPreview;
        }
      }

      const created = await createBoqTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        projectType,
        tags,
        imageUrl: uploadedImageUrl || undefined,
      });
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create BOQ template.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="new-template-modal-overlay" onClick={onClose}>
      <div className="new-template-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ntm-header">
          <div className="ntm-header-info">
            <h2>New BOQ Template</h2>
            <p>Create a reusable BOQ template with sections and line items.</p>
          </div>
          <button type="button" className="ntm-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="ntm-api-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Row 1: Cover Image & Template Name + ID */}
          <div className="ntm-top-row">
            {/* Cover Image Upload */}
            <div className="ntm-cover-col">
              <label className="ntm-label">Cover Image</label>
              <div
                className={`ntm-cover-box ${coverPreview ? "has-preview" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                }}
              >
                {coverPreview ? (
                  <div className="ntm-cover-preview-wrap">
                    <img src={coverPreview} alt="Cover preview" className="ntm-cover-img" />
                    <button
                      type="button"
                      className="ntm-cover-remove"
                      onClick={removeCoverImage}
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="ntm-cover-empty">
                    <div className="ntm-cover-icon-box">
                      <ImageIcon size={28} className="ntm-cover-icon" />
                    </div>
                    <span className="ntm-cover-title">Upload Cover Image</span>
                    <span className="ntm-cover-sub">JPG, PNG or WebP</span>
                    <span className="ntm-cover-sub">(Max 5MB)</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="ntm-hidden-input"
                  onChange={handleImageSelect}
                />
              </div>
              {coverError && <span className="ntm-error-text">{coverError}</span>}
            </div>

            {/* Template Name & ID */}
            <div className="ntm-name-col">
              <div className="ntm-form-field">
                <label className="ntm-label">
                  Template Name <span className="ntm-req">*</span>
                </label>
                <input
                  type="text"
                  className="ntm-input"
                  placeholder="e.g. Luxury 4BHK Penthouse BOQ"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  maxLength={160}
                  required
                />
              </div>

              <div className="ntm-form-field" style={{ marginTop: 12 }}>
                <label className="ntm-label">Template ID</label>
                <input
                  type="text"
                  className="ntm-input ntm-input-disabled"
                  value="Auto-generated after saving"
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Row 2: Category & Project Type */}
          <div className="ntm-two-col-row">
            <div className="ntm-form-field">
              <label className="ntm-label">
                Category <span className="ntm-req">*</span>
              </label>
              <div className="ntm-select-wrap">
                <select className="ntm-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="INTERIOR">Interior</option>
                  <option value="KITCHEN">Kitchen</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="Flooring">Flooring</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Painting">Painting</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Civil Works">Civil Works</option>
                </select>
              </div>
            </div>

            <div className="ntm-form-field">
              <label className="ntm-label">
                Project Type <span className="ntm-req">*</span>
              </label>
              <div className="ntm-select-wrap">
                <select className="ntm-select" value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Office">Office</option>
                  <option value="Retail">Retail</option>
                  <option value="Turnkey">Turnkey</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 3: Description */}
          <div className="ntm-form-field">
            <label className="ntm-label">Description</label>
            <textarea
              className="ntm-textarea"
              rows={3}
              placeholder="Brief description of when to use this template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Row 4: Tags */}
          <div className="ntm-form-field">
            <label className="ntm-label">Tags</label>
            <div className="ntm-tag-input-box">
              {tags.map((tag) => (
                <span key={tag} className="ntm-tag-pill">
                  {tag}
                  <button type="button" className="ntm-tag-remove" onClick={() => handleRemoveTag(tag)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="ntm-tag-input"
                placeholder={tags.length === 0 ? "Add tags and press Enter..." : "Add tag..."}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddTag();
                  } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                    setTags(tags.slice(0, -1));
                  }
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="ntm-actions">
            <button type="button" className="ntm-btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="ntm-btn-save" disabled={saving}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : "Create BOQ Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 2. Edit BOQ Template Modal ──────────────────────────────────────
interface EditBoqModalProps {
  template: BoqTemplateItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}

export function EditBoqTemplateModal({ template, isOpen, onClose, onSuccess }: EditBoqModalProps) {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(template?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [category, setCategory] = useState(template?.category || "INTERIOR");
  const [projectType, setProjectType] = useState(template?.projectType || "Residential");
  const [status, setStatus] = useState(template?.status || "ACTIVE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  React.useEffect(() => {
    if (template) {
      setName(template.name || "");
      setDescription(template.description || "");
      setCategory(template.category || "INTERIOR");
      setProjectType(template.projectType || "Residential");
      setStatus(template.status || "ACTIVE");
      setCoverPreview(template.imageUrl || null);
      setCoverFile(null);
    }
  }, [template]);

  if (!isOpen || !template) return null;

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setCoverError("Only JPG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError("Image size must be less than 5 MB.");
      return;
    }

    setCoverFile(file);
    setCoverError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeCoverImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a template name.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let finalImageUrl: string | null | undefined = undefined;
      if (coverFile) {
        try {
          const uploadRes = await uploadBoqTemplateImage(coverFile);
          finalImageUrl = uploadRes?.url || null;
        } catch {
          finalImageUrl = coverPreview;
        }
      } else if (coverPreview === null) {
        finalImageUrl = null;
      }

      const updateData: Record<string, any> = {
        name: name.trim(),
        description: description.trim(),
        category,
        projectType,
        status,
      };
      if (finalImageUrl !== undefined) {
        updateData.imageUrl = finalImageUrl;
      }

      const updated = await updateBoqTemplate(template.id, updateData);
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update template.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="new-template-modal-overlay" onClick={onClose}>
      <div className="new-template-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ntm-header">
          <div className="ntm-header-info">
            <h2>Edit BOQ Template</h2>
            <p>Update template properties and classification.</p>
          </div>
          <button type="button" className="ntm-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="ntm-api-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Row 1: Cover Image & Template Name + ID */}
          <div className="ntm-top-row">
            {/* Cover Image Upload */}
            <div className="ntm-cover-col">
              <label className="ntm-label">Cover Image</label>
              <div
                className={`ntm-cover-box ${coverPreview ? "has-preview" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                }}
              >
                {coverPreview ? (
                  <div className="ntm-cover-preview-wrap">
                    <img src={coverPreview} alt="Cover preview" className="ntm-cover-img" />
                    <button
                      type="button"
                      className="ntm-cover-remove"
                      onClick={removeCoverImage}
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="ntm-cover-empty">
                    <div className="ntm-cover-icon-box">
                      <ImageIcon size={28} className="ntm-cover-icon" />
                    </div>
                    <span className="ntm-cover-title">Upload Cover Image</span>
                    <span className="ntm-cover-sub">JPG, PNG or WebP</span>
                    <span className="ntm-cover-sub">(Max 5MB)</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="ntm-hidden-input"
                  onChange={handleImageSelect}
                />
              </div>
              {coverError && <span className="ntm-error-text">{coverError}</span>}
            </div>

            {/* Template Name & ID */}
            <div className="ntm-name-col">
              <div className="ntm-form-field">
                <label className="ntm-label">
                  Template Name <span className="ntm-req">*</span>
                </label>
                <input
                  type="text"
                  className="ntm-input"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                />
              </div>

              <div className="ntm-form-field" style={{ marginTop: 12 }}>
                <label className="ntm-label">Template ID</label>
                <input
                  type="text"
                  className="ntm-input ntm-input-disabled"
                  value={template.templateCode || template.id}
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Row 2: Category, Project Type, Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div className="ntm-form-field">
              <label className="ntm-label">Category</label>
              <div className="ntm-select-wrap">
                <select className="ntm-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="INTERIOR">Interior</option>
                  <option value="KITCHEN">Kitchen</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="Flooring">Flooring</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Painting">Painting</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Civil Works">Civil Works</option>
                </select>
              </div>
            </div>

            <div className="ntm-form-field">
              <label className="ntm-label">Project Type</label>
              <div className="ntm-select-wrap">
                <select className="ntm-select" value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Office">Office</option>
                  <option value="Retail">Retail</option>
                  <option value="Turnkey">Turnkey</option>
                </select>
              </div>
            </div>

            <div className="ntm-form-field">
              <label className="ntm-label">Status</label>
              <div className="ntm-select-wrap">
                <select className="ntm-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 3: Description */}
          <div className="ntm-form-field">
            <label className="ntm-label">Description</label>
            <textarea
              className="ntm-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="ntm-actions">
            <button type="button" className="ntm-btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="ntm-btn-save" disabled={saving}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 3. Use BOQ Template Modal ───────────────────────────────────────
interface UseBoqModalProps {
  template: BoqTemplateItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function UseBoqTemplateModal({ template, isOpen, onClose, onSuccess }: UseBoqModalProps) {
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [using, setUsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !template) return null;

  const handleUse = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsing(true);
    setError(null);
    try {
      await useBoqTemplate(template.id, {
        projectName: projectName.trim() || undefined,
        clientName: clientName.trim() || undefined,
      });
      onSuccess(`BOQ instantiated from "${template.name}". Use count updated.`);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to use template.");
    } finally {
      setUsing(false);
    }
  };

  return (
    <div className="new-template-modal-overlay" onClick={onClose}>
      <div className="new-template-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ntm-header">
          <div className="ntm-header-info">
            <h2>Use Template</h2>
            <p>Create a new BOQ instance from &quot;{template.name}&quot;.</p>
          </div>
          <button type="button" className="ntm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="ntm-api-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUse}>
          <div className="ntm-field">
            <label>Project Name</label>
            <input
              type="text"
              placeholder="e.g. Sharma Villa Interiors"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div className="ntm-field">
            <label>Client Name</label>
            <input
              type="text"
              placeholder="e.g. Rajesh Sharma"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div className="ntm-actions">
            <button type="button" className="ntm-btn-cancel" onClick={onClose} disabled={using}>
              Cancel
            </button>
            <button type="submit" className="ntm-btn-save" disabled={using}>
              {using ? <Loader2 size={16} className="animate-spin" /> : "Use Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 4. Add BOQ Section Modal ────────────────────────────────────────
interface AddSectionModalProps {
  templateId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}

export function AddBoqSectionModal({ templateId, isOpen, onClose, onSuccess }: AddSectionModalProps) {
  const [sectionName, setSectionName] = useState("");
  const [categoryName, setCategoryName] = useState("Furniture");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName.trim()) {
      setError("Please enter a section name.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await addBoqTemplateSection(templateId, {
        name: sectionName.trim(),
        category: categoryName.trim() || "General",
      });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add section.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="new-template-modal-overlay" onClick={onClose}>
      <div className="new-template-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ntm-header">
          <div className="ntm-header-info">
            <h2>Add BOQ Section</h2>
            <p>Add a new section or area to this BOQ template structure.</p>
          </div>
          <button type="button" className="ntm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="ntm-api-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="ntm-field">
            <label>Section Name *</label>
            <input
              type="text"
              placeholder="e.g. Master Bedroom, Balcony, Corridor"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              required
            />
          </div>

          <div className="ntm-field">
            <label>Initial Category</label>
            <input
              type="text"
              placeholder="e.g. Furniture, Lighting, Civil"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </div>

          <div className="ntm-actions">
            <button type="button" className="ntm-btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="ntm-btn-save" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : "Add Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 5. Add BOQ Item Modal ───────────────────────────────────────────
interface AddItemModalProps {
  templateId: string;
  sectionName: string;
  categoryName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}

export function AddBoqItemModal({
  templateId,
  sectionName,
  categoryName,
  isOpen,
  onClose,
  onSuccess,
}: AddItemModalProps) {
  const [code, setCode] = useState(`FUR-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("Nos");
  const [quantity, setQuantity] = useState(1);
  const [rate, setRate] = useState(5000);
  const [wastePercent, setWastePercent] = useState(5);
  const [taxPercent, setTaxPercent] = useState(18);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time calculation: Quantity * Rate * (1 + Waste/100) * (1 + Tax/100)
  const baseCost = quantity * rate;
  const calculatedAmount = Math.round(baseCost * (1 + wastePercent / 100) * (1 + taxPercent / 100) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter an item name.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await addBoqTemplateItem(templateId, {
        sectionName,
        categoryName,
        code,
        name: name.trim(),
        description: description.trim(),
        unit,
        quantity,
        rateBasis: "Current Library Rate",
        rate,
        wastePercent,
        taxPercent,
      });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="new-template-modal-overlay" onClick={onClose}>
      <div className="new-template-modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="ntm-header">
          <div className="ntm-header-info">
            <h2>Add Line Item</h2>
            <p>
              Adding to <b>{sectionName}</b> &gt; <b>{categoryName}</b>
            </p>
          </div>
          <button type="button" className="ntm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="ntm-api-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
            <div className="ntm-field">
              <label>Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div className="ntm-field">
              <label>Item Name *</label>
              <input
                type="text"
                placeholder="e.g. Wardrobe, Bed, Table"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="ntm-field">
            <label>Description / Specification</label>
            <input
              type="text"
              placeholder="e.g. 19mm BWP ply, laminate finish"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div className="ntm-field">
              <label>Unit *</label>
              <input
                type="text"
                placeholder="Sq.ft, Nos, R.ft"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
              />
            </div>
            <div className="ntm-field">
              <label>Quantity *</label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>
            <div className="ntm-field">
              <label>Rate (₹) *</label>
              <input
                type="number"
                min="0"
                step="any"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="ntm-field">
              <label>Waste (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={wastePercent}
                onChange={(e) => setWastePercent(Number(e.target.value))}
              />
            </div>
            <div className="ntm-field">
              <label>Tax (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Amount Preview */}
          <div
            style={{
              padding: "12px 16px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 8,
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>Calculated Total Amount:</span>
            <span style={{ fontSize: 16, color: "#15803d", fontWeight: 800 }}>
              ₹{calculatedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="ntm-actions">
            <button type="button" className="ntm-btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="ntm-btn-save" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
