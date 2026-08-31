"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { forgotPassword, getApiErrorMessage } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setMessage("");
        setIsSubmitting(true);

        try {
            const response = await forgotPassword({ email: email.trim() });
            setMessage(response.message || "If an account exists, we have sent instructions.");
        } catch (requestError) {
            setError(getApiErrorMessage(requestError));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title={message ? "Check your Email" : "Forgot your Password?"}
            iconSrc={message ? "/assets/check-email.svg" : "/assets/forgot-password-lock.svg"}
            iconAlt={message ? "Email" : "Password lock"}
            subtitle={message ? "We've sent a password reset link to your email" : "No worries, we'll send you reset instructions."}
            footer={
                <div className="auth-footer-inline">
                    <span>2026 BOQ. All Rights Reserved.</span>
                    <span>Privacy Policy</span>
                    <span>Terms of Service</span>
                </div>
            }
        >
            {message ? (
                <div className="auth-email-sent">
                    <div className="auth-success-icon" aria-hidden="true">✓</div>
                    <h3>Check your Email</h3>
                    <p>We&apos;ve sent a password reset link to your email.</p>
                    <button type="button" className="primary-button button-inline">Open Email App</button>
                    <p className="auth-inline-note">Did you receive the email? If not, check your spam folder.</p>
                </div>
            ) : (
                <form className="auth-form" onSubmit={onSubmit} noValidate>
                    {error ? <p className="error-banner" role="alert">{error}</p> : null}

                    <label className="field">
                        <span>Email Address <em>*</em></span>
                        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="john.doe@example.com" required autoComplete="email" />
                    </label>

                    <button className="primary-button" type="submit" disabled={isSubmitting || !email}>
                        {isSubmitting ? "Sending Link" : "Send Reset Link"}
                    </button>

                    <Link href="/login" className="auth-back-link">Back to Login</Link>
                </form>
            )}
        </AuthLayout>
    );
}
