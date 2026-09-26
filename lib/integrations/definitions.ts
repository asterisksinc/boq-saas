import { IntegrationDefinition, IntegrationCategory } from './types';

export const integrationDefinitions: IntegrationDefinition[] = [
    // Lead Source
    { provider: 'meta_lead_ads', title: 'Meta Lead Ads', description: 'Receive new leads from Facebook & Instagram Lead Ads to your BOQ SaaS Account', category: 'lead_source', iconPath: '/assets/integrations/meta.svg' },
    { provider: 'google_ads', title: 'Google Ads Lead Form Assets', description: 'Receive new leads from Google Ads Lead Form Assets to your BOQ SaaS Account', category: 'lead_source', iconPath: '/assets/integrations/google-ads.svg' },
    { provider: 'custom_website', title: 'Custom Website', description: 'Receive new leads using webhooks from your custom website to your BOQ SaaS Account', category: 'lead_source', iconPath: '/assets/integrations/custom-website.svg' },
    // Automation
    { provider: 'whatsapp', title: 'WhatsApp Automation', description: 'Send automated messages to your clients via WhatsApp from your BOQ SaaS Account', category: 'automation', iconPath: '/assets/integrations/whatsapp.svg' },
    { provider: 'email', title: 'Email Integration', description: 'Share files Proposal, Order Sheet & Invoice, etc. to your clients via Email from your BOQ SaaS Account', category: 'automation', iconPath: '/assets/integrations/email.svg' },
    // Payment
    { provider: 'razorpay', title: 'RazorPay Integration', description: 'Start receiving payments from your clients on the invoices created.', category: 'payment', iconPath: '/assets/integrations/razorpay.svg' },
];

export const categoryLabels: Record<IntegrationCategory, string> = {
    lead_source: 'Lead Source',
    automation: 'Automation',
    payment: 'Payment',
};

export const categoryOrder: IntegrationCategory[] = ['lead_source', 'automation', 'payment'];

export function getDefinition(provider: string): IntegrationDefinition | undefined {
    return integrationDefinitions.find(d => d.provider === provider);
}
