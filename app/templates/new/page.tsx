"use client";

import React, { useState, FormEvent, KeyboardEvent } from "react";
import DashboardRail from "@/components/DashboardRail";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewTemplatePage() {
  const router = useRouter();
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    businessType: "",
    projectType: "",
    team: "",
    region: "",
    visibility: "workspace",
    imageUrl: "",
    tags: [] as string[]
  });
  
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !form.tags.includes(val) && form.tags.length < 20) {
        setForm(prev => ({ ...prev, tags: [...prev.tags, val] }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        structure: {},
        costingBoq: {},
        workflow: {},
        documents: []
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
      
      router.push(`/templates/${body.data.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="fig-dashboard boq-dashboard">
      <div className="fig-dashboard-glow" />
      <DashboardRail />
      <div className="fig-dashboard-main">
        <header className="fig-dashboard-header">
          <h1>Templates</h1>
          <div className="fig-dashboard-header-actions">
            <label className="fig-dashboard-search">
              <img src="/assets/dashboard/dashboard-search.svg" alt="" />
              <input placeholder="Search..." />
            </label>
            <button className="fig-dashboard-new">...</button>
            <button className="fig-dashboard-bell" aria-label="Notifications">
              <img src="/assets/dashboard/dashboard-notifications.svg" alt="" />
            </button>
            <div className="fig-dashboard-avatar">BO</div>
          </div>
        </header>

        <section className="boq-page-shell templates-content">
          <Link href="/templates" className="template-detail-back">
            <ArrowLeft size={16} /> Back to Templates
          </Link>

          <form className="template-create-form" onSubmit={handleSubmit}>
            <h2>Create New Template</h2>
            
            {error && (
              <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div className="template-form-grid">
              <div className="template-form-field">
                <label>Template Name <span className="required">*</span></label>
                <input
                  required
                  maxLength={160}
                  placeholder="e.g. Standard 3BHK Apartment"
                  value={form.name}
                  onChange={e => handleChange("name", e.target.value)}
                />
              </div>

              <div className="template-form-field">
                <label>Visibility</label>
                <select 
                  value={form.visibility} 
                  onChange={e => handleChange("visibility", e.target.value)}
                >
                  <option value="workspace">Workspace (Shared)</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="template-form-field">
                <label>Business Type <span className="required">*</span></label>
                <select 
                  required
                  value={form.businessType} 
                  onChange={e => handleChange("businessType", e.target.value)}
                >
                  <option value="">Select Business Type</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Retail">Retail</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Educational">Educational</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>

              <div className="template-form-field">
                <label>Project Type <span className="required">*</span></label>
                <select 
                  required
                  value={form.projectType} 
                  onChange={e => handleChange("projectType", e.target.value)}
                >
                  <option value="">Select Project Type</option>
                  <option value="Villa">Villa</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Office">Office</option>
                  <option value="Store">Store</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Hospital">Hospital</option>
                  <option value="School">School</option>
                </select>
              </div>

              <div className="template-form-field">
                <label>Region</label>
                <input
                  placeholder="e.g. North America, India"
                  value={form.region}
                  onChange={e => handleChange("region", e.target.value)}
                />
              </div>

              <div className="template-form-field">
                <label>Team</label>
                <input
                  placeholder="e.g. Design Team Alpha"
                  value={form.team}
                  onChange={e => handleChange("team", e.target.value)}
                />
              </div>

              <div className="template-form-field" style={{ gridColumn: '1 / -1' }}>
                <label>Image URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={form.imageUrl}
                  onChange={e => handleChange("imageUrl", e.target.value)}
                />
              </div>

              <div className="template-form-field" style={{ gridColumn: '1 / -1' }}>
                <label>Tags</label>
                <div className="template-tag-input">
                  {form.tags.map(tag => (
                    <span key={tag} className="template-tag">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    placeholder="Add tags and press Enter..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                </div>
              </div>

              <div className="template-form-field" style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <textarea
                  rows={4}
                  maxLength={5000}
                  placeholder="Describe this template..."
                  value={form.description}
                  onChange={e => handleChange("description", e.target.value)}
                />
              </div>
            </div>

            <div className="template-form-actions">
              <button 
                type="button" 
                className="secondary-button" 
                style={{ width: 'auto', padding: '0 24px' }}
                onClick={() => router.push("/templates")}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="primary-button"
                style={{ width: 'auto', padding: '0 24px' }}
                disabled={saving}
              >
                {saving ? "Creating..." : "Create Template"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
