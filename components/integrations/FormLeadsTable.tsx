"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { integrationsApi, FormWithStats } from '@/lib/api/integrations';
import Pagination from './Pagination';

function formatRelative(iso: string | null): string {
    if (!iso) return '-';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 60_000) return 'just now';
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
    if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
    return `${Math.floor(ms / 86_400_000)} days ago`;
}

export default function FormLeadsTable({ integrationId }: { integrationId: string }) {
    const router = useRouter();
    const [forms, setForms] = useState<FormWithStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await integrationsApi.listIntegrationForms(integrationId);
                setForms(res.items || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [integrationId]);

    if (loading) {
        return <div className="intg-skeleton intg-skeleton-chart" style={{ height: '300px' }} />;
    }

    return (
        <div className="intg-table-container">
            <h3>Recent Lead Forms</h3>
            <table className="intg-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>FORM NAME</th>
                        <th>CAMPAIGN</th>
                        <th>STATUS</th>
                        <th>LEADS (THIS MONTH)</th>
                        <th>LAST LEAD</th>
                        <th>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {forms.length === 0 && (
                        <tr><td colSpan={7} className="intg-empty-state">No lead forms found.</td></tr>
                    )}
                    {forms.map(row => (
                        <tr key={row.id}>
                            <td>{row.id.substring(0, 10)}</td>
                            <td className="font-medium">{row.name}</td>
                            <td>{row.campaignName || '-'}</td>
                            <td>
                                <span className={`intg-status-chip intg-status-${row.status}`}>
                                    {row.status.toUpperCase()}
                                </span>
                            </td>
                            <td>{row.leadsThisMonth}</td>
                            <td>{formatRelative(row.lastLeadAt)}</td>
                            <td>
                                <button 
                                    className="intg-action-link"
                                    onClick={() => router.push(`/integrations/${integrationId}/forms/${row.id}`)}
                                >
                                    View Leads
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
