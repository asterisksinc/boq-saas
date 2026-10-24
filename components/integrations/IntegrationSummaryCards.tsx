"use client";

import { IntegrationSummary } from '@/lib/integrations/types';

interface Props {
    summary: IntegrationSummary | null;
    totalSupported?: number;
    loading?: boolean;
}

export default function IntegrationSummaryCards({
    summary,
    totalSupported = 6,
    loading = false,
}: Props) {
    if (loading || !summary) {
        return (
            <div className="intg-summary-grid" aria-label="Loading integration summary metrics">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="intg-kpi-card intg-kpi-skeleton">
                        <div className="intg-skeleton-line intg-skeleton-title" />
                        <div className="intg-skeleton-line intg-skeleton-value" />
                        <div className="intg-skeleton-line intg-skeleton-sub" />
                    </div>
                ))}
            </div>
        );
    }

    const totalCount = totalSupported || summary.totalIntegrations || 6;
    const leadsTodayChange = summary.leadsTodayChangePercent ?? 0;
    const changeSign = leadsTodayChange > 0 ? "+" : "";
    const failedDeliveries = summary.failedDeliveries ?? 0;

    return (
        <div className="intg-summary-grid" role="region" aria-label="Integrations summary metrics">
            {/* Card 1: Active Integrations */}
            <div className="intg-kpi-card">
                <span className="intg-kpi-label">ACTIVE INTEGRATIONS</span>
                <strong className="intg-kpi-value intg-val-active">{summary.activeIntegrations}</strong>
                <span className="intg-kpi-sub">of {totalCount} connected</span>
            </div>

            {/* Card 2: Leads Captured */}
            <div className="intg-kpi-card">
                <span className="intg-kpi-label">LEADS CAPTURED</span>
                <strong className="intg-kpi-value intg-val-captured">{summary.leadsCaptured}</strong>
                <span className="intg-kpi-sub">this month</span>
            </div>

            {/* Card 3: Leads Today */}
            <div className="intg-kpi-card">
                <span className="intg-kpi-label">LEADS TODAY</span>
                <strong className="intg-kpi-value intg-val-today">{summary.leadsToday}</strong>
                <span className="intg-kpi-sub">
                    {leadsTodayChange !== 0 ? `${changeSign}${leadsTodayChange}% vs yesterday` : "+0% vs yesterday"}
                </span>
            </div>

            {/* Card 4: Failed Deliveries */}
            <div className="intg-kpi-card">
                <span className="intg-kpi-label">Failed Deliveries</span>
                <strong className="intg-kpi-value intg-val-failed">{failedDeliveries}</strong>
                <span className="intg-kpi-sub">
                    {failedDeliveries > 0 ? "requires attention" : "no issues reported"}
                </span>
            </div>
        </div>
    );
}
