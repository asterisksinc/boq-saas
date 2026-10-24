"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

interface DataPoint {
    date: string;
    label?: string;
    received: number;
    due: number;
    pending: number;
}

interface Props {
    period: string;
    onPeriodChange: (period: string) => void;
    overview?: DataPoint[];
    currency?: string;
    loading?: boolean;
}

const PERIOD_OPTIONS = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: '6m', label: 'Last 6 Months' },
    { value: 'year', label: 'This Year' },
];

export default function PaymentBarChart({
    period,
    onPeriodChange,
    overview = [],
    currency = 'INR',
    loading = false,
}: Props) {
    const [openDropdown, setOpenDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || 'This Week';

    const fmtCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency || 'INR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    // Calculate dynamic Y-axis scale
    const { maxTick, ticks } = useMemo(() => {
        let maxVal = 0;
        overview.forEach(p => {
            if (p.received > maxVal) maxVal = p.received;
            if (p.due > maxVal) maxVal = p.due;
            if (p.pending > maxVal) maxVal = p.pending;
        });

        if (maxVal <= 0) {
            return {
                maxTick: 400,
                ticks: [400, 300, 200, 100, 0],
            };
        }

        if (maxVal <= 400) {
            return {
                maxTick: 400,
                ticks: [400, 300, 200, 100, 0],
            };
        }

        // Determine nice magnitude (power of 10)
        const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
        const normalized = maxVal / magnitude;
        let stepMultiplier = 1;
        if (normalized <= 2) stepMultiplier = 2;
        else if (normalized <= 5) stepMultiplier = 5;
        else stepMultiplier = 10;

        const niceMax = stepMultiplier * magnitude;
        const tickList = [
            niceMax,
            niceMax * 0.75,
            niceMax * 0.5,
            niceMax * 0.25,
            0,
        ];

        return { maxTick: niceMax, ticks: tickList };
    }, [overview]);

    const formatTickLabel = (val: number) => {
        if (val === 0) return '0';
        if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}M`;
        if (val >= 100_000) return `${(val / 100_000).toFixed(val % 100_000 === 0 ? 0 : 1)}L`;
        if (val >= 1_000) return `${(val / 1_000).toFixed(val % 1_000 === 0 ? 0 : 1)}k`;
        return `${val}`;
    };

    return (
        <div className="razorpay-chart-card razorpay-overview-card">
            {/* Header: Title & Date Filter Dropdown */}
            <div className="razorpay-overview-header">
                <h3 className="razorpay-card-title">Payment Overview</h3>

                {/* Date Dropdown (Frame 2147225103) */}
                <div className="razorpay-dropdown-wrap" ref={dropdownRef}>
                    <button
                        type="button"
                        className="razorpay-dropdown-btn"
                        onClick={() => setOpenDropdown(!openDropdown)}
                        aria-haspopup="listbox"
                        aria-expanded={openDropdown}
                    >
                        <span>{selectedLabel}</span>
                        <ChevronDown size={16} className="razorpay-dropdown-chevron" />
                    </button>

                    {openDropdown && (
                        <div className="razorpay-dropdown-menu" role="listbox">
                            {PERIOD_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`razorpay-dropdown-item ${period === opt.value ? 'selected' : ''}`}
                                    onClick={() => {
                                        onPeriodChange(opt.value);
                                        setOpenDropdown(false);
                                    }}
                                    role="option"
                                    aria-selected={period === opt.value}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Legends Row (Frame 2147225236) */}
            <div className="razorpay-chart-legend">
                <div className="razorpay-legend-item">
                    <span className="razorpay-legend-swatch swatch-green" />
                    <span className="razorpay-legend-text">Amount Received</span>
                </div>
                <div className="razorpay-legend-item">
                    <span className="razorpay-legend-swatch swatch-amber" />
                    <span className="razorpay-legend-text">Amount Due</span>
                </div>
                <div className="razorpay-legend-item">
                    <span className="razorpay-legend-swatch swatch-blue" />
                    <span className="razorpay-legend-text">Total Pending</span>
                </div>
            </div>

            {/* Chart Content Body */}
            {loading ? (
                <div className="intg-skeleton razorpay-skeleton-chart" />
            ) : (
                <div className="razorpay-chart-body">
                    {/* Y-Axis */}
                    <div className="razorpay-y-axis">
                        {ticks.map((t, idx) => (
                            <span key={idx} className="razorpay-axis-label">
                                {formatTickLabel(t)}
                            </span>
                        ))}
                    </div>

                    {/* Plot area with horizontal gridlines and bars */}
                    <div className="razorpay-plot-area">
                        {/* Horizontal Gridlines (Lines 1 to 5) */}
                        <div className="razorpay-grid-lines">
                            {ticks.map((_, idx) => (
                                <div key={idx} className="razorpay-grid-line" />
                            ))}
                        </div>

                        {/* Bar groups */}
                        <div className="razorpay-bars-container">
                            {overview.length === 0 ? (
                                <div className="razorpay-no-chart-data">No data for selected period</div>
                            ) : (
                                overview.map((pt, i) => {
                                    const rPct = Math.min(100, Math.max(0, (pt.received / maxTick) * 100));
                                    const dPct = Math.min(100, Math.max(0, (pt.due / maxTick) * 100));
                                    const pPct = Math.min(100, Math.max(0, (pt.pending / maxTick) * 100));

                                    return (
                                        <div key={i} className="razorpay-bar-group">
                                            {/* Bar container */}
                                            <div className="razorpay-bars-pair">
                                                {/* Received Bar (Green #16A34A) */}
                                                <div
                                                    className="razorpay-bar bar-green"
                                                    style={{ height: `${rPct > 0 ? Math.max(rPct, 2) : 0}%` }}
                                                    title={`Received: ${fmtCurrency(pt.received)}`}
                                                />
                                                {/* Due Bar (Amber #FAB000 / #D97706) */}
                                                <div
                                                    className="razorpay-bar bar-amber"
                                                    style={{ height: `${dPct > 0 ? Math.max(dPct, 2) : 0}%` }}
                                                    title={`Due: ${fmtCurrency(pt.due)}`}
                                                />
                                                {/* Pending Bar (Blue #2563EB) */}
                                                <div
                                                    className="razorpay-bar bar-blue"
                                                    style={{ height: `${pPct > 0 ? Math.max(pPct, 2) : 0}%` }}
                                                    title={`Pending: ${fmtCurrency(pt.pending)}`}
                                                />
                                            </div>

                                            {/* X-Axis Label */}
                                            <div className="razorpay-x-label">
                                                {pt.label || pt.date.substring(5)}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
