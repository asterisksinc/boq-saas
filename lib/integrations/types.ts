export type IntegrationProvider = 'meta_lead_ads' | 'google_ads' | 'custom_website' | 'whatsapp' | 'email' | 'razorpay';
export type IntegrationStatus = 'not_connected' | 'connecting' | 'connected' | 'paused' | 'error';
export type IntegrationCategory = 'lead_source' | 'automation' | 'payment';
export type FormFieldType = 'short_answer' | 'long_answer' | 'dropdown' | 'checkbox' | 'link';

export interface IntegrationDefinition {
    provider: IntegrationProvider;
    title: string;
    description: string;
    category: IntegrationCategory;
    iconPath: string;
}

export interface Integration {
    id: string;
    provider: IntegrationProvider;
    name: string;
    status: IntegrationStatus;
    config: Record<string, unknown>;
    connectedAt: string | null;
    lastSyncedAt: string | null;
}

export interface IntegrationSummary {
    activeIntegrations: number;
    totalIntegrations: number;
    leadsCaptured: number;
    leadsToday: number;
    leadsTodayChangePercent: number;
    failedDeliveries: number;
}

export interface CustomFormField {
    id: string;
    name: string;
    type: FormFieldType;
    required: boolean;
    position: number;
    config: Record<string, unknown>;
}

export interface IntegrationForm {
    id: string;
    integrationId: string;
    name: string;
    publicToken: string;
    campaignId: string | null;
    campaignName: string | null;
    status: 'active' | 'paused' | 'archived';
    fields: CustomFormField[];
    createdAt: string;
}

export interface LeadTimeSeriesPoint {
    date: string;
    leads: number;
}

export interface LeadSourceBreakdown {
    label: string;
    value: number;
    percentage: number;
}

export interface IntegrationAnalytics {
    leadsOverTime: LeadTimeSeriesPoint[];
    leadSourceBreakdown: LeadSourceBreakdown[];
    totalLeads: number;
}

export interface IntegrationDetailData {
    integration: Integration;
    leadForms: number;
    leadFormsActive: number;
    leadsThisMonth: number;
    leadsThisMonthChange: number;
    leadsToday: number;
    leadsTodayChange: number;
    failedDeliveries: number;
    failedDeliveriesChange: number;
}

export type IntegrationFlowStep = null | 'webhook_setup' | 'form_details' | 'add_field' | 'edit_field' | 'success';

export interface RecentLeadForm {
    id: string;
    name: string;
    campaignName: string | null;
    status: 'active' | 'paused' | 'archived';
    leadsThisMonth: number;
    lastLeadAt: string | null;
}
