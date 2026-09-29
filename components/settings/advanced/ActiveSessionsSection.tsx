"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
            <div className="advanced-cards-stack">
                {[1, 2].map((i) => (
                    <div key={i} className="advanced-card advanced-card-skeleton">
                        <div className="advanced-card-left">
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <div className="skeleton" style={{ width: 150, height: 16, borderRadius: 4 }} />
                                {i === 1 && <div className="skeleton" style={{ width: 55, height: 18, borderRadius: 6 }} />}
                            </div>
                            <div className="skeleton" style={{ width: 100, height: 13, borderRadius: 4 }} />
                        </div>
                        <div className="skeleton" style={{ width: i === 1 ? 40 : 75, height: i === 1 ? 14 : 32, borderRadius: i === 1 ? 4 : 8 }} />
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

    if (!sessions || sessions.length === 0) {
        return (
            <div className="advanced-card" style={{ justifyContent: "center", padding: "40px 20px" }}>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13.5 }}>No active sessions found.</p>
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
            <div className="advanced-cards-stack" aria-label="Active user sessions">
                {sessions.map((session) => (
                    <article key={session.id} className="advanced-card advanced-session-card">
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
