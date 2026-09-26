"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { integrationDefinitions, categoryLabels, categoryOrder } from '@/lib/integrations/definitions';
import { IntegrationSummary, Integration, IntegrationProvider } from '@/lib/integrations/types';
import { integrationsApi } from '@/lib/api/integrations';
import IntegrationSummaryCards from './IntegrationSummaryCards';
import IntegrationSection from './IntegrationSection';
import IntegrationCard from './IntegrationCard';
import IntegrationModal from './IntegrationModal';

export default function IntegrationOverview() {
    const router = useRouter();
    const [summary, setSummary] = useState<IntegrationSummary | null>(null);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [sumRes, listRes] = await Promise.all([
                integrationsApi.summary(),
                integrationsApi.list()
            ]);
            setSummary(sumRes);
            setIntegrations(listRes.items || []);
        } catch (error) {
            console.error('Failed to load integrations', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleConnect = (provider: string) => {
        setSelectedProvider(provider as IntegrationProvider);
        setModalOpen(true);
    };

    const handleDisconnect = async (id: string) => {
        if (!confirm('Are you sure you want to disconnect?')) return;
        try {
            await integrationsApi.disconnect(id);
            loadData();
        } catch (error) {
            console.error('Failed to disconnect', error);
        }
    };

    const handleCardClick = (provider: string, integrationId?: string) => {
        if (integrationId) {
            router.push(`/integrations/${integrationId}`);
        } else {
            handleConnect(provider);
        }
    };

    const handleModalClose = (success?: boolean) => {
        setModalOpen(false);
        setSelectedProvider(null);
        if (success) loadData();
    };

    return (
        <div className="intg-overview">
            <IntegrationSummaryCards summary={summary} />
            
            <div className="intg-lists">
                {categoryOrder.map(category => {
                    const defs = integrationDefinitions.filter(d => d.category === category);
                    if (defs.length === 0) return null;
                    return (
                        <IntegrationSection key={category} title={categoryLabels[category]} category={category}>
                            {defs.map(def => {
                                const integration = integrations.find(i => i.provider === def.provider);
                                return (
                                    <IntegrationCard
                                        key={def.provider}
                                        definition={def}
                                        integration={integration}
                                        onConnect={handleConnect}
                                        onDisconnect={handleDisconnect}
                                        onClick={() => handleCardClick(def.provider, integration?.id)}
                                    />
                                );
                            })}
                        </IntegrationSection>
                    );
                })}
            </div>

            {modalOpen && selectedProvider && (
                <IntegrationModal 
                    provider={selectedProvider} 
                    onClose={handleModalClose} 
                />
            )}
        </div>
    );
}
