// Centralized business logic and utilities for BOQ SaaS Projects Module:
// Stage Management, Progress Calculation, Company-specific Project IDs, Designer Display, BOQ Value & Confirmed Margins.

export type StageColorDef = {
  bg: string;
  text: string;
  border?: string;
};

export type DefaultStage = {
  id?: string;
  key: string;
  name: string;
  color: string;
  sortOrder: number;
  terminalType: "completed" | "lost" | null;
  defaultProgress: number;
};

/**
 * Standard project stages (Kanban columns), in order. The 11 working stages advance progress evenly up to
 * Project Completed (100%). On Hold pauses a project, Lost and Cancelled close it; none of those count towards progress.
 */
export const DEFAULT_PROJECT_STAGES: DefaultStage[] = [
  { key: "enquiry", name: "Enquiry", color: "#2563EB", sortOrder: 1, terminalType: null, defaultProgress: 9.09 },
  { key: "site_visit_briefing", name: "Site Visit & Briefing", color: "#0EA5E9", sortOrder: 2, terminalType: null, defaultProgress: 18.18 },
  { key: "concept_estimate", name: "Concept & Estimate", color: "#7C3AED", sortOrder: 3, terminalType: null, defaultProgress: 27.27 },
  { key: "boq_proposal", name: "BOQ & Proposal", color: "#9333EA", sortOrder: 4, terminalType: null, defaultProgress: 36.36 },
  { key: "client_review", name: "Client Review", color: "#EA580C", sortOrder: 5, terminalType: null, defaultProgress: 45.45 },
  { key: "agreement_advance", name: "Agreement & Advance", color: "#D97706", sortOrder: 6, terminalType: null, defaultProgress: 54.55 },
  { key: "design_finalisation", name: "Design Finalisation", color: "#4F46E5", sortOrder: 7, terminalType: null, defaultProgress: 63.64 },
  { key: "procurement_production", name: "Procurement & Production", color: "#0891B2", sortOrder: 8, terminalType: null, defaultProgress: 72.73 },
  { key: "site_execution", name: "Site Execution", color: "#0D9488", sortOrder: 9, terminalType: null, defaultProgress: 81.82 },
  { key: "quality_handover", name: "Quality & Handover", color: "#059669", sortOrder: 10, terminalType: null, defaultProgress: 90.91 },
  { key: "project_completed", name: "Project Completed", color: "#16A34A", sortOrder: 11, terminalType: "completed", defaultProgress: 100 },
  { key: "on_hold", name: "On Hold", color: "#64748B", sortOrder: 12, terminalType: null, defaultProgress: 0 },
  { key: "lost", name: "Lost", color: "#DC2626", sortOrder: 13, terminalType: "lost", defaultProgress: 0 },
  { key: "cancelled", name: "Cancelled", color: "#991B1B", sortOrder: 14, terminalType: "lost", defaultProgress: 0 },
];

/** Stages that sit outside the progress sequence. */
export const NON_PROGRESS_STAGE_NAMES = ["ON HOLD", "LOST", "CANCELLED"];

