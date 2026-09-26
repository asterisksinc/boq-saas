"use client";

import { RecentLeadForm } from '@/lib/integrations/types';

interface Props {
    forms: RecentLeadForm[];
}

export default function RecentLeadFormsTable({ forms }: Props) {
    if (!forms || forms.length === 0) {
        return (
            <div className="intg-empty-table">
                <p>No recent lead forms found.</p>
            </div>
        );
    }

    return (
        <div className="intg-table-wrapper">
            <h3 className="intg-table-title">Recent Lead Forms</h3>
            <table className="intg-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>PROJECT/FORM</th>
                        <th>CAMPAIGN</th>
                        <th>STATUS</th>
                        <th>LEADS (THIS MONTH)</th>
                        <th>LAST LEAD</th>
                        <th>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {forms.map(form => (
                        <tr key={form.id}>
                            <td className="intg-muted">#{form.id}</td>
                            <td><strong>{form.name}</strong></td>
                            <td>{form.campaignName || '—'}</td>
                            <td>
                                <span className={`intg-chip intg-chip-${form.status}`}>
                                    {form.status.toUpperCase()}
                                </span>
                            </td>
                            <td>{form.leadsThisMonth}</td>
                            <td className="intg-muted">{form.lastLeadAt ? new Date(form.lastLeadAt).toLocaleDateString() : '—'}</td>
                            <td><button className="intg-text-link">View Leads</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
