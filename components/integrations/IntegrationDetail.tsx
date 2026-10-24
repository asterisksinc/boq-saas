"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PauseCircle, PlayCircle, Plus } from 'lucide-react';
import { IntegrationDetailData } from '@/lib/integrations/types';
import { integrationsApi } from '@/lib/api/integrations';
import { getDefinition } from '@/lib/integrations/definitions';
import LeadDashboard from './LeadDashboard';
import PaymentDashboard from './PaymentDashboard';
import IntegrationModal from './IntegrationModal';
import DisconnectModal from './DisconnectModal';

function formatTimeAgo(iso: string | null | undefined): string {
    if (!iso) return 'Never synced';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 60_000) return 'just now';
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
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
    const [showDisconnectModal, setShowDisconnectModal] = useState(false);

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
                setToast({ message: 'Integration resumed successfully', type: 'success' });
            } else {
                await integrationsApi.pause(id);
                setToast({ message: 'Integration paused successfully', type: 'success' });
            }
            await loadData();
        } catch (err) {
            setToast({ message: err instanceof Error ? err.message : 'Action failed', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setActionLoading(true);
        try {
            await integrationsApi.disconnect(id);
            setToast({ message: 'Integration disconnected', type: 'success' });
            setShowDisconnectModal(false);
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
                <div className="intg-detail-skeleton-header" />
                <div className="intg-detail-summary-grid">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="intg-kpi-card intg-kpi-skeleton" style={{ height: '120px' }}>
                            <div className="intg-skeleton-line intg-skeleton-title" />
                            <div className="intg-skeleton-line intg-skeleton-value" />
                            <div className="intg-skeleton-line intg-skeleton-sub" />
                        </div>
                    ))}
                </div>
                <div className="intg-skeleton-chart" style={{ height: '335px', marginTop: '16px' }} />
            </div>
        );
    }

    const { integration } = data;
    const def = getDefinition(integration.provider);
    const isGoogleAds = integration.provider === 'google_ads';
    const isCustomWebsite = integration.provider === 'custom_website';
    const isRazorpay = integration.provider === 'razorpay';
    const isLeadSource = isGoogleAds || isCustomWebsite || integration.provider === 'meta_lead_ads';

    const getDisplayName = () => {
        if (isGoogleAds) return 'Google Ads Lead Forms';
        if (isCustomWebsite) return 'Custom Website Form';
        if (isRazorpay) return 'Razorpay Integration';
        return integration.name || def?.title || 'Integration';
    };

    const getDescription = () => {
        if (isGoogleAds) return 'Receive leads from Google Ads lead form assets in your workspace.';
        if (isCustomWebsite) return 'Receive new leads using webhooks from your custom website to your BOQ SaaS Account';
        if (isRazorpay) return 'Start receiving payments from your clients on the invoices created.';
        return def?.description || '';
    };

    const getStatusLabel = () => {
        if (integration.status === 'connected') return 'Connected';
        if (integration.status === 'paused') return 'Paused';
        if (integration.status === 'connecting') return 'Connecting';
        if (integration.status === 'error') return 'Error';
        return 'Not Connected';
    };

    return (
        <div 
            className={`intg-detail-page ${isRazorpay ? 'razorpay-integration-page' : ''}`}
            data-provider={integration.provider}
        >
            {toast && (
                <div className={`intg-toast intg-toast-${toast.type}`}>
                    {toast.message}
                </div>
            )}

            {/* Figma Frame 2147225070 - Back Button */}
            <button 
                type="button"
                className="intg-detail-back-btn" 
                onClick={() => {
                    if (typeof window !== 'undefined' && window.history.length > 1) {
                        router.back();
                    } else {
                        router.push('/integrations');
                    }
                }}
            >
                <ArrowLeft size={16} />
                <span>Back</span>
            </button>

            {/* Figma Frame 2147225066 - Identity Header */}
            <header className="intg-detail-identity-header">
                <div className="intg-detail-identity-left">
                    <div className="intg-detail-icon-wrap">
                        {def && <img src={def.iconPath} alt={def.title} className="intg-detail-icon-img" />}
                    </div>
                    <div className="intg-detail-identity-info">
                        <div className="intg-detail-title-row">
                            <h2 className="intg-detail-title">{getDisplayName()}</h2>
                            <span className={`intg-detail-status-pill intg-detail-status-${integration.status}`}>
                                {getStatusLabel()}
                            </span>
                        </div>
                        <p className="intg-detail-subtitle">{getDescription()}</p>
                    </div>
                </div>

                <div className="intg-detail-identity-right">
                    <div className="intg-detail-sync-status">
                        <span className={`intg-detail-sync-dot intg-detail-sync-${integration.status}`} />
                        <span className="intg-detail-sync-text">
                            Last synced {formatTimeAgo(integration.lastSyncedAt)}
                        </span>
                    </div>

                    {(integration.status as string) !== 'disconnected' && (
                        <div className="intg-detail-action-buttons">
                            <button
                                type="button"
                                className="intg-detail-btn-pause"
                                onClick={handlePauseResume}
                                disabled={actionLoading}
                            >
                                {integration.status === 'paused' ? (
                                    <>
                                        <PlayCircle size={18} />
                                        <span>Resume Integration</span>
                                    </>
                                ) : (
                                    <>
                                        <PauseCircle size={18} />
                                        <span>Pause Integration</span>
                                    </>
                                )}
                            </button>

                            {isCustomWebsite ? (
                                <button 
                                    type="button"
                                    className="intg-btn intg-btn-primary intg-detail-btn-primary intg-new-form-btn"
                                    onClick={() => setShowNewFormModal(true)}
                                >
                                    <Plus size={16} />
                                    <span>New Custom Form</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="intg-detail-btn-disconnect"
                                    onClick={() => setShowDisconnectModal(true)}
                                    disabled={actionLoading}
                                >
                                    Disconnect
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Integration Specific Dashboard Content */}
            {isLeadSource && <LeadDashboard integrationId={id} data={data} />}
            {isRazorpay && <PaymentDashboard integrationId={id} />}
            {!isLeadSource && !isRazorpay && (
                <div className="intg-empty-state">Integration dashboard not configured for this provider.</div>
            )}

            {/* Custom Website Modal */}
            {showNewFormModal && (
                <IntegrationModal 
                    provider={integration.provider} 
                    onClose={(success) => {
                        setShowNewFormModal(false);
                        if (success) loadData();
                    }} 
                />
            )}

            {/* Disconnect Confirmation Modal */}
            {showDisconnectModal && (
                <DisconnectModal
                    title={getDisplayName()}
                    loading={actionLoading}
                    onConfirm={handleDisconnect}
                    onCancel={() => setShowDisconnectModal(false)}
                />
            )}
        </div>
    );
}
