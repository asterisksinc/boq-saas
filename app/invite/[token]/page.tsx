"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function InviteRedirectPage() {
    const params = useParams<{ token: string }>();
    const router = useRouter();

    useEffect(() => {
        if (params?.token) {
            router.replace(`/client/invitation/${encodeURIComponent(params.token)}`);
        }
    }, [params, router]);

    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#F2F3F2",
            }}
        >
            <div style={{ textAlign: "center" }}>
                <Loader2 className="animate-spin" size={32} color="#2563EB" style={{ margin: "0 auto 12px auto" }} />
                <p style={{ color: "#64748B", fontSize: "14px" }}>Redirecting to project invitation...</p>
            </div>
        </div>
    );
}
