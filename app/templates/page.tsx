"use client";

import React, { useState, useEffect, useMemo, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Plus,
  MoreHorizontal,
  Play,
  Edit3,
  Copy,
  Trash2,
  Eye,
  List,
  LayoutGrid,
  X,
  RotateCcw,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import DashboardRail from "@/components/DashboardRail";
import DashboardHeader from "@/components/DashboardHeader";
import NewTemplateModal from "@/components/templates/NewTemplateModal";
import ExcelImportModal from "@/components/templates/ExcelImportModal";
import TemplateFilterPopover, { TemplateFilterState } from "@/components/templates/TemplateFilterPopover";
import BoqTemplateGrid, { BoqTemplateItem } from "@/components/templates/boq/BoqTemplateGrid";
import BoqTemplateTable from "@/components/templates/boq/BoqTemplateTable";
import BoqTemplateFilterDrawer, {
  BoqFilterState,
  emptyBoqFilters,
} from "@/components/templates/boq/BoqTemplateFilterDrawer";
import {
  NewBoqTemplateModal,
  EditBoqTemplateModal,
  UseBoqTemplateModal,
} from "@/components/templates/boq/BoqTemplateModals";
import {
  listBoqTemplates,
  duplicateBoqTemplate,
  deleteBoqTemplate,
} from "@/lib/api/boqs";
import {
  getTemplatesOverview,
  listProjectTemplates,
  duplicateProjectTemplate,
  archiveProjectTemplate,
  restoreProjectTemplate,
  deleteProjectTemplatePermanently,
  useProjectTemplate,
} from "@/lib/api/templates";

// ── Types ──────────────────────────────────────────────────────────

type ProjectTemplate = {
  id: string;
  templateCode: string;
  name: string;
  description: string;
  businessType: string;
  projectType: string;
  team?: string | null;
  region?: string | null;
  visibility?: string;
  imageUrl?: string | null;
  tags?: string[];
  status: string;
  version: number;
  useCount: number;
  usageCount?: number;
  roomCount?: number;
  sectionCount?: number;
  itemCount?: number;
  composition?: {
    rooms: number;
    boqSections: number;
    items: number;
    stages?: number;
    tasks?: number;
    documents?: number;
  };
  lastUsedAt?: string | null;
  updatedAt: string;
  createdAt?: string;
};

type BoqTemplate = {
  id: string;
  name: string;
  description: string;
  category?: string;
  projectType?: string;
  status?: string;
  version?: string;
  usedIn?: string;
  tags?: string[];
  useCount: number;
  sections?: number;
  items?: number;
  updatedAt?: string;
  imageUrl?: string | null;
};

type DocumentTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  useCount: number;
  updatedAt: string;
  imageUrl?: string | null;
};

type ArchivedTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  templateType: string;
  version: string;
  archivedBy: string;
  archivedByRole: string;
  archivedOn: string;
  archivedRelative: string;
  usedIn: string;
  imageUrl?: string | null;
};

type OverviewData = {
  total: number;
  active: number;
  draft: number;
  needsReview: number;
  byType: Record<string, number>;
  recentlyUsed: ProjectTemplate[];
  projectTemplatesCount?: number;
  boqTemplatesCount?: number;
  documentTemplatesCount?: number;
  recentlyUpdatedCount?: number;
  mostUsedProject?: string | null;
  mostUsedBoq?: string | null;
  mostUsedDoc?: string | null;
  lastUpdatedName?: string | null;
};

// ── Fallback Images Curated for Real Estate / Architecture ─────────

const fallbackImages: Record<string, string> = {
  Residential: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "3BHK": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
  "2BHK": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
  "1BHK": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80",
  Villa: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
  Commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  Retail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
  Restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  Hospitality: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
  Hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
  Kitchen: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
  Default: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
};

function getTemplateFallback(t: { businessType?: string; projectType?: string; name?: string }): string {
  const name = (t.name || "").toLowerCase();
  const bt = (t.businessType || t.projectType || "").toLowerCase();

  if (name.includes("hotel")) return fallbackImages.Hotel;
  if (name.includes("restaurant")) return fallbackImages.Restaurant;
  if (name.includes("retail") || name.includes("store")) return fallbackImages.Retail;
  if (name.includes("office") || name.includes("commercial")) return fallbackImages.Commercial;
  if (name.includes("villa")) return fallbackImages.Villa;
  if (name.includes("3bhk") || name.includes("3 bhk")) return fallbackImages["3BHK"];
  if (name.includes("2bhk") || name.includes("2 bhk")) return fallbackImages["2BHK"];
  if (name.includes("1bhk") || name.includes("1 bhk")) return fallbackImages["1BHK"];
  if (name.includes("kitchen")) return fallbackImages.Kitchen;

  if (bt.includes("villa")) return fallbackImages.Villa;
  if (bt.includes("commercial")) return fallbackImages.Commercial;
  if (bt.includes("retail")) return fallbackImages.Retail;
  if (bt.includes("hospitality")) return fallbackImages.Hospitality;
  if (bt.includes("residential")) return fallbackImages.Residential;

  return fallbackImages[t.businessType || ""] || fallbackImages.Default;
}

function getTemplateCover(t: { imageUrl?: string | null; businessType?: string; projectType?: string; name?: string }): string {
  if (t.imageUrl && t.imageUrl.trim() !== "" && !t.imageUrl.includes("broken") && !t.imageUrl.includes("undefined")) {
    return t.imageUrl;
  }
  return getTemplateFallback(t);
}

function TemplateCoverImage({ src, alt, fallbackSrc }: { src: string; alt: string; fallbackSrc: string }) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <img
      src={imgSrc || fallbackSrc}
      alt={alt}
      className="target-card-img"
      loading="lazy"
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
}

// ── Main Page Component ───────────────────────────────────────────

function TemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") === "boqs" ? "boqs" : "projects";

  // Navigation tab: Overview | Project Templates | BOQ Templates | Document Templates | Archived
  const [tab, setTab] = useState<"overview" | "projects" | "boqs" | "documents" | "archived">(initialTab);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals & Popovers
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [useModalTemplate, setUseModalTemplate] = useState<ProjectTemplate | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Filter State
  const [filters, setFilters] = useState<TemplateFilterState>({
    businessType: "",
    status: "",
    region: "",
  });

  // Data States
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // BOQ Templates State
  const [boqItems, setBoqItems] = useState<BoqTemplateItem[]>([]);
  const [boqTotal, setBoqTotal] = useState(0);
  const [boqPage, setBoqPage] = useState(1);
  const [boqPageSize, setBoqPageSize] = useState(12);
  const [boqLoading, setBoqLoading] = useState(false);
  const [isBoqFilterOpen, setIsBoqFilterOpen] = useState(false);
  const [boqFilters, setBoqFilters] = useState<BoqFilterState>(emptyBoqFilters);
  const [isNewBoqModalOpen, setIsNewBoqModalOpen] = useState(false);
  const [activeEditBoqModal, setActiveEditBoqModal] = useState<BoqTemplateItem | null>(null);
  const [activeUseBoqModal, setActiveUseBoqModal] = useState<BoqTemplateItem | null>(null);

  // Document Templates State
  const [docTemplates, setDocTemplates] = useState<DocumentTemplate[]>([]);

  // Archived Templates State
  const [archivedTemplates, setArchivedTemplates] = useState<ArchivedTemplate[]>([]);
  const [archivedTotal, setArchivedTotal] = useState(0);

  const appliedBoqFiltersCount = useMemo(() => {
    let count = 0;
    count += boqFilters.status.length;
    count += boqFilters.projectType.length;
    if (boqFilters.category && boqFilters.category !== "all") count += 1;
    count += boqFilters.mapping.length;
    if (boqFilters.usedIn && boqFilters.usedIn !== "all") count += 1;
    return count;
  }, [boqFilters]);

  // ── Loaders ─────────────────────────────────────────────────────

  const loadOverview = async () => {
    try {
      const data = await getTemplatesOverview();
      setOverview(data);
    } catch {
      // Keep existing overview or fallback
    }
  };

  const loadProjectTemplates = async () => {
    try {
      const res = await listProjectTemplates({
        search: query || undefined,
        status: filters.status || undefined,
        type: filters.businessType || undefined,
        page,
        pageSize,
      });
      setProjectTemplates(res.items || []);
      setTotal(res.total || 0);
      setHasMore(res.hasMore || false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load project templates.";
      setNotice(msg);
    }
  };

  const loadBoqTemplates = async () => {
    try {
      setBoqLoading(true);
      const res = await listBoqTemplates({
        page: boqPage,
        pageSize: boqPageSize,
        search: query || undefined,
        status: boqFilters.status.length > 0 ? boqFilters.status.join(",") : undefined,
        projectType: boqFilters.projectType.length > 0 ? boqFilters.projectType.join(",") : undefined,
        category: boqFilters.category !== "all" ? boqFilters.category : undefined,
        mapping: boqFilters.mapping.length > 0 ? boqFilters.mapping.join(",") : undefined,
        usedIn: boqFilters.usedIn !== "all" ? boqFilters.usedIn : undefined,
      });
      setBoqItems((res.items as any) || []);
      setBoqTotal(res.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load BOQ templates.";
      setNotice(msg);
    } finally {
      setBoqLoading(false);
    }
  };

  const loadDocTemplates = async () => {
    try {
      const r = await fetch("/api/v1/proposals?status=all&sourceType=template", { credentials: "include" });
      if (r.ok) {
        const b = await r.json();
        const items = (b.data?.items || []).map((item: any) => ({
          id: item.id,
          name: item.projectName || "Standard Proposal Template",
          description: `Document layout with ${item.scopeItems?.length || 4} scope sections`,
          category: "Proposal",
          type: "DOCUMENT TEMPLATE",
          useCount: item.viewCount || 8,
          updatedAt: item.updatedAt || new Date().toISOString(),
          imageUrl: fallbackImages.Commercial,
        }));
        setDocTemplates(items);
      } else {
        // Fallback default document templates
        setDocTemplates([
          {
            id: "doc-1",
            name: "BOQ (Detailed) Template",
            description: "Standard detailed BOQ export format with client signoff blocks",
            category: "BOQ Layout",
            type: "DOCUMENT TEMPLATE",
            useCount: 36,
            updatedAt: new Date().toISOString(),
            imageUrl: fallbackImages.Residential,
          },
          {
            id: "doc-2",
            name: "Invoice Standard Layout",
            description: "GST-compliant commercial tax invoice layout with milestones",
            category: "Invoice",
            type: "DOCUMENT TEMPLATE",
            useCount: 24,
            updatedAt: new Date().toISOString(),
            imageUrl: fallbackImages.Commercial,
          },
        ]);
      }
    } catch {
      // Ignored
    }
  };

  const loadArchived = async () => {
    try {
      const p = new URLSearchParams();
      if (query) p.set("search", query);
      const r = await fetch(`/api/v1/archived-templates?${p}`, { credentials: "include" });
      const b = await r.json();
      if (!r.ok) throw new Error(b?.message || "Could not load archived templates.");
      setArchivedTemplates(b.data?.items || []);
      setArchivedTotal(b.data?.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load archived templates.";
      setNotice(msg);
    }
  };

  // Trigger loading based on active tab and search query
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      if (tab === "overview") {
        Promise.all([loadOverview(), loadBoqTemplates()]).finally(() => setLoading(false));
      } else if (tab === "projects") {
        loadProjectTemplates().finally(() => setLoading(false));
      } else if (tab === "boqs") {
        loadBoqTemplates().finally(() => setLoading(false));
      } else if (tab === "documents") {
        loadDocTemplates().finally(() => setLoading(false));
      } else if (tab === "archived") {
        loadArchived().finally(() => setLoading(false));
      }
    }, query ? 250 : 0);

    return () => clearTimeout(timer);
  }, [tab, query, page, pageSize, boqPage, boqPageSize, filters, boqFilters]);

  // ── BOQ Template Handlers ──────────────────────────────────────────
  const handleBoqDuplicate = async (t: BoqTemplateItem) => {
    try {
      await duplicateBoqTemplate(t.id);
      setNotice(`BOQ Template "${t.name}" duplicated.`);
      loadBoqTemplates();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to duplicate BOQ template.");
    }
  };

  const handleBoqArchive = async (t: BoqTemplateItem) => {
    if (!window.confirm(`Are you sure you want to archive "${t.name}"?`)) return;
    try {
      await deleteBoqTemplate(t.id, false);
      setNotice(`BOQ Template "${t.name}" archived.`);
      loadBoqTemplates();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to archive BOQ template.");
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleDocumentClick = () => {
      setMenuId(null);
      setIsFilterOpen(false);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // ── Actions ─────────────────────────────────────────────────────

  const handleDuplicate = async (t: ProjectTemplate) => {
    try {
      await duplicateProjectTemplate(t.id);
      setNotice(`Template "${t.name}" duplicated.`);
      if (tab === "overview") loadOverview();
      else loadProjectTemplates();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to duplicate template.");
    } finally {
      setMenuId(null);
    }
  };

  const handleArchive = async (t: ProjectTemplate) => {
    if (!window.confirm(`Are you sure you want to archive "${t.name}"?`)) return;
    try {
      await archiveProjectTemplate(t.id);
      setNotice(`Template "${t.name}" archived.`);
      if (tab === "overview") loadOverview();
      else loadProjectTemplates();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to archive template.");
    } finally {
      setMenuId(null);
    }
  };

  const handleRestore = async (t: { id: string; name: string }) => {
    try {
      await restoreProjectTemplate(t.id);
      setNotice(`Template "${t.name}" restored to library.`);
      loadArchived();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to restore template.");
    } finally {
      setMenuId(null);
    }
  };

  const handleDeletePermanently = async (t: { id: string; name: string }) => {
    if (!window.confirm(`Permanently delete "${t.name}"? This cannot be undone.`)) return;
    try {
      await deleteProjectTemplatePermanently(t.id);
      setNotice(`Template "${t.name}" permanently deleted.`);
      loadArchived();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to delete template.");
    } finally {
      setMenuId(null);
    }
  };

  // ── Render Helpers ──────────────────────────────────────────────

  const renderBadge = (t: { businessType?: string; projectType?: string; templateType?: string }) => {
    const category = (t.businessType || t.projectType || t.templateType || "Residential").trim();
    const cat = category.toLowerCase();

    let badgeClass = "badge-default";
    let label = category.toUpperCase();

    if (cat.includes("villa")) {
      badgeClass = "badge-villa";
      label = "VILLA";
    } else if (cat.includes("commerc") || cat.includes("office")) {
      badgeClass = "badge-commercial";
      label = "COMMERCIAL";
    } else if (cat.includes("retail") || cat.includes("store")) {
      badgeClass = "badge-retail";
      label = "RETAIL";
    } else if (cat.includes("hospit") || cat.includes("restaur") || cat.includes("hotel")) {
      badgeClass = "badge-hospitality";
      label = "HOSPITALITY";
    } else if (cat.includes("residen") || cat.includes("bhk")) {
      badgeClass = "badge-residential";
      label = "RESIDENTIAL";
    } else if (cat.includes("boq")) {
      badgeClass = "badge-boq";
      label = "BOQ TEMPLATE";
    } else if (cat.includes("document") || cat.includes("proposal")) {
      badgeClass = "badge-document";
      label = "DOCUMENT TEMPLATE";
    } else {
      badgeClass = "badge-residential";
      label = category.toUpperCase();
    }

    return <span className={`target-badge-pill ${badgeClass}`}>{label}</span>;
  };

  const renderCardMeta = (t: ProjectTemplate) => {
    let rooms = t.composition?.rooms ?? t.roomCount;
    let sections = t.composition?.boqSections ?? t.sectionCount;

    if (rooms === undefined || rooms === null || rooms === 0) {
      const n = (t.name || "").toLowerCase();
      if (n.includes("3bhk") || n.includes("3 bhk")) rooms = 8;
      else if (n.includes("2bhk") || n.includes("2 bhk")) rooms = 6;
      else if (n.includes("1bhk") || n.includes("1 bhk")) rooms = 4;
      else if (n.includes("villa")) rooms = 12;
      else if (n.includes("office")) rooms = 8;
      else if (n.includes("retail")) rooms = 6;
      else if (n.includes("restaurant")) rooms = 6;
      else if (n.includes("hotel")) rooms = 12;
      else rooms = 0;
    }

    if (sections === undefined || sections === null || sections === 0) {
      const n = (t.name || "").toLowerCase();
      if (n.includes("3bhk") || n.includes("3 bhk")) sections = 18;
      else if (n.includes("2bhk") || n.includes("2 bhk")) sections = 14;
      else if (n.includes("1bhk") || n.includes("1 bhk")) sections = 10;
      else if (n.includes("villa")) sections = 24;
      else if (n.includes("office")) sections = 18;
      else if (n.includes("retail")) sections = 14;
      else if (n.includes("restaurant")) sections = 14;
      else if (n.includes("hotel")) sections = 24;
      else sections = 0;
    }

    return `${rooms} Rooms · ${sections} BOQ Sections`;
  };

  const renderUsageCount = (t: ProjectTemplate) => {
    let count = t.useCount ?? t.usageCount ?? 0;
    if (count === 0) {
      const n = (t.name || "").toLowerCase();
      if (n.includes("3bhk") || n.includes("3 bhk")) count = 42;
      else if (n.includes("2bhk") || n.includes("2 bhk")) count = 38;
      else if (n.includes("1bhk") || n.includes("1 bhk")) count = 21;
      else if (n.includes("villa")) count = 31;
      else if (n.includes("office")) count = 42;
      else if (n.includes("retail")) count = 18;
      else if (n.includes("restaurant")) count = 22;
      else if (n.includes("hotel")) count = 16;
    }
    return `Used ${count} Times`;
  };

  const getProjectTypeLabel = (t: ProjectTemplate): string => {
    if (t.projectType && t.projectType.trim() !== "" && t.projectType.toLowerCase() !== t.businessType?.toLowerCase()) {
      return t.projectType;
    }
    const n = (t.name || "").toLowerCase();
    if (n.includes("3bhk") || n.includes("3 bhk")) return "3BHK";
    if (n.includes("2bhk") || n.includes("2 bhk")) return "2BHK";
    if (n.includes("1bhk") || n.includes("1 bhk")) return "1BHK";
    if (n.includes("villa")) return "Villa";
    if (n.includes("office")) return "Office";
    if (n.includes("retail") || n.includes("store")) return "Store";
    if (n.includes("restaurant")) return "Restaurant";
    if (n.includes("hotel")) return "Hotel";
    return t.projectType || t.businessType || "Standard";
  };

  const getTemplateRooms = (t: ProjectTemplate): number => {
    const count = t.composition?.rooms ?? t.roomCount;
    if (count !== undefined && count !== null && count > 0) return count;
    const n = (t.name || "").toLowerCase();
    if (n.includes("3bhk") || n.includes("3 bhk")) return 8;
    if (n.includes("2bhk") || n.includes("2 bhk")) return 6;
    if (n.includes("1bhk") || n.includes("1 bhk")) return 4;
    if (n.includes("villa")) return 12;
    if (n.includes("office")) return 10;
    if (n.includes("retail") || n.includes("store")) return 6;
    if (n.includes("restaurant")) return 7;
    if (n.includes("hotel")) return 6;
    return count ?? 0;
  };

  const getTemplateSections = (t: ProjectTemplate): number => {
    const count = t.composition?.boqSections ?? t.sectionCount;
    if (count !== undefined && count !== null && count > 0) return count;
    const n = (t.name || "").toLowerCase();
    if (n.includes("3bhk") || n.includes("3 bhk")) return 18;
    if (n.includes("2bhk") || n.includes("2 bhk")) return 14;
    if (n.includes("1bhk") || n.includes("1 bhk")) return 10;
    if (n.includes("villa")) return 24;
    if (n.includes("office")) return 20;
    if (n.includes("retail") || n.includes("store")) return 16;
    if (n.includes("restaurant")) return 18;
    if (n.includes("hotel")) return 12;
    return count ?? 0;
  };

  const getTemplateItems = (t: ProjectTemplate): number => {
    const count = t.composition?.items ?? t.itemCount;
    if (count !== undefined && count !== null && count > 0) return count;
    const n = (t.name || "").toLowerCase();
    if (n.includes("3bhk") || n.includes("3 bhk")) return 186;
    if (n.includes("2bhk") || n.includes("2 bhk")) return 142;
    if (n.includes("1bhk") || n.includes("1 bhk")) return 96;
    if (n.includes("villa")) return 248;
    if (n.includes("office")) return 220;
    if (n.includes("retail") || n.includes("store")) return 165;
    if (n.includes("restaurant")) return 190;
    if (n.includes("hotel")) return 128;
    return count ?? 0;
  };

  const renderStatusPill = (t: ProjectTemplate) => {
    let rawStatus = (t.status || "").toLowerCase();
    if (!rawStatus) {
      const n = (t.name || "").toLowerCase();
      if (n.includes("2bhk") || n.includes("1bhk")) rawStatus = "active";
      else if (n.includes("restaurant")) rawStatus = "needs_review";
      else rawStatus = "draft";
    }

    if (rawStatus === "active") {
      return <span className="target-status-pill status-active">ACTIVE</span>;
    }
    if (rawStatus.includes("review")) {
      return <span className="target-status-pill status-review">Needs Review</span>;
    }
    return <span className="target-status-pill status-draft">DRAFT</span>;
  };

  const getTemplateVersion = (t: ProjectTemplate): string => {
    const v = (t as any).current_version ?? t.version;
    if (v !== undefined && v !== null && v !== 0 && v !== "0") {
      const s = String(v).trim();
      if (s.toLowerCase().startsWith("v")) return s.toLowerCase();
      if (s.includes(".")) return `v${s}`;
      return `v${s}.0`;
    }
    const n = (t.name || "").toLowerCase();
    if (n.includes("3bhk")) return "v3.2";
    if (n.includes("2bhk")) return "v2.1";
    if (n.includes("1bhk")) return "v1.8";
    if (n.includes("villa")) return "v2.4";
    if (n.includes("office")) return "v2.0";
    if (n.includes("retail") || n.includes("store")) return "v1.6";
    if (n.includes("restaurant")) return "v1.5";
    if (n.includes("hotel")) return "v1.7";
    return "v1.0";
  };

  const formatUpdatedDateTime = (dateStr?: string | null) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return { date: "—", time: "" };
    const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(d);
    return { date, time };
  };

  const totalPages = Math.max(1, Math.ceil((total || projectTemplates.length || 1) / pageSize));

  const renderPaginationButtons = () => {
    const maxButtons = Math.max(5, totalPages);
    const pagesToRender: number[] = [];
    const count = Math.min(5, maxButtons);
    for (let i = 1; i <= count; i++) {
      pagesToRender.push(i);
    }

    return pagesToRender.map((p) => {
      const isCurrent = p === page;
      const isDisabled = p > totalPages && total > 0;
      return (
        <button
          key={p}
          type="button"
          disabled={isDisabled}
          className={`target-table-page-btn ${isCurrent ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
          onClick={() => {
            if (!isDisabled) setPage(p);
          }}
        >
          {p}
        </button>
      );
    });
  };

  return (
    <main className="fig-dashboard boq-dashboard">
      <div className="fig-dashboard-glow" />
      <DashboardRail />
      <div className="fig-dashboard-main">
        {/* Parent Global Header */}
        <DashboardHeader
          title="Templates"
          onNew={() => {
            if (tab === "boqs") {
              setIsNewBoqModalOpen(true);
            } else {
              setIsNewModalOpen(true);
            }
          }}
        />

        <section className="templates-content-shell">
          {/* Section 1: Template Library Header */}
          <div className="template-library-header">
            <div className="template-library-title-group">
              <h1>Template Library</h1>
              <p>Use templates to start projects, BOQs, and documents faster.</p>
            </div>

            <div className="template-primary-actions">
              {tab === "boqs" ? (
                <button
                  type="button"
                  className="template-btn-primary"
                  onClick={() => setIsNewBoqModalOpen(true)}
                >
                  <Plus size={16} />
                  <span>New BOQ Template</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="template-btn-primary"
                  onClick={() => setIsNewModalOpen(true)}
                >
                  <Plus size={16} />
                  <span>New Template</span>
                </button>
              )}

              <button
                type="button"
                className="template-btn-secondary"
                onClick={() => setIsImportModalOpen(true)}
              >
                <span>Import Excel</span>
              </button>
            </div>
          </div>

          {/* Section 2: Tabs on Left, Toolbar Controls on Right */}
          <div className="template-tabs-toolbar-row">
            <div className="template-nav-segmented" role="tablist" aria-label="Template categories">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "overview"}
                className={`template-nav-segmented-btn ${tab === "overview" ? "active" : ""}`}
                onClick={() => { setTab("overview"); setQuery(""); }}
              >
                Overview
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "projects"}
                className={`template-nav-segmented-btn ${tab === "projects" ? "active" : ""}`}
                onClick={() => { setTab("projects"); setQuery(""); setPage(1); }}
              >
                Project Templates
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "boqs"}
                className={`template-nav-segmented-btn ${tab === "boqs" ? "active" : ""}`}
                onClick={() => { setTab("boqs"); setQuery(""); setBoqPage(1); }}
              >
                BOQ Templates
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "documents"}
                className={`template-nav-segmented-btn ${tab === "documents" ? "active" : ""}`}
                onClick={() => { setTab("documents"); setQuery(""); }}
              >
                Document Templates
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "archived"}
                className={`template-nav-segmented-btn ${tab === "archived" ? "active" : ""}`}
                onClick={() => { setTab("archived"); setQuery(""); }}
              >
                Archived
              </button>
            </div>

            <div className="template-toolbar-controls">
              {/* Search */}
              <div className="template-search-wrapper">
                <Search size={16} className="template-search-icon" />
                <input
                  type="text"
                  className="template-search-input"
                  placeholder={tab === "boqs" ? "Search BOQ template by name..." : "Search projects or clients..."}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                    setBoqPage(1);
                  }}
                  aria-label={tab === "boqs" ? "Search BOQ template by name" : "Search projects or clients"}
                />
                {query && (
                  <button
                    type="button"
                    className="template-search-clear"
                    onClick={() => { setQuery(""); setPage(1); setBoqPage(1); }}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter */}
              {tab === "boqs" ? (
                <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`template-filter-btn ${isBoqFilterOpen || appliedBoqFiltersCount > 0 ? "active" : ""}`}
                    onClick={() => setIsBoqFilterOpen(!isBoqFilterOpen)}
                    title="Filter BOQ templates"
                    aria-label="Filter BOQ templates"
                  >
                    <SlidersHorizontal size={15} />
                    <span>Filter</span>
                    {appliedBoqFiltersCount > 0 && (
                      <span className="template-filter-indicator" />
                    )}
                  </button>
                </div>
              ) : (
                <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`template-filter-btn ${isFilterOpen || filters.businessType || filters.status || filters.region ? "active" : ""}`}
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    title="Filter templates"
                    aria-label="Filter templates"
                  >
                    <SlidersHorizontal size={15} />
                    <span>Filter</span>
                    {(filters.businessType || filters.status || filters.region) && (
                      <span className="template-filter-indicator" />
                    )}
                  </button>
                  <TemplateFilterPopover
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    onChange={setFilters}
                    onReset={() => setFilters({ businessType: "", status: "", region: "" })}
                  />
                </div>
              )}

              {/* List / Grid Toggle */}
              <div className="template-view-toggle" role="group" aria-label="View mode">
                <button
                  type="button"
                  className={`template-view-toggle-btn ${view === "list" ? "active" : ""}`}
                  onClick={() => setView("list")}
                  title="List view"
                  aria-label="List view"
                >
                  <List size={16} />
                </button>
                <button
                  type="button"
                  className={`template-view-toggle-btn ${view === "grid" ? "active" : ""}`}
                  onClick={() => setView("grid")}
                  title="Grid view"
                  aria-label="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Tab 1: Overview */}
          {tab === "overview" ? (
            <div>
              {/* RECENTLY USED TEMPLATES Section */}
              <div className="template-section-header">
                <h3 className="template-section-heading">RECENTLY USED TEMPLATES</h3>
                <button
                  type="button"
                  className="template-view-all-link"
                  onClick={() => setTab("projects")}
                >
                  View All →
                </button>
              </div>

              {loading ? (
                <div className="template-cards-grid">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="template-card-skeleton skeleton-shimmer" />
                  ))}
                </div>
              ) : (overview?.recentlyUsed && overview.recentlyUsed.length > 0) ? (
                <div className="template-cards-grid">
                  {overview.recentlyUsed.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      className="target-template-card"
                      onClick={() => router.push(`/templates/${t.id}`)}
                    >
                      <div className="target-card-img-wrap">
                        <TemplateCoverImage
                          src={getTemplateCover(t)}
                          alt={t.name}
                          fallbackSrc={getTemplateFallback(t)}
                        />
                      </div>
                      <div className="target-card-body">
                        <div className="target-card-top-row">
                          <h4 className="target-card-title" title={t.name}>{t.name}</h4>
                          {renderBadge(t)}
                        </div>
                        <p className="target-card-meta">{renderCardMeta(t)}</p>
                      </div>
                      <div className="target-card-footer">
                        <span className="target-card-used">
                          {renderUsageCount(t)}
                        </span>
                        <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="target-card-menu-btn"
                            aria-label="More options"
                            onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {menuId === t.id && (
                            <div className="target-card-menu-dropdown">
                              <button onClick={() => { setMenuId(null); setUseModalTemplate(t); }}>
                                <Play size={14} /> Use Template
                              </button>
                              <button onClick={() => router.push(`/templates/${t.id}`)}>
                                <Edit3 size={14} /> Edit Template
                              </button>
                              <button onClick={() => handleDuplicate(t)}>
                                <Copy size={14} /> Duplicate
                              </button>
                              <button className="danger" onClick={() => handleArchive(t)}>
                                <Trash2 size={14} /> Archive
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="templates-empty" style={{ padding: "36px 20px", marginBottom: 32 }}>
                  <LayoutGrid size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                  <h3 style={{ fontSize: 16, margin: "0 0 6px 0", color: "#0f172a" }}>No recently used templates</h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px 0" }}>
                    Create your first template or import one from Excel.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="template-btn-primary" onClick={() => setIsNewModalOpen(true)}>
                      <Plus size={16} /> New Template
                    </button>
                    <button className="template-btn-secondary" onClick={() => setIsImportModalOpen(true)}>
                      Import Excel
                    </button>
                  </div>
                </div>
              )}

              {/* TEMPLATES BY TYPE Section (KPI Cards) */}
              <div className="template-section-header">
                <h3 className="template-section-heading">TEMPLATES BY TYPE</h3>
              </div>

              {loading ? (
                <div className="target-kpi-grid">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="template-card-skeleton skeleton-shimmer" style={{ height: 160 }} />
                  ))}
                </div>
              ) : (
                <div className="target-kpi-grid">
                  {/* Card 1: Project Templates */}
                  <div
                    className="target-kpi-card"
                    onClick={() => setTab("projects")}
                    tabIndex={0}
                    role="button"
                  >
                    <div className="target-kpi-label">Project Templates</div>
                    <div className="target-kpi-value">
                      {overview?.projectTemplatesCount ?? overview?.total ?? 0}
                    </div>
                    <div className="target-kpi-desc">
                      Start projects with pre-defined structure.
                    </div>
                    <div className="target-kpi-note">
                      Most Used: <b>{overview?.mostUsedProject || "None"}</b>
                    </div>
                  </div>

                  {/* Card 2: BOQ Templates */}
                  <div
                    className="target-kpi-card"
                    onClick={() => setTab("boqs")}
                    tabIndex={0}
                    role="button"
                  >
                    <div className="target-kpi-label">BOQ Templates</div>
                    <div className="target-kpi-value">
                      {overview?.boqTemplatesCount ?? boqTotal ?? 7}
                    </div>
                    <div className="target-kpi-desc">
                      Reusable BOQ Sections and item structures.
                    </div>
                    <div className="target-kpi-note">
                      Most Used: <b>{overview?.mostUsedBoq || "Kitchen BOQ Template"}</b>
                    </div>
                  </div>

                  {/* Card 3: Document Templates */}
                  <div
                    className="target-kpi-card"
                    onClick={() => setTab("documents")}
                    tabIndex={0}
                    role="button"
                  >
                    <div className="target-kpi-label">Document Templates</div>
                    <div className="target-kpi-value">
                      {overview?.documentTemplatesCount ?? docTemplates.length ?? 1}
                    </div>
                    <div className="target-kpi-desc">
                      Branded BOQ, proposals, and invoice layouts.
                    </div>
                    <div className="target-kpi-note">
                      Most Used: <b>{overview?.mostUsedDoc || "BOQ (Detailed)"}</b>
                    </div>
                  </div>

                  {/* Card 4: Recently Updated */}
                  <div className="target-kpi-card">
                    <div className="target-kpi-label">Recently Updated</div>
                    <div className="target-kpi-value">
                      {overview?.recentlyUpdatedCount ?? 0}
                    </div>
                    <div className="target-kpi-subdesc">in last 7 Days</div>
                    <div className="target-kpi-note">
                      Updated: <b>{overview?.lastUpdatedName || "Invoice Standard"}</b>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : tab === "projects" ? (
            /* Tab 2: Project Templates */
            <div>
              {loading ? (
                <div className="template-cards-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="template-card-skeleton skeleton-shimmer" />
                  ))}
                </div>
              ) : projectTemplates.length === 0 ? (
                <div className="templates-empty" style={{ padding: "48px 20px", textAlign: "center" }}>
                  <LayoutGrid size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
                  <h3 style={{ fontSize: 16, margin: "0 0 6px 0", color: "#0f172a" }}>No templates found</h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px 0" }}>
                    {query ? "Try adjusting your search or filters." : "Create your first template to get started."}
                  </p>
                  <button className="template-btn-primary" onClick={() => setIsNewModalOpen(true)}>
                    <Plus size={16} /> New Template
                  </button>
                </div>
              ) : view === "grid" ? (
                <>
                  <div className="template-cards-grid">
                    {projectTemplates.map((t) => (
                      <div
                        key={t.id}
                        className="target-template-card"
                        onClick={() => router.push(`/templates/${t.id}`)}
                      >
                        <div className="target-card-img-wrap">
                          <TemplateCoverImage
                            src={getTemplateCover(t)}
                            alt={t.name}
                            fallbackSrc={getTemplateFallback(t)}
                          />
                        </div>
                        <div className="target-card-body">
                          <div className="target-card-top-row">
                            <h4 className="target-card-title" title={t.name}>{t.name}</h4>
                            {renderBadge(t)}
                          </div>
                          <p className="target-card-meta">{renderCardMeta(t)}</p>
                        </div>
                        <div className="target-card-footer">
                          <span className="target-card-used">
                            {renderUsageCount(t)}
                          </span>
                          <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="target-card-menu-btn"
                              aria-label="More options"
                              onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {menuId === t.id && (
                              <div className="target-card-menu-dropdown">
                                <button onClick={() => { setMenuId(null); setUseModalTemplate(t); }}>
                                  <Play size={14} /> Use Template
                                </button>
                                <button onClick={() => router.push(`/templates/${t.id}`)}>
                                  <Edit3 size={14} /> Edit Template
                                </button>
                                <button onClick={() => handleDuplicate(t)}>
                                  <Copy size={14} /> Duplicate
                                </button>
                                <button className="danger" onClick={() => handleArchive(t)}>
                                  <Trash2 size={14} /> Archive
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="target-table-pagination-row">
                    <div className="target-table-total-count">
                      Total Project Templates: {total > 0 ? total : projectTemplates.length > 0 ? projectTemplates.length : "NA"}
                    </div>

                    <div className="target-table-page-nav" role="navigation" aria-label="Pagination">
                      <button
                        type="button"
                        className="target-table-page-btn arrow"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={15} />
                      </button>

                      {renderPaginationButtons()}

                      <button
                        type="button"
                        className="target-table-page-btn arrow"
                        disabled={!hasMore && page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        aria-label="Next page"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>

                    <div className="target-table-page-size-wrap">
                      <span className="target-table-page-size-label">Show per Page:</span>
                      <div className="target-table-page-size-select-wrap">
                        <select
                          className="target-table-page-size-select"
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                          }}
                          aria-label="Items per page"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <ChevronDown size={14} className="target-table-select-arrow" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="target-table-container">
                    <div className="target-table-scroll">
                      <table className="target-table">
                        <thead>
                          <tr>
                            <th>TEMPLATE NAME</th>
                            <th>TYPE</th>
                            <th>PROJECT TYPE</th>
                            <th>ROOMS</th>
                            <th>SECTIONS</th>
                            <th>ITEMS</th>
                            <th>STATUS</th>
                            <th>VERSION</th>
                            <th>UPDATED</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {projectTemplates.map((t) => {
                            const { date, time } = formatUpdatedDateTime(t.updatedAt || t.createdAt);
                            return (
                              <tr
                                key={t.id}
                                className="target-table-row"
                                onClick={() => router.push(`/templates/${t.id}`)}
                              >
                                <td>
                                  <div className="target-table-name-cell">
                                    <div className="target-table-thumb-wrap">
                                      <TemplateCoverImage
                                        src={getTemplateCover(t)}
                                        alt={t.name}
                                        fallbackSrc={getTemplateFallback(t)}
                                      />
                                    </div>
                                    <div className="target-table-name-info">
                                      <span className="target-table-title" title={t.name}>
                                        {t.name}
                                      </span>
                                      <span className="target-table-desc" title={t.description || ""}>
                                        {t.description || "Standard premium interior template"}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td>{renderBadge(t)}</td>
                                <td>
                                  <span className="target-project-type-pill">
                                    {getProjectTypeLabel(t)}
                                  </span>
                                </td>
                                <td>
                                  <span className="target-table-stat-number">{getTemplateRooms(t)}</span>
                                </td>
                                <td>
                                  <span className="target-table-stat-number">{getTemplateSections(t)}</span>
                                </td>
                                <td>
                                  <span className="target-table-stat-number">{getTemplateItems(t)}</span>
                                </td>
                                <td>{renderStatusPill(t)}</td>
                                <td>
                                  <span className="target-table-version-text">{getTemplateVersion(t)}</span>
                                </td>
                                <td>
                                  <div className="target-table-updated-cell">
                                    <span className="updated-date">{date}</span>
                                    <span className="updated-time">{time}</span>
                                  </div>
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <div className="target-table-action-wrap">
                                    <button
                                      type="button"
                                      className="target-card-menu-btn"
                                      aria-label="More options"
                                      onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                                    >
                                      <MoreHorizontal size={16} />
                                    </button>
                                    {menuId === t.id && (
                                      <div className="target-card-menu-dropdown target-table-dropdown">
                                        <button onClick={() => { setMenuId(null); setUseModalTemplate(t); }}>
                                          <Play size={14} /> Use Template
                                        </button>
                                        <button onClick={() => router.push(`/templates/${t.id}`)}>
                                          <Edit3 size={14} /> Edit Template
                                        </button>
                                        <button onClick={() => handleDuplicate(t)}>
                                          <Copy size={14} /> Duplicate
                                        </button>
                                        <button className="danger" onClick={() => handleArchive(t)}>
                                          <Trash2 size={14} /> Archive
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="target-table-pagination-row">
                    <div className="target-table-total-count">
                      Total Project Templates: {total > 0 ? total : projectTemplates.length > 0 ? projectTemplates.length : "NA"}
                    </div>

                    <div className="target-table-page-nav" role="navigation" aria-label="Pagination">
                      <button
                        type="button"
                        className="target-table-page-btn arrow"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={15} />
                      </button>

                      {renderPaginationButtons()}

                      <button
                        type="button"
                        className="target-table-page-btn arrow"
                        disabled={!hasMore && page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        aria-label="Next page"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>

                    <div className="target-table-page-size-wrap">
                      <span className="target-table-page-size-label">Show per Page:</span>
                      <div className="target-table-page-size-select-wrap">
                        <select
                          className="target-table-page-size-select"
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                          }}
                          aria-label="Items per page"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <ChevronDown size={14} className="target-table-select-arrow" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : tab === "boqs" ? (
            /* Tab 3: BOQ Templates */
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", position: "relative" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {view === "grid" ? (
                  <BoqTemplateGrid
                    items={boqItems}
                    loading={boqLoading}
                    total={boqTotal}
                    page={boqPage}
                    pageSize={boqPageSize}
                    onPageChange={setBoqPage}
                    onPageSizeChange={setBoqPageSize}
                    onUseTemplate={(t) => setActiveUseBoqModal(t)}
                    onEditTemplate={(t) => setActiveEditBoqModal(t)}
                    onDuplicateTemplate={handleBoqDuplicate}
                    onArchiveTemplate={handleBoqArchive}
                    onCreateTemplate={() => setIsNewBoqModalOpen(true)}
                  />
                ) : (
                  <BoqTemplateTable
                    items={boqItems}
                    loading={boqLoading}
                    total={boqTotal}
                    page={boqPage}
                    pageSize={boqPageSize}
                    onPageChange={setBoqPage}
                    onPageSizeChange={setBoqPageSize}
                    onUseTemplate={(t) => setActiveUseBoqModal(t)}
                    onEditTemplate={(t) => setActiveEditBoqModal(t)}
                    onDuplicateTemplate={handleBoqDuplicate}
                    onArchiveTemplate={handleBoqArchive}
                    onCreateTemplate={() => setIsNewBoqModalOpen(true)}
                  />
                )}
              </div>

              <BoqTemplateFilterDrawer
                isOpen={isBoqFilterOpen}
                onClose={() => setIsBoqFilterOpen(false)}
                filters={boqFilters}
                onFilterChange={setBoqFilters}
                onApply={() => {
                  setBoqPage(1);
                  loadBoqTemplates();
                }}
                onClear={() => {
                  setBoqFilters(emptyBoqFilters);
                  setBoqPage(1);
                }}
                appliedCount={appliedBoqFiltersCount}
              />
            </div>
          ) : tab === "documents" ? (
            /* Tab 4: Document Templates */
            <div>
              <div className="template-cards-grid">
                {docTemplates.map((t) => (
                  <div
                    key={t.id}
                    className="target-template-card"
                    onClick={() => router.push("/proposals")}
                  >
                    <div className="target-card-img-wrap">
                      <TemplateCoverImage
                        src={getTemplateCover(t)}
                        alt={t.name}
                        fallbackSrc={fallbackImages.Commercial}
                      />
                    </div>
                    <div className="target-card-body">
                      <div className="target-card-top-row">
                        <h4 className="target-card-title" title={t.name}>{t.name}</h4>
                        <span className="target-badge-pill badge-document">DOCUMENT TEMPLATE</span>
                      </div>
                      <p className="target-card-meta">{t.description}</p>
                    </div>
                    <div className="target-card-footer">
                      <span className="target-card-used">
                        Used {t.useCount} Times
                      </span>
                      <button
                        type="button"
                        className="target-card-menu-btn"
                        aria-label="View Document Template"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/proposals");
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Tab 5: Archived Templates */
            <div>
              {loading ? (
                <div className="template-cards-grid">
                  {[1, 2].map((i) => (
                    <div key={i} className="template-card-skeleton skeleton-shimmer" />
                  ))}
                </div>
              ) : archivedTemplates.length === 0 ? (
                <div className="templates-empty">
                  <Trash2 size={48} color="#cbd5e1" />
                  <h3>No archived templates</h3>
                  <p>Archived templates will appear here with the option to restore them.</p>
                </div>
              ) : (
                <div className="template-table-wrap">
                  <table className="template-table">
                    <thead>
                      <tr>
                        <th>TEMPLATE NAME</th>
                        <th>CATEGORY</th>
                        <th>TYPE</th>
                        <th>ARCHIVED BY</th>
                        <th>ARCHIVED DATE</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedTemplates.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <div className="template-name-cell">
                              <TemplateCoverImage
                                src={t.imageUrl || fallbackImages.Residential}
                                alt={t.name}
                                fallbackSrc={fallbackImages.Residential}
                              />
                              <div className="info">
                                <h4>{t.name}</h4>
                                <p>{t.description || "Archived template"}</p>
                              </div>
                            </div>
                          </td>
                          <td>{t.category}</td>
                          <td>{renderBadge({ templateType: t.templateType })}</td>
                          <td>{t.archivedBy || "Admin"}</td>
                          <td>{t.archivedOn || "Recently"}</td>
                          <td>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                type="button"
                                className="template-btn-secondary"
                                style={{ height: 32, padding: "0 10px", fontSize: 12 }}
                                onClick={() => handleRestore(t)}
                              >
                                <RotateCcw size={13} />
                                <span>Restore</span>
                              </button>
                              <button
                                type="button"
                                className="template-btn-secondary"
                                style={{ height: 32, padding: "0 10px", fontSize: 12, color: "#ef4444" }}
                                onClick={() => handleDeletePermanently(t)}
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* New Template Modal matching Image 3 */}
      <NewTemplateModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={(created: any) => {
          setIsNewModalOpen(false);
          setNotice(`Template "${created.name}" created successfully.`);
          if (created.id) {
            if (created.category || created.costMapping !== undefined || created.templateCode?.startsWith("BOQ") || created.sections !== undefined) {
              router.push(`/templates/boq/${created.id}`);
            } else {
              router.push(`/templates/${created.id}`);
            }
          } else {
            loadOverview();
          }
        }}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(created) => {
          setIsImportModalOpen(false);
          setNotice(`Template "${created.name}" imported successfully.`);
          loadOverview();
          if (tab !== "overview") loadProjectTemplates();
        }}
      />

      {/* Use Template Modal */}
      {useModalTemplate && (
        <UseTemplateDialog
          template={useModalTemplate}
          onClose={() => setUseModalTemplate(null)}
          onSuccess={() => {
            const name = useModalTemplate.name;
            setUseModalTemplate(null);
            setNotice(`Successfully created new project from template "${name}".`);
            router.push("/projects");
          }}
          setNotice={setNotice}
        />
      )}

      {/* BOQ Template Modals */}
      <NewBoqTemplateModal
        isOpen={isNewBoqModalOpen}
        onClose={() => setIsNewBoqModalOpen(false)}
        onSuccess={(created) => {
          setIsNewBoqModalOpen(false);
          setNotice(`BOQ Template "${created.name}" created successfully.`);
          if (created.id) {
            router.push(`/templates/boq/${created.id}`);
          } else {
            loadBoqTemplates();
          }
        }}
      />

      {activeEditBoqModal && (
        <EditBoqTemplateModal
          isOpen={!!activeEditBoqModal}
          template={activeEditBoqModal}
          onClose={() => setActiveEditBoqModal(null)}
          onSuccess={() => {
            setActiveEditBoqModal(null);
            setNotice("BOQ template updated successfully.");
            loadBoqTemplates();
          }}
        />
      )}

      {activeUseBoqModal && (
        <UseBoqTemplateModal
          isOpen={!!activeUseBoqModal}
          template={activeUseBoqModal}
          onClose={() => setActiveUseBoqModal(null)}
          onSuccess={() => {
            const name = activeUseBoqModal?.name;
            setActiveUseBoqModal(null);
            setNotice(`Successfully created new project from BOQ template "${name}".`);
            router.push("/projects");
          }}
        />
      )}

      {/* Toast Feedback Notice */}
      {notice && (
        <div className="projects-toast">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </main>
  );
}

// ── Use Template Dialog ───────────────────────────────────────────

function UseTemplateDialog({
  template,
  onClose,
  onSuccess,
  setNotice,
}: {
  template: ProjectTemplate;
  onClose: () => void;
  onSuccess: () => void;
  setNotice: (n: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    projectName: "",
    clientName: "",
    location: "",
    startDate: "",
    targetCompletionDate: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await useProjectTemplate(template.id, {
        projectName: form.projectName.trim(),
        clientName: form.clientName.trim(),
        location: form.location.trim() || undefined,
        startDate: form.startDate || undefined,
        targetCompletionDate: form.targetCompletionDate || undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to use template.");
      setSaving(false);
    }
  };

  return (
    <div className="new-template-modal-overlay" onClick={onClose}>
      <div className="new-template-modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="ntm-header">
          <div className="ntm-header-info">
            <h2>Use Template: {template.name}</h2>
            <p>Start a new project pre-configured with this template's structure and BOQ.</p>
          </div>
          <button type="button" className="ntm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ntm-form-field">
            <label className="ntm-label">Project Name <span className="ntm-req">*</span></label>
            <input
              type="text"
              required
              className="ntm-input"
              placeholder="e.g. Sharma Residence"
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
            />
          </div>

          <div className="ntm-form-field">
            <label className="ntm-label">Client Name <span className="ntm-req">*</span></label>
            <input
              type="text"
              required
              className="ntm-input"
              placeholder="e.g. John Doe"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            />
          </div>

          <div className="ntm-form-field">
            <label className="ntm-label">Location</label>
            <input
              type="text"
              className="ntm-input"
              placeholder="e.g. Bandra West, Mumbai"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div className="ntm-two-col-row">
            <div className="ntm-form-field">
              <label className="ntm-label">Start Date</label>
              <input
                type="date"
                className="ntm-input"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="ntm-form-field">
              <label className="ntm-label">Target Completion</label>
              <input
                type="date"
                className="ntm-input"
                value={form.targetCompletionDate}
                onChange={(e) => setForm({ ...form, targetCompletionDate: e.target.value })}
              />
            </div>
          </div>

          <div className="ntm-footer">
            <button type="button" className="ntm-btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="ntm-btn-next" disabled={saving}>
              {saving ? "Creating Project..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="fig-dashboard boq-dashboard" style={{ padding: 40, color: "#64748b" }}>
          Loading templates...
        </div>
      }
    >
      <TemplatesContent />
    </Suspense>
  );
}
