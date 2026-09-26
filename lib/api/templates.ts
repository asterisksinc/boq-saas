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
