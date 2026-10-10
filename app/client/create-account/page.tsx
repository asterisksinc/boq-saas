"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Lock, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { ClientAuthLayout } from "@/components/client/ClientAuthLayout";
import { inspectClientInvite, registerClientInvite, type ClientInvitationDetails } from "@/lib/api/client";

function CreateAccountContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [invite, setInvite] = useState<ClientInvitationDetails | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("No invitation token found. Please use the link provided in your invitation email.");
            setLoading(false);
            return;
        }

        async function fetchInvite() {
            try {
                const data = await inspectClientInvite(token);
                setInvite(data);
                if (data.clientName) {
                    setFullName(data.clientName);
                }
            } catch (err: any) {
                setError(err.message || "Invalid or expired invitation token.");
            } finally {
                setLoading(false);
            }
        }

        fetchInvite();
    }, [token]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!fullName.trim()) {
            setError("Please enter your full name.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match. Please verify your password.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await registerClientInvite(token, {
                fullName: fullName.trim(),
                email: invite?.email || "",
                password,
                confirmPassword,
            });

            // Store project ID context if available
            const projectId = res.projectId || invite?.projectId || "";
            router.push(`/client/invitation/success?projectId=${encodeURIComponent(projectId)}`);
        } catch (err: any) {
            setError(err.message || "Failed to create account. Please try again.");
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Loader2 className="animate-spin" size={36} color="#2563EB" style={{ margin: "0 auto 16px auto" }} />
                <h3 style={{ fontSize: "16px", color: "#1E293B", fontWeight: 500 }}>
                    Preparing account registration...
                </h3>
            </div>
        );
    }

    if (error && !invite) {
        return (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div
                    style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "16px",
                        backgroundColor: "#FEF2F2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px auto",
                    }}
                >
                    <AlertCircle size={28} color="#EF4444" />
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>
                    Registration Link Invalid
                </h2>
                <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6, marginBottom: "28px" }}>
                    {error}
                </p>
                <Link
                    href="/login"
                    style={{
                        display: "inline-block",
                        padding: "12px 24px",
                        borderRadius: "10px",
                        backgroundColor: "#2563EB",
                        color: "#ffffff",
                        fontWeight: 600,
                        fontSize: "14px",
                        textDecoration: "none",
                    }}
                >
                    Return to Sign In
                </Link>
            </div>
        );
    }

    return (
        <div>
            {/* Top Logo */}
            <div style={{ marginBottom: "24px" }}>
                <div
                    style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        backgroundColor: "#2563EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 10px rgba(37, 99, 235, 0.25)",
                    }}
                >
                    <Image
                        src="/assets/boq-logo-small.svg"
                        alt="BOQ"
                        width={24}
                        height={24}
                        style={{ objectFit: "contain" }}
                    />
                </div>
            </div>

            {/* Uppercase Eyebrow */}
            <div
                style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "#2563EB",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                }}
            >
                CREATE YOUR ACCOUNT
            </div>

            {/* Heading */}
            <h1
                style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#0F172A",
                    lineHeight: 1.25,
                    letterSpacing: "-0.02em",
                    margin: "0 0 8px 0",
                }}
            >
                Set up your client portal
            </h1>

            {/* Subtitle */}
            <p
                style={{
                    fontSize: "14px",
                    color: "#64748B",
                    lineHeight: 1.5,
                    margin: "0 0 24px 0",
                }}
            >
                Enter your details to access your project dashboard and documents for{" "}
                <strong style={{ color: "#1E293B" }}>{invite?.projectName || "your project"}</strong>.
            </p>

            {/* Error banner */}
            {error && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        backgroundColor: "#FEF2F2",
                        border: "1px solid #FCA5A5",
                        color: "#B91C1C",
                        fontSize: "13px",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Email Address (Pre-filled & Read-only) */}
                <div>
                    <label
                        style={{
                            display: "block",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#334155",
                            marginBottom: "6px",
                        }}
                    >
                        Email Address
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type="email"
                            value={invite?.email || ""}
                            readOnly
                            disabled
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "12px 38px 12px 14px",
                                borderRadius: "8px",
                                border: "1px solid #CBD5E1",
                                backgroundColor: "#F8FAFC",
                                color: "#475569",
                                fontSize: "14px",
                                cursor: "not-allowed",
                            }}
                        />
                        <Lock
                            size={16}
                            color="#94A3B8"
                            style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                            }}
                        />
                    </div>
                    <span style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px", display: "block" }}>
                        Bound to your project invitation link
                    </span>
                </div>

                {/* Full Name */}
                <div>
                    <label
                        htmlFor="fullName"
                        style={{
                            display: "block",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#334155",
                            marginBottom: "6px",
                        }}
                    >
                        Full Name
                    </label>
                    <input
                        id="fullName"
                        type="text"
                        required
                        placeholder="e.g. Jane Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "12px 14px",
                            borderRadius: "8px",
                            border: "1px solid #CBD5E1",
                            backgroundColor: "#ffffff",
                            color: "#0F172A",
                            fontSize: "14px",
                            outline: "none",
                            transition: "border-color 0.15s ease",
                        }}
                    />
                </div>

                {/* Password */}
                <div>
                    <label
                        htmlFor="password"
                        style={{
                            display: "block",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#334155",
                            marginBottom: "6px",
                        }}
                    >
                        Password
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "12px 40px 12px 14px",
                                borderRadius: "8px",
                                border: "1px solid #CBD5E1",
                                backgroundColor: "#ffffff",
                                color: "#0F172A",
                                fontSize: "14px",
                                outline: "none",
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                                color: "#64748B",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div>
                    <label
                        htmlFor="confirmPassword"
                        style={{
                            display: "block",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#334155",
                            marginBottom: "6px",
                        }}
                    >
                        Confirm Password
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "12px 40px 12px 14px",
                                borderRadius: "8px",
                                border: "1px solid #CBD5E1",
                                backgroundColor: "#ffffff",
                                color: "#0F172A",
                                fontSize: "14px",
                                outline: "none",
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                                color: "#64748B",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={submitting}
                    style={{
                        marginTop: "8px",
                        width: "100%",
                        padding: "14px 20px",
                        borderRadius: "10px",
                        border: "none",
                        backgroundColor: "#2563EB",
                        color: "#ffffff",
                        fontSize: "15px",
                        fontWeight: 600,
                        cursor: submitting ? "not-allowed" : "pointer",
                        opacity: submitting ? 0.75 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all 0.15s ease",
                    }}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Creating your account...</span>
                        </>
                    ) : (
                        <>
                            <span>Create Account</span>
                            <ArrowRight size={16} />
                        </>
                    )}
                </button>

                {/* Sign In link */}
                <div style={{ textAlign: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "13px", color: "#64748B" }}>
                        Already have an account?{" "}
                        <Link
                            href={`/login?next=${encodeURIComponent(`/client/invitation/${token}`)}`}
                            style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}
                        >
                            Sign In
                        </Link>
                    </span>
                </div>
            </form>
        </div>
    );
}

export default function ClientCreateAccountPage() {
    return (
        <ClientAuthLayout>
            <Suspense
                fallback={
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <Loader2
                            className="animate-spin"
                            size={36}
                            color="#2563EB"
                            style={{ margin: "0 auto 16px auto" }}
                        />
                    </div>
                }
            >
                <CreateAccountContent />
            </Suspense>
        </ClientAuthLayout>
    );
}
