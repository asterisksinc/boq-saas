"use client";

import { IntegrationSummary } from '@/lib/integrations/types';

export default function IntegrationSummaryCards({ summary }: { summary: IntegrationSummary | null }) {
    if (!summary) return <div className="intg-summary-skeletons"><div className="intg-skeleton-card"/><div className="intg-skeleton-card"/><div className="intg-skeleton-card"/><div className="intg-skeleton-card"/></div>;

    return (
        <div className="intg-summary-grid">
            <div className="intg-kpi-card">
                <span className="intg-kpi-label">ACTIVE INTEGRATIONS</span>
                <strong className="intg-kpi-value">{summary.activeIntegrations}</strong>
                <span className="intg-kpi-sub">of {summary.totalIntegrations} connected</span>
            </div>
            <div className="intg-kpi-card">
                <span className="intg-kpi-label">LEADS CAPTURED</span>
                <strong className="intg-kpi-value text-blue">{summary.leadsCaptured}</strong>
                <span className="intg-kpi-sub">this month</span>
            </div>
            <div className="intg-kpi-card">
                <span className="intg-kpi-label">LEADS TODAY</span>
                <strong className="intg-kpi-value text-blue">{summary.leadsToday}</strong>
                <span className="intg-kpi-sub">{summary.leadsTodayChangePercent >= 0 ? '+' : ''}{summary.leadsTodayChangePercent}% vs yesterday</span>
            </div>
            <div className="intg-kpi-card">
                <span className="intg-kpi-label">FAILED DELIVERIES</span>
                <strong className="intg-kpi-value text-red">{summary.failedDeliveries}</strong>
                <span className="intg-kpi-sub">requires attention</span>
            </div>
        </div>
    );
}
