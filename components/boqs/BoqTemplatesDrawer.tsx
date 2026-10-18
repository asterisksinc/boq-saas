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
        rooms?: any[];
        snapshot?: any;
    }>;
    onSelectTemplate: (templateId: string) => void;
    onCreateNewTemplate?: () => void;
}

const defaultPreviewItems = [
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
                className="boq-templates-drawer-redesign"
                role="dialog"
                aria-modal="true"
                aria-label="BOQ Templates"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Figma Frame 2147225093 header row) */}
                <div className="boq-templates-drawer-header">
                    <div>
                        <h3 className="boq-templates-drawer-title">Templates</h3>
                        <p className="boq-templates-drawer-subtitle">{templates.length} templates</p>
                    </div>
                    <button
                        type="button"
                        className="boq-close-btn-redesign"
                        onClick={onClose}
                        aria-label="Close templates drawer"
                    >
                        <X size={20} color="#0F172A" />
                    </button>
                </div>

                {/* Inner White Container (Figma Frame 2147225096) */}
                <div className="boq-templates-inner-panel">
                    {/* Search & New Template Row (Figma Frame 2147225122) */}
                    <div className="boq-templates-drawer-search-row">
                        <div className="boq-templates-search-input-wrap">
                            <Search size={18} color="#0F172A" className="boq-search-icon" />
                            <input
                                type="text"
                                placeholder="Select..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Search templates"
                                className="boq-templates-search-input"
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
                            <Plus size={18} color="#FFFFFF" />
                        </button>
                    </div>

                    {/* Templates List (Figma Frame 2147225123) */}
                    <div className="boq-templates-drawer-list">
                        {filteredTemplates.length === 0 ? (
                            <div className="boq-templates-empty" style={{ textAlign: "center", padding: "32px", color: "#64748B" }}>
                                <p>No templates found.</p>
                            </div>
                        ) : (
                            filteredTemplates.map((template, idx) => {
                                const isExpanded = expandedIds[template.id] ?? idx === 0;
                                const roomCount =
                                    template.roomsCount ||
                                    template.sections ||
                                    (template.rooms ? template.rooms.length : (template.snapshot?.rooms ? template.snapshot.rooms.length : 8));
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

                                // Extract preview items from template rooms/snapshot
                                const rawRooms = template.rooms || template.snapshot?.rooms;
                                let extractedPreviewItems: any[] = [];
                                if (Array.isArray(rawRooms) && rawRooms.length > 0) {
                                    for (const rm of rawRooms) {
                                        for (const ct of rm.categories || []) {
                                            for (const itm of ct.items || []) {
                                                extractedPreviewItems.push({
                                                    name: itm.name,
                                                    spec: itm.description || itm.spec || "Custom specification",
                                                    price: itm.rate ? `₹${Number(itm.rate).toLocaleString("en-IN")}/${itm.unit || "No"}` : "₹1,85,000/No",
                                                    room: rm.name,
                                                    category: ct.name || "Furniture",
                                                });
                                                if (extractedPreviewItems.length >= 3) break;
                                            }
                                            if (extractedPreviewItems.length >= 3) break;
                                        }
                                        if (extractedPreviewItems.length >= 3) break;
                                    }
                                }
                                const previewItems = extractedPreviewItems.length > 0 ? extractedPreviewItems : defaultPreviewItems;

                                return (
                                    <div
                                        key={template.id}
                                        className={isExpanded ? "boq-template-expanded-card" : "boq-template-collapsed-card"}
                                    >
                                        {/* Card Header (Figma Frame 2147225129) */}
                                        <div className="boq-template-card-header">
                                            <button
                                                type="button"
                                                className="boq-template-expand-btn"
                                                onClick={(e) => toggleExpand(template.id, e)}
                                                aria-label={isExpanded ? "Collapse" : "Expand"}
                                            >
                                                {isExpanded ? <ChevronUp size={18} color="#0F172A" /> : <ChevronDown size={18} color="#0F172A" />}
                                            </button>
                                            <div
                                                className="boq-template-card-main-info"
                                                onClick={(e) => toggleExpand(template.id, e)}
                                                style={{ cursor: "pointer", flex: 1 }}
                                            >
                                                <div className="boq-template-title">{template.name}</div>
                                                <div className="boq-template-meta-row">
                                                    <span>Rooms: {roomCount}</span>
                                                    <span className="boq-meta-divider" />
                                                    <span>Items: {itemCount}</span>
                                                    <span className="boq-meta-divider" />
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

                                            <button
                                                type="button"
                                                className="boq-template-use-btn"
                                                onClick={() => onSelectTemplate(template.id)}
                                            >
                                                Use
                                            </button>
                                        </div>

                                        {/* Expanded Preview Items Panel (Figma Frame 2147225130) */}
                                        {isExpanded && (
                                            <div className="boq-template-card-expanded-body">
                                                {previewItems.slice(0, 3).map((item: any, itemIdx: number) => (
                                                    <React.Fragment key={itemIdx}>
                                                        {itemIdx > 0 && <div className="boq-template-preview-divider" />}
                                                        <div className="boq-template-preview-row">
                                                            <div className="boq-template-preview-info">
                                                                <div className="boq-preview-item-name">
                                                                    {item.name}
                                                                </div>
                                                                <div className="boq-preview-item-spec">
                                                                    {item.description || item.spec || "Custom fitout"}
                                                                </div>
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
                                                                {item.price || (item.rate ? `₹${Number(item.rate).toLocaleString("en-IN")}/${item.unit || "No"}` : "₹1,85,000/No")}
                                                            </div>
                                                        </div>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </aside>
        </div>
    );
}
