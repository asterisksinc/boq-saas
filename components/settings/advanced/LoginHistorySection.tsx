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
            <div className="advanced-cards-stack" data-testid="login-history-loading">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="advanced-card advanced-card-skeleton">
                        <div className="advanced-history-device-row">
                            <div className="skeleton" style={{ width: 10, height: 10, borderRadius: "50%" }} />
                            <div className="advanced-card-left">
                                <div className="skeleton" style={{ width: 125, height: 19, borderRadius: 4 }} />
                                <div className="skeleton" style={{ width: 70, height: 17, borderRadius: 4 }} />
                            </div>
                        </div>
                        <div className="skeleton" style={{ width: 44, height: 17, borderRadius: 4 }} />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="advanced-card"
                style={{
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "32px 20px",
                    gap: 12,
                    height: "auto",
                    minHeight: 120,
                }}
                data-testid="login-history-error"
            >
                <p style={{ margin: 0, color: "#DC2626", fontSize: 14, fontFamily: "'Urbanist', sans-serif", fontWeight: 500 }}>
                    {error}
                </p>
                <button type="button" className="btn-advanced-action" onClick={onRetry}>
                    Try Again
                </button>
            </div>
        );
    }

    if (!history || history.length === 0) {
        return (
            <div
                className="advanced-card"
                style={{
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "40px 20px",
                    height: "auto",
                    minHeight: 120,
                }}
                data-testid="login-history-empty"
            >
                <p style={{ margin: 0, color: "#64748B", fontSize: 14, fontFamily: "'Urbanist', sans-serif", fontWeight: 500 }}>
                    No login history found.
                </p>
            </div>
        );
    }

    return (
        <div className="advanced-cards-stack" aria-label="Login History Events" data-testid="login-history-stack">
            {history.map((item) => {
                const isWarning = item.status === "warning";
                return (
                    <article key={item.id} className="advanced-card advanced-history-card" data-testid={`login-history-item-${item.id}`}>
                        <div className="advanced-history-device-row">
                            <span
                                className={`login-status-dot ${isWarning ? "is-warning" : "is-success"}`}
                                aria-label={isWarning ? "Security warning" : "Normal login"}
                            />
                            <div className="advanced-card-left">
                                <span className="advanced-card-title">{item.device}</span>
                                <span className="advanced-card-subtitle">{item.location}</span>
                            </div>
                        </div>
                        <div className="advanced-timestamp">{item.timestamp}</div>
                    </article>
                );
            })}
        </div>
    );
}
