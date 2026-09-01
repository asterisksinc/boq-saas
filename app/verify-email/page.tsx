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
    const flow = useMemo(() => searchParams.get("flow") ?? "link", [searchParams]);
    const emailParam = useMemo(() => searchParams.get("email") ?? "", [searchParams]);

    const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState(emailParam);
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const [resendTimer, setResendTimer] = useState(0);
    const [canResend, setCanResend] = useState(true);

    // Auto-verify if code or tokenHash is present (email link flow)
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

    // Countdown timer for resend
    useEffect(() => {
        if (resendTimer <= 0) {
            setCanResend(true);
            return;
        }

        const timer = setInterval(() => {
            setResendTimer((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [resendTimer]);

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
        const otpCode = otp.join("");
        if (otpCode.length !== 6) {
            setMessage("Enter the full 6-digit verification code.");
            return;
        }

        setStatus("verifying");
        try {
            await verifyEmailCode(otpCode, email);
            setStatus("success");
            setMessage("Your email has been verified.");

            // Redirect based on flow
            setTimeout(() => {
                if (flow === "signup") {
                    router.push("/onboarding");
                } else if (flow === "login") {
                    router.push("/dashboard");
                } else {
                    router.push("/login");
                }
            }, 1500);
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

        if (!canResend) {
            return;
        }

        setCanResend(false);
        setResendTimer(60); // 60 second cooldown

        try {
            const response = await resendVerification({ email });
            setMessage(response.message || "Verification code sent.");
        } catch (requestError) {
            setMessage(getApiErrorMessage(requestError));
            setCanResend(true);
            setResendTimer(0);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <AuthLayout
            title={status === "success" ? "Verified" : status === "error" ? "Verification issue" : "Check your Email"}
            subtitle={status === "success" ? "Your account is verified. Redirecting..." : email ? `Enter the unique code we sent to ${email} below` : "Enter the unique code we sent to your email below"}
            iconSrc="/assets/check-email.svg"
            iconAlt="Email verification"
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
                        <p>Your account is ready. Redirecting...</p>
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

                        <div className="otp-actions">
                            <button
                                type="button"
                                className="auth-link-button"
                                disabled={!canResend}
                                onClick={() => onResend()}
                            >
                                Didn&apos;t receive it? Send Again
                            </button>

                            {!canResend && (
                                <p className="auth-inline-note">Resend {formatTime(resendTimer)}</p>
                            )}
                        </div>

                        {message ? <p className={status === "error" ? "error-banner" : "success-banner"} role="status">{message}</p> : null}

                        <button type="button" className="primary-button" onClick={onVerify} disabled={status === "verifying"}>
                            {status === "verifying" ? "Verifying..." : "Verify Code"}
                        </button>
                    </>
                )}
            </div>
        </AuthLayout>
    );
}
