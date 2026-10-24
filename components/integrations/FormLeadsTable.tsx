"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { integrationsApi, FormWithStats } from '@/lib/api/integrations';
import FormEditModal from './FormEditModal';

function formatRelative(iso: string | null): string {
    if (!iso) return '—';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 60_000) return 'just now';
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
    if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
    const days = Math.floor(ms / 86_400_000);
    return days === 1 ? '1 day ago' : `${days} days ago`;
}

export default function FormLeadsTable({ integrationId }: { integrationId: string }) {
    const router = useRouter();
    const [forms, setForms] = useState<FormWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [editFormId, setEditFormId] = useState<string | null>(null);

    const loadForms = useCallback(async () => {
        setLoading(true);
        try {
            const res = await integrationsApi.listIntegrationForms(integrationId);
            setForms(res.items || []);
        } catch (err) {
            console.error("Failed to load forms", err);
        } finally {
            setLoading(false);
        }
    }, [integrationId]);

    useEffect(() => {
        loadForms();
    }, [loadForms]);

    if (loading) {
        return (
            <div className="intg-table-card intg-kpi-skeleton" style={{ height: '384px' }} />
        );
    }

    return (
        <div className="intg-table-card">
            {/* Table Heading */}
            <h3 className="intg-table-heading">Recent Lead Forms</h3>

            {/* Table Scrollable Container */}
            <div className="intg-table-responsive">
                <table className="intg-figma-table">
                    {/* Header matching Figma Frame 57 (#E4ECFB background, 36px height) */}
                    <thead>
                        <tr className="intg-figma-header-row">
                            <th className="intg-th intg-th-id">ID</th>
                            <th className="intg-th intg-th-form-name intg-th-project">
                                {/* Project / Form Name */}
                                FORM NAME
                            </th>
                            <th className="intg-th intg-th-campaign">Campaign</th>
                            <th className="intg-th intg-th-status">Status</th>
                            <th className="intg-th intg-th-leads">Leads (This Month)</th>
                            <th className="intg-th intg-th-last">Last Lead</th>
                            <th className="intg-th intg-th-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {forms.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="intg-table-empty">
                                    No lead forms found for this integration.
                                </td>
                            </tr>
                        ) : (
                            forms.map((row) => {
                                const isPaused = row.status === 'paused';
                                return (
                                    <tr key={row.id} className="intg-figma-row">
                                        <td className="intg-td intg-td-id">
                                            {row.id.length > 12 ? row.id.substring(0, 10) : row.id}
                                        </td>
                                        <td className="intg-td intg-td-form-name intg-td-project">
                                            {row.name}
                                        </td>
                                        <td className="intg-td intg-td-campaign">
                                            {row.campaignName || '—'}
                                        </td>
                                        <td className="intg-td intg-td-status">
                                            <span className={`intg-pill-status ${isPaused ? 'intg-pill-paused' : 'intg-pill-active'}`}>
                                                {row.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="intg-td intg-td-leads">
                                            {row.leadsThisMonth}
                                        </td>
                                        <td className="intg-td intg-td-last">
                                            {formatRelative(row.lastLeadAt)}
                                        </td>
                                        <td className="intg-td intg-td-actions">
                                            <div className="intg-row-actions">
                                                <button
                                                    type="button"
                                                    className="intg-link-action"
                                                    onClick={() => router.push(`/integrations/${integrationId}/forms/${row.id}`)}
                                                >
                                                    View Leads
                                                </button>
                                                <button
                                                    type="button"
                                                    className="intg-link-action-muted"
                                                    onClick={() => setEditFormId(row.id)}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal for editing form schema */}
            {editFormId && (
                <FormEditModal
                    formId={editFormId}
                    onClose={(updated) => {
                        setEditFormId(null);
                        if (updated) loadForms();
                    }}
                />
            )}
        </div>
    );
}
