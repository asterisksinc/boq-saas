"use client";

import { useMemo } from 'react';

interface StatusBreakdown {
    successful: number;
    pending: number;
    failed: number;
    total: number;
}

interface Props {
    breakdown?: StatusBreakdown | null;
    loading?: boolean;
}

export default function PaymentStatusDonut({ breakdown, loading }: Props) {
    const total = breakdown?.total ?? 0;
    const successful = breakdown?.successful ?? 0;
    const pending = breakdown?.pending ?? 0;
    const failed = breakdown?.failed ?? 0;

    const successfulPct = total > 0 ? ((successful / total) * 100).toFixed(1) : '0';
    const pendingPct = total > 0 ? ((pending / total) * 100).toFixed(1) : '0';
    const failedPct = total > 0 ? ((failed / total) * 100).toFixed(1) : '0';

    // SVG Donut calculation
    // Radius 56 inside 160x160 viewBox
    const radius = 56;
    const circumference = 2 * Math.PI * radius; // ~351.858

    const { sDash, pDash, fDash, pOffset, fOffset } = useMemo(() => {
        if (total === 0) {
            return { sDash: 0, pDash: 0, fDash: 0, pOffset: 0, fOffset: 0 };
        }
        const sLen = (successful / total) * circumference;
        const pLen = (pending / total) * circumference;
        const fLen = (failed / total) * circumference;

        return {
            sDash: sLen,
            pDash: pLen,
            fDash: fLen,
            pOffset: -sLen,
            fOffset: -(sLen + pLen),
        };
    }, [total, successful, pending, failed, circumference]);

    return (
        <div className="razorpay-chart-card razorpay-status-card">
            <h3 className="razorpay-card-title">Payment by Status</h3>

            {loading ? (
                <div className="intg-skeleton razorpay-skeleton-donut" />
            ) : (
                <div className="razorpay-status-body">
                    {/* Donut Chart Frame 98 */}
                    <div className="razorpay-donut-wrap">
                        <svg className="razorpay-donut-svg" viewBox="0 0 160 160">
                            {/* Background track circle */}
                            <circle
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="transparent"
                                stroke="#F1F5F9"
                                strokeWidth="20"
                            />

                            {total > 0 ? (
                                <>
                                    {/* Successful Arc (#24A967) */}
                                    {successful > 0 && (
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r={radius}
                                            fill="transparent"
                                            stroke="#24A967"
                                            strokeWidth="20"
                                            strokeDasharray={`${sDash} ${circumference}`}
                                            strokeDashoffset="0"
                                            transform="rotate(-90 80 80)"
                                        />
                                    )}

                                    {/* Pending Arc (#FD9536) */}
                                    {pending > 0 && (
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r={radius}
                                            fill="transparent"
                                            stroke="#FD9536"
                                            strokeWidth="20"
                                            strokeDasharray={`${pDash} ${circumference}`}
                                            strokeDashoffset={pOffset}
                                            transform="rotate(-90 80 80)"
                                        />
                                    )}

                                    {/* Failed Arc (#DC2626) */}
                                    {failed > 0 && (
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r={radius}
                                            fill="transparent"
                                            stroke="#DC2626"
                                            strokeWidth="20"
                                            strokeDasharray={`${fDash} ${circumference}`}
                                            strokeDashoffset={fOffset}
                                            transform="rotate(-90 80 80)"
                                        />
                                    )}
                                </>
                            ) : (
                                <circle
                                    cx="80"
                                    cy="80"
                                    r={radius}
                                    fill="transparent"
                                    stroke="#E2E8F0"
                                    strokeWidth="20"
                                />
                            )}
                        </svg>

                        {/* Center text (Frame 2147225436) */}
                        <div className="razorpay-donut-center">
                            <span className="razorpay-donut-count">{total}</span>
                            <span className="razorpay-donut-label">Transactions</span>
                        </div>
                    </div>

                    {/* Legend list (Frame 92) */}
                    <div className="razorpay-status-legend">
                        {/* Successful */}
                        <div className="razorpay-status-legend-item">
                            <div className="razorpay-legend-label-group">
                                <span className="razorpay-status-dot dot-successful" />
                                <span className="razorpay-status-name">Successful</span>
                            </div>
                            <span className="razorpay-status-val">
                                {successful} ({successfulPct}%)
                            </span>
                        </div>

                        {/* Pending */}
                        <div className="razorpay-status-legend-item">
                            <div className="razorpay-legend-label-group">
                                <span className="razorpay-status-dot dot-pending" />
                                <span className="razorpay-status-name">Pending</span>
                            </div>
                            <span className="razorpay-status-val">
                                {pending} ({pendingPct}%)
                            </span>
                        </div>

                        {/* Failed */}
                        <div className="razorpay-status-legend-item">
                            <div className="razorpay-legend-label-group">
                                <span className="razorpay-status-dot dot-failed" />
                                <span className="razorpay-status-name">Failed</span>
                            </div>
                            <span className="razorpay-status-val">
                                {failed} ({failedPct}%)
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
