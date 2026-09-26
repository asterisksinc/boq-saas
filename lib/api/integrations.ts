import { parseApiResponse, getApiErrorMessage } from './auth';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(getApiErrorMessage(payload));
  return parseApiResponse<T>(payload);
}

export type IntegrationProvider = 'meta_lead_ads' | 'google_ads' | 'custom_website' | 'whatsapp' | 'email' | 'razorpay';
export type IntegrationStatus = 'not_connected' | 'connecting' | 'connected' | 'paused' | 'error';
export type FormFieldType = 'short_answer' | 'long_answer' | 'dropdown' | 'checkbox' | 'link';

export type Integration = {
  id: string;
  workspaceId: string;
  provider: IntegrationProvider;
  name: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type IntegrationSummary = {
  activeIntegrations: number;
  totalIntegrations: number;
  leadsCaptured: number;
  leadsToday: number;
  leadsTodayChangePercent: number;
  failedDeliveries: number;
};

export type IntegrationFormField = {
  id: string;
  formId: string;
  name: string;
  fieldType: FormFieldType;
  required: boolean;
  position: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type IntegrationForm = {
  id: string;
  workspaceId: string;
  integrationId: string;
  name: string;
  publicToken: string;
  campaignId: string | null;
  campaignName: string | null;
  status: 'active' | 'paused' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  fields?: IntegrationFormField[];
};

export type IntegrationLead = {
  id: string;
  workspaceId: string;
  integrationId: string;
  formId: string | null;
  campaignId: string | null;
  sourceProvider: string;
  payload: Record<string, unknown>;
  status: 'delivered' | 'failed' | 'pending';
  errorMessage: string | null;
  createdAt: string;
};

export type IntegrationAnalytics = {
  leadsOverTime: { date: string; count: number }[];
  leadSourceBreakdown: { source: string; count: number }[];
  totalLeads: number;
};

export type CreateFormInput = {
  integrationId: string;
  name: string;
  campaignId?: string;
  campaignName?: string;
  fields: { name: string; fieldType: FormFieldType; required?: boolean; position?: number; config?: Record<string, unknown> }[];
};

export type UpdateFormInput = {
  name?: string;
  campaignId?: string | null;
  campaignName?: string | null;
  status?: 'active' | 'paused' | 'archived';
  fields?: { id?: string; name: string; fieldType: FormFieldType; required?: boolean; position?: number; config?: Record<string, unknown> }[];
};

export type FormLead = { id: string; formId: string; payload: Record<string, unknown>; status: string; createdAt: string; };
export type FormWithStats = { id: string; name: string; publicToken: string; campaignName: string | null; status: string; leadsThisMonth: number; lastLeadAt: string | null; };
export type PaymentSummaryData = { accountReceived: number; amountDue: number; totalPending: number; failedPayments: number; currency: string; accountReceivedChange: number; amountDueChange: number; totalPendingChange: number; failedPaymentsChange: number; };
export type PaymentAnalyticsData = { paymentOverview: { date: string; received: number; due: number; pending: number; }[]; statusBreakdown: { successful: number; pending: number; failed: number; total: number; }; currency: string; };
export type Transaction = { id: string; paymentId: string; projectName: string; projectCode: string; boqRef: string; invoiceNumber: string; amount: number; currency: string; clientName: string; method: string; timestamp: string; status: string; };

export const integrationsApi = {
  list: () => request<{ items: Integration[] }>('/api/v1/integrations'),
  summary: () => request<IntegrationSummary>('/api/v1/integrations/summary'),
  get: (id: string) => request<Integration>(`/api/v1/integrations/${id}`),
  connect: (input: { provider: IntegrationProvider; config?: Record<string, unknown> }) => request<Integration>('/api/v1/integrations/connect', { method: 'POST', body: JSON.stringify(input) }),
  disconnect: (id: string) => request<{ success: boolean }>(`/api/v1/integrations/${id}/disconnect`, { method: 'POST' }),
  pause: (id: string) => request<Integration>(`/api/v1/integrations/${id}/pause`, { method: 'POST' }),
  resume: (id: string) => request<Integration>(`/api/v1/integrations/${id}/resume`, { method: 'POST' }),
  analytics: (id: string, period?: string) => request<IntegrationAnalytics>(`/api/v1/integrations/${id}/analytics${period ? `?period=${period}` : ''}`),
  
  listForms: () => request<{ items: IntegrationForm[] }>('/api/v1/integrations/forms'),
  getForm: (formId: string) => request<IntegrationForm>(`/api/v1/integrations/forms/${formId}`),
  createForm: (input: CreateFormInput) => request<IntegrationForm>('/api/v1/integrations/forms', { method: 'POST', body: JSON.stringify(input) }),
  updateForm: (formId: string, input: UpdateFormInput) => request<IntegrationForm>(`/api/v1/integrations/forms/${formId}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteForm: (formId: string) => request<{ deleted: boolean }>(`/api/v1/integrations/forms/${formId}`, { method: 'DELETE' }),
  
  // New Form Endpoints
  listFormLeads: (formId: string, params?: { page?: number; pageSize?: number; search?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    if (params?.search) sp.set("search", params.search);
    const q = sp.toString();
    return request<{ items: FormLead[], page: number, pageSize: number, total: number, hasMore: boolean }>(`/api/v1/integrations/forms/${formId}/leads${q ? `?${q}` : ""}`);
  },
  pauseForm: (formId: string) => request<IntegrationForm>(`/api/v1/integrations/forms/${formId}/pause`, { method: 'POST' }),
  resumeForm: (formId: string) => request<IntegrationForm>(`/api/v1/integrations/forms/${formId}/resume`, { method: 'POST' }),
  exportFormLeads: async (formId: string) => {
    const response = await fetch(`/api/v1/integrations/forms/${formId}/export`, { credentials: 'include' });
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  },

  // Integration Detail Lists
  listIntegrationForms: (integrationId: string) => request<{ items: FormWithStats[] }>(`/api/v1/integrations/${integrationId}/forms`),
  
  // Payment Integrations
  paymentSummary: (integrationId: string) => request<PaymentSummaryData>(`/api/v1/integrations/${integrationId}/payment-summary`),
  paymentAnalytics: (integrationId: string, period?: string) => request<PaymentAnalyticsData>(`/api/v1/integrations/${integrationId}/payment-analytics${period ? `?period=${period}` : ''}`),
  transactions: (integrationId: string, params?: { page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    const q = sp.toString();
    return request<{ items: Transaction[], page: number, pageSize: number, total: number, hasMore: boolean }>(`/api/v1/integrations/${integrationId}/transactions${q ? `?${q}` : ""}`);
  },
};
