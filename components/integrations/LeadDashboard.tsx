"use client";

import { IntegrationDetailData } from '@/lib/integrations/types';
import IntegrationAnalytics from './IntegrationAnalytics';
import FormLeadsTable from './FormLeadsTable';

interface Props {
    integrationId: string;
    data: IntegrationDetailData;
}

export default function LeadDashboard({ integrationId, data }: Props) {
    const { leadForms, leadFormsActive, leadsThisMonth, leadsThisMonthChange, leadsToday, leadsTodayChange, failedDeliveries, failedDeliveriesChange } = data;

    return (
        <div className="intg-lead-dashboard">
            <div className="intg-summary-grid">
                <div className="intg-kpi-card">
                    <span className="intg-kpi-label">LEAD FORMS</span>
                    <strong className="intg-kpi-value">{leadForms}</strong>
                    <span className="intg-kpi-sub">{leadFormsActive} active</span>
                </div>
                <div className="intg-kpi-card">
                    <span className="intg-kpi-label">LEADS THIS MONTH</span>
                    <strong className="intg-kpi-value text-blue">{leadsThisMonth}</strong>
                    <span className="intg-kpi-sub">{leadsThisMonthChange >= 0 ? '+' : ''}{leadsThisMonthChange}% vs last month</span>
                </div>
                <div className="intg-kpi-card">
                    <span className="intg-kpi-label">LEADS TODAY</span>
                    <strong className="intg-kpi-value text-blue">{leadsToday}</strong>
                    <span className="intg-kpi-sub">{leadsTodayChange >= 0 ? '+' : ''}{leadsTodayChange}% vs yesterday</span>
                </div>
                <div className="intg-kpi-card">
                    <span className="intg-kpi-label">FAILED DELIVERIES</span>
                    <strong className="intg-kpi-value text-red">{failedDeliveries}</strong>
                    <span className="intg-kpi-sub">{failedDeliveriesChange >= 0 ? '+' : ''}{failedDeliveriesChange}% vs last month</span>
                </div>
            </div>

            <IntegrationAnalytics integrationId={integrationId} />
            
            <FormLeadsTable integrationId={integrationId} />
        </div>
    );
}
