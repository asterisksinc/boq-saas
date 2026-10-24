"use client";

interface PasswordSecurityCardProps {
    lastChangedText: string;
    onChangePassword: () => void;
    loading?: boolean;
}

export default function PasswordSecurityCard({
    lastChangedText,
    onChangePassword,
    loading = false,
}: PasswordSecurityCardProps) {
    if (loading) {
        return (
            <div className="advanced-card advanced-card-skeleton" data-testid="password-card-skeleton">
                <div className="advanced-card-left">
                    <div className="skeleton" style={{ width: 80, height: 19, borderRadius: 4 }} />
                    <div className="skeleton" style={{ width: 164, height: 17, borderRadius: 4 }} />
                </div>
                <div className="skeleton" style={{ width: 82, height: 34, borderRadius: 6 }} />
            </div>
        );
    }

    return (
        <section className="advanced-card" aria-label="Password Security" data-testid="password-security-card">
            <div className="advanced-card-left">
                <h3 className="advanced-card-title">Password</h3>
                <p className="advanced-card-subtitle">{lastChangedText}</p>
            </div>
            <button
                type="button"
                className="btn-advanced-action"
                onClick={onChangePassword}
                data-testid="change-password-button"
            >
                Change
            </button>
        </section>
    );
}
