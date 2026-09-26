"use client";

import { use } from 'react';
import DashboardRail from '@/components/DashboardRail';
import DashboardHeader from '@/components/DashboardHeader';
import IntegrationDetail from '@/components/integrations/IntegrationDetail';

export default function IntegrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <main className="fig-dashboard boq-dashboard">
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/integrations" />
            <div className="fig-dashboard-main">
                <DashboardHeader title="Integration Detail" />
                <IntegrationDetail id={id} />
            </div>
        </main>
    );
}
