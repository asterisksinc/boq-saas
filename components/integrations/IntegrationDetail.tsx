"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, PauseCircle, PlayCircle, Plus } from 'lucide-react';
import { IntegrationDetailData } from '@/lib/integrations/types';
import { integrationsApi } from '@/lib/api/integrations';
import { getDefinition } from '@/lib/integrations/definitions';
import IntegrationStatusBadge from './IntegrationStatusBadge';
import LeadDashboard from './LeadDashboard';
import PaymentDashboard from './PaymentDashboard';
import IntegrationModal from './IntegrationModal';

function formatTimeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 60_000) return 'just now';
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
    if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
    return `${Math.floor(ms / 86_400_000)}d ago`;
}

export default function IntegrationDetail({ id }: { id: string }) {
    const router = useRouter();
    const [data, setData] = useState<IntegrationDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showNewFormModal, setShowNewFormModal] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await integrationsApi.get(id) as unknown as IntegrationDetailData;
            if (res) setData(res);
        } catch (error) {
            console.error('Failed to load integration detail', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handlePauseResume = async () => {
        if (!data) return;
        setActionLoading(true);
        try {
            if (data.integration.status === 'paused') {
                await integrationsApi.resume(id);
                setToast({ message: 'Integration resumed', type: 'success' });
            } else {
                await integrationsApi.pause(id);
                setToast({ message: 'Integration paused', type: 'success' });
            }
            await loadData();
        } catch (err) {
            setToast({ message: err instanceof Error ? err.message : 'Action failed', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect this integration?')) return;
        setActionLoading(true);
        try {
            await integrationsApi.disconnect(id);
            setToast({ message: 'Integration disconnected', type: 'success' });
            await loadData();
        } catch (err) {
            setToast({ message: err instanceof Error ? err.message : 'Disconnect failed', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    if (loading || !data) {
        return (
            <div className="intg-detail-page">
                <div className="intg-skeleton intg-skeleton-header" />
                <div className="intg-summary-grid">
                    {[0, 1, 2, 3].map(i => <div key={i} className="intg-skeleton intg-skeleton-kpi" />)}
                </div>
                <div className="intg-skeleton intg-skeleton-chart" style={{ height: '400px' }} />
            </div>
        );
    }

    const { integration } = data;
    const def = getDefinition(integration.provider);
    const isCustomWebsite = integration.provider === 'custom_website';
    const isRazorpay = integration.provider === 'razorpay';

    return (
        <div className="intg-detail-page">
            {toast && (
                <div className={`intg-toast intg-toast-${toast.type}`}>
                    {toast.message}
                </div>
            )}

            <button className="intg-back-btn" onClick={() => router.push('/integrations')}>
                <ChevronLeft size={20} /> Back to Integrations
            </button>

            <header className="intg-detail-header">
                <div className="intg-detail-header-left">
                    {def && <img src={def.iconPath} alt={def.title} className="intg-detail-icon" />}
                    <div>
                        <h2>{isCustomWebsite ? 'Custom Website Form' : isRazorpay ? 'Razor Pay Integration' : integration.name}</h2>
                        <div className="intg-detail-header-meta">
                            <IntegrationStatusBadge status={integration.status} />
                            {def && <span className="intg-detail-desc">{def.description}</span>}
                        </div>
                    </div>
                </div>
                <div className="intg-detail-header-actions">
                    {integration.lastSyncedAt && (
                        <span className="intg-last-sync">Last synced {formatTimeAgo(integration.lastSyncedAt)}</span>
                    )}
                    {(integration.status as string) !== 'disconnected' && (
                        <>
                            <button
                                className="intg-btn intg-btn-outline"
                                onClick={handlePauseResume}
                                disabled={actionLoading}
                            >
                                {integration.status === 'paused'
                                    ? <><PlayCircle size={16}/> Resume</>
                                    : <><PauseCircle size={16}/> Pause</>}
                            </button>
                            <button
                                className="intg-btn intg-btn-outline"
                                onClick={handleDisconnect}
                                disabled={actionLoading}
                                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            >
                                Disconnect
                            </button>
                            {isCustomWebsite && (
                                <button 
                                    className="intg-btn intg-btn-primary intg-new-form-btn"
                                    onClick={() => setShowNewFormModal(true)}
                                >
                                    <Plus size={16} /> New Custom Form
                                </button>
                            )}
                        </>
                    )}
                </div>
            </header>

            {isCustomWebsite && <LeadDashboard integrationId={id} data={data} />}
            {isRazorpay && <PaymentDashboard integrationId={id} />}
            {!isCustomWebsite && !isRazorpay && (
                <div className="intg-empty-state">Integration dashboard not configured for this provider.</div>
            )}

            {showNewFormModal && (
                <IntegrationModal 
                    provider={integration.provider} 
                    onClose={(success) => {
                        setShowNewFormModal(false);
                        if (success) loadData();
                    }} 
                />
            )}
        </div>
    );
}
