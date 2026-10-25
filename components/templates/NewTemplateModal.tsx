"use client";

import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent, DragEvent } from "react";
import { X, Image as ImageIcon, ArrowRight, Loader2, ChevronDown } from "lucide-react";
import { uploadTemplateImage } from "@/lib/api/templates";

export interface NewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (template: Record<string, unknown>) => void;
}

export default function NewTemplateModal({ isOpen, onClose, onSuccess }: NewTemplateModalProps) {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    templateType: "",
    businessType: "",
    team: "",
    region: "",
    visibility: "workspace", // "workspace" = Organisation | "team" = Team | "private" = Private
    description: "",
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [teams, setTeams] = useState<string[]>([
    "Design Team",
    "Architecture",
    "Estimation",
    "Project Management",
    "Procurement"
  ]);

  const [regions, setRegions] = useState<string[]>([
    "Global",
    "North America",
    "Europe",
    "Middle East",
    "India",
    "Asia Pacific"
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch real teams and regions from workspace if available
  useEffect(() => {
    let mounted = true;
    async function loadWorkspaceSettings() {
      try {
        const [locRes, roleRes] = await Promise.all([
          fetch("/api/v1/settings/organization/locations", { credentials: "include" }),
          fetch("/api/v1/settings/security/roles", { credentials: "include" }),
        ]);

        if (locRes.ok) {
          const body = await locRes.json();
          const items = body.data?.items || body.data;
          if (Array.isArray(items) && items.length > 0) {
            const locNames: string[] = items
              .map((l: { name?: string; city?: string; country?: string }) => l.name || l.city || l.country)
              .filter((x): x is string => typeof x === "string" && x.length > 0);
            if (mounted && locNames.length > 0) {
              setRegions(prev => Array.from(new Set([...locNames, ...prev])));
            }
          }
        }

        if (roleRes.ok) {
          const body = await roleRes.json();
          const items = body.data?.roles || body.data?.items;
          if (Array.isArray(items) && items.length > 0) {
            const roleNames: string[] = items
              .map((r: { name?: string }) => r.name)
              .filter((x): x is string => typeof x === "string" && x.length > 0);
            if (mounted && roleNames.length > 0) {
              setTeams(prev => Array.from(new Set([...roleNames, ...prev])));
            }
          }
        }
      } catch {
        // Fall back to default lists
      }
    }

    if (isOpen) {
      loadWorkspaceSettings();
      // Autofocus template name input when modal opens
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors(prev => ({ ...prev, coverImage: "Only JPG, PNG or WebP images are allowed." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, coverImage: "Image size must be less than 5 MB." }));
      return;
    }

    setCoverFile(file);
    setErrors(prev => {
      const next = { ...prev };
      delete next.coverImage;
      return next;
    });

    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const removeCoverImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/^,+|,+$/g, "");
      if (val && !tags.includes(val) && tags.length < 20) {
        setTags(prev => [...prev, val]);
      }
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) {
      errs.name = "Template Name is required";
    }
    if (!form.templateType) {
      errs.templateType = "Template Type is required";
    }
    if (!form.businessType) {
      errs.businessType = "Business Type is required";
    }
    if (!form.team) {
      errs.team = "Team is required";
    }
    if (!form.region) {
      errs.region = "Region is required";
    }
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      const el = document.getElementById(`ntm-${firstKey}`);
      el?.focus();
    }

    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setApiError(null);

    try {
      let uploadedImageUrl: string | null = null;
      if (coverFile) {
        try {
          const uploadRes = await uploadTemplateImage(coverFile);
          uploadedImageUrl = uploadRes.url || null;
        } catch {
          // If upload fails, use preview data url or continue
          uploadedImageUrl = coverPreview;
        }
      }

      // Check if BOQ Template or Project Template
      if (form.templateType === "BOQ Template") {
        const payload = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          tags,
          businessType: form.businessType,
          team: form.team,
          region: form.region,
          imageUrl: uploadedImageUrl || undefined,
        };

        const res = await fetch("/api/v1/boq-templates", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body?.error?.message || body?.message || "Failed to create BOQ template.");
        }
        onSuccess(body.data);
      } else {
        const payload = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          businessType: form.businessType,
          projectType: form.businessType || "Residential",
          team: form.team,
          region: form.region,
          visibility: form.visibility,
          imageUrl: uploadedImageUrl || undefined,
          tags,
          structure: { areas: [] },
          costingBoq: { sections: [] },
          workflow: { stages: [], tasks: [], milestones: [], approvals: [], rules: [] },
          documents: [],
        };

        const res = await fetch("/api/v1/project-templates", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body?.error?.message || body?.message || "Failed to create template.");
        }
        onSuccess(body.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create template. Please try again.";
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="new-template-modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ntm-title"
      aria-describedby="ntm-subtitle"
    >
      <div 
        className="new-template-modal-card" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header: Frame 2147225093 */}
        <div className="ntm-header">
          <div className="ntm-header-info">
            <h2 id="ntm-title">New Template</h2>
            <p id="ntm-subtitle">Enter the basic details for your template.</p>
          </div>
          <button 
            type="button" 
            className="ntm-close-btn" 
            onClick={onClose} 
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {apiError && (
          <div className="ntm-api-error" role="alert">
            {apiError}
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} noValidate className="ntm-form">
          {/* Inner Form White Surface: Frame 2147225027 */}
          <div className="ntm-form-surface">
            {/* Row 1: Cover Image & Template Name + ID (Frame 2147225614) */}
            <div className="ntm-top-row">
              {/* Cover Image Upload Area: Frame 2147225613 */}
              <div className="ntm-cover-col">
                <label className="ntm-label" htmlFor="ntm-coverImage">
                  Cover Image <span className="ntm-req">*</span>
                </label>
                <div 
                  id="ntm-coverImage"
                  className={`ntm-cover-box ${coverPreview ? "has-preview" : ""} ${isDragging ? "drag-over" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  tabIndex={0}
                  role="button"
                  aria-label="Upload Cover Image"
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
                >
                  {coverPreview ? (
                    <div className="ntm-cover-preview-wrap">
                      <img src={coverPreview} alt="Cover preview" className="ntm-cover-img" />
                      <button 
                        type="button" 
                        className="ntm-cover-remove" 
                        onClick={removeCoverImage} 
                        aria-label="Remove cover image"
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
                {errors.coverImage && <span className="ntm-error-text">{errors.coverImage}</span>}
              </div>

              {/* Template Name & ID (Frame 2147225611) */}
              <div className="ntm-name-col">
                <div className="ntm-form-field">
                  <label className="ntm-label" htmlFor="ntm-name">
                    Template Name <span className="ntm-req">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    id="ntm-name"
                    type="text"
                    className={`ntm-input ${errors.name ? "has-error" : ""}`}
                    placeholder="Enter template name"
                    value={form.name}
                    onChange={e => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                    }}
                    maxLength={160}
                    aria-required="true"
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <span className="ntm-error-text">{errors.name}</span>}
                </div>

                <div className="ntm-form-field">
                  <label className="ntm-label" htmlFor="ntm-id">Template ID</label>
                  <input
                    id="ntm-id"
                    type="text"
                    className="ntm-input ntm-input-disabled"
                    value="Auto-generated after saving"
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Template Type & Business Type (Frame 2147225098) */}
            <div className="ntm-two-col-row">
              <div className="ntm-form-field">
                <label className="ntm-label" htmlFor="ntm-templateType">
                  Template Type <span className="ntm-req">*</span>
                </label>
                <div className="ntm-select-wrap">
                  <select
                    id="ntm-templateType"
                    className={`ntm-select ${errors.templateType ? "has-error" : ""}`}
                    value={form.templateType}
                    onChange={e => {
                      setForm({ ...form, templateType: e.target.value });
                      if (errors.templateType) setErrors(prev => ({ ...prev, templateType: "" }));
                    }}
                    aria-required="true"
                    aria-invalid={!!errors.templateType}
                  >
                    <option value="">Select template type</option>
                    <option value="Project Template">Project Template</option>
                    <option value="BOQ Template">BOQ Template</option>
                    <option value="Document Template">Document Template</option>
                  </select>
                  <span className="ntm-select-icon">
                    <ChevronDown size={18} />
                  </span>
                </div>
                {errors.templateType && <span className="ntm-error-text">{errors.templateType}</span>}
              </div>

              <div className="ntm-form-field">
                <label className="ntm-label" htmlFor="ntm-businessType">
                  Business Type <span className="ntm-req">*</span>
                </label>
                <div className="ntm-select-wrap">
                  <select
                    id="ntm-businessType"
                    className={`ntm-select ${errors.businessType ? "has-error" : ""}`}
                    value={form.businessType}
                    onChange={e => {
                      setForm({ ...form, businessType: e.target.value });
                      if (errors.businessType) setErrors(prev => ({ ...prev, businessType: "" }));
                    }}
                    aria-required="true"
                    aria-invalid={!!errors.businessType}
                  >
                    <option value="">Select business type</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Retail">Retail</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Educational">Educational</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                  <span className="ntm-select-icon">
                    <ChevronDown size={18} />
                  </span>
                </div>
                {errors.businessType && <span className="ntm-error-text">{errors.businessType}</span>}
              </div>
            </div>

            {/* Row 3: Team & Region (Frame 2147225612) */}
            <div className="ntm-two-col-row">
              <div className="ntm-form-field">
                <label className="ntm-label" htmlFor="ntm-team">
                  Team <span className="ntm-req">*</span>
                </label>
                <div className="ntm-select-wrap">
                  <select
                    id="ntm-team"
                    className={`ntm-select ${errors.team ? "has-error" : ""}`}
                    value={form.team}
                    onChange={e => {
                      setForm({ ...form, team: e.target.value });
                      if (errors.team) setErrors(prev => ({ ...prev, team: "" }));
                    }}
                    aria-required="true"
                    aria-invalid={!!errors.team}
                  >
                    <option value="">Select team</option>
                    {teams.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="ntm-select-icon">
                    <ChevronDown size={18} />
                  </span>
                </div>
                {errors.team && <span className="ntm-error-text">{errors.team}</span>}
              </div>

              <div className="ntm-form-field">
                <label className="ntm-label" htmlFor="ntm-region">
                  Region <span className="ntm-req">*</span>
                </label>
                <div className="ntm-select-wrap">
                  <select
                    id="ntm-region"
                    className={`ntm-select ${errors.region ? "has-error" : ""}`}
                    value={form.region}
                    onChange={e => {
                      setForm({ ...form, region: e.target.value });
                      if (errors.region) setErrors(prev => ({ ...prev, region: "" }));
                    }}
                    aria-required="true"
                    aria-invalid={!!errors.region}
                  >
                    <option value="">Select region</option>
                    {regions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <span className="ntm-select-icon">
                    <ChevronDown size={18} />
                  </span>
                </div>
                {errors.region && <span className="ntm-error-text">{errors.region}</span>}
              </div>
            </div>

            {/* Row 4: Tags */}
            <div className="ntm-form-field">
              <label className="ntm-label" htmlFor="ntm-tags-input">Tags</label>
              <div 
                className="ntm-tags-container"
                onClick={() => document.getElementById("ntm-tags-input")?.focus()}
              >
                {tags.map(t => (
                  <span key={t} className="ntm-tag-pill">
                    {t}
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); removeTag(t); }} 
                      aria-label={`Remove tag ${t}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  id="ntm-tags-input"
                  type="text"
                  className="ntm-tag-input"
                  placeholder={tags.length === 0 ? "Add tags and press Enter" : ""}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
              </div>
            </div>

            {/* Row 5: Visibility (Frame 2147225303) */}
            <div className="ntm-form-field">
              <label className="ntm-label">Visibility</label>
              <div className="ntm-visibility-group" role="radiogroup" aria-label="Template Visibility">
                <label className={`ntm-radio-pill ${form.visibility === "workspace" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="visibility"
                    value="workspace"
                    checked={form.visibility === "workspace"}
                    onChange={() => setForm({ ...form, visibility: "workspace" })}
                  />
                  <span className="ntm-radio-dot" />
                  <span>Organisation</span>
                </label>

                <label className={`ntm-radio-pill ${form.visibility === "team" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="visibility"
                    value="team"
                    checked={form.visibility === "team"}
                    onChange={() => setForm({ ...form, visibility: "team" })}
                  />
                  <span className="ntm-radio-dot" />
                  <span>Team</span>
                </label>

                <label className={`ntm-radio-pill ${form.visibility === "private" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={form.visibility === "private"}
                    onChange={() => setForm({ ...form, visibility: "private" })}
                  />
                  <span className="ntm-radio-dot" />
                  <span>Private</span>
                </label>
              </div>
            </div>

            {/* Row 6: Description */}
            <div className="ntm-form-field">
              <label className="ntm-label" htmlFor="ntm-description">Description</label>
              <textarea
                id="ntm-description"
                className="ntm-textarea"
                rows={3}
                placeholder="Enter template description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                maxLength={5000}
              />
            </div>
          </div>

          {/* Modal Footer: Frame 2147225097 */}
          <div className="ntm-footer">
            <button
              type="button"
              className="ntm-btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ntm-btn-next"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="ntm-spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
