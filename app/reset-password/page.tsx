"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getApiErrorMessage, resetPassword } from "@/lib/api/auth";

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="auth-shell" />}>
            <ResetPasswordContent />
        </Suspense>
    );
}

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = useMemo(() => searchParams.get("code") ?? "", [searchParams]);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!code) {
            setError("This reset link is missing a valid code.");
            return;
        }

        if (password.length < 10) {
            setError("Password must be at least 10 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);

        try {
            await resetPassword({ code, password });
            setSuccess("Password Reset Successfully");
            setTimeout(() => router.push("/login"), 1600);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Create New Password"
            iconSrc={success ? "/assets/password-reset-success.svg" : "/assets/password-reset-key.svg"}
            iconAlt={success ? "Password reset successful" : "Password reset key"}
            subtitle="Your new password must be different from previous used passwords."
            footer={
                <div className="auth-footer-inline">
                    <span>2026 BOQ. All Rights Reserved.</span>
                    <span>Privacy Policy</span>
                    <span>Terms of Service</span>
                </div>
            }
        >
            {success ? (
                <div className="auth-success-box compact-box">
                    <div className="auth-success-icon" aria-hidden="true">✓</div>
                    <h3>Password Reset Successfully</h3>
                    <p>Your password has been successfully reset. Click below to log in magically.</p>
                    <button type="button" className="primary-button" onClick={() => router.push("/login")}>Continue</button>
                    <Link href="/login" className="auth-back-link">Back to Login</Link>
                </div>
            ) : (
                <form className="auth-form" onSubmit={onSubmit} noValidate>
                    {error ? <p className="error-banner" role="alert">{error}</p> : null}

                    <label className="field">
                        <span>Password <em>*</em></span>
                        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" required autoComplete="new-password" />
                    </label>

                    <label className="field">
                        <span>Confirm Password <em>*</em></span>
                        <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" required autoComplete="new-password" />
                    </label>

                    <button className="primary-button" type="submit" disabled={isSubmitting || !password || !confirmPassword}>
                        {isSubmitting ? "Resetting" : "Reset Password"}
                    </button>
                </form>
            )}
        </AuthLayout>
    );
}
