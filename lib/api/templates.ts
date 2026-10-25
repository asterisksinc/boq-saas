import { getApiErrorMessage, parseApiResponse } from './auth';

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers ?? {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(getApiErrorMessage(payload));
  return parseApiResponse<T>(payload);
}

export async function getTemplate(id: string) {
  return fetchApi<Record<string, unknown>>(`/api/v1/project-templates/${id}`);
}

export async function getTemplateSection(id: string, section: string) {
  return fetchApi<Record<string, unknown>>(`/api/v1/project-templates/${id}/${section}`);
}

export async function updateTemplateSection(id: string, section: string, data: Record<string, unknown>) {
  const payload = 'data' in data ? data : { data };
  return fetchApi<Record<string, unknown>>(`/api/v1/project-templates/${id}/${section}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function updateTemplateDocuments(id: string, documents: any[]) {
  return fetchApi<Record<string, unknown>>(`/api/v1/project-templates/${id}/documents`, {
    method: 'PATCH',
    body: JSON.stringify({ documents }),
  });
}

export interface TemplateVersionRecord {
  id: string;
  version: number;
  versionLabel: string;
  status: "DRAFT" | "PUBLISHED" | "SUPERSEDED" | "ARCHIVED" | string;
  summaryTitle: string;
  summarySubtitle: string;
  changeNote?: string | null;
  createdBy: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  publishedBy?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  publishedAt?: string | null;
  projectsCount?: number;
  changesCount?: number;
  impact?: "HIGH" | "MEDIUM" | "LOW" | string;
  snapshot?: any;
}

export interface TemplateVersionStats {
  totalVersions: number;
  publishedCount: number;
  currentVersion: string;
  activeDraft: string | null;
  activeDraftUpdatedAt: string | null;
  projectsUsing: number;
}

export interface TemplateVersionsResponse {
  items: TemplateVersionRecord[];
  stats: TemplateVersionStats;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface TemplateVersionFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  myChanges?: boolean;
}

export async function getTemplateVersions(
  id: string,
  params?: TemplateVersionFilterParams | number
): Promise<TemplateVersionsResponse> {
  if (typeof params === "number") {
    return fetchApi<TemplateVersionsResponse>(
      `/api/v1/project-templates/${id}/versions?page=${params}`
    );
  }
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.pageSize) q.set("pageSize", String(params.pageSize));
  if (params?.search) q.set("search", params.search);
  if (params?.status && params.status !== "all") q.set("status", params.status);
  if (params?.myChanges) q.set("myChanges", "true");
  const qs = q.toString();
  return fetchApi<TemplateVersionsResponse>(
    `/api/v1/project-templates/${id}/versions${qs ? `?${qs}` : ""}`
  );
}

export async function createTemplateVersion(
  id: string,
  data: {
    versionLabel?: string;
    summaryTitle: string;
    summarySubtitle?: string;
    changeNote?: string;
    isDraft?: boolean;
    impact?: string;
  }
) {
  return fetchApi<Record<string, unknown>>(
    `/api/v1/project-templates/${id}/versions`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export interface TemplateUsageFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  version?: string;
  range?: string;
  fromDate?: string;
  toDate?: string;
  exportFormat?: string;
}

export interface TemplateUsageRecord {
  id: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  clientName: string;
  status: string;
  displayStatus: string;
  progress: number;
  templateVersion: string;
  rawVersion: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  usageSource: string;
  modifications: "AS-IS" | "MINOR" | "MAJOR";
}

export interface TemplateUsageStats {
  totalProjects: number;
  projectsCreated: number;
  projectsCreatedTrend: string;
  activeProjects: number;
  activeProjectsPercent: number;
  completedProjects: number;
  completedProjectsPercent: number;
  onHoldProjects: number;
  cancelledProjects: number;
  versionsUsed: number;
  latestVersion: string;
  healthScore: number;
  healthIndicators: {
    strongAdoption: boolean;
    latestVersionAdopted: boolean;
    lowModification: boolean;
    olderVersionCount: number;
  };
  postCreationModifications: {
    asIs: { count: number; percent: number };
    minor: { count: number; percent: number };
    major: { count: number; percent: number };
  };
  reusabilityScore: number;
  reusabilityEligibleCount: number;
  reusabilityNoMajorCount: number;
  statusDistribution: Array<{
    status: string;
    label: string;
    count: number;
    percent: number;
    color: string;
  }>;
  versionAdoption: Array<{
    version: string;
    rawVersion: string;
    count: number;
    percent: number;
  }>;
  olderVersionProjectsCount: number;
  monthlyTrends: Array<{
    month: string;
    created: number;
    active: number;
    completed: number;
  }>;
}

export interface TemplateUsageResponse {
  items: TemplateUsageRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  stats?: TemplateUsageStats;
}

export async function getTemplateUsage(
  id: string,
  options?: number | TemplateUsageFilterParams
): Promise<TemplateUsageResponse> {
  const params: TemplateUsageFilterParams = typeof options === 'number' ? { page: options } : options || {};
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  if (params.search) q.set('search', params.search);
  if (params.status) q.set('status', params.status);
  if (params.version) q.set('version', params.version);
  if (params.range) q.set('range', params.range);
  if (params.fromDate) q.set('fromDate', params.fromDate);
  if (params.toDate) q.set('toDate', params.toDate);
  if (params.exportFormat) q.set('export', params.exportFormat);
  const qs = q.toString();
  return fetchApi<TemplateUsageResponse>(`/api/v1/project-templates/${id}/usage${qs ? `?${qs}` : ''}`);
}

export interface TemplateActivityActor {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  initials: string;
}

export interface TemplateActivityScopeBadge {
  label: string;
  type: "category" | "sub";
}

export interface TemplateActivityChangeItem {
  label: string;
  count: number;
  icon: string;
}

export interface TemplateActivityDetails {
  action: string;
  previous: string;
  newVal: string;
  changesIncluded: TemplateActivityChangeItem[];
  reason: string;
  versionLabel: string;
}

export interface TemplateActivityRecord {
  id: string;
  action: string;
  createdAt: string;
  timeLabel: string;
  dateGroup: string;
  category: "changes" | "publishing" | "usage" | "access" | "system" | string;
  statusPill: string;
  statusPillType: "success" | "warning" | "info" | "neutral" | string;
  markerColor: "green" | "amber" | "blue" | "purple" | string;
  actor: TemplateActivityActor;
  title: string;
  description: string;
  diff?: {
    rateSource?: string;
    rateValue?: string;
  } | null;
  actionLink: {
    label: string;
    href: string;
  };
  scopeBadges: TemplateActivityScopeBadge[];
  details: TemplateActivityDetails;
}

export interface TemplateActivityGroup {
  label: string;
  items: TemplateActivityRecord[];
}

export interface TemplateActivityStats {
  totalEvents: number;
  changesThisWeek: number;
  contributors: number;
  publishedChanges: number;
}

export interface TemplateActivityFilterParams {
  search?: string;
  category?: string;
  sort?: "newest" | "oldest" | string;
  dateRange?: string;
  page?: number;
  pageSize?: number;
  exportFormat?: "csv";
}

export interface TemplateActivityResponse {
  items: TemplateActivityRecord[];
  groups: TemplateActivityGroup[];
  stats: TemplateActivityStats;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function getTemplateActivity(
  id: string,
  options?: number | TemplateActivityFilterParams
): Promise<TemplateActivityResponse> {
  const params: TemplateActivityFilterParams = typeof options === 'number' ? { page: options } : options || {};
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  if (params.search) q.set('search', params.search);
  if (params.category && params.category !== 'all') q.set('category', params.category);
  if (params.sort) q.set('sort', params.sort);
  if (params.dateRange && params.dateRange !== 'all') q.set('dateRange', params.dateRange);
  if (params.exportFormat) q.set('export', params.exportFormat);
  const qs = q.toString();
  return fetchApi<TemplateActivityResponse>(`/api/v1/project-templates/${id}/activity${qs ? `?${qs}` : ''}`);
}

export async function publishTemplate(id: string) {
  return fetchApi<Record<string, unknown>>(`/api/v1/project-templates/${id}/publish`, {
    method: 'POST',
  });
}

export async function getTemplatesOverview() {
  return fetchApi<{
    total: number;
    active: number;
    draft: number;
    needsReview: number;
    byType: Record<string, number>;
    recentlyUsed: any[];
    projectTemplatesCount?: number;
    boqTemplatesCount?: number;
    documentTemplatesCount?: number;
    recentlyUpdatedCount?: number;
    mostUsedProject?: string | null;
    mostUsedBoq?: string | null;
    mostUsedDoc?: string | null;
    lastUpdatedName?: string | null;
  }>('/api/v1/project-templates/overview');
}

export async function listProjectTemplates(params?: { search?: string; status?: string; type?: string; region?: string; visibility?: string; page?: number; pageSize?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.status) q.set('status', params.status);
  if (params?.type) q.set('type', params.type);
  if (params?.region) q.set('region', params.region);
  if (params?.visibility) q.set('visibility', params.visibility);
  if (params?.page) q.set('page', String(params.page));
  if (params?.pageSize) q.set('pageSize', String(params.pageSize));
  const qs = q.toString();
  return fetchApi<{ items: any[]; total: number; page: number; pageSize: number; hasMore: boolean }>(
    `/api/v1/project-templates${qs ? `?${qs}` : ''}`
  );
}

export async function updateProjectTemplate(id: string, data: Record<string, unknown>) {
  return fetchApi<Record<string, unknown>>(`/api/v1/project-templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function createProjectTemplate(data: Record<string, unknown>) {
  return fetchApi<Record<string, unknown>>('/api/v1/project-templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function duplicateProjectTemplate(id: string) {
  return fetchApi<Record<string, unknown>>(`/api/v1/project-templates/${id}/duplicate`, {
    method: 'POST',
  });
}

export async function archiveProjectTemplate(id: string) {
  return fetchApi<Record<string, unknown>>(`/api/v1/project-templates/${id}`, {
    method: 'DELETE',
  });
}

export async function restoreProjectTemplate(id: string) {
  return fetchApi<Record<string, unknown>>(`/api/v1/project-templates/${id}/restore`, {
    method: 'POST',
  });
}

export async function deleteProjectTemplatePermanently(id: string) {
  return fetchApi<Record<string, unknown>>(`/api/v1/project-templates/${id}/permanent`, {
    method: 'DELETE',
  });
}

export async function useProjectTemplate(id: string, payload: Record<string, unknown>) {
  return fetchApi<Record<string, unknown>>(`/api/v1/project-templates/${id}/use`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadTemplateImage(file: File) {
  const form = new FormData();
  form.append('file', file);
  return fetchApi<{ url: string; storagePath?: string }>('/api/v1/project-templates/upload-image', {
    method: 'POST',
    body: form,
  });
}

export async function testWorkflowRule(templateId: string, rule: Record<string, unknown>, payload: Record<string, unknown>) {
  return fetchApi<{
    matched: boolean;
    summary: string;
    conditionResults: Array<{
      field: string;
      operator: string;
      expected: unknown;
      actual: unknown;
      passed: boolean;
    }>;
    executedActions: Array<Record<string, unknown>>;
  }>(`/api/v1/project-templates/${templateId}/workflow/rules/test`, {
    method: 'POST',
    body: JSON.stringify({ rule, payload }),
  });
}

