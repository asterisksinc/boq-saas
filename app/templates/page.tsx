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
  restoreBoqTemplate,
} from "@/lib/api/boqs";
import {
  getTemplatesOverview,
  listProjectTemplates,
  duplicateProjectTemplate,
  archiveProjectTemplate,
  restoreProjectTemplate,
  deleteProjectTemplatePermanently,
  useProjectTemplate,
  listArchivedTemplates,
  type ArchivedTemplateRecord,
} from "@/lib/api/templates";
import ArchivedTemplatesView from "@/components/templates/archived/ArchivedTemplatesView";
import ArchivedFilterPopover, {
  type ArchivedFilterState,
} from "@/components/templates/archived/ArchivedFilterPopover";

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

type RecentCardItem = {
  id: string;
  name: string;
  itemType: "PROJECT" | "BOQ" | "DOC";
  badgeLabel: string;
  badgeClass: "badge-project" | "badge-boq" | "badge-doc";
  subtitle: string;
  useCount: number;
  imageUrl?: string | null;
  raw: any;
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

function getTemplateFallback(t: { businessType?: string; projectType?: string; name?: string; category?: string }): string {
  const name = (t.name || "").toLowerCase();
  const bt = (t.businessType || t.projectType || t.category || "").toLowerCase();

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

  return fallbackImages[t.businessType || t.category || ""] || fallbackImages.Default;
}

function getTemplateCover(t: { imageUrl?: string | null; businessType?: string; projectType?: string; name?: string; category?: string }): string {
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
      className="template-fig-card-img"
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
  const tabParam = searchParams?.get("tab");
  const newParam = searchParams?.get("new");
  const viewParam = searchParams?.get("view");
  const filterParam = searchParams?.get("filter");
  const initialTab = (tabParam && ["overview", "projects", "boqs", "documents", "archived"].includes(tabParam))
    ? (tabParam as "overview" | "projects" | "boqs" | "documents" | "archived")
    : "overview";

  // Navigation tab: Overview | Project Templates | BOQ Templates | Document Templates | Archived
  const [tab, setTab] = useState<"overview" | "projects" | "boqs" | "documents" | "archived">(initialTab);
  const [view, setView] = useState<"grid" | "list">(viewParam === "list" ? "list" : "grid");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals & Popovers
  const [isNewModalOpen, setIsNewModalOpen] = useState(newParam === "true");
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
    visibility: "",
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
  const [isBoqFilterOpen, setIsBoqFilterOpen] = useState(
    filterParam === "true" || filterParam === "open" || filterParam === "1"
  );
  const [boqFilters, setBoqFilters] = useState<BoqFilterState>(emptyBoqFilters);
  const [isNewBoqModalOpen, setIsNewBoqModalOpen] = useState(false);
  const [activeEditBoqModal, setActiveEditBoqModal] = useState<BoqTemplateItem | null>(null);
  const [activeUseBoqModal, setActiveUseBoqModal] = useState<BoqTemplateItem | null>(null);

  // Document Templates State
  const [docTemplates, setDocTemplates] = useState<DocumentTemplate[]>([]);

  // Archived Templates State
  const [archivedTemplates, setArchivedTemplates] = useState<ArchivedTemplateRecord[]>([]);
  const [archivedQuery, setArchivedQuery] = useState("");
  const [archivedFilters, setArchivedFilters] = useState<ArchivedFilterState>({
    category: "all",
    type: "all",
    sort: "newest",
  });
  const [archivedPage, setArchivedPage] = useState(1);
  const [archivedPageSize, setArchivedPageSize] = useState(10);
  const [archivedTotal, setArchivedTotal] = useState(0);
  const [archivedTotalPages, setArchivedTotalPages] = useState(1);
  const [archivedCategories, setArchivedCategories] = useState<string[]>([]);
  const [archivedView, setArchivedView] = useState<"list" | "grid">(viewParam === "grid" ? "grid" : "list");
  const [isArchivedFilterOpen, setIsArchivedFilterOpen] = useState(false);

  const activeArchivedFiltersCount = useMemo(() => {
    let count = 0;
    if (archivedFilters.category && archivedFilters.category !== "all") count += 1;
    if (archivedFilters.type && archivedFilters.type !== "all") count += 1;
    if (archivedFilters.sort && archivedFilters.sort !== "newest") count += 1;
    return count;
  }, [archivedFilters]);

  useEffect(() => {
    if (tabParam && ["overview", "projects", "boqs", "documents", "archived"].includes(tabParam)) {
      setTab(tabParam as any);
    }
  }, [tabParam]);

  const appliedFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.businessType) count += 1;
    if (filters.status) count += 1;
    if (filters.region) count += 1;
    if (filters.visibility) count += 1;
    return count;
  }, [filters]);

  const appliedBoqFiltersCount = useMemo(() => {
    let count = 0;
    count += boqFilters.status.length;
    count += boqFilters.projectType.length;
    if (boqFilters.category && boqFilters.category !== "all") count += 1;
    count += boqFilters.mapping.length;
    if (boqFilters.usedIn && boqFilters.usedIn !== "all") count += 1;
    return count;
  }, [boqFilters]);

  // ── Unified Recently Used for Overview Tab ──────────────────────────
  const displayRecentlyUsed = useMemo(() => {
    const projectCards: RecentCardItem[] = (overview?.recentlyUsed || []).map((t) => {
      const rooms = t.composition?.rooms ?? t.roomCount ?? 0;
      const sections = t.composition?.boqSections ?? t.sectionCount ?? 0;
      return {
        id: t.id,
        name: t.name,
        itemType: "PROJECT",
        badgeLabel: "PROJECT TEMPLATE",
        badgeClass: "badge-project",
        subtitle: `${rooms} Rooms • ${sections} BOQ Sections`,
        useCount: t.useCount ?? t.usageCount ?? 0,
        imageUrl: getTemplateCover(t),
        raw: t,
      };
    });

    const boqCards: RecentCardItem[] = boqItems.map((b) => ({
      id: b.id,
      name: b.name,
      itemType: "BOQ",
      badgeLabel: "BOQ TEMPLATE",
      badgeClass: "badge-boq",
      subtitle: `${b.sections ?? 0} Sections • ${b.items ?? 0} Items`,
      useCount: b.useCount ?? 0,
      imageUrl: b.imageUrl || getTemplateCover({ name: b.name, businessType: b.category }),
      raw: b,
    }));

    // Interleave cards to display both Project and BOQ templates seamlessly
    let combined: RecentCardItem[] = [];
    if (projectCards.length > 0 && boqCards.length > 0) {
      const maxLen = Math.max(projectCards.length, boqCards.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < projectCards.length) combined.push(projectCards[i]);
        if (i < boqCards.length) combined.push(boqCards[i]);
      }
    } else {
      combined = [...projectCards, ...boqCards];
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      combined = combined.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q)
      );
    }

    return combined;
  }, [overview?.recentlyUsed, boqItems, query]);

  // ── Loaders ─────────────────────────────────────────────────────

  const loadOverview = async () => {
    try {
      const data = await getTemplatesOverview();
      setOverview(data);
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to load template overview.");
    }
  };

  const loadProjectTemplates = async () => {
    try {
      const res = await listProjectTemplates({
        search: query || undefined,
        status: filters.status || undefined,
        type: filters.businessType || undefined,
        region: filters.region || undefined,
        visibility: filters.visibility || undefined,
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
      const b = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(b?.error?.message || b?.message || "Failed to load document templates.");
      }
      const items = (b.data?.items || []).map((item: any) => ({
        id: item.id,
        name: item.name || item.projectName || "Unnamed document template",
        description: item.description || "",
        category: item.category || "Proposal",
        type: item.type || "DOCUMENT TEMPLATE",
        useCount: item.viewCount ?? item.useCount ?? 0,
        updatedAt: item.updatedAt || item.createdAt || "",
        imageUrl: item.imageUrl || null,
      }));
      setDocTemplates(items);
    } catch (err: unknown) {
      setDocTemplates([]);
      setNotice(err instanceof Error ? err.message : "Failed to load document templates.");
    }
  };

  const loadArchived = async () => {
    try {
      const b = await listArchivedTemplates({
        search: archivedQuery || undefined,
        category: archivedFilters.category !== "all" ? archivedFilters.category : undefined,
        type: archivedFilters.type !== "all" ? archivedFilters.type : undefined,
        sort: archivedFilters.sort || "newest",
        page: archivedPage,
        pageSize: archivedPageSize,
      });
      setArchivedTemplates(b.items || []);
      setArchivedTotal(b.total || 0);
      setArchivedTotalPages(b.totalPages || 1);
      if (b.categories?.length) {
        setArchivedCategories(b.categories);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load archived templates.";
      setNotice(msg);
    }
  };

  // Trigger loading based on active tab and query
  useEffect(() => {
    setLoading(true);
    const isSearchActive = tab === "archived" ? archivedQuery : query;
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
    }, isSearchActive ? 250 : 0);

    return () => clearTimeout(timer);
  }, [tab, query, page, pageSize, boqPage, boqPageSize, filters, boqFilters, archivedQuery, archivedFilters, archivedPage, archivedPageSize]);

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

  // ── Project Template Actions ────────────────────────────────────────

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

    if (cat.includes("boq")) {
      badgeClass = "badge-boq";
      label = "BOQ TEMPLATE";
    } else if (cat.includes("document") || cat.includes("proposal")) {
      badgeClass = "badge-doc";
      label = "DOCUMENT TEMPLATE";
    } else {
      badgeClass = "badge-project";
      label = "PROJECT TEMPLATE";
    }

    return <span className={`template-fig-badge ${badgeClass}`}>{label}</span>;
  };

  const renderProjectCategoryBadge = (t: { businessType?: string; projectType?: string; category?: string; name?: string }) => {
    const raw = (t.businessType || t.category || "").toLowerCase();
    const category = t.businessType || t.category || "—";

    let badgeClass = "badge-residential";

    if (raw.includes("villa")) {
      badgeClass = "badge-villa";
    } else if (raw.includes("commercial")) {
      badgeClass = "badge-commercial";
    } else if (raw.includes("retail")) {
      badgeClass = "badge-retail";
    } else if (raw.includes("hospitality")) {
      badgeClass = "badge-hospitality";
    }

    return <span className={`template-fig-badge ${badgeClass}`}>{category.toUpperCase()}</span>;
  };

  const renderProjectSubtypeBadge = (t: { projectType?: string; businessType?: string; name?: string }) => {
    return <span className="template-subtype-pill">{t.projectType || "—"}</span>;
  };

  const renderCardMeta = (t: ProjectTemplate) => {
    const rooms = t.composition?.rooms ?? t.roomCount ?? 0;
    const sections = t.composition?.boqSections ?? t.sectionCount ?? 0;
    return `${rooms} Rooms • ${sections} BOQ Sections`;
  };

  const renderUsageCount = (t: ProjectTemplate) => {
    const count = t.useCount ?? t.usageCount ?? 0;
    return `Used ${count} Times`;
  };

  const getProjectTypeLabel = (t: ProjectTemplate): string => {
    return t.projectType || t.businessType || "Standard";
  };

  const getTemplateRooms = (t: ProjectTemplate): number => {
    return t.composition?.rooms ?? t.roomCount ?? 0;
  };

  const getTemplateSections = (t: ProjectTemplate): number => {
    return t.composition?.boqSections ?? t.sectionCount ?? 0;
  };

  const getTemplateItems = (t: ProjectTemplate): number => {
    return t.composition?.items ?? t.itemCount ?? 0;
  };

  const renderStatusPill = (t: ProjectTemplate) => {
    const rawStatus = (t.status || "").toLowerCase();

    if (rawStatus === "active") {
      return <span className="template-status-pill status-active">ACTIVE</span>;
    }
    if (rawStatus.includes("review")) {
      return <span className="template-status-pill status-review">Needs Review</span>;
    }
    if (rawStatus === "draft") {
      return <span className="template-status-pill status-draft">DRAFT</span>;
    }
    return <span className="template-status-pill status-draft">—</span>;
  };

  const getTemplateVersion = (t: ProjectTemplate): string => {
    const v = (t as any).current_version ?? t.version;
    if (v !== undefined && v !== null && v !== 0 && v !== "0") {
      const s = String(v).trim();
      if (s.toLowerCase().startsWith("v")) return s.toLowerCase();
      if (s.includes(".")) return `v${s}`;
      return `v${s}.0`;
    }
    return "—";
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
          className={`template-pagination-page-btn ${isCurrent ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
          onClick={() => {
            if (!isDisabled) setPage(p);
          }}
          aria-label={`Page ${p}`}
          aria-current={isCurrent ? "page" : undefined}
        >
          {p}
        </button>
      );
    });
  };

  const renderPaginationBar = () => {
    const displayTotal = total > 0 ? total : projectTemplates.length > 0 ? projectTemplates.length : 0;
    return (
      <div className="template-pagination-bar" role="navigation" aria-label="Project templates pagination">
        <div className="template-pagination-total">
          Total Project Templates: {displayTotal}
        </div>

        <div className="template-pagination-nav">
          <button
            type="button"
            className="template-pagination-page-btn arrow"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {renderPaginationButtons()}

          <button
            type="button"
            className="template-pagination-page-btn arrow"
            disabled={!hasMore && page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="template-pagination-size-wrap">
          <span className="template-pagination-size-label">Show per Page:</span>
          <div className="template-pagination-size-select-box">
            <select
              className="template-pagination-size-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Show per Page"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown size={14} className="target-table-select-arrow" />
          </div>
        </div>
      </div>
    );
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

        <div className="templates-content-shell">
          {/* Section 1: Template Library Header & Toolbar Row (Frame 2147225065 in Figma) */}
          <div className="template-library-header-row">
            <div className="template-library-title-group">
              <h1 className="template-library-title">Template Library</h1>
              <p className="template-library-subtitle">Use templates to start projects, BOQs, and documents faster.</p>
            </div>

            <div className="template-toolbar-row">
              {tab === "overview" && (
                <>
                  {/* Search template by name… (Frame 76 in Figma Overview) */}
                  <div className="template-search-box">
                    <div className="template-search-icon-badge">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      className="template-search-field"
                      placeholder="Search template by name…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      aria-label="Search template by name"
                    />
                    {query && (
                      <button
                        type="button"
                        className="template-search-clear-btn"
                        onClick={() => setQuery("")}
                        aria-label="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Filter Icon Button */}
                  <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={`template-filter-icon-btn ${isFilterOpen || appliedFiltersCount > 0 ? "active" : ""}`}
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      title="Filter templates"
                      aria-label="Filter templates"
                    >
                      <SlidersHorizontal size={18} />
                      {appliedFiltersCount > 0 && <span className="template-filter-dot" />}
                    </button>
                    <TemplateFilterPopover
                      isOpen={isFilterOpen}
                      onClose={() => setIsFilterOpen(false)}
                      filters={filters}
                      onChange={setFilters}
                      onReset={() => setFilters({ businessType: "", status: "", region: "", visibility: "" })}
                    />
                  </div>
                </>
              )}

              {/* Primary Action Button */}
              {tab !== "archived" && (
                <>
                  <button
                    type="button"
                    className="template-new-btn"
                    onClick={() => {
                      if (tab === "boqs") {
                        setIsNewBoqModalOpen(true);
                      } else {
                        setIsNewModalOpen(true);
                      }
                    }}
                  >
                    <Plus size={18} />
                    <span>{tab === "boqs" ? "New BOQ Template" : "New Template"}</span>
                  </button>

                  {/* Import Excel Action */}
                  <button
                    type="button"
                    className="template-import-btn"
                    onClick={() => setIsImportModalOpen(true)}
                  >
                    <span>Import Excel</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Section 2: Category Navigation Tabs Row (Frame 2147225076 in Figma) */}
          <div className="template-category-nav-row">
            <div className="template-category-tabs-bar" role="tablist" aria-label="Template categories">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "overview"}
                className={`template-category-tab ${tab === "overview" ? "active" : ""}`}
                onClick={() => { setTab("overview"); setQuery(""); }}
              >
                Overview
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "projects"}
                className={`template-category-tab ${tab === "projects" ? "active" : ""}`}
                onClick={() => { setTab("projects"); setQuery(""); setPage(1); }}
              >
                Project Templates
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "boqs"}
                className={`template-category-tab ${tab === "boqs" ? "active" : ""}`}
                onClick={() => { setTab("boqs"); setQuery(""); setBoqPage(1); }}
              >
                BOQ Templates
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "documents"}
                className={`template-category-tab ${tab === "documents" ? "active" : ""}`}
                onClick={() => { setTab("documents"); setQuery(""); }}
              >
                Document Templates
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "archived"}
                className={`template-category-tab ${tab === "archived" ? "active" : ""}`}
                onClick={() => {
                  setTab("archived");
                  router.push("/templates?tab=archived");
                }}
              >
                Archived
              </button>
            </div>

            {/* Right Controls in Tabs Row for Archived Templates (Frame 2147225169 in Figma) */}
            {tab === "archived" && (
              <div className="template-category-controls-wrap">
                {/* Search Archived template by name… (Frame 76 in Figma) */}
                <div className="archived-search-box">
                  <div className="archived-search-icon-badge">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    className="archived-search-input"
                    placeholder="Search Archived template by name…"
                    value={archivedQuery}
                    onChange={(e) => {
                      setArchivedQuery(e.target.value);
                      setArchivedPage(1);
                    }}
                    aria-label="Search Archived template by name"
                  />
                  {archivedQuery && (
                    <button
                      type="button"
                      className="archived-search-clear-btn"
                      onClick={() => {
                        setArchivedQuery("");
                        setArchivedPage(1);
                      }}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Button: Frame 73 (102px x 46px) */}
                <div className="archived-filter-btn-wrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`archived-filter-btn ${isArchivedFilterOpen || activeArchivedFiltersCount > 0 ? "active" : ""}`}
                    onClick={() => setIsArchivedFilterOpen(!isArchivedFilterOpen)}
                    aria-label="Filter archived templates"
                    aria-expanded={isArchivedFilterOpen}
                  >
                    <SlidersHorizontal size={18} />
                    <span>Filter</span>
                    {activeArchivedFiltersCount > 0 && (
                      <span className="archived-filter-badge">{activeArchivedFiltersCount}</span>
                    )}
                  </button>
                  <ArchivedFilterPopover
                    isOpen={isArchivedFilterOpen}
                    onClose={() => setIsArchivedFilterOpen(false)}
                    categories={archivedCategories}
                    filters={archivedFilters}
                    onChange={(f) => {
                      setArchivedFilters(f);
                      setArchivedPage(1);
                    }}
                    onReset={() => {
                      setArchivedFilters({ category: "all", type: "all", sort: "newest" });
                      setArchivedPage(1);
                    }}
                  />
                </div>

                {/* View Toggle: Buttons (86px x 46px) */}
                <div className="archived-view-toggle-wrap" role="group" aria-label="View mode">
                  <button
                    type="button"
                    className={`archived-view-btn ${archivedView === "grid" ? "active" : ""}`}
                    onClick={() => setArchivedView("grid")}
                    title="Grid view"
                    aria-label="Grid view"
                    aria-pressed={archivedView === "grid"}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    type="button"
                    className={`archived-view-btn ${archivedView === "list" ? "active" : ""}`}
                    onClick={() => setArchivedView("list")}
                    title="List view"
                    aria-label="List view"
                    aria-pressed={archivedView === "list"}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Right Controls in Tabs Row for Project Templates (Frame 2147225169 in Figma) */}
            {tab === "projects" && (
              <div className="template-category-controls-wrap">
                {/* Search projects or clients… (Frame 76 in Figma) */}
                <div className="template-search-box">
                  <div className="template-search-icon-badge">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    className="template-search-field"
                    placeholder="Search projects or clients…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Search projects or clients"
                  />
                  {query && (
                    <button
                      type="button"
                      className="template-search-clear-btn"
                      onClick={() => { setQuery(""); setPage(1); }}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Button: Frame 73 (102px x 46px) */}
                <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`template-filter-labeled-btn ${isFilterOpen || appliedFiltersCount > 0 ? "active" : ""}`}
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    title="Filter templates"
                    aria-label="Filter templates"
                  >
                    <SlidersHorizontal size={18} />
                    <span>Filter</span>
                    {appliedFiltersCount > 0 && <span className="template-filter-dot" />}
                  </button>
                  <TemplateFilterPopover
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    onChange={setFilters}
                    onReset={() => setFilters({ businessType: "", status: "", region: "", visibility: "" })}
                  />
                </div>

                {/* View Toggle: Frame 77 (List icon first, Grid icon second) */}
                <div className="template-view-toggle-wrap" role="group" aria-label="View mode">
                  <button
                    type="button"
                    className={`template-view-toggle-btn ${view === "list" ? "active" : ""}`}
                    onClick={() => setView("list")}
                    title="List view"
                    aria-label="List view"
                    aria-pressed={view === "list"}
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    className={`template-view-toggle-btn ${view === "grid" ? "active" : ""}`}
                    onClick={() => setView("grid")}
                    title="Grid view"
                    aria-label="Grid view"
                    aria-pressed={view === "grid"}
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Right Controls in Tabs Row for BOQ Templates */}
            {tab === "boqs" && (
              <div className="template-category-controls-wrap">
                <div className="template-search-box">
                  <div className="template-search-icon-badge">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    className="template-search-field"
                    placeholder="Search BOQ template by name…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setBoqPage(1);
                    }}
                    aria-label="Search BOQ template by name"
                  />
                  {query && (
                    <button
                      type="button"
                      className="template-search-clear-btn"
                      onClick={() => { setQuery(""); setBoqPage(1); }}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`template-filter-labeled-btn ${isBoqFilterOpen || appliedBoqFiltersCount > 0 ? "active" : ""}`}
                    onClick={() => setIsBoqFilterOpen(!isBoqFilterOpen)}
                    title="Filter BOQ templates"
                    aria-label="Filter BOQ templates"
                  >
                    <SlidersHorizontal size={18} />
                    <span>Filter</span>
                    {appliedBoqFiltersCount > 0 && <span className="template-filter-dot" />}
                  </button>
                </div>

                <div className="template-view-toggle-wrap" role="group" aria-label="View mode">
                  <button
                    type="button"
                    className={`template-view-toggle-btn ${view === "list" ? "active" : ""}`}
                    onClick={() => setView("list")}
                    title="List view"
                    aria-label="List view"
                    aria-pressed={view === "list"}
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    className={`template-view-toggle-btn ${view === "grid" ? "active" : ""}`}
                    onClick={() => setView("grid")}
                    title="Grid view"
                    aria-label="Grid view"
                    aria-pressed={view === "grid"}
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notice Alert Banner */}
          {notice && (
            <div className="template-notice-banner">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice(null)} aria-label="Close notice">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── TAB 1: OVERVIEW ── */}
          {tab === "overview" && (
            <>
              {/* Section 3: RECENTLY USED TEMPLATES (Frame 2147225128 in Figma) */}
              <div className="templates-recent-section">
                <div className="templates-recent-header">
                  <h2 className="templates-recent-title">RECENTLY USED TEMPLATES</h2>
                  <button
                    type="button"
                    className="templates-view-all-btn"
                    onClick={() => setTab("projects")}
                  >
                    View All →
                  </button>
                </div>

                {loading ? (
                  <div className="templates-recent-grid">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="template-fig-card-skeleton skeleton-shimmer" />
                    ))}
                  </div>
                ) : displayRecentlyUsed.length > 0 ? (
                  <div className="templates-recent-grid">
                    {displayRecentlyUsed.slice(0, 4).map((t) => (
                      <div
                        key={`${t.itemType}-${t.id}`}
                        className="template-fig-card"
                        onClick={() => {
                          if (t.itemType === "PROJECT") router.push(`/templates/${t.id}`);
                          else if (t.itemType === "BOQ") router.push(`/templates/boq/${t.id}`);
                          else router.push("/proposals");
                        }}
                      >
                        {/* Preview Image (Rectangle 78) */}
                        <div className="template-fig-card-img-wrap">
                          <TemplateCoverImage
                            src={t.imageUrl || fallbackImages.Residential}
                            alt={t.name}
                            fallbackSrc={fallbackImages.Residential}
                          />
                        </div>

                        {/* Title & Metadata Row (Frame 2147225073) */}
                        <div className="template-fig-card-info">
                          <div className="template-fig-card-title-col">
                            <h3 className="template-fig-card-title" title={t.name}>{t.name}</h3>
                            <p className="template-fig-card-subtitle">{t.subtitle}</p>
                          </div>
                          <span className={`template-fig-badge ${t.badgeClass}`}>
                            {t.badgeLabel}
                          </span>
                        </div>

                        {/* Subtle Divider (Rectangle 40) */}
                        <div className="template-fig-divider" />

                        {/* Usage & Actions Footer Row (Frame 2147225074) */}
                        <div className="template-fig-card-footer">
                          <span className="template-fig-card-usage">
                            Used {t.useCount} Times
                          </span>
                          <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="template-fig-card-menu-btn"
                              aria-label="More options"
                              onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                            >
                              <MoreHorizontal size={18} />
                            </button>
                            {menuId === t.id && (
                              <div className="template-card-menu-popover">
                                <button onClick={() => {
                                  setMenuId(null);
                                  if (t.itemType === "PROJECT") setUseModalTemplate(t.raw);
                                  else if (t.itemType === "BOQ") setActiveUseBoqModal(t.raw);
                                  else router.push("/proposals");
                                }}>
                                  <Play size={14} /> Use Template
                                </button>
                                <button onClick={() => {
                                  setMenuId(null);
                                  if (t.itemType === "PROJECT") router.push(`/templates/${t.id}`);
                                  else if (t.itemType === "BOQ") router.push(`/templates/boq/${t.id}`);
                                  else router.push("/proposals");
                                }}>
                                  <Edit3 size={14} /> Edit Template
                                </button>
                                <button onClick={() => {
                                  setMenuId(null);
                                  if (t.itemType === "PROJECT") handleDuplicate(t.raw);
                                  else if (t.itemType === "BOQ") handleBoqDuplicate(t.raw);
                                }}>
                                  <Copy size={14} /> Duplicate
                                </button>
                                <button className="danger" onClick={() => {
                                  setMenuId(null);
                                  if (t.itemType === "PROJECT") handleArchive(t.raw);
                                  else if (t.itemType === "BOQ") handleBoqArchive(t.raw);
                                }}>
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
                  <div className="templates-empty-state">
                    <LayoutGrid size={36} color="#94A3B8" />
                    <h3>No recently used templates</h3>
                    <p>{query ? "No templates match your search." : "Create your first template or import one from Excel to get started."}</p>
                  </div>
                )}
              </div>

              {/* Section 4: TEMPLATES BY TYPE (Frame 2147225071 in Figma) */}
              <div className="templates-by-type-section">
                <div className="templates-by-type-header">
                  <h2 className="templates-by-type-title">TEMPLATES BY TYPE</h2>
                </div>

                {loading ? (
                  <div className="templates-summary-grid">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="template-summary-card-skeleton skeleton-shimmer" />
                    ))}
                  </div>
                ) : (
                  <div className="templates-summary-grid">
                    {/* Card 1: Project Templates */}
                    <div
                      className="template-summary-card"
                      onClick={() => setTab("projects")}
                      tabIndex={0}
                      role="button"
                      aria-label="View Project Templates"
                    >
                      <div className="template-summary-top">
                        <span className="template-summary-label">Project Templates</span>
                        <span className="template-summary-count">
                          {overview?.projectTemplatesCount ?? overview?.total ?? 0}
                        </span>
                        <span className="template-summary-desc">
                          Start projects with pre-defined structure.
                        </span>
                      </div>
                      <div className="template-summary-note">
                        {overview?.mostUsedProject ? (
                          <>Most Used: <b>{overview.mostUsedProject}</b></>
                        ) : (
                          <span>No usage recorded</span>
                        )}
                      </div>
                    </div>

                    {/* Card 2: BOQ Templates */}
                    <div
                      className="template-summary-card"
                      onClick={() => setTab("boqs")}
                      tabIndex={0}
                      role="button"
                      aria-label="View BOQ Templates"
                    >
                      <div className="template-summary-top">
                        <span className="template-summary-label">BOQ Templates</span>
                        <span className="template-summary-count">
                          {overview?.boqTemplatesCount ?? boqTotal ?? 0}
                        </span>
                        <span className="template-summary-desc">
                          Reusable BOQ Sections and item structures
                        </span>
                      </div>
                      <div className="template-summary-note">
                        {overview?.mostUsedBoq ? (
                          <>Most Used: <b>{overview.mostUsedBoq}</b></>
                        ) : (
                          <span>No usage recorded</span>
                        )}
                      </div>
                    </div>

                    {/* Card 3: Document Templates */}
                    <div
                      className="template-summary-card"
                      onClick={() => setTab("documents")}
                      tabIndex={0}
                      role="button"
                      aria-label="View Document Templates"
                    >
                      <div className="template-summary-top">
                        <span className="template-summary-label">Document Templates</span>
                        <span className="template-summary-count">
                          {overview?.documentTemplatesCount ?? docTemplates.length ?? 0}
                        </span>
                        <span className="template-summary-desc">
                          Branded BOQ, proposals, and invoice layouts.
                        </span>
                      </div>
                      <div className="template-summary-note">
                        {overview?.mostUsedDoc ? (
                          <>Most Used: <b>{overview.mostUsedDoc}</b></>
                        ) : (
                          <span>No usage recorded</span>
                        )}
                      </div>
                    </div>

                    {/* Card 4: Recently Updated */}
                    <div
                      className="template-summary-card"
                      tabIndex={0}
                      role="button"
                      aria-label="Recently Updated Info"
                    >
                      <div className="template-summary-top">
                        <span className="template-summary-label">Recently Updated</span>
                        <span className="template-summary-count">
                          {overview?.recentlyUpdatedCount ?? 0}
                        </span>
                        <span className="template-summary-desc">
                          in last 7 Days
                        </span>
                      </div>
                      <div className="template-summary-note">
                        {overview?.lastUpdatedName ? (
                          <>Updated: <b>{overview.lastUpdatedName}</b></>
                        ) : (
                          <span>No recent updates</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── TAB 2: PROJECT TEMPLATES ── */}
          {tab === "projects" && (
            <div>
              {loading ? (
                view === "grid" ? (
                  <div className="project-templates-grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="template-fig-card-skeleton skeleton-shimmer" />
                    ))}
                  </div>
                ) : (
                  <div className="project-templates-table-container">
                    <div className="project-templates-table-scroll">
                      <table className="project-templates-table">
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
                            <th style={{ width: 48 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <tr key={i} className="template-table-row-skeleton">
                              <td colSpan={10}>
                                <div className="template-table-cell-shimmer skeleton-shimmer" style={{ width: `${75 + (i % 3) * 10}%` }} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ) : projectTemplates.length === 0 ? (
                <div className="templates-empty-state">
                  <LayoutGrid size={48} color="#CBD5E1" />
                  <h3>No templates found</h3>
                  <p>{query ? "Try adjusting your search or filters." : "Create your first template to get started."}</p>
                  {query ? (
                    <button
                      className="template-new-btn"
                      style={{ marginTop: 16 }}
                      onClick={() => { setQuery(""); setPage(1); }}
                    >
                      Clear Search
                    </button>
                  ) : (
                    <button
                      className="template-new-btn"
                      style={{ marginTop: 16 }}
                      onClick={() => setIsNewModalOpen(true)}
                    >
                      <Plus size={16} /> New Template
                    </button>
                  )}
                </div>
              ) : view === "grid" ? (
                <>
                  {/* Grid View: Frame 2147225083 */}
                  <div className="project-templates-grid">
                    {projectTemplates.map((t) => (
                      <div
                        key={t.id}
                        className="template-fig-card"
                        onClick={() => router.push(`/templates/${t.id}`)}
                      >
                        <div className="template-fig-card-img-wrap">
                          <TemplateCoverImage
                            src={getTemplateCover(t)}
                            alt={t.name}
                            fallbackSrc={getTemplateFallback(t)}
                          />
                        </div>
                        <div className="template-fig-card-info">
                          <div className="template-fig-card-title-col">
                            <h3 className="template-fig-card-title" title={t.name}>{t.name}</h3>
                            <p className="template-fig-card-subtitle">{renderCardMeta(t)}</p>
                          </div>
                          {renderProjectCategoryBadge(t)}
                        </div>
                        <div className="template-fig-divider" />
                        <div className="template-fig-card-footer">
                          <span className="template-fig-card-usage">
                            {renderUsageCount(t)}
                          </span>
                          <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="template-fig-card-menu-btn"
                              aria-label="More options"
                              onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                            >
                              <MoreHorizontal size={18} />
                            </button>
                            {menuId === t.id && (
                              <div className="template-card-menu-popover">
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

                  {renderPaginationBar()}
                </>
              ) : (
                <>
                  {/* List/Table View: Frame 2147225069 */}
                  <div className="project-templates-table-container">
                    <div className="project-templates-table-scroll">
                      <table className="project-templates-table">
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
                            <th style={{ width: 48 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {projectTemplates.map((t) => {
                            const { date, time } = formatUpdatedDateTime(t.updatedAt || t.createdAt);
                            return (
                              <tr
                                key={t.id}
                                className="project-templates-table-row"
                                onClick={() => router.push(`/templates/${t.id}`)}
                              >
                                <td>
                                  <div className="project-templates-name-cell">
                                    <div className="project-templates-thumb-wrap">
                                      <TemplateCoverImage
                                        src={getTemplateCover(t)}
                                        alt={t.name}
                                        fallbackSrc={getTemplateFallback(t)}
                                      />
                                    </div>
                                    <div className="project-templates-name-info">
                                      <span className="project-templates-title" title={t.name}>
                                        {t.name}
                                      </span>
                                      <span className="project-templates-desc" title={t.description || ""}>
                                        {t.description || t.templateCode || "Standard premium interior template"}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td>{renderProjectCategoryBadge(t)}</td>
                                <td>{renderProjectSubtypeBadge(t)}</td>
                                <td>
                                  <span className="template-table-stat-number">{getTemplateRooms(t)}</span>
                                </td>
                                <td>
                                  <span className="template-table-stat-number">{getTemplateSections(t)}</span>
                                </td>
                                <td>
                                  <span className="template-table-stat-number">{getTemplateItems(t)}</span>
                                </td>
                                <td>{renderStatusPill(t)}</td>
                                <td>
                                  <span className="template-table-version-text">{getTemplateVersion(t)}</span>
                                </td>
                                <td>
                                  <div className="template-table-updated-cell">
                                    <span className="updated-date">{date}</span>
                                    <span className="updated-time">{time}</span>
                                  </div>
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <div className="template-table-action-wrap" style={{ position: "relative" }}>
                                    <button
                                      type="button"
                                      className="template-fig-card-menu-btn"
                                      aria-label="More options"
                                      onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                                    >
                                      <MoreHorizontal size={16} />
                                    </button>
                                    {menuId === t.id && (
                                      <div className="template-card-menu-popover" style={{ top: "100%", bottom: "auto", right: 0 }}>
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

                    {renderPaginationBar()}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB 3: BOQ TEMPLATES ── */}
          {tab === "boqs" && (
            <div className="boq-list-layout-wrap">
              <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
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
          )}

          {/* ── TAB 4: DOCUMENT TEMPLATES ── */}
          {tab === "documents" && (
            docTemplates.length > 0 ? (
              <div className="templates-recent-grid">
                {docTemplates.map((t) => (
                  <div
                    key={t.id}
                    className="template-fig-card"
                    onClick={() => router.push("/proposals")}
                  >
                    <div className="template-fig-card-img-wrap">
                      <TemplateCoverImage
                        src={getTemplateCover(t)}
                        alt={t.name}
                        fallbackSrc={fallbackImages.Commercial}
                      />
                    </div>
                    <div className="template-fig-card-info">
                      <div className="template-fig-card-title-col">
                        <h3 className="template-fig-card-title" title={t.name}>{t.name}</h3>
                        <p className="template-fig-card-subtitle">{t.description || "No description available."}</p>
                      </div>
                      <span className="template-fig-badge badge-doc">DOCUMENT TEMPLATE</span>
                    </div>
                    <div className="template-fig-divider" />
                    <div className="template-fig-card-footer">
                      <span className="template-fig-card-usage">
                        Used {t.useCount} Times
                      </span>
                      <button
                        type="button"
                        className="template-fig-card-menu-btn"
                        aria-label="View Document Template"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/proposals");
                        }}
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="templates-empty" style={{ padding: "48px 20px", textAlign: "center" }}>
                <h3>No document templates found</h3>
                <p>No document templates are available for this workspace.</p>
              </div>
            )
          )}

          {/* ── TAB 5: ARCHIVED TEMPLATES ── */}
          {tab === "archived" && (
            <ArchivedTemplatesView
              items={archivedTemplates}
              total={archivedTotal}
              loading={loading}
              page={archivedPage}
              pageSize={archivedPageSize}
              totalPages={archivedTotalPages}
              view={archivedView}
              hasSearchOrFilters={Boolean(archivedQuery || activeArchivedFiltersCount > 0)}
              onPageChange={(p) => setArchivedPage(p)}
              onPageSizeChange={(sz) => {
                setArchivedPageSize(sz);
                setArchivedPage(1);
              }}
              onRestore={async (item) => {
                try {
                  if (item.rawType === "boq" || item.templateType.includes("BOQ")) {
                    await restoreBoqTemplate(item.id);
                  } else {
                    await restoreProjectTemplate(item.id);
                  }
                  setNotice(`Template "${item.name}" restored to library.`);
                  await loadArchived();
                  loadOverview();
                } catch (err: unknown) {
                  setNotice(err instanceof Error ? err.message : "Failed to restore template.");
                }
              }}
              onDeletePermanently={async (item) => {
                try {
                  if (item.rawType === "boq" || item.templateType.includes("BOQ")) {
                    await deleteBoqTemplate(item.id, true);
                  } else {
                    await deleteProjectTemplatePermanently(item.id);
                  }
                  setNotice(`Template "${item.name}" permanently deleted.`);
                  await loadArchived();
                  loadOverview();
                } catch (err: unknown) {
                  setNotice(err instanceof Error ? err.message : "Failed to delete template.");
                }
              }}
              onClearFilters={() => {
                setArchivedQuery("");
                setArchivedFilters({ category: "all", type: "all", sort: "newest" });
                setArchivedPage(1);
              }}
            />
          )}
        </div>
      </div>

      {/* New Template Modal */}
      <NewTemplateModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={(created: any) => {
          setIsNewModalOpen(false);
          setNotice(`Template "${created.name}" created successfully.`);
          loadOverview();
          loadProjectTemplates();
          loadBoqTemplates();
          if (created.id) {
            if (created.category || created.costMapping !== undefined || created.templateCode?.startsWith("BOQ") || created.sections !== undefined) {
              router.push(`/templates/boq/${created.id}`);
            } else {
              router.push(`/templates/${created.id}`);
            }
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
