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
  return fetchApi<Record<string, unknown>>(`/api/v1/project-templates/${id}/${section}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getTemplateVersions(id: string, page?: number) {
  const url = page
    ? `/api/v1/project-templates/${id}/versions?page=${page}`
    : `/api/v1/project-templates/${id}/versions`;
  return fetchApi<Record<string, unknown>>(url);
}

export async function getTemplateUsage(id: string, page?: number) {
  const url = page
    ? `/api/v1/project-templates/${id}/usage?page=${page}`
    : `/api/v1/project-templates/${id}/usage`;
  return fetchApi<Record<string, unknown>>(url);
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

export async function listProjectTemplates(params?: { search?: string; status?: string; type?: string; page?: number; pageSize?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.status) q.set('status', params.status);
  if (params?.type) q.set('type', params.type);
  if (params?.page) q.set('page', String(params.page));
  if (params?.pageSize) q.set('pageSize', String(params.pageSize));
  const qs = q.toString();
  return fetchApi<{ items: any[]; total: number; page: number; pageSize: number; hasMore: boolean }>(
    `/api/v1/project-templates${qs ? `?${qs}` : ''}`
  );
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

