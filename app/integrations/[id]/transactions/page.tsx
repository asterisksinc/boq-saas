"use client";

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, RefreshCw, X } from 'lucide-react';
import DashboardRail from '@/components/DashboardRail';
import DashboardHeader from '@/components/DashboardHeader';
import { integrationsApi, Transaction as ApiTransaction } from '@/lib/api/integrations';
import Pagination from '@/components/integrations/Pagination';
import '../../integrations.css';

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

export default function RazorpayAllTransactionsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [items, setItems] = useState<ApiTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');
    const [currency, setCurrency] = useState('INR');

    const loadTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await integrationsApi.transactions(id, {
                page,
                pageSize,
                search: search.trim() || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                method: methodFilter !== 'all' ? methodFilter : undefined,
            });
            setItems(res.items || []);
            setTotal(res.total ?? 0);
            if (res.items?.[0]?.currency) {
                setCurrency(res.items[0].currency);
            }
        } catch (err) {
            console.error('Failed to load transactions', err);
        } finally {
            setLoading(false);
        }
    }, [id, page, pageSize, search, statusFilter, methodFilter]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

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

    const handleClearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setMethodFilter('all');
        setPage(1);
    };

    const hasActiveFilters = Boolean(search || statusFilter !== 'all' || methodFilter !== 'all');

    return (
        <main className="fig-dashboard">
            <div className="fig-dashboard-glow" />
            <DashboardRail current="/integrations" />
            <div className="fig-dashboard-main">
                <DashboardHeader title="All Transactions" />

                <div className="intg-detail-page razorpay-integration-page razorpay-all-transactions-page" data-provider="razorpay">
                    {/* Back Button (Figma Frame 2147225070) */}
                    <button
                        type="button"
                        className="intg-detail-back-btn razorpay-back-btn"
                        onClick={() => router.push(`/integrations/${id}`)}
                    >
                        <ArrowLeft size={16} />
                        <span>Back</span>
                    </button>

                    {/* Main Transactions Panel (Figma Frame 2147225140) */}
                    <div className="razorpay-transactions-card razorpay-all-transactions-panel">
                        {/* Page-level Search & Filter Controls Toolbar */}
                        <div className="razorpay-all-toolbar">
                            <div className="razorpay-search-box">
                                <Search size={16} className="razorpay-search-icon" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Search by ID, project, invoice, client..."
                                    className="razorpay-search-input"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            setPage(1);
                                        }}
                                        className="razorpay-search-clear"
                                        aria-label="Clear search"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="razorpay-filters-row">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="razorpay-filter-select"
                                    aria-label="Filter by status"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="successful">Successful</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                </select>

                                <select
                                    value={methodFilter}
                                    onChange={(e) => {
                                        setMethodFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="razorpay-filter-select"
                                    aria-label="Filter by payment method"
                                >
                                    <option value="all">All Methods</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Net Banking</option>
                                    <option value="wallet">Wallet</option>
                                </select>

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={handleClearFilters}
                                        className="razorpay-clear-filters-btn"
                                    >
                                        Clear Filters
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => loadTransactions()}
                                    className="razorpay-refresh-btn"
                                    aria-label="Refresh transactions"
                                    title="Refresh"
                                >
                                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        {/* Transaction Table (Device Management_iOS / Frame 57) */}
                        <div className="razorpay-table-scroll">
                            <table className="razorpay-table razorpay-all-table">
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
                                        Array.from({ length: 8 }).map((_, i) => (
                                            <tr key={i} className="razorpay-row-skeleton">
                                                <td colSpan={10}>
                                                    <div className="intg-skeleton razorpay-skeleton-row" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : items.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="razorpay-empty-cell">
                                                {hasActiveFilters ? (
                                                    <div className="razorpay-empty-state">
                                                        <p>No transactions match your search or filter criteria.</p>
                                                        <button
                                                            type="button"
                                                            onClick={handleClearFilters}
                                                            className="intg-btn intg-btn-outline"
                                                        >
                                                            Reset Filters
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="razorpay-empty-state">
                                                        <p>No transactions found for this Razorpay integration.</p>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((row) => {
                                            const mappedStatus = statusMap[row.status] || (row.status === 'successful' ? 'successful' : 'pending');
                                            const dt = formatDate(row.timestamp);
                                            const statusLabel = mappedStatus === 'successful' ? 'SUCCESS' : mappedStatus.toUpperCase();
                                            const clientInitial = (row.clientName || 'C').charAt(0).toUpperCase();

                                            return (
                                                <tr key={row.id} className="razorpay-table-row">
                                                    {/* ID - Blue Accent (#2563EB) */}
                                                    <td className="cell-id">
                                                        <span className="razorpay-id-text" title={row.paymentId}>
                                                            {row.paymentId ? row.paymentId.substring(0, 18) : 'pay_NA'}
                                                        </span>
                                                    </td>

                                                    {/* PROJECT - 2 lines: Name + Code */}
                                                    <td className="cell-project">
                                                        <div className="razorpay-project-stack">
                                                            <span className="project-title">{row.projectName || 'General Project'}</span>
                                                            {row.projectCode && (
                                                                <span className="project-sub">{row.projectCode}</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* BOQ */}
                                                    <td className="cell-boq">
                                                        <span className="boq-code">{row.boqRef || '—'}</span>
                                                    </td>

                                                    {/* INVOICE */}
                                                    <td className="cell-invoice">
                                                        <span className="invoice-code">{row.invoiceNumber || '—'}</span>
                                                    </td>

                                                    {/* AMOUNT */}
                                                    <td className="cell-amount">
                                                        <span className="amount-text">{formatAmount(row.amount)}</span>
                                                    </td>

                                                    {/* BY CLIENT - Avatar + Name */}
                                                    <td className="cell-client">
                                                        <div className="razorpay-client-wrap">
                                                            <span className="razorpay-client-avatar" aria-hidden="true">
                                                                {clientInitial}
                                                            </span>
                                                            <span className="client-name">{row.clientName || 'Direct Payment'}</span>
                                                        </div>
                                                    </td>

                                                    {/* METHOD */}
                                                    <td className="cell-method">
                                                        <span className={`razorpay-method-badge ${getMethodClass(row.method)}`}>
                                                            {methodLabels[row.method] || row.method || 'Card'}
                                                        </span>
                                                    </td>

                                                    {/* TIMESTAMP - 2 lines: Date + Time */}
                                                    <td className="cell-timestamp">
                                                        <div className="timestamp-stack">
                                                            <span className="timestamp-date">{dt.date}</span>
                                                            <span className="timestamp-time">{dt.time}</span>
                                                        </div>
                                                    </td>

                                                    {/* STATUS */}
                                                    <td className="cell-status">
                                                        <span className={`razorpay-status-chip ${statusChipClass[mappedStatus] || 'chip-pending'}`}>
                                                            {statusLabel}
                                                        </span>
                                                    </td>

                                                    {/* ACTIONS */}
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

                        {/* Pagination (Figma Frame 2147225166) */}
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
                </div>
            </div>
        </main>
    );
}
