"use client";

import { useState } from 'react';
import DashboardRail from '@/components/DashboardRail';
import DashboardHeader from '@/components/DashboardHeader';
import IntegrationOverview from '@/components/integrations/IntegrationOverview';
import './integrations.css';

export default function IntegrationsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <main className="fig-dashboard">
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/integrations" />
            <div className="fig-dashboard-main">
                <DashboardHeader title="Integrations" onSearch={setSearchQuery} />
                <IntegrationOverview searchQuery={searchQuery} />
            </div>
        </main>
    );
}
