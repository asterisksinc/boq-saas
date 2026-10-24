"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Copy, ExternalLink, PauseCircle, PlayCircle, Search, Check, RefreshCw } from 'lucide-react';
import DashboardRail from '@/components/DashboardRail';
import DashboardHeader from '@/components/DashboardHeader';
import { integrationsApi, IntegrationForm, IntegrationFormField, FormLead } from '@/lib/api/integrations';
import Pagination from '@/components/integrations/Pagination';
import '../../../integrations.css';

/**
 * Format timestamp into Figma exact format: DD/MM/YYYY • HH:MM:SS
 */
function formatLeadTimestamp(iso: string | null | undefined): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return String(iso);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} • ${hours}:${minutes}:${seconds}`;
}

/**
 * Format relative time for last synced display
 */
function formatLastSynced(iso: string | null | undefined): string {
    if (!iso) return 'just now';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 0 || ms < 60_000) return 'just now';
    if (ms < 3_600_000) {
        const mins = Math.floor(ms / 60_000);
        return `${mins} min ago`;
    }
    if (ms < 86_400_000) {
        const hours = Math.floor(ms / 3_600_000);
        return `${hours}h ago`;
    }
    const days = Math.floor(ms / 86_400_000);
    return `${days}d ago`;
}

/**
 * Safe payload value resolver across varying field naming conventions
 */
function getFieldValue(payload: Record<string, unknown> | undefined, fieldName: string, fieldId?: string): string {
    if (!payload || typeof payload !== 'object') return '—';
    if (payload[fieldName] !== undefined && payload[fieldName] !== null && payload[fieldName] !== '') {
        return String(payload[fieldName]);
    }
    if (fieldId && payload[fieldId] !== undefined && payload[fieldId] !== null && payload[fieldId] !== '') {
        return String(payload[fieldId]);
    }
    const lowerName = fieldName.toLowerCase();
    const snakeName = lowerName.replace(/\s+/g, '_');
    if (payload[lowerName] !== undefined && payload[lowerName] !== null && payload[lowerName] !== '') {
        return String(payload[lowerName]);
    }
    if (payload[snakeName] !== undefined && payload[snakeName] !== null && payload[snakeName] !== '') {
        return String(payload[snakeName]);
    }
    return '—';
}

export default function FormLeadsPage() {
    const router = useRouter();
    const params = useParams();
    const integrationId = (params?.id as string) || '';
    const formId = (params?.formId as string) || '';

    const [form, setForm] = useState<IntegrationForm | null>(null);
    const [leads, setLeads] = useState<FormLead[]>([]);
    const [total, setTotal] = useState(0);
    const [loadingForm, setLoadingForm] = useState(true);
    const [loadingLeads, setLoadingLeads] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Toast auto-dismiss
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(timer);
    }, [toast]);

    // Load form details
    const loadForm = useCallback(async () => {
        if (!formId) return;
        setLoadingForm(true);
        setFormError(null);
        try {
            const data = await integrationsApi.getForm(formId);
            setForm(data);
        } catch (err) {
            console.error('Failed to load form details', err);
            setFormError(err instanceof Error ? err.message : 'Failed to load form details');
        } finally {
            setLoadingForm(false);
        }
    }, [formId]);

    // Load form captured leads
    const loadLeads = useCallback(async () => {
        if (!formId) return;
        setLoadingLeads(true);
        try {
            const res = await integrationsApi.listFormLeads(formId, {
                page,
                pageSize,
                search: search.trim() || undefined
            });
            setLeads(res.items || []);
            setTotal(res.total ?? 0);
        } catch (err) {
            console.error('Failed to load leads', err);
            setToast({ message: 'Failed to load captured leads', type: 'error' });
        } finally {
            setLoadingLeads(false);
        }
    }, [formId, page, pageSize, search]);

    useEffect(() => {
        loadForm();
    }, [loadForm]);

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    // Dynamic field list resolution
    const dynamicFields = useMemo(() => {
        if (form?.fields && form.fields.length > 0) {
            return form.fields.map((f: IntegrationFormField) => ({
                id: f.id,
                name: f.name
            }));
        }
        // Fallback: If form has no explicit schema declared yet, infer headers from leads payload
        if (leads.length > 0) {
            const detectedKeys = Array.from(new Set(leads.flatMap(l => Object.keys(l.payload || {}))));
            if (detectedKeys.length > 0) {
                return detectedKeys.map(k => ({ id: k, name: k }));
            }
        }
        // Minimal default fallback column
        return [{ id: 'lead_input', name: 'FIELD NAME' }];
    }, [form?.fields, leads]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Webhook URL string
    const webhookUrl = useMemo(() => {
        if (!form) return '';
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}/api/v1/webhooks/${form.publicToken}`;
    }, [form]);

    // Public form link
    const publicFormUrl = useMemo(() => {
        if (!form) return '#';
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}/form/${form.publicToken}`;
    }, [form]);

    // Handle copying Webhook URL
    const handleCopyWebhook = () => {
        if (!webhookUrl) return;
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setToast({ message: 'Webhook URL copied to clipboard', type: 'success' });
        setTimeout(() => setCopied(false), 2000);
    };

    // Handle Pause/Resume form state
    const handlePauseResume = async () => {
        if (!form) return;
        setActionLoading(true);
        try {
            if (form.status === 'paused') {
                const updated = await integrationsApi.resumeForm(formId);
                setForm(updated);
                setToast({ message: 'Form resumed successfully', type: 'success' });
            } else {
                const updated = await integrationsApi.pauseForm(formId);
                setForm(updated);
                setToast({ message: 'Form paused successfully', type: 'success' });
            }
        } catch (err) {
            console.error('Failed to toggle form state', err);
            setToast({ message: err instanceof Error ? err.message : 'Action failed', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Export leads to Excel/CSV
    const handleExport = async () => {
        if (exporting) return;
        setExporting(true);
        try {
            const blob = await integrationsApi.exportFormLeads(formId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const formSafeName = (form?.name || 'custom-form').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            a.download = `leads-${formSafeName}-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setToast({ message: 'Leads exported successfully', type: 'success' });
        } catch (err) {
            console.error('Export failed', err);
            setToast({ message: 'Failed to export leads', type: 'error' });
        } finally {
            setExporting(false);
        }
    };

    const isPaused = form?.status === 'paused';
    const latestLeadTime = leads[0]?.createdAt || form?.updatedAt;

    return (
        <main className="fig-dashboard">
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/integrations" />
            <div className="fig-dashboard-main">
                <DashboardHeader title="Integrations" />

                {/* Scoped fluid container eliminating right-side whitespace */}
                <div className="custom-form-page intg-detail-page">
                    {/* Toast Notification */}
                    {toast && (
                        <div className={`intg-toast intg-toast-${toast.type}`}>
                            {toast.message}
                        </div>
                    )}

                    {/* Back Navigation Button (Figma Frame 2147225070) */}
                    <button
                        type="button"
                        className="custom-form-back-btn intg-detail-back-btn"
                        onClick={() => {
                            if (typeof window !== 'undefined' && window.history.length > 1) {
                                router.back();
                            } else {
                                router.push(`/integrations/${integrationId}`);
                            }
                        }}
                    >
                        <ChevronLeft size={20} className="custom-form-back-icon" />
                        <span>Back</span>
                    </button>

                    {/* Form Details Section (Figma Frame 2147225066) */}
                    {loadingForm ? (
                        <div className="intg-skeleton intg-skeleton-header" style={{ height: '70px', borderRadius: '6px' }} />
                    ) : formError ? (
                        <div className="intg-table-card" style={{ padding: '24px', textAlign: 'center' }}>
                            <p style={{ color: '#EF4444', marginBottom: '12px' }}>{formError}</p>
                            <button
                                type="button"
                                className="custom-form-btn-white"
                                onClick={loadForm}
                                style={{ margin: '0 auto' }}
                            >
                                <RefreshCw size={16} /> Try Again
                            </button>
                        </div>
                    ) : form ? (
                        <header className="custom-form-header">
                            {/* Left: Title + Status Badge + Webhook URL */}
                            <div className="custom-form-header-left">
                                <div className="custom-form-title-row">
                                    <h2 className="custom-form-title">{form.name}</h2>
                                    <span
                                        className={`custom-form-status-badge ${
                                            isPaused ? 'custom-form-status-paused' : 'custom-form-status-active'
                                        }`}
                                    >
                                        {isPaused ? 'Paused' : 'Active'}
                                    </span>
                                </div>
                                <div className="custom-form-webhook-row">
                                    <span className="custom-form-webhook-url" title={webhookUrl}>
                                        {webhookUrl}
                                    </span>
                                    <button
                                        type="button"
                                        className="custom-form-copy-btn"
                                        onClick={handleCopyWebhook}
                                        title="Copy webhook URL"
                                        aria-label="Copy webhook URL"
                                    >
                                        {copied ? <Check size={16} color="#16A34A" /> : <Copy size={16} />}
                                    </button>
                                    {copied && (
                                        <span className="custom-form-copied-feedback">Copied!</span>
                                    )}
                                </div>
                            </div>

                            {/* Right: Last Synced + Pause Form + Open Public Form */}
                            <div className="custom-form-header-right">
                                <div className="custom-form-sync-indicator">
                                    <span
                                        className={`custom-form-sync-dot ${isPaused ? 'is-paused' : ''}`}
                                    />
                                    <span className="custom-form-sync-text">
                                        Last synced {formatLastSynced(latestLeadTime)}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="custom-form-btn-white"
                                    onClick={handlePauseResume}
                                    disabled={actionLoading}
                                >
                                    {isPaused ? (
                                        <>
                                            <PlayCircle size={20} />
                                            <span>Resume Form</span>
                                        </>
                                    ) : (
                                        <>
                                            <PauseCircle size={20} />
                                            <span>Pause Form</span>
                                        </>
                                    )}
                                </button>

                                <a
                                    href={publicFormUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="custom-form-ext-btn"
                                    title="Open Public Form"
                                    aria-label="Open Public Form"
                                >
                                    <ExternalLink size={20} />
                                </a>
                            </div>
                        </header>
                    ) : null}

                    {/* Captured Leads Panel (Figma Frame 2147225140) */}
                    <div className="custom-form-leads-panel">
                        {/* Toolbar: Heading + Search + Export (Figma Frame 2147225489) */}
                        <div className="custom-form-leads-toolbar">
                            <h3 className="custom-form-leads-title">Captured Leads</h3>

                            <div className="custom-form-leads-controls">
                                <div className="custom-form-search-box">
                                    <div className="custom-form-search-icon-box">
                                        <Search size={16} className="custom-form-search-icon" />
                                    </div>
                                    <input
                                        type="text"
                                        className="custom-form-search-input"
                                        placeholder="Search leads by name…"
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        aria-label="Search leads by name"
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="custom-form-export-btn"
                                    onClick={handleExport}
                                    disabled={exporting || total === 0}
                                >
                                    {exporting ? 'Exporting…' : 'Export Excel'}
                                </button>
                            </div>
                        </div>

                        {/* Leads Table (Device Management_iOS / Frame 57) */}
                        <div className="custom-form-table-wrap">
                            <table className="custom-form-table">
                                <thead>
                                    <tr className="custom-form-th-row">
                                        <th className="custom-form-th custom-form-th-id">ID</th>
                                        {dynamicFields.map((field) => (
                                            <th key={field.id} className="custom-form-th custom-form-th-field">
                                                {field.name.toUpperCase()}
                                            </th>
                                        ))}
                                        <th className="custom-form-th custom-form-th-time">TIMESTAMP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingLeads && leads.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={dynamicFields.length + 2}
                                                style={{ padding: '32px 16px' }}
                                            >
                                                <div
                                                    className="intg-skeleton"
                                                    style={{ height: '140px', width: '100%', borderRadius: '6px' }}
                                                />
                                            </td>
                                        </tr>
                                    ) : leads.length > 0 ? (
                                        leads.map((lead: FormLead) => {
                                            const displayId = lead.id.length > 10 ? lead.id.substring(0, 10) : lead.id;
                                            return (
                                                <tr key={lead.id} className="custom-form-tr">
                                                    <td className="custom-form-td custom-form-td-id" title={lead.id}>
                                                        {displayId}
                                                    </td>
                                                    {dynamicFields.map((field) => (
                                                        <td
                                                            key={field.id}
                                                            className="custom-form-td custom-form-td-field"
                                                            title={getFieldValue(lead.payload, field.name, field.id)}
                                                        >
                                                            {getFieldValue(lead.payload, field.name, field.id)}
                                                        </td>
                                                    ))}
                                                    <td className="custom-form-td custom-form-td-time">
                                                        {formatLeadTimestamp(lead.createdAt)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={dynamicFields.length + 2}
                                                className="custom-form-empty-leads"
                                            >
                                                {search.trim() ? (
                                                    <div>
                                                        <p style={{ margin: '0 0 8px 0' }}>
                                                            No leads found matching &ldquo;{search}&rdquo;.
                                                        </p>
                                                        <button
                                                            type="button"
                                                            className="custom-form-btn-white"
                                                            style={{ height: '36px', padding: '6px 14px', fontSize: '13px' }}
                                                            onClick={() => setSearch('')}
                                                        >
                                                            Clear Search
                                                        </button>
                                                    </div>
                                                ) : (
                                                    'No leads captured yet.'
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination (Figma Frame 2147225166) */}
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={total}
                            itemsPerPage={pageSize}
                            onPageChange={setPage}
                            onItemsPerPageChange={(newSize) => {
                                setPageSize(newSize);
                                setPage(1);
                            }}
                            totalLabel="Total Leads"
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
