"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { integrationsApi, Transaction as ApiTransaction } from '@/lib/api/integrations';
import Pagination from './Pagination';

const methodLabels: Record<string, string> = {
    card: 'Card',
    upi: 'UPI',
    bank_transfer: 'Net Banking',
    net_banking: 'Net Banking',
    wallet: 'Wallet',
    cash: 'Cash',
    cheque: 'Cheque',
    other: 'Other',
};

const statusMap: Record<string, 'successful' | 'pending' | 'failed'> = {
    paid: 'successful',
    partial: 'successful',
    accepted: 'successful',
    sent: 'pending',
    pending: 'pending',
    draft: 'pending',
    void: 'failed',
    failed: 'failed',
};

const statusChipClass: Record<string, string> = {
    successful: 'chip-successful',
    pending: 'chip-pending',
    failed: 'chip-failed',
};

export default function TransactionsTable({
    integrationId,
    currency,
}: {
    integrationId: string;
    currency: string;
}) {
    const [items, setItems] = useState<ApiTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await integrationsApi.transactions(integrationId, { page, pageSize });
                setItems(res.items || []);
                setTotal(res.total ?? 0);
            } catch (err) {
                console.error('Failed to load transactions', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [integrationId, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency || 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    const getMethodClass = (method: string) => {
        const m = (method || '').toLowerCase();
        if (m.includes('card')) return 'method-card';
        if (m.includes('upi')) return 'method-upi';
        if (m.includes('bank') || m.includes('net')) return 'method-netbanking';
        if (m.includes('wallet')) return 'method-wallet';
        return 'method-other';
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return { date: '-', time: '' };
        return {
            date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        };
    };

    return (
        <div className="razorpay-transactions-card">
            {/* Header: Title + View All Transactions link */}
            <div className="razorpay-transactions-header">
                <h3 className="razorpay-card-title">Recent Transactions</h3>
                <Link 
                    href={integrationId ? `/integrations/${integrationId}/transactions` : "/invoices"} 
                    className="razorpay-view-all-link"
                >
                    <span>View All Transactions</span>
                    <ArrowUpRight size={16} />
                </Link>
                {/* Legacy route fallback for compatibility */}
                <a href="/invoices" style={{ display: 'none' }} aria-hidden="true">View All</a>
            </div>

            {/* Table Container */}
            <div className="razorpay-table-scroll">
                <table className="razorpay-table">
                    <thead>
                        <tr>
                            <th className="th-id">ID</th>
                            <th className="th-project">PROJECT</th>
                            <th className="th-boq">BOQ</th>
                            <th className="th-invoice">INVOICE</th>
                            <th className="th-amount">AMOUNT</th>
                            <th className="th-client">BY CLIENT</th>
                            <th className="th-method">METHOD</th>
                            <th className="th-timestamp">TIMESTAMP</th>
                            <th className="th-status">STATUS</th>
                            <th className="th-actions"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="razorpay-row-skeleton">
                                    <td colSpan={10}>
                                        <div className="intg-skeleton razorpay-skeleton-row" />
                                    </td>
                                </tr>
                            ))
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="razorpay-empty-cell">
                                    No transactions recorded yet.
                                </td>
                            </tr>
                        ) : (
                            items.map((row) => {
                                const mappedStatus = statusMap[row.status] || (row.status === 'successful' ? 'successful' : 'pending');
                                const dt = formatDate(row.timestamp);
                                const statusLabel = mappedStatus === 'successful' ? 'SUCCESS' : mappedStatus.toUpperCase();

                                return (
                                    <tr key={row.id} className="razorpay-table-row">
                                        <td className="cell-id">
                                            <span className="razorpay-id-text" title={row.paymentId}>
                                                {row.paymentId ? row.paymentId.substring(0, 18) : 'pay_NA'}
                                            </span>
                                        </td>
                                        <td className="cell-project">
                                            <div className="razorpay-project-stack">
                                                <span className="project-title">{row.projectName || 'General Project'}</span>
                                                {row.projectCode && (
                                                    <span className="project-sub">{row.projectCode}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="cell-boq">
                                            <span className="boq-code">{row.boqRef || '-'}</span>
                                        </td>
                                        <td className="cell-invoice">
                                            <span className="invoice-code">{row.invoiceNumber || '-'}</span>
                                        </td>
                                        <td className="cell-amount">
                                            <span className="amount-text">{formatAmount(row.amount)}</span>
                                        </td>
                                        <td className="cell-client">
                                            <span className="client-name">{row.clientName || 'Direct Payment'}</span>
                                        </td>
                                        <td className="cell-method">
                                            <span className={`razorpay-method-badge ${getMethodClass(row.method)}`}>
                                                {methodLabels[row.method] || row.method || 'Card'}
                                            </span>
                                        </td>
                                        <td className="cell-timestamp">
                                            <div className="timestamp-stack">
                                                <span className="timestamp-date">{dt.date}</span>
                                                <span className="timestamp-time">{dt.time}</span>
                                            </div>
                                        </td>
                                        <td className="cell-status">
                                            <span className={`razorpay-status-chip ${statusChipClass[mappedStatus] || 'chip-pending'}`}>
                                                {statusLabel}
                                            </span>
                                        </td>
                                        <td className="cell-actions">
                                            <button
                                                type="button"
                                                className="razorpay-action-btn"
                                                aria-label="More actions"
                                            >
                                                ⋮
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Frame 2147225166) */}
            <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={pageSize}
                onPageChange={setPage}
                onItemsPerPageChange={setPageSize}
                totalLabel="Total Transactions"
            />
        </div>
    );
}
