"use client";

import React, { useState, useMemo } from "react";
import { X, Search, ChevronDown, ChevronUp, Plus } from "lucide-react";

interface BoqTemplatesDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    templates: Array<{
        id: string;
        name: string;
        description: string | null;
        tags: string[] | null;
        use_count?: number;
        useCount?: number;
        roomsCount?: number;
        sections?: number;
        itemsCount?: number;
        items?: number;
        snapshot?: any;
    }>;
    onSelectTemplate: (templateId: string) => void;
    onCreateNewTemplate?: () => void;
}

export default function BoqTemplatesDrawer({
    isOpen,
    onClose,
    templates,
    onSelectTemplate,
    onCreateNewTemplate,
}: BoqTemplatesDrawerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedIds((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const filteredTemplates = useMemo(() => {
        if (!searchQuery.trim()) return templates;
        const q = searchQuery.toLowerCase();
        return templates.filter(
            (t) =>
                t.name.toLowerCase().includes(q) ||
                (t.description && t.description.toLowerCase().includes(q)) ||
                (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
        );
    }, [templates, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="boq-modal-backdrop" onClick={onClose}>
            <aside
                className="boq-templates-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="BOQ Templates"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="boq-templates-drawer-header">
                    <div>
                        <h3>Templates</h3>
                        <p>{templates.length} templates</p>
                    </div>
                    <button
                        type="button"
                        className="boq-details-close-btn"
                        onClick={onClose}
                        aria-label="Close templates drawer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search & New Template Row */}
                <div className="boq-templates-drawer-search-row">
                    <div className="boq-templates-search-input-wrap">
                        <Search size={16} className="boq-search-icon" />
                        <input
                            type="text"
                            placeholder="Select..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search templates"
                        />
                    </div>
                    <button
                        type="button"
                        className="boq-templates-new-btn"
                        onClick={() => {
                            if (onCreateNewTemplate) {
                                onCreateNewTemplate();
                            } else {
                                window.location.assign("/templates/new");
                            }
                        }}
                    >
                        <span>New Template</span>
                        <Plus size={16} />
                    </button>
                </div>

                {/* Templates List */}
                <div className="boq-templates-drawer-list">
                    {filteredTemplates.length === 0 ? (
                        <div className="boq-templates-empty">
                            <p>No templates found.</p>
                        </div>
                    ) : (
                        filteredTemplates.map((template, idx) => {
                            const isExpanded = expandedIds[template.id] ?? idx === 0;
                            const roomCount =
                                template.roomsCount ||
                                template.sections ||
                                (template.snapshot?.rooms ? template.snapshot.rooms.length : 8);
                            const itemCount =
                                template.itemsCount ||
                                template.items ||
                                124;
                            const useCount =
                                template.useCount ??
                                template.use_count ??
                                18;
                            const tags =
                                template.tags && template.tags.length > 0
                                    ? template.tags
                                    : ["Residential", "Popular"];

                            // Extract preview items from template snapshot if available
                            const previewItems = template.snapshot?.rooms?.[0]?.categories?.[0]?.items || [
                                {
                                    name: "King Size Platform Bed Walnut Veneer",
                                    spec: "Custom, 6×6.5ft | Monarch Furnitures",
                                    price: "₹1,85,000/No",
                                    room: "Master Bedroom",
                                    category: "Furniture",
                                },
                                {
                                    name: "King Size Platform Bed Walnut Veneer",
                                    spec: "Custom, 6×6.5ft | Monarch Furnitures",
                                    price: "₹1,85,000/No",
                                    room: "Master Bedroom",
                                    category: "Furniture",
                                },
                                {
                                    name: "King Size Platform Bed Walnut Veneer",
                                    spec: "Custom, 6×6.5ft | Monarch Furnitures",
                                    price: "₹1,85,000/No",
                                    room: "Master Bedroom",
                                    category: "Furniture",
                                },
                            ];

                            return (
                                <div key={template.id} className="boq-template-card">
                                    <div className="boq-template-card-header">
                                        <div
                                            className="boq-template-card-title-group"
                                            onClick={(e) => toggleExpand(template.id, e)}
                                        >
                                            <button
                                                type="button"
                                                className="boq-template-expand-btn"
                                                aria-label={isExpanded ? "Collapse" : "Expand"}
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                            <div>
                                                <strong className="boq-template-title">{template.name}</strong>
                                                <div className="boq-template-meta-text">
                                                    <span>Rooms: {roomCount}</span>
                                                    <span className="boq-meta-dot">|</span>
                                                    <span>Items: {itemCount}</span>
                                                    <span className="boq-meta-dot">|</span>
                                                    <span>Used: {useCount}x</span>
                                                </div>
                                                <div className="boq-template-tags-row">
                                                    {tags.map((tag) => (
                                                        <span key={tag} className="boq-template-tag-pill">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="boq-template-use-btn"
                                            onClick={() => onSelectTemplate(template.id)}
                                        >
                                            Use
                                        </button>
                                    </div>

                                    {/* Expanded Preview Items */}
                                    {isExpanded && (
                                        <div className="boq-template-card-expanded-body">
                                            {previewItems.slice(0, 3).map((item: any, itemIdx: number) => (
                                                <div key={itemIdx} className="boq-template-preview-row">
                                                    <div className="boq-template-preview-info">
                                                        <strong className="boq-preview-item-name">
                                                            {item.name}
                                                        </strong>
                                                        <span className="boq-preview-item-spec">
                                                            {item.description || item.spec || "Custom fitout"}
                                                        </span>
                                                        <div className="boq-preview-pills">
                                                            <span className="boq-preview-room-pill">
                                                                {item.room || "Master Bedroom"}
                                                            </span>
                                                            <span className="boq-preview-cat-pill">
                                                                {item.category || "Furniture"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="boq-template-preview-price">
                                                        {item.price || (item.rate ? `₹${Number(item.rate).toLocaleString('en-IN')}/${item.unit || 'No'}` : "₹1,85,000/No")}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </aside>
        </div>
    );
}
