"use client";

import { useEffect, useState, useCallback } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { integrationsApi, PaymentSummaryData, PaymentAnalyticsData } from '@/lib/api/integrations';
import PaymentBarChart from './PaymentBarChart';
import PaymentStatusDonut from './PaymentStatusDonut';
import TransactionsTable from './TransactionsTable';

export default function PaymentDashboard({ integrationId }: { integrationId: string }) {
    const [summary, setSummary] = useState<PaymentSummaryData | null>(null);
    const [analytics, setAnalytics] = useState<PaymentAnalyticsData | null>(null);
    const [period, setPeriod] = useState<string>('week');
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);

    const loadSummary = useCallback(async () => {
        try {
            setLoadingSummary(true);
            const res = await integrationsApi.paymentSummary(integrationId);
            setSummary(res);
        } catch (err) {
            console.error('Failed to load payment summary', err);
        } finally {
            setLoadingSummary(false);
        }
    }, [integrationId]);

    const loadAnalytics = useCallback(async (selectedPeriod: string) => {
        try {
            setLoadingAnalytics(true);
            const res = await integrationsApi.paymentAnalytics(integrationId, selectedPeriod);
            setAnalytics(res);
        } catch (err) {
            console.error('Failed to load payment analytics', err);
        } finally {
            setLoadingAnalytics(false);
        }
    }, [integrationId]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    useEffect(() => {
        loadAnalytics(period);
    }, [loadAnalytics, period]);

    const currency = summary?.currency || analytics?.currency || 'INR';

    const fmt = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const renderDelta = (
        change: number | undefined | null,
        variant: 'green' | 'amber' | 'blue' | 'red'
    ) => {
        if (change == null) return null;

        const rounded = Math.round(Math.abs(change));
        const isZero = rounded === 0;
        const isPositive = change > 0;

        let colorClass = `trend-${variant}`;
        if (variant === 'green' && !isPositive && !isZero) colorClass = 'trend-red';

        return (
            <div className="razorpay-kpi-trend">
                <span className={`razorpay-kpi-delta ${colorClass}`}>
                    {isZero ? (
                        <Minus size={14} />
                    ) : isPositive ? (
                        <ArrowUp size={14} />
                    ) : (
                        <ArrowDown size={14} />
                    )}
                    <span>{rounded}%</span>
                </span>
                <span className="razorpay-kpi-trend-sub">vs last month</span>
            </div>
        );
    };

    return (
        <div className="razorpay-integration-page__content">
            {/* KPI Summary Cards Row (Frame 2147225138) */}
            <div className="razorpay-kpi-grid">
                {/* Card 1: Account Received */}
                <div className="razorpay-kpi-card">
                    <span className="razorpay-kpi-label">Account Received</span>
                    <strong className="razorpay-kpi-value">
                        {loadingSummary ? '...' : fmt.format(summary?.accountReceived ?? 0)}
                    </strong>
                    {!loadingSummary && renderDelta(summary?.accountReceivedChange, 'green')}
                </div>

                {/* Card 2: Amount Due */}
                <div className="razorpay-kpi-card">
                    <span className="razorpay-kpi-label">Amount Due</span>
                    <strong className="razorpay-kpi-value">
                        {loadingSummary ? '...' : fmt.format(summary?.amountDue ?? 0)}
                    </strong>
                    {!loadingSummary && renderDelta(summary?.amountDueChange, 'amber')}
                </div>

                {/* Card 3: Total Pending */}
                <div className="razorpay-kpi-card">
                    <span className="razorpay-kpi-label">Total Pending</span>
                    <strong className="razorpay-kpi-value">
                        {loadingSummary ? '...' : fmt.format(summary?.totalPending ?? 0)}
                    </strong>
                    {!loadingSummary && renderDelta(summary?.totalPendingChange, 'blue')}
                </div>

                {/* Card 4: Failed Payments */}
                <div className="razorpay-kpi-card">
                    <span className="razorpay-kpi-label">Failed Payments</span>
                    <strong className="razorpay-kpi-value">
                        {loadingSummary ? '...' : fmt.format(summary?.failedPayments ?? 0)}
                    </strong>
                    {!loadingSummary && renderDelta(summary?.failedPaymentsChange, 'red')}
                </div>
            </div>

            {/* Analytics Row: Payment Overview + Payment by Status (Frame 2147224997) */}
            <div className="razorpay-analytics-row">
                <PaymentBarChart
                    period={period}
                    onPeriodChange={setPeriod}
                    overview={analytics?.paymentOverview}
                    currency={currency}
                    loading={loadingAnalytics}
                />
                <PaymentStatusDonut
                    breakdown={analytics?.statusBreakdown}
                    loading={loadingAnalytics}
                />
            </div>

            {/* Recent Transactions Table Panel (Frame 2147225140) */}
            <TransactionsTable
                integrationId={integrationId}
                currency={currency}
            />
        </div>
    );
}
