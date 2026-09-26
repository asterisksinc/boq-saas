"use client";

import { useEffect, useState } from 'react';
import { integrationsApi } from '@/lib/api/integrations';
import PaymentBarChart from './PaymentBarChart';
import TransactionsTable from './TransactionsTable';

export default function PaymentDashboard({ integrationId }: { integrationId: string }) {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await integrationsApi.paymentSummary(integrationId);
                setSummary(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [integrationId]);

    if (loading) {
        return (
            <div>
                <div className="intg-summary-grid">
                    {[0, 1, 2, 3].map(i => <div key={i} className="intg-skeleton intg-skeleton-kpi" />)}
                </div>
                <div className="intg-skeleton intg-skeleton-chart" style={{ height: '400px', marginTop: '24px' }} />
            </div>
        );
    }

    const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    return (
        <div className="intg-payment-dashboard">
            <div className="intg-summary-grid">
                <div className="intg-kpi-card intg-payment-kpi">
                    <span className="intg-kpi-label">ACCOUNT RECEIVED</span>
                    <strong className="intg-kpi-value text-green">{fmt.format(summary?.accountReceived || 0)}</strong>
                    <span className="intg-kpi-sub">Total amount received</span>
                </div>
                <div className="intg-kpi-card intg-payment-kpi">
                    <span className="intg-kpi-label">AMOUNT DUE</span>
                    <strong className="intg-kpi-value text-orange">{fmt.format(summary?.amountDue || 0)}</strong>
                    <span className="intg-kpi-sub">Total amount due</span>
                </div>
                <div className="intg-kpi-card intg-payment-kpi">
                    <span className="intg-kpi-label">TOTAL PENDING</span>
                    <strong className="intg-kpi-value text-blue">{fmt.format(summary?.totalPending || 0)}</strong>
                    <span className="intg-kpi-sub">Pending verification</span>
                </div>
                <div className="intg-kpi-card intg-payment-kpi">
                    <span className="intg-kpi-label">FAILED PAYMENTS</span>
                    <strong className="intg-kpi-value text-red">{fmt.format(summary?.failedPayments || 0)}</strong>
                    <span className="intg-kpi-sub">Failed transactions</span>
                </div>
            </div>

            <div className="intg-charts-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
                <PaymentBarChart integrationId={integrationId} />
                <div className="intg-chart-container">
                    <h3>Payment by Status</h3>
                    <div className="intg-donut-wrapper" style={{ position: 'relative', width: '200px', height: '200px', margin: '2rem auto' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="20" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="20" strokeDasharray="180 251" strokeDashoffset="0" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="20" strokeDasharray="50 251" strokeDashoffset="-180" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="20" strokeDasharray="21 251" strokeDashoffset="-230" />
                        </svg>
                        <div className="intg-donut-center" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>245</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--body)' }}>Transactions</span>
                        </div>
                    </div>
                    <div className="intg-chart-legend" style={{ flexDirection: 'column', alignItems: 'flex-start', paddingLeft: '20px' }}>
                        <span className="intg-legend-item"><span className="intg-legend-color intg-bg-green" /> Successful (180)</span>
                        <span className="intg-legend-item"><span className="intg-legend-color intg-bg-orange" /> Pending (50)</span>
                        <span className="intg-legend-item"><span className="intg-legend-color intg-bg-red" /> Failed (15)</span>
                    </div>
                </div>
            </div>

            <TransactionsTable integrationId={integrationId} currency={summary?.currency || 'INR'} />
        </div>
    );
}
