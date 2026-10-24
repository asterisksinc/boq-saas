"use client";

import { ArrowUp, ArrowDown } from 'lucide-react';
import { IntegrationDetailData } from '@/lib/integrations/types';
import IntegrationAnalytics from './IntegrationAnalytics';
import FormLeadsTable from './FormLeadsTable';

interface Props {
    integrationId: string;
    data: IntegrationDetailData;
}

export default function LeadDashboard({ integrationId, data }: Props) {
    const {
        leadForms,
        leadFormsActive,
        leadsThisMonth,
        leadsThisMonthChange,
        leadsToday,
        leadsTodayChange,
        failedDeliveries,
        failedDeliveriesChange
    } = data;

    return (
        <div className="intg-lead-dashboard">
            {/* Figma Frame 2147225138: 4 Summary KPI Cards */}
            <div className="intg-detail-summary-grid">
                {/* Card 1: Lead Forms (Frame 93) */}
                <div className="intg-detail-kpi-card">
                    <span className="intg-detail-kpi-label">Lead Forms</span>
                    <strong className="intg-detail-kpi-value">{leadForms}</strong>
                    <div className="intg-detail-kpi-trend">
                        <span className="intg-detail-status-pill intg-detail-status-connected">
                            {leadFormsActive > 0 ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                {/* Card 2: Leads (This Month) (Frame 2147225074) */}
                <div className="intg-detail-kpi-card">
                    <span className="intg-detail-kpi-label">Leads (This Month)</span>
                    <strong className="intg-detail-kpi-value">{leadsThisMonth}</strong>
                    <div className="intg-detail-kpi-trend">
                        <div className={`intg-trend-indicator ${leadsThisMonthChange >= 0 ? 'intg-trend-positive' : 'intg-trend-negative'}`}>
                            {leadsThisMonthChange >= 0 ? (
                                <ArrowUp size={14} className="intg-trend-icon" />
                            ) : (
                                <ArrowDown size={14} className="intg-trend-icon" />
                            )}
                            <span className="intg-trend-val">
                                {leadsThisMonthChange >= 0 ? '+' : ''}{leadsThisMonthChange}%
                            </span>
                        </div>
                        <span className="intg-trend-context">vs last month</span>
                    </div>
                </div>

                {/* Card 3: Leads Today (Frame 2147225075) */}
                <div className="intg-detail-kpi-card">
                    <span className="intg-detail-kpi-label">Leads Today</span>
                    <strong className="intg-detail-kpi-value">{leadsToday}</strong>
                    <div className="intg-detail-kpi-trend">
                        <div className={`intg-trend-indicator ${leadsTodayChange >= 0 ? 'intg-trend-positive' : 'intg-trend-negative'}`}>
                            {leadsTodayChange >= 0 ? (
                                <ArrowUp size={14} className="intg-trend-icon" />
                            ) : (
                                <ArrowDown size={14} className="intg-trend-icon" />
                            )}
                            <span className="intg-trend-val">
                                {leadsTodayChange >= 0 ? '+' : ''}{leadsTodayChange}%
                            </span>
                        </div>
                        <span className="intg-trend-context">vs yesterday</span>
                    </div>
                </div>

                {/* Card 4: Failed Deliveries (Frame 2147225078) */}
                <div className="intg-detail-kpi-card">
                    <span className="intg-detail-kpi-label">Failed Deliveries</span>
                    <strong className="intg-detail-kpi-value">{failedDeliveries}</strong>
                    <div className="intg-detail-kpi-trend">
                        <div className={`intg-trend-indicator ${failedDeliveriesChange <= 0 ? 'intg-trend-positive' : 'intg-trend-negative'}`}>
                            {failedDeliveriesChange <= 0 ? (
                                <ArrowDown size={14} className="intg-trend-icon" />
                            ) : (
                                <ArrowUp size={14} className="intg-trend-icon" />
                            )}
                            <span className="intg-trend-val">
                                {failedDeliveriesChange > 0 ? `+${failedDeliveriesChange}` : failedDeliveriesChange}
                            </span>
                        </div>
                        <span className="intg-trend-context">vs last month</span>
                    </div>
                </div>
            </div>

            {/* Figma Frame 2147224997: Analytics Row */}
            <IntegrationAnalytics integrationId={integrationId} />

            {/* Figma Frame 2147225140: Recent Lead Forms Table */}
            <FormLeadsTable integrationId={integrationId} />
        </div>
    );
}
