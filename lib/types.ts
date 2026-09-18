// Shared TypeScript types matching backend API DTOs.
// These types reflect the actual API response shapes from app/api/v1/[...path]/route.ts.

// ── Projects ────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  projectCode: string | null;
  name: string;
  clientName: string;
  clientContact: string | null;
  clientEmail: string | null;
  projectType: string;
  status: string;
  location: string | null;
  description: string | null;
  areaSqft: number | null;
  projectValue: number | null;
  approvedBudget: number | null;
  startDate: string | null;
  targetCompletionDate: string | null;
  assignedDesignerId: string | null;
  tags: string[];
  progress: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRoom {
  id: string;
  name: string;
  room_type: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  unit: string | null;
  notes: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends Project {
  rooms: ProjectRoom[];
}

// ── BOQ ─────────────────────────────────────────────────────────────────────

export interface Boq {
  id: string;
  projectId: string | null;
  boqNumber: string;
  version: string | null;
  assignedTo: string | null;
  method: string | null;
  templateId: string | null;
  status: string;
  markupPercent: number;
  taxPercent: number;
  roomCount: number;
  itemCount: number;
  subtotal: number;
  markupAmount: number;
  taxAmount: number;
  grandTotal: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoqItem {
  id: string;
  room_id: string;
  category_id: string;
  name: string;
  description: string | null;
  unit: string | null;
  quantity: number;
  rate: number;
  waste_percent: number;
  tax_percent: number;
  amount: number;
  sort_order: number | null;
}

export interface BoqCategory {
  id: string;
  room_id: string;
  name: string;
  description: string | null;
  sort_order: number | null;
  items: BoqItem[];
}

export interface BoqRoom {
  id: string;
  name: string;
  description: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  categories: BoqCategory[];
}

export interface BoqDetail extends Boq {
  rooms: BoqRoom[];
}

export interface BoqTemplate {
  id: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  use_count: number;
  created_at: string;
  updated_at: string;
}

// ── Project Templates ───────────────────────────────────────────────────────

export type TemplateSection = Record<string, unknown>;

export interface TemplateComposition {
  rooms: number;
  boqSections: number;
  items: number;
  stages: number;
  tasks: number;
  milestones: number;
  approvals: number;
  rules: number;
  documents: number;
}

export interface ProjectTemplate {
  id: string;
  templateCode: string;
  name: string;
  description: string | null;
  businessType: string;
  projectType: string;
  team: string | null;
  region: string | null;
  visibility: string;
  imageUrl: string | null;
  tags: string[];
  status: string;
  version: number;
  useCount: number;
  lastUsedAt: string | null;
  publishedAt: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  composition: TemplateComposition;
  structure?: TemplateSection;
  costingBoq?: TemplateSection;
  workflow?: TemplateSection;
  documents?: TemplateSection[];
}

export interface ProjectTemplateOverview {
  total: number;
  active: number;
  draft: number;
  needsReview: number;
  byType: Record<string, number>;
  recentlyUsed: ProjectTemplate[];
}

// ── Costing ─────────────────────────────────────────────────────────────────

export interface CostingCategoryBackend {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  code: string | null;
  default_unit: string | null;
  default_tax_percent: number | null;
  default_markup_percent: number | null;
  default_waste_percent: number | null;
  transport_included: boolean;
  labour_included: boolean;
  description: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  subCategoryCount?: number;
  itemCount?: number;
  // Frontend-friendly aliases
  status?: string;
  items?: number;
  subCategories?: number;
  parentName?: string | null;
}

export interface CostingCategoryDetail extends Omit<CostingCategoryBackend, 'items' | 'subCategories'> {
  subCategories: (CostingCategoryBackend & { itemsCount?: number; usedInBoqs?: number; usedInProjects?: number; updated?: string })[];
  items: CostingItemBackend[];
  itemsList?: CostingItemBackend[];
  usedInBoqs?: number;
  usedInProjects?: number;
  boqList?: Array<{ id: string; boqNumber: string; projectId: string }>;
  projectList?: Array<{ id: string; name: string; projectCode?: string | null }>;
  subCategoriesCount?: number;
  activityLog?: Array<{ id: string; action: string; details: string; by: string; date: string }>;
}

export interface CostingItemBackend {
  id: string;
  workspace_id: string;
  category_id: string | null;
  name: string;
  code: string | null;
  unit: string | null;
  base_cost: number;
  selling_rate: number;
  preferred_vendor: string | null;
  spec: string | null;
  rate_status: string | null;
  image_url: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  marginPercent?: number;
  // Frontend-friendly aliases (may be populated by API or frontend mapping)
  status?: string;
  category?: string;
  categoryName?: string | null;
  baseCost?: number;
  sellingRate?: number;
  margin?: string | number;
  vendor?: string;
  preferredVendor?: string | null;
  rateStatus?: string;
  imageUrl?: string | null;
  description?: string | null;
  updatedAt?: string;
}

export interface CostingItemDetail extends CostingItemBackend {
  vendorQuotes: VendorQuote[];
}

export interface VendorQuote {
  id: string;
  workspace_id: string;
  item_id: string;
  vendor_name: string;
  quote: number;
  lead_time_days: number | null;
  rating: number | null;
  selected: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CostingScenario {
  id: string;
  workspace_id: string;
  boq_id: string;
  name: string;
  description: string | null;
  scenario_type: string;
  adjustments: Array<{ name?: string; rate?: number | null; [key: string]: unknown }>;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  // Populated on GET detail
  baseCost?: number;
  scenarioCost?: number;
  savings?: number;
  baseMargin?: number | null;
  scenarioMargin?: number | null;
}

export interface VarianceCategory {
  id: string;
  category: string;
  name?: string;
  code?: string;
  budget: number;
  actual: number;
  committed: number;
  forecast: number;
  variance: number;
  utilization: number;
  status: "ON TRACK" | "AT RISK" | "OVER BUDGET" | "UNDER BUDGET";
  itemCount?: number;
  quoteCount?: number;
}

export interface EnrichedVendorQuote extends VendorQuote {
  itemName?: string;
  itemCode?: string;
  categoryName?: string;
  baseCost?: number;
  sellingRate?: number;
  variance?: number;
  savings?: number;
}

export interface CostingAnalysisResponse {
  currency: string;
  projectName?: string;
  projectsList?: Array<{ id: string; name: string; approvedBudget?: number; projectValue?: number; status?: string }>;
  summary: {
    totalBudget: number;
    actualCost: number;
    committed: number;
    forecast: number;
    variance: number;
  };
  items: CostingItemBackend[];
  vendorQuotes: EnrichedVendorQuote[];
  varianceByCategory: VarianceCategory[];
  costOverview?: {
    baseCost: number;
    markupAmount: number;
    markupPercent: number;
    taxAmount: number;
    taxPercent: number;
    clientPrice: number;
  };
}

export interface MarginImpactDriver {
  id: string;
  driver: string;
  impactOnMargin: number;
  vsLastMonth: number;
  affectedItems: number;
  primaryImpact: string;
}

export interface MarginTrendPoint {
  month: string;
  current: number;
  target: number;
}

export interface MarginCategory {
  id: string;
  name: string;
  marginPercent: number;
  vsLastMonth?: number;
  itemCount?: number;
}

export interface LowMarginItem extends CostingItemBackend {
  marginPercent: number;
  brand?: string;
  unitLabel?: string;
  severity?: "CRITICAL" | "ACTIVE" | "WARNING";
}

export interface MarginInsight {
  id: string;
  icon: "info" | "trending" | "percent" | "flag";
  text: string;
  actionText: string;
  actionType?: string;
}

export interface MarginAnalysisResponse {
  currency: string;
  targetMargin: number;
  currentMargin: number;
  marginDifference: number;
  currentMarginDelta?: number;
  marginDifferenceDelta?: number;
  lowMarginCount?: number;
  avgLowMargin?: number;
  lowMarginItems: LowMarginItem[];
  byCategory: MarginCategory[];
  impactDrivers: MarginImpactDriver[];
  trend: MarginTrendPoint[];
  insights?: MarginInsight[];
}

export interface CostingSettingsResponse {
  scope: string;
  health: {
    completenessPercent: number;
    categoryCount: number;
    itemCount: number;
    vendorQuoteCount: number;
    scenarioCount: number;
    missingCategoryDefaults: number;
    expiredRates: number;
  };
  sections: string[];
}

// ── Proposals ───────────────────────────────────────────────────────────────

export interface Proposal {
  id: string;
  proposalCode: string;
  projectId: string | null;
  projectName: string;
  clientName: string;
  sourceType: string | null;
  sourceId: string | null;
  sourceLabel: string | null;
  proposedValue: number;
  currency: string;
  expiryDate: string | null;
  internalNotes: string | null;
  scopeItems: string[];
  status: string;
  viewCount: number;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalSummary {
  total: number;
  totalSent: number;
  winRate: number;
  averageValue: number;
  pendingResponse: number;
  decidedCount: number;
  expiringSoon: number;
  currency: string;
}

// ── Invoices ────────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  id: string;
  position: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  paidAt: string;
  method: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  manualNumber: string | null;
  systemCode: string;
  type: string;
  clientId: string | null;
  clientName: string;
  billingAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  projectId: string | null;
  projectName: string;
  issueDate: string;
  dueDate: string;
  milestone: string | null;
  reference: string | null;
  additionalNotes: string | null;
  bankDetails: {
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    ifscCode?: string;
  } | null;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  totalPaid: number;
  outstanding: number;
  currency: string;
  status: string;
  storedStatus: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceLineItem[];
  payments?: InvoicePayment[];
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalInvoiced: number;
  collected: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  currency: string;
}

// ── Documents ───────────────────────────────────────────────────────────────

export interface DocumentFolder {
  id: string;
  parentId: string | null;
  name: string;
  itemCount: number;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentFile {
  id: string;
  folderId: string;
  proposalId: string | null;
  projectId: string | null;
  projectName: string | null;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

// ── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsResponse {
  scope: {
    workspaceId: string;
    currency: string;
    period: string;
    from: string;
    generatedAt: string;
  };
  kpis: {
    totalRevenue: number;
    totalCost: number;
    grossMarginPercent: number;
    averageProjectValue: number;
  };
  monthlyRevenueVsCost: Array<{ period: string; revenue: number; cost: number }>;
  grossMarginTrend: Array<{ period: string; marginPercent: number }>;
  projectsByType: Array<{ type: string; projects: number; value: number }>;
  pipelineByType: Array<{ type: string; projects: number; value: number }>;
  teamPerformance: Array<{
    userId: string;
    role: string;
    projects: number;
    boqs: number;
    projectValue: number;
    rating: number | null;
  }>;
  clientAnalysis: Array<{
    client: string;
    projects: number;
    totalValue: number;
    revenue: number;
    marginPercent: number | null;
  }>;
  counts: { projects: number; boqs: number };
}

// ── Activities ────────────────────────────────────────────────────────────────

export interface ActivityStage {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  terminalType: "completed" | "lost" | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityTask {
  id: string;
  projectId: string;
  stageId: string;
  name: string;
  description: string | null;
  assignedTo: string | null;
  ownerId: string | null;
  dueDate: string | null;
  priority: "low" | "medium" | "high" | "critical";
  status: "not_started" | "in_progress" | "blocked" | "completed" | "cancelled";
  attachments: Record<string, unknown>[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  project?: { projectCode: string | null; name: string };
  stage?: { name: string; color: string | null };
}

export interface ActivityApproval {
  id: string;
  projectId: string;
  stageId: string;
  name: string;
  description: string | null;
  approverId: string | null;
  approverName: string | null;
  dueDate: string;
  status: "draft" | "sent" | "in_review" | "approved" | "changes_required" | "rejected" | "cancelled";
  requestedAt: string | null;
  decidedAt: string | null;
  attachments: Record<string, unknown>[];
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  project?: { projectCode: string | null; name: string };
  stage?: { name: string; color: string | null };
}

export interface ActivityComment {
  id: string;
  entityType: "task" | "approval";
  entityId: string;
  body: string;
  attachments: Record<string, unknown>[];
  authorId: string;
  createdAt: string;
}

export interface ActivitySummary {
  stages: number;
  tasks: {
    total: number;
    overdue: number;
    inProgress: number;
    completed: number;
  };
  approvals: {
    total: number;
    overdue: number;
    inReview: number;
    approved: number;
  };
}

// ── Paginated Response ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
