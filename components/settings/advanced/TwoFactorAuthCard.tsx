"use client";

interface TwoFactorAuthCardProps {
    statusText: string;
    onManageClick: () => void;
    loading?: boolean;
}

export default function TwoFactorAuthCard({
    statusText,
    onManageClick,
    loading = false,
}: TwoFactorAuthCardProps) {
    if (loading) {
        return (
            <div className="advanced-card advanced-card-skeleton">
                <div className="advanced-card-left">
                    <div className="skeleton" style={{ width: 140, height: 18, marginBottom: 6, borderRadius: 4 }} />
                    <div className="skeleton" style={{ width: 200, height: 14, borderRadius: 4 }} />
                </div>
                <div className="skeleton" style={{ width: 80, height: 34, borderRadius: 8 }} />
            </div>
        );
    }

    return (
        <section className="advanced-card" aria-label="Two-Factor Authentication">
            <div className="advanced-card-left">
                <h3 className="advanced-card-title">Two-Factor Auth</h3>
                <p className="advanced-card-subtitle">{statusText}</p>
            </div>
            <button
                type="button"
                className="btn-advanced-action"
                onClick={onManageClick}
            >
                Manage
            </button>
        </section>
    );
}
