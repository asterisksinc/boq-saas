"use client";

import { ChevronRight } from 'lucide-react';
import { IntegrationDefinition, Integration } from '@/lib/integrations/types';
import IntegrationStatusBadge from './IntegrationStatusBadge';

interface Props {
    definition: IntegrationDefinition;
    integration?: Integration;
    onConnect: (provider: string) => void;
    onDisconnect: (integrationId: string) => void;
    onClick: () => void;
}

export default function IntegrationCard({ definition, integration, onConnect, onDisconnect, onClick }: Props) {
    const isConnected = integration?.status === 'connected';

    return (
        <div className="intg-card" onClick={onClick}>
            <div className="intg-card-header">
                <div className="intg-icon-wrapper">
                    <img src={definition.iconPath} alt={definition.title} />
                </div>
                <div className="intg-card-header-right">
                    <IntegrationStatusBadge status={integration?.status || 'not_connected'} />
                    <button className="intg-card-arrow"><ChevronRight size={20} /></button>
                </div>
            </div>
            <div className="intg-card-body">
                <h3>{definition.title}</h3>
                <p>{definition.description}</p>
            </div>
            <div className="intg-card-footer">
                {isConnected ? (
                    <button 
                        className="intg-btn intg-btn-disconnect" 
                        onClick={(e) => { e.stopPropagation(); onDisconnect(integration!.id); }}
                    >
                        Disconnect
                    </button>
                ) : (
                    <button 
                        className="intg-btn intg-btn-connect" 
                        onClick={(e) => { e.stopPropagation(); onConnect(definition.provider); }}
                    >
                        Connect
                    </button>
                )}
            </div>
        </div>
    );
}
