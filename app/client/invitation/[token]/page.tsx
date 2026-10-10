"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, Loader2, ArrowRight } from "lucide-react";
import { ClientAuthLayout } from "@/components/client/ClientAuthLayout";
import { inspectClientInvite, acceptClientInvite, type ClientInvitationDetails } from "@/lib/api/client";

export default function ClientInvitationPage() {
    const params = useParams<{ token: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [invite, setInvite] = useState<ClientInvitationDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<{ email: string; id: string } | null>(null);
    const [mismatchedAccount, setMismatchedAccount] = useState(false);

    const token = params?.token ? decodeURIComponent(params.token) : "";

    useEffect(() => {
        if (!token) {
            setError("No invitation token was provided.");
            setLoading(false);
            return;
        }

        async function init() {
            setLoading(true);
            setError(null);

            // 1. Check if user is currently signed in
            try {
                const meRes = await fetch("/api/v1/auth/me", { credentials: "include" });
                if (meRes.ok) {
                    const meData = await meRes.json();
                    if (meData.data?.user) {
                        setCurrentUser({
                            email: meData.data.user.email,
                            id: meData.data.user.id,
                        });
                    }
                }
            } catch {
                // Ignore auth error if unauthenticated
            }

            // 2. Inspect invitation token
            try {
                const inviteData = await inspectClientInvite(token);
                setInvite(inviteData);
            } catch (err: any) {
                setError(err.message || "Failed to load invitation. The link may be invalid or expired.");
            } finally {
                setLoading(false);
            }
        }

        init();
    }, [token]);

    // Check account mismatch
    useEffect(() => {
        if (currentUser && invite) {
            if (currentUser.email.toLowerCase() !== invite.email.toLowerCase()) {
                setMismatchedAccount(true);
            } else {
                setMismatchedAccount(false);
            }
        }
    }, [currentUser, invite]);

    async function handleAccept() {
        if (!invite || submitting) return;

        // If mismatched account, prompt to switch
        if (mismatchedAccount) {
            setError(
                `You are currently signed in as ${currentUser?.email}, but this invitation was sent to ${invite.email}. Please sign out or switch accounts to continue.`
            );
            return;
        }

        // If user is signed in with correct account, accept invite directly
        if (currentUser && currentUser.email.toLowerCase() === invite.email.toLowerCase()) {
            setSubmitting(true);
            try {
                const res = await acceptClientInvite(token);
                router.push(
                    `/client/invitation/success?projectId=${encodeURIComponent(res.projectId || invite.projectId)}`
                );
            } catch (err: any) {
                setError(err.message || "Failed to accept invitation.");
                setSubmitting(false);
            }
            return;
        }

        // If not signed in:
        // If they already have an account, direct them to sign in
        if (invite.hasExistingAccount) {
            router.push(`/login?next=${encodeURIComponent(`/client/invitation/${token}`)}`);
            return;
        }

        // If they don't have an account, direct them to account creation
        router.push(`/client/create-account?token=${encodeURIComponent(token)}`);
    }

    return (
        <ClientAuthLayout>
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Loader2
                        className="animate-spin"
                        size={36}
                        color="#2563EB"
                        style={{ margin: "0 auto 16px auto" }}
                    />
                    <h3 style={{ fontSize: "16px", color: "#1E293B", fontWeight: 500 }}>
                        Validating your project invitation...
                    </h3>
                </div>
            ) : error && !invite ? (
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
                        Invitation Not Available
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
            ) : invite?.status === "accepted" ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "16px",
                            backgroundColor: "#ECFDF5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px auto",
                        }}
                    >
                        <CheckCircle2 size={28} color="#059669" />
                    </div>
                    <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>
                        Invitation Already Accepted
                    </h2>
                    <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6, marginBottom: "28px" }}>
                        This invitation for <strong>{invite.projectName}</strong> has already been accepted.
                        You can sign in to view your project dashboard.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <Link
                            href="/client/dashboard"
                            style={{
                                display: "inline-block",
                                padding: "14px 24px",
                                borderRadius: "10px",
                                backgroundColor: "#2563EB",
                                color: "#ffffff",
                                fontWeight: 600,
                                fontSize: "14px",
                                textDecoration: "none",
                                textAlign: "center",
                            }}
                        >
                            Go to Client Dashboard
                        </Link>
                        <Link
                            href="/login"
                            style={{
                                display: "inline-block",
                                padding: "12px 24px",
                                borderRadius: "10px",
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#ffffff",
                                color: "#334155",
                                fontWeight: 600,
                                fontSize: "14px",
                                textDecoration: "none",
                                textAlign: "center",
                            }}
                        >
                            Sign In with Different Account
                        </Link>
                    </div>
                </div>
            ) : invite?.status === "expired" ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "16px",
                            backgroundColor: "#FFFBEB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px auto",
                        }}
                    >
                        <Clock size={28} color="#D97706" />
                    </div>
                    <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>
                        Invitation Expired
                    </h2>
                    <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6, marginBottom: "28px" }}>
                        This invitation link for <strong>{invite.projectName}</strong> expired on{" "}
                        {new Date(invite.expiresAt).toLocaleDateString()}. Please contact{" "}
                        <strong>{invite.inviterName || "the project manager"}</strong> to request a new invitation.
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
                        Sign In to Existing Account
                    </Link>
                </div>
            ) : invite ? (
                <div>
                    {/* Top small logo matching screenshot 1 */}
                    <div style={{ marginBottom: "28px" }}>
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
                            marginBottom: "12px",
                        }}
                    >
                        PROJECT INVITATION
                    </div>

                    {/* Main Heading */}
                    <h1
                        style={{
                            fontSize: "28px",
                            fontWeight: 700,
                            color: "#0F172A",
                            lineHeight: 1.25,
                            letterSpacing: "-0.02em",
                            margin: "0 0 16px 0",
                        }}
                    >
                        You&apos;re invited to {invite.projectName}
                    </h1>

                    {/* Subtitle / Description */}
                    <p
                        style={{
                            fontSize: "15px",
                            color: "#475569",
                            lineHeight: 1.6,
                            margin: "0 0 32px 0",
                        }}
                    >
                        {invite.inviterName || "A team member"} has invited you to collaborate on{" "}
                        <strong style={{ color: "#1E293B" }}>{invite.projectName}</strong> by{" "}
                        <strong style={{ color: "#1E293B" }}>{invite.companyName}</strong>. Review project
                        documents, track progress, and communicate with your team.
                    </p>

                    {/* Account mismatch alert if signed in as someone else */}
                    {mismatchedAccount && currentUser && (
                        <div
                            style={{
                                padding: "14px 16px",
                                borderRadius: "10px",
                                backgroundColor: "#FFFBEB",
                                border: "1px solid #FDE68A",
                                color: "#92400E",
                                fontSize: "13px",
                                lineHeight: 1.5,
                                marginBottom: "20px",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "10px",
                            }}
                        >
                            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                            <div>
                                You are signed in as <strong>{currentUser.email}</strong>, but this invitation
                                was sent to <strong>{invite.email}</strong>. Please sign out to accept this invitation
                                with the intended email.
                            </div>
                        </div>
                    )}

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
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <button
                            type="button"
                            onClick={handleAccept}
                            disabled={submitting}
                            style={{
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
                                transition: "all 0.15s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                            }}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span>Accepting Invitation...</span>
                                </>
                            ) : (
                                <>
                                    <span>Accept Invitation</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>

                        <Link
                            href={`/login?next=${encodeURIComponent(`/client/invitation/${token}`)}`}
                            style={{
                                width: "100%",
                                padding: "13px 20px",
                                borderRadius: "10px",
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#ffffff",
                                color: "#1E293B",
                                fontSize: "15px",
                                fontWeight: 600,
                                textDecoration: "none",
                                textAlign: "center",
                                display: "block",
                                boxSizing: "border-box",
                                transition: "all 0.15s ease",
                            }}
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            ) : null}
        </ClientAuthLayout>
    );
}
