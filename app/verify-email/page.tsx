"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getApiErrorMessage, resendVerification, verifyEmail, verifyEmailCode } from "@/lib/api/auth";

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="auth-shell" />}>
            <VerifyEmailContent />
        </Suspense>
    );
}

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = useMemo(() => searchParams.get("code") ?? "", [searchParams]);
    const tokenHash = useMemo(() => searchParams.get("token_hash") ?? "", [searchParams]);
    const type = useMemo(() => searchParams.get("type") ?? "email", [searchParams]);
    const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));

    useEffect(() => {
        const run = async () => {
            if (!code && !tokenHash) return;

            setStatus("verifying");
            try {
                if (code) {
                    await verifyEmailCode(code);
                } else {
                    await verifyEmail({ tokenHash, type: type as "email" | "signup" | "email_change" });
                }

                setStatus("success");
                setMessage("Your email has been verified. You can continue to the app.");
            } catch (requestError) {
                setStatus("error");
                setMessage(getApiErrorMessage(requestError));
            }
        };

        void run();
    }, [code, tokenHash, type]);

    const onOtpChange = (index: number, value: string) => {
        const next = [...otp];
        const sanitized = value.replace(/\D/g, "").slice(0, 1);
        next[index] = sanitized;
        setOtp(next);

        if (sanitized && index < otp.length - 1) {
            (document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null)?.focus();
        }
    };

    const onVerify = async () => {
        const code = otp.join("");
        if (code.length !== 6) {
            setMessage("Enter the full 6-digit verification code.");
            return;
        }

        setStatus("verifying");
        try {
            await verifyEmailCode(code);
            setStatus("success");
            setMessage("Your email has been verified.");
        } catch (requestError) {
            setStatus("error");
            setMessage(getApiErrorMessage(requestError));
        }
    };

    const onResend = async () => {
        if (!email) {
            setMessage("Enter the email address tied to your account.");
            return;
        }

        try {
            const response = await resendVerification({ email });
            setMessage(response.message || "Verification email sent.");
        } catch (requestError) {
            setMessage(getApiErrorMessage(requestError));
        }
    };

    return (
        <AuthLayout
            title={status === "success" ? "Email verified" : status === "error" ? "Verification issue" : "Check your Email"}
            subtitle={status === "success" ? "Your account is ready to continue." : email ? `Enter the unique code we sent to ${email} below` : "Enter the unique code we sent to your email below"}
            footer={
                <div className="auth-footer-inline">
                    <span>2026 BOQ. All Rights Reserved.</span>
                    <span>Privacy Policy</span>
                    <span>Terms of Service</span>
                </div>
            }
        >
            <div className="auth-form verification-form">
                {status === "success" ? (
                    <div className="auth-success-box compact-box">
                        <div className="auth-success-icon" aria-hidden="true">✓</div>
                        <h3>Email verified</h3>
                        <p>Your email has been verified. You can continue to the app.</p>
                        <button type="button" className="primary-button" onClick={() => router.push("/login")}>Continue</button>
                    </div>
                ) : (
                    <>
                        <div className="otp-grid" aria-label="Verification code">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    className="otp-input"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(event) => onOtpChange(index, event.target.value)}
                                    aria-label={`Digit ${index + 1}`}
                                />
                            ))}
                        </div>

                        <button type="button" className="auth-link-button" onClick={() => onResend()}>
                            Didn&apos;t receive it? Send Again
                        </button>

                        <p className="auth-inline-note">Resend 00:39s</p>

                        {message ? <p className={status === "error" ? "error-banner" : "success-banner"} role="status">{message}</p> : null}

                        <button type="button" className="primary-button" onClick={onVerify}>
                            Verify Code
                        </button>
                    </>
                )}
            </div>
        </AuthLayout>
    );
}
