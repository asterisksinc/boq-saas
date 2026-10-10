"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function ClientDashboardRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const query = searchParams?.toString();
        router.replace(`/client/boq${query ? `?${query}` : ""}`);
    }, [router, searchParams]);

    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#F8FAFC",
            }}
        >
            <div style={{ textAlign: "center" }}>
                <Loader2 className="animate-spin" size={36} color="#2563EB" style={{ margin: "0 auto 12px auto" }} />
                <h3 style={{ fontSize: "15px", color: "#1E293B", fontWeight: 600 }}>
                    Opening client workspace...
                </h3>
            </div>
        </div>
    );
}

export default function ClientDashboardPage() {
    return (
        <Suspense fallback={null}>
            <ClientDashboardRedirect />
        </Suspense>
    );
}