export const STAGE_COLOR_MAP: Record<string, { bg: string; text: string; hex: string }> = {
  "ENQUIRY": { bg: "rgba(37, 99, 235, 0.12)", text: "#2563EB", hex: "#2563EB" },
  "SITE VISIT & BRIEFING": { bg: "rgba(14, 165, 233, 0.12)", text: "#0EA5E9", hex: "#0EA5E9" },
  "CONCEPT & ESTIMATE": { bg: "rgba(124, 58, 237, 0.12)", text: "#7C3AED", hex: "#7C3AED" },
  "BOQ & PROPOSAL": { bg: "rgba(147, 51, 234, 0.12)", text: "#9333EA", hex: "#9333EA" },
  "CLIENT REVIEW": { bg: "rgba(234, 88, 12, 0.12)", text: "#EA580C", hex: "#EA580C" },
  "AGREEMENT & ADVANCE": { bg: "rgba(217, 119, 6, 0.12)", text: "#D97706", hex: "#D97706" },
  "DESIGN FINALISATION": { bg: "rgba(79, 70, 229, 0.12)", text: "#4F46E5", hex: "#4F46E5" },
  "PROCUREMENT & PRODUCTION": { bg: "rgba(8, 145, 178, 0.12)", text: "#0891B2", hex: "#0891B2" },
  "SITE EXECUTION": { bg: "rgba(13, 148, 136, 0.12)", text: "#0D9488", hex: "#0D9488" },
  "QUALITY & HANDOVER": { bg: "rgba(5, 150, 105, 0.12)", text: "#059669", hex: "#059669" },
  "PROJECT COMPLETED": { bg: "rgba(22, 163, 74, 0.12)", text: "#16A34A", hex: "#16A34A" },
  "ON HOLD": { bg: "rgba(100, 116, 139, 0.12)", text: "#64748B", hex: "#64748B" },
  "CANCELLED": { bg: "rgba(153, 27, 27, 0.12)", text: "#991B1B", hex: "#991B1B" },
  "REQUIREMENT STATED": { bg: "rgba(37, 99, 235, 0.12)", text: "#2563EB", hex: "#2563EB" },
  "ESTIMATE / BOQ SHARED": { bg: "rgba(124, 58, 237, 0.12)", text: "#7C3AED", hex: "#7C3AED" },
  "NEGOTIATIONS": { bg: "rgba(234, 88, 12, 0.12)", text: "#EA580C", hex: "#EA580C" },
  "DESIGN": { bg: "rgba(79, 70, 229, 0.12)", text: "#4F46E5", hex: "#4F46E5" },
  "EXECUTIONS": { bg: "rgba(8, 145, 178, 0.12)", text: "#0891B2", hex: "#0891B2" },
  "PROJECT HANDOVER": { bg: "rgba(13, 148, 136, 0.12)", text: "#0D9488", hex: "#0D9488" },
  "WON": { bg: "rgba(22, 163, 74, 0.12)", text: "#16A34A", hex: "#16A34A" },
  "LOST": { bg: "rgba(220, 38, 38, 0.12)", text: "#DC2626", hex: "#DC2626" },
  // Legacy / case-insensitive fallbacks
  "DESIGN CONCEPT": { bg: "rgba(79, 70, 229, 0.12)", text: "#4F46E5", hex: "#4F46E5" },
  "DESIGN CONCEPTS": { bg: "rgba(79, 70, 229, 0.12)", text: "#4F46E5", hex: "#4F46E5" },
  "BOQ APPROVAL": { bg: "rgba(124, 58, 237, 0.12)", text: "#7C3AED", hex: "#7C3AED" },
  "PROCUREMENT": { bg: "rgba(8, 145, 178, 0.12)", text: "#0891B2", hex: "#0891B2" },
};

/**
 * Extracts 3 uppercase alphabetic characters from the company name, fallback to PRJ.
 * Example: ASTERISKS.INC -> AST
 */
export function extractCompanyPrefix(companyName?: string | null): string {
  if (!companyName) return "PRJ";
  const clean = companyName.toUpperCase().replace(/[^A-Z]/g, "");
  if (clean.length >= 3) return clean.slice(0, 3);
  if (clean.length > 0) return clean.padEnd(3, "X");
  return "PRJ";
}

/**
 * Formats a company-specific, tenant-aware project code.
 * Example: AST-0000001
 */
