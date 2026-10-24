"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, RefreshCw, SearchX } from 'lucide-react';
import { dashboardIntegrationDefinitions, categoryLabels, categoryOrder } from '@/lib/integrations/definitions';
import { IntegrationSummary, Integration, IntegrationProvider } from '@/lib/integrations/types';
import { integrationsApi } from '@/lib/api/integrations';
import IntegrationSummaryCards from './IntegrationSummaryCards';
import IntegrationSection from './IntegrationSection';
import IntegrationCard from './IntegrationCard';
import IntegrationModal from './IntegrationModal';
import DisconnectModal from './DisconnectModal';

interface Props {
    searchQuery?: string;
}

export default function IntegrationOverview({ searchQuery = "" }: Props) {
    const router = useRouter();
    const [summary, setSummary] = useState<IntegrationSummary | null>(null);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
    const [disconnectTarget, setDisconnectTarget] = useState<{ id: string; name: string } | null>(null);
    const [disconnecting, setDisconnecting] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Notification toast
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [sumRes, listRes] = await Promise.all([
                integrationsApi.summary(),
                integrationsApi.list()
            ]);
            setSummary(sumRes);
            setIntegrations(listRes.items || []);
        } catch (err: unknown) {
            console.error('Failed to load integrations', err);
            const msg = err instanceof Error ? err.message : 'Failed to load integration data.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleConnect = (provider: IntegrationProvider) => {
        setSelectedProvider(provider);
    };

    const handleOpenDisconnect = (id: string, name: string) => {
        setDisconnectTarget({ id, name });
    };

    const handleConfirmDisconnect = async () => {
        if (!disconnectTarget) return;
        setDisconnecting(true);
        setActionLoadingId(disconnectTarget.id);
        try {
            await integrationsApi.disconnect(disconnectTarget.id);
            showToast(`${disconnectTarget.name} disconnected successfully.`, 'success');
            setDisconnectTarget(null);
            await loadData();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : `Failed to disconnect ${disconnectTarget.name}.`;
            showToast(msg, 'error');
        } finally {
            setDisconnecting(false);
            setActionLoadingId(null);
        }
    };

    const handleCardClick = (provider: string, integrationId?: string) => {
        if (integrationId) {
            router.push(`/integrations/${integrationId}`);
        } else {
            handleConnect(provider as IntegrationProvider);
        }
    };

    const handleModalClose = (success?: boolean) => {
        const providerName = selectedProvider ? selectedProvider.replace(/_/g, ' ') : 'Integration';
        setSelectedProvider(null);
        if (success) {
            showToast(`${providerName} connected successfully!`, 'success');
            loadData();
        }
    };

    // Filter definitions by search query
    const filteredDefinitions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return dashboardIntegrationDefinitions;
        return dashboardIntegrationDefinitions.filter(
            (def) =>
                def.title.toLowerCase().includes(query) ||
                def.description.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    // Check if any matching results
    const hasResults = filteredDefinitions.length > 0;

    return (
        <div className="intg-overview">
            {/* Toast feedback banner */}
            {toast && (
                <div className={`intg-toast-banner intg-toast-${toast.type}`} role="status">
                    {toast.type === 'success' ? (
                        <CheckCircle2 size={18} className="intg-toast-icon" />
                    ) : (
                        <AlertCircle size={18} className="intg-toast-icon" />
                    )}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Error state banner */}
            {error && (
                <div className="intg-error-banner" role="alert">
                    <AlertCircle size={20} className="text-red-600" />
                    <div className="intg-error-text">
                        <strong>Error loading integration data</strong>
                        <p>{error}</p>
                    </div>
                    <button type="button" className="intg-btn-retry" onClick={loadData}>
                        <RefreshCw size={14} />
                        <span>Retry</span>
                    </button>
                </div>
            )}

            {/* KPI Summary Cards */}
            <IntegrationSummaryCards
                summary={summary}
                totalSupported={dashboardIntegrationDefinitions.length}
                loading={loading}
            />

            {/* Search Empty State */}
            {!hasResults && searchQuery.trim() !== '' && (
                <div className="intg-empty-state">
                    <div className="intg-empty-icon-wrap">
                        <SearchX size={32} />
                    </div>
                    <h3 className="intg-empty-title">No integrations found</h3>
                    <p className="intg-empty-desc">
                        No integrations match your search query &quot;<strong>{searchQuery}</strong>&quot;.
                    </p>
                </div>
            )}

            {/* Categories & Integration Cards */}
            {hasResults && (
                <div className="intg-lists">
                    {categoryOrder.map((category) => {
                        const defs = filteredDefinitions.filter((d) => d.category === category);
                        if (defs.length === 0) return null;

                        return (
                            <IntegrationSection
                                key={category}
                                title={categoryLabels[category]}
                                category={category}
                            >
                                {defs.map((def) => {
                                    const integration = integrations.find(
                                        (i) => i.provider === def.provider
                                    );
                                    return (
                                        <IntegrationCard
                                            key={def.provider}
                                            definition={def}
                                            integration={integration}
                                            onConnect={handleConnect}
                                            onDisconnect={handleOpenDisconnect}
                                            onClick={() => handleCardClick(def.provider, integration?.id)}
                                            actionLoading={actionLoadingId === integration?.id}
                                        />
                                    );
                                })}
                            </IntegrationSection>
                        );
                    })}
                </div>
            )}

            {/* Connect Modal */}
            {selectedProvider && (
                <IntegrationModal
                    provider={selectedProvider}
                    onClose={handleModalClose}
                />
            )}

            {/* Disconnect Confirmation Modal */}
            {disconnectTarget && (
                <DisconnectModal
                    title={disconnectTarget.name}
                    loading={disconnecting}
                    onConfirm={handleConfirmDisconnect}
                    onCancel={() => !disconnecting && setDisconnectTarget(null)}
                />
            )}
        </div>
    );
}
