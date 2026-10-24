"use client";

import { RecentLeadForm } from '@/lib/integrations/types';

interface Props {
    forms: RecentLeadForm[];
    integrationId?: string;
    onViewLeads?: (formId: string) => void;
}

function formatRelative(iso: string | null): string {
    if (!iso) return '—';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 60_000) return 'just now';
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
    if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
    const days = Math.floor(ms / 86_400_000);
    return days === 1 ? '1 day ago' : `${days} days ago`;
}

export default function RecentLeadFormsTable({ forms, onViewLeads }: Props) {
    if (!forms || forms.length === 0) {
        return (
            <div className="intg-table-card">
                <h3 className="intg-table-heading">Recent Lead Forms</h3>
                <div className="intg-table-empty">
                    <p>No recent lead forms found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="intg-table-card">
            <h3 className="intg-table-heading">Recent Lead Forms</h3>
            <div className="intg-table-responsive">
                <table className="intg-figma-table">
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
                        {forms.map((form) => {
                            const isPaused = form.status === 'paused';
                            return (
                                <tr key={form.id} className="intg-figma-row">
                                    <td className="intg-td intg-td-id">
                                        {form.id.length > 12 ? form.id.substring(0, 10) : form.id}
                                    </td>
                                    <td className="intg-td intg-td-form-name intg-td-project">
                                        {form.name}
                                    </td>
                                    <td className="intg-td intg-td-campaign">
                                        {form.campaignName || '—'}
                                    </td>
                                    <td className="intg-td intg-td-status">
                                        <span className={`intg-pill-status ${isPaused ? 'intg-pill-paused' : 'intg-pill-active'}`}>
                                            {form.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="intg-td intg-td-leads">
                                        {form.leadsThisMonth}
                                    </td>
                                    <td className="intg-td intg-td-last">
                                        {formatRelative(form.lastLeadAt)}
                                    </td>
                                    <td className="intg-td intg-td-actions">
                                        <button
                                            type="button"
                                            className="intg-link-action"
                                            onClick={() => onViewLeads && onViewLeads(form.id)}
                                        >
                                            View Leads
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
