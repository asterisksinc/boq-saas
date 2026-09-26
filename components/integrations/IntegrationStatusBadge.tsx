"use client";

import { IntegrationStatus } from '@/lib/integrations/types';

export default function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
    const isConnected = status === 'connected';
    return (
        <div className={`intg-status-badge ${isConnected ? 'intg-status-connected' : 'intg-status-disconnected'}`}>
            <span className="intg-status-dot"></span>
            {isConnected ? 'Connected' : 'Not Connected'}
        </div>
    );
}
