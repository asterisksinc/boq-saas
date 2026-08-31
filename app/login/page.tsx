"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getApiErrorMessage, login } from "@/lib/api/auth";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            await login({ email: email.trim(), password });
            router.replace("/dashboard");
        } catch (requestError) {
            const message = getApiErrorMessage(requestError);
            setError(/invalid email or password/i.test(message) ? "Incorrect username or password. Please try again." : message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome to BOQ"
            subtitle="Lorem Imspi"
            footer={
                <div className="auth-footer-inline">
                    <span>2026 BOQ. All Rights Reserved.</span>
                    <span>Privacy Policy</span>
                    <span>Terms of Service</span>
                </div>
            }
        >
            <form className={`auth-form ${error ? "auth-form--error" : ""}`} onSubmit={onSubmit} noValidate>
                {error ? <p className="error-banner" role="alert"><span className="error-banner-icon" aria-hidden="true">!</span>{error}</p> : null}

                <label className="field">
                    <span>Email Address <em>*</em></span>
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="john.doe@example.com" required autoComplete="email" />
                </label>

                <label className="field">
                    <span>Password <em>*</em></span>
                    <div className="auth-password-control">
                        <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="ex. **********" required autoComplete="current-password" />
                        <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                            <img src="/assets/password-visibility.svg" alt="" aria-hidden="true" />
                        </button>
                    </div>
                </label>

                <div className="auth-row-between">
                    <label className="checkbox-row">
                        <input type="checkbox" checked={remember} onChange={() => setRemember((value) => !value)} />
                        <span>Remember Me</span>
                    </label>
                    <Link href="/forgot-password" className="auth-link small-link">Forgot Password?</Link>
                </div>

                <button className="primary-button" type="submit" disabled={isSubmitting || !email || !password}>
                    {isSubmitting ? "Signing In" : "Sign In"}
                </button>

                <div className="auth-divider"><span>Or Continue With</span></div>

                <button type="button" className="secondary-button google-button">
                    Sign in with Google
                </button>

                <p className="auth-signup-text">
                    Don&apos;t have an account? <Link href="/register" className="auth-link">Get Started</Link>
                </p>
            </form>
        </AuthLayout>
    );
}
