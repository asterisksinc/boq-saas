"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getApiErrorMessage, register } from "@/lib/api/auth";

export default function RegisterPage() {
    const router = useRouter();
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        const normalizedEmail = email.trim();
        const normalizedDisplayName = displayName.trim();

        if (!normalizedDisplayName) {
            setError("Enter your full name.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setError("Enter a valid work email address.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 10) {
            setError("Password must be at least 10 characters long.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await register({ email: normalizedEmail, password, displayName: normalizedDisplayName });
            if (response.emailVerificationRequired) {
                setSuccess("Account created. Please check your email to verify before continuing.");
                return;
            }
            router.push("/onboarding");
        } catch (requestError) {
            setError(getApiErrorMessage(requestError));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Create Your Account"
            subtitle="Set up your workspace and start managing your interior project workflows."
            footer={
                <div className="auth-footer-inline">
                    <span>2026 BOQ. All Rights Reserved.</span>
                    <span>Privacy Policy</span>
                    <span>Terms of Service</span>
                </div>
            }
        >
            <form className="auth-form signup-form" onSubmit={onSubmit} noValidate>
                {error ? <p className="error-banner" role="alert">{error}</p> : null}
                {success ? <p className="success-banner" role="status">{success}</p> : null}

                <div className="signup-two-up">
                    <label className="field">
                        <span>Full Name <em>*</em></span>
                        <input type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="John Doe" required autoComplete="name" />
                    </label>

                    <label className="field">
                        <span>Work email <em>*</em></span>
                        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="john.doe@example.com" required autoComplete="email" />
                    </label>
                </div>

                <label className="field">
                    <span>Password <em>*</em></span>
                    <div className="auth-password-control">
                        <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" required autoComplete="new-password" />
                        <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                            <img src="/assets/password-visibility.svg" alt="" aria-hidden="true" />
                        </button>
                    </div>
                </label>

                <label className="field">
                    <span>Confirm Password <em>*</em></span>
                    <div className="auth-password-control">
                        <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" required autoComplete="new-password" />
                        <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                            <img src="/assets/password-visibility.svg" alt="" aria-hidden="true" />
                        </button>
                    </div>
                </label>

                <button className="primary-button" type="submit" disabled={isSubmitting || !displayName || !email || !password || !confirmPassword}>
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>

                <div className="auth-divider"><span>Or Continue With</span></div>

                <button type="button" className="secondary-button google-button">Sign in with Google</button>

                <p className="auth-signup-text">
                    Already have an account? <Link href="/login" className="auth-link">Log in</Link>
                </p>
            </form>
        </AuthLayout>
    );
}