export function formatProjectCode(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(7, "0")}`;
}

/**
 * Resolves designer name according to priority:
 * 1. Assigned designer
 * 2. Company name
 * 3. N/A
 */
export function resolveDesignerDisplay(
  assignedDesignerName?: string | null,
  companyName?: string | null
): string {
  const designer = assignedDesignerName?.trim();
  if (designer) return designer;
  const company = companyName?.trim();
  if (company) return company;
  return "N/A";
}

/**
 * Formats currency values in Indian numbering system (INR).
 * Example: 1250000 -> ₹12,50,000, 0 -> ₹0
 */
export function formatIndianCurrency(amount?: number | null, currency = "INR"): string {
  const val = Number(amount ?? 0);
  if (isNaN(val) || val <= 0) return "₹0";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(val).replace(/\s+/g, "");
  } catch {
    return `₹${Math.round(val).toLocaleString("en-IN")}`;
  }
}

/**
 * Centralized Project Stage Progress Calculation.
 * Maps current stage to progress percentage:
 * - WON / COMPLETED = 100%
 * - LOST = 0%
 * - Progression stages (excluding LOST) advance proportionally (100 / 7 = 14.2857% per stage).
 * Matches exact specification mapping:
 *   REQUIREMENT STATED: 14.29%
 *   ESTIMATE / BOQ SHARED: 28.57%
 *   NEGOTIATIONS: 42.86%
 *   DESIGN: 57.14%
 *   EXECUTIONS: 71.43%
 *   PROJECT HANDOVER: 85.71%
 *   WON: 100%
 *   LOST: 0%
 */
export function calculateStageProgress(
  currentStageNameOrId: string | null | undefined,
  stagesList?: Array<{
    id: string;
    name: string;
    sortOrder?: number;
    sort_order?: number;
    terminalType?: string | null;
    terminal_type?: string | null;
  }> | null
): number {
  if (!currentStageNameOrId) return 0;
  const raw = currentStageNameOrId.trim();
  const upper = raw.toUpperCase();

  // Terminal overrides
  if (upper === "WON" || upper === "COMPLETED" || upper.includes("WON") || upper.includes("COMPLETED")) {
    return 100;
  }
  if (upper === "LOST" || upper.includes("LOST") || upper.includes("CANCEL") || upper === "ON HOLD" || upper === "ON_HOLD") {
    return 0;
  }

  // Exact default stage percentage mapping
  if (upper === "REQUIREMENT STATED" || upper === "REQUIREMENT_STATED") return 14.29;
  if (upper === "ESTIMATE / BOQ SHARED" || upper === "ESTIMATE_BOQ_SHARED" || upper === "ESTIMATE/BOQ SHARED") return 28.57;
  if (upper === "NEGOTIATIONS" || upper === "NEGOTIATION") return 42.86;
  if (upper === "DESIGN") return 57.14;
  if (upper === "EXECUTIONS" || upper === "EXECUTION") return 71.43;
  if (upper === "PROJECT HANDOVER" || upper === "PROJECT_HANDOVER") return 85.71;

  // If stages list provided from Activities -> Stages
  if (Array.isArray(stagesList) && stagesList.length > 0) {
    const matched = stagesList.find(
      (s) => s.id === raw || s.name.toUpperCase() === upper
    );

    if (matched) {
      const term = (matched.terminalType || (matched as any).terminal_type || "").toLowerCase();
      if (term === "completed") return 100;
      if (term === "lost") return 0;

      const matchedNameUpper = matched.name.toUpperCase();
      if (matchedNameUpper === "REQUIREMENT STATED") return 14.29;
      if (matchedNameUpper === "ESTIMATE / BOQ SHARED") return 28.57;
      if (matchedNameUpper === "NEGOTIATIONS") return 42.86;
      if (matchedNameUpper === "DESIGN") return 57.14;
      if (matchedNameUpper === "EXECUTIONS") return 71.43;
      if (matchedNameUpper === "PROJECT HANDOVER") return 85.71;

      // Filter out terminal 'lost' stages to get active progression denominator
      const progressionStages = stagesList
        .filter((s) => {
          const t = (s.terminalType || (s as any).terminal_type || "").toLowerCase();
          const n = s.name.toUpperCase();
          return t !== "lost" && !NON_PROGRESS_STAGE_NAMES.includes(n);
        })
        .sort((a, b) => {
          const ordA = a.sortOrder ?? (a as any).sort_order ?? 0;
          const ordB = b.sortOrder ?? (b as any).sort_order ?? 0;
          return ordA - ordB;
        });

      const idx = progressionStages.findIndex((s) => s.id === matched.id);
      if (idx !== -1 && progressionStages.length > 0) {
        const step = (idx + 1) / progressionStages.length;
        return Number((step * 100).toFixed(2));
      }
    }
  }

  // Exact default stage match fallback
  const exactDefault = DEFAULT_PROJECT_STAGES.find(
    (s) => s.key === raw.toLowerCase() || s.name.toUpperCase() === upper
  );
  if (exactDefault) {
    return Number(exactDefault.defaultProgress.toFixed(2));
  }

  // Fuzzy match on default stages
  if (upper.includes("REQUIREMENT")) return 14.29;
  if (upper.includes("ESTIMATE") || upper.includes("BOQ SHARED") || upper.includes("BOQ APPROVAL")) return 28.57;
  if (upper.includes("NEGOTIATION")) return 42.86;
  if (upper.includes("DESIGN")) return 57.14;
  if (upper.includes("EXECUTION") || upper.includes("SITE") || upper.includes("PROCUREMENT")) return 71.43;
  if (upper.includes("HANDOVER")) return 85.71;

  return 0;
}

/**
 * Ensures progress is a safe whole integer (0..100) compatible with Postgres smallint / integer columns.
 * Prevents 22P02: invalid input syntax for type smallint.
 */
export function toDbProgress(progress: number | null | undefined): number {
  if (progress == null || isNaN(Number(progress))) return 0;
  return Math.min(100, Math.max(0, Math.round(Number(progress))));
}

/**
 * Resolves the canonical stage for a project given the workspace's stages.
 * Guaranteed to return a valid stage object or null.
 */
export function resolveProjectCanonicalStage<T extends { id: string; name: string }>(
  project: {
    currentStageId?: string | null;
    stageId?: string | null;
    stage?: string | null;
    workflowStage?: string | null;
    currentPhase?: string | null;
    tags?: string[] | null;
    metadata?: Record<string, unknown> | null;
  },
  stages: T[]
): T | null {
  if (!stages || stages.length === 0) return null;

  // 1. By currentStageId or stageId UUID match
  const rawId = project.currentStageId || project.stageId;
  if (rawId) {
    const found = stages.find((s) => s.id === rawId);
    if (found) return found;
  }

  // 2. By stage tag (e.g. stage:<uuid> or stage:<name>)
  const tagsList = Array.isArray(project.tags) ? project.tags : [];
  const stageTag = tagsList.find((t) => typeof t === "string" && t.startsWith("stage:"));
  if (stageTag) {
    const val = stageTag.slice(6).trim();
    const foundById = stages.find((s) => s.id === val);
    if (foundById) return foundById;
    const foundByName = stages.find((s) => s.name.toUpperCase() === val.toUpperCase());
    if (foundByName) return foundByName;
  }

  // 3. By stage name match
  const stageName = (
    project.stage ||
    project.workflowStage ||
    project.currentPhase ||
    (project.metadata?.stage as string) ||
    ""
  ).trim();
  if (stageName) {
    const foundByName = stages.find((s) => s.name.toUpperCase() === stageName.toUpperCase());
    if (foundByName) return foundByName;

    // Fuzzy / legacy normalized matching
    const upper = stageName.toUpperCase();
    if (upper.includes("DESIGN CONCEPT") || upper === "DESIGN_CONCEPT") {
      const designMatch = stages.find((s) => s.name.toUpperCase().includes("DESIGN"));
      if (designMatch) return designMatch;
    }
    if (upper.includes("BOQ") || upper.includes("ESTIMATE") || upper === "BOQ_APPROVAL") {
      const estMatch = stages.find((s) => s.name.toUpperCase().includes("ESTIMATE") || s.name.toUpperCase().includes("BOQ"));
      if (estMatch) return estMatch;
    }
    if (upper.includes("NEGOTIAT")) {
      const negMatch = stages.find((s) => s.name.toUpperCase().includes("NEGOTIAT"));
      if (negMatch) return negMatch;
    }
    if (upper.includes("EXECUTION") || upper.includes("SITE") || upper.includes("PROCUREMENT") || upper === "SITE_EXECUTION" || upper === "PROCUREMENT") {
      const execMatch = stages.find((s) => s.name.toUpperCase().includes("EXECUTION"));
      if (execMatch) return execMatch;
    }
    if (upper.includes("HANDOVER")) {
      const handMatch = stages.find((s) => s.name.toUpperCase().includes("HANDOVER"));
      if (handMatch) return handMatch;
    }
    if (upper.includes("WON") || upper.includes("COMPLETED")) {
      const wonMatch = stages.find((s) => s.name.toUpperCase() === "WON" || (s as any).terminal_type === "completed" || (s as any).terminalType === "completed");
      if (wonMatch) return wonMatch;
    }
    if (upper.includes("LOST")) {
      const lostMatch = stages.find((s) => s.name.toUpperCase() === "LOST" || (s as any).terminal_type === "lost" || (s as any).terminalType === "lost");
      if (lostMatch) return lostMatch;
    }
  }

  // 4. Fallback: Design Concepts / Design / first stage
  const fallbackDesign = stages.find((s) => s.name.toUpperCase().includes("DESIGN CONCEPTS") || s.name.toUpperCase().includes("DESIGN"));
  return fallbackDesign || stages[0] || null;
}

/**
 * Calculates overall Gross Margin percentage strictly from confirmed/approved BOQs.
 * Excludes draft, in-review, or rejected BOQs.
 * Formula: ((Total Confirmed Revenue - Total Confirmed Cost) / Total Confirmed Revenue) * 100
 * Returns null if no eligible confirmed BOQs exist.
 */
export function calculateConfirmedBoqMargin(
  confirmedBoqs: Array<{
    subtotal?: number | null;
    markupAmount?: number | null;
    selling?: number | null;
    revenue?: number | null;
    cost?: number | null;
    markupPercent?: number | null;
    markup_percent?: number | null;
  }>
): number | null {
  if (!confirmedBoqs || confirmedBoqs.length === 0) return null;

  let totalRevenue = 0;
  let totalCost = 0;

  for (const b of confirmedBoqs) {
    const cost = Number(b.cost ?? b.subtotal ?? 0);
    const markupPct = Number(b.markupPercent ?? b.markup_percent ?? 0);
    const markupAmt = b.markupAmount != null ? Number(b.markupAmount) : (cost * markupPct) / 100;
    const rev = Number(b.revenue ?? b.selling ?? (cost + markupAmt));

    if (rev > 0 || cost > 0) {
      totalRevenue += rev;
      totalCost += cost;
    }
  }

  if (totalRevenue <= 0) {
    return totalCost > 0 ? 0 : null;
  }

  const rawMargin = ((totalRevenue - totalCost) / totalRevenue) * 100;
  return Math.round(rawMargin * 10) / 10;
}
