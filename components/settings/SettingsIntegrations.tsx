"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { integrationDefinitions } from "@/lib/integrations/definitions";
import { Integration, IntegrationProvider } from "@/lib/integrations/types";
import { integrationsApi } from "@/lib/api/integrations";
import IntegrationCard from "@/components/integrations/IntegrationCard";
import IntegrationModal from "@/components/integrations/IntegrationModal";

interface SettingsIntegrationsProps {
    showNotice?: (message: string, type?: "success" | "error") => void;
    userRole?: string;
}

export default function SettingsIntegrations({
    showNotice,
    userRole,
}: SettingsIntegrationsProps) {
    const router = useRouter();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const canManage = !userRole || ["owner", "admin"].includes(userRole);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await integrationsApi.list();
            setIntegrations(res.items || []);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unable to load integrations.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleConnect = (provider: string) => {
        if (!canManage) {
            showNotice?.("Only owners and admins can connect integrations.", "error");
            return;
        }
        setSelectedProvider(provider as IntegrationProvider);
        setModalOpen(true);
    };

    const handleDisconnect = async (id: string, name: string) => {
        if (!canManage) {
            showNotice?.("Only owners and admins can disconnect integrations.", "error");
            return;
        }
        if (!confirm(`Are you sure you want to disconnect ${name}?`)) {
            return;
        }

        setActionLoadingId(id);
        try {
            await integrationsApi.disconnect(id);
            showNotice?.(`${name} disconnected successfully.`, "success");
            await loadData();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : `Failed to disconnect ${name}.`;
            showNotice?.(msg, "error");
        } finally {
            setActionLoadingId(null);
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
        if (success) {
            showNotice?.("Integration connected successfully.", "success");
            loadData();
        }
    };

    if (loading) {
        return (
            <div className="intg-grid" aria-label="Loading integrations">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="intg-card intg-card-skeleton">
                        <div className="intg-card-header">
                            <div className="intg-card-header-main">
                                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0 }} />
                                <div className="intg-card-meta" style={{ flex: 1 }}>
                                    <div className="skeleton" style={{ width: "65%", height: 16, borderRadius: 4, marginBottom: 8 }} />
                                    <div className="skeleton" style={{ width: "35%", height: 12, borderRadius: 4 }} />
                                </div>
                            </div>
                            <div className="skeleton" style={{ width: 20, height: 20, borderRadius: 4 }} />
                        </div>
                        <div className="intg-card-body">
                            <div className="skeleton" style={{ width: "100%", height: 14, borderRadius: 4, marginBottom: 8 }} />
                            <div className="skeleton" style={{ width: "80%", height: 14, borderRadius: 4 }} />
                        </div>
                        <div className="intg-card-footer">
                            <div className="skeleton" style={{ width: "100%", height: 38, borderRadius: 8 }} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="intg-error-container" role="alert">
                <AlertCircle size={28} className="text-red" />
                <div className="intg-error-info">
                    <h3>Unable to load integrations</h3>
                    <p>{error}</p>
                </div>
                <button type="button" className="btn-secondary" onClick={loadData}>
                    <RefreshCw size={15} />
                    <span>Try Again</span>
                </button>
            </div>
        );
    }

    if (integrationDefinitions.length === 0) {
        return (
            <div className="intg-empty-container">
                <h3>No Integrations Available</h3>
                <p>There are no integrations configured for this workspace at the moment.</p>
            </div>
        );
    }

    return (
        <div className="settings-integrations-wrap">
            <div className="intg-grid">
                {integrationDefinitions.map((def) => {
                    const integration = integrations.find((i) => i.provider === def.provider);
                    const isActionLoading = actionLoadingId === integration?.id;

                    return (
                        <IntegrationCard
                            key={def.provider}
                            definition={def}
                            integration={integration}
                            onConnect={handleConnect}
                            onDisconnect={() => handleDisconnect(integration!.id, def.title)}
                            onClick={() => handleCardClick(def.provider, integration?.id)}
                            actionLoading={isActionLoading}
                            disabled={!canManage}
                        />
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
