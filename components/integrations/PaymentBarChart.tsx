"use client";

import { useEffect, useState } from 'react';
import { integrationsApi } from '@/lib/api/integrations';

interface Props {
    integrationId: string;
}

export default function PaymentBarChart({ integrationId }: Props) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await integrationsApi.paymentAnalytics(integrationId);
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [integrationId]);

    if (loading) return <div className="intg-skeleton intg-skeleton-chart" style={{ height: '300px' }} />;
    if (!data) return <div className="intg-empty-state">No chart data available.</div>;

    // We can render SVG bar chart
    return (
        <div className="intg-chart-container">
            <h3>Payment Overview</h3>
            <div className="intg-bar-chart">
                <div className="intg-chart-y-axis">
                    <span>3M</span>
                    <span>2M</span>
                    <span>1M</span>
                    <span>0</span>
                </div>
                <div className="intg-chart-plot-area">
                    {/* Render grid lines */}
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="intg-chart-grid-line" style={{ bottom: `${i * 33.33}%` }} />
                    ))}
                    
                    {/* Render bars */}
                    <div className="intg-chart-bars">
                        {data.overview?.map((point: any, i: number) => (
                            <div key={i} className="intg-bar-group">
                                <div className="intg-bar intg-bar-green" style={{ height: `${(point.received / 3000000) * 100}%` }} title={`Received: ₹${point.received}`} />
                                <div className="intg-bar intg-bar-orange" style={{ height: `${(point.due / 3000000) * 100}%` }} title={`Due: ₹${point.due}`} />
                                <div className="intg-bar intg-bar-blue" style={{ height: `${(point.pending / 3000000) * 100}%` }} title={`Pending: ₹${point.pending}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="intg-chart-x-axis">
                {data.overview?.map((point: any, i: number) => (
                    <div key={i}>{point.month}</div>
                ))}
            </div>
            <div className="intg-chart-legend">
                <span className="intg-legend-item"><span className="intg-legend-color intg-bg-green" /> Amount Received</span>
                <span className="intg-legend-item"><span className="intg-legend-color intg-bg-orange" /> Amount Due</span>
                <span className="intg-legend-item"><span className="intg-legend-color intg-bg-blue" /> Total Pending</span>
            </div>
        </div>
    );
}
