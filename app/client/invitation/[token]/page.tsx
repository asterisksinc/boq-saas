"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { ClientAuthLayout } from "@/components/client/ClientAuthLayout";
import {
    inspectClientInvite,
    acceptClientInvite,
    type ClientInvitationDetails,
} from "@/lib/api/client";

export default function ClientInvitationPage() {
    const params = useParams<{ token: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [invite, setInvite] = useState<ClientInvitationDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isExpired, setIsExpired] = useState(false);
    const [isRevoked, setIsRevoked] = useState(false);
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
            setIsExpired(false);
            setIsRevoked(false);

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
                if (inviteData.status === "expired" || (inviteData.expiresAt && new Date(inviteData.expiresAt).getTime() <= Date.now())) {
                    setIsExpired(true);
                } else if (inviteData.status === "revoked") {
                    setIsRevoked(true);
                }
            } catch (err: any) {
                const msg = err.message || "Failed to load invitation. The link may be invalid or expired.";
                setError(msg);
                if (/expired/i.test(msg)) {
                    setIsExpired(true);
                } else if (/revoked/i.test(msg)) {
                    setIsRevoked(true);
                }
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
            setError(null);
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

    // Dynamic description text matching Figma reference:
    // "Alex Morgan from Meridian Build Co. has invited you to collaborate on this project."
    const descriptionText = (() => {
        if (!invite) return "";
        if (invite.inviterName && invite.companyName) {
            return `${invite.inviterName} from ${invite.companyName} has invited you to collaborate on this project.`;
        }
        if (invite.inviterName) {
            return `${invite.inviterName} has invited you to collaborate on this project.`;
        }
        if (invite.companyName) {
            return `${invite.companyName} has invited you to collaborate on this project.`;
        }
        return "You have been invited to collaborate on this project.";
    })();

    return (
        <ClientAuthLayout>
            {loading ? (
                /* 1. Loading State */
                <div className="client-invite-frame">
                    <div className="client-invite-header-group">
                        <div className="client-invite-logo-wrap">
                            <Image
                                src="/assets/boq-logo-small.svg"
                                alt="BOQ"
                                width={32}
                                height={32}
                                className="client-invite-logo"
                                priority
                            />
                        </div>
                        <div className="client-invite-title-block">
                            <p className="client-invite-eyebrow">PROJECT INVITATION</p>
                        </div>
                    </div>
                    <div className="client-invite-loading-box">
                        <Loader2 className="animate-spin" size={32} color="#2563EB" />
                        <p className="client-invite-status-copy">Validating your project invitation...</p>
                    </div>
                </div>
            ) : isRevoked ? (
                /* 2. Revoked State */
                <div className="client-invite-frame">
                    <div className="client-invite-header-group">
                        <div className="client-invite-logo-wrap">
                            <Image
                                src="/assets/boq-logo-small.svg"
                                alt="BOQ"
                                width={32}
                                height={32}
                                className="client-invite-logo"
                                priority
                            />
                        </div>
                        <div className="client-invite-title-block">
                            <p className="client-invite-eyebrow">PROJECT INVITATION</p>
                            <div className="client-invite-text-block">
                                <h1 className="client-invite-heading">Invitation Revoked</h1>
                                <p className="client-invite-description">
                                    This invitation has been revoked by the project team. If you believe this is an error, please contact your project manager.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="client-invite-buttons">
                        <Link href="/login" className="client-invite-btn-secondary">
                            Return to Sign In
                        </Link>
                    </div>
                </div>
            ) : isExpired ? (
                /* 3. Expired State */
                <div className="client-invite-frame">
                    <div className="client-invite-header-group">
                        <div className="client-invite-logo-wrap">
                            <Image
                                src="/assets/boq-logo-small.svg"
                                alt="BOQ"
                                width={32}
                                height={32}
                                className="client-invite-logo"
                                priority
                            />
                        </div>
                        <div className="client-invite-title-block">
                            <p className="client-invite-eyebrow">PROJECT INVITATION</p>
                            <div className="client-invite-text-block">
                                <h1 className="client-invite-heading">Invitation Expired</h1>
                                <p className="client-invite-description">
                                    {invite?.projectName
                                        ? `This invitation to collaborate on ${invite.projectName} has expired. Please contact ${invite.inviterName || invite.companyName || "the project team"} to request a new invitation.`
                                        : "This invitation link has expired. Please contact the project administrator to request a new invitation."}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="client-invite-buttons">
                        <Link href="/login" className="client-invite-btn-primary">
                            Sign In to Existing Account
                        </Link>
                    </div>
                </div>
            ) : error && !invite ? (
                /* 4. Invalid or Not Found State */
                <div className="client-invite-frame">
                    <div className="client-invite-header-group">
                        <div className="client-invite-logo-wrap">
                            <Image
                                src="/assets/boq-logo-small.svg"
                                alt="BOQ"
                                width={32}
                                height={32}
                                className="client-invite-logo"
                                priority
                            />
                        </div>
                        <div className="client-invite-title-block">
                            <p className="client-invite-eyebrow">PROJECT INVITATION</p>
                            <div className="client-invite-text-block">
                                <h1 className="client-invite-heading">Invitation Not Available</h1>
                                <p className="client-invite-description">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="client-invite-buttons">
                        <Link href="/login" className="client-invite-btn-primary">
                            Return to Sign In
                        </Link>
                    </div>
                </div>
            ) : invite?.status === "accepted" ? (
                /* 5. Already Accepted State */
                <div className="client-invite-frame">
                    <div className="client-invite-header-group">
                        <div className="client-invite-logo-wrap">
                            <Image
                                src="/assets/boq-logo-small.svg"
                                alt="BOQ"
                                width={32}
                                height={32}
                                className="client-invite-logo"
                                priority
                            />
                        </div>
                        <div className="client-invite-title-block">
                            <p className="client-invite-eyebrow">PROJECT INVITATION</p>
                            <div className="client-invite-text-block">
                                <h1 className="client-invite-heading">Invitation Already Accepted</h1>
                                <p className="client-invite-description">
                                    This invitation for {invite.projectName} has already been accepted. You can view your project workspace in the client dashboard.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="client-invite-buttons">
                        <Link href="/client/dashboard" className="client-invite-btn-primary">
                            Go to Client Dashboard
                        </Link>
                        <Link href="/login" className="client-invite-btn-secondary">
                            Sign In with Different Account
                        </Link>
                    </div>
                </div>
            ) : invite ? (
                /* 6. Active Valid Invitation State (Figma Frame 21) */
                <div className="client-invite-frame">
                    {/* Frame 3 (Logo & Header group) */}
                    <div className="client-invite-header-group">
                        {/* Logo: 32 x 32 px */}
                        <div className="client-invite-logo-wrap">
                            <Image
                                src="/assets/boq-logo-small.svg"
                                alt="BOQ"
                                width={32}
                                height={32}
                                className="client-invite-logo"
                                priority
                            />
                        </div>

                        {/* Frame 2147225498 */}
                        <div className="client-invite-title-block">
                            {/* PROJECT INVITATION */}
                            <p className="client-invite-eyebrow">PROJECT INVITATION</p>

                            {/* Frame 3 (Heading + Description) */}
                            <div className="client-invite-text-block">
                                {/* You're invited to [Project Name] */}
                                <h1 className="client-invite-heading">
                                    You&apos;re invited to {invite.projectName}
                                </h1>

                                {/* Dynamic Description */}
                                <p className="client-invite-description">
                                    {descriptionText}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Account mismatch notice */}
                    {mismatchedAccount && currentUser && (
                        <div className="client-invite-alert-warning" role="alert">
                            <AlertCircle size={18} className="client-alert-icon" />
                            <div>
                                You are currently signed in as <strong>{currentUser.email}</strong>, but this invitation was sent to <strong>{invite.email}</strong>. Please switch accounts or sign out to continue.
                            </div>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="client-invite-alert-error" role="alert">
                            <AlertCircle size={18} className="client-alert-icon" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Frame 2147225499 (Buttons) */}
                    <div className="client-invite-buttons">
                        {/* Accept Invitation */}
                        <button
                            type="button"
                            onClick={handleAccept}
                            disabled={submitting}
                            className="client-invite-btn-primary"
                            aria-label="Accept Invitation"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                                    <span>Accepting Invitation...</span>
                                </>
                            ) : (
                                <span>Accept Invitation</span>
                            )}
                        </button>

                        {/* Sign In */}
                        <Link
                            href={`/login?next=${encodeURIComponent(`/client/invitation/${token}`)}`}
                            className="client-invite-btn-secondary"
                            aria-label="Sign In"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            ) : null}
        </ClientAuthLayout>
    );
}
