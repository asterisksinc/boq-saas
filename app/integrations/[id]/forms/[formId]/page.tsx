"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Copy, ExternalLink, PauseCircle, PlayCircle, Search, Download } from 'lucide-react';
import DashboardRail from '@/components/DashboardRail';
import DashboardHeader from '@/components/DashboardHeader';
import { integrationsApi, IntegrationForm, IntegrationFormField, FormLead } from '@/lib/api/integrations';
import Pagination from '@/components/integrations/Pagination';
import IntegrationStatusBadge from '@/components/integrations/IntegrationStatusBadge';

export default function FormLeadsPage() {
    const router = useRouter();
    const params = useParams();
    const integrationId = params.id as string;
    const formId = params.formId as string;

    const [form, setForm] = useState<IntegrationForm | null>(null);
    const [leads, setLeads] = useState<FormLead[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const fields = form?.fields || [];
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const loadLeads = useCallback(async () => {
        setLoading(true);
        try {
            const res = await integrationsApi.listFormLeads(formId, { page, pageSize, search: search || undefined });
            setLeads(res.items || []);
            setTotal(res.total ?? 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [formId, page, pageSize, search]);

    useEffect(() => {
        integrationsApi.getForm(formId).then(setForm).catch(console.error);
    }, [formId]);

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    const handleCopyWebhook = () => {
        const url = `${window.location.origin}/api/v1/webhooks/${form?.publicToken}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePauseResume = async () => {
        if (!form) return;
        setActionLoading(true);
        try {
            if (form.status === 'paused') {
                const updated = await integrationsApi.resumeForm(formId);
                setForm(updated);
            } else {
                const updated = await integrationsApi.pauseForm(formId);
                setForm(updated);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await integrationsApi.exportFormLeads(formId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leads-${form?.name || 'export'}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed', err);
        }
    };

    return (
        <main className="fig-dashboard boq-dashboard">
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/integrations" />
            <div className="fig-dashboard-main">
                <DashboardHeader title="Integrations" />
                
                <div className="intg-detail-page">
                    <button className="intg-back-btn" onClick={() => router.push(`/integrations/${integrationId}`)}>
                        <ChevronLeft size={20} /> Back
                    </button>

                    {!form ? (
                        <div className="intg-skeleton intg-skeleton-header" />
                    ) : (
                        <header className="intg-detail-header">
                            <div className="intg-detail-header-left" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <h2>{form.name}</h2>
                                    <IntegrationStatusBadge status={form.status === 'active' ? 'connected' : form.status === 'paused' ? 'paused' : 'not_connected'} />
                                </div>
                                <div className="intg-webhook-url-display">
                                    <code className="intg-code-block">{`${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/webhooks/${form.publicToken}`}</code>
                                    <button className="intg-btn-icon" onClick={handleCopyWebhook} title="Copy Webhook URL">
                                        <Copy size={14} />
                                    </button>
                                    {copied && <span className="intg-copy-feedback">Copied!</span>}
                                </div>
                            </div>
                            <div className="intg-detail-header-actions">
                                <span className="intg-last-sync">● Last synced just now</span>
                                <button
                                    className="intg-btn intg-btn-outline"
                                    onClick={handlePauseResume}
                                    disabled={actionLoading}
                                >
                                    {form.status === 'paused' ? <><PlayCircle size={16}/> Resume Form</> : <><PauseCircle size={16}/> Pause Form</>}
                                </button>
                                <a href={`${typeof window !== 'undefined' ? window.location.origin : ''}/form/${form.publicToken}`} target="_blank" rel="noreferrer" className="intg-btn intg-btn-outline" title="Open Public Form">
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        </header>
                    )}

                    <div className="intg-table-container" style={{ marginTop: '24px' }}>
                        <div className="intg-table-header">
                            <h3>Captured Leads</h3>
                            <div className="intg-table-controls">
                                <div className="intg-search-bar">
                                    <Search size={16} className="intg-search-icon" />
                                    <input 
                                        type="text" 
                                        className="intg-input intg-search-input" 
                                        placeholder="Search leads by name..." 
                                        value={search}
                                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    />
                                </div>
                                <button className="intg-btn intg-btn-outline intg-export-btn" onClick={handleExport}>
                                    <Download size={16} /> Export Excel
                                </button>
                            </div>
                        </div>

                        {loading && leads.length === 0 ? (
                            <div className="intg-skeleton intg-skeleton-chart" style={{ height: '300px' }} />
                        ) : leads.length > 0 ? (
                            <>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="intg-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                {fields.map((f: IntegrationFormField) => (
                                                    <th key={f.id}>{f.name.toUpperCase()}</th>
                                                ))}
                                                <th>TIMESTAMP</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leads.map((lead: FormLead) => (
                                                <tr key={lead.id}>
                                                    <td>{lead.id.substring(0, 10)}</td>
                                                    {fields.map((f: IntegrationFormField) => (
                                                        <td key={f.id}>{String(lead.payload[f.name] ?? lead.payload[f.id] ?? '-')}</td>
                                                    ))}
                                                    <td>{new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(lead.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination 
                                    currentPage={page}
                                    totalPages={totalPages}
                                    totalItems={total}
                                    itemsPerPage={pageSize}
                                    onPageChange={setPage}
                                    onItemsPerPageChange={setPageSize}
                                />
                            </>
                        ) : (
                            <div className="intg-empty-state">No leads captured yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
