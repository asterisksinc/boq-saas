"use client";

import { LoginHistoryItem } from "@/lib/api/auth";

interface LoginHistorySectionProps {
    history: LoginHistoryItem[];
    loading: boolean;
    error: string | null;
    onRetry: () => void;
}

export default function LoginHistorySection({
    history,
    loading,
    error,
    onRetry,
}: LoginHistorySectionProps) {
    if (loading) {
        return (
            <div className="advanced-cards-stack">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="advanced-card advanced-card-skeleton">
                        <div className="advanced-card-left">
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                                <div className="skeleton" style={{ width: 8, height: 8, borderRadius: "50%" }} />
                                <div className="skeleton" style={{ width: 140, height: 16, borderRadius: 4 }} />
                            </div>
                            <div className="skeleton" style={{ width: 100, height: 13, borderRadius: 4, marginLeft: 20 }} />
                        </div>
                        <div className="skeleton" style={{ width: 50, height: 14, borderRadius: 4 }} />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="advanced-card" style={{ flexDirection: "column", alignItems: "center", padding: "32px 20px", gap: 12 }}>
                <p style={{ margin: 0, color: "#dc2626", fontSize: 13.5 }}>{error}</p>
                <button type="button" className="btn-advanced-action" onClick={onRetry}>
                    Try Again
                </button>
            </div>
        );
    }

    if (!history || history.length === 0) {
        return (
            <div className="advanced-card" style={{ justifyContent: "center", padding: "40px 20px" }}>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13.5 }}>No login history found.</p>
            </div>
        );
    }

    return (
        <div className="advanced-cards-stack" aria-label="Login History Events">
            {history.map((item) => {
                const isWarning = item.status === "warning";
                return (
                    <article key={item.id} className="advanced-card advanced-history-card">
                        <div className="advanced-card-left">
                            <div className="advanced-history-device-row">
                                <span
                                    className={`login-status-dot ${isWarning ? "is-warning" : "is-success"}`}
                                    aria-label={isWarning ? "Security warning" : "Normal login"}
                                />
                                <span className="advanced-card-title">{item.device}</span>
                            </div>
                            <span className="advanced-history-location">{item.location}</span>
                        </div>
                        <div className="advanced-timestamp">{item.timestamp}</div>
                    </article>
                );
            })}
        </div>
    );
}
