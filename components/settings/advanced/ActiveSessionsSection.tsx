"use client";

import { useState } from "react";
import { UserSessionInfo } from "@/lib/api/auth";
import RevokeSessionModal from "./RevokeSessionModal";

interface ActiveSessionsSectionProps {
    sessions: UserSessionInfo[];
    loading: boolean;
    error: string | null;
    onRevoke: (sessionId: string) => Promise<void>;
    onRetry: () => void;
}

export default function ActiveSessionsSection({
    sessions,
    loading,
    error,
    onRevoke,
    onRetry,
}: ActiveSessionsSectionProps) {
    const [selectedSession, setSelectedSession] = useState<UserSessionInfo | null>(null);
    const [revoking, setRevoking] = useState(false);

    if (loading) {
        return (
            <div className="advanced-cards-stack" data-testid="active-sessions-loading">
                {[1, 2].map((i) => (
                    <div key={i} className="advanced-card advanced-card-skeleton">
                        <div className="advanced-card-left">
                            <div className="advanced-session-device-row">
                                <div className="skeleton" style={{ width: 136, height: 19, borderRadius: 4 }} />
                                {i === 1 && <div className="skeleton" style={{ width: 65, height: 18, borderRadius: 9999 }} />}
                            </div>
                            <div className="skeleton" style={{ width: 71, height: 17, borderRadius: 4 }} />
                        </div>
                        <div className="skeleton" style={{ width: i === 1 ? 40 : 77, height: i === 1 ? 17 : 34, borderRadius: i === 1 ? 4 : 6 }} />
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
                data-testid="active-sessions-error"
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

    if (!sessions || sessions.length === 0) {
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
                data-testid="active-sessions-empty"
            >
                <p style={{ margin: 0, color: "#64748B", fontSize: 14, fontFamily: "'Urbanist', sans-serif", fontWeight: 500 }}>
                    No active sessions found.
                </p>
            </div>
        );
    }

    const handleConfirmRevoke = async () => {
        if (!selectedSession) return;
        setRevoking(true);
        try {
            await onRevoke(selectedSession.id);
            setSelectedSession(null);
        } finally {
            setRevoking(false);
        }
    };

    return (
        <>
            <div className="advanced-cards-stack" aria-label="Active user sessions" data-testid="active-sessions-stack">
                {sessions.map((session) => (
                    <article key={session.id} className="advanced-card advanced-session-card" data-testid={`session-item-${session.id}`}>
                        <div className="advanced-card-left">
                            <div className="advanced-session-device-row">
                                <span className="advanced-card-title">{session.device}</span>
                                {session.isCurrent && (
                                    <span className="advanced-badge-current">CURRENT</span>
                                )}
                            </div>
                            <span className="advanced-card-subtitle">{session.location}</span>
                        </div>
                        {session.isCurrent ? (
                            <div className="advanced-timestamp">{session.lastActive || "Now"}</div>
                        ) : (
                            <button
                                type="button"
                                className="btn-advanced-revoke"
                                onClick={() => setSelectedSession(session)}
                                data-testid={`revoke-session-${session.id}`}
                            >
                                Revoke
                            </button>
                        )}
                    </article>
                ))}
            </div>

            <RevokeSessionModal
                isOpen={!!selectedSession}
                session={selectedSession}
                onClose={() => setSelectedSession(null)}
                onConfirm={handleConfirmRevoke}
                loading={revoking}
            />
        </>
    );
}
