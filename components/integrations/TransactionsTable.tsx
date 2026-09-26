"use client";

import { useState, useEffect } from 'react';
import { integrationsApi, Transaction as ApiTransaction } from '@/lib/api/integrations';
import Pagination from './Pagination';

const methodLabels: Record<string, string> = {
    card: 'Card',
    upi: 'UPI',
    bank_transfer: 'Net Banking',
    cash: 'Cash',
    cheque: 'Cheque',
    other: 'Other',
};

const statusMap: Record<string, string> = {
    paid: 'successful',
    partial: 'successful',
    sent: 'pending',
    pending: 'pending',
    accepted: 'pending',
    draft: 'pending',
    void: 'failed',
};

export default function TransactionsTable({ integrationId, currency }: { integrationId: string; currency: string }) {
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
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [integrationId, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR', minimumFractionDigits: 2 }).format(amount);
    };

    if (loading) {
        return <div className="intg-skeleton intg-skeleton-chart" style={{ height: '400px' }} />;
    }

    return (
        <div className="intg-table-container">
            <div className="intg-table-header">
                <h3>Recent Transactions</h3>
                <a href="/invoices" className="intg-action-link">View All Transactions &gt;</a>
            </div>
            <table className="intg-table intg-transaction-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>PROJECT</th>
                        <th>BOQ</th>
                        <th>INVOICE</th>
                        <th>AMOUNT</th>
                        <th>BY CLIENT</th>
                        <th>METHOD</th>
                        <th>TIMESTAMP</th>
                        <th>STATUS</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 && (
                        <tr><td colSpan={10} className="intg-empty-state">No transactions found.</td></tr>
                    )}
                    {items.map(row => {
                        const mappedStatus = statusMap[row.status] || row.status;
                        return (
                            <tr key={row.id} className="intg-transaction-row">
                                <td className="intg-payment-id">{row.paymentId.substring(0, 16)}</td>
                                <td>
                                    <div className="intg-project-cell">
                                        <span className="font-medium">{row.projectName}</span>
                                        <span className="intg-sub-text">{row.projectCode}</span>
                                    </div>
                                </td>
                                <td>{row.boqRef || '-'}</td>
                                <td>{row.invoiceNumber}</td>
                                <td className="font-medium">{formatAmount(row.amount)}</td>
                                <td>{row.clientName}</td>
                                <td>
                                    <span className="intg-method-badge">
                                        {methodLabels[row.method] || row.method}
                                    </span>
                                </td>
                                <td>{new Date(row.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}<br/><span className="intg-sub-text">{new Date(row.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></td>
                                <td>
                                    <span className={`intg-status-chip intg-status-${mappedStatus}`}>
                                        {mappedStatus.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <button className="intg-btn-icon" aria-label="More actions">⋮</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <Pagination 
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={pageSize}
                onPageChange={setPage}
                onItemsPerPageChange={setPageSize}
            />
        </div>
    );
}
