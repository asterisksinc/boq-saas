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
            <div className="advanced-card advanced-card-skeleton">
                <div className="advanced-card-left">
                    <div className="skeleton" style={{ width: 100, height: 18, marginBottom: 6, borderRadius: 4 }} />
                    <div className="skeleton" style={{ width: 180, height: 14, borderRadius: 4 }} />
                </div>
                <div className="skeleton" style={{ width: 80, height: 34, borderRadius: 8 }} />
            </div>
        );
    }

    return (
        <section className="advanced-card" aria-label="Password Security">
            <div className="advanced-card-left">
                <h3 className="advanced-card-title">Password</h3>
                <p className="advanced-card-subtitle">{lastChangedText}</p>
            </div>
            <button
                type="button"
                className="btn-advanced-action"
                onClick={onChangePassword}
            >
                Change
            </button>
        </section>
    );
}
