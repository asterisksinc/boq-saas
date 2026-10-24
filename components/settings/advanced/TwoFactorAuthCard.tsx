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
            <div className="advanced-card advanced-card-skeleton" data-testid="2fa-card-skeleton">
                <div className="advanced-card-left">
                    <div className="skeleton" style={{ width: 120, height: 19, borderRadius: 4 }} />
                    <div className="skeleton" style={{ width: 178, height: 17, borderRadius: 4 }} />
                </div>
                <div className="skeleton" style={{ width: 85, height: 34, borderRadius: 6 }} />
            </div>
        );
    }

    return (
        <section className="advanced-card" aria-label="Two-Factor Authentication" data-testid="two-factor-auth-card">
            <div className="advanced-card-left">
                <h3 className="advanced-card-title">Two-Factor Auth</h3>
                <p className="advanced-card-subtitle">{statusText}</p>
            </div>
            <button
                type="button"
                className="btn-advanced-action btn-manage-2fa"
                onClick={onManageClick}
                data-testid="manage-2fa-button"
            >
                Manage
            </button>
        </section>
    );
}
