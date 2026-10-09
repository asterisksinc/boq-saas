"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Invite = {
    email: string;
    clientName: string;
    expiresAt: string;
    projectName: string;
};

export default function InvitationPage() {
    const params = useParams<{ token: string }>();
    const router = useRouter();
    const [invite, setInvite] = useState<Invite | null>(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("Checking invitation...");
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        if (!params.token) return;
        fetch(`/api/v1/invitations/${encodeURIComponent(params.token)}`, { credentials: "include" })
            .then(async (response) => {
                const payload = await response.json();
                if (!response.ok) throw new Error(payload.error?.message || "This invitation is not available.");
                setInvite(payload.data?.invitation);
                setMessage("");
            })
            .catch((requestError: Error) => setError(requestError.message));
    }, [params.token]);

    async function accept() {
        setAccepting(true);
        setError("");
        const response = await fetch(`/api/v1/invitations/${encodeURIComponent(params.token)}`, {
            method: "POST",
            credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));
        setAccepting(false);
        if (response.status === 401) {
            router.push(`/login?next=${encodeURIComponent(`/invite/${params.token}`)}`);
            return;
        }
        if (!response.ok) {
            setError(payload.error?.message || "The invitation could not be accepted.");
            return;
        }
        router.push(`/projects/${payload.data.projectId}`);
    }

    return (
        <main style={{ maxWidth: 560, margin: "80px auto", padding: 24 }}>
            <h1>Project invitation</h1>
            {message && <p>{message}</p>}
            {error && <p role="alert">{error}</p>}
            {invite && (
                <>
                    <p><strong>{invite.clientName || invite.email}</strong>, you have been invited to access <strong>{invite.projectName}</strong>.</p>
                    <p>This invitation expires on {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(invite.expiresAt))}.</p>
                    <button type="button" onClick={() => void accept()} disabled={accepting}>
                        {accepting ? "Accepting..." : "Accept invitation"}
                    </button>
                </>
            )}
        </main>
    );
}
